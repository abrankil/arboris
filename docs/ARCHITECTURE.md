# Árboris — Architecture

**Versión:** 0.5  
**Última actualización:** 17 septiembre 2026  
**Alcance:** Piloto 1.0

## 1. Propósito

Árboris es un juego de exploración, aprendizaje y colección de flora nativa chilena basado en observaciones del mundo real.

La arquitectura debe sostener simultáneamente una experiencia lúdica de descubrimiento y una representación científica basada en evidencia, contexto, incertidumbre y trazabilidad.

La identificación asistida es una mecánica central, no el producto completo.

## 2. Regla arquitectónica principal

La arquitectura debe separar claramente:

1. conocimiento botánico;
2. observaciones reales;
3. evidencia;
4. hipótesis de identificación;
5. lógica de identificación;
6. modelos automáticos;
7. estado de juego;
8. presentación.

Ningún modelo de IA constituye por sí mismo autoridad taxonómica.

## 3. Fuente de conocimiento botánico

La fuente editorial y científica principal del piloto es:

```text
data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx
```

El Master Botánico 2.0 se exporta a ocho JSON canónicos:

```text
data/botanical/metadata.json
data/botanical/species.json
data/botanical/characters.json
data/botanical/species_characters.json
data/botanical/sources.json
data/botanical/glossary.json
data/botanical/photos.json
data/botanical/model_errors.json
```

Estos ocho archivos son derivados reproducibles, no fuentes editoriales paralelas.

Las fichas de `data/species/` también son derivadas y existen como vistas completas por especie para consumo humano, IA, interfaz y dirección de arte.

ACE utiliza además una capa complementaria explícita:

```text
data/botanical/character_variability.json
data/botanical/contexts.json
```

Estos archivos no son exportaciones del Master Botánico 2.0 ni reemplazan sus relaciones canónicas. Representan variabilidad natural documentada y los contextos explícitos que permiten interpretarla dentro de ACE. Cada entrada de variabilidad debe conservar procedencia mediante un `fuente_id` válido de `data/botanical/sources.json`.

## 4. Arquitectura de datos botánicos

```text
Master Botánico 2.0
        ↓
export_master.py
        ↓
8 JSON canónicos
        ↓
validate_master_export.py
        ↓
build_species_data.py
        ↓
6 fichas por especie
        ↓
validate_species_data.py
        ↓
ACE
```

Estado del Master 2.0:

- 6 especies;
- 24 caracteres totales;
- 19 activos/computables;
- 4 retirados;
- 1 pendiente de revisión;
- 89 relaciones especie–carácter;
- 45 fotografías.

Los caracteres retirados se conservan por trazabilidad, pero no participan en identificación computable.

La capa de variabilidad y contextos es complementaria al Master y no reemplaza sus relaciones canónicas.

## 5. Modelo conceptual compartido

La observación real constituye la fuente primaria del registro de terreno.

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

Una identificación puede cambiar sin destruir la observación ni la evidencia que la originó.

## 6. Motor de identificación canónico: ACE

Hito 15 consolidó el motor canónico de identificación por caracteres:

```text
tools/canonical-identification/
  dataset.mjs
  engine.mjs
  engine.test.mjs
```

El motor se denomina **ACE — Arboris Character Evidence Engine / Motor de Evidencia por Caracteres Árboris**.

ACE consume datos botánicos estructurados, no fichas antiguas ni conocimiento botánico hardcodeado.

```text
JSON botánico canónico
        +
variabilidad/contextos documentados
        ↓
loadCanonicalDataset()
        ↓
filterCandidates()
        ↓
nextCharacter()
        ↓
retryCharacter() cuando corresponde
        ↓
assessIdentification()
```

El JSON contiene conocimiento. ACE contiene comportamiento. La sesión contiene observaciones y evidencia.

ACE no debe contener reglas específicas del tipo “Peumo tiene X” o “Quillay tiene Y”.

## 7. Compatibilidad botánica

Una observación solo elimina un taxón cuando existe incompatibilidad explícita entre estados conocidos.

```text
expected vacío → neutral
observed vacío → neutral
observed unknown/not_observable/not_applicable → neutral
intersección(expected, observed) ≠ ∅ → compatible
intersección(expected, observed) = ∅ → incompatibilidad explícita
```

`sin dato` nunca equivale a ausencia.

Una contradicción cubierta por una entrada válida de variabilidad natural documentada se considera inconcluyente para ese candidato y no lo elimina. Sin la excepción documentada correspondiente, una contradicción continúa siendo un conflicto explícito.

