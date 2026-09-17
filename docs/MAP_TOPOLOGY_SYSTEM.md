# Árboris — Sistema de conectividad y patrones de mapas

## Estado

Marco provisional corregido para describir navegación de mapas conectados sin confundir cardinales geográficos, bordes de pantalla, forma de ruta, función jugable, cámara, interacción y conectividad.

No define todavía tamaño de mapa, cantidad de tiles, costes de movimiento, pathfinding, renderer ni formato final de datos.

## 1. Principio central

Los mapas jugables de Árboris deben percibirse como **fragmentos conectados de un territorio continuo**, no como islas flotantes, dioramas aislados ni arenas autocontenidas.

La autoridad del sistema es la **conectividad explícita + walkable envelope continuo**. Las etiquetas como `corridor` o `junction` y las matrices de celdas son derivados descriptivos/de prueba.

## 2. Región transitable y discretización

El mundo puede discretizarse para pruebas o implementación, pero la forma transitable no nace obligatoriamente de una grilla.

```text
walkable envelope / región transitable
        ↓
rasterización o discretización reproducible
        ↓
celdas/tiles cuando sean útiles
```

La grilla puede sostener en el futuro pathfinding, elevación relativa, interacción, puntos de observación u otras reglas técnicas. No debe obligar a que senderos, claros, cauces o pendientes adopten una geometría artificial de tablero.

**Regla:** mundo continuo en apariencia y relaciones; discretización derivada en funcionamiento cuando sea necesaria.

`click-to-move`, navegación directa, GPS u otro control permanecen decisiones de implementación/producto; este sistema no selecciona uno.

## 3. Puertos de conexión

Cada conexión de borde se declara como puerto local del mapa:

```text
id
localEdge: screen_up | screen_down | screen_left | screen_right
state: open | closed | conditional
priority: primary | secondary | none
progressionRole: entry | exit | return | optional | none
directionality: bidirectional | one_way
worldBearing: optional / OPEN
```

Esto evita llamar `north` a un borde solo porque aparece arriba en pantalla.

Una conexión abierta debe llegar realmente al borde mediante región transitable continua.

## 4. Cardinalidad geográfica

`north`, `south`, `east` y `west` se reservan para orientación territorial cuando exista evidencia suficiente.

La proyección isométrica y la orientación artística pueden hacer que un cardinal geográfico no coincida con una dirección de pantalla.

Para el piloto:

```text
screen_up   = cordillera / interior / progresión
screen_down = entrada / dirección general hacia el mar / retorno
worldCardinalMapping = OPEN
```

## 5. Patrones derivados de conectividad

### `corridor`
Dos puertos abiertos y una ruta dominante entre ellos.

### `junction`
Tres puertos abiertos con al menos una diferencia clara de prioridad o función.

### `crossroad`
Cuatro puertos abiertos. No implica que las cuatro ramas sean equivalentes.

### `pocket`
Un acceso principal con espacio terminal o desvío que obliga a regresar por el mismo acceso.

Estas etiquetas resumen conectividad; no sustituyen los puertos ni la región transitable.

## 6. Forma de ruta

La geometría visual de la ruta se describe por separado:

```text
straight
bend
meander
unknown
```

La categoría histórica `elbow` se normaliza como:

```text
patternLabel: corridor
routeShape: bend
```

Un corredor puede ser recto, curvo o serpentear sin cambiar su conectividad.

## 7. Función espacial

`hub` no define una topología única. Describe una función de permanencia o redistribución.

Registrar esa función como `experienceRole` o atributo de la Unidad Espacial/Instancia, por ejemplo:

```text
experienceRole: rest | transit | tutorial | exploration | discovery | redistribution
```

Un hub puede tener tres, cuatro o más conexiones; por eso no debe competir con `junction` o `crossroad` como categoría geométrica.

## 8. Progresión y movimiento

Separar de la conectividad:

```text
movementProfile: level | ascent | descent | mixed | transition
progressionRole: entry | exit | return | optional | none
```

Una ruta puede ser bidireccional físicamente y cumplir rol de `return` en una dirección de progreso. Por eso `return` no debe funcionar como sustituto de estado de conexión.

## 9. Cámara e invariantes de pantalla

Cuando un mapa depende de relaciones visuales persistentes, la navegación se valida junto con un Camera Contract.

Para `MAP-001`, el perfil provisional es:

