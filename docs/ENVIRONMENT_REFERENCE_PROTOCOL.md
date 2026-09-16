# Árboris — Protocolo de referencias ambientales

## Objetivo

Definir cómo capturar, localizar, catalogar y usar referencias fotográficas para escenarios y assets de entorno sin confundir observación real, interpretación ecológica y estilización artística.

## 1. Fuentes aceptadas

### Fotografías de campo

Preferidas cuando el proyecto puede registrar contexto directamente. Pueden provenir de Alejandra, Álvaro u otra persona identificada del equipo.

Registrar, cuando se conozca:

- fecha;
- lugar;
- altitud aproximada;
- estación;
- hora del día;
- orientación o exposición;
- tipo de ambiente;
- especies visibles confirmadas;
- observaciones de terreno.

No completar datos por inferencia si no fueron observados o medidos.

### Referencias web

ChatGPT puede ayudar a localizar material público útil, pero la selección debe conservar siempre su procedencia. Registrar URL, fuente o autor cuando esté disponible, fecha de consulta y licencia si puede verificarse.

Una imagen encontrada en Internet es una referencia externa. No debe copiarse al repositorio ni reutilizarse como asset de producción salvo que su licencia lo permita explícitamente.

### Fuentes institucionales o científicas

Pueden utilizarse para reforzar contexto ecológico, distribución, geomorfología o estructura de vegetación. La imagen y la interpretación científica deben mantenerse diferenciadas.

### Referencias artísticas

Se usan para estudiar composición, atmósfera, profundidad, iluminación o lenguaje visual. Deben marcarse como `sourceType=art` y no respaldan afirmaciones ecológicas.

## 2. Unidad básica: registro de referencia

Cada referencia recibe un `referenceId` único y una fila en `docs/references/environments/manifest.csv`.

Campos mínimos recomendados:

- `referenceId`;
- `sourceType`;
- `photographerOrAuthor`;
- `sourceUrl` o procedencia;
- `dateAccessed` cuando corresponda;
- `location` si se conoce;
- `environmentType`;
- `category`;
- `ecologicalUse`;
- `artUse`;
- `license`;
- `notes`;
- `status`.

Los campos desconocidos se dejan vacíos o se indican como `unknown`; no se inventan.

## 3. Estados del registro

Usar uno de estos estados:

- `collected`: incorporada al inventario, aún no analizada;
- `reviewed`: procedencia y contenido revisados;
- `selected`: elegida para sustentar una decisión de dirección de arte;
- `rejected`: conservada solo para trazabilidad, no debe orientar producción;
- `archived`: ya no participa del corpus activo.

## 4. Categorías visuales

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

## 5. Análisis de una referencia

El análisis debe separar tres niveles:

### A. Observado

Lo directamente visible o documentado: pendiente, densidad aparente, distribución de rocas, silueta vegetal, color del cielo, profundidad atmosférica, etc.

### B. Interpretado

Hipótesis o lectura contextual: exposición probable, humedad relativa aparente, transición altitudinal, tipo de formación, etc. Debe marcarse como interpretación y no como dato observado.

### C. Decisión artística

Qué se adopta para Árboris: relación entre estratos, amplitud del horizonte, paleta atmosférica, densidad de elementos, lectura de masa vegetal, escala de roca, etc.

## 6. De referencia a patrón

Una sola referencia puede justificar una solución de escena específica, pero no una regla general del ecosistema.

Para convertir una observación en pauta del manual de escenarios, exigir:

1. varias referencias independientes o una fuente institucional/científica que la respalde;
2. coherencia con la evidencia disponible;
3. revisión de dirección de arte;
4. formulación que indique su alcance geográfico o estacional cuando corresponda.

El manual debe distinguir:

- `observed` — documentado en referencias concretas;
- `recurrent` — repetido en varias referencias;
- `approvedArtRule` — decisión de dirección de arte;
- `open` — todavía insuficientemente sustentado.

## 7. Captura de campo recomendada

Cuando Alejandra o Álvaro documenten una zona, priorizar series breves en vez de una sola fotografía:

- vista amplia del paisaje;
- vista media de estructura vegetal;
- suelo y roca;
- borde de sendero o microhábitat;
- cielo y horizonte;
- fotografías adicionales de elementos especialmente representativos.

Si es posible, conservar orientación aproximada y hora. No es necesario fotografiar cada elemento botánico si ya existe una biblioteca científica específica para especies.

## 8. Uso de ChatGPT para búsqueda visual

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
- presentar una única fotografía como descripción universal del bosque esclerófilo.

## 9. Relación con producción

Antes de iniciar un escenario nuevo, el brief debe incluir una lista de `referenceId` seleccionados y separar explícitamente:

- qué proviene de evidencia real;
- qué es una interpretación;
- qué es una decisión estilística.

La generación asistida por IA, cuando se use, parte de ese brief curado y nunca sustituye el corpus de referencias.
