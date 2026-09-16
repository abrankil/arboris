# Árboris — Character template

Usar esta plantilla para nuevas fichas de diseño o para migraciones futuras.  
No obliga a modificar inmediatamente el schema JSON existente.

# [Nombre del personaje]

## Identidad

- `characterType`: `species | support`
- `characterName`:
- `speciesId`: obligatorio si `characterType: species`; usar `N/A` si es `support`
- `speciesCommonName`: obligatorio si `characterType: species`; usar `N/A` si es `support`
- `scientificName`: obligatorio si `characterType: species`; usar `N/A` si es `support`

## Versionado

- `designVersion`:
- `spriteVersion`:
- `technicalRevision`:

## Evidencia y referencias

### Si `characterType: species`

- fuentes botánicas:
- fotografías:
- variación observada:
- observaciones humanas atribuidas:

### Si `characterType: support`

- referencias materiales/visuales:
- función visual prevista:
- observaciones humanas atribuidas:

## Rasgos obligatorios

### Personaje-especie

- silueta:
- margen:
- ápice:
- nervaduras:
- color:
- textura:
- estructuras reproductivas:
- asimetrías relevantes:

### Personaje auxiliar

- silueta:
- material/superficie:
- paleta:
- rasgo identificador:
- restricciones de representación:

No completar campos botánicos para personajes auxiliares.

## Identidad gráfica

- rasgo visual principal:
- lectura general:
- paleta:
- gesto base:
- inclinación/pecíolo/tallo:
- relación con el elenco:

## Rostro

- posición:
- tamaño relativo:
- contraste:
- variantes permitidas:

## Elementos secundarios

- `botanicalStructure`:
- `visualRepresentation`:
- relación espacial:
- prioridad visual:
- `gameplayRole`: `open | none | approved`

La representación gráfica de una estructura no define automáticamente una mecánica.

## Restricciones

### No hacer
- 

### Rasgos que no deben simplificarse
- 

## Canon

- `masterSprite`:
- `sourceEditable`:
- `sha256`:
- `selectedDesign`:

## Estado por atributo

- `morphology`: `approved | proposed | open`
- `palette`: `approved | proposed | open`
- `face`: `approved | proposed | open`
- `companion`: `approved | proposed | open | none`
- `spriteCleanup`: `verified | pending`
- `animation`: `not_started | proposed | approved`
- `gameplayRole`: `open | none | approved`

## Derivados

- gallery:
- discovery:
- gameplay:
- expressions:
- animation:
- promotional:

Un derivado nunca reemplaza al master de forma implícita.

## Producción futura — geometría

No completar con valores inventados. Registrar solo cuando se mida:

- visual center:
- pivot/origin:
- effective bounds:
- float anchor:
- attachment points:
- safe area:

## Historial

| Fecha | Cambio | Responsable | Estado |
|---|---|---|---|
| | | | |
