# MAP-001 — E4.2 Deterministic Run-State Reducer 001

**Fecha:** 2026-09-23  
**Ámbito:** E4.2 — reducer ejecutable de estados para el resolver cíclico MAP-001  
**Estado:** `CLOSED / PASS`  
**Baseline:** `main@5401eb0bb35cbbcfabe2a7ff3faf0e9060c157d3`  
**Precondición:** E4.1 / G4.1 cerrado; Run State R4 + Semantic Contract R2 vigentes.  
**Aprobación humana de E4.2:** recibida el 2026-09-23.

## 1. Objetivo

Implementar una función pura y determinista que derive el siguiente `run-state` a partir de:

```text
run-state R4 persistido
+ validation-reports enlazados
+ observaciones de integridad/provenance ya obtenidas
```

sin ejecutar agentes, sin escribir artefactos, sin modificar autoridad y sin invocar ASC.

Implementación:

```text
tools/proposal-resolution/map001_run_state_reducer_r1.mjs
```

## 2. Frontera de responsabilidad

El reducer decide únicamente el estado del resolver.

```text
inputs normalizados
→ reducer determinista
→ state
```

No realiza:

- generación de repair;
- persistencia transaccional;
- creación de child proposals;
- ejecución del validator de dominio;
- lectura directa de authority files;
- autorización para ASC;
- ejecución de ASC.

La obtención real de observaciones `SYSTEM_ERROR` y `AUTHORITY_CHANGED` permanece upstream del reducer y deberá integrarse en el orquestador.

## 3. Precedencia ejecutada

El reducer implementa la precedencia congelada en Semantic Contract R2:

```text
1 SYSTEM_ERROR
2 AUTHORITY_CHANGED
3 CYCLE_DETECTED
4 READY_TO_VALIDATE
5 AUTHORITY_BLOCKED
6 OPEN_BLOCKED
7 DOMAIN_PASS
8 REGRESSION
9 STALLED
10 MAX_ITERATIONS
11 READY_TO_REPAIR
```

`REGRESSION`, `STALLED` y `MAX_ITERATIONS` se evalúan exclusivamente cuando el último validation-report es `REJECT_FIXABLE`.

## 4. Controles fail-closed incluidos

Antes de interpretar el resultado de dominio, el reducer comprueba:

```text
iterations contiguas
candidateHistory alineado por iteración
candidateSha256 estructuralmente válido
repair solo sobre REJECT_FIXABLE
repair durable siempre seguido por child iteration
validation-report requerido presente
reportId/status coinciden con binding
logical SHA-256 del report coincide con binding
state.currentIteration coincide con última iteración
```

Una violación produce `SYSTEM_ERROR`.

## 5. Cycle detection

El reducer usa exclusivamente:

```text
candidateHistory[].candidateSha256
```

La iteración actual se compara contra todas las anteriores. Si existe repetición:

```text
CYCLE_DETECTED
repeatedCandidateSha256 = hash actual
firstSeenIteration = primera aparición previa
```

No se usa proposal artifact hash.

## 6. Regression

Solo existe regresión cuando:

1. la iteración actual es `REJECT_FIXABLE`;
2. la iteración anterior contiene un repair;
3. su validation-report es el repair-basis inmediato;
4. el report actual introduce al menos una finding-signature que no estaba en ese basis.

Finding-signature:

```text
{
  disposition,
  code,
  targetPaths ordenados
}
```

## 7. STALLED

El fingerprint de findings es:

```text
SHA-256(
  lista ordenada de finding-signatures canonicalizadas
)
```

El reducer cuenta hacia atrás el máximo tramo consecutivo de reports `REJECT_FIXABLE` con exactamente el mismo fingerprint.

Si:

```text
repeatCount >= stallRepeatThreshold
```

entonces:

```text
STALLED
repeatCount = conteo máximo consecutivo real
```

## 8. MAX_ITERATIONS

Se emite solo después de descartar:

```text
REGRESSION
STALLED
```

y únicamente cuando:

```text
latest status = REJECT_FIXABLE
currentIteration >= maxIterations
```

## 9. DOMAIN_PASS y ASC

El reducer devuelve:

```text
PASS
→ DOMAIN_PASS
```

No devuelve ni crea:

```text
AUTHORIZED_FOR_ASC
```

Por tanto:

```text
DOMAIN_PASS != AUTHORIZED_FOR_ASC
```

