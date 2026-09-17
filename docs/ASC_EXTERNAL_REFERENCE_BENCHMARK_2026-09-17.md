# ASC — Benchmark externo de referencia 2026-09-17

**Estado:** investigación externa / referencia estratégica  
**Ámbito:** desarrollo general de ASC como sistema independiente desarrollado por Álvaro.  
**Proyecto consumidor usado como contexto:** Árboris, primer caso piloto de aplicación de ASC.  
**Autoridad:** este documento no es especificación normativa de ASC ni de Árboris. Sirve como mapa comparativo para evitar duplicar soluciones existentes y para ubicar el diferencial de ASC.

## 1. Propósito

Este documento registra proyectos, herramientas y líneas de investigación similares o complementarias a ASC.

La finalidad no es declarar que ASC deba copiar o depender de alguna de estas herramientas. El objetivo es distinguir:

```text
similares conceptuales
complementos técnicos
posibles backends
riesgos de confusión
diferenciador de ASC
```

ASC se entiende aquí como:

```text
canon / evidencia / contrato
→ tratamientos KNOWN / OPEN / PROHIBIDO INFERIR / ART-PROVISIONAL
→ compilación de escena o instrucción
→ handoff auditado
→ prompt efectivo / workflow / escena estructurada
→ resultado
→ auditoría separada por proyecto consumidor
```

No se encontró, en esta revisión, un equivalente idéntico a ASC con ese alcance completo. Sí existen familias cercanas que cubren partes del problema.

## 2. Criterios de comparación

Cada referencia se clasificó por su relación con ASC:

- **similar conceptual:** comparte la idea de compilar, programar o estructurar instrucciones para modelos;
- **complemento técnico:** podría apoyar evaluación, control, trazabilidad, orquestación o ejecución;
- **posible backend:** podría recibir salidas de ASC en el futuro;
- **riesgo de confusión:** puede parecer equivalente, pero opera en otro nivel;
- **referente metodológico:** aporta un patrón útil sin ser una dependencia directa.

## 3. Mapa comparativo

| Referencia | Naturaleza | Relación con ASC | Lectura para ASC |
| --- | --- | --- | --- |
| DSPy | framework para programar modelos de lenguaje y compilar pipelines declarativos | similar conceptual | útil para sostener la idea de “programar/compilar” en vez de depender de prompts sueltos; no es específico de escenas visuales ni de contratos territoriales |
| Microsoft Prompt flow | SDK/CLI/extensión para flujos con prompts; Microsoft indica retiro de cargas Prompt flow antes del 20-abr-2027 | complemento técnico / referencia histórica | útil para pensar flujos, pruebas y trazabilidad; no conviene tratarlo como dependencia estratégica principal por su estado de retiro |
| promptfoo | CLI y librería open-source para evaluar y red-team aplicaciones LLM con configuraciones declarativas | complemento técnico fuerte | referencia directa para evaluación, regresión, comparación de prompts, CI y criterios automatizables |
| Guidance / llguidance | paradigma/librería para controlar estructura de salida y constrained decoding | complemento técnico | útil para salidas estructuradas, JSON controlado, plantillas rígidas y reducción de ambigüedad antes del handoff |
| Semantic Kernel | SDK para agentes, plugins, funciones y orquestación | complemento de orquestación | útil si ASC necesita exponerse como herramienta invocable por agentes; no resuelve la semántica específica de escena |
| LangSmith / LangChain | plataforma/ecosistema de tracing, evaluación, prompt management y monitoreo de aplicaciones LLM | complemento de trazabilidad/evaluación | útil como referencia para versionado de prompts, experimentos, monitoreo y evaluación longitudinal |
| ComfyUI | GUI/API/backend por nodos para workflows generativos de imagen, video, audio, 3D y texto | posible backend visual | relevante como ejecutor más controlable que un prompt opaco; ASC podría compilar hacia workflows parametrizados |
| OpenUSD / USD | plataforma extensible para describir, componer e intercambiar escenas 3D | posible target estructurado | relevante si ASC evoluciona de prompts textuales hacia representaciones intermedias de escena/grafo/layout |
| Infinigen | generador procedural de escenas 3D naturales con anotaciones para visión computacional | referente procedural / posible backend indirecto | útil para pensar generación controlada de mundos naturales, anotaciones y separación entre reglas y render |
| BlenderProc | pipeline procedural de Blender para generación de imágenes/renderizados fotorealistas | posible backend procedural | útil si ASC compila a scripts o escenas reproducibles en Blender, especialmente para control y evaluación |
| SceneCraft | investigación text-to-scene que usa grafo de escena y scripts Blender | referente metodológico fuerte | valida el patrón texto/contrato → grafo/layout → código ejecutable → render, cercano a la ambición futura de ASC |
| SceneScript | línea de investigación de lenguaje estructurado de escenas | referente metodológico | refuerza la conveniencia de no depender solo de lenguaje natural cuando se requiere fidelidad estructural |
| Scene graph / scene language approaches | familia de modelos y métodos que representan escenas mediante grafos, layouts o programas | familia conceptual | respalda una evolución de ASC hacia contrato/grafo verificable antes de generación visual |

