import { narrate, narrationEnabled } from './narration.js';

const instructions = {
  'gallery-select': 'Choose a NASA image with the arrow keys, then move to Open image.',
  'gallery-open': 'Open the selected image in the accessible sound player.',
  'gallery-retry': 'Reload the image catalog if loading failed.',
  prev: 'Select the previous image in the catalog.',
  next: 'Select the next image in the catalog.',
  spotlight: 'Open the selected image in the sound player.',
  'reduce-motion': 'Turn off decorative movement and transitions.',
  'high-contrast': 'Switch between the regular theme and black backgrounds with bright text.',
  'player-contrast': 'Switch between the regular theme and black backgrounds with bright text.',
  'player-close': 'Stop playback and return to image selection. Escape also closes the player.',
  'player-volume': 'Adjust music volume using the arrow keys. Zero mutes the music.',
  'player-repeat-instructions': 'Read the complete player instructions once.',
  'player-describe': 'Stop music and read this image’s title, scientific description and instructions in English.',
  'player-stop-narration': 'Stop the current spoken message. Voice guidance remains enabled for the next control.',
  'player-audio': 'Start or stop musical playback.',
  'player-instrument': 'Choose the instrument used to play image colors.',
  'player-combine': 'Choose several instruments to play together.',
  'player-orchestra': 'Scan the image from top to bottom. A moving line and sound represent successive rows. Stop sound or close the player to cancel.',
  'player-source': 'Open the original NASA source in a new browser tab.',
  'player-canvas': 'Explore image colors with the arrow keys.',
};
const selector = 'button, a[href], select, input, summary, [role="button"], canvas[tabindex]';
function hintFor(control) {
  if (instructions[control.id]) return instructions[control.id];
  if (control.closest('#player-layers')) return 'Include or remove this instrument from the simultaneous mix. Keep at least one instrument selected.';
  if (control.classList.contains('disco')) return 'Select this image. Then move to Open image to explore it.';
  if (control.tagName === 'SUMMARY') return 'Expand or collapse the scientific image description and keyboard instructions.';
  if (control.classList.contains('skip-link')) return 'Skip the decorative gallery and move directly to the image selector.';
  return '';
}
function controlName(control) {
  if (control.getAttribute('aria-label')) return control.getAttribute('aria-label');
  if (control.labels?.length) return [...control.labels].map(label => {
    const copy = label.cloneNode(true);
    copy.querySelectorAll('input, select, output').forEach(el => el.remove());
    return copy.textContent.trim();
  }).join(' ');
  return control.textContent.trim();
}
export function controlMessage(control) {
  const name = controlName(control);
  const role = control.matches('input[type=checkbox]') ? 'Checkbox.' : control.tagName === 'SELECT' ? 'Selector.' : control.matches('input[type=range]') ? 'Volume slider.' : control.tagName === 'CANVAS' ? 'Image explorer.' : control.tagName === 'A' ? 'Link.' : 'Button.';
  let state = '';
  let action = 'Press Enter to activate.';
  if (control instanceof HTMLInputElement && ['checkbox', 'radio'].includes(control.type)) {
    state = control.checked ? 'Checked.' : 'Not checked.';
    action = 'Press Enter or Space to change this option.';
  } else if (control instanceof HTMLSelectElement) {
    state = `Selected: ${control.selectedOptions[0]?.textContent ?? 'none'}.`;
    action = 'Use the arrow keys to choose an option.';
  } else if (control instanceof HTMLInputElement && control.type === 'range') {
    state = `${control.value} percent.`; action = 'Use the arrow keys to adjust.';
  } else if (control.tagName === 'SUMMARY') {
    state = control.parentElement.open ? 'Expanded.' : 'Collapsed.';
  } else if (control.hasAttribute('aria-pressed')) {
    state = control.getAttribute('aria-pressed') === 'true' ? 'On.' : 'Off.';
  }
  return [name, role, state].filter(Boolean).join(' ');
}
let helpNumber = 0;
function attachDescription(control) {
  const hint = hintFor(control);
  if (!hint || control.dataset.guidanceHelp) return;
  const help = document.createElement('span');
  help.id = `control-help-${++helpNumber}`;
  help.hidden = true; help.textContent = hint;
  // Descriptions also work when built-in narration is disabled.
  document.body.append(help);
  const existing = control.getAttribute('aria-describedby');
  control.setAttribute('aria-describedby', [existing, help.id].filter(Boolean).join(' '));
  control.dataset.guidanceHelp = help.id;
}
export function refreshControlGuidance() {
  document.querySelectorAll('[id^="control-help-"]').forEach(help => {
    if (!document.querySelector(`[aria-describedby~="${help.id}"]`)) help.remove();
  });
  document.querySelectorAll(selector).forEach(attachDescription);
}
export function initializeControlGuidance() {
  refreshControlGuidance();
  document.addEventListener('focusin', event => {
    const control = event.target.closest(selector);
    if (!control || control.disabled || control.closest('[inert]')) return;
    attachDescription(control);
    narrate(controlMessage(control));
  });
  document.addEventListener('change', event => {
    const control = event.target;
    if (!control.matches('select, input')) return;
    // Speak only the latest state; narrate() cancels superseded messages.
    narrate(controlMessage(control));
  });
  document.addEventListener('toggle', event => {
    if (event.target.tagName === 'DETAILS' && !event.target.closest('[inert]')) {
      const summary = event.target.querySelector('summary');
      if (summary) narrate(controlMessage(summary));
    }
  }, true);
  // Announce the new button state after its click handler updates it.
  document.addEventListener('click', event => {
    const control = event.target.closest('button');
    if (!control || !['player-audio'].includes(control.id) || !narrationEnabled()) return;
    // Audio starts asynchronously, so observe its actual aria-pressed update.
    const observer = new MutationObserver(() => { observer.disconnect(); narrate(controlMessage(control)); });
    observer.observe(control, { attributes: true, attributeFilter: ['aria-pressed'] });
    setTimeout(() => observer.disconnect(), 3000);
  });
}
