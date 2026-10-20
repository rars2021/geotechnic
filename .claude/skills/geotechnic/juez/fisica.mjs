// Geotechnic · juez · física. Corre en Node sobre el modelo puro del motor A y el contrato del motor B.
// Usa el separador de planos de Anatomy (`separate`, anatomia/kit/turn-build.mjs, MIT): para dos sólidos convexos
// devuelve el mejor plano separador y su margen; margen < 0 es la penetración (m). Primero `gjk` (rápido: cualquier
// plano con margen ≥ −tolerancia ya prueba que no se atraviesan) y solo si no alcanza, `separate` (búsqueda fina).
// Pistas: los ejes de la máquina y los de los marcos de las dos piezas (caras planas paralelas se separan por ellos).
// SAT completo (ronda 5): si gjk y separate dan margen < −tolerancia, se prueban TODOS los ejes del teorema del eje
// separador para convexos: normales de cara de los dos cascos y productos cruz arista × arista (casco convexo 3D con
// ConvexHull de three; deduplicados, normalizados, sin los casi nulos). Si un eje separa, el par NO se atraviesa. El
// margen negativo solo cuenta si ningún eje separa, y entonces es la penetración exacta del par de poliedros.
// (gjk y separate solo prueban direcciones cercanas a sus pistas: con piezas giradas o caras inclinadas daban choques
// falsos: camión −103 mm con 78 mm de luz real; pala −53 mm con +10 mm de luz.)
// Una máquina: juzgarFisica. Varias en un mismo ciclo (flota, pala y camión): juzgarConjunto, con la línea «entre máquinas»;
// en hilos (ciclos largos): juzgarConjuntoHilos, que junta los tramos con cerrarConjunto y da el mismo resultado.
const EJES = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
import { separate, gjk } from "../anatomia/kit/turn-build.mjs";
import { ConvexHull } from "three/examples/jsm/math/ConvexHull.js";
import { Vector3 } from "three";
import { createHash } from "node:crypto";

/** Margen entre dos convexos (m; < 0 = penetración): vía rápida (gjk, separate) y, si dice que se atraviesan, SAT completo. */
export function margen(A, B, tol, pistas = []) {
  const g = gjk(A, B);
  if (g.margin >= -tol) return g.margin;
  const s = separate(A, B, [...EJES, ...pistas]).margin;
  if (s >= -tol) return s;
  SAT.llamadas++;
  const m = Math.max(s, satCompleto(A, B, tol));
  if (m >= -tol) SAT.rescates++;
  return m;
}
/** Cuántas veces corrió el SAT completo y cuántas encontró un eje separador que la vía rápida no vio. */
export const SAT = { llamadas: 0, rescates: 0 };

const margenEn = (n, A, B) => { // B más allá de A a lo largo de n (separación si > 0)
  let hiA = -Infinity, loB = Infinity;
  for (const a of A) { const v = n[0] * a[0] + n[1] * a[1] + n[2] * a[2]; if (v > hiA) hiA = v; }
  for (const b of B) { const v = n[0] * b[0] + n[1] * b[1] + n[2] * b[2]; if (v < loB) loB = v; }
  return loB - hiA;
};
/** Direcciones únicas (normalizadas, signo canónico, sin las casi nulas). */
function unicas(dirs, minimo = 1e-9) {
  const out = new Map();
  for (const d of dirs) {
    const l = Math.hypot(d[0], d[1], d[2]);
    if (l < minimo) continue;
    let u = [d[0] / l, d[1] / l, d[2] / l];
    const k0 = Math.abs(u[0]) > 1e-9 ? 0 : Math.abs(u[1]) > 1e-9 ? 1 : 2;
    if (u[k0] < 0) u = [-u[0], -u[1], -u[2]];
    const k = u.map((v) => Math.round(v * 1e5)).join(",");
    if (!out.has(k)) out.set(k, u);
  }
  return [...out.values()];
}
/** Normales de cara y direcciones de arista del casco convexo de unos puntos (null si es degenerado). */
function ejesCasco(P) {
  try {
    const h = new ConvexHull().setFromPoints(P.map((q) => new Vector3(q[0], q[1], q[2])));
    if (!h.faces.length) return null;
    const caras = [], aristas = [];
    for (const f of h.faces) {
      caras.push([f.normal.x, f.normal.y, f.normal.z]);
      let e = f.edge;
      do { const a = e.tail().point, b = e.head().point; aristas.push([b.x - a.x, b.y - a.y, b.z - a.z]); e = e.next; } while (e !== f.edge);
    }
    return { caras: unicas(caras), aristas: unicas(aristas, 1e-7) };
  } catch { return null; }
}
/** SAT completo para dos convexos: el mayor margen sobre todos los ejes candidatos (corta en el primero que separa). */
export function satCompleto(A, B, tol = 0) {
  const ha = ejesCasco(A), hb = ejesCasco(B);
  if (!ha || !hb) return -Infinity; // casco degenerado: se queda lo de la vía rápida
  let mejor = -Infinity;
  const probar = (n) => { const m = Math.max(margenEn(n, A, B), margenEn([-n[0], -n[1], -n[2]], A, B)); if (m > mejor) mejor = m; return m >= -tol; };
  for (const n of ha.caras) if (probar(n)) return mejor;
  for (const n of hb.caras) if (probar(n)) return mejor;
  const cruces = [];
  for (const a of ha.aristas) for (const b of hb.aristas) cruces.push([a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]);
  for (const n of unicas(cruces, 1e-6)) if (probar(n)) return mejor;
  return mejor;
}
import { VA } from "../motorA/modelo.js";

export const TOLERANCIAS = {
  penetracion: 0.004,   // m: dos sólidos no unidos pueden tocarse (apoyo), no entrar más de 4 mm
  entreMaquinas: 0.004, // m: lo mismo entre sólidos de dos máquinas distintas (camión bajo el cucharón, camiones en cola)
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
  verificaCota: 50,     // con terreno.libreCaja: 1 de cada 50 saltos (y el primero) se recorre punto a punto igual
};

const caja = (pts) => {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const p of pts) for (let k = 0; k < 3; k++) { if (p[k] < lo[k]) lo[k] = p[k]; if (p[k] > hi[k]) hi[k] = p[k]; }
  return { lo, hi };
};
const tocan = (a, b, m) => a.lo[0] - m <= b.hi[0] && b.lo[0] - m <= a.hi[0] && a.lo[1] - m <= b.hi[1] && b.lo[1] - m <= a.hi[1] && a.lo[2] - m <= b.hi[2] && b.lo[2] - m <= a.hi[2];
/** Caja de un conjunto de cascos (cada uno con su caja). */
const cajaDe = (cs) => {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const c of cs) for (let k = 0; k < 3; k++) { if (c.caja.lo[k] < lo[k]) lo[k] = c.caja.lo[k]; if (c.caja.hi[k] > hi[k]) hi[k] = c.caja.hi[k]; }
  return { lo, hi };
};

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

