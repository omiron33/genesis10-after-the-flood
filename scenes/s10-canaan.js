// s10-canaan: "Canaan's firstborn: Sidon, then Heth / Jebusites, Amorites, Girgashites, next /
// Hivites, Arkites, Sinites, roll / Arvadites, Zemarites, Hamathites, whole".
// Morning in the hill country of Canaan. A great hill is terraced from foot to top in dry-stone
// walls, olives on the terraces. The camera starts low in the valley and climbs the hill's face
// terrace by terrace; each line is painted in white lime along the face of one terrace wall, a
// name at a time as it is sung, the climb reaching the next wall as the next line begins.
import lyrics from '/timing.js';
import { track } from '/song/lib/cam.js';
import { worldScene, panels, inPanel, facing } from '/song/lib/world.js';
import { canaanGLSL, groundY, terraceWall } from '/song/lib/x-canaan.js';
import { grade, FINISH } from '/song/lib/look.js';
import { inscribe, anchorAt } from '/song/lib/type.js';
export const kind = 'shader';

export default (P) => {
  const L = anchorAt(lyrics, P.from, "Canaan's firstborn", 'Jebusites', 'Hivites', 'Arvadites').lines;
  const g = groundY;
  const ks = [5, 6, 7, 8], ang = [-0.02, 0.0, 0.015, 0.03];
  const walls = ks.map((k, i) => terraceWall(k, ang[i]));
  const D = walls.map((w) => ({ c: [w.x, (w.top + w.foot) / 2 + 0.05, w.z], ...facing(w.N), w: 34, h: 2.6, depth: 1.4, kind: 'paint', rough: 0.85 }));
  const PN = panels(D);
  const view = (w, back, up, dx = 0) => ({ pos: [w.x + w.N[0] * back + dx, w.top + up, w.z + w.N[2] * back], look: [w.x + dx * 0.3, (w.top + w.foot) / 2, w.z] });
  // the hillside reads like a page: the four walls one above another, the camera rising gently up it
  const keys = [
    { t: P.from, ...view(walls[0], 70, -2, -14) },
    { t: L[0].start + 1.2, ...view(walls[0], 52, 2, -6) },
    { t: L[1].start + 1.2, ...view(walls[1], 50, 3, -2) },
    { t: L[2].start + 1.2, ...view(walls[2], 48, 4, 2) },
    { t: L[3].start + 1.2, ...view(walls[3], 46, 5, 5) },
    { t: P.to, ...view(walls[3], 40, 9, 9) },
  ];
  const cam = track(keys, { handheld: { amount: 0.6, seed: 121 }, fov: 44 });
  const sky = () => ({ uSunDir: [0.7, 0.32, -0.62], uSunCol: [3.3, 2.6, 1.9], uSkyTop: [0.08, 0.2, 0.5], uSkyHor: [0.7, 0.68, 0.66], uMoonDir: [0, 1, 0], uStars: 0, uCloud: 0.4, uCloudSpeed: 0.03, uMoon: 0, uFogCol: [0.62, 0.62, 0.66], uFogDen: 0.0009, uAmb: [0.14, 0.15, 0.2], uExposureSky: 1 });
  return worldScene(P, {
    name: 's10-canaan', cam, sky,
    world: canaanGLSL(),
    panels: PN,
    misc: [0, 0.4, 0, 0],
    uniforms: { uTerr: 1, uBorder: new Array(32).fill(0), uBorderLen: 0 },
    drawText(ctx, t) {
      L.forEach((l, k) => inPanel(ctx, PN, k, (c, b) => inscribe(c, t, [{ words: l.words }], { x: 20, y: 0, w: b.w - 40, h: b.h }, { size: 600, valign: 'middle', font: 'sans', caps: true, tracking: 0.04, tint: [96, 26, 14] })));
    },
    post: () => grade({ exposure: 1.0, bloom: 0.08 }),
    finish: () => FINISH,
  });
};
