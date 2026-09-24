# MAP-001 — Repair Agent Integration Design 011

Fecha: 2026-09-23
Estado: R11_CANDIDATE_FOR_DIRECTED_REGRESSION
Baseline técnica de rama: main@63196dcf87b211f057a0f0b6f28d5a84098e2191
Main observado al redactar R11: 9fc1619b4d23bc7ebe1ece49d5f55143362c129f
Deriva de: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_010.md
Auditoría de origen: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R10_DIRECTED_REGRESSION_001.md
Motivo: corrección exclusiva de R10-N1, R10-N2 y R10-N3
NEXT_STAGE_ID: OPEN
REPAIR_AGENT_CONNECTED: FALSE
AUTHORIZED_FOR_ASC: OPEN
IMPLEMENTATION_AUTHORIZED: FALSE

Nota de baseline: main continúa un commit por delante de la baseline técnica de esta rama por documentación artística fuera del alcance de esta integración. R11 no infiere autoridad técnica nueva desde ese avance.

## 1. Objetivo

R11 conserva las fronteras válidas de R10 y corrige exclusivamente:

R10-N1: establecer un trust root previo, resolver-owned y no auto-seleccionado por INPUT_BINDING.
R10-N2: convertir CONTROLLED_JSON_VALUE_HANDLE en snapshot inmutable, detached y alias-safe.
R10-N3: agregar evidenceBasis y reglas de derivación a los evidence claims.

R11 es exclusivamente documental.

No implementa canonicalizer, hash migration, E5.1, E5.2, E5.3, transport, provider, parser, sandbox ni repair agent.

## 2. Invariantes heredados

LEGACY_LOGICAL_SHA256_V1 y CANONICAL_JSON_SHA256_V2 permanecen perfiles contractualmente distintos.
NO_IMPLICIT_HASH_MIGRATION = TRUE.
MODEL_INVOCATION_POLICY_V2 continúa siendo la única policy normativa de invocación.
E5.1, E5.2 y E5.3 siguen siendo obligatorios.
E5.3 sigue siendo la única frontera durable.
PROTOTYPE_SAFE_REPAIR_APPLICATION = OPEN.
MINIMAL_CHANGE_EXECUTABLE_RULE = OPEN.
CANONICAL_JSON_NUMBER_POLICY = OPEN.
IMPLEMENTATION_AUTHORIZED = FALSE.
REPAIR_AGENT_CONNECTED = FALSE.
NEXT_STAGE_ID = OPEN.
AUTHORIZED_FOR_ASC = OPEN.

## 3. R10-N1 — BOOTSTRAP_AUTHORITY_V1

R11 introduce un root of trust explícito fuera de los artefactos V2 que ese mismo root debe verificar.

BOOTSTRAP_AUTHORITY_V1 es una configuración resolver-owned seleccionada por deployment/release/human authorization antes de procesar cualquier artefacto de repair-agent integration.

Conceptualmente contiene:

bootstrapAuthorityId.
resolverReleaseIdentity.
trustRootManifestCanonicalPath.
expectedTrustRootManifestRawSha256.
allowedRepositoryIdentity.
allowedBranchOrReleaseScope.

BOOTSTRAP_AUTHORITY_V1 no se obtiene desde MODEL_RESPONSE, TRANSPORT_RECEIPT, INPUT_BINDING ni ningún artefacto producido por el agente o provider.

Su selección está fuera del flujo generativo y constituye el punto explícito donde termina la cadena de confianza documental de R11.

## 4. BOOTSTRAP_RAW_SHA256_V1

Para evitar que CANONICAL_JSON_SHA256_V2 tenga que validarse a sí mismo, el primer chequeo del trust root usa raw-byte hashing.

BOOTSTRAP_RAW_SHA256_V1 = SHA-256 sobre los bytes exactos del trust-root manifest, sin canonicalización lógica.

Reglas:

resolver abre el path fijado por BOOTSTRAP_AUTHORITY_V1.
calcula raw SHA-256 sobre bytes exactos.
exige igualdad con expectedTrustRootManifestRawSha256.
si diverge, falla antes de parsear o seleccionar cualquier perfil V2.

BOOTSTRAP_RAW_SHA256_V1 no sustituye logical hashing. Solo autentica el manifest de bootstrap por identidad exacta de archivo.

## 5. INTEGRATION_CRYPTO_RUNTIME_BINDING_V1

Una vez verificado por raw hash el trust-root manifest, resolver obtiene un binding lógico de runtime equivalente a:

INTEGRATION_CRYPTO_RUNTIME_BINDING_V1 = {
  activeIntegrationHashProfileId,
  hashProfileRegistryDependency,
  canonicalJsonDomainDependency,
  canonicalJsonSerializerDependency,
  canonicalJsonNumberPolicyDependency,
  trustedJsonMaterializerDependency,
  controlledJsonBuilderDependency,
  strictParserDependency,
  byteStringDependency
}.

Cada dependency exige dependencyId + canonical repo-relative path + raw SHA-256.

Resolver verifica todos esos raw hashes antes de aceptar el runtime V2.

activeIntegrationHashProfileId debe ser CANONICAL_JSON_SHA256_V2 para los artefactos R11 que así lo requieran.

## 6. Orden de bootstrap obligatorio

1. cargar BOOTSTRAP_AUTHORITY_V1 desde configuración autorizada.
2. leer bytes exactos del trust-root manifest.
3. verificar expectedTrustRootManifestRawSha256.
4. parsear el manifest únicamente con la ruta bootstrap autorizada por el resolver release.
5. obtener INTEGRATION_CRYPTO_RUNTIME_BINDING_V1.
6. verificar raw SHA-256 de todas sus dependencies.
7. cargar/pinar parser, materializer, builder, domain, serializer y number policy autorizados.
8. activar CANONICAL_JSON_SHA256_V2.
9. recién entonces materializar/verificar INPUT_BINDING y otros artefactos V2.

Ningún field dentro de INPUT_BINDING puede elegir o reemplazar los componentes usados en steps 1–8.

## 7. Trust-root echo para trazabilidad

Después del bootstrap, resolver calcula un identificador de trazabilidad:

integrationCryptoRuntimeBindingDigest = CANONICAL_JSON_SHA256_V2(INTEGRATION_CRYPTO_RUNTIME_BINDING_V1).

INPUT_BINDING_V6 puede incluir:

bootstrapAuthorityId.
trustRootManifestRawSha256.
integrationCryptoRuntimeBindingDigest.

Estos fields solo reflejan el trust root ya establecido.

Está prohibido usarlos para auto-seleccionar o auto-autorizar el verifier que valida el mismo INPUT_BINDING.

## 8. Trust-root drift

Si cambia cualquiera de:

BOOTSTRAP_AUTHORITY_V1.
trust-root manifest raw SHA.
dependency raw SHA.
active integration hash profile.
parser/materializer/builder/serializer/number policy.

el intento actual queda inválido.

Resultado:

INTEGRATION_TRUST_ROOT_DRIFT → no reuse de request/response → fresh preflight obligatorio.

## 9. Compatibilidad E5 preservada

R11 no cambia la matriz de perfiles de R10.

Los fields existentes consumidos por E5 siguen en LEGACY_LOGICAL_SHA256_V1.
Los artefactos internos nuevos de integración pueden usar CANONICAL_JSON_SHA256_V2 solo después del bootstrap.

E5_HASH_PROFILE_COMPATIBILITY_GATE_V1 sigue siendo obligatorio antes de Repair R1.

La selección del bridge A/B/C permanece OPEN.

## 10. R10-N2 — CONTROLLED_JSON_SNAPSHOT_V1

R11 reemplaza la noción insuficiente de “validated reference” por una snapshot controlada e inmutable.

