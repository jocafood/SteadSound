# Accesibilidad de SteadSound

Esta entrega toma como referencia el checklist aportado por el equipo (`Checklist_Accesibilidad_SteadSound.txt`). El checklist se usa como guía de revisión, no como certificación ni como evidencia de que todos sus puntos estén cumplidos. Se conserva la arquitectura del backend, el catálogo, sus metadatos y la estructura de archivos de imágenes.

## Cambios implementados

### Lectores de pantalla y estructura

La página declara inglés (`lang="en"`) y usa una región principal de catálogo. Toda la presentación del catálogo y los controles del reproductor están en inglés. Las traducciones viven en `frontend/i18n/images-en.js`, sin cambiar los registros del backend. Los enlaces y botones tienen nombres descriptivos; la rocola y el cielo decorativos no añaden descripciones irrelevantes. Un enlace inicial permite saltar directamente a la selección de imágenes.

El catálogo ofrece un `select` nativo, Abrir imagen, Recargar catálogo y un mensaje de carga/selección/error con `role="status"`. Es una alternativa accesible al carrusel visual, que se conserva. Las miniaturas y flechas usan botones nativos; el código ya no duplica el comportamiento Enter/Espacio que aporta el navegador. Las flechas globales de la galería no interceptan teclas cuando el usuario opera un control nativo.

El reproductor presenta la descripción científica existente en el catálogo, además del crédito, el enlace a la fuente y las instrucciones. No se inventó ni cambió información científica. El panel desplegable explica también la relación artística entre color, timbre, volumen y tempo: la ciencia se puede leer sin oír la sonificación.

### Gestión del diálogo y foco

El diálogo tiene nombre mediante su encabezado y mantiene `aria-modal`. Al abrirlo, se registra el control de origen, el fondo pasa a `inert` y el foco entra en Cerrar. Tab y Mayús+Tab recorren los controles visibles del diálogo, sin saltar al catálogo. Escape y Cerrar detienen el audio, cierran el diálogo, restauran la interacción del fondo y devuelven el foco al control de origen. No es una trampa sin salida: Cerrar y Escape están disponibles.

Durante cargas se indica `aria-busy`. Un token de apertura evita que una carga antigua cambie mensajes después de cerrar o volver a abrir. Al ocultarse la pestaña se detiene el sonido.

### Exploración y anuncios

Se retiraron el selector de región y el botón Explorar región por petición de diseño. Se conserva la exploración por ratón, tacto y teclado en el canvas, además del escáner automático. Enter o Espacio sobre el canvas reproduce el punto actual. Las descripciones científicas siguen disponibles como texto y mediante lectura en voz alta.

La lectura informa coordenadas, RGB, familia sonora y frecuencia, o silencio en zonas oscuras. Hay un área visual y una región de anuncios separada, `aria-live="polite"` y `aria-atomic`. Las muestras se anuncian tras 300 ms sin nuevos movimientos para no acumular cientos de mensajes durante un arrastre. El escáner actualiza su estado visual en cada banda, pero anuncia solo avances aproximados de 25 %, además del inicio y final. Las regiones ARIA siguen funcionando con el lector de pantalla externo. Ahora se ofrece además narración optativa mediante `speechSynthesis`, descrita más abajo.

### Volumen y movimiento

El control de volumen es un rango nativo de 0 a 100 con etiqueta y valor visible. Se aplica al destino maestro de Tone.js, en todos los perfiles. Cero silencia la salida; los valores mayores se convierten a decibelios con un fundido breve. El valor inicial es 50 % y se aplica al activar audio o iniciar el escaneo. No se guarda en base de datos ni en almacenamiento persistente.

Se respetan las preferencias del sistema `prefers-reduced-motion` y se ofrece **Reducir movimiento** en la galería. La opción desactiva animaciones/transiciones no esenciales y evita nuevos cometas. No se altera el recorrido sonoro del escáner. Los controles tienen foco visible y objetivos táctiles ampliados; a anchuras pequeñas o ventanas bajas se permite desplazamiento y reorganización de los controles, conservando el diseño de rocola en escritorio.

## Archivos responsables

