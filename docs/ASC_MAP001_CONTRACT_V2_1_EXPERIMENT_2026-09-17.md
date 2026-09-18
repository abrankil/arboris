# ASC — Experimento MAP-001 contrato candidato v2.1

**Fecha:** 2026-09-17  
**Repositorio:** `abrankil/arboris`  
**Estado:** experimento documentado; no modifica el esquema ASC v0.1 ni autoriza v0.2  
**Ámbito:** mapeo manual parcial de `IT-001 / MAP-001` hacia un contrato ASC v0.1 con topología, relaciones territoriales y cámara.

## 1. Objetivo

Registrar el contrato candidato `MAP-001-ASC-MAPPING-0021` y la auditoría que llevó a considerarlo un candidato semántico estable para el alcance probado.

El experimento busca comprobar si el contrato ASC v0.1 existente puede representar, sin inventar geometría:

- topología contractual de MAP-001;
- jerarquía de la ruta principal;
- continuidad visual del terreno;
- relaciones territoriales obligatorias;
- invariantes de cámara;
- decisiones `OPEN`;
- restricciones de no inferencia;
- prohibiciones de salida.

Quedan fuera de alcance:

- geometría métrica exacta;
- forma materializada del `walkableEnvelope`;
- raster/celdas concretas;
- Interaction/Learning Contract detallado;
- ejecución contra un modelo generativo;
- fidelidad de una imagen generada;
- renderer/pathfinding;
- producción de assets.

## 2. Fuentes

Fuentes usadas para construir y auditar este candidato:

- `docs/MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN.md`
- `docs/TERRITORIAL_MAPPING_PROTOCOL.md`
- `docs/PILOT_ENVIRONMENT_VISUAL_CANON.md`
- `docs/ENVIRONMENT_PRODUCTION_SPEC.md`
- `docs/ASC_V0_1_EXECUTABLE_SPEC.md`
- `tools/asc/compile_asc.mjs`

Estas fuentes cumplen funciones distintas. Su convergencia no convierte ninguna de ellas en autoridad única sobre dominios que pertenecen a las otras.

## 3. Antecedente

La auditoría upstream previa identificó como gap principal la falta de una transformación explícita y validada:

```text
upstream autorizado
→ transformación / normalización
→ contrato ASC
→ ASC v0.1
→ prompt ASC
```

Este experimento no implementa esa transformación automáticamente. La ejecuta de forma manual y trazable sobre un caso concreto.

## 4. Hallazgo topológico previo

`docs/MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN.md` define para MAP-001 v0.3 los siguientes invariantes mínimos:

```text
singleConnectedComponent: pass
bottomEntryConnected: pass
topExitConnected: pass
leftEdgeClosed: pass
rightEdgeClosed: pass
noInventedBranches: pass
```

También exige:

- ruta principal;
- `walkableEnvelope` autoritativo;
- terreno continuo;
- cámara coherente;
- control de decisiones `OPEN`.

El documento no materializa la geometría exacta del `walkableEnvelope`. Por tanto:

```text
topología contractual: CONOCIDA
geometría exacta: OPEN
```

No se utilizan las matrices genéricas TEST-MAP-01/02 como si fueran la geometría real de MAP-001.

## 5. Contrato candidato v2.1

