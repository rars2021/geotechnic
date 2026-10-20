// Geotechnic · procesos: mallas de perforación, secuencia de salida, líneas de tiempo y simulación de flota (dispatch).
// Todo es dato + lógica: el dibujo lo hacen las escenas con el kit.
import { azar, clamp } from "./nucleo.js";
import { tono } from "./estudio.js";

/**
 * Malla de perforación de un frente. Cada taladro: { id, z, y (m, origen en el centro del piso), grupo, retardo, cargado, diam (m) }.
 * MALLAS.casapalca4x4: malla real de 4,0 × 4,0 m, roca buena (RMR > 65), corte hexagonal con 4 alivios de 102 mm.
 * Posiciones leídas de la figura con ±0,1 m (Zanabria Mejía 2021, fig. 5; ver references/reglas-procesos.md).
 */
export const MALLAS = {
  casapalca4x4: {
    nombre: "Jumbo 4 × 4 m · roca buena (RMR > 65)",
    seccion: { ancho: 4.0, alto: 4.0 }, largo: 3.9, avance: 3.7, diam: 0.051, diamAlivio: 0.102,
    fuente: "Zanabria Mejía (2021), fig. 5 · Alpayana, Casapalca",
    taladros: (() => {
      const c = 1.95; // cota del centro del arranque
      const t = [];
      const add = (grupo, retardo, pts, cargado = true, diam = 0.051) => pts.forEach(([z, y]) => t.push({ grupo, retardo, z, y, cargado, diam }));
      add("alivio", 0, [[-0.12, c + 0.12], [0.12, c + 0.12], [-0.12, c - 0.12], [0.12, c - 0.12]], false, 0.102);
      add("arranque", 1, [[-0.3, c - 0.05]]); add("arranque", 2, [[0.3, c - 0.05]]); add("arranque", 3, [[0, c + 0.3]]);
      add("1ra ayuda", 4, [[-0.6, c], [0.6, c]]); add("1ra ayuda", 5, [[0, c + 0.62], [0, c - 0.62]]);
      add("2da ayuda", 6, [[-0.85, c + 0.62], [0.85, c - 0.62]]); add("2da ayuda", 7, [[0.85, c + 0.62], [-0.85, c - 0.62]]);
      add("3ra ayuda", 8, [[-1.5, c], [1.5, c], [0, c + 1.2], [0, c - 1.15]]);
      add("4ta ayuda", 9, [[-1.2, c + 1.05], [1.2, c + 1.05], [-1.2, c - 1.15], [1.2, c - 1.15]]);
      add("cuadrador", 10, [[-1.92, 0.85], [1.92, 0.85], [-1.92, 1.9], [1.92, 1.9]]);
      add("corona", 12, [[-1.92, 2.75], [-1.05, 3.6], [0, 3.88], [1.05, 3.6], [1.92, 2.75]]);
      add("corona", 12, [[-1.55, 3.25], [-0.52, 3.8], [0.52, 3.8], [1.55, 3.25]], false); // vacíos de control entre los cargados
      add("arrastre", 13, [[-1.88, 0.12], [-0.95, 0.1], [0, 0.1], [0.95, 0.1], [1.88, 0.12]]);
      return t.map((x, i) => ({ id: i + 1, ...x }));
    })(),
  },
};

/**
 * Colores por grupo de salida (kit/estudio.js → tokens `codigo` y `vacio`): el orden de salida se lee por claridad,
 * del arranque (más oscuro) al arrastre (más claro), con S ≤ 0,45; el alivio (vacío, no sale) lleva el token `vacio`.
 * Hue distinto entre vecinos para que la leyenda se distinga. El acento queda para la pieza señalada.
 */
export const COLORES_GRUPO = (() => {
  const c = tono("codigo"), orden = ["arranque", "1ra ayuda", "2da ayuda", "3ra ayuda", "4ta ayuda", "cuadrador", "corona", "arrastre"];
  return { alivio: tono("vacio"), ...Object.fromEntries(orden.map((g, i) => [g, c[i]])) };
})();

