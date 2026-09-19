from pathlib import Path

import cv2
import numpy as np
from skimage.morphology import remove_small_objects, skeletonize


BASE_DIR = Path(__file__).resolve().parent
RESULTS_DIR = BASE_DIR / "results"

# ============================================================
# CAMBIA SOLO ESTE NUMERO PARA PROBAR OTRA HOJA
# ============================================================

CANDIDATE_NUMBER = 28


# ============================================================
# 1. LOCALIZAR CANDIDATO
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

if len(image_files) < CANDIDATE_NUMBER:
    raise ValueError(
        f"Solo encontre {len(image_files)} candidatos."
    )

candidate_path = image_files[CANDIDATE_NUMBER - 1]

image = cv2.imread(str(candidate_path))

if image is None:
    raise FileNotFoundError("No pude abrir la imagen.")

print()
print("=" * 60)
print("ARBORIS - ANALISIS ESTRUCTURAL DE HOJA")
print("=" * 60)
print(f"Candidato: {CANDIDATE_NUMBER}")
print(f"Archivo: {candidate_path.name}")


# ============================================================
# 2. MASCARA DE LA HOJA
# ============================================================

gray = cv2.cvtColor(
    image,
    cv2.COLOR_BGR2GRAY
)

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
    raise RuntimeError("No se encontro la hoja.")

contour = max(
    contours,
    key=cv2.contourArea
)

leaf_mask = np.zeros_like(initial_mask)

cv2.drawContours(
    leaf_mask,
    [contour],
    -1,
    255,
    cv2.FILLED
)

inner_mask = cv2.erode(
    leaf_mask,
    np.ones((11, 11), np.uint8),
    iterations=1
)


# ============================================================
# 3. MAPA DE NERVADURAS
# ============================================================

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

vein_response[inner_mask == 0] = 0

vein_response = cv2.GaussianBlur(
    vein_response,
    (3, 3),
    0
)


# ============================================================
# 4. BINARIZAR
# ============================================================

leaf_values = vein_response[
    inner_mask > 0
]

if len(leaf_values) == 0:
    raise RuntimeError("La mascara interior quedo vacia.")

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


# ============================================================
# 5. LIMPIEZA BASICA
# ============================================================

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


# ============================================================
# 6. FILTRAR COMPONENTES COMPACTOS
# ============================================================

num_labels, labels, stats, centroids = (
    cv2.connectedComponentsWithStats(
        clean,
        connectivity=8
    )
)

filtered = np.zeros_like(clean)

for label in range(1, num_labels):

    component = np.zeros_like(clean)

    component[
        labels == label
    ] = 255

    cs, _ = cv2.findContours(
        component,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_NONE
    )

    if not cs:
        continue

    c = max(
        cs,
        key=cv2.contourArea
    )

    area = cv2.contourArea(c)

    if area < 20:
        continue

    rect = cv2.minAreaRect(c)

    width, height = rect[1]

    if width <= 0 or height <= 0:
        continue

    major = max(width, height)
    minor = max(min(width, height), 1)

    elongation = major / minor

    perimeter = cv2.arcLength(
        c,
        True
    )

    compactness = (
        4 * np.pi * area / (perimeter ** 2)
        if perimeter > 0
        else 1
    )

    keep = (
        elongation >= 2.2
        or (
            area >= 150
            and compactness <= 0.45
        )
    )

    if keep:
        filtered[
            labels == label
        ] = 255


# ============================================================
# 7. QUITAR BORDE EXTERIOR
# ============================================================

safe_inner_mask = cv2.erode(
    leaf_mask,
    np.ones((17, 17), np.uint8),
    iterations=1
)

filtered = cv2.bitwise_and(
    filtered,
    safe_inner_mask
)


# ============================================================
# 8. ESQUELETO
# ============================================================

skeleton_bool = skeletonize(
    filtered > 0
)

skeleton = (
    skeleton_bool.astype(np.uint8)
    * 255
)

if np.count_nonzero(skeleton) == 0:
    raise RuntimeError(
        "No quedo red de nervaduras."
    )


# ============================================================
# 9. MAPA DE GROSOR
# ============================================================

distance = cv2.distanceTransform(
    filtered,
    cv2.DIST_L2,
    5
)

