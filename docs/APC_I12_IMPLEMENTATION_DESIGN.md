# Árboris — APC I12 Implementation Design

**ID:** `ARBORIS_APC_I12_IMPLEMENTATION_DESIGN_V0.11`  
**Estado:** CANDIDATE FOR REVALIDATION WITH ASC.  
**Ámbito:** Hito 16 / APC I12 implementation design.  
**Contrato base:** `ARBORIS_APC_I12_UI_CONTRACT_R10`, candidato a revalidación sobre `main@035ff6edefd16df86eff5bc549efe7d41eae153e`.  
**Base canónica I1–I11 R4:** `main@035ff6edefd16df86eff5bc549efe7d41eae153e`.  
**Autoriza:** sólo revalidación e integración técnica candidata de I12; no congela cambios nuevos hasta completar gates.  
**No autoriza:** PR, merge a `main`, Gate B, cierre del Hito 16 ni integración runtime/producto H17.

## 1. Objetivo

Este diseño traduce el contrato I12 R9 congelado a una arquitectura implementable sin introducir una segunda fuente de verdad, una taxonomía epistemológica paralela ni autoridad nueva.

Principio central:

```text
UI intent
→ command
→ single-writer guard
→ normative command queue
→ transaction engine
→ candidateSession
→ I6/I8/I9/I10 reconciliation
→ validation stack
→ durable commit
→ currentSession
```

`APC_SESSION` es la única representación normativa APC persistida.

## 2. Superficie propuesta

La implementación puede organizarse conceptualmente como:

```text
tools/apc/ui/
├─ apc-ui.html
├─ apc-ui.mjs
├─ apc-ui-state.mjs
├─ apc-ui-ingest.mjs
├─ apc-ui-transactions.mjs
├─ apc-ui-executor.mjs
├─ apc-ui-persistence.mjs
├─ apc-ui-assets.mjs
└─ apc-ui.test.mjs
```

Los nombres de archivo son de implementación y no modifican el contrato APC.

## 3. Capas de estado

### 3.1 APC_SESSION

Única verdad normativa persistida.

Incluye exclusivamente las estructuras canónicas vigentes: photos, photoEvidence, individuals, evidence, requirements, pending, contradictions, revisions y bindings de sesión.

### 3.2 UI state

Estado efímero no normativo:

```text
activePhotoId
activeIndividualId
selectedPhotoIds
filters
zoom
editBuffers
runtime diagnostics
```

No se serializa dentro de `APC_SESSION`.

### 3.3 Asset runtime

Mapa efímero:

```js
Map<photoId, {
  file,
  objectUrl
}>
```

Ni `File`, ni `Blob`, ni `objectUrl` se incorporan a `APC_SESSION`.

### 3.4 Transaction context

Dependencias técnicas inyectadas:

```js
{
  dataset,
  newId,
  now,
  actorId,
  areStatesIncompatible,
  isContradictionRelevant
}
```

Producción puede usar `crypto.randomUUID()` y reloj real. Tests usan providers deterministas.

`dataset` es una dependencia explícita del executor/transacción. No se obtiene desde un global implícito. Debe proporcionar, como mínimo, `allCharactersById` y las propiedades canónicas que consumen los validadores de caracteres/estados. Un runtime sin dataset válido no habilita write mode para operaciones botánicas.

El conjunto `dataset + areStatesIncompatible + isContradictionRelevant` queda fijado para la vida de un contexto writer. Si cambia cualquiera de esas dependencias, la UI aplica el session-context barrier: detiene intake, espera el command activo, invalida queued commands/editBuffers, revalida el snapshot con las nuevas dependencias y sólo reabre write mode si vuelve a ser writer-ready. No se cambia semántica silenciosamente bajo commands ya construidos.

`areStatesIncompatible` e `isContradictionRelevant` son providers semánticos inyectados, deterministas y estables durante una transacción. La UI no puede reemplazarlos ad hoc. `areStatesIncompatible` debe aplicar el contrato canónico del carácter; no puede usar desigualdad genérica salvo que dicho contrato establezca exclusión mutua. El mismo provider se usa para reconciliación y validación I9 de un candidate. `isContradictionRelevant` debe usar la misma política al construir y validar la transición I10. Si cambia cualquiera de estos providers durante la vida de un contexto writer, se requiere revalidar/reabrir el contexto antes de aceptar nuevos commands.

## 4. Commands

Toda mutación normativa entra por commands explícitos.

Familias mínimas:

```text
PHOTO / ASSET-NORMATIVE
INGEST_PHOTOS
ASSIGN_PHOTO
UNASSIGN_PHOTO
BATCH_ASSIGN_PHOTOS
BATCH_UNASSIGN_PHOTOS
ADD_TO_INBOX
REMOVE_FROM_INBOX
BATCH_ADD_TO_INBOX
BATCH_REMOVE_FROM_INBOX

INDIVIDUAL
CREATE_INDIVIDUAL

EVIDENCE
SAVE_DRAFT
CONFIRM_EVIDENCE
EDIT_CONFIRMED_AS_DRAFT
EDIT_AND_RECONFIRM

REQUIREMENT
ADD_REQUIREMENT
otros commands explícitos permitidos por contratos vigentes

SESSION
SET_SESSION_STATUS cuando el contrato vigente lo permita
otras mutaciones normativas de sesión explícitamente cubiertas por contrato
```

Operaciones puramente runtime/UI no entran a la cola APC:

```text
SELECT_PHOTO
SELECT_INDIVIDUAL
NEXT_PHOTO
PREVIOUS_PHOTO
FILTER
ZOOM
RELINK_ASSET con fingerprint coincidente
PREFILL_TO_EDIT_BUFFER
SUGGEST_INSPECTION_TARGETS
EXPORT_APC
RUN_I11_VERIFICATION
```

`EXPORT_APC` y `RUN_I11_VERIFICATION` son operaciones de lectura/derivación; no modifican `APC_SESSION`.

### 4.1 Asignación, desasignación e inbox

`ASSIGN_PHOTO` y `BATCH_ASSIGN_PHOTOS` sólo agregan `individualId` a `PHOTO.individualRefs[]`; nunca duplican PHOTO, PhotoEvidence ni evidencia botánica.

`UNASSIGN_PHOTO` y `BATCH_UNASSIGN_PHOTOS` aplican antes de toda mutación el guard R9 sobre TODA la historia:

```text
exists session.evidence revision
where evidence.photoId = targetPhotoId
AND evidence.individualId = targetIndividualId
→ UNASSIGN_BLOCKED
→ snapshot sin cambios
```

El guard incluye `current=true` y `current=false`, DRAFT y CONFIRMED. No se permite reatribuir ni borrar evidencia para hacer posible la desasignación.

Los commands batch son all-or-nothing para APC:

```text
si cualquier item viola un guard
→ REJECT batch completo
→ no commit parcial
```

Las operaciones de inbox modifican exclusivamente `inboxPhotoRefs[]`. No crean `classifiedPhotoRefs[]`, `classifiedPhotos[]` ni otra colección paralela.

Las operaciones batch permitidas son reversibles mediante su command inverso mientras ese inverso siga siendo válido bajo los guards actuales. La UI conserva el descriptor runtime necesario para ofrecer Undo mientras no exista una mutación dependiente posterior. Si posteriormente aparece evidencia histórica que hace ilegal una desasignación, el Undo deja de ofrecerse como ejecutable: la reversibilidad nunca autoriza violar I5/I6. Las operaciones de inbox permanecen reversibles mediante su inverso mientras la PHOTO exista. No confirman estados botánicos, no copian `observedState` y no crean evidencia positiva.

Los targets repetidos dentro de un mismo batch se deduplican antes de construir el mutation plan. El orden del input no puede producir duplicados ni commits distintos para el mismo conjunto de targets.

Al ingresar una PHOTO nueva:

```text
→ se agrega una sola vez a photos[]
→ se agrega una sola vez a inboxPhotoRefs[]
```

Si el fingerprint ya existía:

