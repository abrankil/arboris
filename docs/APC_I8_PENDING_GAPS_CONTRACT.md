# Árboris — APC I8 Pending and Representation Gaps Contract

**ID:** `ARBORIS_APC_I8_PENDING_GAPS_CONTRACT_R3.1`  
**Estado:** VALIDATED WITH ASC, FROZEN para implementación técnica.  
**Ámbito:** Hito 16 / APC I8.  
**Base canónica de implementación:** `main@1ef5601a906fa0c5bd60747a3695f5ba073f38ec`.  
**No autoriza:** merge a `main`, avance de Gate B ni cierre de Hito 16.

## 1. Objetivo

I8 define pendientes operacionales y vacíos de representación sin convertir ausencia de evidencia en una conclusión botánica.

```text
kind = UNRESOLVED_REQUIREMENT | REPRESENTATION_GAP
status = OPEN | RESOLVED
```

## 2. Satisfacción de requirements

La satisfacción es existencial y se evalúa con evidencia vigente compatible.

### PHOTO

Se satisface si existe evidencia calificante asociada a esa foto y a un individuo válido declarado por ella.

### INDIVIDUAL

Se satisface si existe evidencia calificante para ese individuo.

### SESSION

Se satisface si existe evidencia calificante en cualquier punto válido de la sesión.

La evidencia calificante debe ser:

```text
current=true
lifecycleStatus=CONFIRMED
evidenceStatus=OBSERVED
characterId compatible
scope compatible
```

## 3. UNRESOLVED_REQUIREMENT

Requiere:

```text
originRequirementId
kind = UNRESOLVED_REQUIREMENT
status
critical
scopeLevel
scopeRef
characterId
```

`originRequirementId` es obligatorio y debe resolver a un requirement compatible.

Un requirement insatisfecho puede originar pending; uno satisfecho no debe mantener un pending OPEN de este tipo.

## 4. REPRESENTATION_GAP

Sólo puede existir en:

```text
INDIVIDUAL
SESSION
```

No existe `REPRESENTATION_GAP` a nivel PHOTO. Un problema de observabilidad de una foto se expresa mediante evidencia `NOT_OBSERVABLE`.

Campos semánticos:

```text
representationTarget = CHARACTER | STATE
targetState
```

Reglas:

```text
CHARACTER → targetState ausente
STATE     → targetState obligatorio
```

`originRequirementId` es opcional para representation gaps y, si existe, debe ser compatible.

## 5. Resolution evidence refs

La resolución puede registrar referencias versionadas:

```text
{ evidenceId, revision }
```

En el momento de transición a RESOLVED, cada referencia usada para resolver debe apuntar a evidencia:

```text
current=true
CONFIRMED
OBSERVED
character compatible
scope compatible
```

Una vez resuelto, la referencia histórica no necesita seguir siendo `current`.

## 6. Critical

`critical` es obligatorio y explícito.

Nunca se infiere automáticamente desde:

```text
required
representationTarget
scope
characterId
```

## 7. Propagation

Un pending no se clona por nivel.

La propagación se representa en el mismo registro mediante:

```text
propagation = [
  { level, ref }
]
```

La propagación es sólo ascendente.

## 8. Episodios y recurrencia

Un pending es un episodio inmutable.

```text
RESOLVED
→ terminal para ese pendingId

recurrencia
→ nuevo pendingId
→ previousPendingId = predecesor directo
```

Series semánticas:

```text
UNRESOLVED_REQUIREMENT
→ originRequirementId

REPRESENTATION_GAP
→ (sourceLevel, sourceRef, characterId, representationTarget, targetState)
```

Reglas de cadena:

```text
una sola raíz
sin ciclos
sin forks
sin saltos
previousPendingId obligatorio en recurrencia
previous debe estar RESOLVED
misma serie semántica
máximo un OPEN por serie
OPEN sólo puede ser la cola
```

## 9. Snapshot vs transición

### Snapshot

Puede verificarse:

- forma;
- referencias;
- compatibilidad de scope;
- unicidad de OPEN por serie;
- cadena de recurrencia;
- requisito satisfecho vs pending OPEN actual;
- consistencia histórica estructural.

### Transición

Debe verificarse en el momento del cambio:

- que la evidencia de resolución era current/CONFIRMED/OBSERVED;
- que el pending previo estaba RESOLVED antes de una recurrencia;
- que no se creó fork o salto;
- que la transición preservó la serie.

No se reconstruyen retroactivamente condiciones históricas que dependían del estado del momento.

## 10. Regla de estado actual

Para `UNRESOLVED_REQUIREMENT`:

```text
OPEN
→ sólo válido si actualmente no existe evidencia calificante

RESOLVED
→ hecho histórico; no exige que el requirement siga satisfecho hoy
```

Si el problema reaparece después de una resolución, se crea un nuevo episodio mediante recurrencia.

## 11. Fuera de alcance

```text
I9 contradictions
I10 PASS / export
I11 E2E Gate B
I12 UI
```

## 12. Criterio de cierre

I8 puede cerrarse cuando:

- pending kinds/status estén implementados;
- satisfacción por scope esté implementada;
- representation gaps estén separados de NOT_OBSERVABLE;
- resolución versionada esté validada;
- critical sea explícito;
- propagation y recurrence estén implementados;
- snapshot y transition rules estén separados;
- la suite I8 pase;
- regresiones I1–I7 permanezcan verdes;
- `npm test` pase;
- la auditoría del diff no encuentre blockers;
- el cambio se integre mediante PR aprobado.

## 13. AUDITORÍA

I8 preserva la diferencia entre evidencia observada, requisito pendiente y ausencia de representación. No convierte falta de observación en ausencia botánica.

## 14. INCONSISTENCIAS

La base integrada hasta I6 contiene `pending[]` sólo como array estructural. I8 define su semántica y su relación con I7.

## 15. VACÍOS / OMISIONES

La relación de pending con PASS/export queda fuera de alcance y se resuelve en I10. Las contradicciones quedan en I9.

## 16. REDUNDANCIAS

La propagación no crea copias por nivel y la recurrencia no reabre registros RESOLVED. Esto evita duplicar episodios y fuentes de estado.
