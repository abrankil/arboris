from pathlib import Path

import cv2
import numpy as np


BASE_DIR = Path(__file__).resolve().parent
IMAGE_PATH = BASE_DIR / "tests" / "SP002_LC001_ramilla_01.jpg"
RESULTS_DIR = BASE_DIR / "results"

RESULTS_DIR.mkdir(exist_ok=True)

# Leer fotografía
image = cv2.imread(str(IMAGE_PATH))

if image is None:
    raise FileNotFoundError(f"No pude abrir: {IMAGE_PATH}")

# Crear máscara verde provisional
hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

lower_green = np.array([25, 30, 25])
upper_green = np.array([100, 255, 255])

mask = cv2.inRange(hsv, lower_green, upper_green)

kernel = np.ones((5, 5), np.uint8)

mask = cv2.morphologyEx(
    mask,
    cv2.MORPH_OPEN,
    kernel
)

mask = cv2.morphologyEx(
    mask,
    cv2.MORPH_CLOSE,
    kernel
)

# Buscar contornos
contours, _ = cv2.findContours(
    mask,
    cv2.RETR_EXTERNAL,
    cv2.CHAIN_APPROX_SIMPLE
)

result = image.copy()

# Evitar considerar manchas diminutas
minimum_area = image.shape[0] * image.shape[1] * 0.002

leaf_candidates = []

for contour in contours:

    area = cv2.contourArea(contour)

    if area < minimum_area:
        continue

    x, y, w, h = cv2.boundingRect(contour)

    # Descartamos formas extremadamente estrechas
    # que probablemente sean ramitas o ruido.
    ratio = w / h

    if ratio < 0.15 or ratio > 6:
        continue

    leaf_candidates.append(contour)

    # Rectángulo provisional alrededor del candidato
    cv2.rectangle(
        result,
        (x, y),
        (x + w, y + h),
        (0, 255, 0),
        4
    )

    # Número del candidato
    cv2.putText(
        result,
        str(len(leaf_candidates)),
        (x, max(y - 10, 30)),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        3
    )

print("Candidatos encontrados:", len(leaf_candidates))

cv2.imwrite(
    str(RESULTS_DIR / "03_leaf_candidates.jpg"),
    result
)

print("Resultado guardado en:")
print(RESULTS_DIR / "03_leaf_candidates.jpg")