# Árboris — Modelo espacial

## Estado

Modelo conceptual corregido para transformar territorios reales en espacios jugables reconocibles sin confundir escala territorial, evidencia, navegación, interacción, implementación y arte.

Este documento no fija todavía tamaño de celda, escala metro/celda, pathfinding, renderer ni esquema final de datos. Tampoco convierte una representación jugable en autoridad sobre el territorio real.

## Principio rector

Árboris no diseña mapas desde cero. **Destila territorios reales en espacios jugables reconocibles.**

La arquitectura separa tres planos:

```text
A. TERRITORIO
Paisaje → Sector → Lugar → Unidad Espacial

B. DERIVACIÓN JUGABLE
Instancia Territorial
  → Contrato de Navegación
  → Contrato de Cámara
  → Contrato de Interacción/Aprendizaje
  → Blockout
  → Prototipo visual

C. IMPLEMENTACIÓN
walkable envelope / celdas / tiles / objetos / navegación / renderer
```

Estos planos se relacionan, pero no forman una sola jerarquía.

## 1. Rol del mapa isométrico dentro del producto

Árboris combina exploración física real con una representación jugable digital del territorio.

El mapa isométrico **no sustituye la salida a terreno ni convierte la observación botánica en una acción puramente virtual**. Su función principal es contextualizar, orientar, preparar búsquedas, sostener progresión, narrativa, pistas y devolución de aprendizaje.

El ciclo de alto nivel es:

```text
MUNDO REAL
salir a terreno
→ observar
→ fotografiar
→ reunir evidencia
→ identificar

MUNDO ISOMÉTRICO
representar el territorio
→ orientar
→ preparar la búsqueda
→ ofrecer pistas/contexto
→ registrar progresión
→ devolver recompensa/aprendizaje
```

La relación entre locomoción física y movimiento del avatar queda desacoplada por defecto. Una futura integración GPS puede existir, pero no es requisito del modelo espacial actual y permanece `OPEN`.

## 2. Territorio, evidencia y derivación

```text
territorio real
→ evidencia registrada
→ síntesis territorial trazable
→ Unidades Espaciales + rasgos territoriales
→ Instancia Territorial
→ contratos jugables
→ blockout determinista
→ Dirección de Arte
→ prototipo
→ evaluación
↺ revisión controlada
```

La revisión puede cambiar la derivación jugable o artística sin reescribir la evidencia. La evidencia solo cambia cuando aparece nueva información o se corrige una fuente.

## 3. Destilación Territorial

La **Destilación Territorial** conserva identidad reconocible mientras simplifica el lugar para hacerlo jugable.

Toda destilación debe declarar:

- qué rasgos se conservan;
- qué se simplifica;
- qué se omite;
- qué se enfatiza por legibilidad;
- qué permanece `OPEN` por falta de evidencia.

Una escena puede ser atractiva y aun así fallar si deja de sentirse como el lugar que representa.

## 4. Jerarquía territorial

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

## 5. Rasgos territoriales y afirmaciones territoriales

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

La unidad primaria de certeza es la **afirmación territorial** (`claim`), no la Unidad Espacial completa. Una misma UE puede contener relaciones corroboradas y otras todavía no cerradas.

Cada claim separa dos ejes:

```text
claimState:
  open | asserted

evidenceStatus:
  proposed | partially_corroborated | corroborated
```

`claimState: open` significa que la afirmación todavía no puede cerrarse; en ese estado no corresponde asignar `evidenceStatus` como si existiera una afirmación ya formulada.

Ejemplo conceptual:

```text
CLAIM-001
statement: bridge crosses stream
claimState: asserted
evidenceStatus: proposed
sources: [...]

CLAIM-002
statement: exact bridge bearing
claimState: open
sources: []
```

Una UE puede mostrar un resumen agregado de evidencia, pero ese resumen nunca reemplaza el estado granular de sus claims/rasgos/relaciones.

## 6. Evidencia territorial

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

## 7. Estado de evidencia y estado de producción

No usar un único estado para describir cosas distintas.

### Estado del claim

```text
open
asserted
```

Describe si una afirmación está todavía sin cerrar o ya formulada para ser evaluada.

### Estado de evidencia

Solo para claims `asserted`:

```text
proposed
partially_corroborated
corroborated
```

Describe cuánto respaldo territorial tiene la afirmación.

### Estado de producción

Se aplica a derivados jugables como Instancias, blockouts, mapas y prototipos:

```text
unmodeled
blockout
tested
approved
```

Una afirmación territorial puede estar `corroborated` mientras `MAP-001` sigue `blockout`. Un blockout experimental puede usar una geometría provisional asociada a un claim `open`, siempre que esa provisionalidad quede explícita.

## 8. Master Territorial

El **Master Territorial** sigue siendo un objetivo arquitectónico, no un archivo implementado.

