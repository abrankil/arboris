# Árboris — AI repository routing

This file is an operational routing layer for coding and research agents. It does not replace normative project documents or scientific sources.

## 1. Default branch and review protocol

Use `main` as the shared reference state unless the task explicitly names another branch.

Before approving or consolidating development work, follow `docs/DEVELOPMENT_MANUAL.md` and report:

```text
AUDITORÍA
INCONSISTENCIAS
VACÍOS / OMISIONES
REDUNDANCIAS
```

Do not bulk-read the repository by default. Route first, then open only the minimum authoritative files needed for the task.

## 2. Authority vs. operational read path

Botanical editorial/scientific source of truth:

```text
data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx
```

For normal read-only reasoning, do **not** open the XLSX first. Prefer the reproducible normalized JSON in `data/botanical/`; use the XLSX when editing/regenerating canonical botanical knowledge or verifying export provenance.

Generated views are read-only:

```text
data/botanical/*.json
data/species/*.json
```

Do not manually correct them. Correct the Master and regenerate.

## 3. Minimal retrieval routes

### Botanical queries

Read `data/README.md` first.

When a local checkout or executable workspace is available, prefer the compact read-only query CLI for scoped questions:

```powershell
python tools/botanical-data/query_botanical.py species SP-001
python tools/botanical-data/query_botanical.py character CH-003
python tools/botanical-data/query_botanical.py relation SP-001 CH-003
python tools/botanical-data/query_botanical.py compare CH-003
```

The CLI reads canonical JSON and does not create another source of truth. It emits compact JSON by default; add `--pretty` only when human readability is useful.

When the CLI is unavailable, use the smallest dataset that answers the question:

- species identity/list → `data/botanical/species.json`
- character definition/allowed states → `data/botanical/characters.json`
- compare species by character → `data/botanical/species_characters.json` + `characters.json`
- source metadata → `data/botanical/sources.json`
- glossary → `data/botanical/glossary.json`
- photo metadata → `data/botanical/photos.json`
- known model errors → `data/botanical/model_errors.json`
- one species with joined context → one matching file in `data/species/`
- visual/character canon → `data/characters/` (not botanical authority)

Avoid loading all six `data/species/*.json` files for cross-species comparisons; they are denormalized convenience views and are much larger than the normalized tables.

For payload/index strategy and future SQLite requirements, use `docs/DATA_ACCESS_PERFORMANCE.md`.

### Identification engine

Read, in order:

1. `docs/ARCHITECTURE.md` relevant section
2. `tools/canonical-identification/README.md`
3. `tools/canonical-identification/dataset.mjs`
4. `tools/canonical-identification/engine.mjs`
5. tests only when needed

Botanical knowledge belongs in data, not hardcoded engine rules.

### General data model

Use `docs/DATA_MODEL.md`. It is conceptual; it is not yet a physical SQLite schema.

### Product / roadmap

Use `README.md`, then `docs/ROADMAP.md` only for the milestone or state needed. Do not infer current map/art state from old audit documents.

### Environment / maps

Read only the relevant chain:

1. `docs/PILOT_ENVIRONMENT_VISUAL_CANON.md`
2. `docs/SPATIAL_MODEL.md`
3. `docs/TERRITORIAL_MAPPING_PROTOCOL.md`
4. `docs/MAP_TOPOLOGY_SYSTEM.md`
5. `docs/MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN.md`
6. `docs/ENVIRONMENT_ART_DIRECTION.md`
7. `docs/ART_STYLE_GUIDE.md`
8. `docs/ENVIRONMENT_PRODUCTION_SPEC.md`

Historical audit/sync documents are for traceability, not normative authority.

### Character art

Use `data/characters/` for current character records/assets and `docs/GRAPHIC_DIRECTION.md` / `docs/ART_STYLE_GUIDE.md` for methodology. Do not treat generated images or environment concept art as scientific evidence.

## 4. IDs and joins

Canonical botanical species IDs use `SP-001` … `SP-006`.

Legacy/runtime filenames and some art records may use `SP001` … `SP006`. Treat the latter as compatibility identifiers, not a second botanical namespace.

Preferred joins:

```text
species.species_id
↔ species_characters.species_id

characters.caracter_id
↔ species_characters.caracter_id

sources.fuente_id
↔ species_characters.fuente_id
```

Do not join by common name when an ID exists.

## 5. Context-budget rules for agents

1. Start with metadata/index files before large records.
2. Prefer `query_botanical.py` for a scoped botanical lookup when execution is available.
3. Fetch narrow line ranges or exact files when the question is scoped.
4. For one species, use one `data/species/*.json` joined view rather than reconstructing all tables.
5. For comparisons, use normalized tables rather than loading all joined species views.
6. Load source/provenance records only when the task needs provenance.
7. Do not load images/binaries unless the task needs visual inspection.
8. Do not load historical docs unless a decision history is explicitly required.
9. Preserve `OPEN` states; do not fill missing project decisions from general knowledge.
10. Separate internal canon, external evidence, and inference.

## 6. Validation commands

From repository root:

```powershell
npm.cmd test
npm.cmd run typecheck
```

For botanical regeneration:

```powershell
npm.cmd run build:botanical
npm.cmd run verify:botanical
```

For compact read-only botanical inspection:

```powershell
python tools/botanical-data/query_botanical.py stats --pretty
```

Do not regenerate canonical data unless the task actually changes the Master or export pipeline.

## 7. Fast entry points

Human/project orientation: `docs/START_HERE.md`.

Machine/data routing: `data/README.md`.

Data performance and future SQLite indexing: `docs/DATA_ACCESS_PERFORMANCE.md`.

Current development continuity: `docs/DEVELOPMENT_SYNC_2026-09-17.md` (snapshot, non-normative).
