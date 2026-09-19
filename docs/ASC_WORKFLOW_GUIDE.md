# Árboris — Guía de flujo de trabajo con ASC

**Estado:** operational guide — non-normative  
**Nombre canónico:** `ASC_WORKFLOW_GUIDE.md`  
**Ámbito:** flujo operativo end-to-end alrededor de ASC, desde preparación upstream hasta compilación, ejecución externa, revisión, validación e integración.  
**Autoridades relacionadas:** `ARBORIS_SCENE_COMPILER.md`, `DEVELOPMENT_MANUAL.md`, autoridades específicas de dominio y, para ASC v0.1, `ASC_V0_1_EXECUTABLE_SPEC.md`.

Esta guía organiza cómo trabajar con ASC. No redefine la semántica normativa de ASC, no sustituye autoridades de dominio y no convierte metodologías de aseguramiento en requisitos universales.

---

## 1. Qué gobierna cada documento

No existe una precedencia lineal única entre todas las fuentes. Cada documento gobierna su ámbito.

```text
verdad de dominio
→ autoridad específica del dominio

semántica normativa de ASC
→ ARBORIS_SCENE_COMPILER.md

revisión y gate general de desarrollo
→ DEVELOPMENT_MANUAL.md

comportamiento ejecutable de ASC v0.1
→ ASC_V0_1_EXECUTABLE_SPEC.md
  + tools/asc/compile_asc.mjs
  + tests aplicables

routing y permisos de agentes
→ AGENTS.md / CLAUDE.md

vocabulario operativo
→ guías de vocabulario correspondientes
```

Si dos fuentes parecen entrar en conflicto:

```text
1. identificar qué ámbito gobierna cada una;
2. no inventar una jerarquía total;
3. aplicar la autoridad competente;
4. registrar cualquier contradicción real que permanezca.
```

---

## 2. Invariantes del trabajo con ASC

```text
ASC compila.
El ejecutor externo genera.

La autoridad de dominio gobierna la verdad del proyecto.
Una salida generativa no sustituye esa autoridad.

OPEN no se cierra por plausibilidad.
Información faltante no se convierte automáticamente en OPEN.

Representación ≠ evidencia de dominio.
Visual ≠ geometría.
Geometría ≠ territorio real.

Compilar ≠ ejecutar.
Documentar ≠ commit.
Commit ≠ push.
Push ≠ merge.
```

Un resultado ASC puede servir como evidencia experimental para criterios que su clase de salida realmente puede demostrar, pero no adquiere por ello autoridad territorial, botánica, científica o geométrica.

---

## 3. Punto de entrada: elegir la ruta mínima

Antes de actuar:

```text
1. identificar el outcome;
2. clasificar la tarea;
3. localizar la autoridad mínima;
4. identificar inputs y evidencia disponible;
5. definir el artefacto esperado;
6. definir el gate que se pretende cerrar.
```

### Ruta rápida

Usar cuando existe un contrato ya preparado y autorizado y sólo se necesita compilar.

```text
route
→ verificar input
→ compile
→ comprobar salida
→ entregar
```

### Ruta core

Usar para propuestas, contratos, ejecución generativa o revisión de resultados.

```text
investigar
→ diseñar / preparar
→ auditar
→ corregir
→ validar
→ materializar
→ compilar
→ ejecutar si corresponde
→ auditar resultado
→ validar resultado
→ integrar
```

### Aseguramiento avanzado

Usar sólo cuando exista un trigger concreto: nueva regla reutilizable, cambio de mapping/validator, evidencia durable, necesidad de reproducibilidad o prueba aislada sin oracle.

---

## 4. Investigación y preparación upstream

`investigar` recupera estado, fuentes y evidencia. No modifica el proyecto ni eleva interpretaciones a verdad.

Etiquetas de reporte útiles:

```text
VERIFIED
OBSERVED
DECLARED
INTERPRETATION
HYPOTHESIS
UNRESOLVED
```

Estas etiquetas no reemplazan estados de dominio ni tratamientos ASC.

