# ASC — Piloto de viñeta (Estero El Arrayán) — registro de sesión

**Fecha:** 2026-09-21
**Estado:** registro de un ejercicio piloto de compilación/generación ASC. No es una decisión de canon, no otorga aprobación artística, no modifica ASC v0.1.
**Autoridad normativa:** `docs/ARBORIS_SCENE_COMPILER.md`, `docs/ASC_V0_1_EXECUTABLE_SPEC.md`, `docs/ASC_PROJECT_BOUNDARY.md`.
**Ámbito:** documentar el ciclo de prueba realizado en sesión (brief → contrato → 3 iteraciones → auditorías), para que no se pierda al cerrar la sesión.

## 1. Propósito de este documento

Este documento **no propone un cambio de ASC, ni cierra ninguna decisión OPEN, ni constituye aprobación artística**. Registra un ejercicio piloto realizado íntegramente en modo `compile-only` + ejecución externa manual, para dejar trazabilidad de:

- qué se probó y por qué;
- qué contratos se usaron;
- qué resultados se obtuvieron;
- qué se auditó y con qué resultado;
- qué queda `OPEN` o `UNRESOLVED`.

## 2. Relación con trabajo existente

```text
Territorio: mismo que IT-001/MAP-001 (Estero El Arrayán, Santuario El Arrayán).
Relación con MAP-001-ASC-MAPPING-0021 v2.1: NINGUNA.
Este piloto NO continúa, NO revisa y NO reemplaza v2.1.
Es un experimento acotado e independiente, limitado a un fragmento del
cauce, sin pretensión de resolver el gate de "instrumentación del
ejecutor" que sigue abierto para MAP-001.
```

## 3. Brief (resumen, basado en `SCENE_REFERENCE_BRIEF_TEMPLATE.md`)

- `sceneId`: `ASC-PLAY-VIGNETTE-001`
- nombre de trabajo: Viñeta del Estero El Arrayán (fragmento acotado)
- uso previsto: prueba piloto ASC (compile-only → generar con ASC), no producción final
- ecosistema: bosque esclerófilo mediterráneo andino, ecosistema P41, variante de cauce/ribera
- zona geográfica: Santuario de la Naturaleza El Arrayán (ex Fundo Los Nogales), sector Estero El Arrayán, `-33.325461, -70.456750`
- referencias: `ENV-0016`, `ENV-0037`, `ENV-0018` (`evidence`, `core`), `ENV-0003` (`interpretation`, ecológico regional)
- exclusión: sin logo ni referencia canónica de marca

### Estado real de la aprobación artística

**Importante para trazabilidad:** en esta sesión, el usuario declaró el brief "aprobado" en el chat. Esa declaración **no fue verificada de forma independiente como decisión artística de Álvaro** — no hay registro de que él haya revisado el brief. Este documento **no debe leerse como que el piloto tiene aprobación artística real**. La aprobación artística sigue, a todos los efectos prácticos, `OPEN` hasta que Álvaro la confirme directamente.

## 4. Contrato piloto — ASC-PLAY-VIGNETTE-001

```json
{
  "version": "0.1",
  "executionMode": "compile-only",
  "testId": "ASC-PLAY-VIGNETTE-001",
  "objective": "Compilar el prompt ASC piloto para el fragmento acotado del Estero El Arrayan (vinieta), a partir del brief aprobado, sin relacion con MAP-001-ASC-MAPPING-0021 v2.1.",
  "authorizedSources": [
    "docs/references/environments/manifest.csv#ENV-0016",
    "docs/references/environments/manifest.csv#ENV-0037",
    "docs/references/environments/manifest.csv#ENV-0018",
    "docs/references/environments/manifest.csv#ENV-0003"
  ],
  "structuralContract": [
    "Cauce encajonado con pared rocosa en un lado y vegetacion de ribera densa en el opuesto.",
    "Piso de bosque esclerofilo con hojarasca visible en al menos un plano.",
    "Variacion de energia hidraulica: al menos un tramo de agua calma y uno de rapido/pequena caida."
  ],
  "mandatoryRelations": [
    "El cauce y la vegetacion de ribera deben ser reconocibles como el mismo sistema territorial en ambos tramos representados.",
    "La relacion agua-roca-vegetacion debe preservarse tal como aparece en las referencias core."
  ],
  "open": [
    "Identificacion exacta de especies visibles.",
    "Vinculo con la fuente botanica maestra (botanicalSourceRef).",
    "Tratamiento de la infraestructura visible (cable, tuberia, caja verde): representar u omitir.",
    "Relacion exacta de este fragmento con el recorrido completo de IT-001/MAP-001."
  ],
  "doNotInfer": [
    "No inferir especies no confirmadas en las referencias.",
    "No inferir geometria medida, escala ni distancias.",
    "No inferir continuidad ni relacion estructural con MAP-001-ASC-MAPPING-0021 v2.1.",
    "No inferir construcciones o infraestructura adicional no visible en las referencias."
  ],
  "prohibited": [
    "No incluir el logo de Arboris ni su referencia canonica de marca.",
    "No presentar el resultado generativo como evidencia territorial o botanica.",
    "No presentar este piloto como continuacion, revision o reemplazo de MAP-001 v2.1."
  ],
  "artisticFreedom": [],
  "cameraFormat": [],
  "readingPriorities": [
    "Priorizar la relacion agua-roca-vegetacion como rasgo estructural.",
    "Priorizar la variacion de energia hidraulica entre los dos tramos del cauce."
  ],
  "validationCriteria": [
    "El mismo input produce exactamente el mismo prompt.",
    "Los elementos OPEN permanecen explicitos en la salida.",
    "El prompt no menciona el logo ni la referencia canonica de marca.",
    "El prompt no establece relacion con MAP-001 v2.1."
  ]
}
```

