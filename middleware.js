/* Server-side gate (Vercel Routing Middleware).
   - Games that are switched off stay unreachable by direct link.
   - In lockdown, every game needs a pass, so the "shut down" page can't be skipped
     by going to a game's address directly.
   A pass is the random token unlock_site hands out for the right code; the page keeps it
   in the nova_pass cookie and the database checks it (pass_status). */

const SUPABASE = 'https://oazqmjnkkyqwxpsglgcb.supabase.co';
const KEY = 'sb_publishable_h-I9xAYcRlVRze13k2v40Q_CZ6Rf8C3';
const OFF = ['/games/gta-3/', '/games/how-to-fish/'];

export const config = { matcher: ['/games/:path*'] };

const cache = new Map(); // token -> { at, valid, lockdown }
async function status(token) {
  const key = token || '-';
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 30000) return hit;
  let res = { at: Date.now(), valid: false, lockdown: false };
  try {
    const r = await fetch(SUPABASE + '/rest/v1/rpc/pass_status', {
      method: 'POST',
      headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ bypass: token || null })
    });
    if (r.ok) { const j = await r.json(); res = { at: Date.now(), valid: !!j.valid, lockdown: !!j.lockdown }; }
  } catch (e) { /* database unreachable: treat as no pass */ }
  if (cache.size > 500) cache.clear();
  cache.set(key, res);
  return res;
}

function deny(msg) {
  return new Response('<!doctype html><meta charset="utf-8"><title>Unavailable</title><body style="background:#04020a;color:#b9b0cf;font:16px system-ui;display:grid;place-items:center;height:100vh;margin:0">' + msg + '</body>', {
    status: 403,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'cross-origin-resource-policy': 'same-origin' }
  });
}

export default async function middleware(request) {
  const path = new URL(request.url).pathname;
  if (OFF.some((p) => path.startsWith(p))) return deny('This game is unavailable right now.');
  const m = /(?:^|;\s*)nova_pass=([0-9a-f-]{36})/i.exec(request.headers.get('cookie') || '');
  const token = m ? m[1] : null;
  if (!token) {
    const s = await status(null);
    if (s.lockdown) return deny('Nova has shut down.');
    return; // carry on to the file
  }
  const s = await status(token);
  if (s.valid) return;
  if (s.lockdown) return deny('Nova has shut down.');
}
