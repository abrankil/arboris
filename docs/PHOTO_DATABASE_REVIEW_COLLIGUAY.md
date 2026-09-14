# Colliguay — revisión de referencias para el personaje

Revisión: 2026-09-14. Especie del proyecto: `SP005`, *Colliguaja odorifera*.

Decisión vigente posterior a la comparación A/B: Alvaro eligió un nuevo adjunto como [base única](../../output/colliguay/colliguay-base-elegida.png) y pidió conservar la proporción de sus puntas, cambiándolas a rojizo. Adjuntó una [foto cromática aprobada por Alejandra](../../output/colliguay/colliguay-referencia-rojizos.webp). Esa selección gobierna silueta, ojos, paleta verde y nervaduras; la recomendación previa del asistente queda superada. El rojizo es una decisión de estilización apoyada en la referencia aprobada, no una nueva afirmación científica sobre el margen. El brief inferior conserva la preparación histórica. Ver [resultado y verificación](../../output/colliguay/PRODUCCION_COLLIGUAY.md).

## Decisiones atribuidas

Alvaro, director de arte, descartó las propuestas v1 y v2. La conversación no especifica una causa individual para cada rechazo: las explicaciones anteriores sobre tamaño del amento o dominancia de la hoja eran interpretaciones del asistente, no motivos declarados por Alvaro.

Alejandra, fundadora y directora de proyecto, indicó: **forma aovada, ápice redondeado, puntas del margen cafés y nervadura que casi no se nota**. Estas indicaciones gobiernan el rediseño. La ficha bibliográfica conserva su descriptor «oblonga»; la elección visual no reescribe la ficha científica.

## Inventario y procedencia

El [registro de referencias](../data/characters/SP005_colliguay/reference-review.json) identifica los ocho archivos locales, sus hashes, su uso y sus límites. Siete pertenecen al JSON de especie y figuran en la hoja `Fotos` de la ficha maestra, con estado `pendiente_revision` según la consulta registrada. Esta revisión artística no equivale a validación botánica.

`colliguay.jpg` queda catalogado como **referencia local complementaria, de procedencia pendiente**. No se le asigna individuo, observación, autor ni fecha de captura. La ausencia de esos datos no demuestra que sea una referencia externa. Se conserva fuera de los siete registros de observación.

## Referencias elegidas

| Archivo | Uso para el diseño | Límite de la evidencia |
| --- | --- | --- |
| [colliguay.jpg](../species/SP005_colliguaja_odorifera/photos/colliguay.jpg), hoja izquierda | Cierre redondeado del ápice, transición hacia el pecíolo y discreción de nervaduras secundarias | Procedencia y madurez sin confirmar. La forma aovada se aplica por indicación de Alejandra; no se afirma que toda la especie tenga una única silueta. |
| [CO001 · hojas 01](../species/SP005_colliguaja_odorifera/photos/SP005_CO001_hojas_01.jpg) | Variación de verde grisáceo, borde fino y superficie | La iluminación, orientación y superficie visible influyen en el color. |
| [CO001 · hojas 02](../species/SP005_colliguaja_odorifera/photos/SP005_CO001_hojas_02.jpg) | Comparación de brillo y dientes pequeños | No usar los reflejos amarillos intensos como paleta única. La foto no fecha la madurez de cada hoja. |
| [CO001 · inflorescencia masculina 02](../species/SP005_colliguaja_odorifera/photos/SP005_CO001_inflorescencia_masculina_02.jpg), hoja central | Terminaciones café oscuras, grano fino y nervaduras secundarias tenues | Su ápice visible difiere de la indicación artística: usarla para margen y superficie. |
| [CO001 · inflorescencia masculina 01](../species/SP005_colliguaja_odorifera/photos/SP005_CO001_inflorescencia_masculina_01.jpg) | Documentar amentos alargados con numerosos detalles amarillos y rojizos | Su longitud en la foto no obliga a un tamaño de acompañante en el personaje. |
| [CO001 · inflorescencia y fruto](../species/SP005_colliguaja_odorifera/photos/SP005_CO001_inflorescencia_fruto_01.jpg) | Registrar estructuras pardas y variación del entorno foliar | La etiqueta no confirma que toda estructura abultada visible sea un fruto normal ni establece su escala absoluta. |
| [CO002 · hojas 01](../species/SP005_colliguaja_odorifera/photos/SP005_CO002_hojas_01.jpg) | Nota de contenido: destaca una estructura parda abultada | Revisar su identidad antes de usarla como modelo de cápsula. |
| [CO002 · ramilla y hojas](../species/SP005_colliguaja_odorifera/photos/SP005_CO002_ramilla_hojas_01.jpg) | Nota de contenido: destaca una estructura verde engrosada con detalles rojizos y amarillos | Naturaleza y normalidad sin confirmar. No recategorizar automáticamente como fruto, inflorescencia o patología. |

La ficha describe una cápsula tricoca. Esto se conserva como dato documental, separado de la identificación de estructuras concretas en las fotos. También se retira la conclusión automática «hoja pequeña = joven / hoja ancha = adulta»: tamaño, brillo y encuadre por sí solos no la demuestran.

## Brief para la nueva propuesta

- Una hoja aovada como cuerpo, mayor anchura ligeramente hacia la mitad basal, parte superior suavemente cerrada y ápice claramente redondeado. Evitar la terminación triangular de los bocetos descartados.
- Aserrado pequeño a lo largo del margen, con terminaciones café discretas y variación natural.
- Nervio central verdoso de contraste muy bajo. Las nervaduras secundarias deben apenas sugerirse o desaparecer a tamaño de sprite; no formar una trama clara protagonista.
- Verde natural oscuro o medio con matices grisáceos observados en CO001. La paleta será una interpretación de fotografías sin calibración de color, no una medición cromática de la especie.
- Dos ojos pequeños, contorno escalonado y sombreado por grupos de píxeles, conforme a Litrini, Peumito y Quillai. Los rasgos morfológicos y los accesorios de esos personajes no se transfieren.
- La nueva propuesta se centra en la hoja. Es una elección de composición para esta revisión; el acompañamiento sigue sin aprobarse.
- Objetivo de entrega editable: PNG de 125×125 píxeles reales, transparencia y cuadrícula 1:1. Una imagen generada en alta resolución se registra como concepto y se comprueba por separado de su adaptación para Pixelorama.

## Conservación y validación

Los PNG v1/v2 permanecen como descartes y mantienen sus hashes. El generador programático anterior se conserva como [texto histórico](../data/characters/SP005_colliguay/archive/generate-discarded-proposals.mjs.txt), retirado de `tools/`.

Los ocho originales fotográficos, la ficha XLSX y el índice canónico se conservan. La revisión de procedencia de `colliguay.jpg` y la identificación de las estructuras de CO002 siguen abiertas; no impiden desarrollar la hoja con las referencias seleccionadas y la indicación de Alejandra.