| Archivo | Responsabilidad |
| --- | --- |
| `index.html` | Semántica, etiquetas, selector de catálogo, descripción, narración, contraste, volumen y áreas de estado. |
| `frontend/main/accessibility.js` | Gestión del foco modal y descripción textual de una muestra. |
| `frontend/main/discos.js` | Selector nativo, botones de galería, reintento, estados y movimiento reducido. |
| `frontend/main/player.js` | Ciclo del diálogo, anuncios espaciados, narración, volumen, cancelación y cargas obsoletas. |
| `frontend/main/player.css` | Foco, tamaños, reflujo, contenido solo para lectores y reducción de movimiento. |
| `frontend/main/cielo.js`, `cielo-principal.js`, `titulo.js` | Evitar nuevos efectos decorativos cuando se reduce movimiento. |
| `sound.js` | `ajustarVolumen(value)`: número finito entre 0 y 1; no cambia las API de imágenes ni sus registros. |

## Estado frente al checklist

| Área | Estado de esta entrega |
| --- | --- |
| Alternativas textuales, descripciones y crédito | Implementadas a partir de los campos existentes. La calidad científica y claridad editorial requieren revisión humana. |
| Selección y reproducción por teclado | Implementadas; verificadas con automatización de navegador. |
| Soporte semántico para lectores de pantalla | Implementado con controles nativos, foco y regiones vivas; pendiente escuchar el recorrido con NVDA/Firefox y VoiceOver/Safari. |
| Detener y volumen/silencio | Implementados. No hay un botón de pausa con reanudación del escáner en la misma fila; Detener cancela y un nuevo escaneo comienza arriba. |
| Movimiento reducido | Preferencia del sistema y opción visible implementadas. |
| Zoom, reflujo y contraste | Hay ajustes para ventanas estrechas; requiere además revisión manual al 400 % y contraste sobre todos los estados y fondos. |
| Compatibilidad entre navegadores y dispositivos | La verificación automatizada usa Chromium; Safari, Firefox y dispositivos físicos quedan pendientes. |
| Pruebas con personas ciegas o con baja visión | Pendientes; no se sustituye su evaluación por axe. |
| Comandos de voz | No implementados; se conservan etiquetas claras para controles nativos. |

## Cómo verificar manualmente

1. Ejecutar `docker compose up --build -d` desde la raíz y abrir `http://localhost:8080`.
2. Sin ratón, pulsar Tab: comprobar enlace de salto, selección de imagen, anterior/siguiente y Abrir imagen. Seleccionar otra imagen sin activar sonido.
3. Abrir el reproductor. Comprobar foco en Cerrar, descripción accesible y navegación circular con Tab/Mayús+Tab. Escape debe cerrar y devolver el foco a Abrir imagen o al control usado.
4. Enfocar el canvas y usar las flechas. Pulsar Enter para leer/reproducir el punto actual. Activar sonido desde el botón y repetir. Comprobar volumen 0, 50 y 100, y Stop sound. Usar Read image description y Stop narration para comprobar la lectura en inglés.
5. Recorrer el canvas con flechas y comprobar las instrucciones del lector si reserva las flechas para su navegación. Escanear: comprobar anuncios de progreso espaciados y cancelación al cerrar.
6. Con NVDA o VoiceOver, escuchar el recorrido. Comprobar que la descripción, nombres, selección, mensajes de error y final del escaneo se anuncian sin saturación. Ajustar el volumen para que no tape al lector.
7. Activar movimiento reducido y comprobar cielo, título, carrusel y diálogo. Probar zoom 200/400 %, navegación con teclado y una ventana de 320 píxeles CSS sin pérdida de controles.
8. Probar errores apagando el backend y pulsando Recargar catálogo; comprobar recuperación posterior. Revisar en Safari y Firefox y recopilar comentarios de usuarios.

## Referencias y alcance

Se siguieron el [patrón WAI de diálogo modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) y la guía de [mensajes de estado WCAG](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html). La combinación de comprobaciones automáticas y estas mejoras no establece por sí sola conformidad WCAG 2.2 AA. No se afirma que se haya probado un lector de pantalla real cuando solo se ha comprobado el DOM y las interacciones de navegador.

## Verificación realizada en esta entrega

- Compilación de producción y contenedores Docker: correctos.
- Las 15 pruebas JavaScript existentes pasaron.
- Playwright + axe en Chromium, reglas etiquetadas WCAG 2 A/AA, 2.1 AA y 2.2 AA: cero infracciones detectadas en las vistas examinadas de galería y diálogo. Esto no cubre todos los criterios ni sustituye revisión manual.
- Automatización de teclado: selección de catálogo, apertura, ciclo Tab/Mayús+Tab, fondo inerte, Escape y retorno de foco al botón de apertura: correctos.
- Descripción disponible, exploración del canvas con anuncio textual y control de volumen hasta cero: correctos en la interacción de navegador.
- Ventana de 320 × 800 píxeles CSS: sin desbordamiento horizontal en las vistas examinadas de galería y diálogo.
- Sin errores JavaScript observados durante ese recorrido. El esquema del catálogo y los archivos del backend no se modificaron.

