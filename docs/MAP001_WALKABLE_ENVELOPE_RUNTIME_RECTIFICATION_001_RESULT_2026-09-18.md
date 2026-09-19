# MAP-001 WALKABLE ENVELOPE AUTHORITY RUNTIME RECTIFICATION 001 — RESULT

```text
RECTIFICATION GATE: PASS
PRODUCTION STANDARD: NOT ESTABLISHED
```

**Fecha:** 2026-09-18
**Autoridad de esta rectificación:** `docs/MAP001_WALKABLE_ENVELOPE_RUNTIME_RECTIFICATION_001_CORRECTION_SET_2026-09-18.md` (18 decisiones cerradas, `CORRECTION SET: FROZEN FOR IMPLEMENTATION`).
**Alcance de este documento:** registro de evidencia del resultado exitoso del gate tras la implementación del correction set y su corrección posterior de separación autoridad/legacy en tests y workflow. No autoriza ni implica commit ni push por sí mismo — ambos ya fueron ejecutados bajo autorización explícita separada antes de este documento.

---

## Evidencia registrada

```text
HEAD:
ae628de7334c38dc63922f64425607d280153011

workflow:
MAP-001 Walkable Envelope Gate

run ID:
35409346305

Node:
v24.20.0

authority-runtime:
SUCCESS

migration-evidence:
SUCCESS

workflow global:
SUCCESS

candidate SHA:
10bf81d817b947665499aa5b942b9edb23dd0ef4259087150a5a5cf7a1f7614c

authority manifest SHA:
42686ca4e515fae7580049b593bf4b5895970f86fa5a26c84f2199604ed5082c

materializer SHA:
543a3762135b44ac0311077a4cf3e93f522fedc7acecfd80b619bffba2d3ca0d

validation SHA:
c3cefa41630e2a179c989830d13f9de38a73720bc92be2b5c364b87f753321b7

derived raster SHA:
ece4186d0dd164809dc492a7fec92d40cba2de7ab627603a95592e1c5b9c2c32

SVG SHA:
6f017c99bd3eabe570b4fae788c9f1797cd85830319e43a44f15278b657802f9

authority artifact ID:
10573660214

authority artifact digest:
sha256:673142fe8741625cd5dd28afe53b21decccff6b091d85c72ed168ad2b5dcc1df

migration artifact ID:
10572869908

migration artifact digest:
sha256:5da42906a3680a376c3b9fc3955de73a683919d0bbb7c425f289b73b29870a98
```

Esta evidencia corresponde al run disparado por el push del commit `ae628de7334c38dc63922f64425607d280153011` a `origin/main` (`fix(map001): isolate authority runtime from legacy evidence`), verificada directamente contra los logs y artifacts reales de GitHub Actions para el workflow run `35409346305`.

## Declaraciones explícitas

- **Candidate 001 no fue modificado.** `data/maps/map-001-walkable-envelope-candidate-001.json` mantiene el mismo SHA-256 (`10bf81d8...`) registrado desde el freeze original (commit `9e94d247a83b0e89a3afd5fb7579ad8c71025e42`).
- **Authority manifest 001 no fue modificado.** `data/baselines/map001-walkable-envelope-authority-001.json` mantiene el mismo SHA-256 (`42686ca4...`) registrado desde el freeze original.
- **Candidate 002 no fue modificado.** `data/maps/map-001-blockout-candidate-002.json` permanece byte-idéntico durante toda la rectificación (correction set + separación autoridad/legacy en tests y workflow).
- **Los hashes históricos del freeze permanecen intactos.** El bloque `validation.hashes` embebido en el authority manifest (commit `9e94d247a83b0e89a3afd5fb7579ad8c71025e42`, run `35380568068`) no fue re-firmado ni editado. Esta rectificación generó un registro de evidencia nuevo y separado (el de este documento), sin tocar esa evidencia histórica, tal como exige el punto 9/10 del correction set.
- **Candidate 002 no participa en `authority-runtime`.** El job `authority-runtime` (run `35409346305`) no abre, lee, mueve ni copia `data/maps/map-001-blockout-candidate-002.json` en ningún paso — ni en su suite de tests (`materialize_walkable_envelope_001.test.mjs`, que no importa `compareLegacyRaster` ni `validateWalkableEnvelopeMigration`), ni en su workflow (el step "Independence check" que movía el archivo real fue eliminado; la independencia se prueba ahora con un root temporal que nunca copia Candidate 002). `report.candidate002Dependency = false` en las materializaciones A y B.
- **Todos los `OPEN` de dominio permanecen intactos.** `metric scale`, `world bearing`, `surveyed route geometry`, `waterEdgeRasterization`, `blockerEdgeRasterization`, `interactionSpatialBinding`, `pathfinding implementation`, `renderer`, `tile size`, `final environmental art`, `territorial route width`, `exact bridge bearing` — ninguno fue tocado ni cerrado por esta rectificación. `productionStandard = NOT_ESTABLISHED` se mantiene explícito en el manifest, en el candidate y en el reporte de validación del run.

## Trazabilidad

```text
docs/MAP001_WALKABLE_ENVELOPE_RUNTIME_RECTIFICATION_001_CORRECTION_SET_2026-09-18.md
  → implementación (commit 2d562d20828cfd3587e1820cde8ca9471e56e638)
  → corrección de separación autoridad/legacy en tests y workflow
    (commit ae628de7334c38dc63922f64425607d280153011)
  → este documento
```

Este documento certifica únicamente que el run de CI referenciado produjo los resultados y hashes listados arriba, verificados directamente contra GitHub Actions. No certifica gameplay, arte final, geometría territorial ni ningún estado más allá de `NOT_ESTABLISHED` para producción.
