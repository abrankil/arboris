# MAP-001 — Repair Agent Integration Design R15 — Directed Regression 001

Fecha: 2026-09-23
Artefacto auditado: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_015.md
Head auditado: 4acfe6c22bd82e63464959a862bccd093d8d9e61
Ámbito: R14-N1/R14-N2 + regresión acumulada completa
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_AUTHORIZED: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-R15-DIRECTED-REGRESSION-001

ASC compila restricciones, OPEN, DO NOT INFER y criterios. No ejecuta provider/model, no implementa observability/secret broker y no autoriza conexión.

## 2. AUDITORÍA

R15 corrige materialmente la forma principal de R14-N1: ALLOWED_NON_SEMANTIC deja de ser una categoría de input y observabilidad pasa a una frontera output-only sin read-back lógico.

R15 también corrige materialmente la omisión de R14-N2: distingue secret value de credential context, fija slot/scope/rotation policy y exige evidencia no secreta antes de la provider invocation.

La regresión acumulada preserva los cierres sobre executable dependency closure, execution-surface closure, verified-load, assurance authenticity, hash-profile separation, response extraction, provider source binding y E5.1 → E5.2 → E5.3.

Se detectan dos blockers nuevos: la no-interferencia de observabilidad todavía no cubre timing/backpressure/resource effects, y PROVIDER_REQUEST_ENVELOPE_V3 introduce credentialContextEvidenceDigest en una estructura cuyo expected digest debe existir antes de transport, aunque ese evidence digest solo existe después de la selección efectiva del broker context.

## 3. Resultado dirigido

R14-N1 = PARTIAL / BLOCKED BY R15-N1.
R14-N2 = PARTIAL / BLOCKED BY R15-N2.

R13-N1 = PASS AT DESIGN LEVEL.
R13-N2 = PASS AT SEMANTIC-INPUT-CLASSIFICATION LEVEL.
R12-N1 = PASS AT EXECUTION-CLOSURE DESIGN LEVEL.
R12-N2 = PASS AT DESIGN LEVEL.
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

RA-I1 = PARTIAL / PROVIDER-CREDENTIAL HANDOFF SEQUENCING INCOMPLETE.
RA-I2 = PASS.
RA-I3 = PASS.
RA-I4 = PASS AS OPEN/BLOCKING.
RA-I5 = PASS AT DESIGN LEVEL / E5.1 EXECUTABLE DEBT OPEN.
RA-I6 = PASS AT DESIGN-COVERAGE LEVEL.
RA-I7 = PASS.
RA-I8 = PASS.

## 4. R14-N1 — data-flow correction is sound but non-interference is incomplete

R15 correctly removes ALLOWED_NON_SEMANTIC from SEMANTIC_INPUT_CLOSURE and prohibits read-back from telemetry/observability into authoritative logic.

That closes the direct data-flow defect identified in R14.

The remaining R15-N1 concerns effects that can alter later authoritative behavior without returning a telemetry value.

## 5. R15-N1 — output-only observability can still interfere through timing, backpressure or shared resources

R15 states that sink return values are ignored and sink failures cannot modify the authoritative result already calculated.

However, an output-only call performed synchronously or through a shared resource path can still affect:

- elapsed time before the next authoritative step;
- timeout/cancellation budgets;
- event-loop scheduling;
- queue or memory pressure;
- file descriptor / socket / thread-pool availability;
- process termination on unhandled instrumentation failure;
- ordering of later externally observable actions.

These effects require no logical read-back from the sink.

### Impacto

If observability emission occurs between authoritative steps, a slow or blocked sink could change whether a later provider call times out, whether cancellation triggers, or whether resource limits are reached.

The same logical inputs could therefore produce different authoritative outcomes solely because telemetry was enabled or congested, while OBSERVABILITY_NON_INTERFERENCE_V1 still appears satisfied at the data-flow level.

### Corrección requerida

Define OBSERVABILITY_EFFECT_ISOLATION_V1 or equivalent.

The contract must ensure, for authoritative behavior:

- event publication is non-blocking or occurs only after the complete authoritative transition it observes;
- telemetry latency is excluded from authoritative timeout/cancellation semantics, or the sink is isolated in a way that cannot consume that budget;
- sink queue/memory/FD/thread resource consumption cannot starve the authoritative domain;
- sink failure cannot terminate or unwind authoritative execution;
- backpressure has an explicit drop/buffer policy that does not feed authority;
- observability scheduling cannot reorder provider/E5 actions;
- enable/disable/congestion of the sink cannot change authoritative output for the same bound inputs.

If full process isolation is selected, its capability/resource boundary must be provenance-bound and assurance-tested. If an in-process queue is selected, bounded capacity + non-blocking failure/drop semantics must be explicit.

R15-N1 = BLOCKER.

## 6. R14-N2 — credential context binding is directionally correct

R15 correctly separates secret material from non-secret slot/account/project/tenant context and introduces rotation semantics and evidence strength.

The pre-provider credential gate also correctly requires policy/evidence verification before the secret is used.

The remaining R15-N2 is a sequencing contradiction with the independent provider-request-envelope binding established in R7.

## 7. R15-N2 — credential evidence digest conflicts with the pre-transport expected provider envelope

The existing normative request-binding invariant from R7 is:

resolver constructs EXPECTED_PROVIDER_REQUEST_ENVELOPE before invoking transport, computes expectedProviderRequestEnvelopeDigest, and transport must later construct an ACTUAL_PROVIDER_REQUEST_ENVELOPE that deep-equals that expected envelope before provider call.

R15 evolves the envelope to PROVIDER_REQUEST_ENVELOPE_V3 and adds:

providerCredentialContextPolicyDigest.
credentialContextEvidenceDigest.

