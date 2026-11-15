# Contrato completo de integración para la UI

> Actualización de despliegue: ya existen archivos raíz para publicar UI y API en **un solo proyecto Vercel**. La propuesta anterior de dos proyectos se conserva como historial, pero debe seguirse [DESPLIEGUE-VERCEL.md](../DESPLIEGUE-VERCEL.md). El despliegue remoto todavía debe ejecutarse y verificarse.

Referencia de entrega para Santiago y el equipo. Describe el código disponible en esta rama y el comportamiento actual del perfil `ensemble`. La integración local está implementada; el despliegue conjunto en Vercel que se describe abajo es una propuesta pendiente de configurar y verificar en la cuenta del equipo. Este documento no elimina el mockup ni publica el proyecto.

## 1. Arquitectura y responsabilidades

```text
UI final → /api/images → catálogo Python
UI final → imageUrl → archivo PNG/JPG → canvas → RGB + posición
RGB + posición → sound.js → Tone.js → audio del navegador
Canvas completo → muestras de luminosidad media → tempo instrumental
```

El backend entrega archivos y metadatos. No recibe píxeles por interacción, no genera audio y no reproduce instrumentos. La UI controla la selección, el canvas, la interacción y los estados accesibles. `sound.js` es la entrada pública del motor; no importar directamente sus implementaciones desde la UI final. La luminosidad es global, estimada sobre toda la imagen, no un BPM por píxel. El perfil actual no tiene percusión.

Los módulos son JavaScript ES y requieren un bundler compatible con la dependencia `tone` y `import.meta.env` (actualmente Vite). No funcionan como scripts clásicos ni importando `sound.js` directamente desde un servidor estático sin compilar. La UI debe instanciar estas conexiones solo en el navegador, nunca durante SSR.

## 2. Archivos: qué reutilizar y qué sustituir

| Archivo | Acción de la UI final |
| --- | --- |
| `index.html` | Reemplazar su presentación por el punto de entrada de la UI final; Vite sigue necesitando un HTML de entrada si se conserva esta arquitectura. |
| `frontend/main.js` | Adaptador del mockup: sustituir por los controladores/componentes de la UI final. No cargar ambos adaptadores a la vez. |
| `frontend/style.css` | Estilos del mockup: retirar su importación al sustituirlos por los definitivos. |
| `frontend/explorer.js` | Conservar: conecta API, canvas, tempo y audio. |
| `frontend/api.js` | Conservar: cliente del catálogo. |
| `frontend/pixels.js` | Conservar: coordenadas y objeto de muestra. |
| `frontend/color.js` | Conservar: dependencia del mapeo de color. |
| `sound.js` y `audio/` | Conservar: motor y perfiles de rollback. |
| `backend/` | Conservar: API, catálogo, datos, herramientas y pruebas. |
| `vite.config.mjs` | Mantener o trasladar el proxy `/api` al entorno de la UI final. |
| `Dockerfile`, `compose.yaml`, `deploy/nginx.conf` | Actualizar si se mueve la entrada, cambia el framework o cambia el directorio de salida. |
| `tests/` | Conservar o adaptar las importaciones si se reorganizan módulos. |

**No borrar toda la carpeta `frontend/`: contiene conexiones reutilizables.** Si se mueven, actualizar imports relativos de `sound.js`, `audio/`, pruebas y Docker. El Dockerfile actual copia explícitamente `index.html`, `sound.js`, `vite.config.mjs`, `frontend/` y `audio/`, y espera `dist/`; una UI en otra carpeta necesita modificar esos `COPY` y el build.

## 3. API HTTP

Todas las rutas son GET públicas, relativas al mismo dominio. No requieren token ni cuerpo. JSON UTF-8 y campos `camelCase`.

| Ruta | Respuesta 200 |
| --- | --- |
| `/api/images` | `{ "images": [ImageRecord, ...] }`; catálogo vacío: `{ "images": [] }`. |
| `/api/images/{id}` | `{ "image": ImageRecord }`. |
| `/api/images/{id}/file` | Bytes PNG o JPG para explorar en canvas. |
| `/api/images/{id}/original` | Bytes del archivo original PNG/JPG/TIF, con descarga `Content-Disposition: attachment`. |
| `/api/docs` | Documentación interactiva del backend. |
| `/api/openapi.json` | Descripción OpenAPI del backend. |

