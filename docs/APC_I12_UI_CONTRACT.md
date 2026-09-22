# Árboris — APC I12 Single-Screen UI Contract

**ID:** `ARBORIS_APC_I12_UI_CONTRACT_R5`  
**Estado:** CANDIDATO A VALIDACIÓN CON ASC.  
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

Toda captura editable comienza o permanece en estado `DRAFT` hasta confirmación humana explícita.

`DRAFT`:

- puede autosalvarse;
- puede editarse;
- no entra al handoff I11;
- no satisface requirements;
- no se presenta como evidencia confirmada.

`CONFIRMED`:

- requiere confirmación humana conforme al contrato APC;
- entra a la capa de evidencia;
- si posteriormente se corrige, debe producir una nueva revisión;
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
```

Toda mutación que altere el substrate semántico definido por I10 debe aplicar el contrato de transición semántica vigente:

```text
semantic mutation
→ semanticRevision incrementa exactamente una vez por transacción
→ objectiveAssessment.status = OPEN
→ objectiveAssessment.assessedRevision = null
→ objectiveAssessment.assessedBy = null
→ objectiveAssessment.assessedAt = null
```

La UI debe reutilizar `validateApcSemanticTransition()` o una composición técnicamente equivalente que respete exactamente el mismo contrato.

Una única acción de UI que modifique varias entidades dentro de una misma transacción semántica produce un solo incremento de `semanticRevision`.

Las operaciones puramente visuales o de navegación no modifican `semanticRevision`.

I12 no permite editar manualmente `semanticRevision` ni los campos de binding de `objectiveAssessment` como controles independientes de UI.

## 21. Integración con I11

I12 no ejecuta identificación como efecto implícito de confirmar un dato.

Cuando se use I11 como verificación desde la UI, debe ser una acción explícita y conservar exactamente la separación:

```text
APC evidence
→ H16 CharacterObservation
→ ACE evidence
→ assessment
```

El resultado ACE no reescribe automáticamente la evidencia APC.

## 22. Seguridad epistemológica

La UI no puede:

- inferir ausencia desde falta de observación;
- convertir `UNCERTAIN` en un estado positivo;
- convertir `NOT_OBSERVABLE` en ausencia;
- inventar speciesId;
- cerrar requirements por apariencia visual de completitud;
- editar Master o JSON botánico canónico;
- resolver contradicciones por mayoría;
- ocultar revisiones históricas necesarias para trazabilidad.

## 23. Regresiones mínimas I12

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

T-I12-05
CONFIRMED requiere acción humana explícita
→ entra a evidence canónica

T-I12-06
corrección de CONFIRMED
→ nueva revisión
→ revisión previa retenida

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

T-I12-15
required no satisfecho
→ pending visible

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
→ relink con fingerprint distinto es rechazado sin modificar el asset registrado
```

## 24. Criterio de cierre I12

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
- correcciones confirmadas usan revisiones;
- suggestions no proponen estados botánicos concretos;
- requirements/pending/gaps/contradictions se visualizan sin reinterpretarlos;
- acciones por lote permitidas son reversibles y no confirman estados botánicos;
- puede persistir working snapshots estructuralmente válidos sin presentarlos como export APC;
- produce al menos una exportación APC normativa con `buildApcSessionExport(...).exportable = true`;
- puede reimportar la sesión sin pérdida de trazabilidad;
- distingue registro de asset de disponibilidad de bytes y permite relink sólo mediante fingerprint coincidente;
- T-I12-01..24 + T-I12-03A..03D + T-I12-12A pasan;
- I1–I11 permanecen verdes;
- `npm test` pasa;
- la auditoría del diff no encuentra blockers;
- el cambio se integra mediante PR aprobado.

### AUDITORÍA

R5 mantiene separadas captura, confirmación, cobertura, persistencia local, exportabilidad e identificación. Conserva las correcciones R4 y añade deduplicación por fingerprint dentro de la sesión, protección de integridad al desasignar individuos y relink explícito cuando los bytes del asset no están disponibles tras reimportar.

### INCONSISTENCIAS

R5 resuelve los hallazgos adversariales de R4: fingerprints idénticos ya no pueden materializar assets duplicados dentro de la misma sesión; la desasignación PHOTO↔INDIVIDUAL queda bloqueada cuando existe historia de evidence dependiente; y la reimportación distingue registro de asset de disponibilidad de bytes con relink verificado por fingerprint. Conserva ACTIVE_REVIEW_TARGET, bytes canónicos del fingerprint y las correcciones previas.

### VACÍOS / OMISIONES

R5 todavía no congela detalles puramente visuales como layout exacto, estilos, tamaños, accesibilidad final ni packaging de producto. Tampoco define un contrato nuevo de hypothesis. Esos elementos permanecen fuera de alcance. La disponibilidad local de bytes y el relink son estado/runtime de UI y no introducen campos canónicos nuevos en APC_SESSION.

### REDUNDANCIAS

Los estados de revisión de fotografía definidos en §15 son derivados de UI y no deben persistirse como una segunda taxonomía canónica. I12 debe reutilizar validadores y estructuras APC existentes en lugar de replicarlas. ACTIVE_REVIEW_TARGET, disponibilidad local del asset, relink, working snapshot y `SERIALIZABLE WORKING SNAPSHOT` no constituyen nuevas fuentes de verdad ni estados APC persistidos. La deduplicación se deriva consultando `session.photoEvidence[]` por fingerprint; no requiere un índice canónico persistido adicional.
