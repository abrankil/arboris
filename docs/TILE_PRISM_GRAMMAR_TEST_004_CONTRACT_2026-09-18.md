# ASC — TILE-PRISM-GRAMMAR-TEST-004

**Fecha:** 2026-09-18  
**Estado:** contrato experimental de generación; no modifica ASC v0.1 ni establece todavía estándar de producción  
**Ámbito:** gramática mínima de celdas lógicas 2D representadas como prismas isométricos de trabajo.

## 1. Objetivo

Comprobar, en una única composición 3×3 controlada, si una familia mínima de prismas puede conservar:

- huella lógica común;
- proyección/cámara coherente;
- roles de superficie distinguibles;
- bandas relativas de elevación;
- compatibilidad de bordes;
- transiciones explícitas;
- continuidad visual sin seams críticos.

La prueba no valida todavía pixel art de producción, renderer, tamaño de tile, métrica territorial ni navegación real.

## 2. Autoridades

- `docs/SPATIAL_MODEL.md`
- `docs/ENVIRONMENT_PRODUCTION_SPEC.md`
- `docs/ARBORIS_SCENE_COMPILER.md`

Regla de autoridad:

```text
walkableEnvelope / contratos
→ celda lógica derivada
→ prisma isométrico de trabajo
```

El prisma no es un voxel territorial ni una segunda fuente de verdad.

## 3. Vocabulario experimental

```text
cellFootprint
→ huella lógica 2D común

surfaceRole
→ walkable | non-walkable | blocker | transition

surfaceType
→ ground | path | water | rock

elevationBand
→ banda relativa de prueba; no metros

edgeContent
→ contenido que alcanza un borde: ground | path | water | blocker

edgeProfile
→ relación vertical del borde: level | rise | drop | bank | blocked

transition
→ cambio explícitamente autorizado entre dos estados
```

Este vocabulario es experimental. No se promueve todavía a esquema canónico.

## 4. Matriz obligatoria 3×3

La imagen debe contener exactamente un patch contiguo de nueve celdas:

```text
screen_up

┌─────────────────────┬─────────────────────┬─────────────────────┐
│ C01                 │ C02                 │ C03                 │
│ elevation +1        │ elevation edge      │ blocker rock        │
│ walkable            │ explicit drop       │ non-walkable        │
├─────────────────────┼─────────────────────┼─────────────────────┤
│ C04                 │ C05                 │ C06                 │
│ slope transition    │ path corner         │ soil → water bank   │
│ +1 → 0              │ connects D + R      │ explicit transition │
├─────────────────────┼─────────────────────┼─────────────────────┤
│ C07                 │ C08                 │ C09                 │
│ flat ground         │ path straight       │ water depression    │
│ walkable band 0     │ connects U + D      │ non-walkable lower  │
└─────────────────────┴─────────────────────┴─────────────────────┘

screen_down
```

## 5. Relaciones de borde que deben ser legibles

- C01 ↔ C04: transición de elevación +1 a 0 mediante pendiente explícita.
- C01 ↔ C02: continuidad en banda elevada.
- C02 ↔ C03: cierre mediante borde/blocker; no conexión caminable implícita.
- C04 ↔ C05: continuidad de suelo en banda 0.
- C05 ↔ C08: continuidad del camino.
- C05 ↔ C06: esquina de camino desemboca visualmente junto a transición de ribera sin convertir el agua en ruta.
- C06 ↔ C09: continuidad de ribera hacia agua deprimida.
- C07 ↔ C08: suelo y camino comparten borde limpio.
- C08 ↔ C09: el borde derecho del camino termina en ribera/agua; no continuar el camino dentro del agua.

Ninguna unión puede depender de texto, flechas o leyendas para ser entendida.

## 6. Contrato ASC v0.1 de la prueba

