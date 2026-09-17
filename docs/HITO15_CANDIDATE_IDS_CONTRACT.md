# Hito 15 — Contrato de `candidateIds` (Hallazgo D)

Estado: **CERRADO** para Hito 15 a nivel de contrato, implementación y pruebas aisladas.

## Hallazgo original (auditoría)

`filterCandidates()` aceptaba `candidateIds` como conjunto inicial sin normalizarlo ni validarlo. Esto permitía que IDs duplicados se propagaran y que IDs inexistentes entraran al flujo de identificación.

El mismo argumento circula además por `nextCharacter()`, `retryCharacter()` y `assessIdentification()`.

## Decisiones cerradas

1. `null` significa utilizar todas las especies canónicas del dataset.
2. Una lista explícita se deduplica preservando el orden de la primera aparición.
3. Un `species_id` inexistente es un error de entrada y se rechaza explícitamente. No se ignora silenciosamente.
4. `[]` es un conjunto de candidatos vacío válido. No equivale a `null` y no se expande a todas las especies.
5. La normalización y validación son únicas y reutilizables para evitar semánticas distintas entre las operaciones de ACE que reciben `candidateIds`.
6. ACE no convierte IDs históricos como `SP001` a IDs canónicos como `SP-001`.

## Ejemplos normativos

- `null` → todas las especies canónicas.
- `['SP-002', 'SP-001', 'SP-002']` → `['SP-002', 'SP-001']`.
- `['SP-001', 'SP-999']` → error explícito por `species_id` desconocido.
- `[]` → conjunto vacío.

El orden de primera aparición se conserva después de la deduplicación.

## Implementación cerrada

ACE incorpora una normalización centralizada de `candidateIds`.

Las listas explícitas:

- se validan contra `dataset.speciesById`;
- se deduplican preservando el orden de primera aparición;
- mantienen el conjunto vacío como valor válido;
- rechazan explícitamente cualquier ID desconocido.

La misma semántica se reutiliza en los caminos del motor que reciben `candidateIds` directamente, evitando tratamientos divergentes entre filtrado de candidatos, selección de caracteres, reintento explícito y evaluación de identificación.

## IDs históricos

ACE opera con los IDs canónicos presentes en el dataset, por ejemplo:

```text
SP-001
SP-002
SP-003
SP-004
SP-005
SP-006
```

No existe en este contrato una conversión automática desde formatos históricos sin guion como:

```text
SP001
SP002
SP003
SP004
SP005
SP006
```

Por tanto, un identificador histórico no debe transformarse silenciosamente en un identificador canónico dentro de ACE.

## Invariantes

El contrato establece las siguientes invariantes:

```text
candidateIds = null
→ conjunto completo de especies canónicas

candidateIds = []
→ conjunto vacío

candidateIds contiene IDs duplicados
→ una sola aparición por ID, conservando la primera

candidateIds contiene un ID desconocido
→ error explícito

candidateIds explícito válido
→ conserva el orden de primera aparición
```

Estas reglas forman parte del comportamiento observable de ACE y no deben depender de qué función del motor haya recibido inicialmente el argumento.

## Relación con las operaciones de ACE

`candidateIds` puede participar en:

- `filterCandidates()`
- `nextCharacter()`
- `retryCharacter()`
- `assessIdentification()`

Todas estas operaciones deben aplicar la misma semántica de normalización y validación.

En particular:

- ninguna operación debe interpretar `[]` como `null`;
- ninguna operación debe ignorar IDs desconocidos mientras otra los rechaza;
- ninguna operación debe deduplicar alterando arbitrariamente el orden recibido.

La normalización compartida evita estas divergencias.

## Separación de responsabilidades

Este contrato define únicamente la semántica de entrada, validación y normalización de `candidateIds`.

No modifica:

- el conocimiento botánico;
- las relaciones especie–carácter;
- las reglas de compatibilidad botánica;
- el contrato de `supported`;
- el contrato de retry;
- la interfaz de usuario.

Tampoco introduce cambios al Master Botánico 2.0 ni a las fichas canónicas.

## Validación

El comportamiento está protegido por la suite canónica de ACE.

Los tests cubren específicamente:

- deduplicación de `candidateIds`;
- conservación del orden de primera aparición;
- rechazo explícito de IDs desconocidos;
- preservación de `[]` como conjunto vacío;
- comportamiento de `null` como conjunto completo;
- reutilización de la misma semántica en los caminos relevantes del motor.

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

## Alcance de esta iteración

El alcance comprende únicamente la robustez de `candidateIds` dentro de ACE:

- normalización;
- validación;
- deduplicación;
- preservación del orden;
- rechazo explícito de IDs desconocidos;
- preservación del conjunto vacío;
- reutilización consistente de estas reglas;
- ausencia de conversión automática de IDs históricos.

## Explícitamente fuera de alcance

Quedan fuera de este contrato:

- Hallazgo E: unicidad de relaciones especie–carácter;
- cambios de UI;
- cambios al Master Botánico 2.0;
- cambios a las fichas canónicas;
- migración o conversión de IDs históricos;
- nuevos mecanismos de identificación.

## Criterio de cierre

El contrato se considera satisfecho cuando ACE garantiza simultáneamente que:

- `null` representa todas las especies canónicas;
- `[]` representa un conjunto vacío;
- las listas explícitas se deduplican;
- la primera aparición determina el orden conservado;
- los IDs desconocidos producen un error explícito;
- la misma semántica se aplica en todas las operaciones que reciben `candidateIds`;
- ACE no convierte IDs históricos `SP00X` a IDs canónicos `SP-00X`;
- estas reglas están protegidas por tests automatizados.

Estado final del contrato: **CERRADO para Hito 15**. El cierre general del hito permanece sujeto a la auditoría restante, el gate integrado final y la consolidación de la rama en `main`.
