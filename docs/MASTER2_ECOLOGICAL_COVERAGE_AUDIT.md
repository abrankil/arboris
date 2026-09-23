# Árboris — Auditoría de cobertura ecológica del Master 2.0 y derivados

**Estado:** auditoría no normativa / resultado parcial por acceso de fuente  
**Gate:** MASTER2-ECOLOGICAL-COVERAGE-AUDIT-001  
**Fecha:** 23 septiembre 2026  
**Ámbito:** determinar si hábitat, distribución, altitud, fenología, microhábitat y relaciones ecológicas ya están disponibles en la autoridad botánica o se pierden en la derivación.

## 1. Pregunta de auditoría

> ¿La información ecológica necesaria para `OBSERVAR → RECONOCER → CONTEXTUALIZAR` ya existe en Master Botánico 2.0 y se pierde en la derivación, o realmente falta incorporarla con fuentes autorizadas?

## 2. Autoridades revisadas

Se revisaron:

- `data/source/README.md`;
- `tools/botanical-data/export_master.py`;
- `tools/botanical-data/validate_master_export.py`;
- `tools/botanical-data/build_species_data.py`;
- `data/README.md`;
- `data/botanical/metadata.json`;
- `data/botanical/species.json`;
- `data/botanical/contexts.json`;
- fichas derivadas de Peumo, Litre y Quillay;
- documentación vigente de arquitectura, visión y principios.

El archivo XLSX canónico está identificado y disponible en el repositorio, pero en esta ejecución no fue posible inspeccionar directamente sus celdas internas mediante el conector GitHub, porque el artefacto binario no se expone como hoja tabular legible por las herramientas conectadas de esta sesión.

Por esa razón, esta auditoría puede probar con certeza el **contrato de exportación y el contenido de los derivados**, pero no puede afirmar todavía si existen columnas o hojas ecológicas no exportadas dentro del XLSX.

## 3. Qué sí queda demostrado

### 3.1 Los JSON derivados reproducen exactamente el contrato declarado del Master

`export_master.py`:

- lee `Exportar_JSON`;
- lee `Diccionario_Campos`;
- exporta únicamente las hojas activas y campos declarados;
- transforma esos campos a JSON.

`validate_master_export.py` vuelve a leer el Master y comprueba que cada JSON reproduzca exactamente los registros y campos definidos por ese contrato.

Por tanto:

> un campo ecológico declarado en `Diccionario_Campos` y perteneciente a una hoja exportable no podría desaparecer silenciosamente de los JSON sin hacer fallar la validación.

### 3.2 El canon derivado actual no contiene una capa ecológica suficiente

Los ocho JSON canónicos vigentes son:

```text
metadata
species
characters
species_characters
sources
glossary
photos
model_errors
```

`species.json` contiene identidad/taxonomía y estado del piloto, pero no campos sistemáticos de:

- hábitat;
- microhábitat;
- ecosistema;
- distribución;
- altitud;
- fenología;
- especies asociadas;
- relaciones ecológicas.

`species_characters.json` conserva caracteres, variabilidad, fuente, observabilidad, seguridad, costo y confianza, no una matriz ecológica de especie.

`contexts.json`, que ACE consume como capa complementaria y que no deriva del Master, contiene actualmente un único contexto:

```text
hojas_de_sombra
```

### 3.3 Las fichas por especie no recuperan información adicional

`build_species_data.py` construye cada ficha exclusivamente desde los JSON canónicos.

`validate_species_data.py` exige que esas fichas reproduzcan exclusivamente esa información y declara explícitamente que no contienen conocimiento botánico adicional ni una segunda fuente de verdad.

Por tanto, si la información ecológica no está en los JSON canónicos, tampoco puede aparecer legítimamente en `data/species/*.json`.

## 4. Lo que NO puede concluirse todavía

No está probado todavía cuál de estas dos situaciones es la real:

### Hipótesis A — datos existentes pero no incorporados al contrato exportable

```text
MASTER XLSX
contiene datos ecológicos
→ no están declarados en Exportar_JSON / Diccionario_Campos
→ no llegan a JSON
```

### Hipótesis B — datos realmente ausentes del Master

