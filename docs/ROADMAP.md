Árboris — Roadmap

Versión: 0.3
Última actualización: 15 septiembre 2026
Estado: Piloto 1.0 en desarrollo

1. Propósito

Este documento registra el orden de trabajo del Piloto 1.0 de Árboris.

No es una lista de todas las funciones imaginables del producto. Su objetivo es impedir que el desarrollo se disperse y mantener el foco en cerrar un ciclo completo y comprobable con datos reales.

El principio operativo es:

conectar y validar lo que ya existe antes de abrir nuevas líneas técnicas.

La prioridad actual no es aumentar el número de especies ni construir infraestructura de producción. Es conseguir que las piezas científicas, botánicas, visuales y lúdicas ya desarrolladas funcionen juntas de extremo a extremo.

2. Objetivo del Piloto 1.0

El piloto debe demostrar una experiencia coherente de búsqueda del tesoro botánica:

recibir una especie objetivo
→ explorar en terreno
→ encontrar una posible planta
→ observarla
→ registrar evidencia
→ obtener candidatos visuales
→ discriminar mediante caracteres botánicos
→ producir una hipótesis razonada
→ comprobar si corresponde al objetivo
→ descubrir
→ desbloquear
→ incorporar a la colección
→ generar un incentivo para volver a explorar

El universo inicial permanece deliberadamente limitado a una zona piloto y seis especies.

Especies del piloto

ID runtime

Especie

SP001

Cryptocarya alba — Peumo

SP002

Lithraea caustica — Litre

SP003

Kageneckia oblonga — Bollén

SP004

Podanthus mitiqui — Mitique

SP005

Colliguaja odorifera — Colliguay

SP006

Quillaja saponaria — Quillay

3. Estado consolidado

Al cierre del 15 de septiembre de 2026 ya están resueltos o suficientemente establecidos para continuar:

concepto central de Árboris;

alcance del piloto;

principios de producto;

seis especies seleccionadas;

biblioteca fotográfica real;

base botánica maestra;

validación estructural de las seis fichas;

exportación de la base botánica a datos computables;

integración de fichas y fotografías;

clave botánica adaptativa funcional;

benchmark visual con BioCLIP;

validación de consistencia de identificadores de especies;

prototipo web local del flujo de identificación;

experimentos de visión V2, V3 y V4;

modelo conceptual de observación, evidencia e identificación;

definición funcional del ciclo de búsqueda, descubrimiento y colección.

El principal problema pendiente no es la ausencia de componentes.

Es su integración.

4. Hitos consolidados hasta el estado actual

Los siguientes hitos corresponden al seguimiento ya consolidado del proyecto.

Hito 1 — Concepto del producto

Estado: completado

Definición de Árboris como experiencia de exploración, descubrimiento y colección de flora nativa en el mundo real.

La identificación asistida se establece como una mecánica central, no como el producto completo.

Hito 2 — Alcance del piloto

Estado: completado

Piloto limitado a:

una zona/contexto territorial;

seis especies;

datos reales;

ciclo completo antes que expansión.

Hito 3 — Principios de producto

Estado: completado

Quince principios no negociables establecidos en docs/PRODUCT_PRINCIPLES.md.

Hito 4 — Selección de seis especies

Estado: completado

Catálogo inicial cerrado para el piloto.

Hito 5 — Biblioteca fotográfica

Estado: completado para el alcance actual

Base inicial de fotografías reales organizada para las seis especies.

La biblioteca puede seguir creciendo, pero su ampliación no debe bloquear la integración actual.

Hito 6 — Base botánica maestra

Estado: completado

Base_botanica_Pokedex_flora_Master.xlsx se establece como fuente editorial/científica maestra.

Fichas_especies_arboris.xlsx queda como antecedente descriptivo y no como segunda fuente de verdad.

Hito 7 — Validación de las seis especies

Estado: completado

Las seis fichas del piloto fueron validadas estructuralmente.

Resultado consolidado:

6 especies validadas
0 warnings
0 conflictos

Hito 8 — Base maestra a datos computables

Estado: completado

La información botánica maestra fue transformada a estructuras JSON utilizables por el sistema.

Flujo establecido:

Master editorial
→ validación
→ exportación
→ JSON
→ fichas computables

Hito 9 — Integración de fichas y fotografías

Estado: completado

Las fichas computables se relacionan con las fotografías, individuos y observaciones existentes.