permanece preservado por construcción.

## 10. Pruebas

La primera ejecución de la suite E4.2 pasó funcionalmente, pero una auditoría posterior detectó que los fixtures de `run-state` y `validation-report` no estaban siendo validados todavía contra Run State R4 y Validation Report R1 reales. Eso podía permitir que una transición correcta se probara sobre un fixture estructuralmente inválido.

Se corrigió antes del cierre de E4.2 mediante:

```text
tools/proposal-resolution/validate_e4_reducer_contracts.py
```

La suite ahora valida, para cada caso, tanto los artefactos de entrada como el `state` resultante embebido nuevamente en Run State R4. Los reports usados por las pruebas contienen el control-plane obligatorio de Validation Report R1 y los findings compatibles con cada status.

Archivo funcional:

```text
tools/proposal-resolution/map001_run_state_reducer_r1.test.mjs
```

Casos cubiertos:

```text
READY_TO_VALIDATE
AUTHORITY_BLOCKED
OPEN_BLOCKED
DOMAIN_PASS
READY_TO_REPAIR
SYSTEM_ERROR precedence
AUTHORITY_CHANGED precedence
A→B→A cycle
REGRESSION
STALLED exact repeatCount
MAX_ITERATIONS
repair-child atomicity violation
validation-report hash mismatch
```

Las pruebas se integran al workflow:

```text
.github/workflows/map001-proposal-validation.yml
```

## 11. Papel de ASC

ASC se usa únicamente como control de frontera arquitectónica.

E4.2 confirma:

```text
resolver reducer
→ decide estado del ciclo

domain validator
→ produce resultado de dominio

ASC
→ no decide estados
→ no cierra OPEN
→ no autoriza DOMAIN_PASS
→ permanece compile-only
```

No corresponde modificar `tools/asc/compile_asc.mjs`.

## 12. AUDITORÍA

El reducer implementa directamente la precedencia y reglas congeladas en E4.1 sin introducir estados nuevos ni duplicar autoridad MAP-001.

La auditoría detectó una brecha de prueba, no una falla del reducer: los fixtures iniciales no eran contract-validated contra R4/R1. La brecha fue corregida haciendo que cada prueba funcional pase además por los schemas reales antes de aceptar el resultado.

Las comprobaciones de estructura interna y binding de validation-reports continúan fallando cerrado antes de interpretar estados de dominio.

## 13. INCONSISTENCIAS

No se detecta una inconsistencia conceptual nueva en la traducción de R4/R2 al reducer.

Se detectó y corrigió una inconsistencia metodológica en la evidencia de prueba: tests funcionales PASS no bastaban para demostrar que los fixtures cumplían los contratos reales. La nueva capa contractual elimina esa ambigüedad.

La validez final de ejecución queda pendiente de los checks externos sobre el head corregido.

## 14. VACÍOS / OMISIONES

E4.2 no implementa todavía el orquestador completo.

Queda fuera de alcance:

```text
provenance I/O real
validator invocation
repair agent
repair application
atomic persistence
child proposal materialization
loop execution
resume/recovery
authorization gate hacia ASC
```

Estos componentes corresponden a etapas posteriores de E4/E5.

## 15. REDUNDANCIAS

El reducer no reimplementa reglas geométricas MAP-001. Consume statuses y findings ya producidos por validadores.

La función `logicalSha256` se reutiliza desde el adapter E3 para mantener una sola implementación vigente de canonicalización lógica en este dominio.


## 16. Evidencia de ejecución

Head validado:

```text
e2f9a00d5fd1c2c1b004f1359b4f14166d9322fb
```

Checks externos:

```text
Audit Protocol Check                 PASS
CI                                   PASS
MAP-001 Proposal Validation Gate     PASS
```

Regresión y validación específica:

```text
MAP-001 authority-runtime            21/21 PASS
proposal validation adapter          10/10 PASS
E2/E3 real integration                8/8 PASS
Run State R4 + Semantic R2               PASS
E4.2 deterministic reducer           13/13 PASS
```

La suite E4.2 final usa fixtures contract-valid contra Run State R4 y Validation Report R1 y valida también el state resultante reinyectado en R4.

Resultado:

```text
E4.2
PASS
CLOSED
```

La aprobación humana explícita fue recibida después de la validación técnica y contractual del head corregido. E4.2 queda formalmente cerrado.
