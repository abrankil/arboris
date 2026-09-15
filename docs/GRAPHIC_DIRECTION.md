# Arboris — Dirección argumental y método de trabajo gráfico

## Argumento común

En Arboris, explorar la flora nativa chilena permite convertir la curiosidad en reconocimiento. Las observaciones aportan evidencia; un descubrimiento suficientemente respaldado permite incorporar una especie a la colección y acceder al personaje que la representa. El arte hace memorable lo aprendido y anima a volver al territorio.

Este marco conecta la [visión del producto](PRODUCT_VISION.md), los [principios permanentes](PRODUCT_PRINCIPLES.md) y los [requerimientos funcionales](FUNCTIONAL_REQUIREMENTS.md), especialmente RF-09, RF-14, RF-15 y RF-22. Organiza las decisiones gráficas; no define nuevos poderes, combates, antagonistas, reglas de desbloqueo ni una trama cerrada.

El jugador observa y descubre. Los personajes de colección representan especies conocidas; los personajes auxiliares pueden orientar, asistir o conectar sistemas sin representar una especie. Los escenarios sitúan esos encuentros en un ecosistema. La interfaz ayuda a distinguir evidencia, dudas, descubrimientos y progreso. El tono compartido es curioso, orgánico, amable y de humor discreto.

## Responsables y ámbitos de decisión

