# Árboris Scene Compiler (ASC)

**Estado:** normativo  
**Nombre operativo:** ASC  
**Nombre completo:** Arboris Scene Compiler / Compilador de Escenas Árboris  
**Ámbito:** compilación de instrucciones para generación de escenas, blockouts y prototipos visuales a partir del canon, contratos y evidencia de Árboris.

## 1. Definición

ASC es la capa de compilación de Árboris que transforma información estructurada del proyecto en una instrucción ejecutable por un modelo o herramienta generativa.

ASC **no es el modelo generativo**, **no es el renderer**, **no es el motor de navegación** y **no es una fuente de verdad territorial, botánica o científica**.

```text
EVIDENCIA / INPUT
        ↓
CANON ÁRBORIS
        ↓
CONTRATOS
territorial · navegación · cámara · interacción · visual
        ↓
RESTRICCIONES
known / OPEN / prohibido inferir
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

## 2. Terminología obligatoria

- **ASC:** sistema de compilación.
- **prompt ASC:** instrucción compilada que ASC entrega al ejecutor generativo.
- **prompt efectivo:** instrucción que realmente recibe el ejecutor después de cualquier adaptación de la herramienta o proveedor.
- **handoff:** transferencia del prompt ASC al ejecutor.
- **handoff check:** comparación entre contrato, prompt ASC y prompt efectivo para verificar que no se debilitaron restricciones ni se introdujeron instrucciones nuevas.
- **modelo generativo / ejecutor:** sistema externo que interpreta el prompt efectivo y produce la salida.
- **resultado ASC:** salida producida mediante una ejecución iniciada desde un prompt ASC. No constituye evidencia por sí misma.
- **prueba ASC:** experimento controlado para evaluar compilación, traducción o representación.
- **contrato de entrada:** conjunto explícito de relaciones, restricciones y estados que ASC debe preservar.

No llamar "modelo de Árboris" al ejecutor generativo cuando se quiera describir ASC. Deben distinguirse ambos componentes.

### Uso operativo en conversación

```text
"compila con ASC" / "pásalo por ASC"
→ construir el prompt ASC; no ejecutar generación salvo que también se pida.

"ejecuta con ASC" / "genera con ASC"
→ compilar, verificar handoff cuando corresponda y luego ejecutar.

"audita ASC" / "audita el resultado ASC"
→ revisar contrato, prompt ASC, prompt efectivo y/o resultado según el alcance de la prueba.

"usa X como evidencia/input ASC"
→ X puede alimentar la compilación; no adquiere automáticamente autoridad ni permite completar vacíos.
```

Cuando la instrucción sea ambigua entre **compilar** y **ejecutar**, conservar la distinción y no tratar la salida generativa como si fuera parte del compilador.

## 3. Autoridad y precedencia

ASC compila; no decide la verdad del proyecto.

Antes de compilar, debe identificarse la **autoridad del dominio** aplicable. No existe una regla universal donde cualquier imagen o fuente externa prevalezca sobre el canon interno. La autoridad depende del tipo de información: botánica, territorial, navegación, arte, producto, etc.

Orden operativo general:

```text
autoridad del dominio + evidencia válida
→ contrato específico de la prueba/escena
→ reglas ASC
→ decisiones artísticas autorizadas
→ ejecutor generativo
```

Una salida generativa nunca puede corregir, completar ni reemplazar una autoridad superior por mera plausibilidad visual.

Ante contradicción, prevalece la autoridad del dominio y la contradicción debe registrarse.

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

Salvo autorización explícita del contrato, no se deben inventar:

- conexiones o bifurcaciones;
- altimetría, pendientes o desniveles;
- hidrología;
- infraestructura;
- especies o distribución botánica;
- hitos territoriales;
- dimensiones, escalas o distancias;
- orientación cardinal;
- microhábitats;
- accesibilidad o transitabilidad;
- relaciones espaciales no respaldadas.

Si un dato es necesario para producir la escena pero permanece `OPEN`, ASC debe omitirlo, neutralizarlo mediante placeholder, tratarlo como `ART-PROVISIONAL` cuando el contrato lo autorice o declarar la limitación. No debe resolverlo silenciosamente.

## 6. Separación de capas

ASC debe mantener separadas, como mínimo, las siguientes capas cuando sean relevantes:

```text
EVIDENCIA
qué está respaldado

TERRITORIO
qué entidades y relaciones existen

TOPOLOGÍA / NAVEGACIÓN
qué conecta con qué y qué es caminable

ELEVACIÓN
altura relativa, independiente del orden del grafo

CÁMARA
cómo se observa la escena

INTERACCIÓN / APRENDIZAJE
qué función jugable cumple cada espacio

