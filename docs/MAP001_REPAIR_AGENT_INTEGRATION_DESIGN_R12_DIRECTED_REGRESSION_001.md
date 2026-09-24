# MAP-001 — Repair Agent Integration Design R12 — Directed Regression 001

Fecha: 2026-09-23
Artefacto auditado: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_012.md
Head auditado: caa59fc5dbf69e17d3331a4e06b4baec08f763b3
Ámbito: R11-N1/R11-N2/R11-N3 + regresión acumulada completa
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_AUTHORIZED: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Apoyo ASC v0.1

ASC v0.1 se usa únicamente en modo compile-only para preservar restricciones, OPEN, DO NOT INFER, prohibiciones y criterios.

TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-R12-DIRECTED-REGRESSION-001

ASC no ejecuta provider/model, no cierra OPEN y no autoriza implementación.

## 2. AUDITORÍA

R12 corrige materialmente:

R11-N1: define VERIFIED_ARTIFACT_LOAD_V1, same-buffer manifest parsing y una runtime dependency snapshot.
R11-N2: exige IMPLEMENTATION_ASSURANCE_EVIDENCE_V1 con execution result PASS y exact-scope matching.
R11-N3: congela una única secuencia materialize → validate exact materialized representation → seal → hash.

La regresión acumulada confirma que R11-N3 queda resuelto y no detecta reapertura de E5.1 → E5.2 → E5.3, de la separación resolver/transport/model ni de los límites de claims ya establecidos.

Se detectan dos bloqueos nuevos: completitud del grafo ejecutable verificado y autenticidad de la evidencia PASS usada para IMPLEMENTATION_ASSURANCE.

## 3. Resultado dirigido

R11-N1 = PARTIAL / BLOCKED BY R12-N1.
R11-N2 = PARTIAL / BLOCKED BY R12-N2.
R11-N3 = PASS.

R10-N1 = PASS AT BOOTSTRAP-STRUCTURE LEVEL.
R10-N2 = PASS AT SNAPSHOT-SEMANTICS LEVEL.
R10-N3 = PASS AT CLAIM-TAXONOMY LEVEL.
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

RA-I1 = PARTIAL / EXECUTABLE DEPENDENCY CLOSURE INCOMPLETE.
RA-I2 = PASS.
RA-I3 = PASS.
RA-I4 = PASS AS OPEN/BLOCKING.
RA-I5 = PASS AT DESIGN LEVEL / E5.1 EXECUTABLE DEBT OPEN.
RA-I6 = PASS AT DESIGN-COVERAGE LEVEL.
RA-I7 = PASS.
RA-I8 = PASS.

## 4. R11-N1 — same-byte load correction is valid for each bound artifact

R12 now requires VERIFIED_BYTES == CONSUMED_BYTES and forbids hash-then-reopen without an equivalent verified-load guarantee.

For a single manifest, policy file or executable artifact, this closes the direct TOCTOU identified in R11.

The remaining problem is not identity of one file; it is completeness of everything that can influence execution after that file is loaded.

## 5. R12-N1 — verified-load does not yet define a closed executable dependency graph

R12 creates VERIFIED_ARTIFACT_HANDLE_V1 for “every bootstrap/runtime dependency” and freezes INTEGRATION_RUNTIME_SNAPSHOT_V1.

However, it does not define how the design proves that this set is complete for an executable module graph.

For JavaScript/Node or an equivalent runtime, executing one verified module can still resolve or consume:

- static imports;
- dynamic imports;
- require/import hooks;
- package.json/package exports resolution;
- node_modules/package dependencies;
- built-in modules whose semantics depend on runtime version;
- loader/import-map configuration;
- native addons;
- environment-selected modules or paths;
- transitive dependencies loaded only on particular branches.

Verifying the top-level source bytes does not prove that every executable byte or runtime semantic dependency reached during execution belongs to INTEGRATION_RUNTIME_SNAPSHOT_V1.

### Impacto

A dependency omitted from the snapshot could change behavior while all explicitly listed VERIFIED_ARTIFACT_HANDLE_V1 values still pass.

This weakens the intended properties of bootstrap provenance, CANONICAL_JSON_SHA256_V2, trusted materialization and IMPLEMENTATION_ASSURANCE.

### Corrección requerida

Define an EXECUTABLE_DEPENDENCY_CLOSURE_V1 or equivalent with at least:

- entrypoint identity;
- complete allowed import/dependency graph;
- resolver/loader resolution rules;
- exact handling of static and dynamic imports;
- allowed built-ins plus exact runtime/toolchain identity;
- package/native dependency bindings where applicable;
- explicit prohibition or binding of ambient node_modules/import hooks/module search paths;
- fail-closed behavior for any dependency not present in the authorized closure;
- closure digest included in INTEGRATION_RUNTIME_SNAPSHOT_V1 and attempt provenance.

The verified loader must resolve executable dependencies only through that authorized closure or another demonstrably equivalent sealed execution environment.

“Every runtime dependency” cannot remain an assertion; the design must define how completeness is enforced.

R12-N1 is BLOCKER.

## 6. R11-N2 — PASS execution requirement is materially improved

R12 correctly distinguishes test definitions from actual execution evidence and requires overallResult = PASS, no failed tests, required tests not skipped, exact implementation/policy/runtime matching and a validity policy.

The remaining R12-N2 concerns whether the immutable report is authentic evidence from an authorized assurance producer rather than merely an internally consistent PASS document.

## 7. R12-N2 — immutable PASS report has integrity but no fully specified authenticity root

