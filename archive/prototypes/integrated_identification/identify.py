from __future__ import annotations

import argparse
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

sys.path.insert(0, str(ROOT / "vision_v04_bioclip"))
sys.path.insert(0, str(ROOT / "vision_v02" / "botanical_key"))

from test_bioclip import predict_image
from select_next_botanical_question import (
    load_key,
    choose_next_question,
    apply_answer,
)


COMMON_NAMES = {
    "Cryptocarya alba": "Peumo",
    "Lithraea caustica": "Litre",
    "Kageneckia oblonga": "Bollén",
    "Podanthus mitiqui": "Mitique",
    "Colliguaja odorifera": "Colliguay",
    "Quillaja saponaria": "Quillay",
}


def ask_answer() -> str:
    """Solicita una respuesta botánica al usuario."""

    while True:
        print()
        answer = input(
            "Respuesta [s = sí / n = no / ? = no puedo observarlo]: "
        ).strip().lower()

        if answer in {"s", "si", "sí"}:
            return "yes"

        if answer in {"n", "no"}:
            return "no"

        if answer in {"?", "ns", "no se", "no sé"}:
            return "unknown"

        print("Respuesta no reconocida. Usa s, n o ?.")


def run_botanical_key(candidates: list[str]) -> None:
    """Recorre la clave adaptativa manteniendo la incertidumbre."""

    key = load_key()
    attempted_questions = set()
    current_candidates = list(candidates)

    while True:

        print()
        print("-" * 55)
        print("Candidatos actuales:", ", ".join(current_candidates))

        if len(current_candidates) == 1:
            print()
            print(f"Hipótesis resultante: {current_candidates[0]}")
            print(
                "Estado: hipótesis botánica obtenida a partir "
                "de la evidencia registrada."
            )
            return

        question = choose_next_question(
            current_candidates,
            key,
            attempted_questions=attempted_questions,
        )

        if question is None:
            print()
            print(
                "No hay otro carácter decisorio disponible "
                "para estos candidatos."
            )
            print(
                "La identificación permanece sin resolver."
            )
            return

        attempted_questions.add(question["id"])

        print()
        print(f"Siguiente carácter diagnóstico [{question['id']}]:")
        print(question["prompt"])

        print()
        print("Sí ->", ", ".join(question["yes_candidates"]))
        print("No ->", ", ".join(question["no_candidates"]))
        print("No puedo observarlo -> conservar candidatos")

        if question.get("notes"):
            print()
            print("Nota:", question["notes"])

        answer = ask_answer()

        if answer == "unknown":
            print()
            print(
                "El carácter no pudo observarse. "
                "No se elimina ningún candidato."
            )
            continue

        updated_candidates = apply_answer(
            current_candidates,
            question,
            answer,
        )

        if not updated_candidates:
            print()
            print(
                "La respuesta contradice los candidatos actuales. "
                "No se fuerza una identificación."
            )
            print(
                "Se conservan los candidatos y se requiere "
                "nueva evidencia."
            )
            return

        current_candidates = updated_candidates


def identify(image_path: str) -> None:

    print()
    print("ÁRBORIS — IDENTIFICACIÓN ASISTIDA")
    print("=" * 55)

    print()
    print("Analizando fotografía...")

    predictions = predict_image(
        image_path,
        top_k=3,
    )

    candidates = []

    print()
    print("Candidatos visuales:")
    print()

    for position, prediction in enumerate(predictions, start=1):

        scientific_name = prediction["classification"]
        common_name = COMMON_NAMES[scientific_name]

        candidates.append(common_name)

        print(
            f"{position}. "
            f"{common_name} "
            f"({scientific_name}) — "
            f"{prediction['score']:.4f}"
        )

    print()
    print(
        "BioCLIP propone candidatos visuales; "
        "no establece una identificación definitiva."
    )

    run_botanical_key(candidates)


def main() -> None:

    parser = argparse.ArgumentParser(
        description=(
            "Árboris — identificación asistida "
            "para las seis especies del piloto."
        )
    )

    parser.add_argument(
        "image",
        help="Ruta de la fotografía.",
    )

    args = parser.parse_args()

    identify(args.image)


if __name__ == "__main__":
    main()