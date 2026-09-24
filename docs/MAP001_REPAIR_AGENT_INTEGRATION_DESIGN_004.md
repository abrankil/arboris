# MAP-001 — Repair Agent Integration Design 004

Fecha: 2026-09-23
Estado: R4_CANDIDATE_FOR_DIRECTED_REGRESSION
Baseline: main@63196dcf87b211f057a0f0b6f28d5a84098e2191
Deriva de: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_003.md
Auditoría de origen: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R3_DIRECTED_REGRESSION_001.md
Motivo de R4: corrección exclusiva de R3-N1 y R3-N2
NEXT_STAGE_ID: OPEN
REPAIR_AGENT_CONNECTED: FALSE
AUTHORIZED_FOR_ASC: OPEN
IMPLEMENTATION_AUTHORIZED: FALSE

## 1. Objetivo y alcance

R4 conserva las fronteras válidas de R3 y corrige únicamente:

~~~text
R3-N1
falta de binding explícito de la configuración semántica completa
de la invocación del modelo.

R3-N2
ejemplo PATCH inválido respecto de Repair R1 agentPatch.
~~~

R4 es exclusivamente documental.

No implementa provider, transport, parser, sandbox, adapter, agent, rectificación E5.1 ni full loop.

## 2. Invariantes heredados

Permanecen obligatorios:

~~~text
MODEL_RESPONSE != TRANSPORT_RECEIPT != INTEGRATION_ATTEMPT_RECORD

agent authority
= PROPOSE_AGENT_PATCH
or ABSTAIN_WITHOUT_MUTATION

Repair R1 control-plane
= resolver-owned

E5.1
= mandatory repair gate

E5.2
= mandatory run-context candidate layer

E5.3
= sole durable commit/recovery boundary

automaticRetries = 0

minimalChange executable rule
= OPEN / implementation-blocking

prototype-safe repair application
= OPEN / implementation-blocking until implemented and tested

all unresolved implementation choices
= OPEN
~~~

Ningún PASS de diseño autoriza implementación.

## 3. Corrección R3-N2 — ejemplo PATCH válido

MODEL_RESPONSE con PATCH debe validar exactamente contra el contrato agentPatch vigente.

Ejemplo estructuralmente válido:

~~~json
{
  "responseKind": "PATCH",
  "payload": {
    "operations": [
      {
        "editId": "EDIT-001",
        "operation": "replace",
        "targetPath": "/example/path",
        "findingRefs": ["FND-001"],
        "expectedBefore": "old-value",
        "after": "new-value",
        "rationale": "Apply the exact AUTO_REPAIR finding within its authorized target scope."
      }
    ]
  }
}
~~~

Este ejemplo solo demuestra forma estructural.

No demuestra:

~~~text
que FND-001 exista
que /example/path esté autorizado
que expectedBefore coincida
que el cambio sea mínimo
que el child pase validación de dominio
que el repair sea aceptado por E5.1
~~~

Esas propiedades permanecen sujetas a los gates vigentes.

ABSTAIN continúa siendo:

~~~json
{
  "responseKind": "ABSTAIN",
  "payload": null
}
~~~

## 4. R3-N1 — MODEL_INVOCATION_POLICY_V1

R4 introduce un objeto lógico versionado que fija la configuración semántica autorizada de una invocación del modelo.

~~~text
MODEL_INVOCATION_POLICY_V1 = {
  schemaVersion,
  providerConfigurationId,
  providerEndpointPolicyBinding,
  modelIdentityPolicy,
  instructionBundleBinding,
  responseContractBinding,
  generationParameters,
  providerFeatureBindings
}
~~~

La política es resolver-owned y no puede ser escrita ni modificada por el modelo.

## 5. Model identity policy

modelIdentityPolicy debe declarar explícitamente:

~~~text
requestedModelId
identityMode
resolvedModelIdentifierPolicy
~~~

identityMode solo puede ser una de:

~~~text
EXACT_PIN
PROVIDER_ALIAS_WITH_LIMITATION
~~~

### 5.1 EXACT_PIN

Requiere que el proveedor permita solicitar una identidad/version exacta y verificar que la ejecución correspondió a esa identidad.

~~~text
requestedModelId = exact pinned identifier
resolvedModelIdentifier = exact same authorized identity
~~~

Si el provider devuelve identidad ejecutada, transport debe verificar coincidencia.

Si no puede demostrarse coincidencia:

~~~text
MODEL_IDENTITY_MISMATCH
→ fail closed
~~~