CONTROLLED_JSON_SNAPSHOT_V1 es el valor lógico admitido al canonicalizer.

Propiedades obligatorias:

detached: no conserva references a source objects/arrays.
alias-free: dos paths internos no comparten una referencia mutable salvo que la representación sea intrínsecamente inmutable.
own-data-only: los objects internos contienen solo own enumerable string data properties.
prototype-independent: la prototype chain no participa en lectura ni serialización.
accessor-free: no getters/setters.
dense-arrays-only.
deeply immutable from callers.
stable for repeated canonical reads.

## 11. Materialización detached

EXTERNAL_BYTES_ROUTE:

bounded exact bytes → strict parse/decoder → domain validation → recursive copy into controlled storage → seal snapshot → canonical hash.

CONTROLLED_BUILDER_ROUTE:

approved primitives/components → builder copies into controlled storage → seal snapshot → canonical hash.

En ambas rutas se prohíbe retener referencias a containers del origen.

La validación ocurre sobre el contenido que será copiado y el hash se calcula sobre la snapshot ya sellada.

## 12. Snapshot storage semantics

Una implementación válida puede usar:

module-private deeply immutable null-prototype structures.
canonical bytes as the primary representation.
persistent immutable data structures con invariantes equivalentes.
otra representación demostrablemente detached y alias-safe.

Object.freeze superficial por sí solo no es evidencia suficiente.

La implementación no puede depender de disciplina informal de “no mutar”.

## 13. CONTROLLED_JSON_VALUE_HANDLE_V2

V2 reemplaza V1.

El handle representa una CONTROLLED_JSON_SNAPSHOT_V1 ya sellada.

Requisitos:

no expone mutable internal containers.
no retorna referencias internas editables.
no permite setters.
no acepta replacement del backing snapshot.
cualquier vista compleja se devuelve como copia controlada o API read-only cuya implementación no permita mutación.

El canonicalizer acepta CONTROLLED_JSON_VALUE_HANDLE_V2 o canonical bytes derivados de esa snapshot, nunca arbitrary objects.

## 14. Snapshot identity

Después de sellar la snapshot puede calcularse:

controlledJsonSnapshotDigest = CANONICAL_JSON_SHA256_V2(snapshot).

Repeated reads deben producir exactamente el mismo digest.

Si el runtime soporta canonical-byte caching:

cache se crea solo después del seal.
cache pertenece al snapshot.
cache no puede invalidarse por aliases externos.

## 15. TOCTOU interno prohibido

La secuencia válida es:

capture input → copy/materialize → validate controlled representation → seal snapshot → canonical serialize/hash.

Está prohibido:

validate source reference → later hash same mutable source reference.
validate shallow clone with nested source aliases.
allow caller mutation after admission.
read getters during canonicalization.

Cualquier detección de mutation/alias inconsistency falla cerrado.

## 16. Tests obligatorios de snapshot

Antes de implementación autorizada deben probarse al menos:

mutación del source object después de admission no cambia snapshot/hash.
mutación de nested source array después de admission no cambia snapshot/hash.
intento de mutación a través del handle no altera snapshot.
special keys permanecen own data.
repeated canonical hash stability.
separate snapshots from same logical content hash igual.
source alias graph no se preserva como mutabilidad compartida.
cached canonical bytes, si existen, siguen ligados al snapshot correcto.

## 17. R10-N3 — EVIDENCE_CLAIM_V2

R11 reemplaza el modelo status-only por:

EVIDENCE_CLAIM_V2 = {
  claimId,
  status,
  evidenceBasis,
  supportingBindings
}.

status solo puede ser:

VERIFIED.
FAILED.
NOT_OBSERVABLE.

evidenceBasis solo puede ser:

DIRECT_RUNTIME_EVIDENCE.
IMPLEMENTATION_ASSURANCE.
NOT_OBSERVABLE.

## 18. Combinaciones permitidas

