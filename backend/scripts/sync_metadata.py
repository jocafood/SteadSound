"""Sincroniza los textos de metadata.json con el catálogo sin modificar archivos de imagen."""
import json
from pathlib import Path

from core.catalog import DATA, ImageRecord, load_catalog

METADATA_FIELDS = {"id", "title", "description", "altText", "sourceUrl", "credit", "category"}


def sync_metadata(data: Path = DATA) -> int:
    # Comprobar archivos y formatos antes de tocar el índice.
    catalog = load_catalog(data)
    rows = []
    for record in catalog.values():
        path = data / "images" / record.id / "metadata.json"
        metadata = json.loads(path.read_text(encoding="utf-8"))
        if set(metadata) != METADATA_FIELDS:
            raise ValueError(f"{path}: se requieren únicamente los campos {sorted(METADATA_FIELDS)}")
        if metadata["id"] != record.id:
            raise ValueError(f"{path}: el id no coincide con la carpeta y el catálogo.")
        updated = ImageRecord.model_validate({**record.model_dump(mode="json"), **metadata})
        rows.append(updated.model_dump(mode="json"))
    # Validar todos los metadatos antes de reemplazar el catálogo.
    destination = data / "catalog.json"
    temporary = destination.with_suffix(".tmp")
    temporary.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(destination)
    return len(rows)


if __name__ == "__main__":
    print(f"Metadatos sincronizados: {sync_metadata()}")
