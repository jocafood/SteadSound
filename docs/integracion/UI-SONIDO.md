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

El perfil anterior `ambient` se conserva sin cambios para rollback: escala pentatónica de La menor (A, C, D, E, G), timbre percutido suave y una capa tenue de campana. La luminosidad elige el registro, el tono el grado de la escala y la saturación modifica duración y mezcla. El negro casi absoluto deja silencio. Las notas se espacian al menos 240 ms y una misma altura no se repite antes de 900 ms durante un arrastre. El audio pasa por un filtro, reverberación y limitador. Detener silencia también la cola de reverberación mediante un fundido breve.

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

Para desarrollo: `VITE_SOUND_PROFILE=legacy npm run dev`. El perfil predeterminado actual es `ensemble`. Para activarlo: `VITE_SOUND_PROFILE=ensemble docker compose up --build -d web`.

El perfil se incorpora al bundle: cambiar la variable requiere recompilar Docker o reiniciar Vite y recargar la página. No cambia imágenes, metadatos, rutas del backend ni los controles de ejemplo.

## Verificación

```bash
npm test
npm run build
```

Las pruebas comprueban conversión de color, escalado de coordenadas, bordes, objeto de muestra y errores del cliente de catálogo. Para verificar manualmente: seleccionar imágenes horizontales y verticales, tocar esquinas, arrastrar, usar teclado, detener, cambiar rápidamente de imagen y comprobar un error apagando el backend. La frecuencia visible y los datos de integración ayudan a diagnosticar el recorrido. La calidad y percepción musical requieren escucha humana.

## Instrumentos, mezcla y orquesta (perfil ensemble)

La interfaz conserva el explorador y añade controles de sonido:

- Seleccionar piano, violín, flauta o campanas. Son timbres sintetizados; no grabaciones de instrumentos reales.
- Activar **Combinar instrumentos** y marcar las capas que deben sonar al mismo tiempo. Se mantiene al menos una seleccionada. Se normaliza el volumen según el número de instrumentos.
- Pulsar **Escuchar imagen · 4 segundos** para una interpretación simultánea y breve. Se activa el contexto de audio desde ese mismo gesto.

La orquesta toma 96 muestras distribuidas en una cuadrícula de 12 × 8 sobre toda la imagen, omite el negro casi absoluto y agrupa por nota pentatónica. Interpreta simultáneamente las cinco alturas más frecuentes con los instrumentos seleccionados (máximo 20 voces iniciales con cuatro instrumentos). No intenta reproducir cada uno de los millones de píxeles a la vez. La duración total es cuatro segundos, con fundido al final; el modo debe iniciarse de nuevo para otra interpretación.

Mientras suena la orquesta se suspende el disparo de notas por píxel. Detener, Escape, cambiar instrumentos, cambiar imagen o salir de la ventana cancelan la interpretación y su temporizador. Los cambios de instrumento detienen el sonido para evitar mezclar notas anteriores con la nueva selección.

API para la UI final:

```js
import { configurarInstrumentos, reproducirOrquesta, iniciarAudio } from './sound.js';
import { sampleImage } from './audio/orchestra.js';

configurarInstrumentos(['piano', 'violin']);
// Ejecutar la activación desde un gesto del usuario.
await iniciarAudio();
const result = await reproducirOrquesta(sampleImage(context, imageId));
// result.reason: finished, cancelled o silent.
```

`ImageSoundExplorer.orchestra()` realiza el muestreo del canvas actual y devuelve esa misma promesa. `admiteInstrumentos` indica si el perfil compilado permite los nuevos controles; se ocultan automáticamente en `ambient` y `legacy`.

Para volver exactamente al motor melancólico de la entrega anterior, sin los nuevos controles activos:

```bash
VITE_SOUND_PROFILE=ambient docker compose up --build -d web
```

Para regresar a instrumentos y orquesta:

```bash
VITE_SOUND_PROFILE=ensemble docker compose up --build -d web
```

## Versión anterior: contraste por color, guitarra y percusión (`ensemble-percussion`)

El perfil `ensemble` ahora conserva la escala musical pero separa los colores en seis familias sonoras (rojo, amarillo, verde, cian, azul y magenta), más una neutra para grises. Cambian el espectro, filtro, ataque y duración; el piano amarillo y magenta usa síntesis FM para contrastar con los tonos más redondos de verdes y azules. Las voces se separan por instrumento y familia para que un cambio de color no altere notas que ya están sonando.

