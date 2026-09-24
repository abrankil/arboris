# Árboris — Auditoría ASC de preparación de rama Species Ecology Schema v3

**Estado:** pre-PR / bloqueada por sincronización con main  
**Gate:** SPECIES-ECOLOGY-SCHEMA-V3-BRANCH-INTEGRATION-AUDIT-001  
**Fecha:** 24 septiembre 2026  
**Rama:** `feat/species-ecology-schema-v3`

## 1. Base auditada

La implementación técnica validada está fijada en:

```text
a403632ae7561b9a0ede1b3bdb3820796e931b2e
```

## 2. Comparación con main

La comparación posterior mostró:

```text
branch status = diverged
ahead_by = 33
behind_by = 1
```

El commit nuevo de `main` identificado es:

```text
c5d2de3c24be4aed11e89ccae4a198f4b4b6fe0d
R17 I1: implement bounded observability handoff
```

## 3. Superficie del commit nuevo de main

El commit nuevo afecta la línea MAP001 / repair-agent:

- workflow MAP001;
- documentación de repair-agent;
- implementación de observability handoff;
- tests correspondientes.

No se observó en ese commit modificación de:

- Master botánico XLSX;
- `data/botanical/*`;
- `data/species/*`;
- `config/botanical/controlled_vocabularies.json`;
- herramientas de `tools/botanical-data/`;
- contrato Species Ecology v3.

## 4. Clasificación ASC

La divergencia es real aunque, por superficie observada, no existe solapamiento material directo con Species Ecology v3.

Por tanto:

```text
DIRECT FILE OVERLAP WITH NEW MAIN COMMIT: NOT DETECTED
SEMANTIC CONFLICT: NOT DEMONSTRATED
BRANCH SYNCHRONIZATION: REQUIRED
POST-SYNC TEST EXECUTION: REQUIRED
```

La ausencia de solapamiento no autoriza inferir que la integración sea inocua sin ejecutar la suite sobre el estado sincronizado.

## 5. Siguiente gate

Debe actualizarse la rama desde `main` preservando el commit técnico validado.

Después deben ejecutarse nuevamente:

```text
npm run build:botanical
npm run verify:botanical
npm run verify:data-access
npm test
```

y revisarse el diff final contra `main`.

## 6. Restricciones

No:

- reescribir la implementación validada sin causa;
- poblar ecología;
- modificar ACE por esta tarea;
- resolver conflictos silenciosamente;
- hacer merge del PR antes de la auditoría post-sync.

Si la sincronización produce conflicto material, detenerse y abrir diagnóstico ASC.

## 7. Gate

```text
TECHNICAL IMPLEMENTATION: VALIDATED
BRANCH CURRENT WITH MAIN: FAIL / BEHIND 1
DIRECT OVERLAP WITH NEW MAIN CHANGE: NOT DETECTED
PRE-PR READINESS: BLOCKED ON SYNC + RE-EXECUTION
MERGE: NOT AUTHORIZED
```