`/api/images/{id}` devuelve metadatos, no el archivo. Para dibujar se usa siempre `imageUrl`, nunca `sourceUrl` ni un TIF original. Lista y detalle comparten el mismo objeto:

```json
{
  "id": "blue-marble-2002",
  "assetNumber": 1,
  "title": "Blue Marble 2002: hemisferio occidental",
  "description": "Texto accesible y contexto de la imagen.",
  "altText": "Descripción visual breve.",
  "imageUrl": "/api/images/blue-marble-2002/file",
  "imageFormat": "jpg",
  "originalUrl": "/api/images/blue-marble-2002/original",
  "originalFormat": "jpg",
  "sourceUrl": "https://science.nasa.gov/resource/blue-marble-2002/",
  "credit": "NASA's Earth Observatory",
  "category": "earth",
  "width": 1024,
  "height": 1024,
  "processingNotes": "Descripción de la preparación de la versión de exploración."
}
```

Los textos del ejemplo están abreviados. `assetNumber`, `width` y `height` son enteros positivos; `category` admite `earth`, `weather`, `space`; `imageFormat`: `png` o `jpg`; `originalFormat`: `png`, `jpg` o `tif`. Todos los campos del ejemplo están presentes en el backend actual. La UI no debe construir IDs a partir de títulos, asumir el número de imágenes ni depender de su posición en la lista. `assetNumber` identifica archivos internos; las rutas usan `id`.

Los originales están intactos y los TIF compatibles se preparan como PNG antes de publicar. La UI lee RGB de 8 bits en la versión de exploración, no valores científicos del TIF. Las dimensiones naturales del archivo cargado son la referencia efectiva del canvas. Fuente y crédito deben acompañar la imagen.

### Errores

```json
{ "error": { "code": "IMAGE_NOT_FOUND", "message": "No se encontró la imagen o ruta solicitada." } }
```

El backend implementa `404 IMAGE_NOT_FOUND`, `405 METHOD_NOT_ALLOWED` (`Allow: GET`) y `500 INTERNAL_ERROR`. `502 IMAGE_SOURCE_ERROR` y `504 IMAGE_SOURCE_TIMEOUT` están reservados en el contrato de datos para futuras fuentes remotas: el catálogo actual usa archivos locales y no los genera. No esperar siempre JSON cuando falle un proxy o Vercel: comprobar primero el estado HTTP y manejar también error de red o respuesta HTML.

`obtenerImagenes({signal})` rechaza con `Error` si el catálogo falla o no contiene un array `images`. No expone el código detallado del backend: para una UI que necesite distinguirlos, ampliar ese cliente conservando el formato HTTP. `AbortController` permite cancelar la petición del catálogo, pero no las cargas de imagen internas de `explorer.load`.

## 4. Controlador recomendado: ImageSoundExplorer

```js
import { ImageSoundExplorer } from './frontend/explorer.js';
const explorer = new ImageSoundExplorer(canvas);
const images = await explorer.list();
if (images.length) await explorer.load(images[0]);
```

Las rutas de importación son desde la raíz; ajustarlas a la ubicación del componente.

