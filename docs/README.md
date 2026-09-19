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
→ ASC_V0_1_EXECUTABLE_SPEC.md   # implementación v0.1 compile-only
→ ASC_VOCABULARY_GUIDE.md       # referencia rápida, no normativa

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

## Implementación ASC

- [`ARBORIS_SCENE_COMPILER.md`](ARBORIS_SCENE_COMPILER.md): autoridad normativa de ASC.
- [`ASC_V0_1_EXECUTABLE_SPEC.md`](ASC_V0_1_EXECUTABLE_SPEC.md): contrato de implementación del compilador determinista `compile-only` v0.1.
- `tools/asc/`: implementación ejecutable, pruebas y fixture mínimo de v0.1.

La existencia de v0.1 no cierra el formato serializado definitivo, la ejecución generativa, los providers, las métricas automáticas ni la integración con renderer; esos elementos siguen `OPEN` según la autoridad normativa.

## Para Alejandra

Si la tarea es decisión de producto, alcance, arquitectura, datos o estado del desarrollo, partir por los documentos de producto/arquitectura y luego abrir solo la autoridad específica del tema.

Para consultas rápidas de terminología transversal se puede abrir `GENERAL_VOCABULARY_GUIDE.md`, sin tratarla como sustituto del documento normativo correspondiente.

Si la tarea consiste en generar o auditar una escena mediante IA/herramienta generativa, usar `ARBORIS_SCENE_COMPILER.md` como autoridad de compilación y abrir después únicamente los contratos y documentos de dominio necesarios. `ASC_VOCABULARY_GUIDE.md` sirve como recordatorio operativo. Para trabajar en el compilador ejecutable, continuar con `ASC_V0_1_EXECUTABLE_SPEC.md` y `tools/asc/README.md`.

## Para Álvaro

Si la tarea es arte, personajes, ambientes o composición visual, partir por `GRAPHIC_DIRECTION.md` / `ART_STYLE_GUIDE.md` y después abrir solo la guía o canon específico del activo. Si la propuesta visual se genera mediante ASC, las reglas de `ARBORIS_SCENE_COMPILER.md` controlan la traducción de evidencia/contratos al prompt, sin reemplazar la autoridad artística.

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
