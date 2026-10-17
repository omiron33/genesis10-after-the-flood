// s03-javan: "Javan had four, coastline flow / Elishah, Tarshish, Kittim, Dodanim, go / From these the
// coastland peoples spread through their lands / Each with his own tongue, his clan, his nation,
// understand".
// Noon in the cove north of the headland. JAVAN HAD FOUR stands in driftwood letters on the sand;
// beyond it four black boats are drawn up along the shore, and each son's name is painted in white
// along a hull as it is sung, the camera walking the waterline past them. Then it lifts off the beach
// and follows boats already out on the water, sailing west for the islands: the coastland peoples
// spreading. The third line is painted across the backs of three sails, the fourth across four more
// further out, one phrase to a sail, the boats drawing apart as they go.
import lyrics from '/timing.js';
import { track } from '/song/lib/cam.js';
import { worldScene, panels, inPanel, facing, placePanel } from '/song/lib/world.js';
import { coastGLSL, groundY, coastX, boats, boatToWorld, boatDir, sailBack } from '/song/lib/x-coast.js';
import { grade, FINISH } from '/song/lib/look.js';
import { inscribe, anchorAt } from '/song/lib/type.js';
export const kind = 'shader';

export default (P) => {
  const L = anchorAt(lyrics, P.from, 'Javan had four', 'Elishah', 'From these the coastland', 'Each with his own').lines;
  const g = groundY;
  const zb = [300, 315, 330, 345];
  // the four drawn up along the shore, lying parallel to the water
  const beached = zb.map((z, k) => { const x = coastX(z) + 13 + 1.5 * Math.sin(k * 1.7); return { pos: [x, g(x, z) + 0.75, z], yaw: Math.PI / 2 + 0.08 * Math.sin(k * 2.9), len: 10, sail: 0, heel: 0.06 * (k % 2 ? 1 : -1) }; });
  // seven under sail, heading west for the islands at different distances and speeds
  const sailing = [[-40, 352, 3.6], [-62, 366, 3.2], [-52, 338, 4.0], [-110, 360, 3.4], [-128, 344, 3.0], [-95, 330, 3.8], [-140, 374, 3.1]];
  const sx = (k, t) => coastX(sailing[k][1]) + sailing[k][0] - sailing[k][2] * (t - P.from);
  const sb = (k, t) => ({ pos: [sx(k, t), -0.15 + 0.08 * Math.sin(t * 1.3 + k), sailing[k][1] + 0.6 * Math.sin(t * 0.4 + k)], yaw: Math.PI + 0.05 * Math.sin(t * 0.5 + k * 1.3), len: 9, sail: 1, heel: 0.05 * Math.sin(t * 0.8 + k) });
  const fleet = (t) => [...beached, ...sailing.map((_, k) => sb(k, t))];

  // JAVAN HAD FOUR in driftwood on the sand south of the boats
  const zj = 282, xj = coastX(zj) + 12;
  const J = { c: [xj, g(xj, zj) + 1.15, zj], ...facing([-1, 0, -0.35]), w: 11, h: 2.4, depth: 0.45, kind: 'stand', mat: 'wood', tint: [0.55, 0.5, 0.44], rough: 0.85 };
  // a name along each hull's seaward side
  const hulls = beached.map((b) => ({ c: boatToWorld(b, [0, 0.42, -1.05]), ...facing(boatDir(b, [0, 0, -1])), w: 6.0, h: 0.62, depth: 0.45, kind: 'paint', rough: 0.6 }));
  // phrases on the backs of the sails
  const sailPanel = (k, t) => { const b = sb(k, t), s = sailBack(b); return { c: boatToWorld(b, [0.52, b.len * 0.6 - s.h / 0.9 * 0.5, 0]), ...facing(s.N), w: s.w * 0.95, h: s.h * 0.8, depth: 0.4, kind: 'paint', rough: 0.9 }; };
  const sails = sailing.map((_, k) => sailPanel(k, P.from));
  const PN = panels([J, ...hulls, ...sails]);

  const word = (l, i) => l.words[i];
  const wx = (z) => coastX(z) + 3.5;
  const keys = [
    { t: P.from, pos: [wx(270) - 2, 2.0, 268], look: [xj, g(xj, zj) + 1.1, zj] },
    { t: L[0].end, pos: [wx(288), 2.0, 289], look: [beached[0].pos[0], 1.2, zb[0] + 2] },
    { t: word(L[1], 0).start + 0.3, pos: [wx(zb[0]), 2.0, zb[0] - 2.5], look: [beached[0].pos[0], beached[0].pos[1], zb[0]] },
    { t: word(L[1], 1).start + 0.3, pos: [wx(zb[1]), 2.0, zb[1] - 2.5], look: [beached[1].pos[0], beached[1].pos[1], zb[1]] },
    { t: word(L[1], 2).start + 0.3, pos: [wx(zb[2]), 2.1, zb[2] - 2.5], look: [beached[2].pos[0], beached[2].pos[1], zb[2]] },
    { t: word(L[1], 3).start + 0.4, pos: [wx(zb[3]), 2.3, zb[3] - 2.0], look: [beached[3].pos[0], beached[3].pos[1], zb[3]] },
  ];
  // then lift off the beach and follow the boats out, a little above and behind their sails
  const behind = (t, ks, back, up) => {
    const c = ks.map((k) => sailPanel(k, t).c).reduce((a, b) => a.map((v, i) => v + b[i] / ks.length), [0, 0, 0]);
    return { t, pos: [c[0] + back, c[1] + up, c[2] - 3], look: [c[0] - 4, c[1] - 0.5, c[2]] };
  };
  keys.push(behind(L[2].start + 0.9, [0], 15, 2.5));
  keys.push(behind(L[2].end, [0], 14, 3));
  keys.push(behind(L[3].start + 1.1, [3], 15, 3));
  keys.push(behind(P.to, [3], 16, 5));
  const cam = track(keys, { handheld: { amount: 0.5, seed: 44 }, fov: 46 });
  const sky = () => ({ uSunDir: [0.4, 0.62, -0.4], uSunCol: [3.4, 3.0, 2.5], uSkyTop: [0.09, 0.24, 0.58], uSkyHor: [0.6, 0.7, 0.82], uMoonDir: [0, 1, 0], uStars: 0, uCloud: 0.45, uCloudSpeed: 0.05, uMoon: 0, uFogCol: [0.6, 0.68, 0.78], uFogDen: 0.00035, uAmb: [0.15, 0.18, 0.25], uExposureSky: 1 });
  return worldScene(P, {
    name: 's03-javan', cam, sky,
    world: coastGLSL(),
    panels: PN,
    water: [0, 0.3, 0.1, 1], waterTint: [0.02, 0.08, 0.08, 0.45],
    misc: [0, 0.8, 0, 0],
    uniforms: { uBoat: boats(fleet(P.from)) },
    update(t, u) {
      u.uBoat.value = boats(fleet(t));
      sailing.forEach((_, k) => placePanel(u.uP.value, 5 + k, sailPanel(k, t)));
    },
    drawText(ctx, t) {
      inPanel(ctx, PN, 0, (c, b) => inscribe(c, t, [{ words: L[0].words.slice(0, 3) }, { words: L[0].words.slice(3) }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 1200, valign: 'middle', font: 'block', caps: true, leading: 1.0, tint: [255, 255, 255] }));
      L[1].words.slice(0, 4).forEach((w, k) => inPanel(ctx, PN, 1 + k, (c, b) => inscribe(c, t, [{ words: k === 3 ? [w, L[1].words[4]] : [w] }], { x: 20, y: 0, w: b.w - 40, h: b.h }, { size: 600, valign: 'middle', font: 'sans', caps: true, tracking: 0.08, tint: [240, 238, 230] })));
      // each line whole on one sail, in rows
      inPanel(ctx, PN, 5, (c, b) => inscribe(c, t, [{ words: L[2].words.slice(0, 3) }, { words: L[2].words.slice(3, 5) }, { words: L[2].words.slice(5) }], { x: 30, y: 0, w: b.w - 60, h: b.h }, { size: 600, valign: 'middle', font: 'heavy', leading: 1.12, tint: [120, 30, 24] }));
      inPanel(ctx, PN, 8, (c, b) => inscribe(c, t, [{ words: L[3].words.slice(0, 5) }, { words: L[3].words.slice(5, 9) }, { words: L[3].words.slice(9) }], { x: 30, y: 0, w: b.w - 60, h: b.h }, { size: 600, valign: 'middle', font: 'heavy', leading: 1.12, tint: [120, 30, 24] }));
    },
    post: () => grade({ exposure: 0.98, bloom: 0.08 }),
    finish: () => FINISH,
  });
};
