# ASC — Auditoría de primer resultado generativo MAP-001

**Fecha:** 2026-09-17  
**Repositorio:** `abrankil/arboris`  
**Estado:** evidencia experimental de ejecución; no modifica ASC v0.1 ni convierte el resultado en evidencia territorial, botánica o asset de producción  
**Contrato auditado:** `MAP-001-ASC-MAPPING-0021`  
**Fuente del resultado:** imagen generativa aportada en la sesión de trabajo; la imagen no se incorpora al repositorio mediante este commit.

## 1. Objetivo

Auditar un primer resultado visual contra el contrato ASC v2.1 para determinar:

- qué invariantes pueden evaluarse visualmente;
- qué relaciones fueron preservadas;
- qué criterios quedan no verificables con una sola imagen;
- si la ejecución revela un gap del esquema ASC v0.1;
- si aparece evidencia que justifique v0.2.

## 2. Resultado general

```text
DECISIÓN: PARTIAL / REVISE

STRUCTURAL CONTRACT: PASS VISUAL
MANDATORY RELATIONS: PASS
OPEN PRESERVATION: PASS
DO NOT INFER: PASS WITH BOTANICAL RESERVATION
PROHIBITED: PASS
ARTISTIC FREEDOM: PASS
CAMERA / FORMAT: PARTIAL
READING PRIORITIES: PASS
```

El resultado puede continuar como referencia experimental, pero no puede declararse PASS final de MAP-001.

## 3. Evaluación por criterio

| Criterio ASC v2.1 | Resultado | Observación |
|---|---|---|
| región transitable única | PARTIAL | se observa una única ruta continua, pero una imagen no prueba transitabilidad real |
| entrada inferior → salida superior | PASS visual | la ruta entra desde abajo y progresa hacia interior/cordillera |
| bordes izquierdo/derecho cerrados | PASS visual | laderas y relieve contienen lateralmente la escena |
| sin ramas inventadas | PASS visual | no se observan bifurcaciones transitables adicionales |
| ruta principal dominante | PASS | el camino es el eje principal de lectura |
| terreno como masa continua | PASS | no se observan plataformas flotantes o masas desconectadas |
| entrada → puente → puerta → camino → interior | PASS | la secuencia territorial es legible |
| puente cruza estero antes de puerta | PASS | relación preservada |
| casa a la izquierda post-umbral | PASS | relación preservada |
| estero con giro visual en L en umbral | PASS / PARTIAL | la relación se comunica de forma orgánica sin fijar geometría medida |
| estero derecha + inferior post-umbral | PASS | relación claramente preservada |
| laderas contienen corredor | PASS | contención lateral clara |
| screen_up = interior/cordillera | PASS | dirección de avance inequívoca |
| screen_down = entrada/retorno | PASS | composición compatible |
| portrait | PASS | formato vertical compatible |
| PILOT_FIXED_ISOMETRIC | PARTIAL | visualmente compatible, pero una imagen no prueba parámetros técnicos de cámara |
| invariantes 360×640 y 360×800 | NOT TESTED | se requiere prueba en ambos viewports |
| OPEN preservados | PASS visual | no se presentan cotas, bearings, FOV ni cardinales como hechos |
| botánica no inferida | PARTIAL | la vegetación funciona como arte provisional y no debe tratarse como distribución validada |

## 4. Relaciones preservadas

La imagen mantiene el esqueleto espacial:

```text
entrada
↓
puente sobre estero
↓
puerta
↓
casa a izquierda
↓
camino dominante
↓
estero a derecha + inferior
↓
corredor entre laderas
↓
interior / cordillera
```

También preserva tres garantías independientes que fueron explícitamente separadas en v2.1:

```text
conectividad aparente
jerarquía de ruta
continuidad visual del terreno
```

## 5. PROHIBITED

No se observan violaciones evidentes de:

- ramas o bifurcaciones transitables no autorizadas;
- conexiones laterales nuevas;
- extensión urbana/periurbana;
- extensión aguas abajo fuera del fragmento piloto.

