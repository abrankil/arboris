# tools/botanical-data — Pipeline botánico

Este directorio contiene herramientas para trabajar con la capa botánica del piloto Árboris.

## Flujo vigente

La fuente científica/editorial única es:

`data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx`

Flujo operativo actual:

```powershell
python tools/botanical-data/export_master.py
python tools/botanical-data/validate_master_export.py
python tools/botanical-data/validate_species_ids.py
python tools/botanical-data/build_species_data.py
python tools/botanical-data/validate_species_data.py
```

Archivos vigentes del pipeline:

- `export_master.py` — exporta Master 2.0 a los 9 JSON canónicos de `data/botanical/`.
- `validate_master_export.py` — valida estructura, conteos, referencias, estados y SHA del export.
- `validate_species_ids.py` — valida IDs canónicos `SP-001...SP-006` y compatibilidad histórica `SP001...SP006`.
- `build_species_data.py` — genera las 6 fichas completas de `data/species/` desde los JSON canónicos.
- `validate_species_data.py` — comprueba que las fichas de `data/species/` reproduzcan exclusivamente los JSON canónicos.

## Consulta compacta de solo lectura

`query_botanical.py` reduce el payload necesario para consultas puntuales de humanos, agentes y herramientas. Lee directamente los JSON canónicos y no escribe datos.

Ejemplos:

```powershell
python tools/botanical-data/query_botanical.py stats --pretty
python tools/botanical-data/query_botanical.py species SP-001 --pretty
python tools/botanical-data/query_botanical.py character CH-003 --pretty
python tools/botanical-data/query_botanical.py relation SP-001 CH-003 --with-source --pretty
python tools/botanical-data/query_botanical.py compare CH-003 SP-001 SP-002 SP-006 --pretty
python tools/botanical-data/query_botanical.py photos SP-001
python tools/botanical-data/query_botanical.py errors SP-002
python tools/botanical-data/query_botanical.py ecology SP-006
```

El JSON compacto es la salida predeterminada para reducir contexto. `--pretty` cambia solo el formato de presentación.

Prueba de contrato:

```powershell
python tools/botanical-data/test_query_botanical.py
```

## Prototipo SQLite derivado

`build_reference_sqlite.py` genera una base SQLite **derivada** para medir y validar consultas runtime sin convertir SQLite en fuente editorial.

Salida predeterminada:

```text
build/arboris_reference.sqlite3
```

`build/` ya está excluido de Git, por lo que la base generada no se versiona como binario.

Construcción:

```powershell
npm run build:reference-db
```

Validación de equivalencia básica e índices críticos:

```powershell
npm run verify:reference-db
```

El prototipo materializa estados esperados en `species_character_states` y prueba índices orientados a:

- lookup por carácter;
- filtrado carácter + estado;
- fotos por especie/individuo;
- errores de modelo por especie real.

El esquema físico definitivo de SQLite sigue `OPEN`.

`species_ecology.json` no se materializa en el prototipo SQLite schema v1. Su incorporación futura requiere un gate específico de necesidad y rendimiento.

## Benchmark JSON vs SQLite

`benchmark_reference_access.mjs` compara el loader JSON canónico y sus índices en memoria con el SQLite derivado dentro del mismo proceso Node.js host.

Ejecución local:

```powershell
npm run benchmark:reference-data
```

Produce:

```text
build/reference-benchmark.json
build/reference-benchmark.md
```

El benchmark host es evidencia direccional y no un gate de rendimiento. **No** sustituye el benchmark final con Hermes + `expo-sqlite` en Android. La baseline vigente del motor de identificación del piloto es JSON + índices en memoria; SQLite permanece como prototipo de profiling/escalamiento.

## Benchmark de routing para IA/agentes

`benchmark_ai_routing.mjs` compara una lectura transversal amplia de las seis fichas `data/species/*.json` con la ruta normalizada definida en `AGENTS.md` y `data/README.md`.

Ejecución local:

```powershell
npm run benchmark:ai-routing
```

Produce:

```text
build/ai-routing-benchmark.json
build/ai-routing-benchmark.md
```

Este benchmark mide dos proxies reproducibles de eficiencia para agentes: bytes que deben recuperarse/procesarse y costo host de parseo + consulta. **No** mide directamente la velocidad de pensamiento, latencia de generación ni tiempo de red de un modelo de IA.

`.github/workflows/reference-data-benchmark.yml` ejecuta ambos benchmarks cuando cambian las capas de datos/acceso pertinentes y publica los reportes como artifact temporal.

La estrategia completa y las decisiones vigentes están en `docs/DATA_ACCESS_PERFORMANCE.md`. El snapshot de cierre de optimización está en `docs/OPTIMIZATION_CLOSURE_SYNC_2026-09-17.md`.

## Regla de edición

No corregir botánica editando JSON derivados. Toda corrección debe entrar al Master 2.0 y propagarse mediante el flujo anterior.

`query_botanical.py` es una interfaz de lectura. `build_reference_sqlite.py` produce un artefacto runtime regenerable. Los scripts de benchmark solo miden. Ninguno constituye una fuente de verdad ni un generador de conocimiento.

## Herramientas legacy

Los scripts históricos de comparación/fusión usados antes de Master 2.0 no forman parte del flujo vigente. Si aparecen en historial o ramas antiguas, no deben usarse para generar nuevas fichas.

La salida temporal antigua de `tools/botanical-data/output/` fue retirada del `main` porque contenía previews `pilot-master-v0.1` y podía confundirse con las fichas vigentes.
