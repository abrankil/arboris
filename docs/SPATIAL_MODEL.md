# Árboris — Modelo espacial

## Estado

Modelo conceptual corregido para transformar territorios reales en espacios jugables reconocibles sin confundir escala territorial, evidencia, navegación, implementación y arte.

Este documento no fija todavía tamaño de celda, escala metro/celda, pathfinding, renderer ni esquema final de datos. Tampoco convierte una representación jugable en autoridad sobre el territorio real.

## Principio rector

Árboris no diseña mapas desde cero. **Destila territorios reales en espacios jugables reconocibles.**

La corrección principal de este modelo es separar tres planos que antes aparecían mezclados:

```text
A. TERRITORIO
Paisaje → Sector → Lugar → Unidad Espacial

B. DERIVACIÓN JUGABLE
Instancia Territorial → Contrato de Navegación → Blockout → Prototipo visual

C. IMPLEMENTACIÓN
celdas / tiles / objetos / navegación / renderer
```

Estos planos se relacionan, pero no forman una sola jerarquía.

## 1. Territorio, evidencia y derivación

```text
territorio real
→ evidencia registrada
→ síntesis territorial trazable
→ Unidades Espaciales + rasgos territoriales
→ Instancia Territorial
→ Contrato de Navegación
→ blockout determinista
→ Dirección de Arte
→ prototipo
→ evaluación
↺ revisión controlada
```

La revisión puede cambiar la derivación jugable o artística sin reescribir la evidencia. La evidencia solo cambia cuando aparece nueva información o se corrige una fuente.

## 2. Destilación Territorial

La **Destilación Territorial** conserva identidad reconocible mientras simplifica el lugar para hacerlo jugable.

Toda destilación debe declarar:

- qué rasgos se conservan;
- qué se simplifica;
- qué se omite;
- qué se enfatiza por legibilidad;
- qué permanece `OPEN` por falta de evidencia.

Una escena puede ser atractiva y aun así fallar si deja de sentirse como el lugar que representa.

## 3. Jerarquía territorial

La jerarquía territorial contiene únicamente entidades que describen el lugar real o una síntesis territorial de ese lugar:

```text
Paisaje
→ Sector
→ Lugar
→ Unidad Espacial
```

### Paisaje
Escala territorial amplia. Ejemplo: precordillera de Santiago.

### Sector
Área concreta del paisaje que actúa como ámbito de trabajo. Para el piloto: **Fundo Los Nogales / territorio núcleo del piloto**, conservando separada la nomenclatura oficial o contextual cuando corresponda.

### Lugar
Zona reconocible dentro del sector. Ejemplo: acceso principal.

### Unidad Espacial
Segmento o zona reconocible del recorrido que mantiene identidad territorial y experiencial suficiente para ser tratado como una unidad de diseño.

Una Unidad Espacial no es un objeto individual, un tile ni una versión del juego.

## 4. Rasgos territoriales

Dentro de un Lugar o de una Unidad Espacial existen **rasgos territoriales**. Pueden ser puntuales, lineales o de área.

Ejemplos:

- puente;
- reja;
- casa del conserje;
- sendero;
- estero;
- ladera;
- claro;
- afloramiento rocoso.

Para describir su geometría basta, cuando sea necesario, con una clase mínima:

```text
point | line | area | unknown
```

Esta distinción evita convertir cada objeto reconocible en una Unidad Espacial.

Un rasgo puede funcionar además como `anchorElement` cuando sea decisivo para reconocer el lugar.

## 5. Evidencia territorial

El modelo separa fuente, observación, interpretación y derivación.

```text
Google Earth / DEM / medición → evidencia topográfica
fotografías reales            → evidencia visual territorial
recuerdo de visitante          → evidencia experiencial
Master Botánico 2.0            → evidencia botánica
referencias ambientales        → evidencia ecológica/ambiental
```

Reglas:

- toda evidencia conserva procedencia;
- una captura aislada no autoriza una regla general;
- un recuerdo declarado no se convierte en hecho observado solo por ser plausible;
- una imagen generada nunca es evidencia territorial;
- el Master Botánico aporta información de especies, no geometría del lugar.

## 6. Estado de evidencia y estado de producción

No usar un único estado para describir dos cosas distintas.

### Estado de evidencia

```text
proposed
partially_corroborated
corroborated
```

Describe cuánto respaldo territorial tiene una Unidad Espacial o un rasgo.

### Estado de producción

```text
unmodeled
blockout
tested
approved
```

Describe cuánto ha avanzado su traducción jugable.

