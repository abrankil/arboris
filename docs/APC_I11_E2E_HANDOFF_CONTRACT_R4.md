# Árboris — APC I11 E2E Handoff Contract R4

**ID:** `ARBORIS_APC_I11_E2E_HANDOFF_CONTRACT_R4`  
**Estado:** VALIDATED WITH ASC / FROZEN.  
**Ámbito:** Hito 16 / APC I11.  
**Base:** I11 R3.1 integrado en `main`.  
**No autoriza:** Gate B, I12, cierre de Hito 16 ni integración runtime H17.

## 1. Objetivo

R4 conserva el handoff E2E APC → CharacterObservation → ACE de R3.1 y corrige una frontera: una serie `(individualId, characterId)` con contradicción operacional `OPEN` no debe participar temporalmente en la discriminación ACE.

La corrección es no destructiva:

```text
contradiction OPEN
→ conservar evidencia APC
→ conservar provenance
→ conservar episodio I9
→ suspender esa dimensión del handoff ACE
→ continuar con los demás characterId
```

R4 no decide cuál evidencia es correcta, no crea consenso y no convierte contradicciones en conocimiento botánico.

## 2. Autoridades y precedencia

- APC I9 define existencia, serie, estado y provenance de contradicciones.
- I11 define el handoff técnico hacia ACE.
- ACE evalúa únicamente la evidencia recibida.
- El Master Botánico y capas autorizadas siguen gobernando conocimiento botánico y variabilidad.

R4 no modifica I9 ni la lógica interna de ACE.

## 3. Precondiciones

Antes del handoff:

1. `APC_SESSION` debe ser estructuralmente válida.
2. `individualId` debe existir.
3. Si la sesión contiene contradicciones, su semántica debe validarse mediante `validateApcContradictions()` y una función externa `areStatesIncompatible`.
4. I11 no infiere incompatibilidad mediante desigualdad de strings.

Una sesión con contradicciones que no pueda validarse semánticamente falla explícitamente; no produce un handoff silenciosamente filtrado.

## 4. Selección APC

`selectedEvidenceCandidates` conserva R3.1:

```text
current = true
lifecycleStatus = CONFIRMED
individualId = target individualId
```

Cada candidata debe superar `validateApcEvidenceForHandoff()`.

`selectedApcEvidence` contiene todas las candidatas válidas, incluidas aquellas cuyo `characterId` esté suspendido por una contradicción `OPEN`.

## 5. Serie suspendida

La unidad de suspensión es exactamente:

```text
(target individualId, characterId)
```

Se deriva de:

```text
contradiction.status = OPEN
AND contradiction.individualId = target individualId
```

Una contradicción de otro individuo no afecta al individuo objetivo.

Una contradicción `RESOLVED` es histórica y no produce suspensión actual.

## 6. Suspensión de dimensión

Si existe una contradicción `OPEN` para `(target individualId, CH-X)`:

- toda evidencia seleccionada de `CH-X` queda fuera de `handoffEvidence`;
- la suspensión aplica a la dimensión completa, incluyendo observaciones `OBSERVED`, `UNCERTAIN` y `NOT_OBSERVABLE` seleccionadas;
- ninguna evidencia se borra, sustituye, fusiona o reescribe;
- no se selecciona una evidencia ganadora;
- no se crea un estado conciliado.

## 7. handoffEvidence

`handoffEvidence` contiene sólo evidencia que:

1. pertenece al individuo objetivo;
2. es `current + CONFIRMED`;
3. supera APC handoff;
4. pertenece a un `characterId` sin contradicción `OPEN` para ese individuo;
5. es ACE-eligible.

Sólo este conjunto se entrega a `assessIdentification()`.

`candidateIds` explícitos del caller no son alterados por esta política.

## 8. excludedFromAce

R4 amplía explícitamente la semántica de `excludedFromAce`.

Forma mínima:

```js
{
  evidenceId,
  revision,
  characterId,
  exclusionCategory,
  reason,
  contradictionId,
  canonicalStatus
}
```

Clases autorizadas en R4:

