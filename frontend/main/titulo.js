const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const titulo = document.querySelector('.titulo');

// Separar cada letra en un span para poder iluminarlas una a una.
const texto = titulo.textContent;
titulo.setAttribute('aria-label', texto);
titulo.replaceChildren(...[...texto].map(letra => {
  const span = document.createElement('span');
  span.classList.add('letra');
  span.setAttribute('aria-hidden', 'true');
  span.textContent = letra;
  return span;
}));

if (!reducirMovimiento) {
  const letras = [...titulo.querySelectorAll('.letra')];
  const DURACION_PULSO = 900;
  let indice = 0;

  // Ilumina la letra actual y la apaga al terminar su pulso.
  const iluminar = () => {
  if (document.documentElement.dataset.reduceMotion === "true") { setTimeout(iluminar, 1000); return; }
  const letra = letras[indice];
  letra.classList.add('encendida');
  indice = (indice + 1) % letras.length;
  setTimeout(() => {
    letra.classList.remove('encendida');
    setTimeout(iluminar, 3000 + Math.random() * 2000);
  }, DURACION_PULSO);
};

iluminar();

  // Una letra cada 3 a 5 segundos. Recorre el título completo y vuelve a empezar.
  const programar = () => {
    setTimeout(() => {
      iluminar();
      programar();
    }, 3000 + Math.random() * 2000);
  };
  programar();
}