const LINEAS = ["interpenetracion", "rangos", "cierres", "cilindros", "mangueras", "puertos", "ruedas", "roca"];

/**
 * Chequeos de UNA máquina. Cada uno devuelve sus fallas como [línea, valor, resto, sinEtiqueta?] (el texto es
 * «etiqueta: resto»); `choques` devuelve los pares [clave, margen] que se atraviesan. Guarda entre poses los pares de
 * un mismo grupo rígido ya juzgados (no cambian con la pose) y cuenta los pares juzgados.
 */
function chequeos(M, tol) {
  const K = { pares: 0, saltos: 0 };
  K.cascos = (pose) => M.cascos(pose).map((c) => ({ ...c, caja: caja(c.puntos) }));
  // rangos de los grupos, cadenas cerradas y cilindros entre pasadores (largo dentro de la carrera, perpendiculares)
  K.articulaciones = (pose) => {
    const F = [];
    for (const [n, g] of M.grupos) {
      const r = g.bisagra?.rango || g.desliza?.rango;
      if (!r) continue;
      const v = pose.valores[n];
      if (v < r[0] - 1e-6 || v > r[1] + 1e-6) F.push(["rangos", v, `${n} = ${v.toFixed(2)} fuera de [${r[0]}, ${r[1]}]`]);
    }
    for (const [n, r] of Object.entries(pose.valores._residuos || {})) if (Math.abs(r) > tol.cierre) F.push(["cierres", r, `cadena ${n} no cierra (${(r * 1000).toFixed(1)} mm)`]);
    for (const c of M.cilindros) {
      const s = pose.cil.get(c.nombre);
      if (s.L < c.Lmin - 1e-4) F.push(["cilindros", s.L - c.Lmin, `${c.nombre} más corto que retraído (${s.L.toFixed(3)} < ${c.Lmin.toFixed(3)} m)`]);
      if (s.L > c.Lmax + 1e-4) F.push(["cilindros", s.L - c.Lmax, `${c.nombre} más largo que su carrera (${s.L.toFixed(3)} > ${c.Lmax.toFixed(3)} m)`]);
      if (s.desalineo > tol.desalineo) F.push(["cilindros", s.desalineo, `${c.nombre} no es perpendicular a sus pasadores (cos ${s.desalineo.toFixed(3)})`]);
    }
    return F;
  };
  // cascos: pares no unidos que se atraviesan más que la tolerancia
  // tabla por par (i < j, el orden de M.piezas): 1 = unidas, 2 = mismo grupo rígido ya juzgado; se arma una vez
  let tabla = null;
  K.choques = (cs) => {
    const out = [], n = cs.length;
    if (!tabla || tabla.n !== n) {
      tabla = new Uint8Array(n * n); tabla.n = n;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (M.unidas(cs[i].p.nombre, cs[j].p.nombre)) tabla[i * n + j] = 1;
    }
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (tabla[i * n + j]) continue;
      const A = cs[i], B = cs[j];
      if (!tocan(A.caja, B.caja, tol.penetracion)) continue;
      if (A.p.grupo === B.p.grupo) tabla[i * n + j] = 2;
      K.pares++;
      const mg = margen(A.puntos, B.puntos, tol.penetracion, [...(A.ejes || []), ...(B.ejes || [])]);
      if (mg < -tol.penetracion) out.push([A.p.nombre + "|" + B.p.nombre, mg]);
    }
    return out;
  };
  // mangueras: largo, puertos sobre su pieza, sin atravesar sólidos, doblez
  K.mangueras = (pose, cs) => {
    const F = [], trozosTodos = [];
    for (const m of M.mangueras) {
      const c = pose.mang.get(m.nombre);
      if (c.estirada) F.push(["mangueras", c.recta - m.largo, `${m.nombre} estirada: los puertos quedan a ${c.recta.toFixed(2)} m y mide ${m.largo.toFixed(2)} m`]);
      if (c.radioMin < tol.doblez * 2 * m.r) F.push(["mangueras", c.radioMin, `${m.nombre} doblada a radio ${(c.radioMin * 100).toFixed(1)} cm (mínimo ${(tol.doblez * 2 * m.r * 100).toFixed(1)})`]);
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
          if (mg < -tol.manguera) F.push(["mangueras", mg, `${m.nombre} atraviesa ${C.p.nombre} (${(-mg * 1000).toFixed(0)} mm)`]);
        }
      }
    }
    for (let i = 0; i < trozosTodos.length; i++) for (let j = i + 1; j < trozosTodos.length; j++) {
      const a = trozosTodos[i], b = trozosTodos[j];
      if (a.m === b.m) continue;
      if (!tocan(a.t.caja, b.t.caja, 0)) continue;
      const lim = tol.mangueraEntreSi * Math.min(a.m.r, b.m.r) * 2, mg = margen(a.t.pts, b.t.pts, lim);
      if (mg < -lim) F.push(["mangueras", mg, `${a.m.nombre} atraviesa ${b.m.nombre}`]);
    }
    return F;
  };
  // puertos: sobre la superficie de su pieza
  K.puertos = (pose, cs) => {
    const F = [];
    for (const [n, pt] of M.puertos) {
      const P = pose.mundo(pt.grupo, pt.punto);
      const C = cs.find((c) => c.p.nombre === pt.pieza);
      if (!C) { F.push(["puertos", 1, `${n}: pieza ${pt.pieza} no existe`, true]); continue; }
      const s = separate([P], C.puntos);
      if (Math.abs(s.margin) > tol.puerto) F.push(["puertos", s.margin, `puerto ${n} a ${(s.margin * 1000).toFixed(1)} mm de la superficie de ${pt.pieza}`]);
    }
    return F;
  };
  // terreno: ruedas apoyadas, nada dentro de la roca (las cavidades de esta pose: taladros ya perforados).
  // Si el terreno da `libreCaja(lo, hi)` (cota INFERIOR de `libre` en la caja), la máquina entera o una pieza cuya cota
  // no baja de su tolerancia no se recorre punto a punto: mismo resultado, mucho más rápido (la cota la responde B).
  // Llantas en `roca`: las piezas `llanta` registradas en M.ruedas, con las ruedas en el piso, usan `ruedaHundida`
  // (6 cm de deflexión y barro), la misma regla de la línea `ruedas`. Con `ruedasEnPiso: false`, 1 cm como cualquiera.
  const llantas = new Set(M.ruedas.map((w) => w.nombre));
  K.terreno = (ps, pose, cs, ter) => {
    const F = [];
    ter.cavidades = ps.cavidades || [];
    const enPiso = ps.ruedasEnPiso !== false;
    const permitidoDe = (C) => Math.max(C.p.tocaRoca ? tol.tocaRoca : tol.roca, enPiso && C.p.tipo === "llanta" && llantas.has(C.p.nombre) ? tol.ruedaHundida : 0);
    if (enPiso) for (const w of M.ruedas) {
      const c = pose.mundo(w.grupo, w.centro), e = VA.unit(pose.dirMundo(w.grupo, w.eje));
      const abajo = VA.perp(e, [0, -1, 0]);
      let peor = Infinity;
      for (const k of [-0.45, 0, 0.45]) { // tres puntos a lo ancho de la banda
        const p = VA.add(VA.add(c, VA.mul(abajo, w.R)), VA.mul(e, k * w.W));
        const gap = p[1] - ter.piso(p[0], p[2]);
        if (gap < peor) peor = gap;
      }
      if (peor < -tol.ruedaHundida) F.push(["ruedas", peor, `${w.nombre} hundida ${(-peor * 100).toFixed(1)} cm en el piso`]);
      if (peor > tol.ruedaFlota) F.push(["ruedas", peor, `${w.nombre} en el aire (${(peor * 100).toFixed(1)} cm)`]);
    }
    const peorDe = (C) => {
      let peor = Infinity, donde = null;
      for (const q of C.puntos) {
        if (ter.enCavidad && ter.enCavidad(q, C.p)) continue;
        const d = ter.libre(q);
        if (d < peor) { peor = d; donde = q; }
      }
      return { peor, donde };
    };
    // la cota se verifica: el primer salto y uno de cada `tol.verificaCota` se recorren igual; si `libre` baja de la
    // cota, es falla de roca (el terreno miente) y la línea no aprueba
    const cota = typeof ter.libreCaja === "function" ? ter.libreCaja : null;
    const verificar = (piezas, c) => {
      if (K.saltos++ % tol.verificaCota) return;
      for (const C of piezas) {
        const { peor, donde } = peorDe(C);
        if (peor < c - 1e-6) { F.push(["roca", peor, `libreCaja no es cota inferior: da ${c.toFixed(3)} m en la caja de ${C.p.nombre} y libre vale ${peor.toFixed(3)} m en (${donde.map((v) => v.toFixed(2)).join(", ")})`]); return; }
      }
    };
    if (cota && cs.length) { const todo = cajaDe(cs), c = cota(todo.lo, todo.hi); if (c >= -tol.roca) { verificar(cs.filter((C) => !C.p.ignoraRoca), c); return F; } }
    for (const C of cs) {
      if (C.p.ignoraRoca) continue;
      const permitido = permitidoDe(C);
      if (cota) { const c = cota(C.caja.lo, C.caja.hi); if (c >= -permitido) { verificar([C], c); continue; } }
      const { peor, donde } = peorDe(C);
      if (peor < -permitido) F.push(["roca", peor, `${C.p.nombre} entra ${(-peor * 100).toFixed(1)} cm en la roca en (${donde.map((v) => v.toFixed(2)).join(", ")})`]);
    }
    return F;
  };
  return K;
}

