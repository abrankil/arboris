# MAP-001 — Repair Agent Integration Design R8 — Directed Regression 001

Fecha: 2026-09-23
Artefacto auditado: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_008.md
Head auditado: 1aac824e3d337f08085dd43cf64017f6a3b187f0
Ámbito: R7-N1/R7-N2/R7-N3 + regresión acumulada R6-N1..R6-N3 + R5-N1..R5-N3 + R4-N1/R4-N2 + R3-N1/R3-N2 + R2-N1..R2-N3 + RA-I1..RA-I8
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_AUTHORIZED: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Apoyo ASC v0.1

ASC v0.1 se usa únicamente en modo compile-only para preservar restricciones, OPEN, DO NOT INFER, prohibiciones y criterios.

TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-R8-DIRECTED-REGRESSION-001

ASC no decide PASS/FAIL técnico ni autoriza implementación.

## 2. AUDITORÍA

R8 corrige materialmente los hallazgos dirigidos de R7:

~~~text
R7-N1
→ observation capture ocurre antes de selectedContentLocator;
→ resolver recibe PROVIDER_OBSERVATION_RECORD_V1;
→ resolver puede reejecutar PROVIDER_RESPONSE_EXTRACTION_POLICY_V2.

R7-N2
→ RESOURCE_POLICY_V3 cubre unit counts, decoded/encoded bytes,
  metadata, observation record, extracted response y receipt;
→ STREAM define enforcement incremental.

R7-N3
→ canonical base64 padding queda definido como 0/1/2 "=" según corresponda.
~~~

La regresión adversarial descubre dos bloqueos nuevos: uno en la primitiva de hashing lógico ya existente y otro en la correlación de units/responses con la invocación concreta. También detecta una ambigüedad de resource terminology ligada al observation boundary.

## 3. Resultado dirigido

~~~text
R7-N1 = PASS ON REPLAY / RESPONSE-SOURCE CORRELATION BLOCKED BY R8-N2
R7-N2 = PASS ON NEW EVIDENCE SURFACES / TERMINOLOGY CLARIFICATION R8-N3
R7-N3 = PASS

R6-N1 = PARTIAL / REOPENED BY R8-N1 AT HASH-PRIMITIVE LEVEL
R6-N2 = PASS
R6-N3 = PASS ON EXTRACTION REPLAY / BLOCKED BY R8-N2 FOR SOURCE CORRELATION

R5-N1 = PASS
R5-N2 = PASS AT DESIGN LEVEL
R5-N3 = PASS

R4-N1 = PASS AT DESIGN LEVEL
R4-N2 = PASS
R3-N1 = PASS AT DESIGN LEVEL / PROVIDER-SPECIFIC VALUES OPEN
R3-N2 = PASS

R2-N1 = PARTIAL / RESPONSE CORRELATION REOPENED BY R8-N2
R2-N2 = PARTIAL / HASH CANONICALIZER ISSUE R8-N1
R2-N3 = PASS

RA-I1 = PARTIAL / HASH PRIMITIVE + RESPONSE SOURCE BINDING
RA-I2 = PARTIAL / BLOCKED BY R8-N2
RA-I3 = PASS
RA-I4 = PASS AS OPEN/BLOCKING
RA-I5 = PARTIAL / BLOCKED BY R8-N1
RA-I6 = PASS AT DESIGN COVERAGE LEVEL / R8-N3 CLARIFICATION
RA-I7 = PASS ON PARSER INPUT REPLAY / SOURCE CORRELATION PARTIAL
RA-I8 = PASS
~~~

## 4. R7-N1 — replay correction passes

R8 now distinguishes:

~~~text
capture
→ PROVIDER_OBSERVATION_RECORD_V1

extraction
→ PROVIDER_RESPONSE_EXTRACTION_POLICY_V2

parser input
→ EXTRACTED_MODEL_RESPONSE_V2
~~~

and explicitly requires resolver to reapply the extraction policy to the observation record.

The original R7-N1 defect — transport-only selection that resolver could not replay — is corrected.

