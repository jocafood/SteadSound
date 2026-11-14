"""Punto de entrada FastAPI para desarrollo y Vercel."""
import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from starlette.exceptions import HTTPException

from core.catalog import DATA, ImageRecord, image_path, load_catalog
from core.images import MIME

logger = logging.getLogger(__name__)


def create_app(data: Path = DATA) -> FastAPI:
    catalog = load_catalog(data)
    api = FastAPI(title="SteadSound API", version="0.1.0", docs_url="/api/docs", openapi_url="/api/openapi.json", redoc_url=None)

    @api.exception_handler(HTTPException)
    async def http_error(request: Request, exc: HTTPException):
        codes = {404: ("IMAGE_NOT_FOUND", "No se encontró la imagen o ruta solicitada."), 405: ("METHOD_NOT_ALLOWED", "La ruta solo admite GET.")}
        code, message = codes.get(exc.status_code, ("INTERNAL_ERROR", "No se pudo procesar la solicitud."))
        headers = {"Allow": "GET"} if exc.status_code == 405 else None
        return JSONResponse({"error": {"code": code, "message": message}}, status_code=exc.status_code, headers=headers)

    @api.exception_handler(Exception)
    async def unexpected_error(request: Request, exc: Exception):
        logger.exception("Fallo de API", exc_info=exc)
        return JSONResponse({"error": {"code": "INTERNAL_ERROR", "message": "No se pudo procesar la solicitud."}}, status_code=500)

    def find(image_id: str) -> ImageRecord:
        if image_id not in catalog:
            raise HTTPException(404)
        return catalog[image_id]

    @api.get("/api/images")
    def list_images():
        return {"images": [row.model_dump(mode="json") for row in catalog.values()]}

    @api.get("/api/images/{image_id}")
    def get_image(image_id: str):
        return {"image": find(image_id).model_dump(mode="json")}

    def serve(image_id: str, original: bool):
        row = find(image_id)
        path = image_path(data, row, original)
        if not path.is_file():
            raise RuntimeError("Falta un archivo del catálogo")
        fmt = row.originalFormat if original else row.imageFormat
        return FileResponse(path, media_type=MIME[fmt], filename=f"{row.id}.{fmt}" if original else None, headers={"Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff"})

    @api.get("/api/images/{image_id}/file")
    def preview(image_id: str):
        return serve(image_id, False)

    @api.get("/api/images/{image_id}/original")
    def original(image_id: str):
        return serve(image_id, True)

    return api


app = create_app()
