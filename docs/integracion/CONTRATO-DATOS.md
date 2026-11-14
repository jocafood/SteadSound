# Contrato de datos del MVP

Estado: backend inicial implementado con catálogo local y rutas de exploración y descarga. El contrato con el motor de audio sigue pendiente de integración. Los identificadores, textos y URLs de los ejemplos son ilustrativos; no constituyen un catálogo NASA verificado.

## Convenciones

- Rutas relativas al dominio de la web, con prefijo `/api`.
- Respuestas JSON: `Content-Type: application/json; charset=utf-8`.
- Nombres de campos en `camelCase`; identificadores de tipo cadena.
- Textos iniciales en español. Las URLs externas deben usar HTTPS; las imágenes servidas por el proyecto pueden usar rutas relativas al dominio.
- Los campos indicados son obligatorios salvo que se marquen como opcionales. Un campo opcional ausente se omite; no se sustituye por una cadena vacía.
- Las rutas GET son públicas y no necesitan cuerpo ni autenticación en este MVP.

## Objeto de imagen

| Campo | Tipo | Significado |
| --- | --- | --- |
| `id` | string | Identificador estable, por ejemplo `earth-demo-01`. |
| `title` | string | Título visible. |
| `description` | string | Explicación accesible de lo que muestra la imagen y su contexto. |
| `altText` | string | Texto alternativo breve para el elemento de imagen. |
| `imageUrl` | string | URL del archivo que se dibuja en el canvas y se usa para explorar. Debe permitir leer píxeles. |
| `imageFormat` | string | Formato de exploración: `png` o `jpg`. |
| `originalUrl` | string | URL para descargar el archivo original, sin alterar. |
| `originalFormat` | string | Formato original: `png`, `jpg` o `tif`. |
| `sourceUrl` | string | Enlace a la página original que documenta la imagen. |
| `credit` | string | Crédito según la fuente original. |
| `category` | string | `earth`, `weather` o `space`. El MVP prioriza `earth` y `weather`. |
| `width` | integer | Ancho en píxeles del archivo de `imageUrl`, mayor que cero. |
| `height` | integer | Alto en píxeles del archivo de `imageUrl`, mayor que cero. |
| `processingNotes` | string | Opcional salvo que haya transformación: explica cómo se preparó la versión de exploración. |

`description` no debe atribuir significado científico a un color sin respaldo en la fuente. Si se usa una versión reducida de la imagen, sus dimensiones son las de esa versión; el navegador usa `naturalWidth` y `naturalHeight` del archivo cargado como referencia efectiva para el canvas.

## Formatos y preparación de imágenes

Se admiten archivos de origen **PNG, JPG y TIF**, incluyendo las extensiones equivalentes `.jpeg` y `.tiff`, sin distinguir mayúsculas. En JSON se usan únicamente `png`, `jpg` y `tif`.

| Origen | MIME del original | Versión de exploración (`imageUrl`) |
| --- | --- | --- |
| PNG | `image/png` | PNG RGB de 8 bits por canal. |
| JPG / JPEG | `image/jpeg` | JPG RGB de 8 bits por canal. |
| TIF / TIFF | `image/tiff` | PNG RGB de 8 bits por canal preparado por Stead. |

La interfaz siempre explora `imageUrl` como PNG o JPG; el contrato no requiere decodificar TIF en el navegador. `originalUrl` permite descargar el original y puede coincidir con `imageUrl` cuando no se necesita transformación. Las dimensiones `width` y `height` corresponden exclusivamente a la versión de exploración.

Stead valida el contenido decodificado, además de la extensión y el MIME. Las versiones se preparan al incorporar la imagen al catálogo, evitando convertir un TIF en cada toque o petición. Solo se publican imágenes con una versión de exploración validada.

La preparación produce RGB de 8 bits por canal, con orientación aplicada y sin transparencia; si hay alfa, se compone sobre fondo negro antes de publicar. Para TIF de varias páginas, bandas científicas, valores de más de 8 bits o datos geoespaciales, Stead y Kata deben registrar en `processingNotes` la página y bandas elegidas, la asignación a RGB, el tratamiento de valores sin datos, el rango de normalización y cualquier reducción de tamaño que corresponda. No se seleccionan bandas ni escalas científicas de forma implícita. La sonificación utiliza los colores de la versión preparada, no los valores científicos originales.

`processingNotes` es una cadena opcional para explicar las transformaciones aplicadas; es obligatoria si el original se modifica para explorar, incluyendo toda conversión TIF → PNG. El original se conserva sin cambios. El MVP usa un catálogo curado, sin ruta de subida de archivos.

## Listar imágenes

`GET /api/images` → `200 OK`

```json
{
  "images": [
    {
      "id": "earth-demo-01",
      "title": "Imagen terrestre de ejemplo",
      "description": "Descripción pendiente de completar con la imagen elegida y su fuente.",
      "altText": "Imagen terrestre de demostración.",
      "imageUrl": "/api/images/earth-demo-01/file",
      "imageFormat": "png",
      "originalUrl": "/api/images/earth-demo-01/original",
      "originalFormat": "tif",
      "processingNotes": "Ejemplo: TIF de una página, RGB de 8 bits, convertido a PNG sin cambiar las dimensiones.",
      "sourceUrl": "https://www.nasa.gov/",
      "credit": "Crédito pendiente de verificar en la fuente original",
      "category": "earth",
      "width": 1024,
      "height": 768
    }
  ]
}
```

La lista contiene objetos completos para que la interfaz pueda mostrar y seleccionar imágenes con una sola petición. Un catálogo vacío devuelve `200` con `{"images": []}`. No hay paginación en el catálogo pequeño del MVP.

