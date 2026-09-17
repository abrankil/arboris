# Árboris — ACE ↔ Árboris ↔ ASC Interface & Dependency Matrix
**Fecha:** 2026-09-17
**Estado:** auditoría / diseño verificable, no normativa todavía
**Base:** `main` at `01435162077bfa2f1e3df0666c72940cf97397c4`

## 1. Purpose
Determine which interfaces between ACE, the shared Árboris project, and ASC are real today, which are documented but not technically implemented, and which dependencies are absent by design.

## 2. Components and authorities
| Component | Current responsibility | Authority consumed | Authority owned |
|---|---|---|---|
| Árboris repository/project | shared product, app, data and integration host | project-specific sources | no universal authority over ACE/ASC |
| ACE | canonical character-evidence identification behavior | canonical botanical JSON + variability/context data | identification behavior |
| ASC | deterministic scene-contract compiler | prepared/authorized ASC input contract | ASC compilation behavior |
| Master Botánico 2.0 | botanical/editorial source | source workbook | botanical knowledge |
| Environment/reference layer | environmental evidence/reference catalog | field/web/institutional/art sources | reference provenance and classification |

## 3. Verified interfaces

### I-ACE-01 — Master Botánico → canonical botanical JSON
**Status: IMPLEMENTED / DECLARED SOURCE PIPELINE**
Master Botánico 2.0 is the editorial/scientific source. `export_master.py` produces the eight canonical JSON files. ACE consumes those structured files. This is an upstream data interface, not an ACE ↔ ASC interface.

### I-ACE-02 — canonical botanical JSON + variability/context → ACE dataset
**Status: IMPLEMENTED**
`tools/canonical-identification/dataset.mjs` loads the canonical species/character/relation data plus variability, contexts and sources, and validates cross-references.

### I-ACE-03 — session evidence → ACE engine
**Status: IMPLEMENTED**
The engine accepts character evidence and applies compatibility, candidate filtering, next-character selection, retry, and identification assessment. The interface belongs to ACE; the session/UI producer is external to the engine.

### I-ASC-01 — prepared authorized contract → ASC v0.1
**Status: IMPLEMENTED**
ASC v0.1 accepts a fixed top-level contract: `version`, `executionMode`, `testId`, `objective`, `authorizedSources`, `structuralContract`, `mandatoryRelations`, `open`, `doNotInfer`, `prohibited`, `artisticFreedom`, `cameraFormat`, `readingPriorities`, `validationCriteria`. Unknown top-level keys are rejected.

### I-ASC-02 — ASC v0.1 → deterministic prompt
**Status: IMPLEMENTED**
The compiler emits a deterministic text prompt and does not execute a generative provider.

### I-UP-ASC-01 — upstream evidence/contracts → prepared ASC contract
**Status: EXPERIMENTAL / NOT YET A GENERALIZED RUNTIME INTERFACE**
The first real field case, `FIELD-ARR-2026-09-16-01`, has been used to define a translation experiment. The translation layer must distinguish direct evidence, interpretation, artistic authorization, and unresolved decisions. It must not infer species identity from environmental photographs alone, map topology, walkable envelope, absent spatial metadata, ecological placement rules, provider choice, or final art authorization.

### I-ACE-ASC-01 — ACE → ASC direct interface
**Status: NOT IMPLEMENTED / INTENTIONALLY OPEN**
No direct code dependency has been established between `tools/canonical-identification/` and `tools/asc/`. The current architecture does not require one. If future integration is required, it must be introduced as an explicit contract/interface.

## 4. Dependency matrix
Legend: **D** direct implementation dependency; **C** explicit contract/data interface; **P** procedural/documented relationship; **—** no dependency established; **O** open/future interface.

| Consumer ↓ / Producer → | Master Botanical | ACE | Árboris reference layer | ASC |
|---|---:|---:|---:|---:|
| ACE | C | — | — | — |
| ASC | — | — | C/P | — |
| Árboris app/product | C/P | P/O | C/P | P/O |
| ACE tests | C | D | — | — |
| ASC tests | — | — | C | D |
| CI global | P | P | P | P |

