# Árboris — Dirección de sistemas de gameplay

## Principio adoptado

Árboris adopta la lógica **observar → interpretar → desbloquear**. En el Piloto 1.0 se concreta como **explorar → observar → probar → aprender → encontrar → desbloquear**: cada misión entrega una especie objetivo y cada interacción comienza con evidencia foliar visible, permite probar una hipótesis y produce una consecuencia comprensible.

Esta regla se inspira en el análisis de sistemas de *Trine 4*, pero se traduce al dominio botánico de Árboris. No incorpora sus personajes, magia, combate ni plataformas de precisión.

## Aplicación al ciclo de Árboris

1. **Explorar:** recibir una especie objetivo, consultar la guía y buscar una planta candidata.
2. **Observar:** encuadrar una sola hoja completa, dominante, próxima, centrada y enfocada dentro de un óvalo guía.
3. **Interpretar:** capturar, marcar la unión hoja–rama, segmentar, normalizar y comparar caracteres foliares; preguntar solo cuando la imagen no resuelva un carácter necesario.
4. **Desbloquear:** si la hoja corresponde al objetivo, confirmar y abrir la especie y su biblioteca; si no, permitir seguir intentando.

La identificación debe seguir siendo revisable. Una interacción nunca debe convertir una conjetura en certeza científica ni borrar la evidencia original.

Cuando la interacción guíe al usuario para observar un carácter botánico, debe aplicar el patrón normativo de [andamiaje perceptivo](PERCEPTUAL_SCAFFOLDING.md): la identificación decide qué evidencia necesita, el contrato del carácter decide qué cuenta como evidencia válida y la UX ayuda a observar sin sesgar el estado esperado ni forzar resolución.

### Conexión con la identificación experimental

El avance de Alejandra conecta BioCLIP con preguntas adaptativas por consola; todavía no implementa el escáner móvil, la extracción foliar ni la decisión de desbloqueo. Para el siguiente prototipo, preparar los estados «observación registrada», «necesitamos observar otro rasgo» y «evidencia insuficiente», además del acierto o rechazo sustentados. «No puedo observarlo» conserva candidatos. Un único candidato o un score alto no activa la recompensa. Los límites técnicos y la secuencia de integración están en [INTEGRATION_2026-09-15.md](INTEGRATION_2026-09-15.md).

## Reglas de diseño

- Los desafíos deben admitir más de una ruta basada en evidencias disponibles, sin ocultar el camino principal.
- Las consecuencias deben ser visibles y explicadas; evitar recompensas arbitrarias.
- La dificultad debe aumentar por calidad y cantidad de evidencia, no por precisión motora ni por castigo.
- La misión del piloto debe verificar una especie objetivo, no mostrar un nombre alternativo como premio de una clasificación abierta.
- La IA aporta segmentación, descriptores y similitud; no actúa como juez único ni reemplaza la guía o la revisión humana.
- El óvalo es una guía de adquisición, no la máscara de la hoja; la máscara real se obtiene después de la captura.
- La marcación manual de la unión hoja–rama es parte del protocolo y permite inferir base, ápice y eje longitudinal.
- Las propiedades del entorno funcionan como contexto observable, no como poderes elementales.
- La progresión representa conocimiento, observaciones acumuladas y especies descubiertas.
- Los personajes-hoja pueden representar especies desbloqueadas, pero no reciben brazos, piernas, armas ni habilidades ajenas a su identidad botánica.
- Toda mecánica nueva debe validarse primero como prototipo y mantenerse fuera del MVP hasta aprobación explícita.

## Alcance

**Adoptado:** observación con consecuencias, interpretación guiada, rutas alternativas, progresión por descubrimientos y escenarios con puntos de interés legibles.

**Reservado:** cooperación, árboles de habilidades y desafíos más complejos; requieren diseño específico y validación posterior.

**Piloto 1.0:** seis especies, evidencia foliar, captura guiada, control de calidad, marcación de base, comparación con biblioteca propia, preguntas adaptativas y desbloqueo correcto/incorrecto.

El piloto incorpora además una capa de acompañamiento: **caminar → desplazar → descubrir señales → decidir escanear**. Esta capa aporta ritmo y contexto durante la búsqueda, pero no altera la autoridad de la evidencia ni desbloquea especies por sí misma.

**No adoptado:** combate, magia, poderes elementales, plataformas de precisión, física compleja y la estructura de roles de *Trine 4*.

## Referencia

La ficha comparativa se conserva en `references/trine-4/TRINE_4_GAMEPLAY.md` y en la carpeta de referencias sincronizada de Drive.
