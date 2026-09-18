# ASC v0.2 — extensión aditiva del contrato de implementación ejecutable

**Estado:** especificación de implementación v0.2
**Autoridad superior:** [`ARBORIS_SCENE_COMPILER.md`](ARBORIS_SCENE_COMPILER.md)
**Base:** [`ASC_V0_1_EXECUTABLE_SPEC.md`](ASC_V0_1_EXECUTABLE_SPEC.md)
**Ámbito:** extensión opcional del tramo `compile-only` de ASC.

## 1. Propósito

ASC v0.2 **extiende** ASC v0.1 de forma aditiva y retrocompatible. No lo sustituye ni redefine su significado.

Este documento describe **únicamente** lo que v0.2 agrega. Para el núcleo de 14 claves (`version`, `executionMode`, `testId`, `objective`, `authorizedSources`, `structuralContract`, `mandatoryRelations`, `open`, `doNotInfer`, `prohibited`, `artisticFreedom`, `cameraFormat`, `readingPriorities`, `validationCriteria`), la autoridad sigue siendo `ASC_V0_1_EXECUTABLE_SPEC.md`: v0.2 no las reproduce ni las reinterpreta.

```text
autoridad + evidencia válidas
→ contrato de entrada preparado (v0.1 o v0.2)
→ ASC v0.1 / ASC v0.2
→ prompt ASC determinista
```

## 2. Versionado

Un contrato declara su versión mediante la clave `version`, ya obligatoria en v0.1:

- `version: "0.1"` → tramo v0.1, sin cambios de comportamiento respecto de `ASC_V0_1_EXECUTABLE_SPEC.md`.
- `version: "0.2"` → tramo v0.2: las 14 claves core siguen siendo obligatorias con las mismas reglas, y se habilitan además hasta cuatro claves nuevas, todas opcionales.
- Ausencia de `version`: falla exactamente como en v0.1 (`missing required key(s)` incluye `version`). No existe una versión por defecto.
- Versión no reconocida (cualquier valor distinto de `"0.1"` y `"0.2"`): se rechaza a través del tramo v0.1, con el error `version must be "0.1"`.
- Una clave exclusiva de v0.2 presente en un contrato con `version: "0.1"` se rechaza como `unknown top-level key(s)`, exactamente igual que cualquier otra clave desconocida en v0.1.

El compilador no crea dos implementaciones independientes: la validación y el renderizado de las 14 claves core se comparten entre ambos tramos; v0.2 únicamente añade validadores y secciones de salida condicionales a las cuatro claves nuevas.

## 3. Claves nuevas (todas opcionales)

Ninguna de estas claves es obligatoria. Un contrato v0.2 que no declare ninguna compila de forma idéntica a un contrato v0.1 equivalente, salvo el valor de `version`.

### 3.1 `bootstrapAuthority`

Declara que un documento actúa como puerta de entrada (bootstrap) que remite a una autoridad canónica, sin competir semánticamente con ella.

```json
"bootstrapAuthority": {
  "bootstrapDocument": "CLAUDE.md",
  "canonicalAuthority": "docs/ARBORIS_SCENE_COMPILER.md"
}
```

Campos (ambos obligatorios cuando la clave está presente, objeto cerrado):

- `bootstrapDocument`: string no vacío.
- `canonicalAuthority`: string no vacío.

Errores: `bootstrapAuthority must be a JSON object`, `bootstrapAuthority: unknown key(s): ...`, `bootstrapAuthority: missing key(s): ...`, `bootstrapAuthority.bootstrapDocument must be a non-empty string`, `bootstrapAuthority.canonicalAuthority must be a non-empty string`.

Salida:
```text
[BOOTSTRAP AUTHORITY]
bootstrap: CLAUDE.md
canonical: docs/ARBORIS_SCENE_COMPILER.md
```

Ausente: la sección se omite.

### 3.2 `taskBaseline`

Declara qué estado se captura antes de una tarea, qué condiciones invalidan esa captura, y qué acción corresponde cuando ocurre la invalidación. Las tres partes forman una sola capacidad: la invalidación no es una capacidad separada.

```json
"taskBaseline": {
  "capture": ["repositoryRoot", "branch", "head", "gitOperation", "staged", "unstaged", "untracked", "unmerged"],
  "invalidateOn": ["unexpectedFileChange", "branchChanged"],
  "onInvalidation": { "action": "stop_and_recapture" }
}
```

