# Árboris — Cierre de jornada 2026-09-19
## ASC — R4, réplica inter-agente y preparación de R5

**Fecha:** 2026-09-19  
**Tipo:** cierre de jornada  
**Estado:** VALIDADO / INTEGRADO / CERRADO  
**Ámbito principal:** ASC — fidelidad epistemológica durante handoff  
**Próximo hito experimental:** R5 — Element-Level / Claim-Level Provenance

## 1. Resumen ejecutivo

La jornada consolidó y cerró el trabajo experimental de R4 sobre fidelidad de handoff y extendió su comprobación mediante una réplica realizada por otro agente.

R4 permanece **VALIDADO / CERRADO**. La réplica inter-agente mostró que `PROVENANCE PRESERVATION` puede transferirse explícitamente a otro agente a nivel estructural. El segundo agente consiguió distinguir evidencia directa, observación derivada, abstracción, no observable, metadata externa, uso propuesto y compilación frente a auditoría.

El artefacto completo obtuvo **PARTIAL**. Los fallos reaparecieron a una granularidad inferior: una sección correctamente etiquetada podía contener claims con diferentes niveles epistemológicos.

La ficha visual de la réplica reveló además `FALSE PRECISION` y `VISUAL AUTHORITY AMPLIFICATION`. Ambos quedan registrados como hallazgos experimentales, no como nuevas reglas normativas de ASC.

El siguiente experimento es **R5 — ELEMENT-LEVEL / CLAIM-LEVEL PROVENANCE**, todavía **PROPUESTO / NO EJECUTADO**.

## 2. Tratamiento y cierre de R4

R4 introdujo **PROVENANCE PRESERVATION**:

> Toda transformación de evidencia durante un handoff debe preservar explícitamente el estatus epistemológico del contenido.

Cadena conceptual:

```text
SOURCE
↓
EVIDENCIA DIRECTA
↓
OBSERVACIÓN DERIVADA
↓
ABSTRACCIÓN / DIAGRAMA
↓
USO PROPUESTO
```

Una transformación posterior no debe adquirir visualmente el estatus de una etapa anterior.

También se estableció la separación:

```text
COMPILADOR → produce
AUDITOR → evalúa
```

La compilación no determina su propio PASS, PARTIAL, FAIL, VALIDATED o APPROVED.

La compilación inicial fue **PARTIAL**. Tras aplicar el tratamiento, la versión corregida obtuvo **PASS con observaciones menores**.

## 3. Contraste R4

Registro: `ASC-R4-CONTRAST-001`.

```text
INITIAL: PARTIAL
TREATMENT: PROVENANCE PRESERVATION
CORRECTED: PASS WITH MINOR OBSERVATIONS
```

El contraste mostró que una cantidad similar de análisis puede tener una calidad epistemológica diferente según cómo se representa su procedencia.

R4 queda **VALIDADO / CERRADO**, con **evidencia inicial favorable a generalización**, no validación general.

El contraste ya fue integrado previamente en:

`docs/ASC_R4_PROVENANCE_PRESERVATION_CONTRAST_2026-09-19.md`

Commit previo: `3b558f5fb8add9fbc8b310cc85b848bde49d0eae`.

## 4. Réplica inter-agente

Test: `ASC-R4-HANDOFF-FIDELITY-REPLICATION-001`.

El agente recibió la referencia visual, ASC v0.1, instrucciones de compilación, Provenance Preservation, controles de identidad, metadata externa, observabilidad, generalización y separación compilación/auditoría.

Resultado estructural:

```text
STRUCTURAL PROVENANCE: PASS
IDENTITY CONTROL: PASS
EXTERNAL METADATA CONTROL: PASS
OBSERVABLE / NON-OBSERVABLE: PASS
GENERALIZATION CONTROL: PASS
COMPILER / AUDITOR SEPARATION: PASS
ABSTRACTION DISCLOSURE: PASS
```

Esto aporta evidencia adicional favorable a la transferencia inter-agente del tratamiento R4.

El artefacto completo fue **PARTIAL** porque la procedencia correcta a nivel de sección no garantizó procedencia correcta a nivel de claim.

Ejemplo:

```text
"dos elementos circulares grandes"
→ descripción visual

"posiblemente luminosos"
→ hipótesis / interpretación

"mecánicos"
→ interpretación funcional
```

## 5. Residuo principal: Element / Claim-Level Provenance

La réplica confirmó que la procedencia puede variar dentro de un mismo componente:

```text
COMPONENTE
├── IMAGEN → EVIDENCIA DIRECTA
├── ETIQUETA → DESCRIPCIÓN
└── INTERPRETACIÓN → HIPÓTESIS
```

La unidad epistemológica candidata para R5 es el **CLAIM**. Esta hipótesis todavía no ha sido validada experimentalmente.

## 6. False Precision

La ficha visual declaró, entre otros valores:

```text
ALTURA TOTAL ≈ 2.40 m
ANCHO HOMBROS ≈ 1.60 m
ANCHO BASE / CADERAS ≈ 1.10 m
≈ 8.0 unidades
≈ 5.3 unidades
≈ 3.7 unidades
60 % / 30 % / 10 %
```

La fuente no contenía escala física conocida ni un procedimiento documentado que justificara ese grado de precisión.

Resultado:

```text
PHYSICAL-SCALE CLAIMS: FAIL
QUANTITATIVE TRACEABILITY: FAIL
VOLUME-PERCENT TRACEABILITY: FAIL
FALSE-PRECISION CONTROL: FAIL
```

Se registra **PRECISION PROVENANCE** como hallazgo no normativo y test todavía no diseñado.

Distinción provisional:

```text
QUALITATIVE
↓
RELATIVE QUANTITATIVE
↓
ABSOLUTE QUANTITATIVE
```

## 7. Visual Authority Amplification

La ficha representó estimaciones mediante líneas de dimensión, unidades y convenciones de plano técnico. Esto hizo que estimaciones adquirieran apariencia de medición:

```text
ESTIMACIÓN
↓
REPRESENTACIÓN TÉCNICA
↓
APARIENCIA DE MEDICIÓN
↓
AUMENTO DE AUTORIDAD PERCIBIDA
```

Se registra **VISUAL AUTHORITY AMPLIFICATION** como hallazgo experimental no normativo.

Definición provisional:

> Incremento de la certeza o precisión percibida de una afirmación provocado por la forma utilizada para representarla, sin un incremento equivalente de evidencia, método o trazabilidad.

## 8. Hipótesis de arquitectura

R4 detectó:

```text
ABSTRACCIÓN → apariencia de EVIDENCIA
```

La réplica visual detectó:

```text
ESTIMACIÓN → apariencia de MEDICIÓN
```

Ambos podrían pertenecer a una familia superior denominada provisionalmente **EPISTEMIC AUTHORITY PRESERVATION**.

Hipótesis:

> Durante un handoff, ninguna transformación debería comunicar una autoridad epistemológica superior a la sustentada por su evidencia, método y procedencia.

Estado: **HIPÓTESIS DE ARQUITECTURA / NO NORMATIVA**.

Arquitectura candidata:

```text
CLAIM
├── PROVENANCE
├── GRANULARITY
├── SUPPORT
├── PRECISION
├── REPRESENTATION
└── AUTHORITY
```

## 9. Riesgo metodológico

No se recomienda resolver los hallazgos mediante blacklist específica, por ejemplo prohibiendo términos o formatos concretos como "exhaust", "acero", metros o porcentajes.

Los siguientes experimentos deben comprobar reglas transferibles y no únicamente obediencia a prohibiciones conocidas.

## 10. Posible aplicación al backbone botánico

Se identificó como hipótesis de aplicabilidad la cadena:

```text
FOTO DE HOJA
↓
"el borde parece continuo"
↓
"margen entero"
↓
"carácter diagnóstico"
↓
"la especie es X"
```

La arquitectura podría ser relevante para:

```text
EVIDENCE
↓
CHARACTER
↓
IDENTIFICATION
```

Esta extrapolación no ha sido validada mediante experimento botánico.

## 11. Evidencia a preservar

Debe conservarse sin corrección retrospectiva:

- compilación visual inicial de R4;
- auditoría inicial;
- compilación corregida;
- auditoría de la compilación corregida;
- registro y contraste R4;
- prompt exacto de la réplica inter-agente;
- referencia visual entregada;
- output textual íntegro del segundo agente;
- auditoría del output textual;
- ficha visual generada;
- auditoría de la ficha visual;
- errores cuantitativos y funcionales que permitieron detectar los residuos.

Los errores son parte de la evidencia experimental.

## 12. Decisiones cerradas

