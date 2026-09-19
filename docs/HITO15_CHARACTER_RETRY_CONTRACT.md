# Hito 15 — Contrato de reintento de caracteres (Hallazgo C)

Estado: **CERRADO** para Hito 15 a nivel de contrato, implementación y pruebas aisladas. El diseño de interfaz queda fuera del alcance de este documento.

## Hallazgo original (auditoría)

`nextCharacter()` trataba cualquier `characterId` presente en la evidencia como un carácter agotado, sin distinguir entre intentado y resuelto.

Esto bloqueaba el reintento de caracteres respondidos con estados como `unknown`, `not_observable` o `not_applicable`, aunque posteriormente pudiera obtenerse nueva evidencia mediante otra fotografía, otro ángulo, otro momento u otra observación.

## Decisiones cerradas

1. Un carácter puede encontrarse en tres estados operativos:
   - **visible**: disponible para preguntarse;
   - **intentado**: se solicitó evidencia y se recibió una respuesta, incluyendo respuestas de incertidumbre o imposibilidad de evaluación;
   - **resuelto**: la evidencia aplicada produjo una reducción efectiva del conjunto de candidatos.

2. Un carácter intentado pero no resuelto **no** vuelve a ofrecerse automáticamente en el flujo normal de `nextCharacter()`.

3. No existe límite de reintentos. Un carácter intentado-no-resuelto permanece disponible para reintento explícito indefinidamente. No caduca por tiempo ni por número de intentos.

4. El reintento requiere una acción **explícita**. Nunca se ejecuta automáticamente.

5. Un carácter resuelto es terminal y no vuelve a ofrecerse ni automática ni manualmente.

## Implementación cerrada

ACE mantiene separado el flujo automático de `nextCharacter()` del reintento explícito.

`retryCharacter(dataset, evidence, characterId, candidateIds)` permite volver a solicitar un carácter únicamente cuando fue intentado pero no resuelto.

El estado de resolución no requiere agregar un segundo estado persistente a la evidencia. Se deriva comparando el conjunto de candidatos antes y después de aplicar la evidencia correspondiente al carácter:

```text
aplicar evidencia del carácter
          ↓
¿se redujo el conjunto de candidatos?
          ↓
sí  → carácter resuelto → retryCharacter() devuelve null
no  → carácter intentado-no-resuelto → puede reintentarse explícitamente
```

Esto preserva el contrato existente de evidencia y mantiene `nextCharacter()` libre de reintentos automáticos.

## Relación con `supported`

El concepto de `resolved` de este contrato tiene un significado específico:

> Un carácter está resuelto cuando su evidencia redujo efectivamente el conjunto de candidatos.

Este significado no debe confundirse con **evidencia evaluable** en `docs/HITO15_SUPPORTED_CONTRACT.md`.

Para `supported`, una dimensión se determina por `characterId` y puede ser evaluable aunque, en el estado concreto del conjunto de candidatos, una observación no haya producido por sí misma una reducción adicional.

Por tanto:

- **retry lifecycle:** `resolved` = el carácter redujo candidatos;
- **support assessment:** dimensión evaluable = existe evidencia conocida/evaluable para un `characterId`.

Ambos conceptos son deliberadamente distintos y no deben intercambiarse en código, documentación ni pruebas.

## Evidencia que constituye un intento

A efectos de este contrato, un carácter queda intentado cuando ACE recibe una respuesta para ese carácter.

Esto incluye respuestas que no permiten resolverlo, entre ellas:

- `unknown`
- `not_observable`
- `not_applicable`
- `not_evaluated`
- `no_se`
- `no_sé`
- `no_observable`
- `no_aplica`

Estas respuestas son válidas y no deben convertirse artificialmente en evidencia positiva o negativa.

Una respuesta de incertidumbre puede dejar el carácter en estado intentado-no-resuelto y habilitar posteriormente un reintento explícito.

## Reglas de `nextCharacter()`

`nextCharacter()` representa únicamente el flujo automático de selección.

En el flujo normal:

```text
visible + no intentado
          ↓
candidato para selección
```

Un carácter intentado-no-resuelto no vuelve a seleccionarse automáticamente.

Un carácter resuelto tampoco vuelve a seleccionarse.

El reintento se realiza exclusivamente mediante `retryCharacter()` y una acción explícita de la capa de producto.

## Reglas de `retryCharacter()`

