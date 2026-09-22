# Árboris — APC I12 Implementation Design

**ID:** `ARBORIS_APC_I12_IMPLEMENTATION_DESIGN_V0.6`  
**Estado:** CANDIDATO A VALIDACIÓN CON ASC.  
**Ámbito:** Hito 16 / APC I12 implementation design.  
**Contrato base:** `ARBORIS_APC_I12_UI_CONTRACT_R9`, VALIDATED WITH ASC y FROZEN en `h16/apc-i12-ui@4ba8f837f75eccf44054b7ef7c7b23b4c82efe40`.  
**Base canónica I1–I11:** `main@54824efea9ec5806eef720fc07b6bdd44339d609`.  
**No autoriza:** implementación, PR, merge a `main`, Gate B, cierre del Hito 16 ni integración runtime/producto H17.

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
  newId,
  now,
  actorId,
  areStatesIncompatible,
  isContradictionRelevant
}
```

Producción puede usar `crypto.randomUUID()` y reloj real. Tests usan providers deterministas.

## 4. Commands

Toda mutación normativa entra por commands explícitos.

Familias mínimas:

```text
PHOTO / ASSET-NORMATIVE
INGEST_PHOTOS
ASSIGN_PHOTO
UNASSIGN_PHOTO

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
mutaciones normativas de sesión permitidas
```

Operaciones puramente runtime/UI no entran a la cola APC:

```text
SELECT_PHOTO
SELECT_INDIVIDUAL
FILTER
ZOOM
RELINK_ASSET con fingerprint coincidente
```

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

Cada command obtiene `previousSession` sólo cuando comienza su turno después del commit/abort del command anterior.

No se permite:

```text
A previous=S1
B previous=S1
→ dos candidates independientes
```

La secuencia válida es:

```text
A previous=S1 → commit S2
B previous=S2 → commit S3
```

El coalescing es opcional y sólo puede aplicarse a `SAVE_DRAFT` aún no iniciado del mismo evidence target. Commands de confirmación, requirements, assignment o decisiones de pending no se coalescen automáticamente.

## 8.1 Session lifecycle, epoch y bootstrap

Cambiar la sesión activa es una operación de lifecycle del executor, no una mutación dentro del `APC_SESSION` anterior.

Al reemplazar/cargar/importar una sesión:

```text
→ bloquear nuevos commands del contexto anterior
→ invalidar commands pendientes mediante sessionEpoch
→ invalidar o marcar STALE los editBuffers anteriores
→ limpiar assetRuntime del contexto saliente
→ liberar su writer lock
→ sessionEpoch += 1
→ runtimeGeneration = 0
```

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
→ validateApcWorkingSnapshot() cuando el helper de §18 esté disponible
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
4. clonar previousSession
5. aplicar mutación primaria
6. construir revisiones I6 y revisionEvents
7. calcular satisfaction de requirements
8. reconciliar I8
9. reconciliar I9
10. calcular substrate I10
11. ajustar semanticRevision una vez si corresponde
12. resetear objectiveAssessment si corresponde
13. ejecutar validation stack
14. serializar candidate
15. persistir candidate mediante atomic replace
16. confirmar commit durable exitoso
17. promover currentSession
18. incrementar runtimeGeneration exactamente una vez
19. aplicar efectos runtime post-commit
20. continuar cola manteniendo el writer lock
```

Cualquier fallo antes de 17:

```text
→ ABORT
→ currentSession permanece previousSession
→ snapshot persistido permanece exactamente previo
→ runtimeGeneration no cambia
→ no se consume revisión ni semanticRevision
```

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

Toda nueva current CONFIRMED debe pasar la validación registrada fuerte definida abajo antes de persistirse como confirmada.

### 12.1 Validación fuerte de CONFIRMED

`validateApcEvidenceForHandoff()` por sí solo no cubre todas las reglas que la ruta APC→CharacterObservation aplica actualmente. I12 no duplica esas reglas.

Durante implementación se debe factorizar una validación reusable, conceptualmente:

```js
validateRegisteredApcConfirmedEvidence(
  dataset,
  session,
  evidenceId,
  revision,
  { requireCurrent }
)
```

La implementación debe reutilizar/factorizar la lógica canónica hoy distribuida entre:

```text
validateApcEvidenceForHandoff()
mapObserver()/sourceType mapping
validateCharacterObservation()
referential checks del adapter APC→CharacterObservation
```

y debe cubrir, como mínimo:

```text
lifecycleStatus = CONFIRMED
confirmation humana válida
sourceType soportado: human | tool | model | imported
sourceId válido
importMetadata requerido cuando sourceType=imported
acquisition válida
prefilled → confirmedOnCurrentPhoto=true
prefilled → basis prior_observations válida y refs existentes
characterId conocido en dataset
OBSERVED → observedState permitido por el carácter
UNCERTAIN/NOT_OBSERVABLE → reason y ausencia de observedState
confidence válida
PHOTO / PhotoEvidence / INDIVIDUAL referencialmente compatibles
```

Para una nueva/current CONFIRMED:

```text
requireCurrent = true
```

Para revisar historia importada o persisted history:

```text
requireCurrent = false
```

Todas las revisiones con `lifecycleStatus=CONFIRMED`, incluidas `current=false`, deben pasar esta validación de payload/contexto. La opción `requireCurrent=false` elimina sólo la exigencia de `current=true`; no relaja confirmation, provenance, acquisition, dataset ni integridad referencial.

`adaptRegisteredApcEvidenceToCharacterObservation()` debe reutilizar este helper o una factorización equivalente, no mantener una segunda definición divergente de reglas.

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

I12 requiere una composición reusable de integridad operacional de working snapshot, conceptualmente:

```js
validateApcWorkingSnapshot(
  session,
  { dataset, areStatesIncompatible }
)
```

No constituye un nuevo contrato epistemológico. Debe componer reglas canónicas existentes y factorizar las privadas cuando sea necesario.

Debe cubrir:

```text
1. validateApcSession(session)

2. validateApcRequirementCharacters(session, dataset)

3. todas las revisions lifecycleStatus=CONFIRMED
   → validateRegisteredApcConfirmedEvidence(
        dataset,
        session,
        evidenceId,
        revision,
        { requireCurrent: false }
      )

4. requirement coverage snapshot:
   satisfied requirement
   → 0 OPEN UNRESOLVED_REQUIREMENT

   unsatisfied requirement
   → exactamente 1 OPEN UNRESOLVED_REQUIREMENT

5. validateApcContradictions(
     session,
     { areStatesIncompatible }
   )
```

La regla de coverage del punto 4 debe reutilizar la misma definición actualmente usada por I10. Durante implementación se debe exponer/factorizar un helper canónico, conceptualmente `validateApcRequirementCoverage()`, desde la lógica existente de `requirementCoverageErrors()`; no se copia esa lógica dentro de UI.

`validateApcWorkingSnapshot()` no exige por sí mismo que el snapshot sea EXPORTABLE ni que `objectiveAssessment` esté vigente para export. Por tanto:

```text
WORKING SNAPSHOT VALID
≠ EXPORTABLE
```

pero sí:

```text
WORKING SNAPSHOT VALID
→ integridad I6/I7/I8/I9 operacional coherente
→ toda historia CONFIRMED semánticamente validable
```

Antes de persistir cualquier candidate normativo:

```text
validateApcWorkingSnapshot(nextSession, ...)
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

Cuando se crea una nueva current CONFIRMED, además debe pasar:

```text
validateRegisteredApcConfirmedEvidence(
  dataset,
  nextSession,
  evidenceId,
  revision,
  { requireCurrent: true }
)
```

Export sigue usando I10:

```text
validateApcSessionForExport()
buildApcSessionExport()
```

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
→ validateApcWorkingSnapshot(
     candidate,
     { dataset, areStatesIncompatible }
   )
→ si falla:
     REJECT
     no auto-fix
     no autoridad
```

