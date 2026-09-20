# Integración de los avances de Alejandra — 2026-09-15

## Sincronización y alcance

Se consultó `origin` en `https://github.com/abrankil/arboris.git` mediante `git fetch origin`. La rama local `main` y `origin/main` coincidían en `4a3dd21e5f6049e597d237be4ed168b900f271d6`, sin commits adelantados ni pendientes de incorporar. Los avances ya estaban descargados; no fue necesario hacer merge ni rebase.

Se conservaron los cambios locales previos de personajes, piedra-guía, arte, escenarios, tipografía y gameplay. Esta integración actualiza la documentación operativa y la secuencia de desarrollo; no modifica las fichas científicas, los experimentos de Alejandra ni los píxeles aprobados. No implica publicar los cambios locales en GitHub.

## Aportes leídos y su aplicación

| Commit | Aporte | Aplicación al desarrollo |
| --- | --- | --- |
| `20de7e1` | Catálogo de referencias de vegetación. | Consultar [referencias ambientales](assets/vegetation/README.md) junto con la dirección local de escenarios. |
| `57dd851` | Roadmap actualizado. | Priorizar identificación integrada, después una experiencia jugable mínima y luego el MVP de seis especies. |
| `85ff0e7` | [Clave adaptativa Python](../vision_v02/botanical_key/select_next_botanical_question.py) y [clave JSON](../vision_v02/botanical_key/botanical_key_pilot.json). | Seleccionar preguntas que cubran todos los candidatos actuales; conservarlos cuando el carácter no sea observable. |
| `4ae5663` | [Solicitud de evidencia](../vision_v02/botanical_key/request_botanical_evidence.py). | Contrato inicial para pedir el siguiente carácter útil. El puente solicita evidencia; no analiza fotografías. |
| `b78e6de` | [BioCLIP sobre una imagen indicada](../vision_v04_bioclip/test_bioclip.py). | Entrada experimental reutilizable para candidatos de las seis especies. Sus scores son relativos, no probabilidades calibradas. |
| `b9b9b14` | [Identificación integrada](../integrated_identification/identify.py). | Primera conexión foto → Top-3 visual → respuestas humanas → hipótesis revisable. |
| `fbb5f31`, `4a3dd21` | Boldo, metadatos y protocolos gráficos. | El elenco gráfico tiene siete especies; Boldo mantiene PNG y PXO 125×125. El universo científico sigue teniendo seis. |

## Qué funciona y qué sigue pendiente

El [benchmark versionado](../vision_v04_bioclip/benchmark/benchmark_summary.csv) registra 300 imágenes: Top-1 global 83 % y Top-3 97,67 %. Quillay alcanza 32 % Top-1 y 88 % Top-3. Son resultados del ensayo cerrado de Alejandra, no una medición de precisión de Árboris en terreno ni una nueva ejecución del modelo en esta revisión. Por ello, Quillay/Peumo/Litre es el primer caso de integración.

El flujo Python importa BioCLIP, toma tres candidatos y recorre la clave. Termina ante un candidato único o cuando faltan preguntas aplicables. No guarda archivo de resultado, historial de respuestas, versiones ni vínculo persistente con una observación. Tampoco invoca el módulo `request_botanical_evidence.py`: importa directamente el selector y `apply_answer`.

El [prototipo fotográfico del navegador](../tools/botanical-key-validation/README.md) ya tiene evidencia humana, historial y resultados cautelosos. La foto permanece en el navegador; no está conectada a BioCLIP. La identificación probable exige confirmación independiente y conserva contradicciones. Sus registros de sesión y los resultados de evaluación interna tienen alcances distintos; ninguno equivale a persistencia móvil implementada.

No existe `src/` en este checkout. Expo y SQLite son decisiones para la aplicación pendiente. Tampoco está demostrada aquí la ejecución de BioCLIP en Android ni su operación offline con pesos y recursos locales.

## Diferencias que deben resolverse antes de conectar la interfaz

