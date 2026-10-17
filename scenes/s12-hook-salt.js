// s12-hook-salt: the third hook, "After the flood (after the flood) / Nations rose up from the sons of
// Noah's blood / By their clans, by their tongues, by their lands / Every nation on the map came from
// three men / Divided in the earth, let the whole world know / Genesis Ten, watch the nations grow".
// Sunset on the Salt Sea, the water still as glass between white shores. The camera stands low over
// the water near the middle and turns slowly round; each line of the hook grows up out of the water
// in salt as it is sung, a ring of white crystal letters round the camera, doubled in the water, so
// the turning camera finds each new line as it comes. On the last line the letters rise up out of the
// sea as they are sung, growing, and the camera lifts to see the whole ring.
import lyrics from '/timing.js';
import { track } from '/song/lib/cam.js';
import { worldScene, panels, inPanel, facing, placePanel } from '/song/lib/world.js';
import { canaanGLSL, groundY, SALT } from '/song/lib/x-canaan.js';
import { grade, FINISH, smooth, clamp01 } from '/song/lib/look.js';
import { inscribe, anchorAt } from '/song/lib/type.js';
import { weight } from '/kit/motion.js';
export const kind = 'shader';

export default (P) => {
  const L = anchorAt(lyrics, P.from, 'After the flood', 'Nations rose up', 'By their clans', 'Every nation', 'Divided in the earth', 'Genesis Ten, watch').lines;
  const WY = SALT[3] - 2.5, C = [SALT[0], SALT[1]];
  // the lines stand on a ring round the camera, one after another round it
  const R = 62, a0 = -0.6, da = 0.95;
  const ang = (k) => a0 + k * da;
  const rise = (t) => weight.heavy(clamp01((t - L[5].start + 0.3) / 1.6));
  const line = (k, t = P.to) => {
    const a = ang(k), x = C[0] + Math.sin(a) * R, z = C[1] + Math.cos(a) * R;
    const h = k === 5 ? 15 : 11, w = 52;
    const y = k === 5 ? WY - 1.5 - h / 2 + (h + 1.5) * rise(t) : WY - 1.5 + h / 2;
    return { c: [x, y, z], ...facing([-Math.sin(a), 0, -Math.cos(a)]), w, h, depth: 1.6, kind: 'stand', mat: 'salt', tint: [0.96, 0.94, 0.9], glow: 0.35, rough: 0.45, spec: 0.25 };
  };
  const D = L.map((_, k) => line(k, P.from));
  const PN = panels(D);
  // the camera turns to each line as it begins, a little ahead of the words
  const look = (a, h = WY + 2.5) => [C[0] + Math.sin(a) * R, h, C[1] + Math.cos(a) * R];
  const keys = [{ t: P.from, pos: [C[0] - 6, WY + 3.2, C[1] - 4], look: look(ang(0) - 0.25) }];
  L.forEach((l, k) => { const a = ang(k), mid = (l.start + l.end) / 2; keys.push({ t: mid, pos: [C[0] - Math.sin(a) * 6, WY + 5.5 + 0.4 * k, C[1] - Math.cos(a) * 6], look: look(a + 0.05) }); });
  keys.push({ t: P.to, pos: [C[0] - Math.sin(ang(5)) * 30, WY + 22, C[1] - Math.cos(ang(5)) * 30], look: [C[0], WY + 2, C[1]] });
  const cam = track(keys, { handheld: { amount: 0.5, seed: 141 }, fov: 50 });
  const sky = (t) => { const k = smooth((t - P.from) / (P.to - P.from)); return { uSunDir: [-0.92, 0.07 - 0.05 * k, -0.35], uSunCol: [3.6, 1.7 - 0.3 * k, 0.75], uSkyTop: [0.07, 0.1, 0.27], uSkyHor: [0.95, 0.5, 0.36], uMoonDir: [0, 1, 0], uStars: 0.05 * k, uCloud: 0.55, uCloudSpeed: 0.02, uMoon: 0, uFogCol: [0.62, 0.42, 0.38], uFogDen: 0.0004, uAmb: [0.16, 0.13, 0.17], uExposureSky: 1 }; };
  return worldScene(P, {
    name: 's12-hook-salt', cam, sky,
    world: canaanGLSL(),
    panels: PN,
    water: [WY, 0.004, 0.6, 1], waterTint: [0.015, 0.035, 0.04, 0.1],
    misc: [0, 0.15, 0, 0],
    uniforms: { uTerr: 1, uBorder: new Array(32).fill(0), uBorderLen: 0 },
    update(t, u) { placePanel(u.uP.value, 5, line(5, t)); },
    drawText(ctx, t) {
      const rows = [[0, 3, 6], [0, 3, 9], [0, 3, 6, 9], [0, 4, 9], [0, 4, 9], [0, 2, 6]];
      L.forEach((l, k) => inPanel(ctx, PN, k, (c, b) => {
        const r = rows[k], ls = [];
        for (let i = 0; i < r.length - 1; i++) ls.push({ words: l.words.slice(r[i], r[i + 1]) });
        inscribe(c, t, ls, { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 1200, valign: 'middle', font: k === 5 ? 'block' : 'caps', caps: true, leading: 1.03, tint: [255, 255, 255], lead: 0.02 });
      }));
    },
    post: () => grade({ exposure: 1.05, bloom: 0.12 }),
    finish: () => FINISH,
  });
};
