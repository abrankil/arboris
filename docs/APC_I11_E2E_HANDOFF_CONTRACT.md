# Árboris — APC I11 E2E Handoff Contract

**ID:** `ARBORIS_APC_I11_E2E_HANDOFF_CONTRACT_R3.1`  
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
3. construye `selectedEvidenceCandidates` con evidencia `current=true`, `lifecycleStatus='CONFIRMED'` y del individuo solicitado;
4. valida cada candidato con `validateApcEvidenceForHandoff()`;
5. si un candidato falla ese contrato, la ejecución falla explícitamente;
6. define `selectedApcEvidence` como el conjunto completo de candidatos que sí pasan el contrato APC de handoff;
7. adapta cada item de `selectedApcEvidence` a CharacterObservation;
8. evalúa separadamente si cada CharacterObservation es ACE-eligible;
9. entrega a `assessIdentification()` sólo el subset ACE-eligible;
10. conserva trazabilidad explícita de cualquier evidencia APC seleccionada que sea válida para handoff pero no ACE-eligible.

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

I11 distingue obligatoriamente tres niveles:

```text
SELECTED_EVIDENCE_CANDIDATE
= current + CONFIRMED + individual objetivo

APC_HANDOFF_ELIGIBLE
= SELECTED_EVIDENCE_CANDIDATE
  + validateApcEvidenceForHandoff() = valid

ACE_ELIGIBLE
= APC_HANDOFF_ELIGIBLE
  + carácter computable por ACE
```

`selectedEvidenceCandidates` existe sólo como etapa interna de selección y no necesita exponerse en el resultado.

Si un `SELECTED_EVIDENCE_CANDIDATE` falla `validateApcEvidenceForHandoff()`, I11 falla explícitamente: no pertenece a `selectedApcEvidence` y no puede convertirse en `excludedFromAce`.

Una evidencia `APC_HANDOFF_ELIGIBLE` pero no `ACE_ELIGIBLE` no se transforma en evidencia positiva, no se omite silenciosamente y no aborta por sí sola toda la ejecución. Debe registrarse en `excludedFromAce` con una razón explícita derivada del contrato ACE.

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

La pertenencia de un pending al contexto del individuo objetivo se determina únicamente por estas reglas:

```text
UNRESOLVED_REQUIREMENT

scopeLevel = INDIVIDUAL
→ incluir iff scopeRef = target individualId

scopeLevel = PHOTO
→ incluir iff propagation[] contiene
  { level: INDIVIDUAL, ref: target individualId }

scopeLevel = SESSION
→ no incluir en context.pending individual

REPRESENTATION_GAP

sourceLevel = INDIVIDUAL
→ incluir iff sourceRef = target individualId

sourceLevel = SESSION
→ no incluir en context.pending individual
```

No se infiere pertenencia individual a partir de que una PHOTO contenga varios `individualRefs`; la atribución debe estar expresada por scope o propagation.

La propagación canónica I8 es estrictamente ascendente `PHOTO → INDIVIDUAL → SESSION`. Por ello un pending cuyo origen ya es `SESSION` nunca puede adquirir pertenencia individual mediante propagation y no se atribuye a `context.pending` de un individuo.

Un pending crítico pertenece al gate APC/PASS; I11 no lo transforma en observación botánica.

## 8. Hypothesis e identidad

I11 no introduce ni interpreta un contrato provisional de identificación porque el schema APC canónico actual no define una ubicación o forma normativa para `speciesHypothesis`, `workingSpeciesId` o equivalentes.

Por tanto, en R3.1.1:

```text
context.provisionalHypothesis = null
```

de forma obligatoria.

I11 no inspecciona campos ad hoc de hypothesis presentes en objetos libres y no los usa como evidencia positiva ni para restringir candidatos.

Sólo un `candidateIds` explícito suministrado por el caller puede limitar el conjunto inicial de candidatos.

La exposición de una hipótesis provisional queda fuera de I11 hasta que exista un contrato APC canónico específico.

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

- `selectedApcEvidence` contiene exactamente la evidencia del individuo objetivo que además pasa `validateApcEvidenceForHandoff()`;
- `handoffEvidence` contiene exactamente el subset ACE-eligible convertido a evidencia ACE;
- `excludedFromAce` contiene sólo evidencias APC handoff-eligible pero no ACE-eligible;
- cada item de `excludedFromAce` tiene forma mínima estable:
  ```js
  {
    evidenceId,
    revision,
    characterId,
    reason,
    canonicalStatus
  }
  ```
