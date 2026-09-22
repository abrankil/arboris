# Árboris — APC I12 Single-Screen UI Contract

**ID:** `ARBORIS_APC_I12_UI_CONTRACT_R9`  
**Estado:** VALIDATED WITH ASC, FROZEN para implementación técnica.  
**Ámbito:** Hito 16 / APC I12.  
**Base canónica:** `main@54824efea9ec5806eef720fc07b6bdd44339d609`.  
**Prerequisito:** I1–I11 integrados en `main`.  
**No autoriza:** merge a `main`, Gate B, cierre del Hito 16 ni integración runtime/producto H17.

## 1. Objetivo

I12 materializa una interfaz de revisión APC orientada a procesar muchas fotografías dentro de una misma sesión, minimizando la interacción repetitiva sin degradar la trazabilidad epistemológica de I1–I11.

La unidad de trabajo visible es una **sesión APC con múltiples fotografías**, pero la revisión botánica se realiza **una fotografía activa a la vez en una única pantalla de trabajo**.

El objetivo operativo es:

```text
muchas fotografías
→ una sesión APC
→ clasificación/atribución progresiva
→ evaluación por fotografía
→ DRAFT autosaved
→ confirmación humana explícita
→ APC_EVIDENCE CONFIRMED
→ JSON APC trazable
```

I12 es un **verification/prototyping UI harness de H16**. No constituye la interfaz final de producto de H17.

## 2. Superficie de implementación

La referencia I12 se implementará como una interfaz HTML/JavaScript local de una sola vista principal.

Debe permitir cargar varias fotografías en una única interacción de ingreso y trabajar sobre ellas dentro de una misma sesión.

La interfaz no necesita backend remoto para cumplir I12. La persistencia, exportación o reimportación necesarias para demostrar el flujo pueden resolverse localmente siempre que produzcan y consuman el contrato APC canónico sin crear una segunda fuente de verdad.

I12 no modifica el Master Botánico ni `data/botanical/*.json`.

## 3. Modelo de interacción

La pantalla principal debe exponer simultáneamente, sin convertir el flujo en un wizard obligatorio:

1. contexto mínimo de sesión;
2. inbox / conjunto de fotografías;
3. fotografía activa;
4. individuos asociados a la fotografía activa;
5. caracteres/estructuras a revisar;
6. estado DRAFT/CONFIRMED de la evidencia;
7. contexto diagnóstico relevante;
8. estado de completitud/exportación de la sesión.

Cambiar de fotografía no debe exigir cerrar o confirmar obligatoriamente la fotografía anterior. Los cambios DRAFT deben poder persistirse localmente.

## 4. Ingreso de fotografías

I12 debe admitir selección múltiple de fotografías.

Cada fotografía incorporada se registra una sola vez mediante `photoId` y conserva al menos:

```text
photoId
fileRef
individualRefs[]
photoEvidenceId
```

La pertenencia de la fotografía a la sesión se deriva de su inclusión en `APC_SESSION.photos[]`; I12 no introduce `PHOTO.sessionId`.

`fileRef` es el campo canónico persistido para la referencia/origen del archivo. I12 no introduce `origin` como alias normativo persistido.

Los campos opcionales del contrato APC pueden completarse cuando estén disponibles.

Una fotografía puede entrar inicialmente al inbox sin especie ni individuo resuelto.

Una misma fotografía puede vincularse posteriormente a uno o más individuos. La fotografía no se duplica por individuo.

Las fotografías no esenciales pueden permanecer explícitamente sin clasificar al cierre de una sesión, conforme al contrato APC vigente.



## 5. PhotoEvidence y vínculo con PHOTO

Por cada PHOTO registrada que participa del snapshot APC debe existir exactamente un registro `PhotoEvidence` correspondiente conforme al contrato I2 vigente.

Invariantes mínimas:

```text
PHOTO.photoEvidenceId
= PhotoEvidence.photoEvidenceId

PhotoEvidence.sourcePhoto.photoRef
= PHOTO.photoId

PhotoEvidence.sourcePhoto.fingerprintSha256
→ SHA-256 de los bytes originales exactos del archivo ingresado,
  antes de decode, resize, recompression o cualquier transformación
```

La UI debe preservar la relación bidireccional PHOTO ↔ PhotoEvidence y no puede reutilizar un mismo `PhotoEvidence` para dos PHOTO distintas salvo que un contrato canónico posterior lo autorice explícitamente.

El fingerprint no es una inferencia botánica. Es metadata técnica de identidad/traceabilidad del asset.

Para una carga nueva, `fingerprintSha256` debe calcularse sobre los bytes originales exactos del archivo ingresado, antes de decode, resize, recompression o cualquier transformación. No se calcula desde `fileRef`, desde una representación base64 ni desde píxeles decodificados.