VERIFIED + DIRECT_RUNTIME_EVIDENCE: existe evidencia concreta por intento que resolver puede verificar directamente.

VERIFIED + IMPLEMENTATION_ASSURANCE: la propiedad no es observable de manera independiente por intento, pero está garantizada por una implementación provenance-bound + tests dentro del alcance declarado.

NOT_OBSERVABLE + NOT_OBSERVABLE: la capa no está disponible para verificación.

FAILED puede usar DIRECT_RUNTIME_EVIDENCE o IMPLEMENTATION_ASSURANCE según la base que demuestra el fallo.

Está prohibido VERIFIED + NOT_OBSERVABLE.

Está prohibido NOT_OBSERVABLE + DIRECT_RUNTIME_EVIDENCE.

## 19. supportingBindings

supportingBindings identifica únicamente evidencia pertinente al claim.

Puede incluir, según corresponda:

transportInvocationId.
providerInvocationHandleId.
providerRequestId.
providerObservationRecordDigest.
transport implementation dependency binding.
provider source-binding policy dependency.
regression/test artifact bindings.
provider/runtime descriptor.

No se acepta “implementation assurance” sin provenance y test evidence identificables.

## 20. Transport correlation claim

TRANSPORT_CORRELATION puede ser:

VERIFIED + DIRECT_RUNTIME_EVIDENCE cuando el runtime expone evidence per-attempt suficiente para demostrar el channel/source binding.

VERIFIED + IMPLEMENTATION_ASSURANCE cuando el scoping del callback/iterator depende de la semántica de una implementación transport provenance-bound y tests específicos, pero no es independientemente observable por resolver en ese intento.

FAILED si la evidencia disponible contradice el binding o detecta late/cross-invocation units.

El wording de resultados debe preservar la evidenceBasis.

## 21. Provider-native request identity claim

PROVIDER_NATIVE_REQUEST_IDENTITY solo puede ser VERIFIED + DIRECT_RUNTIME_EVIDENCE.

Si el provider no expone request ID: NOT_OBSERVABLE + NOT_OBSERVABLE.

No se permite VERIFIED + IMPLEMENTATION_ASSURANCE para provider-native identity, porque una implementación local no puede crear evidencia nativa del provider.

Si se expone un ID y diverge: FAILED + DIRECT_RUNTIME_EVIDENCE → fail closed.

## 22. Policy-required evidence strength

Cada provider/runtime policy debe declarar la fuerza mínima requerida por claim.

Ejemplo conceptual:

transportCorrelationMinimumBasis = IMPLEMENTATION_ASSURANCE or DIRECT_RUNTIME_EVIDENCE.
providerNativeIdentityMinimumBasis = NOT_REQUIRED or DIRECT_RUNTIME_EVIDENCE.

Si la policy exige DIRECT_RUNTIME_EVIDENCE y solo existe IMPLEMENTATION_ASSURANCE:

EVIDENCE_BASIS_INSUFFICIENT → fail closed antes del parser.

NOT_REQUIRED permite continuar con provider-native identity NOT_OBSERVABLE siempre que no se presente como VERIFIED.

## 23. Resolver recalculation

TRANSPORT_RECEIPT_V8 puede transportar claims propuestos, pero resolver recalcula status y evidenceBasis usando:

trusted provider/runtime policy.
transport/source bindings.
per-attempt evidence.
pinned implementation provenance.
pinned test-evidence bindings cuando se invoque IMPLEMENTATION_ASSURANCE.

Los claims producidos por transport no son autoridad.

INTEGRATION_ATTEMPT_RECORD registra los claims recalculados.

## 24. Test-evidence scope

IMPLEMENTATION_ASSURANCE debe quedar limitado por:

exact transport implementation raw SHA.
exact source-binding policy raw SHA.
exact provider/runtime scope.
exact test artifact/version.
platform/runtime constraints relevantes.

Un test de otro provider/runtime o implementación no puede respaldar el claim actual.