/** Orden de perforación para dos brazos: cada brazo toma su mitad (izquierda/derecha) de arriba hacia abajo. */
export function ordenPerforacion(malla, brazos = 2) {
  const ts = malla.taladros.slice();
  if (brazos === 1) return [ts.sort((a, b) => b.y - a.y || a.z - b.z)];
  const izq = ts.filter((t) => t.z < -0.01 || (Math.abs(t.z) <= 0.01 && t.y > 1.95)).sort((a, b) => b.y - a.y || a.z - b.z);
  const der = ts.filter((t) => !izq.includes(t)).sort((a, b) => b.y - a.y || b.z - a.z);
  return [izq, der];
}

/** Línea de tiempo con claves: [{ t, ...valores }] → valores interpolados (suavizado) en t. */
export function lineaTiempo(claves) {
  const T = claves[claves.length - 1].t;
  return {
    T,
    en(t) {
      let i = 0; while (i < claves.length - 2 && claves[i + 1].t <= t) i++;
      const a = claves[i], b = claves[i + 1];
      const u = clamp((t - a.t) / (b.t - a.t || 1)), s = u * u * (3 - 2 * u);
      const out = { i, u };
      for (const k of Object.keys(b)) {
        if (k === "t") continue;
        out[k] = typeof b[k] === "number" && typeof a[k] === "number" ? a[k] + (b[k] - a[k]) * s : (u < 0.5 ? a[k] : b[k]);
      }
      return out;
    },
  };
}


// ───────── simulación de eventos discretos para carguío y acarreo (dispatch) ─────────

/**
 * Muestreos con nombre de distribución, como en las tesis: { tipo: "lognormal" | "normal" | "normalTruncada" |
 * "triangular" | "exponencial" | "fijo", ... }. lognormal: media y desviación reales (no las del logaritmo).
 */
export function muestreador(r) {
  return (d) => {
    switch (d.tipo) {
      case "lognormal": return r.lognormal(d.media, d.desv);
      case "normal": return Math.max(d.min ?? 0, r.normal(d.media, d.desv));
      case "normalTruncada": { for (let i = 0; i < 50; i++) { const v = r.normal(d.media, d.desv); if (v >= d.min && v <= d.max) return v; } return d.media; }
      case "triangular": { const u = r(), { min: a, moda: c, max: b } = d, F = (c - a) / (b - a); return u < F ? a + Math.sqrt(u * (b - a) * (c - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - c)); }
      case "exponencial": return r.exponencial(d.media);
      default: return d.valor;
    }
  };
}

/** Media de una distribución de `muestreador` (para las estimaciones del despachador). */
export function mediaDist(d) {
  switch (d.tipo) {
    case "triangular": return (d.min + d.moda + d.max) / 3;
    case "fijo": return d.valor;
    default: return d.media;
  }
}

/** Estados del ciclo de un camión, en orden (Castillo Calderón 2014, fig. 3.1, agrupados). */
export const ESTADOS_FLOTA = ["viaja vacío", "cola", "cuadra", "carga", "viaja cargado", "cola descarga", "descarga"];

