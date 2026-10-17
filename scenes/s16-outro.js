// s16-outro: "These are the clans of Noah's sons / By their generations, in their nations, one by one /
// From these the nations spread across the earth / After the flood (after the flood) / Genesis Ten".
// Night on the shoulder of Ararat, the moon up, the ark dark against the snow with lamplight in its
// window. From the brink the camera looks down on the plain far below, and as the lines are sung,
// standing in glowing letters along the brink, the fires of the nations come alight across the plain,
// spreading out from where the river divides. Then it turns back to the dry basin where the title
// stood at dawn: AFTER THE FLOOD lights as it is sung, then GENESIS TEN, and the camera rises over the
// ark into the stars with the lights of the nations spread below it to the end of the music.
import lyrics from '/timing.js';
import { track } from '/song/lib/cam.js';
import { worldScene, panels, inPanel, facing } from '/song/lib/world.js';
import { araratGLSL, groundY, PLAIN_Y, RIVER_Z } from '/song/lib/x-ararat.js';
import { grade, FINISH, smooth, clamp01 } from '/song/lib/look.js';
import { inscribe, anchorAt } from '/song/lib/type.js';
export const kind = 'shader';

export default (P) => {
  const L = anchorAt(lyrics, P.from, 'These are the clans of Noah', 'By their generations', 'From these the nations', 'After the flood', 'Genesis Ten').lines;
  const BASIN = [-22, -14, 26, 0];
  const g = (x, z) => groundY(x, z, BASIN);
  const floor = g(BASIN[0], BASIN[1]);
  const ARK = [40, g(40, 46) - 0.9, 46, 0.0];
  // three lines standing along the brink, facing back up the shoulder
  const brink = (x, z, w, h) => ({ c: [x, g(x, z) + h / 2 - 0.3, z], ...facing([0.1, 0, 1]), w, h, depth: 0.7, kind: 'stand', mat: 'glow', tint: [1, 1, 1], glow: 2.2, rough: 0.6 });
  const B0 = brink(30, -46, 26, 3.2), B1 = brink(56, -58, 34, 3.4), B2 = brink(14, -74, 42, 4.4);
  // the title letters in the dry basin, lit now as they are sung
  const T0 = { c: [BASIN[0], floor + 1.25, BASIN[1] + 3], ...facing([0.2, 0, -1]), w: 20, h: 2.6, depth: 0.7, kind: 'stand', mat: 'glow', tint: [1, 1, 1], glow: 2.0, rough: 0.6 };
  const T1 = { c: [BASIN[0] + 1.0, floor + 0.55, BASIN[1] - 1.5], ...facing([0.2, 0, -1]), w: 7.5, h: 0.9, depth: 0.35, kind: 'stand', mat: 'glow', tint: [1, 1, 1], glow: 2.0, rough: 0.6 };
  const T2 = { c: [BASIN[0] + 9, floor + 0.75, BASIN[1] - 6], ...facing([0.25, 0, -1]), w: 12, h: 1.4, depth: 0.35, kind: 'stand', mat: 'glow', tint: [1, 1, 1], glow: 2.0, rough: 0.6 };
  const PN = panels([B0, B1, B2, T0, T1, T2]);
  const fork = [40, -2250];
  const spread = (t) => 120 + 3400 * smooth((t - L[0].start) / (L[2].end + 4 - L[0].start));
  const keys = [
    { t: P.from, pos: [34, g(34, -22) + 5, -22], look: [B0.c[0], B0.c[1] - 0.5, B0.c[2] - 8] },
    { t: (L[0].start + L[0].end) / 2, pos: [36, g(36, -26) + 5.5, -26], look: [B0.c[0] + 4, B0.c[1] - 1, B0.c[2] - 12] },
    { t: (L[1].start + L[1].end) / 2, pos: [44, g(44, -32) + 6.5, -32], look: [B1.c[0], B1.c[1] - 1, B1.c[2] - 14] },
    { t: (L[2].start + L[2].end) / 2, pos: [42, g(42, -40) + 8, -40], look: [B2.c[0], B2.c[1] - 2, B2.c[2] - 20] },
    { t: L[2].end + 1.2, pos: [42, g(42, -46) + 14, -46], look: [40, PLAIN_Y, -1900] },
    { t: L[3].start + 1.0, pos: [BASIN[0] + 6, floor + 4.5, BASIN[1] - 26], look: [BASIN[0], floor + 1.2, BASIN[1] + 3] },
    { t: L[4].end + 0.5, pos: [BASIN[0] + 10, floor + 6, BASIN[1] - 18], look: [BASIN[0] + 4, floor + 0.8, BASIN[1] - 2] },
    { t: L[4].end + 5, pos: [BASIN[0] + 4, floor + 7, BASIN[1] - 20], look: [BASIN[0] + 2, floor + 1, BASIN[1] + 1] },
    { t: P.to, pos: [BASIN[0] + 2, floor + 13, BASIN[1] - 25], look: [BASIN[0] + 4, floor + 2, BASIN[1] + 10] },
  ];
  const cam = track(keys, { handheld: { amount: 0.5, seed: 181 }, fov: 50 });
  const sky = (t) => { const k = smooth((t - P.from) / 14); return { uSunDir: [0.4 - 1.2 * (1 - k) * 0, 0.48, -0.78], uSunCol: [0.5 + 1.6 * (1 - k), 0.58 + 0.5 * (1 - k), 0.85 - 0.2 * (1 - k)], uSkyTop: [0.008 + 0.04 * (1 - k), 0.014 + 0.05 * (1 - k), 0.04 + 0.12 * (1 - k)], uSkyHor: [0.05 + 0.6 * (1 - k), 0.065 + 0.28 * (1 - k), 0.12 + 0.16 * (1 - k)], uMoonDir: [0.4, 0.48, -0.78], uStars: k, uCloud: 0.25, uCloudSpeed: 0.02, uMoon: 1.0, uFogCol: [0.03, 0.035, 0.06], uFogDen: 0.00018, uAmb: [0.09, 0.1, 0.15], uExposureSky: 1 }; };
  return worldScene(P, {
    name: 's16-outro', cam, sky,
    world: araratGLSL(),
    panels: PN,
    mist: [-200, 120, 0.002, 0], mistCol: [0.08, 0.09, 0.14],
    misc: [0, 0.3, 0, 0],
    uniforms: { uArk: [...ARK], uBasin: [...BASIN.slice(0, 3), -99], uDry: 0.75, uGreen: 0.8, uNations: [fork[0], fork[1], 0, 0] },
    update(t, u) { u.uNations.value = [fork[0], fork[1], spread(t), clamp01((t - L[0].start + 0.5) / 1.5)]; u.uSpin.value = (t - P.from) * 0.004; },
    drawText(ctx, t) {
      const ln = (k, ws, o = {}) => inPanel(ctx, PN, k, (c, b) => inscribe(c, t, ws, { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 1200, valign: 'middle', font: 'caps', caps: true, leading: 1.05, tint: [255, 214, 160], ...o }));
      ln(0, [{ words: L[0].words }]);
      ln(1, [{ words: L[1].words.slice(0, 3) }, { words: L[1].words.slice(3) }]);
      ln(2, [{ words: L[2].words.slice(0, 3) }, { words: L[2].words.slice(3) }]);
      ln(3, [{ words: L[3].words.slice(0, 3) }], { tracking: 0.06 });
      ln(4, [{ words: L[4].words }], { tracking: 0.12 });
      ln(5, [{ words: L[3].words.slice(3) }], { font: 'italic', caps: false });
    },
    post: () => grade({ exposure: 1.6, bloom: 0.16 }),
    finish: () => FINISH,
  });
};