Para una sesión reimportada sin acceso a los bytes originales, se conserva exactamente el `fingerprintSha256` ya persistido y no se recalcula desde `fileRef`.

Dos cargas de exactamente los mismos bytes originales deben producir el mismo fingerprint.

Si una carga posterior dentro de la misma sesión produce un fingerprint ya existente, se conserva el `fileRef` canónico de la PHOTO previamente registrada. El nombre, ruta o referencia local de la carga duplicada no sustituye automáticamente ese `fileRef` ni se persiste como alias en I12.

Dentro de una misma sesión, `fingerprintSha256` también funciona como detector de duplicación de asset durante el ingreso:

```text
fingerprint X no existente
→ crear PHOTO
→ crear PhotoEvidence

fingerprint X ya existente
→ reutilizar la PHOTO existente
→ reutilizar su PhotoEvidence existente
→ no crear un segundo photoId
→ no crear un segundo photoEvidenceId
```

El fingerprint no sustituye a `photoId` como identidad canónica. Se usa únicamente para impedir que los mismos bytes originales queden registrados dos veces como assets distintos dentro de la misma sesión.

## 6. Identidad e individuos

La UI debe permitir:

- crear un individuo dentro de la sesión;
- asociar una o varias fotografías a un individuo;
- asociar una fotografía a más de un individuo cuando corresponda;
- trabajar con individuos sin `speciesId`;
- mantener separadas identidad observacional e identificación taxonómica.

I12 no inventa un contrato de `speciesHypothesis` ni `workingSpeciesId`. Mientras no exista contrato APC canónico para hypothesis, estos campos no forman parte del flujo normativo I12.

La unidad editable de revisión botánica es un target de UI compuesto:

```text
ACTIVE_REVIEW_TARGET
= activePhotoId
+ activeIndividualId
```

Ambos campos son estado exclusivo de UI y no se persisten dentro de `APC_SESSION`.

Antes de crear o editar cualquier DRAFT/CONFIRMED botánico:

```text
activePhotoId
→ debe resolver a una PHOTO existente

activeIndividualId
→ debe resolver a un INDIVIDUAL existente
→ debe estar incluido en active PHOTO.individualRefs[]
```

Una PHOTO sin individuo asociado puede visualizarse y permanecer en inbox, pero no puede originar `APC_EVIDENCE` persistible hasta que exista un `activeIndividualId` válido.

Si una PHOTO referencia múltiples individuos, cambiar `activeIndividualId` cambia el target de edición. La evidencia existente de otro individuo no se reutiliza, reasigna ni sobrescribe silenciosamente.

## 7. Revisión por fotografía

Para una fotografía activa, la UI debe permitir registrar cero o más caracteres observacionales.

Estados APC permitidos por evidencia:

```text
OBSERVED
UNCERTAIN
NOT_OBSERVABLE
```

Reglas:

- `OBSERVED` requiere un estado botánico permitido por el carácter;
- `UNCERTAIN` no aporta un estado botánico positivo;
- `NOT_OBSERVABLE` no equivale a ausencia;
- un carácter no evaluado no se convierte automáticamente en `NOT_OBSERVABLE`;
- una fotografía puede considerarse revisada, como estado derivado de UI, cuando no queda un carácter requerido pendiente para esa fotografía; esto no introduce un estado canónico CONFIRMED para PHOTO.

## 8. Sugerencias y ayuda

La UI puede sugerir **qué estructura o carácter inspeccionar** utilizando el dataset canónico y, cuando exista un conjunto explícito de candidatos, ese contexto.

La UI puede mostrar:

- nombre del carácter;
- definición;
- instrucciones observacionales;
- estructuras visibles relacionadas;
- información de ayuda.

La UI **no puede sugerir ni preseleccionar un estado botánico concreto** como resultado de una inferencia automática en I12.

Un modelo, herramienta o heurística puede señalar estructuras o caracteres potencialmente relevantes, pero la confirmación de evidencia sigue siendo humana.

## 9. DRAFT y CONFIRMED

Toda captura editable comienza como estado efímero de formulario. Sólo pasa a ser `DRAFT` cuando se persiste sin confirmación humana, o `CONFIRMED` cuando una acción explícita de confirmación materializa evidencia canónica.

`DRAFT`:

- puede autosalvarse;
- puede editarse;
- no entra al handoff I11;
- no satisface requirements;
- no se presenta como evidencia confirmada;
- si ya existe como `APC_EVIDENCE` persistida, cualquier cambio de contenido se materializa como una nueva revisión conforme a I6 y no sobrescribe la revisión vigente in-place.

`CONFIRMED`:

