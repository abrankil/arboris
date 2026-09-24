# MAP-001 — Repair Agent Integration Design R11 — Directed Regression 001

Fecha: 2026-09-23
Artefacto auditado: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_011.md
Head auditado: 6f314ba832719789636c3ce92e4a82faca4c4777
Ámbito: R10-N1/R10-N2/R10-N3 + regresión acumulada completa
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_AUTHORIZED: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Apoyo ASC v0.1

ASC v0.1 se usa únicamente en modo compile-only para preservar restricciones, OPEN, DO NOT INFER, prohibiciones y criterios.

TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-R11-DIRECTED-REGRESSION-001

ASC no decide PASS/FAIL técnico, no ejecuta provider/model y no autoriza implementación.

## 2. AUDITORÍA

R11 corrige materialmente los tres hallazgos dirigidos de R10:

R10-N1: introduce BOOTSTRAP_AUTHORITY_V1, raw-hash bootstrap e INTEGRATION_CRYPTO_RUNTIME_BINDING_V1 antes de cualquier V2 artifact.
R10-N2: sustituye la referencia validada por CONTROLLED_JSON_SNAPSHOT_V1 detached/alias-safe y CONTROLLED_JSON_VALUE_HANDLE_V2.
R10-N3: introduce EVIDENCE_CLAIM_V2 con status, evidenceBasis y supportingBindings.

La regresión acumulada no detecta reapertura de las fronteras E5.1 → E5.2 → E5.3 ni de la separación resolver / transport / model.

Se detectan, sin embargo, dos bloqueos nuevos y una inconsistencia mayor: fidelidad entre bytes verificados y código realmente ejecutado durante bootstrap; ausencia de evidencia de ejecución PASS para IMPLEMENTATION_ASSURANCE; y orden contradictorio de validación/copia/sellado de la snapshot.

## 3. Resultado dirigido

R10-N1 = PARTIAL / BLOCKED BY R11-N1.
R10-N2 = PARTIAL / BLOCKED BY R11-N3.
R10-N3 = PARTIAL / BLOCKED BY R11-N2.

R9-N1 = PASS AT PROFILE-SEPARATION DESIGN LEVEL.
R9-N2 = PASS AT ADMISSION-BOUNDARY DESIGN LEVEL.
R9-N3 = PASS ON CLAIM SEPARATION.
R8-N1..R8-N3 = PASS AT DESIGN LEVEL.
R7-N1..R7-N3 = PASS.
R6-N1..R6-N3 = PASS AT DESIGN LEVEL.
R5-N1..R5-N3 = PASS.
R4-N1/R4-N2 = PASS AT DESIGN LEVEL.
R3-N1/R3-N2 = PASS AT DESIGN LEVEL.
R2-N1 = PASS.
R2-N2 = PASS AT DESIGN LEVEL / EXECUTABLE DEBT OPEN.
R2-N3 = PASS.

RA-I1 = PARTIAL / VERIFIED-BYTES-TO-EXECUTED-BYTES BINDING INCOMPLETE.
RA-I2 = PASS.
RA-I3 = PASS.
RA-I4 = PASS AS OPEN/BLOCKING.
RA-I5 = PARTIAL / SNAPSHOT ORDERING INCONSISTENCY.
RA-I6 = PASS AT DESIGN-COVERAGE LEVEL.
RA-I7 = PASS.
RA-I8 = PASS.

## 4. R10-N1 — trust root separation is directionally correct

R11 correctly prevents INPUT_BINDING from selecting the runtime that validates itself.

BOOTSTRAP_AUTHORITY_V1 exists outside the generative flow, and the trust-root manifest is authenticated first by raw SHA-256.

This resolves the self-authorizing binding defect in principle.

The remaining R11-N1 concerns whether the code/policy bytes that are actually executed are exactly the bytes whose raw hashes were verified.

## 5. R11-N1 — hash-then-load bootstrap does not yet bind verified bytes to executed bytes

R11 requires:

1. verify raw SHA-256 of trust-root/dependency files;
2. then load/pin parser, materializer, builder, serializer and number policy.

But it does not state that the bytes executed/loaded in step 2 are the same immutable bytes verified in step 1.

