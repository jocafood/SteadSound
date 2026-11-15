/** Perfiles: ensemble (actual), ambient (rollback melancólico), legacy (original). */
import * as ensemble from './audio/ensemble.js';
import * as ambient from './audio/ambient.js';
import * as legacy from './audio/legacy.js';
const requested = import.meta.env.VITE_SOUND_PROFILE;
export const SOUND_PROFILE = requested === 'legacy' || requested === 'ambient' ? requested : 'ensemble';
const engine = { ensemble, ambient, legacy }[SOUND_PROFILE];
export const iniciarAudio = engine.iniciarAudio;
export const reproducirSonido = engine.reproducirSonido;
export const detenerAudio = engine.detenerAudio;
export const audioActivo = engine.audioActivo;
export const admiteInstrumentos = SOUND_PROFILE === 'ensemble';
export function configurarInstrumentos(selected) { return engine.configurarInstrumentos?.(selected); }
export function reproducirOrquesta(samples) {
  if (!admiteInstrumentos) throw new Error('La orquesta requiere el perfil ensemble.');
  return engine.reproducirOrquesta(samples);
}
