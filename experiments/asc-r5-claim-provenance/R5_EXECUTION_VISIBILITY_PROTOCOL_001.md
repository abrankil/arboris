# ASC — R5 Execution Visibility Protocol 001

**Experimento:** ASC-R5-CLAIM-PROVENANCE-CONTRAST-001  
**Estado:** frozen protocol candidate / not executed

## Productor puede ver

En cada corrida, el productor recibe únicamente:

1. `R5_SOURCE_001.svg`;
2. el texto íntegro de `R5_PRODUCER_INSTRUCTION_001.txt`;
3. el contenido íntegro de uno de los paquetes neutrales A/B.

Los paquetes deben entregarse como contenido, sin exponer al productor una etiqueta CONTROL/TREATMENT ni un manifest de asignación.

## Productor no puede ver

- `R5_DESIGN_MANIFEST_003.json`;
- la correspondencia A/B → CONTROL/TREATMENT;
- `R5_BLIND_AUDIT_RUBRIC_001.md`;
- auditorías previas del diseño;
- resultados de la otra condición;
- veredicto esperado.

## Orquestación

La asignación experimental queda registrada solo en el manifest de diseño:

```text
PACKAGE_A = CONTROL
PACKAGE_B = TREATMENT
```

Los outputs de productor deben guardarse después bajo identificadores ciegos X/Y antes de la auditoría.

La asignación X/Y debe quedar registrada fuera del material visible al auditor hasta que las evaluaciones individuales estén cerradas.

## Reproducibilidad

Registrar:

- modelo/agente y versión;
- fecha/hora;
- parámetros disponibles;
- seed, si existe;
- hash de source;
- hash de producer instruction;
- hash de package;
- output íntegro sin corrección retrospectiva.

No seleccionar el mejor output entre múltiples ejecuciones.