## Narración en inglés, contraste y Enter

Esta revisión sustituye los controles de región por una presentación más sencilla y añade:

- **Voice guidance**: activa descripciones habladas al abrir o seleccionar una imagen, sin reproducción automática antes de optar por ella.
- **Read image description**: lee explícitamente el título, la descripción y las instrucciones en inglés. Detiene primero la sonificación para que ambas salidas no compitan.
- **Stop narration**: cancela la voz sin iniciar sonido musical. Abrir reproducción musical, iniciar escaneo, cerrar, ocultar la pestaña o abandonar la página cancela la voz.
- **High contrast**: fondo negro, texto blanco, controles/enlaces amarillos y foco cian. Los controles de galería y reproductor están sincronizados. No altera el color de la imagen científica ni del píxel leído: cambiar esos colores modificaría la sonificación.
- **Enter sobre casillas**: llama a `click()` exactamente una vez; evita repetición al mantener la tecla. Space y los botones/enlaces conservan su comportamiento nativo. Los selectores y el rango mantienen sus interacciones estándar; no se fuerza un clic sobre cualquier elemento.

La implementación de voz está en `frontend/main/narration.js`. Cada solicitud usa `lang="en-US"` y prefiere una voz inglesa instalada. Si el navegador informa voces pero ninguna es inglesa, comunica un error en vez de elegir una voz española. Si la lista aún está vacía, solicita inglés al motor mediante el idioma de la locución. El soporte y las voces dependen del navegador/sistema; los controles se deshabilitan si falta Web Speech. No se envía una petición de voz a nuestro backend; la implementación de voz del navegador puede usar su propio servicio. La narración no sustituye NVDA/VoiceOver ni lee automáticamente todo el DOM.

Las 20 traducciones de títulos, descripciones y textos alternativos se aplican únicamente en la capa de UI. Los IDs, metadatos originales, fuentes, imágenes y esquema de datos se conservan. Para agregar imágenes debe añadirse también su traducción; la prueba `english.test.js` comprueba cobertura del catálogo actual.

Referencias: [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API), [idioma de locución](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/lang).

### Verificación de esta revisión

Se prueban cambios de casillas con Enter sin doble activación, contraste sincronizado, ausencia de controles de región, contenido inglés y solicitudes de voz `en-US`. La automatización simula la interfaz de voz para comprobar texto, idioma y cancelación: no certifica que una voz instalada en el equipo del usuario se escuche correctamente. Esa escucha y las pruebas con un lector externo siguen siendo manuales.

Resultado final de esta revisión: 16 pruebas JavaScript aprobadas; comprobación de solicitudes de voz `en-US` y cancelación con voz simulada; Enter en casillas sin doble cambio; cero infracciones axe detectadas en la galería y en los dos temas del reproductor en los estados examinados. Se eliminaron los fundidos de apertura en alto contraste y las transiciones de fondo de los botones que podían producir contrastes transitorios bajos.

## Correcciones de narración para móviles

Se solicita voz al abrir dentro del gesto del usuario, antes de esperar la imagen; se actualizan voces asincrónicas, se fragmentan textos largos, se ignoran callbacks de lecturas canceladas y se informa si no comienza la voz. Ver [detalles y despliegue](DESPLIEGUE-VERCEL.md). Estas medidas no garantizan que un dispositivo sin voz inglesa instalada pueda hablar.

## Guía hablada de los controles

La opción **Voice guidance**, disponible y sincronizada tanto en galería como en reproductor, activa una guía de navegación en inglés. Al activarla explica cómo avanzar con Tab, retroceder con Mayús+Tab y activar controles con Enter. No se activa voz automáticamente sin consentimiento.

`frontend/main/control-guidance.js` describe los controles mediante una tabla de funciones y delegación de eventos. Al recibir foco se anuncia nombre, tipo, función, estado y acción de teclado. Selectores anuncian la opción actual; casillas, si están marcadas; volumen, su porcentaje. Cambios de opción y expansión de instrucciones actualizan el anuncio. La música y el escáner mantienen sus controles y comportamiento.

