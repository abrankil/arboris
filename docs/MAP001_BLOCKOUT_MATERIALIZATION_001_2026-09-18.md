# MAP-001 — Materialización determinista 001

**Fecha:** 2026-09-18  
**Estado:** implementación mínima realizada; verificación local preliminar fuera del runtime conforme  
**Modelo:** `MAP-001-BLOCKOUT-CANDIDATE-001`

## 1. Alcance

Se materializó el candidato provisional definido en `docs/MAP001_BLOCKOUT_CANDIDATE_001_2026-09-18.md` como un modelo JSON verificable y un materializador determinista independiente del arte final.

Artefactos implementados:

```text
data/maps/map-001-blockout-candidate-001.json
tools/map-blockout/materialize_map001.mjs
tools/map-blockout/materialize_map001.test.mjs
tools/map-blockout/README.md
```

El materializador produce dos previews técnicos:

```text
360×640
360×800
```

y un reporte JSON de validación.

## 2. Autoridad

La geometría serializada en esta implementación es:

```text
PROVISIONAL / TEST ONLY
```

No constituye:

- geometría territorial;
- `walkableEnvelope` definitivo;
- escala métrica;
- orientación cardinal;
- renderer;
- pathfinding;
- Interaction / Learning Contract.

## 3. Validaciones implementadas

El validador opera fail-closed sobre:

```text
singleConnectedComponent
bottomEntryConnected
topExitConnected
leftEdgeClosed
rightEdgeClosed
noInventedBranches
mainRouteDominant
bridgeCrossesStream
bridgePrecedesGate
houseLeftAfterThreshold
streamTurnsAtThreshold
streamRightAfterThreshold
streamLowerThanPath
cameraInvariantsPreserved
```

También exige:

- `worldBearing = OPEN`;
- elevación métrica `OPEN`;
- ascenso/descenso global `OPEN`;
- `PILOT_FIXED_ISOMETRIC`;
- rotación de cámara deshabilitada;
- zoom `OPEN`;
- viewports exactamente `360×640` y `360×800`;
- Interaction / Learning en estado `OPEN` y sin slots inventados.

## 4. Prueba local realizada

Runtime disponible durante esta materialización:

```text
Node v22.16.0
```

Runtime declarado por el proyecto:

```text
>=24.0.0 <25
```

Resultado local:

```text
6 tests
6 PASS
0 FAIL
```

Cobertura:

1. valida topología y relaciones del candidato;
2. rechaza una rama lateral inventada;
3. rechaza un bearing cardinal fijado;
4. rechaza interaction slots inventados;
5. comprueba render determinista en `360×640` y `360×800`;
6. rechaza un viewport no autorizado en lugar de adaptarlo silenciosamente.

Por diferencia de runtime, este resultado se registra como:

```text
PRELIMINARY / RUNTIME-NONCONFORMING
```

Debe repetirse bajo Node 24.x antes de cerrar el gate técnico.

## 5. Resultado preliminar del modelo

```text
singleConnectedComponent: PASS
bottomEntryConnected: PASS
topExitConnected: PASS
leftEdgeClosed: PASS
rightEdgeClosed: PASS
noInventedBranches: PASS
mainRouteDominant: PASS
bridgeCrossesStream: PASS
bridgePrecedesGate: PASS
houseLeftAfterThreshold: PASS
streamTurnsAtThreshold: PASS
streamRightAfterThreshold: PASS
streamLowerThanPath: PASS
cameraInvariantsPreserved: PASS
interactionSlots: NOT TESTED
geometryAuthority: PROVISIONAL / TEST ONLY
```

## 6. Hashes preliminares

Generados bajo Node v22.16.0:

```text
MODEL JSON
40d61346cb6710c047e3505e6fe6a7023e236700f1c67a2e5ce29d22f931243c

MATERIALIZER
4ec71ebc9fdf27ab9a9c1b191c23faa3d4b98f12b3e2e41ff37e0b55592b298d

360×640 SVG
08bd7510f9c4d576fc115556eea8b66882bc10d8ec3a7139a6077b7f21d8f12d

360×800 SVG
31387436d956bc10eaa8829ca6f5c7b22a8506842abe2f065f83e18b47050a7f

VALIDATION JSON
96a71a71151a7a907c0fdbc5e1ba3716dcf148f4b3fc963d20a92e9a45791d7b
```

Estos hashes no se consideran canónicos hasta reproducir la materialización bajo Node 24 conforme.

## 7. Viewport

Los dos previews utilizan el mismo modelo lógico.

La diferencia de altura solo modifica el espacio disponible de presentación; no cambia:

- puertos;
- conectividad;
- ruta;
- relaciones territoriales;
- estados `OPEN`.

Esto permite evaluar el requisito `360×H` sin crear dos mapas distintos.

## 8. Gap bloqueante

El Interaction / Learning Contract continúa sin definición suficiente.

Por tanto:

```text
TOPOLOGY: MATERIALIZED / PRELIMINARY PASS
TERRITORIAL RELATIONS: MATERIALIZED / PRELIMINARY PASS
CAMERA VIEWPORTS: MATERIALIZED / PRELIMINARY PASS
INTERACTION / LEARNING: NOT TESTED

MAP-001 v0.3 FINAL GATE:
OPEN
```

## 9. Próximo gate

Ejecutar bajo Node 24.x:

```bash
npm run test:map-blockout
npm run materialize:map001
```

Registrar:

- versión exacta de Node;
- HEAD;
- estado del working tree;
- resultado 6/6;
- SHA-256 del modelo;
- SHA-256 del materializador;
- SHA-256 de ambos SVG;
- SHA-256 del reporte de validación.

Si los dos viewports conservan los mismos invariantes y los hashes son reproducibles en dos ejecuciones independientes, cerrar el gate de materialización determinista.

## 10. Decisión

```text
MAP-001 BLOCKOUT MATERIALIZATION 001

IMPLEMENTATION: PASS
LOCAL TESTS: 6/6 PASS
RUNTIME CONFORMANCE: FAIL / NODE 22
DETERMINISTIC GATE: PRELIMINARY
INTERACTION GATE: OPEN

ASC v0.1 CHANGE REQUIRED: NO
CONTRACT v2.1 CHANGE REQUIRED: NO
```
