# MAP-001 — E5.3 Durable Repair+Child Persistence Implementation 001

**Fecha:** 2026-09-23  
**Ámbito:** implementación ejecutable de E5.3  
**Estado:** `TECHNICAL_PASS / HUMAN_APPROVAL_PENDING`  
**Baseline:** `main@281e251315065d8765d4f8bc3f561d3f49fb707b`  
**Diseño:** `docs/MAP001_E5_3_DURABLE_REPAIR_PERSISTENCE_DESIGN_001.md`  
**Frontera:** repair agent fuera de alcance.

## 1. Implementación

Se agregan:

```text
tools/proposal-resolution/map001_durable_repair_store_r1.mjs
tools/proposal-resolution/map001_durable_repair_store_r1.test.mjs
```

y el `MAP-001 Proposal Validation Gate` ejecuta la suite E5.3.

Entry points:

```text
commitMap001RepairSnapshot
recoverMap001RepairStore
```

## 2. Plataforma demostrada

La primera implementación falla cerrada fuera de:

```text
Linux
```

No se afirma soporte durable equivalente para Windows o macOS.

En Linux usa:

```text
exclusive-create lock
fsync file
fsync containing directory
rename within same directory
logical SHA-256 CAS
```

El reemplazo visible se realiza con `renameSync(nextPath, runPath)` después de fsync del archivo `next`; la suite E5.3 se ejecuta en el runner Ubuntu del gate MAP-001.

## 3. CAS y writer lock

Antes del journal:

```text
expectedBeforeSha256 == logicalSha256(current durable run)
```

El lock se crea con `wx`, contiene:

```text
transactionId
runId
beforeSha256
afterSha256
operationalDependencies
```

y se fsynca antes de continuar.

## 4. Revalidación pre-commit

E5.3 no acepta una snapshot AFTER arbitraria. Recibe los inputs exactos de E5.2 (`parentProposal`, `validationReport`, `repair`, `childProposalId`) y reconstruye nuevamente el transaction candidate contra el run durable observado. La reconstrucción ocurre antes del lock solo para preparar el binding y se repite bajo lock; el hash AFTER debe ser idéntico en ambas ejecuciones.

Antes de escribir `PREPARED` se vuelve a verificar:

```text
Run State R5 schema
execution pins vigentes
persisted state == reducer state
before state == READY_TO_REPAIR
E5.2 fresh reconstruction = CANDIDATE_NOT_PERSISTED
E5.2 persistencePerformed = false
E5.2 inputState = READY_TO_REPAIR
repair+child delta exacta
after state schema/semantic válida
E5.1 operational dependency hash
E5.2 operational dependency hash
```

La capa durable no genera repair ni child.

## 5. Atomic commit

Secuencia implementada:

```text
lock + fsync
→ reread/CAS
→ validate before/after
→ journal PREPARED + fsync
→ next complete snapshot + fsync
→ rename next -> visible
→ directory fsync
→ verify/validate visible AFTER
→ cleanup journal/next
→ directory fsync
→ remove lock
→ directory fsync
```

No existe una escritura visible intermedia de repair sin child.

## 6. Recovery

Se implementa la matriz R2:

```text
no lock + journal/next              → fail closed
lock only + visible BEFORE          → RECOVERED_BEFORE
lock only + visible AFTER           → RECOVERED_AFTER
lock + journal + no next + BEFORE   → RECOVERED_BEFORE
lock + journal + no next + AFTER    → RECOVERED_AFTER
lock + journal + valid next + BEFORE→ complete replace → RECOVERED_AFTER
lock + journal + valid next + AFTER → cleanup → RECOVERED_AFTER
next hash mismatch                  → fail closed
lock/journal binding mismatch       → fail closed
visible neither BEFORE nor AFTER    → fail closed
```

No usa edad/mtime para decidir staleness.

## 7. Fault injection

La suite fuerza crashes en:

```text
C1 C2 C3 C4 C5 C6 C7 C8
```

Resultado esperado:

```text
C1 C2 → RECOVERED_BEFORE
C3..C8 → RECOVERED_AFTER
```

Además cubre:

```text
restart equivalence
fresh E5.2 reconstruction binding
stale CAS rejection
second writer rejection
corrupt next fail-closed
orphan journal fail-closed
operational path substitution fail-closed
E5.3 self-provenance drift fail-closed
```

## 8. Pin operativo E5.1/E5.2/E5.3

La transacción fija los bytes de:

```text
tools/proposal-resolution/map001_repair_gate_r1.mjs
tools/proposal-resolution/map001_repair_transaction_candidate_r1.mjs
```

en lock y journal.

Recovery exige que `dependencyId + path + raw sha256` coincidan exactamente con el conjunto esperado antes de completar o limpiar una transacción. Esto impide sustitución de path con bytes válidos y también recovery bajo drift del propio entrypoint E5.3.

Esto no convierte E5.3 en autoridad de E5.1/E5.2; solo cierra procedencia ejecutable durante la transacción durable.

## 9. ASC

