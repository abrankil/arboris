# Arboris — Modelo de interpretación para generación gráfica

Versión: 0.2  
Propósito: mejorar la traducción de una instrucción humana en una especificación visual ejecutable y verificable.

## Qué estamos mejorando

El problema principal no es solamente la calidad del render. Una buena referencia puede producir un resultado equivocado si el sistema interpreta mal:

- qué elemento es el sujeto principal;
- qué imagen es una referencia de estilo y cuál es una referencia botánica;
- qué partes deben conservarse literalmente;
- qué escala de píxel se está solicitando;
- qué es una variante permitida y qué sería una desviación;
- qué aspectos deben corregirse después en Pixelorama.

Por eso Arboris usará una cadena de interpretación explícita antes de generar.

## Cadena de interpretación

```text
instrucción humana
        ↓
1. intención y tipo de recurso
        ↓
2. referencias con roles separados
        ↓
3. rasgos invariantes y variaciones permitidas
        ↓
4. contrato técnico de píxel
        ↓
5. prompt de producción
        ↓
6. generación de propuesta
        ↓
7. evaluación contra el brief
        ↓
8. corrección de una sola variable por iteración
```

La cadena evita que el sistema intente resolver estilo, botánica, composición y formato en una sola instrucción ambigua.

## Etapa 1 — Intención

Clasificar primero el encargo en una sola categoría primaria:

| Código | Intención |
| --- | --- |
| `character` | personaje botánico o auxiliar |
| `gameplay-sprite` | derivación pequeña para navegación o juego |
| `environment` | escena, bioma o capa de parallax |
| `logo-brand` | logo, símbolo, wordmark o variante de marca |
| `ui` | icono, botón, panel o elemento de interfaz |
| `variation` | cambio acotado sobre una propuesta existente |

Si el usuario mezcla varias categorías, dividir el trabajo en encargos separados. No pedir a una misma generación que resuelva un personaje, un fondo y un logo a la vez.

## Etapa 2 — Roles de referencia

Toda imagen de entrada debe recibir un rol explícito:

- `style-reference`: lenguaje de píxel, contraste, contorno y sombreado;
- `botanical-reference`: forma, margen, ápice, nervaduras, color y contexto de una especie;
- `composition-reference`: encuadre, jerarquía y uso del espacio;
- `edit-target`: imagen que se puede modificar, preservando invariantes;
- `technical-reference`: retícula, escala, capas, exportación o manual de marca.

Regla: una referencia botánica no autoriza copiar su estilo si pertenece a otra fuente, y una referencia de estilo no autoriza inventar rasgos de una especie.

## Etapa 3 — Invariantes

Antes de redactar el prompt, separar tres listas:

### Debe permanecer

Rasgos que no pueden cambiar: sujeto, orientación, silueta, proporciones, ápice, margen, nervaduras, color propio, texto exacto, cantidad de elementos y relación entre capas.

### Puede variar

Rasgos que sí pueden explorarse: pose leve, expresión, agrupación de clusters, temperatura ambiental, fondo autorizado, intensidad de sombra y pequeños detalles secundarios.

### No incorporar

Rasgos que el modelo suele inventar: hojas genéricas, frutos no documentados, piernas en personajes flotantes, degradados, volumen 3D, texturas fotográficas, letras deformadas, contornos suavizados y accesorios no solicitados.

Una instrucción de edición debe repetir los invariantes en cada iteración para reducir la deriva.

### Uniformidad de módulo

Declarar celda lógica, origen de retícula y escala de presentación. La celda es uniforme; un grupo de celdas del mismo color puede formar rectángulos, escaleras o áreas de distintos tamaños. Se rechazan cambios de color que corten una celda declarada y detalles construidos con otra escala. La indicación 4×4 del manual del logo es una referencia técnica: no determina por sí sola la resolución lógica de una imagen generada ni demuestra que el original siga esa retícula. El lienzo 489×201 de v03 fue una elección de remuestreo, no una base artística aprobada.

## Etapa 4 — Contrato técnico

El intérprete debe convertir expresiones informales como “que se vea pixelado” o “un pixel grande” en parámetros verificables:

```text
Lienzo nativo:
Unidad de dibujo:
Pincel o bloque permitido:
Escalado de presentación:
Alpha:
Paleta:
Capas:
Formato editable:
Formato de exportación:
```

Para personajes canónicos de Arboris, el contrato vigente es 125×125 px, edición 1:1, pincel de 1 px y transparencia real. Para el logo `logopixel`, el contrato técnico se toma del manual de marca seleccionado, con una retícula uniforme de 4×4 px, y se mantiene separado del contrato de personajes.

Si el usuario menciona un bloque de 8 px, distinguir pincel, celda y zoom según el archivo real. Registrar la interpretación como hipótesis hasta verificarla; el factor visual depende del escalado de la pantalla y no acredita el lienzo nativo.

## Etapa 5 — Redacción de producción

El prompt final debe escribirse en este orden:

