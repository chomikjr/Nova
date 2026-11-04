#!/usr/bin/env node
/* Scans assets/audio/<station>/ for audio files and writes assets/audio/manifest.json.
   Vercel runs this on every deploy (see vercel.json). Run it yourself to test locally:
     node scripts/build-audio-manifest.js
   Optional per-station extras inside a station folder:
     station.json  {"name": "Hip Hop", "vibe": "Beats to game to", "order": 1, "hue": 280}
     cover.jpg / cover.png / cover.webp  (station artwork)
   No dependencies. */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'assets', 'audio');
const AUDIO = /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|webm)$/i;
const COVER = /^cover\.(jpe?g|png|webp|gif)$/i;

const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
const titleCase = (s) => s.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase());
const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-') || 'station';
const hueOf = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 360; };

/* "03 - Artist - Song Name.mp3" -> { artist: "Artist", title: "Song Name" } */
function parseName(file) {
  let base = path.basename(file).replace(/\.[^.]+$/, '');
  base = base.replace(/_/g, ' ').replace(/^\s*\d{1,3}\s*[.)\-_]\s*/, '').replace(/\s+/g, ' ').trim();
  const parts = base.split(/\s+[-–—]\s+/);
  if (parts.length >= 2) return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
  return { title: base || path.basename(file) };
}

function walk(dir, rel = '') {
  let out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const r = rel ? rel + '/' + ent.name : ent.name;
    if (ent.isDirectory()) out = out.concat(walk(path.join(dir, ent.name), r));
    else if (AUDIO.test(ent.name)) out.push(r);
  }
  return out;
}

function build() {
  if (!fs.existsSync(ROOT)) fs.mkdirSync(ROOT, { recursive: true });
  const stations = [];
  const used = new Set();
  for (const ent of fs.readdirSync(ROOT, { withFileTypes: true }).sort((a, b) => natural(a.name, b.name))) {
    if (!ent.isDirectory() || ent.name.startsWith('.') || ent.name.startsWith('_')) continue;
    const dir = path.join(ROOT, ent.name);
    let extra = {};
    try { extra = JSON.parse(fs.readFileSync(path.join(dir, 'station.json'), 'utf8')); } catch (e) { /* optional */ }
    let id = slug(ent.name);
    while (used.has(id)) id += '-2';
    used.add(id);
    const cover = fs.readdirSync(dir).find((f) => COVER.test(f)) || null;
    const files = walk(dir).sort(natural);
    stations.push({
      id,
      folder: ent.name,
      name: extra.name || titleCase(ent.name),
      vibe: extra.vibe || '',
      hue: typeof extra.hue === 'number' ? extra.hue : hueOf(ent.name),
      order: typeof extra.order === 'number' ? extra.order : 999,
      cover,
      tracks: files.map((file) => Object.assign({ file }, parseName(file)))
    });
  }
  stations.sort((a, b) => a.order - b.order || natural(a.name, b.name));
  const manifest = { generated: new Date().toISOString(), stations };
  fs.writeFileSync(path.join(ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  const total = stations.reduce((n, s) => n + s.tracks.length, 0);
  console.log('audio manifest: ' + stations.length + ' stations, ' + total + ' tracks');
  stations.forEach((s) => console.log('  ' + s.name.padEnd(20) + s.tracks.length + ' tracks  (assets/audio/' + s.folder + ')'));
}

build();
