#!/usr/bin/env node
/* Copies the Scramjet proxy runtime into proxy/lib/ so the static site can serve it:
     proxy/lib/scram/    ← @mercuryworkshop/scramjet/dist   (scramjet.all.js, .sync.js, .wasm.wasm)
     proxy/lib/baremux/  ← @mercuryworkshop/bare-mux/dist   (index.js, worker.js)
     proxy/lib/libcurl/  ← @mercuryworkshop/libcurl-transport/dist (index.mjs)
   Vercel runs `npm install` then this (see vercel.json). Locally: npm install && npm run build:proxy
   If a package is missing the build keeps going (the games still deploy); the Browser app
   then shows "Browser files aren't built". */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'proxy', 'lib');
const PARTS = [
  ['scram', '@mercuryworkshop/scramjet', ['scramjet.all.js', 'scramjet.sync.js', 'scramjet.wasm.wasm']],
  ['baremux', '@mercuryworkshop/bare-mux', ['index.js', 'worker.js']],
  ['libcurl', '@mercuryworkshop/libcurl-transport', ['index.mjs']]
];

let ok = true;
fs.rmSync(OUT, { recursive: true, force: true });
for (const [dir, pkg, must] of PARTS) {
  const src = path.join(ROOT, 'node_modules', ...pkg.split('/'), 'dist');
  if (!fs.existsSync(src)) { console.warn('[proxy] missing ' + pkg + ' — run npm install'); ok = false; continue; }
  const dest = path.join(OUT, dir);
  fs.cpSync(src, dest, { recursive: true, filter: (p) => !/\.(d\.ts|map)$/.test(p) && !p.includes(path.sep + 'types') });
  const missing = must.filter((f) => !fs.existsSync(path.join(dest, f)));
  if (missing.length) { console.warn('[proxy] ' + pkg + ' is missing ' + missing.join(', ')); ok = false; }
  else console.log('[proxy] ' + pkg + ' → proxy/lib/' + dir);
}
console.log(ok ? '[proxy] Nova Browser runtime ready.' : '[proxy] Nova Browser runtime incomplete (games are unaffected).');

// The site deploys from the repo root, so keep node_modules out of the published files.
if (process.env.VERCEL) fs.rmSync(path.join(ROOT, 'node_modules'), { recursive: true, force: true });
