# Árboris — Propuesta exacta de modificación Master 2.0 para ecología de especie

**Estado:** propuesta auditable; ejecución bloqueada  
**Gate:** SPECIES-ECOLOGY-MASTER-MODIFICATION-PROPOSAL-001  
**Fecha:** 23 septiembre 2026  
**Base:** SPECIES-ECOLOGY-MINIMUM-CONTRACT-R2-001 + SPECIES-ECOLOGY-R2-REGRESSION-001  
**Ámbito:** compilar los cambios exactos requeridos para incorporar `SpeciesEcologyFact` al Master Botánico 2.0 sin ejecutarlos todavía.

## 1. Decisión

La modificación propuesta agrega una única relación editorial nueva dentro del mismo Master:

```text
Ecologia_Especie
```

y una única salida canónica nueva:

```text
data/botanical/species_ecology.json
```

No modifica:

- `Especies_Piloto`;
- `Especie_Caracter`;
- ACE;
- `contexts.json`;
- `character_variability.json`;
- el modelo de Observation.

## 2. Nueva hoja: Ecologia_Especie

Cabecera exacta propuesta:

```text
ecology_fact_id
species_id
dimension
valor_texto
valor_codificado
valor_min
valor_max
unidad
alcance_tipo
alcance_valor
fuente_ids
estado
notas
```

Orden de columnas: exactamente el anterior.

## 3. Diccionario_Campos — filas a agregar

Agregar las siguientes definiciones para `Ecologia_Especie`:

| hoja | campo | json_tipo | nullable | relacion | descripcion |
| --- | --- | --- | --- | --- | --- |
| Ecologia_Especie | ecology_fact_id | string | No | PK | ID estable del hecho ecológico, formato ECO-0001. |
| Ecologia_Especie | species_id | string | No | FK -> Especies_Piloto.species_id | Especie canónica a la que aplica el hecho. |
| Ecologia_Especie | dimension | string | No | vocabulario controlado | Dimensión ecológica del hecho. |
| Ecologia_Especie | valor_texto | string | Sí |  | Formulación breve fiel a la fuente cuando corresponde. |
| Ecologia_Especie | valor_codificado | array<string> | No |  | Códigos normalizados; vacío cuando la dimensión no los usa. |
| Ecologia_Especie | valor_min | number | Sí |  | Límite inferior cuando corresponde. |
| Ecologia_Especie | valor_max | number | Sí |  | Límite superior cuando corresponde. |
| Ecologia_Especie | unidad | string | Sí | vocabulario controlado | Unidad del rango numérico. |
| Ecologia_Especie | alcance_tipo | string | Sí | vocabulario controlado | Tipo de alcance: geografico, poblacional o condicional. |
| Ecologia_Especie | alcance_valor | string | Sí |  | Restricción concreta del alcance. |
| Ecologia_Especie | fuente_ids | array<string> | No | FK[] -> Fuentes.fuente_id | Una o más fuentes que respaldan el mismo hecho. |
| Ecologia_Especie | estado | string | No | vocabulario controlado | activo, pendiente_revision o retirado. |
| Ecologia_Especie | notas | string | Sí |  | Aclaración editorial no computable. |

### 3.1 Decisión sobre arrays vacíos

`valor_codificado` se declara `nullable = No` para aprovechar la semántica ya implementada por `export_master.py`:

```text
celda vacía + array<string> no nullable
→ []
```

`fuente_ids` también se declara `nullable = No`, pero además debe validarse como **no vacío**.

## 4. Exportar_JSON — fila a agregar

Agregar una fila al final del plan activo, con el siguiente orden disponible:

| campo | valor |
| --- | --- |
| hoja | Ecologia_Especie |
| json_key | species_ecology |
| exportar | Sí |
| transformacion | filas -> array; valor_codificado/fuente_ids: split('|') |
| nota | Hechos ecológicos de especie con procedencia explícita. |

Regla de orden:

```text
orden = max(orden activo actual) + 1
```

No se fija un número literal en esta propuesta para evitar acoplarla al número de filas si el plan cambia antes de ejecutar.

## 5. Vocabulario mínimo de dimension

Valores permitidos R2:

```text
distribucion_geografica
rango_altitudinal
habitat
fenologia_floracion
fenologia_fructificacion
```

