# Árboris — Dirección de arte de escenarios

## Estado

**Versión inicial de marco con primeras pautas derivadas del corpus piloto.** Este documento define cómo convertir referencias reales en decisiones visuales coherentes para escenarios y assets ambientales. No pretende cerrar todavía un manual ecológico completo del bosque esclerófilo.

Las reglas específicas deben crecer a partir del corpus curado en `docs/references/environments/` y de fuentes botánicas/ecológicas pertinentes.

## Propósito

Los escenarios de Árboris deben sentirse como interpretaciones reconocibles del territorio chileno y no como fondos mediterráneos genéricos. La estilización puede simplificar forma, color y profundidad, pero debe conservar estructura espacial, vegetación, relieve y atmósfera suficientemente coherentes con las referencias reales que sustentan cada escena.

Para el primer piloto, la dirección de arte debe mantener coherencia territorial con el levantamiento botánico del Fundo Los Nogales registrado en `data/source/Base_botanica_Pokedex_flora_Master.xlsx`.

## Principio central

La dirección de arte sigue esta cadena:

```text
realidad observada
→ análisis del lugar
→ patrón visual
→ regla de arte
→ traducción a pixel art
```

No usar una generación previa como fuente de verdad sobre paisaje, flora o ecología.

Para el primer piloto, la cadena territorial es:

```text
levantamiento botánico Fundo Los Nogales
→ especies piloto
→ referencias ambientales Los Nogales / Arrayán
→ reglas de escenario
→ escena piloto
```

Yerba Loca, Río Clarillo, Pirque y otras áreas se utilizan para contraste o ampliación, no para reemplazar por defecto el territorio núcleo.

## Capas de decisión

### 1. Territorio

Define:

- forma del relieve;
- pendiente;
- relación entre ladera, quebrada y valle;
- presencia de cordillera o horizonte;
- exposición visual;
- continuidad o apertura del paisaje.

### 2. Estructura vegetal

Define:

- densidad;
- altura relativa de estratos;
- masas y vacíos;
- siluetas dominantes;
- relación entre árboles, arbustos, hierbas, rocas y suelo expuesto.

La estructura vegetal se analiza primero como masa y distribución. La identificación de especies específicas se documenta aparte y solo se incorpora cuando esté respaldada.

### 3. Suelo y roca

Define:

- porcentaje visual de suelo desnudo;
- tamaño y frecuencia de rocas;
- formas dominantes;
- color y contraste;
- relación con senderos y vegetación.

### 4. Atmósfera

Define:

- hora del día;
- nubosidad;
- profundidad atmosférica;
- temperatura aparente de la luz;
- neblina, lluvia o sequedad visual;
- contraste entre primer plano y fondo.

### 5. Composición jugable

La fidelidad realista no debe destruir lectura de juego. El escenario debe conservar:

- plano jugable legible;
- separación suficiente entre fondo y personajes;
- zonas calmas para UI cuando corresponda;
- contraste de silueta;
- jerarquía clara entre elementos decorativos y relevantes.

## Coherencia realista

Una escena se considera coherente cuando sus decisiones principales pueden rastrearse a referencias concretas y no mezclan elementos incompatibles sin justificación.

El objetivo no es reconstrucción fotográfica exacta. Es mantener relaciones plausibles entre:

- relieve;
- vegetación;
- roca/suelo;
- estación;
- altitud o transición visual;
- luz y atmósfera.

En el primer piloto, coherencia también significa que el escenario no debe contradecir sin justificación el territorio del que proviene la selección botánica.

## Jerarquía territorial del primer piloto

### `core` — Fundo Los Nogales / Los Nogales

Es la referencia territorial principal del primer escenario porque la base botánica maestra del piloto proviene del levantamiento del Fundo Los Nogales.

Las fotografías y registros inequívocamente vinculados al mismo territorio deben tener mayor peso al decidir:

- estructura de ladera;
- densidad y distribución vegetal;
- relación entre especies piloto y microhábitat;
- roca y suelo;
- quebradas, senderos y aperturas;
- atmósfera local.

### `contextual` — cuenca del Arrayán / Santuario Los Nogales

Amplía el territorio núcleo y ayuda a interpretar pisos altitudinales, exposición de ladera, continuidad de cordones y variación vegetal local.

No todo el Santuario Los Nogales debe asumirse idéntico al Fundo Los Nogales: el contexto debe documentarse por sector, altitud y exposición.

### `comparative` — Yerba Loca, Río Clarillo, Pirque y otras áreas

Estas referencias sirven para comprobar qué rasgos son regionales, ecosistémicos o propios de otros sectores de la precordillera.

Yerba Loca es especialmente útil para gradiente altitudinal, relieve, valle, nieve, senderos de montaña y transición hacia alta montaña. Río Clarillo y Pirque aportan contraste regional para bosque esclerófilo P41, quebradas y estructura vegetal.

