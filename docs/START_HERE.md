# Árboris — Empezar aquí

**Actualizado:** 17 septiembre 2026  
**Rama compartida:** `main`

Este documento es un router. No intenta resumir todo Árboris.

Para agentes de IA/código, leer primero `AGENTS.md`. Para consultas de datos, leer `data/README.md`.

## 1. Autoridad botánica

Fuente editorial/científica única:

```text
data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx
```

Flujo:

```text
Master Botánico 2.0
→ data/botanical/*.json
→ data/species/*.json
→ tools/canonical-identification/
→ runtime / UI / IA / arte
```

Regla operativa: para **leer y razonar**, preferir los JSON derivados; abrir el XLSX cuando haya que corregir, regenerar o verificar procedencia. Los JSON y fichas generadas no se corrigen manualmente.

## 2. Protocolo obligatorio

Antes de aprobar o consolidar desarrollo, aplicar `docs/DEVELOPMENT_MANUAL.md`:

```text
AUDITORÍA
INCONSISTENCIAS
VACÍOS / OMISIONES
REDUNDANCIAS
```

Mantener `OPEN` lo que aún no tenga evidencia o decisión suficiente.

## 3. Router por tarea

### Datos botánicos / identificación

1. `data/README.md`
2. `data/botanical/metadata.json`
3. dataset mínimo requerido en `data/botanical/`
4. una ficha en `data/species/` solo si la tarea es de una especie concreta
5. `docs/DATA_MODEL.md` para semántica conceptual
6. `docs/ARCHITECTURE.md` para límites entre datos, evidencia, motor e IA
7. `tools/canonical-identification/` si la tarea toca el motor

No cargar las seis fichas de `data/species/` para comparaciones: usar `species.json`, `characters.json` y `species_characters.json`.

### Producto / estado general

1. `README.md`
2. `docs/ROADMAP.md`
3. `docs/DEVELOPMENT_SYNC_2026-09-17.md` solo si se necesita continuidad reciente; es snapshot no normativo

### Arte de personajes

1. `docs/GRAPHIC_DIRECTION.md`
2. `docs/ART_STYLE_GUIDE.md`
3. registro relevante en `data/characters/`
4. asset aprobado correspondiente
5. ficha botánica/fotos reales solo cuando la decisión requiera evidencia morfológica

### Entorno / mapas

1. `docs/PILOT_ENVIRONMENT_VISUAL_CANON.md`
2. `docs/SPATIAL_MODEL.md`
3. `docs/TERRITORIAL_MAPPING_PROTOCOL.md`
4. `docs/MAP_TOPOLOGY_SYSTEM.md`
5. `docs/MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN.md`
6. `docs/ENVIRONMENT_ART_DIRECTION.md`
7. `docs/ART_STYLE_GUIDE.md`
8. `docs/ENVIRONMENT_PRODUCTION_SPEC.md`

Los documentos `*_AUDIT_*`, handoffs y snapshots sirven para trazabilidad; no desplazan a las fuentes normativas anteriores.

## 4. Bases espaciales vigentes

```text
TERRITORIO
Paisaje → Sector → Lugar → Unidad Espacial

DERIVACIÓN JUGABLE
Instancia Territorial
→ Navigation Contract
→ Camera Contract
→ Interaction / Learning Contract
→ Blockout
→ Prototipo visual

IMPLEMENTACIÓN
walkable envelope / celdas / tiles / objetos / renderer
```

`walkableEnvelope` es la autoridad geométrica de navegación. Celdas/tiles son derivaciones técnicas.

Para `IT-001 / MAP-001`:

```text
screen_up   = cordillera / interior / progresión
screen_down = entrada / retorno
worldCardinalMapping = OPEN
```

Secuencia territorial aprobada:

```text
entrada inferior
→ puente sobre Estero El Arrayán
→ puerta principal abierta
→ casa del conserje a la izquierda
→ camino principal
→ claro de picnic
→ interior / cordillera
```

El estero cruza bajo el puente, forma el giro visual en `L` en el umbral y post-umbral continúa a la derecha del camino y en nivel inferior.

## 5. Producción ambiental vigente

Base de prueba móvil:

```text
Android portrait-first
logicalViewport: 360 × H
H test range: 640–800
base: 360×640
high: 360×800
```

Es base de prueba, no resolución final irreversible.

Próximo gate ambiental: vertical slice real de producción con puente, puerta abierta, camino, estero en L, terraza/ladera, player proxy, oclusiones y pixel art evaluado a 1× lógico.

El concepto `MAP-001 v0.4b` está aprobado como visión espacial/compositiva del piloto; no fija el estilo gráfico final y no es evidencia territorial/botánica.

## 6. IDs

Botánica nueva:

```text
SP-001 … SP-006
CH-xxx
F-xxx
```

`SP001 … SP006` permanece por compatibilidad en archivos/runtime/arte históricos. No usarlo como nuevo namespace botánico.

## 7. Histórico / legado

No usar como autoridad vigente cuando contradiga fuentes actuales:

- `data/source/Base_botanica_Pokedex_flora_Master.xlsx`
- `data/source/Fichas_especies_arboris.xlsx`
- `data/botanical/legacy/`
- `docs/BOTANICAL_KEY_PILOT.md`
- documentos de auditoría/snapshot salvo para reconstruir decisiones

## 8. Validación

Desde raíz:

```powershell
npm.cmd test
npm.cmd run typecheck
```

Regeneración botánica solo cuando corresponda:

```powershell
npm.cmd run build:botanical
npm.cmd run verify:botanical
```

## 9. Regla de navegación

1. clasificar la tarea;
2. abrir el router mínimo;
3. leer solo las fuentes autoritativas necesarias;
4. evitar históricos, binarios y vistas denormalizadas salvo necesidad;
5. ejecutar pruebas pertinentes;
6. mantener separadas autoridad, derivación, hipótesis y arte.
