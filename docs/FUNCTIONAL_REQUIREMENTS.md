# Árboris — Requerimientos Funcionales

## 1. Propósito

Este documento define las capacidades que Árboris debe ofrecer a sus usuarios.

Los requerimientos funcionales describen **qué debe poder hacer el sistema**, sin determinar todavía cómo será implementado técnicamente.

Se derivan de la visión y los principios de Árboris y sirven como vínculo entre el concepto del producto, los factores habilitantes y la arquitectura técnica.

---

## 2. Convención

Cada requerimiento funcional se identifica mediante un código único: `RF-01`, `RF-02`, `RF-03`, etc.

Los requerimientos se formulan principalmente desde la perspectiva del usuario:

> **Como usuario, quiero [acción o capacidad], para [propósito o beneficio].**

Cada RF puede contener funciones subordinadas necesarias para cumplir el requerimiento, evitando convertir cada comportamiento menor en un requerimiento independiente.

Los RF podrán clasificarse posteriormente según su etapa de desarrollo:

- **MVP:** necesario para el primer prototipo funcional de Árboris.
- **Posterior:** necesario para etapas posteriores de desarrollo.
- **Visión:** forma parte del producto proyectado, pero no condiciona las primeras versiones.

---

# 3. Requerimientos funcionales

## RF-01 — Seleccionar actividad principal

**Como usuario, quiero elegir qué quiero hacer al abrir Árboris, para acceder directamente a la experiencia que me interesa.**

La aplicación deberá permitir acceder, al menos, a las siguientes áreas principales:

- Explorar.
- Mi personaje.
- Pokédex.
- Historial.
- Minijuegos.

---

## RF-02 — Iniciar una exploración

**Como usuario, quiero iniciar y finalizar una exploración en terreno, para agrupar las observaciones y actividades realizadas durante una salida.**

Una exploración podrá contener múltiples observaciones y actividades realizadas durante un mismo recorrido o sesión de campo.

---

## RF-03 — Consultar el mapa de exploración

**Como usuario, quiero visualizar mi ubicación, el territorio y mis observaciones en un mapa, para relacionar mis descubrimientos con el lugar donde fueron realizados.**

El mapa deberá permitir representar espacialmente las observaciones realizadas por el usuario y servir como apoyo durante la exploración.

---

## RF-04 — Consultar especies del área

**Como usuario, quiero conocer qué especies están registradas o son esperables en el área que estoy explorando, para orientar mi búsqueda.**

Cuando la información disponible lo permita, Árboris deberá diferenciar entre:

- especies esperables en el área;
- especies con registros conocidos en el área;
- especies ya observadas por el usuario.

La presencia potencial de una especie no deberá presentarse como garantía de que exista exactamente en un punto determinado.

---

## RF-05 — Identificar mediante cámara

**Como usuario, quiero registrar evidencia fotográfica de una planta y obtener varias especies candidatas ordenadas según su nivel de coincidencia o confianza, para iniciar o apoyar su identificación.**

La aplicación no deberá presentar necesariamente la primera alternativa como una identificación definitiva.

La evidencia fotográfica podrá posteriormente complementarse con otras fotografías, caracteres observables o información contextual.

---

## RF-06 — Identificar mediante claves

**Como usuario, quiero intentar identificar una planta mediante sus caracteres observables, sin que sea obligatorio utilizar una fotografía o inteligencia artificial.**

La identificación mediante claves deberá conducir progresivamente desde la evidencia observable hacia uno o más taxones candidatos.

---

## RF-07 — Indicar la evidencia disponible

**Como usuario, quiero indicar qué partes y características de la planta puedo observar, para que Árboris utilice únicamente evidencia que realmente tengo disponible.**

Entre las partes observables podrán considerarse:

- hojas;
- flores;
- frutos;
- corteza;
- ramillas;
- porte o planta completa;
- otros caracteres relevantes.

La disponibilidad de estas estructuras podrá variar entre individuos, lugares y épocas del año.

---

## RF-08 — Refinar la identificación mediante claves adaptativas

**Como usuario, quiero que Árboris seleccione preguntas diagnósticas útiles para diferenciar las especies candidatas y actualice la identificación a medida que incorporo nueva evidencia.**

Las preguntas deberán adaptarse a:

- las especies candidatas existentes;
- la evidencia ya registrada;
- las estructuras que el usuario puede observar;
- los caracteres que permitan discriminar mejor entre los candidatos.

El usuario deberá disponer siempre de opciones equivalentes a:

- **No sé.**
- **No puedo observarlo.**

La imposibilidad de responder una pregunta no deberá impedir continuar el proceso de identificación.

---

## RF-09 — Comparar especies candidatas

**Como usuario, quiero comparar las especies candidatas mediante imágenes, caracteres diagnósticos y diferencias relevantes, para comprender por qué una alternativa es más consistente con mi observación que otra.**

La comparación deberá favorecer el aprendizaje de caracteres útiles para el reconocimiento posterior de las especies.

---

## RF-10 — Proponer mi propia identificación

**Como usuario, quiero indicar qué especie creo estar observando antes de solicitar una respuesta a Árboris, para comprobar mi propia capacidad de reconocimiento y utilizar la herramienta como apoyo.**

Árboris deberá permitir evaluar o contrastar esta hipótesis utilizando la evidencia disponible.

El objetivo es permitir que el usuario pueda depender progresivamente menos de la identificación automática a medida que aprende a reconocer especies.

---

## RF-11 — Registrar una observación

**Como usuario, quiero registrar el encuentro con una planta como una observación individual, para conservar evidencia de qué organismo observé, dónde y cuándo.**

Una observación podrá contener:

- una o más fotografías;
- ubicación;
- fecha y hora;
- caracteres observados;
- estructuras disponibles;
- estado fenológico;
- información ambiental o del microhábitat;
- notas del usuario;
- identificación o hipótesis taxonómica asociada.

Cada nuevo encuentro con otro individuo podrá constituir una nueva observación aunque la especie ya haya sido descubierta anteriormente.

---

## RF-12 — Registrar y revisar una identificación

**Como usuario, quiero asociar una identificación a una observación conservando la evidencia que la respalda, para poder consultarla, confirmarla o modificarla posteriormente cuando disponga de nueva información.**

La identificación deberá tratarse como una **hipótesis revisable** y mantenerse conceptualmente separada de la observación.

Cuando una identificación sea modificada, deberá ser posible conservar la trazabilidad de las hipótesis anteriores y de la evidencia utilizada.

---

## RF-13 — Obtener progreso o recompensa

**Como usuario, quiero obtener progreso o una recompensa cuando realizo un descubrimiento o una actividad relevante, para que explorar, observar y aprender produzcan consecuencias dentro del juego.**

La naturaleza exacta de las recompensas, puntos, experiencia u otros sistemas de progresión será definida posteriormente.

---

## RF-14 — Desbloquear una especie y su personaje

**Como usuario, quiero que el primer descubrimiento válido de una especie la desbloquee en mi colección y habilite su sprite o personaje correspondiente.**

Árboris deberá mantener conceptualmente separados:

- la especie biológica real;
- las observaciones realizadas de individuos de esa especie;
- el personaje o sprite inspirado en la especie.

El desbloqueo de una especie no deberá implicar que su conocimiento o progreso se encuentre completado.

---

## RF-15 — Consultar la ficha de una especie

**Como usuario, quiero acceder a información sobre una especie, para aprender a conocerla, identificarla y reconocerla en terreno.**

La ficha podrá incluir:

- nombre científico;
- nombre o nombres comunes;
- familia;
- hábito;
- presentación general;
- morfología relevante;
- caracteres diagnósticos;
- especies similares y formas de diferenciarlas;
- hábitat y ecología;
- fenología;
- distribución en Chile;
- características especiales;
- estado de conservación;
- fuentes de información.

La información morfológica deberá priorizar los caracteres útiles para reconocer y diferenciar la especie, sin limitarse a una descripción botánica general.

---

## RF-16 — Buscar especies

**Como usuario, quiero buscar especies por nombre científico, nombre común u otros criterios disponibles, para acceder directamente a su información y registros.**

La búsqueda deberá permitir acceder a las especies independientemente de que el usuario se encuentre realizando una exploración.

---

## RF-17 — Consultar mi Pokédex

**Como usuario, quiero consultar mi progreso personal de descubrimiento y conocimiento de la flora registrada en Árboris, para visualizar el desarrollo de mi colección.**

