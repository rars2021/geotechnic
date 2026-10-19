// Geotechnic · motor A (equipos y mecanismos) · modelo puro, sin three: corre igual en Node (juez) y en la página.
//
// Disciplina de Anatomy (wheresryan22/anatomy, MIT; copia sin cambios en anatomia/, ver anatomia/LICENSE-anatomy):
//  - lista de piezas antes de la geometría; cada pieza es un sólido CONVEXO (prisma de polígono convexo, redondo,
//    llanta) con su casco exacto, que es lo que audita el juez;
//  - grupos rígidos con pose (fijo, bisagra, desliza), anidados; todo se escribe en coordenadas de la máquina EN REPOSO;
//  - uniones reales: un pasador atraviesa las dos piezas que une (única interpenetración permitida, declarada);
//  - un cilindro hidráulico va de pasador a pasador: su largo sale de la pose, nunca se dibuja «a ojo»;
//  - una manguera va de puerto a puerto (cada puerto sobre la superficie de su pieza); su curva sale de su largo real.
// Mundo: metros; x adelante, y arriba, z izquierda; origen en el piso bajo la articulación (o el centro) de la máquina.

// ── vectores, rotaciones y poses (nombres con sufijo A: el armado concatena módulos en un solo ámbito)
export const VA = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  unit: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
  dist: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]),
  /** Perpendicular unitaria a `a` que más se parece a `pref`. */
  perp: (a, pref = [0, 1, 0]) => {
    const u = VA.unit(a); let p = VA.sub(pref, VA.mul(u, VA.dot(pref, u)));
    if (VA.len(p) < 1e-6) p = VA.sub([1, 0, 0], VA.mul(u, u[0]));
    if (VA.len(p) < 1e-6) p = VA.sub([0, 0, 1], VA.mul(u, u[2]));
    return VA.unit(p);
  },
};

/** Rotaciones 3×3 (fila mayor). */
export const RA = {
  I: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  eje(e, grados) {
    const [x, y, z] = VA.unit(e), a = (grados * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), k = 1 - c;
    return [c + x * x * k, x * y * k - z * s, x * z * k + y * s, y * x * k + z * s, c + y * y * k, y * z * k - x * s, z * x * k - y * s, z * y * k + x * s, c + z * z * k];
  },
  mul(A, B) {
    const C = new Array(9);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j];
    return C;
  },
  vec: (R, v) => [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]],
  tr: (R) => [R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]],
  /** Columnas x, y, z → matriz. */
  columnas: (x, y, z) => [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]],
};

/** Poses rígidas { R, t }: p_mundo = R·p + t. */
export const TA = {
  id: () => ({ R: RA.I.slice(), t: [0, 0, 0] }),
  comp: (A, B) => ({ R: RA.mul(A.R, B.R), t: VA.add(RA.vec(A.R, B.t), A.t) }),
  ap: (T, p) => VA.add(RA.vec(T.R, p), T.t),
  dir: (T, d) => RA.vec(T.R, d),
  inv: (T) => { const Rt = RA.tr(T.R); return { R: Rt, t: VA.mul(RA.vec(Rt, T.t), -1) }; },
  /** Giro de `grados` alrededor del eje `e` que pasa por `p`. */
  bisagra: (p, e, grados) => { const R = RA.eje(e, grados); return { R, t: VA.sub(p, RA.vec(R, p)) }; },
  desliza: (d, s) => ({ R: RA.I.slice(), t: VA.mul(VA.unit(d), s) }),
  /** Marco local → mundo: origen o, eje x local = ex, eje z local cerca de ezPref. */
  marco: (o, ex, ezPref) => {
    const x = VA.unit(ex), z = VA.perp(x, ezPref), y = VA.cross(z, x);
    return { R: RA.columnas(x, y, z), t: o.slice() };
  },
};

/**
 * Marco de una pieza (el de Anatomy, `frameOf`): origen o, eje a (extrusión o eje de giro), u y v en la sección.
 * u se toma perpendicular a a, lo más cerca posible de `uPref`.
 */
export function marcoA(o, a, uPref = [0, 1, 0]) {
  const aa = VA.unit(a), u = VA.perp(aa, uPref), v = VA.cross(aa, u);
  return { o: o.slice(), a: aa, u, v };
}
const enMarco = (F, s, x, y) => [F.o[0] + F.a[0] * s + F.u[0] * x + F.v[0] * y, F.o[1] + F.a[1] * s + F.u[1] * x + F.v[1] * y, F.o[2] + F.a[2] * s + F.u[2] * x + F.v[2] * y];

/** ¿Polígono 2D convexo? (tolerancia para vértices alineados) */
export function convexoA(pol) {
  let signo = 0;
  for (let i = 0; i < pol.length; i++) {
    const a = pol[i], b = pol[(i + 1) % pol.length], c = pol[(i + 2) % pol.length];
    const z = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(z) < 1e-9) continue;
    if (!signo) signo = Math.sign(z); else if (Math.sign(z) !== signo) return false;
  }
  return true;
}

/** Intersección de dos circunferencias en un plano 2D: el punto a la izquierda (signo +1) o derecha (−1) de p1→p2. */
export function circulosA(p1, r1, p2, r2, signo = 1) {
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1], d = Math.hypot(dx, dy);
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h2 = r1 * r1 - a * a, h = Math.sqrt(Math.max(0, h2));
  const mx = p1[0] + (a * dx) / d, my = p1[1] + (a * dy) / d;
  return { p: [mx - (signo * h * dy) / d, my + (signo * h * dx) / d], residuo: h2 < 0 ? Math.sqrt(-h2) : 0 };
}

