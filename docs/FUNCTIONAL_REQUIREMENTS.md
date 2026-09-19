Árboris — Requerimientos Funcionales

Versión: 0.2
Última actualización: 15 septiembre 2026
Alcance: Piloto 1.0 — seis especies

1. Propósito

Este documento define las capacidades que Árboris debe ofrecer a sus usuarios.

Los requerimientos funcionales describen qué debe poder hacer el sistema, sin fijar todavía la implementación técnica definitiva.

Se derivan de la visión, los principios de producto, el modelo de dominio y la arquitectura de Árboris.

El Piloto 1.0 debe validar especialmente el ciclo:

explorar
→ buscar
→ encontrar
→ observar
→ reunir evidencia
→ identificar de forma asistida
→ descubrir
→ desbloquear
→ coleccionar
→ progresar
→ volver a explorar

La identificación es una mecánica central del juego, pero no constituye por sí sola el producto.

2. Convención

Cada requerimiento funcional se identifica mediante un código RF-XX.

Los requerimientos se formulan principalmente desde la perspectiva del usuario:

Como usuario, quiero [acción o capacidad], para [propósito o beneficio].

Para el Piloto 1.0 se distinguen tres niveles:

Piloto: necesario para demostrar el ciclo principal.

Posterior: previsto después de validar el piloto.

Visión: forma parte de la dirección futura, pero no condiciona el piloto.

Los estados de desarrollo se registran en ROADMAP.md.

3. Requerimientos funcionales

RF-01 — Acceder a las áreas principales

Nivel: Piloto

Como usuario, quiero acceder a las principales áreas de Árboris, para elegir qué quiero hacer.

La interfaz podrá dar acceso progresivamente a áreas como:

Explorar.

Colección / Pokédex.

Personaje.

Historial.

Minijuegos.

El Piloto 1.0 no requiere que todas estas áreas tengan profundidad equivalente.

RF-02 — Iniciar una exploración

Nivel: Piloto

Como usuario, quiero iniciar una experiencia de exploración en terreno, para buscar, observar y descubrir flora nativa.

Una exploración podrá agrupar múltiples encuentros, observaciones y actividades realizadas durante una salida.

La experiencia deberá estar diseñada para condiciones reales de terreno y requerir la menor interacción innecesaria posible con la pantalla.

RF-03 — Recibir una especie objetivo

Nivel: Piloto

Como usuario, quiero recibir una especie que debo encontrar, para convertir la exploración botánica en una búsqueda del tesoro.

Árboris deberá poder presentar una especie objetivo perteneciente al catálogo disponible para el territorio o experiencia activa.

El sistema podrá entregar progresivamente información que ayude a encontrarla sin revelar inmediatamente toda la solución.

La especie objetivo pertenece a la capa de juego y no constituye una identificación de ninguna planta observada posteriormente.

RF-04 — Consultar una guía para encontrar la especie objetivo

Nivel: Piloto

Como usuario, quiero consultar pistas y caracteres útiles de la especie que estoy buscando, para aprender qué debo observar en terreno.

La guía podrá incluir:

aspecto general;

tipo de hoja;

disposición;

margen;

nervadura;

envés;

otros caracteres diagnósticos;

hábitat o contexto;

imágenes de referencia;

diferencias frente a especies similares.

La guía deberá favorecer el aprendizaje de observación y no reducirse a mostrar una fotografía para memorizar.

RF-05 — Registrar un posible hallazgo

Nivel: Piloto

Como usuario, quiero registrar una planta que creo que puede corresponder a mi especie objetivo, para comprobar mi hipótesis.

El usuario deberá poder aportar evidencia fotográfica del organismo encontrado.

Registrar un posible hallazgo no implica que la especie haya sido identificada ni descubierta.

RF-06 — Obtener candidatos visuales

Nivel: Piloto

Como usuario, quiero que Árboris analice mi evidencia fotográfica y considere especies visualmente compatibles, para orientar la identificación sin presentar una respuesta automática como definitiva.

El sistema podrá utilizar BioCLIP u otro modelo equivalente para generar y ordenar candidatos.

La salida de un modelo visual:

no constituye por sí sola una identificación;

no constituye evidencia botánica;

