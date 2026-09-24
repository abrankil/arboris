# Árboris — Auditoría adversarial de la propuesta exacta de modificación Master 2.0

**Estado:** auditoría no normativa  
**Gate:** SPECIES-ECOLOGY-MASTER-MODIFICATION-ADV-001  
**Fecha:** 23 septiembre 2026  
**Objeto auditado:** `SPECIES_ECOLOGY_MASTER_MODIFICATION_PROPOSAL_001.md`

## 1. Veredicto

```text
VERDICT: PARTIAL / REVISION REQUIRED
MASTER EXECUTION: BLOCKED
```

La propuesta identifica correctamente el cambio estructural principal, pero todavía no es ejecutable de forma segura. La auditoría detecta omisiones materiales en gobernanza de vocabulario, validación de Excel, unicidad semántica, conflicto, routing de datos y versionado.

## 2. Hallazgos adversariales

### A1 — vocabularios controlados duplicarían autoridad

La propuesta declara como vocabulario controlado:

- `dimension`;
- `estado`;
- `alcance_tipo`;
- `unidad`.

Pero el proyecto ya posee una autoridad explícita:

```text
config/botanical/controlled_vocabularies.json
```

y `validate_master_export.py` ya está enlazado a esa especificación mediante metadata.

Definir los nuevos valores sólo como constantes Python produciría una segunda autoridad de vocabulario.

**Severidad:** alta.

**Corrección requerida:** extender la especificación central o declarar explícitamente que un campo queda fuera de su gobierno. Para estos cuatro campos, la opción coherente es incorporarlos a la especificación central.

### A2 — el checker de Data Validation de Excel no soporta la nueva hoja

`check_controlled_vocabulary_dv.py` sólo tiene contrato de clave para:

```text
Especie_Caracter
```

Si los campos de `Ecologia_Especie` se agregan al vocabulario central, el checker fallaría por no conocer la nueva hoja.

Además, `verify:botanical` no ejecuta actualmente este checker.

**Severidad:** alta.

**Corrección requerida:**

- agregar `Ecologia_Especie` a `RECORD_KEYS`;
- definir cómo se valida DV cuando la hoja nace sin registros;
- incorporar el checker al gate botánico o documentar un gate equivalente obligatorio.

### A3 — la firma semántica genérica no detecta duplicados reales

La propuesta incluye `valor_texto` en toda firma semántica.

Dos hechos fenológicos equivalentes podrían quedar:

```text
valor_texto = "mayo a diciembre"
valor_codificado = [05..12]
```

y:

```text
valor_texto = "mayo-diciembre"
valor_codificado = [05..12]
```

La firma sería distinta aunque el hecho normalizado sea el mismo.

**Severidad:** alta.

**Corrección requerida:** firma específica por dimensión. Cuando existe payload codificado autoritativo, el texto de preservación no debe definir identidad semántica.

### A4 — rangos altitudinales disjuntos no prueban contradicción

La regla propuesta:

```text
dos rangos disjuntos
→ ECOLOGY_CONFLICT
```

es demasiado fuerte.

Fuentes distintas pueden documentar subconjuntos, poblaciones o cobertura incompleta. La disyunción por sí sola no demuestra incompatibilidad botánica.

**Severidad:** alta.

**Corrección requerida:** no inferir conflicto lógico desde disyunción. Si existen múltiples hechos activos diferentes para una dimensión que el producto pretende presentar como un único rango canónico bajo el mismo alcance, bloquear la consolidación editorial por multiplicidad no resuelta, sin afirmar que una fuente sea falsa.

### A5 — el routing de lectura seguiría creyendo que existen ocho JSON

`query_botanical.py` contiene una tupla cerrada `CANONICAL_FILES` con los ocho JSON actuales y calcula `canonical_json_bytes` sólo sobre ellos.

Si se añade `species_ecology.json` sin actualizarlo:

- `stats` subreportaría el dataset canónico;
- no existiría consulta compacta de ecología;
- el router recomendado en `AGENTS.md` y `data/README.md` quedaría incompleto.

**Severidad:** media-alta.

### A6 — impacto documental incompleto

La propuesta enumera cinco documentos a actualizar, pero también deben revisarse:

- `AGENTS.md`;
- `docs/START_HERE.md`;
- tests de `query_botanical.py`;
- cualquier texto que enumere explícitamente ocho derivados canónicos.

