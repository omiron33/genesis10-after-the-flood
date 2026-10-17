// s05-ham: "Sons of Ham: Cush, Mizraim, Put, Canaan / Four-man lineup, now the bassline's rainin' /
// Cush had Seba, Havilah, Sabtah / Raamah, Sabteca, five sons, stack 'em up / Raamah had two: Sheba and
// Dedan".
// Afternoon in the hot country east of the great river: open sand, dunes, a hard white sky. SONS OF
// HAM stands in sandstone letters on the sand, and the four sons line up beside it in great
// sandstone names, rising out of the dune as each is sung while the camera tracks along the line.
// The second line is pressed into the dune's face below them. Then the camera comes down to a stone
// base cut with "Cush had", and his five sons' blocks come down out of the sky one on another as
// they are sung, each landing heavily on the last: stacked up. Raamah's two sons are two more blocks
// set down on the sand beside the stack.
import lyrics from '/timing.js';
import { track } from '/song/lib/cam.js';
import { worldScene, panels, inPanel, stones, stoneFace, facing, onGround, placePanel } from '/song/lib/world.js';
import { southGLSL, groundY, riverX } from '/song/lib/x-south.js';
import { grade, FINISH, clamp01 } from '/song/lib/look.js';
import { inscribe, anchorAt } from '/song/lib/type.js';
import { weight } from '/kit/motion.js';
export const kind = 'shader';

