# MAP-001 — Repair Agent Integration Design R14 — Directed Regression 001

Fecha: 2026-09-23
Artefacto auditado: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_014.md
Head auditado: 721cc5c460d292107119500cbe52c9e1da340d57
Ámbito: R13-N1/R13-N2 + regresión acumulada completa
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_AUTHORIZED: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-R14-DIRECTED-REGRESSION-001

ASC compila restricciones, OPEN, DO NOT INFER y criterios. No ejecuta provider/model, no implementa sandbox y no autoriza conexión.

## 2. AUDITORÍA

R14 corrige materialmente R13-N1 al separar module/dependency closure de execution-surface closure, con default deny y enforcement previo a ejecución.

R14 también corrige gran parte de R13-N2 mediante SEMANTIC_INPUT_CLOSURE_V1 por capability domain, con default deny y clasificación explícita de filesystem, process state, time, randomness, network, name resolution, TLS/proxy, IPC y cache state.

La regresión acumulada no detecta reapertura de los cierres sobre verified-load, assurance authenticity, snapshot ordering, hash-profile separation, response extraction, request-envelope binding ni E5.1 → E5.2 → E5.3.

Persisten dos brechas de diseño dentro del semantic-input closure: la categoría ALLOWED_NON_SEMANTIC todavía depende de una afirmación de no-influencia sin una frontera estructural de no-interferencia, y el provider credential/account context no está ligado como input semántico aunque el secret broker participa en la invocación.

## 3. Resultado dirigido

R13-N1 = PASS AT DESIGN LEVEL.
R13-N2 = PARTIAL / BLOCKED BY R14-N1 + R14-N2.

R12-N1 = PASS AT EXECUTION-CLOSURE DESIGN LEVEL.
R12-N2 = PASS AT DESIGN LEVEL.
R11-N1..R11-N3 = PASS AT DESIGN LEVEL.
R10-N1..R10-N3 = PASS AT DESIGN LEVEL.
R9-N1..R9-N3 = PASS AT DESIGN LEVEL.
R8-N1..R8-N3 = PASS AT DESIGN LEVEL.
R7-N1..R7-N3 = PASS.
R6-N1..R6-N3 = PASS AT DESIGN LEVEL.
R5-N1..R5-N3 = PASS.
R4-N1/R4-N2 = PASS AT DESIGN LEVEL.
R3-N1/R3-N2 = PASS AT DESIGN LEVEL.
R2-N1 = PASS.
R2-N2 = PASS AT DESIGN LEVEL / EXECUTABLE DEBT OPEN.
R2-N3 = PASS.

RA-I1 = PARTIAL / SEMANTIC INPUT PROVENANCE INCOMPLETE.
RA-I2 = PASS.
RA-I3 = PASS.
RA-I4 = PASS AS OPEN/BLOCKING.
RA-I5 = PASS AT DESIGN LEVEL / E5.1 EXECUTABLE DEBT OPEN.
RA-I6 = PASS AT DESIGN-COVERAGE LEVEL.
RA-I7 = PASS.
RA-I8 = PASS.

## 4. R13-N1 — PASS AT DESIGN LEVEL

EXECUTION_SURFACE_POLICY_V1 cubre de forma explícita la brecha detectada en R13:

- default disposition = FORBIDDEN;
- toda superficie secundaria debe declararse;
- BOUND_AND_VERIFIED exige identidad del target y membership en el executable closure antes de ejecución;
- workers/subprocesses/native targets y runtimes secundarios heredan o reciben policies explícitas;
- model/provider data no puede convertirse directamente en código ejecutable;
- enforcement ocurre antes de ejecutar.

No se detecta una vía conceptual nueva de ejecución autorizada por R14 sin una policy correspondiente. La implementación concreta sigue OPEN, correctamente.

## 5. R14-N1 — ALLOWED_NON_SEMANTIC no tiene todavía una garantía estructural de no-interferencia

R14 permite semantic inputs clasificados como ALLOWED_NON_SEMANTIC cuando exista evidencia de que no alteran decisiones, hashes, requests, parsing, repairs ni claims.

También permite time/randomness para logging/telemetry bajo esa clasificación.

El problema es que una etiqueta de policy y tests negativos no demuestran por sí solos que un valor accesible al mismo código autoritativo nunca influya en una rama, un hash, un timeout, un ID o una decisión futura.

Esto es especialmente relevante cuando el input existe dentro del mismo proceso/capability object que ejecuta lógica autoritativa.

### Impacto

Un canal etiquetado ALLOWED_NON_SEMANTIC podría convertirse accidentalmente en semantic authority sin cambiar su clasificación formal.

Entonces el runtime snapshot seguiría “válido” aunque el comportamiento dependa de un valor no incluido en INPUT_BINDING.

### Corrección requerida

R15 debe reemplazar la mera afirmación de no-semanticidad por una propiedad enforceable equivalente a NON_SEMANTIC_INPUT_ISOLATION_V1.

Una solución compatible es:

- el core autoritativo no recibe el valor;
- telemetry/observability recibe únicamente outputs ya calculados + metadata añadida fuera del camino autoritativo;
- no existe read-back desde telemetry hacia resolver/transport decision logic;
- si un valor debe ser leído antes de producir el resultado autoritativo, deja de ser ALLOWED_NON_SEMANTIC y pasa a FIXED_AND_BOUND, EXPLICIT_RUNTIME_INPUT o PROVIDER_TRANSPORT_AUTHORIZED;
- assurance debe probar la frontera/capability isolation, no solo ejemplos de comportamiento.

Alternativamente puede eliminarse ALLOWED_NON_SEMANTIC como input class y modelar observabilidad como output-side channel separado.

R14-N1 = BLOCKER.

