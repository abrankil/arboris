from pathlib import Path

import cv2
import numpy as np
import torch

from mobile_sam import sam_model_registry, SamAutomaticMaskGenerator
from skimage.morphology import remove_small_objects, skeletonize


# ============================================================
# ÁRBORIS — EVIDENCE SELECTION v0.1
#
# OBJETIVO:
# Encontrar HASTA 5 segmentos con evidencia foliar útil.
#
# Un segmento que no cumple las reglas se descarta.
# No necesitamos clasificar todos los polígonos.
#
# Este módulo NO identifica especies.
# ============================================================


# ============================================================
# CONFIGURACIÓN
# ============================================================

PROJECT_DIR = Path(r"C:\Proyectos\arboris")

IMAGE_PATH = Path(
    r"C:\Proyectos\arboris\species\SP003_kageneckia_oblonga"
    r"\photos\SP003_KO001_fruto_01.jpg"
)

MODEL_PATH = (
    PROJECT_DIR
    / "vision_v02"
    / "models"
    / "mobile_sam.pt"
)

PHOTO_NAME = IMAGE_PATH.stem

OUTPUT_DIR = (
    PROJECT_DIR
    / "vision_v02"
    / "results"
    / "evidence_selection"
    / PHOTO_NAME
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)

OUTPUT_PATH = (
    OUTPUT_DIR
    / "botanical_evidence.jpg"
)

MAX_EVIDENCE = 5

# MobileSAM
POINTS_PER_SIDE = 16

# ------------------------------------------------------------
# REGLAS MÍNIMAS DE ACEPTACIÓN
# ------------------------------------------------------------

MIN_AREA_FRACTION = 0.002
MAX_AREA_FRACTION = 0.65

MIN_MAIN_SPAN = 0.20
MIN_BRANCHES = 2

# IMPORTANTE:
# El ranking anterior dejaba entrar cualquier candidato que
# pasara las reglas geométricas.
#
# Ahora además debe superar un mínimo de utilidad.
#
# El Top 5 NO obliga a completar cinco.
# ------------------------------------------------------------

MIN_UTILITY = 0.70

DEVICE = (
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)


# ============================================================
# CARGAR FOTO
# ============================================================

image_bgr = cv2.imread(
    str(IMAGE_PATH)
)

if image_bgr is None:
    raise FileNotFoundError(
        f"No pude abrir la foto:\n{IMAGE_PATH}"
    )

image_rgb = cv2.cvtColor(
    image_bgr,
    cv2.COLOR_BGR2RGB
)

H, W = image_bgr.shape[:2]
IMAGE_AREA = H * W


print()
print("=" * 68)
print("ÁRBORIS — EVIDENCE SELECTION v0.1")
print("=" * 68)

print()
print("Foto:")
print(IMAGE_PATH)

print()
print(f"Dispositivo: {DEVICE}")


# ============================================================
# MOBILE SAM
# ============================================================

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"No encontré MobileSAM:\n{MODEL_PATH}"
    )

print()
print("Cargando MobileSAM...")


sam = sam_model_registry["vit_t"](
    checkpoint=str(MODEL_PATH)
)

sam.to(device=DEVICE)
sam.eval()


generator = SamAutomaticMaskGenerator(
    model=sam,
    points_per_side=POINTS_PER_SIDE,
    pred_iou_thresh=0.86,
    stability_score_thresh=0.90,
    crop_n_layers=0,
    min_mask_region_area=100,
)


print("Segmentando la foto...")


with torch.no_grad():

    sam_masks = generator.generate(
        image_rgb
    )


print(
    f"Segmentos generados: {len(sam_masks)}"
)


# ============================================================
# FILTRO RÁPIDO
#
# Sólo elimina regiones que claramente no vale la pena
# analizar.
# ============================================================

def basic_filter(mask_data):

    area = int(
        mask_data["area"]
    )

    fraction = (
        area / IMAGE_AREA
    )

    if fraction < MIN_AREA_FRACTION:
        return False

    if fraction > MAX_AREA_FRACTION:
        return False

    x, y, w, h = [
        int(v)
        for v in mask_data["bbox"]
    ]

    if w < 25 or h < 25:
        return False

    return True