## 25. INPUT_BINDING_V6

V6 reemplaza V5 y añade:

bootstrapAuthorityId.
trustRootManifestRawSha256.
integrationCryptoRuntimeBindingDigest.
controlledJsonSnapshotPolicyBinding.
evidenceClaimPolicyBinding.

Conserva todos los bindings previos necesarios de request/model/resource/source/extraction.

El trust root es echo-only dentro de INPUT_BINDING_V6; no se selecciona desde ese objeto.

## 26. Pre-Repair R1 sequence R11

1. bootstrap BOOTSTRAP_AUTHORITY_V1.
2. verify trust-root manifest raw SHA.
3. pin INTEGRATION_CRYPTO_RUNTIME_BINDING_V1 dependencies.
4. activate authorized V2 runtime.
5. execute preflight/request/provider flow.
6. materialize inbound data into CONTROLLED_JSON_SNAPSHOT_V1.
7. verify evidence claims including evidenceBasis.
8. strict-parse/validate MODEL_RESPONSE through trusted materialization.
9. reread/rebind current run/report/dependencies.
10. verify INPUT_BINDING_V6.
11. apply E5_HASH_PROFILE_COMPATIBILITY_GATE_V1.
12. only then construct Repair R1.
13. E5.1.
14. E5.2.
15. E5.3.

## 27. Failure semantics añadidas

BOOTSTRAP_AUTHORITY_MISSING.
TRUST_ROOT_MANIFEST_RAW_HASH_MISMATCH.
INTEGRATION_CRYPTO_RUNTIME_DEPENDENCY_DRIFT.
INTEGRATION_TRUST_ROOT_DRIFT.
SELF_AUTHORIZING_INPUT_BINDING_FORBIDDEN.

CONTROLLED_JSON_SNAPSHOT_NOT_DETACHED.
CONTROLLED_JSON_ALIAS_DETECTED.
CONTROLLED_JSON_MUTATION_DETECTED.
CONTROLLED_JSON_HANDLE_MUTATION_FORBIDDEN.

EVIDENCE_CLAIM_INVALID.
EVIDENCE_BASIS_INSUFFICIENT.
EVIDENCE_SUPPORT_BINDING_MISSING.
PROVIDER_NATIVE_IDENTITY_CANNOT_USE_IMPLEMENTATION_ASSURANCE.

Ninguna habilita retry automático.

## 28. OPEN preservados

CANONICAL_JSON_NUMBER_POLICY.
CANONICAL_JSON_SHA256_V2 implementation.
bootstrap/deployment mechanism concrete.
trusted materializer implementation.
controlled snapshot implementation.
hash-profile bridge A/B/C.
E5 compatibility proof or migration.
prototype-safe E5.1 repair application + tests.
minimal-change executable rule or authority-level revision.
provider/model/runtime.
provider-specific source/capture/extraction policies.
exact evidence-strength policy per provider.
exact test-evidence artifacts.
numeric resource limits.
schemas concretos R11.
request projection.
response schema.
instruction artifacts.
generation parameters/provider features.
endpoint policy.
transport implementation.
sandbox.
strict parser implementation.
failure schema.
IDs.
observability.
implementation adversarial tests.
human implementation authorization.
NEXT_STAGE_ID.
AUTHORIZED_FOR_ASC.

## 29. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-DESIGN-R11-ASC-001

AUTHORIZED SOURCES:
- branch head cfe7ed5722219f615e97bda6e10ac4d61db964b4
- technical baseline main@63196dcf87b211f057a0f0b6f28d5a84098e2191
- DEVELOPMENT_MANUAL
- E5.1 / E5.2 / E5.3 authorities
- R10 design
- R10 directed regression
- current logicalSha256 implementation and E5 consumers
- Repair R1 schema