1. uso y tipo de recurso;
2. sujeto principal;
3. referencia de entrada y rol de cada imagen;
4. invariantes morfológicos o compositivos;
5. estilo pixel y contrato técnico;
6. paleta y atmósfera;
7. composición y espacio negativo;
8. texto literal, si existe;
9. restricciones y lista de exclusión;
10. criterio de validación.

La palabra “pixel art” por sí sola no basta. Debe acompañarse de qué píxel se diseña, cuál es la resolución nativa y cómo se comprobará.

Cuando falla la retícula, registrar el defecto y su ubicación. Una nueva prueba generativa puede explorar una hipótesis de prompt, con una sola variable y sin garantía de exactitud. La entrega de píxel exacto requiere construcción en el lienzo lógico y verificación de su exportación. Replicar una imagen remuestreada no certifica su diseño.

## Etapa 6 — Juicio de salida

La salida no se juzga solo por “verse bonita”. El intérprete debe responder:

1. ¿Generó el tipo de recurso solicitado?
2. ¿El sujeto correcto domina la imagen?
3. ¿La referencia botánica se respetó?
4. ¿La técnica pixel es nativa o solo un filtro superficial?
5. ¿La paleta ayuda a reconocer el sujeto?
6. ¿El texto es exacto?
7. ¿La salida es editable o requiere adaptación en Pixelorama?
8. ¿Qué único cambio mejoraría más la siguiente iteración?

La última pregunta es obligatoria: cada iteración cambia una variable principal. Si cambiamos silueta, paleta, escala y fondo simultáneamente, no aprendemos qué instrucción funcionó.

## Formato de brief interpretado

Antes de cada generación, producir internamente o registrar este resumen:

```text
INTERPRETACIÓN ARBORIS
Tipo de recurso:
Objetivo:
Sujeto principal:
Referencias y roles:
Debe permanecer:
Puede variar:
No incorporar:
Contrato técnico:
Salida esperada:
Riesgo principal de deriva:
Prueba de aceptación:
```

Este brief es el punto de comparación entre lo que el usuario pidió y lo que finalmente generó el modelo.

## Aprendizaje por retroalimentación

Cada revisión del usuario debe convertirse en una regla concreta, no en una frase vaga. Ejemplos:

| Observación | Regla reutilizable |
| --- | --- |
| “Se alejó del concepto” | Mantener la silueta y la composición de la referencia; variar solo el acabado solicitado. |
| “Parece vectorial” | Eliminar curvas suavizadas, gradientes y contornos uniformes; usar clusters y bordes escalonados. |
| “El pixel se ve muy grande” | Declarar píxel lógico 1:1 y usar bloques grandes solo para previsualización o relleno controlado. |
| “La planta no se reconoce” | Anteponer rasgos diagnósticos de la especie y reducir decoración secundaria. |
| “El texto salió mal” | No confiar en texto generado; componerlo y corregirlo manualmente en Pixelorama. |
| “Está bonito, pero no es Árboris” | Reforzar referencia de sprites canónicos, paleta, humor orgánico y sobriedad de detalle. |

## Criterio de éxito del modelo de interpretación v0.2

Consideraremos que esta capa mejora el proceso cuando, en una serie de pruebas comparables:

- disminuyen las salidas con estilo vectorial o genérico;
- disminuyen las invenciones botánicas;
- disminuyen las iteraciones que cambian varias variables a la vez;
- aumenta la lectura de silueta a tamaño objetivo;
- se identifica antes qué debe pasar a limpieza manual en Pixelorama;
- cada salida puede rastrearse hasta un brief, referencias, versión y decisión.

La métrica principal no será “qué tan espectacular es la imagen”, sino cuántas salidas llegan a una propuesta utilizable sin perder identidad ni trazabilidad.

Aplicar [el protocolo de comparación](GRAPHICS_GENERATOR_PROTOCOL_V02.md). Un resultado aislado no demuestra mejora general. Las observaciones estéticas del asistente son hipótesis; requieren comparación visual y aprobación de Alvaro para convertirse en decisiones de diseño. Por ejemplo, reducir el peso de las letras o la hoja en v02 no quedó aprobado por el usuario.

## Regla de enrutamiento aprendida en G-07

La prueba del logo confirmó una distinción operativa:

- **Edición exacta** — aislar fondo, conservar píxeles, corregir alpha, cambiar una capa o mantener texto literalmente: enrutar a Pixelorama o a una transformación determinista.
- **Exploración creativa** — proponer una nueva composición, paleta, presentación o variante de lenguaje visual: enrutar al generador de imágenes con la referencia etiquetada como autoridad de estilo/composición.
- **Texto de marca** — usar el generador solo para explorar; componer y corregir la versión final manualmente para garantizar cada letra y signo.

El intérprete debe detectar la intención real aunque el usuario diga simplemente “mejóralo”. Si “mejorar” significa conservar el archivo y pulirlo, no se genera de nuevo. Si significa explorar una nueva propuesta manteniendo el concepto, sí se genera una variante y se registra como `proposal`, nunca como reemplazo automático del maestro.
