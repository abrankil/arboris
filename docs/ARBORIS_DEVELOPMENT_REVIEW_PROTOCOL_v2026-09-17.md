# ÁRBORIS — Protocolo de revisión de desarrollo

**Versión:** 2026-09-17  
**Estado:** normativo  
**Reemplaza:** versión 2026-09-16

## Regla central

Toda etapa de desarrollo, diseño, arquitectura, datos, prompts o documentación debe pasar por revisión antes de considerarse cerrada.

La revisión no consiste solo en comprobar si algo “funciona”. Debe distinguir qué fue demostrado, qué fue inferido, qué sigue siendo propuesta y qué pertenece únicamente al comportamiento de una herramienta o prototipo.

Una falla experimental no autoriza por sí sola a endurecer la arquitectura del proyecto.

## 1. Auditoría

Contrastar el resultado con:

- objetivo exacto del bloque;
- decisiones canónicas vigentes;
- arquitectura del proyecto;
- fuentes de verdad aplicables;
- trazabilidad requerida;
- alcance del Piloto 1.0;
- dependencias y efectos sobre otras piezas;
- nivel de abstracción que realmente se está evaluando.

Preguntas obligatorias:

- ¿respeta el sistema que ya existe?
- ¿introduce una segunda fuente de verdad?
- ¿rompe trazabilidad?
- ¿confunde prototipo con decisión final?
- ¿añade complejidad sin necesidad?
- ¿el experimento prueba una propiedad del proyecto o solo una capacidad/limitación de la herramienta usada?
- ¿la conclusión pertenece al modelo lógico, al renderer, al arte, al prompt o al generador?

### Regla de atribución

Antes de convertir un resultado experimental en requisito, clasificar dónde reside el hallazgo:

```text
PROJECT / CANON
ARCHITECTURE / DATA MODEL
IMPLEMENTATION / RENDERER
ART / ASSET
PROMPT
GENERATOR / TOOL
REFERENCE QUALITY
EXPERIMENT DESIGN
UNKNOWN
```

No trasladar automáticamente una limitación de una herramienta a la arquitectura de Árboris.

## 2. Inconsistencias

Buscar contradicciones:

- internas;
- entre código y documentación;
- entre datos y lógica;
- entre diseño y reglas de producto;
- entre una propuesta y el canon;
- entre distintos documentos normativos;
- entre el nivel lógico y su representación visual;
- entre lo que una prueba pretendía medir y lo que realmente midió.

No resolver una contradicción inventando cuál versión es correcta.

Identificar la autoridad aplicable o dejar la decisión pendiente.

### Regla nueva: categoría ≠ instancia exacta

Distinguir siempre entre:

- demostrar que existe una **familia/categoría funcional**;
- demostrar que existe un **asset, valor o geometría exacta reproducible**.

Una herramienta que reproduce la idea general pero muta detalles puede validar una categoría sin validar una instancia exacta.

## 3. Vacíos y omisiones

Buscar lo necesario que no está contemplado:

- casos no cubiertos;
- estados desconocidos;
- manejo de incertidumbre;
- validaciones faltantes;
- datos o fuentes ausentes;
- criterios de aceptación;
- comportamiento offline;
- persistencia/trazabilidad;
- decisiones visuales o técnicas todavía no aprobadas;
- métricas necesarias para decidir objetivamente si una prueba pasó o falló;
- parámetros que el experimento deja abiertos.

Un vacío debe quedar visible; no rellenarlo silenciosamente.

### Regla de decisión diferida

Si la implementación futura puede resolver una cuestión de varias maneras y no existe evidencia suficiente para elegir una, mantenerla `OPEN/PENDIENTE`.

No crear un asset, componente o regla únicamente para cerrar documentalmente un vacío.

## 4. Redundancias y simplificación

Buscar:

- lógica duplicada;
- datos repetidos en varias fuentes;
- componentes que resuelven lo mismo;
- reglas equivalentes con nombres distintos;
- estados visuales que pueden derivarse de datos existentes;
- entidades creadas solo para representar consecuencias de otra entidad;
- pasos innecesarios;
- complejidad que no aporta al piloto.

### Prueba de derivabilidad

Antes de mantener una nueva entidad, preguntar:

> ¿Puede este estado derivarse determinísticamente de información que ya es fuente de verdad?

Si la respuesta es sí, preferir el dato fuente + derivación antes que una segunda entidad autoritativa.

