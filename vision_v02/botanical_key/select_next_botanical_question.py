from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Iterable


HERE = Path(__file__).resolve().parent
KEY_PATH = HERE / "botanical_key_pilot.json"

UNKNOWN = {
    "unknown",
    "no_se",
    "no sé",
    "no se",
    "no_puedo_observarlo",
    "no puedo observarlo",
}


# ============================================================
# CARGAR CLAVE
# ============================================================

def load_key(path: Path = KEY_PATH) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def normalize_names(names: Iterable[str]) -> set[str]:
    return {
        str(name).strip()
        for name in names
        if str(name).strip()
    }


# ============================================================
# ELEGIR PRÓXIMA PREGUNTA
# ============================================================

def choose_next_question(
    candidates: Iterable[str],
    key: dict,
    attempted_questions: set[str] | None = None,
) -> dict | None:

    current = normalize_names(candidates)

    if len(current) <= 1:
        return None

    if attempted_questions is None:
        attempted_questions = set()

    best = None
    best_score = -1.0

    for question in key["questions"]:

        # No repetir preguntas ya intentadas.
        if question["id"] in attempted_questions:
            continue

        yes = current.intersection(
            question["yes"]
        )

        no = current.intersection(
            question["no"]
        )

        # La pregunta debe separar realmente
        # los candidatos actuales.
        if not yes or not no:
            continue

        covered = yes | no

        # ----------------------------------------------------
        # REGLA FUNDAMENTAL
        #
        # La pregunta sólo puede utilizarse si contempla
        # TODOS los candidatos actuales.
        #
        # Así evitamos, por ejemplo, usar una pregunta
        # Peumo/Quillay mientras Litre sigue sin resolver.
        # ----------------------------------------------------

        if covered != current:
            continue

        balance = (
            min(len(yes), len(no))
            / max(len(yes), len(no))
        )

        # Como coverage siempre es 1.0 aquí,
        # sólo necesitamos valorar qué tan bien
        # divide la pregunta a los candidatos.
        score = balance

        if score > best_score:

            best_score = score

            best = {
                **question,
                "yes_candidates": sorted(yes),
                "no_candidates": sorted(no),
                "score": round(score, 3),
            }

    return best


# ============================================================
# APLICAR RESPUESTA
# ============================================================

def apply_answer(
    candidates: Iterable[str],
    question: dict,
    answer: str,
) -> list[str]:

    current = normalize_names(candidates)

    normalized = (
        answer
        .strip()
        .lower()
    )

    # La incertidumbre nunca elimina candidatos.
    if normalized in UNKNOWN:
        return sorted(current)

    if normalized in {
        "yes",
        "si",
        "sí",
        "s",
    }:

        compatible = set(
            question["yes"]
        )

    elif normalized in {
        "no",
        "n",
    }:

        compatible = set(
            question["no"]
        )

    else:

        raise ValueError(
            "Respuesta válida: "
            "sí, no, o no sé/no puedo observarlo."
        )

    updated = current.intersection(
        compatible
    )

    # Una contradicción no debe fabricar
    # una identificación por descarte.
    if not updated:
        return sorted(current)

    return sorted(updated)


# ============================================================
# SESIÓN DE IDENTIFICACIÓN
# ============================================================

def run_session(
    candidates: list[str],
) -> None:

    key = load_key()

    current = sorted(
        normalize_names(candidates)
    )

    attempted_questions: set[str] = set()

    print()
    print(
        "ÁRBORIS — CLAVE BOTÁNICA PILOTO"
    )

    print(
        "Candidatos iniciales:",
        ", ".join(current),
    )

    while len(current) > 1:

        question = choose_next_question(
            current,
            key,
            attempted_questions,
        )

        # ----------------------------------------------------
        # NO QUEDA UNA PREGUNTA SEGURA
        # ----------------------------------------------------

        if question is None:

            print()
            print(
                "No hay otro carácter decisorio "
                "aplicable a todos los candidatos "
                "con la evidencia actual."
            )

            print()
            print(
                "Se conservan los candidatos:",
                ", ".join(current),
            )

            print()
            print(
                "Se necesita evidencia adicional "
                "o una nueva fotografía."
            )

            print(
                "Estado recomendado: "
                "hipótesis no resuelta."
            )

            return

        # Registrar la pregunta.
        attempted_questions.add(
            question["id"]
        )

        print()

        print(
            f"[{question['id']}] "
            f"{question['prompt']}"
        )

        print(
            "  Sí ->",
            ", ".join(
                question["yes_candidates"]
            ),
        )

        print(
            "  No ->",
            ", ".join(
                question["no_candidates"]
            ),
        )

        if question.get("notes"):

            print(
                "  Nota:",
                question["notes"],
            )

        answer = input(
            "Respuesta [sí/no/no sé]: "
        )

        normalized_answer = (
            answer
            .strip()
            .lower()
        )

        previous = sorted(current)

        try:

            new_current = apply_answer(
                current,
                question,
                answer,
            )

        except ValueError as error:

            print()
            print(error)

            # Si fue simplemente una entrada inválida,
            # permitimos volver a hacer la misma pregunta.
            attempted_questions.discard(
                question["id"]
            )

            continue

        # ----------------------------------------------------
        # CARÁCTER NO OBSERVABLE
        # ----------------------------------------------------

        if normalized_answer in UNKNOWN:

            print()
            print(
                "Carácter no observable: "
                "se conservan los candidatos."
            )

            print(
                "La pregunta no se repetirá "
                "con esta evidencia."
            )

        # ----------------------------------------------------
        # CONFLICTO
        # ----------------------------------------------------

        elif new_current == previous:

            print()
            print(
                "La respuesta entra en conflicto "
                "con los candidatos actuales."
            )

            print(
                "No se elimina evidencia."
            )

        current = new_current

        print(
            "Candidatos actuales:",
            ", ".join(current),
        )

    # ========================================================
    # RESULTADO
    # ========================================================

    if len(current) == 1:

        print()

        print(
            "Hipótesis resultante:",
            current[0],
        )

        print(
            "Estado recomendado: "
            "hipótesis revisable; "
            "no identificación automática definitiva."
        )


# ============================================================
# EJECUCIÓN
# ============================================================

def main():

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "candidates",
        nargs="+",
        help=(
            "Candidatos actuales. "
            "Ejemplo: Quillay Peumo Litre"
        ),
    )

    args = parser.parse_args()

    run_session(
        args.candidates
    )


if __name__ == "__main__":
    main()
