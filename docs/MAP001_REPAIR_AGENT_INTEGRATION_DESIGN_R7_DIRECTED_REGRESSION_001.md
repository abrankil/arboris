# MAP-001 — Repair Agent Integration Design R7 — Directed Regression 001

Fecha: 2026-09-23
Artefacto auditado: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_007.md
Head auditado: 736aadf5a39b688305679d78026f54fba3eb8eb8
Ámbito: R6-N1/R6-N2/R6-N3 + regresión acumulada R5-N1..R5-N3 + R4-N1/R4-N2 + R3-N1/R3-N2 + R2-N1..R2-N3 + RA-I1..RA-I8
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_AUTHORIZED: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Apoyo ASC v0.1

ASC v0.1 se usa únicamente en modo compile-only para preservar restricciones, OPEN, DO NOT INFER, prohibiciones y criterios.

TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-R7-DIRECTED-REGRESSION-001

ASC no decide PASS/FAIL técnico ni autoriza implementación.

## 2. AUDITORÍA

R7 corrige materialmente dos de las tres brechas principales de R6 y mejora la tercera:

~~~text
R6-N1
→ BYTE_STRING_V1 elimina dependencia de Buffer/Uint8Array
  dentro de artefactos sujetos a logicalSha256.

R6-N2
→ resolver calcula EXPECTED_PROVIDER_REQUEST_ENVELOPE_V2
  y expectedProviderRequestEnvelopeDigest antes de transport;
→ transport reconstruye ACTUAL_PROVIDER_REQUEST_ENVELOPE_V2
  y exige expected == actual.

R6-N3
→ existe PROVIDER_RESPONSE_EXTRACTION_POLICY_V1;
→ response extraction se fija antes del provider call;
→ OBSERVED_PROVIDER_RESPONSE_V1 y EXTRACTED_MODEL_RESPONSE_V1
  separan evidencia observable y parser input.
~~~

La regresión encuentra dos bloqueos nuevos dentro de la cadena inbound y resource bounding, más una ambigüedad documental menor de canonical base64.

## 3. Resultado dirigido

~~~text
R6-N1 = PASS SUBJECT TO R7-N3 WORDING CLARIFICATION
R6-N2 = PASS
R6-N3 = PARTIAL / BLOCKED BY R7-N1

R5-N1 = PASS
R5-N2 = PASS AT DESIGN LEVEL
R5-N3 = PASS

R4-N1 = PASS AT DESIGN LEVEL
R4-N2 = PASS
R3-N1 = PASS AT DESIGN LEVEL / PROVIDER-SPECIFIC VALUES OPEN
R3-N2 = PASS

R2-N1 = PASS
R2-N2 = PASS AT DESIGN LEVEL / EXECUTABLE DEBT OPEN
R2-N3 = PASS

RA-I1 = PARTIAL / RESPONSE-EVIDENCE BINDING INCOMPLETE
RA-I2 = PASS
RA-I3 = PASS
RA-I4 = PASS AS OPEN/BLOCKING
RA-I5 = PASS AT DESIGN LEVEL / IMPLEMENTATION OPEN
RA-I6 = PARTIAL / BLOCKED BY R7-N2
RA-I7 = PARTIAL / BLOCKED BY R7-N1
RA-I8 = PASS
~~~

## 4. R6-N1 — PASS

R7 separa correctamente:

~~~text
raw content identity
= BYTE_STRING_V1.sha256

logical artifact identity
= logicalSha256(canonical JSON containing BYTE_STRING_V1)
~~~

y prohíbe tipos runtime de bytes dentro de objetos sujetos a logicalSha256.

Esto resuelve el problema central de R6-N1.

La única corrección pendiente es de wording canónico de padding base64, registrada como R7-N3.

## 5. R6-N2 — PASS

R7 introduce un expected binding independiente:

~~~text
resolver
→ EXPECTED_PROVIDER_REQUEST_ENVELOPE_V2
→ expectedProviderRequestEnvelopeDigest

transport
→ ACTUAL_PROVIDER_REQUEST_ENVELOPE_V2
→ actualProviderRequestEnvelopeDigest

required:
expected == actual
and
deep logical equality
~~~

El expected digest existe antes de que transport materialice la solicitud final.

La auto-declaración detectada en R6-N2 queda resuelta a nivel de diseño.

## 6. R7-N1 — observed response evidence is already post-selection and is not independently replayable

R7 define selectedContentLocator como la regla que debe elegir el contenido relevante desde la respuesta observable del provider/SDK.

Pero OBSERVED_PROVIDER_RESPONSE_V1 almacena por unit:

~~~text
selectedContent
selectedMetadata
~~~

Es decir, el record denominado observed provider response ya contiene el resultado de una selección.

No contiene necesariamente la representación observable previa suficiente para volver a aplicar selectedContentLocator.

Además, TRANSPORT_RECEIPT_V4 incluye:

~~~text
observedProviderResponseDigest
extractedModelResponse
~~~

pero no incluye OBSERVED_PROVIDER_RESPONSE_V1 completo ni una referencia resolver-accessible a ese artefacto.

Por tanto resolver puede verificar que:

~~~text
extractedModelResponse.observedProviderResponseDigest
== receipt.observedProviderResponseDigest
~~~

pero no puede recomputar de forma independiente:

~~~text
observedProviderResponseDigest
nor
PROVIDER_RESPONSE_EXTRACTION_POLICY_V1(observed evidence)
== extractedModelResponse
~~~

### Impacto

La cadena:

~~~text
observable provider/SDK response
→ selected content
→ extracted MODEL_RESPONSE bytes
~~~

sigue dependiendo de una auto-declaración de transport en el tramo más importante de extracción.

Esto deja incompleta la corrección de R6-N3 y RA-I7.

### Corrección requerida

Debe existir un artefacto anterior a la selección, equivalente a:

~~~text
PROVIDER_OBSERVATION_RECORD_V1
~~~

que preserve de forma canónica y acotada la información observable necesaria para volver a ejecutar la extraction policy.

Debe distinguir:

~~~text
OBSERVATION
→ what was observable at declared boundary

EXTRACTION
→ deterministic selection/ordering/concatenation

EXTRACTED MODEL RESPONSE
→ exact parser input bytes
~~~

Resolver debe recibir:

~~~text
the observation record itself
or
a resolver-accessible immutable artifact reference + exact digest
~~~

de modo que pueda:

~~~text
recompute observation digest
reapply response extraction policy
recompute extractedModelResponseSha256
compare with transport receipt
~~~

Si el record completo contiene metadata sensible, debe existir una observation projection policy separada, provenance-bound y suficiente para replay de extraction; no se permite sanitizar de forma ad hoc después del hecho.

R7-N1 es BLOCKER.

## 7. R7-N2 — new response-evidence surfaces are not explicitly resource-bounded

R2/R3 habían establecido límites de request/response, JSON depth, node count, strings, timeout y cancellation.

R7 introduce nuevas superficies potencialmente grandes:

~~~text
BYTE_STRING_V1.dataBase64
OBSERVED_PROVIDER_RESPONSE_V1.units
selectedMetadata
materialized stream evidence
EXTRACTED_MODEL_RESPONSE_V1
TRANSPORT_RECEIPT_V4
~~~

La secuencia R7 no vuelve explícito cómo resourcePolicy limita estas nuevas estructuras antes de retenerlas, base64-encodearlas, logical-hashearlas o devolverlas al resolver.

En STREAM mode, un provider puede producir un número elevado de events/chunks aun cuando cada unit individual sea pequeño.

### Impacto

Puede existir agotamiento de memoria o crecimiento no acotado antes de llegar al strict parser, reabriendo parcialmente RA-I6.

El problema no es solo maxRawResponseBytes: la evidencia canónica y base64 tiene overhead propio y puede incluir metadata/units adicionales al contenido extraído.

### Corrección requerida

La resource policy debe cubrir, con valores concretos antes de implementación, al menos propiedades equivalentes a:

~~~text
maxObservedResponseDecodedBytes
maxObservedResponseEncodedBytes
maxResponseUnits
maxSingleResponseUnitBytes
maxSelectedMetadataBytes
maxObservationRecordBytes
maxExtractedModelResponseBytes
maxTransportReceiptBytes
~~~

y debe fijar orden de enforcement:

~~~text
stream cumulative limits during receipt
→ before retaining unbounded units
→ before base64 materialization where possible
→ before logical hashing of oversized evidence
→ before returning receipt
→ resolver rechecks receipt/extracted limits before parse
~~~

Los nombres exactos pueden variar; la cobertura no.

R7-N2 es BLOCKER.

## 8. R7-N3 — canonical padded base64 wording is ambiguous

BYTE_STRING_V1 declara:

~~~text
encoding = BASE64_RFC4648_PADDED
padding obligatorio
~~~

RFC 4648 canonical base64 puede terminar con:

~~~text
0, 1 o 2 "="
~~~

según el byte length.

Para longitudes múltiplo de 3, la representación canónica no lleva "=".

La frase padding obligatorio puede interpretarse erróneamente como exigir al menos un carácter "=".

### Corrección requerida

Definir:

~~~text
padding is canonical RFC 4648 padding:
- exactly 0, 1, or 2 "=" as required by input length;
- no superfluous padding;
- decode + canonical re-encode exact equality remains mandatory.
~~~

R7-N3 es inconsistencia documental, no bloqueo arquitectónico independiente.

## 9. R5-N1 — PASS

Con BYTE_STRING_V1 + MATERIALIZED_MESSAGE_PLAN_V2, cada mensaje tiene una representación canónica y consumible sin repo lookup.

Role/provider-role y source binding continúan explícitos.

