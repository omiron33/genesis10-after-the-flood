// s02-japheth: "Japheth up first, seven sons on the roll / Gomer, Magog, Madai, let it go / Javan,
// Tubal, Meshech, Tiras, full set / Seven deep from Japheth, ain't a name you forget / Gomer had three:
// Ashkenaz, Riphath / Togarmah on the end, put the bass on that".
// The coastlands of Japheth in the late morning: a green headland ending in limestone cliffs over a
// grey-green sea. JAPHETH stands in bronze letters at the head of a row of seven standing stones
// along the cliff edge. The camera flies over the sea alongside the row, and each son's name rises
// in relief on his stone as it is sung. On "Seven deep" it climbs over the row, and the line is cut
// in white chalk through the turf behind the stones, as the old hill figures are. Then it comes down
// to Gomer's stone, where three smaller stones branch away inland for his three sons.
import lyrics from '/timing.js';
import { track } from '/song/lib/cam.js';
import { worldScene, panels, inPanel, stones, stoneFace, facing, onGround } from '/song/lib/world.js';
import { coastGLSL, groundY, coastX } from '/song/lib/x-coast.js';
import { grade, FINISH } from '/song/lib/look.js';
import { inscribe, anchorAt } from '/song/lib/type.js';
export const kind = 'shader';

