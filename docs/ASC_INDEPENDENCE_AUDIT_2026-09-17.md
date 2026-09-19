# ASC — Auditoría de independencia dentro del repositorio común

**Fecha:** 2026-09-17  
**Modo:** READ-ONLY audit → iteration documental  
**Repositorio:** `abrankil/arboris`  
**Alcance:** ASC como proyecto independiente de Álvaro que coexiste con ACE dentro del mismo repositorio común.

## 1. Propósito

Esta nota documenta la auditoría de ASC realizada sobre el sistema que realmente existe en `abrankil/arboris`.

La premisa de trabajo para esta auditoría es:

```text
ÁRBORIS
repositorio común
      │
      ├── ACE — proyecto de Alejandra
      │
      └── ASC — proyecto de Álvaro
```

La coexistencia en el mismo repositorio no implica que Árboris sea la autoridad conceptual de ASC ni que ACE y ASC deban compartir contratos, fuentes de verdad o decisiones de proyecto.

Esta nota **no prescribe una migración, separación física de repositorios ni refactor arquitectónico**. Su función es registrar qué se observó, qué declara ASC, qué implementa realmente y qué queda por demostrar.

## 2. Fuentes inspeccionadas

La auditoría siguió este orden:

1. `AGENTS.md`;
2. `docs/ARBORIS_SCENE_COMPILER.md`;
3. `docs/ASC_V0_1_EXECUTABLE_SPEC.md`;
4. `tools/asc/README.md`;
5. `tools/asc/compile_asc.mjs`;
6. `tools/asc/compile_asc.test.mjs`;
7. `tools/asc/fixtures/minimal-contract.json`;
8. `package.json`;
9. `.github/workflows/ci.yml`;
10. `.github/workflows/audit-protocol.yml`;
11. estructura del repositorio.

## 3. Distinciones de evidencia

### DECLARADO

ASC se declara como sistema de compilación de instrucciones para generación de escenas, blockouts y prototipos visuales. No es el modelo generativo, renderer, motor de navegación ni fuente de verdad territorial, botánica o científica. `docs/ARBORIS_SCENE_COMPILER.md` es la autoridad normativa declarada. `ASC_V0_1_EXECUTABLE_SPEC.md` es una especificación de implementación subordinada. `AGENTS.md` enruta las tareas ASC hacia estas fuentes. 

### OBSERVADO EN CÓDIGO

`tools/asc/compile_asc.mjs` implementa un compilador determinista `compile-only`. Valida forma de contrato, rechaza claves desconocidas y campos ausentes, exige versión/modo v0.1, preserva las secciones del contrato y produce texto estable. No contiene ejecución de modelos generativos ni lógica para decidir autoridad o suficiencia de evidencia.

### OBSERVADO EN TESTS

`compile_asc.test.mjs` comprueba determinismo, orden estable, preservación de `OPEN`, preservación de `DO NOT INFER`, representación explícita de secciones opcionales vacías, rechazo de `compile-and-execute`, rechazo de claves desconocidas, rechazo de campos ausentes y rechazo de `validationCriteria` vacío.

### OBSERVADO EN CI

`package.json` incluye `test:asc` y `npm test` lo ejecuta. El workflow principal `CI` ejecuta `npm test` con Node 24. El workflow `Audit Protocol Check` es independiente del test ASC y usa Node 20.

### INTERPRETACIÓN

La evidencia disponible permite tratar ACE y ASC como componentes técnicamente diferenciados dentro del mismo repositorio. No permite afirmar todavía que exista una interfaz de integración real entre ambos proyectos más allá de las interfaces/documentos que puedan existir en otras capas.

### HIPÓTESIS DE DISEÑO

La independencia lógica de ACE y ASC debería preservarse mediante autoridades, contratos, tests y decisiones `OPEN` propios de cada proyecto, utilizando el repositorio Árboris como infraestructura/repositorio común. Esta hipótesis no autoriza cambios de código.

## 4. Matriz de autoridad

