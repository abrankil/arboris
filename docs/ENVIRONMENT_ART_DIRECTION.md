# Árboris — Dirección de arte de escenarios

## Estado

Marco inicial consolidado con reglas provisionales derivadas del corpus actual. El sistema visual del primer escenario debe priorizar el territorio del Fundo Los Nogales y usar referencias externas solo como contexto o contraste.

La fuente botánica maestra vigente del piloto es `data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx`. Esta documentación no modifica ni reinterpreta esa planilla.

## Propósito

Los escenarios de Árboris deben sentirse como interpretaciones reconocibles del territorio chileno y no como fondos mediterráneos genéricos.

Para el primer piloto, la cadena territorial es:

```text
levantamiento botánico Fundo Los Nogales
→ especies piloto
→ referencias ambientales core/contextual
→ reglas de escenario
→ escena piloto
```

Yerba Loca, Río Clarillo, Pirque y otras áreas ayudan a contrastar patrones, no a sustituir el territorio núcleo.

## Principio de trabajo

```text
realidad observada
→ análisis del lugar
→ patrón visual
→ regla de arte
→ traducción a pixel art
```

No usar generación previa como fuente de verdad sobre paisaje, flora o ecología.

## Comprensión visual ambiental

Antes de decidir composición, paleta o assets, cada fotografía ambiental debe leerse como escena.

La pregunta inicial no es:

```text
¿Qué especie es?
```

sino:

```text
¿Qué tipo de lugar muestra esta imagen?
¿Qué estructura espacial se reconoce?
¿Qué materiales, estratos y obstáculos aparecen?
¿Qué podría convertirse en ruta, borde, fondo, bloqueo o punto de interacción?
```

Este enfoque permite entrenar criterio visual sin convertir una referencia de escenario en evidencia taxonómica o en regla de microhábitat.

## Taxonomía inicial de escenas

La clasificación inicial para referencias ambientales del piloto es:

```text
bosque_esclerofilo
  interior_bosque
  matorral_abierto
  claro
  ladera
  quebrada_humeda
  cauce_o_estero
  borde_sendero
  afloramiento_rocoso
  terraza_o_explanada
  infraestructura_rustica
  vista_cajon_o_cordillera
```

Esta taxonomía sirve para organizar el corpus y detectar patrones visuales. No reemplaza evidencia ecológica formal ni permite cerrar reglas locales sin contraste.

## Microhábitats visuales

Un microhábitat visual es una combinación observable de terreno, sustrato, humedad aparente y vegetación. Es útil para arte y blockout, pero no equivale automáticamente a microhábitat ecológico validado.

Ejemplos iniciales:

```text
roca_granitica_con_cactacea
roca_granitica_con_matorral
borde_de_sendero_seco
sombra_de_bosque
claro_con_suelo_expuesto
ribera_o_borde_de_estero
terraza_de_picnic
```

Reglas:

- puede apoyar lenguaje visual de ambiente;
- puede sugerir hipótesis de colocación;
- no cierra `PILOT-ENV-006`;
- siempre debe conservar vínculo con las referencias concretas que lo originan.

## Capas de decisión visual

### Territorio
Relieve, pendiente, laderas, quebradas, valles, horizonte y continuidad del paisaje.

### Estructura vegetal
Masas, vacíos, altura relativa de estratos, siluetas dominantes y relación entre árboles, arbustos, herbáceas, roca y suelo.

### Suelo y roca
Cantidad de suelo expuesto, tamaño y frecuencia de rocas, formas, contraste y relación con senderos o vegetación.

### Atmósfera
Hora, nubosidad, profundidad atmosférica, temperatura aparente de luz, bruma, lluvia o sequedad visual.

### Composición jugable
La fidelidad territorial debe conservar legibilidad de juego: plano jugable claro, separación de personajes, contraste de silueta y zonas visualmente calmas para UI.

## Jerarquía territorial

### `core`
Fundo Los Nogales / territorio inequívocamente ligado al levantamiento botánico del piloto.

Tiene prioridad para decidir:
- estructura de ladera;
- densidad y distribución vegetal;
- microhábitats;
- roca y suelo;
- quebradas y senderos;
- atmósfera local;
- relación espacial entre especies piloto y ambiente.

### `contextual`
Cuenca del Arrayán / Santuario Los Nogales y entorno inmediato.

Ayuda a interpretar:
- pisos altitudinales;
- exposición de ladera;
- continuidad de cordones;
- variación vegetal local.

### `comparative`
Yerba Loca, Río Clarillo, Pirque y otras áreas.

Sirven para distinguir rasgos regionales, ecosistémicos o locales. Una referencia `comparative` no puede imponer por sí sola la apariencia del primer escenario.

## Fotografías con personas como escala

Cuando una referencia ambiental incluye una persona, su uso permitido para Dirección de Arte es de escala y proporción.

Puede informar:

- altura relativa de arbustos;
- ancho de senderos;
- tamaño de rocas o afloramientos;
- distancia entre elementos;
- proporción entre personaje, terreno y vegetación.

No debe usarse para identificación personal ni para entrenar reconocimiento de personas.

Etiqueta conceptual recomendada:

```text
containsPerson: true
personRole: scale_reference
```

## Fidelidad visual y fidelidad de colocación

Para `PILOT-ENV-006`, separar dos decisiones:

```text
species visual fidelity  → cómo debe verse la especie
species placement fidelity → dónde aparece dentro del mapa
```

La fidelidad visual puede avanzar con las fichas canónicas del Master 2.0: hábito, silueta, hoja, textura, estructuras reproductivas, variación y restricciones de seguridad.

La fidelidad de colocación requiere evidencia territorial: sector, unidad de mapa, exposición, pendiente, cobertura, sustrato, humedad, relación con quebrada/sendero y especies acompañantes. Un rasgo botánico no define por sí solo el microhábitat de una especie dentro del escenario.

## Conteos de observación para dirección de arte

Los conteos por especie del Master 2.0 se usan para ponderar presencia dentro de la muestra del piloto. No deben transformarse automáticamente en abundancia ecológica real.

Regla corregida:

```text
conteo por especie = peso de presencia / prioridad visual
conteo por especie + unidad territorial = regla de colocación
```

Si el conteo está disponible solo por especie, puede influir en densidad relativa, frecuencia de aparición o prioridad de representación. Si además está estratificado por sector, exposición, pendiente, sustrato o microhábitat, puede empezar a informar ubicación dentro del mapa.

Distinguir siempre `observationCount`, `photoCount` e `individualCount`. Una fotografía adicional del mismo individuo no equivale automáticamente a una observación independiente.

Para una primera ponderación interna puede usarse:

```text
spawnWeight = observationCount_species / totalObservationCount
```

El resultado es un prior de muestra, no una afirmación poblacional. Debe revisarse por sesgo de muestreo, series no independientes, múltiples fotos de un mismo individuo y sectores con esfuerzo de observación desigual.

La colocación por ambiente solo puede formularse así:

```text
placementWeight(species, terrainUnit)
  = observations(species, terrainUnit) / observations(species)
```

Esto exige observaciones `core` o inequívocamente vinculadas al Fundo Los Nogales. Las fichas canónicas y referencias externas pueden sugerir hipótesis, pero no cerrar una regla local sin evidencia territorial.

## Estados de regla

- `OBSERVED`: visible o documentada en referencias concretas;
- `RECURRENT`: repetida en varias referencias independientes;
- `APPROVED_ART_RULE`: decisión artística aprobada;
- `OPEN`: aún insuficientemente sustentada.

Una regla del primer escenario no puede pasar a `APPROVED_ART_RULE` si depende exclusivamente de referencias `comparative`.

## Reglas del primer piloto

Estas reglas gobiernan o condicionan directamente el escenario núcleo.

| ID | Estado | Regla | Base actual |
| --- | --- | --- | --- |
| PILOT-ENV-001 | `APPROVED_ART_RULE` | Todo brief del primer escenario debe declarar `referenceArea`, `pilotRelevance`, rango altitudinal aproximado y ambiente representado cuando se conozcan. | Jerarquía territorial y corpus actual. |
| PILOT-ENV-002 | `APPROVED_ART_RULE` | Las referencias `core` tienen prioridad territorial sobre `contextual` y `comparative` para decidir la apariencia del escenario del Fundo Los Nogales. | Fuente botánica maestra + sistema de relevancia. |
| PILOT-ENV-003 | `OPEN` | Diferencias visuales entre laderas norte y sur del territorio núcleo. | Requiere corpus `core`. |
| PILOT-ENV-004 | `OPEN` | Frecuencia y distribución de roca y suelo desnudo por sector y altitud. | Requiere corpus `core`. |
| PILOT-ENV-005 | `OPEN` | Estructura típica de senderos, quebradas y bordes del Fundo Los Nogales. | Requiere corpus `core`. |
| PILOT-ENV-006 | `OPEN` | Relación espacial real entre las seis especies piloto y sus microhábitats. Los conteos de observación ponderan presencia; la colocación requiere observaciones territorializadas. | Master 2.0, fichas canónicas y corpus `core` pendiente. |
| PILOT-ENV-007 | `OPEN` | Variación estacional de color, densidad y atmósfera del territorio núcleo. | Requiere series estacionales. |
| PILOT-ENV-008 | `OBSERVED` | Las fotografías ambientales pueden clasificarse por escena, terreno, sustrato, estructura vegetal, elementos ancla y función jugable antes de cualquier lectura botánica. | Corpus de referencias ambientales de campo, septiembre 2026. |
| PILOT-ENV-009 | `OBSERVED` | Las personas visibles en referencias de ambiente se usan solo como escala, no como sujeto de identificación. | Corpus de referencias ambientales de campo, septiembre 2026. |

## Reglas de apoyo regional

Estas pautas ayudan a interpretar o contrastar el piloto, pero no gobiernan por sí solas el escenario núcleo.

