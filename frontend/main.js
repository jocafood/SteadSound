import './style.css';
import { ImageSoundExplorer } from './explorer.js';

const $ = id => document.getElementById(id);
const canvas = $('image');
const explorer = new ImageSoundExplorer(canvas);
let records = [], loadingCatalog = false;
const status = message => { $('status').textContent = message; };
explorer.addEventListener('status', event => status(event.detail));
explorer.addEventListener('imagechange', ({ detail: image }) => {
  $('title').textContent = image.title;
  $('description').textContent = image.description;
  $('credit').textContent = image.credit;
  $('source').href = image.sourceUrl;
  $('source').hidden = false;
  canvas.setAttribute('aria-label', image.altText);
  $('start').disabled = false;
  $('reading').textContent = 'Selecciona un punto de la imagen.';
  $('payload').textContent = 'Sin muestra todavía.';
});
explorer.addEventListener('sample', ({ detail: { sample, sound } }) => {
  const { r, g, b } = sample.color;
  $('reading').textContent = `Píxel (${sample.position.x}, ${sample.position.y}) · RGB ${r}, ${g}, ${b}${sound ? ` · ${sound.frequency.toFixed(1)} Hz` : ' · Audio desactivado'}`;
  $('payload').textContent = JSON.stringify(sample, null, 2);
});
async function selectImage() {
  explorer.stop();
  $('start').disabled = true;
  $('stop').disabled = true;
  const record = records.find(image => image.id === $('images').value);
  if (record) {
    try { await explorer.load(record); } catch (error) { console.error(error); }
  }
}
async function loadCatalog() {
  if (loadingCatalog) return;
  loadingCatalog = true;
  $('retry').disabled = true;
  $('images').disabled = true;
  status('Cargando catálogo…');
  try {
    records = await explorer.list();
    $('images').replaceChildren(...records.map(image => new Option(image.title, image.id)));
    if (!records.length) { explorer.dispose(); $('start').disabled = true; $('stop').disabled = true; status('El catálogo está vacío.'); }
    else { $('images').disabled = false; await selectImage(); }
  } catch (error) { status(error.message); }
  finally { loadingCatalog = false; $('retry').disabled = false; }
}
$('images').addEventListener('change', selectImage);
$('retry').addEventListener('click', loadCatalog);
let audioRequest = 0;
$('start').addEventListener('click', async () => {
  const request = ++audioRequest;
  $('start').disabled = true;
  $('stop').disabled = false;
  try { await explorer.start(); }
  catch { status('No se pudo activar el audio. Vuelve a pulsar Activar audio.'); }
  finally { if (request === audioRequest) $('start').disabled = !explorer.image; }
});
function stop() { audioRequest++; explorer.stop(); $('start').disabled = !explorer.image; $('stop').disabled = true; }
$('stop').addEventListener('click', stop);
let pointer;
canvas.addEventListener('pointerdown', event => {
  if (!explorer.image || (event.pointerType === 'mouse' && event.button !== 0)) return;
  pointer = event.pointerId;
  canvas.setPointerCapture(pointer);
  canvas.focus({ preventScroll: true });
  explorer.point(event.clientX, event.clientY);
});
canvas.addEventListener('pointermove', event => { if (pointer === event.pointerId) explorer.point(event.clientX, event.clientY); });
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(name, () => { pointer = undefined; });
canvas.addEventListener('keydown', event => {
  const step = event.shiftKey ? 50 : 10;
  const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  if (moves[event.key]) { event.preventDefault(); explorer.move(...moves[event.key]); }
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); explorer.move(0, 0); }
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') stop(); });
window.addEventListener('blur', stop);
window.addEventListener('pagehide', () => explorer.dispose());
loadCatalog();
