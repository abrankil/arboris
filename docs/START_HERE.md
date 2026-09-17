# Árboris — Empezar aquí

**Actualizado:** 17 septiembre 2026  
**Rama de referencia compartida:** `main`

Este documento orienta a personas e IAs que llegan al repositorio sin contexto previo. No reemplaza la documentación técnica: indica qué leer, qué documentos gobiernan cada decisión y cuál es el gate vigente.

## 1. Regla principal

La fuente científica/editorial única del piloto es:

`data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx`

Flujo de autoridad botánica:

```text
Master Botánico 2.0
        ↓
data/botanical/
        ↓
data/species/
        ↓
tools/canonical-identification/
        ↓
consumidores: identificación, interfaz, IA y dirección de arte
```

Los JSON y fichas por especie son derivados reproducibles. No se editan para corregir botánica: la corrección entra primero al Master 2.0 y luego se regenera.

## 2. Protocolo obligatorio de desarrollo

Leer `docs/DEVELOPMENT_MANUAL.md` antes de revisar, aprobar o consolidar trabajo.

Toda revisión debe responder explícitamente:

```text
AUDITORÍA
INCONSISTENCIAS
VACÍOS / OMISIONES
REDUNDANCIAS
```

Un hallazgo crítico bloquea avance hasta resolución o aceptación explícita de dirección de proyecto.

El snapshot coordinado más reciente es `docs/DEVELOPMENT_SYNC_2026-09-17.md`. Es histórico/no normativo y sirve para retomar contexto; las fuentes normativas siguen siendo los documentos especializados.

## 3. Si trabajas en arte / entorno

Orden recomendado:

1. `docs/DEVELOPMENT_MANUAL.md`
2. `docs/GRAPHIC_DIRECTION.md`
3. `docs/PILOT_ENVIRONMENT_VISUAL_CANON.md`
4. `docs/SPATIAL_MODEL.md`
5. `docs/TERRITORIAL_MAPPING_PROTOCOL.md`
6. `docs/MAP_TOPOLOGY_SYSTEM.md`
7. `docs/MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN.md`
8. `docs/ENVIRONMENT_ART_DIRECTION.md`
9. `docs/ART_STYLE_GUIDE.md`
10. `docs/ENVIRONMENT_PRODUCTION_SPEC.md`
11. `docs/DEVELOPMENT_SYNC_2026-09-17.md` — snapshot de continuidad
12. `data/species/`, fotografías reales y `data/characters/` según la tarea.

Modelo de trabajo:

```text
qué es real
→ qué evidencia tengo
→ qué relaciones debo conservar
→ cómo se juega
→ cómo se ve
→ qué pruebo
```

Una decisión artística no modifica la botánica. Una imagen generada no constituye evidencia territorial ni botánica.

## 4. Arquitectura espacial vigente

No tratar territorio, juego e implementación como una sola jerarquía.

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

La autoridad geométrica de navegación es el `walkableEnvelope` continuo. Celdas y tiles son derivaciones técnicas.

El Master Territorial sigue siendo una intención arquitectónica; su formato final permanece `OPEN`.

## 5. Estado vigente de IT-001 / MAP-001

Unidades espaciales:

```text
UE-001 Umbral de acceso
UE-002 Corredor inicial
UE-003 Claro de picnic
```

Secuencia estructural aprobada:

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

- cruza el sector inferior bajo el puente;
- forma allí un giro visual en `L`;
- luego continúa hacia interior/cordillera;
- post-umbral queda a la derecha del camino y en nivel inferior;
- el descenso posterior hacia Santiago existe territorialmente, pero queda fuera del alcance actual.

No inferir cardinales geográficos de pantalla:

```text
screen_up   = cordillera / interior / progresión
screen_down = entrada / retorno
worldCardinalMapping = OPEN
```

`MAP-001 v0.3` pasó revisión estructural y visual. `MAP-001 v0.4b` tiene dirección conceptual y alineación con la visión del piloto aprobadas. El prototipo visual no es evidencia.