### Prueba de compilación

- Determinismo: **PASS** (dos corridas de `npm run compile:asc`, output idéntico).
- Gate v0.2: **no disparado** — el esquema v0.1 fue suficiente sin modificación.

### Resultado generativo (GPT, ejecución manual externa, sin instrumentación)

Imagen única: cauce encajonado, pared rocosa a la derecha, vegetación densa a la izquierda, rápido/pequeña caída desembocando en un pozón calmo, hojarasca en primer plano.

| Criterio | Resultado |
|---|---|
| `structuralContract` | PASS visual |
| `mandatoryRelations` | PARTIAL — el ejecutor unificó ambos tramos hidráulicos en un único encuadre continuo, sin que el contrato lo pidiera explícitamente así |
| `OPEN` preservados | PASS |
| `DO NOT INFER` | PASS, con salvedad estructural: toda imagen generativa inventa apariencia vegetal específica no confirmada como especie |
| `PROHIBITED` | PASS |

## 5. Iteración 002 — variable cambiada: `cameraFormat`

**Hipótesis:** declarar `cameraFormat` como "dos planos distinguibles" resolvería el `PARTIAL` de 001.

`cameraFormat` añadido:
```text
- Componer la escena como dos planos claramente distinguibles dentro del mismo encuadre o en secuencia: un plano del tramo de agua calma (poza) y un plano del tramo de rapido o pequena caida, conectados visualmente por el mismo cauce continuo.
- Ambos planos deben compartir el mismo tipo de pared rocosa y vegetacion de ribera para que se lean como el mismo sistema territorial, no como dos lugares distintos.
```

Todo lo demás (`structuralContract`, `mandatoryRelations`, `open`, `doNotInfer`, `prohibited`, `artisticFreedom`) permaneció idéntico a 001 — verificado por diff.

### Resultado

Una sola imagen: cascada escalonada de varios saltos hasta un pozón, encuadre continuo.

**Hallazgo:** el ejecutor **no siguió la instrucción literal** de "dos planos distinguibles" — volvió a resolver todo en un encuadre único, aunque de forma más legible que en 001. Conclusión: la ambigüedad de "planos" (interpretable como zonas dentro de una misma imagen) explica la falta de separación real.

| Criterio | Resultado |
|---|---|
| `structuralContract` | PASS |
| `mandatoryRelations` (resultado percibido) | PASS, mejor que 001 |
| `mandatoryRelations` (apego literal a `cameraFormat`) | PARTIAL |
| `OPEN` / `DO NOT INFER` / `PROHIBITED` | PASS |

## 6. Iteración 003 — variable cambiada: redacción de `cameraFormat`

**Hipótesis:** una instrucción inequívoca ("generar dos imágenes separadas", con roles explícitos) lograría separación real donde "dos planos" falló.

`cameraFormat` reemplazado:
```text
- Generar dos imagenes separadas y distintas, no una sola composicion combinada.
- Imagen A: unicamente el tramo de agua calma (poza), sin mostrar el rapido.
- Imagen B: unicamente el tramo de rapido o pequena caida, sin mostrar la poza calma.
- Ambas imagenes deben compartir el mismo tipo de pared rocosa y vegetacion de ribera, para que se reconozcan como el mismo cauce visto en dos puntos distintos.
```

### Resultado

**Dos imágenes separadas**, tal como se pidió:
- Imagen A: poza calma, sin rápido visible.
- Imagen B: agua turbulenta sobre rocas, sin poza visible.

**Hipótesis confirmada.** Pedir "dos imágenes separadas" de forma inequívoca funcionó; pedir "dos planos" no.

