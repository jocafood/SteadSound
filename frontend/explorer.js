import { sampleImage } from '../audio/orchestra.js';
import { obtenerImagenes } from './api.js';
import { clientToPixel, samplePixel } from './pixels.js';
import { iniciarAudio, detenerAudio, reproducirSonido, reproducirOrquesta } from '../sound.js';

/** Conexión reusable. Emite sample, imagechange y status sin construir UI. */
export class ImageSoundExplorer extends EventTarget {
  constructor(canvas) {
    super();
    this.canvas = canvas;
    this.context = canvas.getContext('2d', { willReadFrequently: true });
    this.version = 0;
    this.image = null;
  }
  list(options) { return obtenerImagenes(options); }
  status(message) { this.dispatchEvent(new CustomEvent('status', { detail: message })); }
  async load(record) {
    const version = ++this.version;
    this.image = null;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.status('Cargando imagen…');
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = record.imageUrl;
    try {
      await image.decode();
      if (version !== this.version) return;
      this.canvas.width = image.naturalWidth;
      this.canvas.height = image.naturalHeight;
      this.context.drawImage(image, 0, 0);
      // Fallar aquí si el origen no permite lectura, antes de explorar.
      this.context.getImageData(0, 0, 1, 1);
      this.image = record;
      this.x = Math.floor((this.canvas.width - 1) / 2);
      this.y = Math.floor((this.canvas.height - 1) / 2);
      this.dispatchEvent(new CustomEvent('imagechange', { detail: record }));
      this.status('Imagen lista. Activa el audio y toca la imagen o usa las flechas.');
    } catch (error) {
      if (version !== this.version) return;
      this.status('No se pudo leer la imagen. Selecciona otra o vuelve a intentarlo.');
      throw error;
    }
  }
  async start() {
    if (await iniciarAudio()) this.status('Audio activado. Toca o arrastra sobre la imagen para escuchar.');
  }
  async orchestra() {
    if (!this.image) throw new Error("Selecciona una imagen primero.");
    const result = await reproducirOrquesta(sampleImage(this.context, this.image.id));
    return result;
  }
  stop() { detenerAudio(); this.status('Audio detenido.'); }
  sample(x, y) {
    if (!this.image) return null;
    const sample = samplePixel(this.context, this.image.id, x, y);
    this.x = x; this.y = y;
    const sound = reproducirSonido(sample);
    this.dispatchEvent(new CustomEvent('sample', { detail: { sample, sound } }));
    return sample;
  }
  point(clientX, clientY) {
    if (!this.image) return null;
    const position = clientToPixel(clientX, clientY, this.canvas.getBoundingClientRect(), this.canvas.width, this.canvas.height);
    return position ? this.sample(position.x, position.y) : null;
  }
  move(dx, dy) {
    if (!this.image) return;
    this.sample(Math.max(0, Math.min(this.canvas.width - 1, this.x + dx)), Math.max(0, Math.min(this.canvas.height - 1, this.y + dy)));
  }
  dispose() { this.version++; this.image = null; this.stop(); }
}