```text
→ se reutilizan PHOTO + PhotoEvidence existentes
→ se conserva fileRef canónico previo
→ no se altera por nombre/ruta de la carga duplicada
→ membership de inbox existente no se modifica implícitamente
```

`inboxPhotoRefs[]` se trata con semántica de conjunto ordenado: cada `photoId` aparece como máximo una vez. `PHOTO.individualRefs[]` aplica la misma unicidad por `individualId`. Agregar una referencia ya presente es NO_OP.

### 4.2 ACTIVE_REVIEW_TARGET y commands de evidencia

`ACTIVE_REVIEW_TARGET` permanece UI-only:

```text
activePhotoId
activeIndividualId
```

Al crear un command de evidencia, la UI captura explícitamente:

```text
targetPhotoId
targetIndividualId
characterId
```

El executor no confía en la selección UI mutable al momento posterior de ejecución. Antes de crear/revisar evidencia valida:

```text
targetPhotoId existe
targetIndividualId existe
targetIndividualId ∈ target PHOTO.individualRefs[]
```

Si falla:

```text
→ REJECT / STALE_COMMAND según corresponda
→ no APC_EVIDENCE
```

Cambiar de IND-A a IND-B nunca reutiliza el `evidenceId` de IND-A. Como `individualId` es identidad I6 inmutable, un target biológico distinto requiere otra evidencia lógica.

### 4.3 Prefill y sugerencias

`PREFILL_TO_EDIT_BUFFER` sólo prepara estado efímero. No constituye APC_EVIDENCE ni confirmation.

Cuando el buffer usa adquisición `prefilled`:

```text
acquisition.mode = prefilled
basis.type = prior_observations
basis.photoEvidenceRefs = referencias explícitas
```

Puede permanecer DRAFT sin ser handoff-eligible. Para CONFIRMED debe existir nueva acción humana sobre la foto actual y la adquisición final debe cumplir el contrato vigente, incluido `confirmedOnCurrentPhoto=true`.

`SUGGEST_INSPECTION_TARGETS` puede producir únicamente:

```text
characterId
estructura
definición/ayuda/instrucción observacional
```

Puede usar dataset y un conjunto explícito de candidatos cuando exista. Nunca devuelve, preselecciona ni persiste un `observedState` botánico como inferencia automática.

## 5. Freshness preconditions

Todo contexto de sesión cargado mantiene una identidad runtime no persistida:

```text
sessionEpoch
```

Cada command normativo debe declarar:

```text
targetSessionId
baseSessionEpoch
baseCommitGeneration
```

Guard de sesión:

```text
command.targetSessionId != currentSession.sessionId
OR
command.baseSessionEpoch != sessionEpoch
→ STALE_COMMAND
→ no mutación
→ no persistencia
```

Al abrir, importar o reemplazar la sesión activa:

```text
→ invalidar la cola anterior
→ invalidar/marcar stale los editBuffers anteriores
→ limpiar assetRuntime cuando corresponda al cambio de sesión
→ sessionEpoch += 1
→ runtimeGeneration = 0
```

Los commands pendientes de un epoch anterior no pueden adquirir vigencia sólo porque el nuevo contexto vuelva a usar el mismo valor de `runtimeGeneration`.

Todo command normativo se construye además contra una generación runtime del último commit conocido:

```text
baseCommitGeneration
```

El executor mantiene:

```text
runtimeGeneration
```

como contador exclusivamente runtime, no persistido dentro de `APC_SESSION`.

Regla global:

```text
al dispatch
→ command.baseCommitGeneration = runtimeGeneration actual

después de cada COMMITTED normativo
→ runtimeGeneration += 1

al comenzar efectivamente el turno
command.baseCommitGeneration == runtimeGeneration
→ puede continuar

command.baseCommitGeneration != runtimeGeneration
→ STALE_COMMAND
→ no mutación
→ no persistencia
```

Esta precondición se aplica incluso a cambios normativos que no alteran el assessment substrate de I10, por ejemplo assignment de PHOTO/INDIVIDUAL o metadata normativa no semántica.

Todo command que modifica una evidencia existente debe declarar además:

```text
evidenceId
baseRevision
```

Para evidencia aún no persistida:

```text
evidenceId = null o nuevo id reservado por la transacción
baseRevision = null
```

Al comenzar efectivamente el turno:

```text
current revision == baseRevision
→ puede continuar

current revision != baseRevision
→ STALE_COMMAND
→ no mutación
→ no persistencia
```

No existe auto-rebase silencioso de edición botánica.

`expectedSemanticRevision` puede utilizarse como precondición adicional cuando una operación dependa específicamente del substrate I10, pero no sustituye `baseCommitGeneration` como freshness global.

Un command rechazado por stale state debe reconstruirse desde `currentSession`; no se modifica silenciosamente su base para reintentarlo.

## 6. Autosave, confirmación y recuperación de stale state

Si existe un autosave pendiente del mismo target y el usuario confirma:

```text
CONFIRM
→ espera/flush del SAVE_DRAFT pendiente del mismo target
→ lee la revisión current resultante
→ construye CONFIRM contra esa baseRevision y baseCommitGeneration vigentes
```

Nunca se confirma contra una revisión anterior mientras un autosave normativo del mismo target está en vuelo.

Si un command devuelve `NEEDS_DECISION`, la decisión posterior no reusa ciegamente el command anterior: se reconstruye contra la sesión vigente y vuelve a validar sus precondiciones.

Si un command devuelve `STALE_COMMAND`:

```text
→ no auto-rebase
→ no auto-retry
→ currentSession committed permanece autoridad
→ UI vuelve a renderizar el estado committed vigente
→ el editBuffer viejo puede conservarse sólo como buffer efímero marcado STALE para comparación humana
→ el usuario debe descartarlo o re-aplicar conscientemente su intención sobre un buffer fresco
```

La UI no puede limitarse a cambiar `baseRevision` o `baseCommitGeneration` del command rechazado y reenviarlo automáticamente.

### 6.1 Session-switch barrier

Cambiar de sesión, importar otra sesión o reemplazar el contexto writer usa un barrier del executor.

Secuencia obligatoria:

```text
SESSION_SWITCH_REQUEST
→ dejar de aceptar nuevos commands normativos del contexto saliente
→ permitir que el command activo, si existe, llegue a estado terminal:
     COMMITTED | REJECTED | NEEDS_DECISION | STALE_COMMAND | NO_OP
→ rechazar/inutilizar todos los commands queued aún no iniciados
→ esperar también a que terminen los efectos runtime post-commit del command activo
→ invalidar/marcar STALE editBuffers del contexto saliente
→ limpiar assetRuntime del contexto saliente
→ liberar writer lock de la sesión saliente
→ sessionEpoch += 1
→ runtimeGeneration = 0
→ instalar/adquirir el nuevo contexto según su propia ruta de load/import/bootstrap
```

El writer lock nunca se libera mientras un command de esa sesión todavía puede tocar storage.

Si el browser context desaparece abruptamente, no se ejecuta un switch lógico: la primitiva de lock libera el ownership al terminar el contexto y la atomicidad del adapter garantiza que storage quede íntegramente en previous o candidate.

## 7. Single-writer guard entre browser contexts

La cola interna evita concurrencia dentro de un solo runtime, pero I12 requiere además un único writer por `sessionId` entre pestañas/ventanas.

Invariante:

```text
máximo un writer normativo activo
por sessionId
entre todos los browser contexts
```

El lock es de vida de sesión writer, no de vida de command.

Entrada a write mode:

```text
OPEN SESSION AS WRITER
→ solicitar lock exclusivo arboris-apc:<sessionId>
→ si se obtiene, mantenerlo durante toda la vida del contexto writer
→ sólo entonces habilitar commands normativos
```

Mientras el contexto mantenga write mode:

```text
→ todos los commands pasan por la cola interna
→ el lock NO se libera entre commands
```

Salida:

```text
EXIT WRITE MODE / session replacement / unload / pérdida del contexto
→ liberar lock
```

La implementación primaria debe usar Web Locks (`navigator.locks`) o una primitiva equivalente con exclusión real y lifetime controlable.

Si otro contexto intenta abrir el mismo `sessionId` mientras el writer lock está retenido:

