# Árboris — Modelo espacial

## Estado

Modelo conceptual consolidado para transformar territorios reales en espacios jugables reconocibles.

Este documento define vocabulario, límites y relaciones entre territorio, evidencia, jugabilidad y arte. No fija todavía tamaño de celda, escala metro/celda, pathfinding, renderer, formato de datos final ni un Master Territorial implementado.

## Resultado de fiscalización conceptual

La propuesta se contrastó con los principios ya vigentes del proyecto, el protocolo ambiental y el sistema de topología. Se corrigieron cinco riesgos:

1. **Territorio ≠ mapa.** El mapa es un derivado jugable del territorio, no su fuente.
2. **Unidad Espacial ≠ tile.** La Unidad Espacial es conceptual; las celdas son implementación.
3. **Topología ≠ identidad territorial.** `corridor`, `junction`, etc. describen conectividad, no el lugar.
4. **Evidencia ≠ canon.** Google Earth, fotografías y memoria de visitante son evidencias con procedencia y confianza; no son por sí solas fuente canónica.
5. **Instancia Territorial ≠ mapa.** La instancia describe una versión jugable de un lugar; el mapa/prototipo es una representación derivada de esa instancia.

También se corrige una ambigüedad territorial: para el piloto, **Fundo Los Nogales** se mantiene como sector núcleo. El Estero El Arrayán y la cuenca de El Arrayán se registran como contexto hidrológico/territorial cuando corresponda; no se usan como sinónimo automático del sector.

## Principio rector

Árboris no diseña mapas desde cero. **Destila territorios reales en espacios jugables reconocibles.**

```text
territorio real
→ evidencia registrada
→ modelo territorial
→ Unidad Espacial
→ Instancia Territorial
→ Contrato Jugable
→ Modelo Espacial / blockout
→ Dirección de Arte
→ mapa o prototipo
```

## Destilación Territorial

La **Destilación Territorial** es el proceso mediante el cual un lugar real conserva su identidad reconocible mientras se simplifica para funcionar como juego.

Toda destilación debe declarar:

- qué rasgos se conservan;
- qué se simplifica;
- qué se omite;
- qué se enfatiza por legibilidad;
- qué permanece `OPEN` por falta de evidencia.

Una escena puede ser atractiva y aun así fallar si deja de sentirse como el lugar que representa.

## Escalas conceptuales

```text
Paisaje
→ Sector
→ Lugar
→ Unidad Espacial
→ Instancia Territorial
→ Celda Espacial
```

### Paisaje
Escala territorial amplia. Ejemplo: precordillera de Santiago.

### Sector
Área concreta del paisaje que actúa como ámbito de trabajo. Para el piloto: **Fundo Los Nogales**.

### Lugar
Zona reconocible dentro del sector. Ejemplo: acceso principal.

### Unidad Espacial
Fragmento reconocible e indivisible desde la experiencia del jugador. No se define por metros ni por cantidad de tiles.

### Instancia Territorial
Versión jugable de una o más Unidades Espaciales bajo una condición y objetivo de prueba concretos.

### Celda Espacial
Unidad técnica mínima usada para representar altura, ocupación y navegación. Puede implementarse como celda cúbica o prismática. Su forma visual puede quedar completamente oculta por el arte.

## Evidencia territorial

El modelo espacial separa fuente de evidencia y síntesis canónica.

```text
Google Earth / DEM / medición → evidencia topográfica
fotografías reales            → evidencia visual territorial
recuerdo de visitante          → evidencia experiencial
Master Botánico 2.0            → evidencia botánica
referencias ambientales        → evidencia ecológica/ambiental
```

Reglas:

- toda evidencia debe conservar procedencia;
- una captura aislada no autoriza una regla general;
- un recuerdo declarado no se convierte en hecho observado hasta ser contrastado cuando sea posible;
- una imagen generada nunca es evidencia territorial;
- el Master Botánico aporta información de especies, no geometría del lugar.

## Master Territorial

El **Master Territorial** es una entidad arquitectónica objetivo: la futura fuente canónica que sintetizará Lugares, Unidades Espaciales, relaciones, evidencias y decisiones de Destilación Territorial.

**Todavía no existe un formato canónico implementado.** No se crea un Excel/JSON paralelo hasta que el caso del Acceso Principal demuestre qué campos son realmente necesarios.

La regla de diseño es equivalente a la usada en botánica: primero se estabiliza el modelo, luego se define una fuente canónica reproducible.

## Unidad Espacial

Definición consolidada:

> Una Unidad Espacial es un fragmento del lugar que mantiene identidad territorial y experiencial suficiente para ser reconocido como una unidad del recorrido y ser traducido a juego.

Debe responder:

```text
¿Qué lugar es?
¿Qué lo hace reconocible?
¿Qué evidencia lo respalda?
¿Cómo se relaciona con las unidades vecinas?
¿Qué función tiene en el recorrido real?
¿Qué función tendrá en el juego?
¿Qué se conserva y qué se simplifica?
```

Una Unidad Espacial puede contener muchas Celdas Espaciales.

## Instancia Territorial

La Instancia Territorial separa el lugar real de una versión concreta de juego.

Ejemplos posibles:

```text
IT-001 Acceso Principal — primera entrada/tutorial
IT-002 Acceso Principal — variante estacional futura
```

Una Instancia Territorial referencia Unidades Espaciales, pero no las redefine.

