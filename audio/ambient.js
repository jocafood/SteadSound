import * as Tone from 'tone';
import { pixelToAmbient, shouldPlay } from './mapping.js';

let graph;
let enabled = false;
let generation = 0;
let previous = null;

/** Grafo independiente para permitir render offline y pruebas del audio real. */
export function createAmbientGraph() {
  const output = new Tone.Gain(0).toDestination();
  const limiter = new Tone.Limiter(-6).connect(output);
  const reverb = new Tone.Reverb({ decay: 3.2, preDelay: 0.035, wet: 0.24 }).connect(limiter);
  const filter = new Tone.Filter({ frequency: 2400, type: 'lowpass', rolloff: -24 }).connect(reverb);
  // Timbre percutido redondo; no usa ondas cuadradas ni dientes de sierra.
  const piano = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine', partials: [1, 0.3, 0.09] },
    envelope: { attack: 0.018, decay: 1.3, sustain: 0.06, release: 2.2 },
    volume: -13,
  }).connect(filter);
  piano.maxPolyphony = 16;
  const bell = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 2, modulationIndex: 0.5,
    oscillator: { type: 'sine' }, modulation: { type: 'sine' },
    envelope: { attack: 0.012, decay: 1.8, sustain: 0, release: 1.8 },
    modulationEnvelope: { attack: 0.01, decay: 0.6, sustain: 0, release: 1 },
    volume: -20,
  }).connect(filter);
  bell.maxPolyphony = 16;
  return {
    ready: reverb.ready,
    open(time = Tone.now()) { output.gain.setValueAtTime(0, time); output.gain.linearRampToValueAtTime(0.85, time + 0.06); },
    play(parameters, time = Tone.now()) {
      piano.triggerAttackRelease(parameters.frequency, parameters.duration, time, parameters.velocity);
      bell.triggerAttackRelease(parameters.frequency * 2, 0.45, time, parameters.velocity * parameters.bellMix);
    },
    stop() {
      output.gain.cancelScheduledValues(Tone.now());
      output.gain.rampTo(0, 0.06);
      piano.releaseAll(); bell.releaseAll();
    },
    dispose() { piano.dispose(); bell.dispose(); filter.dispose(); reverb.dispose(); limiter.dispose(); output.dispose(); },
  };
}

export async function iniciarAudio() {
  const current = ++generation;
  enabled = false;
  await Tone.start();
  if (current !== generation) return false;
  graph?.dispose();
  const next = createAmbientGraph();
  graph = next;
  await next.ready;
  if (current !== generation) return false;
  previous = null;
  next.open(); enabled = true;
  return true;
}

export function reproducirSonido(sample) {
  const parameters = pixelToAmbient(sample.color ?? sample);
  if (!enabled) return null;
  const now = Tone.now();
  const played = shouldPlay(parameters, previous, now);
  if (played) {
    graph.play(parameters, now);
    previous = { midi: parameters.midi, time: now };
  }
  return { ...parameters, played, profile: 'ambient' };
}

export function detenerAudio() {
  generation++; enabled = false; previous = null;
  graph?.stop();
}
export function audioActivo() { return enabled; }
