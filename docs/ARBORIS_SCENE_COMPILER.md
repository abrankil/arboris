# ASC — Perfil de integración con Árboris

**Estado:** normativo para el uso de ASC dentro de Árboris  
**Nombre operativo:** ASC  
**Desarrollador de ASC:** Álvaro  
**Ámbito de este documento:** integración de ASC con Árboris para compilación de instrucciones, escenas, blockouts, diagramas y prototipos visuales a partir del canon, contratos y evidencia de Árboris.

Este documento regula cómo Árboris usa ASC. No define todo el producto ASC ni subordina el desarrollo general de ASC a Árboris.

## 1. Definición

ASC es un sistema de compilación en desarrollo independiente, desarrollado por Álvaro. Puede utilizarse con Árboris o con otros proyectos.

En Árboris, ASC se usa como capa de compilación que transforma información estructurada del proyecto en una instrucción ejecutable por un modelo o herramienta generativa.

Árboris es el primer proyecto real/piloto donde se está probando, validando y aplicando ASC. Una vez que ASC alcance estado utilizable o terminado según su propio desarrollo, Árboris podrá funcionar como primer proyecto de aplicación, sin convertir por eso a ASC en una pieza interna exclusiva de Árboris.

ASC **no es el modelo generativo**, **no es el renderer**, **no es el motor de navegación** y **no es una fuente de verdad territorial, botánica o científica**.

```text
EVIDENCIA / INPUT DEL PROYECTO CONSUMIDOR
        ↓
CANON / AUTORIDAD DEL DOMINIO
        ↓
CONTRATO
        ↓
ESTRUCTURA FORMAL CUANDO CORRESPONDA
nodos · relaciones · cantidades · estados · restricciones
        ↓
REGLAS DERIVADAS
        ↓
ASC — COMPILACIÓN
        ↓
PROMPT ASC
        ↓
HANDOFF CHECK
        ↓
PROMPT EFECTIVO
        ↓
MODELO / HERRAMIENTA GENERATIVA
        ↓
RESULTADO
        ↓
AUDITORÍA
```

El `HANDOFF CHECK` es obligatorio cuando una herramienta intermedia pueda reformular, resumir, adaptar o transformar el prompt antes de llegar al ejecutor.

### 1.1 Autoría, independencia y autoridad

La autoridad sobre el desarrollo general de ASC corresponde a Álvaro, salvo acuerdos posteriores explícitos.

La autoridad sobre decisiones de producto de Árboris corresponde a la dirección del proyecto Árboris. En el estado actual, Alejandra actúa como dirección de proyecto de Árboris y Álvaro como dirección/desarrollo de ASC y dirección de arte cuando ese rol haya sido definido para Árboris.

La relación correcta es:

```text
ASC
sistema independiente desarrollado por Álvaro
puede servir a múltiples proyectos

ÁRBORIS
primer proyecto piloto / caso de uso real
consume ASC bajo sus propios contratos y autoridades

INTERSECCIÓN
las pruebas hechas en Árboris pueden informar el desarrollo de ASC
y también producir hallazgos útiles para Árboris,
pero ambas lecturas deben registrarse por separado
```

Ningún resultado de ASC puede imponer automáticamente una decisión sobre Árboris. Ninguna necesidad específica de Árboris puede convertirse automáticamente en requisito general de ASC sin decisión de Álvaro.

## 2. Terminología obligatoria

- **ASC:** sistema de compilación independiente desarrollado por Álvaro. En este repositorio se documenta su perfil de uso con Árboris.
- **prompt ASC:** instrucción compilada que ASC entrega al ejecutor generativo.
- **prompt efectivo:** instrucción que realmente recibe el ejecutor después de cualquier adaptación de la herramienta o proveedor.
- **handoff:** transferencia del prompt ASC al ejecutor.
- **handoff check:** comparación entre contrato, prompt ASC y prompt efectivo para verificar que no se debilitaron restricciones ni se introdujeron instrucciones nuevas.
- **modelo generativo / ejecutor:** sistema externo que interpreta el prompt efectivo y produce la salida.
- **resultado ASC:** salida producida mediante una ejecución iniciada desde un prompt ASC. No constituye evidencia por sí misma.
- **prueba ASC:** experimento controlado para evaluar compilación, traducción o representación.
- **contrato de entrada:** conjunto explícito de relaciones, restricciones y estados que ASC debe preservar.
- **estructura formal:** representación explícita y auditable de relaciones normativas antes de su representación visual. Puede expresarse como nodos/aristas, matriz, tabla de relaciones, estados o estructura equivalente.
- **grafo de proceso:** estructura formal de un proceso compuesta por nodos y aristas dirigidas; la diagramación visual es una representación derivada de ese grafo.
- **caso de uso Árboris:** aplicación de ASC a una necesidad, contrato, escena o prueba de Árboris.
- **hallazgo ASC:** aprendizaje sobre compilación, handoff, ejecutor, metodología o capacidades/limitaciones del sistema ASC.
- **hallazgo Árboris:** aprendizaje sobre necesidades, contratos, representación, arte, navegación o validación del proyecto Árboris.

