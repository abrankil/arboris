# Árboris — Prueba piloto: observar → reconocer → contextualizar

**Estado:** prueba de hipótesis no normativa  
**Gate:** OBSERVE-RECOGNIZE-CONTEXTUALIZE-PILOT-001  
**Fecha:** 23 septiembre 2026  
**Hipótesis:** el aprendizaje puede progresar desde reconocer caracteres perceptibles hacia comprender relaciones ecológicas y territoriales, sin romper el loop casual ni introducir información no respaldada.

## 1. Autoridad y límites

Esta prueba usa como autoridad vigente:

- `PRODUCT_VISION.md`;
- `PRODUCT_PRINCIPLES.md`;
- `GAMEPLAY_SYSTEMS_DIRECTION.md`;
- `PILOT_1_0_EXPLORATION_COMPANION.md`;
- datos botánicos canónicos del piloto.

La comparación previa con `Itrofill / Itxofill Mogen` funciona únicamente como lente crítica. No autoriza terminología mapuche en la UX ni crea requisitos nuevos.

El loop normativo permanece:

```text
explorar
→ observar
→ interpretar
→ desbloquear
```

La hipótesis probada aquí es una progresión educativa paralela:

```text
OBSERVAR
→ RECONOCER
→ CONTEXTUALIZAR
```

## 2. Hallazgo previo de datos

La visión de producto exige preservar y utilizar, cuando corresponda, hábitat, microhábitat, contexto geográfico y variables ambientales.

Sin embargo, en el estado actual del piloto:

- `data/botanical/species.json` no contiene campos específicos de hábitat, distribución, altitud o relaciones ecológicas;
- `data/botanical/contexts.json` contiene actualmente un único contexto: `hojas_de_sombra`;
- las fichas derivadas revisadas de Peumo, Litre y Quillay no agregan campos propios de hábitat/ecología fuera de lo ya derivado del dataset actual.

Por tanto:

> la arquitectura y la visión están preparadas para contextualización, pero el dataset canónico actual no soporta todavía una contextualización ecológica específica y sistemática para las seis especies.

Esto es un vacío de datos/autoridad, no un defecto del loop.

## 3. Caso A — Peumo (SP-001)

### 3.1 Observar

El piloto puede pedir evidencia foliar segura y observable, por ejemplo:

- CH-003 margen entero;
- CH-010 ausencia de reborde marginal continuo;
- CH-028 ondulación del margen.

Estas observaciones pertenecen al contrato botánico y pueden producir evidencia.

### 3.2 Reconocer

La identificación puede usar estos caracteres dentro de ACE y del protocolo del piloto.

El usuario puede aprender que “margen entero” y “margen ondulado” no son la misma propiedad.

### 3.3 Contextualizar

Una capa posterior podría explicar dónde suele encontrarse Peumo o qué condiciones ecológicas son relevantes **solo si esa información existe con procedencia autorizada**.

Con el dataset actual, no hay suficiente autoridad canónica para generar automáticamente una explicación específica de hábitat desde los JSON revisados.

Resultado:

```text
OBSERVAR: PASS
RECONOCER: PASS
CONTEXTUALIZAR: BLOCKED BY DATA AUTHORITY
```

No debe rellenarse el vacío con conocimiento general del modelo.

## 4. Caso B — Litre (SP-002)

### 4.1 Observar

El Litre permite probar la interacción entre aprendizaje y seguridad.

El dataset canónico registra múltiples caracteres con `interaction_safety = precaucion` y CH-015 con `interaction_safety = no_provocar`.

Para aroma:

> nunca pedir frotar, romper o triturar Litre.

### 4.2 Reconocer

El sistema puede enseñar diferencias visuales seguras —por ejemplo CH-010, reborde marginal conectado a nervaduras secundarias— sin requerir interacción física riesgosa.

### 4.3 Contextualizar

La contextualización no puede convertirse en una excusa para solicitar mayor contacto con la planta.

Regla demostrada:

```text
CONTEXTUAL LEARNING
MUST NOT OVERRIDE
SAFETY CONSTRAINTS
```

Una futura explicación territorial/ecológica puede ampliar conocimiento, pero la seguridad mantiene precedencia.

Resultado:

```text
OBSERVAR: PASS
RECONOCER: PASS
CONTEXTUALIZAR: CONCEPTUALLY COMPATIBLE
SPECIES-SPECIFIC ECOLOGICAL CONTENT: CURRENTLY UNDER-SOURCED
SAFETY REGRESSION: PASS
```

## 5. Caso C — Quillay (SP-006)

### 5.1 Observar

CH-003 admite dos estados esperados:

```text
entero
dentado
```

con variabilidad alta.

### 5.2 Reconocer

Este caso demuestra que reconocer una especie no significa aprender una apariencia única.

La UX debe preservar que un rasgo puede variar dentro de la misma especie.

### 5.3 Contextualizar

La contextualización puede ser valiosa para enseñar que variación morfológica y contexto ambiental pueden relacionarse, pero esa relación concreta no debe inventarse.

El Principio 11 ya exige conservar variables como exposición, sombra, altitud y microhábitat cuando estén disponibles.

Actualmente `contexts.json` sólo registra `hojas_de_sombra`, y no existe una matriz canónica suficiente para explicar causalmente la variación de CH-003 en Quillay.

