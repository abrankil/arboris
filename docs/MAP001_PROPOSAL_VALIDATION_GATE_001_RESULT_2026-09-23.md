# MAP-001 — Proposal Validation Gate 001 — resultado E3

**Fecha:** 2026-09-23  
**Ámbito:** E3 / G3 — integración de propuestas MAP-001 con validator de dominio real  
**Estado:** `CLOSED / PASS`  
**PR de implementación:** #68 — `E3: MAP-001 proposal validation adapter`  
**Commit de implementación validado:** `1484a037ec6a21d23900eaa715957310b6f4e916`  
**Commit documental revalidado:** `70a0ee8c4d3d9bf951835806cdd313caef369d6b`  
**Aprobación humana de G3:** recibida el 2026-09-23

## 1. Objetivo

Demostrar, con ejecución real y contratos materializados, la cadena:

```text
proposal MAP-001 conforme a Proposal R2
        ↓
contrato semántico E2.5
        ↓
authority-runtime MAP-001 real
        ↓
adapter de validación
        ↓
validation-report conforme a R1
```

sin modificar la autoridad MAP-001, sin duplicar sus reglas de navegación y sin ampliar ASC v0.1.

## 2. Baseline contractual usado

La rama del PR #68 materializa el baseline E2 aprobado:

```text
tools/proposal-resolution/schemas/proposal.schema.json
→ Proposal R2

tools/proposal-resolution/schemas/repair.schema.json
→ Repair R1

tools/proposal-resolution/schemas/validation-report.schema.json
→ Validation Report R1

tools/proposal-resolution/schemas/run-state.schema.json
→ Run State R3

tools/proposal-resolution/contracts/cross-contract.semantic.json
→ E2.5 Semantic Contract R1
```

E3 consume directamente estos contratos. No usa copias implícitas ni una versión informal equivalente.

## 3. Integración validada

El adapter E3 reutiliza el entry point vigente:

```text
materializeWalkableEnvelopeAuthority
```

y por tanto conserva la cadena de validación de dominio existente:

```text
authority manifest
→ validateAuthorityManifest
→ verifyAuthorizedCandidate
→ validateEnvelopeModel
→ validateFrameBoundaryPolicy
→ rasterizeEnvelope
→ analyzeDerivedRaster
```

Candidate 001 y el authority manifest permanecen inalterados. Candidate 002 no participa en el authority-runtime.

La salida autoritativa del runtime se transforma únicamente en una vista derivada no autoritativa contra la que se compara `proposal.intent.candidate`.

## 4. Estados demostrados

La integración real demuestra:

```text
candidate conforme
→ PASS

diferencia reparable en derivedRaster
→ REJECT_FIXABLE / AUTO_REPAIR

intento de cerrar un valor autoritativo OPEN
→ OPEN_BLOCKER

alteración de autoridad protegida
→ AUTHORITY_BLOCKER
```

La precedencia permanece:

```text
AUTHORITY_BLOCKER
> OPEN_BLOCKER
> REJECT_FIXABLE
> PASS
```

## 5. Integridad Proposal R2

La revisión detectó que el fixture inicial `CREATE_DERIVED` declaraba únicamente:

```text
add /derivedRaster
```

aunque su candidate contenía también `schemaVersion`, `viewType`, `authority` y `semantics`.

Ese fixture violaba:

```text
SEM-PROP-004
DECLARED_CHANGES_RECONSTRUCT_CANDIDATE_EXACTLY
```

La corrección declara explícitamente:

```text
add /schemaVersion
add /viewType
add /authority
add /semantics
add /derivedRaster
```

El gate reconstruye el candidate desde la base vacía y exige igualdad exacta. Existe además una regresión negativa que reproduce el fixture antiguo y exige su rechazo por `SEM-PROP-004`.

## 6. Provenance

Antes de producir un `validation-report`, E3 verifica:

```text
validator implementation SHA-256
authority manifest SHA-256
source candidate SHA-256
authorityId
sourceCandidate.id
sourceCandidate.path
sourceCandidate.sha256
```

También impide que un `authorityPath` externo sustituya silenciosamente el baseline fijado por la propuesta.

Una discrepancia de provenance falla antes de fabricar un resultado de dominio.

## 7. Evidencia de ejecución

GitHub Actions ejecutó el gate E3 sobre el commit:

