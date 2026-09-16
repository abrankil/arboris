# Árboris — Protocolo de referencias ambientales

## Objetivo

Definir cómo capturar, localizar, catalogar y usar referencias ambientales para escenarios de Árboris sin confundir observación, interpretación ecológica y decisión artística.

Para el primer piloto, el territorio núcleo es el Fundo Los Nogales. La fuente botánica maestra es `data/source/Base_botanica_Pokedex_flora_Master.xlsx`. Mientras Alejandra mejora esa planilla, este flujo solo registra su vínculo territorial y no modifica ni reinterpreta su contenido.

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

## 3. Perfiles de registro

No todas las referencias requieren la misma profundidad de metadata.

### Fotografía atmosférica
Priorizar: procedencia, lugar, fecha, `weatherAtmosphere`, `artUse`.

### Fotografía de ladera o vegetación
Priorizar: lugar, altitud, `slopeAspect`, `vegetationStructure`, `substrate`, `observedNotes`.

### Fuente institucional o científica
Priorizar: procedencia, `ecosystemId`, `ecosystemName`, `ecosystemSource`, `ecologicalUse`.

### Referencia `core` del Fundo Los Nogales
Registrar con mayor profundidad porque puede afectar directamente el escenario piloto. Priorizar además `botanicalSourceRef`, altitud, exposición, estructura vegetal, microhábitat y cualquier vínculo verificable con las especies piloto.

## 4. Fuente botánica maestra

`data/source/Base_botanica_Pokedex_flora_Master.xlsx` es la fuente botánica maestra del primer piloto y documenta el levantamiento de flora nativa del Fundo Los Nogales.

Su función aquí es dar trazabilidad territorial y botánica. No sustituye una fotografía ambiental ni una fuente ecológica.

Usar `botanicalSourceRef=data/source/Base_botanica_Pokedex_flora_Master.xlsx` solo cuando exista vínculo documental directo con la referencia. No asignarlo por simple proximidad geográfica.

Mientras la planilla esté en mejora:

- no modificarla desde esta rama;
- no copiar campos desde versiones intermedias sin revisión;
- no inferir metadata ambiental que la planilla no declare.

## 5. Jerarquía territorial del piloto

### `core` — Fundo Los Nogales
Territorio principal del primer escenario y del levantamiento botánico que origina las especies piloto.

### `contextual` — cuenca del Arrayán / Santuario Los Nogales
Contexto inmediato para interpretar altitud, exposición de ladera, continuidad de cordones y variación vegetal local.

### `comparative` — Yerba Loca, Río Clarillo, Pirque y otras áreas
Sirven para probar qué rasgos son regionales, ecosistémicos o locales. No deben definir por sí solas la apariencia del escenario núcleo.

`pilotRelevance` expresa pertinencia territorial, no calidad científica.

## 6. Series y pseudorreplicación

Fotografías tomadas en una misma visita, punto o secuencia próxima deben compartir `seriesId`.

Una serie puede contener paisaje, vegetación, suelo, roca y cielo, pero no cuenta como varias evidencias independientes para declarar un patrón recurrente.

Para promover una observación a patrón, buscar independencia entre series, fechas, lugares o fuentes.

## 7. Observación, interpretación y decisión artística

Toda revisión separa tres niveles:

- `observedNotes`: lo directamente visible o documentado;
- `interpretedNotes`: lectura contextual o hipótesis;
- regla de arte: decisión adoptada por dirección de arte.

Una sola referencia puede justificar una solución de escena específica, pero no una regla general del ecosistema.

## 8. Promoción de patrones a reglas

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

## 9. Captura de campo

Para una visita de campo, priorizar una serie breve y útil:

- paisaje general;
- estructura vegetal media;
- suelo y roca;
- sendero o microhábitat;
- quebrada/cauce si existe;
- cielo y horizonte.

En Fundo Los Nogales y Arrayán registrar cuando sea posible altitud, sector, exposición de ladera, rumbo de cámara, hora, estación y `seriesId`.

## 10. Uso de referencias web y de ChatGPT

ChatGPT puede localizar referencias públicas, comparar paisajes, identificar vacíos, analizar recurrencias y ayudar a redactar reglas.

No debe:

- convertir una imagen web en asset sin verificar derechos;
- atribuir ubicación o especie sin evidencia;
- usar referencia artística como evidencia ecológica;
- presentar una fotografía aislada como descripción universal de un ecosistema.

## 11. Regla de congelamiento provisional

El esquema actual se considera **provisionalmente congelado** durante la fase de poblamiento del corpus `core`.

No agregar nuevos campos, categorías ni documentos salvo que una necesidad real del corpus no pueda resolverse con el esquema existente.

El trabajo siguiente debe concentrarse en poblar y probar el sistema, no en seguir diseñándolo.
