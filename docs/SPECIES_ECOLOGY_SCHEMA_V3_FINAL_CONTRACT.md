# Árboris — Contrato final de implementación Species Ecology Schema v3

**Estado:** contrato de implementación consolidado / no integrado  
**Gate:** SPECIES-ECOLOGY-SCHEMA-V3-FINAL-CONTRACT-001  
**Fecha:** 23 septiembre 2026  
**Rama:** `feat/species-ecology-schema-v3`  
**Autoridad de diseño:** consolidación de los gates R2, versionado, vocabulario territorial, migration readiness y validación ASC.

## 1. Propósito

Este documento consolida en una sola pieza el contrato exacto que debe implementar la migración de esquema de ecología de especie.

No incorpora conocimiento ecológico real. Define estructura, autoridad, validación y límites.

## 2. Unidad canónica

`SpeciesEcologyFact` representa un hecho ecológico general documentado para una especie.

No representa:

- una observación concreta;
- evidencia de ACE;
- contexto de variabilidad de caracteres;
- una inferencia automática del modelo.

## 3. Fuente de verdad

La única fuente editorial sigue siendo:

```text
data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx
```

La nueva relación debe existir dentro de ese mismo Master.

No se crea un segundo Master.

## 4. Nueva hoja

Nombre exacto:

```text
Ecologia_Especie
```

Cabecera exacta y orden:

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

## 5. Salida derivada

```text
data/botanical/species_ecology.json
```

Debe ser generado por `export_master.py`.

En la migración inicial de esquema:

```json
[]
```

No debe mantenerse manualmente.

## 6. Campos y tipos

| campo | tipo JSON | nullable | regla |
| --- | --- | --- | --- |
| ecology_fact_id | string | No | PK, formato ECO-0001 |
| species_id | string | No | FK a Especies_Piloto.species_id |
| dimension | string | No | vocabulario controlado |
| valor_texto | string | Sí | texto fiel a fuente cuando corresponde |
| valor_codificado | array<string> | No | [] si no aplica |
| valor_min | number | Sí | mínimo numérico |
| valor_max | number | Sí | máximo numérico |
| unidad | string | Sí | vocabulario controlado |
| alcance_tipo | string | Sí | vocabulario controlado |
| alcance_valor | string | Sí | restricción concreta del alcance |
| fuente_ids | array<string> | No | una o más FKs a Fuentes.fuente_id |
| estado | string | No | vocabulario controlado |
| notas | string | Sí | aclaración editorial no computable |

## 7. Vocabularios controlados

Autoridad primaria:

```text
config/botanical/controlled_vocabularies.json
```

### dimension

```text
distribucion_geografica
rango_altitudinal
habitat
fenologia_floracion
fenologia_fructificacion
```

### estado

```text
activo
pendiente_revision
retirado
```

### alcance_tipo

```text
geografico
poblacional
condicional
```

o null.

### unidad

```text
m
```

o null.

## 8. Payload territorial

Para `dimension = distribucion_geografica` se usa el vocabulario:

```text
arboris.udec-vascular-catalog.distribution-area.v1
```

Códigos permitidos:

```text
AYP TAR ANT ATA COQ VAL RME LBO MAU NUB BIO ARA LRI LLA AIS MAG IPA JFE IDE
```

Estos códigos representan áreas de distribución usadas por el Catálogo de Plantas UdeC.

No deben presentarse como un sistema administrativo universal.

No convertir automáticamente provincias, comunas, ecorregiones, macrozonas, coordenadas o áreas insulares a otra unidad territorial.

## 9. Payload por dimensión

### distribucion_geografica

- usa `valor_codificado`;
- puede preservar texto fuente en `valor_texto`;
- no usa rango numérico ni unidad;
- un hecho activo requiere al menos un código válido.

### rango_altitudinal

- usa `valor_min` y/o `valor_max`;
- al menos un límite debe existir;
- si ambos existen, `valor_min <= valor_max`;
- `unidad = m`;
- no usa `valor_codificado`.

### habitat

- requiere `valor_texto`;
- no usa `valor_codificado`;
- no usa rango ni unidad;
- no se normaliza semánticamente más allá de espacios/casefold para duplicados exactos.

### fenologia_floracion / fenologia_fructificacion

- puede usar `valor_codificado` con meses `01..12`;
- meses explícitos pueden normalizarse;
- expresiones como “primavera” permanecen en `valor_texto`;
- no usa rango numérico ni unidad;
- no inferir fructificación desde floración ni viceversa.

## 10. Procedencia

`fuente_ids` es obligatorio y no vacío.

Regla:

```text
NO SOURCE
→ NO CANONICAL ECOLOGY FACT
```

Varias fuentes pueden respaldar un mismo hecho sin duplicarlo.

Las notas existentes en `Fuentes` son pistas editoriales, no filas canónicas automáticas.

## 11. Identidad semántica

La firma depende de la dimensión.

### distribución

```text
species_id
dimension
valor_codificado normalizado
alcance_tipo
alcance_valor normalizado
```

### altitud

```text
species_id
dimension
valor_min
valor_max
unidad
alcance_tipo
alcance_valor normalizado
```

### fenología con meses

```text
species_id
dimension
meses normalizados
alcance_tipo
alcance_valor normalizado
```

### fenología textual

```text
species_id
dimension
valor_texto normalizado
alcance_tipo
alcance_valor normalizado
```

