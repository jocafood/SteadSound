/** Cliente independiente de la UI; /api se resuelve por el mismo origen. */
export async function obtenerImagenes({ signal } = {}) {
  const response = await fetch('/api/images', { signal });
  if (!response.ok) throw new Error('No se pudo cargar el catálogo. Comprueba que el backend esté encendido.');
  const data = await response.json();
  if (!Array.isArray(data.images)) throw new Error('El catálogo recibido no tiene el formato esperado.');
  return data.images;
}
