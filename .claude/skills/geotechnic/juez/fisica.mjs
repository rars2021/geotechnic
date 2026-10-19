// Geotechnic · juez · física. Corre en Node sobre el modelo puro del motor A y el contrato del motor B.
// Usa el separador de planos de Anatomy (`separate`, anatomia/kit/turn-build.mjs, MIT): para dos sólidos convexos
// devuelve el mejor plano separador y su margen; margen < 0 es la penetración (m). Primero `gjk` (rápido: cualquier
// plano con margen ≥ −tolerancia ya prueba que no se atraviesan) y solo si no alcanza, `separate` (búsqueda fina).
// Pistas: los ejes de la máquina y los de los marcos de las dos piezas (caras planas paralelas se separan por ellos).
const EJES = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const margen = (A, B, tol, pistas = []) => { const g = gjk(A, B); return g.margin >= -tol ? g.margin : separate(A, B, [...EJES, ...pistas]).margin; };
import { separate, gjk } from "../anatomia/kit/turn-build.mjs";
import { VA } from "../motorA/modelo.js";

export const TOLERANCIAS = {
  penetracion: 0.004,   // m: dos sólidos no unidos pueden tocarse (apoyo), no entrar más de 4 mm
  roca: 0.01,           // m: ningún punto del equipo dentro de la roca más de 1 cm (salvo piezas con `tocaRoca`)
  tocaRoca: 0.035,      // m: centralizador, gatas, labio del cucharón en el piso: contacto real
  ruedaHundida: 0.06,   // m: deflexión de la llanta y barro
  ruedaFlota: 0.02,     // m: una rueda que debe apoyar no puede quedar en el aire
  puerto: 0.004,        // m: el puerto de una manguera está sobre la superficie de su pieza
  manguera: 0.006,      // m: una manguera no atraviesa sólidos (su propio racor sí)
  mangueraEntreSi: 0.5, // fracción del radio: mangueras de un mismo haz se apoyan, no se atraviesan
  cierre: 0.002,        // m: residuo de una cadena cerrada (biela, palanca)
  desalineo: 0.035,     // |cos| entre el cilindro y sus pasadores (deben ser perpendiculares)
  doblez: 4,            // radio mínimo de curvatura de una manguera, en diámetros
};

const caja = (pts) => {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const p of pts) for (let k = 0; k < 3; k++) { if (p[k] < lo[k]) lo[k] = p[k]; if (p[k] > hi[k]) hi[k] = p[k]; }
  return { lo, hi };
};
const tocan = (a, b, m) => a.lo[0] - m <= b.hi[0] && b.lo[0] - m <= a.hi[0] && a.lo[1] - m <= b.hi[1] && b.lo[1] - m <= a.hi[1] && a.lo[2] - m <= b.hi[2] && b.lo[2] - m <= a.hi[2];

/** Cascos de los trozos de una manguera (prisma de 8 puntos por trozo). */
function trozosManguera(puntos, r) {
  const out = [];
  for (let i = 0; i < puntos.length - 1; i++) {
    const a = puntos[i], b = puntos[i + 1], d = VA.sub(b, a);
    if (VA.len(d) < 1e-6) continue;
    const u = VA.perp(d, [0, 1, 0]), v = VA.unit(VA.cross(d, u));
    const pts = [];
    for (const p of [a, b]) for (const [s, t] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) pts.push(VA.add(p, VA.add(VA.mul(u, s * r * 0.92), VA.mul(v, t * r * 0.92))));
    out.push({ i, pts, caja: caja(pts) });
  }
  return out;
}

/**
 * Juzga la física de una máquina en una lista de poses.
 * op: { poses: [{ etiqueta, valores, ruedasEnPiso?: bool }], terreno?: contrato B (libre, piso, cavidades),
 *       tol?: TOLERANCIAS, max?: fallas por línea a guardar }
 * Devuelve { lineas: { nombre: { ok, n, peor, ejemplos[] } }, aprobado }.
 */
