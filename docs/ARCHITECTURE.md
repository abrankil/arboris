# Árboris — Architecture

**Versión:** 0.4  
**Última actualización:** 16 septiembre 2026  
**Alcance:** Piloto 1.0

## 1. Propósito

Árboris es un juego de exploración, aprendizaje y colección de flora nativa chilena basado en observaciones del mundo real.

La arquitectura debe sostener simultáneamente una experiencia lúdica de descubrimiento y una representación científica basada en evidencia, contexto, incertidumbre y trazabilidad.

La identificación asistida es una mecánica central, no el producto completo.

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

Ningún modelo de IA constituye por sí mismo autoridad taxonómica.

## 3. Fuente de conocimiento botánico

La única fuente editorial y científica de verdad del piloto es:

```text
data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx
```

El Master Botánico 2.0 se exporta a ocho JSON canónicos:

```text
data/botanical/metadata.json
data/botanical/species.json
data/botanical/characters.json
data/botanical/species_characters.json
data/botanical/sources.json
data/botanical/glossary.json
data/botanical/photos.json
data/botanical/model_errors.json
```

Estos archivos son derivados reproducibles, no fuentes editoriales paralelas.

Las fichas de `data/species/` también son derivadas y existen como vistas completas por especie para consumo humano, IA, interfaz y dirección de arte.

## 4. Arquitectura de datos botánicos

```text
Master Botánico 2.0
        ↓
export_master.py
        ↓
8 JSON canónicos
        ↓
validate_master_export.py
        ↓
build_species_data.py
        ↓
6 fichas por especie
        ↓
validate_species_data.py
        ↓
tools/canonical-identification/
```

Estado del Master 2.0:

- 6 especies;
- 24 caracteres totales;
- 19 activos/computables;
- 4 retirados;
- 1 pendiente de revisión;
- 89 relaciones especie–carácter;
- 45 fotografías.

Los caracteres retirados se conservan por trazabilidad, pero no participan en identificación computable.

## 5. Modelo conceptual compartido

La observación real constituye la fuente primaria del registro de terreno.

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
```

Una identificación puede cambiar sin destruir la observación ni la evidencia que la originó.

## 6. Motor de identificación canónico

Hito 15 dejó implementado un núcleo mínimo en:

```text
tools/canonical-identification/
  dataset.mjs
  engine.mjs
  engine.test.mjs
```

El módulo consume datos canónicos, no fichas antiguas ni conocimiento botánico hardcodeado.

```text
JSON botánico canónico
        ↓
loadCanonicalDataset()
        ↓
filterCandidates()
        ↓
nextCharacter()
        ↓
assessIdentification()
```

El JSON contiene conocimiento. El engine contiene comportamiento. La sesión contiene observaciones/evidencia.

El engine no debe contener reglas específicas del tipo “Peumo tiene X” o “Quillay tiene Y”.

## 7. Compatibilidad botánica

Una observación solo elimina un taxón cuando existe incompatibilidad explícita entre estados conocidos.

Reglas implementadas:

```text
expected vacío → neutral
observed vacío → neutral
observed unknown/not_observable/not_applicable → neutral
intersección(expected, observed) ≠ ∅ → compatible
intersección(expected, observed) = ∅ → incompatibilidad explícita
```

`sin dato` nunca equivale a ausencia.

## 8. Clave adaptativa

La clave no debe ser un árbol rígido ni una segunda base botánica.

Su función es decidir qué carácter conviene obtener a continuación y cómo adquirir esa evidencia.

```text
candidatos activos
        ↓
caracteres activos no observados
        ↓
seleccionar carácter informativo
        ↓
¿evidencia existente?
        ↓
Sí → usarla
No → intentar observación automática
        ↓
¿observable con confianza?
        ↓