/** Ayudas 2D para cadenas planas: grados, giro de un punto alrededor de otro, ángulo de un vector. */
export const gradA = (r) => (r * 180) / Math.PI;
export const rotar2A = (p, c, g) => { const a = (g * Math.PI) / 180, s = Math.sin(a), co = Math.cos(a), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + co * x - s * y, c[1] + s * x + co * y]; };
export const ang2A = (v) => Math.atan2(v[1], v[0]);

/** Envolvente convexa 2D (cadena monótona). */
export function envolvente2A(pts) {
  const p = pts.map((q) => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 1e-12) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 1e-12) hi.pop(); hi.push(q); }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}
/** Perfil convexo que envuelve círculos [[x, y, r], …] (orejas, palancas, bielas con extremos redondeados). */
export function orejaA(circulos, n = 12) {
  const pts = [];
  for (const [x, y, r] of circulos) for (let i = 0; i < n; i++) { const t = (i / n) * 2 * Math.PI; pts.push([x + r * Math.cos(t), y + r * Math.sin(t)]); }
  return envolvente2A(pts);
}
/** Placa de espesor `e` a lo largo del segmento a→b (perfil 2D), hacia el lado izquierdo (+1) o derecho (−1). */
export function tiraA(a, b, e, lado = 1) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = (-dy / L) * e * lado, ny = (dx / L) * e * lado;
  return [[a[0], a[1]], [b[0], b[1]], [b[0] + nx, b[1] + ny], [a[0] + nx, a[1] + ny]];
}

const LADOS_REDONDO = 16;

/**
 * Crea una máquina. Devuelve el constructor M con: grupo, prisma, caja, redondo, llanta, pasador, cilindro, puerto,
 * manguera, unir, cadena, posar, cascos, piezasDe, listaPiezas. Ver references/motor-a.md.
 */
