# Árboris — Manual de vocabulario de producción con ASC

**Estado:** candidate v0.2 — operational, non-normative  
**Ámbito:** vocabulario operativo para handoff entre contratos, blockout, ASC, resultado y producción  
**Autoridades relacionadas:** `ARBORIS_SCENE_COMPILER.md`, `ASC_VOCABULARY_GUIDE.md`, `GENERAL_VOCABULARY_GUIDE.md`, `SPATIAL_MODEL.md`, `ENVIRONMENT_PRODUCTION_SPEC.md`

Este manual no redefine vocabulario normativo ni crea una autoridad paralela. Si existe discrepancia, prevalece la autoridad específica del dominio correspondiente.

## 1. Propósito

Definir un lenguaje operativo estable para el flujo:

```text
territorio / contratos
→ blockout
→ ASC
→ resultado
→ revisión
→ producción
```

El objetivo es reducir ambigüedad en handoffs, pruebas, auditorías y producción de escenas.

## 2. Términos heredados

Los siguientes términos ya están definidos por otras guías y no se redefinen aquí:

- ASC;
- prompt ASC;
- resultado ASC;
- prueba ASC;
- contrato de entrada;
- KNOWN;
- OPEN;
- PROHIBIDO INFERIR;
- ART-PROVISIONAL;
- IT;
- MAP;
- PASS / PARTIAL / FAIL;
- auditar;
- iterar;
- validar.

Para esos términos, consultar `ASC_VOCABULARY_GUIDE.md` y `GENERAL_VOCABULARY_GUIDE.md`.

## 3. Vocabulario propio de producción

| Término | Definición operativa | No confundir con |
| --- | --- | --- |
| **blockout** | Representación técnica simplificada de los contratos de una Instancia. Permite probar conectividad, ruta, alturas relativas, bloqueos, interacción, cámara y oclusión antes del arte final. | prototipo visual, asset |
| **prototipo visual** | Representación experimental utilizada para comprobar cómo una estructura autorizada se traduce visualmente. Puede aportar evidencia experimental para criterios compatibles con una salida visual, pero no constituye evidencia de dominio por sí mismo. | evidencia de dominio, asset final |
| **asset de producción** | Recurso utilizado o preparado bajo la especificación técnica y artística correspondiente. Su existencia no implica aprobación final. | imagen conceptual, resultado generativo |
| **preview** | Vista compuesta preparada para revisión de un mapa, prototipo o asset. | master, autoridad espacial |
| **walkableEnvelope** | Región transitable continua que actúa como autoridad geométrica de navegación. | raster, celdas, sendero dibujado |
| **discretización derivada** | Representación reproducible obtenida desde el `walkableEnvelope` para prueba o implementación. Puede materializarse como raster, celdas u otra representación. | fuente primaria de geometría |
| **puerto** | Conexión explícita declarada en un borde local del mapa. | continuidad visual implícita |
| **ruta secundaria** | Recorrido adicional autorizado por el Navigation Contract. | bifurcación visual no autorizada |
| **player proxy** | Representación provisional del jugador para comprobar escala, lectura y oclusión. | sprite final |
| **massing** | Representación simplificada de masas, desniveles y volúmenes para comprobar lectura espacial antes del detalle. | geometría territorial medida |
| **naturalización** | Operación visual que integra terreno, terrazas, roca, suelo, agua y vegetación sin alterar contratos espaciales ni convertir decisiones visuales en evidencia. | rediseño topológico |

## 4. Relaciones de autoridad

La autoridad geométrica de navegación sigue esta relación:

```text
walkableEnvelope
→ discretización derivada
→ raster / celdas / otra representación
```

La discretización se deriva del `walkableEnvelope`; no lo reemplaza como fuente primaria de geometría jugable.

Para navegación:

```text
ruta secundaria
= recorrido adicional autorizado

rama / bifurcación
= descripción de una forma de conectividad
```

La existencia visual de una rama no implica que esa conexión esté autorizada.

## 5. Resultado, prototipo, preview y asset

Estos términos describen propiedades distintas:

```text
resultado ASC
→ procedencia

prototipo visual
→ función experimental

preview
→ forma de revisión

asset de producción
→ función dentro del flujo productivo
```

Un mismo archivo puede ser simultáneamente:

```text
resultado ASC
+ prototipo visual
+ preview
```

Eso no lo convierte automáticamente en un asset aprobado.

Un resultado ASC o prototipo visual tampoco se convierte por sí mismo en evidencia territorial, botánica, ecológica o científica. Puede usarse como evidencia experimental únicamente para criterios que su clase de salida realmente pueda demostrar.

No crear la categoría formal `referencia experimental`. Cuando corresponda, usar:

```text
resultado ASC usado como referencia de prueba
```

## 6. Uso de MAP-*

`MAP-*` identifica un derivado. No declara por sí mismo su etapa de producción.

Preferir:

```text
MAP-001 blockout
MAP-001 prototipo visual
MAP-001 preview
```

Evitar usar simplemente “el MAP” cuando el tipo de representación sea relevante para la decisión o auditoría.

## 7. PASS visual y PASS geométrico

`PASS visual` y `PASS geométrico` no son estados nuevos.

El sistema de resultado continúa siendo:

```text
PASS / PARTIAL / FAIL
```

Los calificadores indican el tipo de criterio evaluado:

```text
PASS visual
= PASS aplicado a un criterio que puede comprobarse visualmente

PASS geométrico
= PASS aplicado a un criterio que requiere geometría lógica
  o materializada
```

Ejemplo:

```text
ruta principal dominante:
PASS visual

walkableEnvelope preservado:
NOT TESTED geométricamente
```

No declarar PASS geométrico desde una sola imagen si no existe geometría lógica o materializada que pueda compararse contra el contrato.

## 8. Operaciones específicas de producción

| Orden | Significado operativo |
| --- | --- |
| **Construye el blockout** | Materializa técnicamente los contratos sin introducir arte final como autoridad. |
| **Naturaliza** | Aplica tratamiento visual sin cambiar estructura autorizada. |
| **Prototipa** | Produce una representación experimental para evaluar una solución. |
| **Usa X como referencia** | Permite consultar X para el rol declarado sin modificar su autoridad. |
| **Usa X como input ASC** | Alimenta la compilación siguiendo las reglas ASC existentes. |
| **Audita el resultado ASC** | Contrasta el resultado con contrato, fuentes y criterios definidos. |

`Compila con ASC`, `Genera con ASC` y los verbos generales se heredan de las guías vigentes y no se redefinen aquí.

## 9. No confundir

```text
territorio ≠ representación
evidencia ≠ referencia visual
referencia ≠ autoridad

IT ≠ MAP
MAP ≠ etapa de producción

blockout ≠ prototipo visual
prototipo visual ≠ asset
resultado ASC ≠ evidencia de dominio por sí mismo
preview ≠ master

walkableEnvelope ≠ discretización
discretización ≠ autoridad territorial
conectividad ≠ apariencia de sendero

player proxy ≠ sprite final
massing ≠ geometría medida
naturalización ≠ cambio de topología

OPEN ≠ libertad artística
PROHIBIDO INFERIR ≠ prohibited

PASS visual ≠ PASS geométrico
imagen atractiva ≠ resultado válido
```

## 10. Gramática de handoff

Usar, cuando sea posible:

```text
OPERACIÓN + OBJETO + ALCANCE + INVARIANTES
```

Ejemplos:

```text
Naturaliza MAP-001 blockout.
Alcance: terreno y vegetación provisional.
Preserva walkableEnvelope, puertos y ruta principal.
```

```text
Prototipa MAP-001 desde el contrato v2.1.
Alcance: topología + territorio + cámara.
No cierres ningún OPEN.
```

```text
Audita el resultado ASC contra v2.1.
Evalúa solo criterios verificables desde esta salida.
No declares PASS geométrico sin geometría materializada.
```

## 11. Regla de uso

Este manual sirve para conversación diaria, handoffs y producción.

No debe utilizarse para:

- redefinir contratos;
- cerrar decisiones OPEN;
- alterar autoridad territorial, botánica o espacial;
- crear nuevos estados de producción;
- convertir resultados generativos en evidencia de dominio por sí mismos;
- sustituir documentos normativos.

## 12. Auditoría

### AUDITORÍA

El manual cubre una función operativa nueva: el vocabulario de handoff entre contratos, blockout, ASC, resultado y producción.

### INCONSISTENCIAS

No se detectan contradicciones con las autoridades vigentes después de las correcciones de v0.2.

### VACÍOS / OMISIONES

No se identifican términos adicionales imprescindibles para esta versión. Renderer, chunk, tile, sprite y otros términos técnicos permanecen fuera de alcance o bajo sus autoridades existentes.

### REDUNDANCIAS

Se evita redefinir vocabulario general y vocabulario propio de ASC. `referencia experimental` fue descartado como categoría formal.

### DECISIÓN

```text
ASC_PRODUCTION_VOCABULARY_MANUAL
CANDIDATE v0.2

FUNCIÓN NUEVA: PASS
REDUNDANCIA NORMATIVA: PASS
AUTORIDAD PARALELA: NO
TÉRMINOS SIN BASE: 0 críticos
ESTADOS NUEVOS CREADOS: 0
READY TO DOCUMENT: YES
```
