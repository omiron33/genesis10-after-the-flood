// s14-peleg: "Peleg, 'cause in his days the earth got divided, man / His brother was Joktan, thirteen
// deep / Almodad, Sheleph, Hazarmaveth, Jerah, beat / Hadoram, Uzal, Diklah, run it / Obal, Abimael,
// Sheba, keep it comin' / Ophir, Havilah, Jobab, that's the crew / All the sons of Joktan, every name
// came through".
// Night on the plateau at the head of Shem's stair, under the moon. PELEG is cut huge in the rock where
// the path divides, and as "divided" is sung the earth splits along the line between the two ways: a
// chasm tears open through the middle of the name and the halves of the plateau stand apart (the one
// violent moment of the film, a short jolt of the camera). Then Joktan's way runs on east across the
// plateau, and his thirteen sons stand along it as thirteen stones, each lit by its own fire as its
// name is sung; the camera runs the line of fires and lifts at the end to see it whole.
import lyrics from '/timing.js';
import { track } from '/song/lib/cam.js';
import { worldScene, panels, inPanel, facing, onGround, stones, stoneFace, fires } from '/song/lib/world.js';
import { eastGLSL, groundY, STAIR, TOP } from '/song/lib/x-east.js';
import { grade, FINISH, clamp01 } from '/song/lib/look.js';
import { inscribe, anchorAt } from '/song/lib/type.js';
import { weight } from '/kit/motion.js';
export const kind = 'shader';