Campos (los tres obligatorios cuando la clave está presente, objeto cerrado):

- `capture`: array de strings no vacíos, con al menos un elemento.
- `invalidateOn`: array de strings no vacíos, con al menos un elemento.
- `onInvalidation`: objeto cerrado con únicamente `action`; `action` debe ser uno de `"stop"` o `"stop_and_recapture"`.

Errores: `taskBaseline must be a JSON object`, `unknown key(s)`, `missing key(s)`, `taskBaseline.capture must contain at least one item`, `taskBaseline.capture[i] must be a non-empty string`, `taskBaseline.invalidateOn must contain at least one item`, `taskBaseline.invalidateOn[i] must be a non-empty string`, `taskBaseline.onInvalidation must be a JSON object`, `taskBaseline.onInvalidation.action must be one of "stop", "stop_and_recapture"`.

Salida:
```text
[TASK BASELINE — CAPTURE]
- repositoryRoot
- branch
...

[TASK BASELINE — INVALIDATE ON]
- unexpectedFileChange
- branchChanged

[TASK BASELINE — ON INVALIDATION]
action: stop_and_recapture
```

Ausente: las tres secciones se omiten.

El conjunto de acciones válidas (`stop`, `stop_and_recapture`) es cerrado para esta versión de ASC v0.2. Ampliarlo es, en sí mismo, un cambio de contrato que requiere el mismo protocolo de cambio que cualquier otra ampliación de ASC.

### 3.3 `stateMachine`

Declara estados y transiciones entre ellos, incluyendo la condición lógica/técnica (`condition`) y la autorización explícita (`authorization`) necesarias para avanzar.

```json
"stateMachine": {
  "states": [
    { "id": "S2", "name": "IMPLEMENT" },
    { "id": "S3", "name": "VALIDATE" }
  ],
  "transitions": [
    { "source": "S2", "target": "S3" },
    { "source": "S3", "target": "S2", "condition": "validation_failed" },
    { "source": "S3", "target": "S2", "condition": "audit_findings_require_rework", "authorization": "explicit_stage_authorization" }
  ]
}
```

Campos (ambos obligatorios cuando la clave está presente, objeto cerrado):

- `states`: array con al menos un elemento; cada uno `{ id, name }`, ambos strings no vacíos; `id` únicos entre todos los estados.
- `transitions`: array, puede ser `[]`; cada elemento `{ source, target, condition?, authorization? }`. `source` y `target` son obligatorios (strings no vacíos) y deben referenciar un `id` declarado en `states`. `condition` y `authorization` son opcionales de forma independiente; cuando están presentes deben ser strings no vacíos.

**Los ciclos están permitidos.** Una transición puede apuntar a un estado ya alcanzable (p. ej. `IMPLEMENT -> VALIDATE -> IMPLEMENT`); no existe ninguna regla de aciclicidad ni un indicador `allowCycles`.

**Duplicados:** dos transiciones se consideran duplicadas únicamente cuando coinciden exactamente en `source`, `target`, `condition` (o su ausencia) y `authorization` (o su ausencia). Dos transiciones con el mismo `source`/`target` pero distinto `condition` y/o `authorization` no son duplicadas y ambas son válidas.

Errores: `stateMachine must be a JSON object`, `unknown key(s)`, `stateMachine.states must contain at least one item`, `stateMachine.states[i] must be a JSON object with id and name`, `stateMachine.states[i].id/.name must be a non-empty string`, `stateMachine.states contains duplicate id "<id>"`, `stateMachine.transitions must be an array`, `stateMachine.transitions[i] must be a JSON object with source and target`, `stateMachine.transitions[i]: unknown key(s)`, `stateMachine.transitions[i].source/.target/.condition/.authorization must be a non-empty string`, `stateMachine.transitions[i] references unknown state id "<id>"`, `stateMachine.transitions contains a duplicate transition (...)`.

Salida:
```text
[STATE MACHINE]
- S2 IMPLEMENT
- S3 VALIDATE

[STATE MACHINE TRANSITIONS]
- S2 -> S3
- S3 -> S2 (condition: validation_failed)
- S3 -> S2 (condition: audit_findings_require_rework; authorization: explicit_stage_authorization)
```