export default (P) => {
  const L = anchorAt(lyrics, P.from, 'Sons of Ham', 'Four-man lineup', 'Cush had Seba', 'Raamah, Sabteca', 'Raamah had two').lines;
  const g = groundY;
  const X0 = riverX(0) + 980, Z0 = 0;
  // the line of names along the sand, read by a camera looking +x (right is +z)
  const sand = [0.72, 0.52, 0.32];
  const stand = (z, w, h, dx = 0) => { const x = X0 + dx; return { c: [x, Math.max(g(x, z - w / 3), g(x, z), g(x, z + w / 3)) + h / 2 - 0.15, z], ...facing([-1, 0, 0]), w, h, depth: 1.4, kind: 'stand', mat: 'stone', tint: [0.075, 0.07, 0.065], rough: 0.35, spec: 0.3 }; };
  const SH = stand(-34, 16, 3.4, 4);
  const NM = [[-14, 10], [2, 14], [17, 8], [32, 14]].map(([z, w]) => stand(z, w, 5.2));
  const zl1 = 2, xl1 = X0 - 12;
  const P1 = { c: [xl1, g(xl1, zl1), zl1], ...onGround([1, 0, 0]), w: 30, h: 4.2, depth: 0.6, kind: 'cut', glow: 0.0, tint: [0.85, 0, 0] };
  // the stack: a base cut with "Cush had" and five blocks landing one on another
  const SX = X0 - 40, SZ = 60, base = g(SX, SZ);
  const bw = [2.4, 2.1, 2.2, 2.0, 2.1, 1.9], bh = [0.8, 0.62, 0.62, 0.62, 0.62, 0.62];
  let y = base - 0.25;
  const levels = bh.map((h) => { const c = y + h; y += 2 * h; return c; });
  const yawS = -Math.PI / 2 + 0.05;
  const land = [null, ...L[2].words.slice(2), ...L[3].words.slice(0, 2)].map((w) => (w ? w.start : 0));
  const blockAt = (k, t) => {
    const drop = k === 0 ? 0 : 1 - weight.heavy(clamp01((t - (land[k] - 0.45)) / 0.45));
    return { pos: [SX + 0.08 * Math.sin(k * 2.1), levels[k] + drop * 26, SZ + 0.1 * Math.cos(k * 1.7)], yaw: yawS + 0.06 * Math.sin(k * 3.3), size: [bw[k], bh[k], 1.1], seed: 40 + k, color: [0.62, 0.46, 0.3], rough: 0.85 };
  };
  // Raamah's two, set down on the sand beside the stack
  const sheba = L[4].words.find((w) => /Sheba/.test(w.w)), dedan = L[4].words.find((w) => /Dedan/.test(w.w));
  const twoAt = (k, t) => {
    const w = k === 0 ? sheba : dedan;
    const drop = 1 - weight.heavy(clamp01((t - (w.start - 0.4)) / 0.4));
    const z = SZ + 8 + k * 6.5, x = SX + 1.5;
    return { pos: [x, g(x, z) + 0.55 + drop * 18, z], yaw: yawS - 0.15, size: [1.8, 0.75, 1.0], seed: 60 + k, color: [0.62, 0.46, 0.3], rough: 0.85 };
  };
  const blocks = (t) => [...[0, 1, 2, 3, 4, 5].map((k) => blockAt(k, t)), twoAt(0, t), twoAt(1, t)];
  const faceP = (s, h) => { const f = stoneFace(s, { out: -0.015 }); return { c: f.c, right: f.right, up: f.up, w: s.size[0] * 1.8, h, depth: 0.1, kind: 'relief', mat: 'stone', tint: [0.86, 0.72, 0.52], rough: 0.7 }; };
  const B0 = blocks(P.from);
  const faces = B0.map((s, k) => faceP(s, k === 0 ? 1.2 : 0.95));
  const zt = SZ + 2.2, xt = SX - 5;
  const P3 = { c: [xt, g(xt, zt), zt], ...onGround([1, 0, 0.25]), w: 8, h: 1.3, depth: 0.5, kind: 'cut', glow: 0.0, tint: [0.85, 0, 0] };
  const zr = SZ + 11, xr = SX - 3.5;
  const P4 = { c: [xr, g(xr, zr), zr], ...onGround([1, 0, 0.2]), w: 9, h: 1.4, depth: 0.5, kind: 'cut', glow: 0.0, tint: [0.85, 0, 0] };
  const PN = panels([SH, ...NM, P1, ...faces, P3, P4]);

  const word = (l, i) => l.words[i];
  const keys = [
    { t: P.from, pos: [X0 - 20, g(X0 - 20, -44) + 2.8, -44], look: [SH.c[0], SH.c[1], SH.c[2]] },
    { t: word(L[0], 3).start, pos: [X0 - 19, g(X0 - 19, -18) + 2.8, -18], look: [NM[0].c[0], NM[0].c[1], NM[0].c[2]] },
    { t: word(L[0], 5).start + 0.2, pos: [X0 - 20, g(X0 - 20, 14) + 3.0, 14], look: [NM[2].c[0], NM[2].c[1], NM[2].c[2]] },
    { t: L[1].start + 1.0, pos: [X0 - 26, g(X0 - 26, 6) + 7, 3], look: [xl1 + 1, g(xl1, zl1) + 0.5, zl1] },
    { t: L[2].start + 0.5, pos: [SX - 13, base + 3.0, SZ - 10], look: [SX, levels[0] + 0.5, SZ] },
    { t: L[3].start + 0.8, pos: [SX - 12, base + 5.0, SZ - 6], look: [SX, levels[3], SZ] },
    { t: L[3].end, pos: [SX - 11, base + 6.5, SZ - 2], look: [SX, levels[5] - 0.5, SZ + 1] },
    { t: L[4].start + 1.2, pos: [SX - 11, base + 4.0, SZ + 5], look: [SX + 1, base + 1.0, SZ + 10] },
    { t: P.to, pos: [SX - 10, base + 4.5, SZ + 12], look: [SX + 2, base + 0.8, SZ + 13] },
  ];
  const cam = track(keys, { handheld: { amount: 0.6, seed: 66 }, fov: 50 });
  const sky = () => ({ uSunDir: [-0.62, 0.2, 0.55], uSunCol: [3.3, 2.1, 1.2], uSkyTop: [0.06, 0.16, 0.42], uSkyHor: [0.85, 0.62, 0.48], uMoonDir: [0, 1, 0], uStars: 0, uCloud: 0.15, uCloudSpeed: 0.02, uMoon: 0, uFogCol: [0.8, 0.7, 0.56], uFogDen: 0.0007, uAmb: [0.18, 0.16, 0.16], uExposureSky: 1 });
  return worldScene(P, {
    name: 's05-ham', cam, sky,
    world: southGLSL(),
    panels: PN,
    stones: stones(B0),
    misc: [0, 0.6, 0, 0],
    uniforms: { uCity: new Array(64).fill(0), uDusk: 0 },
    update(t, u) {
      const B = blocks(t);
      u.uStone.value = stones(B);
      B.forEach((s, k) => placePanel(u.uP.value, 6 + k, faceP(s, 1)));
    },
    drawText(ctx, t) {
      inPanel(ctx, PN, 0, (c, b) => inscribe(c, t, [{ words: L[0].words.slice(0, 3) }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 1600, valign: 'middle', font: 'caps', caps: true, tracking: 0.05, tint: [255, 255, 255] }));
      [3, 4, 5, 6].forEach((i, k) => inPanel(ctx, PN, 1 + k, (c, b) => inscribe(c, t, [{ words: [L[0].words[i]] }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 2400, valign: 'middle', font: 'block', caps: true, tint: [255, 255, 255] })));
      inPanel(ctx, PN, 5, (c, b) => inscribe(c, t, [{ words: L[1].words }], { x: 20, y: 0, w: b.w - 40, h: b.h }, { size: 900, valign: 'middle', font: 'heavy', tint: [255, 255, 255] }));
      const blockWords = [L[2].words.slice(0, 2), [L[2].words[2]], [L[2].words[3]], [L[2].words[4]], [L[3].words[0]], [L[3].words[1]], [sheba], [dedan]];
      blockWords.forEach((ws, k) => inPanel(ctx, PN, 6 + k, (c, b) => inscribe(c, t, [{ words: ws }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 700, valign: 'middle', font: 'caps', caps: true, tracking: 0.04, tint: [255, 255, 255] })));
      inPanel(ctx, PN, 14, (c, b) => inscribe(c, t, [{ words: L[3].words.slice(2) }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 600, valign: 'middle', font: 'heavy', tint: [255, 255, 255] }));
      inPanel(ctx, PN, 15, (c, b) => inscribe(c, t, [{ words: L[4].words.filter((w) => w !== sheba && w !== dedan) }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 600, valign: 'middle', font: 'heavy', tint: [255, 255, 255] }));
    },
    post: () => grade({ exposure: 0.82, bloom: 0.06 }),
    finish: () => FINISH,
  });
};
