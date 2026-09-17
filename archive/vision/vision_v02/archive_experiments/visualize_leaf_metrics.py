from pathlib import Path
import csv

import cv2
import numpy as np


BASE_DIR = Path(__file__).resolve().parent
RESULTS_DIR = BASE_DIR / "results"

CSV_PATH = RESULTS_DIR / "leaf_candidate_metrics.csv"

# Nuestros controles que ya verificamos manualmente
KNOWN_LEAVES = {17, 20, 26, 28}


# ============================================================
# 1. LOCALIZAR CANDIDATOS
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


# ============================================================
# 2. LEER METRICAS
# ============================================================

if not CSV_PATH.exists():
    raise FileNotFoundError(
        f"No encontre {CSV_PATH}"
    )

metrics = {}

with open(
    CSV_PATH,
    "r",
    encoding="utf-8"
) as f:

    reader = csv.DictReader(f)

    for row in reader:

        number = int(
            row["candidate_number"]
        )

        metrics[number] = {
            "network_density": float(
                row["network_density"]
            ),
            "endpoints": int(
                row["endpoints"]
            ),
            "junctions": int(
                row["junctions"]
            ),
            "main_span_ratio": float(
                row["main_span_ratio"]
            ),
            "main_thickness": float(
                row["main_thickness"]
            ),
            "main_found": int(
                row["main_found"]
            ),
        }


# ============================================================
# 3. MOSTRAR CONTROLES POSITIVOS
# ============================================================

print()
print("=" * 72)
print("ARBORIS - METRICAS DE HOJAS CONFIRMADAS")
print("=" * 72)

for number in sorted(KNOWN_LEAVES):

    if number not in metrics:
        print(
            f"Candidato {number}: sin metricas"
        )
        continue

    m = metrics[number]

    print()
    print(f"CANDIDATO {number}")
    print("-" * 40)

    print(
        f"Densidad de red : "
        f"{m['network_density']:.5f}"
    )

    print(
        f"Extremos        : "
        f"{m['endpoints']}"
    )

    print(
        f"Bifurcaciones   : "
        f"{m['junctions']}"
    )

    print(
        f"Principal       : "
        f"{'SI' if m['main_found'] else 'NO'}"
    )

    print(
        f"Longitud rel.   : "
        f"{m['main_span_ratio']:.3f}"
    )

    print(
        f"Grosor principal: "
        f"{m['main_thickness']:.3f}"
    )


# ============================================================
# 4. NORMALIZACION SOLO PARA VISUALIZAR
# ============================================================

def percentile_limits(values):

    values = np.asarray(
        values,
        dtype=np.float32
    )

    low = np.percentile(
        values,
        5
    )

    high = np.percentile(
        values,
        95
    )

    if high <= low:
        high = low + 1

    return low, high


densities = [
    m["network_density"]
    for m in metrics.values()
]

spans = [
    m["main_span_ratio"]
    for m in metrics.values()
]

thicknesses = [
    m["main_thickness"]
    for m in metrics.values()
]

junction_values = [
    m["junctions"]
    for m in metrics.values()
]


density_low, density_high = percentile_limits(
    densities
)

span_low, span_high = percentile_limits(
    spans
)

thick_low, thick_high = percentile_limits(
    thicknesses
)

junction_low, junction_high = percentile_limits(
    junction_values
)


def normalize(value, low, high):

    value = (
        value - low
    ) / (
        high - low
    )

    return float(
        np.clip(
            value,
            0,
            1
        )
    )


# ============================================================
# 5. PUNTAJE EXPLORATORIO
# ============================================================

# IMPORTANTE:
# Este NO es todavía el clasificador definitivo.
#
# Sólo sirve para ordenar los candidatos según cuánto
# se parecen estructuralmente a algo con arquitectura foliar.

def exploratory_score(m):

    density_score = normalize(
        m["network_density"],
        density_low,
        density_high
    )

    span_score = normalize(
        m["main_span_ratio"],
        span_low,
        span_high
    )

    thickness_score = normalize(
        m["main_thickness"],
        thick_low,
        thick_high
    )

    junction_score = normalize(
        m["junctions"],
        junction_low,
        junction_high
    )

    main_score = float(
        m["main_found"]
    )

    score = (
        0.15 * density_score
        + 0.30 * span_score
        + 0.20 * thickness_score
        + 0.20 * junction_score
        + 0.15 * main_score
    )

    return score


for number in metrics:

    metrics[number]["score"] = (
        exploratory_score(
            metrics[number]
        )
    )


# ============================================================
# 6. CREAR LAMINA
# ============================================================

CELL_W = 230
CELL_H = 250

COLS = 5

ROWS = int(
    np.ceil(
        len(image_files) / COLS
    )
)