- requiere confirmación humana conforme al contrato APC;
- entra a la capa de evidencia;
- si el dato sólo existe como estado efímero de formulario y nunca fue persistido como DRAFT, la primera acción Confirmar crea directamente `evidenceId` revisión 1 con `lifecycleStatus=CONFIRMED`; I12 no inventa una revisión DRAFT histórica que nunca existió;
- si el DRAFT previo ya estaba persistido como `APC_EVIDENCE`, la transición `DRAFT → CONFIRMED` se materializa como una nueva revisión I6 y nunca sobrescribe la revisión DRAFT existente;
- la revisión CONFIRMED debe incorporar la metadata de confirmación humana exigida por el contrato APC;
- toda nueva revisión CONFIRMED debe pasar `validateApcEvidenceForHandoff()` antes de persistirse como confirmada;
- la transición a CONFIRMED participa en la misma transacción APC atómica que la reconciliación I8/I9, `semanticRevision` y el reset de `objectiveAssessment`;
- editar contenido normativo de una revisión current CONFIRMED nunca conserva automáticamente `CONFIRMED` ni reutiliza la `confirmation` anterior como validación del contenido nuevo;
- si una edición de CONFIRMED se guarda sin una nueva acción humana de confirmación, la nueva revisión nace `DRAFT`;
- si la misma acción humana edita y confirma explícitamente el contenido nuevo, puede materializarse directamente una nueva revisión `CONFIRMED`, pero debe registrar una nueva `confirmation` correspondiente a esa acción;
- la revisión CONFIRMED anterior permanece histórica `current=false`;
- no destruye la revisión anterior.

La UI debe mostrar claramente si el dato visible es DRAFT o CONFIRMED.

## 10. Prefill

La UI puede prellenar una observación desde observaciones previas únicamente conforme al contrato de adquisición `prefilled`.

Un prefill:

- no equivale a confirmación;
- debe indicar su procedencia;
- debe ser confirmado sobre la fotografía actual;
- no puede entrar al handoff mientras no cumpla el contrato de confirmación vigente.

I12 no introduce una nueva semántica de prefill.

## 11. Acciones por lote

La UI puede ofrecer acciones por lote para reducir repetición, siempre que sean reversibles y trazables.

Las acciones por lote permitidas en I12 se limitan a operaciones que no afirmen automáticamente un estado botánico positivo, por ejemplo:

- asignar fotografías a un individuo;
- desasignar una fotografía de un individuo sólo cuando la operación no rompe integridad referencial;
- quitar/agregar referencias en `inboxPhotoRefs[]`;
- aplicar metadata operacional común;
- seleccionar fotografías para una acción posterior.

Antes de desasignar una PHOTO de un INDIVIDUAL, la UI debe comprobar si existe cualquier revisión de `APC_EVIDENCE` que referencie simultáneamente ese `photoId` y ese `individualId`.

```text
sin evidence histórica para PHOTO + INDIVIDUAL
→ desasignación permitida

existe al menos una revisión de evidence para PHOTO + INDIVIDUAL
→ desasignación bloqueada
→ no se reatribuye evidence
→ no se borra historial
→ snapshot permanece sin cambios
```

`individualId` forma parte de la identidad inmutable de `evidenceId`; una desasignación no puede resolverse modificando silenciosamente la identidad de evidencia existente.

La UI no persiste `classifiedPhotoRefs[]`, `classifiedPhotos[]` ni un conjunto canónico paralelo. Una PHOTO se considera fuera de inbox cuando existe en `photos[]` y su `photoId` no está presente en `inboxPhotoRefs[]`.

I12 no permite confirmar por lote estados botánicos concretos inferidos o copiados sin revisión por fotografía.

Toda acción por lote que modifique el estado de sesión debe poder revertirse antes de exportar y conservar historial suficiente para explicar el cambio cuando el contrato APC lo requiera.

## 12. Requirements y pending

La UI debe distinguir:

```text
required
≠ evaluated
≠ observable
≠ critical
```

Un carácter se muestra como requerido sólo cuando existe un `requirement` canónico aplicable.

La mera existencia del carácter en el Master no lo vuelve requerido.

Cuando un requirement no está satisfecho, la UI debe reflejar el pending correspondiente conforme a I8.

Si una fotografía requerida produce `NOT_OBSERVABLE`:

- la evidencia `NOT_OBSERVABLE` puede confirmarse conforme al contrato APC;
- la fotografía conserva únicamente su estado derivado de UI;
- el requirement no queda satisfecho por esa evidencia;
- el pending debe seguir visible hasta resolverse por otra evidencia o por el mecanismo canónico de representation gap.

## 13. Representation gaps

`REPRESENTATION_GAP` es contexto de cobertura, no evidencia observacional.

La UI debe mostrarlo separado de:

- `UNCERTAIN`;
- `NOT_OBSERVABLE`;
- carácter no evaluado.

I12 no crea representation gaps automáticamente a partir de una sola fotografía no observable salvo que una acción/contrato APC vigente lo autorice explícitamente.

