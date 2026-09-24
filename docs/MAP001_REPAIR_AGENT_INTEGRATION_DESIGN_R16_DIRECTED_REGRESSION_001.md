# MAP-001 — Repair Agent Integration Design R16 — Directed Regression 001

Fecha: 2026-09-23
Artefacto auditado: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_016.md
Head auditado: df3dca7cfc0fcab8ac5f513b11a0c80c6455dadd
Ámbito: R15-N1/R15-N2 + regresión acumulada completa
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_AUTHORIZED: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-R16-DIRECTED-REGRESSION-001

ASC compila restricciones, OPEN, DO NOT INFER y criterios. No ejecuta provider/model, no implementa broker/observability y no autoriza conexión.

## 2. AUDITORÍA

R16 corrige materialmente R15-N1 al añadir effect isolation para delivery: publicación no bloqueante, resource partitioning, timeout isolation, scheduling isolation y failure containment.

R16 también corrige la contradicción temporal principal de R15-N2 al adoptar TWO-PHASE CREDENTIAL PREFLIGHT y construir el expected provider envelope solo después de que resolver conoce y valida credential evidence.

La regresión acumulada no detecta reapertura de los cierres sobre verified-load, executable dependency closure, execution-surface policy, assurance authenticity, controlled JSON pipeline, hash-profile separation, response replay ni E5.1 → E5.2 → E5.3.

Persisten tres brechas: la construcción del evento de observabilidad todavía ocurre dentro del authoritative domain; credentialLeaseId se trata simultáneamente como handle opaco y como dato compartible sin distinguir capability secreta de correlation identity; y la promesa exactly-one provider invocation carece de replay/crash semantics suficientes sin introducir una nueva frontera durable.

## 3. Resultado dirigido

R15-N1 = PARTIAL / BLOCKED BY R16-N1.
R15-N2 = PARTIAL / BLOCKED BY R16-N2 + R16-N3.

R14-N1/R14-N2 = PASS AT DESIGN LEVEL SUBJECT TO R16 FINDINGS.
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

RA-I1 = PARTIAL / CREDENTIAL-CAPABILITY + CALL-CONSUMPTION BINDING INCOMPLETE.
RA-I2 = PASS.
RA-I3 = PASS.
RA-I4 = PASS AS OPEN/BLOCKING.
RA-I5 = PASS AT DESIGN LEVEL / E5.1 EXECUTABLE DEBT OPEN.
RA-I6 = PARTIAL / OBSERVABILITY EVENT-MATERIALIZATION EFFECTS INCOMPLETE.
RA-I7 = PASS.
RA-I8 = PASS.

## 4. R15-N1 — delivery isolation improved

R16 correctly moves sink delivery outside authoritative timeout/cancellation semantics, forbids synchronous/awaited sink delivery and requires bounded resource partitioning.

This resolves the sink/backpressure portion of R15-N1.

The remaining R16-N1 is earlier in the path: event construction itself.

## 5. R16-N1 — observation-event materialization remains inside the authoritative domain

R16 defines:

AUTHORITATIVE DOMAIN
→ build immutable bounded event from already-fixed outputs
→ NON_BLOCKING_OBSERVABILITY_PUBLISH_V1
→ isolated delivery domain.

The isolation guarantees begin after the event already exists.

Building that event can still require allocation, copying, serialization, metadata derivation or other work inside the authoritative process/domain.

Even when the observed result is already fixed, event construction can still:

- allocate memory and trigger resource exhaustion;
- consume CPU before subsequent authoritative work;
- throw or fail before reaching the non-throwing publish primitive;
- copy unexpectedly large nested outputs unless projection is independently bounded;
- execute instrumentation/materialization code within the authoritative runtime.

### Impacto

Observability could still change whether later authoritative work progresses, despite sink delivery itself being isolated.

The contract therefore does not yet prove enable/disable equivalence for the complete observability path.

### Corrección requerida

Define OBSERVABILITY_EVENT_HANDOFF_V1 or equivalent.

Required property:

authoritative transition completes
→ fixed minimal observation descriptor/reference is produced under a strict bounded/no-throw handoff
→ isolated observability domain performs optional expansion/formatting/serialization.

