# ASC — Auditoría visual de guía de vocabulario de producción

**Fecha:** 2026-09-17  
**Repositorio:** `abrankil/arboris`  
**Estado:** experimento documentado; no modifica ASC v0.1 ni autoridades normativas  
**Prueba:** `ASC-PRODUCTION-VOCAB-GUIDE-001`  
**Fuente visual:** imagen generada en sesión de trabajo; no incorporada al repositorio mediante este commit

## 1. Objetivo

Registrar la ejecución y auditoría de una guía visual basada en:

- `docs/ASC_PRODUCTION_VOCABULARY_MANUAL.md`;
- `docs/ASC_VOCABULARY_GUIDE.md`;
- `docs/GENERAL_VOCABULARY_GUIDE.md`;
- `docs/ARBORIS_SCENE_COMPILER.md`.

La prueba buscó comprobar si un prompt ASC podía traducir el vocabulario de producción a una lámina visual sin:

- redefinir términos normativos;
- crear nuevos estados;
- mezclar autoridad con representación;
- convertir resultados generativos en evidencia.

## 2. Flujo requerido

```text
territorio / contratos
→ blockout
→ ASC
→ resultado
→ revisión
→ producción
```

## 3. Primera ejecución

La primera versión fue clasificada:

```text
PARTIAL / REVISE
```

Hallazgo crítico:

```text
“Compila con ASC (genera o procesa según el caso)”
```

Esta formulación era incorrecta porque en ASC v0.1:

```text
compilar con ASC
= construir el prompt ASC

no
= generar
```

También se detectó copy editorial no trazado directamente al manual y una simplificación excesiva de `territorio / contratos`.

## 4. Corrección aplicada

El bloque ASC se corrigió a:

```text
Compila el contrato
en un prompt ASC.

No ejecuta generación.
```

La tarjeta `territorio / contratos` se ajustó a una formulación más conservadora:

```text
Definen la estructura
y restricciones autorizadas.
```

No se modificó:

- el esquema ASC v0.1;
- el compilador;
- el manual de vocabulario;
- las autoridades normativas.

## 5. Segunda ejecución

La segunda guía preservó correctamente:

- flujo completo;
- separación entre blockout, prototipo visual, resultado ASC, preview y asset;
- separación ASC / ejecutor;
- relación `walkableEnvelope → discretización derivada → raster/celdas`;
- `PASS visual ≠ PASS geométrico`;
- `OPEN ≠ libertad artística`;
- `PROHIBIDO INFERIR ≠ prohibited`;
- `MAP-* ≠ etapa de producción`;
- `player proxy ≠ sprite final`;
- `massing ≠ geometría medida`;
- `naturalización ≠ cambio de topología`;
- bloque `NO CONFUNDIR`;
- gramática `OPERACIÓN + OBJETO + ALCANCE + INVARIANTES`;
- etiqueta `REFERENCIA OPERATIVA · NO NORMATIVA`.

## 6. Resultado final de auditoría

```text
STRUCTURAL CONTRACT: PASS
MANDATORY RELATIONS: PASS
OPEN PRESERVATION: PASS
DO NOT INFER: PASS
PROHIBITED: PASS
ARTISTIC FREEDOM: PASS
READING PRIORITIES: PASS
VISIBLE COPY CONTROL: PASS WITH EDITORIAL RESERVATION

CRITICAL ISSUES: 0
SEMANTIC BLOCKERS: 0

DECISION:
PASS WITH MINOR EDITORIAL REVISIONS
```

## 7. Reservas editoriales

Persisten frases gráficas no derivadas literalmente del manual, por ejemplo:

```text
DEL CONTRATO A MUNDOS COHERENTES.
HERRAMIENTAS CLARAS.
MUNDOS COHERENTES.
```

Tratamiento:

```text
ART-PROVISIONAL
```

No deben interpretarse como:

- slogan oficial;
- definición normativa;
- regla de producción;
- autoridad de proyecto.

También se mantiene una simplificación visual al agrupar `territorio / contratos` en una misma tarjeta. La formulación no contradice el contrato, pero debe seguir entendiéndose como recurso editorial.

## 8. Hallazgo sobre autoridad de navegación

La relación:

```text
walkableEnvelope
→ discretización derivada
→ raster / celdas
```

fue preservada correctamente en el contenido.

A nivel editorial conviene reforzar que se trata de una relación de derivación y no de tres autoridades equivalentes.

Este punto no constituye fallo semántico.

## 9. Evidencia nueva para ASC

La prueba aporta evidencia de que ASC v0.1 puede transportar suficiente semántica para una pieza editorial compleja siempre que:

- el copy visible esté explícitamente controlado;
- las relaciones críticas estén incluidas en el contrato;
- la auditoría posterior detecte redefiniciones introducidas por el ejecutor.

La primera ejecución mostró que un resultado visual puede conservar la estructura general y, aun así, introducir una redefinición crítica mediante una sola frase.

Por tanto:

```text
estructura visual correcta
≠
fidelidad semántica completa
```

## 10. Impacto en ASC v0.1

```text
CAMBIO DE ESQUEMA: NO
CAMBIO DE COMPILADOR: NO
NUEVOS CAMPOS NECESARIOS: 0 demostrados
v0.2 TRIGGER: NO
```

El problema detectado fue de ejecución/copy visual, no de capacidad representacional del contrato ASC.

## 11. Estado del resultado

La segunda guía puede utilizarse como:

```text
guía visual operativa experimental
```

No debe utilizarse como:

```text
autoridad normativa
fuente territorial
fuente botánica
sustituto del manual documentado
```

## 12. Auditoría

### AUDITORÍA

La segunda ejecución preserva las distinciones semánticas críticas y corrige el único blocker detectado en la primera.

### INCONSISTENCIAS

No quedan inconsistencias semánticas críticas.

### VACÍOS / OMISIONES

Permanece pendiente decidir si el copy editorial ART-PROVISIONAL se elimina o se mantiene como tratamiento gráfico.

### REDUNDANCIAS

No se detectan nuevas redundancias de sistema.

### DECISIÓN

**MANTENER ASC v0.1.**  
**MANTENER EL MANUAL v0.2 SIN CAMBIOS.**  
**CLASIFICAR LA SEGUNDA GUÍA COMO PASS WITH MINOR EDITORIAL REVISIONS.**  
**NO ABRIR v0.2.**
