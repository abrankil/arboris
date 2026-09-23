# MAP-001 — Repair Agent Integration Design R4 — Directed Regression 001

Fecha: 2026-09-23
Artefacto auditado: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_004.md
Head auditado: 158680248960328a01000f802858f8da1561eb48
Ámbito: R3-N1/R3-N2 + regresión R2-N1..R2-N3 + RA-I1..RA-I8
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_AUTHORIZED: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Apoyo ASC v0.1

ASC v0.1 se usa únicamente en modo compile-only para preservar restricciones, OPEN, DO NOT INFER, prohibiciones y criterios de la regresión.

TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-R4-DIRECTED-REGRESSION-001

ASC no decide PASS/FAIL técnico, no selecciona proveedor y no autoriza implementación.

## 2. AUDITORÍA

R4 corrige materialmente los hallazgos R3-N1 y R3-N2:

~~~text
R3-N1
→ MODEL_INVOCATION_POLICY_V1 existe;
→ instruction/configuration provenance queda representada;
→ modelInvocationPolicyDigest se propaga a input binding,
  attempt record y transport receipt;
→ los claims de reproducibilidad quedan acotados.

R3-N2
→ el ejemplo PATCH contiene una operación no vacía
  y satisface estructuralmente Repair R1 definitions.agentPatch.
~~~

La regresión no detecta reapertura de R2-N1, R2-N2 o R2-N3.

La revisión adversarial sí encuentra dos brechas nuevas dentro de la materialización exacta de MODEL_INVOCATION_POLICY_V1.

## 3. Resultado dirigido

~~~text
R3-N1 = PARTIAL / BLOCKED BY R4-N1 + R4-N2
R3-N2 = PASS

R2-N1 = PASS
R2-N2 = PASS AT DESIGN LEVEL / EXECUTABLE DEBT OPEN
R2-N3 = PASS

RA-I1 = PARTIAL / BLOCKED BY R4-N1 + R4-N2
RA-I2 = PASS
RA-I3 = PASS, SUBJECT TO EXACT INVOCATION BINDINGS
RA-I4 = PASS AS OPEN/BLOCKING
RA-I5 = PASS AT DESIGN LEVEL / IMPLEMENTATION OPEN
RA-I6 = PASS AT DESIGN REQUIREMENT LEVEL
RA-I7 = PASS
RA-I8 = PASS ON CAPABILITY SEPARATION / CHANNEL CONTRACT INCOMPLETE
~~~

## 4. R3-N2 — PASS

El ejemplo PATCH de R4 contiene:

~~~text
editId
operation=replace
targetPath
findingRefs
expectedBefore
after
rationale
~~~

y operations contiene al menos un elemento.

Esto satisface la forma estructural vigente de Repair R1 agentPatch.

R4 además aclara correctamente que el ejemplo no prueba finding existence, scope authorization, expectedBefore, minimality, domain PASS ni aceptación E5.1.

No se detecta reapertura de R3-N2.

## 5. R4-N1 — invocation material has no complete privileged-channel contract

R4 exige que instructionBundleBinding contenga assembledInstructionSha256 de los bytes exactos finalmente enviados al provider/model.

También exige que providerEndpointPolicyBinding y MODEL_INVOCATION_POLICY_V1 sean revalidados por transport.

Pero la frontera de capacidades heredada impide que PROVIDER TRANSPORT ADAPTER lea repo/authority files, y la secuencia de R4 solo declara que resolver envía:

~~~text
request bytes
+ digests
+ pinned provider configuration
~~~

No declara cómo transport recibe:

~~~text
assembled instruction bytes
MODEL_INVOCATION_POLICY_V1 exact instance
provider endpoint policy material needed for local verification
resource policy values needed for transport enforcement
~~~

Un digest por sí solo permite comparar identidad, pero no entrega el material que transport debe usar o verificar.

Si transport reconstruye esos materiales desde repo, viola R2-N3/R3 capability separation.

Si transport usa configuración implícita propia, reabre R3-N1 porque la invocación efectiva puede diferir de lo que resolver hash-bound.

### Corrección requerida

Debe definirse un único paquete resolver-owned equivalente a:

~~~text
TRANSPORT_INVOCATION_PACKAGE_V1 = {
  transportInvocationId,
  requestBytes,
  requestPayloadSha256,
  instructionBundleBytes,
  assembledInstructionSha256,
  modelInvocationPolicy,
  modelInvocationPolicyDigest,
  resourcePolicy,
  providerEndpointPolicyMaterial,
  providerConfigurationId
}
~~~

