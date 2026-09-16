# Árboris — Sistema de topología y conectividad de mapas

## Estado

**Marco de diseño provisional consolidado.** Este documento fija las decisiones estructurales obtenidas de las pruebas visuales de escenarios isométricos realizadas en septiembre de 2026.

No define todavía tamaño de mapa, cantidad de tiles, costes de movimiento, pathfinding, renderer ni formato final de datos. Esas decisiones permanecen `OPEN` hasta probar blockouts deterministas y prototipos reales.

## 1. Principio central

Los mapas jugables de Árboris deben percibirse como **fragmentos conectados de un territorio continuo**, no como islas flotantes, dioramas aislados ni arenas autocontenidas.

La experiencia buscada es de exploración territorial: el jugador entra a una zona, recorre senderos y microambientes, encuentra puntos de interés y puede continuar hacia otras zonas por uno o más bordes del mapa.

La inspiración funcional proviene de juegos de exploración por zonas conectadas, mientras que la claridad isométrica y la lectura de alturas pueden tomar aprendizajes de RPG tácticos. El resultado debe desarrollar un lenguaje propio de Árboris.

## 2. Regla de cuadrícula

La cuadrícula es **estructura lógica**, no protagonista visual.

El mapa puede usar una lógica de tiles para:

- click-to-move;
- pathfinding;
- altura;
- transitabilidad;
- interacción;
- puntos de observación;
- futuras reglas de terreno.

En reposo, la grilla puede integrarse visualmente al suelo. Puede enfatizarse cuando el jugador selecciona movimiento, destino o interacción.

**Regla:** mundo continuo en apariencia; tiles discretos en funcionamiento.

## 3. Conectividad cardinal

Cada fragmento puede conectarse hacia cualquiera de los cuatro sentidos cardinales:

- `north`;
- `south`;
- `east`;
- `west`.

No todos los mapas deben abrir los cuatro bordes.

Cada conexión declara un rol independiente:

- `none` — sin conexión transitable;
- `primary` — progresión principal;
- `secondary` — exploración o rama secundaria;
- `return` — ruta principalmente asociada al regreso;
- `conditional` — conexión existente pero condicionada por estado o progresión futura.

La cantidad de conexiones y su rol deben responder a la función del mapa, no a simetría visual.

## 4. Topologías iniciales

`mapTopology` describe la forma general de conectividad. No reemplaza la declaración individual de cada conexión.

### `corridor`

Dos bordes conectados con una ruta dominante. Puede ser recto o responder al relieve.

### `elbow`

Dos bordes conectados en cambio de dirección. El giro debe surgir de la geografía y no de un ángulo artificial impuesto visualmente.

### `junction`

Tres bordes conectados. Debe existir jerarquía clara entre progresión principal y ramas secundarias.

### `crossroad`

Cuatro bordes conectados. Es un nodo de navegación de mayor complejidad y no debe convertirse en la topología por defecto.

### `pocket`

Zona de entrada y retorno o desvío corto. Adecuada para miradores, observaciones, hallazgos, coleccionables o eventos ambientales.

### `hub`

Nodo local de mayor permanencia o redistribución. Su uso debe justificarse por gameplay; no debe aparecer solo porque la IA genere una explanada central.

## 5. Topología ≠ jerarquía de ruta

Una topología no determina automáticamente qué dirección es principal.

Ejemplo conceptual:

```text
mapTopology: junction
connections:
  north: primary
  south: return
  east: secondary
  west: none
```

La topología describe conectividad; los roles describen función jugable.

## 6. Cardinalidad del mundo vs. bordes de pantalla

En documentación y lógica del juego se mantienen `north`, `south`, `east`, `west`.

En imágenes isométricas generadas o blockouts visuales, los ejes pueden proyectarse diagonalmente. Para evitar ambigüedad durante generación asistida se puede describir temporalmente la conexión como:

- `upper-left edge`;
- `upper-right edge`;
- `lower-left edge`;
- `lower-right edge`.

El mapeo entre bordes de pantalla y cardinales del mundo debe definirse explícitamente en cada blockout o herramienta. No asumir que un generador visual conservará orientación cardinal por texto.

