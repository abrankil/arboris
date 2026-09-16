# Árboris — Empezar aquí

**Actualizado:** 16 septiembre 2026  
**Rama de referencia:** `main`

Este documento orienta a personas e IAs que llegan al repositorio sin contexto previo. No reemplaza la documentación técnica: indica qué leer y qué archivos gobiernan cada decisión.

## 1. Regla principal

La fuente científica/editorial única del piloto es:

`data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx`

Flujo de autoridad botánica:

```text
Master Botánico 2.0
        ↓
data/botanical/   (8 JSON canónicos generados)
        ↓
data/species/     (6 fichas completas generadas)
        ↓
consumidores: identificación, interfaz, IA y dirección de arte
```

Los JSON y fichas por especie son derivados reproducibles. No se editan para corregir botánica: la corrección debe entrar primero al Master 2.0 y después regenerarse.

## 2. Si eres Álvaro / dirección de arte

Orden recomendado:

1. `README.md` — visión general del producto.
2. `docs/GRAPHIC_DIRECTION.md` — autoridad, método y flujo gráfico.
3. `docs/ART_DIRECTION_AUDIT_2026-09-16.md` — estado del departamento, decisiones concretas y siguiente ejecución.
4. `docs/SPATIAL_MODEL.md` — modelo conceptual para transformar territorio real en espacio jugable.
5. `docs/TERRITORIAL_MAPPING_PROTOCOL.md` — procedimiento para levantar evidencia, definir Unidades Espaciales y construir blockouts.
6. `data/species/` — ficha completa de cada una de las seis especies piloto.
7. `species/<especie>/photos/` — fotografías reales disponibles.
8. `data/characters/` — canon gráfico/jugable y assets de personajes.
9. `docs/ART_STYLE_GUIDE.md` — contrato visual y técnico.

Modelo simple de trabajo:

```text
qué es real → qué evidencia tengo → qué conservo → cómo se juega → cómo se ve → qué valido
```

Para una decisión morfológica, consultar primero la ficha de `data/species/` y las fotografías reales. Si se necesita detalle de fuentes, estados o trazabilidad, revisar `data/botanical/`.

Una decisión artística no modifica la botánica. Un sprite tampoco constituye evidencia científica.

Para mapas, aplicar estas reglas:

```text
territorio real
→ evidencia registrada
→ Unidad Espacial
→ Instancia Territorial
→ Contrato Jugable
→ blockout
→ Dirección de Arte
```

No confundir:

- Unidad Espacial = lugar reconocible del recorrido;
- Celda Espacial = implementación técnica;
- Instancia Territorial = versión jugable de una o más Unidades Espaciales;
- `MAP-*` = blockout/mapa/prototipo derivado;
- topología = conectividad;
- flujo = experiencia de movimiento.

Estado operativo actual de Dirección de Arte:

- personajes base: canon operativo cerrado;
- derivados de personajes: pendientes;
- escenarios: marco definido, evidencia `core` pendiente;
- topología de mapas: sistema definido, pruebas de blockout pendientes;
- modelo espacial: consolidado conceptualmente, implementación pendiente;
- Master Territorial: concepto arquitectónico, formato aún `OPEN`;
- `PILOT-ENV-006`: abierto; los conteos ponderan presencia, la colocación exige observaciones territorializadas.

La siguiente ejecución recomendada para mapas es:

```text
IT-001 Acceso Principal
→ corroborar evidencia
→ MAP-001 blockout corridor
→ prototipo visual
→ pass / revise / fail
```

## 3. Si eres otra IA / desarrollo

Orden recomendado:

1. `README.md`.
2. `docs/START_HERE.md`.
3. `docs/ROADMAP.md` — estado real y siguiente trabajo.
4. `docs/ARCHITECTURE.md` — límites entre datos, evidencia, motor e IA.
5. `docs/DATA_MODEL.md` — semántica de las entidades.
6. `docs/SPATIAL_MODEL.md` — vocabulario espacial y límites entre territorio, juego y arte cuando la tarea afecte mapas/escenarios.
7. `data/botanical/metadata.json` — versión, SHA y contrato del Master exportado.
8. `data/botanical/` y `data/species/` — datos canónicos derivados.

Estado técnico actual: Master 2.0, export canónico, validaciones, IDs y fichas por especie están cerrados. No implementar conocimiento botánico hardcodeado nuevo. La clave debe consumir conocimiento canónico, no mantener una segunda botánica.

Para el frente espacial, no fijar todavía tamaño de celda, escala metro/celda, renderer, pathfinding ni formato final de mapas. Esas decisiones dependen de la validación de `IT-001 / MAP-001`.

## 4. Datos validados del piloto

- 6 especies.
- 24 caracteres botánicos totales.
- 19 caracteres activos/computables.
- 4 caracteres retirados.
- 1 carácter pendiente de revisión.
- 89 relaciones especie–carácter.
- 21 fuentes.
- 53 términos de glosario.
- 45 fotografías.
- 2 errores de modelo documentados.

Los nuevos componentes botánicos usan IDs canónicos `SP-001`…`SP-006`. Los IDs `SP001`…`SP006` permanecen por compatibilidad histórica en arte/runtime.

## 5. Archivos que pueden confundir

Existen archivos históricos que todavía se conservan por trazabilidad o compatibilidad. No son autoridad vigente:

- `data/source/Base_botanica_Pokedex_flora_Master.xlsx` — Master anterior.
- `data/source/Fichas_especies_arboris.xlsx` — material editorial/descriptivo anterior.
- `data/botanical/species_pilot.json` — export legacy `pilot-master-v0.1`.
- `docs/BOTANICAL_KEY_PILOT.md` — referencia histórica/metodológica de la clave, no fuente botánica.
- componentes legacy de clave/adaptador — pendientes de auditoría y retirada controlada en Hito 15.9.

Si cualquiera de estos elementos contradice Master 2.0, gobierna Master 2.0.

## 6. Dos significados distintos de “characters”

No confundir:

- `data/botanical/characters.json` = **caracteres botánicos** (`CH-xxx`).
- `data/characters/` = **personajes del juego** y sus assets.

## 7. Comprobación de la capa botánica

Desde la raíz del repositorio:

```powershell
python tools/botanical-data/export_master.py
python tools/botanical-data/validate_master_export.py
python tools/botanical-data/validate_species_ids.py
python tools/botanical-data/build_species_data.py
python tools/botanical-data/validate_species_data.py
```

La salida canónica debe mantenerse reproducible. Las fichas de `data/species/` no se editan manualmente.

## 8. Regla para navegar el repositorio

Usar `main` como estado compartido de referencia. Las ramas de trabajo y los experimentos pueden contener código incompleto, histórico o no validado; no deben utilizarse para definir el estado vigente del proyecto salvo que la tarea lo indique explícitamente.
