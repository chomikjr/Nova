/* ==========================================================================
   NOVA OS — live wallpapers (WebGL fragment shaders)
   Drawn by the GPU at the screen's own resolution, so they stay sharp at any
   size (4K included), loop forever and cost almost nothing to download.
   core.js turns each entry into a wallpaper preset. Uniforms: R (pixels), T (seconds), M (pointer 0..1).
   ========================================================================== */
(function () {
  'use strict';
  const COMMON = `
precision highp float;
uniform vec2 R; uniform float T; uniform vec2 M;
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 h22(vec2 p){ float n = h21(p); return vec2(n, h21(p + n)); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++){ v += a * noise(p); p = m * p + vec2(17.3, 9.1); a *= 0.5; } return v / 0.97; }
float fbm3(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 3; i++){ v += a * noise(p); p = m * p + vec2(17.3, 9.1); a *= 0.5; } return v / 0.875; }
// tiny per-pixel dither so soft gradients never band
vec3 dither(vec3 c){ return c + (h21(gl_FragCoord.xy + fract(T)) - 0.5) / 255.0; }
float stars(vec2 uv, float scale, float t){
  vec2 g = uv * scale, id = floor(g), f = fract(g) - 0.5;
  vec2 o = h22(id) - 0.5; float n = h21(id + 7.0);
  float d = length(f - o * 0.8);
  float tw = 0.6 + 0.4 * sin(t * (1.0 + n * 3.0) + n * 40.0);
  return step(0.86, n) * smoothstep(0.06, 0.0, d) * tw * (0.4 + n);
}
`;

  const SHADERS = {
    /* Flowing luminous ribbons through soft blue smoke */
    smoke: `
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * R) / R.y;
  uv += (M - 0.5) * 0.03;
  float t = T * 0.03;
  vec2 p = uv * 0.85;
  vec2 q = vec2(fbm3(p + vec2(0.0, t)), fbm3(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm3(p + 2.4 * q + vec2(1.7, 9.2) + t * 0.5), fbm3(p + 2.4 * q + vec2(8.3, 2.8) - t * 0.4));
  float f = fbm3(p + 2.1 * r);
  float fog = smoothstep(0.46, 0.82, f);
  float brk = smoothstep(0.38, 0.62, r.x);
  float rib = (exp(-pow((f - 0.53) * 55.0, 2.0)) + 0.65 * exp(-pow((f - 0.63) * 65.0, 2.0)) + 0.4 * exp(-pow((f - 0.44) * 70.0, 2.0))) * brk;
  vec3 col = vec3(0.008, 0.012, 0.024);
  col += vec3(0.40, 0.47, 0.62) * pow(fog, 1.8) * 0.65;
  col += vec3(0.75, 0.82, 0.95) * pow(fog, 5.0) * 0.4;
  col += vec3(0.28, 0.66, 1.0) * rib * 0.75;
  col += vec3(0.85, 0.95, 1.0) * pow(rib, 3.0) * 0.35;
  col *= 1.0 - 0.4 * dot(uv * 0.8, uv * 0.8);
  gl_FragColor = vec4(dither(max(col, 0.0)), 1.0);
}`,

    /* A tilted spiral of streaking stars */
    swirl: `
float layer(vec2 p, float n, float m, float spd, float seed){
  float r = length(p), a = atan(p.y, p.x);
  float sp = a + 2.2 * log(r + 0.001) - T * spd / (r + 0.3);
  vec2 g = vec2(sp / 6.2831853 * n, log(r + 0.001) * m + seed);
  vec2 id = floor(g), f = fract(g) - 0.5;
  float hsh = h21(id + seed);
  vec2 o = (h22(id + seed * 3.1) - 0.5) * vec2(0.2, 0.6);
  vec2 d = f - o;
  float s = exp(-(d.x * d.x * 2.2 + d.y * d.y * 700.0));
  return s * step(0.62, hsh) * (0.5 + hsh);
}
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * R) / R.y;
  uv += (M - 0.5) * 0.02;
  vec2 p = vec2(uv.x * 0.95, (uv.y + 0.08) * 2.2);
  float r = length(p), a = atan(p.y, p.x);
  float arms = pow(0.5 + 0.5 * cos(2.0 * (a - 2.2 * log(r + 0.001)) + T * 0.04), 3.0);
  float disc = smoothstep(1.2, 0.2, r) * smoothstep(0.03, 0.14, r);
  float s = layer(p, 70.0, 26.0, 0.09, 0.0) + layer(p, 110.0, 40.0, 0.11, 11.0) * 0.75 + layer(p, 45.0, 17.0, 0.07, 23.0) * 1.1;
  vec3 col = vec3(0.003, 0.003, 0.007);
  col += vec3(0.88, 0.9, 1.0) * s * disc * mix(0.15, 1.5, arms);
  col += vec3(0.5, 0.48, 0.7) * exp(-r * 6.0) * 0.28;
  col += stars(uv + 3.0, 70.0, T) * vec3(0.8, 0.82, 1.0) * 0.5;
  gl_FragColor = vec4(dither(col), 1.0);
}`,

    /* A pink moon behind slow drifting clouds */
    'pink-moon': `
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * R) / R.y;
  uv += (M - 0.5) * 0.015;
  float t = T * 0.015;
  vec3 col = mix(vec3(0.07, 0.02, 0.10), vec3(0.008, 0.004, 0.018), smoothstep(-0.5, 0.45, uv.y));
  col += stars(uv, 60.0, T) * vec3(1.0, 0.85, 1.0) * 0.85 + stars(uv + 9.0, 120.0, T * 1.3) * vec3(0.9, 0.8, 1.0) * 0.45;
  vec2 mc = vec2(-0.30, 0.10); float rad = 0.21;
  float d = length(uv - mc);
  float disk = smoothstep(rad, rad - 0.003, d);
  vec2 mp = (uv - mc) / rad;
  float limb = sqrt(max(0.0, 1.0 - dot(mp, mp)));
  float maria = fbm(mp * 1.8 + 3.0);
  vec3 moon = mix(vec3(1.0, 0.70, 0.95), vec3(0.88, 0.50, 0.84), smoothstep(0.4, 0.62, maria)) * (0.62 + 0.38 * limb);
  col += vec3(0.95, 0.30, 0.85) * exp(-max(d - rad, 0.0) * 11.0) * 0.5 + vec3(0.5, 0.15, 0.6) * exp(-max(d - rad, 0.0) * 3.0) * 0.18;
  col = mix(col, moon, disk);
  vec2 cp = uv * vec2(1.2, 2.6) + vec2(t * 2.0, 0.0);
  float c = fbm(cp + fbm3(cp * 0.7 - t) * 1.8);
  float shape = smoothstep(0.1, -0.22, uv.y + 0.1 * sin(uv.x * 2.3 + 1.0));
  float cover = smoothstep(0.4, 0.56, c) * shape;
  float lit = exp(-max(d - rad, 0.0) * 3.5);
  float rim = smoothstep(0.4, 0.47, c) * (1.0 - smoothstep(0.47, 0.6, c));
  vec3 cloud = vec3(0.016, 0.006, 0.024) + vec3(0.95, 0.35, 0.85) * lit * rim * 0.85 + vec3(0.12, 0.04, 0.14) * lit * 0.3;
  col = mix(col, cloud, cover * 0.98);
  col *= 1.0 - 0.35 * dot(uv, uv);
  gl_FragColor = vec4(dither(col), 1.0);
}`,

    /* Violet aurora over a dark ridge */
    'northern-lights': `
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * R) / R.y;
  uv += (M - 0.5) * 0.015;
  vec3 col = mix(vec3(0.025, 0.015, 0.06), vec3(0.004, 0.004, 0.016), smoothstep(-0.4, 0.5, uv.y));
  col += stars(uv, 80.0, T) * 0.7 + stars(uv + 4.0, 140.0, T) * 0.35;
  vec3 aur = vec3(0.0);
  for (int i = 0; i < 3; i++){
    float fi = float(i);
    float base = -0.02 + fi * 0.09 + 0.16 * (fbm3(vec2(uv.x * 0.9 + fi * 3.0, T * 0.03 + fi)) - 0.5);
    float dy = uv.y - base;
    float body = dy > 0.0 ? exp(-dy * (5.0 + fi * 2.0)) : exp(-dy * dy * 900.0);
    float rays = pow(noise(vec2(uv.x * 38.0 + fi * 17.0 + noise(vec2(uv.x * 3.0, T * 0.15)) * 6.0, T * 0.25 + fi)), 2.0);
    float fade = smoothstep(-0.95, -0.3, uv.x) * smoothstep(0.95, 0.35, uv.x + fi * 0.15);
    vec3 c = mix(vec3(0.25, 0.95, 0.80), vec3(0.62, 0.35, 1.0), clamp(dy * 4.0 + fi * 0.35, 0.0, 1.0));
    aur += c * body * (0.25 + 1.1 * rays) * fade * (0.55 - fi * 0.12);
  }
  col += aur;
  float ridge = -0.33 + 0.07 * fbm3(vec2(uv.x * 2.0, 1.0)) + 0.025 * noise(vec2(uv.x * 9.0, 2.0));
  col += vec3(0.2, 0.35, 0.4) * aur.g * 0.0;
  col = mix(col, vec3(0.006, 0.004, 0.012), smoothstep(ridge + 0.003, ridge - 0.003, uv.y));
  gl_FragColor = vec4(dither(col), 1.0);
}`,

    /* Slow violet nebula with drifting dust */
    'nebula-drift': `
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * R) / R.y;
  uv += (M - 0.5) * 0.03;
  float t = T * 0.02;
  vec2 q = vec2(fbm(uv * 1.2 + t), fbm(uv * 1.2 + vec2(3.1, 7.4) - t));
  float f = fbm(uv * 1.1 + 1.9 * q + vec2(0.0, t));
  float g = fbm(uv * 2.4 - 1.3 * q + vec2(t, 2.0));
  float band = exp(-pow((uv.y + uv.x * 0.4) * 2.2, 2.0));
  float gas = smoothstep(0.42, 0.74, f) * band;
  float dust = smoothstep(0.5, 0.68, g) * band;
  vec3 col = vec3(0.008, 0.005, 0.018);
  col += vec3(0.30, 0.14, 0.66) * gas * 0.9;
  col += vec3(0.74, 0.26, 0.70) * pow(gas, 2.4) * 0.6;
  col += vec3(0.98, 0.88, 1.0) * pow(gas, 6.0) * 0.4;
  col *= 1.0 - dust * 0.7;
  col += stars(uv, 90.0, T) * 0.75 + stars(uv + 2.0, 170.0, T) * 0.4;
  col *= 1.0 - 0.3 * dot(uv, uv);
  gl_FragColor = vec4(dither(col), 1.0);
}`
  };

  window.NOVA_SHADERS = { common: COMMON, list: SHADERS, names: { smoke: 'Smoke', swirl: 'Star Swirl', 'pink-moon': 'Pink Moon', 'northern-lights': 'Northern Lights', 'nebula-drift': 'Nebula Drift' } };
})();