Antes de preparar un contrato complejo, conviene mapear:

| claim / requisito | dominio | autoridad | evidencia | estado upstream | tratamiento ASC | destino |
|---|---|---|---|---|---|---|

La tabla es una herramienta operativa, no un schema canónico.

---

## 5. OPEN, estados upstream y tratamientos ASC

La información faltante no debe transformarse automáticamente en `OPEN`.

```text
missing
UNRESOLVED
UNDETERMINED
sin fuente
sin autoridad identificada
```

no equivalen automáticamente a:

```text
OPEN
```

Tratamientos normativos de ASC:

```text
KNOWN
→ información suficientemente respaldada para trasladarse a compilación

OPEN
→ tratamiento ASC para información respecto de la cual no existe evidencia o decisión suficiente y que debe permanecer abierta
→ su asignación se determina explícitamente cuando corresponda
→ no sustituye el estado original del dominio

PROHIBIDO INFERIR / DO NOT INFER
→ el ejecutor no puede completar el vacío por plausibilidad

ART-PROVISIONAL
→ decisión visual temporal autorizada, sin valor de evidencia de dominio
```

En ASC v0.1 y en contratos que distingan explícitamente ambos campos, mantener operativamente separados:

```text
PROHIBIDO INFERIR / DO NOT INFER
→ bloquea una inferencia no respaldada

prohibited
→ bloquea un output, contenido o relación declarado como prohibido por el contrato
```

Esta separación operativa no cierra una frontera semántica universal entre ambos conceptos fuera del contrato o implementación que la declare.

Los estados de dominio se preservan; ASC no los reemplaza por sus tratamientos.

---

## 6. Evidencia y criterio de prueba

Evaluar cada criterio sólo con evidencia capaz de demostrarlo.

| Clase | Puede apoyar | No puede demostrar por sí sola |
|---|---|---|
| visual | legibilidad, composición, jerarquía visible | walkability o verdad territorial |
| lógica / geométrica materializada | conectividad, navegación, `walkableEnvelope`, relaciones geométricas | verdad botánica |
| runtime | interacción, cámara, oclusión, comportamiento | verdad territorial externa |
| dominio | claims territoriales, botánicos, ecológicos o científicos | fidelidad de ejecución técnica |

Como categorías operativas adicionales:

```text
documental / contractual
→ PROPOSED: útil para requisitos, estados y relaciones declaradas

provenance
→ ADAPTED: útil para origen, proceso e integridad de artefactos
```

Regla para `NOT TESTED`:

```text
criterio requerido por el gate + NOT TESTED
→ el gate no puede recibir PASS

criterio explícitamente fuera de alcance + NOT TESTED
→ permitido, documentado
```

---

## 7. Diseño de un contrato ASC

Un contrato debe cubrir, según corresponda:

```text
objetivo
fuentes autorizadas
contrato estructural
relaciones obligatorias
OPEN
PROHIBIDO INFERIR / DO NOT INFER
prohibited
libertad artística
cámara / formato
prioridades de lectura
criterios de validación
modo de ejecución
```

Para ASC v0.1, el formato ejecutable y sus claves exactas están definidos en `ASC_V0_1_EXECUTABLE_SPEC.md`. Esta guía no los redefine.

No ampliar ASC porque una salida sea imperfecta. Antes de cambiar schema o compilador debe demostrarse:

```text
problema real
+
requisito autorizado
+
ASC actual no puede representarlo o preservarlo
```

---

## 8. Dos bucles de revisión

### 8.1 Propuesta / diseño

Aplicar a contratos candidatos, planes, reglas y propuestas:

```text
revisión
→ auditoría
→ inconsistencias
→ vacíos / omisiones
→ redundancias
→ corrección
→ nueva validación
→ avance
```

### 8.2 Cambio materializado

Aplicar cuando ya existe código, datos, documentación o un artefacto concreto:

```text
route
→ read minimum authority
→ change one source of truth
→ validate
→ audit
```

Si la auditoría detecta hallazgos:

```text
correct
→ revalidate
→ reaudit cuando el hallazgo lo requiera
```