## 4. Lectura por familia

### 4.1 Frameworks de compilación / programación de modelos

DSPy es el referente conceptual más cercano en la capa “programar, no solo promptear”. Su valor para ASC está en la idea de separar especificación, módulos, compilación y evaluación.

Diferencia crítica: DSPy se orienta a pipelines LM generales. ASC se orienta a preservar autoridad, contrato, estados `OPEN` y relaciones de escena antes de entregar instrucciones a un ejecutor.

### 4.2 Evaluación, regresión y trazabilidad

promptfoo, LangSmith y herramientas similares son relevantes para el futuro de ASC porque permiten pensar en:

```text
test cases
evaluadores
comparación de prompts
regresión
CI
historial de resultados
```

ASC no debería recrear innecesariamente todo ese ecosistema. La decisión futura es si ASC exporta casos evaluables a una herramienta externa, implementa un mínimo propio o combina ambos caminos.

### 4.3 Control de salida estructurada

Guidance y llguidance son relevantes si ASC necesita producir salidas estructuradas verificables, por ejemplo:

```text
contratos serializados
prompts con campos obligatorios
JSON de scene graph
planes de generación
checklists de handoff
```

Su aporte está en reducir libertad no controlada del modelo cuando el output esperado no debe ser solo prosa.

### 4.4 Workflows generativos visuales

ComfyUI representa una posible dirección práctica: no usar solo texto libre, sino un workflow parametrizado con nodos, modelos, seeds, pasos, controles y assets.

Lectura para ASC:

```text
ASC no tiene que ser el backend visual.
ASC puede compilar hacia un backend visual.
```

Esto evita confundir ASC con un generador de imágenes.

### 4.5 Escenas estructuradas y procedural generation

OpenUSD, BlenderProc, Infinigen, SceneCraft y familias de scene graph son relevantes si ASC evoluciona desde prompt textual hacia una representación intermedia más verificable.

Para escenas, terreno y blockouts, el patrón más robusto parece ser:

```text
contrato
→ grafo / layout / escena estructurada
→ backend procedural o generativo
→ render / preview
→ auditoría
```

Esto coincide con los problemas detectados en las pruebas de terreno: una imagen puede verse plausible pero fallar en correspondencia exacta de celdas, elevación o conectividad.

## 5. Diferenciador de ASC

El diferencial de ASC no está en “generar imágenes” ni en “hacer prompts bonitos”.

La propuesta diferenciadora es:

```text
compilar autoridad y restricciones antes de generar
preservar OPEN en vez de rellenarlo
mantener separadas fuente, contrato, representación y resultado
hacer visible el handoff
separar hallazgos de ASC y hallazgos del proyecto consumidor
auditar antes de convertir una salida en decisión
```

ASC puede usar backends externos, pero su núcleo debería seguir siendo:

```text
ASC CORE
- autoridad por dominio
- contrato de entrada
- tratamientos de información
- compilación
- handoff check
- criterios críticos/secundarios
- atribución de hallazgos
- registro de prueba
```

## 6. Riesgos de confusión

### 6.1 Confundir ASC con un generador

ComfyUI, modelos de imagen, Blender o cualquier ejecutor pueden generar resultados. ASC no debe definirse como competidor directo de ellos.

Riesgo:

```text
ASC = generador visual
```

Corrección:

```text
ASC = compilador / capa de autoridad y preparación
backend = ejecutor visual, textual, procedural o híbrido
```

### 6.2 Confundir ASC con un framework de agentes

Semantic Kernel, LangChain o Haystack pueden orquestar agentes y herramientas. ASC puede integrarse con agentes, pero su especificidad es la compilación controlada de contratos hacia generación.

### 6.3 Confundir ASC con evaluación automática

promptfoo y LangSmith evalúan o monitorean. ASC necesita evaluación, pero también requiere autoridad de dominio, estados `OPEN` y handoff. La evaluación es una pieza, no todo el sistema.

### 6.4 Convertir Árboris en límite artificial de ASC

Árboris es el primer caso piloto de ASC, no el límite del producto ASC.

Las necesidades de Árboris pueden informar el desarrollo de ASC, pero no se convierten automáticamente en requisitos generales.

## 7. Implicancias para desarrollo

### Mantener separado

```text
ASC GENERAL
producto/herramienta independiente de Álvaro

ASC EN ÁRBORIS
perfil de integración y prueba dentro de un proyecto consumidor concreto
```

### No sobredocumentar aún

No corresponde crear de inmediato integraciones con todas las herramientas mencionadas. Primero debe estabilizarse el núcleo:

```text
contrato
prompt ASC
handoff check
prompt efectivo
resultado
auditoría
registro reproducible
```

### Diseñar para backends múltiples

ASC debería evitar amarrarse prematuramente a un único ejecutor. La abstracción de salida puede evolucionar en capas:

```text
Nivel 1: prompt textual controlado
Nivel 2: prompt + registro de handoff
Nivel 3: workflow parametrizado
Nivel 4: grafo/layout/escena estructurada
Nivel 5: backend procedural/render reproducible
```

No hay obligación de implementar todos los niveles ahora.

## 8. Implicancias para Árboris

Para Árboris, esta investigación confirma que ASC debe usarse como capa previa a la generación, no como sustituto de:

- canon botánico;
- evidencia territorial;
- `walkableEnvelope`;
- contratos de navegación/cámara/interacción;
- dirección de arte;
- renderer o pathfinding.

Las pruebas `TERRAIN-DERIVATION-TEST-*` deben seguir leyéndose doblemente:

```text
LECTURA ASC
qué enseña sobre compilación, handoff, control y ejecutor

LECTURA ÁRBORIS
qué enseña sobre representación de terreno, elevación, conectividad y naturalización
```

## 9. Recomendación de estudio priorizado

Orden recomendado para Álvaro:

```text
1. DSPy
   para arquitectura de compilación/programación de modelos.

2. promptfoo
   para evaluación, regresión, test cases y CI.

3. ComfyUI
   para workflows visuales parametrizados y trazables.

4. OpenUSD / scene graph approaches
   para salida estructurada futura.

5. SceneCraft / BlenderProc / Infinigen
   para pasar de prompt a escena procedural o render reproducible.
```

No implica dependencia ni adopción. Es una ruta de estudio.

## 10. Fuentes revisadas

Fuentes oficiales o primarias consultadas en la revisión:

- DSPy — GitHub / docs: https://github.com/stanfordnlp/dspy
- Microsoft Prompt flow — documentación y aviso de retiro: https://microsoft.github.io/promptflow/
- promptfoo — documentación: https://www.promptfoo.dev/docs/intro/
- Guidance — GitHub: https://github.com/guidance-ai/guidance
- Semantic Kernel — Microsoft Learn: https://learn.microsoft.com/semantic-kernel
- LangSmith — LangChain: https://www.langchain.com/langsmith/evaluation
- ComfyUI — GitHub: https://github.com/Comfy-Org/ComfyUI
- OpenUSD — documentación: https://openusd.org/
- OpenUSD — Pixar: https://www.pixar.com/openusd
- Infinigen — sitio oficial: https://infinigen.org/
- BlenderProc — GitHub: https://github.com/DLR-RM/BlenderProc
- SceneCraft — ICML/PMLR: https://proceedings.mlr.press/v235/hu24g.html
- SceneScript — Meta / GitHub: https://github.com/facebookresearch/scenescript

## 11. Auditoría

### AUDITORÍA

El benchmark externo apoya la existencia de un espacio conceptual para ASC, pero no prueba que ASC ya esté técnicamente implementado ni que supere a herramientas existentes. El valor actual es estratégico: ubicar ASC como capa de compilación y autoridad, no como generador, evaluador genérico o framework de agentes.

### INCONSISTENCIAS

No se detecta una contradicción con la separación ya aprobada entre ASC y Árboris. La investigación refuerza que ASC debe permanecer independiente de Árboris, aunque Árboris sea su primer caso piloto.

### VACÍOS / OMISIONES

Falta revisar con más profundidad licencias, arquitectura interna, APIs, costos de integración, instalación local y compatibilidad práctica con el stack de Álvaro. También falta comprobar si existen proyectos menos visibles con foco específico en compilación de escenas 2D/2.5D desde contratos.

### REDUNDANCIAS

La principal redundancia potencial sería documentar ASC como si fuera a reemplazar ComfyUI, promptfoo, LangSmith, BlenderProc u OpenUSD. La clasificación de este documento evita esa duplicación: esas herramientas se tratan como referentes, backends o complementos, no como funciones que ASC deba copiar automáticamente.

## 12. Conclusión permitida

Sí puede concluirse:

```text
ASC tiene un espacio propio si se define como capa de compilación,
autoridad, handoff y auditoría entre contratos y ejecutores.
```

No puede concluirse todavía:

```text
ASC ya es técnicamente superior a esas herramientas.
ASC debe implementar todas esas capacidades.
ASC debe depender de una herramienta específica.
ASC está listo como producto independiente.
```

## 13. Próximo gate

Antes de seguir ampliando teoría externa, continuar con el endurecimiento operativo:

```text
TERRAIN-DERIVATION-TEST-004
objetivo: handoff + preservación exacta cell → elevationBand
sin naturalización prematura
sin convertir rampas en canon
```

Si ASC empieza a compilar hacia un backend concreto, abrir un benchmark técnico separado para ese backend.
