# Conexión UI, backend y motor de sonido

La interfaz sencilla en `index.html` y `frontend/main.js` prueba el catálogo y el sonido reales. Santiago puede sustituir el HTML y el CSS usando los módulos de conexión existentes.

## Ejecutar todo con Docker

Desde la raíz del repositorio:

```bash
docker compose up --build -d
```

Abrir `http://localhost:8080`. Nginx sirve la interfaz compilada y reenvía `/api` al backend; la imagen y el canvas permanecen en el mismo origen. El servicio `api` conserva la configuración y el puerto 8000 del Compose anterior. Evitar ejecutar dos proyectos diferentes sobre ese puerto. Detener el conjunto con `docker compose down` desde la raíz.

## Desarrollo de la UI

Con el backend encendido en el puerto 8000, desde la raíz:

```bash
npm ci
npm run dev
```

Abrir `http://localhost:5173`. Vite reenvía `/api` a `http://127.0.0.1:8000`. Para otro puerto del backend: `API_PROXY_TARGET=http://127.0.0.1:8001 npm run dev`. La compilación se realiza con `npm run build`; `npm run preview` permite probarla localmente con el mismo proxy. Estos proxies son para desarrollo y prueba; Vercel aún necesita configurar la publicación conjunta.

## Conexiones reutilizables

- `frontend/api.js`: `obtenerImagenes({ signal })` obtiene los objetos del catálogo.
- `frontend/explorer.js`: `ImageSoundExplorer` conecta un canvas a una imagen y al sonido sin generar controles ni HTML.
- `frontend/pixels.js`: transforma coordenadas CSS a píxeles del archivo y genera el objeto del contrato.
- `frontend/color.js`: funciones puras del mapeo RGB a tono y frecuencia.
- `sound.js`: motor Tone.js importado desde la dependencia instalada, sin CDN. Expone `iniciarAudio()`, `reproducirSonido(sample)`, `detenerAudio()` y `audioActivo()`.

Ejemplo para una futura UI:

```js
import { ImageSoundExplorer } from './frontend/explorer.js';

const explorer = new ImageSoundExplorer(document.querySelector('canvas'));
const images = await explorer.list();
await explorer.load(images[0]);

// Conectar a controles reales; el inicio debe ocurrir en un gesto del usuario.
activateButton.addEventListener('click', () => explorer.start());
stopButton.addEventListener('click', () => explorer.stop());
canvas.addEventListener('pointerdown', event => {
  explorer.point(event.clientX, event.clientY);
});
explorer.addEventListener('sample', event => {
  const { sample, sound } = event.detail;
  // sample tiene imageId, position y color; sound tiene hue y frequency,
  // o null si el audio está desactivado.
});
```

`load(record)` usa dimensiones naturales y descarta cargas anteriores si se cambia rápidamente de selección. Emite `imagechange` y `status`. `sample(x, y)` lee y reproduce un píxel; `point(clientX, clientY)` transforma coordenadas; `move(dx, dy)` limita el movimiento al área de imagen. `dispose()` invalida cargas pendientes y detiene el sonido. La UI es responsable de retirar sus propios listeners al desmontarse.

El canvas debe tener proporción natural y no tener bordes ni padding: el cálculo usa su rectángulo CSS completo. Si la UI final usa bandas vacías con `object-fit`, debe descontarlas antes de llamar a `sample` o mantener el canvas ajustado al tamaño visible de la imagen.

## Comportamiento actual

1. Elegir imagen del catálogo; esperar el mensaje de imagen lista.
2. Pulsar **Activar audio**. No hay reproducción automática al cargar.
3. Tocar o mantener presionado y arrastrar para producir notas con el RGB real.
4. Enfocar el canvas y usar flechas (10 píxeles), Mayús + flechas (50), Enter o Espacio para repetir el punto. Escape detiene el audio.
5. Cambiar de imagen o perder el foco de la ventana detiene el audio. El botón Detener cancela también una activación pendiente.

Se mantiene la regla del motor aportado: RGB → tono H → `nota = floor(2 + H / 360 * 12)` → `frecuencia = 220 * 2 ** (nota / 12)`. La frecuencia cambia con el tono del píxel. Los grises tienen H = 0, por lo que comparten nota con el rojo. Saturación, luminosidad, escalas alternativas e instrumentos no están implementados y deben acordarse con el equipo de audio y Kata.

Las notas duran 0,18 segundos y se limita el inicio de nuevas notas a una cada 80 ms para evitar ataques simultáneos durante el arrastre. No se envían peticiones de red por píxel.

## Verificación

```bash
npm test
npm run build
```

Las pruebas comprueban conversión de color, escalado de coordenadas, bordes, objeto de muestra y errores del cliente de catálogo. Para verificar manualmente: seleccionar imágenes horizontales y verticales, tocar esquinas, arrastrar, usar teclado, detener, cambiar rápidamente de imagen y comprobar un error apagando el backend. La frecuencia visible y los datos de integración ayudan a diagnosticar el recorrido. La calidad y percepción musical requieren escucha humana.
