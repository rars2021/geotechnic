// Agente equipo-scoop · modelo del scoop (LHD) CAT R1600G en el motor A.
// Paramétrico: todo sale de MEDIDAS_SCOOP (con fuente) y de unas pocas proporciones marcadas «estimado».
// Mundo de la máquina: x adelante, y arriba, z izquierda; origen en el piso bajo la articulación central.
//
// Lista de piezas (antes de la geometría, disciplina de Anatomy: densidad por estructura). Grupos: base (bastidor
// trasero) → delantero (bisagra vertical) → brazo (bisagra z) → cucharón (bisagra z), palanca (bisagra z) → biela.
// Detalle tomado de las fotos abiertas (Sandvik LH517/LH410/LH514, LHD de Cobar, ST7 de VKG) y de la foto 3.05 de
// Gutiérrez Castillo (2019, R1600G de 6 yd³): cucharón con adaptadores y puntas, protectores de labio y de talón,
// barras de desgaste; guardabarros en arco; faros con carcasa y visera; ROPS de cuatro postes con malla.
//
// | Grupo      | Piezas                                                                                         |
// |------------|------------------------------------------------------------------------------------------------|
// | base       | caja trasera, poste y placas del enganche con cubos, topes de articulación, compartimiento del  |
// |            | motor, capó, contrapeso, parachoques, rejilla con lamas, persianas, tapas de servicio, eje       |
// |            | trasero (carcasa, diferencial, puntas), ruedas (tuercas, tapa planetaria), guardabarros en arco |
// |            | (3 tramos) con poste, tanque hidráulico (tapón, visor), tanque de combustible (tapón), extintor,|
// |            | silenciador y escape, filtro de aire, barandas, faros traseros (carcasa, lente, visera)         |
// | cabina     | cuerpo, 4 postes ROPS, poste de puerta, 4 vidrios, capota, malla lateral y frontal (marcos y    |
// |  (base)    | barrotes), manija, escalera (largueros, peldaños), pasamanos, espejo, 2 focos de trabajo         |
// | delantero  | lengüetas de la articulación, topes, puente de torres, torres, caja delantera, eje delantero,   |
// |            | ruedas (tuercas, tapa planetaria), guardabarros en arco con poste, faros (carcasa, lente,       |
// |            | visera, soporte), nariz con horquillas de los cilindros de levante, orejas del volteo, racores  |
// | brazo      | dos brazos, travesaño, orejas de la palanca, muñones de los cilindros de levante                 |
// | palanca    | dos placas (barra en Z)                                                                         |
// | biela      | biela central                                                                                   |
// | cucharón   | piso, talón, espalda baja y alta, laterales, cuchilla, 6 adaptadores con punta y pasador,        |
// |            | 5 protectores de labio, cortadores laterales, placas de desgaste laterales, 5 barras de desgaste|
// |            | bajo el piso, 4 protectores de talón, 2 refuerzos de la espalda, guarda superior, orejas de      |
// |            | izaje, orejas de brazo y de biela                                                               |
// | cilindros  | 2 de levante, 1 de volteo, 2 de dirección: barril, glándula, vástago cromado, ojos, pasadores    |
// | mangueras  | 2 de volteo, 2 de levante, 4 que cruzan la articulación junto a su eje                           |
import { maquina, marcoA, orejaA, tiraA, circulosA, gradA, rotar2A, ang2A } from "../../motorA/modelo.js";
import { MEDIDAS_SCOOP } from "./medidas.js";

/** Valor de una medida por su id. */
export function medidaScoop(id) { const m = MEDIDAS_SCOOP.medidas.find((x) => x.id === id); return m ? m.valor : undefined; }

