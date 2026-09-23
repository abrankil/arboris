# ASC — R5 Claim-Level Provenance Contrast

**ID:** ASC-R5-CLAIM-PROVENANCE-CONTRAST-001  
**Fecha:** 2026-09-22  
**Estado:** DESIGN CANDIDATE / NOT EXECUTED  
**Naturaleza:** experimento sintético autónomo, no normativo  
**Deriva de:** residuo documentado de R4 sobre procedencia a nivel de elemento/claim  
**No es:** réplica exacta de R4

## 1. Pregunta experimental

¿Puede preservarse mejor el estatus epistemológico de claims individuales durante un handoff cuando existe un binding explícito `claim → status`, frente a una condición donde las mismas categorías están disponibles solo a nivel agregado del componente?

La hipótesis se limita a este contraste. No valida `CLAIM` como unidad epistemológica normativa de ASC ni generaliza automáticamente Provenance Preservation.

## 2. Fuente congelada

Fuente sintética:

`experiments/asc-r5-claim-provenance/R5_SOURCE_001.svg`

SHA-256:

`f73dd125a91a17d0034752ecfd8edacdbc44e47394273ad1c1fa9e636a39bd87`

La fuente contiene únicamente dos círculos delineados, de distinto radio, sobre fondo blanco. No contiene texto, escala física, unidades, función, iluminación declarada ni metadata funcional.

La misma secuencia de bytes debe usarse en ambas condiciones.

## 3. Claims congelados

### Claims primarios

```text
C1: Hay dos elementos circulares.
C2: El elemento izquierdo es mayor que el derecho.
C3: Los elementos emiten luz.
```

Clave experimental:

```text
C1 → DERIVED_VISUAL_OBSERVATION
C2 → DERIVED_RELATIVE_OBSERVATION
C3 → INTERPRETATION_HYPOTHESIS
```

El wording primario evita marcadores léxicos como "parece", "posiblemente" o "podría" que revelarían por sí solos el estatus del claim.

### Sentinelas secundarios

```text
C4: Diámetro aproximado: 40 cm.
C5: La función exacta no está establecida.
```

Clave experimental:

```text
C4 → UNSUPPORTED_QUANTIFICATION
C5 → OPEN_NOT_ESTABLISHED
```

C4 y C5 se conservan como sentinelas secundarios. No participan del veredicto primario de R5 porque introducen dimensiones adicionales de soporte/precisión y preservación de OPEN.

## 4. Variable independiente

Única variable material prevista:

`EXPLICIT_CLAIM_STATUS_BINDING`

### Condición de control

El paquete contiene:

- misma fuente;
- mismos claims C1–C5;
- mismo vocabulario de cinco estados;
- indicación de que esos estados están presentes en el componente;
- **sin mapping explícito entre claim y estado**.

### Condición de tratamiento

El paquete contiene:

- misma fuente;
- mismos claims C1–C5;
- mismo vocabulario de cinco estados;
- binding explícito:
  - C1 → DERIVED_VISUAL_OBSERVATION
  - C2 → DERIVED_RELATIVE_OBSERVATION
  - C3 → INTERPRETATION_HYPOTHESIS
  - C4 → UNSUPPORTED_QUANTIFICATION
  - C5 → OPEN_NOT_ESTABLISHED

No debe cambiar ninguna otra variable material entre condiciones.

## 5. Handoff

Ambas condiciones deben pasar por la misma tarea downstream, usando el mismo modelo/versión o agente, mismo formato de salida y contextos frescos separados.

Instrucción funcional del productor:

> Convertir el paquete recibido en una ficha compacta de referencia. Conservar todos los claims suministrados y su información epistemológica disponible. No añadir claims materiales, no resolver incertidumbres y no autoasignar PASS/PARTIAL/FAIL.

El productor no recibe un veredicto esperado.

La relación de este experimento con `tools/asc/compile_asc.mjs` permanece `OPEN`; R5 no requiere modificar ni usar el compilador v0.1 para demostrar este contraste.

## 6. Auditoría ciega

Los outputs deben identificarse como X e Y para la auditoría. El auditor evalúa primero cada output por separado contra la clave experimental y solo después se revela cuál corresponde a control y cuál a tratamiento.

No se permite usar el lenguaje del claim como sustituto de un binding ausente.

Para cada claim primario se registra uno de estos resultados experimentales:

```text
PRESERVED
el estatus sustentado por la clave sigue recuperable sin elevación.

AMBIGUOUS
el estatus no puede determinarse con suficiente claridad.

ELEVATED
el claim se presenta con autoridad superior a la sustentada por la clave.

LOST
el claim o su estatus deja de ser recuperable.

INVENTED
aparece un claim material no autorizado vinculado al componente.
```

Estas etiquetas son instrumentación experimental de R5, no vocabulario normativo de ASC.

C4 y C5 se auditan como observaciones secundarias, sin participar del veredicto primario.

## 7. Interpretación del contraste

```text
SUPPORTIVE EVIDENCE
el tratamiento preserva mejor C1–C3 que el control,
sin introducir un fallo material nuevo.

NO MATERIAL DIFFERENCE
ambas condiciones muestran comportamiento equivalente
en C1–C3.

COUNTEREVIDENCE
el binding claim-level no mejora la preservación,
o introduce pérdida/elevación material.

INVALID
además del binding cambió otra variable material,
la fuente no fue idéntica,
el productor recibió condiciones diferentes,
o la auditoría dejó de ser ciega antes de cerrar los resultados.
```

No se establece un umbral numérico de generalización.

## 8. Controles de contaminación

Deben preservarse:

- fuente idéntica por hash;
- claims idénticos por texto;
- mismo vocabulario de estados;
- misma tarea downstream;
- mismo formato de salida;
- mismo modelo/versión o agente;
- contextos frescos separados;
- prompts exactos preservados;
- metadata de ejecución registrada;
- productor y auditor como roles separados;
- no autocertificación del productor.

La exigencia de agentes físicos distintos permanece `OPEN`; lo obligatorio aquí es la separación de roles y del momento de evaluación.

## 9. Fuera de alcance primario

No son objeto principal de R5:

- Precision Provenance;
- False Precision como regla independiente;
- Visual Authority Amplification;
- Representational Authority;
- validación general de Epistemic Authority Preservation;
- integración con ASC v0.1;
- definición de una arquitectura general de claims.

C4/C5 pueden revelar residuos relacionados, pero no deben usarse para cerrar esas hipótesis.

## 10. Criterios de invalidez antes de ejecución

R5 no debe ejecutarse si:

- el hash de la fuente no coincide;
- control y tratamiento difieren en claims, wording, vocabulario, tarea o formato;
- el tratamiento recibe correcciones adicionales no presentes en control;
- el auditor conoce la condición antes de cerrar la evaluación individual;
- se modifica el output para corregirlo antes de auditarlo;
- se introduce una regla nueva durante la ejecución.

## 11. Estado

```text
R4:
CLOSED

R5:
DESIGN CANDIDATE
NOT EXECUTED

CLAIM:
EXPERIMENTAL UNIT CANDIDATE

PRIMARY CLAIMS:
C1 / C2 / C3

SECONDARY SENTINELS:
C4 / C5

INDEPENDENT VARIABLE:
EXPLICIT CLAIM ↔ STATUS BINDING

SOURCE:
FROZEN BY SHA-256

ASC v0.1:
UNCHANGED

GENERALIZATION:
OPEN

NEXT:
ADVERSARIAL AUDIT OF THIS FROZEN DESIGN
```
