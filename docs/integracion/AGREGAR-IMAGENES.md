# Agregar imágenes al catálogo

Cada imagen se organiza en una carpeta cuyo nombre coincide con su `id`:

```text
backend/data/
├── catalog.json
└── images/
    └── blue-marble-2002/
        ├── metadata.json
        ├── original_001.jpg
        └── exploration_001.jpg
```

`metadata.json` contiene los textos preparados por el equipo. `catalog.json` es el índice generado para la API e incluye los campos técnicos. El importador conserva el original sin alterar sus bytes y genera la versión para explorar. Las URLs públicas usan el ID y no dependen del nombre físico del archivo.

## 1. Elegir el archivo y su fuente

Descargar un PNG, JPG/JPEG o TIF/TIFF y guardar el enlace a la página que explica la imagen y sus créditos. Mantener el archivo descargado fuera de `data/images/{id}/`, por ejemplo en Descargas.

Se admiten imágenes visuales de una página y 8 bits, hasta 50 MiB y 25 millones de píxeles. Los TIFF con múltiples páginas o datos científicos de mayor profundidad necesitan preparación y decisiones explícitas con Kata; el importador los rechaza. Los TIF admitidos se convierten a PNG para explorar. Las transparencias se componen sobre negro.

## 2. Crear la carpeta y los metadatos

Elegir un ID estable y nuevo, con minúsculas, números y guiones; por ejemplo `nubes-pacifico`. Crear `backend/data/images/nubes-pacifico/metadata.json`. La carpeta debe contener únicamente ese JSON antes de importar.

Desde la raíz del repositorio:

```bash
mkdir -p backend/data/images/nubes-pacifico
```

Crear el archivo con esta estructura, reemplazando los textos y el enlace por información real de la fuente. El ejemplo no es una fuente NASA verificada:

```json
{
  "id": "nubes-pacifico",
  "title": "Título de la imagen",
  "description": "Descripción accesible y contexto documentado en la fuente.",
  "altText": "Descripción visual breve.",
  "sourceUrl": "https://science.nasa.gov/pagina-de-la-imagen/",
  "credit": "Crédito exacto indicado en la fuente",
  "category": "weather"
}
```

El ID del JSON debe coincidir con el nombre de la carpeta. `category` admite `earth`, `weather` o `space`. No añadir dimensiones, formatos, URLs de archivos ni números: los genera el importador. No atribuir significado científico a los colores sin respaldo en la fuente.

## 3. Incorporar la imagen

Con el entorno Python del backend activado, ejecutar desde `backend/`:

```bash
python -m scripts.add_image /ruta/descargas/imagen.tif \
  --metadata data/images/nubes-pacifico/metadata.json
```

Si todavía no se preparó el entorno, seguir las instrucciones del [README del backend](../../backend/README.md). Este comando se ejecuta en el equipo, no dentro del contenedor de API, para conservar los cambios en el repositorio.

El importador genera `original_NNN.ext` y `exploration_NNN.ext`, conserva `metadata.json` en la misma carpeta y añade el registro a `data/catalog.json`. Asigna el siguiente número disponible después del mayor del catálogo: `001`, `002`, etc. Ambas versiones comparten número. No se renumeran las imágenes existentes ni se reemplaza un ID ya publicado. No ejecutar importaciones simultáneas.

Si el ID ya existe, no borrar sus archivos para volver a importar. La edición de textos de una imagen publicada todavía no tiene un comando dedicado: actualizar `metadata.json` y los mismos campos de texto de su registro en `catalog.json`, conservando ID y campos técnicos, y ejecutar las pruebas.

## 4. Reconstruir y verificar

Desde `backend/`:

```bash
python -m pytest -q
docker compose up --build -d
```

Para ejecutar las pruebas con Docker se puede usar `docker compose --profile test run --build --rm tests`.

En `http://localhost:8000/api/docs`, comprobar que aparece la imagen en `GET /api/images`, consultar su ID y abrir las rutas `/api/images/{id}/file` y `/api/images/{id}/original`. Verificar descripción, dimensiones, visualización y descarga.

Revisar y subir juntos al repositorio la carpeta completa de la imagen y `catalog.json`. Si hay un conflicto de números al combinar ramas, coordinar la asignación de un número único y actualizar los dos nombres de archivo y `assetNumber` del registro antes de ejecutar las pruebas.
