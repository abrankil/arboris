# MAP-001 — E4.1 State Machine / Orchestrator Transition Table 001

**Fecha:** 2026-09-23  
**Ámbito:** E4.1 — definición determinista de estados y transiciones del resolver cíclico MAP-001  
**Estado:** `R4_CANDIDATE / VALIDATION_PENDING`  
**Baseline:** `main@6664a9a99c70143819aa338c3713d1624e1c9f62`  
**Precondición:** G3 cerrado y fusionado mediante PR #68.

## 1. Objetivo

Definir la máquina de estados del resolver antes de implementar el loop automático.

El orquestador pertenece a Árboris. ASC v0.1 permanece fuera de esta máquina y conserva su límite `compile-only`.

```text
proposal
→ validación estructural
→ validación semántica
→ validator de dominio
→ validation-report
→ transición del run-state
→ repair cuando corresponde
→ child proposal
→ repetir
```

El objetivo de E4.1 no es todavía ejecutar repairs ni agentes, sino congelar qué estado debe resultar de cada condición observable.

## 2. Fuentes de contrato

E4.1 usa únicamente el baseline materializado en G3:

```text
tools/proposal-resolution/schemas/run-state.schema.json
tools/proposal-resolution/contracts/cross-contract.semantic.json
tools/proposal-resolution/schemas/proposal.schema.json
tools/proposal-resolution/schemas/repair.schema.json
tools/proposal-resolution/schemas/validation-report.schema.json
```

y la frontera normativa de ASC:

```text
docs/ARBORIS_SCENE_COMPILER.md
docs/ASC_V0_1_EXECUTABLE_SPEC.md
```

## 3. Estados

### Estados activos

```text
READY_TO_VALIDATE
READY_TO_REPAIR
```

### Resultado de dominio

```text
DOMAIN_PASS
OPEN_BLOCKED
AUTHORITY_BLOCKED
```

### Diagnósticos terminales del resolver

```text
AUTHORITY_CHANGED
STALLED
CYCLE_DETECTED
REGRESSION
MAX_ITERATIONS
SYSTEM_ERROR
```

`DOMAIN_PASS` es terminal para el ciclo de resolución de dominio, pero no constituye `AUTHORIZED_FOR_ASC`.

## 4. Precedencia propuesta

La transición debe evaluarse en este orden exacto:

```text
1. integridad del resolver / contratos / provenance no autoritativa
   → SYSTEM_ERROR

2. deriva de autoridad o sourceCandidate fijados
   → AUTHORITY_CHANGED

3. repetición de candidate-state ya observado
   → CYCLE_DETECTED

4. ausencia de validation-report para la propuesta corriente
   → READY_TO_VALIDATE

5. validation-report = AUTHORITY_BLOCKER
   → AUTHORITY_BLOCKED

6. validation-report = OPEN_BLOCKER
   → OPEN_BLOCKED

7. validation-report = PASS
   → DOMAIN_PASS

8. validation-report = REJECT_FIXABLE
   → evaluar:
      a. REGRESSION
      b. STALLED
      c. MAX_ITERATIONS
      d. de lo contrario READY_TO_REPAIR
```

Razonamiento de precedencia:

- un error de integridad invalida cualquier interpretación posterior;
- una autoridad que cambió invalida el baseline de la corrida;
- un cycle de candidate-state puede detenerse antes de repetir trabajo de dominio;
- bloqueos de autoridad/OPEN y PASS deben reflejar directamente el resultado de dominio;
- `REGRESSION`, `STALLED` y `MAX_ITERATIONS` solo tienen sentido sobre una trayectoria `REJECT_FIXABLE`.

## 5. Tabla de transición candidata

