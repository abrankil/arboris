Árboris — Data Model

Versión: 0.2
Última actualización: 15 septiembre 2026
Alcance: modelo de dominio del Piloto 1.0

1. Propósito

Este documento define el modelo conceptual de datos de Árboris.

No constituye todavía un esquema físico definitivo de SQLite ni prescribe todas las tablas, columnas, índices o relaciones de almacenamiento.

Su función es establecer qué objetos existen en el dominio, qué significan y qué relaciones deben preservarse cuando se implemente la persistencia.

La arquitectura debe permitir modificar la tecnología de almacenamiento sin alterar estos conceptos.

2. Principio fundamental

La unidad fundamental del registro científico de Árboris es la observación real.

El modelo central es:

Species
   ↓
Individual
   ↓
Observation
   ↓
Evidence
   ↓
Identification

Estos objetos no son equivalentes.

Una fotografía no es una observación.

Una identificación no es una especie.

Una observación no es un desbloqueo.

Una identificación no debe sobrescribir la evidencia que permitió formularla.

3. Species

Species representa una entidad biológica/taxonómica incluida en el catálogo de Árboris.

Para el Piloto 1.0 existen seis especies:

SP001 — Cryptocarya alba — Peumo
SP002 — Lithraea caustica — Litre
SP003 — Kageneckia oblonga — Bollén
SP004 — Podanthus mitiqui — Mitique
SP005 — Colliguaja odorifera — Colliguay
SP006 — Quillaja saponaria — Quillay

Una especie puede relacionarse con información taxonómica, nombres comunes, caracteres botánicos, distribución, hábitat, fenología, fuentes, individuos, observaciones, identificaciones, contenido educativo y personaje jugable.

La ficha científica y el personaje jugable no forman parte del mismo objeto.

4. Species ID

Los datos editoriales y el runtime utilizan actualmente representaciones distintas del identificador:

SP-001 ↔ SP001
SP-002 ↔ SP002
...
SP-006 ↔ SP006

Esta diferencia está validada y debe resolverse mediante una transformación explícita y determinista.

No deben generarse nuevas variantes manuales de los identificadores.

5. Individual

Individual representa un organismo físico concreto que puede ser observado más de una vez.

Ejemplo:

Species: Lithraea caustica
Individual: LC002

El objeto permite distinguir variación entre individuos de la misma especie.

Un individuo puede acumular múltiples observaciones realizadas en fechas diferentes, durante distintos estados fenológicos, bajo distintas condiciones, desde distintos ángulos y con diferentes tipos de evidencia.

No todas las observaciones futuras requerirán necesariamente que el individuo pueda reconocerse nuevamente de forma inequívoca.

El modelo debe admitir observaciones cuyo individuo sea desconocido.

6. Observation

Observation representa un encuentro concreto con un organismo real en un lugar y momento determinados.

Es el núcleo del registro de terreno.

Una observación puede contener o relacionarse con individuo, fecha y hora, ubicación, precisión de ubicación, observador, contexto territorial, ecosistema, microhábitat, altitud, exposición, cobertura, pendiente, fenología, fotografías, caracteres observados, candidatos, identificaciones y notas.

No todos estos datos serán obligatorios.

Los datos desconocidos deben permanecer desconocidos.

No deben inventarse valores para completar un registro.

7. Evidence

Evidence representa una pieza de información utilizada para describir una observación o evaluar una hipótesis de identificación.

Puede provenir de diferentes fuentes.

Ejemplos:

photograph
user_observation
model_observation
botanical_character
location_context
ecological_context
phenology
expert_validation

Una observación puede contener múltiples evidencias.

La evidencia debe conservar su procedencia.

8. PhotographicEvidence

Una fotografía es un tipo de evidencia.

Debe poder relacionarse con:

Observation
    ↓
PhotographicEvidence

Una fotografía puede aportar evidencia sobre uno o varios caracteres.

Ejemplo:

Photo
 ├── CH-003 margin = entero
 ├── CH-005 underside = no_observable
 └── CH-011 shape = eliptica

La fotografía original debe preservarse aunque posteriormente cambien las interpretaciones derivadas de ella.

Una predicción de un modelo no debe reemplazar la fotografía que la originó.

9. BotanicalCharacter

BotanicalCharacter representa una característica botánica estructurada que puede ser utilizada para describir o discriminar especies.

La base botánica computable contiene actualmente 27 caracteres.

Cada carácter puede definir información como character_id, grupo, nombre, tipo de dato, estados permitidos, observabilidad en fotografía, observabilidad en terreno, dependencia fenológica, riesgo, invasividad y descripción.

Los caracteres pertenecen a la base botánica, no a un modelo de IA.

10. CharacterState

Un CharacterState representa un estado permitido de un carácter botánico.

Los estados válidos deben derivarse de la base botánica estructurada.

No deben crearse estados ad hoc dentro de la lógica de identificación.

11. CharacterEvidence

CharacterEvidence representa la afirmación de que un determinado carácter presenta un estado determinado en una observación.

