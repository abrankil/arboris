# GRRP V0.1 — Graphic Reference Resolution Protocol for Claude

**Estado:** especificación operativa propuesta.
**Relación con ASC:** independiente. No modifica ASC v0.1, sus fixtures ni su esquema.
**Relación con `ENVIRONMENT_REFERENCE_PROTOCOL.md`:** GRRP no crea un registro de referencias paralelo. Trata `docs/references/environments/manifest.csv` como el registro upstream ya existente y autoritativo de referencias ambientales, y no agrega campos, categorías ni estados a ese esquema, que permanece provisionalmente congelado bajo su propia autoridad (`ENVIRONMENT_REFERENCE_PROTOCOL.md` §14).
**Propósito:** definir cómo Claude Desktop consume referencias gráficas ya registradas en el manifest de Árboris, determina qué información visual puede utilizar para implementar, evita inferencias no autorizadas y registra la trazabilidad entre referencia, autorización, decisión e implementación.

---

## 1. Propósito y alcance

GRRP es el protocolo operativo que conecta:

```text
referencia ambiental (manifest.csv, upstream)
        ↓
Implementation Authorization (downstream, separada)
        ↓
análisis de Claude
        ↓
decisión de implementación
        ↓
repositorio
        ↓
evidencia visual
```

GRRP no es:

- un renderer;
- un asset manager;
- un sistema de navegación;
- un sistema botánico;
- una extensión de ASC;
- un sistema de gameplay;
- un framework de Visual QA;
- ACE;
- H16;
- una integración con Replit;
- un esquema de registro de referencias paralelo a `ENVIRONMENT_REFERENCE_PROTOCOL.md`.

Su única función es controlar la transición entre una referencia ambiental ya registrada upstream y una implementación visual derivada.

---

## 2. Principio de autoridad

La regla superior es:

> Una referencia gráfica puede orientar una decisión de representación visual únicamente dentro de las influencias expresamente autorizadas para esa referencia. No puede crear, modificar ni resolver por sí misma una autoridad normativa.

La precedencia es:

```text
fuente normativa
    >
contrato
    >
restricción de implementación
    >
estado upstream de la referencia (manifest.csv)
    >
Implementation Authorization (downstream)
    >
interpretación visual
```

Una referencia nunca puede utilizarse para resolver silenciosamente un `OPEN` normativo. Una `Implementation Authorization` tampoco puede hacerlo: solo autoriza influencia dentro de dimensiones ya permitidas, nunca cierra decisiones normativas.

Si una referencia contradice una fuente normativa, GRRP exige `CONFLICT → STOP`.

---

## 3. Fuentes que Claude debe respetar

Antes de utilizar una referencia para implementar, Claude debe identificar las fuentes normativas aplicables al objetivo.

Para MAP-001, entre otras:

- `SPATIAL_MODEL.md`
- `MAP_TOPOLOGY_SYSTEM.md`
- `MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN.md`
- `ARBORIS_SCENE_COMPILER.md`
- `ASC_V0_1_EXECUTABLE_SPEC.md`

Para el registro y clasificación de la referencia ambiental en sí, la fuente es:

- `docs/ENVIRONMENT_REFERENCE_PROTOCOL.md` (reglas de captura, campos y vocabulario);
- `docs/references/environments/manifest.csv` (registro concreto, fila por `referenceId`).

Las referencias visuales, y la autorización downstream descrita en esta especificación, no sustituyen ninguna de estas fuentes.

---

## 4. Descubrimiento de referencias

Cuando se le solicite trabajar sobre una escena, mapa, UE o componente visual, Claude debe:

1. localizar la(s) fila(s) aplicable(s) en `docs/references/environments/manifest.csv` por `referenceId`;
2. leer su `status` upstream tal como está definido en `ENVIRONMENT_REFERENCE_PROTOCOL.md` (`collected | reviewed | selected | rejected | archived`);
3. descartar filas en `status: rejected` o `status: archived`;
4. utilizar filas en `status: collected` únicamente para análisis exploratorio, nunca para propuesta ni para implementación;
5. utilizar filas en `status: reviewed` para análisis y para producir una propuesta (`PROPOSE`, sección 15), nunca para implementar directamente;
6. utilizar filas en `status: selected` como las únicas que satisfacen el requisito upstream de implementación — sin que esto por sí solo autorice implementar (ver sección 16, `IMPLEMENT` exige además una `Implementation Authorization` externa válida);
7. localizar el asset físico asociado mediante `localAssetPath`, cuando exista;
8. leer la fila completa del manifest antes de interpretar la imagen.

