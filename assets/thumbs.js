/* Animated canvas covers for games without an image (NovaThumbs.start(canvas, kind)) */
(function () {
  'use strict';
  const A = window.Arcade;
    const THUMBS = {
      snake(c, w, h, t, s) {
        const n = 20, cs = w / n, rows = Math.floor(h / cs);
        if (!s.body) { s.body = [[6, 5], [5, 5], [4, 5], [3, 5], [2, 5]]; s.dir = [1, 0]; s.food = [14, 8]; s.acc = 0; }
        s.acc += s.dt;
        if (s.acc > 0.11) {
          s.acc = 0; const hd = s.body[0];
          const want = [Math.sign(s.food[0] - hd[0]), Math.sign(s.food[1] - hd[1])];
          if (want[0] && want[0] !== -s.dir[0]) s.dir = [want[0], 0]; else if (want[1] && want[1] !== -s.dir[1]) s.dir = [0, want[1]];
          const nh = [(hd[0] + s.dir[0] + n) % n, (hd[1] + s.dir[1] + rows) % rows];
          s.body.unshift(nh);
          if (nh[0] === s.food[0] && nh[1] === s.food[1]) { s.food = [(Math.random() * n) | 0, (Math.random() * rows) | 0]; if (s.body.length > 26) s.body.length = 6; } else s.body.pop();
        }
        c.fillStyle = '#07071a'; c.fillRect(0, 0, w, h);
        c.fillStyle = 'rgba(167,139,250,.06)'; for (let y = 0; y < rows; y++) for (let x = 0; x < n; x++) if ((x + y) % 2) c.fillRect(x * cs, y * cs, cs, cs);
        c.shadowColor = '#fb7185'; c.shadowBlur = 16; c.fillStyle = '#fb7185'; c.beginPath(); c.arc(s.food[0] * cs + cs / 2, s.food[1] * cs + cs / 2, cs * 0.32, 0, 7); c.fill();
        c.shadowColor = '#34d399'; c.lineCap = 'round';
        s.body.forEach((p, i) => {
          if (i && Math.abs(p[0] - s.body[i - 1][0]) + Math.abs(p[1] - s.body[i - 1][1]) > 1) return;
          const k = i / s.body.length; c.fillStyle = 'hsl(' + (150 + k * 45) + ',95%,' + (62 - k * 18) + '%)';
          c.shadowBlur = i ? 0 : 14; c.beginPath(); c.arc(p[0] * cs + cs / 2, p[1] * cs + cs / 2, cs * (i ? 0.42 - k * 0.12 : 0.48), 0, 7); c.fill();
          if (i) { const q = s.body[i - 1]; c.strokeStyle = c.fillStyle; c.lineWidth = cs * (0.8 - k * 0.24); c.beginPath(); c.moveTo(p[0] * cs + cs / 2, p[1] * cs + cs / 2); c.lineTo(q[0] * cs + cs / 2, q[1] * cs + cs / 2); c.stroke(); }
        });
        c.shadowBlur = 0;
      },
      blocks(c, w, h, t, s) {
        const cs = h / 12, cols = Math.floor(w / cs);
        if (!s.pieces) s.pieces = Array.from({ length: 7 }, (_, i) => ({ x: (i * 3) % cols, y: -Math.random() * 12, hue: [190, 280, 50, 330, 140, 20, 220][i], sh: i % 4, sp: 2 + Math.random() * 2 }));
        c.fillStyle = '#07071a'; c.fillRect(0, 0, w, h);
        const SH = [[[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [2, 0], [1, 1]], [[0, 0], [0, 1], [1, 1], [2, 1]]];
        for (let y = 9; y < 12; y++) for (let x = 0; x < cols; x++) if ((x * 7 + y * 3) % 5) block(c, x * cs, y * cs, cs, 'hsl(' + ((x * 30 + y * 50) % 360) + ',80%,55%)', 0.45);
        s.pieces.forEach((p) => {
          p.y += p.sp * s.dt; if (p.y > 9) { p.y = -3; p.x = (Math.random() * (cols - 3)) | 0; }
          SH[p.sh].forEach(([dx, dy]) => block(c, (p.x + dx) * cs, (Math.floor(p.y) + dy) * cs, cs, 'hsl(' + p.hue + ',90%,60%)', 1));
        });
      },
      void(c, w, h, t, s) {
        if (!s.rocks) { s.rocks = Array.from({ length: 7 }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * 40, vy: (Math.random() - .5) * 40, r: 14 + Math.random() * 26, a: Math.random() * 6, pts: Array.from({ length: 9 }, () => 0.7 + Math.random() * 0.3) })); s.shots = []; s.cd = 0; }
        c.fillStyle = 'rgba(7,7,26,1)'; c.fillRect(0, 0, w, h);
        for (let i = 0; i < 60; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.2 + (i % 5) / 8) + ')'; c.fillRect((i * 97) % w, (i * 53) % h, 1.5, 1.5); }
        c.lineWidth = 2; c.strokeStyle = '#c4b5fd'; c.shadowColor = '#8b5cf6'; c.shadowBlur = 10;
        s.rocks.forEach((r) => {
          r.x = (r.x + r.vx * s.dt + w) % w; r.y = (r.y + r.vy * s.dt + h) % h; r.a += s.dt * 0.4;
          c.beginPath(); r.pts.forEach((k, i) => { const a = r.a + i / r.pts.length * Math.PI * 2; c.lineTo(r.x + Math.cos(a) * r.r * k, r.y + Math.sin(a) * r.r * k); }); c.closePath(); c.stroke();
        });
        const sa = t * 0.8, sx = w / 2, sy = h / 2;
        s.cd -= s.dt; if (s.cd < 0) { s.cd = 0.25; s.shots.push({ x: sx, y: sy, vx: Math.cos(sa) * 300, vy: Math.sin(sa) * 300, l: 1 }); }
        c.strokeStyle = '#f472b6'; c.shadowColor = '#f43f5e';
        s.shots = s.shots.filter((p) => (p.l -= s.dt) > 0); s.shots.forEach((p) => { p.x += p.vx * s.dt; p.y += p.vy * s.dt; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); c.stroke(); });
        c.strokeStyle = '#fff'; c.save(); c.translate(sx, sy); c.rotate(sa); c.beginPath(); c.moveTo(16, 0); c.lineTo(-10, -10); c.lineTo(-5, 0); c.lineTo(-10, 10); c.closePath(); c.stroke(); c.restore();
        c.shadowBlur = 0;
      },
      pong(c, w, h, t, s) {
        if (!s.b) s.b = { x: w / 2, y: h / 2, vx: 260, vy: 170 };
        const b = s.b; b.x += b.vx * s.dt; b.y += b.vy * s.dt;
        if (b.y < 10 || b.y > h - 10) b.vy *= -1;
        if (b.x < 30 || b.x > w - 30) b.vx *= -1;
        c.fillStyle = '#07071a'; c.fillRect(0, 0, w, h);
        c.setLineDash([8, 10]); c.strokeStyle = 'rgba(255,255,255,.15)'; c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.stroke(); c.setLineDash([]);
        c.shadowBlur = 18; c.shadowColor = '#22d3ee'; c.fillStyle = '#67e8f9'; c.fillRect(16, Math.max(10, Math.min(h - 80, b.y - 35)), 10, 70);
        c.shadowColor = '#f43f5e'; c.fillStyle = '#fb7185'; c.fillRect(w - 26, Math.max(10, Math.min(h - 80, b.y - 35 + Math.sin(t * 3) * 20)), 10, 70);
        c.shadowColor = '#fff'; c.fillStyle = '#fff'; c.beginPath(); c.arc(b.x, b.y, 8, 0, 7); c.fill(); c.shadowBlur = 0;
        c.font = '48px "Russo One"'; c.fillStyle = 'rgba(255,255,255,.12)'; c.textAlign = 'center'; c.fillText('3', w * 0.3, 70); c.fillText('2', w * 0.7, 70);
      },
      bricks(c, w, h, t, s) {
        c.fillStyle = '#07071a'; c.fillRect(0, 0, w, h);
        const cols = 9, bw = w / cols;
        for (let y = 0; y < 5; y++) for (let x = 0; x < cols; x++) if ((x + y + Math.floor(t)) % 7) block(c, x * bw + 3, 24 + y * 24, bw - 6, 'hsl(' + (y * 30 + 10) + ',90%,58%)', 1, 18);
        const bx = w / 2 + Math.sin(t * 1.7) * w * 0.35, by = h * 0.62 + Math.cos(t * 2.3) * h * 0.18;
        c.shadowBlur = 16; c.shadowColor = '#fbbf24'; c.fillStyle = '#fde68a'; c.beginPath(); c.arc(bx, by, 7, 0, 7); c.fill();
        c.shadowColor = '#a78bfa'; c.fillStyle = '#a78bfa'; c.fillRect(bx - 45, h - 26, 90, 10); c.shadowBlur = 0;
      },
      trex(c, w, h, t, s) {
        if (!s.cacti) { s.cacti = [w * 0.6, w * 1.1]; s.y = 0; s.vy = 0; s.x0 = 0; }
        c.fillStyle = '#f7f7f7'; c.fillRect(0, 0, w, h);
        const gy = h * 0.72, sp = 260 * s.dt; s.x0 = (s.x0 + sp) % 40;
        c.fillStyle = '#535353'; c.fillRect(0, gy, w, 2);
        for (let x = -s.x0; x < w; x += 40) c.fillRect(x, gy + 8 + (x * 7 % 9), 6, 2);
        s.cacti = s.cacti.map((x) => (x - sp < -30 ? w + Math.random() * 200 : x - sp));
        const near = s.cacti.some((x) => x > 70 && x < 150);
        if (near && s.y === 0) s.vy = 520; s.vy -= 1500 * s.dt; s.y = Math.max(0, s.y + s.vy * s.dt); if (s.y === 0) s.vy = 0;
        s.cacti.forEach((x) => { c.fillRect(x, gy - 46, 14, 46); c.fillRect(x - 10, gy - 34, 10, 6); c.fillRect(x - 10, gy - 40, 5, 12); c.fillRect(x + 14, gy - 30, 10, 6); c.fillRect(x + 19, gy - 38, 5, 12); });
        const dx = 80, dy = gy - 44 - s.y, leg = Math.floor(t * 10) % 2;
        c.fillRect(dx + 20, dy, 26, 18); c.fillRect(dx, dy + 14, 34, 20); c.fillRect(dx + 30, dy + 18, 8, 4); c.fillRect(dx - 8, dy + 16, 10, 8);
        c.fillRect(dx + 6 + (s.y ? 0 : leg * 10), dy + 34, 6, 10); c.fillRect(dx + 20 - (s.y ? 0 : leg * 10), dy + 34, 6, 10);
        c.fillStyle = '#fff'; c.fillRect(dx + 26, dy + 4, 4, 4);
        c.fillStyle = '#535353'; c.font = '20px monospace'; c.textAlign = 'right'; c.fillText('HI ' + String(Math.floor(t * 10) % 100000).padStart(5, '0'), w - 20, 34);
      },
      maze(c, w, h, t, s) {
        const n = 13, cs = Math.min(w, h) / n * 1.4;
        if (!s.m) { const r = (a) => Math.floor(Math.random() * a); s.m = Array.from({ length: 20 * 13 }, () => r(3) === 0); }
        c.fillStyle = '#050505'; c.fillRect(0, 0, w, h);
        const bx = w / 2 + Math.sin(t * 0.8) * w * 0.15, by = h / 2 + Math.cos(t * 0.6) * h * 0.15;
        c.save(); c.translate(w / 2, h / 2); c.rotate(-0.35); c.translate(-w / 2, -h / 2);
        for (let y = -3; y < 13; y++) for (let x = -3; x < 20; x++) {
          if (!s.m[((y + 13) % 13) * 20 + ((x + 20) % 20)]) continue;
          const px = x * cs - (t * 18) % cs, py = y * cs * 0.75, d = Math.hypot(px + cs / 2 - bx, py + cs / 2 - by);
          const a = Math.max(0, 1 - d / (w * 0.42));
          c.fillStyle = 'rgba(' + Math.round(120 * a + 20) + ',' + Math.round(100 * a + 15) + ',' + Math.round(60 * a + 10) + ',1)';
          c.fillRect(px, py, cs - 3, cs * 0.75 - 3);
        }
        c.restore();
        const g = c.createRadialGradient(bx, by, 2, bx, by, 60); g.addColorStop(0, 'rgba(255,220,120,.9)'); g.addColorStop(1, 'rgba(255,200,80,0)');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.fillStyle = '#ffe9a8'; c.beginPath(); c.arc(bx, by, 11, 0, 7); c.fill();
      },
      darkroom(c, w, h, t, s) {
        c.fillStyle = '#111'; c.fillRect(0, 0, w, h);
        const lines = ['the fire is dead.', 'the room is freezing.', 'the fire is burning.', 'a stranger stumbles through the door.', 'the room is warm.'];
        const show = Math.min(lines.length, 1 + Math.floor((t % 14) / 2.4));
        c.font = '17px Georgia, serif'; c.textAlign = 'left';
        for (let i = 0; i < show; i++) { c.globalAlpha = i === show - 1 ? Math.min(1, ((t % 14) % 2.4) * 1.5) : 0.75 - (show - 1 - i) * 0.12; c.fillStyle = '#ddd'; c.fillText(lines[i], 40, 60 + i * 30); }
        c.globalAlpha = 1;
        const lit = show >= 3, fx = w * 0.72, fy = h * 0.66;
        c.strokeStyle = '#999'; c.lineWidth = 1.5; c.strokeRect(fx - 60, fy + 10, 120, 34); c.fillStyle = '#ccc'; c.font = '15px Georgia'; c.textAlign = 'center'; c.fillText(lit ? 'stoke fire' : 'light fire', fx, fy + 32);
        if (lit) { for (let i = 0; i < 18; i++) { const a = (t * 2 + i) % 1; c.fillStyle = 'rgba(255,' + Math.round(140 + 80 * a) + ',60,' + (1 - a) * 0.8 + ')'; c.beginPath(); c.arc(fx - 30 + (i * 37 % 60) + Math.sin(t * 4 + i) * 4, fy - a * 70, 6 * (1 - a) + 1, 0, 7); c.fill(); } }
      },
      default(c, w, h) { c.fillStyle = '#07071a'; c.fillRect(0, 0, w, h); }
    };
    function block(c, x, y, s, col, a, hh) { c.globalAlpha = a; c.fillStyle = col; c.fillRect(x + 1, y + 1, s - 2, (hh || s) - 2); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x + 1, y + 1, s - 2, 3); c.globalAlpha = 1; }

    function start(canvas, kind, hue) {
      const ctx = canvas.getContext('2d'), fn = THUMBS[kind] || THUMBS.default, s = {};
      let raf = 0, last = 0, t = Math.random() * 10, visible = false, alive = true;
      const draw = (now) => {
        if (!alive) return;
        s.dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now; t += s.dt;
        fn(ctx, canvas.width, canvas.height, t, s);
        if (visible && !A.settings.reducedMotion()) raf = requestAnimationFrame(draw); else last = 0;
      };
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); } });
      io.observe(canvas);
      draw(performance.now());
      return { stop() { alive = false; cancelAnimationFrame(raf); io.disconnect(); } };
    }

  window.NovaThumbs = { THUMBS, start };
})();
