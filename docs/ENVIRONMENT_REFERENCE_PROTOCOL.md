# Árboris — Protocolo de referencias ambientales

## Objetivo

Definir cómo capturar, localizar, catalogar y usar referencias ambientales para escenarios de Árboris sin confundir observación, interpretación ecológica y decisión artística.

Para el primer piloto, el territorio núcleo es el Fundo Los Nogales. La fuente botánica maestra vigente es `data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx`. Este flujo solo registra su vínculo territorial y no modifica ni reinterpreta su contenido.

## 1. Unidad básica

Cada referencia recibe un `referenceId` único y una fila en `docs/references/environments/manifest.csv`.

El sistema usa seis clasificaciones distintas. No son redundantes:

| Campo | Pregunta que responde | Ejemplo |
| --- | --- | --- |
| `sourceType` | ¿De dónde viene? | `field`, `web`, `institutional`, `scientific`, `art` |
| `referenceKind` | ¿Qué tipo de objeto es? | `photograph`, `institutionalPage`, `managementPlan` |
| `evidenceRole` | ¿Qué puede respaldar? | `visual`, `ecological`, `geomorphological`, `atmospheric`, `artistic` |
| `pilotRelevance` | ¿Qué tan pertinente es para el primer piloto? | `core`, `contextual`, `comparative` |
| `status` | ¿En qué etapa está? | `collected`, `reviewed`, `selected`, `rejected`, `archived` |
| `reviewConfidence` | ¿Qué tan segura es la revisión? | `low`, `medium`, `high` |

## 2. Campos mínimos y ampliados

Para registrar una referencia nueva, completar primero solo los campos mínimos:

- `referenceId`;
- `seriesId` cuando corresponda;
- `sourceType`;
- `referenceKind`;
- `sourceTitle`;
- `pilotRelevance`;
- `botanicalSourceRef` cuando exista vínculo directo;
- `sourceUrl` o procedencia;
- `dateTaken` si se conoce;
- `referenceArea`;
- `location`;
- `approxAltitudeM` si se conoce;
- `slopeAspect` si se conoce;
- `category`;
- `evidenceRole`;
- `observedNotes`;
- `status`;
- `reviewConfidence`.

La metadata ampliada se completa solo cuando la referencia pasa a `reviewed` o `selected`, o cuando un campo sea necesario para una decisión concreta. Entre los campos ampliados se incluyen:

- `photographerOrAuthor`, `rightsHolder`, `license`, `licenseUrl`, `dateAccessed`;
- `latitude`, `longitude`, `locationPrecision`, `season`, `timeOfDay`, `cameraBearing`;
- `environmentType`, `ecosystemId`, `ecosystemName`, `ecosystemSource`;
- `terrainForm`, `slopeClass`, `vegetationStructure`, `canopyCoverClass`;
- `substrate`, `hydrology`, `weatherAtmosphere`;
- `visibleSpecies`, `speciesEvidence`, `landscapeElements`;
- `interpretedNotes`, `ecologicalUse`, `artUse`, `localAssetPath`, `notes`.

No completar campos por inferencia. Vacío o `unknown` es preferible a un dato inventado.

## 3. Modelo de comprensión visual ambiental

Las fotografías ambientales deben analizarse primero como **escena**, no como identificación botánica.

El objetivo inicial no es decir “qué especie es”, sino entender:

```text
qué ambiente es
qué forma de terreno muestra
qué estructura vegetal tiene
qué sustrato domina
qué elementos ancla aparecen
qué función espacial podría cumplir
qué evidencia sí respalda y qué no respalda
```

Esto evita que una foto útil para escenario sea mal utilizada como prueba taxonómica o como regla de colocación de especies.

### Capas de lectura visual

Toda fotografía de ambiente puede revisarse en estas capas:

| Capa | Pregunta | Ejemplos de salida |
| --- | --- | --- |
| `environmentClass` | ¿Qué ambiente general muestra? | bosque esclerófilo, matorral abierto, quebrada, borde de sendero |
| `terrainForm` | ¿Qué forma de terreno domina? | ladera, claro, afloramiento rocoso, cauce, terraza |
| `spatialFunction` | ¿Qué función puede cumplir en mapa? | ruta, bloqueo, borde, nodo, fondo, microhábitat |
| `substrate` | ¿Qué suelo/material se observa? | roca granítica, suelo desnudo, hojarasca, arena, grava |
| `vegetationStructure` | ¿Cómo se organiza la vegetación? | estrato bajo, arbustos medios, dosel denso, manchas irregulares |
| `anchorElements` | ¿Qué rasgos hacen reconocible la escena? | roca grande, cactus, sendero, tronco, reja, puente, estero |
| `scaleEvidence` | ¿Hay referencia de escala? | persona, camino, construcción, baranda, árbol conocido |
| `gameplayReading` | ¿Qué se puede traducir a juego? | celda caminable, obstáculo, desnivel, punto de interacción |