### 5.2 PROVIDER_ALIAS_WITH_LIMITATION

Se admite únicamente como limitación explícita de evidencia.

~~~text
requestedModelId = provider alias
underlying model version = not exactly pinned
EXACT_GENERATIVE_REPRODUCIBILITY = FALSE
~~~

En este modo no puede documentarse ni inferirse reproducibilidad exacta del output generativo.

La decisión sobre qué identityMode se autorizará para una implementación futura permanece OPEN.

## 6. Instruction bundle binding

Toda instrucción semánticamente relevante enviada al modelo debe estar fijada.

Se define:

~~~text
instructionBundleBinding = {
  assemblyVersion,
  orderedArtifacts: [
    {
      dependencyId,
      canonicalRepoRelativePath,
      rawSha256
    }
  ],
  assembledInstructionSha256
}
~~~

Reglas:

~~~text
orderedArtifacts
→ orden exacto de ensamblaje
→ no duplicados de dependencyId
→ no path substitution
→ no hash substitution

assembledInstructionSha256
→ SHA-256 de los bytes UTF-8 exactos
   del instruction bundle finalmente enviado al provider/model
~~~

No puede existir una instrucción system/developer/agent semánticamente activa bajo control de Árboris fuera de este bundle sin binding.

Si un SDK o provider introduce instrucciones ocultas no observables por Árboris:

~~~text
PROVIDER_HIDDEN_INSTRUCTION_LAYER = OPEN_LIMITATION
~~~

y esa limitación debe quedar registrada; no puede presentarse como control total de la semántica del modelo.

## 7. Response contract binding

La forma de MODEL_RESPONSE debe estar ligada a un artefacto versionado.

~~~text
responseContractBinding = {
  dependencyId,
  canonicalRepoRelativePath,
  rawSha256,
  contractId
}
~~~

El artefacto deberá definir al menos:

~~~text
responseKind enum
PATCH payload = exact Repair R1 agentPatch
ABSTAIN payload = null
additionalProperties = false
strict structural requirements
~~~

Mientras ese schema no exista:

~~~text
AGENT_RESPONSE_SCHEMA = OPEN
IMPLEMENTATION_AUTHORIZED = FALSE
~~~

El parser estricto y el schema son capas distintas:

~~~text
strict parser
→ rechaza JSON ambiguo/malformado

response schema
→ rechaza forma válida pero no autorizada
~~~

## 8. Generation parameters

generationParameters debe ser un objeto completo y explícito de todos los parámetros que el provider seleccionado considere semánticamente relevantes para generación.

Ejemplos posibles, dependientes del provider:

~~~text
temperature
top_p
seed
max_output_tokens
reasoning mode/effort
tool mode
parallel tool policy
response format mode
stop sequences
~~~

R4 no fija nombres universales porque son provider-specific.

Regla:

~~~text
no semantics-affecting provider default may remain implicit
unless:
- the provider contract identifies that default,
- the provider/version is bound,
- and the default is included in the policy as an explicit resolved value.
~~~

Si un parámetro relevante no puede conocerse o fijarse:

~~~text
UNBOUND_GENERATION_PARAMETER = OPEN_LIMITATION
~~~

No se infiere reproducibilidad exacta.

## 9. Provider feature bindings

providerFeatureBindings enumera cualquier feature que cambie la semántica de la invocación, por ejemplo:

~~~text
structured output mode
server-side prompt template
provider safety transformation affecting returned content
reasoning configuration
tool availability
cached/prefilled context
provider-managed memory/context
~~~

Cada feature debe quedar:

~~~text
explicitly disabled
or
explicitly configured and bound
~~~

No se permite provider-managed conversational memory implícita para este flujo.

No se permite que tool availability dependa de defaults del provider.

El agent/model context sigue sin herramientas privilegiadas.

## 10. Provider endpoint policy binding

providerEndpointPolicyBinding debe enlazar la política de egress vigente:

~~~text
policyId
canonicalRepoRelativePath
rawSha256
allowedProviderConfigurationId
allowedEndpointSet
redirectPolicy
~~~

Transport verifica esta política antes de enviar.

El modelo no controla endpoint ni redirect target.

## 11. modelInvocationPolicyDigest

Definición:

~~~text
modelInvocationPolicyDigest
=
logicalSha256(MODEL_INVOCATION_POLICY_V1)
~~~

Este digest se incorpora a:

~~~text
INPUT_BINDING_V1
INTEGRATION_ATTEMPT_RECORD
TRANSPORT_RECEIPT
~~~

y se verifica:

