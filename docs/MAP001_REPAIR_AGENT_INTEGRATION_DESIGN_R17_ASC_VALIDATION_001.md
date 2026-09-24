# MAP-001 — Repair Agent Integration Design R17 — ASC Validation 001

Fecha: 2026-09-23
Artefacto solicitado para validación: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_017.md
Branch head al validar: 7b01840c08f718e601eac04536df097c27acec0a
R17 commit de autoría: 9d857ff31da4fd2f878bc477b7a34e7b907e8aa6
Regresión vigente: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R17_DIRECTED_REGRESSION_001.md
Estado de validación: PASS AT DESIGN LEVEL
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_AUTHORIZED: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Alcance de esta validación

La solicitud humana autoriza ejecutar esta revisión de validación con apoyo de ASC v0.1 dentro de su alcance compile-only.

No se infiere desde esa solicitud un cambio de AUTHORIZED_FOR_ASC ni una autorización de implementación.

La validación determina únicamente si R17 supera el gate documental/de diseño vigente después de su regresión dirigida y acumulada.

No implementa ni ejecuta provider/model/repair agent, no conecta el repair agent y no modifica E5.

## 2. ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-R17-ASC-VALIDATION-001

AUTHORIZED SOURCES:
- R17 exacto en commit 9d857ff31da4fd2f878bc477b7a34e7b907e8aa6;
- R17 directed + accumulated regression exacta en branch head 7b01840c08f718e601eac04536df097c27acec0a;
- docs/DEVELOPMENT_MANUAL.md;
- cierres de diseño R2–R16 preservados por la regresión acumulada;
- E5.1/E5.2/E5.3 authority chain previamente cerrada.

MANDATORY RELATIONS:
- no blocker de regresión puede permanecer abierto para declarar PASS de diseño;
- OPEN de implementación permanecen OPEN;
- design validation no equivale a implementation readiness;
- E5.3 permanece sole durable boundary;
- expected/actual provider request binding permanece resolver-owned;
- observability permanece output-only + effect-isolated;
- credential capability privada permanece separada de binding identity pública;
- provider-call guarantee permanece limitada a live-session single-send/no-replay;
- INDETERMINATE no produce MODEL_RESPONSE ni retry automático;
- prototype-safe E5.1 y MINIMAL_CHANGE_EXECUTABLE_RULE permanecen OPEN;
- NEXT_STAGE_ID y AUTHORIZED_FOR_ASC no se infieren.

DO NOT INFER:
- PASS de diseño implica que los OPEN ya estén implementados;
- PASS de diseño autoriza conectar el repair agent;
- PASS de regresión demuestra runtime behavior inexistente;
- human request to validate authorizes implementation;
- AUTHORIZED_FOR_ASC from successful compilation;
- a future fresh attempt after INDETERMINATE is allowed without explicit policy/authority.

PROHIBITED:
- marcar IMPLEMENTATION_AUTHORIZED = TRUE;
- marcar REPAIR_AGENT_CONNECTED = TRUE;
- cerrar OPEN por inferencia;
- cambiar hash profiles en silencio;
- introducir durable authority fuera de E5.3;
- ejecutar provider/model;
- crear NEXT_STAGE_ID por intuición.

## 3. AUDITORÍA

La regresión vigente de R17 registra:

R16-N1 = RESOLVED AT DESIGN LEVEL.
R16-N2 = RESOLVED AT DESIGN LEVEL.
R16-N3 = RESOLVED AT DESIGN LEVEL.
NEW_BLOCKING_FINDINGS = 0.
NEW_MAJOR_FINDINGS = 0.
R17_DIRECTED_REGRESSION = PASS.
R17_ACCUMULATED_REGRESSION = PASS_AT_DESIGN_LEVEL.

La cadena R2–R16 queda preservada a nivel de diseño según la regresión acumulada.

R17 mantiene explícitamente las fronteras y claims en un alcance compatible con la evidencia disponible:

- no claims de exactly-once crash-persistent;
- no secret/bearer capability en logical artifacts;
- no observability authority ni read-back;
- no provider call sin credential preflight + resolver-owned authorization;
- no automatic retry;
- no durable transport store;
- E5.3 como única frontera durable.

Los elementos aún no definidos se mantienen OPEN y no son presentados como implementados.

Conforme al DEVELOPMENT_MANUAL, no existe un blocker de diseño vigente que impida superar el gate documental R17.

## 4. INCONSISTENCIAS

No se detectan nuevas inconsistencias bloqueantes entre R17, su regresión vigente y el DEVELOPMENT_MANUAL.

