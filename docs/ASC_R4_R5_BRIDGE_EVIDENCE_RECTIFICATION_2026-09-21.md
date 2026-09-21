# ASC — Rectificación de evidencia del registro puente R4/R5

**Fecha:** 2026-09-21  
**Tipo:** registro documental de rectificación  
**Estado:** MATERIALIZADO / PENDIENTE DE MERGE  
**Ámbito:** `docs/REGISTRO_PUENTE_ASC_R4_R5_2026-09-19.md`  
**Naturaleza:** no normativa; no modifica ASC v0.1, R4 ni R5

## 1. Motivo

El registro puente R4/R5 fue creado originalmente a partir de memoria importada y clasificaba globalmente su contenido como `DECLARED`.

Durante la revisión del 2026-09-21 se verificaron directamente en el repositorio los dos documentos y commits principales citados por ese registro:

- `docs/ASC_R4_PROVENANCE_PRESERVATION_CONTRAST_2026-09-19.md`
  - commit: `3b558f5fb8add9fbc8b310cc85b848bde49d0eae`
- `docs/CIERRE_JORNADA_2026-09-19_ASC_R4_REPLICA_R5.md`
  - commit: `b025721f36518ff5168470e91479008e0dd525a3`

Por tanto, mantener todo el puente bajo un único estatus `DECLARED` había quedado documentalmente obsoleto.

## 2. Corrección aplicada

Se rectificó el registro puente para distinguir el estatus de evidencia por elemento:

```text
VERIFIED DIRECTLY
→ documentos y commits R4 / cierre R4-R5 verificados en el repositorio

VERIFIED AS DOCUMENTED
→ hechos que esos documentos registran explícitamente

NOT DIRECTLY VERIFIED / LOCATION OPEN
→ artefactos crudos experimentales enumerados por los documentos,
  pero no localizados como archivos individuales en el árbol actual de main

DECLARED
→ restantes antecedentes históricos provenientes de memoria importada
  que no cuentan todavía con verificación específica
```

No se introdujo `MIXED` como estado normativo de ASC. La rectificación usa clasificación documental por elemento.

## 3. Elementos que permanecen OPEN

La verificación documental no resolvió la ubicación de los artefactos crudos asociados a R4/R5, entre ellos:

- prompt exacto de la réplica inter-agente;
- referencia visual exacta;
- output textual íntegro;
- auditoría íntegra del output;
- ficha visual generada;
- auditoría íntegra de la ficha.

Su estado permanece:

```text
LOCATION: OPEN
NOT LOCATED IN CURRENT MAIN TREE
```

Esto no equivale a declarar que los artefactos no existen, están perdidos o nunca fueron preservados.

También permanece `OPEN` si `tools/asc/compile_asc.mjs` fue el mismo mecanismo que produjo los artefactos de esta rama experimental.

## 4. Alcance de la rectificación

La corrección:

- actualiza trazabilidad documental;
- evita sobreclasificar evidencia histórica;
- preserva la diferencia entre documento verificado y artefacto crudo no verificado;
- mantiene intactos los estados experimentales previamente registrados.

La corrección no:

- reabre R4;
- ejecuta R5;
- valida `CLAIM` como unidad epistemológica normativa;
- promueve `Precision Provenance`, `Visual Authority Amplification` o `Epistemic Authority Preservation` a reglas ASC;
- modifica `ASC v0.1`;
- modifica `tools/asc/compile_asc.mjs`;
- introduce arquitectura nueva.

## 5. Estado de R4 y R5 después de la rectificación

```text
R4:
VALIDATED / CLOSED

R4 CONTRAST:
VERIFIED AS DOCUMENTED

R4 RAW ARTIFACT LOCATION:
OPEN

R5:
PROPOSED / NOT EXECUTED

R5 DESIGN:
NOT YET CLOSED

ASC v0.1:
UNCHANGED
```

## 6. Materialización

La rectificación fue materializada en la rama:

`docs/update-r4-r5-bridge-evidence`

Commit inicial de la corrección:

`6761a06e16038f8b62390e73967896c98cd51cf1`

Pull request:

`#50 — Docs: rectify ASC R4/R5 bridge evidence status`

El PR permanece abierto al momento de este registro.

## 7. Próximo gate

Una vez validada la rectificación documental, el trabajo experimental puede volver al diseño de R5.

Punto de entrada:

> diseñar R5 como experimento nuevo derivado del residuo documentado de R4, sin presentarlo como reproducción estricta de R4 y sin promover etiquetas experimentales a vocabulario normativo.

---

```text
RECTIFICATION:
MATERIALIZED

DOCUMENTARY CONSISTENCY:
RESTORED AT BRANCH LEVEL

R4:
UNCHANGED

R5:
UNCHANGED

NEW ASC RULES:
NONE

NEXT:
AUDIT RECTIFICATION
THEN RETURN TO R5 DESIGN
```