The newly discovered R8-N2 is different: it concerns whether every observed unit is demonstrably associated with the exact provider invocation being audited.

## 5. R7-N2 — resource coverage passes at design level

RESOURCE_POLICY_V3 now covers:

~~~text
unit count
single/cumulative decoded bytes
single/cumulative encoded bytes
metadata
observation record
extracted response
transport receipt
timeout/cancellation
~~~

and STREAM requires cumulative checks before project-level retention and base64 materialization.

This closes the core resource-growth omission from R7.

R8-N3 below requires terminology to match the declared observation boundary, but does not erase the new bounded surfaces.

## 6. R7-N3 — PASS

R8 correctly states:

~~~text
canonical base64 padding
= exactly 0, 1, or 2 "=" as required by input length
~~~

with no omitted or superfluous padding and exact decode/re-encode equality.

No ambiguity remains.

## 7. R8-N1 — current logicalSha256 canonicalizer is not safe for the new evidence domain

R8 relies extensively on:

~~~text
logicalSha256(PROVIDER_OBSERVATION_RECORD_V1)
logicalSha256(PROVIDER_RESPONSE_EXTRACTION_POLICY_V2)
logicalSha256(INPUT_BINDING_V3)
logicalSha256(TRANSPORT_RECEIPT-related logical artifacts)
~~~

The current implementation in tools/proposal-resolution/map001_validation_adapter_r1.mjs canonicalizes objects with:

~~~text
const out = {};
for (const key of Object.keys(value).sort()) {
  out[key] = canonicalize(value[key]);
}
~~~

This is not prototype-safe for arbitrary JSON object keys.

For an own JSON key named:

~~~text
__proto__
~~~

assignment to out["__proto__"] on a normal JavaScript object can invoke the inherited prototype setter instead of creating the intended own data property.

Therefore a JSON object containing an own __proto__ member can be canonicalized differently from its actual JSON content.

This is directly relevant because:

~~~text
- R8 introduces provider/SDK-derived observation records into logical hashing;
- future prototype-safe Repair application explicitly allows special keys to remain JSON data;
- Repair R1 candidatePointer does not prohibit __proto__;
- R2 deliberately chose prototype-safe semantics instead of a textual blacklist.
~~~

The same canonicalizer also has no explicit domain gate rejecting non-JSON runtime values such as undefined, functions, symbols, BigInt, non-finite numbers, sparse arrays, accessors or class instances before JSON.stringify semantics can drop, coerce, throw or reinterpret them.

### Impact

The following intended property is not yet guaranteed:

~~~text
same exact canonical JSON value
↔
same logicalSha256 input semantics
~~~

and special-key content can be lost or altered before hashing.

This reopens part of R6-N1/R2-N2/RA-I5 at the hash primitive, even though BYTE_STRING_V1 itself is sound.

### Corrección requerida

Before implementation authorization, define and test a canonical JSON hashing domain equivalent to:

~~~text
CANONICAL_JSON_VALUE_V1

allowed:
- null
- boolean
- string
- finite JSON number under an explicit number policy
- dense arrays of allowed values
- plain JSON objects with own enumerable data properties

rejected or explicitly normalized before hashing:
- undefined
- function
- symbol
- bigint
- NaN / Infinity
- sparse arrays
- accessors
- Date / Map / Set / class instances
- other non-JSON runtime objects
~~~

Object canonicalization must not write through inherited setters. Valid strategies include:

~~~text
- Object.create(null) plus own-data-property definition;
- sorted entry serialization without rebuilding through ordinary property assignment;
- another demonstrably equivalent prototype-safe canonicalizer.
~~~

Mandatory regression tests must include at least:

~~~text
own "__proto__"
own "constructor"
own "prototype"
nested special keys
key-order determinism
JSON parse/stringify roundtrip
BYTE_STRING_V1 artifacts
provider observation records
repair candidate logical hash
~~~

R8-N1 is BLOCKER.

