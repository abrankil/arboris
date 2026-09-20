# ASC — Investigación de metodología epistémica portable

**Estado:** NO NORMATIVO. Investigación read-only. No es especificación, no es canon de Árboris, no es autoridad de ASC.
**Fecha:** 2026-09-19
**Solicitado por:** Álvaro, en el contexto de investigar si el sistema ASC puede usarse en otros proyectos además de Árboris.
**No modifica:** `tools/asc/compile_asc.mjs`, el compilador de escenas, ni ninguna especificación ASC existente.

---

## 0. Fuentes examinadas

Leídas completas en esta investigación (o en este mismo hilo de conversación, hoy):

- `docs/ARBORIS_SCENE_COMPILER.md`
- `docs/ASC_V0_1_EXECUTABLE_SPEC.md`
- `docs/ASC_PROJECT_BOUNDARY.md`
- `docs/ASC_PROJECT_SEPARATION_AND_IMPLEMENTATION_PLAN_2026-09-17.md`
- `docs/ASC_INDEPENDENCE_AUDIT_2026-09-17.md`
- `docs/ASC_HANDOFF_TRANSFER_MATRIX_2026-09-17.md`
- `docs/MAP001_WALKABLE_ENVELOPE_AUTHORITY_FREEZE_001_2026-09-18.md`
- `docs/CIERRE_JORNADA_2026-09-19_ASC_R4_REPLICA_R5.md`
- `docs/REGISTRO_PUENTE_ASC_R4_R5_2026-09-19.md`
- `CLAUDE.md` (este mismo archivo de enrutamiento)

Barridas por término (grep) sobre todo `docs/`, sin lectura completa de cada archivo, para localizar dónde aparece o no aparece cada concepto de la lista solicitada.

Evidencia de código/ejecución generada por mí mismo hoy, en este mismo hilo (no repetida ahora):

- ejecución real de `tools/map-navigation/materialize_walkable_envelope_001.mjs` y su suite de tests, incluyendo el hallazgo de que `verifyAuthorizedCandidate()` verifica SHA-256 de un candidato contra un manifiesto congelado antes de usarlo, y que esa verificación falla en checkout Windows con `core.autocrlf=true` sin `.gitattributes` (evidencia primaria, no repetida en este documento con el mismo detalle).
- lectura completa de `docs/ARBORIS_SCENE_COMPILER.md` y `docs/ASC_V0_1_EXECUTABLE_SPEC.md` ya realizada en el turno anterior de este hilo.

**No leí** en esta investigación: `ASC_CONTRACT_UPSTREAM_MAPPING_AUDIT`, `ASC_EXECUTION_ITERATION_002_AUDIT`, `ASC_MAP001_*` (varios), `ASC_STATE_SUMMARY_AUDIT`, `ASC_PRODUCTION_VOCABULARY_*`, `ASC_VOCABULARY_GUIDE.md` completos — solo aparecieron en resultados de grep. Su contenido podría matizar algunas clasificaciones de abajo; se listan en la Sección 6 como evidencia adicional posible.

## 1. Método

Para cada uno de los 15 elementos solicitados, clasifiqué según evidencia real, sin presuponer que todos pertenecen al ASC canónico:

```text
término/concepto
→ ¿aparece literalmente en ASC canónico de Árboris?
→ ¿el concepto existe bajo otro nombre?
→ ¿está implementado en código, no solo documentado?
→ ¿fue verificado por tests?
→ ¿es específico del dominio de escenas/territorio o es domain-agnostic por diseño?
```

## 2. Clasificación por elemento

