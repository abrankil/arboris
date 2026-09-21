# ASC — Brief artístico candidato para piloto de viñeta de escenario

**ID candidato:** `ASC-VIGNETTE-MAP001-ACCESS-001`
**Fecha:** 2026-09-20
**Estado:** aprobado por Dirección de Arte
**Aprobación de Dirección de Arte:** `APPROVED_BY_ART_DIRECTION — Álvaro — 2026-09-21`
**Tipo:** brief visual para una prueba generativa externa; no es contrato ASC ni canon nuevo

## 1. Propósito de la prueba

Probar si un ejecutor generativo externo puede representar como una viñeta visual legible el umbral de acceso de `IT-001 / MAP-001`, preservando las relaciones visuales autorizadas y manteniendo explícita la geometría que continúa `OPEN`.

El propósito no es producir el asset final del escenario, validar navegación real ni generar material de marca. El resultado será una propuesta visual exploratoria para revisión de Dirección de Arte.

## 2. Fuentes y autoridad

Aplicar estas fuentes según su ámbito:

- `docs/PILOT_ENVIRONMENT_VISUAL_CANON.md`: orientación de pantalla, secuencia y relaciones del umbral.
- `docs/MAP_TOPOLOGY_SYSTEM.md`: conectividad explícita, distinción entre dirección de pantalla y cardinalidad geográfica.
- `docs/ENVIRONMENT_ART_DIRECTION.md`: autoridad de referencias territoriales y ambientales para la apariencia del escenario.
- `docs/SPATIAL_MODEL.md` y `docs/TERRITORIAL_MAPPING_PROTOCOL.md`: consultar solo si la revisión o el contrato necesita claims espaciales o territoriales adicionales a las relaciones visuales ya fijadas por el canon del piloto.
- `docs/ART_STYLE_GUIDE.md`: técnica visual general y condiciones de revisión.
- `docs/ARBORIS_SCENE_COMPILER.md`: separación entre compilador, ejecutor, resultado y auditoría.

Una imagen generada no sustituye estas fuentes ni adquiere autoridad territorial, botánica o artística por su apariencia.

## 3. Alcance propuesto

**Encuadre candidato:** un solo fragmento del acceso principal, desde la entrada inferior y el puente hasta la puerta, la casa del conserje y el inicio del camino hacia el interior. Este recorte facilita evaluar el umbral y excluye el logo, el material de marca y la referencia canónica del logo.

La extensión exacta visible hacia el interior queda pendiente de aprobación artística. No se exige representar el claro de picnic ni el recorrido completo de MAP-001 en esta viñeta.

## 4. Relaciones visuales obligatorias

Preservar la secuencia y relaciones declaradas para el umbral:

```text
parte inferior / entrada
→ puente sobre Estero El Arrayán
→ puerta principal abierta
→ casa del conserje a la izquierda del camino
→ camino principal hacia el interior / cordillera
```

También preservar:

- el puente cruza el estero antes de la puerta;
- en el umbral, el estero cruza bajo el puente y realiza un giro visual en “L”;
- después del giro, el estero continúa a la derecha del camino y en un nivel inferior;
- el camino principal conserva el centro perceptual y dirige la lectura hacia el interior;
- las laderas/terrazas contienen lateralmente el escenario como terreno continuo;
- la lectura vertical de pantalla es `screen_down = entrada` y `screen_up = interior / cordillera`.

Estas son relaciones visuales del piloto; no fijan geometría medida.

## 5. Restricciones y elementos excluidos

- No incluir el logo ni usar su referencia canónica como input.
- No añadir bifurcaciones o conexiones transitables que no estén autorizadas.
- No representar laderas o terrazas como islas flotantes separadas del terreno continuo.
- No usar flechas, texto o minimapa para sustituir la lectura de orientación, salvo aprobación específica posterior.
- No presentar especies, densidad botánica o microhábitats como hechos si no están respaldados por referencias autorizadas para este fragmento.
- No seleccionar ni enviar al ejecutor referencias ambientales concretas hasta que Dirección de Arte las identifique y autorice para este piloto; registrar su procedencia y uso previsto en el expediente de la prueba.
- No convertir una relación visual en medición territorial, métrica de altura, escala o distancia.

## 6. Decisiones que permanecen abiertas

El brief no fija y el generador no debe resolver por plausibilidad:

- geometría exacta, bearing o dimensiones del puente y del giro del estero;
- escala y distancias;
- correspondencia cardinal geográfica de izquierda/derecha o arriba/abajo;
- cámara numérica (pitch, yaw, FOV, zoom) o resolución final;
- distribución botánica y microhábitats específicos;
- proporción/aspect ratio final de la viñeta;
- grado de detalle del terreno fuera del umbral.

