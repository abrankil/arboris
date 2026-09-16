# Árboris — Factores habilitantes

**Versión:** 0.2  
**Última actualización:** 15 septiembre 2026  
**Alcance:** Piloto 1.0 — seis especies

Este documento define las condiciones científicas, técnicas y de datos necesarias para que Árboris pueda desarrollar de forma confiable su sistema de exploración, aprendizaje, identificación asistida, colección y juego.

Los factores habilitantes no son necesariamente funcionalidades visibles para el usuario. Son las capacidades que permiten construir la experiencia de Árboris sin comprometer evidencia, incertidumbre, seguridad, trazabilidad ni utilidad científica.

## Regla general de desarrollo

Un componente técnico nuevo solo debe incorporarse cuando resuelva un problema demostrado del piloto.

Árboris debe priorizar la integración de capacidades existentes antes de desarrollar nuevos sistemas.

No se desarrollarán anticipadamente clasificadores propios, segmentación especializada, detectores específicos de caracteres, infraestructura compleja o nuevas capas de IA cuando una herramienta existente pueda resolver adecuadamente el problema.

---

## 1. Base botánica estructurada

**Estado: CONSOLIDADO PARA PILOTO v0.1**

Las seis especies piloto cuentan con información botánica estructurada y validada.

Especies:

- SP001 — *Cryptocarya alba* — Peumo
- SP002 — *Lithraea caustica* — Litre
- SP003 — *Kageneckia oblonga* — Bollén
- SP004 — *Podanthus mitiqui* — Mitique
- SP005 — *Colliguaja odorifera* — Colliguay
- SP006 — *Quillaja saponaria* — Quillay

La fuente científica/editorial de verdad es la **Master botánica**.

El flujo establecido es:

Master botánica  
→ validación  
→ exportación  
→ datos botánicos estructurados  
→ JSON computables  
→ fichas utilizadas por Árboris.

No deben editarse manualmente los mismos datos botánicos en múltiples Excel, JSON o archivos de código.

`Fichas_especies_arboris.xlsx` se conserva como material editorial/descriptivo anterior, pero no constituye una segunda fuente de verdad.

Estado actual:

- 6 especies validadas;
- 0 warnings en la validación consolidada;
- 0 conflictos detectados;
- JSON computables generados;
- caracteres botánicos incorporados;
- trazabilidad hacia la Master incorporada;
- IDs científicos/editoriales y runtime normalizados y validados.

La base estructurada contiene actualmente 27 caracteres botánicos.

---

## 2. Evidencia fotográfica

**Estado: OPERATIVO / EN AMPLIACIÓN**

Las fotografías constituyen evidencia de observaciones y no simples imágenes de referencia.

Cada fotografía debe poder relacionarse con:

- especie;
- individuo;
- observación;
- órgano o estructura visible;
- tipo de evidencia;
- procedencia;
- calidad y validación cuando corresponda;
- contexto disponible de la observación.

El piloto cuenta con **45 fotografías propias** distribuidas entre las seis especies.

La nomenclatura de archivos preserva la relación básica entre especie, individuo y estructura fotografiada.

Los metadatos científicos que no se conocen no deben inventarse.

---

## 3. Variación intraespecífica

**Estado: INCORPORADO AL MODELO / DATOS AÚN LIMITADOS**

Árboris no debe representar una especie mediante un único “aspecto típico”.

El sistema debe poder registrar múltiples individuos y distintas expresiones morfológicas de una misma especie.

Cuando exista información disponible, las observaciones podrán incorporar:

- exposición;
- sombra o cobertura;
- pendiente;
- altitud;
- fenología;
- microhábitat;
- otras condiciones ambientales relevantes.

La variación intraespecífica debe considerarse información biológica y no automáticamente ruido o error.

Las reobservaciones de especies conocidas conservan valor.

---

## 4. Modelo de observaciones

**Estado: DEFINIDO CONCEPTUALMENTE / IMPLEMENTACIÓN PARCIAL**

Árboris distingue:

Especie  
→ Individuo  
→ Observación  
→ Evidencia  
→ Identificación.

