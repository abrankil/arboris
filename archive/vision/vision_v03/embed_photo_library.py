from pathlib import Path
import re

import torch
from PIL import Image
from torchvision import transforms


BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
SPECIES_DIR = PROJECT_DIR / "species"
EMBEDDINGS_DIR = BASE_DIR / "embeddings"

EMBEDDINGS_DIR.mkdir(exist_ok=True)

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

print("Cargando DINOv2...")

model = torch.hub.load(
    "facebookresearch/dinov2",
    "dinov2_vits14"
)
model.eval()

transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=(0.485, 0.456, 0.406),
        std=(0.229, 0.224, 0.225),
    ),
])

records = []

print("\nAnalizando biblioteca fotografica...\n")

for image_path in sorted(SPECIES_DIR.rglob("*")):

    if not image_path.is_file():
        continue

    if image_path.suffix.lower() not in IMAGE_EXTENSIONS:
        continue

    match = re.match(
        r"^(SP\d{3})_([A-Za-z]+\d+)_(.+?)_(\d+)$",
        image_path.stem
    )

    if not match:
        print(f"Nombre no reconocido: {image_path.name}")
        continue

    species_code = match.group(1)
    individual = match.group(2)
    evidence_type = match.group(3)
    photo_number = match.group(4)

    image = Image.open(image_path).convert("RGB")
    tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        embedding = model(tensor)

    embedding = embedding.squeeze(0).cpu()

    records.append({
        "species_code": species_code,
        "individual": individual,
        "evidence_type": evidence_type,
        "photo_number": photo_number,
        "filename": image_path.name,
        "relative_path": str(image_path.relative_to(PROJECT_DIR)),
        "embedding": embedding,
    })

    print(
        f"{species_code} | "
        f"{individual} | "
        f"{evidence_type} | "
        f"{image_path.name}"
    )


output_path = EMBEDDINGS_DIR / "photo_library_dinov2.pt"

torch.save(records, output_path)

print("\n" + "=" * 60)
print("BIBLIOTECA VISUAL ARBORIS")
print(f"Fotografias procesadas: {len(records)}")
print(f"Dimensiones por foto: {records[0]['embedding'].shape[0]}")
print(f"Guardado en: {output_path}")