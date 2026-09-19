# ASC v0.1 — Auditoría de mapeo contra upstreams

**Fecha:** 2026-09-17  
**Repositorio:** `abrankil/arboris`  
**Estado:** diagnóstico documentado; no autoriza ampliación de contrato ni implementación  
**Ámbito:** contraste del contrato ASC v0.1 contra los upstreams documentados de producción de escenarios.

## 1. Objetivo

Determinar qué información de los upstreams existentes puede entrar al contrato ASC v0.1 de forma 1:1, qué información requiere transformación semántica y qué información no pertenece a ASC.

La auditoría parte de una distinción fundamental:

```text
upstream autorizado
      ↓
transformación / normalización
      ↓
contrato ASC
      ↓
ASC v0.1
      ↓
prompt ASC
```

No se asume ACE → ASC como dependencia obligatoria. Tampoco se propone modificar el contrato v0.1 sin una necesidad validada.

## 2. Fuentes contrastadas

- `docs/ASC_V0_1_EXECUTABLE_SPEC.md`
- `docs/ENVIRONMENT_PRODUCTION_SPEC.md`
- `docs/SCENE_REFERENCE_BRIEF_TEMPLATE.md`
- `tools/asc/fixtures/minimal-contract.json`
- `docs/ASC_VOCABULARY_GUIDE.md`

La especificación v0.1 establece que ASC recibe un contrato ya clasificado y autorizado, valida su forma y compila un prompt determinista. No decide autoridad ni verdad de dominio. fileciteturn137file0

## 3. Clasificación

- **1:1:** la semántica del upstream coincide con la semántica del campo ASC y puede preservarse sin transformación material.
- **TRANSFORMACIÓN:** existe información relevante, pero debe traducirse, normalizarse, clasificarse o distribuirse entre campos ASC.
- **NO PERTENECE A ASC:** información cuya autoridad o semántica corresponde a otro dominio y que ASC no debe absorber.
- **ASC PROPIO:** campo necesario para el comportamiento del compilador y que no requiere upstream.
- **OPEN:** no hay evidencia suficiente para decidir la forma definitiva.

## 4. Matriz campo por campo

| Campo ASC v0.1 | Fuente/upstream | Clasificación | Tratamiento | Observación |
|---|---|---|---|---|
| `version` | ASC | ASC PROPIO | 1:1 | Pertenece al contrato ASC. |
| `executionMode` | ASC | ASC PROPIO | 1:1 | `compile-only` en v0.1. |
| `testId` | prueba/contexto ASC | TRANSFORMACIÓN | generar/inyectar | Identifica una prueba; no es propiedad del escenario. |
| `objective` | brief / uso previsto | TRANSFORMACIÓN | traducir | El `uso previsto` puede contribuir al objetivo, pero no es necesariamente equivalente. |
| `authorizedSources` | referencias + autoridades | TRANSFORMACIÓN | seleccionar/normalizar | `referenceId` y rol del brief no equivalen automáticamente a una fuente autorizada por ASC. |
| `structuralContract` | contratos de producción + invariantes | TRANSFORMACIÓN | traducir | Debe contener invariantes que ASC deba preservar, no todo el contenido del mapa. |
| `mandatoryRelations` | Navigation / Camera / Interaction + requisitos de escena | TRANSFORMACIÓN | extraer relaciones | Es el principal punto de convergencia de invariantes upstream. |
| `open` | `OPEN` upstream | 1:1 cuando semántica coincide | preservar | No cerrar ni convertir silenciosamente en otra categoría. |
| `doNotInfer` | vacíos que no pueden completarse | TRANSFORMACIÓN | explicitar | `OPEN` no implica automáticamente prohibición; requiere interpretación contractual. |
| `prohibited` | elementos prohibidos/restricciones | TRANSFORMACIÓN | clasificar | Debe distinguirse de `doNotInfer`. |
| `artisticFreedom` | decisiones de dirección de arte | TRANSFORMACIÓN | trasladar solo autorizaciones | No debe convertir hipótesis territoriales en libertad artística. |
| `cameraFormat` | Camera Contract / producción | TRANSFORMACIÓN | normalizar | Orientación, viewport y políticas pueden distribuirse aquí o en invariantes según el contrato definitivo. |
| `readingPriorities` | brief / prioridades de presentación | TRANSFORMACIÓN | traducir | Es prioridad de compilación/presentación, no autoridad científica. |
| `validationCriteria` | criterios de aceptación/prueba | TRANSFORMACIÓN | traducir | Deben expresar criterios verificables para la salida ASC. |

## 5. Upstream ambiental

`SCENE_REFERENCE_BRIEF_TEMPLATE.md` separa deliberadamente referencias, evidencia real, interpretaciones, decisiones de dirección de arte, traducción a pixel art e incertidumbre. También distingue `OBSERVED`, `RECURRENT`, `APPROVED_ART_RULE` y `OPEN`. fileciteturn141file0

Por ello no debe hacerse:

```text
brief completo → ASC
```

La transformación correcta es conceptualmente:

```text
EVIDENCIA / DECISIONES AUTORIZADAS
              ↓
        clasificación
              ↓
        contrato ASC
```

Una interpretación plausible no adquiere autoridad solo por aparecer en el brief. Una decisión de arte puede convertirse en instrucción ASC únicamente cuando su estatus autoriza esa transferencia.

## 6. Upstream de producción espacial

`ENVIRONMENT_PRODUCTION_SPEC.md` separa:

- map data;
- camera / interaction contracts;
- world art;
- distant art;
- overlays.

También establece que navegación, cámara e interacción se expresan mediante contratos y que el blockout lógico debe conservarse independientemente del arte. fileciteturn138file0

Esto implica que ASC no debería recibir el mapa como una imagen ni como una estructura interna del motor. Debe recibir las restricciones/invariantes que realmente necesita preservar durante la compilación.

Ejemplos conceptuales:

```text
rotationPolicy: disabled
→ cameraFormat / structuralContract

zoom definitivo: OPEN
→ open

screen_up = interior / cordillera / progresión
→ mandatoryRelations

walkableEnvelope debe conservarse
→ structuralContract / mandatoryRelations
```

La asignación exacta entre campos queda abierta hasta disponer de un caso real y de la forma definitiva del contrato.

## 7. Lo que no pertenece a ASC

No debe trasladarse al contrato ASC como autoridad propia:

- conocimiento botánico canónico;
- identificaciones taxonómicas;
- caracteres utilizados por ACE;
- thresholds o reglas internas de identificación;
- IDs internos de ACE;
- estructuras privadas de almacenamiento de Árboris;
- decisiones sobre suficiencia científica de evidencia;
- verdad territorial no autorizada;
- implementación específica del renderer;
- detalles internos de un proveedor generativo.

ASC puede recibir una afirmación ya autorizada cuando sea necesaria para la escena, pero no se convierte por ello en autoridad del dominio.

## 8. El fixture v0.1 y su límite

`tools/asc/fixtures/minimal-contract.json` contiene un contrato ya preparado con `authorizedSources`, `structuralContract`, `mandatoryRelations`, `open`, `doNotInfer`, `prohibited`, prioridades y criterios. fileciteturn142file0

El fixture demuestra el comportamiento del compilador, pero no demuestra una transformación upstream → contrato ASC. En consecuencia, no debe interpretarse como ejemplo de un productor real.

## 9. Hallazgo principal

El gap real no es la ausencia de campos en el contrato v0.1.

El gap es la ausencia de una **transformación explícita y validada** entre los contratos/briefs upstream y el contrato de entrada ASC.

```text
UPSTREAMS
  │
  ├── environmental brief
  ├── navigation contract
  ├── camera contract
  ├── interaction/learning contract
  └── otras autoridades autorizadas
          │
          ▼
   [TRANSFORMACIÓN]
          │
          ▼
     ASC CONTRACT
          │
          ▼
       ASC v0.1
```

No se debe implementar esta transformación todavía como una inferencia automática general. Primero debe validarse contra un caso real.

## 10. MAP-001

Se intentó localizar evidencia ejecutable/documental específica de `MAP-001` y de archivos denominados `Navigation Contract` en el repositorio durante esta auditoría. No se obtuvo un resultado suficiente para construir una matriz de caso real campo-a-campo.

Por tanto, **no se inventa un mapeo MAP-001**. La matriz anterior permanece en nivel de arquitectura contractual y debe ser refinada cuando exista un paquete real de escena con contratos concretos.

## 11. Decisiones que permanecen OPEN

- forma definitiva del contrato ASC;
- existencia y responsabilidad de un adaptador upstream → ASC;
- si el adaptador debe ser parte de ASC o de un productor externo;
- semántica exacta de `mandatoryRelations`;
- frontera definitiva entre `doNotInfer` y `prohibited`;
- representación estructurada futura de relaciones;
- versión del contrato necesaria para un caso real.

## 12. Resultado

```text
1:1
- version
- executionMode
- OPEN cuando la semántica upstream coincide exactamente

TRANSFORMACIÓN
- objective
- authorizedSources
- structuralContract
- mandatoryRelations
- doNotInfer
- prohibited
- artisticFreedom
- cameraFormat
- readingPriorities
- validationCriteria
- testId (según contexto)

NO PERTENECE A ASC
- autoridad científica/botánica
- conocimiento interno de ACE
- estructuras privadas de Árboris
- decisiones de suficiencia de evidencia
- renderer/proveedor como autoridad de dominio

GAP PRINCIPAL
- transformación upstream → contrato ASC no está implementada ni demostrada

IMPLEMENTACIÓN REALIZADA
- 0 cambios de código
- 0 cambios de contrato
- 0 cambios en ACE
```

## 13. Auditoría

### AUDITORÍA

El contrato v0.1 fue contrastado campo por campo contra los upstreams documentados disponibles. Se distinguió preservación 1:1, transformación semántica y exclusión de información de dominio.

### INCONSISTENCIAS

No se detectó contradicción que obligue a modificar v0.1. El contrato actual es compatible con el principio de recibir una entrada ya autorizada.

### VACÍOS / OMISIONES

Falta un caso real de producción que permita verificar el mapeo completo. No se encontró evidencia suficiente para construirlo artificialmente.

### REDUNDANCIAS

No se recomienda duplicar los contratos upstream dentro de ASC. El contrato ASC debe contener únicamente la representación necesaria para sus propias garantías de compilación.

### DECISIÓN DE ITERACIÓN

**NO IMPLEMENTAR.** El siguiente avance debe ser documental/experimental: obtener un paquete real de escena y ejecutar manualmente el mapeo contra un contrato ASC v0.1, registrando pérdidas, ambigüedades y transformaciones necesarias. Solo después se podrá determinar si el esquema v0.1 necesita modificación.