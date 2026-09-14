from pathlib import Path

import cv2
import numpy as np
from skimage.morphology import remove_small_objects, skeletonize


# ============================================================
# CONFIGURACION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
RESULTS_DIR = BASE_DIR / "results"

# Hojas individuales confirmadas por revision manual
POSITIVE_CANDIDATES = [
    17, 18, 20, 26, 28, 37, 40, 49
]

# No-hojas confirmadas por revision manual
NEGATIVE_CANDIDATES = [
    39, 44, 56, 65
]

TEST_CANDIDATES = (
    POSITIVE_CANDIDATES
    + NEGATIVE_CANDIDATES
)


# ------------------------------------------------------------
# Mantener parametros que ya funcionaban
# ------------------------------------------------------------

MIN_NETWORK_PIXELS = 20
MIN_MAIN_SPAN_RATIO = 0.20
MIN_MAIN_THICKNESS = 1.40
MIN_SECONDARY_BRANCHES = 2


# ------------------------------------------------------------
# NUEVA validacion arquitectonica
#
# Una verdadera nervadura central debe dejar lamina a ambos
# lados de su eje. Una linea que corre pegada al margen no
# debe aceptarse como central.
# ------------------------------------------------------------

MIN_BLADE_SIDE_FRACTION = 0.12


# ============================================================
# LOCALIZAR CARPETA DE CANDIDATOS
# ============================================================

candidate_dirs = [
    p for p in RESULTS_DIR.iterdir()
    if p.is_dir()
    and "candidate" in p.name.lower()
]

if not candidate_dirs:
    raise FileNotFoundError(
        "No encontre la carpeta con los candidatos originales."
    )

CANDIDATES_DIR = candidate_dirs[0]

image_files = sorted([
    p for p in CANDIDATES_DIR.iterdir()
    if p.suffix.lower()
    in [".jpg", ".jpeg", ".png"]
])

print()
print("Carpeta de candidatos:")
print(CANDIDATES_DIR)
print()
print(
    f"Imagenes encontradas: {len(image_files)}"
)


# ============================================================
# OBTENER MASCARA DEL SEGMENTO
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
# EXTRAER RED VASCULAR / TEXTURA LINEAL
# ============================================================

def extract_veins(
    image,
    segment_mask
):

    inner_mask = cv2.erode(
        segment_mask,
        np.ones(
            (9, 9),
            np.uint8
        ),
        iterations=1
    )

    if (
        np.count_nonzero(inner_mask)
        == 0
    ):
        return None

    lab = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2LAB
    )

    L, _, _ = cv2.split(lab)

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

    response[
        inner_mask == 0
    ] = 0

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

    binary = np.zeros_like(
        response
    )

    binary[
        (response >= threshold)
        & (inner_mask > 0)
    ] = 255

    clean_bool = remove_small_objects(
        binary > 0,
        min_size=25,
        connectivity=2
    )

    clean = (
        clean_bool.astype(
            np.uint8
        )
        * 255
    )

    clean = cv2.morphologyEx(
        clean,
        cv2.MORPH_CLOSE,
        np.ones(
            (3, 3),
            np.uint8
        ),
        iterations=1
    )

    clean_bool = remove_small_objects(
        clean > 0,
        min_size=30,
        connectivity=2
    )

    clean = (
        clean_bool.astype(
            np.uint8
        )
        * 255
    )

    safe_inner = cv2.erode(
        segment_mask,
        np.ones(
            (13, 13),
            np.uint8
        ),
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
        skeleton_bool.astype(
            np.uint8
        )
        * 255
    )

    distance = cv2.distanceTransform(
        clean,
        cv2.DIST_L2,
        5
    )

    return {
        "clean": clean,
        "skeleton": skeleton,
        "distance": distance,
    }


# ============================================================
# DETECTAR ESTRUCTURAS PRINCIPALES
# ============================================================

