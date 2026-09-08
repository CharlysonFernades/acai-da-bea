import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

function localFile(pathname) {
  const clean = decodeURIComponent(pathname.split('?')[0]);
  const relative = clean === '/' ? 'index.html' : clean.endsWith('/') ? `${clean.slice(1)}index.html` : clean.slice(1);
  const resolved = path.resolve(root, relative);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) return null;
  return resolved;
}

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  return 'application/octet-stream';
}

async function handler(req, res) {
  const file = localFile(req.url || '/');
  if (!file) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const body = await fs.readFile(file);
    res.writeHead(200, { 'content-type': contentType(file), 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}

test('servidor local entrega cliente, painel e scripts principais', async t => {
  const server = http.createServer((req, res) => void handler(req, res));
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise(resolve => server.close(resolve)));

  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  const checks = [
    ['/', /Açaí da Bea/],
    ['/admin/', /Painel administrativo/],
    ['/js/app.js', /function renderProducts/],
    ['/admin/admin.js', /function renderProducts/]
  ];

  for (const [url, expected] of checks) {
    const response = await fetch(`${base}${url}`);
    assert.equal(response.status, 200, `${url} deve responder 200`);
    assert.match(await response.text(), expected, `${url} deve entregar o conteúdo esperado`);
  }
});

test('servidor local não permite escapar da raiz por caminho relativo', () => {
  assert.equal(localFile('/../fora.txt'), null);
  assert.equal(localFile('/%2e%2e/%2e%2e/etc/passwd'), null);
});
