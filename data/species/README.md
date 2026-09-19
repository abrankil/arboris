# data/species — Fichas canónicas por especie

Este directorio contiene seis fichas completas generadas para consumo humano, IA, interfaz y dirección de arte:

- `SP001_cryptocarya_alba.json`
- `SP002_lithraea_caustica.json`
- `SP003_kageneckia_oblonga.json`
- `SP004_podanthus_mitiqui.json`
- `SP005_colliguaja_odorifera.json`
- `SP006_quillaja_saponaria.json`

Las fichas se generan exclusivamente desde `data/botanical/*.json` mediante:

`tools/botanical-data/build_species_data.py`

Se validan mediante:

`tools/botanical-data/validate_species_data.py`

## Para dirección de arte

Esta es la vista recomendada para revisar una especie completa sin reconstruir manualmente múltiples JSON. Cada ficha reúne identidad, taxonomía, caracteres, relaciones especie–carácter, fuentes, fotografías, glosario relevante y errores de modelo asociados.

Consultar además las fotografías reales en:

`species/<especie>/photos/`

La ficha científica no define por sí sola el diseño gráfico final. El canon visual está en `data/characters/` y la metodología en `docs/GRAPHIC_DIRECTION.md`.

## Autoridad

Estas fichas **no son una segunda fuente de verdad** y no deben editarse manualmente. Su autoridad proviene de:

```text
Master Botánico 2.0
        ↓
data/botanical/
        ↓
data/species/
```

Si una ficha parece incorrecta, corregir primero Master 2.0 y regenerar.

Los nombres de archivo conservan IDs históricos `SP001...SP006` por compatibilidad. Dentro de los datos botánicos, los IDs canónicos son `SP-001...SP-006`.
