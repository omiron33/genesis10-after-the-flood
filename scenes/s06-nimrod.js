// s06-nimrod: "Then Cush fathered Nimrod, the earth heard him comin' / First mighty man on the earth,
// built strong / Mighty hunter before the LORD, that's the saying passed on: / "Like Nimrod, a mighty
// hunter before the LORD" / His kingdom began where the empires were born".
// Late afternoon on the floodplain. On "the earth heard him comin'" a colossal stele of black basalt
// shoulders up out of the ground, dust running off it, NIMROD in gold across its foot. The camera
// climbs its face register by register, each line set in raised gold as it is sung, the saying set
// apart in italic inside a frame. At the top it rises clear of the stele and looks north up the
// plain to the walled cities standing in the haze: where the empires were born.
import lyrics from '/timing.js';
import { track } from '/song/lib/cam.js';
import { worldScene, panels, inPanel, facing, placePanel } from '/song/lib/world.js';
import { southGLSL, groundY, riverX, cities, stele } from '/song/lib/x-south.js';
import { CITIES } from '/song/lib/cities.js';
import { grade, FINISH, clamp01 } from '/song/lib/look.js';
import { inscribe, anchorAt } from '/song/lib/type.js';
import { weight } from '/kit/motion.js';
export const kind = 'shader';

export default (P) => {
  const L = anchorAt(lyrics, P.from, 'Then Cush fathered', 'First mighty man', 'Mighty hunter', '"Like Nimrod', 'His kingdom began').lines;
  const g = groundY;
  const SZ = -420, SX = riverX(SZ) + 470, G = g(SX, SZ);
  const HH = 8.2;
  // the stele comes up out of the earth while "the earth heard him comin'" is sung
  const heard = L[0].words.find((w) => /heard/.test(w.w));
  const rise = (t) => weight.heavy(clamp01((t - P.from + 0.1) / 1.9));
  const HW = 2.8, HD = 0.8;
  const yAt = (t) => G - HH - 0.6 + (2 * HH + 0.6 - 0.2) * rise(t);   // the stele's centre: from buried to standing on the ground
  // its face looks west (-x), toward the low sun
  const N = [-1, 0, 0], F = facing(N);
  // five registers up its sunk face, from the foot to the crown
  const REG = [[-6.0, 2.3], [-3.2, 1.8], [-0.5, 1.8], [2.4, 2.3], [5.2, 1.7]];
  const reg = (t, k) => ({ c: [SX - HD + 0.035, yAt(t) - 0.2 + REG[k][0], SZ], right: F.right, up: F.up, w: 4.5, h: REG[k][1], depth: 0.07, kind: 'relief', mat: 'gold', tint: [0.95, 0.68, 0.3], rough: 0.25, spec: 0.7 });
  const PN = panels([0, 1, 2, 3, 4].map((k) => reg(P.to, k)));
  const top = G + 2 * HH;
  const yReg = (k) => G + HH + REG[k][0];
  const keys = [
    { t: P.from, pos: [SX - 26, G + 1.2, SZ - 10], look: [SX, G + 4.0, SZ] },
    { t: heard.start + 0.6, pos: [SX - 17, G + 1.6, SZ - 6], look: [SX, yReg(0) + 0.8, SZ] },
    { t: L[1].start + 1.2, pos: [SX - 13, yReg(1) - 1.2, SZ - 5], look: [SX, yReg(1), SZ] },
    { t: L[2].start + 1.4, pos: [SX - 12, yReg(2) - 0.6, SZ - 3], look: [SX, yReg(2), SZ] },
    { t: L[3].start + 1.4, pos: [SX - 12, yReg(3) + 0.2, SZ - 1], look: [SX, yReg(3), SZ] },
    { t: L[4].start + 1.0, pos: [SX - 11, yReg(4) + 1.0, SZ + 1], look: [SX, yReg(4), SZ] },
    { t: P.to, pos: [SX - 7, top + 9, SZ - 4], look: [SX - 250, G + 12, SZ + 720] },
  ];
  const cam = track(keys, { handheld: { amount: 0.5, seed: 77 }, fov: 48 });
  const sky = () => ({ uSunDir: [-0.8, 0.14, -0.4], uSunCol: [3.6, 2.0, 0.95], uSkyTop: [0.05, 0.12, 0.34], uSkyHor: [0.95, 0.6, 0.38], uMoonDir: [0, 1, 0], uStars: 0, uCloud: 0.5, uCloudSpeed: 0.02, uMoon: 0, uFogCol: [0.72, 0.56, 0.42], uFogDen: 0.0009, uAmb: [0.15, 0.13, 0.15], uExposureSky: 1 });
  return worldScene(P, {
    name: 's06-nimrod', cam, sky,
    world: southGLSL(),
    panels: PN,
    misc: [0, 0.4, 0, 0],
    uniforms: { uCity: cities(CITIES), uDusk: 0.1, uStele: stele([SX, yAt(P.from), SZ], -Math.PI / 2, [HW, HH, HD]) },
    update(t, u) {
      u.uStele.value = stele([SX, yAt(t), SZ], -Math.PI / 2, [HW, HH, HD]);
      for (let k = 0; k < 5; k++) placePanel(u.uP.value, k, reg(t, k));
    },
    drawText(ctx, t) {
      inPanel(ctx, PN, 0, (c, b) => inscribe(c, t, [{ words: L[0].words.slice(0, 3) }, { words: [L[0].words[3]] }, { words: L[0].words.slice(4) }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 600, valign: 'middle', font: 'caps', caps: true, leading: 1.0, tint: [255, 255, 255] }));
      inPanel(ctx, PN, 1, (c, b) => inscribe(c, t, [{ words: L[1].words.slice(0, 3) }, { words: L[1].words.slice(3) }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 600, valign: 'middle', font: 'caps', caps: true, leading: 1.05, tint: [255, 255, 255] }));
      inPanel(ctx, PN, 2, (c, b) => inscribe(c, t, [{ words: L[2].words.slice(0, 4) }, { words: L[2].words.slice(4) }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 600, valign: 'middle', font: 'caps', caps: true, leading: 1.05, tint: [255, 255, 255] }));
      inPanel(ctx, PN, 3, (c, b) => {
        // the saying, set apart in a frame
        c.save(); c.globalAlpha = Math.min(1, Math.max(0, (t - L[3].start + 0.3) / 0.4)); c.strokeStyle = '#fff'; c.lineWidth = b.h * 0.035; c.strokeRect(b.h * 0.05, b.h * 0.05, b.w - b.h * 0.1, b.h * 0.9); c.restore();
        inscribe(c, t, [{ words: L[3].words.slice(0, 4) }, { words: L[3].words.slice(4) }], { x: b.h * 0.15, y: b.h * 0.1, w: b.w - b.h * 0.3, h: b.h * 0.8 }, { size: 600, valign: 'middle', font: 'italic', leading: 1.1, tint: [255, 255, 255] });
      });
      inPanel(ctx, PN, 4, (c, b) => inscribe(c, t, [{ words: L[4].words.slice(0, 4) }, { words: L[4].words.slice(4) }], { x: 10, y: 0, w: b.w - 20, h: b.h }, { size: 600, valign: 'middle', font: 'caps', caps: true, leading: 1.05, tint: [255, 255, 255] }));
    },
    post: () => grade({ exposure: 0.95, bloom: 0.1 }),
    finish: () => FINISH,
  });
};