But R15 also states that credentialContextEvidenceDigest exists only after transport selects the effective broker context and obtains PROVIDER_CREDENTIAL_CONTEXT_EVIDENCE_V1.

Therefore resolver cannot include the actual credentialContextEvidenceDigest in its pre-transport EXPECTED_PROVIDER_REQUEST_ENVELOPE unless it already knows the result of the broker selection that transport has not yet performed.

### Impacto

As written, at least one previous invariant must fail:

- resolver cannot construct the complete expected V3 envelope before transport;
- or transport must invent/fill a field that was not independently expected;
- or expected/actual deep equality no longer covers the new field;
- or broker selection must move into a pre-transport/pre-call phase not currently defined.

Any of those changes require an explicit contract. R15 currently states all of them as if simultaneously true.

### Corrección requerida

R16 must freeze one sequencing model.

Two compatible classes are available:

A. TWO-PHASE CREDENTIAL PREFLIGHT.
Transport resolves the authorized credential context without calling the provider, returns a bounded non-secret CREDENTIAL_PREFLIGHT_RECORD to resolver, resolver verifies it and computes a credential-authorized expected provider envelope digest, then transport may perform exactly one provider call using a lease/handle bound to that same preflight context.

B. SPLIT REQUEST/credential evidence contracts.
The resolver-expected provider request envelope continues to contain only fields knowable before transport, including providerCredentialContextPolicyDigest but not the actual evidence digest. A separate PROVIDER_CALL_AUTHORIZATION_RECORD binds credentialContextEvidenceDigest immediately before provider call, and the receipt lets resolver verify afterward that the actual credential context satisfied the pre-bound policy.

Whichever model is chosen must preserve:

- independent resolver-owned expectation for all fields knowable before transport;
- no transport substitution of credential slot/policy;
- exact binding between the credential evidence and the secret/credential handle actually used;
- no provider call before credential authorization passes;
- no secret exposure;
- one provider invocation per authorized attempt.

If a credential lease/handle can rotate or be dereferenced later, the design must also guarantee that the material used for the call belongs to the exact context/generation that passed the gate, rather than a later broker state.

R15-N2 = BLOCKER.

## 8. Cierres acumulados preservados

Se preservan sin reapertura:

- verified byte consumption and runtime dependency closure;
- execution-surface default deny;
- authenticated implementation assurance;
- controlled JSON snapshot ordering;
- legacy/V2 hash-profile separation and no implicit migration;
- response observation/extraction replay;
- provider invocation source binding;
- resource-policy layering;
- provider-native identity claim discipline;
- E5_HASH_PROFILE_COMPATIBILITY_GATE_V1;
- E5.1 → E5.2 → E5.3;
- E5.3 as sole durable boundary.

PROTOTYPE_SAFE_REPAIR_APPLICATION y MINIMAL_CHANGE_EXECUTABLE_RULE continúan OPEN, correctamente.

## 9. INCONSISTENCIAS

Se detectan dos inconsistencias concretas:

1. R15 define observabilidad como output-only, pero todavía no impide interferencia autoritativa por tiempo/backpressure/shared resources.
2. PROVIDER_REQUEST_ENVELOPE_V3 requiere credentialContextEvidenceDigest aunque el expected envelope debe fijarse antes de transport y ese digest solo existe después de que transport consulte el broker.

No se detecta contradicción nueva con Repair R1 ni con la cadena E5.

## 10. VACÍOS / OMISIONES

R15-N1: timing/resource/backpressure isolation para observability output channel.
R15-N2: sequencing normativo entre credential preflight, expected provider envelope, actual provider call y credential evidence.
R15-N2: atomic/lease binding entre credential evidence verificada y credential material realmente usado cuando el broker permita rotación o handles diferidos.

Permanecen OPEN: sandbox/enforcement implementation; secret-broker implementation; provider scope visibility; runtime/toolchain; CANONICAL_JSON_NUMBER_POLICY; CANONICAL_JSON_SHA256_V2; bridge A/B/C hacia E5; prototype-safe E5.1; minimal-change rule; límites numéricos; schemas; strict parser; human implementation authorization; NEXT_STAGE_ID; AUTHORIZED_FOR_ASC.

## 11. REDUNDANCIAS

No se detecta redundancia problemática.

Output-only observability + effect isolation cubren flujo de datos y efectos temporales/de recursos.

Credential context policy + credential evidence + provider request envelope cubren autorización previa, evidencia efectiva y request semántico; son fronteras distintas y deben secuenciarse explícitamente.

## 12. Resultado

R14-N1 = PARTIAL.
R14-N2 = PARTIAL.

NEW FINDINGS:
R15-N1 = BLOCKER — observability output path todavía puede interferir mediante timing/backpressure/shared resources.
R15-N2 = BLOCKER — credentialContextEvidenceDigest no es compatible todavía con el expected provider envelope pre-transport.

NEW_BLOCKING_FINDINGS = 2.
NEW_MAJOR_FINDINGS = 0.

R15_DIRECTED_REGRESSION = CORRECTION_REQUIRED.
IMPLEMENTATION_AUTHORIZED = FALSE.
REPAIR_AGENT_CONNECTED = FALSE.
NEXT_STAGE_ID = OPEN.
AUTHORIZED_FOR_ASC = OPEN.

## 13. Gate siguiente

Procede exclusivamente una R16 documental que:

1. cierre efectos temporales/de recursos del output-only observability channel;
2. congele un único sequencing contract para credential preflight/evidence y provider-request-envelope binding;
3. preserve todos los cierres acumulados;
4. no implemente todavía observability, secret broker, sandbox, loader, canonicalizer, E5.1, transport, provider ni repair agent.

Después debe ejecutarse regresión dirigida R15-N1/R15-N2 + regresión acumulada completa antes de intentar design validation.
