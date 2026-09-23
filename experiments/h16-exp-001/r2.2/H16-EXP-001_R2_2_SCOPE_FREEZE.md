# H16-EXP-001 — R2.2 Scope Freeze

**Estado:** VALIDATED / FROZEN SCOPE CONTRACT  
**Versión:** R2.2  
**Fecha de congelamiento:** 2026-09-22  
**Ámbito:** Scope Contract del Batch Annotation Workbench de H16-EXP-001  
**Resultado de validación ASC:** PASS  
**Blockers:** 0  
**No modifica:** ASC, ACE, contratos de Hito 15, canon botánico ni R2.1.3  
**No cierra:** Hito 16 completo  
**Paquete:** el freeze no constituye por sí solo integración a `main`; el `SCOPE_MANIFEST.json` y la revisión del paquete siguen siendo gates posteriores.

---

## 1. Objeto congelado

Este documento congela exclusivamente el siguiente Scope Contract validado:

```text
experiments/h16-exp-001/r2.2/H16-EXP-001_R2_2_SCOPE_CONTRACT.md
```

Identidad exacta de los bytes validados:

```text
Git blob SHA:
b65f1ee98d5fbe988fd3bc30e6b8661b78856d64

SHA-256:
f880612a77232399890d6b08c95b63dbc9ddcad78e4ee6ab363d5db412d41bb7

byte length:
24109

source commit used for exact-blob verification:
341cdb8610af37324e51ae76884ca8bd27d1fa91
```

La identidad normativa del CONTRACT congelado corresponde a esos bytes exactos. Un cambio de bytes produce un artefacto distinto y exige revalidación antes de sustituir esta referencia.

---

## 2. Resultado de auditoría pre-freeze

El blob exacto fue auditado después de materializar las correcciones de alcance y los blockers R1/R2/B1/B2/B3.

```text
SCOPE PRESERVATION                         PASS
TRUSTED / APC SEPARATION                  PASS
APC / BENCHMARK DATA-MODEL SEPARATION     PASS
OBSERVED SEMANTICS                        PASS
NOT_OBSERVABLE SEMANTICS                  PASS
UNCERTAIN SEMANTICS                       PASS
BLIND WORKSET ALLOWLIST                   PASS
OBSERVER BLIND-INPUT BOUNDARY             PASS
TRUSTED PERSISTENT-STATE ISOLATION        PASS
APPEND-ONLY BENCHMARK CORRECTIONS          PASS
LEDGER STRUCTURAL VALIDATION               PASS
PRIMARY HOLDOUT PRECOMMITMENT              PASS
DEVELOPMENT / HOLDOUT SEPARATION           PASS
IMMUTABLE OBSERVER IDENTITY                PASS
PREDICTION SEAL                            PASS
HUMAN GT SEAL BEFORE UNBLINDING            PASS
OPEN-01 / OPEN-02 / OPEN-03 PRESERVATION  PASS
ASC / ACE / H15 UNCHANGED                  PASS
H17 OUTSIDE SCOPE                          PASS
BOTANICAL CANON UNCHANGED                  PASS

BLOCKERS                                   0
VALIDATION RESULT                          PASS
```

---

## 3. Invariantes congeladas

R2.2 conserva dos dominios operacionalmente aislados dentro del Workbench:

```text
TRUSTED / APC
≠
BLIND / BENCHMARK
```

Compartir infraestructura técnica no autoriza compartir estados de dominio, stores, validadores, exports ni metadata de decisión.

Los estados de observación R2.2 permanecen exactamente:

```text
OBSERVED
NOT_OBSERVABLE
UNCERTAIN
```

`NOT_OBSERVABLE` no equivale a ausencia. `UNCERTAIN` no equivale a desacuerdo entre anotadores. Ninguno puede transportar `observed_state`.

El observador automático del benchmark debe consumir la frontera BLIND materializada por allowlist y no un payload TRUSTED del cual simplemente ignore campos.

La secuencia primaria congelada conserva:

```text
materialize primary holdout
→ SEAL HOLDOUT
→ development / tuning
→ FREEZE OBSERVER
→ run observer through BLIND INPUT boundary
→ SEAL PREDICTIONS
→ human OPERATIONAL_METADATA_BLIND annotation
→ adjudicate valid ledger conflicts
→ validate ledger
→ SEAL HUMAN GT
→ unblind predictions
→ PRIMARY COMPARISON
```

Las correcciones del Benchmark Annotation Ledger son append-only. No se permite resolver conflictos mediante borrado destructivo, last-write-wins, timestamp-wins, confidence-wins, annotator-priority ni insertion-order-wins.

---

## 4. Decisiones que permanecen OPEN

Este freeze no cierra:

```text
OPEN-01 — repeated / contradictory evidence semantics
OPEN-02 — photo membership in multiple observations
OPEN-03 — view-specific character applicability
```

Las reglas locales del Benchmark Annotation Ledger no constituyen cierre general de OPEN-01. El modelo operacional R2.2 no cierra OPEN-02. La distinción entre elegibilidad y aplicabilidad no introduce reglas por view y no cierra OPEN-03.

---

## 5. Decisiones diferidas

Permanecen fuera del freeze de scope, conforme al CONTRACT:

```text
layout visual definitivo
keyboard shortcuts finales
segundo anotador obligatorio
UI completa de adjudicación
ROI / crops
reglas de aplicabilidad específicas por view
ejecución de aplica_si
integración H17
ACE consumption
modelo automático definitivo
persistencia definitiva de resultados
```

El freeze tampoco inventa canonicalización exacta de worksets, serialización de digests ni mecanismo físico concreto de fingerprints/seals cuando el Scope Contract los delega a la executable spec.

---

## 6. Regla de cambio

El CONTRACT identificado en §1 no debe modificarse silenciosamente.

Todo cambio que altere sus bytes después de este freeze debe:

```text
crear candidato posterior
→ declarar cambio
→ identificar invariantes afectadas
→ auditar regresión
→ validar bytes exactos
→ emitir nuevo freeze
```

Una implementación posterior debe demostrar que consume el contrato/especificación correspondiente a la versión validada; no puede asumir equivalencia por nombre.

---

## 7. Dependencia de materialización

La dependencia permanece acíclica:

```text
CONTRACT
  ↓
FREEZE
  ↓
MANIFEST
```

Este FREEZE conoce la identidad del CONTRACT. No conoce ni anticipa la identidad del MANIFEST.

El MANIFEST posterior deberá registrar las identidades exactas de CONTRACT + FREEZE y no deberá hashearse a sí mismo.

---

## 8. Estado

```text
H16-EXP-001
R2.2 SCOPE CONTRACT

CONTRACT
VALIDATED / FROZEN

CONTRACT GIT BLOB
b65f1ee98d5fbe988fd3bc30e6b8661b78856d64

CONTRACT SHA-256
f880612a77232399890d6b08c95b63dbc9ddcad78e4ee6ab363d5db412d41bb7

VALIDATION
PASS

BLOCKERS
0

OPEN
OPEN-01
OPEN-02
OPEN-03

HITO 16 COMPLETE
NO

NEXT GATE
audit exact FREEZE bytes
→ calculate FREEZE identity
→ create SCOPE_MANIFEST.json
→ audit complete package
```
