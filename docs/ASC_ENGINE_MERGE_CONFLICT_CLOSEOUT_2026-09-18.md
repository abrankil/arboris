# ASC — Cierre de incidencia: conflicto de merge en el motor canónico de identificación

**Fecha:** 2026-09-18
**Repositorio:** `abrankil/arboris`
**Rama:** `fix/hito16-engine-applicability`
**Archivo afectado:** `tools/canonical-identification/engine.mjs`
**Estado:** documentado

## 1. Objetivo

Registrar el cierre de la incidencia de conflicto de merge detectada en `tools/canonical-identification/engine.mjs`, incluyendo la causa del fallo inicial, la auditoría ASC aplicada, las correcciones adoptadas y la validación final antes del commit.

Este documento no redefine los contratos de Hito 15 (`docs/HITO15_CANDIDATE_IDS_CONTRACT.md`, `docs/HITO15_CHARACTER_RETRY_CONTRACT.md`, `docs/HITO15_SUPPORTED_CONTRACT.md`). Registra únicamente que un conflicto de merge amenazó esos contratos y cómo quedaron preservados.

## 2. Fallo inicial

El archivo `tools/canonical-identification/engine.mjs` quedó en estado `UU` (unmerged) en el índice de Git, con marcadores de conflicto sin resolver distribuidos en 6 bloques del archivo. La resolución previa al inicio de esta incidencia era incompleta y conflictiva: `node --test` fallaba con:

```text
SyntaxError: Identifier 'CONTAINS_APPLIES_IF' has already been declared
```

La inspección detectó, entre los marcadores sin resolver:

- duplicación literal de la declaración de `CONTAINS_APPLIES_IF`;
- duplicación literal de la declaración de `normalizeToken`.

## 3. Auditoría ASC

Se realizó una auditoría completa de los 6 bloques de conflicto contra los tres stages de Git (`:1` base común, `:2` ours/HEAD, `:3` theirs/incoming, commit `f98428a`).

La auditoría identificó que una resolución intermedia había incorporado, de forma **no autorizada**, comportamiento funcional híbrido proveniente de `incoming` que no existía en `ours`/`:2`:

- gating de `appliesIf` en `characterScore`, activo en producción sobre el carácter real `CH-023` (dependiente de `CH-013 = 'capsula'`), sin respaldo contractual ni cobertura de test;
- ampliación de `POWER_SCORE` con las entradas `medio-alto` / `medio_alto`, ausentes en `ours`/`:2`;
- `diagnosticPowerScore` enrutando el valor a través de `normalizeToken`, comportamiento ausente en `ours`/`:2`.

## 4. Correcciones adoptadas

Por decisión explícita, no se autorizó ningún comportamiento funcional nuevo dentro de esta resolución de merge. Se restauró la semántica exacta de `ours`/`:2` en cada punto identificado:

- **`appliesIf`**: restaurado a la semántica de `ours`/`:2` — se retiraron el parámetro `evidenceIndex`, el lookup de `character` y el gating condicional dentro de `characterScore`; la función quedó con la firma y el cuerpo exactos de `ours`/`:2`.
- **`POWER_SCORE`**: restaurado a `ours`/`:2` — se retiraron las entradas `medio-alto` y `medio_alto`.
- **`diagnosticPowerScore`**: restaurado a `ours`/`:2` — se retiró el enrutamiento por `normalizeToken`; queda como `POWER_SCORE.get(value) ?? 0`, equivalente exacto al cálculo en línea de `ours`/`:2`.
- **Fix TDZ en `retryCharacter`**: preservado. El identificador `normalizedEvidence` se declara antes de su uso en el cálculo de `currentCandidateIds`, corrigiendo el `ReferenceError` de temporal dead zone detectado, sin alterar ningún valor ni contrato.
- Las duplicaciones de `CONTAINS_APPLIES_IF` y `normalizeToken` quedaron resueltas a una sola declaración efectiva de cada símbolo.

## 5. Validación final

```text
node --check tools/canonical-identification/engine.mjs
PASS

node --test tools/canonical-identification/engine.test.mjs
tests: 24
pass: 24
fail: 0

git diff --cached --check
PASS
```

