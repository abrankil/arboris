# Árboris — Cierre de jornada 2026-09-16

## Alcance integrado

Este cierre consolida dos frentes desarrollados durante la jornada:

1. sistema de referencias y dirección de arte ambiental;
2. sistema de topologías y blockouts para mapas conectados.

## Principios consolidados

- Los mapas jugables de Árboris se conciben como fragmentos conectados de un mundo continuo, no como islas o dioramas aislados.
- La cuadrícula es una lógica de navegación y pathfinding; puede permanecer visualmente sutil.
- La topología se define de forma determinista antes de la estilización asistida.
- La IA puede estilizar un blockout aprobado, pero no tiene autoridad para agregar, quitar o mover conexiones estructurales.
- Los mapas pueden declarar conexiones independientes en norte, sur, este y oeste con roles `none`, `primary`, `secondary`, `return` o `conditional`.
- Las topologías iniciales son `corridor`, `elbow`, `junction`, `crossroad`, `pocket` y `hub`.
- Las referencias ambientales se separan por relevancia para el piloto: `core`, `contextual` y `comparative`.
- Fundo Los Nogales es el territorio núcleo del piloto; Arrayán / Santuario Los Nogales aporta contexto inmediato; Yerba Loca, Río Clarillo y Pirque funcionan principalmente como referencias comparativas.
- Las imágenes generadas para explorar escenarios son referencias de diseño, no evidencia ecológica o botánica.

## Fuente botánica vigente

La fuente editorial y científica vigente del piloto es:

`data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx`

El sistema ambiental se sincroniza con esta ruta y no modifica el Master.

## Estado de integración al cierre

- El sistema ambiental fue revisado e integrado sobre el `main` vigente mediante PR dedicado.
- El sistema de topologías fue revisado e integrado sobre el `main` ya actualizado con el sistema ambiental.
- No se integraron imágenes generadas como evidencia ambiental ni como assets canónicos.
- No se modificaron sprites, gameplay, lógica de identificación ni el Master Botánico desde este frente.

## Próximo punto de partida

Al reiniciar el trabajo de escenarios:

1. usar blockouts deterministas como autoridad estructural;
2. estilizar una topología por vez;
3. evaluar `pass / revise / fail` según conservación de conexiones;
4. poblar referencias `core` del Fundo Los Nogales;
5. extraer reglas visuales del territorio solo después de contar con evidencia localizada suficiente.

## Regla de continuidad

No aumentar todavía la complejidad del sistema de mapas ni fijar tamaños estándar hasta completar las pruebas con blockouts deterministas. La prioridad es comprobar reproducibilidad estructural antes de ampliar el esquema.
