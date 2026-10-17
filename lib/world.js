// The shared renderer for every place in the film: a heightfield land, an optional sheet of water
// (a still stream or a sea with waves and foam), standing stones, fires, and the words.
//
// Words are panels: a rectangle in the world mapped to a region of the scene's text canvas. A panel
// can be
//   1 'stand'   solid letters standing free in the world, as thick as the panel's depth
//   2 'relief'  solid letters raised from the surface behind them (a wall, a cliff, a stone face)
//   3 'cut'     letters cut into whatever surface lies in the panel (the g-common inscription)
//   4 'paint'   letters painted or inlaid on whatever surface lies in the panel
// The canvas's alpha is the height of a solid letter, so a word drawn with rising alpha rises out of
// the ground, and its colour (rgb / alpha) tints the letter's material.
//
// Each world supplies, in GLSL:
//   float terrain(vec2 p, int lod)                       land height (lod 0 coarse, 1 detailed)
//   void terrainMat(vec3 p, inout vec3 n, float t, out vec3 alb, out float rough, out vec3 emit)
//   float worldSD(vec3 p, out float mat)                 its own objects (mat >= 10), or 1e5
//   void worldMat(float mat, vec3 p, inout vec3 n, out vec3 alb, out float rough, out vec3 emit)
//   vec3 worldAir(vec3 ro, vec3 rd, float depth, vec3 col)  anything in the air (mist, sparks)
// Metres, y up.
import { G_COMMON } from '/song/lib/g-common.js';
import { LIFE_GLSL } from '/kit/life.js';

export const NP = 16, NS = 16, NF = 16;

