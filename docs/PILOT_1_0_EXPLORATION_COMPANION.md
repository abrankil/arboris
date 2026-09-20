# Árboris Piloto 1.0 — Capa de acompañamiento durante la exploración

## Visión integrada

Al abrir la aplicación, la persona recibe una misión principal —por ejemplo, encontrar un peumo— junto con pistas de hábitat y rasgos foliares. Luego sale al mundo real en búsqueda de un lugar donde sea razonable encontrarlo. Durante ese desplazamiento, Árboris ofrece una actividad visual ligera y contextual que acompaña el trayecto. Cuando la persona cree haber llegado al árbol correcto, decide abrir el escáner de cámara para intentar desbloquear el personaje.

El escenario pixel art no simula el mapa real ni identifica por sí solo la especie objetivo. Su función es mantener compañía, ritmo y curiosidad durante el viaje. La misión solo se resuelve con la evidencia foliar validada.

## Separación de responsabilidades

1. **Movimiento real:** el teléfono detecta desplazamiento o pasos con sensores y, cuando corresponda, ubicación autorizada. La detección puede activar una animación de avance; no debe inventar una observación botánica.
2. **Acompañamiento visual:** el bosque, sendero y elementos ambientales se desplazan en bucle o mediante segmentos compatibles. Su función es dar ritmo, contexto y orientación.
3. **Descubrimientos secundarios:** pueden aparecer piedras, hitos, pistas, especies relacionadas o señales de hábitat. Se presentan como oportunidades o contexto, nunca como identificaciones confirmadas.
4. **Misión principal:** cuando la persona considera que encontró el peumo, abre la cámara, captura una hoja y ejecuta el protocolo de validación del Piloto 1.0.

## Bucle de experiencia

**Recibir misión y pistas → salir a buscar → caminar hacia el destino → detectar desplazamiento → realizar actividades ligeras → llegar a un sitio candidato → decidir escanear → capturar hoja → marcar unión hoja–rama → analizar → desbloquear o seguir intentando.**

La capa de acompañamiento amplía el principio **observar → interpretar → desbloquear**, pero no modifica el criterio de éxito: solo la evidencia foliar validada desbloquea la especie.

## Entorno Android propuesto

- Exploración horizontal 16:9 dentro de un canvas lógico de 480×270 px.
- Cuatro capas: cielo, fondo, plano jugable y primer plano.
- Bucle horizontal por segmentos o módulos de 240×135 px, con transiciones sin cortes visibles.
- Desplazamiento por píxeles lógicos enteros y escalado nearest-neighbor.
- Velocidad visual modulada por movimiento detectado, con límites para evitar mareo y consumo excesivo.
- Sendero legible y estable; la animación mueve el mundo, no debe hacer que el jugador pierda la orientación.
- Elementos de descubrimiento con aparición gradual, baja frecuencia y contraste suficiente.

## Tipos de aparición

### Ambientales

Piedras, cursos de agua, flores moderadas, frutos caídos, cambios de suelo, sombra, pendientes y hitos del paisaje. Pueden reforzar el aprendizaje del hábitat.

### Relacionadas

Especies que comparten área o rasgos comparables con el objetivo. Deben mostrarse como “posible especie relacionada”, “pista de hábitat” o “pendiente de observar”, nunca como resultado automático.

### Actividades de trayecto

Una señal puede abrir una nota breve, una comparación, una pregunta de la guía o una microactividad sin precisión motora. Ejemplos: reconocer una silueta de hoja, ordenar dos rasgos, registrar un hito observado o comparar hábitats. Estas actividades entregan conocimiento, contexto o pequeñas recompensas de colección; nunca confirman el objetivo principal.

La interacción debe ser opcional, pausables y no exigir que la persona mire la pantalla continuamente mientras camina.

## Mejoras de propuesta

- **Separar intención y confirmación:** la misión indica qué buscar; el usuario decide cuándo un árbol parece candidato; el escáner confirma o rechaza.
- **Dar utilidad al trayecto:** las actividades secundarias deben preparar al usuario para observar mejor el peumo, no ser minijuegos desconectados.
- **Mantener tensión sin frustración:** señales y especies relacionadas pueden aumentar la expectativa, pero no prometer proximidad ni presencia real.
- **Usar estados claros:** `misión activa`, `en desplazamiento`, `sitio candidato`, `escáner abierto`, `verificación correcta` y `seguir intentando`.
- **Evitar falsos positivos:** una aparición visual del peumo en el escenario es una representación del objetivo, nunca evidencia de que esté cerca.
- **Diseñar para pausas:** el trayecto puede continuar con animación mínima o congelarse si la persona guarda el teléfono o cruza una zona de atención.
- **Mantener bajo el costo técnico:** comenzar con un banco cerrado de segmentos procedurales, pocas actividades y una sola misión principal.

## Seguridad y control de experiencia

- Mostrar una advertencia y reducir la interacción visual cuando se detecte movimiento continuo; priorizar caminar atento al entorno real.
- No exigir mirar la pantalla para seguir avanzando.
- Permitir pausar la animación, silenciar avisos y continuar solo con señales hápticas o sonoras si se implementan posteriormente.
- Solicitar permisos de actividad y ubicación de forma explícita, explicando su función.
- No convertir pasos o distancia en evidencia de haber encontrado una especie.

## Alcance del Piloto 1.0

**Núcleo obligatorio:** misión de especie objetivo con pistas, exploración acompañada durante el trayecto, detección básica de movimiento, escenario procedural en bucle, actividades secundarias ligeras, decisión manual de abrir el escáner y validación foliar.

**Prototipo controlado:** una escena piloto, una velocidad de desplazamiento, pocas categorías de aparición y una especie objetivo principal como peumo.

**Posterior:** generación procedural más amplia, audio reactivo, eventos raros, ubicación avanzada, rutas geográficas persistentes y detección robusta de actividad en segundo plano.

La generación procedural debe partir de un banco cerrado de segmentos pixel art reutilizables y reglas verificables de continuidad, coherencia botánica, densidad de obstáculos, aparición de pistas y rendimiento. Las combinaciones pueden variar mediante semillas, pero no deben introducir especies, estructuras o rasgos ambientales no validados.

## Criterios de éxito

- La persona entiende cuál es su objetivo sin confundir el escenario con la evidencia.
- Caminar produce una sensación clara de avance visual.
- El bucle no revela cortes ni repite elementos de forma molesta.
- Las apariciones entretienen y enseñan sin saturar la interfaz.
- La persona decide cuándo abrir el escáner.
- El sistema nunca desbloquea el peumo sin captura foliar validada.
- La experiencia puede pausarse y utilizarse con atención al entorno real.
