# MAP-001 — Repair Agent Integration Design 010

Fecha: 2026-09-23
Estado: R10_CANDIDATE_FOR_DIRECTED_REGRESSION
Baseline técnica de rama: main@63196dcf87b211f057a0f0b6f28d5a84098e2191
Deriva de: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_009.md
Auditoría de origen: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R9_DIRECTED_REGRESSION_001.md
Motivo: corrección exclusiva de R9-N1, R9-N2 y R9-N3
NEXT_STAGE_ID: OPEN
REPAIR_AGENT_CONNECTED: FALSE
AUTHORIZED_FOR_ASC: OPEN
IMPLEMENTATION_AUTHORIZED: FALSE

## 1. Objetivo

R10 conserva las fronteras válidas de R9 y corrige exclusivamente:

R9-N1: versionar los hash profiles y fijar su compatibilidad con E5.1/E5.2/E5.3 sin migración implícita.
R9-N2: definir una trusted materialization/admission boundary antes de CANONICAL_JSON_VALUE_V1.
R9-N3: separar correlación local de transport de identidad nativa observable del provider.

R10 es exclusivamente documental. No modifica logicalSha256, E5.1, E5.2, E5.3, schemas ejecutables, transport, provider, parser, sandbox ni repair agent.

## 2. Invariantes heredados

MODEL_RESPONSE != TRANSPORT_RECEIPT != INTEGRATION_ATTEMPT_RECORD.
MODEL_INVOCATION_POLICY_V2 es la única policy normativa de invocación.
Agent authority = PROPOSE_AGENT_PATCH or ABSTAIN_WITHOUT_MUTATION.
Repair R1 control-plane = resolver-owned.
E5.1, E5.2 y E5.3 siguen siendo obligatorios.
E5.3 sigue siendo la única frontera durable.
automaticRetries = 0.
PROTOTYPE_SAFE_REPAIR_APPLICATION = OPEN.
MINIMAL_CHANGE_EXECUTABLE_RULE = OPEN.
CANONICAL_JSON_NUMBER_POLICY = OPEN.
IMPLEMENTATION_AUTHORIZED = FALSE.
REPAIR_AGENT_CONNECTED = FALSE.
NEXT_STAGE_ID = OPEN.
AUTHORIZED_FOR_ASC = OPEN.

## 3. R9-N1 — HASH_PROFILE_REGISTRY_V1

R10 prohíbe tratar logicalSha256 como una semántica implícita única.

HASH_PROFILE_REGISTRY_V1 contiene dos perfiles contractualmente distintos:

LEGACY_LOGICAL_SHA256_V1: semántica ejecutable vigente de tools/proposal-resolution/map001_validation_adapter_r1.mjs::logicalSha256 y de sus consumidores actuales.
CANONICAL_JSON_SHA256_V2: futuro perfil para artefactos de integración sujetos a CANONICAL_JSON_VALUE_V1, CANONICAL_JSON_SERIALIZATION_V1 y canonicalización prototype-safe.

LEGACY_LOGICAL_SHA256_V1 se trata como perfil histórico existente. R10 no lo redefine, no lo declara prototype-safe, no amplía su dominio y no migra hashes persistidos.

CANONICAL_JSON_SHA256_V2 permanece OPEN ejecutablemente hasta que existan CANONICAL_JSON_NUMBER_POLICY, implementación, provenance y tests.

## 4. Regla de no sustitución

Un digest LEGACY_LOGICAL_SHA256_V1 y un digest CANONICAL_JSON_SHA256_V2 son tipos contractuales distintos aunque coincidan sus 64 caracteres hexadecimales.

Está prohibido comparar perfiles distintos como equivalentes, colocar un V2 digest en un field consumido como V1, reinterpretar un persisted V1 digest como V2 o cambiar el profile de un field sin migración explícita.

Todo nuevo hash binding de la integración debe equivaler conceptualmente a HASH_BINDING_V1 = { hashProfileId, sha256 }.

Cuando un schema legado no permita ese envelope, el profile queda fijado por el contrato del field y por provenance.

## 5. Matriz de perfiles

Los existing proposal/control hashes, validation-report hashes, Repair R1 hashes consumidos por E5, child-proposal hashes consumidos por E5, durable run before/after hashes y journal/CAS/recovery hashes continúan en LEGACY_LOGICAL_SHA256_V1.

Los artefactos nuevos BYTE_STRING-bearing, MODEL_INVOCATION_POLICY bindings, INPUT_BINDING_V5+, capture/extraction policies, provider observation records, transport package/receipt logical bindings, provider request envelopes y provider invocation source bindings usan CANONICAL_JSON_SHA256_V2 cuando ese perfil exista y esté autorizado.