No debe asumir que un archivo de imagen presente en el repositorio está autorizado para implementación simplemente porque exista, ni porque su fila tenga cualquier `status` upstream — el `status` upstream es condición necesaria, no suficiente (ver sección 10).

GRRP no introduce un vocabulario de estado propio para la referencia misma. No existe `candidate`, `approved`, `deprecated` como estado de la referencia; esos términos quedan eliminados de GRRP. El único vocabulario de estado de la referencia es el ya vigente en `ENVIRONMENT_REFERENCE_PROTOCOL.md`.

---

## 5. Lectura de la fila del manifest (registro upstream)

GRRP no define un "Reference Record" propio. Para cada referencia seleccionada, Claude lee directamente su fila en `docs/references/environments/manifest.csv`, usando los campos ya existentes y documentados en `ENVIRONMENT_REFERENCE_PROTOCOL.md`, entre ellos:

```text
referenceId
sourceType
referenceKind
evidenceRole
pilotRelevance
status
reviewConfidence
observedNotes
interpretedNotes
ecologicalUse
artUse
localAssetPath
```

GRRP no duplica estos campos en ningún documento propio. Cuando esta especificación necesita "lo que se ve en la referencia" o "para qué se cree que sirve", se refiere directamente a `observedNotes`, `interpretedNotes`, `artUse` y `ecologicalUse` tal como existen en el manifest — no crea `visualObservation` ni `visualIntent` como campos nuevos.

Si la fila del manifest correspondiente al `referenceId` no existe, o le faltan campos mínimos según `ENVIRONMENT_REFERENCE_PROTOCOL.md` §2, Claude debe marcar:

```text
INSUFFICIENT_REFERENCE_METADATA
```

y detener la derivación correspondiente, sin completar el campo faltante por inferencia.

---

## 6. Carga y comprobación del asset

Claude debe comprobar que el asset corresponde al `referenceId` señalado, usando el campo `localAssetPath` de su fila en el manifest.

La identidad de la referencia es exclusivamente:

```text
referenceId
```

tal como existe en `manifest.csv`. GRRP no introduce un campo `revision` independiente: el manifest no lo tiene, y GRRP no puede exigir un dato que su fuente upstream no provee. Si en el futuro `ENVIRONMENT_REFERENCE_PROTOCOL.md` incorpora versionado de referencias, GRRP podrá adoptarlo — no antes, y no por su cuenta.

El nombre o ubicación del archivo no constituye por sí solo la identidad.

Si el asset no puede localizarse en `localAssetPath`:

```text
ASSET_NOT_FOUND → STOP
```

Si el asset encontrado no corresponde inequívocamente a la fila del manifest:

```text
ASSET_MISMATCH → STOP
```

No debe sustituirse silenciosamente por otra imagen.

---

## 7. Implementation Authorization — entrada downstream separada

GRRP distingue explícitamente dos capas:

```text
ESTADO UPSTREAM
pertenece a la referencia
vive en manifest.csv
gobernado por ENVIRONMENT_REFERENCE_PROTOCOL.md
vocabulario: collected | reviewed | selected | rejected | archived

AUTORIZACIÓN DOWNSTREAM
pertenece a la decisión de implementación
vive en un documento separado, propio de GRRP
gobernada por esta especificación
```

Una fila de `manifest.csv` describe qué es la referencia y qué tan revisada está. No describe, y no debe describir, qué se le permite influir en una implementación concreta. Esa función corresponde exclusivamente a la `Implementation Authorization`.

Una `Implementation Authorization` es la única entrada nueva que GRRP requiere. Es mínima y contiene exactamente:

```text
referenceId
target
allowedInfluence
forbiddenInference
autorización explícita (quién/qué la habilita)
```