Los datos faltantes permanecen explícitamente desconocidos y no se inventan.

Hito 10 — Clave adaptativa funcional

Estado: completado como prototipo

Existe una clave adaptativa capaz de:

mantener candidatos;

formular preguntas;

aceptar Sí / No / No sé / No puedo observarlo;

eliminar candidatos únicamente cuando existe evidencia válida;

mantener especies sin datos cuando el carácter no está informado.

La lógica actual se encuentra en:

tools/botanical-key-validation/logic.mjs

Hitos 11–13 — Experimentación e integración intermedia

Estado: experimental / parcialmente integrado

Durante esta etapa se desarrollaron y evaluaron componentes de visión, selección de evidencia e integración.

Incluyen trabajo en:

vision_v02;

selección de evidencia botánica;

experimentos con MobileSAM;

vision_v03;

DINOv2;

prototipos de hipótesis y trazabilidad;

interfaz web local de identificación.

Estos componentes son antecedentes técnicos útiles, pero no todos forman parte de la arquitectura definitiva.

No deben mantenerse únicamente porque ya fueron desarrollados.

Hito 14 — Benchmark visual consolidado

Estado: completado

BioCLIP fue evaluado como generador de candidatos para las seis especies.

Benchmark consolidado sobre 300 imágenes, 50 por especie:

Top-1: 83.00 %
Top-2: 93.33 %
Top-3: 97.67 %

Quillay mostró la principal dificultad:

Top-1: 32 %
Top-2: 66 %
Top-3: 88 %

La conclusión funcional es:

BioCLIP es útil para generar candidatos, pero no debe decidir por sí solo la identificación.

Un caso real de Quillay mostró precisamente esta función: la señal visual favorecía principalmente Peumo, mientras la evidencia botánica permitió corregir la hipótesis hacia Quillay.

No se debe centrar la lógica en un umbral arbitrario de score visual.

Hito 14.5 — Consistencia de identificadores

Estado: completado

Se validó la correspondencia entre los identificadores editoriales del Master y los identificadores utilizados en runtime.

Herramienta:

tools/botanical-data/validate_species_ids.py

Resultado:

6 especies OK
0 conflictos

5. Hito 15 — Conectar fichas computables con la clave adaptativa

Estado: siguiente prioridad oficial

Este es el trabajo que debe retomarse antes de abrir una nueva línea técnica.

Problema

La clave adaptativa funciona, pero todavía contiene una mini representación botánica hardcodeada en:

tools/botanical-key-validation/logic.mjs

Al mismo tiempo, Árboris ya dispone de fichas botánicas validadas y computables derivadas de la fuente maestra.

Mantener ambas representaciones produciría duplicación y riesgo de divergencia.

Objetivo

Conectar:

Base_botanica_Pokedex_flora_Master.xlsx
        ↓
