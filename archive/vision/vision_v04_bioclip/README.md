# Árboris — BioCLIP Benchmark v0.1

## Objetivo

Este experimento evalúa BioCLIP como componente de visión para el piloto de Árboris.

El objetivo NO es utilizar BioCLIP como identificador definitivo de especies, sino evaluar su capacidad para generar candidatos visualmente compatibles que luego puedan ser evaluados por el sistema de identificación asistida de Árboris.

## Modelo

- Modelo: BioCLIP 2
- Implementación: pybioclip
- Versión de pybioclip: 2.1.6
- Dispositivo utilizado: CPU
- Modalidad: clasificación zero-shot cerrada sobre seis especies
- Etiquetas: nombres científicos

Las versiones completas del entorno utilizado están registradas en:

`requirements_benchmark.txt`

## Especies del piloto

| ID | Nombre común | Nombre científico |
|---|---|---|
| SP001 | Peumo | Cryptocarya alba |
| SP002 | Litre | Lithraea caustica |
| SP003 | Bollén | Kageneckia oblonga |
| SP004 | Mitique | Podanthus mitiqui |
| SP005 | Colliguay | Colliguaja odorifera |
| SP006 | Quillay | Quillaja saponaria |

## Dataset

Fuente: iNaturalist.

Se utilizaron 50 observaciones Research Grade por especie y una fotografía por observación.

Total evaluado:

- 6 especies
- 50 imágenes por especie
- 300 imágenes

El descargador conserva metadata de cada fotografía, incluyendo:

- especie consultada
- observation ID
- photo ID
- licencia
- atribución
- URL de la observación
- URL de la fotografía
- fecha de observación
- localidad declarada
- quality grade
- taxón informado por iNaturalist

Las licencias aceptadas durante la descarga fueron:

- CC0
- CC BY
- CC BY-NC

Las imágenes conservan sus licencias originales. La presencia de una imagen en este dataset no modifica ni amplía los permisos otorgados por su autor.

## Protocolo

Para cada fotografía, BioCLIP recibió exactamente las mismas seis etiquetas candidatas:

1. Cryptocarya alba
2. Lithraea caustica
3. Kageneckia oblonga
4. Podanthus mitiqui
5. Colliguaja odorifera
6. Quillaja saponaria

Se registró:

- ranking completo de las seis especies
- score relativo de cada especie
- especie Top-1
- score Top-1
- posición de la especie verdadera
- score de la especie verdadera

Los scores corresponden a la comparación relativa entre las seis etiquetas candidatas y NO deben interpretarse como probabilidades calibradas de identificación.

## Resultados

### Resultado global

| Métrica | Resultado |
|---|---:|
| Top-1 | 83.00% |
| Top-2 | 93.33% |
| Top-3 | 97.67% |
| Rango medio especie real | 1.27 |

### Resultado por especie

| Especie | Top-1 | Top-2 | Top-3 |
|---|---:|---:|---:|
| Colliguaja odorifera | 92% | 98% | 100% |
| Cryptocarya alba | 92% | 98% | 98% |
| Kageneckia oblonga | 86% | 98% | 100% |
| Lithraea caustica | 96% | 100% | 100% |
| Podanthus mitiqui | 100% | 100% | 100% |
| Quillaja saponaria | 32% | 66% | 88% |

## Caso Quillay

Quillaja saponaria constituye el principal caso problemático detectado.

Solo 16 de las 50 imágenes fueron clasificadas como Quillay en Top-1.

Las confusiones observadas se concentraron principalmente en Cryptocarya alba y Lithraea caustica.

Sin embargo, Quillay permaneció dentro del Top-2 en 66% y del Top-3 en 88% de las observaciones.

Este comportamiento también había aparecido previamente en fotografías propias de Árboris.

Por ello, Quillay se adopta como caso de prueba prioritario para estudiar la integración entre candidatos visuales y caracteres botánicos diagnósticos.

## Interpretación para Árboris

Los resultados apoyan el uso experimental de BioCLIP como GENERADOR DE CANDIDATOS.

Arquitectura propuesta:

foto
→ BioCLIP
→ candidatos visuales
→ evidencia botánica
→ clave adaptativa
→ siguiente carácter útil
→ hipótesis revisable

BioCLIP no constituye por sí solo una identificación Árboris.

El sistema debe conservar incertidumbre y permitir que caracteres botánicos, contexto ecológico/geográfico/fenológico y respuestas del usuario modifiquen las hipótesis.

## Limitaciones del benchmark

Este benchmark es un ensayo de ingeniería y NO una estimación definitiva de precisión en terreno.

Entre sus limitaciones:

- conjunto cerrado de solo seis especies;
- selección no aleatoria de observaciones;
- sin estratificación geográfica;
- sin estratificación por fenología;
- sin control sistemático del órgano fotografiado;
- una fotografía por observación;
- Research Grade de iNaturalist se utiliza como referencia taxonómica;
- las imágenes pueden contener señales contextuales además de la planta;
- BioCLIP puede haber visto estos taxones o imágenes relacionadas durante su entrenamiento;
- los scores no son probabilidades calibradas.

Por estas razones, 83% Top-1 no debe interpretarse como “83% de precisión de Árboris”.

## Archivos

### Scripts

`download_inaturalist.py`
Descarga/reanuda el dataset y conserva metadata.

`evaluate_bioclip_inaturalist.py`
Ejecuta BioCLIP sobre el dataset.

`summarize_benchmark.py`
Calcula automáticamente las métricas desde los resultados.

`test_bioclip.py`
Pruebas iniciales sobre fotografías individuales.

### Benchmark

`benchmark/bioclip_inaturalist_results.csv`
Resultados completos de las 300 imágenes.

`benchmark/benchmark_summary.csv`
Resumen automático global y por especie.

`benchmark/benchmark_config.json`
Configuración y descripción del experimento.

### Dataset

`inaturalist_dataset/`
Fotografías utilizadas en el benchmark.

`inaturalist_dataset/metadata.csv`
Procedencia, IDs, licencias y metadata de las fotografías.

## Conclusión v0.1

BioCLIP muestra alta capacidad para situar la especie real entre un conjunto reducido de candidatos visuales, pero presenta errores sistemáticos importantes para algunas especies, especialmente Quillaja saponaria.

Esto refuerza la arquitectura de identificación asistida de Árboris:

la IA visual propone; la evidencia botánica investiga; la clave adaptativa discrimina; la identificación permanece trazable y revisable.

## Próximo experimento

Integrar BioCLIP con la clave adaptativa utilizando Quillaja saponaria como caso de prueba.

Objetivo:

BioCLIP
→ Peumo / Litre / Quillay
→ seleccionar carácter botánico discriminante
→ evaluar evidencia disponible
→ preguntar al usuario si es necesario
→ actualizar candidatos
→ registrar hipótesis y trazabilidad