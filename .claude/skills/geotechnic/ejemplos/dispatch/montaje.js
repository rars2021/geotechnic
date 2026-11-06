// Ejemplo dispatch · montaje (puro): tajo (motor B), flota de camiones y dos palas (motor A), simulación de la flota y
// posición de cada máquina en cada minuto. Lo usan la escena (página), la ficha (vistas) y el juez (Node): lo que se
// anima es exactamente lo que se juzga.
//
// Cómo se mueve un camión (references/reglas-procesos.md, dispatch):
//  - la simulación (kit/procesos.js → simularFlota) da, para cada camión, sus estados con hora de inicio y duración;
//  - cada viaje va por una ruta del terreno (terrenoTajo → rutas), partida en tramos físicos: nadie adelanta en un
//    tramo y los cruces y uniones de carriles («nodos») admiten un camión a la vez (lo resuelve la simulación);
//  - la cola es la fila sobre el carril, detrás del punto de espera (60 m de la pala, Castillo Calderón 2014);
//  - cuadrarse = avanzar de la espera al punto de maniobra y retroceder al cuadre; descargar = lo mismo en el destino y
//    levantar la tolva;
//  - la ruta lleva el origen del camión (entre ejes, como el terreno); el camión se asienta con sus seis ruedas.
import { terrenoTajo, asentar } from "../../kit/contrato.js";
import { simularFlota, estadoEn } from "../../kit/procesos.js";
import { modeloCamion } from "../../equipos/camion/modelo.js";
import { modeloPala, poseCarguioPala } from "../../equipos/pala/modelo.js";
import { clamp, lerp, suave } from "../../kit/nucleo.js";

/** Opciones del ejemplo (la ficha y la escena las leen). Tiempo en minutos desde las 07:00. */
export const OPCIONES_DISPATCH = {
  duracion: 480, previo: 120, tInicial: 45, porPala: 6, semilla: 7, hora0: 7,
  politicas: [["cerrado", 0], ["libre", 0], ["condicional", 0], ["condicional", 1], ["condicional", 2]],
  espera: 60,       // m: distancia de espera a la pala o al punto de descarga (Castillo Calderón 2014, 3.1.2)
  separacion: 18,   // m: de centro a centro de dos camiones en fila (12,9 m de largo + holgura; estimado)
  nodo: 16,         // m: radio de búsqueda de conflictos (2 × media diagonal de la huella)
  celda: 16,        // m: largo de las celdas de cada carril (bloque: con ≥ 13 m, dos camiones en fila nunca se tocan)
  huella: [13.6, 8.4, -0.15], // m: largo y ancho de la huella con holgura, y avance de su centro sobre el origen
  pases: 3,         // pases de pala por camión (estimado: 230 t / (56 m³ × 1,76 t/m³ × 0,9) ≈ 2,6)
  // fondo del cucharón al descargar: 9,0 m (a 8,2 m, al volver bajaba sobre el camión y rozaba el montón de la tolva;
  // a 9,6 m la pala choca consigo misma al girar cargada: los dos los encontró el juez)
  fondoCucharon: 9.0, tolvaAtras: 2.5, // m: fondo del cucharón sobre la tolva; centro de la tolva detrás del origen del camión
  // m: del eje de la pala al pie del montón. La pala baja los dientes al piso a ≈ 13 m de su eje: a 14,5 m el cucharón
  // ya no entra en el montón en todo su ciclo (lo midió el juez; 10 m, el valor del terreno, lo metía 20–37 cm)
  distanciaMonton: 14.8,
  intervalo: 0.1, intervaloNodo: 0.05, despeje: { pala: 0.1, destino: 0.1 }, // min (estimado)
  // km simulados por km dibujado (calibrado para los ciclos de la tesis): `comun` en la rampa y las vías que comparten
  // los dos tajos (todos van igual de rápido en pantalla) y `propio` en el acceso de cada tajo (su fondo)
  escala: { comun: 3.05, propio: { A: 3.05, B: 7.4 } },
};