```text
ACE_ELIGIBILITY / non_computable_character
APC_OPERATIONAL / open_contradiction
```

Reglas:

- `open_contradiction` requiere `contradictionId`;
- `non_computable_character` usa `contradictionId = null`;
- `unknown_character` sigue siendo error y no una exclusión recuperable;
- `contradictionId` es provenance de la causa, no una segunda fuente de verdad;
- si varias evidencias de una misma dimensión están suspendidas, cada evidencia genera su propio registro derivado en `excludedFromAce`.

## 9. RESOLVED e historia

`RESOLVED`:

- no bloquea el carácter actual;
- no rehabilita revisiones `current=false`;
- no añade evidencia;
- permanece como contexto histórico.

La selección vigente sigue dependiendo de `current=true`.

## 10. No persistencia derivada

No se agregan a `APC_EVIDENCE` banderas persistidas como:

```text
blockedFromAce
safeForAce
contradictionBlocked
```

La exclusión se deriva en tiempo de ejecución desde `contradictions[]`, `individualId` y `characterId`.

## 11. Regresión mínima R4

La validación debe demostrar al menos:

- sin contradicción OPEN, comportamiento R3.1;
- OPEN suspende sólo la dimensión conflictiva;
- evidencia suspendida permanece en `selectedApcEvidence`;
- exclusión queda trazada en `excludedFromAce`;
- otros caracteres continúan hacia ACE;
- otro individuo no se contamina;
- RESOLVED no bloquea evidencia current;
- RESOLVED no revive revisiones históricas;
- OPEN suspende la dimensión completa;
- `candidateIds` no se modifica;
- contradicción incoherente falla;
- sesión con contradicciones requiere semántica externa;
- `unknown_character` sigue siendo error;
- regresiones I1–I11 previas permanecen verdes.

## 12. No objetivos

R4 no:

- modifica el Master Botánico;
- redefine variabilidad botánica;
- modifica I9;
- redefine `supported`;
- redefine `resolved`;
- implementa consenso;
- implementa I12 UI;
- cierra Gate B;
- cierra Hito 16;
- implementa runtime H17.

## 13. AUDITORÍA

La corrección queda limitada a la frontera I9 → I11. Preserva la evidencia original y reduce temporalmente el conjunto de evidencia que ACE puede consumir cuando APC registra un conflicto operacional vigente.

## 14. INCONSISTENCIAS

La inconsistencia de R3.1 —enviar a ACE todas las evidencias de una dimensión ya registrada como contradicción OPEN— queda corregida por suspensión derivada de la serie.

## 15. VACÍOS / OMISIONES

No se resuelve aquí si una contradicción representa variabilidad natural, error o diferencia observacional. Esa interpretación pertenece a curación y autoridades botánicas. R4 sólo aplica una política conservadora de handoff.

## 16. REDUNDANCIAS

No se crea una segunda fuente de contradicciones. `contradictions[]` sigue siendo la fuente APC; `excludedFromAce[]` sólo explica por qué una evidencia concreta no cruzó el handoff.


## 17. VALIDACIÓN FINAL ASC

Validación ejecutada sobre la implementación R4 integrada en la rama `h16/apc-i11-r4-contradiction-safe-handoff`.

Resultado:

```text
AUDITORÍA             PASS
INCONSISTENCIAS       PASS
VACÍOS / OMISIONES    PASS
REDUNDANCIAS          PASS
BLOCKERS              0
```

Verificación ejecutable:

- CI #204 → PASS;
- canonical tests / `npm test` → PASS;
- Audit Protocol Check #136 → PASS;
- regresiones APC I1–I11 + R4 → PASS dentro del gate canónico;
- regresiones ACE y character observers → PASS dentro del gate canónico;
- diff final limitado a contrato R4, handoff I11 y regresiones I11/R4.

R4 queda congelado con esta semántica. Cualquier cambio posterior que altere suspensión por contradicción, forma de `excludedFromAce`, precondiciones de validación semántica o relación con ACE requiere nueva versión contractual y nueva regresión.