The handoff must specify:

- maximum copy/allocation performed in authoritative domain;
- no unbounded traversal/serialization of authoritative outputs;
- fail-drop semantics if the handoff cannot be created;
- no exception propagation;
- no shared mutable alias;
- no dependency on sink state;
- assurance that enabling/disabling observability cannot change later authoritative behavior.

If full event materialization remains in the authoritative domain, its exact CPU/memory/failure budget and non-interference proof must be explicit and bounded.

R16-N1 = BLOCKER.

## 6. R15-N2 — two-phase sequencing is structurally coherent

R16 now orders credential selection coherently:

preflight request
→ broker/transport context selection
→ resolver verifies preflight evidence
→ resolver builds expected envelope
→ call authorization
→ transport expected/actual equality
→ provider call.

The previous R15 contradiction is removed.

Two new issues remain in the lease/call authority itself.

## 7. R16-N2 — credentialLeaseId may itself be a bearer capability

R16 calls CREDENTIAL_LEASE_V1 an opaque handle and then places credentialLeaseId in:

- CREDENTIAL_PREFLIGHT_RECORD_V1 returned to resolver;
- EXPECTED_PROVIDER_REQUEST_ENVELOPE_V4;
- PROVIDER_CALL_AUTHORIZATION_PACKAGE_V1;
- TRANSPORT_RECEIPT_V11.

The design does not state whether credentialLeaseId is merely a non-secret correlation identifier or a usable broker capability whose possession permits dereference of credential material.

An opaque handle is not automatically safe to expose.

### Impacto

If the identifier is bearer-authoritative, propagating it through logical artifacts, receipts or logs expands the credential attack surface and conflicts with the intended secret-broker boundary even though the raw API key/token is never exposed.

### Corrección requerida

Separate two concepts:

CREDENTIAL_LEASE_CAPABILITY_V1
→ private to secret-broker/transport boundary
→ never enters resolver-visible logical artifacts.

CREDENTIAL_LEASE_BINDING_ID_V1
→ non-secret, non-dereferenceable correlation identity
→ safe for resolver/envelope/receipt binding.

The contract must require:

- binding ID cannot be used to retrieve secret material;
- capability cannot be reconstructed from binding ID;
- broker proves capability ↔ binding ID ↔ slot/generation/context association;
- provider call dereferences only the private capability corresponding to the accepted binding ID;
- logs/evidence contain only binding ID and authorized non-secret context.

If a selected broker exposes only bearer handles, those handles must remain inside the transport/broker domain and a separate public binding identity must be derived.

R16-N2 = BLOCKER.

## 8. R16-N3 — exactly-one provider-call claim lacks replay/crash semantics

R16 requires:

provider invocation = exactly one maximum per authorized transportInvocationId
and introduces PROVIDER_INVOCATION_ALREADY_CONSUMED.

But no state machine or authority is defined for these cases:

- transport sends provider request and crashes before receipt;
- resolver loses connection after call authorization and resends the same package;
- both resolver and transport restart and an old authorization package is replayed;
- provider accepted the request but local outcome is unknown.

The current durable authority remains E5.3, and transport is not granted a durable store.

Therefore a global exactly-once claim cannot be obtained merely from transportInvocationId + an in-memory “consumed” flag.

### Impacto

The system can overclaim at-most-once behavior or accidentally replay an already-sent provider call after an indeterminate failure.

### Corrección requerida

R17 must define a no-replay/crash contract without silently creating a new durable authority.

A compatible class is an ephemeral single-use call authorization:

- PROVIDER_CALL_AUTHORIZATION_PACKAGE is bound to a transportSessionId/session nonce;
- a call token is single-use within that live transport session;
- after transport-session loss, the old authorization is permanently invalid and cannot be replayed in a new session;
- if send outcome is unknown, attempt becomes PROVIDER_CALL_OUTCOME_INDETERMINATE;
- the same attempt/authorization cannot be resumed or resent;
- no MODEL_RESPONSE from an ambiguous/replayed call can be accepted;
- a later fresh invocation is a new explicit attempt with new transportInvocationId and fresh bindings, not an automatic retry.