## 6. E5_HASH_PROFILE_COMPATIBILITY_GATE_V1

Antes de construir Repair R1 desde una respuesta del agente, resolver debe demostrar para cada field que cruzará hacia E5:

field name; producer; consumer; required hashProfileId; actual hashProfileId; artifact domain; compatibility status.

Si producer y consumer no usan el mismo profile contractual: E5_HASH_PROFILE_MISMATCH → no Repair R1 → fail closed.

## 7. Agent-influenced content y legacy hashes

Que un objeto sea válido bajo CANONICAL_JSON_SHA256_V2 no demuestra que sea seguro o hash-stable bajo LEGACY_LOGICAL_SHA256_V1.

AGENT_INFLUENCED_OBJECT solo puede entrar a un field legado de E5 si existe una prueba dedicada de compatibilidad para el dominio concreto permitido.

Sin esa prueba: AGENT_CONTENT_TO_LEGACY_HASH = BLOCKED.

Esto mantiene visible el riesgo de special keys y otros valores agent-influenced dentro de Repair R1, child proposal o candidate hashes.

## 8. Opciones futuras del bridge

R10 no elige implementación. Solo permite tres clases de cierre auditables:

A. Probar un dominio restringido que sea seguro y semánticamente estable bajo el hash legado.
B. Crear contratos E5 versionados que consuman CANONICAL_JSON_SHA256_V2 en los fields pertinentes.
C. Ejecutar una migración explícita de hash profiles con evidencia durable/recovery/backward-compatibility.

NO_IMPLICIT_HASH_MIGRATION = TRUE.

Cualquier migración futura debe definir scope, inventario de artefactos, reglas de re-hash, detección mixed-version, journal/CAS/recovery, rollback y tests. R10 no la autoriza.

## 9. R9-N2 — TRUSTED_JSON_MATERIALIZATION_V1

El canonicalizer futuro no recibe arbitrary JavaScript object graphs.

TRUSTED_JSON_MATERIALIZATION_V1 produce una representación JSON controlada y solo esa representación puede entrar a CANONICAL_JSON_SHA256_V2.

Existen dos rutas autorizadas.

EXTERNAL_BYTES_ROUTE: bounded exact bytes → strict decoder/parser → duplicate-key rejection cuando corresponda → type/domain validation → controlled JSON representation → CANONICAL_JSON_VALUE_V1 validation → canonical hash.

CONTROLLED_BUILDER_ROUTE: controlled builder → solo primitives aprobados, dense arrays y own-data-property containers → controlled JSON representation → canonical hash.

El builder no acepta un arbitrary object para clonarlo recursivamente.

## 10. CONTROLLED_JSON_VALUE_HANDLE_V1

La futura implementación debe exponer una abstracción cerrada equivalente a CONTROLLED_JSON_VALUE_HANDLE_V1.

Debe ser creada solo por trusted parser/decoder o controlled builder; no debe construirse desde una referencia arbitrary object; no puede depender de una marca pública spoofable; y el canonicalizer acepta esa representación controlada, no generic unknown/object.

La tecnología concreta permanece OPEN.

## 11. Proxy handling

R10 elimina la obligación no operacional de detectar de forma genérica cualquier JavaScript Proxy.

La nueva invariante es: arbitrary runtime objects nunca cruzan la admission boundary hacia el canonicalizer.

Si el SDK devuelve un Proxy u otro objeto especial, pertenece al provider/SDK observation boundary. Transport solo accede a fields permitidos por la provider-specific capture policy y materializa los resultados mediante CONTROLLED_BUILDER_ROUTE.

El canonicalizer nunca recibe el SDK object directamente.

Si el acceso observable del SDK tiene side effects o semántica no controlable: SDK_OBSERVABLE_OBJECT_BEHAVIOR = OPEN_LIMITATION.

## 12. Observation capture y materialización

PROVIDER_OBSERVATION_CAPTURE_POLICY debe declarar para cada field capturado: source locator, expected primitive/content type, bounded decoding rule, controlled materialization rule y error behavior.

Está prohibido logicalSha256(providerSdkObject), logicalSha256(callbackEventObject) o logicalSha256(arbitrary provider response object).

Strict parser/decoder y canonicalizer siguen separados: el primero decide si bytes forman datos permitidos; el segundo serializa determinísticamente una representación JSON ya controlada.

## 13. Admission provenance y tests

La futura dependency closure añade TRUSTED_JSON_MATERIALIZER, STRICT_JSON_PARSER, CONTROLLED_JSON_BUILDER, CANONICAL_JSON_DOMAIN_SPEC, CANONICAL_JSON_SERIALIZER, CANONICAL_JSON_NUMBER_POLICY y HASH_PROFILE_REGISTRY, cada uno con dependencyId + canonical repo-relative path + raw SHA-256.

