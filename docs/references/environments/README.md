# Árboris — Biblioteca de referencias ambientales

## Propósito

Esta biblioteca organiza las referencias visuales utilizadas para diseñar escenarios y assets de entorno de Árboris. Su función es conservar la relación entre realidad observada, interpretación ecológica y decisión artística antes de producir pixel art.

La biblioteca no es un depósito indiscriminado de imágenes. Cada referencia debe tener procedencia, contexto y un uso declarado.

## Principio de trabajo

El flujo recomendado es:

```text
referencia real
→ catalogación
→ análisis visual/ecológico
→ patrón observado
→ decisión de dirección de arte
→ escenario o asset derivado
```

Una fotografía no se convierte automáticamente en una regla ecológica ni en un asset del juego.

## Tipos de referencia

- `field`: fotografía tomada directamente por Alejandra, Álvaro u otra persona del proyecto con procedencia conocida.
- `web`: imagen localizada en Internet y conservada como referencia mediante URL y metadatos de origen.
- `institutional`: referencia de organismos públicos, universidades, museos u otras instituciones.
- `scientific`: figura, fotografía o material asociado a una fuente científica.
- `art`: referencia usada únicamente para composición, iluminación, profundidad, color o lenguaje visual; no constituye evidencia ecológica.

## Taxonomía recomendada

La estructura conceptual de la biblioteca es:

```text
environments/
├── bosque-esclerofilo/
│   ├── paisaje-general/
│   ├── laderas/
│   ├── quebradas/
│   ├── senderos/
│   ├── rocas-y-suelo/
│   ├── vegetacion/
│   └── microhabitats/
├── cordillera/
│   ├── perfiles/
│   ├── cumbres/
│   ├── valles/
│   └── transicion-altitudinal/
├── atmosfera/
│   ├── cielos/
│   ├── nubes/
│   ├── neblina/
│   ├── lluvia/
│   └── luz/
└── art-reference/
```

No es necesario crear carpetas vacías en Git. La categoría se registra primero en `manifest.csv`; las carpetas físicas se crean cuando exista material que realmente deba versionarse.

## Dónde guardar las imágenes

Git debe contener únicamente material curado que sea legal y útil versionar: fotografías propias seleccionadas, previews autorizados, documentación y manifests.

Una biblioteca fotográfica grande debe mantenerse fuera del repositorio —por ejemplo en Drive— y Git debe conservar su índice, procedencia y referencias. Las imágenes web no deben copiarse al repositorio por defecto: conservar URL, autor/fuente, fecha de consulta y licencia cuando sea conocida.

## Reglas de evidencia

- Una foto documenta lo que se observa en ese registro, no todo el ecosistema.
- `unknown` es válido para cualquier dato no comprobado.
- No inferir altitud, orientación, estación, especie o ubicación exacta si la fuente no lo respalda.
- Una referencia artística nunca debe presentarse como evidencia botánica o ecológica.
- Patrones recurrentes deben estar respaldados por varias referencias antes de convertirse en pautas del manual de dirección de arte.

## Identificadores

Usar IDs estables y legibles:

- `REF_ENV_0001` — paisaje o ambiente general.
- `REF_VEG_0001` — vegetación o estructura vegetal.
- `REF_ROCK_0001` — roca, suelo o sustrato.
- `REF_SKY_0001` — cielo, nube o atmósfera.
- `REF_MTN_0001` — montaña, cordillera o relieve.
- `REF_ART_0001` — referencia exclusivamente artística.

El ID no codifica conclusiones ecológicas; solo identifica el registro.

## Relación con escenarios

Cada escenario futuro debe declarar qué referencias sustentan sus decisiones. Ejemplo:

```text
SCENE_ESCLEROFILO_001
references:
- REF_ENV_0021
- REF_VEG_0047
- REF_MTN_0012
- REF_SKY_0014
- REF_ROCK_0008
```

Las decisiones derivadas deben documentarse por separado, por ejemplo: pendiente visual, densidad del bosque, relación roca/suelo, perfil de cordillera, estación y atmósfera.

## Documentos relacionados

- [`../../ENVIRONMENT_REFERENCE_PROTOCOL.md`](../../ENVIRONMENT_REFERENCE_PROTOCOL.md)
- [`../../ENVIRONMENT_ART_DIRECTION.md`](../../ENVIRONMENT_ART_DIRECTION.md)
- [`../../ENVIRONMENT_PRODUCTION_SPEC.md`](../../ENVIRONMENT_PRODUCTION_SPEC.md)
- [`../../ART_STYLE_GUIDE.md`](../../ART_STYLE_GUIDE.md)
