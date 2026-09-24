# Árboris — Auditoría ASC del candidato XLSX Schema v3

**Estado:** candidato de migración generado y verificado localmente; no integrado al repositorio  
**Gate:** SPECIES-ECOLOGY-XLSX-MIGRATION-CANDIDATE-001  
**Fecha:** 23 septiembre 2026  
**Rama objetivo:** `feat/species-ecology-schema-v3`

## 1. Fuente utilizada

Se trabajó sobre el archivo canónico aportado por el usuario:

```text
Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx
```

La edición se realizó con `artifact_tool`, preservando las hojas existentes.

## 2. Cambios aplicados

### Metadatos

```text
master_version = 2.0.0
schema_version = 3.0.0
updated_at = 2026-09-23
controlled_vocabulary_spec_id = arboris-controlled-vocabularies
controlled_vocabulary_spec_version = 2.0.0
controlled_vocabulary_contract_id = ASC-MASTER2-CONTROLLED-VOCABULARY-CONTRACT
controlled_vocabulary_contract_version = 2.0.0
```

### Nueva hoja

```text
Ecologia_Especie
```

con la cabecera contractual de 13 campos:

```text
ecology_fact_id
species_id
dimension
valor_texto
valor_codificado
valor_min
valor_max
unidad
alcance_tipo
alcance_valor
fuente_ids
estado
notas
```

La hoja queda vacía de hechos ecológicos reales.

### Diccionario_Campos

Se añadieron 13 filas de contrato para `Ecologia_Especie`, con tipos JSON y nulabilidad coherentes con el contrato final.

### Exportar_JSON

Se añadió:

```text
orden = 9
hoja = Ecologia_Especie
json_key = species_ecology
exportar = Sí
transformacion = filas -> array; valor_codificado/fuente_ids: split('|')
```

Los registros históricos/no exportables fueron desplazados a órdenes 10–12.

### Data Validation

Se instalaron listas de validación en la nueva hoja:

```text
dimension
→ distribucion_geografica
→ rango_altitudinal
→ habitat
→ fenologia_floracion
→ fenologia_fructificacion
allow blank = false

unidad
→ m
allow blank = true

alcance_tipo
→ geografico
→ poblacional
→ condicional
allow blank = true

estado
→ activo
→ pendiente_revision
→ retirado
allow blank = false
```

Las listas fueron reimportadas y verificadas mediante `artifact_tool`, incluyendo `ignore_blanks` e `in_cell_drop_down`.

## 3. Verificación estructural

Después de exportar y reimportar el candidato:

```text
13 hojas presentes
Metadatos A1:C16 coherente
Ecologia_Especie A1:M1 presente
Diccionario_Campos A79:F91 presente
Exportar_JSON A1:F13 presente
formula error scan = 0 matches
```

## 4. AUDITORÍA

El candidato XLSX satisface estáticamente el contrato de migración de esquema vacío.

No se incorporaron hechos ecológicos.

No se alteró `master_version`.

No se creó un segundo Master conceptual: el archivo generado es un candidato de reemplazo de la fuente canónica en la rama.

## 5. INCONSISTENCIAS

La única inconsistencia restante es operacional:

```text
candidate XLSX exists locally
but
repository branch still contains the previous XLSX
```

Por tanto, el `MASTER_BINDING` del repositorio todavía no puede considerarse cerrado.

## 6. VACÍOS / OMISIONES

Pendiente después de integrar el binario:

1. ejecutar `build:botanical`;
2. comprobar que `species_ecology.json = []` sea derivado;
3. regenerar `metadata.json` y `source_sha256`;
4. regenerar las seis `species-card.v3`;
5. ejecutar `verify:botanical`;
6. ejecutar `verify:data-access`;
7. ejecutar `npm test`;
8. auditoría ASC integrada.

## 7. REDUNDANCIAS

No se detectaron hojas ecológicas duplicadas ni fuentes paralelas dentro del candidato.

## 8. Gate

```text
XLSX SCHEMA MIGRATION CANDIDATE: PASS
DV_EQUIVALENCE IN CANDIDATE: PASS
EMPTY ECOLOGY DATASET: PASS
FORMULA ERROR SCAN: PASS
REPOSITORY MASTER_BINDING: OPEN
DERIVED REGENERATION: BLOCKED UNTIL BINARY INTEGRATION
MERGE: BLOCKED
DATA POPULATION: BLOCKED
```

## 9. Addendum — checksum y ensayo de derivación local

El candidato exportado y reimportado tiene:

```text
SHA-256 = b0d893c1d274f20648034cc04845a074d0fd7ec34b497540f9a2796ccdc8c1dc
```

Se ejecutó además un ensayo local de derivación **sin integrar resultados al repositorio**.

Usando exclusivamente el contenido del candidato XLSX como fuente se obtuvo:

```text
metadata.json
species.json
characters.json
species_characters.json
sources.json
glossary.json
photos.json
model_errors.json
species_ecology.json
```

Resultado específico de la nueva capa:

```text
species_ecology.json = []
```

También se materializaron localmente seis vistas:

```text
arboris.species-card.v3
ecology = []
```

para las seis especies del piloto.

Este ensayo demuestra que el contrato del candidato es exportable en la forma prevista, pero **no sustituye** la ejecución del pipeline real del repositorio.

Los derivados del ensayo no se incorporan manualmente a la rama, preservando:

```text
DERIVED_ONLY
```

Gate actualizado:

```text
XLSX CANDIDATE CHECKSUM: KNOWN
LOCAL EXPORT REHEARSAL: PASS
LOCAL SPECIES-CARD V3 REHEARSAL: PASS
REPOSITORY BINARY INTEGRATION: OPEN
REPOSITORY PIPELINE EXECUTION: OPEN
```
