# Árboris — Validación ASC post-commit de Species Ecology Schema v3

**Estado:** VALIDATED — implementación técnica del esquema / no autoriza merge ni población de datos  
**Gate:** SPECIES-ECOLOGY-SCHEMA-V3-POST-COMMIT-ASC-VALIDATION-001  
**Fecha:** 24 septiembre 2026  
**Rama:** `feat/species-ecology-schema-v3`  
**Commit técnico validado:** `a403632ae7561b9a0ede1b3bdb3820796e931b2e`

## 1. Alcance

Esta validación cierra únicamente la implementación técnica del esquema Species Ecology v3 en estado vacío.

No valida:

- población editorial de hechos ecológicos;
- uso de ecología por ACE;
- merge a `main`;
- decisiones culturales/artísticas fuera de este contrato.

## 2. Evidencia de ejecución

Codex ejecutó la integración en un worktree aislado sobre:

```text
feat/species-ecology-schema-v3
```

con el XLSX candidato cuyo SHA-256 fue:

```text
b0d893c1d274f20648034cc04845a074d0fd7ec34b497540f9a2796ccdc8c1dc
```

El SHA del XLSX integrado coincidió exactamente.

Resultados reportados y luego contrastados contra el estado persistido del commit:

```text
npm run build:botanical      PASS
npm run verify:botanical     PASS
npm run verify:data-access   PASS
npm test                     PASS
```

## 3. Persistencia verificada

El commit persistido contiene únicamente la integración esperada:

- Master XLSX canónico migrado;
- nueve derivados botánicos;
- `species_ecology.json`;
- seis fichas `arboris.species-card.v3`.

En el commit se verificó:

```text
species_ecology.json = []
species cards = 6
view_schema = arboris.species-card.v3
ecology = []
```

Metadata persistida:

```text
master_version = 2.0.0
schema_version = 3.0.0
controlled_vocabulary_spec_id = arboris-controlled-vocabularies
controlled_vocabulary_spec_version = 2.0.0
controlled_vocabulary_contract_version = 2.0.0
source_file = Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx
source_sha256 = b0d893c1d274f20648034cc04845a074d0fd7ec34b497540f9a2796ccdc8c1dc
```

## 4. Invariantes ASC

```text
MASTER_BINDING: PASS
DV_EQUIVALENCE: PASS
DERIVED_ONLY: PASS
EXECUTION_REQUIRED_FOR_CLOSURE: PASS
```

## 5. Hallazgo no bloqueante

`git diff --check` reportó whitespace en JSON generados.

Se clasifica:

```text
NON-BLOCKING / DERIVED OUTPUT
```

No se corrige manualmente porque los JSON son derivados y hacerlo rompería `DERIVED_ONLY`.

## 6. AUDITORÍA

No se detectó expansión de alcance hacia:

- ACE;
- Observation;
- `contexts.json`;
- `character_variability.json`;
- reference SQLite;
- población real de ecología.

El worktree original de otra línea de trabajo quedó fuera de alcance.

## 7. INCONSISTENCIAS

Ninguna inconsistencia material dentro del commit técnico validado.

## 8. VACÍOS / OMISIONES

Permanecen fuera de este gate:

- sincronización de la rama con el `main` actual;
- auditoría pre-PR / pre-merge después de esa sincronización;
- decisión de merge;
- gate editorial de población ecológica.

## 9. REDUNDANCIAS

No se detectan fuentes editoriales paralelas ni derivados mantenidos manualmente.

## 10. Decisión ASC

```text
SPECIES-ECOLOGY-SCHEMA-V3 TECHNICAL IMPLEMENTATION
→ VALIDATED

VALIDATED COMMIT
→ a403632ae7561b9a0ede1b3bdb3820796e931b2e

MERGE TO MAIN
→ NOT YET AUTHORIZED

ECOLOGY DATA POPULATION
→ BLOCKED PENDING SEPARATE EDITORIAL GATE
```
