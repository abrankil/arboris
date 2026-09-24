# MAP-001 — Repair Agent Integration Design R17 — Directed Regression 001

Fecha: 2026-09-23
Artefacto auditado: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_017.md
Head auditado: 9d857ff31da4fd2f878bc477b7a34e7b907e8aa6
Ámbito: R16-N1/R16-N2/R16-N3 + regresión acumulada completa
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_AUTHORIZED: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-R17-DIRECTED-REGRESSION-001

ASC compila restricciones, OPEN, DO NOT INFER y criterios. No ejecuta provider/model, no implementa runtime ni autoriza conexión.

## 2. AUDITORÍA

R17 corrige de forma suficiente a nivel de diseño los tres hallazgos dirigidos de R16.

R16-N1: el authoritative domain deja de materializar el evento completo; solo produce un handoff mínimo, fixed/bounded/no-throw, prohíbe recursive traversal y además excluye handoffs durante AUTHORIZATION_CRITICAL_WINDOW_V1.

R16-N2: CREDENTIAL_LEASE_CAPABILITY_V1 y CREDENTIAL_LEASE_BINDING_ID_V1 quedan separados por autoridad y visibilidad. La capability privada no entra a logical artifacts y el binding público no puede dereferencear secret material.

R16-N3: el claim global exactly-once desaparece. R17 limita correctamente la garantía a live-session single-send, invalida authorizations al cambiar de sesión y representa posibles sends sin outcome demostrable como CALL_OUTCOME_INDETERMINATE.

La regresión acumulada no detecta reapertura material de los cierres anteriores.

## 3. Resultado dirigido

R16-N1 = PASS AT DESIGN LEVEL.
R16-N2 = PASS AT DESIGN LEVEL.
R16-N3 = PASS AT DESIGN LEVEL.

R15-N1/R15-N2 = PASS AT DESIGN LEVEL.
R14-N1/R14-N2 = PASS AT DESIGN LEVEL.
R13-N1/R13-N2 = PASS AT DESIGN LEVEL.
R12-N1/R12-N2 = PASS AT DESIGN LEVEL.
R11-N1..R11-N3 = PASS AT DESIGN LEVEL.
R10-N1..R10-N3 = PASS AT DESIGN LEVEL.
R9-N1..R9-N3 = PASS AT DESIGN LEVEL.
R8-N1..R8-N3 = PASS AT DESIGN LEVEL.
R7-N1..R7-N3 = PASS.
R6-N1..R6-N3 = PASS AT DESIGN LEVEL.
R5-N1..R5-N3 = PASS.
R4-N1/R4-N2 = PASS AT DESIGN LEVEL.
R3-N1/R3-N2 = PASS AT DESIGN LEVEL.
R2-N1 = PASS.
R2-N2 = PASS AT DESIGN LEVEL / EXECUTABLE DEBT OPEN.
R2-N3 = PASS.

RA-I1 = PASS AT DESIGN/PROVENANCE CONTRACT LEVEL.
RA-I2 = PASS.
RA-I3 = PASS.
RA-I4 = PASS AS EXPLICIT OPEN / IMPLEMENTATION BLOCKED.
RA-I5 = PASS AT DESIGN LEVEL / EXECUTABLE DEBT OPEN.
RA-I6 = PASS AT DESIGN-COVERAGE LEVEL.
RA-I7 = PASS.
RA-I8 = PASS.

## 4. R16-N1 — PASS

OBSERVABILITY_EVENT_HANDOFF_V1 closes the pre-publish gap identified in R16.

The authoritative path is limited to a fixed bounded descriptor using already-existing references/digests and bounded codes/counters. It explicitly forbids arbitrary payloads, recursive traversal, network/filesystem/sink lookups and unbounded allocation.

R17 also excludes observability handoffs from the credential-preflight-to-provider-send critical window, preventing telemetry work from being inserted into the most timing-sensitive authorization sequence.

Expansion, formatting and serialization occur only in the isolated observability domain.

Implementation-specific numeric budgets and isolation technology remain OPEN, correctly.

## 5. R16-N2 — PASS

R17 now distinguishes:

CREDENTIAL_LEASE_CAPABILITY_V1
→ private bearer authority inside broker/transport boundary.

CREDENTIAL_LEASE_BINDING_ID_V1
→ public, non-secret, non-dereferenceable correlation identity.

The expected/actual provider envelope, preflight record, authorization package and receipt expose only the binding ID.

The provider send gate requires an internal capability↔binding↔slot/generation/context association and fails closed if that association cannot be demonstrated.

No secret or private capability is moved into resolver-visible evidence.

## 6. R16-N3 — PASS

R17 removes the unsupported crash-persistent exactly-once claim.

The normative claim is now strictly scoped:

AT_MOST_ONE_SEND_ATTEMPT_PER_LIVE_TRANSPORT_SESSION_AUTHORIZATION.

The design supplies:

- a live transport session identity;
- a private single-use call token;
- atomic token consumption before/with send attempt;
- rejection of old-session authorization in a new session;
- no replay after token consumption;
- CALL_OUTCOME_INDETERMINATE when send may have occurred but outcome cannot be proved;
- no MODEL_RESPONSE acceptance from an indeterminate attempt;
- no automatic retry;
- no new durable transport authority.

