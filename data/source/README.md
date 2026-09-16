# data/source — Fuentes botánicas

## Fuente vigente

La única fuente científica/editorial canónica del piloto Árboris es:

`Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx`

Toda corrección botánica debe realizarse primero en ese archivo y luego propagarse mediante los generadores y validadores del repositorio.

## Archivos históricos conservados

Los siguientes archivos se mantienen únicamente por trazabilidad y antecedentes. **No son fuentes vigentes y no deben utilizarse para nuevas decisiones botánicas.**

- `Base_botanica_Pokedex_flora_Master.xlsx` — Master anterior a 2.0.
- `Fichas_especies_arboris.xlsx` — material editorial/descriptivo anterior.

Si existe cualquier discrepancia entre esos archivos y Master 2.0, gobierna `Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx`.

## Flujo

```text
Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx
        ↓
tools/botanical-data/export_master.py
        ↓
data/botanical/
        ↓
tools/botanical-data/build_species_data.py
        ↓
data/species/
```

Ver también `docs/START_HERE.md` y `docs/ROADMAP.md`.
