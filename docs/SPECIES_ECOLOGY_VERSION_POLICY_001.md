# Árboris — Gate de política de versionado para ampliación ecológica

**Estado:** decisión técnica candidata / no ejecutada  
**Gate:** SPECIES-ECOLOGY-VERSION-POLICY-001  
**Fecha:** 23 septiembre 2026  
**Ámbito:** definir qué versiones deben cambiar y con qué criterio antes de modificar Master Botánico 2.0.

## 1. Hallazgo de autoridad

No se encontró en el repositorio una política normativa explícita que defina cómo incrementar:

- `master_version`;
- `schema_version`;
- `controlled_vocabulary_spec_version`;
- `contract_version`.

El estado vigente es:

```text
master_version = 2.0.0
schema_version = 2.0.0
controlled_vocabulary_spec_version = 1.0.0
controlled vocabulary contract_version = 1.0.0
updated_at = 2026-09-16
```

Por tanto, no corresponde presentar un incremento concreto como “regla ya existente”.

Sí corresponde diseñar una política mínima para este cambio y auditarla.

## 2. Distinción de versiones

### 2.1 master_version

Representa la edición botánica/editorial del Master.

Debe cambiar cuando cambia de forma material el contenido editorial gobernado por el Master.

No debe utilizarse como sustituto de `schema_version`.

### 2.2 schema_version

Representa la forma estructural exportable del Master y sus derivados.

Debe cambiar cuando cambia:

- número o forma de datasets canónicos;
- campos exportables;
- relaciones estructurales;
- contratos de vistas derivadas.

### 2.3 controlled_vocabulary_spec_version

Representa la versión de la especificación:

```text
config/botanical/controlled_vocabularies.json
```

Debe cambiar cuando cambia su scope, definición o conjunto de campos gobernados.

### 2.4 controlled vocabulary contract_version

Representa el contrato que consumidores/checkers esperan de esa especificación.

Debe cambiar cuando el cambio exige actualizar validadores, Data Validation del XLSX o consumidores vinculados.

### 2.5 updated_at

Debe reflejar la fecha real de modificación del Master cuando la migración se ejecute.

No debe adelantarse durante la fase de diseño.

## 3. Política semántica mínima propuesta

Para estas cuatro versiones se adopta como política candidata:

```text
MAJOR
→ cambio incompatible para consumidores que implementan el contrato anterior

MINOR
→ ampliación compatible que consumidores anteriores pueden ignorar sin quedar inválidos

PATCH
→ corrección sin cambio de forma contractual
```

Esta política se aplica por versión, no globalmente.

Un mismo cambio puede ser MAJOR para el schema y MINOR para el contenido editorial.

## 4. Clasificación del cambio ecológico

La ampliación propuesta introduce:

```text
8 JSON canónicos → 9
species_ecology.json nuevo
species-card.v2 → species-card.v3
scope de vocabulario controlado ampliado
checker DV ampliado
query routing ampliado
```

### 4.1 schema_version

Para un consumidor que espera exactamente el esquema 2.0.0:

- aparece un dataset canónico adicional;
- cambia el contrato de la ficha por especie;
- cambian validadores y routing.

Esto es un cambio contractual incompatible.

**Clasificación:** MAJOR.

Valor candidato:

```text
2.0.0 → 3.0.0
```

### 4.2 controlled_vocabulary_spec_version

La especificación 1.0.0 tiene un `scope` cerrado y `validate_spec()` exige equivalencia exacta entre `scope` y `fields`.

Agregar:

```text
Ecologia_Especie.dimension
Ecologia_Especie.estado
Ecologia_Especie.alcance_tipo
Ecologia_Especie.unidad
```

cambia materialmente el scope gobernado.

Consumidores/checkers actuales deben actualizarse.

**Clasificación:** MAJOR.

Valor candidato:

```text
1.0.0 → 2.0.0
```

### 4.3 contract_version

El checker actual no conoce `Ecologia_Especie`; el contrato cambia y exige nuevas reglas.

**Clasificación:** MAJOR.

