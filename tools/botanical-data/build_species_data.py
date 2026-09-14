import json
import re
import unicodedata
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[2]

MASTER_FILE = (
    ROOT
    / "data"
    / "source"
    / "Base_botanica_Pokedex_flora_Master.xlsx"
)

OUTPUT_DIR = (
    ROOT
    / "tools"
    / "botanical-data"
    / "output"
)


def normalize_species_id(species_id):
    """
    SP-006 -> SP006
    """
    return str(species_id).replace("-", "").strip()


def normalize_text(value):
    """
    Normaliza texto para comparaciones internas.

    Ejemplos:
    'Texto libre'  -> 'texto_libre'
    'texto_libre' -> 'texto_libre'
    'Texto-Libre' -> 'texto_libre'
    """
    if value is None:
        return ""

    text = str(value).strip().lower()

    text = unicodedata.normalize(
        "NFKD",
        text
    )

    text = "".join(
        char
        for char in text
        if not unicodedata.combining(char)
    )

    text = re.sub(
        r"[\s\-]+",
        "_",
        text
    )

    return text


def split_states(value):
    """
    entero|dentado|variable
    ->
    ["entero", "dentado", "variable"]
    """
    if pd.isna(value):
        return []

    return [
        item.strip()
        for item in str(value).split("|")
        if item.strip()
    ]


def clean_value(value):
    """
    Convierte NaN de pandas a None
    y limpia espacios.
    """
    if pd.isna(value):
        return None

    if isinstance(value, str):
        return value.strip()

    # Convierte tipos numpy/pandas a tipos Python
    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            pass

    return value


def load_sheet(name):
    return pd.read_excel(
        MASTER_FILE,
        sheet_name=name,
    )


def safe_filename(value):
    """
    Genera un nombre simple para archivos.
    """
    value = normalize_text(value)
    value = re.sub(
        r"[^a-z0-9_]+",
        "_",
        value
    )

    return value.strip("_")