Nada más. GRRP v0.1 no define campos adicionales para esta entrada. No es un "GRRC Record" de 14 campos: es una autorización de alcance acotado que vincula una referencia ya registrada (por `referenceId`) con un permiso concreto de influencia.

`target` reemplaza lo que una versión anterior de esta especificación llamaba `scope`: identifica el objetivo de implementación (por ejemplo, una UE o un mapa concreto) sobre el que la autorización aplica.

Esta especificación no crea ninguna `Implementation Authorization` real. Define únicamente su forma mínima.

### 7.1 Origen de la Implementation Authorization

Una `Implementation Authorization` es una **entrada externa** a la ejecución de GRRP. No es un artefacto que GRRP produzca ni que Claude produzca como parte de analizar, proponer o implementar algo.

Durante una ejecución de GRRP, Claude puede:

```text
leer una Implementation Authorization existente
comprobar sus campos (referenceId, target, allowedInfluence, forbiddenInference)
consumirla como condición habilitante de IMPLEMENT
```

Durante esa misma ejecución, cuando pretende utilizar esa autorización para implementar, Claude **no puede**:

```text
crear una Implementation Authorization para autorizar su propia implementación
autoaprobarla
cambiar su autorización
ampliar su target
ampliar su allowedInfluence
eliminar o reducir su forbiddenInference
convertir una propuesta que Claude mismo produjo (PROPOSE) en una Implementation
  Authorization
```

Una `Implementation Authorization` debe existir **antes** de la ejecución que pretende consumirla, y debe haber sido producida fuera de esa ejecución. Que Claude haya generado un diagnóstico o una propuesta (`PROPOSE`, sección 15) en la misma sesión o en una anterior no constituye, por sí mismo, una `Implementation Authorization` — ver sección 16.

### 7.2 Identidad del autorizador — OPEN

La identidad concreta de la persona, rol o proceso que emite una `Implementation Authorization` permanece `OPEN` en v0.1. GRRP no define, y no debe inventar, quién autoriza. Esta especificación no diseña usuarios, roles, firmas, permisos ni workflow técnico de aprobación — eso queda fuera de v0.1 y no se cierra aquí.

### 7.3 Regla de bloqueo por ausencia de autorización

Si una operación requiere implementación y no existe una `Implementation Authorization` externa válida para esa referencia y ese target:

```text
BLOCKED
```

Esto aplica con independencia del `status` upstream de la referencia en `manifest.csv` — ver sección 16.

---

## 8. Comprobación de target

Antes de utilizar una referencia para implementar, Claude debe comprobar:

```text
¿El objetivo actual coincide con el target de la Implementation Authorization?
```

Ejemplo:

```text
target: MAP-001 / UE-002
```

permite utilizar la autorización solo para ese ámbito.

Una autorización destinada a otro mapa o UE no puede trasladarse por analogía a un objetivo distinto sin una nueva autorización explícita.

---

## 9. Allowed Influence como whitelist

`allowedInfluence`, declarado en la `Implementation Authorization`, es una lista positiva.

Regla:

> Sólo las dimensiones expresamente incluidas en `allowedInfluence` pueden recibir influencia de la referencia.

Ejemplo:

```text
allowedInfluence:
  - terrain_visual_treatment
  - vegetation_visual_density
  - atmospheric_treatment
```

La referencia no puede influir sobre navegación, conectividad, especies, bearing u otra dimensión no incluida.

No se permite interpretar la ausencia de una prohibición como permiso.

---

## 10. Forbidden Inference como protección complementaria

`forbiddenInference`, declarado en la `Implementation Authorization`, registra inferencias especialmente peligrosas o susceptibles de producir errores.

Ejemplo:

```text
forbiddenInference:
  - navigation_connection
  - walkable_boundary
  - geographic_bearing
  - species_occurrence
```

`forbiddenInference` no es una blacklist exhaustiva.

La regla primaria sigue siendo:

```text
no permitido por allowedInfluence
=
no autorizado
```

---

## 11. Observación frente a decisión

Claude debe separar tres niveles, usando en los dos primeros los campos ya existentes del manifest en vez de duplicarlos:

```text
observedNotes / interpretedNotes  (ya existen en manifest.csv)
implementationDecision            (nuevo, no pertenece al manifest ni a la
                                    Implementation Authorization)
```

### Observación e interpretación

Provienen directamente de la fila del manifest (`observedNotes`, `interpretedNotes`, y cuando corresponda `artUse`/`ecologicalUse`). GRRP los lee; no los redefine ni los reescribe.

### Implementation Decision

Es la decisión concreta sobre código, asset o configuración. No pertenece al manifest ni a la `Implementation Authorization`. Debe registrarse en el registro de implementación correspondiente (sección 18).

Claude no debe convertir automáticamente una observación en una obligación de implementación.

---

## 12. Cross-check normativo

Antes de implementar, Claude debe comprobar si la interpretación afecta alguna dimensión normativa.

Como mínimo:

```text
navigation
connectivity
ports
routeShape
walkableEnvelope
worldCardinalMapping
camera contract
species occurrence
ecological rules
```

Si la implementación propuesta afecta una de estas dimensiones, debe verificar que exista una autorización normativa independiente.

Una referencia gráfica, y una `Implementation Authorization` por sí sola, no proporcionan esa autorización.

Para dimensiones botánicas/ecológicas en particular, GRRP se apoya en las reglas ya existentes de `ENVIRONMENT_REFERENCE_PROTOCOL.md` §8 (conteos, `spawnWeight`, `placementWeight`, distinción `observationCount`/`photoCount`/`individualCount`) en vez de definir una regla paralela.

---

## 13. Protocolo de conflicto

Si existe contradicción:

```text
fuente normativa
vs.
referencia
```

o:

```text
contrato
vs.
interpretación visual
```

o:

```text
Implementation Authorization
vs.
estado upstream de la referencia
```

Claude debe producir:

```text
CONFLICT
```

y detener la implementación afectada.

Debe informar:

```text
conflictingSource
referenceId
observedConflict
affectedDimension
reasonForStop
```

No debe resolver el conflicto mediante criterio visual propio.

---

## 14. Protocolo OPEN

Si una referencia parece proporcionar información sobre algo que la fuente normativa mantiene como `OPEN`, Claude debe conservarlo como `OPEN`.

Ejemplo:

```text
reference:
parece mostrar una curva

contract:
routeShape = OPEN
```

Resultado:

```text
observedNotes (del manifest):
"la referencia muestra una trayectoria curva"

routeShape:
OPEN
```

Nunca:

```text
routeShape = bend
```

salvo que una fuente normativa autorizada haya cerrado esa decisión.

Una `Implementation Authorization` no puede declarar `allowedInfluence` sobre una dimensión que una fuente normativa mantiene `OPEN` con el efecto de cerrarla; solo puede autorizar cómo se representa visualmente algo ya permitido, nunca resolver el `OPEN` subyacente.

---

## 15. Propuesta antes de modificación

Para la primera implementación de una referencia, Claude debe presentar un diagnóstico/propuesta antes de modificar archivos cuando la tarea no haya autorizado explícitamente la implementación.

El informe debe contener:

```text
REFERENCE (referenceId)
UPSTREAM STATUS (manifest.csv)
TARGET
ALLOWED INFLUENCE
FORBIDDEN INFERENCE
OBSERVED NOTES (manifest.csv)
INTERPRETED NOTES (manifest.csv)
NORMATIVE SOURCES CHECKED
OPEN ITEMS
CONFLICTS
PROPOSED IMPLEMENTATION
FILES EXPECTED TO CHANGE
```

Si existe conflicto o falta información crítica:

```text
NO MODIFICATION
```

---

## 16. Regla de modificación — PROPOSE frente a IMPLEMENT

GRRP distingue de forma inequívoca dos operaciones distintas. Una no se convierte automáticamente en la otra.

### 16.1 PROPOSE gate

`PROPOSE` (producir el diagnóstico/propuesta de la sección 15) requiere únicamente:

```text
status upstream = reviewed  o  status upstream = selected
+ las demás comprobaciones aplicables de las secciones 4, 6, 8-14 que no dependan
  de una Implementation Authorization
```

