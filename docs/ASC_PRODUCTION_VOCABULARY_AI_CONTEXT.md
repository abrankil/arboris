# Árboris — ASC Production Vocabulary AI Context

**Status:** candidate v0.1 — AI integration context — non-normative  
**Purpose:** provide compact operational context for AI agents working with ASC, blockouts, maps, visual prototypes, generative results, reviews, and production assets.

This document is derived operational context. It does not replace normative or domain authorities.

## 1. Authority model

### Normative / domain authorities

- `docs/ARBORIS_SCENE_COMPILER.md`
- `docs/SPATIAL_MODEL.md`
- `docs/ENVIRONMENT_PRODUCTION_SPEC.md`
- other domain-specific authorities when applicable

### Operational references

- `docs/ASC_VOCABULARY_GUIDE.md`
- `docs/GENERAL_VOCABULARY_GUIDE.md`
- `docs/ASC_PRODUCTION_VOCABULARY_MANUAL.md`

Rule of precedence:

```text
If this AI context conflicts with an applicable normative or domain authority,
follow the authority and report the conflict.

Do not promote this document into a source of truth.
```

## 2. ASC execution flow

Use this flow for ASC itself:

```text
authorized input / contracts
→ ASC
→ prompt ASC
→ external generative executor
→ ASC result
→ audit
```

ASC is the compiler.
ASC is not the generative model.
ASC is not a renderer.
ASC is not a navigation engine.
ASC is not territorial, botanical, spatial, or scientific evidence.

### Current implementation note

```text
ASC v0.1 executable mode = compile-only.

“Generate with ASC” describes the broader operational workflow:
compile → external executor.

It does not mean `tools/asc/compile_asc.mjs` performs generation.
```

## 3. Production handoff example

The following is an operational production pattern, not a mandatory universal architecture:

```text
territory / contracts
→ blockout
→ prototype and/or ASC-assisted result
→ review
→ production
```

Do not infer that every ASC task requires a blockout before compilation.

## 4. ASC command semantics

```text
“Compile with ASC”
→ construct the ASC prompt
→ do not execute generation

“Generate with ASC” / “Execute with ASC”
→ compile first
→ then execute the compiled prompt with the available external executor

“Audit with ASC”
→ compare prompt and/or result against contract, sources, restrictions, and validation criteria

“Use X as ASC input”
→ X may feed compilation
→ X does not automatically become authority or evidence
```

Never reinterpret `compile` as `generate`.

## 5. Information treatments

```text
KNOWN
= sufficiently supported information that may be transferred into compilation

OPEN
= information explicitly classified as unresolved by the applicable authority, contract, or user
= preserve uncertainty
≠ permission to invent
≠ artistic freedom

PROHIBIDO INFERIR / DO NOT INFER
= the executor must not close a gap through plausibility or unsupported inference

ART-PROVISIONAL
= temporary visual solution allowed for a test
= no evidentiary authority
```

Do not replace domain-specific states such as `claimState`, `evidenceStatus`, or `productionStatus` with ASC treatments.

If required scope or invariants are missing:

```text
- do not infer them;
- request clarification when necessary;
- otherwise mark them unresolved for the current task.

Use OPEN only when the applicable authority, contract, or user explicitly classifies the information as OPEN.
```

## 6. PROHIBIDO INFERIR vs prohibited

`PROHIBIDO INFERIR` and `prohibited` are not equivalent.

```text
PROHIBIDO INFERIR
→ blocks unsupported inference

prohibited
→ identifies outputs, relations, or content that must not appear
```

Example:

```text
OPEN:
exact walkableEnvelope geometry is undetermined

DO NOT INFER:
do not convert known topology into unsupported measured geometry

PROHIBITED:
do not introduce unauthorized branches
```

## 7. Production terms

**blockout**  
Simplified technical representation of an Instance's contracts used to test connectivity, routes, relative elevations, blockers, interaction, camera, and occlusion before final art.

**visual prototype / prototipo visual**  
Experimental visual representation used to evaluate how authorized structure translates visually. It is not evidence and is not automatically production-ready.

**production asset / asset de producción**  
Resource used or prepared under the applicable technical and artistic production specification. Its existence does not imply final approval.

**preview**  
Composed view for review. It is not a master and not spatial authority.

**player proxy**  
Provisional player representation for testing scale, readability, and occlusion. It is not the final sprite.

**massing**  
Simplified representation of masses, elevation differences, and volumes. It is not measured territorial geometry.

**naturalization / naturalización**  
Visual operation that integrates terrain, terraces, rock, soil, water, vegetation, and similar detail without changing authorized spatial contracts. It is not topology redesign.

## 8. Navigation authority

```text
walkableEnvelope
→ derived discretization
→ raster / cells / other representation
```

`walkableEnvelope` = continuous authoritative walkable region.

`derived discretization` = reproducible representation generated from the `walkableEnvelope` for testing or implementation.

Raster or cells do not replace the `walkableEnvelope` as primary navigation authority.

Visible paths do not prove walkability.

A visible branch does not prove an authorized connection.

`secondary route / ruta secundaria` = additional route explicitly authorized by the Navigation Contract.

`branch / bifurcation` = description of connectivity form only; it is not automatically authorized.

## 9. Result / prototype / preview / asset

