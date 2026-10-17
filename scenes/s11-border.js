// s11-border: "Then the clans of Canaan spread abroad / Border ran from Sidon, down toward Gerar / All
// the way to Gaza, then toward Sodom / Gomorrah, Admah, Zeboiim, as far as Lasha, got 'em / These are
// the sons of Ham, laid out plain / By their clans, their tongues, their lands, their nations' names".
// Afternoon on the coast of Canaan. From the shore at Sidon a border of white stones runs away inland
// across the hills toward the white basin of the Salt Sea far off, and as it is sung the line runs out
// ahead of the camera, and each place along it stands up in great pale letters, each further off and
// larger than the last, so the whole border reads down the line to the horizon. The camera walks the
// line, then rises over it on "laid out plain", the last line standing across the land far ahead.
import lyrics from '/timing.js';
import { track } from '/song/lib/cam.js';
import { worldScene, panels, inPanel, facing, onGround } from '/song/lib/world.js';
import { canaanGLSL, groundY, SALT } from '/song/lib/x-canaan.js';
import { grade, FINISH, clamp01 } from '/song/lib/look.js';
import { inscribe, anchorAt } from '/song/lib/type.js';
export const kind = 'shader';

export default (P) => {
  const L = anchorAt(lyrics, P.from, 'Then the clans', 'Border ran', 'All the way', 'Gomorrah', 'These are the sons of Ham', 'By their clans, their').lines;
  const g = groundY;
  const find = (l, re) => l.words.find((w) => re.test(w.w));
  const S0 = [-600, 250], S1 = [SALT[0] - 120, SALT[1] + 150];
  const len = Math.hypot(S1[0] - S0[0], S1[1] - S0[1]);
  const dir = [(S1[0] - S0[0]) / len, (S1[1] - S0[1]) / len], side = [-dir[1], dir[0]];
  // the line: gently wandering, vertices every 160 m
  const B = []; for (let i = 0; i < 8; i++) { const d = (i / 7) * len, w = 25 * Math.sin(i * 1.7); B.push([S0[0] + dir[0] * d + side[0] * w, S0[1] + dir[1] * d + side[1] * w, 0, 0]); }
  for (let i = 1; i < 8; i++) B[i][2] = B[i - 1][2] + Math.hypot(B[i][0] - B[i - 1][0], B[i][1] - B[i - 1][1]);
  const at = (d, off = 0) => { if (d < 0) return [S0[0] + dir[0] * d + side[0] * off, S0[1] + dir[1] * d + side[1] * off]; let i = 1; while (i < 7 && B[i][2] < d) i++; const k = clamp01((d - B[i - 1][2]) / (B[i][2] - B[i - 1][2])); return [B[i - 1][0] + (B[i][0] - B[i - 1][0]) * k + side[0] * off, B[i - 1][1] + (B[i][1] - B[i - 1][1]) * k + side[1] * off]; };
  const place = [['Sidon', 45, L[1]], ['Gerar', 120, L[1]], ['Gaza', 210, L[2]], ['Sodom', 330, L[2]], ['Gomorrah', 470, L[3]], ['Admah', 620, L[3]], ['Zeboiim', 790, L[3]], ['Lasha', 990, L[3]]].map(([n, d, l]) => ({ n, d, w: find(l, new RegExp(n)) }));
  // the line runs out to each place as its name is sung
  const drawn = (t) => { let prev = [L[1].start - 0.3, 0]; for (const p of place) { if (t < p.w.start) return prev[1] + (p.d - prev[1]) * clamp01((t - prev[0]) / (p.w.start - prev[0])); prev = [p.w.start, p.d]; } return Math.min(len, prev[1] + (t - prev[0]) * 60); };
  const camD = (t) => -62 + 11.5 * Math.max(0, t - P.from);
  const stand = (d, off, w, h, mat = 'chalk') => { const p = at(d, off); return { c: [p[0], g(p[0], p[1]) + h / 2 - 0.4, p[1]], ...facing([-dir[0], 0, -dir[1]]), w, h, depth: Math.max(0.8, h * 0.12), kind: 'stand', mat, tint: [0.93, 0.91, 0.85], rough: 0.7 }; };
  const sz = (d) => 4 + d * 0.075;
  // the last two lines laid flat across the land, read from above as the camera rises
  const flat = (d, w, h) => { const p = at(d, 0); return { c: [p[0], g(p[0], p[1]), p[1]], ...onGround([dir[0], 0, dir[1]]), w, h, depth: 14, kind: 'paint', glow: 0.2, rough: 0.8 }; };
  const D = [
    stand(-14, 0, 40, 5.5),                                                      // Then the clans of Canaan spread abroad
    ...place.map((p, k) => { const h = sz(p.d), w = h * p.n.length * 0.62; return stand(p.d, (k % 2 ? 1 : -1) * (w / 2 + 6 + p.d * 0.03), w, h); }),
    stand(26, 13, 16, 2.6), stand(84, -14, 16, 3.0), stand(168, 16, 26, 3.6), stand(272, -24, 30, 4.2), stand(1060, 140, 130, 12),
    { ...flat(330, 170, 34) }, { ...flat(470, 280, 64) },
  ];
  const PN = panels(D, { W: 8192, H: 4096 });
  const keys = [];
  for (let t = P.from; t <= L[4].start + 0.01; t += 1.5) { const d = camD(t), p = at(d, 4), q = at(Math.max(d + 60, Math.min(drawn(t) * 0.8, d + 400))); keys.push({ t, pos: [p[0], g(p[0], p[1]) + 6.5, p[1]], look: [q[0], g(q[0], q[1]) + 5, q[1]] }); }
  const up = (t, h, ahead) => { const d = camD(L[4].start) + 30, p = at(d, 0), q = at(d + ahead); return { t, pos: [p[0], g(p[0], p[1]) + h, p[1]], look: [q[0], g(q[0], q[1]) + 20, q[1]] }; };
  keys.push(up(L[4].start + 2.5, 90, 230), up(L[5].start + 1.0, 150, 300), up(P.to, 180, 330));
  const cam = track(keys, { handheld: { amount: 0.4, seed: 131 }, fov: 46 });
  const sky = () => ({ uSunDir: [0.3, 0.38, 0.85], uSunCol: [3.3, 2.5, 1.8], uSkyTop: [0.07, 0.19, 0.5], uSkyHor: [0.7, 0.68, 0.7], uMoonDir: [0, 1, 0], uStars: 0, uCloud: 0.45, uCloudSpeed: 0.03, uMoon: 0, uFogCol: [0.66, 0.67, 0.74], uFogDen: 0.00045, uAmb: [0.15, 0.16, 0.22], uExposureSky: 1 });
  const border = () => B.flat();
  return worldScene(P, {
    name: 's11-border', cam, sky,
    world: canaanGLSL(),
    panels: PN,
    water: [SALT[3] - 2.5, 0.05, 0.1, 1], waterTint: [0.04, 0.1, 0.11, 0.6],
    misc: [0, 0.4, 0, 0],
    uniforms: { uTerr: 1, uBorder: border(), uBorderLen: 0 },
    update(t, u) { u.uBorderLen.value = drawn(t); },
    drawText(ctx, t) {
      const ln = (k, ws, o = {}) => inPanel(ctx, PN, k, (c, b) => inscribe(c, t, ws.map((w) => ({ words: w })), { x: 20, y: 0, w: b.w - 40, h: b.h }, { size: 1600, valign: 'middle', font: 'block', caps: true, leading: 1.02, tint: [255, 255, 255], ...o }));
      ln(0, [L[0].words]);
      place.forEach((p, k) => ln(1 + k, [[p.w]], { font: 'caps', tracking: 0.04 }));
      const names = place.map((p) => p.w);
      const not = (l) => l.words.filter((w) => !names.includes(w));
      const r1 = not(L[1]), r2 = not(L[2]), r3 = not(L[3]);
      ln(9, [r1.slice(0, 3)]); ln(10, [r1.slice(3)]); ln(11, [r2.slice(0, 4)]); ln(12, [r2.slice(4)]); ln(13, [r3.slice(0, 3), r3.slice(3)]);
      ln(14, [L[4].words.slice(0, 5), L[4].words.slice(5)], { stroke: { color: 'rgb(40,22,14)', width: 0.18 } });
      ln(15, [L[5].words.slice(0, 6), L[5].words.slice(6)], { stroke: { color: 'rgb(40,22,14)', width: 0.18 } });
    },
    post: () => grade({ exposure: 0.95, bloom: 0.06 }),
    finish: () => FINISH,
  });
};
