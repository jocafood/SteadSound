/** Helpers de accesibilidad independientes del catálogo y del motor. */
export function containModalFocus(dialog, background) {
  const tabbables = () => [...dialog.querySelectorAll('button, a[href], select, input, [tabindex="0"]')]
    .filter(el => !el.disabled && el.getClientRects().length && !el.closest('[hidden]'));
  const trap = event => {
    if (event.key !== 'Tab' || dialog.hidden) return;
    const items = tabbables();
    if (!items.length) { event.preventDefault(); dialog.focus(); return; }
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  };
  dialog.addEventListener('keydown', trap);
  return {
    open() { background.inert = true; },
    close() { background.inert = false; },
  };
}

export function describePixel(sample, sound) {
  const names = { red: 'red', yellow: 'yellow', green: 'green', cyan: 'cyan', blue: 'blue', magenta: 'magenta', neutral: 'gray' };
  const { x, y } = sample.position;
  const { r, g, b } = sample.color;
  return `Pixel ${x}, ${y}. RGB ${r}, ${g}, ${b}. ${sound?.silent ? 'Dark area: silence.' : sound ? `Timbre ${names[sound.family] ?? 'musical'}, ${sound.frequency.toFixed(0)} hertz.` : 'Sound is off.'}`;
}

// Checkbox Enter is not native in browsers; retain native Space and button behavior.
document.addEventListener('keydown', event => {
  if (event.key !== 'Enter' || event.defaultPrevented || event.repeat || event.isComposing) return;
  const control = event.target;
  if (control instanceof HTMLInputElement && ['checkbox','radio'].includes(control.type) && !control.disabled) {
    event.preventDefault(); control.click();
  }
});
export function setHighContrast(value) {
  document.documentElement.dataset.highContrast = String(value);
  if (value) document.getElementById("player")?.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
  for (const id of ['high-contrast','player-contrast']) {
    const input = document.getElementById(id); if (input) input.checked = value;
  }
}
