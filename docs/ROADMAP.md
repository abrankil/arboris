# Árboris — Roadmap

**Versión:** 0.5  
**Última actualización:** 16 septiembre 2026  
**Estado:** Piloto 1.0 en desarrollo; Hito 15 cerrado como base canónica mínima.

## 1. Propósito

Este documento registra el orden de trabajo del Piloto 1.0 de Árboris. La prioridad es conectar y validar las piezas ya desarrolladas antes de abrir nuevas líneas técnicas.

El piloto permanece limitado a seis especies nativas y debe demostrar un ciclo completo de exploración, observación, evidencia, identificación asistida, descubrimiento y colección.

## 2. Fuente botánica canónica

La única fuente editorial y científica de verdad del piloto es:

```text
data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx
```

El Master Botánico 2.0 gobierna especies, caracteres, estados permitidos, relaciones especie–carácter, variabilidad, fuentes, seguridad, evidencia fotográfica, glosario y errores conocidos del modelo.

Flujo canónico:

```text
Master Botánico 2.0
        ↓
tools/botanical-data/export_master.py
        ↓
data/botanical/*.json
        ↓
tools/botanical-data/validate_master_export.py
        ↓
6 fichas canónicas en data/species/
        ↓
tools/botanical-data/validate_species_data.py
        ↓
tools/canonical-identification/
```

Los JSON y fichas por especie son derivados reproducibles. No deben editarse como una segunda fuente de verdad.

Estado validado del Master 2.0:

- 6 especies;
- 24 caracteres totales;
- 19 caracteres activos/computables;
- 4 retirados;
- 1 pendiente de revisión;
- 89 relaciones especie–carácter;
- 21 fuentes;
- 53 términos de glosario;
- 45 fotografías;
- 2 errores de modelo registrados;
- 0 advertencias y 0 errores en la validación canónica.

## 3. Especies del piloto

| ID canónico | ID runtime histórico | Especie |
| --- | --- | --- |
| SP-001 | SP001 | *Cryptocarya alba* — Peumo |
| SP-002 | SP002 | *Lithraea caustica* — Litre |
| SP-003 | SP003 | *Kageneckia oblonga* — Bollén |
| SP-004 | SP004 | *Podanthus mitiqui* — Mitique |
| SP-005 | SP005 | *Colliguaja odorifera* — Colliguay |
| SP-006 | SP006 | *Quillaja saponaria* — Quillay |

Los nuevos componentes botánicos deben usar los IDs canónicos `SP-00X`. La forma `SP00X` se mantiene solo como compatibilidad con componentes históricos del runtime y arte.

## 4. Tablero maestro de 22 hitos

### Hitos completados

**Hito 1 — Concepto de Árboris definido.**  
Estado: completado.

**Hito 2 — Alcance del piloto definido.**  
Estado: completado.

**Hito 3 — Principios del sistema definidos.**  
Estado: completado. Los 15 principios de producto son requisitos permanentes.

**Hito 4 — Selección de las seis especies piloto.**  
Estado: completado.

**Hito 5 — Biblioteca fotográfica inicial.**  
Estado: completado para el alcance actual.

**Hito 6 — Master Botánico 2.0 consolidado.**  
Estado: completado.

**Hito 7 — Datos de las seis especies validados.**  
Estado: completado.

**Hito 8 — Master 2.0 convertido a datos computables.**  
Estado: completado. Se generan ocho JSON canónicos reproducibles en `data/botanical/`.

**Hito 9 — Fichas botánicas y fotografías fusionadas.**  
Estado: completado y actualizado a Master 2.0. Las seis fichas de `data/species/` se generan desde los JSON canónicos y se validan automáticamente.

**Hito 10 — Clave adaptativa funcional.**  
Estado: completado como prototipo histórico. Su conocimiento botánico hardcodeado no constituye la arquitectura final.

### Componentes experimentales

**Hito 11 — Modelo de observación.**  
Estado: experimental / parcialmente integrado.

**Hito 12 — MobileSAM / V2 para selección de evidencia.**  
Estado: experimental.

**Hito 13 — DINOv2 / V3 para análisis visual.**  
Estado: experimental.

### Benchmark visual

**Hito 14 — BioCLIP / V4 con benchmark consolidado.**  
Estado: completado.

Benchmark sobre 300 imágenes externas, 50 por especie:

- Top-1: 83.00 %;
- Top-2: 93.33 %;
- Top-3: 97.67 %.

BioCLIP es generador/priorizador de candidatos, no autoridad taxonómica.

## 5. Hito 15 — Integración botánica canónica con la clave adaptativa

**Estado:** cerrado como base canónica mínima.  
**Documento de cierre:** `docs/HITO15_CLOSEOUT_2026-09-16.md`.  
**Módulo implementado:** `tools/canonical-identification/`.

