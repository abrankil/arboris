# Árboris — Auditoría de Dirección de Arte

**Fecha:** 16 septiembre 2026  
**Estado:** sincronizado con el manual operativo del proyecto  
**Ámbito:** dirección de arte, personajes, escenarios, mapas, referencias ambientales y próximos pasos ejecutables.

## 1. Propósito

Este documento resume el estado del departamento de Dirección de Arte y fija conclusiones operativas para que Álvaro pueda ejecutar el trabajo sin reabrir decisiones ya cerradas ni confundir arte, botánica, gameplay y producción técnica.

No reemplaza:

- `README.md`;
- `docs/START_HERE.md`;
- `docs/GRAPHIC_DIRECTION.md`;
- `docs/ART_STYLE_GUIDE.md`;
- `docs/ENVIRONMENT_ART_DIRECTION.md`;
- `docs/MAP_TOPOLOGY_SYSTEM.md`.

Funciona como punto de control y plan de ejecución inmediato.

## 2. Modelo simple de trabajo

Usar siempre esta cadena:

```text
QUÉ ES REAL
→ QUÉ SE VE
→ QUÉ DECIDO COMO ARTE
→ QUÉ PRODUZCO
→ QUÉ VALIDO
```

Aplicación en Árboris:

```text
Master Botánico 2.0 / fotos / observaciones
→ rasgos visibles de especie o ambiente
→ decisión de Dirección de Arte
→ sprite, derivado, escenario, mapa o UI
→ revisión visual + revisión técnica
```

Regla central:

```text
La evidencia informa el arte.
El arte no reemplaza la evidencia.
```

## 3. Estado del departamento

### 3.1 Gobernanza

Estado: **operativo**.

- Alejandra dirige el proyecto y su orientación general.
- Álvaro dirige la coherencia visual y aprueba decisiones gráficas dentro de esa orientación.
- La documentación ya separa autoridad botánica, evidencia visual, canon gráfico y decisiones artísticas.

Decisión concreta:

```text
No crear nuevas reglas generales de dirección de arte si una tarea puede resolverse aplicando los documentos existentes.
```

### 3.2 Personajes

Estado: **canon base cerrado; derivados pendientes**.

Los sprites base vigentes de Peumo, Litre, Bollén, Mitique, Colliguay, Quillay, Boldo y Piedra-guía están documentados como aprobados y verificados. La animación y el gameplay permanecen abiertos.

Decisiones concretas:

```text
No rediseñar los personajes base sin autorización explícita.
Trabajar desde ahora en derivados, no en sustitución del canon.
Todo derivado debe declarar su master visual operativo.
```

Derivados pendientes:

- sprite de gameplay;
- pose de descubrimiento;
- expresiones;
- animaciones;
- versiones promocionales;
- estados de UI.

### 3.3 Técnica de personajes

Estado: **contrato definido; ejecución pendiente por tarea**.

Contrato vigente:

```text
PNG RGBA
125×125 px
píxel real 1×1
transparencia real
sin blur
sin antialiasing accidental
revisión en Pixelorama
```

Decisión concreta:

```text
Una imagen generada o reducida es referencia para limpieza, no sprite Pixelorama verificado.
```

### 3.4 Escenarios y ambientes

Estado: **marco consolidado; falta evidencia core**.

El primer escenario debe priorizar Fundo Los Nogales. Referencias externas como Yerba Loca, Río Clarillo o Pirque sirven como contexto o contraste, no como reemplazo del territorio núcleo.

Decisión concreta:

```text
PILOT-ENV-006 sigue OPEN.
Los conteos del Master ponderan presencia.
La colocación espacial exige observaciones territorializadas core.
```

Regla corregida:

```text
conteo por especie = peso de presencia / prioridad visual
conteo por especie + unidad territorial = regla de colocación
```

### 3.5 Mapas y topología

Estado: **sistema conceptual listo; prueba determinista pendiente**.

Los mapas deben sentirse como fragmentos conectados de territorio, no como islas flotantes o arenas cerradas. La cuadrícula es estructura lógica, no protagonista visual.

Decisión concreta:

```text
Primero camino.
Después paisaje.
Después belleza.
```

No aprobar una imagen de mapa si cambia conexiones, rutas o transitabilidad definidas por el blockout.

### 3.6 Producción de escenarios

Estado: **especificación técnica definida; pipeline final aún no seleccionado**.

Contrato vigente para escenarios:

```text
16:9 horizontal
480×270 px lógico
capas 00-sky / 01-background / 02-midground / 03-foreground
PNG RGBA como master
nearest-neighbor por múltiplos enteros
```

Decisión concreta:

```text
Los fondos actuales son referencias visuales o pruebas. No son masters finales de producción salvo validación explícita.
```

## 4. Riesgos activos

### Riesgo 1: saltar a imagen final

Una imagen puede ser atractiva y aun así fallar como sistema de juego si no respeta topología, evidencia territorial o legibilidad.

