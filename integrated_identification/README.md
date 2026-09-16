# integrated_identification — Estado del prototipo

Este directorio conserva un prototipo de integración entre BioCLIP y una clave botánica anterior al motor canónico.

## Estado

Experimental / histórico.

No representa la arquitectura final del backbone de identificación.

## Límite principal

`identify.py` conecta componentes existentes y mantiene algunos nombres comunes, rutas e integraciones de forma directa. Sirve para estudiar el flujo, pero no debe ampliarse como solución definitiva.

## Arquitectura vigente esperada

El siguiente desarrollo del backbone es Hito 15.5: un motor genérico de identificación que consuma directamente los datos canónicos de Master Botánico 2.0:

```text
data/botanical/species.json
data/botanical/characters.json
data/botanical/species_characters.json
```

El motor debe contener comportamiento algorítmico, no conocimiento botánico por especie.

Después de validar ese motor, se conectarán selección adaptativa, adquisición de evidencia, BioCLIP y observadores visuales.
