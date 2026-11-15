const contenedor = document.querySelector('.discos');
const spotlight = document.getElementById('spotlight');
let imagenes = [];
let activo = 0;

async function obtenerImagenes() {
  const response = await fetch('/api/images');
  if (!response.ok) throw new Error('No se pudo cargar el catálogo.');
  const data = await response.json();
  if (!Array.isArray(data.images)) throw new Error('El catálogo recibido no tiene el formato esperado.');
  return data.images;
}

function crearImg(src, alt) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  return img;
}

function montarDiscos() {
  contenedor.replaceChildren(...imagenes.map((imagen, i) => {
    const disco = document.createElement('div');
    disco.classList.add('disco');
    disco.appendChild(crearImg(imagen.imageUrl, ''));
    disco.addEventListener('click', () => {
      activo = i;
      render();
    });
    return disco;
  }));
}

function render() {
  if (!imagenes.length) return;
  contenedor.querySelectorAll('.disco').forEach((disco, i) => {
    disco.classList.toggle('activo', i === activo);
  });
  const imagen = imagenes[activo];
  spotlight.replaceChildren(crearImg(imagen.imageUrl, imagen.altText));
}

document.getElementById('prev').addEventListener('click', () => {
  if (!imagenes.length) return;
  activo = (activo - 1 + imagenes.length) % imagenes.length;
  render();
});

document.getElementById('next').addEventListener('click', () => {
  if (!imagenes.length) return;
  activo = (activo + 1) % imagenes.length;
  render();
});

async function iniciar() {
  try {
    imagenes = await obtenerImagenes();
    montarDiscos();
    render();
  } catch (error) {
    console.error(error);
    spotlight.textContent = 'No se pudo cargar el catálogo.';
  }
}

iniciar();