Valor candidato:

```text
1.0.0 → 2.0.0
```

### 4.4 master_version

La primera fase de migración propuesta introduce **estructura vacía** sin agregar hechos ecológicos activos.

Eso cambia el esquema, pero no cambia todavía el conocimiento botánico sustantivo de las especies.

Por tanto, para la fase de esquema vacío:

```text
master_version = 2.0.0
```

se mantiene.

Cuando se incorporen hechos ecológicos verificados, deberá abrirse un gate separado para determinar el incremento editorial correspondiente.

**Resultado:** mantener 2.0.0 durante SCHEMA CHANGE.

## 5. Bindings exactos de la fase de esquema

Si se ejecuta únicamente:

```text
SCHEMA CHANGE
→ species_ecology.json = []
→ no active ecology facts
```

los bindings propuestos son:

```text
master_version:                       2.0.0
schema_version:                       3.0.0
controlled_vocabulary_spec_version:   2.0.0
controlled vocabulary contract_version: 2.0.0
updated_at:                           fecha real de ejecución
species-card schema:                  arboris.species-card.v3
```

## 6. Regla para población posterior

La incorporación posterior de hechos ecológicos verificados no debe cambiar `schema_version` si la estructura 3.0.0 no cambia.

Debe evaluar:

```text
master_version
updated_at
source_sha256
```

según el contenido efectivamente incorporado.

No se asigna todavía el siguiente `master_version`.

## 7. Compatibilidad

Durante una rama de migración puede existir transitoriamente:

```text
schema_version 3.0.0
+ datos aún vacíos
```

pero no puede consolidarse un estado en que metadata declare 3.0.0 mientras los derivados o validadores sigan en forma 2.0.0.

El cambio integrado debe ser atómico respecto de:

- XLSX;
- metadata;
- vocabulario;
- JSON;
- fichas;
- validators;
- routing;
- docs.

## 8. AUDITORÍA

La propuesta separa correctamente versión editorial de versión estructural.

El cambio ecológico de esquema es MAJOR para:

- schema;
- controlled-vocabulary specification;
- controlled-vocabulary contract.

No existe razón suficiente para incrementar `master_version` durante la fase de esquema vacío.

## 9. INCONSISTENCIAS

No se detecta contradicción con metadata vigente.

Sí existe una particularidad nominal:

```text
archivo físico:
Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx

schema_version:
3.0.0
```

El nombre del archivo contiene “2.0”, pero `source_file` identifica el archivo físico y `schema_version` identifica el contrato.

Renombrar el XLSX no debe hacerse automáticamente porque alteraría rutas, documentación y tooling. Queda como decisión separada si se considera necesario.

## 10. VACÍOS / OMISIONES

Permanece OPEN:

- si el nombre físico del XLSX debe cambiar en una futura versión editorial;
- qué incremento de `master_version` corresponde cuando se incorporen hechos ecológicos reales;
- documentación normativa de esta política para usos futuros fuera de este cambio.

Estos OPEN no bloquean el diseño de la migración de esquema.

## 11. REDUNDANCIAS

No se introducen nuevos números de versión redundantes.

Cada versión queda asociada a una responsabilidad distinta.

## 12. Gate

```text
EXPLICIT EXISTING VERSION POLICY: NOT FOUND

VERSION RESPONSIBILITIES: PASS
SEMANTIC VERSION RULE: PASS AS PROJECT CANDIDATE

SCHEMA_VERSION 3.0.0: SUPPORTED
CONTROLLED_VOCAB_SPEC 2.0.0: SUPPORTED
CONTROLLED_VOCAB_CONTRACT 2.0.0: SUPPORTED
MASTER_VERSION REMAINS 2.0.0 FOR EMPTY SCHEMA MIGRATION: SUPPORTED
UPDATED_AT = EXECUTION DATE: SUPPORTED

VERSION POLICY GATE: PASS WITH OPEN
TERRITORIAL VOCABULARY GATE: NEXT REQUIRED
MASTER EXECUTION: STILL BLOCKED
```