no debe interpretarse automáticamente como probabilidad taxonómica;

puede ser corregida mediante evidencia botánica posterior.

Árboris deberá poder trabajar con varios candidatos simultáneamente.

RF-07 — Identificar mediante caracteres botánicos

Nivel: Piloto

Como usuario, quiero identificar una planta mediante caracteres observables, para comprobar qué especie es utilizando evidencia botánica.

El sistema deberá utilizar conocimiento botánico estructurado para evaluar la compatibilidad entre la observación y las especies candidatas.

La identificación mediante caracteres deberá poder utilizarse aunque la clasificación visual sea incierta o incorrecta.

RF-08 — Refinar la identificación mediante una clave adaptativa

Nivel: Piloto

Como usuario, quiero que Árboris seleccione preguntas útiles para diferenciar los candidatos activos, para no tener que recorrer una clave fija completa.

La selección de preguntas deberá considerar:

candidatos activos;

evidencia ya disponible;

caracteres discriminativos;

observabilidad;

seguridad;

invasividad;

información faltante.

El sistema deberá evitar preguntar por caracteres que ya hayan sido observados de forma suficientemente fiable.

RF-09 — Responder sin estar obligado a saber

Nivel: Piloto

Como usuario, quiero poder indicar que no sé una respuesta o que no puedo observar un carácter, para continuar la identificación sin inventar información.

Las preguntas deberán admitir opciones equivalentes a:

Sí.

No.

No sé.

No puedo observarlo.

“No sé” y “No puedo observarlo” no deberán interpretarse como ausencia del carácter ni eliminar automáticamente especies candidatas.

RF-10 — Solicitar evidencia adicional

Nivel: Piloto

Como usuario, quiero que Árboris me indique qué evidencia adicional sería útil, para saber qué observar o fotografiar a continuación.

El sistema podrá solicitar, cuando sea necesario:

otra hoja;

otra vista;

envés;

rama;

planta completa;

flor;

fruto;

corteza;

otro carácter observable.

Las solicitudes deberán respetar las reglas de seguridad y observación no destructiva.

RF-11 — Observar automáticamente un carácter

Nivel: Posterior inmediato / experimental

Como usuario, quiero que Árboris intente extraer de mis fotografías algunos caracteres botánicos concretos, para reducir preguntas que el sistema pueda resolver de manera fiable.

El modelo visual deberá recibir una tarea restringida.

Ejemplo:

Carácter solicitado: CH-003
Tarea: observar margen foliar
Resultado:
- estado permitido
- NO_OBSERVABLE

El modelo deberá poder abstenerse.

Una respuesta automática incierta no deberá transformarse en evidencia firme.

La procedencia deberá indicar que el carácter fue observado por un modelo.

RF-12 — Pedir ayuda al usuario cuando el modelo no puede observar

Nivel: Piloto

Como usuario, quiero que Árboris me pregunte solamente cuando la evidencia automática sea insuficiente o el carácter requiera observación humana, para participar activamente sin responder preguntas innecesarias.

Flujo esperado:

carácter necesario
→ revisar evidencia existente
→ intentar observación automática si corresponde
→ evidencia o abstención
→ preguntar al usuario / solicitar otra fotografía

La tecnología debe actuar como apoyo a la observación, no sustituirla.

RF-13 — Mantener procedencia de la evidencia

Nivel: Piloto

Como usuario, quiero que Árboris conserve de dónde provino cada evidencia relevante, para que una identificación pueda ser revisada y comprendida posteriormente.

El sistema deberá poder distinguir conceptualmente evidencia proveniente de:

fotografía original;

usuario;

modelo visual;

contexto;

conocimiento botánico;

validación experta futura.

La evidencia automática no deberá volverse indistinguible de la evidencia humana.

RF-14 — Obtener una hipótesis de identificación

Nivel: Piloto

Como usuario, quiero obtener una hipótesis basada en la evidencia disponible, para saber qué especie es más consistente con lo que observé.

El resultado podrá ser:

suficientemente respaldado;

probable;

tentativo;

no resuelto.

La nomenclatura definitiva de estados podrá ajustarse durante la implementación.

El sistema no deberá forzar una identificación cuando la evidencia sea insuficiente.