ARTE
cómo se representa visualmente lo ya autorizado
```

La posición posterior en un recorrido no implica mayor elevación. Un nivel de altura no equivale a un nodo topológico. La adyacencia tampoco equivale automáticamente a una conexión transitable; cuando la transitabilidad sea relevante debe declararse explícitamente.

## 7. Compilación mínima

Antes de producir un prompt ASC, identificar:

1. **Pregunta experimental.** Qué propiedad concreta se intenta comprobar.
2. **Objetivo de la generación.** Qué se está probando y qué no.
3. **Fuentes de autoridad.** Documentos, datos, imágenes o contratos permitidos.
4. **Relaciones obligatorias.** Elementos que la salida debe preservar.
5. **Estados OPEN.** Información que no puede cerrarse por inferencia.
6. **Prohibiciones.** Elementos que el generador no debe introducir.
7. **Grado de libertad artística.** Qué puede variar sin alterar la prueba.
8. **Contrato de cámara/salida.** Cuando corresponda.
9. **Variable experimental.** Qué cambia respecto de la prueba anterior.
10. **Constantes.** Qué debe permanecer idéntico entre versiones comparables.
11. **Criterios de validación.** Cómo se decidirá PASS / PARTIAL / FAIL / INCONCLUSIVE.
12. **Modo de ejecución.** `compile-only` o `compile-and-execute`.

## 8. Forma recomendada de un prompt ASC

```text
[IDENTIDAD DE LA PRUEBA]

[PREGUNTA EXPERIMENTAL]

[OBJETIVO]

[INPUT / FUENTES AUTORIZADAS]

[CONTRATO ESTRUCTURAL]

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

ASC puede adaptar redacción, orden y nivel de detalle al ejecutor concreto, pero **no puede debilitar restricciones ni introducir elementos prohibidos para obtener una salida más atractiva o fácil de generar**.

## 9. Handoff y fidelidad de ejecución

Cuando el proveedor, interfaz o herramienta pueda reescribir el prompt, una prueba estructural no se considera válida hasta revisar el handoff.

El registro mínimo es:

```text
CONTRATO DE ENTRADA
↓
PROMPT ASC
↓
PROMPT EFECTIVO
↓
RESULTADO
```

El `HANDOFF CHECK` debe verificar al menos:

- restricciones críticas preservadas;
- cantidades exactas preservadas cuando sean parte del gate;
- prohibiciones preservadas;
- ningún `OPEN` cerrado por reformulación;
- ningún elemento nuevo incorporado por la adaptación;
- ninguna instrucción cuantitativa degradada de exacta a aproximada.

Ejemplos de fallos de handoff:

```text
"exactamente 9 regiones" → "aproximadamente 9 regiones"
"sin caminos" → "caminos de tierra"
"sin vegetación" → "vegetación dispersa"
```

Si el handoff falla en una restricción crítica, el resultado puede estudiarse como comportamiento del ejecutor, pero **no valida la hipótesis estructural original**.

## 10. Uso de fuentes visuales y territoriales

Una imagen, mapa, fotografía o croquis puede ser input ASC, pero debe distinguirse entre:

- lo visible o explícitamente declarado en la fuente;
- lo que puede derivarse de forma segura;
- lo que permanece desconocido.

En traducción territorial, el flujo preferido es:

```text
fuente territorial
→ extracción de relaciones respaldadas
→ Territorial Translation Contract
→ Navigation / Camera / Interaction Contract cuando corresponda
→ ASC
→ prompt
→ blockout o prototipo
```

No usar una imagen generada como corroboración independiente de la fuente que originó esa misma generación.

Cuando una fuente visual no permite determinar altimetría, escala, geometría exacta, orientación o transitabilidad, esas propiedades deben seguir `OPEN` aunque el ejecutor sea capaz de representarlas de forma plausible.

`docs/SCENE_REFERENCE_BRIEF_TEMPLATE.md` puede alimentar ASC cuando corresponda, pero no sustituye los contratos de dominio.

## 11. Resultados generativos

Todo resultado ASC debe considerarse por defecto **propuesta o evidencia experimental**, nunca evidencia territorial, botánica o científica.

Una salida visual puede validar, entre otras cosas:

- legibilidad;
- composición;
- traducción de un grafo;
- jerarquía de rutas;
- relación visual entre alturas;
- comportamiento de cámara;
- densidad y lenguaje artístico.

No puede validar por sí sola que una relación territorial real sea verdadera.

Cuando la prueba pretenda validar topología, la conectividad debe evaluarse contra el contrato o `walkableEnvelope`; la apariencia de un sendero no certifica transitabilidad por sí sola.

## 12. Clases de pruebas ASC

Separar, cuando corresponda, dos familias de prueba:

### ASC-STRUCTURAL TEST

Comprueba si el ejecutor preserva información y relaciones obligatorias.

Prioridad de revisión:

```text
topología
→ conectividad
→ elevación
→ cantidades exactas
→ ausencia de invención
→ representación
```

La estética no puede compensar un fallo estructural.

### ASC-VISUAL TEST