skeleton_values = distance[
    skeleton > 0
]

thickness_threshold = np.percentile(
    skeleton_values,
    70
)


# ============================================================
# 10. ENCONTRAR ZONA CANDIDATA A PRINCIPAL
# ============================================================

thick_skeleton = np.zeros_like(
    skeleton
)

thick_skeleton[
    (skeleton > 0)
    & (distance >= thickness_threshold)
] = 255

# Unir pequeños cortes entre zonas gruesas
thick_region = cv2.dilate(
    thick_skeleton,
    np.ones((7, 7), np.uint8),
    iterations=2
)

n_labels, thick_labels, thick_stats, _ = (
    cv2.connectedComponentsWithStats(
        thick_region,
        connectivity=8
    )
)

best_label = None
best_score = -1

for label in range(1, n_labels):

    ys, xs = np.where(
        thick_labels == label
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

    pts = np.column_stack(
        [xs, ys]
    ).astype(np.float32)

    rect = cv2.minAreaRect(
        pts
    )

    w, h = rect[1]

    length_estimate = max(w, h)

    mean_thickness = np.mean(
        distance[
            ys,
            xs
        ]
    )

    score = (
        length_estimate
        * mean_thickness
        * np.sqrt(len(xs))
    )

    if score > best_score:

        best_score = score
        best_label = label


if best_label is None:
    raise RuntimeError(
        "No pude localizar la nervadura principal."
    )


# ============================================================
# 11. OBTENER PUNTOS CANDIDATOS DE LA PRINCIPAL
# ============================================================

ys, xs = np.where(
    thick_labels == best_label
)

valid = skeleton[
    ys,
    xs
] > 0

xs = xs[valid]
ys = ys[valid]

main_points = np.column_stack(
    [xs, ys]
).astype(np.float32)


# ============================================================
# 12. DIRECCION GENERAL DE LA PRINCIPAL
# ============================================================

mean, eigenvectors, eigenvalues = cv2.PCACompute2(
    main_points,
    mean=None
)

main_center = mean[0]

main_axis = eigenvectors[0]

relative = (
    main_points
    - main_center
)

long_projection = (
    relative @ main_axis
)

short_axis = np.array(
    [-main_axis[1], main_axis[0]],
    dtype=np.float32
)

short_projection = (
    relative @ short_axis
)

min_long = float(
    long_projection.min()
)

max_long = float(
    long_projection.max()
)


# ============================================================
# 13. RECONSTRUIR LA TRAYECTORIA REAL
# ============================================================

# En lugar de dibujar una recta,
# dividimos la principal en muchas secciones y buscamos
# dónde está realmente la estructura gruesa en cada sección.

num_sections = 70

section_positions = np.linspace(
    min_long,
    max_long,
    num_sections
)

trajectory = []

section_width = max(
    3.0,
    (max_long - min_long)
    / num_sections
    * 1.8
)

for position in section_positions:

    distance_long = np.abs(
        long_projection - position
    )

    indices = np.where(
        distance_long <= section_width
    )[0]

    if len(indices) == 0:
        continue

    candidate_points = main_points[
        indices
    ]

    candidate_thickness = distance[
        candidate_points[:, 1].astype(int),
        candidate_points[:, 0].astype(int)
    ]

    # Dar más peso al centro de las zonas gruesas
    weights = (
        candidate_thickness ** 2
    )

    if weights.sum() <= 0:
        continue

    weighted_point = np.average(
        candidate_points,
        axis=0,
        weights=weights
    )

    trajectory.append(
        weighted_point
    )


trajectory = np.array(
    trajectory,
    dtype=np.float32
)

if len(trajectory) < 10:
    raise RuntimeError(
        "No pude reconstruir la trayectoria principal."
    )


# ============================================================
# 14. SUAVIZAR TRAYECTORIA
# ============================================================

def smooth_coordinates(values, window=7):

    if len(values) < window:
        return values

    kernel = np.ones(
        window,
        dtype=np.float32
    ) / window

    padded = np.pad(
        values,
        (
            window // 2,
            window // 2
        ),
        mode="edge"
    )

    smoothed = np.convolve(
        padded,
        kernel,
        mode="valid"
    )

    return smoothed[:len(values)]


smooth_x = smooth_coordinates(
    trajectory[:, 0]
)

smooth_y = smooth_coordinates(
    trajectory[:, 1]
)

trajectory = np.column_stack(
    [smooth_x, smooth_y]
).astype(np.float32)


# ============================================================
# 15. DEFINIR LOS DOS EXTREMOS DE LA TRAYECTORIA
# ============================================================

end_1 = trajectory[0]
end_2 = trajectory[-1]


# ============================================================
# 16. DECIDIR CUAL ES LA BASE
# ============================================================

# La nervadura suele ser más gruesa cerca de la base.
# Medimos el grosor en el primer 20 % de cada extremo.

portion = max(
    3,
    int(len(trajectory) * 0.20)
)

first_part = trajectory[
    :portion
]

last_part = trajectory[
    -portion:
]


def mean_path_thickness(points):

    values = []

    for point in points:

        x = int(round(point[0]))
        y = int(round(point[1]))

        if (
            0 <= x < distance.shape[1]
            and 0 <= y < distance.shape[0]
        ):
            values.append(
                float(
                    distance[y, x]
                )
            )

    if not values:
        return 0

    return float(
        np.mean(values)
    )


thickness_1 = mean_path_thickness(
    first_part
)

thickness_2 = mean_path_thickness(
    last_part
)


if thickness_1 >= thickness_2:

    base = end_1
    distal = end_2

else:

    # Invertir para que siempre vaya base -> distal
    trajectory = trajectory[::-1]

    base = trajectory[0]
    distal = trajectory[-1]


# ============================================================
# 17. EJE LONGITUDINAL DERIVADO DE LA NERVADURA
# ============================================================

vx, vy, x0, y0 = cv2.fitLine(
    trajectory,
    cv2.DIST_L2,
    0,
    0.01,
    0.01
).flatten()

axis_direction = np.array(
    [vx, vy],
    dtype=np.float32
)

axis_direction /= np.linalg.norm(
    axis_direction
)

# Asegurar que el eje apunte desde base hacia distal
if np.dot(
    axis_direction,
    distal - base
) < 0:

    axis_direction = (
        -axis_direction
    )


# ============================================================
# 18. EXTENDER EJE A TRAVES DE LA HOJA
# ============================================================

height, width = leaf_mask.shape

max_distance = np.hypot(
    width,
    height
)

axis_points = []

for d in np.linspace(
    -max_distance,
    max_distance,
    5000
):

    p = (
        base
        + axis_direction * d
    )

    x = int(round(p[0]))
    y = int(round(p[1]))

    if (
        0 <= x < width
        and 0 <= y < height
        and leaf_mask[y, x] > 0
    ):

        axis_points.append(
            np.array(
                [x, y],
                dtype=np.float32
            )
        )


if len(axis_points) < 2:
    raise RuntimeError(
        "No pude extender el eje."
    )


axis_start = axis_points[0]
axis_end = axis_points[-1]

# Elegir orientación base -> distal
if (
    np.linalg.norm(axis_start - base)
    >
    np.linalg.norm(axis_end - base)
):

    axis_start, axis_end = (
        axis_end,
        axis_start
    )


# ============================================================
# 19. DEFINIR LADO A / LADO B
# ============================================================

yy, xx = np.indices(
    leaf_mask.shape
)

relative_x = (
    xx - base[0]
)

relative_y = (
    yy - base[1]
)

side_value = (
    axis_direction[0]
    * relative_y
    -
    axis_direction[1]
    * relative_x
)

side_a = (
    (side_value > 0)
    & (leaf_mask > 0)
)

side_b = (
    (side_value < 0)
    & (leaf_mask > 0)
)


# ============================================================
# 20. IMAGEN ESTRUCTURAL
# ============================================================

structure = np.zeros(
    (
        height,
        width,
        3
    ),
    dtype=np.uint8
)

# Red completa blanca
structure[
    skeleton > 0
] = (
    255,
    255,
    255
)

# Nervadura principal REAL amarilla
trajectory_int = np.round(
    trajectory
).astype(np.int32)

cv2.polylines(
    structure,
    [
        trajectory_int.reshape(
            -1,
            1,
            2
        )
    ],
    False,
    (0, 255, 255),
    4,
    cv2.LINE_AA
)

# Eje longitudinal azul
cv2.line(
    structure,
    tuple(
        np.int32(axis_start)
    ),
    tuple(
        np.int32(axis_end)
    ),
    (255, 0, 0),
    2,
    cv2.LINE_AA
)

# Base roja
cv2.circle(
    structure,
    tuple(
        np.int32(base)
    ),
    9,
    (0, 0, 255),
    -1
)

# Extremo distal verde
cv2.circle(
    structure,
    tuple(
        np.int32(distal)
    ),
    7,
    (0, 255, 0),
    -1
)


# ============================================================
# 21. IMAGEN FINAL
# ============================================================

result = image.copy()

# Sombrear lado A
layer_a = result.copy()

layer_a[
    side_a
] = (
    60,
    150,
    60
)

result = cv2.addWeighted(
    result,
    0.82,
    layer_a,
    0.18,
    0
)

# Sombrear lado B
layer_b = result.copy()

layer_b[
    side_b
] = (
    160,
    80,
    30
)

result = cv2.addWeighted(
    result,
    0.85,
    layer_b,
    0.15,
    0
)

# Red secundaria cian
ys_s, xs_s = np.where(
    skeleton > 0
)

result[
    ys_s,
    xs_s
] = (
    255,
    255,
    0
)

# Nervadura principal real amarilla
cv2.polylines(
    result,
    [
        trajectory_int.reshape(
            -1,
            1,
            2
        )
    ],
    False,
    (0, 255, 255),
    5,
    cv2.LINE_AA
)

# Eje derivado azul
cv2.line(
    result,
    tuple(
        np.int32(axis_start)
    ),
    tuple(
        np.int32(axis_end)
    ),
    (255, 0, 0),
    2,
    cv2.LINE_AA
)

# Base roja
cv2.circle(
    result,
    tuple(
        np.int32(base)
    ),
    10,
    (0, 0, 255),
    3
)

cv2.putText(
    result,
    "BASE",
    tuple(
        np.int32(
            base + [10, -10]
        )
    ),
    cv2.FONT_HERSHEY_SIMPLEX,
    0.55,
    (0, 0, 255),
    2,
    cv2.LINE_AA
)

# Extremo distal verde
cv2.circle(
    result,
    tuple(
        np.int32(distal)
    ),
    8,
    (0, 255, 0),
    2
)

cv2.putText(
    result,
    "DISTAL",
    tuple(
        np.int32(
            distal + [10, 15]
        )
    ),
    cv2.FONT_HERSHEY_SIMPLEX,
    0.5,
    (0, 255, 0),
    2,
    cv2.LINE_AA
)

# Contorno rojo
cv2.drawContours(
    result,
    [contour],
    -1,
    (0, 0, 255),
    2
)


# ============================================================
# 22. GUARDAR
# ============================================================

clean_path = (
    RESULTS_DIR
    / f"36_candidate_{CANDIDATE_NUMBER}_clean_network.png"
)

structure_path = (
    RESULTS_DIR
    / f"37_candidate_{CANDIDATE_NUMBER}_structure.png"
)

result_path = (
    RESULTS_DIR
    / f"38_candidate_{CANDIDATE_NUMBER}_final_analysis.jpg"
)

cv2.imwrite(
    str(clean_path),
    filtered
)

cv2.imwrite(
    str(structure_path),
    structure
)

cv2.imwrite(
    str(result_path),
    result
)


# ============================================================
# 23. INFORME
# ============================================================

print()
print("ANALISIS COMPLETADO")
print("-" * 60)

print(
    f"Grosor extremo 1: "
    f"{thickness_1:.2f}"
)

print(
    f"Grosor extremo 2: "
    f"{thickness_2:.2f}"
)

print(
    "Base:",
    tuple(
        np.int32(base)
    )
)

print(
    "Extremo distal:",
    tuple(
        np.int32(distal)
    )
)

print(
    f"Puntos de trayectoria principal: "
    f"{len(trajectory)}"
)

print()
print("Archivos creados:")
print(clean_path)
print(structure_path)
print(result_path)

print()
print("AMARILLO = nervadura principal detectada")
print("AZUL = eje longitudinal derivado")
print("ROJO = base")
print("VERDE = extremo distal detectado")
print("CIAN = resto de la red")