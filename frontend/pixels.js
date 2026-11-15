/** Coordenadas sobre un canvas sin bordes ni padding, escalado con CSS. */
export function clientToPixel(clientX, clientY, rect, width, height) {
  if (!rect.width || !rect.height || clientX < rect.left || clientY < rect.top || clientX >= rect.left + rect.width || clientY >= rect.top + rect.height) return null;
  return {
    x: Math.min(width - 1, Math.floor((clientX - rect.left) / rect.width * width)),
    y: Math.min(height - 1, Math.floor((clientY - rect.top) / rect.height * height)),
  };
}

export function samplePixel(context, imageId, x, y) {
  const { width, height } = context.canvas;
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= width || y >= height) throw new RangeError('Píxel fuera de la imagen.');
  const [r, g, b] = context.getImageData(x, y, 1, 1).data;
  return {
    imageId,
    position: { x, y, normalizedX: width === 1 ? 0 : x / (width - 1), normalizedY: height === 1 ? 0 : y / (height - 1) },
    color: { r, g, b },
  };
}
