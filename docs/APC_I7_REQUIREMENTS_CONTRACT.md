# Árboris — APC I7 Requirements Contract

**ID:** `ARBORIS_APC_I7_REQUIREMENTS_CONTRACT_R2`  
**Estado:** VALIDATED WITH ASC, FROZEN para implementación técnica.  
**Ámbito:** Hito 16 / APC I7.  
**Base canónica de implementación:** `main@1ef5601a906fa0c5bd60747a3695f5ba073f38ec`.  
**No autoriza:** merge a `main`, avance de Gate B ni cierre de Hito 16.

## 1. Objetivo

I7 define requisitos explícitos de observación dentro de APC.

Un requirement expresa que un carácter debe quedar cubierto dentro de un alcance concreto. No constituye evidencia, no implica criticidad y no se infiere automáticamente por existir el carácter en Master.

## 2. Forma canónica

Cada entrada de `requirements[]` requiere:

```text
requirementId
scopeLevel
scopeRef
characterId
required
reason
createdBy
```

Valores:

```text
scopeLevel = PHOTO | INDIVIDUAL | SESSION
required = true
reason = MANUAL | SESSION_OBJECTIVE | H16_VERIFICATION
```

`required=false` es inválido dentro de `requirements[]`.

## 3. Resolución de scopeRef

```text
PHOTO      → scopeRef debe resolver a photoId
INDIVIDUAL → scopeRef debe resolver a individualId
SESSION    → scopeRef debe ser sessionId
```

## 4. Autoría

`createdBy` es obligatorio, canónico y no vacío.

## 5. Unicidad semántica

No pueden coexistir dos requirements con la misma clave:

```text
(scopeLevel, scopeRef, characterId, reason, createdBy)
```

`requirementId` sigue siendo el identificador técnico único del registro.

## 6. Validación de characterId

La validación se divide en dos capas:

```text
APC interno
→ presencia y forma estructural

dataset externo
→ existencia real del characterId
```

APC no hardcodea IDs de caracteres.

## 7. Separación de conceptos

```text
requirement ≠ evidence
requirement ≠ pending
requirement ≠ critical
```

La existencia de un requirement no crea por sí sola una evidencia ni determina automáticamente si el incumplimiento bloquea una sesión.

## 8. Fuera de alcance

```text
I8 pending / representation_gap
I9 contradictions
I10 PASS / export
I11 E2E Gate B
I12 UI
```

## 9. Criterio de cierre

I7 puede cerrarse cuando:

- la forma y alcance de requirements estén implementados;
- la unicidad semántica esté validada;
- la resolución de scopeRef esté validada;
- exista validación externa de characterId sin hardcodear IDs;
- la suite I7 pase;
- regresiones I1–I6 permanezcan verdes;
- `npm test` pase;
- la auditoría del diff no encuentre blockers;
- el cambio se integre mediante PR aprobado.

## 10. AUDITORÍA

I7 introduce requisitos explícitos sin convertirlos en evidencia, pending ni criticidad.

## 11. INCONSISTENCIAS

La base integrada hasta I6 contiene `requirements[]` sólo como array estructural, sin semántica propia. I7 cierra esa brecha.

## 12. VACÍOS / OMISIONES

La satisfacción de requirements y su relación operacional con pending se completa en I8. PASS/export permanece en I10.

## 13. REDUNDANCIAS

`requirementId` identifica el registro; la clave semántica evita duplicados lógicos. No deben introducirse índices persistidos paralelos como segunda fuente de verdad.