Transport debe:

~~~text
- recibir el paquete por el único canal autorizado;
- verificar todos los hashes/digests antes del provider call;
- no obtener instruction/policy material desde repo;
- no sustituir material por defaults locales;
- usar exclusivamente el material validado del package + secret broker;
- devolver receipt ligado al mismo transportInvocationId y policy digest.
~~~

No se exige este nombre ni esta serialización exacta; sí se exige una frontera equivalente y verificable.

R4-N1 es BLOCKER para validación final del diseño.

## 6. R4-N2 — instruction/request role and framing semantics are not bound

R4 fija:

~~~text
orderedArtifacts
assembledInstructionSha256
requestDigest
~~~

pero no fija explícitamente la colocación semántica de esos bytes en la API/model context.

Los mismos textos pueden producir comportamiento distinto si se transmiten como:

~~~text
system instruction
developer instruction
user message
provider-specific instruction field
prefill
assistant prefix
structured context field
~~~

También pueden cambiar de semántica si cambia el framing entre múltiples instruction artifacts aunque la lista de raw hashes siga siendo la misma.

assemblyVersion por sí solo no permite auditar esa semántica si no se define qué rol/canal/framing representa.

### Corrección requerida

MODEL_INVOCATION_POLICY_V1 debe fijar un plan de mensajes/instrucciones equivalente a:

~~~text
messagePlan = [
  {
    sequence,
    semanticRole,
    contentSource,
    exactContentSha256
  }
]

requestPlacement = {
  semanticRole,
  sequence,
  exactRequestPayloadSha256
}

framingPolicy = {
  serializationVersion,
  roleMapping,
  separator/framing semantics
}
~~~

o una representación provider-specific equivalente.

Reglas requeridas:

~~~text
- role/channel is explicit;
- ordering is explicit;
- framing/assembly is explicit;
- request placement is explicit;
- transport cannot remap roles silently;
- role/framing drift changes modelInvocationPolicyDigest;
- hidden provider remapping remains an explicit OPEN limitation.
~~~

No basta con demostrar que los bytes son iguales; debe quedar bound cómo esos bytes entran en el contexto semántico de la invocación.

R4-N2 es BLOCKER para cerrar R3-N1.

## 7. R2-N1 — PASS

R4 preserva la separación:

~~~text
MODEL_RESPONSE
TRANSPORT_RECEIPT
INTEGRATION_ATTEMPT_RECORD
~~~

y no devuelve control de requestId/digests al modelo.

requestDigest e inputBindingDigest siguen teniendo semántica distinta y explícita.

R4-N1 no reabre ownership; detecta una omisión del material transportado entre dominios.

## 8. R2-N2 — PASS AT DESIGN LEVEL

R4 mantiene:

~~~text
JSON_OBJECT_MUTATION_USES_OWN_DATA_PROPERTY_SEMANTICS
PROTOTYPE_SAFE_REPAIR_APPLICATION = OPEN
IMPLEMENTATION_BLOCKED = TRUE
~~~

No se afirma que E5.1 actual ya esté rectificado.

La deuda ejecutable y sus tests continúan visibles.

## 9. R2-N3 — PASS

La separación lógica continúa siendo:

~~~text
RESOLVER / ORCHESTRATOR
PROVIDER TRANSPORT ADAPTER
AGENT / MODEL CONTEXT
~~~

No se vuelve a conceder repo/run/E5/durable access a transport ni secrets/egress arbitrario a resolver.

R4-N1 exige completar el canal entre esos dominios sin romper la separación.

## 10. RA-I1 — PARTIAL

La provenance documental es más fuerte que R3:

~~~text
MODEL_INVOCATION_POLICY
INSTRUCTION_ARTIFACTS
PROVIDER_ENDPOINT_POLICY
AGENT_RESPONSE_SCHEMA
RESOURCE_POLICY
transport/orchestrator implementations
~~~

quedan incluidos en el conjunto futuro de dependencies.

Sin embargo, R4-N1 y R4-N2 muestran que aún no está demostrado que el material exacto provenance-bound sea el material consumido con la misma semántica por transport/model.

Por tanto RA-I1 no puede cerrarse todavía.

## 11. RA-I2 — PASS

La correlación de una respuesta concreta sigue fuera de MODEL_RESPONSE y ligada a transportInvocationId/receipt.

