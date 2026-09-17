# ASC — Matriz de transferencia del handoff de Hito 15

**Fecha:** 2026-09-17  
**Estado:** diagnóstico preparatorio; no autoriza implementación  
**Ámbito:** ASC de Álvaro, tomando Árboris/ACE únicamente como fuente del criterio de ingeniería transferible.

## Regla de uso

El handoff de Hito 15 establece que debe transferirse método, disciplina, invariantes generales, contratos explícitos, tratamiento correcto de incertidumbre, separación de responsabilidades, validación y auditoría; no deben transferirse automáticamente ACE, estructuras, paths, APIs, IDs, datos botánicos, contratos específicos, thresholds, número de tests, implementación, decisiones OPEN ni arquitectura futura de Árboris.

Esta matriz se prepara antes de disponer de la plataforma/repositorio independiente de ASC. Por ello, las clasificaciones son **preliminares** y no sustituyen la Fase 1 read-only sobre el proyecto receptor.

## Criterios

- **A — PRINCIPIO TRANSFERIBLE:** principio general que ya tiene un equivalente real o un objetivo claramente definido en ASC.
- **B — ESPECÍFICA DE ÁRBORIS:** regla cuya semántica depende del dominio de Árboris/ACE y no debe trasladarse.
- **C — NO APLICABLE:** no existe justificación para aplicarla al ASC identificado.
- **D — REQUIERE DECISIÓN:** puede ser útil, pero requiere una decisión propia de ASC.
- **E — ESTADO HISTÓRICO:** describe una condición de Hito 15 y no es un requisito de ASC.

## Matriz

| Lección | Clasificación preliminar | Tratamiento en ASC | Justificación / condición |
|---|---|---|---|
| A. Autoridad antes que implementación | **A** | Transferir | ASC ya distingue autoridad normativa, contrato, implementación y límites de ejecución. Debe conservarse como gate de desarrollo. |
| B. Una fuente de verdad por dominio | **A** | Transferir | Es directamente compatible con la separación entre contrato/autoridad de entrada, compilador y ejecutor. No crear una segunda autoridad dentro de ASC. |
| C. Conocimiento de dominio vs. código | **A** | Transferir con adaptación | El principio aplica: ASC no debe hardcodear conocimiento de dominios consumidores. La fuente concreta de cada dominio pertenece al consumidor/autoridad correspondiente. |
| D. Contratos antes que heurísticas | **A** | Transferir | ASC ya tiene un contrato ejecutable v0.1 y validación. Debe extenderse solo si el gap analysis del proyecto independiente demuestra necesidad. |
| E. Incertidumbre | **A** | Transferir | `OPEN` y `DO NOT INFER` ya son parte del contrato/prompt ASC. La semántica final debe pertenecer al contrato de ASC. |
| F. Repetición vs. independencia | **D** | Decidir en ASC | La regla concreta de Hito 15 sobre dimensiones de caracteres pertenece a ACE. El principio abstracto podría ser útil para evidencia/inputs de escena, pero no existe justificación para copiar la semántica de caracteres. |
| G. Conclusiones fuertes | **A** | Transferir | ASC debe impedir que una señal, score o salida plausible adquiera autoridad por sí sola. Requiere definir el límite entre compilación y cualquier evaluación posterior. |
| H. Estados con semánticas diferentes | **A** | Transferir | ASC necesita conservar las diferencias semánticas entre estados como `OPEN`, prohibiciones, restricciones y condiciones contractuales. No colapsarlos por conveniencia. |
| I. Excepciones explícitas | **A** | Transferir | Evita convertir una excepción de una escena o consumidor en tolerancia global del compilador. |
| J. Datos inválidos | **A** | Transferir | El comportamiento fail-closed ya está presente en v0.1. Debe preservarse y ampliarse solo donde el contrato lo requiera. |
| K. Compatibilidad vs. migración | **A** | Transferir | Es relevante para separar ASC del repositorio Árboris: compatibilidad con el baseline no equivale a migración automática ni copia de estructuras. |
| L. Cambios de contrato | **A** | Transferir | Es especialmente importante para el futuro contrato independiente de ASC: localizar consumidores, tests y documentación antes de cambiarlo. |
| M. Tests como protección de invariantes | **A** | Transferir | ASC ya tiene siete tests v0.1. El principio transferible es proteger invariantes, no trasladar el número de tests. |
| N. Determinismo | **A** | Transferir | Es un requisito explícito de `compile-only` v0.1: misma entrada + mismas reglas → mismo resultado. Debe preservarse mientras el componente siga siendo determinista. |
| O. Separación de responsabilidades | **A** | Transferir | Es central para ASC: una señal o resultado generativo no se convierte automáticamente en verdad. La compilación no adquiere autoridad sobre el dominio. |
| P. Decisiones OPEN | **A** | Transferir | ASC ya mantiene abiertas ejecución generativa, providers, métricas, renderer y persistencia. No deben cerrarse por conveniencia. |
| Q. No sobreingeniería | **A** | Transferir | El proyecto ASC debe resolver el problema presente con la mínima arquitectura que satisfaga su contrato. |
| R. Control de alcance | **A** | Transferir | Es necesario para evitar que la separación ASC provoque una migración o refactor masivo de Árboris sin justificación. |

## Resultado preliminar

### A — PRINCIPIOS TRANSFERIBLES