`status: reviewed` es suficiente para análisis y para `PROPOSE`. `status: reviewed` **no habilita** `IMPLEMENT` bajo ninguna circunstancia.

`status: selected` satisface el requisito upstream también para `IMPLEMENT`, pero **no autoriza por sí solo** ninguna modificación — ver 16.2.

`PROPOSE` no requiere una `Implementation Authorization` existente. Es, precisamente, el paso que puede ejecutarse mientras esa autorización todavía no existe.

### 16.2 IMPLEMENT gate

`IMPLEMENT` (modificar el repositorio) requiere que se cumplan **simultáneamente** todas las condiciones siguientes:

1. `status` upstream de la referencia en `manifest.csv` es exactamente `selected`;
2. existe una `Implementation Authorization` **externa** válida (sección 7.1 — no creada ni autoaprobada por Claude durante esta ejecución);
3. el `referenceId` de esa autorización coincide con el de la referencia;
4. el objetivo actual es compatible con el `target` de esa autorización;
5. la dimensión de la operación está dentro de `allowedInfluence`;
6. la operación respeta `forbiddenInference`;
7. no existe `CONFLICT` (sección 13);
8. ningún `OPEN` normativo queda cerrado ni alterado por la operación (sección 14);
9. se respetan las autoridades normativas aplicables (sección 3, sección 12).

Si falta cualquiera de estas nueve condiciones:

```text
STOP
```

y, específicamente cuando falta la condición 1 o la condición 2:

```text
BLOCKED
```

### 16.3 Regla de no conversión automática

`PROPOSE` no debe convertirse automáticamente en `IMPLEMENT`. Que Claude haya producido una propuesta completa y bien fundamentada no cambia el estado de autorización: una propuesta producida por Claude **no constituye, en ningún caso, una `Implementation Authorization`** (ver sección 7.1). El paso de `PROPOSE` a `IMPLEMENT` exige que aparezca, desde fuera de la ejecución de GRRP, una `Implementation Authorization` que cumpla 16.2(2)-(6).

---

## 17. Separación respecto de ASC

GRRP nunca debe modificar directamente:

```text
ASC_V0_1_EXECUTABLE_SPEC.md
ASC fixtures
ASC compiler
```

por efecto de una referencia gráfica o de una `Implementation Authorization`.

Si una referencia revela una posible necesidad de cambiar ASC:

```text
reference
    ↓
CONFLICT / CHANGE REQUEST
    ↓
human review
```

No:

```text
reference
    ↓
automatic ASC modification
```

El fixture ASC congelado de MAP-001 (`tools/asc/fixtures/map-001-structural.json`) permanece independiente de GRRP y de cualquier `Implementation Authorization`.

---

## 18. Registro de implementación

Después de una modificación autorizada, debe existir un registro separado tanto de la fila del manifest como de la `Implementation Authorization`.

Conceptualmente:

```text
VISUAL_IMPLEMENTATION_RECORD

referenceId
implementationTarget
implementationAuthorizationRef
observedNotes / interpretedNotes (citados, no copiados, desde el manifest)
decision
changedFiles
commit
evidence
```

Esto permite reconstruir:

```text
referencia (manifest.csv)
    ↓
Implementation Authorization
    ↓
interpretación
    ↓
decisión
    ↓
cambio
    ↓
commit
```

Ni la fila del manifest ni la `Implementation Authorization` deben modificarse retrospectivamente para convertirlas en registro de implementación.

---

## 19. Git y trazabilidad

Cuando sea posible, el registro de implementación debe identificar:

```text
changedFiles
commit
```

El commit es el punto técnico de trazabilidad del cambio.

La referencia no debe quedar únicamente en el texto de una conversación.

Debe existir una relación persistente:

```text
referenceId
→ Implementation Authorization
→ implementation record
→ commit
```

---

## 20. Evidencia visual

Cuando exista capacidad de generar evidencia visual, la captura debe quedar asociada al registro de implementación.

La relación es:

```text
reference (manifest.csv)
    ↓
Implementation Authorization
    ↓
implementation
    ↓
visual evidence
```