## 14. Contradicciones

Cuando existen contradicciones APC para el individuo activo, la UI debe hacerlas visibles sin:

- seleccionar una evidencia ganadora;
- borrar observaciones incompatibles;
- fusionar estados;
- resolver automáticamente el episodio.

La UI presenta contradicciones como contexto diagnóstico y conserva todas las evidencias confirmadas involucradas.

## 15. Estado de fotografía

La UI debe distinguir al menos:

```text
foto sin revisar
foto con DRAFT
foto revisada parcialmente
foto con evidencia CONFIRMED
foto con required pendiente
```

Estos son estados de interfaz derivados y no nuevos estados canónicos de APC.

Una fotografía no necesita contener evidencia para todos los caracteres del dataset.

## 16. Navegación de sesión

Debe ser posible recorrer rápidamente las fotografías mediante:

- selección desde inbox/lista;
- siguiente/anterior;
- filtros derivados de estado de revisión;
- retorno a fotografías con pending o DRAFT.

La navegación no debe alterar evidencia por sí sola.

## 17. Contexto visible

Para la fotografía/individuo activo, la UI puede mostrar contexto APC relevante:

- evidence current;
- DRAFT local;
- requirements;
- pending;
- representation gaps;
- contradictions;
- provenance;
- revisiones históricas cuando sea necesario inspeccionarlas.

La UI no transforma estos elementos de contexto en evidencia positiva.

## 18. Persistencia, serialización y exportación

I12 debe poder persistir localmente un snapshot de trabajo y, de forma separada, producir una exportación APC conforme al contrato canónico.

La UI debe distinguir claramente:

```text
STRUCTURALLY VALID
SERIALIZABLE WORKING SNAPSHOT
EXPORTABLE
PASS
CLOSED
```

y no presentarlos como sinónimos.

Un snapshot local puede persistirse para continuar el trabajo aunque todavía no sea `EXPORTABLE`, siempre que no se presente como exportación APC normativa.

`SERIALIZABLE WORKING SNAPSHOT` es una etiqueta derivada de I12 para describir persistencia de trabajo. No es un campo persistido, no es un enum APC y no sustituye `validateApcSession()` ni los resultados I10.

La exportación APC normativa debe reutilizar los contratos I10 vigentes, incluyendo `validateApcSessionForExport()` y/o `buildApcSessionExport()` según corresponda. Una sesión estructuralmente válida puede seguir siendo `NOT_EXPORTABLE` por razones de binding semántico, coverage requirement/pending, assessment stale u otras validaciones I10 aplicables.

`PASS` sigue siendo el resultado derivado definido por I10 y no una decisión visual de I12.

I12 no modifica los criterios de Gate B.



## 19. Disponibilidad del asset y relink tras reimportación

La existencia del registro APC de una fotografía y la disponibilidad de sus bytes son conceptos distintos:

```text
asset record available
≠ asset bytes available
```

Una sesión reimportada puede conservar correctamente `PHOTO`, `PhotoEvidence`, `fileRef` y `fingerprintSha256` aunque el navegador ya no tenga acceso al archivo binario original.

En ese caso, la UI debe representar explícitamente que el asset no está disponible para visualización y no debe fingir que `fileRef` es resoluble.

La recuperación visual se realiza mediante relink explícito:

```text
usuario selecciona archivo candidato
→ calcular SHA-256 sobre sus bytes originales exactos
→ comparar con fingerprintSha256 persistido

si coincide
→ reutilizar PHOTO existente
→ reutilizar PhotoEvidence existente
→ conservar photoId y photoEvidenceId
→ restaurar vínculo visual local

si no coincide
→ rechazar relink para esa PHOTO
→ no sustituir silenciosamente el asset original
→ no modificar fingerprint persistido
```

El relink es estado/runtime local de UI y no crea una segunda PHOTO ni un nuevo PhotoEvidence cuando el fingerprint coincide.

Un relink exitoso con fingerprint coincidente no modifica `APC_SESSION`, no cambia `semanticRevision` y no resetea `objectiveAssessment`. Es exclusivamente una recuperación de disponibilidad local del asset.

## 20. Mutaciones semánticas y autoridad del autosave

La persistencia local de I12 debe conservar una única representación normativa del estado APC.

```text
APC_SESSION persisted snapshot
→ única representación normativa APC

UI-only state
→ selección activa, filtros, orden visual, zoom y otros controles de presentación
→ no autoridad epistemológica
→ no se serializa dentro de APC_SESSION salvo contrato canónico explícito

DRAFT evidence
→ si se persiste, se representa mediante la estructura APC vigente
→ no existe una segunda copia paralela del mismo dato como fuente alternativa de verdad
→ editar contenido de un DRAFT ya persistido crea nueva revisión I6
→ revisión previa permanece trazable current=false
→ nueva revisión current=true
→ revision event adyacente obligatorio
```

