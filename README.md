# ├ürboris

├ürboris es un juego de exploraci├│n, aprendizaje y colecci├│n de flora nativa chilena basado en observaciones del mundo real.

La identificaci├│n asistida es una mec├ínica dentro de una experiencia m├ís amplia: explorar territorio real, encontrar plantas, observarlas, reunir evidencia, formular una identificaci├│n asistida, descubrir especies y avanzar en una colecci├│n con utilidad jugable.

├ürboris no busca reemplazar la observaci├│n bot├ínica mediante una identificaci├│n autom├ítica. La tecnolog├¡a funciona como apoyo para que el usuario aprenda progresivamente a observar y reconocer la biodiversidad nativa.

## Piloto 1.0

El piloto inicial est├í deliberadamente limitado a una zona geogr├ífica/ecol├│gica y seis especies nativas:

- **Peumo** ÔÇö *Cryptocarya alba*
- **Litre** ÔÇö *Lithraea caustica*
- **Boll├®n** ÔÇö *Kageneckia oblonga*
- **Mitique** ÔÇö *Podanthus mitiqui*
- **Colliguay** ÔÇö *Colliguaja odorifera*
- **Quillay** ÔÇö *Quillaja saponaria*

El objetivo t├®cnico inmediato es lograr un flujo completo y trazable desde una observaci├│n real hasta una hip├│tesis bot├ínica asistida para estas seis especies.

## Ciclo principal

El ciclo conceptual de ├ürboris es:

**explorar ÔåÆ encontrar ÔåÆ observar ÔåÆ reunir evidencia ÔåÆ identificar de forma asistida ÔåÆ descubrir ÔåÆ coleccionar ÔåÆ jugar ÔåÆ volver a explorar**

La colecci├│n no es solamente un cat├ílogo. Las especies descubiertas pueden dar acceso a personajes, contenido, capacidades, variantes y otras mec├ínicas de juego.

├ürboris mantiene separados pero conectados tres objetos:

1. la especie biol├│gica real;
2. su registro de conocimiento, observaciones y evidencia;
3. el personaje jugable inspirado en esa especie.

## Principio de identificaci├│n

La IA no constituye una autoridad taxon├│mica y no debe transformar una fotograf├¡a directamente en una identificaci├│n definitiva.

El sistema puede combinar:

- fotograf├¡as;
- candidatos visuales;
- caracteres bot├ínicos observables;
- ubicaci├│n y contexto ecol├│gico;
- distribuci├│n;
- ├®poca y fenolog├¡a;
- evidencia acumulada;
- preguntas diagn├│sticas adaptativas.

El flujo conceptual es:

```text
Observaci├│n real
      Ôåô
Fotograf├¡a(s) + contexto
      Ôåô
Modelo visual/biol├│gico
      Ôåô
Candidatos
      Ôåô
├ürboris determina qu├® car├ícter bot├ínico
puede discriminar entre los candidatos
      Ôåô
┬┐Existe evidencia suficiente?
      Ôåô
S├¡ ÔåÆ utilizarla
No ÔåÆ intentar observar el car├ícter autom├íticamente
      Ôåô
┬┐Puede observarse con suficiente confianza?
      Ôåô
S├¡ ÔåÆ incorporar la evidencia
No ÔåÆ preguntar al usuario o solicitar otra observaci├│n
      Ôåô
Hip├│tesis de identificaci├│n
      Ôåô
Evidencia + confianza + trazabilidad
```

`No s├®` y `No puedo observarlo` son respuestas v├ílidas.

La falta de informaci├│n nunca debe transformarse autom├íticamente en evidencia negativa. La evidencia manda y las identificaciones son revisables.

## Datos bot├ínicos

La fuente editorial y cient├¡fica del piloto es:

`data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx`

El Master Bot├ínico 2.0 contiene las especies, caracteres, estados bot├ínicos, relaciones especieÔÇôcar├ícter, fuentes, glosario y evidencia fotogr├ífica del piloto.

Los formatos JSON y CSV derivados del Master deben generarse de forma reproducible y no mantenerse como una segunda fuente manual de verdad.

ACE utiliza como base principal el conocimiento botánico canónico derivado del Master Botánico 2.0. La variabilidad natural y sus contextos se mantienen en una capa complementaria explícita, separada de los derivados reproducibles del Master:

- `data/botanical/character_variability.json`
- `data/botanical/contexts.json`

Estos archivos complementarios no son exportaciones del Master Botánico 2.0 ni reemplazan sus relaciones canónicas. Las entradas de variabilidad deben conservar procedencia explícita mediante un `fuente_id` válido de `data/botanical/sources.json`.

Reglas fundamentales:

- vac├¡o significa `sin dato`, no `ausente`;
- `no_se`, `no_observable` y `no_aplica` no son estados bot├ínicos;
- la variaci├│n intraespec├¡fica se conserva;
- cada identificaci├│n mantiene evidencia y procedencia;
- los caracteres retirados o pendientes pueden conservarse para auditor├¡a sin participar en el motor de identificaci├│n;
- no deben inventarse estados negativos para completar una matriz.

## Arquitectura de identificaci├│n

La arquitectura objetivo del piloto es:

```text
Observaci├│n
    Ôåô
Fotograf├¡as + contexto
    Ôåô
BioCLIP
    Ôåô
Candidatos visuales
    Ôåô
Selecci├│n del car├ícter m├ís informativo
    Ôåô
Observaci├│n autom├ítica cuando sea posible
    Ôåô
Pregunta al usuario cuando sea necesario
    Ôåô
Clave bot├ínica adaptativa
    Ôåô
Hip├│tesis
    Ôåô
Evidencia + incertidumbre + trazabilidad
```

BioCLIP funciona como generador de candidatos, no como autoridad final.

Los modelos visuales auxiliares pueden intentar observar caracteres bot├ínicos espec├¡ficos. Deben poder abstenerse cuando el car├ícter no sea observable con suficiente confianza.

## Modelo de datos conceptual

La unidad fundamental es la observaci├│n real.

El modelo conceptual principal es:

```text
Species
  Ôåô
Individual
  Ôåô
Observation
  Ôåô
Evidence / Photo
  Ôåô
Identification
```

Una identificaci├│n puede cambiar sin destruir la observaci├│n ni su evidencia.

Descubrir una especie tampoco significa completarla. Nuevas observaciones pueden aportar individuos, localidades, microh├íbitats, fenolog├¡a, variaci├│n morfol├│gica y otros datos relevantes.

## Seguridad

La obtenci├│n de evidencia debe priorizar m├®todos observacionales, seguros y no invasivos.

El sistema no debe solicitar indiscriminadamente tocar, romper, triturar u oler estructuras vegetales.

En particular, si **Litre (*Lithraea caustica*)** es un candidato, ├ürboris no debe pedir al usuario frotar, triturar, romper ni oler hojas para provocar una respuesta diagn├│stica.

## Estado t├®cnico

El proyecto utiliza:

- Expo 57
- React Native 0.86.3
- React 19.2.3
- TypeScript 6
- Expo Router
- SQLite mediante `expo-sqlite`

La integraci├│n can├│nica **Master Bot├ínico 2.0 ÔåÆ JSON normalizado ÔåÆ fichas por especie ÔåÆ motor adaptativo** qued├│ cerrada como base m├¡nima en el Hito 15. El motor vigente consume datos can├│nicos y no debe volver a introducir conocimiento bot├ínico hardcodeado.

La siguiente etapa t├®cnica del frente de identificaci├│n es el **Hito 16 ÔÇö extracci├│n autom├ítica de caracteres bot├ínicos**: observadores visuales restringidos por car├ícter que puedan responder con un estado permitido, incertidumbre o `NO_OBSERVABLE`, sin sentenciar directamente una especie.

En paralelo, los frentes de entorno, mapas y producci├│n visual contin├║an sus propios gates de validaci├│n documentados en `docs/START_HERE.md` y `docs/ROADMAP.md`.

Para consultas de datos y agentes, comenzar por `AGENTS.md` y `data/README.md`; la estrategia de rendimiento est├í en `docs/DATA_ACCESS_PERFORMANCE.md`.

## Direcci├│n de ├ürboris

- **Alejandra:** fundadora y directora de proyecto.
- **├ülvaro:** director de arte.

La direcci├│n del proyecto corresponde a Alejandra. La direcci├│n art├¡stica y la coherencia visual corresponden a ├ülvaro.