No existe un contador genérico de contradicciones permitidas.

## 8. Variabilidad natural y contextos

ACE utiliza:

```text
data/botanical/character_variability.json
data/botanical/contexts.json
```

Cada entrada de variabilidad debe:

- referenciar una especie canónica existente;
- referenciar un carácter canónico activo;
- corresponder a una relación especie–carácter canónica existente;
- declarar un estado alternativo válido;
- referenciar un contexto existente cuando corresponda;
- declarar `fuente_id`;
- referenciar un `fuente_id` existente en `data/botanical/sources.json`.

Una referencia inválida produce un error explícito de carga. La variabilidad documentada no modifica silenciosamente la relación canónica base.

Caso canónico inicial:

```text
species_id:         SP-002
caracter_id:        CH-008
estado alternativo: ausente
contexto:           hojas_de_sombra
frecuencia:         baja
fuente_id:          F-004
```

`F-004` corresponde a un **Registro de terreno**. Esta procedencia complementa el conocimiento canónico; no se presenta como exportación del Master ni como publicación bibliográfica.

## 9. Clave adaptativa

La clave no debe ser un árbol rígido ni una segunda base botánica. Su función es decidir qué carácter conviene obtener a continuación y cómo adquirir esa evidencia.

```text
candidatos activos
        ↓
caracteres activos no observados
        ↓
seleccionar carácter informativo
        ↓
¿evidencia existente?
        ↓
Sí → usarla
No → intentar obtener evidencia
        ↓
¿observable con confianza?
        ↓
Sí → registrar evidencia
No → solicitar foto o preguntar al usuario
```

La pregunta de interfaz puede estar asociada a un `CH-xxx`, pero no debe contener estados esperados por especie.

## 10. Selección del siguiente carácter

Para el piloto de seis especies, una estrategia simple es suficiente.

La implementación actual minimiza el peor caso de candidatos restantes y desempata considerando:

- cantidad de especies en el grupo conocido más grande;
- cantidad de candidatos con dato desconocido;
- cantidad de grupos conocidos;
- poder diagnóstico;
- observabilidad en imagen;
- costo de observación;
- seguridad de interacción;
- orden estable por `characterId`.

El poder diagnóstico se utiliza para priorizar caracteres. No puede utilizarse para reducir el requisito mínimo de evidencia necesario para `supported`.

No se requiere un motor de reglas externo complejo mientras unas pocas funciones puras resuelvan el problema.

## 11. Evidencia mínima de sesión

El núcleo acepta evidencia simple por carácter:

```js
[
  { characterId: 'CH-003', observedStates: ['serrado'], source: 'human' }
]
```

o como objeto:

```js
{ 'CH-003': 'serrado' }
```

Esta evidencia es suficiente para probar compatibilidad, descarte de candidatos y selección del siguiente carácter. La persistencia formal de sesiones se implementa después.

## 12. Evaluación de identificación

ACE puede devolver estados cautelosos:

- `unresolved`;
- `ambiguous`;
- `tentative`;
- `supported`.

`supported` es un estado de evidencia y no una declaración de certeza absoluta.

Para alcanzar `supported` deben cumplirse simultáneamente:

1. queda exactamente un candidato compatible;
2. existen al menos dos dimensiones independientes y evaluables.

Para Hito 15, la independencia se determina por `characterId`. Repetir el mismo carácter no crea una segunda dimensión, aunque cambien fotografía, fuente o intento.

Los estados desconocidos o no evaluables no cuentan para este mínimo.

Esta noción de dimensión **evaluable** para `supported` es distinta del estado **resolved** del ciclo de retry. En retry, un carácter está `resolved` únicamente cuando su evidencia reduce efectivamente el conjunto de candidatos.

## 13. Estado de caracteres y reintentos

ACE distingue entre:

- `visible`;
- `attempted`;
- `resolved`.

Un carácter `attempted` ha recibido una respuesta, incluso si esta es desconocida o no evaluable.

Un carácter `resolved` produjo una reducción efectiva del conjunto de candidatos.

Un carácter intentado pero no resuelto:

- no se ofrece nuevamente de forma automática;
- puede reintentarse mediante una acción explícita;
- no tiene límite de reintentos;
- no caduca por tiempo ni por número de intentos.

Un carácter resuelto es terminal y no puede reintentarse.

`retryCharacter(...)` implementa el reintento explícito. El estado de resolución se deriva de la comparación del conjunto de candidatos antes y después de aplicar la evidencia del carácter.