**Advertencia registrada:** la Imagen B mostró un caudal/turbulencia visualmente más intensos que lo respaldado por `ENV-0037` ("rápido/pequeña caída"). No viola el contrato (que autorizaba "rápido"), pero es un caso límite de plausibilidad visual excediendo la evidencia — `ARBORIS_SCENE_COMPILER.md` §5 prohíbe inventar hidrología sin autorización. **Esta imagen no debe usarse como evidencia del caudal real del Estero El Arrayán.**

| Criterio | Resultado |
|---|---|
| `structuralContract` (ambas imágenes) | PASS |
| `mandatoryRelations` | PASS |
| `OPEN` preservados | PASS |
| `DO NOT INFER` | PASS, con advertencia sobre intensidad hidrológica en Imagen B |
| `PROHIBITED` | PASS |

## 7. Hallazgos operativos consolidados

1. **ASC v0.1 no necesitó ningún cambio** en las tres iteraciones — todo se resolvió variando el contrato de entrada.
2. **Redacción de `cameraFormat` importa mucho más de lo esperado**: "dos planos" es ambiguo y el ejecutor lo ignora; "dos imágenes separadas" con roles explícitos (Imagen A / Imagen B) sí funciona. Dato útil para redactar futuros contratos que necesiten separación real de salidas.
3. **Riesgo de sobre-extrapolación hidrológica/visual**: un ejecutor puede intensificar visualmente un rasgo autorizado (p. ej. "rápido") más allá de lo que respalda la evidencia, sin violar literalmente el contrato. Este tipo de resultado requiere lectura crítica en la auditoría, no solo checklist de cumplimiento textual.
4. **No se pudo verificar la fidelidad fotográfica exacta** contra `ENV-0016`/`ENV-0037` porque esta sesión no tuvo acceso directo a esas imágenes, solo a su descripción en `manifest.csv`. Auditoría hecha contra descripción textual, no contra pixel real.

## 8. Gate de instrumentación del ejecutor — UNRESOLVED

Igual que en `MAP-001-ASC-GENERATIVE-BASELINE-001`, este piloto **no registró**: proveedor exacto, versión de modelo, parámetros de generación, seed, fecha/hora exacta, ID de respuesta. El usuario declaró que el ejecutor fue "GPT", sin más detalle verificable técnicamente en esta sesión.

```text
provenance: UNRESOLVED en las 3 iteraciones
```

## 9. Auditoría de este documento

### AUDITORÍA

El ciclo completo (brief → 3 contratos → 3 resultados → 3 auditorías) se mantuvo dentro del alcance declarado, sin desviar autoridad de dominio, sin tocar el compilador y sin cerrar ningún `OPEN` del proyecto por conveniencia.

### INCONSISTENCIAS

La aprobación artística del brief fue declarada por el usuario en el chat de la sesión, no verificada como decisión real de Álvaro. Este documento dejó esa distinción explícita para que no se lea como aprobación formal.

### VACÍOS / OMISIONES

- Instrumentación del ejecutor generativo — sigue sin resolverse (heredado de `MAP-001`).
- Identificación de especies, vínculo botánico (`botanicalSourceRef`), tratamiento de infraestructura visible, relación exacta con el recorrido completo `IT-001/MAP-001` — todos siguen `OPEN`, sin cambios.
- Verificación fotográfica pixel-a-pixel contra las referencias `core` — no realizada en esta sesión.

### REDUNDANCIAS

Ninguna problemática. Los tres contratos son variaciones controladas de un mismo caso (una variable cambiada por iteración, según exige `ARBORIS_SCENE_COMPILER.md` §11), no una duplicación de fuente de verdad.

### DECISIÓN

```text
ASC-PLAY-VIGNETTE PILOT — 2026-09-21

DECISIÓN: registrado como ejercicio de sesión, no como canon.

ASC v0.1 CHANGE REQUIRED: NO
v0.2 TRIGGER: NO
APROBACIÓN ARTÍSTICA REAL: PENDIENTE (Álvaro no confirmó directamente)
INSTRUMENTACIÓN DEL EJECUTOR: UNRESOLVED

NEXT GATE:
1. Confirmación artística real de Álvaro sobre el brief (sección 3).
2. Instrumentación del ejecutor si se desea reproducibilidad formal.
```

## 10. Trazabilidad

- Sesión: checkout `abrankil/arboris`, rama `claude/adoring-thompson-zsnylq`.
- Material fuente (contratos JSON, prompts compilados, imágenes de resultado) generado y auditado en el scratchpad de la sesión; este documento consolida su contenido para que no se pierda.
- Este documento se creó por instrucción explícita de "documentar". No implica commit ni push — esas acciones requieren autorización aparte.
