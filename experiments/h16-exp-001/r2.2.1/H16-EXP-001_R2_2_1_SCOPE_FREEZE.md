# H16-EXP-001 — R2.2.1 Scope Freeze

**Estado:** VALIDATED / FROZEN SCOPE CONTRACT
**Versión:** R2.2.1
**Fecha de congelamiento:** 2026-09-22
**Resultado de validación ASC:** PASS
**Blockers:** 0
**Base de compatibilidad:** main@035ff6edefd16df86eff5bc549efe7d41eae153e
**No cierra:** Hito 16 completo

## 1. Objeto congelado

`experiments/h16-exp-001/r2.2.1/H16-EXP-001_R2_2_1_SCOPE_CONTRACT.md`

Git blob SHA exacto:

```text
813b6c14dd0501276747c62bbacf01dea8c374d5
```

El blob fue reaudidato contra el estado actual de APC en main. R2.2.1 sustituye como candidato integrable a R2.2 exclusivamente para actualizar el binding de autoridad TRUSTED/APC; no reabre las invariantes BLIND ni las decisiones experimentales ya validadas.

## 2. Compatibilidad verificada

```text
CURRENT MAIN AUTHORITY BINDING             PASS
APC I1-I11 R4 COMPATIBILITY                PASS
APC I12 UI CONTRACT R10 COMPATIBILITY      PASS
TRUSTED / BLIND SEPARATION                 PASS
NO SECOND APC PERSISTENCE                  PASS
APC NON-DESTRUCTIVE HISTORY                PASS
TRUSTED → ACE VIA APC/H16                  PASS
BLIND ALLOWLIST                            PASS
OBSERVER BLIND INPUT                       PASS
OBSERVED / NOT_OBSERVABLE / UNCERTAIN      PASS
OPEN-01 / OPEN-02 / OPEN-03 PRESERVED      PASS
BOTANICAL CANON UNCHANGED                  PASS
ASC / ACE / H15 UNCHANGED                  PASS
BLOCKERS                                   0
RESULT                                     PASS
```

## 3. OPEN preservados

```text
OPEN-01 repeated / contradictory evidence semantics
OPEN-02 photo membership in multiple observations
OPEN-03 view-specific character applicability
```

Las reglas APC actuales no se usan para cerrar por inferencia estos OPEN del protocolo R2.2.1.

## 4. Regla de cambio

El blob congelado no debe modificarse silenciosamente. Cualquier cambio de bytes o autoridad material requiere candidato posterior, regresión, validación y nuevo freeze.

## 5. Dependencia

```text
CONTRACT
  ↓
FREEZE
  ↓
MANIFEST
```

El MANIFEST posterior registra CONTRACT + FREEZE y no se hashea a sí mismo.

## 6. Estado

```text
R2.2.1 SCOPE CONTRACT
VALIDATED / FROZEN

CONTRACT GIT BLOB
813b6c14dd0501276747c62bbacf01dea8c374d5

VALIDATION
PASS

BLOCKERS
0

HITO 16 COMPLETE
NO

NEXT
SCOPE_MANIFEST → package audit → PR / merge
```
