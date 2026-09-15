from __future__ import annotations

import argparse
from pathlib import Path

from bioclip.predict import CustomLabelsClassifier


SPECIES = [
    "Cryptocarya alba",      # Peumo
    "Lithraea caustica",     # Litre
    "Kageneckia oblonga",    # Bollén
    "Podanthus mitiqui",     # Mitique
    "Colliguaja odorifera",  # Colliguay
    "Quillaja saponaria",    # Quillay
]


def predict_image(image_path: str, top_k: int = 3) -> list[dict]:
    """
    Ejecuta BioCLIP sobre una imagen usando las seis especies
    del piloto Árboris.

    Devuelve los candidatos visuales mejor puntuados.
    No realiza una identificación definitiva.
    """

    image = Path(image_path)

    if not image.exists():
        raise FileNotFoundError(
            f"No se encontró la imagen: {image}"
        )

    classifier = CustomLabelsClassifier(
        cls_ary=SPECIES,
        device="cpu",
    )

    predictions = classifier.predict(str(image))

    return list(predictions)[:top_k]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Árboris — candidatos visuales BioCLIP"
    )

    parser.add_argument(
        "image",
        help="Ruta de la fotografía que se quiere analizar.",
    )

    parser.add_argument(
        "--top-k",
        type=int,
        default=3,
        help="Número de candidatos que se mostrarán (por defecto: 3).",
    )

    args = parser.parse_args()

    print()
    print("ÁRBORIS — CANDIDATOS VISUALES")
    print("=" * 45)
    print(f"Imagen: {args.image}")
    print()
    print("Cargando BioCLIP 2...")

    predictions = predict_image(
        args.image,
        top_k=args.top_k,
    )

    print()
    print("Candidatos visuales:")
    print()

    for position, prediction in enumerate(predictions, start=1):
        print(
            f"{position}. "
            f"{prediction['classification']}: "
            f"{prediction['score']:.4f}"
        )

    print()
    print(
        "Estos resultados son candidatos visuales; "
        "no constituyen una identificación definitiva."
    )


if __name__ == "__main__":
    main()