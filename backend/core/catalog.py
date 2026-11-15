"""Carga y validación del catálogo curado."""
import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator
from PIL import Image

from core.images import FORMATS

DATA = Path(__file__).resolve().parent.parent / "data"


class ImageRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    assetNumber: int = Field(gt=0)
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    altText: str = Field(min_length=1)
    imageUrl: str
    imageFormat: Literal["png", "jpg"]
    originalUrl: str
    originalFormat: Literal["png", "jpg", "tif"]
    sourceUrl: HttpUrl
    credit: str = Field(min_length=1)
    category: Literal["earth", "weather", "space"]
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    processingNotes: str = Field(min_length=1)

    @model_validator(mode="after")
    def local_routes(self):
        if self.imageUrl != f"/api/images/{self.id}/file" or self.originalUrl != f"/api/images/{self.id}/original":
            raise ValueError("Las URLs deben apuntar a las rutas del catálogo local.")
        if self.sourceUrl.scheme != "https":
            raise ValueError("La fuente debe usar HTTPS.")
        return self


def load_catalog(data: Path = DATA) -> dict[str, ImageRecord]:
    records = [ImageRecord.model_validate(row) for row in json.loads((data / "catalog.json").read_text())]
    if len({row.id for row in records}) != len(records):
        raise ValueError("Identificadores duplicados en el catálogo.")
    if len({row.assetNumber for row in records}) != len(records):
        raise ValueError("Números de archivo duplicados en el catálogo.")
    for row in records:
        for original in (False, True):
            path = image_path(data, row, original)
            with Image.open(path) as image:
                expected = row.originalFormat if original else row.imageFormat
                if FORMATS.get(image.format) != expected:
                    raise ValueError(f"Formato incorrecto: {path.name}")
                if not original and (image.size != (row.width, row.height) or image.mode != "RGB"):
                    raise ValueError("La versión de exploración no coincide con sus metadatos.")
                image.verify()
    return {row.id: row for row in records}


def image_path(data: Path, row: ImageRecord, original: bool) -> Path:
    name = f"original_{row.assetNumber:03d}.{row.originalFormat}" if original else f"exploration_{row.assetNumber:03d}.{row.imageFormat}"
    return data / "images" / row.id / name
