# Árboris — Protocolo de mapeo territorial

## Estado

Protocolo corregido para levantar evidencia territorial y convertirla en Unidades Espaciales, Instancias Territoriales, Contratos de Navegación, blockouts y pruebas visuales sin mezclar escala territorial, objetos del lugar, jugabilidad e implementación.

Depende de `docs/SPATIAL_MODEL.md` y mantiene separadas evidencia, síntesis territorial, navegación y arte.

No implementa mapas, motores, assets ni datos botánicos nuevos.

## Objetivo

Transformar un Lugar real en una representación jugable reconocible con trazabilidad y con un ciclo de revisión controlado.

```text
territorio real
→ evidencia registrada
→ rasgos territoriales + Unidades Espaciales
→ Instancia Territorial
→ Contrato de Navegación
→ blockout determinista
→ Dirección de Arte
→ prototipo
→ evaluación
↺ revisión al nivel correcto
```

## Regla de entrada

No empezar por una imagen final. Empezar por un Lugar y por la evidencia disponible.

El objetivo no es copiar el lugar metro por metro, sino conservar relaciones espaciales y rasgos que permitan reconocerlo.

## 1. Delimitar el Lugar

Para el piloto:

```text
Paisaje: Precordillera de Santiago
Sector: Fundo Los Nogales / territorio núcleo del piloto
Lugar inicial: Acceso Principal
```

El Lugar debe:

- poder describirse como una experiencia espacial coherente;
- tener rasgos distinguibles;
- admitir una función jugable simple;
- disponer o admitir levantamiento de evidencia.

## 2. Registrar evidencia con procedencia

Tipos iniciales:

- `topographic`: Google Earth/Google Earth Pro, DEM o mediciones;
- `visual`: fotografías reales;
- `experiential`: recuerdo declarado de una persona que ha visitado el lugar;
- `botanical`: Master Botánico 2.0 y derivados;
- `environmental`: referencias `core`, `contextual` o `comparative` del protocolo ambiental.

Cada registro debe declarar, cuando corresponda:

```text
sourceType
sourceRef
whatItSupports
confidence
observedOrDeclared
pendingCorroboration
notes
```

Reglas:

- evidencia ≠ regla;
- imagen generada ≠ evidencia territorial;
- recuerdo declarado ≠ hecho observado;
- vacío/unknown es preferible a inventar;
- el Master Botánico no se modifica desde este flujo.

## 3. Identificar rasgos territoriales antes de crear Unidades Espaciales

Las fotografías, capturas y recuerdos se revisan primero para reconocer **rasgos territoriales**.

Registrar, cuando sea útil:

```text
name
geometryClass: point | line | area | unknown
anchorElement: yes | no
spatialRelation
sourceRef
confidence
limitations
```

Ejemplos:

- puente → `line` o `area` según el nivel de detalle;
- reja → `line`/`area`;
- casa → `area`;
- sendero → `line`/`area`;
- estero → `line`/`area`;
- ladera → `area`;
- claro → `area`.

No convertir automáticamente cada rasgo en una Unidad Espacial.

## 4. Comprensión visual ambiental

Para cada fotografía o serie relevante registrar una lectura breve:

```text
environmentClass
terrainForm
substrate
vegetationStructure
anchorElements
spatialFunction
scaleEvidence
gameplayReading
limitations
```

Esta lectura puede ayudar a reconocer un Lugar, entender bloqueos o rutas y estimar escala relativa.

No usarla para cerrar microhábitats de especies sin evidencia territorializada `core`.

## 5. Registrar marcos de coordenadas por separado

### Marco territorial

Solo cuando exista evidencia suficiente registrar:

- coordenadas;
- CRS/referencia espacial;
- bearing/orientación;
- elevación real;
- relaciones topográficas.

### Marco local de mapa

Todo blockout debe declarar explícitamente:

```text
screenUp
screenDown
screenLeft
screenRight
localOrigin
worldCardinalMapping
```

Para `MAP-001`:

```text
screenUp   = cordillera / interior / progresión
screenDown = entrada / dirección general hacia el mar / retorno
worldCardinalMapping = OPEN
```

