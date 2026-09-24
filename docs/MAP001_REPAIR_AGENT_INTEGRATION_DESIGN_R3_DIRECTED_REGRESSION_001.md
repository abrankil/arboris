# MAP-001 — Repair Agent Integration Design R3 — Directed Regression 001

Fecha: 2026-09-23
Artefacto auditado: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_003.md
Head auditado: a31ec107d241c1994309d5b4d851385232493ce8
Ámbito: R2-N1, R2-N2, R2-N3 + regresión RA-I1..RA-I8
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_AUTHORIZED: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Apoyo ASC v0.1

ASC v0.1 se usa únicamente en modo compile-only para preservar restricciones, OPEN, DO NOT INFER, prohibiciones y criterios de validación.

TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-R3-DIRECTED-REGRESSION-001

ASC no decide la corrección técnica ni autoriza implementación.

## 2. AUDITORÍA

R3 corrige documentalmente los tres hallazgos R2-N1..R2-N3:

~~~text
R2-N1
MODEL_RESPONSE, TRANSPORT_RECEIPT e INTEGRATION_ATTEMPT_RECORD
quedan separados y requestDigest/inputBindingDigest tienen semántica explícita.

R2-N2
la futura aplicación de JSON Pointer queda obligada a usar own-data-property semantics
y la deuda ejecutable actual de E5.1 permanece visible y bloqueante.

R2-N3
resolver/orchestrator, provider transport adapter y agent/model context
quedan separados por capacidades y canales.
~~~

Las fronteras E5.1 → E5.2 → E5.3 permanecen intactas.

La regresión encuentra un nuevo bloqueo de provenance/model invocation y una inconsistencia documental menor en el ejemplo PATCH.

## 3. Resultado R2-N1..R2-N3

~~~text
R2-N1 = PASS
R2-N2 = PASS AS DESIGN CORRECTION / EXECUTABLE DEBT REMAINS OPEN
R2-N3 = PASS
~~~

R2-N2 no implica que E5.1 ya sea prototype-safe. R3 declara correctamente que la rectificación ejecutable y sus tests siguen pendientes antes de implementación del agente.

## 4. Regresión RA-I1..RA-I8

~~~text
RA-I1  PARTIAL / NEW BLOCKER R3-N1
RA-I2  PASS
RA-I3  PASS
RA-I4  PASS AS OPEN/BLOCKING
RA-I5  PASS AS DESIGN REQUIREMENT / IMPLEMENTATION OPEN
RA-I6  PASS AT DESIGN REQUIREMENT LEVEL
RA-I7  PASS WITH DOCUMENTARY INCONSISTENCY R3-N2
RA-I8  PASS
~~~

## 5. R3-N1 — model invocation semantics not bound

R3 fija correctamente:

~~~text
requestDigest
= exact deterministic bounded request bytes

inputBindingDigest
= logicalSha256(INPUT_BINDING_V1)
~~~

y separa transport/model/resolver.

Sin embargo, los hashes no fijan todavía la invocación semántica completa que recibe el modelo.

Un provider invocation puede depender, además del bounded request, de:

~~~text
model identifier/version
system/developer instruction or agent instruction template
structured-output / response-schema configuration
sampling or determinism parameters
provider feature flags affecting generation
provider endpoint/configuration selected
~~~

R3 menciona providerRuntimeDescriptor y pinned provider configuration identifier, pero no define un binding criptográfico o lógico que pruebe que esos parámetros e instrucciones son exactamente los autorizados para la invocación.

Esto deja una brecha: dos invocaciones con el mismo requestDigest e inputBindingDigest pueden ejecutar instrucciones/modelos/configuraciones distintas y seguir pareciendo el mismo intento desde los bindings actuales.

### Corrección requerida

Debe existir un artefacto lógico versionado equivalente a:

~~~text
MODEL_INVOCATION_POLICY_V1 = {
  modelId,
  modelVersionOrResolvedIdentifier,
  instructionArtifact: {
    dependencyId,
    canonicalPath,
    rawSha256
  },
  responseSchemaBinding,
  generationParameters,
  providerConfigurationId,
  endpointPolicyBinding
}
~~~

y un:

~~~text
modelInvocationPolicyDigest
= logicalSha256(MODEL_INVOCATION_POLICY_V1)
~~~

Ese digest debe:

~~~text
- entrar en INPUT_BINDING_V1;
- entrar en INTEGRATION_ATTEMPT_RECORD;
- ser verificado por transport antes de la llamada;
- quedar reflejado en TRANSPORT_RECEIPT mediante el mismo digest;
- ser revalidado después de la respuesta antes de Repair R1.
~~~

Si el proveedor no permite fijar una versión exacta del modelo, esa limitación debe quedar explícitamente OPEN y la evidencia no debe presentarse como reproducibilidad exacta.

El instruction artifact o policy no puede quedar implícito en código no identificado. Debe formar parte de provenance exacta.

R3-N1 es BLOCKER para validación final del diseño.

## 6. R3-N2 — PATCH example contradicts agentPatch

R3 dice que MODEL_RESPONSE con responseKind=PATCH debe contener un payload que valide exactamente como Repair R1 definitions.agentPatch.

Pero el ejemplo normativo muestra:

~~~json
{
  "responseKind": "PATCH",
  "payload": {
    "operations": []
  }
}
~~~

Repair R1 exige operations con minItems=1.

Por tanto el ejemplo PATCH de R3 es inválido según la propia autoridad que el diseño dice respetar.

### Corrección requerida

El ejemplo debe contener al menos una operación estructuralmente válida, o declararse explícitamente pseudocódigo no válido. La opción más segura es usar un ejemplo válido contra el schema vigente.

