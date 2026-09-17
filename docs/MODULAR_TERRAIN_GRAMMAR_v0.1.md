# Árboris — Gramática modular de terreno v0.1

**Fecha:** 2026-09-17  
**Estado:** experimental / propuesta de trabajo  
**Alcance:** plano jugable `02-world`; no reemplaza `ENVIRONMENT_PRODUCTION_SPEC.md` ni constituye canon final de arte, renderer o navegación.

## 1. Propósito

Este documento consolida las pruebas de generación realizadas para estudiar un sistema de terreno modular reutilizable en Árboris.

El objetivo no es definir aún un tileset final, sino separar con claridad:

- qué comportamiento ya fue demostrado experimentalmente;
- qué decisiones siguen siendo propuestas;
- qué elementos permanecen abiertos;
- qué debe validarse antes de avanzar a superficies, vegetación u otros overlays.

La investigación parte de la necesidad ya establecida en `ENVIRONMENT_PRODUCTION_SPEC.md`: el plano jugable debe poder componerse con unidades reutilizables o chunks, sin confundir una captura visual con el master del mapa y sin convertir la cuadrícula técnica en autoridad espacial por encima del `walkableEnvelope`.

## 2. Resultado principal de la exploración

La expresión inicial **"tiles cúbicos"** resultó demasiado restrictiva y tendió a producir cajas visibles, mundos voxelados o dioramas.

La formulación de trabajo que mejor sobrevivió las pruebas es:

> **módulos volumétricos discretos de terreno, alineados sobre una retícula regular, con huella superior estandarizada, alturas modulares, superficies intercambiables y overlays independientes.**

La gramática conceptual de trabajo es:

```text
TERRAIN CELL =
GEOMETRY
+ SURFACE
+ OVERLAY[0..N]
```

con:

```text
GEOMETRY =
TOP FOOTPRINT
+ ELEVATION
+ BODY / EDGE PROFILE
```

### Responsabilidades

```text
GEOMETRY
- huella superior
- altura/elevación
- conectividad
- borde/perfil volumétrico
- relación con módulos vecinos

SURFACE
- estado visible del suelo
- textura superficial
- cobertura baja
- desgaste / sendero

OVERLAY
- pastos
- piedras
- arbustos
- árboles
- otros elementos ambientales independientes
```

Reglas derivadas de esta separación:

```text
SURFACE no redefine GEOMETRY.
OVERLAY no redefine ELEVATION.
GRID gobierna ensamblaje; GRID no implica líneas visibles.
```

Los overlays pueden cruzar visualmente límites de celdas para naturalizar el mundo, siempre que su anclaje lógico y la geometría subyacente permanezcan consistentes.

## 3. Relación con el sistema espacial vigente

Esta gramática no reemplaza la autoridad espacial documentada.

Se mantiene:

```text
walkableEnvelope = autoridad espacial de navegación
cells/tiles      = derivación técnica / arte / implementación
```

Por lo tanto:

- la modularidad de arte no puede redefinir silenciosamente transitabilidad;
- la naturalización visual no puede alterar puertos, rutas o interaction slots aprobados;
- la implementación final puede usar tiles, chunks, sprites, meshes u otra combinación;
- la escala definitiva de tile, chunk y sprite permanece abierta hasta validación de producción.

## 4. Aprendizajes visuales consolidados

### 4.1 Modularidad visible vs. naturalización

Las primeras pruebas mostraron que dibujar cada celda produce una lectura de tablero o maqueta.

Las mejores pruebas mantuvieron el sistema modular estructuralmente, pero permitieron que superficies y overlays ocultaran seams innecesarios.

Objetivo visual de trabajo:

> El jugador debe percibir primero un paisaje natural; la modularidad debe inferirse por consistencia estructural, no por una rejilla dibujada.

### 4.2 Senderos

Los senderos funcionan mejor como **estado superficial** del terreno:

- suelo compactado;
- vegetación reducida;
- grava sutil;
- desgaste irregular.

No se consideran válidos como solución automática:

- caminos adoquinados;
- carreteras elevadas;
- escaleras manufacturadas;
- piezas arquitectónicas no previstas.

### 4.3 Vegetación

La generación libre de ambientes secos tendió a introducir coníferas, agaves/yuccas, cactus genéricos, bonsáis o siluetas de sabana.

