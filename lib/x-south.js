// The lands of Ham: a great river running north through hot country. On its west side limestone
// cliffs stand over the water (Mizraim's river); on its east side a flat floodplain of dark fields
// gives way to open sand and dunes (Cush), and on the plain stand the walled brick cities of Nimrod,
// each with gate towers, a stepped temple tower and a crowd of flat-roofed houses.
//
// Metres, y up, the river's water at y = 0. The river runs along z at x = riverX(z); east is +x.
import { fbm, vnoise, smoothstep, mix } from '/song/lib/noise.js';

export const riverX = (z) => 40 * Math.sin(z * 0.0025) + 15 * Math.sin(z * 0.009 + 2.0);
export const RIVER_W = 34;

export const SOUTH = /* glsl */ `
uniform vec4 uCity[16];    // 8 cities: x, z, radius, height | gate yaw, temple height, houses (0/1), 0
uniform float uDusk;       // 0 day .. 1 night: torches and window light
uniform vec4 uStele[2];    // a stele: pos.xyz (centre), yaw | half width, half height, half depth, 0
float riverXf(float z) { return 40.0 * sin(z * 0.0025) + 15.0 * sin(z * 0.009 + 2.0); }
float terrain(vec2 p, int lod) {
  float rx = riverXf(p.y);
  float d = p.x - rx;                                    // east of the river > 0
  // the floodplain
  float h = 1.6 + 0.6 * (fbm(p * 0.01, 3) - 0.5) + 0.002 * max(d - 40.0, 0.0);
  // the river's channel
  h = mix(-3.5, h, smoothstep(${'${RW}'} - 6.0, ${'${RW}'} + 6.0, abs(d)));
  // the west cliffs: a limestone plateau standing over the water
  float wc = -(d + ${'${RW}'} + 10.0) + 6.0 * (fbm(vec2(p.y * 0.01, 0.0), 3) - 0.5);
  float cliff = 46.0 * smoothstep(0.0, 9.0, wc) + 6.0 * fbm(p * 0.01, 3) * smoothstep(9.0, 60.0, wc);
  cliff += 3.0 * (fbm(vec2(p.y * 0.07, p.x * 0.05), 4) - 0.5) * smoothstep(-2.0, 2.0, wc) * smoothstep(12.0, 5.0, wc);
  h = max(h, cliff - 0.0 + min(h, 0.0) * 0.0 + (wc > -1.0 ? 0.0 : -100.0));
  // the dunes of the open desert far to the east
  float dk = smoothstep(500.0, 800.0, d);
  if (dk > 0.0) {
    vec2 q = p * 0.012 + vec2(fbm(p * 0.002, 3), fbm(p * 0.002 + 5.0, 3)) * 2.0;
    float ridge = 1.0 - abs(sin(q.x * 3.0 + 0.6 * sin(q.y * 1.3)));
    h += dk * (14.0 * pow(ridge, 1.6) * (0.6 + 0.6 * fbm(p * 0.004, 3)) + 6.0 * fbm(p * 0.006, 3));
  }
  if (lod > 0) h += 0.12 * (fbm(p * 0.6, 4) - 0.5) + 0.03 * (vnoise(p * 6.0) - 0.5);
  return h;
}

// a walled city: a ring wall with crenellations, two gate towers, a stepped temple tower in the middle
// and flat-roofed houses packed inside
float citySD(vec3 p, int k, out float part) {
  vec4 A = uCity[k * 2], B = uCity[k * 2 + 1];
  part = 0.0;
  if (A.z <= 0.0) return 1e5;
  vec3 q = p - vec3(A.x, 0.0, A.y);
  float R = A.z, H = A.w;
  float r = length(q.xz);
  if (r > R + 40.0) return r - R - 30.0;
  q.xz = mat2(cos(B.x), sin(B.x), -sin(B.x), cos(B.x)) * q.xz;     // the gate faces local +z
  float base = 1.4;
  // the wall, with crenels along its top
  float wall = max(abs(r - R) - 2.2, abs(q.y - base - H * 0.5) - H * 0.5);
  float ang = atan(q.x, q.z) * R;
  float cren = max(abs(fract(ang / 2.4) - 0.5) - 0.22, -(q.y - base - H));
  wall = max(wall, -max(max(cren, abs(r - R) - 2.5), -(q.y - base - H + 0.9)));
  // buttresses along the outside
  float but = max(max(abs(fract(ang / 9.0) - 0.5) * 9.0 - 1.0, abs(r - R - 2.4) - 1.0), abs(q.y - base - H * 0.47) - H * 0.47);
  wall = min(wall, but);
  // the gate: an arch through the wall between two towers
  vec3 gq = q - vec3(0.0, base, R);
  float towers = sdBox(vec3(abs(gq.x) - 7.5, gq.y - (H + 6.0) * 0.5, gq.z), vec3(4.5, (H + 6.0) * 0.5, 4.0));
  float d = min(wall, towers);
  float arch = min(sdBox(gq - vec3(0.0, 3.0, 0.0), vec3(2.6, 3.0, 8.0)), length(gq.xy - vec2(0.0, 6.0)) - 2.6);
  arch = max(arch, abs(gq.z) - 8.0);
  d = max(d, -arch);
  // crenels on the towers
  if (towers < 0.5) d = max(d, -max(abs(fract(gq.x / 2.2) - 0.5) * 2.2 - 0.5, -(gq.y - H - 5.2)));
  part = towers < wall + 0.01 ? 1.0 : 0.0;
  // the temple tower: three stepped stages and a shrine
  float th = B.y;
  if (th > 0.0) {
    vec3 tq = q - vec3(0.0, base, -R * 0.15);
    float zig = sdBox(tq - vec3(0.0, th * 0.2, 0.0), vec3(R * 0.32, th * 0.2, R * 0.32));
    zig = min(zig, sdBox(tq - vec3(0.0, th * 0.55, 0.0), vec3(R * 0.22, th * 0.15, R * 0.22)));
    zig = min(zig, sdBox(tq - vec3(0.0, th * 0.82, 0.0), vec3(R * 0.13, th * 0.12, R * 0.13)));
    zig = min(zig, sdBox(tq - vec3(0.0, th * 1.0, 0.0), vec3(R * 0.06, th * 0.06, R * 0.06)));
    // the stair up its face
    zig = min(zig, max(sdBox(tq - vec3(0.0, th * 0.35, R * 0.4), vec3(2.0, th * 0.35, R * 0.12)), dot(tq - vec3(0.0, th * 0.7, R * 0.28), normalize(vec3(0.0, 1.0, 1.4)))));
    if (zig < d) { d = zig; part = 2.0; }
  }
  // houses: flat-roofed boxes on a jittered grid inside the wall
  if (B.z > 0.5 && r < R - 4.0) {
    vec2 cell = floor(q.xz / 9.0), f = q.xz - (cell + 0.5) * 9.0;
    float hh = hash12(cell + float(k) * 13.0);
    vec2 o = (hash22(cell + 7.0) - 0.5) * 2.0;
    float hs = 2.5 + 2.5 * hh;
    float house = sdBox(vec3(f.x - o.x, q.y - base - hs * 0.5, f.y - o.y), vec3(3.0 + o.y * 0.5, hs * 0.5, 2.8 - o.x * 0.4));
    // clear the temple's court
    house = max(house, -(length(q.xz - vec2(0.0, -R * 0.15)) - R * 0.42));
    if (house < d) { d = house; part = 3.0; }
  }
  return d;
}
// a stele of black basalt with an arched top, its face sunk within a raised border
float steleSD(vec3 p) {
  vec4 A = uStele[0], B = uStele[1];
  if (B.x <= 0.0) return 1e5;
  vec3 q = p - A.xyz;
  if (dot(q, q) > dot(B.xyz, B.xyz) * 2.0 + 9.0) return length(q) - length(B.xyz) - 2.0;
  q.xz = mat2(cos(A.w), sin(A.w), -sin(A.w), cos(A.w)) * q.xz;
  q.xz *= 1.0 + 0.015 * sat((q.y + B.y) / (2.0 * B.y));
  float d = sdBox(q, B.xyz - 0.04) - 0.04;
  d = max(d, length(vec2(q.x, max(q.y - (B.y - B.x), 0.0))) - B.x);
  vec3 fq = q - vec3(0.0, -0.2, B.z);
  float inset = max(sdBox(fq, vec3(B.x - 0.32, B.y - 0.7, 0.035)), length(vec2(fq.x, max(fq.y - (B.y - B.x - 0.4), 0.0))) - (B.x - 0.32));
  d = max(d, -inset);
  d += 0.004 * (vnoise(q * 9.0) - 0.5);
  return d * 0.9;
}
float worldSD(vec3 p, out float mat) {
  float d = steleSD(p); mat = d < 1e4 ? 20.0 : 0.0;
  for (int k = 0; k < 8; k++) {
    float part; float c = citySD(p, k, part);
    if (c < d) { d = c; mat = 10.0 + part + float(k) * 0.01; }
  }
  return d;
}
void worldMat(float mat, vec3 p, inout vec3 n, out vec3 alb, out float rough, out vec3 emit) {
  emit = vec3(0.0);
  if (mat > 19.5) {
    // basalt: black, finely grained, polished on the face, dusty at the foot
    vec3 q = p - uStele[0].xyz;
    alb = vec3(0.035, 0.034, 0.033) * (0.85 + 0.3 * fbm(p * 4.0, 4));
    alb = mix(alb, vec3(0.3, 0.24, 0.17), smoothstep(-uStele[1].y + 1.2, -uStele[1].y, q.y) * 0.7);
    rough = 0.3;
    return;
  }
  float part = floor(mat - 10.0 + 0.005);
  // sun-dried mud brick: coursed, pale where the plaster has held, dark where it has fallen
  vec2 b = vec2((p.x + p.z) / 0.4, p.y / 0.1);
  b.x += 0.5 * mod(floor(b.y), 2.0);
  vec2 f = fract(b);
  float mortar = smoothstep(0.0, 0.08, min(f.x, 1.0 - f.x) * 0.4) * smoothstep(0.0, 0.12, min(f.y, 1.0 - f.y));
  vec3 brick = mix(vec3(0.42, 0.3, 0.2), vec3(0.55, 0.42, 0.29), hash12(floor(b))) * (0.85 + 0.2 * mortar);
  float plaster = smoothstep(0.4, 0.6, fbm(p * 0.25, 4));
  alb = mix(brick, vec3(0.66, 0.56, 0.42) * (0.9 + 0.15 * fbm(p * 2.0, 3)), plaster * 0.6);
  alb *= 0.85 + 0.3 * smoothstep(0.0, 4.0, p.y);
  rough = 0.9;
  if (part > 0.5 && part < 1.5) {
    // the gate towers: a band of blue glazed brick
    float band = smoothstep(0.3, 0.0, abs(fract(p.y / 5.0) - 0.5) - 0.18);
    alb = mix(alb, vec3(0.04, 0.12, 0.32) * (0.8 + 0.4 * hash12(floor(b))), band * 0.85);
    rough = mix(rough, 0.3, band);
  }
  if (part > 2.5) {
    // houses: whitewashed, a dark doorway, lamplight at dusk
    alb = mix(alb, vec3(0.72, 0.66, 0.56), 0.5);
    float win = step(0.92, hash13(floor(p * vec3(0.7, 0.5, 0.7))));
    emit = vec3(1.0, 0.55, 0.22) * win * uDusk * 0.6;
  }
}
void terrainMat(vec3 p, inout vec3 n, float t, out vec3 alb, out float rough, out vec3 emit) {
  emit = vec3(0.0);
  float d = p.x - riverXf(p.z);
  float slope = 1.0 - n.y;
  // the floodplain: dark fields in strips near the river, palms marked as dark clumps
  vec3 silt = mix(vec3(0.3, 0.24, 0.17), vec3(0.4, 0.33, 0.23), fbm(p.xz * 0.05, 3));
  vec2 fq = vec2(d, p.z) / vec2(40.0, 26.0);
  float strip = hash12(floor(fq));
  vec3 field = mix(vec3(0.12, 0.17, 0.06), vec3(0.3, 0.28, 0.12), strip) * (0.8 + 0.3 * vnoise(p.xz * 2.0));
  float fieldK = smoothstep(260.0, 120.0, abs(d)) * smoothstep(${'${RW}'} + 8.0, ${'${RW}'} + 20.0, abs(d)) * step(0.0, d);
  float ditch = smoothstep(0.02, 0.0, min(fract(fq.x), 1.0 - fract(fq.x)) * 40.0 / 40.0 - 0.01);
  vec3 plain = mix(silt, field, fieldK * (1.0 - ditch * 0.7));
  // sand: warm, rippled
  vec3 sand = mix(vec3(0.62, 0.45, 0.27), vec3(0.74, 0.56, 0.35), fbm(p.xz * 0.02, 4)) * (0.9 + 0.12 * sin(dot(p.xz, vec2(0.9, 0.4)) * 3.0 + fbm(p.xz * 0.3, 2) * 4.0));
  float sandK = smoothstep(300.0, 600.0, d);
  alb = mix(plain, sand, sandK);
  // the limestone of the cliffs, bedded, yellow-white
  vec3 lime = mix(vec3(0.5, 0.43, 0.33), vec3(0.72, 0.64, 0.5), fbm(p * 0.09, 5));
  float bed = fract(p.y * 0.22 + 1.5 * fbm(p.xz * 0.012 + p.y * 0.01, 3));
  lime *= 0.86 + 0.16 * smoothstep(0.0, 0.3, bed) * smoothstep(1.0, 0.7, bed);
  lime *= 1.0 - 0.25 * smoothstep(0.55, 0.85, fbm(vec2(p.z * 0.12, p.y * 0.025), 4));             // weathering streaks down the face
  lime *= 1.0 - 0.22 * smoothstep(0.05, 0.0, abs(fbm(vec2(p.z * 0.03 + p.y * 0.01, p.y * 0.006), 3) - 0.5));   // joints
  float cliffK = smoothstep(0.35, 0.6, slope) * step(d, 0.0);
  n = normalize(n + cliffK * 0.45 * (vec3(fbm(p * 0.35 + 1.0, 3), fbm(p * 0.35 + 5.0, 3), fbm(p * 0.35 + 9.0, 3)) - 0.5));
  alb = mix(alb, lime, smoothstep(0.35, 0.6, slope) * step(d, 0.0) + smoothstep(8.0, 14.0, p.y) * step(d, 0.0));
  // mud at the water's edge
  alb = mix(alb, vec3(0.16, 0.13, 0.1), smoothstep(1.0, -0.5, p.y));
  rough = 0.9;
}
vec3 worldAir(vec3 ro, vec3 rd, float depth, vec3 col) {
#ifndef NO_MOTES
  col += lifeMotes(ro, rd, depth, ro + rd * 5.0, vec3(5.0, 2.5, 5.0), 18, 0.004, vec3(0.6, 0.05, 0.2), uSunCol * 0.04, 9.0);
#endif
  return col;
}
`;

