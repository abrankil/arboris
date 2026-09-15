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

Start with the [graphic direction and working method](docs/GRAPHIC_DIRECTION.md), then apply the [unified art guide](docs/ART_STYLE_GUIDE.md). The first completed six-character collection is summarized in the [final character collection](docs/CHARACTER_COLLECTION_FINAL.md); this does not define the future size of the cast. Current resources are tracked in the [character status](docs/CHARACTER_DESIGN_STATUS.md), [character index](data/characters/index.json), and [environment catalogue](docs/assets/backgrounds/README.md).

For Android, Steam/PC and web environment assets, use the [environment production specification](docs/ENVIRONMENT_PRODUCTION_SPEC.md).

On Windows, run `pwsh -File tools/validate-graphic-assets.ps1` for a read-only check of graphics metadata, referenced files, image dimensions and transparency. It does not replace visual review or Pixelorama verification.
