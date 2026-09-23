# ASC — R5 Fresh Producer Handoff A

**Experimento:** ASC-R5-CLAIM-PROVENANCE-CONTRAST-001  
**Rol:** productor  
**Condición experimental:** no revelada  
**Uso:** abrir en un contexto fresco sin historial de este proyecto

## Material que debe recibir el productor

Adjuntar exactamente:

`R5_SOURCE_001.svg`

SHA-256 esperado:

`f73dd125a91a17d0034752ecfd8edacdbc44e47394273ad1c1fa9e636a39bd87`

Usar exactamente la siguiente instrucción:

```text
Convertir el paquete recibido en una ficha compacta de referencia.
Conservar todos los claims suministrados y toda la información epistemológica explícitamente disponible.
No añadir claims materiales.
No resolver incertidumbres.
No autoasignar PASS, PARTIAL, FAIL, VALIDATED ni APPROVED.
No usar conocimiento externo para elevar la autoridad de un claim.
```

Usar exactamente el siguiente paquete:

```text
EXPERIMENT: ASC-R5-CLAIM-PROVENANCE-CONTRAST-001

SOURCE:
experiments/asc-r5-claim-provenance/R5_SOURCE_001.svg
SHA256: f73dd125a91a17d0034752ecfd8edacdbc44e47394273ad1c1fa9e636a39bd87

CLAIMS:
C1: Hay dos elementos circulares.
C2: El elemento izquierdo es mayor que el derecho.
C3: Los elementos emiten luz.
C4: Diámetro aproximado: 40 cm.
C5: La función exacta no está establecida.

STATUS VOCABULARY (UNORDERED SET; ORDER HAS NO SEMANTIC MEANING):
- INTERPRETATION_HYPOTHESIS
- DERIVED_VISUAL_OBSERVATION
- OPEN_NOT_ESTABLISHED
- DERIVED_RELATIVE_OBSERVATION
- UNSUPPORTED_QUANTIFICATION

All five status labels occur somewhere in this component.
No explicit claim-to-status mapping is provided.
```

## Restricciones de contexto

El productor no debe recibir ni consultar:

- manifest del experimento;
- rúbrica de auditoría;
- auditorías previas;
- otro output;
- asignación de condición;
- resultado esperado;
- conversación histórica de diseño.

Debe devolver un único output íntegro. No seleccionar entre múltiples intentos.
