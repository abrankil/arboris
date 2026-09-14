from pathlib import Path
import csv
import cv2

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
MATRIX_FILE = BASE_DIR / "results" / "visual_botanical_matrix.csv"

QUESTIONS = [
    (
        "leaf_arrangement",
        "DISPOSICION FOLIAR",
        {
            "1": "alterna",
            "2": "opuesta",
            "3": "subopuesta",
            "4": "incierto",
            "5": "no_visible",
        },
    ),
    (
        "leaf_shape",
        "FORMA DE LA HOJA",
        {
            "1": "ovada",
            "2": "eliptica",
            "3": "oblonga",
            "4": "lanceolada",
            "5": "ovada_eliptica",
            "6": "variable",
            "7": "incierto",
            "8": "no_visible",
        },
    ),
    (
        "leaf_margin",
        "MARGEN",
        {
            "1": "entero",
            "2": "serrado",
            "3": "dentado",
            "4": "ondulado",
            "5": "entero_ondulado",
            "6": "incierto",
            "7": "no_visible",
        },
    ),
]


def load_rows():
    with MATRIX_FILE.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def save_rows(rows):
    if not rows:
        return

    fieldnames = list(rows[0].keys())

    with MATRIX_FILE.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def show_photo(row):
    photo_path = PROJECT_DIR / row["relative_path"]
    image = cv2.imread(str(photo_path))

    if image is None:
        print("No pude abrir:")
        print(photo_path)
        return False

    height, width = image.shape[:2]

    scale = min(
        1100 / width,
        750 / height,
        1.0
    )

    if scale < 1.0:
        image = cv2.resize(
            image,
            None,
            fx=scale,
            fy=scale,
            interpolation=cv2.INTER_AREA,
        )

    cv2.imshow("Arboris - revision visual", image)
    cv2.waitKey(1)

    return True


def ask_question(title, options):
    print("\n" + title)

    for key, value in options.items():
        print(f"  {key}. {value}")

    while True:
        answer = input("Seleccion: ").strip()

        if answer in options:
            return options[answer]

        print("Opcion no valida. Intenta nuevamente.")


def main():
    rows = load_rows()

    if not rows:
        print("No hay fotografias en la matriz.")
        return

    row = rows[0]

    print("\n" + "=" * 65)
    print("ARBORIS - REVISION BOTANICA")
    print("=" * 65)

    print(f"Archivo:    {row['filename']}")
    print(f"Especie:   {row['species_code']}")
    print(f"Individuo: {row['individual']}")
    print(f"Evidencia: {row['evidence_type']}")

    if not show_photo(row):
        return

    print("\nObserva solamente lo que realmente muestra la fotografia.")
    print("Si un caracter no puede determinarse, usa incierto o no_visible.")

    for trait, title, options in QUESTIONS:
        value = ask_question(title, options)

        if value == "no_visible":
            row[f"{trait}_value"] = ""
            row[f"{trait}_visibility"] = "no_visible"
            row[f"{trait}_confidence"] = ""
        elif value == "incierto":
            row[f"{trait}_value"] = ""
            row[f"{trait}_visibility"] = "visible"
            row[f"{trait}_confidence"] = "incierto"
        else:
            row[f"{trait}_value"] = value
            row[f"{trait}_visibility"] = "visible"
            row[f"{trait}_confidence"] = "alta"

    save_rows(rows)

    print("\nRegistro guardado correctamente.")
    print("Esta prueba modifico solamente la primera fotografia.")

    input("\nPresiona ENTER para cerrar.")

    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()