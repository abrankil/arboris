# Árboris — Modelo espacial

## Estado

Modelo conceptual inicial consolidado para transformar territorios reales en mapas jugables reconocibles.

Este documento no implementa mapas, tiles, pathfinding, renderer, assets ni datos botánicos nuevos. Define vocabulario, límites y flujo de decisión para la capa espacial de Árboris.

## Fiscalización conceptual

La consolidación se revisó contra los criterios ya vigentes del proyecto:

- Árboris parte de observaciones del mundo real y conserva trazabilidad.
- El arte no reemplaza evidencia científica, botánica, territorial ni ambiental.
- La dirección de arte interpreta una estructura validada; no inventa silenciosamente el territorio.
- La grilla o tile no debe transformarse en protagonista visual.
- El primer escenario debe priorizar Fundo Los Nogales / El Arrayán y usar referencias externas solo como contexto o contraste.
- `PILOT-ENV-006` permanece abierto: los conteos ponderan presencia, pero la colocación espacial exige observaciones territorializadas `core`.

Conclusión de fiscalización: el modelo es coherente si separa cuatro capas que no deben mezclarse:

```text
territorio real
→ master territorial
→ modelo espacial / jugable
→ dirección de arte
```

## Principio rector

Árboris no diseña mapas desde cero. Árboris destila territorios reales en unidades jugables reconocibles.

El mapa no es la fuente. El mapa es el resultado.

## Destilación territorial

La **destilación territorial** es el proceso mediante el cual un territorio real conserva su identidad reconocible mientras se simplifica, abstrae y traduce a un escenario jugable.

La destilación territorial debe declarar:

- qué se conserva;
- qué se simplifica;
- qué se omite;
- qué se exagera por legibilidad;
- qué queda pendiente por falta de evidencia.

Una escena puede ser visualmente atractiva y fallar si deja de sentirse como el lugar que representa.

## Escalas canónicas

El sistema usa estas escalas:

```text
Paisaje
→ Sector
→ Lugar
→ Unidad Espacial
→ Instancia Territorial
→ Celda Espacial
```

### Paisaje

Escala amplia que define el carácter territorial general.

Ejemplo: precordillera de Santiago.

### Sector

Área concreta dentro del paisaje.

Ejemplo: Fundo Los Nogales / El Arrayán.

### Lugar

Zona reconocible dentro del sector.

Ejemplo: acceso principal del parque.

### Unidad Espacial

Fragmento indivisible desde la experiencia del jugador.

Ejemplos: puente de madera, portal de acceso, casa del conserje, sendero inicial, claro de picnic.

### Instancia Territorial

Versión jugable de una o más Unidades Espaciales bajo una condición específica.

Ejemplos: acceso principal en mañana despejada, sendero inicial en primavera, claro de picnic como evento tutorial.

### Celda Espacial

Unidad técnica mínima de implementación. Puede ser cúbica, tener altura y contener propiedades de navegación, suelo, agua, vegetación, obstáculos o interacción.

La Celda Espacial no reemplaza a la Unidad Espacial. La implementa.

## Unidad Espacial

Una **Unidad Espacial** es un lugar reconocible e indivisible desde la experiencia del jugador, con identidad territorial, ecológica, narrativa y jugable suficiente para ser representado en Árboris.

No se define por tamaño. Se define por función perceptiva y experiencia.

Debe responder:

```text
¿Qué es este lugar?
¿Por qué se reconoce?
¿Qué función cumple en el recorrido real?
¿Qué función cumple en el juego?
¿Qué evidencia lo respalda?
¿Qué se transforma para hacerlo jugable?
```

Una Unidad Espacial puede ocupar muchas Celdas Espaciales. Un tile o celda no es una Unidad Espacial.

## Master Territorial

El **Master Territorial** es la fuente canónica donde Árboris registrará lugares, unidades espaciales, relaciones, evidencias y decisiones de destilación de un territorio real.

En esta etapa es una entidad conceptual. Su formato definitivo queda abierto.

Relación de fuentes:

```text
Google Earth / Google Earth Pro = evidencia topográfica
fotografías reales = evidencia visual territorial
memoria de visitante = evidencia experiencial
Master Botánico 2.0 = evidencia botánica
Master Territorial = síntesis canónica espacial
```

Google Earth no es autoridad canónica. Tampoco lo es una captura aislada, una imagen generada o una descripción no contrastada. Todas son evidencias que deben registrarse con procedencia y confianza.

## Modelo Espacial

El **Modelo Espacial** traduce el Master Territorial a estructura técnica.

Incluye:

- escala de abstracción;
- Celdas Espaciales;
- altura relativa;
- transitabilidad;
- bloqueos;
- pendientes;
- agua;
- vegetación;
- puntos de interacción;
- conexiones.

## Celdas Espaciales cúbicas

Árboris puede implementar sus mapas mediante Celdas Espaciales cúbicas para representar altura, relieve y navegación.

Decisión conceptual:

```text
Unidad Espacial = lugar reconocible
Celda Espacial = implementación técnica
```

