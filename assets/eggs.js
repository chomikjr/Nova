/* ==========================================================================
   NOVA EASTER EGGS (client-side only — shh)
   1. Type 67              → the screen fills with 67s and everything does the 6-7 wiggle
   2. Konami code          → ↑ ↑ ↓ ↓ ← → ← → B A : RETRO MODE (CRT, chiptune, +30 lives)
   3. Click the big day name 5 times fast → GRAVITY: the desktop falls down, bounces, then floats back
   ========================================================================== */
(function () {
  'use strict';
  const A = window.Arcade;
  if (!A || A.embed) return;
  const reduced = () => (A.settings && A.settings.reducedMotion && A.settings.reducedMotion()) || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const beep = (o) => { try { A.audio.ensure(); A.audio.tone(o); } catch (e) {} };
  let busy = false;

  /* shared styles */
  const css = document.createElement('style');
  css.textContent = `
  .egg-layer { position: fixed; inset: 0; z-index: 99990; pointer-events: none; overflow: hidden; }
  .egg-67 { position: absolute; font: 900 var(--s, 48px)/1 'Space Grotesk', 'Bricolage Grotesque', system-ui, sans-serif; color: var(--c); text-shadow: 0 4px 0 rgba(0,0,0,.35), 0 0 24px var(--c);
    animation: egg-pop .35s cubic-bezier(.2,1.6,.4,1) both, egg-sixseven .42s ease-in-out infinite alternate; animation-delay: var(--d), calc(var(--d) + .35s); }
  .egg-67 span { display: inline-block; animation: egg-hand .42s ease-in-out infinite alternate; }
  .egg-67 span + span { animation-direction: alternate-reverse; }
  @keyframes egg-pop { from { transform: scale(0) rotate(-30deg); opacity: 0; } }
  @keyframes egg-sixseven { from { transform: rotate(-8deg) translateX(-10px); } to { transform: rotate(8deg) translateX(10px); } }
  @keyframes egg-hand { from { transform: translateY(-14%); } to { transform: translateY(14%); } }
  html.egg-wiggle #os, html.egg-wiggle body > main, html.egg-wiggle .dock { animation: egg-wiggle .21s ease-in-out infinite alternate; }
  @keyframes egg-wiggle { from { transform: translateX(-14px) rotate(-1.2deg); } to { transform: translateX(14px) rotate(1.2deg); } }
  .egg-banner { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 99991; pointer-events: none; font: 900 clamp(70px, 16vw, 200px)/1 'Space Grotesk', system-ui, sans-serif;
    color: #fff; text-shadow: 0 0 40px #8b5cf6, 0 8px 0 #4c1d95; animation: egg-banner 2.6s ease both; white-space: nowrap; }
  @keyframes egg-banner { 0% { transform: translate(-50%, -50%) scale(.2); opacity: 0; } 15% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; } 80% { opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; } }
  html.egg-retro { filter: saturate(1.5) contrast(1.1); }
  html.egg-retro body * { font-family: 'Press Start 2P', 'Courier New', monospace !important; letter-spacing: 0 !important; }
  html.egg-retro body::before { content: ''; position: fixed; inset: 0; z-index: 99989; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(0,0,0,.28) 0 2px, transparent 2px 4px); mix-blend-mode: multiply; animation: egg-flicker .12s steps(2) infinite; }
  @keyframes egg-flicker { 50% { opacity: .85; } }
  .egg-retro-tag { position: fixed; right: 18px; top: 18px; z-index: 99992; pointer-events: none; padding: 10px 14px; background: #000; color: #39ff14; border: 3px solid #39ff14; font: 12px/1.6 'Press Start 2P', monospace; box-shadow: 4px 4px 0 #39ff14; }
  .egg-grav { will-change: transform; }
  `;
  document.head.appendChild(css);

  function banner(text, ms) { const b = document.createElement('div'); b.className = 'egg-banner'; b.textContent = text; document.body.appendChild(b); setTimeout(() => b.remove(), ms || 2600); }

  /* ------------------------------------------------------------ 1. 67 */
  function sixSeven() {
    if (busy) return; busy = true;
    try { A.meta && A.meta.flag && A.meta.flag('egg67'); } catch (e) {}
    const layer = document.createElement('div'); layer.className = 'egg-layer'; document.body.appendChild(layer);
    const cols = ['#a78bfa', '#f472b6', '#facc15', '#34d399', '#60a5fa', '#fb923c', '#ffffff'];
    const n = reduced() ? 12 : Math.min(90, Math.round(innerWidth * innerHeight / 14000));
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div'); s.className = 'egg-67';
      s.innerHTML = '<span>6</span><span>7</span>';
      s.style.cssText = 'left:' + (Math.random() * 100) + '%;top:' + (Math.random() * 100) + '%;--s:' + (28 + Math.random() * 90) + 'px;--c:' + cols[i % cols.length] + ';--d:' + (Math.random() * 0.9) + 's';
      s.style.translate = '-50% -50%';
      layer.appendChild(s);
    }
    banner('6 7 !', 3000);
    if (!reduced()) document.documentElement.classList.add('egg-wiggle');
    /* "six... seven" boops */
    [0, 0.42, 0.84, 1.26, 1.68, 2.1].forEach((t, i) => setTimeout(() => beep({ type: 'square', freq: i % 2 ? 392 : 330, dur: 0.16, vol: 0.06 }), t * 1000));
    A.ui.toast('6… 7… 🤷', 'sparkles');
    setTimeout(() => { document.documentElement.classList.remove('egg-wiggle'); layer.style.transition = 'opacity .5s'; layer.style.opacity = '0'; setTimeout(() => { layer.remove(); busy = false; }, 500); }, 3800);
  }

  /* ------------------------------------------------------------ 2. Konami: retro mode */
  function retro() {
    if (busy || document.documentElement.classList.contains('egg-retro')) return; busy = true;
    if (!document.getElementById('egg-font')) { const l = document.createElement('link'); l.id = 'egg-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'; document.head.appendChild(l); }
    document.documentElement.classList.add('egg-retro');
    const tag = document.createElement('div'); tag.className = 'egg-retro-tag'; tag.innerHTML = '1UP x30<br>RETRO MODE'; document.body.appendChild(tag);
    /* classic power-up fanfare */
    [[523, 0], [659, .1], [784, .2], [1047, .3], [784, .45], [1047, .55], [1319, .7]].forEach(([f, t]) => setTimeout(() => beep({ type: 'square', freq: f, dur: 0.12, vol: 0.07 }), t * 1000));
    banner('+30 LIVES', 2600);
    const prevTrack = A.settings.get('track');
    try { if (A.audio.music.tracks.chip) A.settings.set('track', 'chip'); } catch (e) {}
    A.ui.toast('Konami code! Retro mode for 30 seconds.', 'trophy');
    setTimeout(() => {
      document.documentElement.classList.remove('egg-retro'); tag.remove(); busy = false;
      try { if (A.settings.get('track') === 'chip' && prevTrack !== 'chip') A.settings.set('track', prevTrack); } catch (e) {}
    }, 30000);
  }

  /* ------------------------------------------------------------ 3. Gravity */
  function gravity() {
    if (busy) return; busy = true;
    const els = Array.from(document.querySelectorAll('#os-home .wg, #os-home .os-day, #os-home .os-date, #os-home [data-wg], .dock > *, .win:not(.min)'))
      .filter((e, i, arr) => e.offsetParent && !arr.some((o) => o !== e && o.contains(e)));
    if (!els.length) { busy = false; return; }
    beep({ type: 'sine', freq: 600, to: 80, slide: 0.9, dur: 0.9, vol: 0.12 });
    A.ui.toast('Uh oh… gravity got turned on', 'zap');
    if (reduced()) { setTimeout(() => { busy = false; }, 500); return; }
    const H = innerHeight;
    const bodies = els.map((el) => { const r = el.getBoundingClientRect(); el.classList.add('egg-grav'); return { el, y: 0, vy: -2 - Math.random() * 4, x: 0, vx: (Math.random() - 0.5) * 6, r: 0, vr: (Math.random() - 0.5) * 8, floor: H - r.bottom - 6, bounces: 0 }; });
    let t0 = performance.now(), raf;
    const step = (t) => {
      bodies.forEach((b) => {
        b.vy += 0.9; b.y += b.vy; b.x += b.vx; b.r += b.vr;
        if (b.y > b.floor) { b.y = b.floor; b.vy *= -0.45; b.vx *= 0.8; b.vr *= 0.6; if (Math.abs(b.vy) > 2 && b.bounces++ < 4) beep({ type: 'triangle', freq: 120 + Math.random() * 80, dur: 0.06, vol: 0.05 }); }
        b.el.style.transform = 'translate(' + b.x + 'px,' + b.y + 'px) rotate(' + b.r + 'deg)';
      });
      if (t - t0 < 3600) raf = requestAnimationFrame(step);
      else {
        bodies.forEach((b) => { b.el.style.transition = 'transform 1.1s cubic-bezier(.3,1.4,.5,1)'; b.el.style.transform = ''; });
        beep({ type: 'sine', freq: 200, to: 900, slide: 0.8, dur: 0.8, vol: 0.1 });
        setTimeout(() => { bodies.forEach((b) => { b.el.style.transition = ''; b.el.classList.remove('egg-grav'); }); busy = false; }, 1200);
      }
    };
    raf = requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------ triggers */
  const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  let keys = [], typed = '';
  document.addEventListener('keydown', (e) => {
    const t = e.target, tag = (t && t.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag) || (t && t.isContentEditable) || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = (e.key || '').toLowerCase();
    keys.push(k); keys = keys.slice(-KONAMI.length);
    if (keys.join() === KONAMI.join()) { keys = []; retro(); return; }
    if (k.length === 1) {
      typed = (typed + k).slice(-8);
      if (/67$/.test(typed)) { typed = ''; sixSeven(); }
    }
  });
  let clicks = [];
  document.addEventListener('click', (e) => {
    if (!e.target.closest || !e.target.closest('#os-day, .os-day')) return;
    const now = Date.now(); clicks = clicks.filter((c) => now - c < 2000); clicks.push(now);
    if (clicks.length >= 5) { clicks = []; gravity(); }
  });

  window.NovaEggs = { sixSeven, retro, gravity };
})();