That scope is compatible with E5.3 remaining the sole durable boundary.

## 7. Concurrency/replay implementation constraint

No new design blocker is opened, but implementation must preserve the already-declared single-use semantics under concurrent delivery of the same authorization.

The executable implementation therefore must make providerCallAuthorizationId/token registration and state transition atomic within the live transport session and regression-test concurrent duplicate submissions.

This is an implementation/test requirement of the existing R17 contract, not a new architectural decision.

## 8. Session identity implementation constraint

R17 already requires a restart to create a distinct transportSessionBindingId and rejects packages from another session.

The concrete ID allocation/binding mechanism remains within the existing OPEN category “IDs / transport session implementation”.

Before implementation authorization it must demonstrate non-reuse within the declared scope and exact binding to the live runtime snapshot/session.

This does not require a new durable authority because the design does not claim crash-persistent exactly-once.

## 9. Cierres acumulados preservados

Se preservan:

- VERIFIED_BYTES == CONSUMED_BYTES;
- executable dependency closure and execution-surface default deny;
- semantic-input default deny;
- authenticated implementation assurance;
- one normative controlled JSON snapshot pipeline;
- LEGACY_LOGICAL_SHA256_V1 vs CANONICAL_JSON_SHA256_V2;
- NO_IMPLICIT_HASH_MIGRATION;
- resolver-owned expected/actual provider envelope binding;
- response observation/extraction replay;
- provider invocation source binding;
- resource-policy layering;
- provider-native identity evidence discipline;
- credential context preflight before provider-call authorization;
- output-only observability + effect isolation;
- E5_HASH_PROFILE_COMPATIBILITY_GATE_V1;
- E5.1 → E5.2 → E5.3;
- E5.3 as sole durable boundary.

## 10. INCONSISTENCIAS

No se detectan nuevas inconsistencias bloqueantes en R17.

La tensión previa entre no-replay y ausencia de durable transport state queda resuelta al reducir explícitamente el claim a una live session y usar INDETERMINATE ante pérdida de outcome.

La tensión previa entre credential handle privado y evidencia pública queda resuelta separando capability y binding identity.

## 11. VACÍOS / OMISIONES

No se detecta un nuevo vacío arquitectónico que bloquee la validación del diseño R17.

Permanecen OPEN de implementación o decisión posterior, ya declarados por R17:

- observability handoff/isolation implementation and numeric budgets;
- private lease capability/public binding implementation;
- transport session and provider-call token implementation;
- fresh-attempt policy after INDETERMINATE;
- optional provider idempotency extension;
- sandbox/enforcement, loader/resolver and exact runtime/toolchain;
- CANONICAL_JSON_NUMBER_POLICY and CANONICAL_JSON_SHA256_V2 implementation;
- hash-profile bridge A/B/C and E5 compatibility implementation path;
- prototype-safe E5.1 repair application + tests;
- MINIMAL_CHANGE_EXECUTABLE_RULE or authority-level contract revision;
- schemas, parser, provider-specific policies and resource values;
- human implementation authorization;
- NEXT_STAGE_ID;
- AUTHORIZED_FOR_ASC.

Estos OPEN no se cierran ni se reinterpretan como PASS ejecutable.

## 12. REDUNDANCIAS

No se detecta redundancia problemática.

Minimal handoff + isolated delivery son defensas distintas contra costo en core y efectos del sink.

Private lease capability + public binding ID separan autoridad secreta de correlación verificable.

transportInvocationId + transportSessionBindingId + providerCallAuthorizationId separan identidad de attempt, sesión efímera y permiso concreto de send.

Expected/actual envelope + call token separan integridad semántica del request y single-use send authority.

## 13. Resultado

R16-N1 = RESOLVED AT DESIGN LEVEL.
R16-N2 = RESOLVED AT DESIGN LEVEL.
R16-N3 = RESOLVED AT DESIGN LEVEL.

NEW_BLOCKING_FINDINGS = 0.
NEW_MAJOR_FINDINGS = 0.

R17_DIRECTED_REGRESSION = PASS.
R17_ACCUMULATED_REGRESSION = PASS_AT_DESIGN_LEVEL.

IMPLEMENTATION_AUTHORIZED = FALSE.
REPAIR_AGENT_CONNECTED = FALSE.
NEXT_STAGE_ID = OPEN.
AUTHORIZED_FOR_ASC = OPEN.

## 14. Gate siguiente

La regresión de R17 no encuentra nuevos blockers de diseño.

Conforme al gate declarado por R17 y al DEVELOPMENT_MANUAL, procede ahora una DESIGN VALIDATION de R17 con apoyo de ASC v0.1.

La validación debe distinguir expresamente:

- diseño coherente/validable;
- OPEN que siguen bloqueando implementación;
- cualquier decisión humana necesaria;
- ausencia de autorización para conectar el repair agent.

No procede todavía implementar ni conectar el repair agent.