El objetivo corregido del Hito 15 fue reemplazar la dependencia de fichas antiguas/adaptadores permanentes por una base directa en Master Botánico 2.0 y sus derivados canónicos.

### 15.1 — Master 2.0 como fuente canónica

Estado: completado.

### 15.2 — Exportación canónica Master → JSON

Estado: completado.

Archivos canónicos:

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

### 15.3 — Validación estricta del export

Estado: completado.  
Herramienta: `tools/botanical-data/validate_master_export.py`.

### 15.4 — IDs canónicos de especies

Estado: completado.  
Herramienta: `tools/botanical-data/validate_species_ids.py`.

### 15.4B — Fichas canónicas por especie

Estado: completado.

Las seis fichas de `data/species/` se generan exclusivamente desde `data/botanical/*.json` mediante `tools/botanical-data/build_species_data.py` y se validan con `tools/botanical-data/validate_species_data.py`.

### 15.5 — Motor genérico de identificación

Estado: completado como núcleo mínimo.

El motor opera sobre la matriz canónica especie × carácter. Contiene algoritmos, no botánica hardcodeada.

Regla implementada:

- dato esperado desconocido → no elimina;
- observación desconocida/no observable → no elimina;
- eliminación solo ante incompatibilidad explícita entre estados conocidos.

### 15.6 — Selección adaptativa del siguiente carácter

Estado: completado como versión mínima.

`nextCharacter()` selecciona un carácter activo, no observado, capaz de separar candidatos activos. El desempate considera tamaño de grupos, desconocidos, cantidad de grupos conocidos y puntajes derivados de poder diagnóstico, observabilidad, costo y seguridad.

### 15.7 — Adquisición adaptativa de evidencia

Estado: completado como contrato mínimo de evidencia.

El motor acepta evidencia simple por `characterId` y estados observados. La adquisición visual o mediante UI queda fuera del núcleo y se implementa en hitos posteriores.

### 15.8 — Integración visión + BioCLIP + evidencia botánica

Estado: cerrado como contrato, no como integración visual final.

BioCLIP y visión quedan delimitados como fuentes futuras de candidatos u observaciones de caracteres. Ningún score visual sentencia la especie. La integración real continúa en Hito 17.

### 15.9 — Retirada controlada de legado

Estado: completado como demarcación.

Los componentes legacy fueron marcados como históricos o de migración. No se eliminan masivamente hasta que los flujos nuevos cubran las funciones necesarias.

### 15.10 — Documentación y cierre técnico

Estado: completado.

El cierre queda registrado en `docs/HITO15_CLOSEOUT_2026-09-16.md`, `tools/canonical-identification/README.md` y esta hoja de ruta.

## 6. Hitos posteriores

**Hito 16 — Extracción automática de caracteres botánicos.**  
Estado: siguiente etapa técnica.

Objetivo: probar observadores visuales restringidos por carácter. El modelo debe responder con estado permitido, `NOT_OBSERVABLE` o incertidumbre; no con una especie definitiva.

**Hito 17 — Integración visión → caracteres → clave adaptativa.**  
Estado: pendiente.

Objetivo: conectar BioCLIP, observaciones visuales de caracteres, evidencia humana y motor canónico.

**Hito 18 — Contexto ecológico, geográfico y fenológico.**  
Estado: pendiente.

**Hito 19 — Persistencia completa de observaciones, evidencia e identificaciones.**  
Estado: pendiente.

**Hito 20 — Flujo web completo del piloto.**  
Estado: pendiente.

**Hito 21 — Validación end-to-end en condiciones reales.**  
Estado: pendiente.

**Hito 22 — Cierre del piloto web Árboris v0.1.**  
Estado: pendiente.

## 7. Criterios permanentes

- No inventar botánica.
- `sin dato` no significa ausencia.
- `No sé`, `no observable` y `no aplica` son estados de observación/aplicabilidad, no estados botánicos de especie.
- Conservar variación intraespecífica.
- Preservar evidencia, procedencia y trazabilidad.
- Priorizar observación segura y no destructiva.
- Mantener arquitectura offline-first.
- No ampliar especies antes de cerrar el ciclo del piloto.
- Mantener el sistema simple mientras el piloto siga siendo de seis especies.

## 8. Prioridad inmediata

Con Hito 15 cerrado, la prioridad técnica pasa a Hito 16:

```text
probar extracción automática de caracteres botánicos concretos
```

La regla sigue siendo restrictiva: visión observa caracteres; el motor identifica por evidencia; la app no presenta identificación definitiva ciega.

La dirección de arte puede avanzar en paralelo solo dentro del alcance definido para la próxima fase: derivados de personajes, blockouts de mapa y pruebas ambientales pequeñas, sin rediseñar el canon base.