canvas = np.zeros(
    (
        ROWS * CELL_H,
        COLS * CELL_W,
        3
    ),
    dtype=np.uint8
)

canvas[:] = 245


for index, image_path in enumerate(
    image_files,
    start=1
):

    row = (
        (index - 1) // COLS
    )

    col = (
        (index - 1) % COLS
    )

    x0 = col * CELL_W
    y0 = row * CELL_H

    image = cv2.imread(
        str(image_path)
    )

    if image is None:
        continue

    # --------------------------------------------------------
    # AJUSTAR IMAGEN A LA CELDA
    # --------------------------------------------------------

    target_w = 190
    target_h = 155

    h, w = image.shape[:2]

    scale = min(
        target_w / w,
        target_h / h
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
        image,
        (new_w, new_h),
        interpolation=cv2.INTER_AREA
    )

    image_x = (
        x0
        + (CELL_W - new_w) // 2
    )

    image_y = y0 + 35

    canvas[
        image_y:image_y + new_h,
        image_x:image_x + new_w
    ] = resized

    # --------------------------------------------------------
    # DATOS
    # --------------------------------------------------------

    m = metrics.get(
        index
    )

    if m is None:
        continue

    score = m["score"]

    # --------------------------------------------------------
    # BORDE ESPECIAL PARA CONTROLES
    # --------------------------------------------------------

    if index in KNOWN_LEAVES:

        border_color = (
            0,
            180,
            0
        )

        border_thickness = 5

    else:

        border_color = (
            80,
            80,
            80
        )

        border_thickness = 1

    cv2.rectangle(
        canvas,
        (
            x0 + 4,
            y0 + 4
        ),
        (
            x0 + CELL_W - 5,
            y0 + CELL_H - 5
        ),
        border_color,
        border_thickness
    )

    # --------------------------------------------------------
    # NUMERO
    # --------------------------------------------------------

    cv2.putText(
        canvas,
        f"{index}",
        (
            x0 + 12,
            y0 + 27
        ),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (
            0,
            0,
            0
        ),
        2,
        cv2.LINE_AA
    )

    # --------------------------------------------------------
    # PUNTAJE
    # --------------------------------------------------------

    cv2.putText(
        canvas,
        f"score {score:.2f}",
        (
            x0 + 72,
            y0 + 27
        ),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.48,
        (
            0,
            0,
            0
        ),
        1,
        cv2.LINE_AA
    )

    # --------------------------------------------------------
    # METRICAS RESUMIDAS
    # --------------------------------------------------------

    text_y = y0 + 205

    cv2.putText(
        canvas,
        f"red {m['network_density']:.3f}",
        (
            x0 + 10,
            text_y
        ),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.38,
        (
            0,
            0,
            0
        ),
        1,
        cv2.LINE_AA
    )

    cv2.putText(
        canvas,
        f"eje {m['main_span_ratio']:.2f}",
        (
            x0 + 115,
            text_y
        ),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.38,
        (
            0,
            0,
            0
        ),
        1,
        cv2.LINE_AA
    )

    cv2.putText(
        canvas,
        f"bif {m['junctions']}",
        (
            x0 + 10,
            text_y + 22
        ),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.38,
        (
            0,
            0,
            0
        ),
        1,
        cv2.LINE_AA
    )

    cv2.putText(
        canvas,
        f"grosor {m['main_thickness']:.1f}",
        (
            x0 + 95,
            text_y + 22
        ),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.38,
        (
            0,
            0,
            0
        ),
        1,
        cv2.LINE_AA
    )


# ============================================================
# 7. GUARDAR LAMINA
# ============================================================

overview_path = (
    RESULTS_DIR
    / "leaf_metrics_overview.jpg"
)

cv2.imwrite(
    str(overview_path),
    canvas,
    [
        cv2.IMWRITE_JPEG_QUALITY,
        92
    ]
)


# ============================================================
# 8. RANKING
# ============================================================

ranking = sorted(
    metrics.items(),
    key=lambda item: item[1]["score"],
    reverse=True
)

print()
print("=" * 72)
print("20 CANDIDATOS CON MAYOR PUNTAJE EXPLORATORIO")
print("=" * 72)

for position, (
    number,
    m
) in enumerate(
    ranking[:20],
    start=1
):

    marker = (
        "  <-- HOJA CONFIRMADA"
        if number in KNOWN_LEAVES
        else ""
    )

    print(
        f"{position:02d}. "
        f"Candidato {number:02d}  "
        f"score={m['score']:.3f}"
        f"{marker}"
    )


print()
print("=" * 72)
print("LISTO")
print("=" * 72)

print()
print("Lamina creada en:")
print(overview_path)

print()
print(
    "Los bordes verdes corresponden a "
    "17, 20, 26 y 28."
)

print(
    "El score es exploratorio; "
    "todavia NO decide hoja/no-hoja."
)