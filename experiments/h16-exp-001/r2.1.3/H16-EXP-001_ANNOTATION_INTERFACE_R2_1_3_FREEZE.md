# H16-EXP-001 — Annotation Interface R2.1.3

**Estado:** VALIDATED / FROZEN EXPERIMENTAL DESIGN  
**Resultado de validación:** PASS  
**Blockers:** 0  
**Fecha de congelamiento:** 2026-09-21  
**Ámbito:** interfaz experimental de anotación H16-EXP-001  
**No modifica:** ASC, ACE ni contratos de Hito 15  
**Tipo de congelamiento:** diseño experimental validado; no equivale a cierre integral de Hito 16

---

## 1. Propósito del congelamiento

Este documento fija la versión `R2.1.3` de `H16-EXP-001 Annotation Interface` como diseño experimental validado.

El congelamiento preserva:

- la estructura de observación, fotografía y evidencia;
- la separación entre observabilidad y estado botánico;
- la provenance por fotografía y por catálogo;
- el binding verificable con la autoridad botánica;
- la restauración de sesión con reverificación de autoridad;
- la integridad del export experimental;
- los estados `OPEN` que todavía no deben resolverse por inferencia.

Este documento no convierte la interfaz en autoridad botánica ni en contrato normativo de Hito 16.

---

## 2. Artefactos congelados

### 2.1 Interfaz

`H16-EXP-001_annotation_interface_R2_1_3.html`

SHA-256:

```text
6610de196bcc518ee45bef6c509693ecdc9c4053f399bf5397424b96eef6a4c5
```

### 2.2 Plantilla de catálogo H16

`H16-EXP-001_character_catalog_template_R2_1_3.json`

SHA-256:

```text
3d4f22d5897646a518213dfb2a1ce951f3fd8d23cc5a99fd8a1cea2e4eca1217
```

La plantilla no es un catálogo autorizado. Permanece deliberadamente no utilizable mientras contenga placeholders `REPLACE_WITH_*`.

---

## 3. Autoridades usadas en la validación

La validación de R2.1.3 se realizó contra las autoridades vigentes del repositorio `abrankil/arboris`.

### ASC

- `docs/ARBORIS_SCENE_COMPILER.md`
  - Git blob SHA: `7243b98e4e40874340d9b43c4c01e78fb5af438d`
- `docs/DEVELOPMENT_MANUAL.md`
  - Git blob SHA: `7a44e649300b560009777e1e2cb4514f1e96af07`

### ACE / Hito 15

- `docs/ARBORIS_CHARACTER_EVIDENCE_ENGINE.md`
  - Git blob SHA: `795b0ba1667a2056b3e6b9a9ef59a482b682f65a`
- `docs/HITO15_CHARACTER_RETRY_CONTRACT.md`
  - Git blob SHA: `e7661b474db4e9900161932d6fe7dca3e7335370`
- `docs/HITO15_SUPPORTED_CONTRACT.md`
  - Git blob SHA: `31648e4770c0fbf92188734acce1a667228076b6`

### Autoridad botánica

- `data/botanical/README.md`
  - Git blob SHA: `07a9c83d986c4561ff69dbd2c93ab3f7e3e421be`
- `data/botanical/characters.json`
  - Git blob SHA fijado por R2.1.3: `042c4f701615066083881cad54f15367ef838d18`

`data/botanical/README.md` declara `characters.json` como uno de los JSON canónicos derivados de Master Botánico 2.0.

---

## 4. Invariantes congeladas

### 4.1 Separación de capas

```text
OBSERVATION
    ↓
PHOTOS[]
    ↓
CHARACTER EVIDENCE
    ↓
posterior consumer / ACE when applicable
```

La interfaz no identifica especies ni declara `supported`.

### 4.2 Unidad de observación

Una `observation` agrupa fotografías correspondientes a la misma unidad operacional de observación.

Campos principales:

```text
observation_id
name
taxon
taxon_source
notes
created_at
```

El taxón es opcional y no puede inferirse automáticamente desde las fotografías.

### 4.3 Fotografía

Cada fotografía conserva:

```text
photo_id
observation_id
filename
mime_type
size_bytes
sha256
organ
view
notes
added_at
```

`sha256` identifica los bytes originales de la fotografía y permite relink de sesión.

### 4.4 Evidencia por carácter

La evidencia queda separada entre observabilidad y contenido botánico:

```text
character_id

observability_status
→ OBSERVED | NOT_OBSERVABLE

observed_state
→ estado botánico discreto autorizado

observed_value
→ valor libre cuando el carácter no usa estados discretos

source_photo_ids[]
note
observer
catalog_ref
annotated_at
```

`NOT_OBSERVABLE` no significa ausencia.

### 4.5 Provenance multi-foto

Una evidencia puede estar sustentada por una o varias fotografías.

Toda evidencia debe declarar explícitamente:

```text
source_photo_ids[]
```

La interfaz no propaga evidencia botánica en masa entre fotografías.

### 4.6 Catálogo externo

R2.1.3 no contiene un `CHARACTER_SCHEMA` botánico propio.

El catálogo H16 debe ser externo, versionado y vinculado a la autoridad.

### 4.7 Authority binding

Antes de aceptar un catálogo H16, R2.1.3 exige importar una copia exacta de:

```text
data/botanical/characters.json
```

La identidad se verifica mediante el Git blob SHA fijado:

```text
042c4f701615066083881cad54f15367ef838d18
```

Superado ese gate, cada carácter del catálogo H16 debe coincidir con la autoridad en:

```text
catalog.id       == authority.caracter_id
catalog.label    == authority.nombre_caracter
catalog.states[] == authority.estados_permitidos[]
```

Un `authority_ref` declarativo no es suficiente.

### 4.8 Binding conservado por evidencia

Cada evidencia conserva:

```text
authority_ref
authority_git_blob_sha
authority_source_sha256
derivation_contract
verification_status
```

además del binding del catálogo:

```text
catalog_id
version
source_file_sha256
content_sha256
```

### 4.9 Provenance histórica vs. actual

Se distinguen dos claims diferentes:

```text
source_file_sha256_status_at_annotation
→ estado del archivo de catálogo cuando se creó la evidencia

current_source_file_sha256_status
→ estado verificable en la sesión actual
```

Estados permitidos:

```text
VERIFIED
PRESERVED_UNVERIFIED
```

Una restauración de sesión no vuelve a declarar como verificados los bytes originales del archivo de catálogo si dichos bytes no están presentes.

### 4.10 Sesión

La sesión de trabajo conserva:

- catálogo;
- fingerprints;
- bytes de la autoridad en base64;
- observaciones;
- fotografías;
- evidencia;
- estado mínimo de UI.

Al restaurar:

1. se valida el contrato mínimo de sesión;
2. se reconstruyen los bytes de autoridad;
3. se recalcula el Git blob SHA;
4. se recalcula SHA-256 de autoridad;
5. se recalcula `content_sha256` del catálogo;
6. se verifica nuevamente el catálogo contra la autoridad preservada.

### 4.11 Export

El export se bloquea ante, entre otros:

- IDs duplicados;
- referencias huérfanas;
- carácter inexistente en catálogo;
- estado botánico fuera de vocabulario;
- `NOT_OBSERVABLE` con estado o valor botánico;
- fotos fuente fuera de la observación;
- provenance de catálogo divergente;
- authority binding divergente;
- órgano o vista fuera del vocabulario operativo declarado.

La consistencia estructural del export no equivale a validación científica.

---

## 5. Criterios validados

Resultado de la validación ASC de R2.1.3:

```text
SCOPE PRESERVATION                         PASS
ASC UNCHANGED                              PASS
ACE UNCHANGED                              PASS

OBSERVATION / EVIDENCE SEPARATION          PASS
PHOTO / OBSERVATION SEPARATION             PASS
OBSERVABILITY / BOTANICAL STATE SPLIT      PASS
MULTI-PHOTO PROVENANCE                     PASS

BOTANICAL AUTHORITY SOURCE                 PASS
AUTHORITY_REF RECOGNITION                  PASS
AUTHORITY BYTE IDENTITY                    PASS
AUTHORITY_BINDING                          PASS
CHARACTER ID BINDING                       PASS
CHARACTER LABEL BINDING                    PASS
CHARACTER STATE BINDING                    PASS

CATALOG CONTENT SHA-256                    PASS
SESSION AUTHORITY REVERIFICATION           PASS
SOURCE_FILE_PROVENANCE                     PASS
HISTORICAL / CURRENT PROVENANCE SPLIT      PASS

SESSION MINIMUM CONTRACT                   PASS
EXPORT REFERENTIAL INTEGRITY               PASS
PLACEHOLDER REJECTION                      PASS
OPEN PRESERVATION                          PASS
JAVASCRIPT SYNTAX                          PASS

REGRESSION BLOCKERS                        0
VALIDATION RESULT                          PASS
```

La regresión dirigida final sobre:

```text
AUTHORITY_BINDING
SOURCE_FILE_PROVENANCE
```

obtuvo `PASS` en ambos criterios.

---

## 6. Decisiones que permanecen OPEN

El congelamiento de R2.1.3 no cierra:

### OPEN-01 — Evidencia repetida o contradictoria

Semántica de múltiples evidencias para el mismo `character_id`, incluyendo concordancia, contradicción, reemplazo y relación con reintentos.

R2.1.3 conserva las observaciones sin decidir su interpretación.

### OPEN-02 — Una fotografía en múltiples observaciones

No está decidido si una misma fotografía puede pertenecer simultáneamente a más de una unidad de observación.

R2.1.3 mantiene cardinalidad simple.

### OPEN-03 — Aplicabilidad específica por vista

El catálogo puede gobernar aplicabilidad por órgano, pero no existe todavía un contrato H16 que autorice reglas de aplicabilidad específicas por `view`.

R2.1.3 no inventa esta capa.

---

## 7. No objetivos

R2.1.3 no:

- modifica ASC;
- modifica ACE;
- redefine `supported`;
- redefine `resolved`;
- decide candidatos;
- identifica especies;
- crea conocimiento botánico;
- convierte fotografías en evidencia ACE automáticamente;
- implementa CV;
- decide consenso entre observadores;
- cierra los tres `OPEN`;
- constituye por sí sola el cierre de Hito 16.

---

## 8. Compatibilidad con Hito 15

R2.1.3 conserva múltiples evidencias del mismo `character_id` sin tratarlas como dimensiones independientes.

Esto es compatible con:

- `HITO15_CHARACTER_RETRY_CONTRACT.md`, que permite observaciones sucesivas y reintentos explícitos sin borrar evidencia previa;
- `HITO15_SUPPORTED_CONTRACT.md`, que establece que repetir el mismo `characterId` sigue contando como una sola dimensión evaluable independiente.

R2.1.3 no ejecuta esas reglas; solo preserva la información necesaria para que la capa correspondiente pueda aplicarlas.

---

## 9. Regla de congelamiento

Desde este documento, `R2.1.3` se considera la referencia experimental validada de `H16-EXP-001 Annotation Interface`.

No modificar silenciosamente el artefacto congelado.

Cualquier cambio posterior que afecte una invariante congelada debe:

```text
crear una nueva versión
→ declarar el cambio de alcance
→ identificar qué invariante cambia
→ auditar regresión
→ validar
→ congelar la nueva versión
```

Una corrección puramente editorial de documentación que no cambie comportamiento puede registrarse sin alterar la versión del artefacto.

---

## 10. Estado final

```text
H16-EXP-001
ANNOTATION INTERFACE R2.1.3

STATUS
VALIDATED / FROZEN EXPERIMENTAL DESIGN

VALIDATION
PASS

BLOCKERS
0

ASC CHANGE REQUIRED
NO

ACE CHANGE REQUIRED
NO

OPEN
OPEN-01 repeated / contradictory evidence
OPEN-02 photo ↔ multiple observations
OPEN-03 view-specific applicability

HITO 16 COMPLETE
NO — fuera del alcance de este congelamiento
```
