# Árboris — Auditoría de simplificación del repositorio 2026-09-17

**Estado:** revisión de cambio estructural / no normativo  
**Rama:** `refactor/repository-simplification-2026-09-17`

## Objetivo

Reducir costo cognitivo para Alejandra, Álvaro y agentes de IA sin eliminar trazabilidad ni crear nuevas fuentes de verdad.

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
5. `species/README.md` distingue evidencia fotográfica de `data/species/`, que contiene vistas JSON generadas.
6. `AGENTS.md`, `START_HERE.md` y `.github/copilot-instructions.md` se compactan como routers, evitando duplicar documentación normativa.

## AUDITORÍA

### Hallazgo

La raíz anterior mezclaba superficies vigentes con cuatro generaciones de experimentos de visión y un prototipo de identificación reemplazado.

### Impacto / riesgo

Una persona o agente nuevo debía decidir manualmente qué versión seguía vigente, aumentando lecturas innecesarias y riesgo de continuar código histórico.

### Corrección aplicada

Los experimentos se mueven sin alterar su contenido a `archive/`; el código vigente continúa en `tools/` y los datos vigentes en `data/`.

### Decisión

`archive/` no es autoridad actual y no debe cargarse por defecto.

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
- reorganización física de documentos históricos dentro de `docs/` si el costo de navegación lo justifica;
- protección obligatoria de `main` con checks requeridos; el conector usado para esta sesión no expone una acción administrativa de escritura para branch protection/rulesets;
- medición específica del tiempo de trabajo humano de Alejandra y Álvaro después de la simplificación.

Estos vacíos no bloquean el cambio actual porque no modifican fuentes de verdad ni runtime vigente.

## REDUNDANCIAS

Redundancias conservadas intencionalmente:

- `README.md`, `START_HERE.md`, `AGENTS.md` y `docs/README.md` tienen roles distintos: presentación, entrada mínima, routing de agentes y mapa humano de documentación;
- `data/species/` sigue siendo una vista denormalizada regenerable;
- `archive/` conserva experimentos por trazabilidad.

No se añade ninguna nueva representación de datos científicos ni lógica duplicada.

## Gate de validación

Antes de consolidar en `main`:

```text
revisión del diff
→ PR
→ CI
→ npm ci
→ Expo dependency alignment
→ audit high/critical
→ pruebas canónicas
→ merge solo con PASS
```

Si el CI falla por rutas afectadas por los movimientos, el cambio se considera `REVISE` y no debe consolidarse.
