// s07-shinar: "Babel, Erech, Accad, Calneh / Land of Shinar, that's where he laid it".
// Dusk over the plain of Shinar, seen from high: four walled cities stand across it, smoke going up,
// lamps coming on. As each is named its name stands up in glazed brick letters along the top of its
// gate, blue and gold, left to right across the plain. Then the camera drops toward Babel's gate,
// where the second line is laid in brick in the face of the wall beside the arch.
import lyrics from '/timing.js';
import { track } from '/song/lib/cam.js';
import { worldScene, panels, inPanel, facing, fires } from '/song/lib/world.js';
import { southGLSL, groundY, riverX, cities, gateFace } from '/song/lib/x-south.js';
import { CITIES } from '/song/lib/cities.js';
import { grade, FINISH } from '/song/lib/look.js';
import { inscribe, anchorAt } from '/song/lib/type.js';
export const kind = 'shader';

export default (P) => {
  const L = anchorAt(lyrics, P.from, 'Babel, Erech', 'Land of Shinar').lines;
  const g = groundY;
  const C = CITIES.slice(0, 4);
  // a name in glazed brick standing along the top of each gate
  const names = C.map((c) => { const f = gateFace(c, { up: 4.2 }); return { c: f.c, ...facing(f.N), w: c.r * 1.6, h: c.r * 0.34, depth: 1.4, kind: 'stand', mat: 'brick', tint: [0.95, 0.75, 0.3], glow: 0.12, rough: 0.4, spec: 0.3 }; });
  // the second line laid into Babel's wall beside the gate, in courses of brick
  const B = C[0], fb = gateFace(B, { up: -B.h * 0.5 - 1.0 }), Fb = facing(fb.N);
  const side = [fb.c[0] + Fb.right[0] * 22, fb.c[1] - 1.2, fb.c[2] + Fb.right[2] * 22 - fb.N[2] * 1.8];
  const P1 = { c: side, ...Fb, w: 24, h: 4.6, depth: 0.35, kind: 'relief', mat: 'brick', tint: [0.98, 0.86, 0.55], glow: 0.04, rough: 0.4, spec: 0.3 };
  const PN = panels([...names, P1]);
  const torches = C.flatMap((c) => [-1, 1].map((s) => { const f = gateFace(c, { up: -c.h - 1.0 + 4.2 }); const F = facing(f.N); return [f.c[0] + F.right[0] * s * 4.0 + f.N[0] * 1.0, 6.0, f.c[2] + F.right[2] * s * 4.0 + f.N[2] * 1.0, 1.6]; }));
  const mx = (C[0].x + C[3].x) / 2, mz = 620;
  const keys = [
    { t: P.from, pos: [mx + 60, 46, mz - 250], look: [names[0].c[0], names[0].c[1], names[0].c[2]] },
    ...L[0].words.slice(0, 4).map((w, k) => ({ t: w.start + 0.2, pos: [mx + 50 - k * 30, 44 - k * 2, mz - 235 + k * 6], look: [names[k].c[0], names[k].c[1] - 2, names[k].c[2]] })),
    { t: L[1].start + 0.9, pos: [side[0] + fb.N[0] * 60, 22, side[2] + fb.N[2] * 60 - 10], look: [side[0], side[1] + 2, side[2]] },
    { t: P.to, pos: [side[0] + fb.N[0] * 38, 9, side[2] + fb.N[2] * 38 - 6], look: [side[0] + 6, side[1], side[2]] },
  ];
  const cam = track(keys, { handheld: { amount: 0.6, seed: 88 }, fov: 40 });
  const sky = () => ({ uSunDir: [-0.85, 0.06, 0.3], uSunCol: [3.0, 1.35, 0.6], uSkyTop: [0.04, 0.07, 0.2], uSkyHor: [0.85, 0.42, 0.28], uMoonDir: [0.3, 0.4, 0.8], uStars: 0.15, uCloud: 0.45, uCloudSpeed: 0.02, uMoon: 0, uFogCol: [0.5, 0.33, 0.28], uFogDen: 0.0011, uAmb: [0.1, 0.09, 0.13], uExposureSky: 1 });
  return worldScene(P, {
    name: 's07-shinar', cam, sky,
    world: southGLSL(),
    panels: PN,
    fires: fires(torches),
    misc: [0, 0.3, 0, 0],
    uniforms: { uCity: cities(CITIES), uDusk: 0.6 },
    drawText(ctx, t) {
      C.forEach((c, k) => inPanel(ctx, PN, k, (cx, b) => inscribe(cx, t, [{ words: [L[0].words[k]] }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 2000, valign: 'middle', font: 'block', caps: true, tracking: 0.06, tint: [255, 255, 255] })));
      inPanel(ctx, PN, 4, (cx, b) => inscribe(cx, t, [{ words: L[1].words.slice(0, 3) }, { words: L[1].words.slice(3) }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 900, valign: 'middle', font: 'block', caps: true, leading: 1.05, tint: [255, 255, 255] }));
    },
    post: () => grade({ exposure: 1.15, bloom: 0.14 }),
    finish: () => FINISH,
  });
};