/** Libro de líneas { nombre: { ok, n, peor, ejemplos[] } } y `falla(línea, valor, texto)`. */
function libro(nombres, max) {
  const L = {};
  const linea = (n) => (L[n] ??= { ok: true, n: 0, peor: 0, ejemplos: [] });
  const falla = (n, valor, texto) => {
    const l = linea(n); l.ok = false; l.n++;
    if (Math.abs(valor) > Math.abs(l.peor)) l.peor = valor;
    if (l.ejemplos.length < max) l.ejemplos.push(texto);
  };
  for (const n of nombres) linea(n);
  return { L, falla };
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
  const { L, falla } = libro(LINEAS, op.max ?? 8);
  const K = chequeos(M, tol);
  const cacheMargen = new Map();
  for (const ps of poses) {
    const pose = M.posar(ps.valores);
    const et = ps.etiqueta;
    const aplicar = (F) => { for (const [n, v, resto, sola] of F) falla(n, v, sola ? resto : `${et}: ${resto}`); };
    aplicar(K.articulaciones(pose));
    const cs = K.cascos(pose);
    for (const [k, mg] of K.choques(cs)) { const prev = cacheMargen.get(k); if (!prev || mg < prev.m) cacheMargen.set(k, { m: mg, et }); }
    aplicar(K.mangueras(pose, cs));
    aplicar(K.puertos(pose, cs));
    if (ter) aplicar(K.terreno(ps, pose, cs, ter));
  }
  for (const [k, v] of cacheMargen) falla("interpenetracion", v.m, `${v.et}: ${k.replace("|", " × ")} se atraviesan ${(-v.m * 1000).toFixed(0)} mm`);
  const aprobado = Object.values(L).every((l) => l.ok);
  return { aprobado, lineas: L, poses: poses.length, piezas: M.piezas.length, uniones: M.uniones.size, pares: K.pares };
}

/**
 * Juzga VARIAS máquinas en un mismo ciclo (references/juez.md, «Varias máquinas»).
 * maquinas: [{ id, equipo, M }] (varias instancias pueden compartir el mismo M).
 * op: { ciclo: [{ etiqueta, porMaquina: { id: valores | null }, ruedasEnPiso?: bool | { id: bool }, cavidades? }],
 *       terreno?, tol?, max? }. `null` = la instancia no está en esa pose; si falta su id, es falla (rangos).
 * Cada instancia pasa las ocho líneas de juzgarFisica; todas juntas, la línea «entre máquinas»: ningún sólido de una
 * instancia entra en uno de otra más de `tol.entreMaquinas` (caja de cada instancia, caja de cada pieza, gjk/separate).
 * Caché (mismo juicio, sin rehacerlo):
 *   · física interna (rangos, cierres, cilindros, interpenetración, puertos): solo depende de las articulaciones; se
 *     juzga en el marco de la máquina (_pose en el origen, rumbo 0) y se guarda por modelo (0,01° y 1 mm);
 *   · mangueras: articulaciones + cabeceo y alabeo (la gravedad vista desde la máquina);
 *   · ruedas y roca: la pose entera (+ cavidades y ruedasEnPiso);
 *   · entre máquinas: un par no se rejuzga si las dos están en poses con las que ya se juzgó.
 * Una pose reusada repite sus fallas con su propia etiqueta: los conteos son los de juzgar cada pose.
 */
