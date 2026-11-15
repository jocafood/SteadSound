"""Preparación local del catálogo. Nunca convierte archivos durante una petición."""
import re
import shutil
import warnings
from pathlib import Path

from PIL import Image, ImageOps

FORMATS = {"PNG": "png", "JPEG": "jpg", "TIFF": "tif"}
EXTENSIONS = {".png": "png", ".jpg": "jpg", ".jpeg": "jpg", ".tif": "tif", ".tiff": "tif"}
MIME = {"png": "image/png", "jpg": "image/jpeg", "tif": "image/tiff"}
MAX_PIXELS = 25_000_000
MAX_BYTES = 50 * 1024 * 1024


def prepare_image(source: Path, output: Path, image_id: str, asset_number: int = 1) -> dict:
    """Acepta imágenes visuales de 8 bits. Datos científicos requieren preparación explícita."""
    if asset_number < 1:
        raise ValueError("El número de archivo debe ser positivo.")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", image_id):
        raise ValueError("El id debe contener minúsculas, números y guiones.")
    if source.stat().st_size > MAX_BYTES:
        raise ValueError("El archivo supera 50 MiB.")
    with warnings.catch_warnings():
        warnings.simplefilter("error", Image.DecompressionBombWarning)
        with Image.open(source) as image:
            original_format = FORMATS.get(image.format)
            if not original_format or EXTENSIONS.get(source.suffix.lower()) != original_format:
                raise ValueError("Formato no admitido o extensión distinta del contenido.")
            if image.width * image.height > MAX_PIXELS:
                raise ValueError("La imagen supera 25 millones de píxeles.")
            if getattr(image, "n_frames", 1) != 1 or image.mode not in {"RGB", "RGBA", "L", "LA", "P"}:
                raise ValueError("Se requiere una imagen de una página, visual y de 8 bits; prepare explícitamente las bandas y rangos científicos.")
            image.load()
            rgb = ImageOps.exif_transpose(image).convert("RGBA")
            background = Image.new("RGBA", rgb.size, (0, 0, 0, 255))
            background.alpha_composite(rgb)
            rgb = background.convert("RGB")
    folder = output / image_id
    if folder.exists() and any(path.name != "metadata.json" for path in folder.iterdir()):
        raise ValueError("La carpeta ya contiene archivos; use otro id.")
    folder.mkdir(parents=True, exist_ok=True)
    preview_format = "jpg" if original_format == "jpg" else "png"
    original = folder / f"original_{asset_number:03d}.{original_format}"
    preview = folder / f"exploration_{asset_number:03d}.{preview_format}"
    try:
        shutil.copyfile(source, original)
        rgb.save(preview, format="JPEG" if preview_format == "jpg" else "PNG")
    except Exception:
        original.unlink(missing_ok=True)
        preview.unlink(missing_ok=True)
        if not any(folder.iterdir()):
            folder.rmdir()
        raise
    return {
        "id": image_id,
        "assetNumber": asset_number,
        "imageUrl": f"/api/images/{image_id}/file",
        "imageFormat": preview_format,
        "originalUrl": f"/api/images/{image_id}/original",
        "originalFormat": original_format,
        "width": rgb.width,
        "height": rgb.height,
        "processingNotes": "Imagen visual de una página y 8 bits por canal; orientación aplicada, conversión a RGB y alfa compuesto sobre negro; sin reducción de dimensiones. Versión de exploración recodificada; original conservado sin cambios.",
    }