Cuando exista, no debe mezclar hechos territoriales y decisiones de arte como si fueran equivalentes. Como mínimo deberá separar:

```text
evidencia / procedencia
afirmaciones territoriales + claimState + evidenceStatus
síntesis territorial
Unidades Espaciales y rasgos
relaciones espaciales
Derivaciones jugables que los referencian
```

La Instancia Territorial, el blockout y el arte son derivados trazables del territorio; no deben reescribir silenciosamente la fuente territorial.

No crear todavía un Excel/JSON definitivo hasta que `IT-001 / MAP-001` demuestre qué campos son necesarios.

## 9. Instancia Territorial

La **Instancia Territorial** es una versión jugable de una o más Unidades Espaciales bajo una condición y un objetivo concretos.

Ejemplos:

```text
IT-001 Acceso Principal — entrada inicial/tutorial
IT-002 Acceso Principal — variante estacional futura
```

Una Instancia referencia Unidades Espaciales y rasgos territoriales; no forma parte de la jerarquía geográfica y no redefine el lugar real.

`MAP-*` queda reservado para blockouts, mapas o prototipos derivados.

Cada Instancia puede declarar tres contratos separados:

```text
Navigation Contract
Camera Contract
Interaction / Learning Contract
```

No todos requieren el mismo nivel de detalle en cada fase, pero para una prueba jugable estructural deben existir al menos sus restricciones mínimas.

## 10. Marcos de coordenadas

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
- bandas de elevación relativa.

No asumir que `screenUp = north`.

Las relaciones visuales específicas del piloto se definen en `docs/PILOT_ENVIRONMENT_VISUAL_CANON.md`; este documento solo define la semántica del marco local y del Camera Contract.

## 11. Contrato de Navegación

El Contrato de Navegación define cómo se recorre una Instancia Territorial. Su autoridad no es una etiqueta como `corridor`, sino la conectividad explícita.

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

### Región transitable autoritativa

La autoridad geométrica de navegación es un **walkable envelope continuo** o una representación equivalente de región transitable.

La grilla/celda es una discretización derivada para pruebas o implementación futura:

```text
walkable envelope
→ rasterización/discretización de prueba
→ celdas
```

No usar la matriz de celdas como fuente primaria de forma territorial si eso obliga a que senderos, claros o pendientes adopten geometría de tablero.

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
experienceRole: tutorial | exploration | discovery | rest | transit | redistribution
```

## 12. Contrato de Cámara

La cámara forma parte del diseño espacial cuando las relaciones de pantalla son canónicas.

Debe declarar al menos:

```text
profileId
orientationPolicy
rotationPolicy
followPolicy
panPolicy
zoomPolicy
screenRelationInvariants
```

Para el piloto, el perfil de prueba es:

```text
profileId: PILOT_FIXED_ISOMETRIC
orientationPolicy: fixed
rotationPolicy: disabled
followPolicy: allowed
panPolicy: allowed
zoomPolicy: testable / not canonical yet
```

Los invariantes visuales concretos de `MAP-001` se consultan en `docs/PILOT_ENVIRONMENT_VISUAL_CANON.md`, que es la autoridad de esas relaciones. El contrato fija comportamiento, no grados exactos. Pitch, yaw, FOV y zoom definitivo permanecen `OPEN` hasta prueba técnica.

## 13. Contrato de Interacción / Aprendizaje

La navegación por sí sola no valida un espacio de Árboris. La Instancia debe reservar oportunidades para el loop educativo sin inventar evidencia botánica.

Puede declarar:

```text
interactionSlots
learningBeats
safePauseAreas
observationOpportunities
contentBindings: optional / OPEN
```

Un `interactionSlot` define una oportunidad funcional, no una especie concreta.

Para el piloto:

```text
UE-001 Umbral
  role: orient / establish_place

UE-002 Corredor
  role: exploration
  observationOpportunity: required
  species: OPEN
  microhabitat: OPEN

UE-003 Claro
  role: pause / reflection / progression
  contentBinding: OPEN
