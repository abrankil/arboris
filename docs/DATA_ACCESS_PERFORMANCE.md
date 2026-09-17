# Árboris — Estrategia de rendimiento de acceso a datos

**Estado:** operativo para acceso de IA; prototipo SQLite derivado implementado; esquema físico definitivo `OPEN`  
**Fecha:** 17 septiembre 2026  
**Alcance:** datos botánicos canónicos, consultas de agentes y preparación del runtime offline-first.

## 1. Objetivo

Reducir el costo de recuperación, lectura y razonamiento sobre los datos de Árboris sin crear una segunda fuente de verdad.

La optimización distingue dos consumidores con necesidades diferentes:

```text
IA / GitHub / revisión humana
→ JSON legible, consultas pequeñas, trazabilidad

runtime móvil / profiling
→ SQLite derivado, índices y consultas locales
```

SQLite no reemplaza los JSON canónicos como superficie de inspección para agentes. El prototipo SQLite es un artefacto runtime regenerable desde el export canónico.

## 2. Autoridad y capas

```text
Master Botánico 2.0 XLSX
= autoridad editorial/científica
        ↓

data/botanical/*.json
= export normalizado canónico derivado
        ↓

data/species/*.json
= vistas denormalizadas por especie
        ↓

query_botanical.py
= acceso compacto de solo lectura

build_reference_sqlite.py
= artefacto SQLite derivado para runtime/performance
```

Una optimización puede duplicar estructuras para lectura o índices solo cuando sea regenerable y no permita editar conocimiento botánico fuera del Master.

## 3. Auditoría de payload actual

Tamaños observados en `main` antes de esta optimización:

| Archivo | Bytes aprox. |
| --- | ---: |
| `metadata.json` | 557 |
| `species.json` | 2,411 |
| `characters.json` | 14,343 |
| `species_characters.json` | 38,530 |
| `sources.json` | 9,940 |
| `glossary.json` | 20,156 |
| `photos.json` | 29,350 |
| `model_errors.json` | 1,434 |
| **bundle normalizado completo** | **116,721** |

Las seis vistas de `data/species/` suman aproximadamente **246,702 bytes**.

Para comparar especies por caracteres no es necesario cargar esas seis vistas. La ruta normalizada `species.json + characters.json + species_characters.json` requiere aproximadamente **55,284 bytes**, cerca de 4.5 veces menos que cargar las seis fichas completas.

## 4. Clases de consulta

### Q1 — identidad de especie

```powershell
python tools/botanical-data/query_botanical.py species SP-001
```

### Q2 — definición de carácter

```powershell
python tools/botanical-data/query_botanical.py character CH-003
```

### Q3 — relación especie × carácter

```powershell
python tools/botanical-data/query_botanical.py relation SP-001 CH-003
```

Agregar procedencia solo cuando sea necesaria:

```powershell
python tools/botanical-data/query_botanical.py relation SP-001 CH-003 --with-source
```

### Q4 — comparación transversal

```powershell
python tools/botanical-data/query_botanical.py compare CH-003
```

Puede limitarse a candidatos concretos:

```powershell
python tools/botanical-data/query_botanical.py compare CH-003 SP-001 SP-002 SP-006
```

### Q5 — fotografías y errores conocidos

```powershell
python tools/botanical-data/query_botanical.py photos SP-001
python tools/botanical-data/query_botanical.py errors SP-002
```

### Q6 — lectura profunda de una especie

Usar una única ficha en `data/species/`. No reconstruir manualmente todos los joins salvo que la tarea sea auditar el pipeline.

## 5. Regla de payload para agentes

Por defecto:

1. resolver IDs antes de abrir tablas grandes;
2. usar `query_botanical.py` cuando exista ejecución local;
3. pedir una relación o carácter específico cuando la pregunta sea puntual;
4. usar comparación normalizada para varias especies;
5. cargar fuentes o fotos solo bajo demanda;
6. evitar `data/species/*.json` múltiples en una misma consulta;
7. evitar archivos históricos y binarios salvo necesidad explícita.

El CLI devuelve JSON compacto por defecto. `--pretty` cambia solo presentación.

## 6. Índices en memoria actuales

El motor canónico ya construye al cargar:

```text
speciesById
charactersById
relationsBySpecies
```

Estas estructuras permiten lookup directo por ID en el proceso de identificación. No se introduce un índice JSON persistente adicional porque el beneficio no compensa una nueva capa derivada que habría que mantener y validar.

## 7. Prototipo SQLite derivado

El esquema SQLite **definitivo** continúa `OPEN`, conforme a `docs/DATA_MODEL.md`.

Sin embargo, ya existe un prototipo regenerable para validar forma física e índices sin fijar todavía la arquitectura final:

```text
tools/botanical-data/build_reference_sqlite.py
```

Salida predeterminada:

```text
build/arboris_reference.sqlite3
```

`build/` está excluido de Git. No se versiona el binario SQLite.

Construcción:

```powershell
npm.cmd run build:reference-db
```

