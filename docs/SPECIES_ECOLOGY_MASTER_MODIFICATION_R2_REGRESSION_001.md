# Árboris — Regresión dirigida de la propuesta R2 de modificación Master 2.0

**Estado:** prueba no normativa  
**Gate:** SPECIES-ECOLOGY-MASTER-MODIFICATION-R2-REGRESSION-001  
**Fecha:** 23 septiembre 2026  
**Objeto:** `SPECIES_ECOLOGY_MASTER_MODIFICATION_PROPOSAL_R2.md`  
**Cobertura:** A1–A10

## 1. Resultado

**VEREDICTO:** `PASS WITH OPEN`

La propuesta R2 corrige los defectos materiales A1–A10 detectados en la auditoría adversarial anterior.

No se autoriza todavía modificar el XLSX porque permanecen dos OPEN de autoridad:

1. valores/versiones exactas de versionado;
2. vocabulario territorial formal para distribución.

## 2. Regresión A1–A10

### A1 — autoridad de vocabulario controlado

R2 ya no propone constantes Python como autoridad primaria para:

- `dimension`;
- `estado`;
- `alcance_tipo`;
- `unidad`.

Los cuatro campos quedan ligados a:

```text
config/botanical/controlled_vocabularies.json
```

y el validador debe resolverlos desde esa especificación.

**Resultado:** PASS.

### A2 — checker de Data Validation

R2 incorpora `Ecologia_Especie` a `RECORD_KEYS` y define que la nueva hoja debe pasar por `check_controlled_vocabulary_dv.py`.

Además, reconoce el defecto de una hoja vacía y exige prueba temporal con una fila sintética o una mejora equivalente del checker.

**Resultado:** PASS WITH IMPLEMENTATION OPEN.

El diseño está resuelto; falta implementación ejecutable.

### A3 — firma semántica

R2 sustituye la firma genérica por firmas específicas por dimensión.

Casos:

- distribución: códigos normalizados;
- altitud: límites + unidad;
- fenología codificada: meses normalizados;
- fenología textual: texto normalizado sólo cuando no hay códigos;
- hábitat: texto normalizado sin equivalencias inventadas.

Así, dos expresiones distintas que codifican los mismos meses no producen hechos diferentes.

**Resultado:** PASS.

### A4 — falso conflicto altitudinal

R2 elimina:

```text
rango disjunto = contradicción botánica
```

y lo reemplaza por:

```text
múltiples hechos activos distintos
+ misma especie
+ mismo alcance
→ multiplicidad no resuelta
→ bloquear UX
→ revisión editorial
```

No se infiere que una fuente sea falsa.

**Resultado:** PASS.

### A5 — routing de lectura

R2 incorpora impacto explícito en `query_botanical.py`:

- añadir `species_ecology.json` a `CANONICAL_FILES`;
- añadir acceso `species_ecology`;
- añadir comando `ecology [species_id]`;
- incluir el noveno JSON en `stats`.

**Resultado:** PASS IN DESIGN.

### A6 — documentación incompleta

R2 amplía explícitamente la superficie a:

- `AGENTS.md`;
- `data/README.md`;
- `data/botanical/README.md`;
- `docs/START_HERE.md`;
- `docs/DATA_MODEL.md`;
- `docs/ARCHITECTURE.md`;
- `tools/botanical-data/README.md`;
- toda referencia explícita a “ocho JSON canónicos”.

**Resultado:** PASS.

### A7 — version bindings

R2 identifica que el cambio integrado debe actualizar:

- `schema_version`;
- `updated_at`;
- `controlled_vocabulary_spec_version`;
- versión del contrato de vocabulario cuando corresponda;
- bindings asociados en `Metadatos`.

No inventa números de versión.

**Resultado:** PASS WITH OPEN.

OPEN: política exacta para elegir los nuevos valores.

### A8 — hoja vacía y DV

R2 ya no considera suficiente:

```text
hoja vacía + checker sin filas = DV validada
```

Exige:

```text
copia temporal
→ fila sintética pendiente_revision
→ ejecutar DV checker
→ descartar copia
```

o una mejora del checker que verifique rangos vacíos.

**Resultado:** PASS.

### A9 — SQLite

R2 toma decisión explícita:

```text
species_ecology
NOT materialized
in reference SQLite schema v1
```

Se preserva el scope del prototipo actual.

Una incorporación futura requerirá gate propio.

**Resultado:** PASS.

### A10 — atomicidad

R2 redefine correctamente atomicidad:

Los pasos pueden existir separados dentro de una rama de migración, pero ningún estado es consolidable mientras no sean coherentes:

```text
XLSX
Diccionario_Campos
Exportar_JSON
controlled vocabulary spec
metadata
species_ecology.json
species-card.v3
validators
query routing
docs
tests
```

**Resultado:** PASS.

## 3. Prueba de no-regresión arquitectónica

Se conserva:

```text
ONE MASTER: PASS
ACE UNCHANGED: PASS
OBSERVATION MODEL UNCHANGED: PASS
SPECIES / OBSERVATION SEPARATION: PASS
ACE CONTEXT / ECOLOGY SEPARATION: PASS
NO SECOND SOURCE OF TRUTH: PASS
PARTIAL COVERAGE ALLOWED: PASS
NO UNSOURCED ECOLOGY: PASS
```

## 4. OPEN residuales

### O1 — versionado exacto

Está claro **qué bindings** deben cambiar.

No está resuelto todavía **qué valores exactos** deben asumir:

- `schema_version`;
- `controlled_vocabulary_spec_version`;
- `contract_version`;
- posible `master_version`.

No debe inventarse semver sin auditar la política vigente.

### O2 — vocabulario territorial

Existen códigos documentados en fuentes:

```text
ANT ATA COQ VAL RME LBO MAU NUB BIO ARA
```

pero todavía no existe contrato formal que establezca:

- namespace;
- lista completa o alcance piloto;
- significado exacto de cada código;
- autoridad;
- tratamiento de cambios administrativos;
- si la distribución debe usar regiones actuales, históricas o exactamente la notación de la fuente.

Por tanto:

```text
distribucion_geografica ACTIVE
→ BLOCKED
```

hasta resolver este gate.

## 5. AUDITORÍA

R2 pasa la regresión A1–A10.

El contrato de migración ya es internamente coherente y compatible con la arquitectura existente.

Los bloqueos restantes no son defectos de la propuesta R2: son decisiones de autoridad aún no resueltas.

## 6. INCONSISTENCIAS

No se detectan inconsistencias materiales nuevas.

## 7. VACÍOS / OMISIONES

Quedan únicamente como bloqueos previos a ejecución:

- política/versionado exacto;
- contrato territorial;
- implementación de tests descritos;
- autorización explícita para modificar el XLSX después de cerrar O1/O2.

## 8. REDUNDANCIAS

No se detectan nuevas redundancias.

## 9. Gate

```text
A1: PASS
A2: PASS WITH IMPLEMENTATION OPEN
A3: PASS
A4: PASS
A5: PASS IN DESIGN
A6: PASS
A7: PASS WITH OPEN
A8: PASS
A9: PASS
A10: PASS

R2 PROPOSAL REGRESSION: PASS WITH OPEN

VERSION POLICY GATE: REQUIRED
TERRITORIAL VOCABULARY GATE: REQUIRED
MASTER EXECUTION: BLOCKED
```

## 10. Próximo paso

Resolver primero el gate de versionado porque afecta metadata y vocabulario controlado, pero no requiere investigación botánica.

Luego resolver el vocabulario territorial.

Sólo cuando ambos pasen corresponde autorizar una rama de migración ejecutable del Master.
