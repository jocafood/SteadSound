const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function crearEstrella(contenedor) {
  const estrella = document.createElement('div');
  estrella.classList.add('estrella');
  const tamano = Math.random() * 2 + 1;
  estrella.style.width = `${tamano}px`;
  estrella.style.height = `${tamano}px`;
  estrella.style.left = `${Math.random() * 100}%`;
  estrella.style.top = `${Math.random() * 100}%`;
  estrella.style.setProperty('--duracion', `${Math.random() * 3 + 2}s`);
  estrella.style.setProperty('--retraso', `${Math.random() * 5}s`);
  contenedor.appendChild(estrella);
}

function lanzarCometa(contenedor) {
  if (document.documentElement.dataset.reduceMotion === "true") return;
  const cometa = document.createElement('div');
  cometa.classList.add('cometa');
  cometa.style.width = `${120 + Math.random() * 120}px`;
  contenedor.appendChild(cometa);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Entra por la parte superior derecha y avanza hacia la izquierda y abajo.
  const x0 = vw * (0.5 + Math.random() * 0.6);
  const y0 = -40 - Math.random() * vh * 0.3;
  const dx = -(700 + Math.random() * 600);
  const dy = 350 + Math.random() * 350;
  const angulo = Math.atan2(dy, dx) * 180 / Math.PI;
  const en = p => `translate(${x0 + dx * p}px, ${y0 + dy * p}px) rotate(${angulo}deg)`;

  const animacion = cometa.animate([
    { transform: en(0), opacity: 0 },
    { transform: en(0.15), opacity: 1, offset: 0.15 },
    { transform: en(1), opacity: 0 },
  ], { duration: 1400 + Math.random() * 900, easing: 'linear' });
  animacion.onfinish = () => cometa.remove();
}

export function iniciarCielo(contenedor, { estrellas = 120, cometas = true, estaVisible = () => true } = {}) {
  for (let i = 0; i < estrellas; i++) crearEstrella(contenedor);
  if (!cometas || reducirMovimiento) return;

  const programar = () => {
    setTimeout(() => {
      if (estaVisible()) lanzarCometa(contenedor);
      programar();
    }, 4000 + Math.random() * 6000);
  };
  programar();
}