export function groundY(x, z) {
  const rx = riverX(z), d = x - rx;
  let h = 1.6 + 0.6 * (fbm(x * 0.01, z * 0.01, 3) - 0.5) + 0.002 * Math.max(d - 40, 0);
  h = mix(-3.5, h, smoothstep(RIVER_W - 6, RIVER_W + 6, Math.abs(d)));
  const wc = -(d + RIVER_W + 10) + 6 * (fbm(z * 0.01, 0, 3) - 0.5);
  let cliff = 46 * smoothstep(0, 9, wc) + 6 * fbm(x * 0.01, z * 0.01, 3) * smoothstep(9, 60, wc);
  cliff += 3 * (fbm(z * 0.07, x * 0.05, 4) - 0.5) * smoothstep(-2, 2, wc) * smoothstep(12, 5, wc);
  h = Math.max(h, cliff + (wc > -1 ? 0 : -100));
  const dk = smoothstep(500, 800, d);
  if (dk > 0) {
    const qx = x * 0.012 + fbm(x * 0.002, z * 0.002, 3) * 2, qz = z * 0.012 + fbm(x * 0.002 + 5, z * 0.002 + 5, 3) * 2;
    const ridge = 1 - Math.abs(Math.sin(qx * 3 + 0.6 * Math.sin(qz * 1.3)));
    h += dk * (14 * Math.pow(ridge, 1.6) * (0.6 + 0.6 * fbm(x * 0.004, z * 0.004, 3)) + 6 * fbm(x * 0.006, z * 0.006, 3));
  }
  h += 0.12 * (fbm(x * 0.6, z * 0.6, 4) - 0.5) + 0.03 * (vnoise(x * 6, z * 6) - 0.5);
  return h;
}
export function stele(pos, yaw, half) { return [...pos, yaw, ...half, 0]; }
export function cities(list) {
  const u = new Array(64).fill(0);
  list.forEach((c, k) => { [c.x, c.z, c.r, c.h, c.yaw ?? 0, c.temple ?? 0, c.houses ?? 1, 0].forEach((v, i) => { u[k * 8 + i] = v; }); });
  return u;
}
// the outside face of a city's gate towers, above the arch: centre and outward normal
export function gateFace(c, { up = 0, side = 0 } = {}) {
  const s = Math.sin(c.yaw ?? 0), co = Math.cos(c.yaw ?? 0);
  // local +z (the gate's outward direction) in world, and local +x
  const N = [s, 0, co], X = [co, 0, -s];
  const lz = c.r + 4.05, lx = side * 7.5;
  return { c: [c.x + co * lx + s * lz, 1.4 + c.h + 1.0 + up, c.z - s * lx + co * lz], N };
}
export const southGLSL = () => SOUTH.replaceAll('${RW}', RIVER_W.toFixed(1));
