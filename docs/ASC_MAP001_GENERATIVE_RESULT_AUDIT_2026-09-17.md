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

La procedencia incompleta del primer resultado impide tratar la siguiente corrida como repetición estricta. Para el siguiente ciclo inmediato se prioriza establecer un baseline reproducible e instrumentado:

```text
MISMO CONTRATO v2.1
→ RECOMPILACIÓN CON RUNTIME CONFORME
→ REGISTRO DEL PROMPT EXACTO + HASH
→ REGISTRO DE PROVIDER / MODEL ID / PARÁMETROS DISPONIBLES
→ EJECUCIÓN GENERATIVA
→ AUDITORÍA CON LOS MISMOS CRITERIOS
→ BASELINE REPRODUCIBLE
```

El primer resultado permanece como referencia histórica comparativa. No se utiliza como baseline de reproducibilidad porque no conserva provenance suficiente para reconstruir una ejecución exacta.

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
**SIGUIENTE PASO: ESTABLECER `MAP-001-ASC-GENERATIVE-BASELINE-001` ANTES DE INTENTAR UNA PRUEBA DE REPRODUCIBILIDAD.**


## 13. Refinamiento del siguiente gate — baseline reproducible

Una revisión posterior del registro experimental determinó que el primer resultado generativo v2.1 tiene procedencia incompleta.

Está respaldado que:

- fue auditado contra `MAP-001-ASC-MAPPING-0021`;
- constituye la primera evidencia generativa registrada contra el contrato v2.1;
- puede utilizarse como referencia histórica comparativa.

No quedó registrado de forma suficiente:

- un `executionTestId` específico de la corrida;
- el prompt exacto efectivamente enviado al ejecutor;
- provider;
- identificador exacto de modelo / versión;
- parámetros de generación;
- seed, si existió;
- configuración específica del ejecutor.

Por ello:

```text
Resultado 001
= evidencia generativa v2.1 válida
= provenance incompleta
≠ baseline de reproducibilidad
≠ repetición controlable
```

No se atribuye documentalmente esta corrida a una persona, proveedor o modelo que el registro actual no identifique.

## 14. MAP-001-ASC-GENERATIVE-BASELINE-001

El siguiente experimento se define como:

```text
MAP-001-ASC-GENERATIVE-BASELINE-001
```

Su propósito es establecer por primera vez una ejecución v2.1 cuya entrada, compilación y ejecución generativa puedan trazarse de extremo a extremo.

### 14.1 Contrato

Fuente semántica congelada:

```text
contractId / testId:
MAP-001-ASC-MAPPING-0021

revision:
v2.1
```

El contrato completo continúa registrado como JSON embebido en `docs/ASC_MAP001_CONTRACT_V2_1_EXPERIMENT_2026-09-17.md`.

No se modifica su contenido para construir el baseline.

### 14.2 Artefactos preliminares reportados

La sesión experimental reportó una extracción literal del JSON del contrato y una compilación preliminar fuera del runtime declarado por el proyecto.

```text
CONTRACT
MAP-001-ASC-MAPPING-0021.json
sha256:
9e8f08b576809f61816f3c6392998dd0b42a51c8382b4e77de1d454f2892ef1c

PRELIMINARY PROMPT
PROMPT_ASC_BASELINE-001.txt
sha256:
a2a907f60ca279e6f8ef52f0c76af549bae958c2cae004e305299f369093cf00
```

Estado reportado de esa compilación:

```text
runtime: Node v22.22.2
package runtime requirement: >=24.0.0 <25
exitCode: 0
two-run determinism under Node 22: PASS
prompt status: PRELIMINARY / RUNTIME-NONCONFORMING
```

Estos hashes se registran como evidencia experimental reportada y deberán verificarse en el entorno conforme antes de consolidar el prompt canónico del baseline.

No se persiste por esta decisión un nuevo fixture v2.1 en `tools/asc/fixtures/`.

### 14.3 Gate de runtime y provenance

Antes de ejecutar un modelo generativo deben registrarse en un entorno conforme:

- versión exacta de Node 24.x;
- `git rev-parse HEAD`;
- `git branch --show-current`;
- `git status --short`;
- SHA-256 del contrato;
- SHA-256 de `tools/asc/compile_asc.mjs`;
- dos compilaciones independientes del mismo contrato;
- SHA-256 de ambas salidas.

