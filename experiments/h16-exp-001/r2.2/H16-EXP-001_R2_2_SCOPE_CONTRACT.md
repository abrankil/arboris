# H16-EXP-001 — R2.2 Scope Contract

**Estado:** DRAFT / CANDIDATE FOR VALIDATION  
**Versión:** R2.2  
**Ámbito:** Batch Annotation Workbench de H16-EXP-001  
**Base verificada:** main @ d38cdadb5e00aa30e275a9cada3e58bdedcf958d  
**Predecesor:** R2.1.3 — VALIDATED / FROZEN EXPERIMENTAL DESIGN  
**No modifica:** ASC, ACE, contratos de Hito 15 ni canon botánico  
**No cierra:** Hito 16 completo  
**Activación:** este documento no constituye freeze ni autoridad de repositorio hasta superar auditoría de bytes reales, freeze/manifest y revisión requerida.

---

## 1. Propósito

R2.2 preserva dos necesidades distintas dentro de una sola herramienta:

1. curación y enriquecimiento masivo de fotografías con metadata trusted;
2. producción de ground truth visual con metadata enmascarada para el benchmark de H16.

La separación es semántica y operacional. Compartir infraestructura técnica no autoriza compartir estados de dominio, stores, validadores ni exports.

~~~text
                    H16 R2.2 WORKBENCH
                          │
             ┌────────────┴────────────┐
             │                         │
      TRUSTED / CORPUS          BLIND / BENCHMARK
             │                         │
      curación masiva            ground truth H16
      metadata visible           metadata masked
      multi-caracter             CH-003 inicial
      provenance                 decisión visual
~~~

---

## 2. Fuentes semánticas

R2.2 consume conocimiento botánico únicamente desde:

~~~text
data/botanical/characters.json
data/botanical/glossary.json
~~~

Las definiciones de caracteres y estados no deben hardcodearse como una segunda fuente botánica dentro del HTML.

La selección de CH-003 — Dentición del margen foliar como benchmark primario es una decisión experimental de H16-EXP-001, no una nueva afirmación botánica.

---

## 3. Relación con R2.1.3

R2.1.3 permanece congelado y no se modifica.

R2.2 puede reutilizar principios y capacidades demostradas por R2.1.3:

~~~text
batch loading
content hashing
relink
viewer
session handling
provenance
authority-binding principles
non-destructive historical preservation
~~~

R2.2 no hereda automáticamente:

~~~text
el schema exacto de evidence de R2.1.3
el vocabulario limitado OBSERVED | NOT_OBSERVABLE
el modelo de sesión de un solo perfil
comportamientos destructivos de UI
la interpretación de OPEN-01 / OPEN-02 / OPEN-03
~~~

Las decisiones locales de R2.2 no reescriben retroactivamente R2.1.3.

---

## 4. Perfil A — TRUSTED / CORPUS

### 4.1 Objetivo

Permitir una sola sesión de trabajo por lote sobre muchas fotografías para registrar la mayor cantidad posible de información reutilizable sin repetir el flujo completo carácter por carácter y fotografía por fotografía.

~~~text
Observation
    ↓
Photos[]
    ↓
Corpus Evidence[]
~~~

### 4.2 Metadata permitida

El perfil TRUSTED puede acceder, cuando exista, a:

~~~text
photo_id
species_id
individual_id
filename / archivo
notas
drive metadata
organ
view
partition
provenance
hashes
~~~

La presencia de metadata trusted no la convierte en nueva evidencia botánica.

### 4.3 Destino de la salida

La salida es evidencia o enriquecimiento experimental/curado.

No existe promoción automática hacia:

~~~text
Master Botánico
data/botanical/*.json
ACE
benchmark ground truth
~~~

Cuando una corrección corresponda al canon botánico:

~~~text
Workbench
→ evidencia / propuesta
→ revisión
→ Master Botánico cuando corresponda
→ export_master.py
→ data/botanical/*.json
~~~

---

## 5. Elegibilidad fotográfica de caracteres

Un carácter puede entrar automáticamente en la paleta de candidatos fotográficos cuando:

~~~text
estado_piloto = activo
AND observable_foto ∈ {Sí, Parcial}
AND aplica_si = null
~~~

La regla es normativa para R2.2. La cantidad o lista resultante es derivada de la autoridad vigente y no debe hardcodearse como una segunda regla.

Contra la autoridad usada durante el diseño de este candidato, el resultado derivado es de 17 caracteres:

~~~text
CH-001 CH-002 CH-003 CH-004 CH-005 CH-006
CH-008 CH-009 CH-010 CH-011 CH-012 CH-013
CH-014 CH-019 CH-026 CH-027 CH-028
~~~

Quedan fuera del auto-offer los caracteres con observable_foto = No, estado_piloto distinto de activo o aplica_si no nulo. R2.2 no ejecuta automáticamente aplica_si.

---

## 6. Elegibilidad, aplicabilidad y observabilidad

R2.2 conserva esta distinción:

~~~text
PHOTO-ELIGIBLE CHARACTER
        ≠
APPLICABLE TO THIS PHOTO
        ≠
OBSERVABLE IN THIS PHOTO
~~~

Que un carácter sea fotográficamente elegible no autoriza asumir que aplica a una fotografía concreta.

R2.2 no debe inferir automáticamente aplicabilidad desde organ, view, filename, species_id o apariencia visual sin un contrato posterior que lo autorice.

Si un carácter no fue intentado sobre una fotografía, no debe generarse automáticamente NOT_OBSERVABLE, NOT_APPLICABLE ni ABSENT.

---

## 7. Estados de observación R2.2

R2.2 admite exactamente:

~~~text
OBSERVED
NOT_OBSERVABLE
UNCERTAIN
~~~

### 7.1 OBSERVED

La evidencia visual permite seleccionar con fundamento exactamente un estado botánico autorizado.

~~~text
observed_state = REQUIRED
~~~

El estado debe pertenecer al vocabulario autorizado del carácter.

### 7.2 NOT_OBSERVABLE

La evidencia visual concreta no permite evaluar el carácter.

~~~text
observed_state = FORBIDDEN
~~~

No equivale a ausencia, no aplica, no fotográfico, retirado ni condición no evaluada.

### 7.3 UNCERTAIN

Existe señal visual relevante del carácter, pero la evidencia no permite seleccionar con fundamento exactamente un estado botánico autorizado.

~~~text
observed_state = FORBIDDEN
~~~

No equivale a desacuerdo entre anotadores, ausencia botánica ni estado permitido de una especie.

---

## 8. Perfil B — BLIND / BENCHMARK

### 8.1 Objetivo

Producir ground truth experimental con metadata enmascarada para comparar posteriormente un observador visual restringido por carácter.

~~~text
blind_image_id
+
character_id
        ↓
Benchmark Annotation
~~~

El benchmark primario de esta versión usa CH-003 — Dentición del margen foliar.

### 8.2 Información visible

Durante la decisión humana, el perfil BLIND puede exponer:

~~~text
image bytes
blind_image_id
character_id
character label
character description
allowed states
authorized state definitions
OBSERVED / NOT_OBSERVABLE / UNCERTAIN
~~~

### 8.3 Información prohibida durante la decisión

El perfil BLIND no debe exponer:

~~~text
species_id
individual_id
photo_id
partition
filename / archivo
notas originales
drive metadata
organ
view
capture date
diagnostic quality
expected species state
model prediction
~~~

La restricción constituye metadata masking operacional. No pretende ser anonimización criptográfica ni protección frente a inspección deliberada del repositorio.

---

## 9. Annotation guide

El guide humano del benchmark debe derivarse de characters.json + glossary.json.

Puede transportar snapshots de:

~~~text
character label
character description
allowed states
state definitions
~~~

siempre que el workset preserve fingerprints verificables de las autoridades exactas usadas.

El snapshot derivado no constituye una nueva fuente de verdad.

---

## 10. Frontera entre perfiles

La transición mínima es:

~~~text
TRUSTED state
        ↓
generate blind workset
        ↓
clear / reload runtime state
        ↓
BLIND state
~~~

Ocultar metadata mediante CSS no satisface esta frontera.

El perfil BLIND no debe mantener como parte de su estado activo normal photos.json completo, trusted binding, taxonomía, metadata trusted ni partition visible.

Antes de entrar a BLIND debe eliminarse o aislarse de forma verificable cualquier estado TRUSTED persistido que pueda ser leído por el perfil BLIND. Esto incluye estado en memoria y, si se usan, localStorage, sessionStorage, IndexedDB u otro almacenamiento persistente equivalente. Una simple recarga de página no constituye limpieza suficiente por sí sola.

La frontera es operacional y está orientada a evitar contaminación accidental del benchmark; no es una garantía de seguridad adversarial.

---

## 11. Stores, sesiones, validadores y exports

Invariante:

~~~text
Corpus Evidence
≠
Benchmark Annotation
~~~

Aunque ambos dominios puedan usar los mismos nombres de estados de observación, deben mantener stores, schemas, sesiones semánticas, validadores y exports separados.

Quedan prohibidos automatic promotion, automatic copying e implicit equivalence en ambas direcciones.

---

## 12. Binding de fotografías

La identidad verificable de una imagen debe basarse finalmente en bytes:

~~~text
image bytes
→ SHA-256
~~~

Los nombres de archivo pueden utilizarse para localizar o proponer candidatos de binding, pero no constituyen prueba final de identidad.

El scope R2.2 no congela una versión específica de photos.json. Cada workset o trusted binding debe registrar la identidad de la versión de inventario que realmente consumió.

---

## 13. Runtime authority binding

El freeze de R2.2 se validará contra versiones exactas de sus fuentes semánticas, pero una futura ejecución debe verificar la autoridad que realmente consume.

~~~text
runtime fingerprint = validated fingerprint
→ VERIFIED

runtime fingerprint != validated fingerprint
→ AUTHORITY_CHANGED_REVALIDATION_REQUIRED
~~~

Un cambio de autoridad no invalida automáticamente para siempre el Scope Contract, pero queda prohibida la continuación silenciosa.

Para el benchmark primario, un cambio que afecte CH-003 o las definiciones de sus estados exige revalidación experimental antes de comparar resultados.

---

## 14. Correcciones append-only

Una anotación committed no debe corregirse mediante borrado o reemplazo destructivo.

El registro usa:

~~~text
supersedes_annotation_ids[]
~~~

Una anotación inicial o independiente puede declarar una lista vacía. Una corrección o adjudicación declara una o más anotaciones anteriores que deja sin efecto, sin destruirlas.

Ejemplo lineal:

~~~text
ANN-001
OBSERVED → serrado

        ↓

ANN-002
OBSERVED → dentado
supersedes_annotation_ids = [ANN-001]
~~~

ANN-001 permanece almacenada.

Cada referencia de supersession solo es válida si:

~~~text
target exists
same blind_image_id
same character_id
target != self
no duplicate target ids
graph is acyclic
~~~

Una corrección lineal destinada a reemplazar la anotación efectiva debe superseder el active head vigente.

Si existen varios active heads, una adjudicación que pretenda resolver el conflicto debe superseder todos los active heads vigentes en un único nuevo registro. Con una referencia singular no sería posible reducir determinísticamente una bifurcación a un único head sin perder historial.

---

## 15. Anotación efectiva

Para cada par blind_image_id + character_id, una anotación válida es un active head cuando no ha sido superseded por otra anotación válida.

~~~text
0 active heads
→ MISSING / INVALID
→ no effective ground truth

1 active head
→ EFFECTIVE ANNOTATION

>1 active heads
→ CONFLICT_REQUIRES_REVIEW
→ no effective ground truth
~~~

No se permite desempatar mediante last-write-wins, timestamp-wins, confidence-wins, annotator-priority ni insertion-order-wins.

Un conflicto entre anotadores no se convierte automáticamente en UNCERTAIN.

Ejemplo de resolución append-only de una bifurcación:

~~~text
          ANN-002
         /
ANN-001
         \
          ANN-003

ANN-004
supersedes_annotation_ids = [ANN-002, ANN-003]
        ↓
único active head = ANN-004
~~~

Esta semántica pertenece al ledger de ground truth del benchmark R2.2 y no constituye por sí sola una resolución general de evidencia repetida o contradictoria fuera de ese ledger.

---

## 16. Secuencia de cohortes del benchmark

El benchmark primario debe separar operacionalmente development y holdout para evitar contaminación por conocimiento del holdout.

La secuencia mínima es:

~~~text
trusted preparation
→ development blind workset
→ development human ground truth
→ development coverage / tuning
→ observer freeze
→ frozen observer predictions on holdout
→ seal predictions
→ holdout blind workset
→ holdout human ground truth blind to predictions
→ primary comparison
~~~

Reglas:

- development y holdout se materializan como worksets operacionalmente separados;
- el perfil de decisión no debe mostrar la etiqueta de partición;
- el workset holdout no debe cargarse ni exponerse al anotador durante la fase development;
- las predicciones del observador sobre holdout deben quedar selladas antes de producir o revelar el ground truth humano de holdout;
- las predicciones selladas no deben mostrarse durante la anotación humana;
- reserve queda fuera del benchmark primario salvo un protocolo posterior explícito;
- un rerun puramente reproductivo del observador congelado no autoriza tuning post-hoc sobre el holdout primario.

---

## 17. Decisiones heredadas que permanecen OPEN

R2.2 preserva explícitamente:

~~~text
OPEN-01 — repeated / contradictory evidence semantics
OPEN-02 — photo membership in multiple observations
OPEN-03 — view-specific character applicability
~~~

Las reglas locales del ledger de benchmark no constituyen cierre general de OPEN-01.

El modelo operacional usado por R2.2 no constituye cierre de OPEN-02.

La distinción entre elegibilidad y aplicabilidad no introduce reglas por view y no cierra OPEN-03.

---

## 18. Decisiones R2.2 diferidas

Permanecen fuera del scope:

~~~text
layout visual definitivo
keyboard shortcuts finales
segundo anotador obligatorio
UI completa de adjudicación
ROI / crops
reglas de aplicabilidad específicas por view
ejecución de aplica_si
integración H17
ACE consumption
modelo automático definitivo
persistencia definitiva de resultados
~~~

No deben cerrarse por inferencia durante la implementación del alcance aquí definido.

---

## 19. No objetivos

R2.2 Scope Contract no:

- modifica el canon botánico;
- modifica ASC;
- modifica ACE;
- redefine supported o resolved;
- identifica especies;
- convierte ground truth en evidencia ACE automáticamente;
- convierte Corpus Evidence en ground truth automáticamente;
- ejecuta H17;
- modifica los artefactos congelados de R2.1.3;
- declara Hito 16 completo.

---

## 20. Criterios de validación del candidato

Antes de congelar este contrato debe comprobarse como mínimo:

~~~text
SCOPE PRESERVATION
TWO-PROFILE SEPARATION
CORPUS / BENCHMARK DATA-MODEL SEPARATION
CHARACTER ELIGIBILITY RULE
ELIGIBILITY / APPLICABILITY / OBSERVABILITY DISTINCTION
OBSERVED SEMANTICS
NOT_OBSERVABLE SEMANTICS
UNCERTAIN SEMANTICS
CH-003 PRIMARY BENCHMARK RESTRICTION
CHARACTERS + GLOSSARY GUIDE BINDING
METADATA MASKING CONTRACT
BYTE-BASED IMAGE IDENTITY
APPEND-ONLY CORRECTION HISTORY
SUPERSESSION REFERENTIAL INTEGRITY
MULTI-HEAD ADJUDICATION WITHOUT DELETION
ACTIVE-HEAD DETERMINISM
TRUSTED PERSISTENT-STATE ISOLATION
DEVELOPMENT / HOLDOUT WORKSET SEPARATION
HOLDOUT PREDICTION-SEAL GATE
R2.1.3 OPEN PRESERVATION
ASC UNCHANGED
ACE UNCHANGED
H15 UNCHANGED
H17 UNCHANGED
NO BOTANICAL CANON MUTATION
~~~

La auditoría del candidato debe realizarse sobre sus bytes reales antes de crear el freeze.

---

## 21. Estado del candidato

~~~text
H16-EXP-001
R2.2 SCOPE CONTRACT

STATUS
DRAFT / CANDIDATE FOR VALIDATION

FREEZE
NO

REPOSITORY AUTHORITY
NO

DESIGN BLOCKERS KNOWN AT MATERIALIZATION
0

NEXT GATE
AUDIT REAL BYTES
~~~