| Método o propiedad | Contrato real |
| --- | --- |
| `new ImageSoundExplorer(canvas)` | Canvas HTML montado y contexto 2D disponible. Un explorador activo para la experiencia. |
| `list({signal}?)` | Promesa con el array de imágenes. |
| `load(record)` | Promesa de carga, dibujo, prueba de lectura y cálculo global del tempo. Descarta resultados de cargas anteriores. **No detiene el audio por sí solo**: llamar `stop()` antes de cambiar imagen. |
| `start()` | Promesa; activa audio mediante gesto del usuario y emite estado. No devuelve un booleano de activación: comprobar `audioActivo()` si es necesario. |
| `stop()` | Detiene instrumentos, reloj, orquesta pendiente y colas de audio. |
| `point(clientX, clientY)` | Lee y reproduce el punto de pantalla; devuelve muestra o `null` si no hay imagen o el punto está fuera. |
| `sample(x,y)` | Coordenadas enteras de la imagen; devuelve muestra o `null` sin imagen. Fuera de límites lanza error. |
| `move(dx,dy)` | Desplaza la posición interna limitándola al área de imagen y reproduce la muestra. |
| `orchestra()` | Promesa de barrido de arriba hacia abajo; duración aproximada de 4–10 segundos según tempo y altura. Requiere imagen y audio ya activo. |
| `dispose()` | Invalida cargas pendientes, descarta la imagen y detiene audio. La UI debe retirar sus propios listeners. |
| `image` | Registro cargado o `null`. No usar mientras la nueva imagen está cargando. |
| `rhythm` | Estadística global después de `imagechange`; puede ser `null` en perfiles anteriores. No usar el valor anterior durante la carga. |

### Eventos

Registrar listeners antes de llamar `load`:

| Evento | `event.detail` |
| --- | --- |
| `imagechange` | Registro de imagen listo para explorar. Actualizar título, descripción, crédito, fuente y `aria-label` del canvas. |
| `scanprogress` | `{ yStart, yEnd, height, index, total, progress, duration }`; filas base cero, `yEnd` exclusivo y progreso 0–1. La UI puede dibujar una línea de escaneo sin modificar el canvas. |
| `sample` | `{ sample, sound }`. `sound` es `null` con audio inactivo; en otro caso incluye frecuencia, familia, volumen, BPM y si se disparó una nota inmediatamente. |
| `status` | Cadena legible para mostrar en `role="status"` / `aria-live="polite"`. No interpretar esa cadena como estado de máquina. |

`sample` siempre representa una lectura, no garantiza un ataque audible: un negro es silencioso y los disparos se espacian. `played: false` puede indicar que el motor espera su próxima pulsación. Las repeticiones del reloj no vuelven a emitir eventos `sample`.

## 5. Objeto del píxel

```json
{
  "imageId": "blue-marble-2002",
  "position": { "x": 512, "y": 192, "normalizedX": 0.5004887585532747, "normalizedY": 0.187683284457478 },
  "color": { "r": 120, "g": 180, "b": 220 }
}
```

Ejemplo para una imagen de 1024 × 1024. `x` e `y` son enteros desde cero, con origen arriba a la izquierda; normalizadas: `x/(width-1)` y `y/(height-1)`, o cero si una dimensión vale uno. RGB son enteros 0–255. No se envía a la API.

El canvas debe mantener la proporción natural, sin padding ni bordes propios. Poner decoraciones en un contenedor. `point()` usa el rectángulo CSS completo: si la UI introduce bandas con `object-fit`, debe descontarlas antes de usar `sample()`. No limitar la altura de forma que estire o añada bandas dentro del canvas. Establecer `touch-action: none` solo sobre el área de exploración.

## 6. Motor público: sound.js

| Exportación | Uso |
| --- | --- |
| `iniciarAudio()` | Promesa de booleano. Llamar directamente desde un clic, toque o tecla; `true` si se activó, `false` si se canceló mientras esperaba. Puede rechazar si el navegador no permite audio. |
| `reproducirSonido(sample)` | Sincrónico. Acepta el objeto del píxel o `{r,g,b}`; devuelve parámetros o `null` si está apagado. |
| `detenerAudio()` | Cancela activación pendiente, repeticiones y orquesta; silencia con fundido breve. |
| `audioActivo()` | Booleano del estado del motor, no permiso permanente del navegador. |
| `configurarInstrumentos(ids)` | Array no vacío de IDs válidos. Deduplica y **detiene el audio**; después volver a activarlo. |
| `configurarImagen(samples)` | Calcula estadísticas globales. La llama `explorer.load` automáticamente. Con integración directa, llamar antes de activar audio. |
| `reproducirOrquesta(samples)` | Promesa `{reason, notes, duration, instruments?}`. `reason`: `finished`, `cancelled`, `silent`. En el perfil actual la duración depende del número de bandas y el tempo; los perfiles de rollback mantienen su comportamiento anterior. Audio debe estar activo. |
| `mantenerExploracion()` | Mantiene la repetición del último píxel hasta que se pause o detenga. Usar después de leer un punto válido durante una presión. |
| `pausarExploracion()` | Deja de iniciar notas del píxel; permite extinguir la nota actual. No cancela la orquesta: para eso usar `detenerAudio()`. |
| `SOUND_PROFILE`, `admiteInstrumentos` | Perfil incorporado al build y capacidad de instrumentos/orquesta. |

