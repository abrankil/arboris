# Árboris — Protocolo de mapeo territorial

## Estado

Protocolo inicial para levantar evidencia territorial y convertirla en Unidades Espaciales, Contratos Jugables, blockouts y pruebas visuales.

Depende del modelo conceptual definido en `docs/SPATIAL_MODEL.md`.

No implementa mapas, motores, assets ni datos botánicos nuevos.

## Objetivo

Establecer un flujo reproducible para transformar un territorio real en un mapa jugable reconocible de Árboris.

El flujo general es:

```text
territorio real
→ evidencia
→ Unidad Espacial
→ Instancia Territorial
→ Contrato Jugable
→ Celdas Espaciales / blockout
→ Dirección de Arte
→ prototipo visual
→ evaluación
```

## Principio de trabajo

No empezar por una imagen final. Empezar por el lugar.

```text
lugar reconocible
→ rasgos que lo hacen reconocible
→ estructura de recorrido
→ abstracción jugable
→ arte
```

El mapa debe conservar identidad territorial, no copiar el territorio metro por metro.

## 1. Seleccionar el lugar

Elegir un Lugar dentro del Sector.

Para el piloto:

```text
Paisaje:
  Precordillera de Santiago

Sector:
  Fundo Los Nogales / El Arrayán
```

El Lugar seleccionado debe cumplir al menos tres condiciones:

- ser reconocible para alguien que lo haya visitado;
- tener una estructura espacial comprensible;
- poder traducirse a una función jugable simple.

No elegir todavía áreas demasiado extensas.

## 2. Registrar evidencia

Cada evidencia debe indicar procedencia y confianza.

Tipos iniciales:

- evidencia topográfica: Google Earth / Google Earth Pro;
- evidencia visual: fotografías reales;
- evidencia experiencial: memoria de visitante;
- evidencia botánica: Master Botánico 2.0 y derivados;
- evidencia ambiental: referencias ambientales `core`, `contextual` o `comparative`.

Una evidencia no se convierte automáticamente en regla. Primero se registra, luego se contrasta, después se destila.

## 3. Capturas mínimas en Google Earth

Para una Unidad Espacial o Lugar candidato, obtener idealmente:

```text
GE-01 vista superior general
GE-02 vista oblicua desde entrada
GE-03 vista oblicua hacia salida
GE-04 detalle de ruta o tramo
GE-05 vista amplia del contexto territorial
```

Registrar para cada captura:

- fecha de captura;
- orientación aproximada;
- qué se ve;
- qué decisión podría informar;
- qué no permite concluir.

Google Earth se usa como evidencia topográfica, no como arte final ni como fuente canónica única.

## 4. Memoria de visitante

La memoria de una persona que conoce el lugar es evidencia experiencial válida para reconocibilidad.

Debe registrarse separando:

```text
hecho recordado
interpretación
confianza
pendiente de respaldo
```

Ejemplo:

```text
Hecho recordado:
  La entrada principal comienza después de un puente de madera que cruza el Estero El Arrayán.

Interpretación:
  El puente funciona como transición exterior/interior.

Pendiente:
  respaldar con fotografía o captura topográfica cuando sea posible.
```

## 5. Definir Unidades Espaciales

Una Unidad Espacial no es un tile ni un objeto decorativo. Es un fragmento del lugar que el jugador puede reconocer como una unidad de experiencia.

Para cada Unidad Espacial registrar:

```text
id
nombre
tipo
rasgos reconocibles
evidencia disponible
función real
función experiencial
función jugable
relaciones con otras unidades
estado
```

Estados iniciales:

- `proposed` — propuesta a partir de evidencia inicial;
- `observed` — respaldada por evidencia visual/topográfica suficiente;
- `modeled` — traducida a Contrato Jugable y blockout;
- `tested` — usada en prototipo visual;
- `approved` — aprobada como regla o base de producción.

## 6. Definir Instancia Territorial

Una Instancia Territorial es la versión jugable de una o más Unidades Espaciales bajo una condición concreta.

Registrar:

```text
id
nombre
unidades espaciales incluidas
condición o variante
objetivo de prueba
alcance
no objetivos
```

Ejemplo:

```text
MAP-001 — Acceso Principal
Incluye:
  UE-001 Puente de madera
  UE-002 Portal / reja metálica antigua
  UE-003 Casa del conserje
  UE-004 Sendero inicial
  UE-005 Claro de picnic

Condición:
  primera prueba de entrada / transición / tutorial
```

## 7. Definir Contrato Jugable

El Contrato Jugable separa topología y flujo.

Registrar:

```text
topología
flujo
entrada
salida
conexiones cerradas
ruta principal
nodos de decisión
bloqueos
interacciones
criterio de falla
```

Para el primer caso:

```text
topología: corridor
flujo: entrada / transición / tutorial
entrada: puente / portal
salida: claro de picnic
rutas laterales: ninguna en la primera prueba
```

## 8. Traducir a Celdas Espaciales

La Celda Espacial es técnica. Debe permitir construir el blockout y representar altura, transitabilidad y bloqueos.

Registrar solo lo necesario para la prueba:

```text
x
y
z / altura relativa
walkable
terrainType
blockerType
edgeConnection
interactionPoint
notes
```

No fijar todavía tamaño real de celda ni escala metro/celda. Esa decisión queda abierta hasta probar prototipos.

## 9. Crear blockout

El blockout es la prueba estructural antes del arte.

Debe mostrar:

- ruta caminable;
- bloqueos;
- alturas relativas;
- entrada;
- salida;
- bordes conectados o cerrados.

El blockout puede ser simple. No debe ser bonito.

Regla dura:

```text
si el prototipo visual cambia la conectividad del blockout, falla.
```

## 10. Pasar a Dirección de Arte

Dirección de Arte recibe:

- Lugar;
- Unidades Espaciales;
- evidencia;
- Contrato Jugable;
- blockout;
- restricciones.

Debe decidir:

- cómo se ve la altura;
- cómo se ven los bloqueos;
- cómo se lee la ruta;
- qué elementos hacen reconocible el lugar;
- qué queda como fondo;
- qué queda como plano jugable;
- qué queda como foreground.

La salida inicial es un prototipo visual, no un asset final.

## 11. Evaluación del prototipo

Ficha mínima:

```text
testId:
instanciaTerritorial:
topología:
flujo:
conectividadPreservada: sí/no
conexionesInventadas: sí/no
rutaPrincipalLegible: sí/no
reconocibilidadTerritorial: baja/media/alta
coherenciaAmbiental: baja/media/alta
legibilidadJugable: baja/media/alta
usoComoReferenciaProducción: no/parcial/sí
decisión: pass/revise/fail
```

Criterios:

- `fail` si altera conectividad obligatoria;
- `revise` si mantiene conectividad pero se siente genérico;
- `pass` si mantiene conectividad, conserva rasgos reconocibles y permite continuar a otra prueba.

## 12. Primer caso: Acceso Principal

El primer ejercicio del protocolo será:

```text
MAP-001 — Acceso Principal
```

Secuencia experiencial registrada:

```text
exterior
→ puente de madera sobre Estero El Arrayán
→ reja metálica antigua abierta
→ casa del conserje a la izquierda
→ sendero único
→ claro de picnic
```

Modelo inicial:

```text
UE-001 Puente de madera
UE-002 Portal / reja metálica antigua
UE-003 Casa del conserje
UE-004 Sendero inicial
UE-005 Claro de picnic
```

Contrato inicial:

```text
topología: corridor
flujo: entrada / transición / tutorial
```

## 13. Límites actuales

Este protocolo no autoriza todavía:

- cerrar escala metro/celda;
- declarar un mapa final;
- fijar pathfinding;
- elegir renderer;
- modificar el Master Botánico;
- cerrar microhábitats de especies;
- agregar especies por intuición;
- convertir capturas de Google Earth en assets finales;
- usar imágenes generadas como evidencia territorial.

## 14. Próximo paso operativo

Para iniciar `MAP-001`, reunir:

- captura superior del acceso;
- captura oblicua desde el puente hacia la reja;
- captura o foto de la reja y pilares de piedra;
- captura o foto de la casa del conserje;
- captura o foto del sendero hacia el claro;
- captura o foto del claro de picnic.

Con esa evidencia se podrá dibujar el primer blockout y probar una versión visual del corredor de acceso.