Una Unidad Espacial puede estar `corroborated` y todavía `unmodeled`, o seguir `proposed` mientras ya participa en un blockout experimental. Los dos ejes no deben pisarse.

## 7. Master Territorial

El **Master Territorial** sigue siendo un objetivo arquitectónico, no un archivo implementado.

Cuando exista, no debe mezclar hechos territoriales y decisiones de arte como si fueran equivalentes. Como mínimo deberá separar:

```text
evidencia / procedencia
síntesis territorial
Unidades Espaciales y rasgos
relaciones espaciales
Derivaciones jugables que los referencian
```

La Instancia Territorial, el blockout y el arte son derivados trazables del territorio; no deben reescribir silenciosamente la fuente territorial.

No crear todavía un Excel/JSON definitivo hasta que `IT-001 / MAP-001` demuestre qué campos son necesarios.

## 8. Instancia Territorial

La **Instancia Territorial** es una versión jugable de una o más Unidades Espaciales bajo una condición y un objetivo concretos.

Ejemplos:

```text
IT-001 Acceso Principal — entrada inicial/tutorial
IT-002 Acceso Principal — variante estacional futura
```

Una Instancia referencia Unidades Espaciales y rasgos territoriales; no forma parte de la jerarquía geográfica y no redefine el lugar real.

`MAP-*` queda reservado para blockouts, mapas o prototipos derivados.

## 9. Marcos de coordenadas

Árboris debe distinguir el marco territorial del marco local de juego.

### Marco territorial

Cuando existe evidencia suficiente puede contener:

- coordenadas geográficas;
- CRS o referencia espacial;
- orientación/bearing;
- elevación real;
- relaciones topográficas.

### Marco local de mapa

Define la lógica del blockout y la pantalla:

- `screenUp`;
- `screenDown`;
- `screenLeft`;
- `screenRight`;
- origen local;
- filas/columnas;
- bandas de elevación relativa.

No asumir que `screenUp = north`.

Para el piloto es canónico:

```text
screenUp   = cordillera / interior / progresión
screenDown = entrada / dirección general hacia el mar / retorno
```

La correspondencia exacta entre esos ejes y norte/sur/este/oeste geográficos permanece `OPEN` hasta corroborarla.

## 10. Contrato de Navegación

El Contrato de Navegación define cómo se recorre una Instancia Territorial. Su autoridad no es una etiqueta como `corridor`, sino la conectividad explícita.

Debe separar:

### Puertos de conexión

Cada conexión de borde declara dimensiones independientes:

```text
id
localEdge: screen_up | screen_down | screen_left | screen_right
state: open | closed | conditional
priority: primary | secondary | none
progressionRole: entry | exit | return | optional | none
directionality: bidirectional | one_way
worldBearing: optional / OPEN
```

### Grafo / región transitable

Debe existir una representación determinista de qué zonas o celdas están conectadas y cuáles no.

### Etiqueta de patrón

`corridor`, `junction`, `crossroad`, `pocket` pueden mantenerse como etiquetas de lectura rápida, pero se derivan de la conectividad explícita y no la reemplazan.

`elbow` describe la **forma de la ruta** de un corredor, no una topología distinta.

`hub` describe una **función de permanencia o redistribución**, no una conectividad única.

### Forma de ruta

Puede describirse por separado cuando sea útil:

```text
straight | bend | meander | unknown
```

### Perfil de experiencia

Separar también:

```text
movementProfile: level | ascent | descent | mixed | transition
experienceRole: tutorial | exploration | discovery | rest | transit
```

Esto evita mezclar topología, dirección, progresión y función narrativa en un solo campo `flow`.

## 11. Celdas Espaciales

Las Celdas Espaciales son una discretización técnica del blockout, no una escala territorial ni un voxel físico del mundo real.

Para el piloto pueden representarse visualmente como prismas o celdas cúbicas en vista isométrica, pero el dato lógico mínimo puede seguir siendo 2D:

```text
col
row
elevationBand
walkability
blocker
interaction
notes
```

La altura se expresa como banda relativa mientras no exista equivalencia métrica.

El prisma es una **forma de visualizar** la celda y sus cambios de nivel. No obliga a implementar navegación 3D apilada ni selecciona renderer.

## 12. Blockout

El blockout es una representación técnica simplificada del Contrato de Navegación.

Debe probar como mínimo:

- puertos abiertos/cerrados;
- conectividad;
- continuidad de ruta;
- bandas de altura relativa;
- transitabilidad;
- bloqueos;
- entrada/salida;
- nodos de decisión;
- relación con rasgos territoriales obligatorios;
- legibilidad sin depender de etiquetas explicativas.

Si una estilización cambia la conectividad aprobada, la prueba falla aunque sea visualmente atractiva.

