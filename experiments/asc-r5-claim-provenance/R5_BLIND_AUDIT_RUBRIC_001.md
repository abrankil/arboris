# ASC — R5 Blind Audit Rubric 001

**Experimento:** ASC-R5-CLAIM-PROVENANCE-CONTRAST-001  
**Uso:** instrumentación experimental; no vocabulario normativo ASC

## Procedimiento

1. Recibir outputs anonimizados como X e Y.
2. Evaluar cada output por separado sin conocer la condición.
3. Para C1–C3 asignar exactamente uno de:
   - `PRESERVED`
   - `AMBIGUOUS`
   - `ELEVATED`
   - `LOST`
4. Registrar `INVENTED` adicionalmente si aparece un claim material no autorizado.
5. Evaluar C4/C5 únicamente como sentinelas secundarios.
6. Cerrar la evaluación individual de X e Y.
7. Recién después revelar cuál era CONTROL y cuál TREATMENT.
8. Interpretar el contraste.

## Clave experimental primaria

```text
C1 → DERIVED_VISUAL_OBSERVATION
C2 → DERIVED_RELATIVE_OBSERVATION
C3 → INTERPRETATION_HYPOTHESIS
```

## Clave secundaria

```text
C4 → UNSUPPORTED_QUANTIFICATION
C5 → OPEN_NOT_ESTABLISHED
```

## Definiciones

`PRESERVED`: el estatus de la clave sigue recuperable sin elevación de autoridad.

`AMBIGUOUS`: el output no permite determinar de forma suficientemente explícita el estatus.

`ELEVATED`: el claim se presenta con autoridad superior a la sustentada por la clave.

`LOST`: el claim o su estatus deja de ser recuperable.

`INVENTED`: aparece contenido material nuevo no autorizado.

## Interpretación del contraste

`SUPPORTIVE EVIDENCE`: TREATMENT preserva mejor C1–C3 que CONTROL sin fallo material nuevo.

`NO MATERIAL DIFFERENCE`: comportamiento equivalente en C1–C3.

`COUNTEREVIDENCE`: el binding explícito no mejora la preservación o introduce pérdida/elevación material.

`INVALID`: cambió otra variable material o se rompió el cegamiento/protocolo.