No etiquetar un borde como `north`, `south`, `east` o `west` si esa correspondencia geográfica no está corroborada.

## 6. Captura topográfica

Google Earth, DEM u otras fuentes pueden informar:

- relaciones espaciales;
- relieve;
- orientación;
- contexto;
- posición relativa de rasgos.

Para un Lugar candidato obtener, cuando sea útil:

```text
vista superior general
vista oblicua desde entrada
vista oblicua hacia salida
recorrido o trazado visible
contexto territorial amplio
```

Registrar fecha, orientación aproximada, rasgos visibles, decisiones que puede informar y limitaciones.

Google Earth no es arte final ni autoridad única.

## 7. Evidencia experiencial

Registrar por separado:

```text
hecho recordado
confianza
interpretación posterior
pendiente de corroboración
```

Ejemplo:

```text
Hecho recordado:
  El acceso comienza después de un puente de madera sobre el Estero El Arrayán.

Interpretación:
  El puente funciona como umbral de entrada.

Estado:
  declared / pending corroboration
```

La interpretación nunca se mezcla con el hecho recordado.

## 8. Definir Unidades Espaciales

Una Unidad Espacial es un segmento o zona reconocible del recorrido, no un tile ni un objeto individual.

Campos conceptuales mínimos:

```text
id
nombre
lugarPadre
rasgosTerritoriales
rasgosAncla
relacionesEspaciales
evidencia
funcionRecorridoReal
funcionJugablePropuesta
decisionDestilacion
evidenceStatus
productionStatus
```

### `evidenceStatus`

```text
proposed
partially_corroborated
corroborated
```

### `productionStatus`

```text
unmodeled
blockout
tested
approved
```

No usar un único estado secuencial para evidencia y producción.

## 9. Definir Instancia Territorial

La Instancia Territorial es una versión jugable de una o más Unidades Espaciales bajo un objetivo y condición concretos.

Usar prefijo `IT-`.

Campos mínimos:

```text
id
nombre
unidadesEspaciales
rasgosObligatorios
condicion
objetivoPrueba
alcance
noObjetivos
```

`MAP-*` queda reservado para blockouts, mapas o prototipos derivados.

## 10. Definir Contrato de Navegación

La autoridad del contrato es la conectividad explícita, no una etiqueta de topología.

### Puertos

Cada borde relevante declara:

```text
id
localEdge: screen_up | screen_down | screen_left | screen_right
state: open | closed | conditional
priority: primary | secondary | none
progressionRole: entry | exit | return | optional | none
directionality: bidirectional | one_way
worldBearing: optional / OPEN
```

### Ruta y región transitable

Declarar:

```text
walkableRegion
mainRoute
secondaryRoutes
blockers
decisionNodes
interactions
failureCriteria
```

### Etiquetas derivadas

Puede añadirse para lectura rápida:

```text
patternLabel: corridor | junction | crossroad | pocket | ...
routeShape: straight | bend | meander | unknown
movementProfile: level | ascent | descent | mixed | transition
experienceRole: tutorial | exploration | discovery | rest | transit
```

`elbow` se interpreta como `corridor + routeShape:bend`.

`hub` se interpreta como función de permanencia/redistribución y no como topología única.

## 11. Traducir a Celdas Espaciales

Las Celdas Espaciales discretizan el blockout. No describen metros reales ni obligan a un motor 3D.

Campos mínimos:

```text
col
row
elevationBand
walkability
blocker
interaction
notes
```

La vista de revisión puede dibujarlas como prismas/celdas cúbicas para hacer legibles las terrazas y alturas discretas.

No fijar todavía tamaño de celda, metro/celda ni número definitivo de bandas.

## 12. Construir blockout

El blockout debe mostrar:

- puertos abiertos/cerrados;
- conectividad;
- continuidad de ruta;
- bandas de altura;
- bloqueos;
- región transitable;
- nodos de decisión;
- rasgos territoriales obligatorios;
- relación espacial principal entre esos rasgos.

Debe ser determinista y simple.

Regla dura:

```text
si una estilización altera la conectividad obligatoria, la prueba falla
```

