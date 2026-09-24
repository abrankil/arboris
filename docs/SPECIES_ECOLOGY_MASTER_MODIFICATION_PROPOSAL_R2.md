# Árboris — Propuesta corregida R2 de modificación Master 2.0 para ecología de especie

**Estado:** propuesta corregida auditable; ejecución bloqueada  
**Gate:** SPECIES-ECOLOGY-MASTER-MODIFICATION-PROPOSAL-R2-001  
**Fecha:** 23 septiembre 2026  
**Deriva de:** SPECIES-ECOLOGY-MASTER-MODIFICATION-ADV-001  
**Ámbito:** cerrar las omisiones de integración de la propuesta 001 sin modificar todavía el XLSX ni datos normativos.

## 1. Núcleo conservado

Se mantiene:

```text
Master único
→ hoja Ecologia_Especie
→ species_ecology.json
→ fichas por especie v3
```

No se modifica ACE ni el modelo de Observation.

## 2. Cabecera de Ecologia_Especie

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

## 3. Autoridad de vocabularios

Los campos:

```text
Ecologia_Especie.dimension
Ecologia_Especie.estado
Ecologia_Especie.alcance_tipo
Ecologia_Especie.unidad
```

deben incorporarse a:

```text
config/botanical/controlled_vocabularies.json
```

No se crean listas paralelas como autoridad primaria en `validate_master_export.py`.

El validador puede resolver estos valores mediante `resolve_field(...)`.

Valores candidatos:

```text
dimension:
  distribucion_geografica
  rango_altitudinal
  habitat
  fenologia_floracion
  fenologia_fructificacion

estado:
  activo
  pendiente_revision
  retirado

alcance_tipo:
  geografico
  poblacional
  condicional
  + nullable

unidad:
  m
  + nullable
```

La ampliación del scope exige incrementar:

```text
controlled_vocabulary_spec_version
contract_version
```

según la política de versionado que se resuelva antes de ejecutar.

Los bindings correspondientes en `Metadatos` deben actualizarse en el mismo cambio.

## 4. Data Validation del XLSX

`check_controlled_vocabulary_dv.py` debe añadir:

```python
RECORD_KEYS = {
    "Especie_Caracter": ("species_id", "caracter_id"),
    "Ecologia_Especie": ("ecology_fact_id",),
}
```

y comprobar los cuatro campos gobernados de la nueva hoja.

### 4.1 Hoja inicialmente vacía

Como el checker actual sólo valida filas de registro, el gate de migración debe utilizar una copia temporal del workbook:

```text
copy Master candidate
→ insert synthetic pending-review row
→ run DV checker
→ discard copy
```

La fila sintética no se persiste en el Master canónico.

Alternativamente puede evolucionarse el checker para inspeccionar rangos de DV vacíos. Esa alternativa requiere gate propio.

## 5. Diccionario_Campos y Exportar_JSON

Se conserva la propuesta 001 para tipos y relaciones.

`valor_codificado` y `fuente_ids` son `array<string>` no-nullable.

`fuente_ids` debe ser además no vacío por validación específica.

`Exportar_JSON` agrega:

```text
Ecologia_Especie
→ species_ecology
→ Sí
→ filas -> array; valor_codificado/fuente_ids: split('|')
```

## 6. Firma semántica por dimensión

No existe una firma genérica única.

### 6.1 distribucion_geografica

```text
species_id
dimension
sorted(valor_codificado)
alcance_tipo
normalized(alcance_valor)
```

`valor_texto` no altera identidad si existen códigos.

### 6.2 rango_altitudinal

```text
species_id
dimension
valor_min
valor_max
unidad
alcance_tipo
normalized(alcance_valor)
```

### 6.3 fenología con meses codificados

```text
species_id
dimension
sorted(valor_codificado)
alcance_tipo
normalized(alcance_valor)
```

El texto fuente se preserva, pero no diferencia el hecho.