No se permiten otros valores sin nuevo gate.

## 6. Vocabularios auxiliares mínimos

### 6.1 estado

```text
activo
pendiente_revision
retirado
```

### 6.2 alcance_tipo

```text
geografico
poblacional
condicional
```

o null.

### 6.3 unidad

Para R2 sólo:

```text
m
```

o null.

### 6.4 meses

Para fenología codificada:

```text
01 02 03 04 05 06 07 08 09 10 11 12
```

### 6.5 territorio chileno

Antes de activar hechos de distribución debe existir un vocabulario controlado explícito.

Para las fuentes ya presentes, el conjunto candidato mínimo observado es:

```text
ANT ATA COQ VAL RME LBO MAU NUB BIO ARA
```

Este conjunto es candidato, no una lista nacional exhaustiva.

La implementación debe tratar cualquier código no autorizado como error.

## 7. Filas iniciales de ejemplo

Las siguientes filas son **fixtures de propuesta**, no contenido autorizado todavía. Deben permanecer `pendiente_revision` hasta verificación editorial directa.

### ECO-0001 — Mitique / altitud

```text
ecology_fact_id: ECO-0001
species_id: SP-004
dimension: rango_altitudinal
valor_texto: null
valor_codificado: []
valor_min: 0
valor_max: 2000
unidad: m
alcance_tipo: null
alcance_valor: null
fuente_ids: F-010
estado: pendiente_revision
notas: Ejemplo estructural derivado de señal ya registrada; activar sólo tras verificación directa.
```

### ECO-0002 — Colliguay / floración

```text
ecology_fact_id: ECO-0002
species_id: SP-005
dimension: fenologia_floracion
valor_texto: mayo a diciembre
valor_codificado: 05|06|07|08|09|10|11|12
valor_min: null
valor_max: null
unidad: null
alcance_tipo: null
alcance_valor: null
fuente_ids: F-014
estado: pendiente_revision
notas: Ejemplo estructural; mantener texto fuente junto con meses normalizados.
```

### ECO-0003 — Quillay / floración

```text
ecology_fact_id: ECO-0003
species_id: SP-006
dimension: fenologia_floracion
valor_texto: octubre a enero
valor_codificado: 10|11|12|01
valor_min: null
valor_max: null
unidad: null
alcance_tipo: null
alcance_valor: null
fuente_ids: F-019
estado: pendiente_revision
notas: Ejemplo estructural; el periodo cruza año calendario.
```

Estas filas sirven para probar el contrato. No constituyen autorización para poblar producción.

## 8. validate_master_export.py — cambios requeridos

Agregar:

```python
ALLOWED_ECOLOGY_DIMENSIONS = {
    "distribucion_geografica",
    "rango_altitudinal",
    "habitat",
    "fenologia_floracion",
    "fenologia_fructificacion",
}

ALLOWED_ECOLOGY_STATUS = {
    "activo",
    "pendiente_revision",
    "retirado",
}

ALLOWED_SCOPE_TYPES = {
    "geografico",
    "poblacional",
    "condicional",
}

ALLOWED_ECOLOGY_UNITS = {"m"}

ALLOWED_MONTH_CODES = {
    "01", "02", "03", "04", "05", "06",
    "07", "08", "09", "10", "11", "12",
}
```

El vocabulario territorial debe provenir de especificación explícita. Mientras no exista, los hechos de `distribucion_geografica` no deben pasar a `activo`.

## 9. Validación específica propuesta

Agregar una función conceptual:

```python
validate_species_ecology(
    ecology_records,
    *,
    species_id_set,
    source_id_set,
    errors,
    warnings,
)
```

Debe comprobar por fila:

### E1 — ID

```text
^ECO-\d{4}$
```

y unicidad global.

### E2 — FK especie

`species_id` debe existir.

### E3 — dimensión

Debe pertenecer a `ALLOWED_ECOLOGY_DIMENSIONS`.

### E4 — fuentes

`fuente_ids`:

- debe ser array;
- no vacío;
- sin duplicados;
- todas las fuentes deben existir.

### E5 — estado

Debe pertenecer a `ALLOWED_ECOLOGY_STATUS`.

### E6 — alcance

Reglas:

```text
alcance_tipo null ↔ alcance_valor null
```

Si uno existe y el otro no, error.

### E7 — payload genérico

Debe existir al menos uno de:

```text
valor_texto no vacío
valor_codificado no vacío
valor_min
valor_max
```

### E8 — rango altitudinal

Para `rango_altitudinal`:

- al menos `valor_min` o `valor_max`;
- si ambos: min <= max;
- `unidad == "m"`;
- `valor_codificado == []`.

### E9 — fenología

Para `fenologia_floracion` y `fenologia_fructificacion`:

- si `valor_codificado` no está vacío, todos los valores deben ser meses permitidos;
- meses duplicados = error;
- `valor_min`, `valor_max`, `unidad` deben ser null.

### E10 — distribución

Para `distribucion_geografica`:

- `valor_codificado` debe ser no vacío cuando el hecho se pretenda activar;
- cada código debe pertenecer al vocabulario territorial autorizado;
- rango numérico y unidad deben ser null.

Hasta formalizar ese vocabulario:

```text
estado activo + distribucion_geografica
→ error
```

### E11 — hábitat

Para `habitat`:

- `valor_texto` debe ser no vacío;
- rango numérico y unidad deben ser null.

`valor_codificado` debe permanecer vacío en R2.

## 10. Firma semántica

Para registros `activo` y `pendiente_revision`, construir una firma normalizada:

```python
(
    species_id,
    dimension,
    normalized(valor_texto),
    tuple(sorted(valor_codificado)),
    valor_min,
    valor_max,
    unidad,
    alcance_tipo,
    normalized(alcance_valor),
)
```

Dos filas con la misma firma:

```text
→ error: ECOLOGY_DUPLICATE_FACT
```

La diferencia de `fuente_ids` no hace distintos a dos hechos.

## 11. Conflictos deterministas

Primera versión del validador debe detectar como mínimo:

### C1 — rangos altitudinales disjuntos bajo mismo alcance

Dos hechos activos de `rango_altitudinal` para la misma especie y alcance, cuyos rangos sean completamente disjuntos:

```text
→ ECOLOGY_CONFLICT
```

No intentar fusionarlos.

### C2 — conjuntos fenológicos distintos

No marcar automáticamente como conflicto dos conjuntos de meses diferentes; podrían representar variación poblacional o fuentes de distinta cobertura.

Si mismo alcance y no son iguales:

```text
→ warning: ECOLOGY_POSSIBLE_CONFLICT
```

hasta contar con política más rica.

### C3 — texto libre de hábitat

No intentar decidir incompatibilidad semántica automáticamente.

Múltiples hechos activos de hábitat son permitidos si no son duplicados exactos.

## 12. Integración en validate_master_export.py

Después de cargar datasets:

```python
species_ecology = datasets.get("species_ecology", [])
```

Después de construir `species_id_set` y `source_id_set`:

```python
validate_species_ecology(
    species_ecology,
    species_id_set=species_id_set,
    source_id_set=source_id_set,
    errors=errors,
    warnings=warnings,
)
```

El reporte debe añadir:

```text
Hechos ecológicos: <n>
  activos: <n>
  pendientes: <n>
  retirados: <n>
```

## 13. build_species_data.py — cambio propuesto

Cuando la capa se adopte:

Agregar a `REQUIRED_FILES`:

```python
"species_ecology": "species_ecology.json",
```

y validar que sea array.

En `build_species_view(...)` agregar parámetro:

```python
species_ecology
```

filtrar:

```python
species_ecology_facts = [
    fact
    for fact in species_ecology
    if fact.get("species_id") == species_id
]
```

Incluir sólo hechos `activo` en la vista destinada a consumo de producto:

```python
"ecology": [
    fact for fact in species_ecology_facts
    if fact.get("estado") == "activo"
],
```

Los pendientes/retirados permanecen en el JSON canónico para trazabilidad, pero no en la ficha de consumo.

## 14. Fuentes de ficha por especie

`used_source_ids` debe incorporar todos los `fuente_ids` de hechos ecológicos activos incluidos en la ficha.

Así, `sources` continúa siendo una vista autocontenida de las fuentes efectivamente utilizadas por la ficha.

## 15. validate_species_data.py — cambio propuesto