## 13. Dirección de Arte

Dirección de Arte recibe una estructura trazable y la convierte en paisaje reconocible.

```text
elevationBand → terrazas, roca, desnivel
bloqueo       → vegetación, piedra, agua, pendiente
ruta          → sendero y lectura del suelo
rasgo         → ancla territorial reconocible
fondo         → continuidad del paisaje
atmósfera     → luz, estación, profundidad y color
```

La estilización debe conservar estructura espacial y rasgos ancla. Puede simplificar detalle, pero no inventar evidencia.

## 14. Iteración controlada

La producción real no es estrictamente lineal. Después del primer prototipo puede ser necesario ajustar:

- ancho de ruta;
- separación entre anclas;
- forma de una terraza;
- lectura de alturas;
- composición y densidad visual.

La revisión vuelve al nivel que corresponda:

```text
problema territorial → revisar evidencia/síntesis
problema de navegación → revisar contrato/blockout
problema visual → revisar dirección de arte
problema técnico → revisar implementación
```

No usar una corrección visual para alterar evidencia territorial ni una limitación del renderer para redefinir silenciosamente el lugar.

## 15. Caso de validación inicial — Acceso Principal

Información experiencial declarada:

- puente de madera sobre el Estero El Arrayán;
- reja metálica antigua abierta con fundamentos de piedra;
- casa del conserje inmediatamente a la izquierda después del acceso;
- sendero/calle principal única;
- claro con zonas de picnic;
- continuación hacia la cordillera.

La corrección del modelo agrupa estas evidencias por experiencia espacial en vez de convertir cada objeto en Unidad Espacial:

```text
Paisaje: Precordillera de Santiago
Sector: Fundo Los Nogales / territorio núcleo del piloto
Lugar: Acceso Principal

UE-001 Umbral de acceso
  rasgos: puente, reja, fundamentos, casa del conserje

UE-002 Corredor inicial
  rasgos: camino principal, Estero El Arrayán, laderas laterales

UE-003 Claro de picnic
  rasgos: apertura del recorrido, zonas de picnic, continuidad hacia interior
```

El estado de evidencia de estas unidades y rasgos permanece `proposed` o `partially_corroborated` según la evidencia concreta disponible.

Primera Instancia Territorial:

```text
IT-001 Acceso Principal — entrada inicial
```

Contrato local provisional:

```text
patternLabel: corridor
routeShape: OPEN

P-IN
  localEdge: screen_down
  state: open
  priority: primary
  progressionRole: entry

P-OUT
  localEdge: screen_up
  state: open
  priority: primary
  progressionRole: exit

screenUp: cordillera / interior
screenDown: entrada / dirección mar
mainRoute: centro perceptual
stream: derecha del camino, nivel inferior tras el umbral de acceso
lateralContainment: ambas laderas
worldCardinalMapping: OPEN
```

El primer blockout/prototipo derivado conserva el identificador `MAP-001`.

## 16. Decisiones consolidadas

1. El mapa es resultado, no fuente.
2. La jerarquía territorial termina en Unidad Espacial; Instancia y Celda pertenecen a otros planos del modelo.
3. Un puente, reja, casa, sendero o estero es primero un rasgo territorial; solo es Unidad Espacial si realmente constituye una experiencia espacial autónoma.
4. Evidencia y estado de producción usan estados separados.
5. El marco geográfico y el marco local de pantalla no se confunden.
6. La conectividad explícita gobierna; las etiquetas de topología son atajos descriptivos.
7. `elbow` es forma de ruta de un corredor; `hub` es función, no topología única.
8. Las Celdas Espaciales son discretización 2D con elevación relativa; los prismas son su representación isométrica de trabajo.
9. `IT-*` identifica Instancias Territoriales; `MAP-*` identifica derivados de mapa/blockout.
10. Fundo Los Nogales se conserva como territorio núcleo del piloto y El Arrayán como rasgo/contexto cuando corresponda.
11. La colocación fina de especies sigue sujeta a evidencia territorial `core`.
12. La iteración puede volver a blockout o arte sin alterar silenciosamente la evidencia.

## Límites actuales

Quedan `OPEN` hasta validar `IT-001 / MAP-001`:

- formato del Master Territorial;
- tamaño de Celda Espacial;
- escala metro/celda;
- tamaño estándar de mapa;
- número de bandas de altura;
- pathfinding;
- renderer;
- esquema JSON final;
- distribución ecológica definitiva de especies;
- equivalencia exacta entre elevación real y altura jugable;
- mapeo exacto entre ejes de pantalla y cardinales geográficos.
