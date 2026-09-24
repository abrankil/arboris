# MAP-001 — Repair Agent Integration Design R9 — Directed Regression 001

Fecha: 2026-09-23
Artefacto auditado: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_009.md
Head auditado: 289dc2b53791e7cd2f8dca1755b2eeb65915cd5c
Ámbito: R8-N1/R8-N2/R8-N3 + regresión acumulada completa
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_AUTHORIZED: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Apoyo ASC v0.1

ASC v0.1 se usa únicamente en modo compile-only para preservar restricciones, OPEN, DO NOT INFER, prohibiciones y criterios.

TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-R9-DIRECTED-REGRESSION-001

ASC no decide PASS/FAIL técnico ni autoriza implementación.

## 2. AUDITORÍA

R9 corrige materialmente los hallazgos dirigidos de R8:

~~~text
R8-N1
→ define CANONICAL_JSON_VALUE_V1;
→ exige own-data-property semantics y canonicalización prototype-safe;
→ mantiene special keys como datos;
→ reconoce que logicalSha256 vigente no satisface todavía el nuevo contrato.

R8-N2
→ introduce PROVIDER_INVOCATION_SOURCE_BINDING_V1;
→ liga units a providerInvocationHandleId;
→ explicita providerRequestIdPolicy;
→ rechaza late/cross-invocation units.

R8-N3
→ RESOURCE_POLICY_V4 separa wire/provider,
  observation-boundary y canonical-evidence limits;
→ evita afirmar raw/wire enforcement cuando la capa no es observable.
~~~

La regresión encuentra dos bloqueos nuevos en la transición entre el diseño R9 y las primitivas compartidas existentes. También detecta una limitación de evidencia que debe quedar explícita para providerRequestId no disponible.

## 3. Resultado dirigido

~~~text
R8-N1 = PASS AT DESIGN-SEMANTIC LEVEL / BLOCKED BY R9-N1 + R9-N2 FOR EXECUTABLE INTEGRATION
R8-N2 = PASS AT DESIGN LEVEL / EVIDENCE-SCOPE CLARIFICATION R9-N3
R8-N3 = PASS

R7-N1 = PASS
R7-N2 = PASS
R7-N3 = PASS

R6-N1 = PASS AT DESIGN LEVEL / HASH VERSION BOUNDARY OPEN
R6-N2 = PASS
R6-N3 = PASS

R5-N1..R5-N3 = PASS
R4-N1/R4-N2 = PASS AT DESIGN LEVEL
R3-N1/R3-N2 = PASS AT DESIGN LEVEL
R2-N1 = PASS
R2-N2 = PASS AT DESIGN LEVEL / EXECUTABLE DEBT OPEN
R2-N3 = PASS

RA-I1 = PARTIAL / HASH PROFILE COMPATIBILITY BLOCKED
RA-I2 = PASS AT TRANSPORT-CORRELATION LEVEL
RA-I3 = PASS
RA-I4 = PASS AS OPEN/BLOCKING
RA-I5 = PARTIAL / CANONICAL HASH ADMISSION BLOCKED
RA-I6 = PASS AT DESIGN-COVERAGE LEVEL
RA-I7 = PASS
RA-I8 = PASS
~~~

## 4. R8-N1 — design correction is structurally sound

R9 correctly identifies that the current canonicalizer is unsafe for the expanded untrusted JSON domain and defines:

~~~text
CANONICAL_JSON_VALUE_V1
CANONICAL_JSON_SERIALIZATION_V1
prototype-safe object semantics
non-JSON runtime rejection
canonicalizer provenance
adversarial tests
~~~

The remaining failures are not the original R8-N1 omission. They concern compatibility with the existing shared hash primitive and the runtime admission path into the new domain.

## 5. R9-N1 — hash-profile/version boundary with E5.1/E5.2/E5.3 is undefined

The existing executable stack does not use a repair-agent-specific hash primitive.

Current code imports the same logicalSha256 from:

~~~text
tools/proposal-resolution/map001_validation_adapter_r1.mjs
~~~

into:

~~~text
tools/proposal-resolution/map001_repair_gate_r1.mjs
tools/proposal-resolution/map001_repair_transaction_candidate_r1.mjs
tools/proposal-resolution/map001_durable_repair_store_r1.mjs
~~~

That shared primitive currently binds, among other values:

~~~text
parent proposal hashes
validation report hashes
repair hashes
candidate hashes
child proposal hashes
durable run before/after hashes
CAS/recovery comparisons
~~~

R9 requires a stricter and potentially semantically different canonical JSON contract.

But R9 does not decide whether the future implementation will:

~~~text
A. replace the existing shared logicalSha256 semantics;

B. add a new versioned hash primitive for repair-agent integration artifacts;

C. migrate the whole existing E5 hash domain to a new version.
~~~

### Impact

If the existing shared primitive changes in place, historical/persisted logical hashes can change or become invalid under new domain rules. This can affect:

~~~text
repair.control.parentProposal.sha256
repair.control.validationBasis.sha256
repairResult hashes
E5.2 membership/binding checks
E5.3 beforeSha256/afterSha256
journal recovery comparisons
visible run-state hashes
~~~

