# MAP-001 — E5.1 Deterministic Repair Gate 001

**Fecha:** 2026-09-23  
**Ámbito:** E5.1 — aceptación, aplicación y materialización determinista de repairs MAP-001  
**Estado:** `CANDIDATE / EXTERNAL_VALIDATION_PENDING`  
**Baseline:** `main@5dc3bf9b79d2f03ef160c97697aa0b437ed15d7d`  
**Precondición:** E4.3 cerrado; Run State R5 + Semantic Contract R3 vigentes; Repair R1 ya definido.

## 1. Objetivo

Introducir la primera pieza ejecutable de E5 sin incorporar todavía un agente generativo.

```text
REJECT_FIXABLE
→ repair candidate
→ deterministic repair gate
→ apply patch to parent candidate
→ child proposal R2
→ full domain revalidation
```

E5.1 no genera el repair. Solo determina si un repair recibido es admisible y, si lo es, lo aplica de forma determinista.

## 2. Implementación

Se agregan:

```text
tools/proposal-resolution/map001_repair_gate_r1.mjs
tools/proposal-resolution/validate_e5_repair_contracts.py
tools/proposal-resolution/map001_repair_gate_r1.test.mjs
```

## 3. Frontera de autoridad

El repair puede modificar únicamente:

```text
parentProposal.intent.candidate
```

y solo dentro del alcance de findings:

```text
disposition = AUTO_REPAIR
```

Un finding `OPEN_BLOCKER` o `AUTHORITY_BLOCKER` nunca concede permiso de reparación.

La aplicación de un repair no altera:

```text
authority
baseline
validation-report
run control
ASC
```

## 4. Bindings obligatorios

El repair debe enlazar exactamente:

```text
runId
parent proposal id + logical hash + iteration
validation report id + logical hash + REJECT_FIXABLE
```

El child proposal generado enlaza exactamente:

```text
parent proposal
originating repair
baseline
parent candidate logical hash
```

## 5. Semántica del patch

Se implementan de forma determinista:

```text
add
remove
replace
```

Reglas:

```text
root replacement                  PROHIBITED
duplicate target                  PROHIBITED
overlapping targets               PROHIBITED
unknown findingRef                PROHIBITED
non-AUTO_REPAIR findingRef        PROHIBITED
target outside finding scope      PROHIBITED
expectedBefore mismatch           PROHIBITED
replace no-op                     PROHIBITED
array add                         only index == length or /-
array remove/replace              existing strict index only
array leading-zero index          PROHIBITED
invalid JSON Pointer ~ escape     PROHIBITED
```

La validación de escapes ocurre antes de decodificar `~0` / `~1`.

Esto corrige dos deudas históricas de E2:

```text
validación correcta de ~ escapes
índices array sin leading zeros
```

## 6. Child proposal

El child proposal es construido por el resolver, no por el agente.

```text
iteration = parent + 1
subject.mode = MODIFY_DERIVED
subject.baseSha256 = logicalSha256(parent.intent.candidate)
baseline = parent baseline
lineage.parentProposal = exact parent binding
lineage.originatingRepair = exact repair binding
```

`intent.changes` se materializa determinísticamente desde las operaciones del repair.

El child queda pendiente de validación de dominio completa.

## 7. Prueba positiva end-to-end

La prueba principal usa el validator MAP-001 real:

```text
candidate con derivedRaster drift
→ Validation Report REJECT_FIXABLE
→ Repair R1
→ repair gate PASS
→ child proposal
→ validation MAP-001 real
→ PASS
```

Por tanto, E5.1 prueba que una reparación autorizada puede restaurar conformidad sin modificar autoridad ni cerrar OPEN.

## 8. Pruebas negativas

La suite cubre:

```text
target fuera del finding scope
basis no REJECT_FIXABLE
expectedBefore mismatch
overlapping targets
JSON Pointer escape inválido
array index con leading zero
```

## 9. AUDITORÍA

E5.1 separa explícitamente dos responsabilidades:

```text
agente futuro
→ propone repair.patch

repair gate
→ decide si el patch está autorizado y es aplicable
```

La aceptación no depende de que el agente afirme que su patch es correcto.

## 10. INCONSISTENCIAS

No se detectó una necesidad de cambiar autoridad MAP-001 ni ASC.

Semantic Contract R3 ya declara `SEM-REP-001..006`; E5.1 materializa una parte ejecutable de esas invariantes sin promover todavía Semantic R3 fuera de `R3_CANDIDATE`.

## 11. VACÍOS / OMISIONES

E5.1 todavía no implementa:

```text
repair agent
agent output parsing
agent capability sandbox
atomic durable commit repair + child
run-state append del child
automatic loop
retry policy
prompting del repair agent
```

Esos elementos corresponden a E5.2+ y E8.

## 12. REDUNDANCIAS

No se duplican reglas de dominio MAP-001.

```text
validation adapter
→ identifica findings y AUTO_REPAIR scope

repair gate
→ controla y aplica patch

domain validator
→ vuelve a decidir conformidad del child
```

ASC permanece fuera de esta decisión.
