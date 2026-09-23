# MAP-001 — E5.2 Repair Run-Context Transaction Candidate 001

**Fecha:** 2026-09-23  
**Ámbito:** E5.2 — integración del repair gate con contexto completo de run-state  
**Estado:** `REVISED_CANDIDATE / EXTERNAL_VALIDATION_PENDING`  
**Baseline:** `main@f53eaf883bae8a36dbf22b69557a917571d95273`  
**Precondición:** E5.1 cerrado; Run State R5 + Semantic Contract R3 vigentes.

## 1. Objetivo

Cerrar dos vacíos explícitamente dejados por E5.1:

```text
pertenencia del validation-report al run-state persistido
unicidad global de proposalId / repairId dentro de la corrida
```

y preparar una snapshot candidata que represente, en una sola construcción in-memory:

```text
parent iteration + repair binding
+
child proposal iteration
+
candidateHistory child
```

sin afirmar persistencia durable.

## 2. Implementación

Se agrega:

```text
tools/proposal-resolution/map001_repair_transaction_candidate_r1.mjs
tools/proposal-resolution/map001_repair_transaction_candidate_r1.test.mjs
```

La función principal es:

```text
buildMap001RepairTransactionCandidate
```

## 3. Precondiciones de run-state

Antes de aceptar un repair:

```text
Run State R5 schema                       PASS
current parent proposal binding           EXACT MATCH
current validation-report binding         EXACT MATCH
candidateHistory current hash             EXACT MATCH
run baseline == parent baseline            EXACT MATCH
run validator == report validator          EXACT MATCH
historical proposalIds                     UNIQUE
historical repairIds                       UNIQUE
execution pins                             VERIFIED
persisted run.state == derived state       EXACT MATCH
current iteration repair                   null
derived reducer state                      READY_TO_REPAIR
```

El report suministrado debe ser exactamente el report enlazado por la iteración actual.

## 4. Unicidad global

Antes de construir el child:

```text
childProposalId
→ no puede existir en ningún iteration.proposal.proposalId

repairId
→ no puede existir en ningún iteration.repair.repairId
```

E5.2 no asigna IDs automáticamente; valida que los IDs propuestos sean frescos dentro de la corrida.

## 5. Repair gate

Solo después de validar contexto de corrida se invoca E5.1:

```text
executeMap001RepairGate
```

Por tanto E5.2 hereda:

```text
Repair R1 schema
report provenance
AUTO_REPAIR scopes
patch semantics
child proposal construction
child lineage
child reconstruction
```

## 6. Snapshot candidata

E5.2 construye una copia del run-state con:

```text
parent.iteration.repair = repair binding
child iteration         = immediate next iteration
child.validationReport  = null
child.repair            = null
candidateHistory        += child candidate hash
```

Luego el reducer E4.2 recalcula el estado.

Resultado esperado normal:

```text
READY_TO_REPAIR
→ repair + child candidate snapshot
→ READY_TO_VALIDATE
```

Si el child repite un candidate hash anterior, el reducer puede producir:

```text
CYCLE_DETECTED
```

u otro estado de mayor precedencia. E5.2 no fuerza `READY_TO_VALIDATE`.

## 7. No persistencia

La salida declara explícitamente:

```text
transactionStatus = CANDIDATE_NOT_PERSISTED
persistencePerformed = false
```

Por tanto:

```text
proposedRunSnapshot
≠ durable run-state
```

E5.2 demuestra una transición atómica candidata en memoria, no una transacción durable.

## 8. Pruebas

La suite cubre:

```text
READY_TO_REPAIR
→ repair
→ child proposal
→ proposed run snapshot
→ READY_TO_VALIDATE

report no perteneciente a current run binding
→ REJECT

child proposalId reutilizado
→ REJECT

repairId reutilizado
→ REJECT

run no derivado READY_TO_REPAIR
→ REJECT

persisted run.state distinto del derivado
→ REJECT

run/report validator mismatch
→ REJECT

run/parent baseline mismatch
→ REJECT

historial con IDs duplicados
→ REJECT

execution pin drift
→ REJECT
```

También se verifica que el run original no sea mutado.

## 9. AUDITORÍA

La primera ejecución externa de E5.2 pasó, pero la revisión estricta posterior detectó brechas adicionales de integración que el PASS inicial no cubría:

```text
B1  run.state persistido podía no coincidir con el estado realmente derivado
B2  run.control.baseline no se comparaba explícitamente con parentProposal.control.baseline
B3  run.control.validatorBinding no se comparaba explícitamente con report.control.validatorBinding
B4  la unicidad se comprobaba solo para los IDs nuevos, no la integridad histórica ya persistida
B5  E5.2 no verificaba execution pins antes de construir la snapshot candidata
B6  exactBinding dependía de JSON.stringify y por tanto del orden de claves
```

Todos estos puntos fueron corregidos antes de considerar cierre.

E5.2 añade contexto de corrida alrededor de E5.1 sin trasladar autoridad al repair ni al futuro agente.

La secuencia queda:

```text
run-state
→ membership / uniqueness checks
→ E5.1 deterministic repair gate
→ candidate atomic snapshot
→ reducer
```

El agente futuro seguirá sin escribir run-state ni decidir transición.

## 10. INCONSISTENCIAS

La revisión estricta encontró una tensión entre “estado persistido” y “estado derivado”: no basta con que la historia produzca `READY_TO_REPAIR`; el `run.state` almacenado también debe coincidir exactamente con ese resultado. Se añadió esta igualdad como precondición fail-closed.

No se detecta necesidad de cambiar Run State R5 ni Semantic Contract R3 para demostrar esta subetapa.

La atomicidad declarada por Semantic R3 sigue siendo una regla de persistencia durable. E5.2 solo construye el snapshot que una capa de persistencia futura deberá comprometer en una única frontera durable.

## 11. VACÍOS / OMISIONES

Quedan fuera de E5.2:

```text
durable persistence
write-ahead / journal
crash recovery
compare-and-swap / concurrent writer control
pin explícito de E5.1/E5.2 como dependencias del futuro entrypoint operativo
repair agent
agent sandbox
automatic retry
full loop
```

La persistencia real debe resolverse antes de declarar cerrada la atomicidad operacional.

## 12. REDUNDANCIAS

E5.2 no reimplementa el repair gate ni el reducer:

```text
E5.1
→ valida/aplica repair

E5.2
→ valida contexto de corrida y compone snapshot

E4.2
→ deriva estado resultante
```

ASC permanece fuera de esta decisión.
