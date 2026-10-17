// s09-mizraim: "Mizraim fathered Ludim, Anamim / Lehabim, Naphtuhim, keep it spinnin' / Pathrusim,
// Casluhim, the Philistines came from them / Caphtorim to close it, that's the end of the line for him".
// Blue hour on Mizraim's river. The camera glides upriver close under the limestone cliffs of the west
// bank. Each son's name is cut large in the cliff face inside a cartouche, lit from below by a fire on
// the bank as it is sung; the words between the names are cut smaller along the rock beneath them,
// and everything doubles in the still water.
import lyrics from '/timing.js';
import { track } from '/song/lib/cam.js';
import { worldScene, panels, inPanel, facing, fires } from '/song/lib/world.js';
import { southGLSL, groundY, riverX, RIVER_W } from '/song/lib/x-south.js';
import { grade, FINISH } from '/song/lib/look.js';
import { inscribe, anchorAt } from '/song/lib/type.js';
export const kind = 'shader';

export default (P) => {
  const L = anchorAt(lyrics, P.from, 'Mizraim fathered', 'Lehabim', 'Pathrusim', 'Caphtorim').lines;
  // what goes on the cliff, in the order it is sung: [words, size class]
  const W = (l, a, b) => l.words.slice(a, b);
  const items = [
    [W(L[0], 0, 2), 'head'], [W(L[0], 2, 3), 'name'], [W(L[0], 3, 4), 'name'],
    [W(L[1], 0, 1), 'name'], [W(L[1], 1, 2), 'name'], [W(L[1], 2), 'tail'],
    [W(L[2], 0, 1), 'name'], [W(L[2], 1, 2), 'name'], [W(L[2], 2), 'tail'],
    [W(L[3], 0, 1), 'name'], [W(L[3], 1), 'tail'],
  ];
  const t0 = (it) => it[0][0].start;
  // one stretch of cliff per line, read looking west from the river (right is -z): the heading above,
  // the names side by side in their cartouches, the rest of the line cut smaller beneath
  const face = (z) => riverX(z) - RIVER_W - 14.0;
  const sec = [868, 836, 804, 772];
  const lineOf = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3];
  const D = items.map((it, k) => {
    const s = lineOf[k], kind = it[1];
    const names = items.filter((x, j) => lineOf[j] === s && x[1] === 'name');
    const i = names.indexOf(it), n = names.length;
    const z = kind === 'name' ? sec[s] + (n === 1 ? 0 : (i === 0 ? 8.5 : -8.5)) : sec[s];
    const y = kind === 'name' ? 24 : kind === 'head' ? 31 : 15.5;
    return { c: [face(z) - (y - 20) * 0.12, y, z], ...facing([1, 0, 0]), w: kind === 'name' ? 15 : 24, h: kind === 'name' ? 5.0 : kind === 'head' ? 4.0 : 3.4, depth: 3.0, kind: 'cut', glow: kind === 'name' ? 1.5 : 1.2, tint: [0.8, 0, 0] };
  });
  const lineT = L.map((l) => l.start);
  const zAt = (t) => { let k = lineT.findIndex((x) => x > t); if (k < 0) k = 4; const a = k === 0 ? P.from - 1.5 : lineT[k - 1], b = k === 4 ? P.to + 1.5 : lineT[k]; const za = k === 0 ? 900 : sec[k - 1] + 2, zb = k === 4 ? 740 : sec[k] + 2; return za + (zb - za) * (t - a) / (b - a); };
  const PN = panels(D);
  // a fire on the bank under each name
  const fl = D.filter((_, k) => items[k][1] !== 'tail').map((d) => [riverX(d.c[2]) - RIVER_W - 5, 2.6, d.c[2], 1.6]);
  const keys = [];
  for (let t = P.from; t <= P.to + 0.01; t += 1.5) {
    const z = zAt(t);
    keys.push({ t, pos: [riverX(z) + 2 + 3 * Math.sin(t * 0.4), 5.5 + 0.6 * Math.sin(t * 0.3), z + 8], look: [face(z - 6) + 4, 22, z - 6] });
  }
  const cam = track(keys, { handheld: { amount: 0.5, seed: 109 }, fov: 50 });
  const sky = () => ({ uSunDir: [-0.8, -0.04, 0.4], uSunCol: [0.9, 0.55, 0.45], uSkyTop: [0.02, 0.04, 0.12], uSkyHor: [0.42, 0.3, 0.38], uMoonDir: [0.5, 0.35, -0.8], uStars: 0.35, uCloud: 0.3, uCloudSpeed: 0.02, uMoon: 0.4, uFogCol: [0.1, 0.1, 0.15], uFogDen: 0.0012, uAmb: [0.07, 0.07, 0.12], uExposureSky: 1 });
  return worldScene(P, {
    name: 's09-mizraim', cam, sky,
    world: southGLSL(),
    panels: PN,
    fires: fires(fl),
    water: [0, 0.015, 0.4, 1], waterTint: [0.01, 0.02, 0.025, 0.3],
    misc: [0.4, 0.2, 0, 0],
    uniforms: { uCity: new Array(64).fill(0), uDusk: 0.8 },
    drawText(ctx, t) {
      items.forEach((it, k) => inPanel(ctx, PN, k, (c, b) => {
        if (it[1] === 'name') {
          // a cartouche: a rounded frame round the name, cut as the name is sung
          const a = Math.min(1, Math.max(0, (t - t0(it) + 0.1) / 0.3));
          c.save(); c.globalAlpha = a; c.strokeStyle = 'rgb(255,214,160)'; c.lineWidth = b.h * 0.05;
          const r = b.h * 0.42; c.beginPath(); c.roundRect(b.h * 0.06, b.h * 0.06, b.w - b.h * 0.12, b.h * 0.88, r); c.stroke();
          c.beginPath(); c.moveTo(b.w - b.h * 0.06, b.h * 0.2); c.lineTo(b.w - b.h * 0.06, b.h * 0.8); c.lineWidth = b.h * 0.09; c.stroke(); c.restore();
          inscribe(c, t, [{ words: it[0] }], { x: b.h * 0.4, y: b.h * 0.12, w: b.w - b.h * 0.9, h: b.h * 0.76 }, { size: 1200, valign: 'middle', font: 'caps', caps: true, tracking: 0.05, tint: [255, 214, 160] });
        } else inscribe(c, t, [{ words: it[0] }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 900, valign: 'middle', font: it[1] === 'head' ? 'caps' : 'italic', caps: it[1] === 'head', tint: [255, 214, 160] });
      }));
    },
    post: () => grade({ exposure: 1.35, bloom: 0.14 }),
    finish: () => FINISH,
  });
};
