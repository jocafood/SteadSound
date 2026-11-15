import { localizeImage } from '../i18n/images-en.js';
import { narrate, enableNarration, speechSupported } from './narration.js';
import { setHighContrast } from './accessibility.js';
import { abrirReproductor } from './player.js';

const selector = document.getElementById('gallery-select');
const openButton = document.getElementById('gallery-open');
const galleryStatus = document.getElementById('gallery-status');
const contenedor = document.querySelector('.discos');
const spotlight = document.getElementById('spotlight');
const botonPrev = document.getElementById('prev');
const botonNext = document.getElementById('next');
const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let imagenes = [];
let activo = 0;
let primeraVez = true;

async function obtenerImagenes() {
  const response = await fetch('/api/images');
  if (!response.ok) throw new Error('Could not load the image catalog.');
  const data = await response.json();
  if (!Array.isArray(data.images)) throw new Error('The catalog response has an unexpected format.');
  return data.images.map(localizeImage);
}

function crearImg(src, alt) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  return img;
}

function montarDiscos() {
  contenedor.replaceChildren(...imagenes.map((imagen, i) => {
    const disco = document.createElement('button');
    disco.type = 'button';
    disco.setAttribute('aria-label', `Select ${imagen.title}`);
    disco.classList.add('disco');
    disco.appendChild(crearImg(imagen.imageUrl, ''));
    disco.addEventListener('click', () => {
      activo = i;
      render();
    });
    return disco;
  }));
}

function animarDesdeDisco(img, origen) {
  const destino = spotlight.getBoundingClientRect();
  const dx = (origen.left + origen.width / 2) - (destino.left + destino.width / 2);
  const dy = (origen.top + origen.height / 2) - (destino.top + destino.height / 2);
  const sx = Math.max(origen.width / destino.width, 0.02);
  const sy = Math.max(origen.height / destino.height, 0.02);

  img.animate([
    {
      transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
      opacity: 0.4,
      borderRadius: '50%',
    },
    {
      transform: 'translate(0, 0) scale(1, 1)',
      opacity: 1,
      borderRadius: '0px',
    },
  ], {
    duration: 600,
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  });
}

function render() {
  if (!imagenes.length) return;

  const discos = [...contenedor.querySelectorAll('.disco')];
  const origen = discos[activo].getBoundingClientRect();

  discos.forEach((disco, i) => {
    disco.classList.toggle('activo', i === activo);
    disco.setAttribute('aria-pressed', String(i === activo));
    disco.tabIndex = i === activo ? 0 : -1;
  });

  const imagen = imagenes[activo];
  selector.value = imagen.id;
  spotlight.setAttribute("aria-label", `Open ${imagen.title}`);
  galleryStatus.textContent = `${activo + 1} of ${imagenes.length}: ${imagen.title}`;
  const img = crearImg(imagen.imageUrl, imagen.altText);
  spotlight.replaceChildren(img);

  if (!primeraVez && !reducirMovimiento && document.documentElement.dataset.reduceMotion !== "true") {
    animarDesdeDisco(img, origen);
  }
  primeraVez = false;
}

function cambiar(direccion) {
  if (!imagenes.length) return;
  activo = (activo + direccion + imagenes.length) % imagenes.length;
  render();
}

function bump(boton) {
  if (reducirMovimiento || document.documentElement.dataset.reduceMotion === "true") return;
  boton.classList.remove('bump');
  // Forzar un reflow para que la animación se reinicie en clics seguidos.
  void boton.offsetWidth;
  boton.classList.add('bump');
}

function abrirActiva() {
  if (imagenes.length) abrirReproductor(imagenes[activo]);
}

spotlight.setAttribute('role', 'button');
spotlight.setAttribute('aria-label', 'Open image player');
spotlight.tabIndex = 0;
spotlight.addEventListener('click', abrirActiva);
spotlight.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    abrirActiva();
  }
});

botonPrev.tabIndex = 0;
botonNext.tabIndex = 0;
botonPrev.setAttribute('role', 'button');
botonNext.setAttribute('role', 'button');
botonPrev.setAttribute('aria-label', 'Previous image');
botonNext.setAttribute('aria-label', 'Next image');

botonPrev.addEventListener('click', () => {
  bump(botonPrev);
  cambiar(-1);
});
botonNext.addEventListener('click', () => {
  bump(botonNext);
  cambiar(1);
});

// Flechas izquierda y derecha en toda la página, salvo cuando el reproductor está abierto.
document.addEventListener('keydown', event => {
  if (document.getElementById('player').hidden === false || event.target.closest('select, input, textarea, button, a, [contenteditable]')) return;
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    bump(botonPrev);
    cambiar(-1);
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    bump(botonNext);
    cambiar(1);
  }
});

async function iniciar() {
  try {
    imagenes = await obtenerImagenes();
    selector.replaceChildren(...imagenes.map(image => new Option(image.title, image.id)));
    selector.disabled = !imagenes.length; openButton.disabled = !imagenes.length;
    if (!imagenes.length) galleryStatus.textContent = "The catalog is empty.";
    montarDiscos();
    render();
  } catch (error) {
    console.error(error);
    galleryStatus.textContent = 'Could not load the catalog. Select Reload catalog to try again.';
  }
}

selector.addEventListener('change', () => { activo = imagenes.findIndex(image => image.id === selector.value); render(); narrate(`${imagenes[activo].title}. ${imagenes[activo].description}`); });
openButton.addEventListener('click', abrirActiva);
document.getElementById('gallery-retry').addEventListener('click', iniciar);
const motion = document.getElementById('reduce-motion');
motion.checked = reducirMovimiento;
motion.addEventListener('change', () => {
  document.documentElement.dataset.reduceMotion = String(motion.checked);
  if (motion.checked) document.getAnimations().forEach(animation => animation.cancel());
});
iniciar();
document.getElementById('high-contrast').addEventListener('change', event => setHighContrast(event.target.checked));
const guidance = document.getElementById('spoken-guidance');
guidance.disabled = !speechSupported();
if (!speechSupported()) guidance.closest('label').append(' (not supported by this browser)');
guidance.addEventListener('change', () => {
  enableNarration(guidance.checked);
  if (guidance.checked) narrate('English descriptions enabled. Choose an image and open the player. Use Read image description to listen, or Stop narration to cancel.');
});
