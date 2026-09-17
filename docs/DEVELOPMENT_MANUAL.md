# Árboris — Manual de desarrollo

**Estado:** normativo  
**Ámbito:** revisiones de desarrollo, diseño, arquitectura, datos, gameplay, UX, arte, mapas, IA y documentación.

## Protocolo obligatorio de revisión

Toda revisión de desarrollo en Árboris debe aplicar, como mínimo, cuatro controles explícitos antes de aprobar una propuesta, avanzar de fase o consolidar una decisión.

### 1. Auditar

Revisar críticamente la propuesta en su contexto completo.

Comprobar, según corresponda:

- objetivo y alcance;
- supuestos;
- evidencia y fuentes;
- compatibilidad con visión, principios y requerimientos;
- dependencias;
- consecuencias sobre otras capas del proyecto;
- riesgos de regresión;
- criterios de validación;
- decisiones que permanecen `OPEN`.

Una revisión no se limita a comprobar que algo funciona de forma aislada.

### 2. Buscar inconsistencias

Comprobar contradicciones internas y entre sistemas relacionados, incluyendo cuando corresponda:

- documentos normativos;
- código;
- modelos de datos;
- gameplay;
- arte;
- arquitectura;
- terminología;
- estados de producción;
- evidencia científica o territorial;
- comportamiento esperado del producto.

Toda inconsistencia encontrada debe identificarse de forma explícita antes de continuar.

### 3. Encontrar vacíos u omisiones

Buscar aquello que falta para que la propuesta pueda funcionar, validarse o integrarse de forma segura.

Revisar especialmente:

- decisiones no definidas;
- interfaces entre sistemas;
- estados o transiciones ausentes;
- casos límite;
- criterios de fallo;
- trazabilidad;
- evidencia faltante;
- pruebas no contempladas;
- responsabilidades no asignadas;
- efectos sobre experiencia de usuario y aprendizaje.

Un vacío debe permanecer declarado como pendiente u `OPEN` si todavía no existe evidencia o decisión suficiente para cerrarlo.

### 4. Indicar redundancias

Detectar reglas, datos, documentación, lógica, assets, campos o responsabilidades duplicadas.

Toda redundancia debe clasificarse como una de estas dos situaciones:

- **intencional:** existe por compatibilidad, trazabilidad, caché, derivación o una necesidad explícita;
- **problemática:** crea dos fuentes de verdad, riesgo de divergencia, mantenimiento duplicado o ambigüedad de autoridad.

No eliminar redundancias automáticamente. Primero debe establecerse cuál es la fuente de autoridad y qué dependencias deben preservarse.

## Regla de cierre de una revisión

Una revisión no se considera completa hasta haber respondido explícitamente los cuatro controles:

```text
AUDITORÍA
INCONSISTENCIAS
VACÍOS / OMISIONES
REDUNDANCIAS
```

Si no se detectan hallazgos en una categoría, debe indicarse expresamente.

El resultado de la revisión debe distinguir entre:

- hallazgo;
- impacto o riesgo;
- corrección propuesta;
- decisión aprobada;
- elemento que permanece `OPEN`.

## Gate de avance

Antes de pasar a la siguiente etapa de producción:

```text
revisión
→ auditoría
→ inconsistencias
→ vacíos/omisiones
→ redundancias
→ correcciones necesarias
→ nueva validación
→ avance de fase
```

Un hallazgo crítico que comprometa principios del producto, fuente de verdad, evidencia, arquitectura, jugabilidad central o reproducibilidad bloquea el avance hasta ser resuelto o aceptado explícitamente por dirección de proyecto.

Los hallazgos menores pueden quedar registrados para una fase posterior si no invalidan el objetivo de la prueba actual.

## Aplicación a comparaciones externas

Cuando una revisión use proyectos, motores, herramientas, literatura o prácticas externas como contraste, debe separar claramente:

```text
canon interno de Árboris
vs.
evidencia o práctica externa
vs.
inferencia o propuesta de adaptación
```

Una práctica externa puede justificar una recomendación, pero no se convierte automáticamente en regla de Árboris.

## Principio operativo

El propósito de este protocolo no es aumentar documentación por defecto, sino reducir errores acumulativos y detectar problemas mientras aún son baratos de corregir.

```text
revisar antes de consolidar
corregir antes de escalar
simplificar antes de duplicar
mantener OPEN antes de inventar
```
