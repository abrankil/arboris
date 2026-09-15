# Arboris — Guía de arte unificada

Esta es la fuente técnica común para personajes, escenarios, animaciones y recursos de interfaz. Leer primero la [dirección argumental y el método de trabajo](GRAPHIC_DIRECTION.md). El [estado de personajes](CHARACTER_DESIGN_STATUS.md) y el [catálogo ambiental](assets/backgrounds/README.md) distinguen archivos vigentes y ensayos.

## Identidad y evidencia

**Dirección de arte: Alvaro. Fundación y dirección de proyecto: Alejandra.** Aplicar estos [roles y ámbitos](GRAPHIC_DIRECTION.md#responsables-y-ámbitos-de-decisión) al atribuir indicaciones, revisiones y aprobaciones.

Arboris representa flora nativa real de Chile. La estilización conserva los rasgos que permiten reconocer cada especie: forma, margen y nervaduras de hojas; porte y follaje ambiental; estructuras reproductivas y contexto ecológico. Revisar fotografías y ficha antes de proponer. Registrar las correcciones del usuario y Alejandra como decisiones de diseño atribuidas, sin convertirlas automáticamente en reglas botánicas universales.

Los personajes de colección usan la hoja como cuerpo principal. Frutos, flores y cápsulas pueden ser mascotas, accesorios, herramientas, armas o elementos expresivos cuando el diseño de esa especie lo contemple. Su presencia no es obligatoria ni aprueba una mecánica de juego. En Mitique se acordó una hoja única sin anexos. Arboris también puede incorporar personajes auxiliares no botánicos, como la Piedra-guía de líquen, que deben conservar el lenguaje técnico común sin fingir pertenecer a una especie del catálogo.

## Lenguaje común de personajes

Litrini establece la referencia técnica: pixel art HD-2D de inspiración 16-bit, píxeles cuadrados legibles, contorno oscuro consistente, bordes escalonados y sombreado por clusters. La unidad procede de la técnica, no de imponer la misma paleta o proporción de hoja ni de exigir que todo personaje tenga forma vegetal.

El rostro usa dos ojos pequeños, simples y expresivos; su ubicación se adapta a la morfología. La inclinación, el tallo cuando exista y la interacción con el compañero aportan expresividad.

Los personajes de colección flotan de manera independiente, sin piernas. Los personajes auxiliares pueden adoptar otra lógica de presencia si el diseño y la escena lo requieren; su sprite base debe declarar esa excepción. Un pecíolo, tallo o ramilla puede ser cola, soporte visual o elemento expresivo, sin contacto obligatorio con el suelo. La extrañeza amable y el humor orgánico de *Botanicula* son referencias de tono, sin copiar diseños concretos.

Conservar las decisiones de las [fichas vigentes](../data/characters/index.json): nervaduras bifurcadas de Litrini; ausencia de pecíolo y verde azulado grisáceo de Peumito; ápice acunatado con forma de corazón o coronilla, ondulación moderada y dos dientes suaves por lado de Quillai; hoja única, ápice prolongado y nervadura fina de Mitique; margen aserrado continuo y fruto oscuro de Bollén. Las cápsulas sugeridas en la ficha de Quillai no obligan a agregarlas al PNG aprobado.

## Contrato para Pixelorama

| Concepto | Significado | Comprobación |
| --- | --- | --- |
| Lienzo base | Sprite de la galería: 125×125 píxeles reales | Leer dimensiones del PNG. |
| Píxel 1:1 | Un píxel diseñado corresponde a una celda del lienzo; trazos y bloques se construyen sobre esa cuadrícula | Revisar contorno, ojos y nervaduras en Pixelorama a zoom entero. |
| Relación de aspecto 1:1 | Imagen cuadrada | No prueba por sí sola escala de píxel ni calidad de sprite. |
| Ampliación de presentación | Derivado a múltiplo entero mediante nearest-neighbor | 125×125 a 4× produce 500×500; no añade detalle ni reemplaza el editable. |

Toda entrega editable debe incluir el PNG base con transparencia real donde no hay personaje, sin patrón cuadriculado pintado. Para nuevos sprites sólidos, usar píxeles opacos y fondo transparente, sin antialiasing, suavizado ni semitransparencias accidentales. Una excepción expresiva se documenta y revisa por separado.

### Decisión de trabajo confirmada

El lienzo común sigue siendo 125×125 px y se edita en Pixelorama a relación 1:1. La unidad de dibujo de los personajes oficiales es un píxel real de 1×1 px, usando pincel de 1 px. El área efectiva del personaje puede ser menor y variar según la especie; el espacio transparente conserva el encuadre y la alineación común. No usar pinceles de 2 px o 4 px ni convertir automáticamente los sprites aprobados a bloques mayores.

Conservar el `.pxo` si el usuario lo entrega y registrar su ubicación. No inventarlo ni afirmar que coincide con el PNG solo por nombre, tamaño o fecha. Abrir un PNG en Pixelorama permite editarlo, pero no recupera capas que no fueron entregadas.

Una generación de alta resolución es una propuesta o referencia. Pedir “125×125” al generador no garantiza dimensiones ni cuadrícula nativa. Una reducción automática tampoco completa la adaptación artística: requiere revisión y, si procede, limpieza sobre la cuadrícula objetivo antes de declararse entrega 1:1. Reducir el número de colores no corrige por sí solo el píxel.

## Paleta y conservación

Tomar la paleta de fotografías y modelo aprobado. Usar rampas deliberadas para nuevas propuestas, sin imponer un límite numérico que cambie colores aceptados. La iluminación ambiental no justifica sustituir el color propio de la especie.

Al integrar una limpieza manual, copiar exactamente el PNG, incluida su paleta, transparencia y distribución de píxeles; verificar SHA-256. No cuantizar, regenerar, endurecer alpha ni reescalar la entrega sin solicitud explícita. Registrar los problemas detectados sin modificar silenciosamente el canon.

La [validación de recursos](../tools/validate-graphic-assets.ps1) comprueba propiedades medibles. No acredita por sí sola morfología, estilo de píxel nativo ni funcionamiento en Pixelorama.

## Escenarios HD-2D

La [especificación de producción de escenarios](ENVIRONMENT_PRODUCTION_SPEC.md) define lienzo, capas, escalado y entregables para Android, Steam y web. Esta guía define la apariencia; la especificación define cómo se construye y presenta.

La dirección ambiental combina pixel art 16-bit con apariencia de diorama isométrico de baja geometría, relieve y terrazas. La profundidad surge de composición, capas e iluminación; esto no selecciona un motor de renderizado.

Mantener nítidos el plano jugable, las plantas importantes y los personajes. Rocas, plantas, flores, agua, caminos y objetos usan bloques de color, contornos escalonados, sombras por grupos y rampas limitadas. Evitar texturas fotográficas, pinceladas suaves, degradados difusos y píxeles diminutos sin lectura.

La referencia previa de una cuadrícula gruesa de unas 160–192 celdas por lado es orientativa para nuevas composiciones ambientales cuadradas. Declarar la resolución nativa elegida y escalar por múltiplos enteros. No sustituye la base de 125×125 de personajes ni certifica las imágenes existentes como arte nativo a esa escala.

Admitir fondos panorámicos 16:9 y cuadrados según su uso. Las capas de una escena comparten lienzo y registro espacial. El cielo base es opaco y cubre todo el desplazamiento previsto; los planos superpuestos conservan transparencia real.

El cielo usa franjas horizontales de azul, lavanda, rosado o dorado según la hora, con cambios limpios y dithering cuadrado contenido, sin transiciones aerografiadas. El desenfoque se reserva para primer plano extremo y fondo lejano y se resuelve por bloques, sin bokeh fotorrealista. La luz volumétrica, el bloom y los reflejos se expresan con brillos pixelados de borde duro.

## Atmósfera y flora ambiental

Conservar la identidad chilena de laderas, quebradas y precordillera. La iluminación cálida de montaña o atardecer, el contraste de luz y sombra y las partículas discretas son referencias; también existe una variante lluviosa de Santiago. Adaptar la atmósfera al contexto sin uniformar los colores de los sprites.

Las escenas esclerófilas trabajadas combinan espino, litre, quillay y peumo con siluetas propias: ramificación abierta e irregular del espino, follaje más denso de litres y peumos, copa amplia y tronco visible del quillay. Documentar referencias y asociaciones plausibles según altitud, exposición, suelo y zona antes de incorporar un nuevo bioma. No sustituir especies nativas por plantas genéricas.

Los chaguales representados deben leerse como *Puya*: roseta amplia de hojas muy largas, delgadas, espinosas y caídas, entrecruzadas con irregularidad y silueta chascona. Evitar hojas anchas de agave y rosetas rígidas. La pauta previa de hojas al menos tres veces más finas que una hoja ancha de agave estilizada es una comparación gráfica, no una medición botánica.

Su escapo alto termina en un conjunto compacto, alargado y afinado, mayormente leñoso, con silueta de “cola de zorro”. Los pétalos azul-turquesa son acentos pequeños con sombras teal, no una masa cian ni una espiga blanca genérica. Validar especie y referencia cuando cambie la escena; no generalizar esa floración a todo el género.

La zonificación trabajada reserva chaguales para cotas bajas o medias del escenario esclerófilo y transiciona a vegetación andina rala en altura; no ubicar *Puya chilensis* en alta cordillera desnuda. Incorporar cactus donde la referencia de ladera seca y soleada lo justifique, sin desplazar los árboles nativos.

Las flores amarillas y naranjas dominan la composición ambiental trabajada; violetas y blancas son acentos menores, al igual que el turquesa específico del chagual. Esta pauta compositiva no autoriza a cambiar los colores reales de una flor o fruto de personaje.

## Interfaz, animación y presentación

Los menús mantienen continuidad de paleta, profundidad y píxel, con espacio negativo y una zona calma para texto y botones. No colocar detalle intenso detrás de controles. El contrato de sprites de 125×125 no impone esa resolución a pantallas, textos ni mapas. El mapa de observaciones conserva su función geográfica; un diorama no demuestra localización real de especies.

Animar flotación e inclinación respetando los rasgos y la escala de cada personaje. El compañero puede moverse independientemente si forma parte del diseño. En parallax, cielo, fondo, plano medio y primer plano usan amplitudes distintas, con continuidad en los bordes.

El GIF promocional antiguo de 125×125 fue retirado por legibilidad insuficiente. La presentación de nuevas animaciones del elenco parte de 500×500; los sprites base siguen siendo útiles. Escalar con nearest-neighbor por múltiplos enteros y revisar el tamaño de entrega. La paleta GIF restringe un derivado, no autoriza a recolorear los PNG maestros.

La imagen promocional de tres personajes es una referencia histórica de composición; los sprites individuales vigentes gobiernan la apariencia actual. Los ensayos de parallax existentes no validan automáticamente la escala nativa y se documentan como pruebas.

## Brief de producción

Declarar uso; referencia de diseño; fotos botánicas y referencias de estilo con roles separados; silueta, ápice, margen, nervaduras y paleta; rostro; compañeros; encuadre; transparencia y formato objetivo. Para corregir, precisar qué cambia y qué conserva la referencia. Revisar antes de promover a canon.

Para escenarios, añadir ecosistema, estratos, flora, cuadrícula nativa prevista, relación de aspecto, zona jugable y espacio para UI. El criterio de calidad es identidad botánica, lectura y consistencia del píxel, no cantidad de detalle ni tamaño del archivo.