~~~text
antes de provider invocation
por transport antes de enviar
al recibir TRANSPORT_RECEIPT
después de respuesta durante post-response rebind
antes de construir Repair R1
~~~

Cualquier drift produce:

~~~text
MODEL_INVOCATION_POLICY_DRIFT
→ fail closed
→ no Repair R1
→ no E5.1/E5.2/E5.3
~~~

## 12. INPUT_BINDING_V1 actualizado

R4 amplía el binding de R3:

~~~text
INPUT_BINDING_V1 = {
  schemaVersion,
  runId,
  parentProposal: {
    proposalId,
    sha256,
    iteration
  },
  parentCandidateSha256,
  parentCandidateProjectionSha256,
  validationReport: {
    reportId,
    sha256,
    status
  },
  autoRepairFindingsSha256,
  patchPolicySha256,
  resourcePolicySha256,
  integrationDependenciesSha256,
  modelInvocationPolicyDigest
}
~~~

Definición:

~~~text
inputBindingDigest
=
logicalSha256(INPUT_BINDING_V1)
~~~

Un cambio en model policy invalida la respuesta aunque run/report no hayan cambiado.

## 13. TRANSPORT_RECEIPT actualizado

Contenido lógico mínimo:

~~~text
transportInvocationId
requestPayloadSha256
modelInvocationPolicyDigest
providerEndpointId
providerRuntimeDescriptor
requestedModelId
resolvedModelIdentifier, if provider exposes it
providerRequestId, optional
rawResponseBytes
transportOutcome
sanitizedTransportError, optional
~~~

Transport no construye Repair R1 ni interpreta agentPatch.

Si identityMode=EXACT_PIN y el provider expone una identidad incompatible:

~~~text
MODEL_IDENTITY_MISMATCH
→ fail closed
~~~

Si identityMode=PROVIDER_ALIAS_WITH_LIMITATION:

~~~text
resolvedModelIdentifier
→ evidence only
→ does not upgrade reproducibility claim
~~~

## 14. INTEGRATION_ATTEMPT_RECORD actualizado

Debe registrar:

~~~text
attemptId
requestId
requestDigest
inputBindingDigest
modelInvocationPolicyDigest
transportInvocationId
providerRequestId, optional
requestPayloadSha256
rawResponseSha256
parsedResponseSha256, if parse succeeded
responseKind, if parse succeeded
requestedModelId
resolvedModelIdentifier, if available
outcome
failureClass
integrationDependencies
~~~

Continúa siendo:

~~~text
NON_AUTHORITATIVE
NOT A RUN-STATE SOURCE
NOT A REPAIR SOURCE
NOT A RECOVERY SOURCE
~~~

## 15. Provenance exacta de la policy

MODEL_INVOCATION_POLICY_V1 no sustituye provenance de artefactos.

Cuando exista implementación, integrationDependencies debe incluir por separado:

~~~text
REPAIR_SCHEMA
E5_1_REPAIR_GATE
E5_2_TRANSACTION_CANDIDATE
E5_3_DURABLE_STORE
REPAIR_AGENT_ORCHESTRATOR
PROVIDER_TRANSPORT_ADAPTER
AGENT_RESPONSE_PARSER
AGENT_REQUEST_SCHEMA
AGENT_RESPONSE_SCHEMA
AGENT_SANDBOX_POLICY
RESOURCE_POLICY
MODEL_INVOCATION_POLICY
INSTRUCTION_ARTIFACTS
PROVIDER_ENDPOINT_POLICY
~~~

Cada componente exige:

~~~text
dependencyId
canonical repo-relative path
raw SHA-256
~~~

La policy referencia esos bindings; no reemplaza la identidad de los artefactos.

## 16. Secuencia de invocación actualizada

~~~text
1. recover E5.3 store
2. validate current durable run/report/provenance
3. build bounded request
4. deterministically serialize request
5. enforce maxRequestBytes
6. build MODEL_INVOCATION_POLICY_V1
7. compute modelInvocationPolicyDigest
8. build INPUT_BINDING_V1
9. compute inputBindingDigest
10. allocate transportInvocationId
11. send request bytes + digests + pinned provider configuration to transport
12. transport rechecks requestPayloadSha256
13. transport rechecks modelInvocationPolicyDigest/policy
14. transport enforces endpoint/secret/resource rules
15. transport performs exactly one provider invocation
16. receive TRANSPORT_RECEIPT
17. verify exact transportInvocationId
18. verify requestPayloadSha256
19. verify modelInvocationPolicyDigest
20. apply model identity policy
21. verify maxRawResponseBytes
22. hash rawResponseBytes
23. strict-parse MODEL_RESPONSE
24. validate MODEL_RESPONSE schema
25. if ABSTAIN → stop without mutation
26. if PATCH → validate exact agentPatch
27. reread durable run/report
28. reverify integration dependencies
29. rebuild MODEL_INVOCATION_POLICY_V1
30. require exact modelInvocationPolicyDigest
31. rebuild INPUT_BINDING_V1
32. require exact inputBindingDigest
33. require READY_TO_REPAIR + exact REJECT_FIXABLE report/findings
34. construct resolver-owned Repair R1
35. execute E5.1
36. execute E5.2
37. execute E5.3
~~~

