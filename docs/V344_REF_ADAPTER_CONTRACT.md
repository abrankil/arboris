# Árboris — V3.44 → REF Adapter Contract

**ID:** `ARBORIS_V344_REF_ADAPTER_CONTRACT_V0_1`  
**Estado:** CANDIDATO A VALIDACIÓN ASC  
**Ámbito:** frontera entre el artefacto documental producido por `prompts/validated/graphic-references/V3.44.md` y `data/references/graphic_references.json`.  
**No autoriza:** análisis visual, promoción a `OBSERVED`/`RECURRENT`, reglas de arte, Scene Reference Brief, asignación manual de `REF-###` ni modificación de V3.44.

## 1. Objetivo

Definir una adaptación explícita y sin pérdida silenciosa entre una fuente `SRC-###` materializada por una ejecución V3.44 y el comando de incorporación REF V1.

La adaptación no convierte `SRC` y `REF` en entidades equivalentes. `SRC` es un registro dentro de un artefacto de investigación; `REF` es una identidad documental persistente del corpus.

Flujo autorizado:

```text
artefacto V3.44 preservado
→ SRC seleccionada
→ evaluación de elegibilidad
→ decisión documental de identidad
→ proyección REF
→ incorporate:reference
→ REF persistente
```

## 2. Precondición de provenance

La adaptación con provenance fuerte requiere un artefacto V3.44 preservado de forma estable con:

- `artifactId` estable;
- `sha256` exacto del artefacto;
- número de registro fuente estable dentro del artefacto.

Estos valores alimentan exclusivamente:

```text
registrationProvenance.sourceArtifact
registrationProvenance.sourceRecordNumber
```

No se inventan identificadores, hashes ni números de registro.

Si el artefacto no está preservado de forma estable, V1 permite ambos campos `null`, pero el adaptador debe emitir:

`PROVENANCE_STRENGTH = WEAK`

y no puede afirmar trazabilidad reversible completa.

## 3. Unidad de adaptación

Una ejecución adapta exactamente una `SRC-###`.

Los `CONT-##` no reciben `REF-###` propios por defecto. La identidad de piezas internas permanece vinculada al artefacto fuente mientras `reference-corpus` mantenga OPEN la identidad de piezas internas.

## 4. Elegibilidad

Una SRC sólo puede proponerse para incorporación cuando:

1. tiene título literal verificable;
2. tiene URL exacta recuperable;
3. `SOURCE_LOCATION = SUFICIENTE`;
4. `Identidad = VERIFICADA`;
5. la decisión documental de identidad REF puede expresarse como `new`, `existing` o `uncertain`;
6. ningún `NO_VERIFICADO` BLOCKING afecta título, localización o identidad necesarios para REF.

Estados:

```text
ELIGIBLE
INELIGIBLE
UNCERTAIN
```

`UNCERTAIN` debe detener la incorporación y mapearse a `identityDecision=uncertain`.

Una SRC `INELIGIBLE` no se degrada silenciosamente hasta hacerla aceptable.

## 5. Mapping autorizado

| V3.44 | REF V1 | Regla |
| --- | --- | --- |
| Título literal | `title` | copiar literalmente |
| URL exacta | `sourceUrl` | copiar exactamente |
| Origen / autor / entidad | `authorOrganization` | normalización explícita; si no existe valor suficiente, bloquear |
| Naturaleza + autoridad verificada | `sourceProvenance` | transformar mediante tabla controlada; no inferir por host |
| Tipo/medio + naturaleza | `unitType` | derivación declarada |
| naturaleza material | `resourceNature[]` | sólo valores respaldados por la SRC/CONT verificados |
| Relación documental | `documentaryRelation` | transformar mediante tabla controlada |
| Accesibilidad | `contentAccessibility` | transformar mediante tabla controlada |
| notas de procedencia verificadas | `provenanceNotes` | resumen documental, sin análisis |
| artefacto V3.44 | `registrationProvenance.sourceArtifact` | id + sha256 exactos o null |
| ordinal estable de SRC | `registrationProvenance.sourceRecordNumber` | sólo con sourceArtifact no-null |
| protocolo | `registrationProvenance.collectionProtocol` | `GRAPHIC_REFERENCE_COLLECTION_V3_44` |
| referente investigado | `registrationProvenance.collectionSubject` | copiar el referente de la ejecución |

