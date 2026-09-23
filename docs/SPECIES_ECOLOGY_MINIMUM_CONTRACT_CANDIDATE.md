# Árboris — Contrato candidato mínimo de ecología de especie

**Estado:** candidato no normativo  
**Gate:** SPECIES-ECOLOGY-MINIMUM-CONTRACT-001  
**Fecha:** 23 septiembre 2026  
**Ámbito:** diseño de contrato editorial/exportable para conocimiento ecológico general de especie. No modifica todavía Master 2.0, ACE ni runtime.

## 1. Objetivo

Definir la ampliación mínima necesaria para que Árboris pueda representar ecología de especie con procedencia explícita, sin mezclarla con contexto observado ni con la capa de contextos de ACE.

Debe satisfacer:

- autoridad por hecho;
- ausencia explícita de inferencias no respaldadas;
- exportación reproducible;
- validación determinista;
- compatibilidad con especies del piloto;
- posibilidad de dejar dimensiones sin dato.

## 2. Decisión de modelado

No añadir campos ecológicos directamente a `Especies_Piloto`.

Razón:

`Especies_Piloto` contiene una fila por especie. Hábitat, distribución, fenología y otras dimensiones pueden requerir múltiples hechos, múltiples fuentes y eventualmente desacuerdos.

Agregar columnas como:

```text
habitat
distribucion
fenologia
altitud
```

forzaría concatenaciones, pérdida de procedencia por hecho o semántica ambigua.

Se propone una nueva hoja relacional dentro del mismo Master:

```text
Ecologia_Especie
```

y una exportación canónica derivada:

```text
species_ecology.json
```

Esto no constituye un segundo Master.

## 3. Unidad mínima: SpeciesEcologyFact

Cada fila representa un hecho ecológico documentado para una especie.

Clave conceptual:

```text
Species
+
EcologyDimension
+
Value
+
Source
→ SpeciesEcologyFact
```

Contrato candidato:

| campo | tipo JSON | nullable | función |
| --- | --- | --- | --- |
| `ecology_fact_id` | string | No | PK estable del hecho |
| `species_id` | string | No | FK a `Especies_Piloto.species_id` |
| `dimension` | string | No | dimensión ecológica controlada |
| `valor` | string | Sí* | valor textual o categórico cuando corresponda |
| `valor_min` | number | Sí | límite inferior para dimensión numérica |
| `valor_max` | number | Sí | límite superior para dimensión numérica |
| `unidad` | string | Sí | unidad para rango numérico |
| `fuente_id` | string | No | FK a `Fuentes.fuente_id` |
| `alcance` | string | Sí | región, población, condición o contexto al que aplica el hecho |
| `confianza` | string | No | fuerza editorial del hecho |
| `notas` | string | Sí | aclaración no computable |
| `estado` | string | No | activo / pendiente_revision / retirado |

* `valor` puede ser nulo sólo cuando el hecho se expresa mediante `valor_min/valor_max`.

## 4. Dimensiones candidatas mínimas

No se intenta cubrir toda la ecología.

La primera versión debería limitarse a dimensiones ya justificadas por visión de producto y señales presentes en las fuentes del Master:

```text
distribucion_geografica
rango_altitudinal
habitat
fenologia_floracion
fenologia_fructificacion
afinidad_ambiental
```

No se incluyen todavía:

```text
interacciones_bioticas
polinizadores
dispersores
suelo_detallado
comunidad_vegetal_formal
microhabitat
servicios_ecosistemicos
```

Estas dimensiones requieren más diseño y/o cobertura fuente.

## 5. Reglas de representación

### 5.1 Distribución geográfica

Una fila puede contener una unidad territorial documentada o un conjunto controlado.

No debe mezclar:

```text
distribución conocida de la especie
vs.
lugar de una observación concreta
```

### 5.2 Rango altitudinal

Usar:

```text
valor_min
valor_max
unidad = m
```

No convertir texto fuente a rango si la fuente no proporciona ambos límites o un límite interpretable de forma inequívoca.

### 5.3 Hábitat / afinidad ambiental

Preservar lenguaje de la fuente.

Ejemplo admisible si está respaldado:

```text
matorral y bosque esclerófilos
```

No normalizar automáticamente a categorías más generales como `bosque mediterráneo` si la fuente no lo dice.