| Diferencia observada | Consecuencia para la integración |
| --- | --- |
| La clave Python incluye disposición foliar, superficie áspera y yemas; el prototipo fotográfico excluye disposición por la regresión LC002 y omite caracteres no verificables en su flujo foliar. | No sustituir automáticamente el motor fotográfico por la clave de terreno. Conservar ambos experimentos y acordar qué caracteres son observables bajo el protocolo de captura. |
| La pregunta Q5 compara haz y envés; una captura única no garantiza ambas vistas. | Permitir «No puedo observarlo» y resultado sin resolver. No inferir la cara oculta ni exigir capturas sistemáticas de ambas caras por esta integración. |
| El CLI termina con un candidato único; el prototipo exige evidencia independiente para un resultado probable. | La unicidad en la consola es una hipótesis experimental; no equivale a identificación confirmada ni desbloqueo. |
| `apply_answer` conserva candidatos si la intersección es vacía; `identify.py` intenta detectar el conflicto mediante `if not updated_candidates`. | Esa comprobación no recibe una lista vacía con la función actual. El futuro adaptador debe comunicar explícitamente contradicción y conservar el historial. |
| El Top-3 visual puede omitir la especie real; la clave solo elimina dentro de ese conjunto. | Antes de usarlo para misiones, conservar el ranking de seis y probar recuperación/reconsideración de candidatos. No convertir una exclusión visual inicial en evidencia botánica. |
| La clave JSON usa IDs `SP-001`; datos y gráficos usan `SP001`; el CLI enlaza por nombres comunes. | Introducir un mapeo explícito a IDs canónicos al conectar los componentes, manteniendo el nombre científico y la procedencia. |
| El diseño local plantea captura guiada, segmentación, marca hoja–rama, misión y acompañamiento de exploración. | Mantenerlo como diseño de producto pendiente de implementación; el CLI no realiza esas operaciones ni valida el resultado binario de la misión. |

La clave maestra y sus fuentes botánicas conservan su autoridad. Esta revisión identifica diferencias de implementación, sin inventar nuevos discriminadores ni cambiar criterios científicos.

## Aplicación a arte y UI/UX

- Usar **Pixelify Sans + Nunito Sans**, el canon 125×125 y las limpiezas manuales vigentes.
- Mantener Boldo en el catálogo gráfico; no incorporarlo a las seis etiquetas BioCLIP, al catálogo científico ni a misiones identificables sin datos y validación propios.
- Diseñar primero la misión de una especie, la captura, la pregunta diagnóstica y la continuación cuando falta evidencia. Reservar «¡Correcto!» y el personaje desbloqueado para una decisión sustentada por la futura política de desbloqueo.
- La piedra-guía puede presentar instrucciones y dudas. Sus mensajes deben expresar la evidencia disponible; no atribuir al sistema rasgos que nadie observó.
- Escenarios, movimiento y actividades del trayecto aportan presentación y contexto. No cuentan como evidencia científica ni desbloquean especies.

## Siguiente entrega técnica

Conectar los componentes mediante un registro de observación que conserve referencia de foto, candidatos visuales y scores, versiones de modelo/clave, caracteres respondidos —incluido desconocido—, candidatos antes/después, contradicciones y estado de hipótesis. Este es un requisito de integración, no un esquema ya implementado.

Validar primero Quillay/Peumo/Litre, evidencia insuficiente, respuestas contradictorias y especie real ausente del Top-3. Después conectar ese resultado a una misión y definir con dirección de proyecto el umbral de desbloqueo. La política científica y el progreso lúdico permanecen separados sobre la misma observación.

## Verificación realizada

- `git fetch origin` y `git rev-list --left-right --count HEAD...origin/main`: sincronización confirmada, `0 0`.
- Pruebas Node del prototipo: 16 aprobadas, 0 fallidas, 1 omitida porque el registro histórico local ignorado de LC002 no está presente; la prueba de regresión LC002 sí pasó.
- `pwsh -NoProfile -File tools/validate-graphic-assets.ps1`: `checks_passed`, siete sprites 125×125 con alpha binario; la capa RGBA del PXO de Boldo coincide con su PNG. La auditoría no sustituye revisión visual en Pixelorama.
- Comprobación directa de la clave Python: Q4 para Quillay/Peumo/Litre, Q5 después de descartar Litre, conservación ante respuesta desconocida, parada sin pregunta disponible, solicitud de evidencia y conservación ante contradicción. Todas las comprobaciones pasaron.
- Se comprobaron 39 enlaces locales de los documentos integrados y `git diff --check` no informó errores de formato.
- La inferencia BioCLIP y una prueba de terreno no se ejecutaron en esta revisión. `bioclip` no está instalado en el runtime Python inspeccionado. Las métricas anteriores proceden de los resultados versionados.
