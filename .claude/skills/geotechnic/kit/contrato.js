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
import { clamp, suave } from "./nucleo.js";

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
    let sxx = 0, sxy = 0, szz = 0, szy = 0, sxz = 0;
    for (const p of pts) { sxx += (p[0] - mx) ** 2; sxy += (p[0] - mx) * (p[1] - my); szz += (p[2] - mz) ** 2; szy += (p[2] - mz) * (p[1] - my); sxz += (p[0] - mx) * (p[2] - mz); }
    let gx, gz, pf, pl;
    if (Math.abs(pose.rumbo % 360) < 1e-9) { // rumbo 0: la fórmula de v2 (scoop y jumbo, física aprobada)
      gx = sxx > 1e-9 ? sxy / sxx : 0; gz = szz > 1e-9 ? szy / szz : 0; pf = gx; pl = gz;
    } else { // plano y = my + gx·(x − mx) + gz·(z − mz) por mínimos cuadrados (con el término cruzado) y girado al rumbo
      const det = sxx * szz - sxz * sxz;
      if (det > 1e-9) { gx = (sxy * szz - szy * sxz) / det; gz = (szy * sxx - sxy * sxz) / det; }
      else { gx = sxx > 1e-9 ? sxy / sxx : 0; gz = szz > 1e-9 ? szy / szz : 0; }
      const r = (pose.rumbo * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
      pf = gx * c - gz * s; // a lo largo del eje x de la máquina: (cos ρ, 0, −sin ρ)
      pl = gx * s + gz * c; // a lo largo de su eje z: (sin ρ, 0, cos ρ)
    }
    pose = { ...pose, y: my - gx * (mx - pose.x) - gz * (mz - pose.z), cabeceo: (Math.atan(pf) * 180) / Math.PI, alabeo: (-Math.atan(pl) * 180) / Math.PI };
  }
  if (Math.abs(pose.rumbo % 360) > 1e-9) {
    // En un piso alabeado (la espiral de un tajo es un helicoide) un chasis rígido no apoya todas las ruedas a la vez.
    // El juez acepta hasta 6 cm hundida y 2 cm en el aire: se baja la máquina hasta que ninguna rueda quede en el aire,
    // midiendo como el juez (tres puntos a lo ancho de cada banda, bajo el centro, perpendicular al eje).
    const ps = M.posar({ ...valores, _pose: pose, _sinMangueras: true });
    let alto = -Infinity;
    for (const w of M.ruedas) {
      const c = ps.mundo(w.grupo, w.centro), e = VA.unit(ps.dirMundo(w.grupo, w.eje)), ab = VA.perp(e, [0, -1, 0]);
      for (const k of [-0.45, 0, 0.45]) { const p = VA.add(VA.add(c, VA.mul(ab, w.R)), VA.mul(e, k * w.W)); alto = Math.max(alto, p[1] - terreno.piso(p[0], p[2])); }
    }
    if (alto > 0) pose = { ...pose, y: pose.y - alto };
  }
  return pose;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Tajo abierto (dispatch): bancos + rampa en espiral + fondo + meseta + chancadora + botadero, con rutas de acarreo.
// Mundo: x = este, y = arriba, z = sur (rumbo 0 = hacia +x; rumbo 90 = hacia −z, como M.posar). Metros.
// Planta: el fondo es una cápsula (segmento de largo `fondo.largo` en x, radio `fondo.radio`); cada contorno del tajo
// es una paralela a ella a distancia ρ. λ ∈ [0, 4) recorre el perímetro en sentido horario visto desde arriba
// (0 = extremo norte del casquete este, 1 = sur, 2 = casquete oeste, 3 = norte). La rampa baja con λ creciente.
// Cada vuelta de la rampa (una «pasada») empuja hacia afuera los bancos de encima en el ancho de la vía; bajo la vía
// queda roca a la inclinación de la cara (no relleno). Todo es puro y determinista.

/** Fuentes y estimados del diseño del tajo (van a `ter.metodologia` y a la ficha). */
export const DISENO_TAJO = {
  via: "Ojeda Ore 2022, hdl:20.500.14076/22773, fig. 2.14 y 2.16: ancho 40 m (efectivo 37 m), pretil 3 × 2 m, bombeo 3–4 %",
  rampa: "Yupanqui Sánchez 2025, hdl:20.500.14076/29254, pág. 17–18: rampas de 7–9 % (tajo A) y 9–11 % (tajo B)",
  banco: "R9/R10 de reglas-roca.md: banco 15 m, berma ≈ 7,5 m para 15 m (Montes Valderrama 2025, hdl:20.500.14076/29234, fig. 12)",
  reposo: "R6 de reglas-roca.md: talud de escombros a 33–35° (Perales Orellana 2011, hdl:20.500.14076/10463, pág. 116)",
  radio: "estimado: radio de giro de un camión clase 793 ≈ 14 m (catálogo, no verificado en el catálogo de fuentes); se diseña con 25 m en el fondo y 40 m en la vía",
  sentido: "estimado: tránsito por la derecha (el cargado sube por el carril de afuera)",
  maniobra: "estimado: el camión retrocede hasta dejar su eje trasero a 2 m del tope; cuadre a 15 m de la pala a lo largo de la pared y 8 m hacia adentro",
};

/**
 * Terreno de un tajo abierto (motor B) para el motor A, el juez y el dispatch.
 * op (todo opcional; m, ° y fracciones):
 *   cota (meseta, 0) · centro [x, z] · banco { n 6, altura 15, cara 70, berma 8 } · fondo { largo 240, radio 70 }
 *   via { ancho 40, pretil { alto 2, base 3 }, bombeo 0.03 } · rampa { pendiente 0.09, inicio λ 0.5, entrada 30,
 *   plano 60, remate 200, curva 40 (curvas verticales), bombeoEn 60 } · radio { piso 25, via 40 } · sentido "derecha" | "izquierda" · reposo 34 · base 15
 *   palas [{ id, lambda, distancia 10, monton { alto 10, largo 70, corona 6 }, radioCarga 17 }]
 *   destinos [{ id, tipo: "chancadora" | "botadero", punto [x, z] (ORIGEN del camión al descargar), rumbo (°, su nariz) }]
 *   botadero { alto 15, largo 150, ancho 120, acceso { pendiente 0.09, v 25 } } · chancadora { tope { alto 1.5, ancho 1.2 },
 *   tolva { largo 12, ancho 14, hondo 10 } } · holgura 2 (eje trasero → tope) · ejeTrasero 2.655 · maniobra 15
 *   macizo (kit/macizo.js, opcional: relieve facetado en las caras) · relieve (× del relieve, 1)
 * Devuelve { piso, libre, altura, tipo, normal, relieveEn, caja, rutas, kmRutas(), zonas, rampa, geometria, metodologia, avisos }.
 */
