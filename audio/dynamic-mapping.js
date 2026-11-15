import { pixelToAmbient } from './mapping.js';

export function luminance({ r, g, b }) {
  const linear = value => { const c = value / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function pixelToDynamic(color) {
  const original = pixelToAmbient(color);
  const brightness = Math.max(color.r, color.g, color.b) / 255;
  const family = original.saturation < 0.12 ? 'neutral' : ['red', 'yellow', 'green', 'cyan', 'blue', 'magenta'][Math.floor(original.hue / 60) % 6];
  return {
    ...original, family, luminance: luminance(color),
    silent: brightness < 0.07,
    // Sin volumen mínimo fijo: negro y casi negro son silencio o un susurro.
    velocity: 0.55 * brightness ** 1.7,
    duration: family === 'red' ? 0.5 : family === 'blue' ? 1.2 : original.duration,
  };
}

/** Estadística global de muestras uniformemente distribuidas; no del último píxel. */
export function imageRhythm(samples) {
  if (!samples.length) return { luminance: 0, vibrance: 0, energy: 0, bpm: 48, noteInterval: 1.25 };
  let light = 0, vibrance = 0;
  for (const { color } of samples) {
    const p = pixelToDynamic(color);
    light += p.luminance;
    const max = Math.max(color.r, color.g, color.b) / 255;
    vibrance += p.saturation * max;
  }
  light /= samples.length; vibrance /= samples.length;
  const energy = Math.sqrt(light);
  const bpm = Math.round(48 + 96 * energy);
  return { luminance: light, vibrance, energy, bpm, noteInterval: 60 / bpm };
}

export function shouldPlayDynamic(note, previous, now) {
  if (note.silent) return false;
  if (!previous) return true;
  if (now - previous.time < 0.24) return false;
  return note.family !== previous.family || note.midi !== previous.midi || now - previous.time >= 0.9;
}
