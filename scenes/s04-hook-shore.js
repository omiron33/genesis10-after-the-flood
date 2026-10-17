// s04-hook-shore: the second hook, "After the flood (after the flood) / Nations rose up from the sons of
// Noah's blood / By their clans, by their tongues, by their lands / Every nation on the map came from
// three men / Divided in the earth, let the whole world know / Genesis Ten, watch the nations grow".
// Sunset on the same cove. The camera walks the wet sand at the water's edge, looking out to sea with
// the sun going down behind the islands. Each line is pressed into the wet sand as it is sung, the
// grooves holding the sea and the gold of the sky; the swash runs up over the lower letters and drains
// back off them. On the last line the camera lifts off the sand and rises over the bay, where
// the last line lies pressed large across the beach and the sails go on toward the islands.
import lyrics from '/timing.js';
import { track } from '/song/lib/cam.js';
import { worldScene, panels, inPanel, onGround } from '/song/lib/world.js';
import { coastGLSL, groundY, coastX, boats } from '/song/lib/x-coast.js';
import { grade, FINISH, smooth } from '/song/lib/look.js';
import { inscribe, anchorAt } from '/song/lib/type.js';
export const kind = 'shader';

export default (P) => {
  const L = anchorAt(lyrics, P.from, 'After the flood', 'Nations rose up', 'By their clans', 'Every nation', 'Divided in the earth', 'Genesis Ten, watch').lines;
  const g = groundY;
  const camZ = (t) => 262 + (t - P.from) * 3.3;
  const mid = (l) => (l.start + l.end) / 2;
  // each line pressed into the wet sand a few metres up the beach, centred ahead of where the camera is as it is sung
  const D = L.slice(0, 5).map((l, k) => {
    const z = camZ(mid(l)) + 9, x = coastX(z) + 9.5;
    return { c: [x, g(x, z), z], ...onGround([-0.25, 0, 1]), w: 14, h: 4.2, depth: 0.4, kind: 'cut', glow: 1.2, tint: [0.8, 0, 0] };
  });
  // the last line large, higher on the beach, seen from above as the camera rises
  const zl = camZ(L[5].start) + 22, xl = coastX(zl) + 16;
  D.push({ c: [xl, g(xl, zl), zl], ...onGround([-0.7, 0, 0.7]), w: 34, h: 10, depth: 0.6, kind: 'cut', glow: 1.4, tint: [0.8, 0, 0] });
  const PN = panels(D);

  const keys = [];
  for (let t = P.from; t <= L[5].start + 0.01; t += 2) {
    const z = camZ(t);
    keys.push({ t, pos: [coastX(z) + 15 + 0.8 * Math.sin(t * 0.3), g(coastX(z) + 15, z) + 3.0, z - 2], look: [coastX(z + 9) + 6, 0.0, z + 9] });
  }
  keys.push({ t: (L[5].start + L[5].end) / 2 + 0.4, pos: [xl + 26, 22, zl - 26], look: [xl - 6, 0, zl] });
  keys.push({ t: P.to, pos: [xl + 34, 44, zl - 36], look: [xl - 120, 0, zl - 10] });
  const cam = track(keys, { handheld: { amount: 0.55, seed: 55 }, fov: 50 });
  // boats far out, going on toward the islands
  const fleet = (t) => [[-260, 330], [-300, 380], [-340, 300], [-420, 360], [-470, 410]].map(([dx, z], k) => ({ pos: [coastX(z) + dx - 3.2 * (t - P.from), -0.15, z], yaw: Math.PI, len: 9, sail: 1, heel: 0.04 * Math.sin(t + k) }));
  const sky = (t) => {
    const k = smooth((t - P.from) / (P.to - P.from));
    return { uSunDir: [-0.88, 0.1 - 0.06 * k, 0.32], uSunCol: [3.6, 1.9 - 0.4 * k, 0.9 - 0.3 * k], uSkyTop: [0.1, 0.16, 0.36], uSkyHor: [0.95, 0.56, 0.36], uMoonDir: [0, 1, 0], uStars: 0, uCloud: 0.5, uCloudSpeed: 0.03, uMoon: 0, uFogCol: [0.6, 0.45, 0.4], uFogDen: 0.0004, uAmb: [0.16, 0.14, 0.18], uExposureSky: 1 };
  };
  // the swash: the sea's edge running up and back the gentle beach
  const level = (t) => 0.02 + 0.12 * Math.sin((t - P.from) * 0.95 + 0.6) * (0.75 + 0.25 * Math.sin((t - P.from) * 0.37));
  return worldScene(P, {
    name: 's04-hook-shore', cam, sky,
    world: coastGLSL(),
    panels: PN,
    water: [level(P.from), 0.06, 0.12, 1], waterTint: [0.03, 0.06, 0.07, 0.6],
    misc: [0, 0.6, 0, 0],
    uniforms: { uBoat: boats(fleet(P.from)) },
    update(t, u) { u.uWater.value[0] = level(t); u.uBoat.value = boats(fleet(t)); },
    drawText(ctx, t) {
      const rows = [[0, 3, 6], [0, 3, 9], [0, 3, 6, 9], [0, 4, 9], [0, 4, 9], [0, 2, 6]];
      L.forEach((l, k) => inPanel(ctx, PN, k, (c, b) => {
        const r = rows[k], ls = [];
        for (let i = 0; i < r.length - 1; i++) ls.push({ words: l.words.slice(r[i], r[i + 1]) });
        inscribe(c, t, ls, { x: 20, y: 0, w: b.w - 40, h: b.h }, { size: 1000, valign: 'middle', font: k === 5 ? 'caps' : 'italic', caps: k === 5, leading: 1.08, tint: [255, 222, 170] });
      }));
    },
    post: () => grade({ exposure: 1.05, bloom: 0.12 }),
    finish: () => FINISH,
  });
};
