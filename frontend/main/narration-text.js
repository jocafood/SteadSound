/** Keep speech requests short without losing words in long image descriptions. */
export function splitNarration(text, limit = 180) {
  const words = text.trim().split(/\s+/);
  const chunks = [];
  let chunk = '';
  for (const word of words) {
    if (chunk && chunk.length + word.length + 1 > limit) { chunks.push(chunk); chunk = ''; }
    chunk += (chunk ? ' ' : '') + word;
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}