## Documentaci├│n

La documentaci├│n principal del producto se encuentra en:

- [Visi├│n de producto](docs/PRODUCT_VISION.md)
- [Principios de producto](docs/PRODUCT_PRINCIPLES.md)
- [Arquitectura](docs/ARCHITECTURE.md)
- [Modelo de datos](docs/DATA_MODEL.md)
- [Requisitos funcionales](docs/FUNCTIONAL_REQUIREMENTS.md)
- [Factores habilitantes](docs/ENABLING_FACTORS.md)
- [Roadmap](docs/ROADMAP.md)

## Desarrollo gr├ífico

La direcci├│n gr├ífica y el trabajo de arte tienen documentaci├│n propia y no deben confundirse con la l├│gica bot├ínica o de identificaci├│n.

Comenzar por:

- [Direcci├│n gr├ífica y m├®todo de trabajo](docs/GRAPHIC_DIRECTION.md)
- [Auditor├¡a y decisiones de Direcci├│n de Arte](docs/ART_DIRECTION_AUDIT_2026-09-16.md)
- [Gu├¡a unificada de arte](docs/ART_STYLE_GUIDE.md)
- [Flujo de creaci├│n de personajes](docs/CHARACTER_CREATION_WORKFLOW.md)
- [Plantilla de personajes](docs/CHARACTER_TEMPLATE.md)
- [Estado actual de personajes](docs/CHARACTER_DESIGN_STATUS.md)
- [├ìndice de personajes](data/characters/index.json)

El estado de implementaci├│n del refactor de documentaci├│n de personajes est├í registrado en:

- [Character Refactor Status](docs/CHARACTER_REFACTOR_STATUS.md)

La consolidaci├│n hist├│rica del 15 de septiembre de 2026 se conserva en:

- [Character Canon Snapshot](docs/CHARACTER_CANON_SNAPSHOT_2026-09-15.md)

Ese documento es un registro hist├│rico y no constituye la fuente de verdad actual.

La antigua [colecci├│n final de personajes](docs/CHARACTER_COLLECTION_FINAL.md) se mantiene temporalmente como referencia de compatibilidad obsoleta.

## Ambientes y mapas

La construcci├│n de escenarios y mapas conectados se documenta en:

- [Modelo espacial](docs/SPATIAL_MODEL.md)
- [Protocolo de mapeo territorial](docs/TERRITORIAL_MAPPING_PROTOCOL.md)
- [Protocolo de referencias ambientales](docs/ENVIRONMENT_REFERENCE_PROTOCOL.md)
- [Direcci├│n de arte de escenarios](docs/ENVIRONMENT_ART_DIRECTION.md)
- [Sistema de topolog├¡a y conectividad de mapas](docs/MAP_TOPOLOGY_SYSTEM.md)
- [Plan de pruebas de blockouts](docs/MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN.md)
- [Plantilla de brief de escena](docs/SCENE_REFERENCE_BRIEF_TEMPLATE.md)

Los recursos de ambientes se registran en:

- [Biblioteca de referencias ambientales](docs/references/environments/README.md)
- [Cat├ílogo de ambientes](docs/assets/backgrounds/README.md)

Para recursos destinados a Android, Steam/PC y web se utiliza:

- [Especificaci├│n de producci├│n de ambientes](docs/ENVIRONMENT_PRODUCTION_SPEC.md)

En Windows puede ejecutarse:

```powershell
pwsh -File tools/validate-graphic-assets.ps1
```

Esta comprobaci├│n es de solo lectura y revisa metadatos gr├íficos, archivos referenciados, dimensiones y transparencia. No sustituye la revisi├│n visual ni la verificaci├│n en Pixelorama.

## Criterio de desarrollo

├ürboris prioriza integrar y validar el ciclo completo del piloto antes de a├▒adir nuevas capas tecnol├│gicas.

Un componente nuevo solo debe incorporarse cuando resuelva un bloqueo concreto demostrado.

El objetivo no es construir m├ís visi├│n artificial que la necesaria.

El valor de ├ürboris est├í en combinar modelos existentes, conocimiento bot├ínico estructurado, selecci├│n adaptativa de caracteres, evidencia real, participaci├│n del usuario, incertidumbre, trazabilidad y juego.
