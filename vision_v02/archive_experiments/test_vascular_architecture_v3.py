from pathlib import Path

import cv2
import numpy as np
from skimage.morphology import remove_small_objects, skeletonize


# ============================================================
# CONFIGURACION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
RESULTS_DIR = BASE_DIR / "results"

POSITIVE_CANDIDATES = [
    17, 18, 20, 26, 28, 37, 40, 49
]

NEGATIVE_CANDIDATES = [
    39, 44, 56, 65
]

TEST_CANDIDATES = (
    POSITIVE_CANDIDATES
    + NEGATIVE_CANDIDATES
)


# ============================================================
# PARAMETROS QUE YA VENIAMOS USANDO
# ============================================================

MIN_NETWORK_PIXELS = 20
MIN_MAIN_SPAN_RATIO = 0.20
MIN_MAIN_THICKNESS = 1.40
MIN_SECONDARY_BRANCHES = 2

MIN_BRANCH_SPAN = 7
MAIN_CORRIDOR_WIDTH = 9

N_LONGITUDINAL_SECTORS = 4


# ============================================================
# NUEVAS METRICAS V3
# ============================================================

# Una secundaria se considera dirigida al margen si su extremo
# distal queda claramente mas cerca del borde que su origen.
MIN_MARGIN_APPROACH = 0.15

# Para la prueba inicial pediremos al menos una secundaria
# realmente dirigida hacia el margen.
MIN_MARGIN_DIRECTED_BRANCHES = 1

# Umbral provisional de plausibilidad de base.
# NO modificar hasta ver los resultados.
MIN_BASE_SCORE = 0.25


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
        "No encontre la carpeta de candidatos originales."
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
# MASCARA DEL SEGMENTO
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
# EXTRAER RED INTERNA
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

    # Distancia de cada pixel interior al margen del segmento
    margin_distance = cv2.distanceTransform(
        segment_mask,
        cv2.DIST_L2,
        5
    )

    return {
        "clean": clean,
        "skeleton": skeleton,
        "distance": distance,
        "margin_distance": margin_distance,
    }


# ============================================================
# POSIBLES CENTRALES
# ============================================================

