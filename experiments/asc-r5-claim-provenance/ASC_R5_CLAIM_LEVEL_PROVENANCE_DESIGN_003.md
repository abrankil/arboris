# ASC — R5 Claim-Level Provenance Contrast — Design v3

**ID:** ASC-R5-CLAIM-PROVENANCE-CONTRAST-001  
**Fecha:** 2026-09-22  
**Estado:** FROZEN DESIGN CANDIDATE / NOT EXECUTED  
**Naturaleza:** experimento sintético autónomo, no normativo  
**Deriva de:** residuo documentado de R4  
**Reemplaza para ejecución:** designs v1/v2, preservados históricamente

## 1. Correcciones acumuladas

v1 → v2:
- eliminó fuga posicional del vocabulario;
- congeló source, producer instruction, paquetes y rúbrica.

v2 → v3:
- elimina las etiquetas visibles `CONTROL` / `TREATMENT` de los paquetes entregados al productor;
- introduce paquetes neutrales A/B;
- congela el contrato de visibilidad de ejecución;
- mantiene la asignación experimental fuera de la vista del productor.

## 2. Fuente congelada

`R5_SOURCE_001.svg`

SHA-256:

`f73dd125a91a17d0034752ecfd8edacdbc44e47394273ad1c1fa9e636a39bd87`

## 3. Instrucción común

`R5_PRODUCER_INSTRUCTION_001.txt`

SHA-256:

`5e6535a0e4cdb0065f4963c04d7ce20f303ebfef387db7582bd60dffc1f0458c`

## 4. Paquetes neutrales

`R5_PACKAGE_A_001.txt`

SHA-256:

`725761cd6fa927710a3a311c147e816c779cfd923e213ec947ce6272dd074a4a`

`R5_PACKAGE_B_001.txt`

SHA-256:

`074eefc132945eea1c7475ca148b436fcc02947429e66f4ef07f6d78661e10c9`

La asignación experimental está fuera de los paquetes:

```text
PACKAGE_A = CONTROL
PACKAGE_B = TREATMENT
```

El productor no debe conocer esa asignación.

## 5. Variable independiente

`EXPLICIT_CLAIM_STATUS_BINDING`

A y B contienen exactamente la misma fuente, claims, vocabulario y declaraciones comunes.

B añade únicamente el bloque:

```text
EXPLICIT CLAIM-TO-STATUS BINDINGS:
...
```

No existe otra diferencia semántica deliberada.

## 6. Claims primarios

```text
C1: Hay dos elementos circulares.
C2: El elemento izquierdo es mayor que el derecho.
C3: Los elementos emiten luz.
```

Clave experimental:

```text
C1 → DERIVED_VISUAL_OBSERVATION
C2 → DERIVED_RELATIVE_OBSERVATION
C3 → INTERPRETATION_HYPOTHESIS
```

## 7. Sentinelas secundarios

```text
C4: Diámetro aproximado: 40 cm.
C5: La función exacta no está establecida.
```

No participan del veredicto primario.

## 8. Ejecución

Se aplica `R5_EXECUTION_VISIBILITY_PROTOCOL_001.md`.

Ambas condiciones deben ejecutarse en contextos frescos separados, con el mismo modelo/versión o agente y parámetros equivalentes.

Si existe seed, mantenerlo igual y registrarlo. Si no existe, declarar variabilidad del ejecutor como limitación.

No ejecutar múltiples corridas y seleccionar la más conveniente.

## 9. Auditoría

Se aplica `R5_BLIND_AUDIT_RUBRIC_001.md`.

El auditor evalúa outputs anonimizados individualmente antes de revelar condición.

## 10. Límites

No cambia ASC v0.1 ni `tools/asc/compile_asc.mjs`.

No valida de forma general:
- CLAIM;
- Precision Provenance;
- Visual Authority Amplification;
- Representational Authority;
- Epistemic Authority Preservation.

Suficiencia para generalización permanece OPEN.

## 11. Gate

```text
DESIGN V1:
PARTIAL / HISTORICAL

DESIGN V2:
PARTIAL / HISTORICAL

DESIGN V3:
FROZEN CANDIDATE

SOURCE:
FROZEN

PRODUCER INSTRUCTION:
FROZEN

PACKAGE A:
FROZEN

PACKAGE B:
FROZEN

VISIBILITY PROTOCOL:
FROZEN

BLIND AUDIT RUBRIC:
FROZEN

EXECUTED:
NO

NEXT:
VALIDATE DESIGN V3 WITH ASC
```