No llamar "modelo de Árboris" al ejecutor generativo cuando se quiera describir ASC. Deben distinguirse ambos componentes.

### Uso operativo en conversación

```text
"compila con ASC" / "pásalo por ASC"
→ construir el prompt ASC; no ejecutar generación salvo que también se pida.

"ejecuta con ASC" / "genera con ASC"
→ compilar, verificar handoff cuando corresponda y luego ejecutar.

"audita ASC" / "audita el resultado ASC"
→ revisar contrato, estructura formal si existe, prompt ASC, prompt efectivo y/o resultado según el alcance de la prueba.

"usa X como evidencia/input ASC"
→ X puede alimentar la compilación; no adquiere automáticamente autoridad ni permite completar vacíos.
```

Cuando la instrucción sea ambigua entre **compilar** y **ejecutar**, conservar la distinción y no tratar la salida generativa como si fuera parte del compilador.

## 3. Autoridad y precedencia

ASC compila; no decide la verdad del proyecto consumidor.

Antes de compilar, debe identificarse la **autoridad del dominio** aplicable. No existe una regla universal donde cualquier imagen o fuente externa prevalezca sobre el canon interno. La autoridad depende del tipo de información: botánica, territorial, navegación, arte, producto, proceso, etc.

En Árboris, el orden operativo general es:

```text
autoridad del dominio de Árboris + evidencia válida
→ contrato específico de la prueba/escena/artefacto
→ estructura formal cuando las relaciones sean normativas
→ reglas ASC aplicables
→ decisiones artísticas autorizadas
→ ejecutor generativo
```

Una salida generativa nunca puede corregir, completar ni reemplazar una autoridad superior por mera plausibilidad visual.

Ante contradicción, prevalece la autoridad del dominio y la contradicción debe registrarse.

Cuando una prueba de Árboris revele una necesidad de ASC, registrarla como hallazgo o propuesta para ASC; no convertirla automáticamente en requisito general del sistema ASC.

## 4. Estados de información para compilación

Toda información relevante que llegue a ASC debe recibir un **tratamiento de compilación**, según corresponda:

- **KNOWN / respaldado:** puede trasladarse a la compilación.
- **OPEN:** no existe evidencia o decisión suficiente; debe permanecer abierto.
- **PROHIBIDO INFERIR:** el ejecutor no puede completar el vacío.
- **ART-PROVISIONAL:** decisión visual temporal permitida para una prueba, sin valor de evidencia ni canon.

Estos tratamientos son propios de ASC y **no reemplazan los estados del dominio**. Si una entrada territorial contiene `claimState`, `evidenceStatus` o `productionStatus`, ASC debe preservarlos y derivar su tratamiento de compilación sin reescribirlos.

`OPEN` nunca significa "rellenar con una solución probable".

## 5. Regla de no invención

ASC debe impedir que una salida generativa se convierta accidentalmente en nueva autoridad.

Salvo autorización explícita del contrato, no se deben inventar relaciones, conexiones, bifurcaciones, estados, cantidades, altimetría, pendientes, hidrología, infraestructura, especies, distribución botánica, hitos territoriales, dimensiones, orientación, transitabilidad ni otras propiedades no respaldadas.

Si un dato es necesario para producir el artefacto pero permanece `OPEN`, ASC debe omitirlo, neutralizarlo mediante placeholder, tratarlo como `ART-PROVISIONAL` cuando el contrato lo autorice o declarar la limitación. No debe resolverlo silenciosamente.

## 6. Separación de capas

ASC debe mantener separadas las capas relevantes del dominio y distinguir siempre **estructura** de **representación**.

En escenas territoriales pueden ser relevantes:

```text
EVIDENCIA
TERRITORIO
TOPOLOGÍA / NAVEGACIÓN
ELEVACIÓN
CÁMARA
INTERACCIÓN / APRENDIZAJE
ARTE
```

En diagramas y artefactos relacionales pueden ser relevantes:

```text
CONTENIDO
NODOS / ENTIDADES
RELACIONES / ARISTAS
ESTADOS / CONDICIONES
REGLAS DERIVADAS
LAYOUT
TRATAMIENTO VISUAL
```

Una relación normativa no debe quedar definida únicamente por la apariencia final.

## 7. Regla general de estructura antes de representación

Cuando el resultado deba preservar relaciones exactas, ASC debe compilar primero una estructura formal auditable y solo después una representación visual.

Regla:

```text
FUENTE DE VERDAD
→ ESTRUCTURA FORMAL
→ REGLAS DERIVADAS
→ REPRESENTACIÓN
```

