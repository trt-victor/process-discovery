// Static files only. Everything the client says stays in their browser until they hand it to the reimagination app.
import http from 'node:http';
import { readFile } from 'node:fs/promises';

const PORT = process.env.PORT || 4270;
// Where the Process Reimagination app runs: the last screen hands the interview over to it.
const REIMAGINE = (process.env.REIMAGINE_URL || 'http://localhost:4173').replace(/\/$/, '');
const FILES = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/logic.js': ['logic.js', 'text/javascript'], '/content.js': ['content.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'] };

http.createServer((req, res) => {
  const path = new URL(req.url, 'http://x').pathname;
  if (path === '/api/config') return res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ reimagine: REIMAGINE }));
  const f = FILES[path];
  if (!f || req.method !== 'GET') return res.writeHead(404).end('Not found');
  readFile(new URL('./public/' + f[0], import.meta.url)).then((d) => res.writeHead(200, { 'content-type': f[1] + '; charset=utf-8', 'cache-control': 'no-store' }).end(d), () => res.writeHead(500).end());
}).listen(PORT, '127.0.0.1', () => console.log(`Process Discovery on http://localhost:${PORT}`));