Instrumentos actuales: `piano`, `violin`, `flute`, `bell`, `guitar`. Son síntesis, no samples grabados. La guitarra incluye power chords de fundamental, quinta y octava. El color determina una familia de timbre y la nota pentatónica; los píxeles oscuros reducen volumen y los casi negros son silenciosos.

### Tempo actual, sin percusión

El controlador toma 1536 muestras globales, incluyendo negros. Calcula luminancia media relativa sRGB y aplica `BPM = round(48 + 96 * sqrt(luminanciaMedia))`; intervalo `60/BPM` segundos. La saturación cambia el timbre, no el BPM. `rhythm` contiene `luminance`, `vibrance`, `energy`, `bpm`, `noteInterval`.

Mantener un punto repite notas al tempo global; una muestra de teclado produce una frase corta acotada. El escáner lee todos los píxeles y agrupa filas consecutivas en hasta 32 bandas horizontales. Cada banda elige hasta cinco grupos de altura/familia. Las bandas suenan de arriba hacia abajo, incluyendo el tiempo de las bandas negras como silencio. No se disparan millones de voces independientes. Hasta cinco instrumentos y los power chords de guitarra permiten un máximo de 35 voces iniciales por pulsación orquestal. Se suspenden notas individuales mientras suena la orquesta.

## 7. Ciclo de vida para los controles de la UI

Secuencia de selección: cancelar operaciones UI anteriores → `explorer.stop()` → deshabilitar exploración → `await explorer.load(record)` → habilitar al recibir `imagechange`. Mantener un contador de operación o token para que una promesa vieja no reactive botones ni sobrescriba mensajes después de cambiar imagen, detener o desmontar.

Activar audio debe llamar `start()` desde el handler, **antes de esperar red, animaciones o cargas**. Un botón de orquesta debe usar `await explorer.start()` desde ese gesto si el audio está apagado, comprobar que la operación sigue vigente y luego `await explorer.orchestra()`.

Adaptador mínimo de exploración, sin dependencia del HTML del mockup:

```js
import { mantenerExploracion, pausarExploracion } from './sound.js';
let pointerId;

function down(event) {
  if (!explorer.image || (event.pointerType === 'mouse' && event.button !== 0)) return;
  pointerId = event.pointerId;
  canvas.setPointerCapture(pointerId);
  canvas.focus({ preventScroll: true });
  if (explorer.point(event.clientX, event.clientY)) mantenerExploracion();
}
function move(event) {
  if (event.pointerId !== pointerId) return;
  if (explorer.point(event.clientX, event.clientY)) mantenerExploracion();
  else pausarExploracion();
}
function release() { pointerId = undefined; pausarExploracion(); }
canvas.addEventListener('pointerdown', down);
canvas.addEventListener('pointermove', move);
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  canvas.addEventListener(name, release);
}
```

Al desmontar, retirar esos listeners, abortar el fetch del catálogo si sigue pendiente y llamar `explorer.dispose()`. El audio es un singleton compartido: no montar dos exploradores activos ni llamar `dispose()` de un componente antiguo después de activar uno nuevo.

Teclado: canvas con `tabindex="0"`; flechas → `move`, Enter/Espacio → `move(0,0)`, Escape → `stop`. Evitar scroll de página solo en las teclas manejadas. Detener al ocultar la pestaña (`visibilitychange`), perder foco de ventana y abandonar la página. Cambiar instrumento o imagen debe cancelar también los estados visuales de orquesta. Los elementos de selección y Detener deben seguir accesibles mientras suena.

