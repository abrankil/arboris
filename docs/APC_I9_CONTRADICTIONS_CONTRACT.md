# Árboris — APC I9 Contradictions Contract

**ID:** `ARBORIS_APC_I9_CONTRADICTIONS_CONTRACT_R3`  
**Estado:** VALIDATED WITH ASC, FROZEN para implementación técnica.  
**Ámbito:** Hito 16 / APC I9.  
**Base canónica de implementación:** `main@327f563c510e9945d452a883b5a9250032e948f3`.  
**No autoriza:** merge a `main`, avance de Gate B ni cierre de Hito 16.

## 1. Objetivo

I9 representa contradicciones entre evidencias sin decidir cuál evidencia es correcta, sin modificar conocimiento botánico y sin eliminar evidencia.

La unidad semántica de contradicción es:

```text
(individualId, characterId)
```

Una contradicción es un registro agregado de una serie semántica. No se modela como una colección de objetos par-a-par.

## 2. Conjunto operacional actual

Para una serie `(individualId, characterId)`, el conjunto operacional actual se deriva de `session.evidence` y contiene únicamente evidencia:

```text
current = true
lifecycleStatus = CONFIRMED
evidenceStatus = OBSERVED
individualId compatible
characterId compatible
```

Las revisiones históricas, DRAFT, UNCERTAIN y NOT_OBSERVABLE no forman parte del conjunto operacional actual de contradicción.

## 3. Existencia de contradicción

Existe contradicción si y sólo si el conjunto operacional actual contiene al menos un par semánticamente incompatible.

La incompatibilidad debe evaluarse contra el contrato del carácter. No se define como desigualdad genérica de strings.

Para un carácter piloto simple cuyos estados son mutuamente excluyentes, estados distintos pueden constituir un par incompatible. Esta regla sólo puede aplicarse cuando el contrato del carácter establece esa exclusión.

I9 no hardcodea conocimiento botánico ni listas de incompatibilidad en APC.

## 4. Forma del registro

Cada entrada de `contradictions[]` requiere al menos:

```text
contradictionId
individualId
characterId
status
evidenceRefs[]
previousContradictionId
```

`status`:

```text
OPEN | RESOLVED
```

## 5. evidenceRefs como snapshot disparador

`evidenceRefs[]` registra el snapshot de evidencia que disparó el episodio.

Cada referencia tiene forma:

```text
{ evidenceId, revision }
```

Reglas:

- mínimo 2 referencias;
- referencias versionadas y únicas;
- máximo una revisión por `evidenceId`;
- todas pertenecen a la misma serie `(individualId, characterId)`;
- todas deben haber sido `current + CONFIRMED + OBSERVED` al crear el episodio;
- el conjunto debe contener al menos un par incompatible al crear el episodio.

Las referencias son históricas y no persiguen automáticamente la revisión `current` futura.

## 6. Estado OPEN y RESOLVED

`OPEN` significa que el conjunto operacional actual contiene al menos un par incompatible.

La transición:

```text
OPEN → RESOLVED
```

sólo es válida si, en el momento de transición, el conjunto operacional actual ya no contiene ningún par incompatible.

`RESOLVED` es un hecho histórico. Una contradicción resuelta no se reabre ni se invalida porque aparezca posteriormente una nueva contradicción en la misma serie.

## 7. Episodios y recurrencia

`RESOLVED` es terminal para un `contradictionId`.

Si una contradicción reaparece:

```text
nuevo contradictionId
previousContradictionId = predecesor directo
```

Reglas de cadena:

```text
una sola raíz
sin ciclos
sin forks
sin saltos
misma serie semántica
previous debe estar RESOLVED
máximo un OPEN por serie
OPEN sólo puede ser la cola
```

## 8. Separación snapshot / transición

### Snapshot

Puede verificarse:

- forma y referencias;
- identidad de serie;
- unicidad de referencias;
- cadena de recurrencia;
- máximo un OPEN por serie;
- compatibilidad estructural de evidenceRefs;
- estado OPEN contra el conjunto operacional actual cuando está disponible la semántica de incompatibilidad.

### Transición

Debe verificarse en el momento de cambio:

- evidencia disparadora era current + CONFIRMED + OBSERVED;
- evidenceRefs contenía al menos un par incompatible;
- OPEN→RESOLVED ocurrió sólo después de desaparecer toda incompatibilidad actual;
- RESOLVED no se reabre;
- recurrence preserva la serie y el predecesor directo.

Las propiedades históricas dependientes del estado del momento no se reconstruyen retroactivamente desde un snapshot posterior.

## 9. Límite de autoridad

I9 nunca:

- elige una evidencia ganadora;
- modifica estados observados;
- modifica el Master;
- altera conocimiento botánico;
- elimina candidatos de identificación;
- resuelve por sí solo una identificación.

La consecuencia de una contradicción sobre identificación pertenece a capas posteriores.

## 10. Relación con PASS

I9 no define PASS.

Una contradicción `OPEN` no bloquea automáticamente PASS por sí misma.

Cuando una contradicción sea material para el objetivo de sesión, su consecuencia debe reflejarse mediante:

```text
objectiveAssessment
y/o
pending crítico
```

La regla operacional de PASS/export pertenece a I10.

## 11. Criterio de cierre

I9 puede cerrarse cuando:

- la serie `(individualId, characterId)` esté implementada;
- el conjunto operacional actual esté implementado;
- la detección dependa de semántica de incompatibilidad externa, no desigualdad genérica;
- evidenceRefs versionados y disparadores estén validados;
- OPEN/RESOLVED y recurrence estén implementados;
- snapshot y transition rules estén separados;
- no exista selección de evidencia ganadora;
- la suite I9 pase;
- regresiones I1–I8 permanezcan verdes;
- `npm test` pase;
- la auditoría del diff no encuentre blockers;
- el cambio se integre mediante PR aprobado.

## 12. AUDITORÍA

I9 preserva evidencia contradictoria y representa conflicto semántico sin convertir APC en autoridad botánica ni de identificación.

## 13. INCONSISTENCIAS

La base integrada hasta I8 contiene `contradictions[]` sólo como array estructural. I9 define su semántica operacional e histórica.

## 14. VACÍOS / OMISIONES

I10 define PASS/export y la relación operacional final con contradicciones. I11 cubre el E2E APC→H16→ACE.

## 15. REDUNDANCIAS

La contradicción se agrega por serie semántica y no se duplica en objetos par-a-par. La recurrencia crea episodios nuevos sin reabrir registros RESOLVED.