These describe different properties:

```text
ASC result
→ provenance

visual prototype
→ experimental function

preview
→ review presentation

production asset
→ production function
```

A single file may be:

```text
ASC result
+ visual prototype
+ preview
```

without being an approved production asset.

Do not create a formal category called `experimental reference`.

Use instead:

```text
ASC result used as a test reference
```

## 10. MAP-* semantics

`MAP-*` identifies a derived map, blockout, or prototype.

`MAP-*` does not identify a production stage by itself.

Prefer:

```text
MAP-001 blockout
MAP-001 visual prototype
MAP-001 preview
```

Avoid using only `the MAP` when representation type matters.

`IT` ≠ `MAP`.

## 11. Validation language

The base result system is:

```text
PASS
PARTIAL
FAIL
```

`PASS visual` and `PASS geométrico` are qualifiers, not additional states.

```text
PASS visual
= PASS for a criterion supported by visual evidence

PASS geométrico
= PASS for a criterion supported by logical or materialized geometry
```

Use `NOT TESTED` when the available evidence cannot demonstrate a criterion.

Do not convert `NOT TESTED` into PASS or FAIL.

Never infer geometric PASS from a single generated image.

A visually attractive result is not automatically a valid result.

## 12. Evidence-class rule for audits

Evaluate each criterion only from evidence capable of supporting it.

```text
visual evidence
→ visual readability, composition, apparent hierarchy, visible relations

logical or materialized geometry
→ geometry, connectivity, navigation, walkableEnvelope preservation

runtime evidence
→ gameplay behavior, interaction, occlusion in execution, camera behavior

domain evidence
→ territorial, botanical, ecological, scientific claims
```

Do not upgrade one evidence class into another.

## 13. Critical non-equivalences

```text
territory ≠ representation
evidence ≠ visual reference
reference ≠ authority

IT ≠ MAP
MAP ≠ production stage

blockout ≠ visual prototype
visual prototype ≠ asset
ASC result ≠ evidence
preview ≠ master

walkableEnvelope ≠ discretization
discretization ≠ territorial authority
connectivity ≠ visible path appearance

player proxy ≠ final sprite
massing ≠ measured geometry
naturalization ≠ topology change

OPEN ≠ artistic freedom
PROHIBIDO INFERIR ≠ prohibited

PASS visual ≠ PASS geométrico
attractive image ≠ valid result
```

## 14. Handoff grammar

When generating or interpreting production instructions, prefer:

```text
OPERATION + OBJECT + SCOPE + INVARIANTS
```

Examples:

```text
Naturalize MAP-001 blockout.
Scope: provisional terrain and vegetation.
Preserve walkableEnvelope, ports, and main route.
```

```text
Prototype MAP-001 from contract v2.1.
Scope: topology + territory + camera.
Do not close any OPEN.
```

```text
Audit the ASC result against v2.1.
Evaluate only criteria supported by the available evidence.
Do not declare geometric PASS without logical or materialized geometry.
```

## 15. AI behavior rules

1. Preserve terminology exactly when semantic distinctions matter.
2. Do not create new production states unless an authoritative document defines them.
3. Do not reinterpret an ASC result as territorial, botanical, spatial, ecological, or scientific evidence.
4. Do not convert visually plausible content into project truth.
5. Do not close OPEN through common sense, aesthetics, realism, or model priors.
6. Do not weaken restrictions to improve visual quality.
7. Keep navigation, camera, interaction, territory, elevation, and art as separate layers when relevant.
8. Distinguish what is observed, authorized, inferred, provisional, unresolved, and prohibited.
9. Evaluate every claim against the evidence class capable of supporting it.
10. Do not claim geometric, gameplay, navigation, or interaction validation from appearance alone.
11. Report violations of authoritative relations even when the output is visually attractive.
12. If sources conflict, identify the conflict instead of silently choosing the more plausible interpretation.

## 16. Audit output

When asked to audit production material, use:

```text
AUDIT
- criterion-by-criterion result

INCONSISTENCIES
- contradictions with contract or authority

GAPS / OMISSIONS
- information not demonstrated, unresolved, or explicitly OPEN

REDUNDANCIES
- duplicated or competing rules / sources of truth

DECISION
- PASS / PARTIAL / FAIL for the defined scope
```

Use `NOT TESTED` where the available evidence cannot support a judgment.

## 17. Safety against semantic drift

Before accepting AI-generated wording as project language, check:

- Is the term already defined elsewhere?
- Does the wording strengthen the original claim?
- Does it collapse two separate layers?
- Does it convert a derivative into authority?
- Does it close an OPEN?
- Does it create a new state?
- Does it imply validation that was not actually performed?

If yes:

```text
do not consolidate the wording
flag it for review
```

## 18. Minimum invariant

Always preserve:

```text
ASC compiles.
The executor generates.
Domain authority + valid evidence govern project truth.
Contracts govern the test.
OPEN remains open when explicitly classified as OPEN.
Generated output does not certify itself.
```

## 19. Status

```text
AI CONTEXT VERSION: candidate v0.1
NORMATIVE: NO
DERIVED FROM HUMAN MANUAL: YES
NEW AUTHORITY CREATED: NO
NEW STATES CREATED: NO
ASC v0.1 CHANGE REQUIRED: NO
```
