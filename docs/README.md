# Árboris — mapa de documentación

Este archivo sirve como índice humano. No reemplaza los documentos normativos.

## Entrada rápida

```text
producto / dirección
→ PRODUCT_VISION.md
→ PRODUCT_PRINCIPLES.md
→ ROADMAP.md

arquitectura / datos
→ ARCHITECTURE.md
→ DATA_MODEL.md
→ DATA_ACCESS_PERFORMANCE.md

desarrollo seguro
→ DEVELOPMENT_MANUAL.md
→ GENERAL_VOCABULARY_GUIDE.md   # referencia rápida, no normativa

compilación de escenas / prompts generativos
→ ARBORIS_SCENE_COMPILER.md
→ ASC_VOCABULARY_GUIDE.md       # referencia rápida, no normativa
→ ASC_TEST_RECORD_TEMPLATE.md   # plantilla de registro de pruebas
→ ASC_EXTERNAL_REFERENCE_BENCHMARK_2026-09-17.md
→ ASC_CLOSEOUT_HANDOFF_2026-09-17.md

manuales operativos aprobados
→ ARBORIS_WORK_MANUALS_INTEGRATION_2026-09-17.md
→ Google Drive / Proyecto Árboris / 00_MANUALES_DE_TRABAJO

arte / personajes
→ GRAPHIC_DIRECTION.md
→ ART_STYLE_GUIDE.md
→ CHARACTER_CREATION_WORKFLOW.md
→ CHARACTER_TEMPLATE.md
→ CHARACTER_DESIGN_STATUS.md

ambientes / mapas
→ PILOT_ENVIRONMENT_VISUAL_CANON.md
→ SPATIAL_MODEL.md
→ TERRITORIAL_MAPPING_PROTOCOL.md
→ MAP_TOPOLOGY_SYSTEM.md
→ MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN.md
→ ENVIRONMENT_ART_DIRECTION.md
→ ENVIRONMENT_PRODUCTION_SPEC.md
```

## Guías de vocabulario

- [`GENERAL_VOCABULARY_GUIDE.md`](GENERAL_VOCABULARY_GUIDE.md): vocabulario transversal para desarrollo, territorio, revisión, GitHub y trabajo diario. Es una guía operativa aprobada provisionalmente; las autoridades normativas de cada dominio siguen prevaleciendo.
- [`ASC_VOCABULARY_GUIDE.md`](ASC_VOCABULARY_GUIDE.md): referencia rápida para términos, órdenes y tratamientos de información de ASC. La autoridad normativa sigue siendo `ARBORIS_SCENE_COMPILER.md`.

## Documentos ASC recientes

- [`ASC_TEST_RECORD_TEMPLATE.md`](ASC_TEST_RECORD_TEMPLATE.md): plantilla operativa provisional para registrar pruebas ASC con contrato, prompt ASC, prompt efectivo, handoff, auditoría, atribución y lectura separada ASC/proyecto consumidor.
- [`ASC_EXTERNAL_REFERENCE_BENCHMARK_2026-09-17.md`](ASC_EXTERNAL_REFERENCE_BENCHMARK_2026-09-17.md): investigación de referentes externos similares o complementarios a ASC.
- [`ASC_CLOSEOUT_HANDOFF_2026-09-17.md`](ASC_CLOSEOUT_HANDOFF_2026-09-17.md): cierre de sesión y punto de reinicio para Alejandra antes de continuar con TEST-004.

## Manuales operativos aprobados

- [`ARBORIS_WORK_MANUALS_INTEGRATION_2026-09-17.md`](ARBORIS_WORK_MANUALS_INTEGRATION_2026-09-17.md): registro técnico de documentación, validación e integración de 4A `Verbos de trabajo` y 4B `Ciclo de trabajo`. Las piezas visuales aprobadas se consultan en Google Drive, dentro de `Proyecto Árboris/00_MANUALES_DE_TRABAJO/01_METODO_DE_TRABAJO/`.

## Para Alejandra

Si la tarea es decisión de producto, alcance, arquitectura, datos o estado del desarrollo, partir por los documentos de producto/arquitectura y luego abrir solo la autoridad específica del tema.

Para consultas rápidas de terminología transversal se puede abrir `GENERAL_VOCABULARY_GUIDE.md`, sin tratarla como sustituto del documento normativo correspondiente.

Si la tarea consiste en generar o auditar una escena mediante IA/herramienta generativa, usar `ARBORIS_SCENE_COMPILER.md` como autoridad de compilación y abrir después únicamente los contratos y documentos de dominio necesarios. `ASC_VOCABULARY_GUIDE.md` sirve como recordatorio operativo.

Para retomar el trabajo iniciado en la rama `docs/asc-method-hardening-2026-09-17`, partir por `ASC_CLOSEOUT_HANDOFF_2026-09-17.md` antes de continuar con pruebas nuevas.

## Para Álvaro

Si la tarea es arte, personajes, ambientes o composición visual, partir por `GRAPHIC_DIRECTION.md` / `ART_STYLE_GUIDE.md` y después abrir solo la guía o canon específico del activo. Si la propuesta visual se genera mediante ASC, las reglas de `ARBORIS_SCENE_COMPILER.md` controlan la traducción de evidencia/contratos al prompt, sin reemplazar la autoridad artística.

Para desarrollo de ASC, distinguir entre hallazgos generales de ASC y hallazgos específicos de Árboris como proyecto consumidor. Árboris es el primer caso piloto, no el límite del sistema ASC.

## Documentos históricos

Archivos con nombres como `*_AUDIT_*`, `*_SNAPSHOT_*`, `*_SYNC_*`, `*_CLOSEOUT_*`, `*_WORKLOG_*`, `*_HANDOFF_*` o planes de refactor registran historia, decisiones y trazabilidad. No deben tomarse como autoridad actual cuando existe un documento normativo vigente.

Los prototipos y experimentos de código históricos están fuera del camino principal en `/archive/`.

## Regla de lectura

```text
1. clasificar la tarea
2. abrir el documento de autoridad
3. añadir solo dependencias necesarias
4. usar las guías de vocabulario solo como referencia rápida
5. evitar históricos salvo que la tarea requiera historia
6. aplicar DEVELOPMENT_MANUAL antes de consolidar cambios
```