/** Distribuciones de Yupanqui Sánchez (2025), tabla 7, pág. 43 (PDF 59). */
export const DIST_DISPATCH = {
  carga: { tipo: "lognormal", media: 3.8, desv: 0.6 },
  velCargado: { tipo: "triangular", min: 18, moda: 22, max: 25 },
  descarga: { tipo: "normal", media: 1.8, desv: 0.4, min: 0.5 },
  velVacio: { tipo: "triangular", min: 22, moda: 25, max: 28 },
  llenado: { tipo: "normalTruncada", media: 0.99, desv: 0.02, min: 0.93, max: 1.05 },
  cuadrado: { tipo: "fijo", valor: 0.7 }, // estimado (ninguna tesis del catálogo lo da aparte)
};

/** ¿Se tocan las huellas (rectángulos orientados, separación de ejes) de dos camiones con su origen en a y b? */
function chocanHuellas(a, da, b, db, [L, W, av]) {
  if (Math.abs(a[1] - b[1]) > 6) return false; // a distinta cota (rampa sobre el fondo)
  const ca = [a[0] + da[0] * av, a[2] + da[1] * av], cb = [b[0] + db[0] * av, b[2] + db[1] * av], d = [cb[0] - ca[0], cb[1] - ca[1]];
  const ejes = [da, [-da[1], da[0]], db, [-db[1], db[0]]];
  const radio = (u, dir) => (L / 2) * Math.abs(u[0] * dir[0] + u[1] * dir[1]) + (W / 2) * Math.abs(-u[0] * dir[1] + u[1] * dir[0]);
  return ejes.every((u) => Math.abs(d[0] * u[0] + d[1] * u[1]) < radio(u, da) + radio(u, db));
}