executionReportArtifactBinding requires a raw/content-addressed digest, producer identity and execution/run identity.

That proves identity/integrity of the report once a trusted copy is selected, but a content digest does not by itself prove that the report was actually produced by an authorized CI/test runner after executing the claimed tests.

A fabricated local JSON document can also have a stable SHA-256 and can claim producer identity, run ID and PASS.

R12 says the report identity must be verifiable and not auto-declared by transport, but the trust mechanism for the assurance producer remains OPEN.

### Corrección requerida

Define an ASSURANCE_PRODUCER_AUTHORITY_V1 or equivalent, resolver-owned and independent of transport/model, which specifies how a PASS report becomes authentic evidence.

Acceptable classes may include:

- signed/attested report whose signer identity is pinned by the assurance authority;
- resolver-authenticated retrieval from an authorized immutable CI artifact/run plus exact artifact digest;
- repository/release provenance that independently binds the report digest to an authorized execution record;
- another mechanism with equivalent authenticity, integrity and scope guarantees.

The contract must bind:

assurance producer identity → execution identity → exact report digest → tested runtime snapshot/implementation → claim mapping.

The report must not authorize its own producer identity.

If authenticity cannot be established, VERIFIED + IMPLEMENTATION_ASSURANCE is forbidden even if the report body says PASS.

R12-N2 is BLOCKER.

## 8. R11-N3 — PASS

R12 now has one normative sequence:

bounded input / approved builder inputs
→ materialize detached private controlled representation
→ validate that exact materialized representation
→ seal immutable snapshot
→ canonical serialize/hash.

Pre-materialization checks are explicitly non-authoritative, and validate-to-seal exposure is prohibited.

No competing normative pipeline remains.

## 9. Hash-profile and E5 boundaries

R12 preserves LEGACY_LOGICAL_SHA256_V1 for current E5-bound fields and CANONICAL_JSON_SHA256_V2 for future integration artifacts.

E5_HASH_PROFILE_COMPATIBILITY_GATE_V1 remains mandatory and the bridge A/B/C remains OPEN.

No silent migration is introduced.

## 10. Prototype-safe E5.1 and minimal change

PROTOTYPE_SAFE_REPAIR_APPLICATION remains OPEN.
MINIMAL_CHANGE_EXECUTABLE_RULE remains OPEN.

R12 does not falsely close either item.

Both remain implementation blockers independent of R12-N1/R12-N2.

## 11. INCONSISTENCIAS

No contradiction with Repair R1 or the E5.1/E5.2/E5.3 authority chain is introduced.

Two trust gaps remain:

1. INTEGRATION_RUNTIME_SNAPSHOT_V1 identifies verified artifacts but does not yet prove the executable dependency graph is closed against ambient/transitive resolution.
2. IMPLEMENTATION_ASSURANCE_EVIDENCE_V1 identifies an immutable PASS report but does not yet establish an independent authenticity root for the report producer/execution.

## 12. VACÍOS / OMISIONES

New gaps:

R12-N1: executable dependency closure; import/module-resolution policy; dynamic/transitive dependency handling; built-in/runtime binding; ambient dependency prohibition.
R12-N2: assurance producer authority; authentic execution attestation/retrieval chain; non-self-authorizing report producer binding.

Existing OPEN remain:

verified loader implementation; symlink/reparse values; bootstrap deployment; CANONICAL_JSON_NUMBER_POLICY; CANONICAL_JSON_SHA256_V2 implementation; trusted snapshot implementation; assurance validity values; provider/model/runtime; provider-specific policies; hash-profile bridge A/B/C; E5 compatibility proof/migration; prototype-safe E5.1; minimal-change rule; numeric limits; schemas; strict parser; human implementation authorization; NEXT_STAGE_ID; AUTHORIZED_FOR_ASC.

## 13. REDUNDANCIAS

No problematic redundancy detected.

Verified artifact identity and executable dependency closure cover per-artifact bytes and completeness of the execution graph.
Immutable PASS report and assurance-producer authority cover report integrity and report authenticity.
Private snapshot materialization and post-materialization validation cover isolation and exact-value validity.
E5 compatibility gate and E5.1/E5.2/E5.3 remain distinct compatibility/execution controls.

## 14. Resultado

R11-N1 = PARTIAL.
R11-N2 = PARTIAL.
R11-N3 = RESOLVED.

NEW FINDINGS:
R12-N1 = BLOCKER — verified artifacts are not yet a provably closed executable dependency graph.
R12-N2 = BLOCKER — immutable PASS report lacks an explicit independent authenticity authority.

NEW_BLOCKING_FINDINGS = 2.
NEW_MAJOR_FINDINGS = 0.

R12_DIRECTED_REGRESSION = CORRECTION_REQUIRED.
IMPLEMENTATION_AUTHORIZED = FALSE.
REPAIR_AGENT_CONNECTED = FALSE.
NEXT_STAGE_ID = OPEN.
AUTHORIZED_FOR_ASC = OPEN.

## 15. Gate siguiente

Procede exclusivamente una R13 documental que:

1. defina un executable dependency closure sellado para el runtime de integración;
2. defina una authority independiente que autentique la evidencia PASS de IMPLEMENTATION_ASSURANCE;
3. preserve el PASS de R11-N3 y todos los cierres acumulados;
4. no implemente todavía loader, canonicalizer, E5.1, transport, provider, sandbox ni repair agent.

Después debe ejecutarse regresión dirigida R12-N1/R12-N2 + regresión acumulada completa antes de validar el diseño.