candidates = [
    mask_data
    for mask_data in sam_masks
    if basic_filter(mask_data)
]


print(
    f"Candidatos tras filtro rápido: {len(candidates)}"
)


# ============================================================
# PREPARAR SEGMENTO
# ============================================================

def prepare_segment(mask_data):

    full_mask = (
        mask_data["segmentation"]
        .astype(bool)
    )

    x, y, w, h = [
        int(v)
        for v in mask_data["bbox"]
    ]

    x1 = max(x, 0)
    y1 = max(y, 0)

    x2 = min(
        x + w,
        W
    )

    y2 = min(
        y + h,
        H
    )

    if x2 <= x1 or y2 <= y1:
        return None

    crop = image_bgr[
        y1:y2,
        x1:x2
    ].copy()

    local_mask = full_mask[
        y1:y2,
        x1:x2
    ]

    mask_u8 = (
        local_mask.astype(np.uint8)
        * 255
    )

    contours, _ = cv2.findContours(
        mask_u8,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_NONE
    )

    if not contours:
        return None

    contour = max(
        contours,
        key=cv2.contourArea
    )

    if cv2.contourArea(contour) < 100:
        return None

    isolated = np.zeros_like(
        crop
    )

    isolated[
        local_mask
    ] = crop[
        local_mask
    ]

    return {
        "image": isolated,
        "mask": mask_u8,
        "contour": contour,
        "full_mask": full_mask,
        "bbox": (
            x1,
            y1,
            x2 - x1,
            y2 - y1
        ),
    }


# ============================================================
# EXTRAER RED INTERNA
#
# Buscamos estructura interna aprovechable.
# No estamos identificando todavía una especie.
# ============================================================

def extract_network(
    segment_image,
    segment_mask
):

    if (
        segment_image.shape[0] < 25
        or segment_image.shape[1] < 25
    ):
        return None

    lab = cv2.cvtColor(
        segment_image,
        cv2.COLOR_BGR2LAB
    )

    lightness = lab[:, :, 0]

    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe.apply(
        lightness
    )

    background = cv2.GaussianBlur(
        enhanced,
        (0, 0),
        sigmaX=15,
        sigmaY=15
    )

    response = cv2.subtract(
        enhanced,
        background
    )

    # Evitar que el borde de la máscara se confunda
    # con estructura interna.
    safe_inner = cv2.erode(
        segment_mask,
        np.ones(
            (11, 11),
            np.uint8
        ),
        iterations=1
    )

    if (
        np.count_nonzero(
            safe_inner
        )
        < 100
    ):
        return None

    values = response[
        safe_inner > 0
    ]

    if len(values) == 0:
        return None

    threshold = np.percentile(
        values,
        78
    )

    binary = (
        (
            (response >= threshold)
            & (safe_inner > 0)
        )
        .astype(np.uint8)
        * 255
    )

    cleaned = remove_small_objects(
        binary > 0,
        max_size=24,
        connectivity=2
    )

    cleaned = (
        cleaned.astype(np.uint8)
        * 255
    )

    cleaned = cv2.morphologyEx(
        cleaned,
        cv2.MORPH_CLOSE,
        np.ones(
            (3, 3),
            np.uint8
        )
    )

    cleaned = remove_small_objects(
        cleaned > 0,
        max_size=29,
        connectivity=2
    )

    cleaned = (
        cleaned.astype(np.uint8)
        * 255
    )

    skeleton = (
        skeletonize(
            cleaned > 0
        )
        .astype(np.uint8)
        * 255
    )

    if (
        np.count_nonzero(
            skeleton
        )
        < 20
    ):
        return None

    distance = cv2.distanceTransform(
        cleaned,
        cv2.DIST_L2,
        5
    )

    return {
        "skeleton": skeleton,
        "distance": distance,
    }


# ============================================================
# EJE LONGITUDINAL PLAUSIBLE
# ============================================================

