# Árboris

Árboris es un juego de exploración, aprendizaje y colección de flora nativa chilena basado en observaciones del mundo real.

La identificación asistida es una mecánica dentro de una experiencia más amplia: explorar territorio real, encontrar plantas, observarlas, reunir evidencia, formular una identificación asistida, descubrir especies y avanzar en una colección con utilidad jugable.

Árboris no busca reemplazar la observación botánica mediante una identificación automática. La tecnología funciona como apoyo para que el usuario aprenda progresivamente a observar y reconocer la biodiversidad nativa.

## Piloto 1.0

El piloto inicial está deliberadamente limitado a una zona geográfica/ecológica y seis especies nativas:

- **Peumo** — *Cryptocarya alba*
- **Litre** — *Lithraea caustica*
- **Bollén** — *Kageneckia oblonga*
- **Mitique** — *Podanthus mitiqui*
- **Colliguay** — *Colliguaja odorifera*
- **Quillay** — *Quillaja saponaria*

El objetivo técnico inmediato es lograr un flujo completo y trazable desde una observación real hasta una hipótesis botánica asistida para estas seis especies.

## Ciclo principal

El ciclo conceptual de Árboris es:

**explorar → encontrar → observar → reunir evidencia → identificar de forma asistida → descubrir → coleccionar → jugar → volver a explorar**

La colección no es solamente un catálogo. Las especies descubiertas pueden dar acceso a personajes, contenido, capacidades, variantes y otras mecánicas de juego.

Árboris mantiene separados pero conectados tres objetos:

1. la especie biológica real;
2. su registro de conocimiento, observaciones y evidencia;
3. el personaje jugable inspirado en esa especie.

## Principio de identificación

La IA no constituye una autoridad taxonómica y no debe transformar una fotografía directamente en una identificación definitiva.

El sistema puede combinar:

- fotografías;
- candidatos visuales;
- caracteres botánicos observables;
- ubicación y contexto ecológico;
- distribución;
- época y fenología;
- evidencia acumulada;
- preguntas diagnósticas adaptativas.

El flujo conceptual es:

```text
Observación real
      ↓
Fotografía(s) + contexto
      ↓
Modelo visual/biológico
      ↓
Candidatos
      ↓
Árboris determina qué carácter botánico
puede discriminar entre los candidatos
      ↓
¿Existe evidencia suficiente?
      ↓
Sí → utilizarla
No → intentar observar el carácter automáticamente
      ↓
¿Puede observarse con suficiente confianza?
      ↓
Sí → incorporar la evidencia
No → preguntar al usuario o solicitar otra observación
      ↓
Hipótesis de identificación
      ↓
Evidencia + confianza + trazabilidad
```

`No sé` y `No puedo observarlo` son respuestas válidas.

La falta de información nunca debe transformarse automáticamente en evidencia negativa. La evidencia manda y las identificaciones son revisables.

## Datos botánicos

La fuente editorial y científica del piloto es:

`data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx`

El Master Botánico 2.0 contiene las especies, caracteres, estados botánicos, relaciones especie–carácter, fuentes, glosario y evidencia fotográfica del piloto.

Los formatos JSON y CSV derivados del Master deben generarse de forma reproducible y no mantenerse como una segunda fuente manual de verdad.

ACE utiliza como base principal el conocimiento botánico canónico derivado del Master Botánico 2.0. La variabilidad natural y sus contextos se mantienen en una capa complementaria explícita, separada de los derivados reproducibles del Master:

- `data/botanical/character_variability.json`
- `data/botanical/contexts.json`

Estos archivos complementarios no son exportaciones del Master Botánico 2.0 ni reemplazan sus relaciones canónicas. Las entradas de variabilidad deben conservar procedencia explícita mediante un `fuente_id` válido de `data/botanical/sources.json`.

Reglas fundamentales:

- vacío significa `sin dato`, no `ausente`;
- `no_se`, `no_observable` y `no_aplica` no son estados botánicos;
- la variación intraespecífica se conserva;
- cada identificación mantiene evidencia y procedencia;
- los caracteres retirados o pendientes pueden conservarse para auditoría sin participar en el motor de identificación;
- no deben inventarse estados negativos para completar una matriz.

## Arquitectura de identificación

La arquitectura objetivo del piloto es:

```text
Observación
    ↓
Fotografías + contexto
    ↓
BioCLIP
    ↓
Candidatos visuales
    ↓
Selección del carácter más informativo
    ↓
Observación automática cuando sea posible
    ↓
Pregunta al usuario cuando sea necesario
    ↓
Clave botánica adaptativa
    ↓
Hipótesis
    ↓
Evidencia + incertidumbre + trazabilidad
```

BioCLIP funciona como generador de candidatos, no como autoridad final.

Los modelos visuales auxiliares pueden intentar observar caracteres botánicos específicos. Deben poder abstenerse cuando el carácter no sea observable con suficiente confianza.

## Modelo de datos conceptual

La unidad fundamental es la observación real.

El modelo conceptual principal es:

```text
Species
  ↓
Individual
  ↓
Observation
  ↓
Evidence / Photo
  ↓
Identification
```

Una identificación puede cambiar sin destruir la observación ni su evidencia.

Descubrir una especie tampoco significa completarla. Nuevas observaciones pueden aportar individuos, localidades, microhábitats, fenología, variación morfológica y otros datos relevantes.

## Seguridad

La obtención de evidencia debe priorizar métodos observacionales, seguros y no invasivos.