```text
→ read-only
o
→ apertura writer rechazada
```

Si el runtime no dispone de una primitiva capaz de garantizar exclusión:

```text
→ no habilitar modo writer
→ abrir sesión read-only o declarar write mode unsupported
```

No se permite degradar silenciosamente a last-write-wins.

Antes de construir cada transacción normativa mientras se mantiene el lock:

```text
→ releer snapshot persistido
→ validar freshness global y precondiciones específicas
→ recién entonces ejecutar el command
```

El lock, writer token o metadata de coordinación son runtime/storage; nunca campos de `APC_SESSION`.

## 8. Normative command queue

Dentro del writer activo existe una única cola normativa.

```text
máximo un command normativo en vuelo
```

Un command normativo captura `targetSessionId`, `baseSessionEpoch` y `baseCommitGeneration` cuando se despacha/encola.

Al comenzar efectivamente su turno, el executor relee storage y verifica freshness antes de asignar `previousSession` a la transacción.

```text
A despachado contra generation=N
B despachado/encolado contra generation=N

A previous=S1
→ commit S2
→ runtimeGeneration=N+1

B comienza turno
→ baseCommitGeneration=N != N+1
→ STALE_COMMAND
→ no previousSession transaccional
→ no auto-rebase
→ no commit

usuario/UI reconstruye conscientemente B desde S2
→ nuevo B baseCommitGeneration=N+1
→ B previous=S2
→ puede producir S3
```

La cola serializa ejecución pero no convierte commands antiguos en intención automáticamente rebasable. La excepción explícita de §6 para `CONFIRM` después de autosave pendiente consiste en esperar/flush y construir un command CONFIRM nuevo contra el estado committed resultante.

El coalescing es opcional y sólo puede aplicarse a `SAVE_DRAFT` aún no iniciado del mismo evidence target. Commands de confirmación, requirements, assignment o decisiones de pending no se coalescen automáticamente.

## 8.1 Session lifecycle, epoch y bootstrap

Cambiar la sesión activa es una operación de lifecycle del executor, no una mutación dentro del `APC_SESSION` anterior.

Al reemplazar/cargar/importar una sesión se aplica exclusivamente el session-switch barrier de §6.1. El `sessionEpoch` invalida commands/buffers queued, pero no sustituye la espera del command ya activo.

La creación inicial de una sesión usa una ruta bootstrap explícita `CREATE_SESSION`. No existe `previousSession`, por lo que no se ejecuta `validateApcSemanticTransition()` contra una sesión inexistente.

Snapshot inicial mínimo:

```text
schemaVersion = APC_SCHEMA_VERSION
sessionId = newId()
semanticRevision = 1
status = OPEN
objective = valor humano explícito
objectiveAssessment.status = OPEN
objectiveAssessment.assessedRevision = null
objectiveAssessment.assessedBy = null
objectiveAssessment.assessedAt = null
createdAt = now()
createdBy = actorId
inboxPhotoRefs = []
photos = []
photoEvidence = []
individuals = []
evidence = []
requirements = []
pending = []
contradictions = []
revisions = []
```

Bootstrap:

```text
generar sessionId
→ adquirir writer lock de ese sessionId
→ comprobar que no existe snapshot durable con ese sessionId
→ construir snapshot inicial
→ validateApcSession()
→ validateApcWritableWorkingSnapshot() cuando el helper de §18 esté disponible
→ saveAtomic()
→ SUCCESS:
     currentSession = snapshot inicial
     sessionEpoch += 1
     runtimeGeneration = 0
→ FAIL:
     no currentSession nueva
     liberar lock
```

Un `sessionId` ya existente no se sobrescribe durante bootstrap.

## 9. Transaction engine

Forma conceptual:

```js
applyApcTransaction({
  previousSession,
  command,
  context
})
```

Resultado lógico:

```js
{
  status: "READY_TO_COMMIT" | "REJECTED" | "NEEDS_DECISION",
  nextSession: null | candidate,
  errors: [],
  decisionsRequired: []
}
```

`READY_TO_COMMIT` aún no convierte al candidate en autoridad.

## 10. Secuencia transaccional

Precondición: el contexto ya mantiene el writer lock exclusivo de vida de sesión definido en §7.

Para una mutación normativa:

```text
1. verificar que write mode y writer lock siguen vigentes
2. releer snapshot persistido
3. verificar targetSessionId + baseSessionEpoch + baseCommitGeneration y demás freshness/preconditions
4. clonar/leer previousSession
5. construir un mutation plan sin crear revisiones, revisionEvents, IDs históricos ni timestamps
6. comparar intención normativa contra previousSession

   si no existe cambio normativo real:
   → NO_OP
   → no newId()/now() para historia
   → no I6
   → no I8/I9/I10 mutation
   → no saveAtomic()
   → no runtimeGeneration++

7. sólo si existe cambio normativo:
   materializar la mutación primaria
8. construir revisiones I6 y revisionEvents cuando aplica
9. calcular satisfaction de requirements
10. reconciliar I8
11. reconciliar I9
12. calcular substrate I10
13. ajustar semanticRevision una vez si corresponde
14. resetear objectiveAssessment si corresponde
15. ejecutar validation stack writer-ready
16. serializar candidate
17. persistir candidate mediante atomic replace
18. confirmar commit durable exitoso
19. promover currentSession
20. incrementar runtimeGeneration exactamente una vez
21. aplicar efectos runtime post-commit
22. continuar cola manteniendo el writer lock
```

Cualquier fallo antes de completar exitosamente el paso 18 —incluido un fallo de `saveAtomic()` o de la confirmación durable del adapter—:

```text
→ ABORT
→ currentSession permanece previousSession
→ snapshot persistido permanece exactamente previo
→ runtimeGeneration no cambia
→ no se consume revisión ni semanticRevision como historia committed
```

El paso 19 es la primera promoción de autoridad en memoria. Después de esa promoción sólo pueden fallar efectos exclusivamente runtime del paso 21; esos fallos generan warning/degradación local y nunca revierten el commit APC.

## 11. I6 revision construction

Toda modificación de evidencia persistida conserva identidad:

```text
sessionId
photoId
photoEvidenceRef
individualId
characterId
```

Si cambia cualquiera, corresponde un nuevo `evidenceId`.

Nueva revisión:

```text
revision = N+1
previous current=false
new current=true
revisionEvent adyacente N→N+1
```

El revision event recibe mediante context:

```text
revisionEventId ← newId()
changedAt ← now()
changedBy ← actorId
reason ← command semántico ejecutado
```

## 12. DRAFT / CONFIRMED

Las rutas R9 se implementan literalmente.

### Nueva evidencia nunca persistida

```text
SAVE_DRAFT
→ revision 1 DRAFT

CONFIRM
→ revision 1 CONFIRMED
→ no DRAFT ficticio
```

### Current DRAFT

```text
save con cambio
→ revision N+1 DRAFT

confirm
→ revision N+1 CONFIRMED
```

### Current CONFIRMED

```text
edit + save sin nueva confirmación
→ revision N+1 DRAFT
→ no hereda confirmation

edit + confirm explícito
→ revision N+1 CONFIRMED
→ nueva confirmation
```

Toda nueva current CONFIRMED debe cumplir simultáneamente:

```text
validateApcEvidenceForHandoff(newConfirmedEvidence).valid = true
+
validación registrada fuerte definida abajo
```

antes de persistirse como confirmada. La validación fuerte es adicional; no reemplaza el requisito explícito R9 de `validateApcEvidenceForHandoff()`.

### 12.1 Validación común de APC_EVIDENCE persistida

Un formulario incompleto permanece en `editBuffer` efímero. I12 sólo crea una `APC_EVIDENCE` DRAFT cuando el payload ya cumple el mínimo canónico persistible.

Durante implementación se debe factorizar un helper reusable, conceptualmente:

```js
validateRegisteredApcEvidencePayload(
  dataset,
  session,
  evidenceId,
  revision,
  {
    requireCurrent,
    operationalDatasetCheck
  }
)
```

