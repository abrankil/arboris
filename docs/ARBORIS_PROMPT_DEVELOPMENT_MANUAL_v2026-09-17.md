# ÁRBORIS — Manual de desarrollo de prompts

**Versión:** 2026-09-17  
**Estado:** normativo  
**Reemplaza:** versión 2026-09-16

## 1. Propósito

Este manual regula cómo redactar prompts para herramientas de IA que trabajen sobre Árboris.

El objetivo es impedir que una IA:

- rellene vacíos;
- cambie decisiones aprobadas;
- mezcle material experimental con canon;
- convierta propuestas en requisitos;
- convierta limitaciones del generador en decisiones de arquitectura;
- introduzca complejidad que podría derivarse de una fuente de verdad existente.

## 2. Contexto canónico mínimo

Árboris es una aplicación/juego de exploración de flora nativa chilena. Combina exploración real, observación y aprendizaje botánico, identificación asistida, colección y componentes lúdicos.

La identificación es una mecánica del juego, no el producto completo.

El sistema distingue tres objetos relacionados pero no intercambiables:

1. especie biológica real;
2. conocimiento/evidencia científica;
3. personaje jugable inspirado en la especie.

La IA propone u observa; no sentencia. Deben conservarse incertidumbre, variación intraespecífica, evidencia y trazabilidad.

## 3. Jerarquía de autoridad

Al redactar un prompt, declarar qué materiales son normativos y su prioridad.

Orden general:

1. decisiones explícitamente aprobadas por Dirección del proyecto;
2. artefactos maestros/canónicos vigentes;
3. documentación normativa vigente;
4. datos y documentación técnica validados;
5. material experimental, prototipos y exploraciones;
6. inferencias o propuestas de la IA.

Una fuente inferior nunca puede modificar silenciosamente una superior.

### Regla de referencia maestra

Si una tarea exige fidelidad a un asset, geometría, logo, sprite o documento maestro, el prompt debe declararlo explícitamente como autoridad.

Aun así, una referencia visual no garantiza por sí sola reproducción geométrica exacta por parte de un generador. La fidelidad debe validarse, no asumirse.

## 4. Estados obligatorios de una afirmación

Cuando una tarea pueda introducir decisiones nuevas, exigir que cada afirmación relevante se clasifique como:

- **EXISTENTE:** verificable en material canónico;
- **DERIVADA:** consecuencia técnica directa y justificable;
- **PROPUESTA:** decisión nueva que requiere aprobación humana;
- **PENDIENTE:** información insuficiente;
- **LIMITACIÓN DE HERRAMIENTA:** comportamiento observado del modelo/generador que no constituye una regla de Árboris.

Una PROPUESTA nunca se convierte automáticamente en regla.

Una LIMITACIÓN DE HERRAMIENTA nunca se convierte automáticamente en requisito del proyecto.

## 5. Estructura base de un prompt Árboris

Todo prompt sustantivo debe contener, cuando corresponda:

- rol concreto de la IA;
- objetivo y entregable;
- pregunta que intenta resolver;
- contexto canónico mínimo necesario;
- archivos/fuentes y jerarquía;
- decisiones que no pueden modificarse;
- alcance y fuera de alcance;
- variables que pueden cambiar;
- variables que deben permanecer constantes;
- método de trabajo;
- tratamiento de incertidumbre y vacíos;
- formato de salida;
- criterios de aceptación;
- protocolo de revisión.

No sobrecargar el prompt con historia del proyecto irrelevante para la tarea.

## 6. Regla de no invención

Si el material no define una decisión, la IA debe indicarlo.

No debe inventar valores, geometrías, colores, tipografías, datos botánicos, requisitos técnicos, arquitectura ni estados de avance para producir una salida aparentemente completa.

Si una composición no puede lograrse con las restricciones vigentes, debe simplificar el entregable o declarar el bloqueo antes que inventar una excepción.

## 7. Regla de nivel correcto

Antes de pedir a una IA que genere una entidad, comprobar si esa entidad es realmente fuente de verdad o solo una representación derivable.

Preferir:

```text
fuente lógica
→ derivación
→ representación
```

antes que mantener múltiples representaciones como autoridades paralelas.

En prompts técnicos o visuales, distinguir explícitamente:

- modelo lógico;
- implementación;
- asset;
- tratamiento visual;
- preview o referencia.

No usar una preview para decidir silenciosamente la arquitectura.

## 8. Prompts de experimentación

Un prompt experimental debe probar una sola pregunta principal cuando sea posible.

Debe declarar antes de ejecutar:

- hipótesis;
- variable independiente;
- constantes;
- condición de éxito;
- condición de fallo;
- conclusiones permitidas.

### Regla de alcance de conclusión

El resultado de una prueba solo autoriza conclusiones sobre aquello que realmente midió.

Ejemplo:

```text
el generador no preserva una geometría exacta bajo rotación
```

puede demostrar una limitación del generador, pero no demuestra por sí sola que Árboris necesite un asset manual, un renderer concreto o una arquitectura distinta.

## 9. Prompts visuales

Distinguir estrictamente:

- artwork aprobado;
- exploración visual;
- propuesta;
- referencia generada;
- asset de producción.

Una imagen generada con apariencia pixelada no certifica pixel art de producción, escala nativa, geometría exacta ni resolución lógica.

### Cuando se exige cero texto

Evitar introducir en el prompt códigos, etiquetas o nomenclaturas que el generador pueda interpretar como contenido visible, salvo que sean imprescindibles para la lógica de la tarea.

Si se usan códigos internos, añadir explícitamente que son instrucciones no renderizables.

### Categoría visual vs. asset exacto

Distinguir entre pedir:

- una **familia visual** o comportamiento general;
- una **reproducción exacta** de un asset maestro.

La primera admite variación controlada. La segunda requiere comparación y validación explícita.

No considerar que una familia está congelada solo porque varias imágenes “se parecen”.

## 10. Prompts de desarrollo técnico

No pedir parches aislados sin revisar su encaje en la arquitectura.

La prioridad es conectar piezas existentes y mantener trazabilidad end-to-end.

Antes de crear una clase, tabla, tipo, asset lógico o regla nueva, preguntar:

> ¿este elemento contiene información nueva o solo duplica/representa algo ya derivable?

Si es derivable, preferir cálculo/renderer/adaptador antes que una segunda fuente manual de verdad.

## 11. Protocolo obligatorio de revisión

Ningún bloque sustantivo se considera cerrado después de una primera respuesta.

Antes de aprobar o avanzar:

1. **REVISIÓN:** comprobar el entregable contra objetivo, fuentes y restricciones.
2. **AUDITORÍA:** verificar coherencia con canon, arquitectura y nivel real probado.
3. **ATRIBUCIÓN:** identificar si el resultado pertenece al proyecto, arquitectura, implementación, arte, prompt, herramienta, referencia o diseño experimental.
4. **INCONSISTENCIAS:** detectar contradicciones internas o con fuentes/decisiones vigentes.
5. **VACÍOS U OMISIONES:** hacer visibles requisitos, datos o decisiones que falten.
6. **REDUNDANCIAS / SIMPLIFICACIÓN:** buscar entidades derivables, reglas solapadas y complejidad innecesaria.
7. **CORRECCIONES:** corregir solo lo respaldado por canon o claramente derivable; las decisiones nuevas quedan como propuestas.
8. **NUEVA VALIDACIÓN:** repetir la comprobación sobre el conjunto corregido.
9. **AVANCE:** continuar únicamente cuando el gate anterior quede cerrado o con pendientes explícitos que no bloqueen.

La revisión no está completa si no informa explícitamente:

- auditoría;
- atribución;
- inconsistencias;
- vacíos/omisiones;
- redundancias/simplificación.

## 12. Contraste externo

Cuando se consulte documentación, productos, repositorios o buenas prácticas externas, separar siempre:

- CANON ÁRBORIS;
- EVIDENCIA EXTERNA;
- INFERENCIA;
- PROPUESTA.

Una práctica externa no se convierte en requisito del proyecto por ser habitual o recomendable.

## 13. Criterio de cierre de un prompt

Un prompt está listo para uso cuando:

- preserva el canon;
- define autoridad de fuentes;
- evita invención;
- delimita alcance;
- identifica variables y constantes;
- exige trazabilidad cuando corresponde;
- distingue hechos de propuestas y limitaciones de herramienta;
- contiene criterios de éxito/fallo;
- limita las conclusiones al experimento real;
- contiene mecanismo explícito de revisión;
- no crea una entidad nueva cuando el mismo resultado puede derivarse de una fuente de verdad existente.

## 14. Regla de simplificación final

Antes de aprobar un prompt sustantivo, ejecutar una última pregunta:

> ¿Estamos pidiendo a la IA que genere una decisión que podría mantenerse abierta, derivarse o resolverse después por una autoridad superior?

Si la respuesta es sí, reducir el prompt y conservar la decisión como `PENDIENTE` o `DERIVADA` según corresponda.
