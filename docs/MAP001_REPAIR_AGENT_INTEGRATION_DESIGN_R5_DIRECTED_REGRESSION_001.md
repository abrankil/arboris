# MAP-001 — Repair Agent Integration Design R5 — Directed Regression 001

Fecha: 2026-09-23
Artefacto auditado: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_005.md
Head auditado: d00f2e1c915e64e2818f3f2ebdfedd09768488e2
Ámbito: R4-N1/R4-N2 + regresión acumulada R3-N1/R3-N2 + R2-N1..R2-N3 + RA-I1..RA-I8
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_AUTHORIZED: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Apoyo ASC v0.1

ASC v0.1 se usa únicamente en modo compile-only para preservar restricciones, OPEN, DO NOT INFER, prohibiciones y criterios de esta regresión.

TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-R5-DIRECTED-REGRESSION-001

ASC no decide PASS/FAIL técnico y no autoriza implementación.

## 2. AUDITORÍA

R5 corrige materialmente los dos hallazgos de R4:

~~~text
R4-N1
→ TRANSPORT_INVOCATION_PACKAGE_V1 transporta request, instruction bundle,
  model policy, resource policy y endpoint policy material;
→ transport ya no necesita leer repo ni reconstruir defaults locales.

R4-N2
→ MODEL_INVOCATION_POLICY_V2 fija messagePlan, requestPlacement y framingPolicy;
→ role/order/framing cambian modelInvocationPolicyDigest.
~~~

La regresión acumulada no detecta reapertura de R3-N2, R2-N1, R2-N2 o R2-N3.

Sin embargo, R5 todavía deja incompleta la materialización exacta de los mensajes consumidos por transport y no enlaza explícitamente el provider request final previo al SDK/API.

También contiene una inconsistencia documental V1/V2.

## 3. Resultado dirigido

~~~text
R4-N1 = PARTIAL / BLOCKED BY R5-N1 + R5-N2
R4-N2 = PARTIAL / BLOCKED BY R5-N1 + R5-N2

R3-N1 = PARTIAL
R3-N2 = PASS

R2-N1 = PASS
R2-N2 = PASS AT DESIGN LEVEL / EXECUTABLE DEBT OPEN
R2-N3 = PASS

RA-I1 = PARTIAL / BLOCKED BY R5-N1 + R5-N2
RA-I2 = PASS
RA-I3 = PASS, SUBJECT TO EXACT CONSUMED-REQUEST BINDING
RA-I4 = PASS AS OPEN/BLOCKING
RA-I5 = PASS AT DESIGN LEVEL / IMPLEMENTATION OPEN
RA-I6 = PASS AT DESIGN REQUIREMENT LEVEL
RA-I7 = PASS
RA-I8 = PASS
~~~

## 4. R5-N1 — message materialization is not uniquely derivable from the package

R5 define messagePlan items con:

~~~text
sequence
semanticRole
contentSource
exactContentSha256
~~~

donde contentSource puede ser:

~~~text
INSTRUCTION_BUNDLE_SLICE
REQUEST_BYTES
~~~

Pero para INSTRUCTION_BUNDLE_SLICE no existe un locator que identifique de forma inequívoca qué bytes de instructionBundleBytes corresponden al item.

El package entrega:

~~~text
instructionBundleBytes
assembledInstructionSha256
~~~

pero messagePlan no fija:

~~~text
byte offset + length
artifact/slice identifier
fragment identifier
exact content bytes
or another unambiguous extraction rule
~~~

Además, framingPolicy contiene:

~~~text
roleMappingVersion
separatorPolicy
providerMessageConstructionPolicy
~~~

pero R5 no distingue de forma suficiente entre:

~~~text
identifier/version of a policy
vs.
the complete resolved policy material transport must consume
~~~

Transport está prohibido de leer repo. Por tanto, si esos campos son solo IDs/versiones, no puede resolver la mapping/construction policy sin introducir configuración local implícita.

### Corrección requerida

Debe existir una representación que haga materializable cada message item exclusivamente desde TRANSPORT_INVOCATION_PACKAGE_V1.

Una forma válida sería:

~~~text
MESSAGE_ITEM_V1 = {
  sequence,
  semanticRole,
  providerRole,
  exactContentBytes,
  exactContentSha256
}
~~~

o, si se conservan slices:

~~~text
contentSource = {
  sourceKind,
  sourceSha256,
  byteOffset,
  byteLength
}
~~~

con regla de extracción determinista y verificada.

