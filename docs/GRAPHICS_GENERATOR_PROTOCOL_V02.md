# Árboris — Protocolo de mejora v0.2

## Objetivo y alcance

Mejorar cómo el sistema interpreta, genera y evalúa recursos para la exploración, aprendizaje y conservación de flora chilena. Este protocolo cambia instrucciones, decisiones y controles locales. Su eficacia sobre nuevas generaciones debe medirse; no representa entrenamiento de pesos.

La autoridad de arte sigue en `ART_STYLE_GUIDE.md` y `GRAPHIC_DIRECTION.md`. Alvaro aprueba diseño; los aportes botánicos y de proyecto de Alejandra conservan su procedencia. La hoja del logo no debe atribuirse a una especie sin evidencia.

## Antes de generar

Registrar en el brief:

1. Uso, sujeto y única modificación solicitada.
2. Ruta y hash de cada referencia; rol de estilo, composición, morfología o archivo a editar.
3. Invariantes observados, decisiones aprobadas e hipótesis del asistente por separado.
4. Lienzo lógico, origen de retícula, escala entera, paleta, alpha, capas y texto literal.
5. Criterios de aceptación y principal riesgo; señalar requisitos aún no resueltos.

Para el logo, conservar el acento visible sobre la a en la referencia y registrar la marca como «árboris» cuando se transcriba. El lema tiene **dos separadores** entre tres palabras: `EXPLORA • APRENDE • CONSERVA`. Los prompts anteriores que decían tres separadores o escribían `arboris` sin resolver el acento eran ambiguos. Revisar glifos visualmente; el texto de un prompt no acredita el contenido de la salida.

La referencia `logopixel-logo-reference.png` es la autoridad compositiva del logo. En esta fase, «mejorar» significa estandarizar sin rediseñar: conservar exactamente el dibujo de las letras, la hoja, la tilde, el lema, el orden y las proporciones; corregir solo celdas, bordes, paleta, alpha o escalado. Ningún modelo puede reemplazar esa referencia con una fuente nueva, una composición distinta o una reinterpretación de la hoja.

### Calibración visual permanente desde personajes

Los PNG maestros de personajes de la base de datos son la referencia de acabado pixel art: edición 1:1, contornos de un píxel, escalones diagonales deliberados, clusters agrupados de tamaño variable, paleta limitada y escalado entero por `nearest-neighbor`. No forzar el logo a bloques físicos de 4 px si eso destruye sus glifos. El wordmark debe conservar módulos grandes y rectos como `output/arboris/brand/references/logopixel-target-v02.jpg`, y el master debe mantener una unidad lógica de píxel común en todo el lienzo.

La imagen `logopixel-target-v02.jpg` es una referencia de acabado y proporción, no una autorización para copiar el destello decorativo de la esquina. El lockup aprobado conserva únicamente marca, hoja, tilde y lema.

El concepto puede producirse con un lienzo objetivo aún provisional. Una entrega exacta requiere que ese lienzo haya quedado definido. No deducir la retícula artística dividiendo las dimensiones del render entre cuatro.

## Experimento controlado

- Congelar referencia y brief; registrar el prompt anterior como control.
- Formular una hipótesis medible: por ejemplo, «eliminar sombreado interno reducirá la textura no deseada en las letras».
- Cambiar solo esa instrucción; no ajustar hoja, espaciado y peso tipográfico simultáneamente.
- Generar una salida por variante durante exploración y conservar prompt, archivo, herramienta y observaciones.
- Comparar control y candidata a escala real y zoom entero, con idéntico encuadre de revisión.
- Si hay mejora, repetir el par al menos tres veces antes de hablar de una tendencia; registrar variabilidad. Tres pares orientan, no prueban eficacia estadística.
- Si dos intentos repiten el mismo defecto sin mejora medible, revisar la hipótesis o preparar la construcción en lienzo lógico. No prolongar generaciones por promesa de perfección.

## Evaluación en tres partes

