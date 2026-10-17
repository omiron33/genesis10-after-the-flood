// The coastlands of Japheth: a green headland breaking in pale limestone cliffs to a cold sea, a cove
// of sand and shingle north of it where boats are drawn up, and islands out to the west. The grass
// moves in gusts that run across the headland; the sea comes in in long swells and foams on the sand.
//
// Metres, y up, sea level y = 0. The shore runs roughly along z at x = coastX(z); land is +x, the sea
// and the islands -x. The headland is z < 150, the cove z 200..520.
import { fbm, vnoise, smoothstep, mix } from '/song/lib/noise.js';

export const coastX = (z) => 60 * Math.sin(z * 0.004) + 25 * Math.sin(z * 0.011 + 1.0);
const ISLES = [[-520, 180, 70, 55], [-900, -320, 110, 80], [-1500, 520, 160, 120], [-760, 980, 90, 70], [-2300, -60, 220, 150]];

export const COAST = /* glsl */ `
uniform vec4 uBoat[24];    // 12 boats: pos.xyz, yaw | length, sail (0 none .. 1 set), heel, 0
float coastXf(float z) { return 60.0 * sin(z * 0.004) + 25.0 * sin(z * 0.011 + 1.0); }
float headK(float z) { return smoothstep(185.0, 120.0, z) + smoothstep(560.0, 640.0, z); }
float isles(vec2 p) {
  // far from every island each one adds less than the sea bed's own floor (-24), so skip the noise there
  float h = -1e3, near = 0.0;
  ${ISLES.map(([x, z, r]) => `near = max(near, exp(-dot((p - vec2(${x.toFixed(1)}, ${z.toFixed(1)})) / ${r.toFixed(1)}, (p - vec2(${x.toFixed(1)}, ${z.toFixed(1)})) / ${r.toFixed(1)}) * 1.6));`).join('\n  ')}
  if (near < 1e-4) return -25.0;
  float f = fbm(p * 0.012, 3);
  ${ISLES.map(([x, z, r, hh]) => `{ vec2 q = (p - vec2(${x.toFixed(1)}, ${z.toFixed(1)})) / ${r.toFixed(1)}; float k = exp(-dot(q, q) * 1.6); h = max(h, ${hh.toFixed(1)} * k * (0.75 + 0.5 * f) - 25.0 + 30.0 * smoothstep(0.05, 0.4, k)); }`).join('\n  ')}
  return h;
}
float terrain(vec2 p, int lod) {
  float d = p.x - coastXf(p.y);
  float hk = sat(headK(p.y));
  float h;
  if (d > 0.0) {
    float beach = 0.045 * d + 7.0 * smoothstep(45.0, 150.0, d) * (0.6 + 0.6 * fbm(p * 0.015, 3));
    float cliff = 27.0 * smoothstep(-1.0, 7.0, d + 3.0 * (fbm(p * 0.05, 3) - 0.5)) + 2.5 * (fbm(vec2(p.y * 0.08, p.x * 0.3 + p.y * 0.0), 4) - 0.5) * smoothstep(-2.0, 2.0, d) * smoothstep(9.0, 4.0, d) + 10.0 * fbm(p * 0.008, 4) * smoothstep(5.0, 80.0, d);
    h = mix(beach, cliff, hk);
    h += 3.0 * (fbm(p * 0.03, lod > 0 ? 4 : 2) - 0.5) * smoothstep(6.0, 40.0, d);
  } else {
    h = -0.05 * (-d) - 1.2 * smoothstep(0.0, 30.0, -d);
    h = max(h, -24.0);
    // rocks at the foot of the cliffs
    h += hk * 3.5 * smoothstep(0.55, 0.85, fbm(p * 0.08, 3)) * smoothstep(-40.0, -2.0, d);
  }
  h = max(h, isles(p));
  if (lod > 0) h += 0.25 * (fbm(p * 0.5, 4) - 0.5) * smoothstep(-2.0, 4.0, h) + 0.05 * (vnoise(p * 5.0) - 0.5);
  return h;
}

// a boat: a long open hull of planks, high at bow and stern, a mast and a square sail
float boatSD(vec3 p, int k, out float part) {
  vec4 A = uBoat[k * 2], B = uBoat[k * 2 + 1];
  part = 0.0;
  if (B.x <= 0.0) return 1e5;
  vec3 q = p - A.xyz;
  if (dot(q, q) > (B.x + 12.0) * (B.x + 12.0)) return length(q) - B.x - 10.0;
  q.xz = mat2(cos(A.w), sin(A.w), -sin(A.w), cos(A.w)) * q.xz;
  q.xy = mat2(cos(B.z), sin(B.z), -sin(B.z), cos(B.z)) * q.xy * 0.0 + q.xy;
  q.zy = mat2(cos(B.z), -sin(B.z), sin(B.z), cos(B.z)) * q.zy;
  float L = B.x * 0.5, W = B.x * 0.12;
  float u = clamp(q.x / L, -1.0, 1.0);
  // a canoe-shaped hull from a long ellipsoid, hollowed, its gunwale sweeping up at bow and stern
  float outer = sdEllipsoid(q - vec3(0.0, 0.3 * W, 0.0), vec3(L, W * 0.8, W));
  float inner = sdEllipsoid(q - vec3(0.0, 0.36 * W, 0.0), vec3(L - 0.3, W * 0.8 - 0.06, W - 0.06));
  float sheerY = W * (0.3 + 0.8 * u * u * u * u);
  float hull = max(max(outer, -inner), q.y - sheerY);
  float d = hull;
  if (B.y > 0.0) {
    float mast = sdCapsule(q, vec3(0.0, 0.0, 0.0), vec3(0.0, B.x * 0.62, 0.0), 0.07);
    if (mast < d) { d = mast; part = 1.0; }
    // the sail: a square of cloth on a yard, bellying with the wind
    // a square sail set across the hull, bellying forward with the wind from astern
    float sw = B.x * 0.32, sh = B.x * 0.38 * B.y;
    vec3 sq = q - vec3(0.3, B.x * 0.6 - sh * 0.5, 0.0);
    float belly = B.x * 0.05 * (1.0 - pow(clamp(sq.z / sw, -1.0, 1.0), 2.0)) * (1.0 - 0.5 * pow(clamp(sq.y / max(sh * 0.5, 0.01), -1.0, 1.0), 2.0));
    float sail = max(max(abs(sq.z) - sw, abs(sq.y) - sh * 0.5), abs(sq.x - belly) - 0.03) * 0.8;
    float yard = sdCapsule(q, vec3(0.3, B.x * 0.6, -sw - 0.2), vec3(0.3, B.x * 0.6, sw + 0.2), 0.05);
    sail = min(sail, yard);
    if (sail < d) { d = sail; part = 2.0; }
  }
  return d;
}
float worldSD(vec3 p, out float mat) {
  float d = 1e5; mat = 0.0;
  for (int k = 0; k < 12; k++) {
    float part; float b = boatSD(p, k, part);
    if (b < d) { d = b; mat = 10.0 + part + float(k) * 0.01; }
  }
  return d;
}
void worldMat(float mat, vec3 p, inout vec3 n, out vec3 alb, out float rough, out vec3 emit) {
  emit = vec3(0.0);
  float part = floor(mat - 10.0 + 0.005);
  int k = int(floor(fract(mat - 10.0 + 0.0001) * 100.0 + 0.5));
  if (part < 0.5) {
    // a tarred hull, planks lapped along it, the tar worn off along the strakes
    vec3 q = p - uBoat[k * 2].xyz;
    float strake = fract(q.y / 0.16 + 0.3 * sin(q.x * 0.4));
    alb = vec3(0.05, 0.042, 0.038) * (0.8 + 0.5 * fbm(p * 3.0, 3)) * (0.7 + 0.3 * smoothstep(0.0, 0.2, strake));
    alb = mix(alb, vec3(0.26, 0.2, 0.13), smoothstep(0.06, 0.0, abs(q.y - uBoat[k * 2 + 1].x * 0.12 * 0.42)) * 0.8);
    rough = 0.55;
  } else if (part < 1.5) {
    alb = vec3(0.3, 0.24, 0.17); rough = 0.8;
  } else {
    // undyed wool sail, a little weathered
    alb = vec3(0.72, 0.66, 0.56) * (0.85 + 0.2 * fbm(p * 2.0, 3)); rough = 0.95;
  }
}
void terrainMat(vec3 p, inout vec3 n, float t, out vec3 alb, out float rough, out vec3 emit) {
  emit = vec3(0.0);
  float slope = 1.0 - n.y;
  float d = p.x - coastXf(p.z);
  // grass: wind-combed, the gusts running across it as lighter streaks
  float gust = lifeGust(p.xz * 0.15, normalize(vec2(-0.3, 1.0)), 0.6);
  vec3 grass = mix(vec3(0.07, 0.13, 0.04), vec3(0.17, 0.24, 0.07), fbm(p.xz * 0.08, 4));
  grass = mix(grass, vec3(0.3, 0.32, 0.14), 0.25 * smoothstep(0.3, 0.9, gust) * vnoise(p.xz * vec2(1.0, 6.0) + gust));
  grass *= 0.8 + 0.3 * vnoise(p.xz * 3.0);
  // limestone: pale grey-ochre, bedded, darker in the cracks
  vec3 rock = mix(vec3(0.36, 0.35, 0.31), vec3(0.58, 0.55, 0.48), fbm(p * 0.12 + vec3(0.0, p.y * 0.2, 0.0), 5));
  float bed = fract(p.y * 0.45 + 0.8 * fbm(p.xz * 0.04, 3));
  rock *= 0.7 + 0.35 * smoothstep(0.0, 0.25, bed) * smoothstep(1.0, 0.8, bed);
  rock *= 1.0 - 0.45 * smoothstep(0.62, 0.8, fbm(vec2(p.x + p.z, p.y * 0.12) * 0.7, 4));   // dark weathering streaks down the face
  rock *= 1.0 - 0.5 * smoothstep(0.03, 0.0, abs(fbm(vec2((p.x + p.z) * 0.35, p.y * 0.05), 3) - 0.5));  // vertical cracks
  // sand and shingle: wet and dark below the swash line
  vec3 sand = mix(vec3(0.56, 0.5, 0.4), vec3(0.66, 0.6, 0.48), fbm(p.xz * 0.4, 3));
  float shingle = smoothstep(1.4, 2.6, p.y) * smoothstep(0.4, 0.7, fbm(p.xz * 0.9, 3));
  sand = mix(sand, vec3(0.32, 0.31, 0.29) * (0.7 + 0.6 * vnoise(p.xz * 14.0)), shingle * 0.7);
  float wet = smoothstep(0.75, 0.15, p.y + 0.15 * sin(uTime * 0.7 + p.z * 0.05));
  sand = mix(sand, sand * 0.45, wet);
  float hk = sat(headK(p.z));
  float sandK = (1.0 - hk) * smoothstep(9.0, 3.0, p.y) + smoothstep(1.0, -0.5, p.y);
  alb = mix(grass, rock, smoothstep(0.35, 0.6, slope));
  alb = mix(alb, sand, sat(sandK) * smoothstep(0.6, 0.35, slope));
  rough = mix(0.9, 0.3, wet * sat(sandK));
  // under the sea: dark weed on the rocks
  alb = mix(alb, vec3(0.05, 0.07, 0.05), smoothstep(-0.5, -3.0, p.y));
}
vec3 worldAir(vec3 ro, vec3 rd, float depth, vec3 col) {
#ifndef NO_MOTES
  col += lifeMotes(ro, rd, depth, ro + rd * 5.0, vec3(5.0, 2.5, 5.0), 18, 0.004, vec3(0.2, 0.0, 0.8), uSunCol * 0.03, 5.0);
#endif
  return col;
}
`;

