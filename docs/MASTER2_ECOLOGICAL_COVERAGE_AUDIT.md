# Árboris — Auditoría de cobertura ecológica del Master 2.0 y derivados

**Estado:** auditoría no normativa / inspección directa completada  
**Gate:** MASTER2-ECOLOGICAL-COVERAGE-AUDIT-001  
**Fecha:** 23 septiembre 2026  
**Ámbito:** determinar si hábitat, distribución, altitud, fenología, microhábitat y relaciones ecológicas ya están disponibles en la autoridad botánica o se pierden en la derivación.

## 1. Pregunta de auditoría

> ¿La información ecológica necesaria para `OBSERVAR → RECONOCER → CONTEXTUALIZAR` ya existe en Master Botánico 2.0 y se pierde en la derivación, o realmente falta incorporarla con fuentes autorizadas?

## 2. Inspección directa realizada

Se inspeccionó directamente el XLSX canónico:

`data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx`

Hojas encontradas:

```text
Listado_original
Especies_Piloto
Caracteres
Fuentes
Especie_Caracter
Errores_Modelo
LEEME
Evidencia_Fotografica
Glosario
Metadatos
Diccionario_Campos
Exportar_JSON
```

También se revisaron:

- `export_master.py`;
- `validate_master_export.py`;
- `build_species_data.py`;
- `data/README.md`;
- JSON canónicos y fichas derivadas.

## 3. Hallazgo principal

La situación real no corresponde completamente ni a la hipótesis A ni a la B formuladas inicialmente.

El Master **sí contiene señales ecológicas y fenológicas**, pero no están modeladas como una capa ecológica canónica estructurada por especie.

Se observan al menos cuatro formas de presencia:

### 3.1 Listado_original

`Listado_original` contiene una columna:

```text
Ambiente/afinidad
```

y registros del inventario original con valores como `Esclerófilo`.

Esta hoja no forma parte del contrato canónico exportable vigente.

### 3.2 Fuentes

`Fuentes` contiene fuentes cuyo `uso_prioritario` incluye explícitamente:

- distribución;
- altitud;
- ecología;
- fenología;
- variación ambiental.

Ejemplos:

- F-005: “Variación foliar, anatomía y ecología del peumo”;
- F-010, F-013 y F-016: “Taxonomía, endemismo, distribución y altitud”;
- F-011, F-014 y F-019: incluyen fenología;
- F-012 y F-015: incluyen ecología.

Además, algunas notas ya conservan hechos ecológicos concretos, por ejemplo asociación a matorral/bosque esclerófilo o rangos altitudinales.

Esos datos son actualmente **metadatos o notas de fuente**, no hechos ecológicos normalizados por especie.

### 3.3 Caracteres

`Caracteres` incluye el campo:

```text
dependencia_fenologica
```

Esto gobierna cuándo un carácter puede depender de fase fenológica, pero no describe la fenología propia de cada especie.

### 3.4 Evidencia_Fotografica

Las notas de evidencia incluyen referencias puntuales a estado reproductivo o utilidad fenológica.

Eso describe evidencia concreta de individuos/fotografías, no conocimiento canónico de fenología de especie.

## 4. Qué exporta realmente el contrato vigente

`Exportar_JSON` y `Diccionario_Campos` gobiernan las exportaciones canónicas.

Los ocho datasets derivados son:

```text
metadata
species
characters
species_characters
sources
glossary
photos
model_errors
```

`Especies_Piloto` contiene:

```text
species_id
nombre_cientifico
nombre_comun
familia
orden
habito
origen
endemismo
estado_piloto
notas
```

No contiene campos canónicos específicos de:

- hábitat;
- ecosistema;
- distribución regional;
- rango altitudinal;
- fenología de especie;
- microhábitat;
- asociaciones ecológicas.

## 5. ¿Se están perdiendo datos durante la exportación?

No en el sentido de pérdida silenciosa.

`export_master.py` exporta exactamente las hojas y campos declarados por `Exportar_JSON` y `Diccionario_Campos`.

`validate_master_export.py` vuelve a leer el XLSX y exige equivalencia exacta entre ese contrato y los JSON.

Por tanto:

```text
CAMPO DECLARADO EN CONTRATO EXPORTABLE
→ debe aparecer en JSON

CAMPO/INFORMACIÓN FUERA DEL CONTRATO
→ no se exporta
→ no constituye pérdida silenciosa del pipeline
```

El problema es de **modelado y cobertura canónica**, no de corrupción del exportador.

## 6. Diagnóstico ASC

La respuesta a la pregunta inicial queda:

```text
¿Existe información ecológica en el XLSX?
→ SÍ, PARCIAL Y DISPERSA

¿Existe una capa ecológica canónica estructurada por especie?
→ NO

¿El exportador está descartando campos canónicos declarados?
→ NO EVIDENCE

¿Puede la UX contextual consumir hoy ecología de especie de forma sistemática?
→ NO
```

