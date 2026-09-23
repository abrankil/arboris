# MAP-001 — E5.3 Durable Repair+Child Persistence Design 001

**Fecha:** 2026-09-23  
**Ámbito:** E5.3 — persistencia durable y recuperación del snapshot `repair + child` producido por E5.2  
**Estado:** `DESIGN_REVIEW_PASS / IMPLEMENTATION_AUTHORIZED`  
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

El lock debe contener un binding mínimo al intento de transacción (por ejemplo `transactionId`, `runId`, `beforeSha256`, `afterSha256`) y escribirse/flusharse antes de preparar el journal.

Un crash puede dejar un lock residual. Por eso se distinguen dos entrypoints:

```text
commit()
→ si existe lock: CONCURRENT_WRITER / RECOVERY_REQUIRED
→ nunca elimina un lock ajeno

recover()
→ se ejecuta al inicio bajo propiedad exclusiva del proceso sobre ese run-store
→ usa lock + journal + hashes visibles para demostrar que el lock es residual de la transacción recuperada
→ solo entonces puede limpiar el lock
```

E5.3 no debe usar timeouts o edad del archivo como única evidencia para declarar un lock “stale”.

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
2. flush lock binding
3. read durable run
4. CAS: durable hash == expectedBeforeSha256
5. validate durable run + proposed snapshot
6. write <run>.txn.json phase PREPARED
7. flush journal file
8. write complete proposed snapshot to <run>.next.json
9. flush next file
10. atomically replace visible <run>.json with complete next snapshot
11. flush containing directory when supported by the target filesystem
12. verify visible run hash == afterSha256
13. remove transaction journal
14. remove residual next file if present
15. flush directory metadata when supported
16. release lock
```

La snapshot nunca se actualiza por edición parcial del JSON visible.

## 7. Recovery

Al abrir/reanudar un run, E5.3 debe ejecutar recovery antes de aceptar nuevas escrituras. Recovery se ejecuta bajo propiedad exclusiva de arranque del run-store; no compite con un `commit()` activo. Si esa precondición operativa no puede garantizarse, debe fallar cerrado en lugar de retirar un lock.

La decisión de recovery se toma únicamente desde bindings demostrables:

```text
lock
journal
next snapshot
visible run hash
```

No se usa edad, mtime ni “archivo más nuevo” como sustituto de evidencia.

### 7.1 Bindings de recovery

Cuando existe lock, debe poder parsearse y contener:

```text
transactionId
runId
beforeSha256
afterSha256
```

Cuando existen lock + journal, ambos deben coincidir exactamente en esos cuatro campos. Un mismatch produce:

```text
RECOVERY_BINDING_MISMATCH
→ fail closed
```

### 7.2 Matriz de recovery

```text
LOCK  JOURNAL  NEXT                     VISIBLE HASH   RESULTADO
----  -------  -----------------------  -------------  ----------------------------------------
no    no       no                       valid          NORMAL / no recovery
no    *        *                        any            RECOVERY_ORPHAN_METADATA / fail closed
yes   no       no                       before         RECOVERED_BEFORE; remove residual lock
yes   no       no                       after          RECOVERED_AFTER; validate after; remove lock
yes   no       no                       other          RECOVERY_DIVERGENCE / fail closed
yes   no       present                  any            RECOVERY_ORPHAN_NEXT / fail closed
yes   yes      absent                   before         RECOVERED_BEFORE; cleanup journal + lock
yes   yes      absent                   after          RECOVERED_AFTER; cleanup journal + lock
yes   yes      absent                   other          RECOVERY_DIVERGENCE / fail closed
yes   yes      hash == afterSha256      before         complete atomic replace; RECOVERED_AFTER
yes   yes      hash == afterSha256      after          RECOVERED_AFTER; cleanup residual metadata
yes   yes      hash == afterSha256      other          RECOVERY_DIVERGENCE / fail closed
yes   yes      hash != afterSha256      any            RECOVERY_NEXT_HASH_MISMATCH / fail closed
```

`*` significa cualquier metadata transaccional residual. Dado que el lock es creado primero y retirado último, journal/next sin lock contradicen el protocolo y no se limpian por inferencia.

### 7.3 Locks sin journal: C1 vs C8

Un lock residual sin journal no es ambiguo si el binding del lock es válido y el visible hash coincide exactamente con uno de sus extremos:

```text
visible == beforeSha256
→ crash pre-journal (C1)
→ BEFORE ya era durable
→ RECOVERED_BEFORE

