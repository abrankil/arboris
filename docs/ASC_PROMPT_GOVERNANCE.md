# Árboris — gobernanza de prompts validados

**Estado:** normativo
**Ámbito:** promoción, almacenamiento, versionado y consumo de prompts oficiales de Árboris.

## 1. Fuente de verdad

El repositorio canónico de Árboris y su rama `main` son la referencia compartida.

Los prompts oficiales validados viven en:

`prompts/validated/`

La ubicación es parte de la autoridad. Un archivo externo, adjunto de chat, copia local, resultado experimental o documento histórico no sustituye el artefacto canónico integrado en `main`.

## 2. Estructura

```text
prompts/
  README.md
  validated/
    <familia>/
      V<major>.<minor>.md
```

Las familias agrupan prompts por función. La primera familia establecida es:

`graphic-references`

## 3. Estados y promoción

Un candidato no es canon por contener la palabra `VALIDATED`.

La promoción exige evidencia de validación y revisión conforme a `docs/DEVELOPMENT_MANUAL.md`.

Solo después del merge a `main` el archivo bajo `prompts/validated/` adquiere autoridad compartida del repositorio.

## 4. Freeze

Un prompt `VALIDATED / FROZEN` no se corrige en sitio.

Cambios editoriales que alteren semántica, gates, campos, obligaciones, prohibiciones o handoff requieren revisión y regresión.

Una revisión correctiva puede conservar la versión semántica durante el ciclo de prueba, pero el artefacto promovido debe quedar con una identidad canónica inequívoca.

## 5. Trazabilidad

El prompt canónico debe registrar o vincular:

- versión;
- estado;
- suite de validación;
- resultado de regresión;
- conflictos bloqueantes conocidos;
- procedencia de la revisión.

Los registros históricos pueden vivir en documentación de trazabilidad, pero no reemplazan el prompt canónico.

## 6. Consumo

Para ejecutar una tarea basada en un prompt oficial:

1. resolver primero la familia;
2. abrir la versión canónica indicada en `prompts/README.md`;
3. usar el archivo exacto;
4. no completar silenciosamente vacíos con copias históricas;
5. preservar `OPEN`, `NO_VERIFICADO` y demás estados definidos por el contrato.

## 7. ASC

ASC compila y valida conforme a sus autoridades; no convierte automáticamente un candidato en canon de Árboris.

La promoción a `prompts/validated/` es una decisión de gobernanza del proyecto y debe pasar el protocolo de revisión del repositorio.

## 8. Primer baseline

`prompts/validated/graphic-references/V3.44.md`

Estado al promoverse:

`VALIDATED / FROZEN`

Suite:

`T01–T12 = PASS`

Regresión:

`PASS`

Conflictos bloqueantes conocidos:

`0`
