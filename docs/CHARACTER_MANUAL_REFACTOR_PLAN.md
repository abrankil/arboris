# Árboris — Instrucciones de modificación de manuales de personajes
## Plan de refactor documental en revisión

**Estado:** propuesta documentada en la rama `docs/character-manual-refactor`; no aplicar todavía cambios sobre los manuales existentes ni sobre `main` sin revisión separada.  
**Objetivo:** reducir duplicaciones, separar canon/estado/workflow, mejorar escalabilidad del sistema de personajes y evitar que decisiones visuales abiertas se conviertan accidentalmente en reglas de gameplay o botánica.

---

## 1. Principios que NO deben cambiar

Mantener como autoridad superior:

1. `docs/GRAPHIC_DIRECTION.md`
2. `docs/ART_STYLE_GUIDE.md`
3. estado/canon de personajes
4. `data/characters/index.json`
5. fichas individuales y evidencia botánica

Mantener sin reinterpretación:

- hoja como cuerpo principal de los personajes-especie;
- ojos pequeños y expresivos;
- flotación independiente para personajes de colección;
- preservación de forma, margen, ápice, nervaduras, coloración y asimetría relevante;
- lienzo 125×125 px;
- PNG RGBA;
- píxel real 1×1;
- nearest-neighbor para ampliaciones;
- separación entre referencia generada, diseño aprobado, editable verificado y limpieza manual integrada;
- validación técnica separada de aprobación visual;
- personaje ≠ evidencia botánica;
- diseño de personaje no define por sí mismo poderes, combate, reglas de desbloqueo ni mecánicas.

---

## 2. Problema documental actual

Actualmente varias reglas aparecen repetidas en:

- `ARBORIS_CHARACTER_CREATION_RULES.md`
- `CHARACTER_DESIGN_STATUS.md`
- `CHARACTER_COLLECTION_FINAL.md`
- `ART_STYLE_GUIDE.md`
- `GRAPHIC_DIRECTION.md`

Esto aumenta el riesgo de divergencia futura.

La modificación debe asignar una responsabilidad única a cada documento.

---

# FASE A — REORDEN DOCUMENTAL
## Aplicar primero, sin tocar sprites ni JSON

### A1. `GRAPHIC_DIRECTION.md`

Mantenerlo como fuente de:

- propósito de los personajes;
- relación arte ↔ producto;
- roles de Alejandra y Álvaro;
- jerarquía de fuentes;
- método de decisión;
- diferencia entre personaje-especie y personaje auxiliar;
- estados conceptuales del proceso creativo.

### Añadir una sección breve: `Arquitectura documental de personajes`

Debe declarar:

```text
GRAPHIC_DIRECTION.md
    propósito y decisiones

ART_STYLE_GUIDE.md
    contrato visual y técnico

CHARACTER_CREATION_WORKFLOW.md
    procedimiento operativo

CHARACTER_TEMPLATE.md
    plantilla de ficha

CHARACTER_DESIGN_STATUS.md
    estado de producción

data/characters/index.json
    índice activo/canon operativo

data/characters/<character>
    identidad específica y assets
```

No repetir en esta sección reglas técnicas detalladas.

---

### A2. `ART_STYLE_GUIDE.md`

Mantener como única fuente del contrato técnico.

No duplicar sus reglas en otros documentos salvo resumen/enlace.

Añadir dos secciones nuevas:

#### `Master y derivados`

Definir:

```text
character master
├── gallery sprite
├── discovery derivative
├── gameplay derivative
├── expressions
├── animation frames
└── promotional derivative
```

Reglas:

- el master conserva la identidad canónica;
- un derivado no reemplaza al master;
- cualquier derivado debe declarar su master de origen;
- una pose o animación no puede convertirse accidentalmente en nuevo canon;
- modificaciones estructurales del personaje requieren nueva versión del master.

#### `Geometría de producción futura`

Registrar como PROPUESTO, no como canon definitivo:

- visual center;
- pivot/origin;
- effective bounds;
- float anchor;
- attachment points;
- safe area.

No definir valores numéricos todavía.

Primero medir el elenco existente.

---

### A3. Migrar y deprecar `ARBORIS_CHARACTER_CREATION_RULES.md`

`CHARACTER_CREATION_WORKFLOW.md` ya existe como documento nuevo en esta rama. Por tanto, no ejecutar un rename directo que pueda sobrescribirlo.

Acción recomendada:

1. comparar `ARBORIS_CHARACTER_CREATION_RULES.md` con `CHARACTER_CREATION_WORKFLOW.md`;
2. migrar únicamente contenido todavía útil que no esté representado en el workflow nuevo;
3. actualizar referencias entrantes para que apunten a `CHARACTER_CREATION_WORKFLOW.md`;
4. marcar el archivo antiguo como deprecado durante una transición breve;
5. eliminarlo solo cuando no existan referencias activas ni contenido único.

