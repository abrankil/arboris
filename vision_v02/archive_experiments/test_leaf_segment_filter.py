from pathlib import Path

import cv2
import numpy as np
from skimage.morphology import remove_small_objects, skeletonize


BASE_DIR = Path(__file__).resolve().parent
RESULTS_DIR = BASE_DIR / "results"

INPUT_DIR = RESULTS_DIR / "refined_multi_leaf"

OUTPUT_DIR = RESULTS_DIR / "leaf_segment_filter_test"
OUTPUT_DIR.mkdir(exist_ok=True)


# ============================================================
# PARAMETROS DE LA PRIMERA PRUEBA
# ============================================================

MIN_NETWORK_PIXELS = 20

# Una nervadura principal debe ocupar una fracción
# razonable del segmento, pero NO necesita llegar al ápice.
MIN_MAIN_SPAN_RATIO = 0.20

MIN_MAIN_THICKNESS = 1.40

# Una hoja útil debe mostrar al menos algunas
# secundarias conectadas a la central.
MIN_SECONDARY_BRANCHES = 2

# Si encontramos más de una arquitectura principal
# fuerte, no descartamos: pedimos refinamiento.
MULTI_MAIN_MIN_RATIO = 0.55


# ============================================================
# 1. BUSCAR SUBSEGMENTOS
# ============================================================

image_files = sorted([
    p for p in INPUT_DIR.iterdir()
    if p.suffix.lower() in [".jpg", ".jpeg", ".png"]
    and "_mask" not in p.name
])

if not image_files:
    raise FileNotFoundError(
        "No encontre subsegmentos en refined_multi_leaf."
    )

print()
print("=" * 65)
print("ARBORIS - FILTRO DE SEGMENTOS FOLIARES")
print("=" * 65)
print(f"Subsegmentos encontrados: {len(image_files)}")


# ============================================================
# 2. EXTRAER MASCARA DEL SEGMENTO
# ============================================================

def get_segment_mask(image):

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    _, mask = cv2.threshold(
        gray,
        10,
        255,
        cv2.THRESH_BINARY
    )

    contours, _ = cv2.findContours(
        mask,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_NONE
    )

    if not contours:
        return None, None

    contour = max(
        contours,
        key=cv2.contourArea
    )

    clean_mask = np.zeros_like(mask)

    cv2.drawContours(
        clean_mask,
        [contour],
        -1,
        255,
        cv2.FILLED
    )

    return clean_mask, contour


# ============================================================
# 3. MAPA DE NERVADURAS
# ============================================================

def extract_veins(image, leaf_mask):

    inner_mask = cv2.erode(
        leaf_mask,
        np.ones((9, 9), np.uint8),
        iterations=1
    )

    if np.count_nonzero(inner_mask) == 0:
        return None

    lab = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2LAB
    )

    L, A, B = cv2.split(lab)

    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe.apply(L)

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

    response[inner_mask == 0] = 0

    response = cv2.GaussianBlur(
        response,
        (3, 3),
        0
    )

    values = response[
        inner_mask > 0
    ]

    if len(values) == 0:
        return None

    threshold = np.percentile(
        values,
        78
    )

    binary = np.zeros_like(response)

    binary[
        (response >= threshold)
        & (inner_mask > 0)
    ] = 255

    # --------------------------------------------
    # LIMPIEZA QUE YA NOS FUNCIONO
    # --------------------------------------------

    clean_bool = remove_small_objects(
        binary > 0,
        min_size=25,
        connectivity=2
    )

    clean = (
        clean_bool.astype(np.uint8)
        * 255
    )

    clean = cv2.morphologyEx(
        clean,
        cv2.MORPH_CLOSE,
        np.ones((3, 3), np.uint8),
        iterations=1
    )

    clean_bool = remove_small_objects(
        clean > 0,
        min_size=30,
        connectivity=2
    )

    clean = (
        clean_bool.astype(np.uint8)
        * 255
    )

    # Alejar el análisis del borde externo.
    safe_inner = cv2.erode(
        leaf_mask,
        np.ones((13, 13), np.uint8),
        iterations=1
    )

    clean = cv2.bitwise_and(
        clean,
        safe_inner
    )

    skeleton_bool = skeletonize(
        clean > 0
    )

    skeleton = (
        skeleton_bool.astype(np.uint8)
        * 255
    )

    distance = cv2.distanceTransform(
        clean,
        cv2.DIST_L2,
        5
    )

    return {
        "response": response,
        "binary": binary,
        "clean": clean,
        "skeleton": skeleton,
        "distance": distance,
    }


# ============================================================
# 4. BUSCAR ESTRUCTURAS PRINCIPALES
# ============================================================

