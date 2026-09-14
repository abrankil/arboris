from pathlib import Path

import cv2
import numpy as np
from skimage.morphology import remove_small_objects, skeletonize


BASE_DIR = Path(__file__).resolve().parent
RESULTS_DIR = BASE_DIR / "results"

NEGATIVE_CANDIDATES = [39, 44, 56, 65]


# ============================================================
# 1. LOCALIZAR CANDIDATOS ORIGINALES
# ============================================================

candidate_dirs = [
    p for p in RESULTS_DIR.iterdir()
    if p.is_dir() and "candidate" in p.name.lower()
]

if not candidate_dirs:
    raise FileNotFoundError("No encontre la carpeta de candidatos.")

CANDIDATES_DIR = candidate_dirs[0]

image_files = sorted([
    p for p in CANDIDATES_DIR.iterdir()
    if p.suffix.lower() in [".jpg", ".jpeg", ".png"]
])


# ============================================================
# 2. MASCARA DEL POLIGONO
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
# 3. EXTRAER RED INTERNA
# ============================================================

def extract_veins(image, segment_mask):

    inner_mask = cv2.erode(
        segment_mask,
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

    safe_inner = cv2.erode(
        segment_mask,
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
        "clean": clean,
        "skeleton": skeleton,
        "distance": distance,
    }


# ============================================================
# 4. BUSCAR PRINCIPAL
# ============================================================

def detect_main_structure(
    skeleton,
    distance,
    polygon_major
):

    if np.count_nonzero(skeleton) < 20:
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

    thick_skeleton = np.zeros_like(
        skeleton
    )

    thick_skeleton[
        (skeleton > 0)
        & (distance >= thickness_threshold)
    ] = 255

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

    for label in range(1, n_labels):

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
            span_ratio < 0.20
            or mean_thickness < 1.40
        ):
            continue

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
            "p1": p1,
            "p2": p2,
            "score": score,
        })

    if not candidates:
        return None

    candidates.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    return candidates[0]


# ============================================================
# 5. CONTAR SECUNDARIAS
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
        tuple(np.int32(p1)),
        tuple(np.int32(p2)),
        255,
        9,
        cv2.LINE_AA
    )

    connection_zone = cv2.dilate(
        main_mask,
        np.ones((7, 7), np.uint8),
        iterations=1
    )

    branches = skeleton.copy()

    branches[
        main_mask > 0
    ] = 0

    n_labels, labels, stats, _ = (
        cv2.connectedComponentsWithStats(
            branches,
            connectivity=8
        )
    )

    count = 0
    secondary_mask = np.zeros_like(
        skeleton
    )

    for label in range(1, n_labels):

        area = stats[
            label,
            cv2.CC_STAT_AREA
        ]

        if area < 8:
            continue

        component = (
            labels == label
        )

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

        if branch_span < 7:
            continue

        count += 1

        secondary_mask[
            component
        ] = 255

    return count, secondary_mask


# ============================================================
# 6. ANALIZAR CANDIDATO NEGATIVO
# ============================================================

def analyze_candidate(number):

    path = image_files[
        number - 1
    ]

    image = cv2.imread(
        str(path)
    )

    if image is None:
        return None

    segment_mask, contour = (
        get_segment_mask(
            image
        )
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
            "image": image,
            "contour": contour,
            "category": "DESCARTAR",
            "main": None,
            "secondaries": 0,
            "skeleton": None,
            "secondary_mask": None,
        }

    skeleton = network[
        "skeleton"
    ]

    main = detect_main_structure(
        skeleton,
        network["distance"],
        polygon_major
    )

    secondaries, secondary_mask = (
        count_secondary_branches(
            skeleton,
            main
        )
    )

    if (
        main is not None
        and secondaries >= 2
    ):

        category = "FALSO_POSITIVO"

    else:

        category = "DESCARTAR"

    return {
        "number": number,
        "image": image,
        "contour": contour,
        "category": category,
        "main": main,
        "secondaries": secondaries,
        "skeleton": skeleton,
        "secondary_mask": secondary_mask,
    }


# ============================================================
# 7. PROCESAR 39, 41, 56, 65
# ============================================================

results = []

for number in NEGATIVE_CANDIDATES:

    result = analyze_candidate(
        number
    )

    if result is None:
        continue

    results.append(
        result
    )

    print()
    print(f"Candidato {number}")

    print(
        f"  Principal: "
        f"{'SI' if result['main'] is not None else 'NO'}"
    )

    print(
        f"  Secundarias: "
        f"{result['secondaries']}"
    )

    print(
        f"  Resultado: "
        f"{result['category']}"
    )


# ============================================================
# 8. LAMINA
# ============================================================

cards = []

for result in results:

    visual = result[
        "image"
    ].copy()

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

    main = result[
        "main"
    ]

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

    cv2.drawContours(
        visual,
        [
            result["contour"]
        ],
        -1,
        (0, 0, 255),
        2
    )

    card = np.full(
        (
            330,
            330,
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
        330 - rw
    ) // 2

    y = 35 + (
        220 - rh
    ) // 2

    card[
        y:y + rh,
        x:x + rw
    ] = resized

    cv2.putText(
        card,
        f"{result['number']}",
        (10, 24),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 0, 0),
        2,
        cv2.LINE_AA
    )

    if (
        result["category"]
        == "DESCARTAR"
    ):

        color = (
            0,
            0,
            200
        )

    else:

        color = (
            0,
            140,
            220
        )

    cv2.putText(
        card,
        result["category"],
        (10, 282),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.58,
        color,
        2,
        cv2.LINE_AA
    )

    cv2.putText(
        card,
        f"sec={result['secondaries']}",
        (10, 310),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.46,
        (0, 0, 0),
        1,
        cv2.LINE_AA
    )

    cards.append(
        card
    )


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
        / "negative_leaf_filter_test.jpg"
    )

    cv2.imwrite(
        str(output_path),
        overview
    )

else:

    output_path = None


print()
print("=" * 60)
print("PRUEBA NEGATIVA COMPLETADA")
print("=" * 60)

if output_path:

    print()
    print("Lamina creada:")
    print(output_path)