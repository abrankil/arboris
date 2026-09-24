# Árboris — Validación ASC de implementación Species Ecology Schema v3

**Estado:** auditoría de validación / no autoriza merge  
**Gate:** SPECIES-ECOLOGY-SCHEMA-V3-ASC-VALIDATION-001  
**Fecha:** 23 septiembre 2026  
**Rama auditada:** `feat/species-ecology-schema-v3`  
**Base:** `main`

## 1. Resultado

```text
DESIGN CONFORMANCE: PASS WITH FINDINGS
CODE CONTRACT COVERAGE: PASS WITH OPEN
SOURCE-OF-TRUTH COHERENCE: FAIL — EXPECTED TRANSITIONAL STATE
DERIVATION PURITY: FAIL
TEST EXECUTION: NOT VERIFIED
MERGE READINESS: FAIL
OVERALL ASC VALIDATION: PARTIAL / BLOCKED
```

La rama implementa de forma sustancial el contrato R2, pero todavía no puede considerarse validada como migración ejecutable porque la fuente canónica XLSX no ha sido migrada y ya existen derivados/documentación que describen el estado futuro como si estuviera materializado.

## 2. Conformidad con el contrato R2

La cabecera contractual prevista conserva exactamente 13 campos:

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

El código implementado está preparado para esos campos.

Los vocabularios gobernados coinciden con R2:

```text
dimension:
  distribucion_geografica
  rango_altitudinal
  habitat
  fenologia_floracion
  fenologia_fructificacion

estado:
  activo
  pendiente_revision
  retirado

alcance_tipo:
  geografico
  poblacional
  condicional
  + nullable

unidad:
  m
  + nullable
```

**Resultado:** PASS.

## 3. Autoridad de vocabularios

`config/botanical/controlled_vocabularies.json` fue ampliado a:

```text
specification_version = 2.0.0
contract_version = 2.0.0
```

e incorpora los cuatro campos de `Ecologia_Especie`.

El validador específico no redefine esos cuatro vocabularios como autoridad primaria.

El vocabulario territorial UdeC permanece como payload específico de `distribucion_geografica`, conforme al gate territorial.

**Resultado:** PASS.

## 4. Data Validation

`check_controlled_vocabulary_dv.py` reconoce:

```text
Ecologia_Especie → ecology_fact_id
```

y, para una hoja sin registros, prueba fila 2 como superficie de DV.

Esto resuelve el defecto previo donde una hoja vacía podía pasar sin demostrar que las validaciones estaban instaladas.

**Resultado:** PASS IN CODE / EXECUTION OPEN.

No puede verificarse el resultado real hasta que exista la hoja en el XLSX.

## 5. Contrato SpeciesEcologyFact

La implementación cubre:

- formato `ECO-xxxx`;
- unicidad de IDs;
- FK de especie;
- `fuente_ids` no vacío;
- FK y unicidad de fuentes;
- pairing de alcance;
- existencia de payload;
- límites altitudinales;
- unidad métrica;
- meses válidos y no repetidos;
- códigos territoriales UdeC;
- habitat textual;
- duplicado semántico;
- multiplicidad activa no resuelta;
- warning para múltiples fenologías activas.

Los tests agregados cubren también:

- ID duplicado;
- dimensión inválida;
- estado inválido;
- alcance_tipo inválido;
- dataset vacío;
- distribución inválida;
- duplicados semánticos independientemente de redacción/fuente;
- múltiples habitats permitidos.

**Resultado:** PASS WITH EXECUTION OPEN.

## 6. Routing y fichas

`query_botanical.py` incorpora:

```text
species_ecology.json
ecology
ecology [species_id]
stats → species_ecology
```

`build_species_data.py` prepara:

```text
arboris.species-card.v3
ecology = hechos activos por especie
source closure incluye fuente_ids ecológicas
```

`validate_species_data.py` exige la misma forma.

**Resultado:** PASS IN STATIC CONTRACT.

## 7. Hallazgo material F1 — derivado creado antes de la fuente

La rama ya contiene:

```text
data/botanical/species_ecology.json
[]
```

pero el XLSX canónico todavía no contiene `Ecologia_Especie`.

Según la propia arquitectura de Árboris:

```text
Master
→ export
→ data/botanical/*.json
```

y los JSON derivados no deben editarse manualmente como segunda fuente de verdad.

Por tanto, aunque el archivo vacío represente correctamente el estado futuro esperado, su presencia actual no es todavía una derivación reproducible del Master.

**Clasificación ASC:** INCONSISTENCY / FAIL FOR DERIVATION PURITY.

Corrección requerida antes de validar:

```text
migrar XLSX
→ ejecutar export_master.py
→ dejar que species_ecology.json sea producido por el pipeline
```

No corresponde considerar suficiente el placeholder manual.

## 8. Hallazgo material F2 — documentación normativa adelantada

La rama modifica documentos normativos para afirmar:

```text
Master Botánico 2.0
→ nueve JSON canónicos
```

y documenta `SpeciesEcologyFact` como parte vigente del modelo.

Mientras el XLSX siga en esquema 2.0 y no exporte el noveno dataset, esas afirmaciones describen el estado objetivo de la rama, no el estado reproducible actual.

Esto es aceptable durante una rama de migración **sólo si no se integra**.

**Clasificación ASC:** TRANSITIONAL INCONSISTENCY / MERGE BLOCKER.

No exige revertir ahora la documentación; exige cerrar la migración antes de merge.

## 9. Hallazgo F3 — ejecución no demostrada

No existe en esta validación evidencia de ejecución exitosa de:

```text
test_species_ecology_contract.py
verify:botanical
verify:data-access
npm test
```