Toda mutación que altere el substrate semántico definido por I10 debe materializarse como una única transacción APC coherente antes de persistirse.

```text
APC semantic transaction
→ aplica cambio de evidence / requirement / pending / contradiction que corresponda
→ reconcilia satisfaction de requirements
→ reconcilia pending conforme a I8
→ reconcilia contradictions conforme a I9 cuando aplique
→ semanticRevision incrementa exactamente una vez por transacción
→ objectiveAssessment.status = OPEN
→ objectiveAssessment.assessedRevision = null
→ objectiveAssessment.assessedBy = null
→ objectiveAssessment.assessedAt = null
→ sólo entonces persiste nextSession
```

Una revisión de evidence no puede persistirse dejando temporalmente `pending[]` o `contradictions[]` incoherentes con el nuevo conjunto operacional.

Cuando una mutación afecta satisfaction de requirements, la UI debe construir el `nextSession` de forma que:

```text
requirement satisfecho
→ cero OPEN UNRESOLVED_REQUIREMENT para ese requirement

requirement no satisfecho
→ exactamente un OPEN UNRESOLVED_REQUIREMENT para ese requirement
```

y aplicar las reglas de transición/recurrencia I8 vigentes.

Cuando una mutación altera el conjunto operacional de contradicción `current + CONFIRMED + OBSERVED`, la UI debe reconciliar `contradictions[]` conforme a I9:

```text
aparece incompatibilidad actual
→ existe episodio OPEN válido

desaparece incompatibilidad actual
→ OPEN → RESOLVED sólo conforme a transición I9

reaparece posteriormente
→ nuevo contradictionId
→ previousContradictionId conforme a recurrencia I9
```

I12 no define una segunda lógica de pending ni contradicciones. Debe reutilizar los contratos y validadores canónicos existentes, incluyendo según corresponda:

```text
isApcRequirementSatisfied()
validateApcPendingTransition()
validateApcContradictions()
validateApcContradictionTransition()
validateApcSemanticTransition()
```

Una única acción de UI que modifique varias entidades dentro de la misma transacción semántica produce un solo incremento de `semanticRevision`.

Las operaciones puramente visuales, navegación y relink local con fingerprint coincidente no modifican `semanticRevision`.

I12 no permite editar manualmente `semanticRevision` ni los campos de binding de `objectiveAssessment` como controles independientes de UI.



## 21. Unidad de edición y commit de autosave

I12 distingue entre cambios efímeros de formulario y estado APC persistido.

```text
UI EDIT TRANSACTION
→ cambios locales aún no committed
→ estado efímero de formulario
→ no APC_EVIDENCE
→ no fuente normativa

AUTOSAVE COMMIT
→ compara contra la revisión current persistida
→ si no cambió contenido normativo: no crea revisión
→ si cambió contenido normativo: crea exactamente una nueva revisión I6 por evidenceId afectado
→ materializa además cualquier reconciliación I8/I9 necesaria dentro de la misma transacción APC

CONFIRM COMMIT
→ si no existe APC_EVIDENCE persistida para ese dato: crea evidenceId revision=1 CONFIRMED
→ no inventa revision DRAFT histórica
→ si existe DRAFT persistido: crea exactamente una nueva revisión I6 CONFIRMED
→ conserva la revisión DRAFT anterior current=false
→ nueva revisión current=true
→ incorpora confirmation humana válida
→ validateApcEvidenceForHandoff(newConfirmedEvidence).valid = true antes de persistir como CONFIRMED
→ crea revision event adyacente cuando existe revisión previa
→ reconcilia I8/I9 y semanticRevision en la misma transacción

EDIT CONFIRMED COMMIT
→ editar contenido normativo de current CONFIRMED invalida la applicability de su confirmation anterior al contenido nuevo
→ sin nueva acción Confirmar: nueva revisión DRAFT
→ con edición + confirmación humana explícita en la misma acción: nueva revisión CONFIRMED con nueva confirmation
→ nunca copia silenciosamente la confirmation anterior
```

El estado efímero de formulario puede existir sólo para agrupar la interacción previa al commit. No se presenta como evidencia, no participa en requirements, pending, contradictions, handoff, export ni PASS, y no constituye una segunda persistencia normativa.

Para decidir si un autosave crea nueva revisión, "contenido normativo" significa el payload APC_EVIDENCE persistido excluyendo únicamente bookkeeping de versionado `revision` y `current`. Los campos de identidad I6 (`sessionId`, `photoId`, `photoEvidenceRef`, `individualId`, `characterId`) no son editables dentro del mismo `evidenceId`; si cualquiera cambia, corresponde un nuevo `evidenceId`. Los eventos de `revisions[]` son consecuencia del cambio y no se usan como entrada para decidir si existió cambio de contenido.

