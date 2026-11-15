/** Read-only check after deployment: node scripts/check-deployment.mjs https://YOUR.vercel.app */
const base = new URL(process.argv[2] || 'http://localhost:8000');
if (!['http:', 'https:'].includes(base.protocol)) throw new Error('Use an HTTP(S) URL.');
async function check(path, type) {
  const response = await fetch(new URL(path, base));
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}. Check deployment protection and function logs.`);
  if (!response.headers.get('content-type')?.includes(type)) throw new Error(`${path}: expected ${type}, got ${response.headers.get('content-type')}`);
  return response;
}
const html=await (await check('/', 'text/html')).text();
if (!html.includes('SteadSound')) throw new Error('UI entry is missing.');
const {images}=await (await check('/api/images','application/json')).json();
if (!images?.length) throw new Error('The catalog is empty.');
for (const image of images) {
  const detail = await (await check(`/api/images/${image.id}`, 'application/json')).json();
  if (detail.image.id !== image.id) throw new Error('Image detail does not match catalog.');
  await (await check(image.imageUrl, 'image/')).arrayBuffer();
  await (await check(image.originalUrl, 'image/')).arrayBuffer();
}
await (await check('/api/openapi.json', 'application/json')).json();
console.log(`UI, API and ${images.length} images with originals: OK on ${base.origin}`);
