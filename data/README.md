# Árboris — Data access map

This directory contains canonical derived botanical data, generated species views, character-art records, and source files.

Use this page as a routing index. It does not replace the Master Botánico or schema documentation.

## Authority layers

```text
EDITORIAL / SCIENTIFIC AUTHORITY
source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx
        ↓ generated

NORMALIZED BOTANICAL DATA
botanical/*.json
        ↓ generated

JOINED SPECIES VIEWS
species/*.json

SEPARATE VISUAL CANON
characters/
```

Important distinction:

- the XLSX is the source of truth for corrections;
- `botanical/*.json` is the preferred machine-read layer for most queries;
- `species/*.json` is the preferred joined view for one-species deep reads;
- `characters/` records visual/game character design and is not botanical authority.

## Fastest read-only path

When an executable checkout is available, use the compact query CLI instead of opening whole tables for a scoped question:

```powershell
python tools/botanical-data/query_botanical.py species SP-001
python tools/botanical-data/query_botanical.py character CH-003
python tools/botanical-data/query_botanical.py relation SP-001 CH-003
python tools/botanical-data/query_botanical.py compare CH-003
python tools/botanical-data/query_botanical.py ecology SP-006
```

The CLI reads the canonical JSON directly and returns only the requested slice. It does not persist data or create a second source of truth.

Use `--pretty` for human-readable output; compact JSON is the default to reduce model/context payload.

## Minimal file by question

| Question | Read first | Add only if needed |
| --- | --- | --- |
| What species are in the pilot? | `botanical/species.json` | — |
| What does character CH-xxx mean? | `botanical/characters.json` | `glossary.json` |
| What state is expected for species X / character Y? | `botanical/species_characters.json` | `characters.json`, `sources.json` |
| Compare several species | `botanical/species.json` + `species_characters.json` | `characters.json` |
| Inspect one species comprehensively | one file in `species/` | real photos if visual task |
| Check source/provenance | `botanical/sources.json` | matching species relation |
| Check photo metadata | `botanical/photos.json` | actual image only if needed |
| Check known model mistakes | `botanical/model_errors.json` | relevant photo/species record |
| Check documented species ecology | `botanical/species_ecology.json` | `sources.json`; observation context only if comparing general vs observed |
| Check terms | `botanical/glossary.json` | — |
| Check visual character design | matching record in `characters/` | approved asset |
| Correct botanical knowledge | Master XLSX | regenerate + validate |

## Normalized botanical files

`botanical/metadata.json` — version, schema, source file, SHA-256 and export semantics.

`botanical/species.json` — compact species identity/taxonomy table.

`botanical/characters.json` — character definitions, allowed states, observability, risk and pilot status.

`botanical/species_characters.json` — species × character expected-state relations and diagnostic metadata. This is the main table for cross-species comparison.

`botanical/sources.json` — bibliographic/source metadata.

`botanical/glossary.json` — terminology.

`botanical/photos.json` — photo metadata and links to evidence records.

`botanical/model_errors.json` — documented model errors retained for traceability.

`botanical/species_ecology.json` — sourced ecological facts about species, kept separate from the context of any concrete observation and from ACE character contexts.

## Efficient query strategy

### Cross-species comparison

Do not open all six files in `species/`.

Prefer the CLI when available:

```powershell
python tools/botanical-data/query_botanical.py compare CH-003
```

Otherwise use:

```text
species.json
+ characters.json
+ species_characters.json
```

Join on IDs.

### One-species reasoning

Use the matching joined view in `species/`. It collects identity, character definitions, relations, active species ecology, sources, photo metadata, glossary context and relevant model errors.

For a narrow relation, prefer the CLI instead of the full joined view.

### Provenance verification

Use `metadata.json` first. Open the XLSX only when provenance, export integrity, correction or regeneration requires it.

## Canonical IDs

Botanical IDs:

```text
SP-001  Cryptocarya alba
SP-002  Lithraea caustica
SP-003  Kageneckia oblonga
SP-004  Podanthus mitiqui
SP-005  Colliguaja odorifera
SP-006  Quillaja saponaria
```

Some filenames and runtime/art records retain `SP001` … `SP006` for compatibility. Do not create new botanical records with the legacy form.

Character IDs use `CH-xxx`; source IDs use `F-xxx`.

Prefer ID joins over names.

## Mutation rules

Do not manually edit generated files to fix botanical content:

```text
botanical/*.json
species/*.json
```

Correct the Master, then run:

```powershell
npm.cmd run build:botanical
npm.cmd run verify:botanical
```

For read-only analysis, regeneration is unnecessary.

## Null / unknown semantics

From the canonical export contract:

- `null` / empty = no documented data, not absence;
- operational answers such as unknown / not observable / not applicable are not botanical states of a species;
- only characters matching the active computable status participate in the canonical identification engine.

See `botanical/README.md`, `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md` and `docs/DATA_ACCESS_PERFORMANCE.md` when deeper semantics or performance/index strategy are needed.