// the land's height in JavaScript (the GLSL terrain at lod 1)
const headK = (z) => smoothstep(185, 120, z) + smoothstep(560, 640, z);
function isles(x, z) {
  let h = -1e3;
  for (const [ix, iz, r, hh] of ISLES) {
    const qx = (x - ix) / r, qz = (z - iz) / r, k = Math.exp(-(qx * qx + qz * qz) * 1.6);
    h = Math.max(h, hh * k * (0.75 + 0.5 * fbm(x * 0.012, z * 0.012, 3)) - 25 + 30 * smoothstep(0.05, 0.4, k));
  }
  return h;
}
export function groundY(x, z) {
  const d = x - coastX(z);
  const hk = Math.min(1, Math.max(0, headK(z)));
  let h;
  if (d > 0) {
    const beach = 0.045 * d + 7 * smoothstep(45, 150, d) * (0.6 + 0.6 * fbm(x * 0.015, z * 0.015, 3));
    const cliff = 27 * smoothstep(-1, 7, d + 3 * (fbm(x * 0.05, z * 0.05, 3) - 0.5)) + 2.5 * (fbm(z * 0.08, x * 0.3, 4) - 0.5) * smoothstep(-2, 2, d) * smoothstep(9, 4, d) + 10 * fbm(x * 0.008, z * 0.008, 4) * smoothstep(5, 80, d);
    h = mix(beach, cliff, hk);
    h += 3 * (fbm(x * 0.03, z * 0.03, 4) - 0.5) * smoothstep(6, 40, d);
  } else {
    h = Math.max(-0.05 * -d - 1.2 * smoothstep(0, 30, -d), -24);
    h += hk * 3.5 * smoothstep(0.55, 0.85, fbm(x * 0.08, z * 0.08, 3)) * smoothstep(-40, -2, d);
  }
  h = Math.max(h, isles(x, z));
  h += 0.25 * (fbm(x * 0.5, z * 0.5, 4) - 0.5) * smoothstep(-2, 4, h) + 0.05 * (vnoise(x * 5, z * 5) - 0.5);
  return h;
}
export function boats(list) {
  const u = new Array(96).fill(0);
  list.forEach((b, k) => { [...b.pos, b.yaw ?? 0, b.len ?? 9, b.sail ?? 0, b.heel ?? 0, 0].forEach((v, i) => { u[k * 8 + i] = v; }); });
  return u;
}
// the centre and axes of the back of a boat's sail (seen from astern), for a panel
export function sailBack(b) {
  const L = b.len ?? 9, sh = L * 0.38 * (b.sail ?? 1);
  return { c: boatToWorld(b, [0.3 - 0.06, L * 0.6 - sh * 0.5 + (b.pos[1] - b.pos[1]), 0]), N: boatDir(b, [-1, 0, 0]), w: L * 0.6, h: sh * 0.9 };
}
// a point in a boat's frame (x along it, y up, z across) in the world
export function boatToWorld(b, l) {
  const c = Math.cos(b.yaw ?? 0), s = Math.sin(b.yaw ?? 0);
  return [b.pos[0] + c * l[0] + s * l[2], b.pos[1] + l[1], b.pos[2] - s * l[0] + c * l[2]];
}
export const boatDir = (b, l) => { const c = Math.cos(b.yaw ?? 0), s = Math.sin(b.yaw ?? 0); return [c * l[0] + s * l[2], l[1], -s * l[0] + c * l[2]]; };
export const coastGLSL = () => COAST;