Control:

```text
Ningún escenario final antes de blockout + validación.
```

### Riesgo 2: rediseñar canon cerrado

Volver sobre sprites base consume tiempo y rompe trazabilidad.

Control:

```text
Los masters se conservan; los cambios se hacen como derivados.
```

### Riesgo 3: usar conteos como abundancia ecológica

Más fotos no significa automáticamente más individuos, más observaciones independientes o mayor abundancia real.

Control:

```text
Distinguir observationCount, photoCount e individualCount.
```

### Riesgo 4: dejar que la IA decida estructura

La IA puede estilizar, pero no decidir caminos, bordes abiertos, especies reales o reglas ecológicas.

Control:

```text
La topología la define Árboris. La IA solo interpreta visualmente.
```

## 5. Decisiones concretas adoptadas

1. Dirección de Arte pasa de expansión metodológica a ejecución controlada.
2. Los personajes base quedan congelados como canon operativo.
3. El siguiente trabajo de personajes son derivados, no rediseños.
4. El primer ejercicio de mapa debe ser un `corridor` determinista.
5. Toda prueba de mapa se evalúa primero por conectividad, legibilidad y continuidad territorial.
6. `PILOT-ENV-006` permanece `OPEN` hasta contar con observaciones territorializadas `core`.
7. Los conteos del Master pueden usarse para peso de presencia, no para microhábitat automático.
8. Las referencias externas son contexto o contraste, no autoridad del escenario núcleo.
9. No se agregan nuevas categorías al sistema ambiental mientras el esquema actual alcance.
10. Cada producción debe registrar qué fuente consultó, qué decisión tomó y qué queda pendiente.

## 6. Plan ejecutable para Álvaro

### Paso 1 — Confirmar tablero visual

Objetivo: saber qué está cerrado y qué no.

Acción:

```text
Abrir CHARACTER_DESIGN_STATUS.md.
Confirmar visualmente los 8 sprites canónicos.
No corregirlos en esta etapa.
```

Resultado esperado:

```text
Lista de masters visuales operativos confirmada.
```

### Paso 2 — Elegir primer derivado

Objetivo: empezar producción sin alterar canon.

Recomendación:

```text
Personaje: Litre / Litrini
Derivado: gameplay sprite o pose de encuentro
Razón: alta presencia en la muestra y restricción de seguridad relevante.
```

Resultado esperado:

```text
Brief de derivado, no sprite final todavía.
```

### Paso 3 — Ejecutar TEST-MAP-01 corridor

Objetivo: validar navegación antes de paisaje complejo.

Acción:

```text
Usar el blockout corridor definido.
No cambiar conexiones.
No agregar rutas.
Estilizar como ladera esclerófila Los Nogales / Arrayán.
```

Primera evaluación:

```text
¿Se mantiene el camino?
¿Se entiende por dónde se camina?
¿Parece territorio continuo y no isla?
```

Resultado esperado:

```text
pass / revise / fail
```

### Paso 4 — Preparar evidencia core

Objetivo: alimentar decisiones ambientales reales.

Capturar o seleccionar referencias de:

```text
ladera general
sendero
quebrada o cauce si existe
suelo y roca
estructura vegetal
planta piloto dentro de su ambiente
vista amplia del sector
```

Resultado esperado:

```text
referencias core listas para poblar el manifest
```

### Paso 5 — Construir matriz de aparición

Objetivo: usar conteos correctamente.

Tabla mínima:

```text
Especie | Conteo | Tipo de conteo | Peso visual | Unidad territorial | Evidencia | Estado
```

Regla:

```text
Si no hay unidad territorial, la ubicación queda OPEN.
```

## 7. Prioridad inmediata

La próxima unidad de trabajo recomendada es:

```text
Corredor ambiental simple + primer derivado de personaje.
```

No producir todavía:

- mapa final completo;
- sistema completo de animaciones;
- reglas nuevas de microhábitat;
- rediseño del elenco base;
- assets finales de escenario sin pipeline validado.

## 8. Criterio de cierre de esta fase

Esta fase se considera cerrada cuando exista:

```text
1 derivado de personaje con brief y revisión inicial
1 blockout corridor estilizado
1 evaluación pass/revise/fail
1 lista de evidencias core faltantes
1 matriz de aparición con conteos correctamente etiquetados
```

Solo después conviene avanzar a `elbow`, `junction` y `crossroad`.

## 9. Conclusión ejecutiva

Dirección de Arte está lista para ejecutar pruebas pequeñas. No está lista para producción masiva de escenarios ni para rediseñar el sistema.

Conclusión principal:

```text
Menos teoría nueva.
Más pruebas pequeñas, verificables y trazables.
```

Decisión de trabajo:

```text
Durante la siguiente fase, Álvaro trabaja sobre derivados, blockouts y evidencia core.
Alejandra mantiene dirección de proyecto y controla cambios de alcance.
```
