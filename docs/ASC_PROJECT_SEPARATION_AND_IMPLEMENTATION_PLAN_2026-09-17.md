# ASC — Separación de proyecto y plan de implementación

**Fecha:** 2026-09-17  
**Estado:** documentado; no constituye todavía una autorización de implementación  
**Propósito:** dejar registrada la separación entre el frente de Alejandra (Árboris/ACE) y el frente de Álvaro (ASC) antes de iterar sobre cualquiera de ellos.

## 1. Decisión de organización

Se establece como objetivo de trabajo la siguiente separación:

```text
ALEJANDRA
Árboris
└── ACE
    └── identificación asistida por evidencia de caracteres

ÁLVARO
ASC
└── compilación de escenas / prompts generativos
    └── Árboris = primer caso de uso / piloto
```

Esta separación es de proyecto y responsabilidad. No implica borrar la implementación ASC existente en Árboris ni trasladarla automáticamente.

## 2. Estado auditado

El repositorio actual `abrankil/arboris` ya separa técnicamente ACE y ASC en rutas y comandos distintos. ACE se encuentra en `tools/canonical-identification/`; ASC en `tools/asc/`. El routing documental distingue la autoridad de compilación ASC de la documentación y autoridad del motor de identificación.

ASC dispone actualmente de:

- autoridad normativa en `docs/ARBORIS_SCENE_COMPILER.md`;
- especificación ejecutable provisional en `docs/ASC_V0_1_EXECUTABLE_SPEC.md`;
- implementación `compile-only` en `tools/asc/`;
- fixture mínimo;
- suite de siete pruebas;
- comandos `compile:asc` y `test:asc`.

El compilador v0.1 valida un contrato JSON previamente preparado/autorizado y produce un prompt ASC determinista. No decide autoridad, no evalúa evidencia, no cierra `OPEN` y no ejecuta modelos generativos.

## 3. Auditoría

La arquitectura actual es compatible con una separación posterior de ASC porque ASC ya está definido como capa de compilación y no como fuente de verdad botánica, territorial, de navegación o artística.

Los principios del handoff que resultan transferibles al proyecto ASC incluyen:

- autoridad antes de implementación;
- una fuente de verdad por dominio;
- contratos antes de heurísticas;
- incertidumbre explícita;
- estados con semántica no intercambiable;
- separación de responsabilidades;
- determinismo;
- tests como protección de invariantes;
- decisiones `OPEN` no cerradas por suposición;
- implementación mínima justificada por una prueba concreta;
- control explícito del alcance.

No se deben transferir literalmente a ASC reglas, IDs, datos, thresholds o contratos que pertenezcan al dominio botánico o a ACE.

## 4. Inconsistencias detectadas

### 4.1 Propiedad organizacional todavía no reflejada

La documentación actual describe Árboris como proyecto dirigido por Alejandra y a Álvaro como director de arte. ASC, aunque técnicamente separado, continúa documentado como componente del repositorio Árboris.

Esto no constituye una contradicción funcional del compilador, pero sí una desalineación con la nueva decisión de mantener ASC como proyecto de Álvaro.

### 4.2 Documentación raíz con corrupción de codificación

El `README.md` actual contiene texto con caracteres corruptos (`├ürboris`, `├│`, `ÔÇö`, etc.). Es un problema documental real, pero queda fuera de esta iteración para no mezclarlo con la separación ASC.

### 4.3 Contrato ASC v0.1 provisional

El contrato v0.1 es ejecutable y testeado, pero su propio diseño mantiene OPEN el formato serializado definitivo y otras decisiones de ejecución. No debe promoverse automáticamente a contrato definitivo del proyecto independiente.

## 5. Vacíos / omisiones

Antes de implementar en una plataforma propia de Álvaro faltan:

1. repositorio/plataforma destino de ASC;
2. autoridad documental propia del proyecto ASC o mecanismo equivalente;
3. frontera formal ASC ↔ Árboris;
4. definición del contrato independiente de entrada de ASC;
5. decisión sobre qué parte del ASC v0.1 actual constituye baseline transferible;
6. resolución explícita de las decisiones OPEN que bloqueen la siguiente versión.

La frontera de responsabilidad ASC ↔ Árboris ya está documentada como decisión organizacional en `docs/ASC_PROJECT_BOUNDARY.md`; por tanto, este punto deja de ser un vacío conceptual. Lo pendiente es formalizar su materialización en la plataforma/repositorio destino.

## 6. Redundancias

No se identifica una segunda implementación de ASC.

