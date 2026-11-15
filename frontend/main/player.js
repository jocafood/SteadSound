import { readInstructions } from './instructions.js';
import { narrate, stopNarration, speechSupported } from './narration.js';
import { setHighContrast } from './accessibility.js';
import { containModalFocus, describePixel } from './accessibility.js';
import { ImageSoundExplorer } from '../explorer.js';
import {
  SOUND_PROFILE,
  admiteInstrumentos,
  audioActivo,
  configurarInstrumentos,
  pausarExploracion,
  mantenerExploracion,
  ajustarVolumen,
} from '../../sound.js';
import { iniciarCielo } from './cielo.js';

const $ = id => document.getElementById(id);
const root = $('player');
const canvas = $('player-canvas');
const explorer = new ImageSoundExplorer(canvas);
const modalFocus = containModalFocus(root, $('gallery'));
let announcementTimer, scanQuarter = -1, openToken = 0, keyboardExploring = false;
const announce = message => { $('player-announcement').textContent = message; };
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const guitarSupported = SOUND_PROFILE === 'ensemble-static' || SOUND_PROFILE === 'ensemble' || SOUND_PROFILE === 'ensemble-percussion';

let isOpen = false;
let current = null;
let pointerId = null;
let orchestraToken = 0, scanning = false;
const scanLine = document.createElement('div');
scanLine.className = 'player-scan-line';
scanLine.hidden = true;
scanLine.setAttribute('aria-hidden', 'true');
root.append(scanLine);
explorer.addEventListener('scanprogress', ({ detail: row }) => {
  if (!scanning) return;
  const rect = canvas.getBoundingClientRect();
  scanLine.hidden = false;
  scanLine.style.left = `${rect.left}px`;
  scanLine.style.width = `${rect.width}px`;
  scanLine.style.top = `${rect.top + row.progress * rect.height}px`;
  const message = `Scanning rows ${row.yStart + 1} to ${row.yEnd} of ${row.height}. ${Math.round(row.progress * 100)} percent.`;
  setStatus(message, false);
  const quarter = Math.floor(row.progress * 4);
  if (quarter > scanQuarter) { scanQuarter = quarter; announce(`Scan: ${quarter * 25} percent.`); }
});
let clipAnimation = null;
let lastFocus = null;

iniciarCielo($('player-sky'), { estaVisible: () => isOpen });

function setStatus(message, speak = true) {
  $('player-status').textContent = message;
  if (speak) announce(message);
}

function spotlightRect() {
  const rect = $('spotlight').getBoundingClientRect();
  if (rect.width && rect.height) return rect;
  // Respaldo si el spotlight no está visible: anima desde el centro.
  const size = 48;
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  return { left: cx - size / 2, top: cy - size / 2, right: cx + size / 2, bottom: cy + size / 2 };
}

function clipFor(rect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return `inset(${rect.top}px ${vw - rect.right}px ${vh - rect.bottom}px ${rect.left}px round 10px)`;
}

function rectDeImagenContenida(destino) {
  // Replica object-fit: contain del spotlight para que la imagen aterrice en su tamaño real.
  const aspecto = canvas.width / canvas.height;
  const ancho = destino.right - destino.left;
  const alto = destino.bottom - destino.top;
  let w = ancho;
  let h = ancho / aspecto;
  if (h > alto) {
    h = alto;
    w = alto * aspecto;
  }
  return {
    left: destino.left + (ancho - w) / 2,
    top: destino.top + (alto - h) / 2,
    width: w,
    height: h,
  };
}

// Instrumentos disponibles según el perfil de sonido compilado.
if (!guitarSupported) {
  $('player-instrument').querySelector('option[value="guitar"]')?.remove();
  $('player-layers').querySelector('input[value="guitar"]')?.closest('label')?.remove();
}
$('player-instruments').hidden = !admiteInstrumentos;

explorer.addEventListener('imagechange', () => {
  $('player-description').textContent = explorer.image.description;
  canvas.setAttribute('aria-label', `Image explorer: ${explorer.image.title}`);
  const rhythm = explorer.rhythm;
  $('player-tempo').textContent = rhythm
    ? `Tempo ${rhythm.bpm} BPM · Brightness ${Math.round(rhythm.luminance * 100)}% · Vibrance ${Math.round(rhythm.vibrance * 100)}%`
    : '';
});

explorer.addEventListener('sample', ({ detail: { sample, sound } }) => {
  const { r, g, b } = sample.color;
  $('player-swatch').style.background = `rgb(${r}, ${g}, ${b})`;
  const message = describePixel(sample, sound);
  $('player-reading').textContent = message;
  clearTimeout(announcementTimer);
  if (!keyboardExploring) announcementTimer = setTimeout(() => { if (isOpen && !scanning && !keyboardExploring) announce(message); }, 300);
});