No usar prefijo `MAP-` para la instancia. `MAP-` se reserva para blockouts/mapas/prototipos derivados.

## Modelo Espacial y Celdas Espaciales

El Modelo Espacial traduce una Instancia Territorial a estructura técnica suficiente para blockout.

Puede representar:

- coordenadas locales;
- altura relativa;
- transitabilidad;
- bordes y cambios de nivel;
- agua;
- bloqueos;
- puntos de interacción;
- cobertura/ocupación necesaria para gameplay;
- vínculos territoriales cuando exista evidencia suficiente.

Para la primera prueba se favorecen **Celdas Espaciales cúbicas o prismáticas** porque hacen legibles los niveles de altura y simplifican la construcción del blockout.

Esto es una decisión de prototipado, no una obligación estética ni una selección definitiva de renderer.

## Contrato Jugable

El Contrato Jugable define cómo se recorre una Instancia Territorial. Tiene tres componentes distintos:

### 1. Topología
Usa exclusivamente las categorías ya definidas en `MAP_TOPOLOGY_SYSTEM.md`:

- `corridor`;
- `elbow`;
- `junction`;
- `crossroad`;
- `pocket`;
- `hub`.

### 2. Roles de conexión
Conserva los roles vigentes:

- `none`;
- `primary`;
- `secondary`;
- `return`;
- `conditional`.

### 3. Flujo
Describe la experiencia de movimiento. Vocabulario inicial, no exhaustivo:

- entrada;
- ascenso;
- descenso;
- retorno;
- transición;
- exploración;
- descubrimiento;
- descanso;
- tutorial.

Topología, rol de conexión y flujo no son sinónimos.

## Blockout

El blockout es una representación técnica simplificada del Contrato Jugable sobre Celdas Espaciales.

Debe probar como mínimo:

- conexiones;
- continuidad de ruta;
- alturas relativas;
- transitabilidad;
- bloqueos;
- entrada/salida;
- nodos de decisión;
- legibilidad.

No es arte final. Si una estilización cambia la conectividad aprobada, la prueba falla aunque sea visualmente atractiva.

## Dirección de Arte

Dirección de Arte recibe una estructura ya trazable y la convierte en paisaje reconocible.

```text
altura   → terrazas, roca, escalones naturales
bloqueo  → vegetación densa, piedra, desnivel, agua
ruta     → sendero y lectura del suelo
fondo    → silueta territorial y continuidad del paisaje
atmósfera→ luz, estación, profundidad y color
```

La estilización puede ocultar la estructura cúbica. Debe conservar la estructura espacial esencial y los rasgos ancla del lugar.

## Caso de validación inicial — Acceso Principal

La primera validación conceptual usa información experiencial aportada por una persona que ha visitado el lugar. **Se registra como recuerdo declarado y queda pendiente de corroboración topográfica/fotográfica donde sea posible.**

Recuerdos declarados:

- el acceso comienza después de un puente de madera que cruza el Estero El Arrayán;
- existe una reja metálica antigua abierta de par en par;
- sus soportes son de piedra de la zona;
- a la izquierda se sitúa la casa del conserje;
- el sendero nace directamente desde la entrada;
- el recorrido inicial es una vía única;
- tras unos metros se llega a un claro con zonas de picnic.

Jerarquía inicial:

```text
Paisaje: Precordillera de Santiago
Sector: Fundo Los Nogales
Lugar: Acceso Principal
Contexto hidrológico: Estero El Arrayán

UE-001 Puente de acceso
UE-002 Portal / reja de acceso
UE-003 Casa del conserje
UE-004 Sendero inicial
UE-005 Claro de picnic
```

Estado inicial de estas UE: `proposed` hasta disponer de corroboración suficiente.

Primera Instancia Territorial:

```text
IT-001 Acceso Principal — entrada inicial
```

Contrato jugable provisional:

```text
topología: corridor
flujo: entrada / transición / tutorial
entrada: puente / portal
salida: claro de picnic
```

El primer blockout/prototipo derivado puede usar el identificador `MAP-001`.

## Decisiones consolidadas

1. El mapa es resultado, no fuente.
2. La Unidad Espacial es la unidad conceptual del recorrido, no un tile.
3. Las Celdas Espaciales son implementación técnica y pueden ser cúbicas/prismáticas en prototipos.
4. El Master Territorial es un objetivo arquitectónico, no un archivo ya implementado.
5. Google Earth es evidencia topográfica, no autoridad canónica única.
6. La memoria de visitante se registra como evidencia experiencial con trazabilidad y corroboración pendiente cuando corresponda.
7. Topología, roles de conexión y flujo permanecen separados.
8. `IT-*` identifica Instancias Territoriales; `MAP-*` identifica representaciones/blockouts derivados.
9. Fundo Los Nogales se conserva como sector núcleo; El Arrayán se registra como contexto cuando corresponda.
10. La colocación fina de especies permanece sujeta a evidencia territorial `core`.

## Límites actuales

Quedan `OPEN` hasta validar `IT-001 / MAP-001`:

- formato del Master Territorial;
- tamaño de Celda Espacial;
- escala metro/celda;
- tamaño estándar de mapa;
- número de niveles de altura;
- pathfinding;
- renderer;
- esquema JSON final;
- distribución ecológica definitiva de especies;
- equivalencia exacta entre elevación real y altura jugable.
