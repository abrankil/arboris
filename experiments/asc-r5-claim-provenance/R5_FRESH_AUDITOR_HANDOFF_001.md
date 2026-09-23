# ASC — R5 Fresh Blind Auditor Handoff

**Experimento:** ASC-R5-CLAIM-PROVENANCE-CONTRAST-001  
**Rol:** auditor ciego  
**Uso:** abrir en un contexto fresco separado de ambos productores

## Material permitido

El auditor recibe únicamente:

1. este documento;
2. output X;
3. output Y.

No recibe correspondencia X/Y → A/B ni A/B → CONTROL/TREATMENT hasta cerrar las evaluaciones individuales.

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

## Procedimiento obligatorio

1. Evaluar X por separado.
2. Para C1–C3 asignar exactamente uno de:
   - PRESERVED
   - AMBIGUOUS
   - ELEVATED
   - LOST
3. Registrar INVENTED adicionalmente si aparece un claim material no autorizado.
4. Evaluar C4/C5 únicamente como sentinelas secundarios.
5. Cerrar y registrar la evaluación de X.
6. Repetir el mismo procedimiento para Y.
7. Cerrar y registrar la evaluación de Y.
8. Detenerse y solicitar únicamente la revelación de correspondencia necesaria para interpretar el contraste.
9. Después de la revelación, clasificar el contraste como:
   - SUPPORTIVE EVIDENCE
   - NO MATERIAL DIFFERENCE
   - COUNTEREVIDENCE
   - INVALID

## Definiciones

`PRESERVED`: el estatus de la clave sigue recuperable sin elevación.

`AMBIGUOUS`: el output no permite determinar de forma suficientemente explícita el estatus.

`ELEVATED`: el claim se presenta con autoridad superior a la sustentada por la clave.

`LOST`: el claim o su estatus deja de ser recuperable.

`INVENTED`: aparece contenido material nuevo no autorizado.

## Interpretación final

`SUPPORTIVE EVIDENCE`: el tratamiento preserva mejor C1–C3 que el control, sin introducir un fallo material nuevo.

`NO MATERIAL DIFFERENCE`: ambas condiciones muestran comportamiento equivalente en C1–C3.

`COUNTEREVIDENCE`: el binding explícito no mejora la preservación o introduce pérdida/elevación material.

`INVALID`: cambió otra variable material o se rompió el cegamiento/protocolo.

## Restricciones de contexto

El auditor no debe consultar:

- repositorio;
- manifest;
- paquetes A/B;
- auditorías de diseño;
- conversación histórica;
- resultados esperados;
- asignación experimental antes de cerrar X e Y.

El auditor no debe inferir la condición por estilo ni por conocimiento externo.