def detect_main_structures(
    skeleton,
    distance,
    polygon_major
):

    skeleton_pixels = np.count_nonzero(
        skeleton
    )

    if skeleton_pixels < MIN_NETWORK_PIXELS:
        return []

    thickness_values = distance[
        skeleton > 0
    ]

    if len(thickness_values) == 0:
        return []

    thickness_threshold = np.percentile(
        thickness_values,
        70
    )

    thick_skeleton = np.zeros_like(
        skeleton
    )

    thick_skeleton[
        (skeleton > 0)
        & (distance >= thickness_threshold)
    ] = 255

    # Sólo unimos pequeños cortes.
    thick_region = cv2.dilate(
        thick_skeleton,
        np.ones((7, 7), np.uint8),
        iterations=2
    )

    n_labels, labels, _, _ = (
        cv2.connectedComponentsWithStats(
            thick_region,
            connectivity=8
        )
    )

    candidates = []

    for label in range(
        1,
        n_labels
    ):

        ys, xs = np.where(
            labels == label
        )

        if len(xs) < 10:
            continue

        valid = skeleton[
            ys,
            xs
        ] > 0

        xs = xs[valid]
        ys = ys[valid]

        if len(xs) < 10:
            continue

        points = np.column_stack(
            [xs, ys]
        ).astype(np.float32)

        rect = cv2.minAreaRect(
            points
        )

        w, h = rect[1]

        span = max(
            w,
            h
        )

        span_ratio = (
            span / polygon_major
            if polygon_major > 0
            else 0
        )

        mean_thickness = float(
            np.mean(
                distance[
                    ys,
                    xs
                ]
            )
        )

        if (
            span_ratio < MIN_MAIN_SPAN_RATIO
            or mean_thickness < MIN_MAIN_THICKNESS
        ):
            continue

        # Dirección de la estructura
        mean, eigenvectors, _ = cv2.PCACompute2(
            points,
            mean=None
        )

        center = mean[0]
        axis = eigenvectors[0]

        projection = (
            points - center
        ) @ axis

        p1 = (
            center
            + axis
            * projection.min()
        )

        p2 = (
            center
            + axis
            * projection.max()
        )

        score = (
            span
            * mean_thickness
            * np.sqrt(len(points))
        )

        candidates.append({
            "points": points,
            "p1": p1,
            "p2": p2,
            "span": span,
            "span_ratio": span_ratio,
            "thickness": mean_thickness,
            "score": score,
        })

    candidates.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    return candidates


# ============================================================
# 5. CONTAR NERVADURAS SECUNDARIAS
# ============================================================

def count_secondary_branches(
    skeleton,
    main
):

    p1 = main["p1"]
    p2 = main["p2"]

    direction = (
        p2 - p1
    )

    length = np.linalg.norm(
        direction
    )

    if length <= 0:
        return 0, None

    direction = (
        direction / length
    )

    # --------------------------------------------------------
    # CREAR CORREDOR ALREDEDOR DE LA PRINCIPAL
    # --------------------------------------------------------

    main_mask = np.zeros_like(
        skeleton
    )

    cv2.line(
        main_mask,
        tuple(np.int32(p1)),
        tuple(np.int32(p2)),
        255,
        9,
        cv2.LINE_AA
    )

    # Guardamos una versión un poco más ancha
    # para encontrar ramas que nacen de ella.
    connection_zone = cv2.dilate(
        main_mask,
        np.ones((7, 7), np.uint8),
        iterations=1
    )

    # Quitar principal del esqueleto.
    branches = skeleton.copy()

    branches[
        main_mask > 0
    ] = 0

    # --------------------------------------------------------
    # COMPONENTES DE LAS RAMAS RESTANTES
    # --------------------------------------------------------

    n_labels, labels, stats, _ = (
        cv2.connectedComponentsWithStats(
            branches,
            connectivity=8
        )
    )

    secondary_count = 0

    secondary_mask = np.zeros_like(
        skeleton
    )

    for label in range(
        1,
        n_labels
    ):

        area = stats[
            label,
            cv2.CC_STAT_AREA
        ]

        # Ramitas demasiado pequeñas = ruido.
        if area < 8:
            continue

        component = (
            labels == label
        )

        # ¿Esta rama toca la zona de la principal?
        dilated_component = cv2.dilate(
            component.astype(np.uint8) * 255,
            np.ones((3, 3), np.uint8),
            iterations=1
        )

        touches_main = np.any(
            (dilated_component > 0)
            & (connection_zone > 0)
        )

        if not touches_main:
            continue

        ys, xs = np.where(
            component
        )

        if len(xs) < 2:
            continue

        points = np.column_stack(
            [xs, ys]
        ).astype(np.float32)

        rect = cv2.minAreaRect(
            points
        )

        w, h = rect[1]

        branch_span = max(
            w,
            h
        )

        # Evitar contar pequeñas irregularidades
        # junto a la nervadura principal.
        if branch_span < 7:
            continue

        secondary_count += 1

        secondary_mask[
            component
        ] = 255

    return (
        secondary_count,
        secondary_mask
    )