ASC v0.1 se usó en la revisión de diseño para compilar restricciones y mantener explícitos los OPEN.

ASC no participa en:

```text
commit
recovery
CAS
filesystem
reducer
repair generation
domain validation
```

No se amplió ASC.

## 10. AUDITORÍA

El primer PASS externo de PR #76 no se tomó como evidencia suficiente de cierre. La auditoría adversarial posterior, asistida por ASC v0.1 en modo compile-only con TEST ID `MAP001-E5.3-POSTPASS-ADV-AUDIT-ASC-001`, encontró tres brechas:

```text
P1 E5.3 aceptaba una proposedRunSnapshot arbitraria con forma repair+child
P2 operational dependency verificaba id+hash pero no path exacto
P3 lock/journal no fijaban el propio entrypoint E5.3
```

Además, se endureció el orden operativo para que un lock residual sea detectado antes de usar estado mutable como autorización de commit.

Correcciones:

```text
P1 → E5.3 reconstruye E5.2 desde inputs exactos y exige mismo AFTER bajo lock
P2 → dependency tuple exacta = dependencyId + path + raw sha256
P3 → E5_3_DURABLE_STORE se incluye en provenance transaccional
```

La implementación sigue el diseño R2 y conserva una sola snapshot visible. Los estados transaccionales auxiliares son metadata o staging y no adquieren autoridad.

La validación se repite inmediatamente antes del commit para reducir TOCTOU. El AFTER se vuelve a validar después del rename.

El soporte inicial se limita deliberadamente a Linux para no afirmar semánticas de fsync/rename no demostradas en otras plataformas.

## 11. INCONSISTENCIAS

Las inconsistencias P1-P3 del primer PASS fueron corregidas antes de cualquier cierre. El nuevo candidato requiere revalidación externa completa.

No se detecta contradicción intencional con E5.2, Run State R5 o Semantic Contract R3.

La implementación no modifica el schema del run para introducir pins E5.1/E5.2; estos viven en la metadata transaccional E5.3. Esto evita convertir información de recovery en una nueva fuente de verdad del run.

Debe verificarse en CI que `fsync` de directorio y el reemplazo por rename se comporten como espera la implementación en el runner Linux soportado.

## 12. VACÍOS / OMISIONES

Hasta ejecución externa siguen pendientes:

```text
revalidación CI del head corregido
revalidación MAP-001 Proposal Validation Gate del head corregido
revalidación Audit Protocol Check del head corregido
regresiones P1/P2/P3 en Ubuntu
strict post-correction audit
human approval
```

Fuera de alcance y aún no autorizados:

```text
Windows/macOS durable guarantee
repair agent
agent sandbox
automatic retry
full loop
AUTHORIZED_FOR_ASC
```

## 13. REDUNDANCIAS

La lógica de dominio no se duplicó.

Redundancia intencional:

```text
schema/reducer/pin validation pre-commit
+
schema/reducer validation post-replace/recovery
```

Es defensa contra TOCTOU y corrupción, no una segunda autoridad.

## 14. Revalidación del candidato corregido

El head posterior a P1-P3 debe ejecutar nuevamente todos los gates. Ningún PASS del candidato anterior se reutiliza como prueba suficiente del candidato corregido.

## 15. Gate

E5.3 no puede declararse `CLOSED / PASS` hasta:

```text
E5.3 tests PASS on Linux
MAP-001 Proposal Validation Gate PASS
CI PASS
Audit Protocol Check PASS
strict post-pass audit
human approval
```

Repair agent permanece bloqueado hasta ese cierre.


## 16. Evidencia de revalidación final del candidato corregido

Head funcional/documental revalidado antes de este registro:

```text
c2b30179e84fe8f0e03406d6500e22efff930fb6
```

Evidencia externa:

```text
MAP-001 Proposal Validation Gate #70  PASS
  - E4.2 regression                   PASS
  - E4.3 regression                   PASS
  - E5.1 regression                   PASS
  - E5.2 regression                   PASS
  - E5.3 durable store/recovery       PASS
CI #319                              PASS
Audit Protocol Check #258            PASS
```

La suite E5.3 del head corregido demostró en Ubuntu:

```text
durable commit + restart equivalence
C1/C2 → RECOVERED_BEFORE
C3..C8 → RECOVERED_AFTER
CAS stale → reject
second writer → reject
corrupt next → fail closed
orphan metadata → fail closed
forged repair → fresh E5.2 rejection
dependency path substitution → fail closed
E5.3 self-provenance drift → fail closed
```

Auditoría post-corrección:

```text
P1 arbitrary AFTER snapshot             RESOLVED
P2 dependency path substitution         RESOLVED
P3 E5.3 self-provenance gap             RESOLVED
nuevas inconsistencias bloqueantes      NONE FOUND
```

Resultado técnico:

```text
E5.3
TECHNICAL_PASS
HUMAN_APPROVAL_PENDING
```

No se declara `CLOSED / PASS`, no se mergea y no se conecta repair agent hasta aprobación humana explícita y revalidación del commit documental final.
