# Illestudio — estructura de departamentos

**Estado:** definición organizacional operativa. Illestudio es el estudio que desarrolla Árboris. Esta estructura departamental rige la coordinación del trabajo del proyecto.

## Alcance y límites

Este documento define departamentos de trabajo y sus responsables de dirección. No define:

- estructura legal ni relación institucional entre Illestudio y Árboris;
- contratos, salarios ni condiciones de contratación;
- dotación de personal, cargos laborales ni líneas de reporte formales;
- presupuesto ni capacidad de contratación.

Estos puntos, si se necesitan, requieren una decisión y un documento separados.

Este documento tampoco define identidad pública del producto. Las mascotas u otros elementos de motivación personal del equipo son privados; no forman parte de la identidad pública de Árboris ni son activos del producto, y no se incorporan a ningún departamento aquí descrito.

## Dirección del proyecto y dirección creativa

- **Alejandra** dirige el proyecto: fija prioridades y resuelve conflictos entre departamentos.
- **Álvaro** dirige la coherencia y la aprobación visual: toda decisión gráfica de cualquier departamento requiere su aprobación para considerarse conforme a dirección de arte.
- Ninguna de las dos direcciones sustituye a las autoridades especializadas del proyecto. La autoridad botánica/editorial y la evidencia territorial y de campo priman dentro de su dominio. Los contratos técnicos gobiernan solo la validez técnica de su ámbito: ASC compila y valida contratos, pero no decide evidencia, alcance ni dirección de proyecto. Un desacuerdo entre una decisión departamental y una autoridad de dominio se resuelve a favor de la autoridad de dominio, no de la jerarquía departamental.

## Los siete departamentos

### 1. Dirección Creativa
- **Responsable:** Álvaro.
- **Ámbito:** estándares de arte, coherencia visual entre activos y aprobación final de entregas gráficas de todos los departamentos.
- **Fuentes de referencia:** `docs/GRAPHIC_DIRECTION.md`, `docs/ART_STYLE_GUIDE.md`.
- **Límite:** no constituye autoridad botánica, territorial ni técnica; una aprobación visual no certifica exactitud botánica, territorial ni funcionamiento técnico.

### 2. Producción Visual / Pixel
- **Ámbito:** ejecución de los activos gráficos: personajes, escenarios, interfaz, logotipo, composición y pixel art, conforme a los estándares de Dirección Creativa.
- **Límite:** el trabajo de personajes-especie y escenarios debe conformarse a la autoridad botánica/editorial y a la evidencia territorial vigentes; una salida generativa o una propuesta visual no reemplaza esas fuentes.

### 3. Sistemas y Herramientas
- **Ámbito:** herramientas internas del repositorio, validadores, scripts de pipeline y el compilador ASC (`tools/`, `tools/asc/`).
- **Límite:** una herramienta interna fija estructura, formato y verificación técnica; no aprueba arte ni certifica contenido botánico, territorial o de producto.

### 4. Desarrollo / Código
- **Ámbito:** implementación del juego y la aplicación: motor, integración, lógica de producto.
- **Límite:** el código de producto no define contenido botánico ni territorial; consume los activos y datos aprobados por las autoridades correspondientes.

### 5. Investigación y Conocimiento
- **Ámbito:** investigación, consulta y trazabilidad del conocimiento de dominio del proyecto: información botánica, territorial y de vocabulario general.
- **Límite:** este departamento es la interfaz operativa hacia la autoridad botánica/editorial (Master Botánico 2.0 y derivados canónicos) y hacia la evidencia territorial y de campo; no sustituye esas autoridades ni decide en su lugar. No corrige manualmente datos botánicos derivados.

### 6. Calidad y Archivo
- **Ámbito:** control de calidad, auditoría técnica, procedencia y registro de versiones vigentes verificadas (manifiestos, validadores y registros de conservación).
- **Límite:** una verificación técnica pasada no equivale a aprobación artística, botánica o territorial; esas aprobaciones son de la autoridad correspondiente.

### 7. Experiencia de Producto
- **Ámbito:** diseño y evaluación de flujos, jerarquía de información, accesibilidad y comprensión de uso. Trabaja según la visión de producto, los principios de juego y los requerimientos funcionales de Árboris.
- **Límite:** no inventa mecánicas ni reglas de producto fuera de lo definido por sus propios documentos de visión y requerimientos; no redefine contenido botánico ni territorial.

## Autoridades especializadas dentro de la estructura

Estas autoridades no son departamentos; priman dentro de su dominio sobre cualquier departamento que las use o dependa de ellas:

| Autoridad | Alcance | Departamentos que la usan |
| --- | --- | --- |
| Autoridad botánica/editorial (Master Botánico 2.0 y derivados canónicos) | Gobierna la información botánica del proyecto. | Investigación y Conocimiento; Producción Visual / Pixel. |
| Evidencia de campo y territorial | Sustenta observaciones y representación de lugares reales. | Investigación y Conocimiento; Producción Visual / Pixel. |
| Contratos técnicos y datos canónicos (incluye ASC) | Define estructura, formato y estados verificables de los entregables dentro de su ámbito técnico. ASC compila y valida contratos; no sustituye autoridad de dominio ni dirección de proyecto. | Sistemas y Herramientas; Desarrollo / Código; Calidad y Archivo. |
| Visión y requerimientos de producto | Delimita propósito y comportamiento funcional del producto. | Experiencia de Producto; Desarrollo / Código. |

## Flujo de coordinación del proyecto

1. Precisar objetivo, uso, alcance, fuentes vigentes y formato requerido.
2. Investigación y Conocimiento identifica la autoridad de dominio aplicable y conserva la trazabilidad necesaria.
3. Experiencia de Producto contrasta la propuesta con los flujos de uso, la accesibilidad y los requerimientos funcionales.
4. Dirección Creativa define o revisa la intención visual; Producción Visual / Pixel materializa las decisiones aprobadas.
5. Sistemas y Herramientas habilita el pipeline; Desarrollo / Código implementa e integra el comportamiento requerido.
6. Calidad y Archivo verifica procedencia, estado de integración y requisitos técnicos; Dirección Creativa aprueba la coherencia visual cuando corresponda.
7. Alejandra resuelve conflictos de prioridad entre departamentos que no se resuelvan mediante la autoridad de dominio aplicable.

La secuencia organiza la coordinación general. No reemplaza los flujos normativos particulares de cada tipo de recurso.