/**
 * Simula una flota pala–camión con eventos discretos (minutos). Las palas y los destinos atienden en orden de llegada
 * (FIFO); un destino puede tener varios puestos de descarga. El despachador decide la pala de cada camión al terminar
 * de descargar, con la política pedida:
 *  - "cerrado": cada camión vuelve siempre a su pala (asignacionFija);
 *  - "libre": va a la pala donde empezaría a cargar antes (llegada + espera prevista);
 *  - "condicional": vuelve a su pala salvo que la cola prevista al llegar supere `umbralCola` camiones y otra pala
 *    lo atienda antes.
 * La espera prevista la calcula como un despachador: los camiones ya asignados a esa pala (en servicio, en cola o en
 * camino) en orden de llegada, con el servicio medio (cuadrado + carga); no conoce los tiempos que aún no ocurrieron.
 *
 * Vías (opcional): una ruta puede ser { km, tramos: [{ id, largo, nodo }] } (tramos físicos del viaje, con su largo
 * dibujado). Nadie adelanta: en un tramo, cada camión entra y sale al menos `intervalo` min después del anterior (el
 * tiempo del viaje se reparte por largo; si lo frenan, va más lento o espera al final del tramo anterior). Un tramo con
 * `conflictos` (ids de tramos de otros carriles donde las huellas se tocan: cruces y uniones) no se ocupa a la vez que
 * ellos (± `intervaloNodo`); una zona de tramos seguidos con conflictos se cruza de corrido, y si hace falta el camión
 * espera antes de entrar (`nodo: true`: el tramo admite un camión a la vez). Con `despeje` (número de tramos) en la
 * ruta, la pala o el destino de donde sale no atienden al siguiente hasta que este dejó esos tramos (salió de la maniobra). Bloque: nadie entra a un tramo hasta que
 * el de adelante salió del tramo que le sigue (con tramos de largo ≥ largo del camión, nunca se tocan). Los viajes se planifican al salir, en
 * orden: el que sale después cede el paso a lo ya planificado. Con `despeje` (min), la pala o
 * el destino no atienden al siguiente hasta que el anterior se alejó de la maniobra.
 *
 * op: { palas: [{ id, carga: dist }], destinos: [{ id, descarga: dist, puestos: 1 }], rutas: { "a→b": km | { km, tramos } },
 *       asignacionFija: [palaId por camión] (define el número de camiones) o camiones: n,
 *       capacidad (t), llenado: dist, velCargado / velVacio: dist (km/h), cuadrado: dist (min),
 *       politica, umbralCola, duracion (min), semilla, destinoDe: (palaId, nCarga, camion) → destinoId,
 *       previo (min antes del 0 en que la flota sale escalonada de destinos[0], cada `escalon` min; lo previo no se
 *       muestra ni entra al resumen), intervalo 0,25, intervaloNodo 0,05, despeje { pala 0, destino 0 } }
 * Devuelve { eventos, ciclos, colas, resumen, duracion, camiones }:
 *  eventos: [{ t, dur, camion, estado, desde, hacia, tramos?: [{ id, t0, t1 }], puesto? }] por camión, en orden;
 *  ciclos: [{ camion, pala, destino, t0, t1, toneladas, esperaPala, esperaDestino, cambio }] (t0 sale vacío, t1 termina de descargar);
 *  colas: { [palaId | destinoId]: [[t, nEnCola, nEnServicio], …] } (escalones);
 *  resumen: t/h total, por pala y por destino, ciclo por pala (media, p10, p90), colas medias, utilización de palas, viajes.
 */