| Objeto | Autoridad observable | No debe confundirse con |
|---|---|---|
| Repositorio común | `abrankil/arboris` como contenedor compartido | autoridad conceptual única de ACE/ASC |
| Reglas operativas de agentes | `AGENTS.md` | especificación normativa de ASC |
| Semántica normativa ASC | `docs/ARBORIS_SCENE_COMPILER.md` | código ejecutable |
| Implementación ASC v0.1 | `tools/asc/compile_asc.mjs` | autoridad de dominio |
| Contrato v0.1 | fixture/inputs conformes a `ASC_V0_1_EXECUTABLE_SPEC.md` | contrato definitivo de ASC |
| Tests ASC | `tools/asc/compile_asc.test.mjs` | fuente normativa |
| ACE | sus propias fuentes y contrato/implementación | autoridad de ASC |
| CI común | workflows del repositorio | autoridad semántica de ACE/ASC |

## 5. Resultado de trazabilidad

| Afirmación | Documentación | Contrato | Código | Tests | Resultado |
|---|---|---|---|---|---|
| `compile-only` | Sí | Sí | Sí | Sí | CONSISTENTE |
| Determinismo | Sí | Sí | Sí | Sí | CONSISTENTE |
| Preservación de `OPEN` | Sí | Sí | Sí | Sí | CONSISTENTE |
| Preservación de `DO NOT INFER` | Sí | Sí | Sí | Sí | CONSISTENTE |
| Rechazo de modo generativo en v0.1 | Sí | Sí | Sí | Sí | CONSISTENTE |
| Rechazo de claves desconocidas | Sí | Sí | Sí | Sí | CONSISTENTE |
| No decide autoridad | Sí | Sí | Sí, por ausencia de esa lógica | No directamente | CONSISTENTE CON EL ALCANCE |
| No ejecuta modelos | Sí | Sí | Sí, por ausencia de integración | Indirectamente | CONSISTENTE CON EL ALCANCE |
| Contrato definitivo | OPEN | OPEN | No implementado | No | OPEN EXPLÍCITO |
| Providers | OPEN | OPEN | No implementados | No | OPEN EXPLÍCITO |
| Renderer/blockout | OPEN | OPEN | No implementado | No | OPEN EXPLÍCITO |
| Persistencia de resultados | OPEN | OPEN | No implementada | No | OPEN EXPLÍCITO |

## 6. Independencia ACE ↔ ASC

### Evidencia a favor

- `AGENTS.md` realiza routing independiente para ACE y ASC.
- ACE y ASC tienen directorios de implementación separados bajo `tools/`.
- ASC no importa directamente el motor ACE ni los datos botánicos canónicos en su compilador v0.1.
- ASC define explícitamente que la autoridad botánica, territorial y científica pertenece al dominio correspondiente y no al compilador.
- ACE y ASC poseen comandos de test separados, aunque ambos participan del gate común `npm test`.

### Evidencia que todavía falta

No se identificó en esta Fase 1 un flujo de integración ejecutable que demuestre una transferencia real de información desde ACE hacia ASC o desde otro productor de contratos de Árboris hacia `compile_asc.mjs`.

El fixture `minimal-contract.json` demuestra el contrato de entrada del compilador, pero no demuestra por sí mismo quién lo produce ni cómo se autoriza en un flujo de producción.

Por tanto, la independencia lógica de ASC está bien declarada y parcialmente materializada, pero la interfaz entre proyectos sigue siendo una cuestión abierta de integración.

## 7. Hallazgos

### H1 — Ambigüedad terminológica entre ecosistema y proyecto

`ARBORIS_SCENE_COMPILER.md` denomina ASC como “capa de compilación de Árboris”. Esto describe su posición dentro del ecosistema, pero puede confundirse con una autoridad conceptual de Árboris sobre ASC.

**Clasificación:** documental / semántica.  
**No implica:** necesidad de modificar la especificación normativa.

### H2 — Interfaz de integración no demostrada