data/botanical/*.json
        ↓
data/species/SP001...SP006.json
        ↓
adapter
        ↓
logic.mjs
        ↓
clave adaptativa

La base maestra debe gobernar el conocimiento botánico.

La clave debe consumir una traducción de esos datos, no mantener una segunda botánica independiente.

Primer componente

Crear:

tools/botanical-key-validation/species_adapter.mjs

El adapter debe comenzar como componente independiente.

No modificar logic.mjs hasta comprobar que la traducción reproduce correctamente el comportamiento esperado.

Caracteres iniciales

La clave actual utiliza cuatro conceptos.

Correspondencia inicial:

Clave

Master

margin

CH-003

glands

CH-017

venation

CH-008 — correspondencia parcial

underside

CH-005

Advertencia sobre venation

La pregunta histórica de la clave contiene una semántica más amplia que CH-008.

La lógica pregunta aproximadamente por una nervadura:

clara o amarillenta;

nítida;

marcadamente prominente.

CH-008, en cambio, representa solamente:

Nervio medio prominente
sí / no / no_se

No deben añadirse al Master propiedades que CH-008 no representa solamente para hacer coincidir la lógica histórica.

La fuente maestra gobierna.

La discrepancia debe resolverse explícitamente.

Secuencia de trabajo del Hito 15

Crear species_adapter.mjs.

Leer las seis fichas computables.

Localizar CH-003, CH-017, CH-008 y CH-005.

Inspeccionar los estados reales disponibles.

Traducir el vocabulario del Master al vocabulario esperado por la clave.

Construir una matriz comparativa para las seis especies.

Comparar esa matriz con la botánica hardcodeada actual.

Documentar discrepancias.

Mantener datos ausentes como desconocidos/no restrictivos.

Resolver explícitamente la equivalencia parcial de venation.

Conectar el adapter con logic.mjs solamente después de validar la equivalencia.

Ejecutar pruebas de regresión de la clave.

Regla crítica

SIN DATO ≠ NO

La ausencia de conocimiento no puede utilizarse como evidencia negativa.

Una especie sin estado informado para un carácter debe permanecer candidata salvo que otra evidencia permita descartarla.

Criterio de cierre

El Hito 15 se considera cerrado cuando:

la clave obtiene sus estados botánicos desde las fichas computables;

no existe una segunda fuente manual de conocimiento botánico;

los casos de prueba existentes siguen funcionando;

los estados desconocidos no producen eliminaciones incorrectas;

la discrepancia de venation queda resuelta o explícitamente representada;

la trazabilidad Master → JSON → adapter → clave es comprobable.

6. Trabajo posterior al Hito 15

A partir de este punto, este roadmap no asigna números de hito nuevos.

Las siguientes etapas son prioridades previstas y deberán formalizarse como hitos únicamente cuando el Hito 15 esté cerrado y exista evidencia suficiente para definir su alcance.

Integración de observación visual de caracteres

Después del Hito 15, seleccionar solamente uno o dos caracteres botánicos para probar observación automática.

Candidatos iniciales:

margen foliar;

forma/proporción de la hoja.

El experimento debe responder una pregunta concreta:

¿Puede un modelo visual abierto observar de forma suficientemente fiable un carácter botánico solicitado a partir de fotografías reales del piloto?

El modelo deberá responder dentro de un vocabulario restringido y disponer de abstención explícita:

estado permitido
o
NO_OBSERVABLE

La primera alternativa a evaluar es un modelo multimodal ligero como SmolVLM.

PlantCV, Leaf Analyzer, MobileSAM u otras herramientas deben utilizarse solamente si aparece un bloqueo concreto que justifique incorporarlas.

No desarrollar un detector propio mientras una solución existente pueda resolver adecuadamente el problema.

Integración visión → evidencia → clave

Si la observación automática de caracteres demuestra utilidad, conectarla al flujo:

candidatos
→ carácter discriminativo necesario
→ buscar evidencia existente
→ observación automática si corresponde
→ evidencia o abstención
→ usuario / nueva fotografía si es necesario
→ clave
→ hipótesis

La procedencia de cada carácter debe conservarse.

Un carácter inferido por un modelo no debe volverse indistinguible de una respuesta humana.

Contexto ecológico, geográfico y fenológico

Incorporar progresivamente:

territorio;

ecosistema;

distribución;

época;

fenología;

microhábitat cuando exista información.

El contexto debe modificar o informar las hipótesis sin inventar certeza.

No es necesario construir toda esta capa antes de validar el flujo botánico básico.

Persistencia completa

Implementar la persistencia del núcleo:

Species
→ Individual
→ Observation
→ Evidence
→ Identification

La arquitectura permanece offline-first.

SQLite mediante expo-sqlite es la opción prevista para persistencia local móvil.

El esquema físico definitivo debe derivarse del modelo de dominio validado y no al revés.

Flujo end-to-end del Piloto 1.0

Conectar todos los componentes necesarios para demostrar:

especie objetivo
→ guía
→ exploración
→ posible hallazgo
→ fotografía
→ candidatos
→ evidencia botánica
→ clave adaptativa
→ hipótesis
→ comparación con objetivo
→ descubrimiento
→ desbloqueo
→ colección

El sistema debe aceptar también:

UNRESOLVED

y:

NO CORRESPONDE
→ seguir explorando

Validación en terreno

Probar el flujo con fotografías reales y condiciones de uso reales.

Evaluar especialmente:

iluminación imperfecta;

fondos complejos;

hojas parcialmente ocultas;

variación intraespecífica;

caracteres no observables;

especies visualmente confundibles;

funcionamiento con poca conectividad;

cantidad de interacción requerida.

El objetivo no es producir una demo perfecta en escritorio.

Es comprobar que la experiencia tiene sentido en terreno.

Capa de descubrimiento y colección

Conectar una identificación suficientemente respaldada con un evento de descubrimiento.

Mantener:

Identification ≠ Discovery

La política exacta de evidencia necesaria para desbloquear una especie debe validarse explícitamente.

Después del descubrimiento:

Discovery
→ CollectionEntry
→ GameCharacter

La especie biológica, las observaciones y el personaje permanecen separados.

Utilidad jugable de la colección

Una vez demostrado el ciclo principal, validar que coleccionar especies produzca una consecuencia jugable.

El personaje asociado a cada especie debe tener utilidad futura dentro del juego.

No es necesario construir ahora un sistema complejo de combate, progresión o minijuegos.

Primero debe demostrarse que:

encontrar una planta real
→ desbloquear algo
→ querer utilizarlo
→ querer seguir explorando

7. Líneas técnicas estacionadas

Las siguientes líneas no están eliminadas, pero no son prioridad actual.

Visión morfológica propia

Los experimentos históricos de extracción geométrica y margen foliar quedan como antecedentes.

Incluyen:

eje base–ápice;

dirección de nervadura principal;

scans transversales;

estimación de márgenes;

geometría de contorno;

Fourier futuro.

El problema observado de continuación ambigua del margen en presencia de hojas vecinas sigue siendo válido.

No continuar esta línea salvo que los modelos existentes no puedan resolver una necesidad concreta del piloto.

Segmentación

EfficientSAM ViT-Tiny fue probado y no produjo una segmentación suficientemente útil en el benchmark inicial.

El experimento debe conservarse como evidencia negativa.

No parchear indefinidamente una solución que no está demostrando utilidad.

MobileSAM y otras alternativas permanecen disponibles solamente si aparece una necesidad real de segmentación.

Clasificadores propios

Los clasificadores históricos basados en features, PCA y SVM son antecedentes del proyecto.

No constituyen la estrategia visual principal actual.

BioCLIP y modelos visuales existentes deben aprovecharse antes de entrenar un nuevo clasificador propio.

8. Trabajo que no debe abrirse ahora

Mientras el Hito 15 permanezca abierto, no iniciar por iniciativa propia:

nuevas especies;

nuevos ecosistemas;

entrenamiento de nuevos modelos;

grandes pipelines de segmentación;

backend cloud;

autenticación;

sincronización compleja;

redes sociales;

rankings;

multiplayer;

sistema avanzado de logros;

expansión masiva de contenido;

arquitectura de producción innecesaria para el piloto.

Una excepción requiere un bloqueo concreto del Hito 15 o del flujo end-to-end y debe poder explicarse en esos términos.

9. Criterio para incorporar nueva tecnología

Antes de agregar un nuevo componente técnico, responder:

¿Qué problema concreto del piloto está bloqueando?

¿Ese problema ya puede resolverse con un componente existente?

¿Existe una herramienta abierta suficientemente buena?

¿Podemos probarla de forma aislada antes de integrarla?

¿Puede abstenerse o fallar de manera segura?

¿Preserva evidencia y trazabilidad?

¿Su complejidad está justificada por el beneficio?

Si no existe un bloqueo demostrado, el componente no entra todavía.

10. Criterio de éxito del Piloto 1.0

El piloto no se considera exitoso solamente porque un clasificador alcance una métrica alta.

Debe demostrar simultáneamente que:

una persona puede salir a buscar una especie real;

Árboris puede guiar qué observar;

una fotografía puede generar candidatos útiles;

la evidencia botánica puede corregir una señal visual equivocada;

el sistema puede reconocer cuándo no sabe;

el usuario puede aportar evidencia sin inventarla;

la identificación conserva trazabilidad;

una observación real puede producir un descubrimiento;

el descubrimiento puede producir una recompensa de colección;

la experiencia genera una razón para volver a explorar.

La métrica final del piloto es la coherencia del ciclo completo.

11. Punto exacto de reanudación

Al retomar el desarrollo:

HITO 15
FICHAS COMPUTABLES → CLAVE ADAPTATIVA

Primer archivo a crear:

tools/botanical-key-validation/species_adapter.mjs

Primer objetivo:

leer las seis fichas, extraer CH-003 / CH-017 / CH-008 / CH-005, traducir sus estados y compararlos con la representación botánica actualmente hardcodeada en logic.mjs.

No modificar primero la clave.

Primero demostrar que el adapter representa correctamente la fuente maestra.

Regla de foco

Mientras el Hito 15 no esté terminado, no abrir una nueva línea técnica salvo que sea necesaria para completarlo.

Árboris debe avanzar cerrando problemas, no acumulando experimentos.