Una única interacción de autosave produce como máximo una nueva revisión por `evidenceId` afectado. Pulsaciones de tecla, movimientos de cursor o cambios intermedios de controles no generan revisiones por sí solos.

Si el usuario cancela una edición antes del commit, el estado APC persistido permanece intacto.

## 22. Integración con I11

I12 no ejecuta identificación como efecto implícito de confirmar un dato.

Cuando se use I11 como verificación desde la UI, debe ser una acción explícita y conservar exactamente la separación:

```text
APC evidence
→ H16 CharacterObservation
→ ACE evidence
→ assessment
```

El resultado ACE no reescribe automáticamente la evidencia APC.

## 23. Seguridad epistemológica

La UI no puede:

- inferir ausencia desde falta de observación;
- convertir `UNCERTAIN` en un estado positivo;
- convertir `NOT_OBSERVABLE` en ausencia;
- inventar speciesId;
- cerrar requirements por apariencia visual de completitud;
- editar Master o JSON botánico canónico;
- resolver contradicciones por mayoría;
- ocultar revisiones históricas necesarias para trazabilidad.

## 24. Regresiones mínimas I12

La implementación debe demostrar como mínimo:

```text
T-I12-01
selección múltiple
→ varias PHOTO registradas una sola vez en una sesión

T-I12-02
foto ingresa sin individuo/especie
→ permanece válida en inbox

T-I12-03
una PHOTO se asocia a dos individuos
→ no se duplica el asset
→ individualRefs conserva ambos

T-I12-03A
cada PHOTO registrada
→ resuelve exactamente un PhotoEvidence
→ PHOTO.photoEvidenceId = PhotoEvidence.photoEvidenceId
→ PhotoEvidence.sourcePhoto.photoRef = PHOTO.photoId
→ fingerprintSha256 = SHA-256 de los bytes originales exactos del archivo

T-I12-03B
mismos bytes originales cargados dos veces en la misma sesión
→ mismo fingerprintSha256
→ una sola PHOTO
→ un solo PhotoEvidence
→ no se crean segundo photoId ni segundo photoEvidenceId
→ fileRef canónico previo se conserva
→ nombre/ruta de la carga duplicada no reemplaza fileRef
→ decode/resize/recompression no participan del cálculo

T-I12-03C
reimport sin bytes originales
→ conserva fingerprintSha256 persistido
→ no recalcula desde fileRef

T-I12-03D
PHOTO con IND-A + IND-B
→ seleccionar IND-A permite crear evidencia con individualId=IND-A
→ cambiar target a IND-B no reutiliza ni reatribuye evidencia de IND-A
→ sin activeIndividualId válido no se crea APC_EVIDENCE persistible

T-I12-04
cambio de fotografía con DRAFT
→ DRAFT se conserva
→ no se vuelve CONFIRMED

T-I12-04A
DRAFT revision 1 persistida
→ editar contenido
→ revision 1 retained current=false
→ revision 2 DRAFT current=true
→ revision event 1→2
→ no overwrite destructivo

T-I12-04B
múltiples cambios intermedios antes de un autosave commit
→ no generan revisión por cada keystroke/control change
→ comparación de cambio excluye sólo revision/current
→ identidad I6 no cambia dentro del mismo evidenceId
→ un commit crea como máximo una nueva revisión por evidenceId
→ cancelar antes del commit deja APC_SESSION intacto

T-I12-05
DRAFT ya persistido
→ acción humana explícita Confirmar
→ revisión DRAFT anterior retenida current=false
→ nueva revisión CONFIRMED current=true
→ confirmation.confirmedByType = human
→ confirmation.confirmedById presente
→ confirmation.confirmedAt presente
→ validateApcEvidenceForHandoff(newConfirmedEvidence).valid = true
→ revision event adyacente
→ reconciliación I8/I9 en la misma transacción
→ semanticRevision/objectiveAssessment conforme I10
→ no overwrite destructivo

T-I12-05A
dato sólo efímero, nunca persistido como DRAFT
→ acción humana explícita Confirmar
→ crea evidenceId revision=1 CONFIRMED current=true
→ no crea revision DRAFT ficticia
→ confirmation humana completa
→ validateApcEvidenceForHandoff(newConfirmedEvidence).valid = true
→ reconciliación I8/I9/I10 en la misma transacción

T-I12-05B
current CONFIRMED
→ usuario cambia contenido normativo
→ commit sin nueva confirmación crea nueva revisión DRAFT
→ confirmation anterior no se reutiliza para el contenido nuevo
→ revisión CONFIRMED anterior permanece histórica current=false

T-I12-05C
current CONFIRMED
→ usuario cambia contenido normativo y confirma explícitamente en la misma acción
→ nueva revisión CONFIRMED
→ nueva confirmation correspondiente a esa acción
→ confirmation anterior no se copia
→ validateApcEvidenceForHandoff(newConfirmedEvidence).valid = true

T-I12-06
corrección de CONFIRMED
→ nueva revisión
→ revisión previa retenida
→ lifecycle de la nueva revisión depende de si existe nueva confirmación humana explícita
→ nunca hereda silenciosamente confirmation de la revisión anterior

T-I12-07
UNCERTAIN
→ no estado positivo

T-I12-08
NOT_OBSERVABLE
→ no ausencia
→ requirement aplicable permanece insatisfecho

T-I12-09
carácter no evaluado
→ no se serializa como NOT_OBSERVABLE

T-I12-10
sugerencia automática
→ puede proponer estructura/carácter
→ no preselecciona estado botánico

T-I12-11
prefill
→ visible como prefill
→ requiere confirmación sobre foto actual

T-I12-12
batch assignment de individuo / inbox
→ reversible
→ no crea estado botánico positivo
→ no persiste classifiedPhotoRefs[] ni colección paralela

T-I12-12A
PHOTO asociada a IND-A
+ existe cualquier revisión de evidence para PHOTO/IND-A
→ intento de desasignar IND-A es rechazado
→ evidence permanece intacta
→ snapshot permanece válido
→ no se reatribuye ni borra historial

T-I12-13
REPRESENTATION_GAP
→ visible como contexto
→ no evidence

T-I12-14
contradiction
→ ambas evidencias visibles
→ UI no elige ganadora

T-I12-14A
mutación de evidence elimina incompatibilidad actual
→ misma transacción aplica OPEN→RESOLVED conforme I9
→ no deja contradiction OPEN stale

T-I12-14B
incompatibilidad aparece o reaparece
→ misma transacción crea episodio OPEN válido conforme I9
→ recurrence conserva previousContradictionId cuando corresponda

T-I12-15
required no satisfecho
→ pending visible

T-I12-15A
evidence current+CONFIRMED+OBSERVED satisfacía requirement
→ nueva revisión deja de satisfacerlo
→ misma transacción crea/recurre el OPEN UNRESOLVED_REQUIREMENT conforme I8
→ no persiste snapshot intermedio incoherente

T-I12-15B
evidence nueva satisface requirement previamente pendiente
→ misma transacción resuelve el pending conforme I8
→ no persiste snapshot intermedio incoherente

T-I12-16
foto parcialmente revisada sin required pendiente para esa foto
→ puede considerarse revisada en estado derivado de UI sin evaluar todo el dataset
→ no introduce PHOTO.status ni un estado canónico CONFIRMED de fotografía

T-I12-17
estado de UI
→ no introduce nuevos valores canónicos en APC_SESSION
→ no persiste photo.status/reviewStatus ni equivalente

T-I12-18
working snapshot local
→ puede persistirse sin presentarse como export APC
→ conserva una única representación normativa de APC_SESSION

T-I12-19
mutación semántica
→ nextSession reconcilia evidence + requirement satisfaction + pending + contradictions aplicables
→ validateApcPendingTransition() pasa cuando I8 aplica
→ validateApcContradictionTransition() pasa cuando I9 aplica
→ validateApcSemanticTransition() pasa
→ semanticRevision incrementa exactamente una vez por transacción
→ objectiveAssessment se resetea a OPEN con bindings null

T-I12-20
navegación / filtro / zoom
→ no modifica semanticRevision

T-I12-21
export APC normativo
→ validateApcSessionForExport() / buildApcSessionExport() conforme a I10
→ al menos un fixture de cierre produce buildApcSessionExport(...).exportable = true

T-I12-22
STRUCTURALLY VALID / SERIALIZABLE / EXPORTABLE / PASS / CLOSED
→ representados como estados distintos

T-I12-23
reimportar sesión exportada
→ conserva IDs, evidence revisions, pending, contradictions, provenance y semanticRevision

T-I12-24
reimportar sesión sin bytes locales del asset
→ registro PHOTO/PhotoEvidence sigue disponible
→ UI distingue asset record de asset bytes
→ relink con archivo cuyo fingerprint coincide restaura visualización sin crear nueva PHOTO
→ APC_SESSION permanece byte-for-byte semánticamente equivalente
→ semanticRevision no cambia
→ objectiveAssessment no se resetea
→ relink con fingerprint distinto es rechazado sin modificar el asset registrado
```

