from pathlib import Path
import torch
import torch.nn.functional as F


BASE_DIR = Path(__file__).resolve().parent
EMBEDDINGS_FILE = BASE_DIR / "embeddings" / "dinov2_embeddings.pt"

# Cargar los vectores que generamos antes
data = torch.load(EMBEDDINGS_FILE)

embeddings = data["embeddings"]
labels = data["labels"]
filenames = data["filenames"]

# Normalizar para poder comparar mediante similitud coseno
embeddings = F.normalize(embeddings, dim=1)

# Comparar todas las fotos entre sí
similarities = embeddings @ embeddings.T

correct = 0
total = len(filenames)

print("\nCOMPARACION DINOv2 - ARBORIS\n")
print("=" * 70)

for i in range(total):

    # Evitar que una foto se compare consigo misma
    similarities[i, i] = -1

    best_index = torch.argmax(similarities[i]).item()
    score = similarities[i, best_index].item()

    real_species = labels[i]
    predicted_species = labels[best_index]

    is_correct = real_species == predicted_species

    if is_correct:
        correct += 1
        result = "OK"
    else:
        result = "ERROR"

    print(f"\nFoto: {filenames[i]}")
    print(f"Especie real:     {real_species}")
    print(f"Mas parecida a:   {filenames[best_index]}")
    print(f"Especie vecina:   {predicted_species}")
    print(f"Similitud:        {score:.3f}")
    print(f"Resultado:        {result}")

accuracy = correct / total

print("\n" + "=" * 70)
print("\nRESULTADO GENERAL")
print(f"Correctas: {correct}/{total}")
print(f"Exactitud nearest-neighbor: {accuracy:.1%}")