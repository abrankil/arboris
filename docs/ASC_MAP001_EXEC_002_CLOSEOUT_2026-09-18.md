# ASC — MAP-001 GENERATIVE EXEC-002 closeout

**Fecha:** 2026-09-18  
**Repositorio:** `abrankil/arboris`  
**Estado:** experimento visual cerrado; no constituye baseline reproducible  
**Contrato:** `MAP-001-ASC-MAPPING-0021 v2.1`  
**Ejecución:** `MAP-001-ASC-GENERATIVE-EXEC-002`

## 1. Propósito

Cerrar documentalmente la ejecución correctiva `EXEC-002` después de la auditoría visual del resultado.

Esta ejecución corrigió los principales fallos observados en las generaciones anteriores sin modificar ASC v0.1 ni el contrato v2.1.

## 2. Resultado

```text
STRUCTURAL CONTRACT: PASS VISUAL
MANDATORY RELATIONS: PASS VISUAL
OPEN PRESERVATION: PASS
DO NOT INFER: PASS
PROHIBITED: PASS
ARTISTIC FREEDOM: PASS
OUTPUT HYGIENE: PASS
READING PRIORITIES: PASS
CAMERA / FORMAT: PASS VISUAL
GEOMETRIC VALIDATION: NOT TESTED
REPRODUCIBILITY: NOT ESTABLISHED

DECISION:
PASS VISUAL / PARTIAL SYSTEM
```

## 3. Relaciones preservadas visualmente

La salida permite reconstruir sin etiquetas la secuencia:

```text
entrada inferior
→ puente sobre estero
→ puerta
→ casa a izquierda
→ camino principal dominante
→ estero a derecha + inferior
→ corredor entre laderas
→ interior / cordillera
```

También preserva:

- terreno como masa continua;
- ausencia visual de bifurcaciones transitables no autorizadas;
- jerarquía de ruta;
- formato portrait-first;
- ausencia de UI, señalética, brújula, escala y metadata embebida.

## 4. OPEN preservados

La imagen no cierra como hechos:

- geometría exacta del `walkableEnvelope`;
- dimensiones o distancias;
- escala;
- bearing;
- cardinalidad;
- pitch;
- yaw;
- FOV;
- zoom definitivo;
- distribución botánica;
- microhábitats.

El relieve, vegetación, nieve, roca y carácter alpino se tratan como:

```text
ART-PROVISIONAL
```

No constituyen evidencia territorial, topográfica, hidrológica ni botánica.

## 5. Provenance disponible

```text
executionId:
MAP-001-ASC-GENERATIVE-EXEC-002

provider:
OpenAI — KNOWN

executor model ID / exact version:
NOT EXPOSED

exact executor prompt:
NOT EXPOSED

seed:
NOT EXPOSED

generation response id:
3e844746-5a29-4368-9676-8f106ee84eb1

output:
PNG
1024 × 1536
portrait 2:3

output SHA-256:
1bc9663399bf70f339fc1c35e788c85078097ef42f133c110404a8c5738d8b3f
```

La herramienta de ejecución no expuso el prompt interno exacto utilizado ni un identificador exacto de modelo/versión.

Por ello, aunque el artefacto resultante queda identificable por hash:

```text
EXEC-002
= experimento visual trazable
≠ baseline reproducible
≠ repetición estrictamente reconstruible
```

## 6. Relación con BASELINE-001

`PROMPT_ASC_BASELINE-001` permanece intacto y conserva su identidad canónica previa.

La ejecución `EXEC-002` incorporó correctivos locales posteriores y no debe confundirse con ese baseline.

```text
BASELINE-001
→ prompt canónico de compilación registrado

EXEC-002
→ ejecución correctiva posterior
→ prompt efectivo interno no expuesto
→ resultado visual PASS
```

## 7. Qué demuestra EXEC-002

Aporta evidencia experimental de que, con restricciones correctivas explícitas, un ejecutor generativo puede producir una representación visual que preserve:

- estructura global;
- relaciones territoriales obligatorias;
- jerarquía de ruta;
- continuidad del terreno;
- OPEN;
- DO NOT INFER;
- ausencia de invenciones visuales previamente observadas.

No demuestra:

- `walkableEnvelope` real;
- transitabilidad;
- conectividad de gameplay;
- colliders;
- interacción;
- oclusión jugable;
- reproducibilidad generativa estricta.

## 8. Decisión

```text
KEEP ASC v0.1
KEEP MAP-001-ASC-MAPPING-0021 v2.1
KEEP BASELINE-001 INTACT

CLOSE EXEC-002 AS:
PASS VISUAL / PARTIAL SYSTEM

NEXT GATE:
DETERMINISTIC BLOCKOUT
```
