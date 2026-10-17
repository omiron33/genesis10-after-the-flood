// The land of Canaan: hill country of grey limestone and red earth, terraced for vines and olives,
// falling west to a coastal plain and the sea, and south-east into the deep basin of the Salt Sea,
// whose shores are crusted white with salt. One great hill near the middle is terraced from foot to
// top; the border of Canaan runs from the coast at Sidon south to Gerar and Gaza and east to the
// cities of the plain at the edge of the salt.
//
// Metres, y up, the Great Sea at y = 0, the Salt Sea far below it.
import { fbm, vnoise, eroded, smoothstep, mix } from '/song/lib/noise.js';

export const HILL = [0, 200];
export const SALT = [300, -680, 260, -70];        // basin centre x, z, radius, floor level
export const coastX = (z) => -700 + 60 * Math.sin(z * 0.002);
const TER = 3.0;

export const CANAAN = /* glsl */ `
uniform float uTerr;   // 1: the great hill is terraced
uniform vec4 uBorder[8];  // the border line: x, z, distance along it at this point, 0 (unused points repeat the last)
uniform float uBorderLen; // how much of it has been drawn, in metres
float coastXf(float z) { return -700.0 + 60.0 * sin(z * 0.002); }
float baseLand(vec2 p, int lod) {
  float d = p.x - coastXf(p.y);
  // the coastal plain rising into hills
  float h = 0.02 * d + 40.0 * smoothstep(80.0, 600.0, d) * (0.5 + 0.7 * fbm(p * 0.0025, lod > 0 ? 5 : 3));
  h += 22.0 * (fbm(p * 0.006 + 3.0, lod > 0 ? 4 : 2) - 0.5) * smoothstep(60.0, 300.0, d);
  h += 60.0 * (eroded(p * 0.004 + 1.7, lod > 0 ? 5 : 3) - 0.3) * smoothstep(150.0, 500.0, d);
  // below the shore the sea bed
  if (d < 0.0) h = -0.03 * (-d) - 1.0;
  // the Salt Sea basin, deep and steep-sided
  vec2 bq = (p - vec2(${'${SX}'}, ${'${SZ}'})) / ${'${SR}'};
  float bd = length(bq);
  h = mix(h, ${'${SL}'} - 4.0 + 6.0 * smoothstep(0.55, 1.0, bd) + 20.0 * fbm(p * 0.01, 3) * smoothstep(0.9, 1.3, bd), smoothstep(1.45, 1.0, bd));
  return h;
}
float terrain(vec2 p, int lod) {
  float h = baseLand(p, lod);
  // the great hill
  vec2 hq = p - vec2(${'${HX}'}, ${'${HZ}'});
  float hh = 70.0 * exp(-dot(hq, hq) / (220.0 * 220.0));
  if (uTerr > 0.5 && hh > 0.3) {
    float k = hh / ${'${T}'};
    float tq = ${'${T}'} * (floor(k) + smoothstep(0.93, 1.0, fract(k)));
    // the terraces' edges wander a little with the lie of the rock
    hh = mix(hh, tq, smoothstep(0.3, 2.0, hh));
  }
  h += hh;
  if (lod > 0) h += 0.08 * (fbm(p * 0.8, 3) - 0.5) + 0.02 * (vnoise(p * 7.0) - 0.5);
  return h;
}
float worldSD(vec3 p, out float mat) { mat = 0.0; return 1e5; }
void worldMat(float mat, vec3 p, inout vec3 n, out vec3 alb, out float rough, out vec3 emit) { alb = vec3(0.5); rough = 0.8; emit = vec3(0.0); }
void terrainMat(vec3 p, inout vec3 n, float t, out vec3 alb, out float rough, out vec3 emit) {
  emit = vec3(0.0);
  float slope = 1.0 - n.y;
  float d = p.x - coastXf(p.z);
  // terra rossa between the rocks, grass and scrub over it
  vec3 soil = mix(vec3(0.36, 0.17, 0.09), vec3(0.48, 0.26, 0.14), fbm(p.xz * 0.05, 3));
  vec3 grass = mix(vec3(0.2, 0.24, 0.09), vec3(0.34, 0.33, 0.14), fbm(p.xz * 0.03, 4));
  vec3 ground = mix(soil, grass, smoothstep(0.3, 0.7, fbm(p.xz * 0.06 + 4.0, 4)) * smoothstep(0.35, 0.1, slope));
  // olive trees: dark rounded crowns scattered over the terraces and hillsides
  vec2 oc = floor(p.xz / 7.0); vec2 of = p.xz - (oc + 0.5) * 7.0 - (hash22(oc) - 0.5) * 4.0;
  float olive = step(0.6, hash12(oc + 3.0)) * smoothstep(1.6 + 0.5 * vnoise(p.xz * 2.0), 0.6, length(of + 0.4 * vec2(vnoise(p.xz * 3.0), vnoise(p.xz * 3.0 + 7.0))));
  ground = mix(ground, vec3(0.08, 0.11, 0.06) * (0.8 + 0.4 * vnoise(p.xz * 3.0)), olive * 0.85 * smoothstep(0.5, 0.2, slope));
  // limestone where it is steep: grey, pitted; the terrace walls are dry stone
  vec2 vc = voronoiEdge((mix(p.xz, vec2(p.x + p.z, p.y * 1.8), smoothstep(0.55, 0.8, slope))) * 1.6);
  vec3 rock = mix(vec3(0.36, 0.35, 0.32), vec3(0.54, 0.52, 0.47), vc.y) * (1.0 - 0.6 * smoothstep(0.06, 0.0, vc.x));
  rock *= 0.85 + 0.25 * fbm(p * 0.3, 3);
  alb = mix(ground, rock, smoothstep(0.3, 0.55, slope));
  // the Great Sea, where no water is drawn: deep blue from above
  alb = mix(alb, vec3(0.02, 0.07, 0.12), smoothstep(-0.5, -3.0, p.y) * step(d, 0.0));
  // the coast: pale sand
  alb = mix(alb, vec3(0.66, 0.6, 0.48), smoothstep(30.0, 5.0, d) * step(-2.0, d));
  // the salt: white crust broken into plates round the Salt Sea, wet and grey at its edge
  vec2 bq = (p.xz - vec2(${'${SX}'}, ${'${SZ}'})) / ${'${SR}'};
  float bd = length(bq);
  float saltK = smoothstep(1.25, 1.0, bd);
  vec2 sv = voronoiEdge(p.xz * 0.6);
  vec3 salt = mix(vec3(0.62, 0.6, 0.57), vec3(0.74, 0.72, 0.68), sv.y) * (1.0 - 0.35 * smoothstep(0.05, 0.0, sv.x));
  salt = mix(salt, vec3(0.5, 0.48, 0.44), smoothstep(${'${SL}'} + 1.5, ${'${SL}'} + 0.2, p.y));
  alb = mix(alb, salt, saltK);
  rough = mix(0.88, 0.6, saltK);
  // the border, a line of white stones laid across the land as far as it has run
  if (uBorderLen > 0.0) {
    float bdist = 1e5, along = 0.0;
    for (int i = 0; i < 7; i++) {
      vec2 a = uBorder[i].xy, b = uBorder[i + 1].xy;
      vec2 ab = b - a; float L2 = max(dot(ab, ab), 1e-4);
      float h = sat(dot(p.xz - a, ab) / L2);
      float dd = length(p.xz - a - ab * h);
      if (dd < bdist) { bdist = dd; along = uBorder[i].z + h * sqrt(L2); }
    }
    float w = 4.5 + 0.08 * t * 0.01;
    float line = smoothstep(w, w * 0.5, bdist) * smoothstep(uBorderLen + 2.0, uBorderLen - 2.0, along);
    float head = exp(-max(along - uBorderLen + 20.0, 0.0) * 0.0) * smoothstep(40.0, 0.0, abs(along - uBorderLen)) * smoothstep(w * 3.0, 0.0, bdist);
    alb = mix(alb, vec3(0.95, 0.93, 0.88), line);
    emit += vec3(1.0, 0.85, 0.6) * (line * 0.15 + head * 0.6) * step(along, uBorderLen + 2.0);
  }
}
vec3 worldAir(vec3 ro, vec3 rd, float depth, vec3 col) {
#ifndef NO_MOTES
  col += lifeMotes(ro, rd, depth, ro + rd * 5.0, vec3(5.0, 2.5, 5.0), 16, 0.004, vec3(0.3, 0.03, 0.3), uSunCol * 0.035, 13.0);
#endif
  return col;
}
`;