La existencia simultánea de:

- `ARBORIS_SCENE_COMPILER.md`;
- `ASC_V0_1_EXECUTABLE_SPEC.md`;
- `tools/asc/README.md`;

es una redundancia documental intencional porque cada archivo cumple una función diferente: autoridad normativa, especificación de implementación y orientación operativa.

No debe eliminarse sin una nueva decisión de autoridad.

## 7. Elementos que permanecen OPEN

Permanecen abiertos, conforme al estado actual de ASC:

- formato serializado definitivo de contratos;
- automatización más allá de `compile-only`;
- proveedor/modelo generativo definitivo;
- estrategia específica de prompts por proveedor/modelo;
- métricas automáticas de fidelidad;
- integración directa con renderer/blockout;
- persistencia y versionado de resultados;
- materialización física de la separación del proyecto ASC en su plataforma/repositorio destino.

La frontera organizacional ASC ↔ Árboris no permanece OPEN: ya está establecida en `docs/ASC_PROJECT_BOUNDARY.md`. Lo que permanece OPEN es su implementación física y técnica en la plataforma destino.

Ninguno de estos puntos debe cerrarse por conveniencia de implementación.

## 8. Plan de implementación

### Fase 0 — Documentación y separación

Registrar la frontera de proyectos antes de iterar. Este documento y `docs/ASC_PROJECT_BOUNDARY.md` cumplen ese objetivo.

No modificar código de ACE ni ASC como parte de esta fase.

### Fase 1 — Diagnóstico del proyecto ASC de Álvaro

Cuando esté disponible la plataforma/repositorio destino:

- inspeccionar instrucciones;
- identificar autoridades;
- revisar arquitectura;
- revisar contratos;
- revisar código y tests;
- revisar configuración y CI;
- identificar decisiones OPEN;
- clasificar cada lección del handoff como transferible, específica, no aplicable, requiere decisión o histórica.

Esta fase será read-only.

### Fase 2 — Gap analysis

Para cada principio transferible determinar:

```text
principio
→ evidencia en ASC
→ equivalente existente
→ gap
→ impacto
→ riesgo
→ decisión necesaria
→ acción propuesta
```

No implementar un gap sin comprobar primero que exista una necesidad real.

### Fase 3 — Contrato independiente

Diseñar o confirmar el contrato que permita que:

```text
Árboris → contrato autorizado → ASC
```

sin que ASC necesite conocer estructuras internas de Árboris o ACE.

### Fase 4 — Baseline técnico

Usar ASC v0.1 como referencia histórica/técnica y conservar únicamente las garantías que resulten válidas para el proyecto independiente.

Prioridad:

```text
validación fail-closed
→ determinismo
→ preservación de OPEN
→ separación de responsabilidades
→ tests de invariantes
```

### Fase 5 — Implementación mínima

Implementar únicamente los cambios respaldados por el gap analysis y por una prueba concreta.

No crear anticipadamente providers, renderer, persistencia, métricas u otras capas que continúen OPEN.

### Fase 6 — Integración piloto con Árboris

Árboris será tratado como consumidor/caso de uso de ASC.

La integración no convierte a ASC en autoridad de Árboris ni permite que un resultado generativo modifique automáticamente el canon de Árboris.

### Fase 7 — Auditoría de cierre

Cada iteración debe cerrar con:

```text
AUDITORÍA
INCONSISTENCIAS
VACÍOS / OMISIONES
REDUNDANCIAS
VALIDACIÓN
DECISIONES OPEN
CAMBIOS REALIZADOS
```

Un hallazgo crítico sobre autoridad, contrato, reproducibilidad o separación de responsabilidades bloquea el avance hasta su resolución o aceptación explícita.

## 9. Criterio de éxito

La separación se considera técnicamente lograda cuando:

```text
ASC puede evolucionar sin depender de ACE ni del conocimiento botánico interno de Árboris;
Árboris puede consumir ASC mediante un contrato explícito;
la autoridad de cada dominio permanece separada;
los resultados generativos no se convierten en canon por inferencia;
las decisiones OPEN permanecen visibles;
y los invariantes críticos están protegidos por pruebas.
```

## 10. Cambios realizados en esta fase

Solo documentación.

No se modificaron:

- ACE;
- código ASC;
- datos botánicos;
- contratos existentes;
- runtime de Árboris;
- configuración de ejecución.

La siguiente modificación de código debe esperar a la disponibilidad de la plataforma/repositorio de ASC y al diagnóstico de Fase 1.