Las explicaciones también se enlazan con `aria-describedby`, conservando las descripciones anteriores del canvas. Los textos auxiliares están ocultos visualmente y no duplican contenido en la navegación normal. Las miniaturas creadas dinámicamente reciben ayuda después de cargar el catálogo. No se modifica el backend, el catálogo ni sus traducciones.

Se cancela el mensaje anterior al pasar a otro control para evitar colas de instrucciones obsoletas. **Stop narration** cancela el mensaje actual pero no desactiva la guía: el siguiente foco puede volver a hablar. Desmarcar **Voice guidance** desactiva todos los anuncios de controles. El usuario de VoiceOver, TalkBack o NVDA puede dejarla apagada y seguir utilizando los nombres, roles y descripciones accesibles nativos.

La guía por foco no reemplaza los gestos de exploración de un lector móvil: para navegación táctil accesible se recomienda VoiceOver o TalkBack. La voz integrada depende de Web Speech y de las voces inglesas del dispositivo. No se interpreta que una prueba con voz simulada equivalga a una validación auditiva con un lector externo real.

Verificación de guía de controles: 17 pruebas JavaScript aprobadas y compilación correcta. En navegador se comprobaron solicitudes habladas en inglés al enfocar Abrir imagen, contraste, escáner, volumen, instrumento y Cerrar; anuncios de estado de casillas; sincronización de la guía entre galería y diálogo; desactivación sin nuevas locuciones; referencias ARIA; y cero infracciones axe en el estado examinado. Las solicitudes de voz se registraron con una interfaz de síntesis simulada; sigue pendiente escuchar el recorrido con las voces y lectores reales de cada dispositivo.

## Preferencia inicial y lectura explícita de descripciones

Voice guidance inicia activado y ambas casillas aparecen marcadas. Puede desactivarse en cualquiera de las dos vistas. No se fuerza audio durante la carga: los anuncios ocurren al interactuar/enfocar controles y siguen sujetos a la política del navegador.

Seleccionar o abrir una imagen anuncia únicamente el título y una instrucción breve. Enfocar el canvas anuncia su nombre e instrucciones, sin referenciar la descripción científica completa mediante ARIA. La descripción sigue en el panel de texto y solo se solicita su narración completa con **Read image description**. Esto evita repetirla al explorar o enfocar una imagen. La lectura explícita sigue disponible aunque Voice guidance esté desactivado.

## Secuencia explícita para escuchar

Las instrucciones quedan siempre visibles en el reproductor y se referencian desde el canvas. La guía de botones e instrumentos explica: activar **Enable sound**, enfocar **Image explorer** con Tab o Mayús+Tab y usar flechas. Cambiar cualquier instrumento, capa o combinación detiene el sonido; el estado y las descripciones recuerdan activar **Enable sound** de nuevo antes de continuar. No se modifica el foco automáticamente ni se reactiva audio sin una acción del usuario.

## Instrucciones solo una vez y repetición manual

Se retiraron las dos casillas legacy de activación de Voice guidance. La guía breve de controles permanece activa; al enfocar se anuncia solo nombre, tipo y estado/valor. Las explicaciones para lectores externos permanecen enlazadas por ARIA, pero ya no repiten la secuencia larga de Enable sound en cada control.

Las instrucciones completas del reproductor se narran en la primera apertura de la sesión de pestaña. `frontend/main/instructions.js` registra esa presentación en `sessionStorage`, con respaldo en memoria si el navegador bloquea almacenamiento. Reabrir o recargar la misma pestaña no reinicia el tutorial. **Repeat instructions** detiene música y lee el tutorial una única vez por pulsación; no lo vuelve a activar automáticamente. **Read image description** sigue siendo independiente y solo lee la imagen al solicitarla.

## Silencio durante exploración por teclado

Las flechas, Enter y Espacio sobre el canvas cancelan inmediatamente la narración integrada y los anuncios de píxeles pendientes. Mientras el foco permanece en esa exploración, solo se actualiza la lectura visual y la región de anuncios pasa a `aria-live="off"`; las notas instrumentales continúan si el audio está activado. Al salir del canvas se recuperan los anuncios de controles sin leer muestras antiguas. No se desactiva la guía global ni se cambia el volumen de los instrumentos. Un lector externo conserva sus propios ajustes de eco de teclas: la página no puede silenciar el software del usuario.
