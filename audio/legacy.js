import * as Tone from 'tone';
import { colorToSound } from '../frontend/color.js';

let synth;
let enabled = false;
let generation = 0;
let lastNote = -Infinity;

/** Llamar directamente desde un clic o una tecla del usuario. */
export async function iniciarAudio() {
  const current = ++generation;
  await Tone.start();
  if (current !== generation) return false;
  if (!synth) {
    synth = new Tone.Synth({ volume: -18 }).toDestination();
  }
  enabled = true;
  return true;
}

/** Recibe el evento del contrato o directamente {r,g,b}. No usa red. */
export function reproducirSonido(sample) {
  const parameters = colorToSound(sample.color ?? sample);
  if (!enabled) return null;
  const now = Tone.now();
  // Evitar ataques simultáneos o una cola de audio al arrastrar rápidamente.
  if (now - lastNote < 0.08) return parameters;
  synth.triggerAttackRelease(parameters.frequency, 0.18, now);
  lastNote = now;
  return parameters;
}

export function detenerAudio() {
  generation++;
  enabled = false;
  synth?.triggerRelease();
  lastNote = -Infinity;
}

export function audioActivo() { return enabled; }