Interpretation: ACE has a direct data dependency on canonical botanical exports and complementary variability/context data. ASC has a direct contract dependency on its prepared input; environmental/reference material can be upstream input only after translation/classification. No direct ACE → ASC implementation dependency is established. The product/app relationship with ACE and ASC is currently partly procedural/roadmap-level rather than a demonstrated runtime integration. Global CI invokes both subsystems, creating pipeline coupling without creating code coupling.

## 5. Change-isolation matrix
| Hypothetical change | Files expected to change | Interface potentially affected | Other subsystem should require source change? | Current evidence |
|---|---|---|---|---|
| ACE algorithm change | `tools/canonical-identification/*` | ACE engine API/session evidence | No | PASS via isolation probe |
| ACE botanical data change | `data/botanical/*` | ACE dataset/data schema | No, unless contract/data schema changes | PASS at architectural level |
| ASC compiler change | `tools/asc/*` | ASC contract → prompt | No | PASS via isolation probe |
| ASC contract field change | ASC spec/implementation/tests | ASC contract interface | No, unless an upstream adapter targets changed field | OPEN until compatibility test exists |
| Environmental reference change | `docs/references/environments/*` | upstream translation | No | OPEN for generalized adapter |
| ACE → ASC future integration | explicit adapter/contract | I-ACE-ASC-01 | Only through declared interface | OPEN |

## 6. What is proven
1. ACE and ASC occupy separate implementation directories.
2. ACE consumes structured botanical data rather than ASC behavior.
3. ASC v0.1 consumes a prepared contract rather than ACE internals.
4. ASC rejects unknown top-level contract fields.
5. ACE and ASC each have independently callable test surfaces.
6. Controlled ACE-only and ASC-only branches passed the current global CI.
7. The global CI nevertheless executes both subsystems.

## 7. Not yet proven
1. A future ACE PR can run a selective ACE/interface test set without running ASC.
2. A future ASC PR can run a selective ASC/interface test set without running ACE.
3. The app/product has a stable runtime interface to ACE.
4. The app/product has a stable runtime interface to ASC.
5. ACE output is consumed by ASC anywhere in production code.
6. A generalized upstream → ASC adapter exists beyond the experimental field case.
7. Contract version compatibility is automatically checked across future producers/consumers.

## 8. Candidate architectural invariant
> ACE and ASC may evolve independently. Cross-component source changes are required only when an explicitly declared interface or shared contract changes. Repository co-location and global CI execution do not constitute a component dependency.

Keep this as a candidate invariant until encoded in automated checks.

## 9. Recommended mechanical checks
Do not add these checks until their exact scope is approved.

- **Forbidden direct imports:** fail if `tools/asc/` imports `tools/canonical-identification/`, or vice versa.
- **Ownership/path boundary:** require component changes to remain within owned paths unless the PR explicitly declares an interface change.
- **Contract compatibility:** when an interface contract changes, require producer/consumer fixture tests.
- **Selective test surfaces:** expose independently executable ACE tests, ASC tests, interface tests, and full repository tests. The full test suite may remain global.
- **Dependency report:** generate a machine-readable report of direct imports, contract files, shared data files, test entry points, and workflow entry points.

## 10. Audit verdict
**ARCHITECTURAL INDEPENDENCE: PASS**

**CODE DEPENDENCY INDEPENDENCE: PASS**

**AUTHORITY INDEPENDENCE: PASS**

**EXPLICIT ASC CONTRACT INTERFACE: PASS**

**DIRECT ACE ↔ ASC INTERFACE: OPEN / NONE IMPLEMENTED**

**GLOBAL CI ISOLATION: NOT SATISFIED**

**RUNTIME PRODUCT ↔ ACE/ASC INTERFACES: OPEN**

**GENERALIZED UPSTREAM → ASC INTERFACE: OPEN**

No architectural merge or refactor is justified by this audit alone.