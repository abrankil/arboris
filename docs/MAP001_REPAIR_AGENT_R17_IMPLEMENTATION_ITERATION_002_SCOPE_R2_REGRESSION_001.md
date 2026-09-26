# MAP-001 — Repair Agent R17 Implementation Iteration 002 — Scope R2 Regression 001

Fecha: 2026-09-24
Artefacto auditado: docs/MAP001_REPAIR_AGENT_R17_IMPLEMENTATION_ITERATION_002_SCOPE_R2.md
Head auditado: ff4a1fe4e5382884cf6607303cd103851344186f
Estado: PASS_AT_SCOPE_LEVEL
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_READY: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-R17-I2-SCOPE-R2-REGRESSION-001

## 2. AUDITORÍA

R2 resuelve los dos blockers detectados en la auditoría inicial del scope.

I2-S1 queda resuelto al fijar `executeMap001RepairGate` como único entrypoint ejecutable soportado y exigir que `validateAndApplyMap001Repair` deje de ser una API pública exportada.

I2-S2 queda resuelto al permitir modificaciones test-only en las suites E5.2/E5.3 para demostrar propagación fail-closed, mientras sus implementaciones permanecen fuera de alcance.

El alcance sigue siendo estrictamente menor que R17 y no introduce provider/model, nueva persistencia, migración de hash ni autoridad adicional.

## 3. Regresión dirigida

### I2-S1 — PASS AT SCOPE LEVEL

El boundary normalizado ya tiene una autoridad de entrada única.

No queda permitido un bypass público alternativo.

La migración de tests que hoy importan directamente el core está contemplada explícitamente dentro del scope.

### I2-S2 — PASS AT SCOPE LEVEL

La separación:

```text
E5.2/E5.3 implementation = immutable in I2
E5.2/E5.3 tests = may be extended
```

permite producir la evidencia negativa end-to-end sin ampliar autoridad.

## 4. Regresión acumulada del scope

Se preservan:

- no cambio a `logicalSha256`;
- no migración de hash profile;
- no cambio de E5.2/E5.3 implementation;
- no cambio de schemas;
- no provider/model/transport;
- no observability delivery;
- no automatic retry;
- E5.3 como única frontera durable;
- MINIMAL_CHANGE_EXECUTABLE_RULE sigue OPEN;
- CANONICAL_JSON_SHA256_V2 sigue OPEN;
- trusted materialization sigue OPEN.

No se detecta reapertura de I1 ni de cierres R17.

## 5. Observación de implementación

La futura implementación debe mantener cuidado con el orden real de hashes dentro de `executeMap001RepairGate`.

El contract gate actual calcula `logicalSha256(parentProposal)` y `logicalSha256(validationReport)` al construir sus argumentos.

Por ello el unsafe-key guard debe ejecutarse antes de llamar `runContractGate`.

Esto ya está exigido por el orden normativo de R2.

No constituye un blocker nuevo.

## 6. INCONSISTENCIAS

No se detectan nuevas inconsistencias bloqueantes.

El rechazo temporal de `__proto__` como dato JSON dentro del boundary E5.1 sigue siendo una compatibilidad fail-closed, no una regla universal del futuro canonical JSON.

## 7. VACÍOS / OMISIONES

No se detecta un vacío nuevo dentro del scope I2 R2.

Permanecen los OPEN declarados sobre pre-normalization runtime values, canonical V2, minimal change, transport y provider.

## 8. REDUNDANCIAS

No se detecta redundancia problemática.

Las tres defensas I2 siguen siendo intencionales:

```text
pointer-token guard
+
artifact-key guard
+
safe own-property writes
```

## 9. Resultado

```text
I2-S1 = RESOLVED AT SCOPE LEVEL
I2-S2 = RESOLVED AT SCOPE LEVEL

NEW_BLOCKING_FINDINGS = 0
NEW_MAJOR_FINDINGS = 0

I2_SCOPE_R2_DIRECTED_REGRESSION = PASS
I2_SCOPE_R2_ACCUMULATED_AUDIT = PASS
I2_IMPLEMENTATION_STARTED = FALSE
```

Procede validación formal del scope I2 R2 con apoyo ASC antes de implementar.
