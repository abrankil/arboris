# Árboris — APC I6 Revision Contract

**ID:** `ARBORIS_APC_I6_REVISION_CONTRACT_R2.1`  
**Estado:** VALIDATED WITH ASC para implementación técnica.  
**Ámbito:** Hito 16 / APC I6.  
**Base canónica de implementación:** `main@9e6ccfa2b51cb046c7fcdc9556e9b0ac042ce709`.  
**No autoriza:** merge a `main`, avance de Gate B ni cierre de Hito 16.

## 1. Objetivo

I6 define versionado no destructivo de `APC_EVIDENCE`.

```text
evidenceId
→ identidad lógica estable

revision
→ versión concreta

current
→ versión vigente

revisions[]
→ historial de transiciones
```

Una corrección crea una nueva revisión de la misma evidencia lógica. Las versiones anteriores permanecen trazables.

## 2. Binding de identidad

Todas las revisiones de un mismo `evidenceId` deben conservar exactamente:

```text
sessionId
photoId
photoEvidenceRef
individualId
characterId
```

Si cambia cualquiera de esos campos, corresponde un nuevo `evidenceId`.

Pueden cambiar entre revisiones campos de contenido como `evidenceStatus`, `observedState`, `lifecycleStatus`, fuente, confirmación, adquisición, confianza, motivo y notas.

## 3. Cadena de revisiones

Para cada `evidenceId`:

```text
revision = 1..N
sin huecos
exactamente un current=true
current=true corresponde a max(revision)
todas las revisiones anteriores current=false
```

`current` debe ser booleano explícito.

## 4. Canonicalización textual

Los identificadores gobernados por I6 deben ser strings no vacíos y no pueden contener whitespace inicial o final.

No se permite normalización silenciosa de identificadores.

## 5. Revision events

Para una evidencia con `N` revisiones deben existir exactamente `N-1` eventos de revisión.

Cada evento requiere:

```text
revisionEventId
entityType = EVIDENCE
entityId
fromRevision
toRevision
changedAt
changedBy
reason
```

Reglas:

```text
entityId = evidenceId
toRevision = fromRevision + 1
changedAt = ISO-8601 válido
cada transición adyacente 1→2, 2→3, ... existe exactamente una vez
no existen eventos para evidencias desconocidas
```

Para una sola revisión no debe existir evento.

No se inventan eventos para completar historia importada incompleta: una cadena incompleta es inválida.

## 6. Handoff

Sólo la revisión vigente puede llegar al handoff:

```text
current=true
→ elegible si cumple además lifecycle/provenance

current=false
→ no elegible
```

Las revisiones históricas permanecen en APC pero no pasan a CharacterObservation/ACE.

## 7. Fuera de alcance

```text
I7 requirements
I8 pending / representation_gap
I9 contradictions
I10 PASS / export
I11 E2E Gate B
I12 UI
```

## 8. Criterio de cierre

I6 puede cerrarse cuando:

- las invariantes anteriores estén implementadas;
- la suite I6 pase;
- las regresiones I1–I5 sigan verdes;
- `test:character-observers` pase;
- `test:canonical-identification` pase;
- `test:apc` pase;
- `npm test` pase;
- la auditoría ASC del diff no encuentre blockers;
- el cambio se integre mediante PR aprobado.

## 9. AUDITORÍA

El contrato añade historia no destructiva y selección de revisión vigente. No modifica significado botánico, identidad biológica ni reglas de ACE.

## 10. INCONSISTENCIAS

La base I5 ya acepta `revision` y `current`, pero sólo garantiza unicidad de `(evidenceId, revision)`; I6 completa la semántica de cadena, vigencia e historial.

## 11. VACÍOS / OMISIONES

Requirements, pending, contradictions, PASS/export y UI permanecen expresamente fuera del alcance de I6.

## 12. REDUNDANCIAS

`evidence[].current` es la fuente de verdad de vigencia. `revisions[]` registra transiciones y no duplica el contenido completo de cada revisión.
