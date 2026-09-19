# Árboris — estructura simple del repositorio

Este mapa define cómo leer la estructura vigente sin recorrer todo el repositorio.

```text
arboris/
├─ README.md        → qué es Árboris
├─ START_HERE.md    → entrada mínima
├─ AGENTS.md        → routing para IA/agentes
├─ data/            → datos y assets estructurados vigentes
├─ docs/            → documentación vigente + trazabilidad
├─ tools/           → herramientas y motores vigentes
├─ species/         → evidencia fotográfica de terreno
├─ archive/         → prototipos y experimentos históricos
└─ .github/         → CI e instrucciones GitHub/Copilot
```

## Regla operacional

```text
¿Necesito trabajar en el producto actual?
→ raíz + data/ + docs/ + tools/ + species/

¿Necesito reconstruir un experimento anterior?
→ archive/
```

## Autoridad por tipo

```text
producto / estado
→ README.md + docs/ROADMAP.md

ciencia botánica
→ data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx

lectura botánica de máquina
→ data/botanical/

vista completa de una especie
→ data/species/

evidencia fotográfica de terreno
→ species/

arte y personajes
→ data/characters/ + docs/GRAPHIC_DIRECTION.md + docs/ART_STYLE_GUIDE.md

identificación vigente
→ tools/canonical-identification/

histórico / experimental
→ archive/
```

La existencia de una carpeta no la convierte por sí sola en autoridad. Si hay duda, usar `docs/README.md` o `AGENTS.md` como router.
