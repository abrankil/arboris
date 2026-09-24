# Árboris — Regresión dirigida R2 del contrato mínimo de ecología de especie

**Estado:** prueba no normativa  
**Gate:** SPECIES-ECOLOGY-R2-REGRESSION-001  
**Fecha:** 23 septiembre 2026  
**Objeto:** SPECIES_ECOLOGY_MINIMUM_CONTRACT_R2_CANDIDATE.md  
**Cobertura:** N1–N10 + ejemplos reales verificados

## 1. Resultado

**VEREDICTO:** `PASS WITH OPEN`

R2 resuelve los defectos materiales de R1 sin introducir cambios de arquitectura, ACE o Observation.

## 2. Regresión N1–N10

### N1 — valor polimórfico

R2 separa:

```text
valor_texto
valor_codificado
valor_min
valor_max
unidad
```

**Resultado:** PASS.

### N2 — duplicación semántica

R2 define una firma semántica independiente de `ecology_fact_id`.

Dos hechos activos con el mismo:

```text
species_id
dimension
normalized payload
alcance_tipo
alcance_valor
```

son duplicados.

**Resultado:** PASS.

### N3 — múltiples fuentes

`fuente_ids: array<string>` permite corroboración sin duplicar hechos.

**Resultado:** PASS.

### N4 — conflictos

R2 impide elegir automáticamente una fuente ganadora y bloquea para UX hechos materialmente incompatibles bajo el mismo alcance.

**Resultado:** PASS WITH OPEN.

OPEN: detección semántica automática para texto libre.

### N5 — confianza editorial

La escala `alta/media/baja` fue eliminada.

Autoridad queda expresada mediante:

```text
fuente
+ verificación editorial
+ estado
+ ausencia de conflicto
```

**Resultado:** PASS.

### N6 — alcance

R2 separa:

```text
alcance_tipo
alcance_valor
```

con tipos iniciales geográfico / poblacional / condicional.

**Resultado:** PASS WITH OPEN.

OPEN: vocabulario futuro del valor de alcance.

### N7 — fenología

Meses explícitos se normalizan a `01..12`.

Expresiones estacionales no se convierten sin regla adicional.

**Resultado:** PASS.

### N8 — distribución geográfica

R2 exige vocabulario territorial controlado antes de activar hechos codificados.

Las fuentes UdeC ya utilizan códigos como COQ, VAL, RME, LBO, MAU, NUB, BIO, ARA.

**Resultado:** PASS WITH OPEN.

OPEN: formalización completa del vocabulario territorial y su autoridad.

### N9 — habitat vs afinidad_ambiental

`afinidad_ambiental` fue retirada del núcleo mínimo.

**Resultado:** PASS.

### N10 — compatibilidad del exportador

R2 utiliza únicamente:

```text
string
array<string>
number
```

tipos ya soportados por `export_master.py`.

La nueva lógica requerida corresponde a validación específica, no transformación especial.

**Resultado:** PASS.

## 3. Prueba con ejemplos reales

Los siguientes casos fueron verificados directamente contra las fuentes registradas. Se usan para probar forma y reglas. No se insertan todavía en el Master.

### 3.1 Mitique — SP-004

Fuente F-010 / Catálogo de Plantas UdeC:

```text
Distribución:
COQ, VAL, RME, LBO, MAU, NUB

Rango altitudinal:
0–2000 m
```

R2 puede representarlos como dos hechos independientes:

- `distribucion_geografica` con códigos;
- `rango_altitudinal` con mínimo, máximo y unidad.

Fuente F-011 / SAG:

```text
Florece en primavera.
```

R2 preserva “primavera” en `valor_texto` y NO la convierte a meses.

**Resultado Mitique:** PASS.

### 3.2 Colliguay — SP-005

Fuente F-013 / Catálogo de Plantas UdeC:

```text
Distribución:
ANT, ATA, COQ, VAL, RME, LBO, MAU, BIO

Rango altitudinal:
0–1300 m
```

Fuente F-014 / SAG:

```text
Florece de mayo a diciembre.
```

Normalización fenológica segura:

```json
["05","06","07","08","09","10","11","12"]
```

sin eliminar `valor_texto = "mayo a diciembre"`.

**Resultado Colliguay:** PASS.

