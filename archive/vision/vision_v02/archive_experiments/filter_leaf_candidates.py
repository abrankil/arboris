from pathlib import Path

import cv2
import numpy as np

from mobile_sam import sam_model_registry, SamAutomaticMaskGenerator


BASE_DIR = Path(__file__).resolve().parent
IMAGE_PATH = BASE_DIR / "tests" / "SP002_LC001_ramilla_01.jpg"
MODEL_PATH = BASE_DIR / "models" / "mobile_sam.pt"
RESULTS_DIR = BASE_DIR / "results"
CANDIDATES_DIR = RESULTS_DIR / "candidates"

RESULTS_DIR.mkdir(exist_ok=True)
CANDIDATES_DIR.mkdir(exist_ok=True)


# -----------------------------
# 1. Cargar imagen
# -----------------------------
image_bgr = cv2.imread(str(IMAGE_PATH))

if image_bgr is None:
    raise FileNotFoundError(f"No pude abrir la imagen: {IMAGE_PATH}")

image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

height, width = image_bgr.shape[:2]
image_area = height * width

print("Imagen cargada:", image_bgr.shape)


# -----------------------------
# 2. Cargar MobileSAM
# -----------------------------
sam = sam_model_registry["vit_t"](checkpoint=str(MODEL_PATH))
sam.to(device="cpu")

mask_generator = SamAutomaticMaskGenerator(
    sam,
    points_per_side=16,
    pred_iou_thresh=0.80,
    stability_score_thresh=0.85,
    crop_n_layers=0,
    min_mask_region_area=500,
)

print("Generando máscaras...")

masks = mask_generator.generate(image_rgb)

print("Máscaras totales:", len(masks))


# -----------------------------
# 3. Analizar geometría
# -----------------------------
accepted = []

for mask_data in masks:

    segmentation = mask_data["segmentation"].astype(np.uint8) * 255

    contours, _ = cv2.findContours(
        segmentation,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    if not contours:
        continue

    contour = max(contours, key=cv2.contourArea)

    area = cv2.contourArea(contour)

    if area <= 0:
        continue

    # Proporción del objeto respecto a la foto
    relative_area = area / image_area

    # Evitar objetos diminutos y regiones enormes
    if relative_area < 0.003:
        continue

    if relative_area > 0.18:
        continue

    x, y, w, h = cv2.boundingRect(contour)

    short_side = min(w, h)
    long_side = max(w, h)

    if short_side == 0:
        continue

    elongation = long_side / short_side

    # Una hoja puede ser alargada,
    # pero no queremos líneas o ramas muy estrechas.
    if elongation > 4.5:
        continue

    # Área de la envolvente convexa
    hull = cv2.convexHull(contour)
    hull_area = cv2.contourArea(hull)

    if hull_area <= 0:
        continue

    solidity = area / hull_area

    # Las hojas suelen ser objetos relativamente compactos.
    if solidity < 0.70:
        continue

    rectangularity = area / (w * h)

    # Evita algunas formas muy dispersas.
    if rectangularity < 0.30:
        continue

    accepted.append(
        {
            "contour": contour,
            "mask": segmentation,
            "area": area,
            "relative_area": relative_area,
            "elongation": elongation,
            "solidity": solidity,
            "rectangularity": rectangularity,
            "bbox": (x, y, w, h),
        }
    )


# Ordenar de mayor a menor
accepted = sorted(
    accepted,
    key=lambda item: item["area"],
    reverse=True
)

print("Candidatos después del filtro:", len(accepted))


# -----------------------------
# 4. Guardar candidatos
# -----------------------------
overview = image_bgr.copy()

for index, item in enumerate(accepted, start=1):

    contour = item["contour"]
    mask = item["mask"]
    x, y, w, h = item["bbox"]

    # Dibujar candidato sobre imagen general
    cv2.drawContours(
        overview,
        [contour],
        -1,
        (0, 255, 0),
        2
    )

    cv2.putText(
        overview,
        str(index),
        (x, max(y - 6, 20)),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 0, 255),
        2
    )

    # Crear imagen donde sólo se vea el objeto segmentado
    isolated = np.zeros_like(image_bgr)
    isolated[mask > 0] = image_bgr[mask > 0]

    # Añadir un pequeño margen alrededor
    margin = 10

    x1 = max(x - margin, 0)
    y1 = max(y - margin, 0)
    x2 = min(x + w + margin, width)
    y2 = min(y + h + margin, height)

    crop = isolated[y1:y2, x1:x2]

    candidate_path = (
        CANDIDATES_DIR /
        f"candidate_{index:02d}.jpg"
    )

    cv2.imwrite(
        str(candidate_path),
        crop
    )

    print(
        f"{index:02d} | "
        f"area={item['relative_area']:.3f} | "
        f"elong={item['elongation']:.2f} | "
        f"solidity={item['solidity']:.2f} | "
        f"rect={item['rectangularity']:.2f}"
    )


# -----------------------------
# 5. Guardar vista general
# -----------------------------
overview_path = RESULTS_DIR / "02_filtered_candidates.jpg"

cv2.imwrite(
    str(overview_path),
    overview
)

print()
print("Vista general guardada en:")
print(overview_path)

print()
print("Candidatos individuales guardados en:")
print(CANDIDATES_DIR)