Una celda puede contener o declarar:

- coordenada local;
- altura relativa;
- transitabilidad;
- tipo de suelo;
- pendiente o borde;
- agua o humedad visible;
- vegetación baja;
- vegetación bloqueante;
- roca u obstáculo;
- punto de interacción;
- vínculo con una especie cuando exista evidencia territorial suficiente.

La apariencia final puede ocultar o erosionar la forma cúbica. La estructura cúbica sirve para legibilidad, altura y navegación; no obliga a que el mapa parezca un tablero rígido.

## Contrato Jugable

El **Contrato Jugable** define cómo se juega una Unidad Espacial o Instancia Territorial.

Se compone de:

```text
Topología
+
Flujo
```

### Topología

Describe conectividad.

Valores iniciales ya definidos por el sistema de mapas:

- `corridor`;
- `elbow`;
- `junction`;
- `crossroad`;
- `pocket`;
- `hub`.

### Flujo

Describe la experiencia de movimiento.

Valores iniciales:

- `entrada`;
- `ascenso`;
- `descenso`;
- `retorno`;
- `transición`;
- `exploración`;
- `descubrimiento`;
- `descanso`;
- `tutorial`.

Dos Instancias Territoriales pueden compartir topología y tener flujos distintos.

Ejemplo:

```text
Portal de acceso:
  topología = corridor
  flujo = entrada / transición

Sendero de subida:
  topología = corridor
  flujo = ascenso / exploración
```

## Blockout

El **blockout** es la representación simplificada del Contrato Jugable sobre Celdas Espaciales.

No es arte final. Comprueba:

- conectividad;
- altura;
- transitabilidad;
- entrada y salida;
- zonas bloqueadas;
- nodos de decisión;
- legibilidad.

Si una imagen generada cambia la conectividad definida por el blockout, falla aunque sea visualmente atractiva.

## Dirección de Arte

Dirección de Arte recibe el blockout y lo interpreta visualmente.

Traducciones típicas:

```text
altura → terrazas, rocas, escalones naturales
bloqueo → vegetación densa, piedra, desnivel, agua
ruta → sendero, suelo pisado, borde legible
fondo → identidad territorial reconocible
atmósfera → luz, estación, profundidad, color
```

La Dirección de Arte puede simplificar, estilizar o enfatizar, pero debe conservar la identidad espacial esencial del lugar.

## Caso inicial: Acceso Principal

El primer caso de validación del modelo será el acceso principal del parque.

Información experiencial registrada:

- entrada principal después de un puente de madera;
- el puente cruza el Estero El Arrayán;
- la entrada es una reja metálica antigua que se abre de par en par;
- las bases de la reja son fundamentos de piedra local;
- inmediatamente a la izquierda se sitúa la casa del conserje;
- el sendero nace directamente conectado con la entrada principal;
- el sendero es una calle única;
- avanza unos metros hasta llegar a un claro;
- en el claro se disponen las zonas de picnic.

Estructura espacial inicial:

```text
Paisaje:
  Precordillera de Santiago

Sector:
  Fundo Los Nogales / El Arrayán

Lugar:
  Acceso principal

Unidades Espaciales:
  UE-001 Puente de madera
  UE-002 Portal / reja metálica antigua
  UE-003 Casa del conserje
  UE-004 Sendero inicial
  UE-005 Claro de picnic
```

Contrato inicial:

```text
Instancia Territorial:
  MAP-001 — Acceso Principal

Topología:
  corridor

Flujo:
  entrada / transición / tutorial

Destino:
  claro de picnic
```

## Decisiones consolidadas

1. El mapa es resultado, no fuente.
2. La unidad conceptual base es la Unidad Espacial.
3. La Unidad Espacial se implementa mediante Celdas Espaciales.
4. Las Celdas Espaciales pueden ser cúbicas para representar altura y navegación.
5. Google Earth es evidencia topográfica, no fuente canónica.
6. Las fotografías reales son evidencia visual territorial.
7. La memoria de visitante es evidencia experiencial y debe contrastarse cuando sea posible.
8. El Master Botánico 2.0 aporta evidencia botánica, pero no describe por sí solo el territorio.
9. El futuro Master Territorial sintetizará evidencia espacial, ambiental y experiencial.
10. El primer caso espacial será el Acceso Principal.
11. El primer contrato jugable será `corridor` con flujo de entrada.
12. El primer prototipo será una prueba de destilación territorial, no un mapa final.
13. No se cerrarán microhábitats de especies sin observaciones territorializadas `core`.

## Límites actuales

Este documento no fija todavía:

- formato del Master Territorial;
- tamaño estándar de mapas;
- tamaño de celda;
- número máximo de alturas;
- escala metro/celda;
- pathfinding;
- renderer;
- editor de mapas;
- formato JSON final de mapas;
- paleta final del acceso principal;
- distribución definitiva de especies en el mapa.

Esos temas deben definirse después de probar el Acceso Principal y `TEST-MAP-01 corridor`.