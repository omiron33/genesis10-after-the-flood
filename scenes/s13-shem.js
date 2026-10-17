// s13-shem: "Now Shem, father of all of Eber's kids / Japheth's brother, sons were born to him / Elam,
// Asshur, Arpachshad / Lud and Aram, five sons, hold that / Aram had Uz, Hul, Gether, Mash /
// Arpachshad fathered Shelah, Shelah fathered Eber, fast / Eber had two sons, check the name:".
// Dusk in the hill country of the east. A great stair of pale cut stone climbs the spine of a ridge
// toward a high plateau, dark ranges folded all round. SHEM stands in bronze at the stair's foot.
// The camera climbs the stair; each line is cut into the treads ahead of it as it is sung, running up
// the steps, the generations climbed one after another, lit warm by the last of the sun. At the top
// the stair comes out on the plateau where the path divides in two.
import lyrics from '/timing.js';
import { track } from '/song/lib/cam.js';
import { worldScene, panels, inPanel, facing } from '/song/lib/world.js';
import { eastGLSL, groundY, stepY, STAIR, TOP } from '/song/lib/x-east.js';
import { grade, FINISH } from '/song/lib/look.js';
import { inscribe, anchorAt } from '/song/lib/type.js';
export const kind = 'shader';

export default (P) => {
  const L = anchorAt(lyrics, P.from, 'Now Shem', "Japheth's brother", 'Elam, Asshur', 'Lud and Aram', 'Aram had Uz', 'Arpachshad fathered', 'Eber had two').lines;
  // each line is cut into the risers of the stair ahead of the camera, a row to a riser, read as it climbs
  const zCam = (t) => STAIR.z0 - 26 + (t - P.from) * 10.4;
  const split = (ws) => (ws.length > 4 ? [ws.slice(0, Math.ceil(ws.length / 2)), ws.slice(Math.ceil(ws.length / 2))] : [ws]);
  const rows = [];
  L.forEach((l, k) => {
    const s0 = Math.max(1, Math.floor((zCam((l.start + l.end) / 2) + 13 - STAIR.z0) / STAIR.tread));
    split(l.words).forEach((ws, i) => rows.push({ k, ws, s: s0 + i }));
  });
  const riser = (s) => ({ c: [0, (s + 0.5) * STAIR.rise, STAIR.z0 + s * STAIR.tread], ...facing([0, 0, -1]), w: STAIR.w * 2 - 0.3, h: STAIR.rise * 0.92, depth: 0.35, kind: 'cut', glow: 1.25, tint: [0.75, 0, 0] });
  const D = rows.map((r) => riser(r.s));
  // SHEM in bronze at the foot of the stair
  const SH = { c: [0, groundY(0, STAIR.z0 - 8) + 2.6, STAIR.z0 - 8], ...facing([0, 0, -1]), w: 12, h: 4.6, depth: 0.7, kind: 'stand', mat: 'bronze', tint: [0.36, 0.22, 0.1], glow: 0.05, rough: 0.3, spec: 0.6 };
  const PN = panels([SH, ...D]);
  const keys = [{ t: P.from, pos: [4, groundY(0, STAIR.z0 - 40) + 5, STAIR.z0 - 40], look: [0, SH.c[1], SH.c[2]] }];
  for (let t = L[0].start; t <= L[6].end + 0.01; t += 1.2) { const z = zCam(t); keys.push({ t, pos: [1.2 * Math.sin(t * 0.4), stepY(Math.max(z, STAIR.z0)) + 6.0, z], look: [0, stepY(z + 15) - 0.5, z + 15] }); }
  keys.push({ t: P.to, pos: [0, TOP + 7, STAIR.z1 + 10], look: [0, TOP + 2, STAIR.z1 + 80] });
  const cam = track(keys, { handheld: { amount: 0.6, seed: 151 }, fov: 52 });
  const sky = () => ({ uSunDir: [-0.7, 0.1, 0.7], uSunCol: [3.3, 1.7, 0.85], uSkyTop: [0.06, 0.09, 0.24], uSkyHor: [0.86, 0.5, 0.34], uMoonDir: [0.5, 0.4, -0.7], uStars: 0.08, uCloud: 0.5, uCloudSpeed: 0.02, uMoon: 0.2, uFogCol: [0.42, 0.32, 0.32], uFogDen: 0.0006, uAmb: [0.12, 0.11, 0.15], uExposureSky: 1 });
  return worldScene(P, {
    name: 's13-shem', cam, sky,
    world: eastGLSL(),
    panels: PN,
    misc: [0, 0.3, 0, 0],
    uniforms: { uSplit: 0 },
    drawText(ctx, t) {
      inPanel(ctx, PN, 0, (c, b) => inscribe(c, t, [{ words: L[0].words.slice(1, 2) }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 2000, valign: 'middle', font: 'caps', caps: true, tracking: 0.08, tint: [255, 255, 255] }));
      rows.forEach((r, i) => inPanel(ctx, PN, 1 + i, (c, b) => inscribe(c, t, [{ words: r.ws }], { x: 20, y: 0, w: b.w - 40, h: b.h }, { size: 600, valign: 'middle', font: r.k >= 2 && r.k <= 5 ? 'caps' : 'heavy', caps: r.k >= 2 && r.k <= 5, tracking: 0.02, tint: [255, 214, 160] })));
    },
    post: () => grade({ exposure: 1.15, bloom: 0.12 }),
    finish: () => FINISH,
  });
};