const CORE = /* glsl */ `
uniform float uExposureSky, uSpin;
uniform vec4 uP[${NP * 6}];     // panels: c.xyz,depth | R.xyz,halfW | U.xyz,halfH | uv rect | kind,mat,glow,rough | tint.rgb,spec
uniform vec4 uStone[${NS * 3}]; // stones: pos.xyz,yaw | half size xyz,seed | colour rgb,rough
uniform vec4 uFire[${NF}];      // fires: pos.xyz, size (0 = out)
uniform vec4 uWater;            // level y, wave height, wave scale, on (0/1)
uniform vec4 uWaterTint;        // deep colour rgb, clarity
uniform vec4 uMistP;            // base height, falloff (m), density, 0
uniform vec3 uMistCol;
uniform vec4 uWaterReg;          // water only inside this disc: centre x, z, radius, edge softness
uniform vec4 uMisc;             // x: water flow speed along -z (streams), y: wind, z,w: free

float eroded(vec2 p, int oct) { float a = 0.0, b = 0.5; vec2 d = vec2(0.0); for (int i = 0; i < 8; i++) { if (i >= oct) break; vec3 n = vnoised(p); d += n.yz; a += b * n.x / (1.0 + dot(d, d)); b *= 0.5; p = M2 * p * 2.03; } return a; }
#define LOD(t) ((t) < 160.0 ? 1 : 0)
float terrain(vec2 p, int lod);
void terrainMat(vec3 p, inout vec3 n, float t, out vec3 alb, out float rough, out vec3 emit);
float worldSD(vec3 p, out float mat);
void worldMat(float mat, vec3 p, inout vec3 n, out vec3 alb, out float rough, out vec3 emit);
vec3 worldAir(vec3 ro, vec3 rd, float depth, vec3 col);

// ---------------------------------------------------------------- panels
vec2 pUV(int k, vec2 st) { vec4 r = uP[k * 6 + 3]; return mix(r.xy, r.zw, st); }
float pA(int k, vec2 st) { if (any(lessThan(st, vec2(0.0))) || any(greaterThan(st, vec2(1.0)))) return 0.0; return textureLod(uText, pUV(k, st), 0.0).a; }
float pShadeA(int k, vec2 st) { return texture(uTextShade, pUV(k, st)).a; }
float pKind(int k) { return uP[k * 6 + 4].x; }
// letter surface in the panel frame: kind 1 is |w| < h/2, kind 2 is w < h
float pF(int k, vec3 q, float D, float hw, float hh, bool solo) {
  vec2 st = vec2(q.x / hw, q.y / hh) * 0.5 + 0.5;
  float a = pA(k, st);
  if (a < 0.02) return 1.0;
  return solo ? abs(q.z) - 0.5 * D * a : q.z - D * a;
}
// the nearest solid letter along a ray: t, world normal, panel st, panel index
float panelTrace(vec3 ro, vec3 rd, float tmax, out vec3 nW, out vec2 stHit, out int kHit) {
  float best = tmax; kHit = -1;
  for (int k = 0; k < ${NP}; k++) {
    float kind = pKind(k);
    if (kind < 0.5 || kind > 2.5) continue;
    vec4 P0 = uP[k * 6], P1 = uP[k * 6 + 1], P2 = uP[k * 6 + 2];
    vec3 R = P1.xyz, U = P2.xyz, N = normalize(cross(R, U));
    float D = P0.w, hw = P1.w, hh = P2.w;
    bool solo = kind < 1.5;
    vec3 o = ro - P0.xyz;
    vec3 lo = vec3(dot(o, R), dot(o, U), dot(o, N)), ld = vec3(dot(rd, R), dot(rd, U), dot(rd, N));
    vec3 bmin = vec3(-hw, -hh, solo ? -0.5 * D : 0.0), bmax = vec3(hw, hh, solo ? 0.5 * D : D);
    vec3 inv = 1.0 / (ld + sign(ld) * 1e-7 + vec3(equal(ld, vec3(0.0))) * 1e-7);
    vec3 ta = (bmin - lo) * inv, tb = (bmax - lo) * inv;
    vec3 tn = min(ta, tb), tf = max(ta, tb);
    float t0 = max(max(tn.x, tn.y), max(tn.z, 0.0)), t1 = min(min(tf.x, tf.y), min(tf.z, best));
    if (t1 <= t0) continue;
    vec4 r = uP[k * 6 + 3];
    float texel = 2.0 * hw / max((r.z - r.x) * float(textureSize(uText, 0).x), 1.0);
    float inpl = length(ld.xy);
    float dt = min(max(texel * 0.75 / max(inpl, 0.02), (t1 - t0) / 150.0), (t1 - t0) / 10.0);
    float t = t0, tp = t0;
    for (int i = 0; i < 170; i++) {
      if (t > t1) break;
      vec3 q = lo + ld * t;
      vec2 st = vec2(q.x / hw, q.y / hh) * 0.5 + 0.5;
      if (pShadeA(k, st) < 0.002) { tp = t; t += dt * 3.0; continue; }
      if (pF(k, q, D, hw, hh, solo) < 0.0) {
        float a = tp, b = t;
        for (int j = 0; j < 6; j++) { float m = 0.5 * (a + b); if (pF(k, lo + ld * m, D, hw, hh, solo) < 0.0) b = m; else a = m; }
        q = lo + ld * b;
        st = vec2(q.x / hw, q.y / hh) * 0.5 + 0.5;
        float e = texel * 1.2;
        float hx = (pA(k, st + vec2(e / (2.0 * hw), 0.0)) - pA(k, st - vec2(e / (2.0 * hw), 0.0))) * D / (2.0 * e);
        float hy = (pA(k, st + vec2(0.0, e / (2.0 * hh))) - pA(k, st - vec2(0.0, e / (2.0 * hh)))) * D / (2.0 * e);
        vec3 g = solo ? vec3(-0.5 * hx, -0.5 * hy, sign(q.z + 1e-6)) : vec3(-hx, -hy, 1.0);
        g = normalize(g);
        nW = normalize(R * g.x + U * g.y + N * g.z);
        best = b; stHit = st; kHit = k;
        break;
      }
      tp = t; t += dt;
    }
  }
  return kHit >= 0 ? best : -1.0;
}
// light reaching p along L through the solid letters (1 open, 0 blocked)
float panelShadow(vec3 p, vec3 L) {
#ifdef NO_PSH
  return 1.0;
#endif
  for (int k = 0; k < ${NP}; k++) {
    float kind = pKind(k);
    if (kind < 0.5 || kind > 2.5) continue;
    vec4 P0 = uP[k * 6], P1 = uP[k * 6 + 1], P2 = uP[k * 6 + 2];
    vec3 R = P1.xyz, U = P2.xyz, N = normalize(cross(R, U));
    float D = P0.w, hw = P1.w, hh = P2.w;
    bool solo = kind < 1.5;
    vec3 o = p - P0.xyz;
    vec3 lo = vec3(dot(o, R), dot(o, U), dot(o, N)), ld = vec3(dot(L, R), dot(L, U), dot(L, N));
    vec3 bmin = vec3(-hw, -hh, solo ? -0.5 * D : 0.0), bmax = vec3(hw, hh, solo ? 0.5 * D : D);
    vec3 inv = 1.0 / (ld + sign(ld) * 1e-7 + vec3(equal(ld, vec3(0.0))) * 1e-7);
    vec3 ta = (bmin - lo) * inv, tb = (bmax - lo) * inv;
    vec3 tn = min(ta, tb), tf = max(ta, tb);
    float t0 = max(max(tn.x, tn.y), max(tn.z, 0.02)), t1 = min(min(tf.x, tf.y), tf.z);
    if (t1 <= t0) continue;
    for (int i = 0; i < 14; i++) {
      float t = mix(t0, t1, (float(i) + 0.5) / 14.0);
      if (pF(k, lo + ld * t, D, hw, hh, solo) < 0.0) return 0.0;
    }
  }
  return 1.0;
}
// the letters' material
void panelMat(int k, vec3 p, vec2 st, inout vec3 n, out vec3 alb, out float rough, out vec3 emit, out float spec) {
  vec4 P4 = uP[k * 6 + 4], P5 = uP[k * 6 + 5];
  vec4 c = textureLod(uText, pUV(k, st), 0.0);
  vec3 ink = c.a > 0.01 ? srgb2lin(c.rgb / c.a) : vec3(1.0);
  float m = P4.y;
  vec3 tint = P5.rgb;
  rough = P4.w; spec = P5.w; emit = vec3(0.0);
  float g = fbm(p * 6.0, 4), g2 = vnoise(p * 40.0);
  if (m < 0.5) {            // stone: tooled, a little pitted
    alb = tint * (0.82 + 0.3 * g) * (0.94 + 0.08 * g2);
  } else if (m < 1.5) {     // bronze
    alb = tint * (0.85 + 0.25 * g);
    alb = mix(alb, vec3(0.12, 0.3, 0.24), smoothstep(0.55, 0.8, fbm(p * 3.0, 3)) * 0.5);
  } else if (m < 2.5) {     // gold leaf
    alb = tint * (0.9 + 0.15 * g);
  } else if (m < 3.5) {     // timber, grain along the panel
    vec3 R = uP[k * 6 + 1].xyz;
    float gr = fbm(vec2(dot(p, R) * 0.8, dot(p, cross(R, vec3(0.0, 1.0, 0.0))) * 30.0 + dot(p, vec3(0.0, 1.0, 0.0)) * 30.0), 4);
    alb = tint * (0.7 + 0.5 * gr);
  } else if (m < 4.5) {     // brick: courses laid through the letters
    vec3 U = uP[k * 6 + 2].xyz, R = uP[k * 6 + 1].xyz;
    vec2 b = vec2(dot(p, R) / 0.36, dot(p, U) / 0.09);
    b.x += 0.5 * mod(floor(b.y), 2.0);
    vec2 f = fract(b);
    float mortar = smoothstep(0.0, 0.06, min(f.x, 1.0 - f.x) * 0.36) * smoothstep(0.0, 0.1, min(f.y, 1.0 - f.y));
    alb = tint * (0.75 + 0.45 * hash12(floor(b))) * (0.85 + 0.2 * g2);
    alb = mix(vec3(0.42, 0.38, 0.32), alb, mortar);
  } else if (m < 5.5) {     // glowing: the letters are light
    alb = tint * 0.2;
    emit = ink * P4.z;
  } else if (m < 6.5) {     // chalk white limestone
    alb = tint * (0.88 + 0.16 * g);
  } else {                  // salt: white crystal with glints
    alb = tint * (0.9 + 0.1 * g);
    spec = max(spec, 0.4 * step(0.93, hash13(floor(p * 90.0))));
  }
  alb *= mix(vec3(1.0), ink, 0.85);
  if (m < 4.5 || m > 5.5) emit += alb * P4.z;
}
// cut and painted letters on any surface the panel's volume passes through
void panelDecals(vec3 p, inout vec3 n, inout vec3 alb, inout vec3 emit, inout float rough) {
  for (int k = 0; k < ${NP}; k++) {
    float kind = pKind(k);
    if (kind < 2.5) continue;
    vec4 P0 = uP[k * 6], P1 = uP[k * 6 + 1], P2 = uP[k * 6 + 2];
    vec3 R = P1.xyz, U = P2.xyz, N = normalize(cross(R, U));
    vec3 o = p - P0.xyz;
    vec3 q = vec3(dot(o, R), dot(o, U), dot(o, N));
    if (abs(q.z) > P0.w || abs(q.x) > P1.w || abs(q.y) > P2.w) continue;
    vec2 st = vec2(q.x / P1.w, q.y / P2.w) * 0.5 + 0.5;
    vec4 P4 = uP[k * 6 + 4], P5 = uP[k * 6 + 5];
    if (kind < 3.5) {
      vec4 ins = inscription(pUV(k, st), n, R, U, P4.z);
      alb *= 1.0 - P5.r * ins.a;
      emit += ins.rgb;
    } else {
      vec4 c = textureLod(uText, pUV(k, st), 0.0);
      vec3 ink = c.a > 0.01 ? srgb2lin(c.rgb / c.a) : vec3(0.0);
      alb = mix(alb, ink * (0.9 + 0.15 * vnoise(p * 30.0)), c.a * 0.96);
      emit += ink * c.a * P4.z;
      rough = mix(rough, P4.w, c.a);
    }
  }
}

// ---------------------------------------------------------------- stones
float stoneSD(vec3 p, int k) {
  vec4 A = uStone[k * 3], B = uStone[k * 3 + 1];
  if (B.x <= 0.0) return 1e5;
  vec3 q = p - A.xyz;
  if (dot(q, q) > dot(B.xyz, B.xyz) * 4.0 + 4.0) return length(q) - length(B.xyz) * 1.2;
  q.xz = mat2(cos(A.w), sin(A.w), -sin(A.w), cos(A.w)) * q.xz;
  float r = min(B.x, B.z) * 0.25;
  // a little narrower toward the top, as a dressed standing stone
  q.xz *= 1.0 + 0.12 * sat((q.y + B.y) / (2.0 * B.y));
  float d = sdBox(q - vec3(0.0, 0.0, 0.0), B.xyz - r) - r;
  // a weathered top and rough faces
  d += 0.035 * min(B.x, B.z) * (fbm(q * 1.6 + B.w * 7.0, 4) - 0.5) + 0.006 * (vnoise(q * 14.0) - 0.5);
  return d * 0.8;
}
uniform vec4 uStoneB;   // a sphere round every stone: centre, radius (0 = no stones)
float stonesSD(vec3 p, out int id) {
  float d = 1e5; id = -1;
  if (uStoneB.w <= 0.0) return d;
  float gb = length(p - uStoneB.xyz) - uStoneB.w;
  if (gb > 2.0) return gb;
  for (int k = 0; k < ${NS}; k++) { float s = stoneSD(p, k); if (s < d) { d = s; id = k; } }
  return d;
}

// mat: 1 land, 2 stone, >= 10 the world's own
float sceneSD(vec3 p, out float mat) {
  int id; float d = stonesSD(p, id); mat = id >= 0 ? 2.0 + float(id) * 0.01 : 0.0;
  float m; float w = worldSD(p, m);
  if (w < d) { d = w; mat = m; }
  return d;
}
vec3 sceneN(vec3 p, float t) {
  vec2 e = vec2(0.0006 + t * 0.0002, 0.0); float m;
  return normalize(vec3(sceneSD(p + e.xyy, m) - sceneSD(p - e.xyy, m), sceneSD(p + e.yxy, m) - sceneSD(p - e.yxy, m), sceneSD(p + e.yyx, m) - sceneSD(p - e.yyx, m)));
}
vec3 landN(vec2 q, float t) {
  float e = 0.004 + t * 0.0012; int l = LOD(t);
  return normalize(vec3(terrain(q - vec2(e, 0.0), l) - terrain(q + vec2(e, 0.0), l), 2.0 * e, terrain(q - vec2(0.0, e), l) - terrain(q + vec2(0.0, e), l)));
}

// the land and everything standing on it
float marchScene(vec3 ro, vec3 rd, float tmax, int steps, out float mat) {
  float t = 0.02; mat = 0.0;
  float lh = 1.0;
  for (int i = 0; i < 300; i++) {
    if (i >= steps) break;
    vec3 p = ro + rd * t;
    float h = p.y - terrain(p.xz, LOD(t));
    float m; float o = sceneSD(p, m);
    if (o < 0.0004 * t + 0.0003) { mat = m; return t; }
    if (h < 0.0008 * t) {
      float lo = t - max(0.02, lh * 0.5 + 0.01), hi = t;
      for (int k = 0; k < 7; k++) { float mid = 0.5 * (lo + hi); vec3 q = ro + rd * mid; if (q.y - terrain(q.xz, LOD(t)) < 0.0) hi = mid; else lo = mid; }
      mat = 1.0; return lo;
    }
    lh = h;
    t += min(o, max(0.006 + t * 0.003, h * 0.5));
    if (t > tmax) break;
  }
  return -1.0;
}

float softShadow(vec3 p, vec3 L, int lod) {
#ifdef NO_SSH
  return 1.0;
#endif
  // steps grow geometrically from a start jittered per sub-frame, so the averaging of the sub-frames
  // turns the stepping into a soft penumbra instead of bands
  float j = fract(dot(uJitter, vec2(7.13, 3.71)) + uFrame * 0.618);
  float res = 1.0, t = 0.05 * (0.6 + 0.8 * j);
  for (int i = 0; i < 34; i++) {
    vec3 q = p + L * t;
    float m; float d = min(t < 60.0 ? sceneSD(q, m) : 1e5, (q.y - terrain(q.xz, (lod > 0 && t < 40.0) ? 1 : 0)) * 0.7);
    res = min(res, 7.0 * d / t);
    if (res < 0.002) return 0.0;
    t += max(clamp(d, 0.04, 0.6 + t * 0.15), t * 0.18 * (0.7 + 0.6 * j));
    if (t > 900.0) break;
  }
  return sat(res);
}

// fires: light falling on p
vec3 fireLight(vec3 p, vec3 n) {
  vec3 acc = vec3(0.0);
  for (int k = 0; k < ${NF}; k++) {
    float s = uFire[k].w;
    if (s <= 0.0) continue;
    vec3 c = uFire[k].xyz + vec3(0.0, 0.25 * s, 0.0);
    vec3 d = c - p; float r2 = dot(d, d);
    if (r2 > 2500.0 * s * s) continue;
    acc += vec3(1.0, 0.46, 0.16) * 3.2 * s * s * lifeFlicker(uTime, float(k) * 3.3) * sat(dot(n, d * inversesqrt(r2)) * 0.8 + 0.2) / (r2 + 0.3);
  }
  return acc;
}

vec3 sky(vec3 rd) { return skyColor(rd, uSpin) * uExposureSky; }
// height fog with the sun scattered in, and a low mist that lies in the valleys
vec3 atmosphere(vec3 col, vec3 ro, vec3 rd, float t) {
  float fog = 1.0 - exp(-t * uFogDen);
  vec3 fc = uFogCol + uSunCol * 0.18 * pow(max(dot(rd, uSunDir), 0.0), 8.0);
  col = mix(col, fc, fog);
  if (uMistP.z > 0.0) {
    // exponential height mist, integrated analytically along the ray
    float b = 1.0 / uMistP.y;
    float y0 = ro.y - uMistP.x;
    float k = rd.y * b;
    float od = uMistP.z * exp(-y0 * b) * (abs(k * t) > 1e-4 ? (1.0 - exp(-k * t)) / k : t);
    float m = 1.0 - exp(-max(od, 0.0));
    vec3 mc = uMistCol * (0.7 + 0.5 * pow(max(dot(rd, uSunDir), 0.0), 3.0));
    col = mix(col, mc, m);
  }
  return col;
}

// shade a surface point
vec3 shadeSurface(vec3 p, vec3 rd, float t, float mat, vec3 n, int pk, vec2 pst, bool cheap) {
  vec3 alb = vec3(0.5), emit = vec3(0.0); float rough = 0.8, spec = 0.04;
  if (pk >= 0) {
    panelMat(pk, p, pst, n, alb, rough, emit, spec);
  } else if (mat == 1.0) {
    terrainMat(p, n, t, alb, rough, emit);
    panelDecals(p, n, alb, emit, rough);
  } else if (mat >= 2.0 && mat < 3.0) {
    int k = int(floor((mat - 2.0) * 100.0 + 0.5));
    vec4 C = uStone[k * 3 + 2];
    vec3 q = p - uStone[k * 3].xyz;
    float g = fbm(q * 3.0 + uStone[k * 3 + 1].w, 4);
    alb = C.rgb * (0.7 + 0.45 * g) * (0.9 + 0.15 * vnoise(q * 25.0));
    // lichen on the weather side, dark at the foot where the ground is damp
    alb = mix(alb, vec3(0.32, 0.33, 0.22), smoothstep(0.6, 0.85, fbm(q * 5.0 + 3.0, 3)) * 0.35);
    alb *= 0.75 + 0.25 * smoothstep(0.0, 0.5, q.y + uStone[k * 3 + 1].y);
    rough = C.w;
    panelDecals(p, n, alb, emit, rough);
  } else {
    worldMat(mat, p, n, alb, rough, emit);
    panelDecals(p, n, alb, emit, rough);
  }
  vec3 L = uSunDir;
  float dif = sat(dot(n, L));
  float sh = dif > 0.0 && uSunDir.y > -0.05 ? (cheap ? 1.0 : softShadow(p + n * (0.03 + t * 0.002), L, LOD(t)) * panelShadow(p + n * 0.02, L)) : 0.0;
  // ambient occlusion from the distance field and the land
  float ao = 1.0;
  if (!cheap && t < 200.0) { float o = 0.0, w = 1.0; for (int i = 1; i <= 2; i++) { float h = 0.1 * float(i) * (1.0 + t * 0.01); vec3 q = p + n * h; float m; float d = min(sceneSD(q, m), q.y - terrain(q.xz, LOD(t))); o += (h - min(d, h)) * w; w *= 0.6; } ao = sat(1.0 - 2.5 * o); }
  vec3 skyAmb = mix(uSkyHor, uSkyTop, 0.5) * 0.9 + uAmb;
  vec3 lit = uSunCol * dif * sh + skyAmb * ao * (0.55 + 0.45 * n.y) + uAmb * ao * 0.5;
  lit += uSunCol * 0.06 * sat(-n.y * 0.5 + 0.5) * ao;      // light bounced from the ground
  lit += fireLight(p + n * 0.03, n);
  vec3 col = alb * lit + emit;
  // a sheen: wet mud, polished stone, metal
  vec3 h = normalize(L - rd);
  float sp = pow(sat(dot(n, h)), mix(400.0, 8.0, rough)) * (1.0 - rough * 0.8);
  float fres = spec + (1.0 - spec) * pow(1.0 - sat(dot(n, -rd)), 5.0);
  col += uSunCol * sh * sp * fres * 2.0;
  if (spec > 0.2) col += sky(reflect(rd, n)) * fres * (1.0 - rough) * 0.6 * ao;
  return atmosphere(col, p - rd * t, rd, t);
}

// the whole picture along one ray: land, objects, letters, then water over them
vec3 trace(vec3 ro, vec3 rd, int steps, bool primary, out float depth) {
  float mat;
  float tw = (uWater.w > 0.5 && rd.y < 0.0) ? (uWater.x - ro.y) / rd.y : 1e9;
  if (ro.y < uWater.x) tw = 1e9;
  if (tw < 1e8 && length((ro + rd * tw).xz - uWaterReg.xy) > uWaterReg.z) tw = 1e9;
  float ts = marchScene(ro, rd, 4000.0, steps, mat);
  vec3 pn; vec2 pst; int pk;
  float tp = panelTrace(ro, rd, ts > 0.0 ? ts : 4000.0, pn, pst, pk);
  float th = ts;
  if (tp > 0.0) { th = tp; }
  vec3 col;
  if (th > 0.0 && th < tw) {
    vec3 p = ro + rd * th;
    vec3 n = pk >= 0 ? pn : (mat == 1.0 ? landN(p.xz, th) : sceneN(p, th));
    col = shadeSurface(p, rd, th, mat, n, pk, pst, false);
    depth = th;
  } else if (tw < 1e8) {
    vec3 p = ro + rd * tw;
    depth = tw;
    vec2 q = p.xz;
    float amp = uWater.y, sc = uWater.z;
    // waves: a swell from the sea, chop on top; a stream only ripples and runs
    float e = 0.03;
    #define WH(Q) (amp * (sin(dot(Q, vec2(0.12, 0.99)) * sc - uTime * 1.3) * 0.5 + sin(dot(Q, vec2(-0.4, 0.92)) * sc * 1.7 - uTime * 1.9) * 0.3 + (fbm((Q) * sc * 1.5 + vec2(uTime * 0.25, -uTime * 0.4 - uMisc.x * uTime), 4) - 0.5) * 0.9))
    float h0 = WH(q), hx = WH(q + vec2(e, 0.0)), hz = WH(q + vec2(0.0, e));
    vec3 n = normalize(vec3(h0 - hx, e, h0 - hz));
    n = normalize(mix(n, vec3(0.0, 1.0, 0.0), smoothstep(30.0, 600.0, tw) * 0.85));
    vec3 r = reflect(rd, n);
    if (r.y < 0.02) r.y = 0.02;
    float fres = 0.02 + 0.98 * pow(1.0 - sat(dot(-rd, n)), 5.0);
    vec3 refl;
    if (primary) {
      float rm; float tr = marchScene(p + n * 0.02, r, 1500.0, 90, rm);
      vec3 rpn; vec2 rpst; int rpk;
      float trp = panelTrace(p + n * 0.02, r, tr > 0.0 ? tr : 1500.0, rpn, rpst, rpk);
      if (trp > 0.0) { vec3 rp = p + r * trp; refl = shadeSurface(rp, r, trp, 0.0, rpn, rpk, rpst, true); }
      else if (tr > 0.0) { vec3 rp = p + r * tr; refl = shadeSurface(rp, r, tr, rm, rm == 1.0 ? landN(rp.xz, tr) : sceneN(rp, tr), -1, vec2(0.0), true); }
      else refl = sky(r);
    } else refl = sky(r);
    // what lies under the water: the bed seen through it, fading with depth
    float bedY = terrain(q, LOD(tw));
    float wd = max(uWater.x - bedY, 0.0);
    vec3 rr = refract(rd, n, 0.75);
    vec3 bp = p + rr * (wd / max(-rr.y, 0.2));
    vec3 bn = landN(bp.xz, tw);
    vec3 balb, bem; float brough;
    terrainMat(vec3(bp.x, bedY, bp.z), bn, tw, balb, brough, bem);
    panelDecals(vec3(bp.x, bedY, bp.z), bn, balb, bem, brough);
    float caust = 0.7 + 0.6 * pow(vnoise(bp.xz * 3.0 + vec2(uTime * 0.6, -uTime * 0.3)), 3.0);
    vec3 bed = balb * (uSunCol * sat(bn.y) * caust + uAmb + mix(uSkyHor, uSkyTop, 0.5)) + bem * 0.8;
    float absorb = exp(-wd * (2.5 - 2.2 * uWaterTint.w));
    vec3 body = mix(uWaterTint.rgb * (uAmb + uSunCol * 0.15 + mix(uSkyHor, uSkyTop, 0.5) * 0.5), bed, absorb);
    col = mix(body, refl, fres);
    col += uSunCol * pow(sat(dot(r, uSunDir)), 600.0) * 6.0 * fres;
    // foam where the water is shallow over the shore, and on the crests
    float crest = sat((h0 / max(amp, 1e-4)) * 0.5 + 0.5);
    float sh = smoothstep(0.35, 0.0, wd) * smoothstep(0.0, 0.03, wd);
    float foamN = fbm(q * 1.4 + vec2(0.0, uTime * 0.3), 4);
    float foam = sat(sh * (0.6 + 0.8 * foamN) + smoothstep(0.82, 1.0, crest) * amp * 1.5 * foamN);
    foam *= step(0.02, amp);
    col = mix(col, vec3(0.9) * (uSunCol * 0.6 + uAmb + mix(uSkyHor, uSkyTop, 0.5)), foam * 0.8);
    col = atmosphere(col, ro, rd, tw);
  } else { col = sky(rd); depth = 1e5; }
  return col;
}

vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = lensRay(fc, ro);
  float depth;
  vec3 col = trace(ro, rd, 300, true, depth);
  for (int k = 0; k < ${NF}; k++) {
    float s = uFire[k].w;
    if (s <= 0.0) continue;
    vec3 c = uFire[k].xyz;
    float dist = length(c - ro);
    if (dist < 120.0) col += flameLight(ro, rd, depth, c, 9.0 * s, float(k) * 3.3) + flameLight(ro, rd, depth, c + vec3(0.12, -0.02, 0.05) * s, 6.5 * s, float(k) * 3.3 + 1.0) + flameLight(ro, rd, depth, c + vec3(-0.1, -0.02, -0.06) * s, 6.0 * s, float(k) * 3.3 + 2.0)
      + 0.5 * lifeEmbers(ro, rd, depth, c + vec3(0.0, 0.2 * s, 0.0), 0.18 * s, 1.2 * s, 10, vec3(0.2, 0.0, 0.1) * uMisc.y, 0.006 * s, float(k));
    else col += vec3(1.0, 0.5, 0.18) * lifeGlow(ro, rd, c + vec3(0.0, 0.15 * s, 0.0), 0.06 * s + dist * 0.0012, depth);
  }
  col = worldAir(ro, rd, depth, col);
  return col;
}
`;

