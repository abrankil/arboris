# integrated_identification — Estado del prototipo

Este directorio conserva un prototipo histórico de integración entre BioCLIP y una clave botánica anterior al motor canónico.

## Estado

Experimental / histórico.

No representa la arquitectura final del backbone de identificación y no debe ampliarse como solución definitiva.

## Límite principal

`identify.py` conecta componentes existentes y mantiene algunos nombres comunes, rutas e integraciones de forma directa. Sirve para estudiar decisiones pasadas del flujo, pero no gobierna el desarrollo actual.

## Arquitectura vigente

El backbone canónico quedó implementado en Hito 15 dentro de:

```text
tools/canonical-identification/
```

Ese módulo consume directamente datos canónicos de Master Botánico 2.0:

```text
data/botanical/metadata.json
data/botanical/species.json
data/botanical/characters.json
data/botanical/species_characters.json
```

El motor contiene comportamiento algorítmico, no conocimiento botánico por especie.

## Regla de uso

No continuar el desarrollo dentro de `integrated_identification/` salvo para auditoría, comparación o recuperación controlada de ideas históricas.

La integración futura BioCLIP → observación de caracteres → motor canónico corresponde a Hito 17. El paso técnico inmediato es Hito 16: extracción automática restringida de caracteres botánicos concretos.
