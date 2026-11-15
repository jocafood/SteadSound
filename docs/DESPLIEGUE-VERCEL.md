# Desplegar SteadSound completo en Vercel

## Qué se sube y dónde corre

Se despliega **un solo proyecto desde la raíz del repositorio**. La UI Vite se compila a `dist/`; FastAPI sirve `/api` y monta esa UI en `/`. Vercel ejecuta Python como función y sirve la web por HTTPS. No hace falta Docker en Vercel, una computadora encendida, una dirección localhost pública ni contratar otro servidor para el catálogo actual.

```text
Celular o computadora → https://tu-proyecto.vercel.app
  /                         → UI compilada
  /assets/...               → JS, CSS e imágenes de la UI
  /api/images               → backend Python y catálogo
  /api/images/{id}/file     → imagen preparada para canvas
  /api/images/{id}/original → descarga del original
```

La API es parte del backend, no otro servicio que haya que levantar por separado. Los píxeles y la generación musical se procesan en el navegador del dispositivo. No se envía una petición al backend por cada nota.

El catálogo JSON e imágenes se empaquetan como archivos de solo lectura. No existe una base de datos externa que deba alojarse ni una ruta de subida pública. Agregar imágenes sigue siendo un cambio del repositorio y un nuevo despliegue. Las conversiones TIF no se ejecutan durante las peticiones.

## Archivos preparados

| Archivo | Función |
| --- | --- |
| `app.py` en la raíz | Entrada conjunta: reutiliza `backend.app.create_app` y monta `dist/` después de las rutas API. |
| `requirements.txt` en la raíz | Reutiliza dependencias de `backend/requirements.txt`. |
| `.python-version` | Selecciona Python 3.14. |
| `vercel.json` en la raíz | Framework FastAPI, compilación Vite, empaquetado de datos y exclusiones. |
| `.vercelignore` | Evita subir entornos locales, node_modules, archivos de trabajo y pruebas. |
| `scripts/check-deployment.mjs` | Verificación HTTP de UI, catálogo y descargas después de publicar. |

`backend/vercel.json` queda disponible para un despliegue API independiente, pero **no es la configuración que se debe seleccionar para publicar todo**. Para esta entrega no se requieren dos proyectos ni reescrituras con dominios de API.

## Publicar desde GitHub

1. Subir los cambios al repositorio. Incluir los archivos raíz nuevos, `backend/data`, `frontend`, `audio`, `sound.js`, `index.html`, `package.json` y `package-lock.json`. No subir entornos ni node_modules como parte de cambios nuevos.
2. En Vercel, seleccionar **Add New → Project** e importar el repositorio.
3. Dejar **Root Directory en la raíz (`./`)**. No seleccionar `backend` ni `frontend`.
4. Seleccionar **FastAPI** si no se lee automáticamente el framework de `vercel.json`. El Build Command del archivo es `npm ci && npm run build`. No configurar `dist` como Output Directory manual de un proyecto estático: FastAPI ya monta esa carpeta.
5. Configurar Node.js 22.x en el proyecto si se requiere escoger versión. Python se toma de `.python-version`.
6. Opcionalmente añadir `VITE_SOUND_PROFILE=ensemble` para Production y Preview. Sin esa variable, el perfil actual es el predeterminado. No necesita claves NASA ni `API_PROXY_TARGET` en producción.
7. Pulsar Deploy y revisar logs de instalación, compilación y función. Abrir el dominio HTTPS que devuelve Vercel.

No dejar en el panel comandos o ajustes de un proyecto Vite anterior que contradigan `vercel.json`. Si se reutiliza un proyecto existente, revisar Root Directory, Framework y Output Directory. No desactivar protecciones de otras aplicaciones: para compartir pruebas, configurar el acceso del despliegue específico. Un celular sin sesión Vercel debe poder abrir el enlace de prueba; una protección de Preview puede pedir autenticación.

## Publicar con CLI (alternativa)

Desde la raíz, con sesión de Vercel iniciada:

```bash
npx vercel
```

Elegir la raíz como directorio de proyecto y revisar la configuración detectada. Para producción, cuando el preview funcione:

```bash
npx vercel --prod
```