UI mínima: catálogo con carga/error/vacío y reintento; imagen con error; título, descripción y crédito; activar/detener audio; selección y mezcla de instrumentos con al menos uno; orquesta con estado y finalización; foco visible e instrucciones táctiles/teclado. El panel JSON del mockup es diagnóstico y puede retirarse.

## 8. Desarrollo y Docker

Desde la raíz:

```bash
docker compose up --build -d
```

UI `http://localhost:8080`, API directa `http://localhost:8000/api/docs`. Nginx reenvía `/api` internamente al servicio `api:8000`. `backend/compose.yaml` por sí solo levanta únicamente el backend.

Para desarrollar UI con Vite, mantener el backend activo y ejecutar desde la raíz:

```bash
npm ci
npm run dev
```

UI `http://localhost:5173`. El proxy de Vite cubre `/api` en desarrollo y preview. `API_PROXY_TARGET` cambia su destino solo en esos modos, no configura el bundle de producción. Las variables `VITE_*` se incorporan al cliente y no son secretas. No subir `node_modules` ni `dist` como código fuente de la UI.

## 9. Vercel: configuración conjunta propuesta

**No está desplegada ni validada todavía.** La configuración existente `backend/vercel.json` sirve el backend cuando el directorio raíz del proyecto Vercel es `backend/`. No configura automáticamente la UI de la raíz ni su proxy.

Una integración explícita para esta estructura es usar dos proyectos Vercel del mismo repositorio y mantener un único origen público para el navegador:

| Proyecto | Root Directory | Configuración |
| --- | --- | --- |
| API | `backend` | FastAPI, `app.py`, dependencias `requirements.txt`, configuración `backend/vercel.json` que incluye `data/**`. |
| UI | raíz del repositorio | Vite; instalación `npm ci`, build `npm run build`, salida `dist`. |

