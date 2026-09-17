# Árboris — Gramática modular de terreno v0.1

**Fecha:** 2026-09-17  
**Estado:** experimental / propuesta de trabajo  
**Alcance:** plano jugable `02-world`; no reemplaza `ENVIRONMENT_PRODUCTION_SPEC.md` ni constituye canon final de arte, renderer, navegación o assets.

## 1. Propósito

Este documento consolida las pruebas de generación realizadas para estudiar un sistema de terreno modular reutilizable en Árboris y las correcciones surgidas del protocolo de auditoría actualizado.

El objetivo no es definir aún un tileset final, sino separar:

- la lógica espacial autoritativa;
- la geometría visual derivable;
- las superficies;
- los overlays;
- las limitaciones observadas de las herramientas generativas;
- las decisiones que todavía deben permanecer abiertas.

La investigación parte de la especificación vigente: el plano jugable puede componerse mediante unidades reutilizables o chunks, pero la autoridad espacial sigue siendo el `walkableEnvelope` y el blockout lógico. La apariencia visual no debe convertirse en una segunda fuente de verdad.

## 2. Corrección principal tras auditoría

La primera formulación de trabajo utilizó seis familias geométricas visuales (`G1–G6`) como si fueran entidades fundamentales del sistema.

Las pruebas posteriores mostraron que esa formulación añadía complejidad innecesaria.

Gran parte de esas formas pueden derivarse directamente de:

- elevación;
- vecindad;
- ausencia/presencia de terreno vecino;
- conexiones transitables entre regiones o celdas.

Por tanto, la gramática simplificada pasa a ser:

```text
WORLD LOGIC
= WALKABLE ENVELOPE
+ ELEVATION
+ CONNECTIONS

VISUAL TERRAIN
= DERIVED GEOMETRY
+ SURFACE
+ OVERLAYS
```

Esta formulación reemplaza como hipótesis principal a:

```text
TERRAIN CELL =
GEOMETRY
+ SURFACE
+ OVERLAY[0..N]
```

cuando `GEOMETRY` era tratada como un inventario manual de piezas independientes.

La simplificación no elimina modularidad; cambia su nivel de autoridad.

## 3. Fuente de verdad y derivación

La relación correcta de trabajo es:

```text
FUENTE DE VERDAD ESPACIAL
→ REGLAS DERIVADAS
→ REPRESENTACIÓN VISUAL
```

Se mantiene:

```text
walkableEnvelope = autoridad espacial de navegación
cells/tiles      = derivación técnica / arte / implementación
```

La topología y la elevación deben gobernar la representación, no al revés.

### 3.1 Modelo lógico mínimo propuesto

```text
CELL / REGION
- elevationBand
- walkability
- neighbours
- surfaceRef (si corresponde)

CONNECTION
- from
- to
- traversable
- elevationDelta
- transitionRepresentation = OPEN
```

La forma concreta de implementar `CELL / REGION` sigue abierta. Puede materializarse mediante grid, regiones, chunks, tilemap u otra solución compatible con el renderer elegido.

## 4. Geometría visual derivada

Las pruebas `08A–08D` produjeron seis categorías visuales útiles, pero la auditoría concluye que no todas deben existir como entidades lógicas separadas.

La nueva lectura es:

| Categoría histórica | Nuevo estado | Derivación |
| --- | --- | --- |
| G1 Flat | patrón visual derivado | vecino compatible a igual elevación / superficie continua |
| G2 Straight Edge | patrón visual derivado | un lado sin vecino compatible o con vecino inferior |
| G3 Outer Corner | patrón visual derivado | dos lados adyacentes expuestos |
| G4 Inner Corner | patrón visual derivado | configuración cóncava de vecindad/elevación |
| G5 Elevation Transition | **conexión lógica; representación abierta** | conexión transitable entre niveles con `elevationDelta` válido |
| G6 Stackable Body | patrón visual derivado | diferencia de elevación mayor / cuerpo vertical acumulado |

Estas categorías se conservan como vocabulario de revisión visual, no como seis fuentes de verdad independientes.

## 5. Lección específica de G5

La prueba `08D` buscó verificar si una única transición de elevación podía reproducirse como el mismo asset exacto bajo rotación.

El generador produjo variantes estructuralmente distintas.

La conclusión permitida es:

```text
LIMITACIÓN DE HERRAMIENTA:
el generador no preservó de forma fiable una geometría exacta de transición bajo rotación.
```

No se deriva de esa prueba que:

- Árboris necesite obligatoriamente un asset manual G5;
- la transición deba implementarse como sprite;
- el renderer deba usar una rampa concreta;
- la arquitectura de navegación deba cambiar.

