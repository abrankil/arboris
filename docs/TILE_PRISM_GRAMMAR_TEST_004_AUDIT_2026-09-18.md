# ASC — Auditoría TILE-PRISM-GRAMMAR-TEST-004

**Fecha:** 2026-09-18  
**Estado:** resultado generativo auditado  
**Contrato:** `docs/TILE_PRISM_GRAMMAR_TEST_004_CONTRACT_2026-09-18.md`

## 1. Resultado general

Se auditaron dos salidas generativas producidas para TEST-004.

```text
OUTPUT A
3x3 SHAPE COMPLIANCE: FAIL
EXACT CELL SET: FAIL
COMMON FOOTPRINT: PASS VISUAL
ISOMETRIC CONSISTENCY: PASS VISUAL
EDGE COMPATIBILITY: PARTIAL
SEAM CONTINUITY: PARTIAL
ELEVATION TRANSITIONS: PARTIAL
OUTPUT HYGIENE: FAIL
OPEN PRESERVATION: PASS

OUTPUT B
3x3 SHAPE COMPLIANCE: PARTIAL
EXACT CELL SET: FAIL
COMMON FOOTPRINT: PASS VISUAL
ISOMETRIC CONSISTENCY: PASS VISUAL
EDGE COMPATIBILITY: PARTIAL
SEAM CONTINUITY: PARTIAL
ELEVATION TRANSITIONS: PARTIAL
OUTPUT HYGIENE: FAIL
OPEN PRESERVATION: PASS

DECISION:
FAIL / REVISE
```

## 2. Incumplimientos comunes

Ambas salidas incumplieron prohibiciones explícitas del contrato:

- añadieron títulos, texto, leyendas y UI;
- incorporaron logos y paneles;
- produjeron atlas, referencias o vistas adicionales;
- generaron composiciones extra además del patch requerido;
- utilizaron contenido de autoevaluación/checklist dentro de la imagen.

La salida B contiene un patch 3×3 visible, pero no respeta el conjunto exacto C01–C09 del contrato y lo acompaña con múltiples paneles adicionales.

## 3. Hallazgos útiles

Pese al fallo de forma, ambas ejecuciones aportan evidencia visual útil de:

- huella modular consistente;
- proyección isométrica coherente;
- diferenciación de suelo, camino, agua y blocker;
- bandas relativas de elevación;
- perfiles de borde;
- potencial de continuidad entre superficies homogéneas.

Estos hallazgos no convierten la salida en PASS contractual.

## 4. Diagnóstico

El fallo dominante no es de capacidad visual sino de traducción del contrato a la instrucción del ejecutor.

El ejecutor está interpretando el lenguaje de especificación como una solicitud de lámina explicativa.

Por tanto:

```text
CONTRACT:
adequate for audit

EXECUTION PROMPT:
too specification-shaped for this executor

RESULT:
infographic bias / output-shape drift
```

Esto no demuestra un defecto del contrato de tiles ni exige cambiar ASC v0.1.

## 5. Nueva hipótesis de prueba

La próxima iteración debe separar:

```text
SEMANTIC CONTRACT
→ completo, auditable, estable

EXECUTOR PROMPT
→ mínimo, visual, sin vocabulario de documentación
```

El prompt de ejecución no debe mencionar:

- test;
- contrato;
- reglas;
- matriz como documento;
- labels C01–C09;
- checklist;
- estándares;
- vocabulario;
- gramática;
- especificación.

Debe describir únicamente la composición visual requerida.

## 6. Decisión

```text
TILE-PRISM-GRAMMAR-TEST-004
STATUS: FAIL / REVISE

PRODUCTION TILE STANDARD:
NOT ESTABLISHED

ASC v0.1 CHANGE REQUIRED:
NO

v0.2 TRIGGER:
NO

NEXT:
TILE-PRISM-GRAMMAR-TEST-005
MINIMAL EXECUTOR PROMPT / SAME SEMANTIC INTENT
```