| Condición observable | Estado resultante | ¿Terminal? | Evidencia requerida |
| --- | --- | --- | --- |
| provenance de resolver/validator/contracts inválida | `SYSTEM_ERROR` | sí | `systemErrorEvidence` |
| SHA de authority manifest o sourceCandidate difiere del baseline | `AUTHORITY_CHANGED` | sí | `authorityChangedEvidence` |
| candidate-state actual repite un candidate-state previo de la corrida | `CYCLE_DETECTED` | sí | hash repetido + primera iteración |
| propuesta corriente sin validation-report | `READY_TO_VALIDATE` | no | ninguna |
| último report = `AUTHORITY_BLOCKER` | `AUTHORITY_BLOCKED` | sí | report enlazado |
| último report = `OPEN_BLOCKER` | `OPEN_BLOCKED` | sí | report enlazado |
| último report = `PASS` | `DOMAIN_PASS` | sí para E4 | report enlazado |
| último report = `REJECT_FIXABLE` y aparecen finding-signatures nuevas respecto del repair-basis | `REGRESSION` | sí | validation previa + actual |
| último report = `REJECT_FIXABLE` y el mismo finding fingerprint se repite N veces consecutivas | `STALLED` | sí | fingerprint + conteo exacto |
| último report = `REJECT_FIXABLE` y currentIteration alcanzó maxIterations | `MAX_ITERATIONS` | sí | límite configurado |
| último report = `REJECT_FIXABLE` y ninguna condición terminal anterior aplica | `READY_TO_REPAIR` | no | ninguna |

## 6. Invariantes operativas

### I1 — El agente nunca decide estado

```text
agent
→ propone repair patch

resolver + validators
→ deciden run-state
```

### I2 — Toda reparación vuelve a validación completa

No existe:

```text
repair
→ PASS
```

La única secuencia válida es:

```text
repair
→ child proposal
→ schema
→ semantic
→ domain validator
→ report
→ state transition
```

### I3 — OPEN no entra a AUTO_REPAIR

`OPEN_BLOCKER` es terminal para la corrida vigente. Reanudar requiere nueva evidencia o una nueva decisión autorizada fuera del agente.

### I4 — Authority no entra a AUTO_REPAIR

`AUTHORITY_BLOCKER` y `AUTHORITY_CHANGED` detienen la corrida.

### I5 — DOMAIN_PASS no autoriza ASC

```text
DOMAIN_PASS
≠ AUTHORIZED_FOR_ASC
```

La autorización para ASC permanece como gate posterior.

## 7. Hallazgos que bloquean implementación E4.2

### H1 — nombre de política inconsistente

`run-state R3` todavía declara:

```text
repeatProposalHashAction
```

pero E2.5 establece que cycle detection usa:

```text
candidateStateHash
```

La implementación no debe cristalizar ese nombre incorrecto.

Corrección requerida para R4:

```text
repeatProposalHashAction
→ repeatCandidateHashAction
```

### H2 — representación de cycle detection contradictoria

`seenCandidateHashes` tiene simultáneamente:

```text
uniqueItems: true
```

y la descripción/invariante E2.5 exige que represente los candidate-states comprometidos de la historia.

Un ciclo A → B → A necesita representar la repetición de A. Si el array contiene toda la historia, `uniqueItems: true` lo hace estructuralmente imposible.

Por tanto, R3 no puede ser la estructura ejecutable final del cycle detector.

Corrección requerida para R4. Preferencia:

```text
candidateHistory:
[
  { iteration, candidateSha256 },
  ...
]
```

con duplicados permitidos, manteniendo orden de iteración.

El cycle detector compara el candidate actual contra las entradas anteriores y deriva:

```text
repeatedCandidateSha256
firstSeenIteration
```

### H3 — precedencia de estados no está congelada

E2.5 describe reglas individuales, pero no define formalmente qué diagnóstico prevalece si más de una condición coincide en la misma iteración.

E4.1 propone la precedencia de §4. Debe materializarse como contrato antes de implementar el reducer.

### H4 — atomicidad repair → child proposal

R3 permite conceptualmente una iteración `REJECT_FIXABLE` con repair persistido mientras todavía no existe child proposal.

Debe definirse el único estado permitido durante esa frontera.

Propuesta:

```text
REJECT_FIXABLE + repair persistido + child proposal aún no comprometido
→ no es un nuevo estado de dominio
→ operación transaccional interna del resolver
```

La persistencia visible del run-state debe quedar:

- en `READY_TO_REPAIR` antes del commit atómico, o
- en la siguiente iteración `READY_TO_VALIDATE` después del commit.

No debe existir un estado durable intermedio ambiguo.

### H5 — repeatCount de STALLED

`stalledEvidence.repeatCount` debe ser el conteo consecutivo máximo real al momento de detectar `STALLED`, no cualquier entero `>= stallRepeatThreshold`.

Debe verificarse semánticamente.

## 8. Materialización R4 / R2

Los bloqueadores contractuales de E4.1 fueron materializados en la rama:

```text
tools/proposal-resolution/schemas/run-state.schema.json
→ Run State R4

tools/proposal-resolution/contracts/cross-contract.semantic.json
→ Semantic Contract R2
```

Cambios incorporados:

1. `repeatProposalHashAction` fue sustituido por `repeatCandidateHashAction`;
2. `seenCandidateHashes` fue sustituido por `candidateHistory[{iteration,candidateSha256}]`, admitiendo repetición de hashes;
3. la precedencia exacta de §4 quedó serializada como `runStatePolicy.statePrecedence`;
4. la atomicidad repair → child proposal quedó declarada como invariante durable del resolver;
5. `STALLED.repeatCount` quedó definido como el conteo consecutivo máximo real;
6. `CYCLE_DETECTED.firstSeenIteration` debe apuntar a la primera aparición previa del hash repetido;
7. `DOMAIN_PASS != AUTHORIZED_FOR_ASC` permanece como invariante explícita.

Se agregó además:

```text
tools/proposal-resolution/validate_run_state_r4.py
```

para probar estructuralmente que R4 acepta un ciclo `A → B → A`, rechaza los campos legacy de R3 y conserva la precedencia e invariantes nuevas.

E4.2 no debe comenzar hasta que este candidato R4/R2 pase los checks externos y la revisión de G4.1.

## 9. Papel de ASC

ASC acompaña E4.1 únicamente como control de frontera:

```text
resolver
→ decide estados del ciclo

autoridad de dominio
→ decide conformidad del dominio

ASC
→ no participa en esas decisiones
→ recibe solo contratos posteriores ya autorizados
```

No corresponde modificar `tools/asc/compile_asc.mjs`.

## 10. AUDITORÍA

La transición candidata cubre todos los estados del resolver y conserva la separación entre estados de dominio, diagnósticos del resolver y autorización posterior para ASC.

Los defectos estructurales encontrados en R3 ya fueron trasladados a correcciones explícitas en Run State R4 y Semantic Contract R2. La validez ejecutable de esos contratos queda sujeta al gate externo de la rama antes de avanzar a E4.2.

## 11. INCONSISTENCIAS

Las dos inconsistencias materiales detectadas en R3 fueron corregidas en el candidato R4:

1. `repeatCandidateHashAction` reemplaza la nomenclatura incorrecta basada en proposal hash.
2. `candidateHistory` permite representar repeticiones reales de candidate-state y conserva el orden de iteración.

No se declara todavía cierre de E4.1 hasta obtener evidencia de ejecución del gate sobre estos contratos.

## 12. VACÍOS / OMISIONES

La precedencia global, la atomicidad repair → child proposal y la semántica exacta de `STALLED.repeatCount` ya están declaradas en Semantic Contract R2.

Permanece pendiente comprobarlas mediante el gate externo y, después, decidir si E4.1 puede cerrarse y habilitar E4.2.

## 13. REDUNDANCIAS

No se detecta duplicación de autoridad de dominio. La tabla de transición no reimplementa reglas MAP-001; solo organiza resultados ya emitidos por validators y controles del resolver.

La futura R4 deberá sustituir R3 como contrato de ejecución del orquestador; no deben coexistir como dos contratos activos de la misma corrida.