Una referencia `comparative` puede inspirar o respaldar una pauta general, pero no debe imponer por sí sola la apariencia del escenario núcleo.

## Escala de certeza

Toda pauta futura debe marcarse como una de estas:

- `OBSERVED` — visible o documentada en referencias concretas;
- `RECURRENT` — aparece de forma consistente en varias referencias independientes;
- `APPROVED_ART_RULE` — decisión de dirección de arte basada en evidencia y necesidades visuales;
- `OPEN` — aún insuficientemente sustentada.

No convertir automáticamente `OBSERVED` en regla general. Una fuente institucional puede respaldar contexto ecológico sin convertirse por sí sola en una pauta compositiva.

Además, una pauta puede ser científicamente válida pero territorialmente poco pertinente para el primer escenario. Por eso el manifest usa `pilotRelevance=core|contextual|comparative`.

## Bosque esclerófilo — marco inicial

El bosque esclerófilo será el primer corpus de entrenamiento visual para este manual. El corpus piloto actual contiene referencias institucionales, científicas y fotográficas de Los Nogales / Arrayán, Yerba Loca, Río Clarillo, Pirque y vistas de la cordillera desde Santiago.

El ecosistema P41 — `Bosque esclerofilo mediterráneo andino de Quillaja saponaria - Lithraea caustica` — funciona como marco ecológico importante del piloto. La fuente institucional registrada en `ENV-0003` lo sitúa entre aproximadamente 200 y 1.400 m y documenta variación desde bosque esclerófilo hasta estados degradados de matorral arborescente o espinal.

Sin embargo, el P41 es un marco ecosistémico amplio. Para la apariencia del primer escenario, el territorio de Los Nogales tiene prioridad de pertinencia sobre referencias externas del mismo ecosistema.

## Primeras pautas derivadas del corpus piloto

Estas pautas son el primer resultado del sistema de referencias. Todavía no sustituyen las futuras láminas comparativas ni cierran decisiones de paleta, proporción o densidad numérica fuera de los alcances indicados.

| ID | Estado | Pauta | Referencias | Alcance |
| --- | --- | --- | --- | --- |
| ENV-RULE-001 | `RECURRENT` | La altitud y el tipo de ambiente deben declararse antes de usar una referencia de precordillera como modelo de escena. | ENV-0001, ENV-0002, ENV-0003, ENV-0004 | Precordillera de Santiago y corpus piloto. |
| ENV-RULE-002 | `RECURRENT` | El bosque esclerófilo no debe representarse por defecto como una masa arbórea continua: el corpus admite bosque, matorral, aperturas y estados degradados según lugar y condición. | ENV-0002, ENV-0003, ENV-0004, ENV-0008 | Bosque esclerófilo del corpus central. |
| ENV-RULE-003 | `OBSERVED` | En Río Clarillo, la asociación peumo–litre–quillay documentada entre 870 y 1.500 m presenta preferencia por exposición sur, cobertura aproximada de 50–60 % y suelos graníticos de mayor desarrollo. | ENV-0005 | Local a la unidad descrita por el plan de manejo de Río Clarillo; no generalizar todavía. |
| ENV-RULE-004 | `RECURRENT` | Las quebradas y cauces deben tratarse como microambientes diferenciados de la ladera general: roca expuesta, bloques, agua y vegetación de borde pueden dominar la lectura local. | ENV-0006, ENV-0007 | Ambientes ribereños de Río Clarillo; requiere ampliar corpus core/contextual. |
| ENV-RULE-005 | `OBSERVED` | El borde de bosque puede transicionar a una matriz abierta sin una frontera visual rígida. | ENV-0008 | Pirque; una sola serie fotográfica. |
| ENV-RULE-006 | `RECURRENT` | La profundidad cordillerana puede expresarse mediante pérdida progresiva de contraste y presencia de bruma o atmósfera entre planos. | ENV-0009, ENV-0010 | Vistas de Andes desde Santiago/cuenca. |
| ENV-RULE-007 | `OBSERVED` | En una referencia invernal de atardecer, la última luz cálida puede iluminar cumbres nevadas mientras los planos inferiores permanecen más fríos o velados. | ENV-0009 | Condición atmosférica y temporal específica; no generalizar a todo atardecer. |
| ENV-RULE-008 | `OBSERVED` | Un cauce longitudinal puede funcionar compositivamente como eje que conduce la mirada hacia la cordillera y refuerza la profundidad de escena. | ENV-0007 | Río Clarillo; pauta compositiva candidata, no regla ecológica. |

## Consecuencias de dirección de arte provisionales

### Relieve y transición altitudinal

