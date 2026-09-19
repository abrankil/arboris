from pathlib import Path
import re

import cv2
import numpy as np
from skimage.morphology import remove_small_objects, skeletonize


BASE_DIR = Path(__file__).resolve().parent
RESULTS_DIR = BASE_DIR / "results"

INPUT_DIR = RESULTS_DIR / "refined_multi_leaf"

OUTPUT_DIR = RESULTS_DIR / "refined_leaf_classification"
OUTPUT_DIR.mkdir(exist_ok=True)


# ============================================================
# PARAMETROS EXPLORATORIOS
# ============================================================

MIN_NETWORK_PIXELS = 15

# Una posible nervadura principal debe recorrer
# una fracción razonable del segmento.
MIN_MAIN_SPAN_RATIO = 0.16

# Grosor mínimo de una principal candidata.
MIN_MAIN_THICKNESS = 1.35

# Separación angular para considerar que dos
# principales representan arquitecturas diferentes.
MIN_ANGLE_DIFFERENCE = 22.0

# Evidencia de margen real.
COMPLETE_MARGIN_THRESHOLD = 0.68


# ============================================================
# 1. LOCALIZAR CANDIDATOS ORIGINALES
# ============================================================

candidate_dirs = [
    p for p in RESULTS_DIR.iterdir()
    if p.is_dir()
    and "candidate" in p.name.lower()
    and p.name != "refined_multi_leaf"
]

if not candidate_dirs:
    raise FileNotFoundError(
        "No encontre la carpeta original de candidatos."
    )

CANDIDATES_DIR = candidate_dirs[0]

original_candidates = sorted([
    p for p in CANDIDATES_DIR.iterdir()
    if p.suffix.lower() in [".jpg", ".jpeg", ".png"]
])


# ============================================================
# 2. SUBSEGMENTOS
# ============================================================

subsegment_files = sorted([
    p for p in INPUT_DIR.iterdir()
    if p.suffix.lower() in [".jpg", ".jpeg", ".png"]
    and "_mask" not in p.name
])

if not subsegment_files:
    raise FileNotFoundError(
        "No encontre subsegmentos refinados."
    )


# ============================================================
# UTILIDADES
# ============================================================

def parse_candidate_number(filename):
    """
    candidate_07_sub_03.png -> 7
    """

    match = re.search(
        r"candidate_(\d+)_sub_(\d+)",
        filename
    )

    if not match:
        return None, None

    return (
        int(match.group(1)),
        int(match.group(2))
    )


def angle_difference(a, b):
    """
    Diferencia entre orientaciones ignorando sentido.
    0 y 180 grados representan el mismo eje.
    """

    diff = abs(a - b) % 180

    if diff > 90:
        diff = 180 - diff

    return diff


# ============================================================
# 3. EXTRAER RED VASCULAR
# ============================================================

def extract_vein_network(image, mask):

    inner = cv2.erode(
        mask,
        np.ones((9, 9), np.uint8),
        iterations=1
    )

    if np.count_nonzero(inner) == 0:
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

    response[inner == 0] = 0

    response = cv2.GaussianBlur(
        response,
        (3, 3),
        0
    )

    values = response[
        inner > 0
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
        & (inner > 0)
    ] = 255

    # Eliminar ruido pequeño
    cleaned_bool = remove_small_objects(
        binary > 0,
        min_size=25,
        connectivity=2
    )

    cleaned = (
        cleaned_bool.astype(np.uint8)
        * 255
    )

    cleaned = cv2.morphologyEx(
        cleaned,
        cv2.MORPH_CLOSE,
        np.ones((3, 3), np.uint8),
        iterations=1
    )

    cleaned_bool = remove_small_objects(
        cleaned > 0,
        min_size=30,
        connectivity=2
    )

    cleaned = (
        cleaned_bool.astype(np.uint8)
        * 255
    )

    # Alejarse del margen
    safe_inner = cv2.erode(
        mask,
        np.ones((13, 13), np.uint8),
        iterations=1
    )

    cleaned = cv2.bitwise_and(
        cleaned,
        safe_inner
    )

    skeleton_bool = skeletonize(
        cleaned > 0
    )

    skeleton = (
        skeleton_bool.astype(np.uint8)
        * 255
    )

    distance = cv2.distanceTransform(
        cleaned,
        cv2.DIST_L2,
        5
    )

    return {
        "response": response,
        "binary": binary,
        "cleaned": cleaned,
        "skeleton": skeleton,
        "distance": distance,
    }


# ============================================================
# 4. BUSCAR PRINCIPALES INDEPENDIENTES
# ============================================================