Resultado:

```text
OBSERVAR: PASS
RECONOCER VARIATION: PASS
CONTEXTUALIZE VARIATION CAUSALLY: BLOCKED
```

El valor educativo existe; la explicación causal específica todavía no.

## 6. Prueba contra el loop casual

La hipótesis no requiere insertar una lección ecológica antes del desbloqueo.

La secuencia segura es:

```text
MISIÓN
→ OBSERVACIÓN
→ EVIDENCIA
→ IDENTIFICACIÓN / DESBLOQUEO
→ CONTEXTO OPCIONAL POSTERIOR
```

Esto mantiene:

- claridad de misión;
- velocidad del loop;
- autoridad de evidencia;
- separación entre resultado de identificación y aprendizaje adicional.

La contextualización también puede aparecer durante el trayecto como pista de hábitat o actividad ligera, siempre que esté respaldada y nunca cuente como evidencia confirmatoria.

## 7. Formas de contextualización compatibles

Tres formas sobreviven la prueba:

### A. Post-desbloqueo

Después de una identificación suficientemente apoyada:

> “Ya sabes qué mirar para reconocerla. Ahora observa en qué tipo de lugar la encontraste.”

Ventaja: no contamina la adquisición del carácter.

### B. Durante exploración

Pistas ecológicas o territoriales pueden orientar atención sin confirmar presencia.

Esto ya está autorizado por `PILOT_1_0_EXPLORATION_COMPANION.md`.

### C. Ficha de especie

La ficha puede relacionar caracteres con hábitat, fenología y contexto cuando existan datos canónicos suficientes.

Esta es la ubicación con menor riesgo de sobrecargar el loop principal.

## 8. Restricciones derivadas

```text
CONTEXT ≠ IDENTIFICATION EVIDENCE UNLESS AUTHORIZED
CONTEXTUAL STORY ≠ CANONICAL ECOLOGY
HABITAT CLUE ≠ SPECIES CONFIRMATION
POST-UNLOCK LEARNING ≠ RETROACTIVE EVIDENCE
ECOLOGICAL CAUSALITY MUST BE SOURCED
SAFETY OVERRIDES CONTEXTUAL LEARNING
```

## 9. AUDITORÍA

La hipótesis `OBSERVAR → RECONOCER → CONTEXTUALIZAR` es compatible con la visión y los principios del producto.

No rompe el loop casual si `CONTEXTUALIZAR` se trata como una capa opcional/posterior o como contexto no confirmatorio durante exploración.

El principal bloqueo actual no es conceptual ni arquitectónico: es de **cobertura y autoridad de datos ecológicos específicos por especie**.

## 10. INCONSISTENCIAS

Se detecta una tensión real entre:

```text
PRODUCT_VISION / PRINCIPLES
→ esperan hábitat, microhábitat y contexto ecológico
```

y:

```text
CURRENT PILOT CANONICAL DATA
→ cobertura contextual muy limitada
```

No es contradicción normativa; es una brecha de implementación/datos todavía no resuelta.

## 11. VACÍOS / OMISIONES

Quedan abiertos:

- qué campos ecológicos deben formar parte del Master Botánico;
- qué fuentes autorizadas deben respaldarlos;
- si se necesitan relaciones especie–hábitat normalizadas;
- cómo representar microhábitat;
- cómo distinguir contexto observado del sitio vs. conocimiento canónico de especie;
- cómo enseñar correlaciones sin convertirlas en causalidades falsas;
- qué contenido contextual entra en Piloto 1.0 y qué queda posterior.

## 12. REDUNDANCIAS

No se justifica crear:

- un motor de contextualización;
- una entidad `Itrofill`;
- una segunda ficha ecológica paralela;
- un principio 16;
- una nueva capa de evidencia.

La primera necesidad es completar o verificar datos dentro de las autoridades existentes.

## 13. Gate

```text
OBSERVE → RECOGNIZE → CONTEXTUALIZE: PARTIAL PASS
FIT WITH CASUAL LOOP: PASS
FIT WITH SCIENTIFIC PRINCIPLES: PASS
PEUMO TEST: PARTIAL — CONTEXT DATA BLOCK
LITRE TEST: PASS WITH SAFETY CONSTRAINT
QUILLAY VARIATION TEST: PARTIAL — CAUSAL CONTEXT DATA BLOCK
NEW ARCHITECTURE REQUIRED: NO
NEW PRINCIPLE REQUIRED: NO
ECOLOGICAL DATA READINESS: INSUFFICIENT FOR SYSTEMATIC SPECIES-SPECIFIC UX
```

## 14. Próximo gate

Antes de diseñar una UX contextual completa, corresponde auditar la **cobertura ecológica real del Master Botánico 2.0 y sus derivados**.

Pregunta de siguiente gate:

> ¿La información de hábitat, distribución, altitud, fenología, microhábitat y relaciones ecológicas ya existe en la fuente editorial y se está perdiendo en la derivación, o debe ser incorporada mediante una ampliación botánica con fuentes autorizadas?

Hasta resolver esa pregunta, la contextualización puede mantenerse como dirección de producto, pero no debe poblarse con inferencias del modelo.
