from pathlib import Path
from collections import defaultdict

import torch
import torch.nn.functional as F


BASE_DIR = Path(__file__).resolve().parent
EMBEDDINGS_FILE = BASE_DIR / "embeddings" / "photo_library_dinov2.pt"

records = torch.load(EMBEDDINGS_FILE)

# Normalizar todos los vectores
for record in records:
    record["embedding"] = F.normalize(
        record["embedding"],
        dim=0
    )

by_species = defaultdict(list)

for record in records:
    by_species[record["species_code"]].append(record)


print("\nANALISIS BIBLIOTECA VISUAL ARBORIS")
print("=" * 60)

print(f"\nFotografias: {len(records)}")
print(f"Especies: {len(by_species)}")


# --------------------------------------------------
# 1. Consistencia interna de cada especie
# --------------------------------------------------

print("\n\n1. CONSISTENCIA DENTRO DE CADA ESPECIE")
print("-" * 60)

for species, items in sorted(by_species.items()):

    similarities = []

    for i in range(len(items)):
        for j in range(i + 1, len(items)):

            # Preferimos comparar individuos diferentes
            if items[i]["individual"] == items[j]["individual"]:
                continue

            sim = torch.dot(
                items[i]["embedding"],
                items[j]["embedding"]
            ).item()

            similarities.append(sim)

    if similarities:
        mean_sim = sum(similarities) / len(similarities)

        print(
            f"{species}: "
            f"{len(items)} fotos | "
            f"similitud entre individuos = {mean_sim:.3f}"
        )
    else:
        print(
            f"{species}: "
            f"{len(items)} fotos | "
            f"sin suficientes individuos diferentes"
        )


# --------------------------------------------------
# 2. Perfil visual promedio de cada especie
# --------------------------------------------------

species_profiles = {}

for species, items in by_species.items():

    vectors = torch.stack([
        item["embedding"]
        for item in items
    ])

    profile = vectors.mean(dim=0)
    profile = F.normalize(profile, dim=0)

    species_profiles[species] = profile


# --------------------------------------------------
# 3. Similitud entre perfiles de especies
# --------------------------------------------------

print("\n\n2. SIMILITUD ENTRE ESPECIES")
print("-" * 60)

species_names = sorted(species_profiles.keys())

pairs = []

for i in range(len(species_names)):
    for j in range(i + 1, len(species_names)):

        sp1 = species_names[i]
        sp2 = species_names[j]

        sim = torch.dot(
            species_profiles[sp1],
            species_profiles[sp2]
        ).item()

        pairs.append((sim, sp1, sp2))

for sim, sp1, sp2 in sorted(pairs, reverse=True):
    print(
        f"{sp1} <-> {sp2}: {sim:.3f}"
    )


# --------------------------------------------------
# 4. Clasificación contra perfiles
# --------------------------------------------------

print("\n\n3. FOTO CONTRA PERFIL DE ESPECIE")
print("-" * 60)

correct = 0

errors = []

for record in records:

    scores = {}

    for species, profile in species_profiles.items():

        # Para la especie real, construimos un perfil sin esta foto.
        # Evita que la imagen se ayude a sí misma.
        if species == record["species_code"]:

            others = [
                item["embedding"]
                for item in by_species[species]
                if item["filename"] != record["filename"]
            ]

            if others:
                profile_to_use = torch.stack(others).mean(dim=0)
                profile_to_use = F.normalize(profile_to_use, dim=0)
            else:
                continue

        else:
            profile_to_use = profile

        score = torch.dot(
            record["embedding"],
            profile_to_use
        ).item()

        scores[species] = score

    predicted = max(scores, key=scores.get)
    best_score = scores[predicted]

    real = record["species_code"]

    if predicted == real:
        correct += 1
    else:
        errors.append({
            "filename": record["filename"],
            "real": real,
            "predicted": predicted,
            "score": best_score,
            "evidence": record["evidence_type"],
            "individual": record["individual"],
        })


total = len(records)

print(f"\nCorrectas: {correct}/{total}")
print(f"Exactitud: {correct / total:.1%}")


print("\nERRORES")
print("-" * 60)

for error in errors:

    print(
        f"\n{error['filename']}"
        f"\n  real:       {error['real']}"
        f"\n  predicha:   {error['predicted']}"
        f"\n  similitud:  {error['score']:.3f}"
        f"\n  evidencia:  {error['evidence']}"
        f"\n  individuo:  {error['individual']}"
    )


print("\n" + "=" * 60)
print("ANALISIS COMPLETADO")