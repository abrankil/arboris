# Árboris — Data Model

**Versión:** 0.3  
**Última actualización:** 16 septiembre 2026  
**Alcance:** Piloto 1.0

## 1. Propósito

Este documento define el modelo conceptual de datos de Árboris. No constituye todavía un esquema físico definitivo de SQLite.

La arquitectura debe separar conocimiento botánico, observaciones reales, evidencia, hipótesis de identificación y capa lúdica.

## 2. Fuente botánica canónica

La única fuente editorial y científica de verdad del piloto es:

`data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx`

El Master Botánico 2.0 contiene el conocimiento científico estructurado del piloto.

Los nueve JSON de `data/botanical/` son derivados reproducibles:

```text
metadata.json
species.json
characters.json
species_characters.json
sources.json
glossary.json
photos.json
model_errors.json
species_ecology.json
```

Las seis fichas de `data/species/` también son derivadas y se generan desde esos JSON. No deben editarse manualmente como una segunda fuente de verdad.

Flujo:

```text
Master Botánico 2.0
        ↓
data/botanical/*.json
        ↓
data/species/SP001...SP006.json
        ↓
runtime / UI / dirección de arte / identificación
```

## 3. Modelo conceptual central

La unidad fundamental del registro científico es la observación real:

```text
Species
   ↓
Individual
   ↓
Observation
   ↓
Evidence
   ↓
Identification
```

Una fotografía no es una observación. Una identificación no es una especie. Una identificación no debe sobrescribir la evidencia que la originó.

## 4. Species

`Species` representa una entidad biológica/taxonómica incluida en el catálogo.

Piloto:

| ID canónico | Compatibilidad histórica | Especie |
| --- | --- | --- |
| SP-001 | SP001 | *Cryptocarya alba* — Peumo |
| SP-002 | SP002 | *Lithraea caustica* — Litre |
| SP-003 | SP003 | *Kageneckia oblonga* — Bollén |
| SP-004 | SP004 | *Podanthus mitiqui* — Mitique |
| SP-005 | SP005 | *Colliguaja odorifera* — Colliguay |
| SP-006 | SP006 | *Quillaja saponaria* — Quillay |

Los nuevos componentes botánicos deben utilizar `SP-00X`. `SP00X` permanece solo como compatibilidad con componentes históricos.

## 5. BotanicalCharacter

`BotanicalCharacter` representa un carácter científico estructurado del Master 2.0.

Estado actual del catálogo:

- 24 caracteres totales;
- 19 activos/computables;
- 4 retirados;
- 1 pendiente de revisión.

Un carácter puede incluir grupo, nombre, tipo de dato, estados permitidos, observabilidad, dependencia fenológica, seguridad, costo y otras propiedades definidas por el Master.

Los caracteres retirados se conservan por trazabilidad, pero no deben participar en el motor de identificación.

## 6. SpeciesCharacter

`SpeciesCharacter` representa conocimiento esperado para una especie respecto de un carácter.

Conceptualmente:

```text
Species × BotanicalCharacter → ExpectedStates
```

El Master 2.0 contiene 89 relaciones especie–carácter para las seis especies del piloto.

Una relación puede contener uno o varios estados esperados y metadatos de variabilidad, confianza, fuente y notas.

Una relación inexistente o un valor vacío significa conocimiento no documentado, no ausencia botánica.

## 7. SpeciesEcologyFact

`SpeciesEcologyFact` representa conocimiento ecológico general documentado para una especie.

No describe las condiciones de una observación concreta.

Conceptualmente:

```text
Species
+ EcologyDimension
+ NormalizedPayload
+ Scope
+ Source(s)
→ SpeciesEcologyFact
```

La capa canónica se deriva del Master como:

```text
data/botanical/species_ecology.json
```

Reglas:

- todo hecho ecológico conserva procedencia mediante `fuente_ids`;
- ausencia de fila significa conocimiento no documentado, no ausencia biológica;
- sólo hechos `activo` son elegibles para fichas de consumo;
- ecología de especie no se copia automáticamente a `Observation`;
- `species_ecology.json` no alimenta ACE sin un gate específico posterior.

## 8. Estados botánicos vs estados de observación

Debe distinguirse estrictamente entre estados botánicos y estados operativos.

Estados como:

```text
unknown
not_observable
not_applicable
not_evaluated
```

no son estados botánicos de una especie.

Reglas:

- `sin dato` ≠ ausencia;
- `No sé` ≠ no;
- `No puedo observarlo` ≠ carácter ausente;
- `no aplica` describe aplicabilidad, no un estado morfológico.

## 9. Individual

`Individual` representa un organismo físico concreto. Permite registrar variación intraespecífica y reobservaciones.

Un individuo puede acumular múltiples observaciones en fechas, fenologías y condiciones ambientales distintas.

El modelo debe admitir observaciones cuyo individuo sea desconocido.

## 10. Observation

`Observation` representa un encuentro concreto con un organismo real en un lugar y momento determinados.

Puede relacionarse con fecha/hora, ubicación, individuo, contexto territorial, ecosistema, microhábitat, fenología, fotografías, caracteres observados, candidatos, identificaciones y notas.

Los datos desconocidos deben permanecer desconocidos.

## 11. Evidence

`Evidence` representa una pieza de información utilizada para describir una observación o evaluar una hipótesis.

Puede provenir de:

- fotografía;
- usuario;
- modelo visual;
- contexto geográfico/ecológico;
- fenología;
- validación experta;
- otro mecanismo trazable.