def detect_main_structures(
    skeleton,
    distance,
    polygon_major
):

    if (
        np.count_nonzero(skeleton)
        < MIN_NETWORK_PIXELS
    ):
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
        & (
            distance
            >= thickness_threshold
        )
    ] = 255

    thick_region = cv2.dilate(
        thick_skeleton,
        np.ones(
            (7, 7),
            np.uint8
        ),
        iterations=2
    )

    (
        n_labels,
        labels,
        _,
        _
    ) = cv2.connectedComponentsWithStats(
        thick_region,
        connectivity=8
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

        valid = (
            skeleton[
                ys,
                xs
            ] > 0
        )

        xs = xs[valid]
        ys = ys[valid]

        if len(xs) < 10:
            continue

        points = np.column_stack(
            [xs, ys]
        ).astype(
            np.float32
        )

        rect = cv2.minAreaRect(
            points
        )

        w, h = rect[1]

        span = max(
            w,
            h
        )

        if polygon_major <= 0:
            continue

        span_ratio = (
            span
            / polygon_major
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
            span_ratio
            < MIN_MAIN_SPAN_RATIO
        ):
            continue

        if (
            mean_thickness
            < MIN_MAIN_THICKNESS
        ):
            continue

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
            * np.sqrt(
                len(points)
            )
        )

        candidates.append({
            "p1": p1,
            "p2": p2,
            "center": center,
            "axis": axis,
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
# MEDIR CUANTA LAMINA HAY A CADA LADO DE LA CENTRAL
# ============================================================

def evaluate_blade_sides(
    segment_mask,
    main
):

    if main is None:
        return {
            "valid": False,
            "fraction_a": 0.0,
            "fraction_b": 0.0,
            "minor_fraction": 0.0,
        }

    ys, xs = np.where(
        segment_mask > 0
    )

    if len(xs) == 0:
        return {
            "valid": False,
            "fraction_a": 0.0,
            "fraction_b": 0.0,
            "minor_fraction": 0.0,
        }

    points = np.column_stack(
        [xs, ys]
    ).astype(
        np.float32
    )

    center = np.asarray(
        main["center"],
        dtype=np.float32
    )

    axis = np.asarray(
        main["axis"],
        dtype=np.float32
    )

    # Vector perpendicular al eje principal
    normal = np.array(
        [
            -axis[1],
            axis[0]
        ],
        dtype=np.float32
    )

    signed_distance = (
        points - center
    ) @ normal

    # Dejamos una pequeña franja central sin contar.
    # No nos interesa clasificar pixeles exactamente sobre
    # la nervadura.
    strip = 2.0

    side_a = np.sum(
        signed_distance > strip
    )

    side_b = np.sum(
        signed_distance < -strip
    )

    total = (
        side_a
        + side_b
    )

    if total <= 0:
        return {
            "valid": False,
            "fraction_a": 0.0,
            "fraction_b": 0.0,
            "minor_fraction": 0.0,
        }

    fraction_a = (
        side_a / total
    )

    fraction_b = (
        side_b / total
    )

    minor_fraction = min(
        fraction_a,
        fraction_b
    )

    valid = (
        minor_fraction
        >= MIN_BLADE_SIDE_FRACTION
    )

    return {
        "valid": valid,
        "fraction_a": fraction_a,
        "fraction_b": fraction_b,
        "minor_fraction": minor_fraction,
    }


# ============================================================
# CONTAR SECUNDARIAS ASOCIADAS A LA CENTRAL
# ============================================================

def count_secondary_branches(
    skeleton,
    main
):

    if main is None:
        return 0, None

    p1 = main["p1"]
    p2 = main["p2"]

    main_mask = np.zeros_like(
        skeleton
    )

    cv2.line(
        main_mask,
        tuple(
            np.int32(p1)
        ),
        tuple(
            np.int32(p2)
        ),
        255,
        9,
        cv2.LINE_AA
    )

    connection_zone = cv2.dilate(
        main_mask,
        np.ones(
            (7, 7),
            np.uint8
        ),
        iterations=1
    )

    branches = skeleton.copy()

    branches[
        main_mask > 0
    ] = 0

    (
        n_labels,
        labels,
        stats,
        _
    ) = cv2.connectedComponentsWithStats(
        branches,
        connectivity=8
    )

    count = 0

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

        if area < 8:
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

        dilated_component = cv2.dilate(
            component_u8,
            np.ones(
                (3, 3),
                np.uint8
            ),
            iterations=1
        )

        touches_main = np.any(
            (
                dilated_component
                > 0
            )
            & (
                connection_zone
                > 0
            )
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
        ).astype(
            np.float32
        )

        rect = cv2.minAreaRect(
            points
        )

        w, h = rect[1]

        branch_span = max(
            w,
            h
        )

        if branch_span < 7:
            continue

        count += 1

        secondary_mask[
            component
        ] = 255

    return (
        count,
        secondary_mask
    )


# ============================================================
# ANALIZAR UN CANDIDATO
# ============================================================

def analyze_candidate(
    number
):

    if (
        number < 1
        or number > len(image_files)
    ):
        print(
            f"Candidato {number} "
            "fuera de rango."
        )
        return None

    path = image_files[
        number - 1
    ]

    image = cv2.imread(
        str(path)
    )

    if image is None:
        return None

    (
        segment_mask,
        contour
    ) = get_segment_mask(
        image
    )

    if segment_mask is None:
        return None

    rect = cv2.minAreaRect(
        contour
    )

    w, h = rect[1]

    polygon_major = max(
        w,
        h
    )

    network = extract_veins(
        image,
        segment_mask
    )

    if network is None:

        return {
            "number": number,
            "path": path,
            "image": image,
            "mask": segment_mask,
            "contour": contour,
            "skeleton": None,
            "secondary_mask": None,
            "main": None,
            "secondaries": 0,
            "blade_sides": {
                "valid": False,
                "fraction_a": 0.0,
                "fraction_b": 0.0,
                "minor_fraction": 0.0,
            },
            "category": "DESCARTAR",
        }

    skeleton = network[
        "skeleton"
    ]

    mains = detect_main_structures(
        skeleton,
        network["distance"],
        polygon_major
    )

    if not mains:

        return {
            "number": number,
            "path": path,
            "image": image,
            "mask": segment_mask,
            "contour": contour,
            "skeleton": skeleton,
            "secondary_mask": None,
            "main": None,
            "secondaries": 0,
            "blade_sides": {
                "valid": False,
                "fraction_a": 0.0,
                "fraction_b": 0.0,
                "minor_fraction": 0.0,
            },
            "category": "DESCARTAR",
        }

    main = mains[0]

    blade_sides = evaluate_blade_sides(
        segment_mask,
        main
    )

    (
        secondaries,
        secondary_mask
    ) = count_secondary_branches(
        skeleton,
        main
    )

    # --------------------------------------------------------
    # DECISION
    #
    # Se acepta solamente si:
    # 1. encontramos una principal
    # 2. su eje tiene lamina a ambos lados
    # 3. existen secundarias asociadas
    # --------------------------------------------------------

    if not blade_sides["valid"]:

        category = "DESCARTAR"

    elif (
        secondaries
        < MIN_SECONDARY_BRANCHES
    ):

        category = "DESCARTAR"

    else:

        category = "HOJA_UTIL"

    return {
        "number": number,
        "path": path,
        "image": image,
        "mask": segment_mask,
        "contour": contour,
        "skeleton": skeleton,
        "secondary_mask": secondary_mask,
        "main": main,
        "secondaries": secondaries,
        "blade_sides": blade_sides,
        "category": category,
    }


# ============================================================
# EJECUTAR PRUEBA
# ============================================================

results = []

print()
print("=" * 70)
print("PRUEBA DE ARQUITECTURA VASCULAR")
print("=" * 70)

for number in TEST_CANDIDATES:

    result = analyze_candidate(
        number
    )

    if result is None:
        continue

    results.append(
        result
    )

    expected = (
        "HOJA_UTIL"
        if number
        in POSITIVE_CANDIDATES
        else "DESCARTAR"
    )

    correct = (
        result["category"]
        == expected
    )

    sides = result[
        "blade_sides"
    ]

    print()
    print(
        f"Candidato {number}"
    )

    print(
        f"  Esperado: "
        f"{expected}"
    )

    print(
        f"  Resultado: "
        f"{result['category']}"
    )

    print(
        f"  Central: "
        f"{'SI' if result['main'] is not None else 'NO'}"
    )

    print(
        f"  Secundarias: "
        f"{result['secondaries']}"
    )

    print(
        "  Lamina lado A: "
        f"{sides['fraction_a']:.2f}"
    )

    print(
        "  Lamina lado B: "
        f"{sides['fraction_b']:.2f}"
    )

    print(
        "  Lado menor: "
        f"{sides['minor_fraction']:.2f}"
    )

    print(
        f"  Arquitectura bilateral: "
        f"{'SI' if sides['valid'] else 'NO'}"
    )

    print(
        f"  Evaluacion: "
        f"{'CORRECTO' if correct else 'ERROR'}"
    )


# ============================================================
# VISUALIZACION
# ============================================================

cards = []

for result in results:

    visual = result[
        "image"
    ].copy()

    contour = result[
        "contour"
    ]

    cv2.drawContours(
        visual,
        [contour],
        -1,
        (0, 0, 255),
        2
    )

    # Red interna en cyan
    skeleton = result[
        "skeleton"
    ]

    if skeleton is not None:

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

    # Secundarias en verde
    secondary_mask = result[
        "secondary_mask"
    ]

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

    # Principal en amarillo
    main = result[
        "main"
    ]

    if main is not None:

        p1 = tuple(
            np.int32(
                main["p1"]
            )
        )

        p2 = tuple(
            np.int32(
                main["p2"]
            )
        )

        cv2.line(
            visual,
            p1,
            p2,
            (0, 255, 255),
            4,
            cv2.LINE_AA
        )

        # Dibujar linea perpendicular en el centro,
        # solo para que podamos inspeccionar visualmente
        # los dos lados de la lamina.
        center = np.asarray(
            main["center"],
            dtype=np.float32
        )

        axis = np.asarray(
            main["axis"],
            dtype=np.float32
        )

        normal = np.array(
            [
                -axis[1],
                axis[0]
            ],
            dtype=np.float32
        )

        length = 30

        q1 = (
            center
            - normal * length
        )

        q2 = (
            center
            + normal * length
        )

        cv2.line(
            visual,
            tuple(
                np.int32(q1)
            ),
            tuple(
                np.int32(q2)
            ),
            (255, 0, 255),
            2,
            cv2.LINE_AA
        )

    card = np.full(
        (
            360,
            330,
            3
        ),
        245,
        dtype=np.uint8
    )

    h, w = visual.shape[:2]

    scale = min(
        290 / max(w, 1),
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
        330 - rw
    ) // 2

    y = 35 + (
        230 - rh
    ) // 2

    card[
        y:y + rh,
        x:x + rw
    ] = resized

    cv2.putText(
        card,
        str(
            result["number"]
        ),
        (10, 25),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.70,
        (0, 0, 0),
        2,
        cv2.LINE_AA
    )

    expected = (
        "HOJA_UTIL"
        if result["number"]
        in POSITIVE_CANDIDATES
        else "DESCARTAR"
    )

    correct = (
        result["category"]
        == expected
    )

    result_color = (
        (0, 120, 0)
        if correct
        else (0, 0, 220)
    )

    cv2.putText(
        card,
        result["category"],
        (10, 290),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        result_color,
        2,
        cv2.LINE_AA
    )

    sides = result[
        "blade_sides"
    ]

    text = (
        f"sec={result['secondaries']} "
        f"lado_min={sides['minor_fraction']:.2f}"
    )

    cv2.putText(
        card,
        text,
        (10, 315),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.42,
        (0, 0, 0),
        1,
        cv2.LINE_AA
    )

    cv2.putText(
        card,
        (
            "OK"
            if correct
            else "ERROR"
        ),
        (10, 340),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.50,
        result_color,
        2,
        cv2.LINE_AA
    )

    cards.append(
        card
    )


# ============================================================
# CREAR LAMINA
# ============================================================

if cards:

    cols = 4

    rows = int(
        np.ceil(
            len(cards)
            / cols
        )
    )

    overview = np.full(
        (
            rows * 360,
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
            row * 360:
            (row + 1) * 360,

            col * 330:
            (col + 1) * 330
        ] = card

    output_path = (
        RESULTS_DIR
        / "vascular_architecture_test.jpg"
    )

    cv2.imwrite(
        str(output_path),
        overview
    )

    print()
    print("=" * 70)
    print(
        "Lamina creada:"
    )
    print(output_path)

else:

    output_path = None


# ============================================================
# RESUMEN
# ============================================================

correct_count = 0

for result in results:

    expected = (
        "HOJA_UTIL"
        if result["number"]
        in POSITIVE_CANDIDATES
        else "DESCARTAR"
    )

    if (
        result["category"]
        == expected
    ):
        correct_count += 1

print()
print("=" * 70)
print("RESUMEN")
print("=" * 70)

print(
    f"Correctos: "
    f"{correct_count}/{len(results)}"
)

print()

for result in results:

    expected = (
        "HOJA_UTIL"
        if result["number"]
        in POSITIVE_CANDIDATES
        else "DESCARTAR"
    )

    symbol = (
        "OK"
        if result["category"]
        == expected
        else "ERROR"
    )

    print(
        f"{result['number']:02d}  "
        f"{result['category']:<10}  "
        f"esperado={expected:<10}  "
        f"{symbol}"
    )