def build_species(
    species,
    relations,
    character_lookup,
    source_lookup,
):
    warnings = []
    output_characters = []

    for _, relation in relations.iterrows():

        character_id = clean_value(
            relation.get("caracter_id")
        )

        # -----------------------------------------------------
        # Verificar que el carácter exista
        # -----------------------------------------------------

        if character_id not in character_lookup:

            warnings.append(
                {
                    "type": "unknown_character",
                    "character_id": character_id,
                    "message": (
                        f"{character_id} aparece en "
                        "Especie_Caracter pero no en Caracteres."
                    ),
                }
            )

            continue

        definition = character_lookup[
            character_id
        ]

        expected_states = split_states(
            relation.get("estado_esperado")
        )

        allowed_states = split_states(
            definition.get(
                "estados_permitidos"
            )
        )

        data_type = clean_value(
            definition.get("tipo_dato")
        )

        normalized_data_type = normalize_text(
            data_type
        )

        # -----------------------------------------------------
        # VALIDACIÓN DE ESTADOS
        # -----------------------------------------------------
        #
        # Los caracteres de texto libre pueden contener
        # cualquier descripción.
        #
        # Se reconocen variantes como:
        # texto libre
        # texto_libre
        # texto-libre
        # -----------------------------------------------------

        is_free_text = (
            normalized_data_type
            in {
                "texto_libre",
                "texto",
                "free_text",
            }
        )

        if is_free_text:

            invalid_states = []

        else:

            invalid_states = [
                state
                for state in expected_states
                if state not in allowed_states
            ]

        if invalid_states:

            warnings.append(
                {
                    "type": "state_not_allowed",
                    "character_id": character_id,
                    "character_name": clean_value(
                        definition.get(
                            "nombre_caracter"
                        )
                    ),
                    "invalid_states":
                        invalid_states,
                    "allowed_states":
                        allowed_states,
                }
            )

        # -----------------------------------------------------
        # FUENTE
        # -----------------------------------------------------

        source_id = clean_value(
            relation.get("fuente_id")
        )

        source_data = None

        if (
            source_id is not None
            and source_id in source_lookup
        ):

            source_data = {
                key: clean_value(value)
                for key, value
                in source_lookup[
                    source_id
                ].items()
            }

        # -----------------------------------------------------
        # SALIDA DEL CARÁCTER
        # -----------------------------------------------------

        output_characters.append(
            {
                "characterId":
                    character_id,

                "group":
                    clean_value(
                        definition.get(
                            "grupo"
                        )
                    ),

                "name":
                    clean_value(
                        definition.get(
                            "nombre_caracter"
                        )
                    ),

                "dataType":
                    data_type,

                "expectedStates":
                    expected_states,

                "allowedStates":
                    allowed_states,

                "variability":
                    clean_value(
                        relation.get(
                            "variabilidad"
                        )
                    ),

                "imageObservability":
                    clean_value(
                        relation.get(
                            "detectable_imagen"
                        )
                    ),

                "fieldObservability":
                    clean_value(
                        relation.get(
                            "verificable_campo"
                        )
                    ),

                "diagnosticPower":
                    clean_value(
                        relation.get(
                            "poder_diagnostico"
                        )
                    ),

                "interactionSafety":
                    clean_value(
                        relation.get(
                            "interaction_safety"
                        )
                    ),

                "observationCost":
                    clean_value(
                        relation.get(
                            "costo_observacion"
                        )
                    ),

                "confidence":
                    clean_value(
                        relation.get(
                            "confianza"
                        )
                    ),

                "sourceId":
                    source_id,

                "source":
                    source_data,

                "notes":
                    clean_value(
                        relation.get(
                            "notas"
                        )
                    ),

                "validation": {
                    "valid":
                        len(
                            invalid_states
                        ) == 0,

                    "invalidStates":
                        invalid_states,
                },
            }
        )

    # ---------------------------------------------------------
    # FICHA COMPUTABLE
    # ---------------------------------------------------------

    output = {
        "dataVersion":
            "pilot-master-v0.1",

        "source":
            str(
                MASTER_FILE.relative_to(
                    ROOT
                )
            ).replace("\\", "/"),

        "species": {
            "id":
                normalize_species_id(
                    species[
                        "species_id"
                    ]
                ),

            "masterId":
                clean_value(
                    species[
                        "species_id"
                    ]
                ),

            "scientificName":
                clean_value(
                    species[
                        "nombre_cientifico"
                    ]
                ),

            "commonName":
                clean_value(
                    species[
                        "nombre_comun"
                    ]
                ),

            "family":
                clean_value(
                    species[
                        "familia"
                    ]
                ),

            "order":
                clean_value(
                    species[
                        "orden"
                    ]
                ),

            "habit":
                clean_value(
                    species[
                        "habito"
                    ]
                ),

            "origin":
                clean_value(
                    species[
                        "origen"
                    ]
                ),

            "endemicChile":
                clean_value(
                    species[
                        "endemismo"
                    ]
                ),

            "pilotStatus":
                clean_value(
                    species[
                        "estado_piloto"
                    ]
                ),

            "notes":
                clean_value(
                    species[
                        "notas"
                    ]
                ),
        },

        "characters":
            output_characters,

        "validation": {
            "warningCount":
                len(warnings),

            "warnings":
                warnings,
        },
    }

    return output