export function juzgarConjunto(maquinas, op = {}) {
  const t0 = Date.now();
  const ciclo = op.ciclo || [];
  const parte = tramoConjunto(contextoConjunto(maquinas, op), ciclo, 0, ciclo.length, op.terreno || null);
  return cerrarConjunto(maquinas, [parte], { ...op, segundos: (Date.now() - t0) / 1000 });
}

/** Lo que dura entre tramos: tolerancias, instancias y, por modelo, sus chequeos y sus cachés (puras: clave → fallas). */
export function contextoConjunto(maquinas, op = {}) {
  const tol = { ...TOLERANCIAS, ...(op.tol || {}) };
  const ids = new Set();
  for (const m of maquinas) { if (ids.has(m.id)) throw new Error(`juzgarConjunto: id repetido «${m.id}»`); ids.add(m.id); }
  const modelos = new Map();
  const modeloDe = (M) => {
    let d = modelos.get(M);
    if (!d) modelos.set(M, (d = { K: chequeos(M, tol), interno: new Map(), mang: new Map(), ext: new Map(), nombres: new Map(),
      art: [...M.grupos].filter(([, g]) => g.tipo === "bisagra" || g.tipo === "desliza").map(([n, g]) => [n, g.tipo === "bisagra" ? 100 : 1000]) }));
    return d;
  };
  const I = maquinas.map((m, i) => ({ i, id: m.id, equipo: m.equipo, M: m.M, d: modeloDe(m.M), ult: null }));
  return { tol, max: op.max ?? 8, modelos, I };
}

/**
 * Juzga las poses [desde, hasta) del ciclo. Devuelve una PARTE clonable (pasa entre hilos): el libro de las líneas que
 * se escriben pose a pose (en orden) y lo que se escribe al final (peor margen por par de piezas de cada instancia y
 * entre máquinas), sin escribir. `cerrarConjunto` junta las partes en orden: igual que juzgar el ciclo de corrido.
 * Los pares entre máquinas ya vistos se recuerdan solo dentro del tramo (la etiqueta del peor no depende del hilo).
 */
export function tramoConjunto(ctx, ciclo, desde, hasta, ter) {
  const { tol, I } = ctx;
  const { L, falla } = libro([...LINEAS, "entre máquinas"], ctx.max);
  const E = I.map(() => ({ peor: new Map(), fallas: 0, poses: 0, aqui: false }));
  const paresAntes = [...ctx.modelos.values()].reduce((s, d) => s + d.K.pares, 0);
  const st = { interno: [0, 0], mangueras: [0, 0], terreno: [0, 0], pares: [0, 0, 0], piezas: 0, ms: { interno: 0, mangueras: 0, mundo: 0, terreno: 0, pares: 0 } }; // [juzgados, reusados(, lejos)]
  let tt = Date.now();
  const reloj = (k) => { const a = Date.now(); st.ms[k] += a - tt; tt = a; };
  const q = (v, f) => Math.round((v || 0) * f);
  const CERO = { x: 0, y: 0, z: 0, rumbo: 0, cabeceo: 0, alabeo: 0 };
  const choques = new Map(), paresVistos = new Set();
  for (let ip = desde; ip < hasta; ip++) {
    const ps = ciclo[ip], et = ps.etiqueta;
    for (const X of I) {
      const e = E[X.i];
      e.aqui = false;
      const v = ps.porMaquina?.[X.id];
      if (v === null) continue;
      if (v === undefined) { falla("rangos", 1, `${X.id} · ${et}: sin valores en porMaquina`); e.fallas++; continue; }
      e.aqui = true; e.poses++;
      const { M, d } = X, val = M.valores(v), p = val._pose;
      const aplicar = (F) => { for (const [n, x, resto, sola] of F) { falla(n, x, `${X.id} · ` + (sola ? resto : `${et}: ${resto}`)); e.fallas++; } };
      const kInt = d.art.map(([n, f]) => q(val[n], f)).join(",") + "|" + Object.values(val._residuos || {}).map((r) => q(r, 1e4)).join(",");
      // física interna, en el marco de la máquina
      tt = Date.now();
      let r = d.interno.get(kInt);
      if (r) st.interno[1]++;
      else {
        st.interno[0]++;
        const pose0 = M.posar({ ...v, _pose: CERO, _sinMangueras: true });
        const cs0 = d.K.cascos(pose0);
        r = { F: [...d.K.articulaciones(pose0), ...d.K.puertos(pose0, cs0)], choques: d.K.choques(cs0) };
        d.interno.set(kInt, r);
      }
      aplicar(r.F);
      for (const [k, mg] of r.choques) { const prev = e.peor.get(k); if (!prev || mg < prev.m) e.peor.set(k, { m: mg, et }); }
      reloj("interno");
      // mangueras, con la gravedad de esta pose
      if (M.mangueras.length) {
        const kM = kInt + "|" + q(p.cabeceo, 100) + "," + q(p.alabeo, 100);
        let F = d.mang.get(kM);
        if (F) st.mangueras[1]++;
        else {
          st.mangueras[0]++;
          const poseM = M.posar({ ...v, _pose: { ...CERO, cabeceo: p.cabeceo, alabeo: p.alabeo } });
          F = d.K.mangueras(poseM, d.K.cascos(poseM));
          d.mang.set(kM, F);
        }
        aplicar(F);
        reloj("mangueras");
      }
      // la máquina en el mundo: ruedas, roca y entre máquinas
      const rp = ps.ruedasEnPiso && typeof ps.ruedasEnPiso === "object" ? ps.ruedasEnPiso[X.id] : ps.ruedasEnPiso;
      const cav = ps.cavidades || [];
      const kExt = kInt + "|" + [p.x, p.y, p.z].map((x) => q(x, 1000)).join(",") + "," + [p.rumbo, p.cabeceo, p.alabeo].map((a) => q(a, 100)).join(",") + "|" + (rp === false ? 0 : 1) + (cav.length ? "|" + JSON.stringify(cav) : "");
      if (X.ult?.kExt !== kExt) {
        const pose = M.posar({ ...v, _sinMangueras: true }), cs = d.K.cascos(pose);
        if (!d.nombres.has(kExt)) d.nombres.set(kExt, d.nombres.size);
        X.ult = { kExt, n: d.nombres.get(kExt), pose, cs, caja: cajaDe(cs) };
      }
      reloj("mundo");
      if (ter) {
        let F = d.ext.get(kExt);
        if (F) st.terreno[1]++;
        else { st.terreno[0]++; F = d.K.terreno({ ruedasEnPiso: rp, cavidades: cav }, X.ult.pose, X.ult.cs, ter); d.ext.set(kExt, F); }
        aplicar(F);
        reloj("terreno");
      }
    }
    // entre máquinas
    tt = Date.now();
    const aqui = I.filter((X) => E[X.i].aqui);
    for (let a = 0; a < aqui.length; a++) for (let b = a + 1; b < aqui.length; b++) {
      const A = aqui[a], B = aqui[b];
      const kp = `${A.i}:${A.ult.n}|${B.i}:${B.ult.n}`;
      if (paresVistos.has(kp)) { st.pares[1]++; continue; }
      paresVistos.add(kp);
      if (!tocan(A.ult.caja, B.ult.caja, tol.entreMaquinas)) { st.pares[2]++; continue; }
      st.pares[0]++;
      const csA = A.ult.cs.filter((c) => tocan(c.caja, B.ult.caja, tol.entreMaquinas));
      const csB = B.ult.cs.filter((c) => tocan(c.caja, A.ult.caja, tol.entreMaquinas));
      for (const ca of csA) for (const cb of csB) {
        if (!tocan(ca.caja, cb.caja, tol.entreMaquinas)) continue;
        st.piezas++;
        const mg = margen(ca.puntos, cb.puntos, tol.entreMaquinas, [...(ca.ejes || []), ...(cb.ejes || [])]);
        if (mg < -tol.entreMaquinas) {
          const k = `${A.id}|${ca.p.nombre}|${B.id}|${cb.p.nombre}`, prev = choques.get(k);
          if (!prev || mg < prev.m) choques.set(k, { m: mg, et, a: A.id, pa: ca.p.nombre, b: B.id, pb: cb.p.nombre });
        }
      }
    }
    reloj("pares");
  }
  return {
    desde, hasta, lineas: L, st, choques: [...choques],
    inst: E.map((e) => ({ peor: [...e.peor], fallas: e.fallas, poses: e.poses })),
    pares: [...ctx.modelos.values()].reduce((s, d) => s + d.K.pares, 0) - paresAntes,
    piezas: [...ctx.modelos.keys()].reduce((s, M) => s + M.piezas.length, 0),
  };
}