## 25. Criterio de cierre I12

I12 puede considerarse implementado cuando:

- existe una interfaz HTML/JavaScript local funcional de una sola vista principal;
- puede ingresar múltiples fotografías en una sesión;
- deduplica dentro de la sesión los assets con fingerprint idéntico sin crear PHOTO/PhotoEvidence duplicados;
- permite atribuir fotografías a individuos sin duplicarlas;
- bloquea desasignaciones que romperían referencias históricas de evidence;
- exige un ACTIVE_REVIEW_TARGET válido (photo + individual) antes de crear evidencia botánica;
- permite revisar evidencia por fotografía/individuo con estados APC canónicos;
- calcula fingerprintSha256 sobre bytes originales exactos y lo conserva sin recálculo espurio al reimportar;
- DRAFT y CONFIRMED están claramente separados;
- cualquier edición de contenido de un DRAFT ya persistido usa una nueva revisión I6;
- confirmar un dato nunca persistido crea directamente revision 1 CONFIRMED sin inventar una revision DRAFT;
- confirmar un DRAFT ya persistido crea una nueva revisión CONFIRMED con confirmation humana y revision event;
- editar una revisión CONFIRMED crea DRAFT salvo que exista una nueva confirmación humana explícita para el contenido nuevo;
- toda revisión CONFIRMED nueva pasa validateApcEvidenceForHandoff() antes de persistirse como confirmada;
- el autosave agrupa cambios efímeros y crea como máximo una revisión nueva por evidenceId y commit;
- la comparación de cambio normativo excluye sólo revision/current y respeta la identidad inmutable I6;
- correcciones confirmadas usan revisiones;
- toda mutación de evidence reconcilia requirements/pending/contradictions aplicables antes de persistir nextSession;
- suggestions no proponen estados botánicos concretos;
- requirements/pending/gaps/contradictions se visualizan sin reinterpretarlos;
- acciones por lote permitidas son reversibles y no confirman estados botánicos;
- puede persistir working snapshots estructuralmente válidos sin presentarlos como export APC;
- produce al menos una exportación APC normativa con `buildApcSessionExport(...).exportable = true`;
- puede reimportar la sesión sin pérdida de trazabilidad;
- distingue registro de asset de disponibilidad de bytes y permite relink sólo mediante fingerprint coincidente;
- T-I12-01..24 + T-I12-03A..03D + T-I12-04A..04B + T-I12-05A..05C + T-I12-12A + T-I12-14A..14B + T-I12-15A..15B pasan;
- I1–I11 permanecen verdes;
- `npm test` pasa;
- la auditoría del diff no encuentra blockers;
- el cambio se integra mediante PR aprobado.