Esto confirma que la identidad ecológica no debe dejarse a inferencia libre del generador. En fases posteriores deberá apoyarse en referencias vegetales canónicas y assets aprobados.

Durante la validación geométrica se excluye vegetación para no ocultar mutaciones estructurales.

### 4.4 Resolución de previews generadas

Las herramientas de generación utilizadas no obedecieron de forma fiable solicitudes exactas de `1920×1080`.

Conclusión: la resolución de una preview generada no certifica escala de producción ni pixel art real. Para esta fase conceptual, la resolución exacta no es criterio de aceptación geométrica.

Esto es consistente con `ENVIRONMENT_PRODUCTION_SPEC.md`, que separa viewport, extensión del mapa, escala lógica y master de assets.

## 5. Geometry Lock — inventario experimental v0.1

La prueba `08A v2` produjo un kit visual de seis familias estructurales con proyección y escala coherentes.

Inventario de trabajo:

```text
G1 — Flat
G2 — Straight Edge
G3 — Outer Corner
G4 — Inner Corner
G5 — Natural Elevation Transition
G6 — Stackable Body
```

### Estado actual

| Familia | Estado experimental | Observación |
| --- | --- | --- |
| G1 Flat | estable | huella superior y volumen reproducidos de forma consistente |
| G2 Straight Edge | estable | borde expuesto reutilizable reconocido en ensamblajes |
| G3 Outer Corner | estable | esquina convexa reproducida con suficiente consistencia |
| G4 Inner Corner | provisionalmente estable | función topológica reconocible, requiere futura validación medible |
| G5 Natural Elevation Transition | **abierto / no validado** | el generador reinterpreta la transición: masa erosionada, rampa o casi escalera |
| G6 Stackable Body | estable | el cuerpo apilable conserva bien la lógica vertical |

"Estable" aquí significa **estabilidad experimental de la familia**, no aprobación canónica ni asset final.

## 6. Evidencia de reconstruibilidad

### 08A v2 — kit aislado

Validó que el modelo puede materializar seis familias como bloques de terreno visuales, en vez de limitarse a producir diagramas o etiquetas.

### 08B — quebrada

Usando el kit como referencia maestra, el modelo produjo una composición distinta con repetición visible de flats, bordes, esquinas y cuerpos apilables.

Resultado:

```text
same grammar      = demostrado
same exact assets = demostrado parcialmente
```

### 08C — meseta abierta

Produjo una topología distinta de 08B conservando gran parte del vocabulario estructural.

Esto demuestra reutilización de la **gramática** más allá de una única composición.

Sin embargo, G5 mutó dentro de la misma prueba y apareció una transición similar a escalones, por lo que no puede considerarse congelada.

## 7. Decisiones y estados según el manual de prompts

### EXISTENTE

- el mundo jugable debe conservar blockout lógico independiente del arte;
- la autoridad de navegación es el `walkableEnvelope`;
- el lenguaje visual piloto es 2.5D/isométrico y puede usar terrazas/modularidad naturalizadas;
- no existe aún selección definitiva de renderer/pathfinding;
- escala de sprite/tile/chunk continúa `OPEN`;
- una imagen generada pixelada no certifica pixel art de producción.

### DERIVADA

- separar `GEOMETRY`, `SURFACE` y `OVERLAY` favorece reutilización y evita hornear todas las combinaciones en assets únicos;
- la retícula debe gobernar construcción sin obligar a una rejilla visible;
- la composición debe adaptarse al kit, no deformar silenciosamente el kit para resolver cada mapa;
- durante validación estructural, decoración y vegetación deben retirarse para no ocultar errores.

### PROPUESTA

- adoptar la gramática `GEOMETRY + SURFACE + OVERLAY` para el plano jugable;
- usar huella superior estandarizada;
- usar bandas discretas de elevación;
- mantener provisionalmente G1–G6 como inventario geométrico de prueba;
- modelar senderos como surface state;
- permitir overlays con desborde visual entre celdas.

Estas propuestas requieren aprobación/validación posterior y no son canon automático.

### PENDIENTE

