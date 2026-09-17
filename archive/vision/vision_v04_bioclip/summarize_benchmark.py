import pandas as pd
from pathlib import Path

INPUT = Path("benchmark/bioclip_inaturalist_results.csv")
OUTPUT = Path("benchmark/benchmark_summary.csv")

df = pd.read_csv(INPUT)

rows = []

# Resumen global
rows.append({
    "group": "TOTAL",
    "n": len(df),
    "top1": df["correct_top1"].mean(),
    "top2": (df["true_species_rank"] <= 2).mean(),
    "top3": (df["true_species_rank"] <= 3).mean(),
    "mean_true_rank": df["true_species_rank"].mean()
})

# Resumen por especie
for species, group in df.groupby("true_species"):
    rows.append({
        "group": species,
        "n": len(group),
        "top1": group["correct_top1"].mean(),
        "top2": (group["true_species_rank"] <= 2).mean(),
        "top3": (group["true_species_rank"] <= 3).mean(),
        "mean_true_rank": group["true_species_rank"].mean()
    })

summary = pd.DataFrame(rows)

summary.to_csv(
    OUTPUT,
    index=False,
    encoding="utf-8-sig"
)

print("\nRESUMEN BENCHMARK BIOCLIP\n")
print(summary.to_string(index=False))

print(f"\nGuardado en: {OUTPUT}")