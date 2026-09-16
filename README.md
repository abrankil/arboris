# Árboris

Árboris is a mobile real-world exploration and collection game focused on native Chilean flora. It combines discovery, learning, documentation, and assisted identification with scientifically useful observations. The initial MVP covers one pilot area and six already-documented native species.

The project is currently establishing its repository and documentation. Application implementation has not started. The selected stack is Expo 57, React Native 0.86.3, React 19.2.3, TypeScript 6, Expo Router, and SQLite through expo-sqlite. Dependencies are declared in package.json.

## Dirección de Arboris

- **Alejandra:** fundadora y directora de proyecto.
- **Alvaro:** director de arte.

La dirección del proyecto corresponde a Alejandra; la dirección artística y la coherencia visual, a Alvaro. Estos roles orientan la atribución de decisiones en la documentación y el trabajo del equipo.

## Documentation

- [Product vision](docs/PRODUCT_VISION.md)
- [Product principles](docs/PRODUCT_PRINCIPLES.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Data model](docs/DATA_MODEL.md)
- [Roadmap](docs/ROADMAP.md)

## Graphic development

Start with the [graphic direction and working method](docs/GRAPHIC_DIRECTION.md), then apply the [unified art guide](docs/ART_STYLE_GUIDE.md). For character work, use the [character creation workflow](docs/CHARACTER_CREATION_WORKFLOW.md), [character template](docs/CHARACTER_TEMPLATE.md), [current character status](docs/CHARACTER_DESIGN_STATUS.md), and [character index](data/characters/index.json).

The current implementation state of the character documentation refactor is tracked in [character refactor status](docs/CHARACTER_REFACTOR_STATUS.md). The historical character consolidation from 2026-09-15 is preserved in the [dated character canon snapshot](docs/CHARACTER_CANON_SNAPSHOT_2026-09-15.md); it is a historical record, not the current source of truth. The former [final character collection](docs/CHARACTER_COLLECTION_FINAL.md) remains temporarily as a deprecated compatibility pointer.

Environment resources are tracked in the [environment catalogue](docs/assets/backgrounds/README.md). For Android, Steam/PC and web environment assets, use the [environment production specification](docs/ENVIRONMENT_PRODUCTION_SPEC.md).

On Windows, run `pwsh -File tools/validate-graphic-assets.ps1` for a read-only check of graphics metadata, referenced files, image dimensions and transparency. It does not replace visual review or Pixelorama verification.