Agregar `species_ecology.json` a `CANONICAL_FILES`.

Para cada especie:

```python
expected_ecology = [
    fact
    for fact in species_ecology
    if fact.get("species_id") == species_id
    and fact.get("estado") == "activo"
]
```

y comparar exactamente:

```python
card.get("ecology")
vs.
expected_ecology
```

También agregar sus `fuente_ids` a `used_source_ids`.

## 16. Versión de view_schema

Agregar `ecology` cambia la forma de las fichas.

Por tanto:

```text
arboris.species-card.v2
→ arboris.species-card.v3
```

sólo cuando se ejecute la modificación.

No cambiar durante fase propuesta.

## 17. Documentación que requerirá actualización

Si se adopta, deben cambiar como mínimo:

- `data/README.md`;
- `data/botanical/README.md`;
- `docs/DATA_MODEL.md`;
- `docs/ARCHITECTURE.md`;
- `tools/botanical-data/README.md`.

Cambios semánticos:

```text
8 JSON canónicos
→ 9 JSON canónicos
```

y aparición explícita de `SpeciesEcologyFact`.

No modificar todavía estos documentos normativos.

## 18. package / scripts

No se requiere nuevo comando si:

```text
build:botanical
verify:botanical
```

ya encadenan los scripts existentes.

La ampliación debe entrar en esos mismos flujos.

## 19. Orden de ejecución si la propuesta se aprueba

```text
1. backup/versionado del XLSX actual
2. agregar hoja Ecologia_Especie vacía
3. agregar contrato a Diccionario_Campos
4. agregar entrada a Exportar_JSON
5. incrementar schema_version
6. extender validate_master_export.py
7. exportar con cero hechos o fixtures pendientes
8. verificar exportación
9. extender build_species_data.py
10. extender validate_species_data.py
11. regenerar fichas
12. ejecutar verify:botanical
13. auditar diff completo
14. recién después poblar hechos verificados
```

No se recomienda poblar datos reales en el mismo paso que introduce el esquema. Separar:

```text
SCHEMA CHANGE
→ VALIDATE EMPTY CONTRACT
→ DATA POPULATION
```

reduce el riesgo de mezclar errores de estructura con errores botánicos.

## 20. Versionado

La incorporación de una nueva salida canónica y un nuevo campo de vista constituye cambio de esquema.

Propuesta:

```text
master_version
→ permanece ligada al contenido editorial según política vigente

schema_version
→ incremento requerido
```

El número exacto de nueva versión debe seguir la política de versionado vigente del Master; esta propuesta no lo inventa.

## 21. AUDITORÍA INTERNA

La propuesta:

- mantiene una sola fuente editorial;
- no introduce un segundo motor;
- preserva procedencia multifuente;
- no mezcla ecología de especie con observación;
- usa tipos ya soportados por el exportador;
- identifica exactamente dónde se requieren cambios de validación y vistas;
- permite introducir primero el esquema vacío;
- mantiene bloqueado el poblamiento no verificado.

## 22. INCONSISTENCIAS

No se detecta incompatibilidad con el pipeline actual.

Existe un cambio contractual inevitable:

```text
8 → 9 JSON canónicos
species-card.v2 → v3
```

Debe ocurrir atómicamente cuando se ejecute, no parcialmente.

## 23. VACÍOS / OMISIONES

Permanecen OPEN antes de ejecutar:

- vocabulario territorial formal;
- política exacta de schema_version;
- pruebas unitarias exactas del nuevo validador;
- decisión de si fixtures pendientes se incorporan o la hoja nace vacía;
- revisión adversarial de esta propuesta;
- aprobación explícita para modificar el XLSX.

## 24. REDUNDANCIAS

No se propone ningún artefacto paralelo al Master.

`species_ecology.json` es derivado, igual que los otros JSON.

## 25. Gate

```text
EXACT SCHEMA PROPOSAL: COMPILED
EXPORT COMPATIBILITY: PASS
VALIDATOR CHANGE SURFACE: DEFINED
SPECIES VIEW IMPACT: DEFINED
DOC IMPACT: DEFINED
MIGRATION ORDER: DEFINED
MASTER EXECUTION: BLOCKED
ADVERSARIAL AUDIT OF PROPOSAL: REQUIRED
```