El repositorio demuestra un ASC v0.1 ejecutable, pero no demuestra todavía mediante un consumidor real quién produce el contrato ASC y cómo se conecta con otros proyectos/capas del repositorio.

**Clasificación:** vacío de evidencia de integración.  
**Estado:** OPEN.

### H3 — Contrato definitivo OPEN

El contrato JSON v0.1 es explícitamente provisional y no representa el formato serializado definitivo de ASC.

**Clasificación:** OPEN declarado.  
**No implica:** que el contrato v0.1 sea incorrecto.

### H4 — Configuración Node del workflow de auditoría

`package.json` exige Node `>=24 <25`, mientras `.github/workflows/audit-protocol.yml` declara Node 20. El CI principal usa Node 24.

**Clasificación:** mantenimiento de infraestructura común.  
**Relación con ASC:** indirecta.

## 8. No-hallazgos importantes

No se observó evidencia de:

- necesidad de crear un repositorio independiente para ASC;
- necesidad de migrar ASC fuera de `abrankil/arboris`;
- dependencia directa de `tools/asc/compile_asc.mjs` respecto de ACE;
- ejecución generativa oculta dentro del compilador v0.1;
- uso de un resultado generativo como autoridad botánica o territorial;
- una segunda implementación del compilador ASC v0.1;
- una fuente técnica paralela que contradiga la autoridad normativa de ASC.

## 9. Redundancias

La existencia conjunta de:

```text
ARBORIS_SCENE_COMPILER.md
ASC_V0_1_EXECUTABLE_SPEC.md
tools/asc/README.md
compile_asc.mjs
compile_asc.test.mjs
```

no constituye por sí sola redundancia problemática: cada elemento cumple una función diferente (norma, especificación de implementación, guía operacional, implementación y verificación).

Los documentos de frontera/proyecto deben permanecer descriptivos de la relación organizacional y no convertirse accidentalmente en una segunda especificación normativa del compilador.

## 10. Decisiones que permanecen OPEN

No resolver durante esta iteración:

- formato serializado definitivo de contratos ASC;
- quién produce y autoriza contratos ASC en cada flujo real;
- si existirá una interfaz formal ACE → ASC;
- significado concreto de una posible operación independiente de “Validar” dentro de ASC;
- frontera semántica definitiva entre `prohibited` y `doNotInfer`;
- providers/modelos;
- ejecución generativa;
- renderer/blockout;
- persistencia/versionado de resultados;
- métricas automáticas de fidelidad.

## 11. Resultado de la iteración

```text
AUDITORÍA
PASS — ASC existe como sistema/capa ejecutable diferenciada dentro del repositorio común.

INCONSISTENCIAS
H1 — terminología ecosistema/proyecto puede inducir ambigüedad.
H4 — Node 20 en audit-protocol.yml vs Node 24 requerido por package.json.

VACÍOS / OMISIONES
H2 — interfaz de integración real todavía no demostrada.
H3 — contrato definitivo continúa OPEN.

REDUNDANCIAS
No se detectó duplicación funcional de la implementación ASC.
Existe documentación múltiple con funciones diferenciadas.

CAMBIOS DE CÓDIGO
0

MIGRACIÓN
0

SEPARACIÓN FÍSICA DE REPOSITORIO
0
```

## 12. Criterio para la siguiente iteración

La siguiente investigación debe concentrarse en identificar las **interfaces reales de integración** dentro de `abrankil/arboris`, sin asumir que ACE es consumidor de ASC ni que ASC consume ACE.

Debe buscar evidencia de:

```text
productor de información/contrato
        ↓
contrato ASC
        ↓
ASC
        ↓
prompt / consumidor
```

Solo una interfaz existente y observable debe elevarse a requisito de integración. Una similitud conceptual entre proyectos no basta para crear una dependencia.

Esta nota no modifica las especificaciones normativas de ASC ni convierte las hipótesis anteriores en decisiones arquitectónicas.
