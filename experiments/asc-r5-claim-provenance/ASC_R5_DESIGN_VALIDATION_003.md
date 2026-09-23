# ASC — Validación de diseño R5 v3

**ID:** ASC-R5-DESIGN-VALIDATION-003  
**Fecha:** 2026-09-22  
**Objeto:** diseño v3 congelado de `ASC-R5-CLAIM-PROVENANCE-CONTRAST-001`  
**Resultado:** PASS — DESIGN VALIDATED FOR EXPERIMENTAL EXECUTION  
**Ejecución del experimento:** NO  
**Naturaleza:** validación interna ASC del diseño; no valida la hipótesis ni generaliza resultados

## AUDITORÍA

Se revisaron fuente, claims, paquetes neutrales A/B, instrucción común, manifest, protocolo de visibilidad y rúbrica ciega.

Se verificó:

- fuente congelada por SHA-256;
- instrucción común congelada;
- paquetes A/B congelados;
- vocabulario de estados idéntico y sin orden semántico;
- claims C1–C5 idénticos entre condiciones;
- C1–C3 como únicos claims del veredicto primario;
- C4/C5 como sentinelas secundarios;
- eliminación de etiquetas visibles CONTROL/TREATMENT para el productor;
- separación de visibilidad de productor y auditor;
- contexto fresco para auditoría;
- ausencia de modificación de ASC v0.1;
- generalización mantenida OPEN.

La diferencia semántica deliberada entre A y B queda limitada al bloque de `EXPLICIT_CLAIM_STATUS_BINDING`.

## INCONSISTENCIAS

No se detecta una inconsistencia material que invalide el diseño v3.

Los defects registrados en v1 y v2 permanecen preservados históricamente y no se trasladan al paquete ejecutable v3:

- fuga posicional del vocabulario: corregida;
- señal CONTROL/TREATMENT visible al productor: corregida;
- contrato de visibilidad del auditor: explicitado.

La asignación A/B → CONTROL/TREATMENT existe solo en el manifest y debe permanecer fuera de la vista del productor.

## VACÍOS / OMISIONES

Permanecen abiertos y no bloquean el diseño:

- variabilidad estocástica del ejecutor si no existe seed;
- suficiencia de una sola ejecución para cualquier generalización posterior;
- necesidad o no de replicaciones futuras;
- relación de R5 con `tools/asc/compile_asc.mjs`;
- validez general de CLAIM como unidad epistemológica;
- Precision Provenance, Visual Authority Amplification y Epistemic Authority Preservation.

Ninguno debe cerrarse durante la ejecución de R5.

## REDUNDANCIAS

Los designs v1 y v2 y sus paquetes defectuosos se conservan de forma intencional como evidencia histórica. No deben utilizarse para ejecución.

La repetición de source/claims/vocabulario entre A y B es deliberada y necesaria para aislar la variable experimental.

## Validación final

```text
SOURCE HASH:
PASS

PRODUCER INSTRUCTION FREEZE:
PASS

PACKAGE A FREEZE:
PASS

PACKAGE B FREEZE:
PASS

RUBRIC FREEZE:
PASS

VISIBILITY PROTOCOL FREEZE:
PASS

PRIMARY/SECONDARY CLAIM SEPARATION:
PASS

POSITIONAL LEAK CONTROL:
PASS

CONDITION-LABEL LEAK CONTROL:
PASS

PRODUCER/AUDITOR ROLE SEPARATION:
PASS

SINGLE MATERIAL VARIABLE:
PASS

ASC v0.1 CHANGE:
NO

GENERALIZATION:
OPEN

DESIGN V3:
VALIDATED FOR EXPERIMENTAL EXECUTION

R5:
NOT EXECUTED
```

## Próximo gate

La siguiente operación autorizada por esta validación es ejecutar R5 exactamente con los artefactos congelados de v3.

Cualquier modificación material de source, claims, paquetes, instrucción, rúbrica o protocolo invalida esta validación y exige nueva auditoría.
