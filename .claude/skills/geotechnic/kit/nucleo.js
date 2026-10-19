// Geotechnic · núcleo: azar con semilla, ruido 3D, muestreos estadísticos y ayudas de color.
// Sin dependencias. Todo lo demás del kit lo usa.

/** Generador con semilla (mulberry32). La misma semilla da siempre el mismo dibujo. */
export function azar(semilla = 1) {
  let a = semilla >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.entre = (a0, b0) => a0 + (b0 - a0) * r();
  r.entero = (a0, b0) => Math.floor(a0 + (b0 - a0 + 1) * r());
  r.elegir = (lista) => lista[Math.floor(r() * lista.length)];
  r.normal = (m = 0, s = 1) => {
    const u = Math.max(r(), 1e-9), v = r();
    return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  /** Lognormal por su media y desviación reales (no las del logaritmo). */
  r.lognormal = (media, desv) => {
    const s2 = Math.log(1 + (desv * desv) / (media * media));
    return Math.exp(r.normal(Math.log(media) - s2 / 2, Math.sqrt(s2)));
  };
  /** Exponencial negativa: el espaciado de juntas sigue esta ley (Priest y Hudson, 1976). */
  r.exponencial = (media) => -media * Math.log(Math.max(1 - r(), 1e-9));
  return r;
}

/** Hash entero → [0,1). Útil para dar un valor fijo a una celda o a un bloque. */
export function hash3(x, y, z, s = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 2147483647) + Math.imul(s | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Ruido simplex 3D (Gustavson), con permutación sembrada.
const G3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
export function ruido3(semilla = 7) {
  const r = azar(semilla);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  const perm = new Uint8Array(512), pm12 = new Uint8Array(512);
  for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; pm12[i] = perm[i] % 12; }
  const F3 = 1 / 3, Gk = 1 / 6;
  return function (x, y, z) {
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
    const t = (i + j + k) * Gk;
    const x0 = x - (i - t), y0 = y - (j - t), z0 = z - (k - t);
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }
    const x1 = x0 - i1 + Gk, y1 = y0 - j1 + Gk, z1 = z0 - k1 + Gk;
    const x2 = x0 - i2 + 2 * Gk, y2 = y0 - j2 + 2 * Gk, z2 = z0 - k2 + 2 * Gk;
    const x3 = x0 - 1 + 3 * Gk, y3 = y0 - 1 + 3 * Gk, z3 = z0 - 1 + 3 * Gk;
    const ii = i & 255, jj = j & 255, kk = k & 255;
    let n = 0, tt, g;
    tt = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (tt > 0) { g = G3[pm12[ii + perm[jj + perm[kk]]]]; tt *= tt; n += tt * tt * (g[0] * x0 + g[1] * y0 + g[2] * z0); }
    tt = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (tt > 0) { g = G3[pm12[ii + i1 + perm[jj + j1 + perm[kk + k1]]]]; tt *= tt; n += tt * tt * (g[0] * x1 + g[1] * y1 + g[2] * z1); }
    tt = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (tt > 0) { g = G3[pm12[ii + i2 + perm[jj + j2 + perm[kk + k2]]]]; tt *= tt; n += tt * tt * (g[0] * x2 + g[1] * y2 + g[2] * z2); }
    tt = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (tt > 0) { g = G3[pm12[ii + 1 + perm[jj + 1 + perm[kk + 1]]]]; tt *= tt; n += tt * tt * (g[0] * x3 + g[1] * y3 + g[2] * z3); }
    return 32 * n; // ≈ [-1, 1]
  };
}

/** Ruido fractal (fbm). octavas de detalle; lacunaridad 2; ganancia 0.5. */
export function fbm(n, x, y, z, octavas = 5, lac = 2, gan = 0.5) {
  let a = 1, f = 1, s = 0, norm = 0;
  for (let o = 0; o < octavas; o++) { s += a * n(x * f, y * f, z * f); norm += a; a *= gan; f *= lac; }
  return s / norm;
}

/** Ruido de crestas: cerros y aristas. */
export function crestas(n, x, y, z, octavas = 5) {
  let a = 0.5, f = 1, s = 0, w = 1;
  for (let o = 0; o < octavas; o++) {
    let v = 1 - Math.abs(n(x * f, y * f, z * f));
    v *= v * w; w = Math.min(1, v * 2);
    s += v * a; a *= 0.5; f *= 2.03;
  }
  return s;
}

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const suave = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const rad = (g) => (g * Math.PI) / 180;
export const grad = (r) => (r * 180) / Math.PI;

/**
 * Vector unitario normal a un plano geológico dado por buzamiento y dirección de buzamiento (°).
 * Mundo del kit: x = este, y = arriba, z = sur (convención de three.js). La normal apunta hacia arriba.
 */
export function normalPlano(buz, dirBuz) {
  const b = rad(buz), d = rad(dirBuz);
  // la normal hacia arriba se inclina hacia la dirección de buzamiento (norte = -z, este = +x)
  return [Math.sin(b) * Math.sin(d), Math.cos(b), -Math.sin(b) * Math.cos(d)];
}

/** Muestra una dirección alrededor de una media con dispersión de Fisher (κ alto = familia apretada). */
export function fisher(r, n, kappa) {
  const [nx, ny, nz] = n;
  const u = r();
  const cosT = 1 + Math.log(u + (1 - u) * Math.exp(-2 * kappa)) / kappa;
  const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
  const fi = 2 * Math.PI * r();
  // base ortonormal alrededor de n
  let ax = Math.abs(nx) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  let t1 = [ny * ax[2] - nz * ax[1], nz * ax[0] - nx * ax[2], nx * ax[1] - ny * ax[0]];
  const l1 = Math.hypot(...t1); t1 = t1.map((v) => v / l1);
  const t2 = [ny * t1[2] - nz * t1[1], nz * t1[0] - nx * t1[2], nx * t1[1] - ny * t1[0]];
  const c = Math.cos(fi) * sinT, s = Math.sin(fi) * sinT;
  return [nx * cosT + t1[0] * c + t2[0] * s, ny * cosT + t1[1] * c + t2[1] * s, nz * cosT + t1[2] * c + t2[2] * s];
}

/** Color hex → [r,g,b] lineal (0..1), listo para atributos de vértice con salida sRGB. */
export function rgb(hex) {
  const h = hex.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return c.map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
}
export const mezcla = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const escalar = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