**Severidad:** media.

### A7 — versionado no está completamente compilado

La propuesta identifica incremento de `schema_version`, pero omite explícitamente:

- actualización de `updated_at`;
- incremento de la versión del contrato de vocabulario controlado si se amplía su scope;
- actualización de los bindings correspondientes en `Metadatos`.

**Severidad:** alta.

El número exacto de versión sigue `OPEN` mientras no exista una regla de versionado resuelta. No debe inventarse.

### A8 — una hoja vacía no prueba su contrato de Data Validation

La secuencia propone validar primero un esquema vacío.

Eso prueba exportación estructural, pero el checker actual sólo inspecciona celdas de filas consideradas registros. Una hoja vacía podría pasar sin demostrar que los futuros campos gobernados tienen la DV correcta.

**Severidad:** alta.

**Corrección requerida:** prueba de migración sobre una copia temporal del workbook con una fila sintética no persistida, o ampliación del checker para validar rangos editables aunque no existan registros.

### A9 — impacto sobre SQLite debe quedar decidido, no implícito

`build_reference_sqlite.py` no materializa todos los JSON canónicos actuales; su scope es un prototipo de consultas runtime.

Por tanto no es obligatorio agregar ecología.

Pero la propuesta debe decir explícitamente:

```text
species_ecology excluded from reference SQLite v1 by scope
```

o diseñar su incorporación.

Dejarlo tácito crea ambigüedad de cobertura.

**Severidad:** media.

### A10 — atomicidad debe referirse al estado integrado, no al orden local

La propuesta dice que el cambio `8 → 9` y `species-card.v2 → v3` debe ser atómico, pero su secuencia contiene pasos intermedios incompatibles.

Eso es aceptable durante una rama de migración, pero no en un estado compartido.

**Corrección requerida:** ningún commit/merge marcado listo puede dejar pipeline, derivados y documentación desincronizados. El gate atómico aplica al resultado integrado.

**Severidad:** media.

## 3. Elementos que pasan sin corrección

```text
ONE MASTER: PASS
RELATIONAL ECOLOGY TABLE: PASS
PROVENANCE PER FACT: PASS
SPECIES / OBSERVATION SEPARATION: PASS
ACE CONTEXT / ECOLOGY SEPARATION: PASS
EXPORT BASIC TYPES: PASS
SPECIES CARD V3 NEED: PASS
SCHEMA-FIRST THEN DATA: PASS
NO DIRECT ACE CONSUMPTION: PASS
```

## 4. AUDITORÍA

El defecto principal ya no está en el modelo `SpeciesEcologyFact`.

Está en la integración con contratos que el repositorio ya posee:

```text
controlled vocabulary authority
data-validation checker
compact query routing
version bindings
migration verification
```

La propuesta 001 subestimó esas superficies.

## 5. INCONSISTENCIAS

La inconsistencia más importante es declarar nuevos “vocabularios controlados” sin extender la autoridad de vocabulario controlado existente.

La segunda es afirmar control de duplicados mediante una firma genérica que todavía distingue hechos equivalentes por diferencias de redacción.

## 6. VACÍOS / OMISIONES

Antes de ejecutar deben quedar definidos:

- binding de vocabularios nuevos;
- estrategia de DV sobre hoja vacía;
- firmas semánticas por dimensión;
- política de multiplicidad altitudinal;
- routing de `species_ecology`;
- scope explícito de SQLite;
- version bindings;
- tests de regresión exactos.

## 7. REDUNDANCIAS

No se detecta necesidad de nuevas fuentes de verdad.

La principal redundancia potencial sería crear constantes de vocabulario independientes de `controlled_vocabularies.json`.

## 8. Gate

```text
PROPOSAL 001 ARCHITECTURE: PASS
PROPOSAL 001 INTEGRATION COMPLETENESS: FAIL
CONTROLLED VOCABULARY BINDING: FAIL
SEMANTIC DUPLICATE RULE: FAIL
ALTITUDE CONFLICT RULE: FAIL
QUERY ROUTING COVERAGE: FAIL
VERSION BINDINGS: PARTIAL
MASTER EXECUTION: BLOCKED
CORRECTED PROPOSAL REQUIRED: YES
```
