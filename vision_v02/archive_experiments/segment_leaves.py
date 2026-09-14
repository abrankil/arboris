from pathlib import Path

import cv2
import numpy as np

from mobile_sam import sam_model_registry, SamAutomaticMaskGenerator


BASE_DIR = Path(__file__).resolve().parent
IMAGE_PATH = BASE_DIR / "tests" / "SP002_LC001_ramilla_01.jpg"
MODEL_PATH = BASE_DIR / "models" / "mobile_sam.pt"
RESULTS_DIR = BASE_DIR / "results"

RESULTS_DIR.mkdir(exist_ok=True)


# 1. Cargar imagen
image_bgr = cv2.imread(str(IMAGE_PATH))

if image_bgr is None:
    raise FileNotFoundError(f"No pude abrir la imagen: {IMAGE_PATH}")

image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

print("Imagen cargada:", image_rgb.shape)


# 2. Cargar MobileSAM
model_type = "vit_t"

sam = sam_model_registry[model_type](checkpoint=str(MODEL_PATH))
sam.to(device="cpu")

mask_generator = SamAutomaticMaskGenerator(
    sam,
    points_per_side=16,
    pred_iou_thresh=0.80,
    stability_score_thresh=0.85,
    crop_n_layers=0,
    min_mask_region_area=500,
)

print("Modelo cargado. Generando máscaras...")


# 3. Generar máscaras
masks = mask_generator.generate(image_rgb)

print("Máscaras encontradas:", len(masks))


# 4. Ordenarlas de mayor a menor
masks = sorted(
    masks,
    key=lambda x: x["area"],
    reverse=True
)


# 5. Crear imagen de resultado
result = image_bgr.copy()

# No queremos visualizar cientos de regiones.
MAX_MASKS_TO_SHOW = 40

for index, mask_data in enumerate(masks[:MAX_MASKS_TO_SHOW], start=1):

    segmentation = mask_data["segmentation"].astype(np.uint8) * 255

    contours, _ = cv2.findContours(
        segmentation,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    if not contours:
        continue

    contour = max(contours, key=cv2.contourArea)

    x, y, w, h = cv2.boundingRect(contour)

    cv2.drawContours(
        result,
        [contour],
        -1,
        (0, 255, 0),
        2
    )

    cv2.putText(
        result,
        str(index),
        (x, max(y - 6, 20)),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (0, 0, 255),
        2
    )


# 6. Guardar
OUTPUT_PATH = RESULTS_DIR / "01_mobile_sam_masks.jpg"

cv2.imwrite(
    str(OUTPUT_PATH),
    result
)

print("Resultado guardado en:")
print(OUTPUT_PATH)