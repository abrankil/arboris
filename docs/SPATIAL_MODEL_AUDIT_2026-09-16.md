# Árboris — Auditoría del modelo espacial y MAP-001

**Fecha:** 16 septiembre 2026  
**Estado:** propuesta de corrección en rama de auditoría  
**Ámbito:** modelo espacial, protocolo territorial, conectividad, blockout y especificación de producción.

## 1. Conclusión ejecutiva

La documentación nueva resolvió correctamente problemas importantes: separa evidencia de arte, obliga a blockout determinista, mantiene incertidumbre `OPEN` y protege la topología frente a estilización generativa.

Sin embargo, la ejecución de `MAP-001 v0.2` expuso cuatro mezclas conceptuales que conviene corregir antes del prototipo visual:

1. la jerarquía territorial mezclaba entidades geográficas con derivados jugables y celdas técnicas;
2. objetos concretos como puente, reja y casa estaban siendo promovidos a Unidades Espaciales sin demostrar que fueran experiencias espaciales autónomas;
3. la taxonomía de topología mezclaba conectividad (`corridor`, `junction`) con forma de ruta (`elbow`) y función (`hub`);
4. la especificación de escenarios trataba 480×270 como extensión de escena/mapa en vez de viewport de cámara.

Estas correcciones no cambian la dirección artística aprobada del piloto. Mejoran la arquitectura que la sostiene.

## 2. Contraste con herramientas y flujos reales

La auditoría tomó como contraste conceptual documentación pública de herramientas de producción reales:

- **Tiled Map Editor:** separa tile layers de object layers; los objetos pueden ser puntos, rectángulos, polígonos y polilíneas y no están limitados a la grilla. Esto respalda distinguir terreno discretizado de rasgos territoriales como senderos, esteros, casas o puentes.
- **Godot TileMap/TileMapLayer:** la grilla puede concentrar layout, colisión, oclusión y datos de navegación, pero la navegación tiene restricciones propias y no debe confundirse con las capas visuales. Esto respalda mantener blockout/navegación como dato lógico separado del dibujo isométrico.
- **ArcGIS / sistemas GIS:** una geometría necesita una referencia espacial explícita para relacionarse con el mundo real. Esto respalda separar el marco territorial georreferenciado del marco local de pantalla y no asumir que `screen_up` significa norte.
- **Unreal World Partition / Data Layers:** la partición espacial, los assets ambientales y los elementos de gameplay pueden gestionarse por sistemas distintos. Esto refuerza que una celda de streaming, una celda de navegación y una unidad territorial no deben compartir significado solo porque todas usan una grilla.

La adopción aquí es conceptual, no tecnológica: Árboris no selecciona Tiled, Godot, ArcGIS ni Unreal como motor o editor por esta auditoría.

## 3. Hallazgos y correcciones

### A. Jerarquía territorial

Problema anterior:

```text
Paisaje → Sector → Lugar → Unidad Espacial → Instancia Territorial → Celda Espacial
```

Esto parece una jerarquía de escala, pero `Instancia Territorial` es una versión de juego y `Celda Espacial` es implementación.

Corrección:

```text
TERRITORIO
Paisaje → Sector → Lugar → Unidad Espacial

DERIVACIÓN JUGABLE
Instancia → Contrato de Navegación → Blockout → Prototipo

IMPLEMENTACIÓN
celdas / objetos / renderer / navegación
```

### B. Unidad Espacial vs. rasgo territorial

Problema anterior:

```text
UE-001 puente
UE-002 reja
UE-003 casa
UE-004 sendero
UE-005 claro
```

El puente, reja y casa son primero rasgos/objetos. No existe todavía evidencia de que cada uno sea una experiencia espacial autónoma.

Corrección propuesta:

```text
UE-001 Umbral de acceso
  puente + reja + fundamentos + casa

UE-002 Corredor inicial
  camino + estero + laderas

UE-003 Claro de picnic
  apertura + picnic + continuidad interior
```

Los elementos internos se registran como `territorial features` con geometría mínima `point | line | area | unknown`.

### C. Topología

Problema anterior:

`corridor`, `elbow`, `junction`, `crossroad`, `pocket`, `hub` aparecían al mismo nivel.

Corrección:

- `corridor`, `junction`, `crossroad`, `pocket` = patrones derivados de conectividad;
- `elbow` = `corridor + routeShape:bend`;
- `hub` = función de permanencia/redistribución, no topología única.

La conectividad se declara primero mediante puertos locales explícitos.

### D. Orientación

Problema anterior:

Los contratos genéricos usaban `north/south/east/west` mientras `MAP-001` todavía no tiene correspondencia cartográfica pantalla↔cardinal corroborada.

Corrección:

```text
screen_up
screen_down
screen_left
screen_right
worldBearing: OPEN cuando no esté corroborado
```

Para el piloto se mantiene:

```text
screen_up = cordillera / interior / progresión
screen_down = entrada / dirección mar / retorno
```

### E. Estados

Problema anterior:

`proposed → observed → modeled → tested → approved` mezclaba madurez de evidencia y madurez de producción.

Corrección en dos ejes:

```text
evidenceStatus:
  proposed | partially_corroborated | corroborated

productionStatus:
  unmodeled | blockout | tested | approved
```

### F. Celdas y altura

Problema anterior:

La representación prismática podía interpretarse como arquitectura 3D obligatoria.

Corrección:

```text
col
row
elevationBand
walkability
blocker
interaction
```

El prisma isométrico es una visualización de revisión. No obliga a voxels apilados ni a navegación 3D.

### G. Viewport vs. mapa

Problema anterior:

La especificación afirmaba que cada escena se construía con cuatro capas de 480×270 compartiendo origen. Eso funciona para una composición de fondo/parallax, pero limita un mapa desplazable.

Corrección:

```text
480×270 = viewport lógico
map/world extent = independiente
```

El contenido del mundo puede usar tiles, chunks, objetos, sprites o una combinación. Las capas `00-sky / 01-background / 02-world / 03-foreground` se mantienen como orden compositivo, no como cuatro PNG obligatorios de pantalla completa.

## 4. Auditoría específica de MAP-001 v0.2

### Aciertos

- conserva una sola componente transitable;
- no abre laterales;
- mantiene entrada abajo y salida arriba;
- incorpora puente → portal → camino → claro;
- mantiene el estero a la derecha y más bajo después del umbral;
- conserva la casa a la izquierda como placeholder;
- declara geometría exacta como `OPEN`.

### Problemas de representación

1. **Demasiado significado embebido en la celda prismática.** El dibujo hace que cada casilla parezca un bloque físico independiente.
2. **La continuidad territorial todavía se lee peor que la lógica.** Las terrazas parecen losas escalonadas y compiten con la lectura de paisaje continuo.
3. **El umbral de entrada se fuerza a una matriz rectangular antes de tener evidencia de orientación del puente.** La conectividad sirve como hipótesis, pero no debe consolidarse como geometría territorial.
4. **El claro se representa como ensanchamiento de ruta aunque su extensión real sigue sin corroborar.** Debe etiquetarse como zona de prueba, no forma del claro.
5. **El bloque usa anotaciones para ser entendido.** La siguiente prueba debe demostrar que camino, estero, elevación y anclas se leen sin etiquetas.

## 5. Mejora propuesta para MAP-001

No pasar directamente de v0.2 a arte final. Crear una iteración intermedia `MAP-001 v0.3 structural model` con tres vistas del mismo dato:

### Vista A — contrato lógico 2D

Muestra únicamente:

- puertos;
- región transitable;
- blockers;
- `elevationBand`;
- rasgos obligatorios;
- áreas `OPEN`.

Es la autoridad estructural.

### Vista B — diagrama territorial

Representa relaciones entre UE y rasgos sin grilla detallada:

```text
entrada
→ UE-001 Umbral
→ UE-002 Corredor
→ UE-003 Claro
→ interior
```

Con estero, laderas y casa como relaciones laterales.

### Vista C — blockout isométrico

Traduce A+B a prismas/terrazas continuas para arte. La grilla se usa como guía, pero el terreno debe leerse como masas conectadas, no como pilas de cubos independientes.

## 6. Criterio para pasar a prototipo visual

`MAP-001` puede pasar a estilización cuando:

- Vista A pasa verificación de conectividad;
- Vista B no contradice la evidencia disponible;
- Vista C permite entender camino, estero, niveles y tres UE sin leer etiquetas;
- el puente no fija bearing real no corroborado;
- el claro se mantiene como extensión provisional;
- ninguna decisión `OPEN` se convierte en detalle visual convincente que parezca evidencia.

## 7. Próximo paso recomendado

1. regenerar `MAP-001 v0.3` bajo el modelo corregido;
2. reutilizar el corredor validado, pero separar geometría lógica de apariencia prismática;
3. probar primero lectura sin labels;
4. recién después producir la primera naturalización ambiental;
5. mantener la primera imagen naturalizada como `visual prototype`, nunca como evidencia.

## 8. Archivos corregidos en esta rama

- `docs/SPATIAL_MODEL.md`
- `docs/TERRITORIAL_MAPPING_PROTOCOL.md`
- `docs/MAP_TOPOLOGY_SYSTEM.md`
- `docs/MAP_TOPOLOGY_BLOCKOUT_TEST_PLAN.md`
- `docs/ENVIRONMENT_PRODUCTION_SPEC.md`

No se modifica en esta auditoría el canon visual del piloto: orientación de pantalla, camino central, estero derecho/inferior, laderas laterales, baja densidad y continuidad territorial permanecen vigentes.

## 9. Resultado de revisión — MAP-001 v0.3

**Decisión de dirección de proyecto:** revisión visual aprobada.  
**Fecha de decisión:** 16 septiembre 2026.

La aprobación corresponde al **modelo estructural v0.3 y a su gate de lectura visual**, no al mapa final ni a una geometría territorial cerrada.

Resultado:

```text
MAP-001 v0.3
productionStatus: tested
visualReview: approved
nextGate: v0.4 visual prototype
```

La aprobación confirma que v0.3 puede avanzar a naturalización ambiental porque la revisión considera suficientemente legibles para esta fase:

- continuidad del corredor;
- relación entrada → umbral → corredor → claro → interior;
- lectura central del camino;
- estero a la derecha y en nivel inferior después del umbral;
- contención lateral por masas/laderas;
- presencia y escala de player proxy;
- configuración de cámara fija de prueba;
- ausencia de ramas laterales inventadas.

Se conservan explícitamente como `OPEN` y no pueden cerrarse por el arte de v0.4:

- bearing exacto del puente;
- footprint exacto del claro;
- escala métrica del mapa;
- dimensiones finales del personaje de exploración;
- pitch/yaw/FOV y zoom definitivos;
- renderer y pathfinding;
- especies y microhábitats concretos de los interaction slots.

### Gate aprobado

```text
v0.3 structural model
→ revisión visual: APPROVED
→ v0.4 visual prototype naturalizado
```

`v0.4` sigue siendo una traducción artística/prototipo. No constituye evidencia territorial y no puede modificar claims, topología o incertidumbre `OPEN` por conveniencia visual.
