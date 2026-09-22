# Árboris — APC I11 E2E Handoff Contract

**ID:** `ARBORIS_APC_I11_E2E_HANDOFF_CONTRACT_R2`  
**Estado:** CANDIDATO A VALIDACIÓN CON ASC.  
**Ámbito:** Hito 16 / APC I11.  
**Base canónica:** `main@805890c3c11f9de82922ac89e1369b7324a6e223`.  
**No autoriza:** merge a `main`, I12, Gate B ni cierre del Hito 16.

## 1. Objetivo

I11 demuestra end-to-end que evidencia APC válida puede atravesar, sin pérdida epistemológica ni reinterpretación botánica:

```text
APC_SESSION
→ current CONFIRMED APC_EVIDENCE
→ CharacterObservation H16
→ ACE evidence
→ assessIdentification()
```

I11 es un **verification harness E2E** entre contratos existentes. No constituye integración runtime o de producto de H17, no cambia el roadmap y no materializa el flujo completo visión → identificación. No introduce un clasificador de especies, no convierte una fotografía en identificación directa y no modifica conocimiento botánico canónico.

## 2. Unidad de ejecución

La ejecución I11 se realiza para exactamente un `individualId` dentro de una sesión APC.

Entrada mínima conceptual:

```js
runApcIndividualThroughAce({
  dataset,
  session,
  individualId,
  candidateIds?
})
```

La función:

1. valida la integridad estructural de la sesión mediante `validateApcSession()`;
2. valida que `individualId` exista;
3. selecciona únicamente revisiones `current=true`;
4. selecciona únicamente evidencia `lifecycleStatus='CONFIRMED'`;
5. selecciona únicamente evidencia del individuo solicitado;
6. adapta cada evidencia seleccionada a CharacterObservation;
7. evalúa separadamente si cada CharacterObservation es ACE-eligible;
8. entrega a `assessIdentification()` sólo el subset ACE-eligible;
9. conserva trazabilidad explícita de cualquier evidencia APC seleccionada que no sea ACE-eligible.

I11 **no requiere** `session.status=CLOSED`, `EXPORTABLE=true` ni `PASS=true`. PASS/EXPORTABLE siguen siendo gates APC distintos del handoff técnico. Una sesión estructuralmente válida puede ser usada por I11 aunque mantenga pending no críticos, contradictions u objectiveAssessment no satisfecho, siempre que la evidencia individual que cruce el handoff cumpla sus propios contratos.

## 3. Elegibilidad de evidencia

Sólo evidencia que cumple simultáneamente:

```text
current = true
lifecycleStatus = CONFIRMED
individualId = target individualId
```

puede cruzar el handoff.

Consecuencias:

- DRAFT nunca entra a ACE.
- revisiones históricas `current=false` nunca entran a ACE.
- evidencia de otro individuo nunca entra a ACE.
- una sesión puede contener evidencia válida de múltiples individuos sin contaminación cruzada.

El handoff reutiliza `validateApcEvidenceForHandoff()`; I11 no crea una segunda definición de elegibilidad APC.

I11 distingue obligatoriamente dos niveles:

```text
APC_HANDOFF_ELIGIBLE
= current + CONFIRMED + individual objetivo + contrato APC válido

ACE_ELIGIBLE
= APC_HANDOFF_ELIGIBLE
  + carácter computable por ACE
```

Una evidencia APC válida pero no ACE-eligible no se transforma en evidencia positiva, no se omite silenciosamente y no aborta por sí sola toda la ejecución. Debe registrarse en `excludedFromAce` con una razón explícita derivada del contrato ACE.

## 4. Estados observacionales

Los estados APC se conservan mediante el adaptador H16:

```text
OBSERVED        → observed
UNCERTAIN       → uncertain
NOT_OBSERVABLE  → not_observable
```

Para ACE:

- `OBSERVED` puede aportar estados observados;
- `UNCERTAIN` no aporta un estado botánico positivo;
- `NOT_OBSERVABLE` no aporta un estado botánico positivo.

`sin dato`, incertidumbre y no observabilidad no equivalen a ausencia.

