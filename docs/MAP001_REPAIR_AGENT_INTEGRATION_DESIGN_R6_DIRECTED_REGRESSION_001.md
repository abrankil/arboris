# MAP-001 — Repair Agent Integration Design R6 — Directed Regression 001

Fecha: 2026-09-23
Artefacto auditado: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_006.md
Head auditado: 5425c1fbc931c217a90dd6ec2250f32885107d18
Ámbito: R5-N1/R5-N2/R5-N3 + regresión acumulada R4-N1/R4-N2 + R3-N1/R3-N2 + R2-N1..R2-N3 + RA-I1..RA-I8
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_AUTHORIZED: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Apoyo ASC v0.1

ASC v0.1 se usa únicamente en modo compile-only para preservar restricciones, OPEN, DO NOT INFER, prohibiciones y criterios.

TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-R6-DIRECTED-REGRESSION-001

ASC no decide PASS/FAIL técnico ni autoriza implementación.

## 2. AUDITORÍA

R6 corrige materialmente:

~~~text
R5-N1
→ cada message item tiene contenido exacto, hash, semanticRole y providerRole;
→ la construction policy cruza resolver→transport ya resuelta.

R5-N2
→ existe PROVIDER_REQUEST_ENVELOPE_V1;
→ existe providerRequestEnvelopeDigest;
→ receipt y attempt record enlazan ese digest.

R5-N3
→ MODEL_INVOCATION_POLICY_V2 es la única policy normativa.
~~~

La regresión acumulada no detecta reapertura de R3-N2 ni R2-N1..R2-N3.

Se detectan tres brechas nuevas en fidelidad de bytes, evidencia del request final y procedencia de la respuesta recibida.

## 3. Resultado dirigido

~~~text
R5-N1 = PARTIAL / BLOCKED BY R6-N1
R5-N2 = PARTIAL / BLOCKED BY R6-N1 + R6-N2
R5-N3 = PASS

R4-N1 = PARTIAL
R4-N2 = PASS AT DESIGN-SEMANTIC LEVEL
R3-N1 = PARTIAL
R3-N2 = PASS

R2-N1 = PASS
R2-N2 = PASS AT DESIGN LEVEL / EXECUTABLE DEBT OPEN
R2-N3 = PASS

RA-I1 = PARTIAL / BLOCKED BY R6-N1 + R6-N2 + R6-N3
RA-I2 = PARTIAL / BLOCKED BY R6-N3
RA-I3 = PASS ON STATE ORDERING / RESPONSE PROVENANCE INCOMPLETE
RA-I4 = PASS AS OPEN/BLOCKING
RA-I5 = PASS AT DESIGN LEVEL / IMPLEMENTATION OPEN
RA-I6 = PASS AT DESIGN REQUIREMENT LEVEL
RA-I7 = PARTIAL / RESPONSE EXTRACTION BINDING MISSING
RA-I8 = PASS
~~~

## 4. R6-N1 — raw-byte values are not canonically representable in logicalSha256

R6 define:

~~~text
exactContentBytes = exact UTF-8 bytes
materializedMessagePlanSha256
= logicalSha256(MATERIALIZED_MESSAGE_PLAN_V1)

providerRequestEnvelopeDigest
= logicalSha256(PROVIDER_REQUEST_ENVELOPE_V1)
~~~

y ambos objetos contienen exactContentBytes.

La implementación vigente de logicalSha256 en tools/proposal-resolution/map001_validation_adapter_r1.mjs canoniza objetos JSON y luego aplica:

~~~text
JSON.stringify(canonicalize(value))
→ SHA-256
~~~

No existe en ese contrato una representación canónica de raw bytes.

Por tanto, si exactContentBytes se representa como Buffer, Uint8Array, array de enteros, UTF-8 string o base64, el logical hash puede cambiar aunque los bytes semánticos sean los mismos.

### Impacto

La propiedad:

~~~text
same exact bytes
→ same materializedMessagePlanSha256 / providerRequestEnvelopeDigest
~~~

no está todavía definida de forma portable ni inequívoca.

Esto afecta directamente la evidencia de handoff exacto que R6 pretende introducir.

### Corrección requerida

Debe separar explícitamente:

~~~text
transport payload bytes
vs.
canonical digest metadata
~~~

Una solución válida sería, por ejemplo:

~~~text
exactContentEncoding = UTF8
exactContent = canonical Unicode string with explicit normalization policy
exactContentSha256 = SHA-256(UTF-8 bytes)