Ejemplo:

Observation: OBS001
Character: CH-003
Value: entero
Source: user_observed
Evidence: IMG001

Debe ser posible registrar quién o qué realizó la observación, fotografía utilizada, método, incertidumbre, calidad, momento de generación y validación posterior.

12. Procedencia de la evidencia

Árboris debe distinguir explícitamente la procedencia.

Ejemplos conceptuales:

user_observed
model_observed
photo_derived
context_derived
expert_validated

Estos nombres todavía no constituyen un enum definitivo de implementación.

El principio sí es obligatorio:

Evidencia producida por mecanismos diferentes no debe volverse indistinguible después de almacenarse.

13. Unknown y Not Observable

Árboris debe representar explícitamente la incertidumbre.

Conceptualmente deben distinguirse:

known value
unknown
not observable
not evaluated
missing data

Estas situaciones no son equivalentes.

SIN DATO ≠ NO

NO PUEDO OBSERVARLO ≠ EL CARÁCTER ESTÁ AUSENTE

Una especie no debe ser eliminada porque su ficha no contenga información sobre un carácter.

14. Candidate

Candidate representa una especie considerada plausible durante un proceso de identificación.

Un candidato no es una identificación.

Puede provenir de BioCLIP, contexto territorial, clave botánica u otro mecanismo futuro.

Los scores visuales pueden almacenarse como información del método que los produjo, pero no constituyen evidencia botánica por sí mismos.

Un score de BioCLIP no debe interpretarse automáticamente como probabilidad taxonómica.

15. IdentificationSession

IdentificationSession representa el proceso mediante el cual Árboris intenta determinar la identidad de una observación.

Puede contener observación, candidatos iniciales, modelos utilizados, preguntas formuladas, respuestas, caracteres evaluados, evidencia, candidatos descartados, candidatos restantes, resultado e incertidumbre.

La sesión permite preservar el proceso y no solamente el resultado final.

16. Identification

Identification representa una hipótesis sobre la identidad taxonómica de una observación.

No debe tratarse como una verdad inmutable.

Una identificación puede tener estados conceptuales como:

confirmed
probable
tentative
unresolved

La nomenclatura definitiva puede modificarse durante la implementación.

Una identificación debe poder relacionarse con observación, especie propuesta, sesión de identificación, evidencia utilizada, método, nivel de confianza, fecha, autor/agente, versión y estado.

17. Historial de identificaciones

Una observación puede acumular más de una hipótesis a lo largo del tiempo.

La arquitectura debe permitir reconstruir qué se pensó inicialmente, qué evidencia existía, qué nueva evidencia apareció y por qué cambió la hipótesis.

El historial debe tender a un modelo append-only para eventos científicos relevantes.

18. AdaptiveQuestion

Una AdaptiveQuestion representa una solicitud de evidencia realizada por el sistema.

No constituye conocimiento botánico por sí misma.

Debe derivarse de:

active candidates
        +
botanical knowledge
        ↓
informative character
        ↓
question

La pregunta es una presentación de un carácter botánico.

La semántica científica debe permanecer en la base estructurada.

19. AdaptiveResponse

Una respuesta puede representar:

sí
no
no sé
no puedo observarlo

“No puedo observarlo” no debe eliminar candidatos.

20. VisualModelObservation

Los modelos visuales futuros deben generar observaciones restringidas de caracteres.

Conceptualmente:

Photo
  +
Requested BotanicalCharacter
        ↓
Visual model
        ↓
CharacterEvidence
or
NO_OBSERVABLE

El nombre del modelo, versión y configuración relevante deben poder conservarse.

El modelo no modifica directamente la ficha botánica de la especie.

21. Conocimiento botánico vs evidencia observacional

Árboris debe mantener separados el conocimiento estructurado sobre una especie y la evidencia observada en un organismo concreto.

Ejemplo de conocimiento:

Quillay
CH-003 = serrado

Ejemplo de evidencia:

OBS041
CH-003 = serrado
source = user_observed

Estas capas se comparan durante la identificación, pero no son el mismo dato.

22. Variación intraespecífica

El modelo debe permitir que una especie tenga más de un estado válido para determinados caracteres cuando la evidencia científica lo justifique.

Debe poder representarse:

Species
→ expected variation
→ multiple individuals
→ multiple observations
→ environmental context

La variación puede relacionarse con exposición, sombra, altitud, microhábitat, fenología, estación y otras condiciones.

23. Discovery

Discovery pertenece a la capa de juego.

Representa el evento en que el sistema considera que una especie ha sido descubierta por el jugador.

Conceptualmente:

Observation
    ↓
Identification
    ↓
evidence policy
    ↓
Discovery

La política exacta de evidencia necesaria para producir un descubrimiento todavía debe definirse.

Una identificación no produce necesariamente un desbloqueo de forma automática.

24. GameCharacter

GameCharacter representa el personaje lúdico inspirado en una especie.

Species
    ↓
GameCharacter

Pero:

Species ≠ GameCharacter

