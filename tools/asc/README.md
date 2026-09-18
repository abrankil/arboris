# ASC compiler

Implementación mínima y determinista del tramo `compile-only` de Árboris Scene Compiler.

Autoridad normativa:

- `docs/ARBORIS_SCENE_COMPILER.md`

Contrato de implementación:

- `docs/ASC_V0_1_EXECUTABLE_SPEC.md` — versión histórica, congelada.
- `docs/ASC_V0_2_EXECUTABLE_SPEC.md` — extensión aditiva y retrocompatible de v0.1.

## Qué hace

Lee un contrato JSON ASC ya preparado y autorizado, valida su estructura según la versión declarada (`version: "0.1"` o `version: "0.2"`), y emite un `prompt ASC` textual estable.

ASC v0.1 permanece congelado como especificación normativa histórica. ASC v0.2 es una extensión aditiva y retrocompatible de v0.1: agrega capacidades opcionales (`bootstrapAuthority`, `taskBaseline`, `stateMachine`, `stagedContentEquivalence`) sin alterar el comportamiento de ningún contrato `version: "0.1"` existente.

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