/**
 * Junta las partes (en el orden del ciclo) y escribe lo del final: el resultado de juzgarConjunto. Igual que de
 * corrido: conteos sumados; peor = el primero de mayor |valor|; ejemplos = los primeros `max`; peor margen por par de
 * piezas = el menor y, con empate, el de la pose más temprana (el orden de los pares es el de su primera aparición).
 */
export function cerrarConjunto(maquinas, partes, op = {}) {
  const max = op.max ?? 8;
  const { L, falla } = libro([...LINEAS, "entre máquinas"], max);
  const st = { interno: [0, 0], mangueras: [0, 0], terreno: [0, 0], pares: [0, 0, 0], piezas: 0, ms: { interno: 0, mangueras: 0, mundo: 0, terreno: 0, pares: 0 } };
  const peor = maquinas.map(() => new Map()), fallas = maquinas.map(() => 0), poses = maquinas.map(() => 0);
  const choques = new Map();
  const menor = (mapa, k, v) => { const prev = mapa.get(k); if (!prev || v.m < prev.m) mapa.set(k, v); };
  let n = 0, pares = 0;
  for (const P of [...partes].sort((a, b) => a.desde - b.desde)) {
    n += P.hasta - P.desde; pares += P.pares;
    for (const [k, l] of Object.entries(P.lineas)) {
      const a = (L[k] ??= { ok: true, n: 0, peor: 0, ejemplos: [] });
      a.ok = a.ok && l.ok; a.n += l.n;
      if (Math.abs(l.peor) > Math.abs(a.peor)) a.peor = l.peor;
      for (const e of l.ejemplos) if (a.ejemplos.length < max) a.ejemplos.push(e);
    }
    for (const k of ["interno", "mangueras", "terreno", "pares"]) P.st[k].forEach((v, i) => (st[k][i] += v));
    st.piezas += P.st.piezas;
    for (const k in P.st.ms) st.ms[k] += P.st.ms[k];
    P.inst.forEach((e, i) => { fallas[i] += e.fallas; poses[i] += e.poses; for (const [k, v] of e.peor) menor(peor[i], k, v); });
    for (const [k, v] of P.choques) menor(choques, k, v);
  }
  maquinas.forEach((m, i) => { for (const [k, v] of peor[i]) { falla("interpenetracion", v.m, `${m.id} · ${v.et}: ${k.replace("|", " × ")} se atraviesan ${(-v.m * 1000).toFixed(0)} mm`); fallas[i]++; } });
  const idx = new Map(maquinas.map((m, i) => [m.id, i]));
  for (const v of choques.values()) {
    falla("entre máquinas", v.m, `${v.et}: ${v.a} (${v.pa}) × ${v.b} (${v.pb}) se atraviesan ${(-v.m * 1000).toFixed(0)} mm`);
    fallas[idx.get(v.a)]++; fallas[idx.get(v.b)]++;
  }
  const aprobado = Object.values(L).every((l) => l.ok);
  return {
    aprobado, lineas: L, poses: n, instancias: maquinas.length, segundos: op.segundos ?? 0, estadistica: st, hilos: op.hilos ?? 1,
    maquinas: maquinas.map((m, i) => ({ id: m.id, equipo: m.equipo, poses: poses[i], fallas: fallas[i], aprobado: fallas[i] === 0 })),
    piezas: partes[0]?.piezas ?? 0, pares,
  };
}

/** Huella del ciclo y de las instancias: cada hilo prueba con ella que armó lo mismo que el principal. */
export function firmaCiclo(ciclo, maquinas) {
  return createHash("sha256").update(JSON.stringify(maquinas.map((m) => [m.id, m.equipo]))).update(JSON.stringify(ciclo)).digest("hex").slice(0, 16);
}

/**
 * juzgarConjunto en varios hilos (references/juez.md, «Hilos»). Cada hilo importa `modulo` (URL de un montaje.js con
 * `pruebas(paso)`), arma SU ciclo, prueba que su firma es la del principal (si no, error: no juzga otra cosa) y juzga
 * los tramos contiguos que el principal le va dando. `cerrarConjunto` junta las partes en orden: mismo veredicto,
 * conteos y ejemplos que juzgarConjunto. (Las cachés cuantizan a 0,01° y 1 mm; un hilo puede tomar otra pose
 * representante del mismo casillero que el de corrido: a lo sumo cambia un decimal de un ejemplo.)
 * op: { modulo, paso, poses, firma, hilos?, tramo?, tol?, max? }.
 */
