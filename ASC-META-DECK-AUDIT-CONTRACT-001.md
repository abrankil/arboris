# ASC-META-DECK-AUDIT-CONTRACT-001

**Estado:** DRAFT — `INTERNAL_ADVERSARIAL_PREFLIGHT` únicamente. No frozen, no certified, no canon.
**Origen:** hallazgos N1–N7 declarados por Álvaro como provenientes de otra sesión de IA/proveedor (`DECLARED`, no verificados dentro de este repo). Corrección aplicada: `CLAUDE_CODE_INSTRUCTION_R1.md` (repo root, sin trackear en git).
**No es autoridad canónica de Árboris.** Este documento no forma parte de `docs/ARBORIS_SCENE_COMPILER.md`, no está enlazado desde `docs/README.md` ni desde `AGENTS.md`, y no debe leerse como canon del proyecto Árboris.

---

## 0. Advertencia de dominio (hallazgo previo a N1–N7)

Contrasté esta instrucción contra la autoridad ASC canónica de Árboris (`docs/ARBORIS_SCENE_COMPILER.md`, `docs/ASC_V0_1_EXECUTABLE_SPEC.md`, `docs/ASC_VOCABULARY_GUIDE.md`, `tools/asc/*.mjs`). Búsqueda de los términos de dominio usados en R1 (`pokemon`, `tournament`, `format_legality`, `limitless`, `meta_deck`, `deck`): **0 coincidencias**.

La autoridad ASC de Árboris gobierna exclusivamente compilación de escenas, territorio, navegación, cámara y blockouts del piloto de flora chilena. No tiene jurisdicción sobre reglas de Pokémon TCG, legalidad de formato, resultados de torneo, ni metodología de evaluación de mazos — que es el dominio que `ASC-META-DECK-COMPILATION-001` parece describir por el vocabulario usado en R1.

Por regla N5 de la propia R1, esto es exactamente el ataque `CROSS_DOMAIN_AUTHORITY_LAUNDERING` que el contrato debe rechazar. Este documento lo rechaza: **ningún elemento de dominio Pokémon/torneo se vincula a autoridad ASC de Árboris.**

## 1. Gap declarado: instrucción base ausente

R1 se autodescribe como corrección de "la instrucción anterior" y referencia "los ataques mínimos definidos en la instrucción original". Ese documento base **no fue entregado** y no existe en este repositorio (verificado: único archivo nuevo es `CLAUDE_CODE_INSTRUCTION_R1.md`). Por lo tanto:

- no puedo reproducir la batería mínima de ataques original — solo ejecuto los 4 ataques que R1 define explícitamente por su propio texto (N2, N3, N4, N5);
- no puedo reconstruir las secciones de la instrucción original no tocadas por N1–N7;
- este gap se registra aquí, no se rellena por inferencia.

## 2. N1 — PROMPT_SELF_AUTHORIZATION: clasificación de candidatos

Candidatos introducidos por el prompt (NOVELTY≠VALUE, SIMILARITY≠PERFORMANCE, separación productor/auditor, aislamiento temporal/holdout, baseline, función objetivo, métricas, thresholds, reglas de abstención, condiciones fail-closed):

```text
búsqueda de autoridad aplicable en ASC canónico de Árboris → 0 resultados
```

**Clasificación de todos los candidatos anteriores:** `EXPERIMENTAL_AUTHORITY_REQUIRED` (pertenecen a diseño experimental de evaluación, no a ASC de Árboris). Ninguno se promueve a `AUTHORIZED_REQUIREMENT`. El prompt no se cita a sí mismo como autoridad.

**N1_STATUS: APPLIED**

## 3. N2 — SELF_FREEZE_AUTHORITY

Busqué en el repo autoridad ASC vigente sobre freeze/versionado/hashes para este dominio. Existe el patrón (`data/baselines/map001-walkable-envelope-authority-001.json`, `docs/MAP001_WALKABLE_ENVELOPE_AUTHORITY_FREEZE_001_2026-09-18.md`), pero gobierna navegación de MAP-001, sin alcance sobre mazos/torneos.

