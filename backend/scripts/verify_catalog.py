"""Verifica archivos, metadatos y correspondencia de carpetas del catálogo local."""
import json
from pathlib import Path

from core.catalog import DATA, load_catalog
from scripts.sync_metadata import METADATA_FIELDS


def verify_catalog(data: Path = DATA) -> int:
    catalog = load_catalog(data)
    folders = {p.name for p in (data / "images").iterdir() if p.is_dir()}
    if folders != set(catalog):
        raise ValueError(f"Carpetas fuera del catálogo: {sorted(folders - set(catalog))}; faltantes: {sorted(set(catalog) - folders)}")
    for record in catalog.values():
        metadata_path = data / "images" / record.id / "metadata.json"
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        expected = {key: value for key, value in record.model_dump(mode="json").items() if key in METADATA_FIELDS}
        if metadata != expected:
            raise ValueError(f"{record.id}: metadata.json y catálogo difieren; ejecute python -m scripts.sync_metadata.")
    return len(catalog)


if __name__ == "__main__":
    print(f"Catálogo verificado: {verify_catalog()} imágenes")
