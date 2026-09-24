# Árboris — Contrato mínimo de ecología de especie R2

**Estado:** candidato corregido, no normativo  
**Gate:** SPECIES-ECOLOGY-MINIMUM-CONTRACT-R2-001  
**Fecha:** 23 septiembre 2026  
**Deriva de:** SPECIES-ECOLOGY-MINIMUM-CONTRACT-ADV-001  
**Ámbito:** contrato editorial/exportable; no modifica todavía Master 2.0, ACE ni runtime.

## 1. Decisión conservada

Se mantiene una hoja relacional dentro del mismo Master:

```text
Ecologia_Especie
```

con salida derivada:

```text
species_ecology.json
```

No se añaden columnas ecológicas simples a `Especies_Piloto`.

## 2. Unidad: SpeciesEcologyFact

Una fila representa **un hecho ecológico normalizado**, no una fuente.

Varias fuentes pueden respaldar el mismo hecho.

```text
Species
+ Dimension
+ Normalized Payload
+ Scope
→ one ecological fact
        ↑
   one or more sources
```

## 3. Contrato R2

| campo | tipo JSON | nullable | regla |
| --- | --- | --- | --- |
| `ecology_fact_id` | string | No | PK estable, formato `ECO-xxxx` |
| `species_id` | string | No | FK a especie canónica |
| `dimension` | string | No | vocabulario controlado |
| `valor_texto` | string | Sí | formulación breve fiel a fuente cuando la dimensión no es puramente codificada |
| `valor_codificado` | array<string> | Sí | códigos normalizados cuando existe vocabulario |
| `valor_min` | number | Sí | mínimo numérico |
| `valor_max` | number | Sí | máximo numérico |
| `unidad` | string | Sí | unidad controlada para rango |
| `alcance_tipo` | string | Sí | geográfico / poblacional / condicional |
| `alcance_valor` | string | Sí | alcance preservado sin inferencia adicional |
| `fuente_ids` | array<string> | No | una o más FKs a Fuentes |
| `estado` | string | No | activo / pendiente_revision / retirado |
| `notas` | string | Sí | aclaración editorial no computable |

Se elimina `confianza` de R1.

La autoridad se expresa mediante fuente, estado editorial y reglas de validación; no mediante una escala subjetiva agregada.

## 4. Dimensiones R2

Núcleo mínimo:

```text
distribucion_geografica
rango_altitudinal
habitat
fenologia_floracion
fenologia_fructificacion
```

`afinidad_ambiental` sale del núcleo hasta existir una definición que no se solape con `habitat`.

## 5. Payload permitido por dimensión

### 5.1 distribucion_geografica

Usa:

```text
valor_codificado: array<string>
```

Para Chile, el primer vocabulario candidato son códigos regionales ya presentes en fuentes del Master, por ejemplo:

```text
ANT ATA COQ VAL RME LBO MAU NUB BIO ARA
```

La lista exacta y su autoridad deben formalizarse antes de implementación.

`valor_texto` puede preservar una formulación fuente cuando el alcance no pueda expresarse únicamente con códigos.

### 5.2 rango_altitudinal

Usa:

```text
valor_min
valor_max
unidad = m
```

Reglas:

- al menos un límite debe existir;
- si ambos existen, `min <= max`;
- no fabricar un límite ausente;
- `valor_texto` puede conservar “sobre 1200 m” u otra formulación cuando ayude a trazabilidad.

### 5.3 habitat

Usa principalmente:

```text
valor_texto
```

R2 no intenta todavía construir una ontología de hábitats.

La cadena debe ser breve y fiel a fuente.

Normalización futura de hábitat queda `OPEN`.

### 5.4 fenologia_floracion / fenologia_fructificacion

Usa preferentemente:

```text
valor_codificado: array<string>
```

con meses ISO:

```text
01 02 03 04 05 06 07 08 09 10 11 12
```

Un rango que cruza año se expande como conjunto de meses.

Ejemplo:

```text
octubre-enero
→ ["10", "11", "12", "01"]
```

Sólo se realiza esta expansión cuando la fuente expresa meses inequívocos.

Expresiones estacionales como “primavera” permanecen en `valor_texto` hasta existir una regla territorial/hemisférica explícita. No se convierten automáticamente a meses.

## 6. Procedencia multifuente

`fuente_ids` es obligatorio y no vacío.

Regla:

```text
one normalized fact
→ many supporting sources allowed
```

Esto evita duplicar hechos sólo para representar corroboración.

Cada fuente debe existir en `Fuentes`.

## 7. Identidad semántica y duplicados

Para registros activos, el validador construirá una firma semántica a partir de:

```text
species_id
dimension
normalized payload
alcance_tipo
alcance_valor
```

Dos filas activas con la misma firma constituyen duplicado, aunque tengan IDs diferentes.

Las fuentes deben fusionarse en `fuente_ids` de una única fila.

`ecology_fact_id` no define por sí solo unicidad semántica.

## 8. Conflictos entre fuentes/hechos

R2 no intenta decidir automáticamente qué fuente “gana”.

Dos hechos activos de la misma especie y dimensión pueden coexistir sólo si:

- tienen distinto alcance; o
- representan afirmaciones compatibles; o
- existe revisión editorial que determine que no son mutuamente excluyentes.

Si dos hechos activos son materialmente incompatibles bajo el mismo alcance:

```text
→ validator reports conflict
→ affected facts cannot feed UX
→ editorial resolution required
```

