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
MODELO / HERRAMIENTA GENERATIVA
        ↓
RESULTADO
        ↓
AUDITORÍA
```

## 2. Terminología obligatoria

- **ASC:** sistema de compilación.
- **prompt ASC:** instrucción compilada que ASC entrega al ejecutor generativo.
- **modelo generativo / ejecutor:** sistema externo que interpreta el prompt ASC.
- **resultado ASC:** salida producida mediante un prompt ASC. No constituye evidencia por sí misma.
- **prueba ASC:** experimento controlado para evaluar compilación, traducción o representación.
- **contrato de entrada:** conjunto explícito de relaciones, restricciones y estados que ASC debe preservar.

No llamar "modelo de Árboris" al ejecutor generativo cuando se quiera describir ASC. Deben distinguirse ambos componentes.

### Uso operativo en conversación

Para reducir ambigüedad, estas expresiones tienen significado estable:

```text
"compila con ASC" / "pásalo por ASC"
→ construir el prompt ASC; no ejecutar generación salvo que también se pida.

"ejecuta con ASC" / "genera con ASC"
→ compilar primero y luego ejecutar el prompt con la herramienta generativa disponible.

"audita ASC" / "audita el resultado ASC"
→ revisar prompt y/o resultado contra contrato, fuentes y criterios de validación.

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
→ modelo generativo
```

Ejemplos:

- conocimiento botánico: usar las fuentes/datos canónicos definidos por Árboris; ASC no crea conocimiento botánico paralelo;
- relaciones territoriales: preservar claims, procedencia y estados de evidencia definidos por el modelo territorial;
- navegación: respetar el Navigation Contract y la región transitable autoritativa;
- arte: respetar la autoridad de dirección gráfica y producción correspondiente.

Una salida generativa nunca puede corregir, completar ni reemplazar una autoridad superior por mera plausibilidad visual.

Ante contradicción, prevalece la autoridad del dominio y la contradicción debe registrarse.

## 4. Estados de información para compilación

Toda información relevante que llegue a ASC debe recibir un **tratamiento de compilación**, según corresponda:

- **KNOWN / respaldado:** puede trasladarse a la compilación.
- **OPEN:** no existe evidencia o decisión suficiente; debe permanecer abierto.
- **PROHIBIDO INFERIR:** el ejecutor no puede completar el vacío.
- **ART-PROVISIONAL:** decisión visual permitida para la prueba, sin valor de evidencia.

Estos tratamientos son propios de ASC y **no reemplazan los estados del dominio**. Si una entrada territorial contiene `claimState`, `evidenceStatus` o `productionStatus`, ASC debe preservarlos y derivar su tratamiento de compilación sin reescribirlos. Lo mismo aplica a estados canónicos de otros sistemas.

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

Si un dato es necesario para producir la escena pero permanece `OPEN`, ASC debe omitirlo, neutralizarlo mediante placeholder o declarar la limitación; no debe resolverlo silenciosamente.

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

La posición posterior en un recorrido no implica mayor elevación. Un nivel de altura no equivale a un nodo topológico.

## 7. Compilación mínima

Antes de producir un prompt ASC, identificar:

1. **Objetivo de la generación.** Qué se está probando y qué no.
2. **Fuentes de autoridad.** Documentos, datos, imágenes o contratos permitidos.
3. **Relaciones obligatorias.** Elementos que la salida debe preservar.
4. **Estados OPEN.** Información que no puede cerrarse por inferencia.
5. **Prohibiciones.** Elementos que el generador no debe introducir.
6. **Grado de libertad artística.** Qué puede variar sin alterar la prueba.
7. **Contrato de cámara/salida.** Cuando corresponda.
8. **Criterios de validación.** Cómo se decidirá PASS / PARTIAL / FAIL.
9. **Modo de ejecución.** `compile-only` o `compile-and-execute`.

## 8. Forma recomendada de un prompt ASC

```text
[IDENTIDAD DE LA PRUEBA]

[OBJETIVO]

[INPUT / FUENTES AUTORIZADAS]

[CONTRATO ESTRUCTURAL]

[RELACIONES OBLIGATORIAS]

[OPEN / NO INFERIR]

[PROHIBIDO]

[LIBERTAD ARTÍSTICA AUTORIZADA]

[CÁMARA / FORMATO]

[PRIORIDADES DE LECTURA]

[CRITERIOS DE VALIDACIÓN]
```

No todas las secciones deben aparecer literalmente en el prompt final si el ejecutor funciona mejor con otra redacción, pero su información no puede perderse durante la compilación.

ASC puede adaptar redacción, orden y nivel de detalle al ejecutor concreto, pero **no puede debilitar restricciones para obtener una imagen más atractiva**.

## 9. Uso de fuentes visuales y territoriales

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

`docs/SCENE_REFERENCE_BRIEF_TEMPLATE.md` es una plantilla de **entrada/revisión de referencias ambientales y decisiones de arte**. Puede alimentar ASC cuando corresponda, pero no sustituye el contrato territorial, de navegación, cámara o interacción. Sus estados `OBSERVED`, `RECURRENT`, `APPROVED_ART_RULE` y `OPEN` conservan su semántica propia; ASC los consume sin redefinirlos.

## 10. Resultados generativos

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

Los textos, escalas, coordenadas, leyendas, nombres o mediciones inventados por el generador tampoco adquieren autoridad por aparecer impresos en la imagen.

Cuando la prueba pretenda validar topología, la conectividad debe evaluarse contra el contrato o `walkableEnvelope`; la apariencia de un sendero en una imagen no certifica transitabilidad por sí sola.

## 11. Pruebas ASC

Formato de identificación recomendado:

```text
<familia>-TEST-<número>
```

Ejemplos:

```text
TOPOLOGY-STRESS-TEST-001
TERRITORIAL-TRANSLATION-TEST-001
```

Las versiones sucesivas deben cambiar una hipótesis o restricción identificable. No generar variantes únicamente por estética cuando el objetivo declarado es validar estructura.

Cada prueba debe registrar al menos:

- objetivo;
- input;
- restricciones;
- resultado;
- hallazgos;
- PASS / PARTIAL / FAIL por criterio relevante;
- decisiones que permanecen `OPEN`.

Cuando se compare una serie de pruebas, debe registrarse **qué variable cambió** entre versiones para evitar atribuir mejoras a factores no controlados.

## 12. Auditoría obligatoria

Toda consolidación de reglas ASC, contratos, pruebas que cambien el modelo de trabajo o conclusiones que pretendan convertirse en canon debe aplicar `docs/DEVELOPMENT_MANUAL.md` y responder explícitamente:

```text
AUDITORÍA
INCONSISTENCIAS
VACÍOS / OMISIONES
REDUNDANCIAS
```

Una imagen atractiva no constituye un PASS si viola relaciones obligatorias.

## 13. Principios operativos

```text
compilar antes de generar
separar dato de representación
preservar OPEN antes de inventar
validar estructura antes de decorar
el grafo manda sobre la apariencia
la evidencia manda sobre la plausibilidad
la salida generativa no se autocertifica
```

## 14. Límites actuales

Permanecen `OPEN` hasta validación específica:

- formato serializado definitivo de los contratos ASC;
- automatización del compilador como código;
- proveedor o modelo generativo definitivo;
- estrategia de prompts por proveedor/modelo;
- métricas automáticas de fidelidad topológica;
- integración directa con renderer o herramientas de blockout;
- persistencia/versionado específico de resultados ASC.

No crear estas capas por anticipación si una prueba concreta todavía no las necesita.
