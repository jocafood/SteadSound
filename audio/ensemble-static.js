import * as Tone from 'tone';
import { pixelToDynamic, imageRhythm } from './dynamic-mapping.js';
import { imageChord } from './orchestra.js';

export const INSTRUMENTS = Object.freeze(['piano', 'violin', 'flute', 'bell', 'guitar']);
let instruments = ['piano'];
let rhythm = imageRhythm([]);
export function configurarImagen(samples) { rhythm = imageRhythm(samples); return { ...rhythm }; }
let activeNote = null, orchestraNotes = null, noteUntil = 0, lastAttack = -Infinity;
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
  const reverb = new Tone.Reverb({ decay: 2.8, preDelay: 0.035, wet: 0.22 }).connect(limiter);
  const voices = new Map();
  const nodes = [];
  const familyPatches = {
    red: { cutoff: 3000, partials: [1, 0.6, 0.25, 0.1], attack: 0.012, fm: 0.7 },
    yellow: { cutoff: 5200, partials: [1, 0.2, 0.05], attack: 0.008, fm: 1.5 },
    green: { cutoff: 2200, partials: [1, 0.08, 0.015], attack: 0.14, fm: 0.2 },
    cyan: { cutoff: 3800, partials: [1, 0, 0.26, 0, 0.08], attack: 0.035, fm: 0.9 },
    blue: { cutoff: 1400, partials: [1, 0.1, 0.02], attack: 0.22, fm: 0.15 },
    magenta: { cutoff: 4200, partials: [1, 0.32, 0.18, 0.09], attack: 0.025, fm: 2.2 },
    neutral: { cutoff: 1800, partials: [1, 0.16, 0.04], attack: 0.04, fm: 0.3 },
  };
  function voiceFor(name, family) {
    const key = name + ':' + family;
    if (voices.has(key)) return voices.get(key);
    const patch = familyPatches[family];
    const filter = new Tone.Filter({ frequency: patch.cutoff, type: 'lowpass', rolloff: -24 }).connect(reverb);
    nodes.push(filter);
    const fm = name === 'bell' || (name === 'piano' && ['yellow', 'magenta'].includes(family));
    let options = {
      oscillator: { type: 'custom', partials: patch.partials },
      envelope: { attack: patch.attack, decay: 1.2, sustain: 0.06, release: 1.2 }, volume: -14,
    };
    if (fm) options = { harmonicity: family === 'magenta' ? 3 : 2, modulationIndex: patch.fm, oscillator: { type: 'sine' }, modulation: { type: 'sine' }, envelope: { attack: 0.012, decay: 1.7, sustain: 0, release: 1.2 }, modulationEnvelope: { attack: 0.01, decay: 0.6, sustain: 0, release: 0.8 }, volume: -18 };
    else if (name === 'violin') options = { ...options, oscillator: { type: 'custom', partials: patch.partials.map((v,i)=>i ? v * 1.5 : v) }, envelope: { attack: 0.22 + patch.attack, decay: 0.3, sustain: 0.5, release: 1 }, volume: -20 };
    else if (name === 'flute') options = { ...options, oscillator: { type: 'custom', partials: [1, patch.partials[1] * 0.3, 0.04] }, envelope: { attack: 0.08 + patch.attack, decay: 0.3, sustain: 0.4, release: 0.8 }, volume: -17 };
    else if (name === 'guitar') options = { ...options, oscillator: { type: 'sawtooth' }, envelope: { attack: 0.008, decay: 0.4, sustain: 0.22, release: 0.4 }, volume: -25 };
    let destination = filter;
    if (name === 'guitar') {
      destination = new Tone.Distortion({ distortion: family === 'red' ? 0.65 : 0.38, wet: 0.65 }).connect(filter);
      nodes.push(destination);
    }
    const voice = new Tone.PolySynth(fm ? Tone.FMSynth : Tone.Synth, options).connect(destination);
    voice.maxPolyphony = 16;
    voices.set(key, voice);
    return voice;
  }
  const clock = new Tone.Clock(time => {
    if (orchestraNotes && time - lastAttack >= rhythm.noteInterval * 0.8) {
      orchestraNotes.forEach(note => play(note, time, rhythm.noteInterval * 0.65, orchestraNotes.length));
      lastAttack = time;
    } else if (activeNote && time <= noteUntil && time - lastAttack >= rhythm.noteInterval * 0.8) {
      play(activeNote, time, rhythm.noteInterval * 0.65);
      lastAttack = time;
    }
  }, rhythm.bpm / 60);
  function play(note, time, duration, density = 1) {
    const velocity = note.velocity / Math.sqrt(instruments.length * density);
    instruments.forEach(name => {
      const voice = voiceFor(name, note.family);
      const frequencies = name === 'guitar' ? [note.frequency / 2, note.frequency / 2 * 2 ** (7/12), note.frequency] : note.frequency;
      voice.triggerAttackRelease(frequencies, duration, time, velocity / (name === 'guitar' ? Math.sqrt(3) : 1));
    });
  }
  return {
    ready: reverb.ready,
    open() { output.gain.rampTo(0.8, 0.06); clock.start(); },
    play(note, time, duration = rhythm.noteInterval * 0.65, density = 1) { play(note, time, duration, density); },
    stop() { clock.stop(); output.gain.cancelScheduledValues(Tone.now()); output.gain.rampTo(0, 0.06); voices.forEach(v => v.releaseAll()); },
    dispose() { clock.dispose(); voices.forEach(v => v.dispose()); [...nodes, reverb, limiter, output].forEach(n => n.dispose()); },
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
  activeNote = null; orchestraNotes = null; lastAttack = -Infinity;
  previous = null; next.open(); enabled = true;
  return true;
}
export function reproducirSonido(sample) {
  const parameters = pixelToDynamic(sample.color ?? sample);
  if (!enabled) return null;
  const now = Tone.now();
  if (!finishOrchestra) {
    activeNote = parameters.silent ? null : parameters;
    noteUntil = now + Math.max(1.4, rhythm.noteInterval * 2);
  }
  const changed = !previous || parameters.family !== previous.family || parameters.midi !== previous.midi;
  const played = !finishOrchestra && !parameters.silent && now - lastAttack >= 0.16 && (changed || now - lastAttack >= rhythm.noteInterval * 0.8);
  if (played) { graph.play(parameters, now); lastAttack = now; previous = { midi: parameters.midi, family: parameters.family }; }
  return { ...parameters, played, instruments: [...instruments], profile: 'ensemble', bpm: rhythm.bpm };
}
export function reproducirOrquesta(samples) {
  if (!enabled) throw new Error('Activa el audio antes de interpretar la imagen.');
  finishOrchestra?.('cancelled');
  const notes = imageChord(samples, 5, pixelToDynamic);
  if (!notes.length) return Promise.resolve({ reason: 'silent', notes: 0, duration: 0 });
  const now = Tone.now();
  activeNote = null; orchestraNotes = notes; lastAttack = now;
  notes.forEach(note => graph.play(note, now, rhythm.noteInterval * 0.65, notes.length));
  return new Promise(resolve => {
    const timer = setTimeout(() => finish('finished'), 4000);
    const finish = reason => {
      clearTimeout(timer); finishOrchestra = undefined;
      activeNote = null; orchestraNotes = null;
      graph?.stop(); enabled = false; previous = null;
      resolve({ reason, notes: notes.length, instruments: [...instruments], duration: 4 });
    };
    finishOrchestra = finish;
  });
}
export function detenerAudio() {
  generation++; enabled = false; previous = null;
  activeNote = null; orchestraNotes = null;
  finishOrchestra?.('cancelled'); graph?.stop();
}
export function audioActivo() { return enabled; }

export function pausarExploracion() { activeNote = null; }
export function mantenerExploracion() { if (activeNote) noteUntil = Infinity; }