export function terrenoTajo(op = {}) {
  const rad = (gr) => (gr * Math.PI) / 180, TAU = 2 * Math.PI, md = (a) => ((a % TAU) + TAU) % TAU;
  const cota = op.cota ?? 0, [cx, cz] = op.centro || [0, 0];
  const bn = { n: 6, altura: 15, cara: 70, berma: 8, ...(op.banco || {}) };
  const fo = { largo: 240, radio: 70, ...(op.fondo || {}) };
  const via = { ancho: 40, bombeo: 0.03, ...(op.via || {}), pretil: { alto: 2, base: 3, ...(op.via?.pretil || {}) } };
  const ra = { pendiente: 0.09, inicio: 0.5, entrada: 30, plano: 60, remate: 200, curva: 40, bombeoEn: 60, ...(op.rampa || {}) };
  const radio = { piso: 25, via: 40, ...(op.radio || {}) };
  const sentido = op.sentido || "derecha", reposo = op.reposo ?? 34, holgura = op.holgura ?? 2, maniobra = op.maniobra ?? 15;
  const ejeTrasero = op.ejeTrasero ?? 2.655; // m del origen del camión a su eje trasero (modeloCamion: ruedas traseras en x = −2,655)
  const avisos = [];
  const N = bn.n, h = bn.altura, tanA = Math.tan(rad(bn.cara)), c = h / tanA, Bm = bn.berma, tanR = Math.tan(rad(reposo));
  const yF = cota - N * h, Lh = fo.largo / 2, R0 = fo.radio, W = via.ancho, P = via.pretil.base, PH = via.pretil.alto;
  const g = ra.pendiente, l0 = ra.inicio;
  // ── perfil de bancos sin rampa y línea de crestas (donde se apoya el borde interior de la vía)
  const H0 = (r) => { let y = yF; for (let k = 0; k < N; k++) y += h * clamp((r - k * (c + Bm)) / c); return y; };
  const A = (e) => c + ((e - yF - h) * (c + Bm)) / h;
  // ── coordenadas de cápsula
  const aCap = (x, z) => {
    const X = x - cx, Z = z - cz; let l, r;
    if (X > Lh) { const a = Math.atan2(Z, X - Lh); l = (a + Math.PI / 2) / Math.PI; r = Math.hypot(X - Lh, Z); }
    else if (X < -Lh) { let a = Math.atan2(Z, X + Lh); if (a < Math.PI / 2) a += TAU; l = 2 + (a - Math.PI / 2) / Math.PI; r = Math.hypot(X + Lh, Z); }
    else if (Z >= 0) { l = 1 + (Lh - X) / (2 * Lh); r = Z; }
    else { l = 3 + (X + Lh) / (2 * Lh); r = -Z; }
    return [((l % 4) + 4) % 4, r - R0];
  };
  const deCap = (l, rho) => {
    l = ((l % 4) + 4) % 4; const R = R0 + rho;
    if (l < 1) { const a = l * Math.PI - Math.PI / 2; return [cx + Lh + R * Math.cos(a), cz + R * Math.sin(a)]; }
    if (l < 2) return [cx + Lh - (l - 1) * 2 * Lh, cz + R];
    if (l < 3) { const a = Math.PI / 2 + (l - 2) * Math.PI; return [cx - Lh + R * Math.cos(a), cz + R * Math.sin(a)]; }
    return [cx - Lh + (l - 3) * 2 * Lh, cz - R];
  };
  const dLdl = (l, rho) => { l = ((l % 4) + 4) % 4; return l < 1 || (l >= 2 && l < 3) ? Math.PI * (R0 + rho) : 2 * Lh; };
  const arco0 = (l) => { // largo de perímetro (ρ = 0) desde λ = 0
    l = ((l % 4) + 4) % 4; const q = Math.floor(l), f = l - q, cap = Math.PI * R0, rec = 2 * Lh;
    return [0, cap, cap + rec, 2 * cap + rec][q] + f * (q % 2 ? rec : cap);
  };
  const perim0 = 2 * Math.PI * R0 + 4 * Lh;
  // ── rampa: e(λ) con pendiente g a lo largo del eje, iterando el corrimiento de los bancos
  const dl = 1 / 1500;
  let tab = null;
  const idxDe = (lu) => clamp((lu - l0) / dl, 0, tab.E.length - 1);
  const lee = (arr, lu) => { const i = idxDe(lu), i0 = Math.floor(i), i1 = Math.min(arr.length - 1, i0 + 1), f = i - i0; return arr[i0] * (1 - f) + arr[i1] * f; };
  const eDe = (lu) => lee(tab.E, lu), sDe = (lu) => lee(tab.S, lu);
  const tauDe = (lu) => (!tab || lu < l0 || lu > tab.lT ? 0 : 1 - suave(tab.sEnd + ra.plano, tab.sEnd + ra.plano + ra.remate, sDe(lu)));
  const Sde = (lu) => { let s = 0; for (let k = 1; k < 10; k++) s += tauDe(lu + 4 * k); return W * s; };
  for (let it = 0; it < 4; it++) {
    const E = [cota], S = [0];
    let lu = l0, e = cota, s = 0, sEnd = null, lEnd = null, rc = A(cota) + Sde(l0) + W / 2;
    for (;;) {
      const ln = lu + dl, rn = A(Math.max(e, yF)) + Sde(ln) + W / 2;
      const ds = Math.hypot(dLdl(lu + dl / 2, (rc + rn) / 2) * dl, rn - rc);
      // curvas verticales parabólicas de `curva` m arriba (la pendiente crece desde 0) y abajo (vuelve a 0 en el fondo)
      const fac = Math.max(0.02, Math.min(1, (s + ds / 2) / ra.curva, Math.sqrt(Math.max(0, 2 * (e - yF)) / (g * ra.curva))));
      let en = sEnd === null ? e - g * fac * ds : yF;
      if (sEnd === null && en <= yF) { const f = (e - yF) / (e - en); lEnd = lu + f * dl; sEnd = s + f * ds; en = yF; }
      lu = ln; s += ds; e = en; rc = rn; E.push(e); S.push(s);
      if (sEnd !== null && s > sEnd + ra.plano + ra.remate + 1) break;
      if (E.length > 2e5) throw new Error("terrenoTajo: la rampa no llega al fondo");
    }
    tab = { E, S, lEnd, sEnd, lT: lu };
  }
  const lDeS = (s) => { const S = tab.S; let a = 0, b = S.length - 1; while (b - a > 1) { const m = (a + b) >> 1; if (S[m] < s) a = m; else b = m; } return l0 + (a + (s - S[a]) / (S[b] - S[a] || 1)) * dl; };
  const largoRampa = tab.sEnd, vueltas = (tab.lEnd - l0) / 4;
  // ── sección de la vía (r: desde el eje, + hacia la pared): bombeo de corona en el ancho efectivo y pretil al vacío
  const seccion = (r, f) => {
    if (f <= 0) return 0;
    const corona = via.bombeo * Math.max(0, (W - P) / 2 - Math.abs(r - P / 2));
    const q = Math.abs(r + W / 2 - P / 2), top = 0.12 * P;
    const pre = q <= top ? PH : q <= P / 2 ? (PH * (P / 2 - q)) / (P / 2 - top) : 0;
    return f * (corona + pre);
  };
  const fSec = (lu) => { const s = sDe(lu); return suave(0, ra.bombeoEn, s) * suave(0, ra.bombeoEn, tab.sEnd - s); }; // bombeo y pretil entran y salen suave
  /** Tajo con rampa en (λ, ρ): { y, tipo }. */
  function tajo(l, rho) {
    const ps = [];
    for (let lu = l + 4 * Math.ceil((l0 - l) / 4); lu <= tab.lT; lu += 4) {
      const t = tauDe(lu); if (t <= 0) continue;
      const e = eDe(lu); ps.push({ lu, e, t, a: A(e) + Sde(lu) });
    }
    ps.sort((p, q) => p.a - q.a);
    let corr = 0, prev = -Infinity;
    for (const p of ps) {
      if (rho < p.a) {
        const b = H0(rho - corr), bu = p.e - (p.a - rho) * tanA, y = Math.max(b, prev, bu);
        return { y, tipo: y <= yF + 1e-9 ? "fondo" : "banco" };
      }
      const w = W * p.t;
      if (rho <= p.a + w) {
        if (p.t < 1) return { y: p.e, tipo: "fondo" };
        const r = rho - p.a - W / 2, f = fSec(p.lu), y = p.e + seccion(r, f);
        const pre = r < -W / 2 + P && y - p.e > 0.15;
        return { y, tipo: p.e <= yF + 1e-9 ? "fondo" : pre ? "pretil" : "rampa" };
      }
      corr += w; prev = p.e;
    }
    const y = Math.max(H0(rho - corr), prev);
    return { y, tipo: y >= cota - 1e-9 ? "meseta" : y <= yF + 1e-9 ? "fondo" : "banco" };
  }
  // ── eje de la rampa y carriles (r desde el eje, + hacia la pared)
  const P_LANE = { afuera: P / 2 + (W - P) / 4, adentro: P / 2 - (W - P) / 4 };
  const carril = { cargado: sentido === "derecha" ? P_LANE.afuera : P_LANE.adentro, vacio: sentido === "derecha" ? P_LANE.adentro : P_LANE.afuera };
  const ejeRho = (lu) => A(eDe(lu)) + Sde(lu) + W / 2;
  const puntoRampa = (lu, r) => deCap(lu, ejeRho(lu) + r);
  const rumboDe = (dx, dz) => (Math.atan2(-dz, dx) * 180) / Math.PI;
  const dirRampa = (lu, r, signo) => { // dirección de marcha en planta (signo +1 = bajando, λ creciente)
    const d = 0.5 / dLdl(lu, ejeRho(lu) + r), a = puntoRampa(lu - d, r), b = puntoRampa(lu + d, r);
    const v = [signo * (b[0] - a[0]), signo * (b[1] - a[1])], L = Math.hypot(v[0], v[1]); return [v[0] / L, v[1] / L];
  };
  const lIn = lDeS(tab.sEnd + ra.entrada); // entrada a la rampa desde el fondo
  // ── palas: en la pared del fondo, mirando al montón (contra la cara del banco 1)
  const palas = (op.palas || [{ id: "P1", lambda: 2.5 }, { id: "P2", lambda: 1.62 }]).map((p) => {
    const m = { alto: 10, largo: 70, corona: 6, ...(p.monton || {}) }, dist = p.distancia ?? 10, rc = p.radioCarga ?? 15, atras = p.atras ?? 8;
    const D = m.alto / tanR + m.corona, rr = -D - dist;
    const pt = deCap(p.lambda, rr), afuera = deCap(p.lambda, rr + 1);
    const n = [afuera[0] - pt[0], afuera[1] - pt[1]];
    const dd = 0.5 / dLdl(p.lambda, rr), ta = deCap(p.lambda - dd, rr), tb = deCap(p.lambda + dd, rr), tl = Math.hypot(tb[0] - ta[0], tb[1] - ta[1]);
    for (let lu = p.lambda + 4 * Math.ceil((l0 - p.lambda) / 4); lu <= tab.lT; lu += 4) if (tauDe(lu) > 0 && eDe(lu) < yF + h) avisos.push(`pala ${p.id}: la rampa baja cerca (λ ${p.lambda}); el montón puede quedar sobre la vía`);
    return { ...p, m, D, dist, rc, atras, pt, n, t: [(tb[0] - ta[0]) / tl, (tb[1] - ta[1]) / tl], a0: arco0(p.lambda) };
  });
  const montones = (l, rho) => {
    let y = -Infinity;
    for (const p of palas) {
      let da = Math.abs(arco0(l) - p.a0); da = Math.min(da, perim0 - da);
      const hEff = Math.min(p.m.alto, (p.m.largo / 2 - da) * tanR); if (hEff <= 0) continue;
      y = Math.max(y, yF + clamp((rho + p.D) * tanR, 0, hEff));
    }
    return y;
  };
  // ── destinos: chancadora (tope + tolva) y botadero (plataforma, pretil de cresta, acceso)
  const bo = { alto: 15, largo: 150, ancho: 120, ...(op.botadero || {}) }; bo.acceso = { pendiente: 0.09, v: 25, ...(op.botadero?.acceso || {}) };
  const ch = { ...(op.chancadora || {}) }; ch.tope = { alto: 1.5, ancho: 1.2, ...(ch.tope || {}) }; ch.tolva = { largo: 12, ancho: 14, hondo: 10, ...(ch.tolva || {}) };
  const rimRho = A(cota) + W;
  const destinos = (op.destinos || [
    { id: "chancadora", tipo: "chancadora", punto: [cx + Lh + R0 + rimRho + 130, cz - 120], rumbo: 180 },
    { id: "botadero", tipo: "botadero", punto: [cx - Lh - R0 - rimRho - 120, cz - 200], rumbo: 0 },
  ]).map((d) => {
    const th = rad(d.rumbo), f = [Math.cos(th), -Math.sin(th)], iz = [-Math.sin(th), -Math.cos(th)];
    return { ...d, f, iz,
      loc: (x, z) => { const dx = x - d.punto[0], dz = z - d.punto[1]; return [dx * f[0] + dz * f[1], dx * iz[0] + dz * iz[1]]; },
      mundo: (u, v) => [d.punto[0] + u * f[0] + v * iz[0], d.punto[1] + u * f[1] + v * iz[1]] };
  });
  const trapecio = (q, base, alto, top = 0.12) => { q = Math.abs(q); const t = top * base; return q <= t ? alto : q <= base / 2 ? (alto * (base / 2 - q)) / (base / 2 - t) : 0; };
  const rectIn = (u, v, u0, u1, v0, v1) => Math.min(u - u0, u1 - u, v - v0, v1 - v); // > 0 dentro
  const rectOut = (u, v, u0, u1, v0, v1) => Math.hypot(Math.max(u0 - u, 0, u - u1), Math.max(v0 - v, 0, v - v1));
  for (const d of destinos) {
    if (d.tipo === "chancadora") {
      const u1 = -holgura - ejeTrasero, u0 = u1 - ch.tope.ancho, t1 = u0, t0 = t1 - ch.tolva.largo, wv = ch.tolva.ancho / 2;
      d.geo = { tope: [u0, u1, -wv - 2, wv + 2], tolva: [t0, t1, -wv, wv] };
    } else {
      const uC = -holgura - ejeTrasero - P - 0.5, La = bo.alto / bo.acceso.pendiente;
      d.geo = { uC, plataforma: [uC, uC + bo.largo, -bo.ancho / 2, bo.ancho / 2], acceso: { u0: uC + bo.largo, u1: uC + bo.largo + La, v: bo.acceso.v, La } };
    }
  }
  function rasgos(x, z, base) {
    let { y, tipo } = base;
    for (const d of destinos) {
      const [u, v] = d.loc(x, z), G = d.geo;
      if (d.tipo === "chancadora") {
        const [a0, a1, b0, b1] = G.tope, [t0, t1, w0, w1] = G.tolva;
        if (u > t0 - 3 && u < a1 + 1 && v > b0 - 3 && v < b1 + 3) {
          const dT = rectIn(u, v, a0, a1, b0, b1);
          if (dT > -0.2) { const yt = cota + ch.tope.alto * clamp((dT + 0.2) / 0.4); if (yt > y) { y = yt; tipo = "chancadora"; } }
          const dIn = rectIn(u, v, t0, t1, w0, w1);
          if (dIn > 0) { y = Math.min(y, cota - ch.tolva.hondo * suave(0, 0.5, dIn)); tipo = "chancadora"; }
          else if (u < t1) { const dO = rectOut(u, v, t0, t1, w0, w1); if (dO < 1.2) { const m = cota + 1.2 * clamp((1.2 - dO) / 0.3); if (m > y) { y = m; tipo = "chancadora"; } } }
        }
      } else {
        const [p0, p1, q0, q1] = G.plataforma, Hd = cota + bo.alto;
        const dO = rectOut(u, v, p0, p1, q0, q1);
        let yb = Hd - dO * tanR;
        if (dO === 0) yb += trapecio(u - (G.uC + P / 2), P, PH) * suave(0, 3, Math.min(v - q0, q1 - v));
        const ac = G.acceso;
        if (u >= ac.u0 && u <= ac.u1) {
          const e = Hd - (bo.alto * (u - ac.u0)) / ac.La, dv = Math.abs(v - ac.v) - W / 2;
          yb = Math.max(yb, dv <= 0 ? e : e - dv * tanR);
        }
        if (yb > Math.max(y, cota) + 1e-9) { y = yb; tipo = "botadero"; } // relleno sobre la meseta: no se derrama al tajo
      }
    }
    return { y, tipo };
  }
  /** Altura y tipo de la superficie (sin relieve de bloques) en (x, z). */
  function sitio(x, z) {
    const [l, rho] = aCap(x, z);
    let s = tajo(l, rho);
    if (palas.length && rho < 3 * h) { const ym = montones(l, rho); if (ym > s.y + 1e-9) s = { y: ym, tipo: "monton" }; }
    return rasgos(x, z, s);
  }
  const altura = (x, z) => sitio(x, z).y;
  // relieve facetado (solo en caras empinadas; vías, bermas y fondo quedan exactos)
  const mac = op.macizo || null, ampR = op.relieve ?? 1, tA = Math.tan(rad(38)), tB = Math.tan(rad(55));
  const relieveEn = (x, z, gx, gz, y = altura(x, z)) => {
    if (!mac) return 0;
    const w = suave(tA, tB, Math.hypot(gx, gz)); if (w <= 0) return 0;
    return w * ampR * mac.relieve(x, y, z, 1).d;
  };
  const gradiente = (x, z, e = 0.2) => [(altura(x + e, z) - altura(x - e, z)) / (2 * e), (altura(x, z + e) - altura(x, z - e)) / (2 * e)];
  const normal = (x, z) => { const [gx, gz] = gradiente(x, z), L = Math.hypot(gx, 1, gz); return [-gx / L, 1 / L, -gz / L]; };

  // ── caminos de radio acotado (Dubins) en el marco (X, Y) = (x, −z), rumbo = ángulo antihorario
  const avanza = (q, tipo, L, R) => {
    const [X, Y, th] = q;
    if (tipo === "S") return [X + L * Math.cos(th), Y + L * Math.sin(th), th];
    const f = L / R;
    if (tipo === "L") { const ox = X - R * Math.sin(th), oy = Y + R * Math.cos(th); return [ox + R * Math.sin(th + f), oy - R * Math.cos(th + f), th + f]; }
    const ox = X + R * Math.sin(th), oy = Y - R * Math.cos(th); return [ox - R * Math.sin(th - f), oy + R * Math.cos(th - f), th - f];
  };
  function dubins(q0, q1, R) {
    const dx = q1[0] - q0[0], dy = q1[1] - q0[1], d = Math.hypot(dx, dy) / R, phi = Math.atan2(dy, dx);
    const a = md(q0[2] - phi), b = md(q1[2] - phi), sa = Math.sin(a), sb = Math.sin(b), ca = Math.cos(a), cb = Math.cos(b), cab = Math.cos(a - b);
    const out = [];
    const pon = (w, t, p, q) => { if ([t, p, q].some((v) => !Number.isFinite(v) || v < -1e-9)) return; out.push({ segs: [[w[0], t * R], [w[1], p * R], [w[2], q * R]], largo: (t + p + q) * R }); };
    let p2 = 2 + d * d - 2 * cab + 2 * d * (sa - sb);
    if (p2 >= 0) { const t1 = Math.atan2(cb - ca, d + sa - sb); pon("LSL", md(-a + t1), Math.sqrt(p2), md(b - t1)); }
    p2 = 2 + d * d - 2 * cab + 2 * d * (sb - sa);
    if (p2 >= 0) { const t1 = Math.atan2(ca - cb, d - sa + sb); pon("RSR", md(a - t1), Math.sqrt(p2), md(-b + t1)); }
    p2 = -2 + d * d + 2 * cab + 2 * d * (sa + sb);
    if (p2 >= 0) { const p = Math.sqrt(p2), t2 = Math.atan2(-ca - cb, d + sa + sb) - Math.atan2(-2, p); pon("LSR", md(-a + t2), p, md(-md(b) + t2)); }
    p2 = d * d - 2 + 2 * cab - 2 * d * (sa + sb);
    if (p2 >= 0) { const p = Math.sqrt(p2), t2 = Math.atan2(ca + cb, d - sa - sb) - Math.atan2(2, p); pon("RSL", md(a - t2), p, md(md(b) - t2)); }
    let tq = (6 - d * d + 2 * cab + 2 * d * (sa - sb)) / 8;
    if (Math.abs(tq) <= 1) { const p = md(TAU - Math.acos(tq)), t = md(a - Math.atan2(ca - cb, d - sa + sb) + p / 2); pon("RLR", t, p, md(a - b - t + p)); }
    tq = (6 - d * d + 2 * cab + 2 * d * (-sa + sb)) / 8;
    if (Math.abs(tq) <= 1) { const p = md(TAU - Math.acos(tq)), t = md(-a - Math.atan2(ca - cb, d + sa - sb) + p / 2); pon("LRL", t, p, md(b - a - t + p)); }
    // verificación: se integra cada palabra y se descarta la que no llega (palabras de Dubins 1957)
    return out.filter((w) => { let q = q0; for (const [t, L] of w.segs) q = avanza(q, t, L, R); return Math.hypot(q[0] - q1[0], q[1] - q1[1]) < 1e-3 * R + 1e-6 && Math.abs(Math.sin((q[2] - q1[2]) / 2)) < 1e-4; });
  }
  const muestrear = (q0, segs, R, paso = 2) => {
    const pts = [[q0[0], q0[1]]]; let q = q0;
    for (const [t, L] of segs) { if (L < 1e-6) continue; const n = Math.max(1, Math.ceil(L / paso)); for (let k = 1; k <= n; k++) { const qq = avanza(q, t, (L * k) / n, R); pts.push([qq[0], qq[1]]); } q = avanza(q, t, L, R); }
    return pts;
  };
  const aXY = (p, rumbo) => [p[0], -p[1], rad(rumbo)];
  const deXY = (pts) => pts.map(([X, Y]) => [X, -Y]);
  let fallo = null; // primer punto que no pasó (para el mensaje de error)
  const todosValidos = (pts, valido, desde = 0) => {
    for (let i = desde; i < pts.length; i++) {
      const j = Math.min(pts.length - 1, i + 1), k = Math.max(0, j - 1), dx = pts[j][0] - pts[k][0], dz = pts[j][1] - pts[k][1], L = Math.hypot(dx, dz) || 1;
      if (!valido(pts[i][0], pts[i][1], [dx / L, dz / L])) { if (!fallo) fallo = pts[i].map((v) => +v.toFixed(1)); return false; }
    }
    return true;
  };
  /** Camino más corto de radio ≥ R entre dos poses ({ punto [x, z], rumbo }) cuyos puntos pasan `valido(x, z, dir)`. */
  function camino(desde, hasta, R, valido, etiqueta) {
    const q0 = aXY(desde.punto, desde.rumbo), q1 = aXY(hasta.punto, hasta.rumbo), cands = [];
    fallo = null;
    for (const la of [0, 25, 50, 100, 160]) for (const lb of [0, 25, 50, 100, 160]) {
      const a = avanza(q0, "S", la, R), b = [q1[0] - lb * Math.cos(q1[2]), q1[1] - lb * Math.sin(q1[2]), q1[2]];
      for (const w of dubins(a, b, R)) cands.push({ segs: [["S", la], ...w.segs, ["S", lb]], largo: la + lb + w.largo });
    }
    cands.sort((u, v) => u.largo - v.largo);
    for (const cd of cands) { const pts = deXY(muestrear(q0, cd.segs, R)); if (todosValidos(pts.slice(0, -3), valido, 3)) return pts; } // los extremos son poses dadas (sobre piso válido)
    throw new Error(`terrenoTajo: no hay camino libre de radio ${R} m para ${etiqueta} (falla en ${fallo}, ${sitio(...fallo).tipo})`);
  }
  const plano = (y0, ancho = 5, extra = null) => (x, z, d) => {
    for (const k of [-ancho, 0, ancho]) { const px = x - d[1] * k, pz = z + d[0] * k; if (Math.abs(altura(px, pz) - y0) > 0.02) return false; }
    return !extra || extra(x, z);
  };
  const lejosPalas = (x, z) => palas.every((p) => Math.hypot(x - p.pt[0], z - p.pt[1]) > 13);
  const enFondo = plano(yF, 5, lejosPalas), enMeseta = plano(cota, 5), enBotadero = plano(cota + bo.alto, 5);
  // ── maniobra en un punto de descarga o carguío: llega de frente a Q y retrocede (cuarto de giro + recta) hasta el punto
  function maniobraEn(spot, R, valido, etiqueta) {
    fallo = null;
    for (const lado of [1, -1]) {
      const q0 = aXY(spot.punto, spot.rumbo), segs = [["S", maniobra], [lado > 0 ? "L" : "R", (R * Math.PI) / 2]];
      const pts = deXY(muestrear(q0, segs, R)); let q = q0; for (const [t, L] of segs) q = avanza(q, t, L, R);
      if (todosValidos(pts, valido, 3)) return { Q: { punto: [q[0], -q[1]], rumbo: (q[2] * 180) / Math.PI }, ida: pts };
    }
    throw new Error(`terrenoTajo: no cabe la maniobra en ${etiqueta} (falla en ${fallo}, ${sitio(...fallo).tipo}; punto ${spot.punto.map((v) => v.toFixed(1))}, rumbo ${spot.rumbo.toFixed(0)})`);
  }
  // cuadre del camión junto a cada pala (eje trasero bajo el radio de descarga), con la nariz hacia la entrada de la rampa
  const entradaPiso = (signo, r) => ({ punto: puntoRampa(lIn, r), rumbo: rumboDe(...dirRampa(lIn, r, signo)) });
  const ent = puntoRampa(lIn, 0);
  for (const p of palas) {
    const opc = [1, -1].map((s) => [p.pt[0] + s * p.t[0] * p.rc - p.n[0] * p.atras, p.pt[1] + s * p.t[1] * p.rc - p.n[1] * p.atras]);
    opc.sort((u, v) => Math.hypot(u[0] - ent[0], u[1] - ent[1]) - Math.hypot(v[0] - ent[0], v[1] - ent[1]));
    const pt = opc[0], dir = Math.sign((ent[0] - pt[0]) * p.t[0] + (ent[1] - pt[1]) * p.t[1]) || 1;
    p.cuadre = { punto: pt, rumbo: rumboDe(dir * p.t[0], dir * p.t[1]) };
    p.rumbo = rumboDe(p.n[0], p.n[1]);
    p.maniobra = maniobraEn(p.cuadre, radio.piso, enFondo, p.id);
  }
  // ── rutas
  const tramoRampa = (r, subiendo) => { // de la entrada (fondo) a la boca (meseta), o al revés
    const pts = []; let lu = lIn;
    while (lu > l0) { pts.push(puntoRampa(lu, r)); lu -= 2 / dLdl(lu, ejeRho(lu) + r); }
    pts.push(puntoRampa(l0, r));
    return subiendo ? pts : pts.reverse();
  };
  const boca = (signo, r) => ({ punto: puntoRampa(l0, r), rumbo: rumboDe(...dirRampa(l0, r, signo)) });
  const rutas = {};
  function armarRuta(id, de, a, tramos) {
    const P3 = [], S = [0], marcas = [];
    for (const t of tramos) {
      const i0 = Math.max(0, P3.length - 1);
      t.pts.forEach((q, k) => { if (P3.length && k === 0 && Math.hypot(q[0] - P3[P3.length - 1][0], q[1] - P3[P3.length - 1][2]) < 0.05) return; P3.push([q[0], altura(q[0], q[1]), q[1]]); });
      marcas.push({ tipo: t.tipo, i0, i1: P3.length - 1, reversa: !!t.reversa });
    }
    const H2 = [0];
    for (let i = 1; i < P3.length; i++) {
      S.push(S[i - 1] + Math.hypot(P3[i][0] - P3[i - 1][0], P3[i][1] - P3[i - 1][1], P3[i][2] - P3[i - 1][2]));
      H2.push(H2[i - 1] + Math.hypot(P3[i][0] - P3[i - 1][0], P3[i][2] - P3[i - 1][2]));
    }
    const hz = (i, j) => H2[j] - H2[i];
    const out = marcas.map((m) => {
      const L = hz(m.i0, m.i1), media = L > 0 ? (P3[m.i1][1] - P3[m.i0][1]) / L : 0;
      let max = 0, rmin = Infinity;
      for (let i = m.i0, j = m.i0, a = m.i0, b = m.i0; i <= m.i1; i++) { // pendiente en ventanas de 20 m; radio por tres puntos a ±6 m
        while (j < m.i1 && hz(i, j) < 20) j++;
        if (hz(i, j) >= 19.5) max = Math.max(max, Math.abs(P3[j][1] - P3[i][1]) / hz(i, j));
        while (a < i && hz(a + 1, i) >= 6) a++;
        while (b < m.i1 && hz(i, b) < 6) b++;
        if (hz(a, i) >= 5.5 && hz(i, b) >= 5.5) {
          const ax = P3[a][0], az = P3[a][2], bx = P3[i][0], bz = P3[i][2], qx = P3[b][0], qz = P3[b][2];
          const cr = Math.abs((bx - ax) * (qz - az) - (bz - az) * (qx - ax));
          if (cr > 1e-6) rmin = Math.min(rmin, (Math.hypot(bx - ax, bz - az) * Math.hypot(qx - bx, qz - bz) * Math.hypot(qx - ax, qz - az)) / (2 * cr));
        }
      }
      return { tipo: m.tipo, reversa: m.reversa, s0: S[m.i0], s1: S[m.i1], largo: S[m.i1] - S[m.i0], pendienteMedia: media, pendienteMax: max, radioMin: rmin };
    });
    const largo = S[S.length - 1];
    /** Pose sobre la ruta a s m del inicio: punto en el piso, dirección de marcha, rumbo de la nariz (±180 en reversa), pendiente. */
    const en = (s) => {
      s = clamp(s, 0, largo); let a = 0, b = S.length - 1; while (b - a > 1) { const m = (a + b) >> 1; if (S[m] < s) a = m; else b = m; }
      const f = (s - S[a]) / (S[b] - S[a] || 1), p = [0, 1, 2].map((k) => P3[a][k] * (1 - f) + P3[b][k] * f);
      p[1] = altura(p[0], p[2]);
      const d = [P3[b][0] - P3[a][0], P3[b][1] - P3[a][1], P3[b][2] - P3[a][2]], L2 = Math.hypot(d[0], d[2]) || 1;
      const tr = out.find((t) => s >= t.s0 - 1e-9 && s <= t.s1 + 1e-9) || out[out.length - 1];
      const rumbo = rumboDe(d[0], d[2]) + (tr.reversa ? 180 : 0);
      return { p, dir: VA.unit(d), rumbo: ((rumbo % 360) + 540) % 360 - 180, pendiente: d[1] / L2, reversa: tr.reversa, tramo: tr.tipo };
    };
    const rampa = out.filter((t) => t.tipo === "rampa");
    rutas[id] = { id, de, a, puntos: P3, s: S, largo, km: largo / 1000, tramos: out, en,
      pendiente: { diseno: g, rampaMedia: rampa.length ? Math.abs(rampa[0].pendienteMedia) : 0, rampaMax: Math.max(0, ...rampa.map((t) => t.pendienteMax)) },
      radioMin: Math.min(...out.filter((t) => !t.reversa).map((t) => t.radioMin)) };
  }
  const lado = sentido === "derecha" ? 1 : -1;
  const recta = (d, ua, ub, v) => { const n = Math.ceil(Math.abs(ub - ua) / 2); return Array.from({ length: n + 1 }, (_, k) => d.mundo(ua + ((ub - ua) * k) / n, v)); };
  for (const d of destinos) {
    const esBot = d.tipo === "botadero", ac = d.geo.acceso;
    const man = maniobraEn({ punto: d.punto, rumbo: d.rumbo }, radio.piso, esBot ? enBotadero : enMeseta, d.id);
    d.maniobra = man.Q;
    for (const p of palas) {
      // cargado: cuadre → fondo → rampa (sube) → meseta → (acceso al botadero) → Q → retroceso al punto de descarga
      const t = [{ tipo: "fondo", pts: camino(p.cuadre, entradaPiso(-1, carril.cargado), radio.piso, enFondo, `${p.id}→rampa`) },
        { tipo: "rampa", pts: tramoRampa(carril.cargado, true) }];
      if (esBot) {
        const vC = ac.v - (W / 4) * lado; // subiendo hacia −u, el carril de la derecha
        t.push({ tipo: "via", pts: camino(boca(-1, carril.cargado), { punto: d.mundo(ac.u1 + 1, vC), rumbo: d.rumbo + 180 }, radio.via, enMeseta, `rampa→${d.id}`) });
        t.push({ tipo: "acceso", pts: recta(d, ac.u1 + 1, ac.u0 - 1, vC) });
        t.push({ tipo: "plataforma", pts: camino({ punto: d.mundo(ac.u0 - 1, vC), rumbo: d.rumbo + 180 }, man.Q, radio.piso, enBotadero, `acceso→${d.id}`) });
      } else t.push({ tipo: "via", pts: camino(boca(-1, carril.cargado), man.Q, radio.via, enMeseta, `rampa→${d.id}`) });
      t.push({ tipo: "retroceso", reversa: true, pts: man.ida.slice().reverse() });
      armarRuta(`${p.id}→${d.id}`, p.id, d.id, t);
      // vacío: punto → (plataforma, acceso) → meseta → rampa (baja) → fondo → Q de la pala → retroceso al cuadre
      const v = [];
      if (esBot) {
        const vV = ac.v + (W / 4) * lado;
        v.push({ tipo: "plataforma", pts: camino({ punto: d.punto, rumbo: d.rumbo }, { punto: d.mundo(ac.u0 - 1, vV), rumbo: d.rumbo }, radio.piso, enBotadero, `${d.id}→acceso`) });
        v.push({ tipo: "acceso", pts: recta(d, ac.u0 - 1, ac.u1 + 1, vV) });
        v.push({ tipo: "via", pts: camino({ punto: d.mundo(ac.u1 + 1, vV), rumbo: d.rumbo }, boca(1, carril.vacio), radio.via, enMeseta, `${d.id}→rampa`) });
      } else v.push({ tipo: "via", pts: camino({ punto: d.punto, rumbo: d.rumbo }, boca(1, carril.vacio), radio.via, enMeseta, `${d.id}→rampa`) });
      v.push({ tipo: "rampa", pts: tramoRampa(carril.vacio, false) });
      v.push({ tipo: "fondo", pts: camino(entradaPiso(1, carril.vacio), p.maniobra.Q, radio.piso, enFondo, `rampa→${p.id}`) });
      v.push({ tipo: "retroceso", reversa: true, pts: p.maniobra.ida.slice().reverse() });
      armarRuta(`${d.id}→${p.id}`, d.id, p.id, v);
    }
  }
  // ── caja del bloque (la misma para mallaTajo y para libre: fuera de ella es aire)
  const lo = [Infinity, Infinity], hi = [-Infinity, -Infinity];
  const ext = (x, z, m = 0) => { lo[0] = Math.min(lo[0], x - m); lo[1] = Math.min(lo[1], z - m); hi[0] = Math.max(hi[0], x + m); hi[1] = Math.max(hi[1], z + m); };
  for (let k = 0; k <= 400; k++) {
    const l = (4 * k) / 400; let rr = A(cota) + W;
    for (let lu = l + 4 * Math.ceil((l0 - l) / 4); lu <= tab.lT; lu += 4) rr += W * tauDe(lu);
    const q = deCap(l, rr + c); ext(q[0], q[1], 40);
  }
  for (const r of Object.values(rutas)) for (const p of r.puntos) ext(p[0], p[2], 40);
  for (const d of destinos) {
    if (d.tipo === "botadero") { const [p0, , q0, q1] = d.geo.plataforma, m = bo.alto / tanR + 25; for (const [u, v] of [[p0, q0], [p0, q1], [d.geo.acceso.u1, q0], [d.geo.acceso.u1, q1]]) { const q = d.mundo(u, v); ext(q[0], q[1], m); } }
    else ext(d.punto[0], d.punto[1], 60);
  }
  const caja = { min: [Math.floor(lo[0]), yF - (op.base ?? 15), Math.floor(lo[1])], max: [Math.ceil(hi[0]), cota + bo.alto + 25, Math.ceil(hi[1])] };
  const fueraCaja = (p) => {
    let afuera = 0, adentro = -Infinity;
    for (let q = 0; q < 3; q++) { const m = (caja.min[q] + caja.max[q]) / 2, e = Math.abs(p[q] - m) - (caja.max[q] - caja.min[q]) / 2; if (e > 0) afuera += e * e; adentro = Math.max(adentro, e); }
    return afuera > 0 ? Math.sqrt(afuera) : adentro;
  };
  const p3 = (q) => [q[0], altura(q[0], q[1]), q[1]];
  return {
    caja, cota, fondo: yF, avisos, cavidades: [], macizo: mac,
    /** Cota exacta del piso bajo una rueda o una oruga (vías, rampa, bermas, fondo, meseta, plataformas). */
    piso: altura,
    altura, sitio, tipo: (x, z) => sitio(x, z).tipo, normal, gradiente, relieveEn,
    /** Distancia con signo a la superficie del bloque (m): ≥ 0 en el aire, < 0 en la roca, el botadero o un montón. */
    libre(p) {
      const y = altura(p[0], p[2]), [gx, gz] = gradiente(p[0], p[2]), L = Math.hypot(1, gx, gz), d0 = (p[1] - y) / L;
      let d = d0;
      if (mac) { // relieve en el pie de la normal (el punto de la superficie más cercano), no en la vertical de p
        const qx = p[0] + (gx / L) * d0, qz = p[2] + (gz / L) * d0, [hx, hz] = gradiente(qx, qz);
        d -= relieveEn(qx, qz, hx, hz);
      }
      return Math.max(d, fueraCaja(p));
    },
    enCavidad: () => false,
    rutas,
    /** Largos en km para simularFlota({ rutas }) (cargado, de pala a destino). */
    kmRutas: () => Object.fromEntries(Object.values(rutas).filter((r) => palas.some((p) => p.id === r.de)).map((r) => [`${r.de}→${r.a}`, r.km])),
    zonas: {
      palas: palas.map((p) => ({ id: p.id, lambda: p.lambda, punto: [p.pt[0], yF, p.pt[1]], rumbo: p.rumbo,
        cuadre: { punto: p3(p.cuadre.punto), rumbo: p.cuadre.rumbo }, maniobra: { punto: p3(p.maniobra.Q.punto), rumbo: p.maniobra.Q.rumbo },
        monton: { alto: p.m.alto, largo: p.m.largo, reposo, pie: p3(deCap(p.lambda, -p.D)) } })),
      destinos: destinos.map((d) => ({ id: d.id, tipo: d.tipo, punto: p3(d.punto), rumbo: d.rumbo,
        maniobra: { punto: p3(d.maniobra.punto), rumbo: d.maniobra.rumbo }, tope: p3(d.mundo(-holgura - ejeTrasero, 0)) })),
    },
    rampa: { pendiente: g, largo: largoRampa, vueltas, inicio: l0, fin: tab.lEnd, entrada: lIn, carriles: carril,
      /** Punto del eje de la rampa en λ (sin vuelta: λ de inicio a fin). */
      eje: (lu) => p3(puntoRampa(lu, 0)), boca: p3(puntoRampa(l0, 0)), pie: p3(puntoRampa(tab.lEnd, 0)) },
    geometria: { banco: bn, fondo: fo, via, rampa: ra, radio, reposo, botadero: bo, chancadora: ch, holgura, ejeTrasero, maniobra, centro: [cx, cz], aCap, deCap,
      destinos: destinos.map((d) => ({ id: d.id, tipo: d.tipo, geo: d.geo, mundo: d.mundo })) },
    metodologia: [
      { metodo: "Bancos", parametros: `${N} bancos de ${h} m · cara ${bn.cara}° · berma ${Bm} m · fondo ${fo.largo + 2 * R0} × ${2 * R0} m`, fuente: DISENO_TAJO.banco },
      { metodo: "Rampa en espiral", parametros: `pendiente ${(g * 100).toFixed(1)} % en el eje · curvas verticales de ${ra.curva} m · ${largoRampa.toFixed(0)} m · ${vueltas.toFixed(2)} vueltas · la pared de encima se corre ${W} m por pasada`, fuente: DISENO_TAJO.rampa },
      { metodo: "Sección de vía", parametros: `${W} m (efectivo ${W - P} m) · pretil ${P} × ${PH} m al vacío · bombeo ${(via.bombeo * 100).toFixed(1)} % (solo en la rampa; la meseta va plana)`, fuente: DISENO_TAJO.via },
      { metodo: "Caminos de radio acotado (Dubins)", parametros: `radio ${radio.piso} m en el fondo y plataformas · ${radio.via} m en la meseta`, fuente: DISENO_TAJO.radio },
      { metodo: "Montón, botadero y taludes de relleno", parametros: `reposo ${reposo}°`, fuente: DISENO_TAJO.reposo },
      { metodo: "Maniobra de descarga y carguío", parametros: `recta de ${maniobra} m + cuarto de giro de ${radio.piso} m, en retroceso · eje trasero (${ejeTrasero} m detrás del origen del camión) a ${holgura} m del tope`, fuente: DISENO_TAJO.maniobra },
      { metodo: "Tránsito", parametros: `por la ${sentido}`, fuente: DISENO_TAJO.sentido },
      ...(mac ? mac.metodologia : []),
    ],
  };
}