### AUDITORÍA

R9 mantiene separadas captura, confirmación, cobertura, persistencia local, exportabilidad e identificación. Conserva las correcciones R8 y congela las rutas de primera confirmación y reconfirmación de contenido corregido, evitando historia DRAFT ficticia y confirmation heredada.

Auditoría adversarial final con ASC: PASS. No se detectan blockers contractuales abiertos en R9. Queda FROZEN como contrato base de la implementación I12; cualquier cambio posterior requiere nueva revisión contractual y regresión del diseño dependiente.

### INCONSISTENCIAS

R9 resuelve los hallazgos adversariales de R8: una primera confirmación desde estado sólo efímero crea directamente revision 1 CONFIRMED; editar contenido de una revisión CONFIRMED no conserva ni copia su confirmation anterior; y toda nueva revisión CONFIRMED debe pasar validateApcEvidenceForHandoff() antes de persistirse como confirmada. Conserva atomicidad I8/I9/I10, versionado I6, autosave, deduplicación, desasignación segura, relink no semántico y las correcciones previas.

### VACÍOS / OMISIONES

R9 todavía no congela detalles puramente visuales como layout exacto, estilos, tamaños, accesibilidad final ni packaging de producto. Tampoco define un contrato nuevo de hypothesis. Esos elementos permanecen fuera de alcance. El estado efímero de formulario existe sólo antes del autosave/confirm commit y no es evidencia ni persistencia normativa; por tanto no genera revisiones históricas hasta materializarse en APC.

### REDUNDANCIAS

Los estados de revisión de fotografía definidos en §15 son derivados de UI y no deben persistirse como una segunda taxonomía canónica. I12 debe reutilizar validadores y estructuras APC existentes en lugar de replicarlas. ACTIVE_REVIEW_TARGET, disponibilidad local del asset, relink, working snapshot, estado efímero de formulario y `SERIALIZABLE WORKING SNAPSHOT` no constituyen nuevas fuentes de verdad ni estados APC persistidos. La deduplicación se deriva consultando `session.photoEvidence[]` por fingerprint; no requiere un índice canónico persistido adicional. Pending y contradictions se actualizan en sus arrays canónicos, sin caches UI persistidos paralelos. La confirmación no introduce estados intermedios como CONFIRMING/PENDING_CONFIRMATION; DRAFT y CONFIRMED siguen siendo los únicos lifecycle canónicos. Una primera confirmación puede comenzar directamente en CONFIRMED revision 1 si no existía evidencia persistida; las transiciones posteriores se expresan mediante I6 y nunca heredan confirmation a contenido nuevo sin una nueva acción humana.
