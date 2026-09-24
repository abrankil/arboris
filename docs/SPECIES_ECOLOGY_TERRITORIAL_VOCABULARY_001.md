# Árboris — Gate de vocabulario territorial para ecología de especie

**Estado:** decisión técnica candidata / no ejecutada  
**Gate:** SPECIES-ECOLOGY-TERRITORIAL-VOCABULARY-001  
**Fecha:** 23 septiembre 2026  
**Ámbito:** definir el vocabulario territorial de `distribucion_geografica` antes de modificar Master Botánico 2.0.

## 1. Pregunta

> ¿Qué significan exactamente códigos como `COQ`, `RME`, `LBO`, `NUB` o `ARA`, quién tiene autoridad sobre ellos y cómo deben usarse en Árboris?

## 2. Autoridad encontrada

La autoridad primaria para estos códigos es el:

**Rodríguez et al. (2018), Catálogo de las plantas vasculares de Chile, Gayana Botánica 75(1): 1–430**, desarrollado por investigadores de la Universidad de Concepción y otras instituciones.

El artículo declara que la distribución geográfica se actualizó conforme a la división territorial usada por el catálogo y que cada área se representa mediante un acrónimo en su Tabla 1.

El sitio vigente del Catálogo de Plantas de la Universidad de Concepción expone el mismo sistema en su búsqueda por `Distribución Regional`.

## 3. Hallazgo conceptual

Los códigos NO deben modelarse como:

```text
“códigos oficiales administrativos de Chile”
```

porque el vocabulario del catálogo incluye, además de regiones continentales, áreas insulares botánicamente diferenciadas como:

- Rapa Nui;
- Juan Fernández;
- Islas Desventuradas.

Por tanto, el nombre correcto del vocabulario dentro de Árboris debe reflejar su procedencia:

```text
UDEC_VASCULAR_CATALOG_DISTRIBUTION_AREA_2018
```

Nombre de contrato candidato:

```text
arboris.udec-vascular-catalog.distribution-area.v1
```

No se presenta como ISO, SUBDERE, INE ni división administrativa general.

## 4. Vocabulario completo autorizado por la fuente

| código | área según Catálogo UdeC |
| --- | --- |
| AYP | Arica y Parinacota |
| TAR | Tarapacá |
| ANT | Antofagasta |
| ATA | Atacama |
| COQ | Coquimbo |
| VAL | Valparaíso |
| RME | Metropolitana |
| LBO | O'Higgins |
| MAU | Maule |
| NUB | Ñuble |
| BIO | Biobío |
| ARA | Araucanía |
| LRI | Los Ríos |
| LLA | Los Lagos |
| AIS | Aysén |
| MAG | Magallanes |
| IPA | Rapa Nui |
| JFE | Juan Fernández |
| IDE | Islas Desventuradas |

Este conjunto se toma como vocabulario cerrado **para hechos codificados bajo esta autoridad**.

## 5. Namespace

Para evitar interpretar los acrónimos como universales:

```text
namespace:
arboris.udec-vascular-catalog.distribution-area.v1
```

Semántica:

> código de área de distribución usado por el Catálogo de las plantas vasculares de Chile / Catálogo de Plantas UdeC para representar distribución regional/insular.

En R2 no es necesario agregar un campo `namespace` por fila mientras:

1. `dimension = distribucion_geografica` tenga exactamente este vocabulario;
2. el contrato documente explícitamente la autoridad;
3. no se admita otro sistema de códigos en `valor_codificado`.

Si en el futuro se necesita otro sistema territorial, deberá abrirse un nuevo gate y entonces sí reconsiderar un campo de namespace por hecho.

## 6. Regla de normalización

Una fuente que ya utiliza estos códigos puede representarse directamente.

Ejemplo:

```text
COQ, VAL, RME, LBO, MAU, NUB
→
["COQ", "VAL", "RME", "LBO", "MAU", "NUB"]
```

No se modifica el significado del dato.

Una fuente que usa nombres completos puede mapearse a estos códigos sólo si la correspondencia es inequívoca y preserva el mismo nivel territorial.

Ejemplo seguro:

```text
“Región de Coquimbo”
→ COQ
```

## 7. Normalizaciones prohibidas sin gate adicional

No convertir automáticamente:

- provincias;
- comunas;
- localidades;
- cuencas;
- parques;
- coordenadas;
- ecorregiones;
- pisos vegetacionales;
- macrozonas;
- “Chile central”;
- “zona mediterránea”;

a códigos UdeC de distribución regional.

Tampoco:

```text
Rapa Nui → VAL
Juan Fernández → VAL
Islas Desventuradas → VAL
```

aunque administrativamente exista relación con la Región de Valparaíso.

El catálogo las mantiene como áreas de distribución separadas y Árboris debe preservar esa semántica cuando use este vocabulario.

## 8. Orden

El orden canónico del vocabulario será el orden presentado por el Catálogo:

```text
AYP
TAR
ANT
ATA
COQ
VAL
RME
LBO
MAU
NUB
BIO
ARA
LRI
LLA
AIS
MAG
IPA
JFE
IDE
```

Para identidad semántica y comparación, el validador puede normalizar una colección al orden canónico anterior.

No ordenar alfabéticamente si la salida destinada a humanos busca preservar la secuencia territorial del catálogo.

## 9. Cobertura piloto

Las fuentes actuales del piloto utilizan subconjuntos del vocabulario.

Ejemplos ya registrados:

```text
Mitique:
COQ VAL RME LBO MAU NUB

Colliguay:
ANT ATA COQ VAL RME LBO MAU BIO

Quillay:
COQ VAL RME LBO MAU NUB BIO ARA
```

Que una especie no incluya un código significa únicamente que la fuente citada no la registra allí dentro de ese hecho de distribución.

No debe reinterpretarse como imposibilidad absoluta de observación fuera del rango documentado.

## 10. Uso en identificación

En la fase actual:

```text
species_ecology.distribucion_geografica
→ conocimiento contextual
→ NO ACE filter
```

La distribución no elimina candidatos automáticamente.

Usarla como evidencia de identificación requeriría un gate posterior específico sobre:

- completitud;
- actualidad;
- introducciones/cultivo;
- incertidumbre;
- observaciones fuera de rango;
- privacidad de ubicación.

## 11. Cambios requeridos en la propuesta R2

El validador puede definir como payload autorizado:

```text
ALLOWED_UDEC_DISTRIBUTION_CODES =
AYP TAR ANT ATA COQ VAL RME LBO MAU NUB BIO ARA LRI LLA AIS MAG IPA JFE IDE
```

pero esa constante es una **materialización ejecutable** del contrato documentado aquí, no una autoridad independiente.

El contrato de `distribucion_geografica` debe indicar:

```text
vocabulary_id =
arboris.udec-vascular-catalog.distribution-area.v1
```

No es necesario incorporar este vocabulario a `controlled_vocabularies.json` en R2 porque ese archivo gobierna actualmente valores de campos escalares/DV del XLSX. `valor_codificado` es un array serializado en una celda, cuya validación interna corresponde al validador específico de SpeciesEcologyFact.

Si se decide ofrecer una UI/DV específica para cada token del array dentro de Excel, requerirá diseño separado.

## 12. Fuente y vigencia

Autoridad de base:

```text
Rodríguez et al. 2018
Catálogo de las plantas vasculares de Chile
Gayana Botánica 75(1): 1–430
DOI: 10.4067/S0717-66432018000100001
```

Corroboración operativa:

```text
catalogoplantas.udec.cl
Búsqueda Detallada
Distribución Regional
```

El sitio actual muestra los mismos 19 códigos/áreas.

Árboris no debe describir el vocabulario como “regionalización oficial vigente de Chile” sin una autoridad administrativa adicional. Su autoridad aquí es botánica y fuente-específica.

## 13. AUDITORÍA

El vocabulario queda suficientemente definido para representar fielmente distribuciones provenientes del Catálogo UdeC.

Ventajas:

- autoridad identificada;
- lista completa;
- significado por código;
- áreas insulares preservadas;
- namespace conceptual explícito;
- no requiere convertir a otro sistema territorial;
- evita una normalización administrativa que podría perder información botánica.

## 14. INCONSISTENCIAS

Se corrige una formulación previa que hablaba genéricamente de “códigos territoriales chilenos”.

La formulación segura es:

```text
códigos de áreas de distribución del Catálogo de Plantas UdeC
```

## 15. VACÍOS / OMISIONES

Permanecen OPEN:

- interoperabilidad futura con códigos administrativos oficiales;
- tratamiento de fuentes que usan otras divisiones territoriales;
- distribución histórica vs. actual;
- escalas menores que región/área insular;
- ecorregiones y pisos vegetacionales.

Ninguno bloquea la representación de hechos provenientes del Catálogo UdeC.

## 16. REDUNDANCIAS

No se crea un segundo sistema administrativo de regiones.

Se conserva el vocabulario de la fuente botánica que ya sustenta hechos del piloto.

## 17. Gate

```text
SOURCE AUTHORITY: PASS
FULL CODE LIST: PASS
CODE MEANINGS: PASS
INSULAR AREAS: PASS
NAMESPACE: PASS
NORMALIZATION RULE: PASS
ADMINISTRATIVE-EQUIVALENCE CLAIM: PROHIBITED
ACE USE: BLOCKED
TERRITORIAL VOCABULARY GATE: PASS WITH OPEN
```

## 18. Consecuencia

Con este gate y el gate de versionado previamente resuelto:

```text
VERSION POLICY: PASS WITH OPEN
TERRITORIAL VOCABULARY: PASS WITH OPEN
```

ya no permanece un bloqueo conceptual previo a compilar la migración ejecutable.

Antes de modificar el XLSX debe realizarse un único gate de **migration readiness**, verificando que todos los artefactos, tests y cambios atómicos requeridos estén enumerados y no exista otro bloqueo material.
