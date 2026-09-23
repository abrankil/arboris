# MAP-001 — E5.3 Durable Repair+Child Persistence Design 001

**Fecha:** 2026-09-23  
**Ámbito:** E5.3 — persistencia durable y recuperación del snapshot `repair + child` producido por E5.2  
**Estado:** `DESIGN_CANDIDATE / IMPLEMENTATION_PENDING`  
**Baseline:** `main@922f7ab7bb697b3dd5adc6628051aaebf7f89e0c`  
**Precondición:** E5.2 `CLOSED / PASS`.  
**Frontera explícita:** el repair agent permanece fuera de alcance.

## 1. Objetivo

Convertir la snapshot candidata de E5.2 en una transición durable recuperable sin permitir estados visibles parciales.

La propiedad principal a demostrar es:

```text
ANTES DEL COMMIT DURABLE
run visible = READY_TO_REPAIR
parent.repair = null
child = absent

DESPUÉS DEL COMMIT DURABLE
parent.repair = exact repair binding
child immediate = present
candidateHistory child = present
run visible = estado derivado de la snapshot completa
```

No puede existir un estado durable visible con:

```text
repair persistido
+
child ausente
```

Esto materializa la regla `repairChildAtomicity` y `SEM-RUN-007` del Semantic Contract R3.

## 2. Entrada autorizada

E5.3 no construye repairs ni children.

Recibe exclusivamente el resultado ya validado de E5.2:

```text
transactionStatus = CANDIDATE_NOT_PERSISTED
persistencePerformed = false
proposedRunSnapshot = schema + semantic PASS
inputState = READY_TO_REPAIR
```

La capa E5.3 debe volver a verificar antes de escribir:

```text
current durable run == expected pre-commit snapshot
current durable run.state == READY_TO_REPAIR derivado
proposed snapshot != current snapshot
proposed snapshot contiene repair + immediate child de forma íntegra
proposed snapshot pasa Run State R5
proposed snapshot no deriva SYSTEM_ERROR
execution provenance/pins siguen válidos
```

La persistencia no confía en una afirmación del caller de que la snapshot es correcta.

## 3. Frontera durable propuesta

Se define un único commit lógico para el run-state.

Artefactos operativos:

```text
<run>.json              estado durable visible
<run>.txn.json          journal transaccional recuperable
<run>.next.json         snapshot candidata temporal
<run>.lock              exclusión de writer
```

Ninguno de estos artefactos adquiere autoridad de dominio. Son infraestructura de persistencia.

## 4. Control de concurrencia

Antes de preparar una transacción:

```text
crear <run>.lock con exclusive-create
```

Si el lock ya existe:

```text
→ no escribir
→ fail closed
→ CONCURRENT_WRITER
```

Además del lock, se exige compare-and-swap lógico:

```text
expectedBeforeSha256
==
logicalSha256(current durable run)
```

Un writer que haya leído una versión anterior no puede sobrescribir una versión posterior aunque obtenga el lock más tarde.

El lock no reemplaza CAS; CAS no reemplaza el lock.

## 5. Journal

El journal registra como mínimo:

```text
schemaVersion
transactionId
runId
phase = PREPARED
beforeSha256
afterSha256
runPath
nextPath
createdAt
```

`beforeSha256` y `afterSha256` usan la misma canonicalización lógica definida por MAP-001 para objetos JSON.

El journal no contiene una segunda copia normativa del run. Solo bindings y datos mínimos de recovery.

## 6. Secuencia de commit

Secuencia requerida:

```text
1. acquire exclusive writer lock
2. read durable run
3. CAS: durable hash == expectedBeforeSha256
4. validate durable run + proposed snapshot
5. write <run>.txn.json phase PREPARED
6. flush journal file
7. write complete proposed snapshot to <run>.next.json
8. flush next file
9. atomically replace visible <run>.json with complete next snapshot
10. flush containing directory when supported by the target filesystem
11. verify visible run hash == afterSha256
12. remove transaction journal
13. remove residual next file if present
14. flush directory metadata when supported
15. release lock
```

La snapshot nunca se actualiza por edición parcial del JSON visible.

## 7. Recovery

Al abrir/reanudar un run, E5.3 debe ejecutar recovery antes de aceptar nuevas escrituras.

### Caso A — no existe journal

```text
validar visible run
→ continuar
```

### Caso B — journal PREPARED y visible hash == afterSha256

El reemplazo durable ocurrió; faltó solo cleanup.

```text
validar visible run
→ eliminar journal/next residual
→ continuar con after snapshot
```

### Caso C — journal PREPARED y visible hash == beforeSha256

El commit visible todavía no ocurrió.

Si `next` existe, su hash es `afterSha256` y pasa validación:

```text
→ completar reemplazo
→ verificar afterSha256
→ cleanup
```

Si `next` falta o no coincide:

```text
→ conservar visible before snapshot
→ fail closed
→ RECOVERY_INCOMPLETE
```

### Caso D — visible hash no coincide con before ni after

```text
→ no inferir
→ no elegir una versión
→ fail closed
→ RECOVERY_DIVERGENCE
```

