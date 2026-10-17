// s00-ararat: the title, then "Water's gone, ground dry, ark on the mountain / Three sons standing,
// now we start countin' / Shem, Ham, Japheth (yeah) / Sons born after the flood (after the flood) /
// Generations, Genesis Ten, let it drop".
// Dawn on the shoulder of Ararat. In the first second the camera is gliding low over a basin of
// floodwater beside the ark, and the water is already going down: the title stands in the basin, its
// stone letters coming up out of the water as the level falls. The basin drains, the mud dries pale
// and cracks, and the camera climbs out of it toward the ark. The first line is pressed into the
// drying mud, the second painted in white lime along the ark's black hull, the three names raised on
// three standing stones before it, the fourth cut along the ramp let down from its door. On
// "Generations" the camera turns from the ark to the edge of the shoulder, where the last line
// stands in great letters against the drop, and on "let it drop" it tips forward over the edge.
import lyrics from '/timing.js';
import { track } from '/song/lib/cam.js';
import { worldScene, panels, inPanel, stones, stoneFace, facing, onGround } from '/song/lib/world.js';
import { araratGLSL, groundY, arkToWorld, arkDir, RAMP_A } from '/song/lib/x-ararat.js';
import { skyMix, grade, FINISH, smooth, clamp01 } from '/song/lib/look.js';
import { inscribe, anchorAt, title } from '/song/lib/type.js';
export const kind = 'shader';

