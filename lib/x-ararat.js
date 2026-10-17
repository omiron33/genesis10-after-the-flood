// Ararat after the flood. A great volcanic mountain (snow on its cone, black ridged basalt below),
// and on a broad shoulder of it the ark, grounded askew in drying mud beside a shallow basin of
// floodwater. Below the shoulder the slopes fall away for hundreds of metres to the plain, where the
// water that ran off the mountain spreads into a braided river over gravel bars: one stream comes
// down the mountain and splits into three, and each of those splits again.
//
// Metres, y up. The ark's shoulder is at y ~ 0 round the origin; the peak is north (+z); the plain
// lies 660 m below, to the south (-z), and the braided river crosses it round z ~ -2600.
export const PLAIN_Y = -250;
// the cone's height is measured from the shoulder: zero at the ark's distance from the peak
export const OFF = 0; // set below, once the noise is imported
export const RIVER_Z = -2600;

export const ARARAT = /* glsl */ `
uniform vec4 uArk;        // ark position xyz, yaw (0 = along x)
uniform vec4 uBasin;      // basin centre x, z, radius, water level of the basin
uniform float uDry;       // 0 wet mud .. 1 dry and cracked
uniform float uGreen;     // new shoots on the plain and the lower slopes, 0..1
uniform vec4 uNations;    // the fires of the nations on the plain: centre x, z, radius reached, brightness

const vec2 PEAK = vec2(-1450.0, 650.0);
float ridged(vec2 p, int oct) { float s = 0.0, a = 0.5; for (int i = 0; i < 8; i++) { if (i >= oct) break; float n = 1.0 - abs(vnoise(p) * 2.0 - 1.0); s += a * n * n; p = M2 * p * 2.03; a *= 0.5; } return s; }

// the braided river on the plain: three channels leaving the foot of the mountain, each splitting
float chan(vec2 p, vec2 a, vec2 b, float w) {
  vec2 pa = p - a, ba = b - a; float h = sat(dot(pa, ba) / dot(ba, ba));
  vec2 c = a + ba * h;
  // meanders
  c += vec2(ba.y, -ba.x) / length(ba) * 18.0 * sin(h * 9.0 + a.x * 0.01) * sin(h * 3.14159);
  return length(p - c) - w;
}
float braid(vec2 p) {
  vec2 src = vec2(60.0, -1900.0), fork = vec2(40.0, -2250.0);
  float d = chan(p, src, fork, 14.0);
  vec2 j = vec2(-420.0, -2900.0), h = vec2(40.0, -3050.0), s = vec2(480.0, -2850.0);
  d = min(d, chan(p, fork, j, 9.0)); d = min(d, chan(p, fork, h, 9.0)); d = min(d, chan(p, fork, s, 9.0));
  d = min(d, chan(p, j, j + vec2(-260.0, -380.0), 6.0)); d = min(d, chan(p, j, j + vec2(60.0, -460.0), 6.0));
  d = min(d, chan(p, h, h + vec2(-150.0, -420.0), 6.0)); d = min(d, chan(p, h, h + vec2(170.0, -400.0), 6.0));
  d = min(d, chan(p, s, s + vec2(120.0, -460.0), 6.0)); d = min(d, chan(p, s, s + vec2(380.0, -330.0), 6.0));
  return d;
}

float terrain(vec2 p, int lod) {
  float d = length(p - PEAK);
  // the mountain: a broad cone, steepening to the peak
  float h = 1500.0 * exp(-pow(d / 1100.0, 1.4)) - ${'${OFF}'};
  // ridges and gullies running down from the peak
  h += (eroded(p * 0.0021 + 3.1, lod > 0 ? 6 : 4) - 0.28) * 420.0 * smoothstep(100.0, 700.0, d) * smoothstep(3800.0, 1500.0, d);
  // the shoulder the ark rests on: a broad, gently tilted bench
  vec2 sq = (p - vec2(0.0, 40.0)) / vec2(190.0, 120.0);
  float sh = exp(-dot(sq, sq));
  float bench = -2.0 + 0.012 * (p.y - 30.0) + 3.0 * (fbm(p * 0.02, 3) - 0.5);
  h = mix(h, bench, smoothstep(0.0, 1.0, sh * 1.5));
  // the brink: south of the shoulder the ground breaks away in a scarp
  h -= 55.0 * smoothstep(-55.0, -125.0, p.y + 12.0 * fbm(p * 0.03, 3)) * exp(-p.x * p.x / (260.0 * 260.0));
  // the basin of floodwater beside the ark
  float bd = length(p - uBasin.xy) / uBasin.z;
  h -= 2.2 * exp(-bd * bd * 2.0);
  // the plain, and the braided river cut into it
  float plain = ${'${PY}'} + mix(6.0, 0.7, smoothstep(-1600.0, -1850.0, p.y)) * (fbm(p * 0.003, 3) - 0.5);
  h = max(h, plain + 1.0) ;
  if (h < plain + 40.0) {
    float bdd = braid(p);
    float bed = plain - 1.6 * smoothstep(8.0, -4.0, bdd);
    // gravel bars between the channels, a little higher than the plain
    bed += 0.9 * smoothstep(40.0, 10.0, bdd) * smoothstep(-2.0, 10.0, bdd) * (0.6 + 0.4 * fbm(p * 0.05, 3));
    h = mix(bed, h, smoothstep(plain + 2.0, plain + 40.0, h));
  }
  if (lod > 0) {
    h += 0.35 * (fbm(p * 0.35, 4) - 0.5);
    h += 0.04 * (vnoise(p * 4.0) - 0.5);
  }
  return h;
}

// the ark: a long timber hull, flat-sided, a roofed house along its deck, a door in its side and the
// ramp let down from it into the mud. Local frame: length along x (half 66 m), beam z (half 11 m),
// keel at y = 0.
const float RAMP_A = -0.12;
float arkSD(vec3 p, out float part) {
  vec3 q = p - uArk.xyz;
  q.xz = mat2(cos(uArk.w), sin(uArk.w), -sin(uArk.w), cos(uArk.w)) * q.xz;
  part = 0.0;
  if (length(q) > 110.0) return length(q) - 100.0;
  vec3 hq = q - vec3(0.0, 6.5, 0.0);
  float hull = sdBox(hq, vec3(66.0, 6.5, 11.0) - 1.2) - 1.2;
  // the bottom rounds in toward the keel, the ends rake
  hull = smax(hull, length(vec2(q.z * 0.95, max(q.y - 4.0, 0.0) * 0.0 + (q.y < 4.0 ? (4.0 - q.y) * 2.2 : 0.0))) - 12.0, 1.5);
  hull = smax(hull, abs(q.x) - 66.0 + max(0.0, 3.0 - q.y) * 1.5, 1.0);
  float house = sdBox(q - vec3(-4.0, 15.5, 0.0), vec3(48.0, 2.6, 7.6));
  // a pitched roof over the house
  vec3 rq = q - vec3(-4.0, 18.0, 0.0);
  float roof = max(max(abs(rq.x) - 49.0, -rq.y), (abs(rq.z) * 0.42 + rq.y) - 3.2);
  float d = min(hull, min(house, roof));
  // the window light along the top of the house
  d = smax(d, -sdBox(q - vec3(-4.0, 17.4, 0.0), vec3(44.0, 0.45, 8.0)), 0.05);
  if (roof < hull && roof < house) part = 2.0; else if (house < hull) part = 1.0;
  // the door in the -z side and its ramp let down to the ground
  d = smax(d, -sdBox(q - vec3(14.0, 6.0, -11.0), vec3(4.5, 4.5, 1.5)), 0.1);
  vec3 ram = q - vec3(14.0, 1.5, -11.0);
  float L = 13.0, a = RAMP_A;
  vec3 rr = ram; rr.yz = mat2(cos(a), -sin(a), sin(a), cos(a)) * rr.yz;
  float ramp = sdBox(rr - vec3(0.0, -0.25, -L * 0.5), vec3(4.3, 0.28, L * 0.5));
  if (ramp < d) { d = ramp; part = 3.0; }
  return d;
}
float worldSD(vec3 p, out float mat) {
  float part; float d = arkSD(p, part);
  mat = 10.0 + part;
  return d;
}
vec3 arkLocal(vec3 p) {
  vec3 q = p - uArk.xyz;
  q.xz = mat2(cos(uArk.w), sin(uArk.w), -sin(uArk.w), cos(uArk.w)) * q.xz;
  return q;
}
void worldMat(float mat, vec3 p, inout vec3 n, out vec3 alb, out float rough, out vec3 emit) {
  vec3 q = arkLocal(p);
  emit = vec3(0.0);
  // gopher wood under pitch: black-brown planks, the pitch worn back to grey timber where the water ran
  float plank = fract(q.y / 0.42), seam = smoothstep(0.0, 0.06, plank) * smoothstep(1.0, 0.94, plank);
  float boardEnd = smoothstep(0.0, 0.03, fract((q.x + 3.7 * floor(q.y / 0.42)) / 7.3));
  float g = fbm(vec2(q.x * 0.6, q.y * 6.0 + q.z * 0.3), 4);
  vec3 pitch = vec3(0.07, 0.056, 0.045), timber = vec3(0.34, 0.27, 0.19);
  float worn = smoothstep(0.55, 0.85, fbm(vec2(q.x * 0.9, q.y * 3.0), 4)) * 0.35 + 0.65 * smoothstep(4.5, 0.5, q.y) * fbm(vec2(q.x * 0.5, q.y * 2.0), 3);
  alb = mix(pitch * (0.8 + 0.5 * g), timber * (0.55 + 0.35 * g), worn * 0.6) * (0.45 + 0.55 * seam * boardEnd);
  // upright battens every few metres, and the pegs that hold the planks to them
  float bat = smoothstep(0.035, 0.0, abs(fract(q.x / 3.6) - 0.5) - 0.02);
  alb = mix(alb, pitch * 1.6, bat * step(abs(q.z), 11.3) * 0.8);
  alb *= 1.0 - 0.5 * smoothstep(0.07, 0.0, length(vec2(fract(q.x / 1.2) - 0.5, (plank - 0.5) * 0.42)));
  // a tide line of silt round the hull, high on it where the water stood
  alb = mix(alb, vec3(0.3, 0.27, 0.22), smoothstep(0.6, 0.3, abs(q.y - 3.6)) * 0.5 + smoothstep(2.4, 0.0, q.y) * 0.6);
  rough = mix(0.35, 0.85, worn);
  if (mat > 11.5 && mat < 12.5) {          // the roof: bark shingles
    vec2 s = vec2(q.x / 0.9, q.z / 0.5); s.x += 0.5 * mod(floor(s.y), 2.0);
    alb = vec3(0.12, 0.1, 0.08) * (0.7 + 0.5 * hash12(floor(s))) * (0.6 + 0.4 * smoothstep(0.0, 0.15, fract(s.y)));
    rough = 0.9;
  }
  if (mat > 10.5 && mat < 11.5 && abs(q.y - 17.4) < 0.5) emit = vec3(1.0, 0.6, 0.3) * (0.15 + 1.2 * uNations.w);   // lamplight in the window, bright at night
  // at night the lamplight spills down the hull below the window
  emit += alb * vec3(1.0, 0.55, 0.25) * uNations.w * 0.9 * exp(-max(17.0 - q.y, 0.0) * 0.12) * step(q.y, 17.0);
  if (mat > 12.5) {                           // the ramp: grey weathered timber, cleated
    float cleat = smoothstep(0.88, 0.95, fract(q.x * 0.0 + length(q.yz - vec2(0.0, -11.0)) / 0.9));
    alb = vec3(0.3, 0.26, 0.2) * (0.7 + 0.5 * fbm(vec2(q.x * 3.0, q.z * 0.4), 4)) * (1.0 - 0.3 * cleat);
    rough = 0.85;
  }
}

void terrainMat(vec3 p, inout vec3 n, float t, out vec3 alb, out float rough, out vec3 emit) {
  emit = vec3(0.0);
  float slope = 1.0 - n.y;
  float alt = p.y;
  // basalt: black and ridged, rust and grey where it weathers
  vec3 rock = mix(vec3(0.045, 0.043, 0.042), vec3(0.15, 0.13, 0.12), fbm(p.xz * 0.05 + p.y * 0.02, 4));
  rock *= 0.8 + 0.4 * smoothstep(0.3, 0.7, fbm(p.xz * 0.4, 3));
  rock = mix(rock, vec3(0.28, 0.16, 0.1), smoothstep(0.6, 0.8, fbm(p.xz * 0.013, 3)) * 0.5);
  // mud on the shoulder: dark and wet, drying pale and cracking
  vec2 sq = (p.xz - vec2(0.0, 40.0)) / vec2(180.0, 110.0); float sh = exp(-dot(sq, sq));
  vec2 vc = voronoiEdge(p.xz * 2.6 + 0.6 * vec2(fbm(p.xz * 0.9, 3), fbm(p.xz * 0.9 + 4.0, 3)));
  vec3 wet = vec3(0.1, 0.085, 0.07) * (0.8 + 0.3 * fbm(p.xz * 2.0, 3));
  vec3 dry = mix(vec3(0.27, 0.235, 0.2), vec3(0.36, 0.31, 0.26), vc.y) * (1.0 - 0.8 * smoothstep(0.04, 0.0, vc.x) * uDry);
  float dryK = sat(uDry * 1.4 - 0.25 * fbm(p.xz * 0.15, 3)) * smoothstep(-0.5, 0.6, p.y - uBasin.w);
  vec3 mud = mix(wet, dry, dryK);
  // stones scattered in the mud
  float pebble = smoothstep(0.75, 0.9, fbm(p.xz * 3.5, 3));
  mud = mix(mud, vec3(0.16, 0.15, 0.14), pebble * 0.6);
  alb = mix(rock, mud, smoothstep(0.15, 0.6, sh) * smoothstep(0.55, 0.25, slope));
  rough = mix(0.8, mix(0.25, 0.9, dryK), smoothstep(0.15, 0.6, sh));
  // snow high on the cone, in the gullies first
  float snow = smoothstep(380.0, 520.0, alt + 160.0 * fbm(p.xz * 0.006, 4)) * smoothstep(0.85, 0.5, slope);
  alb = mix(alb, vec3(0.92, 0.94, 0.98), snow); rough = mix(rough, 0.5, snow);
  // the plain: grey gravel and silt, new green coming up through it
  float plainK = smoothstep(${'${PY}'} + 30.0, ${'${PY}'} + 4.0, p.y);
  vec3 grav = mix(vec3(0.33, 0.31, 0.28), vec3(0.45, 0.42, 0.37), fbm(p.xz * 0.6, 4)) * (0.85 + 0.25 * vnoise(p.xz * 9.0));
  vec3 grass = mix(vec3(0.12, 0.2, 0.06), vec3(0.22, 0.3, 0.09), fbm(p.xz * 0.2, 3));
  float gk = uGreen * smoothstep(0.45, 0.75, fbm(p.xz * 0.05, 4)) * smoothstep(12.0, 30.0, braid(p.xz));
  vec3 plainC = mix(grav, grass, gk);
  // wet sand at the water's edge
  plainC = mix(plainC, vec3(0.2, 0.18, 0.15), smoothstep(14.0, 0.0, braid(p.xz)));
  alb = mix(alb, plainC, plainK);
  rough = mix(rough, 0.85, plainK);
  // the fires of the nations: points of light across the plain, spreading out from the fork
  if (uNations.w > 0.0) {
    vec2 cq = p.xz / 26.0; vec2 ci = floor(cq), cf = fract(cq) - 0.5;
    float hh = hash12(ci + 17.0);
    vec2 off = (hash22(ci + 3.0) - 0.5) * 0.7;
    float r = length(p.xz - uNations.xy) + 260.0 * (hash12(ci + 9.0) - 0.5);
    float on = step(0.72 - 0.35 * smoothstep(0.5, 0.75, fbm(p.xz * 0.0018 + 2.0, 3)), hh) * smoothstep(0.42, 0.6, fbm(p.xz * 0.0018 + 2.0, 3)) * smoothstep(uNations.z, uNations.z - 160.0, r) * plainK;
    float sd = length(cf - off);
    float spot = smoothstep(0.05, 0.0, sd) + 0.25 * smoothstep(0.3, 0.0, sd);
    emit += vec3(1.0, 0.5, 0.18) * spot * on * uNations.w * (0.7 + 0.3 * lifeFlicker(uTime, hh * 50.0)) * 30.0;
  }
  // green on the lower slopes too
  alb = mix(alb, grass * 0.8, uGreen * 0.6 * smoothstep(${'${PY}'} + 160.0, ${'${PY}'} + 40.0, p.y) * (1.0 - plainK) * smoothstep(0.5, 0.75, fbm(p.xz * 0.03, 3)) * smoothstep(0.6, 0.3, slope));
}

vec3 worldAir(vec3 ro, vec3 rd, float depth, vec3 col) {
#ifndef NO_MOTES
  col += lifeMotes(ro, rd, depth, ro + rd * 4.0, vec3(4.0, 2.0, 4.0), 24, 0.004, vec3(0.3, 0.05, 0.2), uSunCol * 0.04, 3.0);
#endif
  return col;
}
`;

