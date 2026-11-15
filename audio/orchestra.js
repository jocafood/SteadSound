import { pixelToAmbient } from './mapping.js';

/** Representación estratificada de todo el canvas, sin leer millones de píxeles. */
export function sampleImage(context, imageId, columns = 12, rows = 8) {
  const { width, height } = context.canvas;
  const samples = [];
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const x = Math.min(width - 1, Math.floor((col + 0.5) / columns * width));
    const y = Math.min(height - 1, Math.floor((row + 0.5) / rows * height));
    const [r, g, b] = context.getImageData(x, y, 1, 1).data;
    samples.push({ imageId, color: { r, g, b } });
  }
  return samples;
}

export function imageChord(samples, limit = 5) {
  const groups = new Map();
  for (const sample of samples) {
    const note = pixelToAmbient(sample.color);
    if (note.silent) continue;
    const entry = groups.get(note.midi) ?? { ...note, count: 0 };
    entry.count++;
    groups.set(note.midi, entry);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.midi - b.midi).slice(0, limit);
}