visible == afterSha256
→ crash post-cleanup/pre-unlock (C8)
→ AFTER ya era durable
→ RECOVERED_AFTER
```

Si el visible hash no coincide con ninguno:

```text
→ RECOVERY_DIVERGENCE
→ fail closed
```

### 7.4 Journal PREPARED con visible BEFORE

Se distinguen dos casos que no deben colapsarse:

```text
next absent
→ el AFTER no quedó preparado de forma demostrable
→ preservar BEFORE
→ cleanup journal + lock
→ RECOVERED_BEFORE
```

```text
next present && logicalSha256(next) == afterSha256
→ AFTER quedó preparado y validado
→ completar atomic replace
→ verificar AFTER
→ cleanup
→ RECOVERED_AFTER
```

Si `next` existe pero su hash no coincide:

```text
→ corrupción/divergencia
→ no borrar evidencia
→ RECOVERY_NEXT_HASH_MISMATCH
→ fail closed
```

### 7.5 Journal PREPARED con visible AFTER

```text
validar visible AFTER
→ validar visible hash == afterSha256
→ si next existe, exigir también hash == afterSha256
→ cleanup metadata residual
→ RECOVERED_AFTER
```

Un `next` residual divergente bloquea cleanup automático.

### 7.6 Regla final de recovery

Toda fila recuperable termina de forma explícita en:

```text
RECOVERED_BEFORE
o
RECOVERED_AFTER
```

Toda combinación no cubierta, binding inconsistente o hash no demostrable termina fail closed.

Recovery no inventa el estado correcto.

## 8. Puntos de crash que deben probarse

Se requiere fault injection determinista al menos en:

```text
C1 después de crear y flushar lock
C2 después de fsync journal PREPARED
C3 después de fsync next snapshot
C4 inmediatamente antes del replace visible
C5 inmediatamente después del replace visible
C6 después de verificar afterSha256 y antes de cleanup
C7 durante cleanup de journal/next
C8 después de cleanup durable y antes de retirar lock
```

Mapeo mínimo exigido:

```text
C1 → lock only + visible BEFORE → RECOVERED_BEFORE
C2 → lock + journal + no next + visible BEFORE → RECOVERED_BEFORE
C3 → lock + journal + valid next + visible BEFORE → RECOVERED_AFTER
C4 → lock + journal + valid next + visible BEFORE → RECOVERED_AFTER
C5 → lock + journal + visible AFTER → RECOVERED_AFTER
C6 → lock + journal + visible AFTER → RECOVERED_AFTER
C7 → metadata residual compatible + visible AFTER → RECOVERED_AFTER
C8 → lock only + visible AFTER → RECOVERED_AFTER
```

Para cada crash point, reiniciar el store y demostrar uno de dos estados visibles válidos:

```text
visible BEFORE completo
o
visible AFTER completo
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
next absent + journal + BEFORE     → RECOVERED_BEFORE
next hash mismatch                 → fail closed
orphan journal/next without lock   → fail closed
lock/journal binding mismatch      → fail closed
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

El journal y el lock tienen funciones distintas: el journal prueba una transacción PREPARED; el lock conserva el binding mínimo que permite distinguir un crash C1 pre-journal de un crash C8 post-cleanup. La matriz de recovery evita tratar ambos casos como el mismo “stale lock”.

La revisión asistida por ASC v0.1, en modo compile-only, hizo explícitas las relaciones obligatorias y reveló dos vacíos del diseño inicial: C1/C8 no estaban cerrados de forma determinista y `next absent` estaba mezclado con `next hash mismatch`. Ambos quedan corregidos en §7. ASC no decide la validez de dominio ni cierra los OPEN de plataforma.

## 14. INCONSISTENCIAS

No se detecta contradicción con E5.2: E5.2 declara explícitamente `CANDIDATE_NOT_PERSISTED`; E5.3 comienza exactamente en esa frontera.

La regla de `repairChildAtomicity` ya exige un único boundary durable, por lo que una estrategia de dos escrituras visibles —primero repair y luego child— sería incompatible y queda prohibida.

La revisión R2 detectó y corrigió dos inconsistencias operativas del borrador anterior:

```text
R2-I1 lock residual sin journal no distinguía C1 de C8
R2-I2 next ausente se trataba igual que next corrupto
```

C1/C8 se resuelven ahora usando el binding del lock + visible hash. `next absent + visible BEFORE` recupera BEFORE; `next present con hash distinto de afterSha256` es corrupción y falla cerrado.

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
tests de stale-lock recovery sin timeout inferido
tests exhaustivos de la matriz lock/journal/next/visible
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

## 18. Evidencia ASC de revisión R2

```text
ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-E5.3-DESIGN-RECOVERY-R2-ASC-001
```

El contrato compilado preservó como `OPEN`:

```text
filesystem/plataformas soportadas
API concreta del durable store
representación final del pin operativo E5.1/E5.2
```

y prohibió explícitamente:

```text
repair y child en commits visibles separados
borrar lock inexplicado desde commit()
recovery por mtime/archivo más nuevo
conectar repair agent en E5.3
```

Resultado de la revisión de diseño:

```text
R2-I1  RESOLVED
R2-I2  RESOLVED
NUEVAS INCONSISTENCIAS BLOQUEANTES  NONE FOUND
OPEN DE IMPLEMENTACIÓN             PRESERVED
```

Estado de salida de este documento:

```text
E5.3 DESIGN_REVIEW_PASS
IMPLEMENTATION_AUTHORIZED
REPAIR_AGENT_OUT_OF_SCOPE
```
