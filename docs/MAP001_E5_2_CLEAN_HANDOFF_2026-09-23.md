# MAP-001 — Handoff limpio después de E5.2

**Fecha:** 2026-09-23  
**Estado de trabajo:** listo para continuar en una ventana limpia  
**PR activo:** #74 — `E5.2: bind repairs to MAP-001 run context`  
**Rama:** `e5-2-repair-run-context`  
**Head documentado:** `607adc5659b8d6383a9b067f11f5043fecef3f82`

## 1. Estado consolidado

```text
E4.1  CLOSED / PASS
E4.2  CLOSED / PASS
E4.3  CLOSED / PASS
E5.1  CLOSED / PASS
E5.2  TECHNICAL_PASS / HUMAN_APPROVAL_PENDING
```

E5.2 todavía no debe declararse cerrado hasta aprobación humana explícita y revalidación del commit documental final.

## 2. Qué resuelve E5.2

E5.2 toma un run en `READY_TO_REPAIR` y exige:

```text
current parent proposal binding         exacto
current validation-report binding       exacto
candidateHistory current hash           exacto
run baseline == parent baseline         exacto
run validator == report validator       exacto
historical proposalIds                  únicos
historical repairIds                    únicos
execution pins                          válidos
persisted run.state == derived state    exacto
repairId nuevo                          único en run
childProposalId nuevo                   único en run
```

Luego delega el repair a E5.1, construye una snapshot candidata in-memory:

```text
parent repair binding
+ immediate child iteration
+ child candidateHistory
```

y vuelve a derivar estado con E4.2.

Salida explícita:

```text
transactionStatus = CANDIDATE_NOT_PERSISTED
persistencePerformed = false
```

## 3. Hallazgos corregidos durante auditoría estricta

```text
B1 persisted run.state podía diferir del derivado
B2 run baseline no se comparaba explícitamente con parent baseline
B3 run validator no se comparaba explícitamente con report validator
B4 unicidad solo verificaba IDs nuevos, no integridad histórica
B5 faltaba verificar execution pins en E5.2
B6 exactBinding dependía del orden de claves
```

Todos quedaron corregidos antes del technical pass.

## 4. Evidencia técnica

Sobre el head funcional previo a documentación:

```text
a1adfdf6480a567ae65d5dea3b71032db67efa03
```

pasaron:

```text
CI                                   PASS
MAP-001 Proposal Validation Gate     PASS
Audit Protocol Check #242            PASS
Run State R5 + Semantic Contract R3  PASS
E4.2 regression                      PASS
E4.3 regression                      PASS
E5.1 regression                      PASS
E5.2 tests                           PASS
```

El commit documental posterior `607adc5659b8d6383a9b067f11f5043fecef3f82` debe revalidarse antes de cierre/merge.

## 5. Artefactos E5.2

```text
tools/proposal-resolution/map001_repair_transaction_candidate_r1.mjs
tools/proposal-resolution/map001_repair_transaction_candidate_r1.test.mjs
docs/MAP001_E5_2_REPAIR_RUN_CONTEXT_001.md
.github/workflows/map001-proposal-validation.yml
```

## 6. Frontera ASC

ASC permanece compile-only y fuera del resolver cíclico.

```text
resolver/orchestrator
→ controla corrida y transiciones

domain validator
→ decide conformidad

repair gate
→ autoriza/aplica patch

ASC
→ no valida dominio
→ no cierra OPEN
→ no autoriza DOMAIN_PASS
```

## 7. Lo que NO está resuelto

```text
durable persistence
atomic filesystem/database commit
write-ahead/journal
crash recovery
compare-and-swap / concurrent writer guard
pin explícito E5.1/E5.2 en futuro entrypoint operativo
repair agent
agent sandbox
automatic retry
full loop
AUTHORIZED_FOR_ASC
```

## 8. Siguiente paso al abrir una ventana nueva

1. Verificar PR #74 y checks del head actual.
2. Si el commit documental está verde, solicitar/registrar aprobación humana de E5.2.
3. Cerrar E5.2 como `CLOSED / PASS`.
4. Revalidar commit de cierre.
5. Mergear PR #74 y verificar `main`.
6. Abrir la siguiente subetapa para persistencia durable del snapshot repair+child.
7. No conectar todavía el repair agent.

## 9. Regla de continuidad

```text
validar
→ persistir de forma atómica
→ demostrar recovery
→ recién después conectar agente
```