La procedencia debe conservarse.

## 12. PhotographicEvidence

Una fotografía es evidencia primaria y debe preservarse aunque cambien sus interpretaciones derivadas.

Una misma foto puede aportar evidencia para varios caracteres.

Una predicción automática nunca reemplaza la fotografía que la originó.

## 13. CharacterEvidence

`CharacterEvidence` afirma que, para una observación concreta, un carácter presenta uno o varios estados observados.

Ejemplo conceptual:

```text
Observation: OBS001
Character: CH-003
ObservedState: serrado
Source: user_observed
Evidence: IMG001
```

Debe poder conservar método, evidencia de origen, incertidumbre, calidad, fecha y validación posterior.

## 14. Candidate

`Candidate` representa una especie considerada plausible durante una sesión de identificación.

Un candidato no es una identificación.

BioCLIP puede ordenar candidatos, pero sus scores no constituyen evidencia botánica ni probabilidad taxonómica por sí mismos.

## 15. IdentificationSession

`IdentificationSession` representa el proceso de inferencia para una observación.

Puede contener:

- candidatos iniciales;
- evidencia utilizada;
- caracteres evaluados;
- preguntas formuladas;
- respuestas;
- candidatos descartados;
- candidatos restantes;
- explicación de incompatibilidades;
- resultado e incertidumbre.

La sesión debe ser reconstruible a partir de evidencia y eventos, sin depender de estados botánicos hardcodeados en el motor.

## 16. Motor de identificación

El motor debe consumir directamente los JSON canónicos del Master 2.0.

Su responsabilidad es algorítmica:

```text
loadDataset()
compatible()
filterCandidates()
scoreCharacter()
nextCharacter()
assessIdentification()
```

El motor no debe contener conocimiento específico de Peumo, Litre, Bollén, Mitique, Colliguay o Quillay.

Compatibilidad básica:

- expected desconocido → neutral;
- observation desconocida/no observable → neutral;
- expected y observed conocidos con intersección → compatible;
- expected y observed conocidos y disjuntos → incompatibilidad explícita.

## 17. AdaptiveQuestion

`AdaptiveQuestion` es una forma de solicitar evidencia, no conocimiento botánico independiente.

Debe derivarse de:

```text
candidatos activos
+
conocimiento canónico
+
evidencia existente
        ↓
carácter informativo
        ↓
forma de obtenerlo
```

La clave adaptativa debe preguntar solo cuando la información no pueda recuperarse con suficiente confianza de evidencia ya existente.

## 18. VisualModelObservation

Un modelo visual puede producir `CharacterEvidence` restringida a un carácter solicitado.

Debe poder abstenerse.

Ejemplo conceptual:

```text
Photo + CH-003
      ↓
visual model
      ↓
estado permitido
or
NO_OBSERVABLE
```

El modelo no modifica la ficha científica de la especie.

## 19. Identification

`Identification` representa una hipótesis revisable sobre la identidad de una observación.

Puede permanecer suficientemente respaldada, probable, tentativa o no resuelta.

Una observación puede acumular varias hipótesis a lo largo del tiempo. La corrección de una identificación no debe destruir su historia.

## 20. Discovery, Collection y GameCharacter

La capa lúdica permanece separada del conocimiento científico.

```text
Observation
   ↓
Identification
   ↓
evidence policy
   ↓
Discovery
   ↓
Collection
   ↓
GameCharacter
```

`Species ≠ GameCharacter`.

Los datos de juego no deben modificar la ficha científica.

## 21. Variación intraespecífica

La variación es un requisito de primera clase.

El modelo debe permitir múltiples estados esperados por especie, múltiples individuos, múltiples observaciones y contexto ambiental/fenológico.

No debe existir una única apariencia “típica” obligatoria por especie.

## 22. Datos fuente y datos derivados

Datos fuente incluyen observaciones reales, fotografías originales, respuestas humanas, ubicación registrada, evidencia y validaciones.

Datos derivados incluyen:

- JSON canónicos exportados desde Master 2.0;
- fichas de `data/species/`;
- candidatos de modelos;
- embeddings/features;
- scores;
- índices runtime.

Los derivados deben poder regenerarse o auditarse desde su fuente.

## 23. Persistencia y offline-first

Árboris es offline-first.

La persistencia móvil prevista utiliza SQLite mediante `expo-sqlite`.

El esquema físico definitivo debe derivarse de este modelo de dominio y del flujo end-to-end validado, no al revés.

## 24. Versionado y procedencia

Debe poder saberse qué versión produjo una inferencia relevante.

Conceptualmente pueden conservarse:

```text
master_version
schema_version
botanical_data_version
model_name
model_version
identification_logic_version
```

El Master 2.0 incluye metadata y SHA-256 de integridad para sus derivados canónicos.

## 25. Privacidad y ubicación

Las observaciones pueden contener información geográfica sensible.

El modelo futuro deberá distinguir ubicación necesaria para funcionamiento, ubicación científica, ubicación pública y ubicación sensible.

No debe asumirse que todas las coordenadas serán públicas.

## 26. Decisiones abiertas

Permanecen abiertos, entre otros:

- esquema físico definitivo de SQLite;
- política exacta de descubrimiento/desbloqueo;
- sincronización;
- backend;
- exportación científica;
- interoperabilidad Darwin Core;
- tratamiento de ubicaciones sensibles;
- política de revisión experta;
- formato final de paquetes territoriales.

Estas decisiones se resolverán cuando sean necesarias para cerrar el piloto, no anticipadamente.