La capa intrínseca, aplicada a toda revisión DRAFT o CONFIRMED, valida al menos:

```text
evidenceId/revision/current e identidad I6 válidos
lifecycleStatus ∈ DRAFT | CONFIRMED
evidenceStatus ∈ OBSERVED | UNCERTAIN | NOT_OBSERVABLE
PHOTO / PhotoEvidence / INDIVIDUAL referencialmente compatibles

sourceType/sourceId:
→ o ambos ausentes en un DRAFT todavía no atribuido a productor
→ o ambos presentes y canónicos
→ sourceType, si está presente, ∈ human | tool | model | imported

acquisition, si está materializada:
→ acquisition.mode ∈ manual | prefilled | automatic

si acquisition.mode = prefilled, incluso en DRAFT:
→ basis existe
→ basis.type = prior_observations
→ basis.photoEvidenceRefs contiene al menos una ref existente
→ confirmedOnCurrentPhoto puede seguir false/ausente mientras sea DRAFT

confidence null o número 0..1
OBSERVED → observedState no vacío
UNCERTAIN/NOT_OBSERVABLE → observedState vacío + reason no vacío
evidence, si existe, es array

si lifecycleStatus = DRAFT:
→ confirmation ausente o null
→ nunca se conserva/copía confirmation de una revisión CONFIRMED anterior
```

Para la revisión `current=true`, `operationalDatasetCheck=true` añade:

```text
characterId conocido en dataset actual
OBSERVED → observedState permitido actualmente por el carácter
```

Por tanto un DRAFT current con estado botánico inexistente no se persiste; el formulario permanece efímero hasta producir un payload válido.

### 12.2 Validación adicional de CONFIRMED

`validateApcEvidenceForHandoff()` por sí solo no cubre todas las reglas que la ruta APC→CharacterObservation aplica actualmente. I12 no duplica esas reglas.

Se factoriza además, conceptualmente:

```js
validateRegisteredApcConfirmedEvidence(
  dataset,
  session,
  evidenceId,
  revision,
  {
    requireCurrent,
    operationalDatasetCheck
  }
)
```

Este helper reutiliza la validación común de §12.1 y añade:

```text
lifecycleStatus = CONFIRMED
confirmation humana válida
sourceType/sourceId completos y soportados
importMetadata requerido cuando sourceType=imported
acquisition completa
prefilled → confirmedOnCurrentPhoto=true
prefilled → basis prior_observations válida y refs existentes
provenance/contexto requerido por la adaptación
```

Para una nueva/current CONFIRMED:

```text
requireCurrent = true
operationalDatasetCheck = true
```

y debe ser transformable por la misma lógica canónica usada por APC→CharacterObservation.

Para una revisión histórica `current=false`:

```text
requireCurrent = false
operationalDatasetCheck = false
```

Se valida su integridad intrínseca, confirmation, provenance, acquisition y referencias conservadas, pero NO se reinterpreta retrospectivamente contra el catálogo/allowedStates del dataset actual. Esto evita invalidar historia sólo porque el contrato botánico operativo cambie después.

La revisión histórica conserva literalmente `characterId` y `observedState`; no se corrige ni migra silenciosamente.

`adaptRegisteredApcEvidenceToCharacterObservation()` y la validación I12 deben reutilizar estos helpers o una factorización común equivalente, no mantener definiciones divergentes.

## 13. I8 pending reconciliation

`critical` nunca se infiere.

Cada creación de un nuevo `UNRESOLVED_REQUIREMENT pendingId`, incluida recurrencia, requiere decisión explícita:

```text
pendingCritical: true | false
```

Si falta:

```text
status = NEEDS_DECISION
type = PENDING_CRITICAL
requirementId = ...
→ no commit
```

El episodio previo puede mostrarse como contexto visual, pero su `critical` no se hereda automáticamente.

Reglas:

```text
requirement satisfecho + OPEN
→ resolver conforme I8

requirement insatisfecho + OPEN
→ conservar

requirement insatisfecho + no OPEN + no historia
→ requiere pendingCritical explícito

requirement insatisfecho + último episodio RESOLVED
→ recurrencia
→ nuevo pendingId
→ previousPendingId directo
→ requiere pendingCritical explícito
```

## 14. Determinismo de resolutionEvidenceRefs

Cuando un pending pasa `OPEN → RESOLVED`, se recopilan todas las evidencias que, en el snapshot de transición, califican para resolverlo conforme a I8.

Orden canónico:

```text
evidenceId ordinal ascendente
revision numérica ascendente
```

Comparador ordinal:

```js
if (a.evidenceId < b.evidenceId) return -1;
if (a.evidenceId > b.evidenceId) return 1;
return a.revision - b.revision;
```

No se usa `localeCompare()`.

## 15. I9 contradiction reconciliation

Para cada serie afectada `(individualId, characterId)`:

```text
current + CONFIRMED + OBSERVED
↓
areStatesIncompatible()
```

Si aparece incompatibilidad y no existe OPEN:

```text
→ nuevo contradictionId
```

Si desaparece:

```text
→ OPEN → RESOLVED
```

Si reaparece tras RESOLVED:

```text
→ nuevo contradictionId
→ previousContradictionId = predecesor directo
```

I12 nunca elige evidencia ganadora.

## 16. Determinismo de contradiction.evidenceRefs

Al crear un episodio nuevo se capturan todas las evidencias del conjunto operacional actual de esa serie:

```text
current=true
CONFIRMED
OBSERVED
mismo individualId
mismo characterId
```

Se ordenan por:

```text
evidenceId ordinal
revision numérica
```

y se persiste el snapshot completo en `evidenceRefs[]`.

Debe existir al menos un par incompatible; `validateApcContradictionTransition()` conserva esa garantía.

## 17. I10 semantic transition

Después de I8/I9 se aplica exactamente el contrato I10.

Si cambia el assessment substrate:

```text
semanticRevision N → N+1
objectiveAssessment.status = OPEN
assessedRevision = null
assessedBy = null
assessedAt = null
```

Una transacción que modifica varias entidades incrementa `semanticRevision` sólo una vez.

Si no cambia el substrate, la revisión semántica permanece igual.

## 18. Validation stack y working snapshot integrity

I12 distingue un snapshot inspeccionable de un snapshot apto para write mode. La autoridad writer usa una composición reusable, conceptualmente:

```js
validateApcWritableWorkingSnapshot(
  session,
  { dataset, areStatesIncompatible }
)
```

No constituye un nuevo contrato epistemológico. Compone reglas canónicas existentes y factoriza las privadas cuando sea necesario.

Debe cubrir:

```text
1. validateApcSession(session)

2. control plane I10 mínimo:
   semanticRevision integer >= 1

   objectiveAssessment.status = OPEN
   → assessedRevision = null
   → assessedBy = null
   → assessedAt = null

   objectiveAssessment.status = SATISFIED | NOT_SATISFIED
   → assessedRevision = semanticRevision
   → assessedBy canónico
   → assessedAt ISO-8601 válido

   session.pass
   → no persistido

   session.exportable
   → no persistido

3. validateApcRequirementCharacters(session, dataset)

4. toda APC_EVIDENCE
   → validateRegisteredApcEvidencePayload(...)

   current=true
   → operationalDatasetCheck=true

   current=false
   → operationalDatasetCheck=false

5. toda revisión lifecycleStatus=CONFIRMED
   → validateRegisteredApcConfirmedEvidence(...)

   current=true
   → requireCurrent=true
   → operationalDatasetCheck=true

   current=false
   → requireCurrent=false
   → operationalDatasetCheck=false

6. requirement coverage snapshot:
   satisfied requirement
   → 0 OPEN UNRESOLVED_REQUIREMENT

   unsatisfied requirement
   → exactamente 1 OPEN UNRESOLVED_REQUIREMENT

7. validateApcContradictions(
     session,
     { areStatesIncompatible }
   )

8. invariantes I12 de colección/asset:
   inboxPhotoRefs[]
   → refs únicas

   cada PHOTO.individualRefs[]
   → refs únicas

   cada PHOTO
   → photoEvidenceId canónico obligatorio
   → resuelve exactamente un PhotoEvidence
   → PHOTO.photoEvidenceId = PhotoEvidence.photoEvidenceId
   → PhotoEvidence.sourcePhoto.photoRef = PHOTO.photoId

   conjunto PHOTO ↔ PhotoEvidence
   → cardinalidad total 1:1

   PhotoEvidence.sourcePhoto.fingerprintSha256
   → único dentro de la sesión
   → comparación hexadecimal case-insensitive
   → dos fingerprints iguales no pueden pertenecer a PHOTO/PhotoEvidence distintos
```