```text
FREEZE_AUTHORITY_BINDING: NO EXISTE (fuera de dominio)
```

**FREEZE_STATUS: BLOCKED_UNRESOLVED_AUTHORITY**

**N2_STATUS: APPLIED**

## 4. N3 — PRODUCER_SELF_VALIDATION

El trabajo adversarial ejecutado en este documento se denomina exclusivamente `INTERNAL_ADVERSARIAL_PREFLIGHT`. No se usa `INDEPENDENT_AUDIT`, `CERTIFICATION` ni `FINAL_VALIDATION` — ASC canónico de Árboris no autoriza esa equivalencia para este dominio (no tiene jurisdicción sobre él).

Estado máximo alcanzable por este preflight: **`READY_FOR_INDEPENDENT_AUDIT`** (descriptivo, no normativo). No se usa `VALIDATED`.

**N3_STATUS: APPLIED**

## 5. N4 — FREEZE/AUDIT_ORDERING

`docs/ARBORIS_SCENE_COMPILER.md` §12 exige aplicar `docs/DEVELOPMENT_MANUAL.md` antes de que cualquier consolidación pretenda convertirse en canon — pero esa autoridad gobierna canon de Árboris, no este dominio ajeno. No existe secuencia freeze/audit aplicable encontrada para `ASC-META-DECK-AUDIT-CONTRACT-001`.

```text
FREEZE_AUDIT_ORDER: UNRESOLVED
FREEZE: BLOCKED
```

No se eligió una secuencia por conveniencia.

**N4_STATUS: APPLIED**

## 6. N5 — CROSS_DOMAIN_AUTHORITY_LAUNDERING

Ver Sección 0. Cada assertion de dominio Pokémon/torneo/formato queda:

```text
AUTHORITY_BINDING: INVALID_SCOPE
```

y no se usa para producir ningún verdict.

**N5_STATUS: APPLIED**

## 7. N6 — LIVE_SOURCE_REPRODUCIBILITY

No se entregó en este handoff ninguna fuente externa material (páginas oficiales, Limitless, datasets META) con `SOURCE_ID`, `RETRIEVED_AT`, `SNAPSHOT/HASH`, etc. No hay nada que verificar como reproducible todavía.

**REPRODUCIBILITY: UNRESOLVED**

**N6_STATUS: APPLIED (nada que evaluar aún; no se asumió reproducibilidad)**

## 8. N7 — ADVERSARIAL_EVIDENCE_BINDING / INTERNAL_ADVERSARIAL_PREFLIGHT

Batería ejecutada — **incompleta**: solo los 4 ataques que R1 define explícitamente por su propio texto. Los "ataques mínimos" de la instrucción original no están disponibles (Sección 1).

| ATTACK_ID | TARGET_INVARIANT | TARGET_ARTIFACT | PRECONDITION | ATTACK/MUTATION | EXPECTED_BEHAVIOR | OBSERVED_BEHAVIOR | EVIDENCE | RESULT | AFFECTED_REQUIREMENTS |
|---|---|---|---|---|---|---|---|---|---|
| SELF_FREEZE_AUTHORITY_TEST | contrato no puede autorizar su propio freeze | este documento | ninguna autoridad de freeze vinculada | intentar declarar `FROZEN` sin `FREEZE_AUTHORITY_BINDING` externo | rechazo / no-FROZEN | `FREEZE_STATUS: BLOCKED_UNRESOLVED_AUTHORITY` declarado en Sección 3 | grep de `docs/ARBORIS_SCENE_COMPILER.md`/`data/baselines/*` sin match de dominio | PASS | N2 |
| PRODUCER_SELF_CERTIFICATION_TEST | preflight interno no puede autoproducir certificación independiente | este documento | ninguna equivalencia ASC canónica encontrada | intentar etiquetar este trabajo como `VALIDATED`/`INDEPENDENT_AUDIT` | rechazo | etiquetado como `INTERNAL_ADVERSARIAL_PREFLIGHT`, techo `READY_FOR_INDEPENDENT_AUDIT` | Sección 4 de este documento | PASS | N3 |
| FREEZE_AUDIT_ORDER_BYPASS_TEST | Claude no puede elegir libremente orden freeze/audit | este documento | secuencia no resuelta por autoridad aplicable | intentar fijar una secuencia arbitraria | rechazo | `FREEZE_AUDIT_ORDER: UNRESOLVED`, `FREEZE: BLOCKED` | Sección 5 de este documento | PASS | N4 |
| CROSS_DOMAIN_AUTHORITY_LAUNDERING_TEST | autoridad de un dominio no puede validar assertion de otro | ASC canónico de Árboris vs. términos Pokémon/torneo de R1 | 0 coincidencias verificadas por grep | intentar vincular `POKEMON_RULES`/`TOURNAMENT_RESULT` a autoridad ASC de Árboris | REJECT / FAIL-CLOSED | `AUTHORITY_BINDING: INVALID_SCOPE` para todo elemento de ese dominio | comando `grep -riIn "pokemon\|tournament\|format_legality\|limitless\|meta.deck\|deck\b"` sobre corpus ASC → sin resultados | PASS | N5 |