El workflow debe conservar:

1. brief mínimo;
2. consulta de evidencia o referencias;
3. definición de rasgos obligatorios;
4. propuesta;
5. comparación con canon;
6. aprobación visual;
7. preparación para Pixelorama;
8. validación técnica;
9. integración;
10. registro.

Eliminar del workflow cualquier duplicación innecesaria de:

- listado completo del elenco vigente;
- contrato técnico detallado del `ART_STYLE_GUIDE`;
- descripciones individuales extensas.

En su lugar enlazar:

- `CHARACTER_DESIGN_STATUS.md`;
- `data/characters/index.json`;
- fichas individuales.

---

### A4. `docs/CHARACTER_TEMPLATE.md`

La plantilla estándar ya existe en esta rama. Debe mantenerse como única fuente para la estructura de una ficha nueva.

No duplicar aquí su contenido completo. El plan solo exige que la plantilla cubra:

- identidad y `characterType`;
- versionado;
- evidencia/referencias diferenciadas para personajes-especie y auxiliares;
- rasgos obligatorios;
- identidad gráfica y rostro;
- elementos secundarios;
- restricciones;
- canon;
- estados por atributo;
- derivados;
- geometría futura;
- historial.

`speciesId`, `speciesCommonName` y `scientificName` son obligatorios solo para `characterType: species`; en auxiliares deben figurar como `N/A`.

Los campos botánicos específicos de elementos secundarios se completan solo cuando `characterType: species`; para auxiliares se usan descripciones visuales/materiales equivalentes sin fingir una estructura botánica.

`gameplayRole` usa una única convención en minúsculas: `open | none | approved`, y debe permanecer `open` mientras no exista una mecánica aprobada.

Ver [`CHARACTER_TEMPLATE.md`](CHARACTER_TEMPLATE.md) para la estructura vigente.

---

### A5. `CHARACTER_DESIGN_STATUS.md`

Convertirlo en un documento de ESTADO, no en segunda guía.

Sustituir descripciones largas por tabla.

Formato recomendado:

| ID | Personaje | Master | Morfología | Paleta | Rostro | Compañero | Cleanup | Animación | Gameplay |
|---|---|---|---|---|---|---|---|---|---|

Estados posibles:

- `approved`
- `proposed`
- `open`
- `verified`
- `not_started`
- `deprecated`

Debajo de la tabla mantener únicamente:

- pendientes reales;
- incidencias técnicas;
- enlaces a assets;
- excepciones documentadas.

No repetir el workflow general.

---

### A6. `CHARACTER_COLLECTION_FINAL.md`

NO eliminar inmediatamente.

Es un snapshot útil por:

- hashes;
- versiones;
- listado consolidado;
- trazabilidad histórica.

Pero su nombre `FINAL` es ambiguo porque los diseños siguen sujetos a cambios.

Acción recomendada:

renombrar a:

`CHARACTER_CANON_SNAPSHOT_2026-09-15.md`

Añadir al inicio:

> Documento histórico de consolidación. No es fuente normativa vigente. El canon operativo está definido por `data/characters/index.json`, las fichas individuales y `CHARACTER_DESIGN_STATUS.md`.

No mantenerlo actualizado después del refactor.

Antes de renombrar o retirar el nombre anterior:

1. buscar todas las referencias a `CHARACTER_COLLECTION_FINAL.md` en `README.md`, `docs/`, scripts y cualquier otro archivo textual;
2. actualizar esos enlaces al nuevo snapshot;
3. verificar que no queden enlaces rotos;
4. recién entonces completar el cambio de nombre.

---

# FASE B — MEJORAS DE PRODUCCIÓN
## Aplicar después de aprobar Fase A

### B1. Formalizar nomenclatura

Usar siempre campos separados:

```text
speciesCommonName
characterName
scientificName
```

Ejemplo:

```text
speciesCommonName: Litre
characterName: Litrini
scientificName: Lithraea caustica
```

Nunca usar los tres conceptos como intercambiables.

---

### B2. Separar versiones

Definir:

```text
designVersion
spriteVersion
technicalRevision
```

Ejemplo conceptual:

```text
designVersion: 2
spriteVersion: manual-cleanup-v2
technicalRevision: alpha-fix-1
```

Una corrección técnica no debe aparentar ser un rediseño artístico.

---

### B3. Sistema de rostros

Añadir al `ART_STYLE_GUIDE` una microguía, sin imponer una cara idéntica.

Estados mínimos a explorar:

- neutral;
- closed;
- alert;
- happy;
- surprised.

Definir posteriormente:

- tamaño relativo;
- contraste;
- separación;
- desplazamiento permitido según morfología.

No fijar medidas hasta analizar los sprites actuales.

---

### B4. Pruebas de aprobación visual

Añadir al workflow:

#### Silhouette test
¿Se diferencia del elenco por la silueta?

#### Botanical cue test
¿Siguen visibles los rasgos botánicos seleccionados como esenciales? Para personajes auxiliares, sustituir por la verificación de sus rasgos materiales/visuales obligatorios.

#### Thumbnail test
¿Funciona en tamaño de colección/UI?

#### Environment test
¿Se mantiene legible sobre un escenario Árboris?

Estos tests complementan, no reemplazan, la aprobación de Dirección de Arte.

---

### B5. Proporciones

No imponer todavía una medida común.

Primero ejecutar un análisis del elenco canónico:

- bounding box visible;
- ancho;
- alto;
- porcentaje de ocupación del canvas;
- centro visual;
- posición de ojos;
- extensión de accesorios.

Con esos datos proponer después un rango de escala visual.

El objetivo es coherencia de lectura, no uniformidad física.

---

### B6. Frutos, flores y accesorios

Modificar expresiones que puedan anticipar gameplay.

En documentos normativos preferir:

> Frutos, flores, cápsulas y otros elementos pueden funcionar como acompañantes, accesorios, props visuales o elementos expresivos. Su presencia gráfica no define automáticamente una mecánica de juego.

Evitar `arma` o `herramienta` como categoría normativa salvo que exista una mecánica explícitamente aprobada.

En la ficha individual separar:

```text
botanicalStructure:
visualRepresentation:
gameplayRole:
```

Para `characterType: support`, `botanicalStructure` debe ser `N/A` y la identidad del elemento se describe mediante su referencia material/visual.

---

# FASE C — DATOS Y AUTOMATIZACIÓN
## Solo después de aprobar el modelo documental

No modificar el schema de `data/characters/` en el mismo commit que el refactor documental.

Después de validar las plantillas, evaluar añadir a fichas JSON:

```json
{
  "speciesCommonName": "",
  "characterName": "",
  "scientificName": "",
  "designVersion": "",
  "spriteVersion": "",
  "technicalRevision": "",
  "status": {
    "morphology": "",
    "palette": "",
    "face": "",
    "companion": "",
    "spriteCleanup": "",
    "animation": "",
    "gameplayRole": ""
  }
}
```

Antes de cambiar schema:

1. revisar todas las fichas actuales;
2. comprobar consumidores del JSON;
3. actualizar validadores;
4. migrar todos los personajes en una sola operación coherente;
5. ejecutar tests;
6. ejecutar `tools/validate-graphic-assets.ps1`.

---

# ORDEN DE COMMITS RECOMENDADO

## Commit 1 — documentación estructural

```text
docs: clarify character documentation responsibilities
```

- actualizar `GRAPHIC_DIRECTION.md`;
- añadir mapa documental;
- migrar contenido único desde las reglas antiguas al workflow y actualizar referencias;
- consolidar `CHARACTER_TEMPLATE.md` como plantilla única;
- preparar el snapshot histórico y actualizar enlaces antes de cambiar su nombre.

No tocar sprites ni JSON.

## Commit 2 — estado de personajes

```text
docs: normalize character production status
```

- convertir `CHARACTER_DESIGN_STATUS.md` a tabla;
- añadir estados por atributo;
- preservar pendientes y excepciones.

## Commit 3 — mejoras de workflow

```text
docs: add character review and derivative rules
```

- master/derivados;
- tests de silueta/botánica/thumbnail/entorno;
- nomenclatura;
- separación de versiones;
- companion/gameplay role.

## Commit 4 — schema, solo si se aprueba

```text
data: normalize character metadata and production status
```

- modificar JSON;
- actualizar índice;
- actualizar validadores;
- migrar fichas.

---

# VALIDACIÓN ANTES DE MERGE

Comprobar:

- no se modificó ningún PNG canónico;
- hashes de sprites siguen iguales;
- rutas de assets siguen válidas;
- `data/characters/index.json` sigue apuntando al mismo canon;
- no se cambió evidencia botánica;
- no se introdujeron poderes/mecánicas;
- no se convirtió una decisión de diseño en regla científica;
- enlaces Markdown funcionan;
- no existen dos documentos que se declaren fuente primaria para la misma regla.

Ejecutar:

```powershell
pwsh -File tools/validate-graphic-assets.ps1
```

y cualquier test documental/datos existente.

---

# CRITERIO FINAL

El refactor se considera correcto si:

1. existe una sola fuente para cada tipo de decisión;
2. crear un nuevo personaje requiere consultar pocos documentos;
3. el estado de cada personaje puede entenderse sin leer todo su historial;
4. canon y derivados no pueden confundirse;
5. una revisión técnica no cambia arte aprobado;
6. una decisión gráfica no crea mecánicas de juego ni afirmaciones botánicas;
7. el sistema puede escalar a decenas de personajes sin duplicar reglas.
