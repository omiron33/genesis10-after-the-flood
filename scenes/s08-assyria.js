// s08-assyria: "From that land to Assyria he went / Built Nineveh, Rehoboth-Ir, Calah, cement / Then
// Resen, between Nineveh and Calah set / That's the great city, put it on the record".
// Night up the river: the camera travels north along the dark water toward Assyria, the first line
// burning in great torch-lit letters along the top of Nineveh's long wall ahead. It comes in over
// Nineveh's gate as its name is sung, glazed letters lit by the gate fires, then looks on up the
// plain to Rehoboth-Ir and Calah, each name standing on its gate, and Resen's between them. On the
// last line it rises over all four, one great city of lamps, and comes down over a vast clay tablet
// lying on the plain, the line pressed into its clay: put on the record.
import lyrics from '/timing.js';
import { track } from '/song/lib/cam.js';
import { worldScene, panels, inPanel, facing, onGround, fires, stones } from '/song/lib/world.js';
import { southGLSL, groundY, riverX, cities, gateFace } from '/song/lib/x-south.js';
import { CITIES } from '/song/lib/cities.js';
import { grade, FINISH } from '/song/lib/look.js';
import { inscribe, anchorAt } from '/song/lib/type.js';
export const kind = 'shader';

export default (P) => {
  const L = anchorAt(lyrics, P.from, 'From that land', 'Built Nineveh', 'Then Resen', "That's the great city").lines;
  const g = groundY;
  const [N, R, S, C] = CITIES.slice(4);
  const gateName = (c, w) => { const f = gateFace(c, { up: 4.6 }); return { c: f.c, ...facing(f.N), w, h: w * 0.2, depth: 1.2, kind: 'stand', mat: 'brick', tint: [0.96, 0.78, 0.36], glow: 0.18, rough: 0.4, spec: 0.3 }; };
  // the first line along the top of Nineveh's wall, west of its gate
  const fn = gateFace(N, { up: 2.0 }), Fn = facing(fn.N);
  const W0 = { c: [fn.c[0] + Fn.right[0] * -50, fn.c[1] + 1.0, fn.c[2] + Fn.right[2] * -50 - 14], ...Fn, w: 56, h: 7, depth: 1.4, kind: 'stand', mat: 'brick', tint: [0.96, 0.78, 0.36], glow: 0.18, rough: 0.4 };
  const names = [gateName(N, 70), gateName(R, 46), gateName(C, 60), gateName(S, 40)];
  // the clay tablet on the plain past Calah, the last line pressed into it, read looking north
  const TZ = C.z + 160, TX = C.x + 40, TY = g(TX, TZ);
  const tablet = { pos: [TX, TY + 1.0, TZ], yaw: 0.1, size: [26, 1.6, 17], seed: 5, color: [0.44, 0.3, 0.2], rough: 0.95 };
  const T = { c: [TX, TY + 2.6, TZ], ...onGround([Math.sin(0.1), 0, Math.cos(0.1)]), w: 46, h: 24, depth: 0.5, kind: 'cut', glow: 1.1, tint: [0.85, 0, 0] };
  const PN = panels([W0, ...names, T]);
  const torch = (c, s) => { const f = gateFace(c, { up: -c.h - 1.0 + 4.6 }); const F = facing(f.N); return [f.c[0] + F.right[0] * s + f.N[0] * 1.2, 6.5, f.c[2] + F.right[2] * s + f.N[2] * 1.2, 1.9]; };
  const fireList = [N, R, S, C].flatMap((c) => [torch(c, -4.2), torch(c, 4.2)]);
  // fires along Nineveh's wall under the first line
  for (let k = 0; k < 4; k++) fireList.push([W0.c[0] + Fn.right[0] * (-21 + k * 14), W0.c[1] - 4.2, W0.c[2] + Fn.right[2] * (-21 + k * 14) + fn.N[2] * 1.0, 2.2]);
  const rx = (z) => riverX(z);
  const keys = [
    { t: P.from, pos: [W0.c[0] + 30, 16, W0.c[2] - 260], look: [W0.c[0], W0.c[1], W0.c[2]] },
    { t: L[0].end, pos: [W0.c[0] + 45, 22, W0.c[2] - 140], look: [W0.c[0] + 10, W0.c[1], W0.c[2]] },
    { t: L[1].words[1].start + 0.3, pos: [names[0].c[0] + fn.N[0] * 90, 26, names[0].c[2] + fn.N[2] * 90], look: names[0].c },
    { t: L[1].words[2].start + 0.3, pos: [N.x - 40, 40, N.z + 30], look: [R.x, 10, R.z] },
    { t: L[1].words[3].start + 0.5, pos: [N.x - 10, 52, N.z + 100], look: [C.x, 10, C.z] },
    { t: L[2].start + 1.3, pos: [S.x - 30, 34, S.z - 130], look: [S.x, 10, S.z] },
    { t: L[3].start + 0.4, pos: [S.x - 20, 120, S.z - 60], look: [C.x, 0, C.z + 60] },
    { t: L[3].end - 0.6, pos: [TX - 6, TY + 46, TZ - 46], look: [TX, TY, TZ - 2] },
    { t: P.to, pos: [TX - 4, TY + 40, TZ - 36], look: [TX, TY, TZ + 4] },
  ];
  const cam = track(keys, { handheld: { amount: 0.6, seed: 99 }, fov: 46 });
  const sky = () => ({ uSunDir: [0.4, 0.45, 0.8], uSunCol: [0.42, 0.5, 0.75], uSkyTop: [0.008, 0.014, 0.04], uSkyHor: [0.06, 0.07, 0.12], uMoonDir: [0.4, 0.45, 0.8], uStars: 1.0, uCloud: 0.2, uCloudSpeed: 0.02, uMoon: 1.0, uFogCol: [0.04, 0.045, 0.07], uFogDen: 0.0008, uAmb: [0.05, 0.06, 0.1], uExposureSky: 1 });
  return worldScene(P, {
    name: 's08-assyria', cam, sky,
    world: southGLSL(),
    panels: PN,
    stones: stones([tablet]),
    fires: fires(fireList),
    water: [0, 0.02, 0.5, 1], waterTint: [0.01, 0.015, 0.02, 0.3],
    misc: [0.4, 0.3, 0, 0],
    uniforms: { uCity: cities(CITIES), uDusk: 1.0 },
    drawText(ctx, t) {
      inPanel(ctx, PN, 0, (c, b) => inscribe(c, t, [{ words: L[0].words }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 1000, valign: 'middle', font: 'block', caps: true, tint: [255, 255, 255] }));
      const ws = [[L[1].words[1]], [L[1].words[2]], [L[1].words[3], L[1].words[4]], [L[2].words[1]]];
      ws.forEach((w, k) => inPanel(ctx, PN, 1 + k, (c, b) => inscribe(c, t, [{ words: w }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 2000, valign: 'middle', font: 'block', caps: true, tracking: 0.04, tint: [255, 255, 255] })));
      inPanel(ctx, PN, 5, (c, b) => inscribe(c, t, [{ words: L[3].words.slice(0, 4) }, { words: L[3].words.slice(4) }], { x: 30, y: 0, w: b.w - 60, h: b.h }, { size: 1400, valign: 'middle', font: 'heavy', leading: 1.1, tint: [255, 200, 130] }));
    },
    post: () => grade({ exposure: 1.5, bloom: 0.16 }),
    finish: () => FINISH,
  });
};