La categoría correcta es:

> **ECOLOGICAL KNOWLEDGE PRESENT BUT UNDER-MODELED**

## 7. Cobertura ya disponible por procedencia

La tabla `Fuentes` muestra que parte de las autoridades necesarias ya están incorporadas al Master.

Cobertura visible:

- **Peumo:** F-005 incluye ecología y variación ambiental;
- **Mitique:** F-010 distribución/altitud, F-011 fenología, F-012 ecología;
- **Colliguay:** F-013 distribución/altitud, F-014 fenología, F-015 ecología;
- **Quillay:** F-016 distribución/altitud, F-019 fenología;
- **Litre y Bollén:** existen fuentes botánicas vigentes, pero la cobertura ecológica estructurable debe revisarse antes de asumir suficiencia.

Esto significa que una futura extensión no necesariamente parte de cero, pero tampoco puede poblarse automáticamente a partir de las notas actuales.

## 8. Separación crítica: especie vs. observación

La ampliación debe respetar:

```text
SPECIES ECOLOGY
→ conocimiento general documentado sobre una especie

OBSERVATION CONTEXT
→ condiciones realmente observadas en un encuentro concreto
```

No deben mezclarse.

Ejemplo:

```text
“la especie ocurre entre X–Y m”
≠
“esta observación ocurrió a Z m”
```

y:

```text
“hábitat documentado para la especie”
≠
“hábitat observado en este individuo”
```

## 9. AUDITORÍA

**Resultado:** `PASS WITH OPEN — ECOLOGICAL SIGNALS PRESENT, CANONICAL MODEL INSUFFICIENT`.

Se prueba que:

- el XLSX contiene señales ecológicas/fenológicas reales;
- varias fuentes ya contemplan distribución, altitud, fenología o ecología;
- esas señales no constituyen todavía una capa ecológica estructurada por especie;
- el pipeline exporta correctamente su contrato actual;
- la brecha está en el modelo editorial/canónico, no en el exportador;
- la UX contextual específica sigue bloqueada hasta estructurar y validar esos datos.

## 10. INCONSISTENCIAS

No se detecta inconsistencia funcional del pipeline.

Sí existe una brecha entre:

```text
PRODUCT_VISION / PRODUCT_PRINCIPLES
→ requieren contexto ecológico

MASTER 2.0 CURRENT CANONICAL SCHEMA
→ no lo estructura sistemáticamente por especie
```

`Listado_original.Ambiente/afinidad` no debe promocionarse automáticamente a verdad canónica porque pertenece al inventario original y carece del contrato de procedencia por hecho requerido para la capa vigente.

## 11. VACÍOS / OMISIONES

Quedan abiertos:

- esquema mínimo de ecología de especie;
- autoridad por hecho/campo;
- cobertura suficiente para Litre y Bollén;
- normalización de distribución geográfica;
- representación de rango altitudinal;
- representación de fenología;
- taxonomía de hábitat/ecosistema;
- representación de asociaciones ecológicas;
- microhábitat;
- reglas para múltiples fuentes y desacuerdos;
- integración con `contexts.json` sin confundir contexto de ACE con ecología general de especie.

## 12. REDUNDANCIAS

No corresponde crear:

- un segundo Master;
- JSON ecológicos mantenidos manualmente;
- conocimiento ecológico hardcodeado en UI;
- una entidad `Itrofill`;
- un motor nuevo.

La ampliación, si se aprueba, debe entrar en la autoridad editorial existente y seguir el mismo patrón de exportación/validación.

## 13. Gate

```text
DIRECT MASTER INSPECTION: PASS
ECOLOGICAL SIGNALS IN MASTER: PASS
STRUCTURED SPECIES ECOLOGY: FAIL / NOT PRESENT
SILENT EXPORT LOSS: NOT SUPPORTED
SOURCE BASE FOR EXTENSION: PARTIAL
CONTEXTUAL UX: BLOCKED PENDING STRUCTURED DATA
SECOND MASTER: REJECTED
CONTROLLED MASTER EXTENSION: WARRANTED
```

## 14. Próximo paso

Corresponde diseñar, sin modificar todavía el XLSX canónico, un contrato candidato mínimo para **ecología de especie** que:

1. preserve procedencia por hecho;
2. no mezcle conocimiento de especie con contexto observado;
3. aproveche las fuentes ya registradas;
4. pueda exportarse y validarse como el resto del Master;
5. no obligue a completar dimensiones sin evidencia suficiente;
6. mantenga `OPEN` cualquier dato faltante.

Sólo después de auditar ese contrato candidato corresponde decidir si modificar Master 2.0.