Las invariantes del punto 8 se implementan en un helper I12 reusable, conceptualmente `validateApcI12AssetAndCollectionInvariants()`. Debe factorizar sólo las garantías que faltan sobre `validateApcSession()`: obligatoriedad de `PHOTO.photoEvidenceId`, cardinalidad total 1:1, unicidad de refs y unicidad de fingerprint. No duplica la validación bidireccional ya existente.

Un import que contenga PHOTO sin PhotoEvidence correspondiente, dos PHOTO ligadas al mismo PhotoEvidence o dos PHOTO distintas con el mismo fingerprint no se auto-repara ni auto-fusiona; se rechaza para write mode y puede abrirse sólo READ_ONLY para diagnóstico.

Las reglas del punto 2 deben exponerse/factorizarse desde la lógica canónica I10 actualmente usada por `validateObjectiveAssessmentBinding()` y `validateApcSessionForExport()`; no se copian dentro de UI.

La regla de coverage del punto 6 debe reutilizar la misma definición actualmente usada por I10. Durante implementación se debe exponer/factorizar un helper canónico, conceptualmente `validateApcRequirementCoverage()`, desde `requirementCoverageErrors()`.

`validateApcWritableWorkingSnapshot()` no exige que el snapshot sea EXPORTABLE ni PASS. Por tanto:

```text
WRITABLE WORKING SNAPSHOT VALID
≠ EXPORTABLE
```

pero sí garantiza que el snapshot puede participar en una transición I12 posterior sin fallar por control-plane preexistente.

Un JSON que sea estructuralmente inspeccionable pero falle estas precondiciones writer puede abrirse, si la UI implementa esa función, sólo como READ_ONLY. No adquiere autoridad writer ni se auto-repara.

Antes de persistir cualquier candidate normativo:

```text
validateApcWritableWorkingSnapshot(nextSession, ...)
```

Cuando I8 cambia entre snapshots:

```text
validateApcPendingTransition(previousSession, nextSession)
```

Cuando I9 cambia:

```text
validateApcContradictionTransition(
  previousSession,
  nextSession,
  { areStatesIncompatible }
)
```

Siempre para una transición normativa con `previousSession`:

```text
validateApcSemanticTransition(
  previousSession,
  nextSession,
  { isContradictionRelevant }
)
```

Una nueva current CONFIRMED debe pasar además la validación de §12.2 con `requireCurrent=true` y `operationalDatasetCheck=true`.

Export sigue usando I10, pero la superficie I12 exige primero sus propias invariantes writer-ready:

```text
validateApcWritableWorkingSnapshot()
→ PASS

validateApcSessionForExport()
→ exportable=true

buildApcSessionExport()
```

Esto no redefine EXPORTABLE/PASS de I10. Es un gate de la superficie I12 para impedir que un snapshot abierto sólo como READ_ONLY por violar R9 sea presentado por la UI como export APC normativo.

## 19. Durable persistence

El adapter mínimo conceptual:

```js
persistence = {
  load(sessionId),
  saveAtomic(sessionId, serializedSession)
}
```

La eliminación de sesiones queda fuera de alcance de I12 v0.5; el adapter mínimo no expone `clear()`.

`saveAtomic()` debe ofrecer semántica all-or-nothing:

```text
SUCCESS
→ el snapshot durable es exactamente candidate

FAIL
→ el snapshot durable permanece exactamente previous
```

No es suficiente iniciar una escritura o resolver una Promise antes de que el commit del adapter haya concluido según su propia semántica.

Un adapter sólo es compatible con write mode si puede garantizar atomic replace. Ejemplos de mecanismos aceptables:

```text
localStorage
→ una única sustitución del string completo bajo la clave de sesión

IndexedDB
→ una transacción atómica equivalente
```

La verificación read-after-write puede añadirse como hardening, pero no sustituye la garantía de atomicidad del primitive de storage.

`saveAtomic()` debe completar exitosamente antes de promover `currentSession`.

Si persistence falla:

```text
→ candidate descartado
→ currentSession no cambia
→ runtimeGeneration no cambia
→ durable snapshot permanece previous
→ ningún cambio se presenta como committed
```

El diseño no exige una tecnología específica. El adapter elegido debe ser compatible con el single-writer guard, atomic replace y la política de commit.

## 20. Trust boundary de load/import

Ningún JSON externo o snapshot recuperado adquiere autoridad sólo por poder parsearse.

Ruta de validación:

```text
raw
→ JSON.parse
→ candidate object
→ validateApcWritableWorkingSnapshot(
     candidate,
     { dataset, areStatesIncompatible }
   )
→ si falla:
     REJECT
     no auto-fix
     no autoridad
```

La validación incluye todas las revisiones APC_EVIDENCE según §12, control-plane I10 writer-ready, coverage requirement↔pending y coherencia semántica actual de contradictions. Las revisiones históricas no se reinterpretan contra allowedStates del dataset actual.

Esto impide que un snapshot estructuralmente presente pero operacionalmente imposible bajo I12 adquiera autoridad writer.

No se:

```text
completan IDs
renumeran revisions
eliminan records inválidos
normalizan silenciosamente identificadores
reparan confirmation/provenance
```

Un working snapshot que pasa este trust boundary puede seguir siendo NOT_EXPORTABLE; exportabilidad continúa siendo una evaluación separada I10.

Instalación de un import válido:

```text
adquirir/poseer writer lock
→ comprobar storage existente para sessionId
```

Si no existe snapshot durable conflictivo:

```text
→ saveAtomic(candidate)
→ sólo tras SUCCESS:
     currentSession = candidate
     runtimeGeneration se inicializa/reinicia para el nuevo contexto committed
```

Si existe un snapshot durable diferente con el mismo `sessionId`:

```text
→ IMPORT_CONFLICT
→ no overwrite automático
→ no currentSession nuevo
```

Si el import es byte-for-byte equivalente al snapshot durable ya presente, puede tratarse como no-op de carga.

Un import nunca salta el durable commit para convertirse directamente en `currentSession`.

Si el usuario trata el archivo específicamente como export APC normativa, se evalúa adicionalmente I10.

## 20.1 CREATE_INDIVIDUAL

R9 exige poder crear individuos dentro de la sesión. `CREATE_INDIVIDUAL` es un command normativo y atraviesa writer guard, freshness, cola, working-snapshot validation y atomic commit.

Input mínimo:

```text
type = CREATE_INDIVIDUAL
targetSessionId
baseSessionEpoch
baseCommitGeneration
```

La transacción genera:

```text
individualId = newId()
```

y crea la estructura mínima admitida por el contrato APC/I5 vigente. No deriva ni exige `speciesId`, `speciesHypothesis` ni identificación taxonómica.

Flujo:

```text
PHOTO puede existir con individualRefs=[]
→ CREATE_INDIVIDUAL
→ commit
→ ASSIGN_PHOTO(individualId)
→ commit
→ ACTIVE_REVIEW_TARGET puede seleccionar photo + individual
→ recién entonces se permite APC_EVIDENCE para ese target
```

La creación del individuo no modifica por sí sola conocimiento botánico ni asigna especie.

## 21. Ingestión de fotografías

### 21.1 Preparación

Fuera de la transacción normativa puede hacerse:

```text
File
→ bytes originales
→ SHA-256
→ staged input
```

El staging no crea PHOTO ni PhotoEvidence.

### 21.2 Decisión normativa

Dentro de la transacción y contra el candidate vigente:

```text
fingerprint no existente
→ crear PHOTO + PhotoEvidence

fingerprint existente
→ reutilizar PHOTO + PhotoEvidence
```

