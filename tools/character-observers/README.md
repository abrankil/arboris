# Hito 16 — Observadores de caracteres

Este módulo define el contrato mínimo entre un observador visual y el motor canónico de identificación de Árboris.

Un observador no identifica especies. Recibe la tarea de observar un único carácter botánico y solo puede devolver:

- `observed`: un estado perteneciente a `estados_permitidos` del carácter canónico;
- `not_observable`: la imagen no permite resolver el carácter;
- `uncertain`: existe señal, pero no alcanza el umbral necesario para registrar un estado botánico.

`not_observable` y `uncertain` se convierten en evidencia no eliminatoria para el motor vigente. La incertidumbre nunca se transforma en ausencia.

## Contrato

Ejemplo válido:

```js
{
  characterId: 'CH-003',
  status: 'observed',
  observedState: 'entero',
  confidence: 0.91,
  source: 'visual_observer',
  model: 'nombre-del-observador'
}
```

Ejemplo de abstención:

```js
{
  characterId: 'CH-003',
  status: 'not_observable',
  confidence: 0.18,
  source: 'visual_observer'
}
```

Los estados permitidos no se definen aquí: se leen desde el dataset canónico derivado de Master Botánico 2.0.

## Regla arquitectónica

```text
imagen
  ↓
observador de UN carácter
  ↓
estado permitido | not_observable | uncertain
  ↓
validación canónica
  ↓
evidencia para canonical-identification
```

Este módulo no contiene modelos de visión ni conocimiento botánico hardcodeado. El siguiente incremento del Hito 16 debe implementar un primer observador experimental para un carácter fotográficamente observable y medir su capacidad de abstenerse correctamente.