La interfaz del retry queda fuera del alcance de ACE.

## 14. Robustez de `candidateIds`

ACE aplica reglas deterministas:

- `null` representa todas las especies canónicas;
- una lista explícita se deduplica conservando el primer orden observado;
- un ID desconocido produce un error explícito;
- `[]` representa un conjunto vacío;
- la normalización es compartida por las operaciones del motor;
- ACE no realiza la conversión histórica `SP001 → SP-001`.

Los IDs canónicos son `SP-001` … `SP-006`. Los formatos históricos `SP001` … `SP006` existen únicamente por compatibilidad con prototipos antiguos.

## 15. Unicidad de relaciones especie–carácter

La pareja `(species_id, caracter_id)` debe ser única entre las relaciones canónicas computables.

Cualquier duplicado es un error fatal, incluso cuando las relaciones sean idénticas. ACE no aplica `merge`, `last-write-wins` ni `first-write-wins`.

El error identifica ambos IDs. La capa de variabilidad tampoco puede utilizarse para crear implícitamente una nueva relación especie–carácter.

## 16. Modelos visuales y generación de candidatos

Los modelos visuales no forman parte del núcleo ACE. Pueden actuar como productores auxiliares de candidatos o evidencia, pero sus resultados no constituyen por sí solos una identificación definitiva ni autoridad botánica.

ACE debe poder operar y probarse independientemente de esos modelos.

La incorporación futura de visión por computador o extracción automática de caracteres queda fuera del alcance de Hito 15. Su ubicación y alcance en el roadmap deben definirse explícitamente antes de iniciar el siguiente hito del frente de identificación.

## 17. Observación, evidencia e identificación

La arquitectura debe distinguir:

- fotografía original;
- carácter observado;
- estado observado;
- fuente de la observación;
- candidato;
- hipótesis final;
- historial de revisión.

Una corrección posterior no debe borrar el proceso previo. Una identificación puede modificarse sin destruir la observación ni su evidencia original.

## 18. Seguridad

La adquisición de evidencia prioriza métodos observacionales y no destructivos.

Mientras *Lithraea caustica* sea candidata, el sistema no debe pedir frotar, triturar ni oler hojas.

La seguridad prevalece sobre el valor diagnóstico.

## 19. Offline-first

La lógica central de identificación debe poder ejecutarse sin servidor.

ACE debe poder probarse de forma independiente de UI y modelos visuales.

La app móvil utiliza Expo/React Native y prevé SQLite mediante `expo-sqlite` para persistencia local.

## 20. Dirección de arte

La capa gráfica utiliza datos científicos sin mezclarlos con decisiones lúdicas.

```text
Master Botánico 2.0 — autoridad científica/editorial principal
        ↓
data/species/ — vista completa por especie
        ↓
fotografías reales — evidencia visual
        ↓
data/characters/ — decisiones y assets lúdicos
```

Una decisión de personaje no modifica conocimiento botánico.

Durante la próxima fase, Dirección de Arte no rediseña el canon base. Trabaja solo en derivados de personajes, blockouts de mapa y pruebas ambientales pequeñas.

## 21. Componentes legacy

Existen componentes experimentales anteriores a Master 2.0, incluidos adaptadores, lógica hardcodeada y claves fijas.

No deben usarse para definir nuevas funciones canónicas. Se conservan por trazabilidad y comparación mientras los flujos nuevos cubren las funciones necesarias.

## 22. Prioridad arquitectónica actual

Hito 15 consolidó el núcleo verificable de ACE para identificación por caracteres.

Antes de iniciar el siguiente hito del frente de identificación deben completarse el cierre de auditoría de Hito 15, el gate integrado final y la consolidación de la rama en `main`.

La definición del siguiente hito —incluida cualquier incorporación de visión por computador— se mantiene fuera de este cierre y debe reconciliarse explícitamente con `docs/ROADMAP.md`.

## 23. Criterio de simplicidad

Árboris debe diseñarse para el piloto real de seis especies.

Orden de prioridad:

```text
correctitud
→ trazabilidad
→ simplicidad
→ testabilidad
→ offline-first
→ extensibilidad razonable
```

No se debe diseñar anticipadamente para cientos de especies si ello aumenta innecesariamente la complejidad del piloto.

El objetivo no es construir más visión artificial que la necesaria.

ACE debe mantenerse como un motor de comportamiento pequeño, determinista y verificable, mientras el conocimiento botánico permanece en los datos botánicos estructurados.