import { fbm, ridged, vnoise, eroded, smoothstep, mix } from '/song/lib/noise.js';
export const RAMP_A = -0.12;
const PEAK = [-1450, 650];
function chan(px, pz, a, b, w) {
  const bax = b[0] - a[0], baz = b[1] - a[1], L2 = bax * bax + baz * baz;
  const h = Math.min(1, Math.max(0, ((px - a[0]) * bax + (pz - a[1]) * baz) / L2));
  const L = Math.sqrt(L2), m = 18 * Math.sin(h * 9 + a[0] * 0.01) * Math.sin(h * Math.PI);
  const cx = a[0] + bax * h + (baz / L) * m, cz = a[1] + baz * h + (-bax / L) * m;
  return Math.hypot(px - cx, pz - cz) - w;
}
export function braid(x, z) {
  const src = [60, -1900], fork = [40, -2250];
  let d = chan(x, z, src, fork, 14);
  const j = [-420, -2900], h = [40, -3050], s = [480, -2850];
  d = Math.min(d, chan(x, z, fork, j, 9), chan(x, z, fork, h, 9), chan(x, z, fork, s, 9));
  d = Math.min(d, chan(x, z, j, [j[0] - 260, j[1] - 380], 6), chan(x, z, j, [j[0] + 60, j[1] - 460], 6));
  d = Math.min(d, chan(x, z, h, [h[0] - 150, h[1] - 420], 6), chan(x, z, h, [h[0] + 170, h[1] - 400], 6));
  d = Math.min(d, chan(x, z, s, [s[0] + 120, s[1] - 460], 6), chan(x, z, s, [s[0] + 380, s[1] - 330], 6));
  return d;
}
// the land's height in JavaScript (the GLSL terrain at lod 1), basin = [x, z, r, level]
export function groundY(x, z, basin = [0, 0, 1, -99]) {
  const d = Math.hypot(x - PEAK[0], z - PEAK[1]);
  let h = 1500 * Math.exp(-Math.pow(d / 1100, 1.4)) - OFF_;
  h += (eroded(x * 0.0021 + 3.1, z * 0.0021 + 3.1, 6) - 0.28) * 420 * smoothstep(100, 700, d) * smoothstep(3800, 1500, d);
  const sqx = x / 190, sqz = (z - 40) / 120;
  const sh = Math.exp(-(sqx * sqx + sqz * sqz));
  const bench = -2 + 0.012 * (z - 30) + 3 * (fbm(x * 0.02, z * 0.02, 3) - 0.5);
  h = mix(h, bench, smoothstep(0, 1, sh * 1.5));
  h -= 55 * smoothstep(-55, -125, z + 12 * fbm(x * 0.03, z * 0.03, 3)) * Math.exp(-x * x / (260 * 260));
  const bd = Math.hypot(x - basin[0], z - basin[1]) / basin[2];
  h -= 2.2 * Math.exp(-bd * bd * 2);
  const plain = PLAIN_Y + mix(6, 0.7, smoothstep(-1600, -1850, z)) * (fbm(x * 0.003, z * 0.003, 3) - 0.5);
  h = Math.max(h, plain + 1);
  if (h < plain + 40) {
    const bdd = braid(x, z);
    let bed = plain - 1.6 * smoothstep(8, -4, bdd);
    bed += 0.9 * smoothstep(40, 10, bdd) * smoothstep(-2, 10, bdd) * (0.6 + 0.4 * fbm(x * 0.05, z * 0.05, 3));
    h = mix(bed, h, smoothstep(plain + 2, plain + 40, h));
  }
  h += 0.35 * (fbm(x * 0.35, z * 0.35, 4) - 0.5) + 0.04 * (vnoise(x * 4, z * 4) - 0.5);
  return h;
}
// a point in the ark's frame (x along its length, z across, keel at y = 0) in the world, ark = [x, y, z, yaw]
export function arkToWorld(ark, l) {
  const c = Math.cos(ark[3]), s = Math.sin(ark[3]);
  return [ark[0] + c * l[0] + s * l[2], ark[1] + l[1], ark[2] - s * l[0] + c * l[2]];
}
export function arkDir(ark, l) {
  const c = Math.cos(ark[3]), s = Math.sin(ark[3]);
  return [c * l[0] + s * l[2], l[1], -s * l[0] + c * l[2]];
}
export const OFF_ = (() => { const d = Math.hypot(1450, 650); return 1500 * Math.exp(-Math.pow(d / 1100, 1.4)) + (eroded(3.1, 3.1, 6) - 0.28) * 420 * smoothstep(100, 700, d) * smoothstep(3800, 1500, d); })();
export const araratGLSL = () => ARARAT.replaceAll('${PY}', PLAIN_Y.toFixed(1)).replaceAll('${OFF}', OFF_.toFixed(2));