def detect_main_candidates(
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

        min_projection = float(
            projection.min()
        )

        max_projection = float(
            projection.max()
        )

        p1 = (
            center
            + axis
            * min_projection
        )

        p2 = (
            center
            + axis
            * max_projection
        )

        candidates.append({
            "p1": p1,
            "p2": p2,
            "center": center,
            "axis": axis,
            "span": span,
            "span_ratio": span_ratio,
            "thickness": mean_thickness,
            "min_projection": min_projection,
            "max_projection": max_projection,
        })

    return candidates


# ============================================================
# DISTANCIA SEGURA A MARGEN
# ============================================================

def get_margin_distance(
    margin_distance,
    point
):

    x = int(
        round(
            float(point[0])
        )
    )

    y = int(
        round(
            float(point[1])
        )
    )

    h, w = margin_distance.shape

    x = int(
        np.clip(
            x,
            0,
            w - 1
        )
    )

    y = int(
        np.clip(
            y,
            0,
            h - 1
        )
    )

    return float(
        margin_distance[
            y,
            x
        ]
    )


# ============================================================
# ANALIZAR SECUNDARIAS
# ============================================================

def analyze_branches(
    skeleton,
    main,
    margin_distance
):

    p1 = main["p1"]
    p2 = main["p2"]

    center = main["center"]
    axis = main["axis"]

    normal = np.array(
        [
            -axis[1],
            axis[0]
        ],
        dtype=np.float32
    )

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
        MAIN_CORRIDOR_WIDTH,
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

    branches_image = skeleton.copy()

    branches_image[
        main_mask > 0
    ] = 0

    (
        n_labels,
        labels,
        stats,
        _
    ) = cv2.connectedComponentsWithStats(
        branches_image,
        connectivity=8
    )

    axis_length = (
        main["max_projection"]
        - main["min_projection"]
    )

    valid_branches = []

    secondary_mask = np.zeros_like(
        skeleton
    )

    margin_directed_mask = np.zeros_like(
        skeleton
    )

    if axis_length <= 0:
        return {
            "count": 0,
            "margin_directed": 0,
            "margin_ratio": 0.0,
            "side_a": 0,
            "side_b": 0,
            "sectors": 0,
            "sector_ids": [],
            "secondary_mask": secondary_mask,
            "margin_directed_mask": margin_directed_mask,
            "branches": [],
        }

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

        dilated = cv2.dilate(
            component_u8,
            np.ones(
                (3, 3),
                np.uint8
            ),
            iterations=1
        )

        contact = (
            (dilated > 0)
            & (connection_zone > 0)
        )

        if not np.any(contact):
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

        if (
            branch_span
            < MIN_BRANCH_SPAN
        ):
            continue

        relative = (
            points - center
        )

        longitudinal = (
            relative @ axis
        )

        lateral = (
            relative @ normal
        )

        # ----------------------------------------------------
        # ORIGEN:
        # pixel de la rama mas cercano al eje central
        # ----------------------------------------------------

        origin_index = int(
            np.argmin(
                np.abs(lateral)
            )
        )

        origin = points[
            origin_index
        ]

        origin_longitudinal = float(
            longitudinal[
                origin_index
            ]
        )

        position = (
            (
                origin_longitudinal
                - main["min_projection"]
            )
            / axis_length
        )

        position = float(
            np.clip(
                position,
                0.0,
                0.999999
            )
        )

        sector = int(
            position
            * N_LONGITUDINAL_SECTORS
        )

        # ----------------------------------------------------
        # EXTREMO DISTAL:
        # pixel de la rama mas alejado geometricamente
        # de su punto de origen
        # ----------------------------------------------------

        distances_from_origin = np.linalg.norm(
            points - origin,
            axis=1
        )

        distal_index = int(
            np.argmax(
                distances_from_origin
            )
        )

        distal = points[
            distal_index
        ]

        # ----------------------------------------------------
        # ¿LA RAMA SE ACERCA AL MARGEN?
        # ----------------------------------------------------

        origin_margin = get_margin_distance(
            margin_distance,
            origin
        )

        distal_margin = get_margin_distance(
            margin_distance,
            distal
        )

        if origin_margin > 0:

            margin_approach = (
                origin_margin
                - distal_margin
            ) / origin_margin

        else:

            margin_approach = 0.0

        margin_directed = (
            margin_approach
            >= MIN_MARGIN_APPROACH
        )

        # ----------------------------------------------------
        # LADO DEL EJE
        # ----------------------------------------------------

        median_lateral = float(
            np.median(
                lateral
            )
        )

        if median_lateral >= 0:
            side = "A"
        else:
            side = "B"

        branch_data = {
            "label": label,
            "span": branch_span,
            "position": position,
            "sector": sector,
            "side": side,
            "origin": origin,
            "distal": distal,
            "origin_margin": origin_margin,
            "distal_margin": distal_margin,
            "margin_approach": margin_approach,
            "margin_directed": margin_directed,
        }

        valid_branches.append(
            branch_data
        )

        secondary_mask[
            component
        ] = 255

        if margin_directed:

            margin_directed_mask[
                component
            ] = 255

    side_a = sum(
        1
        for branch
        in valid_branches
        if branch["side"] == "A"
    )

    side_b = sum(
        1
        for branch
        in valid_branches
        if branch["side"] == "B"
    )

    margin_directed_count = sum(
        1
        for branch
        in valid_branches
        if branch[
            "margin_directed"
        ]
    )

    occupied_sectors = sorted(
        set(
            branch["sector"]
            for branch
            in valid_branches
        )
    )

    if valid_branches:

        margin_ratio = (
            margin_directed_count
            / len(valid_branches)
        )

    else:

        margin_ratio = 0.0

    return {
        "count": len(
            valid_branches
        ),
        "margin_directed":
            margin_directed_count,
        "margin_ratio":
            margin_ratio,
        "side_a": side_a,
        "side_b": side_b,
        "sectors": len(
            occupied_sectors
        ),
        "sector_ids":
            occupied_sectors,
        "secondary_mask":
            secondary_mask,
        "margin_directed_mask":
            margin_directed_mask,
        "branches":
            valid_branches,
    }


# ============================================================
# ANCHO DE LA LAMINA PERPENDICULAR AL EJE
# ============================================================

def cross_section_width(
    segment_mask,
    point,
    normal,
    max_steps=300
):

    h, w = segment_mask.shape

    def walk(direction):

        distance = 0.0

        for step in range(
            1,
            max_steps + 1
        ):

            p = (
                point
                + normal
                * direction
                * step
            )

            x = int(
                round(
                    float(p[0])
                )
            )

            y = int(
                round(
                    float(p[1])
                )
            )

            if (
                x < 0
                or x >= w
                or y < 0
                or y >= h
            ):
                break

            if (
                segment_mask[
                    y,
                    x
                ] == 0
            ):
                break

            distance = float(
                step
            )

        return distance

    left = walk(-1)
    right = walk(1)

    return (
        left
        + right
    )


# ============================================================
# EXTENDER EJE HASTA EL MARGEN
# ============================================================

def extend_axis_to_boundary(
    segment_mask,
    center,
    axis,
    max_steps=1000
):

    h, w = segment_mask.shape

    endpoints = []

    for direction in [
        -1,
        1
    ]:

        last_valid = np.array(
            center,
            dtype=np.float32
        )

        for step in range(
            1,
            max_steps + 1
        ):

            p = (
                center
                + axis
                * direction
                * step
            )

            x = int(
                round(
                    float(p[0])
                )
            )

            y = int(
                round(
                    float(p[1])
                )
            )

            if (
                x < 0
                or x >= w
                or y < 0
                or y >= h
            ):
                break

            if (
                segment_mask[
                    y,
                    x
                ] == 0
            ):
                break

            last_valid = np.array(
                [x, y],
                dtype=np.float32
            )

        endpoints.append(
            last_valid
        )

    return (
        endpoints[0],
        endpoints[1]
    )


# ============================================================
# EVALUAR POSIBLE BASE
# ============================================================

def evaluate_one_base(
    segment_mask,
    endpoint,
    opposite_endpoint
):

    direction = (
        opposite_endpoint
        - endpoint
    )

    length = float(
        np.linalg.norm(
            direction
        )
    )

    if length < 5:

        return {
            "score": 0.0,
            "widths": [],
        }

    direction = (
        direction
        / length
    )

    normal = np.array(
        [
            -direction[1],
            direction[0]
        ],
        dtype=np.float32
    )

    # Medimos ancho cerca del extremo y luego mas adentro
    fractions = [
        0.05,
        0.15,
        0.25,
        0.35,
    ]

    widths = []

    for fraction in fractions:

        point = (
            endpoint
            + (
                opposite_endpoint
                - endpoint
            )
            * fraction
        )

        width = cross_section_width(
            segment_mask,
            point,
            normal
        )

        widths.append(
            width
        )

    if len(widths) < 4:

        return {
            "score": 0.0,
            "widths": widths,
        }

    first_width = widths[0]

    later_width = max(
        widths[1:]
    )

    if later_width <= 0:

        growth_score = 0.0

    else:

        growth_score = (
            later_width
            - first_width
        ) / later_width

    growth_score = float(
        np.clip(
            growth_score,
            0.0,
            1.0
        )
    )

    # Tambien observamos si, en general,
    # el ancho va creciendo hacia el interior.
    increases = 0

    for a, b in zip(
        widths[:-1],
        widths[1:]
    ):

        if b >= a:
            increases += 1

    monotonic_score = (
        increases
        / 3.0
    )

    score = (
        0.65
        * growth_score
        + 0.35
        * monotonic_score
    )

    return {
        "score": float(score),
        "widths": widths,
    }


def evaluate_base(
    segment_mask,
    main
):

    center = main[
        "center"
    ]

    axis = main[
        "axis"
    ]

    edge1, edge2 = extend_axis_to_boundary(
        segment_mask,
        center,
        axis
    )

    base1 = evaluate_one_base(
        segment_mask,
        edge1,
        edge2
    )

    base2 = evaluate_one_base(
        segment_mask,
        edge2,
        edge1
    )

    if (
        base1["score"]
        >= base2["score"]
    ):

        best_endpoint = edge1
        distal_endpoint = edge2
        best = base1
        chosen = 1

    else:

        best_endpoint = edge2
        distal_endpoint = edge1
        best = base2
        chosen = 2

    return {
        "score":
            best["score"],
        "widths":
            best["widths"],
        "base_endpoint":
            best_endpoint,
        "distal_endpoint":
            distal_endpoint,
        "chosen_endpoint":
            chosen,
        "edge1":
            edge1,
        "edge2":
            edge2,
        "score1":
            base1["score"],
        "score2":
            base2["score"],
    }


# ============================================================
# PUNTUAR UNA CENTRAL
# ============================================================

def score_main_candidate(
    main,
    branch_info,
    base_info
):

    branch_score = min(
        branch_info[
            "count"
        ] / 6.0,
        1.0
    )

    distribution_score = (
        branch_info[
            "sectors"
        ]
        / N_LONGITUDINAL_SECTORS
    )

    margin_score = (
        branch_info[
            "margin_ratio"
        ]
    )

    if (
        branch_info["side_a"] > 0
        and branch_info["side_b"] > 0
    ):
        bilateral_score = 1.0

    elif (
        branch_info["count"]
        > 0
    ):
        bilateral_score = 0.45

    else:
        bilateral_score = 0.0

    base_score = (
        base_info[
            "score"
        ]
    )

    span_score = min(
        main[
            "span_ratio"
        ],
        1.0
    )

    score = (
        0.20 * branch_score
        + 0.20 * distribution_score
        + 0.25 * margin_score
        + 0.10 * bilateral_score
        + 0.15 * base_score
        + 0.10 * span_score
    )

    return float(
        score
    )


# ============================================================
# ELEGIR CENTRAL
# ============================================================

def choose_best_main(
    skeleton,
    candidates,
    margin_distance,
    segment_mask
):

    evaluated = []

    for main in candidates:

        branch_info = analyze_branches(
            skeleton,
            main,
            margin_distance
        )

        base_info = evaluate_base(
            segment_mask,
            main
        )

        score = score_main_candidate(
            main,
            branch_info,
            base_info
        )

        item = dict(
            main
        )

        item[
            "branch_info"
        ] = branch_info

        item[
            "base_info"
        ] = base_info

        item[
            "architecture_score"
        ] = score

        evaluated.append(
            item
        )

    evaluated.sort(
        key=lambda x:
        x[
            "architecture_score"
        ],
        reverse=True
    )

    if not evaluated:
        return None, []

    return (
        evaluated[0],
        evaluated
    )


# ============================================================
# ANALIZAR CANDIDATO
# ============================================================

def analyze_candidate(
    number
):

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
            "image": image,
            "contour": contour,
            "category": "DESCARTAR",
            "main": None,
            "branch_info": None,
            "base_info": None,
            "score": 0.0,
            "skeleton": None,
        }

    skeleton = network[
        "skeleton"
    ]

    candidates = detect_main_candidates(
        skeleton,
        network["distance"],
        polygon_major
    )

    (
        best_main,
        evaluated
    ) = choose_best_main(
        skeleton,
        candidates,
        network[
            "margin_distance"
        ],
        segment_mask
    )

    if best_main is None:

        return {
            "number": number,
            "image": image,
            "contour": contour,
            "category": "DESCARTAR",
            "main": None,
            "branch_info": None,
            "base_info": None,
            "score": 0.0,
            "skeleton": skeleton,
        }

    branch_info = best_main[
        "branch_info"
    ]

    base_info = best_main[
        "base_info"
    ]

    # ========================================================
    # DECISION V3
    #
    # Una hoja util necesita:
    #
    # 1) al menos 2 secundarias
    # 2) al menos una secundaria que realmente avance
    #    hacia el margen
    # 3) algun indicio geometrico de base
    #
    # Estos valores quedan congelados para esta prueba.
    # ========================================================

    enough_branches = (
        branch_info[
            "count"
        ]
        >= MIN_SECONDARY_BRANCHES
    )

    margin_ok = (
        branch_info[
            "margin_directed"
        ]
        >= MIN_MARGIN_DIRECTED_BRANCHES
    )

    base_ok = (
        base_info[
            "score"
        ]
        >= MIN_BASE_SCORE
    )

    if (
        enough_branches
        and margin_ok
        and base_ok
    ):

        category = "HOJA_UTIL"

    else:

        category = "DESCARTAR"

    return {
        "number": number,
        "image": image,
        "contour": contour,
        "category": category,
        "main": best_main,
        "branch_info": branch_info,
        "base_info": base_info,
        "score": best_main[
            "architecture_score"
        ],
        "skeleton": skeleton,
        "evaluated": evaluated,
    }