RF-15 — Saber si encontré la especie objetivo

Nivel: Piloto

Como usuario, quiero saber si la planta que encontré es compatible con la especie que estaba buscando, para continuar o completar la búsqueda del tesoro.

Si la evidencia resulta incompatible con la especie objetivo, Árboris deberá permitir continuar la búsqueda.

Ejemplo de respuesta lúdica:

No corresponde a la especie que buscas.
Sigue explorando.

El sistema podrá conservar la observación realizada aunque no corresponda al objetivo.

Una observación “incorrecta” dentro del juego puede seguir teniendo valor como registro real.

RF-16 — Completar un descubrimiento

Nivel: Piloto

Como usuario, quiero completar el descubrimiento cuando reúno evidencia suficiente de la especie objetivo, para obtener una consecuencia dentro del juego.

La política exacta que determine cuándo existe evidencia suficiente deberá definirse y validarse durante el piloto.

Por lo tanto:

Identification ≠ Discovery

Una identificación no deberá producir obligatoriamente un desbloqueo sin aplicar la política de descubrimiento correspondiente.

RF-17 — Registrar una observación

Nivel: Piloto

Como usuario, quiero conservar cada encuentro con una planta como una observación, para registrar qué encontré, dónde, cuándo y con qué evidencia.

Una observación podrá relacionarse con:

una o más fotografías;

fecha y hora;

ubicación;

individuo, cuando sea conocido;

caracteres observados;

fenología;

contexto ambiental;

microhábitat;

notas;

hipótesis de identificación.

No todos los campos deberán ser obligatorios.

Los datos desconocidos deberán permanecer desconocidos.

RF-18 — Registrar múltiples individuos y reobservaciones

Nivel: Piloto / progresivo

Como usuario, quiero registrar nuevos individuos y nuevas observaciones de especies conocidas, para que volver a encontrar una especie siga teniendo valor.

Las reobservaciones podrán aportar información sobre:

variación morfológica;

microhábitat;

localización;

fenología;

estación;

altitud;

exposición;

otros factores.

Descubrir una especie no equivale a completarla.

RF-19 — Revisar una identificación

Nivel: Piloto

Como usuario, quiero revisar una identificación cuando aparece nueva evidencia, para corregir o mejorar una hipótesis sin borrar el proceso anterior.

La identificación deberá mantenerse conceptualmente separada de la observación.

Cuando cambie una hipótesis, el sistema deberá poder conservar:

hipótesis anterior;

evidencia utilizada;

nueva evidencia;

resultado posterior.

RF-20 — Proponer mi propia identificación

Nivel: Posterior

Como usuario, quiero proponer qué especie creo estar observando antes de pedir ayuda, para poner a prueba mi capacidad de reconocimiento.

Árboris podrá contrastar la hipótesis del usuario con la evidencia disponible.

Esta función debe apoyar el objetivo de que el usuario dependa progresivamente menos de la asistencia tecnológica.

RF-21 — Comparar especies candidatas

Nivel: Posterior

Como usuario, quiero comparar candidatos mediante imágenes y caracteres diagnósticos, para entender por qué una especie coincide mejor con mi observación que otra.

La comparación deberá destacar diferencias útiles para aprender a reconocer las especies posteriormente.

RF-22 — Consultar la ficha de una especie

Nivel: Piloto

Como usuario, quiero consultar información de una especie, para aprender a encontrarla, observarla, identificarla y reconocerla.

La ficha podrá incluir:

nombre científico;

nombres comunes;

familia;

hábito;

descripción;

caracteres diagnósticos;

especies similares;

hábitat;

ecología;

fenología;

distribución;

características especiales;

conservación;

fuentes.

La información morfológica deberá priorizar caracteres útiles para observación e identificación.

RF-23 — Representar variación intraespecífica

Nivel: Piloto / progresivo

Como usuario, quiero ver que una especie puede presentar variaciones entre individuos y condiciones, para no aprender una única imagen idealizada de ella.

Las fichas y sistemas de identificación deberán poder incorporar múltiples ejemplos de una misma especie.

Cuando existan datos, la variación podrá relacionarse con contexto ambiental y fenológico.

RF-24 — Aplicar reglas de seguridad