export function worldFrag(world, defines = '') {
  return LIFE_GLSL + G_COMMON + defines + CORE + world;
}

// Pack panels into the text canvas: each panel's region keeps the panel's proportions, so a word
// drawn in its box lands in the world undistorted. Returns the uniform array and the boxes.
//   defs: [{ c, right, up, w, h, depth, kind, mat, glow, rough, tint, spec }]
export const KINDS = { stand: 1, relief: 2, cut: 3, paint: 4 };
export const MATS = { stone: 0, bronze: 1, gold: 2, wood: 3, brick: 4, glow: 5, chalk: 6, salt: 7 };
const nrm = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
export function panels(defs, { W = 8192, H = 4096, pad = 90 } = {}) {
  // shelf-pack at the largest scale (px per metre) that fits
  const fit = (s) => {
    const boxes = []; let x = pad, y = pad, rowH = 0;
    for (const d of defs) {
      const bw = Math.ceil(d.w * s), bh = Math.ceil(d.h * s);
      if (bw + 2 * pad > W) return null;
      if (x + bw + pad > W) { x = pad; y += rowH + pad; rowH = 0; }
      boxes.push({ x, y, w: bw, h: bh });
      x += bw + pad; rowH = Math.max(rowH, bh);
    }
    return y + rowH + pad <= H ? boxes : null;
  };
  let s = 4000, boxes = null;
  while (!(boxes = fit(s)) && s > 1) s *= 0.96;
  const u = new Array(16 * 6 * 4).fill(0);
  defs.forEach((d, k) => {
    const R = nrm(d.right ?? [1, 0, 0]), U = nrm(d.up ?? [0, 1, 0]);
    const b = boxes[k];
    const v = [
      ...d.c, d.depth ?? 0.2,
      ...R, d.w / 2,
      ...U, d.h / 2,
      b.x / W, 1 - (b.y + b.h) / H, (b.x + b.w) / W, 1 - b.y / H,
      KINDS[d.kind ?? 'stand'], MATS[d.mat ?? 'stone'], d.glow ?? 0, d.rough ?? 0.7,
      ...(d.tint ?? [0.6, 0.58, 0.54]), d.spec ?? 0.04,
    ];
    v.forEach((x, i) => { u[k * 24 + i] = x; });
  });
  return { u, boxes, scale: s, defs };
}
// move a panel (k) to a new centre / axes in an existing uniform array
export function placePanel(u, k, { c, right, up }) {
  if (c) { u[k * 24] = c[0]; u[k * 24 + 1] = c[1]; u[k * 24 + 2] = c[2]; }
  if (right) { const R = nrm(right); u[k * 24 + 4] = R[0]; u[k * 24 + 5] = R[1]; u[k * 24 + 6] = R[2]; }
  if (up) { const U = nrm(up); u[k * 24 + 8] = U[0]; u[k * 24 + 9] = U[1]; u[k * 24 + 10] = U[2]; }
}
// draw into panel k's box: draw(ctx, { x: 0, y: 0, w, h }) with 1 unit = 1 px, clipped to the box
export function inPanel(ctx, P, k, draw) {
  const b = P.boxes[k];
  ctx.save();
  ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip();
  ctx.translate(b.x, b.y);
  draw(ctx, { x: 0, y: 0, w: b.w, h: b.h });
  ctx.restore();
}
// stones: [{ pos, yaw, size: [halfx, halfy, halfz], seed, color, rough }]
export function stones(list) {
  const u = new Array(16 * 3 * 4).fill(0);
  list.forEach((s, k) => {
    const v = [...s.pos, s.yaw ?? 0, ...s.size, s.seed ?? k, ...(s.color ?? [0.4, 0.38, 0.35]), s.rough ?? 0.8];
    v.forEach((x, i) => { u[k * 12 + i] = x; });
  });
  return u;
}
// the sphere round a stone list (uStoneB), from the stones uniform array
export function stoneBound(u) {
  const ps = []; for (let k = 0; k < 16; k++) if (u[k * 12 + 4] > 0) ps.push([u[k * 12], u[k * 12 + 1], u[k * 12 + 2], Math.hypot(u[k * 12 + 4], u[k * 12 + 5], u[k * 12 + 6]) * 1.3 + 0.5]);
  if (!ps.length) return [0, 0, 0, 0];
  const c = [0, 1, 2].map((i) => ps.reduce((a, p) => a + p[i], 0) / ps.length);
  return [...c, Math.max(...ps.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) + p[3]))];
}
// the face of a stone (its +z side after yaw) as a panel frame: centre, right and up
export function stoneFace(s, { lift = 0, out = 0.0, side = 1 } = {}) {
  const a = s.yaw ?? 0, c = Math.cos(a), sn = Math.sin(a);
  // the stone's local z axis in world (inverse of the shader's rotation)
  const fz = [sn * side, 0, c * side], fx = [c * side, 0, -sn * side];
  return { c: [s.pos[0] + fz[0] * (s.size[2] + out), s.pos[1] + lift, s.pos[2] + fz[2] * (s.size[2] + out)], right: fx, up: [0, 1, 0], normal: fz };
}
export function fires(list) {
  const u = new Array(16 * 4).fill(0);
  list.forEach((f, k) => { u[k * 4] = f[0]; u[k * 4 + 1] = f[1]; u[k * 4 + 2] = f[2]; u[k * 4 + 3] = f[3] ?? 1; });
  return u;
}