No se detecta reuso de response bajo otro request o policy autorizado.

## 12. RA-I3 — PASS SUBJECT TO R4-N1/R4-N2

R4 conserva post-response rebind de:

~~~text
integration dependencies
MODEL_INVOCATION_POLICY_V1
modelInvocationPolicyDigest
INPUT_BINDING_V1
inputBindingDigest
READY_TO_REPAIR/report/findings
~~~

El orden es correcto.

La exactitud de la policy revalidada depende de que R4-N1/R4-N2 definan el material y semántica realmente usados en provider invocation.

## 13. RA-I4 — PASS AS OPEN/BLOCKING

Se conserva:

~~~text
MINIMAL_CHANGE_EXECUTABLE_RULE = OPEN
IMPLEMENTATION_BLOCKED_UNTIL_RESOLVED = TRUE
~~~

No se infiere minimalidad.

## 14. RA-I5 — PASS AT DESIGN LEVEL

La semántica prototype-safe sigue exigida y la implementación actual E5.1 permanece marcada como deuda ejecutable.

No se reabre data-not-command.

## 15. RA-I6 — PASS AT DESIGN REQUIREMENT LEVEL

R4 preserva límites de request/response/estructura, timeout y cancellation, sin defaults ilimitados.

Los valores concretos siguen OPEN y bloqueantes antes de implementación.

## 16. RA-I7 — PASS

MODEL_RESPONSE sigue sujeto a strict parsing, schema separado, duplicate-key rejection, no coercion y no repair.

La corrección del ejemplo PATCH elimina la inconsistencia R3-N2.

## 17. RA-I8 — PASS ON CAPABILITY SEPARATION / CHANNEL INCOMPLETE

Los tres dominios de capacidad siguen correctamente separados.

R4-N1 no exige fusionarlos; exige definir el package explícito que puede cruzar RESOLVER → TRANSPORT.

Por tanto la separación de privilegios pasa, pero la integración aún no es ejecutable.

## 18. INCONSISTENCIAS

No se detecta contradicción nueva con Repair R1 o E5.1/E5.2/E5.3.

La inconsistencia funcional de R4 está entre:

~~~text
transport must verify/use exact instruction and policy material
vs.
transport cannot read repo
vs.
the declared channel does not carry that material
~~~

Esto debe resolverse documentalmente antes de validar el diseño.

## 19. VACÍOS / OMISIONES

Nuevos vacíos bloqueantes:

~~~text
R4-N1 explicit RESOLVER → TRANSPORT invocation package
R4-N1 exact transport verification/use contract
R4-N2 semantic role/channel binding for instructions
R4-N2 request placement binding
R4-N2 framing/serialization semantics
~~~

Se preservan los OPEN anteriores, especialmente:

~~~text
prototype-safe E5.1 rectification + tests
minimal-change executable rule or contract revision
provider/model/runtime
hidden provider limitations
request projection
numeric resource limits
strict parser implementation
final schemas
human implementation authorization
NEXT_STAGE_ID
AUTHORIZED_FOR_ASC
~~~

## 20. REDUNDANCIAS

No se detecta redundancia problemática.

Son defensas intencionales y no equivalentes:

~~~text
requestDigest
inputBindingDigest
modelInvocationPolicyDigest
transportInvocationId
exact invocation package verification
post-response rebind
E5.1/E5.2/E5.3
~~~

## 21. Resultado

~~~text
R3-N1 = PARTIAL
R3-N2 = RESOLVED

NEW FINDINGS
R4-N1 = BLOCKER — invocation material/channel contract incomplete
R4-N2 = BLOCKER — semantic role/framing/request placement not bound

NEW_BLOCKING_FINDINGS = 2

R4_DIRECTED_REGRESSION = CORRECTION_REQUIRED
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
~~~

## 22. Gate siguiente

Procede exclusivamente una R5 documental que:

~~~text
1. defina la frontera RESOLVER → TRANSPORT con material exacto y verificable;
2. fije role/channel/framing y request placement dentro de MODEL_INVOCATION_POLICY;
3. preserve R3-N2, R2-N1..R2-N3 y RA-I1..RA-I8;
4. no implemente todavía transport, provider, sandbox, E5.1 rectification ni repair agent.
~~~

Después debe ejecutarse regresión dirigida R4-N1/R4-N2 + regresión acumulada antes de validar el diseño.
