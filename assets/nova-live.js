/* ==========================================================================
   NOVA LIVE — "Online now" presence + owner admin commands.
   Everyone on the site joins a Supabase Realtime presence channel. The owner's
   Admin app lists who's online and inserts rows into public.admin_commands;
   only the owner can insert (RLS). Every visitor listens for rows aimed at them
   (or at "*" = everyone) and plays the effect. Nothing here touches saves.
   ========================================================================== */
(function () {
  'use strict';
  const A = window.Arcade, OS = window.NovaOS, icon = A.icon, esc = A.esc;
  if (!A || A.embed) return;
  const $ = (s, r) => (r || document).querySelector(s);

  const COMMANDS = [
    { id: 'flip',      label: 'Flip',      icon: 'restore',  desc: 'Screen upside down for 15s' },
    { id: 'spin',      label: 'Spin',      icon: 'refresh',  desc: 'Windows slowly rotate for 20s' },
    { id: 'shake',     label: 'Shake',     icon: 'zap',      desc: 'Earthquake for 4s' },
    { id: 'confetti',  label: 'Confetti',  icon: 'sparkles', desc: 'Confetti and fireworks' },
    { id: 'message',   label: 'Message',   icon: 'send',     desc: 'Big announcement', input: 'text' },
    { id: 'song',      label: 'Song',      icon: 'music',    desc: 'Start a music station', input: 'station' },
    { id: 'mute',      label: 'Mute',      icon: 'volumeX',  desc: 'Stop their music' },
    { id: 'lock',      label: 'Lock',      icon: 'lock',     desc: 'Back to the lock screen' },
    { id: 'wallpaper', label: 'Wallpaper', icon: 'image',    desc: 'Swap wallpaper for 60s', input: 'wallpaper' },
    { id: 'tiny',      label: 'Tiny mode', icon: 'minus',    desc: 'Half-size desktop for 30s' },
    { id: 'gift',      label: 'Gift',      icon: 'trophy',   desc: 'Give XP and/or a title', input: 'gift' },
    { id: 'kick',      label: 'Kick',      icon: 'x',        desc: 'Close the game they’re in' }
  ];
  const WALLS = [['galaxy.jpg', 'Galaxy'], ['nebula-drift.jpg', 'Nebula'], ['northern-lights.jpg', 'Northern lights'], ['pink-moon.jpg', 'Pink moon'], ['swirl.jpg', 'Swirl'], ['smoke.jpg', 'Smoke']];
  const WALL_DIR = A.url('assets/wallpapers/');

  /* ------------------------------------------------------------ identity */
  function guestId() {
    let g = A.store.get('liveGuest', null);
    if (!g) { g = Math.random().toString(16).slice(2, 10).padEnd(8, '0'); A.store.set('liveGuest', g); }
    return g;
  }
  function myKey() { const u = A.auth.current(); return u && u.cloud ? 'u:' + u.id : 'g:' + guestId(); }
  function myInfo() {
    const u = A.auth.current(), w = OS && OS.wins ? [...OS.wins.values()].filter((x) => !x.min) : [];
    let top = null; w.forEach((x) => { if (!top || +x.el.style.zIndex > +top.el.style.zIndex) top = x; });
    return { name: u ? u.username : 'Guest ' + guestId().slice(0, 4).toUpperCase(), guest: !u, owner: A.auth.isOwner(), doing: top ? top.opts.title : 'Desktop', at: Date.now() };
  }

  /* -------------------------------------------------- realtime plumbing */
  let client = null, presence = null, cmdCh = null, key = null, online = {};
  const listeners = new Set();
  const emitOnline = () => listeners.forEach((fn) => { try { fn(online); } catch (e) {} });

  async function connect() {
    await A.ready; client = A.cloud.client; if (!client) return;
    const k = myKey();
    if (k === key && presence) { track(); return; }
    key = k;
    if (presence) { try { await client.removeChannel(presence); } catch (e) {} }
    if (cmdCh) { try { await client.removeChannel(cmdCh); } catch (e) {} }

    presence = client.channel('nova-online', { config: { presence: { key: k } } });
    presence.on('presence', { event: 'sync' }, () => {
      const st = presence.presenceState(); online = {};
      Object.keys(st).forEach((pk) => { const metas = st[pk]; if (metas && metas.length) online[pk] = metas[metas.length - 1]; });
      emitOnline();
    });
    presence.subscribe((s) => { if (s === 'SUBSCRIBED') track(); });

    const onRow = (p) => { const r = p && p.new; if (r) run(r.cmd, r.arg || {}); };
    cmdCh = client.channel('nova-cmd-' + k.replace(/[^a-z0-9]/gi, '').slice(0, 30))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_commands', filter: 'target=eq.' + k }, onRow)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_commands', filter: 'target=eq.*' }, onRow)
      .subscribe();
  }
  let trackT = 0;
  function track() { if (!presence) return; clearTimeout(trackT); trackT = setTimeout(() => { try { presence.track(myInfo()); } catch (e) {} }, 250); }

  /* ------------------------------------------------------------ effects */
  const root = document.documentElement;
  const timers = {};
  function timed(cls, ms) {
    root.classList.add(cls); clearTimeout(timers[cls]);
    timers[cls] = setTimeout(() => root.classList.remove(cls), ms);
  }
  function label(text) { A.ui.toast('Admin: ' + text, 'crown'); }

  function showMessage(text) {
    const old = $('.adm-msg'); if (old) old.remove();
    const el = A.ui.el('<div class="adm-msg" role="alertdialog" aria-label="Message from the admin"><div class="adm-msg-card"><span class="adm-tag">' + icon('crown') + 'Admin</span><p></p><button class="btn btn-primary btn-sm">OK</button></div></div>');
    $('p', el).textContent = String(text || '').slice(0, 280);
    document.body.appendChild(el); A.audio.sfx('levelup');
    const close = () => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 250); };
    $('button', el).addEventListener('click', close);
    setTimeout(close, 12000);
  }
  function swapWallpaper(file) {
    if (!WALLS.some((w) => w[0] === file)) file = WALLS[0][0];
    let el = $('.adm-wall');
    if (!el) { el = document.createElement('div'); el.className = 'adm-wall'; el.setAttribute('aria-hidden', 'true'); document.body.prepend(el); }
    el.style.backgroundImage = 'url("' + WALL_DIR + file + '")';
    requestAnimationFrame(() => el.classList.add('on'));
    clearTimeout(timers.wall);
    timers.wall = setTimeout(() => { el.classList.remove('on'); setTimeout(() => el.remove(), 800); }, 60000);
  }
  async function playStation(id) {
    const m = A.audio.music; await m.stations.load();
    const st = m.stations.get(id) || m.stations.list[0];
    if (st) A.settings.set('track', st.key);
    A.settings.set('music', true);
    return st ? st.name : 'music';
  }
  function gift(arg) {
    const xp = Math.max(0, Math.min(100000, Math.floor(+arg.xp || 0)));
    const title = String(arg.title || '').trim().slice(0, 32);
    if (xp) A.meta.addXP(xp, 'admin gift');
    if (title) A.meta.edit((m) => { m.flags.adminTitle = title; });
    if (OS && OS.confetti) OS.confetti(140);
    A.ui.toast('Gift from the admin: ' + [xp ? '+' + xp.toLocaleString() + ' XP' : '', title ? 'title “' + title + '”' : ''].filter(Boolean).join(' and '), 'crown', { big: true });
  }

  async function run(cmd, arg) {
    try {
      switch (cmd) {
        case 'flip': timed('adm-flip', 15000); label('flipped your screen'); break;
        case 'spin': timed('adm-spin', 20000); label('set your windows spinning'); break;
        case 'shake': timed('adm-shake', 4000); A.audio.sfx('whoosh'); label('earthquake!'); break;
        case 'confetti': if (OS && OS.confetti) { OS.confetti(220); setTimeout(() => OS.confetti(160), 900); } label('confetti for you'); break;
        case 'message': showMessage(arg.text); break;
        case 'song': label('now playing ' + (await playStation(arg.station))); break;
        case 'mute': A.settings.set('music', false); label('muted your music'); break;
        case 'lock': if (OS && OS.showLock) OS.showLock(); break;
        case 'wallpaper': swapWallpaper(arg.file); label('changed your wallpaper for a minute'); break;
        case 'tiny': timed('adm-tiny', 30000); label('shrank your desktop'); break;
        case 'gift': gift(arg); break;
        case 'kick': {
          let n = 0; if (OS && OS.wins) [...OS.wins.values()].forEach((w) => { if (w.opts.game) { OS.closeWindow(w); n++; } });
          label(n ? 'kicked you out of your game' : 'tried to kick you, but you weren’t in a game');
          break;
        }
      }
    } catch (e) { console.warn('[nova] admin command failed', cmd, e); }
  }

  /* ----------------------------------------------- owner: send commands */
  async function send(target, cmd, arg) {
    if (!A.auth.isOwner() || !client) throw new Error('Owner only.');
    const { error } = await client.from('admin_commands').insert({ target, cmd, arg: arg || {} });
    if (error) throw error;
  }

  /* Admin app section. Returns a cleanup function. */
  function mountPanel(box) {
    let sel = null;
    box.innerHTML = '<section style="display:grid;gap:10px"><div class="sec-title"><h4>Online now <span class="pill lv-count" style="margin-left:6px">0</span></h4></div>' +
      '<div class="lv-list"><div class="empty">Connecting…</div></div>' +
      '<div class="lv-cmds" hidden><div class="os-label lv-target"></div>' +
      '<div class="lv-extra" style="display:grid;gap:8px;margin:8px 0">' +
        '<input class="input lv-text" maxlength="280" placeholder="Message to show (for Message)">' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap"><select class="input lv-station" style="flex:1;min-width:140px" aria-label="Station (for Song)"></select>' +
        '<select class="input lv-wall" style="flex:1;min-width:140px" aria-label="Wallpaper">' + WALLS.map((w) => '<option value="' + w[0] + '">' + w[1] + '</option>').join('') + '</select></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap"><input class="input lv-xp" type="number" min="0" max="100000" step="50" placeholder="Gift XP" style="flex:1;min-width:100px"><input class="input lv-title" maxlength="32" placeholder="Gift title, e.g. Admin’s favorite" style="flex:2;min-width:160px"></div>' +
      '</div><div class="lv-grid">' + COMMANDS.map((c) => '<button class="btn btn-sm lv-cmd" data-cmd="' + c.id + '" title="' + esc(c.desc) + '">' + icon(c.icon) + esc(c.label) + '</button>').join('') + '</div></div></section>';

    A.audio.music.stations.load().then((list) => { const s = $('.lv-station', box); if (s) s.innerHTML = list.length ? list.map((st) => '<option value="' + esc(st.id) + '">' + esc(st.name) + '</option>').join('') : '<option value="">No stations</option>'; });

    const paint = () => {
      const keys = Object.keys(online).filter((k) => k !== key).sort((a, b) => (online[a].guest - online[b].guest) || String(online[a].name).localeCompare(online[b].name));
      $('.lv-count', box).textContent = keys.length;
      if (sel && sel !== '*' && !online[sel]) sel = null;
      const row = (k, name, sub, ico) => '<button class="nf lv-who' + (sel === k ? ' is-sel' : '') + '" data-k="' + esc(k) + '" style="align-items:center;text-align:left;width:100%">' + ico + '<span style="flex:1;min-width:0"><b style="display:block">' + esc(name) + '</b><small>' + esc(sub) + '</small></span></button>';
      $('.lv-list', box).innerHTML = '<div style="display:grid;gap:6px">' +
        row('*', 'Everyone', keys.length + ' online', '<span class="pill hot" style="flex:none">' + icon('globe') + '</span>') +
        (keys.length ? keys.map((k) => { const p = online[k]; return row(k, p.name, (p.guest ? 'Guest · ' : '') + 'In ' + (p.doing || 'Desktop'), '<span class="pill" style="flex:none">' + icon(p.guest ? 'phone' : 'user') + '</span>'); }).join('') : '<div class="empty">Nobody else is online right now.</div>') + '</div>';
      $('.lv-cmds', box).hidden = !sel;
      if (sel) $('.lv-target', box).textContent = 'Send to: ' + (sel === '*' ? 'Everyone online' : online[sel].name);
    };
    listeners.add(paint); paint();

    const onClick = async (e) => {
      const w = e.target.closest('.lv-who'); if (w) { sel = sel === w.dataset.k ? null : w.dataset.k; paint(); return; }
      const b = e.target.closest('.lv-cmd'); if (!b || !sel) return;
      const cmd = b.dataset.cmd, arg = {};
      if (cmd === 'message') { arg.text = $('.lv-text', box).value.trim(); if (!arg.text) { A.ui.toast('Type a message first.', 'info'); $('.lv-text', box).focus(); return; } }
      if (cmd === 'song') arg.station = $('.lv-station', box).value;
      if (cmd === 'wallpaper') arg.file = $('.lv-wall', box).value;
      if (cmd === 'gift') { arg.xp = +$('.lv-xp', box).value || 0; arg.title = $('.lv-title', box).value.trim(); if (!arg.xp && !arg.title) { A.ui.toast('Add some XP or a title to gift.', 'info'); return; } }
      b.disabled = true;
      try { await send(sel, cmd, arg); A.ui.toast('Sent ' + cmd + ' to ' + (sel === '*' ? 'everyone' : online[sel] ? online[sel].name : 'them'), 'check'); }
      catch (err) { console.warn(err); A.ui.toast('Couldn’t send that command.', 'info'); }
      finally { setTimeout(() => { b.disabled = false; }, 600); }
    };
    box.addEventListener('click', onClick);
    return () => { listeners.delete(paint); box.removeEventListener('click', onClick); };
  }

  /* --------------------------------------------------------------- boot */
  A.on('auth', () => connect());
  let actT = 0;
  ['pointerdown', 'keydown'].forEach((ev) => addEventListener(ev, () => { clearTimeout(actT); actT = setTimeout(track, 1500); }, { passive: true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) track(); });
  setInterval(track, 60000);
  connect();

  window.NovaLive = { mountPanel, run, online: () => online, commands: COMMANDS };
})();
