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

## Conectar GitHub con Vercel: paso a paso

### 1. Dejar la versión lista en GitHub

Guardar y subir a la rama que se quiere publicar todos los cambios de esta entrega. No basta con que funcionen en Docker: Vercel construye la versión del commit remoto, no los archivos sin guardar de la computadora.

Desde la raíz, revisar:

```bash
git status --short
git branch --show-current
```

Comprobar que están incluidos `app.py`, `vercel.json`, `.python-version`, `.vercelignore`, `requirements.txt`, `package.json`, `package-lock.json`, `backend/`, `frontend/`, `audio/`, `sound.js` e `index.html`. Los archivos que empiezan por punto también cuentan. Revisar qué se añadirá antes de crear el commit y hacer push mediante el flujo habitual del equipo. Esta guía no ejecuta esos cambios de Git por sí sola.

No subir `.venv`, claves `.env`, `node_modules` ni `dist` como fuentes nuevas. Vercel instala dependencias y genera la compilación.

### 2. Dar acceso al repositorio

1. Entrar en Vercel y seleccionar el equipo/cuenta donde se alojará SteadSound.
2. Seleccionar **Add New → Project**.
3. Conectar GitHub si aún no está conectado y autorizar acceso al repositorio de SteadSound. Si no aparece, revisar los permisos de la integración GitHub para ese repositorio u organización.
4. Buscar el repositorio y pulsar **Import**. No hace falta crear un repositorio separado para backend o UI.

### 3. Revisar la configuración antes de Deploy

| Campo de Vercel | Valor para este repositorio |
| --- | --- |
| Project Name | Por ejemplo `steadsound`; el nombre disponible determina el dominio inicial. |
| Framework Preset | **FastAPI**, aunque la UI utilice Vite. |
| Root Directory | Raíz, `./`; dejar vacío si la interfaz representa así la raíz. **No `backend/` ni `frontend/`.** |
| Build Command | `npm ci && npm run build`, ya declarado en `vercel.json`. |
| Output Directory | Sin override manual. No forzar un proyecto estático con salida `dist`. La entrada Python monta esa carpeta. |
| Install Command | Mantener el comportamiento del framework Python. Las dependencias están en el `requirements.txt` raíz; el build instala las de Node con `npm ci`. |
| Node.js | 22.x si se selecciona manualmente; coincide con el Dockerfile de la UI. |
| Python | 3.14 mediante `.python-version`. |
| Production Branch | La rama integrada del equipo; normalmente `main`. Confirmarla después en la configuración Git del proyecto. |

Si Vercel detecta Vite por `package.json`, seleccionar FastAPI y comprobar que se está usando el `vercel.json` de la raíz. `backend/vercel.json` es solo para API independiente y no debe reemplazarlo.

### 4. Variables de entorno

No se necesitan claves NASA, URL de base de datos, credenciales, `localhost` ni dirección externa de API para el catálogo actual.

Opcionalmente agregar:

| Nombre | Valor | Entornos |
| --- | --- | --- |
| `VITE_SOUND_PROFILE` | `ensemble` | Production y Preview |

Sin esa variable, `ensemble` ya es el perfil predeterminado. No añadir `API_PROXY_TARGET` para solucionar producción: esa variable solo configura el proxy local de Vite. Las variables `VITE_*` son públicas en el bundle; no colocar secretos en ellas.

### 5. Crear el despliegue

Pulsar **Deploy**. En los logs comprobar instalación de Python, `npm ci`, compilación Vite y creación de la función FastAPI. Cuando finalice correctamente, abrir el dominio HTTPS proporcionado.

No se necesita iniciar `docker compose`, Uvicorn ni Vite en la computadora para que el dominio público responda. Se puede apagar el entorno local y la web publicada debe seguir funcionando.

Si se reutiliza un proyecto existente, revisar que no conserve overrides de Vite o un Root Directory antiguo. Si cambia una variable del perfil de sonido, crear un nuevo despliegue para que se compile con ella.

### 6. Compartir el enlace para celulares

Abrir el dominio de producción desde una ventana privada sin sesión Vercel y después desde el teléfono. Si pide acceso a Vercel, revisar **Deployment Protection** del proyecto/despliegue específico y elegir un enlace que el equipo de prueba pueda abrir. La protección de un preview puede ser diferente de la de producción. No hace falta cambiar protecciones de otros proyectos ni abrir puertos del router.

## Qué ocurre al subir cambios nuevos

Con la integración Git conectada, Vercel puede generar despliegues a partir de nuevos commits. Los cambios de la rama de producción actualizan producción; otras ramas y pull requests pueden generar previews según la configuración del proyecto. Revisar la rama y el commit mostrados en **Deployments** antes de atribuir un comportamiento a la última versión.

Si un cambio rompe la web, usar un despliegue anterior conocido desde Vercel y revisar la opción de rollback/promoción disponible en el panel. Para revertir solo sonido, cambiar `VITE_SOUND_PROFILE` por uno de los perfiles documentados y desplegar de nuevo. El rollback del sonido no revierte HTML o backend.

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

## Diagnóstico rápido de conexión

| Problema | Qué revisar |
| --- | --- |
| Vercel solo muestra la API o Swagger | Root Directory debe ser la raíz, no `backend/`. |
| Portada 404 o falta `dist` | Logs del build; confirmar `npm ci && npm run build` y ausencia de override de Output Directory. |
| `/api/images` devuelve HTML | Un fallback/rewrite de UI está interceptando `/api`, o se publicó como Vite en vez de FastAPI. |
| Error de importación `core` o `backend` | Entrada `app.py` raíz y carpeta backend completa en el commit publicado. |
| Catálogo o imágenes fallan | `backend/data` en Git y `includeFiles` de `vercel.json`; revisar logs de función. |
| 401/403 o pantalla de login en el teléfono | Acceso del despliegue y Deployment Protection. |
| Funciona localmente pero el dominio tiene cambios antiguos | Commit/rama del despliegue y si los cambios realmente se subieron a GitHub. |
| La voz no comienza | Usar Read image description o Repeat instructions mediante un toque; comprobar voz inglesa y volumen del dispositivo. |
| No suenan instrumentos después de cambiarlos | Activar Enable sound de nuevo y enfocar la imagen antes de usar flechas. |

Documentación oficial adicional: [conexión de repositorios Git](https://vercel.com/docs/git). Las pantallas del servicio pueden cambiar; los valores técnicos que corresponden a esta configuración están en los archivos raíz del repositorio.
