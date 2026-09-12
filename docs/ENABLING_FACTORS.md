# Árboris — Factores habilitantes

Este documento define las condiciones que deben existir para que Árboris pueda desarrollar de forma confiable su sistema de exploración, identificación asistida, colección y juego.

Los factores habilitantes no son funcionalidades visibles para el usuario. Son la infraestructura científica, técnica y de datos que permite construirlas correctamente.

## 1. Base botánica estructurada

Estado: EN DESARROLLO

Cada especie debe contar con información taxonómica y botánica estructurada y respaldada por fuentes.

Debe incluir progresivamente:

- Identificación de especie
- Nombre común
- Nombre científico
- Familia
- Hábito
- Origen y endemismo
- Caracteres diagnósticos
- Variabilidad de los caracteres
- Fenología
- Distribución
- Hábitat
- Especies confundibles
- Criterios para diferenciarlas
- Consideraciones de seguridad
- Fuentes bibliográficas

Piloto actual: 6 especies.

La planilla `data/source/Fichas_especies_arboris.xlsx` funciona actualmente como fuente maestra editorial.

---

## 2. Evidencia fotográfica

Estado: EN DESARROLLO

Las fotografías no deben tratarse simplemente como imágenes de referencia.

Cada fotografía debe poder relacionarse con:

- Especie
- Individuo observado
- Órgano o estructura visible
- Tipo de evidencia
- Calidad
- Validación
- Contexto de la observación cuando esté disponible

El piloto cuenta actualmente con 45 fotografías distribuidas entre las 6 especies.

La nomenclatura de archivos conserva la relación entre especie, individuo y estructura fotografiada.

---

## 3. Variación intraespecífica

Estado: PARCIAL

Árboris no debe representar una especie mediante un único "aspecto típico".

El sistema debe poder registrar múltiples individuos y distintas expresiones morfológicas de una misma especie.

Cuando sea posible, las observaciones deberán incorporar contexto como:

- Exposición
- Sombra o cobertura
- Pendiente
- Altitud
- Fenología
- Microhábitat
- Otras condiciones ambientales relevantes

El objetivo es distinguir variación real dentro de una especie de diferencias entre especies.

---

## 4. Modelo de observaciones

Estado: PENDIENTE

Debe distinguirse entre:

- Especie
- Individuo
- Observación
- Fotografía
- Evidencia
- Identificación

Descubrir una especie y observar nuevamente esa especie son eventos distintos.

Una especie puede desbloquearse una vez, pero acumular múltiples observaciones y evidencia a lo largo del tiempo.

---

## 5. Identificación asistida y manejo de incertidumbre

Estado: PENDIENTE

Árboris no debe entregar identificaciones definitivas basadas ciegamente en IA.

La identificación deberá combinar progresivamente:

- Fotografías
- Caracteres botánicos observables
- Ubicación
- Ecosistema
- Distribución
- Fenología
- Evidencia acumulada

El sistema debe mantener candidatos alternativos cuando exista incertidumbre.

"No sé" o "No puedo observarlo" deben ser respuestas válidas durante una identificación.

---

## 6. Claves adaptativas

Estado: PENDIENTE

Cuando una fotografía no sea suficiente, Árboris debe preguntar por caracteres que permitan discriminar entre los candidatos restantes.

Las preguntas deben:

1. Priorizar caracteres diagnósticos.
2. Evitar preguntar información que ya pueda obtenerse de la imagen.
3. Adaptarse según las respuestas anteriores.
4. Permitir que el usuario indique que un carácter no puede observarse.

---

## 7. Trazabilidad de la identificación

Estado: PENDIENTE

Cada identificación debe conservar evidencia de cómo se llegó al resultado.

Debe ser posible registrar:

- Fotografías utilizadas
- Caracteres observados
- Respuestas del usuario
- Contexto territorial
- Método de identificación
- Candidatos considerados
- Nivel de confianza
- Cantidad y calidad de evidencia