No se crea ruta paralela de persistencia.

## 17. Failure semantics añadidas

R4 agrega:

~~~text
MODEL_INVOCATION_POLICY_INVALID
MODEL_INVOCATION_POLICY_DRIFT
MODEL_IDENTITY_MISMATCH
INSTRUCTION_BUNDLE_DRIFT
RESPONSE_CONTRACT_DRIFT
PROVIDER_ENDPOINT_POLICY_DRIFT
UNBOUND_GENERATION_PARAMETER
PROVIDER_HIDDEN_INSTRUCTION_LAYER
~~~

Algunas representan falla ejecutable; otras pueden representar limitación bloqueante de configuración antes de invocar.

Ninguna habilita retry automático.

## 18. Reproducibilidad y claims

R4 distingue:

~~~text
deterministic integration bindings
vs.
generative output reproducibility
~~~

La primera puede demostrarse mediante hashes y políticas.

La segunda solo puede afirmarse en el alcance realmente probado por provider/model/runtime.

Por tanto:

~~~text
same requestDigest
+ same inputBindingDigest
+ same modelInvocationPolicyDigest
≠ guaranteed identical model output
~~~

salvo evidencia específica que lo demuestre.

La arquitectura no depende de output idéntico; depende de validar cada output nuevamente antes de mutación.

## 19. Prototype safety sigue OPEN ejecutablemente

R4 preserva R2-N2:

~~~text
JSON_OBJECT_MUTATION_USES_OWN_DATA_PROPERTY_SEMANTICS
PROTOTYPE_SAFE_REPAIR_APPLICATION = OPEN
IMPLEMENTATION_BLOCKED = TRUE
~~~

No se modifica E5.1 en este documento.

## 20. Minimal change sigue OPEN

~~~text
MINIMAL_CHANGE_EXECUTABLE_RULE = OPEN
IMPLEMENTATION_BLOCKED_UNTIL_RESOLVED = TRUE
~~~

R4 no reabre ni cierra esta decisión.

## 21. Capabilities R3 preservadas

Se mantienen tres dominios:

~~~text
RESOLVER / ORCHESTRATOR
PROVIDER TRANSPORT ADAPTER
AGENT / MODEL CONTEXT
~~~

Transport posee provider secret + allowlisted egress y no posee repo/run/E5/durable access.

Resolver posee E5.1/E5.2/E5.3 y no provider secrets ni arbitrary egress.

Model context recibe bounded request y no tools/secrets/capabilities privilegiadas.

## 22. Apoyo ASC v0.1

ASC se usa solo para compilar restricciones de R4.

~~~text
ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-DESIGN-R4-ASC-001
~~~

Contrato compilado:

~~~text
AUTHORIZED SOURCES
- main@63196dcf87b211f057a0f0b6f28d5a84098e2191
- docs/DEVELOPMENT_MANUAL.md
- docs/MAP001_E5_1_DETERMINISTIC_REPAIR_GATE_001.md
- docs/MAP001_E5_2_REPAIR_RUN_CONTEXT_001.md
- docs/MAP001_E5_3_DURABLE_REPAIR_PERSISTENCE_DESIGN_001.md
- docs/MAP001_E5_3_CLEAN_HANDOFF_2026-09-23.md
- docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_003.md
- docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R3_DIRECTED_REGRESSION_001.md
- tools/proposal-resolution/schemas/repair.schema.json

MANDATORY RELATIONS
- PATCH example must satisfy current agentPatch schema
- MODEL_INVOCATION_POLICY_V1 binds semantic model invocation configuration
- instruction bundle is ordered and byte-hashed
- response contract is provenance-bound
- generation parameters are explicit or declared limitation
- provider features cannot remain implicit
- endpoint policy is provenance-bound
- modelInvocationPolicyDigest enters input binding, attempt record and receipt
- policy drift invalidates response
- model output remains untrusted data
- R2-N1..R2-N3 remain resolved
- RA-I1..RA-I8 constraints remain preserved
- E5.1/E5.2/E5.3 remain mandatory
- E5.3 remains sole durable boundary