## 6. OPEN / DO NOT INFER

El resultado mantiene visualmente abiertos:

- geometría exacta del `walkableEnvelope`;
- bearing exacto del puente;
- métrica exacta del giro del estero;
- pitch/yaw/FOV/zoom definitivos;
- correspondencia cardinal de los lados de pantalla.

La imagen no debe utilizarse para cerrar ninguno de esos puntos.

La presencia de vegetación específica tampoco debe interpretarse como:

- identificación botánica;
- distribución validada;
- microhábitat validado;
- regla de colocación de especies.

## 7. Observaciones de revisión

### 7.1 Casa del conserje

La casa tiene peso visual considerable, pero no desplaza la ruta principal como eje de lectura.

**Estado:** observación de composición; no fallo contractual.

### 7.2 Relieve / carácter ambiental

La escena interpreta el corredor con un encajonamiento y relieve dramáticos.

Esto puede funcionar como naturalización artística, pero:

```text
apariencia dramática
≠
evidencia de pendiente, altura o morfología medida
```

### 7.3 Vegetación

Se observan siluetas vegetales relativamente específicas.

**Tratamiento:** ART-PROVISIONAL / visual; no evidencia botánica.

## 8. Lo que esta imagen no puede validar

Una sola imagen no permite marcar PASS para:

- `walkableEnvelopePreserved` real;
- conectividad como geometría de gameplay;
- invariantes de cámara en 360×640 y 360×800;
- interaction slots;
- player readability en ejecución;
- oclusión jugable;
- fidelidad métrica;
- navegación/colliders.

## 9. Evidencia nueva para ASC

Este resultado aporta evidencia experimental de que el prompt compilado puede transmitir de manera útil:

- relaciones obligatorias;
- jerarquía de ruta;
- continuidad de terreno;
- estados OPEN;
- restricciones DO NOT INFER;
- PROHIBITED.

No demuestra todavía que estas propiedades sean reproducibles entre múltiples ejecuciones o modelos.

## 10. Impacto en ASC v0.1

```text
NUEVOS CAMPOS NECESARIOS: 0 demostrados
CAMBIO DE ESQUEMA: NO
CAMBIO DE COMPILADOR: NO
VALIDATE INDEPENDIENTE: no requerido por este caso
v0.2 TRIGGER: NO
```

El gap que aparece ya no es de representación del contrato, sino de evaluación de resultados generativos.

## 11. Siguiente gate

El siguiente experimento debe aportar evidencia de reproducibilidad y no solo de una ejecución aislada.

Opciones válidas:

1. repetir la generación con el mismo prompt y comparar invariantes;
2. ejecutar el mismo prompt en otro modelo/proveedor y comparar;
3. probar explícitamente 360×640 y 360×800;
4. materializar un blockout/walkableEnvelope y medir preservación geométrica.

Para el siguiente ciclo inmediato se prioriza:

```text
MISMO CONTRATO
→ NUEVA EJECUCIÓN
→ AUDITORÍA CON LOS MISMOS CRITERIOS
→ COMPARACIÓN ENTRE RESULTADOS
```

Esto permite evaluar estabilidad del prompt antes de cambiar ASC.

## 12. Auditoría

### AUDITORÍA

El primer resultado generativo preserva visualmente la mayor parte de las garantías semánticas del contrato v2.1.

### INCONSISTENCIAS

No se detectó contradicción que obligue a modificar ASC v0.1.

### VACÍOS / OMISIONES

No se prueba geometría real, reproducibilidad, comportamiento entre viewports ni interacción.

### REDUNDANCIAS

No se identifica redundancia nueva en el contrato.

### DECISIÓN

**MANTENER ASC v0.1.**  
**MANTENER v2.1 SIN CAMBIOS.**  
**CLASIFICAR ESTE RESULTADO COMO PARTIAL / REVISE.**  
**SIGUIENTE PASO: REPETIR EJECUCIÓN Y COMPARAR RESULTADOS ANTES DE ALTERAR EL CONTRATO.**