### 6.4 fenología sin meses codificados

Cuando sólo existe una formulación como “primavera”:

```text
species_id
dimension
normalized(valor_texto)
alcance_tipo
normalized(alcance_valor)
```

### 6.5 habitat

```text
species_id
dimension
normalized(valor_texto)
alcance_tipo
normalized(alcance_valor)
```

La normalización debe limitarse a espacios/casefold; no se permite equivalencia semántica inventada.

## 7. Multiplicidad y conflicto

### 7.1 Altitud

La disyunción de rangos no se interpreta automáticamente como contradicción botánica.

Regla editorial más segura:

```text
>1 active rango_altitudinal
for same species + same scope
with different semantic signature
→ ECOLOGY_UNRESOLVED_MULTIPLE_FACTS
→ block UX eligibility
→ editorial resolution
```

El error describe multiplicidad canónica no resuelta, no falsedad de una fuente.

### 7.2 Distribución

Misma regla para más de un hecho activo distinto bajo el mismo alcance cuando la UX espere una única distribución consolidada.

### 7.3 Fenología

Múltiples hechos diferentes pueden coexistir.

Si comparten mismo alcance:

```text
→ warning: ECOLOGY_MULTIPLE_PHENOLOGY_FACTS
```

No unir meses automáticamente.

### 7.4 Hábitat

Múltiples hechos distintos están permitidos.

No inferir incompatibilidad semántica.

## 8. Validación específica

Además del vocabulario central, `validate_species_ecology(...)` debe comprobar:

- formato y unicidad de `ECO-xxxx`;
- FK de especie;
- `fuente_ids` no vacío, único y válido;
- reglas de payload por dimensión;
- meses `01..12`;
- vocabulario territorial explícito;
- coherencia de alcance;
- firmas semánticas por dimensión;
- multiplicidad activa no resuelta;
- ausencia de fila ≠ ausencia ecológica.

Los meses y códigos territoriales son vocabularios de payload, no vocabularios de campo equivalentes a `dimension`.

## 9. Vocabulario territorial

La distribución activa continúa bloqueada hasta formalizar el vocabulario.

El conjunto observado:

```text
ANT ATA COQ VAL RME LBO MAU NUB BIO ARA
```

es evidencia de uso en fuentes registradas, no definición completa del sistema territorial.

No se activa ninguna fila de distribución antes del gate correspondiente.

## 10. Metadata y version bindings

El cambio de esquema debe actualizar en el mismo estado integrado:

```text
schema_version
updated_at
controlled_vocabulary_spec_version
```

y cualquier binding contractual asociado.

`master_version` sólo cambia si la política editorial vigente determina que la incorporación del nuevo dominio constituye nueva versión de contenido.

El número exacto de las nuevas versiones permanece bloqueado hasta resolver esa política. No se inventa en R2.

## 11. build_species_data.py

Agregar `species_ecology.json` a los datasets requeridos.

La ficha v3 incorpora:

```text
ecology = active ecology facts for species
```

y agrega todas sus `fuente_ids` a `used_source_ids`.

`species-card.v2` pasa a `species-card.v3` sólo en el estado integrado completo.

## 12. validate_species_data.py

Debe reproducir exactamente:

```text
active species ecology facts
+ corresponding source closure
```

y exigir `arboris.species-card.v3`.

## 13. query_botanical.py

Debe dejar de asumir ocho archivos.

Agregar:

```text
species_ecology.json
```

a `CANONICAL_FILES`.

Agregar propiedad de store:

```python
species_ecology
```

y como mínimo un comando:

```text
ecology [species_id]
```

`stats` debe incluir:

```text
counts.species_ecology
canonical_json_bytes including species_ecology.json
```

Actualizar `test_query_botanical.py`.

Esto preserva el principio:

```text
route first
→ read minimum authority
```

para preguntas ecológicas.

## 14. Reference SQLite

Decisión R2:

```text
species_ecology is NOT materialized in reference SQLite schema v1
```

Razón: ese prototipo mide consultas del motor/reference path actual y ya tiene scope parcial sobre los datasets canónicos.

Debe documentarse explícitamente en `tools/botanical-data/README.md` y/o `DATA_ACCESS_PERFORMANCE.md`.

Una futura inclusión en SQLite requiere un gate de necesidad/rendimiento; no bloquea la incorporación editorial.

## 15. Gate botánico

`verify:botanical` debe comprobar también el contrato de DV si la nueva hoja usa vocabularios gobernados.

Propuesta:

```text
validate_master_export.py
→ check_controlled_vocabulary_dv.py
→ validate_species_ids.py
→ validate_species_data.py
```

Si se decide no modificar el script npm, debe existir un gate CI equivalente obligatorio. No dejar la comprobación sólo como procedimiento manual.

## 16. Documentación/routing afectado

Revisar y actualizar en el mismo cambio integrado:

- `AGENTS.md`;
- `data/README.md`;
- `data/botanical/README.md`;
- `docs/START_HERE.md`;
- `docs/DATA_MODEL.md`;
- `docs/ARCHITECTURE.md`;
- `tools/botanical-data/README.md`;
- referencias explícitas a “ocho JSON canónicos”.

## 17. Tests mínimos nuevos

Deben existir pruebas para:

1. `ECO-xxxx` inválido;
2. especie inexistente;
3. fuente inexistente;
4. `fuente_ids=[]`;
5. vocabulario de dimensión inválido;
6. payload inválido por dimensión;
7. altitud min > max;
8. unidad incorrecta;
9. mes inválido;
10. mes duplicado;
11. distribución activa sin vocabulario territorial aprobado;
12. duplicate fact con texto diferente pero mismos meses;
13. duplicate fact con fuentes distintas;
14. multiplicidad altitudinal activa no resuelta;
15. múltiples hábitats permitidos;
16. scope medio completo o completamente null;
17. ficha v3 sólo incluye hechos activos;
18. source closure de ficha;
19. query `ecology SP-xxx`;
20. stats incluye el noveno JSON.

## 18. Orden corregido de migración

```text
A. resolver version bindings
B. extender controlled_vocabularies.json
C. extender checker DV + tests
D. modificar copia candidata del XLSX
E. probar DV con fila sintética temporal
F. agregar Ecologia_Especie vacía al XLSX definitivo candidato
G. agregar Diccionario_Campos + Exportar_JSON
H. actualizar metadata/version bindings
I. extender validate_master_export.py
J. exportar species_ecology.json = []
K. extender build/validate species cards
L. extender query_botanical + tests
M. actualizar routing/docs
N. run build:botanical
O. run verify:botanical
P. run verify:data-access
Q. run full npm test
R. auditar diff integrado
S. recién después abrir DATA POPULATION gate
```

## 19. Atomicidad

Los pasos pueden ejecutarse secuencialmente en una rama de migración.

Pero ningún estado se considera consolidable hasta que simultáneamente sean coherentes:

```text
XLSX
schema dictionary
export map
controlled vocabulary spec
metadata bindings
9 JSON derivados
species-card.v3
validators
query routing
docs
tests
```

## 20. Gate R2

```text
CONTROLLED VOCABULARY AUTHORITY: RESOLVED IN DESIGN
DV CHECK SURFACE: RESOLVED IN DESIGN
SEMANTIC SIGNATURE: RESOLVED IN DESIGN
ALTITUDE FALSE-CONFLICT: RESOLVED IN DESIGN
QUERY ROUTING IMPACT: RESOLVED IN DESIGN
SQLITE SCOPE: RESOLVED IN DESIGN
VERSION VALUES: OPEN
TERRITORIAL VOCABULARY: OPEN
MASTER EXECUTION: BLOCKED
R2 PROPOSAL REGRESSION: REQUIRED
```