El adaptador no asigna `refId`, `identityStatus` ni `canonicalRefId`. Son responsabilidad de `reference-corpus`.

## 6. Vocabularios que requieren decisión explícita

No existe equivalencia automática entre vocabularios V3.44 y REF V1.

Toda implementación debe declarar tablas cerradas para:

- V3.44 naturaleza/autoridad → `sourceProvenance`;
- V3.44 tipo/medio → `unitType`;
- V3.44 relación documental → `documentaryRelation`;
- V3.44 accesibilidad → `contentAccessibility`.

Si una entrada no tiene mapping autorizado:

`MAPPING_STATUS = UNRESOLVED`

y la adaptación falla antes de incorporación.

No usar un valor REF genérico para ocultar una incompatibilidad semántica.

## 7. Información que NO se aplana a REF

Los siguientes estados permanecen autoridad del artefacto V3.44 y no se copian como si REF V1 los representara:

- `CONT-##`;
- `INTRASOURCE_LOCATION`;
- estado de verificación;
- `NO_VERIFICADO`;
- `BLOCKING / NON_BLOCKING`;
- `AUDIOVISUAL_REVIEW_STATUS`;
- segmentos y timecodes;
- `EVID-###`;
- `SATURATION_STATUS`;
- cobertura documental/audiovisual;
- áreas pendientes;
- limitaciones;
- gate final de búsqueda.

Su ausencia en REF no significa que hayan sido resueltos, descartados o convertidos en positivos.

Cuando el consumidor necesite cualquiera de esos estados debe resolver la provenance hasta el artefacto V3.44 exacto.

## 8. Clasificación de transferencia

Cada dato material de la adaptación debe pertenecer a exactamente una clase:

```text
PERSIST
DERIVE
PRESERVE_BY_PROVENANCE
DO_NOT_TRANSFER
BLOCK_TRANSFER
```

- `PERSIST`: valor copiado al REF.
- `DERIVE`: valor REF producido mediante mapping explícito.
- `PRESERVE_BY_PROVENANCE`: permanece en el artefacto V3.44 y se recupera por provenance.
- `DO_NOT_TRANSFER`: no pertenece al contrato REF.
- `BLOCK_TRANSFER`: ausencia/incompatibilidad que impide incorporar.

No existe una categoría de descarte silencioso.

## 9. Identidad y duplicados

El adaptador no decide identidad por similitud de título, URL parcial o contenido visual.

La decisión debe ser:

- `existing`: se suministra un `existingRefId` activo;
- `new`: se construye un record candidato sin campos REF administrados;
- `uncertain`: no se escribe el corpus.

La asignación de REF y la resolución persistente de duplicados siguen siendo autoridad de `tools/reference-corpus/`.

## 10. Audiovisual

Una SRC audiovisual puede incorporarse como REF si cumple la elegibilidad documental aunque `AUDIOVISUAL_REVIEW_STATUS` no sea `VISIONADO`.

Eso no autoriza afirmar contenido intrínseco.

El adaptador no convierte metadatos, thumbnails, títulos o descripciones en `resourceNature` de contenido no verificado.

Los estados audiovisuales permanecen `PRESERVE_BY_PROVENANCE`.

## 11. NO_VERIFICADO

Todo `NO_VERIFICADO` debe conservar su semántica V3.44.

Si afecta un campo obligatorio para REF o la decisión de identidad:

`BLOCK_TRANSFER`.

Si es NON_BLOCKING para la incorporación:

`PRESERVE_BY_PROVENANCE`.

Nunca se convierte `NO_VERIFICADO` en valor REF positivo.

## 12. Salida conceptual del adaptador

