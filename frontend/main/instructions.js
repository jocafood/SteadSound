import { narrate } from './narration.js';

export const PLAYER_INSTRUCTIONS = 'To hear image colors, activate Enable sound first. Use Tab or Shift and Tab to focus the image explorer, then use the arrow keys to navigate. Hold Shift for larger steps. Enter or Space plays the current point. Changing any instrument or combination stops sound: activate Enable sound again before continuing. Read image description reads the scientific description only when requested. Scan image plays the image from top to bottom. Escape closes the player.';
const key = 'steadsound.player-instructions.v1';
let introduced = false;
function wasIntroduced() {
  try { return introduced || sessionStorage.getItem(key) === 'shown'; }
  catch { return introduced; }
}
export function readInstructions({ repeat = false } = {}) {
  if (!repeat && wasIntroduced()) return false;
  const requested = narrate(PLAYER_INSTRUCTIONS, repeat);
  if (requested) {
    introduced = true;
    try { sessionStorage.setItem(key, 'shown'); } catch { /* memory fallback */ }
  }
  return requested;
}
