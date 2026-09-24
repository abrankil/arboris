# Árboris — Migration Readiness Gate para ecología de especie

**Estado:** gate de preparación / no ejecuta migración  
**Gate:** SPECIES-ECOLOGY-MIGRATION-READINESS-001  
**Fecha:** 23 septiembre 2026  
**Objeto:** determinar si existe suficiente definición para abrir una rama de migración ejecutable del Master Botánico 2.0.

## 1. Resultado

**VEREDICTO:** `READY FOR IMPLEMENTATION BRANCH — NOT READY FOR MERGE`

Los bloqueos conceptuales previos están resueltos con OPEN explícitos que no impiden construir y probar la migración de esquema.

No se autoriza todavía poblar hechos ecológicos reales ni consolidar la migración en `main`.

## 2. Estado de la rama de investigación

Comparación con `main` al momento del gate:

```text
status: ahead
ahead_by: 15
behind_by: 0
```

Los cambios de la rama son exclusivamente documentación de investigación/auditoría. No existen todavía modificaciones al XLSX, pipeline, JSON canónicos ni runtime.

Esto permite separar limpiamente:

```text
RESEARCH / DESIGN HISTORY
→ migration implementation
```

## 3. Gates previos

### 3.1 Necesidad de ecología estructurada

```text
ECOLOGICAL SIGNALS IN MASTER: PASS
STRUCTURED SPECIES ECOLOGY: NOT PRESENT
CONTROLLED MASTER EXTENSION: WARRANTED
```

**Estado:** PASS.

### 3.2 Contrato mínimo

```text
SpeciesEcologyFact
+ multifuente
+ cobertura parcial
+ separación Species / Observation / ACE context
```

**Estado:** PASS WITH OPEN.

### 3.3 Auditoría adversarial y R2

R2 resolvió:

- payload polimórfico;
- duplicados semánticos;
- corroboración multifuente;
- política de multiplicidad;
- confianza editorial subjetiva;
- alcance;
- fenología;
- solapamiento habitat/afinidad;
- compatibilidad del exportador.

**Estado:** PASS WITH OPEN.

### 3.4 Propuesta exacta de modificación

Superficies definidas:

- nueva hoja;
- `Diccionario_Campos`;
- `Exportar_JSON`;
- metadata;
- vocabularios;
- DV;
- export;
- validation;
- species cards;
- compact query routing;
- docs;
- tests.

**Estado:** PASS después de R2.

### 3.5 Política de versionado

Para la migración de esquema vacío:

```text
master_version = 2.0.0
schema_version = 3.0.0
controlled_vocabulary_spec_version = 2.0.0
controlled vocabulary contract_version = 2.0.0
updated_at = execution date
species-card = v3
```

**Estado:** PASS WITH OPEN.

OPEN no bloqueante:

- versión editorial futura cuando entren hechos reales;
- posible renombre futuro del archivo físico.

### 3.6 Vocabulario territorial

Contrato:

```text
arboris.udec-vascular-catalog.distribution-area.v1
```

Lista autorizada:

```text
AYP TAR ANT ATA COQ VAL RME LBO MAU NUB BIO ARA LRI LLA AIS MAG IPA JFE IDE
```

Uso:

```text
species ecology contextual only
not ACE filtering
```

**Estado:** PASS WITH OPEN.

## 4. Artefactos que deben cambiar en la migración

### 4.1 Fuente de verdad

```text
data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx
```

Cambios:

- crear `Ecologia_Especie`;
- añadir contrato a `Diccionario_Campos`;
- añadir export a `Exportar_JSON`;
- actualizar Metadatos;
- aplicar Data Validation de vocabularios gobernados.

### 4.2 Especificación de vocabulario

```text
config/botanical/controlled_vocabularies.json
```

Agregar:

- `Ecologia_Especie.dimension`;
- `Ecologia_Especie.estado`;
- `Ecologia_Especie.alcance_tipo`;
- `Ecologia_Especie.unidad`.

Actualizar versiones a 2.0.0 según gate.

### 4.3 Pipeline

Modificar:

```text
tools/botanical-data/check_controlled_vocabulary_dv.py
tools/botanical-data/validate_master_export.py
tools/botanical-data/build_species_data.py
tools/botanical-data/validate_species_data.py
tools/botanical-data/query_botanical.py
tools/botanical-data/test_query_botanical.py
```

Agregar tests específicos del contrato ecológico.

### 4.4 Derivados

Generar:

```text
data/botanical/species_ecology.json
```

Inicialmente:

```json
[]
```

Regenerar las seis fichas de `data/species/` con:

```text
view_schema = arboris.species-card.v3
ecology = []
```

en la migración de esquema vacío.

### 4.5 Routing y documentación

Actualizar como mínimo:

```text
AGENTS.md
data/README.md
data/botanical/README.md
docs/START_HERE.md
docs/DATA_MODEL.md
docs/ARCHITECTURE.md
tools/botanical-data/README.md
```

y cualquier afirmación normativa que diga “ocho JSON canónicos”.

## 5. Tests/gates obligatorios

La rama de implementación no se considera preparada para integración sin:

### T1 — export

```text
build:botanical
→ species_ecology.json = []
→ no pérdida de datasets anteriores
```

### T2 — equivalencia Master/JSON

`validate_master_export.py` debe verificar nueve datasets y las reglas de `SpeciesEcologyFact`.

### T3 — controlled vocabulary

`check_controlled_vocabulary_dv.py` debe pasar para:

- contrato existente de `Especie_Caracter`;
- contrato nuevo de `Ecologia_Especie`.

Debe probarse la DV de la hoja vacía mediante fixture temporal o checker ampliado.

### T4 — fichas

`validate_species_data.py` debe exigir:

```text
arboris.species-card.v3
ecology = active facts only
source closure includes ecology sources
```

### T5 — query routing

Debe pasar:

```text
query_botanical.py ecology
query_botanical.py ecology SP-xxx
query_botanical.py stats
```

con el noveno JSON incluido.

### T6 — data access

```text
verify:data-access
```

debe seguir pasando.

### T7 — suite completa

```text
npm test
```

debe pasar antes de integración.

## 6. Casos negativos mínimos

El nuevo validador debe demostrar fallo para:

1. ID `ECO-xxxx` inválido;
2. ID duplicado;
3. especie inexistente;
4. `fuente_ids` vacío;
5. fuente inexistente;
6. dimensión inválida;
7. payload incompatible con dimensión;
8. `valor_min > valor_max`;
9. unidad inválida;
10. mes inválido;
11. mes repetido;
12. código UdeC inválido;
13. duplicado semántico con distinta redacción;
14. duplicado semántico con fuente diferente;
15. múltiples rangos altitudinales activos no resueltos;
16. alcance incompleto.

Debe demostrar éxito para:

17. múltiples hábitats distintos;
18. múltiples hechos fenológicos permitidos con warning cuando corresponda;
19. ausencia total de hechos ecológicos;
20. ficha v3 con `ecology=[]`.

## 7. Límites de esta migración

La rama de esquema NO debe:

- incorporar hechos reales como `activo`;
- usar distribución para ACE;
- crear ecología desde conocimiento del modelo;
- transformar automáticamente notas de `Fuentes`;
- crear microhábitat;
- crear relaciones bióticas;
- modificar `contexts.json`;
- modificar `character_variability.json`;
- materializar ecología en reference SQLite v1;
- cambiar el modelo de Observation;
- introducir conceptos `Ipotocaticac` o `Itrofill` como entidades técnicas.

## 8. Estrategia de implementación

Secuencia autorizable:

```text
1. crear rama de implementación desde main
2. portar sólo contratos finales necesarios desde investigación
3. extender vocabulario controlado
4. extender checker DV
5. crear/migrar copia de trabajo del XLSX
6. probar DV con fixture sintético
7. materializar hoja vacía en Master candidato
8. actualizar schema dictionary/export map/metadata
9. extender export/validator
10. generar noveno JSON vacío
11. migrar species-card v3
12. ampliar query routing
13. actualizar docs/router
14. build + verify + data-access + full tests
15. auditoría integrada
16. recién entonces decidir merge
17. después abrir gate independiente de DATA POPULATION
```

## 9. Riesgo de mezclar ramas

La rama actual `research/itrofill-mongen-primary-authority` contiene investigación cultural/conceptual además de la línea ecológica.

No es recomendable convertirla directamente en rama de implementación.

La implementación debe partir de `main` y portar únicamente los contratos finales pertinentes.

Esto evita que la migración botánica arrastre documentación de investigación no necesaria para ejecutar el cambio.

## 10. AUDITORÍA

Todos los componentes necesarios para comenzar una implementación controlada están identificados.

Los OPEN restantes pertenecen a:

- población editorial posterior;
- interoperabilidad futura;
- mejoras fuera de alcance.

No existe un OPEN conceptual que impida construir y probar el esquema vacío.

## 11. INCONSISTENCIAS

No se detecta inconsistencia material entre:

- contrato R2;
- versionado;
- vocabulario territorial;
- pipeline vigente;
- arquitectura de datos.

La única precaución estructural es no usar la rama de investigación como rama de producción.

## 12. VACÍOS / OMISIONES

Antes de merge permanecen pendientes:

- implementación real;
- ejecución de tests;
- inspección del diff del XLSX;
- auditoría post-migración;
- revisión de CI;
- decisión explícita de integración.

Antes de DATA POPULATION permanece pendiente:

- verificación directa de cada fuente;
- creación de hechos ecológicos;
- revisión editorial;
- versión editorial resultante.

## 13. REDUNDANCIAS

No se requiere:

- segundo Master;
- segundo catálogo territorial;
- segundo motor;
- JSON manual;
- SQLite ecológico en esta fase.

## 14. Gate final

```text
RESEARCH SUFFICIENT FOR IMPLEMENTATION: PASS
FINAL CONTRACT IDENTIFIED: PASS
VERSION BINDINGS: PASS WITH OPEN
TERRITORIAL CONTRACT: PASS WITH OPEN
IMPLEMENTATION SURFACE COMPLETE: PASS
TEST SURFACE COMPLETE: PASS
BRANCH ISOLATION REQUIREMENT: PASS
SCHEMA-ONLY IMPLEMENTATION: AUTHORIZED
REAL ECOLOGY DATA POPULATION: BLOCKED
MERGE TO MAIN: BLOCKED PENDING IMPLEMENTATION + TESTS + AUDIT
```

## 15. Próximo paso

Crear una rama de implementación limpia desde `main` para la migración de esquema vacío.

La primera iteración ejecutable debe limitarse a:

```text
controlled vocabulary
+ DV checker
+ XLSX schema
+ export contract
+ empty species_ecology.json
+ validators/tests
```

sin poblar todavía información ecológica real.