# ============================================================
# 6. EVALUAR MARGEN
# ============================================================

def evaluate_margin(
    contour,
    leaf_mask
):

    perimeter = cv2.arcLength(
        contour,
        True
    )

    if perimeter <= 0:
        return False, 0

    contour_points = contour.reshape(
        -1,
        2
    )

    # Para esta primera prueba simplemente exigimos
    # un contorno exterior continuo y suficientemente largo.
    #
    # NO estamos diciendo todavía "hoja completa".
    # 7.2 puede pasar perfectamente este filtro.
    margin_length = float(
        perimeter
    )

    polygon_area = cv2.contourArea(
        contour
    )

    if polygon_area <= 0:
        return False, 0

    # Relación perímetro / sqrt(area)
    # permite comparar objetos de tamaños distintos.
    normalized_margin = (
        margin_length
        / np.sqrt(
            polygon_area
        )
    )

    useful_margin = (
        len(contour_points) >= 30
        and normalized_margin >= 3.0
    )

    return (
        useful_margin,
        normalized_margin
    )


# ============================================================
# 7. ANALIZAR SEGMENTO
# ============================================================

def analyze_segment(
    path
):

    image = cv2.imread(
        str(path)
    )

    if image is None:
        return None

    leaf_mask, contour = (
        get_segment_mask(
            image
        )
    )

    if leaf_mask is None:
        return None

    area = cv2.contourArea(
        contour
    )

    rect = cv2.minAreaRect(
        contour
    )

    w, h = rect[1]

    polygon_major = max(
        w,
        h
    )

    if (
        area <= 0
        or polygon_major <= 0
    ):
        return None

    network = extract_veins(
        image,
        leaf_mask
    )

    if network is None:

        return {
            "path": path,
            "image": image,
            "contour": contour,
            "category": "DESCARTAR",
            "reason": "sin_red",
        }

    skeleton = network[
        "skeleton"
    ]

    distance = network[
        "distance"
    ]

    mains = detect_main_structures(
        skeleton,
        distance,
        polygon_major
    )

    margin_ok, margin_score = (
        evaluate_margin(
            contour,
            leaf_mask
        )
    )

    # --------------------------------------------------------
    # SIN PRINCIPAL
    # --------------------------------------------------------

    if not mains:

        return {
            "path": path,
            "image": image,
            "contour": contour,
            "skeleton": skeleton,
            "category": "DESCARTAR",
            "reason": "sin_nervadura_central",
            "main": None,
            "secondaries": 0,
            "margin_ok": margin_ok,
            "margin_score": margin_score,
        }

    best_main = mains[0]

    secondary_count, secondary_mask = (
        count_secondary_branches(
            skeleton,
            best_main
        )
    )

    # --------------------------------------------------------
    # ¿PARECE HABER MAS DE UNA ARQUITECTURA?
    # --------------------------------------------------------

    multiple_architecture = False

    if len(mains) >= 2:

        second_main = mains[1]

        if (
            second_main["score"]
            >= best_main["score"]
            * MULTI_MAIN_MIN_RATIO
        ):

            multiple_architecture = True

    # --------------------------------------------------------
    # DECISION
    # --------------------------------------------------------

    if multiple_architecture:

        category = "REFINAR"

        reason = (
            "mas_de_una_arquitectura"
        )

    elif (
        secondary_count
        >= MIN_SECONDARY_BRANCHES
        and margin_ok
    ):

        category = "HOJA_UTIL"

        reason = (
            "central_secundarias_margen"
        )

    else:

        category = "DESCARTAR"

        missing = []

        if (
            secondary_count
            < MIN_SECONDARY_BRANCHES
        ):
            missing.append(
                "sin_secundarias_suficientes"
            )

        if not margin_ok:
            missing.append(
                "sin_margen_util"
            )

        reason = "+".join(
            missing
        )

    return {
        "path": path,
        "image": image,
        "contour": contour,
        "skeleton": skeleton,
        "secondary_mask": secondary_mask,
        "mains": mains,
        "main": best_main,
        "secondaries": secondary_count,
        "margin_ok": margin_ok,
        "margin_score": margin_score,
        "category": category,
        "reason": reason,
    }


