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
| PILOT-ENV-006 | `OPEN` | Relación espacial real entre las seis especies piloto y sus microhábitats. | Requiere enlazar referencias ambientales con la fuente botánica vigente. |
| PILOT-ENV-007 | `OPEN` | Variación estacional de color, densidad y atmósfera del territorio núcleo. | Requiere series estacionales. |

## Reglas de apoyo regional

Estas pautas ayudan a interpretar o contrastar el piloto, pero no gobiernan por sí solas el escenario núcleo.

| ID | Estado | Pauta | Referencias | Alcance |
| --- | --- | --- | --- | --- |
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

## Prioridades de poblamiento

El siguiente corpus debe centrarse en evidencia `core` y `contextual` sobre:
- laderas norte/sur;
- roca y suelo;
- senderos y quebradas;
- estructura vegetal;
- microhábitats de las especies piloto;
- variación estacional;
- vistas del cajón del Arrayán y cordones cercanos;
- atmósfera local.

## Regla de congelamiento

No agregar nuevas categorías, reglas o documentos salvo que una referencia real revele una necesidad no cubierta.

La prioridad pasa de diseñar el sistema a poblarlo y validarlo con evidencia `core`.

## Relación con producción

- `ENVIRONMENT_REFERENCE_PROTOCOL.md`: cómo registrar y evaluar evidencia.
- `references/environments/manifest.csv`: inventario de referencias.
- `SCENE_REFERENCE_BRIEF_TEMPLATE.md`: brief operacional.
- `ENVIRONMENT_PRODUCTION_SPEC.md`: producción técnica de assets.