export async function juzgarConjuntoHilos(maquinas, op) {
  const { Worker } = await import("node:worker_threads");
  const os = await import("node:os");
  const t0 = Date.now();
  const N = op.poses;
  const hilos = Math.max(1, Math.min(N, op.hilos ?? Math.min(12, (os.availableParallelism?.() ?? os.cpus().length) - 1)));
  const tramo = op.tramo ?? Math.max(10, Math.ceil(N / (hilos * 6)));
  const tareas = [];
  for (let a = 0; a < N; a += tramo) tareas.push([a, Math.min(N, a + tramo)]);
  const partes = [];
  await new Promise((listo, fallo) => {
    let vivos = hilos, error = null;
    const W = [];
    const terminar = (e) => { if (error) return; error = e; for (const w of W) w.terminate(); fallo(e); };
    for (let h = 0; h < hilos; h++) {
      const w = new Worker(new URL("./fisica-hilo.mjs", import.meta.url), { workerData: { modulo: op.modulo, paso: op.paso, tol: op.tol || null, max: op.max ?? 8 } });
      W.push(w);
      const siguiente = () => { const t = tareas.shift(); w.postMessage(t ? { desde: t[0], hasta: t[1] } : { fin: true }); };
      w.on("message", (m) => {
        if (m.error) return terminar(new Error(`hilo ${h}: ${m.error}`));
        if (m.firma !== undefined) return m.firma === op.firma ? siguiente() : terminar(new Error(`hilo ${h}: su ciclo no es el del principal (firma ${m.firma} ≠ ${op.firma})`));
        partes.push(m.parte); siguiente();
      });
      w.on("error", terminar);
      w.on("exit", () => { if (--vivos === 0 && !error) listo(); });
    }
  });
  if (partes.reduce((s, P) => s + P.hasta - P.desde, 0) !== N) throw new Error("juzgarConjuntoHilos: faltan tramos");
  return cerrarConjunto(maquinas, partes, { max: op.max, hilos, segundos: (Date.now() - t0) / 1000 });
}

/** Texto corto del resultado (una línea por chequeo). */
export function textoFisica(r) {
  const out = [];
  for (const [n, l] of Object.entries(r.lineas)) out.push(`${l.ok ? "ok   " : "FALLA"} ${n.padEnd(17)} ${l.ok ? "" : `${l.n} · ` + l.ejemplos.slice(0, 4).join(" | ")}`);
  if (r.instancias !== undefined) { // juzgarConjunto
    const s = r.estadistica, mal = r.maquinas.filter((m) => !m.aprobado);
    out.push(`máquinas: ${r.maquinas.map((m) => `${m.id} ${m.aprobado ? "✓" : "✗ " + m.fallas}`).join(" · ")}`);
    out.push(`juicios hechos/reusados: interna ${s.interno[0]}/${s.interno[1]} · mangueras ${s.mangueras[0]}/${s.mangueras[1]} · terreno ${s.terreno[0]}/${s.terreno[1]} · pares de máquinas: ${s.pares[0]} cerca, ${s.pares[2]} lejos, ${s.pares[1]} reusados (${s.piezas} pares de piezas)`);
    out.push(`tiempo (s${r.hilos > 1 ? `, sumado en ${r.hilos} hilos` : ""}): ${Object.entries(s.ms).map(([k, v]) => `${k} ${(v / 1000).toFixed(1)}`).join(" · ")}`);
    out.push(`${r.aprobado ? "física aprobada" : `física reprobada (${mal.length} de ${r.instancias} máquinas)`} · ${r.instancias} máquinas, ${r.poses} poses, ${r.pares} pares internos juzgados · ${r.segundos.toFixed(1)} s${r.hilos > 1 ? ` (${r.hilos} hilos)` : ""}`);
    return out.join("\n");
  }
  out.push(`${r.aprobado ? "física aprobada" : "física reprobada"} · ${r.piezas} piezas, ${r.uniones} uniones declaradas, ${r.poses} poses, ${r.pares} pares juzgados`);
  return out.join("\n");
}

/**
 * Plantas de la física de varias máquinas (`node scripts/juez.mjs --plantas`): casos chicos que deben fallar y pasar.
 * Un «bloque» (chasis 2 × 1 × 1 m y cabina apoyada encima), dos instancias del mismo modelo.
 */
