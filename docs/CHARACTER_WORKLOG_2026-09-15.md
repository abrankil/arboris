# Árboris — Character design worklog — 2026-09-15

Estado recopilado el 2026-09-16 para sincronización documental.

## Alcance

Este documento registra el trabajo de diseño y producción de personajes consolidado el 15 de septiembre de 2026. No reemplaza las fichas individuales, el índice de personajes ni los manuales normativos.

## Commits ya presentes en `main`

### `c498390` — Consolidate character assets and Pixelorama workflow

Se consolidó el flujo gráfico y técnico de personajes.

Cambios relevantes:
- se integró la Piedra-guía de líquen como personaje auxiliar no botánico;
- `data/characters/index.json` incorporó `supportCharacters`;
- se reforzó el contrato Pixelorama 125×125, píxel real 1×1 y transparencia real;
- se aclaró que el área efectiva del personaje puede ser menor que el lienzo;
- se separó personaje de colección de personaje auxiliar;
- se actualizó la documentación de colección y estado para no fijar un número definitivo de personajes;
- se mantuvo la aprobación visual separada de la validación técnica.

### `fbb5f31` — Integrate Boldo and refresh art direction protocols

Se integró Boldo al elenco botánico activo y se reforzó el sistema documental.

Cambios relevantes:
- `SP007_boldo` se incorporó al índice activo;
- se creó `docs/ARBORIS_CHARACTER_CREATION_RULES.md`;
- se documentó el protocolo de revisión 1:1 en Pixelorama;
- se formalizó el estado `referencia para limpieza` frente a `editable verificado`;
- se añadió un protocolo de salida limpia para reducir trabajo correctivo;
- se amplió la pauta de personajes auxiliares;
- se reforzó la regla de que una salida generada no es automáticamente un sprite canónico.

### `4a3dd21` — Add Boldo character metadata

Se añadió `data/characters/SP007_boldo.json`.

La ficha registra:
- diseño `manual-cleanup-v1`;
- sprite canónico 125×125;
- proyecto `.pxo` asociado;
- aprobación artística documentada;
- hash de procedencia;
- hoja coriácea oblonga y paleta verde bosque/oliva;
- fruto burgundy y flor clara separados;
- carácter revisable en versiones posteriores.

## Canon gráfico resultante

Personajes botánicos activos:
- SP001 Peumo / Peumito
- SP002 Litre / Litrini
- SP003 Bollén
- SP004 Mitique / Mitiqui
- SP005 Colliguay
- SP006 Quillay / Quillai
- SP007 Boldo

Auxiliar activo:
- Piedra-guía de líquen

## Contrato técnico consolidado

- sprite de galería: 125×125 px;
- PNG RGBA;
- transparencia real;
- alpha binario para sprites canónicos actuales;
- edición 1:1 en Pixelorama;
- pincel de 1 px;
- ampliaciones únicamente por múltiplos enteros con nearest-neighbor;
- una generación o reducción es referencia hasta que exista limpieza/revisión manual;
- la comprobación técnica no autoriza modificar un diseño aprobado;
- el `.pxo` solo se declara existente cuando realmente fue entregado o creado.

## Principios de identidad vigentes

- la hoja es el cuerpo principal de los personajes-especie;
- ojos pequeños y expresivos;
- sin torso, brazos, manos, piernas o vestuario humanoide en personajes botánicos;
- preservar forma, margen, ápice, nervaduras, coloración y asimetrías relevantes;
- frutos, flores y cápsulas aparecen solo cuando el diseño de la especie los contempla;
- personajes auxiliares pueden apartarse de la anatomía foliar sin fingir pertenecer al catálogo botánico;
- personaje y sprite no constituyen evidencia científica de identificación.

## Hallazgo documental posterior

La revisión del sistema detectó repetición de reglas entre:
- `GRAPHIC_DIRECTION.md`;
- `ART_STYLE_GUIDE.md`;
- `ARBORIS_CHARACTER_CREATION_RULES.md`;
- `CHARACTER_DESIGN_STATUS.md`;
- `CHARACTER_COLLECTION_FINAL.md`.

Se propone un refactor por etapas para que cada tipo de decisión tenga una única fuente de autoridad. La propuesta completa se conserva en `CHARACTER_MANUAL_REFACTOR_PLAN.md`.

## Regla para la sincronización actual

Este corte documental no modifica:
- sprites PNG;
- hashes;
- fichas botánicas;
- reglas de identificación;
- reglas de desbloqueo;
- mecánicas de gameplay.

El refactor de JSON queda fuera de esta sincronización.