| Parte | Evidencia | Resultado |
| --- | --- | --- |
| Interpretación | Brief, roles, texto, invariantes y decisión autorizada | Conforme / corregir / pendiente |
| Archivo | Dimensiones, paleta, alpha, retícula y comparación RGBA con base | measured_checks_passed / failed |
| Diseño | Lectura, contornos, nervaduras, agrupación de píxeles y fidelidad al concepto | Revisión del director de arte |

Los grupos de píxeles pueden ser grandes o pequeños. La celda común y la forma de construir detalles determinan la consistencia. Una imagen ampliada puede tener celdas perfectamente repetidas y seguir siendo un mal diseño pixel art.

### Puerta de claridad para el logo

Antes de evaluar semejanza JRPG, revisar el logo como marca:

1. La palabra y el lema se leen en el primer vistazo.
2. La silueta funciona en tamaño pequeño sin textura ni volumen.
3. El wordmark y el lema usan color oscuro plano.
4. La hoja se distingue del texto mediante una separación cromática breve y controlada.
5. No hay halos de colores no solicitados en los bordes.
6. El acento y los dos separadores del lema están presentes y ubicados correctamente.
7. La composición tiene aire suficiente y ningún detalle compite con el nombre.

Si falla uno de los siete puntos, la salida vuelve a propuesta conceptual o a reconstrucción manual; no entra a la fase de aprobación técnica.

### Puerta de fidelidad antes de la claridad

Primero superponer o cotejar visualmente la candidata contra la referencia aprobada. Si cambia el contorno de una letra, el espacio relativo, la forma/posición de la hoja, el acento o el lema, se clasifica como **rediseño no solicitado** y se rechaza sin pasar a las mediciones técnicas. La uniformidad de los píxeles se evalúa únicamente después de confirmar esa fidelidad.

### Evidencia G-07 v04, 2026-09-15

El primer par control/candidata probó añadir relleno sólido para las letras. En una región interior equivalente de b, la candidata produjo 44 colores frente a 31 del control, con variación tonal pequeña y similar; ninguna muestra usó exactamente #0F2E1F. La candidata también presentó bordes más suaves y alteraciones de forma. No se observó mejora útil y no se adoptó esa instrucción como regla probada. No es evidencia de incapacidad general del modelo. Prompts, imágenes y métricas están en `../output/arboris/generator-runs/2026-09-15-logo-v04/`, relativo al repositorio. La siguiente fase de exactitud requiere un lienzo lógico construido explícitamente; no se aprobó un tamaño nativo a partir de estos renders.

Usar `tools/measure-pixel-contract.ps1` sobre cada candidata pertinente. Sus resultados son objetos PowerShell serializables a JSON. El evaluador no modifica PNG y nunca emite aprobación artística. Un requisito no evaluado queda pendiente, nunca obtiene puntuación máxima ni se omite silenciosamente.

## Registro de aprendizaje

Cada conclusión debe incluir: observación, fuente (usuario o asistente), hipótesis, modificación, evidencia, ámbito y estado. Una sola salida fallida no demuestra incapacidad universal del generador. Una sola salida atractiva tampoco demuestra mejora consistente.

Cambios incorporados en v0.2:

- La repetición 4×4 de v03 pasa una medición mecánica; su diseño continúa pendiente.
- Los grupos de distinto tamaño sobre una retícula común son válidos.
- El ampliador no controla colores, alpha ni capas; el auditor mide esos aspectos por separado.
- El remuestreo requiere elección explícita y se registra como estudio.
- Las preferencias de tamaño y peso propuestas por el asistente no sustituyen una aprobación del usuario.
- Se corrigen las ambigüedades del acento y del número de separadores para próximos briefs.

## Cierre de una iteración

Guardar informe con hash, mediciones, observaciones y siguiente cambio justificado. Declarar por separado qué se verificó y qué sigue pendiente. Promover a canon solo mediante aprobación artística y entrega técnica verificable. El objetivo de esta versión es impedir falsos positivos y hacer reproducible la mejora; todavía no se ha demostrado una ganancia generativa con pruebas A/B.
