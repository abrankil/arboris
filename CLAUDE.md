# CLAUDE.md — Árboris

## 0. Purpose

This file defines how Claude should operate inside the Árboris repository.

It is a routing and safety layer.
It is not a domain authority.
It must not duplicate or replace authoritative project documents.

If this file conflicts with a normative or domain authority:
- follow the authority;
- report the conflict;
- do not silently reconcile it.

---

## 1. Start-of-task procedure

Before acting:

1. identify the requested outcome;
2. classify the task;
3. locate the applicable authority or operational context;
4. inspect current repo state when the answer depends on it;
5. distinguish verified facts from interpretation or unresolved information;
6. perform only the minimum sufficient and reversible action required by the request.

Read only the authorities necessary for the current task.
Do not load unrelated domain documents by default.

Do not assume:
- prior conversation state equals current repo state;
- a generated result is evidence;
- a local Git state you did not inspect;
- an unmentioned permission to edit, commit, push, merge, rebase, reset, or discard.

---

## 2. Routing

### ASC / production / MAP / blockout / generative-result work

Read first:

- `docs/ASC_PRODUCTION_VOCABULARY_AI_CONTEXT.md`

Then read the specific authorities required by the task.

For ASC semantics:

- `docs/ARBORIS_SCENE_COMPILER.md`

For end-to-end ASC workflow, upstream contract preparation, result review, repository integration, or advanced assurance such as negative harness, smoke, blind / isolated reproduction, freeze, provenance/manifests/evidence packages, reproducibility, or scoring:

- `docs/ASC_WORKFLOW_GUIDE.md`

Do not require `ASC_WORKFLOW_GUIDE.md` for a simple compile of an already prepared and authorized contract.

For executable ASC v0.1 behavior:

- `docs/ASC_V0_1_EXECUTABLE_SPEC.md`
- `tools/asc/compile_asc.mjs`
- `tools/asc/compile_asc.test.mjs` when relevant

For spatial / territorial / production work, use the applicable authority, such as:

- `docs/SPATIAL_MODEL.md`
- `docs/TERRITORIAL_MAPPING_PROTOCOL.md`
- `docs/PILOT_ENVIRONMENT_VISUAL_CANON.md`
- `docs/ENVIRONMENT_PRODUCTION_SPEC.md`
- `docs/MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN.md`

### Reviews that may consolidate a project decision

Read and apply:

- `docs/DEVELOPMENT_MANUAL.md`

### General project vocabulary

Use:

- `docs/GENERAL_VOCABULARY_GUIDE.md`

Do not treat operational guides as higher authority than normative or domain-specific documents.

---

## 3. Reasoning / reporting labels

Claude may use these reporting labels when useful:

- VERIFIED / OBSERVED / DECLARED
- INTERPRETATION
- HYPOTHESIS
- UNRESOLVED

These are reporting labels only.

They do not replace project states such as:
- `claimState`
- `evidenceStatus`
- `productionStatus`
- ASC treatments such as `KNOWN`, `OPEN`, `PROHIBIDO INFERIR`, `ART-PROVISIONAL`

Use `OPEN` only when an applicable authority, contract, or user explicitly classifies something as OPEN.

If information is merely missing:
- do not infer it;
- mark it unresolved for the current task;
- ask only if the missing decision materially blocks safe execution.

---

## 4. User-command semantics

### “investigar”

Inspect current repo state and relevant sources.

Do not:
- answer only from general knowledge when repo evidence is required;
- modify files;
- upgrade interpretation to project truth.

Return findings, gaps, and relevant sources.

### “analizar”

Evaluate the current proposal or material against the applicable authorities.

Do not modify repo unless modification is explicitly requested.

### “auditar”

Apply the applicable review protocol.

For project reviews that may consolidate decisions, include:

- AUDITORÍA
- INCONSISTENCIAS
- VACÍOS / OMISIONES
- REDUNDANCIAS
- DECISIÓN

Use `NOT TESTED` when the available evidence cannot support a criterion.

### “iterar”

Produce the next evidence-backed iteration.

Do not:
- create a cosmetic variant when the objective is structural;
- broaden scope without justification;
- write to the repo unless the current task explicitly requires modifying an artifact/file.

Every meaningful iteration should make clear:

- what changed;
- why;
- what evidence justified it;
- what stayed unchanged;
- what remains unresolved or OPEN.

### “corregir” / “corrige” / common typo “correjir”

Correct the findings from the immediately preceding audit/review.

Scope rule:

- if the object under review is conversational/proposed text, correct it in the response only;
- if the user explicitly asked to modify a repo file or artifact, edit that object within the authorized scope;
- do not infer permission to edit unrelated files.

Do not add unrelated improvements unless required to avoid a contradiction.

### “documentar”

Authorizes creating or updating documentation for the current work.

It does not authorize automatically:
- commit;
- push;
- merge;
- rebase;
- reset.

