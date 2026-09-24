# MAP-001 — Repair Agent Integration Design R13 — Directed Regression 001

Fecha: 2026-09-23
Artefacto auditado: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_013.md
Head auditado: aca487b050cc6987a22dd02a31bd59f64e92200b
Ámbito: R12-N1/R12-N2 + regresión acumulada completa
REPAIR_AGENT_CONNECTED: FALSE
IMPLEMENTATION_AUTHORIZED: FALSE
NEXT_STAGE_ID: OPEN
AUTHORIZED_FOR_ASC: OPEN

## 1. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-INTEGRATION-R13-DIRECTED-REGRESSION-001

ASC preserva restricciones, OPEN, DO NOT INFER y criterios. No ejecuta provider/model ni autoriza implementación.

## 2. AUDITORÍA

R13 corrige materialmente R12-N2: ASSURANCE_PRODUCER_AUTHORITY_V1 separa integridad del report de autenticidad de producer/execution y liga producer, execution identity, report digest, tested runtime/closure y claim mapping.

R13 también mejora R12-N1 con EXECUTABLE_DEPENDENCY_CLOSURE_V1, import graph autorizado, resolución fail-closed, bindings de runtime/built-ins, package/native dependencies y environment input policy.

La regresión detecta dos brechas restantes dentro de R12-N1: el closure no regula todavía todas las superficies de ejecución secundarias del runtime, y los inputs semánticos ambientales accesibles por módulos ya autorizados no están completamente cerrados por capability domain.

## 3. Resultado dirigido

R12-N1 = PARTIAL / BLOCKED BY R13-N1 + R13-N2.
R12-N2 = PASS AT DESIGN LEVEL.
R11-N1 = PASS AT VERIFIED-LOAD DESIGN LEVEL.
R11-N2 = PASS AT AUTHENTICATED-ASSURANCE DESIGN LEVEL.
R11-N3 = PASS.
R10-N1..R10-N3 = PASS AT DESIGN LEVEL.
R9-N1..R9-N3 = PASS AT DESIGN LEVEL.
R8-N1..R8-N3 = PASS AT DESIGN LEVEL.
R7-N1..R7-N3 = PASS.
R6-N1..R6-N3 = PASS AT DESIGN LEVEL.
R5-N1..R5-N3 = PASS.
R4-N1/R4-N2 = PASS AT DESIGN LEVEL.
R3-N1/R3-N2 = PASS AT DESIGN LEVEL.
R2-N1 = PASS.
R2-N2 = PASS AT DESIGN LEVEL / EXECUTABLE DEBT OPEN.
R2-N3 = PASS.
RA-I1 = PARTIAL / EXECUTION-SURFACE + SEMANTIC-INPUT CLOSURE INCOMPLETE.
RA-I2 = PASS.
RA-I3 = PASS.
RA-I4 = PASS AS OPEN/BLOCKING.
RA-I5 = PASS AT DESIGN LEVEL / E5.1 EXECUTABLE DEBT OPEN.
RA-I6 = PASS AT DESIGN-COVERAGE LEVEL.
RA-I7 = PASS.
RA-I8 = PASS.

## 4. R12-N2 — PASS AT DESIGN LEVEL

ASSURANCE_PRODUCER_AUTHORITY_V1 es resolver-owned y no puede ser seleccionada por transport, model o el report PASS.

La secuencia de verificación liga producer identity, execution identity, report digest, tested runtime snapshot, executable closure, test definitions, scope y validity policy.

No se detecta nuevo blocker arquitectónico en esta corrección.

## 5. R13-N1 — execution-surface closure incompleto

EXECUTABLE_DEPENDENCY_CLOSURE_V1 controla la resolución/carga de módulos y dependencias.

Sin embargo, un runtime puede disponer de mecanismos capaces de crear o iniciar comportamiento ejecutable sin pasar por un import edge normal. R13 no define todavía si esas superficies secundarias están prohibidas, vinculadas o interceptadas.

Impacto: un módulo autorizado podría originar comportamiento ejecutable no representado por el grafo de imports mientras todos los importEdgeBindings siguen siendo válidos.

Corrección requerida: definir EXECUTION_SURFACE_POLICY_V1 o equivalente. Cada mecanismo del runtime capaz de crear, compilar, cargar o iniciar código debe clasificarse como FORBIDDEN, BOUND_AND_VERIFIED o ALLOWED_NON_EXECUTING. Todo comportamiento ejecutable BOUND_AND_VERIFIED debe incorporarse al closure antes de su uso; cualquier superficie no declarada falla cerrado.

La policy y su enforcement deben formar parte de INTEGRATION_RUNTIME_SNAPSHOT y del scope de assurance.

R13-N1 = BLOCKER.

## 6. R13-N2 — semantic ambient inputs incompletos