```json
{
  "adapterVersion": "0.1.0",
  "source": {
    "artifactId": "...",
    "sha256": "...",
    "srcId": "SRC-001",
    "sourceRecordNumber": 1
  },
  "eligibility": "ELIGIBLE",
  "provenanceStrength": "STRONG",
  "identityDecision": "new",
  "existingRefId": null,
  "transferLedger": [],
  "incorporationInput": {
    "commandVersion": "1.0.0",
    "identityDecision": "new",
    "existingRefId": null,
    "record": {}
  }
}
```

Esta estructura es contrato conceptual V0.1; no modifica por sí sola el schema REF V1.

## 13. Fallos explícitos

La adaptación debe fallar antes de escribir cuando:

- falta título o URL requeridos;
- `SOURCE_LOCATION` no es suficiente;
- identidad V3.44 no está verificada;
- existe un `NO_VERIFICADO` BLOCKING para REF;
- un mapping obligatorio no está definido;
- se intenta inventar metadata;
- se intenta asignar manualmente `refId`;
- se intenta incorporar un `CONT-##` como REF sin un contrato posterior que lo autorice;
- provenance declarada STRONG no resuelve a artefacto + hash + registro exactos;
- el input resultante no satisface REF Incorporation Command V1.

## 14. Regresiones mínimas

```text
T-ADP-01
SRC elegible + mapping completo + provenance fuerte
→ input V1 válido

T-ADP-02
SOURCE_LOCATION insuficiente
→ BLOCK_TRANSFER

T-ADP-03
Identidad no individualizada
→ BLOCK_TRANSFER o identityDecision=uncertain
→ nunca NEW automático

T-ADP-04
NO_VERIFICADO material para identidad
→ BLOCK_TRANSFER

T-ADP-05
NO_VERIFICADO no material para REF
→ PRESERVE_BY_PROVENANCE
→ no valor positivo inventado

T-ADP-06
CONT/timecode verificado
→ no se aplana a REF
→ recuperable mediante provenance fuerte

T-ADP-07
audiovisual no visionado pero documentalmente elegible
→ REF posible
→ ningún claim intrínseco añadido

T-ADP-08
mapping de vocabulario inexistente
→ fallo explícito

T-ADP-09
existing
→ resuelve REF existente
→ no escritura

T-ADP-10
uncertain
→ no REF asignado
→ no escritura

T-ADP-11
new
→ adaptador no proporciona refId/identityStatus/canonicalRefId

T-ADP-12
artefacto no preservado
→ provenance WEAK
→ sourceArtifact/sourceRecordNumber null
→ nunca se declara reversibilidad completa

T-ADP-13
misma SRC + mismas tablas + mismo artefacto
→ misma proyección semántica antes de timestamps de incorporación

T-ADP-14
estados V3.44 fuera de REF
→ no se interpretan como resueltos por ausencia

T-ADP-15
salida del adaptador
→ validateCommandInput() PASS antes de incorporación
```

## 15. Gate V0.1

El contrato puede avanzar a implementación sólo cuando:

1. T-ADP-01..15 sean demostrables;
2. existan tablas cerradas de mapping para los vocabularios necesarios;
3. provenance fuerte tenga una representación estable real, o el caso WEAK permanezca explícitamente soportado;
4. no se modifique V3.44 FROZEN;
5. no se amplíe REF V1 sin una necesidad demostrada;
6. el diff pase el protocolo de revisión de `docs/DEVELOPMENT_MANUAL.md`;
7. `npm test` permanezca verde.

## AUDITORÍA

El contrato mantiene separadas la evidencia documental de V3.44 y la identidad persistente REF. La adaptación no convierte incorporación en análisis ni autorización artística y reutiliza REF Incorporation Command V1.

## INCONSISTENCIAS

V0.1 hace explícita la incompatibilidad parcial de vocabularios y evita asumir equivalencias no demostradas. Las tablas concretas permanecen pendientes y por ello este documento es candidato, no VALIDATED.

## VACÍOS / OMISIONES

Permanecen OPEN: tablas cerradas de mapping, formato canónico de preservación del artefacto V3.44, identidad de piezas internas CONT y consumidor analítico downstream.

## REDUNDANCIAS

No duplica el corpus REF ni los estados V3.44. Los datos no representables en REF permanecen en su artefacto de origen y se enlazan por provenance.