En selección múltiple, cada elemento se evalúa contra el candidate ya actualizado por los elementos anteriores del mismo batch.

Así dos archivos idénticos dentro del mismo batch producen una sola PHOTO.

### 21.3 Efectos runtime post-commit

Los `objectURL` definitivos se adjuntan sólo después del commit APC exitoso.

```text
commit SUCCESS
→ APC_SESSION ya es autoridad committed
→ intentar assetRuntime.attach(photoId,file)

asset attach SUCCESS
→ visual disponible

asset attach FAIL
→ APC_SESSION permanece COMMITTED
→ asset se marca unavailable
→ warning runtime recuperable
→ NO rollback normativo
```

Si el commit APC falla antes:

```text
→ descartar staged runtime
→ revoke objectURL temporal si existía
```

No puede quedar una fotografía visible como asset committed si su PHOTO no fue persistida. Un fallo visual posterior al durable commit nunca revierte historia APC.

## 22. Asset runtime lifecycle

`assetRuntime.attach(photoId,file)`:

```text
si existe objectURL previo
→ revoke

crear nuevo objectURL
→ almacenar
```

Se revoca en:

```text
relink
detach
session replacement
UI unmount
```

Relink con fingerprint coincidente no toca `APC_SESSION`, `semanticRevision` ni `objectiveAssessment`.

## 23. UI single-screen

La vista debe poder exponer simultáneamente:

```text
session diagnostics
photos/inbox
active photo
active individual
character editor
DRAFT/CONFIRMED
requirements/pending
representation gaps
contradictions
provenance
export/PASS diagnostics
```

Los estados de fotografía son derivados de UI y nunca se persisten como nuevos enums APC.

Selectores derivados mínimos:

```text
derivePhotoReviewState(photoId)
→ unreviewed
→ has_draft
→ partially_reviewed
→ has_confirmed
→ required_pending

deriveSessionDiagnostics()
→ structurallyValid
→ serializableWorkingSnapshot
→ writerReady
→ exportable
→ pass
→ closed
```

Los nombres anteriores son valores runtime de presentación, no enums persistidos. Los diagnósticos se calculan así:

```text
structurallyValid
→ validateApcSession(currentSession).valid

serializableWorkingSnapshot
→ structurallyValid
→ serialización JSON completa del APC_SESSION committed puede producirse y reparsearse sin pérdida de sus campos normativos

writerReady
→ validateApcWritableWorkingSnapshot(...).valid

exportable
→ validateApcSessionForExport(...).exportable

pass
→ assessApcSessionPass(...).pass

closed
→ currentSession.status === CLOSED
```

`writerReady` es sólo diagnóstico runtime adicional y no reemplaza ninguna categoría R9. En particular:

```text
STRUCTURALLY VALID
≠ SERIALIZABLE WORKING SNAPSHOT
≠ writerReady
≠ EXPORTABLE
≠ PASS
≠ CLOSED
```

Ninguno se guarda dentro de `APC_SESSION`.

Navegación, filtros, siguiente/anterior, zoom y selección no ejecutan commands normativos ni cambian `semanticRevision`.

### 23.1 Export e I11 como acciones explícitas

`EXPORT_APC` opera exclusivamente sobre el último `currentSession` COMMITTED. Nunca incorpora `editBuffers` ni un candidate no persistido. Ejecuta primero el gate writer-ready I12 y sólo después I10:

```text
validateApcWritableWorkingSnapshot(
  currentSession,
  { dataset, areStatesIncompatible }
)
→ debe pasar

buildApcSessionExport(
  currentSession,
  { dataset, areStatesIncompatible }
)
```

Si el gate I12 falla, la UI no presenta una exportación APC normativa aunque el snapshot sea inspeccionable en READ_ONLY. Si I12 pasa pero `exportable=false`, muestra las razones I10. Si `exportable=true`, el JSON proviene directamente del builder I10; la UI no lo reescribe ni elimina historia.

Debe existir al menos un fixture E2E I12 que produzca:

```text
buildApcSessionExport(...).exportable = true
```

`RUN_I11_VERIFICATION` es una acción humana explícita de diagnóstico y opera sobre el último `currentSession` COMMITTED, nunca sobre editBuffers/candidates. Invoca el harness canónico I11 R4 para un individuo seleccionado, suministrando el mismo provider `areStatesIncompatible` del contexto writer. Nunca se ejecuta implícitamente por guardar/confirmar evidencia. Su resultado no modifica APC_SESSION, candidateIds ni evidencia. Si el harness canónico rechaza el snapshot/evidencia, la UI muestra el fallo y no intenta reparar u omitir silenciosamente la evidencia.

## 24. Resultados runtime del executor

Forma operativa recomendada:

```js
{
  status:
    "COMMITTED" |
    "REJECTED" |
    "NEEDS_DECISION" |
    "STALE_COMMAND" |
    "IMPORT_CONFLICT" |
    "NO_OP" |
    "READ_ONLY",
  session: null | committedSession,
  errors: [],
  warnings: [],
  decisionsRequired: []
}
```

Estos estados son runtime; no forman parte de APC.

### 24.1 NO_OP

La detección de NO_OP ocurre en la fase de mutation plan de §10, antes de materializar cualquier historia I6 o generar IDs/timestamps históricos.

```text
intent normativo equivalente a previousSession
→ NO_OP
→ no newId()/now() para revisión o revisionEvent
→ no revision N+1
→ no revisionEvent
→ no reconciliación mutante I8/I9
→ no semanticRevision++
→ no saveAtomic()
→ no runtimeGeneration++
```

La comparación de una evidencia se realiza sobre el payload APC_EVIDENCE persistido completo excluyendo únicamente `revision` y `current`, exactamente como exige R9. Esto incluye lifecycle, evidenceStatus, observedState, source/provenance, confirmation, acquisition, confidence, reason, notes y cualquier otro campo normativo vigente. Los eventos de `revisions[]` son consecuencia y no participan de la detección.

Los campos de identidad I6 (`sessionId`, `photoId`, `photoEvidenceRef`, `individualId`, `characterId`) tampoco se ignoran: si el intent pretende cambiarlos, no corresponde una revisión del mismo evidenceId sino una nueva identidad lógica según I6.

Ejemplos:

```text
SAVE_DRAFT sin cambio normativo
assignment ya presente
duplicate ingest que no modifica APC_SESSION
```

Un `NO_OP` puede producir un efecto estrictamente runtime si éste está autorizado independientemente, por ejemplo restaurar disponibilidad local de un asset cuyos bytes tienen fingerprint coincidente. Ese efecto no convierte el NO_OP en commit APC ni incrementa generaciones.

## 25. Regresiones mínimas del diseño

Además de T-I12 del contrato R9, la implementación debe cubrir:

```text
TD-I12-01
nuevo requirement insatisfecho sin pendingCritical
→ NEEDS_DECISION
→ no commit

TD-I12-02
nuevo pending con critical explícito
→ persiste exactamente ese valor

TD-I12-03
recurrencia sin nueva decisión critical
→ NEEDS_DECISION
→ no herencia automática

TD-I12-04
recurrencia con critical explícito
→ nuevo pendingId
→ previousPendingId directo
→ critical exacto

TD-I12-05
persistence falla
→ currentSession unchanged
→ no history consumed

TD-I12-06
snapshot importado inválido
→ reject
→ no auto-fix

TD-I12-07
working snapshot válido pero NOT_EXPORTABLE
→ load como working snapshot permitido

TD-I12-08
providers deterministas
→ misma entrada produce mismo resultado

TD-I12-09
relink reemplaza asset runtime
→ objectURL previo revocado
→ APC unchanged

TD-I12-10
session replace/unmount
→ objectURLs revocados

TD-I12-11
SAVE_DRAFT y CONFIRM casi simultáneos
→ ejecución serial
→ confirm usa resultado committed/flush del save

TD-I12-12
dos SAVE_DRAFT concurrentes
→ nunca crean el mismo revision number

TD-I12-13
command baseRevision stale
→ STALE_COMMAND
→ no commit

TD-I12-14
NEEDS_DECISION y sesión cambia antes de responder
→ command se reconstruye
→ no replay ciego

TD-I12-15
dos browser contexts mismo sessionId
→ sólo uno obtiene writer lock
→ segundo read-only o rechazado

TD-I12-16
writer lock ausente/no garantizable
→ write mode disabled

TD-I12-17
3 current CONFIRMED OBSERVED contradictorias
→ evidenceRefs contiene snapshot operacional completo
→ orden ordinal evidenceId/revision

TD-I12-18
requirement resuelto por múltiples evidencias
→ resolutionEvidenceRefs contiene todas las calificantes
→ orden ordinal evidenceId/revision

TD-I12-19
reordenar session.evidence[]
→ refs históricas resultantes idénticas

TD-I12-20
batch con dos archivos de bytes idénticos
→ un PHOTO
→ un PhotoEvidence

TD-I12-21
ingest candidate válido pero persistence falla
→ no asset runtime committed
→ staged objectURLs revocados

TD-I12-22
commit de mutación semántica múltiple
→ semanticRevision incrementa una sola vez

TD-I12-23
writer A obtiene lock de sessionId
→ ejecuta y termina varios commands
→ lock permanece retenido entre commands
→ writer B no obtiene write mode hasta que A cierra/libera

TD-I12-24
ASSIGN_PHOTO command fue construido con baseCommitGeneration=N
→ otro command normativo committeó sin cambiar semanticRevision
→ runtimeGeneration=N+1
→ ASSIGN_PHOTO stale se rechaza

TD-I12-25
saveAtomic falla durante commit
→ durable snapshot permanece byte-for-byte igual a previous
→ currentSession y runtimeGeneration permanecen sin cambios

TD-I12-26
import contiene current CONFIRMED que pasa validateApcSession()
pero falla validateApcEvidenceForHandoff()
→ import rechazado
→ no autoridad operacional

TD-I12-27
import válido usa sessionId ya persistido con snapshot diferente
→ IMPORT_CONFLICT
→ no overwrite automático

TD-I12-28
STALE_COMMAND
→ no auto-rebase ni auto-retry
→ UI vuelve a currentSession committed
→ buffer viejo queda sólo como estado efímero STALE hasta descarte o reaplicación consciente

TD-I12-29
adapter mínimo I12
→ no expone clear()
→ eliminación de sesión permanece fuera de alcance

TD-I12-30
CONFIRMED con sourceType no soportado
→ writable working snapshot REJECT

TD-I12-31
CONFIRMED prefilled con confirmedOnCurrentPhoto=false o basis inválida
→ working snapshot REJECT

TD-I12-32
CONFIRMED OBSERVED con state no permitido por dataset
→ working snapshot REJECT

TD-I12-33
CONFIRMED imported sin importMetadata.observerType válido
→ working snapshot REJECT

TD-I12-34
revisión histórica CONFIRMED current=false inválida
→ working snapshot REJECT
→ validación histórica no exige current=true pero conserva el resto de reglas

TD-I12-35
SESSION A tiene command/buffer pendiente
→ se reemplaza por SESSION B
→ sessionEpoch cambia
→ command A queda STALE aunque runtimeGeneration de B coincida numéricamente

TD-I12-36
CREATE_SESSION
→ snapshot inicial semanticRevision=1 y OA OPEN/null
→ validateApcSession + writable working snapshot PASS
→ saveAtomic antes de currentSession

TD-I12-37
requirement insatisfecho sin exactamente un OPEN pending
→ writable working snapshot REJECT aunque validateApcSession aislado pase

TD-I12-38
evidencias actuales incompatibles sin contradiction OPEN coherente
→ working snapshot REJECT

TD-I12-39
CREATE_INDIVIDUAL sobre PHOTO inicialmente sin individuo
→ individuo canónico creado sin speciesId obligatorio
→ ASSIGN_PHOTO posterior permite ACTIVE_REVIEW_TARGET válido

TD-I12-40
command produce candidate normativamente igual a previous
→ NO_OP
→ sin saveAtomic
→ runtimeGeneration unchanged

TD-I12-41
APC commit SUCCESS seguido por assetRuntime.attach FAIL
→ status APC sigue COMMITTED
→ warning runtime
→ asset unavailable
→ no rollback normativo

TD-I12-42
DRAFT persistible con lifecycleStatus fuera de DRAFT|CONFIRMED
→ writable working snapshot REJECT

TD-I12-43
current DRAFT OBSERVED con observedState no permitido por dataset
→ no se persiste
→ permanece editBuffer efímero hasta payload válido

TD-I12-44
historical CONFIRMED current=false fue íntegra pero su character/state ya no existe en dataset actual
→ se conserva si pasa validación intrínseca/histórica
→ no se reinterpreta contra allowedStates actuales

TD-I12-45
current CONFIRMED referencia character/state incompatible con dataset actual
→ writable working snapshot REJECT

TD-I12-46
snapshot con semanticRevision inválido o objectiveAssessment binding inválido
→ no adquiere write mode
→ puede ser READ_ONLY si la UI soporta inspección

TD-I12-47
snapshot persiste pass o exportable
→ writable working snapshot REJECT

TD-I12-48
SESSION_SWITCH_REQUEST durante command activo
→ no libera lock ni instala nueva sesión hasta resultado terminal del command
→ queued commands no iniciados quedan invalidados
→ después cambia sessionEpoch

TD-I12-49
SAVE_DRAFT sin cambio de payload normativo
→ NO_OP antes de crear revision/revisionEvent
→ providers newId/now para historia no se consumen

TD-I12-50
runtime/transacción sin dataset válido
→ operaciones botánicas writer rechazadas/configuración inválida
→ no fallback global implícito

TD-I12-51
UNASSIGN_PHOTO encuentra una revisión histórica current=false para PHOTO/IND
→ UNASSIGN_BLOCKED
→ snapshot byte-for-byte normativamente igual

TD-I12-52
BATCH_UNASSIGN_PHOTOS contiene un item bloqueado
→ batch completo REJECT
→ no commit parcial

TD-I12-53
BATCH_ASSIGN_PHOTOS + BATCH_REMOVE_FROM_INBOX
→ operaciones reversibles por commands inversos
→ no estado botánico positivo
→ no classifiedPhotoRefs paralelo

TD-I12-54
INGEST_PHOTOS carga asset nuevo
→ PHOTO y PhotoEvidence únicos
→ photoId aparece una sola vez en inboxPhotoRefs

TD-I12-55
INGEST_PHOTOS carga bytes ya existentes con filename distinto
→ reutiliza IDs
→ conserva fileRef canónico previo
→ no modifica membership inbox implícitamente

TD-I12-56
command de evidencia captura targetPhotoId/targetIndividualId
→ si la asociación ya no es válida al ejecutar
→ REJECT/STALE
→ no evidencia reasignada

TD-I12-57
PREFILL_TO_EDIT_BUFFER
→ no crea APC_EVIDENCE
→ confirm sólo pasa con acción humana + acquisition prefilled válida y confirmedOnCurrentPhoto=true

TD-I12-58
SUGGEST_INSPECTION_TARGETS
→ puede devolver carácter/estructura/ayuda
→ nunca devuelve ni preselecciona observedState

TD-I12-59
EXPORT_APC sobre fixture válido
→ buildApcSessionExport(...).exportable=true
→ export conserva historia completa

TD-I12-60
RUN_I11_VERIFICATION
→ acción explícita
→ salida canónica I11
→ APC_SESSION permanece sin cambios

TD-I12-61
nueva CONFIRMED
→ validateApcEvidenceForHandoff(...).valid=true
→ también pasa validación fuerte registrada

TD-I12-62
dos providers de incompatibilidad distintos no pueden mezclarse dentro de una misma transacción
→ reconciliación y validación usan la misma dependencia inyectada

TD-I12-63
cambio normativo de evidence sólo en confirmation/acquisition/source/notes
→ NO es NO_OP
→ genera revisión I6 correspondiente

TD-I12-64
current DRAFT derivado de CONFIRMED anterior
→ confirmation anterior ausente/null
→ una confirmation heredada hace REJECT al working snapshot

TD-I12-65
DRAFT con acquisition.mode=prefilled
→ basis prior_observations + photoEvidenceRefs válidas son obligatorias
→ confirmedOnCurrentPhoto puede permanecer false/ausente hasta CONFIRMED

TD-I12-66
DRAFT con sourceType sin sourceId, o sourceId sin sourceType
→ REJECT
→ ambos ausentes o ambos canónicos

TD-I12-67
inboxPhotoRefs contiene el mismo photoId dos veces
→ writer-ready REJECT

TD-I12-68
PHOTO.individualRefs contiene el mismo individualId dos veces
→ writer-ready REJECT

TD-I12-69
dos PhotoEvidence distintas comparten fingerprintSha256
→ writer-ready REJECT
→ no auto-merge de IDs/historia

TD-I12-70
ADD_TO_INBOX de ref ya presente / ASSIGN_PHOTO de individuo ya presente
→ NO_OP
→ no duplicado
→ no runtimeGeneration++

TD-I12-71
dataset o provider semántico cambia durante contexto writer
→ barrier
→ command activo termina
→ queued commands quedan stale
→ snapshot se revalida antes de reabrir write mode

TD-I12-72
deriveSessionDiagnostics
→ STRUCTURALLY VALID / SERIALIZABLE / writerReady / EXPORTABLE / PASS / CLOSED se calculan separadamente
→ ningún resultado se persiste

TD-I12-73
EXPORT_APC y RUN_I11_VERIFICATION con editBuffer sucio
→ ambos consumen sólo currentSession COMMITTED
→ editBuffer no contamina export ni handoff

TD-I12-74
PHOTO sin photoEvidenceId / sin PhotoEvidence 1:1 correspondiente
→ writable working snapshot REJECT
→ no autoridad writer

TD-I12-75
dos PHOTO comparten un mismo PhotoEvidence o la cardinalidad PHOTO↔PhotoEvidence no es 1:1
→ writable working snapshot REJECT
→ no auto-repair

TD-I12-76
A y B se despachan contra baseCommitGeneration=N
→ A commit incrementa runtimeGeneration
→ B comienza después y queda STALE_COMMAND
→ B no se auto-rebasa contra S2
→ sólo un B reconstruido conscientemente puede continuar

TD-I12-77
saveAtomic/confirmación durable falla antes de promoción de currentSession
→ ABORT
→ durable snapshot = previous
→ currentSession = previous
→ runtimeGeneration unchanged

TD-I12-78
snapshot READ_ONLY viola integridad PHOTO/PhotoEvidence o fingerprint
→ EXPORT_APC rechazado por gate I12
→ no se presenta como export APC normativo
```