export function simularFlota(op) {
  const { palas, destinos, rutas, capacidad = 230, velCargado, velVacio, politica = "condicional", umbralCola = 1,
    duracion = 8 * 60, semilla = 1, cuadrado = { tipo: "fijo", valor: 0.7 }, llenado = { tipo: "fijo", valor: 1 },
    destinoDe = () => destinos[0].id, previo = 0, escalon = 1.5, intervalo = 0.25, intervaloNodo = 0.05 } = op;
  const despeje = { pala: 0, destino: 0, ...(op.despeje || {}) };
  const fija = op.asignacionFija || Array.from({ length: op.camiones ?? 8 }, (_, k) => palas[k % palas.length].id);
  const N = fija.length;
  const r = azar(semilla), m = muestreador(r);
  const ruta = (a, b) => {
    const v = rutas[`${a}→${b}`] ?? (typeof rutas[`${b}→${a}`] === "number" ? rutas[`${b}→${a}`] : undefined);
    if (v === undefined) throw new Error(`simularFlota: falta la ruta ${a}→${b}`);
    return typeof v === "number" ? { km: v, tramos: null } : v;
  };
  const medioDe = Object.fromEntries(palas.map((p) => [p.id, mediaDist(cuadrado) + mediaDist(p.carga)]));
  const vVmedia = mediaDist(velVacio);
  // agenda de eventos (n pequeño: búsqueda lineal del mínimo; desempate por orden de llegada a la agenda)
  const agenda = []; let sec = 0;
  const programar = (t, tipo, k, dato) => agenda.push({ t, tipo, k, dato, s: sec++ });
  const siguiente = () => { let i = 0; for (let j = 1; j < agenda.length; j++) if (agenda[j].t < agenda[i].t || (agenda[j].t === agenda[i].t && agenda[j].s < agenda[i].s)) i = j; return agenda.splice(i, 1)[0]; };
  const eventos = [], ciclos = [];
  const t00 = -previo;
  const colas = Object.fromEntries([...palas, ...destinos].map((x) => [x.id, [[t00, 0, 0]]]));
  const P = Object.fromEntries(palas.map((p) => [p.id, { fila: [], sirviendo: null, finServicio: 0, libreDesde: -Infinity, ocupada: 0, cargas: 0 }]));
  const D = Object.fromEntries(destinos.map((d) => [d.id, { fila: [], sirviendo: [], puestos: d.puestos ?? 1, libreDesde: Array(d.puestos ?? 1).fill(-Infinity) }]));
  const C = fija.map((p, k) => ({ k, propia: p, pala: null, eta: 0, llego: null, ciclo: null }));
  const marcar = (id, t) => { const x = P[id] || D[id]; const n = x.fila.length, s = P[id] ? (x.sirviendo !== null ? 1 : 0) : x.sirviendo.length; const L = colas[id]; if (L[L.length - 1][0] === t) L[L.length - 1] = [t, n, s]; else L.push([t, n, s]); };
  // tramos físicos: últimas entrada y salida planificadas
  const reg = new Map(), regDe = (id) => { if (!reg.has(id)) reg.set(id, { entra: -Infinity, sale: -Infinity, libre: -Infinity }); return reg.get(id); };
  /** Plan de un viaje por sus tramos desde t con duración libre T (min): llegada y [{ id, t0, t1 }]. */
  // ocupación de cada tramo: intervalos [entra, sale] (ordenados por entrada) para los conflictos
  const ocupa = (id) => regDe(id).ivs ??= [];
  const choca = (ids, a, b) => { // primer intervalo de un tramo en conflicto que se cruza con [a, b]: su fin, o null
    let fin = null;
    for (const id of ids) for (const [x, y] of reg.get(id)?.ivs || []) if (x < b && y > a) fin = Math.max(fin ?? -Infinity, y);
    return fin;
  };
  const planear = (rt, t, T) => {
    if (!rt.tramos) return { llegada: t + T, tramos: null };
    const Q = rt.tramos, n = Q.length, L = Q.reduce((s, q) => s + q.largo, 0), dur = Q.map((q) => (T * q.largo) / L), out = [];
    const conf = (q) => q.conflictos?.length || q.nodo;
    let entra = t, i = 0;
    while (i < n) {
      let j = i; if (conf(Q[i])) while (j + 1 < n && conf(Q[j + 1])) j++;
      if (j === i && !conf(Q[i])) { // tramo sin conflictos: en fila (puede ir más lento)
        const R = regDe(Q[i].id);
        entra = Math.max(entra, R.entra + intervalo, R.libre);
        if (out.length) out[out.length - 1].t1 = entra; // lo frenaron: llega al final del tramo anterior y espera ahí
        const sale = Math.max(entra + dur[i], R.sale + intervalo);
        out.push({ id: Q[i].id, t0: entra, t1: sale }); entra = sale; i++; continue;
      }
      // zona de conflicto [i, j]: se cruza de corrido; se busca la primera hora en que no coincide con nadie (la espera
      // es antes, en un tramo sin conflictos) y en que va detrás del anterior en cada tramo
      let t0 = entra;
      for (let it = 0; it < 400; it++) {
        let empuje = 0, a = t0;
        for (let k = i; k <= j; k++) {
          const R = regDe(Q[k].id), b = a + dur[k];
          empuje = Math.max(empuje, R.entra + intervalo - a, R.sale + intervalo - b, R.libre - a);
          const fin = choca(Q[k].conflictos || [], a - intervaloNodo, b + intervaloNodo);
          if (fin !== null) empuje = Math.max(empuje, fin + intervaloNodo - a + 1e-6);
          if (Q[k].nodo) empuje = Math.max(empuje, R.sale + intervaloNodo - a);
          a = b;
        }
        // al salir de la zona entra al tramo siguiente sin esperar (la espera nunca queda dentro de un cruce)
        if (j + 1 < n) { const R = regDe(Q[j + 1].id); empuje = Math.max(empuje, R.entra + intervalo - a, R.libre - a); }
        if (empuje <= 1e-9) break;
        t0 += empuje;
      }
      if (out.length) out[out.length - 1].t1 = t0;
      let a = t0;
      for (let k = i; k <= j; k++) { out.push({ id: Q[k].id, t0: a, t1: a + dur[k] }); a += dur[k]; }
      entra = a; i = j + 1;
    }
    // bloque: el siguiente no entra a un tramo hasta que este salió del tramo que sigue (un tramo libre entre los dos)
    out.forEach((q, k) => {
      const R = regDe(q.id); R.entra = Math.max(R.entra, q.t0); R.sale = Math.max(R.sale, q.t1);
      R.libre = Math.max(R.libre, k + 1 < out.length ? out[k + 1].t1 : q.t1);
      const iv = ocupa(q.id); iv.push([q.t0, q.t1]); if (iv.length > 64) iv.splice(0, iv.length - 64);
    });
    return { llegada: out[out.length - 1].t1, tramos: out };
  };
  /** Previsión del despachador para un camión que llegaría a la pala p en `eta`: espera (min) y camiones delante. */
  const prevision = (p, eta, ahora) => {
    const delante = C.filter((c) => c.pala === p && c.llego !== "servido" && c.llego !== "sirviendo").map((c) => ({ c, llegada: c.llego === null ? c.eta : c.llego })).filter((x) => x.llegada <= eta).sort((a, b) => a.llegada - b.llegada);
    let libreEn = Math.max(P[p].sirviendo !== null ? P[p].finServicio + despeje.pala : P[p].libreDesde, ahora);
    let enCola = 0;
    for (const x of delante) { const ini = Math.max(libreEn, x.llegada); if (ini > eta) enCola++; libreEn = ini + medioDe[p] + despeje.pala; }
    if (P[p].sirviendo !== null && P[p].finServicio > eta) enCola++;
    return { espera: Math.max(0, libreEn - eta), enCola };
  };
  const elegirPala = (c, desde, t) => {
    if (politica === "cerrado") return c.propia;
    const op2 = palas.map((p) => { const eta = t + (ruta(desde, p.id).km / vVmedia) * 60; const pr = prevision(p.id, eta, t); return { id: p.id, inicio: eta + pr.espera, enCola: pr.enCola }; });
    const mejor = op2.slice().sort((a, b) => a.inicio - b.inicio)[0];
    if (politica === "libre") return mejor.id;
    const propia = op2.find((x) => x.id === c.propia);
    return propia.enCola > umbralCola && mejor.inicio < propia.inicio ? mejor.id : c.propia;
  };
  // salida vacía: decide la pala y viaja por sus tramos
  const salir = (c, desde, t) => {
    const p = elegirPala(c, desde, t), rt = ruta(desde, p);
    const plan = planear(rt, t, (rt.km / m(velVacio)) * 60);
    c.pala = p; c.eta = plan.llegada; c.llego = null;
    c.ciclo = { camion: c.k, pala: p, destino: null, t0: t, desde, cambio: p !== c.propia };
    eventos.push({ t, dur: plan.llegada - t, camion: c.k, estado: "viaja vacío", desde, hacia: p, tramos: plan.tramos });
    programar(plan.llegada, "llegaPala", c.k);
    return plan;
  };
  const atenderPala = (p, t) => {
    const S = P[p];
    if (S.sirviendo !== null || !S.fila.length || t < S.libreDesde) return;
    const k = S.fila.shift(), c = C[k];
    if (t > c.llego) eventos.push({ t: c.llego, dur: t - c.llego, camion: k, estado: "cola", desde: p, hacia: p });
    c.ciclo.esperaPala = t - c.llego;
    const dq = m(cuadrado), dc = m(palas.find((x) => x.id === p).carga);
    eventos.push({ t, dur: dq, camion: k, estado: "cuadra", desde: p, hacia: p });
    eventos.push({ t: t + dq, dur: dc, camion: k, estado: "carga", desde: p, hacia: p, carga: S.cargas });
    S.sirviendo = k; S.finServicio = t + dq + dc; S.ocupada += Math.max(0, Math.min(duracion, t + dq + dc) - Math.max(0, t)); S.cargas++;
    c.llego = "sirviendo";
    marcar(p, t);
    programar(t + dq + dc, "finCarga", k, p);
  };
  const atenderDestino = (d, t) => {
    const S = D[d];
    for (;;) {
      if (!S.fila.length || S.sirviendo.length >= S.puestos) return;
      const ocupados = new Set(S.sirviendo.map((x) => x.puesto));
      let puesto = -1; for (let q = 0; q < S.puestos; q++) if (!ocupados.has(q) && t >= S.libreDesde[q]) { puesto = q; break; }
      if (puesto < 0) return;
      const k = S.fila.shift(), c = C[k];
      if (t > c.llegoD) eventos.push({ t: c.llegoD, dur: t - c.llegoD, camion: k, estado: "cola descarga", desde: d, hacia: d });
      c.ciclo.esperaDestino = t - c.llegoD;
      const dd = m(destinos.find((x) => x.id === d).descarga);
      eventos.push({ t, dur: dd, camion: k, estado: "descarga", desde: d, hacia: d, puesto });
      S.sirviendo.push({ k, puesto });
      marcar(d, t);
      programar(t + dd, "finDescarga", k, d);
    }
  };
  // arranque: la flota sale de destinos[0], escalonada, `previo` min antes del 0 (orden: por camión)
  for (const c of C) programar(t00 + escalon * c.k, "sale", c.k, destinos[0].id);
  let guard = 0;
  while (agenda.length && guard++ < 500000) {
    const ev = siguiente();
    if (ev.t >= duracion) break;
    const c = C[ev.k];
    if (ev.tipo === "sale") salir(c, ev.dato, ev.t);
    else if (ev.tipo === "llegaPala") { c.llego = ev.t; P[c.pala].fila.push(c.k); marcar(c.pala, ev.t); atenderPala(c.pala, ev.t); }
    else if (ev.tipo === "finCarga") {
      const p = ev.dato; P[p].sirviendo = null; c.llego = "servido"; marcar(p, ev.t);
      const dest = destinoDe(p, P[p].cargas - 1, c.k), rt = ruta(p, dest);
      const ton = capacidad * m(llenado);
      c.ciclo.destino = dest; c.ciclo.toneladas = ton;
      const plan = planear(rt, ev.t, (rt.km / m(velCargado)) * 60);
      eventos.push({ t: ev.t, dur: plan.llegada - ev.t, camion: c.k, estado: "viaja cargado", desde: p, hacia: dest, toneladas: ton, tramos: plan.tramos });
      programar(plan.llegada, "llegaDestino", c.k, dest);
      // la pala atiende al siguiente cuando este salió de la maniobra: `despeje` min o sus primeros `rt.despeje` tramos
      const libre = Math.max(ev.t + despeje.pala, rt.despeje && plan.tramos ? plan.tramos[Math.min(rt.despeje, plan.tramos.length) - 1].t1 : -Infinity);
      P[p].libreDesde = libre;
      if (libre > ev.t) programar(libre, "libre", -1, p); else atenderPala(p, ev.t);
    } else if (ev.tipo === "libre") { if (P[ev.dato]) atenderPala(ev.dato, ev.t); else atenderDestino(ev.dato, ev.t); }
    else if (ev.tipo === "llegaDestino") { c.llegoD = ev.t; D[ev.dato].fila.push(c.k); marcar(ev.dato, ev.t); atenderDestino(ev.dato, ev.t); }
    else if (ev.tipo === "finDescarga") {
      const d = ev.dato, S = D[d], q = S.sirviendo.find((x) => x.k === c.k);
      S.sirviendo = S.sirviendo.filter((x) => x.k !== c.k); marcar(d, ev.t);
      c.ciclo.t1 = ev.t; ciclos.push(c.ciclo);
      const plan = salir(c, d, ev.t), rt = ruta(d, c.pala);
      const libre = Math.max(ev.t + despeje.destino, rt.despeje && plan.tramos ? plan.tramos[Math.min(rt.despeje, plan.tramos.length) - 1].t1 : -Infinity);
      S.libreDesde[q.puesto] = libre;
      if (libre > ev.t) programar(libre, "libre", -1, d); else atenderDestino(d, ev.t);
    }
  }
  eventos.sort((a, b) => a.camion - b.camion || a.t - b.t);
  // resumen: solo el turno [0, duración]; el ciclo medio, con los ciclos que empiezan y terminan en él
  const horas = duracion / 60, enTurno = ciclos.filter((x) => x.t1 >= 0 && x.t1 <= duracion), validos = ciclos.filter((x) => x.t0 >= 0 && x.t1 <= duracion);
  const media = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);
  const ton = (f) => enTurno.filter(f).reduce((s, x) => s + x.toneladas, 0) / horas;
  const cicloPala = Object.fromEntries(palas.map((p) => { const v = validos.filter((x) => x.pala === p.id).map((x) => x.t1 - x.t0); return [p.id, { media: media(v), n: v.length, p10: cuantil(v, 0.1), p90: cuantil(v, 0.9) }]; }));
  const resumen = {
    toneladasHora: ton(() => true),
    porPala: Object.fromEntries(palas.map((p) => [p.id, ton((x) => x.pala === p.id)])),
    porDestino: Object.fromEntries(destinos.map((d) => [d.id, ton((x) => x.destino === d.id)])),
    cicloPala,
    colaPala: media(validos.map((x) => x.esperaPala ?? 0)), colaDestino: media(validos.map((x) => x.esperaDestino ?? 0)),
    colaPorPala: Object.fromEntries(palas.map((p) => [p.id, media(validos.filter((x) => x.pala === p.id).map((x) => x.esperaPala ?? 0))])),
    colaPorDestino: Object.fromEntries(destinos.map((d) => [d.id, media(validos.filter((x) => x.destino === d.id).map((x) => x.esperaDestino ?? 0))])),
    utilizacion: Object.fromEntries(palas.map((p) => [p.id, P[p.id].ocupada / duracion])),
    viajes: enTurno.length, cambios: validos.filter((x) => x.cambio).length,
    colaMedia: media(validos.map((x) => x.esperaPala ?? 0)), ciclos: validos.length,
  };
  return { eventos, ciclos, colas, resumen, duracion, previo, camiones: N };
}

/** Cuantil q (0..1) de una lista de números. */
export function cuantil(v, q) {
  if (!v.length) return NaN;
  const s = v.slice().sort((a, b) => a - b), i = (s.length - 1) * q, a = Math.floor(i);
  return s[a] + (s[Math.min(s.length - 1, a + 1)] - s[a]) * (i - a);
}

/** Estado de cada camión en el minuto t (para animar): { estado, desde, hacia, u (0..1 del tramo), u0, … } o null. */
export function estadoEn(eventos, camion, t) {
  let e = null;
  for (const x of eventos) { if (x.camion !== camion) continue; if (x.t <= t) e = x; else break; }
  if (!e) return null;
  return { ...e, u: clamp((t - e.t) / (e.dur || 1)) };
}
