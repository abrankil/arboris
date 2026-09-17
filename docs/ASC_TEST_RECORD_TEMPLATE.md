# Árboris — Plantilla de registro de prueba ASC

**Estado:** plantilla operativa provisional  
**Autoridad normativa:** `docs/ARBORIS_SCENE_COMPILER.md`

Usar esta plantilla mientras el formato serializado definitivo de pruebas ASC permanezca `OPEN`.

## Identificación

```text
TEST ID:
DATE:
TEST TYPE: ASC-STRUCTURAL TEST | ASC-VISUAL TEST
MODE: compile-only | compile-and-execute
EXECUTOR / PROVIDER:
```

## Pregunta experimental

```text
¿Qué propiedad concreta se intenta comprobar?
```

## Objetivo

```text
Qué se prueba:

Qué NO se prueba:
```

## Fuentes y autoridad

```text
Autoridad(es) de dominio:
Input autorizado:
Referencias auxiliares:
```

## Contrato de entrada

```text
KNOWN:

OPEN:

PROHIBIDO INFERIR:

ART-PROVISIONAL:
```

## Relaciones obligatorias

```text
Entidades:
Conexiones:
Elevación:
Transitabilidad:
Cantidades exactas:
Otras invariantes:
```

## Diseño experimental

```text
VARIABLE QUE CAMBIA:

CONSTANTES:

HIPÓTESIS:
```

## Criterios de validación

### Críticos

```text
[ ] criterio crítico 1
[ ] criterio crítico 2
[ ] criterio crítico 3
```

### Secundarios

```text
[ ] criterio secundario 1
[ ] criterio secundario 2
```

## Prompt ASC

```text
[pegar prompt compilado]
```

## Prompt efectivo

```text
[pegar instrucción realmente entregada al ejecutor cuando sea observable]
```

## Handoff check

```text
restricciones críticas preservadas: PASS | PARTIAL | FAIL | NOT OBSERVABLE
cantidades exactas preservadas: PASS | PARTIAL | FAIL | N/A
prohibiciones preservadas: PASS | PARTIAL | FAIL | N/A
OPEN preservados: PASS | PARTIAL | FAIL | N/A
instrucciones nuevas introducidas: YES | NO | NOT OBSERVABLE

HANDOFF STATUS: PASS | PARTIAL | FAIL | NOT OBSERVABLE
```

Si `HANDOFF STATUS = FAIL` en una restricción crítica, el resultado no puede validar la hipótesis estructural original.

## Resultado

```text
Archivo / referencia:
Descripción mínima:
```

No convertir la descripción del resultado en interpretación o nueva evidencia de dominio.

## Evaluación por criterio

| Criterio | Tipo | Estado | Evidencia / observación |
| --- | --- | --- | --- |
| | crítico / secundario | PASS / PARTIAL / FAIL / INCONCLUSIVE | |

## Atribución

Marcar solo los niveles respaldados por la evidencia:

```text
[ ] contrato / diseño experimental
[ ] compilación ASC
[ ] handoff / adaptación
[ ] ejecutor generativo
[ ] representación visual
[ ] herramienta / proveedor
[ ] fuente / referencia de entrada
[ ] desconocido
```

## Auditoría obligatoria

### AUDITORÍA

```text
Hallazgos principales y relación con el objetivo.
```

### INCONSISTENCIAS

```text
Contradicciones detectadas o “no se detectaron”.
```

### VACÍOS / OMISIONES

```text
Información, controles o pruebas faltantes.
```

### REDUNDANCIAS

```text
Duplicaciones intencionales o problemáticas.
```

## Conclusión permitida

```text
Qué sí permite concluir la prueba:
```

## Conclusiones no permitidas

```text
Qué sería más amplio que la evidencia obtenida:
```

## Estado final

```text
OVERALL: PASS | PARTIAL | FAIL | INCONCLUSIVE

OPEN heredados:

NEXT GATE:
```

## Replicación

Cuando la decisión dependa de estabilidad del ejecutor:

```text
replica requerida: YES | NO
número de ejecución:
condiciones mantenidas:
resultado comparativo:
```

Un resultado favorable aislado no demuestra reproducibilidad.
