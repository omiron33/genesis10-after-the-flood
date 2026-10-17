// s01-hook-river: the first hook. "After the flood (after the flood) / Nations rose up from the sons of
// Noah's blood / By their clans, by their tongues, by their lands / Every nation on the map came from
// three men / Divided in the earth, let the whole world know / Genesis Ten, watch the nations grow".
// Morning on the plain below Ararat. The water that ran off the mountain comes out across the gravel
// in one stream, and the camera flies low down it, the mountain with its snow and the ark small on
// its shoulder behind. Each line of the hook stands in great pale stone letters on a gravel bar
// beside the stream, rising out of the gravel as it is sung ("Nations rose up"). At the fork the
// stream splits in three ("came from three men") and the letters of "Divided in the earth" stand
// split by a channel. On the last line the camera climbs, the three channels branch again below,
// and green spreads over the plain between them as the nations grow.
import lyrics from '/timing.js';
import { track } from '/song/lib/cam.js';
import { worldScene, panels, inPanel, facing } from '/song/lib/world.js';
import { araratGLSL, groundY, PLAIN_Y } from '/song/lib/x-ararat.js';
import { grade, FINISH, smooth } from '/song/lib/look.js';
import { inscribe, anchorAt } from '/song/lib/type.js';
export const kind = 'shader';

export default (P) => {
  const L = anchorAt(lyrics, P.from, 'After the flood', 'Nations rose up', 'By their clans', 'Every nation', 'Divided in the earth', 'Genesis Ten, watch').lines;
  const g = (x, z) => groundY(x, z);
  const WY = PLAIN_Y - 0.8;
  // the camera runs down the stream from the mountain's foot to past the fork
  const zAt = (t) => -1880 - (t - P.from) * 15.5;
  const mid = (l) => (l.start + l.end) / 2;
  // each line stands on a bar ahead of where the camera is while it is sung, alternating sides
  const side = [0, -1, 1, -1, 0, 1];
  const ahead = [46, 52, 52, 56, 50, 0];
  const big = (k, w, h) => {
    const z = zAt(mid(L[k])) - ahead[k];
    const x = 52 + side[k] * 24;
    return { c: [x, g(x, z) + h / 2 - 0.1, z], ...facing([-side[k] * 0.25, 0, 1]), w, h, depth: 1.2, kind: 'stand', mat: 'chalk', tint: [0.9, 0.88, 0.82], rough: 0.65 };
  };
  const D = [big(0, 30, 7.5), big(1, 30, 10), big(2, 30, 10), big(3, 32, 10), big(4, 30, 10)];
  // the last line lies across the plain where the camera climbs, letters very large, seen from above
  const zl = zAt(L[5].start) - 120;
  D.push({ c: [40, g(40, zl) + 0.1, zl], ...facing([0, 1, 0], [0, 0, -1]), w: 110, h: 34, depth: 2.5, kind: 'relief', mat: 'chalk', tint: [0.9, 0.88, 0.8], rough: 0.7 });
  const PN = panels(D);

  const keys = [];
  for (let t = P.from; t <= L[5].start + 0.01; t += 1.5) {
    const z = zAt(t);
    const k = L.findIndex((l) => t < l.end + 0.4);
    const target = k >= 0 && k < 5 ? D[k].c : [45, WY, z - 90];
    keys.push({ t, pos: [48 + 6 * Math.sin(t * 0.21), WY + 7.5 + 1.2 * Math.sin(t * 0.33), z], look: [target[0] * 0.6 + 48 * 0.4, target[1] * 0.7 + (WY + 4) * 0.3, Math.min(target[2], z - 30)] });
  }
  // the climb: up and out over the three channels, looking down on the last line and the green
  keys.push({ t: (L[5].start + P.to) / 2, pos: [44, WY + 70, zAt(L[5].start) - 40], look: [40, WY, zl - 10] });
  keys.push({ t: P.to, pos: [42, WY + 150, zAt(L[5].start) - 70], look: [40, WY - 20, zl - 60] });
  const cam = track(keys, { handheld: { amount: 0.4, seed: 21 }, fov: 52 });
  const sky = (t) => ({ uSunDir: [0.8, 0.27, 0.36], uSunCol: [3.4, 2.5, 1.7], uSkyTop: [0.08, 0.2, 0.52], uSkyHor: [0.66, 0.68, 0.74], uMoonDir: [0, 1, 0], uStars: 0, uCloud: 0.5, uCloudSpeed: 0.03, uMoon: 0, uFogCol: [0.55, 0.62, 0.72], uFogDen: 0.00018, uAmb: [0.14, 0.17, 0.24], uExposureSky: 1 });
  return worldScene(P, {
    name: 's01-hook-river', cam, sky,
    world: araratGLSL(),
    panels: PN,
    water: [WY, 0.012, 2.2, 1], waterTint: [0.04, 0.08, 0.09, 0.7], waterReg: [40, -2600, 1400, 0],
    misc: [1.2, 0.4, 0, 0],
    uniforms: { uArk: [40, groundY(40, 46) - 0.9, 46, 0.0], uBasin: [-22, -14, 26, -99], uDry: 0.7, uGreen: 0, uNations: [0, 0, 0, 0] },
    update(t, u) { u.uGreen.value = 0.25 + 0.75 * smooth((t - L[5].start + 0.5) / 4.5); },
    drawText(ctx, t) {
      const rows = [[0, 3, 6], [0, 3, 9], [0, 3, 6, 9], [0, 4, 9], [0, 4, 9], [0, 2, 6]];
      L.forEach((l, k) => inPanel(ctx, PN, k, (c, b) => {
        const r = rows[k], ls = [];
        for (let i = 0; i < r.length; i++) { const ws = l.words.slice(r[i], r[i + 1]); if (ws.length) ls.push({ words: ws }); }
        inscribe(c, t, ls, { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 1200, valign: 'middle', font: k === 5 ? 'block' : 'heavy', caps: k === 5, leading: 1.02, tint: [255, 255, 255] });
      }));
    },
    post: () => grade({ exposure: 1.0, bloom: 0.08 }),
    finish: () => FINISH,
  });
};
