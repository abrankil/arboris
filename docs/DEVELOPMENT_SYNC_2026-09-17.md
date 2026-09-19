# Árboris — Sincronización de desarrollo 2026-09-17

**Estado:** snapshot de coordinación / no normativo  
**Propósito:** registrar el estado compartido del desarrollo ya sincronizado en `main`, los gates vigentes y el cierre de la fase de optimización de acceso a datos para agentes.

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

La aprobación de v0.4b corresponde a visión espacial, composición, relaciones territoriales y naturalización general. No convierte detalles generados en evidencia territorial o botánica y **no fija todavía el estilo gráfico final**.

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

### Estado de las muestras visuales recientes

La muestra de vertical slice aprobada por Alejandra sirve como **referencia de trabajo para composición, lectura espacial y descomposición de producción**, pero no representa el estilo gráfico final que se busca para Árboris.

La auditoría de la muestra de producción posterior dio resultado general `REVISE`:

```text
territorial sequence: PASS
stream L-shape: PASS
bridge placement: PASS
main-route readability: PASS
2.5D direction: PASS

gate state: REVISE — debe leerse abierta
house immediacy: REVISE minor
pixel-art production validation: NOT TESTED
tile seams/repetition: NOT TESTED
occlusion system: NOT TESTED
botanical fidelity: NOT VALIDATED
waterfall geometry: PROVISIONAL
```

Esto no invalida la visión aprobada. Define qué debe comprobar el siguiente vertical slice antes de producir assets finales.

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

Motivo: 360 px de ancho permite escalas enteras directas en anchos físicos 720, 1080 y 1440 mediante 2×, 3× y 4× antes de considerar insets/safe areas.

Esto es una base aprobada para pruebas, no la resolución final irreversible.

Siguen `OPEN`:

- resolución lógica definitiva;
- estrategia para dispositivos donde safe areas/insets impidan un múltiplo entero conveniente;
- tamaño final de sprite;
- relación sprite/tile;
- tamaño de tile/chunk;
- landscape secundario.

Los viewports `480×270` y `270×480` quedan como referencias históricas/transitorias y no gobiernan la composición móvil principal.

## 7. Próximo gate visual

No corresponde otra ilustración conceptual completa.

El próximo entregable visual debe ser un vertical slice real de producción:

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

DATA_ACCESS_PERFORMANCE
→ estrategia y decisiones de rendimiento de datos

OPTIMIZATION_CLOSURE_SYNC_2026-09-17
→ snapshot de evidencia reproducible del cierre de optimización; no normativo

SPATIAL_MODEL_AUDIT_2026-09-16
→ historial de decisiones; no normativo
```

Este snapshot también es histórico/no normativo y puede quedar obsoleto a medida que avance el proyecto.

## 9. Estado de sincronización Git

`main` es la única rama compartida de referencia para nuevas decisiones.

`art/spatial-model-audit-2026-09-16` se conserva como rama histórica y debe mantenerse alineada con `main`, sin volver a operar como segunda fuente de verdad.

Las imágenes generadas durante exploración visual no se promueven automáticamente a assets canónicos ni a evidencia.

## 10. Cierre de auditoría territorial/documental previo

El cierre territorial/documental anterior permanece válido como historial, pero sus SHA exactos quedaron superados por la fase de optimización de datos posterior.

Continúan vigentes sus conclusiones:

```text
AUDITORÍA
PASS

INCONSISTENCIAS
La aprobación conceptual del piloto y el estilo gráfico final permanecen separados.

VACÍOS / OMISIONES
GitHub no certifica archivos locales sin commit en computadores personales.
Los prototipos visuales no promovidos permanecen fuera del canon de assets.

REDUNDANCIAS
La rama histórica es redundante funcionalmente y se conserva solo por trazabilidad.
```

## 11. Cierre de optimización de acceso a datos y agentes

Evidencia completa: `docs/OPTIMIZATION_CLOSURE_SYNC_2026-09-17.md`.

Benchmark reproducible medido en GitHub Actions:

```text
benchmark run: 35179413141
commit medido: f464d0137557adc4e8663c38399fa8ced132526b
resultado: SUCCESS

CI run: 35179413121
resultado: SUCCESS
```

Prueba de routing transversal `CH-003`:

```text
lectura amplia de 6 fichas       246,702 bytes
ruta normalizada                  55,284 bytes
resultado compacto                 1,174 bytes

reducción broad → normalized       4.462x
reducción broad → compact result 210.138x

parse + query broad median        1,238.426 µs
parse + query normalized median     324.864 µs
speedup host observado              3.812x
```

Estos números prueban reducción de costo de recuperación y procesamiento host. No constituyen una medición directa de velocidad privada de pensamiento de un modelo.

La misma corrida volvió a confirmar el patrón del benchmark JSON vs SQLite: SQLite es más barato para apertura + primera consulta host; JSON + índices en memoria sigue siendo sustancialmente más rápido en el loop caliente del pequeño dataset piloto.

Decisión de cierre:

```text
AGENTS.md routing                        PASS / CLOSED
compact botanical query CLI              PASS / CLOSED
normalized cross-species read path        PASS / CLOSED
AI routing host benchmark                 PASS / CLOSED
JSON-vs-SQLite host benchmark             PASS / CLOSED
canonical CI after optimizations          PASS / CLOSED
pilot engine JSON + in-memory indexes     APPROVED BASELINE
SQLite migration for pilot engine         NOT JUSTIFIED
Android Hermes/expo-sqlite benchmark      OPEN
```

El siguiente trabajo de rendimiento requiere una superficie Android ejecutable o una nueva necesidad real de escala. No corresponde añadir más índices, formatos o bases por anticipación.
