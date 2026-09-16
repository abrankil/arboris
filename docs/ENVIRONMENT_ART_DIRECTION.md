# Árboris — Dirección de arte de escenarios

## Estado

**Versión inicial de marco.** Este documento define cómo convertir referencias reales en decisiones visuales coherentes para escenarios y assets ambientales. No pretende cerrar todavía un manual ecológico completo del bosque esclerófilo.

Las reglas específicas deben crecer a partir del corpus curado en `docs/references/environments/` y de fuentes botánicas/ecológicas pertinentes.

## Propósito

Los escenarios de Árboris deben sentirse como interpretaciones reconocibles del territorio chileno y no como fondos mediterráneos genéricos. La estilización puede simplificar forma, color y profundidad, pero debe conservar estructura espacial, vegetación, relieve y atmósfera suficientemente coherentes con las referencias reales que sustentan cada escena.

## Principio central

La dirección de arte sigue esta cadena:

```text
realidad observada
→ análisis del lugar
→ patrón visual
→ regla de arte
→ traducción a pixel art
```

No usar una generación previa como fuente de verdad sobre paisaje, flora o ecología.

## Capas de decisión

### 1. Territorio

Define:

- forma del relieve;
- pendiente;
- relación entre ladera, quebrada y valle;
- presencia de cordillera o horizonte;
- exposición visual;
- continuidad o apertura del paisaje.

### 2. Estructura vegetal

Define:

- densidad;
- altura relativa de estratos;
- masas y vacíos;
- siluetas dominantes;
- relación entre árboles, arbustos, hierbas, rocas y suelo expuesto.

La estructura vegetal se analiza primero como masa y distribución. La identificación de especies específicas se documenta aparte y solo se incorpora cuando esté respaldada.

### 3. Suelo y roca

Define:

- porcentaje visual de suelo desnudo;
- tamaño y frecuencia de rocas;
- formas dominantes;
- color y contraste;
- relación con senderos y vegetación.

### 4. Atmósfera

Define:

- hora del día;
- nubosidad;
- profundidad atmosférica;
- temperatura aparente de la luz;
- neblina, lluvia o sequedad visual;
- contraste entre primer plano y fondo.

### 5. Composición jugable

La fidelidad realista no debe destruir lectura de juego. El escenario debe conservar:

- plano jugable legible;
- separación suficiente entre fondo y personajes;
- zonas calmas para UI cuando corresponda;
- contraste de silueta;
- jerarquía clara entre elementos decorativos y relevantes.

## Coherencia realista

Una escena se considera coherente cuando sus decisiones principales pueden rastrearse a referencias concretas y no mezclan elementos incompatibles sin justificación.

El objetivo no es reconstrucción fotográfica exacta. Es mantener relaciones plausibles entre:

- relieve;
- vegetación;
- roca/suelo;
- estación;
- altitud o transición visual;
- luz y atmósfera.

## Escala de certeza

Toda pauta futura debe marcarse como una de estas:

- `OBSERVED` — visible en referencias concretas;
- `RECURRENT` — aparece de forma consistente en varias referencias;
- `APPROVED_ART_RULE` — decisión de dirección de arte basada en evidencia y necesidades visuales;
- `OPEN` — aún insuficientemente sustentada.

No convertir automáticamente `OBSERVED` en regla general.

## Bosque esclerófilo — marco inicial

El bosque esclerófilo será el primer corpus de entrenamiento visual para este manual.

Todavía deben definirse a partir de referencias reales:

- variación entre laderas expuestas y sombrías;
- relación entre bosque cerrado y zonas abiertas;
- frecuencia visual de roca y suelo desnudo;
- estructura de quebradas;
- transición hacia ambientes de mayor altitud;
- cambios estacionales de color y densidad;
- formas recurrentes de horizonte y cordillera;
- cielos característicos bajo distintas condiciones atmosféricas.

Hasta contar con corpus suficiente, estas materias permanecen `OPEN`.

## Manual visual futuro

A partir del corpus deberán desarrollarse láminas comparativas para:

- paisaje general;
- perfiles de ladera;
- quebradas;
- senderos;
- agrupación de vegetación;
- roca y suelo;
- transición altitudinal;
- cielo y atmósfera;
- invierno/verano u otras diferencias estacionales suficientemente documentadas.

Cada lámina debe incluir referencias, patrón observado y traducción a pixel art.

## Uso con generación asistida

Un prompt de escenario debe citar o resumir las referencias seleccionadas y separar:

1. elementos obligatorios derivados de la realidad;
2. simplificaciones permitidas;
3. decisiones compositivas;
4. elementos que permanecen abiertos.

La IA no debe completar automáticamente flora, relieve o clima que no estén definidos en el brief.

## Relación con producción

La especificación técnica de tamaño, capas, parallax y entrega está en [`ENVIRONMENT_PRODUCTION_SPEC.md`](ENVIRONMENT_PRODUCTION_SPEC.md). Este documento gobierna la coherencia visual; la especificación de producción gobierna cómo se construye y exporta el asset.

La biblioteca y protocolo de referencias están en:

- [`references/environments/README.md`](references/environments/README.md)
- [`ENVIRONMENT_REFERENCE_PROTOCOL.md`](ENVIRONMENT_REFERENCE_PROTOCOL.md)
