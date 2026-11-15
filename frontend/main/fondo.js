const contEstrellas = document.getElementById('estrellas');
const cantidadEstrellas = 150;

for (let i = 0; i < cantidadEstrellas; i++) {
  const estrella = document.createElement('div');
  estrella.classList.add('estrella');

  const tamano = Math.random() * 2 + 1;
  estrella.style.width = `${tamano}px`;
  estrella.style.height = `${tamano}px`;
  estrella.style.left = `${Math.random() * 100}%`;
  estrella.style.top = `${Math.random() * 100}%`;
  estrella.style.setProperty('--duracion', `${Math.random() * 3 + 2}s`);
  estrella.style.setProperty('--retraso', `${Math.random() * 5}s`);

  contEstrellas.appendChild(estrella);
}