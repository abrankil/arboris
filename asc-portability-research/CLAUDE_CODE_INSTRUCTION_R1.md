ASC-META-DECK-AUDIT-CONTRACT-001 INSTRUCCIÓN CLAUDE CODE --- R1
CORRECCIÓN DIRIGIDA N1--N7

SCOPE

Esta revisión modifica EXCLUSIVAMENTE los hallazgos:

N1 --- PROMPT_SELF_AUTHORIZATION N2 --- SELF_FREEZE_AUTHORITY N3 ---
PRODUCER_SELF_VALIDATION N4 --- FREEZE/AUDIT_ORDERING N5 ---
CROSS_DOMAIN_AUTHORITY_LAUNDERING N6 --- LIVE_SOURCE_REPRODUCIBILITY N7
--- ADVERSARIAL_EVIDENCE_BINDING

Todo contenido de la instrucción anterior no afectado por N1--N7
permanece sin cambios.

No ampliar alcance. No introducir nuevos requisitos ASC. No resolver
decisiones abiertas. No auditar `ASC-META-DECK-COMPILATION-001`. No
construir ni modificar mazos. No modificar la especificación ASC. No
hacer commit.

============================================================ N1 ---
CORRECCIÓN DE PROMPT_SELF_AUTHORIZATION
============================================================

REGLA

Ninguna proposición introducida exclusivamente por esta instrucción
puede convertirse automáticamente en requisito normativo ASC.

Toda regla, restricción, relación o control propuesto por este prompt
debe clasificarse inicialmente como:

CANDIDATE_REQUIREMENT CANDIDATE_CONTROL PROPOSED_CONSTRAINT o el estado
equivalente definido por ASC canónico.

Esto incluye expresamente, pero no se limita a:

NOVELTY != VALUE SIMILARITY != PERFORMANCE separación productor/auditor
aislamiento temporal holdout baseline función objetivo métricas
thresholds reglas de abstención condiciones fail-closed propuestas en el
prompt

Para cada candidato:

1.  buscar autoridad aplicable en el ASC canónico;
2.  identificar artifact/version/path;
3.  verificar scope;
4.  verificar vigencia;
5.  construir AUTHORITY_BINDING si corresponde.

Si existe autoridad suficiente:

CANDIDATE → AUTHORITY_BINDING → AUTHORIZED_REQUIREMENT

Si no existe autoridad suficiente:

CANDIDATE → OPEN / UNRESOLVED

No promoverlo.

Si pertenece al diseño experimental y no a ASC:

CANDIDATE → EXPERIMENTAL_AUTHORITY_REQUIRED

El prompt NO puede citarse a sí mismo como autoridad.

PROHIBIDO:

PROMPT → REQUIREMENT → PASS/FAIL

sin autoridad independiente válida.

============================================================ N2 ---
CORRECCIÓN DE SELF_FREEZE_AUTHORITY
============================================================

REGLA

`ASC-META-DECK-AUDIT-CONTRACT-001` no puede definir por sí mismo la
autoridad necesaria para congelarse.

Antes de asignar cualquier estado de freeze, localizar en el repo la
autoridad ASC vigente que gobierne:

-   freeze;
-   versionado;
-   validación previa;
-   hashes/identificadores;
-   dependencias;
-   estados permitidos;
-   requisitos de cierre.

Construir:

FREEZE_AUTHORITY_BINDING

con al menos los campos exigidos por ASC vigente.

La relación debe ser:

ASC_CANONICAL_FREEZE_AUTHORITY ↓ FREEZE_REQUIREMENTS ↓
CONTRACT_CANDIDATE ↓ FREEZE_ELIGIBILITY

Está prohibido:

CONTRACT → DEFINES_OWN_FREEZE_RULES → SATISFIES_OWN_RULES → FROZEN

Si no existe autoridad suficiente o existe conflicto:

FREEZE_STATUS: BLOCKED_UNRESOLVED_AUTHORITY

No inferir.

============================================================ N3 ---
CORRECCIÓN DE PRODUCER_SELF_VALIDATION
============================================================

La prueba adversarial ejecutada por Claude durante la construcción debe
denominarse:

INTERNAL_ADVERSARIAL_PREFLIGHT

y nunca:

INDEPENDENT_AUDIT CERTIFICATION FINAL_VALIDATION