## 6. R14-N2 — provider secret/credential selection no está ligado como semantic input

R14 indica que PROVIDER_TRANSPORT_DOMAIN usa secret-broker policy y que los secret values no entran a logical artifacts.

Eso protege el valor secreto, pero el diseño no liga todavía qué credential/account/organization/project context fue seleccionado por el broker.

Los diseños R5/R6 ya permiten que transport construya la provider call desde package + secret broker, mientras providerConfigurationId y endpoint/model policies se verifican por separado.

No existe una regla que establezca que providerConfigurationId identifica necesariamente el credential context, ni una evidencia no-secreta que permita al resolver comprobar qué identidad de credencial fue usada.

### Impacto

Dos invocaciones con el mismo request, model policy, endpoint y providerConfigurationId podrían usar credenciales distintas si el broker/configuración cambia.

Eso puede cambiar account/project/tenant scope, feature availability, quotas, provider-side policy context u otras condiciones observables, sin modificar los bindings actuales.

No corresponde inferir que el secret value deba registrarse o hashearse.

### Corrección requerida

Definir PROVIDER_CREDENTIAL_CONTEXT_BINDING_V1 o equivalente, sin exponer secrets, que ligue al menos:

- secretBrokerPolicyDigest;
- credentialHandleId o identidad lógica no secreta;
- credential generation/version cuando el broker la exponga;
- provider account / organization / project / tenant scope cuando sea observable y semánticamente material;
- providerConfigurationId;
- allowed credential scope;
- rule for rotation compatibility.

Transport debe producir una evidencia no secreta de que el credential context usado cumple el binding autorizado.

Si el provider/broker no expone alguna identidad, esa dimensión debe quedar NOT_OBSERVABLE y la policy debe declarar si ello es aceptable.

Cambiar el credential context de forma material debe invalidar el intento o requerir compatibilidad explícita.

R14-N2 = BLOCKER.

## 7. Cierres acumulados preservados

Se preservan:

- VERIFIED_BYTES == CONSUMED_BYTES;
- executable dependency closure fail-closed;
- assurance producer authenticity;
- single normative controlled JSON pipeline;
- LEGACY_LOGICAL_SHA256_V1 vs CANONICAL_JSON_SHA256_V2;
- NO_IMPLICIT_HASH_MIGRATION;
- expected/actual provider request envelope binding;
- replayable response extraction;
- provider invocation source binding;
- resource-policy separation;
- provider-native identity solo con DIRECT_RUNTIME_EVIDENCE;
- E5_HASH_PROFILE_COMPATIBILITY_GATE_V1;
- E5.1 → E5.2 → E5.3;
- E5.3 como única frontera durable.

PROTOTYPE_SAFE_REPAIR_APPLICATION y MINIMAL_CHANGE_EXECUTABLE_RULE permanecen OPEN, sin cierre por inferencia.

## 8. INCONSISTENCIAS

No se detecta contradicción con Repair R1 ni con E5.1/E5.2/E5.3.

Se detectan dos tensiones internas:

1. R14 exige que todo semantic input material quede ligado, pero conserva ALLOWED_NON_SEMANTIC sin una frontera estructural que impida que el valor llegue a lógica autoritativa.
2. R14 liga secret-broker policy pero no la identidad/contexto no secreto de la credencial efectivamente seleccionada.

## 9. VACÍOS / OMISIONES

R14-N1: non-semantic input isolation o separación output-only de observabilidad.
R14-N2: provider credential-context binding, rotation semantics y evidence status cuando la identidad no sea observable.

Permanecen OPEN: sandbox/enforcement implementation; runtime/toolchain; provider policies concretas; CANONICAL_JSON_NUMBER_POLICY; CANONICAL_JSON_SHA256_V2; bridge A/B/C hacia E5; prototype-safe E5.1; minimal-change rule; límites numéricos; schemas; strict parser; human implementation authorization; NEXT_STAGE_ID; AUTHORIZED_FOR_ASC.

## 10. REDUNDANCIAS

No se detecta redundancia problemática.

Semantic-input closure y non-semantic isolation cumplen funciones distintas: clasificación de inputs vs demostración de que observabilidad no retroalimenta la lógica.

ProviderConfigurationId y credential-context binding tampoco son redundantes: uno identifica configuración lógica del provider; el otro fija la identidad/scope no secreto de autenticación realmente usado, salvo que un futuro contrato demuestre que ambos son la misma fuente de verdad.

## 11. Resultado

R13-N1 = RESOLVED AT DESIGN LEVEL.
R13-N2 = PARTIAL.

NEW FINDINGS:
R14-N1 = BLOCKER — ALLOWED_NON_SEMANTIC carece de aislamiento estructural de no-interferencia.
R14-N2 = BLOCKER — provider credential/account context no está ligado como semantic input.

NEW_BLOCKING_FINDINGS = 2.
NEW_MAJOR_FINDINGS = 0.

R14_DIRECTED_REGRESSION = CORRECTION_REQUIRED.
IMPLEMENTATION_AUTHORIZED = FALSE.
REPAIR_AGENT_CONNECTED = FALSE.
NEXT_STAGE_ID = OPEN.
AUTHORIZED_FOR_ASC = OPEN.

## 12. Gate siguiente

Procede exclusivamente una R15 documental que:

1. haga enforceable la no-interferencia de observability/non-semantic channels o los saque del input path autoritativo;
2. ligue el provider credential context sin exponer secret values;
3. preserve R13-N1, R12-N2 y todos los cierres acumulados;
4. no implemente todavía sandbox, loader, canonicalizer, E5.1, transport, provider ni repair agent.

Después debe ejecutarse regresión dirigida R14-N1/R14-N2 + regresión acumulada completa antes de intentar design validation.