function syncControls() {
  const on = audioActivo();
  const button = $('player-audio');
  button.textContent = on ? 'Stop sound' : 'Enable sound';
  button.setAttribute('aria-pressed', String(on));
  button.classList.toggle('is-on', on);
  $('player-orchestra').disabled = !current || !explorer.image || scanning;
}

function stopPlayback() {
  clearTimeout(announcementTimer);
  orchestraToken++; scanning = false; scanLine.hidden = true;
  explorer.stop();
  syncControls();
}

async function toggleAudio() {
  stopNarration();
  if (audioActivo()) {
    stopPlayback();
    setStatus('Sound stopped.');
    return;
  }
  try {
    ajustarVolumen(Number($("player-volume").value) / 100);
    await explorer.start();
    if (audioActivo()) setStatus('Sound enabled.');
  } catch {
    setStatus('Could not enable sound. Try again.');
  }
  syncControls();
}

async function playWhole() {
  stopNarration();
  if (scanning) return;
  const token = ++orchestraToken;
  scanning = true; syncControls();
  try {
    ajustarVolumen(Number($('player-volume').value) / 100);
    scanQuarter = -1;
    if (!audioActivo()) await explorer.start();
    if (token !== orchestraToken || !audioActivo()) return;
    setStatus('Scanning the image from top to bottom…');
    syncControls();
    const result = await explorer.orchestra();
    if (token === orchestraToken) {
      setStatus(result.reason === 'silent'
        ? 'This image is dark: silence.'
        : 'Scan complete. Sound is off.');
    }
  } catch {
    if (token === orchestraToken) setStatus('Could not play the image. Try again.');
  } finally {
    if (token === orchestraToken) { scanning = false; scanLine.hidden = true; syncControls(); }
  }
}

function applyInstruments() {
  stopPlayback();
  const combine = $('player-combine').checked;
  let selected = combine
    ? [...$('player-layers').querySelectorAll('input:checked')].map(input => input.value)
    : [$('player-instrument').value];
  if (!selected.length) {
    $('player-layers').querySelector('input[value="piano"]').checked = true;
    selected = ['piano'];
  }
  configurarInstrumentos(selected);
  $('player-layers').hidden = !combine;
  $('player-instrument').disabled = combine;
  setStatus("Instruments updated. Sound is off.");
  syncControls();
}

canvas.addEventListener('pointerdown', event => {
  if (scanning || !explorer.image || (event.pointerType === 'mouse' && event.button !== 0)) return;
  pointerId = event.pointerId;
  canvas.setPointerCapture(event.pointerId);
  canvas.focus({ preventScroll: true });
  explorer.point(event.clientX, event.clientY);
  mantenerExploracion();
});

canvas.addEventListener('pointermove', event => {
  if (pointerId !== event.pointerId) return;
  explorer.point(event.clientX, event.clientY);
  mantenerExploracion();
});

for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  canvas.addEventListener(name, () => {
    pointerId = null;
    pausarExploracion();
  });
}

function silenceForKeyboardExploration() {
  keyboardExploring = true;
  clearTimeout(announcementTimer);
  stopNarration();
  $('player-announcement').setAttribute('aria-live', 'off');
  $('player-announcement').textContent = '';
}
canvas.addEventListener('blur', () => {
  keyboardExploring = false;
  clearTimeout(announcementTimer);
  $('player-announcement').textContent = '';
  $('player-announcement').setAttribute('aria-live', 'polite');
});
canvas.addEventListener('keydown', event => {
  const step = event.shiftKey ? 50 : 10;
  const moves = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
  };
  if (moves[event.key]) {
    silenceForKeyboardExploration();
    event.preventDefault();
    explorer.move(...moves[event.key]);
  }
  if (event.key === 'Enter' || event.key === ' ') {
    silenceForKeyboardExploration();
    event.preventDefault();
    explorer.move(0, 0);
  }
});

$('player-audio').addEventListener('click', toggleAudio);
$('player-orchestra').addEventListener('click', playWhole);
$('player-instrument').addEventListener('change', applyInstruments);
$('player-combine').addEventListener('change', applyInstruments);
$('player-layers').addEventListener('change', applyInstruments);
$('player-close').addEventListener('click', cerrarReproductor);

document.addEventListener('keydown', event => {
  if (isOpen && event.key === 'Escape') cerrarReproductor();
});
window.addEventListener('blur', () => {
  if (isOpen) stopPlayback();
});
window.addEventListener('pagehide', () => explorer.dispose());

