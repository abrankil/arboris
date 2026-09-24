# Árboris — Auditoría adversarial del contrato candidato de ecología de especie

**Estado:** auditoría no normativa  
**Gate:** SPECIES-ECOLOGY-MINIMUM-CONTRACT-ADV-001  
**Fecha:** 23 septiembre 2026  
**Objeto auditado:** `SPECIES_ECOLOGY_MINIMUM_CONTRACT_CANDIDATE.md`

## 1. Resultado

**VEREDICTO:** `PARTIAL / REVISION REQUIRED`

La decisión arquitectónica central pasa:

```text
Ecologia_Especie como relación dentro del mismo Master
+ procedencia por hecho
+ separación Species / Observation / ACE context
```

Pero el contrato R1 no debe implementarse todavía. Tiene defectos de representación que podrían convertir el nuevo dataset en una capa difícil de consultar, duplicable y ambigua ante desacuerdos.

## 2. Hallazgos adversariales

### N1 — `valor` libre es demasiado polimórfico

Un único `valor: string` tendría que representar:

- regiones;
- hábitat;
- meses;
- periodos fenológicos;
- categorías ambientales.

Eso permitiría exportación, pero no interoperabilidad ni consultas fiables.

**Severidad:** alta.

### N2 — duplicación semántica no está controlada

`ecology_fact_id` único evita IDs duplicados, pero no evita dos filas que representen exactamente el mismo hecho con IDs distintos.

Ejemplo:

```text
ECO-001 / SP-004 / rango_altitudinal / 0–2000 / F-010
ECO-099 / SP-004 / rango_altitudinal / 0–2000 / F-010
```

Ambas pasarían las reglas propuestas.

**Severidad:** media-alta.

### N3 — una fuente por fila fuerza duplicación por corroboración

Si dos fuentes respaldan exactamente el mismo hecho, R1 obliga a duplicar filas o a escoger una sola fuente.

Ambas opciones son malas:

- duplicar confunde número de hechos con número de fuentes;
- escoger una pierde procedencia.

**Severidad:** alta.

### N4 — desacuerdos entre fuentes no tienen política operativa

R1 permite implícitamente múltiples hechos distintos para la misma dimensión, pero no define:

- cuándo son compatibles;
- cuándo constituyen conflicto;
- qué puede consumir UX;
- si se permite conciliarlos.

**Severidad:** alta.

### N5 — `confianza = alta/media/baja` introduce juicio editorial no suficientemente gobernado

La definición mezcla:

- autoridad de fuente;
- explicitud de la afirmación;
- alcance;
- revisión editorial.

Esas dimensiones no son equivalentes.

Una escala única podría producir falsa precisión y competir con `estado`.

**Severidad:** alta.

### N6 — `alcance` como texto libre puede ocultar diferencias materiales

“Región Metropolitana”, “Chile central”, “población costera” o “en exposición norte” son tipos de alcance distintos.

Un único string no permite distinguir alcance geográfico, poblacional o condicional.

**Severidad:** media.

### N7 — fenología textual no es suficientemente consultable

Registrar “mayo-diciembre”, “primavera” y “octubre-enero” en un string preserva fuente, pero impide consultas temporales consistentes y tratamiento claro de periodos que cruzan año calendario.

**Severidad:** alta para uso futuro.

### N8 — distribución geográfica carece de contrato de códigos

R1 propone “unidad territorial documentada o conjunto controlado” pero no define el vocabulario.

Sin contrato, pueden coexistir:

```text
RME
RM
Región Metropolitana
Metropolitana
```

como valores diferentes para la misma unidad.

**Severidad:** alta.

### N9 — `habitat` y `afinidad_ambiental` se solapan

No existe criterio suficientemente estricto para decidir dónde registrar expresiones como:

- bosque esclerófilo;
- matorral mediterráneo;
- asoleado;
- pedregoso;
- quebrada húmeda.

El contrato podría fragmentar un mismo hecho entre dos dimensiones.

**Severidad:** media-alta.

### N10 — el exportador sí soporta los tipos básicos, pero el validador requiere lógica nueva

`export_master.py` ya soporta:

- `string`;
- `array<string>`;
- `number`;
- `boolean`;
- `date`.

Por tanto la exportación es compatible en principio.

Pero las reglas condicionales, FKs múltiples, duplicación semántica y conflicto entre hechos no pueden quedar sólo en `Diccionario_Campos`. Requieren validación específica.

**Severidad:** esperada / no bloqueante si se diseña.

## 3. Invariantes que sobreviven

```text
I1  One Master only
I2  Provenance per ecological claim
I3  Species ecology ≠ Observation context
I4  Species ecology ≠ ACE context
I5  Missing data ≠ ecological absence
I6  Partial verified coverage > fabricated symmetry
I7  Ecology must not enter ACE implicitly
I8  No UX claim without active verified canonical fact
```

## 4. Correcciones requeridas

R2 debe:

1. separar texto fuente de valores normalizados;
2. permitir varias fuentes para un mismo hecho sin duplicarlo;
3. definir clave semántica de duplicación;
4. eliminar `confianza` hasta que exista una política objetiva;
5. definir representación temporal de fenología;
6. definir representación territorial mínima;
7. fusionar o delimitar `habitat` / `afinidad_ambiental`;
8. establecer política explícita de conflicto;
9. mantener compatibilidad con tipos ya soportados por el exportador;
10. conservar `OPEN` donde todavía no exista vocabulario autorizado.

## 5. AUDITORÍA

La propuesta R1 es arquitectónicamente correcta pero contractualmente inmadura.

No se detecta necesidad de:

- segundo Master;
- motor nuevo;
- cambio de ACE;
- cambio de modelo de Observation.

## 6. INCONSISTENCIAS

La principal inconsistencia interna es que R1 exige “procedencia por hecho”, pero modela una única `fuente_id`, lo que hace que un hecho corroborado por varias fuentes tenga que duplicarse.

La segunda es declarar `dimension` controlada mientras varios valores centrales permanecen sin vocabulario ni estructura suficiente.

## 7. VACÍOS / OMISIONES

Quedan por resolver en R2:

- identidad semántica del hecho;
- multifuente;
- normalización temporal;
- normalización territorial;
- conflicto;
- vocabulario mínimo de dimensión;
- reglas de consumo UX ante conflicto.

## 8. REDUNDANCIAS

`afinidad_ambiental` es redundante o insuficientemente diferenciada respecto de `habitat` en el alcance actual.

Debe salir del núcleo mínimo o recibir semántica independiente antes de volver.

## 9. Gate

```text
RELATIONAL MODEL: PASS
PROVENANCE MODEL: PARTIAL
QUERYABILITY: FAIL
DUPLICATE CONTROL: FAIL
MULTI-SOURCE SUPPORT: FAIL
CONFLICT POLICY: FAIL
EXPORT TYPE COMPATIBILITY: PASS
MASTER MODIFICATION: BLOCKED
R2 REQUIRED: YES
```
