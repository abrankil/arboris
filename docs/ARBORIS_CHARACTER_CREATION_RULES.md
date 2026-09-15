# Árboris — Normas compartidas para creación de personajes

Revisión de dirección de arte: 2026-09-15. El documento se aplica a personajes botánicos y auxiliares; todos los diseños vigentes pueden recibir nuevas versiones documentadas.

Documento de entrada para cualquier chat o tarea de creación, revisión o limpieza de personajes.

## Fuente de autoridad

Consultar en este orden:

1. `docs/GRAPHIC_DIRECTION.md` — propósito, identidad, elenco y método.
2. `docs/ART_STYLE_GUIDE.md` — lenguaje visual, Pixelorama y conservación.
3. `docs/CHARACTER_DESIGN_STATUS.md` — diseños vigentes y estados.
4. `data/characters/index.json` y la ficha de la especie — identidad y archivo seleccionado.
5. Fotografías y fuentes botánicas — evidencia de la especie real.

Una referencia externa o una imagen generada sirve para estudiar principios, no para reemplazar estas fuentes.

## Reglas obligatorias

- Los personajes de colección usan la hoja como cuerpo principal.
- Flotan de manera independiente y no tienen brazos ni piernas, salvo una excepción auxiliar documentada.
- No usar torso, manos, pies, anatomía humana ni vestuario que convierta la hoja en humanoide.
- Mantener ojos pequeños y rasgos expresivos integrados en la hoja.
- Conservar forma, margen, ápice, nervaduras, coloración y asimetría de la especie.
- Frutos, flores, cápsulas o semillas solo aparecen si la ficha y el diseño aprobado los contemplan.
- Sprite de galería: PNG RGBA de 125×125 px, Pixelorama 1:1, píxel real 1×1 y pincel de 1 px.
- El área efectiva puede ser menor que el lienzo; no llenar el cuadrado por obligación.
- Sin antialiasing, blur, interpolación, semitransparencias accidentales, halos ni píxeles fantasma.
- Una generación o reducción es `referencia para limpieza`, nunca un sprite verificado automáticamente.
- El `.pxo` solo se declara existente si fue entregado o creado realmente en Pixelorama.

## Elenco vigente

- Peumo / Peumito: hoja ovalada verde azulado grisácea, sin pecíolo visible; drupa rosada o roja.
- Litre / Litrini: hoja ovalada, nervaduras secundarias bifurcadas cerca del margen y tallo curvo; dos frutos blancos.
- Bollén: hoja oblonga, ápice poco agudo, margen aserrado continuo y dientes blanquecinos; fruto oscuro estrellado.
- Mitique: hoja única ancha en la zona media, ápice alargado, dientes suaves y nervadura fina blanquecina; sin acompañante.
- Quillay / Quillai: hoja con coronilla característica y dos dientes suaves por lado; sin accesorio separado en el PNG vigente.
- Colliguay: hoja única con pecíolo corto y puntas rojizas; sin acompañante en la versión aprobada.
- Boldo: hoja oblonga de verde bosque oliva oscuro, superficie coriácea y textura agrupada; fruto burgundy y flor clara separados; diseño vigente sujeto a cambios posteriores.
- Piedra-guía de líquen: auxiliar no botánico; roca compacta con manto de líquen y rostro amable.

## Flujo de trabajo

Referencia botánica → observación → propuesta → revisión contra el PNG aprobado → limpieza manual → verificación técnica → aprobación de diseño.

Antes de producir, declarar especie, archivo de partida, rasgos a conservar, cambio solicitado, compañeros, lienzo y formato. Separar aprobación visual de validación técnica.

## Prompts y economía de tokens

- Analizar, corregir o redactar un prompt no significa generar una imagen.
- Ejecutar un modelo solo ante una instrucción explícita de generación.
- Generar una variante por defecto y no iterar automáticamente.
- Registrar modelo, fecha, referencias, prompt, prompt negativo, salida y observaciones.
- En escenas esclerófilas, las flores deben ser escasas, irregulares y representativas; nunca un tapiz ornamental ni ausencia absoluta.

## Documentos relacionados

- `docs/GRAPHIC_DIRECTION.md`
- `docs/ART_STYLE_GUIDE.md`
- `docs/CHARACTER_DESIGN_STATUS.md`
- `docs/ENVIRONMENT_PRODUCTION_SPEC.md`
- `analysis/prompts/README.md`
