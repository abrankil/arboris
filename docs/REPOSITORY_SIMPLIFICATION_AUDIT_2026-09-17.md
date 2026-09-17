# Árboris — Auditoría de simplificación del repositorio 2026-09-17

**Estado:** revisión de cambio estructural / validada en PR  
**Rama:** `refactor/repository-simplification-2026-09-17`  
**PR:** `#17` — `refactor: simplify repository structure`

## Objetivo

Reducir costo cognitivo para Alejandra, Álvaro y agentes de IA sin eliminar trazabilidad, alterar fuentes de verdad ni sacrificar validación.

La regla de diseño aplicada es:

```text
pocas entradas visibles
→ routing explícito
→ autoridad única por tema
→ histórico fuera del camino principal
→ validación automática antes de consolidar
```

## Cambios auditados

1. Los prototipos `integrated_identification/` y `vision_v01` … `vision_v04_bioclip` se preservan bajo `archive/`.
2. La raíz deja de presentar esos experimentos como frentes vigentes.
3. `archive/README.md` define el límite entre trabajo vigente e histórico.
4. `docs/README.md` funciona como mapa humano de documentación.
5. `docs/REPOSITORY_STRUCTURE.md` resume la estructura operativa en una vista simple.
6. `species/README.md` distingue evidencia fotográfica de `data/species/`, que contiene vistas JSON generadas.
7. `AGENTS.md`, `START_HERE.md` y `.github/copilot-instructions.md` se compactan como routers, evitando duplicar documentación normativa.

## Resultado estructural medible

Antes de esta simplificación, la raíz contenía 17 entradas visibles y 10 directorios de primer nivel, incluyendo cuatro generaciones `vision_v0*` y `integrated_identification/`.

Después del cambio, la raíz contiene 13 entradas visibles y 6 directorios de primer nivel:

```text
.github/
archive/
data/
docs/
species/
tools/
```

La reducción es de:

```text
entradas de raíz       17 → 13
 directorios de raíz    10 → 6
frentes históricos visibles en raíz  5 → 0
```

Esta mejora es de navegación y carga cognitiva. No reduce por sí sola el tamaño binario del historial Git: los blobs históricos se conservan deliberadamente para trazabilidad.

## AUDITORÍA

### Hallazgo

La raíz anterior mezclaba superficies vigentes con cuatro generaciones de experimentos de visión y un prototipo de identificación reemplazado.

### Impacto / riesgo

Una persona o agente nuevo debía decidir manualmente qué versión seguía vigente, aumentando lecturas innecesarias y el riesgo de continuar código histórico.

### Corrección aplicada

Los experimentos se movieron sin alterar su contenido a `archive/`; el código vigente continúa en `tools/`, los datos vigentes en `data/` y la evidencia fotográfica de terreno permanece temporalmente en `species/`.

### Validación

GitHub reconoció los movimientos de los prototipos como renames sin cambios de contenido. El PR `#17` ejecutó el CI sobre el head `2b590b63706c92ac76ce2f0084a8d5e14c398457`:

```text
workflow run: 35182449235
conclusion: SUCCESS

npm ci                              PASS
Expo dependency alignment           PASS
high/critical production audit      PASS
canonical tests                     PASS
TypeScript typecheck                SKIPPED — no tsconfig.json
```

### Decisión aprobada

`archive/` no es autoridad actual y no debe cargarse por defecto. La simplificación puede consolidarse porque las pruebas vigentes no detectaron regresiones.

## INCONSISTENCIAS

### `species/` vs `data/species/`

La similitud de nombres continúa existiendo físicamente, pero su semántica queda explícita:

```text
species/
→ evidencia fotográfica de terreno

data/species/
→ vistas JSON generadas por especie
```

Mover la evidencia fotográfica ahora podría romper rutas o scripts no auditados. Por eso no se fuerza una reorganización adicional en este cambio.

**Estado:** inconsistencia de naming mitigada; consolidación física futura `OPEN`.

No se detectan otras inconsistencias críticas introducidas por esta simplificación.

## VACÍOS / OMISIONES

Permanecen `OPEN`:

- auditoría completa de dependencias antes de renombrar/mover `species/`;
- reorganización física de documentos históricos dentro de `docs/` solo si una auditoría de enlaces demuestra que aporta valor suficiente;
- protección obligatoria de `main` con checks requeridos; la conexión disponible no expone una acción administrativa de escritura para branch protection/rulesets;
- medición específica del tiempo de trabajo humano de Alejandra y Álvaro después de la simplificación;
- gate TypeScript mientras no exista `tsconfig.json`.

Estos vacíos no bloquean el cambio actual porque no modifican fuentes de verdad ni runtime vigente.

## REDUNDANCIAS

Redundancias conservadas intencionalmente:

- `README.md`, `START_HERE.md`, `AGENTS.md` y `docs/README.md` tienen roles distintos: presentación, entrada mínima, routing de agentes y mapa humano de documentación;
- `docs/REPOSITORY_STRUCTURE.md` es un mapa corto de la estructura física, no una segunda autoridad normativa;
- `data/species/` sigue siendo una vista denormalizada regenerable;
- `archive/` conserva experimentos por trazabilidad.

No se añade ninguna nueva representación de datos científicos ni lógica duplicada.

## Gate de cierre

```text
revisión del diff                         PASS
separación vigente / histórico            PASS
preservación de contenido histórico       PASS
routing humano                             PASS
routing para IA                            PASS
CI                                         PASS
npm ci                                     PASS
Expo dependency alignment                  PASS
audit high/critical                        PASS
pruebas canónicas                          PASS
TypeScript typecheck                       NOT CONFIGURED / SKIPPED
protección de main                         OPEN
renombre físico de species/                OPEN
```

**Resultado general:** `PASS` para consolidar la simplificación en `main`.
