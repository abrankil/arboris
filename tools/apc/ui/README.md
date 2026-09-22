# APC I12 local UI harness

Implementación de verificación H16 conforme a `docs/APC_I12_UI_CONTRACT.md` R9 y `docs/APC_I12_IMPLEMENTATION_DESIGN.md` V0.10.

## Ejecutar

Desde la raíz del repositorio:

```powershell
python -m http.server 8000
```

Luego abrir:

```text
http://localhost:8000/tools/apc/ui/apc-ui.html
```

No abrir mediante `file://`: el harness usa módulos ES y `fetch()` para leer los JSON botánicos canónicos.

## Persistencia y concurrencia

- `APC_SESSION` se guarda como un único string por `sessionId` en `localStorage`.
- Web Locks mantiene un solo writer por `sessionId`.
- Si Web Locks no está disponible, el harness no habilita write mode.
- Los bytes de fotografías y `objectURL` son runtime-only; no se guardan en APC.
- Reabrir/reimportar una sesión conserva `fingerprintSha256`, pero requiere volver a cargar/relinkear los bytes para visualizar la fotografía.

## Alcance

Es un harness local de verificación I12, no UI final H17. No modifica Master Botánico ni `data/botanical/*.json`.