Nivel: Piloto

Como usuario, quiero recibir instrucciones de observación seguras, para identificar plantas sin exponerme innecesariamente ni dañarlas.

La selección de preguntas deberá considerar riesgo e invasividad.

Mientras Lithraea caustica permanezca como candidata, Árboris no deberá pedir frotar, triturar ni oler hojas.

El sistema deberá priorizar observaciones no destructivas.

No deberá solicitar cortar una planta solamente para comprobar un carácter cuando exista una alternativa menos invasiva.

RF-25 — Desbloquear una especie

Nivel: Piloto

Como usuario, quiero que un descubrimiento válido desbloquee la especie en mi colección, para que encontrar plantas reales produzca progreso dentro del juego.

El desbloqueo deberá derivarse de un Discovery, no directamente de una predicción visual.

La política exacta de evidencia requerida deberá validarse durante el piloto.

RF-26 — Desbloquear el personaje asociado

Nivel: Piloto

Como usuario, quiero obtener el personaje asociado a una especie que he descubierto, para incorporar el hallazgo real a la dimensión jugable de Árboris.

Árboris deberá mantener separados:

especie biológica
≠
conocimiento y observaciones
≠
personaje jugable

El personaje podrá utilizar rasgos reales de la especie como inspiración, pero sus datos de juego no deberán modificar la ficha científica.

RF-27 — Consultar mi colección

Nivel: Piloto

Como usuario, quiero consultar las especies y personajes que he desbloqueado, para visualizar mi progreso.

La colección deberá distinguir entre especies descubiertas y todavía no descubiertas.

La interfaz podrá controlar cuánto contenido de una especie no descubierta se revela previamente.

RF-28 — Mantener valor después del primer descubrimiento

Nivel: Piloto / progresivo

Como usuario, quiero que volver a observar una especie conocida tenga consecuencias útiles, para que el juego no se convierta en una lista que se completa una sola vez.

Las nuevas observaciones podrán contribuir posteriormente a:

conocimiento acumulado;

variantes;

progreso del personaje;

estados fenológicos;

territorios;

logros;

capacidades;

contenido adicional.

La mecánica exacta se definirá después de validar el ciclo básico.

RF-29 — Utilizar personajes en actividades jugables

Nivel: Posterior

Como usuario, quiero utilizar los personajes desbloqueados en minijuegos y otras mecánicas, para que mi colección tenga utilidad real dentro del juego.

Los juegos deberán ser capaces de funcionar como juegos por sí mismos.

No deberán limitarse a cuestionarios educativos disfrazados.

Podrán inspirarse en características ecológicas o biológicas reales sin modificar el núcleo científico.

RF-30 — Consultar historial

Nivel: Posterior

Como usuario, quiero revisar mis observaciones, identificaciones, descubrimientos y actividades anteriores, para conservar una bitácora de mi experiencia.

El historial deberá permitir volver a una observación y consultar su evidencia e identificación.

RF-31 — Consultar territorio y especies esperables

Nivel: Posterior

Como usuario, quiero conocer qué especies son esperables en un territorio, para orientar mi exploración.

Árboris deberá distinguir cuando sea posible entre:

especie potencialmente presente;

registros conocidos;

observaciones del usuario.

La presencia potencial no deberá presentarse como garantía de presencia exacta.

RF-32 — Consultar mapa

Nivel: Posterior

Como usuario, quiero relacionar mis observaciones con el territorio mediante un mapa, para comprender dónde he explorado y dónde he encontrado especies.

La política de precisión y privacidad de las ubicaciones deberá definirse antes de cualquier publicación o intercambio de coordenadas.

RF-33 — Funcionar sin conectividad continua

Nivel: Piloto

Como usuario, quiero poder utilizar las funciones esenciales de Árboris en terreno sin depender de conexión permanente a internet, para explorar en lugares con cobertura limitada o inexistente.

El sistema deberá diseñarse offline-first.

El piloto deberá determinar qué componentes de identificación pueden ejecutarse localmente y cuáles requieren inicialmente un entorno de desarrollo conectado.

La arquitectura futura deberá permitir paquetes territoriales descargables.

RF-34 — Preservar evidencia original

Nivel: Piloto