La evidencia demuestra qué se implementó.

La referencia demuestra qué orientó la implementación.

No son intercambiables.

La ausencia de evidencia visual no autoriza a inventar que una implementación fue verificada visualmente.

---

## 21. Respuesta mínima de Claude

Cuando se le solicite analizar una referencia, Claude debe poder devolver:

```text
GRRP RESULT

Reference:
<referenceId>

Upstream status:
<status en manifest.csv>

Target:
<target de la Implementation Authorization, si existe>

Allowed influence:
<list, o NOT AUTHORIZED si no existe Implementation Authorization>

Forbidden inference:
<list>

Observed notes:
<texto, desde manifest.csv>

Interpreted notes:
<texto, desde manifest.csv>

Normative cross-check:
PASS / CONFLICT / INSUFFICIENT

OPEN affected:
<list>

Implementation:
NOT AUTHORIZED / PROPOSED / COMPLETED

Files changed:
<list>

Commit:
<id or NOT CREATED>

Evidence:
<reference or NOT AVAILABLE>
```

---

## 22. Estados de ejecución

GRRP utiliza estos estados operativos:

```text
READY
ANALYZING
PROPOSED
AUTHORIZED
IMPLEMENTED
CONFLICT
BLOCKED
INSUFFICIENT
```

Estos son estados de la *ejecución del protocolo*, no del `status` upstream de la referencia (que sigue siendo exclusivamente el vocabulario de `ENVIRONMENT_REFERENCE_PROTOCOL.md`).

No debe utilizarse `IMPLEMENTED` si no hubo modificación real.

No debe utilizarse `VERIFIED` si no existe evidencia correspondiente.

---

## 23. Regla de no sustitución

Claude no debe sustituir:

```text
missing source
missing metadata
missing asset
missing authority
missing Implementation Authorization
```

por una suposición razonable.

Debe declarar la ausencia.

En particular:

```text
OPEN
≠
placeholder
≠
best guess
```

---

## 24. Protocolo completo

```text
GRRP-01  DISCOVER (en manifest.csv, por referenceId)
GRRP-02  READ MANIFEST ROW
GRRP-03  RESOLVE ASSET (localAssetPath)
GRRP-04  CHECK UPSTREAM STATUS
GRRP-05  LOCATE IMPLEMENTATION AUTHORIZATION
GRRP-06  CHECK TARGET
GRRP-07  CHECK ALLOWED INFLUENCE
GRRP-08  CHECK FORBIDDEN INFERENCE
GRRP-09  INSPECT REFERENCE
GRRP-10  READ OBSERVED NOTES (manifest.csv)
GRRP-11  READ INTERPRETED NOTES (manifest.csv)
GRRP-12  CROSS-CHECK NORMATIVE SOURCES
GRRP-13  CHECK OPEN
GRRP-14  CHECK CONFLICT
GRRP-15  PROPOSE IMPLEMENTATION
GRRP-16  AUTHORIZE
GRRP-17  IMPLEMENT
GRRP-18  RECORD CHANGED FILES
GRRP-19  RECORD COMMIT
GRRP-20  RECORD VISUAL EVIDENCE
```

Las etapas posteriores a `GRRP-15` sólo se ejecutan cuando la implementación está autorizada.

---

## 25. Prueba mínima de aceptación

GRRP v0.1 se considera operacionalmente válido si Claude puede procesar una referencia y demostrar:

### Test A — reviewed habilita propuesta, no implementación

```text
status upstream = reviewed
+ Implementation Authorization compatible (si existiera)
→ PROPOSE permitido
→ IMPLEMENT bloqueado (status upstream no es selected)
```

Confirma que `reviewed` nunca es suficiente para `IMPLEMENT`, exista o no una `Implementation Authorization`.

### Test B — selected sin autorización

```text
status upstream = selected
+ ninguna Implementation Authorization externa válida
→ IMPLEMENT bloqueado (BLOCKED)
```

Confirma que `selected` por sí solo nunca autoriza implementar.

### Test C — selected con autorización externa válida

