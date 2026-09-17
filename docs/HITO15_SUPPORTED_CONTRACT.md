@'
# Hito 15 — Contrato de `supported`

Estado: **CERRADO A NIVEL DE CONTRATO E IMPLEMENTACIÓN**. Pendiente únicamente del gate final integrado y cierre documental general del Hito 15.

## Reglas normativas

1. **Dimensiones diagnósticas independientes**

Repetir observaciones del mismo `characterId`, independientemente de foto, origen humano o automático, constituye corroboración de una sola dimensión diagnóstica. Nunca suma una dimensión nueva.

2. **Sin atajo por poder diagnóstico**

`supported` siempre requiere al menos 2 dimensiones diagnósticas independientes y resueltas. Ningún carácter individual permite omitir este requisito.

3. **Variabilidad natural documentada**

Una contradicción no elimina un candidato cuando existe variabilidad natural explícitamente documentada para esa combinación especie–carácter–estado y el contexto aplicable.

En ese caso la evidencia se considera inconcluyente para ese candidato: no aporta soporte ni conflicto.

Si no existe una excepción documentada aplicable, la contradicción continúa siendo un conflicto explícito y elimina al candidato.

No existe un umbral genérico de discrepancias toleradas.

## Contrato de `supported`

`supported` requiere simultáneamente:

1. un único candidato restante;
2. ausencia de conflicto explícito;
3. al menos 2 dimensiones diagnósticas independientes resueltas;
4. ningún atajo basado en poder diagnóstico.

## Capa complementaria de variabilidad

El motor puede consumir conocimiento de variabilidad explícitamente documentado mediante:

- `data/botanical/character_variability.json`
- `data/botanical/contexts.json`

Estos archivos **no forman parte de los ocho JSON derivados reproduciblemente del Master Botánico 2.0**.

Los ocho derivados del Master continúan siendo:

- `metadata.json`
- `species.json`
- `characters.json`
- `species_characters.json`
- `sources.json`
- `glossary.json`
- `photos.json`
- `model_errors.json`

`character_variability.json` y `contexts.json` constituyen una capa canónica complementaria del motor de identificación. No modifican ni reemplazan los datos derivados del Master y no deben presentarse como exportación del Excel fuente.

Toda excepción de variabilidad debe ser explícita, identificable por `species_id` y `caracter_id`, y asociarse a un contexto documentado cuando corresponda. La ausencia de una excepción documentada nunca debe interpretarse como tolerancia implícita.

## Primer caso validado

El primer caso incorporado corresponde a:

- especie: `SP-002` — *Lithraea caustica*;
- carácter: `CH-008`;
- estado alternativo documentado: `ausente`;
- contexto: `hojas_de_sombra`;
- frecuencia registrada: `baja`.

Bajo ese contexto, la ausencia perceptible del contraste lámina–nervadura se trata como evidencia inconcluyente para litre, no como conflicto eliminatorio.

El caso contrario también está cubierto por tests: sin contexto de variabilidad documentado, la misma contradicción conserva su capacidad eliminatoria.

## Relación con otros hallazgos de Hito 15

Los hallazgos posteriores tienen contratos independientes:

- C — visible / intentado / resuelto y retry explícito: **cerrado**.
- D — normalización y validación de `candidateIds`: **cerrado**.
- E — unicidad `(species_id, caracter_id)` en relaciones computables: **cerrado**.

Este documento no redefine esos contratos.

## Validación

La implementación debe conservar tests que demuestren como mínimo:

- variabilidad documentada → inconcluyente, no eliminación;
- misma contradicción sin contexto documentado → eliminación;
- dos o más dimensiones independientes para `supported`;
- ausencia de atajo por poder diagnóstico.

El cierre general de Hito 15 requiere además superar el gate integrado definido por el proyecto mediante:

```powershell
npm.cmd test