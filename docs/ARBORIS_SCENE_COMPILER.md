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

## 3. Autoridad y precedencia

ASC compila; no decide la verdad del proyecto.

Orden de autoridad:

```text
fuente/evidencia válida
→ documento o dato canónico de Árboris
→ contrato específico de la prueba/escena
→ reglas ASC
→ decisiones artísticas autorizadas
→ modelo generativo
```

Una salida generativa nunca puede corregir, completar ni reemplazar una fuente superior por mera plausibilidad visual.

Ante contradicción, prevalece la fuente de mayor autoridad y la contradicción debe registrarse.

## 4. Estados de información

Toda información relevante que llegue a ASC debe poder clasificarse, según corresponda, como:

- **KNOWN / respaldado:** puede trasladarse a la compilación.
- **OPEN:** no existe evidencia o decisión suficiente; debe permanecer abierto.
- **PROHIBIDO INFERIR:** el ejecutor no puede completar el vacío.
- **ART-PROVISIONAL:** decisión visual permitida para la prueba, sin valor de evidencia.

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
