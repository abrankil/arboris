# Hito 16 — Observadores de caracteres

Este módulo define el contrato mínimo entre un observador visual y el motor canónico de identificación de Árboris.

Un observador no identifica especies. Recibe la tarea de observar un único carácter botánico y solo puede devolver:

- `observed`: un estado perteneciente a `estados_permitidos` del carácter canónico;
- `not_observable`: la imagen no permite resolver el carácter;
- `uncertain`: existe señal, pero no alcanza el umbral necesario para registrar un estado botánico.

`not_observable` y `uncertain` se convierten en evidencia no eliminatoria para el motor vigente. La incertidumbre nunca se transforma en ausencia.

## Formas de datos

El observador devuelve un `ObserverResult` parcial. Para validarlo y pasarlo a ACE, el adaptador necesita un sobre con la foto de origen, quién o qué observó y cómo se adquirió la observación. Los ejemplos siguientes muestran una `CharacterObservation` completa que acepta `validateCharacterObservation`; no son solamente la salida del observador.

En los ejemplos, `dataset` es el dataset canónico cargado por ACE. Primero se valida la foto y se construye el mapa de referencias:

```js
const photoResult = validatePhotoEvidence({
  photoEvidenceId: 'PE-001',
  sourcePhoto: {
    photoRef: 'PH-001',
    fingerprintSha256: 'a'.repeat(64),
  },
  visibleStructures: ['hoja'],
});
if (!photoResult.valid) throw new Error(photoResult.errors.join('; '));

const photoEvidenceById = new Map([
  [photoResult.normalized.photoEvidenceId, photoResult.normalized],
]);

const observed = {
  photoEvidenceRef: 'PE-001',
  characterId: 'CH-003',
  status: 'observed',
  observedState: 'entero',
  confidence: 0.91,
  observer: { type: 'machine', tool: 'visual_observer', model: 'nombre-del-modelo' },
  acquisition: { mode: 'automatic' },
  evidence: [{ evidenceRef: 'EV-001' }],
};

const observedResult = validateCharacterObservation(dataset, observed, photoEvidenceById);
```

Una abstención requiere `reason` y no lleva `observedState`:

```js
const notObservable = {
  photoEvidenceRef: 'PE-001',
  characterId: 'CH-003',
  status: 'not_observable',
  reason: 'El margen queda fuera del encuadre',
  confidence: 0.18,
  observer: { type: 'machine', tool: 'visual_observer', model: 'nombre-del-modelo' },
  acquisition: { mode: 'automatic' },
};

const notObservableResult = validateCharacterObservation(dataset, notObservable, photoEvidenceById);
```

El mapa debe contener la referencia `photoEvidenceRef` usada en la observación. `observerResultToCharacterObservation` permite combinar un `ObserverResult` con el sobre; la conversión a evidencia ACE se hace después de validar la elegibilidad del carácter.

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
