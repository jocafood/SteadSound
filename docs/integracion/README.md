# Integración de SteadSound

Este directorio define el contrato inicial entre la API de Stead, la interfaz de Santiago, la experiencia de Kata y el motor de sonido de Josué y Juan. Es una propuesta para implementar el MVP; todavía no existen estas rutas ni módulos.

## Decisiones iniciales

| Tema | Decisión |
| --- | --- |
| Despliegue | Web y funciones Python en Vercel, bajo el mismo dominio. |
| Intercambio con la API | HTTP con JSON UTF-8 y campos en `camelCase`. |
| Imágenes | La API devuelve metadatos y una URL; el archivo se descarga por separado. No se envían imágenes en base64 dentro del JSON. |
| Formatos de origen | PNG, JPG/JPEG y TIF/TIFF. El contrato los identifica como `png`, `jpg` y `tif`. |
| Versión de exploración | PNG o JPG RGB de 8 bits por canal. Stead prepara una versión PNG de los TIF y conserva el original para descarga. |
| Catálogo inicial | Pequeño y fijo, con imágenes reales de NASA y sus fuentes verificadas. La búsqueda dinámica queda para una etapa posterior. |
| Identificadores | Cadenas estables definidas por el catálogo, independientes del título y la posición en la lista. |
| Lectura de píxeles | Se realiza en el canvas del navegador, sobre la imagen disponible para exploración. |
| Generación de audio | Se realiza en el navegador con Tone.js. No requiere una llamada a la API por cada toque. |
| Accesibilidad | Cada imagen incluye texto alternativo y una descripción más extensa preparados con Kata. |
| Acceso a píxeles | Usar una imagen del mismo dominio o una fuente con CORS compatible. Si hace falta, Stead implementará una ruta de imagen. |

El detalle y los ejemplos están en [CONTRATO-DATOS.md](CONTRATO-DATOS.md).

## Responsabilidades

- **Stead:** implementar las rutas y validar los metadatos, enlaces de origen y acceso a las imágenes; preparar las versiones de exploración y conservar los originales PNG, JPG o TIF.
- **Santiago:** consumir el catálogo, mostrar la imagen, transformar las coordenadas de pantalla a píxeles y leer RGB en el canvas.
- **Kata:** preparar los textos y acordar con el equipo de audio el significado de las reglas musicales.
- **Josué y Juan:** recibir el píxel y su posición, convertir RGB a parámetros musicales y reproducir el sonido.

## Orden de integración

1. Stead implementa el contrato con una imagen real.
2. Santiago carga la imagen y verifica que puede leer sus píxeles.
3. Josué y Juan conectan el evento de exploración a su motor.
4. Kata y el equipo prueban las instrucciones, la descripción y el resultado sonoro.

Los campos obligatorios y sus tipos deben conservarse durante el MVP. Los cambios incompatibles se documentan aquí y se coordinan con quienes consumen los datos antes de implementarlos. Se pueden añadir campos opcionales sin eliminar ni cambiar los existentes.