Según los [roles establecidos del proyecto](../README.md#dirección-de-arboris), **Alejandra es la fundadora y directora de proyecto de Arboris** y **Alvaro es su director de arte**. Alvaro es quien conduce esta línea de trabajo en la conversación.

Alejandra dirige el proyecto y su orientación general. Alvaro dirige el arte, define la coherencia visual y aprueba las decisiones de diseño gráfico dentro de esa orientación. Los aportes de ambos deben atribuirse por nombre y ámbito; las observaciones botánicas de Alejandra conservan además su procedencia como evidencia o comentario de revisión.

## Fuentes y autoridad

| Decisión | Fuente que se debe consultar | Aplicación |
| --- | --- | --- |
| Propósito y relación entre ciencia y juego | Visión, principios y requerimientos del producto | Un sprite no constituye evidencia de identificación. |
| Morfología y contexto | `data/species/`, fotografías en `species/`, ficha descriptiva y fuentes citadas | Comparar individuos y registrar variación. El JSON resumido no sustituye la ficha completa. |
| Correcciones de diseño | Dirección artística de Alvaro y aportes atribuidos a Alejandra, fundadora y directora de proyecto | Conservar autoría y ámbito; una elección para el personaje no se convierte automáticamente en regla botánica universal. |
| Apariencia vigente | `selectedDesign` en las fichas de `data/characters/` y el PNG aprobado | La última limpieza manual aceptada gobierna los píxeles y la paleta. |
| Técnica visual | [Guía de arte](ART_STYLE_GUIDE.md) | Fuente única para personajes, escenarios, interfaz y entregas. |
| Inventario y pendientes | [Estado de personajes](CHARACTER_DESIGN_STATUS.md), [índice de personajes](../data/characters/index.json), [catálogo ambiental](assets/backgrounds/README.md) | Distinguir recurso aprobado, ensayo, derivado y pendiente. |

Una instrucción explícita nueva actualiza la decisión gráfica correspondiente. Si entra en conflicto con evidencia científica o con principios del producto, registrar el conflicto y resolverlo en su ámbito; no reescribir silenciosamente la ficha científica. `output/` contiene entregas y exploraciones, no una segunda guía normativa.

## Cinco modelos de pensamiento

Son herramientas de decisión para el equipo, no una selección de modelos de IA ni cambios de configuración del asistente.

| Modelo | Pregunta de trabajo | Resultado esperado |
| --- | --- | --- |
| 1. Evidencia → observación → interpretación | ¿Qué está documentado, qué se ve en esta foto y qué estamos estilizando? | Un breve registro de fuentes, rasgos visibles, variaciones y decisiones de diseño. |
| 2. Lenguaje común + identidad propia | ¿Se reconoce como Arboris y se diferencia de los demás? | Comparación de silueta, margen, ápice, nervaduras y color con el elenco vigente. |
| 3. Jerarquía de atención | ¿Qué debe entender primero quien mira la imagen? | Hoja y rostro protagonistas; compañero subordinado; fondo que sitúa; interfaz legible. |
| 4. Recurso dentro del ciclo de descubrimiento | ¿Qué aporta este gráfico al encuentro, la observación, el descubrimiento o la colección? | Un uso claro y estados visuales que preserven la incertidumbre de la identificación. |
| 5. Contrato de entrega y conservación | ¿Qué podemos verificar y qué debe revisar una persona? | Formato medido, revisión visual y preservación exacta del archivo manual aprobado. |

### Cómo aplicarlos

**Evidencia.** Una foto de hoja adulta no demuestra cómo se ven todas las hojas jóvenes. Separar la descripción bibliográfica, lo observable en cada imagen y la corrección aportada por Alejandra. Si falta un rasgo, dejarlo pendiente; no completarlo con decoración inventada.

**Identidad.** La unidad del elenco procede del píxel, el rostro, los contornos y el sombreado. Cada especie conserva su paleta y morfología. El límite de dientes de Mitique o Quillai pertenece a sus decisiones de diseño; no se aplica al aserrado continuo del Bollén. Unificar no implica recolorear todos los personajes ni darles el mismo ápice.

**Atención.** La hoja sigue siendo el cuerpo; el fruto o flor solo aparece cuando la versión de esa especie lo incluye. La flora ambiental se representa como planta del paisaje y no hereda los ojos ni la anatomía fantástica de los personajes. Los efectos de profundidad no deben borrar los rasgos de la hoja o competir con texto y controles.

**Descubrimiento.** El personaje es una representación lúdica de una especie, no una fotografía de un individuo. Un fruto acompañante tampoco significa que el ejemplar observado esté fructificando. La futura interfaz deberá distinguir candidato o identificación pendiente de especie descubierta; las reglas y gráficos concretos de esos estados aún requieren diseño.

**Conservación.** Un archivo cuadrado no prueba correspondencia de píxel 1:1. Tampoco la prueban un número bajo de colores o un alpha binario. Medir el archivo, examinar la cuadrícula a zoom entero y comparar con los sprites aprobados. Integrar la limpieza manual mediante copia exacta, verificando hash, sin cuantización, reescalado ni generación adicional.

## Elenco y función visual actual

Estas son identidades gráficas, no personalidades ni habilidades narrativas asignadas.

| Especie | Identidad del personaje vigente | Acompañamiento vigente |
| --- | --- | --- |
| Peumo / Peumito · SP001 | Hoja ovalada verde azulado grisáceo, sin pecíolo visible | Drupa rosada a roja |
| Litre / Litrini · SP002 | Hoja ovalada; nervaduras secundarias bifurcadas cerca del margen; tallo curvo | Dos frutos blancos |
| Bollén · SP003 | Hoja oblonga, ápice poco agudo, oliva con matiz café y dientes blanquecinos ascendentes en todo el margen | Fruto oscuro estrellado, dos ojos y espacio de semilla vacío |
| Mitique · SP004 | Hoja única ancha en la zona media, ápice alargado, hasta tres dientes suaves por lado y nervadura fina blanquecina | Ninguno |
| Quillay / Quillai · SP006 | Hoja con dos dientes suaves por lado y coronilla característica | Sin accesorio separado en el PNG vigente; las posibilidades de la ficha no equivalen a un asset aprobado |
| Colliguay · SP005 | Diseño y limpieza manual aprobados por Alvaro; puntas rojizas con proporción conservada, según foto cromática aprobada por Alejandra. PNG 125×125 1:1 canónico | Hoja única con pecíolo corto; sin acompañante en la versión elegida |
| Piedra-guía de líquen · auxiliar | Diseño y limpieza manual aprobados; personaje de asistencia no botánico, PNG 125×125 1:1 canónico | Roca compacta con manto de líquen y rostro amable; sin suelo ni escenario en el sprite |

## Flujo de una tarea

1. **Precisar el encargo.** Especie o entorno, uso del recurso, referencia vigente, cambio solicitado y formato de entrega.
2. **Consultar evidencia.** Revisar fotos reales y ficha; anotar rasgos, variación y correcciones humanas. Para variar un personaje, abrir también su PNG aprobado.
3. **Definir la propuesta.** Elegir silueta, paleta y estructura secundaria a partir de esas referencias. Indicar lo pendiente sin bloquear los aspectos ya resueltos.
4. **Revisar en contexto.** Comparar con el elenco, el fondo o la interfaz donde se utilizará. Evaluar legibilidad al tamaño real y con zoom entero.
5. **Preparar el editable.** Aplicar el contrato de la guía. Un concepto generado o reducido todavía puede requerir limpieza y revisión sobre la cuadrícula.
6. **Validar y registrar.** Registrar la aprobación de diseño de Alvaro, como director de arte, y la verificación técnica por separado. Atribuir a Alejandra las decisiones de dirección de proyecto y los aportes que realice. Incorporar la limpieza manual sin alterar píxeles; actualizar ficha e índice solo si corresponde.
7. **Entregar y ordenar.** Identificar el archivo vigente, distinguir fuentes de previews y reportar pendientes reales. Retirar únicamente duplicados obsoletos cuya procedencia y referencias se hayan comprobado.

Estados de trabajo: **referencia → propuesta → diseño aprobado → editable verificado → limpieza manual integrada**. Una revisión técnica puede detectar un pendiente en un diseño aprobado; esto no autoriza a redibujarlo automáticamente. Los fondos y ensayos no heredan por asociación el estado de producción de los sprites.

## Brief mínimo para continuar

Antes de producir, dejar en el contexto de la tarea: recurso y uso; archivo de partida; fuentes botánicas; rasgos que conservar; cambio pedido; decisiones pendientes; compañeros incluidos; lienzo y formato; comparación con canon; verificación prevista. Usar un brief breve y específico, no repetir toda la guía en cada conversación.

## Verificación reutilizable

Desde la raíz de `arboris`, ejecutar `pwsh -File tools/validate-graphic-assets.ps1` en Windows. El comando solo lee datos: comprueba fichas, unicidad de IDs, rutas de sprites y referencias compartidas, dimensiones, transparencia, hashes declarados y lienzos de las capas ambientales. Informa las semitransparencias como observación pendiente; no modifica assets ni certifica por sí solo estilo, morfología o edición en Pixelorama.

La revisión visual y la aceptación de Alvaro, como director de arte, siguen siendo necesarias para aprobar el diseño gráfico. No afirmar que un `.pxo` coincide con un PNG sin abrir o comparar realmente su contenido.

## Pendientes delimitados

- Mantener el marco de descubrimiento como argumento común; personalidades, habilidades y relaciones narrativas del elenco siguen abiertas.
- Colliguay ya fue limpiado manualmente e integrado como sprite canónico. Conservar la copia exacta y revisar cualquier modificación futura como una nueva versión.
- Revisar la transparencia del Mitique aprobado sin alterar automáticamente su limpieza manual.
- Los fondos y el ensayo de parallax existentes requieren revisión de escala en contexto. Su resolución de presentación no acredita una cuadrícula nativa compartida.
- Los minijuegos, mapas y estados de UI todavía necesitan sus propios briefs. La regla de sprites de 125×125 no se aplica al texto ni a toda la interfaz móvil.
