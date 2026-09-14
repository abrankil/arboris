# Arboris — Capas de parallax

Estas capas forman el primer escenario ambiental reutilizable de Arboris. Todas comparten lienzo de 1672×941 px, transparencia donde corresponde y bordes de píxel conservados.

## Orden de composición

1. `parallax/00-sky.png` — cielo base opaco con franjas horizontales.
2. `parallax/01-background.png` — cordillera, nubes y valle lejano.
3. `parallax/02-midground.png` — ladera, ciudad, sendero y vegetación intermedia.
4. `parallax/03-foreground.png` — rocas, flores, pastos y chaguales cercanos. Los chaguales usan hojas finas, caídas y una inflorescencia terminal mayormente leñosa; sus pétalos azul-turquesa aparecen solo como pequeños acentos en un racimo tipo “cola de zorro”.

## Prueba de desplazamiento

`parallax/animate_parallax.py` compone una demostración de 960×540 px con amplitudes crecientes por plano (0, 4, 12 y 24 px). Usa escalado nearest-neighbor y una paleta GIF compartida para evitar parpadeo de color.

Para regenerar la prueba, ejecutar el script desde esta carpeta con Pillow instalado. La salida se crea en `parallax/animation/` y no forma parte del paquete base de capas.