Comprueba cómo se representa información cuya estructura ya está suficientemente controlada.

Puede evaluar:

- naturalización;
- jerarquía visual;
- densidad;
- composición;
- tratamiento de superficies;
- lenguaje gráfico.

No debe utilizarse para cerrar relaciones estructurales todavía no validadas.

## 13. Criterios críticos y secundarios

Toda prueba debe clasificar sus criterios antes de ejecutar.

### Críticos

Un fallo crítico produce `FAIL` estructural aunque la imagen sea visualmente atractiva.

Ejemplos:

- topología;
- conectividad;
- elevación relativa cuando sea parte del contrato;
- número exacto de entidades cuando sea parte del gate;
- prohibiciones de invención;
- correspondencia con autoridad superior.

### Secundarios

Pueden quedar `PARTIAL` sin invalidar la hipótesis estructural si el objetivo no depende de ellos.

Ejemplos:

- naturalización;
- textura;
- iluminación;
- composición secundaria;
- acabado visual.

## 14. Protocolo experimental

Las versiones sucesivas deben cambiar una hipótesis o restricción identificable. No generar variantes únicamente por estética cuando el objetivo declarado es validar estructura.

Cada prueba debe registrar al menos:

- identificador;
- pregunta experimental;
- objetivo;
- input;
- restricciones;
- variable modificada;
- constantes;
- prompt ASC;
- prompt efectivo cuando sea observable;
- estado del handoff;
- resultado;
- hallazgos;
- PASS / PARTIAL / FAIL / INCONCLUSIVE por criterio;
- atribución del fallo o éxito;
- decisiones que permanecen `OPEN`.

Usar `docs/ASC_TEST_RECORD_TEMPLATE.md` como plantilla de registro mientras no exista un formato serializado definitivo.

## 15. Replicación y estabilidad

Una sola salida puede demostrar que un fallo es posible, pero no demuestra estabilidad ni reproducibilidad de un comportamiento correcto.

Cuando una decisión vaya a apoyarse en consistencia del ejecutor:

- repetir la prueba con el mismo contrato;
- registrar qué se mantuvo constante;
- distinguir éxito aislado de comportamiento repetible;
- no convertir una sola generación favorable en garantía del sistema.

El número de repeticiones se define por el riesgo de la decisión; no existe todavía un número canónico universal.

## 16. Comparación con baseline

Cuando se quiera evaluar cuánto aporta ASC como método y no solo si una escena puede generarse, usar comparación controlada cuando sea viable:

```text
A — prompt convencional
B — prompt ASC
```

Mantener el mismo ejecutor, objetivo y condiciones relevantes. La comparación es experimental y no convierte automáticamente a ASC en superior por una sola salida.

## 17. Atribución de resultados

Los hallazgos deben atribuirse al nivel correcto. Como mínimo considerar:

- contrato / diseño experimental;
- compilación ASC;
- handoff / adaptación;
- ejecutor generativo;
- representación visual;
- herramienta/proveedor;
- referencia o fuente de entrada.

No trasladar automáticamente una limitación del ejecutor a la arquitectura de Árboris.

Una conclusión no puede ser más amplia que la evidencia del gate.

## 18. Auditoría obligatoria

Toda consolidación de reglas ASC, contratos, pruebas que cambien el modelo de trabajo o conclusiones que pretendan convertirse en canon debe aplicar `docs/DEVELOPMENT_MANUAL.md` y responder explícitamente:

```text
AUDITORÍA
INCONSISTENCIAS
VACÍOS / OMISIONES
REDUNDANCIAS
```

Una imagen atractiva no constituye un PASS si viola relaciones obligatorias.

## 19. Principios operativos

```text
compilar antes de generar
verificar handoff antes de interpretar
separar dato de representación
preservar OPEN antes de inventar
validar estructura antes de decorar
cambiar una variable por vez cuando el gate dependa de causalidad
el grafo manda sobre la apariencia
la evidencia manda sobre la plausibilidad
la salida generativa no se autocertifica
un resultado correcto aislado no demuestra estabilidad
```

## 20. Límites actuales

Permanecen `OPEN` hasta validación específica:

- formato serializado definitivo de los contratos ASC;
- automatización del compilador como código;
- proveedor o modelo generativo definitivo;
- estrategia de prompts por proveedor/modelo;
- métricas automáticas de fidelidad topológica;
- integración directa con renderer o herramientas de blockout;
- persistencia/versionado específico de resultados ASC;
- número estándar de repeticiones por clase de prueba.

No crear estas capas por anticipación si una prueba concreta todavía no las necesita.

## 21. Guía operativa de vocabulario

[`ASC_VOCABULARY_GUIDE.md`](ASC_VOCABULARY_GUIDE.md) es la referencia rápida aprobada provisionalmente para términos, órdenes de trabajo y tratamientos de información de ASC. Es didáctica y no reemplaza este documento normativo.
