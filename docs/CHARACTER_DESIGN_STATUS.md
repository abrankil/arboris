# Arboris — Estado del diseño de personajes

## Alcance actual

Este equipo de trabajo se concentra en diseño gráfico y UI/UX. Las fichas científicas se mantienen como referencia de identidad botánica y no se modifican desde esta línea de trabajo salvo para enlazar assets.

El argumento y el método de trabajo están en [GRAPHIC_DIRECTION.md](GRAPHIC_DIRECTION.md); el contrato visual y técnico, en [ART_STYLE_GUIDE.md](ART_STYLE_GUIDE.md). La lista operativa es [data/characters/index.json](../data/characters/index.json).

## Personajes vigentes

- **Litrini / Litre** — `SP002`, sprite limpiado manualmente, 125×125 px.
- **Quillai / Quillay** — `SP006`, sprite limpiado manualmente, 125×125 px.
- **Peumito / Peumo** — `SP001`, sprite limpiado manualmente, 125×125 px.
- **Mitiqui / Mitique** — `SP004`, sprite con limpieza técnica v2, 125×125 px y alpha binario.
- **Bollén** — `SP003`, sprite limpiado manualmente v1, 125×125 px, PNG RGBA con transparencia binaria. La limpieza manual reemplaza la propuesta previa.
- **Colliguay** — `SP005`, sprite limpiado manualmente v1, 125×125 px, PNG RGBA con transparencia binaria. La limpieza manual reemplaza la propuesta previa.

Los seis comparten hojas como cuerpo, ojos pequeños, flotación independiente y dirección HD-2D. Frutos, flores o cápsulas pueden actuar como mascotas, accesorios o armas según cada diseño. El formato y la transparencia se verifican aparte de la aprobación visual; ver pendientes técnicos más abajo.

Colliguay (`SP005`) tiene un diseño aprobado explícitamente por Alvaro a partir de la base seleccionada y el ajuste de puntas rojizas respaldado por la referencia cromática de Alejandra. La limpieza manual fue entregada y verificada como [PNG oficial 125×125](../../output/colliguay/colliguay-pixelorama-125x125.png), con alpha binario y [preview ampliado 500×500](../../output/colliguay/colliguay-pixelorama-preview-500x500.png). El asset ya está integrado al índice canónico; las propuestas y herramientas superadas permanecen archivadas. Ver [registro de producción](../../output/colliguay/PRODUCCION_COLLIGUAY.md).

## Regla de entrega editable

Aplicar el [contrato para Pixelorama](ART_STYLE_GUIDE.md#contrato-para-pixelorama): PNG base 125×125, cuadrícula de píxel revisada y ampliaciones enteras. Conservar las limpiezas manuales exactamente, incluida su paleta; una comprobación técnica no autoriza cambios automáticos.

## Assets aprobados

- Promocional de tres personajes: `data/characters/shared/promotional/arboris-tres-personajes-125x125.png`, referencia histórica de composición. No representa por sí sola el elenco actual de cinco ni sustituye las limpiezas posteriores.
- Capas de personajes: cada sprite vive en la carpeta de su especie bajo `assets/`.
- Bollén vigente: `data/characters/SP003_bollen/assets/bollen-pixelorama-125x125.png`, copia exacta del PNG limpiado por el usuario. Se conserva la entrega de trabajo en `../output/bollen/bollen-pixelorama-125x125.png` respecto de la raíz de Arboris.
- Mitique vigente: `data/characters/SP004_mitique/assets/mitique-pixelorama-125x125.png`, sincronizado con la capa RGBA de `../output/mitique/mitique-pixelorama-125x125.png.pxo` respecto de la raíz de Arboris.
- Colliguay vigente: `data/characters/SP005_colliguay/assets/colliguay-pixelorama-125x125.png`, copia exacta del PNG limpiado por el usuario. Las propuestas y registros de exploración están en `../output/colliguay/archive/` respecto de la raíz de Arboris.

El antiguo fondo `background-125x125.png` y el GIF de 125×125 fueron eliminados por resolución insuficiente. Los fondos ambientales se mantienen fuera de la galería de personajes y se versionan en `docs/assets/backgrounds/`, con variantes panorámicas y cuadradas HD-2D. La primera composición ya está separada en cuatro capas de parallax reutilizables.

## Próximo punto de trabajo

Elegir el siguiente recurso según la tarea solicitada, aplicar el brief de la dirección gráfica y comparar con los assets canónicos. Para escenarios, probar las capas en contexto y revisar escala, amplitudes y legibilidad; el detalle está en el [catálogo ambiental](assets/backgrounds/README.md).

## Verificación técnica y pendientes

La revisión actual confirma los cinco PNG en 125×125 con alpha binario. Mitique tenía 3.140 píxeles con alpha intermedio; se normalizaron técnicamente a 0/255 sin cambiar ningún canal RGB y se sincronizaron el PNG oficial, la capa del `.pxo` y el preview. Su aprobación visual queda separada de la revisión manual opcional de contorno y nervadura.

Mitique tiene una fuente `.pxo` localizada mediante `selectedDesign.source`, relativa a `data/characters/`; la capa de imagen interna fue comparada con el PNG oficial. La equivalencia queda limitada a esa capa y no sustituye una apertura visual en Pixelorama. No se recibió un `.pxo` de Bollén en esta entrega.

Ejecutar `pwsh -File tools/validate-graphic-assets.ps1` desde la raíz de Arboris para repetir las comprobaciones. El resultado informa los problemas sin editar píxeles. Los próximos cambios en un sprite aprobado deben responder a una instrucción concreta y conservar su procedencia.