/** Red de transporte: tramos físicos de cada viaje, nodos (cruces y uniones) y puntos de espera. */
function redDispatch(ter, op) {
  const rutas = Object.values(ter.rutas), palas = ter.zonas.palas, destinos = ter.zonas.destinos;
  const d2 = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
  const viajes = {};
  // 1. punto de espera de cada ruta: a ≥ `espera` m del lugar y ≥ 25 m antes del punto de maniobra, donde la huella del
  // primero y de dos más en fila no toca la maniobra (retroceso al cuadre o a la descarga) ni la salida de ese lugar
  const nariz = (e) => { const a = (e.rumbo * Math.PI) / 180; return [Math.cos(a), -Math.sin(a)]; };
  const huellasDe = (r, s0, s1, paso = 2) => { const out = []; for (let s = s0; s <= s1; s += paso) { const e = r.en(s); out.push([e.p, nariz(e)]); } return out; };
  for (const r of rutas) {
    const rev = r.tramos.find((t) => t.reversa), sQ = rev ? rev.s0 : r.largo;
    const lugar = (palas.find((p) => p.id === r.a) || destinos.find((d) => d.id === r.a)).punto;
    const obst = [...huellasDe(r, sQ, r.largo), ...rutas.filter((x) => x.de === r.a).flatMap((x) => huellasDe(x, 0, Math.min(x.largo, 220)))];
    const libreEn = (s) => { if (s < 0) return true; const e = r.en(s), d = nariz(e); return obst.every(([q, dq]) => !chocanHuellas(e.p, d, q, dq, op.huella)); };
    let sW = sQ - 25;
    while (sW > 0 && (d2(r.en(sW).p, lugar) < op.espera || ![0, 1, 2].every((k) => libreEn(sW - k * op.separacion)))) sW -= 1;
    viajes[r.id] = { ruta: r, de: r.de, a: r.a, sQ, sW, fin: r.largo, cargado: palas.some((p) => p.id === r.de) };
  }
  // 2. tramos físicos del viaje [0, sW]: los del terreno, identificados por su geometría (los compartidos son el mismo)
  // (el mismo tramo de dos rutas puede diferir en centímetros en sus puntas: se reconoce con 1,5 m de tolerancia)
  const piezas = [], d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  for (const v of Object.values(viajes)) {
    const cortes = [0, ...v.ruta.tramos.map((t) => t.s1).filter((s) => s > 1 && s < v.sW - 1), v.sW];
    v.piezas = [];
    for (let i = 0; i < cortes.length - 1; i++) {
      const s0 = cortes[i], s1 = cortes[i + 1], a = v.ruta.en(s0).p, b = v.ruta.en(s1).p, mid = v.ruta.en((s0 + s1) / 2).p;
      let P = piezas.find((q) => Math.abs(q.largo - (s1 - s0)) < 2 && d3(q.a, a) < 1.5 && d3(q.b, b) < 1.5 && d3(q.mid, mid) < 1.5);
      if (!P) {
        const pts = [], dirs = []; for (let s = s0; s <= s1 + 1e-9; s += 1) { const e = v.ruta.en(Math.min(s, s1)); pts.push(e.p); dirs.push([e.dir[0], e.dir[2]].map((x, _, a) => x / (Math.hypot(a[0], a[1]) || 1))); }
        P = { id: `t${piezas.length}`, largo: s1 - s0, a, b, mid, pts, dirs, marca: new Int32Array(pts.length).fill(-1) };
        piezas.push(P);
      }
      v.piezas.push({ pieza: P, s0, s1 });
    }
  }
  // 3. celdas de `celda` m en cada carril y sus conflictos: celdas de carriles distintos donde dos huellas se tocan
  // (cruces, uniones, bifurcaciones). Junto a la unión de dos tramos seguidos de una ruta no hay conflicto: es la fila.
  const lista = piezas, juntas = [], C = op.celda;
  for (const v of Object.values(viajes)) for (let i = 0; i < v.piezas.length - 1; i++) juntas.push([v.piezas[i].pieza, v.piezas[i + 1].pieza, v.ruta.en(v.piezas[i].s1).p]);
  const seguidos = (A, B, a, b) => juntas.some(([x, y, J]) => ((x === A && y === B) || (x === B && y === A)) && d3(a, J) < 30 && d3(b, J) < 30);
  const lado = 16, grilla = new Map(), kc = (x, z) => `${Math.floor(x / lado)},${Math.floor(z / lado)}`;
  lista.forEach((P, ip) => { P.celdas = Math.max(1, Math.round(P.largo / C)); P.conf = Array.from({ length: P.celdas }, () => new Set()); P.pts.forEach((q, i) => { const k = kc(q[0], q[2]); if (!grilla.has(k)) grilla.set(k, []); grilla.get(k).push([ip, i]); }); });
  const celdaDe = (P, i) => `${P.id}.${Math.min(P.celdas - 1, Math.floor((i / P.largo) * P.celdas))}`;
  let pares = 0;
  lista.forEach((A, ia) => A.pts.forEach((q, i) => {
    const cx = Math.floor(q[0] / lado), cz = Math.floor(q[2] / lado);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const [ib, j] of grilla.get(`${cx + dx},${cz + dz}`) || []) {
      if (ib === ia) continue;
      const B = lista[ib], w = B.pts[j];
      if (d3(q, w) >= op.nodo || seguidos(A, B, q, w) || !chocanHuellas(q, A.dirs[i], w, B.dirs[j], op.huella)) continue;
      const ca = celdaDe(A, i), cb = celdaDe(B, j);
      A.conf[+ca.split(".")[1]].add(cb); pares++;
    }
  }));
  // 4. tramos de cada viaje para la simulación: las celdas de sus carriles, en coordenadas de la ruta
  for (const v of Object.values(viajes)) {
    v.subs = [];
    for (const { pieza: P, s0 } of v.piezas) for (let c = 0; c < P.celdas; c++) {
      const a = (c * P.largo) / P.celdas, b = ((c + 1) * P.largo) / P.celdas;
      v.subs.push({ id: `${P.id}.${c}`, s0: s0 + a, s1: s0 + b, conflictos: [...P.conf[c]] });
    }
  }
  // 5. despeje: cuántos tramos debe dejar atrás el que sale de un lugar para que el siguiente pueda maniobrar ahí (su
  // huella ya no toca la maniobra de llegada ni la fila de espera)
  for (const v of Object.values(viajes)) {
    const obst = Object.values(viajes).filter((w) => w.a === v.de).flatMap((w) => huellasDe(w.ruta, w.sW - 2 * op.separacion, w.fin));
    const libreEn = (x) => { const e = v.ruta.en(x), d = nariz(e); return obst.every(([q, dq]) => !chocanHuellas(e.p, d, q, dq, op.huella)); };
    let sc = 0; while (sc < v.sW && ![0, 10, 20, 30, 40].every((k) => libreEn(sc + k))) sc += 2;
    v.sDespeje = sc; v.despeje = Math.max(1, v.subs.findIndex((q) => q.s1 >= sc) + 1);
  }
  const enConflicto = lista.reduce((n, P) => n + P.conf.filter((x) => x.size).length, 0);
  return { viajes, piezas: lista, celdasEnConflicto: enConflicto, pares };

}