Estas capas son interpretaciones de trabajo. Deben distinguirse de `observedNotes`.

## 4. Taxonomía inicial de escenas

La clasificación de escenas permite organizar referencias sin crear reglas ecológicas prematuras.

Taxonomía inicial para el piloto:

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

Esta taxonomía no reemplaza `environmentType`, `terrainForm` ni `category`; ayuda a revisar series fotográficas y entrenar criterio visual.

No crear subtipos nuevos salvo que una referencia real no pueda clasificarse adecuadamente con este conjunto.

## 5. Microhábitats visuales

Un microhábitat visual es una combinación observable de terreno, sustrato, humedad aparente y vegetación. No equivale automáticamente a microhábitat ecológico validado ni a regla de ubicación de especies.

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

- puede usarse para Dirección de Arte;
- puede orientar hipótesis de colocación;
- no puede cerrar `PILOT-ENV-006` sin observaciones territorializadas `core`;
- debe conservar el vínculo con las fotografías concretas que lo originan.

## 6. Series fotográficas y escala

Fotografías tomadas en una misma visita, punto o secuencia próxima deben compartir `seriesId`.

Una serie puede contener paisaje, vegetación, suelo, roca y cielo, pero no cuenta como varias evidencias independientes para declarar un patrón recurrente.

Cuando una serie incluye personas, construcciones, caminos, barandas u otros objetos de tamaño conocido, puede aportar evidencia de escala.

Las personas visibles se etiquetan solo por su función de referencia espacial:

```text
containsPerson: true
personRole: scale_reference
```

No usar estas fotos para reconocimiento de personas ni para entrenar identidad personal. Su valor es medir proporciones del terreno, altura de vegetación, tamaño de rocas, ancho de sendero y distancia entre elementos.

## 7. Perfiles de registro

No todas las referencias requieren la misma profundidad de metadata.

### Fotografía atmosférica
Priorizar: procedencia, lugar, fecha, `weatherAtmosphere`, `artUse`.

### Fotografía de ladera o vegetación
Priorizar: lugar, altitud, `slopeAspect`, `vegetationStructure`, `substrate`, `observedNotes`.

### Fotografía de microhábitat
Priorizar: `terrainForm`, `substrate`, `hydrology`, `vegetationStructure`, `anchorElements`, relación con sendero/cauce/roca y utilidad de gameplay.

### Fotografía con persona como escala
Priorizar: `scaleEvidence`, distancia aproximada, tamaño relativo de roca/vegetación/sendero y encuadre. No usar para identidad personal.

### Fuente institucional o científica
Priorizar: procedencia, `ecosystemId`, `ecosystemName`, `ecosystemSource`, `ecologicalUse`.

### Referencia `core` del Fundo Los Nogales
Registrar con mayor profundidad porque puede afectar directamente el escenario piloto. Priorizar además `botanicalSourceRef`, altitud, exposición, estructura vegetal, microhábitat y cualquier vínculo verificable con las especies piloto.

## 8. Fuente botánica maestra

`data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx` es la fuente botánica maestra vigente del primer piloto y documenta el levantamiento de flora nativa del Fundo Los Nogales.

Su función aquí es dar trazabilidad territorial y botánica. No sustituye una fotografía ambiental ni una fuente ecológica.

Usar `botanicalSourceRef=data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx` solo cuando exista vínculo documental directo con la referencia. No asignarlo por simple proximidad geográfica.

Reglas de integración:

- no modificar el Master desde el flujo ambiental;
- no copiar campos derivados sin revisión;
- no inferir metadata ambiental que el Master no declare;
- si una futura versión sustituye al Master 2.0, actualizar esta referencia de forma explícita y trazable.

### Conteos de observación y colocación de especies

Los conteos por especie extraídos del Master 2.0 son datos computables válidos para estimar peso de presencia dentro de la muestra del piloto. No equivalen automáticamente a abundancia ecológica real ni a una regla de microhábitat.

Distinguir siempre tres conteos:

- `observationCount`: número de observaciones reales de la especie;
- `photoCount`: número de fotografías o evidencias asociadas;
- `individualCount`: número de individuos físicos diferenciados.

No usar `photoCount` como sustituto silencioso de `observationCount`. Si una tabla de trabajo utiliza fotografías porque el conteo de observaciones aún no está disponible o no está exportado, debe etiquetarlo como evidencia fotográfica, no como observación.

Regla de uso:

```text
conteo por especie → peso de aparición / prioridad visual
conteo por especie + unidad territorial → regla de colocación
```

