# Árboris — APC I12 Implementation Design

**ID:** `ARBORIS_APC_I12_IMPLEMENTATION_DESIGN_V0.4`  
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

Todo command que modifica una evidencia existente debe declarar:

```text
evidenceId
baseRevision
```

Para evidencia aún no persistida:

```text
evidenceId = null o nuevo id reservado por la transacción
baseRevision = null
```

Al comenzar efectivamente el turno del command:

```text
current revision == baseRevision
→ puede continuar

current revision != baseRevision
→ STALE_COMMAND
→ no mutación
→ no persistencia
```

No existe auto-rebase silencioso de edición botánica.

Para commands sobre entidades distintas de evidence, el diseño aplica la misma idea mediante una precondición de base de sesión:

```text
expectedSemanticRevision
```

cuando la operación dependa del substrate semántico vigente.

Un command rechazado por stale state debe reconstruirse desde `currentSession`.

## 6. Autosave y confirmación

Si existe un autosave pendiente del mismo target y el usuario confirma:

```text
CONFIRM
→ espera/flush del SAVE_DRAFT pendiente del mismo target
→ lee la revisión current resultante
→ construye CONFIRM contra esa baseRevision
```

Nunca se confirma contra una revisión anterior mientras un autosave normativo del mismo target está en vuelo.

Si un command devuelve `NEEDS_DECISION`, la decisión posterior no reusa ciegamente el command anterior: se reconstruye contra la sesión vigente y vuelve a validar sus precondiciones.

## 7. Single-writer guard entre browser contexts

La cola interna evita concurrencia dentro de un solo runtime, pero I12 requiere además un único writer por `sessionId` entre pestañas/ventanas.

Invariante:

```text
máximo un writer normativo activo
por sessionId
entre todos los browser contexts
```

La implementación de referencia usa un `WriterLockProvider` cuya operación de escritura requiere un lock exclusivo por clave:

```text
arboris-apc:<sessionId>
```

La implementación primaria debe usar Web Locks (`navigator.locks`) o una primitiva equivalente con exclusión real.

Si el runtime no dispone de una primitiva capaz de garantizar exclusión:

```text
→ no habilitar modo writer
→ abrir sesión read-only o declarar write mode unsupported
```

No se permite degradar silenciosamente a last-write-wins.

Antes de construir cada transacción normativa bajo el lock:

```text
→ releer snapshot persistido
→ validar que corresponde a la base esperada
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

Para una mutación normativa:

```text
1. adquirir writer lock
2. releer snapshot persistido
3. verificar freshness/preconditions
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
15. persistir candidate
16. confirmar persistencia exitosa
17. promover currentSession
18. aplicar efectos runtime post-commit
19. liberar lock / continuar cola
```

Cualquier fallo antes de 17:

```text
→ ABORT
→ currentSession permanece previousSession
→ snapshot persistido permanece previo
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

Toda nueva current CONFIRMED debe pasar `validateApcEvidenceForHandoff()` antes de persistirse como confirmada.

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

## 18. Validation stack

Antes de persistir un candidate:

```text
validateApcSession(nextSession)
```

Cuando I8 aplica:

```text
validateApcPendingTransition(previousSession, nextSession)
```

Cuando I9 aplica:

```text
validateApcContradictions(nextSession, { areStatesIncompatible })
validateApcContradictionTransition(
  previousSession,
  nextSession,
  { areStatesIncompatible }
)
```

Siempre para una transición normativa:

```text
validateApcSemanticTransition(
  previousSession,
  nextSession,
  { isContradictionRelevant }
)
```

Cuando se crea una nueva current CONFIRMED:

```text
validateApcEvidenceForHandoff(newConfirmedEvidence)
```

Export usa exclusivamente I10:

```text
validateApcSessionForExport()
buildApcSessionExport()
```

## 19. Durable persistence

El adapter conceptual:

```js
persistence = {
  load(sessionId),
  save(sessionId, serializedSession),
  clear(sessionId)
}
```

`save()` debe completar antes de promover `currentSession`.

Si persistence falla:

```text
→ candidate descartado
→ currentSession no cambia
→ ningún cambio se presenta como committed
```

El diseño no exige localStorage específicamente. El adapter elegido debe ser compatible con el single-writer guard y con la política de commit.

## 20. Trust boundary de load/import

Ruta única:

```text
raw
→ JSON.parse
→ candidate object
→ validateApcSession(candidate)
→ VALID: puede instalarse como working snapshot
→ INVALID: reject / no auto-fix / no autoridad
```

No se:

```text
completan IDs
renumeran revisions
eliminan records inválidos
normalizan silenciosamente identificadores
```

Un working snapshot estructuralmente válido puede cargarse aunque sea NOT_EXPORTABLE.

Si el usuario lo trata específicamente como export APC normativa, se evalúa adicionalmente I10.

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
→ assetRuntime.attach(photoId,file)

commit FAIL
→ descartar staged runtime
→ revoke objectURL temporal si existía
```

No puede quedar una fotografía visible como asset committed si su PHOTO no fue persistida.

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
    "READ_ONLY",
  session: null | committedSession,
  errors: [],
  decisionsRequired: []
}
```

Estos estados son runtime; no forman parte de APC.

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
```

## 26. Criterio de cierre del diseño

El diseño puede congelarse cuando:

- R9 permanece VALIDATED WITH ASC y FROZEN;
- este documento pasa auditoría adversarial sin blockers;
- G1/G2/D6/D7/H4/H5 permanecen cerrados;
- no introduce campos normativos nuevos en APC_SESSION;
- el single-writer guard queda exigido para write mode;
- commands stale son rechazados;
- ingest staging no produce efectos committed antes del durable commit;
- comparadores históricos son ordinales y deterministas;
- el validation stack reutiliza implementaciones canónicas;
- TD-I12-01..22 están aceptadas como regresiones de implementación.

### AUDITORÍA

V0.4 incorpora los hallazgos adversariales del diseño v0.3: binding a R9 congelado, artefacto versionado, freshness de commands, single-writer entre contexts, staging de ingest y comparadores ordinales deterministas. Mantiene transaction boundary, persistencia atómica, I6 versionado, I8 critical explícito, I9 snapshots históricos y I10 semanticRevision.

### INCONSISTENCIAS

G1 queda resuelto porque R9 fue auditado adversarialmente, marcado PASS y congelado antes de versionar este diseño. G2 queda resuelto mediante este artefacto versionado. D6 se resuelve con `baseRevision`/precondiciones y rechazo `STALE_COMMAND`; D7 con single-writer guard obligatorio para write mode. H4 separa staging de ingest de efectos runtime post-commit. H5 congela orden ordinal sin `localeCompare()`.

### VACÍOS / OMISIONES

Quedan fuera de alcance detalles visuales finales, accesibilidad de producto, packaging H17, backend remoto, persistencia permanente de blobs y hypothesis. La tecnología concreta del adapter de storage puede variar siempre que preserve exclusión de writer y commit durable. Si el runtime no ofrece una primitiva de exclusión fiable, write mode no se habilita.

### REDUNDANCIAS

No se persisten locks, writer IDs, command states, edit buffers, asset runtime, transaction IDs ni caches paralelos dentro de APC_SESSION. `baseRevision` y `expectedSemanticRevision` pertenecen al command runtime. Pending/contradictions/revisions continúan usando exclusivamente sus arrays canónicos.
