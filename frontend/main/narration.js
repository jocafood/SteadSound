import { splitNarration } from './narration-text.js';
/** Optional English narration. Keep speak() inside the initiating user gesture. */
let enabled = true;
let generation = 0;
let utterances = [];
let startTimer;
let voices = [];
export function speechSupported() { return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window; }
function refreshVoices() { if (speechSupported()) voices = window.speechSynthesis.getVoices(); }
export function stopNarration() {
  generation++;
  clearTimeout(startTimer);
  if (speechSupported()) window.speechSynthesis.cancel();
  utterances = [];
}
export function narrationEnabled() { return enabled; }
export function enableNarration(value) {
  enabled = Boolean(value);
  if (!enabled) stopNarration();
}
function report(error) { document.dispatchEvent(new CustomEvent('narrationerror', { detail: error })); }
export function narrate(text, force = false) {
  if ((!enabled && !force) || !text?.trim()) return false;
  if (!speechSupported()) { report('unsupported'); return false; }
  stopNarration();
  const request = generation;
  const synth = window.speechSynthesis;
  refreshVoices();
  const english = voices.find(v => v.lang.toLowerCase() === 'en-us') ?? voices.find(v => v.lang.toLowerCase().startsWith('en'));
  let started = false;
  utterances = splitNarration(text).map(chunk => {
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.volume = 0.85;
    // Empty/late voice lists are common on mobile: request English from the OS.
    // Never explicitly select a non-English voice.
    if (english) utterance.voice = english;
    utterance.onstart = () => {
      if (request !== generation) return;
      started = true; clearTimeout(startTimer);
    };
    utterance.onerror = event => {
      if (request !== generation || ['canceled', 'interrupted'].includes(event.error)) return;
      stopNarration(); report(event.error || 'unavailable');
    };
    return utterance;
  });
  try {
    if (synth.paused) synth.resume();
    // Queue all chunks during the gesture; retain references until cancellation.
    for (const utterance of utterances) synth.speak(utterance);
    startTimer = setTimeout(() => {
      if (request === generation && !started) { stopNarration(); report('not-started'); }
    }, 6000);
    return true;
  } catch {
    stopNarration(); report('unavailable'); return false;
  }
}
if (speechSupported()) {
  refreshVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
}
window.addEventListener('pagehide', stopNarration);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopNarration(); });