# ============================================================
# 8. PROCESAR
# ============================================================

results = []

for path in image_files:

    result = analyze_segment(
        path
    )

    if result is None:
        continue

    results.append(
        result
    )

    print()
    print(path.name)

    print(
        f"  resultado: "
        f"{result['category']}"
    )

    print(
        f"  motivo: "
        f"{result['reason']}"
    )

    if "main" in result:

        print(
            f"  central: "
            f"{'SI' if result['main'] is not None else 'NO'}"
        )

        print(
            f"  secundarias: "
            f"{result.get('secondaries', 0)}"
        )

        print(
            f"  margen: "
            f"{'SI' if result.get('margin_ok', False) else 'NO'}"
        )


# ============================================================
# 9. VISUALIZACION
# ============================================================

CATEGORY_COLORS = {
    "HOJA_UTIL": (
        0,
        150,
        0
    ),
    "REFINAR": (
        0,
        140,
        220
    ),
    "DESCARTAR": (
        0,
        0,
        200
    ),
}

cards = []

for result in results:

    visual = result[
        "image"
    ].copy()

    # Red en cian
    if "skeleton" in result:

        ys, xs = np.where(
            result["skeleton"] > 0
        )

        visual[
            ys,
            xs
        ] = (
            255,
            255,
            0
        )

    # Secundarias verdes
    secondary_mask = result.get(
        "secondary_mask"
    )

    if secondary_mask is not None:

        ys, xs = np.where(
            secondary_mask > 0
        )

        visual[
            ys,
            xs
        ] = (
            0,
            255,
            0
        )

    # Principal amarilla
    main = result.get(
        "main"
    )

    if main is not None:

        cv2.line(
            visual,
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
            (0, 255, 255),
            5,
            cv2.LINE_AA
        )

    # Contorno rojo
    cv2.drawContours(
        visual,
        [
            result["contour"]
        ],
        -1,
        (0, 0, 255),
        2
    )

    # ---------------------------
    # TARJETA
    # ---------------------------

    CARD_W = 330
    CARD_H = 330

    card = np.full(
        (
            CARD_H,
            CARD_W,
            3
        ),
        245,
        dtype=np.uint8
    )

    h, w = visual.shape[:2]

    scale = min(
        290 / max(w, 1),
        220 / max(h, 1)
    )

    rw = max(
        1,
        int(w * scale)
    )

    rh = max(
        1,
        int(h * scale)
    )

    resized = cv2.resize(
        visual,
        (rw, rh),
        interpolation=cv2.INTER_AREA
    )

    x = (
        CARD_W - rw
    ) // 2

    y = 35 + (
        220 - rh
    ) // 2

    card[
        y:y + rh,
        x:x + rw
    ] = resized

    name = (
        result["path"]
        .stem
        .replace(
            "candidate_",
            ""
        )
        .replace(
            "_sub_",
            "."
        )
    )

    cv2.putText(
        card,
        name,
        (10, 24),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 0, 0),
        2,
        cv2.LINE_AA
    )

    category = result[
        "category"
    ]

    cv2.putText(
        card,
        category,
        (10, 282),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.58,
        CATEGORY_COLORS[
            category
        ],
        2,
        cv2.LINE_AA
    )

    info = (
        f"sec={result.get('secondaries', 0)} "
        f"margen="
        f"{'si' if result.get('margin_ok', False) else 'no'}"
    )

    cv2.putText(
        card,
        info,
        (10, 310),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.45,
        (0, 0, 0),
        1,
        cv2.LINE_AA
    )

    cards.append(
        card
    )


# ============================================================
# 10. CREAR LAMINA
# ============================================================

if cards:

    cols = 2

    rows = int(
        np.ceil(
            len(cards) / cols
        )
    )

    overview = np.full(
        (
            rows * 330,
            cols * 330,
            3
        ),
        235,
        dtype=np.uint8
    )

    for i, card in enumerate(
        cards
    ):

        row = i // cols
        col = i % cols

        overview[
            row * 330:
            (row + 1) * 330,

            col * 330:
            (col + 1) * 330
        ] = card

    output_path = (
        RESULTS_DIR
        / "leaf_segment_filter_test.jpg"
    )

    cv2.imwrite(
        str(output_path),
        overview
    )

else:

    output_path = None


print()
print("=" * 65)
print("PRUEBA COMPLETADA")
print("=" * 65)

if output_path:

    print()
    print("Lamina creada:")
    print(output_path)

print()
print("AMARILLO = nervadura central")
print("VERDE = secundarias asociadas")
print("CIAN = resto de red detectada")
print("ROJO = margen del segmento")