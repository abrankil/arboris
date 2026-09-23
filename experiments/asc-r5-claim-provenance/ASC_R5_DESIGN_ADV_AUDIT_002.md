# ASC — Auditoría adversarial del diseño R5 v2

**ID:** ASC-R5-DESIGN-ADV-002  
**Fecha:** 2026-09-22  
**Objeto:** `ASC_R5_CLAIM_LEVEL_PROVENANCE_DESIGN_002.md` + paquetes congelados v2  
**Resultado:** PARTIAL / REVISE  
**Naturaleza:** auditoría interna adversarial, no independiente

## AUDITORÍA

v2 corrigió la fuga posicional del vocabulario, congeló la fuente, congeló la instrucción del productor, materializó paquetes exactos y una rúbrica de auditoría ciega.

La fuente y los hashes declarados para source/instruction/control/treatment fueron verificados contra el contenido materializado.

## INCONSISTENCIAS

Se detectó un confound nuevo en los paquetes exactos:

```text
CONDITION: CONTROL
CONDITION: TREATMENT
```

Esas etiquetas son visibles para el productor y comunican cuál paquete es el tratamiento. Por tanto, además del binding explícito cambia una señal semántica adicional que puede alterar el comportamiento del productor.

Esto contradice la afirmación de que `EXPLICIT_CLAIM_STATUS_BINDING` es la única variable material.

## VACÍOS / OMISIONES

Falta un protocolo explícito que establezca qué artefactos puede ver el productor y cuáles deben permanecer ocultos durante la ejecución.

Para conservar el aislamiento, el productor debe recibir solamente:

- la fuente congelada;
- la instrucción común;
- el contenido de un paquete neutral.

No debe recibir:

- la designación CONTROL/TREATMENT;
- el manifest que revela la asignación;
- la rúbrica de auditoría;
- el resultado esperado.

## REDUNDANCIAS

Los paquetes CONTROL/TREATMENT v2 deben conservarse históricamente porque documentan el defecto detectado. No deben reutilizarse para ejecución.

## Decisión

```text
DESIGN V2:
PARTIAL / REVISE

POSITIONAL LEAK:
RESOLVED

CONDITION-LABEL LEAK:
FAIL

EXECUTION VISIBILITY CONTRACT:
MISSING

NEXT:
DESIGN V3 WITH NEUTRAL PRODUCER-FACING PACKAGES
```
