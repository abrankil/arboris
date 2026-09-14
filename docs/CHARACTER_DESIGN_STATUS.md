# Arboris — Estado del diseño de personajes

## Alcance actual

Este equipo de trabajo se concentra en diseño gráfico y UI/UX. Las fichas científicas se mantienen como referencia de identidad botánica y no se modifican desde esta línea de trabajo salvo para enlazar assets.

## Personajes vigentes

- **Litrini / Litre** — `SP002`, sprite limpiado manualmente, 125×125 px.
- **Quillai / Quillay** — `SP006`, sprite limpiado manualmente, 125×125 px.
- **Peumito / Peumo** — `SP001`, sprite limpiado manualmente, 125×125 px.

Los tres usan hojas como cuerpo, ojos pequeños, flotación independiente y pixel art HD-2D 1:1 con píxeles grandes. Frutos, flores o cápsulas pueden actuar como mascotas, accesorios o armas.

## Assets aprobados

- Promocional: `data/characters/shared/promotional/arboris-tres-personajes-125x125.png`.
- Capas de personajes: cada sprite vive en la carpeta de su especie bajo `assets/`.

El antiguo fondo `background-125x125.png` y el GIF de 125×125 fueron eliminados por resolución insuficiente. Los fondos ambientales se mantienen fuera de la galería de personajes y se versionan en `docs/assets/backgrounds/`, con variantes panorámicas y cuadradas HD-2D. La primera composición ya está separada en cuatro capas de parallax reutilizables.

## Próximo punto de trabajo

Probar estas capas en la escena jugable y ajustar las amplitudes de desplazamiento según el tamaño del display, manteniendo la zona jugable nítida y el primer plano con desenfoque discreto por bloques.
