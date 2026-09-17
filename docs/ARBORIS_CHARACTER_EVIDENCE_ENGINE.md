# Árboris Character Evidence Engine (ACE)

**Estado:** normativo  
**Nombre operativo:** ACE  
**Nombre completo:** Arboris Character Evidence Engine / Motor de Evidencia por Caracteres Árboris  
**Ámbito:** evaluación determinista de evidencia botánica discreta por caracteres para mantener, reducir y evaluar conjuntos de especies candidatas.

## 1. Definición

ACE es el motor de identificación de Árboris basado en acumulación de evidencia por caracteres botánicos.

Recibe evidencia estructurada sobre caracteres observados, la contrasta con los datos botánicos canónicos y la capa complementaria autorizada, mantiene o reduce el conjunto de especies candidatas y determina el estado de soporte de la identificación sin forzar una respuesta cuando la evidencia es insuficiente o contradictoria.

ACE **no es un clasificador de imágenes**, **no es Computer Vision (CV)**, **no es un modelo generativo**, **no es una fuente de verdad botánica** y **no identifica una especie por mera plausibilidad**.

```text
OBSERVACIÓN
    ↓
EVIDENCIA POR CARÁCTER
    ↓
ACE — EVALUACIÓN CANÓNICA
    ↓
CONJUNTO DE CANDIDATOS
    ↓
ESTADO DE IDENTIFICACIÓN
```

Un observador humano puede producir evidencia por carácter. En el futuro, un sistema CV también podría proponer evidencia visual, pero esa propuesta no sustituye a ACE ni adquiere autoridad botánica por provenir de un modelo.

## 2. Terminología obligatoria

- **ACE:** Arboris Character Evidence Engine; motor canónico de evaluación de evidencia por caracteres para identificación.
- **evidencia por carácter:** observación estructurada asociada a un carácter botánico y a uno o más estados observados.
- **carácter:** dimensión botánica discreta definida por el canon de datos de Árboris.
- **estado:** valor permitido para un carácter.
- **candidato:** especie que permanece compatible con la evidencia evaluada bajo las reglas vigentes.
- **dimensión diagnóstica independiente:** carácter resuelto que aporta una dimensión distinta de evidencia; observaciones repetidas del mismo `characterId` no crean dimensiones adicionales.
- **variabilidad natural documentada:** estado alternativo permitido para una relación especie-carácter bajo un contexto documentado. Puede volver una contradicción inconclusa; no crea una coincidencia positiva por sí sola.
- **contexto:** condición explícitamente catalogada que permite interpretar una entrada de variabilidad documentada.
- **CV:** Computer Vision / Visión por Computador. Técnicas que procesan imágenes para extraer o inferir información visual. CV puede producir propuestas de evidencia; no decide por sí mismo la identificación canónica.

## 3. Autoridad y precedencia

ACE consume conocimiento botánico; no lo crea.

La autoridad botánica debe permanecer separada del código del motor. El núcleo canónico derivado de Master Botánico 2.0 y la capa complementaria de variabilidad/contextos conservan la procedencia y autoridad documentadas en `data/botanical/README.md` y en las autoridades superiores del repositorio.

ACE no puede convertir una heurística, una predicción CV, una imagen generada o una decisión de implementación en nuevo conocimiento botánico.

Ante contradicción entre implementación y autoridad botánica, debe corregirse la implementación o declararse el conflicto; no se modifica silenciosamente el dato para acomodar el resultado del motor.

## 4. Separación entre observación, CV e identificación

La arquitectura distingue tres responsabilidades:

```text
OBSERVACIÓN
captura lo que una persona o sistema puede examinar

CV
puede inferir o proponer información visual desde imágenes

ACE
razona determinísticamente sobre evidencia estructurada contra el canon
```

CV no es requisito para ACE. ACE debe seguir siendo utilizable con evidencia introducida o confirmada por una persona.

Una predicción CV no equivale automáticamente a un carácter resuelto. La política futura para aceptar, rechazar o confirmar evidencia producida por CV permanece fuera del alcance de este documento mientras no exista un contrato específico aprobado.

## 5. Unidad de razonamiento

ACE razona sobre caracteres, no sobre fotografías completas como una única señal de especie.

Varias fotografías pueden aportar evidencia para un mismo carácter. Varias observaciones del mismo carácter continúan representando una sola dimensión diagnóstica independiente para efectos del soporte de identificación.

La unidad conceptual es:

```text
characterId
+ estado observado
+ estado de resolución cuando corresponda
+ contexto explícito cuando corresponda
```

La forma serializada exacta de cada flujo está gobernada por los contratos ejecutables vigentes.