export function modeloScoop(op = {}) {
  const md = (id) => medidaScoop(id);
  // llanta 18.00 × 25 (CAT pág. 12): sección nominal 18" = 0,457 m más el abombado → 0,48 m (estimado)
  const D = md("rueda"), R = D / 2, W = md("ancho"), Wt = 0.48;
  const xF = md("ejeArticulacion"), xR = xF - md("ejes"), xCola = xR - md("voladizo");
  // El bastidor delantero (torres, brazos, barra en Z, nariz, cucharón) se diseñó con el eje a 1,45 m de la
  // articulación; la hoja CAT lo pone a 1,768 m. Todo el conjunto delantero se corre DX: A, B y C no cambian.
  const DX = xF - 1.45, fx = (x) => x + DX, fxp = (pts) => pts.map(([x, y]) => [x + DX, y]);
  const zW = W / 2 - Wt / 2;
  const capota = md("capota"), anchoC = md("anchoCucharon"), giro = md("articulacion"), capo = md("capo");
  // Brazo y cucharón desde la hoja CAT (pág. 13, dibujo medido con la escala de su tabla):
  //  · pasador del cucharón con el brazo arriba: 1,114 m delante del eje delantero, a 3,752 m (cota 3);
  //  · pasador con el cucharón a nivel en el piso: la punta de los dientes queda a (largo − ejes − voladizo) del eje
  //    (cota 9: 10,107 m) y el pasador a `punta` detrás de ella, a la altura del fondo de las barras de desgaste;
  //  · pivote de los brazos 0,97 m detrás del eje delantero (medido en el dibujo); su altura y el largo del brazo
  //    salen de que los dos pasadores estén en el mismo círculo.
  const yF = -0.36, eDes = 0.03, yPiso = yF - eDes, punta = 1.9; // piso del cucharón, barras de desgaste, dientes (m, desde el pasador)
  const H = [xF + 1.114, md("alturaPasador")], G = [xF + (md("largo") - md("ejes") - md("voladizo")) - punta, -yPiso];
  const pX = xF - 0.97, hx = H[0] - pX, gx = G[0] - pX;
  const pY = (hx * hx + H[1] ** 2 - gx * gx - G[1] ** 2) / (2 * (H[1] - G[1]));
  const P0 = [pX, pY], La = Math.hypot(hx, H[1] - pY), K0 = [pX + La, pY];
  const k = (x, y) => [K0[0] + x, K0[1] + y]; // cucharón: metros desde el pasador, con el cucharón a nivel y el brazo horizontal
  const aLo = Math.round(gradA(Math.asin((-yPiso - P0[1]) / La)) * 10) / 10; // cucharón a nivel, en el piso
  const aHi = Math.round(gradA(Math.atan2(H[1] - pY, hx)) * 10) / 10; // brazo arriba (pasador a 3,752 m)
  // barra en Z (búsqueda numérica en Node: cierra de −100° a +64°, transmisión ≥ 25°, lejos del travesaño). Se diseñó
  // con el pasador en K0v; se traslada con él (palanca, biela y travesaño conservan su posición respecto del pasador)
  const K0v = [fx(0.45) + 3, 1.89], dK = [K0[0] - K0v[0], K0[1] - K0v[1]], kz = (x, y) => [fx(x) + dK[0], y + dK[1]];
  const C0 = kz(2.514, 2.238), D0 = kz(2.993, 1.706), E0 = [K0[0] - 0.174, K0[1] + 0.252], T0 = kz(2.138, 2.375);
  const CB = kz(2.349, 1.941); // travesaño entre brazos: en el sector que la palanca nunca barre (241° desde C, a 0,34 m)
  const LCD = Math.hypot(D0[0] - C0[0], D0[1] - C0[1]), LDE = Math.hypot(E0[0] - D0[0], E0[1] - D0[1]);
  const rango = { brazo: op.rangoBrazo || [aLo, aHi], cucharon: op.rangoCucharon || [-96, 64] }; // −96°: tope de descarga (la espalda llega a los brazos)
  const M = maquina("scoop", { medidas: MEDIDAS_SCOOP });
  M.grupo("delantero", { bisagra: { punto: [0, 0, 0], eje: [0, 1, 0], rango: [-giro, giro] } });
  M.grupo("brazo", { padre: "delantero", bisagra: { punto: [P0[0], P0[1], 0], eje: [0, 0, 1], rango: rango.brazo }, reposo: -20 });
  M.grupo("cucharon", { padre: "brazo", bisagra: { punto: [K0[0], K0[1], 0], eje: [0, 0, 1], rango: rango.cucharon }, reposo: 55 });
  M.grupo("palanca", { padre: "brazo", bisagra: { punto: [C0[0], C0[1], 0], eje: [0, 0, 1] } });
  M.grupo("biela", { padre: "palanca", bisagra: { punto: [D0[0], D0[1], 0], eje: [0, 0, 1] } });
  // cierre de la barra en Z: con el ángulo del cucharón se resuelven palanca y biela (en el marco del brazo)
  M.cadena("barra en Z", (v) => {
    const E = rotar2A(E0, K0, v.cucharon);
    const { p: Dp, residuo } = circulosA(C0, LCD, E, LDE, -1);
    const psi = gradA(ang2A([Dp[0] - C0[0], Dp[1] - C0[1]]) - ang2A([D0[0] - C0[0], D0[1] - C0[1]]));
    v.palanca = ((psi + 540) % 360) - 180;
    const chi = gradA(ang2A([E[0] - Dp[0], E[1] - Dp[1]]) - ang2A([E0[0] - D0[0], E0[1] - D0[1]])) - v.palanca;
    v.biela = ((chi + 540) % 360) - 180;
    return residuo;
  });

  const pin = { r: 0.055 };
  const ambos = (f) => { f(1, "i"); f(-1, "d"); }; // i = izquierda (+z), d = derecha (−z)
  const zr = (s, a, b) => (s > 0 ? [a, b] : [-b, -a]);
  const rEje = 0.15;
  const rad = (g) => (g * Math.PI) / 180;
  /** Tramo de guardabarros en arco sobre la llanta: placa entre los ángulos ta y tb (desde la vertical, + adelante).
   *  Tramos de ≤ 42°: la cuerda interior no entra en la llanta. */
  const tramoArco = (n, grupo, cx, ta, tb, z, pieza) => {
    const r0 = R + 0.07, r1 = r0 + 0.04, p = (r, t) => [cx + r * Math.sin(rad(t)), R + r * Math.cos(rad(t))];
    return M.placa({ nombre: n, grupo, pieza, material: "pinturaGastada", perfil: [p(r0, ta), p(r1, ta), p(r1, tb), p(r0, tb)].reverse(), z, bisel: 0.008 });
  };
  /** Rueda con tuercas y tapa planetaria (detalle de la maza; las tuercas asientan en la cara del aro). */
  const rueda = (n, grupo, cx, s, pieza) => {
    const ll = M.rueda({ nombre: n, grupo, pieza, centro: [cx, R, s * zW], eje: [0, 0, 1], diametro: D, ancho: Wt, ladoExterior: s, tacos: 26 });
    const F = (o) => marcoA(o, [0, 0, s]);
    for (let j = 0; j < 10; j++) {
      const t = (j / 10) * 2 * Math.PI;
      const rN = R * 0.56 * 0.3 + 0.02; // círculo de tuercas junto a la maza (aro del kit: maza de radio 0,3·aro)
      const tu = M.redondo({ nombre: `${n} tuerca ${j}`, grupo, pieza, material: "acero", F: F([cx + rN * Math.cos(t), R + rN * Math.sin(t), s * zW]), s0: Wt * 0.25, s1: Wt * 0.25 + 0.03, r: 0.016, lados: 6 });
      M.unir(tu, ll, "tuerca asentada en el aro");
    }
    const tp = M.redondo({ nombre: `${n} tapa planetaria`, grupo, pieza, material: "acero", F: F([cx, R, s * zW]), s0: Wt * 0.5 + 0.015, s1: Wt * 0.5 + 0.05, r: 0.11, lados: 12 });
    M.unir(tp, `${n}.maza`, "tapa empernada a la maza"); M.unir(tp, ll, "dentro del casco de la llanta");
    return ll;
  };

  // ───────────────────────── bastidor trasero (base)
  M.caja({ nombre: "caja trasera", grupo: "base", pieza: "motor", centro: [(-2.82 - 0.66) / 2, (R + rEje + 1.5) / 2, 0], tam: [2.16, 1.5 - R - rEje, 1.1] });
  M.caja({ nombre: "poste del enganche", grupo: "base", pieza: "articulacion", centro: [-0.55, 1.0, 0], tam: [0.22, 0.96, 0.6] });
  M.unir("poste del enganche", "caja trasera", "soldado");
  for (const [n, y] of [["placa enganche inferior", [0.52, 0.62]], ["placa enganche superior", [1.38, 1.48]]]) {
    M.losa({ nombre: n, grupo: "base", pieza: "articulacion", material: "acero", perfil: [[-0.62, -0.3], [-0.1, -0.3], [0.12, -0.16], [0.12, 0.16], [-0.1, 0.3], [-0.62, 0.3]], y });
    M.unir(n, "poste del enganche", "soldado");
  }
  M.unir("placa enganche superior", "caja trasera", "soldado");
  // cubos de los pasadores de la articulación (refuerzo de las placas, el pasador los atraviesa)
  M.redondo({ nombre: "cubo enganche superior", grupo: "base", pieza: "articulacion", material: "acero", F: marcoA([0, 1.48, 0], [0, 1, 0]), s0: 0, s1: 0.022, r: 0.14, lados: 16 });
  M.redondo({ nombre: "cubo enganche inferior", grupo: "base", pieza: "articulacion", material: "acero", F: marcoA([0, 0.52, 0], [0, 1, 0]), s0: -0.022, s1: 0, r: 0.14, lados: 16 });
  M.unir("cubo enganche superior", "placa enganche superior", "soldado"); M.unir("cubo enganche inferior", "placa enganche inferior", "soldado");
  // compartimiento del motor y capó (CAT: capó a 1,895 m), contrapeso, parachoques al final (voladizo CAT)
  const xC2 = xCola + 0.06; // cara trasera del contrapeso: el parachoques sobresale 6 cm
  const yCap = capo - 0.045;
  M.placa({ nombre: "compartimiento del motor", grupo: "base", pieza: "motor", perfil: [[-4.6, 0.55], [-2.82, 0.55], [-2.82, yCap - 0.12], [-2.97, yCap], [-4.45, yCap], [-4.6, yCap - 0.13]], z: [-1.1, 1.1], bisel: 0.03 });
  M.caja({ nombre: "tapa del motor", grupo: "base", pieza: "motor", centro: [-3.71, yCap + 0.0225, 0], tam: [1.3, 0.045, 1.7] });
  M.placa({ nombre: "contrapeso", grupo: "base", pieza: "motor", perfil: [[xC2, 0.62], [xC2 + 0.08, 0.55], [-4.6, 0.55], [-4.6, yCap - 0.13], [xC2, yCap - 0.13]], z: [-1.24, 1.24], bisel: 0.03 });
  M.caja({ nombre: "parachoques trasero", grupo: "base", pieza: "motor", material: "pinturaGastada", centro: [xCola + 0.15, (md("despeje") + 0.62) / 2, 0], tam: [0.3, 0.62 - md("despeje"), 2.2] });
  M.unir("parachoques trasero", "contrapeso", "soldado"); M.unir("parachoques trasero", "compartimiento del motor", "soldado");
  M.caja({ nombre: "rejilla del radiador", grupo: "base", pieza: "motor", material: "negro", centro: [xC2 - 0.015, 1.25, 0], tam: [0.03, 0.56, 1.5] });
  M.unir("rejilla del radiador", "contrapeso", "empernada");
  // eje trasero
  M.redondo({ nombre: "carcasa eje trasero", grupo: "base", pieza: "motor", material: "acero", F: marcoA([xR, R, 0], [0, 0, 1]), s0: -0.7, s1: 0.7, r: rEje });
  M.redondo({ nombre: "diferencial trasero", grupo: "base", pieza: "motor", material: "acero", F: marcoA([xR, R, 0], [0, 0, 1]), s0: -0.22, s1: 0.22, r: 0.3 });
  M.unir("carcasa eje trasero", "diferencial trasero", "fundido"); M.unir("diferencial trasero", "caja trasera", "muñón del eje");
  ambos((s, l) => {
    rueda(`rueda trasera ${l}`, "base", xR, s, "llantas");
    M.redondo({ nombre: `punta eje trasero ${l}`, grupo: "base", pieza: "llantas", material: "acero", F: marcoA([xR, R, 0], [0, 0, s]), s0: 0.6, s1: zW - 0.1, r: 0.13 });
    for (const n of [`rueda trasera ${l}`, "carcasa eje trasero", `rueda trasera ${l}.maza`]) M.unir(`punta eje trasero ${l}`, n, "maza");
  });
  // guardabarros traseros en arco (el izquierdo termina detrás de la cabina) y su poste sobre la carcasa del eje
  ambos((s, l) => {
    const z = zr(s, 0.66, W / 2 + 0.08);
    const a = tramoArco(`guardabarros trasero ${l} atrás`, "base", xR, -62, -24, z, "motor");
    const b = tramoArco(`guardabarros trasero ${l} arriba`, "base", xR, -24, 8, z, "motor");
    const c = tramoArco(`guardabarros trasero ${l} adelante`, "base", xR, 8, s > 0 ? 30 : 33, z, "motor");
    M.unir(a, b, "soldado"); M.unir(b, c, "soldado");
    if (s < 0) M.unir(c, tramoArco(`guardabarros trasero ${l} delantero bajo`, "base", xR, 33, 58, z, "motor"), "soldado"); // sin cabina encima
    const p = M.caja({ nombre: `poste guardabarros trasero ${l}`, grupo: "base", pieza: "motor", material: "acero", centro: [xR, (R + 0.135 + 2 * R + 0.09) / 2, s * 0.65], tam: [0.08, R + 0.09 - 0.135, 0.06] });
    M.unir(p, b, "soldado"); M.unir(p, "carcasa eje trasero", "soldado");
  });
  // tanques sobre la caja trasera: hidráulico (derecha) y combustible (izquierda, detrás de la cabina)
  M.caja({ nombre: "tanque hidráulico", grupo: "base", pieza: "motor", centro: [-1.95, 1.72, -0.31], tam: [1.2, 0.44, 0.46] });
  M.caja({ nombre: "tanque de combustible", grupo: "base", pieza: "motor", centro: [-2.05, 1.67, 0.29], tam: [1.1, 0.34, 0.42] });
  M.redondo({ nombre: "tapón del tanque", grupo: "base", pieza: "motor", material: "negro", F: marcoA([-1.55, 1.94, -0.31], [0, 1, 0]), s0: 0, s1: 0.05, r: 0.06 });
  M.redondo({ nombre: "tapón de combustible", grupo: "base", pieza: "motor", material: "negro", F: marcoA([-2.45, 1.84, 0.29], [0, 1, 0]), s0: 0, s1: 0.045, r: 0.055 });
  M.redondo({ nombre: "visor de nivel", grupo: "base", pieza: "motor", material: "vidrio", F: marcoA([-2.2, 1.75, -0.54], [0, 0, -1]), s0: 0, s1: 0.012, r: 0.04 });
  // cabina baja de costado (izquierda): cuerpo con chaflán sobre la llanta, ROPS de cuatro postes, vidrios, capota
  const zc = [0.5, 1.2], xc = [-1.06, -0.33], yc0 = 1.56, yc1 = capota - 0.075;
  M.placa({ nombre: "cuerpo de cabina", grupo: "base", pieza: "cabina", perfil: [[-0.78, 0.98], [xc[1], 0.98], [xc[1], yc0], [xc[0], yc0]], z: zc, bisel: 0.025 });
  M.unir("cuerpo de cabina", "caja trasera", "apernada");
  const postes = [];
  for (const [x, z, n] of [[xc[0] + 0.035, zc[0] + 0.035, "trasero interior"], [xc[0] + 0.035, zc[1] - 0.035, "trasero exterior"], [xc[1] - 0.035, zc[0] + 0.035, "delantero interior"], [xc[1] - 0.035, zc[1] - 0.035, "delantero exterior"]]) {
    const p = M.caja({ nombre: `poste ROPS ${n}`, grupo: "base", pieza: "cabina", centro: [x, (yc0 + yc1) / 2, z], tam: [0.07, yc1 - yc0, 0.07] });
    M.unir(p, "cuerpo de cabina", "apernado"); postes.push(p);
  }
  M.caja({ nombre: "capota", grupo: "base", pieza: "cabina", centro: [(xc[0] + xc[1]) / 2, capota - 0.0375, 0.85], tam: [xc[1] - xc[0] + 0.1, 0.075, 0.8] });
  for (const p of postes) M.unir(p, "capota", "apernado");
  const vid = (n, c, t) => { const v = M.caja({ nombre: n, grupo: "base", pieza: "cabina", material: "vidrio", centro: c, tam: t }); M.unir(v, "cuerpo de cabina", "burlete"); M.unir(v, "capota", "burlete"); return v; };
  const yv = (yc0 + yc1) / 2, hv = yc1 - yc0, lx = xc[1] - xc[0] - 0.14, mx = (xc[0] + xc[1]) / 2;
  vid("vidrio frontal", [xc[1] - 0.035, yv, 0.85], [0.015, hv, zc[1] - zc[0] - 0.14]);
  vid("vidrio trasero", [xc[0] + 0.035, yv, 0.85], [0.015, hv, zc[1] - zc[0] - 0.14]);
  vid("vidrio de la puerta", [mx, yv, zc[1] - 0.035], [lx, hv, 0.015]);
  vid("vidrio interior", [mx, yv, zc[0] + 0.035], [lx, hv, 0.015]);
  M.caja({ nombre: "poste de puerta", grupo: "base", pieza: "cabina", centro: [-0.78, yv, zc[1] - 0.035], tam: [0.04, hv, 0.04] });
  for (const n of ["vidrio de la puerta", "cuerpo de cabina", "capota"]) M.unir("poste de puerta", n, "marco de la puerta");
  M.caja({ nombre: "manija de puerta", grupo: "base", pieza: "cabina", material: "negro", centro: [-0.71, 1.86, zc[1] + 0.012], tam: [0.06, 0.03, 0.024] });
  M.unir("manija de puerta", "vidrio de la puerta", "atornillada");
  // malla de protección (FOPS de ventana): marcos planos de poste a poste y barrotes
  for (const [n, y] of [["baja", 1.7], ["alta", 2.2]]) {
    const ml = M.caja({ nombre: `marco malla lateral ${n}`, grupo: "base", pieza: "cabina", material: "acero", centro: [mx, y, zc[1] + 0.0075], tam: [xc[1] - xc[0] - 0.07, 0.03, 0.015] });
    M.unir(ml, "poste ROPS trasero exterior", "soldado"); M.unir(ml, "poste ROPS delantero exterior", "soldado");
    const mf = M.caja({ nombre: `marco malla frontal ${n}`, grupo: "base", pieza: "cabina", material: "acero", centro: [xc[1] + 0.0075, y, 0.85], tam: [0.015, 0.03, zc[1] - zc[0] - 0.07] });
    M.unir(mf, "poste ROPS delantero interior", "soldado"); M.unir(mf, "poste ROPS delantero exterior", "soldado");
  }
  for (const x of [-1.04, -0.92, -0.62, -0.5]) {
    const b = M.barra({ nombre: `barrote malla lateral ${x}`, grupo: "base", pieza: "cabina", material: "acero", de: [x, 1.685, zc[1] + 0.0075], a: [x, 2.215, zc[1] + 0.0075], r: 0.009 });
    M.unir(b, "marco malla lateral baja", "soldado"); M.unir(b, "marco malla lateral alta", "soldado");
  }
  for (const z of [0.7, 0.85, 1.0]) {
    const b = M.barra({ nombre: `barrote malla frontal ${z}`, grupo: "base", pieza: "cabina", material: "acero", de: [xc[1] + 0.0075, 1.685, z], a: [xc[1] + 0.0075, 2.215, z], r: 0.009 });
    M.unir(b, "marco malla frontal baja", "soldado"); M.unir(b, "marco malla frontal alta", "soldado");
  }
  // escalera de acceso bajo la puerta (largueros colgados del cuerpo de la cabina, dos peldaños) y pasamanos
  ambos((s, l) => {
    const x = s > 0 ? -0.74 : -0.42;
    M.caja({ nombre: `larguero escalera ${l}`, grupo: "base", pieza: "cabina", material: "pinturaGastada", centro: [x, 0.71, 1.11], tam: [0.04, 0.58, 0.18] });
    M.unir(`larguero escalera ${l}`, "cuerpo de cabina", "soldado");
  });
  for (const [n, y] of [["bajo", 0.47], ["alto", 0.75]]) {
    const p = M.caja({ nombre: `peldaño ${n}`, grupo: "base", pieza: "cabina", material: "pinturaGastada", centro: [-0.58, y, 1.11], tam: [0.28, 0.035, 0.18] });
    M.unir(p, "larguero escalera i", "soldado"); M.unir(p, "larguero escalera d", "soldado");
  }
  M.barra({ nombre: "pasamanos de cabina", grupo: "base", pieza: "cabina", material: "acero", de: [xc[1] + 0.07, 1.66, zc[1] - 0.035], a: [xc[1] + 0.07, 2.2, zc[1] - 0.035], r: 0.016 });
  for (const y of [1.72, 2.14]) {
    const t = M.caja({ nombre: `soporte pasamanos ${y}`, grupo: "base", pieza: "cabina", material: "acero", centro: [xc[1] + 0.035, y, zc[1] - 0.035], tam: [0.07, 0.03, 0.03] });
    M.unir(t, "pasamanos de cabina", "soldado"); M.unir(t, "poste ROPS delantero exterior", "soldado");
    for (const n of ["marco malla frontal baja", "marco malla frontal alta"]) M.unir(t, n, "cruce con el marco");
  }
  for (const n of ["marco malla frontal baja", "marco malla frontal alta"]) M.unir("pasamanos de cabina", n, "pasa por delante del marco");
  // espejo en el poste delantero exterior, mirando atrás
  M.caja({ nombre: "brazo del espejo", grupo: "base", pieza: "cabina", material: "negro", centro: [xc[1] + 0.06, 2.27, zc[1] - 0.035], tam: [0.12, 0.02, 0.02] });
  M.caja({ nombre: "espejo", grupo: "base", pieza: "cabina", material: "vidrio", centro: [xc[1] + 0.13, 2.25, zc[1] - 0.06], tam: [0.02, 0.16, 0.13] });
  M.unir("espejo", "brazo del espejo", "soldado"); M.unir("brazo del espejo", "poste ROPS delantero exterior", "soldado");
  // focos de trabajo colgados del borde de la capota (no sobresalen de la altura del ROPS)
  for (const [n, x0, x1] of [["foco de trabajo delantero", xc[1] + 0.05, xc[1] + 0.13], ["foco de trabajo trasero", xc[0] - 0.13, xc[0] - 0.05]]) {
    M.caja({ nombre: n, grupo: "base", pieza: "faros", material: "negro", centro: [(x0 + x1) / 2, capota - 0.06, 0.85], tam: [x1 - x0, 0.09, 0.16] });
    M.unir(n, "capota", "soporte empernado");
  }
  // silenciador y escape, filtro de aire, barandas del capó, faros traseros con carcasa y visera
  M.caja({ nombre: "silenciador", grupo: "base", pieza: "motor", material: "negro", centro: [-3.3, capo + 0.09, -0.7], tam: [0.5, 0.18, 0.3] });
  M.redondo({ nombre: "escape", grupo: "base", pieza: "motor", material: "negro", F: marcoA([-3.15, capo + 0.18, -0.7], [0, 1, 0]), s0: -0.01, s1: 0.2, r: 0.05 });
  M.unir("escape", "silenciador", "soldado");
  M.redondo({ nombre: "filtro de aire", grupo: "base", pieza: "motor", material: "negro", F: marcoA([-3.85, capo, 0.62], [0, 1, 0]), s0: 0, s1: 0.24, r: 0.15 });
  ambos((s, l) => {
    M.barra({ nombre: `baranda ${l}`, grupo: "base", pieza: "motor", material: "acero", de: [-4.4, capo + 0.15, s * 1.02], a: [-3.05, capo + 0.15, s * 1.02], r: 0.02 });
    for (const x of [-4.35, -3.72, -3.1]) { const n = M.barra({ nombre: `poste baranda ${l} ${x}`, grupo: "base", pieza: "motor", material: "acero", de: [x, yCap, s * 1.02], a: [x, capo + 0.15, s * 1.02], r: 0.018 }); M.unir(n, `baranda ${l}`, "soldada"); }
    const c = M.redondo({ nombre: `faro trasero ${l}`, grupo: "base", pieza: "faros", material: "negro", F: marcoA([xC2, 1.42, s * 0.95], [-1, 0, 0]), s0: 0, s1: 0.045, r: 0.07 });
    M.redondo({ nombre: `lente trasero ${l}`, grupo: "base", pieza: "faros", material: "luzRoja", F: marcoA([xC2, 1.42, s * 0.95], [-1, 0, 0]), s0: 0.045, s1: 0.052, r: 0.056 });
    M.caja({ nombre: `visera faro trasero ${l}`, grupo: "base", pieza: "faros", material: "acero", centro: [xC2 - 0.03, 1.49 + 0.0075, s * 0.95], tam: [0.06, 0.015, 0.17] });
    M.unir(`visera faro trasero ${l}`, c, "soldada"); M.unir(`visera faro trasero ${l}`, "contrapeso", "soldada");
  });

  // detalle (Anatomy: densidad por estructura, no por textura): lamas, persianas, placas, tapas, extintor
  for (let j = 0; j < 6; j++) {
    const r = M.caja({ nombre: `lama rejilla ${j}`, grupo: "base", pieza: "motor", material: "acero", centro: [xC2 - 0.04, 1.02 + j * 0.092, 0], tam: [0.02, 0.035, 1.42] });
    M.unir(r, "rejilla del radiador", "lama");
  }
  ambos((s, l) => {
    for (let j = 0; j < 6; j++) M.caja({ nombre: `persiana motor ${l} ${j}`, grupo: "base", pieza: "motor", material: "negro", centro: [-4.25 + j * 0.17, 1.42, s * 1.107], tam: [0.09, 0.4, 0.014] });
    M.caja({ nombre: `placa lateral ${l}`, grupo: "base", pieza: "motor", material: "negro", centro: [-3.25, 1.0, s * 1.106], tam: [0.6, 0.2, 0.012] });
    M.caja({ nombre: `tapa de servicio ${l}`, grupo: "base", pieza: "motor", centro: [-4.2, 0.82, s * 1.108], tam: [0.5, 0.34, 0.016] });
  });
  M.redondo({ nombre: "extintor", grupo: "base", pieza: "motor", material: "rojo", F: marcoA([-0.9, 1.5, 0.3], [0, 1, 0]), s0: 0, s1: 0.42, r: 0.075, extremos: ["plano", "domo"] });

  // topes de la articulación: a ±giro la cara del tope delantero llega a la del trasero (plano x = −0,30 m)
  const cg = Math.cos(rad(giro)), sg = Math.sin(rad(giro)), yT = [1.1, 1.25];
  ambos((s, l) => {
    M.losa({ nombre: `tope articulación trasero ${l}`, grupo: "base", pieza: "articulacion", material: "acero", perfil: [[-0.44, s * 0.12], [-0.3, s * 0.12], [-0.3, s * 0.45], [-0.44, s * 0.45]], y: yT });
    M.unir(`tope articulación trasero ${l}`, "poste del enganche", "soldado");
    const xz = (z) => (-0.3 + sg * z) / cg; // cara trasera del tope delantero, en el marco del bastidor delantero
    M.losa({ nombre: `tope articulación delantero ${l}`, grupo: "delantero", pieza: "articulacion", material: "acero", perfil: [[xz(0.3), s * 0.3], [xz(0.5), s * 0.5], [fx(0.32), s * 0.5], [fx(0.32), s * 0.3]], y: yT });
  });

  // ───────────────────────── bastidor delantero
  for (const [n, y] of [["lengüeta inferior", [0.64, 0.74]], ["lengüeta superior", [1.26, 1.36]]]) {
    M.losa({ nombre: n, grupo: "delantero", pieza: "articulacion", material: "acero", perfil: [[-0.18, -0.18], [0.04, -0.3], [fx(0.38), -0.3], [fx(0.38), 0.3], [0.04, 0.3], [-0.18, 0.18]], y });
  }
  for (const [n, yc, nn] of [["pasador articulación inferior", 0.62, ["placa enganche inferior", "lengüeta inferior", "cubo enganche inferior"]], ["pasador articulación superior", 1.37, ["placa enganche superior", "lengüeta superior", "cubo enganche superior"]]]) {
    M.pasador({ nombre: n, grupo: "base", pieza: "articulacion", punto: [0, yc, 0], eje: [0, 1, 0], r: 0.075, largo: 0.27, une: nn });
  }
  M.unir("pasador articulación superior.tapa+", "cubo enganche superior", "tapa apoyada"); M.unir("pasador articulación inferior.tapa-", "cubo enganche inferior", "tapa apoyada");
  M.caja({ nombre: "puente de torres", grupo: "delantero", pieza: "brazo", centro: [fx(0.51), 1.17, 0], tam: [0.42, 0.38, 1.22] });
  M.caja({ nombre: "caja delantera", grupo: "delantero", pieza: "articulacion", centro: [(0.4 + fx(1.62)) / 2, 0.91, 0], tam: [fx(1.62) - 0.4, 0.42, 0.5] });
  M.unir("caja delantera", "puente de torres", "soldado"); M.unir("lengüeta inferior", "caja delantera", "soldada"); M.unir("lengüeta superior", "puente de torres", "soldada");
  M.unir("lengüeta inferior", "puente de torres", "soldada");
  ambos((s, l) => {
    const tx = P0[0] - fx(0.45), ty = P0[1] - 1.89; // la torre sigue al pivote de los brazos
    M.placa({ nombre: `torre ${l}`, grupo: "delantero", pieza: "brazo", perfil: fxp([[0.3, 0.95], [0.72, 0.95], [0.72, 1.6 + ty], [0.66, 2.03 + ty], [0.45, 2.13 + ty], [0.26, 2.03 + ty], [0.24, 1.8 + ty]]).map(([x, y]) => [x + tx, y]), z: zr(s, 0.61, 0.69) });
    M.unir(`tope articulación delantero ${l}`, "puente de torres", "soldado"); M.unir(`tope articulación delantero ${l}`, `torre ${l}`, "soldado");
  });
  M.redondo({ nombre: "carcasa eje delantero", grupo: "delantero", pieza: "articulacion", material: "acero", F: marcoA([xF, R, 0], [0, 0, 1]), s0: -0.7, s1: 0.7, r: rEje });
  M.redondo({ nombre: "diferencial delantero", grupo: "delantero", pieza: "articulacion", material: "acero", F: marcoA([xF, R, 0], [0, 0, 1]), s0: -0.22, s1: 0.22, r: 0.3 });
  M.unir("carcasa eje delantero", "diferencial delantero", "fundido"); M.unir("carcasa eje delantero", "caja delantera", "eje empernado"); M.unir("diferencial delantero", "caja delantera", "eje empernado");
  ambos((s, l) => {
    rueda(`rueda delantera ${l}`, "delantero", xF, s, "llantas");
    M.redondo({ nombre: `punta eje delantero ${l}`, grupo: "delantero", pieza: "llantas", material: "acero", F: marcoA([xF, R, 0], [0, 0, s]), s0: 0.6, s1: zW - 0.1, r: 0.13 });
    for (const n of [`rueda delantera ${l}`, "carcasa eje delantero", `rueda delantera ${l}.maza`]) M.unir(`punta eje delantero ${l}`, n, "maza");
    // guardabarros en arco: el tramo de atrás va soldado a la torre; un poste lo sostiene sobre la carcasa del eje
    const z = zr(s, 0.66, W / 2 + 0.08);
    const a = tramoArco(`guardabarros delantero ${l} atrás`, "delantero", xF, -58, -20, z, "llantas");
    const b = tramoArco(`guardabarros delantero ${l} arriba`, "delantero", xF, -20, 22, z, "llantas");
    const c = tramoArco(`guardabarros delantero ${l} adelante`, "delantero", xF, 22, 58, z, "llantas");
    M.unir(a, b, "soldado"); M.unir(b, c, "soldado"); M.unir(a, `torre ${l}`, "soldado");
    const p = M.caja({ nombre: `poste guardabarros delantero ${l}`, grupo: "delantero", pieza: "llantas", material: "acero", centro: [xF, (R + 0.135 + 2 * R + 0.09) / 2, s * 0.65], tam: [0.08, R + 0.09 - 0.135, 0.06] });
    M.unir(p, b, "soldado"); M.unir(p, "carcasa eje delantero", "soldado");
    // faro de trabajo delantero: carcasa, lente, visera y soporte sobre el guardabarros (la luz de la escena va
    // 2 cm delante de la lente, en x = 2,32)
    const zf = s * 1.08, cf = [2.13, 1.93, zf];
    const h = M.redondo({ nombre: `faro delantero ${l}`, grupo: "delantero", pieza: "faros", material: "negro", F: marcoA(cf, [1, 0, 0]), s0: 0, s1: 0.16, r: 0.085 });
    M.redondo({ nombre: `lente delantero ${l}`, grupo: "delantero", pieza: "faros", material: "luz", F: marcoA(cf, [1, 0, 0]), s0: 0.16, s1: 0.17, r: 0.068 });
    M.caja({ nombre: `visera faro delantero ${l}`, grupo: "delantero", pieza: "faros", material: "acero", centro: [2.235, 1.93 + 0.085 + 0.0075, zf], tam: [0.17, 0.015, 0.2] });
    const yGb = R + Math.sqrt((R + 0.11) ** 2 - (2.21 - xF) ** 2) - 0.02; // cara del guardabarros bajo el faro
    M.caja({ nombre: `soporte faro delantero ${l}`, grupo: "delantero", pieza: "faros", material: "acero", centro: [2.21, (yGb + 1.86) / 2, zf], tam: [0.08, 1.86 - yGb, 0.06] });
    M.unir(`visera faro delantero ${l}`, h, "soldada"); M.unir(`soporte faro delantero ${l}`, h, "abrazadera"); M.unir(`soporte faro delantero ${l}`, c, "empernado al guardabarros");
  });
  // nariz baja e inclinada (con el brazo abajo, la palanca y el travesaño quedan justo encima)
  M.placa({ nombre: "bloque de nariz", grupo: "delantero", pieza: "articulacion", perfil: fxp([[1.62, 0.62], [1.78, 0.46], [1.98, 0.46], [2.0, 0.6], [1.62, 1.1]]), z: [-0.24, 0.24], bisel: 0.02 });
  for (const n of ["caja delantera", "diferencial delantero", "carcasa eje delantero"]) M.unir("bloque de nariz", n, "eje empernado");
  const BL = [fx(1.98), 0.74]; // pasador base de los cilindros de levante: bajo el travesaño con el brazo en el piso (0,78 → 0,74 al bajar el pivote)
  const hn = {};
  ambos((s, l) => {
    const perf = orejaA([[BL[0], BL[1], 0.105], [BL[0] - 0.16, 0.5, 0.02], [BL[0] + 0.02, 0.5, 0.02]]);
    const a = M.placa({ nombre: `horquilla nariz int ${l}`, grupo: "delantero", pieza: "cilindros", perfil: perf, z: zr(s, 0.24, 0.3) });
    const b = M.placa({ nombre: `horquilla nariz ext ${l}`, grupo: "delantero", pieza: "cilindros", perfil: perf, z: zr(s, 0.415, 0.455) });
    const c = M.caja({ nombre: `puente horquilla ${l}`, grupo: "delantero", pieza: "cilindros", centro: [BL[0] - 0.07, 0.505, s * 0.385], tam: [0.16, 0.05, 0.14] });
    for (const q of [a, b]) M.unir(q, c, "soldada");
    M.unir(c, "bloque de nariz", "soldada"); M.unir(a, "bloque de nariz", "soldada");
    hn[l] = [a, b, c];
  });

  // ───────────────────────── brazos y barra en Z
  ambos((s, l) => {
    M.placa({ nombre: `brazo ${l}`, grupo: "brazo", pieza: "brazo", perfil: orejaA([[P0[0], P0[1], 0.2], [K0[0], K0[1], 0.12], [P0[0] + (1.45 * La) / 3, P0[1] + 0.03, 0.17]]), z: zr(s, 0.47, 0.59), bisel: 0.02 });
    M.pasador({ nombre: `pasador brazo ${l}`, grupo: "delantero", pieza: "brazo", punto: [P0[0], P0[1], s * 0.58], eje: [0, 0, 1], r: 0.07, largo: 0.26, une: [`brazo ${l}`, `torre ${l}`] });
  });
  M.redondo({ nombre: "travesaño", grupo: "brazo", pieza: "brazo", F: marcoA([CB[0], CB[1], 0], [0, 0, 1]), s0: -0.47, s1: 0.47, r: 0.11 });
  M.unir("travesaño", "brazo i", "soldado"); M.unir("travesaño", "brazo d", "soldado");
  ambos((s, l) => {
    M.placa({ nombre: `oreja palanca ${l}`, grupo: "brazo", pieza: "cilindros", perfil: orejaA([[C0[0], C0[1], 0.12], [CB[0], CB[1], 0.11]]), z: zr(s, 0.2, 0.25) });
    M.unir(`oreja palanca ${l}`, "travesaño", "soldado");
  });
  // palanca en V (la barra en Z): un tramo alto (T–C) y uno bajo (C–D), dos convexos de una misma pieza fundida
  ambos((s, l) => {
    M.placa({ nombre: `palanca ${l}`, grupo: "palanca", pieza: "cilindros", perfil: orejaA([[T0[0], T0[1], 0.1], [C0[0], C0[1], 0.12]]), z: zr(s, 0.12, 0.18), bisel: 0.015 });
    M.placa({ nombre: `palanca baja ${l}`, grupo: "palanca", pieza: "cilindros", perfil: orejaA([[C0[0], C0[1], 0.12], [D0[0], D0[1], 0.1]]), z: zr(s, 0.12, 0.18), bisel: 0.015 });
    M.unir(`palanca ${l}`, `palanca baja ${l}`, "fundida");
  });
  M.pasador({ nombre: "pasador palanca", grupo: "brazo", pieza: "cilindros", punto: [C0[0], C0[1], 0], eje: [0, 0, 1], r: pin.r, largo: 0.5, une: ["palanca i", "palanca d", "palanca baja i", "palanca baja d", "oreja palanca i", "oreja palanca d"] });
  M.placa({ nombre: "biela", grupo: "biela", pieza: "cilindros", perfil: orejaA([[D0[0], D0[1], 0.095], [E0[0], E0[1], 0.095]]), z: [-0.09, 0.09], bisel: 0.015 });
  M.pasador({ nombre: "pasador biela", grupo: "palanca", pieza: "cilindros", punto: [D0[0], D0[1], 0], eje: [0, 0, 1], r: pin.r, largo: 0.36, une: ["palanca baja i", "palanca baja d", "biela"] });

  // ───────────────────────── cucharón (metros desde el pasador, cucharón a nivel con el brazo horizontal)
  // CAT: 2,60 m sobre la cuchilla, 2,723 m con los cortadores laterales. Laterales de 4 cm. Perfil: pasador a 1,9 m de
  // la punta de los dientes (cotas 3, 4, 9 y 14 de la pág. 13); espalda alta hasta 1,44 m con guardaderrames (cota 2) y
  // piso 0,36 m bajo el pasador: capacidad colmada ≈ 4,4 m³ (6 yd³).
  const eLat = 0.04, zi = anchoC / 2 - eLat; // ancho interior / 2
  const perfil = { piso0: [0.3, yF], piso1: [1.62, yF], labio: [1.69, yF + 0.09], frente: [1.25, 0.85], espalda: [0.2, 1.44], media: [0.12, 0.42], talon: [0.15, -0.14] };
  const pf = perfil;
  const perfLado = [pf.piso0, pf.piso1, pf.labio, pf.frente, pf.espalda, pf.media, pf.talon].map(([x, y]) => k(x, y));
  ambos((s, l) => M.placa({ nombre: `lateral cucharón ${l}`, grupo: "cucharon", pieza: "cucharon", material: "pinturaGastada", perfil: perfLado, z: zr(s, zi, anchoC / 2), bisel: 0.012 }));
  const plancha = (n, a, b, e = 0.05) => M.placa({ nombre: n, grupo: "cucharon", pieza: "cucharon", material: "pinturaGastada", perfil: tiraA(a, b, e, -1), z: [-zi, zi], bisel: 0.01 });
  plancha("piso del cucharón", k(...pf.piso1), k(...pf.piso0), 0.06);
  plancha("talón", k(...pf.piso0), k(...pf.talon));
  plancha("espalda baja", k(...pf.talon), k(...pf.media));
  plancha("espalda alta", k(...pf.media), k(...pf.espalda));
  M.unir("piso del cucharón", "talón", "soldadura"); M.unir("talón", "espalda baja", "soldadura"); M.unir("espalda baja", "espalda alta", "soldadura");
  for (const n of ["piso del cucharón", "talón", "espalda baja", "espalda alta"]) ambos((s, l) => M.unir(n, `lateral cucharón ${l}`, "soldadura"));
  // labio: cuchilla biselada, 6 adaptadores soldados con su punta y pasador de retención, 5 protectores de labio
  M.placa({ nombre: "cuchilla", grupo: "cucharon", pieza: "cucharon", material: "acero", perfil: [k(1.4, yF), k(1.74, yF + 0.012), k(1.74, yF + 0.042), k(1.4, yF + 0.096)], z: [-zi, zi] });
  M.unir("cuchilla", "piso del cucharón", "soldadura");
  ambos((s, l) => M.unir("cuchilla", `lateral cucharón ${l}`, "soldadura"));
  const zD = (i) => -zi + 0.2 + (i * (2 * zi - 0.4)) / 5, paso = (2 * zi - 0.4) / 5;
  for (let i = 0; i < 6; i++) {
    const z = zD(i);
    const ad = M.placa({ nombre: `adaptador ${i + 1}`, grupo: "cucharon", pieza: "cucharon", material: "acero", perfil: [k(1.56, yF - 0.014), k(1.8, yF), k(1.8, yF + 0.054), k(1.56, yF + 0.126)], z: [z - 0.06, z + 0.06], bisel: 0.008 });
    const di = M.placa({ nombre: `diente ${i + 1}`, grupo: "cucharon", pieza: "cucharon", material: "acero", perfil: [k(1.78, yF + 0.002), k(punta, yF + 0.017), k(punta, yF + 0.031), k(1.78, yF + 0.052)], z: [z - 0.05, z + 0.05], bisel: 0.006 });
    const pd = M.redondo({ nombre: `pasador diente ${i + 1}`, grupo: "cucharon", pieza: "cucharon", material: "acero", F: marcoA([...k(1.79, yF + 0.026), z], [0, 0, 1]), s0: -0.068, s1: 0.068, r: 0.011, lados: 8 });
    M.unir(ad, "cuchilla", "adaptador soldado"); M.unir(ad, "piso del cucharón", "adaptador soldado"); M.unir(di, ad, "punta encajada"); M.unir(pd, ad, "pasador de retención"); M.unir(pd, di, "pasador de retención");
    if (i < 5) {
      const zp = z + paso / 2;
      const pl = M.placa({ nombre: `protector de labio ${i + 1}`, grupo: "cucharon", pieza: "cucharon", material: "acero", perfil: [k(1.62, yF - 0.005), k(1.8, yF + 0.007), k(1.8, yF + 0.036), k(1.62, yF + 0.084)], z: [zp - paso / 2 + 0.075, zp + paso / 2 - 0.075], bisel: 0.006 });
      M.unir(pl, "cuchilla", "empernado al labio"); M.unir(pl, "piso del cucharón", "empernado al labio");
    }
  }
  ambos((s, l) => {
    M.placa({ nombre: `cortador lateral ${l}`, grupo: "cucharon", pieza: "cucharon", material: "acero", perfil: [k(1.36, yF), k(1.66, yF), k(1.72, yF + 0.1), k(1.5, 0.3)], z: zr(s, anchoC / 2, md("anchoConCucharon") / 2), bisel: 0.008 });
    M.unir(`cortador lateral ${l}`, `lateral cucharón ${l}`, "empernado");
    // placas de desgaste laterales (barras soldadas en la cara exterior, detrás del cortador, como en Cobar)
    for (const [j, y] of [[0, yF + 0.1], [1, yF + 0.28], [2, yF + 0.46]]) {
      M.placa({ nombre: `placa desgaste lateral ${l} ${j}`, grupo: "cucharon", pieza: "cucharon", material: "acero", perfil: [k(0.4, y), k(1.28, y), k(1.28, y + 0.06), k(0.4, y + 0.06)], z: zr(s, anchoC / 2, anchoC / 2 + 0.022), bisel: 0.006 });
      M.unir(`placa desgaste lateral ${l} ${j}`, `lateral cucharón ${l}`, "soldada");
    }
  });
  // bajo el piso: barras de desgaste (CAT: «sacrificial wear strip package») y protectores de talón (heel shrouds)
  for (let j = 0; j < 5; j++) {
    const z = (j - 2) * 0.475;
    M.placa({ nombre: `barra de desgaste ${j + 1}`, grupo: "cucharon", pieza: "cucharon", material: "acero", perfil: [k(0.42, yPiso), k(1.38, yPiso), k(1.38, yF + 0.01), k(0.42, yF + 0.01)], z: [z - 0.05, z + 0.05], bisel: 0.006 });
    M.unir(`barra de desgaste ${j + 1}`, "piso del cucharón", "soldada");
  }
  // protector de talón: envuelve la esquina exterior piso–talón; sus puntos interiores quedan dentro del espesor de
  // las planchas (no asoma dentro del cucharón)
  const Aq = k(...pf.piso0), Tq = k(...pf.talon), Lq = Math.hypot(Tq[0] - Aq[0], Tq[1] - Aq[1]);
  const uq = [(Tq[0] - Aq[0]) / Lq, (Tq[1] - Aq[1]) / Lq], nq = [-uq[1], uq[0]]; // a lo largo del talón · normal hacia afuera
  const enQ = (a, b) => [Aq[0] + uq[0] * a + nq[0] * b, Aq[1] + uq[1] * a + nq[1] * b];
  const perfTalon = [[Aq[0] + 0.07, Aq[1] + 0.01], [Aq[0] + 0.14, Aq[1] - eDes], enQ(0, 0.035), enQ(0.126, 0.03), enQ(0.08, -0.005)]; // patas cortas: la cuerda interior pasa a 3,9 cm de la esquina (planchas de 5–6 cm)
  for (const z of [-1.1, -0.22, 0.22, 1.1]) {
    M.placa({ nombre: `protector de talón ${z}`, grupo: "cucharon", pieza: "cucharon", material: "acero", perfil: perfTalon, z: [z - 0.08, z + 0.08], bisel: 0.008 });
    for (const n of ["piso del cucharón", "talón", "espalda baja"]) M.unir(`protector de talón ${z}`, n, "soldado");
  }
  // espalda: refuerzos horizontales por fuera (fuera de la zona de brazos y biela), guarda superior, orejas de izaje
  const enEspalda = (y) => [pf.media[0] + ((pf.espalda[0] - pf.media[0]) * (y - pf.media[1])) / (pf.espalda[1] - pf.media[1]), y];
  ambos((s, l) => {
    M.placa({ nombre: `refuerzo espalda ${l}`, grupo: "cucharon", pieza: "cucharon", material: "pinturaGastada", perfil: tiraA(k(...enEspalda(0.62)), k(...enEspalda(0.8)), 0.08, 1), z: zr(s, 0.7, zi), bisel: 0.01 });
    M.unir(`refuerzo espalda ${l}`, "espalda alta", "soldado"); M.unir(`refuerzo espalda ${l}`, `lateral cucharón ${l}`, "soldado");
  });
  M.redondo({ nombre: "guarda superior", grupo: "cucharon", pieza: "cucharon", material: "pinturaGastada", F: marcoA([...k(pf.espalda[0] + 0.02, pf.espalda[1]), 0], [0, 0, 1]), s0: -anchoC / 2, s1: anchoC / 2, r: 0.06 });
  for (const n of ["espalda alta", "lateral cucharón i", "lateral cucharón d"]) M.unir("guarda superior", n, "soldada");
  ambos((s, l) => {
    const t = 0.55, q = [pf.frente[0] + (pf.espalda[0] - pf.frente[0]) * t, pf.frente[1] + (pf.espalda[1] - pf.frente[1]) * t];
    M.placa({ nombre: `oreja de izaje ${l}`, grupo: "cucharon", pieza: "cucharon", material: "acero", perfil: orejaA([[...k(q[0], q[1] + 0.035), 0.045], [...k(q[0] - 0.08, q[1] - 0.06), 0.02], [...k(q[0] + 0.08, q[1] - 0.08), 0.02]]), z: zr(s, anchoC / 2 - 0.035, anchoC / 2 - 0.005) });
    M.unir(`oreja de izaje ${l}`, `lateral cucharón ${l}`, "soldada");
  });
  ambos((s, l) => {
    // orejas: su borde corre paralelo a la espalda, dentro del espesor de la plancha (no asoman dentro del cucharón)
    const perfOreja = [[K0[0] - 0.16, K0[1] - 0.06], [K0[0] - 0.06, K0[1] - 0.16], k(0.17, -0.12), k(0.15, 0.25), [K0[0] - 0.06, K0[1] + 0.16], [K0[0] - 0.16, K0[1] + 0.06]];
    const a = M.placa({ nombre: `oreja brazo int ${l}`, grupo: "cucharon", pieza: "cucharon", perfil: perfOreja, z: zr(s, 0.42, 0.46) });
    const b = M.placa({ nombre: `oreja brazo ext ${l}`, grupo: "cucharon", pieza: "cucharon", perfil: perfOreja, z: zr(s, 0.6, 0.64) });
    for (const o of [a, b]) for (const n of ["talón", "espalda baja", "piso del cucharón"]) M.unir(o, n, "soldada");
    M.pasador({ nombre: `pasador cucharón ${l}`, grupo: "brazo", pieza: "cucharon", punto: [K0[0], K0[1], s * 0.53], eje: [0, 0, 1], r: 0.07, largo: 0.26, une: [a, b, `brazo ${l}`] });
    const c = M.placa({ nombre: `oreja biela ${l}`, grupo: "cucharon", pieza: "cucharon", perfil: orejaA([[E0[0], E0[1], 0.11], [...k(0.15, 0.1), 0.02], [...k(0.145, 0.4), 0.02]]), z: zr(s, 0.115, 0.165) });
    for (const n of ["espalda baja", "espalda alta"]) M.unir(c, n, "soldada");
  });
  M.pasador({ nombre: "pasador biela-cucharón", grupo: "cucharon", pieza: "cilindros", punto: [E0[0], E0[1], 0], eje: [0, 0, 1], r: pin.r, largo: 0.35, une: ["oreja biela i", "oreja biela d", "biela"] });

  // ───────────────────────── cilindros
  // levante: de la nariz al muñón del brazo (a 0,6 m del pivote: razón de largos 1,49, dentro de la carrera)
  const BO = [P0[0] + 0.6, P0[1]];
  ambos((s, l) => {
    M.cilindro({ nombre: `cilindro levante ${l}`, pieza: "cilindros", de: { grupo: "delantero", punto: [BL[0], BL[1], s * 0.36] }, a: { grupo: "brazo", punto: [BO[0], BO[1], s * 0.36] }, eje: [0, 0, 1],
      rBarril: 0.095, rVastago: 0.055, rOjo: 0.095, anchoOjo: 0.085, inicioTubo: 0.14, ladoPuertos: [0, -1, 0], portado: "pasador", banjos: [-s],
      // base: pasador en la horquilla de la nariz (sin tapas: retenido por perno); vástago: muñón que sale de la cara interior del brazo
      pasadores: { r: 0.045, centroDe: [BL[0], BL[1], s * 0.35], largoDe: 0.21, uneDe: hn[l].slice(0, 2), tapasDe: false, centroA: [BO[0], BO[1], s * 0.43], largoA: 0.32, uneA: [`brazo ${l}`], tapasA: s } });
  });
  // volteo: de las orejas sobre el puente de torres (junto al pivote de los brazos: subir el brazo cambia poco su largo;
  // búsqueda numérica, razón máx/mín 1,10) a la punta superior de la palanca
  const BV = op.BV || [P0[0] - 0.03, P0[1] - 0.09]; // junto al pivote de los brazos (como en el diseño original)
  ambos((s, l) => M.placa({ nombre: `oreja volteo ${l}`, grupo: "delantero", pieza: "cilindros", perfil: orejaA([[BV[0], BV[1], 0.12], [fx(0.3), 1.33, 0.02], [fx(0.5), 1.33, 0.02]]), z: zr(s, 0.11, 0.16) }));
  ambos((s, l) => { M.unir(`oreja volteo ${l}`, "puente de torres", "soldada"); M.unir(`oreja volteo ${l}`, "lengüeta superior", "soldada"); });
  M.cilindro({ nombre: "cilindro volteo", pieza: "cilindros", de: { grupo: "delantero", punto: [BV[0], BV[1], 0] }, a: { grupo: "palanca", punto: [T0[0], T0[1], 0] }, eje: [0, 0, 1],
    rBarril: 0.115, rVastago: 0.065, rOjo: 0.1, anchoOjo: 0.2, inicioTubo: 0.15, ladoPuertos: [0, 1, 0], portado: "pasador", banjos: [1, -1], pasadores: { r: pin.r, largoDe: 0.34, largoA: 0.38, uneDe: ["oreja volteo i", "oreja volteo d"], uneA: ["palanca i", "palanca d"], tapasDe: false } });
  // dirección: pasadores verticales; base en la caja trasera, vástago en la caja delantera (búsqueda numérica: no cruzan
  // el enganche ni tocan las llantas en ±42,5°, razón 1,57)
  const yD = 0.86, BD = [-1.0, 0.62], RD = [0.45, 0.36];
  ambos((s, l) => {
    const perfT = orejaA([[BD[0], s * BD[1], 0.085], [-1.15, s * 0.55, 0.07]]);
    M.losa({ nombre: `oreja dirección trasera sup ${l}`, grupo: "base", pieza: "articulacion", perfil: perfT, y: [yD + 0.055, yD + 0.075] });
    M.losa({ nombre: `oreja dirección trasera inf ${l}`, grupo: "base", pieza: "articulacion", perfil: perfT, y: [yD - 0.075, yD - 0.055] });
    M.caja({ nombre: `alma dirección trasera ${l}`, grupo: "base", pieza: "articulacion", centro: [-1.17, (yD - 0.075 + R + rEje) / 2, s * 0.55], tam: [0.06, R + rEje - (yD - 0.075), 0.14] });
    M.unir(`alma dirección trasera ${l}`, `oreja dirección trasera sup ${l}`, "soldada"); M.unir(`alma dirección trasera ${l}`, `oreja dirección trasera inf ${l}`, "soldada");
    const perfD = orejaA([[RD[0], s * RD[1], 0.085], [0.55, s * 0.22, 0.04]]);
    M.losa({ nombre: `oreja dirección delantera sup ${l}`, grupo: "delantero", pieza: "articulacion", perfil: perfD, y: [yD + 0.055, yD + 0.075] });
    M.losa({ nombre: `oreja dirección delantera inf ${l}`, grupo: "delantero", pieza: "articulacion", perfil: perfD, y: [yD - 0.075, yD - 0.055] });
    for (const n of ["sup", "inf"]) M.unir(`oreja dirección delantera ${n} ${l}`, "caja delantera", "soldada");
    M.cilindro({ nombre: `cilindro dirección ${l}`, pieza: "articulacion", de: { grupo: "base", punto: [BD[0], yD, s * BD[1]] }, a: { grupo: "delantero", punto: [RD[0], yD, s * RD[1]] }, eje: [0, 1, 0],
      rBarril: 0.06, rVastago: 0.032, rOjo: 0.065, anchoOjo: 0.1, guia: 0.12, inicioTubo: 0.105, puertos: false,
      pasadores: { r: 0.03, largo: 0.17, uneDe: [`oreja dirección trasera sup ${l}`, `oreja dirección trasera inf ${l}`], uneA: [`oreja dirección delantera sup ${l}`, `oreja dirección delantera inf ${l}`] } });
  });

  // ───────────────────────── puertos y mangueras
  const racor = (n, grupo, punto, normal, base) => {
    const p = M.redondo({ nombre: `racor ${n}`, grupo, pieza: "cilindros", material: "laton", F: marcoA(punto, normal), s0: -0.05, s1: 0.0, r: 0.028, lados: 8 });
    M.unir(p, base, "racor roscado");
    M.puerto(n, { grupo, punto, normal, pieza: p, reorientar: true });
    return n;
  };
  // volteo: del techo del puente de torres a los banjos del pasador base (sobre el eje de la bisagra del cilindro)
  racor("frente volteo A", "delantero", [fx(0.66), 1.41, 0.26], [0, 1, 0], "puente de torres");
  racor("frente volteo B", "delantero", [fx(0.66), 1.41, -0.26], [0, 1, 0], "puente de torres");
  M.manguera({ nombre: "manguera volteo A", de: "frente volteo A", a: "cilindro volteo.banjo+", r: 0.015, holgura: 0.03 });
  M.manguera({ nombre: "manguera volteo B", de: "frente volteo B", a: "cilindro volteo.banjo-", r: 0.015, holgura: 0.03 });
  // levante: del techo de la nariz al banjo del pasador base, por dentro (el brazo bajado pasa por fuera, sobre la horquilla)
  ambos((s, l) => {
    racor(`frente levante ${l}`, "delantero", [fx(1.8), 0.913, s * 0.215], [0, 1, 0], "bloque de nariz");
    M.manguera({ nombre: `manguera levante ${l}`, de: `frente levante ${l}`, a: `cilindro levante ${l}.banjo${s > 0 ? "-" : "+"}`, r: 0.016, holgura: 0.0, seno: [0, 1, 0] });
  });
  // cruzan la articulación junto a su eje: del poste del enganche a la cara trasera de la caja delantera, en lazo
  // (dos alturas: el haz que se ve en las fotos entre los bastidores)
  for (const [z, y, n] of [[0.1, 1.05, "i"], [-0.1, 1.05, "d"], [0.04, 1.12, "alta i"], [-0.04, 1.12, "alta d"]]) {
    racor(`enganche ${n}`, "base", [-0.39, y, z], [1, 0, 0], "poste del enganche");
    racor(`caja ${n}`, "delantero", [0.35, y, z], [-1, 0, 0], "caja delantera");
    M.manguera({ nombre: `manguera articulación ${n}`, de: `enganche ${n}`, a: `caja ${n}`, r: 0.017 });
  }

  // ───────────────────────── envolvente de trabajo y dimensionado
  // El cucharón no llega a cualquier ángulo con cualquier altura: el cilindro de volteo está en el bastidor y la palanca
  // en el brazo. Envolvente de trabajo (ángulo absoluto β = brazo + cucharón): de −45° (descarga) a +45° (recogido),
  // dentro del rango de la barra en Z. Los cilindros se dimensionan con ella y el juez la recorre entera.
  // Descarga a −45°: ángulo de descarga con el brazo arriba del dibujo CAT (AEHQ6374-01, pág. 13; antes −48°, estimado).
  const bDesc = md("descargaAngulo");
  const envolvente = (a) => [Math.max(rango.cucharon[0], -bDesc - a), Math.min(rango.cucharon[1], 45 - a)];
  const muestras = [];
  for (let a = rango.brazo[0]; a <= rango.brazo[1] + 1e-9; a += (rango.brazo[1] - rango.brazo[0]) / 8) {
    const [f0, f1] = envolvente(a);
    for (let f = f0; f <= f1 + 1e-9; f += (f1 - f0) / 6) for (const g of [-giro, 0, giro]) muestras.push({ brazo: a, cucharon: f, delantero: g });
  }
  M.envolvente = envolvente;
  // el fondo del cucharón raspa el piso al cargar: contacto real con la roca (tolerancia del juez «tocaRoca»)
  for (const p of M.piezas) if (p.grupo === "cucharon" && /^(piso del cucharón|talón|cuchilla|diente|adaptador|pasador diente|protector|barra de desgaste)/.test(p.nombre)) p.tocaRoca = true;
  // la llanta (0,48 m) es más ancha que la huella del piso (0,32 m, kit/contrato.js → huellasDe): sus cantos apoyan en el
  // hombro de la huella. Contacto real; el apoyo y el hundimiento de cada rueda los juzga la línea «ruedas»
  for (const p of M.piezas) if (p.tipo === "llanta") p.tocaRoca = true;
  M.dimensionar(muestras);
  // codos: el racor del bastidor apunta al banjo (manguera casi recta, sin dobleces en U)
  M.puertos.get("frente volteo A").hacia = "cilindro volteo.banjo+"; M.puertos.get("frente volteo B").hacia = "cilindro volteo.banjo-";
  ambos((s, l) => { const bj = `cilindro levante ${l}.banjo${s > 0 ? "-" : "+"}`; M.puertos.get(`frente levante ${l}`).hacia = bj; M.puertos.get(bj).hacia = `frente levante ${l}`; });
  M.puertos.get("cilindro volteo.banjo+").hacia = "frente volteo A"; M.puertos.get("cilindro volteo.banjo-").hacia = "frente volteo B";
  M.orientarPuertos({ brazo: 5, cucharon: 0 });
  M.dimensionarMangueras(muestras);
  // carga (material suelto de la escena): sobre el piso del cucharón, entre la espalda y el labio
  const cargaCucharon = { centro: [k(0.85, 0)[0], k(0, yF)[1] + 0.32, 0], largo: 1.35, ancho: 2 * zi * 0.9 };
  M.dims = { rueda: D, ejes: xF - xR, ancho: W, capota, anchoCucharon: anchoC, xF, xR, xCola, P0, K0, La, rango, giro, R, yF, perfil, eLat, cargaCucharon };
  M.muestrasRango = muestras;
  return M;
}