export async function abrirReproductor(record) {
  root.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
  current = record;
  isOpen = true;
  const opening = ++openToken;
  lastFocus = document.activeElement;
  modalFocus.open();
  document.querySelector('.skip-link').inert = true;

  $('player-title').textContent = record.title;
  $('player-credit').textContent = record.credit;
  $('player-source').href = record.sourceUrl;
  canvas.setAttribute('aria-label', `Image explorer: ${record.title}`);
  $('player-reading').textContent = 'Select a point on the image.';
  $('player-tempo').textContent = '';
  $('player-swatch').style.background = '';
  setStatus('Loading image…');
  root.hidden = false;
  $('player-description').textContent = record.description;
  root.setAttribute('aria-busy', 'true');
  syncControls();

  if (!reduceMotion && document.documentElement.dataset.reduceMotion !== 'true' && document.documentElement.dataset.highContrast !== 'true') {
    // La vista se expande desde el spotlight.
    clipAnimation?.cancel();
    clipAnimation = root.animate(
      [{ clipPath: clipFor(spotlightRect()) }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }],
      { duration: 650, easing: EASE },
    );
    root.querySelector('.player-inner').animate(
      [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
      { duration: 500, delay: 180, easing: EASE, fill: 'backwards' },
    );
  }

  $('player-close').focus({ preventScroll: true });
  // Narrate while opening is still inside the user's click, before image.decode().
  if (!readInstructions()) narrate(record.title);

  try {
    await explorer.load(record);
    if (!isOpen || opening !== openToken) return;
    root.removeAttribute("aria-busy");
    setStatus('Image ready.');

    syncControls();
  } catch {
    if (!isOpen || opening !== openToken) return;
    root.removeAttribute('aria-busy');
    setStatus('Could not read this image. Close the player and choose another one.');
  }
}

export async function cerrarReproductor() {
  if (!isOpen) return;
  stopNarration();
  isOpen = false; openToken++;
  current = null;
  stopPlayback();

  if (!reduceMotion && document.documentElement.dataset.reduceMotion !== 'true' && document.documentElement.dataset.highContrast !== 'true') {
    const origen = canvas.getBoundingClientRect();
    const destino = rectDeImagenContenida(spotlightRect());
    const escala = destino.width / origen.width;
    const dx = (destino.left + destino.width / 2) - (origen.left + origen.width / 2);
    const dy = (destino.top + destino.height / 2) - (origen.top + origen.height / 2);

    // 1. Ocultar cabecera, controles y estrellas. La imagen se queda a tamaño de reproductor.
    const ocultos = root.querySelectorAll('.player-top, .player-dock, .player-sky');
    await Promise.all([...ocultos].map(el =>
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-out', fill: 'forwards' })
        .finished.catch(() => {})
    ));
    if (isOpen) return;

    // 2. La imagen se encoge hacia el spotlight; el fondo se desvanece al final.
    const encoger = canvas.animate([
      { transform: 'translate(0px, 0px) scale(1)' },
      { transform: `translate(${dx}px, ${dy}px) scale(${escala})` },
    ], { duration: 520, easing: EASE, fill: 'forwards' });
    root.animate([
      { opacity: 1 },
      { opacity: 1, offset: 0.85 },
      { opacity: 0 },
    ], { duration: 520, fill: 'forwards' });
    await encoger.finished.catch(() => {});
  }

  // Si el usuario volvió a abrir durante la animación, no ocultar.
  if (isOpen) return;
  root.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
  root.hidden = true;
  modalFocus.close();
  document.querySelector('.skip-link').inert = false;
  lastFocus?.focus?.({ preventScroll: true });
}
$('player-volume').addEventListener('input', event => {
  const value = Number(event.target.value);
  ajustarVolumen(value / 100);
  $('player-volume-value').textContent = `${value} %`;
});
document.addEventListener('visibilitychange', () => { if (document.hidden && isOpen) stopPlayback(); });

$('player-describe').disabled = !speechSupported();
$('player-stop-narration').disabled = !speechSupported();
$('player-describe').addEventListener('click', () => {
  stopPlayback();
  if (current) {
    setStatus('Reading the image description in English.');
    narrate(`${current.title}. ${current.description}`, true);
  }
});
$('player-stop-narration').addEventListener('click', () => { stopNarration(); setStatus('Narration stopped.'); });
$('player-contrast').addEventListener('change', event => setHighContrast(event.target.checked));
document.addEventListener('narrationerror', event => {
  const message = ['not-allowed', 'not-started'].includes(event.detail)
    ? 'Speech did not start. Tap Read image description again. Check that your device has an English voice.'
    : 'Speech is unavailable. Enable an English voice in your device settings, then tap Read image description. The text remains available below.';
  if (isOpen) setStatus(message);
  else $('gallery-status').textContent = message;
});

$('player-repeat-instructions').disabled = !speechSupported();
$('player-repeat-instructions').addEventListener('click', () => {
  stopPlayback();
  readInstructions({ repeat: true });
});