## 10. R5-N2 — PASS AT DESIGN LEVEL

El provider request final tiene expected/actual envelope y digest independiente.

La limitación frente a transformaciones ocultas del SDK sigue declarada, correctamente.

## 11. R5-N3 / R4-N2 / R3-N2 — PASS

Se preservan:

~~~text
MODEL_INVOCATION_POLICY_V2 como única policy normativa
semantic/provider role binding
ordering/framing/request placement
PATCH example estructuralmente válido
~~~

No se detecta reapertura.

## 12. R2-N1 — PASS

MODEL_RESPONSE, TRANSPORT_RECEIPT e INTEGRATION_ATTEMPT_RECORD permanecen separados.

El modelo no controla correlación ni control-plane.

## 13. R2-N2 — PASS AT DESIGN LEVEL

Se conserva:

~~~text
PROTOTYPE_SAFE_REPAIR_APPLICATION = OPEN
IMPLEMENTATION_BLOCKED = TRUE
~~~

No se afirma que E5.1 vigente ya esté corregido.

## 14. R2-N3 / RA-I8 — PASS

Resolver, transport y model context siguen separados por capacidades.

R7-N1 y R7-N2 no requieren fusionar dominios.

## 15. RA-I4 — PASS AS OPEN/BLOCKING

Se preserva:

~~~text
MINIMAL_CHANGE_EXECUTABLE_RULE = OPEN
IMPLEMENTATION_BLOCKED_UNTIL_RESOLVED = TRUE
~~~

No se infiere minimalidad.

## 16. RA-I5 — PASS AT DESIGN LEVEL

La regla data-only y prototype-safe permanece intacta.

La deuda ejecutable de E5.1 sigue visible.

## 17. RA-I6 — PARTIAL

Los límites históricos permanecen, pero las superficies de evidencia introducidas por R7 necesitan resource bounds explícitos y enforcement incremental.

RA-I6 no se considera completamente cerrado hasta resolver R7-N2.

## 18. RA-I7 — PARTIAL

Strict parsing sigue correctamente definido.

La brecha está antes del parser: resolver todavía no puede reproducir independientemente la selección/extracción desde la evidencia observable.

RA-I7 queda parcial por R7-N1.

## 19. INCONSISTENCIAS

Se detecta una inconsistencia documental menor en canonical base64 padding.

No se detecta contradicción nueva con Repair R1, E5.1, E5.2 o E5.3.

## 20. VACÍOS / OMISIONES

Nuevos vacíos:

~~~text
R7-N1 replayable pre-selection provider observation evidence
R7-N1 resolver-accessible observation record or immutable artifact
R7-N1 deterministic observation-projection policy if sanitization is needed

R7-N2 bounds for observation units/metadata/base64/receipt
R7-N2 incremental enforcement during streams

R7-N3 exact canonical base64 padding wording
~~~

Se mantienen OPEN:

~~~text
prototype-safe E5.1 rectification + tests
minimal-change executable rule or contract revision
provider/model/runtime
schemas concretos
provider-specific extraction values
hidden SDK/provider evidence
request projection
strict parser implementation
human implementation authorization
NEXT_STAGE_ID
AUTHORIZED_FOR_ASC
~~~

## 21. REDUNDANCIAS

No se detecta redundancia problemática.

Son defensas diferentes:

~~~text
BYTE_STRING content hash
logical artifact digest
expected/actual provider envelope
provider observation record
response extraction policy
extracted model response hash
receipt verification
post-response input rebind
E5.1/E5.2/E5.3
~~~

## 22. Resultado

~~~text
R6-N1 = RESOLVED
R6-N2 = RESOLVED
R6-N3 = PARTIAL

NEW FINDINGS
R7-N1 = BLOCKER — provider observation/extraction not independently replayable
R7-N2 = BLOCKER — new response evidence surfaces lack explicit resource bounds
R7-N3 = DOCUMENTARY INCONSISTENCY — canonical base64 padding wording

NEW_BLOCKING_FINDINGS = 2
NEW_DOCUMENTARY_FINDINGS = 1

R7_DIRECTED_REGRESSION = CORRECTION_REQUIRED
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
~~~

## 23. Gate siguiente

Procede exclusivamente una R8 documental que:

~~~text
1. separe observation record pre-selection de extraction result;
2. permita replay independiente de extraction por resolver;
3. extienda resourcePolicy a observation/stream/base64/receipt surfaces;
4. precise canonical RFC 4648 padding;
5. preserve R6-N1/R6-N2, R5-N1..R5-N3,
   R4-N1/R4-N2, R3-N1/R3-N2,
   R2-N1..R2-N3 y RA-I1..RA-I8;
6. no implemente todavía transport, provider, sandbox,
   E5.1 rectification ni repair agent.
~~~

Después debe ejecutarse regresión dirigida R7-N1/R7-N2/R7-N3 + regresión acumulada antes de validar el diseño.
