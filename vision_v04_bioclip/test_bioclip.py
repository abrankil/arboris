from bioclip.predict import CustomLabelsClassifier

IMAGE_PATH = r"C:\Proyectos\arboris\species\SP006_quillaja_saponaria\photos\quillay.jpg"

SPECIES = [
    "Cryptocarya alba",       # Peumo
    "Lithraea caustica",      # Litre
    "Kageneckia oblonga",     # Bollén
    "Podanthus mitiqui",      # Mitique
    "Colliguaja odorifera",   # Colliguay
    "Quillaja saponaria",     # Quillay
]

print("Cargando BioCLIP 2...")

classifier = CustomLabelsClassifier(
    cls_ary=SPECIES,
    device="cpu"
)

print("Analizando imagen...")
predictions = classifier.predict(IMAGE_PATH)

print("\nResultados BioCLIP:\n")

for i, prediction in enumerate(predictions, start=1):
    print(
        f"{i}. {prediction['classification']}: "
        f"{prediction['score']:.4f}"
    )