`ENV-RULE-001` impide usar “Yerba Loca”, “Arrayán” o “precordillera” como etiquetas visuales suficientes. Un brief de escenario debe declarar al menos:

- área de referencia;
- `pilotRelevance`;
- rango altitudinal aproximado;
- ambiente representado;
- ecosistema de referencia cuando esté disponible.

Un escenario bajo/medio de bosque esclerófilo no debe mezclar por conveniencia rasgos de vegas, herbazales de alta montaña, nieve permanente o glaciares pertenecientes a otros tramos del gradiente.

### Masa vegetal y vacíos

`ENV-RULE-002` orienta a evitar dos extremos igualmente genéricos:

- bosque cerrado uniforme en todo el escenario;
- ladera casi desnuda con arbustos distribuidos al azar.

La composición debe trabajar masas, claros, suelo expuesto y cambios de densidad según la referencia concreta. Todavía permanece `OPEN` una regla cuantitativa general de cobertura para el territorio núcleo.

### Exposición de ladera

La relación entre exposición y estructura vegetal ya cuenta con evidencia ecológica regional suficiente para considerarse una variable real, pero todavía falta corpus visual `core` para fijar cómo se traducirá específicamente al escenario del Fundo Los Nogales.

Las referencias comparativas no deben convertirse automáticamente en una regla gráfica del núcleo.

### Quebradas y cauces

`ENV-RULE-004` establece una primera distinción visual útil. En ambientes ribereños, priorizar lectura de:

- lecho y bloques;
- relación agua–roca;
- borde vegetal;
- encajonamiento;
- humedad visual local.

La próxima validación debe buscar referencias equivalentes en Los Nogales / Arrayán.

### Cordillera y atmósfera

`ENV-RULE-006` permite incorporar profundidad atmosférica como parte del lenguaje realista de Santiago. En pixel art, esto puede traducirse mediante:

- menor contraste en planos lejanos;
- menor separación tonal dentro de los cordones distantes;
- bruma o veladura resuelta por bloques y paleta, no por blur fotográfico;
- siluetas sucesivas de cordones antes de la montaña principal cuando la referencia lo muestre.

La combinación cálido-frío del atardecer invernal de `ENV-0009` permanece `OBSERVED`; puede usarse en una escena específica, no como paleta estándar del proyecto.

## Materias que siguen abiertas

La búsqueda y captura siguientes deben priorizar el territorio `core` y `contextual`, especialmente:

- diferencias visuales entre laderas norte y sur en Los Nogales / Arrayán;
- frecuencia de roca y suelo desnudo por sector y altitud;
- estructura de senderos del territorio núcleo y su contexto inmediato;
- color estacional del bosque en verano, otoño, invierno y primavera;
- variación de dosel entre quebrada y ladera;
- presencia y forma visual de chaguales, cactus y herbáceas por microhábitat;
- relación espacial real entre las especies piloto y los ambientes donde aparecen;
- paletas de cielo y condiciones atmosféricas propias del sector;
- vistas de cordones y profundidad del cajón del Arrayán.

Estas materias permanecen `OPEN` hasta contar con evidencia suficientemente localizada.

## Manual visual futuro

A partir del corpus deberán desarrollarse láminas comparativas para:

- paisaje general;
- perfiles de ladera;
- quebradas;
- senderos;
- agrupación de vegetación;
- roca y suelo;
- transición altitudinal;
- cielo y atmósfera;
- invierno/verano u otras diferencias estacionales suficientemente documentadas.

Cada lámina debe incluir referencias, `pilotRelevance`, patrón observado, alcance y traducción a pixel art. Una lámina no convierte automáticamente una observación local en regla general.

## Uso con generación asistida

Un prompt de escenario debe citar o resumir las referencias seleccionadas y separar:

1. elementos obligatorios derivados de la realidad;
2. simplificaciones permitidas;
3. decisiones compositivas;
4. elementos que permanecen abiertos.

Para el primer escenario, el prompt debe priorizar referencias `core`, complementar con `contextual` y usar `comparative` solo cuando su función esté declarada.

La IA no debe completar automáticamente flora, relieve o clima que no estén definidos en el brief.

## Relación con producción

La especificación técnica de tamaño, capas, parallax y entrega está en [`ENVIRONMENT_PRODUCTION_SPEC.md`](ENVIRONMENT_PRODUCTION_SPEC.md). Este documento gobierna la coherencia visual; la especificación de producción gobierna cómo se construye y exporta el asset.

La biblioteca y protocolo de referencias están en:

- [`references/environments/README.md`](references/environments/README.md)
- [`ENVIRONMENT_REFERENCE_PROTOCOL.md`](ENVIRONMENT_REFERENCE_PROTOCOL.md)

La fuente botánica maestra del primer piloto está en:

- `data/source/Base_botanica_Pokedex_flora_Master.xlsx`