Ausente: ambas secciones se omiten. Si `transitions` es `[]`, la segunda sección muestra `- NONE DECLARED`.

### 3.4 `stagedContentEquivalence`

Declara la correspondencia esperada entre el contenido validado y el contenido preparado para commit, distinguiendo el tipo de cambio por entrada.

```json
"stagedContentEquivalence": {
  "entries": [
    { "path": "tools/asc/compile_asc.mjs", "operation": "modified" },
    { "path": "docs/NEW_DOC.md", "operation": "added" },
    { "path": "old/module.mjs", "operation": "deleted" },
    { "path": "new/module.mjs", "operation": "renamed", "from": "legacy/module.mjs" }
  ],
  "requireNoUnstagedDivergence": true
}
```

Campos (ambos obligatorios cuando la clave está presente, objeto cerrado):

- `entries`: array, puede ser `[]`. Cada elemento `{ path, operation, from? }`. `path` y `operation` son obligatorios. `operation` debe ser uno de `"added"`, `"modified"`, `"deleted"`, `"renamed"`. `from` es obligatorio únicamente cuando `operation` es `"renamed"`, y se rechaza explícitamente si aparece con cualquier otra operación.
- `requireNoUnstagedDivergence`: booleano, obligatorio.

Convención: para `added`/`modified`/`deleted`, `path` es la ruta afectada. Para `renamed`, `path` es la ruta nueva y `from` la ruta anterior.

Errores: `stagedContentEquivalence must be a JSON object`, `unknown key(s)`, `missing key(s)`, `stagedContentEquivalence.entries must be an array`, `stagedContentEquivalence.entries[i] must be a JSON object`, `stagedContentEquivalence.entries[i]: unknown key(s)`, `stagedContentEquivalence.entries[i].path/.operation must be a non-empty string`, `stagedContentEquivalence.entries[i].operation must be one of "added", "modified", "deleted", "renamed"`, `stagedContentEquivalence.entries[i].from is required when operation is "renamed"`, `stagedContentEquivalence.entries[i].from must not be present when operation is "<operation>"`, `stagedContentEquivalence.requireNoUnstagedDivergence must be a boolean`.

Salida:
```text
[STAGED CONTENT EQUIVALENCE — ENTRIES]
- modified: tools/asc/compile_asc.mjs
- added: docs/NEW_DOC.md
- deleted: old/module.mjs
- renamed: new/module.mjs (from: legacy/module.mjs)

[STAGED CONTENT EQUIVALENCE — REQUIRE NO UNSTAGED DIVERGENCE]
true
```

Ausente: ambas secciones se omiten. Si `entries` es `[]`, la primera sección muestra `- NONE DECLARED`.

No se usa el nombre `stagedEquivalence` en ninguna parte del código, la documentación ni los tests: el nombre canónico es `stagedContentEquivalence`.

## 4. Retrocompatibilidad

- Ningún contrato `version: "0.1"` existente cambia de comportamiento: el mismo código de validación y de renderizado de las 14 claves core se ejecuta sin modificación para ambas versiones.
- Las cuatro claves de v0.2 nunca son obligatorias, ni bajo `version: "0.2"`.
- La ausencia de cualquiera de las cuatro claves omite su(s) sección(es) por completo; no existe ningún valor por defecto que sustituya una clave ausente.
- Un contrato `version: "0.1"` que use cualquiera de las cuatro claves se rechaza de la misma forma que cualquier otra clave desconocida en v0.1.

## 5. Fuera de alcance de v0.2

ASC v0.2 no amplía nada más allá de las cuatro claves descritas en la sección 3. Sigue sin implementar: resolución automática de autoridades, evaluación de suficiencia de evidencia, extracción automática desde imágenes/mapas/PDFs, cierre de `OPEN`, ejecución de modelos generativos, ni ningún elemento listado como `OPEN` en la sección 9 de `ASC_V0_1_EXECUTABLE_SPEC.md`.

## 6. Ubicación en el repositorio

Sin cambios respecto de v0.1:

```text
tools/asc/
├── README.md
├── compile_asc.mjs
├── compile_asc.test.mjs
└── fixtures/
    └── minimal-contract.json
```

No se introduce ningún fixture nuevo: los contratos v0.2 de prueba se construyen en `compile_asc.test.mjs` a partir del fixture v0.1 existente.