Tests mínimos: arbitrary plain object rejected by canonicalizer API; class instance rejected at admission; accessor-bearing object never passed; Proxy never passed; duplicate JSON keys rejected; special keys preserved; dense arrays preserved; sparse runtime arrays rejected; BYTE_STRING_V1 roundtrip; provider observation projection to controlled JSON; controlled builder cannot insert accessor/prototype behavior.

## 14. R9-N3 — EVIDENCE_CLAIM_STATUS_V1

R10 separa TRANSPORT_CORRELATION_STATUS y PROVIDER_NATIVE_REQUEST_IDENTITY_STATUS.

Cada status solo puede ser VERIFIED, FAILED o NOT_OBSERVABLE.

TRANSPORT_CORRELATION_STATUS puede ser VERIFIED si transportInvocationId, providerInvocationHandleId, response channel, unit bindings y late/cross-invocation rejection se demuestran.

PROVIDER_NATIVE_REQUEST_IDENTITY_STATUS solo puede ser VERIFIED si el provider expone un request identity observable y la policy exige/verifica coincidencia en receipt, observation y metadata disponible.

Si providerRequestIdPolicy = UNAVAILABLE_BY_PROVIDER, PROVIDER_NATIVE_REQUEST_IDENTITY_STATUS = NOT_OBSERVABLE.

Si OPTIONAL_IF_EXPOSED no expone ID, el status también es NOT_OBSERVABLE.

Si un ID aparece y diverge: FAILED → fail closed.

NOT_OBSERVABLE no equivale a FAILED ni a VERIFIED y no eleva la evidencia.

## 15. Receipt y attempt evidence

TRANSPORT_RECEIPT_V7 evoluciona V6 y agrega evidenceClaims = { transportCorrelationStatus, providerNativeRequestIdentityStatus }.

Resolver recalcula ambos statuses desde la evidencia y no confía ciegamente en el valor declarado por transport.

INTEGRATION_ATTEMPT_RECORD registra los statuses resultantes.

## 16. INPUT_BINDING_V5

INPUT_BINDING_V5 reemplaza V4 y añade hashProfileRegistryBinding y trustedJsonMaterializationBinding, además de providerInvocationSourcePolicySha256 y resourcePolicySha256.

Se preservan integrationDependenciesSha256, modelInvocationPolicyDigest, materializedMessagePlanSha256, resolvedProviderConstructionPolicySha256, expectedProviderRequestEnvelopeDigest, observationCapturePolicyDigest y responseExtractionPolicyDigest.

Los campos nuevos de integración usan CANONICAL_JSON_SHA256_V2 cuando esté implementado y autorizado. Los fields E5 existentes permanecen bajo LEGACY_LOGICAL_SHA256_V1.

## 17. Pre-Repair R1 compatibility sequence

1. verify transport/response evidence.
2. strict-parse MODEL_RESPONSE through trusted materialization.
3. validate agentPatch.
4. reread current run/report/dependencies.
5. verify INPUT_BINDING_V5.
6. apply E5_HASH_PROFILE_COMPATIBILITY_GATE_V1.
7. require compatibility for every E5-bound field.
8. only then construct resolver-owned Repair R1.
9. E5.1.
10. E5.2.
11. E5.3.

Si el agent-influenced object domain no es demostrablemente compatible con legacy E5 hashing, step 6 falla y no se construye Repair R1.

## 18. Failure semantics añadidas

HASH_PROFILE_UNKNOWN.
HASH_PROFILE_MISMATCH.
E5_HASH_PROFILE_MISMATCH.
AGENT_CONTENT_TO_LEGACY_HASH_BLOCKED.
HASH_MIGRATION_REQUIRED.
UNTRUSTED_JSON_ADMISSION.
CONTROLLED_JSON_HANDLE_REQUIRED.
JSON_MATERIALIZATION_FAILED.
SDK_OBSERVABLE_OBJECT_BEHAVIOR_UNSAFE.
TRANSPORT_CORRELATION_FAILED.
PROVIDER_NATIVE_REQUEST_IDENTITY_FAILED.

NOT_OBSERVABLE es evidence status, no failure por sí mismo.

## 19. OPEN preservados

CANONICAL_JSON_NUMBER_POLICY.
CANONICAL_JSON_SHA256_V2 implementation.
trusted materializer implementation.
controlled JSON builder implementation.
hash-profile bridge choice A/B/C.
E5 compatibility proof or versioned migration.
provider/model/runtime.
provider-specific source binding.
providerRequestId policy selection.
provider-specific observation/capture/extraction.
numeric resource limits.
schemas concretos R10.
request projection.
response schema.
instruction artifacts.
generation parameters.
provider features.
endpoint policy.
transport implementation.
sandbox.
strict parser implementation.
prototype-safe E5.1 repair application + tests.
minimal-change executable rule or authority-level revision.
failure schema.
IDs.
observability.
implementation adversarial tests.
human implementation authorization.
NEXT_STAGE_ID.
AUTHORIZED_FOR_ASC.

