from __future__ import annotations

import argparse

from select_next_botanical_question import (
    load_key,
    choose_next_question,
)


def request_evidence(candidates: list[str]) -> dict | None:
    """
    Determina qué evidencia botánica conviene buscar
    a continuación para los candidatos actuales.

    No analiza la fotografía.
    No identifica una especie.
    Sólo genera una solicitud de evidencia.
    """

    key = load_key()

    question = choose_next_question(
        candidates,
        key,
        attempted_questions=set(),
    )

    if question is None:
        return None

    return {
        "question_id": question["id"],
        "character": question["character"],
        "prompt": question["prompt"],
        "candidates": candidates,
        "yes_candidates": question["yes_candidates"],
        "no_candidates": question["no_candidates"],
        "notes": question.get("notes", ""),
    }


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "candidates",
        nargs="+",
        help="Candidatos actuales. Ejemplo: Quillay Peumo Litre",
    )

    args = parser.parse_args()

    request = request_evidence(
        args.candidates
    )

    print()
    print("ÁRBORIS — SOLICITUD DE EVIDENCIA BOTÁNICA")
    print("=" * 55)

    if request is None:
        print()
        print(
            "No hay una pregunta decisoria segura "
            "para estos candidatos."
        )
        return

    print()
    print(
        "Candidatos:",
        ", ".join(request["candidates"]),
    )

    print()
    print(
        "Pregunta:",
        request["question_id"],
    )

    print(
        "Carácter requerido:",
        request["character"],
    )

    print()
    print(
        "Qué necesitamos observar:"
    )

    print(
        request["prompt"]
    )

    print()
    print(
        "Si está presente ->",
        ", ".join(
            request["yes_candidates"]
        ),
    )

    print(
        "Si no está presente ->",
        ", ".join(
            request["no_candidates"]
        ),
    )

    if request["notes"]:
        print()
        print(
            "Nota:",
            request["notes"],
        )


if __name__ == "__main__":
    main()