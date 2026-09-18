# ASC v0.1 — contrato de implementación ejecutable

**Estado:** especificación de implementación v0.1  
**Autoridad superior:** [`ARBORIS_SCENE_COMPILER.md`](ARBORIS_SCENE_COMPILER.md)  
**Ámbito:** primer compilador determinista `compile-only` de ASC.

## 1. Propósito

ASC v0.1 convierte un **contrato de entrada ya clasificado y autorizado** en un `prompt ASC` textual reproducible.

Su objetivo es volver ejecutable la parte mínima del proceso que hoy puede automatizarse sin transferir al compilador decisiones que pertenecen a las autoridades de dominio.

```text
autoridad + evidencia válidas
→ contrato de entrada preparado
→ ASC v0.1
→ prompt ASC determinista
```

ASC v0.1 **no decide la verdad del proyecto**, no clasifica evidencia por cuenta propia y no ejecuta un modelo generativo.

## 2. Alcance v0.1

ASC v0.1 implementa únicamente:

- lectura de un contrato JSON explícito;
- validación estructural mínima del contrato;
- preservación literal de `OPEN`, prohibiciones y restricciones;
- compilación determinista a texto;
- salida por `stdout` o archivo;
- errores explícitos cuando el contrato no cumple el esquema v0.1.

Modo admitido en v0.1:

```text
compile-only
```

`compile-and-execute` permanece fuera del alcance de esta versión.

## 3. Fuera de alcance

ASC v0.1 no implementa:

- resolución automática de autoridades de dominio;
- evaluación de suficiencia de evidencia;
- extracción automática desde imágenes, mapas o PDFs;
- cierre de estados `OPEN`;
- ejecución de modelos generativos;
- optimización de prompts por proveedor/modelo;
- métricas automáticas de fidelidad;
- integración con renderer o blockout;
- persistencia/versionado específico de resultados ASC;
- formato serializado definitivo de contratos ASC.

La estructura JSON de v0.1 es un **contrato de implementación provisional y versionado**, no el formato serializado definitivo del sistema.

## 4. Contrato de entrada v0.1

Objeto JSON con las siguientes claves de nivel superior:

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

Reglas:

- `version` debe ser `"0.1"`;
- `executionMode` debe ser `"compile-only"`;
- `testId` y `objective` son strings no vacíos;
- las demás claves son arrays de strings;
- `authorizedSources`, `structuralContract` y `validationCriteria` deben contener al menos un elemento;
- arrays como `open`, `doNotInfer`, `prohibited`, `artisticFreedom`, `cameraFormat`, `readingPriorities` y `mandatoryRelations` pueden estar vacíos cuando realmente no apliquen;
- claves desconocidas se rechazan para evitar que información no compilada pase silenciosamente inadvertida.

El compilador valida **forma**, no autoridad ni verdad. Que un string aparezca en `authorizedSources` significa que el contrato de entrada lo declaró autorizado; ASC v0.1 no verifica por sí mismo esa autorización.

## 5. Salida determinista

La salida usa este orden estable:

```text
[ASC VERSION]
[TEST ID]
[OBJECTIVE]
[EXECUTION MODE]
[AUTHORIZED INPUT / SOURCES]
[STRUCTURAL CONTRACT]
[MANDATORY RELATIONS]
[OPEN]
[DO NOT INFER]
[PROHIBITED]
[AUTHORIZED ARTISTIC FREEDOM]
[CAMERA / FORMAT]
[READING PRIORITIES]
[VALIDATION CRITERIA]
```

Los arrays se emiten como listas con `- `. Si un array opcional está vacío, la sección se conserva y muestra:

```text
- NONE DECLARED
```

Esto evita que la ausencia de una sección sea interpretada como permiso implícito para inferir.

## 6. Propiedades obligatorias

### Determinismo

El mismo contrato JSON válido debe producir exactamente el mismo prompt ASC.

### Fail closed

Un contrato inválido debe fallar con error; no debe repararse, completar ni normalizarse silenciosamente.

### Preservación de OPEN

Los elementos declarados en `open` deben aparecer explícitamente en `[OPEN]` y no pueden migrarse a otra sección por inferencia del compilador.

### No invención

El compilador solo emite información presente en las claves admitidas del contrato. No añade hechos territoriales, botánicos, espaciales ni artísticos.

### Separación compilador / ejecutor

La salida termina en un `prompt ASC`. v0.1 no llama a ningún modelo generativo.

## 7. Ubicación en el repositorio

Implementación mínima:

```text
tools/asc/
├── README.md
├── compile_asc.mjs
├── compile_asc.test.mjs
└── fixtures/
    └── minimal-contract.json
```

No se crea todavía un árbol superior `asc/`, ni directorios `schemas/`, `providers/`, `results/` o `renderer/`. Esas capas se incorporarán únicamente cuando exista una necesidad validada.

## 8. Uso previsto

Desde la raíz del repositorio:

```bash
npm run compile:asc -- tools/asc/fixtures/minimal-contract.json
```

Para escribir a archivo:

```bash
npm run compile:asc -- tools/asc/fixtures/minimal-contract.json --output build/asc-prompt.txt
```

Validación:

```bash
npm run test:asc
```

## 9. Gate para una v0.2

Antes de ampliar el compilador debe existir una prueba concreta que justifique el cambio.

Candidatos posibles, todavía `OPEN`:

- esquema serializado más formal;
- derivación asistida de tratamientos desde estados de dominio;
- perfiles por proveedor;
- `compile-and-execute`;
- persistencia de pruebas/resultados;
- métricas automáticas.

Ninguno de estos elementos forma parte de v0.1 por aparecer en esta lista.

Este documento permanece congelado como especificación de ASC v0.1. Existe una extensión aditiva y retrocompatible en [`ASC_V0_2_EXECUTABLE_SPEC.md`](ASC_V0_2_EXECUTABLE_SPEC.md); ningún contrato `version: "0.1"` existente requiere cambios.

## 10. Auditoría de esta especificación

### AUDITORÍA

La especificación reduce v0.1 al tramo que puede automatizarse sin sustituir la autoridad de dominio: validar estructura y compilar texto de forma determinista.

### INCONSISTENCIAS

No introduce una nueva fuente de verdad. `ARBORIS_SCENE_COMPILER.md` continúa como autoridad normativa y este documento solo especifica una implementación limitada.

### VACÍOS / OMISIONES

El formato serializado definitivo, ejecución generativa, providers, métricas e integración con producción permanecen `OPEN`.

### REDUNDANCIAS

Existe repetición intencional de términos de ASC para hacer verificable la implementación. Las definiciones normativas siguen viviendo en `ARBORIS_SCENE_COMPILER.md`; no deben duplicarse aquí como autoridad paralela.
