/** Mapeo del motor original: RGB → tono → frecuencia cromática. */
export function colorToSound({ r, g, b }) {
  if (![r, g, b].every(v => Number.isInteger(v) && v >= 0 && v <= 255)) {
    throw new TypeError('RGB debe contener enteros entre 0 y 255.');
  }
  const [red, green, blue] = [r / 255, g / 255, b / 255];
  const max = Math.max(red, green, blue), min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }
  if (hue < 0) hue += 360;
  const note = Math.floor(2 + hue / 360 * 12);
  return { hue, frequency: 220 * 2 ** (note / 12) };
}
