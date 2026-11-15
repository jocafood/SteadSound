"""Incorpora un archivo local y sus metadatos al catálogo. Ejecutar como módulo."""
import argparse
import json
from pathlib import Path

from core.catalog import DATA, ImageRecord, load_catalog
from core.images import prepare_image


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", type=Path)
    parser.add_argument("--metadata", required=True, type=Path, help="JSON con id, title, description, altText, sourceUrl, credit y category")
    args = parser.parse_args()
    metadata = json.loads(args.metadata.read_text())
    catalog_path = DATA / "catalog.json"
    rows = json.loads(catalog_path.read_text())
    asset_number = max((row["assetNumber"] for row in rows), default=0) + 1
    # Validar los textos antes de crear archivos.
    image_id = metadata["id"]
    provisional = {**metadata, "assetNumber": asset_number, "imageUrl": f"/api/images/{image_id}/file", "imageFormat": "png", "originalUrl": f"/api/images/{image_id}/original", "originalFormat": "png", "width": 1, "height": 1, "processingNotes": "Pendiente"}
    ImageRecord.model_validate(provisional)
    if any(row["id"] == image_id for row in rows):
        parser.error("El identificador ya pertenece al catálogo.")
    prepared = prepare_image(args.file, DATA / "images", image_id, asset_number)
    record = ImageRecord.model_validate({**metadata, **prepared})
    metadata_path = DATA / "images" / image_id / "metadata.json"
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    rows.append(record.model_dump(mode="json"))
    temp = catalog_path.with_suffix(".tmp")
    temp.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n")
    temp.replace(catalog_path)
    load_catalog()
    print(f"Imagen incorporada: {image_id}")


if __name__ == "__main__":
    main()