salvo que la autoridad ASC canónica encontrada autorice expresamente esa
equivalencia.

Por defecto:

INTERNAL_ADVERSARIAL_PREFLIGHT != INDEPENDENT_ASC_AUDIT

El productor puede intentar romper su propio contrato para detectar
defectos antes de entregarlo.

El productor NO puede usar el éxito de ese preflight como prueba
suficiente de certificación independiente.

El estado máximo producido por el preflight será el permitido por ASC
canónico.

Si ASC canónico no especifica uno, usar provisionalmente:

READY_FOR_INDEPENDENT_AUDIT

como estado descriptivo NO normativo.

No utilizar:

VALIDATED

como consecuencia automática del preflight interno.

============================================================ N4 ---
CORRECCIÓN DE FREEZE/AUDIT_ORDERING
============================================================

NO presupongas el orden:

internal validation → freeze → independent audit

ni:

internal validation → independent audit → freeze

Primero determina qué secuencia exige la autoridad ASC canónica vigente.

Registra:

FREEZE_AUDIT_ORDER_BINDING

incluyendo:

-   autoridad;
-   versión;
-   alcance;
-   secuencia requerida;
-   precondiciones;
-   excepciones si existen.

Sólo después aplica esa secuencia.

Si ASC canónico exige auditoría independiente antes del freeze
definitivo:

DRAFT → INTERNAL_ADVERSARIAL_PREFLIGHT → FREEZE_CANDIDATE →
INDEPENDENT_ASC_AUDIT → AUTHORIZED_FREEZE → FROZEN

Si ASC canónico permite freeze documental previo:

aplica exactamente la secuencia autorizada.

Si el repo no permite resolver la secuencia:

FREEZE_AUDIT_ORDER: UNRESOLVED

FREEZE: BLOCKED

No elijas una secuencia por conveniencia.

============================================================ N5 ---
CORRECCIÓN DE CROSS_DOMAIN_AUTHORITY_LAUNDERING
============================================================

Añadir control explícito de alcance de autoridad.

La existencia de una fuente autorizada NO basta.

Cada AUTHORITY_BINDING debe demostrar que la fuente posee autoridad
sobre la assertion concreta que pretende soportar.

Separar como mínimo los dominios que efectivamente resulten aplicables:

ASC_GOVERNANCE POKEMON_RULES FORMAT_LEGALITY META_OBSERVATION
EXPERIMENT_DESIGN METRIC_DEFINITION ACCEPTANCE_CRITERIA

Ejemplos de ataques que el contrato debe rechazar:

POKEMON_OFFICIAL_RULES -X→ ASC_ACCEPTANCE_THRESHOLD

META_DATA_PROVIDER -X→ POKEMON_FORMAT_LEGALITY

ASC_SPECIFICATION -X→ EMPIRICAL_META_FACT

TOURNAMENT_RESULT -X→ EXPERIMENTAL_OBJECTIVE_FUNCTION

Una autoridad puede cubrir más de un dominio únicamente cuando su scope
verificado lo permita explícitamente.

Para cada binding verificar:

AUTHORITY_ID SOURCE PROVENANCE SCOPE ASSERTION VALIDITY VERSION DOMAIN

Si:

ASSERTION ∉ AUTHORITY_SCOPE

entonces:

AUTHORITY_BINDING: INVALID_SCOPE

y la assertion no puede utilizarse para producir verdict.

Añadir ataque adversarial:

CROSS_DOMAIN_AUTHORITY_LAUNDERING_TEST

EXPECTED: REJECT / FAIL-CLOSED según semántica ASC vigente.

============================================================ N6 ---
CORRECCIÓN DE LIVE_SOURCE_REPRODUCIBILITY
============================================================

Una URL viva o una fuente externa cambiante no constituye por sí sola
provenance reproducible.

Para toda fuente externa material utilizada por el contrato o una futura
auditoría registrar, según permita el sistema:

SOURCE_ID SOURCE_AUTHORITY URL / ORIGIN RETRIEVED_AT EFFECTIVE_DATE si
existe FORMAT_SCOPE si corresponde SOURCE_VERSION si existe
CONTENT_SCOPE_CONSUMED SNAPSHOT / HASH / ARCHIVED_ARTIFACT si el flujo
vigente lo permite

Debe distinguirse:

SOURCE_IDENTITY

de:

CONTENT_ACTUALLY_CONSUMED

