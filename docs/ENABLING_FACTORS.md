# Árboris — Factores habilitantes

**Versión:** 0.3  
**Última actualización:** 16 septiembre 2026  
**Alcance:** Piloto 1.0 — seis especies

Este documento define las condiciones científicas, técnicas y de datos necesarias para que Árboris desarrolle de forma confiable su sistema de exploración, aprendizaje, identificación asistida, colección y juego.

## Regla general de desarrollo

Un componente nuevo solo debe incorporarse cuando resuelva un problema demostrado del piloto. Árboris prioriza integración, trazabilidad, simplicidad y funcionamiento offline antes que expansión tecnológica.

## 1. Base botánica estructurada

**Estado: CONSOLIDADO — MASTER 2.0**

La fuente científica/editorial única del piloto es:

`data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx`

El Master Botánico 2.0 gobierna especies, caracteres, estados, relaciones especie–carácter, variabilidad, fuentes, seguridad, evidencia fotográfica, glosario y errores conocidos.

Flujo canónico:

```text
Master Botánico 2.0
→ exportación reproducible
→ data/botanical/*.json
→ validación estricta
→ fichas derivadas en data/species/
→ runtime / UI / dirección de arte / identificación
```

Estado validado:

- 6 especies;
- 24 caracteres totales;
- 19 activos/computables;
- 4 retirados;
- 1 pendiente de revisión;
- 89 relaciones especie–carácter;
- 21 fuentes;
- 53 términos de glosario;
- 45 fotografías;
- 2 errores de modelo registrados;
- 0 advertencias y 0 errores en la validación canónica.

Los JSON y fichas por especie son derivados. No deben editarse manualmente como fuentes científicas paralelas.

## 2. Fichas canónicas por especie

**Estado: CONSOLIDADO Y REPRODUCIBLE**

Las seis fichas en `data/species/` se generan desde `data/botanical/*.json` mediante:

`tools/botanical-data/build_species_data.py`

Se validan mediante:

`tools/botanical-data/validate_species_data.py`

La regeneración es determinista: el mismo conjunto de JSON canónicos produce las mismas fichas.

Estas fichas son la vista práctica para consumo humano, IA, interfaz y dirección de arte, pero su autoridad científica proviene del Master 2.0.

## 3. Evidencia fotográfica

**Estado: OPERATIVO / EN AMPLIACIÓN**

Las fotografías constituyen evidencia de observaciones y no simples imágenes decorativas.

El piloto cuenta con 45 fotografías propias vinculadas a las seis especies.

Cada fotografía debe conservar, cuando exista, relación con especie, individuo, estructura visible, procedencia y contexto.

Los datos desconocidos no deben inventarse.

## 4. Variación intraespecífica

**Estado: INCORPORADO AL MODELO / DATOS AÚN LIMITADOS**

Árboris no modela una especie mediante una única apariencia típica.

La arquitectura debe permitir múltiples estados esperados, individuos, observaciones y condiciones ambientales/fenológicas.

La variación biológica no debe confundirse automáticamente con error.

## 5. Modelo de observaciones

**Estado: DEFINIDO CONCEPTUALMENTE / IMPLEMENTACIÓN PARCIAL**

Árboris distingue:

```text
Species
→ Individual
→ Observation
→ Evidence
→ Identification
```

Una identificación es una hipótesis revisable. Una fotografía pertenece a una observación y constituye evidencia.

## 6. Identificación asistida e incertidumbre

**Estado: PROTOTIPO FUNCIONAL / ARQUITECTURA EN REFACTOR**

Árboris no entrega identificaciones definitivas basadas ciegamente en IA.

BioCLIP funciona como generador/priorizador de candidatos. La evidencia botánica debe poder corregir una priorización visual incorrecta.

“No sé” y “No puedo observarlo” son respuestas válidas. La ausencia de información nunca equivale automáticamente a evidencia negativa.

## 7. Clave adaptativa

**Estado: PROTOTIPO FUNCIONAL / MIGRACIÓN A MOTOR CANÓNICO**

La clave histórica demostró el principio de preguntas adaptativas, pero todavía contiene conocimiento botánico duplicado y vocabulario anterior al Master 2.0.

La arquitectura definitiva debe separar:

```text
conocimiento botánico canónico
        ↓
motor genérico
        ↓
selección del carácter necesario
        ↓
adquisición de evidencia
        ↓
pregunta al usuario solo si hace falta
```

La clave no debe mantener estados específicos por especie fuera del Master 2.0.

Los caracteres retirados o pendientes se conservan para auditoría, pero no participan en el motor mientras no estén activos.

## 8. Trazabilidad de la identificación

**Estado: PARCIAL / EN DESARROLLO**

Cada identificación debe conservar evidencia, procedencia, método, candidatos considerados, caracteres utilizados, incertidumbre e historial de revisión.

La evidencia original no debe perderse cuando cambia una hipótesis.

## 9. Seguridad y observación ética

**Estado: DEFINIDO**

La obtención de evidencia debe privilegiar métodos visuales, seguros y no destructivos.

Mientras *Lithraea caustica* sea candidata, Árboris no debe solicitar frotar, triturar ni oler hojas.

Tampoco debe solicitar cortar tejidos de *Colliguaja odorifera* para comprobar látex ni pruebas destructivas equivalentes sobre otras especies.

## 10. Contexto territorial, ecológico y fenológico

**Estado: PREPARADO CONCEPTUALMENTE / PENDIENTE DE INTEGRACIÓN**

La identificación debe poder incorporar progresivamente territorio, ecosistema, distribución, altitud, hábitat, microhábitat, época y fenología.

El contexto informa las hipótesis; no debe inventar certeza.

## 11. Arquitectura offline-first

**Estado: DEFINIDO / IMPLEMENTACIÓN PARCIAL**

La app debe poder funcionar en terreno con conectividad limitada.

Stack previsto:

- Expo;
- React Native;
- TypeScript;
- Expo Router;
- SQLite mediante `expo-sqlite`.

La inferencia visual on-device se decidirá solo después de validar qué modelos son realmente necesarios.

## 12. Paquetes territoriales

**Estado: DEFINIDO CONCEPTUALMENTE / FUTURO**

Árboris podrá distribuir paquetes descargables por territorio/ecosistema con especies, datos, mapas y recursos de identificación necesarios para uso offline.

No es necesario definir el formato final antes de cerrar el piloto.

## 13. Separación entre especie, conocimiento y personaje

**Estado: DEFINIDO**

Árboris mantiene separados:

1. especie biológica real;
2. conocimiento/evidencia;
3. personaje jugable.

El personaje no sustituye la ficha científica y las decisiones gráficas no se convierten automáticamente en reglas botánicas.

## 14. Dirección de arte basada en datos canónicos

**Estado: HABILITADA**

Para el piloto, la dirección de arte debe consultar prioritariamente:

1. `data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx` como autoridad editorial/científica;
2. `data/species/` como vista completa generada por especie;
3. `data/botanical/` para datos estructurados y trazabilidad;
4. fotografías reales como evidencia visual;
5. `data/characters/` para decisiones lúdicas y assets aprobados.

Una ficha derivada facilita el trabajo, pero no reemplaza la autoridad del Master 2.0.

## 15. Integridad, procedencia y versionado

**Estado: OPERATIVO / EN DESARROLLO CONTINUO**

El Master 2.0 registra versión de esquema y SHA-256 de integridad. Los exports y fichas se validan automáticamente.

Los IDs canónicos son `SP-001...SP-006`. Los IDs `SP001...SP006` se mantienen solo para compatibilidad histórica con algunos componentes.

## 16. Modelos visuales como observadores de caracteres

**Estado: POSTERIOR AL MOTOR CANÓNICO**

Los modelos visuales futuros no deben responder directamente “esta especie es X”. Deben observar caracteres concretos definidos por el Master 2.0 y poder abstenerse.

Ejemplo:

```text
Photo + CH-003
→ modelo visual
→ estado permitido o NO_OBSERVABLE
```

La procedencia de esa observación debe conservarse.

## 17. Prioridad actual

Con Master 2.0, JSON canónicos y fichas por especie ya consolidados, la prioridad técnica es construir y validar el motor genérico de identificación antes de ampliar la visión artificial o retirar el legado.

La dirección de arte puede avanzar en paralelo sobre las fichas canónicas y fotografías reales.