Por protocolo, esas decisiones permanecen `PENDIENTE`.

La representación final de una conexión entre elevaciones se decidirá cuando exista suficiente información sobre renderer, navegación, colisiones, escala y arte de producción.

## 6. Superficies

La separación de `SURFACE` sí sobrevivió la auditoría.

Una superficie representa el estado visual/material del suelo y no modifica por sí sola la topología ni la elevación.

Ejemplos experimentales:

- suelo seco compacto;
- suelo pedregoso;
- cobertura herbácea dispersa;
- mayor cobertura de matorral;
- sendero natural desgastado.

Regla:

```text
SURFACE no redefine ELEVATION.
SURFACE no redefine WALKABILITY salvo regla lógica explícita fuera del arte.
```

El sendero funciona mejor como estado superficial:

- compactación;
- menor vegetación;
- grava sutil;
- desgaste irregular.

No debe convertirse automáticamente en:

- pavimento;
- carretera elevada;
- escalera manufacturada;
- pieza arquitectónica especial.

## 7. Overlays

Los overlays permanecen conceptualmente separados de la lógica de terreno.

Incluyen, según el caso:

- pastos;
- piedras;
- arbustos;
- árboles;
- props ambientales.

Reglas:

```text
OVERLAY no redefine ELEVATION.
OVERLAY no redefine WALKABILITY salvo dato lógico explícito.
OVERLAY puede cruzar visualmente límites de celdas/regiones.
```

El cruce visual de límites sirve para naturalizar el mundo sin convertir el overlay en autoridad geométrica.

## 8. Modularidad visible vs. naturalización

Las primeras pruebas mostraron que dibujar cada celda produce lectura de tablero, voxel o maqueta.

Las mejores pruebas conservaron una lógica modular pero ocultaron seams innecesarios mediante continuidad superficial y overlays.

Objetivo visual de trabajo:

> El jugador debe percibir primero un paisaje natural; la modularidad debe inferirse por consistencia estructural, no por una rejilla dibujada.

La cuadrícula, si existe, es una herramienta de construcción/implementación y no una obligación gráfica.

## 9. Vegetación e identidad ecológica

La generación libre de ambientes secos tendió a introducir coníferas, agaves/yuccas, cactus genéricos, bonsáis o siluetas de sabana.

Esto demuestra una limitación de la generación libre, no una propiedad del sistema espacial.

La identidad ecológica deberá apoyarse en referencias vegetales canónicas y assets aprobados cuando se abra esa fase.

No usar vegetación generada libremente para validar geometría, conectividad o elevación.

## 10. Pixel art y resolución de previews

Las herramientas de generación utilizadas no obedecieron de forma fiable solicitudes exactas de `1920×1080`.

Conclusiones permitidas:

- la preview generada no certifica resolución lógica;
- la apariencia pixelada no certifica pixel art de producción;
- la preview no certifica escala de tile, sprite o chunk;
- la preview no certifica geometría exacta.

Esto es coherente con `ENVIRONMENT_PRODUCTION_SPEC.md`, que separa viewport, extensión de mapa, escala lógica y master de assets.

## 11. Evidencia experimental acumulada

### Pruebas iniciales

Demostraron que la palabra `cubic` inducía a mundos de cajas visibles y que la retícula dibujada dominaba demasiado la composición.

### Pruebas de capas

Separar terreno, surface y overlays produjo resultados visualmente más reutilizables.

### 08A v2

Demostró que el generador puede materializar categorías visuales de terreno coherentes en una misma proyección.

### 08B

Demostró que una misma gramática visual puede construir una quebrada con elevaciones y bordes repetibles.

### 08C

Demostró que la gramática puede producir una topología distinta (meseta abierta) sin abandonar el lenguaje general.

### 08D

Demostró que el generador no conserva de forma fiable una transición geométrica exacta bajo rotación.

Interpretación correcta:

```text
same visual grammar      = demostrado
same exact generated asset = no demostrado
```

## 12. Estados según protocolo actualizado

### EXISTENTE

- el blockout lógico es independiente del arte;
- el `walkableEnvelope` es autoridad espacial de navegación;
- el piloto usa lenguaje visual 2.5D/isométrico y terrazas/modularidad naturalizadas;
- renderer y pathfinding definitivos no están seleccionados;
- escala de sprite/tile/chunk sigue `OPEN`;
- una imagen generada no certifica asset de producción.

### DERIVADA

- bordes, esquinas y cuerpos verticales pueden tratarse como representación derivada de elevación y vecindad;
- separar `SURFACE` y `OVERLAY` evita duplicar geometría y favorece reutilización;
- la retícula puede gobernar implementación sin aparecer visualmente;
- las pruebas geométricas deben excluir decoración cuando esta pueda ocultar mutaciones.