## 6. Conjunto de candidatos

ACE mantiene un conjunto explícito de especies candidatas.

- `candidateIds = null` representa el conjunto de especies canónicas disponibles.
- una lista explícita limita el universo inicial a esos identificadores;
- duplicados se normalizan preservando la primera aparición;
- un identificador de especie desconocido es error explícito;
- `[]` representa válidamente un conjunto vacío.

ACE no convierte identificadores históricos ni inventa equivalencias de especies.

## 7. Evidencia resuelta y reintentos

Los flujos de consulta distinguen entre caracteres visibles, intentados y resueltos según `HITO15_CHARACTER_RETRY_CONTRACT.md`.

Un intento sin resolución no debe ofrecerse automáticamente otra vez. Un reintento es explícito y puede repetirse. Un carácter resuelto es terminal dentro de ese flujo.

Cuando un contrato específico usa `resolved` con una semántica más estricta, prevalece ese contrato. Este documento no redefine los estados ejecutables establecidos por Hito 15.

## 8. Soporte de identificación

ACE no debe declarar soporte suficiente por la mera existencia de un único candidato.

El estado `supported` requiere evidencia suficiente conforme a `HITO15_SUPPORTED_CONTRACT.md`. En particular, observaciones repetidas del mismo carácter cuentan como una sola dimensión diagnóstica independiente.

El poder diagnóstico de un carácter puede utilizarse para ordenar o priorizar preguntas, pero no reduce el mínimo de dimensiones independientes exigido para declarar soporte.

La incertidumbre es una salida válida del sistema. ACE debe preservar resultados tentativos, ambiguos o no resueltos cuando la evidencia disponible no permite una conclusión más fuerte.

## 9. Variabilidad natural documentada

ACE puede consumir una capa complementaria de variabilidad natural y contextos autorizados.

Una contradicción que coincida con variabilidad natural documentada no elimina automáticamente una especie. Se trata como evidencia inconclusa según el contrato vigente.

La variabilidad no constituye tolerancia genérica a errores. Solo se aplica cuando existe una entrada explícita y válida para la especie, carácter, estado alternativo y, cuando corresponda, contexto.

Las referencias de variabilidad deben ser verificables contra especies canónicas, caracteres activos, estados permitidos y contextos catalogados conforme a la validación ejecutable vigente.

## 10. Integridad de relaciones

Entre relaciones canónicas computables, la pareja:

```text
(species_id, caracter_id)
```

debe ser única.

Cualquier duplicado es un error fatal de integridad, incluso si las entradas duplicadas son textualmente idénticas. ACE no resuelve silenciosamente duplicados ni elige uno de ellos.

## 11. Determinismo y límites

Con el mismo conjunto de datos y la misma evidencia estructurada, ACE debe producir el mismo resultado.

ACE no debe incorporar conocimiento botánico oculto en código, prompts o heurísticas no documentadas.

Permanecen fuera de alcance hasta decisión y contrato específicos:

- identificación automática de especie directamente desde una imagen;
- selección de un modelo CV definitivo;
- entrenamiento o fine-tuning de modelos visuales;
- umbrales de confianza para aceptar evidencia producida por CV;
- fusión probabilística entre múltiples observadores visuales;
- conversión automática de una predicción visual en identificación `supported`.

## 12. Implementación ejecutable

La implementación vigente se encuentra en:

```text
tools/canonical-identification/
```

El nombre histórico del directorio puede mantenerse por estabilidad del repositorio. ACE es el nombre conceptual y arquitectónico del componente; este documento no exige un renombrado inmediato de paths o APIs existentes.

Los contratos ejecutables específicos de Hito 15 complementan esta autoridad y gobiernan sus respectivas invariantes.

## 13. Auditoría obligatoria

Toda modificación que cambie las reglas de identificación, la interpretación de evidencia, la estructura de candidatos o la relación entre ACE y las autoridades botánicas debe aplicar `docs/DEVELOPMENT_MANUAL.md` y responder explícitamente:

```text
AUDITORÍA
INCONSISTENCIAS
VACÍOS / OMISIONES
REDUNDANCIAS
```

Una salida plausible no constituye un PASS si viola un contrato o una autoridad botánica.

## 14. Principios operativos

```text
la evidencia manda sobre la plausibilidad
un carácter repetido sigue siendo una dimensión
la variabilidad documentada no es tolerancia genérica
la incertidumbre es una salida válida
CV puede observar; ACE identifica mediante evidencia
ACE consume canon; no crea botánica
no forzar una especie cuando la evidencia no alcanza
```
