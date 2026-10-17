// The engine's GLSL noise (web/glsl.js) in JavaScript, so a scene can ask where the ground is: to set
// a camera above it, stand a word on it, or seat a stone in it. Same hashes, same fade, same octave
// rotation; float precision differs by millimetres.
const fract = (x) => x - Math.floor(x);
export function hash12(x, y) {
  let a = fract(x * 0.1031), b = fract(y * 0.1031), c = fract(x * 0.1031);
  const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33);
  a += d; b += d; c += d;
  return fract((a + b) * c);
}
export function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10), uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const a = hash12(ix, iy), b = hash12(ix + 1, iy), c = hash12(ix, iy + 1), d = hash12(ix + 1, iy + 1);
  return (a + (b - a) * ux) + ((c + (d - c) * ux) - (a + (b - a) * ux)) * uy;
}
export function fbm(x, y, oct) {
  let s = 0, a = 0.5;
  for (let i = 0; i < oct; i++) {
    s += a * vnoise(x, y);
    const nx = (0.8 * x + 0.6 * y) * 2.03, ny = (-0.6 * x + 0.8 * y) * 2.03;
    x = nx; y = ny; a *= 0.5;
  }
  return s;
}
export function ridged(x, y, oct) {
  let s = 0, a = 0.5;
  for (let i = 0; i < oct; i++) {
    const n = 1 - Math.abs(vnoise(x, y) * 2 - 1);
    s += a * n * n;
    const nx = (0.8 * x + 0.6 * y) * 2.03, ny = (-0.6 * x + 0.8 * y) * 2.03;
    x = nx; y = ny; a *= 0.5;
  }
  return s;
}
export const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const mix = (a, b, k) => a + (b - a) * k;
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
// value noise with derivatives, and the eroded fbm built on it (gullies where the slope is steep)
export function vnoised(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10), uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const dux = 30 * fx * fx * (fx * (fx - 2) + 1), duy = 30 * fy * fy * (fy * (fy - 2) + 1);
  const a = hash12(ix, iy), b = hash12(ix + 1, iy), c = hash12(ix, iy + 1), d = hash12(ix + 1, iy + 1);
  const k1 = b - a, k2 = c - a, k4 = a - b - c + d;
  return [a + k1 * ux + k2 * uy + k4 * ux * uy, dux * (k1 + k4 * uy), duy * (k2 + k4 * ux)];
}
export function eroded(x, y, oct) {
  let a = 0, b = 0.5, dx = 0, dy = 0;
  for (let i = 0; i < oct; i++) {
    const n = vnoised(x, y);
    dx += n[1]; dy += n[2];
    a += b * n[0] / (1 + dx * dx + dy * dy);
    b *= 0.5;
    const nx = (0.8 * x + 0.6 * y) * 2.03, ny = (-0.6 * x + 0.8 * y) * 2.03;
    x = nx; y = ny;
  }
  return a;
}
