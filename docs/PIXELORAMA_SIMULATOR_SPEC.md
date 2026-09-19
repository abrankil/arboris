# Arboris — Especificación del flujo de píxel exacto, v0.2

“Simulador Pixelorama” describe el objetivo del flujo. El script implementado es un remuestreador/ampliador PNG; no emula el editor. Las capacidades planeadas de capas, paleta y alpha no deben atribuirse al script.

## Objetivo

El generador debe entregar propuestas visuales que puedan convertirse en un recurso pixel art exacto, no solo en una imagen que parezca pixelada.

La solución se divide en dos responsabilidades:

```text
modelo visual
  interpreta sujeto, composición, paleta y estilo
        ↓
plan de píxeles / imagen de referencia
        ↓
simulador Pixelorama
  fija retícula, unidad, colores, alpha, capas y escalado
        ↓
PNG lógico + PNG de presentación + edición final en Pixelorama
```

## Reglas no negociables

- una resolución lógica declarada antes de producir;
- una sola unidad de píxel por recurso;
- todas las celdas tienen el mismo tamaño en el archivo exportado; los grupos de celdas pueden tener distintas áreas;
- todos los módulos se alinean a la misma retícula;
- colores tomados de una paleta limitada y declarada;
- alpha binario para sprites y logos aislables, salvo excepción documentada;
- escalado de presentación únicamente por múltiplos enteros y nearest-neighbor;
- no se acepta como “pixel art final” una imagen generada que solo simule bloques;
- el `.pxo` maestro se guarda desde Pixelorama.

## Contrato del logo logopixel

La única referencia visual activa para pruebas es la **referencia canónica provisional**, definida en [LOGO_PROTOTYPE.md](LOGO_PROTOTYPE.md), aplicada bajo el contrato extraído de [LOGOPIXEL_MANUAL_EXTRACTED.md](LOGOPIXEL_MANUAL_EXTRACTED.md). Las rutas históricas siguientes documentan referencias y proyectos anteriores; no son entregas alternativas activas.

- referencia canónica provisional: `output/arboris/brand/canonical/arboris-logo-canonical-reference.jpg`;
- manual: `../output/arboris/brand/logopixel-manual-original.png`, relativo al repositorio;
- proyecto guardado: `../output/arboris/brand/arboris-logo-logopixel-v01.pxo`; verificar contenido antes de afirmar coincidencia con un PNG;
- módulo visual del manual: 4×4 px;
- símbolo, wordmark y slogan deben estar separados para corrección manual;
- texto exacto: `EXPLORA • APRENDE • CONSERVA`;
- para este logo, la referencia aprobada fija composición, proporciones, silueta de cada glifo, acento, hoja, lema y espaciado; una salida no puede reinterpretarlos;
- los cambios autorizados se limitan a estilización y estandarización: limpieza de bordes, origen y tamaño uniforme de celda, paleta controlada, alpha y escalado entero;
- una propuesta generativa no puede decidir composición ni carácter tipográfico y nunca certifica la retícula;
- la retícula y la limpieza se resolverán manualmente en Pixelorama antes de aprobar;
- quedan descartadas como dirección generativa las variantes P01/P02, v08/v09 y demás intentos del motor; se conservan solo como historial técnico.

### Puerta de claridad de marca

El logo se evalúa como una marca legible antes de evaluarse como una pieza de ambientación JRPG. Debe cumplir simultáneamente:

- wordmark y lema en un color oscuro plano, sin sombreado interior;
- fondo marfil uniforme cuando se presenta sobre fondo claro;
- hoja limitada a base, luz y highlight declarados;
- ninguna tinta tierra en este lockup salvo una decisión de marca documentada;
- contornos nítidos al tamaño de lectura y a zoom entero;
- separación clara entre acento, wordmark, hoja y lema;
- sin partículas, textura, glow, volumen ni decoración para compensar una silueta débil.

La estética de personajes puede tener clusters de sombra más expresivos. Esa licencia no se transfiere automáticamente al logo.

### Puerta de fidelidad a la referencia

Antes de aprobar cualquier ajuste técnico, comparar con `logopixel-logo-reference.png` a escala de lectura y a zoom entero. Rechazar la candidata si sustituye una letra por otra, altera la silueta o la relación entre letras, mueve o redibuja la hoja, cambia la tilde, reordena el lema o usa una composición distinta. Una retícula perfecta no compensa un rediseño.

Para el acabado, cotejar también los PNG maestros de personajes de la base: el píxel se trabaja a 1:1, con contornos de un píxel y clusters limpios de tamaño variable. La escala de presentación puede ampliar el master con `nearest-neighbor`, pero no debe convertir la tipografía en bloques físicos uniformes cuando eso la vuelve dentada o ilegible.

## Enrutamiento

### Generador de imágenes

Usarlo para:

- explorar siluetas;
- proponer composiciones;
- comparar paletas y atmósferas;
- producir referencias de dirección de arte.

No usarlo como autoridad final para:

- uniformidad de módulo;
- transparencia real;
- texto de marca definitivo;
- coincidencia pixel por pixel;
- creación del `.pxo`.

### Simulador de retícula

Usarlo para:

- preparar un estudio remuestreado solo con `-AllowResample` explícito; registrar la pérdida de información;
- ampliar cada celda por un factor entero idéntico;
- evitar módulos mezclados;
- medir dimensiones, alpha y colores con `tools/measure-pixel-contract.ps1`, sin modificarlos;
- preparar una base que pueda abrirse y limpiarse en Pixelorama.

El simulador no decide si una hoja es botánicamente correcta. Esa decisión sigue siendo humana y debe partir de la referencia de especie.

El renderizador nativo de logo usa patrones explícitos de celdas para que el tamaño de cada píxel sea una decisión de diseño. Las variantes v08 y v09 son pruebas técnicas y no sustituyen la referencia de marca ni el `.pxo`.

`lock-pixel-grid.ps1` conserva los colores y el alpha muestreados, incluidos halos o textura existentes. Por defecto exige un PNG del tamaño lógico declarado; rechaza sobrescrituras. Su salida solo acredita repetición de celdas. La construcción exacta futura requiere un mapa de celdas o un PNG lógico diseñado y revisado, con una paleta declarada y capas verificables.

## Pruebas de aceptación

Un recurso pasa la etapa técnica solo si:

1. cada módulo tiene el mismo ancho y alto;
2. no existen bordes interpolados ni halos;
3. las dimensiones son las declaradas;
4. el alpha coincide con el tipo de recurso;
5. el texto se revisa visualmente y luego se corrige en Pixelorama;
6. la imagen lógica y la presentación por escala son reproducibles;
7. existe una ruta de `.pxo` real para la versión editable.