export function maquina(nombre, op = {}) {
  const M = {
    nombre, op,
    grupos: new Map(), orden: [],
    piezas: [], porNombre: new Map(),
    cilindros: [], mangueras: [], puertos: new Map(), ruedas: [],
    uniones: new Map(), // "a|b" → motivo
    cadenas: [], dims: {}, señalables: new Map(),
  };
  const grupoBase = { nombre: "base", padre: null, tipo: "fijo", reposo: 0 };
  M.grupos.set("base", grupoBase); M.orden.push("base");

  /** Grupo rígido. d: { padre, bisagra: { punto, eje, rango:[lo,hi] }, desliza: { dir, rango:[0,max] }, reposo, derivado } */
  M.grupo = (n, d = {}) => {
    if (M.grupos.has(n)) throw new Error(`grupo repetido: ${n}`);
    const padre = d.padre ?? "base";
    if (!M.grupos.has(padre)) throw new Error(`grupo ${n}: padre desconocido ${padre}`);
    const g = { nombre: n, padre, tipo: d.bisagra ? "bisagra" : d.desliza ? "desliza" : d.derivado ? "derivado" : "fijo", reposo: d.reposo ?? 0, ...d };
    if (g.bisagra) g.bisagra = { ...g.bisagra, eje: VA.unit(g.bisagra.eje) };
    if (g.desliza) g.desliza = { ...g.desliza, dir: VA.unit(g.desliza.dir) };
    M.grupos.set(n, g); M.orden.push(n);
    return n;
  };

  function agregar(p) {
    if (M.porNombre.has(p.nombre)) throw new Error(`pieza repetida: ${p.nombre}`);
    if (!M.grupos.has(p.grupo)) throw new Error(`pieza ${p.nombre}: grupo desconocido ${p.grupo}`);
    p.material = p.material || "pintura";
    M.piezas.push(p); M.porNombre.set(p.nombre, p);
    if (p.pieza) { if (!M.señalables.has(p.pieza)) M.señalables.set(p.pieza, []); M.señalables.get(p.pieza).push(p.nombre); }
    return p.nombre;
  }

  /** Prisma: polígono CONVEXO (u, v) en el marco F, extruido a lo largo de F.a de s0 a s1. */
  M.prisma = (d) => {
    const { F, poligono, s0, s1 } = d;
    if (!convexoA(poligono)) throw new Error(`prisma ${d.nombre}: polígono no convexo (Anatomy: parte cóncava = varias piezas convexas)`);
    if (!(s1 > s0)) throw new Error(`prisma ${d.nombre}: s1 ≤ s0`);
    const casco = [];
    for (const s of [s0, s1]) for (const [x, y] of poligono) casco.push(enMarco(F, s, x, y));
    return agregar({ tipo: "prisma", bisel: 0.012, ...d, casco });
  };

  /** Caja alineada a los ejes de la máquina (azúcar de prisma): centro y tamaño [dx, dy, dz]. */
  M.caja = (d) => {
    const [cx, cy, cz] = d.centro, [dx, dy, dz] = d.tam;
    const F = marcoA([cx, cy, cz], [0, 0, 1], [1, 0, 0]); // a = z, u = x, v = y
    return M.prisma({ ...d, F, poligono: [[-dx / 2, -dy / 2], [dx / 2, -dy / 2], [dx / 2, dy / 2], [-dx / 2, dy / 2]], s0: -dz / 2, s1: dz / 2 });
  };

  /** Placa de perfil (polígono convexo en el plano x–y de la máquina) con espesor en z: [z0, z1]. */
  M.placa = (d) => {
    const F = marcoA([0, 0, 0], [0, 0, 1], [1, 0, 0]);
    return M.prisma({ ...d, F, poligono: d.perfil, s0: d.z[0], s1: d.z[1] });
  };

  /** Losa horizontal: polígono convexo en el plano x–z de la máquina, entre las alturas y0 e y1. */
  M.losa = (d) => {
    const F = marcoA([0, 0, 0], [0, 1, 0], [1, 0, 0]); // u = x, v = a × u = −z
    return M.prisma({ ...d, F, poligono: d.perfil.map(([x, z]) => [x, -z]), s0: d.y[0], s1: d.y[1] });
  };

  /** Pared vertical: polígono convexo en el plano y–z (corte transversal), entre x0 y x1. */
  M.pared = (d) => {
    const F = marcoA([0, 0, 0], [1, 0, 0], [0, 1, 0]); // u = y, v = x × y = z
    return M.prisma({ ...d, F, poligono: d.perfil.map(([z, y]) => [y, z]), s0: d.x[0], s1: d.x[1] });
  };

  /** Redondo: cilindro o tronco de cono a lo largo de F.a de s0 a s1, radio r (o r0, r1); extremos "plano" | "domo". */
  M.redondo = (d) => {
    const r0 = d.r0 ?? d.r, r1 = d.r1 ?? d.r;
    const ex = d.extremos || ["plano", "plano"];
    return agregar({ tipo: "redondo", r0, r1, extremos: ex, ...d, casco: cascoRedondoA(d.F, d.s0, d.s1, r0, r1, ex, d.lados ?? LADOS_REDONDO) });
  };

  /** Redondo entre dos puntos (eje del primero al segundo). */
  M.barra = (d) => {
    const L = VA.dist(d.de, d.a), F = marcoA(d.de, VA.sub(d.a, d.de), d.uPref || [0, 1, 0]);
    return M.redondo({ ...d, F, s0: d.s0 ?? 0, s1: d.s1 ?? L });
  };

  /** Une dos piezas que se tocan o se atraviesan a propósito (pasador en su ojo, vástago dentro del barril, soldadura). */
  M.unir = (a, b, motivo) => {
    for (const x of [a, b]) if (!M.porNombre.has(x)) throw new Error(`unir: pieza desconocida ${x}`);
    M.uniones.set([a, b].sort().join("|"), motivo || "unión");
  };
  M.unidas = (a, b) => M.uniones.has([a, b].sort().join("|"));
  /** Unión con piezas de cilindros (que nacen al dimensionar): se aplica después de `dimensionar`. */
  M.unirLuego = (a, b, motivo) => { (M._luego ??= []).push([a, b, motivo]); };

  /** Pasador: redondo a lo largo de `eje` centrado en `punto`, que atraviesa las piezas de `une` (uniones reales). */
  M.pasador = (d) => {
    const L = d.largo, F = marcoA(d.punto, d.eje, [0, 1, 0]);
    const n = M.redondo({ material: "acero", pieza: d.pieza, ...d, F, s0: -L / 2, s1: L / 2, r: d.r });
    M.porNombre.get(n).esPasador = true;
    for (const u of d.une || []) M.unir(n, u, "pasador");
    // tapas de retención (placa con perno) en ambos extremos: detalle de Anatomy, sin interpenetrar
    const lados = d.tapas === false ? [] : d.tapas === 1 || d.tapas === -1 ? [d.tapas] : [-1, 1];
    for (const s of lados) {
      const t = M.redondo({ nombre: `${n}.tapa${s > 0 ? "+" : "-"}`, grupo: d.grupo, pieza: d.pieza, material: "acero", F, s0: s > 0 ? L / 2 : -L / 2 - 0.018, s1: s > 0 ? L / 2 + 0.018 : -L / 2, r: d.r * 1.35, lados: 6 });
      M.unir(t, n, "tapa del pasador");
      for (const u of d.une || []) if (d.tapaToca?.includes(u)) M.unir(t, u, "tapa apoyada");
    }
    return n;
  };

  /**
   * Cilindro hidráulico entre dos pasadores. d: { nombre, pieza, de: { grupo, punto }, a: { grupo, punto }, eje (de los pasadores),
   *   rBarril, rVastago, rOjo, anchoOjo, Lmin (largo retraído entre ejes; si falta se dimensiona con `rango`), carrera,
   *   pasadores: { r, largo, uneDe: [piezas de la horquilla], uneA: [...] }, puertos: true }
   * Crea dos grupos derivados (barril y vástago) que se calculan en cada pose a partir de los dos pasadores.
   */
  M.cilindro = (d) => {
    const c = { rOjo: d.rBarril * 1.05, anchoOjo: d.rBarril * 1.5, guia: Math.max(0.12, d.rVastago * 2.4), ...d };
    c.eje = VA.unit(d.eje || [0, 0, 1]);
    c.gB = M.grupo(`${d.nombre}.barril`, { derivado: true });
    c.gV = M.grupo(`${d.nombre}.vastago`, { derivado: true });
    M.cilindros.push(c);
    c.piezasBarril = []; c.piezasVastago = [];
    // las piezas se generan cuando se conoce Lmin (dimensionar); ver M.dimensionar
    return c;
  };

  function armarCilindro(c) {
    const { rBarril: rb, rVastago: rv, rOjo: ro, anchoOjo: ao } = c;
    const roB = c.rOjoV ?? ro; // ojo del vástago
    c.largoBarril = c.Lmin - roB - 0.07;
    c.largoVastago = c.Lmin - ro - 0.05;
    c.LmaxGeo = c.largoBarril - c.guia + c.largoVastago;
    c.Lmax = c.carrera ? Math.min(c.Lmin + c.carrera, c.LmaxGeo) : c.LmaxGeo;
    const X = [1, 0, 0], Z = [0, 0, 1];
    const ojo = (g, n, r) => M.redondo({ nombre: n, grupo: g, pieza: c.pieza, material: "acero", F: marcoA([0, 0, 0], Z, [1, 0, 0]), s0: -ao / 2, s1: ao / 2, r, lados: 18 });
    // barril: ojo trasero, tubo, fondo, glándula
    // el tubo empieza en `inicioTubo` (fuera de la horquilla); un cuello une el ojo con el fondo
    const s0t = c.inicioTubo ?? ro * 0.55;
    const bOjo = ojo(c.gB, `${c.nombre}.ojoBase`, ro);
    const bTubo = M.redondo({ nombre: `${c.nombre}.tubo`, grupo: c.gB, pieza: c.pieza, material: c.material || "pintura", F: marcoA([0, 0, 0], X, [0, 1, 0]), s0: s0t, s1: c.largoBarril - 0.05, r: rb, lados: 20 });
    const bGland = M.redondo({ nombre: `${c.nombre}.glandula`, grupo: c.gB, pieza: c.pieza, material: "acero", F: marcoA([0, 0, 0], X, [0, 1, 0]), s0: c.largoBarril - 0.09, s1: c.largoBarril, r: rb * 1.1, lados: 20 });
    const bFondo = M.redondo({ nombre: `${c.nombre}.fondo`, grupo: c.gB, pieza: c.pieza, material: "acero", F: marcoA([0, 0, 0], X, [0, 1, 0]), s0: s0t, s1: s0t + 0.07, r: rb * 1.08, lados: 20 });
    M.unir(bOjo, bTubo, "soldado"); M.unir(bOjo, bFondo, "soldado"); M.unir(bTubo, bFondo, "soldado"); M.unir(bTubo, bGland, "rosca");
    c.piezasBarril.push(bOjo, bTubo, bGland, bFondo);
    if (s0t > ro * 0.7) {
      const cu = M.redondo({ nombre: `${c.nombre}.cuello`, grupo: c.gB, pieza: c.pieza, material: "acero", F: marcoA([0, 0, 0], X, [0, 1, 0]), s0: ro * 0.85, s1: s0t + 0.01, r: Math.min(ao * 0.45, rb * 0.55), lados: 12 });
      for (const q of [bOjo, bFondo, bTubo]) M.unir(cu, q, "soldado");
      c.piezasBarril.push(cu);
    }
    // puertos del barril: un racor junto al fondo y otro junto a la glándula, hacia `ladoPuertos` (local; uno o dos)
    if (c.puertos !== false) {
      const lp = c.ladoPuertos || [0, 1, 0], lados2 = Array.isArray(lp[0]) ? lp : [lp, lp];
      // tuboCabeza: la línea de la cabeza llega por un tubo de acero a lo largo del barril, así las dos mangueras
      // salen cerca del pivote (se mueven poco) como en las máquinas reales
      // portado «pasador»: el aceite entra por el pasador base (banjo en su extremo, sobre el eje de la bisagra: la
      // manguera no cruza la bisagra lejos de su eje, regla de Anatomy) y la línea de cabeza va por tubo de acero
      const porPasador = c.portado === "pasador";
      const sCab = porPasador ? s0t + 0.03 : c.tuboCabeza ? s0t + 0.33 : c.largoBarril - 0.2;
      if (porPasador) {
        const up = VA.unit(lados2[1]), rt = 0.016, off = rb + 0.03;
        const codoB = M.redondo({ nombre: `${c.nombre}.codoBase`, grupo: c.gB, pieza: c.pieza, material: "laton", F: marcoA([sCab + 0.02, 0, 0], up, [1, 0, 0]), s0: rb * 0.8, s1: off + rt + 0.004, r: 0.022, lados: 8 });
        M.unir(codoB, bTubo, "racor roscado"); M.unir(codoB, bFondo, "racor roscado");
        c.piezasBarril.push(codoB);
      }
      if (c.tuboCabeza || porPasador) {
        const up = VA.unit(lados2[1]), rt = 0.016, off = rb + 0.03;
        const o0 = VA.mul(up, off);
        const tubo = M.redondo({ nombre: `${c.nombre}.tuboCabeza`, grupo: c.gB, pieza: c.pieza, material: "acero", F: marcoA(o0, X, up), s0: sCab - 0.02, s1: c.largoBarril - 0.16, r: rt, lados: 8 });
        const codo = M.redondo({ nombre: `${c.nombre}.codoCabeza`, grupo: c.gB, pieza: c.pieza, material: "laton", F: marcoA([c.largoBarril - 0.17, 0, 0], up, [1, 0, 0]), s0: rb * 0.8, s1: off + rt + 0.004, r: 0.022, lados: 8 });
        M.unir(tubo, codo, "codo roscado"); M.unir(codo, bTubo, "racor roscado"); M.unir(tubo, bTubo, "abrazaderas");
        for (const sA of [0.4, 0.7]) {
          const sa = sCab + (c.largoBarril - 0.16 - sCab) * sA;
          // abrazadera: puente del barril al tubo (silla), sin engordar el barril hacia los costados
          const ext = off + rt + 0.008;
          const abr = M.prisma({ nombre: `${c.nombre}.abrazadera${sA}`, grupo: c.gB, pieza: c.pieza, material: "acero", F: marcoA([sa, 0, 0], X, up), poligono: [[-rb * 0.6, -rb * 0.55], [ext, -rt * 1.6], [ext, rt * 1.6], [-rb * 0.6, rb * 0.55]], s0: -0.015, s1: 0.015, bisel: 0.004 });
          M.unir(abr, bTubo, "abrazadera"); M.unir(abr, tubo, "abrazadera");
          c.abrazaderas = [...(c.abrazaderas || []), abr];
          c.piezasBarril.push(abr);
        }
        if (porPasador) M.unir(tubo, `${c.nombre}.codoBase`, "codo roscado");
        c.piezasBarril.push(tubo, codo);
      }
      if (!porPasador) for (const [cual, s, up] of [["base", s0t + 0.17, lados2[0]], ["cabeza", sCab, lados2[1]]]) {
        const rac = M.redondo({ nombre: `${c.nombre}.racor.${cual}`, grupo: c.gB, pieza: c.pieza, material: "laton", F: marcoA([s, 0, 0], up, [1, 0, 0]), s0: rb * 0.8, s1: rb + 0.05, r: 0.026, lados: 8 });
        M.unir(rac, bTubo, "racor roscado");
        if (cual === "cabeza" && c.tuboCabeza) M.unir(rac, `${c.nombre}.tuboCabeza`, "te del tubo");
        M.puerto(`${c.nombre}.${cual}`, { grupo: c.gB, punto: VA.add([s, 0, 0], VA.mul(up, rb + 0.05)), normal: up, pieza: rac });
        c.piezasBarril.push(rac);
      }
    }
    // vástago: ojo delantero y vástago cromado (x local apunta del pasador `a` hacia el pasador `de`)
    const vOjo = ojo(c.gV, `${c.nombre}.ojoVastago`, roB);
    const vVast = M.redondo({ nombre: `${c.nombre}.vastagoCromo`, grupo: c.gV, pieza: c.pieza, material: "cromo", F: marcoA([0, 0, 0], X, [0, 1, 0]), s0: roB * 0.6, s1: c.largoVastago, r: rv, lados: 16 });
    M.unir(vOjo, vVast, "rosca");
    for (const b of [bTubo, bGland, bFondo, ...(c.abrazaderas || [])]) M.unir(vVast, b, "vástago dentro del barril");
    c.piezasVastago.push(vOjo, vVast);
    // pasadores en ambos extremos
    const P = c.pasadores || {};
    if (P.r) {
      const pA = M.pasador({ nombre: `${c.nombre}.pasadorBase`, grupo: c.de.grupo, pieza: c.piezaPasador || c.pieza, punto: P.centroDe || c.de.punto, eje: c.eje, r: P.r, largo: P.largoDe ?? P.largo, une: [bOjo, ...(P.uneDe || [])], tapaToca: P.uneDe || [], tapas: P.tapasDe });
      const pB = M.pasador({ nombre: `${c.nombre}.pasadorVastago`, grupo: c.a.grupo, pieza: c.piezaPasador || c.pieza, punto: P.centroA || c.a.punto, eje: c.eje, r: P.r, largo: P.largoA ?? P.largo, une: [vOjo, ...(P.uneA || [])], tapaToca: P.uneA || [], tapas: P.tapasA });
      c.pasadorBase = pA; c.pasadorVastago = pB;
      // banjos en los extremos del pasador base (portado por el pasador): un puerto por banjo
      if (c.portado === "pasador") for (const lado of c.banjos || [1]) {
        const L = P.largoDe ?? P.largo, ctr = P.centroDe || c.de.punto, Fp = marcoA(ctr, c.eje, [0, 1, 0]);
        const sg = lado > 0 ? 1 : -1, s0 = sg > 0 ? L / 2 : -L / 2 - 0.05, s1 = sg > 0 ? L / 2 + 0.05 : -L / 2;
        const bj = M.redondo({ nombre: `${c.nombre}.banjo${sg > 0 ? "+" : "-"}`, grupo: c.de.grupo, pieza: c.pieza, material: "laton", F: Fp, s0, s1, r: P.r * 0.85, lados: 16 });
        M.unir(bj, pA, "banjo atornillado al pasador");
        for (const u of P.uneDe || []) M.unir(bj, u, "banjo apoyado en la horquilla");
        const tip = VA.add(ctr, VA.mul(VA.unit(c.eje), sg * (L / 2 + 0.05)));
        // el puerto queda en el costado del banjo (la manguera sale perpendicular al perno; `orientarPuertos` elige hacia dónde)
        const mid = VA.add(ctr, VA.mul(VA.unit(c.eje), sg * (L / 2 + 0.025))), lat = VA.perp(c.eje, [0, 1, 0]);
        M.puerto(`${c.nombre}.banjo${sg > 0 ? "+" : "-"}`, { grupo: c.de.grupo, punto: VA.add(mid, VA.mul(lat, P.r * 0.85)), normal: lat, pieza: bj, perpA: VA.unit(c.eje), centroBanjo: mid, radioBanjo: P.r * 0.85 * Math.cos(Math.PI / 16) + 0.0005 });
      }
    }
  }

  /** Puerto: punto sobre la superficie de una pieza (racor), con la normal hacia afuera; ahí nace una manguera. */
  M.puerto = (n, d) => { if (M.puertos.has(n)) throw new Error(`puerto repetido: ${n}`); M.puertos.set(n, { nombre: n, ...d, normal: VA.unit(d.normal) }); return n; };

  /** Manguera de puerto a puerto, con su largo real (m). La curva se recalcula en cada pose. */
  M.manguera = (d) => { const m = { r: 0.016, color: "#1b1a19", ...d }; M.mangueras.push(m); return m.nombre; };

  /**
   * Rueda: llanta (casco cilíndrico), aro y maza, en `grupo`, con eje `eje` por `centro`. Queda registrada para el
   * contacto con el piso (juez) y para girar al rodar.
   */
  M.rueda = (d) => {
    const R = d.diametro / 2, W = d.ancho, e = VA.unit(d.eje || [0, 0, 1]);
    const F = marcoA(d.centro, e, [1, 0, 0]);
    const ll = agregar({ tipo: "llanta", nombre: d.nombre, grupo: d.grupo, pieza: d.pieza, material: "goma", F, s0: -W / 2, s1: W / 2, r0: R, r1: R, R, W, aro: d.aro ?? 0.56, tacos: d.tacos ?? 26, casco: cascoCilindro(F, -W / 2, W / 2, R) });
    const lado = d.ladoExterior ?? 1; // +1: la cara exterior mira hacia +eje
    const Ra = R * (d.aro ?? 0.56);
    const maza = M.redondo({ nombre: `${d.nombre}.maza`, grupo: d.grupo, pieza: d.pieza, material: "acero", F, s0: lado > 0 ? W * 0.18 : -W * 0.5 - 0.02, s1: lado > 0 ? W * 0.5 + 0.02 : -W * 0.18, r: Ra * 0.3, lados: 18 });
    M.unir(maza, ll, "maza en el aro");
    M.ruedas.push({ nombre: d.nombre, grupo: d.grupo, centro: d.centro.slice(), eje: e, R, W });
    return ll;
  };

  /** Restricción de cierre (cadena cinemática): fn(valores) completa valores de grupos dependientes y devuelve el residuo (m). */
  M.cadena = (nombre, fn) => { M.cadenas.push({ nombre, fn }); };

  /** Valores con los de reposo para los grupos que falten, y las cadenas resueltas. */
  M.valores = (v = {}) => {
    const out = { _pose: { x: 0, y: 0, z: 0, rumbo: 0, cabeceo: 0, alabeo: 0, ...(v._pose || {}) } };
    for (const [n, g] of M.grupos) if (g.tipo === "bisagra" || g.tipo === "desliza") out[n] = v[n] ?? g.reposo;
    for (const k in v) if (k !== "_pose" && !(k in out)) out[k] = v[k];
    out._residuos = {};
    for (const c of M.cadenas) out._residuos[c.nombre] = c.fn(out) || 0;
    return out;
  };

  /** Pose completa: transformaciones de cada grupo en coordenadas de la máquina, cilindros y mangueras. */
  M.posar = (v = {}) => {
    const val = M.valores(v);
    const T = new Map();
    for (const n of M.orden) {
      const g = M.grupos.get(n);
      if (g.tipo === "derivado") continue;
      const Tp = g.padre ? T.get(g.padre) : TA.id();
      let Tl = TA.id();
      if (g.tipo === "bisagra") Tl = TA.bisagra(g.bisagra.punto, g.bisagra.eje, val[n]);
      else if (g.tipo === "desliza") Tl = TA.desliza(g.desliza.dir, val[n]);
      T.set(n, g.padre ? TA.comp(Tp, Tl) : Tl);
    }
    // cilindros: barril con origen en el pasador `de`, vástago con origen en el pasador `a`
    const cil = new Map();
    for (const c of M.cilindros) {
      const A = TA.ap(T.get(c.de.grupo), c.de.punto), B = TA.ap(T.get(c.a.grupo), c.a.punto);
      const eje = TA.dir(T.get(c.de.grupo), c.eje), ejeB = TA.dir(T.get(c.a.grupo), c.eje);
      const L = VA.dist(A, B), d = VA.unit(VA.sub(B, A));
      // marco local: x a lo largo del cilindro, z = eje de los pasadores (los ojos giran en él), y = z × x
      const zB = VA.perp(d, eje), mB = TA.marco(A, d, zB);
      const mV = TA.marco(B, VA.mul(d, -1), zB);
      T.set(c.gB, mB); T.set(c.gV, mV);
      cil.set(c.nombre, { A, B, L, d, Lmin: c.Lmin, Lmax: c.Lmax, desalineo: Math.max(Math.abs(VA.dot(d, VA.unit(eje))), Math.abs(VA.dot(d, VA.unit(ejeB)))) });
    }
    const p = val._pose;
    const raiz = TA.comp({ R: RA.I.slice(), t: [p.x, p.y, p.z] }, { R: RA.mul(RA.eje([0, 1, 0], p.rumbo), RA.mul(RA.eje([0, 0, 1], p.cabeceo), RA.eje([1, 0, 0], p.alabeo))), t: [0, 0, 0] });
    const pose = { valores: val, T, raiz, cil, mang: new Map() };
    pose.local = (grupo, punto) => TA.ap(T.get(grupo), punto);
    pose.mundo = (grupo, punto) => TA.ap(raiz, TA.ap(T.get(grupo), punto));
    pose.dirMundo = (grupo, d) => TA.dir(raiz, TA.dir(T.get(grupo), d));
    if (!v._sinMangueras) for (const m of M.mangueras) pose.mang.set(m.nombre, curvaManguera(M, pose, m));
    return pose;
  };

  /** Cascos en el mundo para una pose: [{ pieza (objeto), puntos }]. */
  M.cascos = (pose) => M.piezas.map((p) => {
    const Tg = TA.comp(pose.raiz, pose.T.get(p.grupo));
    const ejes = p.F ? [p.F.a, p.F.u, p.F.v].map((e) => TA.dir(Tg, e)) : [];
    return { p, puntos: p.casco.map((q) => TA.ap(Tg, q)), ejes };
  });

  /**
   * Dimensiona los cilindros sin Lmin con las poses de `muestras` (lista de valores): Lmin = mínimo − holgura.
   * Si la carrera necesaria supera la geométrica (≈ Lmin − ojos − guía), el mecanismo no es construible: error.
   */
  M.dimensionar = (muestras = [{}], holgura = 0.03) => {
    const pend = M.cilindros.filter((c) => !c.Lmin);
    if (pend.length) {
      const ext = new Map(pend.map((c) => [c.nombre, [Infinity, -Infinity]]));
      for (const v of muestras) {
        const pose = M.posar({ ...v, _sinMangueras: true });
        for (const c of pend) { const L = pose.cil.get(c.nombre).L; const e = ext.get(c.nombre); e[0] = Math.min(e[0], L); e[1] = Math.max(e[1], L); }
      }
      for (const c of pend) {
        const [lo, hi] = ext.get(c.nombre);
        c.Lmin = lo - holgura;
        c.necesario = [lo, hi];
      }
    }
    for (const c of M.cilindros) if (!c.piezasBarril.length) armarCilindro(c);
    for (const [a, b2, m] of M._luego || []) M.unir(a, b2, m);
    M._luego = [];
    for (const c of pend) if (c.necesario[1] > c.Lmax) throw new Error(`cilindro ${c.nombre}: necesita ${c.necesario[0].toFixed(3)}–${c.necesario[1].toFixed(3)} m entre pasadores y su carrera geométrica llega a ${c.Lmax.toFixed(3)} m (alarga el retraído o acerca los pasadores)`);
    return M;
  };

  /**
   * Largo de las mangueras sin `largo`: la mayor distancia entre sus puertos en `muestras` más una holgura
   * (como se corta una manguera real: que alcance en todo el recorrido, con un seno).
   */
  /**
   * Codos: cada puerto con `hacia` (otro puerto) apunta su salida hacia él en la pose `valores` (una pose media):
   * la manguera sale del racor por un codo orientado, sin doblarse en U (como se instala en la máquina real).
   */
  M.orientarPuertos = (valores = {}) => {
    const pose = M.posar({ ...valores, _sinMangueras: true });
    for (const pt of M.puertos.values()) {
      if (!pt.hacia) continue;
      const o = M.puertos.get(pt.hacia);
      const d = VA.sub(pose.mundo(o.grupo, o.punto), pose.mundo(pt.grupo, pt.punto));
      const Tg = TA.comp(pose.raiz, pose.T.get(pt.grupo));
      let n = VA.unit(RA.vec(RA.tr(Tg.R), d));
      // un banjo saca la manguera perpendicular a su perno
      if (pt.perpA) {
        n = VA.sub(n, VA.mul(pt.perpA, VA.dot(n, pt.perpA))); n = VA.len(n) > 1e-6 ? VA.unit(n) : pt.normal;
        pt.punto = VA.add(pt.centroBanjo, VA.mul(n, pt.radioBanjo)); // la salida del banjo mira hacia la manguera
      }
      pt.normal = n;
      pt.codo = true;
      // un racor recto (codo orientado) gira con su salida: se rehace su marco y su casco
      if (pt.reorientar) {
        const p = M.porNombre.get(pt.pieza);
        p.F = marcoA(pt.punto, n);
        p.casco = cascoRedondoA(p.F, p.s0, p.s1, p.r0, p.r1, p.extremos, p.lados ?? LADOS_REDONDO);
      }
    }
    return M;
  };

  M.dimensionarMangueras = (muestras = [{}], holgura = 0.08, factor = 1.02) => {
    // largo = el mayor largo de la curva SIN seno (salidas rectas de los racores) en todas las muestras, más una holgura:
    // así la manguera nunca se estira ni se dobla en el racor, y el sobrante cuelga
    const pend = M.mangueras.filter((m) => !m.largo);
    if (!pend.length) return M;
    const max = new Map(pend.map((m) => [m.nombre, 0]));
    for (const v of muestras) {
      const pose = M.posar({ ...v, _sinMangueras: true });
      for (const m of pend) max.set(m.nombre, Math.max(max.get(m.nombre), curvaManguera(M, pose, { ...m, largo: 1e9 }, true).largo));
    }
    for (const m of pend) m.largo = max.get(m.nombre) * factor + (m.holgura ?? holgura);
    return M;
  };

  /** Lista de piezas (para la ficha y el informe): nombre, grupo, tipo, pieza señalable. */
  M.listaPiezas = () => M.piezas.map((p) => ({ nombre: p.nombre, grupo: p.grupo, tipo: p.tipo, pieza: p.pieza || "", material: p.material }));
  M.piezasDe = (id) => M.señalables.get(id) || [];
  return M;
}

