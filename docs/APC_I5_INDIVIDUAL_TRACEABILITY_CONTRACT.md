# Árboris — APC I5 Individual Traceability Contract

**Estado:** VALIDATED WITH ASC para implementación técnica.
**Ámbito:** Hito 16 / APC I5.
**Base canónica:** `main` posterior al merge del PR #51.
**No autoriza:** merge a `main`, avance a I6, cierre de Gate B ni cierre de Hito 16.

## 1. Objetivo

I5 garantiza que cada `APC_EVIDENCE` pueda atribuirse inequívocamente al individuo biológico correcto de la fotografía que la sustenta.

I5 no identifica especie. No resuelve hipótesis taxonómicas. No introduce revisiones, requirements, pending, contradictions ni lógica de cierre.

## 2. Invariantes

Toda evidencia registrada debe cumplir:

```text
EVIDENCE.photoId
→ PHOTO existente

EVIDENCE.individualId
→ INDIVIDUAL existente

EVIDENCE.individualId
∈ PHOTO.individualRefs[]
```

Una `PHOTO` puede referenciar cero o más individuos.

Una evidencia concreta tiene exactamente un `individualId`.

Una misma fotografía puede sostener evidencias dirigidas a individuos distintos si todos están declarados en `PHOTO.individualRefs[]`.

## 3. Identidad individual y especie

`individualId` identifica un individuo biológico dentro de la sesión.

No debe derivarse de `speciesId`, `speciesHypothesis` ni de ACE.

Un individuo sin especie o hipótesis conocida sigue siendo válido para registrar evidencia.

Los campos de hipótesis, cuando existan, son informativos/provisionales y no constituyen evidencia botánica ni identificación formal.

## 4. Handoff

La identidad primaria permanece en:

```text
APC_EVIDENCE.individualId
```

Durante el handoff se preserva como trazabilidad derivada:

```text
provenance.apc.individualId
```

I5 no convierte `individualId` en criterio de compatibilidad de ACE.

## 5. Casos válidos

- una foto con un individuo;
- una foto con varios individuos;
- varias evidencias sobre el mismo individuo;
- una misma foto con evidencias dirigidas a individuos distintos;
- un mismo individuo presente en varias fotos;
- individuo sin `speciesHypothesis`;
- individuo con hipótesis provisional sin alterar evidencia registrada.

## 6. Casos inválidos

- evidencia sin `photoId`;
- evidencia con `photoId` inexistente;
- evidencia sin `individualId`;
- evidencia con `individualId` inexistente;
- evidencia cuyo `individualId` existe en la sesión pero no pertenece a `PHOTO.individualRefs[]` de su `photoId`.

## 7. Suite mínima I5

```text
T-I5-01 evidence sin individualId → FAIL
T-I5-02 evidence con individualId inexistente → FAIL
T-I5-03 evidence sin photoId → FAIL
T-I5-04 evidence con photoId inexistente → FAIL
T-I5-05 individual válido pero ausente de PHOTO.individualRefs → FAIL
T-I5-06 PHOTO multiindividuo con targets correctos → PASS
T-I5-07 mismo individuo en varias fotos → PASS
T-I5-08 individuo sin speciesHypothesis → PASS
T-I5-09 hipótesis provisional no altera trazabilidad → PASS
T-I5-10 individualId sobrevive APC → CharacterObservation → ACE normalization → PASS
```

## 8. Fuera de alcance

```text
I6  revisiones/current
I7  requirements
I8  pending/representation_gap
I9  contradictions
I10 PASS/export
I11 E2E completo Gate B
I12 UI
```

## 9. Criterio de cierre

I5 puede cerrarse cuando:

- todas las invariantes anteriores estén implementadas;
- la suite I5 pase;
- las regresiones I1–I4 permanezcan verdes;
- `test:character-observers` permanezca verde;
- `test:canonical-identification` permanezca verde;
- `npm test` pase;
- la auditoría ASC del diff no encuentre un bloqueo;
- el cambio se integre mediante PR aprobado.

## 10. AUDITORÍA

El contrato amplía únicamente integridad de target biológico. No cambia conocimiento botánico, lógica de identificación ni autoridad de ACE.

## 11. INCONSISTENCIAS

La implementación previa permite que una evidencia apunte a un individuo existente en la sesión pero no declarado en la foto correspondiente. I5 existe para cerrar esa inconsistencia.

## 12. VACÍOS / OMISIONES

Versionado, requirements, pending, contradictions, PASS/export y UI permanecen expresamente fuera de alcance.

## 13. REDUNDANCIAS

`APC_EVIDENCE.individualId` es la identidad primaria. `provenance.apc.individualId` es una copia derivada para trazabilidad, no una segunda fuente de verdad.