Los dos bucles son complementarios.

---

## 9. Auditoría, corrección y validación

Toda revisión que pueda consolidar una decisión debe responder:

```text
AUDITORÍA
INCONSISTENCIAS
VACÍOS / OMISIONES
REDUNDANCIAS
```

Un hallazgo crítico bloquea el avance hasta ser corregido o aceptado explícitamente por dirección de proyecto cuando `DEVELOPMENT_MANUAL.md` permite esa aceptación.

La autoridad de dominio puede resolver el hecho o decisión de su ámbito; eso no equivale automáticamente a dispensar un blocker transversal.

`corregir` debe resolver los hallazgos dentro del alcance autorizado y dejar claro:

```text
qué cambió
por qué
qué evidencia lo justificó
qué quedó igual
qué sigue OPEN / UNRESOLVED
```

`validar` confirma que los criterios del gate están satisfechos con evidencia suficiente.

---

## 10. Compilación ASC v0.1

ASC v0.1:

```text
recibe un JSON ya preparado y autorizado
valida forma
compila texto determinista
```

No:

```text
selecciona autoridad
evalúa suficiencia de evidencia
cierra OPEN
ejecuta un modelo generativo
```

Modo vigente:

```text
compile-only
```

Implementación y validación:

```text
tools/asc/compile_asc.mjs
npm run test:asc
```

Para detalles de schema y comportamiento, usar `ASC_V0_1_EXECUTABLE_SPEC.md`.

---

## 11. Ejecución externa

Sólo corresponde cuando el usuario o el gate pide generar/ejecutar.

```text
contrato
→ ASC
→ prompt ASC
→ ejecutor externo
→ raw result
```

Conservar el resultado original cuando vaya a ser auditado.

El ejecutor puede ser no determinista:

```text
mismo prompt
≠ necesariamente mismo raw result
```

No atribuir a `compile_asc.mjs` una ejecución que no realiza.

---

## 12. Auditoría y validación del resultado

Comparar:

```text
resultado
vs contrato
vs autoridad
vs criterios
vs clase de evidencia disponible
```

Resultados por criterio:

```text
PASS
PARTIAL
FAIL
NOT TESTED
```

Una salida atractiva no es PASS si viola relaciones obligatorias.

Ejemplo:

```text
dominancia visual de ruta
→ puede evaluarse visualmente

preservación geométrica del walkableEnvelope
→ requiere geometría lógica/materializada
→ NOT TESTED desde una imagen sola
```

---

## 13. Handoff a producción

Convención operativa recomendada:

```text
OPERACIÓN + OBJETO + ALCANCE + INVARIANTES
```

Versión ampliada, cuando aporte claridad:

```text
OPERACIÓN
+ OBJETO
+ ALCANCE
+ INVARIANTES
+ EVIDENCIA DISPONIBLE
+ OPEN
+ CRITERIOS DE PASS
```

Ejemplo:

```text
Prototipa MAP-001 desde el contrato autorizado.
Alcance: topología + territorio + cámara.
Preserva ruta, puertos y OPEN.
No infieras geometría métrica.
Evalúa sólo criterios soportados por la evidencia producida.
```

Para vocabulario detallado de producción, usar `ASC_PRODUCTION_VOCABULARY_MANUAL.md`.

---

# ADVANCED ASSURANCE — opcional y trigger-based

## 14. Cuándo activarlo

Esta capa es metodología operativa, no semántica normativa de ASC.

Usarla cuando la decisión:

```text
crea una regla reutilizable
cambia mapping / parser / validator
modifica ASC
produce evidencia que se usará en gates posteriores
necesita demostrar reproducibilidad
necesita una reproducción sin exposición al oracle
```

No exigirla para cada prompt, preview o compilación rutinaria.

---

## 15. Escalera de aseguramiento

```text
1. structural / unit
2. negative harness
3. smoke
4. blind / isolated reproduction
5. end-to-end pipeline
6. target-environment / production validation
```

### Structural / unit

```text
¿cumple estructura y reglas locales?
```

### Negative harness

