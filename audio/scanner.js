import { imageChord } from './orchestra.js';
import { pixelToDynamic } from './dynamic-mapping.js';

/** Todos los píxeles participan. Se agrupan filas contiguas en bandas audibles. */
export function buildScan(context, bands = 32) {
  const { width, height } = context.canvas;
  const count = Math.min(height, bands);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const yStart = Math.floor(i * height / count);
    const yEnd = Math.floor((i + 1) * height / count);
    const { data } = context.getImageData(0, yStart, width, yEnd - yStart);
    const bins = new Map();
    for (let p = 0; p < data.length; p += 4) {
      const r = data[p], g = data[p + 1], b = data[p + 2];
      const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
      const bin = bins.get(key) ?? { r: 0, g: 0, b: 0, count: 0 };
      bin.r += r; bin.g += g; bin.b += b; bin.count++;
      bins.set(key, bin);
    }
    const samples = [...bins.values()].map(bin => ({
      count: bin.count,
      color: { r: Math.round(bin.r / bin.count), g: Math.round(bin.g / bin.count), b: Math.round(bin.b / bin.count) },
    }));
    rows.push({ yStart, yEnd, notes: imageChord(samples, 5, pixelToDynamic) });
  }
  return { rows, width, height };
}