El resultado debe poder revisarse posteriormente.

---

## 8. Seguridad

Estado: PARCIAL

El sistema debe evitar instrucciones que puedan poner al usuario en riesgo.

Las preguntas de identificación deben considerar las especies candidatas antes de pedir interacciones físicas.

Ejemplo:

Si litre permanece entre los candidatos, Árboris no debe pedir al usuario frotar, triturar u oler hojas para diferenciarlas.

La observación no destructiva debe ser prioritaria.

---

## 9. Contexto territorial

Estado: PENDIENTE

La identificación debe utilizar el territorio como evidencia.

El sistema deberá poder considerar:

- Zona geográfica
- Ecosistema
- Distribución conocida de las especies
- Altitud cuando corresponda
- Hábitat
- Época del año

La presencia o ausencia territorial no debe utilizarse como criterio absoluto cuando exista incertidumbre.

---

## 10. Arquitectura offline-first

Estado: DEFINIDO / PENDIENTE DE IMPLEMENTACIÓN

Árboris debe poder utilizarse en terreno con conectividad limitada o inexistente.

La arquitectura debe contemplar:

- Datos esenciales almacenados localmente
- Identificación básica offline cuando sea técnicamente posible
- Registro de observaciones sin conexión
- Sincronización posterior
- Mapas o información territorial descargable

---

## 11. Paquetes territoriales

Estado: PENDIENTE

La aplicación podrá organizar parte de sus datos mediante paquetes descargables por territorio.

Un paquete podría contener:

- Especies esperables
- Fichas
- Caracteres diagnósticos
- Recursos visuales
- Información territorial
- Datos necesarios para exploración offline

Esto permite ampliar Árboris progresivamente sin instalar desde el inicio toda la flora de Chile.

---

## 12. Separación entre especie, conocimiento y personaje

Estado: DEFINIDO

Árboris debe mantener separados tres objetos relacionados:

1. La especie biológica real.
2. El conocimiento y evidencia acumulados sobre esa especie.
3. El personaje jugable inspirado en esa especie.

El personaje no sustituye la ficha científica.

La progresión del personaje puede relacionarse con el conocimiento y las observaciones acumuladas de la especie.

---

## 13. Ciclo de juego

Estado: DEFINIDO / PENDIENTE DE IMPLEMENTACIÓN

El ciclo central de Árboris es:

Explorar el territorio real
→ encontrar una planta
→ observar e investigar
→ realizar identificación asistida
→ desbloquear la especie
→ obtener su personaje
→ incorporarlo a la colección
→ utilizarlo en juegos u otras mecánicas
→ obtener nuevos incentivos para explorar.

La identificación es una mecánica dentro del juego, no el producto completo.

---

## 14. Aprendizaje como resultado de la interacción

Estado: DEFINIDO

La IA debe funcionar como andamio para el aprendizaje.

El objetivo no es que el teléfono aprenda a reconocer plantas mientras el usuario permanece dependiente de él.

Árboris debe favorecer que, con el tiempo, el usuario:

- Observe mejores caracteres.
- Reconozca especies conocidas.
- Distinga especies confundibles.
- Comprenda la variación natural.
- Necesite menos asistencia para especies ya aprendidas.

Regla de diseño:

Priorizar funciones que hagan que el usuario conozca mejor la naturaleza, no solamente que el teléfono la reconozca mejor.

---

## 15. Integridad y versionado de los datos

Estado: EN DESARROLLO

Los datos estructurados, documentación y evidencia del proyecto deben mantenerse versionados.

Actualmente:

- Git gestiona el historial.
- GitHub mantiene el repositorio remoto.
- `data/source/` conserva la fuente maestra editorial.
- `data/species/` contiene datos estructurados para uso de la aplicación.
- `species/` contiene los recursos asociados a cada especie.

Los cambios futuros en datos científicos deben poder rastrearse y revisarse.