Trigger: parser, validator o routing con casos inválidos materialmente relevantes.

```text
¿rechaza o bloquea correctamente los estímulos inválidos?
```

### Smoke

Trigger: regla estabilizada + oracle conocido.

```text
¿las reglas reproducen internamente el oracle esperado?
```

No demuestra aislamiento.

### Blind / isolated reproduction

Trigger: necesidad de comprobar reproducción sin exponer oracle ni respuestas históricas.

```text
¿otro agente/sistema reproduce las decisiones esperadas
sin conocer el oracle?
```

No llamarlo automáticamente IV&V o “independiente” en sentido fuerte.

### End-to-end

```text
¿la cadena completa funciona de entrada a salida?
```

No equivale necesariamente a validación de producción.

### Target-environment / production validation

```text
¿funciona en el entorno real o representativo del uso objetivo?
```

---

## 16. Blind package

Cuando el gate requiera blind:

```text
VISIBLE
- rules necesarias
- inputs
- response schema
- identificador de run/freeze

HIDDEN
- oracle
- expected PASS
- resultados smoke
- resultados negative harness
- expected counts
- scoring output
```

Registrar, cuando corresponda:

```text
firstOutputOnly
frozenBeforeScoring
retryCount
oracleExposed
historicalResultsExposed
isolationStatus
```

`isolationStatus` debe distinguir `DECLARED` de `VERIFIED`.

---

## 17. Reproducibilidad y scoring

### Compilación

ASC v0.1 pretende:

```text
mismo contrato válido
+ misma implementación
→ mismo prompt ASC
```

### Generación externa

```text
mismo prompt
≠ necesariamente mismo raw result
```

### Evaluación reproducible

Para reproducir el scoring de un resultado concreto:

```text
mismo raw result congelado/hash
+ mismo scorer/version/hash
+ mismo oracle/version/hash
+ mismas reglas de comparación/version
→ mismo scoring
```

Esto reproduce la evaluación, no necesariamente la generación.

---

## 18. Provenance, hashes y manifests

Usar el nivel de provenance proporcional a la afirmación.

### Trazabilidad básica

```text
artifact
role
date
source/input
```

### Integridad de prueba

```text
testId
revision
runId
input hashes
rules/contract hash
raw-result hash
result
```

### Reconstrucción técnica

Cuando la afirmación requiera evidencia fuerte:

```text
repo ref / commit
tool/compiler version o hash
scorer version o hash
oracle version o hash
prompt hash
raw-result hash
dependencias/entorno relevantes
parámetros de ejecución disponibles
identidad/status del executor
timestamp
```

No inventar valores ausentes.

Un SHA256 demuestra integridad respecto de un hash conocido; no demuestra por sí solo autenticidad, autoría ni verdad del contenido.

Todo manifest debe declarar su alcance. Un manifest posterior puede ampliar uno anterior, pero no reescribe retrospectivamente lo que existía en un gate previo.

---

## 19. Freeze

`freeze` es una metodología de aseguramiento para artefactos que se usarán como evidencia histórica estable.

Reglas operativas:

```text
no sobrescribir
no regenerar con el mismo identificador
no alterar contenido/hash
crear nueva revisión o paquete para cambios posteriores
```

Cuando sea necesario:

```text
freeze
→ audit freeze
→ validate freeze
```

Separaciones útiles:

```text
FREEZE VALIDATION
→ ¿la decisión frozen está respaldada?

FROZEN BUNDLE INTEGRITY
→ ¿los bytes y manifest son consistentes?

FINAL EVIDENCE PACKAGE READINESS
→ ¿el conjunto está listo para el siguiente gate?
```

Estos términos no crean estados normativos de ASC ni de los dominios.

---

## 20. Manejo de fallos

Antes de modificar ASC, localizar el origen:

```text
authority
evidence
contract
mapping
compiler
prompt
executor
scorer
oracle
documentation / provenance
```

No reescribir un run histórico para hacerlo pasar.

```text
preservar
→ auditar
→ corregir sistema
→ nueva revisión / nuevo run
```

