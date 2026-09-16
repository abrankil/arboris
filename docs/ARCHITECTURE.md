# Árboris — Architecture

**Versión:** 0.2  
**Última actualización:** 15 septiembre 2026  
**Alcance:** Piloto 1.0

## 1. Propósito

Árboris es un juego de exploración, aprendizaje y colección de flora nativa chilena basado en observaciones del mundo real.

La arquitectura debe permitir que una misma observación sostenga dos capas diferentes pero conectadas:

- una experiencia casual/lúdica de descubrimiento, colección y progresión;
- una representación científica basada en evidencia, contexto, incertidumbre y trazabilidad.

La identificación asistida forma parte del ciclo de juego, pero no constituye por sí sola el producto.

Los principios definidos en `PRODUCT_PRINCIPLES.md` y la visión registrada en `PRODUCT_VISION.md` gobiernan esta arquitectura.

---

## 2. Regla arquitectónica principal

La arquitectura debe separar claramente:

1. conocimiento botánico;
2. observaciones reales;
3. evidencia;
4. hipótesis de identificación;
5. lógica de identificación;
6. modelos automáticos;
7. estado de juego;
8. presentación.

Ningún modelo de IA constituye por sí mismo la fuente de verdad taxonómica.

Los modelos automáticos son componentes sustituibles.

El núcleo permanente de Árboris debe conservar:

- conocimiento botánico estructurado;
- evidencia;
- incertidumbre;
- trazabilidad;
- historial;
- contexto;
- reglas adaptativas de discriminación.

---

## 3. Modelo conceptual compartido

La observación real constituye la fuente de verdad del registro de terreno.

Conceptualmente:

```text
Species
   ↓
Individual
   ↓
Observation
   ↓
Evidence
   ↓
Identification