Ejemplo general:

```text
dato lógico
→ regla derivada
→ representación visual
```

es preferible a mantener manualmente tanto el dato lógico como cada una de sus consecuencias visuales.

### Pase obligatorio de simplificación

Antes del cierre de un bloque sustantivo, ejecutar un pase específico:

1. identificar entidades nuevas;
2. comprobar cuáles son realmente fuentes de verdad;
3. comprobar cuáles pueden derivarse;
4. eliminar o degradar a “representación/patrón” lo que no necesite autoridad propia;
5. confirmar que la simplificación preserva funcionalidad, evidencia y trazabilidad.

## 5. Evaluación de experimentos y gates

Todo gate debe declarar antes de ejecutarse:

- pregunta que intenta responder;
- autoridad de las referencias;
- variable que se modifica;
- variables que deben permanecer constantes;
- condición de éxito;
- condición de fallo;
- qué conclusiones están permitidas en cada resultado.

### Regla de alcance de conclusión

La conclusión no puede ser más amplia que la evidencia del gate.

Ejemplo:

```text
"el generador no reproduce una geometría exacta"
```

no implica automáticamente:

```text
"la arquitectura debe usar un asset manual".
```

La segunda afirmación requiere evidencia o decisión adicional.

### Resultado negativo útil

Un gate fallido puede cerrar una hipótesis sobre la herramienta sin cerrar una decisión de producto.

En ese caso registrar:

- qué quedó refutado;
- qué permanece abierto;
- cuál es el siguiente nivel correcto de decisión.

## 6. Corrección

Clasificar cada corrección como:

- **CANON:** corrección respaldada directamente por una decisión vigente;
- **DERIVADA:** consecuencia técnica o lógica directa y justificable;
- **PROPUESTA:** decisión nueva que requiere aprobación;
- **PENDIENTE:** información insuficiente;
- **LIMITACIÓN DE HERRAMIENTA:** comportamiento observado que no debe convertirse automáticamente en requisito del proyecto.

No ampliar alcance durante una corrección salvo decisión explícita.

No usar una corrección para canonizar una propuesta que el experimento no demostró.

## 7. Nueva validación

Después de corregir, repetir:

- auditoría;
- inconsistencias;
- vacíos/omisiones;
- redundancias/simplificación.

No basta con comprobar únicamente el punto corregido. Revisar sus efectos sobre el conjunto y confirmar que no se introdujo una nueva fuente de verdad.

## 8. Cierre

Solo después de la nueva validación se puede declarar el bloque cerrado y avanzar.

Estados permitidos:

```text
CERRADO
CERRADO CON PENDIENTES EXPLÍCITOS
REQUIERE DECISIÓN
REQUIERE CORRECCIÓN
EXPERIMENTO INCONCLUSO
```

`CERRADO CON PENDIENTES EXPLÍCITOS` solo es válido cuando esos pendientes no bloquean el siguiente bloque y se encuentran documentados como no autoritativos.

## 9. Formato mínimo del informe de revisión

### Auditoría
Hallazgos, objetivo real probado y autoridad aplicable.

### Atribución del resultado
Proyecto / arquitectura / implementación / arte / prompt / herramienta / referencia / experimento / desconocido.

### Inconsistencias
Hallazgos o “ninguna detectada”.

### Vacíos/omisiones
Hallazgos o “ninguno detectado”.

### Redundancias y simplificación
Qué entidades o reglas pueden eliminarse, derivarse o degradarse a representación.

### Correcciones realizadas
Qué cambió, por qué y estado de cada corrección.

### Nueva validación
Resultado posterior a las correcciones y efectos sobre el conjunto.

### Estado
CERRADO / CERRADO CON PENDIENTES EXPLÍCITOS / REQUIERE DECISIÓN / REQUIERE CORRECCIÓN / EXPERIMENTO INCONCLUSO.

## 10. Criterio de calidad de una auditoría

Una auditoría se considera válida cuando:

- no confunde evidencia de herramienta con requisito del proyecto;
- no convierte una propuesta en canon por repetición;
- distingue categoría funcional de instancia exacta;
- identifica la fuente de verdad mínima;
- ejecuta un pase de simplificación;
- limita sus conclusiones a lo realmente demostrado;
- preserva vacíos cuando faltan datos;
- deja claro qué puede avanzar y qué permanece abierto.