OPEN
- provider/model/runtime
- model identity mode authorization
- provider hidden instruction limitations
- deterministic request serializer/schema
- request projection algorithm
- response schema artifact
- concrete instruction artifacts
- exact generation parameter values
- exact provider feature set
- physical sandbox technology
- numeric resource limits
- strict parser implementation
- prototype-safe E5.1 rectification + tests
- minimal-change executable rule or authority-level contract revision
- final failure schema
- ID algorithms
- observability sink/retention
- NEXT_STAGE_ID
- AUTHORIZED_FOR_ASC

DO NOT INFER
- same model policy digest guarantees same generative output
- provider alias means fixed model version
- provider-reported model ID alone proves all runtime semantics
- valid PATCH example proves repair authorization
- design correction authorizes implementation
- prototype-safe design means E5.1 already fixed
- DOMAIN_PASS implies AUTHORIZED_FOR_ASC

PROHIBITED
- hidden unbound instruction artifacts under project control
- implicit semantics-affecting generation defaults
- model-authored invocation policy
- transport overriding policy without fail-closed drift
- response reuse under different policy digest
- direct durable writes outside E5.3
- automatic retry
- assignment of NEXT_STAGE_ID by inference

VALIDATION CRITERIA
- R3-N1 MODEL_INVOCATION_POLICY_V1 present and bound
- modelInvocationPolicyDigest included in all required layers
- exact instruction/configuration provenance represented
- reproducibility claims bounded
- R3-N2 PATCH example structurally valid
- previous constraints preserved
- implementation remains unauthorized
~~~

ASC no decide provider, policy values ni implementación y no autoriza conexión.

## 23. AUDITORÍA

R4 corrige R3-N1 al elevar la configuración semántica del modelo a un artefacto lógico versionado y hash-bound.

También corrige R3-N2 con un PATCH example que satisface la estructura vigente de agentPatch.

La invocación generativa continúa siendo una fuente no confiable de propuesta; el sistema depende de gates posteriores, no de confianza en el modelo.

## 24. INCONSISTENCIAS

No se detecta contradicción intencional con Repair R1, E5.1, E5.2 o E5.3.

El ejemplo PATCH es solo estructural y no se presenta como repair autorizado.

## 25. VACÍOS / OMISIONES

Permanecen OPEN y bloqueantes antes de implementar:

~~~text
provider/model/runtime
authorized model identity mode
provider-specific hidden-layer limitations
instruction artifact(s)
response schema artifact
deterministic request serializer/schema
request projection algorithm
generation parameter values
provider feature configuration
endpoint policy artifact
transport implementation
physical sandbox
numeric resource limits
strict parser implementation
prototype-safe E5.1 rectification + tests
minimal-change executable rule or contract revision
final schemas
ID allocation
observability sink/retention
adversarial implementation tests
human implementation authorization
NEXT_STAGE_ID
AUTHORIZED_FOR_ASC
~~~

## 26. REDUNDANCIAS

Son intencionales:

~~~text
requestDigest
→ binds exact request bytes

inputBindingDigest
→ binds current domain/run context

modelInvocationPolicyDigest
→ binds semantic model invocation configuration

transportInvocationId
→ binds one concrete call

post-response rebind
→ proves current freshness before mutation

E5.1/E5.2/E5.3
→ authoritative repair/run/durable gates
~~~

No son fuentes de verdad duplicadas.

## 27. Resolución dirigida R3-N1 / R3-N2

~~~text
R3-N1
MODEL_INVOCATION_POLICY_V1 defined
instruction/configuration semantics bound
modelInvocationPolicyDigest propagated
reproducibility limitation explicit
→ ADDRESSED

R3-N2
PATCH example now satisfies agentPatch minItems and required fields
→ ADDRESSED
~~~

ADDRESSED no equivale todavía a PASS de regresión.

## 28. Gate

~~~text
R4 authored
→ directed regression R3-N1/R3-N2
→ regression RA-I1..RA-I8 + R2-N1..R2-N3
→ correct any new finding
→ design validation
→ explicit human implementation decision
→ only then consider executable changes
~~~

Estado:

~~~text
REPAIR_AGENT_INTEGRATION_DESIGN = R4_CANDIDATE_FOR_DIRECTED_REGRESSION
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
~~~
