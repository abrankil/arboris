# Árboris — Sincronización de cierre de optimizaciones 2026-09-17

**Estado:** snapshot de cierre / evidencia reproducible / no normativo  
**Propósito:** cerrar la fase de optimización de acceso a datos y routing para agentes con una prueba reproducible de reducción de payload, costo de consulta y estabilidad del repositorio.

Este documento no reemplaza `docs/DEVELOPMENT_MANUAL.md`, `docs/DATA_ACCESS_PERFORMANCE.md`, `AGENTS.md`, `data/README.md` ni las fuentes científicas. Resume y fija la evidencia del cierre.

## 1. Alcance del cierre

La fase auditada incluye:

```text
routing explícito para agentes
→ AGENTS.md

mapa mínimo de acceso a datos
→ data/README.md

consulta botánica compacta
→ tools/botanical-data/query_botanical.py

prototipo SQLite derivado + índices
→ tools/botanical-data/build_reference_sqlite.py

benchmark runtime host JSON vs SQLite
→ tools/botanical-data/benchmark_reference_access.mjs

benchmark de routing para IA/agentes
→ tools/botanical-data/benchmark_ai_routing.mjs

validación automática
→ .github/workflows/ci.yml
→ .github/workflows/reference-data-benchmark.yml
```

La fuente editorial/científica no cambia:

```text
data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx
```

Los JSON, vistas por especie, SQLite y benchmarks siguen siendo derivados o superficies de lectura.

## 2. Qué significa “prueba de velocidad” en este cierre

No es posible demostrar dentro del repositorio la velocidad privada de razonamiento de un modelo de IA.

Por tanto, la prueba se define mediante proxies observables y reproducibles:

```text
1. bytes que un agente necesita recuperar/procesar
2. tiempo host de lectura + parseo + consulta
3. tamaño del resultado compacto entregable al modelo
4. tiempo de acceso del motor de identificación host
5. CI y pruebas de integridad después de las optimizaciones
```

Quedan fuera de esta prueba:

```text
latencia de red de conectores
latencia de inferencia del modelo
tokenización exacta por modelo
costo interno de chain-of-thought
rendimiento Hermes/expo-sqlite en Android real
```

## 3. Evidencia reproducible de routing para agentes

Workflow:

```text
Reference data benchmark
run: 35179413141
commit medido: f464d0137557adc4e8663c38399fa8ced132526b
artifact: reference-data-benchmark
artifact id: 10479549381
artifact digest: sha256:dafafa6d9f0d866986c4369a6038fb96f3116c8356edc5ce99035784a040708a
resultado: SUCCESS
```

Entorno:

```text
GitHub Actions
Ubuntu x64
Node v24.20.0
query transversal: CH-003
muestras: 60
```

### 3.1 Payload de entrada

```text
lectura amplia histórica
6 vistas data/species/*.json
= 246,702 bytes

ruta normalizada optimizada
species.json + characters.json + species_characters.json
= 55,284 bytes

reducción de input
246,702 / 55,284
= 4.462x menos payload en la ruta optimizada
```

### 3.2 Payload de resultado compacto

Para la misma comparación transversal:

```text
resultado compacto normalizado
= 1,174 bytes

246,702 / 1,174
= 210.138x entre lectura amplia y resultado compacto
```

Esto no significa que toda consulta de IA obtenga exactamente una reducción de 210x; demuestra que una consulta transversal típica puede resolverse sin transportar las seis fichas denormalizadas completas.

### 3.3 Tiempo host de parseo + consulta

```text
lectura amplia de seis vistas
mediana: 1,238.426 µs
p95:     1,447.365 µs

ruta normalizada optimizada
mediana:   324.864 µs
p95:       426.464 µs

broad / normalized median
= 3.812x

normalized / broad median
= 0.262x
```

En esta prueba host, la ruta optimizada ejecutó la misma clase de consulta aproximadamente 3.8 veces más rápido que la lectura amplia.

El ratio de bytes es determinista para el commit medido. El ratio temporal es direccional y puede variar entre runners.

## 4. Evidencia reproducible del motor de referencia

La misma ejecución repitió el benchmark JSON vs SQLite.

Dataset:

```text
6 especies
19 caracteres activos
88 relaciones activas del motor

JSON motor:       55,841 bytes
JSON canónico:   116,721 bytes
SQLite:          151,552 bytes
SQLite / JSON motor: 2.714x
```

Medianas del cierre:

| Escenario | JSON | SQLite | SQLite / JSON |
| --- | ---: | ---: | ---: |
| fresh session / first lookup | 539.317 µs | 85.157 µs | 0.158x |
| species lookup | 0.043 µs | 4.402 µs | 103.576x |
| species × character | 0.037 µs | 4.609 µs | 123.227x |
| character → candidates | 0.134 µs | 6.152 µs | 45.975x |
| character + state | 0.371 µs | 6.299 µs | 16.996x |

La corrida confirma la misma dirección observada en la corrida anterior: SQLite gana en apertura/primera consulta host; una vez cargado el pequeño dataset, JSON + índices en memoria es sustancialmente más rápido para el loop caliente del piloto.

La variación de valores absolutos entre corridas de GitHub-hosted runners se considera esperable; la decisión no depende de un umbral temporal rígido.

## 5. Integridad después de optimizar

Evidencia de CI relevante:

```text
benchmark commit CI
run: 35179413121
resultado: SUCCESS

sincronización general CI
run: 35179586889
resultado: SUCCESS

cierre documental CI
run: 35179690007
resultado: SUCCESS

cierre consolidado CI
run: 35179759966
resultado: SUCCESS

consolidación final previa
run: 35179835439
resultado: SUCCESS
```

Gates ejecutados:

```text
npm ci limpio                         PASS
Expo dependency alignment            PASS
high/critical production audit       PASS
Master Botánico 2.0                  PASS
species IDs                          PASS
species generated views              PASS
compact data access tests            PASS
SQLite reference tests               PASS
canonical identification tests       PASS
TypeScript typecheck                 SKIPPED — no tsconfig.json
```

La optimización de routing y acceso no introdujo regresiones detectadas por los tests canónicos existentes.

## 6. Decisiones de cierre

```text
AGENTS.md + data/README.md
→ ruta operativa aprobada para agentes

query_botanical.py
→ interfaz compacta aprobada para lectura acotada

JSON normalizado
→ superficie preferida para consultas transversales

una ficha data/species/*.json
→ superficie preferida para lectura profunda de una especie

seis fichas data/species/*.json para comparar
→ patrón a evitar salvo auditoría específica

JSON + Map en memoria
→ baseline aprobada para el motor del piloto

SQLite derivado
→ conservar como prototipo de profiling/escalamiento

migrar el motor del piloto a SQLite
→ no justificado por evidencia host actual

arquitectura Android final
→ OPEN
```

## 7. AUDITORÍA

La optimización cumple el objetivo sin crear una nueva fuente de verdad. La cadena científica se conserva y las nuevas superficies son regenerables o de solo lectura.

La prueba de routing compara dos caminos que responden la misma clase de pregunta transversal y muestra simultáneamente menor payload y menor costo host para el camino recomendado.

La prueba runtime repite la comparación JSON/SQLite y confirma la decisión provisional del motor sin elevarla indebidamente a arquitectura Android definitiva.

Resultado:

```text
routing de agentes                  PASS
reducción de payload                PASS — demostrada
reducción de parse/query host       PASS — demostrada direccionalmente
consulta compacta                   PASS
integridad canónica                 PASS
CI                                  PASS
arquitectura Android final          OPEN
```

## 8. INCONSISTENCIAS

### Hallazgo 1 — “velocidad de pensamiento” vs medición observable

No existe una métrica directa de pensamiento del modelo en este pipeline.

**Impacto:** afirmar una mejora directa de velocidad cognitiva sería una conclusión no sustentada.

**Corrección aprobada:** usar como evidencia únicamente reducción de payload, parseo/consulta host, tamaño del resultado y estabilidad de tests.

### Hallazgo 2 — variación entre corridas host

Los tiempos absolutos del benchmark JSON/SQLite varían entre runners.

**Impacto:** no deben usarse como SLA ni gate rígido.

**Corrección aprobada:** conservar medianas/p95 como evidencia direccional y exigir benchmark Android real antes de decisiones móviles definitivas.

No se detectan otras inconsistencias críticas en esta sincronización.

## 9. VACÍOS / OMISIONES

Permanecen `OPEN`:

- medición de latencia real de conectores GitHub/ChatGPT;
- token count real por modelo para cada ruta;
- benchmark de respuesta completa de un modelo bajo condiciones controladas;
- memoria residente comparada;
- benchmark Hermes + `expo-sqlite` en Android representativo;
- impacto del futuro dataset territorial a mayor escala;
- persistencia de observaciones/evidencia/progreso;
- arquitectura física final reference data vs user data;
- TypeScript gate mientras no exista `tsconfig.json`.

Estos vacíos no invalidan la conclusión limitada de este cierre: el repositorio ahora puede entregar menos datos y procesar una consulta transversal típica con menor costo host.

## 10. REDUNDANCIAS

Redundancias intencionales:

```text
data/species/*.json
→ vistas denormalizadas regenerables para lectura profunda

SQLite derivado
→ superficie de profiling/runtime experimental

artifacts de benchmark
→ evidencia temporal reproducible
```

No constituyen nuevas fuentes de verdad.

No se creó un índice JSON persistente adicional ni se versionó el binario SQLite. Los reportes generados viven en `build/` o artifacts temporales de GitHub Actions.

Este documento duplica solo el resumen necesario para trazabilidad del cierre. La estrategia normativa de rendimiento permanece en `docs/DATA_ACCESS_PERFORMANCE.md`.

## 11. Reproducción

Desde checkout limpio:

```powershell
npm ci
npm test
npm run benchmark:ai-routing
npm run benchmark:reference-data
```

Resultados esperados como archivos locales ignorados por Git:

```text
build/ai-routing-benchmark.json
build/ai-routing-benchmark.md
build/reference-benchmark.json
build/reference-benchmark.md
```

En GitHub, `.github/workflows/reference-data-benchmark.yml` vuelve a generar los cuatro reportes cuando cambian datos o capas de acceso relevantes.

## 12. Gate de cierre

```text
optimización de routing para agentes      CLOSED / PASS
consulta compacta                         CLOSED / PASS
benchmark host de routing                 CLOSED / PASS
benchmark host JSON vs SQLite             CLOSED / PASS
integridad CI post-optimización            CLOSED / PASS
sincronización remota de ramas            verificar externamente contra HEAD final
benchmark Android real                    OPEN
```

El siguiente trabajo de rendimiento no debe añadir más índices o representaciones por intuición. Debe partir de una necesidad runtime real o de mediciones Android representativas.
