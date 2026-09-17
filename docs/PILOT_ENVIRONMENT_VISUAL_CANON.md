# Árboris — Canon visual del escenario piloto

**Estado:** decisión de dirección de proyecto / dirección de arte para el piloto  
**Fecha:** 16 septiembre 2026

## Propósito

Este documento fija la lectura visual y espacial que debe gobernar los primeros blockouts y prototipos de entorno del Santuario de la Naturaleza El Arrayán / ex Fundo Los Nogales.

No reemplaza `SPATIAL_MODEL.md`, `TERRITORIAL_MAPPING_PROTOCOL.md` ni `ENVIRONMENT_ART_DIRECTION.md`. Define una restricción concreta de composición y orientación para `IT-001 / MAP-001` y para los primeros fragmentos continuos derivados de ese recorrido.

## Regla de orientación de pantalla

La pantalla debe leerse como una brújula visual estable:

```text
ARRIBA DE LA PANTALLA
→ cordillera
→ interior del territorio
→ objetivo final / dirección principal de avance

ABAJO DE LA PANTALLA
→ entrada del santuario
→ dirección general hacia el mar
→ origen / retorno
```

La referencia al mar es direccional y territorial. **No obliga a mostrar el océano en pantalla.**

La orientación debe ser comprensible sin depender de flechas, texto o minimapa.

## Estructura transversal del escenario

El recorrido principal se organiza alrededor de una franja central legible.

Después del umbral de acceso, la relación canónica es:

```text
ladera / terrazas / accesos secundarios
            │
            │
CAMINO PRINCIPAL RECORRIBLE
            │
            └──── ESTERO EL ARRAYÁN
                  en nivel inferior

laderas a ambos lados → efecto de mundo contenido/cerrado
```

Reglas:

- el **camino principal** ocupa el centro perceptual de la pantalla;
- después del umbral, el **Estero El Arrayán** se mantiene al lado derecho del camino en la composición del piloto y en un nivel de altura inferior;
- las **laderas norte y sur** contienen lateralmente el recorrido y evitan sensación de planicie abierta o tablero flotante;
- no fijar todavía cuál ladera geográfica corresponde a izquierda/derecha de pantalla sin corroboración cartográfica; lo canónico es que ambas generan el cierre lateral;
- las laderas se construyen como **terrazas escalonadas**;
- algunas terrazas pueden contener accesos a senderos secundarios, pero no deben inventarse conexiones que contradigan el contrato topológico.

## Corrección del umbral de acceso — relación puente/estero

La lectura del acceso tiene una excepción obligatoria respecto de la regla post-umbral `estero a la derecha`.

En la parte inferior del fragmento:

```text
entrada
→ puente sobre Estero El Arrayán
→ puerta principal
→ casa del conserje a la izquierda
→ camino principal hacia interior
```

En ese punto, el estero realiza un recorrido visual en forma de **“L”**:

```text
tramo inferior / transversal
        └── giro
            │
            │ continuidad hacia cordillera / interior
            │
```

Reglas específicas:

- el **puente se ubica antes de la puerta principal** y cruza el estero en el sector inferior del acceso;
- el estero puede cruzar transversalmente la composición en el umbral porque allí forma el giro de la `L`;
- después de ese giro, el estero continúa hacia el interior/cordillera y recupera la relación canónica de **derecha del camino + nivel inferior**;
- la continuación aguas abajo del estero hacia Santiago se reconoce territorialmente, pero queda fuera del alcance visual de `MAP-001` en esta fase;
- no generar todavía un tramo urbano, periurbano ni extensión aguas abajo fuera del fragmento piloto;
- la forma exacta, bearing y métrica de la `L` siguen sujetos a evidencia territorial: el arte puede comunicar la relación, no convertirla en geometría medida.

## Lenguaje espacial

La vista objetivo es:

- isométrica;
- construida sobre Celdas Espaciales / tiles cúbicos o prismáticos;
- con alturas discretas claramente legibles;
- visualmente naturalizada mediante roca, suelo y vegetación;
- sin necesidad de ocultar por completo la lógica de altura;
- con continuidad de mundo, no islas flotantes.

Los tiles son implementación. El jugador debe percibir **terrazas de terreno**, no una cuadrícula decorativa.

## Densidad visual

Decisión de Alejandra: **los escenarios no necesitan estar densamente poblados de elementos.**

La prioridad es claridad, reconocimiento territorial y lectura del recorrido.

Aplicar:

```text
pocos elementos
+ buena silueta
+ ubicación significativa
+ espacio negativo suficiente
= escenario legible y reconocible
```

No llenar vacíos por inseguridad visual. Un área de suelo, roca o vegetación baja puede permanecer simple si ayuda a leer camino, desnivel, estero y laderas.

### Elementos ancla antes que decoración

Priorizar pocos rasgos reconocibles, por ejemplo:

- camino;
- estero;
- cambio de nivel;
- afloramiento rocoso;
- árbol/arbusto de silueta clara;
- cactus u otro elemento real respaldado por referencias;
- portal, puente, casa del conserje o claro cuando corresponda a la Unidad Espacial.

Un elemento reconocible y correctamente situado tiene más valor que varios props genéricos.

## Lectura objetivo de MAP-001

```text
                 ↑ CORDILLERA / AVANCE

       ladera / terrazas / senderos puntuales

              CAMINO PRINCIPAL

                              ESTERO
                              nivel inferior
                              │
                              │
                    continuidad interior

       ladera / terrazas / cierre lateral

          puerta principal
               ↑
          puente sobre estero
        ───────┘  giro en “L”

                 ↓ ENTRADA / MAR
```

Para el primer fragmento:

```text
instance: IT-001 Acceso Principal
map: MAP-001
topology: corridor
flow: entrada → puente → puerta → transición → avance hacia cordillera
screenUp: cordillera / interior
screenDown: entrada / dirección mar
mainRoute: centro
streamThreshold: cruza bajo puente y gira en “L”
streamPostThreshold: derecha del camino, nivel inferior
lateralContainment: laderas norte + sur
terrainLanguage: terrazas sobre celdas cúbicas/prismáticas
visualDensity: baja a media, deliberadamente limpia
```

## Aprobación de dirección conceptual — MAP-001 v0.4b

**Decisión de Alejandra:** el arte conceptual revisado de `MAP-001 v0.4b` corresponde a la visión del piloto.

Esta aprobación consolida como dirección visual deseada:

- mundo isométrico naturalizado y continuo;
- lectura clara del camino hacia la cordillera;
- laderas rocosas contenedoras;
- Estero El Arrayán integrado como rasgo estructural y no decoración;
- puente, puerta y casa como anclas legibles del umbral;
- escala humana suficientemente clara para exploración;
- balance entre vegetación, roca, agua y suelo expuesto;
- sensación de precordillera chilena reconocible sin convertir el escenario en una copia fotográfica literal.

La aprobación es **direccional**, no evidencial:

```text
arte conceptual aprobado
= referencia de visión / tono / composición / naturalización
≠ evidencia territorial
≠ geometría medida
≠ distribución botánica validada
≠ asset final de producción
```

Ningún detalle ornamental o botánico presente en una imagen generada se vuelve canónico por aparecer en ella. Las especies, microhábitats, posiciones exactas y métricas siguen gobernadas por sus fuentes correspondientes.

## Criterios de fallo

El prototipo se considera `revise` o `fail` si:

- no queda claro qué dirección conduce hacia la cordillera;
- el camino principal deja de ser el eje de lectura;
- el estero aparece al mismo nivel que el camino sin justificación;
- después del umbral, el estero abandona arbitrariamente la relación derecha/inferior respecto del camino;
- el puente deja de cruzar el estero antes de la puerta principal;
- el giro en `L` del estero en el umbral desaparece o se convierte en una relación incompatible con el acceso aprobado;
- el mapa se siente como explanada abierta sin laderas contenedoras;
- las terrazas se convierten en plataformas flotantes desconectadas;
- la decoración impide leer camino, alturas o conexiones;
- se agregan bifurcaciones no autorizadas;
- la escena resulta genérica y pierde los rasgos del territorio observado.

## Relación con evidencia de campo

La serie ambiental analizada el 16 de septiembre de 2026 fue declarada como tomada en un mismo punto dentro del **Santuario de la Naturaleza El Arrayán (ex Fundo Los Nogales)**:

```text
33°19'31.66"S
70°27'24.30"O
```

Conversión decimal de trabajo:

```text
-33.325461, -70.456750
```

Esta metadata se considera `core` por procedencia declarada. La precisión exacta puede corroborarse posteriormente con EXIF, GPS o Google Earth cuando sea necesaria para una decisión métrica.

Las fotografías de ese punto sirven para comprender materiales, vegetación, microhábitats visuales, roca y escala. No sustituyen el levantamiento del recorrido completo ni autorizan por sí solas reglas de colocación de especies.

## Regla operativa

Antes de generar otra imagen conceptual del entorno, comprobar explícitamente:

1. ¿arriba conduce a cordillera?
2. ¿abajo conduce a entrada/mar?
3. ¿el camino es el eje central?
4. ¿en el umbral el puente cruza el estero antes de la puerta y el estero realiza el giro en `L`?
5. ¿después del umbral el estero queda a la derecha y más bajo que el camino?
6. ¿las laderas cierran lateralmente el mundo?
7. ¿las alturas se leen como terrazas?
8. ¿hay pocos elementos, bien escogidos?
9. ¿las conexiones secundarias están justificadas?
10. ¿la imagen conserva continuidad territorial?
11. ¿la imagen sigue la visión aprobada sin convertir detalles generados en evidencia?

Si alguna respuesta crítica es no, la propuesta no debe presentarse como interpretación válida del piloto.
