# Arboris — Playbook del generador de recursos gráficos

Estado: protocolo operativo v0.2; eficacia generativa pendiente de comparación controlada.  
Responsable de dirección de arte: Alvaro  
Dirección de proyecto: Alejandra

## Propósito

Este documento define cómo usar un generador visual para acelerar propuestas de Árboris sin perder su identidad botánica, su lenguaje pixel art ni la trazabilidad de las decisiones.

En este proyecto, “entrenar el generador” significa construir un sistema consistente de:

1. referencias positivas y negativas bien etiquetadas;
2. instrucciones maestras y plantillas por tipo de recurso;
3. pruebas repetibles para detectar deriva de estilo;
4. revisión humana antes de promover un recurso a canon.

No equivale a declarar que el modelo haya sido ajustado internamente ni a aceptar automáticamente una imagen generada como asset final.

## Jerarquía de autoridad

Cuando dos referencias entren en conflicto, aplicar este orden:

1. decisión explícita vigente de dirección de arte;
2. `docs/ART_STYLE_GUIDE.md` y `docs/GRAPHIC_DIRECTION.md`;
3. ficha botánica, fotografías y fuentes de la especie;
4. PNG/PXO aprobado y su procedencia registrada;
5. referencias visuales de apoyo;
6. exploraciones, ensayos y propuestas descartadas.

Una exploración sirve para aprender qué evitar; no se convierte en canon por estar disponible en una carpeta.

## Contrato visual común

Todo prompt de Árboris debe conservar estas condiciones salvo que el encargo las cambie explícitamente:

- pixel art HD-2D de inspiración 16-bit;
- píxeles cuadrados, bordes escalonados y sombreado por clusters;
- una sola celda lógica por recurso, alineada a una retícula común; los grupos de celdas contiguas pueden tener áreas y formas diferentes;
- silueta clara antes que detalle decorativo;
- contorno oscuro consistente, adaptado al contraste del recurso;
- rampas de color deliberadas y pocas transiciones;
- sin antialiasing, blur, pinceladas suaves, bloom fotográfico ni gradientes aerografiados;
- escalado de presentación solamente por múltiplos enteros y nearest-neighbor;
- fondo transparente cuando el recurso sea un sprite, icono, hoja, objeto o logo aislable;
- ningún texto generado dentro de una imagen salvo que la prueba lo solicite expresamente y se verifique letra por letra.

La técnica común no borra la identidad de cada especie. No igualar todas las hojas, ápices, márgenes, nervaduras o colores para que parezcan una misma planta.

## Bloque botánico obligatorio

Antes de generar un recurso de flora, completar este bloque:

```text
Especie o sujeto:
Nombre común y nombre científico si están confirmados:
Uso del recurso:
Fuente botánica o fotografía de referencia:
Rasgos que deben permanecer reconocibles:
- silueta:
- ápice:
- margen:
- nervadura:
- color propio:
- fruto, flor o compañero, si corresponde:
Variación permitida:
Elementos que no se deben inventar:
```

Una imagen generada no sustituye la evidencia de identificación. Si falta un rasgo importante, escribir “pendiente” y no rellenarlo con una hoja genérica.

## Modos de producción

### A. Personaje de colección

- lienzo canónico: 125×125 píxeles reales;
- edición 1:1 en Pixelorama, pincel de 1 px;
- personaje flotante, sin piernas, salvo una excepción documentada;
- transparencia real fuera del personaje;
- conservar los rasgos diagnósticos de la ficha de especie;
- el PNG generado en alta resolución es concepto o referencia, nunca la entrega 1:1 automática;
- el `.pxo` solo se declara editable cuando fue guardado realmente desde Pixelorama.

### B. Sprite de gameplay

- declarar si el tamaño nativo es 48×64, 64×64 u otro;
- no reducir automáticamente un personaje de 125×125;
- conservar los rasgos que todavía deben leerse a distancia;
- registrar la relación con el personaje de colección como una derivación separada.

### C. Escenario o capa ambiental

- declarar lienzo, relación de aspecto y resolución nativa;
- separar cielo, fondo, plano medio y primer plano cuando corresponda;
- conservar profundidad por composición, terrazas, siluetas y capas;
- no usar una planta genérica donde la escena exige flora chilena específica;
- reservar espacio tranquilo para UI y texto.

### D. Logo, icono y tipografía pixel

- usar como referencia principal el manual seleccionado `logopixel` y sus aislaciones en `output/arboris/brand/`;
- mantener la construcción por bloques y la lectura a tamaño reducido;
- cada celda se amplía por el mismo factor entero; un trazo de dos celdas y otro de tres pueden coexistir sobre la misma retícula;
- respetar la paleta del manual de marca y su retícula declarada;
- separar símbolo, palabra, slogan y variantes de fondo en capas o archivos editables;
- no reemplazar el pixel art por vector, degradado o acabado 3D;
- cualquier texto final debe componerse o corregirse manualmente en Pixelorama si el generador lo deforma.

## Prompt maestro

Usar esta plantilla como base y completar solo los campos pertinentes:

```text
Use case: <categoría admitida por la herramienta; logo-brand para esta prueba>
Arboris asset family: <character|gameplay-sprite|environment|logo-brand|ui>
Asset type: <recurso y destino>
Primary request: <qué hay que crear o modificar>
Input images:
- Image 1 — referencia de estilo: <ruta o imagen>
- Image 2 — referencia botánica/compositiva: <ruta o imagen>
Subject: <sujeto principal>
Botanical lock: <silueta, ápice, margen, nervaduras, color y rasgos que no pueden cambiar>
Style/medium: pixel art HD-2D, inspiración 16-bit, píxeles cuadrados, clusters limpios
Native canvas: <dimensiones reales o “declarar antes de producir”>
Composition/framing: <encuadre, orientación y espacio negativo>
Palette: <paleta aprobada o rampas limitadas>
Layers: <capas requeridas si aplica>
Transparency: <sí/no; alpha binario para sprites salvo excepción documentada>
Text (verbatim): "<texto exacto o “sin texto”>"
Constraints: sin antialiasing, sin suavizado, sin blur, sin gradientes difusos, sin watermark
Avoid: hojas genéricas, anatomía vegetal inventada, detalle ilegible, escalado fraccional,
       estética vectorial, render 3D, fotorealismo, texto deformado
Validation: revisar silueta, píxel nativo, paleta, transparencia, escala y fidelidad botánica
```

## Ejemplos positivos y negativos

### Positivos

Usar como referencias de lenguaje y producción, no como permiso para copiar la identidad de una especie en otra:

- sprites seleccionados por `data/characters/index.json` y `selectedDesign`; verificar estado y ruta antes de usarlos;
- `docs/assets/backgrounds/parallax/` como referencias compositivas de ensayos; su existencia no certifica píxel nativo;
- el `.pxo` y las aislaciones del logo Pixelorama dentro de `output/arboris/brand/`;
- fotografías o fichas botánicas usadas únicamente para morfología y color de la especie.

### Negativos o descartados

Marcar explícitamente como “no usar para estilo final”:

- propuestas vectoriales o con apariencia 3D;
- sprites que llenen el lienzo por obligación y pierdan su escala de personaje;
- imágenes con pincel de bloques grandes cuando el objetivo es un personaje 1:1;
- fondos fotográficos, texturas suaves o gradientes aerografiados;
- diseños botánicos que agreguen frutos, flores o dientes no documentados;
- texto generado con errores;
- conversiones automáticas de alta resolución presentadas como píxel nativo.

## Evaluación de cada salida

Puntuar de 0 a 2 cada criterio: 0 = falla, 1 = requiere corrección, 2 = cumple.

| Criterio | Pregunta |
| --- | --- |
| Identidad | ¿Se reconoce como Árboris sin depender del nombre del archivo? |
| Morfología | ¿Conserva los rasgos de la especie o sujeto indicado? |
| Silueta | ¿La lectura principal funciona a tamaño objetivo? |
| Píxel | ¿Hay bordes escalonados, clusters limpios, ausencia de suavizado y una unidad de módulo uniforme? |
| Paleta | ¿Respeta los colores aprobados y el contraste necesario? |
| Composición | ¿La jerarquía de atención y el espacio negativo son correctos? |
| Transparencia | ¿El alpha y el fondo corresponden al tipo de recurso? |
| Texto | ¿El texto, si existe, es exacto y legible? |
| Editable | ¿El recurso tiene una ruta real de edición y capas declaradas? |
| Trazabilidad | ¿La referencia, prompt, versión y decisión de revisión quedaron registradas? |

Reglas de bloqueo: una salida no avanza si falla Morfología, Píxel, Uniformidad de módulo, Transparencia o Texto; tampoco si se presenta un PNG como `.pxo` sin haberlo guardado desde Pixelorama.

## Flujo con Codex y Pixelorama

1. Codex prepara el brief, separa referencias y formula el prompt.
2. El generador produce una propuesta visual o una variante controlada.
3. Codex inspecciona la salida contra la lista de evaluación y registra los desvíos.
4. Pixelorama realiza la adaptación 1:1, limpieza, capas y corrección de texto.
5. Se guarda el `.pxo` maestro y se exportan PNG derivados por escala o uso.
6. La validación técnica del repositorio se ejecuta sin modificar los píxeles.
7. Alvaro aprueba visualmente; Alejandra aporta la decisión de proyecto o la evidencia botánica que corresponda.

Estados válidos: `referencia → propuesta → corrección → editable verificado → aprobado → integrado`.

## Nomenclatura y trazabilidad

```text
output/arboris/generator-runs/<fecha>-<recurso>/
  brief.md
  prompt.txt
  references.md
  proposal-v01.png
  review-v01.md
  approved-v01.png
  editable-v01.pxo
```

No sustituir archivos aprobados en silencio. Una corrección del generador inicia una versión nueva y conserva la anterior como referencia o descarte etiquetado.

## Limitaciones conocidas

- El generador visual puede sugerir estética, composición y variantes, pero no garantiza una cuadrícula nativa ni dimensiones exactas.
- La generación de texto dentro de imágenes no es suficientemente confiable para el logo; el texto debe revisarse manualmente.
- La validación automática mide propiedades del archivo, no decide si una hoja es botánicamente correcta.
- Pixelorama sigue siendo la autoridad para crear y guardar el editable `.pxo`.

## Mejora y regresión

Aplicar [el protocolo v0.2](GRAPHICS_GENERATOR_PROTOCOL_V02.md) antes de producir. Los controles numéricos informan `measured_checks_passed` o `failed`; la revisión de diseño y la aprobación son estados independientes. El auditor de personajes existentes no evalúa automáticamente las propuestas del logo.
