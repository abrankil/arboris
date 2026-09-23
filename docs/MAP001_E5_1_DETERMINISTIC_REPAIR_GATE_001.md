# MAP-001 — E5.1 Deterministic Repair Gate 001

**Fecha:** 2026-09-23  
**Ámbito:** E5.1 — aceptación, aplicación y materialización determinista de repairs MAP-001  
**Estado:** `REVISED_CANDIDATE / EXTERNAL_VALIDATION_PENDING`  
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

E5.1 no genera el repair. Solo determina si un repair recibido es admisible y, si lo es, lo aplica de forma determinista. La entrada ejecutable es `executeMap001RepairGate`; el aplicador bajo nivel queda sujeto al pre/post contract gate cuando se usa en el flujo real.

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

Antes de aplicar el patch, el gate ejecutable verifica además:

```text
Proposal R2 schema
Validation Report R1 schema
Repair R1 schema
validation-report status rederivado
report authorityBinding == parent baseline
authority manifest raw SHA
source candidate raw SHA
validator implementation raw SHA
repo-local finding sourceRefs existentes
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
non-AUTO_REPAIR findingRef        PROHIBIDO
cada finding citado debe autorizar el target
target outside finding scope      PROHIBITED
duplicate editId                   PROHIBITED
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

`intent.changes` se materializa determinísticamente desde las operaciones del repair. El post-gate independiente verifica que los changes correspondan exactamente al repair y que, reaplicados sobre el parent candidate, reconstruyan el child candidate.

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
cada finding citado debe autorizar el target
basis no REJECT_FIXABLE
expectedBefore mismatch
object equality independiente de key order
duplicate editId
overlapping targets
JSON Pointer escape inválido
array index con leading zero
Repair R1 estructuralmente inválido
authorityBinding drift
validator hash drift
child proposalId reutilizado
```

## 9. AUDITORÍA

La primera ejecución externa pasó, pero la revisión estricta posterior encontró brechas que ese PASS funcional no cubría:

```text
A1  contract validation solo estaba ejercida desde el test, no como frontera ejecutable
A2  target scope aceptaba que solo uno de varios findingRefs autorizara la edición
A3  expectedBefore usaba JSON.stringify y podía depender del orden de claves
A4  report authority/validator/source provenance no se revalidaba en E5.1
A5  editId duplicado no se rechazaba semánticamente
A6  child proposalId podía reutilizar el id del parent
A7  inputs JS no estaban normalizados explícitamente a artefactos JSON
A8  post-gate no reconstruía de forma independiente el child desde declared changes
```

Todos estos puntos fueron corregidos antes de considerar cierre.

E5.1 separa explícitamente dos responsabilidades:

```text
agente futuro
→ propone repair.patch

repair gate
→ decide si el patch está autorizado y es aplicable
```

La aceptación no depende de que el agente afirme que su patch es correcto.

## 10. INCONSISTENCIAS

La revisión detectó una inconsistencia entre la regla semántica `repairFindingRefs` y la implementación inicial: el contrato exige autorización por cada finding citado, mientras el código inicial aceptaba autorización por cualquiera de ellos. Se corrigió para exigir que todos los findingRefs citados autoricen el target.

No se detectó una necesidad de cambiar autoridad MAP-001 ni ASC.

Semantic Contract R3 ya declara `SEM-REP-001..006`; E5.1 materializa una parte ejecutable de esas invariantes sin promover todavía Semantic R3 fuera de `R3_CANDIDATE`.

## 11. VACÍOS / OMISIONES

E5.1 todavía no implementa:

```text
repair agent
agent output parsing
agent capability sandbox
prueba de pertenencia del validation-report al run-state persistido
unicidad global de proposalId/repairId dentro de la corrida
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

La pertenencia del report a una corrida persistida y la unicidad global de IDs requieren el contexto del run-state y quedan declaradas como pendientes para E5.2/E5.3; E5.1 no las infiere.