logical plan/envelope digest
→ incluye exactContentSha256 + encoding metadata,
  no un tipo de raw bytes dependiente del runtime
~~~

o usar una representación base64 canónica con reglas exactas.

La elección concreta permanece por diseñar, pero debe existir una única representación serializable antes de aplicar logicalSha256.

R6-N1 es BLOCKER.

## 5. R6-N2 — providerRequestEnvelopeDigest no tiene expected binding independiente

R6 hace que transport construya PROVIDER_REQUEST_ENVELOPE_V1 y luego calcule:

~~~text
providerRequestEnvelopeDigest
= logicalSha256(PROVIDER_REQUEST_ENVELOPE_V1)
~~~

El digest aparece después en TRANSPORT_RECEIPT V3 y en INTEGRATION_ATTEMPT_RECORD.

Pero resolver no calcula ni recibe antes del provider call un expectedProviderRequestEnvelopeDigest, y el receipt tampoco contiene el provider request envelope completo para que resolver pueda recomputarlo de manera independiente.

Por tanto, durante post-response:

~~~text
resolver "verifica" providerRequestEnvelopeDigest
~~~

sin que R6 defina contra qué valor esperado se compara.

### Impacto

El digest puede convertirse en una auto-declaración del mismo componente que construyó el envelope, no en una prueba de handoff entre resolver y transport.

Esto deja incompleta la propiedad de que el request final consumido sea exactamente la materialización autorizada del package.

### Corrección requerida

Debe existir una de estas propiedades equivalentes:

~~~text
A.
resolver determina de forma pura el expected PROVIDER_REQUEST_ENVELOPE_V1
y envía expectedProviderRequestEnvelopeDigest en package;

o

B.
TRANSPORT_RECEIPT incluye la representación canónica no secreta
del provider request envelope y resolver recomputa/verifica el digest;

o

C.
otra prueba equivalente que permita al resolver verificar
el providerRequestEnvelopeDigest contra un expected binding independiente.
~~~

No se exige duplicar provider secrets ni wire bytes.

R6-N2 es BLOCKER.

## 6. R6-N3 — inbound provider-response extraction is not provenance-bound

TRANSPORT_RECEIPT V3 contiene:

~~~text
rawResponseBytes
providerRuntimeDescriptor
resolvedModelIdentifier, if exposed
providerRequestId, optional
~~~

y luego resolver aplica strict parsing sobre rawResponseBytes como MODEL_RESPONSE.

Pero R6 no define cómo se obtiene rawResponseBytes desde la respuesta real del provider/SDK.

En una API concreta, la respuesta puede ser:

~~~text
HTTP/provider envelope
→ streaming events/chunks
→ SDK object
→ content field(s)
→ extracted MODEL_RESPONSE bytes
~~~

La selección, concatenación, ordering, decoding y extracción de esos bytes puede cambiar el significado de la respuesta.

Transport está correctamente prohibido de interpretar agentPatch, pero sí debe extraer el contenido textual/estructurado que resolver parseará.

### Impacto

Sin una policy provenance-bound de extracción, dos implementaciones de transport pueden recibir la misma respuesta del provider y producir distintos rawResponseBytes.

También falta evidencia que enlace:

~~~text
provider response received
→ exact bytes handed to resolver
~~~

### Corrección requerida

Debe existir un contrato equivalente a:

~~~text
PROVIDER_RESPONSE_EXTRACTION_POLICY_V1

provider response mode
stream/non-stream mode
event/chunk ordering
selected content field/path
text encoding
concatenation/framing rules
empty/multiple output policy
error-object policy
metadata extraction policy
~~~

y una evidencia equivalente a:

~~~text
rawProviderResponseDigest or providerResponseEvidenceDigest
extractedModelResponseSha256
responseExtractionPolicyDigest
~~~

TRANSPORT_RECEIPT debe ligar esos valores al mismo transportInvocationId.

Si el SDK oculta el response envelope bruto o transforma streams de forma no observable, debe declararse como limitación explícita; no puede presentarse como raw provider-response fidelity.

R6-N3 es BLOCKER.

## 7. R5-N3 — PASS

R6 declara de forma inequívoca:

~~~text
MODEL_INVOCATION_POLICY_V2 = única policy normativa
V1 = antecedente histórico
~~~

y ordena rechazar V1 en un flujo R6.

No se detecta reapertura.

## 8. R4-N2 — PASS AT DESIGN-SEMANTIC LEVEL

R6 preserva y materializa:

~~~text
semanticRole
providerRole
sequence
request placement
resolved role mapping
resolved separator/framing
provider message construction
~~~