Además, el blockout debe poder entenderse sin depender de textos explicativos para reconocer ruta, desniveles y grandes relaciones espaciales.

## 13. Paso a Dirección de Arte

Dirección de Arte recibe:

- Lugar;
- Unidades Espaciales;
- rasgos territoriales y rasgos ancla;
- evidencia y confianza;
- lectura visual ambiental;
- decisiones de Destilación Territorial;
- Instancia Territorial;
- Contrato de Navegación;
- blockout.

Dirección de Arte define materiales, vegetación, atmósfera, siluetas, ritmo visual y naturalización del terreno sin modificar silenciosamente el contrato.

La primera salida es **prototipo visual**, no asset final.

## 14. Evaluación

Ficha mínima:

```text
testId:
instanceId:
mapId:
patternLabel:
routeShape:
portsPreserved: yes/no
connectivityPreserved: yes/no
inventedConnections: yes/no
mainRouteReadable: yes/no
anchorsReadableWithoutLabels: yes/no
territorialRecognizability: low/medium/high
evidenceFaithfulness: low/medium/high
environmentalCoherence: low/medium/high
gameplayLegibility: low/medium/high
productionReferenceUse: no/partial/yes
decision: pass/revise/fail
```

Criterios:

- `fail`: cambia conectividad o contradice un rasgo ancla obligatorio;
- `revise`: estructura correcta pero lectura territorial, visual o de navegación insuficiente;
- `pass`: conserva contrato y rasgos principales y permite avanzar a una prueba más precisa.

## 15. Iteración controlada

Después de evaluar, identificar qué capa debe corregirse:

```text
falta o contradicción de evidencia → evidencia/síntesis territorial
problema de conexión o ruta       → contrato/blockout
problema de lectura visual        → dirección de arte
problema de rendimiento/render    → implementación
```

No corregir un problema visual cambiando la evidencia ni corregir un problema técnico inventando topología.

## 16. Caso inicial — Acceso Principal

Información experiencial inicial:

```text
exterior
→ puente de madera sobre Estero El Arrayán
→ portal con reja metálica antigua abierta
→ casa del conserje inmediatamente a la izquierda
→ sendero inicial único
→ claro con zonas de picnic
→ continuación hacia cordillera
```

Unidades Espaciales corregidas:

```text
UE-001 Umbral de acceso
  rasgos: puente, reja, fundamentos, casa del conserje

UE-002 Corredor inicial
  rasgos: camino principal, estero, laderas laterales

UE-003 Claro de picnic
  rasgos: apertura del recorrido, picnic, continuidad interior
```

Instancia:

```text
IT-001 Acceso Principal — entrada inicial
```

Contrato local provisional:

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

mainRoute: centro perceptual
stream: derecha del camino y más bajo tras el umbral
lateralContainment: ambas laderas
worldCardinalMapping: OPEN
```

Primer derivado:

```text
MAP-001 — blockout/prototipo del Acceso Principal
```

## 17. Paquete mínimo para continuar MAP-001

Reunir, cuando sea posible:

- vista superior del acceso;
- relación del puente con el estero y el portal;
- evidencia del puente;
- evidencia de reja y fundamentos;
- evidencia de la casa del conserje;
- evidencia del sendero inicial;
- evidencia del claro de picnic;
- orientación o bearing cuando pueda corroborarse;
- lectura visual ambiental de cada fotografía/serie;
- procedencia de toda afirmación usada para mover o dimensionar un rasgo.

No es obligatorio tener todo antes del blockout, pero cualquier geometría no corroborada permanece `OPEN` y se identifica como decisión provisional de juego/arte.

## 18. Límites

Este protocolo no autoriza todavía:

- crear un Master Territorial definitivo;
- cerrar tamaño de celda;
- cerrar escala metro/celda;
- fijar renderer/pathfinding;
- declarar mapa final;
- usar Google Earth como textura final;
- usar imágenes generadas como evidencia;
- cerrar distribución de especies sin evidencia `core` territorializada;
- modificar el Master Botánico desde Dirección de Arte;
- asumir cardinales geográficos desde la orientación de pantalla.
