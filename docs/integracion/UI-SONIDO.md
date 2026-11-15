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

El perfil predeterminado es ahora `ambient`: escala pentatónica de La menor (A, C, D, E, G), timbre percutido suave y una capa tenue de campana. La luminosidad elige el registro, el tono el grado de la escala y la saturación modifica duración y mezcla. El negro casi absoluto deja silencio. Las notas se espacian al menos 240 ms y una misma altura no se repite antes de 900 ms durante un arrastre. El audio pasa por un filtro, reverberación y limitador. Detener silencia también la cola de reverberación mediante un fundido breve.

El carácter busca calma y melancolía como referencia ambiental de Minecraft; no utiliza sus grabaciones, samples ni melodías. Es síntesis original, no un piano muestreado. No se envían peticiones de red por píxel.

## Rollback del motor de sonido

La UI y su API permanecen iguales. `audio/legacy.js` conserva el motor anterior y `audio/ambient.js` contiene el nuevo. `sound.js` selecciona uno al compilar; el perfil no se cambia desde la UI.

Desde la raíz, para recuperar el sonido anterior en Docker:

```bash
VITE_SOUND_PROFILE=legacy docker compose up --build -d web
```

Para restaurar el nuevo perfil:

```bash
VITE_SOUND_PROFILE=ambient docker compose up --build -d web
```

En PowerShell, establecer primero `$env:VITE_SOUND_PROFILE="legacy"` (o `"ambient"`) y ejecutar `docker compose up --build -d web`.

Para desarrollo: `VITE_SOUND_PROFILE=legacy npm run dev`. El perfil se incorpora al bundle: cambiar la variable requiere recompilar Docker o reiniciar Vite y recargar la página. No cambia imágenes, metadatos, rutas del backend ni los controles de ejemplo.

## Verificación

```bash
npm test
npm run build
```

Las pruebas comprueban conversión de color, escalado de coordenadas, bordes, objeto de muestra y errores del cliente de catálogo. Para verificar manualmente: seleccionar imágenes horizontales y verticales, tocar esquinas, arrastrar, usar teclado, detener, cambiar rápidamente de imagen y comprobar un error apagando el backend. La frecuencia visible y los datos de integración ayudan a diagnosticar el recorrido. La calidad y percepción musical requieren escucha humana.
