/** Perfiles: ensemble (actual), ambient (rollback melancólico), legacy (original). */
import * as staticEnsemble from './audio/ensemble-static.js';
import * as ensemble from './audio/ensemble.js';
import * as percussion from './audio/ensemble-percussion.js';
import * as classic from './audio/ensemble-classic.js';
import * as ambient from './audio/ambient.js';
import * as legacy from './audio/legacy.js';
const requested = import.meta.env.VITE_SOUND_PROFILE;
export const SOUND_PROFILE = requested === 'ensemble-static' || requested === 'legacy' || requested === 'ambient' || requested === 'ensemble-classic' || requested === 'ensemble-percussion' ? requested : 'ensemble';
const engine = { ensemble, ambient, legacy, "ensemble-static": staticEnsemble, "ensemble-classic": classic, "ensemble-percussion": percussion }[SOUND_PROFILE];
export const iniciarAudio = engine.iniciarAudio;
export const reproducirSonido = engine.reproducirSonido;
export const detenerAudio = engine.detenerAudio;
export const audioActivo = engine.audioActivo;
export const admiteInstrumentos = SOUND_PROFILE === 'ensemble-static' || SOUND_PROFILE === 'ensemble' || SOUND_PROFILE === 'ensemble-classic' || SOUND_PROFILE === 'ensemble-percussion';
export function configurarInstrumentos(selected) { return engine.configurarInstrumentos?.(selected); }
export function reproducirOrquesta(samples, onProgress) {
  if (!admiteInstrumentos) throw new Error('La orquesta requiere el perfil ensemble.');
  return engine.reproducirOrquesta(samples, onProgress);
}

export function configurarImagen(samples) { return engine.configurarImagen?.(samples) ?? null; }

export function pausarExploracion() { engine.pausarExploracion?.(); }
export function mantenerExploracion() { engine.mantenerExploracion?.(); }