def find_main_axis(
    skeleton,
    distance,
    contour
):

    rect = cv2.minAreaRect(
        contour
    )

    rw, rh = rect[1]

    major_length = max(
        rw,
        rh
    )

    if major_length <= 0:
        return None

    thickness_values = distance[
        skeleton > 0
    ]

    if len(thickness_values) == 0:
        return None

    thickness_threshold = np.percentile(
        thickness_values,
        70
    )

    thick = np.zeros_like(
        skeleton
    )

    thick[
        (skeleton > 0)
        & (
            distance
            >= thickness_threshold
        )
    ] = 255

    region = cv2.dilate(
        thick,
        np.ones(
            (7, 7),
            np.uint8
        ),
        iterations=2
    )

    (
        n_labels,
        labels,
        stats,
        _
    ) = cv2.connectedComponentsWithStats(
        region,
        connectivity=8
    )

    best = None
    best_score = 0.0

    for label in range(
        1,
        n_labels
    ):

        if (
            stats[
                label,
                cv2.CC_STAT_AREA
            ]
            < 20
        ):
            continue

        ys, xs = np.where(
            (labels == label)
            & (skeleton > 0)
        )

        if len(xs) < 10:
            continue

        points = np.column_stack(
            (xs, ys)
        ).astype(
            np.float32
        )

        (
            mean,
            eigenvectors,
            _
        ) = cv2.PCACompute2(
            points,
            mean=None
        )

        center = mean[0]

        axis = eigenvectors[0]

        axis = (
            axis
            / (
                np.linalg.norm(axis)
                + 1e-8
            )
        )

        projection = (
            points - center
        ) @ axis

        pmin = float(
            projection.min()
        )

        pmax = float(
            projection.max()
        )

        span = (
            pmax - pmin
        )

        span_ratio = (
            span
            / major_length
        )

        mean_thickness = float(
            np.mean(
                distance[
                    ys,
                    xs
                ]
            )
        )

        p1 = (
            center
            + axis * pmin
        )

        p2 = (
            center
            + axis * pmax
        )

        score = (
            span_ratio
            * np.sqrt(
                max(
                    mean_thickness,
                    0.01
                )
            )
        )

        if score > best_score:

            best_score = score

            best = {
                "p1": p1,
                "p2": p2,
                "span_ratio": float(
                    span_ratio
                ),
                "thickness": float(
                    mean_thickness
                ),
            }

    return best


# ============================================================
# RAMIFICACIONES ASOCIADAS
# ============================================================

def count_branches(
    skeleton,
    main
):

    if main is None:
        return 0

    main_mask = np.zeros_like(
        skeleton
    )

    cv2.line(
        main_mask,
        tuple(
            np.int32(
                main["p1"]
            )
        ),
        tuple(
            np.int32(
                main["p2"]
            )
        ),
        255,
        9
    )

    connection_zone = cv2.dilate(
        main_mask,
        np.ones(
            (7, 7),
            np.uint8
        )
    )

    remainder = (
        skeleton.copy()
    )

    remainder[
        main_mask > 0
    ] = 0

    (
        n_labels,
        labels,
        stats,
        _
    ) = cv2.connectedComponentsWithStats(
        remainder,
        connectivity=8
    )

    branches = 0

    for label in range(
        1,
        n_labels
    ):

        if (
            stats[
                label,
                cv2.CC_STAT_AREA
            ]
            < 8
        ):
            continue

        component = (
            labels == label
        )

        component_u8 = (
            component.astype(
                np.uint8
            )
            * 255
        )

        touching = cv2.dilate(
            component_u8,
            np.ones(
                (3, 3),
                np.uint8
            )
        )

        if not np.any(
            (touching > 0)
            & (connection_zone > 0)
        ):
            continue

        ys, xs = np.where(
            component
        )

        if len(xs) < 2:
            continue

        points = np.column_stack(
            (xs, ys)
        ).astype(
            np.float32
        )

        rect = cv2.minAreaRect(
            points
        )

        bw, bh = rect[1]

        if max(bw, bh) < 7:
            continue

        branches += 1

    return branches


# ============================================================
# EVALUAR CANDIDATO
#
# IMPORTANTE:
#
# Aquí se decide si merece entrar al conjunto de evidencia.
#
# Ranking y aceptación son cosas distintas.
# ============================================================