La guitarra eléctrica sintetizada usa distorsión y power chords: fundamental una octava por debajo del píxel, quinta justa y octava. Se puede elegir sola o combinar con piano, violín, flauta y campanas. No se usan grabaciones comerciales.

El volumen del píxel sigue `0.55 × max(R,G,B normalizados)^1.7`, sin un mínimo fijo. Valores máximos menores que 0.07 producen silencio; los grises oscuros que superan ese umbral suenan progresivamente más bajo. El volumen global se normaliza por capas y notas simultáneas.

### Intensidad global y BPM

Al cargar cada imagen se toman 1536 muestras uniformes (48 × 32). Se incluye el fondo negro en los promedios. Esto estima la intensidad visual del archivo de exploración, no una medida física del objeto astronómico.

- Luminosidad: promedio de luminancia relativa sRGB, convirtiendo cada canal a luz lineal y ponderando con 0.2126 R + 0.7152 G + 0.0722 B.
- Color vibrante: promedio de saturación HSL multiplicada por el canal máximo. Un color casi negro no aumenta el ritmo por tener alta saturación.
- Energía: `0.65 × sqrt(luminosidad media) + 0.35 × color vibrante medio`.
- BPM: `round(48 + 96 × energía)`, limitado al intervalo 48–144.

Una imagen más luminosa o más saturada a igual luminosidad produce un BPM mayor. La percusión usa bombo, caja y hi-hat sintetizados. Su intensidad también depende de la energía; en una imagen prácticamente negra se silencia. La UI muestra los BPM y los promedios de la imagen.

La percusión comienza al activar el audio, acompaña la exploración y la orquesta y se detiene con los mismos controles de cancelación. Es global: tocar un píxel negro silencia su nota, pero la percusión continúa si el conjunto de la imagen tiene energía. En orquesta se agrupa por altura y familia sonora, con hasta cinco grupos; con cinco instrumentos y power chords se disparan como máximo 35 voces iniciales.

### Rollback a la entrega anterior con instrumentos

Se conservó `audio/ensemble-classic.js` con el motor anterior (sin guitarra, sin nuevos timbres por familia y sin percusión). Para recuperarlo:

```bash
VITE_SOUND_PROFILE=ensemble-classic docker compose up --build -d web
```

Para volver a la versión actual:

```bash
VITE_SOUND_PROFILE=ensemble docker compose up --build -d web
```

También siguen disponibles `ambient` y `legacy`. Los botones nuevos de guitarra solo corresponden al perfil actual; no se muestran al compilar el perfil clásico.

## Corrección actual: la luminosidad global marca el tempo de los instrumentos

El perfil actual `ensemble` no tiene batería, bombo, caja ni hi-hat. La luminosidad sigue siendo el promedio de toda la imagen (1536 muestras sRGB linealizadas), incluyendo los fondos negros. No se calcula un BPM distinto para cada píxel. La saturación sigue afectando al timbre pero ya no incrementa los BPM.

`BPM = round(48 + 96 × sqrt(luminancia media))`; intervalo de las notas = `60 / BPM` segundos. Así, imágenes claras producen pulsaciones instrumentales más rápidas y las oscuras más lentas. La duración de cada nota es el 65 % del intervalo, seguida por su envolvente y reverberación.

- Mantener un clic o toque repite el color actual al tempo de la imagen; arrastrar cambia el color. Soltar detiene nuevas repeticiones, dejando extinguir la última nota.
- Un toque o una muestra por teclado inicia una frase breve, limitada a unos dos pulsos. No se reproduce nada solo por activar el audio.
- La orquesta repite sus notas simultáneas al mismo tempo global durante cuatro segundos. Detener, Escape, cambiar imagen o cambiar instrumentos cancelan todo.
- Los negros siguen siendo silenciosos y los píxeles oscuros conservan su volumen reducido. El BPM no cambia el tono ni transpone la nota.

Se conserva la versión inmediatamente anterior para rollback:

```bash
VITE_SOUND_PROFILE=ensemble-percussion docker compose up --build -d web
```

Para recuperar la versión actual sin percusión:

```bash
VITE_SOUND_PROFILE=ensemble docker compose up --build -d web
```

Los perfiles `ensemble-classic`, `ambient` y `legacy` también siguen disponibles. En la UI actual el indicador se llama **Tempo instrumental**.
