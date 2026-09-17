# Árboris — GitHub Copilot instructions

Use `/AGENTS.md` as the repository-wide operational router.

Key rules:

- work from `main` unless the task names another branch;
- apply `docs/DEVELOPMENT_MANUAL.md` before consolidating development;
- use `docs/README.md` for human/document routing and `data/README.md` for data routing;
- ignore `archive/` unless the task explicitly requires historical experiments;
- prefer the smallest authoritative file set over broad repository ingestion;
- do not manually edit generated `data/botanical/*.json` or `data/species/*.json` to fix science;
- botanical corrections enter through `data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx` and regeneration;
- use canonical botanical IDs `SP-001` … `SP-006`; `SP001` … `SP006` is compatibility only;
- preserve `OPEN` decisions instead of inventing values;
- do not treat generated art as botanical or territorial evidence.

For task-specific routing, follow `AGENTS.md`.
