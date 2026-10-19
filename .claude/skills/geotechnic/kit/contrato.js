// Geotechnic · contrato entre motores. Puro (sin three): lo usan la página y el juez en Node.
//
//  B → A (el terreno le da al equipo):  piso(x, z) · contorno(x) · libre(p) · frenteX(y, z) · emboquilles · cavidades
//  A → B (el equipo le da al terreno):  huellas (trocha de sus ruedas) · emisores de polvo · taladros perforados ·
//                                       material cargado (lo que sale del montón y llega al echadero)
//
// `libre(p)` es la distancia con signo (m) del punto p a la roca: positiva dentro de la labor, negativa dentro del
// macizo. El juez la usa para «ningún equipo atraviesa la roca»; las cavidades (taladros ya perforados) se exceptúan.
// Con `caja` (kit/labor.js → cajaBloque, la misma del macizo cerrado), fuera del bloque de roca también es aire.
import { VA } from "../motorA/modelo.js";

/** Distancia con signo de (z, y) a un polígono cerrado [[z, y], …] (positiva dentro). */
function distPoligono(pol, z, y) {
  let dentro = false, d2 = Infinity;
  for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) {
    const [zi, yi] = pol[i], [zj, yj] = pol[j];
    if ((yi > y) !== (yj > y) && z < ((zj - zi) * (y - yi)) / (yj - yi) + zi) dentro = !dentro;
    const dz = zj - zi, dy = yj - yi, L2 = dz * dz + dy * dy || 1e-12;
    const t = Math.max(0, Math.min(1, ((z - zi) * dz + (y - yi) * dy) / L2));
    const ez = zi + t * dz - z, ey = yi + t * dy - y;
    d2 = Math.min(d2, ez * ez + ey * ey);
  }
  return (dentro ? 1 : -1) * Math.sqrt(d2);
}

/**
 * Terreno de una galería (motor B) para el motor A y el juez.
 * gal: resultado de galeria(); op: { frente: superficieFrente(...) o null, xFrente, cavidades: [{ a, d, largo, r }],
 *                                 caja: { min, max } (cajaBloque(gal): fuera de ella libre ≥ 0; sin caja, como v2) }
 */
export function terrenoGaleria(gal, op = {}) {
  const P = gal.geometria.attributes.position.array;
  const { nx, ns, inicio, largo } = gal;
  const filas = [];
  for (let i = 0; i < nx; i++) {
    const pol = [];
    for (let j = 0; j < ns; j++) { const k = (i * ns + j) * 3; pol.push([P[k + 2], P[k + 1]]); }
    filas.push({ x: inicio + (i * largo) / (nx - 1), pol });
  }
  const fila = (x) => filas[Math.max(0, Math.min(nx - 1, Math.round(((x - inicio) / largo) * (nx - 1))))];
  const cavidades = op.cavidades || [];
  const caja = op.caja || null;
  /** Distancia con signo a la caja del bloque (positiva fuera). */
  const fueraCaja = (p) => {
    let afuera = 0, adentro = -Infinity;
    for (let q = 0; q < 3; q++) {
      const c = (caja.min[q] + caja.max[q]) / 2, h = (caja.max[q] - caja.min[q]) / 2, e = Math.abs(p[q] - c) - h;
      if (e > 0) afuera += e * e;
      adentro = Math.max(adentro, e);
    }
    return afuera > 0 ? Math.sqrt(afuera) : adentro;
  };
  const T = {
    gal, cavidades, caja,
    /** Polígono (z, y) de la sección en x (con la sobreexcavación real). */
    contorno: (x) => fila(x).pol,
    /** Cota del piso en (x, z): el borde más bajo del contorno que cruza esa z. */
    piso(x, z) {
      const pol = fila(x).pol; let y = Infinity;
      for (let i = 0; i < pol.length - 1; i++) {
        const [z0, y0] = pol[i], [z1, y1] = pol[i + 1];
        if ((z0 - z) * (z1 - z) > 0 || z0 === z1) continue;
        const yy = y0 + ((y1 - y0) * (z - z0)) / (z1 - z0);
        if (yy < y) y = yy;
      }
      return y === Infinity ? 0 : y;
    },
    /** Superficie del frente x(y, z), o Infinity si la galería no tiene frente. */
    frenteX: (y, z) => (op.frente ? op.frente(y, z).x : Infinity),
    /** Distancia con signo a la roca (contorno de la sección, frente y, si hay, caja del bloque). */
    libre(p) {
      let d = distPoligono(fila(p[0]).pol, p[2], p[1]);
      if (op.frente) d = Math.min(d, op.frente(p[1], p[2]).x - p[0]);
      if (p[0] < inicio) d = Math.min(d, p[0] - inicio + 50); // fuera del tramo dibujado: sin roca hacia atrás
      if (caja) d = Math.max(d, fueraCaja(p)); // roca = caja ∖ labor: fuera del bloque es aire
      return d;
    },
    /** ¿Está el punto dentro de un taladro ya perforado? (barra y broca pueden entrar ahí) */
    enCavidad(q, pieza) {
      if (!pieza?.entraTaladro) return false;
      for (const c of T.cavidades) {
        const v = VA.sub(q, c.a), s = VA.dot(v, c.d);
        if (s < -0.3 || s > c.largo + 0.02) continue;
        const r = VA.len(VA.sub(v, VA.mul(c.d, s)));
        if (r <= c.r + 0.012) return true; // pared rugosa del taladro
      }
      return false;
    },
  };
  return T;
}