## Obtener una imagen por identificador

`GET /api/images/{id}` → `200 OK`

Devuelve `{"image": {...}}`, donde `image` tiene exactamente la misma estructura que cada elemento de `images`. Un identificador desconocido devuelve `404` con el formato de error definido abajo.

## Descargar el archivo de imagen

El navegador solicita directamente `imageUrl`. La respuesta contiene bytes de imagen, con `Content-Type: image/jpeg` o `image/png`, según `imageFormat`; no es JSON.

Si la fuente externa permite CORS, se puede utilizar su URL y establecer `crossOrigin = "anonymous"` antes de asignar `src` en el navegador. La lectura del canvas debe probarse con el archivo real.

Si se necesita servir el archivo desde la API, se usará `GET /api/images/{id}/file`. Esta ruta resolverá únicamente identificadores del catálogo con destinos previamente validados; no aceptará una URL arbitraria del cliente. Esta ruta está implementada para los archivos locales del catálogo. `imageUrl` apunta a ella y sus errores siguen el formato JSON común.

Cuando el proyecto sirva el original, usará `GET /api/images/{id}/original`, con el MIME de la tabla y `Content-Disposition: attachment` con un nombre de archivo y extensión correspondientes. Esta ruta entrega el original sin convertirlo; `GET /api/images/{id}/file` entrega la versión de exploración. Ambas resuelven únicamente identificadores del catálogo. `originalUrl` también puede ser un enlace HTTPS directo al archivo de origen.

## Errores de la API

```json
{
  "error": {
    "code": "IMAGE_NOT_FOUND",
    "message": "No se encontró la imagen solicitada."
  }
}
```

| HTTP | `code` | Uso |
| --- | --- | --- |
| 404 | `IMAGE_NOT_FOUND` | El identificador no pertenece al catálogo. |
| 405 | `METHOD_NOT_ALLOWED` | La ruta existe pero no admite ese método. Incluir `Allow: GET`. |
| 502 | `IMAGE_SOURCE_ERROR` | La fuente externa falla o devuelve un archivo no válido. |
| 504 | `IMAGE_SOURCE_TIMEOUT` | La fuente externa supera el tiempo de espera. |
| 500 | `INTERNAL_ERROR` | Fallo inesperado del backend. |

La interfaz decide qué mostrar usando el estado HTTP y `code`; `message` ofrece una explicación legible. El backend no devuelve claves, trazas internas ni detalles sensibles. Los errores de fuente corresponden a rutas que efectivamente consulten esa fuente.

## Interfaz → motor de sonificación

Este objeto se pasa entre módulos JavaScript dentro del navegador. No se envía al backend. La firma concreta del módulo se acordará con Josué y Juan; los datos de entrada propuestos son:

```json
{
  "imageId": "earth-demo-01",
  "position": {
    "x": 512,
    "y": 192,
    "normalizedX": 0.5005,
    "normalizedY": 0.2503
  },
  "color": {
    "r": 120,
    "g": 180,
    "b": 220
  }
}
```

- `x` e `y`: enteros del píxel del archivo cargado, con origen `(0, 0)` arriba a la izquierda. Rangos: `0..width - 1` y `0..height - 1`.
- `normalizedX` y `normalizedY`: valores entre `0` y `1`, calculados como `x / (width - 1)` e `y / (height - 1)`. Si una dimensión vale `1`, su coordenada normalizada es `0`.
- `r`, `g` y `b`: enteros entre `0` y `255`, leídos del píxel. La versión de exploración es opaca y RGB de 8 bits por canal, incluso cuando el original es TIF o contiene transparencia.
- Santiago debe descontar márgenes o bandas de la imagen al calcular la posición; un toque fuera de la imagen no genera un evento de exploración.
- El motor calcula HSL y los parámetros de audio a partir de RGB. Las reglas de escala, timbre, duración y volumen se acuerdan con Kata y se documentan al implementarlas.

El MVP empieza con un píxel por interacción. Promediar una región, reproducir durante un arrastre o añadir otros modos requiere acordar su comportamiento con el equipo de audio.

## Criterios para verificar la primera integración

1. La lista y el detalle devuelven el mismo objeto para un mismo `id`.
2. Un identificador inexistente devuelve el error `404` documentado.
3. `imageUrl` carga una imagen y el canvas permite leer sus píxeles.
4. Un toque en cada esquina produce coordenadas válidas dentro de las dimensiones de la imagen.
5. El motor recibe RGB en el rango acordado y puede reproducir sonido después de la interacción que habilita el audio del navegador.
6. La interfaz presenta el título, el texto alternativo, la descripción y el crédito de la imagen.
7. Se comprueba al menos un archivo de cada formato de origen: PNG, JPG y TIF. El TIF se explora mediante su PNG preparado.
8. `imageFormat` y `originalFormat` coinciden con los archivos y MIME entregados; el original descargado conserva sus bytes.
9. Las transformaciones quedan descritas en `processingNotes` y el RGB que recibe el motor corresponde a la versión de exploración.

## Alcance de la implementación inicial

El catálogo actual usa archivos locales y URLs relativas para exploración y descarga. `processingNotes` es obligatorio en este backend porque todas las versiones se preparan y recodifican. No hay consultas externas durante las peticiones, por lo que los errores 502 y 504 quedan reservados para futuras fuentes remotas. Los archivos se validan al cargar la aplicación; un catálogo inválido impide el arranque. El preparador admite imágenes visuales de una página y 8 bits y rechaza TIFF científicos que necesiten decisiones explícitas sobre bandas, páginas o normalización.
