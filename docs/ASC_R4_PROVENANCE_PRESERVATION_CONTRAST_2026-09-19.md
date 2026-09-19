# ASC — Registro contrastivo R4
## Efecto de Provenance Preservation sobre la fidelidad de handoff

**Fecha:** 2026-09-19  
**Sistema:** ASC v0.1  
**ID:** ASC-R4-CONTRAST-001  
**Experimento asociado:** R4 — Fidelidad de handoff  
**Estado:** VALIDADO / CERRADO  
**Naturaleza:** evidencia experimental contrastiva

## 1. Propósito

Este registro documenta el contraste entre dos compilaciones ASC realizadas a partir de la misma referencia visual. La variable principal es la preservación explícita de la procedencia y del estatus epistemológico durante el handoff.

## 2. Condición inicial

La primera compilación conservó las tres vistas, detalles, silueta, proporciones, lenguaje de formas, paleta, jerarquía de detalle, observaciones y límites de observabilidad. Sin embargo, evidencia directa, observación derivada, abstracción gráfica, metadatos externos y evaluación del artefacto recibían una autoridad visual insuficientemente diferenciada.

**Resultado inicial:** PARTIAL.

## 3. Problema detectado

El fallo principal no era necesariamente que el contenido derivado fuese incorrecto, sino que una transformación posterior podía adquirir visualmente el estatus de evidencia primaria.

Casos detectados:
- mapa de jerarquía de detalle presentado con apariencia de evidencia;
- lenguaje de formas mediante reconstrucciones gráficas;
- paleta con apariencia de precisión objetiva;
- identidad y fuente externas sin trazabilidad interna;
- autoasignación de `PASS` por el propio artefacto.

## 4. Tratamiento aplicado

Se introdujo **PROVENANCE PRESERVATION**, diferenciando explícitamente:

- `EVIDENCIA DIRECTA`
- `OBSERVACIÓN DERIVADA`
- `METADATA / DERIVADO`
- `NO OBSERVABLE`
- `USO RECOMENDADO`
- `PENDIENTE DE AUDITORÍA`

La corrección no elimina las abstracciones analíticas: declara su procedencia.

## 5. Contraste

| Control ASC | Inicial | Corregida |
|---|---|---|
| Conservación de tres vistas | PASS | PASS |
| Recortes de evidencia | PASS | PASS |
| Separación evidencia/inferencia | PARTIAL | PASS |
| Procedencia visible | FAIL | PASS |
| Proporciones como derivación | Implícita | Explícita |
| Lenguaje de formas | Ambiguo | Explícitamente derivado |
| Jerarquía de detalle | Apariencia de evidencia | Interpretación declarada |
| Paleta | Apariencia de dato objetivo | Aproximación declarada |
| Identidad del sujeto | Presentada como determinada | No especificada por la imagen |
| Procedencia de fuente | Atribución externa | Imagen proporcionada por usuario |
| Observable / no observable | PASS | PASS |
| Restricción de generalización | PASS | PASS |
| Autoevaluación | FAIL | PASS |
| Fidelidad global de handoff | PARTIAL | PASS |

## 6. Hallazgo principal

Las dos compilaciones contienen una cantidad comparable de análisis. La diferencia crítica es la representación de su procedencia.

> La fidelidad de handoff no depende solamente de conservar correctamente el contenido; depende también de conservar la relación epistemológica entre ese contenido y su fuente.

Una abstracción posterior no debe adquirir visualmente el estatus de evidencia directa.

## 7. Separación compilación / auditoría

La compilación inicial declaraba `ESTADO ASC — PASS`. La corregida utiliza `PENDIENTE DE AUDITORÍA`.

Se establece:

```
COMPILADOR
→ produce artefacto

AUDITOR
→ evalúa artefacto
```

La compilación no determina su propio PASS/PARTIAL/FAIL.

## 8. Residuo detectado

La corrección resuelve la procedencia a nivel general de panel y artefacto, pero queda un problema de granularidad.

Ejemplo:

```
RECORTE ORIGINAL
[EVIDENCIA DIRECTA]
        ↓
"Módulos traseros"
[DESCRIPCIÓN DERIVADA]
        ↓
"exhaust"
[INTERPRETACIÓN FUNCIONAL]
```

La evidencia visual de un componente no transfiere automáticamente su estatus a las etiquetas o interpretaciones que lo acompañan.

## 9. Regla apoyada por R4

### ASC HANDOFF RULE — PROVENANCE PRESERVATION

> Toda transformación de evidencia durante un handoff debe preservar explícitamente el estatus epistemológico del contenido.

Cadena conceptual:

```
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

## 10. Fuerza de evidencia

Este contraste corresponde a una referencia, dos compilaciones y una corrección controlada dentro de R4.

**EVIDENCIA INICIAL FAVORABLE A GENERALIZACIÓN.**

No constituye todavía validación general de la regla.

## 11. Resultado

**ASC-R4-CONTRAST-001**

- Condición inicial: **PARTIAL**
- Tratamiento: **PROVENANCE PRESERVATION**
- Condición corregida: **PASS con observaciones menores**
- R4: **VALIDADO / CERRADO**

Los artefactos inicial y corregido deben conservarse conjuntamente como evidencia histórica del contraste. La versión inicial no debe sustituirse retrospectivamente.

## 12. Siguiente experimento

### R5 — ELEMENT-LEVEL PROVENANCE

Pregunta:

> ¿Puede ASC preservar correctamente la procedencia cuando evidencia directa, descripción e interpretación conviven dentro de un mismo componente visual?

**Estado:** PROPUESTO / NO EJECUTADO.

---

**Registro final**

```
ID: ASC-R4-CONTRAST-001
R4: CLOSED
CONTRAST: VALIDATED
INITIAL: PARTIAL
TREATMENT: PROVENANCE PRESERVATION
CORRECTED: PASS WITH MINOR OBSERVATIONS
GENERALIZATION: INITIAL SUPPORT ONLY
RESIDUAL: ELEMENT-LEVEL PROVENANCE
NEXT: R5 — PROPOSED / NOT EXECUTED
```