/** Casco de un redondo (anillos en s0 y s1; casquetes si un extremo es domo, como la cápsula de Anatomy). */
function cascoRedondoA(F, s0, s1, r0, r1, ex = ["plano", "plano"], n = LADOS_REDONDO) {
  const casco = [];
  const anillo = (s, r) => { for (let i = 0; i < n; i++) { const t = (i / n) * 2 * Math.PI; casco.push(enMarco(F, s, r * Math.cos(t), r * Math.sin(t))); } };
  anillo(s0, r0); anillo(s1, r1);
  if (ex[0] === "domo") for (const k of [0.38, 0.71, 0.92]) anillo(s0 - r0 * Math.sin((k * Math.PI) / 2), r0 * Math.cos((k * Math.PI) / 2));
  if (ex[1] === "domo") for (const k of [0.38, 0.71, 0.92]) anillo(s1 + r1 * Math.sin((k * Math.PI) / 2), r1 * Math.cos((k * Math.PI) / 2));
  if (ex[0] === "domo") casco.push(enMarco(F, s0 - r0, 0, 0));
  if (ex[1] === "domo") casco.push(enMarco(F, s1 + r1, 0, 0));
  return casco;
}

function cascoCilindro(F, s0, s1, R, n = LADOS_REDONDO) {
  const out = [];
  for (const s of [s0, s1]) for (let i = 0; i < n; i++) { const t = (i / n) * 2 * Math.PI; out.push(enMarco(F, s, R * Math.cos(t), R * Math.sin(t))); }
  return out;
}

