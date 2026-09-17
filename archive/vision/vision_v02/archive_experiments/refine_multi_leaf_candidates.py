from pathlib import Path
import cv2
import numpy as np
import torch

from mobile_sam import sam_model_registry, SamAutomaticMaskGenerator


BASE_DIR = Path(__file__).resolve().parent
RESULTS_DIR = BASE_DIR / "results"
MODEL_PATH = BASE_DIR / "models" / "mobile_sam.pt"

# Polígonos que Ale confirmó que contienen varias hojas
MULTI_LEAF = [
    7
]


# ============================================================
# 1. ENCONTRAR CARPETA DE CANDIDATOS
# ============================================================

candidate_dirs = [
    p for p in RESULTS_DIR.iterdir()
    if p.is_dir() and "candidate" in p.name.lower()
]

if not candidate_dirs:
    raise FileNotFoundError(
        "No encontre la carpeta de candidatos."
    )

CANDIDATES_DIR = candidate_dirs[0]

image_files = sorted([
    p for p in CANDIDATES_DIR.iterdir()
    if p.suffix.lower() in [".jpg", ".jpeg", ".png"]
])

print()
print("=" * 65)
print("ARBORIS - REFINAMIENTO DE SEGMENTOS MULTI-HOJA")
print("=" * 65)

print(f"Candidatos originales: {len(image_files)}")
print(f"Grupos a refinar: {MULTI_LEAF}")


# ============================================================
# 2. CARGAR MOBILE SAM UNA SOLA VEZ
# ============================================================

print()
print("Cargando MobileSAM...")

device = "cuda" if torch.cuda.is_available() else "cpu"

sam = sam_model_registry["vit_t"](
    checkpoint=str(MODEL_PATH)
)

sam.to(device=device)
sam.eval()

mask_generator = SamAutomaticMaskGenerator(
    model=sam,

    # Más puntos que en la segmentación general,
    # porque ahora trabajamos dentro de un recorte pequeño.
    points_per_side=16,

    pred_iou_thresh=0.80,
    stability_score_thresh=0.85,

    crop_n_layers=1,
    crop_n_points_downscale_factor=2,

    min_mask_region_area=80,
)

print(f"Modelo cargado en: {device}")


# ============================================================
# 3. CARPETA DE RESULTADOS
# ============================================================

OUTPUT_DIR = (
    RESULTS_DIR
    / "refined_multi_leaf"
)

OUTPUT_DIR.mkdir(
    exist_ok=True
)


# ============================================================
# 4. FUNCION DE REFINAMIENTO
# ============================================================

