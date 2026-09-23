# Árboris — prompts canónicos

Este directorio contiene prompts operativos promovidos formalmente a canon del proyecto.

## Autoridad

`prompts/validated/` es la única ubicación canónica para prompts con estado `VALIDATED / FROZEN`.

Un prompt encontrado fuera de esa ruta no debe tratarse como prompt oficial vigente solo por su nombre, versión o contenido.

## Estados

- `candidate`: trabajo todavía sujeto a auditoría o regresión; no pertenece a `validated/`.
- `VALIDATED`: pasó la suite de validación definida para su contrato.
- `FROZEN`: el artefacto validado no se modifica en sitio. Cualquier cambio contractual exige una nueva revisión/versionado y nueva validación.

## Regla de promoción

Para ingresar a `prompts/validated/`, un prompt debe tener:

1. versión explícita;
2. autoridad/procedencia identificada;
3. auditoría ASC completada;
4. inconsistencias, vacíos/omisiones y redundancias resueltos o explícitamente aceptados;
5. suite de validación aplicable en PASS;
6. regresión de invariantes aplicable en PASS;
7. cero conflictos bloqueantes conocidos;
8. registro de validación trazable.

## Regla de edición

No editar silenciosamente un prompt `FROZEN`.

Si aparece un defecto:
`baseline congelado → hallazgo → candidato/revisión → auditoría → corrección → regresión → promoción`.

## Prompt vigente

- Referencias gráficas: `validated/graphic-references/V3.44.md`

El contenido del archivo canónico, y no una copia de chat o archivo local, es la referencia compartida una vez integrado en `main`.