If stronger crash-persistent exactly-once semantics are desired, that would require a separately authorized durable/idempotency design and cannot be inferred while E5.3 remains the sole durable boundary.

The final claim must be scoped to what the selected mechanism can actually prove.

R16-N3 = BLOCKER.

## 9. Cierres acumulados preservados

Se preservan:

- VERIFIED_BYTES == CONSUMED_BYTES;
- executable dependency closure + execution-surface default deny;
- semantic-input default deny;
- authenticated implementation assurance;
- single controlled JSON snapshot pipeline;
- LEGACY_LOGICAL_SHA256_V1 vs CANONICAL_JSON_SHA256_V2;
- NO_IMPLICIT_HASH_MIGRATION;
- resolver-owned expected provider request binding;
- replayable response extraction;
- provider invocation source binding;
- resource-policy layering;
- provider-native identity evidence discipline;
- E5_HASH_PROFILE_COMPATIBILITY_GATE_V1;
- E5.1 → E5.2 → E5.3;
- E5.3 as sole durable boundary.

PROTOTYPE_SAFE_REPAIR_APPLICATION y MINIMAL_CHANGE_EXECUTABLE_RULE continúan OPEN, correctamente.

## 10. INCONSISTENCIAS

Se detectan tres inconsistencias/brechas:

1. observability effect isolation cubre publish/delivery pero no necesariamente la construcción del evento en el authoritative domain;
2. credentialLeaseId se comparte como dato lógico sin definir si es correlation ID o bearer capability;
3. exactly-one provider-call semantics se declara sin definir replay/crash behavior compatible con la ausencia de una durable transport authority.

No se detecta contradicción nueva con Repair R1 ni con la cadena E5.

## 11. VACÍOS / OMISIONES

R16-N1: bounded/no-throw event handoff anterior al delivery domain.
R16-N2: separación capability privada vs binding ID público del credential lease.
R16-N3: transport-session/replay semantics y estado INDETERMINATE para crash después de send.

Permanecen OPEN: observability implementation; secret-broker/lease implementation; sandbox/enforcement; runtime/toolchain; CANONICAL_JSON_NUMBER_POLICY; CANONICAL_JSON_SHA256_V2; bridge A/B/C hacia E5; prototype-safe E5.1; minimal-change rule; numeric limits; schemas; strict parser; human implementation authorization; NEXT_STAGE_ID; AUTHORIZED_FOR_ASC.

## 12. REDUNDANCIAS

No se detecta redundancia problemática.

Event handoff + isolated delivery cubren materialización mínima y entrega.

Private lease capability + public binding ID cubren uso secreto y correlación verificable.

Single-use session authorization + transportInvocationId cubren replay control y attempt identity sin crear por sí solos una nueva durable authority.

## 13. Resultado

R15-N1 = PARTIAL.
R15-N2 = PARTIAL.

NEW FINDINGS:
R16-N1 = BLOCKER — observability event construction todavía puede interferir antes del isolated publish boundary.
R16-N2 = BLOCKER — credentialLeaseId no distingue correlation identity de bearer credential capability.
R16-N3 = BLOCKER — exactly-one provider-call claim carece de replay/crash semantics compatibles con la frontera durable vigente.

NEW_BLOCKING_FINDINGS = 3.
NEW_MAJOR_FINDINGS = 0.

R16_DIRECTED_REGRESSION = CORRECTION_REQUIRED.
IMPLEMENTATION_AUTHORIZED = FALSE.
REPAIR_AGENT_CONNECTED = FALSE.
NEXT_STAGE_ID = OPEN.
AUTHORIZED_FOR_ASC = OPEN.

## 14. Gate siguiente

Procede exclusivamente una R17 documental que:

1. cierre la materialización/handoff del evento de observabilidad antes del delivery domain;
2. separe credential lease capability privada de binding identity pública;
3. defina no-replay/crash/indeterminate semantics para provider-call authorization sin inventar una nueva durable authority;
4. preserve todos los cierres acumulados;
5. no implemente todavía observability, broker, sandbox, loader, canonicalizer, E5.1, transport, provider ni repair agent.

Después debe ejecutarse regresión dirigida R16-N1/R16-N2/R16-N3 + regresión acumulada completa antes de intentar design validation.