No se promedia, concatena ni elige automáticamente.

La detección perfecta de conflicto semántico en texto libre queda `OPEN`; para rangos, códigos y meses puede implementarse de forma determinista.

## 9. Estado editorial

```text
activo
pendiente_revision
retirado
```

Para pasar a `activo`:

- debe existir al menos una fuente;
- el payload debe cumplir la regla de la dimensión;
- la afirmación debe haberse verificado contra la fuente;
- no puede existir conflicto material no resuelto conocido en el mismo alcance.

Sólo `activo` es elegible para UX.

## 10. Alcance

`alcance_tipo` permite:

```text
geografico
poblacional
condicional
```

`alcance_valor` conserva la restricción concreta.

Si no existe alcance especial, ambos quedan null.

No se usa `alcance` para duplicar distribución ordinaria de la especie.

## 11. Null y ausencia

```text
NO FACT
→ conocimiento no documentado

NULL FIELD
→ campo no usado para esa dimensión
```

Nunca:

```text
NO FACT = ausencia ecológica
```

## 12. Separaciones obligatorias

```text
SpeciesEcologyFact
≠ Observation context

SpeciesEcologyFact
≠ ACE context

SpeciesEcologyFact
≠ CharacterEvidence
```

Una observación no hereda hechos de especie.

ACE no consume `species_ecology.json` sin gate posterior específico.

## 13. Reglas de integridad R2

El validador debe comprobar:

1. formato y unicidad de `ecology_fact_id`;
2. existencia de `species_id`;
3. dimensión permitida;
4. payload válido para la dimensión;
5. `fuente_ids` no vacío y todas las FKs válidas;
6. estado permitido;
7. coherencia `alcance_tipo/alcance_valor`;
8. unidad válida cuando corresponda;
9. rango válido;
10. códigos territoriales válidos;
11. códigos mensuales válidos;
12. firma semántica no duplicada entre activos;
13. conflictos deterministas detectables;
14. ausencia de datos no tratada como ausencia biológica.

## 14. Compatibilidad con export_master.py

R2 utiliza exclusivamente tipos ya soportados:

```text
string
array<string>
number
```

Por tanto, el exportador genérico puede materializar la hoja si se añade a:

- `Exportar_JSON`;
- `Diccionario_Campos`.

No se requiere transformación especial en `export_master.py`.

Sí se requiere extender `validate_master_export.py` para las reglas específicas anteriores.

## 15. Ejemplos de forma

### Altitud

```json
{
  "ecology_fact_id": "ECO-0001",
  "species_id": "SP-004",
  "dimension": "rango_altitudinal",
  "valor_texto": null,
  "valor_codificado": [],
  "valor_min": 0,
  "valor_max": 2000,
  "unidad": "m",
  "alcance_tipo": null,
  "alcance_valor": null,
  "fuente_ids": ["F-010"],
  "estado": "pendiente_revision",
  "notas": "Ejemplo estructural; requiere verificación directa antes de activar."
}
```

### Fenología mensual

```json
{
  "ecology_fact_id": "ECO-0002",
  "species_id": "SP-006",
  "dimension": "fenologia_floracion",
  "valor_texto": "octubre-enero",
  "valor_codificado": ["10", "11", "12", "01"],
  "valor_min": null,
  "valor_max": null,
  "unidad": null,
  "alcance_tipo": null,
  "alcance_valor": null,
  "fuente_ids": ["F-019"],
  "estado": "pendiente_revision",
  "notas": "Ejemplo estructural; requiere verificación directa antes de activar."
}
```

## 16. Consumo

Consumidores candidatos:

- ficha de especie;
- aprendizaje post-desbloqueo;
- pistas de hábitat durante exploración.

Regla:

```text
active
+ valid
+ conflict-free
→ UX eligible
```

Elegible no significa obligatorio.

## 17. AUDITORÍA INTERNA R2

R2 corrige los hallazgos N1–N10:

- N1: separa texto, códigos y rango;
- N2: firma semántica;
- N3: `fuente_ids` multifuente;
- N4: política de conflicto;
- N5: elimina confianza subjetiva;
- N6: tipa alcance;
- N7: meses normalizados cuando son inequívocos;
- N8: exige vocabulario territorial;
- N9: retira `afinidad_ambiental`;
- N10: mantiene tipos compatibles y declara extensión del validador.

## 18. OPEN

Permanecen abiertos:

- lista territorial definitiva y autoridad del vocabulario;
- vocabulario/ontología futura de hábitat;
- conflicto semántico automático para texto libre;
- tratamiento de distribución histórica vs actual;
- estacionalidad no expresada en meses;
- múltiples poblaciones con fenologías diferentes;
- compatibilidad futura con Darwin Core;
- cobertura fuente de Peumo, Litre y Bollén.

## 19. Gate R2

```text
QUERYABILITY: PASS WITH OPEN
DUPLICATE CONTROL: PASS
MULTI-SOURCE SUPPORT: PASS
CONFLICT POLICY: PASS WITH OPEN
TEMPORAL NORMALIZATION: PASS WITH OPEN
TERRITORIAL NORMALIZATION: PASS WITH OPEN
EXPORT TYPE COMPATIBILITY: PASS
MASTER MODIFICATION: STILL BLOCKED
DIRECT SOURCE POPULATION: NOT STARTED
R2 REGRESSION REQUIRED: YES
```
