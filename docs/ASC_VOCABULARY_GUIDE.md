# ASC — Guía de vocabulario para uso con Árboris

**Estado:** aprobada provisionalmente como guía operativa  
**Ámbito:** fundamentos de uso cotidiano de ASC cuando se aplica a Árboris  
**Autoridad normativa en este repositorio:** [`ARBORIS_SCENE_COMPILER.md`](ARBORIS_SCENE_COMPILER.md)

Esta guía es una referencia rápida y didáctica. No reemplaza la definición normativa de ASC. Si existe una discrepancia, prevalece `ARBORIS_SCENE_COMPILER.md`.

## 1. Relación ASC / Árboris

| Término | Qué significa | Ejemplo correcto |
| --- | --- | --- |
| **ASC** | Sistema de compilación independiente desarrollado por Álvaro. Puede aplicarse a Árboris o a otros proyectos. | “Árboris usa ASC como caso piloto.” |
| **Desarrollo de ASC** | Trabajo propio de Álvaro para construir y validar ASC como sistema general. | “Este hallazgo puede informar el desarrollo de ASC.” |
| **Proyecto consumidor** | Proyecto que usa ASC para compilar instrucciones. En este repositorio, el consumidor es Árboris. | “El proyecto consumidor define sus fuentes de autoridad.” |
| **Caso de uso Árboris** | Aplicación de ASC a una necesidad, escena, contrato o prueba de Árboris. | “MAP-001 es un caso de uso posible para ASC.” |
| **Hallazgo ASC** | Aprendizaje sobre compilación, handoff, método, ejecutor o límites de ASC. | “El handoff debilitó una restricción: hallazgo ASC.” |
| **Hallazgo Árboris** | Aprendizaje sobre necesidades, contratos, arte, navegación o representación de Árboris. | “La transitabilidad requiere una regla más precisa: hallazgo Árboris.” |

Regla: ASC puede aprender desde Árboris, pero Árboris no define automáticamente el producto general ASC. ASC puede servir a Árboris, pero no queda absorbido como componente exclusivo de Árboris.

## 2. Cuando trabajamos con ASC

| Término | Qué significa | Ejemplo correcto |
| --- | --- | --- |
| **prompt ASC** | Instrucción compilada que ASC prepara para el ejecutor generativo. | “Muéstrame el prompt ASC antes de ejecutarlo.” |
| **prompt efectivo** | Instrucción que realmente recibe el ejecutor después de cualquier adaptación o reformulación intermedia. | “Compara el prompt ASC con el prompt efectivo.” |
| **handoff** | Transferencia del prompt ASC al ejecutor. | “El problema apareció durante el handoff.” |
| **handoff check** | Revisión que confirma que el prompt efectivo preserva restricciones, prohibiciones, cantidades exactas y estados `OPEN`. | “Haz el handoff check antes de interpretar la imagen.” |
| **modelo generativo / ejecutor** | Herramienta externa que interpreta la instrucción y produce la salida. | “El ejecutor interpretó mal la elevación.” |
| **resultado ASC** | Salida obtenida después de ejecutar un prompt ASC. No constituye evidencia por sí misma. | “Auditemos el resultado ASC.” |
| **prueba ASC** | Experimento controlado para comprobar una hipótesis de compilación, traducción o representación. | `TOPOLOGY-STRESS-TEST-001` |
| **contrato de entrada** | Relaciones, restricciones y estados que ASC debe preservar durante la compilación. | “La conexión A↔B pertenece al contrato de entrada.” |
| **criterio crítico** | Condición cuyo fallo invalida el gate estructural. | “La conectividad es criterio crítico.” |
| **criterio secundario** | Condición que puede quedar parcial sin invalidar la hipótesis principal. | “La textura es secundaria en esta prueba.” |

## 3. Órdenes de trabajo con ASC

| Orden | Qué hace | Ejemplo |
| --- | --- | --- |
| **Compila con ASC** | Prepara el prompt ASC. No ejecuta generación. | “Compila con ASC el acceso principal.” |
| **Genera con ASC / Ejecuta con ASC** | Compila, verifica handoff cuando corresponda y después ejecuta con la herramienta generativa disponible. | “Genera con ASC el MAP-001.” |
| **Audita ASC** | Revisa contrato, prompt ASC, prompt efectivo y/o resultado contra fuentes y criterios de validación. | “Audita ASC este resultado.” |
| **Usa X como input ASC** | Permite que X alimente la compilación, sin convertirlo automáticamente en autoridad o verdad. | “Usa este mapa como input ASC.” |

## 4. Tratamientos de información en ASC

| Tratamiento | Qué significa | Ejemplo |
| --- | --- | --- |
| **KNOWN** | Existe base suficiente para trasladar la información a la compilación. | “La casa está a la izquierda: KNOWN.” |
| **OPEN** | No existe evidencia o decisión suficiente. Debe permanecer abierto. | “Altura exacta: OPEN.” |
| **PROHIBIDO INFERIR** | El ejecutor no puede completar ese vacío por plausibilidad. | “No inferir otras construcciones.” |
| **ART-PROVISIONAL** | Solución visual temporal permitida para una prueba. No se convierte en evidencia ni canon. | “Usar una pendiente de tierra ART-PROVISIONAL.” |

## 5. Tipos de prueba

| Tipo | Qué comprueba | Prioridad |
| --- | --- | --- |
| **ASC-STRUCTURAL TEST** | Preservación de topología, conectividad, elevación, cantidades y restricciones. | Estructura antes que estética. |
| **ASC-VISUAL TEST** | Cómo se representa información cuya estructura ya está controlada. | Naturalización, composición, densidad y lenguaje visual. |

No usar una prueba visual para cerrar una relación estructural todavía no validada.

## 6. Estados de resultado

| Estado | Uso |
| --- | --- |
| **PASS** | Cumple el criterio evaluado. |
| **PARTIAL** | Cumplimiento incompleto, sin necesariamente invalidar el objetivo principal. |
| **FAIL** | Incumple un criterio; si es crítico, invalida el gate estructural. |
| **INCONCLUSIVE** | La prueba no permite atribuir el resultado con suficiente control o verificabilidad. |

## Regla de lectura

```text
ASC es independiente de Árboris.
Árboris es el primer proyecto piloto/caso de uso real de ASC.
ASC compila; no decide la verdad del proyecto consumidor.
El handoff no puede debilitar el contrato.
La plausibilidad visual no es evidencia.
Si no está respaldado, permanece OPEN.
Un resultado correcto aislado no demuestra estabilidad.
```

Los tratamientos ASC no sustituyen estados de otros dominios como `claimState`, `evidenceStatus` o `productionStatus`.

## Uso recomendado

Usar esta guía para conversaciones rápidas, handoffs y trabajo diario con agentes o herramientas generativas. Para compilación real, auditorías o decisiones que vayan a consolidarse, abrir primero `ARBORIS_SCENE_COMPILER.md` y luego solo las autoridades de dominio necesarias. Para registrar pruebas usar `ASC_TEST_RECORD_TEMPLATE.md`.