## 5. Provenance y trazabilidad

Cada item entregado a ACE debe conservar provenance suficiente para reconstruir al menos:

```text
sessionId
evidenceId
revision
individualId
sourceType
sourceId
confirmation
photoEvidenceRef
```

`photoEvidenceRef` debe preservarse dentro de `provenance.apc.photoEvidenceRef` antes de construir la evidencia ACE. I11 no depende de un campo top-level nuevo en ACE para esta trazabilidad.

I11 no aplana múltiples evidencias a un único valor por carácter antes de ACE.

## 6. Contradicciones

I11 preserva todas las evidencias current+CONFIRMED elegibles, incluso si existen valores incompatibles para el mismo carácter.

`contradictions[]` es contexto APC y no se convierte en evidencia positiva adicional ni genera un tercer item ACE derivado del episodio de contradicción.

I11 no:

- selecciona una evidencia ganadora;
- elimina una de las observaciones incompatibles;
- resuelve una contradicción;
- inventa un estado conciliado.

ACE recibe la evidencia observacional real y aplica su contrato de compatibilidad.

## 7. Pending y representation gaps

`pending[]` y `REPRESENTATION_GAP` no se convierten en evidencia ACE.

Se exponen únicamente en `context.pending` como contexto diagnóstico no positivo. No deben incrementar dimensiones evaluables ni eliminar candidatos.

Un pending crítico pertenece al gate APC/PASS; I11 no lo transforma en observación botánica.

## 8. Hypothesis e identidad

Una `speciesHypothesis` o identificación provisional, cuando exista en el individuo/sesión, no se usa como evidencia positiva para ACE ni restringe silenciosamente `candidateIds`. Puede exponerse únicamente como `context.provisionalHypothesis`.

Sólo un `candidateIds` explícito suministrado por el caller puede limitar el conjunto inicial de candidatos.

I11 no convierte una hipótesis en identificación formal.

## 9. Resultado E2E

El resultado debe distinguir al menos:

```js
{
  individualId,
  selectedApcEvidence,
  handoffEvidence,
  excludedFromAce,
  aceAssessment,
  context: {
    contradictions,
    pending,
    provisionalHypothesis
  }
}
```

donde:

- `selectedApcEvidence` contiene exactamente la evidencia APC current+CONFIRMED del individuo objetivo;
- `handoffEvidence` contiene exactamente el subset ACE-eligible convertido a evidencia ACE;
- `excludedFromAce` contiene las evidencias APC seleccionadas que no son ACE-eligible y su razón explícita;
- `aceAssessment` es el resultado directo de `assessIdentification()`;
- `context.contradictions` contiene sólo episodios APC relevantes al individuo objetivo;
- `context.pending` contiene sólo pending APC relevantes al individuo objetivo o propagados desde él;
- `context.provisionalHypothesis` es diagnóstico y nunca restringe candidatos por sí mismo.

No se persiste una identificación nueva dentro de APC como efecto lateral de I11.

## 10. Determinismo

Con el mismo:

```text
dataset
session snapshot
individualId
candidateIds
```

I11 debe producir el mismo handoff y el mismo resultado ACE.

El orden canónico de `selectedApcEvidence`, `handoffEvidence` y `excludedFromAce` es:

```text
characterId
→ evidenceId
→ revision
```

No depende del orden accidental de `session.evidence[]`.

I11 no reordena `candidateIds`: el array explícito se entrega a ACE sin sorting adicional, de modo que ACE pueda aplicar su contrato canónico de deduplicación conservando el orden de primera aparición.

## 11. Fallos explícitos

I11 debe fallar explícitamente cuando:

- la sesión APC es inválida;
- el `individualId` no existe;
- una evidencia seleccionada que declara ser ACE-eligible no puede adaptarse por el contrato APC/H16;
- un carácter desconocido para el dataset impide adaptar la evidencia y produce fallo explícito;
- un carácter conocido pero no computable para ACE se registra en `excludedFromAce` y no aborta por sí solo la ejecución;
- `candidateIds` contiene especies desconocidas;
- una dependencia necesaria para ACE es inválida.