def detect_main_veins(
    skeleton,
    distance,
    polygon_major
):

    if np.count_nonzero(skeleton) < MIN_NETWORK_PIXELS:
        return []

    thickness_values = distance[
        skeleton > 0
    ]

    if len(thickness_values) == 0:
        return []

    # Nos interesan los tramos relativamente gruesos.
    thick_threshold = np.percentile(
        thickness_values,
        65
    )

    thick = np.zeros_like(
        skeleton
    )

    thick[
        (skeleton > 0)
        & (distance >= thick_threshold)
    ] = 255

    # Conectar pequeñas interrupciones.
    thick = cv2.dilate(
        thick,
        np.ones((5, 5), np.uint8),
        iterations=1
    )

    # Hough se usa AHORA sobre la red vascular limpia,
    # no sobre la fotografía original.
    min_line_length = max(
        15,
        int(polygon_major * 0.14)
    )

    lines = cv2.HoughLinesP(
        thick,
        rho=1,
        theta=np.pi / 180,
        threshold=12,
        minLineLength=min_line_length,
        maxLineGap=15
    )

    if lines is None:
        return []

    lines = np.asarray(
        lines
    ).reshape(-1, 4)

    raw_candidates = []

    for x1, y1, x2, y2 in lines:

        dx = x2 - x1
        dy = y2 - y1

        length = np.hypot(
            dx,
            dy
        )

        if length <= 0:
            continue

        span_ratio = (
            length / polygon_major
            if polygon_major > 0
            else 0
        )

        if span_ratio < MIN_MAIN_SPAN_RATIO:
            continue

        angle = (
            np.degrees(
                np.arctan2(dy, dx)
            )
            % 180
        )

        # Grosor medio alrededor del segmento.
        sample_values = []

        for t in np.linspace(
            0,
            1,
            40
        ):

            x = int(round(
                x1 + dx * t
            ))

            y = int(round(
                y1 + dy * t
            ))

            if (
                0 <= x < distance.shape[1]
                and 0 <= y < distance.shape[0]
            ):

                sample_values.append(
                    distance[y, x]
                )

        if not sample_values:
            continue

        mean_thickness = float(
            np.mean(sample_values)
        )

        if mean_thickness < MIN_MAIN_THICKNESS:
            continue

        midpoint = np.array(
            [
                (x1 + x2) / 2,
                (y1 + y2) / 2
            ],
            dtype=np.float32
        )

        raw_candidates.append({
            "p1": np.array(
                [x1, y1],
                dtype=np.float32
            ),
            "p2": np.array(
                [x2, y2],
                dtype=np.float32
            ),
            "length": length,
            "span_ratio": span_ratio,
            "angle": angle,
            "thickness": mean_thickness,
            "midpoint": midpoint,
        })

    # Ordenar mejores primero.
    raw_candidates.sort(
        key=lambda item:
        item["length"]
        * item["thickness"],
        reverse=True
    )

    # --------------------------------------------------------
    # AGRUPAR SEGMENTOS QUE PERTENECEN A LA MISMA PRINCIPAL
    # --------------------------------------------------------

    main_veins = []

    for candidate in raw_candidates:

        duplicate = False

        for accepted in main_veins:

            angle_diff = angle_difference(
                candidate["angle"],
                accepted["angle"]
            )

            midpoint_distance = np.linalg.norm(
                candidate["midpoint"]
                - accepted["midpoint"]
            )

            # Misma orientación + cercanía =
            # probablemente fragmentos de la misma principal.
            if (
                angle_diff < 14
                and midpoint_distance
                < polygon_major * 0.28
            ):

                duplicate = True
                break

        if not duplicate:
            main_veins.append(
                candidate
            )

    # --------------------------------------------------------
    # QUITAR SECUNDARIAS LARGAS QUE PODRIAN ENGAÑAR
    # --------------------------------------------------------

    if not main_veins:
        return []

    strongest = main_veins[0]

    accepted = [
        strongest
    ]

    for candidate in main_veins[1:]:

        angle_diff = angle_difference(
            candidate["angle"],
            strongest["angle"]
        )

        # Para decir que tenemos otra arquitectura foliar,
        # exigimos una orientación claramente distinta
        # O suficiente separación espacial.
        midpoint_distance = np.linalg.norm(
            candidate["midpoint"]
            - strongest["midpoint"]
        )

        independent = (
            angle_diff >= MIN_ANGLE_DIFFERENCE
            and
            midpoint_distance
            >= polygon_major * 0.12
        )

        # Y además debe ser una estructura considerable,
        # no una secundaria pequeña.
        substantial = (
            candidate["length"]
            >= strongest["length"] * 0.48
        )

        if independent and substantial:

            accepted.append(
                candidate
            )

    return accepted