If instead the new canonicalizer is introduced separately, R9 still must define which exact fields use which hash profile. Otherwise resolver can compute a hash under the new profile while E5.1/E5.2/E5.3 recompute the same logical field with the legacy profile and reject or mis-bind it.

### Corrección requerida

Define an explicit versioned hash profile contract equivalent to:

~~~text
HASH_PROFILE_REGISTRY

LEGACY_LOGICAL_SHA256_V1
→ current E5/proposal-resolution semantics
→ immutable for already persisted/bound artifacts unless migrated

CANONICAL_JSON_SHA256_V2
→ CANONICAL_JSON_VALUE_V1 domain
→ prototype-safe canonical serialization
→ used only by explicitly enumerated R9 integration artifacts
  until an authorized migration says otherwise
~~~

For every digest field introduced or reused by repair-agent integration, specify:

~~~text
field/artifact
hashProfileId
domain
canonicalization contract
compatibility expectation with E5
migration policy
~~~

If a field must be consumed by E5.1/E5.2/E5.3, the design must prove the producer and consumer use the same hash profile.

Any migration of persisted E5 hashes must be a separate authorized design with recovery/backward-compatibility evidence; it cannot be implied by R9.

R9-N1 is BLOCKER.

## 6. Evidence supporting R9-N1

The current shared implementation is imported directly by the E5 layers.

Observed current usages include:

~~~text
map001_repair_gate_r1.mjs
- logicalSha256(parentProposal)
- logicalSha256(validationReport)
- logicalSha256(repair)
- logicalSha256(parentProposal.intent.candidate)
- logicalSha256(childCandidate)

map001_repair_transaction_candidate_r1.mjs
- logicalSha256(existing/report/proposal/candidate/child)

map001_durable_repair_store_r1.mjs
- logicalSha256(prelockRun)
- logicalSha256(proposedPrelock)
- logicalSha256(before/visible/next/after)
- journal/CAS/recovery equality checks
~~~

Therefore hash semantics are already an executable cross-layer contract, not a local helper that can be replaced without compatibility analysis.

## 7. R9-N2 — arbitrary-runtime admission cannot rely on generic Proxy rejection

R9 says CANONICAL_JSON_VALUE_V1 must reject:

~~~text
Proxy
accessors
class instances
other non-JSON runtime objects
~~~

Rejecting accessors and ordinary class instances can be specified using own-property descriptors and prototype constraints.

A general JavaScript Proxy is different: there is no portable generic predicate that proves an arbitrary object is not a Proxy. Even introspection operations such as ownKeys, getOwnPropertyDescriptor or getPrototypeOf can themselves be trapped by a Proxy.

Therefore the requirement:

~~~text
accept arbitrary runtime value
→ inspect it
→ reliably reject all Proxy values without invoking proxy-controlled behavior
~~~

is not an operationally complete security boundary.

### Impact

The domain definition is sound as an abstract data model, but the admission mechanism into that domain is under-specified.

If untrusted/provider-derived or plugin-derived runtime objects reach the canonicalizer directly, the validator itself can execute proxy traps or observe attacker-controlled reflection behavior before it has established that the value is canonical JSON.

### Corrección requerida

R9 must define a trusted materialization/admission boundary before canonical hashing.

A compatible design is:

~~~text
CROSS-BOUNDARY DATA
→ exact bounded bytes
→ strict JSON parser / provider-specific bounded decoder
→ controlled JSON data representation
→ CANONICAL_JSON_VALUE_V1 validation
→ canonical hash
~~~

For internally constructed artifacts:

~~~text
only controlled constructors/builders
that create plain/null-prototype own-data-property structures
may feed the canonicalizer.
~~~

The canonicalizer API should not claim to safely accept an arbitrary JavaScript object graph.

An alternative implementation language/runtime is possible, but the same property must be demonstrated.

R9-N2 is BLOCKER.

## 8. R8-N2 — source-binding design passes at transport scope

R9 now defines:

~~~text
transportInvocationId
providerInvocationHandleId
responseChannelMode
providerRequestIdPolicy
providerRequestId
~~~

and requires every unit to bind to the same source identity, with late/cross-handle units rejected.

This closes the design omission identified in R8-N2 at the transport correlation boundary.

## 9. R9-N3 — evidence scope when providerRequestId is unavailable must remain limited

R9 correctly allows:

~~~text
providerRequestIdPolicy = UNAVAILABLE_BY_PROVIDER
providerRequestId = null
providerInvocationHandleId = primary correlation primitive
~~~

In that mode, providerInvocationHandleId is a transport-local correlation mechanism.

It demonstrates that the implementation kept a response channel scoped to a specific locally tracked provider call, subject to implementation tests.

It does not independently prove a provider-native request identity.

### Required clarification

The future validation/claims should distinguish:

~~~text
TRANSPORT_CORRELATION_PROVEN
from
PROVIDER_NATIVE_REQUEST_IDENTITY_PROVEN
~~~

When providerRequestId is unavailable:

~~~text
TRANSPORT_CORRELATION_PROVEN may PASS
PROVIDER_NATIVE_REQUEST_IDENTITY_PROVEN = NOT_OBSERVABLE
~~~

