# ASC v0.1 compiler

Implementación mínima y determinista del tramo `compile-only` de Árboris Scene Compiler.

Autoridad normativa:

- `docs/ARBORIS_SCENE_COMPILER.md`

Contrato de implementación:

- `docs/ASC_V0_1_EXECUTABLE_SPEC.md`

## Qué hace

Lee un contrato JSON v0.1 ya preparado y autorizado, valida su estructura y emite un `prompt ASC` textual estable.

No decide autoridad, no evalúa evidencia, no cierra `OPEN` y no ejecuta modelos generativos.

## Uso

```bash
npm run compile:asc -- tools/asc/fixtures/minimal-contract.json
```

Salida a archivo:

```bash
npm run compile:asc -- tools/asc/fixtures/minimal-contract.json --output build/asc-prompt.txt
```

Pruebas:

```bash
npm run test:asc
```

## Regla de desarrollo

Toda ampliación debe partir de una necesidad de prueba concreta y aplicar el protocolo de `docs/DEVELOPMENT_MANUAL.md` antes de consolidarse.
