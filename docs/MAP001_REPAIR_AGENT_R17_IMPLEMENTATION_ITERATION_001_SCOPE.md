# MAP-001 — Repair Agent R17 Implementation Iteration 001 — Scope

Fecha: 2026-09-24
Estado: AUTHORIZED_FOR_IMPLEMENTATION_ITERATION
Branch: repair-agent-integration-design-001
Baseline al definir alcance: 77e5b8348606a2193c126617e258866e9d68d0d3
Diseño: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_017.md
Validación de diseño: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R17_ASC_VALIDATION_001.md
Autorización humana: docs/MAP001_REPAIR_AGENT_IMPLEMENTATION_AUTHORIZATION_001.md

## 1. Objetivo

La primera iteración ejecutable de R17 implementa únicamente el handoff mínimo de observabilidad definido por OBSERVABILITY_EVENT_HANDOFF_V1 y su exclusión durante AUTHORIZATION_CRITICAL_WINDOW_V1.

Esta iteración no conecta repair agent, provider, model, secret broker, credential lease, transport session ni E5.

## 2. Alcance ejecutable

Se autoriza crear un módulo puro en:

`tools/proposal-resolution/map001_repair_agent_observability_handoff_r1.mjs`

con una suite dedicada:

`tools/proposal-resolution/map001_repair_agent_observability_handoff_r1.test.mjs`

y agregar esa suite al gate:

`.github/workflows/map001-proposal-validation.yml`

El módulo puede únicamente:

- aceptar primitives/arrays bounded que ya representan outputs autoritativos fijados;
- construir un descriptor plano y acotado;
- copiar referencias/digests existentes sin expandirlos;
- copiar counters escalares bounded;
- congelar la estructura resultante;
- rechazar/droppear cualquier entrada que exceda el contrato;
- impedir creación de handoff durante AUTHORIZATION_CRITICAL_WINDOW_V1.

## 3. Contrato ejecutable I1

La forma materializada queda fijada para esta iteración:

```text
OBSERVABILITY_EVENT_HANDOFF_R1 = {
  schemaVersion: "0.1",
  authoritativeTransitionId: string,
  eventClassId: string,
  existingReferenceIdsOrDigests: string[],
  boundedOutcomeCode: string,
  optionalFixedSizeCounters: [
    { counterId: string, value: non-negative safe integer }
  ]
}
```

Límites locales I1:

```text
MAX_REFERENCES = 8
MAX_COUNTERS = 8
MAX_ID_CHARS = 96
MAX_REFERENCE_CHARS = 128
MAX_OUTCOME_CHARS = 64
MAX_COUNTER_ID_CHARS = 64
MAX_ENCODED_BYTES = 2048
```

Estos límites son específicos de I1. No se promueven como límites globales del repair-agent runtime.

## 4. Semántica no-throw / fail-drop

El entrypoint público no propaga exceptions al caller autoritativo.

Resultado permitido:

```text
{ status: "READY", handoff }
```

o:

```text
{
  status: "DROPPED",
  code:
    "OBSERVABILITY_HANDOFF_DROPPED"
    | "OBSERVABILITY_HANDOFF_BUDGET_EXCEEDED"
    | "OBSERVABILITY_CRITICAL_WINDOW_VIOLATION"
}
```

Entradas inválidas, getters que fallen, datos oversized o serialización que no cumpla el budget deben terminar en `DROPPED`.

## 5. Restricciones

La implementación no puede:

- recorrer recursivamente objetos autoritativos;
- recibir payloads arbitrarios del modelo/provider;
- leer filesystem;
- usar network;
- consultar sink;
- consultar secret broker;
- llamar provider/model;
- modificar E5;
- crear durable state;
- realizar retry;
- reinterpretar el handoff como evidence/control-plane authority.

La función debe ser determinista para entradas válidas idénticas.

## 6. Inmutabilidad

El handoff READY debe ser una copia separada de los arrays/records suministrados y quedar congelado en todos sus niveles materializados.

Mutaciones posteriores del input no pueden modificar el handoff ya creado.

## 7. Tests dirigidos mínimos

La suite debe cubrir:

- caso válido;
- determinismo;
- estructura frozen;
- mutación posterior del input sin efecto;
- critical-window fail-drop;
- demasiadas references;
- demasiados counters;
- strings oversized;
- counter inválido;
- nested/non-string reference;
- getter que lanza exception;
- encoded-size budget;
- ausencia de campos arbitrarios en output.

## 8. Tests adversariales mínimos

La suite debe intentar:

- objetos con campos adicionales;
- arrays sobredimensionados;
- valores nested;
- counters no enteros/negativos;
- input con accessor que lanza;
- payload grande que intente forzar serialización fuera de budget;
- mutación del input después de READY.

Criterio adversarial: ninguna entrada hostil debe producir exception hacia el caller ni incorporar contenido no autorizado al handoff.

## 9. Fuera de alcance

Permanece OPEN y no debe tocarse en I1:

- observability delivery/sink;
- process/worker isolation;
- secret broker;
- CREDENTIAL_LEASE_CAPABILITY_V1;
- CREDENTIAL_LEASE_BINDING_ID_V1;
- TWO-PHASE CREDENTIAL PREFLIGHT;
- TRANSPORT_SESSION_V1;
- provider-call token/replay;
- provider/model/runtime selection;
- CANONICAL_JSON_SHA256_V2;
- hash bridge hacia E5;
- prototype-safe E5.1;
- MINIMAL_CHANGE_EXECUTABLE_RULE;
- repair-agent connection.

## 10. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-R17-IMPLEMENTATION-I1-SCOPE-ASC-001

MANDATORY RELATIONS:

- scope is a strict subset of validated R17;
- implementation receives only already-fixed bounded descriptors;
- event expansion remains outside this module;
- critical-window request always drops;
- no exception propagates to authoritative caller;
- no provider/model/broker/E5 side effects;
- implementation authorization does not authorize repair-agent connection.

DO NOT INFER:

- passing I1 validates the whole R17 implementation;
- I1 numeric limits become global defaults;
- handoff output is authoritative evidence;
- observability delivery is implemented;
- repair agent is connected.

PROHIBITED:

- provider/model invocation;
- network/filesystem I/O;
- durable write;
- E5 mutation;
- recursive arbitrary-object serialization;
- automatic retry;
- scope expansion without new review.

ASC_CONTRACT_COMPILATION = PASS.

## 11. AUDITORÍA

El alcance elegido es independiente de provider/model y de los OPEN más riesgosos de credenciales, replay, canonicalization y E5.

Permite obtener la primera evidencia ejecutable de R17 con una superficie pura y acotada.

## 12. INCONSISTENCIAS

No se detecta contradicción con R17 ni con la autorización humana vigente.

Los límites numéricos se definen como valores locales I1, evitando convertirlos en autoridad global.

## 13. VACÍOS / OMISIONES

I1 no prueba aislamiento de proceso/scheduling del sink. Solo materializa el handoff previo al delivery domain.

La validación final de I1 debe mantener esa limitación explícita.

## 14. REDUNDANCIAS

No se duplica E5, transport ni observability delivery.

El nuevo módulo implementa una frontera que todavía no existía en código.

## 15. Gate I1

```text
scope
→ implementation
→ directed/adversarial tests
→ CI evidence
→ audit
→ regression
→ implementation validation
```

Solo después de PASS puede cerrarse I1.

REPAIR_AGENT_CONNECTED = FALSE.
IMPLEMENTATION_READY = FALSE.
NEXT_STAGE_ID = OPEN.
AUTHORIZED_FOR_ASC = OPEN.