```text
profileId: PILOT_FIXED_ISOMETRIC
orientationPolicy: fixed
rotationPolicy: disabled
followPolicy: allowed
panPolicy: allowed
zoomPolicy: testable / OPEN
```

El contrato de cámara conserva las relaciones canónicas de pantalla; no define todavía grados, FOV o renderer.

## 10. Interacción y aprendizaje

El sistema topológico no define contenido botánico, pero una Instancia puede reservar `interactionSlots` y `observationOpportunities` sobre la región transitable.

Estos slots no equivalen a colocar una especie concreta. Permiten verificar que el mapa puede sostener el loop de Árboris sin inventar microhábitat o distribución.

## 11. Contrato mínimo de blockout

Antes de estilizar deben existir decisiones deterministas sobre:

- puertos abiertos/cerrados;
- prioridad y función de cada puerto;
- walkable envelope;
- ruta principal;
- rutas secundarias cuando existan;
- cambios de elevación relativa;
- transiciones entre niveles;
- bloqueos;
- nodos de decisión;
- rasgos territoriales obligatorios;
- interaction slots requeridos;
- cámara prevista;
- player proxy para lectura/oclusiones.

Las paredes, roca, vegetación densa o agua pueden traducir visualmente un bloqueo, pero no modificar silenciosamente el contrato.

## 12. Vegetación, especies y navegación

No toda vegetación equivale a bloqueo.

Se mantienen tres funciones conceptuales:

- vegetación bloqueante;
- vegetación transitable;
- vegetación contextual.

La distribución final debe apoyarse en referencias reales. Las imágenes generadas no constituyen evidencia botánica o ecológica.

```text
peso de presencia = prioridad visual basada en conteos disponibles
evidencia territorial = observación o registro asociado a una unidad concreta
```

Un peso alto no permite fijar microhábitat ni posición exacta sin evidencia territorial.

## 13. Flujo de producción

```text
función jugable
→ puertos + walkable envelope + prioridades
→ Camera Contract + Interaction/Learning Contract cuando correspondan
→ blockout determinista
→ referencias ambientales
→ estilización
→ validación contra contratos
→ revisión de dirección de arte
→ asset de producción
```

La IA puede interpretar arte y ambiente, pero no decidir silenciosamente conectividad, transitabilidad, especies reales ni reglas ecológicas.

## 14. Dirección visual provisional

Se mantiene la baseline ya validada:

- vista isométrica ortográfica/provisional;
- mundo continuo;
- relieve estratificado con alturas legibles;
- senderos y terrazas integrados;
- cuadrícula sutil o ausente en arte final;
- ilustración estilizada, no fotorealista;
- vegetación en manchas irregulares;
- continuidad más allá del encuadre.

Estas decisiones son provisionales y no seleccionan renderer.

## 15. Validación

Cada prueba debe revisar al menos:

1. puertos correctos;
2. conectividad preservada;
3. walkable envelope preservado;
4. ausencia de conexiones inventadas;
5. ruta principal legible;
6. continuidad de mundo;
7. lectura de elevación;
8. naturalidad del relieve;
9. invariantes de cámara preservados;
10. player proxy legible y sin oclusión crítica;
11. interaction slots utilizables;
12. coherencia ambiental;
13. identidad Árboris.

La calidad visual no compensa un error de conectividad o de contrato.

## 16. Matriz de pruebas corregida

Las pruebas estructurales mínimas quedan:

```text
TEST-MAP-01 corridor / straight or mild meander
TEST-MAP-02 corridor / bend
TEST-MAP-03 junction / 3 ports
TEST-MAP-04 crossroad / 4 ports
TEST-MAP-05 pocket / 1 access + return
```

`hub` se prueba más adelante como función de experiencia sobre una conectividad explícita, no como patrón topológico independiente.

## 17. MAP-001

Para `IT-001 / MAP-001`:

```text
patternLabel: corridor
routeShape: OPEN

P-IN:
  localEdge: screen_down
  state: open
  priority: primary
  progressionRole: entry

P-OUT:
  localEdge: screen_up
  state: open
  priority: primary
  progressionRole: exit

screen_up: cordillera / interior
screen_down: entrada / dirección mar
worldCardinalMapping: OPEN
```

No existen conexiones laterales autorizadas en esta fase.

La matriz de prueba de MAP-001 es una discretización verificable del `walkableEnvelope`, no su geometría territorial maestra.