# ============================================================
# EJECUTAR PRUEBA
# ============================================================

results = []

print()
print("=" * 76)
print("ARQUITECTURA VASCULAR V3")
print("=" * 76)

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
        result[
            "category"
        ]
        == expected
    )

    print()
    print(
        f"Candidato {number}"
    )

    print(
        f"  Esperado: {expected}"
    )

    print(
        f"  Resultado: "
        f"{result['category']}"
    )

    if (
        result[
            "branch_info"
        ]
        is not None
    ):

        b = result[
            "branch_info"
        ]

        base = result[
            "base_info"
        ]

        print(
            f"  Secundarias: "
            f"{b['count']}"
        )

        print(
            f"  Hacia margen: "
            f"{b['margin_directed']}"
        )

        print(
            f"  Ratio margen: "
            f"{b['margin_ratio']:.2f}"
        )

        print(
            f"  Lado A/B: "
            f"{b['side_a']}/"
            f"{b['side_b']}"
        )

        print(
            f"  Sectores: "
            f"{b['sectors']}/4"
        )

        print(
            f"  Base score: "
            f"{base['score']:.2f}"
        )

        print(
            "  Anchos desde base: "
            + ", ".join(
                f"{x:.1f}"
                for x
                in base[
                    "widths"
                ]
            )
        )

        print(
            f"  Score total: "
            f"{result['score']:.2f}"
        )

    else:

        print(
            "  Sin central candidata."
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

    cv2.drawContours(
        visual,
        [
            result[
                "contour"
            ]
        ],
        -1,
        (0, 0, 255),
        2
    )

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

    main = result[
        "main"
    ]

    branch_info = result[
        "branch_info"
    ]

    base_info = result[
        "base_info"
    ]

    if branch_info is not None:

        # Secundarias normales: verde
        secondary_mask = (
            branch_info[
                "secondary_mask"
            ]
        )

        ys, xs = np.where(
            secondary_mask > 0
        )

        visual[
            ys,
            xs
        ] = (
            0,
            180,
            0
        )

        # Secundarias que SI se acercan al margen:
        # verde brillante
        directed_mask = (
            branch_info[
                "margin_directed_mask"
            ]
        )

        ys, xs = np.where(
            directed_mask > 0
        )

        visual[
            ys,
            xs
        ] = (
            0,
            255,
            0
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
            4,
            cv2.LINE_AA
        )

    if base_info is not None:

        # Base elegida: circulo magenta
        base_point = tuple(
            np.int32(
                base_info[
                    "base_endpoint"
                ]
            )
        )

        cv2.circle(
            visual,
            base_point,
            7,
            (255, 0, 255),
            -1,
            cv2.LINE_AA
        )

        # Extremo opuesto: azul
        distal_point = tuple(
            np.int32(
                base_info[
                    "distal_endpoint"
                ]
            )
        )

        cv2.circle(
            visual,
            distal_point,
            5,
            (255, 0, 0),
            -1,
            cv2.LINE_AA
        )

    # ========================================================
    # TARJETA
    # ========================================================

    card = np.full(
        (
            395,
            350,
            3
        ),
        245,
        dtype=np.uint8
    )

    h, w = visual.shape[:2]

    scale = min(
        310 / max(w, 1),
        235 / max(h, 1)
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
        350 - rw
    ) // 2

    y = (
        35
        + (
            235 - rh
        ) // 2
    )

    card[
        y:y + rh,
        x:x + rw
    ] = resized

    cv2.putText(
        card,
        str(
            result[
                "number"
            ]
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
        result[
            "category"
        ]
        == expected
    )

    color = (
        (0, 130, 0)
        if correct
        else (0, 0, 220)
    )

    cv2.putText(
        card,
        result[
            "category"
        ],
        (10, 292),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.54,
        color,
        2,
        cv2.LINE_AA
    )

    if branch_info is not None:

        text1 = (
            f"sec={branch_info['count']} "
            f"margen={branch_info['margin_directed']} "
            f"r={branch_info['margin_ratio']:.2f}"
        )

        text2 = (
            f"base={base_info['score']:.2f} "
            f"score={result['score']:.2f}"
        )

    else:

        text1 = "sin central"
        text2 = "base=0.00 score=0.00"

    cv2.putText(
        card,
        text1,
        (10, 321),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.42,
        (0, 0, 0),
        1,
        cv2.LINE_AA
    )

    cv2.putText(
        card,
        text2,
        (10, 346),
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
        (280, 25),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        color,
        2,
        cv2.LINE_AA
    )

    # Explicacion de colores
    cv2.putText(
        card,
        "magenta=base  azul=opuesto",
        (10, 374),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.36,
        (80, 80, 80),
        1,
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
            rows * 395,
            cols * 350,
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
            row * 395:
            (row + 1) * 395,

            col * 350:
            (col + 1) * 350
        ] = card

    output_path = (
        RESULTS_DIR
        / "vascular_architecture_v3_test.jpg"
    )

    cv2.imwrite(
        str(output_path),
        overview
    )

    print()
    print("=" * 76)
    print("Lamina creada:")
    print(output_path)


# ============================================================
# RESUMEN
# ============================================================

correct_count = 0

print()
print("=" * 76)
print("RESUMEN")
print("=" * 76)

for result in results:

    expected = (
        "HOJA_UTIL"
        if result["number"]
        in POSITIVE_CANDIDATES
        else "DESCARTAR"
    )

    correct = (
        result[
            "category"
        ]
        == expected
    )

    if correct:
        correct_count += 1

    print(
        f"{result['number']:02d}  "
        f"{result['category']:<10}  "
        f"esperado={expected:<10}  "
        f"{'OK' if correct else 'ERROR'}"
    )

print()
print(
    f"Correctos: "
    f"{correct_count}/{len(results)}"
)   