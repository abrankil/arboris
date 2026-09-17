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
# PARAMETROS YA USADOS
# ============================================================

MIN_NETWORK_PIXELS = 20
MIN_MAIN_SPAN_RATIO = 0.20
MIN_MAIN_THICKNESS = 1.40
MIN_SECONDARY_BRANCHES = 2

# Para estudiar distribucion de secundarias
N_LONGITUDINAL_SECTORS = 4

# Una rama debe tener al menos este largo aproximado
MIN_BRANCH_SPAN = 7

# Ancho de corredor alrededor de la central
MAIN_CORRIDOR_WIDTH = 9


# ============================================================
# LOCALIZAR CANDIDATOS
# ============================================================

candidate_dirs = [
    p for p in RESULTS_DIR.iterdir()
    if p.is_dir()
    and "candidate" in p.name.lower()
]

if not candidate_dirs:
    raise FileNotFoundError(
        "No encontre la carpeta de candidatos."
    )

CANDIDATES_DIR = candidate_dirs[0]

image_files = sorted([
    p for p in CANDIDATES_DIR.iterdir()
    if p.suffix.lower()
    in [".jpg", ".jpeg", ".png"]
])

print()
print("Carpeta:")
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

    return {
        "clean": clean,
        "skeleton": skeleton,
        "distance": distance,
    }


# ============================================================
# GENERAR POSIBLES CENTRALES
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

        geometric_score = (
            span_ratio
            * mean_thickness
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
            "geometric_score": geometric_score,
        })

    return candidates


# ============================================================
# ANALIZAR RAMAS DE UNA CENTRAL
# ============================================================