## 7. Contrato mínimo de blockout

Antes de estilizar un mapa deben existir decisiones deterministas sobre:

- topología;
- conexiones abiertas;
- rol de cada conexión;
- tiles transitables y no transitables;
- cambios de altura;
- transiciones entre niveles;
- ruta principal;
- rutas secundarias cuando existan;
- zonas de interés o detour cuando corresponda.

Una conexión abierta debe llegar realmente al borde del fragmento mediante tiles transitables contiguos. No basta con sugerir visualmente un sendero.

Las paredes, roca alta, vegetación densa u otros bloqueos pueden traducir visualmente un tile no transitable, pero no deben modificar silenciosamente la topología aprobada.

## 8. Vegetación y navegación

No toda vegetación equivale a bloqueo.

Se distinguen al menos tres funciones conceptuales:

- vegetación bloqueante: árboles, masas densas u objetos que impiden el paso;
- vegetación transitable: hierbas, plantas bajas, piedras pequeñas u otros elementos dentro de una casilla caminable;
- vegetación contextual: elementos fuera del espacio jugable o usados para profundidad y continuidad visual.

La distribución final debe apoyarse en referencias ambientales reales. Las imágenes generadas no constituyen evidencia botánica o ecológica.

## 9. Flujo correcto de producción conceptual

La topología no debe ser inventada por el generador de imágenes.

Flujo recomendado:

```text
función jugable
→ contrato de topología
→ blockout determinista de tiles
→ referencias ambientales
→ estilización / exploración visual asistida
→ validación contra blockout
→ revisión de dirección de arte
→ asset de producción
```

Esto reemplaza el flujo anterior en el que un prompt textual pedía simultáneamente topología, relieve, vegetación y estilo.

## 10. Uso de IA generativa

La IA puede ayudar a:

- interpretar visualmente un blockout;
- proponer erosión, roca, suelo y agrupación vegetal;
- explorar estilo, atmósfera y composición;
- generar variantes controladas.

La IA no debe decidir silenciosamente:

- qué bordes están conectados;
- qué ruta es principal;
- qué tiles son caminables;
- la topología definitiva;
- especies botánicas como dato real;
- reglas ecológicas.

Si una imagen generada contradice el blockout, se considera una exploración fallida de topología aunque sea visualmente atractiva.

## 11. Dirección visual provisional validada

Las pruebas actuales apoyan provisionalmente:

- vista isométrica ortográfica;
- escenario como fragmento de mundo continuo;
- relieve estratificado con alturas legibles;
- senderos y terrazas integrados al paisaje;
- cuadrícula sutil;
- ilustración estilizada, no fotorealista;
- texturas pintadas y contorno discreto;
- vegetación en manchas irregulares;
- continuidad de paisaje más allá del encuadre.

Estas decisiones son una **baseline visual provisional**, no un estilo final cerrado.

## 12. Criterios de validación

Cada prueba debe revisarse al menos en:

1. fidelidad a la topología definida;
2. legibilidad de navegación;
3. continuidad de mundo;
4. lectura de alturas;
5. integración de la cuadrícula;
6. naturalidad del relieve;
7. coherencia ambiental;
8. claridad de conexiones;
9. identidad Árboris.

La fidelidad topológica es condición previa: una imagen no puede aprobarse como referencia de mapa si altera conexiones obligatorias.

## 13. Estado de las pruebas actuales

Las generaciones realizadas confirman que el lenguaje visual conectado es viable, pero también muestran que los prompts puramente textuales no garantizan topologías exactas.

Conclusión de fase:

**VALIDADO:** mundo conectado + navegación por tiles + isometría ambiental estilizada.

**NO VALIDADO:** generación textual como fuente fiable de topología exacta.

## 14. Próximo paso

Crear blockouts deterministas para, al menos:

- corredor;
- codo;
- junction de tres conexiones;
- cruce de cuatro conexiones.

Luego usar esos blockouts como referencia visual obligatoria en una nueva ronda de estilización externa y comprobar si el generador conserva exactamente las conexiones aprobadas.

No aumentar todavía la complejidad del esquema ni definir tamaños estándar de mapas hasta completar esa prueba.
