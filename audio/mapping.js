import { colorToSound } from '../frontend/color.js';

// La menor pentatónica: A, C, D, E, G. Tres registros moderados, A2–G5.
export const SCALE = Object.freeze([45, 48, 50, 52, 55, 57, 60, 62, 64, 67, 69, 72, 74, 76, 79]);
export function pixelToAmbient(color) {
  const { hue } = colorToSound(color);
  const channels = [color.r, color.g, color.b].map(value => value / 255);
  const max = Math.max(...channels), min = Math.min(...channels);
  const lightness = (max + min) / 2;
  const saturation = max === min ? 0 : (max - min) / (1 - Math.abs(2 * lightness - 1));
  const degree = saturation < 0.08 ? 0 : Math.min(4, Math.floor(hue / 360 * 5));
  const register = lightness < 0.3 ? 0 : lightness < 0.72 ? 1 : 2;
  const midi = SCALE[register * 5 + degree];
  return {
    hue, midi, frequency: 440 * 2 ** ((midi - 69) / 12),
    lightness, saturation,
    // Los fondos casi negros dejan espacio; no se confunden con un rojo vivo.
    silent: max < 0.035,
    velocity: 0.22 + Math.sqrt(lightness) * 0.25,
    duration: 0.7 + (1 - saturation) * 0.45,
    bellMix: 0.08 + saturation * 0.12,
  };
}

/** Espacia notas y evita repetir una misma altura durante un arrastre. */
export function shouldPlay(parameters, previous, now) {
  if (parameters.silent) return false;
  if (!previous) return true;
  if (now - previous.time < 0.24) return false;
  return parameters.midi !== previous.midi || now - previous.time >= 0.9;
}