def analyze_branches(
    skeleton,
    main
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
        tuple(np.int32(p1)),
        tuple(np.int32(p2)),
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

    valid_branches = []

    secondary_mask = np.zeros_like(
        skeleton
    )

    axis_length = (
        main["max_projection"]
        - main["min_projection"]
    )

    if axis_length <= 0:
        return {
            "count": 0,
            "side_a": 0,
            "side_b": 0,
            "sectors": 0,
            "sector_ids": [],
            "secondary_mask": secondary_mask,
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

        # -----------------------------------------------
        # Encontrar punto de la rama mas cercano
        # a la central
        # -----------------------------------------------

        relative = (
            points - center
        )

        longitudinal = (
            relative @ axis
        )

        lateral = (
            relative @ normal
        )

        nearest_index = int(
            np.argmin(
                np.abs(lateral)
            )
        )

        origin_longitudinal = float(
            longitudinal[
                nearest_index
            ]
        )

        # Posicion 0..1 a lo largo de la central
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

        # -----------------------------------------------
        # Determinar hacia que lado se proyecta la rama
        # usando la mediana de sus pixeles.
        # -----------------------------------------------

        median_lateral = float(
            np.median(
                lateral
            )
        )

        if median_lateral >= 0:
            side = "A"
        else:
            side = "B"

        valid_branches.append({
            "label": label,
            "span": branch_span,
            "position": position,
            "sector": sector,
            "side": side,
        })

        secondary_mask[
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

    occupied_sectors = sorted(
        set(
            branch["sector"]
            for branch
            in valid_branches
        )
    )

    return {
        "count": len(
            valid_branches
        ),
        "side_a": side_a,
        "side_b": side_b,
        "sectors": len(
            occupied_sectors
        ),
        "sector_ids": occupied_sectors,
        "secondary_mask": secondary_mask,
        "branches": valid_branches,
    }


# ============================================================
# PUNTUAR ARQUITECTURA
# ============================================================

def score_architecture(
    main,
    branch_info
):

    count = branch_info[
        "count"
    ]

    sectors = branch_info[
        "sectors"
    ]

    side_a = branch_info[
        "side_a"
    ]

    side_b = branch_info[
        "side_b"
    ]

    # --------------------------------------------------------
    # No son umbrales de aceptacion.
    # Son componentes de un puntaje para COMPARAR las posibles
    # centrales dentro del mismo segmento.
    # --------------------------------------------------------

    branch_score = min(
        count / 6.0,
        1.0
    )

    distribution_score = (
        sectors
        / N_LONGITUDINAL_SECTORS
    )

    if (
        side_a > 0
        and side_b > 0
    ):
        bilateral_score = 1.0
    elif count > 0:
        # Una hoja parcial puede mostrar un solo lado.
        bilateral_score = 0.45
    else:
        bilateral_score = 0.0

    span_score = min(
        main["span_ratio"],
        1.0
    )

    thickness_score = min(
        main["thickness"] / 5.0,
        1.0
    )

    # La arquitectura pesa mas que longitud/grosor.
    score = (
        0.30 * branch_score
        + 0.30 * distribution_score
        + 0.20 * bilateral_score
        + 0.12 * span_score
        + 0.08 * thickness_score
    )

    return float(score)


# ============================================================
# ELEGIR MEJOR CENTRAL
# ============================================================

def choose_best_main(
    skeleton,
    candidates
):

    evaluated = []

    for main in candidates:

        branch_info = analyze_branches(
            skeleton,
            main
        )

        architecture_score = (
            score_architecture(
                main,
                branch_info
            )
        )

        item = dict(main)

        item[
            "branch_info"
        ] = branch_info

        item[
            "architecture_score"
        ] = architecture_score

        evaluated.append(
            item
        )

    evaluated.sort(
        key=lambda x:
        x["architecture_score"],
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
        candidates
    )

    if best_main is None:

        return {
            "number": number,
            "image": image,
            "contour": contour,
            "category": "DESCARTAR",
            "main": None,
            "branch_info": None,
            "score": 0.0,
            "skeleton": skeleton,
        }

    branch_info = best_main[
        "branch_info"
    ]

    # ========================================================
    # IMPORTANTE
    #
    # Seguimos siendo conservadores.
    #
    # Para esta primera prueba V2 no inventamos un nuevo
    # "score minimo".
    #
    # Exigimos solamente lo que ya pediamos:
    # al menos dos secundarias asociadas.
    #
    # El nuevo score se usa para elegir CUAL de las posibles
    # centrales es la mas coherente.
    # ========================================================

    if (
        branch_info["count"]
        >= MIN_SECONDARY_BRANCHES
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
        "score": best_main[
            "architecture_score"
        ],
        "skeleton": skeleton,
        "evaluated": evaluated,
    }


# ============================================================
# EJECUTAR
# ============================================================

results = []

print()
print("=" * 72)
print("ARQUITECTURA VASCULAR V2")
print("=" * 72)

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

    if result[
        "branch_info"
    ] is not None:

        info = result[
            "branch_info"
        ]

        print(
            f"  Secundarias: "
            f"{info['count']}"
        )

        print(
            f"  Lado A: "
            f"{info['side_a']}"
        )

        print(
            f"  Lado B: "
            f"{info['side_b']}"
        )

        print(
            f"  Sectores ocupados: "
            f"{info['sectors']}/"
            f"{N_LONGITUDINAL_SECTORS}"
        )

        print(
            f"  Sectores: "
            f"{info['sector_ids']}"
        )

        print(
            f"  Score arquitectura: "
            f"{result['score']:.3f}"
        )

    else:

        print(
            "  Sin central valida."
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
        [result["contour"]],
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

    if (
        branch_info
        is not None
    ):

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

        # Marcar cuatro sectores de la central
        p1 = np.asarray(
            main["p1"],
            dtype=np.float32
        )

        p2 = np.asarray(
            main["p2"],
            dtype=np.float32
        )

        axis = (
            p2 - p1
        )

        axis_length = (
            np.linalg.norm(axis)
        )

        if axis_length > 0:

            axis = (
                axis
                / axis_length
            )

            normal = np.array(
                [
                    -axis[1],
                    axis[0]
                ],
                dtype=np.float32
            )

            for i in range(
                1,
                N_LONGITUDINAL_SECTORS
            ):

                fraction = (
                    i
                    / N_LONGITUDINAL_SECTORS
                )

                point = (
                    p1
                    + (
                        p2 - p1
                    )
                    * fraction
                )

                q1 = (
                    point
                    - normal * 6
                )

                q2 = (
                    point
                    + normal * 6
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

    # --------------------------------------------------------
    # TARJETA
    # --------------------------------------------------------

    card = np.full(
        (
            370,
            340,
            3
        ),
        245,
        dtype=np.uint8
    )

    h, w = visual.shape[:2]

    scale = min(
        300 / max(w, 1),
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
        340 - rw
    ) // 2

    y = (
        35
        + (
            230 - rh
        ) // 2
    )

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

    color = (
        (0, 130, 0)
        if correct
        else (0, 0, 220)
    )

    cv2.putText(
        card,
        result["category"],
        (10, 290),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        color,
        2,
        cv2.LINE_AA
    )

    if branch_info is not None:

        text1 = (
            f"sec={branch_info['count']} "
            f"A={branch_info['side_a']} "
            f"B={branch_info['side_b']}"
        )

        text2 = (
            f"sectores="
            f"{branch_info['sectors']}/4 "
            f"score={result['score']:.2f}"
        )

    else:

        text1 = "sin central"
        text2 = "score=0.00"

    cv2.putText(
        card,
        text1,
        (10, 317),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.43,
        (0, 0, 0),
        1,
        cv2.LINE_AA
    )

    cv2.putText(
        card,
        text2,
        (10, 340),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.43,
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
        (270, 25),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        color,
        2,
        cv2.LINE_AA
    )

    cards.append(
        card
    )


# ============================================================
# LAMINA
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
            rows * 370,
            cols * 340,
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
            row * 370:
            (row + 1) * 370,

            col * 340:
            (col + 1) * 340
        ] = card

    output_path = (
        RESULTS_DIR
        / "vascular_architecture_v2_test.jpg"
    )

    cv2.imwrite(
        str(output_path),
        overview
    )

    print()
    print("=" * 72)
    print("Lamina creada:")
    print(output_path)


# ============================================================
# RESUMEN
# ============================================================

correct_count = 0

print()
print("=" * 72)
print("RESUMEN")
print("=" * 72)

for result in results:

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