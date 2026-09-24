# MAP-001 — Repair Agent Integration Design R10 — Directed Regression 001

Fecha: 2026-09-23
Artefacto auditado: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_010.md
Head auditado: d04a9f3ded43d5a4060bf052eae45d39b0b89627
Ámbito: R9-N1/R9-N2/R9-N3 + regresión acumulada completa
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_AUTHORIZED: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Apoyo ASC v0.1

ASC v0.1 se usa únicamente en modo compile-only para preservar restricciones, OPEN, DO NOT INFER, prohibiciones y criterios.

TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-R10-DIRECTED-REGRESSION-001

ASC no decide PASS/FAIL técnico, no cierra OPEN y no autoriza implementación.

## 2. AUDITORÍA

R10 corrige materialmente los tres hallazgos dirigidos de R9:

R9-N1: separa LEGACY_LOGICAL_SHA256_V1 y CANONICAL_JSON_SHA256_V2, prohíbe migración implícita y agrega un compatibility gate antes de Repair R1.
R9-N2: retira arbitrary runtime objects del contrato del canonicalizer e introduce trusted materialization.
R9-N3: separa transport correlation de provider-native request identity y mantiene NOT_OBSERVABLE cuando corresponde.

La regresión adversarial encuentra dos bloqueos nuevos en la raíz de confianza del perfil V2 y en la estabilidad temporal del valor materializado. También encuentra una brecha mayor en la semántica de evidenceClaims.

## 3. Resultado dirigido

R9-N1 = PASS AT DESIGN-BOUNDARY LEVEL / BLOCKED BY R10-N1 FOR TRUST BOOTSTRAP.
R9-N2 = PASS ON ADMISSION SHAPE / BLOCKED BY R10-N2 FOR SNAPSHOT IMMUTABILITY.
R9-N3 = PARTIAL / BLOCKED BY R10-N3 FOR EVIDENCE-BASIS SEMANTICS.

R8-N1 = PASS AT ABSTRACT DESIGN LEVEL.
R8-N2 = PASS AT SOURCE-BINDING DESIGN LEVEL.
R8-N3 = PASS.
R7-N1..R7-N3 = PASS.
R6-N1..R6-N3 = PASS AT DESIGN LEVEL.
R5-N1..R5-N3 = PASS.
R4-N1/R4-N2 = PASS AT DESIGN LEVEL.
R3-N1/R3-N2 = PASS AT DESIGN LEVEL.
R2-N1 = PASS.
R2-N2 = PASS AT DESIGN LEVEL / EXECUTABLE DEBT OPEN.
R2-N3 = PASS.

RA-I1 = PARTIAL / TRUST ROOT FOR V2 BINDINGS INCOMPLETE.
RA-I2 = PASS ON STRUCTURAL CORRELATION / CLAIM STATUS PARTIAL.
RA-I3 = PASS.
RA-I4 = PASS AS OPEN/BLOCKING.
RA-I5 = PARTIAL / CONTROLLED VALUE IMMUTABILITY NOT YET BOUND.
RA-I6 = PASS AT DESIGN-COVERAGE LEVEL.
RA-I7 = PASS.
RA-I8 = PASS.

## 4. R9-N1 — profile separation passes

R10 correctly prevents silent replacement of the current logicalSha256 semantics and recognizes that current E5.1/E5.2/E5.3 use the legacy profile as an executable cross-layer contract.

The matrix and E5_HASH_PROFILE_COMPATIBILITY_GATE_V1 are the correct design direction. No implicit persisted-hash migration is introduced.

The new R10-N1 concerns how the V2 trust root itself is selected before a V2-bound artifact can be verified.

## 5. R10-N1 — V2 hash/materialization trust bootstrap is self-referential

R10 adds hashProfileRegistryBinding and trustedJsonMaterializationBinding to INPUT_BINDING_V5.

But INPUT_BINDING_V5 is itself intended to be hashed under CANONICAL_JSON_SHA256_V2.

Therefore these fields cannot establish, by themselves, which registry, canonicalizer, number policy, parser or materializer is trusted to verify INPUT_BINDING_V5. A verifier must already know that trusted runtime before it can safely interpret and hash the binding that names it.

If an incoming/in-memory binding can select its own hash profile or materializer implementation, the trust chain becomes circular.

### Corrección requerida

Define an out-of-band resolver-owned trust root equivalent to:

INTEGRATION_CRYPTO_RUNTIME_BINDING_V1 = { profileRegistryDependency, canonicalJsonSerializerDependency, canonicalJsonNumberPolicyDependency, trustedJsonMaterializerDependency, strictParserDependency, controlledBuilderDependency, activeIntegrationHashProfileId }.

Every dependency must be fixed by dependencyId + canonical repo-relative path + raw SHA-256 before any V2 artifact is parsed/verified as authoritative integration evidence.

Required order:

1. resolver loads/pins the local trust-root binding from authorized provenance;
2. verifies exact dependency hashes;
3. selects the active V2 profile from that trusted binding;
4. only then materializes and verifies INPUT_BINDING_V5 and other V2 artifacts;
5. INPUT_BINDING_V5 may echo the trust-root digest for traceability, but may not select or authorize the verifier used on itself.

Changing the trust root invalidates the attempt and requires fresh materialization/bindings.

R10-N1 is BLOCKER.

## 6. R9-N2 — arbitrary-runtime rejection direction passes

R10 correctly replaces impossible generic Proxy detection with a controlled admission boundary.

The external-bytes and controlled-builder routes prevent the canonicalizer contract from claiming safe operation over arbitrary JavaScript object graphs.

The new R10-N2 concerns mutation/aliasing after a value has passed admission.

## 7. R10-N2 — CONTROLLED_JSON_VALUE_HANDLE lacks immutable snapshot semantics

R10 states that CONTROLLED_JSON_VALUE_HANDLE_V1 can only be created by trusted materialization, but it does not state that the admitted value is detached, immutable and alias-free for the lifetime of hashing and later comparisons.

Without that property, a controlled builder could validate a nested array/object and retain a mutable reference. Another component could mutate the underlying structure after validation but before canonical serialization, or between two digest computations.

This creates an intra-process TOCTOU boundary:

admission validation → mutable alias changes data → canonical hash / downstream verification.

### Corrección requerida

CONTROLLED_JSON_VALUE_HANDLE_V1 must represent an immutable snapshot, not a validated reference.

Equivalent requirements:

- materialization recursively copies values into resolver-owned controlled storage;
- no reference from the source object graph is retained;
- arrays/objects cannot be mutated through public aliases after admission;
- special keys remain own data properties;
- canonicalization observes one frozen logical snapshot;
- the handle cannot expose mutable internal containers;
- if caching canonical bytes/digest, the cache is bound to exactly that immutable snapshot;
- materialize-and-hash behavior is deterministic across repeated reads.

A valid implementation may use deeply immutable/null-prototype structures, canonical bytes as the primary internal representation, or another demonstrably alias-safe mechanism.

Required tests include mutation of original source objects after admission, mutation attempts through returned handles/views, nested alias mutation and repeated hash stability.

R10-N2 is BLOCKER.

## 8. R9-N3 — evidence-scope separation is directionally correct

R10 correctly states that provider-native request identity can be NOT_OBSERVABLE while transport correlation is separately evaluated.

However, the current three-value status model still does not encode the evidence basis for transportCorrelationStatus=VERIFIED.

## 9. R10-N3 — VERIFIED transport correlation can overstate independently observable evidence

The resolver can verify receipt structure, source-binding equality, handle IDs, unit refs and provenance of the transport implementation.

But for many SDKs it cannot independently observe the internal fact that the callback/iterator was actually scoped to the claimed providerInvocationHandleId. That fact may be guaranteed only by the audited transport implementation and tests.

If resolver simply recalculates VERIFIED from fields emitted by the same transport, VERIFIED can be read as stronger runtime evidence than actually exists.

### Corrección requerida

Every evidence claim must include an evidence basis, not only a status.

Equivalent structure:

EVIDENCE_CLAIM_V2 = { status, evidenceBasis, supportingBindings }.

Minimum evidenceBasis classes:

DIRECT_RUNTIME_EVIDENCE — independently observable per-attempt provider/runtime evidence.
IMPLEMENTATION_ASSURANCE — property guaranteed by provenance-bound code + tests, but not independently observable per attempt.
NOT_OBSERVABLE — evidence layer unavailable.

Rules:

- VERIFIED + DIRECT_RUNTIME_EVIDENCE requires concrete per-attempt evidence;
- VERIFIED + IMPLEMENTATION_ASSURANCE is allowed only for properties actually guaranteed by pinned/tested implementation and must not be described as provider-native proof;
- NOT_OBSERVABLE remains non-upgradable;
- FAILED remains fail closed where the policy requires the property;
- resolver recomputes both status and evidenceBasis from authorized policy + available evidence.