Sí → registrar evidencia
No → solicitar foto o preguntar al usuario
```

La pregunta de interfaz puede estar asociada a un `CH-xxx`, pero no debe contener estados esperados por especie.

## 9. Selección del siguiente carácter

Para el piloto de seis especies, una estrategia simple es suficiente.

La implementación actual minimiza el peor caso de candidatos restantes y desempata considerando:

- cantidad de especies en el grupo conocido más grande;
- cantidad de candidatos con dato desconocido;
- cantidad de grupos conocidos;
- poder diagnóstico;
- observabilidad en imagen;
- costo de observación;
- seguridad de interacción;
- orden estable por `characterId`.

No se requiere un motor de reglas externo complejo mientras unas pocas funciones puras resuelvan el problema.

## 10. Evidencia mínima de sesión

El núcleo actual acepta evidencia simple por carácter:

```js
[
  { characterId: 'CH-003', observedStates: ['serrado'], source: 'human' }
]
```

o como objeto:

```js
{ 'CH-003': 'serrado' }
```

Esta evidencia es suficiente para probar compatibilidad, descarte de candidatos y selección del siguiente carácter. La persistencia formal de sesiones se implementa después.

## 11. BioCLIP

BioCLIP funciona como generador/priorizador de candidatos.

```text
Photo
  ↓
BioCLIP
  ↓
ranked candidates
```

Sus scores no constituyen identificación definitiva ni evidencia botánica.

La evidencia botánica debe poder corregir una especie verdadera que BioCLIP haya rankeado bajo.

## 12. Modelos visuales auxiliares

Los modelos visuales pueden observar caracteres concretos, no dictar directamente la especie.

```text
Photo
+
Requested Character
      ↓
Visual Observer
      ↓
CharacterEvidence
or
NO_OBSERVABLE
```

La procedencia, modelo, versión y evidencia de origen deben conservarse.

## 13. Observación, evidencia e identificación

La arquitectura debe distinguir:

- fotografía original;
- carácter observado;
- fuente de la observación;
- candidato;
- hipótesis final;
- historial de revisión.

Una corrección posterior no debe borrar el proceso previo.

## 14. Seguridad

La adquisición de evidencia prioriza métodos observacionales y no destructivos.

Mientras *Lithraea caustica* sea candidata, el sistema no debe pedir frotar, triturar ni oler hojas.

La seguridad prevalece sobre el valor diagnóstico.

## 15. Offline-first

La lógica central de identificación debe poder ejecutarse sin servidor.

El motor debe poder probarse de forma independiente de UI, BioCLIP y modelos visuales.

La app móvil utiliza Expo/React Native y prevé SQLite mediante `expo-sqlite` para persistencia local.

## 16. Dirección de arte

La capa gráfica utiliza datos científicos sin mezclarlos con decisiones lúdicas.

Jerarquía de consulta:

```text
Master Botánico 2.0 — autoridad científica/editorial
        ↓
data/species/ — vista completa por especie
        ↓
fotografías reales — evidencia visual
        ↓
data/characters/ — decisiones y assets lúdicos
```

Una decisión de personaje no modifica conocimiento botánico.

Durante la próxima fase, Dirección de Arte no rediseña el canon base. Trabaja solo en derivados de personajes, blockouts de mapa y pruebas ambientales pequeñas.

## 17. Componentes legacy

Existen componentes experimentales anteriores a Master 2.0, incluidos adaptadores, lógica hardcodeada y claves fijas.

No deben usarse para definir nuevas funciones canónicas. Se conservan por trazabilidad y comparación mientras los flujos nuevos cubren las funciones necesarias.

## 18. Prioridad arquitectónica actual

Con Hito 15 cerrado, la siguiente responsabilidad técnica es Hito 16: extracción automática de caracteres botánicos concretos.

Después vienen integración visión → caracteres → clave adaptativa, persistencia y validación end-to-end.

## 19. Criterio de simplicidad

Árboris debe diseñarse para el piloto real de seis especies.

Orden de prioridad:

```text
correctitud
→ trazabilidad
→ simplicidad
→ testabilidad
→ offline-first
→ extensibilidad razonable
```

No se debe diseñar anticipadamente para cientos de especies si ello aumenta innecesariamente la complejidad del piloto.
