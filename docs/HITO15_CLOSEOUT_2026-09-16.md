# Árboris — Cierre Hito 15

**Fecha:** 16 septiembre 2026  
**Estado:** cerrado como base canónica mínima  
**Alcance:** integración botánica canónica con motor de identificación simple, verificable y offline-first.

## 1. Decisión de cierre

Hito 15 se considera cerrado cuando existe un núcleo que conecta la matriz canónica de Master Botánico 2.0 con una lógica genérica de identificación, sin duplicar conocimiento botánico en código.

El cierre no significa que exista todavía UI final, BioCLIP integrado, visión automática, persistencia completa ni política final de descubrimiento. Esas piezas corresponden a los hitos posteriores.

## 2. Fuente de verdad

La fuente científica/editorial sigue siendo:

```text
data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx
```

El motor consume únicamente derivados canónicos de esa fuente:

```text
data/botanical/metadata.json
data/botanical/species.json
data/botanical/characters.json
data/botanical/species_characters.json
```

No usa `species_pilot.json`, claves hardcodeadas, previews antiguas ni fichas manuales.

## 3. Implementación mínima

Nuevo módulo:

```text
tools/canonical-identification/
  dataset.mjs
  engine.mjs
  engine.test.mjs
  README.md
```

Responsabilidades:

- `dataset.mjs` carga y normaliza el dataset canónico mínimo.
- `engine.mjs` evalúa compatibilidad, filtra candidatos, selecciona el siguiente carácter y entrega estado de identificación.
- `engine.test.mjs` verifica el comportamiento mínimo esperado.

## 4. Reglas implementadas

- Solo participan caracteres activos/computables.
- Los caracteres retirados o pendientes no participan en el motor.
- Un dato esperado desconocido no elimina candidatos.
- `unknown`, `not_observable` y equivalentes no eliminan candidatos.
- Una especie se elimina solo si existe incompatibilidad explícita entre estados conocidos.
- La selección del siguiente carácter es dinámica y depende de la matriz canónica.
- El resultado no fuerza identificación definitiva.

Estados de salida:

```text
unresolved
ambiguous
tentative
supported
```

## 5. Simplicidad y rendimiento

La implementación usa funciones puras y estructuras en memoria:

- sin framework nuevo;
- sin base de datos;
- sin servidor;
- sin motor de reglas externo;
- sin dependencias adicionales;
- sin conocimiento botánico hardcodeado.

Para el piloto de seis especies, esta estrategia es suficiente, rápida y fácil de auditar. La extensión futura debe justificarse con una necesidad real del piloto, no por anticipación teórica.

## 6. Validación ejecutada

Comando de validación:

```powershell
npm.cmd test
```

Resultado reportado localmente:

```text
verify:botanical
- MASTER 2.0 EXPORTADO VÁLIDO
- IDs canónicos válidos y únicos
- 6 fichas canónicas sincronizadas

test:canonical-identification
- tests 6
- pass 6
- fail 0
```

Esto valida que la capa botánica canónica y el motor mínimo pasan juntos.

## 7. Estado de subfases

| Subfase | Estado | Criterio |
| --- | --- | --- |
| 15.1 Master 2.0 canónico | cerrado | Fuente única definida. |
| 15.2 Export Master → JSON | cerrado | 8 JSON canónicos. |
| 15.3 Validación estricta | cerrado | 0 errores / 0 advertencias. |
| 15.4 IDs canónicos | cerrado | `SP-00X` válidos y compatibilidad histórica documentada. |
| 15.4B Fichas por especie | cerrado | 6 fichas generadas y validadas. |
| 15.5 Motor genérico | cerrado mínimo | `engine.mjs` consume matriz canónica. |
| 15.6 Selección adaptativa | cerrado mínimo | `nextCharacter()` selecciona carácter activo no observado. |
| 15.7 Evidencia mínima | cerrado mínimo | `filterCandidates()` acepta evidencia simple por `characterId`. |
| 15.8 Contrato visión/BioCLIP | cerrado como contrato | BioCLIP y visión quedan fuera del núcleo, preparados para hitos posteriores. |
| 15.9 Legado | cerrado como demarcación | Componentes legacy marcados, no eliminados masivamente. |
| 15.10 Documentación | cerrado | Estado y límites documentados. |

## 8. Qué queda fuera

No se implementa todavía:

- extracción automática de caracteres desde imagen;
- integración real con BioCLIP;
- interfaz de usuario;
- persistencia de sesiones;
- SQLite;
- sincronización offline/online;
- política final de descubrimiento/desbloqueo;
- retiro físico completo de todos los archivos legacy.

## 9. Siguiente paso lógico

Después de Hito 15, el desarrollo técnico debe avanzar a:

```text
Hito 16 — Extracción automática de caracteres botánicos
Hito 17 — Integración visión → caracteres → clave adaptativa
```

El próximo trabajo debe tomar el motor canónico como núcleo estable y agregar evidencia visual de forma restringida, carácter por carácter, sin permitir que un modelo visual dicte una identificación definitiva.