### 3.3 Quillay — SP-006

Fuente F-016 / Catálogo de Plantas UdeC:

```text
Distribución:
COQ, VAL, RME, LBO, MAU, NUB, BIO, ARA

Rango altitudinal:
10–2000 m
```

Fuente F-019 / CONAF:

```text
florece de octubre a enero
```

Normalización:

```json
["10","11","12","01"]
```

La expansión cruza correctamente el año calendario sin transformar el dato en un intervalo numérico ambiguo.

**Resultado Quillay:** PASS.

## 4. Prueba de duplicado

Entrada A:

```text
SP-006 / rango_altitudinal / 10 / 2000 / m / F-016
```

Entrada B:

```text
SP-006 / rango_altitudinal / 10 / 2000 / m / F-999
```

Si ambas describen el mismo alcance, la firma semántica coincide.

Resultado esperado:

```text
NO TWO FACTS
→ merge source IDs into one fact
```

**Resultado:** PASS.

## 5. Prueba de corroboración

Si F-A y F-B afirman el mismo periodo:

```text
SP-005
fenologia_floracion
05–12
```

R2 permite:

```json
"fuente_ids": ["F-A", "F-B"]
```

sin duplicar el hecho.

**Resultado:** PASS.

## 6. Prueba de conflicto

Caso sintético:

Fuente A:

```text
SP-X / rango_altitudinal / 0–1300 m
```

Fuente B, mismo alcance:

```text
SP-X / rango_altitudinal / 1800–2500 m
```

R2 no concatena, promedia ni elige automáticamente.

Resultado esperado:

```text
CONFLICT
→ UX BLOCKED
→ editorial review
```

**Resultado:** PASS.

## 7. Prueba Species vs Observation

Hecho canónico:

```text
SP-006 ocurre documentadamente entre 10–2000 m
```

Observación:

```text
OBS-123 registrada a 620 m
```

R2 no copia 620 m al conocimiento de especie y no reemplaza el rango de especie por una observación.

**Resultado:** PASS.

## 8. Prueba ACE context vs Species ecology

`hojas_de_sombra` sigue siendo contexto de variabilidad de ACE.

No se transforma en:

```text
SP-X habitat = sombra densa de dosel
```

**Resultado:** PASS.

## 9. AUDITORÍA

R2 resuelve N1–N10 dentro del alcance candidato.

Los ejemplos reales confirman que el contrato puede representar:

- distribución codificada;
- rango altitudinal;
- fenología mensual;
- fenología estacional no normalizada artificialmente.

No se requiere alterar `export_master.py`.

## 10. INCONSISTENCIAS

No se detectan inconsistencias materiales nuevas.

La única tensión persistente es que `habitat` continúa siendo texto libre. Eso es aceptable para R2 porque se declara explícitamente como dimensión no normalizada y no se usa todavía para filtros automáticos.

## 11. VACÍOS / OMISIONES

Permanecen OPEN:

- vocabulario territorial formal completo;
- ontología de hábitat;
- conflictos semánticos de texto libre;
- distribución histórica vs actual;
- fenología por población;
- cobertura suficiente para Peumo, Litre y Bollén;
- interoperabilidad externa.

## 12. REDUNDANCIAS

No se detectan nuevas redundancias.

## 13. Gate

```text
N1: PASS
N2: PASS
N3: PASS
N4: PASS WITH OPEN
N5: PASS
N6: PASS WITH OPEN
N7: PASS
N8: PASS WITH OPEN
N9: PASS
N10: PASS

REAL MITIQUE TEST: PASS
REAL COLLIGUAY TEST: PASS
REAL QUILLAY TEST: PASS

R2 REGRESSION: PASS WITH OPEN
MASTER MODIFICATION DESIGN: AUTHORIZED
MASTER MODIFICATION EXECUTION: NOT YET AUTHORIZED
```

## 14. Próximo paso

Compilar la modificación exacta propuesta para Master 2.0:

- nueva hoja `Ecologia_Especie`;
- filas de `Diccionario_Campos`;
- fila de `Exportar_JSON`;
- reglas nuevas de `validate_master_export.py`;
- impacto esperado sobre documentación y fichas derivadas.

La propuesta debe ser auditable antes de tocar el XLSX.
