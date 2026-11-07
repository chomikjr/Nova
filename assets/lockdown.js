/* Nova site flags: games the owner has switched off, and lockdown mode.
   Runs after core.js and before os.js. The bypass code is never in this file:
   the server checks it (unlock_site) and hands back a token that site_state accepts. */
(function () {
  'use strict';
  const A = window.Arcade;
  const KEY_LOCK = 'nova.lock', KEY_OFF = 'nova.offGames', KEY_PASS = 'nova.bypass';
  const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };

  /* ---------- games switched off ("broken") ---------- */
  const isOff = (g) => g.status === 'broken';
  function applyOff(ids) {
    const off = new Set(ids);
    A.games.forEach((g) => {
      if (off.has(g.id) && g.status === 'live') g.status = 'broken';
      else if (!off.has(g.id) && isOff(g)) g.status = 'live';
    });
  }
  let cachedOff = [];
  try { cachedOff = JSON.parse(get(KEY_OFF) || '[]'); } catch (e) {}
  applyOff(cachedOff); // before os.js builds its library

  /* ---------- lockdown screen ---------- */
  const LOGO = '<svg viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>';
  const CSS = '#nova-lock{position:fixed;inset:0;z-index:2147483000;background:radial-gradient(ellipse at 50% 30%,#1a1030,#04020a 70%);color:#e9e4f5;display:grid;place-items:center;font-family:Outfit,system-ui,sans-serif;text-align:center;padding:24px}' +
    '#nova-lock .nl-in{max-width:520px;display:grid;gap:14px;justify-items:center}' +
    '#nova-lock .nl-logo{width:84px;height:84px;cursor:default;user-select:none;-webkit-tap-highlight-color:transparent;filter:drop-shadow(0 0 18px rgba(167,139,250,.45))}' +
    '#nova-lock .nl-word{font-weight:200;font-size:34px;letter-spacing:.5em;margin-right:-.5em}' +
    '#nova-lock h1{margin:8px 0 0;font-weight:500;font-size:26px}#nova-lock p{margin:0;color:#b9b0cf;line-height:1.55}' +
    '#nova-lock a.nl-go{margin-top:6px;display:inline-block;padding:11px 22px;border-radius:12px;background:#7c3aed;color:#fff;text-decoration:none;font-weight:500}' +
    '#nova-lock .nl-term{display:none;width:min(440px,90vw);margin-top:10px;text-align:left;background:#05030a;border:1px solid #2a2140;border-radius:10px;padding:14px;font:13px/1.6 ui-monospace,Consolas,monospace;color:#a7f3d0}' +
    '#nova-lock .nl-term.on{display:block}#nova-lock .nl-term input{width:100%;box-sizing:border-box;background:transparent;border:0;outline:0;color:#a7f3d0;font:inherit;caret-color:#a7f3d0}' +
    '#nova-lock .nl-out{white-space:pre-wrap;min-height:1.6em}#nova-lock .nl-out .bad{color:#fca5a5}';

  let overlay = null;
  function showLock() {
    if (overlay) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    overlay = document.createElement('div'); overlay.id = 'nova-lock'; overlay.setAttribute('role', 'alert');
    overlay.innerHTML = '<div class="nl-in"><div class="nl-logo" aria-hidden="true">' + LOGO + '</div><div class="nl-word">NOVA</div>' +
      '<h1>Nova has shut down</h1><p>Thanks for playing. Nova is no longer available here &mdash; the site has moved to <b>orbit.delsea.one</b>.</p>' +
      '<a class="nl-go" href="https://orbit.delsea.one/">Go to orbit.delsea.one</a>' +
      '<div class="nl-term" aria-hidden="true"><div class="nl-out">nova@console:~$ access code required</div><input type="password" autocomplete="off" spellcheck="false" aria-label="Code"></div></div>';
    document.body.appendChild(overlay);
    document.title = 'Nova — shut down';
    const term = overlay.querySelector('.nl-term'), out = overlay.querySelector('.nl-out'), input = term.querySelector('input');
    let taps = 0, tapTimer = 0;
    overlay.querySelector('.nl-logo').addEventListener('click', () => {
      taps++; clearTimeout(tapTimer); tapTimer = setTimeout(() => (taps = 0), 2500);
      if (taps >= 5) { taps = 0; term.classList.add('on'); input.focus(); }
    });
    let busy = false;
    input.addEventListener('keydown', async (e) => {
      e.stopPropagation();
      if (e.key !== 'Enter' || busy) return;
      const code = input.value; input.value = ''; if (!code) return;
      busy = true; out.textContent = 'nova@console:~$ verifying…';
      const token = await unlock(code);
      busy = false;
      if (token) { set(KEY_PASS, token); out.textContent = 'nova@console:~$ access granted'; setTimeout(() => location.reload(), 500); }
      else out.innerHTML = 'nova@console:~$ <span class="bad">access denied</span>';
    });
    // Keep the desktop's keyboard shortcuts from firing underneath.
    overlay.addEventListener('keydown', (e) => e.stopPropagation());
  }
  function hideLock() { if (overlay) { overlay.remove(); overlay = null; document.title = 'Nova OS'; } }

  async function client() { try { await A.ready; } catch (e) {} return A.cloud && A.cloud.client; }
  async function unlock(code) {
    const c = await client(); if (!c) return null;
    const { data, error } = await c.rpc('unlock_site', { code });
    return error ? null : data;
  }

  if (get(KEY_LOCK) === '1') showLock(); // last known state, so the desktop doesn't flash

  async function refresh() {
    const c = await client(); if (!c) return null;
    const { data, error } = await c.rpc('site_state', { bypass: get(KEY_PASS) || null });
    if (error || !data) return null;
    set(KEY_LOCK, data.locked ? '1' : null);
    if (data.locked) showLock(); else hideLock();
    const ids = (data.disabled || []).slice().sort();
    if (JSON.stringify(ids) !== JSON.stringify(cachedOff.slice().sort())) {
      cachedOff = ids; set(KEY_OFF, JSON.stringify(ids)); applyOff(ids); A.emit('flags', { disabled: ids });
    }
    return data;
  }
  refresh();
  A.on('auth', refresh);

  /* ---------- owner controls, used by the Admin app ---------- */
  A.flags = {
    refresh,
    disabled: () => cachedOff.slice(),
    async setLockdown(on) { const c = await client(); const { error } = await c.rpc('set_lockdown', { on_: !!on }); if (error) throw error; return refresh(); },
    async disable(id, note) { const c = await client(); const { error } = await c.from('disabled_games').upsert({ game_id: id, note: note || null, updated_at: new Date().toISOString() }); if (error) throw error; return refresh(); },
    async enable(id) { const c = await client(); const { error } = await c.from('disabled_games').delete().eq('game_id', id); if (error) throw error; return refresh(); }
  };
})();
