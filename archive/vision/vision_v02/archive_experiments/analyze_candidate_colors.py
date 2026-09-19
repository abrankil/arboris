from pathlib import Path

import cv2
import numpy as np

from mobile_sam import sam_model_registry, SamAutomaticMaskGenerator


BASE_DIR = Path(__file__).resolve().parent
IMAGE_PATH = BASE_DIR / "tests" / "SP002_LC001_ramilla_01.jpg"
MODEL_PATH = BASE_DIR / "models" / "mobile_sam.pt"
RESULTS_DIR = BASE_DIR / "results"
COLOR_DIR = RESULTS_DIR / "color_analysis"

RESULTS_DIR.mkdir(exist_ok=True)
COLOR_DIR.mkdir(exist_ok=True)


# 1. Cargar imagen
image_bgr = cv2.imread(str(IMAGE_PATH))

if image_bgr is None:
    raise FileNotFoundError(f"No pude abrir la imagen: {IMAGE_PATH}")

image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
image_hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)

height, width = image_bgr.shape[:2]

print("Imagen cargada:", image_bgr.shape)


# 2. Cargar MobileSAM
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

masks = sorted(
    masks,
    key=lambda x: x["area"],
    reverse=True
)

print("Máscaras encontradas:", len(masks))


# 3. Analizar color de cada objeto
results = []

for mask_data in masks:

    segmentation = mask_data["segmentation"]

    pixel_count = int(np.sum(segmentation))

    if pixel_count < 500:
        continue

    pixels_hsv = image_hsv[segmentation]
    pixels_bgr = image_bgr[segmentation]

    # HSV:
    # H = tono
    # S = saturación
    # V = luminosidad
    h = pixels_hsv[:, 0]
    s = pixels_hsv[:, 1]
    v = pixels_hsv[:, 2]

    # Rango amplio de vegetación verde.
    # NO es todavía un filtro definitivo.
    green_pixels = (
        (h >= 25) &
        (h <= 100) &
        (s >= 25) &
        (v >= 20)
    )

    green_ratio = np.mean(green_pixels)

    mean_h = float(np.mean(h))
    mean_s = float(np.mean(s))
    mean_v = float(np.mean(v))

    # Excess Green (ExG)
    # Una medida simple de predominio del canal verde.
    b = pixels_bgr[:, 0].astype(np.float32)
    g = pixels_bgr[:, 1].astype(np.float32)
    r = pixels_bgr[:, 2].astype(np.float32)

    denominator = r + g + b + 1e-6

    rn = r / denominator
    gn = g / denominator
    bn = b / denominator

    exg = 2 * gn - rn - bn
    mean_exg = float(np.mean(exg))

    results.append({
        "segmentation": segmentation,
        "area": pixel_count,
        "green_ratio": float(green_ratio),
        "mean_h": mean_h,
        "mean_s": mean_s,
        "mean_v": mean_v,
        "mean_exg": mean_exg,
    })


# 4. Guardar candidatos numerados
overview = image_bgr.copy()

for index, item in enumerate(results[:50], start=1):

    segmentation = item["segmentation"].astype(np.uint8) * 255

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
        overview,
        [contour],
        -1,
        (0, 255, 0),
        2
    )

    label = f"{index} G:{item['green_ratio']:.2f}"

    cv2.putText(
        overview,
        label,
        (x, max(y - 5, 20)),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.45,
        (0, 0, 255),
        1
    )

    # Guardar objeto aislado
    isolated = np.zeros_like(image_bgr)
    isolated[segmentation > 0] = image_bgr[segmentation > 0]

    margin = 8

    x1 = max(x - margin, 0)
    y1 = max(y - margin, 0)
    x2 = min(x + w + margin, width)
    y2 = min(y + h + margin, height)

    crop = isolated[y1:y2, x1:x2]

    cv2.imwrite(
        str(COLOR_DIR / f"candidate_{index:02d}.jpg"),
        crop
    )

    print(
        f"{index:02d} | "
        f"green={item['green_ratio']:.3f} | "
        f"ExG={item['mean_exg']:.3f} | "
        f"H={item['mean_h']:.1f} | "
        f"S={item['mean_s']:.1f} | "
        f"V={item['mean_v']:.1f}"
    )


OUTPUT_PATH = RESULTS_DIR / "03_color_analysis.jpg"

cv2.imwrite(
    str(OUTPUT_PATH),
    overview
)

print()
print("Resultado guardado en:")
print(OUTPUT_PATH)