export default (P) => {
  const L = anchorAt(lyrics, P.from, 'Peleg', 'His brother was Joktan', 'Almodad', 'Hadoram', 'Obal', 'Ophir', 'All the sons of Joktan').lines;
  const divided = L[0].words.find((w) => /divided/.test(w.w));
  const split = (t) => 16 * weight.heavy(clamp01((t - divided.start + 0.05) / 0.9));
  const g = (x, z) => groundY(x, z);
  const ZP = STAIR.z1 + 70;
  // PELEG and the rest of the line cut into the plateau across the line of the split
  const PG = { c: [0, TOP, ZP], ...onGround([0, 0, 1]), w: 40, h: 22, depth: 3.0, kind: 'cut', glow: 1.3, tint: [0.8, 0, 0] };
  // Joktan's way: east from the split, his brother line standing at its start
  const X0 = 40, ZJ = ZP + 30;
  const J1 = { c: [X0 - 6, g(X0 - 6, ZJ) + 2.2, ZJ], ...facing([-1, 0, -0.2]), w: 22, h: 3.6, depth: 0.5, kind: 'stand', mat: 'chalk', tint: [0.9, 0.88, 0.82], glow: 0.08 };
  // thirteen stones along the way, alternating sides, each name lit by its fire
  const names = [...L[2].words.slice(0, 4), ...L[3].words.slice(0, 3), ...L[4].words.slice(0, 3), ...L[5].words.slice(0, 3)];
  const tails = { 3: L[2].words.slice(4), 6: L[3].words.slice(3), 9: L[4].words.slice(3), 12: L[5].words.slice(3) };
  const sx = (i) => X0 + 16 + i * 10, sz = (i) => ZJ + (i % 2 ? 7 : -7) + 2 * Math.sin(i * 1.3);
  const SS = names.map((w, i) => { const x = sx(i), z = sz(i), h = 1.9 + 0.3 * Math.sin(i * 2.1); return { pos: [x, g(x, z) + h - 0.4, z], yaw: -Math.PI / 2 + (i % 2 ? -0.35 : 0.35), size: [0.95, h, 0.4], seed: 70 + i, color: [0.2, 0.19, 0.18], rough: 0.8 }; });
  const NP = SS.map((s, i) => { const f = stoneFace(s, { lift: 0.55, out: -0.015 }); return { c: f.c, right: f.right, up: f.up, w: 1.75, h: tails[i] ? 1.2 : 0.75, depth: 0.09, kind: 'relief', mat: 'chalk', tint: [0.92, 0.9, 0.84], glow: 0.2 }; });
  const xe = sx(12) + 26;
  const J6 = { c: [xe, g(xe, ZJ), ZJ], ...onGround([1, 0, 0]), w: 30, h: 9, depth: 1.5, kind: 'cut', glow: 1.3, tint: [0.8, 0, 0] };
  const PN = panels([PG, J1, ...NP, J6]);
  // a fire before each stone, lit when its name is sung
  const fireAt = (i, t) => { const s = SS[i], f = stoneFace(s, { out: 1.1 }); const lit = clamp01((t - names[i].start + 0.25) / 0.35); return [f.c[0], g(f.c[0], f.c[2]) + 0.2, f.c[2], 1.7 * lit + 1e-4 * (lit > 0)]; };
  const fl = (t) => names.slice(0, 16).map((_, i) => fireAt(i, t));
  // the camera: up from the stair head to PELEG, a jolt on the split, then along the fires
  const keys = [
    { t: P.from, pos: [0, TOP + 9, STAIR.z1 + 8], look: [0, TOP, ZP] },
    { t: divided.start, pos: [-3, TOP + 18, ZP - 28], look: [0, TOP, ZP + 2] },
    { t: L[1].start + 0.4, pos: [10, TOP + 14, ZP - 14], look: [X0, TOP, ZJ] },
    { t: L[1].end, pos: [X0 - 22, g(X0 - 22, ZJ) + 4, ZJ - 2], look: [X0 + 10, g(X0, ZJ) + 2, ZJ] },
  ];
  names.forEach((w, i) => { if (i % 2) return; keys.push({ t: w.start + 0.25, pos: [sx(i) - 8, g(sx(i) - 8, ZJ) + 2.2, ZJ + 0.5 * Math.sin(i)], look: [sx(i) + 3, g(sx(i), ZJ) + 1.3, ZJ] }); });
  keys.push({ t: L[6].start + 1.0, pos: [xe - 20, g(xe, ZJ) + 13, ZJ], look: [xe - 1, g(xe, ZJ), ZJ] });
  keys.push({ t: P.to, pos: [xe - 17, g(xe, ZJ) + 13.5, ZJ + 0.5], look: [xe + 1, g(xe, ZJ), ZJ] });
  const base = track(keys, { handheld: { amount: 0.6, seed: 161 }, fov: 50 });
  // the jolt: a short, damped shake as the earth splits
  const cam = (t) => {
    const c = base(t), k = t - divided.start;
    if (k > 0 && k < 1.0) { const a = 0.35 * Math.exp(-k * 4.5); c.pos = [c.pos[0] + a * Math.sin(k * 61), c.pos[1] + a * 0.8 * Math.sin(k * 47 + 1), c.pos[2] + a * 0.5 * Math.sin(k * 53 + 2)]; c.roll = (c.roll ?? 0) + 0.012 * Math.exp(-k * 4.5) * Math.sin(k * 39); }
    return c;
  };
  cam.speed = base.speed;
  const sky = (t) => ({ uSunDir: [0.35, 0.42, 0.84], uSunCol: [0.46, 0.54, 0.8], uSkyTop: [0.008, 0.014, 0.04], uSkyHor: [0.05 + 0.2 * clamp01((t - P.to + 6) / 6), 0.06 + 0.08 * clamp01((t - P.to + 6) / 6), 0.11], uMoonDir: [0.35, 0.42, 0.84], uStars: 1.0, uCloud: 0.25, uCloudSpeed: 0.02, uMoon: 1.0, uFogCol: [0.04, 0.045, 0.07], uFogDen: 0.0009, uAmb: [0.06, 0.07, 0.11], uExposureSky: 1 });
  return worldScene(P, {
    name: 's14-peleg', cam, sky,
    world: eastGLSL(),
    panels: PN,
    stones: stones(SS),
    fires: fires(fl(P.from)),
    misc: [0, 0.3, 0, 0],
    uniforms: { uSplit: 0 },
    update(t, u) { u.uSplit.value = split(t); u.uFire.value = fires(fl(t)); },
    drawText(ctx, t) {
      inPanel(ctx, PN, 0, (c, b) => { inscribe(c, t, [{ words: [L[0].words[0]] }], { x: 10, y: 0, w: b.w - 20, h: b.h * 0.55 }, { size: 3000, valign: 'middle', font: 'caps', caps: true, tracking: 0.08, tint: [255, 214, 160] }); inscribe(c, t, [{ words: L[0].words.slice(1, 6) }, { words: L[0].words.slice(6) }], { x: 10, y: b.h * 0.56, w: b.w - 20, h: b.h * 0.42 }, { size: 900, valign: 'middle', font: 'caps', caps: true, leading: 1.1, tint: [255, 214, 160] }); });
      inPanel(ctx, PN, 1, (c, b) => inscribe(c, t, [{ words: L[1].words }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 900, valign: 'middle', font: 'heavy', tint: [255, 255, 255] }));
      names.forEach((w, i) => inPanel(ctx, PN, 2 + i, (c, b) => inscribe(c, t, tails[i] ? [{ words: [w] }, { words: tails[i] }] : [{ words: [w] }], { x: 6, y: 0, w: b.w - 12, h: b.h }, { size: 380, valign: 'middle', font: 'caps', caps: true, leading: 1.15, tint: [255, 255, 255] })));
      inPanel(ctx, PN, 15, (c, b) => inscribe(c, t, [{ words: L[6].words.slice(0, 5) }, { words: L[6].words.slice(5) }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 1000, valign: 'middle', font: 'heavy', leading: 1.1, tint: [255, 214, 160] }));
    },
    post: () => grade({ exposure: 1.55, bloom: 0.14 }),
    finish: () => FINISH,
  });
};
