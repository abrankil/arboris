# ASC — Auditoría de resumen de estado

**Fecha:** 2026-09-18  
**Repositorio:** `abrankil/arboris`  
**Estado:** documentado  
**Ámbito:** auditoría del resumen consolidado de estado de ASC v0.1 y del experimento `MAP-001-ASC-GENERATIVE-BASELINE-001`.

## 1. Objetivo

Registrar la auditoría ASC aplicada al resumen consolidado del estado del proyecto, separando:

- hechos verificados;
- interpretación;
- estados todavía abiertos;
- afirmaciones que requerían corrección por sobrealcance.

La auditoría usa como autoridad principal `docs/ARBORIS_SCENE_COMPILER.md` y contrasta el estado técnico con:

- `docs/ASC_V0_1_EXECUTABLE_SPEC.md`;
- `docs/ASC_MAP001_CONTRACT_V2_1_EXPERIMENT_2026-09-17.md`;
- `docs/ASC_MAP001_GENERATIVE_RESULT_AUDIT_2026-09-17.md`;
- `tools/asc/compile_asc.mjs`;
- `tools/asc/compile_asc.test.mjs`.

## 2. Resultado general

```text
SOURCE TRACEABILITY: PASS
KNOWN / INTERPRETATION SEPARATION: PASS
OPEN PRESERVATION: PASS
DO NOT INFER: PASS
AUTHORITY SEPARATION: PASS
TERMINOLOGY: PASS
CURRENT GATE IDENTIFICATION: PASS
OVERCLAIM CONTROL: PASS

DECISIÓN: PASS
ASC v0.1 CHANGE REQUIRED: NO
v0.2 TRIGGER: NO
NEXT GATE: GENERATIVE EXECUTOR INSTRUMENTATION
```

## 3. Estado verificado

### 3.1 ASC v0.1

ASC v0.1 existe como compilador `compile-only` con contrato de entrada de 14 claves obligatorias.

La implementación:

- valida estructura;
- rechaza claves desconocidas;
- rechaza claves requeridas faltantes;
- rechaza versión distinta de `0.1`;
- rechaza `executionMode` distinto de `compile-only`;
- preserva secciones opcionales vacías como `NONE DECLARED`;
- produce una salida textual con orden estable.

El comportamiento esperado es `fail-closed`.

La suite `tools/asc/compile_asc.test.mjs` contiene 7 pruebas. La ejecución registrada del proyecto cerró 7/7 PASS.

La formulación correcta es:

```text
ASC v0.1 está diseñado e implementado como compilador determinista,
con determinismo verificado en las pruebas actuales.
```

No se generaliza esta evidencia a todos los contratos futuros ni a todas las versiones de runtime.

### 3.2 Contrato MAP-001 v2.1

`MAP-001-ASC-MAPPING-0021` permanece congelado como candidato semánticamente estable para:

- topología;
- relaciones territoriales;
- jerarquía de ruta;
- continuidad visual del terreno;
- cámara;
- preservación de `OPEN`;
- `DO NOT INFER`;
- `PROHIBITED`.

No se demostró necesidad de:

- nuevos campos;
- cambio de esquema;
- cambio de compilador;
- apertura de ASC v0.2.

### 3.3 Gate de compilación del baseline

El gate de compilación de `MAP-001-ASC-GENERATIVE-BASELINE-001` está cerrado.

Registro conforme:

```text
RUNTIME
Node: v24.19.0
package requirement: >=24.0.0 <25
status: CONFORMING

CONTRACT
MAP-001-ASC-MAPPING-0021
revision: v2.1
sha256:
9e8f08b576809f61816f3c6392998dd0b42a51c8382b4e77de1d454f2892ef1c

PROMPT CANÓNICO
sha256:
a2a907f60ca279e6f8ef52f0c76af549bae958c2cae004e305299f369093cf00

DETERMINISM UNDER NODE 24
PASS

CROSS-RUNTIME OUTPUT EQUIVALENCE
Node 22 ↔ Node 24: PASS
```

El prompt anterior deja de ser `PRELIMINARY` para este baseline y se considera:

```text
CANONICAL FOR BASELINE-001
```

### 3.4 Discrepancia histórica del hash del contrato

Una extracción independiente produjo anteriormente un hash distinto del contrato.

Posteriormente, el gate conforme del proyecto verificó:

```text
9e8f08b576809f61816f3c6392998dd0b42a51c8382b4e77de1d454f2892ef1c
```

Por tanto:

```text
la discrepancia anterior
≠ incertidumbre actual sobre el contrato canónico
```

La causa específica de la discrepancia anterior no quedó determinada y no debe cerrarse por inferencia.

No atribuirla sin evidencia a:

- encoding;
- newlines;
- procedimiento de extracción;
- runtime;
- mecanismo de escritura;
- otro factor técnico específico.

### 3.5 Resultado generativo 001

Existe un resultado generativo auditado contra v2.1.

Estado:

```text
DECISIÓN: PARTIAL / REVISE
```

La ejecución mostró preservación visual útil de:

- relaciones obligatorias;
- jerarquía de ruta;
- continuidad de terreno;
- estados `OPEN`;
- restricciones `DO NOT INFER`;
- `PROHIBITED`.

No permite cerrar:

- geometría real;
- transitabilidad materializada;
- fidelidad métrica;
- invariantes de viewport;
- interacción;
- navegación;
- colliders;
- reproducibilidad entre corridas o modelos.

La provenance del Resultado 001 es incompleta. No quedaron suficientemente registrados:

- `executionTestId` específico;
- prompt exacto efectivamente enviado;
- provider;
- model ID / versión;
- parámetros;
- seed, si existió;
- configuración del ejecutor.

Por ello:

```text
Resultado 001
= evidencia generativa v2.1 válida
= referencia histórica comparativa
≠ baseline reproducible
≠ repetición controlable
```

## 4. Capacidades no demostradas

En el repositorio revisado no existe evidencia de una capacidad implementada o especificada para generar:

- fichas;
- informes;
- PDFs.

ASC v0.1 termina en un prompt textual.

La especificación sí declara fuera de alcance la extracción automática desde imágenes, mapas o PDFs. Eso no equivale a una prohibición futura de exportar o producir PDFs mediante una extensión posterior.

Tampoco existe evidencia interna de que ASC implemente actualmente:

- modos `strict` / `expressive`;
- empaquetado de escritorio con Tauri;
- perfiles de generación documental;
- contratos especializados para fichas o informes.

## 5. Interpretaciones permitidas, no canónicas

### 5.1 Utilidad práctica

La arquitectura y el experimento MAP-001 apoyan que ASC puede ser útil para preservar restricciones y relaciones durante una generación.

Todavía no está demostrado que esa preservación sea reproducible:

- entre múltiples corridas;
- entre distintos modelos;
- entre distintos proveedores.

### 5.2 Extensión a otros dominios

Extender ASC a fichas, informes u otros artefactos es técnicamente plausible por la generalidad de varios principios:

- contrato explícito;
- autoridad;
- restricciones;
- estados abiertos;
- no inferencia;
- criterios de validación.

No está demostrado cuál sería la arquitectura correcta.

Podría requerir:

- un esquema nuevo;
- un perfil especializado;
- una generalización del contrato actual;
- otra solución todavía no definida.

No declarar anticipadamente que un esquema nuevo es obligatorio.

### 5.3 Prevención vs. dimensión expresiva

ASC sí formaliza mecanismos de prevención de fallas:

- `fail-closed`;
- `OPEN`;
- `DO NOT INFER`;
- prohibiciones explícitas;
- compilación determinista.

La idea de formalizar una dimensión adicional de exploración, deleite o expresividad artística permanece como hipótesis de diseño. No es una carencia demostrada por el repo y no debe convertirse en requisito sin una prueba específica.

### 5.4 Propuestas externas

Permanecen fuera del canon actual:

- modos seleccionables `strict` / `expressive`;
- empaquetado con Tauri;
- comparaciones con SceneCode, prompt contracts u otros sistemas externos.

Pueden utilizarse como investigación comparativa, no como antecedentes internos de ASC.

## 6. Distinción operativa de auditoría

Esta auditoría se realizó **según ASC**, pero no fue ejecutada por `tools/asc/compile_asc.mjs`.

La implementación ejecutable v0.1 continúa limitada a:

```text
contrato válido
→ compilación determinista
→ prompt ASC
```

La auditoría pertenece al flujo normativo posterior:

```text
contrato
→ ASC
→ prompt ASC
→ ejecutor externo
→ resultado
→ auditoría
```

No atribuir al compilador una capacidad de auditoría que todavía no implementa.

## 7. Siguiente gate

El siguiente gate ya no es la compilación.

Debe instrumentarse el ejecutor generativo y registrar, cuando la plataforma lo exponga:

- provider;
- model ID / versión;
- prompt exacto;
- tamaño / aspect ratio;
- número de imágenes;
- parámetros disponibles;
- seed, si existe;
- fecha/hora;
- identificador de respuesta o job.

Cada campo debe clasificarse como:

```text
KNOWN
NOT APPLICABLE
NOT EXPOSED
```

Después de esa ejecución podrá establecerse el primer baseline generativo reproducible.

## 8. Auditoría

### AUDITORÍA

El resumen iterado distingue correctamente entre hechos verificados e interpretación y refleja el estado actual del gate de compilación.

### INCONSISTENCIAS

Se corrigieron dos sobrealcances:

1. no se atribuye una causa específica a la discrepancia histórica del hash;
2. no se interpreta la mención normativa a PDFs como prohibición de futura generación/exportación de PDFs.

### VACÍOS / OMISIONES

Permanecen pendientes:

- instrumentación del ejecutor;
- provider;
- model ID / versión;
- parámetros de ejecución;
- ejecución generativa del baseline;
- auditoría del resultado;
- prueba posterior de reproducibilidad.

### REDUNDANCIAS

No se crea una nueva especificación de ASC ni un contrato paralelo. Este documento registra únicamente la auditoría del estado consolidado.

### DECISIÓN

```text
ASC STATE SUMMARY AUDIT
2026-09-18

PASS

ASC v0.1 CHANGE REQUIRED: NO
v0.2 TRIGGER: NO

CURRENT CLOSED GATE:
COMPILATION BASELINE-001

NEXT GATE:
GENERATIVE EXECUTOR INSTRUMENTATION
```