Recovery no inventa el estado correcto.

## 8. Puntos de crash que deben probarse

Se requiere fault injection determinista al menos en:

```text
C1 después de crear lock
C2 después de fsync journal PREPARED
C3 después de fsync next snapshot
C4 inmediatamente antes del replace visible
C5 inmediatamente después del replace visible
C6 después de verificar afterSha256 y antes de cleanup
C7 durante cleanup de journal/next
```

Para cada crash point, reiniciar el store y demostrar uno de dos resultados válidos:

```text
visible before completo
o
visible after completo
```

Nunca un híbrido.

## 9. Validaciones obligatorias de implementación

Pruebas positivas:

```text
READY_TO_REPAIR durable
+ E5.2 candidate
→ durable repair+child
→ restart
→ same logical hash
→ reducer derives expected post-state
```

Pruebas negativas:

```text
stale expectedBeforeSha256         → reject
second writer / lock collision     → reject
journal collision                  → reject
next hash mismatch                 → reject
visible divergence during recovery → fail closed
repair without child candidate     → reject
candidate schema invalid           → reject
candidate semantic SYSTEM_ERROR    → reject
execution pin drift                → reject
```

## 10. Portabilidad y filesystem

La implementación no debe afirmar garantías de atomicidad superiores a las que ofrece el filesystem real.

La primera implementación debe documentar explícitamente:

```text
qué operación se usa como atomic replace
qué plataformas/filesystems se consideran soportados
si directory fsync está disponible
qué garantía queda degradada cuando no lo está
```

Si no puede demostrarse reemplazo atómico en una plataforma, esa plataforma no debe declararse cubierta por E5.3.

## 11. Pinning del entrypoint operativo

E5.3 es también el punto donde debe cerrarse el vacío declarado en E5.2:

```text
pin explícito de E5.1/E5.2
como dependencias del futuro entrypoint operativo
```

La implementación de persistencia no debe recrear ni copiar lógica de E5.1/E5.2. Debe consumir sus entrypoints y fijar sus hashes/dependencias según la política de provenance vigente.

## 12. Frontera del repair agent

Fuera de E5.3:

```text
repair agent
prompt del repair agent
agent output parsing
agent sandbox
automatic retry
automatic loop
agent-selected IDs
agent writes to run-state
```

La regla de continuidad permanece:

```text
validar
→ persistir de forma atómica
→ demostrar recovery
→ recién después conectar agente
```

## 13. AUDITORÍA

El diseño usa como autoridad técnica inmediata:

```text
E5.2 CLOSED / PASS
Run State R5
Semantic Contract R3
docs/DEVELOPMENT_MANUAL.md
```

La persistencia queda separada del repair gate y del reducer. E5.3 no toma decisiones de dominio: compromete o recupera una snapshot que ya debe ser válida.

La combinación lock + CAS evita dos clases distintas de fallo: escrituras simultáneas y escrituras basadas en una versión obsoleta.

El journal se usa para distinguir con evidencia un crash pre-commit de un crash post-replace.

## 14. INCONSISTENCIAS

No se detecta contradicción con E5.2: E5.2 declara explícitamente `CANDIDATE_NOT_PERSISTED`; E5.3 comienza exactamente en esa frontera.

La regla de `repairChildAtomicity` ya exige un único boundary durable, por lo que una estrategia de dos escrituras visibles —primero repair y luego child— sería incompatible y queda prohibida.

Permanece una cuestión de implementación que no debe cerrarse por suposición: la semántica exacta de atomic replace y directory fsync en cada plataforma soportada debe demostrarse con la API/filesystem elegidos.

## 15. VACÍOS / OMISIONES

Pendientes antes de `TECHNICAL_PASS`:

```text
selección y prueba del mecanismo concreto de atomic replace
implementación del durable store
recovery executable
fault injection
tests de restart
tests de CAS
tests de concurrent writer
pin operativo E5.1/E5.2
CI gate E5.3
evidencia de plataforma/filesystem soportado
```

Siguen explícitamente fuera:

```text
repair agent
agent sandbox
automatic retry
full loop
AUTHORIZED_FOR_ASC
```

## 16. REDUNDANCIAS

El journal no debe duplicar la snapshot completa: hacerlo crearía una segunda representación del run y aumentaría el riesgo de divergencia. Solo enlaza `before` y `after`.

E5.3 no reimplementa:

```text
E5.1 repair semantics
E5.2 transaction candidate construction
E4.2 reducer
Run State R5 schema
Semantic Contract R3
```

La redundancia permitida es únicamente defensiva: E5.3 vuelve a validar bindings/hashes relevantes inmediatamente antes del commit para evitar TOCTOU.

## 17. Gate de avance

No implementar conexión con agente hasta obtener:

```text
durable commit PASS
crash recovery PASS
CAS/concurrent writer PASS
restart equivalence PASS
Audit Protocol Check PASS
CI PASS
MAP-001 Proposal Validation Gate PASS
human approval
```

Estado de salida de este documento:

```text
E5.3 DESIGN_CANDIDATE
IMPLEMENTATION_PENDING
```
