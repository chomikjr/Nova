/* ==========================================================================
   NOVA OS — desktop shell: window manager, dock, start menu, search palette,
   home widgets and built-in apps. Games run inside windows (iframes).
   ========================================================================== */
(function () {
  'use strict';
  const A = window.Arcade, icon = A.icon, esc = A.esc;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const isMobile = () => matchMedia('(max-width: 760px)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const LIVE = A.games.filter((g) => g.status === 'live');
  const byId = (id) => LIVE.find((g) => g.id === id);
  const onEv = (name, fn) => { const h = (e) => fn(e.detail); window.addEventListener('arcade:' + name, h); return () => window.removeEventListener('arcade:' + name, h); };
  const ago = (t) => { const s = (Date.now() - t) / 1000; if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago'; return Math.floor(s / 86400) + 'd ago'; };
  const hueBg = (h) => { const k = ((((h || 0) % 360) + 360) % 360) / 360; return 'linear-gradient(135deg,hsl(' + Math.round(255 + k * 35) + ',78%,' + Math.round(50 + k * 16) + '%),hsl(' + Math.round(265 + k * 20) + ',72%,' + Math.round(18 + k * 10) + '%))'; };
  const TILE = 'var(--tile)';
  /* filled app glyphs (24×24) — each app gets its own shape and shade of violet */
  const GLYPH = {
    games: '<path fill="#fff" d="M6 7h12a4 4 0 0 1 4 4v3.5a3 3 0 0 1-5.3 1.9L15.3 15H8.7l-1.4 1.4A3 3 0 0 1 2 14.5V11a4 4 0 0 1 4-4Zm1.2 3v1.3H6v1.4h1.2V14h1.4v-1.3h1.2v-1.4H8.6V10ZM16 10.2a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-1.6 1.8a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z"/>',
    browser: '<g fill="none" stroke="#d6ccff" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></g>',
    music: '<path fill="#fff" d="M9 17.5V6l11-2v11.5a2.5 2.5 0 1 1-1.6-2.3V7.8L10.6 9.2v8.3A2.5 2.5 0 1 1 9 17.5Z"/>',
    achievements: '<path fill="#eee8ff" d="M7 3h10v3.5a5 5 0 0 1-4 4.9V14h3v3H8v-3h3v-2.6a5 5 0 0 1-4-4.9V3Zm-3.5 1H6v2.6A2.6 2.6 0 0 1 3.5 4Zm17 0A2.6 2.6 0 0 1 18 6.6V4h2.5ZM6 18.5h12V21H6z"/>',
    leaderboard: '<path fill="#fff" d="M4 13h4.5v7H4zm5.75-8h4.5v15h-4.5zM15.5 9H20v11h-4.5z"/>',
    profile: '<path fill="#fff" d="M12 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9ZM4 20c.6-3.9 3.9-6 8-6s7.4 2.1 8 6Z"/>',
    settings: '<path fill="#e4defa" d="M10.3 2h3.4l.5 2.6c.6.2 1.2.5 1.7.9l2.5-.9 1.7 3-2 1.7a6.6 6.6 0 0 1 0 2l2 1.7-1.7 3-2.5-.9c-.5.4-1.1.7-1.7.9l-.5 2.6h-3.4l-.5-2.6a6 6 0 0 1-1.7-.9l-2.5.9-1.7-3 2-1.7a6.6 6.6 0 0 1 0-2l-2-1.7 1.7-3 2.5.9c.5-.4 1.1-.7 1.7-.9ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" transform="translate(0 1)"/>',
    notes: '<path fill="#fff" d="M5 3h14v12l-6 6H5Zm8 12v4.2l4.2-4.2Zm-5-8v1.6h8V7Zm0 3.5v1.6h8v-1.6Z"/>',
    request: '<path fill="#fff" d="m3 11 18-8-6.5 18-2.7-7.3Zm8.6 1.4 1.6 4.4L17.4 6.6Z"/>',
    updates: '<path fill="#fff" d="M13.5 2 4 14h7l-1.5 8L20 10h-7Z"/>',
    about: '<path fill="#e4defa" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-1.2 8v7.5h2.4V10Zm1.2-4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/>',
    admin: '<path fill="#fff" d="m3 7 4.5 3.5L12 4l4.5 6.5L21 7l-2 11H5Z"/>'
  };
  const SHADE = { games: '#6c4cf0', browser: '#2b1f5c', music: '#a24ad6', achievements: '#3d2b8f', leaderboard: '#5b3cc4', profile: '#7a3fc9',
    settings: '#2e2640', notes: '#8e5be8', request: '#4b2e9e', updates: '#3a2a7a', about: '#2e2640', admin: '#5a2a86' };

  /* ---------------------------------------------------------------- APPS */
  const APPS = {
    games:        { title: 'Games',        icon: 'gamepad', bg: TILE, w: 1060, h: 720, render: renderGames },
    browser:      { title: 'Browser',      icon: 'globe',   bg: TILE, w: 1120, h: 760, render: renderBrowser },
    music:        { title: 'Music',        icon: 'music',   bg: TILE, w: 470, h: 700, render: renderMusic },
    achievements: { title: 'Achievements', icon: 'trophy',  bg: TILE, w: 780, h: 640, render: renderAchievements },
    leaderboard:  { title: 'Leaderboard',  icon: 'chart',   bg: TILE, w: 540, h: 640, render: renderLeaderboard },
    profile:      { title: 'Profile',      icon: 'user',    bg: TILE, w: 580, h: 660, render: renderProfile },
    settings:     { title: 'Settings',     icon: 'settings', bg: TILE, w: 660, h: 700, render: renderSettings },
    notes:        { title: 'Notes',        icon: 'sticky',  bg: TILE, w: 460, h: 520, render: renderNotes },
    request:      { title: 'Request a Game', icon: 'send',  bg: TILE, w: 500, h: 600, render: renderRequest },
    updates:      { title: 'Update Log',   icon: 'zap',     bg: TILE, w: 520, h: 580, render: renderUpdates },
    about:        { title: 'About & Credits', icon: 'info', bg: TILE, w: 760, h: 640, render: renderAbout },
    admin:        { title: 'Admin', icon: 'crown', bg: TILE, w: 720, h: 660, render: renderAdmin, owner: true }
  };
  const visibleApps = () => Object.keys(APPS).filter((id) => !APPS[id].owner || A.auth.isOwner());
  const PINNED = ['games', 'browser', 'music', 'achievements', 'settings'];
  const appIco = (id, cls) => {
    const a = APPS[id];
    if (id === 'profile') { const u = A.auth.current(); if (u) return '<span class="app-ico av ' + (cls || '') + '" style="background:' + hueBg(u.hue) + '">' + esc(u.username[0].toUpperCase()) + '</span>'; }
    return '<span class="app-ico ' + (cls || '') + '" style="background:' + (SHADE[id] || a.bg) + '">' + (GLYPH[id] ? '<svg viewBox="0 0 24 24" aria-hidden="true">' + GLYPH[id] + '</svg>' : icon(a.icon)) + '</span>';
  };
  const gameIco = (g, cls) => g.image
    ? '<span class="' + (cls || 'dk-thumb') + '"><img src="games/ports/_thumbs/' + g.image + '.webp" alt="" loading="lazy"></span>'
    : '<span class="' + (cls || 'dk-thumb') + '" style="display:grid;place-items:center;background:' + hueBg(g.hue) + ';font:700 16px var(--font-os);color:#fff">' + esc(g.title[0]) + '</span>';

  /* cover art: image, or an animated canvas for games without one */
  function fillCovers(root) {
    $$('[data-cover]', root).forEach((el) => {
      if (el._filled) return; el._filled = true;
      const g = byId(el.dataset.cover); if (!g) return;
      if (g.image) el.insertAdjacentHTML('afterbegin', '<img src="games/ports/_thumbs/' + g.image + '.webp" alt="" loading="lazy">');
      else { const c = document.createElement('canvas'); c.width = 400; c.height = 250; el.prepend(c); c._t = window.NovaThumbs.start(c, g.thumb, g.hue); }
    });
  }
  function stopThumbs(root) { $$('canvas', root).forEach((c) => { if (c._t) { c._t.stop(); c._t = null; } }); }

  /* ------------------------------------------------------ WINDOW MANAGER */
  const layer = $('#win-layer'), snapHint = $('#snap-hint');
  const wins = new Map(); let zTop = 10, active = null, snapZone = null;

  function openWindow(key, o) {
    if (wins.has(key)) { const w = wins.get(key); restore(w); focus(w); return w; }
    const el = A.ui.el('<section class="win" role="dialog" aria-label="' + esc(o.title) + '"><header class="win-bar">' + o.iconHtml +
      '<div class="win-title">' + esc(o.title) + '</div><span class="win-extra" style="display:flex;gap:2px"></span>' +
      '<button class="wb min" aria-label="Minimize">' + icon('minus') + '</button><button class="wb max" aria-label="Maximize">' + icon('square') + '</button><button class="wb close" aria-label="Close">' + icon('x') + '</button>' +
      '</header><div class="win-body"></div><div class="win-shield"></div><div class="win-rz r"></div><div class="win-rz l"></div><div class="win-rz b"></div><div class="win-rz br"></div></section>');
    const L = layer.getBoundingClientRect(), n = wins.size % 6;
    const w = Math.min(o.w || 760, L.width - 24), h = Math.min(o.h || 540, L.height - 24);
    Object.assign(el.style, { left: Math.max(8, (L.width - w) / 2 + n * 28 - 70) + 'px', top: Math.max(8, (L.height - h) / 2 + n * 26 - 60) + 'px', width: w + 'px', height: h + 'px' });
    layer.appendChild(el);
    const win = { key, el, body: $('.win-body', el), opts: o, min: false, max: false, cleanup: null, opened: Date.now() };
    wins.set(key, win);
    (o.extra || []).forEach((b) => { const btn = A.ui.el('<button class="wb" aria-label="' + esc(b.label) + '" title="' + esc(b.label) + '">' + icon(b.icon) + '</button>'); btn.addEventListener('click', (e) => { e.stopPropagation(); b.onClick(btn, win); }); if (b.init) b.init(btn, win); $('.win-extra', el).appendChild(btn); });
    $('.wb.min', el).addEventListener('click', () => minimize(win));
    $('.wb.max', el).addEventListener('click', () => setMax(win, !win.max));
    $('.wb.close', el).addEventListener('click', () => closeWindow(win));
    $('.win-bar', el).addEventListener('dblclick', (e) => { if (!e.target.closest('.wb')) setMax(win, !win.max); });
    el.addEventListener('pointerdown', () => focus(win), true);
    bindDrag(win); bindResize(win);
    if (o.max || (o.game && A.settings.get('gamesMaximized') !== false) || isMobile()) setMax(win, true, true);
    try { win.cleanup = o.render(win.body, win); } catch (e) { console.error(e); win.body.innerHTML = '<div class="app"><p class="empty">This app hit an error.</p></div>'; }
    focus(win); A.audio.sfx('whoosh'); paintDock(); onWindowsChanged();
    return win;
  }
  function closeWindow(win) {
    if (!wins.has(win.key)) return;
    wins.delete(win.key);
    if (win.opts.game && win.opened && Date.now() - win.opened > 45000) setTimeout(() => upNext(win.opts.game), 300);
    try { win.cleanup && win.cleanup(); } catch (e) {}
    stopThumbs(win.el);
    win.el.classList.add('is-closing');
    setTimeout(() => win.el.remove(), 180);
    if (active === win.key) { active = null; const top = topWindow(); if (top) focus(top); }
    A.audio.sfx('click'); paintDock(); onWindowsChanged();
  }
  function focus(win) {
    if (active === win.key && win.el.classList.contains('is-focus')) return;
    wins.forEach((w) => w.el.classList.remove('is-focus'));
    win.el.style.zIndex = ++zTop; win.el.classList.add('is-focus'); active = win.key; paintDock();
  }
  function topWindow() { let best = null; wins.forEach((w) => { if (!w.min && (!best || +w.el.style.zIndex > +best.el.style.zIndex)) best = w; }); return best; }
  function minimize(win) { win.min = true; win.el.classList.add('is-min'); win.el.classList.remove('is-focus'); if (active === win.key) { active = null; const t = topWindow(); if (t) focus(t); } paintDock(); onWindowsChanged(); }
  function restore(win) { if (win.min) { win.min = false; win.el.classList.remove('is-min'); onWindowsChanged(); } }
  function setMax(win, on, instant) {
    win.max = on; setTimeout(() => { if (wins.has(win.key)) onWindowsChanged(); }, 0);
    if (!instant) { win.el.classList.add('anim'); setTimeout(() => win.el.classList.remove('anim'), 300); }
    win.el.classList.toggle('is-max', on);
    $('.wb.max', win.el).innerHTML = icon(on ? 'restore' : 'square');
  }
  function bindDrag(win) {
    const bar = $('.win-bar', win.el), el = win.el;
    bar.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('.wb') || isMobile()) return;
      const r = el.getBoundingClientRect(), Lr = layer.getBoundingClientRect();
      let ox = e.clientX - r.left, oy = e.clientY - r.top, moved = false;
      bar.setPointerCapture(e.pointerId);
      const mv = (ev) => {
        if (!moved && Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < 5) return;
        if (!moved) {
          moved = true; document.body.classList.add('os-dragging');
          if (win.max) { const pw = parseFloat(el.style.width); setMax(win, false, true); ox = Math.min(ox, pw - 80) * (pw / Math.max(pw, r.width)); }
        }
        const x = clamp(ev.clientX - Lr.left - ox, -el.offsetWidth + 100, Lr.width - 100), y = clamp(ev.clientY - Lr.top - oy, 0, Lr.height - 44);
        el.style.left = x + 'px'; el.style.top = y + 'px';
        const px = ev.clientX - Lr.left, py = ev.clientY - Lr.top;
        snapZone = py < 8 ? 'max' : px < 10 ? 'left' : px > Lr.width - 10 ? 'right' : null;
        snapHint.classList.toggle('is-on', !!snapZone);
        snapHint.style.cssText = snapZone === 'left' ? 'right:50%' : snapZone === 'right' ? 'left:50%' : '';
      };
      const up = () => {
        bar.removeEventListener('pointermove', mv); bar.removeEventListener('pointerup', up); bar.removeEventListener('pointercancel', up);
        document.body.classList.remove('os-dragging');
        if (snapZone) {
          snapHint.classList.remove('is-on');
          if (snapZone === 'max') setMax(win, true);
          else { if ([...wins.values()].filter((x) => x.opts.game && !x.min).length >= 2) A.meta.flag('split'); const half = Lr.width / 2; el.classList.add('anim'); Object.assign(el.style, { left: (snapZone === 'left' ? 0 : half) + 'px', top: '0px', width: half + 'px', height: Lr.height + 'px' }); setTimeout(() => el.classList.remove('anim'), 300); }
          snapZone = null;
        }
      };
      bar.addEventListener('pointermove', mv); bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up);
    });
  }
  function bindResize(win) {
    const el = win.el;
    $$('.win-rz', el).forEach((h) => h.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      const dir = h.classList[1], s = { l: el.offsetLeft, w: el.offsetWidth, h: el.offsetHeight, x: e.clientX, y: e.clientY };
      h.setPointerCapture(e.pointerId); document.body.classList.add('os-dragging');
      const mv = (ev) => {
        const dx = ev.clientX - s.x, dy = ev.clientY - s.y;
        if (dir === 'r' || dir === 'br') el.style.width = Math.max(320, s.w + dx) + 'px';
        if (dir === 'b' || dir === 'br') el.style.height = Math.max(220, s.h + dy) + 'px';
        if (dir === 'l') { const nw = Math.max(320, s.w - dx); el.style.width = nw + 'px'; el.style.left = (s.l + s.w - nw) + 'px'; }
      };
      const up = () => { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); document.body.classList.remove('os-dragging'); };
      h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up);
    }));
  }
  /* clicking into a game iframe doesn't bubble — detect focus moving into it */
  window.addEventListener('blur', () => setTimeout(() => {
    const a = document.activeElement;
    if (a && a.tagName === 'IFRAME') { const w = [...wins.values()].find((x) => x.el.contains(a)); if (w) focus(w); closeStart(); closeCtx(); }
  }, 0));

  function openApp(id) {
    const a = APPS[id]; if (!a || (a.owner && !A.auth.isOwner())) return;
    closeStart();
    return openWindow('app:' + id, { title: a.title, iconHtml: appIco(id), w: a.w, h: a.h, render: a.render, app: id });
  }
  function openGame(id) {
    const g = byId(id); if (!g) return;
    closeStart(); closePalette();
    const url = g.path + (g.path.indexOf('?') >= 0 ? '&' : '?') + 'embed=1';
    return openWindow('game:' + id, {
      title: g.title, iconHtml: gameIco(g), game: g, w: Math.min(1140, innerWidth * 0.82), h: Math.min(780, innerHeight * 0.8),
      extra: [
        { icon: 'heart', label: 'Favorite', init: (b) => b.classList.toggle('on', A.meta.isFav(id)), onClick: (b) => { const on = A.meta.toggleFav(id); b.classList.toggle('on', on); A.ui.toast(on ? 'Added to favorites' : 'Removed from favorites', 'heart'); refreshLibraries(); } },
        { icon: 'thumbsUp', label: 'Like', init: (b) => { A.scores.myLikes().then((s) => b.classList.toggle('on-like', s.has(id))); }, onClick: (b) => {
          A.scores.toggleLike(id).then((on) => { b.classList.toggle('on-like', on); A.audio.sfx(on ? 'coin' : 'click'); A.ui.toast(on ? 'Liked ' + g.title : 'Like removed', 'thumbsUp'); refreshLibraries(); },
            (e) => { if (e.message === 'signin') { A.ui.toast('Sign in to like games', 'user'); A.ui.openAuth('signup'); } else A.ui.toast(e.message, 'info'); });
        } },
        { icon: 'refresh', label: 'Restart', onClick: (b, w) => { if (w.frame) { w.frame.src = 'about:blank'; setTimeout(() => (w.frame.src = url), 60); } } },
        { icon: 'info', label: 'About this game', onClick: () => gameInfo(g) },
        { icon: 'maximize', label: 'Fullscreen', onClick: (b, w) => { const f = w.frame; if (f && f.requestFullscreen) f.requestFullscreen().catch(() => {}); } }
      ],
      render(body, win) {
        body.classList.add('is-frame');
        body.innerHTML = '<div class="win-loading"><div style="display:grid;justify-items:center;gap:14px">' + gameIco(g, 'wg-ico') + '<div class="spin"></div></div></div><iframe title="' + esc(g.title) + '" allow="fullscreen; autoplay; gamepad; clipboard-write"></iframe>';
        const f = $('iframe', body); win.frame = f;
        f.addEventListener('load', () => {
          $('.win-loading', body).classList.add('is-done'); try { f.contentWindow.focus(); } catch (e) {}
          if (g.controls && !body.querySelector('.ctl-hint') && f.src.indexOf('about:') !== 0) {
            const h = A.ui.el('<div class="ctl-hint">' + icon('keyboard') + '<span>' + esc(g.controls) + '</span></div>'); body.appendChild(h);
            setTimeout(() => h.classList.add('is-gone'), 5500); setTimeout(() => h.remove(), 6200);
          }
        });
        f.src = url;
        return () => { try { f.src = 'about:blank'; } catch (e) {} };
      }
    });
  }
  function similar(g, n) {
    const m = A.meta.get(), tm = A.scores.trendingCached();
    return LIVE.filter((x) => x.id !== g.id).map((x) => ({ x, s: x.tags.filter((t) => g.tags.includes(t)).length * 3 + (x.popular ? 1 : 0) + (!m.tried[x.id] ? 1 : 0) + Math.min(2, ((tm[x.id] && tm[x.id].likes) || 0) / 10) + Math.random() }))
      .sort((a, b) => b.s - a.s).slice(0, n).map((o) => o.x);
  }
  let upEl = null;
  function upNext(g) {
    if (upEl) upEl.remove();
    const x = similar(g, 1)[0]; if (!x) return;
    upEl = A.ui.el('<div class="upnext os-glass" role="status"><span class="os-label">Up next</span><div style="display:flex;gap:12px;align-items:center;margin-top:10px">' + gameIco(x, 'wg-ico') + '<div style="flex:1;min-width:0"><b style="display:block;font-family:var(--font-os);font-weight:500;font-size:18px">' + esc(x.title) + '</b><small style="color:var(--dim)">Because you played ' + esc(g.title) + '</small></div></div><div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-primary btn-sm up-play">' + icon('play') + 'Play</button><button class="btn btn-ghost btn-sm up-x">Not now</button></div></div>');
    document.body.appendChild(upEl);
    const el = upEl, done = () => { el.classList.add('is-gone'); setTimeout(() => el.remove(), 300); if (upEl === el) upEl = null; };
    $('.up-play', el).addEventListener('click', () => { done(); openGame(x.id); });
    $('.up-x', el).addEventListener('click', done);
    setTimeout(done, 10000);
  }
  function gameInfo(g) {
    const r = A.scores.get(g.id), m = A.meta.get();
    A.ui.modal('<h2>' + esc(g.title) + '</h2><p class="modal-sub">' + esc(g.tagline) + '</p><div style="display:grid;gap:10px">' +
      '<div class="setting-row"><span class="label">Controls</span><span>' + esc(g.controls || '—') + '</span></div>' +
      '<div class="setting-row"><span class="label">Community</span><span>' + (function () { const t = A.scores.trendingCached()[g.id]; return t ? t.players + ' players, ' + (t.likes || 0) + ' likes' : 'Be the first to play'; })() + '</span></div>' +
      '<div class="setting-row"><span class="label">You’ve played</span><span>' + r.plays + ' times, ' + A.ui.fmtTime(r.time) + '</span></div>' +
      (g.original ? '<div class="setting-row"><span class="label">Best score</span><span>' + r.best.toLocaleString() + '</span></div><div class="setting-row"><span class="label">Made by</span><span>Nova Arcade</span></div>'
        : '<div class="setting-row"><span class="label">Made by</span><span>' + esc(g.author) + '</span></div><div class="setting-row"><span class="label">License</span><span class="badge">' + esc(g.license) + '</span></div>' +
          '<div class="setting-row"><span class="label">Source</span><a href="https://github.com/' + esc(g.repo) + '" target="_blank" rel="noopener">github.com/' + esc(g.repo) + '</a></div>') +
      '<div class="setting-row"><span class="label">First played</span><span>' + (m.tried[g.id] ? new Date(m.tried[g.id]).toLocaleDateString() : 'Never') + '</span></div></div>' +
      '<div class="os-label" style="margin:20px 0 10px">More like this</div><div class="mini-grid gi-more">' + similar(g, 4).map((x) => '<button class="mini" data-play="' + x.id + '" data-cover="' + x.id + '"><span>' + esc(x.title) + '</span></button>').join('') + '</div>', { label: 'About ' + g.title, wide: true });
    const box = $('.modal'); if (box) { fillCovers(box); box.addEventListener('click', (e) => { const p = e.target.closest('[data-play]'); if (p) { const b = box.closest('.modal-backdrop'); if (b) b.querySelector('.modal-close').click(); openGame(p.dataset.play); } }); }
  }

  /* pause the OS soundtrack while a game window is visible */
  function onWindowsChanged() {
    const anyGame = [...wins.values()].some((w) => w.opts.game && !w.min);
    const covered = [...wins.values()].some((w) => w.opts.game && !w.min && w.max);
    covered ? A.bg.pause() : A.bg.resume();
    const mu = A.audio.music;
    if (anyGame && A.settings.get('pauseMusicInGames')) { if (mu.playing) { mu.stop(); mu.held = true; } }
    else if (mu.held) { mu.held = false; if (A.settings.get('music')) mu.start(); }
    if (!wins.size) renderHome();
  }

  if (!A.store.get('theme.desktop', false)) { A.store.set('theme.desktop', true); A.store.set('os.widgets', null); }
  if (!A.store.get('theme.smoke', false)) { A.store.set('theme.smoke', true); if (A.bg && A.bg.presets && A.bg.presets.smoke) A.settings.set('bg', 'smoke'); }

  /* --------------------------------------------------------------- DOCK */
  const dock = $('#dock'), tip = $('#dk-tip');
  function paintDock() {
    const running = [...wins.values()].filter((w) => w.opts.game);
    const btn = (key, inner, label, cls) => '<button class="dk ' + (cls || '') + '" data-dk="' + key + '" aria-label="' + esc(label) + '" data-tip="' + esc(label) + '">' + inner + '</button>';
    dock.innerHTML =
      '<div class="tb-mid">' + btn('start', '<span class="app-ico" style="background:#6c4cf0"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z"/></svg></span>', 'Start', 'dk-start') +
      '<button class="tb-search" data-dk="search" aria-label="Search">' + icon('search') + '<span>Search</span></button>' +
      PINNED.map((id) => { const w = wins.get('app:' + id); return btn('app:' + id, appIco(id), APPS[id].title, (w ? 'is-open' : '') + (active === 'app:' + id ? ' is-active' : '')); }).join('') +
      running.map((w) => btn(w.key, gameIco(w.opts.game), w.opts.game.title, 'is-open' + (active === w.key ? ' is-active' : ''))).join('') +
      '</div><div class="tb-right">' +
      (A.settings.get('showFps') ? '<div class="fps hide-sm" aria-label="Frames per second"><span id="fps">60</span>&nbsp;<small>fps</small></div>' : '') +
      '<button class="dk tb-tray hide-sm" data-dk="fullscreen" aria-label="Full screen" data-tip="Full screen">' + icon('fullscreen') + '</button>' +
      '<button class="dk tb-tray dk-bell" data-dk="notifs" aria-label="Notifications" data-tip="Notifications">' + icon('bell') + (unread() ? '<span class="dk-badge">' + Math.min(99, unread()) + '</span>' : '') + '</button>' +
      '<div class="dk-clock" id="dk-clock" role="button" tabindex="0" data-dk="notifs"></div></div>';
    tickClock();
  }
  dock.addEventListener('click', (e) => {
    const b = e.target.closest('[data-dk]'); if (!b) return;
    const k = b.dataset.dk;
    if (k === 'start') return toggleStart();
    if (k === 'notifs') return toggleNotifs();
    if (k === 'search') return openPalette();
    if (k === 'fullscreen') { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else document.documentElement.requestFullscreen().catch(() => {}); return; }
    if (k === 'library') { const w = wins.get('app:games'); return w ? (restore(w), focus(w)) : openApp('games'); }
    const w = wins.get(k);
    if (w) { if (!w.min && active === k) minimize(w); else { restore(w); focus(w); } return; }
    if (k.startsWith('app:')) openApp(k.slice(4));
  });
  dock.addEventListener('pointerover', (e) => {
    const b = e.target.closest('[data-tip]'); if (!b || e.pointerType !== 'mouse') return;
    const r = b.getBoundingClientRect(); tip.textContent = b.dataset.tip; tip.style.left = (r.left + r.width / 2) + 'px'; tip.style.top = (r.top - 10) + 'px'; tip.classList.add('is-on');
  });
  dock.addEventListener('pointerout', () => tip.classList.remove('is-on'));

  /* clock + day name + FPS */
  function tickClock() {
    const d = new Date(), h24 = A.settings.get('clock24');
    const time = d.toLocaleTimeString([], { hour: h24 ? '2-digit' : 'numeric', minute: '2-digit', hour12: !h24 });
    const c = $('#dk-clock'); if (c) c.innerHTML = '<b>' + time + '</b><span>' + d.toLocaleDateString() + '</span>';
    const day = $('#os-day'), wd = d.toLocaleDateString('en-US', { weekday: 'long' });
    if (day && day.textContent !== wd) day.textContent = wd;
    const dt = $('#os-date'); if (dt) dt.innerHTML = '<b>' + time + '</b><span>' + d.toLocaleDateString([], { month: 'long', day: 'numeric' }) + '</span>';
  }
  function greeting() { const h = new Date().getHours(), u = A.auth.current(); return (h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening') + (u ? ', ' + esc(u.username) : '') + '.'; }
  setInterval(tickClock, 1000 * 15);
  (function fpsLoop() { let n = 0, t0 = performance.now(); (function f(now) { n++; if (now - t0 >= 500) { const el = $('#fps'); if (el) el.textContent = Math.round(n * 1000 / (now - t0)); n = 0; t0 = now; } requestAnimationFrame(f); })(t0); })();

  /* ------------------------------------------------- NOTIFICATION CENTER */
  const unread = () => A.store.get('notifsUnread', 0) || 0;
  let notifPanel = null;
  function toggleNotifs() { notifPanel ? closeNotifs() : openNotifs(); }
  function closeNotifs() { if (notifPanel) { const p = notifPanel; notifPanel = null; p.classList.remove('is-open'); setTimeout(() => p.remove(), 200); } }
  function openNotifs() {
    closeStart();
    A.store.set('notifsUnread', 0); paintDock();
    const list = A.store.get('notifs', []), m = A.meta.get(), dl = A.meta.daily();
    notifPanel = A.ui.el('<aside class="notifs os-glass" role="dialog" aria-label="Notifications"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-family:var(--font-os);font-size:20px;font-weight:500">Notifications</b>' + (list.length ? '<button class="btn btn-sm btn-ghost nf-clear">' + icon('trash') + 'Clear</button>' : '') + '</div>' +
      '<div class="nf-today"><span class="os-label">Today</span><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><span class="pill ' + (m.streak.count > 1 ? 'hot' : '') + '">' + icon('flame') + m.streak.count + '-day streak</span><span class="pill ' + (dl.done ? 'ok' : '') + '">' + icon(dl.done ? 'check' : 'star') + 'Daily ' + (dl.done ? 'done' : Math.round(dl.progress / dl.goal * 100) + '%') + '</span><span class="pill">' + icon('trophy') + Object.keys(m.ach).length + (Object.keys(m.ach).length === 1 ? ' achievement' : ' achievements') + '</span></div></div>' +
      '<div class="nf-list">' + (list.length ? list.map((n) => '<div class="nf' + (n.ach ? ' ach-n' : '') + '">' + icon(n.icon) + '<span><span style="display:block">' + esc(n.msg) + '</span><small>' + ago(n.at) + '</small></span></div>').join('') : '<p class="empty">You’re all caught up.</p>') + '</div></aside>');
    document.body.appendChild(notifPanel);
    requestAnimationFrame(() => notifPanel && notifPanel.classList.add('is-open'));
    const c = $('.nf-clear', notifPanel); if (c) c.addEventListener('click', () => { A.store.set('notifs', []); closeNotifs(); setTimeout(openNotifs, 220); });
  }
  A.on('notif', () => { if (!notifPanel) paintDock(); });
  document.addEventListener('pointerdown', (e) => { if (notifPanel && !notifPanel.contains(e.target) && !e.target.closest('[data-dk="notifs"]')) closeNotifs(); });

  /* -------------------------------------------------------- LOCK SCREEN */
  let lockEl = null, welcome = () => {};
  function showLock() {
    if (lockEl) return;
    const u = A.auth.current(), m = A.meta.get(), lv = A.meta.levelInfo(m.xp);
    lockEl = A.ui.el('<div class="lock" role="dialog" aria-label="Lock screen"><div class="lock-top"><div class="lock-time" id="lock-time"></div><div class="lock-date" id="lock-date"></div></div>' +
      '<div class="lock-bottom"><span class="avatar" style="width:64px;height:64px;font-size:26px;border-radius:20px;background:' + (u ? hueBg(u.hue) : 'var(--tile)') + '">' + (u ? esc(u.username[0].toUpperCase()) : icon('user').replace('<svg', '<svg width="28" height="28"')) + '</span>' +
      '<b style="font-family:var(--font-os);font-weight:500;font-size:22px">' + (u ? esc(u.username) : 'Guest') + '</b><span style="color:var(--dim);font-size:14px">Level ' + lv.level + ', ' + lv.title + (m.streak.count > 1 ? ', ' + m.streak.count + '-day streak' : '') + '</span>' +
      '<button class="btn btn-primary btn-lg lock-go" style="margin-top:6px">' + icon('sparkles') + 'Enter Nova</button><span class="lock-hint">Click, tap or press any key</span></div></div>');
    document.body.appendChild(lockEl);
    const paint = () => { const d = new Date(), h24 = A.settings.get('clock24'); const t = $('#lock-time'), dt = $('#lock-date'); if (!t) return; t.textContent = d.toLocaleTimeString([], { hour: h24 ? '2-digit' : 'numeric', minute: '2-digit', hour12: !h24 }).replace(/\s?[AP]M/i, ''); dt.textContent = d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }); };
    paint(); lockEl._t = setInterval(paint, 5000);
    const go = (e) => { if (e && e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Shift')) return; unlockScreen(); };
    lockEl.addEventListener('click', go);
    setTimeout(() => { document.addEventListener('keydown', go, { once: true }); }, 300);
    let sy = 0; lockEl.addEventListener('touchstart', (e) => { sy = e.touches[0].clientY; }, { passive: true });
    lockEl.addEventListener('touchmove', (e) => { const dy = Math.min(0, e.touches[0].clientY - sy); lockEl.style.transform = 'translateY(' + dy + 'px)'; }, { passive: true });
    setTimeout(() => { const b = $('.lock-go', lockEl); b && b.focus({ preventScroll: true }); }, 100);
  }
  function unlockScreen() {
    if (!lockEl) return; const l = lockEl; lockEl = null;
    clearInterval(l._t); l.style.transform = ''; l.classList.add('is-gone'); A.audio.unlock(); A.audio.sfx('whoosh');
    setTimeout(() => l.remove(), 600);
    welcome(); welcome = () => {};
  }

  /* --------------------------------------------------------- START MENU */
  const start = $('#start');
  function toggleStart() { start.classList.contains('is-open') ? closeStart() : openStart(); }
  function closeStart() { start.classList.remove('is-open'); }
  function openStart() {
    closeCtx();
    const u = A.auth.current(), m = A.meta.get(), lv = A.meta.levelInfo(m.xp);
    const recent = m.recent.map((r) => byId(r.id)).filter(Boolean).slice(0, 4);
    start.innerHTML =
      '<div class="start-user">' + (u ? '<span class="avatar" style="background:' + hueBg(u.hue) + '">' + esc(u.username[0].toUpperCase()) + '</span>' : '<span class="avatar" style="background:var(--tile)">' + icon('user').replace('<svg', '<svg width="22" height="22"') + '</span>') +
      '<div style="flex:1;min-width:0"><b>' + (u ? esc(u.username) : 'Guest') + '</b><div style="font-size:13px;color:var(--dim)">Level ' + lv.level + ', ' + lv.title + ', ' + m.xp.toLocaleString() + ' XP</div><div class="bar" style="margin-top:6px;height:5px"><i style="width:' + (lv.pct * 100) + '%"></i></div></div>' +
      (u ? '<button class="btn btn-sm" data-st="profile">' + icon('user') + 'Profile</button>' : '<button class="btn btn-primary btn-sm" data-st="signup">' + icon('user') + 'Sign up</button>') + '</div>' +
      '<label class="search-box"><span class="sr-only">Search</span>' + icon('search') + '<input class="input" id="start-q" placeholder="Search games and apps" autocomplete="off"></label>' +
      '<div id="start-res" class="start-list" hidden></div>' +
      '<div id="start-main" style="display:grid;gap:16px"><div><div class="os-label" style="margin-bottom:8px">Apps</div><div class="start-apps">' +
      visibleApps().map((id) => '<button class="sa" data-app="' + id + '">' + appIco(id) + '<span>' + esc(APPS[id].title.replace(' & Credits', '').replace('Request a Game', 'Request')) + '</span></button>').join('') + '</div></div>' +
      '<div><div class="os-label" style="margin-bottom:8px">' + (recent.length ? 'Recent' : 'Popular') + '</div><div class="start-list">' +
      (recent.length ? recent : LIVE.filter((g) => g.popular).slice(0, 4)).map((g) => '<button class="sl" data-game="' + g.id + '">' + gameIco(g) + '<span><b>' + esc(g.title) + '</b><small>' + esc(g.tags.join(', ')) + '</small></span></button>').join('') + '</div></div></div>' +
      '<div style="display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap"><button class="btn btn-sm btn-ghost" data-st="random">' + icon('shuffle') + 'Random game</button>' + (window.NovaCanInstall && window.NovaCanInstall() ? '<button class="btn btn-sm btn-ghost" data-st="install">' + icon('upload') + 'Install app</button>' : '') + (wins.size ? '<button class="btn btn-sm btn-ghost" data-st="closeall">' + icon('home') + 'Show desktop</button>' : '') +
      '<span style="display:flex;gap:6px"><button class="btn btn-sm btn-ghost" data-st="lock">' + icon('lock') + 'Lock</button>' + (u ? '<button class="btn btn-sm btn-ghost" data-st="logout">' + icon('power') + 'Log out</button>' : '<button class="btn btn-sm btn-ghost" data-st="login">' + icon('power') + 'Log in</button>') + '</span></div>';
    start.classList.add('is-open');
    const q = $('#start-q', start);
    if (!isMobile()) setTimeout(() => q.focus(), 60);
    q.addEventListener('input', () => {
      const res = $('#start-res', start), main = $('#start-main', start), v = q.value.trim();
      res.hidden = !v; main.hidden = !!v; if (!v) return;
      res.innerHTML = searchItems(v).slice(0, 8).map(itemHtml).join('') || '<p class="empty" style="padding:16px">Nothing found.</p>';
    });
    q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const f = $('#start-res [data-game], #start-res [data-app]', start); if (f) f.click(); } });
  }
  start.addEventListener('click', (e) => {
    const g = e.target.closest('[data-game]'), a = e.target.closest('[data-app]'), st = e.target.closest('[data-st]');
    if (g) openGame(g.dataset.game);
    else if (a) openApp(a.dataset.app);
    else if (st) {
      const k = st.dataset.st; closeStart();
      if (k === 'profile') openApp('profile');
      if (k === 'signup') A.ui.openAuth('signup');
      if (k === 'login') A.ui.openAuth('login');
      if (k === 'logout') { A.auth.logOut(); A.ui.toast('Logged out. See you soon!', 'logout'); }
      if (k === 'random') randomGame();
      if (k === 'closeall') runAction('closeall');
      if (k === 'lock') showLock();
      if (k === 'install') window.NovaInstall();
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (start.classList.contains('is-open') && !start.contains(e.target) && !e.target.closest('[data-dk="start"]')) closeStart();
    if (!e.target.closest('.ctx')) closeCtx();
  });
  function randomGame() { const m = A.meta.get(); const fresh = LIVE.filter((g) => !m.tried[g.id]); const pool = fresh.length && Math.random() < 0.6 ? fresh : LIVE; openGame(pool[Math.floor(Math.random() * pool.length)].id); }

  /* ---------------------------------------------------- SEARCH PALETTE */
  const ALIASES = { dino: 'trex', 'chrome dino': 'trex', dinosaur: 'trex', flappy: 'clumsy-bird', 'flappy bird': 'clumsy-bird', '8 ball': 'pool', 'eight ball': 'pool', billiards: 'pool', pool: 'pool',
    zombie: 'dead-valley', zombies: 'dead-valley', racing: 'hexgl', 'f-zero': 'hexgl', wipeout: 'hexgl', maze: 'astray', rubik: 'twisty', 'rubiks': 'twisty', 'candy crush': 'littlejs-puzzle', 'match 3': 'littlejs-puzzle', bejeweled: 'littlejs-puzzle',
    'cookie clicker': 'antimatter', idle: 'antimatter', clicker: 'particle-clicker', stack: 'tower', 'tower stack': 'tower', 'agar': 'pond', 'fish': 'pond', 'mario': 'platformer', 'brick breaker': 'breakout', 'space invaders': 'delta', 'galaga': 'delta', 'rhythm': 'taptaptap', 'coding': 'untrusted', 'hacking': 'untrusted', 'cards': 'solitaire', 'klondike': 'solitaire', 'mines': 'minesweeper', 'sudoku': 'sudoku', 'checkers': 'chess' };
  function searchItems(v) {
    v = v.toLowerCase();
    const alias = Object.keys(ALIASES).filter((k) => k.includes(v) && v.length >= 3).map((k) => ALIASES[k]);
    const apps = visibleApps().filter((id) => APPS[id].title.toLowerCase().includes(v)).map((id) => ({ type: 'app', id }));
    const gs = LIVE.map((g) => {
      const t = g.title.toLowerCase(); let sc = t.startsWith(v) ? 3 : t.includes(v) ? 2 : (g.tags.join(' ') + ' ' + g.tagline).toLowerCase().includes(v) ? 1 : 0;
      if (!sc && alias.includes(g.id)) sc = 1.5;
      return { type: 'game', id: g.id, sc: sc ? sc + (g.popular ? 0.1 : 0) : 0 };
    }).filter((x) => x.sc > 0).sort((a, b) => b.sc - a.sc);
    const acts = [['random', 'Play a random game', 'shuffle'], ['wallpaper', 'Change wallpaper', 'image'], ['music', 'Toggle music', 'music']].filter((a) => a[1].toLowerCase().includes(v)).map((a) => ({ type: 'act', id: a[0], title: a[1], icon: a[2] }));
    const looksUrl = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(v);
    const web = { type: 'act', id: 'web:' + v, title: (looksUrl ? 'Open ' : 'Search the web for “') + v + (looksUrl ? '' : '”'), icon: 'globe' };
    const out = looksUrl ? [web].concat(gs, apps, acts) : gs.concat(apps, acts);
    if (!looksUrl && v.length >= 2) out.splice(Math.min(out.length, 3), 0, web);
    if (!gs.length && v.length >= 2) out.push({ type: 'act', id: 'request:' + v, title: 'Request “' + v + '”', icon: 'send' });
    return out;
  }
  function itemHtml(it) {
    if (it.type === 'game') { const g = byId(it.id); return '<button class="sl" data-game="' + g.id + '">' + gameIco(g) + '<span><b>' + esc(g.title) + '</b><small>' + esc(g.tags.join(', ')) + '</small></span></button>'; }
    if (it.type === 'app') return '<button class="sl" data-app="' + it.id + '">' + appIco(it.id) + '<span><b>' + esc(APPS[it.id].title) + '</b><small>App</small></span></button>';
    return '<button class="sl" data-act="' + esc(it.id) + '"><span class="app-ico" style="width:38px;height:38px;border-radius:10px">' + icon(it.icon) + '</span><span><b>' + esc(it.title) + '</b><small>' + (it.icon === 'globe' ? 'Browser' : 'Action') + '</small></span></button>';
  }
  let palette = null;
  function openPalette() {
    if (palette) return;
    closeStart();
    palette = A.ui.el('<div class="palette-back"><div class="palette os-glass" role="dialog" aria-label="Search"><label class="search-box"><span class="sr-only">Search</span>' + icon('search') + '<input class="input" placeholder="Search games, apps and actions…" autocomplete="off"></label><div class="start-list"></div><div style="padding:10px 16px;border-top:1px solid var(--line);font-size:12px;color:var(--faint);display:flex;gap:14px"><span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div></div></div>');
    document.body.appendChild(palette);
    requestAnimationFrame(() => palette.classList.add('is-open'));
    const input = $('input', palette), list = $('.start-list', palette); let sel = 0;
    const paint = () => {
      const v = input.value.trim();
      const items = v ? searchItems(v) : A.meta.get().recent.map((r) => ({ type: 'game', id: r.id })).filter((x) => byId(x.id)).slice(0, 5).concat(LIVE.filter((g) => g.popular).slice(0, 5).map((g) => ({ type: 'game', id: g.id })));
      const uniq = []; const seen = {}; items.forEach((i) => { if (!seen[i.type + i.id]) { seen[i.type + i.id] = 1; uniq.push(i); } });
      list.innerHTML = uniq.slice(0, 9).map(itemHtml).join('') || '<p class="empty">Nothing found.</p>';
      sel = clamp(sel, 0, Math.max(0, list.children.length - 1));
      [...list.children].forEach((c, i) => c.classList.toggle('is-sel', i === sel));
    };
    input.addEventListener('input', () => { sel = 0; paint(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { sel++; paint(); e.preventDefault(); }
      if (e.key === 'ArrowUp') { sel--; paint(); e.preventDefault(); }
      if (e.key === 'Enter') { const c = list.children[sel]; if (c) c.click(); }
    });
    list.addEventListener('click', (e) => {
      const g = e.target.closest('[data-game]'), a = e.target.closest('[data-app]'), act = e.target.closest('[data-act]');
      closePalette();
      if (g) openGame(g.dataset.game); else if (a) openApp(a.dataset.app);
      else if (act) runAction(act.dataset.act);
    });
    palette.addEventListener('pointerdown', (e) => { if (e.target === palette) closePalette(); });
    input.focus(); paint();
  }
  function closePalette() { if (!palette) return; const p = palette; palette = null; try { document.activeElement.blur(); } catch (e) {} p.classList.remove('is-open'); setTimeout(() => p.remove(), 160); }
  function runAction(id) {
    if (id.startsWith('web:')) { openBrowser(id.slice(4)); return; }
    if (id.startsWith('request:')) { const w = openApp('request'); setTimeout(() => { const t = w && $('#rq-t', w.body); if (t) { t.value = id.slice(8).replace(/\b\w/g, (c) => c.toUpperCase()); t.focus(); } }, 80); return; }
    if (id === 'closeall') { [...wins.values()].forEach(closeWindow); return; }
    if (id === 'random') randomGame();
    if (id === 'wallpaper') openApp('settings');
    if (id === 'music') { A.settings.set('music', !A.settings.get('music')); A.ui.toast(A.settings.get('music') ? 'Music on' : 'Music off', 'music'); renderHome(); }
    if (id === 'shuffle-wall') { const ids = Object.keys(A.bg.presets); const cur = ids.indexOf(A.settings.get('bg')); A.settings.set('bg', ids[(cur + 1) % ids.length]); A.meta.flag('customized'); A.ui.toast('Wallpaper: ' + A.bg.presets[A.settings.get('bg')].name, 'image'); }
  }
  document.addEventListener('keydown', (e) => {
    const typing = e.target.matches && e.target.matches('input, textarea, select, [contenteditable]');
    if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) { e.preventDefault(); palette ? closePalette() : openPalette(); }
    if (e.key === '?' && !typing && !palette) { e.preventDefault(); showShortcuts(); }
    if (e.key === 'Escape') { if (palette) closePalette(); else if (start.classList.contains('is-open')) closeStart(); closeCtx(); closeNotifs(); }
  });

  /* ------------------------------------------------------ CONTEXT MENU */
  let ctx = null;
  function closeCtx() { if (ctx) { ctx.remove(); ctx = null; } }
  $('#os-home').addEventListener('contextmenu', (e) => {
    if (e.target.closest('.wg, input, textarea')) return;
    e.preventDefault(); closeCtx();
    ctx = A.ui.el('<div class="ctx" role="menu">' + [['games', 'gamepad', 'Open Games'], ['random', 'shuffle', 'Random game'], ['widgets', 'grid', 'Edit widgets'], ['wallpaper', 'image', 'Change wallpaper'], ['search', 'search', 'Search (/)'], ['keys', 'keyboard', 'Keyboard shortcuts (?)']].concat(wins.size ? [['closeall', 'x', 'Close all windows']] : []).map(([k, i, t]) => '<button data-cx="' + k + '" role="menuitem">' + icon(i) + t + '</button>').join('') + '</div>');
    document.body.appendChild(ctx);
    ctx.style.left = Math.min(e.clientX, innerWidth - 220) + 'px'; ctx.style.top = Math.min(e.clientY, innerHeight - 240) + 'px';
    ctx.addEventListener('click', (ev) => { const b = ev.target.closest('[data-cx]'); if (!b) return; const k = b.dataset.cx; closeCtx(); if (k === 'games') openApp('games'); else if (k === 'widgets') { editing = true; A.audio.sfx('toggle'); paintHome(); } else if (k === 'search') openPalette(); else if (k === 'keys') showShortcuts(); else runAction(k); });
  });

  /* --------------------------------------------------------------- HOME */
  let quickId = null, homeTimer = 0, vizRaf = 0;
  function renderHome() { clearTimeout(homeTimer); homeTimer = setTimeout(paintHome, 60); }
  function paintHome() {
    const root = $('#widgets'); stopThumbs(root);
    const m = A.meta.get(), lv = A.meta.levelInfo(m.xp), u = A.auth.current();
    const last = m.recent.map((r) => ({ g: byId(r.id), at: r.at })).find((x) => x.g);
    if (!quickId || !byId(quickId)) quickId = pickQuick(m);
    const q = byId(quickId), dl = A.meta.daily(), ft = dl.featured;
    const track = A.audio.music.now();
    const playing = A.audio.music.playing;
    const achDone = Object.keys(m.ach).length, achTotal = A.meta.achievements.length;
    const favs = m.favs.map(byId).filter(Boolean);
    const trm = A.scores.trendingCached(), trendList = LIVE.filter((g) => trm[g.id] && trm[g.id].recent > 0).sort((a, b) => trm[b.id].recent - trm[a.id].recent);
    const msLeft = new Date().setHours(24, 0, 0, 0) - Date.now(), hLeft = Math.floor(msLeft / 36e5), mLeft = Math.floor(msLeft % 36e5 / 6e4);
    const pct = Math.round(dl.progress / dl.goal * 100), wc = A.meta.weeklyCh();
    root.innerHTML =
      (function () { const g = last ? last.g : ft;
        return '<section data-wg="jump" class="wg wg-cont os-glass"><div class="wg-art" data-play="' + g.id + '" data-cover="' + g.id + '" role="button" tabindex="-1" aria-label="Play ' + esc(g.title) + '"></div><div class="wg-in"><div class="wg-sub">' + (last ? 'Last played ' + ago(last.at) : 'Today’s pick') + '</div>' +
          '<div class="wg-title">' + esc(g.title) + '</div><div class="btn-row"><button class="btn-light" data-play="' + g.id + '">' + (last ? 'Resume' : 'Play') + '</button><button class="btn-soft" data-info="' + g.id + '">Details</button></div></div></section>'; })() +
      '<section data-wg="quick" class="wg span-6 os-glass"><div class="wg-head"><span class="os-label">Quick play</span><button class="btn btn-sm btn-ghost" data-act="shuffle" aria-label="Shuffle">' + icon('shuffle') + 'Shuffle</button></div>' +
      '<button class="wg-row" data-play="' + q.id + '"><span class="wg-ico" data-cover="' + q.id + '"></span><span class="wg-meta"><span class="wg-title" style="display:block">' + esc(q.title) + '</span><span class="wg-sub" style="display:block">' + esc(q.tagline) + '</span></span>' + icon('play', 'wg-chev') + '</button></section>' +
      '<section data-wg="daily" class="wg os-glass"><div class="wg-sub">Today’s challenge</div><div class="wg-title" style="margin-top:2px;font-weight:500;white-space:normal">' + esc(dl.def.text) + '</div>' +
      (dl.def.kind === 'featured' ? '<div class="wg-sub" style="margin-top:2px">Today’s game: <a href="#" data-play="' + ft.id + '">' + esc(ft.title) + '</a></div>' : '') +
      '<div class="bar" style="margin:10px 0 6px"><i style="width:' + pct + '%"></i></div><div class="wg-sub">' + progressText(dl) + (dl.done ? '. Done, +' + dl.xp + ' XP.' : '. Resets in ' + hLeft + 'h ' + mLeft + 'm.') + '</div>' +
      '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)"><div class="wg-sub">This week</div><div style="margin-top:2px;font-weight:500">' + esc(wc.def.text) + '</div><div class="bar" style="margin:8px 0 6px;height:4px"><i style="width:' + Math.round(wc.progress / wc.goal * 100) + '%"></i></div><div class="wg-sub">' + progressText(wc) + (wc.done ? '. Done.' : '. +500 XP when you finish.') + '</div></div></section>' +
      '<section data-wg="level" class="wg os-glass"><div class="wg-head"><span class="os-label">Your level</span><span class="pill ' + (m.streak.count > 1 ? 'hot' : '') + '">' + icon('flame') + m.streak.count + '-day streak</span></div>' +
      '<button class="wg-row" data-app="profile" style="padding:0"><span class="wg-ico" style="width:58px;height:58px;background:' + (u ? hueBg(u.hue) : 'var(--tile)') + ';font:700 24px var(--font-os)">' + (u ? esc(u.username[0].toUpperCase()) : icon('user')) + '</span><span class="wg-meta"><span class="wg-title" style="display:block">Level ' + lv.level + ', ' + lv.title + '</span><span class="wg-sub" style="display:block">' + lv.cur.toLocaleString() + ' / ' + lv.need.toLocaleString() + ' XP to next level</span></span></button>' +
      '<div class="bar" style="margin-top:14px"><i style="width:' + (lv.pct * 100) + '%"></i></div>' +
      '<div class="wg-actions"><button class="pill" data-app="achievements" style="cursor:pointer">' + icon('trophy') + achDone + '/' + achTotal + ' achievements</button>' + (u ? '' : '<button class="pill" data-act="signup" style="cursor:pointer">' + icon('cloud') + 'Sign up to sync</button>') + '</div></section>' +
      '<section data-wg="music" class="wg os-glass"><div class="wg-row" style="cursor:default;padding:0">' + musicArt(track, 48) + '<span class="wg-meta"><span class="wg-title" style="display:block">' + (playing ? esc(track.name) : 'Music is off') + '</span><span class="wg-sub" style="display:block">' + (playing ? esc(track.sub) : esc(track.kind === 'file' ? track.station.name : 'Nova Radio')) + '</span></span>' +
      '<button class="icon-btn" data-act="music-next" aria-label="Next song">' + icon('skip') + '</button><button class="big-play" data-act="music" style="flex:none" aria-label="' + (playing ? 'Pause' : 'Play') + '">' + icon(playing ? 'pause' : 'play') + '</button></div>' +
      '<div class="viz" id="home-viz" style="margin-top:12px;height:18px">' + '<i></i>'.repeat(32) + '</div></section>' +
      '<section data-wg="games" class="wg span-8 os-glass"><div class="wg-head"><span class="os-label">' + (favs.length ? 'Your favorites' : trendList.length >= 4 ? 'Trending now' : 'Popular right now') + '</span><button class="btn btn-sm btn-ghost" data-app="games">See all ' + LIVE.length + ' ' + icon('chevronRight') + '</button></div>' +
      '<div class="mini-grid">' + (favs.length ? favs : trendList.length >= 4 ? trendList : LIVE.filter((g) => g.popular)).slice(0, 8).map((g) => '<button class="mini" data-play="' + g.id + '" data-cover="' + g.id + '"><span>' + esc(g.title) + '</span></button>').join('') + '</div></section>' +
      '<section data-wg="system" class="wg os-glass"><div class="os-label" style="margin-bottom:14px">System status</div>' +
      '<button class="wg-row" data-app="updates"><span class="wg-meta"><span class="wg-title" style="display:block">Update Log</span><span class="wg-sub" style="display:block">v' + A.config.version + '. See what changed</span></span>' + icon('chevronRight', 'wg-chev') + '</button>' +
      '<button class="wg-row" data-app="request"><span class="wg-meta"><span class="wg-title" style="display:block;font-size:19px">Request a game</span><span class="wg-sub" style="display:block">Tell us what to add next</span></span>' + icon('chevronRight', 'wg-chev') + '</button>' +
      '<button class="wg-row" data-act="search"><span class="wg-meta"><span class="wg-title" style="display:block;font-size:19px">Search anything</span><span class="wg-sub" style="display:block">Press <span class="kbd">/</span> anywhere</span></span>' + icon('search', 'wg-chev') + '</button></section>';
    const di = $('#desk-icons');
    if (di) {
      const seen = {}, picks = favs.concat(m.recent.map((r) => byId(r.id)).filter(Boolean), LIVE.filter((g) => g.popular)).filter((g) => !seen[g.id] && (seen[g.id] = 1)).slice(0, 4);
      di.innerHTML = ['games', 'browser', 'music', 'achievements'].map((id) => '<button class="dicon" data-app="' + id + '">' + appIco(id) + '<span>' + esc(APPS[id].title) + '</span></button>').join('') +
        picks.map((g) => '<button class="dicon" data-play="' + g.id + '">' + gameIco(g) + '<span>' + esc(g.title) + '</span></button>').join('');
    }
    applyLayout(root);
    fillCovers(root);
    startViz();
  }
  const WG_NAMES = { jump: 'Continue playing', quick: 'Quick play', daily: 'Daily challenge', level: 'Your level', music: 'Now playing', games: 'Games', system: 'System status' };
  let editing = false;
  function layout() { const l = A.store.get('os.widgets', null); return l && Array.isArray(l.order) ? l : { order: ['jump', 'music', 'daily', 'level', 'quick', 'games', 'system'], hidden: ['level', 'quick', 'games', 'system'] }; }
  function applyLayout(root) {
    const L = layout(), secs = {}; $$('[data-wg]', root).forEach((el) => (secs[el.dataset.wg] = el));
    const order = L.order.filter((k) => secs[k]).concat(Object.keys(secs).filter((k) => !L.order.includes(k)));
    order.forEach((k) => { const el = secs[k]; root.appendChild(el); const hid = L.hidden.includes(k); el.hidden = hid && !editing; el.classList.toggle('wg-off', hid);
      if (editing) el.insertAdjacentHTML('beforeend', '<div class="wg-edit"><span class="pill">' + esc(WG_NAMES[k]) + '</span><span style="display:flex;gap:6px"><button class="icon-btn" data-we="up" data-k="' + k + '" aria-label="Move earlier">' + icon('arrowLeft') + '</button><button class="icon-btn" data-we="down" data-k="' + k + '" aria-label="Move later">' + icon('chevronRight') + '</button><button class="icon-btn" data-we="hide" data-k="' + k + '" aria-label="' + (hid ? 'Show' : 'Hide') + ' widget">' + icon(hid ? 'plus' : 'minus') + '</button></span></div>'); });
    let done = $('.wg-done');
    if (editing && !done) { done = A.ui.el('<button class="btn btn-primary wg-done">' + icon('check') + 'Done editing widgets</button>'); document.body.appendChild(done); done.addEventListener('click', () => { editing = false; A.audio.sfx('toggle'); paintHome(); }); }
    else if (!editing && done) done.remove();
  }
  function editWidget(k, act) {
    const L = layout(); let o = L.order.slice(); Object.keys(WG_NAMES).forEach((x) => { if (!o.includes(x)) o.push(x); });
    const i = o.indexOf(k);
    if (act === 'up' && i > 0) { o.splice(i, 1); o.splice(i - 1, 0, k); }
    if (act === 'down' && i < o.length - 1) { o.splice(i, 1); o.splice(i + 1, 0, k); }
    let h = L.hidden.slice(); if (act === 'hide') h = h.includes(k) ? h.filter((x) => x !== k) : h.concat(k);
    A.store.set('os.widgets', { order: o, hidden: h }); A.meta.flag('widgets'); A.audio.sfx('toggle'); paintHome();
  }
  function progressText(dl) {
    const k = dl.def.kind;
    if ((k === 'seconds' || k === 'featured') && dl.goal >= 3600) return (Math.floor(dl.progress / 360) / 10) + ' of ' + (dl.goal / 3600) + ' hours';
    if (k === 'seconds' || k === 'featured') return Math.floor(dl.progress / 60) + ' of ' + Math.round(dl.goal / 60) + ' minutes';
    if (k === 'xp') return dl.progress.toLocaleString() + ' of ' + dl.goal.toLocaleString() + ' XP';
    if (k === 'score') return dl.progress + ' of ' + dl.goal + ' points';
    return dl.progress + ' of ' + dl.goal;
  }
  function pickQuick(m) { const fresh = LIVE.filter((g) => !m.tried[g.id] && g.id !== quickId); const pool = fresh.length ? fresh : LIVE; return pool[Math.floor(Math.random() * pool.length)].id; }
  const deskIcons = $('#desk-icons');
  if (deskIcons) deskIcons.addEventListener('click', (e) => { const p = e.target.closest('[data-play]'), a = e.target.closest('[data-app]'); if (p) openGame(p.dataset.play); else if (a) a.dataset.app === 'browser' ? openBrowser() : openApp(a.dataset.app); });
  /* desktop search: games first, otherwise the web */
  const heroQ = $('#hero-q');
  if (heroQ) {
    $('#hero-form').addEventListener('submit', (e) => {
      e.preventDefault(); const v = heroQ.value.trim(); if (!v) return;
      const top = searchItems(v)[0]; heroQ.value = ''; heroQ.blur();
      if (top && top.type === 'game' && top.sc >= 2) openGame(top.id); else if (top && top.type === 'app') openApp(top.id); else openBrowser(v);
    });
    $('#hero-links').addEventListener('click', (e) => { const b = e.target.closest('[data-hero]'); if (!b) return; const k = b.dataset.hero; if (k === 'random') randomGame(); else if (k === 'browser') openBrowser(); else openApp(k); });
  }
  $('#os-date').addEventListener('click', (e) => { if (e.target.closest('#wg-edit-btn')) { editing = !editing; A.audio.sfx('toggle'); paintHome(); tickClock(); } });
  $('#widgets').addEventListener('click', (e) => {
    const we = e.target.closest('[data-we]'); if (we) { e.stopPropagation(); editWidget(we.dataset.k, we.dataset.we); return; }
    if (editing) return;
    const inf = e.target.closest('[data-info]'); if (inf) { const g = byId(inf.dataset.info); if (g) gameInfo(g); return; }
    const p = e.target.closest('[data-play]'), a = e.target.closest('[data-app]'), act = e.target.closest('[data-act]');
    if (p) { e.preventDefault(); openGame(p.dataset.play); return; }
    if (a) { openApp(a.dataset.app); return; }
    if (act) {
      const k = act.dataset.act;
      if (k === 'shuffle') { quickId = pickQuick(A.meta.get()); A.audio.sfx('toggle'); paintHome(); }
      if (k === 'music-next') { A.audio.unlock(); A.audio.music.next(); if (!A.audio.music.playing) { A.audio.music.held = false; A.settings.set('music', true); setTimeout(() => A.audio.music.start(), 50); } }
      if (k === 'music') { A.audio.unlock(); A.settings.set('music', !A.audio.music.playing); if (A.settings.get('music')) setTimeout(() => A.audio.music.start(), 50); setTimeout(paintHome, 120); }
      if (k === 'signup') A.ui.openAuth('signup');
      if (k === 'search') openPalette();
    }
  });
  const spec = new Uint8Array(64);
  function startViz() {
    cancelAnimationFrame(vizRaf);
    const loop = () => {
      const bars = $$('#home-viz i, .music-viz i');
      if (!bars.length) return;
      const data = A.audio.music.playing ? A.audio.spectrum(spec) : null;
      bars.forEach((b, i) => { const v = data ? data[2 + (i % 40)] / 255 : 0.05 + 0.04 * Math.sin(performance.now() / 600 + i); b.style.height = Math.max(6, v * 100) + '%'; });
      vizRaf = requestAnimationFrame(loop);
    };
    if (!A.settings.reducedMotion()) vizRaf = requestAnimationFrame(loop);
  }

  /* ======================================================== APP: BROWSER */
  // Scramjet proxy lives at /proxy/ (its own page + service worker); this window frames it.
  let browserQueue = null;
  function openBrowser(q) {
    const w = wins.get('app:browser');
    if (w && w.frame) { restore(w); focus(w); if (q) w.frame.contentWindow.postMessage({ nova: 'go', q }, location.origin); return w; }
    browserQueue = q || null;
    return openApp('browser');
  }
  function renderBrowser(body, win) {
    body.classList.add('is-frame');
    body.innerHTML = '<div class="win-loading"><div style="display:grid;justify-items:center;gap:14px">' + appIco('browser', 'wg-ico') + '<div class="spin"></div></div></div><iframe title="Browser" allow="fullscreen; autoplay; clipboard-read; clipboard-write; camera; microphone; geolocation"></iframe>';
    const f = $('iframe', body); win.frame = f;
    f.addEventListener('load', () => $('.win-loading', body).classList.add('is-done'));
    f.src = 'proxy/' + (browserQueue ? '#q=' + encodeURIComponent(browserQueue) : '');
    browserQueue = null;
    return () => { try { f.src = 'about:blank'; } catch (e) {} };
  }

  /* ========================================================== APP: GAMES */
  const libs = new Set();
  function refreshLibraries() { libs.forEach((fn) => fn()); renderHome(); }
  function cardHtml(g, m) {
    const tr = A.scores.trendingCached();
    const r = A.scores.get(g.id), isNew = !m.tried[g.id], fav = m.favs.includes(g.id);
    return '<div class="gcard" role="button" tabindex="0" style="--h:' + g.hue + '" data-play="' + g.id + '" aria-label="Play ' + esc(g.title) + '"><div class="cov" data-cover="' + g.id + '">' +
      '<div class="gbadges">' + (g.popular ? '<span class="gbadge hot">Popular</span>' : '<span></span>') + (isNew ? '<span class="gbadge new">New</span>' : '') + '</div>' +
      '<button class="fav-btn' + (fav ? ' on' : '') + '" data-fav="' + g.id + '" aria-label="' + (fav ? 'Unfavorite' : 'Favorite') + ' ' + esc(g.title) + '">' + icon('heart') + '</button></div>' +
      '<div class="body"><h3>' + esc(g.title) + '</h3><p>' + esc(g.tagline) + '</p><div class="gmeta"><span>' + esc(g.tags.slice(0, 2).join(', ')) + '</span><span>' + (tr[g.id] && tr[g.id].likes > 0 ? tr[g.id].likes + ' like' + (tr[g.id].likes === 1 ? '' : 's') : tr[g.id] && tr[g.id].players > 1 ? tr[g.id].players + ' players' : r.plays ? (r.time >= 60 ? A.ui.fmtTime(r.time) + ' played' : 'Played') : 'Not played') + '</span></div></div></div>';
  }
  function renderGames(body) {
    let q = '', filter = 'all', sort = 'popular';
    const tags = [...new Set(LIVE.flatMap((g) => g.tags))].sort();
    body.innerHTML = '<div class="app"><div class="app-toolbar"><label class="search-box"><span class="sr-only">Search games</span>' + icon('search') + '<input class="input lib-q" type="search" placeholder="Search ' + LIVE.length + ' games" autocomplete="off"></label>' +
      '<select class="select lib-sort" style="width:auto;min-height:42px;border-radius:999px" aria-label="Sort"><option value="popular">Popular</option><option value="az">A–Z</option><option value="played">Most played</option><option value="recent">Recently played</option><option value="liked">Most liked</option></select>' +
      '<div class="chips" role="group" aria-label="Filter">' + [['all', 'All'], ['fav', icon('heart') + 'Favorites'], ['recent', icon('clock') + 'Recent'], ['new', icon('sparkles') + 'Not played yet']].concat(tags.map((t) => [t, esc(t)])).map(([k, l]) => '<button class="chip" data-f="' + esc(k) + '" aria-pressed="' + (k === 'all') + '">' + l + '</button>').join('') + '</div></div>' +
      '<div class="lib-content" style="display:grid;gap:22px"></div></div>';
    const content = $('.lib-content', body);
    const paint = () => {
      stopThumbs(content);
      const m = A.meta.get(), r = (id) => A.scores.get(id);
      let list = LIVE.slice();
      if (q) list = list.filter((g) => (g.title + ' ' + g.tags.join(' ') + ' ' + g.tagline + ' ' + (g.author || '')).toLowerCase().includes(q));
      if (filter === 'fav') list = list.filter((g) => m.favs.includes(g.id));
      else if (filter === 'recent') list = m.recent.map((x) => byId(x.id)).filter(Boolean);
      else if (filter === 'new') list = list.filter((g) => !m.tried[g.id]);
      else if (filter !== 'all') list = list.filter((g) => g.tags.includes(filter));
      if (sort === 'az') list.sort((a, b) => a.title.localeCompare(b.title));
      if (sort === 'played') list.sort((a, b) => r(b.id).time - r(a.id).time);
      if (sort === 'liked') { const tm = A.scores.trendingCached(), lk = (id) => (tm[id] && tm[id].likes) || 0; list.sort((a, b) => lk(b.id) - lk(a.id)); }
      if (sort === 'recent') { const idx = (id) => { const i = m.recent.findIndex((x) => x.id === id); return i < 0 ? 999 : i; }; list.sort((a, b) => idx(a.id) - idx(b.id)); }
      let html = '';
      if (!q && filter === 'all' && sort === 'popular') {
        const ft = A.meta.featured();
        html += '<div class="lib-hero" data-play="' + ft.id + '" data-cover="' + ft.id + '"><div class="in"><span class="os-label" style="color:var(--primary-2)">Featured today</span><h3>' + esc(ft.title) + '</h3><p>' + esc(ft.tagline) + '</p><div><button class="btn btn-primary" data-play="' + ft.id + '">' + icon('play') + 'Play now</button></div></div></div>';
        const trm = A.scores.trendingCached(), trend = LIVE.filter((g) => trm[g.id] && trm[g.id].recent > 0).sort((a, b) => trm[b.id].recent - trm[a.id].recent).slice(0, 8);
        if (trend.length >= 3) html += '<section style="display:grid;gap:12px"><div class="sec-title"><h4>Trending on Nova</h4><span class="pill hot">' + icon('flame') + 'This week</span></div><div class="row-scroll">' + trend.map((g) => cardHtml(g, m)).join('') + '</div></section>';
        const rec = m.recent.map((x) => byId(x.id)).filter(Boolean).slice(0, 8);
        if (rec.length) html += '<section style="display:grid;gap:12px"><div class="sec-title"><h4>Continue playing</h4></div><div class="row-scroll">' + rec.map((g) => cardHtml(g, m)).join('') + '</div></section>';
        if (rec.length) {
          const seed = rec[0], sim = LIVE.filter((g) => g.id !== seed.id && g.tags.some((t) => seed.tags.includes(t)) && !rec.includes(g)).slice(0, 8);
          if (sim.length) html += '<section style="display:grid;gap:12px"><div class="sec-title"><h4>Because you played ' + esc(seed.title) + '</h4></div><div class="row-scroll">' + sim.map((g) => cardHtml(g, m)).join('') + '</div></section>';
        }
        html += '<section style="display:grid;gap:12px"><div class="sec-title"><h4>Popular</h4></div><div class="lib-grid">' + list.filter((g) => g.popular).map((g) => cardHtml(g, m)).join('') + '</div></section>';
        html += '<section style="display:grid;gap:12px"><div class="sec-title"><h4>More games</h4><span class="pill">' + list.filter((g) => !g.popular).length + ' games</span></div><div class="lib-grid">' + list.filter((g) => !g.popular).map((g) => cardHtml(g, m)).join('') + '</div></section>';
      } else {
        html += list.length ? '<div class="lib-grid">' + list.map((g) => cardHtml(g, m)).join('') + '</div>'
          : '<div class="empty">' + (filter === 'fav' ? 'No favorites yet — tap the heart on any game.' : filter === 'recent' ? 'Nothing played yet.' : 'No games match that.') + (q ? '<div style="margin-top:12px"><button class="btn btn-sm" data-app-open="request">' + icon('send') + 'Request “' + esc(q) + '”</button></div>' : '') + '</div>';
      }
      content.innerHTML = html; fillCovers(content);
    };
    $('.lib-q', body).addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); paint(); });
    $('.lib-sort', body).addEventListener('change', (e) => { sort = e.target.value; paint(); });
    $('.chips', body).addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (!b) return; filter = b.dataset.f; $$('.chip', body).forEach((c) => c.setAttribute('aria-pressed', String(c === b))); paint(); });
    body.addEventListener('click', (e) => {
      const f = e.target.closest('[data-fav]');
      if (f) { e.stopPropagation(); const on = A.meta.toggleFav(f.dataset.fav); f.classList.toggle('on', on); f.classList.remove('pop'); void f.offsetWidth; f.classList.add('pop'); A.audio.sfx(on ? 'coin' : 'click'); renderHome(); return; }
      const ro = e.target.closest('[data-app-open]'); if (ro) { openApp(ro.dataset.appOpen); return; }
      const p = e.target.closest('[data-play]'); if (p) openGame(p.dataset.play);
    });
    body.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.gcard')) openGame(e.target.dataset.play); });
    paint(); libs.add(paint);
    A.scores.trending().then(() => paint());
    if (!isMobile()) setTimeout(() => $('.lib-q', body).focus(), 80);
    return () => { libs.delete(paint); stopThumbs(body); };
  }

  /* ========================================================== APP: MUSIC */
  const GEN_BG = { neon: 'linear-gradient(135deg,#a855f7,#4c1d95)', lofi: 'linear-gradient(135deg,#7c3aed,#1e1b4b)', chip: 'linear-gradient(135deg,#c084fc,#5b21b6)' };
  const stBg = (st) => hueBg(st.hue);
  function musicArt(n, size, spin) {
    const st = n.station, bg = n.kind === 'file' ? stBg(st) : (GEN_BG[n.key] || GEN_BG.neon);
    const r = Math.round(size * 0.24);
    return '<span class="wg-ico mu-art' + (spin ? ' is-spin' : '') + '" style="width:' + size + 'px;height:' + size + 'px;border-radius:' + r + 'px;background:' + bg + ';flex:none">' +
      (n.kind === 'file' && st.cover ? '<img src="' + esc(st.cover) + '" alt="" loading="lazy">' : icon('music')) + '</span>';
  }
  const fmtT = (t) => { if (!isFinite(t) || t < 0) return '0:00'; t = Math.floor(t); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
  function renderMusic(body) {
    const mu = A.audio.music;
    let view = null; /* which station's song list is open: station key or 'gen' */
    const paint = () => {
      const n = mu.now(), playing = mu.playing, list = mu.stations.list, owner = A.auth.isOwner && A.auth.isOwner();
      if (!view || (view !== 'gen' && !mu.stations.get(view.slice(3)))) view = n.kind === 'file' ? n.key : (list[0] ? list[0].key : 'gen');
      const vst = view === 'gen' ? null : mu.stations.get(view.slice(3));
      const tabs = list.map((st) => '<button class="mu-tab" data-view="' + st.key + '" aria-pressed="' + (view === st.key) + '"><i style="background:' + stBg(st) + '"></i>' + esc(st.name) + '<span>' + st.tracks.length + '</span></button>').join('') +
        '<button class="mu-tab" data-view="gen" aria-pressed="' + (view === 'gen') + '"><i style="background:' + GEN_BG.neon + '"></i>Generated<span>' + Object.keys(mu.tracks).length + '</span></button>';
      const songs = vst
        ? vst.tracks.map((t, i) => { const on = n.kind === 'file' && n.station === vst && n.index === i; return '<button class="mu-song' + (on ? ' is-on' : '') + '" data-song="' + i + '"><span class="mu-num">' + (on && playing ? '<span class="mu-eq"><i></i><i></i><i></i></span>' : i + 1) + '</span><span class="mu-st"><b>' + esc(t.title) + '</b>' + (t.artist ? '<small>' + esc(t.artist) + '</small>' : '') + '</span></button>'; }).join('')
        : Object.entries(mu.tracks).map(([k, t]) => { const on = n.kind === 'gen' && n.key === k; return '<button class="track" data-track="' + k + '" aria-pressed="' + on + '"><span class="app-ico" style="background:' + (GEN_BG[k] || '#333') + '">' + icon('music') + '</span><span style="flex:1"><b>' + esc(t.name) + '</b><div style="font-size:13px;color:var(--dim)">' + esc(t.vibe) + ', ' + t.bpm + ' BPM</div></span>' + (on && playing ? '<span class="pill ok">Playing</span>' : '') + '</button>'; }).join('');
      const pos = mu.position() || { time: 0, duration: 0 };
      body.innerHTML = '<div class="app mu-app">' +
        '<div class="mu-hero">' + musicArt(n, 132, playing) +
          '<div class="mu-now"><span class="os-label">' + (playing ? 'Now playing' : 'Paused') + (n.kind === 'file' ? ', ' + (n.index + 1) + ' of ' + n.count : '') + '</span><h2>' + esc(n.name) + '</h2><p class="app-sub">' + esc(n.kind === 'file' ? n.sub : n.vibe + ', generated live, never repeats the same way') + '</p></div></div>' +
        (n.kind === 'file' ? '<div class="mu-prog"><span class="mu-t0">' + fmtT(pos.time) + '</span><div class="mu-bar" role="slider" aria-label="Seek" tabindex="0" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + (pos.duration ? Math.round(pos.time / pos.duration * 100) : 0) + '"><i style="width:' + (pos.duration ? pos.time / pos.duration * 100 : 0) + '%"></i></div><span class="mu-t1">' + fmtT(pos.duration) + '</span></div>'
          : '<div class="viz music-viz" style="width:100%;height:46px">' + '<i></i>'.repeat(32) + '</div>') +
        '<div class="mu-ctrl">' +
          '<button class="icon-btn mu-shuffle' + (A.settings.get('shuffle') ? ' is-on' : '') + '" aria-pressed="' + !!A.settings.get('shuffle') + '" aria-label="Shuffle"' + (n.kind === 'file' ? '' : ' disabled') + '>' + icon('shuffle') + '</button>' +
          '<button class="icon-btn mu-prev" aria-label="Previous"' + (n.kind === 'file' ? '' : ' disabled') + '>' + icon('skipBack') + '</button>' +
          '<button class="big-play mu-toggle" aria-label="' + (playing ? 'Pause' : 'Play') + '">' + icon(playing ? 'pause' : 'play') + '</button>' +
          '<button class="icon-btn mu-next" aria-label="Next">' + icon('skip') + '</button>' +
          '<span style="width:40px"></span></div>' +
        '<div class="setting-row" style="width:100%"><label class="label" for="mu-vol">Volume</label><input class="range" type="range" id="mu-vol" min="0" max="1" step="0.05" value="' + A.settings.get('musicVol') + '"></div>' +
        '<div class="mu-tabs" role="tablist">' + tabs + '</div>' +
        '<div class="mu-list">' + songs + '</div>' +
        (!list.length && owner ? '<div class="mu-hint">' + icon('upload') + '<div><b>Add your own stations</b><br>Put MP3s in <code>assets/audio/hip hop/</code>, <code>assets/audio/lofi/</code>… (any folder name), then push. Each folder becomes a station.</div></div>' : '') +
        '<div class="setting-row" style="width:100%;text-align:left"><div><div class="label">Pause in games</div><div class="desc">Games play their own sound</div></div><label class="switch"><input type="checkbox" class="mu-pause"' + (A.settings.get('pauseMusicInGames') ? ' checked' : '') + '><span></span></label></div></div>';
      startViz();
    };
    const play = () => { A.audio.unlock(); mu.held = false; if (!A.settings.get('music')) A.settings.set('music', true); setTimeout(() => mu.start(), 40); };
    const toggle = (on) => { A.audio.unlock(); mu.held = false; A.settings.set('music', on); if (on) setTimeout(() => mu.start(), 40); setTimeout(() => { paint(); renderHome(); }, 120); };
    body.addEventListener('click', (e) => {
      if (e.target.closest('.mu-toggle')) return toggle(!mu.playing);
      if (e.target.closest('.mu-next')) { A.audio.unlock(); mu.next(); if (!mu.playing) play(); return; }
      if (e.target.closest('.mu-prev')) { A.audio.unlock(); mu.prev(); if (!mu.playing) play(); return; }
      if (e.target.closest('.mu-shuffle')) { A.settings.set('shuffle', !A.settings.get('shuffle')); A.audio.sfx('toggle'); return; }
      const v = e.target.closest('[data-view]'); if (v) { view = v.dataset.view; A.audio.sfx('click'); paint(); return; }
      const sg = e.target.closest('[data-song]'); if (sg && view !== 'gen') { A.audio.unlock(); mu.playAt(view, +sg.dataset.song); return; }
      const bar = e.target.closest('.mu-bar'); if (bar) { const r = bar.getBoundingClientRect(); mu.seek((e.clientX - r.left) / r.width); return; }
      const t = e.target.closest('[data-track]'); if (t) { A.settings.set('track', t.dataset.track); toggle(true); }
    });
    body.addEventListener('keydown', (e) => {
      if (!e.target.matches('.mu-bar')) return;
      const p = mu.position(); if (!p || !p.duration) return;
      if (e.key === 'ArrowRight') { mu.seek((p.time + 5) / p.duration); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { mu.seek((p.time - 5) / p.duration); e.preventDefault(); }
    });
    body.addEventListener('input', (e) => { if (e.target.id === 'mu-vol') A.settings.set('musicVol', +e.target.value); });
    body.addEventListener('change', (e) => { if (e.target.matches('.mu-pause')) A.settings.set('pauseMusicInGames', e.target.checked); });
    paint();
    const offs = [onEv('music', () => setTimeout(paint, 30)), onEv('stations', () => paint()),
      onEv('musictime', (d) => {
        const bar = $('.mu-bar i', body); if (!bar) return;
        bar.style.width = (d.duration ? d.time / d.duration * 100 : 0) + '%';
        $('.mu-t0', body).textContent = fmtT(d.time); $('.mu-t1', body).textContent = fmtT(d.duration);
      })];
    return () => offs.forEach((f) => f && f());
  }

  /* =================================================== APP: ACHIEVEMENTS */
  function renderAchievements(body) {
    const paint = () => {
      const m = A.meta.get(), list = A.meta.achievements, done = list.filter((a) => m.ach[a.id]).length, lv = A.meta.levelInfo(m.xp);
      body.innerHTML = '<div class="app"><div><h2>Achievements</h2><p class="app-sub">Unlock them all to become a Nova legend.</p></div>' +
        '<div class="stat-grid"><div class="stat"><span>Unlocked</span><b>' + done + ' / ' + list.length + '</b></div><div class="stat"><span>Level</span><b>' + lv.level + '</b></div><div class="stat"><span>Total XP</span><b>' + m.xp.toLocaleString() + '</b></div><div class="stat"><span>Dailies done</span><b>' + m.dailiesDone + '</b></div></div>' +
        '<div class="ach-grid">' + list.map((a) => { const p = A.meta.progress(a, m); const val = a.fmt === 'time' ? A.ui.fmtTime(p.value) + ' / ' + A.ui.fmtTime(p.goal) : p.value + ' / ' + p.goal;
          return '<div class="ach' + (p.done ? ' done' : '') + '"><span class="ai">' + icon(p.done ? a.icon : 'lock') + '</span><span style="flex:1;min-width:0"><b>' + esc(a.title) + '</b><small>' + esc(a.desc) + '</small>' + (p.done ? '<span class="xp">Unlocked ' + new Date(m.ach[a.id]).toLocaleDateString() + ', +' + a.xp + ' XP</span>' : '<div class="bar gold"><i style="width:' + (p.value / p.goal * 100) + '%"></i></div><span class="xp">' + (p.goal > 1 ? val + ', ' : '') + '+' + a.xp + ' XP</span>') + '</span></div>'; }).join('') + '</div></div>';
    };
    paint(); return onEv('meta', paint);
  }

  /* ==================================================== APP: LEADERBOARD */
  function renderLeaderboard(body) {
    let board = '__xpw';
    const boards = [['__xpw', 'This week'], ['__xp', 'All-time'], ...LIVE.filter((g) => g.original).map((g) => [g.id, g.title])];
    const paint = async () => {
      const resetIn = (() => { const d = new Date(), day = d.getDay() || 7, end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (8 - day)); const h = Math.round((end - d) / 36e5); return h > 48 ? Math.round(h / 24) + ' days' : h + 'h'; })();
      body.innerHTML = '<div class="app"><div><h2>Leaderboard</h2><p class="app-sub">' + (board === '__xpw' ? 'Weekly XP race — resets in ' + resetIn + '.' : 'The best players across Nova.') + '</p></div><div class="seg">' + boards.map(([k, l]) => '<button data-b="' + k + '" aria-pressed="' + (k === board) + '">' + esc(l) + '</button>').join('') + '</div><div class="lb-body"><div class="empty">Loading…</div></div></div>';
      const want = board, res = await A.scores.leaderboardAsync(board === '__xpw' ? '__xpw:' + A.meta.week() : board, 25);
      if (want !== board) return;
      let rows = res.rows;
      const xpBoard = board === '__xp' || board === '__xpw';
      if (xpBoard && res.scope !== 'global') { const m = A.meta.get(), u = A.auth.current(), v = board === '__xpw' ? ((m.weekly && m.weekly.week === A.meta.week()) ? m.weekly.xp : 0) : m.xp; rows = v ? [{ name: u ? u.username : 'You (guest)', hue: u ? u.hue : 220, best: v, plays: Object.keys(m.tried).length, me: true }] : []; }
      const unit = xpBoard ? ' XP' : '';
      $('.lb-body', body).innerHTML = (res.scope !== 'global' ? '<p class="field-hint" style="margin-bottom:10px">Showing this device only — ' + (A.auth.current() ? 'global board is offline right now.' : '<a href="#" class="lb-join">create an account</a> to join the global board.') + '</p>' : '') +
        (rows.length ? '<ol class="lb-rows">' + rows.map((r, i) => '<li class="' + (r.me ? 'me' : '') + '"><span class="rk">' + (i + 1) + '</span><span class="avatar" style="background:' + hueBg(r.hue) + '">' + esc(r.name[0].toUpperCase()) + '</span><span style="min-width:0"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(r.name) + (r.me ? ' <span class="badge" style="margin-left:4px">You</span>' : '') + '</b><small style="color:var(--faint)">' + (board === '__xp' ? 'Level ' + A.meta.levelInfo(r.best).level + ', ' + r.plays + ' games tried' : board === '__xpw' ? r.plays + ' games tried' : r.plays + ' plays') + '</small></span><span class="sc">' + r.best.toLocaleString() + unit + '</span></li>').join('') + '</ol>'
          : '<div class="empty">No one here yet. Be the first!</div>');
      const j = $('.lb-join', body); if (j) j.addEventListener('click', (e) => { e.preventDefault(); A.ui.openAuth('signup'); });
    };
    body.addEventListener('click', (e) => { const b = e.target.closest('[data-b]'); if (b) { board = b.dataset.b; paint(); } });
    paint(); return onEv('auth', paint);
  }

  /* ======================================================= APP: PROFILE */
  function renderProfile(body) {
    const paint = () => {
      stopThumbs(body);
      const u = A.auth.current(), m = A.meta.get(), lv = A.meta.levelInfo(m.xp), sum = A.scores.summary();
      const favs = m.favs.map(byId).filter(Boolean), rec = m.recent.map((r) => byId(r.id)).filter(Boolean).slice(0, 6);
      body.innerHTML = '<div class="app">' +
        '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><span class="avatar" style="width:76px;height:76px;font-size:32px;border-radius:22px;background:' + (u ? hueBg(u.hue) : 'var(--tile)') + '">' + (u ? esc(u.username[0].toUpperCase()) : icon('user').replace('<svg', '<svg width="34" height="34"')) + '</span>' +
        '<div style="flex:1;min-width:200px"><h2>' + (u ? esc(u.username) : 'Guest player') + '</h2><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
        (u && A.auth.isOwner() ? '<span class="badge badge-pro">' + icon('crown') + 'Owner</span>' : '') + '<span class="badge">Level ' + lv.level + ', ' + lv.title + '</span>' +
        '<span class="badge">' + icon(u && u.cloud ? 'cloud' : 'phone') + (u && u.cloud ? 'Synced to cloud' : 'Saved on this device') + '</span></div></div>' +
        (u ? '<button class="btn btn-sm pf-out">' + icon('logout') + 'Log out</button>' : '<div style="display:flex;gap:8px"><button class="btn btn-sm pf-in">Log in</button><button class="btn btn-primary btn-sm pf-up">' + icon('user') + 'Sign up</button></div>') + '</div>' +
        (u ? '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span class="os-label">Avatar color</span><div class="swatches">' + [0, 25, 45, 90, 150, 190, 220, 265, 290, 330].map((h) => '<button class="swatch pf-hue" data-hue="' + h + '" aria-label="Color ' + h + '" aria-pressed="' + (Math.abs(u.hue - h) < 3) + '" style="width:30px;height:30px;background:' + hueBg(h) + '"></button>').join('') + '</div></div>' : '') +
        (u ? '' : '<div class="side-guest" style="padding:14px;border-radius:14px;background:linear-gradient(135deg,rgba(139,92,246,.18),rgba(244,63,94,.12));border:1px solid var(--line)">Your progress is saved on this device. Make a free account to keep your XP, achievements and saves on every device and join the global leaderboard.</div>') +
        '<div><div style="display:flex;justify-content:space-between;font-size:14px;color:var(--dim);margin-bottom:6px"><span>Level ' + lv.level + '</span><span>' + lv.cur.toLocaleString() + ' / ' + lv.need.toLocaleString() + ' XP</span></div><div class="bar"><i style="width:' + (lv.pct * 100) + '%"></i></div></div>' +
        '<div class="stat-grid"><div class="stat"><span>Total XP</span><b>' + m.xp.toLocaleString() + '</b></div><div class="stat"><span>Games tried</span><b>' + Object.keys(m.tried).length + ' / ' + LIVE.length + '</b></div><div class="stat"><span>Time played</span><b>' + A.ui.fmtTime(Math.max(m.secs, sum.time)) + '</b></div><div class="stat"><span>Streak</span><b>' + m.streak.count + ' days</b></div><div class="stat"><span>Achievements</span><b>' + Object.keys(m.ach).length + '</b></div><div class="stat"><span>Best Snake</span><b>' + A.scores.best('snake').toLocaleString() + '</b></div></div>' +
        (Object.keys(m.ach).length ? '<section style="display:grid;gap:10px"><div class="os-label">Trophy case</div><div style="display:flex;gap:8px;flex-wrap:wrap">' + A.meta.achievements.filter((x) => m.ach[x.id]).map((x) => '<span class="pill" title="' + esc(x.desc) + '" style="color:#d8b4fe;border-color:rgba(167,139,250,.4);background:rgba(139,92,246,.1)">' + icon(x.icon) + esc(x.title) + '</span>').join('') + '</div></section>' : '') +
                '<section style="display:grid;gap:10px"><div class="os-label">Favorites</div>' + (favs.length ? '<div class="mini-grid">' + favs.map((g) => '<button class="mini" data-play="' + g.id + '" data-cover="' + g.id + '"><span>' + esc(g.title) + '</span></button>').join('') + '</div>' : '<p class="field-hint">Tap the heart on a game to save it here.</p>') + '</section>' +
        '<section style="display:grid;gap:10px"><div class="os-label">Recently played</div>' + (rec.length ? '<div class="start-list">' + rec.map((g) => '<button class="sl" data-play="' + g.id + '">' + gameIco(g) + '<span><b>' + esc(g.title) + '</b><small>' + ago(m.recent.find((r) => r.id === g.id).at) + '</small></span></button>').join('') + '</div>' : '<p class="field-hint">Nothing yet — go play something!</p>') + '</section></div>';
      fillCovers(body);
    };
    body.addEventListener('click', (e) => {
      if (e.target.closest('.pf-out')) { A.auth.logOut(); A.ui.toast('Logged out.', 'logout'); }
      if (e.target.closest('.pf-in')) A.ui.openAuth('login');
      if (e.target.closest('.pf-up')) A.ui.openAuth('signup');
      const hb = e.target.closest('.pf-hue'); if (hb) { A.auth.setHue(+hb.dataset.hue).then(() => A.audio.sfx('toggle'), (er) => A.ui.toast(er.message, 'info')); }
      const p = e.target.closest('[data-play]'); if (p) openGame(p.dataset.play);
    });
    paint();
    const o1 = onEv('auth', paint), o2 = onEv('meta', paint);
    return () => { o1(); o2(); stopThumbs(body); };
  }

  /* ====================================================== APP: SETTINGS */
  function renderSettings(body) {
    const wrap = document.createElement('div'); wrap.className = 'app'; body.appendChild(wrap);
    A.ui.openSettings(wrap);
    return () => { if (wrap._destroy) wrap._destroy(); };
  }

  /* ========================================================= APP: NOTES */
  function renderNotes(body) {
    body.innerHTML = '<textarea class="notes-area" placeholder="Jot down codes, high scores, strategies…" aria-label="Notes"></textarea>';
    const t = $('textarea', body); t.value = A.store.get('notes', '') || '';
    let tm = 0;
    t.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => { A.store.set('notes', t.value); A.meta.edit(() => {}); }, 400); });
    setTimeout(() => t.focus(), 60);
    return () => { clearTimeout(tm); A.store.set('notes', t.value); };
  }

  /* ======================================================= APP: REQUEST */
  function renderRequest(body) {
    const mine = A.store.get('requests', []);
    body.innerHTML = '<div class="app"><div><h2>Request a game</h2><p class="app-sub">Tell us what you want to play next. We add games whose creators allow it — open-source and freely licensed games.</p></div>' +
      '<form class="rq" novalidate style="display:grid;gap:14px"><div class="field"><label for="rq-t">Game name</label><input class="input" id="rq-t" maxlength="80" required placeholder="e.g. Mindustry"></div>' +
      '<div class="field"><label for="rq-n">Anything else? <span style="color:var(--faint)">(optional)</span></label><textarea class="input" id="rq-n" maxlength="500" rows="4" style="padding:12px;min-height:110px;resize:vertical" placeholder="Link, why you love it, etc."></textarea></div>' +
      '<div class="field-error rq-err" role="alert"></div><button class="btn btn-primary btn-lg" type="submit">' + icon('send') + 'Send request</button></form>' +
      (mine.length ? '<section style="display:grid;gap:8px"><div class="os-label">Your requests</div>' + mine.slice(0, 8).map((r) => '<div class="setting-row" style="padding:8px 12px;border-radius:12px;background:rgba(255,255,255,.04)"><span>' + esc(r.title) + '</span><span class="field-hint">' + new Date(r.at).toLocaleDateString() + '</span></div>').join('') + '</section>' : '') + '</div>';
    $('form', body).addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = $('#rq-t', body).value.trim(), note = $('#rq-n', body).value.trim(), err = $('.rq-err', body), btn = $('button[type=submit]', body);
      if (title.length < 2) { err.textContent = 'Enter the game’s name.'; A.audio.sfx('error'); return; }
      btn.disabled = true; btn.textContent = 'Sending…';
      let ok = false;
      try {
        await A.ready;
        if (A.cloud.client) { const { error } = await A.cloud.client.from('game_requests').insert({ title, note: note || null }); ok = !error; if (error) console.warn(error); }
      } catch (x) { ok = false; }
      const list = A.store.get('requests', []); list.unshift({ title, at: Date.now(), sent: ok }); A.store.set('requests', list.slice(0, 30));
      A.meta.flag('requested'); A.audio.sfx('coin');
      A.ui.toast(ok ? 'Request sent — thanks!' : 'Saved — we’ll send it when you’re back online.', 'send');
      renderRequest(body);
    });
  }

  /* ======================================================= APP: UPDATES */
  function renderUpdates(body) {
    body.innerHTML = '<div class="app"><div><h2>Update log</h2><p class="app-sub">What’s new on Nova.</p></div>' + A.config.changelog.map((c, i) =>
      '<section class="os-glass" style="border-radius:18px;padding:16px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><b style="font-family:var(--font-os);font-size:20px;font-weight:500">Version ' + esc(c.v) + '</b>' + (i === 0 ? '<span class="pill ok">Latest</span>' : '<span class="pill">' + esc(c.date) + '</span>') + '</div><ul style="margin:0;padding-left:18px;color:var(--dim);display:grid;gap:6px">' + c.items.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></section>').join('') + '</div>';
  }

  /* ========================================================= APP: ABOUT */
  function renderAbout(body) {
    const ports = LIVE.filter((g) => !g.original);
    body.innerHTML = '<div class="app"><div><h2>Nova OS ' + esc(A.config.version) + '</h2><p class="app-sub">A free game desktop that runs in your browser. ' + LIVE.length + ' games, no downloads, progress that follows you.</p></div>' +
      '<div class="stat-grid"><div class="stat"><span>Games</span><b>' + LIVE.length + '</b></div><div class="stat"><span>Shortcuts</span><b style="font-size:16px"><span class="kbd">/</span> search, <span class="kbd">Ctrl K</span></b></div></div>' +
      '<section style="display:grid;gap:8px"><div class="os-label">Game credits</div><p class="field-hint">These games are open source. Each is hosted under its creator’s license, with trackers and ads removed.</p>' +
      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr style="text-align:left;color:var(--faint)"><th style="padding:8px">Game</th><th style="padding:8px">Creator</th><th style="padding:8px">License</th></tr></thead><tbody>' +
      ports.map((g) => '<tr style="border-top:1px solid var(--line)"><td style="padding:8px"><a href="https://github.com/' + esc(g.repo) + '" target="_blank" rel="noopener">' + esc(g.title) + '</a></td><td style="padding:8px;color:var(--dim)">' + esc(g.author) + '</td><td style="padding:8px"><span class="badge">' + esc(g.license) + '</span></td></tr>').join('') +
      '</tbody></table></div></section></div>';
  }

  /* ------------------------------------------------------------ CONFETTI */
  function confetti(n) {
    if (A.settings.reducedMotion()) return;
    const c = document.createElement('canvas'); c.className = 'confetti'; c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
    const x = c.getContext('2d'), cols = ['#a78bfa', '#c084fc', '#8b5cf6', '#e9d5ff', '#7c3aed', '#ffffff'];
    const P = Array.from({ length: n || 160 }, () => ({ x: innerWidth / 2 + (Math.random() - 0.5) * 200, y: innerHeight * 0.55, vx: (Math.random() - 0.5) * 16, vy: -8 - Math.random() * 12, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4, s: 5 + Math.random() * 6, c: cols[(Math.random() * cols.length) | 0] }));
    let t0 = performance.now();
    (function f(now) {
      const dt = Math.min(0.05, (now - t0) / 1000); t0 = now; x.clearRect(0, 0, c.width, c.height); let alive = 0;
      P.forEach((p) => { p.vy += 26 * dt; p.vx *= 0.99; p.x += p.vx * 60 * dt; p.y += p.vy * 60 * dt; p.r += p.vr; if (p.y < c.height + 20) alive++;
        x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); });
      if (alive) requestAnimationFrame(f); else c.remove();
    })(t0);
  }
  /* celebrate big moments (achievement / level-up / daily) */
  const origToast = A.ui.toast;
  A.ui.toast = function (msg, ic, opts) { origToast(msg, ic, opts); if (opts && opts.big && /Level up|Achievement|Daily challenge/i.test(msg)) confetti(opts.achievement ? 120 : 180); };

  /* ----------------------------------------------------------- SHORTCUTS */
  function showShortcuts() {
    const rows = [['/  or  Ctrl K', 'Search games, apps and actions'], ['Esc', 'Close search / menus'], ['?', 'This list'], ['Double-click title bar', 'Maximize / restore a window'],
      ['Drag window to top', 'Maximize'], ['Drag window to left / right edge', 'Split screen'], ['Right-click desktop', 'Quick menu'], ['Start → Lock', 'Lock screen'], ['F (in Nova games)', 'Fullscreen']];
    A.ui.modal('<h2>Keyboard & tricks</h2><p class="modal-sub">Move around Nova like a pro.</p><div style="display:grid;gap:8px">' + rows.map(([k, d]) => '<div class="setting-row" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>' + esc(d) + '</span><span class="kbd" style="white-space:nowrap">' + esc(k) + '</span></div>').join('') + '</div>', { label: 'Shortcuts' });
  }

  /* --------------------------------------------------------- SCREENSAVER */
  let idleT = 0;
  const resetIdle = () => { clearTimeout(idleT); idleT = setTimeout(() => {
    const gameVisible = [...wins.values()].some((w) => w.opts.game && !w.min);
    if (!gameVisible && !document.querySelector('.modal-backdrop') && A.settings.get('lockScreen')) showLock();
  }, 5 * 60 * 1000); };
  ['pointermove', 'keydown', 'pointerdown', 'wheel'].forEach((ev) => addEventListener(ev, resetIdle, { passive: true }));
  resetIdle();

  /* ========================================================= APP: ADMIN */
  function renderAdmin(body) {
    const paint = async () => {
      if (!A.auth.isOwner()) { body.innerHTML = '<div class="app"><p class="empty">Owner only.</p></div>'; return; }
      body.innerHTML = '<div class="app"><div><h2>Admin</h2><p class="app-sub">Your site at a glance. Only your owner account can see this.</p></div><div class="ad-stats stat-grid"><div class="empty">Loading…</div></div><section style="display:grid;gap:10px"><div class="sec-title"><h4>Game requests</h4><button class="btn btn-sm btn-ghost ad-ref">' + icon('refresh') + 'Refresh</button></div><div class="ad-req"><div class="empty">Loading…</div></div></section><section style="display:grid;gap:10px"><div class="sec-title"><h4>Most played</h4></div><div class="ad-top"></div></section></div>';
      await A.ready; const c = A.cloud.client;
      if (!c) { $('.ad-stats', body).innerHTML = '<div class="empty">Cloud is offline.</div>'; return; }
      const [{ data: st }, { data: rq }, tr] = await Promise.all([c.rpc('site_stats'), c.from('game_requests').select('id,title,note,created_at').order('created_at', { ascending: false }).limit(100), A.scores.trending()]);
      const S = st || {};
      $('.ad-stats', body).innerHTML = [['Players', S.players], ['New this week', S.new_7d], ['Active this week', S.active_7d], ['Hours played', S.hours], ['Likes', S.likes], ['Requests', S.requests]].map(([k, v]) => '<div class="stat"><span>' + k + '</span><b>' + (v == null ? '—' : Number(v).toLocaleString()) + '</b></div>').join('');
      const groups = {}; (rq || []).forEach((r) => { const k = r.title.trim().toLowerCase(); (groups[k] = groups[k] || { title: r.title.trim(), n: 0, notes: [], ids: [], last: r.created_at }).n++; groups[k].ids.push(r.id); if (r.note) groups[k].notes.push(r.note); });
      const g = Object.values(groups).sort((a, b) => b.n - a.n);
      $('.ad-req', body).innerHTML = g.length ? '<div style="display:grid;gap:8px">' + g.map((x) => '<div class="nf" style="align-items:center"><span class="pill hot" style="flex:none">' + x.n + '×</span><span style="flex:1;min-width:0"><b style="display:block">' + esc(x.title) + '</b>' + (x.notes.length ? '<small>' + esc(x.notes.slice(0, 2).join(', ').slice(0, 160)) + '</small>' : '<small>' + ago(Date.parse(x.last)) + '</small>') + '</span><button class="icon-btn ad-del" data-ids="' + x.ids.join(',') + '" aria-label="Dismiss ' + esc(x.title) + '">' + icon('trash') + '</button></div>').join('') + '</div>' : '<div class="empty">No requests yet.</div>';
      const top = LIVE.filter((x) => tr[x.id]).sort((a, b) => (tr[b.id].secs || 0) - (tr[a.id].secs || 0)).slice(0, 10);
      $('.ad-top', body).innerHTML = top.length ? '<div class="start-list">' + top.map((x) => '<div class="sl">' + gameIco(x) + '<span style="flex:1"><b>' + esc(x.title) + '</b><small>' + tr[x.id].players + ' players, ' + Math.round((tr[x.id].secs || 0) / 360) / 10 + ' h, ' + (tr[x.id].likes || 0) + ' likes</small></span></div>').join('') + '</div>' : '<div class="empty">No play data yet.</div>';
    };
    body.addEventListener('click', async (e) => {
      if (e.target.closest('.ad-ref')) { A.store.remove('trendCache'); paint(); }
      const d = e.target.closest('.ad-del'); if (d) { const ids = d.dataset.ids.split(',').map(Number); const { error } = await A.cloud.client.from('game_requests').delete().in('id', ids); if (error) A.ui.toast('Couldn’t delete that.', 'info'); else { d.closest('.nf').remove(); A.ui.toast('Dismissed', 'check'); } }
    });
    paint(); return onEv('auth', paint);
  }

  /* ---------------------------------------------------------------- BOOT */
  paintDock(); tickClock(); paintHome();
  A.scores.trending().then(() => renderHome());
  A.on('meta', () => { renderHome(); });
  A.on('auth', () => { paintDock(); renderHome(); });
  A.on('music', () => renderHome());
  A.on('stations', () => renderHome());
  A.on('settings', (d) => { if (['showFps', 'clock24'].includes(d.key)) paintDock(); if (d.key === 'track' || d.key === 'music') renderHome(); });
  window.addEventListener('storage', (e) => { if (e.key === 'nova.meta' || e.key === 'nova.scores') { renderHome(); libs.forEach((fn) => fn()); } });
  addEventListener('resize', () => { if (isMobile()) wins.forEach((w) => setMax(w, true, true)); });

  /* deep links: /#play=2048 or /#app=music */
  function route() {
    const h = location.hash.slice(1), [k, v] = h.split('=');
    if (k === 'play' && byId(v)) openGame(v); else if (k === 'app' && APPS[v]) openApp(v);
  }
  window.addEventListener('hashchange', route);

  setTimeout(() => {
    $('#boot').classList.add('is-done');
    if (A.settings.get('lockScreen') && !location.hash) showLock();
    route();
    welcome = () => { try { if (!A.store.get('os.welcomed', false)) { A.store.set('os.welcomed', true); setTimeout(() => A.ui.toast(matchMedia('(pointer: coarse)').matches ? 'Welcome to Nova OS! Tap the star for Start and search.' : 'Welcome to Nova OS! Press / to search, ? for shortcuts.', 'sparkles', { big: true }), 700); } } catch (e) {} };
    if (!lockEl) welcome();
  }, 650);

  /* ------------------------------------------------------- INSTALL APP */
  let installEvt = null;
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; });
  addEventListener('appinstalled', () => { installEvt = null; A.ui.toast('Nova OS installed!', 'sparkles', { big: true }); });
  window.NovaInstall = async () => { if (!installEvt) return false; installEvt.prompt(); const r = await installEvt.userChoice; installEvt = null; return r.outcome === 'accepted'; };
  window.NovaCanInstall = () => !!installEvt;

  window.NovaOS = { openGame, openApp, openPalette, wins };
})();