Before writing:
- check whether the target file already exists;
- read the current version if it exists;
- preserve traceability;
- document only what was actually demonstrated.

### “compilar con ASC”

Compile only.

Do not execute a generative model unless the user also requests generation/execution.

### “generar con ASC” / “ejecutar con ASC”

Follow the broader workflow:

```text
compile
→ external executor
→ ASC result
```

Do not claim that `compile_asc.mjs` performs generation.

---

## 5. Permission model

### READ

Claude may inspect files required to answer the task.

### EDIT

Claude may edit files only when the user request requires modification of the relevant artifact or repo content.

Editing one file does not authorize unrelated cleanup or adjacent-file changes.

Do not infer repo-write permission from:
- analyze
- audit
- investigate
- iterate

unless the task clearly targets an existing file/artifact for modification.

### DOCUMENT

“Documentar” permits creating/updating documentation within scope.

It does not imply commit or push.

### COMMIT

Requires explicit authorization.

### PUSH

Requires explicit authorization.

### MERGE / REBASE / RESET / DISCARD / destructive checkout

Require:
- explicit authorization;
- prior state inspection;
- explanation of affected changes.

---

## 6. Git safety

Before local Git operations that may change state, inspect:

```bash
git status
git branch --show-current
```

If there are uncommitted changes:

do not automatically:
- reset;
- discard;
- stash;
- rebase;
- merge;
- switch destructively.

Report the affected files first.

For synchronization, prefer safe fast-forward behavior when applicable.

Do not claim:
- committed;
- pushed;
- merged;
- synchronized;

unless verified.

If Claude only has remote GitHub access:
- report remote state only;
- do not claim local Git state.

---

## 7. Authority and semantic safety

Never:

- convert a generated result into territorial, botanical, ecological, spatial, or scientific evidence;
- close an OPEN by plausibility;
- create a new project state because it is convenient;
- use a visual path as proof of walkability;
- use visual attractiveness as proof of validity;
- turn an operational guide into a normative source;
- silently choose between conflicting current authorities.

When sources conflict:

1. identify both;
2. state the contradiction;
3. identify the authority needed to resolve it;
4. preserve unresolved state when necessary.

---

## 8. Evidence-class rule

Evaluate each claim only from evidence capable of supporting it.

Visual evidence may support:
- readability;
- composition;
- visible hierarchy;
- visible relations.

Logical/materialized geometry may support:
- connectivity;
- navigation;
- walkableEnvelope preservation;
- geometric relations.

Runtime evidence may support:
- gameplay;
- interaction;
- camera behavior;
- occlusion during execution.

Domain evidence may support:
- territorial;
- botanical;
- ecological;
- scientific claims.

Do not upgrade one evidence class into another.

---

## 9. Repo-change discipline

Do not create a new file when an existing document can serve the same function.

Before introducing a new documentation layer, ask:

```text
Does this function already exist?
Is the new function materially different?
Would this create two sources of truth?
```

Redundancy must be classified as:
- intentional;
- problematic.

Do not remove duplication until authority and dependencies are clear.

---

## 10. ASC-change discipline

Do not modify ASC v0.1 because a generated result is imperfect.

Before proposing a schema/compiler change, demonstrate:

```text
real problem
+
current schema cannot represent or preserve the requirement
```

A model/executor failure is not automatically a compiler failure.

A copy problem is not automatically a schema problem.

An OPEN is not automatically a v0.2 trigger.

---

## 11. Unclassified-task fallback

If a task does not map cleanly to an existing workflow:

1. identify the requested outcome;
2. locate the closest applicable authority;
3. inspect current repo state when relevant;
4. avoid inventing a new project rule;
5. choose the minimum reversible action;
6. ask for clarification only when a missing decision blocks safe execution;
7. document the new workflow only after it proves necessary.

---

## 12. Truthfulness about tool use

Claude must distinguish:

```text
VERIFIED
REPRODUCED
INFERRED
NOT TESTED
```

Do not claim that you:
- opened a file you did not inspect;
- ran tests you did not run;
- executed a compiler you only reasoned about;
- checked local Git without local access;
- generated an image when you only wrote a prompt;
- validated runtime behavior from a screenshot.

---

## 13. Minimal output conventions

For complex technical work, when useful, close with:

```text
VERIFIED
INTERPRETATION
UNRESOLVED / OPEN
DECISION
NEXT GATE
```

Do not force this structure onto simple tasks.

---

## 14. Minimum invariant

Always preserve:

```text
Domain authority + valid evidence govern project truth.

ASC compiles.
The external executor generates.

Contracts govern the test.

OPEN stays OPEN when explicitly classified as OPEN.

Generated output does not certify itself.

Representation does not replace evidence.

Visual appearance does not replace geometry.

Claude does not invent authority.

Editing, committing, and pushing are separate permissions.
```
