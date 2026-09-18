# ASC — Auditoría de Execution Iteration 002

**Fecha:** 2026-09-18  
**Repositorio:** `abrankil/arboris`  
**Estado:** documentado  
**Ámbito:** auditoría de la iteración correctiva posterior a los primeros resultados generativos de MAP-001.

## 1. Contexto

La iteración `EXECUTION ITERATION 002` fue construida para corregir fallos observados en ejecuciones generativas previas contra:

- `MAP-001-ASC-MAPPING-0021 v2.1`;
- `docs/ARBORIS_SCENE_COMPILER.md`;
- `docs/ASC_MAP001_GENERATIVE_RESULT_AUDIT_2026-09-17.md`.

El objetivo de esta auditoría es determinar si la iteración:

- preserva el contrato v2.1;
- conserva `OPEN` y `DO NOT INFER`;
- evita invenciones observadas en ejecuciones previas;
- mantiene trazabilidad suficiente para una nueva ejecución;
- introduce o no cambios que deban promoverse a ASC v0.1 o al contrato.

## 2. Resultado general

```text
ASC AUDIT — EXECUTION ITERATION 002

CONTRACT PRESERVATION: PASS
MANDATORY RELATIONS: PASS
OPEN PRESERVATION: PASS
DO NOT INFER: PASS
PROHIBITED: PASS
EXECUTION HYGIENE: PASS

AUTHORITY SEPARATION: PARTIAL
PROMPT PROVENANCE: FAIL
BASELINE IDENTITY: FAIL
VISUAL / GEOMETRIC DISTINCTION: PARTIAL

DECISION:
PARTIAL / REVISE

ASC v0.1 CHANGE REQUIRED: NO
CONTRACT v2.1 CHANGE REQUIRED: NO
v0.2 TRIGGER: NO
```

## 3. Preservación del contrato

La iteración mantiene correctamente las relaciones obligatorias del contrato v2.1:

```text
entrada inferior
→ puente
→ puerta
→ camino principal
→ interior / cordillera
```

También conserva:

- casa del conserje a la izquierda después del umbral;
- estero cruzando bajo el puente;
- giro visual en L del estero;
- estero a la derecha y en nivel inferior después del umbral;
- laderas que contienen lateralmente el corredor;
- dominancia de la ruta principal;
- continuidad visual del terreno.

**Resultado:** `PASS`.

## 4. OPEN y DO NOT INFER

La iteración preserva como indeterminados:

- geometría exacta del `walkableEnvelope`;
- rasterización;
- dimensiones;
- distancias;
- escala;
- bearing exacto del puente;
- métrica exacta del giro del estero;
- pitch;
- yaw;
- FOV;
- zoom definitivo;
- orientación cardinal geográfica.

También bloquea correctamente inferencias no respaldadas sobre:

- norte / sur / este / oeste;
- coordenadas;
- escalas y kilometraje;
- pendientes o alturas medidas;
- distribución botánica;
- microhábitats;
- infraestructura adicional.

**Resultado:** `PASS`.

## 5. Correctivos locales de ejecución

La iteración incorpora restricciones adicionales motivadas por fallos observados en resultados anteriores.

Entre ellas:

- no convertir el estero en lago, laguna, costa, bahía o archipiélago;
- no introducir rutas hacia mirador, laguna o bosque;
- no generar dashboard, infografía, HUD, leyendas, brújula, escala, coordenadas, hashes o metadata dentro de la imagen;
- no usar señalética escrita como sustituto de relaciones espaciales.

Estas restricciones son útiles para la prueba, pero no forman parte explícita del contrato v2.1.

Por tanto deben tratarse como:

```text
EXECUTION-LOCAL CORRECTIVE CONSTRAINTS
```

No deben promoverse automáticamente a:

- contrato v2.1;
- ASC v0.1;
- autoridad normativa general.

## 6. Problema de provenance

`PROMPT_ASC_BASELINE-001` ya tiene un prompt canónico registrado con SHA-256:

```text
a2a907f60ca279e6f8ef52f0c76af549bae958c2cae004e305299f369093cf00
```

La iteración 002:

- agrega instrucciones;
- reorganiza contenido;
- incorpora restricciones correctivas;
- modifica el prompt efectivo.

Por tanto:

```text
CONTRATO v2.1
= MISMO

PROMPT CANÓNICO BASELINE-001
≠ EXECUTION ITERATION 002
```

La iteración 002 no puede ejecutarse ni registrarse como si fuera `BASELINE-001`.

**Resultado:** `PROMPT PROVENANCE: FAIL` hasta asignar un nuevo identificador y hash.

## 7. Identidad recomendada para la siguiente ejecución

Se recomienda registrar la próxima corrida como:

```text
MAP-001-ASC-GENERATIVE-EXEC-002
```

o identificador equivalente que preserve explícitamente que:

- el contrato sigue siendo `MAP-001-ASC-MAPPING-0021 v2.1`;
- el prompt efectivo cambió;
- las nuevas restricciones son correctivos locales de ejecución;
- `BASELINE-001` permanece intacto como artefacto canónico previo.

Antes de ejecutar debe calcularse y registrar un nuevo SHA-256 del prompt efectivo.

## 8. Distinción visual / geométrica

Una salida generativa puede evaluar:

- apariencia de continuidad;
- jerarquía visual;
- relaciones espaciales visibles;
- legibilidad compositiva.

No puede demostrar por sí sola:

- `walkableEnvelope` real;
- transitabilidad geométrica;
- conectividad de gameplay;
- colliders;
- navegación efectiva.

La validación correcta debe mantener:

```text
apariencia de una única región continua
→ EVALUABLE VISUALMENTE

walkableEnvelope real
→ NOT TESTED

transitabilidad geométrica
→ NOT TESTED
```

No declarar `PASS geométrico` a partir de una imagen.

## 9. Cámara y composición

La instrucción:

```text
La cámara debe permitir leer simultáneamente
puente–puerta–casa–camino–estero
```

es útil para esta prueba, pero no constituye un nuevo invariante de cámara.

Debe entenderse como:

```text
Para esta prueba visual, priorizar una composición que permita
evaluar las relaciones obligatorias en una sola salida,
sin convertir el encuadre resultante en autoridad de cámara.
```

## 10. Decisión

La iteración 002 es adecuada como corrección experimental, pero requiere una separación más explícita entre:

- contrato;
- prompt canónico previo;
- correctivos locales;
- nueva ejecución.

No hay evidencia que justifique modificar:

- ASC v0.1;
- `MAP-001-ASC-MAPPING-0021 v2.1`;
- el esquema de 14 claves;
- abrir v0.2.

## 11. Próximo gate

Antes de ejecutar `MAP-001-ASC-GENERATIVE-EXEC-002`:

1. congelar el prompt efectivo;
2. asignar ID de ejecución nuevo;
3. calcular SHA-256 del prompt;
4. registrar provider;
5. registrar model ID / versión cuando esté disponible;
6. registrar parámetros expuestos;
7. ejecutar;
8. auditar el resultado con los mismos criterios contractuales;
9. clasificar por separado evidencia visual y evidencia geométrica.

## 12. Auditoría

### AUDITORÍA

La iteración corrige de forma útil los fallos generativos previos y preserva el contrato v2.1.

### INCONSISTENCIAS

El principal problema detectado es tratar una versión de prompt modificada como si conservara identidad con `BASELINE-001`.

### VACÍOS / OMISIONES

Quedan pendientes:

- nuevo ID de ejecución;
- nuevo hash de prompt;
- provenance del ejecutor;
- ejecución;
- auditoría del resultado.

### REDUNDANCIAS

No se detecta necesidad de duplicar reglas en ASC v0.1 ni de modificar el contrato.

### DECISIÓN

```text
EXECUTION ITERATION 002
PARTIAL / REVISE

KEEP ASC v0.1
KEEP MAP-001-ASC-MAPPING-0021 v2.1
KEEP BASELINE-001 INTACT

NEXT:
REGISTER MAP-001-ASC-GENERATIVE-EXEC-002
WITH NEW PROMPT HASH AND EXECUTION PROVENANCE
```