Una fotografía pertenece a una observación y constituye evidencia.

Una identificación constituye una hipótesis revisable sobre la identidad de lo observado.

Descubrir una especie y volver a observarla son eventos distintos.

Una especie puede desbloquearse una vez y posteriormente acumular:

- nuevos individuos;
- nuevas observaciones;
- nuevos lugares;
- diferentes estados fenológicos;
- variación morfológica;
- nueva evidencia.

La observación real es la fuente común para las capas científica y lúdica.

---

## 5. Identificación asistida y manejo de incertidumbre

**Estado: PROTOTIPO FUNCIONAL**

Árboris no entrega identificaciones definitivas basadas ciegamente en IA.

Actualmente existe un flujo funcional para las seis especies piloto:

fotografía  
→ BioCLIP  
→ candidatos visuales  
→ clave botánica adaptativa  
→ hipótesis.

BioCLIP funciona como **generador y priorizador de candidatos**, no como autoridad taxonómica.

La identificación debe poder combinar progresivamente:

- fotografías;
- caracteres botánicos;
- ubicación;
- ecosistema;
- distribución;
- fenología;
- contexto territorial;
- evidencia acumulada.

El sistema debe conservar candidatos alternativos cuando exista incertidumbre.

“No sé” y “No puedo observarlo” son respuestas válidas.

Una identificación puede permanecer:

- confirmada;
- probable;
- tentativa;
- no resuelta.

El sistema también debe poder reconocer que el organismo observado puede encontrarse fuera del catálogo del piloto.

---

## 6. Clave adaptativa

**Estado: FUNCIONAL / EN INTEGRACIÓN CON DATOS COMPUTABLES**

Existe una clave adaptativa funcional para las seis especies piloto.

Su función no es recorrer obligatoriamente una secuencia fija de preguntas.

Debe determinar qué carácter botánico puede aportar información entre los candidatos que permanecen activos.

Principios:

1. Priorizar caracteres diagnósticos.
2. Evitar preguntar información que ya exista como evidencia.
3. Adaptarse a los candidatos restantes.
4. Permitir abstención.
5. No transformar ausencia de conocimiento en evidencia negativa.
6. Considerar seguridad e invasividad.
7. Conservar trazabilidad entre carácter, evidencia y decisión.

Regla fundamental:

**SIN DATO ≠ NO**

Actualmente parte del conocimiento botánico utilizado por la clave permanece hardcodeado en `logic.mjs`.

La prioridad técnica actual —Hito 15— es conectar la clave con las fichas computables mediante un adaptador independiente.

Mapeo inicial:

- `margin` ← CH-003 — Margen foliar
- `glands` ← CH-017 — Dientes con pequeñas glándulas
- `venation` ← CH-008 — Nervio medio prominente
- `underside` ← CH-005 — Color relativo del envés

La equivalencia de `venation` con CH-008 es solamente parcial y debe resolverse sin añadir a la Master propiedades que el carácter estructurado no representa.

---

## 7. Trazabilidad de la identificación

**Estado: PARCIAL / EN DESARROLLO**

Cada identificación debe conservar cómo se llegó a la hipótesis.

Debe poder registrar:

- fotografías utilizadas;
- caracteres observados;
- procedencia de cada evidencia;
- respuestas del usuario;
- evidencia generada automáticamente;
- contexto territorial;
- método de identificación;
- candidatos considerados;
- incertidumbre;
- confianza cuando corresponda;
- cantidad y calidad de evidencia;
- historial de hipótesis y revisiones.

Una corrección posterior no debe borrar necesariamente la hipótesis anterior.

La evidencia original debe preservarse.

---

## 8. Seguridad y observación ética

**Estado: DEFINIDO / INCORPORADO A LA CLAVE**

La obtención de evidencia debe privilegiar la observación visual y métodos no destructivos.

Las preguntas deben considerar las especies candidatas antes de solicitar interacción física.

Mientras *Lithraea caustica* permanezca entre los candidatos, Árboris no debe solicitar:

- frotar hojas;
- triturarlas;
- olerlas.

