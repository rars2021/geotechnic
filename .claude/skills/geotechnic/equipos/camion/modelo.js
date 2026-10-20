// Agente equipo-camion · modelo del camión de acarreo clase CAT 793 (226–230 t) en el motor A.
// Paramétrico: sale de MEDIDAS_CAMION (con fuente) y de proporciones marcadas «estimado».
// Mundo de la máquina: x adelante, y arriba, z a la DERECHA real (three es dextrógiro: con x adelante e y arriba,
// +z queda a la derecha del operador; la referencia dice «z izquierda», pero en pantalla +z es la derecha).
// Por eso la cabina va en −z: a la izquierda, como en las fotos (797B Tinaja Hills, Escondida 797). `ladoCabina: +1` la pasa.
// Origen en el piso, entre ejes (eje delantero a 0,55 × ejes, como el v1 del kit).
//
// Lista de piezas (antes de la geometría). Grupos: base (bastidor) → volteo (tolva, bisagra z en el pasador trasero),
// direccion i / direccion d (manguetas, bisagra vertical en el pivote) → barra de acoplamiento (bisagra vertical),
// etapa giro i/d → etapa i/d (etapa intermedia de los cilindros de levante, de dos etapas).
//
// | Grupo      | Piezas                                                                                         |
// |------------|------------------------------------------------------------------------------------------------|
// | base       | largueros delanteros y traseros, travesaños, paragolpe, radiador, parrilla y lamas, motor, motor  |
// |            | alto, transmisión, cardán, eje trasero (carcasa, diferencial, mandos finales, tapas), 4 ruedas   |
// |            | traseras duales, suspensión delantera (barril, ménsula, poste, brazo), pilares, cubierta,        |
// |            | descanso, escalera diagonal (largueros, peldaños, pasamanos, postes), escalerilla, barandas,     |
// |            | cabina (cuerpo, vidrios, parantes, techo, puerta, baliza), prefiltros, baterías, tanques y sus    |
// |            | soportes, faros, apoyos de la tolva, orejas y almas de los cilindros, pasadores de la bisagra     |
// | volteo     | pisos delantero y trasero, labio, frente, laterales, bordes superiores, largueros laterales,      |
// |            | nervios laterales y frontales, visera (losa, rieles, nervios, borde, cartelas), largueros de la   |
// |            | tolva, orejas de la bisagra y de los cilindros de levante · con `carga`: montón y bloques        |
// | direccion  | vástago de la suspensión, mangueta, eje de la mangueta, rueda delantera, tapacubo, brazo de       |
// |            | dirección, pernos de las rótulas                                                               |
// | barra      | barra de acoplamiento y sus dos rótulas                                                        |
// | etapa      | etapa intermedia cromada y su guía (cilindro telescópico de dos etapas)                         |
// | cilindros  | 2 de levante (dos etapas, de pasador a pasador), 2 de dirección                                 |
// | mangueras  | 2 de levante (racor del larguero → banjo del pasador base), 2 de dirección (oreja → banjo)       |
import { maquina, marcoA, orejaA, VA, gradA, rotar2A, circulosA } from "../../motorA/modelo.js";
import { MEDIDAS_CAMION } from "./medidas.js";

/** Valor de una medida por su id. */
export function medidaCamion(id) { const m = MEDIDAS_CAMION.medidas.find((x) => x.id === id); return m ? m.valor : undefined; }

/**
 * Camión de acarreo. op: { ladoCabina: −1 (izquierda real, −z) | +1, carga: false (montón en la tolva, pieza «carga») }.
 * Valores de pose: { _pose, tolva: 0..1 (0 = abajo, 1 = volteo máximo), giro: grados (+ = a la izquierda), rodar: m }.
 */