- dimensiones nativas exactas del footprint;
- unidad vertical exacta;
- resolución nativa de tile;
- pitch/yaw/proyección numérica;
- conectores y reglas de vecindad;
- rotaciones válidas por familia;
- colisiones;
- orden de dibujo/oclusiones;
- anclaje y footprint de overlays;
- relación personaje/tile;
- representación técnica de surfaces;
- límite entre tilemap y distant art;
- agua y otros tipos de terreno;
- implementación concreta en renderer;
- definición final de G5.

## 8. Auditoría consolidada

### Auditoría

La arquitectura modular es coherente con la especificación de producción vigente y no reemplaza la autoridad espacial del blockout.

Las pruebas demuestran una gramática visual reutilizable y reconstruibilidad parcial. Todavía no demuestran que todas las familias puedan conservarse como assets geométricos exactos bajo composición libre.

El bloqueo actual se concentra en G5.

### Inconsistencias

1. **Terminología:** `cubic tile` no describe adecuadamente el sistema; usar `modular volumetric terrain tile` durante esta fase.
2. **G5:** fue descrita como `ramp`, `step` y `transition`, permitiendo reinterpretación. Queda unificado provisionalmente como **Natural Elevation Transition** hasta resolver su geometría.
3. **Naturalización vs. identidad del asset:** demasiada erosión libre puede destruir repetibilidad. Geometría maestra y tratamiento visual deben mantenerse separados.
4. **Mapa vs. kit:** el principio obligatorio de prueba es:

```text
THE MAP ADAPTS TO THE KIT.
THE KIT DOES NOT ADAPT TO THE MAP.
```

### Vacíos / omisiones

La gramática todavía no dispone de una especificación matemática de módulos ni de conectores de borde.

Falta definir para cada familia:

```text
top footprint
height unit
edge/port types
allowed rotations
valid neighbours
```

G4 requiere validación medible posterior y G5 sigue abierta.

### Redundancias

Los prompts experimentales crecieron con prohibiciones repetidas y contexto innecesario. A partir de este checkpoint deben separarse:

```text
MODULAR TERRAIN GRAMMAR → reglas persistentes
GENERATION TEST         → experimento puntual
```

Los prompts ya no deben actuar como documentación maestra.

### Correcciones realizadas

- retirada la expresión `cubic tiles` como término principal;
- consolidada la separación Geometry / Surface / Overlay;
- congeladas provisionalmente G1, G2, G3 y G6 como familias estables experimentales;
- G4 queda provisionalmente estable;
- G5 queda explícitamente abierta;
- suspendido el avance a Surface/Overlay hasta resolver el gate geométrico;
- retirada la resolución de preview como criterio de validación geométrica.

### Nueva validación

Después de estas correcciones:

- no aparece contradicción con `ENVIRONMENT_PRODUCTION_SPEC.md`;
- no se reemplaza el `walkableEnvelope` por una grilla como fuente de verdad;
- se distingue claramente evidencia experimental de decisión canónica;
- se mantiene abierto todo parámetro que todavía no tiene evidencia suficiente;
- el siguiente gate queda reducido a una sola pregunta verificable: la reproducibilidad de G5.

## 9. Gate siguiente — G5

No avanzar todavía a superficies, vegetación ni biomas.

La siguiente prueba debe responder:

> ¿Puede `G5 — Natural Elevation Transition` existir como un único módulo estructural reproducible bajo rotación, sin convertirse en rampas, escaleras o variantes geométricas nuevas?

### Resultado A — reproduce la misma geometría

La `Geometry Grammar v0.1` puede considerarse **validada experimentalmente** y se abre el bloque `Surface Grammar v0.1`.

### Resultado B — genera variaciones estructurales

No seguir intentando estabilizar G5 solo mediante prompt.

La conclusión será:

```text
G5 debe definirse/congelarse como asset geométrico maestro.
La IA puede aplicar tratamiento visual o textura,
pero no decidir su estructura.
```

## 10. Regla de avance

Hasta cerrar el gate G5:

- no crear nuevas familias geométricas;
- no añadir surfaces definitivas;
- no añadir overlays de producción;
- no ampliar a nuevos biomas;
- no convertir este documento en canon final.

El propósito inmediato es terminar de demostrar qué parte del sistema puede ser generativa y qué parte debe ser determinista/autorizada por arte y diseño.