def main():

    print(
        "\nÁRBORIS — VALIDADOR BOTÁNICO DEL PILOTO"
    )

    print("=" * 60)

    # ---------------------------------------------------------
    # Cargar hojas
    # ---------------------------------------------------------

    species_df = load_sheet(
        "Especies_Piloto"
    )

    characters_df = load_sheet(
        "Caracteres"
    )

    relations_df = load_sheet(
        "Especie_Caracter"
    )

    sources_df = load_sheet(
        "Fuentes"
    )

    # ---------------------------------------------------------
    # Lookups
    # ---------------------------------------------------------

    character_lookup = (
        characters_df
        .set_index("caracter_id")
        .to_dict("index")
    )

    source_lookup = {}

    if "fuente_id" in sources_df.columns:

        source_lookup = (
            sources_df
            .set_index("fuente_id")
            .to_dict("index")
        )

    # ---------------------------------------------------------
    # Preparar salida
    # ---------------------------------------------------------

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    total_warnings = 0
    summary = []

    # ---------------------------------------------------------
    # Validar todas las especies piloto
    # ---------------------------------------------------------

    for _, species in species_df.iterrows():

        master_id = clean_value(
            species.get("species_id")
        )

        if master_id is None:
            continue

        relations = relations_df[
            relations_df[
                "species_id"
            ] == master_id
        ]

        output = build_species(
            species=species,
            relations=relations,
            character_lookup=
                character_lookup,
            source_lookup=
                source_lookup,
        )

        normalized_id = (
            normalize_species_id(
                master_id
            )
        )

        scientific_name = clean_value(
            species.get(
                "nombre_cientifico"
            )
        )

        common_name = clean_value(
            species.get(
                "nombre_comun"
            )
        )

        species_slug = safe_filename(
            scientific_name
        )

        output_file = (
            OUTPUT_DIR
            / (
                f"{normalized_id}_"
                f"{species_slug}"
                ".preview.json"
            )
        )

        with output_file.open(
            "w",
            encoding="utf-8",
        ) as f:

            json.dump(
                output,
                f,
                ensure_ascii=False,
                indent=2,
            )

        warning_count = (
            output[
                "validation"
            ][
                "warningCount"
            ]
        )

        character_count = len(
            output["characters"]
        )

        total_warnings += (
            warning_count
        )

        summary.append(
            {
                "id":
                    normalized_id,

                "commonName":
                    common_name,

                "scientificName":
                    scientific_name,

                "characters":
                    character_count,

                "warnings":
                    warning_count,

                "output":
                    str(
                        output_file.relative_to(
                            ROOT
                        )
                    ),
            }
        )

        # -----------------------------------------------------
        # Resultado individual
        # -----------------------------------------------------

        print(
            f"\n{normalized_id} — "
            f"{common_name}"
        )

        print(
            f"  Especie: "
            f"{scientific_name}"
        )

        print(
            f"  Caracteres: "
            f"{character_count}"
        )

        print(
            f"  Advertencias: "
            f"{warning_count}"
        )

        for warning in (
            output[
                "validation"
            ][
                "warnings"
            ]
        ):

            print(
                "\n  ADVERTENCIA:"
            )

            print(
                json.dumps(
                    warning,
                    ensure_ascii=False,
                    indent=2,
                )
            )

    # ---------------------------------------------------------
    # Guardar resumen JSON
    # ---------------------------------------------------------

    summary_file = (
        OUTPUT_DIR
        / "validation_summary.json"
    )

    with summary_file.open(
        "w",
        encoding="utf-8",
    ) as f:

        json.dump(
            {
                "speciesCount":
                    len(summary),

                "totalWarnings":
                    total_warnings,

                "species":
                    summary,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    # ---------------------------------------------------------
    # Resumen final
    # ---------------------------------------------------------

    print(
        "\n"
        + "=" * 60
    )

    print(
        "RESUMEN DEL PILOTO"
    )

    print(
        "=" * 60
    )

    for item in summary:

        status = (
            "OK"
            if item[
                "warnings"
            ] == 0
            else "REVISAR"
        )

        print(
            f"{status:7} "
            f"{item['id']}  "
            f"{item['commonName']:<12} "
            f"caracteres="
            f"{item['characters']:<2} "
            f"advertencias="
            f"{item['warnings']}"
        )

    print(
        "\nEspecies validadas: "
        f"{len(summary)}"
    )

    print(
        "Advertencias totales: "
        f"{total_warnings}"
    )

    print(
        "\nResumen guardado en:"
    )

    print(
        summary_file.relative_to(
            ROOT
        )
    )

    print(
        "\nSe generaron únicamente "
        "archivos de vista previa."
    )

    print(
        "No se modificó ningún archivo "
        "de data/species/."
    )


if __name__ == "__main__":
    main()