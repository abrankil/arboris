# Árboris — Estrategia de rendimiento de acceso a datos

**Estado:** operativo para acceso de IA; benchmark host JSON vs SQLite ejecutado; arquitectura Android final `OPEN`  
**Fecha:** 17 septiembre 2026  
**Alcance:** datos botánicos canónicos, consultas de agentes y preparación del runtime offline-first.

## 1. Objetivo

Reducir el costo de recuperación, lectura y razonamiento sobre los datos de Árboris sin crear una segunda fuente de verdad.

La optimización distingue dos consumidores con necesidades diferentes:

```text
IA / GitHub / revisión humana
→ JSON legible, consultas pequeñas, trazabilidad

runtime móvil / profiling
→ JSON + índices en memoria como baseline del piloto
→ SQLite derivado como alternativa experimental para validar escalamiento
```

SQLite no reemplaza los JSON canónicos como superficie de inspección para agentes. El prototipo SQLite es un artefacto regenerable desde el export canónico.

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
= artefacto SQLite derivado para profiling/runtime
```

Una optimización puede duplicar estructuras para lectura o índices solo cuando sea regenerable y no permita editar conocimiento botánico fuera del Master.

## 3. Auditoría de payload actual

Tamaños del conjunto canónico:

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

Para el motor de identificación, `metadata.json + species.json + characters.json + species_characters.json` ocupan aproximadamente **55,841 bytes**. Para comparar especies por caracteres no es necesario cargar las seis fichas completas.

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

El motor canónico construye al cargar:

```text
speciesById
charactersById
relationsBySpecies
```

Estas estructuras permiten lookup directo por ID en el proceso de identificación. No se introduce un índice JSON persistente adicional porque el beneficio no compensa una nueva capa derivada que habría que mantener y validar.

## 7. Prototipo SQLite derivado

El esquema SQLite **definitivo** continúa `OPEN`, conforme a `docs/DATA_MODEL.md`.

El prototipo regenerable es:

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
npm run build:reference-db
```

Prueba de equivalencia básica e índices:

```powershell
npm run verify:reference-db
```

### 7.1 Tablas materializadas

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

`species_character_states` explota los arrays de `estado_esperado` para permitir filtrado por carácter + estado sin depender de JSON embebido.

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

El PK compuesto de `species_characters(species_id, character_id)` cubre la dirección especie → carácter; el índice secundario cubre carácter → especies.

No se crean índices por defecto sobre campos de baja cardinalidad sin evidencia de consulta real.

### 7.3 Validación del query plan

`test_reference_sqlite.py` comprueba con `EXPLAIN QUERY PLAN` que SQLite use los índices críticos y valida conteos, materialización de estados y metadata de procedencia.

## 8. Benchmark controlado JSON vs SQLite — fase host

El benchmark reproducible está en:

```text
tools/botanical-data/benchmark_reference_access.mjs
.github/workflows/reference-data-benchmark.yml
```

Ejecución local:

```powershell
npm run benchmark:reference-data
```

El workflow se ejecuta cuando cambian datos botánicos, el builder SQLite, el loader canónico, el propio benchmark o su workflow. No es un gate de CI: los tiempos de runners compartidos son evidencia direccional, no un umbral estable de rendimiento.

### 8.1 Entorno medido

Primera corrida controlada:

```text
GitHub Actions / Ubuntu x64
Node v24.20.0
Master 2.0.0
6 especies
19 caracteres activos
88 relaciones activas del motor
```

La validación botánica reporta 89 relaciones totales. No es una contradicción: el benchmark usa la misma superficie computable del motor, que excluye la relación asociada a un carácter no activo.

### 8.2 Tamaño

```text
bundle JSON usado por el motor     55,841 bytes
bundle JSON canónico completo     116,721 bytes
SQLite derivado                   151,552 bytes

SQLite / JSON motor                 2.714x
SQLite / JSON canónico total        1.298x
```

Para el piloto actual, SQLite no reduce el footprint de reference data.

### 8.3 Tiempos medianos observados

| Escenario | JSON | SQLite | SQLite / JSON |
| --- | ---: | ---: | ---: |
| fresh session / first lookup | 592.133 µs | 131.684 µs | 0.222x |
| species lookup | 0.029 µs | 11.377 µs | 395.049x |
| species × character | 0.046 µs | 11.561 µs | 249.704x |
| character → candidate relations | 0.174 µs | 13.254 µs | 76.217x |
| character + state → compatible species | 0.365 µs | 13.255 µs | 36.276x |