## 6. Lenguaje gráfico y producción móvil

Apariencia: `docs/ART_STYLE_GUIDE.md`.  
Composición territorial del piloto: `docs/PILOT_ENVIRONMENT_VISUAL_CANON.md`.  
Viewport/escalado/producción técnica: `docs/ENVIRONMENT_PRODUCTION_SPEC.md`.

Bases actuales:

```text
2.5D isométrico
pixel art de producción
terrazas/modularidad naturalizadas
mundo continuo
baja/media densidad visual
Android portrait-first
```

Base de viewport aprobada para pruebas:

```text
logicalViewport: 360 × H
H test range: 640–800
base: 360×640
intermediate: 360×720 / 360×780
high: 360×800
```

Es una base de producción para pruebas, no resolución final irreversible.

Siguen `OPEN`: resolución final, renderer, pathfinding, tamaño final de sprite, relación sprite/tile, tamaño de tile/chunk, escala métrica y adaptación landscape secundaria.

Los formatos `480×270` y `270×480` son históricos/transitorios y no gobiernan la composición móvil principal.

## 7. Próximo gate del frente ambiental

No corresponde otra ilustración conceptual completa.

El siguiente entregable es un vertical slice real de producción:

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

Debe comprobar legibilidad, ancho útil de la isometría portrait, oclusión, seams/repetición modular, safe areas, escalado y rendimiento/memoria en Android.

## 8. Si trabajas en desarrollo general

Orden recomendado:

1. `README.md`
2. `docs/DEVELOPMENT_MANUAL.md`
3. `docs/START_HERE.md`
4. `docs/ROADMAP.md`
5. `docs/HITO15_CLOSEOUT_2026-09-16.md`
6. `docs/ARCHITECTURE.md`
7. `docs/DATA_MODEL.md`
8. `docs/SPATIAL_MODEL.md` si la tarea toca mapas/escenarios
9. `data/botanical/metadata.json`
10. `data/botanical/`, `data/species/` y `tools/canonical-identification/`

Master 2.0, export canónico, validaciones, IDs, fichas por especie y motor canónico mínimo están cerrados. No implementar conocimiento botánico hardcodeado nuevo.

Para el frente espacial, no fijar por conveniencia tamaño de tile, escala metro/celda, renderer, pathfinding, geometría exacta ni colocación fina de especies sin el gate correspondiente.

## 9. Datos validados del piloto

- 6 especies.
- 24 caracteres botánicos totales.
- 19 caracteres activos/computables.
- 4 caracteres retirados.
- 1 carácter pendiente de revisión.
- 89 relaciones especie–carácter.
- 21 fuentes.
- 53 términos de glosario.
- 45 fotografías.
- 2 errores de modelo documentados.

Los nuevos componentes botánicos usan IDs canónicos `SP-001`…`SP-006`. Los IDs `SP001`…`SP006` permanecen por compatibilidad histórica en arte/runtime.

## 10. Archivos históricos que pueden confundir

No usar como autoridad vigente cuando contradigan fuentes actuales:

- `data/source/Base_botanica_Pokedex_flora_Master.xlsx`
- `data/source/Fichas_especies_arboris.xlsx`
- `data/botanical/legacy/species_pilot.json`
- `docs/BOTANICAL_KEY_PILOT.md`
- componentes legacy de clave/adaptador pendientes de retirada controlada.

`docs/SPATIAL_MODEL_AUDIT_2026-09-16.md` y `docs/DEVELOPMENT_SYNC_2026-09-17.md` son documentos históricos/de trazabilidad, no fuentes normativas.

## 11. Comprobación de la capa botánica y motor

Desde la raíz del repositorio:

```powershell
npm.cmd test
```

La salida canónica debe mantenerse reproducible. Las fichas de `data/species/` no se editan manualmente.

## 12. Regla para navegar el repositorio

Usar `main` como estado compartido de referencia. Las ramas de trabajo y experimentos no definen el estado vigente salvo que la tarea indique explícitamente trabajar sobre ellas.