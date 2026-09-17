# data/botanical — JSON botánicos canónicos derivados

Este directorio contiene los **ocho JSON canónicos generados desde Master Botánico 2.0**.

Archivos vigentes:

- `metadata.json`
- `species.json`
- `characters.json`
- `species_characters.json`
- `sources.json`
- `glossary.json`
- `photos.json`
- `model_errors.json`

Estos archivos son derivados reproducibles de:

```text
data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx
```

No deben editarse manualmente para corregir botánica.

`metadata.json` registra versión del Master, esquema, archivo fuente y SHA-256.

## Legacy

Los derivados históricos anteriores a Master Botánico 2.0 fueron movidos a:

```text
data/botanical/legacy/
```

No son fuente vigente, no participan en el motor canónico y no deben usarse para nuevas decisiones botánicas.

## Semántica importante

- vacío / `null` = sin dato, no ausencia;
- `no sé`, `no observable` y `no aplica` describen observación/aplicabilidad, no estados botánicos de especie;
- solo los caracteres cuyo `estado_piloto` coincide con `metadata.computable_status` participan como computables;
- los caracteres retirados o pendientes pueden conservarse para trazabilidad sin participar en el motor.

Validación:

```powershell
python tools/botanical-data/export_master.py
python tools/botanical-data/validate_master_export.py
python tools/botanical-data/validate_species_ids.py
```

Ver `docs/START_HERE.md` para la jerarquía completa de autoridad.
