# Árboris — Dirección argumental y método de trabajo gráfico

**Última actualización:** 16 septiembre 2026

## Argumento común

En Árboris, explorar la flora nativa chilena permite convertir la curiosidad en reconocimiento. Las observaciones aportan evidencia; un descubrimiento suficientemente respaldado permite incorporar una especie a la colección y acceder al personaje que la representa. El arte hace memorable lo aprendido y anima a volver al territorio.

Este marco conecta la [visión del producto](PRODUCT_VISION.md), los [principios permanentes](PRODUCT_PRINCIPLES.md) y los [requerimientos funcionales](FUNCTIONAL_REQUIREMENTS.md), especialmente RF-09, RF-14, RF-15 y RF-22. Organiza las decisiones gráficas; no define nuevos poderes, combates, antagonistas, reglas de desbloqueo ni una trama cerrada.

## Responsables y ámbitos de decisión

Según los [roles establecidos del proyecto](../README.md#dirección-de-arboris), **Alejandra es la fundadora y directora de proyecto de Árboris** y **Álvaro es su director de arte**.

Alejandra dirige el proyecto y su orientación general. Álvaro dirige el arte, define la coherencia visual y aprueba las decisiones de diseño gráfico dentro de esa orientación.

## Fuentes y autoridad

La dirección de arte debe distinguir con claridad autoridad científica, evidencia visual y canon gráfico.

| Decisión | Fuente que se debe consultar | Aplicación |
| --- | --- | --- |
| Propósito y relación entre ciencia y juego | Visión, principios y requerimientos del producto | Un sprite no constituye evidencia de identificación. |
| Autoridad botánica/editorial | `data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx` | Fuente científica única del piloto. |
| Ficha completa por especie | `data/species/` | Vista generada desde los JSON canónicos para consulta humana/IA y dirección de arte. No editar manualmente. |
| Datos estructurados y trazabilidad | `data/botanical/` | Consultar caracteres, estados, fuentes, fotos, glosario y metadata cuando se necesite detalle estructurado. |
| Evidencia visual | fotografías reales vinculadas a las especies/observaciones | Comparar individuos, órganos, proporciones, color y variación real. |
| Correcciones de diseño | Dirección artística de Álvaro y aportes atribuidos a Alejandra | Una elección para el personaje no se convierte automáticamente en regla botánica universal. |
| Apariencia vigente | `selectedDesign` en `data/characters/` y PNG aprobado | La última limpieza manual aceptada gobierna los píxeles y la paleta. |
| Técnica visual | [Guía de arte](ART_STYLE_GUIDE.md) | Fuente única para personajes, escenarios, interfaz y entregas. |
| Inventario y pendientes | [Estado de personajes](CHARACTER_DESIGN_STATUS.md), [índice de personajes](../data/characters/index.json), [catálogo ambiental](assets/backgrounds/README.md) | Distinguir recurso aprobado, ensayo, derivado y pendiente. |

Jerarquía botánica para arte:

```text
Master Botánico 2.0
        ↓
data/botanical/*.json
        ↓
data/species/*.json
        ↓
fotografías reales + interpretación artística
        ↓
asset gráfico
```

Si una ficha derivada, una nota antigua o una clave histórica entra en conflicto con Master 2.0, gobierna Master 2.0.

## Arquitectura documental de personajes

Cada tipo de decisión debe tener una fuente principal. Evitar duplicar reglas completas en varios manuales.

| Documento o recurso | Responsabilidad principal |
| --- | --- |
| [`GRAPHIC_DIRECTION.md`](GRAPHIC_DIRECTION.md) | Propósito, roles, jerarquía de autoridad y método de decisión. |
| [`ART_STYLE_GUIDE.md`](ART_STYLE_GUIDE.md) | Contrato visual y técnico. |
| [`CHARACTER_CREATION_WORKFLOW.md`](CHARACTER_CREATION_WORKFLOW.md) | Procedimiento operativo para crear, revisar, limpiar e integrar personajes. |
| [`CHARACTER_TEMPLATE.md`](CHARACTER_TEMPLATE.md) | Plantilla de ficha para personajes-especie y auxiliares. |
| [`CHARACTER_DESIGN_STATUS.md`](CHARACTER_DESIGN_STATUS.md) | Estado de producción vigente, pendientes e incidencias. |
| [`../data/characters/index.json`](../data/characters/index.json) | Índice activo y canon operativo. |
| JSON individual en `data/characters/<character>.json` + assets correspondientes | Identidad específica, selección vigente, procedencia y assets. |
| [`CHARACTER_CANON_SNAPSHOT_2026-09-15.md`](CHARACTER_CANON_SNAPSHOT_2026-09-15.md) | Snapshot histórico; no fuente normativa vigente. |

`ARBORIS_CHARACTER_CREATION_RULES.md` y `CHARACTER_COLLECTION_FINAL.md` se mantienen únicamente como rutas de compatibilidad deprecadas durante la transición. No deben recibir reglas nuevas.

## Cinco modelos de pensamiento

| Modelo | Pregunta de trabajo | Resultado esperado |
| --- | --- | --- |
| Evidencia → observación → interpretación | ¿Qué está documentado, qué se ve en esta foto y qué estamos estilizando? | Registro breve de fuentes, rasgos visibles, variaciones y decisiones de diseño. |
| Lenguaje común + identidad propia | ¿Se reconoce como Árboris y se diferencia de los demás? | Comparación de silueta, margen, ápice, nervaduras y color con el elenco vigente. |
| Jerarquía de atención | ¿Qué debe entender primero quien mira la imagen? | Hoja y rostro protagonistas; compañero subordinado; fondo que sitúa; interfaz legible. |
| Recurso dentro del ciclo de descubrimiento | ¿Qué aporta este gráfico al encuentro, observación, descubrimiento o colección? | Uso claro y estados visuales que preserven la incertidumbre. |
| Contrato de entrega y conservación | ¿Qué podemos verificar y qué debe revisar una persona? | Formato medido, revisión visual y preservación exacta del archivo manual aprobado. |

## Cómo aplicarlos

**Evidencia.** Separar siempre descripción científica, lo observable en cada imagen y estilización. Una foto de hoja adulta no demuestra cómo se ven todas las hojas jóvenes. Si falta un rasgo, dejarlo pendiente; no completarlo con decoración inventada.

**Identidad.** La unidad del elenco procede del píxel, rostro, contornos y sombreado. Cada especie conserva su paleta y morfología. Unificar no implica recolorear todos los personajes ni darles la misma silueta.

**Atención.** La hoja sigue siendo el cuerpo cuando esa es la decisión vigente. Flor, fruto u otros acompañamientos aparecen solo cuando la versión aprobada los incluye. La flora ambiental no hereda automáticamente ojos ni anatomía fantástica.

**Descubrimiento.** El personaje es una representación lúdica de una especie, no una fotografía de un individuo. Un fruto acompañante tampoco significa que el ejemplar observado esté fructificando.

**Conservación.** Un archivo cuadrado no demuestra correspondencia de píxel 1:1. Medir el archivo, examinar la cuadrícula a zoom entero y comparar con los sprites aprobados. Integrar la limpieza manual mediante copia exacta, sin cuantización ni reescalado.

## Elenco y función visual actual

Estas son identidades gráficas, no personalidades ni habilidades narrativas definitivas.

| Especie | Identidad del personaje vigente | Acompañamiento vigente |
| --- | --- | --- |
| Peumo / Peumito · SP001 | Hoja ovalada verde azulado grisáceo, sin pecíolo visible | Drupa rosada a roja |
| Litre / Litrini · SP002 | Hoja ovalada; nervaduras secundarias bifurcadas cerca del margen; tallo curvo | Dos frutos blancos |
| Bollén · SP003 | Hoja oblonga, ápice poco agudo, oliva con matiz café y dientes blanquecinos ascendentes en todo el margen | Fruto oscuro estrellado, dos ojos y espacio de semilla vacío |
| Mitique · SP004 | Hoja única ancha en la zona media, ápice alargado, hasta tres dientes suaves por lado y nervadura fina blanquecina | Ninguno |
| Colliguay · SP005 | Diseño y limpieza manual aprobados; puntas rojizas con proporción conservada según referencia aprobada | Hoja única con pecíolo corto; sin acompañante en la versión elegida |
| Quillay / Quillai · SP006 | Hoja con dos dientes suaves por lado y coronilla característica | Sin accesorio separado en el PNG vigente |
| Boldo · SP007 | Recurso gráfico fuera de las seis especies botánicas del piloto actual | Fruto y flor separados según diseño vigente |
| Piedra-guía de líquen · auxiliar | Personaje de asistencia no botánico | Roca compacta con manto de líquen y rostro; sin suelo ni escenario en el sprite |

Nota: SP007 Boldo y personajes auxiliares pertenecen a la capa gráfica/jugable y no amplían por sí solos el catálogo científico del piloto Master 2.0.

## Tipografía de interfaz confirmada

Decisión vigente: **Pixelify Sans + Nunito Sans**.

| Familia | Uso principal | Criterio |
| --- | --- | --- |
| Pixelify Sans | Títulos, nombres de especies, encabezados, acciones destacadas y descubrimientos | Conserva el carácter pixelado/JRPG. |
| Nunito Sans | Cuerpo, descripciones, botones secundarios, navegación y metadatos | Aporta legibilidad y lectura accesible en pantallas pequeñas. |

El logotipo se mantiene como diseño independiente.

## Flujo de una tarea gráfica

1. Precisar especie/entorno, uso, referencia vigente y formato.
2. Consultar primero la ficha de `data/species/` y, si hace falta, `data/botanical/` y Master 2.0.
3. Revisar fotografías reales y distinguir rasgos documentados de estilización.
4. Definir silueta, paleta y estructura secundaria.
5. Comparar con el elenco vigente y revisar legibilidad al tamaño real.
6. Preparar el editable siguiendo la guía de arte.
7. Auditar transparencia, halos, píxeles fantasmas y separación de accesorios.
8. Registrar aprobación artística y conservar la procedencia de cualquier corrección botánica.
9. Integrar limpieza manual sin alterar píxeles aprobados.

## Control de prompts y modelos de imagen

La biblioteca de prompts es experimental y está separada de los assets canónicos.

Una imagen generada no se convierte automáticamente en decisión de arte ni en evidencia botánica.

Registrar, cuando corresponda: modelo, fecha, referencia, resolución, prompt, salida y observaciones.

Las referencias externas sirven para principios comparativos de composición, profundidad, iluminación y legibilidad; no autorizan copiar personajes, interfaces, paletas, escenarios ni composiciones.

Estados de trabajo:

```text
referencia
→ propuesta
→ diseño aprobado
→ editable verificado
→ limpieza manual integrada
```

## Brief mínimo para continuar

Antes de producir, dejar en el contexto de la tarea: recurso y uso, especie/entorno, ficha canónica consultada, fotografías relevantes, rasgos a conservar, cambio pedido, decisiones pendientes, lienzo, formato, comparación con canon y verificación prevista.

## Verificación reutilizable

Desde la raíz de `arboris`, ejecutar en Windows:

`pwsh -File tools/validate-graphic-assets.ps1`

La comprobación técnica no sustituye revisión visual ni aceptación del director de arte.

## Pendientes delimitados

- Mantener el marco de descubrimiento como argumento común; personalidades, habilidades y relaciones narrativas siguen abiertas.
- Conservar los sprites manualmente aprobados como versiones canónicas hasta una revisión explícita.
- Revisar fondos, parallax, minijuegos, mapas y estados de UI mediante briefs propios.
- No aplicar la regla de sprites 125×125 al texto ni a toda la interfaz móvil.
- Toda nueva decisión morfológica de una especie piloto debe contrastarse con la ficha derivada de Master 2.0 y con evidencia fotográfica real.