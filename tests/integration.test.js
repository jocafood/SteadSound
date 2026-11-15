import test from 'node:test';
import assert from 'node:assert/strict';
import { colorToSound } from '../frontend/color.js';
import { clientToPixel, samplePixel } from '../frontend/pixels.js';
import { obtenerImagenes } from '../frontend/api.js';

test('colores reales producen tonos distintos con la regla del motor', () => {
  assert.equal(colorToSound({ r: 255, g: 0, b: 0 }).hue, 0);
  assert.equal(colorToSound({ r: 0, g: 255, b: 0 }).hue, 120);
  assert.equal(colorToSound({ r: 0, g: 0, b: 255 }).hue, 240);
  assert.equal(colorToSound({ r: 255, g: 0, b: 255 }).hue, 300);
  assert.notEqual(colorToSound({ r: 255, g: 0, b: 0 }).frequency, colorToSound({ r: 0, g: 0, b: 255 }).frequency);
  assert.throws(() => colorToSound({ r: -1, g: 0, b: 0 }), TypeError);
});
test('canvas escalado y bordes: coordenadas de píxel, no coordenadas CSS', () => {
  const rect = { left: 20, top: 30, width: 200, height: 100 };
  assert.deepEqual(clientToPixel(120, 80, rect, 1000, 500), { x: 500, y: 250 });
  assert.deepEqual(clientToPixel(219.99, 129.99, rect, 1000, 500), { x: 999, y: 499 });
  assert.equal(clientToPixel(220, 80, rect, 1000, 500), null);
  assert.equal(clientToPixel(10, 80, rect, 1000, 500), null);
});
test('muestra respeta contrato y dimensiones unitarias', () => {
  const context = { canvas: { width: 1, height: 2 }, getImageData: () => ({ data: [12, 34, 56, 255] }) };
  assert.deepEqual(samplePixel(context, 'test', 0, 1), { imageId: 'test', position: { x: 0, y: 1, normalizedX: 0, normalizedY: 1 }, color: { r: 12, g: 34, b: 56 } });
  assert.throws(() => samplePixel(context, 'test', 1, 1), RangeError);
});
test('cliente de catálogo expone errores de API y valida respuesta', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false });
    await assert.rejects(obtenerImagenes(), /backend/);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({}) });
    await assert.rejects(obtenerImagenes(), /formato/);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ images: [{ id: 'test' }] }) });
    assert.deepEqual(await obtenerImagenes(), [{ id: 'test' }]);
  } finally { globalThis.fetch = original; }
});
