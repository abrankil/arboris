import csv
import os
import time
from pathlib import Path

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


BASE_URL = "https://api.inaturalist.org/v1/observations"

OUTPUT_DIR = Path("inaturalist_dataset")
METADATA_PATH = OUTPUT_DIR / "metadata.csv"

N_OBSERVATIONS = 50

SPECIES = {
    "SP001_peumo": "Cryptocarya alba",
    "SP002_litre": "Lithraea caustica",
    "SP003_bollen": "Kageneckia oblonga",
    "SP004_mitique": "Podanthus mitiqui",
    "SP005_colliguay": "Colliguaja odorifera",
    "SP006_quillay": "Quillaja saponaria",
}

PHOTO_LICENSES = "cc0,cc-by,cc-by-nc"

FIELDNAMES = [
    "species",
    "folder",
    "observation_id",
    "photo_id",
    "filename",
    "license",
    "attribution",
    "inat_url",
    "photo_url",
    "observed_on",
    "place_guess",
    "quality_grade",
    "inat_taxon_name",
]


def make_session():
    session = requests.Session()

    retries = Retry(
        total=5,
        connect=5,
        read=5,
        backoff_factor=2,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
    )

    adapter = HTTPAdapter(max_retries=retries)

    session.mount("https://", adapter)
    session.mount("http://", adapter)

    session.headers.update({
        "User-Agent": "Arboris-BioCLIP-Benchmark/0.1"
    })

    return session


def load_existing_metadata():
    rows = {}

    if not METADATA_PATH.exists():
        return rows

    with METADATA_PATH.open(
        "r",
        newline="",
        encoding="utf-8-sig",
    ) as f:

        reader = csv.DictReader(f)

        for row in reader:
            key = (
                str(row["observation_id"]),
                str(row["photo_id"]),
            )
            rows[key] = row

    return rows


def save_metadata(rows):
    ordered_rows = sorted(
        rows.values(),
        key=lambda r: (
            r["folder"],
            int(r["observation_id"]),
        ),
    )

    with METADATA_PATH.open(
        "w",
        newline="",
        encoding="utf-8-sig",
    ) as f:

        writer = csv.DictWriter(
            f,
            fieldnames=FIELDNAMES,
        )

        writer.writeheader()
        writer.writerows(ordered_rows)


def download_image(session, url, path):
    if path.exists():
        return "existing"

    response = session.get(
        url,
        timeout=60,
    )
    response.raise_for_status()

    temp_path = path.with_suffix(
        path.suffix + ".part"
    )

    with temp_path.open("wb") as f:
        f.write(response.content)

    temp_path.replace(path)

    return "downloaded"


def main():

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    session = make_session()
    metadata = load_existing_metadata()

    print(
        f"Metadata existente: "
        f"{len(metadata)} registros"
    )

    for folder_name, scientific_name in SPECIES.items():

        print("\n" + "=" * 70)
        print(scientific_name)
        print("=" * 70)

        species_dir = OUTPUT_DIR / folder_name

        species_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        params = {
            "taxon_name": scientific_name,
            "quality_grade": "research",
            "photos": "true",
            "photo_license": PHOTO_LICENSES,
            "per_page": N_OBSERVATIONS,
            "order": "desc",
            "order_by": "created_at",
        }

        try:
            response = session.get(
                BASE_URL,
                params=params,
                timeout=60,
            )

            response.raise_for_status()

        except Exception as e:
            print(
                f"ERROR consultando "
                f"{scientific_name}: {e}"
            )
            continue

        observations = (
            response.json().get(
                "results",
                [],
            )
        )

        print(
            f"Observaciones recibidas: "
            f"{len(observations)}"
        )

        processed = 0

        for obs in observations:

            photos = obs.get("photos", [])

            if not photos:
                continue

            # Una fotografía por observación.
            photo = photos[0]

            observation_id = str(obs["id"])
            photo_id = str(photo["id"])

            image_url = photo["url"].replace(
                "/square.",
                "/medium.",
            )

            extension = os.path.splitext(
                image_url.split("?")[0]
            )[1]

            if not extension:
                extension = ".jpg"

            filename = (
                f"obs_{observation_id}"
                f"_photo_{photo_id}"
                f"{extension}"
            )

            filepath = (
                species_dir / filename
            )

            try:
                status = download_image(
                    session,
                    image_url,
                    filepath,
                )

            except Exception as e:
                print(
                    f"ERROR imagen "
                    f"{observation_id}: {e}"
                )
                continue

            taxon = obs.get("taxon") or {}

            row = {
                "species": scientific_name,
                "folder": folder_name,
                "observation_id": observation_id,
                "photo_id": photo_id,
                "filename": filename,
                "license": (
                    photo.get("license_code")
                    or ""
                ),
                "attribution": (
                    photo.get("attribution")
                    or ""
                ),
                "inat_url": (
                    "https://www.inaturalist.org/"
                    f"observations/{observation_id}"
                ),
                "photo_url": image_url,
                "observed_on": (
                    obs.get("observed_on")
                    or ""
                ),
                "place_guess": (
                    obs.get("place_guess")
                    or ""
                ),
                "quality_grade": (
                    obs.get("quality_grade")
                    or ""
                ),
                "inat_taxon_name": (
                    taxon.get("name")
                    or ""
                ),
            }

            metadata[
                (observation_id, photo_id)
            ] = row

            # Guardamos después de cada registro.
            # Una interrupción no destruye el progreso.
            save_metadata(metadata)

            processed += 1

            print(
                f"{processed:02d}/"
                f"{len(observations)} "
                f"{status.upper()} "
                f"{filename}"
            )

            time.sleep(0.15)

    print("\n" + "=" * 70)
    print("DESCARGA / VERIFICACIÓN TERMINADA")
    print("=" * 70)

    print(
        f"Metadata total: "
        f"{len(metadata)} registros"
    )

    print(
        f"Archivo: {METADATA_PATH}"
    )


if __name__ == "__main__":
    main()