MANDATORY RELATIONS:
- V2 trust root is established before V2 artifact verification
- INPUT_BINDING cannot select the verifier used on itself
- bootstrap root uses exact raw-byte identity before logical hashing
- controlled JSON values are detached immutable snapshots
- canonicalizer never hashes mutable source references
- evidence claims include status + evidenceBasis + supportingBindings
- provider-native identity cannot be VERIFIED by implementation assurance
- implementation assurance is provenance/test/scope bound
- prior closures remain preserved
- E5.1/E5.2/E5.3 remain mandatory
- E5.3 remains sole durable boundary

DO NOT INFER:
- input binding can authorize its own crypto runtime
- freeze of a shallow object proves deep immutability
- validated reference equals immutable snapshot
- VERIFIED means direct runtime evidence unless evidenceBasis says so
- implementation assurance equals provider-native evidence
- design correction authorizes implementation
- design PASS implies AUTHORIZED_FOR_ASC

PROHIBITED:
- self-authorizing V2 trust bootstrap
- mutable aliases inside controlled snapshots
- provider-native VERIFIED claim from implementation assurance
- hidden evidence-basis upgrades
- silent hash-profile substitution or migration
- direct durable writes outside E5.3
- automatic retry
- NEXT_STAGE_ID inference

VALIDATION CRITERIA:
- R10-N1 out-of-band trust root + bootstrap order explicit
- R10-N2 detached immutable snapshot semantics explicit
- R10-N3 evidenceBasis semantics and claim-strength rules explicit
- all prior constraints preserved
- implementation remains unauthorized

ASC compila restricciones; no decide bootstrap deployment, canonicalizer, evidence policy values, provider, schemas ni implementación.

## 30. AUDITORÍA

R11 corrige R10-N1 al introducir BOOTSTRAP_AUTHORITY_V1 y BOOTSTRAP_RAW_SHA256_V1 antes de cualquier verificación V2.

R11 corrige R10-N2 al convertir el valor admitido en una snapshot detached, immutable y alias-safe antes del hashing.

R11 corrige R10-N3 al hacer que cada evidence claim declare tanto status como evidenceBasis y supportingBindings.

## 31. INCONSISTENCIAS

No se detecta contradicción intencional con Repair R1, E5.1, E5.2 o E5.3.

El trust root se termina explícitamente en BOOTSTRAP_AUTHORITY_V1 en vez de fingir una cadena infinita de auto-verificación.

La implementación concreta del bootstrap sigue OPEN y no se presenta como evidencia ejecutada.

## 32. VACÍOS / OMISIONES

Los OPEN de §28 permanecen bloqueantes para implementación.

En particular siguen fuera de cierre: hash-profile bridge A/B/C, canonical JSON number policy, canonicalizer V2, prototype-safe E5.1 y minimalChangeRequired.

No impiden auditar R11 como diseño.

## 33. REDUNDANCIAS

BOOTSTRAP_AUTHORITY + trust-root echo cubren autorización inicial y trazabilidad por intento.
Trusted materialization + immutable snapshot cubren admisión y estabilidad temporal.
Claim status + evidenceBasis cubren resultado y fuerza de evidencia.
E5 hash compatibility gate + E5.1/E5.2/E5.3 cubren compatibilidad y ejecución autoritativa.

No crean autoridad paralela.

## 34. Resolución dirigida

R10-N1 = ADDRESSED.
R10-N2 = ADDRESSED.
R10-N3 = ADDRESSED.

ADDRESSED != regression PASS.

## 35. Gate

R11 authored → directed regression R10-N1/R10-N2/R10-N3 → accumulated regression completa → correct any new finding → design validation → explicit human implementation decision → only then consider executable changes.

Estado:
REPAIR_AGENT_INTEGRATION_DESIGN = R11_CANDIDATE_FOR_DIRECTED_REGRESSION
IMPLEMENTATION_AUTHORIZED = FALSE
REPAIR_AGENT_CONNECTED = FALSE
NEXT_STAGE_ID = OPEN
AUTHORIZED_FOR_ASC = OPEN
