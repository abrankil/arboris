# Árboris — APC I10 PASS / Export Contract

**ID:** `ARBORIS_APC_I10_PASS_EXPORT_CONTRACT_R3.2`  
**Estado:** VALIDATED WITH ASC, FROZEN para implementación técnica.  
**Ámbito:** Hito 16 / APC I10.  
**Base canónica de implementación:** `main@6e268a472817af7e1b4496c2b8d0a91f815febd2`.  
**No autoriza:** merge a `main`, avance a I11, Gate B ni cierre de Hito 16.

## 1. Separación de estados

I10 distingue tres conceptos:

```text
session.status
→ lifecycle

EXPORTABLE
→ integridad persistible del snapshot

PASS
→ cumplimiento actual de gates operacionales
```

Invariantes:

```text
EXPORTABLE ≠ PASS
PASS ≠ CLOSED
EXPORT ≠ ACE handoff
```

`pass` y `exportable` son resultados derivados y no se persisten en la sesión.

## 2. Export

El export preserva íntegramente:

```text
schemaVersion
sessionId
semanticRevision
status
objective
objectiveAssessment
createdAt
createdBy
inboxPhotoRefs[]
photos[]
photoEvidence[]
individuals[]
evidence[]
requirements[]
pending[]
contradictions[]
revisions[]
```

Incluye DRAFT e historia. El nombre conceptual es:

```text
<sessionId>.apc.json
```

Exportar no significa PASS, cierre, handoff ACE ni validación botánica.

## 3. EXPORTABLE

`EXPORTABLE(session)` requiere:

- integridad estructural e histórica del snapshot;
- integridad I6–I9 aplicable al snapshot;
- trazabilidad de evidencia;
- cobertura coherente requirement↔pending;
- `semanticRevision` válido;
- binding vigente de `objectiveAssessment`.

El export validator aplica sólo reglas demostrables desde el snapshot actual. No reconstruye guards históricos de I8/I9 ni historial de increments semánticos.

## 4. Cobertura requirement ↔ pending

Para cada requirement activo:

```text
unsatisfied
→ exactamente un OPEN UNRESOLVED_REQUIREMENT

satisfied
→ cero OPEN UNRESOLVED_REQUIREMENT
```

Historial RESOLVED puede coexistir.

`required ≠ critical`. Un requirement insatisfecho correctamente representado por un pending OPEN `critical=false` no bloquea PASS por sí solo.

## 5. PASS

```text
PASS(session)
iff

EXPORTABLE(session)
AND objectiveAssessment.status = SATISFIED
AND count(pending where status=OPEN AND critical=true) = 0
```

PASS no requiere `session.status=CLOSED`.

No bloquean PASS por sí solos:

- OPEN pending no crítico;
- OPEN contradiction;
- RESOLVED contradiction;
- UNCERTAIN;
- NOT_OBSERVABLE;
- DRAFT;
- inboxPhotoRefs;
- representation gap no crítico.

Un `REPRESENTATION_GAP OPEN critical=true` usa el gate general de pending y sí bloquea PASS.

## 6. semanticRevision

`session.semanticRevision` versiona exclusivamente el assessment substrate y debe ser un integer >= 1.

El substrate incluye materialmente:

- objective;
- estado operacional de evidencia;
- requirements y su satisfacción;
- estado operacional de pending y criticality;
- contradictions cuando sean materialmente relevantes a la evaluación.

No incluye por sí solo:

- objectiveAssessment;
- PASS;
- EXPORTABLE;
- session.status;
- serialización técnica;
- metadata no semántica.

Una semantic transaction incrementa `semanticRevision` exactamente en 1, aunque modifique varias entidades relacionadas.

## 7. objectiveAssessment binding

Para `status=OPEN`:

```text
assessedRevision = null
assessedBy = null
assessedAt = null
```

Para `SATISFIED | NOT_SATISFIED`:

```text
assessedRevision = semanticRevision
assessedBy obligatorio
assessedAt obligatorio
```

Un mismatch produce `ASSESSMENT_STALE`, vuelve el snapshot NOT_EXPORTABLE y fuerza PASS=false.

Evaluar OPEN→SATISFIED o OPEN→NOT_SATISFIED no incrementa `semanticRevision`.

## 8. Semantic transition

Si cambia materialmente el assessment substrate:

```text
semanticRevision N → N+1
objectiveAssessment → OPEN
assessedRevision → null
assessedBy → null
assessedAt → null
```

El reset ocurre en la misma transición y no agrega un segundo increment.

Si no cambia el substrate:

```text
semanticRevision debe permanecer igual
```

Por tanto un cambio aislado `session.status OPEN→CLOSED` no incrementa la revisión semántica.

## 9. Resultados derivados

`validateApcSessionForExport()` devuelve un resultado auditable de exportabilidad.

`assessApcSessionPass()` devuelve conceptualmente:

```json
{
  "pass": false,
  "reasons": []
}
```

Las razones son deterministas y no persistidas. Categorías congeladas:

```text
NOT_EXPORTABLE
OBJECTIVE_NOT_SATISFIED
CRITICAL_PENDING_OPEN
ASSESSMENT_STALE
```

## 10. Fuera de alcance

```text
I11 E2E APC→H16→ACE
I12 UI
Gate B final
```

## 11. Criterio de cierre

I10 puede cerrarse cuando:

- EXPORTABLE y PASS estén implementados como derivados;
- coverage requirement↔pending sea obligatorio para export;
- semanticRevision y assessedRevision estén validados;
- semantic transition aplique +1 exacto y reset atómico;
- export preserve DRAFT e históricos;
- PASS use exclusivamente exportabilidad + SATISFIED vigente + cero critical OPEN;
- las regresiones I10 pasen;
- I1–I9 permanezcan verdes;
- `npm test` pase;
- la auditoría del diff no encuentre blockers;
- el cambio se integre mediante PR aprobado.

### AUDITORÍA

El contrato separa lifecycle, exportabilidad y PASS; mantiene snapshot-time separado de transition-time y evita persistir resultados derivados.

### INCONSISTENCIAS

No quedan inconsistencias contractuales bloqueantes conocidas en R3.2.

### VACÍOS / OMISIONES

La clasificación técnica concreta del assessment substrate se implementa en I10. I11 E2E e I12 UI quedan fuera de alcance.

### REDUNDANCIAS

No se persisten `pass`, `exportable`, historiales paralelos de semanticRevision ni contadores derivados.