## 6. Staging y cierre Git

`tools/canonical-identification/engine.mjs` fue la única modificación puesta en stage (`git add`). No se agregó ningún otro archivo.

Antes del cierre se verificó el estado real de la operación Git: no existían `MERGE_HEAD`, `CHERRY_PICK_HEAD` ni `REVERT_HEAD`, y no había rebase activo. Git clasificó el estado como **`ORDINARY_COMMIT`**, no como `MERGE` — la resolución del conflicto se registró mediante un commit ordinario, no mediante `git commit --no-edit` de merge.

```text
COMMIT_HASH (corto):     a3708f6
COMMIT_HASH (completo):  a3708f63f34e98e2aa3e49dda81bf34160ced8c0
COMMIT_MESSAGE:          Resolve canonical identification conflict preserving Hito 15 contracts
FECHA:                   Fri Sep 18 02:54:45 2026 -0300
AUTOR/COMMITTER:         abrankil <alesotoprado@gmail.com>
ARCHIVOS EN EL COMMIT:   tools/canonical-identification/engine.mjs
```

Estado final del repositorio tras el commit:

```text
On branch fix/hito16-engine-applicability
nothing to commit, working tree clean
```

No se hizo `push`. No se hizo `amend`.

## 7. Revisión según `docs/DEVELOPMENT_MANUAL.md`

### AUDITORÍA

Se auditó el conflicto de merge en `tools/canonical-identification/engine.mjs` contra los tres stages de Git (`:1`, `:2`/ours, `:3`/theirs) y contra los contratos de Hito 15 (`docs/HITO15_CANDIDATE_IDS_CONTRACT.md`, `docs/HITO15_CHARACTER_RETRY_CONTRACT.md`, `docs/HITO15_SUPPORTED_CONTRACT.md`), que este cierre no redefine. El alcance de la auditoría fue: identificar toda diferencia funcional entre la resolución intermedia y `ours`/`:2`, y verificar que el archivo resultante compila y pasa la suite existente.

### INCONSISTENCIAS

Se detectaron y corrigieron las siguientes inconsistencias entre la resolución intermedia y `ours`/`:2`:

- gating no autorizado de `appliesIf` en `characterScore`, activo sobre el carácter real `CH-023`, sin respaldo contractual ni cobertura de test — retirado;
- ampliación no autorizada de `POWER_SCORE` con `medio-alto` / `medio_alto` — retirada;
- enrutamiento no autorizado de `diagnosticPowerScore` a través de `normalizeToken` — retirado;
- duplicación literal de la declaración de `CONTAINS_APPLIES_IF` — resuelta a una sola declaración;
- duplicación literal de la declaración de `normalizeToken` — resuelta a una sola declaración.

### VACÍOS / OMISIONES

Permanecen sin determinar y no se cierran por inferencia:

- la causa u origen de la resolución intermedia que introdujo el comportamiento híbrido no autorizado;
- si corresponde agregar cobertura de test explícita que impida la reintroducción futura del comportamiento retirado (gating de `appliesIf` sobre `CH-023`, entradas `medio-alto`/`medio_alto` en `POWER_SCORE`, enrutamiento por `normalizeToken` en `diagnosticPowerScore`);
- sincronización remota: no se hizo `push` en este cierre, por lo que el estado remoto de la rama no queda certificado por este documento.

### REDUNDANCIAS

No se crea un contrato ni una especificación paralela. Este documento no redefine los contratos de Hito 15 (declarado en la sección 1) y no duplica `docs/HITO15_CLOSEOUT_2026-09-16.md` (consolidación de ACE) ni `docs/ASC_STATE_SUMMARY_AUDIT_2026-09-18.md` (auditoría del estado ASC v0.1/MAP-001): cada uno cubre un objeto distinto. No se detecta redundancia problemática.

### DECISIÓN

```text
PASS

node --check tools/canonical-identification/engine.mjs: PASS
node --test tools/canonical-identification/engine.test.mjs: 24/24 PASS
git diff --cached --check: PASS

Contratos de Hito 15: preservados, no redefinidos
Comportamiento funcional nuevo: NINGUNO autorizado
Push: NO realizado
```