```json
{
  "version": "0.1",
  "executionMode": "compile-only",
  "testId": "TILE-PRISM-GRAMMAR-TEST-004",
  "objective": "Probar una gramática mínima de nueve celdas lógicas 2D representadas como prismas isométricos contiguos en un patch 3×3, priorizando compatibilidad de bordes, continuidad, bandas relativas de elevación y separación entre estructura y decoración.",
  "authorizedSources": [
    "docs/SPATIAL_MODEL.md",
    "docs/ENVIRONMENT_PRODUCTION_SPEC.md",
    "docs/ARBORIS_SCENE_COMPILER.md"
  ],
  "structuralContract": [
    "La salida debe ser un único patch 3×3 contiguo de exactamente nueve prismas con huella lógica aparente común.",
    "Todos los prismas deben compartir la misma proyección isométrica de trabajo y la misma escala visual.",
    "El patch debe contener exactamente C01 elevation +1 walkable, C02 elevation edge, C03 blocker rock, C04 slope transition +1→0, C05 path corner, C06 soil→water bank, C07 flat ground, C08 path straight y C09 water depression.",
    "Las nueve celdas forman una sola composición técnica; no producir atlas, catálogo, pares separados, vistas laterales ni ejemplos adicionales."
  ],
  "mandatoryRelations": [
    "C01 conecta visualmente con C04 mediante una pendiente explícita de banda +1 a banda 0.",
    "C01 y C02 comparten continuidad de banda elevada.",
    "C02 y C03 forman un cierre sin conexión caminable implícita.",
    "C04 y C05 conservan continuidad de suelo en banda 0.",
    "C05 y C08 forman continuidad de camino.",
    "C05 presenta una esquina de camino legible.",
    "C06 materializa una transición explícita suelo→agua.",
    "C06 y C09 conservan continuidad de ribera hacia agua deprimida.",
    "C07 y C08 comparten un borde suelo↔camino limpio.",
    "C08 no continúa como camino dentro de C09."
  ],
  "open": [
    "Tamaño lógico o físico definitivo de tile.",
    "Escala metros por celda.",
    "Ángulo isométrico exacto, pitch, yaw y FOV definitivos.",
    "Número definitivo de elevationBands.",
    "Renderer, pathfinding y formato final de assets.",
    "Paleta final y resolución lógica definitiva de pixel art."
  ],
  "doNotInfer": [
    "No interpretar los prismas como voxels físicos del territorio.",
    "No inferir metros, altura real, pendiente real o escala territorial desde las bandas relativas.",
    "No convertir esta composición en autoridad sobre el walkableEnvelope.",
    "No inferir categorías adicionales de tiles por plausibilidad visual."
  ],
  "prohibited": [
    "No añadir texto, números, títulos, leyendas, flechas, UI, logo, marcos, paleta ni anotaciones.",
    "No generar tiles aislados, pares separados, hojas de catálogo, vistas laterales ni una segunda composición.",
    "No añadir casas, árboles grandes, señales, puentes, nieve, lava, desierto, mobiliario ni props decorativos.",
    "No añadir más de nueve celdas ni subdividir visualmente una celda en tiles menores."
  ],
  "artisticFreedom": [
    "Se permite variación mínima de textura de suelo, roca, agua y vegetación rasante únicamente para hacer legibles las superficies y bordes.",
    "La naturalización debe ser subordinada a la lectura técnica de seams, bordes, elevación y transición."
  ],
  "cameraFormat": [
    "Una única cámara isométrica fija para todo el patch.",
    "Vista suficientemente alta para mostrar simultáneamente las nueve celdas y todos sus bordes internos.",
    "Fondo neutro sin información adicional."
  ],
  "readingPriorities": [
    "Primero continuidad y compatibilidad de los ocho bordes internos relevantes.",
    "Luego roles de superficie y diferencias de elevationBand.",
    "Luego transición de pendiente y ribera.",
    "La decoración es última y puede omitirse por completo."
  ],
  "validationCriteria": [
    "Existe exactamente un patch contiguo 3×3 y exactamente nueve celdas.",
    "Las nueve celdas mantienen huella y proyección coherentes.",
    "C01–C09 corresponden a los nueve casos declarados sin categorías adicionales.",
    "Camino, agua, blocker, elevación y transiciones son legibles sin texto.",
    "Las uniones declaradas no presentan seams críticos ni contradicciones de altura o contenido.",
    "No aparecen atlas, ejemplos adicionales, vistas laterales o UI.",
    "Los estados OPEN no se presentan como medidas, escala física o decisiones técnicas cerradas."
  ]
}
```

## 7. Gate

La prueba puede producir reglas candidatas únicamente si alcanza:

```text
3x3 SHAPE COMPLIANCE: PASS
EXACT CELL SET: PASS
COMMON FOOTPRINT: PASS VISUAL
ISOMETRIC CONSISTENCY: PASS VISUAL
EDGE COMPATIBILITY: PASS VISUAL
SEAM CONTINUITY: PASS VISUAL
ELEVATION TRANSITIONS: PASS VISUAL
OUTPUT HYGIENE: PASS
OPEN PRESERVATION: PASS
```

Incluso con PASS visual, el estándar de producción permanece abierto hasta comprobar assets reales a 1× y comportamiento técnico en el renderer.

## 8. Decisión previa a ejecución

```text
TILE-PRISM-GRAMMAR-TEST-004

STATUS:
READY FOR GENERATIVE EXECUTION

ASC v0.1 CHANGE REQUIRED:
NO

PRODUCTION TILE STANDARD:
NOT YET ESTABLISHED
```