ENVIRONMENT_INPUT_POLICY_V1 clasifica inputs ambientales, pero R13 no define todavía una frontera completa para recursos y estado no ejecutables que un módulo/built-in autorizado puede consultar y que pueden modificar su comportamiento.

Ejemplos conceptuales: archivos/configuración fuera del artifact set, process state, tiempo/locale, randomness, resolución de red/TLS/proxy, recursos temporales o caches y otros servicios del sistema.

Impacto: el executable graph puede estar cerrado y aun así variar semánticamente por inputs no vinculados.

Corrección requerida: definir SEMANTIC_INPUT_CLOSURE_V1 por capability domain, clasificando cada canal como FORBIDDEN, FIXED_AND_BOUND, EXPLICIT_RUNTIME_INPUT, PROVIDER_TRANSPORT_AUTHORIZED o ALLOWED_NON_SEMANTIC.

El dominio resolver/canonicalizer/materializer no debe tener inputs semánticos no declarados. El dominio transport solo puede usar red/endpoint y estado externo conforme a policies ya vinculadas. Cualquier recurso de archivo/configuración consumido debe estar verificado o explícitamente ligado.

El digest de esta policy debe entrar en INTEGRATION_RUNTIME_SNAPSHOT y assurance evidence.

R13-N2 = BLOCKER.

## 7. Cierres acumulados preservados

Se preservan sin reapertura: R11-N3; separación LEGACY_LOGICAL_SHA256_V1 vs CANONICAL_JSON_SHA256_V2; NO_IMPLICIT_HASH_MIGRATION; E5_HASH_PROFILE_COMPATIBILITY_GATE_V1; provider-native identity solo con DIRECT_RUNTIME_EVIDENCE; assurance autenticada; cadena E5.1 → E5.2 → E5.3; E5.3 como única frontera durable.

PROTOTYPE_SAFE_REPAIR_APPLICATION y MINIMAL_CHANGE_EXECUTABLE_RULE continúan OPEN y no se cierran por inferencia.

## 8. INCONSISTENCIAS

No se detecta contradicción con Repair R1 ni con E5.1/E5.2/E5.3.

La inconsistencia conceptual restante está en declarar el executable dependency closure operacionalmente cerrado cuando la enforcement descrita cubre principalmente resolución de módulos, pero no todas las superficies secundarias capaces de originar ejecución.

ENVIRONMENT_INPUT_POLICY_V1 tampoco cierra explícitamente todos los inputs semánticos accesibles mediante capabilities ya autorizadas.

## 9. VACÍOS / OMISIONES

R13-N1: execution-surface policy y enforcement para toda superficie de ejecución secundaria del runtime.
R13-N2: semantic-input closure por capability domain.

Permanecen OPEN: implementación del closure/loader, runtime/toolchain exactos, built-ins permitidos, bootstrap, CANONICAL_JSON_NUMBER_POLICY, CANONICAL_JSON_SHA256_V2, snapshot/materializer, assurance technology/trust anchors, provider/runtime, bridge A/B/C hacia E5, prototype-safe E5.1, minimal-change rule, límites numéricos, schemas, strict parser, autorización humana de implementación, NEXT_STAGE_ID y AUTHORIZED_FOR_ASC.

## 10. REDUNDANCIAS

No se detecta redundancia problemática.

Module dependency closure + execution-surface policy cubren resolución/carga y superficies secundarias de ejecución.
Semantic-input closure + executable closure cubren inputs de estado/datos y dependencias ejecutables.
Assurance producer authority + immutable PASS report cubren autenticidad e integridad.
E5 compatibility gate + E5.1/E5.2/E5.3 siguen siendo controles distintos.

## 11. Resultado

R12-N1 = PARTIAL.
R12-N2 = RESOLVED AT DESIGN LEVEL.

NEW FINDINGS:
R13-N1 = BLOCKER — executable closure no cubre todavía todas las superficies secundarias de ejecución.
R13-N2 = BLOCKER — inputs semánticos ambientales no están completamente cerrados por capability domain.

NEW_BLOCKING_FINDINGS = 2.
NEW_MAJOR_FINDINGS = 0.
R13_DIRECTED_REGRESSION = CORRECTION_REQUIRED.
IMPLEMENTATION_AUTHORIZED = FALSE.
REPAIR_AGENT_CONNECTED = FALSE.
NEXT_STAGE_ID = OPEN.
AUTHORIZED_FOR_ASC = OPEN.

## 12. Gate siguiente

Procede exclusivamente una R14 documental que:

1. cierre las superficies secundarias capaces de originar ejecución fuera del module graph;
2. cierre los semantic inputs por capability domain;
3. preserve R12-N2 y todos los cierres acumulados;
4. no implemente todavía loader, canonicalizer, sandbox, E5.1, transport, provider ni repair agent.

Después debe ejecutarse regresión dirigida R13-N1/R13-N2 + regresión acumulada completa antes de intentar design validation.