export function modeloCamion(op = {}) {
  const md = (id) => medidaCamion(id);
  const D = md("rueda"), R = D / 2, ejes = md("ejes");
  const xF = 0.55 * ejes, xR = xF - ejes;
  const Wt = 1.1; // llanta 40.00R57: ancho de sección ≈ 1,1 m (estimado)
  const zF = 2.85, zRi = 1.65, zRo = 2.8, zK = 2.45; // trochas y pivote de la mangueta (estimado sobre fotos 797B/793)
  const LC = op.ladoCabina ?? -1;
  const VOLTEO = md("volteo"), GIRO = md("giro");
  const H = [-4.35, 2.55]; // pasador trasero de la tolva (estimado)
  const xT = -6.6, yT = 4.6, yS = 6.0; // labio de cola (piso) y borde superior de la tolva (estimado; ver volumen)
  const pend = 0.85 / (-3.3 - xT); // pendiente del piso trasero (doble pendiente)
  const yPisoBajo = (x) => (x >= -3.3 ? 3.65 : 3.65 + (-3.3 - x) * pend);
  const xFrente = (y) => 1.62 + (0.42 * (y - 3.65)) / 2.47; // cara exterior del frente de la tolva
  const M = maquina("camion", { medidas: MEDIDAS_CAMION });
  const ambos = (f) => { f(-1, "i"); f(1, "d"); }; // i = −z, d = +z
  const zr = (s, a, b) => (s > 0 ? [a, b] : [-b, -a]);
  const unirTodos = (a, lista, motivo) => { for (const b of lista) M.unir(a, b, motivo); };
  // placa inclinada (perfil x–y, espesor en z) con su marco a lo largo de `dir`: la normal de la cara inclinada queda entre
  // los ejes de la pieza, que el juez usa como pistas del plano separador (con rumbo ≠ 0 no la encontraba solo)
  const placaInclinada = (d) => {
    const u = VA.unit([d.dir[0], d.dir[1], 0]), v = VA.cross([0, 0, 1], u);
    return M.prisma({ ...d, F: marcoA([0, 0, 0], [0, 0, 1], u), poligono: d.perfil.map(([x, y]) => [x * u[0] + y * u[1], x * v[0] + y * v[1]]), s0: d.z[0], s1: d.z[1] });
  };
  const dirFrente = [0.42, 2.47], dirPiso = [-3.3 - xT, 3.75 - yT];

  // ───────────────────────── dirección: trapecio de Ackermann (brazos hacia el centro del eje trasero)
  const aT = 0.75, alfa = Math.atan2(zK, ejes), yTie = 1.1;
  const K = { i: [xF, -zK], d: [xF, zK] };
  const T0 = { i: [xF - aT * Math.cos(alfa), -(zK - aT * Math.sin(alfa))], d: [xF - aT * Math.cos(alfa), zK - aT * Math.sin(alfa)] };
  // brazo del cilindro: 0,6 m a 35° hacia atrás y adentro; el cilindro sigue la tangente hacia adelante y adentro, así en el
  // marco de la llanta apunta siempre hacia adentro (35° + 41,5° < 90°) y nunca cruza la cara interior de la llanta
  const bC = (35 * Math.PI) / 180, aC = 0.6, LcD = 2.0;
  const C0 = { i: [xF - aC * Math.cos(bC), -(zK - aC * Math.sin(bC))], d: [xF - aC * Math.cos(bC), zK - aC * Math.sin(bC)] };
  const BD = { i: [C0.i[0] + LcD * Math.sin(bC), C0.i[1] + LcD * Math.cos(bC)], d: [C0.d[0] + LcD * Math.sin(bC), C0.d[1] - LcD * Math.cos(bC)] };
  const rotXZ = (p, c, g) => { const a = (g * Math.PI) / 180, co = Math.cos(a), si = Math.sin(a), dx = p[0] - c[0], dz = p[1] - c[1]; return [c[0] + dx * co + dz * si, c[1] - dx * si + dz * co]; };
  const angXZ = (v) => gradA(Math.atan2(-v[1], v[0])); // ángulo que suma un giro positivo alrededor de +y
  const envolver = (a) => ((a + 540) % 360) - 180;
  const Ltie = Math.hypot(T0.d[0] - T0.i[0], T0.d[1] - T0.i[1]), rT = Math.hypot(T0.d[0] - K.d[0], T0.d[1] - K.d[1]);
  // rama continua del cuadrilátero (signo −1: la que pasa por el reposo); punto muerto de la rueda interior ≈ 47°
  function ruedaD(ti) {
    const Ti = rotXZ(T0.i, K.i, ti), s = circulosA(K.d, rT, Ti, Ltie, -1);
    return { td: envolver(angXZ([s.p[0] - K.d[0], s.p[1] - K.d[1]]) - angXZ([T0.d[0] - K.d[0], T0.d[1] - K.d[1]])), Ti, Td: s.p, residuo: s.residuo };
  }
  /** Ángulo medio de dirección → ángulos de cada mangueta (izquierda y derecha) y de la barra (bisección: la media crece con ti). */
  function resolverGiro(g) {
    let lo = g - 20, hi = g + 20;
    for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if ((m + ruedaD(m).td) / 2 < g) lo = m; else hi = m; }
    const ti = (lo + hi) / 2, r = ruedaD(ti);
    const barra = envolver(angXZ([r.Td[0] - r.Ti[0], r.Td[1] - r.Ti[1]]) - angXZ([T0.d[0] - T0.i[0], T0.d[1] - T0.i[1]]) - ti);
    return { ti, td: r.td, barra, residuo: r.residuo };
  }
  const gMax = resolverGiro(GIRO), gMin = resolverGiro(-GIRO);
  const rangoDir = { i: [Math.floor(gMin.ti * 10) / 10, Math.ceil(gMax.ti * 10) / 10], d: [Math.floor(gMin.td * 10) / 10, Math.ceil(gMax.td * 10) / 10] };

  // ───────────────────────── levante: cilindros de dos etapas del bastidor a la tolva (estimado sobre fotos 793)
  const A = [0.55, 1.15], B0 = [-0.75, 3.2], zH = 1.3;
  const L0 = Math.hypot(B0[0] - A[0], B0[1] - A[1]), Lmin = L0 - 0.03;
  const d0 = [(B0[0] - A[0]) / L0, (B0[1] - A[1]) / L0, 0], phi0 = Math.atan2(d0[1], d0[0]);
  const rb = 0.19, rv = 0.1, ro = 0.19, rE = 0.145, s0t = 0.24, guiaL = Math.max(0.12, rv * 2.4);
  const Lb = Lmin - ro - 0.07, Lv = Lmin - ro - 0.05, sa0 = s0t + 0.09, Le = Lmin - ro - 0.05 - sa0;
  const E = Math.min(2 * (Lb - guiaL - sa0), 2 * (sa0 + Le - Lmin + Lv - guiaL)); // carrera de las dos etapas

  M.grupo("volteo", { bisagra: { punto: [H[0], H[1], 0], eje: [0, 0, 1], rango: [0, VOLTEO] } }); // 0–45°: volteo estimado
  ambos((s, l) => M.grupo(`direccion ${l}`, { bisagra: { punto: [xF, 0, s * zK], eje: [0, 1, 0], rango: rangoDir[l] } }));
  M.grupo("barra de acoplamiento", { padre: "direccion i", bisagra: { punto: [T0.i[0], yTie, T0.i[1]], eje: [0, 1, 0] } });
  ambos((s, l) => {
    M.grupo(`etapa giro ${l}`, { bisagra: { punto: [A[0], A[1], s * zH], eje: [0, 0, 1] } });
    M.grupo(`etapa ${l}`, { padre: `etapa giro ${l}`, desliza: { dir: d0 } });
  });
  M.cadena("tolva", (v) => {
    if (v.tolva !== undefined) v.volteo = v.tolva * VOLTEO; else v.tolva = v.volteo / VOLTEO;
    return 0;
  });
  M.cadena("dirección", (v) => {
    const r = resolverGiro(v.giro ?? 0);
    v["direccion i"] = r.ti; v["direccion d"] = r.td; v["barra de acoplamiento"] = r.barra;
    return r.residuo;
  });
  M.cadena("levante", (v) => {
    const B = rotar2A(B0, H, v.volteo), L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const giro = gradA(Math.atan2(B[1] - A[1], B[0] - A[0]) - phi0);
    for (const l of ["i", "d"]) { v[`etapa giro ${l}`] = giro; v[`etapa ${l}`] = (L - Lmin) / 2; } // cada etapa sale la mitad
    return 0;
  });

  // ───────────────────────── bastidor
  ambos((s, l) => {
    M.caja({ nombre: `larguero delantero ${l}`, grupo: "base", pieza: "chasis", centro: [2.525, 2.15, s * 0.65], tam: [5.85, 1.4, 0.4] });
    M.placa({ nombre: `larguero trasero ${l}`, grupo: "base", pieza: "chasis", perfil: [[-0.2, 2.3], [-0.2, 2.85], [-4.35, 2.85], [-4.62, 2.62], [-4.62, 2.48], [-4.45, 2.3]], z: zr(s, 0.45, 0.85), bisel: 0.03 });
    M.unir(`larguero delantero ${l}`, `larguero trasero ${l}`, "soldado");
  });
  for (const [n, x, t] of [["travesaño trasero", -3.65, 0.4], ["travesaño central", -1.15, 0.3]]) {
    M.caja({ nombre: n, grupo: "base", pieza: "chasis", centro: [x, 2.575, 0], tam: [t, 0.55, 0.9] });
  }
  M.caja({ nombre: "paragolpe", grupo: "base", pieza: "chasis", centro: [5.85, 1.425, 0], tam: [0.8, 0.85, 4.4] });
  // radiador, parrilla y lamas (rasgo de la foto 797B frontal)
  M.caja({ nombre: "carcasa del radiador", grupo: "base", pieza: "motor", centro: [5.3, 2.925, 0], tam: [0.6, 1.85, 2.5] });
  unirTodos("carcasa del radiador", ["larguero delantero i", "larguero delantero d"], "montado en el bastidor");
  M.caja({ nombre: "parrilla", grupo: "base", pieza: "motor", material: "negro", centro: [5.62, 2.925, 0], tam: [0.04, 1.65, 2.24] });
  for (let k = 0; k < 8; k++) M.unir(M.caja({ nombre: `lama parrilla ${k}`, grupo: "base", pieza: "motor", material: "acero", centro: [5.6525, 2.2 + k * 0.2, 0], tam: [0.025, 0.05, 2.2] }), "parrilla", "lama");
  ambos((s, l) => {
    M.unir(M.redondo({ nombre: `faro ${l}`, grupo: "base", pieza: "faros", material: "negro", F: marcoA([6.25, 1.45, s * 1.6], [1, 0, 0]), s0: -0.08, s1: 0, r: 0.13 }), "paragolpe", "empotrado");
    M.redondo({ nombre: `lente ${l}`, grupo: "base", pieza: "faros", material: "luz", F: marcoA([6.25, 1.45, s * 1.6], [1, 0, 0]), s0: 0, s1: 0.012, r: 0.11 });
  });
  // motor (bajo, entre largueros; alto, sobre ellos), transmisión y cardán
  M.caja({ nombre: "motor", grupo: "base", pieza: "motor", centro: [3.225, 2.175, 0], tam: [3.45, 1.35, 0.88] });
  M.caja({ nombre: "motor alto", grupo: "base", pieza: "motor", centro: [3.55, 3.2, 0], tam: [2.8, 0.7, 2.2] });
  M.caja({ nombre: "transmisión", grupo: "base", pieza: "motor", material: "gris", centro: [0.85, 2.05, 0], tam: [1.3, 1.1, 0.88] });
  M.redondo({ nombre: "cardán", grupo: "base", pieza: "motor", material: "acero", F: marcoA([xR + 0.45, 1.95, 0], [1, 0, 0]), s0: 0, s1: 0.2 - (xR + 0.45), r: 0.11 });
  // eje trasero, mandos finales y ruedas duales
  M.redondo({ nombre: "carcasa eje trasero", grupo: "base", pieza: "chasis", material: "acero", F: marcoA([xR, R, 0], [0, 0, 1]), s0: -1.12, s1: 1.12, r: 0.42 });
  M.caja({ nombre: "diferencial", grupo: "base", pieza: "chasis", material: "acero", centro: [xR, 1.75, 0], tam: [0.9, 1.0, 0.88] });
  M.unir("carcasa eje trasero", "diferencial", "fundido"); M.unir("cardán", "diferencial", "brida"); M.unir("cardán", "transmisión", "brida");
  ambos((s, l) => {
    const wi = M.rueda({ nombre: `rueda trasera int ${l}`, grupo: "base", pieza: "llantas", centro: [xR, R, s * zRi], eje: [0, 0, 1], diametro: D, ancho: Wt, ladoExterior: s, tacos: 24, aro: 0.41 });
    const wo = M.rueda({ nombre: `rueda trasera ext ${l}`, grupo: "base", pieza: "llantas", centro: [xR, R, s * zRo], eje: [0, 0, 1], diametro: D, ancho: Wt, ladoExterior: s, tacos: 24, aro: 0.41 });
    const mf = M.redondo({ nombre: `mando final ${l}`, grupo: "base", pieza: "llantas", material: "acero", F: marcoA([xR, R, 0], [0, 0, s]), s0: 1.0, s1: zRo + Wt / 2 + 0.02, r: 0.5 });
    unirTodos(mf, [wi, wo, `${wi}.maza`, `${wo}.maza`, "carcasa eje trasero"], "mando final en el aro");
    M.unir("carcasa eje trasero", wi, "mando final");
    M.unir(M.redondo({ nombre: `tapa mando final ${l}`, grupo: "base", pieza: "llantas", material: "acero", F: marcoA([xR, R, 0], [0, 0, s]), s0: zRo + Wt / 2 + 0.02, s1: zRo + Wt / 2 + 0.1, r: 0.38 }), mf, "tapa empernada");
  });

  // ───────────────────────── suspensión delantera, manguetas y ruedas delanteras
  ambos((s, l) => {
    const g = `direccion ${l}`;
    const bar = M.redondo({ nombre: `suspensión delantera ${l}`, grupo: "base", pieza: "suspension", F: marcoA([xF, 0, s * zK], [0, 1, 0], [1, 0, 0]), s0: 2.45, s1: 3.85, r: 0.28 });
    const vs = M.redondo({ nombre: `vástago suspensión ${l}`, grupo: g, pieza: "suspension", material: "cromo", F: marcoA([xF, 0, s * zK], [0, 1, 0], [1, 0, 0]), s0: 2.1, s1: 2.6, r: 0.2 });
    M.unir(vs, bar, "vástago dentro del barril");
    const mg = M.caja({ nombre: `mangueta ${l}`, grupo: g, pieza: "direccion", centro: [xF, 1.85, s * zK], tam: [0.6, 0.6, 0.5] });
    M.unir(vs, mg, "vástago en la mangueta");
    const em = M.redondo({ nombre: `eje mangueta ${l}`, grupo: g, pieza: "direccion", material: "acero", F: marcoA([xF, R, 0], [0, 0, s]), s0: zK, s1: zF + 0.3, r: 0.3 });
    const w = M.rueda({ nombre: `rueda delantera ${l}`, grupo: g, pieza: "llantas", centro: [xF, R, s * zF], eje: [0, 0, 1], diametro: D, ancho: Wt, ladoExterior: s, tacos: 24, aro: 0.41 });
    unirTodos(em, [mg, w, `${w}.maza`], "eje de la rueda");
    M.unir(vs, w, "dentro del aro"); M.unir(mg, w, "dentro del aro");
    M.unir(bar, w, "dentro del aro"); // el barril de la suspensión entra en el plato del aro (real en la clase 793)
    M.redondo({ nombre: `tapacubo ${l}`, grupo: g, pieza: "llantas", material: "acero", F: marcoA([xF, R, 0], [0, 0, s]), s0: zF + Wt / 2 + 0.02, s1: zF + Wt / 2 + 0.1, r: 0.3 });
    // soporte de la suspensión: ménsula en el larguero, poste y brazo sobre la llanta
    const me = M.caja({ nombre: `ménsula suspensión ${l}`, grupo: "base", pieza: "suspension", centro: [xF, 2.4, s * 0.985], tam: [0.6, 0.4, 0.27] });
    const po = M.caja({ nombre: `poste suspensión ${l}`, grupo: "base", pieza: "suspension", centro: [xF, 3.02, s * 1.27], tam: [0.6, 1.64, 0.3] });
    const br = M.caja({ nombre: `brazo suspensión ${l}`, grupo: "base", pieza: "suspension", centro: [xF, 3.71, s * 1.835], tam: [0.6, 0.26, 0.83] });
    M.unir(me, `larguero delantero ${l}`, "soldada"); M.unir(me, po, "soldada"); M.unir(po, br, "soldada"); M.unir(br, bar, "abrazadera del barril");
    // brazo de dirección (debajo de la mangueta): pivote, rótula de la barra y ojo del cilindro
    const ad = M.losa({ nombre: `brazo dirección ${l}`, grupo: g, pieza: "direccion", perfil: orejaA([[xF, s * zK, 0.3], [T0[l][0], T0[l][1], 0.12], [C0[l][0], C0[l][1], 0.12]]), y: [1.43, 1.55] });
    unirTodos(ad, [mg, em, w], "fundido con la mangueta");
  });
  // barra de acoplamiento con sus rótulas (grupo propio: la cadena «dirección» la cierra entre los dos brazos)
  ambos((s, l) => M.redondo({ nombre: `rótula ${l}`, grupo: "barra de acoplamiento", pieza: "direccion", material: "acero", F: marcoA([T0[l][0], 0, T0[l][1]], [0, 1, 0], [1, 0, 0]), s0: yTie - 0.07, s1: yTie + 0.07, r: 0.1 }));
  M.barra({ nombre: "barra de acoplamiento", grupo: "barra de acoplamiento", pieza: "direccion", material: "acero", de: [T0.i[0], yTie, T0.i[1]], a: [T0.d[0], yTie, T0.d[1]], r: 0.065, s0: 0.05, s1: Ltie - 0.05 });
  ambos((s, l) => {
    M.unir("barra de acoplamiento", `rótula ${l}`, "roscada");
    M.pasador({ nombre: `perno rótula ${l}`, grupo: `direccion ${l}`, pieza: "direccion", punto: [T0[l][0], 1.295, T0[l][1]], eje: [0, 1, 0], r: 0.05, largo: 0.55, une: [`rótula ${l}`, `brazo dirección ${l}`] });
  });

  // ───────────────────────── cubierta, pilares, cabina, escalera y barandas
  ambos((s, l) => M.caja({ nombre: `pilar cubierta ${l}`, grupo: "base", pieza: "cubierta", centro: [2.0, 3.35, s * 0.65], tam: [0.2, 1.0, 0.4] }));
  M.losa({ nombre: "cubierta", grupo: "base", pieza: "cubierta", perfil: [[1.85, -3.45], [5.65, -3.45], [5.65, 3.45], [1.85, 3.45]], y: [3.85, 3.95] });
  const zc = (a, b) => zr(LC, a, b);
  M.losa({ nombre: "descanso", grupo: "base", pieza: "escalera", perfil: [[5.65, zc(0.6, 1.6)[0]], [6.25, zc(0.6, 1.6)[0]], [6.25, zc(0.6, 1.6)[1]], [5.65, zc(0.6, 1.6)[1]]], y: [3.85, 3.95] });
  M.unir("descanso", "cubierta", "soldado");
  // cabina a la izquierda, sobre la cubierta, bajo la visera
  const zC = zc(1.5, 3.05);
  M.caja({ nombre: "cuerpo de cabina", grupo: "base", pieza: "cabina", centro: [3.55, 4.375, (zC[0] + zC[1]) / 2], tam: [2.0, 0.85, 1.55] });
  const zV = zc(1.55, 3.0);
  M.caja({ nombre: "vidrios de cabina", grupo: "base", pieza: "cabina", material: "vidrio", centro: [3.55, 5.275, (zV[0] + zV[1]) / 2], tam: [1.9, 0.95, 1.45] });
  for (const x of [2.59, 4.51]) for (const z of [1.54, 3.01]) M.unir(M.caja({ nombre: `parante ${x}/${z}`, grupo: "base", pieza: "cabina", centro: [x, 5.275, LC * z], tam: [0.08, 0.95, 0.08] }), "vidrios de cabina", "marco");
  const zT = zc(1.45, 3.1);
  M.caja({ nombre: "techo de cabina", grupo: "base", pieza: "cabina", centro: [3.55, 5.825, (zT[0] + zT[1]) / 2], tam: [2.1, 0.15, 1.65] });
  M.caja({ nombre: "puerta", grupo: "base", pieza: "cabina", centro: [3.9, 4.4, LC * 3.06], tam: [0.9, 0.7, 0.02] });
  M.caja({ nombre: "manija", grupo: "base", pieza: "cabina", material: "acero", centro: [3.55, 4.45, LC * 3.08], tam: [0.12, 0.03, 0.02] });
  M.redondo({ nombre: "baliza", grupo: "base", pieza: "faros", material: "luz", F: marcoA([3.0, 5.9, LC * 2.6], [0, 1, 0]), s0: 0, s1: 0.11, r: 0.07 });
  // lado derecho de la cubierta: prefiltros de aire y caja de baterías
  for (const [k, z] of [[0, 2.2], [1, 2.9]]) {
    M.redondo({ nombre: `prefiltro ${k}`, grupo: "base", pieza: "motor", material: "gris", F: marcoA([4.9, 3.95, -LC * z], [0, 1, 0], [1, 0, 0]), s0: 0, s1: 0.85, r: 0.26 });
    M.redondo({ nombre: `sombrero prefiltro ${k}`, grupo: "base", pieza: "motor", material: "negro", F: marcoA([4.9, 3.95, -LC * z], [0, 1, 0], [1, 0, 0]), s0: 0.85, s1: 0.95, r: 0.3 });
  }
  const zB = zr(-LC, 1.8, 3.0);
  M.caja({ nombre: "caja de baterías", grupo: "base", pieza: "cubierta", material: "gris", centro: [2.85, 4.25, (zB[0] + zB[1]) / 2], tam: [1.1, 0.6, 1.2] });
  // escalera diagonal frente a la parrilla: del paragolpe (derecha) a la cubierta (izquierda)
  const zb = -LC * 2.05, zt = LC * 0.75, yb = 1.88, ytop = 3.9;
  const enLinea = (f) => [yb + (ytop - yb) * f, zb + (zt - zb) * f];
  const largEsc = [];
  for (const x of [5.72, 6.23]) {
    const n = M.barra({ nombre: `larguero escalera ${x}`, grupo: "base", pieza: "escalera", material: "acero", de: [x, yb, zb], a: [x, ytop, zt], r: 0.045 });
    M.unir(n, "paragolpe", "apoyada"); M.unir(n, "descanso", "soldada"); largEsc.push(n);
    const pm = M.barra({ nombre: `pasamanos escalera ${x}`, grupo: "base", pieza: "escalera", material: "acero", de: [x, yb + 1.0, zb], a: [x, ytop + 1.0, zt], r: 0.03 });
    for (const f of [0.06, 0.45, 0.85]) {
      const [y, z] = enLinea(f);
      const p = M.barra({ nombre: `poste escalera ${x} ${f}`, grupo: "base", pieza: "escalera", material: "acero", de: [x, y, z], a: [x, y + 1.0, z], r: 0.025 });
      M.unir(p, n, "soldado"); M.unir(p, pm, "soldado");
    }
  }
  for (let k = 1; k <= 8; k++) {
    const [y, z] = enLinea(k / 9);
    const p = M.caja({ nombre: `peldaño ${k}`, grupo: "base", pieza: "escalera", material: "acero", centro: [5.975, y + 0.025, z], tam: [0.45, 0.04, 0.26] });
    for (const n of largEsc) M.unir(p, n, "soldado");
  }
  // escalerilla del suelo al paragolpe
  for (const z of [1.85, 2.25]) M.unir(M.barra({ nombre: `escalerilla ${z}`, grupo: "base", pieza: "escalera", material: "acero", de: [6.15, 0.4, -LC * z], a: [6.15, 1.0, -LC * z], r: 0.03 }), "paragolpe", "colgada");
  for (const y of [0.5, 0.75]) { const p = M.caja({ nombre: `peldaño escalerilla ${y}`, grupo: "base", pieza: "escalera", material: "acero", centro: [6.15, y, -LC * 2.05], tam: [0.06, 0.04, 0.4] }); M.unir(p, "escalerilla 1.85", "soldado"); M.unir(p, "escalerilla 2.25", "soldado"); }
  // barandas de la cubierta (polilíneas sobre y = 3,95; postes cada ≤ 1,2 m)
  const baranda = (n, pts, piso) => {
    const posts = [];
    let prev = null;
    pts.forEach((p, i) => {
      if (i) {
        const a = pts[i - 1], L = Math.hypot(p[0] - a[0], p[1] - a[1]);
        const top = M.barra({ nombre: `${n} pasamanos ${i}`, grupo: "base", pieza: "cubierta", material: "acero", de: [a[0], 4.95, a[1]], a: [p[0], 4.95, p[1]], r: 0.03 });
        const mid = M.barra({ nombre: `${n} intermedio ${i}`, grupo: "base", pieza: "cubierta", material: "acero", de: [a[0], 4.45, a[1]], a: [p[0], 4.45, p[1]], r: 0.022 });
        if (prev) { M.unir(top, prev[0], "codo soldado"); M.unir(mid, prev[1], "codo soldado"); M.unir(top, posts[posts.length - 1], "soldado"); M.unir(mid, posts[posts.length - 1], "soldado"); }
        const k = Math.max(1, Math.ceil(L / 1.2));
        for (let j = i === 1 ? 0 : 1; j <= k; j++) {
          const t = j / k, q = [a[0] + (p[0] - a[0]) * t, a[1] + (p[1] - a[1]) * t];
          const po = M.barra({ nombre: `${n} poste ${i}.${j}`, grupo: "base", pieza: "cubierta", material: "acero", de: [q[0], 3.95, q[1]], a: [q[0], 4.95, q[1]], r: 0.03 });
          M.unir(po, top, "soldado"); M.unir(po, mid, "soldado");
          if (j === 0 && prev) { M.unir(po, prev[0], "soldado"); M.unir(po, prev[1], "soldado"); }
          posts.push(po);
        }
        prev = [top, mid];
      }
    });
    return posts;
  };
  baranda("baranda derecha", [[1.95, -LC * 3.4], [5.6, -LC * 3.4], [5.6, LC * 0.6]]);
  baranda("baranda descanso", [[6.2, LC * 0.9], [6.2, LC * 1.6], [5.6, LC * 1.6], [5.6, LC * 3.4], [4.65, LC * 3.4]]);
  baranda("baranda trasera", [[2.45, LC * 3.4], [1.95, LC * 3.4]]);

  // ───────────────────────── tanques (combustible a la izquierda, hidráulico a la derecha) con soportes
  const zTc = zr(LC, 1.65, 3.0), zTh = zr(-LC, 1.65, 2.75);
  M.caja({ nombre: "tanque de combustible", grupo: "base", pieza: "tanques", centro: [0.125, 2.05, (zTc[0] + zTc[1]) / 2], tam: [1.75, 1.4, 1.35] });
  M.caja({ nombre: "tanque hidráulico", grupo: "base", pieza: "tanques", centro: [0.2, 2.175, (zTh[0] + zTh[1]) / 2], tam: [1.6, 1.15, 1.1] });
  M.redondo({ nombre: "tapón combustible", grupo: "base", pieza: "tanques", material: "negro", F: marcoA([0.6, 2.75, LC * 2.6], [0, 1, 0], [1, 0, 0]), s0: 0, s1: 0.06, r: 0.08 });
  M.redondo({ nombre: "tapón hidráulico", grupo: "base", pieza: "tanques", material: "negro", F: marcoA([0.6, 2.75, -LC * 2.3], [0, 1, 0], [1, 0, 0]), s0: 0, s1: 0.06, r: 0.07 });
  for (const [x, larg] of [[0.92, "larguero delantero"], [-0.68, "larguero trasero"]]) for (const [s, l] of [[-1, "i"], [1, "d"]]) {
    const n = M.caja({ nombre: `soporte tanque ${x} ${l}`, grupo: "base", pieza: "tanques", centro: [x, 2.5, s * 1.25], tam: [0.15, 0.2, 0.8] });
    M.unir(n, `${larg} ${l}`, "soldado"); M.unir(n, s === LC ? "tanque de combustible" : "tanque hidráulico", "abrazadera");
  }
  // apoyos de goma de la tolva sobre los largueros
  ambos((s, l) => { for (const x of [-3.0, 0.9]) M.caja({ nombre: `apoyo tolva ${l} ${x}`, grupo: "base", pieza: "chasis", material: "goma", centro: [x, 2.86, s * 0.65], tam: [0.5, 0.02, 0.36] }); });

  // ───────────────────────── tolva (grupo volteo)
  const Tv = "volteo";
  M.placa({ nombre: "piso delantero", grupo: Tv, pieza: "tolva", material: "pinturaGastada", perfil: [[-3.3, 3.65], [1.5, 3.65], [1.5, 3.75], [-3.3, 3.75]], z: [-3.5, 3.5] });
  placaInclinada({ nombre: "piso trasero", dir: dirPiso, grupo: Tv, pieza: "tolva", material: "pinturaGastada", perfil: [[xT, yT - 0.1], [-3.3, 3.65], [-3.3, 3.75], [xT, yT]], z: [-3.5, 3.5] });
  M.unir("piso delantero", "piso trasero", "soldadura");
  M.caja({ nombre: "labio trasero", grupo: Tv, pieza: "tolva", material: "acero", centro: [xT - 0.0125, yT - 0.05, 0], tam: [0.025, 0.2, 7.0] });
  placaInclinada({ nombre: "frente de la tolva", dir: dirFrente, grupo: Tv, pieza: "tolva", perfil: [[1.5, 3.65], [1.62, 3.65], [2.04, 6.12], [1.92, 6.12]], z: [-3.5, 3.5] });
  M.unir("frente de la tolva", "piso delantero", "soldadura");
  ambos((s, l) => {
    const lat = M.placa({ nombre: `lateral ${l}`, grupo: Tv, pieza: "tolva", perfil: [[xT, yT - 0.1], [-3.3, 3.65], [1.62, 3.65], [xFrente(5.9), 5.9], [-5.7, 5.9], [xT, yT + 0.25]], z: zr(s, 3.5, 3.6) });
    const bs = M.caja({ nombre: `borde superior ${l}`, grupo: Tv, pieza: "tolva", centro: [(-5.7 + 2.0) / 2, (5.82 + yS) / 2, s * 3.625], tam: [7.7, yS - 5.82, 0.35] });
    M.unir(bs, lat, "soldado"); M.unir(bs, "frente de la tolva", "soldado");
    const ll = M.caja({ nombre: `larguero lateral ${l}`, grupo: Tv, pieza: "tolva", centro: [(-3.3 + 1.62) / 2, 3.775, s * 3.7], tam: [4.92, 0.25, 0.2] });
    M.unir(ll, lat, "soldado");
    // nervios verticales de la tolva (rasgo de las fotos)
    [-5.15, -4.0, -2.75, -1.5, -0.25, 1.0].forEach((x, k) => {
      const y0 = x >= -3.3 ? 3.9 : yPisoBajo(x);
      const n = M.caja({ nombre: `nervio lateral ${l} ${k}`, grupo: Tv, pieza: "tolva", centro: [x, (y0 + 5.82) / 2, s * 3.7], tam: [0.18, 5.82 - y0, 0.2] });
      M.unir(n, lat, "soldado"); M.unir(n, bs, "soldado"); if (x >= -3.3) M.unir(n, ll, "soldado");
    });
  });
  M.unir("labio trasero", "piso trasero", "soldado"); M.unir("labio trasero", "lateral i", "soldado"); M.unir("labio trasero", "lateral d", "soldado");
  // nervios del frente (lado de la cabina)
  [-2.3, 0, 2.3].forEach((zc0, k) => {
    const n = placaInclinada({ nombre: `nervio frontal ${k}`, dir: dirFrente, grupo: Tv, pieza: "tolva", perfil: [[xFrente(3.85), 3.85], [xFrente(3.85) + 0.14, 3.85], [xFrente(6.12) + 0.14, 6.12], [xFrente(6.12), 6.12]], z: [zc0 - 0.1, zc0 + 0.1] });
    M.unir(n, "frente de la tolva", "soldado");
  });
  // visera sobre la cabina: losa, rieles, nervios transversales, borde y cartelas
  M.losa({ nombre: "visera", grupo: Tv, pieza: "visera", perfil: [[1.92, -3.7], [5.95, -3.7], [5.95, 3.7], [1.92, 3.7]], y: [6.12, 6.24] });
  M.unir("visera", "frente de la tolva", "soldada");
  ambos((s, l) => M.caja({ nombre: `riel visera ${l}`, grupo: Tv, pieza: "visera", centro: [3.975, 6.33, s * 3.625], tam: [4.05, 0.18, 0.15] }));
  [2.3, 3.15, 4.0, 4.85, 5.7].forEach((x, k) => M.caja({ nombre: `nervio visera ${k}`, grupo: Tv, pieza: "visera", centro: [x, 6.33, 0], tam: [0.16, 0.18, 7.1] }));
  M.caja({ nombre: "borde visera", grupo: Tv, pieza: "visera", centro: [5.9, 6.33, 0], tam: [0.1, 0.18, 7.1] });
  ambos((s, l) => {
    const c = M.placa({ nombre: `cartela visera ${l}`, grupo: Tv, pieza: "visera", perfil: [[xFrente(5.6), 5.6], [2.04, 6.12], [3.2, 6.12]], z: zr(s, 3.45, 3.55) });
    unirTodos(c, ["frente de la tolva", "visera", `borde superior ${l}`], "soldada");
  });
  // largueros de la tolva (apoyan en los largueros del bastidor) y orejas de la bisagra
  ambos((s, l) => {
    const a = M.caja({ nombre: `larguero tolva ${l}`, grupo: Tv, pieza: "tolva", centro: [(-3.3 + 1.4) / 2, (2.87 + 3.65) / 2, s * 0.65], tam: [4.7, 0.78, 0.4] });
    const b = M.placa({ nombre: `larguero tolva trasero ${l}`, grupo: Tv, pieza: "tolva", perfil: [[-4.1, 2.87], [-3.3, 2.87], [-3.3, 3.65], [-4.1, yPisoBajo(-4.1)]], z: zr(s, 0.45, 0.85) });
    M.unir(a, b, "soldado"); M.unir(a, "piso delantero", "soldado"); M.unir(b, "piso trasero", "soldado");
    const perf = orejaA([[H[0], H[1], 0.22], [-4.7, yPisoBajo(-4.7) + 0.02, 0.03], [-3.95, yPisoBajo(-3.95) + 0.03, 0.03]]);
    const o1 = M.placa({ nombre: `oreja bisagra int ${l}`, grupo: Tv, pieza: "tolva", perfil: perf, z: zr(s, 0.3, 0.43) });
    const o2 = M.placa({ nombre: `oreja bisagra ext ${l}`, grupo: Tv, pieza: "tolva", perfil: perf, z: zr(s, 0.87, 1.0) });
    for (const o of [o1, o2]) M.unir(o, "piso trasero", "soldada");
    // pasador trasero de la tolva: atraviesa el larguero del bastidor y las dos orejas
    M.pasador({ nombre: `pasador bisagra ${l}`, grupo: "base", pieza: "tolva", punto: [H[0], H[1], s * 0.65], eje: [0, 0, 1], r: 0.11, largo: 0.74, une: [`larguero trasero ${l}`, o1, o2] });
    // orejas de los cilindros de levante, bajo el piso
    const pl = orejaA([[B0[0], B0[1], 0.19], [B0[0] - 0.4, 3.66, 0.02], [B0[0] + 0.4, 3.66, 0.02]]);
    for (const [n, a0, b0] of [["int", 1.08, 1.14], ["ext", 1.46, 1.52]]) M.unir(M.placa({ nombre: `oreja levante tolva ${n} ${l}`, grupo: Tv, pieza: "levante", perfil: pl, z: zr(s, a0, b0) }), "piso delantero", "soldada");
  });

  // ───────────────────────── carga (opcional): al ras, montón y bloques en superficie (rasgo de las fotos)
  const xM = xT + 2 * (yS - yT); // la cola retiene a 2:1 desde el labio (SAE J1363)
  if (op.carga) {
    const xi = (y) => 1.5 + (0.42 * (y - 3.65)) / 2.47 - 0.02; // detrás de la cara interior del frente
    const carga = [];
    carga.push(placaInclinada({ nombre: "carga al ras", dir: dirFrente, grupo: Tv, pieza: "carga", material: "roca", perfil: [[xT + 0.03, yT + 0.01], [-3.3, 3.76], [xi(3.76), 3.76], [xi(yS), yS], [xM, yS]], z: [-3.44, 3.44] }));
    carga.push(M.pared({ nombre: "montón", grupo: Tv, pieza: "carga", material: "roca", perfil: [[-3.4, yS], [3.4, yS], [0.9, yS + 1.0], [-0.9, yS + 1.0]], x: [xM + 0.5, 1.4] }));
    carga.push(M.placa({ nombre: "montón trasero", grupo: Tv, pieza: "carga", material: "roca", perfil: [[xM + 0.5, yS], [xM + 0.5, yS + 1.0], [xM - 0.9, yS]], z: [-0.9, 0.9] }));
    let sem = 7; const azar = () => ((sem = (sem * 16807) % 2147483647) / 2147483647);
    [[-2.6, -1.6], [-1.2, 1.9], [0.2, -0.4], [-0.4, 2.4], [0.9, 1.2], [-2.0, 0.6], [-1.6, -2.5], [0.6, -2.0]].forEach(([x, z], k) => {
      const ysup = yS + 1.0 - Math.max(0, Math.abs(z) - 0.9) * (1.0 / 2.5); // superficie del montón
      const rr = 0.35 + 0.25 * azar(), n = 6, pol = [];
      for (let j = 0; j < n; j++) { const t = (j / n) * 2 * Math.PI + azar() * 0.4; const q = rr * (0.75 + 0.25 * azar()); pol.push([q * Math.cos(t), q * Math.sin(t)]); }
      const ej = VA.unit([azar() - 0.5, 0.6 + azar(), azar() - 0.5]);
      carga.push(M.prisma({ nombre: `bloque ${k}`, grupo: Tv, pieza: "carga", material: "roca", F: marcoA([x, ysup + 0.05, z], ej, [1, 0, 0]), poligono: pol, s0: -0.18, s1: 0.18, bisel: 0.04 }));
    });
    for (let a = 0; a < carga.length; a++) for (let b = a + 1; b < carga.length; b++) M.unir(carga[a], carga[b], "material suelto");
  }

  // ───────────────────────── cilindros
  // levante: ménsula y orejas en el bastidor (delante del cilindro, que se inclina hacia atrás)
  ambos((s, l) => {
    const me = M.caja({ nombre: `ménsula levante ${l}`, grupo: "base", pieza: "levante", centro: [0.925, 1.225, s * 1.2], tam: [0.25, 0.45, 0.7] });
    M.unir(me, `larguero delantero ${l}`, "soldada");
    const pb = orejaA([[A[0], A[1], 0.2], [0.95, 1.05, 0.1], [0.95, 1.38, 0.06]]);
    for (const [n, a0, b0] of [["int", 1.05, 1.12], ["ext", 1.48, 1.55]]) M.unir(M.placa({ nombre: `oreja levante base ${n} ${l}`, grupo: "base", pieza: "levante", perfil: pb, z: zr(s, a0, b0) }), me, "soldada");
    M.cilindro({ nombre: `cilindro levante ${l}`, pieza: "levante", de: { grupo: "base", punto: [A[0], A[1], s * zH] }, a: { grupo: Tv, punto: [B0[0], B0[1], s * zH] }, eje: [0, 0, 1], Lmin,
      rBarril: rb, rVastago: rv, rOjo: ro, anchoOjo: 0.28, inicioTubo: s0t, ladoPuertos: [0, -1, 0], portado: "pasador", banjos: [-s],
      pasadores: { r: 0.09, largoDe: 0.54, uneDe: [`oreja levante base int ${l}`, `oreja levante base ext ${l}`], tapasDe: s, largoA: 0.5, uneA: [`oreja levante tolva int ${l}`, `oreja levante tolva ext ${l}`] } });
    // etapa intermedia (cromo) y su guía: entre el barril y el vástago; sale la mitad de la extensión
    const Fe = marcoA([A[0], A[1], s * zH], d0);
    const et = M.redondo({ nombre: `etapa ${l}`, grupo: `etapa ${l}`, pieza: "levante", material: "cromo", F: Fe, s0: sa0, s1: sa0 + Le, r: rE, lados: 20 });
    M.unir(et, M.redondo({ nombre: `guía etapa ${l}`, grupo: `etapa ${l}`, pieza: "levante", material: "acero", F: Fe, s0: sa0 + Le - 0.07, s1: sa0 + Le, r: rE * 1.1, lados: 20 }), "rosca");
  });
  // dirección: del bastidor (orejas bajo el larguero) al brazo de cada mangueta; pasadores verticales
  ambos((s, l) => {
    const [xb, zb0] = BD[l], perf = orejaA([[xb, zb0, 0.11], [xb + 0.3, s * 0.62, 0.09]]); // hacia adelante: lejos del barril
    M.losa({ nombre: `oreja dirección sup ${l}`, grupo: "base", pieza: "direccion", perfil: perf, y: [1.41, 1.45] });
    M.losa({ nombre: `oreja dirección inf ${l}`, grupo: "base", pieza: "direccion", perfil: perf, y: [1.21, 1.25] });
    const al = M.caja({ nombre: `alma dirección ${l}`, grupo: "base", pieza: "direccion", centro: [xb + 0.3, 1.33, s * 0.62], tam: [0.14, 0.24, 0.1] });
    M.unir(al, `oreja dirección sup ${l}`, "soldada"); M.unir(al, `oreja dirección inf ${l}`, "soldada"); M.unir(`oreja dirección sup ${l}`, `larguero delantero ${l}`, "soldada");
    M.cilindro({ nombre: `cilindro dirección ${l}`, pieza: "direccion", de: { grupo: "base", punto: [xb, 1.33, zb0] }, a: { grupo: `direccion ${l}`, punto: [C0[l][0], 1.33, C0[l][1]] }, eje: [0, 1, 0],
      rBarril: 0.09, rVastago: 0.05, rOjo: 0.1, anchoOjo: 0.14, inicioTubo: 0.13, ladoPuertos: [0, -s, 0], portado: "pasador", banjos: [-1],
      pasadores: { r: 0.045, largoDe: 0.24, uneDe: [`oreja dirección sup ${l}`, `oreja dirección inf ${l}`], tapasDe: false, centroA: [C0[l][0], 1.395, C0[l][1]], largoA: 0.35, uneA: [`brazo dirección ${l}`] } });
  });

  // ───────────────────────── puertos y mangueras
  const racor = (n, grupo, punto, normal, base) => {
    const p = M.redondo({ nombre: `racor ${n}`, grupo, pieza: "levante", material: "laton", F: marcoA(punto, normal), s0: -0.05, s1: 0.0, r: 0.028, lados: 8 });
    M.unir(p, base, "racor roscado");
    M.puerto(n, { grupo, punto, normal, pieza: p, reorientar: true });
    return n;
  };
  const pares = [];
  ambos((s, l) => {
    const bjL = `cilindro levante ${l}.banjo${-s > 0 ? "+" : "-"}`;
    racor(`bastidor levante ${l}`, "base", [0.2, 1.45, s * 0.75], [0, -1, 0], `larguero delantero ${l}`);
    M.manguera({ nombre: `manguera levante ${l}`, de: `bastidor levante ${l}`, a: bjL, r: 0.016, holgura: 0.04 });
    pares.push([`bastidor levante ${l}`, bjL]);
    const bjD = `cilindro dirección ${l}.banjo-`;
    racor(`bastidor dirección ${l}`, "base", [BD[l][0] - 0.5, 1.45, s * 0.7], [0, -1, 0], `larguero delantero ${l}`);
    M.manguera({ nombre: `manguera dirección ${l}`, de: `bastidor dirección ${l}`, a: bjD, r: 0.016, holgura: 0.04 });
    pares.push([`bastidor dirección ${l}`, bjD]);
  });

  // ───────────────────────── rango, dimensionado y etapas
  const muestras = [];
  for (const t of [0, 0.25, 0.5, 0.75, 1]) for (const g of [-GIRO, -GIRO / 2, 0, GIRO / 2, GIRO]) muestras.push({ tolva: t, giro: g });
  M.dimensionar(muestras);
  ambos((s, l) => {
    const c = M.cilindros.find((x) => x.nombre === `cilindro levante ${l}`);
    c.etapas = 2; c.Lmax = Lmin + E; // carrera real de las dos etapas (la del motor es de una sola)
    const fuera = new Set([`${c.nombre}.ojoBase`, `${c.nombre}.cuello`]);
    for (const n of [`etapa ${l}`, `guía etapa ${l}`]) {
      for (const b of c.piezasBarril) if (!fuera.has(b)) M.unir(n, b, "etapa dentro del barril");
      M.unir(n, `${c.nombre}.vastagoCromo`, "vástago dentro de la etapa");
    }
  });
  for (const [a, b] of pares) M.puertos.get(b).hacia = a; // el banjo apunta al racor; el racor sale recto de su cara
  M.orientarPuertos({ tolva: 0.5, giro: 0 });
  M.dimensionarMangueras(muestras);
  M.dims = { D, R, ejes, xF, xR, zF, zRi, zRo, zK, Wt, H, A, B0, Lmin, E, VOLTEO, GIRO, rangoDir, xT, yT, yS, xM, LC, ancho: 2 * 3.8, densidad: MEDIDAS_CAMION.densidadSuelta.valor };
  M.muestrasRango = muestras;
  M.resolverGiro = resolverGiro;
  return M;
}