```text
MASTER XLSX
no contiene todavía esos datos ecológicos
→ no existe nada que exportar
```

El pipeline actual no permite distinguir A de B sólo leyendo los derivados.

## 5. Hallazgo material

Sí queda demostrado un punto independiente de A/B:

> **La capa canónica consumible actual de Árboris no está preparada para generar contextualización ecológica sistemática por especie.**

Esto significa que cualquier UX que hoy explicara automáticamente hábitat, altitud, fenología o relaciones ecológicas por especie tendría que:

1. usar información fuera del canon vigente; o
2. inferir conocimiento no registrado.

Ambas rutas violarían la política actual de autoridad y procedencia.

## 6. Relación con PRODUCT_VISION y PRODUCT_PRINCIPLES

Existe una brecha de cobertura, no una contradicción normativa.

La visión y los principios ya exigen conservar o considerar, cuando corresponda:

- contexto geográfico;
- ecosistema;
- hábitat;
- altitud;
- fenología;
- microhábitat;
- variables ambientales.

El sistema de datos vigente cubre de forma sólida identidad, caracteres, evidencia, fuentes, fotos y errores, pero todavía no materializa sistemáticamente esa dimensión ecológica en su capa canónica derivada.

## 7. AUDITORÍA

**Resultado:** `PARTIAL PASS — DERIVATION GAP PROVEN; MASTER-CONTENT STATUS OPEN`.

Se prueba que:

- los derivados actuales carecen de cobertura ecológica sistemática;
- el pipeline no pierde campos que estén correctamente declarados en el contrato exportable;
- las fichas no agregan conocimiento adicional;
- no se debe diseñar UX ecológica específica usando conocimiento no canónico.

No se prueba todavía si el XLSX contiene información ecológica fuera del contrato exportable.

## 8. INCONSISTENCIAS

No se encontró inconsistencia en el pipeline.

El pipeline hace correctamente lo que declara.

La tensión real es de alcance:

```text
PRODUCT REQUIREMENTS
esperan contexto ecológico

CURRENT CANONICAL EXPORT CONTRACT
no lo expone sistemáticamente
```

## 9. VACÍOS / OMISIONES

Permanece OPEN:

- inspección directa de hojas y columnas del XLSX;
- existencia de datos ecológicos no exportados;
- campos ecológicos mínimos requeridos;
- fuente y procedencia por campo;
- separación entre conocimiento canónico de especie y contexto observado de una observación;
- diseño de relaciones especie–hábitat;
- representación de fenología;
- representación de rango altitudinal;
- representación de asociaciones ecológicas;
- política de actualización y validación de esos datos.

## 10. REDUNDANCIAS

No corresponde crear todavía:

- un segundo “Master ecológico”;
- fichas ecológicas paralelas;
- JSON manuales de hábitat;
- conocimiento hardcodeado en UX;
- un motor de contextualización separado.

Primero debe resolverse A vs. B en la autoridad editorial existente.

## 11. Gate

```text
DERIVED ECOLOGICAL COVERAGE: INSUFFICIENT
EXPORT PIPELINE SILENT LOSS OF DECLARED FIELDS: NOT SUPPORTED
SPECIES CARDS AS EXTRA KNOWLEDGE SOURCE: PROHIBITED / NOT PRESENT
MASTER HAS UNEXPORTED ECOLOGICAL DATA: OPEN
MASTER LACKS ECOLOGICAL DATA: OPEN
CONTEXTUAL UX WITH SPECIES-SPECIFIC CLAIMS: BLOCKED
NEW ARCHITECTURE: NOT WARRANTED
DIRECT MASTER INSPECTION: REQUIRED NEXT
```

## 12. Próximo paso

El siguiente paso exacto es una inspección directa del XLSX canónico sobre:

```text
sheet names
→ export map
→ field dictionary
→ species sheet
→ any non-exported sheets
→ columns containing habitat/distribution/altitude/phenology/microhabitat/ecology/context
```

Si esos datos existen, corresponde ampliar de forma controlada el contrato de exportación.

Si no existen, corresponde diseñar una ampliación del Master con fuentes autorizadas antes de cualquier UX contextual por especie.