No se omiten silenciosamente evidencias seleccionadas que fallen adaptación.

## 12. Regresiones mínimas

La suite I11 debe demostrar como mínimo:

```text
T-I11-01
CONFIRMED + current + OBSERVED
→ llega a ACE con provenance completa, incluido provenance.apc.photoEvidenceRef

T-I11-02
DRAFT
→ excluido

T-I11-03
current=false histórico
→ excluido

T-I11-04
evidencia de otro individuo
→ excluida

T-I11-05
UNCERTAIN confirmado
→ llega como no-resolved / no estado positivo

T-I11-06
NOT_OBSERVABLE confirmado
→ llega como no-resolved / no estado positivo

T-I11-07
dos caracteres evaluables compatibles
→ ACE puede producir supported según contrato H15

T-I11-08
dos observaciones del mismo carácter
→ siguen contando como una dimensión para supported

T-I11-09
contradictory confirmed evidence
→ ambas evidencias preservadas
→ contradictions[] no genera evidencia ACE adicional
→ I11 no elige ganadora

T-I11-10
pending / representation gap
→ no se transforma en evidencia ACE

T-I11-11
speciesHypothesis
→ no limita candidateIds implícitamente

T-I11-12
candidateIds explícito
→ se respeta por ACE

T-I11-13
invalid individualId
→ fallo explícito

T-I11-14
evidencia seleccionada inválida
→ fallo explícito, no drop silencioso

T-I11-15
dos snapshots semánticamente equivalentes con distinto orden de session.evidence[]
→ mismo orden canónico de salida
→ mismo resultado ACE

T-I11-16
APC_HANDOFF_ELIGIBLE pero carácter conocido no computable por ACE
→ excludedFromAce con razón explícita
→ no drop silencioso
→ no aborto global por sí solo

T-I11-17
photoEvidenceRef
→ preservado exactamente en provenance.apc.photoEvidenceRef hasta ACE
```

## 13. Criterio de cierre I11

I11 puede considerarse implementado cuando:

- existe una función E2E explícita de verificación APC → H16 → ACE sin constituir integración runtime H17;
- sólo current+CONFIRMED del individuo objetivo entra en `selectedApcEvidence`;
- sólo el subset ACE-eligible entra en `handoffEvidence`;
- evidencia APC válida pero no ACE-eligible queda explícita en `excludedFromAce`;
- DRAFT e históricos quedan excluidos;
- provenance se preserva, incluido `photoEvidenceRef`;
- contradicciones se preservan sin resolución automática;
- pending/gaps/hypotheses no se convierten en evidencia positiva;
- `candidateIds` sólo se restringe explícitamente;
- la salida ACE es resultado directo del motor canónico;
- T-I11-01..17 pasan;
- I1–I10 permanecen verdes;
- `npm test` pasa;
- la auditoría del diff no encuentra blockers;
- el cambio se integra mediante PR aprobado.

### AUDITORÍA

R2 mantiene la frontera epistemológica definida por H16/APC y H15/ACE: APC captura y confirma observaciones; el adaptador conserva el significado observacional; ACE evalúa compatibilidad e identificación. I11 funciona exclusivamente como verification harness E2E y no adelanta la integración runtime de H17.

### INCONSISTENCIAS

No quedan inconsistencias contractuales conocidas de R1 sin tratamiento. R2 separa APC_HANDOFF_ELIGIBLE de ACE_ELIGIBLE, desacopla I11 de PASS/EXPORTABLE, congela el orden canónico de salida y exige preservar photoEvidenceRef dentro de provenance.apc.

### VACÍOS / OMISIONES

R2 no define persistencia de una identificación resultante, UI, política de cierre de Gate B, integración runtime de H17 ni flujo multi-individuo agregado. Esos puntos quedan fuera de I11.

### REDUNDANCIAS

I11 no redefine validadores de APC, CharacterObservation ni ACE. Debe componer `validateApcSession()`, el adaptador APC existente y `assessIdentification()` en lugar de duplicarlos.
