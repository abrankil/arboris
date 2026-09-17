from pathlib import Path

import torch
from PIL import Image
from torchvision import transforms


BASE_DIR = Path(__file__).resolve().parent
TESTS_DIR = BASE_DIR / "tests"
EMBEDDINGS_DIR = BASE_DIR / "embeddings"
EMBEDDINGS_DIR.mkdir(exist_ok=True)

print("Cargando DINOv2...")
model = torch.hub.load("facebookresearch/dinov2", "dinov2_vits14")
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

extensions = {".jpg", ".jpeg", ".png", ".webp"}

embeddings = []
labels = []
filenames = []

print("\nAnalizando fotos...\n")

for species_dir in sorted(TESTS_DIR.iterdir()):
    if not species_dir.is_dir():
        continue

    images = [
        p for p in species_dir.iterdir()
        if p.suffix.lower() in extensions
    ]

    print(f"{species_dir.name}: {len(images)} fotos")

    for image_path in sorted(images):
        image = Image.open(image_path).convert("RGB")
        tensor = transform(image).unsqueeze(0)

        with torch.no_grad():
            embedding = model(tensor)

        embedding = embedding.squeeze(0).cpu()

        embeddings.append(embedding)
        labels.append(species_dir.name)
        filenames.append(image_path.name)

        print(
            f"  {image_path.name} -> "
            f"vector de {embedding.shape[0]} números"
        )

embeddings_tensor = torch.stack(embeddings)

output = {
    "embeddings": embeddings_tensor,
    "labels": labels,
    "filenames": filenames,
}

output_path = EMBEDDINGS_DIR / "dinov2_embeddings.pt"
torch.save(output, output_path)

print(f"\nEmbeddings guardados en:")
print(output_path)

print(f"\nTotal de fotos: {len(filenames)}")
print(f"Dimensiones: {embeddings_tensor.shape}")

print("\nPRUEBA COMPLETADA")