# Árboris — Guía de vocabulario ASC

**Estado:** aprobada provisionalmente como guía operativa  
**Ámbito:** fundamentos de uso cotidiano del Arboris Scene Compiler (ASC)  
**Autoridad normativa:** [`ARBORIS_SCENE_COMPILER.md`](ARBORIS_SCENE_COMPILER.md)

Esta guía es una referencia rápida y didáctica. No reemplaza la definición normativa de ASC. Si existe una discrepancia, prevalece `ARBORIS_SCENE_COMPILER.md`.

## 1. Cuando trabajamos con ASC

| Término | Qué significa | Ejemplo correcto |
| --- | --- | --- |
| **ASC** | Arboris Scene Compiler. Sistema que transforma canon, evidencia, contratos y restricciones en instrucciones ejecutables por una herramienta generativa. | “Pásalo por ASC.” |
| **prompt ASC** | Instrucción compilada que ASC entrega al ejecutor generativo. | “Muéstrame el prompt ASC antes de ejecutarlo.” |
| **modelo generativo / ejecutor** | Herramienta externa que interpreta el prompt ASC y produce la salida. | “El ejecutor interpretó mal el estero.” |
| **resultado ASC** | Salida obtenida después de ejecutar un prompt ASC. No constituye evidencia por sí misma. | “Auditemos el resultado ASC.” |
| **prueba ASC** | Experimento controlado para comprobar una hipótesis de compilación, traducción o representación. | `TOPOLOGY-STRESS-TEST-001` |
| **contrato de entrada** | Relaciones, restricciones y estados que ASC debe preservar durante la compilación. | “El puente antes de la reja pertenece al contrato de entrada.” |

## 2. Órdenes de trabajo con ASC

| Orden | Qué hace | Ejemplo |
| --- | --- | --- |
| **Compila con ASC** | Prepara el prompt ASC. No ejecuta generación. | “Compila con ASC el acceso principal.” |
| **Genera con ASC / Ejecuta con ASC** | Compila primero y después ejecuta el prompt con la herramienta generativa disponible. | “Genera con ASC el MAP-001.” |
| **Audita ASC** | Revisa el prompt o resultado contra contrato, fuentes y criterios de validación. | “Audita ASC este resultado.” |
| **Usa X como input ASC** | Permite que X alimente la compilación, sin convertirlo automáticamente en autoridad o verdad. | “Usa este mapa como input ASC.” |

## 3. Tratamientos de información en ASC

| Tratamiento | Qué significa | Ejemplo |
| --- | --- | --- |
| **KNOWN** | Existe base suficiente para trasladar la información a la compilación. | “La casa está a la izquierda: KNOWN.” |
| **OPEN** | No existe evidencia o decisión suficiente. Debe permanecer abierto. | “Altura exacta: OPEN.” |
| **PROHIBIDO INFERIR** | El ejecutor no puede completar ese vacío por plausibilidad. | “No inferir otras construcciones.” |
| **ART-PROVISIONAL** | Solución visual temporal permitida para una prueba. No se convierte en evidencia. | “Usar un volumen simple ART-PROVISIONAL.” |

## Regla de lectura

```text
ASC compila; no decide la verdad del proyecto.
La plausibilidad visual no es evidencia.
Si no está respaldado, permanece OPEN.
```

Los tratamientos ASC no sustituyen estados de otros dominios como `claimState`, `evidenceStatus` o `productionStatus`.

## Uso recomendado

Usar esta guía para conversaciones rápidas, handoffs y trabajo diario con agentes o herramientas generativas. Para compilación real, auditorías o decisiones que vayan a consolidarse, abrir primero `ARBORIS_SCENE_COMPILER.md` y luego solo las autoridades de dominio necesarias.