/** Emboquilles de una malla sobre la superficie real del frente (rayo hacia +x), con realce en el contorno. */
export function emboquillesMalla(malla, frenteFn, op = {}) {
  const { realce = 0.035, realcePiso = 0.03 } = op;
  return malla.taladros.map((t) => {
    const x = frenteFn(t.y, t.z).x;
    const perim = ["corona", "cuadrador", "arrastre"].includes(t.grupo);
    const d = VA.unit([1, perim && t.y > 2.5 ? realce : t.grupo === "arrastre" ? -realcePiso : 0, perim ? Math.sign(t.z) * realce : 0]);
    return { ...t, collar: [x, t.y, t.z], dir: d };
  });
}

/** A → B: huellas (trocha) de las ruedas de una máquina en su pose de reposo. */
export function huellasDe(M, ancho = 0.32) {
  const z = [...new Set(M.ruedas.map((w) => Math.round(w.centro[2] * 100) / 100))];
  return z.map((zz) => ({ z: zz, ancho }));
}

/**
 * Asienta una máquina sobre el piso del terreno: altura, cabeceo y alabeo por las ruedas (plano por mínimos cuadrados).
 * Devuelve el `_pose` para M.posar. x, z y rumbo los da el guion.
 */
export function asentar(M, valores, terreno, base = {}) {
  let pose = { x: 0, y: 0, z: 0, rumbo: 0, cabeceo: 0, alabeo: 0, ...base };
  for (let it = 0; it < 3; it++) {
    const ps = M.posar({ ...valores, _pose: pose, _sinMangueras: true });
    const pts = M.ruedas.map((w) => {
      const c = ps.mundo(w.grupo, w.centro);
      return [c[0], terreno.piso(c[0], c[2]) + w.R - (c[1] - pose.y), c[2]]; // altura de raíz que deja esa rueda en el piso
    });
    const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, mz = pts.reduce((a, p) => a + p[2], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
    let sxx = 0, sxy = 0, szz = 0, szy = 0;
    for (const p of pts) { sxx += (p[0] - mx) ** 2; sxy += (p[0] - mx) * (p[1] - my); szz += (p[2] - mz) ** 2; szy += (p[2] - mz) * (p[1] - my); }
    const gx = sxx > 1e-9 ? sxy / sxx : 0, gz = szz > 1e-9 ? szy / szz : 0;
    pose = { ...pose, y: my - gx * (mx - pose.x) - gz * (mz - pose.z), cabeceo: (Math.atan(gx) * 180) / Math.PI, alabeo: (-Math.atan(gz) * 180) / Math.PI };
  }
  return pose;
}
