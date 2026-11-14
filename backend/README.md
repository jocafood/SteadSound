# SteadSound

Proyecto de sonificación de imágenes NASA para personas ciegas o con baja visión. La API Python entrega imágenes y metadatos; la interfaz y Tone.js realizarán la exploración y el audio en el navegador.

Esta carpeta implementa la parte inicial de Stead: catálogo local curado, metadatos y entrega de archivos PNG, JPG y TIF. Todavía no incluye interfaz ni motor de sonido.

## Ejecutar con Docker (recomendado para el equipo)

Instalar Docker con Compose. Desde la raíz del repositorio:

```bash
cd backend
docker compose up --build -d
docker compose ps
```

Abrir `http://localhost:8000/api/docs`. Consultar logs con `docker compose logs -f api` y detener con `docker compose down`. Si el puerto está ocupado: `BACKEND_PORT=8001 docker compose up --build -d`.

El contenedor incluye las dependencias y el catálogo y ejecuta la API con un usuario sin privilegios. No necesita Python instalado en el equipo. Después de cambiar código o catálogo, reconstruir con `docker compose up --build -d`.

Pruebas dentro de Docker:

```bash
docker compose --profile test run --build --rm tests
```

Para incorporar imágenes se puede usar el entorno Python descrito abajo y luego reconstruir el contenedor. No hay volúmenes de escritura ni subidas HTTP. Docker facilita el trabajo local; Vercel seguirá usando `app.py` y las dependencias Python, sin ejecutar este Dockerfile.

## Ejecutar el backend

Requiere Python 3.12 o posterior.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
python -m uvicorn app:app --reload
```

Abrir `http://127.0.0.1:8000/api/docs` para explorar y probar las rutas. No se necesita clave NASA ni variables de entorno.

| Ruta GET | Respuesta |
| --- | --- |
| `/api/images` | Catálogo completo en JSON. |
| `/api/images/{id}` | Metadatos de una imagen. |
| `/api/images/{id}/file` | PNG o JPG preparado para el canvas. |
| `/api/images/{id}/original` | Descarga del original PNG, JPG o TIF sin modificar. |

Ejemplo disponible: `/api/images/blue-marble-2002`. Los archivos se sirven desde el mismo dominio, sin llamadas externas en tiempo de ejecución. Para integrar la interfaz, usar ese mismo origen o un proxy de desarrollo hacia `/api`; no se habilita CORS general para dominios externos.

## Incorporar imágenes

Crear `backend/data/images/{id}/metadata.json`. Puedes copiar `data/images/blue-marble-2002/metadata.json` y cambiar sus datos. La carpeta debe contener solo `metadata.json` antes de importar; el archivo de imagen de entrada se mantiene fuera de esa carpeta. No edites `catalog.json` a mano. El archivo debe contener `id`, `title`, `description`, `altText`, `sourceUrl`, `credit` y `category`, según el [contrato](../docs/integracion/CONTRATO-DATOS.md). Luego ejecutar desde `backend/`:

```bash
python -m scripts.add_image /ruta/imagen.tif --metadata data/images/mi-imagen/metadata.json
```

El comando conserva los metadatos en la misma carpeta de la imagen, valida los textos, prepara la versión de exploración, conserva el original y actualiza `data/catalog.json`. Usar identificadores nuevos; no ejecutar incorporaciones simultáneas. Revisar los archivos generados antes de subirlos al repositorio.

Se admiten PNG, JPG/JPEG y TIF/TIFF visuales de una página y 8 bits. Se aplican orientación y fondo negro a transparencias. TIF produce PNG; JPG produce una copia JPG recodificada. El original siempre conserva sus bytes. Límite inicial: 50 MiB y 25 millones de píxeles por imagen. Las imágenes científicas con múltiples páginas, bandas o profundidad superior requieren preparación explícita con Kata; el comando las rechaza en lugar de elegir una interpretación. Los originales grandes requieren almacenamiento externo en una etapa posterior.

## Pruebas

```bash
python -m pytest -q
```

Las pruebas verifican contrato HTTP, errores, descargas, conservación de originales, conversión de los tres formatos, transparencia y rechazo de TIF no compatibles. Usan imágenes sintéticas para PNG/TIF y la imagen NASA incluida para la integración del catálogo. La lectura real del canvas y la reproducción de audio quedan pendientes de la interfaz.

## Vercel

`app.py` exporta la aplicación FastAPI y `vercel.json` selecciona ese framework e incluye `data/**` en la función. Importar el repositorio usando `backend/` como directorio raíz del proyecto. Las dependencias de producción están en `requirements.txt`. No se requiere comando de compilación ni conversión durante el despliegue. Configuración basada en la [documentación de FastAPI en Vercel](https://vercel.com/docs/frameworks/backend/fastapi).

El despliegue remoto aún debe validarse en la cuenta del equipo. Cuando se integre el frontend, se debe ajustar la configuración conjunta según su estructura.

## Fuente NASA inicial

[Blue Marble 2002 — NASA Science](https://science.nasa.gov/resource/blue-marble-2002/), crédito: NASA's Earth Observatory. La página describe una composición de datos MODIS de Terra recogidos durante cuatro meses. El catálogo incluye una copia JPG obtenida del [servicio de imágenes NASA](https://assets.science.nasa.gov/dynamicimage/assets/science/psd/solar/2023/09/1/1-bluemarble_west-1.jpg?w=1024&fit=clip). “Original” significa el archivo descargado de esa URL antes de nuestro procesamiento, no el producto científico de máxima resolución. Los textos iniciales deben revisarse con Kata.

## Equipo e integración

Stead: backend y datos. Santiago: interfaz y canvas. Kata: experiencia, textos y decisiones creativas. Josué y Juan: motor de sonificación.

Ver [decisiones de integración](../docs/integracion/README.md) y [consideraciones del proyecto](../docs/CONSIDERACIONES-ACCION.md).

Los archivos generados siguen `original_NNN.ext` y `exploration_NNN.ext`, dentro de `data/images/{id}/`. El número es compartido por ambas versiones, único en el catálogo y asignado automáticamente como el mayor existente más uno: `001`, `002`, etc. No se renumeran imágenes existentes. `assetNumber` registra ese número en el catálogo; las URLs públicas siguen usando el `id`.

Guía paso a paso: [Agregar imágenes](../docs/integracion/AGREGAR-IMAGENES.md).