La validación no contradice los OPEN de R17 porque distingue explícitamente validación de diseño de autorización/estado ejecutable.

Sería inconsistente declarar implementación lista o repair agent conectado; esta validación no lo hace.

## 5. VACÍOS / OMISIONES

No se detecta un vacío arquitectónico nuevo que bloquee la validación documental/de diseño.

Permanecen OPEN para una fase posterior de implementación/diseño concreto:

- observability handoff/isolation implementation and numeric budgets;
- secret-broker implementation;
- private lease capability/public binding implementation;
- transport session and provider-call token implementation;
- fresh-attempt policy after INDETERMINATE;
- optional provider idempotency extension;
- execution-surface and semantic-input enforcement implementation;
- sandbox/isolation technology;
- executable closure and loader/resolver implementation;
- exact runtime/toolchain and provider network/DNS/TLS/proxy policies;
- CANONICAL_JSON_NUMBER_POLICY;
- CANONICAL_JSON_SHA256_V2 implementation;
- trusted materializer/snapshot implementation;
- assurance producer/trust-anchor implementation details;
- provider/model/runtime selection;
- hash-profile bridge A/B/C;
- E5 compatibility proof/migration path;
- prototype-safe E5.1 repair application + tests;
- MINIMAL_CHANGE_EXECUTABLE_RULE or authority-level revision;
- exact numeric resource limits;
- concrete schemas, parser, request/response/instruction/provider policies;
- IDs and implementation adversarial tests;
- human implementation authorization;
- NEXT_STAGE_ID;
- AUTHORIZED_FOR_ASC.

Estos OPEN bloquean afirmar implementation readiness completa. No bloquean la coherencia documental de R17 porque R17 los declara y fail-closes la ejecución que depende de ellos.

## 6. REDUNDANCIAS

No se detecta redundancia problemática.

Las principales capas duplicadas son intencionales y separan responsabilidades:

- minimal observability handoff vs isolated delivery;
- private credential capability vs public binding identity;
- credential preflight vs expected provider envelope vs call authorization;
- transportInvocationId vs transportSessionBindingId vs providerCallAuthorizationId;
- expected/actual request binding vs single-use send authority;
- runtime snapshot vs assurance attestation;
- E5 compatibility gate vs E5.1/E5.2/E5.3.

No se detectan dos fuentes de verdad incompatibles.

## 7. Resultado ASC

ASC_CONTRACT_COMPILATION = PASS.

R17_DIRECTED_REGRESSION = PASS.
R17_ACCUMULATED_REGRESSION = PASS_AT_DESIGN_LEVEL.
NEW_BLOCKING_FINDINGS = 0.
NEW_MAJOR_FINDINGS = 0.

DESIGN_VALIDATION = PASS_AT_DESIGN_LEVEL.
R17_VALIDATED_AT_DESIGN_LEVEL = TRUE.
R17_ASC_VALIDATION = VALIDATED_AT_DESIGN_LEVEL.
CORRECTION_REQUIRED = FALSE.

IMPLEMENTATION_READY = FALSE.
IMPLEMENTATION_AUTHORIZED = FALSE.
REPAIR_AGENT_CONNECTED = FALSE.
NEXT_STAGE_ID = OPEN.
AUTHORIZED_FOR_ASC = OPEN.

## 8. Alcance exacto del PASS

PASS significa:

- el diseño R17 es internamente coherente dentro del alcance auditado;
- las regresiones dirigidas y acumuladas no dejan blockers de diseño abiertos;
- los claims están limitados a lo que el contrato puede sostener;
- los OPEN están declarados y no ocultos.

PASS no significa:

- que exista implementación;
- que los OPEN de runtime/transport/E5 estén resueltos;
- que el repair agent pueda conectarse;
- que provider/model pueda ejecutarse;
- que exista autorización humana para cambios ejecutables.

## 9. Gate siguiente

El gate documental de diseño R17 queda superado.

El siguiente cambio de fase requiere una decisión humana explícita sobre si autorizar trabajo de implementación.

Si se autoriza una fase de implementación, debe empezar resolviendo los OPEN bloqueantes correspondientes bajo el mismo protocolo:

designar alcance ejecutable concreto
→ implementar de forma acotada
→ tests dirigidos/adversariales
→ auditoría
→ regresión
→ nueva validación antes de conectar el repair agent.

Sin esa decisión humana:

IMPLEMENTATION_AUTHORIZED = FALSE.
REPAIR_AGENT_CONNECTED = FALSE.
NEXT_STAGE_ID = OPEN.
AUTHORIZED_FOR_ASC = OPEN.
