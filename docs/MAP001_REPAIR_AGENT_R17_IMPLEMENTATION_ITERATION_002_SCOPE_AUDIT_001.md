# MAP-001 — Repair Agent R17 Implementation Iteration 002 — Scope Audit 001

Fecha: 2026-09-24
Artefacto auditado: docs/MAP001_REPAIR_AGENT_R17_IMPLEMENTATION_ITERATION_002_SCOPE.md
Head auditado: 332494dbc02fc4bc8cc4051606847e7ce2e5bbc0
Estado: CORRECTION_REQUIRED
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_READY: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-R17-I2-SCOPE-AUDIT-001

ASC compila restricciones y confronta el scope con la superficie ejecutable actual. No implementa I2.

## 2. AUDITORÍA

La selección de I2 es coherente con R17: cerrar prototype-safety local de E5.1 antes de introducir provider/transport o migrar hashes reduce riesgo sin ampliar autoridad.

El scope distingue correctamente:

- pointer-target safety;
- own-property write safety;
- legacy-hash special-key safety;
- boundary posterior a la normalización JSON actual;
- no migración de LEGACY_LOGICAL_SHA256_V1.

La revisión adversarial encuentra dos vacíos que impiden validar el scope en su forma actual.

## 3. I2-S1 — BLOCKER — existe un segundo entrypoint exportado que puede saltarse el boundary normalizado

El módulo E5.1 actual exporta:

```text
executeMap001RepairGate(...)
validateAndApplyMap001Repair(...)
```

`executeMap001RepairGate` realiza la normalización JSON y el contract pre/post gate.

`validateAndApplyMap001Repair` puede invocarse directamente y calcula hashes legacy de parent/report/repair/candidate sin pasar por esa normalización ni por el orden de guards que I2 propone.

La suite actual importa y llama directamente ambos entrypoints.

### Impacto

Si I2 agrega el unsafe-key guard únicamente alrededor del flujo de `executeMap001RepairGate`, el módulo seguiría exponiendo una ruta ejecutable capaz de:

```text
caller
→ validateAndApplyMap001Repair
→ legacy hash
```

sin demostrar que el input pertenece al `E5_1_NORMALIZED_JSON_BOUNDARY`.

Entonces el claim:

```text
PROTOTYPE_SAFE_REPAIR_APPLICATION
= PASS_WITHIN_E5_1_NORMALIZED_JSON_BOUNDARY
```

sería cierto solo para uno de dos entrypoints exportados, sin que el contrato identifique cuál es la autoridad pública.

### Corrección requerida

El scope debe congelar una única autoridad de entrada.

Opción seleccionada para R2:

```text
executeMap001RepairGate
= sole supported executable E5.1 entrypoint
```

y:

```text
validateAndApplyMap001Repair
= internal deterministic core
= not exported
= callable only after normalized-artifact guards + contract preconditions
```

Los tests unitarios que hoy llaman al core directamente deben migrarse a través del entrypoint autoritativo o a helpers explícitamente internos sin reabrir una API pública bypass.

I2-S1 = BLOCKER.

## 4. I2-S2 — BLOCKER — el criterio “no E5.2/E5.3 action” no es demostrable con la allowlist de archivos actual

El scope exige como criterio adversarial:

```text
unsafe special-key case
→ fail closed
→ no prototype mutation
→ no child accepted
→ no E5.2/E5.3 action
```

pero la allowlist de I2 autoriza modificar únicamente:

```text
map001_repair_gate_r1.mjs
map001_repair_gate_r1.test.mjs
validate_e5_repair_contracts.py
workflow, si corresponde
```

y prohíbe modificar E5.2/E5.3.

La regresión normal de E5.2/E5.3 puede demostrar no-regresión, pero no prueba por sí sola que un repair hostil específico sea detenido antes de candidate/persistence.

### Impacto

El scope contiene un criterio de aceptación end-to-end sin permitir crear la evidencia dirigida necesaria.

### Corrección requerida

Distinguir implementación de test surface.

I2 puede mantener:

```text
E5.2 implementation = MUST NOT CHANGE
E5.3 implementation = MUST NOT CHANGE
```

pero debe autorizar test-only additions, si son necesarias, en:

```text
map001_repair_transaction_candidate_r1.test.mjs
map001_durable_repair_store_r1.test.mjs
```

para demostrar que un repair con special-key insegura:

```text
fails in E5.1
→ no transaction candidate accepted
→ no durable mutation
```

Alternativamente habría que retirar ese claim del criterio. R2 seleccionará conservar el claim y ampliar únicamente la superficie de tests.

I2-S2 = BLOCKER.

## 5. Observación no bloqueante — límite cross-layer del hash legacy

E5.2 usa `logicalSha256` sobre parent/report en su propio preflight antes de invocar E5.1.

I2 no modifica E5.2 ni el hash legacy.

Por tanto I2 no debe declarar que vuelve seguro todo uso cross-layer de `LEGACY_LOGICAL_SHA256_V1`.

El claim debe permanecer limitado a:

```text
agent-originated Repair R1 / patch data
entering E5.1 through the normalized authoritative entrypoint
```

Los parent/report existentes siguen bajo sus autoridades previas.

La migración/canonical hash V2 permanece OPEN.

## 6. INCONSISTENCIAS

Se detectan dos inconsistencias entre el scope y el código/test surface actual:

1. boundary normalizado declarado vs segundo entrypoint exportado que lo evita;
2. criterio E5.2/E5.3 negativo vs prohibición de añadir evidencia dirigida en sus suites.

No se detecta contradicción con R17 respecto de la elección general de I2.

## 7. VACÍOS / OMISIONES

Falta definir explícitamente:

- autoridad pública única de E5.1;
- disposición de `validateAndApplyMap001Repair`;
- test-only permission para demostrar propagación fail-closed hasta E5.2/E5.3;
- límite del claim respecto de usos legacy hash anteriores a E5.1.

## 8. REDUNDANCIAS

Pointer guard + artifact-key guard + own-data-property write siguen siendo redundancias defensivas intencionales.

No se recomienda eliminar ninguna.

La futura prueba E5.2/E5.3 negativa no sustituye la suite E5.1; demuestra una propiedad de integración distinta.

## 9. Resultado

```text
I2-S1 = BLOCKER
I2-S2 = BLOCKER

NEW_BLOCKING_FINDINGS = 2
NEW_MAJOR_FINDINGS = 0

I2_SCOPE_AUDIT = CORRECTION_REQUIRED
I2_SCOPE_VALIDATION = NOT_YET

I2_IMPLEMENTATION_STARTED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
```

## 10. Gate

Procede corregir el scope I2 y luego ejecutar regresión dirigida de I2-S1/I2-S2 antes de validar el alcance.

No procede todavía implementar E5.1.