### PROPUESTA

- usar `elevationBand`, vecindad y `CONNECTIONS` como base mínima para derivar terreno visual;
- modelar senderos como `surface state`;
- permitir overlays que crucen límites visuales de celdas/regiones;
- mantener las categorías históricas G1–G6 solo como vocabulario de revisión visual.

Estas propuestas requieren aprobación/validación posterior y no son canon automático.

### PENDIENTE

- representación técnica exacta de cells/regions;
- dimensiones nativas de cualquier tile/chunk;
- unidad vertical exacta;
- pitch/yaw/proyección numérica;
- conectores de navegación definitivos;
- representación de transiciones entre elevaciones;
- rotaciones de assets si se usan;
- colisiones;
- orden de dibujo/oclusiones;
- anclaje/footprint de overlays;
- relación personaje/terreno;
- formato técnico de surfaces;
- límite entre world art y distant art;
- agua y otros tipos de terreno;
- implementación concreta en renderer.

### LIMITACIONES DE HERRAMIENTA OBSERVADAS

- resolución exacta de preview no fiable;
- tendencia a introducir texto aunque se prohíba cuando el prompt contiene códigos visibles;
- tendencia a reinterpretar geometrías exactas como categorías visuales;
- tendencia a introducir flora genérica de biomas secos si no se restringe con referencias.

Estas limitaciones no deben convertirse por sí solas en requisitos de arquitectura.

## 13. Auditoría consolidada

### Auditoría

La gramática simplificada es más coherente con la arquitectura vigente que el inventario rígido G1–G6.

No introduce una segunda fuente de verdad espacial y conserva el `walkableEnvelope` como autoridad.

### Atribución

Los hallazgos de 08D pertenecen a la categoría **LIMITACIÓN DE HERRAMIENTA**, no a arquitectura ni canon.

Las categorías G1–G6 pertenecen a **VOCABULARIO VISUAL EXPERIMENTAL**.

La elevación y la conectividad pertenecen al **MODELO ESPACIAL / BLOCKOUT**.

### Inconsistencias

Corregida la inconsistencia de tratar patrones derivados como entidades lógicas independientes.

Corregida la conclusión prematura de que G5 debía convertirse obligatoriamente en asset manual.

### Vacíos / omisiones

Permanece abierto cómo representar técnicamente las transiciones de altura y cómo derivará el renderer las formas visuales finales.

Estos vacíos se mantienen explícitos; no se rellenan mediante inferencia.

### Redundancias / simplificación

Se elimina la necesidad conceptual de mantener seis familias geométricas como fuentes de verdad paralelas.

Se reduce el sistema a:

```text
WORLD LOGIC
→ DERIVED GEOMETRY
→ SURFACE
→ OVERLAYS
```

Esta simplificación preserva funcionalidad, evidencia y trazabilidad.

### Correcciones realizadas

- retirada la dependencia conceptual de `G1–G6` como núcleo lógico;
- G1–G4 y G6 reclasificados como patrones visuales derivados;
- G5 reclasificado como conexión lógica entre elevaciones con representación `OPEN`;
- incorporada categoría `LIMITACIÓN DE HERRAMIENTA`;
- retirada la recomendación de congelar manualmente G5 como consecuencia automática de 08D;
- mantenida la separación Surface/Overlay.

### Nueva validación

Después de la simplificación:

- no aparece contradicción con `ENVIRONMENT_PRODUCTION_SPEC.md`;
- no se reemplaza `walkableEnvelope` por tiles como autoridad;
- no se convierte una falla del generador en decisión arquitectónica;
- se reduce complejidad conceptual;
- los pendientes permanecen visibles.

## 14. Próximo gate

El siguiente gate ya no debe intentar reproducir G5.

Debe responder:

> ¿Puede un blockout simple definido por elevación, vecindad y conexiones producir de forma consistente una representación visual con superficies continuas, bordes, esquinas y cuerpos verticales sin introducir geometría lógica adicional?

La prueba debe mantener separado:

```text
INPUT LÓGICO
→ representación derivada
```

No debe pedir al generador que invente el modelo espacial.

## 15. Regla de avance

Antes de abrir `Surface Grammar v0.1`, realizar una prueba de derivación desde blockout lógico.

No fijar todavía:

- asset maestro de transición;
- renderer;
- métrica definitiva de tile;
- colisiones finales;
- biomas completos.

El propósito inmediato es validar que la representación visual puede derivarse de una lógica espacial mínima sin convertirse en una segunda fuente de verdad.