/** Volumen colmado SAE 2:1 de la tolva (m³): al ras (perfil interior × ancho, la cola retiene a 2:1) + colmo 2:1. */
function volumenCamion(d) {
  const xi = (y) => 1.5 + (0.42 * (y - 3.65)) / 2.47; // cara interior del frente
  const poly = [[d.xT, d.yT], [-3.3, 3.75], [xi(3.75), 3.75], [xi(d.yS), d.yS], [d.xM, d.yS]];
  let area = 0;
  for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; area += a[0] * b[1] - a[1] * b[0]; }
  const W = 7.0, Lh = xi(d.yS) - d.xM;
  return (Math.abs(area) / 2) * W + (W * W * Lh) / 8 - W ** 3 / 24;
}

/** Medidas del modelo, para compararlas con MEDIDAS_CAMION (juez · fidelidad). */
export function medirCamion(M) {
  const d = M.dims;
  const cs = M.cascos(M.posar({ tolva: 0, giro: 0, _sinMangueras: true }));
  const ext = (k, f) => f(...cs.flatMap((c) => c.puntos.map((q) => q[k])));
  const volumen = volumenCamion(d);
  const ri = M.grupos.get("direccion i").bisagra.rango, rd = M.grupos.get("direccion d").bisagra.rango;
  return {
    capacidad: volumen * d.densidad, volumen, largo: ext(0, Math.max) - ext(0, Math.min), ancho: ext(2, Math.max) - ext(2, Math.min),
    rueda: d.D, ejes: d.xF - d.xR, alturaCarga: Math.max(...M.porNombre.get("borde superior i").casco.map((q) => q[1])),
    alturaVisera: ext(1, Math.max), volteo: M.grupos.get("volteo").bisagra.rango[1], giro: (ri[1] + rd[1]) / 2,
  };
}

/** Registro del equipo (lo usan el taller, el juez y los ejemplos). */
export const EQUIPO_CAMION = {
  nombre: "camion", medidas: MEDIDAS_CAMION,
  modelo: (op) => modeloCamion(op), medir: (M) => medirCamion(M),
  dibujo: { color: "#d9a521", colorAro: "#d9a521", alturaBarro: 1.8 },
};
