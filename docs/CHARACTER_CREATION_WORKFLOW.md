# Árboris — Character creation workflow

Documento operativo para crear, revisar o modificar personajes.  
No reemplaza `GRAPHIC_DIRECTION.md` ni `ART_STYLE_GUIDE.md`.

## Fuentes de autoridad

Consultar en este orden:

1. `GRAPHIC_DIRECTION.md` — propósito, decisiones y jerarquía.
2. `ART_STYLE_GUIDE.md` — contrato visual y técnico.
3. `CHARACTER_DESIGN_STATUS.md` — estado real de producción.
4. `data/characters/index.json` y ficha individual — canon operativo.
5. ficha de especie, fotografías y fuentes botánicas — evidencia.

## 1. Brief mínimo

Antes de producir registrar:

- especie o personaje auxiliar;
- uso previsto;
- archivo de partida;
- fuentes botánicas;
- rasgos que deben conservarse;
- cambio solicitado;
- elementos secundarios;
- decisiones abiertas;
- lienzo y formato;
- comparación con el canon;
- validación prevista.

## 2. Evidencia

Separar explícitamente:

- lo descrito por fuentes botánicas;
- lo visible en fotografías;
- variación intraespecífica;
- decisiones de dirección de arte.

No convertir una decisión gráfica en regla botánica universal.

## 3. Rasgos obligatorios

Definir antes de dibujar:

- silueta;
- margen;
- ápice;
- nervaduras;
- coloración;
- textura;
- asimetrías relevantes;
- estructuras reproductivas incluidas.

Si un rasgo no está respaldado, dejarlo abierto.

## 4. Propuesta

Construir una propuesta que:

- conserve los rasgos obligatorios;
- se diferencie del elenco;
- mantenga el lenguaje HD-2D/pixel art de Árboris;
- no agregue anatomía humanoide a personajes botánicos;
- no invente mecánicas de juego.

Una generación automática es una referencia o propuesta, no un sprite verificado.

## 5. Revisión de diseño

Aplicar cuatro pruebas:

### Silhouette test
¿El personaje se distingue del elenco por su silueta?

### Botanical cue test
¿Siguen visibles los rasgos botánicos seleccionados como esenciales?

### Thumbnail test
¿Se lee correctamente a tamaño de colección/UI?

### Environment test
¿Mantiene legibilidad en un escenario Árboris?

Estas pruebas complementan la aprobación de Dirección de Arte.

## 6. Aprobación visual

Registrar por separado:

- aprobación de diseño;
- aspectos todavía abiertos;
- modificaciones solicitadas.

Una aprobación visual no certifica el archivo técnico.

## 7. Preparación para Pixelorama

Seguir exclusivamente el contrato de `ART_STYLE_GUIDE.md`.

Resumen no normativo:
- 125×125 px;
- PNG RGBA;
- píxel real 1×1;
- pincel de 1 px;
- transparencia real;
- sin blur o antialiasing accidental;
- nearest-neighbor en ampliaciones.

Una imagen reducida sigue siendo `referencia para limpieza` hasta su revisión manual.

## 8. Validación técnica

Comprobar:

- dimensiones;
- RGBA;
- transparencia;
- alpha esperado;
- rutas;
- hashes;
- coherencia con `selectedDesign`.

La validación técnica informa; no redibuja.

## 9. Integración

Solo después de aprobación visual + revisión técnica:

- copiar el sprite aceptado sin alterar píxeles;
- actualizar la ficha si corresponde;
- actualizar el índice solo cuando el personaje pasa a canon;
- conservar la procedencia;
- no sustituir un master por un derivado.

## 10. Registro

Registrar:

- fecha;
- responsable;
- versión de diseño;
- versión de sprite;
- revisión técnica;
- fuentes;
- prompt/modelo si hubo generación;
- asset resultante;
- pendientes.

## Estados de producción

`referencia → propuesta → diseño aprobado → editable verificado → limpieza manual integrada`

Un estado posterior puede volver a revisión mediante una nueva versión documentada.
