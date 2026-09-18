# ASC — TILE-PRISM-GRAMMAR-TEST-005

**Fecha:** 2026-09-18  
**Estado:** prueba correctiva de output-shape  
**Relación:** deriva de TEST-004 sin modificar sus hallazgos ni promover reglas a producción.

## Objetivo

Comprobar si el mismo contenido visual básico puede obtenerse cuando el ejecutor recibe una instrucción mínima que describe solo la escena y omite lenguaje de documentación.

## Requisitos visuales

Una única composición isométrica formada por exactamente nueve prismas contiguos en una matriz 3×3.

Distribución visual requerida:

```text
fila superior:
elevación +1 caminable | borde de elevación | blocker rocoso

fila central:
pendiente +1→0 | esquina de camino | ribera suelo→agua

fila inferior:
suelo plano | camino recto | agua deprimida
```

La composición debe conservar:

- misma huella aparente en las nueve celdas;
- misma cámara y proyección;
- continuidad de superficies en los bordes compatibles;
- diferencias relativas de elevación;
- ninguna categoría adicional.

## Prohibido

- texto;
- números;
- logo;
- UI;
- paneles;
- leyendas;
- líneas de cuadrícula explicativas;
- atlas;
- tiles aislados;
- vistas secundarias;
- paletas;
- flechas;
- decoración no necesaria.

## OPEN

Permanecen abiertos:

- tamaño de tile;
- escala;
- altura real;
- ángulo isométrico definitivo;
- renderer;
- pixel-art final de producción.

## Prompt mínimo de ejecución

```text
A single isolated isometric 3×3 terrain patch made of exactly nine contiguous equal-footprint prism cells on a plain dark neutral background, viewed from one fixed isometric camera.

Top row: a walkable raised grass cell, an elevation-edge cell, a solid rock blocker cell.
Middle row: a walkable slope descending from raised level to base level, a dirt path corner cell, a soil-to-water bank transition cell.
Bottom row: a flat walkable grass cell, a straight dirt path cell, a lowered non-walkable water cell.

All nine cells touch edge-to-edge as one continuous patch. Matching surfaces align cleanly across shared edges; elevation changes are internally coherent; the path does not continue into water; the water sits visibly lower than adjacent land.

Minimal natural texture only. No large plants or props.

No text, no numbers, no labels, no logo, no interface, no diagram panels, no legend, no extra tiles, no side views, no palette, no annotations, no borders around the image. Show only the single 3×3 terrain patch.
```

## Gate

```text
ONE PATCH ONLY: required
EXACTLY 9 CELLS: required
3×3 CONTIGUOUS: required
NO EXTRA CONTENT: required
SURFACE LEGIBILITY: required
ELEVATION LEGIBILITY: required
OPEN PRESERVATION: required
```

Un PASS visual en TEST-005 solo habilita una gramática candidata. No establece todavía assets de producción.