- `reason` y `canonicalStatus` se derivan directamente de `assessAceEligibility()`;
- `unknown_character` no es exclusión recuperable: es error de dataset/adaptación;
- `non_computable_character` sí se registra en `excludedFromAce`;
- `aceAssessment` es el resultado directo de `assessIdentification()`;
- `context.contradictions` contiene sólo episodios APC cuyo `individualId` coincide con el objetivo;
- `context.pending` se construye exclusivamente con el predicate de §7;
- `context.provisionalHypothesis` es siempre `null` en R3.1.

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

El orden canónico del contexto es:

```text
context.contradictions
→ contradictionId

context.pending
→ pendingId
```

Ninguno de estos arrays depende del orden accidental de sus arrays fuente en la sesión.

I11 no reordena `candidateIds`: el array explícito se entrega a ACE sin sorting adicional, de modo que ACE pueda aplicar su contrato canónico de deduplicación conservando el orden de primera aparición.

## 11. Fallos explícitos

I11 debe fallar explícitamente cuando:

- la sesión APC es inválida;
- el `individualId` no existe;
- cualquier `SELECTED_EVIDENCE_CANDIDATE` falla `validateApcEvidenceForHandoff()`;
- cualquier `selectedApcEvidence` no puede adaptarse por el contrato APC/H16;
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
→ context.pending aplica exactamente el predicate de §7

T-I11-11
campos ad hoc de speciesHypothesis / workingSpeciesId presentes en objetos libres
→ ignorados por I11
→ context.provisionalHypothesis = null
→ no limitan candidateIds implícitamente

T-I11-12
candidateIds explícito
→ se respeta por ACE

T-I11-13
invalid individualId
→ fallo explícito

T-I11-14
SELECTED_EVIDENCE_CANDIDATE que falla validateApcEvidenceForHandoff()
→ fallo explícito
→ no entra en selectedApcEvidence
→ no entra en excludedFromAce

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
pending con scope/source SESSION
→ no se atribuye a context.pending del individuo objetivo

T-I11-18
photoEvidenceRef
→ preservado exactamente en provenance.apc.photoEvidenceRef hasta ACE
```

## 13. Criterio de cierre I11

I11 puede considerarse implementado cuando:

- existe una función E2E explícita de verificación APC → H16 → ACE sin constituir integración runtime H17;
- current+CONFIRMED del individuo objetivo define sólo los candidatos internos de selección;
- `selectedApcEvidence` contiene exclusivamente candidatos que pasan `validateApcEvidenceForHandoff()`;
- un candidato que falla handoff provoca error explícito y no se reclasifica como exclusión ACE;
- sólo el subset ACE-eligible entra en `handoffEvidence`;
- evidencia APC handoff-eligible pero no ACE-eligible queda explícita en `excludedFromAce` con forma estable;
- DRAFT e históricos quedan excluidos;
- provenance se preserva, incluido `photoEvidenceRef`;
- contradicciones se preservan sin resolución automática;
- pending/gaps no se convierten en evidencia positiva y `context.pending` aplica el predicate congelado de §7;
- `context.provisionalHypothesis` permanece `null` hasta existir contrato APC canónico;
- `candidateIds` sólo se restringe explícitamente;
- la salida ACE es resultado directo del motor canónico;
- T-I11-01..18 pasan;
- I1–I10 permanecen verdes;
- `npm test` pasa;
- la auditoría del diff no encuentra blockers;
- el cambio se integra mediante PR aprobado.

### AUDITORÍA

R3.1 mantiene la frontera epistemológica definida por H16/APC y H15/ACE: APC captura y confirma observaciones; el adaptador conserva el significado observacional; ACE evalúa compatibilidad e identificación. I11 funciona exclusivamente como verification harness E2E y no adelanta la integración runtime de H17. R3.1 además separa selección preliminar, handoff APC válido y elegibilidad ACE.

### INCONSISTENCIAS

R3.1 resuelve la inconsistencia detectada en R3 entre el predicate de `context.pending` y la propagación I8 estrictamente ascendente: los pending de origen SESSION no se atribuyen a individuos. También congela el orden determinista de `context.contradictions` y `context.pending`, y elimina la regresión redundante sobre `non_computable_character`. Mantiene las correcciones heredadas de R2/R3 sobre selección, handoff, ACE eligibility, H16/H17, PASS/EXPORTABLE, determinismo y provenance.

### VACÍOS / OMISIONES

R3.1 no define persistencia de una identificación resultante, UI, política de cierre de Gate B, integración runtime de H17, contrato de hypotheses provisionales ni flujo multi-individuo agregado. Esos puntos quedan fuera de I11.

### REDUNDANCIAS

I11 no redefine validadores de APC, CharacterObservation ni ACE. Debe componer `validateApcSession()`, el adaptador APC existente y `assessIdentification()` en lugar de duplicarlos. La regresión duplicada sobre `non_computable_character` fue eliminada en R3.1.1.