## 26. Criterio de cierre del diseño

El diseño puede congelarse cuando:

- R9 permanece VALIDATED WITH ASC y FROZEN;
- este documento pasa auditoría adversarial sin blockers;
- G1/G2/D6/D7/H4/H5 permanecen cerrados;
- B01/B02/B03/B04 y H01/H02 permanecen cerrados;
- B05/B06/B07/B08 y H03/H04 permanecen cerrados;
- B09/B10/B11/B12 y H05/H06 permanecen cerrados;
- B13/B14/B15 y H07 permanecen cerrados;
- guards de unassignment y batch/inbox satisfacen T-I12-12/T-I12-12A;
- ACTIVE_REVIEW_TARGET queda desacoplado de commands mediante target IDs capturados;
- prefill/suggestions respetan la frontera epistemológica de R9;
- export I10 e I11 verification son acciones explícitas y no mutantes;
- no introduce campos normativos nuevos en APC_SESSION;
- el single-writer guard es de vida de sesión writer y queda exigido para write mode;
- todos los commands normativos usan targetSessionId + baseSessionEpoch + baseCommitGeneration runtime, más baseRevision cuando aplica;
- commands stale son rechazados sin auto-rebase ni auto-retry;
- persistence garantiza atomic replace all-or-nothing;
- toda revisión CONFIRMED, current o histórica, usa la validación registrada fuerte factorada de APC→CharacterObservation;
- writable working snapshots validan payload DRAFT/CONFIRMED, PHOTO↔PhotoEvidence total 1:1, unicidad de fingerprint, control-plane I10, dataset operacional actual, requirement coverage y contradiction semantics antes de adquirir autoridad;
- imports conflictivos por sessionId no sobrescriben automáticamente;
- ingest staging no produce efectos committed antes del durable commit;
- comparadores históricos son ordinales y deterministas;
- el validation stack reutiliza implementaciones canónicas;
- CREATE_SESSION y CREATE_INDIVIDUAL quedan definidos;
- session switch funciona como barrier y nunca libera el lock con un command activo;
- commands encolados conservan la generación de dispatch y quedan stale si un commit previo la cambia; la cola no auto-rebasa intención;
- NO_OP se detecta antes de materializar historia y no consume persistencia ni generaciones;
- dataset es dependencia explícita del executor;
- revisiones históricas se preservan sin reinterpretación retroactiva contra allowedStates del dataset actual;
- fallos de asset runtime post-commit no revierten APC;
- DRAFT nunca hereda confirmation y prefill DRAFT conserva basis trazable;
- inboxPhotoRefs, PHOTO.individualRefs y fingerprints cumplen unicidad I12 para write mode;
- dataset/providers quedan fijados por contexto writer y cualquier cambio fuerza barrier + revalidación;
- diagnósticos STRUCTURALLY VALID/SERIALIZABLE/writerReady/EXPORTABLE/PASS/CLOSED permanecen separados;
- export e I11 consumen únicamente snapshots committed;
- TD-I12-01..78 están aceptadas como regresiones de implementación.

### AUDITORÍA

Auditoría adversarial final de V0.10 contra R9 y la implementación canónica I1–I11: PASS, sin blockers abiertos dentro del alcance del diseño. B01–B15 y H01–H07 permanecen cerrados. V0.10 no modifica R9, no introduce una segunda fuente de verdad y deja explícitas las precondiciones de implementación, concurrencia, persistencia, validación, export y handoff. Resultado: VALIDATED WITH ASC y FROZEN para implementación técnica I12.

### INCONSISTENCIAS

B13 queda resuelto haciendo obligatorio `PHOTO.photoEvidenceId` en todo writable snapshot y exigiendo cardinalidad total 1:1 PHOTO↔PhotoEvidence sobre las verificaciones bidireccionales existentes. B14 permanece cerrado con unicidad case-insensitive de fingerprint. B15 queda resuelto incluyendo fallos de `saveAtomic()`/confirmación durable dentro de ABORT hasta antes de promover `currentSession`. H07 queda cerrado declarando que los commands capturan generación al dispatch: si un commit previo cambia la generación, el command queued queda STALE y debe reconstruirse conscientemente; la cola nunca auto-rebasa intención. La exportación I12 exige además el gate writer-ready antes de delegar a I10, evitando exportar normativamente snapshots READ_ONLY que violen R9.

### VACÍOS / OMISIONES

Siguen fuera de alcance layout final, accesibilidad de producto, backend remoto, blobs permanentes, eliminación de sesiones, hypothesis y H17 runtime. Un snapshot externo que viole invariantes I12 de fingerprint/colecciones puede inspeccionarse READ_ONLY, pero V0.10 no define reparación automática porque fusionar IDs o reescribir historia excedería I12. El versionado histórico del dataset continúa fuera de alcance; revisiones no-current se conservan por integridad intrínseca.

### REDUNDANCIAS

No se introducen nuevos campos persistidos para writerReady, undo, provider version, asset index, fingerprints indexados, diagnostics ni edit buffers. La unicidad se deriva de los arrays canónicos existentes. Export y handoff no mantienen copias paralelas: consumen currentSession committed y producen resultados derivados. `validateApcI12AssetAndCollectionInvariants()` añade sólo totalidad/cardinalidad/unicidad sobre relaciones ya canónicas; no crea una segunda fuente de verdad ni duplica la lógica bidireccional de `validateApcSession()`.
