# ASC — R5 Execution Operator Runbook 001

**Experimento:** ASC-R5-CLAIM-PROVENANCE-CONTRAST-001  
**Rol:** operador/orquestador  
**Estado:** procedimiento de ejecución; R5 aún no ejecutado  
**Autoridad:** subordinado al Design v3, manifest v3 y Execution Visibility Protocol 001

## 1. Objetivo

Ejecutar R5 sin contaminar el cegamiento ya validado.

El operador puede conocer la asignación experimental. Los productores y el auditor no.

## 2. Preasignación ciega X/Y

Antes de ver cualquier output se fija:

```text
OUTPUT X = output íntegro de PACKAGE A
OUTPUT Y = output íntegro de PACKAGE B
```

Según el manifest v3, la asignación experimental subyacente es:

```text
PACKAGE A = CONTROL
PACKAGE B = TREATMENT
```

Esta información NO debe entregarse al auditor antes de que cierre las evaluaciones individuales de X e Y.

## 3. Producer A

Abrir un chat/contexto completamente nuevo.

Usar únicamente:

- `R5_FRESH_PRODUCER_A_HANDOFF_001.md`;
- `R5_SOURCE_001.svg`.

No compartir historial, repo, manifest, rúbrica, otro output ni resultado esperado.

Usar una única ejecución. No regenerar para escoger una respuesta mejor.

Registrar metadata y output íntegro en una copia de:

`R5_EXECUTION_RECORD_TEMPLATE_001.md`

con:

```text
ROLE = PRODUCER_A
BLIND_OUTPUT_ID = X
```

## 4. Producer B

Abrir otro chat/contexto completamente nuevo.

Usar únicamente:

- `R5_FRESH_PRODUCER_B_HANDOFF_001.md`;
- `R5_SOURCE_001.svg`.

Debe usar el mismo modelo/versión o agente y la misma configuración disponible utilizada en Producer A.

Usar una única ejecución.

Registrar metadata y output íntegro en otra copia del template con:

```text
ROLE = PRODUCER_B
BLIND_OUTPUT_ID = Y
```

## 5. Verificación antes de auditoría

Antes de abrir el auditor, comprobar:

- A y B usaron contextos separados;
- mismo modelo/versión o agente;
- configuración equivalente;
- fuente idéntica;
- no hubo regeneración selectiva;
- outputs íntegros conservados;
- X corresponde a A y Y corresponde a B;
- ninguna marca CONTROL/TREATMENT fue añadida al contenido X/Y.

Si alguna condición falla, detener y registrar `EXECUTION INVALID / REASON OPEN FOR AUDIT`. No corregir retrospectivamente los outputs.

## 6. Auditor ciego

Abrir un tercer chat/contexto completamente nuevo.

Entregar únicamente:

- `R5_FRESH_AUDITOR_HANDOFF_001.md`;
- output X íntegro;
- output Y íntegro.

No entregar:

- este runbook;
- manifest;
- repo;
- packages A/B;
- asignación X/Y;
- asignación CONTROL/TREATMENT;
- auditorías de diseño;
- resultado esperado.

El auditor debe cerrar primero X y después Y y detenerse para pedir revelación.

## 7. Revelación

Solo después de que el auditor haya cerrado X e Y, responder exactamente con la información necesaria:

```text
X = PACKAGE A = CONTROL
Y = PACKAGE B = TREATMENT
```

El auditor puede entonces emitir la interpretación final del contraste.

No añadir argumentos, explicación ni expectativa de resultado durante la revelación.

## 8. Captura

Conservar íntegramente:

- metadata Producer A;
- output Producer A / X;
- metadata Producer B;
- output Producer B / Y;
- evaluación pre-reveal de X;
- evaluación pre-reveal de Y;
- solicitud de reveal del auditor;
- reveal entregado;
- interpretación final del auditor.

Usar `R5_BLIND_AUDIT_RECORD_TEMPLATE_001.md` para el registro de auditoría.

## 9. Retorno a ASC

Solo después de completar los pasos anteriores, volver al contexto de coordinación ASC con los registros íntegros.

El siguiente gate será:

```text
RAW EXECUTION EVIDENCE
→ protocol compliance audit
→ result audit
→ sentinel review
→ ASC interpretation validation
→ R5 closeout or INVALID/REPEAT decision
```

No abrir R6/R7 durante esta ejecución.
