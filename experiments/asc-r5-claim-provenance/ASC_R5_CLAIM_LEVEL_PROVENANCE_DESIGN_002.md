# ASC — R5 Claim-Level Provenance Contrast — Design v2

**ID:** ASC-R5-CLAIM-PROVENANCE-CONTRAST-001  
**Fecha:** 2026-09-22  
**Estado:** FROZEN DESIGN CANDIDATE / NOT EXECUTED  
**Naturaleza:** experimento sintético autónomo, no normativo  
**Deriva de:** residuo documentado de R4  
**Reemplaza para ejecución:** Design v1, que se conserva como evidencia histórica

## 1. Corrección desde v1

La auditoría `ASC-R5-DESIGN-ADV-001` detectó fuga posicional porque el vocabulario de estados podía leerse en el mismo orden que C1–C5.

v2 corrige esto mediante:

- vocabulario declarado explícitamente como conjunto sin orden semántico;
- orden idéntico en CONTROL y TREATMENT, deliberadamente no alineado con C1–C5;
- paquetes exactos congelados;
- instrucción exacta común congelada;
- rúbrica ciega congelada.

## 2. Fuente

`R5_SOURCE_001.svg`

SHA-256:

`f73dd125a91a17d0034752ecfd8edacdbc44e47394273ad1c1fa9e636a39bd87`

Hash verificado durante la auditoría de diseño.

## 3. Artefactos exactos de ejecución

Instrucción común del productor:

`R5_PRODUCER_INSTRUCTION_001.txt`

SHA-256:

`5e6535a0e4cdb0065f4963c04d7ce20f303ebfef387db7582bd60dffc1f0458c`

Control:

`R5_CONTROL_PACKAGE_001.txt`

SHA-256:

`919274b8e16e6bd985aba3b100ab5623f167df96ec35bd634be1d0bff7afc769`

Tratamiento:

`R5_TREATMENT_PACKAGE_001.txt`

SHA-256:

`2a74d36ab137b2dd9af95d527b94ce68a81aed79d0ce7809ff24f580cad9c6e8`

Rúbrica:

`R5_BLIND_AUDIT_RUBRIC_001.md`

## 4. Variable experimental

```text
EXPLICIT_CLAIM_STATUS_BINDING
```

Las condiciones conservan la misma fuente, claims, vocabulario, tarea y formato esperado.

La diferencia material prevista es exclusivamente que TREATMENT contiene bindings explícitos C1–C5 y CONTROL no.

## 5. Claims primarios

```text
C1: Hay dos elementos circulares.
C2: El elemento izquierdo es mayor que el derecho.
C3: Los elementos emiten luz.
```

Clave:

```text
C1 → DERIVED_VISUAL_OBSERVATION
C2 → DERIVED_RELATIVE_OBSERVATION
C3 → INTERPRETATION_HYPOTHESIS
```

## 6. Sentinelas secundarios

```text
C4: Diámetro aproximado: 40 cm.
C5: La función exacta no está establecida.
```

No participan del veredicto primario.

## 7. Ejecución

Cada condición debe ejecutarse en contexto fresco separado con:

- misma fuente exacta;
- misma instrucción común;
- mismo modelo/versión o agente;
- mismo formato de salida;
- parámetros equivalentes;
- metadata de ejecución registrada.

Si el ejecutor soporta seed o controles deterministas, deben registrarse y mantenerse iguales. Si no los soporta, la variabilidad de ejecución debe declararse como limitación y no resolverse por repetición oportunista.

No se permite seleccionar el mejor output de múltiples corridas.

## 8. Auditoría

La auditoría sigue `R5_BLIND_AUDIT_RUBRIC_001.md`.

Productor y auditor son roles separados. No se exige aquí que sean personas/modelos físicos distintos; esa decisión permanece OPEN.

## 9. Límites

Este diseño no:

- cambia ASC v0.1;
- integra `tools/asc/compile_asc.mjs`;
- convierte `CLAIM` en unidad normativa;
- valida Precision Provenance;
- valida Visual Authority Amplification;
- cierra Epistemic Authority Preservation;
- establece suficiencia para generalización.

## 10. Gate

```text
DESIGN V1:
PARTIAL / PRESERVED HISTORICALLY

DESIGN V2:
FROZEN CANDIDATE

SOURCE:
FROZEN

CONTROL PACKAGE:
FROZEN

TREATMENT PACKAGE:
FROZEN

PRODUCER INSTRUCTION:
FROZEN

BLIND AUDIT RUBRIC:
FROZEN

EXECUTED:
NO

NEXT:
VALIDATE DESIGN V2 WITH ASC
```