La validación incluye toda revisión `CONFIRMED`, current o histórica, mediante la validación registrada fuerte de §12.1. También exige coverage requirement↔pending y coherencia semántica actual de contradictions.

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
contradictions
provenance
export/PASS diagnostics
```

Los estados de fotografía son derivados de UI y nunca se persisten como nuevos enums APC.

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

Después de construir/comparar la mutación normativa:

```text
candidate normativamente equivalente a previousSession
→ NO_OP
→ no saveAtomic()
→ no runtimeGeneration++
→ no semanticRevision++
→ no revisionEvent
```

Ejemplos posibles:

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
→ working snapshot REJECT

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
→ validateApcSession + working snapshot PASS
→ saveAtomic antes de currentSession

TD-I12-37
requirement insatisfecho sin exactamente un OPEN pending
→ working snapshot REJECT aunque validateApcSession aislado pase

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
```

## 26. Criterio de cierre del diseño

El diseño puede congelarse cuando:

- R9 permanece VALIDATED WITH ASC y FROZEN;
- este documento pasa auditoría adversarial sin blockers;
- G1/G2/D6/D7/H4/H5 permanecen cerrados;
- B01/B02/B03/B04 y H01/H02 permanecen cerrados;
- B05/B06/B07/B08 y H03/H04 permanecen cerrados;
- no introduce campos normativos nuevos en APC_SESSION;
- el single-writer guard es de vida de sesión writer y queda exigido para write mode;
- todos los commands normativos usan targetSessionId + baseSessionEpoch + baseCommitGeneration runtime, más baseRevision cuando aplica;
- commands stale son rechazados sin auto-rebase ni auto-retry;
- persistence garantiza atomic replace all-or-nothing;
- toda revisión CONFIRMED, current o histórica, usa la validación registrada fuerte factorada de APC→CharacterObservation;
- working snapshots validan dataset, requirement coverage y contradiction semantics antes de adquirir autoridad;
- imports conflictivos por sessionId no sobrescriben automáticamente;
- ingest staging no produce efectos committed antes del durable commit;
- comparadores históricos son ordinales y deterministas;
- el validation stack reutiliza implementaciones canónicas;
- CREATE_SESSION y CREATE_INDIVIDUAL quedan definidos;
- NO_OP no consume persistencia ni generaciones;
- fallos de asset runtime post-commit no revierten APC;
- TD-I12-01..41 están aceptadas como regresiones de implementación.

### AUDITORÍA

V0.6 incorpora exclusivamente los hallazgos adversariales B05–B08 y H03–H04 sin modificar R9. Añade validación registrada fuerte de toda historia CONFIRMED, working-snapshot operational integrity, sessionEpoch y bootstrap explícito, CREATE_INDIVIDUAL, semántica NO_OP y separación entre commit APC y fallos runtime post-commit. Conserva todas las correcciones v0.5.

### INCONSISTENCIAS

B05 queda resuelto exigiendo una validación factorada común con la ruta APC→CharacterObservation para toda revisión CONFIRMED, sin usar `validateApcEvidenceForHandoff()` como garantía suficiente aislada. B06 queda resuelto con `sessionEpoch`, invalidación de commands/buffers al reemplazar sesión y bootstrap CREATE_SESSION explícito. B07 queda resuelto mediante `validateApcWorkingSnapshot()`, que compone validación estructural, caracteres de requirements, coverage I8, contradictions I9 y payload/contexto CONFIRMED sin exigir exportabilidad. B08 queda resuelto incorporando CREATE_INDIVIDUAL como command normativo. H03 se cierra con NO_OP sin persistencia ni increments. H04 se cierra declarando que un fallo de assetRuntime posterior al durable commit genera warning y disponibilidad local degradada, nunca rollback APC.

### VACÍOS / OMISIONES

Quedan fuera de alcance detalles visuales finales, accesibilidad de producto, packaging H17, backend remoto, persistencia permanente de blobs, eliminación de sesiones y hypothesis. La implementación deberá factorizar/exponer helpers canónicos de validation sin duplicar la lógica privada existente: validación completa de CONFIRMED y coverage requirement↔pending. Esa factorización es implementación I12 y no modifica R9.

### REDUNDANCIAS

No se persisten `sessionEpoch`, `runtimeGeneration`, `baseCommitGeneration`, locks, writer IDs, command states, edit buffers, asset runtime ni transaction IDs dentro de APC_SESSION. `validateApcWorkingSnapshot()` es composición de validadores canónicos, no una segunda definición contractual. La validación fuerte de CONFIRMED debe ser compartida por import, commit y adapter APC→CharacterObservation, evitando tres lógicas paralelas.