If the implementation hashes a path and later imports/opens that path again, a filesystem change, symlink substitution, checkout mutation or other TOCTOU event can replace content between verification and execution.

The same issue applies to the trust-root manifest if the implementation hashes one read and reparses a later read.

### Corrección requerida

R12 must define a VERIFIED_LOAD_V1 or equivalent primitive with these properties:

- repository root is fixed before path resolution;
- every canonical repo-relative path is resolved inside that root;
- path escape and symlink/reparse substitution policy is explicit;
- raw SHA-256 is computed over the exact bytes that will be parsed/executed;
- the manifest is parsed from the already-verified byte buffer, not a fresh path read;
- executable dependencies are loaded from immutable/content-addressed verified bytes, or are reverified at the exact execution boundary with an equivalent no-TOCTOU guarantee;
- actual executed module identity is recorded in attempt provenance;
- any byte drift between verification and load fails closed.

If the runtime cannot execute directly from verified bytes, the design must specify an immutable staging/content-addressed mechanism or another demonstrably equivalent solution.

The fields allowedRepositoryIdentity, allowedBranchOrReleaseScope and trustRootManifestCanonicalPath must also have explicit verification semantics rather than remaining descriptive metadata.

R11-N1 is BLOCKER.

## 6. R10-N2 — immutable snapshot concept is correct

R11 correctly requires detached, alias-free, own-data-only, accessor-free and deeply immutable controlled snapshots.

It also rejects shallow Object.freeze as sufficient evidence.

The remaining defect is an internal ordering contradiction described in R11-N3.

## 7. R11-N2 — IMPLEMENTATION_ASSURANCE binds test artifacts but not a proven PASS execution

R11 requires IMPLEMENTATION_ASSURANCE to be supported by exact implementation SHA, source-binding policy SHA, provider/runtime scope, test artifact/version and platform/runtime constraints.

That proves which tests are relevant, but not that those tests were actually executed and passed against the exact implementation/runtime being used.

A test source artifact is not itself execution evidence.

### Impacto

Under the current wording, a claim could be:

VERIFIED + IMPLEMENTATION_ASSURANCE

while supportingBindings identify test code that was never run, failed, ran against another implementation SHA, or ran in a materially different runtime environment.

That would overstate the evidence basis and reopen the claim/evidence discipline that R10-N3 was meant to correct.

### Corrección requerida

Define an IMPLEMENTATION_ASSURANCE_EVIDENCE_V1 or equivalent that binds at minimum:

implementation dependency ID/path/raw SHA.
policy dependency ID/path/raw SHA.
test artifact IDs/paths/raw SHAs.
test execution identity/run ID.
exact tested commit/tree or artifact set.
execution result = PASS.
provider/runtime scope.
OS/platform/runtime/toolchain scope where material.
test start/completion identity or immutable report digest.
coverage/claim mapping identifying which claim the tests support.

Resolver may accept VERIFIED + IMPLEMENTATION_ASSURANCE only when the assurance evidence is provenance-bound, reports PASS and matches the exact implementation/policy/provider/runtime scope in the current attempt.

Stale, failed, skipped, incomplete or scope-mismatched test evidence must not support VERIFIED.

R11-N2 is BLOCKER for final design validation.

## 8. R10-N3 — status + basis separation is materially improved

R11 correctly prohibits provider-native VERIFIED based only on implementation assurance and correctly allows NOT_OBSERVABLE to remain non-upgraded.

The new R11-N2 concerns the quality of evidence required to instantiate IMPLEMENTATION_ASSURANCE, not the taxonomy itself.

## 9. R11-N3 — contradictory snapshot validation order

R11 contains two different sequences.

Section 11 states:

EXTERNAL_BYTES_ROUTE: bounded bytes → strict parse/decoder → domain validation → recursive copy into controlled storage → seal snapshot → canonical hash.

Section 15 states the valid sequence is:

capture input → copy/materialize → validate controlled representation → seal snapshot → canonical serialize/hash.

These are not equivalent.

The security property needed for CONTROLLED_JSON_SNAPSHOT_V1 is that the exact representation that will be sealed and hashed is itself validated.

Validating only the source representation before copying is insufficient if materialization can transform, omit or reinterpret data.

### Corrección requerida

Freeze one normative sequence:

bounded input / approved builder inputs
→ materialize detached controlled representation
→ validate the materialized representation against CANONICAL_JSON_VALUE_V1 and snapshot invariants
→ seal snapshot
→ canonical serialize/hash.

Pre-copy validation may exist as an early rejection optimization, but cannot replace validation of the exact materialized snapshot.

The same order must be used consistently in EXTERNAL_BYTES_ROUTE, CONTROLLED_BUILDER_ROUTE, tests and ASC contract.

R11-N3 is MAJOR and blocks final design validation until corrected.

## 10. Accumulated invariants preserved

No reopening was found for:

- request/response layer separation;
- post-response run/report rebind;
- minimalChange remaining explicitly OPEN;
- prototype-safe Repair application remaining explicitly OPEN;
- resolver/transport/model capability separation;
- canonical byte representation;
- expected/actual provider request envelope binding;
- replayable response extraction;
- resource-surface separation;
- provider invocation source binding;
- legacy/V2 hash-profile separation;
- provider-native identity NOT_OBSERVABLE discipline.

## 11. INCONSISTENCIAS

Three concrete inconsistencies/gaps remain:

1. verified file bytes are not yet explicitly identical to executed/parsed bytes at the bootstrap load boundary;
2. IMPLEMENTATION_ASSURANCE names tests but does not require an immutable PASS execution record;
3. R11 gives two different validation/copy orders for controlled snapshots.

No contradiction with the existing E5.1/E5.2/E5.3 authority chain is introduced.

## 12. VACÍOS / OMISIONES

New gaps:

R11-N1: verified-load primitive; immutable/content-addressed execution handoff; repo-root/path/symlink policy; exact executed-byte provenance.
R11-N2: test-run PASS attestation; run/environment/implementation matching; claim-to-test mapping.
R11-N3: single normative snapshot materialize/validate/seal order.

Existing OPEN remain:

CANONICAL_JSON_NUMBER_POLICY; CANONICAL_JSON_SHA256_V2 implementation; hash-profile bridge A/B/C; E5 compatibility proof/migration; prototype-safe E5.1 repair application; minimalChange executable semantics; provider/runtime-specific policies; numeric limits; schemas; strict parser; human implementation authorization; NEXT_STAGE_ID; AUTHORIZED_FOR_ASC.

## 13. REDUNDANCIAS

No problematic redundancy detected.

Raw dependency hash + verified-load identity cover stored bytes and consumed/executed bytes.
Test artifact provenance + test execution attestation cover test identity and actual PASS evidence.
Pre-copy validation + snapshot validation may coexist only as optimization + authoritative validation; they must not be competing normative gates.
E5 compatibility gate + E5.1/E5.2/E5.3 remain distinct compatibility/execution defenses.

## 14. Resultado

R10-N1 = PARTIAL.
R10-N2 = PARTIAL.
R10-N3 = PARTIAL.

NEW FINDINGS:
R11-N1 = BLOCKER — verified dependency bytes are not yet bound to the exact parsed/executed bytes.
R11-N2 = BLOCKER — IMPLEMENTATION_ASSURANCE lacks immutable PASS execution evidence.
R11-N3 = MAJOR / FINAL-DESIGN BLOCKER — snapshot validation order is internally inconsistent.

NEW_BLOCKING_FINDINGS = 2.
NEW_MAJOR_FINDINGS = 1.

R11_DIRECTED_REGRESSION = CORRECTION_REQUIRED.
IMPLEMENTATION_AUTHORIZED = FALSE.
REPAIR_AGENT_CONNECTED = FALSE.
NEXT_STAGE_ID = OPEN.
AUTHORIZED_FOR_ASC = OPEN.

## 15. Gate siguiente

Procede exclusivamente una R12 documental que:

1. defina verified-load semantics que unan bytes hasheados con bytes realmente parseados/ejecutados;
2. exija evidencia immutable de test execution PASS para IMPLEMENTATION_ASSURANCE;
3. congele una única secuencia materialize → validate snapshot → seal → hash;
4. preserve todos los cierres acumulados;
5. no implemente todavía canonicalizer, E5.1, transport, provider, sandbox ni repair agent.

Después debe ejecutarse regresión dirigida R11-N1/R11-N2/R11-N3 + regresión acumulada completa antes de validar el diseño.