export function montajeDispatch(opIn = {}) {
  const op = { ...OPCIONES_DISPATCH, ...opIn };
  const ter = terrenoTajo({ palas: [{ id: "A", lambda: 1.62, distancia: op.distanciaMonton }, { id: "B", lambda: 2.5, distancia: op.distanciaMonton }] });
  const Mc = modeloCamion({ carga: true });
  const Mp = modeloPala();
  const red = redDispatch(ter, op);
  const V = red.viajes, palas = ter.zonas.palas, destinos = ter.zonas.destinos;
  const fija = [...Array(op.porPala).fill("A"), ...Array(op.porPala).fill("B")];
  const N = fija.length;
  const nombres = fija.map((p, k) => `camión ${k + 1}`);
  // km simulados: cada tramo dibujado × su escala (el mapa no está a escala en distancia: ver la ficha). Un tramo es
  // «propio» de un tajo si solo lo usan los viajes de su pala
  const palasDe = new Map();
  for (const v of Object.values(V)) for (const q of v.piezas) { const p = v.cargado ? v.de : v.a; if (!palasDe.has(q.pieza)) palasDe.set(q.pieza, new Set()); palasDe.get(q.pieza).add(p); }
  const escalaPieza = (P) => { const ps = palasDe.get(P); return ps && ps.size === 1 ? op.escala.propio[[...ps][0]] : op.escala.comun; };
  for (const v of Object.values(V)) for (const s of v.subs) s.escala = escalaPieza(v.piezas.find((q) => s.s0 >= q.s0 - 1e-6 && s.s0 < q.s1).pieza);
  const rutasSim = Object.fromEntries(Object.values(V).map((v) => [`${v.de}→${v.a}`, { km: v.subs.reduce((a, s) => a + (s.s1 - s.s0) * s.escala, 0) / 1000, tramos: v.subs.map((s) => ({ id: s.id, largo: (s.s1 - s.s0) * s.escala, conflictos: s.conflictos })), despeje: v.despeje }]));
  // km de todo el viaje (con la maniobra, a escala común) para la ficha
  const km = Object.fromEntries(Object.values(V).map((v) => [`${v.de}→${v.a}`, rutasSim[`${v.de}→${v.a}`].km + ((v.fin - v.sW) * op.escala.comun) / 1000]));
  // destino de cada carga: A siempre a la chancadora; B, 2 de cada 3 a la chancadora (ilustrativo)
  const destinoDe = (p, n) => (p === "B" && n % 3 === 2 ? "botadero" : "chancadora");
  const cache = new Map();
  /** Simulación de un turno con una política (se guarda: cambiar de política no vuelve a calcular lo ya visto). */
  function simular(politica = "cerrado", umbral = 0) {
    const k = `${politica}|${umbral}`;
    if (!cache.has(k)) {
      const sim = simularFlota({
        palas: palas.map((p) => ({ id: p.id, carga: DIST_DISPATCH.carga })),
        destinos: destinos.map((d) => ({ id: d.id, descarga: DIST_DISPATCH.descarga, puestos: 1 })),
        rutas: rutasSim, asignacionFija: fija, capacidad: 230, llenado: DIST_DISPATCH.llenado,
        velCargado: DIST_DISPATCH.velCargado, velVacio: DIST_DISPATCH.velVacio, cuadrado: DIST_DISPATCH.cuadrado,
        politica, umbralCola: umbral, duracion: op.duracion, previo: op.previo, escalon: 2.5, semilla: op.semilla,
        intervalo: op.intervalo, intervaloNodo: op.intervaloNodo, despeje: op.despeje, destinoDe,
      });
      sim.porCamion = Array.from({ length: N }, (_, c) => sim.eventos.filter((e) => e.camion === c));
      cache.set(k, sim);
    }
    return cache.get(k);
  }
  // ── estado de un camión en t: viaje, s sobre la ruta, tolva, carga
  const evEn = (lista, t) => { let a = 0, b = lista.length - 1; if (b < 0 || lista[0].t > t) return null; while (a < b) { const m = (a + b + 1) >> 1; if (lista[m].t <= t) a = m; else b = m - 1; } return lista[a]; };
  const fase2 = (u, f = 0.5) => (u < f ? { tramo: 0, u: suave(0, 1, u / f) } : { tramo: 1, u: suave(0, 1, (u - f) / (1 - f)) });
  function nominal(sim, k, t) {
    const e = evEn(sim.porCamion[k], t);
    if (!e) return null;
    const u = clamp((t - e.t) / (e.dur || 1));
    let v, s, tolva = 0, carga = 0, enCarril = true;
    if (e.estado === "viaja vacío" || e.estado === "viaja cargado") {
      v = V[`${e.desde}→${e.hacia}`]; s = 0;
      for (let i = 0; i < e.tramos.length; i++) { const q = e.tramos[i], sb = v.subs[i]; if (t < q.t0) break; s = t >= q.t1 ? sb.s1 : lerp(sb.s0, sb.s1, (t - q.t0) / (q.t1 - q.t0 || 1)); }
      carga = e.estado === "viaja cargado" ? 1 : 0;
    } else if (e.estado === "cola") { v = V[`${previo(sim, k, e).desde}→${e.desde}`]; s = v.sW; }
    else if (e.estado === "cola descarga") { v = V[`${previo(sim, k, e).desde}→${e.desde}`]; s = v.sW; carga = 1; }
    else if (e.estado === "cuadra") {
      v = V[`${previo(sim, k, e, ["viaja vacío"]).desde}→${e.desde}`]; enCarril = false;
      const f = fase2(u, (v.sQ - v.sW) / (v.fin - v.sW)); s = f.tramo === 0 ? lerp(v.sW, v.sQ, f.u) : lerp(v.sQ, v.fin, f.u);
    } else if (e.estado === "carga") {
      v = V[`${previo(sim, k, e, ["viaja vacío"]).desde}→${e.desde}`]; s = v.fin; enCarril = false;
      carga = cargaPases(u); // la carga crece pase a pase
    } else { // descarga: maniobra (≈ 40 %, ≥ 0,35 min) y volteo
      v = V[`${previo(sim, k, e, ["viaja cargado"]).desde}→${e.desde}`]; enCarril = false;
      const tm = clamp(0.4 * e.dur, 0.35, 0.8), um = clamp((t - e.t) / tm);
      const f = fase2(um, (v.sQ - v.sW) / (v.fin - v.sW)); s = um < 1 ? (f.tramo === 0 ? lerp(v.sW, v.sQ, f.u) : lerp(v.sQ, v.fin, f.u)) : v.fin;
      const ut = clamp((t - e.t - tm) / Math.max(0.05, e.dur - tm));
      tolva = ut < 0.4 ? suave(0, 1, ut / 0.4) : ut < 0.6 ? 1 : 1 - suave(0, 1, (ut - 0.6) / 0.4);
      carga = ut < 0.5 ? 1 : 0;
    }
    return { e, v, s, tolva, carga, enCarril, estado: e.estado };
  }
  /** Evento de viaje anterior a `e` (para saber de dónde venía). */
  function previo(sim, k, e, estados = ["viaja vacío", "viaja cargado"]) {
    const L = sim.porCamion[k]; let i = L.indexOf(e);
    while (--i >= 0) if (estados.includes(L[i].estado)) return L[i];
    throw new Error(`dispatch: camión ${k + 1} sin viaje antes de «${e.estado}» en ${e.t.toFixed(2)}`);
  }
  // ── fila: nadie se acerca a menos de `separacion` del de adelante en su carril (posición continua: la simulación
  // ya garantiza el orden, esto solo detiene al de atrás)
  function enFila(ns) {
    const porPieza = new Map(), sigDe = new Map();
    for (const n of ns) {
      if (!n) continue;
      const v = n.v;
      // carril: el tramo físico donde está (o el último antes de la espera si ya maniobra o está en cola)
      let i = v.piezas.findIndex((q) => n.s >= q.s0 - 1e-6 && n.s <= q.s1 + 1e-6);
      if (!n.enCarril || n.s >= v.sW - 1e-6) i = v.piezas.length - 1;
      const q = v.piezas[i];
      n.pieza = q.pieza; n.c = n.s - q.s0; n.i = i;
      if (!porPieza.has(q.pieza)) porPieza.set(q.pieza, []);
      porPieza.get(q.pieza).push(n);
      sigDe.set(n, v.piezas[i + 1]?.pieza || null);
    }
    for (let pasada = 0; pasada < 3; pasada++) {
      for (const [P, L] of porPieza) {
        L.sort((a, b) => b.c - a.c);
        for (let j = 1; j < L.length; j++) if (L[j].enCarril && L[j].c > L[j - 1].c - op.separacion) L[j].c = L[j - 1].c - op.separacion;
      }
      for (const [n, Y] of sigDe) {
        if (!Y || !n.enCarril || !porPieza.has(Y)) continue;
        const atras = Math.min(...porPieza.get(Y).map((m) => m.c));
        const lim = n.pieza.largo + atras - op.separacion;
        if (n.c > lim) n.c = lim;
      }
    }
    for (const n of ns) if (n && n.enCarril) n.s = Math.max(n.v.piezas[n.i].s0 - 0, n.v.piezas[n.i].s0 + n.c);
  }
  // ── pose de cada camión: origen sobre la ruta; asentado en el piso con sus ruedas
  const ejes = Mc.dims.ejes;
  function poseCamion(n) {
    const r = n.v.ruta, a = r.en(n.s);
    // dirección: curvatura de la trayectoria (Ackermann aproximado, giro + = izquierda)
    const d = 4, b0 = r.en(Math.max(0, n.s - d)), b1 = r.en(Math.min(r.largo, n.s + d));
    let dth = (((b1.rumbo - b0.rumbo) % 360) + 540) % 360 - 180; if (a.reversa) dth = -dth;
    const giro = clamp((Math.atan((ejes * (dth * Math.PI) / 180) / (2 * d)) * 180) / Math.PI, -30, 30);
    const valores = { tolva: n.tolva, giro, rodar: n.s * (a.reversa ? -1 : 1) };
    valores._pose = asentar(Mc, valores, ter, { x: a.p[0], z: a.p[2], rumbo: a.rumbo });
    return valores;
  }
  // ── palas: en su punto del fondo, mirando al montón. Cada carga son `pases` ciclos de poseCarguioPala repartidos en
  // el tiempo de carga de la simulación; el cucharón descarga sobre el cuadre (giro y radio medidos desde la pala) y
  // los dientes suben por la cara del montón (pie a `distancia` m, talud de reposo)
  const conf = Object.fromEntries(palas.map((p) => {
    // centro de la tolva: `tolvaAtras` m detrás del origen del camión cuadrado
    const rc = (p.cuadre.rumbo * Math.PI) / 180, c = [p.cuadre.punto[0] - Math.cos(rc) * op.tolvaAtras, 0, p.cuadre.punto[2] + Math.sin(rc) * op.tolvaAtras];
    const dx = c[0] - p.punto[0], dz = c[2] - p.punto[2];
    let g = (Math.atan2(-dz, dx) * 180) / Math.PI - p.rumbo; g = ((g % 360) + 540) % 360 - 180;
    return [p.id, { M: Mp, giroCarga: 0, giroDescarga: g, descarga: { radio: Math.hypot(dx, dz), fondo: op.fondoCucharon } }];
  }));
  const poseBasePala = (p) => ({ x: p.punto[0], y: ter.piso(p.punto[0], p.punto[2]), z: p.punto[2], rumbo: p.rumbo, cabeceo: 0, alabeo: 0 });
  function valoresPala(sim, p, t) {
    let e = null;
    for (const L of sim.porCamion) { const x = evEn(L, t); if (x && x.estado === "carga" && x.desde === p.id && t <= x.t + x.dur) { e = x; break; } }
    let v;
    if (e) { const u = clamp((t - e.t) / e.dur) * op.pases, i = Math.min(op.pases - 1, Math.floor(u)); v = poseCarguioPala(u - i, conf[p.id]); v.pase = i; }
    else v = poseCarguioPala(0, conf[p.id]);
    const valores = { giro: v.giro, izaje: v.izaje, empuje: v.empuje, compuerta: v.compuerta };
    valores._pose = poseBasePala(p);
    return { valores, fase: e ? v.fase : "Espera", pase: v.pase };
  }
  /** Carga en la tolva (0..1) durante la carga: un tercio por pase, al descargar el cucharón (fase 0,57–0,70). */
  const cargaPases = (u) => { const x = clamp(u) * op.pases, i = Math.floor(x), f = x - i; return Math.min(1, (i + clamp((f - 0.57) / 0.13)) / op.pases); };
  /** Estado de toda la escena en t (min desde las 07:00) con una política. */
  function estado(t, politica = "cerrado", umbral = 0) {
    const sim = simular(politica, umbral);
    const ns = Array.from({ length: N }, (_, k) => nominal(sim, k, t));
    enFila(ns);
    const camiones = ns.map((n, k) => ({ k, t, nombre: nombres[k], estado: n.estado, carga: n.carga, tolva: n.tolva, viaje: `${n.v.de}→${n.v.a}`, s: n.s, valores: poseCamion(n), evento: n.e }));
    const pls = palas.map((p) => ({ id: p.id, ...valoresPala(sim, p, t) }));
    return { t, sim, camiones, palas: pls };
  }
  const largoDibujado = (de, a) => V[`${de}→${a}`].ruta.largo;
  const rutasDibujadas = [["A", "chancadora"], ["B", "chancadora"], ["B", "botadero"]].map(([p, d]) => ({ nombre: `${p}→${d}`, largo: largoDibujado(p, d), km: km[`${p}→${d}`] }));
  // ── vistas de las fotos (las calcula la ficha en Node; la escena las usa con igualarVista)
  const vistas = vistasDispatch({ ter, estado, op, palas, V });
  return { op, ter, Mc, Mp, red, V, N, nombres, fija, simular, estado, km, rutasDibujadas, vistas, palas, destinos, poseBasePala, confPalas: conf };
}

