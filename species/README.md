# `species/` — evidencia fotográfica de terreno

Esta carpeta contiene archivos fotográficos organizados por especie/individuo. **No es la misma capa que `data/species/`.**

```text
species/
→ evidencia/archivos fotográficos

data/species/
→ vistas JSON generadas para lectura por especie
```

La autoridad botánica no vive en ninguna de estas dos carpetas. La fuente editorial/científica sigue siendo el Master descrito en `data/README.md`.

No mover, renombrar o reestructurar esta evidencia sin auditar primero scripts, metadata y rutas que puedan depender de su ubicación. La consolidación futura bajo una carpeta de evidencia más explícita permanece `OPEN` hasta terminar esa auditoría de dependencias.
