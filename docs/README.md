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

## Para Alejandra

Si la tarea es decisión de producto, alcance, arquitectura, datos o estado del desarrollo, partir por los documentos de producto/arquitectura y luego abrir solo la autoridad específica del tema.

## Para Álvaro

Si la tarea es arte, personajes, ambientes o composición visual, partir por `GRAPHIC_DIRECTION.md` / `ART_STYLE_GUIDE.md` y después abrir solo la guía o canon específico del activo.

## Documentos históricos

Archivos con nombres como `*_AUDIT_*`, `*_SNAPSHOT_*`, `*_SYNC_*`, `*_CLOSEOUT_*`, `*_WORKLOG_*`, `*_HANDOFF_*` o planes de refactor registran historia, decisiones y trazabilidad. No deben tomarse como autoridad actual cuando existe un documento normativo vigente.

Los prototipos y experimentos de código históricos están fuera del camino principal en `/archive/`.

## Regla de lectura

```text
1. clasificar la tarea
2. abrir el documento de autoridad
3. añadir solo dependencias necesarias
4. evitar históricos salvo que la tarea requiera historia
5. aplicar DEVELOPMENT_MANUAL antes de consolidar cambios
```