Esta entrega prepara los archivos pero no inicia sesión, crea proyectos remotos ni publica por sí sola. La prueba definitiva del entorno Vercel requiere el despliegue real y sus logs.

## Verificar el enlace publicado

Con Node instalado, desde la raíz:

```bash
node scripts/check-deployment.mjs https://TU-PROYECTO.vercel.app
```

Comprueba portada, catálogo, cada detalle, imágenes, originales y OpenAPI. Un 401/403 o una página de login indica protección de despliegue. HTML donde se esperaba JSON indica configuración de rutas incorrecta. No reemplazar `/api` por un fallback genérico de SPA.

En el celular abrir el enlace HTTPS (no `localhost`), seleccionar una imagen, probar narración y música mediante sus botones, alto contraste, volumen y escáner. Con el mismo dominio para UI y API no hace falta habilitar CORS global; imágenes y `getImageData` permanecen en el mismo origen. El usuario no necesita estar en la misma red Wi-Fi que el desarrollador.

## Narración y navegadores móviles

La lectura hablada es una ayuda Web Speech independiente de VoiceOver, TalkBack o NVDA. La página mantiene las etiquetas ARIA para esos lectores. El servidor no instala voces en el celular.

Se corrigieron los siguientes casos del cliente:

- La lectura al abrir una imagen se solicita dentro del clic que abre el reproductor, antes de esperar `image.decode()`. Esto evita perder el gesto requerido por algunos navegadores móviles.
- Las descripciones largas se dividen en fragmentos de unas 180 letras, preservando palabras; todos se encolan en el gesto original.
- Se precarga y actualiza la lista de voces con `voiceschanged`; si aún está vacía se pide inglés con `lang=en-US`, sin elegir explícitamente una voz de otro idioma.
- Se reanuda el sintetizador si estaba pausado y se conservan referencias de las locuciones.
- Cancelación y errores antiguos no alteran una lectura nueva. Si no se detecta comienzo en seis segundos se muestra una instrucción para volver a tocar el botón y revisar las voces inglesas del dispositivo.

Si no se escucha, pulsar **Read image description** otra vez; comprobar volumen multimedia y voz inglesa instalada/disponible en el sistema. Una ausencia de voz, bloqueo del navegador o servicio de voz del dispositivo no se resuelve con CORS ni desplegando Python. El texto siempre queda disponible. La verificación automatizada comprueba solicitudes, cancelación y estados; la escucha en Safari iOS y Chrome Android reales sigue siendo necesaria.

## Desarrollo local

Docker sigue funcionando sin depender de Vercel:

```bash
docker compose up --build -d
```

La UI está en `http://localhost:8080`. No confundir ese puerto con el enlace público.

Para probar la misma entrada Python usada en Vercel, compilar primero la UI y ejecutar desde la raíz:

```bash
npm ci
npm run build
python -m pip install -r requirements.txt
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

Abrir `http://localhost:8000`. `0.0.0.0` permite probar por la IP local desde otro dispositivo de la misma red si el firewall lo permite; el enlace Vercel HTTPS es preferible para evaluar las políticas móviles de voz/audio.

## Límites y referencias

El despliegue actual incluye unos 14 MiB de imágenes del catálogo y no modifica sus metadatos. Si se agregan muchos originales grandes, revisar los límites de funciones y evaluar almacenamiento de objetos; no convertir este paquete en un servidor de subida permanente.

Referencias oficiales: [FastAPI y archivos estáticos en Vercel](https://vercel.com/docs/frameworks/backend/fastapi), [runtime Python](https://vercel.com/docs/functions/runtimes/python), [voz del navegador](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/speak).

## Verificación realizada antes de publicar

17 pruebas JavaScript aprobadas, compilación Docker correcta y prueba local de la entrada raíz `app.py`: portada, catálogo de 20 imágenes, 40 archivos y errores JSON de API. El verificador HTTP también pasó contra la aplicación local completa. La prueba de navegador móvil simulado confirmó inglés, voces tardías, fragmentos cortos, cancelación y solicitudes de voz dentro del gesto. No equivale a escuchar Safari/Android reales ni a ejecutar un build en la infraestructura Vercel: esos pasos siguen pendientes tras publicar.