Criterio:

```text
prompt A == prompt B
→ determinism under conforming runtime = PASS
```

Si además el hash Node 24 coincide con el prompt preliminar Node 22:

```text
cross-runtime output equivalence Node22 ↔ Node24 = PASS
```

Si no coincide, se debe revisar primero:

1. hash del contrato;
2. hash del compilador;
3. determinismo interno de Node 24;
4. mecanismo de escritura (`--output` frente a redirección de stdout);
5. encoding y newlines;
6. estado del working tree.

No se atribuye una diferencia al runtime hasta descartar esas variables.

### 14.4 Gate del ejecutor generativo

La ejecución generativa permanece bloqueada hasta cerrar el gate anterior.

El baseline debe preferir un ejecutor que permita registrar explícitamente, cuando la plataforma lo exponga:

- provider;
- model ID / versión;
- prompt exacto;
- tamaño / aspect ratio;
- número de imágenes;
- parámetros disponibles;
- seed, si existe;
- fecha/hora;
- identificador de respuesta o job, si existe.

Cada campo debe distinguir entre:

```text
KNOWN
NOT APPLICABLE
NOT EXPOSED
```

Una interfaz que oculte el identificador exacto del modelo puede seguir siendo útil para una futura prueba exploratoria o de portabilidad, pero no constituye por sí sola el baseline preferido de reproducibilidad.

### 14.5 Auditoría posterior del baseline

El resultado del baseline debe evaluarse con la misma matriz empleada para el Resultado 001.

Después del baseline, una ejecución posterior solo puede tratarse como prueba de reproducibilidad estricta si mantiene:

```text
mismo contrato
+ mismo prompt exacto
+ mismo provider
+ mismo model ID / versión
+ mismos parámetros disponibles
```

Las diferencias entre resultados deberán clasificarse como:

- `STABLE`;
- `VARIABLE-BUT-VALID`;
- `REGRESSION`;
- `REPEATED-FAILURE`;
- `NOT-VERIFIABLE`.

Una evidencia de gap no autoriza automáticamente una v0.2.

## 15. Estado del gate

```text
BASELINE-001
├── contrato v2.1 exacto: CERRADO
├── hash de contrato preliminar: REGISTRADO / PENDIENTE VERIFICACIÓN LOCAL
├── compilación Node 22: PRELIMINARY / PASS
├── determinismo Node 22: PASS
├── runtime Node 24: PENDIENTE
├── provenance Git: PENDIENTE
├── determinismo Node 24: PENDIENTE
├── equivalencia Node22 ↔ Node24: PENDIENTE
├── prompt canónico definitivo: PENDIENTE
└── ejecución generativa: BLOQUEADA
```

## 16. Auditoría de esta actualización

### AUDITORÍA

La actualización refina el siguiente gate usando la evidencia disponible sin modificar ASC v0.1, el contrato v2.1 ni la autoridad de los documentos upstream.

### INCONSISTENCIAS

La formulación anterior de “repetir ejecución” era demasiado fuerte porque el Resultado 001 no conserva metadata suficiente para una repetición estricta. Se reemplaza por la construcción de un baseline instrumentado.

### VACÍOS / OMISIONES

Permanecen pendientes el runtime conforme Node 24, provenance Git del entorno de compilación, hash confirmado del compilador y prompt Node 24, provider/modelo y metadata de ejecución generativa.

### REDUNDANCIAS

No se crea una nueva especificación de ASC ni un segundo contrato. Esta actualización extiende el registro experimental existente para evitar una nota paralela con la misma autoridad y alcance.

### DECISIÓN

**MANTENER ASC v0.1 SIN CAMBIOS.**  
**MANTENER MAP-001-ASC-MAPPING-0021 v2.1 CONGELADO.**  
**TRATAR RESULTADO 001 COMO REFERENCIA HISTÓRICA COMPARATIVA, NO COMO BASELINE REPRODUCIBLE.**  
**CERRAR PRIMERO MAP-001-ASC-GENERATIVE-BASELINE-001 ANTES DE UNA PRUEBA FORMAL DE REPRODUCIBILIDAD.**
