# Árboris — Checkpoint de implementación del esquema de ecología de especie

**Estado:** implementación parcial / no integrable  
**Gate:** SPECIES-ECOLOGY-SCHEMA-V3-IMPLEMENTATION-CHECKPOINT-001  
**Fecha:** 23 septiembre 2026  
**Rama:** `feat/species-ecology-schema-v3`

## 1. Resultado

```text
IMPLEMENTATION BRANCH: CREATED FROM MAIN
NON-XLSX CONTRACT IMPLEMENTATION: SUBSTANTIALLY COMPLETE
SOURCE-OF-TRUTH XLSX MIGRATION: BLOCKED BY FILE MATERIALIZATION
TEST EXECUTION: BLOCKED UNTIL XLSX + DERIVATIVES ARE COHERENT
MERGE: BLOCKED
DATA POPULATION: BLOCKED
```

## 2. Cambios ya implementados

Se implementaron en la rama:

- ampliación de `controlled_vocabularies.json` a versión candidata 2.0.0;
- reconocimiento de `Ecologia_Especie` en el checker de Data Validation;
- comprobación de DV incluso cuando la hoja gobernada no tiene registros, usando fila 2 como probe;
- validación específica de `SpeciesEcologyFact`;
- vocabulario UdeC de áreas de distribución;
- control de IDs, FKs, multifuente, payload, meses, altitud, scope, duplicados semánticos y multiplicidad activa;
- routing `query_botanical.py ecology [species_id]`;
- conteo del noveno JSON en `stats`;
- tests de routing;
- tests del contrato ecológico;
- `build_species_data.py` preparado para `species-card.v3`;
- `validate_species_data.py` preparado para `species-card.v3`;
- `verify:botanical` ampliado;
- routing y documentación principal preparados para nueve JSON en el estado integrado.

## 3. Correcciones posteriores al checkpoint inicial

Después de la primera validación ASC:

- se consolidó `docs/SPECIES_ECOLOGY_SCHEMA_V3_FINAL_CONTRACT.md` dentro de esta rama;
- se eliminó el placeholder manual `data/botanical/species_ecology.json`;
- se restauró el invariante `Master → export → derived JSON`;
- se incorporaron al contrato final los invariantes `MASTER_BINDING`, `DV_EQUIVALENCE`, `DERIVED_ONLY` y `EXECUTION_REQUIRED_FOR_CLOSURE`.

La trazabilidad del contrato de implementación queda cerrada en la rama.

## 4. Auditoría adicional realizada

La cobertura de tests fue ampliada para incluir:

- ID ecológico duplicado;
- dimensión gobernada inválida;
- estado gobernado inválido;
- tipo de alcance gobernado inválido;
- además de los casos negativos/positivos ya definidos para SpeciesEcologyFact.

La rama se encuentra por delante de `main` y no arrastra la rama de investigación.

## 5. Bloqueo actual

La fuente editorial canónica sigue siendo:

```text
data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx
```

Ese archivo debe modificarse antes de que la rama pueda ser coherente.

La sesión puede leer el binario desde GitHub como contenido base64 para inspección, pero esa representación no se encuentra disponible como archivo local/materializable para la herramienta de edición XLSX requerida.

Por política de herramientas, la modificación del XLSX debe realizarse mediante `artifact_tool`. No se sustituirá por edición ZIP/XML, `openpyxl`, LibreOffice ni una reimplementación manual.

## 6. Cambios pendientes en el XLSX

Cuando el archivo sea materializable:

1. crear hoja `Ecologia_Especie`;
2. escribir cabecera contractual de 13 campos;
3. añadir sus filas a `Diccionario_Campos`;
4. añadir `Ecologia_Especie → species_ecology` a `Exportar_JSON`;
5. aplicar Data Validation a:
   - `dimension`;
   - `estado`;
   - `alcance_tipo`;
   - `unidad`;
6. actualizar metadata de fase de esquema:
   - `master_version = 2.0.0`;
   - `schema_version = 3.0.0`;
   - `controlled_vocabulary_spec_version = 2.0.0`;
   - `updated_at = fecha real de ejecución`;
7. preservar hoja ecológica sin hechos reales en esta fase.

## 7. Derivados pendientes

Después del XLSX:

```text
export_master.py
→ metadata.json actualizado
→ species_ecology.json = []
→ source_sha256 actualizado
```

Luego:

```text
build_species_data.py
→ seis species-card.v3
→ ecology = []
```

No deben editarse manualmente esos derivados para simular el resultado.

## 8. Tests pendientes de ejecución

Sólo después de coherencia fuente/derivados:

```text
build:botanical
verify:botanical
verify:data-access
npm test
```

y auditoría final del diff, incluido el XLSX.

## 9. AUDITORÍA

La implementación textual/código avanzó hasta el límite seguro permitido por la autoridad del Master.

Continuar modificando derivados sin modificar primero el XLSX convertiría temporalmente la rama en una representación no reproducible y no debe considerarse cierre.

## 10. INCONSISTENCIAS

Existe una inconsistencia **transitoria de rama de trabajo**, esperada y no consolidable:

```text
code/docs expect schema 3
while
canonical XLSX still encodes schema 2
```

Por tanto ningún gate de integración puede pasar todavía.

## 11. VACÍOS / OMISIONES

Falta:

- acceso materializable al XLSX;
- edición mediante artifact_tool;
- regeneración;
- ejecución de tests;
- auditoría integrada;
- decisión de merge.

## 12. REDUNDANCIAS

No se debe crear un XLSX paralelo como nueva fuente de verdad.

Una copia temporal sólo puede utilizarse para editar/verificar y luego reemplazar el archivo canónico de la rama.

## 13. Gate

```text
SAFE NON-XLSX IMPLEMENTATION: PASS
FINAL IMPLEMENTATION CONTRACT: PASS
DERIVATION PURITY AT BRANCH LEVEL: PASS
XLSX SOURCE MIGRATION: BLOCKED
DERIVED REGENERATION: BLOCKED BY SOURCE MIGRATION
EXECUTED TEST EVIDENCE: OPEN
MERGE: BLOCKED
NEXT REQUIRED INPUT: MATERIALIZABLE CANONICAL XLSX
```