export async function plantasFisica() {
  const { maquina } = await import("../motorA/modelo.js");
  const filas = [];
  const caso = (nombre, debe, aprueba, detalle = "") => filas.push({ linea: "física", nombre, debe, aprueba, ok: debe === aprueba, detalle });
  const bloque = (brazo = false) => {
    const M = maquina("bloque");
    M.caja({ nombre: "chasis", grupo: "base", centro: [0, 0.5, 0], tam: [2, 1, 1] });
    M.caja({ nombre: "cabina", grupo: "base", centro: [0.5, 1.4, 0], tam: [0.8, 0.8, 0.8] });
    if (brazo) { // brazo con bisagra sobre la punta del chasis: cruza la cabina y, a −30°, baja dentro del chasis
      M.grupo("brazo", { bisagra: { punto: [1, 1.1, 0], eje: [0, 0, 1], rango: [-40, 40] } });
      M.caja({ nombre: "brazo", grupo: "brazo", centro: [0.4, 1.1, 0], tam: [1.2, 0.16, 0.3] });
    }
    return M;
  };
  const M = bloque();
  const dos = (ciclo, op = {}) => juzgarConjunto([{ id: "A", equipo: "bloque", M }, { id: "B", equipo: "bloque", M }], { ciclo, ...op });
  const en = (B) => [{ etiqueta: "p0", porMaquina: { A: {}, B: { _pose: B } } }];
  const det = (l) => (l.ok ? "sin fallas" : `${l.n} · ${l.ejemplos[0]}`);
  const em = (r) => r.lineas["entre máquinas"];
  let r = dos(en({ x: 1.9 }));
  caso("entre máquinas · dos instancias que se atraviesan 10 cm", false, em(r).ok, det(em(r)));
  r = dos(en({ x: 2.05 }));
  caso("entre máquinas · separadas 5 cm", true, em(r).ok, det(em(r)));
  r = dos(en({ x: 1.997 }));
  caso("entre máquinas · apoyadas, 3 mm (tolerancia 4 mm)", true, em(r).ok, det(em(r)));
  r = dos(en({ x: 1.4, rumbo: 90 }));
  caso("entre máquinas · B girada 90° y metida 10 cm", false, em(r).ok, det(em(r)));
  r = dos(en({ x: 1.95, y: 1.5 }));
  caso("entre máquinas · B encima de A, sin tocarla (cajas que se cruzan en x)", true, em(r).ok, det(em(r)));
  // caché: A quieta; B lejos, lejos, entra 10 cm en p2, vuelve a la pose de p0 (reusada)
  r = dos(["p0", "p1", "p2", "p3"].map((etiqueta, i) => ({ etiqueta, porMaquina: { A: {}, B: { _pose: { x: i === 2 ? 1.9 : 3 } } } })));
  caso("entre máquinas · caché: la quieta no esconde a la que entra en p2", false, em(r).ok || !/^p2:/.test(em(r).ejemplos[0] || ""), det(em(r)));
  caso("entre máquinas · caché: las poses repetidas (p1, p3) no se rejuzgan", true, r.estadistica.pares[1] === 2, `${r.estadistica.pares[1]} pares reusados`);
  r = dos([{ etiqueta: "p0", porMaquina: { A: {} } }]);
  caso("una instancia sin valores en porMaquina (falta su id)", false, r.aprobado, det(r.lineas.rangos));
  r = dos([{ etiqueta: "p0", porMaquina: { A: {}, B: null } }]);
  caso("una instancia ausente (null) no se juzga", true, r.aprobado && r.maquinas[1].poses === 0, `B en ${r.maquinas[1].poses} poses`);
  { // una instancia sola: las ocho líneas dan lo mismo que juzgarFisica (con el brazo que se cruza, movida y girada)
    const Mb = bloque(true);
    const poses = [0, -30, -30, 20].map((brazo, i) => ({ etiqueta: `p${i}`, valores: { brazo, _pose: { x: 5 * i, rumbo: 25 * i } } }));
    const a = juzgarFisica(Mb, { poses });
    const b = juzgarConjunto([{ id: "U", equipo: "bloque", M: Mb }], { ciclo: poses.map((p) => ({ etiqueta: p.etiqueta, porMaquina: { U: p.valores } })) });
    const igual = LINEAS.every((n) => a.lineas[n].ok === b.lineas[n].ok && a.lineas[n].n === b.lineas[n].n);
    caso("una instancia: las ocho líneas como juzgarFisica (y la falla del brazo aparece)", true, igual && !a.lineas.interpenetracion.ok, `interpenetración ${a.lineas.interpenetracion.n} / ${b.lineas.interpenetracion.n} · ${b.lineas.interpenetracion.ejemplos[0] || ""}`);
  }
  { // roca con `libreCaja`: la cota (honesta) no puede esconder una máquina hundida
    const plano = { piso: () => 0, libre: (p) => p[1], libreCaja: (lo) => lo[1] };
    r = dos([{ etiqueta: "p0", porMaquina: { A: {}, B: { _pose: { x: 4, y: -0.2 } } } }], { terreno: plano });
    caso("roca con libreCaja: B hundida 20 cm en el piso", false, r.lineas.roca.ok, det(r.lineas.roca));
    r = dos([{ etiqueta: "p0", porMaquina: { A: {}, B: { _pose: { x: 4 } } } }], { terreno: plano });
    caso("roca con libreCaja: las dos sobre el piso", true, r.lineas.roca.ok, det(r.lineas.roca));
    r = dos([{ etiqueta: "p0", porMaquina: { A: {}, B: { _pose: { x: 4, y: -0.2 } } } }], { terreno: { ...plano, libreCaja: () => Infinity } });
    caso("roca con libreCaja mentirosa (+∞): la verificación la atrapa", false, r.lineas.roca.ok, det(r.lineas.roca));
  }
  { // llantas en `roca`: con las ruedas en el piso, la llanta registrada en M.ruedas usa ruedaHundida (6 cm); el resto, 1 cm
    const carro = (chasisY = 0.9) => {
      const Mc = maquina("carro");
      Mc.caja({ nombre: "chasis", grupo: "base", centro: [0, chasisY, 0], tam: [2, 0.6, 1] });
      Mc.rueda({ nombre: "rueda", grupo: "base", centro: [0, 0.5, 0.8], eje: [0, 0, 1], diametro: 1, ancho: 0.4 });
      return Mc;
    };
    const plano = { piso: () => 0, libre: (p) => p[1] };
    const en = (Mc, y, ruedasEnPiso) => juzgarFisica(Mc, { poses: [{ etiqueta: "p0", valores: { _pose: { y } }, ruedasEnPiso }], terreno: plano }).lineas;
    let l = en(carro(), -0.04);
    caso("llanta 4 cm hundida · roca (tolerancia de ruedaHundida)", true, l.roca.ok, det(l.roca));
    caso("llanta 4 cm hundida · ruedas", true, l.ruedas.ok, det(l.ruedas));
    l = en(carro(), -0.08);
    caso("llanta 8 cm hundida · roca", false, l.roca.ok, det(l.roca));
    caso("llanta 8 cm hundida · ruedas", false, l.ruedas.ok, det(l.ruedas));
    l = en(carro(0.26), 0);
    caso("chasis 4 cm dentro de la roca (rueda en el piso) · roca", false, l.roca.ok, det(l.roca));
    l = en(carro(), -0.04, false);
    caso("llanta 4 cm hundida con ruedasEnPiso: false · roca (1 cm, como cualquier pieza)", false, l.roca.ok, det(l.roca));
  }
  { // hilos: el mismo informe que de corrido (tramos de 4 poses en 3 hilos), y un hilo con otro ciclo no juzga
    const url = new URL("./planta-hilos.mjs", import.meta.url).href;
    const P = (await import(url)).pruebas(1);
    const a = juzgarConjunto(P.maquinas, { ciclo: P.ciclo, terreno: P.terreno });
    const firma = firmaCiclo(P.ciclo, P.maquinas);
    const b = await juzgarConjuntoHilos(P.maquinas, { modulo: url, paso: 1, poses: P.ciclo.length, firma, hilos: 3, tramo: 4 });
    const vista = (r) => JSON.stringify({ aprobado: r.aprobado, lineas: r.lineas, maquinas: r.maquinas, poses: r.poses });
    const ver = (r) => ["roca", "interpenetracion", "entre máquinas"].map((n) => `${n} ${r.lineas[n].n}: ${r.lineas[n].ejemplos[0] || "—"}`).join(" | ");
    caso("hilos (3 × tramos de 4): mismo informe que juzgarConjunto, con la pieza hundida, el choque y la interpenetración (gana p3)", true,
      vista(a) === vista(b) && !b.lineas.roca.ok && !b.lineas["entre máquinas"].ok && /p3:.*brazo/.test(b.lineas.interpenetracion.ejemplos.join(" ")), ver(b));
    let error = "";
    try { await juzgarConjuntoHilos(P.maquinas, { modulo: url, paso: 1, poses: P.ciclo.length, firma: "otra", hilos: 2, tramo: 4 }); } catch (e) { error = String(e.message); }
    caso("hilos: un hilo cuyo ciclo no es el del principal (firma distinta) no juzga", false, !error, error || "juzgó igual");
  }
  { // SAT completo (ronda 5): piezas giradas y caras inclinadas, sin pistas del marco
    const rot = (eje, g) => { const l = Math.hypot(...eje), [x, y, z] = eje.map((v) => v / l), c = Math.cos((g * Math.PI) / 180), sn = Math.sin((g * Math.PI) / 180), t = 1 - c;
      return [[t * x * x + c, t * x * y - sn * z, t * x * z + sn * y], [t * x * y + sn * z, t * y * y + c, t * y * z - sn * x], [t * x * z - sn * y, t * y * z + sn * x, t * z * z + c]]; };
    const ap = (R, v) => R.map((f) => f[0] * v[0] + f[1] * v[1] + f[2] * v[2]);
    const ejesDe = (R) => [0, 1, 2].map((k) => R.map((f) => f[k]));
    const cajaPts = (c, R, h) => { const o = []; for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) { const v = ap(R, [sx * h[0], sy * h[1], sz * h[2]]); o.push([c[0] + v[0], c[1] + v[1], c[2] + v[2]]); } return o; };
    const viejo = (A, B, pistas = []) => { const g = gjk(A, B); return g.margin >= -TOLERANCIAS.penetracion ? g.margin : separate(A, B, [...EJES, ...pistas]).margin; };
    const mm = (v) => `${(v * 1000).toFixed(1)} mm`;
    // dos cajas giradas 37° alrededor de [1, 2, 3], a lo largo de una normal de cara (no es eje del marco), con corrimiento lateral
    const R = rot([1, 2, 3], 37), [e0, e1, e2] = ejesDe(R), hA = [0.5, 0.3, 0.2], hB = [0.4, 0.25, 0.3];
    for (const [luz, debe] of [[0.01, true], [-0.01, false]]) {
      const d = hA[0] + hB[0] + luz, cB = [0, 1, 2].map((k) => e0[k] * d + e1[k] * 0.2 + e2[k] * 0.15);
      const A = cajaPts([0, 0, 0], R, hA), B = cajaPts(cB, R, hB), m = margen(A, B, TOLERANCIAS.penetracion);
      caso(`SAT · cajas giradas 37° (eje oblicuo), ${luz > 0 ? "separadas" : "solapadas"} 1 cm por una normal de cara`, debe, m >= -TOLERANCIAS.penetracion, `margen ${mm(m)} (vía vieja ${mm(viejo(A, B))})`);
    }
    { // placas giradas con 30 mm de luz real: la vía vieja (gjk + separate con los ejes del marco) daba −12 mm
      const prisma = (Rm, pol, L) => { const o = []; for (const z of [-L / 2, L / 2]) for (const [x, y] of pol) o.push(ap(Rm, [z, x, y])); return o; };
      const placa = [[-0.6, -0.02], [0.6, -0.02], [0.6, 0.02], [-0.6, 0.02]];
      const Ra = rot([-0.037845, -0.065297, -0.443688], 158.237088), Rb = rot([-0.025718, -0.24119, 0.320447], 92.885008);
      const d = [-0.132629, 0.396723, -0.908307], t = 0.892369;
      const A = prisma(Ra, placa, 0.9), B = prisma(Rb, placa, 0.9).map((q) => q.map((v, k) => v + d[k] * t));
      const pistas = [...ejesDe(Ra), ...ejesDe(Rb)], r0 = SAT.rescates, m = margen(A, B, TOLERANCIAS.penetracion, pistas), v = viejo(A, B, pistas), rescate = SAT.rescates > r0;
      caso("SAT · placas giradas con 30 mm de luz (la vía vieja marcaba choque)", true, m >= -TOLERANCIAS.penetracion && v < -TOLERANCIAS.penetracion && rescate, `margen ${mm(m)} · vía vieja ${mm(v)} · ${rescate ? "el SAT halló el eje separador" : "sin SAT"}`);
    }
    { // contra el SAT de 15 ejes de dos cajas orientadas (exacto): mismo veredicto, y la misma penetración si se cruzan
      let x = 7; const U = () => { x = (x * 16807) % 2147483647; return x / 2147483647; };
      let veredicto = 0, penet = 0, cruzan = 0; const N = 150;
      for (let i = 0; i < N; i++) {
        const Ma = rot([U() - 0.5, U() - 0.5, U() - 0.5], 360 * U()), Mb = rot([U() - 0.5, U() - 0.5, U() - 0.5], 360 * U());
        const ha = [0, 0, 0].map(() => (0.2 + U()) / 2), hb = [0, 0, 0].map(() => (0.2 + U()) / 2), cb = [0, 0, 0].map(() => U() * 1.6 - 0.8);
        const A = cajaPts([0, 0, 0], Ma, ha), B = cajaPts(cb, Mb, hb);
        const ej = [...ejesDe(Ma), ...ejesDe(Mb)]; for (const a of ejesDe(Ma)) for (const b of ejesDe(Mb)) ej.push([a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]);
        let ref = -Infinity;
        for (const n0 of ej) { const l = Math.hypot(...n0); if (l < 1e-6) continue; const n = n0.map((v) => v / l); ref = Math.max(ref, margenEn(n, A, B), margenEn(n.map((v) => -v), A, B)); }
        const sat = satCompleto(A, B, -Infinity);
        if ((sat >= 0) === (ref >= 0)) veredicto++;
        if (ref < 0) { cruzan++; if (Math.abs(sat - ref) < 1e-9) penet++; }
      }
      caso("SAT · igual al de 15 ejes de cajas orientadas (150 pares al azar)", true, veredicto === N && penet === cruzan, `veredicto ${veredicto}/${N} · penetración exacta ${penet}/${cruzan}`);
    }
  }
  return { aprobado: filas.every((f) => f.ok), filas };
}
