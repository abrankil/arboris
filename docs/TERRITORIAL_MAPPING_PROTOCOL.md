# Árboris — Protocolo de mapeo territorial

## Estado

Protocolo corregido para levantar evidencia territorial y convertirla en Unidades Espaciales, Instancias Territoriales, contratos jugables, blockouts y pruebas visuales sin mezclar escala territorial, certeza de evidencia, jugabilidad e implementación.

Depende de `docs/SPATIAL_MODEL.md` y mantiene separadas evidencia, síntesis territorial, navegación, cámara, interacción/aprendizaje y arte.

No implementa mapas, motores, assets ni datos botánicos nuevos.

## Objetivo

Transformar un Lugar real en una representación jugable reconocible con trazabilidad y con un ciclo de revisión controlado.

```text
territorio real
→ evidencia registrada
→ claims + rasgos territoriales + Unidades Espaciales
→ Instancia Territorial
→ Navigation Contract + Camera Contract + Interaction/Learning Contract
→ blockout determinista
→ Dirección de Arte
→ prototipo
→ evaluación
↺ revisión al nivel correcto
```

## Regla de entrada

No empezar por una imagen final. Empezar por un Lugar y por la evidencia disponible.

El objetivo no es copiar el lugar metro por metro, sino conservar relaciones espaciales y rasgos que permitan reconocerlo sin convertir decisiones provisionales en falsos hechos territoriales.

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

## 3. Formular claims territoriales

Antes de resumir el Lugar o asignar estados globales, formular las afirmaciones concretas que el modelo usa.

Campos conceptuales mínimos:

```text
id
statement
subjectRef
relation
objectRef
sourceRefs
status: proposed | partially_corroborated | corroborated | OPEN
limitations
```

Ejemplos:

```text
CLAIM-001: bridge crosses stream
CLAIM-002: gate follows bridge in the access sequence
CLAIM-003: caretaker house is left of the route after the threshold
CLAIM-004: exact bridge bearing = OPEN
CLAIM-005: exact picnic clearing footprint = OPEN
```

Una Unidad Espacial puede resumir la madurez de sus claims, pero ese resumen no reemplaza el estado granular.

## 4. Identificar rasgos territoriales antes de crear Unidades Espaciales

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

## 5. Comprensión visual ambiental

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

## 6. Registrar marcos de coordenadas por separado

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

## 7. Captura topográfica y evidencia experiencial

Google Earth, DEM u otras fuentes pueden informar relaciones espaciales, relieve, orientación, contexto y posición relativa de rasgos. Para un Lugar candidato obtener, cuando sea útil:

```text
vista superior general
vista oblicua desde entrada
vista oblicua hacia salida
recorrido o trazado visible
contexto territorial amplio
```

Registrar fecha, orientación aproximada, rasgos visibles, decisiones que puede informar y limitaciones.

La evidencia experiencial se registra por separado como:

```text
hecho recordado
confianza
interpretación posterior
pendiente de corroboración
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
claimRefs
relacionesEspaciales
funcionRecorridoReal
funcionJugablePropuesta
decisionDestilacion
```

No almacenar `productionStatus` como propiedad primaria de la UE. La producción corresponde a derivados jugables.

Si se necesita un resumen de evidencia de la UE, debe ser derivado de sus claims y nunca sustituirlos.

## 9. Definir Instancia Territorial

La Instancia Territorial es una versión jugable de una o más Unidades Espaciales bajo un objetivo y condición concretos.

Usar prefijo `IT-`.

Campos mínimos:

```text
id
nombre
unidadesEspaciales
rasgosObligatorios
claimRefs
condicion
objetivoPrueba
alcance
noObjetivos
productionStatus: unmodeled | blockout | tested | approved
```

`MAP-*` queda reservado para blockouts, mapas o prototipos derivados.

## 10. Definir Navigation Contract

La autoridad del contrato es la conectividad explícita y la región transitable, no una etiqueta de topología.

### Puertos

```text
id
localEdge: screen_up | screen_down | screen_left | screen_right
state: open | closed | conditional
priority: primary | secondary | none
progressionRole: entry | exit | return | optional | none
directionality: bidirectional | one_way
worldBearing: optional / OPEN
```

### Región transitable

Declarar:

```text
walkableEnvelope
mainRoute
secondaryRoutes
blockers
decisionNodes
failureCriteria
```

El `walkableEnvelope` continuo es la autoridad geométrica de navegación. Una matriz de celdas puede rasterizarlo para pruebas, pero no debe gobernar la forma territorial.

### Etiquetas derivadas

```text
patternLabel: corridor | junction | crossroad | pocket | ...
routeShape: straight | bend | meander | unknown
movementProfile: level | ascent | descent | mixed | transition
experienceRole: tutorial | exploration | discovery | rest | transit | redistribution
```

`elbow` se interpreta como `corridor + routeShape:bend`.

`hub` se interpreta como función de permanencia/redistribución y no como topología única.

## 11. Definir Camera Contract

Cuando la composición depende de relaciones de pantalla, la cámara es parte del contrato espacial.

Campos mínimos:

```text
profileId
orientationPolicy
rotationPolicy
followPolicy
panPolicy
zoomPolicy
screenRelationInvariants
```

Para `MAP-001`:

```text
profileId: PILOT_FIXED_ISOMETRIC
orientationPolicy: fixed
rotationPolicy: disabled
followPolicy: allowed
panPolicy: allowed
zoomPolicy: testable / OPEN
screenRelationInvariants:
  screen_up   = cordillera / interior / progresión
  screen_down = entrada / retorno
  stream      = screen_right y nivel inferior tras el umbral
worldCardinalMapping: OPEN
```

No fijar todavía grados, FOV ni zoom final.

## 12. Definir Interaction / Learning Contract

La Instancia debe reservar oportunidades funcionales para el loop educativo sin inventar especies o microhábitats.

Campos posibles:

```text
interactionSlots
learningBeats
safePauseAreas
observationOpportunities
contentBindings: optional / OPEN
```

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

Beat educativo mínimo de v0.3:

```text
orientar → notar → observar
```

## 13. Traducir a Celdas Espaciales

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

Regla de autoridad:

```text
walkableEnvelope
→ rasterización/discretización reproducible
→ celdas de prueba
```

La vista de revisión puede dibujarlas como prismas para hacer legibles alturas discretas, pero no debe hacer que el terreno parezca una suma de bloques físicos independientes.

No fijar todavía tamaño de celda, metro/celda ni número definitivo de bandas.

## 14. Construir blockout

El blockout debe mostrar:

- puertos abiertos/cerrados;
- conectividad;
- walkable envelope;
- continuidad de ruta;
- bandas de altura;
- bloqueos;
- nodos de decisión;
- rasgos territoriales obligatorios;
- relación espacial principal entre esos rasgos;
- interaction slots;
- player proxy provisional;
- cámara prevista y zonas de oclusión.

Regla dura:

```text
si una estilización altera la conectividad obligatoria, la prueba falla
```

Además, el blockout debe poder entenderse sin depender de textos explicativos para reconocer ruta, desniveles y grandes relaciones espaciales.

## 15. Paso a Dirección de Arte

Dirección de Arte recibe Lugar, UE, rasgos/anclas, claims y evidencia, decisiones de Destilación Territorial, los tres contratos y el blockout.

Dirección de Arte define materiales, vegetación, atmósfera, siluetas, ritmo visual y naturalización del terreno sin modificar silenciosamente los contratos ni la evidencia.

La primera salida es **prototipo visual**, no asset final.

## 16. Evaluación

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
walkableEnvelopePreserved: yes/no
mainRouteReadable: yes/no
cameraInvariantsPreserved: yes/no
playerReadable: yes/no
criticalOcclusion: yes/no
interactionSlotsLegible: yes/no
anchorsReadableWithoutLabels: yes/no
territorialClaimsContradicted: yes/no
openDecisionsFalselyFixed: yes/no
decision: pass/revise/fail
```

Criterios:

- `fail`: cambia conectividad, contradice un claim/ancla obligatorio o fija como hecho una decisión `OPEN` crítica;
- `revise`: estructura correcta pero lectura territorial, cámara, interacción, oclusión o navegación insuficiente;
- `pass`: conserva contratos y rasgos principales y permite avanzar a una prueba más precisa.

## 17. Iteración controlada

```text
falta/contradicción de evidencia → claims/evidencia/síntesis
problema de conexión o ruta     → Navigation Contract / blockout
problema de cámara/oclusiones   → Camera Contract / composición
problema de interacción         → Interaction/Learning Contract
problema de lectura visual      → Dirección de Arte
problema de rendimiento/render  → implementación
```

No corregir un problema visual cambiando la evidencia ni corregir un problema técnico inventando topología.

## 18. Caso inicial — Acceso Principal

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

Unidades Espaciales:

```text
UE-001 Umbral de acceso
  rasgos: puente, reja, fundamentos, casa del conserje

UE-002 Corredor inicial
  rasgos: camino principal, estero, laderas laterales

UE-003 Claro de picnic
  rasgos: apertura del recorrido, picnic, continuidad interior
```

Claims mínimos actuales:

```text
bridge crosses stream
bridge precedes gate
gate precedes main path
house is left of route after threshold
main path remains dominant
stream remains right + lower after threshold
clearing occurs later toward interior
slopes contain corridor laterally
exact bridge bearing = OPEN
exact clearing footprint = OPEN
```

Instancia:

```text
IT-001 Acceso Principal — entrada inicial
productionStatus: blockout
```

Primer derivado:

```text
MAP-001 — blockout/prototipo del Acceso Principal
```

## 19. Paquete mínimo para MAP-001 v0.3

v0.3 debe derivar tres vistas de la misma definición de Instancia:

```text
A — Navigation Model
  walkable envelope + puertos + blockers + alturas + interaction slots

B — Territorial Constraint Model
  UE + rasgos + claims + estados de evidencia + OPEN

C — Isometric Massing + Camera Test
  terreno continuo + proxies territoriales + player proxy + oclusión
```

No son tres fuentes de verdad. Son tres representaciones de revisión de un mismo modelo.

## 20. Límites

Este protocolo no autoriza todavía:

- crear un Master Territorial definitivo;
- cerrar tamaño de celda;
- cerrar escala metro/celda;
- fijar renderer/pathfinding;
- fijar grados/FOV definitivos de cámara;
- declarar mapa final;
- usar Google Earth como textura final;
- usar imágenes generadas como evidencia;
- cerrar distribución de especies sin evidencia `core` territorializada;
- modificar el Master Botánico desde Dirección de Arte;
- asumir cardinales geográficos desde la orientación de pantalla;
- vincular obligatoriamente movimiento físico/GPS con avatar virtual.