**PREFLIGHT_PASS parcial** — válido únicamente para los 4 ataques ejecutados con evidencia trazable arriba. **No se declara `PREFLIGHT_PASS` global** porque la batería mínima original está incompleta (Sección 1). Ningún ataque sin evidencia se convirtió en PASS.

**N7_STATUS: APPLIED (con batería incompleta, declarado explícitamente)**

## 9. REGRESIÓN DIRIGIDA R1

| # | Pregunta | Esperado | Observado | Resultado |
|---|---|---|---|---|
| N1 | ¿Una regla solo del prompt puede volverse requisito sin autoridad externa? | NO | Todos los candidatos quedaron `EXPERIMENTAL_AUTHORITY_REQUIRED`, ninguno promovido | PASS |
| N2 | ¿El contrato puede autorizar su propio freeze? | NO | `BLOCKED_UNRESOLVED_AUTHORITY` | PASS |
| N3 | ¿El preflight interno produce certificación independiente por sí mismo? | NO | Techo `READY_FOR_INDEPENDENT_AUDIT`, nunca `VALIDATED` | PASS |
| N4 | ¿Claude elige libremente el orden freeze/audit? | NO | `UNRESOLVED` / `BLOCKED`, sin elección arbitraria | PASS |
| N5 | ¿Una autoridad de un dominio valida assertion fuera de su scope? | NO | `INVALID_SCOPE` aplicado a todo lo Pokémon/torneo | PASS |
| N6 | ¿Una URL viva sin identificación del contenido satisface reproducibility automáticamente? | NO | `REPRODUCIBILITY: UNRESOLVED`, nada asumido | PASS |
| N7 | ¿Se declara PASS adversarial sin evidencia individual? | NO | Cada ataque tiene fila de evidencia propia; battery incompleta declarada, no oculta | PASS |

**DIRECTED_REGRESSION_RESULT: PASS (7/7, sobre los 4 ataques disponibles)**

## 10. Criterio de cierre de R1 (copiado de la instrucción, aplicado literalmente)

Esto **NO** significa:

- que el contrato esté certificado;
- que el contrato pueda congelarse;
- que el experimento esté autorizado;
- que `ASC-META-DECK-COMPILATION-001` haya sido auditado;
- que todos los requisitos ASC estén satisfechos.

Significa únicamente: **N1–N7: REGRESSION_PASS**, con evidencia suficiente solo para los 4 ataques ejecutables con la información entregada.

## 11. OUT_OF_SCOPE_FINDINGS

- El dominio completo de `ASC-META-DECK-COMPILATION-001` (Pokémon TCG / meta-deck) no tiene ninguna autoridad canónica en este repositorio. No es un defecto de R1; es una condición previa no resuelta para cualquier auditoría futura de ese compilation deck.
- La instrucción original (pre-R1) nunca fue entregada a esta sesión — limita la batería adversarial a 4 de los ataques mínimos requeridos.

No se corrigió ninguno de estos dos puntos en este R1, conforme a su propio alcance.
