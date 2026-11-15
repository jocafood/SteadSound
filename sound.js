/** Fachada estable para la UI. Rollback: VITE_SOUND_PROFILE=legacy al compilar. */
import * as ambient from './audio/ambient.js';
import * as legacy from './audio/legacy.js';

export const SOUND_PROFILE = import.meta.env.VITE_SOUND_PROFILE === 'legacy' ? 'legacy' : 'ambient';
const engine = SOUND_PROFILE === 'legacy' ? legacy : ambient;
export const iniciarAudio = engine.iniciarAudio;
export const reproducirSonido = engine.reproducirSonido;
export const detenerAudio = engine.detenerAudio;
export const audioActivo = engine.audioActivo;
