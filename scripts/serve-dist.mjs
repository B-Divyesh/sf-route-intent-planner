import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve(process.cwd(), 'dist');
const portFlag = process.argv.indexOf('--port');
const port = portFlag >= 0 ? Number(process.argv[portFlag + 1]) : 4173;
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
};

async function existingFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const candidate = resolve(root, `.${decoded}`);
  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) return null;
  try {
    const details = await stat(candidate);
    if (details.isDirectory()) return resolve(candidate, 'index.html');
    return details.isFile() ? candidate : null;
  } catch {
    return null;
  }
}

createServer(async (request, response) => {
  const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname;
  let file = await existingFile(pathname === '/' ? '/index.html' : pathname);
  let status = 200;
  if (!file) {
    file = resolve(root, '404.html');
    status = 404;
  }
  try {
    const body = await readFile(file);
    const extension = extname(file);
    response.writeHead(status, {
      'Content-Type': pathname === '/manifest.json' ? 'application/manifest+json; charset=utf-8' : types[extension] || 'application/octet-stream',
      'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
      'Content-Security-Policy': "default-src 'self'; base-uri 'self'; connect-src 'self' https://api.sociobot.in https://pilot-api.sociobot.in https://routing.openstreetmap.de; img-src 'self' data:; manifest-src 'self'; object-src 'none'; script-src 'self'; style-src 'self'; worker-src 'self'; frame-ancestors 'none'; form-action 'self'",
      'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    });
    if (request.method === 'HEAD') response.end();
    else response.end(body);
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('The local preview could not read the production build.');
  }
}).listen(port, '127.0.0.1', () => {
  process.stdout.write(`Route Intent Planner preview: http://127.0.0.1:${port}\n`);
});