Ante hash mismatch:

```text
detener gate
```

No modificar el hash declarado para forzar coincidencia.

---

## 21. Integración al repositorio

Una decisión validada no está automáticamente integrada.

Antes de escribir:

```text
identificar fuente canónica
evitar una segunda fuente de verdad
cambiar sólo el objeto autorizado
```

Para PR:

```text
usar .github/PULL_REQUEST_TEMPLATE.md
completar:
AUDITORÍA
INCONSISTENCIAS
VACÍOS / OMISIONES
REDUNDANCIAS
```

El repo dispone de `tools/audit-check.js` y del `Audit Protocol Check`.

Ejecutar sólo las validaciones pertinentes al alcance del cambio.

Commit, push, merge, rebase, reset o descarte requieren sus permisos correspondientes.

---

# Plantillas esenciales

## 22. TASK

```text
TASK ID:
OBJECTIVE:
SCOPE:
OUT OF SCOPE:

AUTHORITY:
INPUTS:
UPSTREAM STATES:
ASC TREATMENTS:
PROHIBITED:

EXPECTED ARTIFACT:
EVIDENCE CLASS:
VALIDATION CRITERIA:
NEXT GATE:
```

## 23. AUDIT

```text
AUDITORÍA

Objeto:
Autoridad:
Evidencia:

INCONSISTENCIAS

Hallazgo:
Impacto:
Bloqueante: YES / NO

VACÍOS / OMISIONES

Gap:
Evidencia faltante:
Estado real: OPEN | UNRESOLVED | NOT TESTED | otro

REDUNDANCIAS

Elemento:
Intencional / problemática:
Fuente canónica:

DECISIÓN

PASS / PARTIAL / FAIL
NEXT VERB:
```

## 24. VALIDATION

```text
VALIDATION ID:
ARTIFACTS:
HASHES:

REQUIRED CRITERIA:
- criterion
- evidence class
- result

OUT-OF-SCOPE / NOT TESTED:

RECOMPUTED SUMMARY:
BLOCKERS:
LIMITATIONS:

VALIDATION:
PASS / FAIL

NEXT GATE:
```

## 25. CONTROLLED RUN

```text
runId
testId
revision
executionType

repoRef
inputHashes
rulesHash
promptHash

executor:
  type
  identifier
  provider
  model
  provenanceStatus

rawResultHash

freeze:
  firstOutputOnly
  frozenBeforeScoring
  retryCount

scorer:
  version
  hash

oracle:
  version
  hash

result
limitations
```

No exigir campos que el gate no necesita y no inventar valores que no fueron capturados.

---

## 26. Qué queda fuera de esta guía

Esta guía no gobierna:

```text
verdad botánica
verdad territorial
canon de navegación
dirección artística
semántica normativa de ASC
schema ejecutable definitivo
provider generativo definitivo
política universal de freeze/blind
schema canónico de provenance
```

Tampoco incorpora historia de candidates, hashes de pruebas de sesión, auditorías internas ni closeouts de diseño. Esa evidencia pertenece a la trazabilidad del proceso, no al documento operativo estable.

---

## 27. Referencias metodológicas externas

Estas referencias se usan como contraste metodológico y no son autoridad de Árboris:

- NASA Systems Engineering Handbook — verification / validation.
- NASA IV&V — dimensiones de independencia.
- W3C PROV-O — Entity / Activity / Agent.
- SLSA Provenance — provenance de artefactos y proceso.
- Reproducible Builds — reproducibilidad de artefactos.
- NIST SP 800-218 SSDF — aseguramiento integrado al ciclo de desarrollo.
- NIST AI 600-1 — gestión de riesgos de IA generativa.

La adopción de una práctica externa en esta guía no la convierte en regla normativa del proyecto.

---

## 28. Regla final

```text
route first
→ read minimum authority
→ preserve evidence and OPEN
→ prepare the contract
→ audit / validate at the right stage
→ compile
→ execute only when requested
→ evaluate with the right evidence class
→ use advanced assurance only when triggered
→ integrate one source of truth
```