export function juzgarFisica(M, op = {}) {
  const tol = { ...TOLERANCIAS, ...(op.tol || {}) };
  const poses = op.poses || [{ etiqueta: "reposo", valores: {} }];
  const ter = op.terreno || null;
  const L = {};
  const linea = (n) => (L[n] ??= { ok: true, n: 0, peor: 0, ejemplos: [] });
  const falla = (n, valor, texto) => {
    const l = linea(n); l.ok = false; l.n++;
    if (Math.abs(valor) > Math.abs(l.peor)) l.peor = valor;
    if (l.ejemplos.length < (op.max ?? 8)) l.ejemplos.push(texto);
  };
  for (const n of ["interpenetracion", "rangos", "cierres", "cilindros", "mangueras", "puertos", "ruedas", "roca"]) linea(n);
  // pares de un mismo grupo rígido: se juzgan una vez (no cambian con la pose)
  const vistos = new Set();
  const cacheMargen = new Map();
  let paresJuzgados = 0;
  for (const ps of poses) {
    const pose = M.posar(ps.valores);
    const et = ps.etiqueta;
    // rangos de los grupos
    for (const [n, g] of M.grupos) {
      const r = g.bisagra?.rango || g.desliza?.rango;
      if (!r) continue;
      const v = pose.valores[n];
      if (v < r[0] - 1e-6 || v > r[1] + 1e-6) falla("rangos", v, `${et}: ${n} = ${v.toFixed(2)} fuera de [${r[0]}, ${r[1]}]`);
    }
    for (const [n, r] of Object.entries(pose.valores._residuos || {})) if (Math.abs(r) > tol.cierre) falla("cierres", r, `${et}: cadena ${n} no cierra (${(r * 1000).toFixed(1)} mm)`);
    // cilindros entre pasadores: largo dentro de la carrera, perpendiculares a sus pasadores
    for (const c of M.cilindros) {
      const s = pose.cil.get(c.nombre);
      if (s.L < c.Lmin - 1e-4) falla("cilindros", s.L - c.Lmin, `${et}: ${c.nombre} más corto que retraído (${s.L.toFixed(3)} < ${c.Lmin.toFixed(3)} m)`);
      if (s.L > c.Lmax + 1e-4) falla("cilindros", s.L - c.Lmax, `${et}: ${c.nombre} más largo que su carrera (${s.L.toFixed(3)} > ${c.Lmax.toFixed(3)} m)`);
      if (s.desalineo > tol.desalineo) falla("cilindros", s.desalineo, `${et}: ${c.nombre} no es perpendicular a sus pasadores (cos ${s.desalineo.toFixed(3)})`);
    }
    // cascos
    const cs = M.cascos(pose).map((c) => ({ ...c, caja: caja(c.puntos) }));
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
      const A = cs[i], B = cs[j];
      if (M.unidas(A.p.nombre, B.p.nombre)) continue;
      if (!tocan(A.caja, B.caja, tol.penetracion)) continue;
      const mismo = A.p.grupo === B.p.grupo;
      const clave = A.p.nombre + "|" + B.p.nombre;
      if (mismo && vistos.has(clave)) continue;
      if (mismo) vistos.add(clave);
      paresJuzgados++;
      const mg = margen(A.puntos, B.puntos, tol.penetracion, [...(A.ejes || []), ...(B.ejes || [])]);
      if (mg < -tol.penetracion) {
        const k = clave;
        const prev = cacheMargen.get(k);
        if (!prev || mg < prev.m) cacheMargen.set(k, { m: mg, et });
      }
    }
    // mangueras: largo, puertos sobre su pieza, sin atravesar sólidos, doblez
    const trozosTodos = [];
    for (const m of M.mangueras) {
      const c = pose.mang.get(m.nombre);
      if (c.estirada) falla("mangueras", c.recta - m.largo, `${et}: ${m.nombre} estirada: los puertos quedan a ${c.recta.toFixed(2)} m y mide ${m.largo.toFixed(2)} m`);
      if (c.radioMin < tol.doblez * 2 * m.r) falla("mangueras", c.radioMin, `${et}: ${m.nombre} doblada a radio ${(c.radioMin * 100).toFixed(1)} cm (mínimo ${(tol.doblez * 2 * m.r * 100).toFixed(1)})`);
      const trozos = trozosManguera(c.puntos, m.r);
      const extremos = new Set([M.puertos.get(m.de).pieza, M.puertos.get(m.a).pieza]);
      for (const t of trozos) {
        trozosTodos.push({ m, t });
        for (const C of cs) {
          if (!tocan(t.caja, C.caja, 0)) continue;
          const cerca = t.i < 3 || t.i >= trozos.length - 3;
          if (cerca && extremos.has(C.p.nombre)) continue;
          if (cerca && (m.libres || []).includes(C.p.nombre)) continue;
          const mg = margen(t.pts, C.puntos, tol.manguera, C.ejes || []);
          if (mg < -tol.manguera) falla("mangueras", mg, `${et}: ${m.nombre} atraviesa ${C.p.nombre} (${(-mg * 1000).toFixed(0)} mm)`);
        }
      }
    }
    for (let i = 0; i < trozosTodos.length; i++) for (let j = i + 1; j < trozosTodos.length; j++) {
      const a = trozosTodos[i], b = trozosTodos[j];
      if (a.m === b.m) continue;
      if (!tocan(a.t.caja, b.t.caja, 0)) continue;
      const lim = tol.mangueraEntreSi * Math.min(a.m.r, b.m.r) * 2, mg = margen(a.t.pts, b.t.pts, lim);
      if (mg < -lim) falla("mangueras", mg, `${et}: ${a.m.nombre} atraviesa ${b.m.nombre}`);
    }
    // puertos: sobre la superficie de su pieza
    for (const [n, pt] of M.puertos) {
      const P = pose.mundo(pt.grupo, pt.punto);
      const C = cs.find((c) => c.p.nombre === pt.pieza);
      if (!C) { falla("puertos", 1, `${n}: pieza ${pt.pieza} no existe`); continue; }
      const s = separate([P], C.puntos);
      if (Math.abs(s.margin) > tol.puerto) falla("puertos", s.margin, `${et}: puerto ${n} a ${(s.margin * 1000).toFixed(1)} mm de la superficie de ${pt.pieza}`);
    }
    // terreno: ruedas apoyadas, nada dentro de la roca (las cavidades de esta pose: taladros ya perforados)
    if (ter) {
      ter.cavidades = ps.cavidades || [];
      if (ps.ruedasEnPiso !== false) for (const w of M.ruedas) {
        const c = pose.mundo(w.grupo, w.centro), e = VA.unit(pose.dirMundo(w.grupo, w.eje));
        const abajo = VA.perp(e, [0, -1, 0]);
        let peor = Infinity, pTocado = null;
        for (const k of [-0.45, 0, 0.45]) { // tres puntos a lo ancho de la banda
          const p = VA.add(VA.add(c, VA.mul(abajo, w.R)), VA.mul(e, k * w.W));
          const gap = p[1] - ter.piso(p[0], p[2]);
          if (gap < peor) { peor = gap; pTocado = p; }
        }
        if (peor < -tol.ruedaHundida) falla("ruedas", peor, `${et}: ${w.nombre} hundida ${(-peor * 100).toFixed(1)} cm en el piso`);
        if (peor > tol.ruedaFlota) falla("ruedas", peor, `${et}: ${w.nombre} en el aire (${(peor * 100).toFixed(1)} cm)`);
      }
      for (const C of cs) {
        if (C.p.ignoraRoca) continue;
        const permitido = C.p.tocaRoca ? tol.tocaRoca : tol.roca;
        let peor = Infinity, donde = null;
        for (const q of C.puntos) {
          if (ter.enCavidad && ter.enCavidad(q, C.p)) continue;
          const d = ter.libre(q);
          if (d < peor) { peor = d; donde = q; }
        }
        if (peor < -permitido) falla("roca", peor, `${et}: ${C.p.nombre} entra ${(-peor * 100).toFixed(1)} cm en la roca en (${donde.map((v) => v.toFixed(2)).join(", ")})`);
      }
    }
  }
  for (const [k, v] of cacheMargen) falla("interpenetracion", v.m, `${v.et}: ${k.replace("|", " × ")} se atraviesan ${(-v.m * 1000).toFixed(0)} mm`);
  const aprobado = Object.values(L).every((l) => l.ok);
  return { aprobado, lineas: L, poses: poses.length, piezas: M.piezas.length, uniones: M.uniones.size, pares: paresJuzgados };
}

/** Texto corto del resultado (una línea por chequeo). */
export function textoFisica(r) {
  const out = [];
  for (const [n, l] of Object.entries(r.lineas)) out.push(`${l.ok ? "ok   " : "FALLA"} ${n.padEnd(17)} ${l.ok ? "" : `${l.n} · ` + l.ejemplos.slice(0, 4).join(" | ")}`);
  out.push(`${r.aprobado ? "física aprobada" : "física reprobada"} · ${r.piezas} piezas, ${r.uniones} uniones declaradas, ${r.poses} poses, ${r.pares} pares juzgados`);
  return out.join("\n");
}