La Pokédex deberá funcionar como representación del progreso personal del usuario sobre el catálogo biológico de Árboris.

---

## RF-18 — Consultar descubrimientos recientes

**Como usuario, quiero ver rápidamente las especies que he encontrado recientemente, para acceder a mis últimos descubrimientos.**

---

## RF-19 — Consultar progreso por territorio

**Como usuario, quiero ver las áreas que he visitado y mi progreso en cada una, para saber cuánto he explorado y qué especies todavía puedo descubrir.**

Cada área podrá mostrar un indicador o porcentaje de avance.

La fórmula utilizada para calcular dicho progreso será definida posteriormente y podrá considerar más elementos que el simple número de especies desbloqueadas.

---

## RF-20 — Navegar por el Herbario

**Como usuario, quiero navegar por el catálogo general de especies disponibles en Árboris, distinguiendo las especies que ya he descubierto de aquellas que todavía permanecen bloqueadas.**

Las especies desbloqueadas deberán permitir acceder a su información disponible.

Árboris podrá controlar qué información se revela sobre una especie antes de que el usuario la descubra.

El Herbario representa el catálogo biológico de especies, mientras que la Pokédex representa el progreso personal del usuario sobre dicho catálogo.

---

## RF-21 — Consultar mi historial de actividad

**Como usuario, quiero revisar cronológicamente mis exploraciones, observaciones, identificaciones, descubrimientos y otras actividades realizadas en Árboris, para conservar una bitácora de mi experiencia.**

Desde el historial, el usuario deberá poder volver a consultar una observación anterior y la información asociada a ella.

---

## RF-22 — Seleccionar mi personaje activo

**Como usuario, quiero elegir como personaje activo uno de los sprites correspondientes a especies que he desbloqueado, para utilizarlo como mi representación dentro de la dimensión jugable de Árboris.**

---

## RF-23 — Mejorar personajes mediante nuevas observaciones

**Como usuario, quiero que encontrar nuevos individuos de una especie ya conocida contribuya al progreso de su personaje, para que volver a observar especies conocidas siga teniendo valor.**

El progreso podrá posteriormente considerar hitos como:

- número de individuos observados;
- observaciones en diferentes territorios;
- registro de diferentes estados fenológicos;
- observación de variaciones morfológicas;
- nuevos caracteres aprendidos;
- reconocimiento de la especie con menor asistencia.

La mecánica exacta de progresión será definida posteriormente.

---

## RF-24 — Participar en minijuegos y desafíos

**Como usuario, quiero utilizar los personajes que he desbloqueado en minijuegos y desafíos, para que mi colección tenga utilidad jugable y mi progreso en la exploración tenga consecuencias dentro del juego.**

Los minijuegos podrán incluir, entre otras posibilidades:

- clickers;
- desafíos asociados a territorios;
- juegos que utilicen determinados sprites;
- desafíos vinculados al progreso del usuario.

Los juegos deberán ser capaces de evolucionar independientemente sin modificar el núcleo de observación e identificación de Árboris.

---

# 4. Flujo funcional principal

Los requerimientos anteriores permiten representar el ciclo principal de Árboris de la siguiente manera:

**Explorar → encontrar → observar → registrar evidencia → identificar o proponer una identificación → comparar y refinar → registrar la observación → descubrir → desbloquear → aprender → progresar → jugar → volver a explorar.**

La identificación puede comenzar mediante diferentes vías:

**Cámara → candidatos → claves adaptativas → identificación revisable**

o

**Observación directa → claves adaptativas → candidatos → identificación revisable**

o

**Reconocimiento del usuario → hipótesis propia → comprobación → identificación revisable**

Estas vías convergen en un mismo sistema de observación, evidencia e identificación.

---

# 5. Principio funcional transversal

Árboris no debe reducir la experiencia de reconocimiento de flora a:

**fotografía → inteligencia artificial → nombre de especie.**

La aplicación debe permitir que el usuario observe, formule hipótesis, compare, responda preguntas, registre evidencia y aprenda de cada encuentro.

La asistencia tecnológica deberá apoyar el aprendizaje y el reconocimiento progresivo de las especies, no sustituir permanentemente la capacidad de observación del usuario.