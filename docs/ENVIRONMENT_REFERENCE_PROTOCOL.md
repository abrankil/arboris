# Árboris — Protocolo de referencias ambientales

## Objetivo

Definir cómo capturar, localizar, catalogar y usar referencias fotográficas para escenarios y assets de entorno sin confundir observación real, interpretación ecológica y estilización artística.

El sistema debe permitir construir un manual de dirección de arte territorialmente coherente para la precordillera de Santiago y el bosque esclerófilo, manteniendo explícitos los límites geográficos, altitudinales y estacionales de cada referencia.

## 1. Fuentes aceptadas

### Fotografías de campo

Preferidas cuando el proyecto puede registrar contexto directamente. Pueden provenir de Alejandra, Álvaro u otra persona identificada del equipo.

Registrar, cuando se conozca:

- fecha;
- lugar y área protegida o sector de referencia;
- coordenadas y precisión de ubicación;
- altitud aproximada;
- estación;
- hora del día;
- rumbo de cámara;
- exposición de la ladera (`slopeAspect`), cuando pueda establecerse;
- tipo de ambiente y forma del terreno;
- estructura de vegetación;
- sustrato, roca, suelo e hidrología visibles;
- especies visibles y nivel de evidencia de su identificación;
- observaciones de terreno.

No completar datos por inferencia si no fueron observados, medidos o respaldados por una fuente. Los campos desconocidos pueden quedar vacíos o marcarse como `unknown`.

### Referencias web

ChatGPT puede ayudar a localizar material público útil, pero la selección debe conservar siempre su procedencia. Registrar URL, fuente o autor cuando esté disponible, fecha de consulta, titular de derechos y licencia si puede verificarse.

Una imagen encontrada en Internet es una referencia externa. No debe copiarse al repositorio ni reutilizarse como asset de producción salvo que su licencia lo permita explícitamente.

### Fuentes institucionales o científicas

Pueden utilizarse para reforzar contexto ecológico, distribución, geomorfología, estructura de vegetación, rango altitudinal o clasificación ecosistémica. La imagen y la interpretación científica deben mantenerse diferenciadas.

Cuando exista una clasificación oficial aplicable, registrar `ecosystemId`, `ecosystemName` y `ecosystemSource` en vez de usar únicamente etiquetas amplias como “bosque esclerófilo”.

### Referencias artísticas

Se usan para estudiar composición, atmósfera, profundidad, iluminación o lenguaje visual. Deben marcarse como `sourceType=art` y no respaldan afirmaciones ecológicas.

## 2. Unidad básica: registro de referencia

Cada referencia recibe un `referenceId` único y una fila en `docs/references/environments/manifest.csv`.

El manifest distingue cinco grupos de información:

### A. Identidad y procedencia

- `referenceId`;
- `seriesId`;
- `sourceType`;
- `evidenceRole`;
- `photographerOrAuthor`;
- `rightsHolder`;
- `sourceUrl`;
- `license`;
- `licenseUrl`;
- `dateAccessed`;
- `dateTaken`.

### B. Contexto espacial y temporal

- `location`;
- `protectedArea`;
- `referenceArea`;
- `latitude`;
- `longitude`;
- `locationPrecision`;
- `approxAltitudeM`;
- `season`;
- `timeOfDay`;
- `cameraBearing`;
- `slopeAspect`.

`cameraBearing` y `slopeAspect` son campos distintos: el primero indica hacia dónde mira la fotografía; el segundo describe la exposición de la superficie o ladera documentada. No deben confundirse.

### C. Contexto ecológico y físico

- `environmentType`;
- `ecosystemId`;
- `ecosystemName`;
- `ecosystemSource`;
- `category`;
- `terrainForm`;
- `slopeClass`;
- `vegetationStructure`;
- `canopyCoverClass`;
- `substrate`;
- `hydrology`;
- `weatherAtmosphere`;
- `visibleSpecies`;
- `speciesEvidence`;
- `landscapeElements`.

