# Árboris — Master Botánico 2.0 — Baseline Snapshot — 2026-09-19

> **Estado:** snapshot histórico de trazabilidad, no normativo.
> No reemplaza ni modifica la autoridad botánica de `data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx`.

## Propósito

Registrar el estado basal verificable del Master Botánico 2.0 antes de implementar la especificación normativa de vocabularios controlados.

Este documento sirve como referencia para detectar regresiones y comparar exclusivamente los cambios autorizados durante la implementación.

No constituye una nueva fuente de verdad botánica, no modifica la semántica del Master y no autoriza por sí mismo cambios en datos, código ni contratos.

## Identidad del baseline

- Repository HEAD: `c57077741fd44b063ac5620b30cd100261adb437`
- Master: `data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx`
- Master SHA-256: `ee3c6d47a33a835f6a6e8f2622dfeb75a536f13b08f3b3cba5a5707f56b6e1f8`
- Fecha del snapshot: `2026-09-19`
- Fase: `I0 — baseline canónico`

## Pipeline basal — I0.3

El pipeline canónico fue ejecutado desde el estado identificado arriba antes de cualquier modificación correspondiente a esta implementación.

Resultados:

- `export_master.py`: PASS
- `validate_master_export.py`: PASS
- `validate_species_ids.py`: PASS
- `build_species_data.py`: PASS
- `validate_species_data.py`: PASS
- errores de validación: `0`
- warnings de `validate_master_export.py`: `0`
- relaciones `species_characters`: `89`
- fotografías: `93`
- especies esperadas/encontradas en fichas derivadas: `6 / 6`
- SHA-256 del Master comprobado por el pipeline: `ee3c6d47a33a835f6a6e8f2622dfeb75a536f13b08f3b3cba5a5707f56b6e1f8`

Después de ejecutar el pipeline no se observaron cambios en archivos versionados.

Los archivos no versionados preexistentes permanecieron fuera del alcance de esta intervención.

## Snapshot estructural — I0.4

### Hojas

El workbook contiene `12` hojas, todas visibles, en el siguiente orden:

1. `Listado_original`
2. `Especies_Piloto`
3. `Caracteres`
4. `Fuentes`
5. `Especie_Caracter`
6. `Errores_Modelo`
7. `LEEME`
8. `Evidencia_Fotografica`
9. `Glosario`
10. `Metadatos`
11. `Diccionario_Campos`
12. `Exportar_JSON`

### Estructura del workbook

- defined names: `0`
- tablas Excel: `0`
- autofiltros: `0`
- freeze panes: `0`
- filas ocultas: `0`
- columnas ocultas: `2`, ambas en `Listado_original`: `D`, `E`
- hipervínculos: `42`, todos observados en `Listado_original`
- rangos combinados: `2`, ambos en `LEEME`: `A1:F1`, `A11:F11`

### Dimensiones físicas observadas

| Hoja | Dimensión reportada |
| --- | --- |
| `Listado_original` | `A1:Q1000` |
| `Especies_Piloto` | `A1:J1000` |
| `Caracteres` | `A1:M1000` |
| `Fuentes` | `A1:F1000` |
| `Especie_Caracter` | `A1:M1000` |
| `Errores_Modelo` | `A1:J1000` |
| `LEEME` | `A1:F1000` |
| `Evidencia_Fotografica` | `A1:Q1000` |
| `Glosario` | `A1:Z1000` |
| `Metadatos` | `A1:Z1000` |
| `Diccionario_Campos` | `A1:Z1000` |
| `Exportar_JSON` | `A1:Z1000` |

Estas dimensiones corresponden al rango físico reportado por el workbook y no deben interpretarse como número de registros con contenido.

## Data Validation Snapshot — I0.5

Se observaron exactamente `3` Data Validations en el workbook basal. Todas pertenecen a `Especie_Caracter`.

### DV-001 — `variabilidad`

- hoja: `Especie_Caracter`
- campo: `variabilidad`
- columna: `D`
- rango: `D2:D232`
- tipo: `list`
- formula1: `"baja,media,alta,desconocida"`
- formula2: `None`
- allow_blank: `True`

### DV-002 — `interaction_safety`

- hoja: `Especie_Caracter`
- campo: `interaction_safety`
- columna: `I`
- rango: `I2:I232`
- tipo: `list`
- formula1: `"bajo,medio,medio-alto,alto,desconocido"`
- formula2: `None`
- allow_blank: `True`

### DV-003 — `notas`

- hoja: `Especie_Caracter`
- campo: `notas`
- columna: `L`
- rango: `L2:L232`
- tipo: `list`
- formula1: `"baja,media,alta"`
- formula2: `None`
- allow_blank: `True`

Las otras `11` hojas no contienen Data Validations observadas.

### Interpretación del snapshot

Este inventario registra el estado físico basal del XLSX. No declara que los vocabularios contenidos en estas Data Validations sean normativos, correctos ni compatibles con el contrato futuro.

En particular, cualquier corrección posterior de estas tres Data Validations deberá compararse contra este estado V0 y justificarse por la especificación normativa correspondiente.