Además, `verify:botanical` debe fallar actualmente porque:

```text
controlled_vocabulary_spec_version
branch spec = 2.0.0
Master = 1.0.0
```

hasta migrar metadata del XLSX.

Por tanto no debe afirmarse que los tests “pasan”.

**Clasificación ASC:** OPEN / REQUIRED EXTERNAL EXECUTION.

## 10. Hallazgo F4 — ausencia del contrato final en la rama de implementación

La rama de implementación se creó limpiamente desde `main`, lo cual evita arrastrar la investigación cultural.

Sin embargo, los contratos finales que justifican los valores implementados permanecen en la rama de investigación y no existe aún en esta rama un artefacto compacto que establezca como autoridad de implementación:

- cabecera de 13 campos;
- vocabularios escalares;
- reglas de payload;
- namespace territorial;
- política de versionado.

El checkpoint resume gran parte de esto, pero no sustituye completamente el contrato R2.

**Clasificación ASC:** TRACEABILITY GAP / PARTIAL.

Antes de merge debe existir un contrato final compacto, o una referencia explícita y estable a los artefactos aprobados que permita reconstruir por qué el código tiene exactamente esos valores.

## 11. AUDITORÍA

La implementación sigue la arquitectura prevista y no introduce una segunda autoridad botánica deliberada.

La separación se mantiene:

```text
Species Ecology ≠ Observation context
Species Ecology ≠ ACE character context
Species Ecology ≠ automatic ACE evidence
```

No se detecta integración de `Ipotocaticac` o `Itrofill` como entidades técnicas.

No se detecta modificación de SQLite v1.

## 12. INCONSISTENCIAS

Materiales:

1. `species_ecology.json` existe antes de poder ser derivado del Master.
2. documentación normativa describe nueve JSON mientras la fuente todavía produce ocho.
3. spec de vocabulario 2.0.0 no puede estar ligada todavía al metadata 1.0.0 del XLSX.

Las tres son coherentes con una rama de migración incompleta, pero impiden validación final.

## 13. VACÍOS / OMISIONES

Pendientes:

- migración real del XLSX;
- regeneración de todos los derivados;
- SHA-256 nuevo;
- seis fichas v3 regeneradas;
- ejecución de tests;
- inspección del diff binario/estructural del Master;
- contrato final trazable dentro de la rama de implementación;
- auditoría post-migración.

## 14. REDUNDANCIAS

No se detecta:

- segundo Master;
- segundo motor;
- segundo sistema de regiones;
- SQLite ecológico paralelo;
- duplicación de los vocabularios escalares como autoridad primaria.

## 15. Gate ASC

```text
CONTRACT R2 CONFORMANCE: PASS
CONTROLLED VOCABULARY AUTHORITY: PASS
TERRITORIAL PAYLOAD CONTRACT: PASS
DV EMPTY-SHEET CHECK DESIGN: PASS
SPECIES ECOLOGY VALIDATOR: PASS IN STATIC REVIEW
QUERY ROUTING: PASS IN STATIC REVIEW
SPECIES-CARD V3 CONTRACT: PASS IN STATIC REVIEW

DERIVATION PURITY: FAIL
SOURCE XLSX COHERENCE: FAIL
TRACEABILITY OF FINAL IMPLEMENTATION CONTRACT: PARTIAL
EXECUTED TEST EVIDENCE: OPEN

ASC VALIDATION: PARTIAL / BLOCKED
MERGE: NOT AUTHORIZED
DATA POPULATION: NOT AUTHORIZED
```

## 16. Corrección mínima requerida

Orden mínimo para convertir esta validación en candidata a PASS:

```text
1. materializar el XLSX canónico
2. migrarlo mediante artifact_tool
3. regenerar species_ecology.json desde el Master
4. regenerar metadata + source_sha256
5. regenerar las seis species-card.v3
6. ejecutar verify:botanical
7. ejecutar verify:data-access
8. ejecutar npm test
9. auditar el diff integrado
10. resolver trazabilidad del contrato final
```

Hasta entonces, el estado correcto no es “validated”, sino:

```text
IMPLEMENTATION CANDIDATE — BLOCKED ON SOURCE MIGRATION
```

## 17. Addendum posterior a correcciones ASC

Después de esta auditoría se ejecutaron dos correcciones materiales:

1. se consolidó `docs/SPECIES_ECOLOGY_SCHEMA_V3_FINAL_CONTRACT.md` en la rama de implementación;
2. se eliminó el placeholder manual `data/botanical/species_ecology.json`.

Además, el contrato final incorporó explícitamente:

```text
MASTER_BINDING
DV_EQUIVALENCE
DERIVED_ONLY
EXECUTION_REQUIRED_FOR_CLOSURE
```

Reclasificación de hallazgos:

```text
F1 — derivado manual antes de la fuente:
RESOLVED

F4 — trazabilidad del contrato final:
RESOLVED

F2 — documentación adelantada respecto del XLSX:
OPEN / TRANSITIONAL MERGE BLOCKER

F3 — ejecución no demostrada:
OPEN
```

Estado actualizado:

```text
CONTRACT TRACEABILITY: PASS
DERIVATION PURITY AT BRANCH LEVEL: PASS
SOURCE XLSX COHERENCE: FAIL — EXPECTED UNTIL MIGRATION
EXECUTED TEST EVIDENCE: OPEN
MERGE READINESS: FAIL

ASC VALIDATION: PARTIAL / BLOCKED ON SOURCE MIGRATION
```

Este addendum no reescribe el registro histórico de la auditoría inicial; documenta las correcciones posteriores.