`speciesEvidence` debe indicar la naturaleza de la identificación, por ejemplo `confirmed`, `sourceReported`, `visuallyProbable` o `unknown`. Una especie mencionada en una descripción de página no se considera automáticamente confirmada como visible en cada fotografía.

### D. Lectura y uso de la referencia

- `observedNotes` — hechos directamente visibles o documentados;
- `interpretedNotes` — hipótesis o lectura contextual;
- `ecologicalUse` — qué puede respaldar ecológicamente;
- `artUse` — qué puede orientar visualmente;
- `reviewConfidence` — confianza de la revisión.

### E. Gestión

- `localAssetPath`;
- `status`;
- `notes`.

Los campos desconocidos se dejan vacíos o se indican como `unknown`; no se inventan.

## 3. Series y pseudorreplicación

Las fotografías tomadas en una misma visita, punto o secuencia próxima deben compartir un `seriesId`.

Una serie puede documentar distintos planos —paisaje, vegetación, suelo, roca, cielo—, pero no cuenta como múltiples evidencias independientes para declarar un patrón recurrente del ecosistema.

Para pasar de una observación a una pauta general se debe buscar independencia entre series, lugares, fechas o fuentes institucionales.

## 4. Roles de evidencia

`evidenceRole` debe indicar para qué autoridad se incorpora una referencia. Valores iniciales recomendados:

- `ecological`;
- `visual`;
- `atmospheric`;
- `geomorphological`;
- `artistic`;
- combinaciones explícitas cuando una fuente cumpla más de un rol.

El rol no reemplaza `ecologicalUse` ni `artUse`; define el tipo de evidencia que la referencia puede aportar.

## 5. Estados del registro

Usar uno de estos estados:

- `collected`: incorporada al inventario, aún no analizada;
- `reviewed`: procedencia y contenido revisados;
- `selected`: elegida para sustentar una decisión de dirección de arte;
- `rejected`: conservada solo para trazabilidad, no debe orientar producción;
- `archived`: ya no participa del corpus activo.

## 6. Categorías visuales

Las primeras categorías de trabajo son:

- paisaje general;
- ladera;
- quebrada;
- sendero;
- roca y suelo;
- estructura de vegetación;
- microhábitat;
- cordillera y relieve;
- cielo y nubes;
- neblina, lluvia y atmósfera;
- luz y hora del día;
- referencia artística.

Se pueden ampliar cuando el corpus lo justifique. Evitar crear categorías por una sola imagen aislada.

## 7. Áreas de referencia prioritarias

### Yerba Loca — precordillera de Santiago

Yerba Loca se adopta como **área de referencia prioritaria** para estudiar visualmente la precordillera de Santiago, no como plantilla universal para todo el bosque esclerófilo chileno.

La información institucional disponible la describe como un territorio montañoso del valle del estero Yerba Loca, en Lo Barnechea, con un gradiente aproximado entre 1.300 y 5.340 m s. n. m. y con el objetivo explícito de conservar la ecología original de la precordillera. Dentro del área aparecen, entre otros, el bosque esclerófilo mediterráneo andino de `Quillaja saponaria - Lithraea caustica`, el bosque esclerófilo andino de `Kageneckia angustifolia / Guindilia trinervis`, matorrales y herbazales de altitud, vegas, afloramientos rocosos, nieve y glaciares.

Por esta amplitud altitudinal, **“Yerba Loca” no debe funcionar como una sola categoría visual**. Toda referencia del área debe registrar altitud aproximada, tipo de ambiente y, cuando corresponda, ecosistema oficial. Esto permite distinguir precordillera esclerófila baja/media, transición altitudinal y ambientes de alta montaña.

Para el piloto de Árboris, las referencias de Yerba Loca son especialmente valiosas para:

- relación entre ladera, quebrada, fondo cordillerano y valle encajonado;
- estructura del bosque y matorral de precordillera;
- afloramientos rocosos, suelo expuesto y cauces;
- transiciones altitudinales visibles;
- profundidad atmosférica y lectura de cordones montañosos;
- variación estacional de nieve, sequedad, vegetación y cielo.

Las reglas extraídas desde Yerba Loca deben indicar el tramo altitudinal y ambiente al que corresponden.

