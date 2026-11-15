import * as Tone from 'tone';
import { pixelToAmbient, shouldPlay } from './mapping.js';
import { imageChord } from './orchestra.js';

export const INSTRUMENTS = Object.freeze(['piano', 'violin', 'flute', 'bell']);
let instruments = ['piano'];
let graph, enabled = false, generation = 0, previous = null, finishOrchestra;

export function configurarInstrumentos(selected) {
  if (!Array.isArray(selected) || !selected.length || selected.some(name => !INSTRUMENTS.includes(name))) throw new TypeError('Selecciona al menos un instrumento válido.');
  detenerAudio();
  instruments = [...new Set(selected)];
  return [...instruments];
}

function createGraph() {
  const output = new Tone.Gain(0).toDestination();
  const limiter = new Tone.Limiter(-6).connect(output);
  const reverb = new Tone.Reverb({ decay: 3.2, preDelay: 0.035, wet: 0.25 }).connect(limiter);
  const filter = new Tone.Filter({ frequency: 2600, type: 'lowpass', rolloff: -24 }).connect(reverb);
  const presets = {
    piano: { oscillator: { type: 'sine', partials: [1, 0.3, 0.09] }, envelope: { attack: 0.018, decay: 1.3, sustain: 0.06, release: 1.4 }, volume: -13 },
    violin: { oscillator: { type: 'custom', partials: [1, 0.38, 0.2, 0.1, 0.04] }, envelope: { attack: 0.32, decay: 0.35, sustain: 0.55, release: 1.2 }, volume: -20 },
    flute: { oscillator: { type: 'sine', partials: [1, 0.12, 0.025] }, envelope: { attack: 0.15, decay: 0.35, sustain: 0.45, release: 1 }, volume: -17 },
    bell: { harmonicity: 2, modulationIndex: 0.5, oscillator: { type: 'sine' }, modulation: { type: 'sine' }, envelope: { attack: 0.012, decay: 1.8, sustain: 0, release: 1.2 }, modulationEnvelope: { attack: 0.01, decay: 0.6, sustain: 0, release: 1 }, volume: -18 },
  };
  const voices = instruments.map(name => {
    const voice = new Tone.PolySynth(name === 'bell' ? Tone.FMSynth : Tone.Synth, presets[name]).connect(filter);
    voice.maxPolyphony = 16;
    return voice;
  });
  return {
    ready: reverb.ready,
    open() { output.gain.rampTo(0.8, 0.06); },
    play(note, time, duration = note.duration, density = 1) {
      const velocity = note.velocity / Math.sqrt(voices.length * density);
      voices.forEach(voice => voice.triggerAttackRelease(note.frequency, duration, time, velocity));
    },
    stop() { output.gain.cancelScheduledValues(Tone.now()); output.gain.rampTo(0, 0.06); voices.forEach(v => v.releaseAll()); },
    dispose() { voices.forEach(v => v.dispose()); filter.dispose(); reverb.dispose(); limiter.dispose(); output.dispose(); },
  };
}
export async function iniciarAudio() {
  const current = ++generation;
  enabled = false;
  finishOrchestra?.('cancelled');
  await Tone.start();
  if (current !== generation) return false;
  graph?.dispose();
  const next = createGraph(); graph = next;
  await next.ready;
  if (current !== generation) return false;
  previous = null; next.open(); enabled = true;
  return true;
}
export function reproducirSonido(sample) {
  const parameters = pixelToAmbient(sample.color ?? sample);
  if (!enabled) return null;
  const now = Tone.now();
  const played = !finishOrchestra && shouldPlay(parameters, previous, now);
  if (played) { graph.play(parameters, now); previous = { midi: parameters.midi, time: now }; }
  return { ...parameters, played, instruments: [...instruments], profile: 'ensemble' };
}
export function reproducirOrquesta(samples) {
  if (!enabled) throw new Error('Activa el audio antes de interpretar la imagen.');
  finishOrchestra?.('cancelled');
  const notes = imageChord(samples);
  if (!notes.length) return Promise.resolve({ reason: 'silent', notes: 0, duration: 0 });
  const now = Tone.now();
  notes.forEach(note => graph.play(note, now, 2.8, notes.length));
  return new Promise(resolve => {
    const timer = setTimeout(() => finish('finished'), 4000);
    const finish = reason => {
      clearTimeout(timer); finishOrchestra = undefined;
      graph?.stop(); enabled = false; previous = null;
      resolve({ reason, notes: notes.length, instruments: [...instruments], duration: 4 });
    };
    finishOrchestra = finish;
  });
}
export function detenerAudio() {
  generation++; enabled = false; previous = null;
  finishOrchestra?.('cancelled'); graph?.stop();
}
export function audioActivo() { return enabled; }
