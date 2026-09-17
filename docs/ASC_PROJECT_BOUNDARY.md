# ASC — Frontera de proyecto

**Fecha:** 2026-09-17  
**Estado:** vigente como decisión de organización; la separación física del repositorio queda pendiente de plataforma destino.

## Propósito

Este documento establece la frontera entre el proyecto Árboris/ACE y el proyecto ASC antes de realizar nuevas iteraciones técnicas.

## Responsabilidad de proyectos

```text
ALEJANDRA
Árboris
└── ACE
    └── identificación asistida por evidencia de caracteres

ÁLVARO
ASC
└── compilación de escenas / prompts generativos
```

Árboris puede consumir ASC. ASC no adquiere por ello autoridad sobre Árboris.

## Autoridad

Árboris conserva autoridad sobre:

- visión y producto de Árboris;
- conocimiento botánico y sus fuentes autorizadas;
- ACE y su lógica de identificación;
- canon de producto, datos y decisiones propias de Árboris.

ASC conserva autoridad, dentro de su propio proyecto, sobre:

- compilación de contratos de escena;
- reglas de traducción de contratos a prompts;
- invariantes del compilador;
- validación de sus entradas;
- determinismo de la compilación;
- límites entre compilación y ejecución.

La autoridad artística continúa correspondiendo al dominio artístico definido para cada producto. ASC no reemplaza esa autoridad.

## Dependencias permitidas

La integración prevista es unidireccional y explícita:

```text
Árboris
  ↓
contrato autorizado
  ↓
ASC
  ↓
prompt compilado
  ↓
ejecutor generativo
```

ASC puede consumir información autorizada que Árboris incluya en el contrato, pero no debe depender de estructuras internas de ACE, datos botánicos específicos, IDs internos o implementación privada de Árboris.

Un resultado generado por ASC tampoco modifica automáticamente el canon de Árboris.

## No transferir

No se trasladan automáticamente desde Árboris/ACE a ASC:

- especies o IDs botánicos;
- caracteres botánicos;
- Master Botánico;
- contratos específicos de identificación;
- thresholds de ACE;
- lógica de evidencia botánica;
- datos territoriales específicos de Árboris;
- decisiones OPEN propias de ACE o de Árboris;
- estructuras internas de almacenamiento de Árboris.

Pueden transferirse principios generales de ingeniería cuando el diagnóstico del proyecto ASC demuestre un equivalente real.

## Estado de la separación física

La implementación actual de ASC continúa dentro del repositorio `abrankil/arboris` como baseline técnico v0.1. Esto no debe interpretarse como una decisión de mantener ASC permanentemente dentro del repositorio de Árboris.

La separación física queda condicionada a disponer de la plataforma/repositorio destino de Álvaro y a completar la auditoría de Fase 1 definida en `docs/ASC_PROJECT_SEPARATION_AND_IMPLEMENTATION_PLAN_2026-09-17.md`.

Hasta entonces:

- no se duplica el código ASC en otro lugar;
- no se inicia una migración parcial;
- no se modifican contratos para anticipar la migración;
- no se introducen dependencias nuevas entre ACE y ASC.

## Gate para la próxima iteración

No se inicia una nueva ampliación funcional de ASC hasta completar, en la plataforma destino:

1. diagnóstico read-only;
2. clasificación del handoff;
3. gap analysis;
4. decisiones bloqueantes;
5. definición del contrato independiente;
6. plan de migración o reconstrucción aprobado.

## Relación con el handoff

El documento de transferencia del Hito 15 se aplica al proyecto ASC únicamente cuando exista una plataforma receptora sobre la cual auditar e implementar. Su contenido se usa como fuente de criterios transferibles, no como autorización para copiar estructuras de Árboris.

## Regla operativa

```text
documentar
→ auditar
→ separar autoridad
→ definir contrato
→ implementar mínimo
→ probar
→ auditar de nuevo
→ iterar
```