### Arrayán / Los Nogales

La cuenca del Arrayán y el Santuario Los Nogales constituyen una segunda área prioritaria complementaria. La fuente institucional describe allí formaciones de matorral esclerófilo andino, bosque esclerófilo andino y matorral xerófilo distribuidas por pisos altitudinales y diferencias de exposición solar.

Por ello, `slopeAspect`, `approxAltitudeM`, `vegetationStructure` y `ecosystemName` se consideran campos de alto valor para las referencias de esta zona.

### Uso de áreas prioritarias

Las áreas prioritarias sirven para construir profundidad documental local y comparaciones repetibles. No impiden incorporar Río Clarillo, Cajón del Maipo, La Campana u otras zonas cuando ayuden a contrastar estructuras, límites geográficos o variantes del bosque esclerófilo.

## 8. Análisis de una referencia

El análisis debe separar tres niveles:

### A. Observado

Lo directamente visible o documentado: pendiente, densidad aparente, distribución de rocas, silueta vegetal, color del cielo, profundidad atmosférica, etc.

### B. Interpretado

Hipótesis o lectura contextual: humedad relativa aparente, transición altitudinal, identificación visual no confirmada, relación funcional entre estratos, etc. Debe marcarse como interpretación y no como dato observado.

### C. Decisión artística

Qué se adopta para Árboris: relación entre estratos, amplitud del horizonte, paleta atmosférica, densidad de elementos, lectura de masa vegetal, escala de roca, etc.

## 9. De referencia a patrón

Una sola referencia puede justificar una solución de escena específica, pero no una regla general del ecosistema.

Para convertir una observación en pauta del manual de escenarios, exigir:

1. varias series independientes o una fuente institucional/científica que la respalde;
2. coherencia con la evidencia disponible;
3. revisión de dirección de arte;
4. formulación que indique alcance geográfico, altitudinal o estacional cuando corresponda.

El manual debe distinguir:

- `observed` — documentado en referencias concretas;
- `recurrent` — repetido en varias referencias independientes;
- `approvedArtRule` — decisión de dirección de arte;
- `open` — todavía insuficientemente sustentado.

## 10. Captura de campo recomendada

Cuando Alejandra o Álvaro documenten una zona, priorizar series breves en vez de una sola fotografía:

- vista amplia del paisaje;
- vista media de estructura vegetal;
- suelo y roca;
- borde de sendero o microhábitat;
- cielo y horizonte;
- cauce, quebrada o elemento hídrico cuando exista;
- fotografías adicionales de elementos especialmente representativos.

En áreas como Yerba Loca y Arrayán, registrar cuando sea posible:

- altitud aproximada;
- punto o sector;
- exposición de la ladera;
- dirección de la fotografía;
- hora;
- estación;
- si la imagen pertenece a una misma serie de captura.

No es necesario fotografiar cada elemento botánico si ya existe una biblioteca científica específica para especies.

## 11. Uso de ChatGPT para búsqueda visual

ChatGPT puede:

- localizar referencias públicas;
- comparar paisajes;
- identificar vacíos del corpus;
- sugerir categorías de captura;
- analizar composición y recurrencias visibles;
- ayudar a redactar pautas del manual.

ChatGPT no debe:

- convertir una imagen web en asset del proyecto sin verificar derechos;
- atribuir ubicación o especie sin evidencia suficiente;
- usar una imagen artística como prueba ecológica;
- presentar una única fotografía o un único sector de Yerba Loca como descripción universal de la precordillera o del bosque esclerófilo.

## 12. Relación con producción

Antes de iniciar un escenario nuevo, el brief debe incluir una lista de `referenceId` seleccionados y separar explícitamente:

- qué proviene de evidencia real;
- qué es una interpretación;
- qué es una decisión estilística.

Cuando el escenario esté basado en una zona concreta, debe declarar `referenceArea`, rango altitudinal aproximado y ecosistemas de referencia usados.

La generación asistida por IA, cuando se use, parte de ese brief curado y nunca sustituye el corpus de referencias.
