// Geotechnic · procesos: mallas de perforación, secuencia de salida, líneas de tiempo y simulación de flota (dispatch).
// Todo es dato + lógica: el dibujo lo hacen las escenas con el kit.
import { azar, clamp } from "./nucleo.js";

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

/** Colores por grupo (los de la figura original, para que se reconozcan). */
export const COLORES_GRUPO = {
  alivio: "#3b6fd1", arranque: "#d8342a", "1ra ayuda": "#2fae3b", "2da ayuda": "#9b3fb8", "3ra ayuda": "#e2b31f", "4ta ayuda": "#2e5bd8",
  cuadrador: "#e07b2a", corona: "#58b7d6", arrastre: "#333333",
};

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

/** Muestreos con nombre de distribución, como en las tesis: { tipo: "lognormal" | "normal" | "triangular" | "exponencial" | "fijo", ... } */
export function muestreador(r) {
  return (d) => {
    switch (d.tipo) {
      case "lognormal": return r.lognormal(d.media, d.desv);
      case "normal": return Math.max(d.min ?? 0, r.normal(d.media, d.desv));
      case "triangular": { const u = r(), { min: a, moda: c, max: b } = d, F = (c - a) / (b - a); return u < F ? a + Math.sqrt(u * (b - a) * (c - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - c)); }
      case "exponencial": return r.exponencial(d.media);
      default: return d.valor;
    }
  };
}

/**
 * Simula una flota pala-camión. Tiempo en minutos.
 * op: { palas: [{ id, carga: dist (min) }], destinos: [{ id, descarga: dist }], rutas: { "pala→destino": km }, camiones: n,
 *       capacidad (t), velCargado: dist (km/h), velVacio: dist (km/h), politica: "cerrado" | "libre" | "condicional",
 *       asignacionFija: { camion: palaId }, umbralCola, duracion (min), semilla }
 * Devuelve { eventos: [{ t, camion, estado, desde, hacia, dur }], resumen }.
 * Estados: "viaja vacío", "cola", "cuadra", "carga", "viaja cargado", "cola descarga", "descarga".
 */
export function simularFlota(op) {
  const { palas, destinos, rutas, camiones = 8, capacidad = 230, velCargado, velVacio, politica = "condicional", umbralCola = 2,
    duracion = 8 * 60, semilla = 1, cuadrado = { tipo: "fijo", valor: 0.7 }, destinoDe = () => destinos[0].id } = op;
  const r = azar(semilla), m = muestreador(r);
  const eventos = [];
  const libre = Object.fromEntries(palas.map((p) => [p.id, 0]));   // minuto en que la pala queda libre
  const colaN = Object.fromEntries(palas.map((p) => [p.id, 0]));
  const libreD = Object.fromEntries(destinos.map((d) => [d.id, 0]));
  const ton = Object.fromEntries(palas.map((p) => [p.id, 0]));
  const esperas = [];
  const km = (a, b) => rutas[`${a}→${b}`] ?? rutas[`${b}→${a}`];
  const elegirPala = (k, desde, t) => {
    if (politica === "cerrado") return op.asignacionFija?.[k] ?? palas[k % palas.length].id;
    // libre: menor tiempo esperado de llegada + espera; condicional: igual, pero solo cambia si la cola de su pala supera el umbral
    const costo = (p) => { const viaje = (km(desde, p.id) / (velVacio.moda ?? velVacio.media ?? 25)) * 60; return Math.max(t + viaje, libre[p.id]) - t; };
    const mejor = palas.slice().sort((a, b) => costo(a) - costo(b))[0];
    if (politica === "condicional") { const propia = op.asignacionFija?.[k] ?? palas[k % palas.length].id; return colaN[propia] > umbralCola ? mejor.id : propia; }
    return mejor.id;
  };
  // cada camión empieza en el destino 0, escalonado
  const flota = Array.from({ length: camiones }, (_, k) => ({ k, t: k * 1.5, en: destinos[0].id }));
  let guard = 0;
  while (flota.some((c) => c.t < duracion) && guard++ < 100000) {
    const c = flota.reduce((a, b) => (a.t < b.t ? a : b));
    const p = elegirPala(c.k, c.en, c.t);
    const vV = m(velVacio), dV = km(c.en, p) / vV * 60;
    eventos.push({ t: c.t, camion: c.k, estado: "viaja vacío", desde: c.en, hacia: p, dur: dV });
    let t = c.t + dV;
    colaN[p]++;
    const espera = Math.max(0, libre[p] - t);
    if (espera > 0) eventos.push({ t, camion: c.k, estado: "cola", desde: p, hacia: p, dur: espera });
    esperas.push(espera);
    t += espera;
    const dq = m(cuadrado); eventos.push({ t, camion: c.k, estado: "cuadra", desde: p, hacia: p, dur: dq }); t += dq;
    const pala = palas.find((x) => x.id === p);
    const dc = m(pala.carga); eventos.push({ t, camion: c.k, estado: "carga", desde: p, hacia: p, dur: dc }); t += dc;
    libre[p] = t; colaN[p]--;
    const dest = destinoDe(p, c.k);
    const vC = m(velCargado), dC = km(p, dest) / vC * 60;
    eventos.push({ t, camion: c.k, estado: "viaja cargado", desde: p, hacia: dest, dur: dC }); t += dC;
    const eD = Math.max(0, libreD[dest] - t);
    if (eD > 0) { eventos.push({ t, camion: c.k, estado: "cola descarga", desde: dest, hacia: dest, dur: eD }); t += eD; }
    const dd = m(destinos.find((x) => x.id === dest).descarga); eventos.push({ t, camion: c.k, estado: "descarga", desde: dest, hacia: dest, dur: dd }); t += dd;
    libreD[dest] = t;
    ton[p] += capacidad * clamp(r.normal(0.99, 0.02), 0.9, 1.05);
    c.t = t; c.en = dest;
  }
  const horas = duracion / 60;
  const resumen = {
    toneladasHora: Object.values(ton).reduce((a, b) => a + b, 0) / horas,
    porPala: Object.fromEntries(Object.entries(ton).map(([k, v]) => [k, v / horas])),
    colaMedia: esperas.reduce((a, b) => a + b, 0) / Math.max(1, esperas.length),
    ciclos: esperas.length,
  };
  return { eventos: eventos.filter((e) => e.t < duracion), resumen };
}

/** Estado de cada camión en el minuto t (para animar): { estado, desde, hacia, u (0..1 del tramo) }. */
export function estadoEn(eventos, camion, t) {
  let e = null;
  for (const x of eventos) { if (x.camion !== camion) continue; if (x.t <= t) e = x; else break; }
  if (!e) return null;
  return { ...e, u: clamp((t - e.t) / (e.dur || 1)) };
}