/**
 * Curva de una manguera en una pose: Bézier cúbica que sale recta de cada racor por su normal (tramo `salida`) y
 * cuelga por gravedad: el sobrante de largo se vuelve seno hacia abajo (o hacia `seno`, en coordenadas de la máquina).
 * Bisección sobre el seno para que el largo de arco sea el largo real. Si ni recta alcanza: estirada.
 * Devuelve { puntos (mundo), largo, estirada, recta, radioMin }.
 */
function curvaManguera(M, pose, m, sinSeno = false) {
  const pa = M.puertos.get(m.de), pb = M.puertos.get(m.a);
  if (!pa || !pb) throw new Error(`manguera ${m.nombre}: puerto desconocido`);
  const A = pose.mundo(pa.grupo, pa.punto), B = pose.mundo(pb.grupo, pb.punto);
  const nA = VA.unit(pose.dirMundo(pa.grupo, pa.normal)), nB = VA.unit(pose.dirMundo(pb.grupo, pb.normal));
  const N = m.segmentos ?? 28, Lrecta = VA.dist(A, B);
  // seno: la gravedad (o `seno`) sin su componente a lo largo de la cuerda; si la cuerda es casi vertical, de costado
  const u = Lrecta > 1e-9 ? VA.unit(VA.sub(B, A)) : [1, 0, 0];
  let g = m.seno ? VA.unit(TA.dir(pose.raiz, m.seno)) : [0, -1, 0];
  g = VA.sub(g, VA.mul(u, VA.dot(g, u)));
  g = VA.len(g) > 0.3 ? VA.unit(g) : VA.perp(u, TA.dir(pose.raiz, [0, 0, 1]));
  const curva = (h, sag) => {
    const P1 = VA.add(VA.add(A, VA.mul(nA, h)), VA.mul(g, sag)), P2 = VA.add(VA.add(B, VA.mul(nB, h)), VA.mul(g, sag));
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, u = 1 - t;
      pts.push([0, 1, 2].map((k) => u * u * u * A[k] + 3 * u * u * t * P1[k] + 3 * u * t * t * P2[k] + t * t * t * B[k]));
    }
    return pts;
  };
  const largoDe = (pts) => { let L = 0; for (let i = 1; i < pts.length; i++) L += VA.dist(pts[i - 1], pts[i]); return L; };
  let h = m.salida ?? Math.min(0.22, Math.max(0.08, Lrecta * 0.3)), pts = curva(h, 0);
  if (sinSeno) return { puntos: pts, largo: largoDe(pts), estirada: false, recta: Lrecta, radioMin: radioMinimo(pts) };
  if (largoDe(pts) > m.largo) {
    let lo = 0.005, hi = h;
    if (largoDe(curva(lo, 0)) > m.largo) { pts = curva(lo, 0); return { puntos: pts, largo: largoDe(pts), estirada: true, recta: Lrecta, radioMin: radioMinimo(pts) }; }
    for (let k = 0; k < 40; k++) { const x = (lo + hi) / 2; if (largoDe(curva(x, 0)) > m.largo) hi = x; else lo = x; }
    pts = curva(lo, 0);
    return { puntos: pts, largo: largoDe(pts), estirada: false, recta: Lrecta, radioMin: radioMinimo(pts) };
  }
  let lo = 0, hi = m.largo;
  for (let k = 0; k < 40; k++) { const x = (lo + hi) / 2; if (largoDe(curva(h, x)) > m.largo) hi = x; else lo = x; }
  pts = curva(h, lo);
  return { puntos: pts, largo: largoDe(pts), estirada: false, recta: Lrecta, radioMin: radioMinimo(pts) };
}

function radioMinimo(pts) {
  let rmin = Infinity;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const ab = VA.dist(a, b), bc = VA.dist(b, c), ca = VA.dist(c, a);
    const area2 = VA.len(VA.cross(VA.sub(b, a), VA.sub(c, a)));
    if (area2 < 1e-12) continue;
    rmin = Math.min(rmin, (ab * bc * ca) / (2 * area2));
  }
  return rmin;
}