El proyecto de UI necesita un `vercel.json` **en la raíz**, todavía no creado. Ejemplo de configuración a aplicar sustituyendo el dominio ilustrativo por el dominio real del proyecto API:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://API-REAL.vercel.app/api/:path*"
    }
  ]
}
```

Publicar y comprobar primero la API. La reescritura debe preservar `/api` y cubrir JSON, imágenes y originales. El navegador seguirá usando `/api/images` y las URLs relativas del catálogo, sin cambios de código ni CORS general. No usar un redirect: debe ser un rewrite que mantenga la URL de la UI. La API debe ser accesible desde el proxy; verificar que su protección de despliegue no devuelva login/401/403. No introducir credenciales de bypass en el cliente.

Si la UI final tiene rutas SPA, añadir su fallback después de `/api`, verificando que nunca sustituya respuestas API o assets por `index.html`. Para previews, elegir expresamente si se conectan a una API de preview o a una versión estable compatible; un rewrite con dominio fijo no empareja automáticamente ramas de UI y backend.

El sonido se compila en la UI; Vercel no ejecuta Web Audio. Configurar `VITE_SOUND_PROFILE=ensemble` en el proyecto UI y reconstruir al cambiarlo. Docker y Nginx se usan localmente; Vercel ejecutará el backend Python y servirá el bundle estático según su configuración, sin arrancar estos contenedores.

Validar en el dominio público de la UI: `/api/images` devuelve JSON; `imageUrl` dibuja y permite `getImageData`; `originalUrl` descarga; el audio se inicia mediante gesto sobre HTTPS. Una llamada directa desde el navegador al dominio API no corresponde a este esquema y requeriría configurar CORS tanto para fetch como para canvas.

Referencias oficiales consultadas: [FastAPI en Vercel](https://vercel.com/docs/frameworks/backend/fastapi) y [reescrituras de Vercel](https://vercel.com/docs/routing/rewrites). Esta es una propuesta de integración para la estructura actual, no una afirmación de despliegue ya realizado.

## 10. Retirar el mockup y hacer el merge

1. Implementar la UI definitiva en su entrada y conectar un solo `ImageSoundExplorer` al canvas montado.
2. Trasladar selección, eventos, mezcla, orquesta, pausa al soltar y cancelación al adaptador final. No depender de los IDs del mockup: son convenciones de `main.js`, no del motor.
3. Reemplazar el HTML de ejemplo; retirar la carga de `frontend/main.js` y sus estilos cuando la UI final controle la pantalla. Conservar los módulos reutilizables de la sección 2.
4. Si se cambia de framework, adaptar imports cliente, dependencias, entrada, proxy, variables, comando de build, Docker y directorio estático. No usar dos servidores UI como solución de producción.
5. Ejecutar las verificaciones de la sección siguiente y probar la UI final antes de eliminar los archivos de presentación que ya no se importan.
6. Revisar el diff: conservar catálogo y metadatos, contrato de píxeles, perfiles de rollback y herramientas del backend. Resolver conflictos de números del catálogo según la guía de imágenes.

No borrar archivos automáticamente solo porque se llamen `frontend`: primero comprobar sus consumidores. No modificar `backend/vercel.json` para ponerle la configuración Vite del proyecto UI.

## 11. Rollback

`VITE_SOUND_PROFILE` se decide al compilar:

| Valor | Comportamiento |
| --- | --- |
| `ensemble` | Actual: cinco instrumentos, timbres por color, tempo instrumental global, sin percusión. |
| `ensemble-percussion` | Entrega previa con batería por energía global. |
| `ensemble-classic` | Cuatro instrumentos y orquesta, sin guitarra ni percusión. |
| `ambient` | Perfil melancólico original, sin selección de instrumentos/orquesta. |
| `legacy` | Motor inicial cromático. |

En Docker: `VITE_SOUND_PROFILE=ambient docker compose up --build -d web`. En Vercel, cambiar la variable del proyecto UI y crear un nuevo despliegue. Cambiar variables sin reconstruir no modifica un bundle ya servido. Conservar un commit/despliegue conocido antes de sustituir el mockup para poder recuperar también su presentación; los perfiles solo revierten sonido.

`admiteInstrumentos` no diferencia por sí solo guitarra o tempo en todos los perfiles: en `ensemble-classic` no ofrecer guitarra; en `ambient`/`legacy` ocultar mezcla y orquesta. El código actual contempla esas diferencias.

## 12. Criterios de aceptación de la UI final

Desde la raíz: `npm test` y `npm run build`. Desde `backend/`: `python -m pytest -q` y `python -m scripts.verify_catalog` (o las pruebas Docker descritas en el README). No hace falta modificar el backend para cambiar la presentación.

Antes de integrar o publicar, comprobar:

- Catálogo real, vacío, fallo HTTP y reintento; imagen vertical y horizontal; selección rápida sin resultados obsoletos.
- RGB y coordenadas correctos en centro y esquinas, también con canvas escalado y en tablet.
- Sin autoplay al cargar o activar; tocar, mantener y soltar; teclado y foco visible.
- Cada instrumento, mezcla válida, negros silenciosos y timbres diferenciados por color.
- Imágenes claras y oscuras producen distinta velocidad instrumental. Los BPM son globales y no cambian al mover el cursor.
- Barrido de arriba hacia abajo con progreso; cancelar durante activación, interpretación y cambio de imagen; sin notas nuevas después de detener o desmontar.
- Sin audio residual al ocultar pestaña; sin listeners duplicados en remount/desarrollo.
- En Vercel: JSON, canvas y descargas a través del dominio UI; sin bloqueos de autenticación, CORS ni fallback HTML sobre `/api`.

Otros documentos: [contrato de datos](CONTRATO-DATOS.md), [historial y funcionamiento del sonido](UI-SONIDO.md), [agregar imágenes](AGREGAR-IMAGENES.md), [correspondencias del catálogo](CATALOGO-HACKA.md).

La llamada pública `explorer.orchestra()` se conserva para compatibilidad, pero en `ensemble` ahora ejecuta el escáner. `audio/scanner.js` genera el plan con todos los píxeles. Para recuperar la orquesta simultánea de la entrega previa: `VITE_SOUND_PROFILE=ensemble-static docker compose up --build -d web`.