Asimismo, role mapping / separator / provider message construction deben llegar como:

~~~text
resolved policy material
+ exact digest
~~~

no como un identificador que obligue a transport a consultar configuración externa no bound.

R5-N1 es BLOCKER.

## 5. R5-N2 — no binding of the final outbound provider request

R5 demuestra identidad de:

~~~text
request bytes
instruction bundle bytes
model invocation policy
resource policy
endpoint policy
transport invocation
~~~

y exige que transport construya la llamada exclusivamente desde esos materiales.

Pero no define un artefacto final verificable que represente la solicitud efectivamente construida justo antes de entregarla al SDK/API del provider.

Sin este binding, un bug de implementación puede:

~~~text
drop a message
duplicate a message
reorder messages
use another provider role
omit a generation parameter
apply a different framing
~~~

después de verificar correctamente TRANSPORT_INVOCATION_PACKAGE_V1 y antes del provider call.

TRANSPORT_RECEIPT V2 solo declara hashes del package de origen; no enlaza el provider request materializado.

### Corrección requerida

Antes del provider call debe construirse una representación lógica/canónica equivalente a:

~~~text
PROVIDER_REQUEST_ENVELOPE_V1 = {
  providerConfigurationId,
  endpoint,
  modelIdentityRequest,
  orderedMessagesOrInstructions,
  generationParameters,
  responseContractConfiguration,
  providerFeatureConfiguration
}
~~~

y calcular:

~~~text
providerRequestEnvelopeDigest
=
logicalSha256(PROVIDER_REQUEST_ENVELOPE_V1)
~~~

El digest debe:

~~~text
- calcularse después de aplicar role mapping/framing;
- verificarse contra la policy/configuración autorizada;
- incorporarse a TRANSPORT_RECEIPT;
- incorporarse a INTEGRATION_ATTEMPT_RECORD;
- formar parte de la evidencia post-response.
~~~

Si el SDK/provider transforma posteriormente la representación de forma no observable, esa transformación debe quedar explícitamente clasificada como provider hidden-layer limitation; no puede presentarse como identidad exacta de wire bytes.

R5-N2 es BLOCKER.

## 6. R5-N3 — inconsistencia documental MODEL_INVOCATION_POLICY_V1 / V2

R5 §6 declara:

~~~text
MODEL_INVOCATION_POLICY_V2
MODEL_INVOCATION_POLICY_V1 queda histórico
la nueva validación usa V2
~~~

Pero §4.3 todavía define modelInvocationPolicy como:

~~~text
instancia completa exacta de MODEL_INVOCATION_POLICY_V1
usada para esa invocación
~~~

Esto contradice la propia evolución de R5 y hace ambiguo qué objeto debe verificar transport.

### Corrección requerida

§4.3 debe referirse exclusivamente a:

~~~text
MODEL_INVOCATION_POLICY_V2
~~~

y todo uso normativo de V1 debe quedar marcado solo como histórico.

R5-N3 es una inconsistencia documental, no una nueva decisión arquitectónica, pero debe corregirse antes de validar R5.

## 7. R3-N2 — PASS

El ejemplo PATCH heredado de R4 sigue siendo estructuralmente compatible con Repair R1 agentPatch:

~~~text
operations minItems >= 1
required operation fields present
replace includes expectedBefore + after
~~~

No se reabre R3-N2.

## 8. R2-N1 — PASS

MODEL_RESPONSE, TRANSPORT_RECEIPT e INTEGRATION_ATTEMPT_RECORD continúan separados.

El modelo no puede fijar requestId, transportInvocationId, digests ni control-plane.

## 9. R2-N2 — PASS AT DESIGN LEVEL

R5 preserva:

~~~text
JSON_OBJECT_MUTATION_USES_OWN_DATA_PROPERTY_SEMANTICS
PROTOTYPE_SAFE_REPAIR_APPLICATION = OPEN
IMPLEMENTATION_BLOCKED = TRUE
~~~

La implementación actual de E5.1 no se declara corregida.

## 10. R2-N3 — PASS

Se preservan tres dominios:

~~~text
RESOLVER / ORCHESTRATOR
PROVIDER TRANSPORT ADAPTER
AGENT / MODEL CONTEXT
~~~

R5-N1 y R5-N2 no requieren fusionarlos; requieren hacer más explícito el material que cruza y el request final construido.

## 11. RA-I1 — PARTIAL

La dependency closure de R5 es amplia e incluye:

~~~text
transport package schema
model invocation policy
role mapping
provider message construction policy
instruction artifacts
endpoint policy
~~~

Pero R5-N1 y R5-N2 muestran que todavía no se demuestra que esos artefactos provenance-bound sean exactamente los bytes/mensajes/policy material consumidos en la solicitud final.

RA-I1 permanece parcial.

## 12. RA-I2 — PASS

La correlación concreta sigue ligada a transportInvocationId y receipt, no a metadata model-authored.

No se reabre response/request ownership.

## 13. RA-I3 — PASS SUBJECT TO R5-N2

El post-response rebind sigue correcto en orden y vuelve a validar policy/input state antes de Repair R1.

Para cerrar completamente la identidad de la invocación debe incorporarse el providerRequestEnvelopeDigest de R5-N2.

## 14. RA-I4 — PASS AS OPEN/BLOCKING

Se preserva:

~~~text
MINIMAL_CHANGE_EXECUTABLE_RULE = OPEN
IMPLEMENTATION_BLOCKED_UNTIL_RESOLVED = TRUE
~~~

No se infiere minimalidad.

## 15. RA-I5 — PASS AT DESIGN LEVEL

La semántica data-only y prototype-safe sigue vigente como requisito.

La deuda ejecutable E5.1 permanece OPEN y bloqueante.

## 16. RA-I6 — PASS AT DESIGN REQUIREMENT LEVEL

La resource policy continúa cubriendo request bytes, response bytes, estructura, timeout y cancellation.

Los valores concretos permanecen OPEN antes de implementación.

## 17. RA-I7 — PASS

La frontera MODEL_RESPONSE strict-JSON no se modifica ni debilita.

## 18. RA-I8 — PASS

La separación resolver/transport/model permanece intacta.

Transport no adquiere repo/run-state/E5/durable-store access; resolver no adquiere provider secrets/arbitrary egress.

## 19. INCONSISTENCIAS

Se detecta una inconsistencia documental concreta:

~~~text
§4.3 → MODEL_INVOCATION_POLICY_V1
§6+  → MODEL_INVOCATION_POLICY_V2 es la policy vigente
~~~

No se detecta contradicción nueva con Repair R1 ni con E5.1/E5.2/E5.3.

## 20. VACÍOS / OMISIONES

Nuevos vacíos:

~~~text
R5-N1 unambiguous message-item content locator/material
R5-N1 resolved role-mapping/framing/construction material across boundary
R5-N2 final provider-request envelope binding
R5-N2 providerRequestEnvelopeDigest in receipt/attempt evidence
R5-N3 V1/V2 wording correction
~~~

Se mantienen OPEN:

~~~text
prototype-safe E5.1 rectification + tests
minimal-change executable rule or contract revision
provider/model/runtime
provider hidden layers
request projection
numeric resource limits
strict parser
final schemas
human implementation authorization
NEXT_STAGE_ID
AUTHORIZED_FOR_ASC
~~~

## 21. REDUNDANCIAS

No se detecta redundancia problemática.

Se consideran intencionales y distintas:

~~~text
source artifact hashes
assembled instruction hash
per-message content hash
modelInvocationPolicyDigest
providerRequestEnvelopeDigest
transportInvocationId
post-response rebind
E5.1/E5.2/E5.3
~~~

Cada una cubre una frontera diferente.

## 22. Resultado

~~~text
R4-N1 = PARTIAL
R4-N2 = PARTIAL

NEW FINDINGS
R5-N1 = BLOCKER — message materialization / resolved mapping material incomplete
R5-N2 = BLOCKER — final outbound provider request not bound
R5-N3 = DOCUMENTARY INCONSISTENCY — V1/V2 ambiguity

NEW_BLOCKING_FINDINGS = 2
NEW_DOCUMENTARY_FINDINGS = 1

R5_DIRECTED_REGRESSION = CORRECTION_REQUIRED
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
~~~

## 23. Gate siguiente

Procede exclusivamente una R6 documental que:

~~~text
1. haga materializable cada message item sin repo/default lookups;
2. lleve role mapping/framing/provider construction como material resuelto y bound;
3. defina el provider request envelope final y su digest;
4. corrija la referencia V1/V2;
5. preserve R3-N2, R2-N1..R2-N3 y RA-I1..RA-I8;
6. no implemente todavía transport, provider, sandbox, E5.1 rectification ni repair agent.
~~~

Después debe ejecutarse regresión dirigida R5-N1/R5-N2/R5-N3 + regresión acumulada antes de validar el diseño.