Esto se aplica, entre otros casos, a:

- topología territorial;
- conectividad;
- matrices de elevación;
- diagramas de flujo;
- árboles de decisión;
- procesos con retornos o bifurcaciones;
- jerarquías;
- cantidades exactas;
- dependencias entre componentes.

Para un diagrama de proceso, el contrato mínimo debe poder expresarse como:

```text
NODE <id>
EDGE <from> -> <to>
CONDITION <si corresponde>
OPTIONAL <si corresponde>
```

Ejemplo:

```text
NODE Diseñar
NODE Prototipar
NODE Implementar

EDGE Diseñar -> Implementar
EDGE Diseñar -> Prototipar
EDGE Prototipar -> Implementar
OPTIONAL Prototipar
```

La salida visual puede elegir posiciones, tamaños, rutas gráficas y tratamiento artístico dentro de la libertad autorizada, pero no puede añadir, eliminar, invertir ni fusionar relaciones normativas.

### 7.1 Gate de estructura

Antes del prompt visual:

```text
CONTRATO
↓
ESTRUCTURA FORMAL
↓
STRUCTURE CHECK
↓
PASS?
  NO → STOP / CORREGIR
  SÍ → COMPILAR REPRESENTACIÓN
```

El `STRUCTURE CHECK` verifica:

- conjunto exacto de nodos/entidades cuando sea crítico;
- conjunto exacto de relaciones/aristas;
- dirección de cada relación;
- condiciones y bifurcaciones;
- opcionalidad;
- cantidades exactas;
- ausencia de relaciones no autorizadas.

## 8. Compilación mínima

Antes de producir un prompt ASC, identificar:

1. Proyecto consumidor.
2. Pregunta experimental u objetivo verificable.
3. Objetivo de la generación.
4. Fuentes de autoridad.
5. Relaciones obligatorias.
6. Estructura formal, cuando corresponda.
7. Estados OPEN.
8. Prohibiciones.
9. Grado de libertad artística.
10. Contrato de cámara/salida cuando corresponda.
11. Variable experimental.
12. Constantes.
13. Criterios de validación.
14. Modo `compile-only` o `compile-and-execute`.
15. Lectura separada de resultados para ASC y proyecto consumidor.

## 9. Forma recomendada de un prompt ASC

```text
[IDENTIDAD DE LA PRUEBA / ARTEFACTO]
[PROYECTO CONSUMIDOR]
[PREGUNTA / OBJETIVO]
[INPUT / FUENTES AUTORIZADAS]
[CONTRATO]
[ESTRUCTURA FORMAL]
[RELACIONES OBLIGATORIAS]
[VARIABLE QUE CAMBIA]
[CONSTANTES]
[OPEN / NO INFERIR]
[PROHIBIDO]
[LIBERTAD ARTÍSTICA AUTORIZADA]
[CÁMARA / FORMATO]
[PRIORIDADES DE LECTURA]
[CRITERIOS DE VALIDACIÓN]
```

No todas las secciones deben aparecer literalmente en el prompt final si el ejecutor funciona mejor con otra redacción, pero su información no puede perderse durante la compilación.

ASC puede adaptar redacción, orden y nivel de detalle al ejecutor concreto, pero no puede debilitar restricciones ni introducir elementos prohibidos para obtener una salida más atractiva o fácil de generar.

## 10. Handoff y fidelidad de ejecución

Cuando el proveedor, interfaz o herramienta pueda reescribir el prompt, una prueba estructural no se considera válida hasta revisar el handoff.

Registro mínimo:

```text
CONTRATO
↓
ESTRUCTURA FORMAL si corresponde
↓
PROMPT ASC
↓
PROMPT EFECTIVO
↓
RESULTADO
```

El `HANDOFF CHECK` debe verificar al menos restricciones críticas, cantidades exactas, prohibiciones, OPEN, relaciones formales y ausencia de degradación de instrucciones exactas a aproximadas.

Si el handoff falla en una restricción crítica, el resultado puede estudiarse como comportamiento del ejecutor, pero no valida la hipótesis estructural original.

## 11. Uso de fuentes visuales y territoriales

Una imagen, mapa, fotografía o croquis puede ser input ASC, pero debe distinguirse entre lo visible o explícitamente declarado, lo derivable de forma segura y lo desconocido.

En traducción territorial, el flujo preferido para Árboris es:

```text
fuente territorial
→ extracción de relaciones respaldadas
→ contrato territorial
→ contratos de navegación / cámara / interacción cuando corresponda
→ estructura formal
→ ASC
→ prompt
→ blockout o prototipo
```

No usar una imagen generada como corroboración independiente de la fuente que originó esa misma generación.

## 12. Resultados generativos

