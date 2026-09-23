# H16-EXP-001 — R2.2.1 Scope Freeze

**Estado:** VALIDATED / FROZEN SCOPE CONTRACT
**Versión:** R2.2.1
**Fecha de congelamiento:** 2026-09-22
**Base revalidada:** main @ 035ff6edefd16df86eff5bc549efe7d41eae153e
**Resultado ASC:** PASS
**Blockers:** 0
**No cierra:** Hito 16 completo

## 1. Objeto congelado

`experiments/h16-exp-001/r2.2.1/H16-EXP-001_R2_2_1_SCOPE_CONTRACT.md`

Identidad exacta:

```text
Git blob SHA: 813b6c14dd0501276747c62bbacf01dea8c374d5
SHA-256: d5e1a3fbad876e7c53093368cddc3f8f144d21fafce7889ba758a3217782ab0c
byte length: 24281
source commit: 14dc2a61715b6c4cbe87600f85534bb88ea954eb
```

Cualquier cambio de bytes requiere candidato posterior, regresión y nuevo freeze.

## 2. Motivo de R2.2.1

R2.2 quedó validado contra una base anterior. Antes de integración, `main` incorporó APC I1–I11 R4 y `ARBORIS_APC_I12_UI_CONTRACT_R10`. R2.2.1 actualiza únicamente el binding de autoridad TRUSTED para consumir la autoridad APC ya integrada y congelada en `main@035ff6edefd16df86eff5bc549efe7d41eae153e`.

No se crea una arquitectura paralela ni se modifica la frontera BLIND / BENCHMARK.

## 3. Regresión de invariantes

```text
TRUSTED / APC authority                 PASS
BLIND / BENCHMARK separation            PASS
no second normative APC persistence     PASS
TRUSTED → ACE uses APC/H16 contract     PASS
observer BLIND-input isolation          PASS
OBSERVED semantics                      PASS
NOT_OBSERVABLE semantics                PASS
UNCERTAIN semantics                     PASS
OPEN-01 preservation                    PASS
OPEN-02 preservation                    PASS
OPEN-03 preservation                    PASS
ASC unchanged                           PASS
ACE unchanged                           PASS
H15 unchanged                           PASS
botanical canon unchanged               PASS
H16 complete                            NO
```

## 4. OPEN preservados

```text
OPEN-01 — repeated / contradictory evidence semantics
OPEN-02 — photo membership in multiple observations
OPEN-03 — view-specific character applicability
```

La existencia de APC I11 R4 no cierra OPEN-01 global: su suspensión de una dimensión contradictoria es una política conservadora de handoff, no una decisión sobre cuál evidencia es correcta.

I12 tampoco cierra OPEN-02 ni OPEN-03: admite relaciones operacionales de fotografías/individuos sin convertirlas en una regla botánica general de membership o aplicabilidad por view.

## 5. Dependencia

```text
CONTRACT
  ↓
FREEZE
  ↓
MANIFEST
```

Este FREEZE conoce sólo la identidad del CONTRACT. El MANIFEST posterior registrará CONTRACT + FREEZE y no se auto-hasheará.

## 6. Estado

```text
R2.2.1 SCOPE CONTRACT  VALIDATED / FROZEN
BLOCKERS               0
NEXT                    materialize manifest → package audit → PR
```