function baseLand(x, z) {
  const d = x - coastX(z);
  let h = 0.02 * d + 40 * smoothstep(80, 600, d) * (0.5 + 0.7 * fbm(x * 0.0025, z * 0.0025, 5));
  h += 22 * (fbm(x * 0.006 + 3, z * 0.006 + 3, 4) - 0.5) * smoothstep(60, 300, d);
  h += 60 * (eroded(x * 0.004 + 1.7, z * 0.004 + 1.7, 5) - 0.3) * smoothstep(150, 500, d);
  if (d < 0) h = -0.03 * -d - 1;
  const bx = (x - SALT[0]) / SALT[2], bz = (z - SALT[1]) / SALT[2], bd = Math.hypot(bx, bz);
  h = mix(h, SALT[3] - 4 + 6 * smoothstep(0.55, 1, bd) + 20 * fbm(x * 0.01, z * 0.01, 3) * smoothstep(0.9, 1.3, bd), smoothstep(1.45, 1, bd));
  return h;
}
export function hillH(x, z) { const dx = x - HILL[0], dz = z - HILL[1]; return 70 * Math.exp(-(dx * dx + dz * dz) / (220 * 220)); }
export function groundY(x, z, terr = 1) {
  let hh = hillH(x, z);
  if (terr && hh > 0.3) { const k = hh / TER; const tq = TER * (Math.floor(k) + smoothstep(0.93, 1, k - Math.floor(k))); hh = mix(hh, tq, smoothstep(0.3, 2, hh)); }
  return baseLand(x, z) + hh + 0.08 * (fbm(x * 0.8, z * 0.8, 3) - 0.5) + 0.02 * (vnoise(x * 7, z * 7) - 0.5);
}
// where the terrace wall of terrace k (its top at k * TER above the hill's foot) crosses the line
// from the hill's centre at angle a (radians, 0 = -z, the south face)
export function terraceWall(k, a = 0) {
  const lvl = k * TER - 0.5 * TER * 0.07;
  const r = 220 * Math.sqrt(Math.log(70 / lvl));
  const x = HILL[0] + Math.sin(a) * r, z = HILL[1] - Math.cos(a) * r;
  return { x, z, r, top: baseLand(x, z) + k * TER, foot: baseLand(x, z) + (k - 1) * TER, N: [Math.sin(a), 0, -Math.cos(a)] };
}
export const canaanGLSL = () => CANAAN.replaceAll('${SX}', SALT[0].toFixed(1)).replaceAll('${SZ}', SALT[1].toFixed(1)).replaceAll('${SR}', SALT[2].toFixed(1)).replaceAll('${SL}', SALT[3].toFixed(1))
  .replaceAll('${HX}', HILL[0].toFixed(1)).replaceAll('${HZ}', HILL[1].toFixed(1)).replaceAll('${T}', TER.toFixed(2));
