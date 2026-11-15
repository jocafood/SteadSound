# Consideraciones:

- Se usara Vercel en lugar de GitHub Pages.

Perfecto. 
Distribución propuesta
Integrante	Responsabilidad principal	Qué entrega
Santiago	Interfaz web	Página adaptable a computadora y tablet; catálogo o selector de imágenes; visualización en pantalla; controles grandes; interacción con clic y toque; captura de coordenadas en el canvas; accesibilidad básica, como etiquetas para lector de pantalla y navegación por teclado.
Steadman	Backend e integración técnica	API Python en Vercel para obtener el catálogo y los metadatos de imágenes NASA; normalización de la respuesta; manejo de errores; y, si hace falta, una ruta para servir imágenes que el navegador no pueda leer directamente. Define junto con Santiago el formato de datos entre frontend y API.
Kata	Experiencia creativa y diseño de la sonificación	Define cómo se siente y se entiende la experiencia: recorrido del usuario, selección y descripción de imágenes, criterios para que los sonidos sean agradables y comprensibles, y decisiones artísticas del mapeo de color a música. Apoya a Santiago en la presentación visual y la accesibilidad, y a Josué y Juan en las decisiones del sonido.
Josué y Juan	Motor de sonificación	Implementan la conversión de los datos del píxel a parámetros musicales y la reproducción con Tone.js. Empiezan con píxeles de prueba y luego conectan su módulo con las imágenes y los eventos del frontend.


Así Kata tiene una responsabilidad concreta que aprovecha su versatilidad creativa, pero no queda como apoyo indefinido ni duplica el trabajo de Santiago o de quienes implementan el audio.
Cómo quedaría el flujo
1. Vercel sirve la página construida por Santiago.
2. La página solicita las imágenes disponibles al backend de Steadman, si usan un catálogo dinámico.
3. Santiago muestra la imagen y registra el toque o clic. El navegador calcula la posición y lee el color del píxel con el canvas.
4. El módulo de Josué y Juan recibe ese color y aplica la regla musical acordada con Kata: tono, timbre, duración u otros parámetros.
5. Tone.js reproduce el sonido directamente en el navegador.
La idea clave es que el sonido no tiene que viajar desde el backend hasta la página como un archivo cada vez que alguien toca la imagen. El backend puede encargarse de encontrar o entregar imágenes y datos; el navegador puede leer el píxel y reproducir el sonido. Esto mantiene la interacción táctil más directa.

Hay una condición técnica importante: si la imagen viene de otro dominio, el navegador podría impedir que el canvas lea sus píxeles. En ese caso, el servidor de imágenes debe permitir CORS o Steadman puede crear una ruta de backend que entregue la imagen de forma compatible. 
Qué debería hacer Steadman específicamente
Su parte no sería “controlar todo el sistema”. Sería ser dueño de la API y de la integración con las fuentes de datos:
- Crear rutas como GET /api/images para listar imágenes y GET /api/images/{id} para obtener una imagen o sus metadatos.
- Mantener las llamadas a las fuentes NASA fuera de la lógica visual.
- Entregar una respuesta acordada con Santiago, por ejemplo: identificador, título, descripción, URL y fuente de la imagen.
- Resolver el acceso a píxeles si una imagen externa bloquea el uso del canvas.
- Configurar las variables de entorno que requiera la API y apoyar el despliegue en Vercel.
Como Vercel ejecuta el código Python como funciones del lado servidor, Steadman puede desarrollar esa API allí; no sería un servidor Python permanente que queda corriendo. 
Prioridades del equipo
Para que el alcance sea viable, empezaría con este orden:
1. MVP: una imagen, toque o clic sobre una región y sonido reproducible.
2. Integración: imágenes NASA reales, descripciones y acceso confiable a sus píxeles.
3. Accesibilidad y calidad: controles claros, lector de pantalla, pruebas en tablet y ajuste musical.
4. Extras si queda tiempo: comando de voz, playlist amplia, galería para compartir y funciones sociales.
También dejaría como contenido principal imágenes de observación terrestre o meteorológica, porque el reto descrito en el plan es The Earth Information Jukebox. Hubble y Roman pueden quedar como una categoría adicional; así la propuesta conserva la idea espacial del equipo sin desplazar el foco terrestre del reto. 

En resumen: Santiago construye la interacción; Steadman conecta y sirve los datos; Kata define la experiencia y las decisiones creativas; Josué y Juan implementan el audio. Vercel aloja la web y las funciones Python que realmente necesiten.