Interpretación:

- SQLite gana claramente en el costo de abrir una sesión y realizar una primera consulta sin cargar el bundle completo.
- Una vez cargado el dataset pequeño del piloto, los índices `Map` en memoria son órdenes de magnitud más rápidos que consultas SQLite host para el loop de identificación.
- El bundle JSON requerido por el motor es menor que el DB SQLite derivado.
- Estos resultados no son equivalentes a `expo-sqlite` en Android y no autorizan una decisión definitiva sobre almacenamiento móvil.

### 8.4 Decisión aprobada para el piloto

Para la **capa de referencia botánica usada por el motor de identificación del piloto**:

```text
JSON canónico + índices en memoria
→ BASELINE APROBADA

migración del motor a SQLite
→ NO JUSTIFICADA por el benchmark host actual

SQLite derivado
→ conservar como prototipo de profiling y escalamiento

arquitectura final Android
→ OPEN hasta benchmark con expo-sqlite en dispositivo real
```

Esto no decide el almacenamiento de observaciones, progreso, mapas, paquetes territoriales ni datasets futuros más grandes.

## 9. Consultas que un futuro SQLite debe optimizar

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

## 10. Separación reference data / user data

Debe preservarse la separación conceptual entre:

```text
REFERENCE DATA
Master + derivados botánicos versionados

USER / FIELD DATA
observaciones, evidencia, sesiones, progreso y estado de juego
```

Queda `OPEN` si esto se implementará físicamente como dos bases SQLite o como familias de tablas dentro de una sola base. El prototipo actual contiene **solo reference data**.

## 11. Medición pendiente antes de consolidar arquitectura Android

Antes de promover SQLite o descartar su uso para otras capas, medir en dispositivo Android representativo:

- tiempo de apertura con `expo-sqlite`;
- primera consulta y consultas repetidas;
- memoria residente;
- tamaño del paquete offline instalado;
- costo de bootstrap JSON real en Hermes;
- frecuencia de cada query;
- migración/versionado;
- comportamiento al incorporar dataset territorial;
- beneficio real de índices con volúmenes mayores.

Una estructura que mejora microbenchmarks pero aumenta ambigüedad de autoridad o mantenimiento no se aprueba.

## 12. Protocolo de auditoría

### AUDITORÍA

Se conserva una única cadena de autoridad. El benchmark compara dos superficies derivadas con la misma información y el mismo proceso host. La capa JSON actual sigue alineada con el motor canónico.

### INCONSISTENCIAS

No se detectó inconsistencia entre las 89 relaciones del Master exportado y las 88 relaciones activas del benchmark: corresponden a universos distintos y explícitos, total vs. computable.

Queda resuelta la tensión “SQLite está `OPEN` / existe SQLite”: el esquema final sigue abierto; el prototipo solo mide una alternativa.

### VACÍOS / OMISIONES

Permanecen `OPEN`:

- benchmark con Hermes + `expo-sqlite` en Android real;
- memoria residente comparada;
- impacto de datasets territoriales mucho mayores;
- esquema de observaciones/evidencia del usuario;
- estrategia de migraciones;
- una base vs. dos bases para reference/user data;
- FTS y geospatial.

### REDUNDANCIAS

`payload_json` duplica campos indexados de manera **intencional** dentro del prototipo para preservar información durante la exploración del esquema. No es diseño final.

El benchmark no crea una nueva base persistente ni un segundo índice JSON. Sus reportes viven en `build/` o como artifacts temporales de Actions.

## 13. Gate actual

```text
AI routing: PASS
compact query CLI: PASS
normalized JSON authority chain: PASS
JSON in-memory identification baseline: APPROVED
SQLite derived prototype: PASS
critical SQLite indexes: PASS
host JSON-vs-SQLite benchmark: PASS
migrate pilot identification engine to SQLite: NOT JUSTIFIED
SQLite final schema: OPEN
Android Hermes/expo-sqlite benchmark: NOT TESTED
user/field persistence architecture: OPEN
```

El benchmark host cierra solamente el gate de comparación en entorno de desarrollo. El siguiente gate de datos es medir la misma carga en Android real cuando exista una superficie ejecutable mínima con Hermes + `expo-sqlite`. Hasta entonces, el motor de identificación del piloto permanece sobre JSON canónico + índices en memoria.
