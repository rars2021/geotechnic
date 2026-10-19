// Geotechnic · motor B · macizo: una sola descripción del macizo rocoso que alimenta galerías, frentes y taludes.
// Junta en un objeto los métodos que ya usa el kit, cada uno con su parámetro de ruido EXPLÍCITO:
//  - DFN de discos por familia (Priest y Hudson: espaciado exponencial; Fisher: dispersión de orientaciones);
//  - relieve facetado por bloques (cada bloque, una faceta plana: así se ven las caras de juntas);
//  - ondulación de los planos de junta y aspereza de la cara (ruido fractal con amplitud y longitud de onda dadas;
//    la aspereza escala con el JRC de Barton de cada familia);
//  - alteración gradacional (zonas con franja de transición ruidosa, nunca borde nítido);
//  - agua (humedad que oscurece y da brillo; chorreras bajo las juntas) y polvo (en caras que miran arriba).
// Todo es determinista con `semilla` y puro (sin three): el juez lo usa en Node para el contrato.
import { ruido3, fbm, suave, clamp, rgb, mezcla } from "./nucleo.js";
import { crearDFN, relieveBloques } from "./fracturas.js";
import { colorRoca } from "./volumenes.js";

/**
 * op: { familias: [{ nombre, buz, dirBuz, kappa, espaciado, persistencia, relieve, jrc, maxDiscos }],
 *       caja: { min, max }, semilla,
 *       ruido: { amplitud (m), longitud (m), octavas } — ondulación de las juntas (explícito, por defecto 0,06 m · 3 m · 3),
 *       aspereza: { amplitud (m) por JRC 10, longitud (m) } — rugosidad fina de la cara,
 *       litologia: ["#hex", …], alteracion: [{ f: zona(...), paleta, peso }],
 *       agua: { base (0..1), juntas (0..1), piso (0..1), zonas: [{ f, peso }] }, polvo: { color, fuerza },
 *       fuentes: { familias, ruido, … } (texto de la tabla de fuentes) }
 */
export function macizo(op = {}) {
  const sem = op.semilla ?? 13;
  const dfn = crearDFN(op.familias || [], op.caja || { min: [-20, -2, -6], max: [20, 8, 6] }, sem);
  const ruido = { amplitud: 0.06, longitud: 3, octavas: 3, ...(op.ruido || {}) };
  const asp = { amplitud: 0.035, longitud: 0.6, ...(op.aspereza || {}) };
  const nOnd = ruido3(sem + 101), nAsp = ruido3(sem + 202);
  const jrc = (op.familias || []).map((f) => f.jrc ?? 8);
  // ondulación de cada plano de junta: desplaza su posición a lo largo de la normal (ruido explícito)
  const ondula = ruido.amplitud > 0 ? (x, y, z, fi) => ruido.amplitud * fbm(nOnd, x / ruido.longitud + fi * 17.3, y / ruido.longitud, z / ruido.longitud, ruido.octavas) : null;
  const color = colorRoca(op.litologia || ["#7e7a71", "#716d65", "#8a857b"], op.alteracion || [], sem + 5);
  const agua = { base: 0.05, juntas: 0.45, piso: 0.55, ...(op.agua || {}) };
  /** Relieve de la cara en (x, y, z): { d (m, negativo = hacia el macizo), dist (a la junta más cercana), familia, tono }. */
  function relieve(x, y, z, amp = 1) {
    const b = relieveBloques(dfn, x, y, z, amp, ondula);
    const k = b.familia >= 0 ? jrc[b.familia] / 10 : 1;
    const a = asp.amplitud * k * fbm(nAsp, x / asp.longitud, y / asp.longitud, z / asp.longitud, 3);
    return { d: b.d + a, dist: b.dist, familia: b.familia, tono: b.tono };
  }
  /** Humedad 0..1: base, junto a las juntas, en el piso y en zonas húmedas. */
  function humedad(x, y, z, piso, dist = 9) {
    if (piso) return agua.piso;
    let h = agua.base + agua.juntas * (1 - suave(0.02, 0.12, dist));
    for (const zz of agua.zonas || []) h += (zz.peso ?? 0.3) * zz.f(x, y, z);
    return clamp(h);
  }
  const metodologia = [
    { metodo: "DFN de discos (Priest y Hudson 1976; Fisher)", parametros: (op.familias || []).map((f) => `${f.nombre} ${f.buz}/${f.dirBuz} κ${f.kappa ?? 40} · s ${f.espaciado} m · p ${f.persistencia} m`).join(" · "), fuente: op.fuentes?.familias || "estimado" },
    { metodo: "Ondulación de juntas (ruido fractal)", parametros: `amplitud ${ruido.amplitud} m · longitud de onda ${ruido.longitud} m · ${ruido.octavas} octavas`, fuente: op.fuentes?.ruido || "estimado (parámetro de dibujo)" },
    { metodo: "Aspereza ∝ JRC (Barton)", parametros: `${asp.amplitud} m por JRC 10 · ${asp.longitud} m · JRC ${jrc.join(" / ")}`, fuente: op.fuentes?.jrc || "estimado" },
    { metodo: "Alteración gradacional", parametros: `${(op.alteracion || []).length} zonas con franja de transición`, fuente: op.fuentes?.alteracion || "ilustrativo" },
  ];
  return { dfn, relieve, color, humedad, ondula, ruido, aspereza: asp, metodologia, op };
}
