# Árboris — Protocolo de mapeo territorial

## Estado

Protocolo inicial para levantar evidencia territorial y convertirla en Unidades Espaciales, Instancias Territoriales, Contratos Jugables, blockouts y pruebas visuales.

Depende de `docs/SPATIAL_MODEL.md` y debe mantener separación entre evidencia, síntesis territorial, jugabilidad y arte.

No implementa mapas, motores, assets ni datos botánicos nuevos.

## Objetivo

Establecer un flujo reproducible para transformar un lugar real en una representación jugable reconocible sin confundir fuente, interpretación y resultado.

```text
territorio real
→ evidencia registrada
→ Unidades Espaciales
→ Instancia Territorial
→ Contrato Jugable
→ Modelo Espacial / blockout
→ Dirección de Arte
→ prototipo
→ evaluación
```

## Regla de entrada

No empezar por una imagen final. Empezar por un Lugar y por la evidencia disponible.

```text
lugar reconocible
→ rasgos ancla
→ relaciones espaciales
→ destilación territorial
→ contrato jugable
→ blockout
→ arte
```

El objetivo no es copiar el lugar metro por metro, sino conservar su identidad espacial y experiencial.

## 1. Delimitar el Lugar

Para el piloto:

```text
Paisaje: Precordillera de Santiago
Sector: Fundo Los Nogales
```

Seleccionar un Lugar acotado y reconocible. Debe:

- poder describirse como una experiencia espacial coherente;
- tener rasgos ancla distinguibles;
- permitir una función jugable simple;
- disponer o admitir levantamiento de evidencia.

El primer Lugar candidato es el **Acceso Principal**.

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
- recuerdo declarado ≠ hecho observado hasta corroborarlo cuando sea posible;
- vacío/unknown es preferible a inventar;
- el Master Botánico no se modifica desde este flujo.

## 3. Comprensión visual antes de destilación

Las fotografías de referencia se revisan primero como escenas ambientales, no como assets ni como identificación botánica.

Para cada foto o serie relevante, registrar una lectura breve:

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

Esto permite decidir si una imagen sirve para:

- reconocer un Lugar;
- definir una Unidad Espacial;
- informar un borde, bloqueo, ruta, fondo o punto de interacción;
- estimar escala relativa;
- formular una hipótesis visual que deberá contrastarse.

No usar esta lectura para cerrar microhábitats de especies sin evidencia territorializada `core`.

## 4. Captura topográfica en Google Earth

Para cada Lugar o Unidad Espacial candidata, obtener idealmente:

```text
GE-01 vista superior general
GE-02 vista oblicua desde la entrada
GE-03 vista oblicua hacia la salida
GE-04 detalle del recorrido
GE-05 contexto territorial amplio
```

Registrar:

- fecha;
- orientación aproximada;
- escala/altura de cámara si resulta útil;
- rasgos visibles;
- decisiones que puede informar;
- limitaciones de la captura.

Google Earth sirve para topografía, relaciones espaciales, orientación y contexto. No es arte final ni fuente canónica única.

## 5. Evidencia experiencial

Registrar por separado:

```text
hecho recordado
graduación de confianza
interpretación posterior
pendiente de corroboración
```

Ejemplo inicial:

```text
Hecho recordado:
  El acceso comienza después de un puente de madera sobre el Estero El Arrayán.

Interpretación:
  El puente funciona como umbral de entrada.

Estado:
  declared / pending corroboration
```

La interpretación nunca debe mezclarse con el hecho recordado.

## 6. Definir Unidades Espaciales

Una Unidad Espacial es una unidad reconocible del recorrido, no un tile ni un objeto decorativo.

Campos conceptuales mínimos:

```text
id
nombre
lugarPadre
rasgosAncla
relacionesEspaciales
evidencia
funcionRecorridoReal
funcionJugablePropuesta
decisionDestilacion
estado
```

Estados iniciales:

- `proposed` — propuesta basada en evidencia inicial o recuerdo declarado;
- `observed` — corroborada suficientemente por evidencia territorial;
- `modeled` — traducida a Instancia/Contrato/Blockout;
- `tested` — usada en prototipo;
- `approved` — aceptada para producción o como regla estable.

No promover a `observed` solo porque una descripción resulte plausible.

## 7. Definir Instancia Territorial

La Instancia Territorial es una versión de juego de una o más Unidades Espaciales bajo un objetivo y condición concretos.

Usar prefijo `IT-`.

Campos mínimos:

```text
id
nombre
unidadesEspaciales
condicion
objetivoPrueba
alcance
noObjetivos
```

Ejemplo:

```text
IT-001 — Acceso Principal / entrada inicial
```

`MAP-*` queda reservado para blockouts, mapas o prototipos derivados.