```

La secuencia educativa mínima a probar en v0.3 es:

```text
orientar → notar → observar
```

Las fases posteriores pueden extenderla a formular hipótesis, comprobar y recompensar.

## 14. Celdas Espaciales

Las Celdas Espaciales son una discretización técnica derivada del blockout, no una escala territorial ni un voxel físico del mundo real.

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

La rasterización debe poder regenerarse desde la región transitable autoritativa y no convertirse en una segunda fuente de verdad.

## 15. Blockout

El blockout es una representación técnica simplificada de los contratos de la Instancia.

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
- oportunidades de interacción estructural;
- legibilidad con la cámara prevista;
- oclusión del personaje y de interacciones críticas;
- legibilidad sin depender de etiquetas explicativas.

Debe incluir un **player proxy** de escala provisional para verificar ancho aparente, lectura y oclusión. El proxy no fija todavía el sprite final.

Si una estilización cambia la conectividad aprobada, la prueba falla aunque sea visualmente atractiva.

## 16. Dirección de Arte

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

## 17. Iteración controlada

La producción real no es estrictamente lineal. Después del primer prototipo puede ser necesario ajustar:

- ancho de ruta;
- separación entre anclas;
- forma de una terraza;
- lectura de alturas;
- composición y densidad visual;
- cámara dentro de los límites del contrato;
- ubicación de oportunidades de interacción no botánicas.

La revisión vuelve al nivel que corresponda:

```text
problema territorial → revisar evidencia/síntesis
problema de navegación → revisar contrato/blockout
problema de cámara → revisar Camera Contract / composición
problema de interacción → revisar Interaction/Learning Contract
problema visual → revisar dirección de arte
problema técnico → revisar implementación
```

No usar una corrección visual para alterar evidencia territorial ni una limitación del renderer para redefinir silenciosamente el lugar.

## 18. Caso de validación inicial — Acceso Principal

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

La forma exacta del puente, su bearing y la geometría del claro permanecen como claims `open` mientras no exista corroboración suficiente.

Primera Instancia Territorial:

```text
IT-001 Acceso Principal — entrada inicial
productionStatus: blockout
```

Contrato local provisional:

```text
Navigation Contract
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

  mainRoute: centro perceptual
  lateralContainment: ambas laderas
  worldCardinalMapping: OPEN

Camera Contract
  profileId: PILOT_FIXED_ISOMETRIC
  orientationPolicy: fixed
  rotationPolicy: disabled
  followPolicy: allowed
  panPolicy: allowed
  zoomPolicy: testable / OPEN

Interaction / Learning Contract
  UE-001: orient / establish_place
  UE-002: exploration + observationOpportunity(required, content OPEN)
  UE-003: pause / reflection / progression
```

Las relaciones visuales específicas de camino, estero y orientación de pantalla se toman de `docs/PILOT_ENVIRONMENT_VISUAL_CANON.md`.

El primer blockout/prototipo derivado conserva el identificador `MAP-001`.

## 19. MAP-001 v0.3 — modelo estructural requerido

Antes de naturalización ambiental, v0.3 debe presentar tres vistas derivadas de una misma definición de Instancia:

### Vista A — Navigation Model

- walkable envelope autoritativo;
- puertos;
- blockers;
- bandas de altura;
- ruta principal;
- interaction slots;
- raster/celdas derivadas solo para verificación.

### Vista B — Territorial Constraint Model

- `UE-001 → UE-002 → UE-003`;
- claims y relaciones obligatorias;
- `claimState` + `evidenceStatus` cuando corresponda;
- geometría `OPEN` claramente separada de invariantes.

### Vista C — Isometric Massing + Camera Test

- masas de terreno continuas;
- terrazas y depresión del estero;
- proxies de puente/reja/casa;
- player proxy;
- cámara `PILOT_FIXED_ISOMETRIC`;
- prueba de oclusión;
- sin vegetación final, materiales finales, partículas ni detalle decorativo.

Las tres vistas son representaciones de revisión. Ninguna debe convertirse manualmente en una fuente normativa independiente de las demás.

## 20. Decisiones consolidadas

1. El mapa es resultado, no fuente.
2. El mapa isométrico complementa la exploración real; no reemplaza observación/fotografía/evidencia de campo.
3. La jerarquía territorial termina en Unidad Espacial; Instancia y Celda pertenecen a otros planos del modelo.
4. Un puente, reja, casa, sendero o estero es primero un rasgo territorial; solo es Unidad Espacial si realmente constituye una experiencia espacial autónoma.
5. `claimState`, `evidenceStatus` y `productionStatus` son ejes distintos.
6. El marco geográfico y el marco local de pantalla no se confunden.
7. La conectividad explícita y el walkable envelope gobiernan; las etiquetas y celdas son derivados de lectura/implementación.
8. `elbow` es forma de ruta de un corredor; `hub` es función, no topología única.
9. Las Celdas Espaciales son discretización 2D con elevación relativa; los prismas son su representación isométrica de trabajo.
10. La cámara es un contrato de diseño cuando las relaciones de pantalla son canónicas.
11. Un blockout de Árboris debe probar interacción/aprendizaje además de locomoción.
12. `IT-*` identifica Instancias Territoriales; `MAP-*` identifica derivados de mapa/blockout.
13. Fundo Los Nogales se conserva como territorio núcleo del piloto y El Arrayán como rasgo/contexto cuando corresponda.
14. La colocación fina de especies sigue sujeta a evidencia territorial `core`.
15. La iteración puede volver a blockout, cámara, interacción o arte sin alterar silenciosamente la evidencia.

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
- mapeo exacto entre ejes de pantalla y cardinales geográficos;
- pitch/yaw/FOV y zoom definitivo de cámara;
- dimensiones finales del sprite de exploración;
- relación futura entre GPS/locomoción física y avatar virtual.
