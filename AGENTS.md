# Árboris — routing para agentes

Este archivo es el mapa operativo mínimo para IA. No reemplaza las fuentes normativas ni científicas.

## 1. Regla de trabajo

Usar `main` como referencia compartida salvo que la tarea nombre otra rama.

Antes de consolidar una decisión, aplicar `docs/DEVELOPMENT_MANUAL.md` y responder explícitamente:

```text
AUDITORÍA
INCONSISTENCIAS
VACÍOS / OMISIONES
REDUNDANCIAS
```

No leer el repositorio completo por defecto. Clasificar la tarea y abrir solo la autoridad mínima necesaria.

## 2. Mapa simple del repositorio

```text
data/      datos, fuentes científicas, vistas derivadas y canon de personajes
docs/      documentación vigente + trazabilidad documental
tools/     herramientas vigentes de build, validación e identificación
species/   evidencia fotográfica de terreno; NO equivale a data/species/
archive/   prototipos y experimentos históricos; ignorar por defecto
.github/   CI e instrucciones de GitHub/Copilot
```

Para orientación humana usar `docs/README.md`. Para datos usar `data/README.md`. Para historia experimental usar `archive/README.md` solo cuando la tarea lo requiera.

## 3. Autoridad botánica

Fuente editorial/científica:

```text
data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx
```

Lectura normal de máquina:

```text
data/botanical/*.json
```

Lectura profunda de una especie:

```text
data/species/<especie>.json
```

No corregir manualmente `data/botanical/*.json` ni `data/species/*.json`. Corregir el Master y regenerar.

Para consultas puntuales, preferir:

```powershell
python tools/botanical-data/query_botanical.py species SP-001
python tools/botanical-data/query_botanical.py character CH-003
python tools/botanical-data/query_botanical.py relation SP-001 CH-003
python tools/botanical-data/query_botanical.py compare CH-003
```

Regla de contexto: una pregunta puntual debe producir una lectura puntual. No abrir las seis fichas `data/species/*.json` para una comparación transversal si las tablas normalizadas bastan.

## 4. Routing por tarea

### Identificación

Leer solo:

1. sección pertinente de `docs/ARCHITECTURE.md`;
2. `tools/canonical-identification/README.md`;
3. código/test específico necesario.

El conocimiento botánico vive en datos, no hardcodeado en el motor.

### Producto / roadmap

`README.md` → documento específico en `docs/` → `docs/ROADMAP.md` solo cuando se necesite estado/hito.

### Arte / personajes

`docs/GRAPHIC_DIRECTION.md` + `docs/ART_STYLE_GUIDE.md` → documento específico → `data/characters/`.

No tratar arte generado como evidencia botánica o territorial.

### Ambientes / mapas

Abrir únicamente la parte necesaria de esta cadena:

```text
PILOT_ENVIRONMENT_VISUAL_CANON
→ SPATIAL_MODEL
→ TERRITORIAL_MAPPING_PROTOCOL
→ MAP_TOPOLOGY_SYSTEM
→ MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN
→ ENVIRONMENT_ART_DIRECTION
→ ART_STYLE_GUIDE
→ ENVIRONMENT_PRODUCTION_SPEC
```

### Rendimiento / acceso a datos

Usar `docs/DATA_ACCESS_PERFORMANCE.md`. Los benchmarks host son evidencia direccional; la arquitectura Android final permanece sujeta a medición Android real.

## 5. IDs y contexto

IDs botánicos canónicos: `SP-001` … `SP-006`.

`SP001` … `SP006` existe solo por compatibilidad histórica/runtime. No crear nuevos registros botánicos con ese formato.

Preferir joins por ID. No completar decisiones `OPEN` mediante suposición.

No cargar por defecto:

- `archive/`;
- documentos `*_AUDIT_*`, `*_SNAPSHOT_*`, `*_SYNC_*`, `*_CLOSEOUT_*`, `*_WORKLOG_*`;
- imágenes/binarios;
- fuentes/provenance si la tarea no los requiere.

## 6. Validación

Desde la raíz:

```powershell
npm.cmd test
```

`npm.cmd run typecheck` solo es gate ejecutable cuando exista `tsconfig.json`.

Para regenerar botánica:

```powershell
npm.cmd run build:botanical
npm.cmd run verify:botanical
```

Regla final:

```text
route first
→ read minimum authority
→ change one source of truth
→ validate
→ audit
```