El contrato futuro no puede demostrar reproducibilidad solamente
mediante:

"se consultó la página oficial"

o:

"se usaron datos de Limitless"

Si la fuente no permite snapshot/hash:

registrar explícitamente la limitación.

No fabricar una versión inexistente.

Si la reproducibilidad material requerida por ASC no puede demostrarse:

REPRODUCIBILITY: UNRESOLVED

y aplicar el comportamiento fail-closed establecido por la autoridad
vigente.

Extender este control tanto a:

-   datasets META;
-   reglas oficiales;
-   legalidad/formato;
-   documentación externa material.

============================================================ N7 ---
CORRECCIÓN DE ADVERSARIAL_EVIDENCE_BINDING
============================================================

No basta registrar:

ADVERSARIAL_PREFLIGHT: PASS

Cada ataque ejecutado durante el preflight debe producir un registro
individual.

Utilizar el esquema canónico ASC si existe.

Si no existe un esquema más específico, registrar provisionalmente:

ATTACK_ID TARGET_INVARIANT TARGET_ARTIFACT PRECONDITION ATTACK /
MUTATION EXPECTED_BEHAVIOR OBSERVED_BEHAVIOR EVIDENCE RESULT
AFFECTED_REQUIREMENTS

Los ataques mínimos siguen siendo los definidos en la instrucción
original, pero ahora cada uno debe generar evidencia verificable.

Incluir además el ataque introducido por N5:

CROSS_DOMAIN_AUTHORITY_LAUNDERING_TEST

y los ataques necesarios para N2--N4:

SELF_FREEZE_AUTHORITY_TEST PRODUCER_SELF_CERTIFICATION_TEST
FREEZE_AUDIT_ORDER_BYPASS_TEST

Estos ataques se añaden únicamente porque prueban directamente los
defectos N1--N7.

No ampliar la batería hacia otros dominios.

Un resultado global:

PREFLIGHT_PASS

sólo puede derivarse de resultados individuales trazables.

Si un ataque material no tiene evidencia:

ATTACK_RESULT: UNRESOLVED

No convertirlo en PASS.

============================================================ REGRESIÓN
DIRIGIDA R1 ============================================================

Después de aplicar las correcciones anteriores, ejecutar EXCLUSIVAMENTE
una regresión dirigida contra N1--N7.

Verificar:

N1 ¿Puede una regla introducida solamente por el prompt convertirse en
requisito sin autoridad externa válida?

EXPECTED: NO

N2 ¿Puede el contrato autorizar su propio freeze?

EXPECTED: NO

N3 ¿Puede el preflight interno producir por sí mismo certificación
independiente?

EXPECTED: NO

N4 ¿Puede Claude elegir libremente el orden freeze/audit?

EXPECTED: NO

N5 ¿Puede una autoridad válida en un dominio autorizar una assertion
fuera de su scope?

EXPECTED: NO

N6 ¿Puede una URL viva sin identificación del contenido consumido
satisfacer automáticamente provenance/reproducibility?

EXPECTED: NO

N7 ¿Puede declararse PASS adversarial sin evidencia individual de los
ataques ejecutados?

EXPECTED: NO

============================================================ CRITERIO DE
CIERRE DE R1
============================================================

R1 sólo puede considerarse corregida respecto de N1--N7 si los siete
ataques anteriores producen el comportamiento esperado.

Esto NO significa:

-   que el contrato esté certificado;
-   que el contrato pueda congelarse;
-   que el experimento esté autorizado;
-   que `ASC-META-DECK-COMPILATION-001` haya sido auditado;
-   que todos los requisitos ASC estén satisfechos.

Significa únicamente:

N1--N7: REGRESSION_PASS

si existe evidencia suficiente.

Cualquier otro defecto descubierto accidentalmente durante esta
regresión debe registrarse como:

OUT_OF_SCOPE_FINDING

sin corregirlo en esta R1.

============================================================ SALIDA
============================================================

Al terminar, informar:

FILES_CREATED_OR_MODIFIED N1_STATUS N2_STATUS N3_STATUS N4_STATUS
N5_STATUS N6_STATUS N7_STATUS DIRECTED_REGRESSION_RESULT
OUT_OF_SCOPE_FINDINGS FREEZE_STATUS NEXT_PROCEDURAL_STEP git diff --stat

No hacer commit.