# ============================================================
# 5. EVIDENCIA DE MARGEN REAL
# ============================================================

def evaluate_margin(
    original_image,
    submask
):

    contours, _ = cv2.findContours(
        submask,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_NONE
    )

    if not contours:
        return 0

    contour = max(
        contours,
        key=cv2.contourArea
    )

    gray = cv2.cvtColor(
        original_image,
        cv2.COLOR_BGR2GRAY
    )

    # Gradiente real de la fotografía original.
    gx = cv2.Sobel(
        gray,
        cv2.CV_32F,
        1,
        0,
        ksize=3
    )

    gy = cv2.Sobel(
        gray,
        cv2.CV_32F,
        0,
        1,
        ksize=3
    )

    gradient = cv2.magnitude(
        gx,
        gy
    )

    # Umbral relativo al propio candidato original.
    valid_values = gradient[
        gradient > 0
    ]

    if len(valid_values) == 0:
        return 0

    gradient_threshold = np.percentile(
        valid_values,
        62
    )

    points = contour.reshape(
        -1,
        2
    )

    # Para no contar cientos de píxeles casi idénticos.
    step = max(
        1,
        len(points) // 250
    )

    points = points[
        ::step
    ]

    supported = 0
    total = 0

    radius = 3

    for x, y in points:

        x1 = max(
            0,
            x - radius
        )

        x2 = min(
            gradient.shape[1],
            x + radius + 1
        )

        y1 = max(
            0,
            y - radius
        )

        y2 = min(
            gradient.shape[0],
            y + radius + 1
        )

        local = gradient[
            y1:y2,
            x1:x2
        ]

        if local.size == 0:
            continue

        total += 1

        if np.max(local) >= gradient_threshold:
            supported += 1

    if total == 0:
        return 0

    return supported / total


# ============================================================
# 6. ANALIZAR UN SUBSEGMENTO
# ============================================================

def analyze_subsegment(path):

    number, sub_number = (
        parse_candidate_number(
            path.name
        )
    )

    if number is None:
        return None

    if number > len(original_candidates):
        return None

    # Imagen aislada producida por SAM.
    isolated = cv2.imread(
        str(path)
    )

    # Imagen ORIGINAL del candidato antes del refinamiento.
    original = cv2.imread(
        str(
            original_candidates[
                number - 1
            ]
        )
    )

    if (
        isolated is None
        or original is None
    ):
        return None

    # La propia imagen aislada permite recuperar
    # la máscara SAM: fuera de ella está negro.
    isolated_gray = cv2.cvtColor(
        isolated,
        cv2.COLOR_BGR2GRAY
    )

    _, submask = cv2.threshold(
        isolated_gray,
        10,
        255,
        cv2.THRESH_BINARY
    )

    contours, _ = cv2.findContours(
        submask,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_NONE
    )

    if not contours:
        return None

    contour = max(
        contours,
        key=cv2.contourArea
    )

    rect = cv2.minAreaRect(
        contour
    )

    w, h = rect[1]

    polygon_major = max(
        w,
        h
    )

    if polygon_major <= 0:
        return None

    network = extract_vein_network(
        original,
        submask
    )

    if network is None:
        return None

    skeleton = network[
        "skeleton"
    ]

    distance = network[
        "distance"
    ]

    main_veins = detect_main_veins(
        skeleton,
        distance,
        polygon_major
    )

    margin_score = evaluate_margin(
        original,
        submask
    )

    # --------------------------------------------------------
    # CLASIFICACION
    # --------------------------------------------------------

    number_of_mains = len(
        main_veins
    )

    network_pixels = np.count_nonzero(
        skeleton
    )

    if (
        number_of_mains == 0
        or network_pixels < MIN_NETWORK_PIXELS
    ):

        category = "NO_HOJA"

    elif number_of_mains >= 2:

        category = "VARIAS_HOJAS"

    else:

        # Hay una arquitectura foliar válida.
        #
        # El margen decide si podemos usar la geometría
        # completa de la lámina o sólo evidencia parcial.

        if (
            margin_score
            >= COMPLETE_MARGIN_THRESHOLD
        ):

            category = "HOJA_COMPLETA"

        else:

            category = "HOJA_UTIL_PARCIAL"

    return {
        "number": number,
        "sub_number": sub_number,
        "filename": path.name,
        "isolated": isolated,
        "original": original,
        "submask": submask,
        "contour": contour,
        "skeleton": skeleton,
        "main_veins": main_veins,
        "margin_score": margin_score,
        "category": category,
    }