Tampoco debe solicitar cortar tejidos de *Colliguaja odorifera* para comprobar látex ni realizar pruebas destructivas sobre otras especies.

La colección de Árboris se construye mediante **observaciones y evidencia**, no mediante extracción de organismos.

La seguridad tiene prioridad sobre la obtención de un carácter diagnóstico.

---

## 9. Contexto territorial, ecológico y fenológico

**Estado: PREPARADO CONCEPTUALMENTE / PENDIENTE DE INTEGRACIÓN**

La identificación debe poder utilizar progresivamente:

- zona geográfica;
- ecosistema;
- distribución conocida;
- altitud;
- hábitat;
- microhábitat;
- época del año;
- fenología.

El contexto debe actuar como evidencia, no necesariamente como exclusión absoluta.

No debe concluirse automáticamente que una especie es imposible solo porque una observación se encuentre fuera de su distribución esperada.

La integración de esta capa no forma parte del Hito 15 inmediato.

---

## 10. Arquitectura offline-first

**Estado: DEFINIDO / IMPLEMENTACIÓN PARCIAL**

Árboris está diseñado para uso real en terreno con condiciones como:

- conectividad limitada o inexistente;
- luz solar directa;
- batería limitada;
- GPS imperfecto;
- manos ocupadas;
- poco tiempo disponible para interactuar con pantalla.

La arquitectura móvil seleccionada contempla:

- Expo;
- React Native;
- TypeScript;
- Expo Router;
- SQLite mediante `expo-sqlite`.

Las observaciones y datos esenciales deben poder almacenarse localmente.

La sincronización, servicios cloud y otras infraestructuras remotas no son una prioridad actual del piloto.

Los modelos automáticos que eventualmente formen parte de la experiencia de terreno deberán evaluarse también por su viabilidad offline.

ONNX Runtime Mobile, MediaPipe u otras infraestructuras pueden evaluarse posteriormente si existe una necesidad demostrada.

---

## 11. Paquetes territoriales

**Estado: DEFINIDO CONCEPTUALMENTE / FUTURO**

Árboris podrá organizar recursos mediante paquetes descargables asociados a territorios o ecosistemas.

Un paquete podrá contener:

- especies esperables;
- fichas;
- caracteres diagnósticos;
- recursos visuales;
- información territorial;
- mapas;
- datos necesarios para exploración offline.

Esto permitirá ampliar Árboris progresivamente sin distribuir desde el inicio toda la flora de Chile.

El formato técnico de estos paquetes no necesita definirse durante el Hito 15.

---

## 12. Separación entre especie, conocimiento y personaje

**Estado: DEFINIDO**

Árboris mantiene separados tres objetos relacionados:

1. especie biológica real;
2. conocimiento y evidencia acumulados;
3. personaje jugable inspirado en la especie.

El personaje no sustituye la ficha científica.

La capa lúdica puede utilizar el conocimiento y las observaciones para generar:

- desbloqueos;
- progresión;
- variantes;
- capacidades;
- recompensas;
- otras mecánicas.

Los cambios futuros en el juego no deben modificar la evidencia científica original.

---

## 13. Ciclo de juego

**Estado: DEFINIDO / PENDIENTE DE VALIDACIÓN COMO EXPERIENCIA COMPLETA**

El ciclo central es:

explorar territorio real  
→ encontrar una planta  
→ observar/investigar  
→ reunir evidencia  
→ realizar identificación asistida  
→ descubrir/desbloquear la especie  
→ obtener su personaje  
→ incorporarlo a la colección  
→ utilizarlo en mecánicas de juego  
→ obtener incentivos para volver a explorar.

La identificación es una mecánica del juego, no el producto completo.

El piloto debe demostrar este ciclo antes de ampliar significativamente su alcance.

---

## 14. Aprendizaje como resultado de la interacción

**Estado: PRINCIPIO DEFINIDO / VALIDACIÓN FUTURA**

La IA debe funcionar como andamio para el aprendizaje.

El objetivo no es mantener al usuario permanentemente dependiente del reconocimiento automático.

Árboris debe favorecer que progresivamente el usuario:

- observe mejores caracteres;
- reconozca especies conocidas;
- distinga especies confundibles;
- comprenda la variación natural;
- necesite menos asistencia.

Regla de diseño:

**Priorizar funciones que hagan que el usuario conozca mejor la naturaleza, no solamente que el teléfono la reconozca mejor.**

---

## 15. Integridad, procedencia y versionado

**Estado: OPERATIVO / EN DESARROLLO CONTINUO**

Git y GitHub mantienen el historial del proyecto.

La arquitectura de datos debe conservar:

- procedencia;
- versiones;
- relación entre fuente editorial y datos computables;
- evidencia original;
- identificadores estables;
- historial de modificaciones.

La normalización entre IDs editoriales `SP-001...SP-006` y runtime `SP001...SP006` fue validada para las seis especies piloto sin conflictos.

No deben inventarse datos científicos faltantes.

Los cambios científicos deben ser revisables y trazables.

---

## 16. Modelos visuales como observadores de caracteres

**Estado: PRÓXIMO EXPERIMENTO, DESPUÉS DEL HITO 15**

Árboris investigará si modelos multimodales abiertos pueden observar automáticamente caracteres botánicos definidos por la base estructurada.

La función del modelo no será responder directamente:

> “Esta especie es X”.

Recibirá una tarea restringida, por ejemplo:

> “Observa únicamente el margen foliar y determina el estado de CH-003. Si no puede observarse, abstente.”

El modelo deberá poder devolver un estado equivalente a:

**NO_OBSERVABLE**

La arquitectura prevista es:

BioCLIP  
→ candidatos  
→ Árboris selecciona carácter discriminante  
→ modelo visual intenta observarlo  
→ evidencia automática o abstención  
→ usuario si es necesario  
→ clave adaptativa  
→ hipótesis.

El primer experimento debe limitarse a uno o dos caracteres sobre fotografías reales del piloto.

SmolVLM constituye actualmente un candidato para este experimento.

PlantCV, Leaf Analyzer, MobileSAM, SAM 2, Grounding DINO, HALVS y otras herramientas permanecen como alternativas o referencias y no deben incorporarse anticipadamente.

---

## 17. Pragmatismo técnico y reutilización

**Estado: REGLA DE DESARROLLO VIGENTE**

El valor propio de Árboris no consiste en desarrollar desde cero todos los componentes de visión computacional.

Su valor está en combinar:

- modelos biológicos existentes;
- conocimiento botánico estructurado;
- selección adaptativa de caracteres;
- evidencia real;
- participación del usuario;
- incertidumbre;
- trazabilidad;
- aprendizaje;
- exploración;
- colección y juego.

Los experimentos históricos y actuales de visión computacional deben conservarse como investigación y referencia.

Sin embargo, un experimento exitoso no se convierte automáticamente en dependencia del producto.

Antes de incorporar una nueva tecnología debe responderse:

1. ¿Existe un bloqueo real del piloto?
2. ¿Esta tecnología resuelve ese bloqueo?
3. ¿Puede resolverse de forma más simple?
4. ¿Su incorporación preserva incertidumbre, evidencia y trazabilidad?

Si no existe un bloqueo demostrado, el componente permanece fuera del camino crítico.

---

## Prioridad actual

**HITO 15 — FICHAS COMPUTABLES → CLAVE ADAPTATIVA**

Próximo archivo previsto:

`tools/botanical-key-validation/species_adapter.mjs`

Objetivo inmediato:

hacer que la clave consuma conocimiento botánico validado en lugar de mantener una segunda base botánica hardcodeada.

Después del Hito 15:

seleccionar uno o dos caracteres y evaluar su observación automática mediante un modelo multimodal abierto.

No comenzar todavía:

- nuevas especies;
- entrenamiento de nuevos modelos;
- segmentación especializada;
- detectores propios de numerosos caracteres;
- infraestructura cloud compleja;
- expansión de la app móvil;
- sistemas sociales o competitivos.

---

**Estado general:** factores habilitantes fundamentales definidos; base botánica consolidada; identificación integrada en prototipo; integración datos → clave como prioridad inmediata.