# Árboris — Clave botánica del piloto

**Versión:** 1.1  
**Última actualización:** 16 septiembre 2026  
**Estado:** referencia histórica/metodológica del piloto  
**Alcance:** seis especies leñosas del piloto Árboris

## 1. Propósito

Este documento conserva la lógica y razonamiento de la clave histórica utilizada durante el desarrollo temprano del piloto.

No constituye la fuente botánica maestra ni debe mantener conocimiento científico independiente del Master Botánico 2.0.

La fuente científica/editorial oficial es:

`data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx`

Los caracteres, estados permitidos y relaciones especie–carácter que use el sistema deben derivarse de ese Master y de sus JSON canónicos.

## 2. Especies del piloto

- *Cryptocarya alba* — Peumo — SP-001
- *Lithraea caustica* — Litre — SP-002
- *Kageneckia oblonga* — Bollén — SP-003
- *Podanthus mitiqui* — Mitique — SP-004
- *Colliguaja odorifera* — Colliguay — SP-005
- *Quillaja saponaria* — Quillay — SP-006

La clave no es aplicable a la flora nativa de Chile en general.

## 3. Principios que se conservan

La experiencia de identificación debe:

- priorizar caracteres observables y seguros;
- usar primero evidencia ya disponible;
- preguntar solo por caracteres que discriminen entre candidatos activos;
- aceptar “No sé” y “No puedo observarlo”;
- no transformar desconocimiento en ausencia;
- conservar variación intraespecífica;
- poder permanecer no resuelta;
- mantener evidencia y trazabilidad.

Estos principios siguen vigentes aunque cambie la implementación de la clave.

## 4. Estado de la clave dicotómica histórica

La clave dicotómica temprana fue útil para:

- comprobar que seis especies podían discriminarse mediante caracteres botánicos;
- diseñar preguntas adaptativas;
- probar seguridad e incertidumbre;
- detectar confusiones entre especies;
- validar el valor de combinar BioCLIP con evidencia botánica.

Sin embargo, varias bifurcaciones contienen formulaciones o caracteres anteriores a la normalización del Master 2.0.

Por tanto, su contenido no debe copiarse directamente al motor nuevo.

## 5. Cambio introducido por Master 2.0

El Master 2.0 normaliza y gobierna los caracteres del piloto.

Estado actual:

- 24 caracteres totales;
- 19 activos/computables;
- 4 retirados;
- 1 pendiente de revisión.

Un carácter retirado permanece disponible para auditoría histórica pero no debe participar en identificación computable.

Ejemplo importante: **CH-017 — Dientes con pequeñas glándulas** se conserva para trazabilidad, pero su estado en el piloto es `retirado`. La presencia histórica de una pregunta equivalente en la clave antigua no autoriza a usarla en el motor actual.

## 6. Arquitectura objetivo de la clave adaptativa

La clave futura no debe ser un árbol fijo ni una tabla de estados por especie hardcodeada.

Flujo objetivo:

```text
Master Botánico 2.0
        ↓
JSON botánico canónico
        ↓
motor genérico de compatibilidad
        ↓
candidatos activos
        ↓
selección del carácter más informativo
        ↓
¿ya existe evidencia suficiente?
        ↓
Sí → usarla
No → intentar observación automática
        ↓
¿observable con suficiente confianza?
        ↓
Sí → incorporar evidencia
No → pedir otra foto o preguntar al usuario
        ↓
hipótesis + evidencia + incertidumbre + trazabilidad
```

## 7. Rol del motor

El motor debe operar sobre la matriz canónica especie × carácter.

No debe saber que una especie concreta es Peumo, Litre, Bollén, Mitique, Colliguay o Quillay para aplicar reglas especiales.

Una especie se descarta solo ante incompatibilidad explícita entre conocimiento esperado y evidencia observada.

Si el conocimiento esperado está vacío, la especie permanece candidata.

Si la observación es desconocida o no observable, ningún candidato se elimina por ese carácter.

## 8. Selección adaptativa

Con seis especies no se requiere un motor complejo de reglas.

El sistema puede evaluar dinámicamente qué carácter no observado divide mejor a los candidatos restantes.

La selección debe considerar:

- poder discriminativo;
- observabilidad;
- seguridad;
- costo de observación;
- dependencia fenológica;
- evidencia ya disponible.

No existe un carácter que deba ser obligatoriamente la primera pregunta.

## 9. Adquisición de evidencia

La clave no debe preguntar al usuario por un carácter que ya pueda extraerse con suficiente confianza de evidencia existente.

Orden preferido:

```text
evidencia existente
→ visión sobre foto actual
→ solicitar otra fotografía
→ preguntar al usuario
```

La respuesta “No sé / no puedo observarlo” siempre es válida.

## 10. Relación con BioCLIP

BioCLIP funciona como generador/priorizador de candidatos.

Sus rankings no son identificaciones definitivas ni probabilidades taxonómicas.

La evidencia botánica debe poder corregir un candidato visual mal priorizado.

## 11. Seguridad

La obtención de evidencia debe priorizar observación visual y métodos no destructivos.

En particular:

- no solicitar frotar, triturar u oler hojas mientras *Lithraea caustica* sea candidata;
- no solicitar cortar tejidos de *Colliguaja odorifera* para comprobar látex;
- no solicitar provocar apertura de frutos;
- no solicitar cortar corteza o tejidos de *Quillaja saponaria* para comprobar saponinas.

La seguridad tiene prioridad sobre el valor diagnóstico.

## 12. Relación con datos canónicos

Toda implementación debe consultar:

```text
data/botanical/species.json
data/botanical/characters.json
data/botanical/species_characters.json
```

Las fichas de `data/species/` pueden utilizarse como vistas completas por especie para lectura humana/IA, pero siguen siendo derivados del mismo conocimiento.

Este documento no debe convertirse en una tercera representación de botánica.

## 13. Criterio de validación futura

La clave adaptativa se considerará validada cuando:

- consuma conocimiento exclusivamente desde los datos canónicos;
- ningún carácter retirado participe en la inferencia;
- los datos desconocidos sean neutrales;
- la selección del siguiente carácter sea dinámica;
- la procedencia de cada evidencia quede registrada;
- BioCLIP pueda ser corregido por evidencia botánica;
- el sistema pueda terminar como no resuelto;
- las pruebas con fotografías reales mantengan la especie correcta entre los candidatos cuando la evidencia sea compatible.

## 14. Nota histórica

Las bifurcaciones y preguntas de la versión 1.0 pueden seguir consultándose mediante el historial de Git cuando sea necesario estudiar decisiones anteriores.

A partir de Master 2.0, cualquier discrepancia entre una formulación histórica y los datos canónicos se resuelve a favor del Master 2.0.