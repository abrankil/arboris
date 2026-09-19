# Árboris — Guía de vocabulario general

**Estado:** v1.1 aprobada provisionalmente como referencia operativa  
**Ámbito:** vocabulario transversal para desarrollo, territorio, revisión, GitHub y trabajo diario  
**Autoridades relacionadas:** `DEVELOPMENT_MANUAL.md`, documentos normativos de dominio y routing vigente del repositorio.

Esta guía resume términos de uso frecuente. Es didáctica y no reemplaza las autoridades normativas. Si un término tiene una definición más específica en un documento de dominio, prevalece esa autoridad.

## 1. Conceptos fundamentales

| Término | Qué significa | Ejemplo |
| --- | --- | --- |
| **Árboris** | Juego de exploración, aprendizaje y colección de flora nativa chilena basado en observaciones del mundo real. | “Árboris combina exploración real, observación y juego.” |
| **Canon** | Regla o decisión vigente que gobierna el proyecto dentro de un ámbito. | “El Modelo Espacial contiene canon territorial vigente.” |
| **Autoridad / fuente de verdad** | Documento, dato o especialista que gobierna un tema concreto. | “Para conectividad y topología, consultar `MAP_TOPOLOGY_SYSTEM`; manda la conectividad explícita + `walkable envelope`.” |
| **Evidencia** | Información respaldada y con procedencia. | “Fotografía real con fuente registrada.” |
| **Interpretación** | Conclusión o hipótesis plausible basada en evidencia, pero no directamente demostrada. | “La forma podría corresponder a una hoja, pero no está confirmada.” |
| **Derivado** | Material generado desde una autoridad. No reemplaza ni gobierna la fuente original. | “Una imagen generada con IA es un derivado, no evidencia.” |
| **Trazabilidad** | Capacidad de saber de dónde provino una decisión, dato o cambio. | “Vincular la decisión con issue, PR y documento fuente.” |
| **Alcance** | Qué incluye y qué no incluye una tarea o decisión. | “Este cambio afecta MAP-001; no modifica canon botánico.” |

## 2. Territorio y representación

| Término | Qué significa | Ejemplo |
| --- | --- | --- |
| **Paisaje** | Escala territorial amplia. | “Precordillera de Santiago.” |
| **Sector** | Ámbito territorial concreto. | “Fundo Los Nogales.” |
| **Lugar** | Zona reconocible dentro del sector. | “Acceso Principal.” |
| **Unidad Espacial (UE)** | Segmento o zona reconocible del territorio con identidad territorial y experiencial suficiente para ser tratado como una unidad de diseño. | “UE-001 Umbral de acceso.” |
| **Rasgo territorial** | Elemento concreto del territorio, como puente, estero, casa, ladera o claro. | “Puente.” |
| **Rasgo ancla** | Rasgo especialmente importante para reconocer el lugar. | “Puente como `anchorElement`.” |
| **Instancia Territorial (IT)** | Versión jugable de una o más UE bajo una condición y objetivo concretos. | “IT-001 Acceso Principal.” |
| **MAP** | Blockout, mapa o prototipo derivado de una IT. | “MAP-001.” |
| **Destilación Territorial** | Proceso de simplificar el territorio real conservando lo esencial para reconocerlo. | “Destilar un sector en una representación jugable reconocible.” |

## 3. Estados y decisiones

### Tratamientos ASC

| Tratamiento | Significado |
| --- | --- |
| **KNOWN** | Existe base suficiente para usar la información en la compilación. |
| **OPEN** | No hay evidencia o decisión suficiente. |
| **PROHIBIDO INFERIR** | El ejecutor no puede completar ese vacío por plausibilidad. Regla general del proyecto: no cerrar decisiones por suposición. |
| **ART-PROVISIONAL** | Solución visual temporal para una prueba; no se convierte en evidencia. |

Los tratamientos ASC no sustituyen estados propios de otros dominios. Cuando un estado de dominio deba recibir tratamiento ASC, ese tratamiento se determina explícitamente y el estado original del dominio se conserva. No se convierte automáticamente en `OPEN`.

### Estados de producción para derivados jugables

```text
unmodeled → blockout → tested → approved
```

Estos estados corresponden a derivados como Instancias, MAP, blockouts o prototipos. No se usan como estado primario de una Unidad Espacial territorial.

## 4. Proceso de trabajo

| Verbo | Uso |
| --- | --- |
| **Investigar** | Buscar y revisar información. |
| **Analizar** | Evaluar información y contrastarla. |
| **Diseñar** | Definir una solución o derivado. Ejemplo: “Diseñar el blockout de MAP-002.” |
| **Implementar** | Desarrollar en código, motor o repositorio. |
| **Probar** | Evaluar y verificar comportamiento. |
| **Auditar** | Revisar contra criterios, autoridad y protocolos. |
| **Trazar** | Reconstruir la procedencia demostrable de un dato, decisión, instrucción o resultado, sin modificarlo. Ejemplo: “Trazar el origen de la instrucción de densidad vegetal.” |
| **Diagnosticar** | Localizar la capa responsable o probablemente responsable de un defecto observado, antes de decidir qué objeto corregir. No implica autorización para corregir. Ejemplo: “Diagnosticar la baja densidad vegetal en ASC-TEST-017.” |
| **Iterar** | Mejorar a partir de resultados. |
| **Validar** | Confirmar que se cumplen criterios definidos. |

## 5. Revisión y calidad

Toda revisión que vaya a consolidar una decisión debe responder explícitamente:

```text
AUDITORÍA
INCONSISTENCIAS
VACÍOS / OMISIONES
REDUNDANCIAS
```

Términos asociados:

- **PASS / PARTIAL / FAIL:** resultado de una prueba o criterio.
- **Hallazgo crítico / blocker:** problema que impide avanzar en el gate actual porque compromete el objetivo, una autoridad, la arquitectura, jugabilidad central o reproducibilidad.
- **Gate:** condición que debe cumplirse antes de avanzar de fase.
- **Regresión:** algo que funcionaba y dejó de hacerlo tras un cambio.

## 6. Desarrollo y repositorio

| Término | Qué significa |
| --- | --- |
| **main** | Rama principal y referencia compartida vigente. |
| **PR** | Pull Request: propuesta de cambio revisable antes de integrarse. |
| **issue** | Tarea, discusión o problema a resolver. |
| **CI** | Validaciones automáticas del repositorio. |
| **versionado** | Registro de cambios en el tiempo. |
| **archive/** | Material histórico. No gobierna el desarrollo vigente. |

## 7. Convenciones de nombres

```text
UE-###        Unidad Espacial
IT-###        Instancia Territorial
MAP-###       mapa / blockout / prototipo
PR #<número>  Pull Request de GitHub
```

Otros prefijos pueden existir por contexto, pero no deben tratarse como convenciones generales hasta estar definidos por una autoridad vigente.

## 8. Principios de lenguaje

1. Precisión antes que ambigüedad.
2. Evidencia antes que suposiciones.
3. Cada término en su contexto correcto.
4. Lo que no sabemos no se cierra por inferencia.
5. Un lenguaje compartido reduce errores y ambigüedad.

## Relación con las láminas visuales

La guía visual aprobada provisionalmente es una representación editorial de esta referencia. Su copy decorativo es `ART-PROVISIONAL` y no constituye slogan oficial ni regla normativa.

Para cualquier decisión que cambie el proyecto, usar `DEVELOPMENT_MANUAL.md` y la autoridad específica del dominio en vez de esta guía resumida.
