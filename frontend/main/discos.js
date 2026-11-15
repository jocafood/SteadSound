const contenedor = document.querySelector('.discos');
const spotlight = document.getElementById('spotlight');
const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let imagenes = [];
let activo = 0;
let primeraVez = true;

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

function animarDesdeDisco(img, origen) {
  const destino = spotlight.getBoundingClientRect();
  const dx = (origen.left + origen.width / 2) - (destino.left + destino.width / 2);
  const dy = (origen.top + origen.height / 2) - (destino.top + destino.height / 2);
  const sx = Math.max(origen.width / destino.width, 0.02);
  const sy = Math.max(origen.height / destino.height, 0.02);

  img.animate([
    {
      transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
      opacity: 0.4,
      borderRadius: '50%',
    },
    {
      transform: 'translate(0, 0) scale(1, 1)',
      opacity: 1,
      borderRadius: '0px',
    },
  ], {
    duration: 600,
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  });
}

function render() {
  if (!imagenes.length) return;

  const discos = [...contenedor.querySelectorAll('.disco')];
  // Medir el disco antes de expandirlo: ahí empieza la animación.
  const origen = discos[activo].getBoundingClientRect();

  discos.forEach((disco, i) => {
    disco.classList.toggle('activo', i === activo);
  });

  const imagen = imagenes[activo];
  const img = crearImg(imagen.imageUrl, imagen.altText);
  spotlight.replaceChildren(img);

  if (!primeraVez && !reducirMovimiento) {
    animarDesdeDisco(img, origen);
  }
  primeraVez = false;
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