# Árboris — GitHub Copilot instructions

Use `/AGENTS.md` as the repository-wide operational routing protocol.

Key rules:

- work from `main` unless the task names another branch;
- apply `docs/DEVELOPMENT_MANUAL.md` before approving or consolidating development;
- for botanical reads, start with `data/README.md` and the smallest normalized JSON required;
- do not manually edit generated `data/botanical/*.json` or `data/species/*.json` to fix science;
- botanical corrections enter through `data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx` and regeneration;
- use canonical botanical IDs `SP-001` … `SP-006`; legacy `SP001` … `SP006` is compatibility only;
- historical audits/snapshots are traceability, not normative authority;
- preserve `OPEN` decisions instead of inventing values;
- do not treat generated art as botanical or territorial evidence;
- prefer targeted file reads over broad repository ingestion.

For task-specific routing, follow `AGENTS.md` and `docs/START_HERE.md`.
