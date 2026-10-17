// The hill country of the east, Shem's: ranges of dark rock folded one behind another, and up the
// spine of one ridge a great stair of cut stone climbing to a high plateau. On the plateau the path
// divides in two, and in Peleg's days the earth there splits along the line between them. Joktan's
// path runs on east across the plateau toward the far ranges where the sun comes up.
//
// Metres, y up. The stair climbs north (+z) up the ridge from z = 60 (y ~ 0) to the plateau's edge
// at z = 420 (y = 120); the plateau runs on to z ~ 900; the chasm opens along x = 0 north of z = 440.
import { fbm, vnoise, eroded, smoothstep, mix } from '/song/lib/noise.js';

export const STAIR = { z0: 60, z1: 300, w: 3.2, tread: 2.0, rise: 1.0 };
export const TOP = 120;

export const EAST = /* glsl */ `
uniform float uSplit;    // how far the chasm has opened (m)
const float Z0 = ${'${Z0}'}, Z1 = ${'${Z1}'}, SW = ${'${SW}'}, TREAD = ${'${TR}'}, RISE = ${'${RI}'}, TOPY = ${'${TOP}'};
float ranges(vec2 p, int lod) {
  // folded ranges all round, higher to the east
  float h = 190.0 * (eroded(p * 0.0011 + 4.0, lod > 0 ? 6 : 4) - 0.25) + 0.06 * max(p.x, 0.0);
  // two great peaks far to the east, Mesha and Sephar
  vec2 a = (p - vec2(1550.0, 230.0)) / 330.0, b = (p - vec2(1750.0, 1060.0)) / 360.0;
  h = max(h, 430.0 * exp(-dot(a, a) * 1.4) * (0.8 + 0.4 * fbm(p * 0.006, 4)) - 20.0);
  h = max(h, 470.0 * exp(-dot(b, b) * 1.4) * (0.8 + 0.4 * fbm(p * 0.006 + 3.0, 4)) - 20.0);
  return h;
}
float terrain(vec2 p, int lod) {
  // the ranges stand back from the ridge so it rises alone
  float corridor = smoothstep(Z0 - 400.0, Z0 - 150.0, p.y) * smoothstep(Z1 + 500.0, Z1 + 150.0, p.y);
  float h = ranges(p, lod) * mix(1.0, smoothstep(40.0, 260.0, abs(p.x)), corridor) - 30.0 * corridor * smoothstep(260.0, 60.0, abs(p.x));
  // the ridge the stair climbs, rising to the plateau
  float k = smoothstep(Z0 - 40.0, Z1, p.y);
  float ridgeY = TOPY * clamp((p.y - Z0) / (Z1 - Z0), 0.0, 1.0);
  float ridge = ridgeY - 0.02 * p.x * p.x * (1.0 - smoothstep(Z1 - 10.0, Z1 + 60.0, p.y)) - 4.0;
  // the plateau: broad and level, a little broken
  float plat = TOPY - 0.0006 * p.x * p.x * 0.15 + 3.0 * (fbm(p * 0.02, 3) - 0.5) - 6.0 * smoothstep(320.0, 520.0, abs(p.x));
  float pk = smoothstep(Z1 - 20.0, Z1 + 20.0, p.y) * smoothstep(1100.0, 900.0, p.y);
  float hill = mix(ridge, plat, pk);
  h = max(h, hill * smoothstep(-200.0, -40.0, p.y) + h * 0.0);
  // the stair: cut treads along the ridge's spine
  if (abs(p.x) < SW + 1.5 && p.y > Z0 - 2.0 && p.y < Z1 + 1.0) {
    float s = clamp(floor((p.y - Z0) / TREAD), 0.0, (Z1 - Z0) / TREAD - 1.0);
    float st = (s + 1.0) * RISE;
    float sk = smoothstep(SW + 1.5, SW, abs(p.x));
    h = mix(h, st, sk);
    // low parapets either side
    h += 0.9 * smoothstep(SW, SW + 0.25, abs(p.x)) * smoothstep(SW + 1.0, SW + 0.75, abs(p.x));
  }
  // the chasm along x = 0 north of the stair head
  if (uSplit > 0.01 && p.y > Z1 + 20.0) {
    float w = uSplit * (0.8 + 0.4 * fbm(vec2(p.y * 0.02, 0.0), 3)) * smoothstep(Z1 + 20.0, Z1 + 60.0, p.y);
    float x = abs(p.x + 3.0 * (fbm(vec2(p.y * 0.03, 1.0), 3) - 0.5));
    h -= 45.0 * smoothstep(w + 2.5, w * 0.5, x);
  }
  if (lod > 0) h += 0.1 * (fbm(p * 0.7, 3) - 0.5);
  return h;
}
float worldSD(vec3 p, out float mat) { mat = 0.0; return 1e5; }
void worldMat(float mat, vec3 p, inout vec3 n, out vec3 alb, out float rough, out vec3 emit) { alb = vec3(0.5); rough = 0.8; emit = vec3(0.0); }
void terrainMat(vec3 p, inout vec3 n, float t, out vec3 alb, out float rough, out vec3 emit) {
  emit = vec3(0.0);
  float slope = 1.0 - n.y;
  // dark grey-brown rock, slaty, with grass and thorn in the hollows
  vec3 rock = mix(vec3(0.12, 0.11, 0.1), vec3(0.28, 0.25, 0.22), fbm(p * 0.07 + vec3(0.0, p.y * 0.1, 0.0), 5));
  vec3 grass = mix(vec3(0.16, 0.17, 0.08), vec3(0.3, 0.27, 0.13), fbm(p.xz * 0.03, 4));
  alb = mix(grass, rock, smoothstep(0.18, 0.45, slope + 0.25 * (fbm(p.xz * 0.05, 3) - 0.5)));
  // the stair: dressed pale stone, joints between the slabs, worn smooth in the middle
  if (abs(p.x) < ${'${SW}'} + 1.4 && p.z > Z0 - 2.0 && p.z < Z1 + 1.0) {
    vec2 sl = vec2(p.x / 1.6 + 0.5 * floor((p.z - Z0) / TREAD), (p.z - Z0) / TREAD);
    vec2 f = fract(sl);
    float joint = smoothstep(0.0, 0.03, min(f.x, 1.0 - f.x)) * smoothstep(0.0, 0.02, min(f.y, 1.0 - f.y));
    vec3 slab = mix(vec3(0.5, 0.46, 0.4), vec3(0.62, 0.58, 0.5), hash12(floor(sl))) * (0.85 + 0.2 * fbm(p * 1.5, 3));
    slab *= 0.6 + 0.4 * joint;
    alb = mix(alb, slab, smoothstep(${'${SW}'} + 1.4, ${'${SW}'} + 1.0, abs(p.x)));
  }
  // the walls of the chasm: raw broken rock, darker going down
  alb *= mix(1.0, 0.35, smoothstep(TOPY - 2.0, TOPY - 40.0, p.y) * step(Z1 + 20.0, p.z) * smoothstep(40.0, 5.0, abs(p.x)));
  rough = 0.85;
}
vec3 worldAir(vec3 ro, vec3 rd, float depth, vec3 col) {
#ifndef NO_MOTES
  col += lifeMotes(ro, rd, depth, ro + rd * 5.0, vec3(5.0, 2.5, 5.0), 18, 0.004, vec3(0.3, 0.05, 0.3), uSunCol * 0.03, 17.0);
#endif
  return col;
}
`;
function ranges(x, z) {
  let h = 190 * (eroded(x * 0.0011 + 4, z * 0.0011 + 4, 6) - 0.25) + 0.06 * Math.max(x, 0);
  const ax = (x - 1550) / 330, az = (z - 230) / 330, bx = (x - 1750) / 360, bz = (z - 1060) / 360;
  h = Math.max(h, 430 * Math.exp(-(ax * ax + az * az) * 1.4) * (0.8 + 0.4 * fbm(x * 0.006, z * 0.006, 4)) - 20);
  h = Math.max(h, 470 * Math.exp(-(bx * bx + bz * bz) * 1.4) * (0.8 + 0.4 * fbm(x * 0.006 + 3, z * 0.006 + 3, 4)) - 20);
  return h;
}
export const PEAKS = { mesha: [1550, 230], sephar: [1750, 1060] };
export function groundY(x, z, split = 0) {
  const { z0: Z0, z1: Z1, w: SW, tread: TREAD, rise: RISE } = STAIR;
  const corridor = smoothstep(Z0 - 400, Z0 - 150, z) * smoothstep(Z1 + 500, Z1 + 150, z);
  let h = ranges(x, z) * mix(1, smoothstep(40, 260, Math.abs(x)), corridor) - 30 * corridor * smoothstep(260, 60, Math.abs(x));
  const ridgeY = TOP * Math.min(1, Math.max(0, (z - Z0) / (Z1 - Z0)));
  const ridge = ridgeY - 0.02 * x * x * (1 - smoothstep(Z1 - 10, Z1 + 60, z)) - 4;
  const plat = TOP - 0.0006 * x * x * 0.15 + 3 * (fbm(x * 0.02, z * 0.02, 3) - 0.5) - 6 * smoothstep(320, 520, Math.abs(x));
  const pk = smoothstep(Z1 - 20, Z1 + 20, z) * smoothstep(1100, 900, z);
  const hill = mix(ridge, plat, pk);
  h = Math.max(h, hill * smoothstep(-200, -40, z));
  if (Math.abs(x) < SW + 1.5 && z > Z0 - 2 && z < Z1 + 1) {
    const s = Math.min(Math.max(Math.floor((z - Z0) / TREAD), 0), (Z1 - Z0) / TREAD - 1);
    const sk = smoothstep(SW + 1.5, SW, Math.abs(x));
    h = mix(h, (s + 1) * RISE, sk);
    h += 0.9 * smoothstep(SW, SW + 0.25, Math.abs(x)) * smoothstep(SW + 1, SW + 0.75, Math.abs(x));
  }
  h += 0.1 * (fbm(x * 0.7, z * 0.7, 3) - 0.5);
  return h;
}
// the stair's tread height under z (the top of the step there)
export const stepY = (z) => (Math.min(Math.max(Math.floor((z - STAIR.z0) / STAIR.tread), 0), (STAIR.z1 - STAIR.z0) / STAIR.tread - 1) + 1) * STAIR.rise;
export const eastGLSL = () => EAST.replaceAll('${Z0}', STAIR.z0.toFixed(1)).replaceAll('${Z1}', STAIR.z1.toFixed(1)).replaceAll('${SW}', STAIR.w.toFixed(2)).replaceAll('${TR}', STAIR.tread.toFixed(2)).replaceAll('${RI}', STAIR.rise.toFixed(2)).replaceAll('${TOP}', TOP.toFixed(1));