def refine_candidate(
    candidate_number,
    image_path
):

    print()
    print("-" * 65)
    print(
        f"Refinando candidato "
        f"{candidate_number}: "
        f"{image_path.name}"
    )

    image_bgr = cv2.imread(
        str(image_path)
    )

    if image_bgr is None:

        print("No pude abrir la imagen.")
        return []

    image_rgb = cv2.cvtColor(
        image_bgr,
        cv2.COLOR_BGR2RGB
    )

    # --------------------------------------------------------
    # MASCARA DEL POLIGONO ORIGINAL
    # --------------------------------------------------------

    gray = cv2.cvtColor(
        image_bgr,
        cv2.COLOR_BGR2GRAY
    )

    _, original_mask = cv2.threshold(
        gray,
        10,
        255,
        cv2.THRESH_BINARY
    )

    contours, _ = cv2.findContours(
        original_mask,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    if not contours:

        print("No encontre poligono.")
        return []

    original_contour = max(
        contours,
        key=cv2.contourArea
    )

    polygon_area = cv2.contourArea(
        original_contour
    )

    # --------------------------------------------------------
    # MOBILE SAM SOBRE EL RECORTE
    # --------------------------------------------------------

    masks = mask_generator.generate(
        image_rgb
    )

    print(
        f"Mascaras SAM generadas: "
        f"{len(masks)}"
    )

    candidates = []

    height, width = gray.shape

    # --------------------------------------------------------
    # EVALUAR SUBMASCARAS
    # --------------------------------------------------------

    for mask_data in masks:

        segmentation = mask_data[
            "segmentation"
        ]

        submask = (
            segmentation.astype(np.uint8)
            * 255
        )

        # Sólo nos interesa lo que está dentro
        # del polígono original.
        submask = cv2.bitwise_and(
            submask,
            original_mask
        )

        area_pixels = np.count_nonzero(
            submask
        )

        if area_pixels < 120:
            continue

        # No queremos una máscara que simplemente
        # vuelva a seleccionar todo el grupo original.
        area_ratio = (
            area_pixels
            / max(
                np.count_nonzero(
                    original_mask
                ),
                1
            )
        )

        if area_ratio > 0.88:
            continue

        # Tampoco fragmentos minúsculos
        if area_ratio < 0.04:
            continue

        sub_contours, _ = cv2.findContours(
            submask,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_NONE
        )

        if not sub_contours:
            continue

        contour = max(
            sub_contours,
            key=cv2.contourArea
        )

        area = cv2.contourArea(
            contour
        )

        if area < 100:
            continue

        rect = cv2.minAreaRect(
            contour
        )

        w, h = rect[1]

        if w <= 0 or h <= 0:
            continue

        major = max(w, h)
        minor = max(
            min(w, h),
            1
        )

        elongation = (
            major / minor
        )

        perimeter = cv2.arcLength(
            contour,
            True
        )

        compactness = (
            4
            * np.pi
            * area
            / (perimeter ** 2)
            if perimeter > 0
            else 0
        )

        # Filtro deliberadamente permisivo.
        # Todavía NO queremos decidir si es hoja.
        if elongation < 1.05:
            continue

        candidates.append({
            "mask": submask,
            "area": area,
            "area_ratio": area_ratio,
            "elongation": elongation,
            "compactness": compactness,
            "stability": mask_data[
                "stability_score"
            ],
            "pred_iou": mask_data[
                "predicted_iou"
            ],
        })

    # --------------------------------------------------------
    # ELIMINAR DUPLICADOS
    # --------------------------------------------------------

    candidates = sorted(
        candidates,
        key=lambda x: x["area"],
        reverse=True
    )

    unique = []

    for candidate in candidates:

        duplicate = False

        mask_a = (
            candidate["mask"] > 0
        )

        for accepted in unique:

            mask_b = (
                accepted["mask"] > 0
            )

            intersection = np.count_nonzero(
                mask_a & mask_b
            )

            union = np.count_nonzero(
                mask_a | mask_b
            )

            iou = (
                intersection / union
                if union > 0
                else 0
            )

            # Si dos máscaras son casi la misma,
            # conservar sólo una.
            if iou > 0.75:

                duplicate = True
                break

        if not duplicate:

            unique.append(
                candidate
            )

    print(
        f"Subsegmentos conservados: "
        f"{len(unique)}"
    )

    return unique


# ============================================================
# 5. PROCESAR LOS NUEVE GRUPOS
# ============================================================

all_results = {}

for number in MULTI_LEAF:

    if number > len(image_files):

        print(
            f"Candidato {number} no existe."
        )
        continue

    image_path = image_files[
        number - 1
    ]

    refined = refine_candidate(
        number,
        image_path
    )

    all_results[number] = {
        "image_path": image_path,
        "segments": refined
    }


# ============================================================
# 6. GUARDAR SUBSEGMENTOS INDIVIDUALES
# ============================================================

for number, data in all_results.items():

    image = cv2.imread(
        str(data["image_path"])
    )

    for sub_index, segment in enumerate(
        data["segments"],
        start=1
    ):

        mask = segment["mask"]

        isolated = cv2.bitwise_and(
            image,
            image,
            mask=mask
        )

        filename = (
            f"candidate_{number:02d}"
            f"_sub_{sub_index:02d}.png"
        )

        cv2.imwrite(
            str(
                OUTPUT_DIR
                / filename
            ),
            isolated
        )


# ============================================================
# 7. CREAR LAMINA DE REVISION
# ============================================================

thumb_w = 180
thumb_h = 180

cards = []

for number, data in all_results.items():

    for sub_index, segment in enumerate(
        data["segments"],
        start=1
    ):

        image = cv2.imread(
            str(data["image_path"])
        )

        mask = segment["mask"]

        isolated = cv2.bitwise_and(
            image,
            image,
            mask=mask
        )

        h, w = isolated.shape[:2]

        scale = min(
            150 / max(w, 1),
            130 / max(h, 1)
        )

        new_w = max(
            1,
            int(w * scale)
        )

        new_h = max(
            1,
            int(h * scale)
        )

        resized = cv2.resize(
            isolated,
            (new_w, new_h),
            interpolation=cv2.INTER_AREA
        )

        card = np.full(
            (
                thumb_h,
                thumb_w,
                3
            ),
            255,
            dtype=np.uint8
        )

        x = (
            thumb_w - new_w
        ) // 2

        y = 28 + (
            130 - new_h
        ) // 2

        card[
            y:y + new_h,
            x:x + new_w
        ] = resized

        cv2.putText(
            card,
            f"{number}.{sub_index}",
            (8, 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (0, 0, 0),
            2,
            cv2.LINE_AA
        )

        cards.append(
            card
        )


if cards:

    cols = 5

    rows = int(
        np.ceil(
            len(cards) / cols
        )
    )

    overview = np.full(
        (
            rows * thumb_h,
            cols * thumb_w,
            3
        ),
        245,
        dtype=np.uint8
    )

    for i, card in enumerate(
        cards
    ):

        row = i // cols
        col = i % cols

        overview[
            row * thumb_h:
            (row + 1) * thumb_h,

            col * thumb_w:
            (col + 1) * thumb_w
        ] = card

    overview_path = (
        RESULTS_DIR
        / "refined_multi_leaf_overview.jpg"
    )

    cv2.imwrite(
        str(overview_path),
        overview
    )

else:

    overview_path = None


# ============================================================
# 8. INFORME
# ============================================================

print()
print("=" * 65)
print("REFINAMIENTO COMPLETADO")
print("=" * 65)

total = sum(
    len(data["segments"])
    for data in all_results.values()
)

print(
    f"Subsegmentos totales: {total}"
)

print()
print(
    "Subsegmentos individuales guardados en:"
)

print(
    OUTPUT_DIR
)

if overview_path:

    print()
    print("Lamina de revision:")
    print(overview_path)

print()
print(
    "Todavia NO estamos diciendo que "
    "cada subsegmento sea una hoja."
)