```json
{
  "version": "0.1",
  "executionMode": "compile-only",
  "testId": "MAP-001-ASC-MAPPING-0021",
  "objective": "Comprobar si ASC v0.1 preserva la topología contractual, la jerarquía de ruta, la continuidad visual del terreno, las relaciones territoriales y los invariantes de cámara autorizados de IT-001 / MAP-001 sin inventar la geometría todavía OPEN. Interacción detallada, geometría métrica y producción de assets quedan fuera del alcance de esta prueba.",
  "authorizedSources": [
    "docs/MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN.md",
    "docs/TERRITORIAL_MAPPING_PROTOCOL.md",
    "docs/PILOT_ENVIRONMENT_VISUAL_CANON.md",
    "docs/ENVIRONMENT_PRODUCTION_SPEC.md"
  ],
  "structuralContract": [
    "MAP-001 debe contener una única región transitable continua y conectada entre la entrada inferior y la salida superior; la geometría exacta del walkableEnvelope permanece OPEN.",
    "La ruta principal debe permanecer dominante dentro de la región transitable.",
    "El terreno debe leerse como una masa continua; las terrazas no deben convertirse en plataformas flotantes desconectadas."
  ],
  "mandatoryRelations": [
    "El borde inferior funciona como entrada conectada a la ruta principal.",
    "El borde superior funciona como salida conectada hacia el interior.",
    "Los bordes izquierdo y derecho permanecen cerrados.",
    "No existen ramas transitables adicionales no autorizadas.",
    "La progresión territorial sigue entrada → puente → puerta → camino principal → interior/cordillera.",
    "El puente cruza el estero antes de la puerta principal.",
    "La casa del conserje queda a la izquierda del recorrido después del umbral.",
    "En el umbral el estero cruza bajo el puente y realiza un giro visual en L.",
    "Después del umbral el estero permanece a la derecha del camino y en un nivel inferior.",
    "Las laderas contienen lateralmente el corredor."
  ],
  "open": [
    "Geometría exacta y rasterización del walkableEnvelope.",
    "Bearing exacto y geometría métrica del puente y del giro en L del estero.",
    "Pitch, yaw, FOV y zoom definitivos de cámara.",
    "Correspondencia cardinal geográfica exacta de los lados de pantalla."
  ],
  "doNotInfer": [
    "No derivar orientación cardinal geográfica desde screen_up, screen_down, izquierda o derecha.",
    "No convertir relaciones espaciales o topológicas autorizadas en geometría medida, distancias, bearings o rasterización no respaldados.",
    "No inferir distribución de especies o microhábitats a partir de la representación visual sin evidencia territorializada suficiente."
  ],
  "prohibited": [
    "No introducir ramas, bifurcaciones o conexiones adicionales no autorizadas.",
    "No extender MAP-001 hacia un tramo urbano, periurbano o aguas abajo fuera del fragmento piloto."
  ],
  "artisticFreedom": [
    "Roca, suelo, vegetación, terrazas y detalle visual pueden naturalizar la escena siempre que no alteren conectividad, puertos, relaciones territoriales, jerarquía de ruta, continuidad visual del terreno ni estados OPEN."
  ],
  "cameraFormat": [
    "Android portrait-first con viewport lógico 360 × H y H de prueba entre 640 y 800.",
    "Perfil PILOT_FIXED_ISOMETRIC: orientación fija, rotación deshabilitada, follow y pan permitidos.",
    "screen_up = interior / cordillera / progresión; screen_down = entrada / retorno."
  ],
  "readingPriorities": [
    "Priorizar la continuidad y dominancia de la ruta principal y la progresión hacia la cordillera.",
    "Priorizar puente, puerta, casa, estero, desniveles y cierre lateral antes que decoración."
  ],
  "validationCriteria": [
    "Existe una sola componente transitable conectada entre la entrada inferior y la salida superior.",
    "Los bordes izquierdo y derecho permanecen cerrados y no aparecen ramas no autorizadas.",
    "La ruta principal permanece dominante.",
    "El terreno se lee como una masa continua y no como plataformas flotantes desconectadas.",
    "Todas las relaciones territoriales obligatorias se preservan.",
    "Los invariantes de cámara se conservan en 360×640 y 360×800.",
    "Ningún OPEN o DO NOT INFER se presenta como geometría medida, orientación corroborada o hecho autorizado."
  ]
}
```

## 6. Reducción aplicada

La reducción se hizo con tres condiciones:

1. cada entrada debe tener fuente identificable;
2. cada entrada debe proteger una garantía distinta;
3. una entrada no debe ser mera reformulación de otra salvo cuando una expresa la regla y otra su criterio de validación.

Se eliminaron del alcance:

- renderer;
- pathfinding;
- tamaño de sprite;
- tamaño de tile/chunk;
- métricas de producción;
- interacción detallada;
- player proxy;
- oclusión;
- contenido botánico específico.

Estos elementos pueden permanecer abiertos en el proyecto, pero no son necesarios para esta prueba.

## 7. Corrección v2 → v2.1

La comparación entre v1 y v2 detectó dos pérdidas por sobre-reducción:

### 7.1 Jerarquía de ruta

```text
continuidad de ruta
≠
dominancia de ruta
```

MAP-001 exige que la ruta principal permanezca dominante. v2.1 recupera esta garantía en `structuralContract`, `readingPriorities` y `validationCriteria`.

### 7.2 Continuidad visual del terreno

```text
región transitable conectada
≠
terreno visualmente continuo
```

Una única región caminable podría existir sobre plataformas visualmente flotantes. v2.1 recupera la garantía `terrainReadsAsContinuousMass`.

## 8. Auditoría campo por campo

| Área | Fuente primaria | Función |
|---|---|---|
| componente transitable única | MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN | conectividad global |
| entrada inferior | MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN | puerto de entrada |
| salida superior | MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN | puerto de salida |
| bordes laterales cerrados | MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN | cierre de puertos |
| sin ramas inventadas | MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN | control de conectividad |
| dominancia de ruta | MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN + TERRITORIAL_MAPPING_PROTOCOL | jerarquía de navegación |
| terreno continuo | MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN + PILOT_ENVIRONMENT_VISUAL_CANON | massing/continuidad visual |
| secuencia territorial | TERRITORIAL_MAPPING_PROTOCOL + PILOT_ENVIRONMENT_VISUAL_CANON | orden de anclas |
| puente antes de puerta | TERRITORIAL_MAPPING_PROTOCOL + PILOT_ENVIRONMENT_VISUAL_CANON | relación territorial |
| casa a izquierda post-umbral | TERRITORIAL_MAPPING_PROTOCOL + PILOT_ENVIRONMENT_VISUAL_CANON | relación territorial |
| estero en L | PILOT_ENVIRONMENT_VISUAL_CANON | estructura visual del umbral |
| estero derecha/inferior | TERRITORIAL_MAPPING_PROTOCOL + PILOT_ENVIRONMENT_VISUAL_CANON | relación post-umbral |
| laderas laterales | TERRITORIAL_MAPPING_PROTOCOL + PILOT_ENVIRONMENT_VISUAL_CANON | contención |
| geometría del envelope OPEN | MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN + TERRITORIAL_MAPPING_PROTOCOL | incertidumbre geométrica |
| bearing/métrica OPEN | TERRITORIAL_MAPPING_PROTOCOL + PILOT_ENVIRONMENT_VISUAL_CANON | incertidumbre territorial |
| cámara OPEN parcial | TERRITORIAL_MAPPING_PROTOCOL + ENVIRONMENT_PRODUCTION_SPEC | incertidumbre de cámara |
| cardinalidad OPEN | TERRITORIAL_MAPPING_PROTOCOL | incertidumbre geográfica |

Cuando dos documentos soportan la misma garantía, se mantiene la convergencia real de fuentes. No se fuerza una fuente única artificial.

## 9. No redundancia

La distribución semántica resultante es:

```text
structuralContract
→ estructura global que debe preservarse

mandatoryRelations
→ relaciones locales/topológicas obligatorias

open
→ información todavía indeterminada

doNotInfer
→ cierres inferenciales no permitidos

prohibited
→ salidas adicionales no permitidas

artisticFreedom
→ variación autorizada que no altera contratos

cameraFormat
→ contrato de cámara/presentación

readingPriorities
→ jerarquía perceptual

validationCriteria
→ condiciones de comprobación
```

La repetición entre una garantía y su criterio de validación se considera intencional y funcional, no redundancia.

## 10. Compatibilidad con ASC v0.1

El candidato utiliza únicamente las claves admitidas por ASC v0.1:

```text
version
executionMode
testId
objective
authorizedSources
structuralContract
mandatoryRelations
open
doNotInfer
prohibited
artisticFreedom
cameraFormat
readingPriorities
validationCriteria
```

No se demostró necesidad de:

- nuevos campos;
- nueva semántica estructural;
- cambio del compilador;
- v0.2.

## 11. Estado de OPEN / DO NOT INFER / PROHIBITED

El caso MAP-001 aporta ejemplos operacionales distintos:

```text
OPEN
→ la geometría exacta del walkableEnvelope no está determinada

DO NOT INFER
→ no convertir la topología conocida en geometría medida no respaldada

PROHIBITED
→ no introducir ramas adicionales
```

Esta separación está apoyada por el experimento, pero la frontera normativa definitiva entre `doNotInfer` y `prohibited` permanece OPEN mientras la autoridad normativa no la cierre explícitamente.

## 12. Validación independiente

No apareció una necesidad técnica de introducir una operación ASC independiente denominada `Validate`.

En este experimento:

```text
contrato
→ validationCriteria
→ compilación
→ auditoría posterior
```

es suficiente para el alcance probado.

Esto no demuestra que una operación independiente nunca deba existir. Solo registra que este caso no la requiere.

## 13. Límites del resultado

Este experimento NO demuestra:

- fidelidad geométrica exacta;
- preservación de un `walkableEnvelope` materializado;
- fidelidad de un modelo generativo;
- cumplimiento de interaction slots;
- legibilidad del player proxy;
- oclusión;
- validez botánica de una escena;
- validez métrica territorial;
- renderer/pathfinding;
- suficiencia para una v0.2.

## 14. Resultado

```text
ASC CONTRACT CANDIDATE v2.1

SCHEMA COMPATIBILITY: PASS
SOURCE TRACEABILITY: PASS
NON-REDUNDANCY: PASS
TOPOLOGY REPRESENTATION: PASS
ROUTE HIERARCHY REPRESENTATION: PASS
TERRAIN CONTINUITY REPRESENTATION: PASS
TERRITORIAL RELATIONS REPRESENTATION: PASS
CAMERA CONTRACT REPRESENTATION: PASS
OPEN PRESERVATION DESIGN: PASS

GEOMETRIC FIDELITY: NOT TESTED
GENERATIVE EXECUTION: NOT TESTED
INTERACTION CONTRACT: OUT OF SCOPE

ASC v0.1 CHANGES REQUIRED: 0 demonstrated
v0.2 TRIGGER: NO
```

## 15. Decisión de iteración

Para este alcance, v2.1 se considera:

```text
CANDIDATE SEMANTICALLY STABLE
FOR TOPOLOGY + TERRITORY + CAMERA
```

No continuar refinando el JSON sin nueva evidencia.

El siguiente gate debe aportar evidencia de una clase distinta:

1. materializar la geometría del `walkableEnvelope` y probar fidelidad espacial; o
2. ejecutar el prompt ASC contra un modelo generativo y auditar preservación de topología, `OPEN`, `DO NOT INFER`, prohibiciones y relaciones obligatorias.

Ninguno de esos gates queda cerrado por este documento.

## 16. Auditoría

### AUDITORÍA

El candidato v2.1 representa sin ampliar el esquema ASC v0.1 los invariantes topológicos, territoriales y de cámara necesarios para el alcance definido.

### INCONSISTENCIAS

No se detectó una inconsistencia que obligue a cambiar ASC v0.1.

### VACÍOS / OMISIONES

Permanece sin materializar la geometría exacta del `walkableEnvelope`. La interacción detallada y la ejecución generativa permanecen fuera de esta prueba.

### REDUNDANCIAS

La redundancia material detectada durante v2 fue eliminada. Las repeticiones restantes corresponden a pares regla/criterio de validación y son intencionales.

### DECISIÓN

**NO MODIFICAR ASC v0.1.**  
**NO ABRIR v0.2.**  
**CONGELAR v2.1 COMO CANDIDATO SEMÁNTICO PARA ESTE ALCANCE HASTA NUEVA EVIDENCIA.**