/** Vistas para comparar con las fotos abiertas: buscan el minuto en que un camión hace lo de la foto y ponen la cámara
 * respecto de su rumbo (beta: 0 = de frente, 90 = a su izquierda, 180 = detrás) o desde el vacío del tajo. */
function vistasDispatch({ ter, estado, op, palas, V }) {
  const busca = (pred, desde = 20) => { for (let t = desde; t < op.duracion; t += 0.5) { const s = estado(t); const c = s.camiones.find((x) => pred(x, s)); if (c) return { t, c }; } throw new Error("dispatch: no hay minuto para una vista"); };
  const r1 = (v) => +v.toFixed(2);
  const vista = (t, objetivo, az, el, dist, recorte) => ({ t: r1(t), objetivo: objetivo.map(r1), az: r1(((az % 360) + 360) % 360), el, dist, anim: false, recorte });
  const alrededor = (c, beta, el, dist, dy, recorte) => {
    const p = c.valores._pose, a = ((p.rumbo + beta) * Math.PI) / 180, o = [Math.cos(a), -Math.sin(a)];
    return vista(c.t, [p.x, p.y + dy, p.z], (Math.atan2(o[0], -o[1]) * 180) / Math.PI, el, dist, recorte);
  };
  const desdeVacio = (c, el, dist, dy, recorte, giro = 0) => {
    const p = c.valores._pose, cx = (ter.caja.min[0] + ter.caja.max[0]) / 2, cz = (ter.caja.min[2] + ter.caja.max[2]) / 2;
    const az = (Math.atan2(cx - p.x, -(cz - p.z)) * 180) / Math.PI + giro;
    return vista(c.t, [p.x, p.y + dy, p.z], az, el, dist, recorte);
  };
  const conT = (r) => ({ ...r.c, t: r.t });
  const pA = palas.find((p) => p.id === "A");
  const sRampa = (c) => { const v = V[c.viaje], tr = v.ruta.tramos.find((x) => x.tipo === "rampa"); return tr && c.s > tr.s0 + 150 && c.s < tr.s1 - 150; };
  const rampa = conT(busca((c) => c.estado === "viaja cargado" && sRampa(c), 60));
  const banco = conT(busca((c) => c.estado === "viaja vacío" && sRampa(c), 90));
  const cargado = conT(busca((c) => c.estado === "viaja cargado" && sRampa(c), 120));
  const meseta = conT(busca((c) => c.estado === "viaja cargado" && V[c.viaje].ruta.tramos.some((x) => x.tipo === "via" && c.s > x.s0 + 40 && c.s < x.s1 - 60), 150));
  const desc = conT(busca((c) => c.estado === "descarga" && c.tolva > 0.95 && c.viaje.endsWith("chancadora"), 60));
  return {
    inicial: vista(op.tInicial, [-50, -84, 5], 150, 55, 260),
    palaLejos: vista(60, [pA.cuadre.punto[0], pA.cuadre.punto[1] + 6, pA.cuadre.punto[2]], 330, 32, 220, [0.3, 0.3, 0.75, 0.75]),
    rampas: desdeVacio(rampa, 22, 420, 3, [0.1, 0.25, 0.9, 0.7], 25),
    banco: desdeVacio(banco, 36, 160, 3, [0.1, 0.3, 0.9, 0.75], -15),
    cargado: desdeVacio(cargado, 8, 27, 3, [0.08, 0.15, 0.92, 0.95], 35),
    via: desdeVacio(cargado, 14, 210, 3, [0.3, 0.35, 0.7, 0.65], 10),
    perfil: alrededor(meseta, -90, 3, 46, 3, [0.15, 0.3, 0.85, 0.75]),
    descarga: alrededor(desc, -150, 2, 32, 5, [0.0, 0.0, 1.0, 0.95]),
  };
}