Un conteo no estratificado por sector, exposición, pendiente, cobertura, sustrato, hidrología o microhábitat solo permite ajustar densidad relativa, probabilidad de encuentro o prioridad de representación. No permite ubicar una especie con rigor dentro de una ladera, quebrada, borde de sendero u otra unidad del mapa.

Una regla de colocación solo puede formularse cuando las observaciones estén territorializadas, por ejemplo:

```text
species_id + observation_id + individual_id
+ referenceArea / mapSector / terrainUnit
+ slopeAspect / slopePosition / substrate
+ vegetationStructure / canopyCover / hydrology
+ associatedSpecies / evidenceConfidence
```

Para una primera ponderación interna puede usarse:

```text
spawnWeight = observationCount_species / totalObservationCount
```

Ese valor es un prior de muestra del piloto, no una afirmación de abundancia poblacional. Debe revisarse si hay sesgo de muestreo, múltiples fotografías de un mismo individuo, series no independientes o sectores con diferente esfuerzo de observación.

Cuando los conteos estén estratificados por unidad ambiental, la regla pasa a:

```text
placementWeight(species, terrainUnit)
  = observations(species, terrainUnit) / observations(species)
```

Ese cálculo solo puede informar una regla de arte si las observaciones son `core` o están inequívocamente vinculadas al Fundo Los Nogales. Referencias `contextual` o `comparative` pueden orientar hipótesis, pero no gobernar por sí solas la colocación del escenario núcleo.

## 9. Jerarquía territorial del piloto

### `core` — Fundo Los Nogales
Territorio principal del primer escenario y del levantamiento botánico que origina las especies piloto.

### `contextual` — cuenca del Arrayán / Santuario Los Nogales
Contexto inmediato para interpretar altitud, exposición de ladera, continuidad de cordones y variación vegetal local.

### `comparative` — Yerba Loca, Río Clarillo, Pirque y otras áreas
Sirven para probar qué rasgos son regionales, ecosistémicos o locales. No deben definir por sí solas la apariencia del escenario núcleo.

`pilotRelevance` expresa pertinencia territorial, no calidad científica.

## 10. Observación, interpretación y decisión artística

Toda revisión separa tres niveles:

- `observedNotes`: lo directamente visible o documentado;
- `interpretedNotes`: lectura contextual o hipótesis;
- regla de arte: decisión adoptada por dirección de arte.

Una sola referencia puede justificar una solución de escena específica, pero no una regla general del ecosistema.

## 11. Promoción de patrones a reglas

Estados de pauta:

- `OBSERVED`: documentada en una o más referencias concretas;
- `RECURRENT`: repetida en varias referencias independientes;
- `APPROVED_ART_RULE`: decisión artística aprobada;
- `OPEN`: todavía insuficientemente sustentada.

Para convertir una pauta en `APPROVED_ART_RULE` del primer escenario:

1. debe existir evidencia suficiente y trazable;
2. debe revisarse su alcance geográfico, altitudinal y estacional;
3. debe revisarse su pertinencia territorial;
4. **no puede depender exclusivamente de referencias `comparative`**.

Una referencia `comparative` puede apoyar, contrastar o cuestionar una regla, pero no gobernar por sí sola la apariencia del núcleo.

## 12. Captura de campo

Para una visita de campo, priorizar una serie breve y útil:

- paisaje general;
- estructura vegetal media;
- suelo y roca;
- sendero o microhábitat;
- quebrada/cauce si existe;
- cielo y horizonte.

En Fundo Los Nogales y Arrayán registrar cuando sea posible altitud, sector, exposición de ladera, rumbo de cámara, hora, estación y `seriesId`.

Cuando una referencia tenga una especie piloto visible, registrar además el vínculo botánico mínimo:

```text
species_id
individual_id si se conoce
observation_id si se conoce
tipo de evidencia visible
confidence
```

Ese vínculo permite cruzar después el conteo botánico con unidades de mapa sin alterar el Master ni agregar columnas nuevas al `manifest`.

## 13. Uso de referencias web y de ChatGPT

ChatGPT puede localizar referencias públicas, comparar paisajes, identificar vacíos, analizar recurrencias y ayudar a redactar reglas.

No debe:

- convertir una imagen web en asset sin verificar derechos;
- atribuir ubicación o especie sin evidencia;
- usar referencia artística como evidencia ecológica;
- presentar una fotografía aislada como descripción universal de un ecosistema.

## 14. Regla de congelamiento provisional

El esquema actual se considera **provisionalmente congelado** durante la fase de poblamiento del corpus `core`.

No agregar nuevos campos, categorías ni documentos salvo que una necesidad real del corpus no pueda resolverse con el esquema existente.

El trabajo siguiente debe concentrarse en poblar y probar el sistema, no en seguir diseñándolo.
