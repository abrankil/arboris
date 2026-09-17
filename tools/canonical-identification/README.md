# Canonical identification engine

Estado: Hito 15.5–15.7 cerrado; preparación mínima para Hito 16.

Este módulo implementa el núcleo simple de identificación para el piloto Árboris. Consume exclusivamente los JSON canónicos derivados de Master Botánico 2.0.

## Fuente de datos

```text
data/botanical/metadata.json
data/botanical/species.json
data/botanical/characters.json
data/botanical/species_characters.json
```

No lee la clave histórica, no usa previews antiguas y no contiene botánica hardcodeada de especies.

## Archivos

- `dataset.mjs` — carga y normaliza el dataset canónico mínimo.
- `engine.mjs` — evalúa compatibilidad, filtra candidatos, selecciona siguiente carácter y entrega un estado cauteloso.
- `engine.test.mjs` — pruebas del comportamiento esperado.

## Reglas

- Solo participan caracteres activos/computables.
- Un dato esperado desconocido no elimina candidatos.
- Una observación desconocida o no observable no elimina candidatos.
- Solo una incompatibilidad explícita entre estados conocidos elimina una especie.
- La selección del siguiente carácter es dinámica y usa datos canónicos.
- El motor contiene comportamiento; el conocimiento está en `data/botanical/`.
- El puntaje diagnóstico normaliza etiquetas simples del piloto, incluido `medio-alto`.
- Las dependencias `aplica_si` se usan como compuerta mínima para no preguntar caracteres dependientes antes de satisfacer su carácter padre.

## Uso

```powershell
node --test tools/canonical-identification/engine.test.mjs
```

## Límites actuales

La compuerta `aplica_si` soporta por ahora expresiones simples del tipo:

```text
CH-013 contiene capsula
```

No es un motor lógico general. Si aparecen nuevas formas de dependencia en el Master, deben agregarse explícitamente y cubrirse con pruebas.

## Fuera de alcance

Esta etapa no implementa UI, BioCLIP real, visión artificial, SQLite, sincronización ni política final de descubrimiento. Es el núcleo verificable para cerrar Hito 15 y preparar la integración posterior.