Prueba de equivalencia básica e índices:

```powershell
npm.cmd run verify:reference-db
```

### 7.1 Tablas materializadas en el prototipo

```text
metadata
species
characters
sources
species_characters
species_character_states
photos
model_errors
```

`species_character_states` explota los arrays de `estado_esperado` para permitir filtrado rápido por carácter + estado sin depender de JSON embebido.

El prototipo conserva además `payload_json` por registro para no perder campos del export mientras se prueba qué columnas merecen normalización física definitiva.

### 7.2 Índices implementados

```sql
CREATE INDEX idx_species_characters_character
ON species_characters(character_id, species_id);

CREATE INDEX idx_species_character_states_lookup
ON species_character_states(character_id, state, species_id);

CREATE INDEX idx_photos_species
ON photos(species_id);

CREATE INDEX idx_photos_individual
ON photos(individual_id);

CREATE INDEX idx_model_errors_species
ON model_errors(species_id_real);
```

El PK compuesto de `species_characters(species_id, character_id)` cubre la dirección especie → carácter; el índice secundario cubre la dirección carácter → especies.

No se crean índices por defecto sobre campos de baja cardinalidad como `estado_piloto`, `confianza` o `poder_diagnostico` sin evidencia de consulta real.

### 7.3 Validación del query plan

`test_reference_sqlite.py` comprueba con `EXPLAIN QUERY PLAN` que SQLite use los índices críticos para:

- relaciones por `character_id`;
- candidatos por `(character_id, state)`;
- fotografías por `species_id`.

También comprueba conteos centrales, materialización de estados y preservación de metadata de procedencia.

## 8. Consultas que el futuro SQLite debe optimizar

Prioridad alta:

```text
species_id → species
character_id → character
(species_id, character_id) → relation
character_id → relations de candidatos
(character_id, state) → species compatibles
species_id → photos
source_id → provenance
```

Prioridad posterior:

```text
búsqueda de glosario
filtros de fotos por órgano/fenología/calidad
consultas territoriales
observaciones del usuario
sincronización
```

FTS, RTree/geospatial y otros índices especializados permanecen `OPEN` hasta existir consultas reales y pruebas en Android.

## 9. Separación reference data / user data

Debe preservarse la separación conceptual entre:

```text
REFERENCE DATA
Master + derivados botánicos versionados

USER / FIELD DATA
observaciones, evidencia, sesiones, progreso y estado de juego
```

Queda `OPEN` si esto se implementará físicamente como dos bases SQLite o como familias de tablas dentro de una sola base. No elegirlo solo por conveniencia antes de validar sincronización y migraciones.

El prototipo actual contiene **solo reference data**.

## 10. Medición antes de consolidar SQLite

Antes de promover el prototipo a arquitectura runtime final, medir al menos:

- tiempo de construcción y tamaño del DB derivado;
- tiempo de apertura en Android real;
- tiempo de primera consulta y consultas repetidas;
- memoria residente;
- tamaño del paquete offline;
- frecuencia de cada query;
- costo de migración/versionado;
- comportamiento con el dataset territorial futuro;
- beneficio real de cada índice mediante `EXPLAIN QUERY PLAN`.

Una estructura que mejora microbenchmarks pero aumenta ambigüedad de autoridad o mantenimiento no se aprueba.

## 11. Protocolo de auditoría de esta optimización

### AUDITORÍA

Se mantiene una sola autoridad editorial y se añadieron dos superficies derivadas con propósitos distintos: CLI compacto para agentes y SQLite temporal para profiling/runtime.

### INCONSISTENCIAS

Resuelta la tensión entre “SQLite está `OPEN`” y la necesidad de probar índices: el **esquema final** permanece abierto, mientras el prototipo se declara explícitamente experimental y regenerable.

### VACÍOS / OMISIONES

Permanecen `OPEN`:

- benchmark en dispositivo Android real;
- esquema de observaciones/evidencia del usuario;
- estrategia de migraciones;
- una base vs dos bases para reference/user data;
- FTS y geospatial;
- integración directa con `expo-sqlite`.

### REDUNDANCIAS

`payload_json` duplica campos indexados de manera **intencional** dentro del prototipo para preservar información durante la exploración del esquema. No debe asumirse como diseño final.

No se creó un `query_index.json` persistente porque sería una redundancia adicional sin beneficio demostrado.

## 12. Gate actual

```text
AI routing: PASS
compact query CLI: PASS
CLI smoke tests: ADDED
normalized JSON authority chain: PASS
persistent JSON query index: NOT NEEDED
SQLite derived prototype: IMPLEMENTED
critical SQLite indexes: IMPLEMENTED
EXPLAIN QUERY PLAN tests: ADDED
SQLite final schema: OPEN
Android runtime benchmark: NOT TESTED
```

El siguiente gate de datos es ejecutar y perfilar este prototipo en el entorno de desarrollo y, cuando exista la primera necesidad runtime real, conectarlo a `expo-sqlite` sin convertir el DB derivado en fuente editorial.