## 8. R8-N2 — observation units are not explicitly bound to the concrete provider invocation source

R8 records:

~~~text
transportInvocationId
providerRequestId
units[]
~~~

but does not define the source-binding invariant that every unit in PROVIDER_OBSERVATION_RECORD_V1 must originate from the exact provider invocation represented by the audited transport call.

This matters especially for:

~~~text
STREAM
SDK_CALLBACK_EVENT
concurrent invocations
late events
replayed events
provider callbacks multiplexed through one client/runtime
~~~

A resolver-assigned transportInvocationId written into the record proves the label used by transport, but the design does not yet specify how the provider callback/stream handle itself is tied to that invocation.

providerRequestId is shown as a field in PROVIDER_OBSERVATION_RECORD_V1, while TRANSPORT_RECEIPT_V5 describes providerRequestId as optional. Its availability and equality semantics are therefore also underspecified.

### Impact

A transport implementation could accidentally mix one or more units from invocation A into the observation record for invocation B and still produce a self-consistent replayable extraction record.

Replay proves:

~~~text
record → extracted bytes
~~~

but not yet:

~~~text
exact provider invocation → this record
~~~

This reopens the request/response correlation property from R2-N1/RA-I2 for the streaming/callback boundary introduced later.

### Corrección requerida

Define a source binding equivalent to:

~~~text
PROVIDER_INVOCATION_SOURCE_BINDING_V1 = {
  transportInvocationId,
  providerInvocationHandleId,
  providerRequestIdPolicy,
  providerRequestId, if available,
  responseChannelMode
}
~~~

Requirements:

~~~text
- providerInvocationHandleId is allocated/bound before or at provider call;
- the callback/stream consumed by capture is scoped to that handle;
- every captured unit inherits or proves the same source binding;
- late units from a closed handle are rejected;
- units from another active handle are rejected;
- if providerRequestId is exposed, record/receipt/events must agree;
- if providerRequestId is unavailable, this is explicit and the transport handle remains the correlation primitive;
- source binding enters the observation record, receipt and attempt evidence;
- resolver verifies the source binding against the invocation it initiated.
~~~

The concrete mechanism is provider/runtime-specific and remains OPEN, but the invariant must be part of the design.

R8-N2 is BLOCKER.

## 9. R8-N3 — maxRawResponseBytes conflicts with the declared observation-boundary model

RESOURCE_POLICY_V3 inherits:

~~~text
maxRawResponseBytes
~~~

while R8 correctly states that, for SDK_RETURN_OBJECT / SDK_STREAM_EVENT / SDK_CALLBACK_EVENT, Árboris may not observe a raw HTTP/provider response.

Therefore “raw response bytes” is not a universally measurable surface.

### Corrección requerida

The resource contract must distinguish:

~~~text
provider/wire receive limit
→ only when directly enforceable by the selected transport/runtime

observable-boundary input limit
→ bytes/units actually visible at the declared observationBoundary

canonical evidence limits
→ observation/base64/receipt limits already defined
~~~

A future provider-specific policy may retain a raw/wire limit when evidence supports it, but must not claim enforcement of maxRawResponseBytes when the SDK hides that layer.

R8-N3 is a MAJOR design/documentation clarification and remains implementation-blocking for provider-specific configuration, but does not invalidate the resource coverage added for R7-N2.

## 10. R6-N2 / provider-request handoff — PASS

Resolver still computes expectedProviderRequestEnvelopeDigest before transport.

Transport computes actualProviderRequestEnvelopeDigest from its independently materialized envelope and must require exact equality before the call.

No regression detected.

## 11. R5-N1 / R5-N2 / R5-N3 — PASS

R8 preserves:

~~~text
canonical BYTE_STRING-backed materialized messages
resolved provider construction policy
expected/actual provider request envelope
MODEL_INVOCATION_POLICY_V2 as sole normative policy
~~~

No reopening detected except the lower-level logical hashing primitive identified in R8-N1.

## 12. R2-N3 / RA-I8 — PASS

Resolver, transport and model context remain separated.