Como usuario, quiero que las fotografías y registros originales se conserven aunque cambie la interpretación posterior, para mantener la trazabilidad de mis observaciones.

Una predicción, embedding, score o feature derivado no deberá reemplazar la evidencia original.

RF-35 — Registrar versiones relevantes

Nivel: Posterior / arquitectura preparada

Como sistema, Árboris debe poder conocer qué versión de datos, clave o modelo produjo una inferencia relevante, para permitir reproducibilidad y revisión.

La implementación completa de versionado no es requisito inmediato, pero el diseño no deberá impedirla.

4. Flujo funcional del Piloto 1.0

El ciclo principal del piloto será:

INICIO
  ↓
Especie objetivo
  ↓
Guía de identificación
  ↓
Exploración real
  ↓
Usuario encuentra una posible planta
  ↓
Captura evidencia
  ↓
BioCLIP genera candidatos
  ↓
Árboris evalúa qué carácter discrimina mejor
  ↓
¿Existe evidencia suficiente?
  ├── Sí → utilizarla
  └── No
       ↓
  ¿Puede observarla un modelo?
       ├── Sí → registrar evidencia automática
       └── No / incierto
             ↓
       preguntar al usuario
       o solicitar otra fotografía
             ↓
  actualizar candidatos
             ↓
  hipótesis
             ↓
¿Corresponde a la especie objetivo?
  ├── No → seguir explorando
  └── Sí
       ↓
  aplicar política de descubrimiento
       ↓
  Discovery
       ↓
  desbloquear especie
       ↓
  desbloquear personaje
       ↓
  colección / progreso
       ↓
  volver a explorar

El flujo debe poder terminar también en:

UNRESOLVED

cuando la evidencia disponible no permita sostener una identificación.

5. Flujo científico subyacente

La experiencia lúdica se apoya en un modelo científico independiente:

Species
   ↓
Individual
   ↓
Observation
   ↓
Evidence
   ↓
Identification

La capa de juego puede generar eventos a partir de este núcleo:

Identification
   ↓
Discovery
   ↓
Collection
   ↓
GameCharacter

Pero no deberá modificar retroactivamente la evidencia científica.

6. Principios funcionales transversales

Árboris no deberá reducir la identificación a:

fotografía
→ IA
→ especie

La experiencia deberá combinar:

fotografía
+ ubicación
+ ecosistema
+ época / fenología
+ caracteres visibles
+ preguntas diagnósticas
+ evidencia acumulada
+ participación del usuario

La IA ayuda a observar y priorizar.

No sentencia.

La imposibilidad de resolver una identificación constituye un resultado válido.

La tecnología deberá aumentar la capacidad del usuario para observar y reconocer flora, y hacerse progresivamente menos necesaria a medida que el usuario aprende.

7. Límites del Piloto 1.0

El Piloto 1.0 trabaja con seis especies y una experiencia territorial acotada.

No es requisito inmediato incorporar:

nuevas especies;

backend cloud;

autenticación;

funciones sociales;

rankings;

sincronización compleja;

ciencia ciudadana completa;

exportación Darwin Core;

nuevos clasificadores propios;

segmentación especializada;

detectores propios para cada carácter;

minijuegos complejos;

progresión avanzada;

múltiples territorios.

Estas capacidades podrán incorporarse cuando el núcleo del piloto haya sido validado.

8. Criterio funcional de éxito del piloto

El núcleo de identificación se considera funcional cuando Árboris puede recibir una fotografía real de una de las seis especies y producir una hipótesis botánica razonada mediante la combinación de candidatos visuales, conocimiento botánico y evidencia observacional.

El sistema deberá:

preservar la evidencia;

conservar incertidumbre;

permitir abstención;

solicitar participación humana cuando sea necesaria;

evitar convertir un score visual en una identificación;

permitir que una hipótesis permanezca no resuelta;

mantener trazabilidad suficiente para comprender cómo se obtuvo el resultado.

El producto se considera funcional como juego cuando ese proceso puede integrarse en el ciclo:

buscar
→ encontrar
→ identificar
→ descubrir
→ coleccionar
→ obtener utilidad jugable
→ querer volver a explorar

Ese ciclo constituye el objetivo funcional del Piloto 1.0.