| ID | Estado | Pauta | Referencias | Alcance |
| --- | --- | --- | --- |
| REG-ENV-001 | `RECURRENT` | La altitud y el tipo de ambiente deben declararse antes de usar una referencia de precordillera como modelo de escena. | ENV-0001, ENV-0002, ENV-0003, ENV-0004 | Precordillera y corpus regional. |
| REG-ENV-002 | `RECURRENT` | El bosque esclerófilo no debe representarse por defecto como masa arbórea continua; puede presentar bosque, matorral, aperturas o estados degradados según lugar y condición. | ENV-0002, ENV-0003, ENV-0004, ENV-0008 | Bosque esclerófilo regional. |
| REG-ENV-003 | `OBSERVED` | En Río Clarillo, la asociación peumo–litre–quillay documentada entre 870 y 1.500 m presenta preferencia por exposición sur, cobertura aproximada de 50–60 % y suelos graníticos más desarrollados. | ENV-0005 | Local a Río Clarillo. |
| REG-ENV-004 | `RECURRENT` | Quebradas y cauces funcionan como microambientes diferenciados de la ladera general. | ENV-0006, ENV-0007 | Validación pendiente en core/contextual. |
| REG-ENV-005 | `OBSERVED` | El borde de bosque puede transicionar a matriz abierta sin frontera visual rígida. | ENV-0008 | Pirque. |
| REG-ENV-006 | `RECURRENT` | La profundidad cordillerana puede expresarse mediante pérdida progresiva de contraste y presencia de bruma entre planos. | ENV-0009, ENV-0010 | Vistas de Andes desde Santiago/cuenca. |
| REG-ENV-007 | `OBSERVED` | En una referencia invernal de atardecer, la luz cálida ilumina cumbres nevadas mientras planos inferiores permanecen más fríos o velados. | ENV-0009 | Condición específica. |
| REG-ENV-008 | `OBSERVED` | Un cauce longitudinal puede funcionar compositivamente como eje que conduce la mirada hacia la cordillera. | ENV-0007 | Río Clarillo; pauta compositiva. |

## Consecuencias provisionales

### Masa vegetal
Evitar dos extremos genéricos:
- bosque cerrado uniforme en todo el escenario;
- ladera casi desnuda con arbustos distribuidos al azar.

La densidad concreta del piloto permanece `OPEN` hasta disponer de referencias `core`.

### Exposición de ladera
La exposición solar es una variable ecológica real a escala regional, pero la traducción gráfica específica del Fundo Los Nogales permanece `OPEN`.

### Quebradas y cauces
Las referencias regionales justifican tratarlos como microambientes diferenciados. La validación visual del piloto debe venir de Los Nogales / Arrayán.

### Cordillera y atmósfera
La profundidad puede representarse en pixel art mediante menor contraste, menor separación tonal entre planos lejanos y veladura por bloques de color, no por blur fotográfico.

Las paletas estacionales específicas permanecen `OPEN`.

### Peso de presencia de especies piloto

Los conteos actuales deben interpretarse según su tipo. Si el Master exporta `observationCount`, ese dato gobierna el peso de aparición. Si una tabla usa fotografías o evidencias, debe declararlo como `photoCount` o `evidenceCount`.

La línea base fotográfica actualmente registrada para el piloto es:

| Especie | Evidencia fotográfica actual | Lectura para arte |
| --- | ---: | --- |
| Peumo | 4 | Presencia menor en la muestra; no implica rareza ecológica real. |
| Litre | 12 | Presencia alta en la muestra; candidato a mayor peso de aparición. |
| Bollén | 7 | Presencia intermedia; requiere caracterización ambiental `core`. |
| Mitique | 8 | Presencia intermedia-alta; requiere caracterización ambiental `core`. |
| Colliguay | 7 | Presencia intermedia; probar hipótesis de ambiente asoleado/pedregoso. |
| Quillay | 7 | Presencia intermedia; mantener cautela por identificación piloto probable si la evidencia es solo vegetativa. |

Esta tabla no asigna microhábitats. Para eso se requiere cruzar cada observación con unidad territorial.

## Prioridades de poblamiento

El siguiente corpus debe centrarse en evidencia `core` y `contextual` sobre:
- laderas norte/sur;
- roca y suelo;
- senderos y quebradas;
- estructura vegetal;
- microhábitats visuales;
- microhábitats de las especies piloto;
- variación estacional;
- vistas del cajón del Arrayán y cordones cercanos;
- atmósfera local;
- infraestructura rústica del acceso cuando corresponda a `IT-001`.

Para especies piloto, la captura debe permitir al menos:

```text
species_id
individual_id
observation_id
mapSector / terrainUnit
slopeAspect / slopePosition
substrate
vegetationStructure / canopyCover
hydrology o señal de humedad
associatedSpecies
confidence
```

## Regla de congelamiento

No agregar nuevas categorías, reglas o documentos salvo que una referencia real revele una necesidad no cubierta.

La prioridad pasa de diseñar el sistema a poblarlo y validarlo con evidencia `core`.

## Relación con producción

- `ENVIRONMENT_REFERENCE_PROTOCOL.md`: cómo registrar y evaluar evidencia.
- `references/environments/manifest.csv`: inventario de referencias.
- `SCENE_REFERENCE_BRIEF_TEMPLATE.md`: brief operacional.
- `ENVIRONMENT_PRODUCTION_SPEC.md`: producción técnica de assets.
