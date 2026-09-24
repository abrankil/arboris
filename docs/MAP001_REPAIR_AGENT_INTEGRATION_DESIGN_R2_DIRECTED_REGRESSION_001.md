# MAP-001 — Repair Agent Integration Design R2 — Directed Adversarial Regression 001

Fecha: 2026-09-23
Artefacto auditado: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_002.md
Head auditado: 6ced823101ab2206889a320a6dff7dc9747e403a
Ámbito: regresión dirigida RA-I1..RA-I8
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_AUTHORIZED: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## ASC

ASC v0.1 se usa solo en modo compile-only para preservar restricciones, OPEN, DO NOT INFER, prohibiciones y criterios.

TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-R2-DIRECTED-REGRESSION-001

ASC no decide PASS/FAIL técnico ni autoriza implementación.

## AUDITORÍA

R2 corrige materialmente R1: provenance exacta, correlación request/response, rebind post-response, minimalChangeRequired explícitamente OPEN y bloqueante, data-not-command, resource policy, strict JSON y separación agent/model vs adapter.

La regresión dirigida encuentra tres brechas materiales nuevas dentro de RA-I2, RA-I5 y RA-I8.

## Resultado dirigido

~~~text
RA-I1  PASS
RA-I2  PARTIAL / BLOCKER
RA-I3  PASS ON ORDERING; DEPENDS ON RA-I2 BINDING PRIMITIVE
RA-I4  PASS AS OPEN/BLOCKING, WITHOUT INFERENCE
RA-I5  FAIL / BLOCKER
RA-I6  PASS AT DESIGN REQUIREMENT LEVEL
RA-I7  PASS ON STRICT-PARSE REQUIREMENTS; LAYER CLARIFICATION REQUIRED
RA-I8  FAIL / BLOCKER
~~~

## R2-N1 — response layering and digest semantics

R2 declara un envelope adapter-owned con requestId, requestDigest, inputBindingDigest, providerInvocationBinding, hashes de response, responseKind y payload. Pero la secuencia posterior dice raw response bytes → strict parse → validate response envelope, aunque el mismo diseño impide que el modelo controle esos campos.

Debe separar:

~~~text
MODEL_RESPONSE
- bytes exactos del provider/model
- strict parsed
- contiene solo respuesta agent-owned

INTEGRATION_ATTEMPT_RECORD
- construido por adapter/resolver
- contiene correlación y hashes
- nunca se toma de campos producidos por el modelo
~~~

Además debe congelar:

~~~text
requestDigest
= SHA-256 de los bytes UTF-8 exactos enviados al proveedor

inputBindingDigest
= SHA-256 lógico/canónico de un objeto de bindings con campos explícitos
~~~

La respuesta debe ligarse al handle de invocación en la capa de transporte, no mediante un requestId repetido por el modelo.

RA-I2 permanece bloqueante hasta resolverlo.

## RA-I3

La secuencia de reread/rebind post-response está correctamente especificada y E5.2/E5.3 mantienen verificaciones posteriores. No se detecta regresión de orden TOCTOU.

Su prueba de identidad exacta de respuesta depende de R2-N1.

## RA-I4

R2 no afirma que E5.1 pruebe minimalidad y conserva:

~~~text
MINIMAL_CHANGE_EXECUTABLE_RULE = OPEN
IMPLEMENTATION_BLOCKED_UNTIL_RESOLVED = TRUE
~~~

PASS como OPEN bloqueante, sin inferencia.

## R2-N2 — prototype-safe JSON mutation

La regla ALL AGENT-PRODUCED CONTENT IS DATA no está completamente garantizada por el runtime vigente de E5.1.

Repair R1 permite un JSON Pointer con token __proto__. En una operación add sobre objeto, E5.1 usa asignación directa parent[key] = value cuando Object.hasOwn(parent,key) es false. Para key=__proto__ en un objeto JavaScript normal, esa asignación puede mutar el prototype en vez de crear una propiedad JSON propia.

Antes de cerrar RA-I5 debe existir una estrategia prototype-safe, por ejemplo una primitiva que cree solo own data properties, objetos sin prototype, una restricción estructural equivalente, u otra solución demostrada.

Pruebas adversariales mínimas:

~~~text
add /__proto__
nested __proto__
constructor/prototype edge cases
serialization after patch
post-gate reconstruction equivalence
~~~

R2-N2 es un blocker de diseño antes de integración ejecutable.

## RA-I6

R2 exige límites de request/response, operaciones, strings, profundidad, nodos, valor, timeout y cancellation; no admite defaults ilimitados.

PASS a nivel de requisito de diseño. En R3 debe quedar explícito que maxRequestBytes se verifica antes de provider invocation.

## RA-I7

La política strict JSON es suficiente como requisito: un objeto exacto, UTF-8 válido, sin fences/texto envolvente, duplicate keys rechazadas, sin coerción o reparación y hash raw antes de parse.

PASS, sujeto a aclarar en R2-N1 cuál objeto proviene del modelo y cuál es construido por el adapter.

## R2-N3 — capability split

R2 separa agent/model de integration adapter, pero el adapter todavía concentra provider network + provider secrets y capacidad local para ejecutar gates que llegan a E5.3.

Debe separar al menos tres dominios:

~~~text
1. RESOLVER / ORCHESTRATOR
   - estado, bindings, IDs/control-plane
   - E5.1/E5.2/E5.3
   - sin exponer secrets al modelo

2. PROVIDER TRANSPORT ADAPTER
   - bounded request bytes
   - egress allowlisted + secret broker
   - raw response bytes + transport binding
   - sin repo/run-state/E5/durable-store access

3. AGENT / MODEL CONTEXT
   - bounded request content
   - sin tools/capabilities/secrets
   - model response only
~~~

Una implementación futura puede combinar procesos físicos solo si demuestra una separación de capacidades equivalente.

RA-I8 permanece bloqueante.

## INCONSISTENCIAS

Existe mezcla entre envelope adapter-owned y response envelope supuestamente parseado desde raw model output.

También existe tensión entre data-only y la semántica JavaScript actual de add sobre __proto__.

## VACÍOS / OMISIONES

Nuevos vacíos:

~~~text
R2-N1 model-response vs integration-record layering
R2-N1 requestDigest byte semantics
R2-N1 inputBindingDigest canonical field set
R2-N2 prototype-safe JSON Pointer mutation
R2-N2 adversarial special-key tests
R2-N3 resolver/transport/model capability split
R2-N3 transport binding semantics
~~~

Se preservan todos los OPEN ya declarados por R2.

## REDUNDANCIAS

La defensa en profundidad permanece intencional:

~~~text
pre-invocation check
+ post-response rebind
+ E5.2 pin/context validation
+ E5.3 fresh reconstruction/CAS

strict response parse
+ Repair R1 schema
+ E5.1 semantic gate
~~~

No introduce nueva autoridad.

## Resultado

~~~text
NEW_FINDINGS:
R2-N1 response-layer + digest semantics
R2-N2 prototype-safe JSON mutation
R2-N3 resolver/transport/model capability split

NEW_BLOCKING_FINDINGS = 3
R2_DIRECTED_REGRESSION = CORRECTION_REQUIRED
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
~~~

## Gate siguiente

Procede exclusivamente una R3 documental que corrija R2-N1..R2-N3. Después debe ejecutarse regresión dirigida N1/N2/N3 + RA-I1..RA-I8 y solo entonces validar el diseño.

No corresponde implementar adapter, sandbox, provider ni conectar repair agent.