This is a MAJOR evidence-semantics correction. It is blocking for final design validation because the project has repeatedly required claim/evidence scope to remain exact.

## 10. E5 compatibility remains intentionally OPEN

R10 does not choose bridge A/B/C. That is correct.

Agent-influenced data cannot reach current legacy E5 hash fields until a dedicated compatibility proof, versioned E5 contract or explicit migration is approved.

This remains an implementation blocker, not a regression of the design correction.

## 11. Prototype-safe E5.1 remains OPEN

R10 does not claim that current E5.1 object mutation is prototype-safe.

PROTOTYPE_SAFE_REPAIR_APPLICATION remains OPEN and implementation-blocking.

No regression detected.

## 12. Minimal change remains OPEN

MINIMAL_CHANGE_EXECUTABLE_RULE remains OPEN and implementation-blocking.

No minimality is inferred from scope, hash profile or admission safety.

## 13. INCONSISTENCIAS

No contradiction with Repair R1, E5.1, E5.2 or E5.3 is introduced.

Two trust-boundary inconsistencies remain:

1. a V2-hashed INPUT_BINDING currently carries bindings that appear to identify the very runtime needed to verify that V2 hash;
2. a controlled JSON handle is described as trusted but not yet as a detached immutable snapshot.

The evidence status model also needs to distinguish runtime observation from implementation assurance.

## 14. VACÍOS / OMISIONES

New gaps:

R10-N1: out-of-band crypto/materialization trust root; exact bootstrap order; trust-root digest echoed but not self-authorizing.
R10-N2: immutable/detached snapshot semantics; alias-free handle; mutation regression tests.
R10-N3: evidenceBasis taxonomy; claim derivation rules; wording limits for implementation-assurance claims.

Existing OPEN remain:

CANONICAL_JSON_NUMBER_POLICY; CANONICAL_JSON_SHA256_V2 implementation; hash-profile bridge A/B/C; prototype-safe E5.1 repair application; minimal-change rule; provider/runtime-specific policies; exact numeric limits; schemas; strict parser; human implementation authorization; NEXT_STAGE_ID; AUTHORIZED_FOR_ASC.

## 15. REDUNDANCIAS

No problematic redundancy detected.

Out-of-band trust root + INPUT_BINDING echo serve authorization bootstrap and per-attempt traceability.
Trusted materialization + immutable snapshot serve admission safety and temporal stability.
Transport source binding + evidence basis serve correlation semantics and claim strength.
E5 compatibility gate + E5.1/E5.2/E5.3 serve profile compatibility and authoritative execution.

## 16. Resultado

R9-N1 = RESOLVED AT PROFILE-SEPARATION DESIGN LEVEL.
R9-N2 = RESOLVED AT ADMISSION-SHAPE DESIGN LEVEL.
R9-N3 = PARTIAL.

NEW FINDINGS:
R10-N1 = BLOCKER — V2 trust bootstrap cannot be established by the self-hashed input binding.
R10-N2 = BLOCKER — controlled JSON representation lacks immutable/alias-free snapshot semantics.
R10-N3 = MAJOR / FINAL-DESIGN BLOCKER — evidence claim status lacks evidence-basis semantics.

NEW_BLOCKING_FINDINGS = 2.
NEW_MAJOR_FINDINGS = 1.

R10_DIRECTED_REGRESSION = CORRECTION_REQUIRED.
IMPLEMENTATION_AUTHORIZED = FALSE.
REPAIR_AGENT_CONNECTED = FALSE.
NEXT_STAGE_ID = OPEN.
AUTHORIZED_FOR_ASC = OPEN.

## 17. Gate siguiente

Procede exclusivamente una R11 documental que:

1. defina un trust root resolver-owned y no auto-seleccionado por INPUT_BINDING;
2. convierta CONTROLLED_JSON_VALUE_HANDLE en snapshot inmutable/detached/alias-safe;
3. añada evidenceBasis a los claims y limite VERIFIED a la evidencia realmente disponible;
4. preserve todos los cierres anteriores;
5. no implemente todavía canonicalizer, E5.1, transport, provider, sandbox ni repair agent.

Después debe ejecutarse regresión dirigida R10-N1/R10-N2/R10-N3 + regresión acumulada completa antes de validar el diseño.
