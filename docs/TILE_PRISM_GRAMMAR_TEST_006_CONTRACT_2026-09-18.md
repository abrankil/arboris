# ASC — TILE-PRISM-GRAMMAR-TEST-006

**Fecha:** 2026-09-18  
**Estado:** prueba correctiva de semantic placement  
**Relación:** deriva de TEST-005 y conserva su estrategia de prompt mínimo.

## Objetivo

Comprobar si un patch 3×3 limpio puede conservar no solo la forma general, sino también la identidad semántica exacta de cada una de sus nueve posiciones.

## Regla de ejecución

Usar como referencia visual el resultado limpio de TEST-005 y corregir únicamente la distribución semántica de las nueve celdas.

No convertir la salida en infografía.

## Matriz posicional obligatoria

```text
screen_up

C01  elevation +1 walkable
C02  elevation edge
C03  blocker rock

C04  slope transition +1→0
C05  path corner
C06  soil→water bank

C07  flat ground
C08  path straight
C09  water depression

screen_down
```

La posición de cada categoría es contractual para esta prueba.

## Restricciones

- exactamente un patch 3×3;
- exactamente nueve celdas;
- misma huella aparente;
- una sola cámara isométrica;
- sin texto, números, logo, UI, leyendas, paneles, atlas ni vistas adicionales;
- sin categorías extra;
- sin duplicar agua, blocker, camino, pendiente o elevación fuera de su celda asignada;
- textura natural mínima;
- ninguna decoración que impida leer los bordes.

## OPEN

Permanecen abiertos:

- tamaño definitivo de tile;
- escala física;
- altura real;
- ángulo isométrico definitivo;
- renderer;
- resolución lógica final de pixel art;
- número definitivo de bandas de elevación.

## Gate

```text
ONE PATCH ONLY: required
EXACTLY 9 CELLS: required
POSITIONAL SEMANTICS C01–C09: required
NO DUPLICATED SEMANTIC CATEGORY: required
COMMON FOOTPRINT: required
EDGE CONTINUITY: required
NO EXTRA CONTENT: required
OPEN PRESERVATION: required
```

Un PASS visual habilita extracción de una gramática candidata, no un estándar final de producción.
