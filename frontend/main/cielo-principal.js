const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const contenedor = document.getElementById('estrellas');

// Constelaciones: pares de estrellas conectadas por líneas finas, en posiciones fijas del cielo.
const CONSTELACIONES = [
  { puntos: [[12, 18], [16, 14], [21, 17], [19, 24], [14, 26]] },
  { puntos: [[70, 62], [75, 56], [81, 60], [84, 68], [77, 72], [71, 69]] },
  { puntos: [[40, 78], [45, 74], [52, 79], [57, 73]] },
];

function crearConstelaciones() {
  for (const { puntos } of CONSTELACIONES) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.classList.add('constelacion');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');

    const lineas = document.createElementNS(svgNS, 'polyline');
    lineas.setAttribute('points', puntos.map(([x, y]) => `${x},${y}`).join(' '));
    lineas.classList.add('constelacion-linea');
    svg.appendChild(lineas);

    for (const [x, y] of puntos) {
      const punto = document.createElement('div');
      punto.classList.add('constelacion-punto');
      punto.style.left = `${x}%`;
      punto.style.top = `${y}%`;
      punto.style.setProperty('--retraso', `${Math.random() * 4}s`);
      contenedor.appendChild(punto);
    }
    contenedor.appendChild(svg);
  }
}

function lanzarMeteorito(tipo) {
  const el = document.createElement('div');
  el.classList.add(tipo === 'cometa' ? 'cometa-principal' : 'meteorito');
  contenedor.appendChild(el);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const x0 = vw * (0.5 + Math.random() * 0.6);
  const y0 = -40 - Math.random() * vh * 0.3;
  const dx = -(tipo === 'cometa' ? 900 + Math.random() * 500 : 350 + Math.random() * 250);
  const dy = tipo === 'cometa' ? 420 + Math.random() * 300 : 250 + Math.random() * 200;
  const angulo = Math.atan2(dy, dx) * 180 / Math.PI;
  const en = p => `translate(${x0 + dx * p}px, ${y0 + dy * p}px) rotate(${angulo}deg)`;

  const duracion = tipo === 'cometa' ? 2200 + Math.random() * 1200 : 900 + Math.random() * 500;
  const animacion = el.animate([
    { transform: en(0), opacity: 0 },
    { transform: en(0.12), opacity: 1, offset: 0.12 },
    { transform: en(1), opacity: 0 },
  ], { duration: duracion, easing: 'linear' });
  animacion.onfinish = () => el.remove();
}

function programarEventos() {
  const programar = () => {
    setTimeout(() => {
      const tipo = Math.random() < 0.3 ? 'meteorito' : 'cometa';
      lanzarMeteorito(tipo);
      programar();
    }, 5000 + Math.random() * 8000);
  };
  programar();
}

// Las estrellas de fondo ya las crea fondo.js; aquí solo se agregan constelaciones y eventos.
if (!reducirMovimiento) {
  crearConstelaciones();
  programarEventos();
}