```text
1484a037ec6a21d23900eaa715957310b6f4e916
```

Runtime:

```text
Node v24.20.0
Python 3.13
jsonschema 4.26.0
```

Resultados:

```text
MAP-001 authority-runtime
21 / 21 PASS

proposal validation adapter unit tests
10 / 10 PASS

real authority-runtime + approved E2 contract integration
8 / 8 PASS

CI
PASS

Audit Protocol Check
PASS
```

Los ocho tests de integración incluyen:

```text
contract-valid PASS
contract-valid REJECT_FIXABLE
contract-valid OPEN_BLOCKER
contract-valid AUTHORITY_BLOCKER
SEM-PROP-004 rechaza el antiguo CREATE_DERIVED subdeclarado
validator provenance mismatch falla cerrado
authority provenance mismatch falla cerrado
authorityPath bypass falla cerrado
```

## 8. Papel de ASC

ASC se utilizó como control de frontera y vocabulario de autoridad, no como validator de dominio.

La revisión confirma:

```text
autoridad MAP-001
→ permanece upstream

OPEN
→ permanece OPEN

resultado derivado
→ no se convierte en evidencia ni canon

DOMAIN_PASS
→ no equivale a AUTHORIZED_FOR_ASC

ASC v0.1
→ permanece compile-only
```

No se modificó ni fue necesario ampliar `tools/asc/compile_asc.mjs`.

No corresponde ejecutar ASC v0.1 para decidir el resultado de G3: la especificación de ASC establece que el compilador recibe contratos ya clasificados y autorizados y no resuelve autoridad ni suficiencia de evidencia.

## 9. Límite de E3

E3 demuestra una iteración de validación completa:

```text
proposal
→ validación contractual
→ validator de dominio real
→ validation-report contractual
```

E3 no implementa todavía:

```text
REJECT_FIXABLE
→ repair
→ child proposal
→ revalidation
→ repetición automática
```

Ese ciclo pertenece a E4 — state machine / orchestrator.

Aunque `repair.schema R1` y `run-state.schema R3` ya están materializados, su ejecución end-to-end no se declara probada en E3.

## 10. Resultado de G3

```text
E3.1 validator interface                         PASS
E3.2 adapter                                     PASS
E3.2 provenance                                  PASS
E3.3 Proposal R2 binding                         PASS
E3.3 SEM-PROP-004                                PASS
E3.3 MAP-001 real validator                      PASS
E3.3 Validation Report R1                        PASS
E3.4 Node 24 execution                           PASS
CI                                               PASS
Audit Protocol Check                             PASS
ASC boundary                                     PASS

G3 — VALIDATION GATE
PASS
CLOSED
```

La aprobación humana fue recibida después de completar la revisión técnica, la documentación y la revalidación de los checks del head documental. G3 queda formalmente cerrado.

## 11. AUDITORÍA

Se revisó la implementación E3 contra la autoridad MAP-001 vigente, los contratos E2 materializados, `docs/DEVELOPMENT_MANUAL.md`, la frontera normativa de ASC y la evidencia de ejecución real de GitHub Actions.

La evidencia disponible demuestra que la propuesta probada cumple Proposal R2 y `SEM-PROP-004`, que el validator MAP-001 real produce la referencia de dominio, y que el resultado emitido cumple Validation Report R1.

## 12. INCONSISTENCIAS

La inconsistencia material encontrada en el fixture `CREATE_DERIVED` fue corregida. La regresión negativa incorporada impide que el caso subdeclarado vuelva a aceptarse silenciosamente.

No se detecta una inconsistencia técnica pendiente que invalide el objetivo de E3.

## 13. VACÍOS / OMISIONES

La ejecución completa de `repair.schema R1`, `run-state.schema R3`, detección de `STALLED`, `CYCLE_DETECTED`, `REGRESSION` y el bucle automático pertenece a E4 y no se declara resuelta por este documento.

Las decisiones MAP-001 que continúan `OPEN` permanecen abiertas.

## 14. REDUNDANCIAS

La materialización de los contratos E2 en `tools/proposal-resolution/` no crea una segunda autoridad MAP-001. Los schemas gobiernan forma e interfaces; las reglas de navegación siguen viviendo en la autoridad y validator de dominio existentes.

Los bindings repetidos de autoridad y validator son redundancia intencional de trazabilidad y deben mantenerse sincronizados mediante validación cruzada.