export default (P) => {
  const L = anchorAt(lyrics, P.from, 'Japheth up first', 'Gomer, Magog', 'Javan, Tubal', 'Seven deep', 'Gomer had three', 'Togarmah').lines;
  const g = groundY;
  const xr = (z) => coastX(z) + 13;
  // the seven along the cliff edge, Gomer first, facing inland with the sea behind them
  const zs = [15, 10, 5, 0, -5, -10, -15];
  const H = [2.6, 2.3, 2.5, 2.4, 2.7, 2.2, 2.5];
  const row = zs.map((z, k) => ({ pos: [xr(z), g(xr(z), z) + H[k] - 0.5, z], yaw: Math.PI / 2 + 0.06 * Math.sin(k * 2.3), size: [1.05, H[k], 0.45], seed: k + 1, color: [0.5, 0.48, 0.43], rough: 0.85 }));
  // Gomer's three sons: smaller stones branching inland from his
  const G = row[0].pos;
  const sons = [[8, 5], [15, 9], [22, 13]].map(([dx, dz], k) => { const x = G[0] + dx, z = G[2] + dz; return { pos: [x, g(x, z) + 1.5, z], yaw: Math.PI / 2, size: [0.9, 1.9, 0.38], seed: 20 + k, color: [0.5, 0.48, 0.43], rough: 0.85 }; });
  const all = [...row, ...sons];
  const names = all.map((s) => { const f = stoneFace(s, { lift: 0.6, out: -0.015 }); return { c: f.c, right: f.right, up: f.up, w: s.size[0] * 1.55, h: 0.8, depth: 0.1, kind: 'relief', mat: 'stone', tint: [0.92, 0.9, 0.84], rough: 0.7 }; });
  // JAPHETH in bronze at the head of the row
  const zj = 26, xj = xr(zj) + 2;
  const J = { c: [xj, g(xj, zj) + 2.0, zj], ...facing([1, 0, -0.3]), w: 14, h: 4.0, depth: 0.6, kind: 'stand', mat: 'bronze', tint: [0.36, 0.22, 0.1], rough: 0.3, spec: 0.6 };
  // the chalk line through the turf inland of the row, read from above looking out to sea
  const zc = 0, xc = xr(zc) + 22;
  const C = { c: [xc, g(xc, zc), zc], ...onGround([-1, 0, 0]), w: 46, h: 13, depth: 1.2, kind: 'paint', rough: 0.9 };
  const PN = panels([J, C, ...names]);

  const top = (z) => g(xr(z), z);
  const at = (t, z, dx, dy, lookDy = 1.5) => ({ t, pos: [xr(z) + dx, top(z) + dy, z + 2.5], look: [xr(z), top(z) + lookDy, z - 0.5] });
  const word = (l, i) => l.words[i];
  const keys = [
    { t: P.from, pos: [xj + 26, g(xj + 26, zj + 20) + 5, zj + 22], look: [xj, g(xj, zj) + 2.2, zj] },
    { t: L[0].end - 0.4, pos: [xj + 13, g(xj + 13, zj + 4) + 3.0, zj + 4], look: [xr(18), top(18) + 1.5, 18] },
    at(word(L[1], 0).start + 0.2, zs[0], 11, 1.9),
    at(word(L[1], 2).start + 0.3, zs[2], 11, 1.9),
    at(word(L[2], 0).start + 0.2, zs[3], 11, 2.0),
    at(word(L[2], 3).start + 0.3, zs[6], 11, 2.1),
    { t: L[3].start + 1.3, pos: [xc + 34, g(xc, zc) + 30, zc - 6], look: [xc - 6, g(xc, zc), zc] },
    { t: L[3].end, pos: [xc + 26, g(xc, zc) + 26, zc + 8], look: [xc - 10, g(xc, zc), zc + 4] },
    { t: L[4].start + 1.6, pos: [sons[0].pos[0] + 8, sons[0].pos[1] + 0.8, sons[0].pos[2] + 1], look: [sons[0].pos[0], sons[0].pos[1] - 0.4, sons[0].pos[2]] },
    { t: L[5].start + 0.9, pos: [sons[2].pos[0] + 7.5, sons[2].pos[1] + 0.8, sons[2].pos[2] + 0.5], look: [sons[2].pos[0], sons[2].pos[1] - 0.2, sons[2].pos[2]] },
    { t: P.to, pos: [sons[2].pos[0] + 6.5, sons[2].pos[1] + 1.4, sons[2].pos[2] + 4], look: [sons[2].pos[0] - 25, sons[2].pos[1] - 5, sons[2].pos[2] + 12] },
  ];
  const cam = track(keys, { handheld: { amount: 0.5, seed: 33 }, fov: 38 });
  const sky = () => ({ uSunDir: [0.6, 0.4, -0.45], uSunCol: [3.4, 2.8, 2.1], uSkyTop: [0.1, 0.24, 0.56], uSkyHor: [0.62, 0.7, 0.8], uMoonDir: [0, 1, 0], uStars: 0, uCloud: 0.55, uCloudSpeed: 0.04, uMoon: 0, uFogCol: [0.58, 0.66, 0.76], uFogDen: 0.0004, uAmb: [0.14, 0.17, 0.24], uExposureSky: 1 });
  return worldScene(P, {
    name: 's02-japheth', cam, sky,
    world: coastGLSL(),
    panels: PN,
    stones: stones(all),
    water: [0, 0.35, 0.09, 1], waterTint: [0.03, 0.07, 0.07, 0.35],
    misc: [0, 0.7, 0, 0],
    uniforms: { uBoat: new Array(96).fill(0) },
    drawText(ctx, t) {
      inPanel(ctx, PN, 0, (c, b) => inscribe(c, t, [{ words: L[0].words.slice(0, 1) }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 2000, valign: 'middle', font: 'caps', caps: true, tracking: 0.06, tint: [255, 255, 255] }));
      inPanel(ctx, PN, 1, (c, b) => inscribe(c, t, [{ words: L[3].words.slice(0, 4) }, { words: L[3].words.slice(4) }], { x: 20, y: 0, w: b.w - 40, h: b.h }, { size: 1400, valign: 'middle', font: 'heavy', leading: 1.05, tint: [236, 234, 226] }));
      // one name to a stone; the words after the names ("let it go", "full set", ...) under the last name of the line
      const per = [
        [L[1].words.slice(0, 1)], [L[1].words.slice(1, 2)], [L[1].words.slice(2, 3), L[1].words.slice(3)],
        [L[2].words.slice(0, 1)], [L[2].words.slice(1, 2)], [L[2].words.slice(2, 3)], [L[2].words.slice(3, 4), L[2].words.slice(4)],
        [L[4].words.slice(0, 3), L[4].words.slice(3, 4)], [L[4].words.slice(4, 5)], [L[5].words.slice(0, 1), L[5].words.slice(1)],
      ];
      per.forEach((rows, k) => inPanel(ctx, PN, 2 + k, (c, b) => inscribe(c, t, rows.map((w) => ({ words: w })), { x: 8, y: 0, w: b.w - 16, h: b.h }, { size: rows.length > 1 ? 300 : 420, valign: 'middle', font: 'caps', leading: 1.1, tint: [255, 255, 255] })));
    },
    post: () => grade({ exposure: 1.0, bloom: 0.08 }),
    finish: () => FINISH,
  });
};
