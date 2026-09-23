# ASC — Auditoría adversarial del diseño R5 v1

**ID:** ASC-R5-DESIGN-ADV-001  
**Fecha:** 2026-09-22  
**Objeto:** `ASC_R5_CLAIM_LEVEL_PROVENANCE_DESIGN_001.md` + `R5_DESIGN_MANIFEST_001.json`  
**Resultado:** PARTIAL / REVISE  
**Naturaleza:** auditoría interna adversarial, no independiente

## AUDITORÍA

El diseño v1 corrigió los defectos previamente detectados: congeló una fuente sintética por SHA-256, separó C1–C3 como claims primarios, relegó C4/C5 a sentinelas secundarios, definió una rúbrica operacional y mantuvo `CLAIM` como unidad experimental no normativa.

La fuente `R5_SOURCE_001.svg` fue verificada contra el SHA-256 declarado:

`f73dd125a91a17d0034752ecfd8edacdbc44e47394273ad1c1fa9e636a39bd87`

Sin embargo, la auditoría adversarial detectó una vía de fuga posicional en el paquete conceptual: el vocabulario de estados estaba enumerado en el mismo orden semántico que C1–C5. Aunque no existía mapping explícito en el control, un productor podía reconstruirlo por posición.

También faltaban todavía los paquetes exactos de control/tratamiento y la instrucción exacta de productor congelados como artefactos reproducibles.

## INCONSISTENCIAS

El diseño declaraba que la única variable material era `EXPLICIT_CLAIM_STATUS_BINDING`, pero el orden del vocabulario permitía una segunda señal implícita de binding en la condición de control.

Eso contradice la intención de aislar la variable experimental.

Corrección requerida:

- tratar el vocabulario como conjunto sin orden semántico;
- usar el mismo orden no alineado con C1–C5 en ambas condiciones;
- congelar los paquetes exactos;
- congelar una única instrucción común de productor.

## VACÍOS / OMISIONES

Antes de ejecutar faltaba:

- artefacto exacto de condición CONTROL;
- artefacto exacto de condición TREATMENT;
- instrucción exacta común del productor;
- hashes de esos artefactos;
- procedimiento de auditoría ciega materializado.

No se detectó necesidad de modificar ASC v0.1 ni `tools/asc/compile_asc.mjs`.

## REDUNDANCIAS

C4 y C5 siguen siendo útiles como sentinelas secundarios y no duplican el objetivo primario si permanecen fuera del veredicto principal.

El vocabulario de estados aparece en ambas condiciones de forma intencional; esa repetición es necesaria para aislar el binding y no constituye redundancia problemática.

## Decisión

```text
DESIGN V1:
PARTIAL / REVISE

SOURCE FREEZE:
PASS

PRIMARY / SECONDARY CLAIM SEPARATION:
PASS

OPERATIONAL RUBRIC:
PASS

POSITIONAL MAPPING LEAK:
FAIL

EXACT EXECUTION PACKAGES:
MISSING

ASC v0.1 CHANGE:
NO

NEXT:
MATERIALIZE DESIGN V2
THEN VALIDATE V2
```
