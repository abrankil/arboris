# ASC — Investigación de metodología portable R2

**ID:** `ASC-PORTABLE-METHODOLOGY-RESEARCH-002`  
**Estado:** `READY_FOR_INDEPENDENT_AUDIT` — no normativo  
**Fecha:** 2026-09-21  
**Predecesor:** `asc-portability-research/ASC-PORTABLE-METHODOLOGY-RESEARCH-001.md`  
**Naturaleza:** resolución documental del gate de portabilidad; no modifica ASC v0.1, contratos, código ni canon.

---

## 0. Alcance y autoridad

Esta R2 resuelve únicamente las inconsistencias detectadas en la investigación de portabilidad de ASC.

Autoridades y evidencia consideradas:

- `docs/ARBORIS_SCENE_COMPILER.md`
- `docs/ASC_V0_1_EXECUTABLE_SPEC.md`
- `docs/ASC_PROJECT_BOUNDARY.md`
- `docs/ASC_PROJECT_SEPARATION_AND_IMPLEMENTATION_PLAN_2026-09-17.md`
- `asc-portability-research/ASC-PORTABLE-METHODOLOGY-RESEARCH-001.md`
- `docs/ASC_R4_PROVENANCE_PRESERVATION_CONTRAST_2026-09-19.md`
- `docs/CIERRE_JORNADA_2026-09-19_ASC_R4_REPLICA_R5.md`
- `docs/REGISTRO_PUENTE_ASC_R4_R5_2026-09-19.md`

Esta R2 **no**:

- crea una especificación portable de ASC;
- declara que exista un `ASC-CORE`;
- cambia `tools/asc/compile_asc.mjs`;
- cambia el contrato JSON v0.1;
- abre un nuevo experimento;
- sustituye R5;
- define cuánta evidencia es suficiente para generalizar;
- autoriza una migración de ASC fuera de Árboris.

R1 se conserva sin modificación como evidencia histórica.

---

## 1. Gate resuelto

### Problema

R1 dejó una investigación útil pero parcialmente desactualizada por evidencia posterior de R4 y por propuestas posteriores que corrían el riesgo de presentarse como arquitectura antes de estar demostradas.

Los defectos a resolver eran:

1. estado desactualizado de `Provenance Preservation`;
2. apariencia de arquitectura establecida para `ASC-CORE`, `ASC-PROFILE`, `ASC-ADAPTER` y `EXECUTOR_BINDING`;
3. umbrales inventados de “dos dominios” / “dos agentes”;
4. mezcla entre portabilidad de principios y portabilidad del compilador;
5. potencial conflicto entre investigación de portabilidad y el gate experimental ya establecido para R5;
6. descoordinación entre la línea de separación física ASC↔Árboris y la línea de investigación de portabilidad.

### Resultado

Los seis defectos quedan resueltos documentalmente en esta R2.

---

## 2. Distinción analítica de portabilidad

Para investigar portabilidad sin presuponer una arquitectura, R2 usa tres ejes analíticos provisionales.

### 2.1 Portabilidad de regla

Pregunta:

> ¿Un principio de ASC mantiene su significado y utilidad cuando cambia el contexto?

Ejemplos candidatos:

- `fail-closed`;
- preservación de `OPEN`;
- `DO NOT INFER`;
- no autocertificación;
- separación producción/auditoría;
- control de alcance de autoridad.

Esta categoría es **analítica y no normativa**.

### 2.2 Portabilidad de implementación

Pregunta:

> ¿El mismo artefacto técnico puede trasladarse y ejecutarse fuera de su contexto original sin depender indebidamente de Árboris?

Ejemplo:

- `tools/asc/compile_asc.mjs`.

Estado actual:

`NOT DEMONSTRATED`.

La portabilidad de una regla no implica automáticamente portabilidad del compilador.

### 2.3 Portabilidad de efecto

Pregunta:

> ¿Una regla continúa produciendo el comportamiento que pretende proteger cuando cambia el dominio, agente, representación, plataforma o forma de handoff?

R4 aporta evidencia inicial relevante para este eje mediante réplica inter-agente.

Estas tres categorías no constituyen una nueva arquitectura ASC ni vocabulario normativo.

---

## 3. Actualización de Provenance Preservation

R1 debe actualizar su clasificación a la luz del cierre posterior de R4.

Estado vigente de la evidencia:

```text
PROVENANCE PRESERVATION

R4 CONTRAST:
VALIDATED / CLOSED

CORRECTED CONDITION:
PASS WITH MINOR OBSERVATIONS

INTER-AGENT STRUCTURAL REPLICATION:
PASS

COMPLETE REPLICATED ARTIFACT:
PARTIAL

EVIDENCE STRENGTH:
INITIAL SUPPORT FOR GENERALIZATION

GENERAL VALIDATION:
NO
```

