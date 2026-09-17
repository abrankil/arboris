# Árboris — Estrategia de rendimiento de acceso a datos

**Estado:** operativo para acceso de IA; arquitectura SQLite física todavía `OPEN`  
**Fecha:** 17 septiembre 2026  
**Alcance:** datos botánicos canónicos, consultas de agentes y preparación del runtime offline-first.

## 1. Objetivo

Reducir el costo de recuperación, lectura y razonamiento sobre los datos de Árboris sin crear una segunda fuente de verdad.

La optimización distingue dos consumidores con necesidades diferentes:

```text
IA / GitHub / revisión humana
→ JSON legible, consultas pequeñas, trazabilidad

runtime móvil
→ persistencia e índices locales eficientes
```

SQLite no reemplaza los JSON canónicos como superficie de inspección para agentes. El futuro SQLite será un artefacto runtime derivado y regenerable.

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

query_botanical.py / futuro SQLite
= superficies de acceso derivadas
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

Usar `species.json` o:

```powershell
python tools/botanical-data/query_botanical.py species SP-001
```

### Q2 — definición de carácter

Usar `characters.json` o:

```powershell
python tools/botanical-data/query_botanical.py character CH-003
```

### Q3 — relación especie × carácter

Ruta preferida para una consulta puntual:

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
2. pedir una relación o carácter específico cuando la pregunta sea puntual;
3. usar comparación normalizada para varias especies;
4. cargar fuentes o fotos solo bajo demanda;
5. evitar `data/species/*.json` múltiples en una misma consulta;
6. evitar archivos históricos y binarios salvo necesidad explícita.

El CLI devuelve JSON compacto por defecto. `--pretty` queda disponible cuando la lectura humana lo requiera.

## 6. Índices en memoria actuales

El motor canónico ya construye al cargar:

```text
speciesById
charactersById
relationsBySpecies
```

Estas estructuras permiten lookup directo por ID en el proceso de identificación. No se justifica introducir una base de índices persistentes adicional para el piloto mientras el dataset normalizado siga en este orden de magnitud.

Un índice persistente nuevo solo debe añadirse si una medición demuestra que reduce de forma material tiempo de carga, memoria o payload.

## 7. Diseño físico SQLite — estado

El esquema SQLite definitivo continúa `OPEN`, conforme a `docs/DATA_MODEL.md`.

La optimización actual establece únicamente requisitos de acceso e índices recomendados para cuando se implemente el esquema físico.

### 7.1 Tablas de referencia mínimas candidatas

```text
species
characters
species_characters
species_character_states
sources
photos
model_errors
```

`species_character_states` es recomendable para evitar depender de arrays JSON al filtrar candidatos por estado.

Esquema conceptual candidato:

```sql
species(
  species_id TEXT PRIMARY KEY,
  ...
)

characters(
  character_id TEXT PRIMARY KEY,
  ...
)

species_characters(
  species_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  source_id TEXT,
  ...,
  PRIMARY KEY (species_id, character_id)
)

species_character_states(
  species_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  state TEXT NOT NULL,
  PRIMARY KEY (species_id, character_id, state)
)
```

Esto es una propuesta de implementación, no una nueva fuente de datos.

### 7.2 Índices recomendados

El PK compuesto de `species_characters` cubre consultas que comienzan por `species_id`.

Para consultas transversales por carácter:

```sql
CREATE INDEX idx_species_characters_character
ON species_characters(character_id, species_id);
```

Para filtrado de candidatos por estado:

```sql
CREATE INDEX idx_species_character_states_lookup
ON species_character_states(character_id, state, species_id);
```

Para evidencia fotográfica por especie/individuo:

```sql
CREATE INDEX idx_photos_species
ON photos(species_id);

CREATE INDEX idx_photos_individual
ON photos(individual_id);
```

Para errores conocidos por especie real:

```sql
CREATE INDEX idx_model_errors_species
ON model_errors(species_id_real);
```

No crear índices por defecto sobre campos de baja cardinalidad como `estado_piloto`, `confianza` o `poder_diagnostico` sin un perfil de consultas que lo justifique.

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

## 10. Medición antes de optimizar

Antes de introducir cachés persistentes, materialized views o nuevos índices, medir al menos:

- tiempo de apertura/carga en Android real;
- tiempo de primera consulta;
- memoria residente;
- tamaño del paquete offline;
- frecuencia de cada query;
- costo de regeneración/migración;
- beneficio real del índice mediante `EXPLAIN QUERY PLAN` cuando SQLite exista.

Una estructura que mejora microbenchmarks pero aumenta ambigüedad de autoridad o mantenimiento no se aprueba.

## 11. Gate de esta optimización

```text
AI routing: implemented
compact query CLI: implemented
normalized JSON remains authority-derived: preserved
persistent duplicate query index: not introduced
SQLite physical schema: OPEN
SQLite index contract: proposed for later validation
```

El siguiente gate de datos será implementar un prototipo SQLite derivado **solo cuando una funcionalidad runtime del piloto necesite persistencia/consulta local real**. Hasta entonces, JSON normalizado + CLI compacto es la ruta de menor costo y menor riesgo.