Todo resultado ASC debe considerarse por defecto propuesta o evidencia experimental, nunca evidencia territorial, botánica o científica.

Una salida visual puede validar legibilidad, composición, traducción de un grafo, jerarquía, representación de alturas, cámara, densidad o lenguaje artístico. No puede validar por sí sola que una relación real sea verdadera.

Cuando exista estructura formal, la auditoría del resultado debe comenzar comparando esa estructura con la estructura representada en la salida. La estética se evalúa después.

Cada resultado debe poder leerse en dos planos:

```text
LECTURA ASC
qué demuestra sobre compilación, estructura, handoff, método o ejecutor

LECTURA DEL PROYECTO CONSUMIDOR
qué demuestra sobre Árboris u otro proyecto
```

## 13. Clases de pruebas ASC

### ASC-STRUCTURAL TEST

Comprueba si el ejecutor preserva información y relaciones obligatorias.

Prioridad:

```text
estructura formal
→ relaciones / conectividad
→ estados / condiciones
→ cantidades exactas
→ ausencia de invención
→ representación
```

La estética no compensa un fallo estructural.

### ASC-VISUAL TEST

Comprueba cómo se representa información cuya estructura ya está suficientemente controlada.

Puede evaluar naturalización, jerarquía visual, densidad, composición, superficies y lenguaje gráfico.

No debe cerrar relaciones estructurales todavía no validadas.

## 14. Criterios críticos y secundarios

Toda prueba debe clasificar criterios antes de ejecutar.

Un criterio crítico fallido impide `PASS` aunque la salida sea visualmente buena.

Estados de resultado:

- PASS
- PARTIAL
- FAIL
- INCONCLUSIVE

## 15. Control experimental

Cuando se comparen ejecuciones, registrar variable que cambia y constantes. No atribuir causalidad si cambiaron varias variables simultáneamente.

Cuando la hipótesis dependa del comportamiento del ejecutor, considerar replicación. Una sola imagen puede demostrar que algo ocurrió una vez, pero no necesariamente que el comportamiento sea estable.

## 16. Atribución de fallos

Un fallo debe atribuirse provisionalmente a una o más capas:

```text
PROJECT / CANON
CONTRACT
FORMAL STRUCTURE
ASC COMPILATION
HANDOFF
EXECUTOR / TOOL
VISUAL REPRESENTATION
EXPERIMENT DESIGN
UNKNOWN
```

No convertir una limitación del ejecutor en requisito arquitectónico del proyecto consumidor.

## 17. Regla para artefactos editoriales con texto

Cuando el artefacto contenga texto normativo o abundante, la fidelidad textual es un criterio estructural si el contenido debe preservarse literalmente.

Preferencia de producción:

```text
CONTENIDO AUTORIZADO
→ ESTRUCTURA / LAYOUT
→ COMPOSICIÓN VISUAL
→ CAPA TEXTUAL DETERMINISTA cuando sea posible
```

Un generador visual puede explorar composición, pero un error ortográfico o alteración semántica bloquea validación cuando la fidelidad textual sea crítica.

## 18. Protocolo experimental mínimo

```text
1. identificar proyecto consumidor y autoridad
2. formular pregunta
3. registrar contrato
4. construir estructura formal si corresponde
5. ejecutar STRUCTURE CHECK
6. definir variable y constantes
7. clasificar criterios críticos/secundarios
8. compilar prompt ASC
9. ejecutar HANDOFF CHECK
10. generar si los gates pasan
11. auditar estructura antes que estética
12. atribuir fallos
13. separar hallazgo ASC de hallazgo del proyecto consumidor
14. replicar cuando corresponda
15. documentar
```

## 19. Principios de cierre

- ASC es independiente de Árboris.
- Árboris es su primer proyecto piloto/caso de uso real.
- ASC compila; no decide la verdad del proyecto consumidor.
- Mantener `OPEN` es preferible a inventar.
- Una relación normativa debe existir como estructura antes de depender de su apariencia.
- Fuente de verdad → estructura → derivación → representación.
- La estética no compensa un fallo estructural.
- Un resultado generativo no adquiere autoridad por plausibilidad.
- Separar hallazgo ASC de hallazgo Árboris.
- Una limitación del ejecutor no debe convertirse automáticamente en arquitectura.

## 20. Límites actuales

Permanecen `OPEN`:

- nombre completo definitivo de ASC fuera del contexto Árboris, si Álvaro decide modificarlo;
- formato serializado definitivo de contratos y estructuras formales;
- automatización de ASC como código;
- proveedor/modelo definitivo;
- estrategia de prompt por proveedor/modelo;
- métricas automáticas de fidelidad estructural;
- integración con renderer/blockout;
- persistencia/versionado de resultados;
- número estándar de repeticiones por tipo de prueba.

No crear capas adicionales hasta que una necesidad demostrada las justifique.
