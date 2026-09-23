# Árboris — Andamiaje perceptivo para observación botánica

**Estado:** normativo  
**Versión:** 1.0 — derivada de R4 validada en alcance conceptual/UX  
**Ámbito:** UX de observación y aprendizaje; no modifica autoridad botánica, ACE ni modelo de datos.

## 1. Propósito

Este documento especifica un patrón de interacción para ayudar a una persona a observar caracteres botánicos de forma útil para la identificación y, al mismo tiempo, favorecer aprendizaje perceptivo.

El patrón no decide qué especie es una observación, no selecciona por sí mismo qué carácter necesita la identificación y no redefine qué cuenta como evidencia válida.

## 2. Separación de autoridad

La distribución de responsabilidades es:

```text
IDENTIFICATION AUTHORITY
→ decide qué información se necesita

CHARACTER / EVIDENCE AUTHORITY
→ decide qué cuenta como observación válida

ACQUISITION CONTEXT
→ determina si la evidencia requerida está disponible ahora

PERCEPTUAL SCAFFOLD
→ ayuda a la persona a observar sin alterar autoridad ni resultado esperado

POST-EVIDENCE LEARNING
→ nombra, explica, compara y favorece transferencia
```

El scaffold no adquiere autoridad científica por estar más cerca de la interfaz.

## 3. Flujo científico protegido

```text
requested character
→ validity requirements
→ required evidence available?
→ observable?
→ resolvable?
→ OBSERVED(canonical_state)
   or NOT_OBSERVABLE
   or UNRESOLVED({contributing_causes})
→ CharacterEvidence cuando corresponda
```

### 3.1 Disponibilidad

Que un carácter sea necesario no implica que la evidencia requerida esté disponible.

Ejemplo: para disposición foliar puede ser necesario observar varios nudos de una misma ramilla. Una fotografía de una hoja aislada no satisface ese requisito.

### 3.2 Observabilidad

La evidencia puede contener la estructura requerida y aun así no permitir observarla adecuadamente, por ejemplo por desenfoque, daño, oclusión o resolución insuficiente.

### 3.3 Resolubilidad

Que un carácter sea observable no implica que pueda asignarse responsablemente un estado canónico.

Si no puede resolverse, debe preservarse la no-resolución en lugar de forzar una categoría.

## 4. No-resolución y causalidad

Una no-resolución puede tener una o varias causas contribuyentes.

Conceptualmente pueden existir causas relacionadas con:

- observador;
- evidencia;
- contrato/categorización;
- causa todavía no determinada.

Reglas:

```text
MULTIPLE_CAUSES_ALLOWED
NO_PRIMARY_CAUSE_REQUIRED_WITHOUT_SUPPORT
NO_CONTRIBUTING_CAUSE_MAY_BE_INVENTED
```

La representación técnica definitiva de estas causas permanece OPEN.

## 5. Andamiaje perceptivo durante adquisición

Durante la adquisición, Árboris puede:

- orientar la atención hacia la estructura relevante;
- explicar condiciones necesarias para observarla;
- aportar conocimiento conceptual neutral cuando sea necesario para discriminar;
- indicar por qué una evidencia es inválida o insuficiente;
- solicitar otra vista o nueva evidencia cuando corresponda.

Debe respetar simultáneamente:

```text
AUTHORIZED_GUIDANCE_SOURCE
STATE_NEUTRAL_GUIDANCE_SELECTION
SAFETY
EVIDENCE_VALIDITY
NO_EXPECTED_STATE_STEERING
NO_SILENT_NORMALIZATION
NO_FORCED_RESOLUTION
```

## 6. Neutralidad de la guía

La guía debe derivarse del contrato del carácter y de requisitos reales de observación.

No debe derivarse del estado esperado para una especie candidata.

Además, usar una fuente autorizada no basta: la selección de los aspectos perceptivos que se destacan también debe ser neutral respecto de los estados candidatos.

La guía puede adaptarse por calidad, daño, seguridad, observabilidad o validez.

No puede adaptarse para conducir al usuario hacia un estado que favorezca a un candidato.

La regla aplica a texto, imágenes, ejemplos, comparaciones y cualquier otro soporte presentado durante adquisición.

## 7. Lenguaje perceptivo y estados canónicos

```text
PERCEPTUAL_DESCRIPTION ≠ CANONICAL_STATE
```

El lenguaje cotidiano puede ayudar a expresar lo percibido, pero no debe convertirse silenciosamente en un estado botánico.

La evidencia categórica debe resolverse mediante los estados autorizados por el contrato correspondiente.

## 8. Ayuda conceptual

Árboris puede enseñar las distinciones necesarias para realizar una observación válida.

```text
NECESSARY_CONCEPTUAL_GUIDANCE = ALLOWED
EXPECTED_TARGET_STATE_DISCLOSURE = FORBIDDEN
```

La finalidad es enseñar lo necesario para observar sin enseñar qué resultado debería producir la observación activa.

## 9. Reintentos y abstención

Los reintentos pueden utilizarse para mejorar observabilidad o calidad de evidencia.

No deben utilizarse para perseguir un estado deseado.

```text
RETRY MAY IMPROVE EVIDENCE
RETRY MUST NOT PURSUE A DESIRED STATE
```