R3-N2 es una inconsistencia documental no arquitectónica, pero debe corregirse antes de validar el diseño.

## 7. RA-I2 — PASS

La respuesta ya no se correlaciona mediante campos repetidos por el modelo.

R3 usa:

~~~text
transportInvocationId
requestPayloadSha256
same invocation handle
TRANSPORT_RECEIPT
INTEGRATION_ATTEMPT_RECORD
~~~

MODEL_RESPONSE no puede fijar requestId, digests ni metadata de transporte.

El finding original de request/response ownership queda resuelto.

R3-N1 no reabre esta propiedad; afecta la integridad de la configuración semántica de la invocación.

## 8. RA-I3 — PASS

R3 mantiene una secuencia explícita post-response:

~~~text
receipt verification
→ raw hash
→ strict parse
→ response validation
→ durable reread
→ parent/report rebinding
→ provenance recheck
→ INPUT_BINDING_V1 recomputation
→ READY_TO_REPAIR/report/finding checks
→ Repair R1
→ E5.1
→ E5.2
→ E5.3
~~~

No se detecta reapertura del TOCTOU original.

La futura corrección R3-N1 debe insertarse en ese mismo recheck de provenance, no crear una ruta paralela.

## 9. RA-I4 — PASS AS OPEN/BLOCKING

R3 conserva:

~~~text
MINIMAL_CHANGE_EXECUTABLE_RULE = OPEN
IMPLEMENTATION_BLOCKED_UNTIL_RESOLVED = TRUE
~~~

No afirma minimalidad a partir de scope ni prototype safety.

## 10. RA-I5 — PASS AS DESIGN REQUIREMENT

R3 exige own-property traversal y own-data-property write semantics, evita setters heredados y no convierte special keys en una blacklist arbitraria.

También deja explícito que E5.1 actual todavía requiere rectificación y tests.

Por tanto la corrección de diseño pasa sin afirmar que la implementación vigente ya esté resuelta.

## 11. RA-I6 — PASS AT DESIGN REQUIREMENT LEVEL

R3 exige doble control de maxRequestBytes antes de provider invocation y maxRawResponseBytes antes de parse, además de límites estructurales, timeout y cancellation.

Los valores numéricos continúan OPEN y bloquean implementación, correctamente.

## 12. RA-I7 — PASS SUBJECT TO R3-N2

La frontera strict JSON sigue siendo explícita:

~~~text
one JSON object
valid UTF-8
no fences/wrapping
duplicate keys rejected
unknown keys rejected
no coercion/repair
raw hash before parse
~~~

No se reabre la brecha de parsing.

R3-N2 es un ejemplo inválido, no una relajación de la regla strict parse.

## 13. RA-I8 — PASS

R3 separa tres dominios:

~~~text
RESOLVER / ORCHESTRATOR
PROVIDER TRANSPORT ADAPTER
AGENT / MODEL CONTEXT
~~~

Transport concentra únicamente secret/egress provider-side y no puede acceder al repo, run-state, E5 ni durable store.

Resolver conserva E5.1/E5.2/E5.3 y no posee provider secrets ni arbitrary egress.

Model context no recibe tools, secrets ni capacidades privilegiadas.

La co-location futura queda condicionada a demostrar separación equivalente; no se infiere.

## 14. INCONSISTENCIAS

Se detecta una inconsistencia documental concreta:

~~~text
PATCH payload example operations=[]
vs.
Repair R1 agentPatch operations minItems=1
~~~

No se detecta contradicción nueva con las fronteras E5.

## 15. VACÍOS / OMISIONES

Nuevo vacío bloqueante:

~~~text
R3-N1 exact model invocation policy/provenance binding
~~~

Debe cubrir como mínimo la identidad efectiva del modelo, instruction artifact, response schema/configuration, generation parameters y provider configuration relevantes.

Se mantienen OPEN:

~~~text
prototype-safe E5.1 implementation + tests
minimal-change executable rule or contract revision
deterministic request serializer/schema
request projection algorithm
provider/model/runtime selection
physical sandbox
numeric resource limits
strict parser implementation
final schemas
ID allocation
observability sink/retention
human implementation authorization
NEXT_STAGE_ID
AUTHORIZED_FOR_ASC
~~~

## 16. REDUNDANCIAS

No se detecta redundancia problemática.

Siguen siendo defensas diferentes:

~~~text
requestDigest
inputBindingDigest
modelInvocationPolicyDigest
transport correlation
post-response rebind
E5.2 validation
E5.3 reconstruction/CAS
~~~

Cada una cubre identidad de bytes, estado, configuración del modelo, transporte y autoridad ejecutable respectivamente.

## 17. Resultado

~~~text
R2-N1 = RESOLVED
R2-N2 = RESOLVED_AT_DESIGN_LEVEL / IMPLEMENTATION_OPEN
R2-N3 = RESOLVED

NEW FINDINGS
R3-N1 = BLOCKER — model invocation policy not bound
R3-N2 = DOCUMENTARY INCONSISTENCY — invalid PATCH example

NEW_BLOCKING_FINDINGS = 1
NEW_DOCUMENTARY_FINDINGS = 1

R3_DIRECTED_REGRESSION = CORRECTION_REQUIRED
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
~~~

## 18. Gate siguiente

Procede exclusivamente una R4 documental que:

~~~text
1. incorpore MODEL_INVOCATION_POLICY_V1 y su digest en provenance/bindings;
2. corrija el ejemplo PATCH para cumplir Repair R1;
3. preserve R2-N1..R2-N3 y RA-I1..RA-I8;
4. no implemente todavía adapter, provider, sandbox ni repair agent.
~~~

Después debe ejecutarse regresión dirigida R3-N1/R3-N2 + RA-I1..RA-I8 antes de validar el diseño.
