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

export function imageChord(samples, limit = 5, mapper = pixelToAmbient) {
  const groups = new Map();
  for (const sample of samples) {
    const note = mapper(sample.color);
    if (note.silent) continue;
    const key = `${note.midi}:${note.family ?? "ambient"}`;
    const entry = groups.get(key) ?? { ...note, count: 0 };
    entry.count += sample.count ?? 1;
    groups.set(key, entry);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.midi - b.midi).slice(0, limit);
}