### hábitat

```text
species_id
dimension
valor_texto normalizado
alcance_tipo
alcance_valor normalizado
```

`fuente_ids` no diferencia dos hechos semánticamente iguales.

## 12. Duplicados y multiplicidad

Dos registros activos o pendientes con igual firma semántica:

```text
→ ECOLOGY_DUPLICATE_FACT
```

Para `rango_altitudinal` y `distribucion_geografica`:

```text
>1 hecho activo distinto
+ misma especie
+ mismo alcance
→ ECOLOGY_UNRESOLVED_MULTIPLE_FACTS
→ no elegible para UX hasta revisión editorial
```

No se interpreta automáticamente como contradicción botánica.

Para fenología:

```text
múltiples hechos activos distintos
→ warning
```

Para hábitat:

múltiples hechos distintos están permitidos.

## 13. Null y ausencia

```text
NO FACT
→ conocimiento no documentado
```

Nunca:

```text
NO FACT = ausencia biológica
```

`alcance_tipo` y `alcance_valor` deben ser ambos null o ambos definidos.

## 14. Separaciones obligatorias

```text
SpeciesEcologyFact ≠ Observation
SpeciesEcologyFact ≠ CharacterEvidence
SpeciesEcologyFact ≠ ACE context
SpeciesEcologyFact ≠ automatic ACE evidence
```

La ecología de especie no se copia automáticamente a una observación.

Una observación no actualiza conocimiento de especie sin proceso editorial.

## 15. Uso en producto

Sólo hechos:

```text
estado = activo
+ válidos
+ sin multiplicidad bloqueante
```

son elegibles para consumo.

Consumidores iniciales:

- ficha de especie;
- aprendizaje post-desbloqueo;
- contexto/hints de exploración cuando corresponda.

No participa en ACE sin gate posterior específico.

## 16. Species card

El estado integrado pasa a:

```text
arboris.species-card.v3
```

La ficha incorpora:

```text
ecology = hechos activos de la especie
```

y `sources` debe cerrar todas las `fuente_ids` usadas por esos hechos.

## 17. Query routing

`query_botanical.py` debe reconocer:

```text
species_ecology.json
ecology
ecology [species_id]
stats → species_ecology
```

## 18. SQLite

En esta fase:

```text
species_ecology
NOT materialized
in reference SQLite schema v1
```

Una inclusión futura requiere gate independiente.

## 19. Version bindings de la migración vacía

```text
master_version = 2.0.0
schema_version = 3.0.0
controlled_vocabulary_spec_version = 2.0.0
controlled vocabulary contract_version = 2.0.0
species-card schema = arboris.species-card.v3
updated_at = fecha real de ejecución
```

`master_version` se mantiene porque la primera migración no incorpora hechos ecológicos activos.

La población posterior debe abrir gate editorial separado.

## 20. Data Validation del XLSX

La hoja `Ecologia_Especie` debe tener list DV conforme al vocabulario central para:

- `dimension`;
- `estado`;
- `alcance_tipo`;
- `unidad`.

El checker debe verificar DV incluso con hoja vacía.

## 21. Contrato de exportación

`Diccionario_Campos` debe contener los 13 campos.

`Exportar_JSON` debe incorporar:

```text
Ecologia_Especie
→ species_ecology
→ exportar = Sí
→ valor_codificado/fuente_ids split por multi_state_separator
```

El exportador no requiere lógica especial adicional.

## 22. Validaciones obligatorias

Debe verificarse:

1. ID y unicidad `ECO-xxxx`;
2. FK de especie;
3. dimensión gobernada;
4. `fuente_ids` no vacío, sin duplicados y existente;
5. estado gobernado;
6. alcance coherente;
7. payload presente;
8. reglas por dimensión;
9. meses válidos;
10. códigos territoriales válidos;
11. firma semántica no duplicada;
12. multiplicidad activa bloqueante;
13. ausencia de dato no tratada como ausencia biológica.

## 23. Gate de integración

No puede integrarse mientras no sean simultáneamente coherentes:

```text
XLSX
Diccionario_Campos
Exportar_JSON
Metadatos
controlled_vocabularies.json
species_ecology.json
species-card.v3
validators
query routing
docs
tests
```

## 24. Secuencia autorizada

```text
1. migrar XLSX
2. regenerar JSON canónicos
3. regenerar metadata + source_sha256
4. regenerar species-card.v3
5. verify:botanical
6. verify:data-access
7. npm test
8. auditoría integrada ASC
9. decidir merge
10. abrir gate independiente de DATA POPULATION
```

## 25. Prohibiciones de esta fase

No:

- poblar hechos ecológicos reales;
- inferir datos desde conocimiento del modelo;
- transformar automáticamente notas de Fuentes;
- usar distribución para filtrar ACE;
- crear microhábitat o relaciones bióticas;
- modificar Observation;
- modificar `contexts.json`;
- crear un segundo Master;
- crear SQLite ecológico;
- introducir `Ipotocaticac` o `Itrofill` como entidades técnicas.

## 26. Estado del contrato

```text
FINAL IMPLEMENTATION CONTRACT: CONSOLIDATED
SCHEMA-ONLY MIGRATION: AUTHORIZED
REAL DATA POPULATION: BLOCKED
MERGE: BLOCKED UNTIL SOURCE MIGRATION + REGENERATION + TESTS + AUDIT
```