/** Ángulo del cucharón (relativo al brazo) que lo deja a nivel con el piso. */
export const nivelScoop = (brazo) => -brazo;

/**
 * Medidas del modelo, para compararlas con MEDIDAS_SCOOP (juez · fidelidad).
 * A, B y C son las cotas de la fig. 2.3 de Osorio Bazán (2021): brazo arriba y cucharón en descarga.
 */
export function medirScoop(M) {
  const d = M.dims;
  const ext = (pose, filtro, eje, f) => { let v = f === "max" ? -Infinity : Infinity; for (const c of M.cascos(pose)) if (filtro(c.p)) for (const q of c.puntos) v = f === "max" ? Math.max(v, q[eje]) : Math.min(v, q[eje]); return v; };
  const desc = M.posar({ brazo: d.rango.brazo[1], cucharon: M.envolvente(d.rango.brazo[1])[0] });
  const C = ext(desc, (p) => p.grupo === "cucharon", 1, "max");
  const B = ext(desc, (p) => p.nombre === "cuchilla" || p.nombre.startsWith("diente"), 1, "min");
  const A = ext(desc, (p) => p.nombre.startsWith("diente") || p.nombre === "cuchilla", 0, "max") - ext(desc, (p) => p.nombre.startsWith("rueda delantera"), 0, "max");
  // capacidad colmada (SAE J742): al ras (perfil interior cerrado por la línea de ras × ancho interior) + colmo a 2:1
  const pf = d.perfil, poly = [pf.labio, pf.espalda, pf.media, pf.talon, pf.piso0, pf.piso1];
  let area = 0, per = 0;
  for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; area += a[0] * b[1] - a[1] * b[0]; if (i) per += Math.hypot(b[0] - a[0], b[1] - a[1]); }
  area = Math.abs(area) / 2 - 0.05 * per; // menos el espesor de las planchas
  const wi = d.anchoCucharon - 2 * d.eLat, Ls = Math.hypot(poly[0][0] - poly[1][0], poly[0][1] - poly[1][1]);
  const cap = area * wi + (wi * Ls * Ls) / 8 - Ls ** 3 / 24;
  const ruedas = M.piezas.filter((p) => p.tipo === "llanta");
  const ancho = Math.max(...ruedas.flatMap((p) => p.casco.map((q) => q[2]))) - Math.min(...ruedas.flatMap((p) => p.casco.map((q) => q[2])));
  const capota = Math.max(...M.porNombre.get("capota").casco.map((q) => q[1]));
  const capo = Math.max(...M.porNombre.get("tapa del motor").casco.map((q) => q[1]));
  const cola = Math.min(...M.piezas.filter((p) => p.grupo === "base").flatMap((p) => p.casco.map((q) => q[0])));
  const anchoC = 2 * Math.max(...M.porNombre.get("lateral cucharón i").casco.map((q) => q[2]));
  // en el acarreo (reposo, articulación recta): despeje y anchos de toda la máquina
  const rep = M.posar({});
  const noRueda = (p) => p.tipo !== "llanta" && p.grupo !== "cucharon";
  const despeje = ext(rep, noRueda, 1, "min");
  const anchoZ = (f) => ext(rep, f, 2, "max") - ext(rep, f, 2, "min");
  return {
    capacidad: cap, alturaMax: C, descarga: B, alcance: A, rueda: d.rueda, ejes: d.ejes, ejeArticulacion: d.xF, voladizo: d.xR - cola, capota, capo, despeje,
    pivoteAlto: d.P0[1], brazo: d.La, ancho, anchoCucharon: anchoC, articulacion: d.giro,
    anchoSinCucharon: anchoZ((p) => p.grupo !== "cucharon"), anchoConCucharon: anchoZ(() => true),
    alturaPasador: desc.mundo("brazo", [d.K0[0], d.K0[1], 0])[1], largo: (() => { const n = M.posar({ brazo: d.rango.brazo[0], cucharon: -d.rango.brazo[0] }); return ext(n, () => true, 0, "max") - ext(n, () => true, 0, "min"); })(),
    descargaAngulo: -(d.rango.brazo[1] + M.envolvente(d.rango.brazo[1])[0]),
    alturaLevantado: ext(M.posar({ brazo: d.rango.brazo[1], cucharon: M.envolvente(d.rango.brazo[1])[1] }), (p) => p.grupo === "cucharon", 1, "max"),
  };
}

/** Registro del equipo (lo usan el taller, el juez y los ejemplos). */
export const EQUIPO_SCOOP = {
  nombre: "scoop", medidas: MEDIDAS_SCOOP,
  modelo: (op) => modeloScoop(op), medir: (M) => medirScoop(M),
  dibujo: { color: "#d9a521", colorAro: "#d9a521", alturaBarro: 1.2 },
};