// a title set as large as fits its box, centred, caps height within the box
function fitText(c, str, b, weight, track) {
  c.save(); c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = '#fff';
  let px = 1000; c.font = `${weight} ${px}px "EB Garamond"`; c.letterSpacing = `${track * px}px`;
  const w = c.measureText(str).width;
  px = Math.floor(Math.min(px * b.w * 0.95 / w, b.h * 0.8 / 0.68));
  c.font = `${weight} ${px}px "EB Garamond"`; c.letterSpacing = `${track * px}px`;
  c.fillText(str, b.w / 2, b.h / 2 + px * 0.34); c.restore();
}
export default (P) => {
  const L = anchorAt(lyrics, P.from, "Water's gone", 'Three sons standing', 'Shem, Ham', 'Sons born after', 'Generations').lines;
  const BASIN = [-22, -14, 26, 0];
  const g = (x, z) => groundY(x, z, BASIN);
  const ARK = [40, g(40, 46) - 0.9, 46, 0.0];
  const floor = g(BASIN[0], BASIN[1]);
  // the floodwater in the basin falls from just under the rim to below the floor by the first line
  const level = (t) => floor - 0.05 - 0.6 * smooth(t / 11.5);
  // the title stands in the basin, facing the camera coming up from the south
  const TT = { c: [BASIN[0], floor + 1.25, BASIN[1] + 3], ...facing([0.2, 0, -1]), w: 20, h: 2.6, depth: 0.7, kind: 'stand', mat: 'chalk', tint: [0.86, 0.83, 0.76], rough: 0.6 };
  const TS = { c: [BASIN[0] + 1.0, floor + 0.55, BASIN[1] - 1.5], ...facing([0.2, 0, -1]), w: 7.5, h: 0.9, depth: 0.35, kind: 'stand', mat: 'chalk', tint: [0.86, 0.83, 0.76], rough: 0.6 };
  // the first line pressed into the mud on the way to the ark
  const m1 = [6, -9];
  const P1 = { c: [m1[0], g(...m1), m1[1]], ...onGround([0.25, 0, 1]), w: 13, h: 3.0, depth: 0.5, kind: 'cut', glow: 1.3, tint: [0.75, 0, 0] };
  // the second painted along the hull's south side
  const hullN = arkDir(ARK, [0, 0, -1]);
  const P2 = { c: arkToWorld(ARK, [-24, 8.6, -11]), ...facing(hullN), w: 30, h: 2.2, depth: 0.7, kind: 'paint', glow: 0.25, rough: 0.9 };
  // three standing stones before the hull, the names raised on their faces
  const SS = [6, 0, -6].map((dx, k) => {
    const base = arkToWorld(ARK, [2 + dx, 0, -22 - Math.abs(dx) * 0.3]);
    const h = [2.5, 2.3, 2.6][k];
    return { pos: [base[0], g(base[0], base[2]) + h - 0.6, base[2]], yaw: Math.PI + ARK[3] - (k - 1) * 0.1, size: [1.0, h, 0.42], seed: k + 3, color: [0.15, 0.14, 0.135], rough: 0.85 };
  });
  const PS = SS.map((s, k) => { const f = stoneFace(s, { lift: 0.55 }); return { c: f.c, right: f.right, up: f.up, w: 1.85, h: k === 2 ? 1.6 : 0.9, depth: 0.07, kind: 'relief', mat: 'chalk', tint: [0.85, 0.82, 0.74] }; });
  // the fourth cut along the ramp, read from its foot looking up to the door
  const ca = Math.cos(RAMP_A), sa = Math.sin(RAMP_A);
  const rampN = arkDir(ARK, [0, ca, sa]), rampUp = arkDir(ARK, [0, -sa, ca]);
  const P4 = { c: arkToWorld(ARK, [14, 1.5 + 0.03 * ca + 6.5 * sa, -11 + 0.03 * sa - 6.5 * ca]), ...facing(rampN, rampUp), w: 7.6, h: 11, depth: 0.25, kind: 'cut', glow: 1.0, tint: [0.7, 0, 0] };
  // the last line stands at the edge of the shoulder, facing back toward the ark
  const e = [46, -52];
  const P5 = { c: [e[0], g(...e) + 1.6, e[1]], ...facing([0.1, 0, 1]), w: 20, h: 3.6, depth: 0.9, kind: 'stand', mat: 'chalk', tint: [0.88, 0.85, 0.78] };
  const PN = panels([TT, TS, P1, P2, P4, P5, ...PS]);

  // the camera: low over the basin, out of it, up to the ark, along the stones and ramp, then round to the edge
  const y = (x, z, h) => Math.max(g(x, z), level(0) - 9) + h;
  const B = BASIN;
  const keys = [
    { t: P.from, pos: [B[0] - 4, floor + 2.3, B[1] - 19], look: [B[0] - 0.5, floor + 1.5, B[1] + 3] },
    { t: 6.0, pos: [B[0] - 2, floor + 2.8, B[1] - 13], look: [B[0] + 1, floor + 1.1, B[1] + 3] },
    { t: 10.8, pos: [B[0] + 7, floor + 5.0, B[1] - 12], look: [m1[0] - 2, g(...m1), m1[1] + 3] },
    { t: L[0].start + 1.6, pos: [m1[0] - 1.0, g(m1[0] - 1.0, m1[1] - 7) + 4.6, m1[1] - 7], look: [m1[0] + 0.3, g(...m1), m1[1] + 0.3] },
    { t: L[1].start + 1.2, pos: [P2.c[0] + 2, g(P2.c[0] + 2, P2.c[2] - 20) + 2.6, P2.c[2] - 20], look: [P2.c[0] + 3, P2.c[1] - 1.5, P2.c[2]] },
    { t: L[2].start + 0.9, pos: [PS[1].c[0] - 2, PS[1].c[1] + 0.5, PS[1].c[2] - 8.5], look: [PS[1].c[0], PS[1].c[1] - 0.2, PS[1].c[2]] },
    { t: L[3].start + 1.4, pos: [P4.c[0] - 2, P4.c[1] + 4.5, P4.c[2] - 11], look: [P4.c[0], P4.c[1], P4.c[2] + 1] },
    { t: L[4].start + 0.9, pos: [P5.c[0] - 3, P5.c[1] + 3, P5.c[2] + 22], look: [P5.c[0], P5.c[1], P5.c[2]] },
    { t: P.to, pos: [P5.c[0] - 1, P5.c[1] + 4.5, P5.c[2] + 8], look: [P5.c[0] + 10, P5.c[1] - 200, P5.c[2] - 600] },
  ];
  const cam = track(keys, { handheld: { amount: 0.5, seed: 7 }, fov: 50 });
  const sky = (t) => ({ ...skyMix('sunrise', 'sunrise', 0), uSunDir: [0.55, 0.14 + 0.06 * t / 26, -0.8], uSunCol: [3.3, 2.0, 1.2], uSkyTop: [0.07, 0.17, 0.42], uSkyHor: [0.7, 0.55, 0.52], uAmb: [0.12, 0.14, 0.2], uFogDen: 0.00018, uFogCol: [0.5, 0.5, 0.58], uCloud: 0.5 });
  return worldScene(P, {
    name: 's00-ararat', cam, sky,
    world: araratGLSL(),
    panels: PN,
    stones: stones(SS),
    water: [level(0), 0.004, 1.5, 1], waterReg: [BASIN[0], BASIN[1], BASIN[2] * 1.3, 0], waterTint: [0.05, 0.06, 0.06, 0.3],
    mist: [-420, 140, 0.004, 0], mistCol: [0.75, 0.62, 0.55],
    misc: [0, 0.4, 0, 0],
    uniforms: { uArk: [...ARK], uBasin: [...BASIN.slice(0, 3), 0], uDry: 0, uGreen: 0, uNations: [0, 0, 0, 0] },
    update(t, u) {
      u.uWater.value[0] = level(t);
      u.uBasin.value[3] = level(t);
      u.uDry.value = 0.75 * smooth((t - 6) / 14);
    },
    drawText(ctx, t) {
      inPanel(ctx, PN, 0, (c, b) => {
        fitText(c, 'AFTER THE FLOOD', b, '700', 0.06);
      });
      inPanel(ctx, PN, 1, (c, b) => {
        fitText(c, 'GENESIS 10', b, '600', 0.12);
      });
      inPanel(ctx, PN, 2, (c, b) => inscribe(c, t, [{ words: L[0].words.slice(0, 4) }, { words: L[0].words.slice(4) }], { x: 20, y: 0, w: b.w - 40, h: b.h }, { size: 900, valign: 'middle', font: 'name', leading: 1.05, tint: [200, 225, 255] }));
      inPanel(ctx, PN, 3, (c, b) => inscribe(c, t, [{ words: L[1].words }], { x: 20, y: 0, w: b.w - 40, h: b.h }, { size: 900, valign: 'middle', font: 'sans', tint: [235, 232, 222] }));
      L[2].words.forEach((w, k) => {
        if (k > 2) return;
        inPanel(ctx, PN, 6 + k, (c, b) => {
          const words = k === 2 ? [{ words: [w] }, { words: L[2].words.slice(3) }] : [{ words: [w] }];
          inscribe(c, t, words, { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 400, valign: 'middle', font: 'caps', leading: 1.0, tint: [255, 255, 255] });
        });
      });
      inPanel(ctx, PN, 4, (c, b) => {
        // the line across the planks in two rows, read from the ramp's foot looking up to the door
        inscribe(c, t, [{ words: L[3].words.slice(0, 2) }, { words: L[3].words.slice(2, 5) }, { words: L[3].words.slice(5) }], { x: 20, y: b.h * 0.1, w: b.w - 40, h: b.h * 0.8 }, { size: 300, valign: 'middle', font: 'name', leading: 1.2, tint: [255, 214, 160] });
      });
      inPanel(ctx, PN, 5, (c, b) => inscribe(c, t, [{ words: L[4].words.slice(0, 3) }, { words: L[4].words.slice(3) }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 600, valign: 'middle', font: 'block', caps: true, leading: 1.02, tint: [255, 255, 255] }));
    },
    post: () => grade({ exposure: 1.1, bloom: 0.1 }),
    finish: () => FINISH,
  });
};