`retryCharacter()` solo puede reintentar un carácter cuando:

- el `characterId` es válido;
- el carácter pertenece al dataset computable;
- el carácter fue intentado previamente;
- el carácter no fue resuelto por la evidencia previa.

Si el carácter ya está resuelto, no puede reintentarse.

Si el carácter no fue intentado, no se trata de un reintento: debe seguir el flujo normal de `nextCharacter()`.

Si un nuevo intento reduce el conjunto de candidatos, el carácter pasa a estar resuelto y `retryCharacter()` devuelve `null`.

Si el nuevo intento no reduce el conjunto de candidatos, permanece intentado-no-resuelto y puede volver a solicitarse explícitamente.

## Sin límite de reintentos

ACE no establece un número máximo de reintentos.

Un carácter puede pasar repetidamente por:

```text
intentado-no-resuelto
          ↓
reintento explícito
          ↓
intentado-no-resuelto
          ↓
reintento explícito
          ↓
...
```

hasta que una nueva evidencia lo resuelva o la sesión deje de solicitarlo.

No existe expiración por tiempo ni contador de intentos que convierta automáticamente el carácter en terminal.

## Preservación de la evidencia

El reintento no requiere sobrescribir ni borrar la evidencia anterior.

Las observaciones adicionales pueden registrarse como nueva evidencia para el mismo `characterId`.

La regla de independencia establecida por el contrato de `supported` permanece vigente:

```text
CH-008 + CH-008
```

sigue constituyendo como máximo una dimensión de evidencia, aunque existan múltiples fotografías, observaciones o intentos.

Un reintento tampoco crea por sí mismo una nueva dimensión.

## Separación entre motor e interfaz

Este contrato define el comportamiento de ACE.

No define el diseño visual ni la interacción concreta de la aplicación.

La interfaz podrá proporcionar posteriormente una forma explícita de solicitar el reintento de un carácter intentado-no-resuelto. El botón o control correspondiente queda fuera del alcance de Hito 15.

## Validación

El comportamiento de retry está protegido por la suite canónica de ACE.

La validación incluye:

- no repetición automática de caracteres intentados-no-resueltos;
- reintento explícito de un carácter intentado-no-resuelto;
- terminalidad de un carácter que efectivamente redujo candidatos;
- preservación de la distinción entre `resolved` y evidencia evaluable;
- repetición del mismo `characterId` sin incremento artificial de dimensiones.

La suite aislada actual de ACE, después de las correcciones finales de auditoría, alcanza:

```text
tests       24
pass        24
fail         0
```

El gate integrado debe ejecutarse nuevamente sobre el estado definitivo de la rama mediante:

```powershell
npm.cmd test
```

## Alcance de Hito 15

El alcance de esta iteración comprende el comportamiento del motor ACE necesario para:

- distinguir carácter visible, intentado y resuelto;
- impedir reintentos automáticos;
- permitir reintentos explícitos de caracteres intentados-no-resueltos;
- mantener reintentos sin límite;
- hacer terminal un carácter que efectivamente redujo candidatos;
- preservar la evidencia y su semántica.

La implementación de la interfaz de reintento queda fuera del alcance del motor y de este contrato.

## Explícitamente fuera de alcance

Quedan fuera de este contrato:

- diseño de UI del botón o control de reintento;
- obtención automática de evidencia mediante visión por computador;
- persistencia formal de sesiones;
- sincronización;
- política de descubrimiento;
- gamificación;
- consenso comunitario.

## Criterio de cierre

El contrato se considera satisfecho cuando ACE garantiza simultáneamente que:

- `nextCharacter()` no repite automáticamente caracteres intentados-no-resueltos;
- un carácter intentado-no-resuelto puede reintentarse explícitamente;
- no existe límite de reintentos;
- un carácter resuelto es terminal;
- `resolved` significa exclusivamente que el carácter redujo el conjunto de candidatos;
- `resolved` no se utiliza como sinónimo de evidencia evaluable para `supported`;
- los estados de incertidumbre o imposibilidad de evaluación pueden constituir un intento, pero no resuelven el carácter;
- un reintento no crea una nueva dimensión de evidencia;
- la evidencia previa no se elimina como consecuencia del reintento.

Estado final del contrato: **CERRADO para Hito 15**. El cierre general del hito permanece sujeto a la auditoría restante, el gate integrado final y la consolidación de la rama en `main`.
