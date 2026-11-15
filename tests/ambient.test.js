import test from 'node:test';
import assert from 'node:assert/strict';
import { pixelToAmbient, SCALE, shouldPlay } from '../audio/mapping.js';

test('todos los colores quedan en la pentatónica menor y rangos moderados', () => {
  for (let r = 0; r <= 255; r += 17) for (let g = 0; g <= 255; g += 17) for (let b = 0; b <= 255; b += 17) {
    const note = pixelToAmbient({ r, g, b });
    assert.ok(SCALE.includes(note.midi));
    assert.ok(note.frequency >= 110 && note.frequency < 800);
    assert.ok(note.velocity >= 0.22 && note.velocity <= 0.47);
    assert.ok(Number.isFinite(note.saturation));
  }
});
test('negro deja silencio y grises claros cambian de registro', () => {
  assert.equal(pixelToAmbient({ r: 0, g: 0, b: 0 }).silent, true);
  assert.equal(pixelToAmbient({ r: 255, g: 255, b: 255 }).silent, false);
  assert.notEqual(pixelToAmbient({ r: 50, g: 50, b: 50 }).midi, pixelToAmbient({ r: 220, g: 220, b: 220 }).midi);
});
test('arrastre: sin ráfagas, duplicados espaciados y reintento después de silencio', () => {
  const note = pixelToAmbient({ r: 255, g: 0, b: 0 });
  const previous = { midi: note.midi, time: 10 };
  assert.equal(shouldPlay(note, null, 10), true);
  assert.equal(shouldPlay(note, previous, 10.1), false);
  assert.equal(shouldPlay(note, previous, 10.5), false);
  assert.equal(shouldPlay(note, previous, 11), true);
  assert.equal(shouldPlay({ ...note, midi: 60 }, previous, 10.3), true);
  assert.equal(shouldPlay({ ...note, silent: true }, null, 11), false);
});
