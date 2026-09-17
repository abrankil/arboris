from pathlib import Path

import cv2
import numpy as np
import csv
from skimage.morphology import remove_small_objects, skeletonize


BASE_DIR = Path(__file__).resolve().parent
RESULTS_DIR = BASE_DIR / "results"


# ============================================================
# 1. LOCALIZAR CARPETA DE CANDIDATOS
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

print()
print("=" * 65)
print("ARBORIS - ANALISIS DE CANDIDATOS A HOJA")
print("=" * 65)
print(f"Candidatos encontrados: {len(image_files)}")
print()


# ============================================================
# 2. FUNCION PARA ANALIZAR UN CANDIDATO
# ============================================================

def analyze_candidate(image_path):

    image = cv2.imread(str(image_path))

    if image is None:
        return None

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    # --------------------------------------------------------
    # MASCARA DEL POLIGONO
    # --------------------------------------------------------

    _, initial_mask = cv2.threshold(
        gray,
        10,
        255,
        cv2.THRESH_BINARY
    )

    contours, _ = cv2.findContours(
        initial_mask,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_NONE
    )

    if not contours:
        return None

    contour = max(
        contours,
        key=cv2.contourArea
    )

    area = cv2.contourArea(contour)

    if area < 50:
        return None

    leaf_mask = np.zeros_like(
        initial_mask
    )

    cv2.drawContours(
        leaf_mask,
        [contour],
        -1,
        255,
        cv2.FILLED
    )

    # --------------------------------------------------------
    # GEOMETRIA EXTERNA
    # --------------------------------------------------------

    rect = cv2.minAreaRect(
        contour
    )

    w, h = rect[1]

    if w <= 0 or h <= 0:
        return None

    major = max(w, h)
    minor = max(min(w, h), 1)

    elongation = major / minor

    perimeter = cv2.arcLength(
        contour,
        True
    )

    compactness = (
        4 * np.pi * area / (perimeter ** 2)
        if perimeter > 0
        else 0
    )

    # --------------------------------------------------------
    # MASCARA INTERIOR
    # --------------------------------------------------------

    inner_mask = cv2.erode(
        leaf_mask,
        np.ones((11, 11), np.uint8),
        iterations=1
    )

    if np.count_nonzero(inner_mask) == 0:
        return None

    # --------------------------------------------------------
    # RESPUESTA DE NERVADURAS
    # --------------------------------------------------------

    lab = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2LAB
    )

    L, A, B = cv2.split(lab)

    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    L_enhanced = clahe.apply(L)

    background = cv2.GaussianBlur(
        L_enhanced,
        (0, 0),
        sigmaX=15,
        sigmaY=15
    )

    vein_response = cv2.subtract(
        L_enhanced,
        background
    )

    vein_response[
        inner_mask == 0
    ] = 0

    vein_response = cv2.GaussianBlur(
        vein_response,
        (3, 3),
        0
    )

    leaf_values = vein_response[
        inner_mask > 0
    ]

    if len(leaf_values) == 0:
        return None

    threshold_value = np.percentile(
        leaf_values,
        78
    )

    binary = np.zeros_like(
        vein_response
    )

    binary[
        (vein_response >= threshold_value)
        & (inner_mask > 0)
    ] = 255

    # --------------------------------------------------------
    # LIMPIEZA
    # --------------------------------------------------------

    clean_bool = remove_small_objects(
        binary > 0,
        min_size=35,
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
        min_size=45,
        connectivity=2
    )

    clean = (
        clean_bool.astype(np.uint8)
        * 255
    )

    # --------------------------------------------------------
    # QUITAR BORDE
    # --------------------------------------------------------

    safe_inner = cv2.erode(
        leaf_mask,
        np.ones((17, 17), np.uint8),
        iterations=1
    )

    clean = cv2.bitwise_and(
        clean,
        safe_inner
    )

    # --------------------------------------------------------
    # ESQUELETO
    # --------------------------------------------------------

    skeleton_bool = skeletonize(
        clean > 0
    )

    skeleton = (
        skeleton_bool.astype(np.uint8)
        * 255
    )

    skeleton_pixels = int(
        np.count_nonzero(skeleton)
    )

    if skeleton_pixels == 0:

        return {
            "filename": image_path.name,
            "area": area,
            "elongation": elongation,
            "compactness": compactness,
            "network_pixels": 0,
            "network_density": 0,
            "endpoints": 0,
            "junctions": 0,
            "main_span_ratio": 0,
            "main_thickness": 0,
            "main_found": 0,
        }

    # --------------------------------------------------------
    # DENSIDAD DE RED
    # --------------------------------------------------------

    polygon_pixels = max(
        np.count_nonzero(leaf_mask),
        1
    )

    network_density = (
        skeleton_pixels
        / polygon_pixels
    )

    # --------------------------------------------------------
    # NODOS DE LA RED
    # --------------------------------------------------------

    skeleton_binary = (
        skeleton > 0
    ).astype(np.uint8)

    neighbor_kernel = np.array([
        [1, 1, 1],
        [1, 0, 1],
        [1, 1, 1]
    ], dtype=np.uint8)

    neighbors = cv2.filter2D(
        skeleton_binary,
        cv2.CV_16S,
        neighbor_kernel
    )

    endpoints_mask = (
        (skeleton_binary == 1)
        & (neighbors == 1)
    )

    junction_mask = (
        (skeleton_binary == 1)
        & (neighbors >= 3)
    )

    endpoints = int(
        np.count_nonzero(
            endpoints_mask
        )
    )

    # Agrupar bifurcaciones cercanas
    junction_image = (
        junction_mask.astype(np.uint8)
        * 255
    )

    junction_image = cv2.dilate(
        junction_image,
        np.ones((3, 3), np.uint8),
        iterations=1
    )

    n_junctions, _, _, _ = (
        cv2.connectedComponentsWithStats(
            junction_image,
            connectivity=8
        )
    )

    junctions = max(
        n_junctions - 1,
        0
    )

    # --------------------------------------------------------
    # GROSOR DE LA RED
    # --------------------------------------------------------

    distance = cv2.distanceTransform(
        clean,
        cv2.DIST_L2,
        5
    )

    skeleton_thickness = distance[
        skeleton > 0
    ]

    if len(skeleton_thickness) == 0:

        thickness_threshold = 0

    else:

        thickness_threshold = np.percentile(
            skeleton_thickness,
            70
        )

    # --------------------------------------------------------
    # BUSCAR ESTRUCTURA PRINCIPAL
    # --------------------------------------------------------

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

    n_labels, labels, stats, _ = (
        cv2.connectedComponentsWithStats(
            thick_region,
            connectivity=8
        )
    )

    best_span = 0
    best_thickness = 0
    best_score = 0

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

        component_rect = cv2.minAreaRect(
            points
        )

        rw, rh = component_rect[1]

        span = max(rw, rh)

        mean_thickness = float(
            np.mean(
                distance[
                    ys,
                    xs
                ]
            )
        )

        score = (
            span
            * mean_thickness
            * np.sqrt(len(xs))
        )

        if score > best_score:

            best_score = score
            best_span = span
            best_thickness = mean_thickness

    # --------------------------------------------------------
    # LONGITUD RELATIVA DE LA PRINCIPAL
    # --------------------------------------------------------

    main_span_ratio = (
        best_span / major
        if major > 0
        else 0
    )

    main_found = int(
        best_span > 0
    )

    return {
        "filename": image_path.name,
        "area": round(area, 2),
        "elongation": round(elongation, 3),
        "compactness": round(compactness, 3),
        "network_pixels": skeleton_pixels,
        "network_density": round(network_density, 5),
        "endpoints": endpoints,
        "junctions": junctions,
        "main_span_ratio": round(main_span_ratio, 3),
        "main_thickness": round(best_thickness, 3),
        "main_found": main_found,
    }