# ============================================================
# 7. PROCESAR
# ============================================================

results = []

for path in subsegment_files:

    result = analyze_subsegment(
        path
    )

    if result is None:
        continue

    results.append(
        result
    )

    print()
    print(
        f"{result['number']}."
        f"{result['sub_number']}"
    )

    print(
        f"  Principales detectadas: "
        f"{len(result['main_veins'])}"
    )

    print(
        f"  Evidencia de margen: "
        f"{result['margin_score']:.2f}"
    )

    print(
        f"  Resultado: "
        f"{result['category']}"
    )


# ============================================================
# 8. CREAR VISUALIZACION
# ============================================================

cards = []

CATEGORY_COLORS = {
    "HOJA_COMPLETA": (
        0,
        150,
        0
    ),

    "HOJA_UTIL_PARCIAL": (
        0,
        150,
        220
    ),

    "VARIAS_HOJAS": (
        180,
        0,
        180
    ),

    "NO_HOJA": (
        0,
        0,
        200
    ),
}


for result in results:

    visual = result[
        "original"
    ].copy()

    submask = result[
        "submask"
    ]

    skeleton = result[
        "skeleton"
    ]

    # Oscurecer todo lo que queda fuera del subsegmento.
    dark = (
        visual.astype(np.float32)
        * 0.25
    ).astype(np.uint8)

    visual[
        submask == 0
    ] = dark[
        submask == 0
    ]

    # Red vascular en cian.
    ys, xs = np.where(
        skeleton > 0
    )

    visual[
        ys,
        xs
    ] = (
        255,
        255,
        0
    )

    # Principales independientes.
    main_colors = [
        (0, 255, 255),   # amarillo
        (255, 0, 255),   # magenta
        (0, 165, 255),   # naranja
    ]

    for i, vein in enumerate(
        result["main_veins"]
    ):

        color = main_colors[
            min(
                i,
                len(main_colors) - 1
            )
        ]

        cv2.line(
            visual,
            tuple(
                np.int32(
                    vein["p1"]
                )
            ),
            tuple(
                np.int32(
                    vein["p2"]
                )
            ),
            color,
            5,
            cv2.LINE_AA
        )

    # Contorno SAM.
    cv2.drawContours(
        visual,
        [
            result["contour"]
        ],
        -1,
        (0, 0, 255),
        2
    )

    # --------------------------------------------------------
    # TARJETA
    # --------------------------------------------------------

    CARD_W = 360
    CARD_H = 340

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
        320 / max(w, 1),
        230 / max(h, 1)
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

    y = 38 + (
        230 - rh
    ) // 2

    card[
        y:y + rh,
        x:x + rw
    ] = resized

    title = (
        f"{result['number']}."
        f"{result['sub_number']}"
    )

    cv2.putText(
        card,
        title,
        (10, 26),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 0, 0),
        2,
        cv2.LINE_AA
    )

    color = CATEGORY_COLORS[
        result["category"]
    ]

    cv2.putText(
        card,
        result["category"],
        (10, 292),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.52,
        color,
        2,
        cv2.LINE_AA
    )

    info = (
        f"principales="
        f"{len(result['main_veins'])}   "
        f"margen="
        f"{result['margin_score']:.2f}"
    )

    cv2.putText(
        card,
        info,
        (10, 320),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.44,
        (0, 0, 0),
        1,
        cv2.LINE_AA
    )

    cards.append(card)


# ============================================================
# 9. LAMINA
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
            rows * 340,
            cols * 360,
            3
        ),
        235,
        dtype=np.uint8
    )

    for i, card in enumerate(cards):

        row = i // cols
        col = i % cols

        overview[
            row * 340:
            (row + 1) * 340,

            col * 360:
            (col + 1) * 360
        ] = card

    output_path = (
        RESULTS_DIR
        / "refined_leaf_classification.jpg"
    )

    cv2.imwrite(
        str(output_path),
        overview
    )

else:

    output_path = None


# ============================================================
# 10. FINAL
# ============================================================

print()
print("=" * 65)
print("CLASIFICACION COMPLETADA")
print("=" * 65)

if output_path:

    print()
    print("Lamina creada:")
    print(output_path)

print()
print("AMARILLO / MAGENTA = principales independientes")
print("CIAN = red vascular")
print("ROJO = contorno del segmento")