La semántica de placement ya no queda como un ID que transport deba resolver.

R6-N1 afecta representación/hash de bytes, no la existencia de esta semántica.

## 9. R2-N1 — PASS

MODEL_RESPONSE, TRANSPORT_RECEIPT e INTEGRATION_ATTEMPT_RECORD permanecen separados.

El modelo no controla metadata de correlación.

## 10. R2-N2 — PASS AT DESIGN LEVEL

Se preserva:

~~~text
PROTOTYPE_SAFE_REPAIR_APPLICATION = OPEN
IMPLEMENTATION_BLOCKED = TRUE
~~~

No se afirma que E5.1 vigente ya sea prototype-safe.

## 11. R2-N3 / RA-I8 — PASS

La separación sigue siendo:

~~~text
RESOLVER / ORCHESTRATOR
PROVIDER TRANSPORT ADAPTER
AGENT / MODEL CONTEXT
~~~

Los nuevos hallazgos no requieren fusionar dominios.

## 12. RA-I4 — PASS AS OPEN/BLOCKING

Se conserva:

~~~text
MINIMAL_CHANGE_EXECUTABLE_RULE = OPEN
IMPLEMENTATION_BLOCKED_UNTIL_RESOLVED = TRUE
~~~

No se infiere minimalidad.

## 13. RA-I5 — PASS AT DESIGN LEVEL

La regla data-only y prototype-safe sigue vigente como requisito.

La rectificación ejecutable E5.1 continúa OPEN.

## 14. RA-I6 — PASS AT DESIGN REQUIREMENT LEVEL

Resource policy sigue siendo obligatoria antes de provider invocation y antes de parse.

Valores concretos permanecen OPEN.

## 15. RA-I7 — PARTIAL

Strict parsing del MODEL_RESPONSE sigue bien definido.

La brecha nueva está antes del parser: falta demostrar que los bytes entregados al parser son la extracción exacta autorizada de la respuesta del provider.

Por eso RA-I7 no puede considerarse completamente cerrado hasta resolver R6-N3.

## 16. INCONSISTENCIAS

No se detecta contradicción nueva con Repair R1 ni E5.1/E5.2/E5.3.

Se detecta una inconsistencia semántica de hashing: R6 denomina exactContentBytes a valores que luego incorpora a logicalSha256 sin definir una representación JSON canónica de bytes.

## 17. VACÍOS / OMISIONES

Nuevos vacíos:

~~~text
R6-N1 canonical representation of exact bytes inside logical digests
R6-N2 independent expected binding for providerRequestEnvelopeDigest
R6-N3 provider response extraction policy
R6-N3 provider-response → extracted MODEL_RESPONSE evidence chain
~~~

Se mantienen OPEN los bloqueos previos:

~~~text
prototype-safe E5.1 rectification + tests
minimal-change executable rule or contract revision
provider/model/runtime
schemas finales
provider hidden layers
resource limits
strict parser implementation
request projection
human implementation authorization
NEXT_STAGE_ID
AUTHORIZED_FOR_ASC
~~~

## 18. REDUNDANCIAS

No se detecta redundancia problemática.

Siguen siendo defensas distintas:

~~~text
raw byte hashes
logical policy hashes
provider request envelope binding
transport receipt
response extraction binding
post-response domain rebind
E5.1/E5.2/E5.3
~~~

## 19. Resultado

~~~text
R5-N1 = PARTIAL
R5-N2 = PARTIAL
R5-N3 = RESOLVED

NEW FINDINGS
R6-N1 = BLOCKER — raw-byte canonicalization for logical digests undefined
R6-N2 = BLOCKER — provider request envelope digest lacks independent expected binding
R6-N3 = BLOCKER — provider response extraction/evidence not bound

NEW_BLOCKING_FINDINGS = 3

R6_DIRECTED_REGRESSION = CORRECTION_REQUIRED
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
~~~

## 20. Gate siguiente

Procede exclusivamente una R7 documental que:

~~~text
1. defina representación canónica de contenido byte-level para logical digests;
2. haga verificable por resolver el providerRequestEnvelopeDigest;
3. defina response extraction policy + evidence chain;
4. preserve R5-N3, R4-N2, R3-N2, R2-N1..R2-N3 y RA-I1..RA-I8;
5. no implemente todavía transport, provider, sandbox, E5.1 rectification ni repair agent.
~~~

Después debe ejecutarse regresión dirigida R6-N1/R6-N2/R6-N3 + regresión acumulada antes de validar el diseño.