Dirección de Arte puede seleccionar después el encuadre, relación de aspecto, nivel de acabado y referencias ambientales concretas apropiadas para la prueba. La aprobación de referencias debe identificar cuáles pueden alimentar al ejecutor y para qué uso. Esa selección no cierra claims territoriales o científicos.

## 7. Libertad visual propuesta

Sujeta a aprobación de Álvaro:

- composición y detalle local dentro del fragmento autorizado;
- tratamiento visual de suelo, roca, agua y vegetación general respaldado por las fuentes de arte aplicables;
- densidad visual baja a media, con espacio negativo suficiente para leer puente, puerta, camino y estero;
- traducción a una viñeta isométrica de exploración, sin exigir que el resultado sea pixel art final ni un archivo editable.

No quedan autorizados rediseños de las relaciones territoriales ni invenciones de vegetación específica.

## 8. Salida y evaluación

### Salida solicitada al ejecutor

Una propuesta visual estática del fragmento aprobado, entregada como imagen para revisión. El tamaño de salida y relación de aspecto se fijarán al aprobar el brief. La salida debe identificarse como generada y exploratoria. Para que la prueba sea reproducible, su registro de ejecución debe conservar como mínimo: herramienta/proveedor y modelo o versión declarada; fecha; prompt compilado y texto efectivamente enviado; referencias e inputs utilizados con su procedencia; parámetros de generación disponibles; archivo de salida y su hash; e iteraciones realizadas. Este registro describe la prueba; no añade campos al contrato ni a la implementación normativa de ASC.

### Criterios de auditoría visual

La revisión evaluará si la imagen permite leer sin ayudas textuales:

1. entrada abajo y avance hacia interior/cordillera arriba;
2. puente antes de la puerta y sobre el estero;
3. casa del conserje a la izquierda del camino;
4. estero en “L” en el umbral y luego a la derecha/en nivel inferior;
5. camino principal dominante y terreno contenido/continuo;
6. ausencia de bifurcaciones visuales que parezcan rutas autorizadas;
7. ausencia de detalles gráficos de marca.

Cada criterio pertinente debe evaluarse con los estados `PASS`, `PARTIAL` o `FAIL` definidos para la auditoría ASC. El informe puede indicar que la evaluación corresponde al aspecto visual, pero `PASS VISUAL` no es un estado adicional ni se debe inventar un resultado agregado si el contrato no lo define. El resultado visual no demuestra walkability, conectividad materializada, geometría real, ecología ni comportamiento runtime.

## 9. Decisiones requeridas para aprobación artística

Álvaro debe revisar y decidir antes de preparar el contrato piloto:

1. ¿Aprueba que el piloto se limite al umbral de acceso de MAP-001?
2. ¿Qué extensión del camino hacia el interior debe verse?
3. ¿Qué relación de aspecto, resolución y nivel de acabado se usarán para esta prueba?
4. ¿Aprueba la libertad visual propuesta para suelo, roca, agua y vegetación general?
5. ¿Qué referencias ambientales concretas autoriza para el ejecutor, con qué procedencia y para qué uso?
6. ¿Los criterios de auditoría visual cubren lo que quiere evaluar en esta primera prueba?

El brief está aprobado como marco artístico y de alcance del piloto (`APPROVED_BY_ART_DIRECTION — Álvaro — 2026-09-21`). Esa aprobación no resuelve las seis decisiones anteriores: permanecen **OPEN** y constituyen gates previos a la preparación o ejecución del piloto cuando sean aplicables. No preparar el contrato ASC ni modificar el compilador mientras sigan sin resolver.

## 10. Siguiente gate

```text
revisión de Álvaro
→ aprobación/correcciones del brief
→ disponibilidad de plataforma/repositorio destino de ASC
→ diagnóstico read-only de Fase 1 y gap analysis de Fase 2
→ decisiones bloqueantes, contrato independiente y plan aprobados (Fases 3–4)
→ decidir si el piloto puede probarse de forma documental con el baseline v0.1
→ si implica integración o cambio funcional: respetar Fases 5–6 y autorización correspondiente
→ solo entonces compilar/ejecutar el piloto con registro reproducible
→ auditoría visual por criterio
```

La definición o aprobación de este brief no reabre v0.2 ni satisface por sí sola los gates de separación. No se prepara el contrato ni se ejecuta la prueba hasta que se cumplan los prerrequisitos de la ruta ASC independiente. Una eventual prueba documental con v0.1 también debe esperar la decisión de Fases 1–4; no autoriza cambios funcionales ni integración anticipada.
