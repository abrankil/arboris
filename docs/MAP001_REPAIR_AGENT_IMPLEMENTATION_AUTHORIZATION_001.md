# MAP-001 — Repair Agent Implementation Authorization 001

Fecha: 2026-09-23
Estado: APPROVED_FOR_IMPLEMENTATION_PHASE
Branch de decisión: repair-agent-integration-design-001
Baseline de decisión: 6413e310aaeab9c09231b17330cb8120216c8504
Diseño autorizado: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_017.md
Validación aplicable: docs/MAP001_REPAIR_AGENT_INTEGRATION_DESIGN_R17_ASC_VALIDATION_001.md

## 1. Decisión humana

La dirección humana expresa aprobación para iniciar trabajo de implementación del diseño R17.

Registro de aprobación provisto en conversación:

`ok, apruebo (Alvaro)`

La identidad indicada por el aprobador es Álvaro. Este documento registra la declaración humana recibida; no afirma una verificación externa de identidad.

HUMAN_IMPLEMENTATION_AUTHORIZATION = TRUE.
IMPLEMENTATION_AUTHORIZED = TRUE.

## 2. Alcance de la autorización

La aprobación autoriza abrir la fase de implementación conforme al diseño R17 validado.

Autoriza:

- definir el alcance ejecutable concreto de la primera iteración;
- resolver los OPEN técnicos necesarios para esa iteración;
- implementar de forma acotada contra R17;
- crear schemas, adapters, guards, policies y tests requeridos por el alcance seleccionado;
- ejecutar pruebas locales/CI del código implementado;
- realizar auditoría, regresión y nueva validación de la implementación.

No autoriza por sí sola:

- conectar el repair agent a producción;
- ejecutar provider/model real salvo una autorización posterior específica que cubra esa prueba;
- declarar IMPLEMENTATION_READY;
- cerrar OPEN no implementados;
- cambiar autoridad E5.1/E5.2/E5.3;
- introducir una nueva frontera durable;
- silent hash-profile migration;
- merge a main sin pasar los gates normales;
- inferir NEXT_STAGE_ID;
- inferir AUTHORIZED_FOR_ASC.

## 3. Estado preservado

R17_VALIDATED_AT_DESIGN_LEVEL = TRUE.
IMPLEMENTATION_AUTHORIZED = TRUE.
IMPLEMENTATION_READY = FALSE.
REPAIR_AGENT_CONNECTED = FALSE.
NEXT_STAGE_ID = OPEN.
AUTHORIZED_FOR_ASC = OPEN.

La validación histórica R17 no se edita retroactivamente. Su `IMPLEMENTATION_AUTHORIZED = FALSE` describe correctamente el estado al momento de validación. Este documento es la autoridad posterior que cambia la decisión humana de implementación.

## 4. Gate de implementación

La autorización no permite saltar directamente a una integración completa.

La secuencia obligatoria es:

designar alcance ejecutable concreto
→ identificar OPEN requeridos por ese alcance
→ implementar de forma acotada
→ pruebas dirigidas/adversariales
→ AUDITORÍA
→ INCONSISTENCIAS
→ VACÍOS / OMISIONES
→ REDUNDANCIAS
→ correcciones
→ regresión
→ nueva validación
→ decisión separada antes de conectar el repair agent.

## 5. Apoyo ASC v0.1

ASC VERSION: 0.1
EXECUTION MODE: compile-only
TEST ID: MAP001-REPAIR-AGENT-IMPLEMENTATION-AUTHORIZATION-001-ASC

MANDATORY RELATIONS:
- human approval may change IMPLEMENTATION_AUTHORIZED;
- design validation remains historical and unchanged;
- implementation authorization does not imply implementation readiness;
- repair agent remains disconnected;
- OPEN remain OPEN until resolved by evidence/implementation;
- E5.3 remains sole durable boundary;
- no provider/model execution is inferred;
- NEXT_STAGE_ID remains OPEN;
- AUTHORIZED_FOR_ASC remains OPEN.

DO NOT INFER:
- approval means all implementation choices are approved;
- approval means provider/model execution is approved;
- approval means merge to main is approved;
- approval closes prototype-safe E5.1 or MINIMAL_CHANGE_EXECUTABLE_RULE;
- approval changes hash-profile compatibility;
- approval connects the repair agent.

ASC_CONTRACT_COMPILATION = PASS.

## 6. AUDITORÍA

La decisión humana satisface el gate posterior a R17 design validation: existe una aprobación explícita para iniciar trabajo de implementación.

La autorización se mantiene separada del diseño y de su validación para preservar trazabilidad temporal.

## 7. INCONSISTENCIAS

No existe contradicción entre la validación R17 histórica y esta autorización posterior.

La primera registra que no había autorización al validar; este documento registra el cambio de decisión posterior.

## 8. VACÍOS / OMISIONES

Falta todavía designar el alcance ejecutable concreto de la primera iteración.

También permanecen OPEN los elementos técnicos de R17 que solo deben resolverse en la medida requerida por ese alcance.

## 9. REDUNDANCIAS

No se edita R17 ni su acta de validación para duplicar la decisión.

Este documento cumple una función distinta: registrar la autoridad humana que habilita la fase de implementación.

## 10. Resultado

IMPLEMENTATION_PHASE_AUTHORIZED = TRUE.
IMPLEMENTATION_AUTHORIZED = TRUE.
IMPLEMENTATION_READY = FALSE.
REPAIR_AGENT_CONNECTED = FALSE.

NEXT PERMITTED WORK:
definir el alcance ejecutable concreto de la primera iteración de implementación R17.

NEXT_STAGE_ID = OPEN.
AUTHORIZED_FOR_ASC = OPEN.