This is a MAJOR evidence-scope clarification, not a new architectural blocker by itself.

## 10. R8-N3 — PASS

RESOURCE_POLICY_V4 correctly distinguishes:

~~~text
wire/provider receive limits
observation-boundary limits
canonical-evidence limits
~~~

and explicitly marks wire enforcement as ENFORCED, NOT_OBSERVABLE or NOT_SUPPORTED.

It also preserves the distinction between pre-allocation protection and post-materialization bounded-consumption evidence.

The original maxRawResponseBytes ambiguity is resolved.

## 11. RA-I3 / TOCTOU — PASS

The state-ordering chain remains:

~~~text
verify transport/response evidence
→ strict parse
→ PATCH/ABSTAIN validation
→ reread durable run/report/dependencies
→ recompute current bindings
→ Repair R1
→ E5.1
→ E5.2
→ E5.3
~~~

No state-ordering regression was found.

## 12. RA-I4 — PASS AS OPEN/BLOCKING

R9 preserves:

~~~text
MINIMAL_CHANGE_EXECUTABLE_RULE = OPEN
IMPLEMENTATION_BLOCKED_UNTIL_RESOLVED = TRUE
~~~

No minimality is inferred.

## 13. RA-I6 — PASS AT DESIGN-COVERAGE LEVEL

R9 carries forward explicit limits across request, observation, stream units, evidence artifacts and canonical hash inputs.

Exact numeric values remain OPEN and implementation-blocking, correctly.

## 14. RA-I7 — PASS

Strict parsing remains downstream of replayable, hash-bound extraction.

No malformed-output normalization is introduced.

## 15. RA-I8 — PASS

Resolver, transport and model contexts remain capability-separated.

Neither R9-N1 nor R9-N2 requires privilege fusion.

## 16. INCONSISTENCIAS

No new contradiction with Repair R1, E5.1, E5.2 or E5.3 is asserted.

Two design/executable-boundary inconsistencies remain:

~~~text
1.
R9 requires stronger hash semantics but does not yet version
their relationship with the shared E5 hash primitive.

2.
R9 requires generic Proxy rejection,
but arbitrary-runtime Proxy detection is not a reliable admission primitive.
~~~

## 17. VACÍOS / OMISIONES

New gaps:

~~~text
R9-N1
hash-profile registry/versioning
per-field hash-profile binding
legacy E5 compatibility policy
migration/no-migration decision
regression tests across E5.1/E5.2/E5.3 durable hashes

R9-N2
trusted materialization/admission boundary
no-arbitrary-runtime-object canonicalizer contract
strict parse/controlled-builder provenance into canonical domain

R9-N3
explicit evidence claim distinction:
transport correlation vs provider-native identity
~~~

Existing OPEN remain:

~~~text
CANONICAL_JSON_NUMBER_POLICY
prototype-safe canonicalizer implementation
prototype-safe E5.1 repair application + tests
minimal-change executable rule or authority-level revision
provider/model/runtime
provider-specific source binding
provider-specific policies
numeric resource limits
strict parser
request projection
schemas
human implementation authorization
NEXT_STAGE_ID
AUTHORIZED_FOR_ASC
~~~

## 18. REDUNDANCIAS

No problematic redundancy detected.

Intentional boundaries remain:

~~~text
legacy E5 hash profile
+ repair-agent canonical hash profile
→ compatibility must be explicit, not conflated

trusted JSON admission
+ prototype-safe canonicalization
→ safe materialization + deterministic hashing

transport handle
+ providerRequestId when observable
→ local correlation + provider-native evidence

E5.1 + E5.2 + E5.3
→ repair/run/durable authority
~~~

## 19. Resultado

~~~text
R8-N1 = RESOLVED AT ABSTRACT DESIGN LEVEL
R8-N2 = RESOLVED AT TRANSPORT-CORRELATION DESIGN LEVEL
R8-N3 = RESOLVED

NEW FINDINGS
R9-N1 = BLOCKER — shared hash-profile/version compatibility with E5 undefined
R9-N2 = BLOCKER — canonical JSON admission relies on non-operational generic Proxy rejection
R9-N3 = MAJOR — provider-native identity claim must remain NOT_OBSERVABLE when unavailable

NEW_BLOCKING_FINDINGS = 2
NEW_MAJOR_FINDINGS = 1

R9_DIRECTED_REGRESSION = CORRECTION_REQUIRED
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
~~~

## 20. Gate siguiente

Procede exclusivamente una R10 documental que:

~~~text
1. versione los hash profiles y fije compatibilidad con E5.1/E5.2/E5.3;
2. defina la trusted materialization/admission boundary hacia CANONICAL_JSON_VALUE;
3. limite correctamente los claims de provider-native identity;
4. preserve todos los cierres anteriores;
5. no implemente todavía canonicalizer, E5.1 rectification,
   transport, provider, sandbox ni repair agent.
~~~

Después debe ejecutarse regresión dirigida R9-N1/R9-N2/R9-N3 + regresión acumulada completa antes de validar el diseño.