# ============================================================
# 3. ANALIZAR TODOS LOS CANDIDATOS
# ============================================================

results = []

for index, image_path in enumerate(
    image_files,
    start=1
):

    print(
        f"[{index:02d}/{len(image_files):02d}] "
        f"{image_path.name}"
    )

    try:

        result = analyze_candidate(
            image_path
        )

        if result is not None:

            result["candidate_number"] = index

            results.append(
                result
            )

    except Exception as error:

        print(
            f"   ERROR: {error}"
        )


# ============================================================
# 4. GUARDAR CSV
# ============================================================

csv_path = (
    RESULTS_DIR
    / "leaf_candidate_metrics.csv"
)

fieldnames = [
    "candidate_number",
    "filename",
    "area",
    "elongation",
    "compactness",
    "network_pixels",
    "network_density",
    "endpoints",
    "junctions",
    "main_span_ratio",
    "main_thickness",
    "main_found",
]

with open(
    csv_path,
    "w",
    newline="",
    encoding="utf-8"
) as csvfile:

    writer = csv.DictWriter(
        csvfile,
        fieldnames=fieldnames
    )

    writer.writeheader()

    for row in results:

        writer.writerow(row)


# ============================================================
# 5. RESUMEN
# ============================================================

print()
print("=" * 65)
print("ANALISIS COMPLETADO")
print("=" * 65)

print(
    f"Candidatos procesados: "
    f"{len(results)}"
)

print()
print("Archivo creado:")
print(csv_path)

print()
print("Todavia NO estamos clasificando hoja/no-hoja.")
print("Primero vamos a mirar las metricas de los 94 candidatos.")