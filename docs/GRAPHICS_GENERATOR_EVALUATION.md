# Arboris — Batería inicial de evaluación del generador

Esta batería sirve para comprobar si una nueva versión del flujo mantiene la identidad de Árboris. Las pruebas deben ejecutarse con las mismas referencias y registrar el prompt exacto, la salida y la decisión humana.

## Pruebas de identidad

### G-01 — Hoja de especie conocida

Generar un personaje de colección a partir de una ficha y una fotografía de una especie vigente.

Debe conservar: silueta, ápice, margen, nervaduras, color propio y encuadre flotante.  
Debe evitar: convertir la especie en una hoja genérica o añadir un fruto no aprobado.

### G-02 — Derivación de gameplay

Crear una versión de 48×64 o 64×64 de un personaje canónico.

Debe conservar los rasgos diagnósticos principales y declararse como derivación.  
Debe evitar: presentar una reducción automática como si fuera el sprite maestro de 125×125.

### G-03 — Compañero o fruto

Proponer un compañero únicamente cuando la ficha vigente lo contemple.

Debe mantener jerarquía subordinada respecto de la hoja.  
Debe evitar: interpretar el compañero como evidencia de que toda observación de la especie contiene ese fruto o flor.

## Pruebas de píxel

### G-04 — Silueta a tamaño reducido

Revisar la salida al tamaño objetivo y a zoom entero.

Debe leerse con pocos clusters y bordes escalonados.  
Debe fallar si depende de líneas suavizadas, antialiasing o microdetalle sin función.

### G-05 — Transparencia

Exportar un sprite aislado.

Debe tener transparencia real fuera del sujeto y no un patrón de tablero pintado.  
Las semitransparencias deben estar justificadas; en sprites sólidos, el alpha esperado es binario.

### G-06 — Escala

Ampliar la salida a 2×, 4× o 8×.

Debe conservar bordes nítidos mediante nearest-neighbor.  
Debe fallar si aparecen halos, blur o escalado fraccional.

## Pruebas de marca

### G-07 — Logo Pixelorama

Usar la referencia `logopixel` seleccionada como fuente de estilo.

Debe conservar composición por bloques, lectura, paleta y carácter pixel art.  
Debe evitar vectorización, degradados, volumen 3D y tipografía generada ilegible.

### G-08 — Variante de fondo

Producir una variante transparente, una sobre fondo oscuro y una sobre fondo claro.

El símbolo y la palabra deben permanecer idénticos; solo cambia el contexto autorizado.  
La corrección final del texto se realiza en Pixelorama.

## Pruebas de ambiente

### G-09 — Capa de escenario

Generar una capa ambiental declarando bioma, resolución nativa y ubicación dentro del parallax.

Debe conservar especies chilenas plausibles, profundidad por capas y lectura de la zona jugable.  
Debe evitar plantas ornamentales genéricas o una textura fotográfica.

### G-10 — Zona de interfaz

Generar una escena con un área de composición reservada para UI.

Debe mantener una zona calma y contraste suficiente.  
Debe evitar detalle intenso detrás de botones o texto.

### G-11 — Uniformidad de módulo

Revisar el logo o sprite ampliado a zoom entero y sobre una retícula visible.

Cada celda se replica por el mismo factor entero y comparte origen de retícula. Los grupos contiguos de celdas pueden tener tamaños distintos: esto es válido y necesario para dibujar. Fallar si un detalle corta la celda declarada. Un remuestreo seguido de ampliación puede pasar esta medición y mantener defectos artísticos; revisar por separado la construcción de letras, nervaduras, contornos y sombras.

### G-12 — Paleta y alpha según contrato

Medir cada píxel visible contra la paleta declarada; reportar colores externos sin recolorear. Exigir opacidad para una presentación marfil, y fondo con alpha 0 y sujeto visible con alpha 255 para el logo aislado. Un tablero opaco falla transparencia.

### G-13 — Exportación fiel al lienzo nativo

Comparar todos los RGBA de la presentación con su PNG lógico repetido por escala entera. Si falta el PNG lógico, informar `not_supplied`. Esta prueba no determina si el PNG lógico fue bien diseñado.

### G-14 — Regresión del evaluador

Ejecutar `pwsh -NoProfile -File tools/test-pixel-contract.ps1`. Incluye celdas correctas con grupos de distinto tamaño, un píxel fuera de retícula, color externo, transparencia falsa, alpha parcial, lienzo vacío, dimensiones y discrepancia con el PNG lógico. Ningún caso numérico puede promover automáticamente un diseño.

## Registro de resultado

```text
ID de prueba:
Fecha:
Versión del playbook:
Prompt:
Referencias usadas:
Salida:
Puntaje 0–2 por criterio:
- identidad:
- morfología:
- silueta:
- píxel:
- paleta:
- composición:
- transparencia:
- texto:
- editable:
- trazabilidad:
Bloqueos detectados:
Corrección propuesta:
Decisión: conservar / corregir / descartar / promover
Revisó:
```

## Criterio de promoción

Una propuesta pasa a `editable verificado` solo si:

- no tiene bloqueos de morfología, píxel, transparencia ni texto;
- la salida fue adaptada o corregida en Pixelorama cuando el formato lo requiere;
- existe el `.pxo` real y su PNG de exportación;
- el prompt y las referencias están registrados;
- la decisión humana está atribuida.