1. R4 permanece **VALIDADO / CERRADO**.
2. Provenance Preservation cuenta con evidencia inicial favorable y réplica inter-agente estructural satisfactoria; no equivale a validación general.
3. La compilación no puede autoasignarse su auditoría.
4. Los artefactos fallidos se conservan como evidencia y no se corrigen retrospectivamente.
5. El residuo principal se deriva a R5.
6. R5 debe trabajar a granularidad de elemento/claim, no solo de sección o panel.
7. Precision Provenance no se incorpora todavía como regla.
8. Visual Authority Amplification no se incorpora todavía como regla.
9. Epistemic Authority Preservation permanece como hipótesis de arquitectura.

## 13. Hallazgos no normativos

Permanecen explícitamente no normativos:

- CLAIM como unidad epistemológica mínima candidata;
- PRECISION PROVENANCE;
- niveles qualitative / relative quantitative / absolute quantitative;
- VISUAL AUTHORITY AMPLIFICATION;
- REPRESENTATIONAL AUTHORITY;
- arquitectura de seis dimensiones;
- EPISTEMIC AUTHORITY PRESERVATION;
- extrapolación al backbone botánico.

Ninguno modifica automáticamente ASC v0.1.

## 14. Estado exacto de R4

```text
R4 — HANDOFF FIDELITY

STATUS: VALIDATED / CLOSED
INITIAL: PARTIAL
TREATMENT: PROVENANCE PRESERVATION
CORRECTED: PASS WITH MINOR OBSERVATIONS
CONTRAST: VALIDATED / INTEGRATED
INTER-AGENT STRUCTURAL REPLICATION: PASS
EVIDENCE STRENGTH: INITIAL SUPPORT FOR GENERALIZATION
GENERAL VALIDATION: NO
```

## 15. Estado exacto de R5

```text
R5 — ELEMENT-LEVEL / CLAIM-LEVEL PROVENANCE

STATUS: PROPOSED
EXECUTED: NO
EXPERIMENTAL DESIGN: NOT YET CLOSED

PRIMARY QUESTION:
Can ASC preserve provenance when direct evidence,
description, quantification and interpretation coexist
inside the same component?

CANDIDATE EPISTEMIC UNIT:
CLAIM
```

No se abren formalmente R6 ni R7. Precision Provenance y Representational Authority permanecen como candidatos posteriores. Primero debe ejecutarse R5.

## 16. Punto de reanudación

La próxima sesión comienza en:

**DISEÑO DE R5 — ELEMENT-LEVEL / CLAIM-LEVEL PROVENANCE**

No es necesario volver a auditar R4, corregir los artefactos experimentales, repetir el contraste ni convertir los nuevos hallazgos en reglas.

Punto exacto de entrada:

> Diseñar un experimento limpio para comprobar si ASC puede preservar procedencia a nivel de claim cuando un único componente contiene evidencia directa, descripción, cuantificación, interpretación e información no establecida.

R5 no debe construirse como blacklist de los errores encontrados. Debe probar una regla abstracta de granularidad epistemológica.

Hipótesis candidata:

> Si ASC asigna procedencia a nivel de claim en lugar de hacerlo solamente a nivel de componente, las inferencias de distinto nivel epistemológico podrán coexistir sin adquirir mutuamente su autoridad.

Esta formulación debe auditarse durante el diseño de R5.

## 17. Secuencia acumulada

```text
R4
PROVENANCE PRESERVATION
│
├── fallo inicial → PARTIAL
├── tratamiento → PASS
├── contraste → VALIDATED
└── réplica inter-agente
    ├── structural transfer → PASS
    └── artifact audit → PARTIAL
        ├── claim-level provenance
        ├── false precision
        └── visual authority amplification
            ↓
           R5
```

## 18. Cierre final

```text
DATE: 2026-09-19
ASC: v0.1

R4: VALIDATED / CLOSED
R4 CONTRAST: VALIDATED / INTEGRATED
R4 INTER-AGENT REPLICATION: STRUCTURAL PASS
REPLICATION ARTIFACT: PARTIAL

PRIMARY RESIDUAL:
ELEMENT / CLAIM-LEVEL PROVENANCE

R5:
PROPOSED / NOT EXECUTED

FALSE PRECISION:
DETECTED / NON-NORMATIVE

PRECISION PROVENANCE:
HYPOTHESIS / TEST NOT DESIGNED

VISUAL AUTHORITY AMPLIFICATION:
DETECTED / NON-NORMATIVE

EPISTEMIC AUTHORITY PRESERVATION:
ARCHITECTURAL HYPOTHESIS / NON-NORMATIVE

NEXT SESSION:
DESIGN R5

DOCUMENTATION:
PASS

VALIDATION:
ACCEPTED

INTEGRATION:
COMPLETED

JOURNAL:
CLOSED
```