A, B, C, D, E, G, H, I, J, K, L, M, N, O, P, Q, R.

La transferencia se refiere al **principio**, no a la implementación concreta de Árboris/ACE.

### B — ESPECÍFICAS DE ÁRBORIS

No se identifica en la lista A–R una lección que deba trasladarse como regla concreta de dominio botánico. Las reglas específicas de ACE/Hito 15 quedan fuera de transferencia aunque puedan haber originado algunos de los principios generales.

### C — NO APLICABLE

No se clasifica ninguna de A–R como C en esta fase preparatoria porque todas contienen un principio de ingeniería potencialmente relevante para ASC o una decisión que debe contrastarse con su plataforma. Esto no obliga a implementar ninguna.

### D — REQUIERE DECISIÓN

**F — Repetición vs. independencia.**

El principio abstracto es razonable, pero su definición concreta en Hito 15 depende del dominio de identificación por caracteres. Antes de trasladarlo a ASC habría que definir qué constituye una unidad de evidencia independiente en el contrato de escenas, si ese problema existe realmente.

También queda como decisión transversal la frontera exacta entre el contrato que prepara Árboris y el contrato que pertenece a ASC.

### E — ESTADO HISTÓRICO

No se identifica una lección A–R que deba convertirse en requisito histórico de ASC. Los estados, conteos, fixtures, rutas y resultados concretos de Hito 15 son evidencia histórica del proyecto Árboris y no requisitos del proyecto ASC.

## Principios que ya están presentes en ASC

Según la documentación y código inspeccionados, ASC ya materializa varios de estos principios:

- contrato estructurado antes de compilar;
- validación de entrada;
- comportamiento `compile-only`;
- determinismo;
- preservación de `OPEN`;
- rechazo de `compile-and-execute` en v0.1;
- rechazo de claves desconocidas;
- tests específicos del compilador;
- separación entre compilador y ejecutor generativo.

Por tanto, el handoff no debe utilizarse para recrear estas capacidades desde cero.

## Gaps que deben verificarse en la plataforma independiente

No se consideran todavía gaps confirmados. Son puntos de verificación para la Fase 1:

1. ¿Existe una autoridad propia de ASC separada de Árboris?
2. ¿Existe un contrato independiente de entrada?
3. ¿Existe una política explícita de versionado/compatibilidad del contrato?
4. ¿Los consumidores pueden usar ASC sin conocer su implementación interna?
5. ¿Los estados `OPEN`, restricciones y prohibiciones tienen semántica contractual estable?
6. ¿Los tests protegen invariantes o solamente ejemplos del baseline?
7. ¿La determinación de autoridad queda fuera de ASC cuando pertenece al dominio consumidor?
8. ¿Existe una frontera explícita entre compilación, ejecución y evaluación del resultado?

## Cambios potenciales condicionados a evidencia

No se autoriza todavía ninguno. Los candidatos que deberán evaluarse en la plataforma independiente son:

### 1. Contrato ASC independiente

**Principios:** A, B, D, L, O.  
**Evidencia necesaria:** arquitectura y consumidores reales del ASC independiente.  
**Problema:** evitar dependencia de estructuras internas de Árboris.  
**Riesgo:** diseñar un contrato abstracto antes de conocer las necesidades reales.

### 2. Fortalecimiento de invariantes

**Principios:** D, E, H, J, M, N, O.  
**Evidencia necesaria:** gaps entre contrato, implementación y tests.  
**Problema:** proteger semánticas que actualmente puedan depender solo de implementación.  
**Riesgo:** añadir restricciones que el contrato aún no autoriza.

### 3. Política de evolución del contrato

**Principios:** K, L, P, Q, R.  
**Evidencia necesaria:** existencia de consumidores/versiones reales.  
**Problema:** evitar migraciones silenciosas.  
**Riesgo:** crear infraestructura de versionado antes de necesitarla.

## Gate de implementación

No se implementa ningún cambio derivado de esta matriz hasta que exista la plataforma/repositorio de ASC y se complete la Fase 1 read-only allí.

La Fase 1 debe confirmar o refutar estas clasificaciones mediante evidencia del proyecto receptor. Si el proyecto ya cumple una lección, se registra como existente y no se modifica. Si una lección no aplica, se reclasifica. Si requiere una decisión, permanece `OPEN`.

## Auditoría de esta iteración

### AUDITORÍA

Se revisaron las 18 lecciones A–R del handoff y se contrastaron con la frontera ASC/Árboris y con el estado documentado de ASC v0.1. No se realizó implementación.

### INCONSISTENCIAS

No se detectó una contradicción entre el handoff y la frontera documentada. Sí se mantiene una diferencia deliberada entre la clasificación preliminar y la clasificación definitiva: la definitiva requiere inspección del proyecto receptor.

### VACÍOS / OMISIONES

La plataforma/repositorio independiente de ASC todavía no está disponible para verificar consumidores, configuración, CI, autoridad propia y contrato real. Por ello no se pueden confirmar gaps de implementación.

### REDUNDANCIAS

No se recomienda copiar la implementación v0.1 ni duplicar las autoridades de Árboris. La matriz es una capa documental de preparación y no una nueva fuente de verdad normativa.

## Cambios realizados

Solo documentación.

No se modificaron código, datos, contratos existentes, ACE, runtime ni configuración.