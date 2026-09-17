# Árboris — archivo histórico

`archive/` contiene experimentos y prototipos preservados por trazabilidad. No gobierna el desarrollo vigente y no debe cargarse por defecto en tareas de IA, arte, producto o ingeniería.

## Regla simple

```text
vigente / operativo
→ raíz + data/ + docs/ + tools/

histórico / experimental
→ archive/
```

Mover algo a `archive/` no lo elimina ni invalida su valor histórico. Significa que dejó de ser una entrada de trabajo actual.

## Contenido

- `prototypes/` — prototipos reemplazados por una arquitectura vigente.
- `vision/` — experimentos de visión por computador anteriores al frente actual de identificación.

## Uso

Abrir estos archivos solo para:

- auditoría histórica;
- comparación de enfoques;
- recuperación controlada de una idea anterior;
- reproducción de un experimento antiguo.

No usar código o resultados de `archive/` como fuente de verdad actual sin una decisión explícita de reintroducción y una nueva validación.

La arquitectura vigente de identificación está en `tools/canonical-identification/`. La fuente botánica vigente está descrita en `data/README.md`.
