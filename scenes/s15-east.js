// s15-east: "They lived from Mesha toward Sephar, way out / The hill country of the east, that's the
// route / These are the sons of Shem, laid out plain / By their clans, their tongues, their lands,
// their nations' names".
// Dawn at the eastern rim of Shem's plateau. Folded hill country runs away east to two great peaks,
// and as they are named MESHA and SEPHAR catch the first light across their faces, the rest of the
// line standing on the rim between. The camera goes out over the edge toward them as the second line
// stands along the way down; then the sun clears the ranges, and the last two lines stand in bronze
// along the rim against the sunrise as the camera rises to see the whole east.
import lyrics from '/timing.js';
import { track } from '/song/lib/cam.js';
import { worldScene, panels, inPanel, facing, fires } from '/song/lib/world.js';
import { eastGLSL, groundY, TOP, PEAKS } from '/song/lib/x-east.js';
import { grade, FINISH, smooth } from '/song/lib/look.js';
import { inscribe, anchorAt } from '/song/lib/type.js';
export const kind = 'shader';

export default (P) => {
  const L = anchorAt(lyrics, P.from, 'They lived from', 'The hill country', 'These are the sons of Shem', 'By their clans, their').lines;
  const g = (x, z) => groundY(x, z);
  const find = (re) => L[0].words.find((w) => re.test(w.w));
  const mesha = find(/Mesha/), sephar = find(/Sephar/);
  const C0 = [430, 640];
  // a name across the face of each peak, lit by the dawn
  const peakName = (pk, w, h) => { const x = pk[0] - 260, z = pk[1]; return { c: [x, g(x, z) + h * 0.2, z], ...facing([-1, 0, 0]), w, h, depth: 70, kind: 'paint', glow: 1.4, rough: 0.6 }; };
  const stand = (x, z, w, h, o = {}) => ({ c: [x, g(x, z) + h / 2 - 0.3, z], ...facing([-1, 0, 0]), w, h, depth: 0.6, kind: 'stand', mat: 'chalk', tint: [0.9, 0.88, 0.82], glow: 0.08, rough: 0.7, ...o });
  const D = [
    stand(C0[0] + 30, C0[1] - 30, 18, 2.6),           // They lived from
    peakName(PEAKS.mesha, 300, 70),
    stand(C0[0] + 34, C0[1] + 2, 9, 2.2),             // toward
    peakName(PEAKS.sephar, 330, 76),
    stand(C0[0] + 30, C0[1] + 30, 11, 2.4),            // way out
    stand(C0[0] + 50, C0[1] + 105, 40, 5, { glow: 0.1 }),                       // The hill country of the east, that's the route
    stand(C0[0] + 60, C0[1] - 40, 70, 9, { mat: 'stone', tint: [0.07, 0.065, 0.06], glow: 0.0, rough: 0.85, spec: 0.04 }),   // These are the sons of Shem
    stand(C0[0] + 110, C0[1] + 40, 64, 9, { mat: 'stone', tint: [0.07, 0.065, 0.06], glow: 0.0, rough: 0.85, spec: 0.04 }),     // By their clans ...
  ];
  const PN = panels(D);
  const keys = [
    { t: P.from, pos: [C0[0] - 15, g(C0[0] - 15, C0[1] - 18) + 2.2, C0[1] - 18], look: [C0[0] - 8, g(C0[0] - 8, C0[1] - 14) + 0.6, C0[1] - 14] },
    { t: P.from + 1.6, pos: [C0[0] - 24, g(C0[0], C0[1]) + 5, C0[1] - 8], look: [C0[0] + 30, g(C0[0], C0[1]) + 3, C0[1] - 22] },
    { t: mesha.start + 0.4, pos: [C0[0] - 20, g(C0[0], C0[1]) + 8, C0[1] - 4], look: [PEAKS.mesha[0] - 260, 180, PEAKS.mesha[1]] },
    { t: sephar.start + 0.5, pos: [C0[0] - 14, g(C0[0], C0[1]) + 10, C0[1] + 4], look: [PEAKS.sephar[0] - 260, 200, PEAKS.sephar[1]] },
    { t: L[1].start + 1.4, pos: [C0[0] + 12, g(C0[0], C0[1]) + 7, C0[1] + 78], look: [D[5].c[0], D[5].c[1], D[5].c[2]] },
    { t: L[2].start + 1.4, pos: [C0[0] - 4, g(C0[0], C0[1]) + 9, C0[1] - 38], look: [D[6].c[0], D[6].c[1], D[6].c[2]] },
    { t: L[3].start + 1.6, pos: [D[7].c[0] - 70, g(D[7].c[0] - 70, D[7].c[2] + 2) + 7, D[7].c[2] + 2], look: [D[7].c[0], D[7].c[1] - 1, D[7].c[2]] },
    { t: P.to, pos: [D[7].c[0] - 62, g(D[7].c[0] - 62, D[7].c[2] - 2) + 9, D[7].c[2] - 2], look: [D[7].c[0], D[7].c[1], D[7].c[2]] },
  ];
  const cam = track(keys, { handheld: { amount: 0.5, seed: 171 }, fov: 48 });
  const sky = (t) => {
    const k = smooth((t - P.from) / (P.to - P.from)), n = 1 - smooth((t - P.from) / 4);
    return { uSunDir: [0.55, 0.2 + 0.16 * k - 0.24 * n, 0.83], uSunCol: [3.4, 1.6 + 0.8 * k, 0.8 + 0.6 * k], uSkyTop: [0.05 + 0.05 * k, 0.09 + 0.1 * k, 0.26 + 0.2 * k], uSkyHor: [0.95, 0.56 + 0.1 * k, 0.4 + 0.1 * k], uMoonDir: [0, 1, 0], uStars: 0.2 * (1 - k), uCloud: 0.45, uCloudSpeed: 0.02, uMoon: 0, uFogCol: [0.6, 0.45, 0.42], uFogDen: 0.0005, uAmb: [0.12 + 0.05 * k - 0.06 * n, 0.12 + 0.05 * k - 0.05 * n, 0.17 + 0.05 * k - 0.05 * n], uExposureSky: 1 - 0.55 * n };
  };
  return worldScene(P, {
    name: 's15-east', cam, sky,
    world: eastGLSL(),
    panels: PN,
    fires: fires([[C0[0] - 8, g(C0[0] - 8, C0[1] - 14) + 0.2, C0[1] - 14, 1.6], [C0[0] + 6, g(C0[0] + 6, C0[1] + 12) + 0.2, C0[1] + 12, 1.5]]),
    misc: [0, 0.3, 0, 0],
    uniforms: { uSplit: 0 },
    drawText(ctx, t) {
      const W = L[0].words, i0 = W.indexOf(mesha), i1 = W.indexOf(sephar);
      const ln = (k, ws, o = {}) => inPanel(ctx, PN, k, (c, b) => inscribe(c, t, ws, { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 1200, valign: 'middle', font: 'caps', caps: true, leading: 1.05, tint: [255, 255, 255], ...o }));
      ln(0, [{ words: W.slice(0, i0) }]); ln(1, [{ words: [mesha] }], { tint: [255, 214, 160], tracking: 0.08 }); ln(2, [{ words: W.slice(i0 + 1, i1) }]);
      ln(3, [{ words: [sephar] }], { tint: [255, 214, 160], tracking: 0.08 }); ln(4, [{ words: W.slice(i1 + 1) }]);
      ln(5, [{ words: L[1].words.slice(0, 5) }, { words: L[1].words.slice(5) }], { font: 'heavy', caps: false });
      ln(6, [{ words: L[2].words.slice(0, 6) }, { words: L[2].words.slice(6) }]);
      ln(7, [{ words: L[3].words.slice(0, 6) }, { words: L[3].words.slice(6) }]);
    },
    post: () => grade({ exposure: 1.1, bloom: 0.12 }),
    finish: () => FINISH,
  });
};