### 5.4 Fenología

Separar al menos:

```text
fenologia_floracion
fenologia_fructificacion
```

Un periodo como “mayo-diciembre” se registra como valor documentado mientras no exista un contrato temporal más específico.

No inferir fructificación desde floración ni viceversa.

## 6. Procedencia por hecho

Toda fila requiere `fuente_id`.

Regla:

```text
NO SOURCE
→ NO CANONICAL ECOLOGY FACT
```

Las notas actualmente presentes en `Fuentes.notas` pueden servir como pista editorial para extraer hechos, pero no deben convertirse automáticamente en filas.

Cada hecho debe verificarse contra la fuente correspondiente antes de incorporarlo.

## 7. Confianza editorial

Propuesta inicial:

```text
alta
media
baja
```

Semántica:

- `alta`: fuente prioritaria/directa y afirmación explícita;
- `media`: fuente válida pero secundaria, resumida o de alcance restringido;
- `baja`: señal preliminar que requiere revisión adicional.

`baja` no debe alimentar afirmaciones de UX como hecho estable sin regla explícita posterior.

La escala es editorial, no probabilidad estadística.

## 8. Estado del hecho

```text
activo
pendiente_revision
retirado
```

Sólo `activo` puede alimentar UX o consultas canónicas.

Los otros estados permanecen por trazabilidad.

## 9. Reglas de integridad

El validador debería exigir:

1. `ecology_fact_id` único;
2. `species_id` existente;
3. `fuente_id` existente;
4. `dimension` dentro del vocabulario permitido;
5. al menos uno de `valor` o `valor_min/valor_max`;
6. si hay rango, `valor_min <= valor_max`;
7. si hay rango numérico, `unidad` obligatoria;
8. `confianza` dentro del vocabulario permitido;
9. `estado` dentro del vocabulario permitido;
10. ninguna dimensión ausente se interpreta como ausencia ecológica.

## 10. Semántica de null y ausencia de fila

```text
NO ROW
→ no existe conocimiento ecológico canónico documentado para esa dimensión

NULL
→ permitido sólo según contrato del campo; nunca significa “no existe”
```

Ejemplo:

no tener `fenologia_fructificacion` para SP-003 no significa que Bollén no fructifique.

## 11. Separación respecto de Observation

Este contrato describe:

```text
WHAT IS DOCUMENTED ABOUT THE SPECIES
```

Observation describe:

```text
WHAT WAS ACTUALLY OBSERVED HERE AND NOW
```

No debe existir copia automática desde `species_ecology` hacia una observación.

Tampoco una observación individual actualiza conocimiento canónico de especie sin proceso editorial explícito.

## 12. Separación respecto de ACE contexts

`data/botanical/contexts.json` cumple una función diferente:

```text
ACE context
→ condición necesaria para interpretar variabilidad de un carácter

Species ecology
→ conocimiento general documentado de especie
```

Ejemplo:

`hojas_de_sombra` puede ser contexto de variabilidad morfológica.

No equivale a:

`hábitat = sombra densa de dosel`.

No se propone fusionar ambas capas.

## 13. Ejemplos candidatos derivados de señales existentes

Estos ejemplos NO quedan aprobados como filas canónicas; muestran que el contrato puede representar información ya visible en las fuentes registradas.

### SP-004 — Podanthus mitiqui

F-010 registra en sus notas:

```text
0–2000 m
```

Representación candidata:

```json
{
  "species_id": "SP-004",
  "dimension": "rango_altitudinal",
  "valor_min": 0,
  "valor_max": 2000,
  "unidad": "m",
  "fuente_id": "F-010"
}
```

F-011 registra “floración primaveral”.

Posible hecho de `fenologia_floracion`, sujeto a verificación directa de fuente.

F-012 registra asociación a “matorral y bosque esclerófilos”.

Posible hecho de `habitat`, sujeto a verificación directa.

### SP-005 — Colliguaja odorifera

F-013 registra:

```text
0–1300 m
```

F-014 registra:

```text
floración mayo-diciembre
```

F-015 registra:

```text
matorral mediterráneo asoleado y pedregoso
```

Los tres son representables sin alterar el contrato.

### SP-006 — Quillaja saponaria

F-016 registra:

```text
10–2000 m
```

F-019 registra:

```text
floración octubre-enero
```

También son representables.

## 14. Cobertura inicial esperada

No se exige simetría artificial entre las seis especies.

Regla:

```text
PARTIAL VERIFIED COVERAGE
>
FABRICATED COMPLETE COVERAGE
```

Por tanto puede existir:

- SP-004 con altitud + floración + hábitat;
- SP-005 con altitud + floración + hábitat;
- SP-006 con altitud + floración;
- otras especies con menos dimensiones mientras se investigan.

## 15. Exportación candidata

Si se aprueba:

`Exportar_JSON` añadiría una entrada:

```text
Ecologia_Especie
→ species_ecology
→ Sí
→ filas -> array de objetos
```

`Diccionario_Campos` declararía el contrato anterior.

`export_master.py` no requeriría lógica especial si los tipos utilizados ya están soportados.

El validador sí debería incorporar integridad referencial y reglas específicas de dimensión/rango.

## 16. Consumidores

Primera prioridad:

```text
ficha de especie
post-unlock learning
exploration habitat hints
```

No debe alimentar ACE automáticamente.

Si en el futuro contexto ecológico participa en identificación, debe existir un gate específico que defina:

- autoridad;
- discriminación geográfica;
- incertidumbre;
- riesgo de excluir especies por datos incompletos;
- privacidad de ubicación.

## 17. Compatibilidad con OBSERVAR → RECONOCER → CONTEXTUALIZAR

El contrato permite:

```text
OBSERVAR
→ CharacterEvidence

RECONOCER
→ ACE / Identification

CONTEXTUALIZAR
→ SpeciesEcologyFact activo y respaldado
```

Esto evita que contextualización altere retroactivamente la evidencia de identificación.

## 18. AUDITORÍA

El modelo relacional por hechos es preferible a añadir columnas ecológicas simples a `Especies_Piloto`.

Razones:

- conserva procedencia granular;
- soporta múltiples hechos por dimensión;
- admite cobertura parcial;
- permite estados/revisión;
- evita concatenaciones;
- separa especie de observación;
- se integra con el patrón vigente de IDs, fuentes y validación.

## 19. INCONSISTENCIAS

No se detecta contradicción con DATA_MODEL ni ARCHITECTURE.

Sí deberá actualizarse la documentación que hoy enumera “ocho JSON canónicos” si esta ampliación llega a adoptarse.

Eso no debe hacerse durante la fase candidato.

## 20. VACÍOS / OMISIONES

Permanecen OPEN:

- vocabulario final de `dimension`;
- formato normalizado de distribución territorial;
- si `valor` debe permanecer libre o usar vocabularios por dimensión;
- representación temporal estructurada de fenología;
- resolución de múltiples fuentes que discrepan;
- política de confianza final;
- cobertura de Peumo, Litre y Bollén;
- si hábitat y afinidad ambiental deben ser una o dos dimensiones;
- compatibilidad futura con Darwin Core u otros estándares.

## 21. REDUNDANCIAS

No se crea:

- segundo Master;
- segundo catálogo de especies;
- segundo motor de identificación;
- una entidad cultural;
- una copia de `contexts.json`.

`SpeciesEcologyFact` es una relación editorial dentro del mismo dominio botánico.

## 22. Gate

```text
SEPARATE RELATIONAL ECOLOGY TABLE: PASS
PROVENANCE PER FACT: PASS
SPECIES / OBSERVATION SEPARATION: PASS
ACE CONTEXT / SPECIES ECOLOGY SEPARATION: PASS
PARTIAL COVERAGE ALLOWED: PASS
DIRECT UX CONSUMPTION BEFORE POPULATION: BLOCKED
MASTER MODIFICATION: NOT YET AUTHORIZED
CONTRACT AUDIT: REQUIRED NEXT
```

## 23. Próximo paso

Corresponde una auditoría adversarial del contrato candidato enfocada en:

- duplicación de hechos;
- contradicciones entre fuentes;
- granularidad territorial;
- fenología temporal;
- semántica de confianza;
- proliferación innecesaria de dimensiones;
- riesgo de que `valor` se convierta en texto libre imposible de consultar;
- compatibilidad con el esquema/exportador vigente.

Sólo si esa auditoría pasa corresponde compilar una propuesta exacta de modificación del XLSX.
