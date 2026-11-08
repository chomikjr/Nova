/* Boot sequence: warp-speed lines, a flash, then the NOVA title and a loading bar.
   Adapted from NebulaHub by Abel (used with permission), rebranded for Nova. */
(function () {
  'use strict';
  const layer = document.getElementById('boot-layer');
  if (!layer) return;
  const fast = (() => { try { return JSON.parse(localStorage.getItem('nova.settings') || '{}').fastBoot; } catch (e) { return false; } })();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const done = () => {
    layer.style.opacity = '0';
    setTimeout(() => { layer.remove(); window.dispatchEvent(new CustomEvent('nova:booted')); }, 800);
  };
  window.NovaBootSkip = () => { if (layer.isConnected) { stop = true; done(); } };
  let stop = false;
  if (fast || reduced || location.hash) { layer.remove(); window.dispatchEvent(new CustomEvent('nova:booted')); return; }

  const canvas = document.getElementById('boot-canvas'), ctx = canvas.getContext('2d');
  const W = canvas.width = innerWidth, H = canvas.height = innerHeight, cx = W / 2, cy = H / 2;
  let phase = 0, phaseT = 0, flashAlpha = 0, titleShown = false, raf = 0;
  const lines = [];
  for (let i = 0; i < 220; i++) {
    lines.push({ angle: (Math.PI * 2 / 220) * i + (Math.random() - 0.5) * 0.04, speed: Math.random() * 3 + 1.5, len: Math.random() * 80 + 40, dist: Math.random() * 60 + 20, width: Math.random() * 1.2 + 0.2, bright: Math.random() * 0.4 + 0.1 });
  }
  const easeIn = (x) => x * x * x, easeOut = (x) => 1 - Math.pow(1 - x, 3), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const show = (id) => { const el = document.getElementById(id); if (el) el.classList.add('show'); };

  function draw() {
    if (stop) return;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, 0, W, H);
    let speed, alpha, stretch, p;
    if (phase === 0) {
      p = clamp(phaseT / 180, 0, 1); speed = easeIn(p) * 28 + 1; alpha = easeIn(p) * 0.9 + 0.05; stretch = easeIn(p) * 6 + 1;
      if (phaseT > 180) { phase = 1; phaseT = 0; }
    } else if (phase === 1) {
      p = clamp(phaseT / 25, 0, 1); speed = 60; alpha = 1; stretch = 12; flashAlpha = easeIn(p);
      if (phaseT > 25) { phase = 2; phaseT = 0; flashAlpha = 1; }
    } else if (phase === 2) {
      p = clamp(phaseT / 40, 0, 1); flashAlpha = 1 - easeOut(p); speed = 20 - p * 18; alpha = 1 - p * 0.8; stretch = 12 - p * 10;
      if (!titleShown && phaseT > 15) {
        titleShown = true; show('boot-title');
        setTimeout(() => show('boot-subtitle'), 400);
        setTimeout(() => show('boot-credit'), 700);
        setTimeout(() => { show('boot-bar-wrap'); show('boot-status-msg'); }, 900);
      }
      if (phaseT > 40) { phase = 3; phaseT = 0; }
    } else { speed = 1.5; alpha = 0.08; stretch = 1; flashAlpha = 0; }

    lines.forEach((l) => {
      l.dist += l.speed * (speed / 8);
      if (l.dist > Math.max(W, H) * 0.85) { l.dist = Math.random() * 30 + 5; l.len = Math.random() * 80 + 40; }
      const sx = cx + Math.cos(l.angle) * l.dist, sy = cy + Math.sin(l.angle) * l.dist;
      const ex = cx + Math.cos(l.angle) * (l.dist + l.len * stretch), ey = cy + Math.sin(l.angle) * (l.dist + l.len * stretch);
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey);
      ctx.strokeStyle = 'rgba(255,255,255,' + clamp(l.bright * alpha, 0, 1) + ')'; ctx.lineWidth = l.width; ctx.stroke();
    });
    if (phase < 2) {
      const ga = clamp((phaseT / 60) * 0.3, 0, 0.3), g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
      g.addColorStop(0, 'rgba(196,181,253,' + ga + ')'); g.addColorStop(1, 'rgba(196,181,253,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - 120, cy - 120, 240, 240);
    }
    if (flashAlpha > 0) { ctx.fillStyle = 'rgba(255,255,255,' + clamp(flashAlpha, 0, 1) + ')'; ctx.fillRect(0, 0, W, H); }
    phaseT++; raf = requestAnimationFrame(draw);
  }
  draw();

  const bar = document.getElementById('boot-bar'), status = document.getElementById('boot-status-msg');
  const msgs = ['INITIALIZING...', 'LOADING GAMES...', 'SYNCING DESKTOP...', 'CONNECTING ACCOUNT...', 'READY.'], at = [0, 20, 50, 75, 95];
  let progress = 0, msgIdx = 0;
  setTimeout(() => {
    const iv = setInterval(() => {
      if (stop) { clearInterval(iv); return; }
      progress = Math.min(100, progress + Math.random() * 2.4 + 0.6);
      bar.style.width = progress + '%';
      for (let m = at.length - 1; m >= 0; m--) {
        if (progress >= at[m] && msgIdx <= m) { status.style.opacity = '0'; setTimeout(() => { status.textContent = msgs[m]; status.style.opacity = '1'; }, 200); msgIdx = m + 1; break; }
      }
      if (progress >= 100) { clearInterval(iv); setTimeout(() => { cancelAnimationFrame(raf); done(); }, 500); }
    }, 90);
  }, 2800);
  addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === 'Escape') window.NovaBootSkip(); }, { once: true });
  layer.addEventListener('click', () => window.NovaBootSkip());
})();