def evaluate_candidate(
    segment
):

    network = extract_network(
        segment["image"],
        segment["mask"]
    )

    if network is None:
        return None

    skeleton = network[
        "skeleton"
    ]

    main = find_main_axis(
        skeleton,
        network["distance"],
        segment["contour"]
    )

    # No encontramos estructura longitudinal útil.
    if main is None:
        return None

    # Demasiado corta respecto del segmento.
    if (
        main["span_ratio"]
        < MIN_MAIN_SPAN
    ):
        return None

    branches = count_branches(
        skeleton,
        main
    )

    # Sin organización secundaria suficiente.
    if branches < MIN_BRANCHES:
        return None

    if len(
        segment["contour"]
    ) < 30:
        return None

    mask_area = max(
        np.count_nonzero(
            segment["mask"]
        ),
        1
    )

    network_density = (
        np.count_nonzero(
            skeleton
        )
        / mask_area
    )

    # --------------------------------------------------------
    # PUNTAJE DE UTILIDAD
    #
    # Sólo ordena los candidatos que ya tienen evidencia.
    # --------------------------------------------------------

    network_score = min(
        network_density / 0.06,
        1.0
    )

    span_score = min(
        main["span_ratio"] / 0.90,
        1.0
    )

    branch_score = min(
        branches / 10.0,
        1.0
    )

    area_fraction = (
        mask_area
        / IMAGE_AREA
    )

    size_score = min(
        area_fraction / 0.08,
        1.0
    )

    utility = (
        0.35 * span_score
        + 0.30 * network_score
        + 0.25 * branch_score
        + 0.10 * size_score
    )

    # --------------------------------------------------------
    # REGLA NUEVA:
    #
    # NO entra simplemente porque necesitamos completar 5.
    # --------------------------------------------------------

    if utility < MIN_UTILITY:
        return None

    return {
        **segment,
        "utility": float(
            utility
        ),
        "branches": branches,
    }


# ============================================================
# BUSCAR EVIDENCIA
# ============================================================

useful = []

print()
print("Buscando evidencia foliar útil...")


for mask_data in candidates:

    segment = prepare_segment(
        mask_data
    )

    if segment is None:
        continue

    result = evaluate_candidate(
        segment
    )

    # Si no cumple las reglas, desaparece del proceso.
    if result is None:
        continue

    useful.append(
        result
    )


# ============================================================
# ORDENAR
#
# HASTA 5.
# NO EXACTAMENTE 5.
# ============================================================

useful.sort(
    key=lambda item:
    item["utility"],
    reverse=True
)

selected = useful[
    :MAX_EVIDENCE
]


print()
print(
    f"Evidencias que aprobaron: {len(useful)}"
)

print(
    f"Evidencias que mostraremos: {len(selected)}"
)


# ============================================================
# CASO 0
#
# Cero es un resultado perfectamente válido.
# ============================================================

if len(selected) == 0:

    print()
    print(
        "No se encontró evidencia foliar "
        "suficientemente útil."
    )

    print(
        "La fotografía debería complementarse "
        "con otra toma."
    )

    raise SystemExit(0)


# ============================================================
# FOTO ORIGINAL CON CONTORNOS ROJOS
# ============================================================

original_marked = (
    image_bgr.copy()
)