El personaje puede tener atributos de juego, progresión, variantes, capacidades, recursos gráficos, animaciones y estado de desbloqueo.

Estos datos no deben almacenarse dentro de la ficha científica de la especie.

25. Collection

Collection representa el estado lúdico de especies/personajes descubiertos por un jugador.

Puede derivarse de eventos Discovery.

La colección no sustituye el registro de observaciones.

Descubrir una especie una vez no elimina el valor de observarla nuevamente.

26. Relación general del dominio

                    Botanical knowledge
                           │
                           ▼
Species ───────── BotanicalCharacters
  │                        │
  ▼                        │
Individual                 │
  │                        │
  ▼                        │
Observation                │
  │                        │
  ├── Evidence ────────────┘
  │
  ├── Photos
  │
  └── IdentificationSession
            │
            ├── Candidates
            ├── AdaptiveQuestions
            ├── Responses
            ├── CharacterEvidence
            │
            ▼
       Identification
            │
            │ sufficient evidence
            ▼
         Discovery
            │
            ▼
        Collection
            │
            ▼
       GameCharacter

27. Fuente botánica de verdad

Los datos científicos editoriales siguen el flujo:

Base_botanica_Pokedex_flora_Master.xlsx
        ↓
validation
        ↓
data/botanical/*.json
        ↓
data/species/SP001...SP006.json
        ↓
runtime systems

La Master es la fuente científica/editorial de verdad.

Los JSON y objetos runtime son derivados computables.

No deben convertirse en bases editoriales paralelas.

28. Relación actual con la clave adaptativa

Actualmente logic.mjs contiene todavía una representación manual de parte del conocimiento de las seis especies.

El Hito 15 eliminará progresivamente esta duplicación.

Flujo objetivo:

Master
   ↓
botanical JSON
   ↓
species JSON
   ↓
species_adapter.mjs
   ↓
adaptive key

Mapeo inicial:

margin     ← CH-003
glands     ← CH-017
venation   ← CH-008
underside  ← CH-005

Las equivalencias deben validarse antes de conectar automáticamente los datos.

29. Persistencia local

Árboris es offline-first.

La aplicación móvil utilizará SQLite mediante expo-sqlite para los datos estructurados que requieran persistencia local.

Este documento no define todavía una correspondencia 1:1 entre objetos de dominio y tablas SQLite.

Esa decisión se tomará cuando el flujo end-to-end del piloto determine qué entidades necesitan persistencia, qué relaciones son necesarias, qué datos son derivados, qué información puede regenerarse, qué historial debe conservarse y qué consultas requiere la aplicación.

30. Datos fuente y datos derivados

Debe distinguirse entre datos fuente y datos derivados.

Datos fuente son aquellos que no pueden reconstruirse fácilmente, como observaciones reales, fotografías originales, respuestas del usuario, ubicación registrada, evidencia y validación humana.

Datos derivados pueden incluir candidatos de un modelo, embeddings, features, scores, índices y representaciones runtime derivadas de la Master.

Los datos derivados no deben convertirse accidentalmente en la única copia de la información fuente.

31. Versionado

Debe ser posible conocer qué versión de un componente produjo una inferencia relevante.

Ejemplos:

botanical_data_version
key_version
model_name
model_version
identification_logic_version

No es necesario implementar todos estos campos inmediatamente.

El modelo debe evitar decisiones que hagan imposible incorporar esa trazabilidad posteriormente.

32. Privacidad y ubicación

Las observaciones pueden contener información geográfica.

El modelo futuro deberá distinguir entre ubicación necesaria para funcionamiento, ubicación científica, ubicación mostrada públicamente y ubicación sensible.

La política de privacidad y publicación todavía no está definida.

No debe asumirse que todas las coordenadas registradas serán públicas.

33. Decisiones todavía abiertas

Permanecen abiertos:

esquema físico definitivo de SQLite;

nombres finales de tablas;

cardinalidades exactas de implementación;

política exacta de desbloqueo;

modelo de usuario/cuenta;

sincronización;

conflictos entre dispositivos;

backend;

exportación científica;

interoperabilidad Darwin Core;

tratamiento de ubicaciones sensibles;

política de revisión experta;

esquema definitivo de confianza;

retención de fotografías;

formato final de paquetes territoriales.

Estas decisiones deben resolverse cuando sean necesarias para el piloto.

No deben diseñarse anticipadamente solo para completar el modelo.

34. Regla de implementación

Antes de crear una nueva entidad, tabla o relación debe existir un caso real del piloto que la necesite.

El modelo de dominio debe mantenerse suficientemente expresivo para preservar:

observación + evidencia + incertidumbre + procedencia + historial

sin convertir el Piloto 1.0 en una infraestructura para funcionalidades que todavía no existen.

Estado actual

Modelo conceptual: definido.

Fuente botánica: consolidada para las seis especies piloto.

Datos computables: disponibles.

Persistencia completa del modelo: pendiente.

Prioridad inmediata: Hito 15 — conectar las fichas computables con la clave adaptativa sin duplicar conocimiento botánico.