El sistema no debe solicitar indiscriminadamente tocar, romper, triturar u oler estructuras vegetales.

En particular, si **Litre (*Lithraea caustica*)** es un candidato, Árboris no debe pedir al usuario frotar, triturar, romper ni oler hojas para provocar una respuesta diagnóstica.

## Estado técnico

El proyecto utiliza:

- Expo 57
- React Native 0.86.3
- React 19.2.3
- TypeScript 6
- Expo Router
- SQLite mediante `expo-sqlite`

La integración canónica **Master Botánico 2.0 → JSON normalizado → fichas por especie → motor adaptativo** quedó cerrada como base mínima en el Hito 15. El motor vigente consume datos canónicos y no debe volver a introducir conocimiento botánico hardcodeado.

La siguiente etapa técnica del frente de identificación es el **Hito 16 — extracción automática de caracteres botánicos**: observadores visuales restringidos por carácter que puedan responder con un estado permitido, incertidumbre o `NO_OBSERVABLE`, sin sentenciar directamente una especie.

En paralelo, los frentes de entorno, mapas y producción visual continúan sus propios gates de validación documentados en `docs/START_HERE.md` y `docs/ROADMAP.md`.

Para consultas de datos y agentes, comenzar por `AGENTS.md` y `data/README.md`; la estrategia de rendimiento está en `docs/DATA_ACCESS_PERFORMANCE.md`.

## Dirección de Árboris

- **Alejandra:** fundadora y directora de proyecto.
- **Álvaro:** director de arte.

La dirección del proyecto corresponde a Alejandra. La dirección artística y la coherencia visual corresponden a Álvaro.

## Documentación

La documentación principal del producto se encuentra en:

- [Visión de producto](docs/PRODUCT_VISION.md)
- [Principios de producto](docs/PRODUCT_PRINCIPLES.md)
- [Arquitectura](docs/ARCHITECTURE.md)
- [Modelo de datos](docs/DATA_MODEL.md)
- [Requisitos funcionales](docs/FUNCTIONAL_REQUIREMENTS.md)
- [Factores habilitantes](docs/ENABLING_FACTORS.md)
- [Roadmap](docs/ROADMAP.md)

## Desarrollo gráfico

La dirección gráfica y el trabajo de arte tienen documentación propia y no deben confundirse con la lógica botánica o de identificación.

Comenzar por:

- [Dirección gráfica y método de trabajo](docs/GRAPHIC_DIRECTION.md)
- [Auditoría y decisiones de Dirección de Arte](docs/ART_DIRECTION_AUDIT_2026-09-16.md)
- [Guía unificada de arte](docs/ART_STYLE_GUIDE.md)
- [Flujo de creación de personajes](docs/CHARACTER_CREATION_WORKFLOW.md)
- [Plantilla de personajes](docs/CHARACTER_TEMPLATE.md)
- [Estado actual de personajes](docs/CHARACTER_DESIGN_STATUS.md)
- [Índice de personajes](data/characters/index.json)

El estado de implementación del refactor de documentación de personajes está registrado en:

- [Character Refactor Status](docs/CHARACTER_REFACTOR_STATUS.md)

La consolidación histórica del 15 de septiembre de 2026 se conserva en:

- [Character Canon Snapshot](docs/CHARACTER_CANON_SNAPSHOT_2026-09-15.md)

Ese documento es un registro histórico y no constituye la fuente de verdad actual.

La antigua [colección final de personajes](docs/CHARACTER_COLLECTION_FINAL.md) se mantiene temporalmente como referencia de compatibilidad obsoleta.

## Ambientes y mapas

La construcción de escenarios y mapas conectados se documenta en:

- [Modelo espacial](docs/SPATIAL_MODEL.md)
- [Protocolo de mapeo territorial](docs/TERRITORIAL_MAPPING_PROTOCOL.md)
- [Protocolo de referencias ambientales](docs/ENVIRONMENT_REFERENCE_PROTOCOL.md)
- [Dirección de arte de escenarios](docs/ENVIRONMENT_ART_DIRECTION.md)
- [Sistema de topología y conectividad de mapas](docs/MAP_TOPOLOGY_SYSTEM.md)
- [Plan de pruebas de blockouts](docs/MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN.md)
- [Plantilla de brief de escena](docs/SCENE_REFERENCE_BRIEF_TEMPLATE.md)

Los recursos de ambientes se registran en:

- [Biblioteca de referencias ambientales](docs/references/environments/README.md)
- [Catálogo de ambientes](docs/assets/backgrounds/README.md)

Para recursos destinados a Android, Steam/PC y web se utiliza:

- [Especificación de producción de ambientes](docs/ENVIRONMENT_PRODUCTION_SPEC.md)

En Windows puede ejecutarse:

```powershell
pwsh -File tools/validate-graphic-assets.ps1
```

Esta comprobación es de solo lectura y revisa metadatos gráficos, archivos referenciados, dimensiones y transparencia. No sustituye la revisión visual ni la verificación en Pixelorama.

## Criterio de desarrollo

Árboris prioriza integrar y validar el ciclo completo del piloto antes de añadir nuevas capas tecnológicas.

Un componente nuevo solo debe incorporarse cuando resuelva un bloqueo concreto demostrado.

El objetivo no es construir más visión artificial que la necesaria.

El valor de Árboris está en combinar modelos existentes, conocimiento botánico estructurado, selección adaptativa de caracteres, evidencia real, participación del usuario, incertidumbre, trazabilidad y juego.