/** Lo que juzga el juez: todas las políticas del selector, muestreadas cada `paso × 10` min, al empezar cada estado y
 * dentro de cada maniobra (cuadre y descarga). */
export function pruebasDispatch(paso = 0.1) {
  const m = montajeDispatch();
  const dt = paso * 10;
  const ciclo = [];
  const vistas = new Set(); // dos políticas con la misma simulación (p. ej. condicional 2 = cerrado) se juzgan una vez
  for (const [pol, um] of m.op.politicas) {
    const sim = m.simular(pol, um), firma = sim.eventos.map((e) => `${e.camion}${e.estado}${e.t.toFixed(4)}`).join("|"), ts = new Set();
    if (vistas.has(firma)) continue;
    vistas.add(firma);
    for (let t = 0; t < m.op.duracion; t += dt) ts.add(+t.toFixed(3));
    for (const e of sim.eventos) for (const x of [e.t + 0.02, ...(["cuadra", "descarga"].includes(e.estado) ? [e.t + e.dur * 0.3, e.t + e.dur * 0.6] : [])]) if (x >= 0 && x < m.op.duracion) ts.add(+x.toFixed(3));
    for (const t of [...ts].sort((a, b) => a - b)) {
      const s = m.estado(t, pol, um), porMaquina = {};
      for (const c of s.camiones) porMaquina[c.nombre] = c.valores;
      for (const p of s.palas) porMaquina[`pala ${p.id}`] = p.valores;
      ciclo.push({ etiqueta: `${pol}${pol === "condicional" ? " " + um : ""} · ${horaDispatchJuez(t)}`, porMaquina });
    }
  }
  const maquinas = [...m.nombres.map((id) => ({ id, equipo: "camion", M: m.Mc })), ...m.palas.map((p) => ({ id: `pala ${p.id}`, equipo: "pala", M: m.Mp }))];
  const rangoDe = (M) => (M.muestrasRango || [{}]).map((v, i) => ({ etiqueta: `rango ${i}`, valores: v }));
  return {
    montaje: m, terreno: m.ter, M: m.Mc, rango: rangoDe(m.Mc),
    modelos: { camion: m.Mc, pala: m.Mp }, rangos: { camion: rangoDe(m.Mc), pala: rangoDe(m.Mp) },
    maquinas, ciclo,
  };
}
const horaDispatchJuez = (t) => { const x = 7 * 60 + t; return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(Math.floor(x % 60)).padStart(2, "0")}:${String(Math.round((x % 1) * 60)).padStart(2, "0")}`; };

/** Nombre común que busca el juez. */
export const pruebas = pruebasDispatch;