Neither R8-N1 nor R8-N2 requires capability fusion.

## 13. RA-I3 — PASS

The state TOCTOU sequence remains fail-closed:

~~~text
response evidence verification
→ MODEL_RESPONSE parse/validation
→ reread durable run/report
→ reverify dependencies/bindings
→ Repair R1
→ E5.1
→ E5.2
→ E5.3
~~~

The new findings concern hashing and response-source provenance, not state ordering.

## 14. RA-I4 — PASS AS OPEN/BLOCKING

R8 preserves:

~~~text
MINIMAL_CHANGE_EXECUTABLE_RULE = OPEN
IMPLEMENTATION_BLOCKED_UNTIL_RESOLVED = TRUE
~~~

No minimality is inferred.

## 15. INCONSISTENCIAS

Two concrete inconsistencies are present:

~~~text
1.
R8 relies on logicalSha256 for untrusted/cross-boundary logical artifacts,
but the current canonicalizer is not prototype-safe for arbitrary JSON keys
and does not define an explicit JSON-only runtime domain.

2.
RESOURCE_POLICY_V3 uses maxRawResponseBytes
while R8 explicitly allows observation boundaries where raw provider bytes
are not observable.
~~~

There is also an optionality ambiguity around providerRequestId between observation record and receipt; this is incorporated into R8-N2.

## 16. VACÍOS / OMISIONES

New gaps:

~~~text
R8-N1
prototype-safe canonical JSON hashing primitive
explicit JSON runtime-domain gate
special-key canonical-hash regression tests

R8-N2
provider invocation source-binding contract
stream/callback handle correlation
late/cross-invocation unit rejection
providerRequestId optionality/equality semantics

R8-N3
boundary-specific receive/resource terminology
explicit distinction between wire limits and observable-boundary limits
~~~

Existing OPEN remain:

~~~text
prototype-safe E5.1 repair application + tests
minimal-change executable rule or authority-level contract revision
provider/model/runtime
provider-specific policies
numeric resource values
strict parser implementation
request projection
schemas
human implementation authorization
NEXT_STAGE_ID
AUTHORIZED_FOR_ASC
~~~

## 17. REDUNDANCIAS

No problematic redundancy detected.

The following remain intentional:

~~~text
prototype-safe repair application
+ prototype-safe logical canonicalization
→ mutation semantics and hash semantics are different boundaries

provider invocation source binding
+ observation record digest
+ extraction replay
→ source correlation, evidence identity and extraction correctness are different claims

transport resource checks
+ resolver rechecks
→ bounded production and bounded consumption

E5.1 + E5.2 + E5.3
→ repair/run/durable authority
~~~

## 18. Resultado

~~~text
R7-N1 = RESOLVED ON REPLAY
R7-N2 = RESOLVED ON EVIDENCE-SURFACE BOUNDS
R7-N3 = RESOLVED

NEW FINDINGS
R8-N1 = BLOCKER — logicalSha256 canonicalizer not safe for arbitrary JSON evidence
R8-N2 = BLOCKER — provider response units lack exact invocation-source binding
R8-N3 = MAJOR — maxRawResponseBytes incompatible with all observation boundaries

NEW_BLOCKING_FINDINGS = 2
NEW_MAJOR_FINDINGS = 1

R8_DIRECTED_REGRESSION = CORRECTION_REQUIRED
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
~~~

## 19. Gate siguiente

Procede exclusivamente una R9 documental que:

~~~text
1. defina canonical JSON hashing domain + prototype-safe canonicalizer requirements;
2. defina provider invocation source binding for non-stream/stream/callback responses;
3. diferencie wire/raw receive limits de observable-boundary resource limits;
4. preserve R7-N1/R7-N2/R7-N3 and all prior closures;
5. no implemente todavía transport, provider, sandbox,
   E5.1 rectification ni repair agent.
~~~

Después debe ejecutarse regresión dirigida R8-N1/R8-N2/R8-N3 + regresión acumulada antes de validar el diseño.