## 8. Definir Contrato Jugable

Separar tres cosas:

### Topología
Solo categorías ya definidas en `MAP_TOPOLOGY_SYSTEM.md`.

### Roles de conexión
`none`, `primary`, `secondary`, `return`, `conditional`.

### Flujo
Describe cómo se vive el recorrido: entrada, transición, ascenso, descenso, exploración, descubrimiento, descanso, tutorial, etc.

Campos mínimos:

```text
topologia
conexiones
flujo
entrada
salida
rutaPrincipal
bloqueos
nodosDecision
interacciones
criterioFalla
```

Para `IT-001` el contrato inicial es provisional:

```text
topologia: corridor
flujo: entrada / transicion / tutorial
entrada: puente / portal
salida: claro de picnic
```

## 9. Traducir a Celdas Espaciales

Las Celdas Espaciales son implementación técnica del blockout, no descripción del lugar real.

Para el primer prototipo pueden ser cúbicas/prismáticas para facilitar altura y navegación.

Registrar solo lo necesario:

```text
x
y
zRelative
walkable
edgeConnection
blockerType
interactionPoint
notes
```

Campos ambientales adicionales solo se agregan si son necesarios para una decisión concreta y están respaldados.

No fijar aún tamaño de celda ni equivalencia metro/celda.

## 10. Construir blockout

El blockout debe mostrar:

- entrada y salida;
- conectividad;
- continuidad de ruta;
- alturas relativas;
- bloqueos;
- tiles/celdas transitables;
- nodos de decisión si existen.

Debe ser determinista y simple.

Regla dura:

```text
si una estilizacion altera la conectividad obligatoria, la prueba falla
```

## 11. Paso a Dirección de Arte

Dirección de Arte recibe:

- Lugar;
- Unidades Espaciales y estado;
- evidencias y confianza;
- lectura visual ambiental;
- microhábitats visuales pertinentes;
- decisiones de Destilación Territorial;
- Instancia Territorial;
- Contrato Jugable;
- blockout.

Dirección de Arte define cómo traducir visualmente altura, bloqueos, sendero, fondo, materiales, vegetación y atmósfera, sin convertir hipótesis territoriales en hechos.

La primera salida es **prototipo visual**, no asset final.

## 12. Evaluación

Ficha mínima:

```text
testId:
instanceId:
mapId:
topology:
flow:
connectivityPreserved: yes/no
inventedConnections: yes/no
mainRouteReadable: yes/no
territorialRecognizability: low/medium/high
evidenceFaithfulness: low/medium/high
environmentalCoherence: low/medium/high
gameplayLegibility: low/medium/high
productionReferenceUse: no/partial/yes
decision: pass/revise/fail
```

Criterios:

- `fail`: cambia conectividad o contradice rasgos ancla obligatorios;
- `revise`: estructura correcta pero reconocibilidad insuficiente/genérica;
- `pass`: conserva estructura y rasgos ancla y permite avanzar a una prueba más precisa.

## 13. Caso inicial — Acceso Principal

La información experiencial inicial se registra como `declared / pending corroboration`:

```text
exterior
→ puente de madera sobre Estero El Arrayán
→ portal con reja metálica antigua abierta
→ casa del conserje a la izquierda
→ sendero inicial único
→ claro de picnic
```

Unidades Espaciales propuestas:

```text
UE-001 Puente de acceso
UE-002 Portal / reja de acceso
UE-003 Casa del conserje
UE-004 Sendero inicial
UE-005 Claro de picnic
```

Instancia:

```text
IT-001 Acceso Principal — entrada inicial
```

Primer derivado de prueba:

```text
MAP-001 — blockout/prototipo del Acceso Principal
```

## 14. Paquete mínimo para iniciar MAP-001

Reunir, cuando sea posible:

- vista superior del acceso;
- vista oblicua desde el puente hacia el portal;
- fotografía/captura del puente;
- fotografía/captura de la reja y soportes;
- fotografía/captura de la casa del conserje;
- fotografía/captura del sendero inicial;
- fotografía/captura del claro de picnic;
- notas de orientación y relaciones espaciales;
- lectura visual ambiental de cada fotografía o serie usada.

No es obligatorio tener todo antes de empezar el blockout, pero cualquier elemento no corroborado debe permanecer `proposed`/`OPEN`.

## 15. Límites

Este protocolo no autoriza todavía:

- crear un Master Territorial definitivo;
- cerrar tamaño de celda;
- cerrar escala metro/celda;
- fijar renderer/pathfinding;
- declarar mapa final;
- usar Google Earth como textura o asset final;
- usar imágenes generadas como evidencia;
- cerrar distribución de especies sin evidencia `core` territorializada;
- modificar el Master Botánico desde Dirección de Arte.