Conclusión de R2:

`Provenance Preservation` tiene evidencia experimental favorable de **portabilidad de efecto**, incluyendo transferencia estructural entre agentes, pero no está validado como regla universal de ASC.

No se promueve a canon por esta R2.

---

## 4. Arquitectura portable: estado corregido

Los conceptos propuestos durante la exploración posterior se reclasifican así:

```text
ASC-CORE
→ CANDIDATE_ARCHITECTURE
→ NOT AUTHORIZED

ASC-PROFILE
→ CANDIDATE_CONCEPT
→ NOT AUTHORIZED

ASC-ADAPTER
→ OPEN
→ EXISTENCE / RESPONSIBILITY UNRESOLVED

EXECUTOR_BINDING
→ CANDIDATE_CONCEPT
→ NOT AUTHORIZED
```

La investigación no debe seguir esta lógica:

```text
ASC ACTUAL
↓
ASC-CORE supuesto
↓
buscar evidencia que lo confirme
```

Debe seguir:

```text
ASC ACTUAL
+
EVIDENCIA EXPERIMENTAL
+
CAMBIOS CONTROLADOS DE CONTEXTO
        ↓
IDENTIFICAR POSIBLES INVARIANTES
        ↓
CANDIDATOS PORTABLES
        ↓
CONTRASTE
        ↓
EVIDENCIA ACUMULADA
        ↓
EVENTUAL ARQUITECTURA
```

La arquitectura, si existe, debe emerger de la evidencia y no ser una premisa de la investigación.

---

## 5. Suficiencia de evidencia

Se retiran como criterios de aceptación:

- `≥2 dominios`;
- `≥2 agentes/proveedores`;
- cualquier otra cantidad mínima introducida sin autoridad.

La regla de investigación queda:

```text
CAMBIO CONTROLADO DE CONTEXTO
        ↓
¿LA PROPIEDAD SE CONSERVA?
        ├── SÍ → aumenta evidencia favorable
        └── NO → restringir alcance o revisar hipótesis
```

Estado:

```text
SUFFICIENCY_FOR_GENERALIZATION:
OPEN
```

Ningún número arbitrario convierte automáticamente una propiedad en portable.

---

## 6. Estado actual de candidatos

### Fail-closed

```text
RULE PORTABILITY:
STRONG CANDIDATE

IMPLEMENTATION EVIDENCE:
PRESENT IN ASC v0.1

GENERAL PORTABILITY:
NOT DECLARED
```

### OPEN / DO NOT INFER

```text
RULE PORTABILITY:
STRONG CANDIDATE

EVIDENCE:
POSITIVE

GENERAL PORTABILITY:
NOT DECLARED
```

### No autocertificación

```text
RULE PORTABILITY:
STRONG CANDIDATE

AUTHORITY:
SUPPORTED BY ASC CANON

GENERAL PORTABILITY:
NOT DECLARED
```

### Separación producción / auditoría

```text
RULE PORTABILITY:
SUPPORTED CANDIDATE

R4 EVIDENCE:
POSITIVE

EXACT GENERAL SCOPE:
OPEN
```

### Authority scope / rechazo de cross-domain authority laundering

```text
RULE PORTABILITY:
SUPPORTED CANDIDATE

CROSS-DOMAIN EVIDENCE:
PARTIAL POSITIVE

GENERAL PORTABILITY:
NOT DECLARED
```

### Provenance Preservation

```text
RULE PORTABILITY:
EXPERIMENTALLY SUPPORTED CANDIDATE

EFFECT PORTABILITY:
PARTIAL POSITIVE EVIDENCE

GENERAL VALIDATION:
NO
```

### Authority binding por artefacto/hash

```text
PATTERN:
SUPPORTED IN EXISTING SUBSYSTEM

IMPLEMENTATION PORTABILITY:
PARTIAL

KNOWN RISK:
CRLF / PLATFORM SENSITIVITY

GENERAL PORTABILITY:
OPEN
```

### Grounding formal de assertions

```text
STATUS:
INSUFFICIENT EVIDENCE
```

### Grafo de dependencias justificativas

```text
STATUS:
NOT DEMONSTRATED
```

### Control de ciclos materiales

```text
STATUS:
NOT DEMONSTRATED
```

---

## 7. Estado del compilador ASC v0.1

`tools/asc/compile_asc.mjs` permanece como baseline técnico v0.1 de compilación `compile-only`.

Su estado respecto de portabilidad:

```text
RULE PORTABILITY:
NO CONCLUSION FROM IMPLEMENTATION ALONE

IMPLEMENTATION PORTABILITY:
NOT DEMONSTRATED

REPOSITORY PORTABILITY:
NOT DEMONSTRATED

PROVIDER / MODEL PORTABILITY:
NOT APPLICABLE TO v0.1 EXECUTION LAYER / NOT DEMONSTRATED

OS PORTABILITY:
PARTIAL / KNOWN RISK IN RELATED HASH-BINDING PATTERN
```

No inferir portabilidad del compilador a partir de la portabilidad aparente de principios metodológicos.

---

## 8. Relación con la separación ASC ↔ Árboris

Las dos líneas de trabajo quedan reconciliadas:

```text
LÍNEA A — SEPARACIÓN ASC ↔ ÁRBORIS
→ gobierna responsabilidad, frontera de proyecto,
  futura migración y materialización física.

LÍNEA B — INVESTIGACIÓN DE PORTABILIDAD
→ investiga qué propiedades de ASC podrían sobrevivir
  fuera del contexto original.
```

La Línea B no autoriza la migración.

La Línea A no impide continuar investigación documental de portabilidad.

La separación física sigue condicionada al proceso ya definido en `ASC_PROJECT_BOUNDARY.md` y su plan asociado.

---

## 9. Secuencia experimental

El siguiente experimento permanece sin cambios:

```text
R5 — ELEMENT-LEVEL / CLAIM-LEVEL PROVENANCE

STATUS:
PROPOSED / NOT EXECUTED

NEXT EXPERIMENTAL GATE:
R5
```

La investigación de portabilidad puede continuar documentalmente sin desplazar este gate.

`ASC-PORTABILITY-SELFTEST-001` queda:

```text
STATUS:
CANDIDATE EXPERIMENT

OPENED:
NO
```

Su necesidad deberá reevaluarse con evidencia nueva.

---

## 10. Estado consolidado

```text
METHODOLOGICAL PORTABILITY:
SUPPORTED AS RESEARCH DIRECTION

RULE PORTABILITY:
PARTIAL POSITIVE EVIDENCE

EFFECT PORTABILITY:
PARTIAL POSITIVE EVIDENCE

INTER-AGENT PORTABILITY:
PARTIAL POSITIVE EVIDENCE

CROSS-DOMAIN PORTABILITY:
PARTIAL EVIDENCE

IMPLEMENTATION PORTABILITY:
NOT DEMONSTRATED

PROVIDER / MODEL PORTABILITY:
NOT DEMONSTRATED

REPOSITORY PORTABILITY:
NOT DEMONSTRATED

OS PORTABILITY:
PARTIAL / KNOWN RISK

ASC-CORE:
CANDIDATE / NOT AUTHORIZED

GENERAL ASC PORTABILITY:
UNRESOLVED
```

---

## 11. Cambios de R2

```text
R1:
PRESERVED

R4 STATE:
UPDATED

UNAUTHORIZED ARCHITECTURE:
DEMOTED TO CANDIDATE / OPEN

ARBITRARY GENERALIZATION THRESHOLDS:
REMOVED

PORTABILITY AXES:
SEPARATED ANALYTICALLY

ASC v0.1:
NO CHANGE

CODE:
NO CHANGE

CONTRACT v0.1:
NO CHANGE

CANON:
NO NEW CANON

NEW EXPERIMENT:
NO

R5:
REMAINS NEXT EXPERIMENTAL GATE
```

---

## 12. Verificación de salida

La R2 cumple las siguientes condiciones:

- no presupone `ASC-CORE`;
- no convierte evidencia parcial en validación general;
- no usa umbrales sin autoridad;
- distingue regla, implementación y efecto;
- preserva `OPEN`;
- mantiene la separación de autoridad;
- no modifica ASC v0.1;
- no desplaza R5;
- preserva R1 como evidencia histórica.

No quedan acciones internas autorizadas que produzcan progreso adicional dentro de este gate sin entrar al gate sucesor.

---

## 13. Cierre del gate

```text
OPERATION:
ASC-OP-SOLUCIONAR-002

CURRENT_GATE:
ASC PORTABILITY RESEARCH — R2 RESOLUTION

RESULT:
CLOSED

MATERIAL_PROGRESS:
YES

BLOCKERS:
NONE

OUT_OF_SCOPE_FINDINGS:
NONE MATERIAL TO CURRENT GATE

GENERAL ASC PORTABILITY:
UNRESOLVED
# objeto de investigación futura, no blocker de este gate

SUCCESSOR_GATE:
ADVERSARIAL AUDIT OF R2

SUCCESSOR_EXECUTED:
NO
```

La evidencia actual permite sostener que ASC contiene propiedades con señales reales de generalización. No permite declarar todavía una arquitectura ASC portable ni la portabilidad del compilador actual.

La investigación debe seguir buscando invariantes y acumulando evidencia, no presuponiéndolos.