## 20. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-DESIGN-R10-ASC-001

AUTHORIZED SOURCES:
- branch head 6fb3b19def542fcc880be816a194b11479daa5f9
- technical baseline main@63196dcf87b211f057a0f0b6f28d5a84098e2191
- DEVELOPMENT_MANUAL
- E5.1 / E5.2 / E5.3 authorities
- R9 design
- R9 directed regression
- current logicalSha256 implementation
- current E5 logicalSha256 consumers
- Repair R1 schema

MANDATORY RELATIONS:
- legacy and canonical hash profiles are distinct contract types
- no implicit migration of existing E5 hashes
- every integration digest has an explicit profile
- E5-bound fields retain legacy profile until explicitly migrated/versioned
- agent-influenced content cannot cross into legacy hash fields without compatibility proof
- canonicalizer accepts controlled JSON representation, not arbitrary runtime objects
- cross-boundary data enters through bounded strict materialization
- provider-native identity claim is separate from transport correlation
- NOT_OBSERVABLE remains NOT_OBSERVABLE
- prior closures remain preserved
- E5.1/E5.2/E5.3 remain mandatory
- E5.3 remains sole durable boundary

DO NOT INFER:
- same hex digest means same hash profile
- stronger V2 hashing may silently replace V1
- V2-safe object is automatically safe under legacy E5 hashing
- generic Proxy detection is required or reliable
- transport handle proves provider-native request identity
- NOT_OBSERVABLE means VERIFIED
- design correction authorizes implementation
- design PASS implies AUTHORIZED_FOR_ASC

PROHIBITED:
- silent hash-profile substitution
- implicit persisted-hash migration
- arbitrary runtime object input to canonicalizer
- direct hashing of SDK/provider runtime objects
- provider-native VERIFIED status without observable matching ID
- direct durable writes outside E5.3
- automatic retry
- NEXT_STAGE_ID inference

VALIDATION CRITERIA:
- R9-N1 versioned hash profiles + E5 compatibility gate explicit
- R9-N2 trusted materialization/admission boundary explicit
- R9-N3 evidence claims separated and bounded
- previous closures preserved
- implementation remains unauthorized

ASC compila restricciones; no decide hash migration, provider, canonicalizer, schemas, implementación ni autoriza conexión.

## 21. AUDITORÍA

R10 corrige R9-N1 al definir perfiles de hash distintos, prohibir sustitución/migración implícita y agregar un compatibility gate antes de Repair R1.

R10 corrige R9-N2 al retirar del canonicalizer la responsabilidad imposible de detectar genéricamente todos los Proxy y exigir trusted materialization.

R10 corrige R9-N3 al separar transport correlation de provider-native request identity.

## 22. INCONSISTENCIAS

No se detecta contradicción intencional con Repair R1, E5.1, E5.2 o E5.3.

Existe una deuda ejecutable deliberada: agent-influenced content todavía no puede cruzar hacia los hashes legacy de E5 hasta resolver el compatibility bridge A/B/C.

R10 no oculta esa deuda ni la resuelve por inferencia.

## 23. VACÍOS / OMISIONES

Los OPEN de §19 permanecen bloqueantes para implementación.

Los bloqueos técnicos principales que siguen deliberadamente OPEN son E5 hash-profile compatibility/migration strategy, prototype-safe E5.1 repair application y minimalChangeRequired.

No impiden auditar R10 como diseño.

## 24. REDUNDANCIAS

Legacy hash profile + canonical hash profile cubren compatibilidad entre contratos distintos.
Trusted materialization + canonical-domain validation cubren admisión controlada y hashing determinista.
Transport correlation + provider-native identity cubren evidencia local y evidencia nativa.
E5 hash compatibility gate + E5.1/E5.2/E5.3 cubren profile correctness y authoritative execution.

No crean autoridad paralela.

## 25. Resolución dirigida

R9-N1 = ADDRESSED.
R9-N2 = ADDRESSED.
R9-N3 = ADDRESSED.

ADDRESSED != regression PASS.

## 26. Gate

R10 authored → directed regression R9-N1/R9-N2/R9-N3 → accumulated regression completa → correct any new finding → design validation → explicit human implementation decision → only then consider executable changes.

Estado:
REPAIR_AGENT_INTEGRATION_DESIGN = R10_CANDIDATE_FOR_DIRECTED_REGRESSION
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