Una interacción puede terminar legítimamente en `NOT_OBSERVABLE` o `UNRESOLVED`.

## 10. Requisitos no reducibles y presentación adaptable

Seguridad, observabilidad, requisitos de evidencia, reglas específicas del carácter y prohibiciones de inferencia no desaparecen por experiencia del usuario.

```text
NON_REDUCIBLE_REQUIREMENT ≠ NON_REDUCIBLE_UI
```

La interfaz puede simplificarse o adaptarse siempre que el requisito siga cumpliéndose.

El nivel de ayuda no modifica por sí mismo la confianza científica:

```text
SCAFFOLD_LEVEL ≠ EVIDENCE_CONFIDENCE
```

## 11. Evidencia inválida

Cuando una evidencia es inválida o insuficiente, la explicación debe referirse a la regla de validez y permanecer neutral respecto del estado esperado.

Patrón:

```text
INVALID_EVIDENCE
→ EXPLAIN_INVALIDITY_STATE_AGNOSTICALLY
→ REQUEST_VALID_EVIDENCE
```

Ejemplo válido:

> Ese sector del borde está dañado; necesitamos una zona conservada para evaluar la dentición.

La explicación no debe revelar cuál estado favorecería a una especie candidata.

## 12. Separación temporal entre adquisición y aprendizaje

### Fase A — adquisición de evidencia

Puede incluir orientación, comprobación de disponibilidad, observabilidad, guía conceptual neutral, resolución o abstención.

Mientras una reobservación del mismo carácter y encuentro siga activa, no debe introducirse información que pueda sesgarla.

### Fase B — aprendizaje posterior

Una vez cerrada la adquisición pertinente, Árboris puede:

```text
nombrar
→ explicar
→ comparar
→ favorecer transferencia
```

La pedagogía posterior no modifica retroactivamente la evidencia obtenida.

La política exacta que determina cuándo una adquisición está definitivamente cerrada permanece OPEN.

## 13. Aprendizaje y evidencia son dominios distintos

```text
PEDAGOGICAL_SUCCESS ≠ BOTANICAL_EVIDENCE
GUIDED_TASK_SUCCESS ≠ LEARNING_TRANSFER
```

Que una persona entienda o acierte una actividad no constituye evidencia sobre una planta observada posteriormente.

Asimismo, el nivel de autonomía del observador no vuelve automáticamente una observación más verdadera.

La transferencia deberá evaluarse en situaciones donde al menos parte de la guía sea retirada y la persona tenga que decidir espontáneamente qué observar.

## 14. Ejemplos mínimos

### CH-003 — Dentición del margen foliar

La guía puede dirigir la atención a una zona conservada del borde y advertir que daño, herbivoría o necrosis no deben confundirse con dentición.

No debe sugerir si el estado esperado es `entero`, `finamente_serrado`, `serrado` o `dentado`.

### CH-002 — Disposición foliar

Debe comprobarse que existan varios nudos visibles de una misma ramilla.

Una hoja aislada no permite resolver el carácter. El scaffold no puede compensar con más explicación la ausencia de la evidencia requerida.

### CH-004 — Consistencia

La fotografía puede aportar evidencia parcial. Si la evidencia no permite resolver responsablemente la propiedad mecánica, debe conservarse la abstención o no-resolución.

## 15. Fuera de alcance

Este patrón no:

- crea una entidad de datos `Manifestation`;
- modifica el Master Botánico;
- modifica ACE;
- reemplaza `CharacterEvidence`;
- decide qué carácter debe priorizar la identificación;
- define la política de progresión pedagógica;
- demuestra que el usuario aprende mejor;
- define el schema final de `UNRESOLVED`;
- convierte una interpretación cultural en significado lingüístico del término histórico que inspiró la investigación.

## 16. OPEN

Permanecen abiertos:

- política de progresión pedagógica;
- representación técnica de causas concurrentes de no-resolución;
- medición de transferencia;
- accesibilidad perceptiva;
- desacuerdo entre usuario y modelo;
- generalización a todos los caracteres;
- efecto real sobre aprendizaje;
- política exacta de cierre de adquisición.

## 17. Procedencia conceptual

La procedencia debe mantenerse separada:

```text
ipotocaticac histórico
→ inspiración documentada

manifestación perceptible
→ interpretación contemporánea de Árboris

enseñar a observar
→ hipótesis de diseño

Perceptual Scaffold R4
→ patrón UX validado dentro de su alcance
```

No debe afirmarse que `ipotocaticac` signifique identificación, conocimiento, transmisión de conocimiento o este patrón UX.

## 18. Autoridad e incorporación

Este documento es la especificación normativa del patrón de andamiaje perceptivo de Árboris.

Su autoridad se limita a UX de observación y aprendizaje. No desplaza:

- la autoridad botánica del Master Botánico y sus derivados canónicos;
- ACE como motor de razonamiento por evidencia;
- los contratos específicos de cada carácter;
- las decisiones de producto sobre alcance del Piloto 1.0.

La incorporación normativa de este patrón no implica por sí sola su implementación completa en el Piloto 1.0. La implementación deberá respetar los OPEN de la sección 16 y pasar los gates de desarrollo correspondientes.
