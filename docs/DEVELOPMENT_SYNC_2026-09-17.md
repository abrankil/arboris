# Árboris — Sincronización de desarrollo 2026-09-17

**Estado:** snapshot de coordinación / no normativo  
**Propósito:** registrar el estado compartido del desarrollo antes de sincronizar la rama espacial con `main`.

Este documento resume decisiones ya tomadas y gates vigentes. No reemplaza las fuentes normativas. Cuando exista conflicto, gobierna el documento de autoridad indicado en cada sección.

## 1. Protocolo de revisión

Autoridad: `docs/DEVELOPMENT_MANUAL.md`.

Toda revisión debe responder explícitamente:

```text
AUDITORÍA
INCONSISTENCIAS
VACÍOS / OMISIONES
REDUNDANCIAS
```

Los hallazgos críticos bloquean avance salvo aceptación explícita de dirección de proyecto.

## 2. Modelo espacial y territorial

Autoridades:

- `docs/SPATIAL_MODEL.md`
- `docs/TERRITORIAL_MAPPING_PROTOCOL.md`
- `docs/MAP_TOPOLOGY_SYSTEM.md`
- `docs/MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN.md`

Bases consolidadas:

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

La autoridad geométrica de navegación es el `walkableEnvelope` continuo. Las celdas y tiles son derivaciones técnicas, no la fuente territorial ni la forma obligatoria del mundo.

El estado de evidencia se registra por claim/rasgo/relación y se mantiene separado del estado de producción.

## 3. IT-001 / MAP-001 — Acceso Principal

Autoridad visual específica: `docs/PILOT_ENVIRONMENT_VISUAL_CANON.md`.

Unidades espaciales vigentes:

```text
UE-001 Umbral de acceso
UE-002 Corredor inicial
UE-003 Claro de picnic
```

Secuencia estructural:

```text
entrada inferior
→ puente sobre Estero El Arrayán
→ puerta principal abierta
→ casa del conserje a la izquierda
→ camino principal
→ claro de picnic
→ continuidad hacia interior / cordillera
```

Relación del estero:

- en el umbral cruza el sector inferior bajo el puente;
- allí forma un giro visual en `L`;
- después del giro continúa hacia el interior/cordillera;
- post-umbral se mantiene a la derecha del camino y en nivel inferior;
- su descenso posterior hacia Santiago se reconoce territorialmente, pero queda fuera del alcance actual de `MAP-001`.

No fijar cardinales geográficos de pantalla sin corroboración. Sigue vigente:

```text
screen_up   = cordillera / interior / progresión
screen_down = entrada / retorno
worldCardinalMapping = OPEN
```

## 4. Estado de MAP-001

`MAP-001 v0.3`:

```text
productionStatus: tested
visualReview: approved
```

`MAP-001 v0.4b`:

```text
conceptDirection: approved
pilotVisionAlignment: approved
productionStatus: visual_prototype
```

La aprobación de v0.4b corresponde a visión, composición y naturalización general. No convierte detalles generados en evidencia territorial o botánica.

Siguen `OPEN`, entre otros:

- bearing y métrica exactos del puente;
- geometría medida del giro del estero;
- footprint exacto del claro;
- escala métrica;
- especies/microhábitats concretos de los interaction slots;
- sprite final de exploración;
- renderer y pathfinding.

## 5. Lenguaje gráfico para producción

Autoridad de apariencia: `docs/ART_STYLE_GUIDE.md`.  
Autoridad técnica de escenarios: `docs/ENVIRONMENT_PRODUCTION_SPEC.md`.

Bases actuales:

```text
2.5D isométrico
pixel art de producción
terrazas y modularidad naturalizadas
mundo continuo, no islas flotantes
baja/media densidad visual deliberada
```

Los tiles cúbicos/prismáticos expresan modularidad y altura, pero no obligan a que el mundo final muestre cubos visibles.

Una imagen generada con apariencia pixelada es referencia; no demuestra pixel art de producción hasta existir a resolución lógica real y poder revisarse a 1×.

## 6. Base de viewport Android

Autoridad: `docs/ENVIRONMENT_PRODUCTION_SPEC.md`.

Nueva base de producción para pruebas:

```text
orientation: portrait-first
logicalViewport: 360 × H
H test range: 640–800
base test: 360×640
intermediate: 360×720 / 360×780
high test: 360×800
```

Motivo: 360 px de ancho permite escalas enteras directas en anchos físicos 720, 1080 y 1440 mediante 2×, 3× y 4×.

Esto es una base aprobada para pruebas, no la resolución final irreversible.

Siguen `OPEN`:

- resolución lógica definitiva;
- estrategia para dispositivos donde safe areas/insets impidan un múltiplo entero conveniente;
- tamaño final de sprite;
- relación sprite/tile;
- tamaño de tile/chunk;
- landscape secundario.

Los viewports `480×270` y `270×480` quedan como referencias históricas/transitorias y no gobiernan la composición móvil principal.

## 7. Próximo gate

No corresponde otra ilustración conceptual completa.

El próximo entregable debe ser un vertical slice real de producción:

```text
360×640 + 360×800
puente
puerta abierta
camino
estero en L
ladera / terraza
player proxy
oclusiones
pixel art evaluado a 1× lógico
```

Debe comprobar al menos:

- legibilidad del personaje;
- ancho útil de la isometría en portrait;
- lectura de camino/estero/laderas;
- oclusión;
- seams y repetición modular;
- safe areas;
- escalado 2×/3×/4× cuando corresponda;
- costo de render y memoria en Android.

## 8. Autoridad documental después de sincronizar

```text
DEVELOPMENT_MANUAL
→ protocolo de revisión

SPATIAL_MODEL
→ entidades y relaciones espaciales

TERRITORIAL_MAPPING_PROTOCOL
→ evidencia → instancia territorial

MAP_TOPOLOGY_SYSTEM
→ navegación y conectividad

MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN
→ pruebas estructurales

PILOT_ENVIRONMENT_VISUAL_CANON
→ composición y relaciones visuales de IT-001 / MAP-001

ART_STYLE_GUIDE
→ apariencia gráfica

ENVIRONMENT_PRODUCTION_SPEC
→ viewport, escalado y producción técnica de escenarios

SPATIAL_MODEL_AUDIT_2026-09-16
→ historial de decisiones; no normativo
```

Este snapshot también es histórico/no normativo y puede quedar obsoleto a medida que avance el proyecto.