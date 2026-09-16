# tools/botanical-data — Pipeline botánico

Este directorio contiene herramientas para trabajar con la capa botánica del piloto Árboris.

## Flujo vigente

La fuente científica/editorial única es:

`data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx`

Flujo operativo actual:

```powershell
python tools/botanical-data/export_master.py
python tools/botanical-data/validate_master_export.py
python tools/botanical-data/validate_species_ids.py
python tools/botanical-data/build_species_data.py
python tools/botanical-data/validate_species_data.py
```

Archivos vigentes del pipeline:

- `export_master.py` — exporta Master 2.0 a los 8 JSON canónicos de `data/botanical/`.
- `validate_master_export.py` — valida estructura, conteos, referencias, estados y SHA del export.
- `validate_species_ids.py` — valida IDs canónicos `SP-001...SP-006` y compatibilidad histórica `SP001...SP006`.
- `build_species_data.py` — genera las 6 fichas completas de `data/species/` desde los JSON canónicos.
- `validate_species_data.py` — comprueba que las fichas de `data/species/` reproduzcan exclusivamente los JSON canónicos.

## Regla de edición

No corregir botánica editando JSON derivados. Toda corrección debe entrar al Master 2.0 y propagarse mediante el flujo anterior.

## Herramientas legacy

Los scripts históricos de comparación/fusión usados antes de Master 2.0 no forman parte del flujo vigente. Si aparecen en historial o ramas antiguas, no deben usarse para generar nuevas fichas.

La salida temporal antigua de `tools/botanical-data/output/` fue retirada del `main` porque contenía previews `pilot-master-v0.1` y podía confundirse con las fichas vigentes.