export function worldScene(P, o) {
  const sky0 = o.sky(P.from);
  return {
    name: o.name, from: P.from, to: P.to,
    textSize: o.textSize ?? [8192, 4096],
    frag: worldFrag(o.world, (P.dbg ?? '').split(',').filter(Boolean).map((d) => `#define ${d}\n`).join('') + (o.defines ?? '')),
    uniforms: {
      ...sky0, uExposureSky: 1, uSpin: 0,
      uP: o.panels?.u ?? new Array(384).fill(0),
      uStone: o.stones ?? new Array(192).fill(0), uStoneB: stoneBound(o.stones ?? new Array(192).fill(0)),
      uFire: o.fires ?? new Array(64).fill(0),
      uWater: o.water ?? [0, 0, 1, 0], uWaterReg: o.waterReg ?? [0, 0, 1e7, 0], uWaterTint: o.waterTint ?? [0.02, 0.05, 0.06, 0.5],
      uMistP: o.mist ?? [0, 10, 0, 0], uMistCol: o.mistCol ?? [0.5, 0.5, 0.55], uMisc: o.misc ?? [0, 0.3, 0, 0],
      uFocus: 5, uAperture: 0,
      ...(o.uniforms ?? {}),
    },
    camera: o.cam,
    update(t, u) {
      const s = o.sky(t);
      for (const [k, v] of Object.entries(s)) { if (!u[k]) continue; if (Array.isArray(v)) u[k].value.set(...v); else u[k].value = v; }
      const c = o.cam(t);
      u.uFocus.value = c.focus ?? 5; u.uAperture.value = c.aperture ?? 0;
      o.update?.(t, u);
      u.uStoneB.value = stoneBound(u.uStone.value);
    },
    drawText: o.drawText,
    post: o.post,
    finish: o.finish,
  };
}
// axes for a panel whose front faces direction N (toward the reader), its letters' up along U
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export function facing(N, U = [0, 1, 0]) {
  const n = nrm(N); let u = nrm(U);
  // make up perpendicular to the front
  const d = u[0] * n[0] + u[1] * n[1] + u[2] * n[2];
  u = nrm([u[0] - n[0] * d, u[1] - n[1] * d, u[2] - n[2] * d]);
  return { right: cross(u, n), up: u };
}
// a panel lying on the ground, read by someone looking along `toward` (its letters' up points away)
export function onGround(toward) { return facing([0, 1, 0], [toward[0], 0, toward[2]]); }