| # | Elemento | ¿Término literal en ASC canónico? | ¿Concepto presente (otro nombre)? | ¿Código/tests? | Clasificación |
|---|---|---|---|---|---|
| 1 | Separación compilador/auditor (= productor/auditor) | No como esa frase exacta | Sí — `ARBORIS_SCENE_COMPILER.md` §13 "la salida generativa no se autocertifica"; `ASC_V0_1_EXECUTABLE_SPEC.md` §6 "Separación compilador/ejecutor"; `ASC_HANDOFF_TRANSFER_MATRIX` fila O | Sí — `compile_asc.mjs` no invoca ningún ejecutor | **Respaldado por autoridad existente** (sustancia canónica; la formulación explícita de dos roles nombrados "COMPILADOR/AUDITOR" es de `CIERRE_JORNADA` R4/R5, experimental) |
| 2 | Prohibición de auto-certificación | Sí, literal: "la salida generativa no se autocertifica" | — | Indirecto (por diseño del compilador) | **Respaldado por autoridad existente** — canónico explícito, `ARBORIS_SCENE_COMPILER.md` línea 297 |
| 3 | Provenance preservation | No | Sí, en sustancia — evidence-class rule de `CLAUDE.md` §8; `ARBORIS_SCENE_COMPILER.md` §9-10 (un resultado generativo no corrobora su propia fuente) | No | El **nombre** es experimental (`ASC_R4_PROVENANCE_PRESERVATION_CONTRAST`, no normativo, evidencia `PARTIAL`/`DECLARED`); la **sustancia** está respaldada por autoridad existente bajo otro vocabulario |
| 4 | Fail-closed | Sí, literal, obligatorio (`ASC_V0_1_EXECUTABLE_SPEC.md` §6) | — | **Sí, en dos subsistemas independientes**: `compile_asc.mjs` (rechaza contrato inválido) y `materialize_walkable_envelope_001.mjs` (rechaza SHA-256 no coincidente) | **El elemento mejor respaldado de la lista** — canónico + código verificado hoy mismo en dos lugares distintos |
| 5 | Authority bindings | No — término aparece solo en `CLAUDE_CODE_INSTRUCTION_R1.md` y mi propio contrato de hoy | Sí — patrón `sourceCandidate {id, path, sha256}` en `data/baselines/map001-walkable-envelope-authority-001.json`, verificado por `verifyAuthorizedCandidate()` | Sí, código real | Patrón **respaldado por autoridad existente** (fuera de ASC v0.1, dentro de navegación); vocabulario `AUTHORITY_BINDING` es importado, no nativo. **Vulnerabilidad conocida:** rompe en checkout Windows sin `.gitattributes` (hallazgo propio de hoy) |
| 6 | Scope/vigencia de autoridad | No como "scope"/"vigencia" exactos | Sí — `ARBORIS_SCENE_COMPILER.md` §3 "la autoridad depende del tipo de información"; `ASC_PROJECT_BOUNDARY.md` completo es una aplicación real de esto a nivel de proyecto | No aplica (es una regla documental aplicada organizacionalmente) | **Respaldado por autoridad existente**, con precedente de aplicación real (separación Árboris↔ASC) |
| 7 | Rechazo de cross-domain authority laundering | No, término importado de R1 | Sí en sustancia — `ASC_PROJECT_BOUNDARY.md`: "Árboris puede consumir ASC. ASC no adquiere por ello autoridad sobre Árboris"; `CLAUDE.md` §8 "no upgrade one evidence class into another" | Aplicado hoy mismo en el contrato Pokémon (0 coincidencias de dominio) | **Respaldado por autoridad existente**, con una aplicación práctica ya ejecutada |
| 8 | Grounding de assertions | No | Parcial — la disciplina general de evidencia/trazabilidad de `DEVELOPMENT_MANUAL.md` cubre parte de la idea, sin mecanismo formal de "grounding" | No | **Concepto presente parcialmente, sin mecanismo formalizado**; no puede clasificarse como plenamente respaldado |
| 9 | Preservación de estados epistémicos | No como frase | Sí, explícito: `CLAUDE.md` §3 (las etiquetas de reporte no reemplazan `claimState`/`evidenceStatus`/`productionStatus` ni los tratamientos ASC); `ARBORIS_SCENE_COMPILER.md` §4 (ASC preserva esos estados sin reescribirlos) | No aplica | **Respaldado por autoridad existente** — como disciplina de no-conflation entre vocabularios paralelos, no como un sistema único |
| 10 | OPEN / UNRESOLVED / DO NOT INFER | Sí, masivo y central | — | Sí — confirmado `CONSISTENTE` en la tabla de trazabilidad de `ASC_INDEPENDENCE_AUDIT` (doc+contrato+código+tests) | **El segundo elemento mejor respaldado** — ya diseñado domain-agnostic, usado hoy sin fricción en el contrato Pokémon |
| 11 | Grafo de dependencias justificativas | No | No, cero coincidencias en todo `docs/` | No | **No puede generalizarse con evidencia actual** — no existe ni bajo otro nombre |
| 12 | Control de ciclos materiales | No | No, cero coincidencias | No | **No puede generalizarse con evidencia actual** |
| 13 | Binding entre artefacto verificado y artefacto realmente consumido | No como frase | Sí — exactamente lo que hace `verifyAuthorizedCandidate()`: lee de disco, verifica SHA-256, y solo entonces lo usa | Sí, código real, ausente en `compile_asc.mjs` (que no verifica hash de sus inputs) | **Presente y code-verified en navegación; ausente en ASC v0.1 mismo** |
| 14 | Freeze/versionado | Como concepto de ASC v0.1: explícitamente `OPEN` (`ASC_V0_1_EXECUTABLE_SPEC.md` §3 y §9 lo listan fuera de alcance) | Sí, fuerte, fuera de ASC — `MAP001_WALKABLE_ENVELOPE_AUTHORITY_FREEZE_001`, `MAP001_TILEGRAMMAR_NODE24_EXPERIMENTAL_BASELINE_FREEZE_001` | Sí, en navegación/tile-grammar; no en ASC | **Patrón general respaldado; ASC propiamente no tiene todavía su propia versión que trasladar** |
| 15 | Separación productor/auditor | Ver fila 1 (tratado como el mismo principio) | — | — | Ver fila 1 |