for rank, item in enumerate(
    selected,
    start=1
):

    full_mask_u8 = (
        item["full_mask"]
        .astype(np.uint8)
        * 255
    )

    contours, _ = cv2.findContours(
        full_mask_u8,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    cv2.drawContours(
        original_marked,
        contours,
        -1,
        (0, 0, 255),
        4
    )

    x, y, w, h = item[
        "bbox"
    ]

    cv2.putText(
        original_marked,
        str(rank),
        (
            x + 5,
            max(
                y + 25,
                25
            )
        ),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (0, 0, 255),
        2,
        cv2.LINE_AA
    )


# ============================================================
# PANEL IZQUIERDO
# ============================================================

LEFT_W = 700
FINAL_H = 850

left_panel = np.full(
    (
        FINAL_H,
        LEFT_W,
        3
    ),
    245,
    dtype=np.uint8
)

max_photo_w = (
    LEFT_W - 40
)

max_photo_h = (
    FINAL_H - 80
)

scale = min(
    max_photo_w / W,
    max_photo_h / H,
    1.0
)

display_w = max(
    int(W * scale),
    1
)

display_h = max(
    int(H * scale),
    1
)

display_photo = cv2.resize(
    original_marked,
    (
        display_w,
        display_h
    ),
    interpolation=cv2.INTER_AREA
)

photo_x = (
    LEFT_W - display_w
) // 2

photo_y = (
    FINAL_H - display_h
) // 2

left_panel[
    photo_y:photo_y + display_h,
    photo_x:photo_x + display_w
] = display_photo


cv2.putText(
    left_panel,
    "FOTO ORIGINAL",
    (20, 30),
    cv2.FONT_HERSHEY_SIMPLEX,
    0.70,
    (0, 0, 0),
    2,
    cv2.LINE_AA
)


# ============================================================
# TARJETAS DE LOS SEGMENTOS
# ============================================================

CARD_W = 360
CARD_H = 400

cards = []


for rank, item in enumerate(
    selected,
    start=1
):

    segment = (
        item["image"].copy()
    )

    # Borde rojo del segmento aislado.
    cv2.drawContours(
        segment,
        [item["contour"]],
        -1,
        (0, 0, 255),
        3
    )

    card = np.full(
        (
            CARD_H,
            CARD_W,
            3
        ),
        245,
        dtype=np.uint8
    )

    sh, sw = segment.shape[:2]

    segment_scale = min(
        330 / max(sw, 1),
        320 / max(sh, 1)
    )

    new_w = max(
        int(sw * segment_scale),
        1
    )

    new_h = max(
        int(sh * segment_scale),
        1
    )

    resized = cv2.resize(
        segment,
        (
            new_w,
            new_h
        ),
        interpolation=cv2.INTER_AREA
    )

    px = (
        CARD_W - new_w
    ) // 2

    py = (
        40
        + (
            320 - new_h
        ) // 2
    )

    card[
        py:py + new_h,
        px:px + new_w
    ] = resized


    cv2.putText(
        card,
        f"TOP {rank}",
        (10, 27),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (0, 0, 0),
        2,
        cv2.LINE_AA
    )


    cv2.putText(
        card,
        (
            f"utilidad "
            f"{item['utility']:.3f}"
        ),
        (
            10,
            CARD_H - 15
        ),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.45,
        (50, 50, 50),
        1,
        cv2.LINE_AA
    )

    cards.append(
        card
    )


# ============================================================
# PANEL DERECHO
#
# El tamaño depende de cuántos segmentos realmente aprobaron.
# ============================================================

if len(cards) <= 3:
    rows = 1
else:
    rows = 2

columns = min(
    3,
    len(cards)
)

RIGHT_W = (
    CARD_W * 3
)

right_panel = np.full(
    (
        FINAL_H,
        RIGHT_W,
        3
    ),
    235,
    dtype=np.uint8
)


for index, card in enumerate(
    cards
):

    if index < 3:

        row = 0
        col = index

    else:

        row = 1
        col = index - 3

    x = (
        col * CARD_W
    )

    y = (
        row * CARD_H
    )

    right_panel[
        y:y + CARD_H,
        x:x + CARD_W
    ] = card


# ============================================================
# RESULTADO FINAL
# ============================================================

final = np.hstack(
    (
        left_panel,
        right_panel
    )
)


if not cv2.imwrite(
    str(OUTPUT_PATH),
    final
):

    raise RuntimeError(
        "No pude guardar la imagen final."
    )


# ============================================================
# RESUMEN
# ============================================================

print()
print("=" * 68)
print("LISTO")
print("=" * 68)

print()
print("Resultado:")
print(OUTPUT_PATH)

print()

for rank, item in enumerate(
    selected,
    start=1
):

    print(
        f"TOP {rank}: "
        f"utilidad={item['utility']:.3f} | "
        f"ramas={item['branches']}"
    )

print()
print(
    f"Se mostraron {len(selected)} de un máximo de "
    f"{MAX_EVIDENCE} evidencias."
)