```text
status upstream = selected
+ Implementation Authorization externa válida (referenceId coincide,
  target compatible, allowedInfluence compatible, forbiddenInference respetado)
+ sin CONFLICT
+ ningún OPEN normativo cerrado o alterado
→ IMPLEMENT puede quedar autorizado por GRRP para ejecución
```

GRRP evalúa las nueve condiciones de la sección 16.2 y, si todas se cumplen, permite proceder — sin que GRRP haya creado, autoaprobado ni modificado la `Implementation Authorization` consumida.

### Test D — una propuesta de Claude no es autorización

```text
Claude produce PROPOSE (sección 15) para una referencia
→ esa propuesta, por sí misma, nunca satisface la condición 16.2(2)
→ IMPLEMENT permanece bloqueado hasta que exista una Implementation
  Authorization externa distinta de la propuesta
```

### Test E — referencia fuera de target

```text
target incompatible
→ BLOCKED
```

### Test F — inferencia prohibida

```text
referencia visual
→ intenta resolver navegación
→ BLOCKED / CONFLICT
```

### Test G — OPEN

```text
referencia sugiere resolución
+ contrato mantiene OPEN
→ OPEN permanece OPEN
```

### Test H — conflicto

```text
referencia contradice contrato
→ CONFLICT
→ no modification
```

### Test I — trazabilidad

```text
referenceId
→ Implementation Authorization
→ implementation record
→ changed files
→ commit
```

Debe ser posible reconstruir la cadena.

---

## 26. Primera prueba recomendada

La primera prueba no debe utilizar renderer, Replit ni Visual QA.

Debe ser una prueba documental y de repositorio:

```text
una fila existente de manifest.csv (referenceId)
        ↓
una Implementation Authorization mínima
        ↓
Claude ejecuta GRRP
        ↓
diagnóstico
        ↓
propuesta de implementación
        ↓
STOP antes de modificar
```

Esta especificación no crea esa `Implementation Authorization`. Su creación es un paso posterior y separado.

Si esa prueba pasa, la segunda prueba puede autorizar una modificación visual pequeña.

---

## 27. Regla de congelación

GRRP v0.1 debe considerarse congelado cuando:

1. el protocolo pueda ejecutarse sin interpretación arquitectónica adicional;
2. ningún paso permita contaminar ASC;
3. `allowedInfluence` funcione como whitelist;
4. `OPEN` permanezca `OPEN`;
5. los conflictos produzcan `STOP`;
6. pueda reconstruirse la trazabilidad hasta el commit;
7. el protocolo haya sido probado con al menos una referencia real ya existente en `manifest.csv`;
8. ningún paso haya requerido agregar campos, categorías o estados a `manifest.csv` ni redefinir su vocabulario de `status`.

Hasta entonces, cambios al protocolo son de especificación y no de implementación.

---

## 28. Estado

**GRRP v0.1 — SPECIFICATION (reconciliada con `ENVIRONMENT_REFERENCE_PROTOCOL.md`)**

No implica:

- implementación del protocolo;
- creación de una `Implementation Authorization` real;
- incorporación de nuevas referencias al manifest;
- modificación de `ENVIRONMENT_REFERENCE_PROTOCOL.md` ni de `manifest.csv`;
- modificación de ASC;
- modificación de MAP-001;
- construcción de renderer;
- definición de quién, qué rol o qué proceso emite una `Implementation Authorization` (permanece `OPEN`, sección 7.2);
- definición del formato físico o carpeta de almacenamiento de `Implementation Authorization` o de `VISUAL_IMPLEMENTATION_RECORD`;
- selección de la primera referencia real sobre la que se ejecutará la prueba.

El siguiente paso autorizado después de esta especificación es una prueba controlada con una única referencia ya existente en `manifest.csv` y una `Implementation Authorization` mínima creada aparte, por un origen externo a la ejecución de GRRP.

---

## 29. Principio final

La función de GRRP puede resumirse en una sola regla:

```text
Claude puede interpretar una referencia ya registrada.
Claude puede implementar una decisión visual autorizada downstream.
Claude no puede convertir una referencia, ni su propia autorización, en autoridad normativa.
```

Ese es el puente entre referencias visuales ya catalogadas y Claudio.