## 3. Las cuatro categorías pedidas, resumidas

### 3.1 ASC específico de Árboris

- las 14 claves del contrato JSON v0.1 (`version`, `structuralContract`, `cameraFormat`, etc.) — vocabulario de escena/cámara;
- la cadena `Master Botánico → JSON → especies → ACE`, y cualquier referencia a `SP-00X`, caracteres, territorio de MAP-001;
- `walkableEnvelope`, contratos de navegación/territorio/cámara específicos del piloto.

### 3.2 Metodología ASC potencialmente portable

- fail-closed (elemento #4);
- OPEN/UNRESOLVED/DO NOT INFER (elemento #10);
- no auto-certificación / separación compilador-auditor (elementos #1, #2, #15);
- autoridad con scope de dominio, sin laundering cross-dominio (elementos #6, #7);
- patrón de authority binding por hash, con la advertencia de fragilidad de línea de fin (elementos #5, #13);
- disciplina de no conflation de estados epistémicos entre vocabularios paralelos (elemento #9).

### 3.3 Principios efectivamente respaldados por autoridad existente

Elementos 1, 2, 4, 5, 6, 7, 9, 10, 13, 14 — todos con cita textual o de código verificable en este repositorio (ver tabla).

### 3.4 Principios solo experimentales/propuestos

- "Provenance Preservation" como **nombre formal** (elemento #3) — viene de R4, explícitamente `HYPOTHESIS`/`experimental no normativo` según su propio documento de cierre;
- el vocabulario `AUTHORITY_BINDING`, `CROSS_DOMAIN_AUTHORITY_LAUNDERING`, `INTERNAL_ADVERSARIAL_PREFLIGHT` tal como aparecen literalmente — importados hoy vía R1, no nativos de Árboris.

### 3.5 OPEN / UNRESOLVED

Ver Sección 4.

### 3.6 Elementos que NO pueden generalizarse con la evidencia actual

- grafo de dependencias justificativas (#11);
- control de ciclos materiales (#12);
- grounding de assertions como mecanismo formal (#8, parcial).

## 4. OPEN / UNRESOLVED de esta investigación

- si "productor/auditor" es exactamente el mismo eje que "compilador/auditor" o si R1 los distingue con matices que esta investigación no capturó (traté ambos como el mismo principio; `OPEN`);
- si la fragilidad CRLF que encontré hoy en el binding de autoridad es específica de este archivo o afecta a cualquier futura implementación del mismo patrón (`OPEN` — no probé otros archivos con verificación de hash);
- si "Provenance Preservation" (elemento #3) alcanzará evidencia suficiente para dejar de ser experimental — su único soporte es una réplica inter-agente parcial (`PARTIAL`), no una validación general;
- no leí completos varios documentos ASC adicionales (`ASC_CONTRACT_UPSTREAM_MAPPING_AUDIT`, `ASC_EXECUTION_ITERATION_002_AUDIT`, `ASC_MAP001_*`, `ASC_STATE_SUMMARY_AUDIT`, `ASC_VOCABULARY_GUIDE.md`) — podrían contener evidencia adicional a favor o en contra de alguna clasificación.

## 5. Contradicciones / redundancias encontradas

**No encontré una contradicción lógica directa.** Sí encontré una **descoordinación entre dos líneas de trabajo paralelas** que valdría la pena que reconcilies, sin que yo decida cuál prevalece:

```text
LÍNEA A (2026-09-17):
ASC_PROJECT_BOUNDARY.md
ASC_PROJECT_SEPARATION_AND_IMPLEMENTATION_PLAN
ASC_INDEPENDENCE_AUDIT
ASC_HANDOFF_TRANSFER_MATRIX
→ ya establecen que ASC es proyecto propio de Álvaro, separado de Árboris,
  con un plan de fases (0 a 7) para diagnosticar, extraer y migrar ASC
  a una plataforma independiente. Fase 0 completada. Fase 1 (diagnóstico
  read-only de la plataforma destino) todavía no iniciada porque esa
  plataforma "todavía no está disponible".

LÍNEA B (hoy, 2026-09-19):
CLAUDE_CODE_INSTRUCTION_R1 / ASC-META-DECK-AUDIT-CONTRACT-001
→ prueba la portabilidad de ASC saltando directamente a un dominio
  externo concreto (Pokémon TCG) mediante un contrato adversarial,
  sin referenciar ni apoyarse en la Línea A.
```

Ambas líneas persiguen el mismo objetivo general (¿puede ASC existir/operar fuera de Árboris?) desde ángulos distintos y sin cruzarse. No es un error — pueden ser complementarias — pero hoy son dos investigaciones que no se citan entre sí. Esta es información para ti, no una decisión que yo tome.

## 6. Qué podría constituir después una especificación portable

Sin promoverlo a autoridad ni construirlo todavía, la evidencia sugiere que una futura "ASC-CORE" domain-agnostic tendría, como candidatos con mejor respaldo:

```text
1. fail-closed obligatorio
2. compilador no se autocertifica / auditor es un rol separado
3. OPEN / UNRESOLVED / DO NOT INFER como estados de primera clase
4. autoridad con scope de dominio explícito, sin transferencia implícita entre dominios
5. authority binding verificable (id + path + hash) entre lo declarado y lo consumido,
   con normalización de fin de línea resuelta antes de generalizar
```

y dejaría fuera, por falta de evidencia suficiente hoy:

```text
grafo de dependencias justificativas
control de ciclos materiales
grounding formal de assertions
Provenance Preservation como mecanismo nombrado único
```

## 7. Qué evidencia adicional faltaría

- un segundo dominio externo real completando el ciclo completo (no solo un contrato adversarial, sino una compilación + ejecución + auditoría real), para confirmar que el patrón generaliza más allá de un ejercicio de clasificación;
- resultado de la Fase 1 (diagnóstico read-only) del plan ya existente en `ASC_PROJECT_SEPARATION_AND_IMPLEMENTATION_PLAN`, cuando exista la plataforma destino;
- prueba de si el patrón de authority binding por hash sobrevive un checkout en Linux/macOS y en Windows con `.gitattributes` correctamente configurado, antes de declararlo portable sin advertencia;
- la instrucción original que `CLAUDE_CODE_INSTRUCTION_R1` corrige (todavía no entregada), que podría contener principios adicionales no capturados aquí;
- lectura completa de los documentos ASC listados en la Sección 0 que no alcancé a revisar en profundidad.

## 8. Cierre

Esta investigación **no crea** una especificación ASC general, **no declara** un "ASC portable" canónico, y **no promueve** ninguno de estos hallazgos a autoridad. Es un mapa de evidencia para que la decisión de generalizar —si se toma— se apoye en lo que el repositorio realmente demuestra, no en similitud superficial de nombres.
