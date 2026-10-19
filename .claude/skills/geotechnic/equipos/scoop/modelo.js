// Agente equipo-scoop · modelo del scoop (LHD) clase CAT R1600G en el motor A.
// Paramétrico: todo sale de MEDIDAS_SCOOP (con fuente) y de unas pocas proporciones marcadas «estimado».
// Mundo de la máquina: x adelante, y arriba, z izquierda; origen en el piso bajo la articulación central.
//
// Lista de piezas (antes de la geometría, disciplina de Anatomy). Grupos: base (bastidor trasero) → delantero
// (bisagra vertical) → brazo (bisagra z) → cucharón (bisagra z), palanca (bisagra z) → biela (bisagra z).
//
// | Grupo      | Piezas                                                                                         |
// |------------|------------------------------------------------------------------------------------------------|
// | base       | caja trasera, poste y placas del enganche, compartimiento del motor, tapa, contrapeso, rejilla, |
// |            | eje trasero (carcasa, diferencial, puntas), ruedas traseras, guardabarros y soportes, tanque     |
// |            | hidráulico, cabina (cuerpo, vidrios, parantes, capota), escape, filtro, barandas, faros, orejas |
// | delantero  | lengüetas de la articulación, puente de torres, torres, caja delantera, eje delantero, ruedas,   |
// |            | nariz con horquillas de los cilindros de levante, orejas del cilindro de volteo, guardabarros,  |
// |            | faros, racores de las mangueras                                                                 |
// | brazo      | dos brazos, travesaño, orejas de la palanca, muñones de los cilindros de levante                 |
// | palanca    | dos placas (barra en Z)                                                                         |
// | biela      | biela central                                                                                   |
// | cucharón   | piso, talón, espalda baja y alta, cuchilla, 6 dientes, laterales, guarda superior, patines,      |
// |            | orejas de brazo y de biela                                                                      |
// | cilindros  | 2 de levante, 1 de volteo, 2 de dirección: barril, glándula, vástago cromado, ojos, pasadores    |
// | mangueras  | 2 de volteo, 4 de levante, 2 que cruzan la articulación por su eje                               |
import { maquina, marcoA, orejaA, tiraA, circulosA, gradA, rotar2A, ang2A } from "../../motorA/modelo.js";
import { MEDIDAS_SCOOP } from "./medidas.js";

/** Valor de una medida por su id. */
export function medidaScoop(id) { const m = MEDIDAS_SCOOP.medidas.find((x) => x.id === id); return m ? m.valor : undefined; }

export function modeloScoop(op = {}) {
  const md = (id) => medidaScoop(id);
  const D = md("rueda"), R = D / 2, W = md("ancho"), Wt = 0.64; // ancho de llanta: estimado
  const xF = 1.45, xR = xF - md("ejes"), xCola = xR - md("voladizo"); // eje delantero 1,45 m delante de la articulación (medido)
  const zW = W / 2 - Wt / 2;
  const P0 = [0.45, md("pivoteAlto")]; // pivote de los brazos: 0,45 m delante de la articulación (medido)
  const K0 = [P0[0] + md("brazo"), P0[1]];
  const capota = md("capota"), anchoC = md("anchoCucharon"), giro = md("articulacion");
  // cucharón: perfil base a escala eC (capacidad colmada SAE J742 ≈ 6 yd³), alrededor de la espalda
  const eC = op.escalaCucharon ?? 1.2;
  const k = (x, y) => [K0[0] + 0.12 + eC * (x - 0.12), K0[1] + eC * y];
  const yPiso = eC * -0.28 - 0.03; // fondo de los patines bajo el pasador
  const aLo = Math.round(gradA(Math.asin((-yPiso - P0[1]) / md("brazo"))) * 10) / 10; // cucharón a nivel, en el piso
  // barra en Z (búsqueda numérica en Node: cierra de −100° a +64°, transmisión ≥ 25°, lejos del travesaño)
  const C0 = [2.514, 2.238], D0 = [2.993, 1.706], E0 = [K0[0] - 0.174, K0[1] + 0.252], T0 = [2.138, 2.375];
  const CB = [2.349, 1.941]; // travesaño entre brazos: en el sector que la palanca nunca barre (241° desde C, a 0,34 m)
  const LCD = Math.hypot(D0[0] - C0[0], D0[1] - C0[1]), LDE = Math.hypot(E0[0] - D0[0], E0[1] - D0[1]);
  const rango = { brazo: op.rangoBrazo || [aLo, 49.5], cucharon: op.rangoCucharon || [-96, 64] }; // 49,5°: con él C, B y A de la fig. 2.3 entran en tolerancia // −96°: tope de descarga (la espalda llega a los brazos)
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

  // ───────────────────────── bastidor trasero (base)
  M.caja({ nombre: "caja trasera", grupo: "base", pieza: "motor", centro: [(-2.82 - 0.66) / 2, (R + rEje + 1.5) / 2, 0], tam: [2.16, 1.5 - R - rEje, 1.1] });
  M.caja({ nombre: "poste del enganche", grupo: "base", pieza: "articulacion", centro: [-0.55, 1.0, 0], tam: [0.22, 0.96, 0.6] });
  M.unir("poste del enganche", "caja trasera", "soldado");
  for (const [n, y] of [["placa enganche inferior", [0.52, 0.62]], ["placa enganche superior", [1.38, 1.48]]]) {
    M.losa({ nombre: n, grupo: "base", pieza: "articulacion", material: "acero", perfil: [[-0.62, -0.3], [-0.1, -0.3], [0.12, -0.16], [0.12, 0.16], [-0.1, 0.3], [-0.62, 0.3]], y });
    M.unir(n, "poste del enganche", "soldado");
  }
  M.unir("placa enganche superior", "caja trasera", "soldado");
  M.placa({ nombre: "compartimiento del motor", grupo: "base", pieza: "motor", perfil: [[-4.7, 0.55], [-2.82, 0.55], [-2.82, 1.92], [-2.97, 2.04], [-4.55, 2.04], [-4.7, 1.9]], z: [-1.1, 1.1], bisel: 0.03 });
  M.caja({ nombre: "tapa del motor", grupo: "base", pieza: "motor", centro: [-3.75, 2.065, 0], tam: [1.3, 0.05, 1.7] });
  M.placa({ nombre: "contrapeso", grupo: "base", pieza: "motor", perfil: [[xCola, 0.5], [xCola + 0.08, 0.42], [-4.7, 0.42], [-4.7, 1.75], [xCola, 1.75]], z: [-1.24, 1.24], bisel: 0.03 });
  M.caja({ nombre: "rejilla del radiador", grupo: "base", pieza: "motor", material: "negro", centro: [xCola - 0.015, 1.32, 0], tam: [0.03, 0.6, 1.5] });
  M.unir("rejilla del radiador", "contrapeso", "empernada");
  // eje trasero
  M.redondo({ nombre: "carcasa eje trasero", grupo: "base", pieza: "motor", material: "acero", F: marcoA([xR, R, 0], [0, 0, 1]), s0: -0.7, s1: 0.7, r: rEje });
  M.redondo({ nombre: "diferencial trasero", grupo: "base", pieza: "motor", material: "acero", F: marcoA([xR, R, 0], [0, 0, 1]), s0: -0.22, s1: 0.22, r: 0.3 });
  M.unir("carcasa eje trasero", "diferencial trasero", "fundido"); M.unir("diferencial trasero", "caja trasera", "muñón del eje");
  ambos((s, l) => {
    M.rueda({ nombre: `rueda trasera ${l}`, grupo: "base", pieza: "llantas", centro: [xR, R, s * zW], eje: [0, 0, 1], diametro: D, ancho: Wt, ladoExterior: s, tacos: 26 });
    M.redondo({ nombre: `punta eje trasero ${l}`, grupo: "base", pieza: "llantas", material: "acero", F: marcoA([xR, R, 0], [0, 0, s]), s0: 0.6, s1: 0.86, r: 0.13 });
    for (const n of [`rueda trasera ${l}`, "carcasa eje trasero", `rueda trasera ${l}.maza`]) M.unir(`punta eje trasero ${l}`, n, "maza");
  });
  // guardabarros traseros (el izquierdo termina detrás de la cabina) y sus soportes
  ambos((s, l) => {
    const x0 = s > 0 ? -1.38 : -0.84;
    M.caja({ nombre: `guardabarros trasero ${l}`, grupo: "base", pieza: "motor", centro: [(-2.76 + x0) / 2, 1.83, s * 1.03], tam: [x0 + 2.76, 0.06, 0.68] });
    M.caja({ nombre: `soporte guardabarros ${l}`, grupo: "base", pieza: "motor", centro: [s > 0 ? -2.3 : -1.8, 1.65, s * 0.62], tam: [0.2, 0.3, 0.14] });
  });
  M.caja({ nombre: "tanque hidráulico", grupo: "base", pieza: "motor", centro: [-1.8, 2.07, -1.01], tam: [1.8, 0.42, 0.58] });
  // cabina baja de costado (izquierda): cuerpo con chaflán sobre la llanta, vidrios, parantes y capota (FOPS)
  const zc = [0.5, 1.2];
  M.placa({ nombre: "cuerpo de cabina", grupo: "base", pieza: "cabina", perfil: [[-0.78, 0.98], [-0.36, 0.98], [-0.36, 1.56], [-1.06, 1.56]], z: zc, bisel: 0.025 });
  M.unir("cuerpo de cabina", "caja trasera", "apernada");
  M.caja({ nombre: "vidrios de cabina", grupo: "base", pieza: "cabina", material: "vidrio", centro: [-0.765, 1.88, 0.85], tam: [0.75, 0.64, 0.64] });
  for (const [x, z] of [[-1.165, 0.52], [-1.165, 1.18], [-0.365, 0.52], [-0.365, 1.18]]) M.caja({ nombre: `parante ${x}/${z}`, grupo: "base", pieza: "cabina", centro: [x, 1.88, z], tam: [0.05, 0.64, 0.04] });
  M.caja({ nombre: "capota", grupo: "base", pieza: "cabina", centro: [-0.765, capota - 0.0375, 0.85], tam: [0.98, 0.075, 0.8] });
  // escape, filtro de aire, barandas, faros traseros
  M.redondo({ nombre: "escape", grupo: "base", pieza: "motor", material: "negro", F: marcoA([-3.3, 2.09, -0.7], [0, 1, 0]), s0: 0, s1: 0.36, r: 0.065 });
  M.redondo({ nombre: "filtro de aire", grupo: "base", pieza: "motor", material: "negro", F: marcoA([-3.85, 2.09, 0.62], [0, 1, 0]), s0: 0, s1: 0.24, r: 0.15 });
  ambos((s, l) => {
    M.barra({ nombre: `baranda ${l}`, grupo: "base", pieza: "motor", material: "acero", de: [-4.45, 2.2, s * 1.02], a: [-3.0, 2.2, s * 1.02], r: 0.022 });
    for (const x of [-4.4, -3.72, -3.05]) { const n = M.barra({ nombre: `poste baranda ${l} ${x}`, grupo: "base", pieza: "motor", material: "acero", de: [x, 2.04, s * 1.02], a: [x, 2.2, s * 1.02], r: 0.02 }); M.unir(n, `baranda ${l}`, "soldada"); }
    M.redondo({ nombre: `faro trasero ${l}`, grupo: "base", pieza: "faros", material: "negro", F: marcoA([xCola, 1.6, s * 0.95], [-1, 0, 0]), s0: 0, s1: 0.12, r: 0.075 });
    M.redondo({ nombre: `lente trasero ${l}`, grupo: "base", pieza: "faros", material: "luzRoja", F: marcoA([xCola, 1.6, s * 0.95], [-1, 0, 0]), s0: 0.12, s1: 0.13, r: 0.06 });
  });

  // detalle (Anatomy: densidad por estructura, no por textura): persianas, rejilla, placa, extintor, filtros, focos de trabajo
  for (let k = 0; k < 7; k++) {
    const y = 0.95 + k * 0.1;
    const r = M.caja({ nombre: `lama rejilla ${k}`, grupo: "base", pieza: "motor", material: "acero", centro: [xCola - 0.04, y, 0], tam: [0.02, 0.035, 1.42] });
    M.unir(r, "rejilla del radiador", "lama");
  }
  ambos((s, l) => {
    for (let k = 0; k < 6; k++) M.caja({ nombre: `persiana motor ${l} ${k}`, grupo: "base", pieza: "motor", material: "negro", centro: [-4.25 + k * 0.17, 1.62, s * 1.107], tam: [0.09, 0.42, 0.014] });
    M.caja({ nombre: `placa lateral ${l}`, grupo: "base", pieza: "motor", material: "negro", centro: [-3.25, 1.05, s * 1.106], tam: [0.6, 0.22, 0.012] });
    M.caja({ nombre: `tapa de servicio ${l}`, grupo: "base", pieza: "motor", centro: [-4.2, 0.85, s * 1.108], tam: [0.5, 0.36, 0.016] });
  });
  M.redondo({ nombre: "extintor", grupo: "base", pieza: "motor", material: "rojo", F: marcoA([-0.9, 1.5, 0.3], [0, 1, 0]), s0: 0, s1: 0.42, r: 0.075, extremos: ["plano", "domo"] });
  M.redondo({ nombre: "tapón del tanque", grupo: "base", pieza: "motor", material: "negro", F: marcoA([-1.2, 2.28, -0.9], [0, 1, 0]), s0: 0, s1: 0.05, r: 0.06 });
  M.redondo({ nombre: "visor de nivel", grupo: "base", pieza: "motor", material: "vidrio", F: marcoA([-2.2, 2.05, -1.3], [0, 0, -1]), s0: 0, s1: 0.012, r: 0.04 });
  for (const [n, x] of [["foco de trabajo delantero", -0.3], ["foco de trabajo trasero", -1.24]]) {
    M.caja({ nombre: n, grupo: "base", pieza: "faros", material: "negro", centro: [x + (x > -0.6 ? 0.03 : -0.03), capota + 0.045, 0.85], tam: [0.08, 0.09, 0.16] });
  }
  M.caja({ nombre: "espejo", grupo: "base", pieza: "cabina", material: "vidrio", centro: [-0.33, 2.0, 1.32], tam: [0.02, 0.18, 0.14] });
  M.caja({ nombre: "brazo del espejo", grupo: "base", pieza: "cabina", material: "negro", centro: [-0.36, 2.0, 1.25], tam: [0.02, 0.02, 0.12] });
  M.unir("espejo", "brazo del espejo", "soldado"); M.unir("brazo del espejo", "parante -0.365/1.18", "soldado");

  // ───────────────────────── bastidor delantero
  for (const [n, y] of [["lengüeta inferior", [0.64, 0.74]], ["lengüeta superior", [1.26, 1.36]]]) {
    M.losa({ nombre: n, grupo: "delantero", pieza: "articulacion", material: "acero", perfil: [[-0.18, -0.18], [0.04, -0.3], [0.62, -0.3], [0.62, 0.3], [0.04, 0.3], [-0.18, 0.18]], y });
  }
  for (const [n, yc, nn] of [["pasador articulación inferior", 0.62, ["placa enganche inferior", "lengüeta inferior"]], ["pasador articulación superior", 1.37, ["placa enganche superior", "lengüeta superior"]]]) {
    M.pasador({ nombre: n, grupo: "base", pieza: "articulacion", punto: [0, yc, 0], eje: [0, 1, 0], r: 0.075, largo: 0.27, une: nn });
  }
  M.caja({ nombre: "puente de torres", grupo: "delantero", pieza: "brazo", centro: [0.51, 1.17, 0], tam: [0.42, 0.38, 1.22] });
  M.caja({ nombre: "caja delantera", grupo: "delantero", pieza: "articulacion", centro: [1.01, 0.91, 0], tam: [1.22, 0.42, 0.5] });
  M.unir("caja delantera", "puente de torres", "soldado"); M.unir("lengüeta inferior", "caja delantera", "soldada"); M.unir("lengüeta superior", "puente de torres", "soldada");
  ambos((s, l) => {
    M.placa({ nombre: `torre ${l}`, grupo: "delantero", pieza: "brazo", perfil: [[0.3, 0.95], [0.72, 0.95], [0.72, 1.6], [0.66, 2.03], [0.45, 2.13], [0.26, 2.03], [0.24, 1.8]], z: zr(s, 0.61, 0.69) });
  });
  M.redondo({ nombre: "carcasa eje delantero", grupo: "delantero", pieza: "articulacion", material: "acero", F: marcoA([xF, R, 0], [0, 0, 1]), s0: -0.7, s1: 0.7, r: rEje });
  M.redondo({ nombre: "diferencial delantero", grupo: "delantero", pieza: "articulacion", material: "acero", F: marcoA([xF, R, 0], [0, 0, 1]), s0: -0.22, s1: 0.22, r: 0.3 });
  M.unir("carcasa eje delantero", "diferencial delantero", "fundido"); M.unir("carcasa eje delantero", "caja delantera", "eje empernado"); M.unir("diferencial delantero", "caja delantera", "eje empernado");
  ambos((s, l) => {
    M.rueda({ nombre: `rueda delantera ${l}`, grupo: "delantero", pieza: "llantas", centro: [xF, R, s * zW], eje: [0, 0, 1], diametro: D, ancho: Wt, ladoExterior: s, tacos: 26 });
    M.redondo({ nombre: `punta eje delantero ${l}`, grupo: "delantero", pieza: "llantas", material: "acero", F: marcoA([xF, R, 0], [0, 0, s]), s0: 0.6, s1: 0.86, r: 0.13 });
    for (const n of [`rueda delantera ${l}`, "carcasa eje delantero", `rueda delantera ${l}.maza`]) M.unir(`punta eje delantero ${l}`, n, "maza");
    M.caja({ nombre: `guardabarros delantero ${l}`, grupo: "delantero", pieza: "llantas", centro: [1.65, 1.83, s * 1.03], tam: [1.4, 0.06, 0.68] });
    M.caja({ nombre: `soporte guardabarros delantero ${l}`, grupo: "delantero", pieza: "llantas", centro: [1.05, 1.65, s * 0.7], tam: [0.1, 0.3, 0.02] });
    M.caja({ nombre: `oreja guardabarros ${l}`, grupo: "delantero", pieza: "llantas", centro: [0.86, 1.65, s * 0.7], tam: [0.28, 0.08, 0.02] });
    M.unir(`oreja guardabarros ${l}`, `torre ${l}`, "soldada"); M.unir(`oreja guardabarros ${l}`, `soporte guardabarros delantero ${l}`, "soldada");
    M.redondo({ nombre: `faro delantero ${l}`, grupo: "delantero", pieza: "faros", material: "negro", F: marcoA([2.17, 1.93, s * 1.08], [1, 0, 0]), s0: 0, s1: 0.13, r: 0.07 });
    M.redondo({ nombre: `lente delantero ${l}`, grupo: "delantero", pieza: "faros", material: "luz", F: marcoA([2.17, 1.93, s * 1.08], [1, 0, 0]), s0: 0.13, s1: 0.14, r: 0.058 });
  });
  // nariz: largueros bajo el travesaño y bloque con horquillas de los cilindros de levante
  // nariz baja e inclinada (con el brazo abajo, la palanca y el travesaño quedan justo encima)
  M.placa({ nombre: "bloque de nariz", grupo: "delantero", pieza: "articulacion", perfil: [[1.62, 0.62], [1.78, 0.46], [1.98, 0.46], [2.0, 0.6], [1.62, 1.1]], z: [-0.24, 0.24], bisel: 0.02 });
  for (const n of ["caja delantera", "diferencial delantero", "carcasa eje delantero"]) M.unir("bloque de nariz", n, "eje empernado");
  const BL = [1.98, 0.78]; // pasador base de los cilindros de levante: detrás de donde baja la palanca con el brazo en el piso
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
    M.placa({ nombre: `brazo ${l}`, grupo: "brazo", pieza: "brazo", perfil: orejaA([[P0[0], P0[1], 0.2], [K0[0], K0[1], 0.12], [1.9, P0[1] + 0.03, 0.17]]), z: zr(s, 0.47, 0.59), bisel: 0.02 });
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

  // ───────────────────────── cucharón (perfil relativo al pasador, cucharón a nivel con el brazo horizontal)
  const zi = anchoC / 2 - 0.05; // ancho interior / 2
  const perfLado = [k(0.3, -0.28), k(1.62, -0.28), k(1.68, -0.2), k(1.05, 0.7), k(0.26, 0.86), k(0.12, 0.35), k(0.15, -0.1)];
  ambos((s, l) => M.placa({ nombre: `lateral cucharón ${l}`, grupo: "cucharon", pieza: "cucharon", material: "pinturaGastada", perfil: perfLado, z: zr(s, zi, anchoC / 2), bisel: 0.015 }));
  const plancha = (n, a, b, e = 0.05) => M.placa({ nombre: n, grupo: "cucharon", pieza: "cucharon", material: "pinturaGastada", perfil: tiraA(a, b, e, -1), z: [-zi, zi], bisel: 0.01 });
  plancha("piso del cucharón", k(1.62, -0.28), k(0.3, -0.28), 0.06);
  plancha("talón", k(0.3, -0.28), k(0.15, -0.1));
  plancha("espalda baja", k(0.15, -0.1), k(0.12, 0.35));
  plancha("espalda alta", k(0.12, 0.35), k(0.26, 0.86));
  M.unir("piso del cucharón", "talón", "soldadura"); M.unir("talón", "espalda baja", "soldadura"); M.unir("espalda baja", "espalda alta", "soldadura");
  M.placa({ nombre: "cuchilla", grupo: "cucharon", pieza: "cucharon", material: "acero", perfil: [k(1.4, -0.28), k(1.86, -0.27), k(1.86, -0.245), k(1.4, -0.2)], z: [-zi, zi] });
  M.unir("cuchilla", "piso del cucharón", "soldadura");
  for (let i = 0; i < 6; i++) {
    const z = -zi + 0.22 + (i * (2 * zi - 0.44)) / 5;
    M.placa({ nombre: `diente ${i + 1}`, grupo: "cucharon", pieza: "cucharon", material: "acero", perfil: [k(1.74, -0.285), k(2.04, -0.27), k(2.04, -0.255), k(1.74, -0.205)], z: [z - 0.065, z + 0.065] });
    M.unir(`diente ${i + 1}`, "cuchilla", "adaptador soldado");
  }
  ambos((s, l) => {
    M.placa({ nombre: `cortador lateral ${l}`, grupo: "cucharon", pieza: "cucharon", material: "acero", perfil: [k(1.25, -0.28), k(1.68, -0.28), k(1.72, -0.2), k(1.4, 0.22)], z: zr(s, anchoC / 2, anchoC / 2 + 0.025) });
    M.unir(`cortador lateral ${l}`, `lateral cucharón ${l}`, "empernado");
  });
  M.redondo({ nombre: "guarda superior", grupo: "cucharon", pieza: "cucharon", material: "pinturaGastada", F: marcoA([...k(0.28, 0.86), 0], [0, 0, 1]), s0: -anchoC / 2, s1: anchoC / 2, r: 0.06 });
  for (const n of ["espalda alta", "lateral cucharón i", "lateral cucharón d"]) M.unir("guarda superior", n, "soldada");
  ambos((s, l) => { const c = k(0.95, -0.28); M.caja({ nombre: `patín ${l}`, grupo: "cucharon", pieza: "cucharon", material: "acero", centro: [c[0] - 0.08, c[1] - 0.015, s * 0.55], tam: [0.95 * eC, 0.03, 0.12] }); });
  ambos((s, l) => {
    const perfOreja = [[K0[0] - 0.16, K0[1] - 0.06], [K0[0] - 0.06, K0[1] - 0.16], k(0.26, -0.22), k(0.2, 0.25), [K0[0] - 0.06, K0[1] + 0.16], [K0[0] - 0.16, K0[1] + 0.06]];
    const a = M.placa({ nombre: `oreja brazo int ${l}`, grupo: "cucharon", pieza: "cucharon", perfil: perfOreja, z: zr(s, 0.42, 0.46) });
    const b = M.placa({ nombre: `oreja brazo ext ${l}`, grupo: "cucharon", pieza: "cucharon", perfil: perfOreja, z: zr(s, 0.6, 0.64) });
    for (const o of [a, b]) for (const n of ["talón", "espalda baja", "piso del cucharón"]) M.unir(o, n, "soldada");
    M.pasador({ nombre: `pasador cucharón ${l}`, grupo: "brazo", pieza: "cucharon", punto: [K0[0], K0[1], s * 0.53], eje: [0, 0, 1], r: 0.07, largo: 0.26, une: [a, b, `brazo ${l}`] });
    const c = M.placa({ nombre: `oreja biela ${l}`, grupo: "cucharon", pieza: "cucharon", perfil: orejaA([[E0[0], E0[1], 0.11], [...k(0.17, 0.1), 0.02], [...k(0.15, 0.5), 0.02]]), z: zr(s, 0.115, 0.165) });
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
  const BV = op.BV || [0.42, 1.8];
  ambos((s, l) => M.placa({ nombre: `oreja volteo ${l}`, grupo: "delantero", pieza: "cilindros", perfil: orejaA([[BV[0], BV[1], 0.12], [0.3, 1.33, 0.02], [0.5, 1.33, 0.02]]), z: zr(s, 0.11, 0.16) }));
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
  racor("frente volteo A", "delantero", [0.66, 1.41, 0.26], [0, 1, 0], "puente de torres");
  racor("frente volteo B", "delantero", [0.66, 1.41, -0.26], [0, 1, 0], "puente de torres");
  M.manguera({ nombre: "manguera volteo A", de: "frente volteo A", a: "cilindro volteo.banjo+", r: 0.015, holgura: 0.03 });
  M.manguera({ nombre: "manguera volteo B", de: "frente volteo B", a: "cilindro volteo.banjo-", r: 0.015, holgura: 0.03 });
  // levante: racores en el costado de la caja delantera
  ambos((s, l) => {
    // del techo de la nariz al banjo del pasador base, por dentro (el brazo bajado pasa por fuera, sobre la horquilla)
    racor(`frente levante ${l}`, "delantero", [1.8, 0.913, s * 0.215], [0, 1, 0], "bloque de nariz");
    M.manguera({ nombre: `manguera levante ${l}`, de: `frente levante ${l}`, a: `cilindro levante ${l}.banjo${s > 0 ? "-" : "+"}`, r: 0.016, holgura: 0.0, seno: [0, 1, 0] });
  });
  // cruzan la articulación por su eje: del poste del enganche al puente de torres, en lazo
  for (const z of [0.1, -0.1]) {
    racor(`enganche ${z}`, "base", [-0.39, 1.05, z], [1, 0, 0], "poste del enganche");
    racor(`torres ${z}`, "delantero", [0.25, 1.05, z], [-1, 0, 0], "puente de torres");
    M.manguera({ nombre: `manguera articulación ${z > 0 ? "i" : "d"}`, de: `enganche ${z}`, a: `torres ${z}`, r: 0.017 });
  }

  // ───────────────────────── envolvente de trabajo y dimensionado
  // El cucharón no llega a cualquier ángulo con cualquier altura: el cilindro de volteo está en el bastidor y la palanca
  // en el brazo. Envolvente de trabajo (ángulo absoluto β = brazo + cucharón): de −48° (descarga) a +45° (recogido),
  // dentro del rango de la barra en Z. Los cilindros se dimensionan con ella y el juez la recorre entera.
  const envolvente = (a) => [Math.max(rango.cucharon[0], -48 - a), Math.min(rango.cucharon[1], 45 - a)];
  const muestras = [];
  for (let a = rango.brazo[0]; a <= rango.brazo[1] + 1e-9; a += (rango.brazo[1] - rango.brazo[0]) / 8) {
    const [f0, f1] = envolvente(a);
    for (let f = f0; f <= f1 + 1e-9; f += (f1 - f0) / 6) for (const g of [-giro, 0, giro]) muestras.push({ brazo: a, cucharon: f, delantero: g });
  }
  M.envolvente = envolvente;
  // el fondo del cucharón raspa el piso al cargar: contacto real con la roca (tolerancia del juez «tocaRoca»)
  for (const n of ["piso del cucharón", "talón", "cuchilla", "patín i", "patín d", ...[1, 2, 3, 4, 5, 6].map((i) => `diente ${i}`)]) M.porNombre.get(n).tocaRoca = true;
  M.dimensionar(muestras);
  // codos: el racor del bastidor apunta al banjo (manguera casi recta, sin dobleces en U)
  M.puertos.get("frente volteo A").hacia = "cilindro volteo.banjo+"; M.puertos.get("frente volteo B").hacia = "cilindro volteo.banjo-";
  ambos((s, l) => { const bj = `cilindro levante ${l}.banjo${s > 0 ? "-" : "+"}`; M.puertos.get(`frente levante ${l}`).hacia = bj; M.puertos.get(bj).hacia = `frente levante ${l}`; });
  M.puertos.get("cilindro volteo.banjo+").hacia = "frente volteo A"; M.puertos.get("cilindro volteo.banjo-").hacia = "frente volteo B";
  M.orientarPuertos({ brazo: 5, cucharon: 0 });
  M.dimensionarMangueras(muestras);
  M.dims = { rueda: D, ejes: xF - xR, ancho: W, capota, anchoCucharon: anchoC, xF, xR, xCola, P0, K0, rango, giro, R, eC };
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
  const e = d.eC, poly = [[1.68, -0.2], [0.26, 0.86], [0.12, 0.35], [0.15, -0.1], [0.3, -0.28], [1.62, -0.28]].map(([x, y]) => [0.12 + e * (x - 0.12), e * y]);
  let area = 0, per = 0;
  for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; area += a[0] * b[1] - a[1] * b[0]; if (i) per += Math.hypot(b[0] - a[0], b[1] - a[1]); }
  area = Math.abs(area) / 2 - 0.05 * per; // menos el espesor de las planchas
  const wi = d.anchoCucharon - 0.1, Ls = Math.hypot(poly[0][0] - poly[1][0], poly[0][1] - poly[1][1]);
  const cap = area * wi + (wi * Ls * Ls) / 8 - Ls ** 3 / 24;
  const ruedas = M.piezas.filter((p) => p.tipo === "llanta");
  const ancho = Math.max(...ruedas.flatMap((p) => p.casco.map((q) => q[2]))) - Math.min(...ruedas.flatMap((p) => p.casco.map((q) => q[2])));
  const capota = Math.max(...M.porNombre.get("capota").casco.map((q) => q[1]));
  const cola = Math.min(...M.piezas.filter((p) => p.grupo === "base").flatMap((p) => p.casco.map((q) => q[0])));
  const anchoC = 2 * Math.max(...M.porNombre.get("lateral cucharón i").casco.map((q) => q[2]));
  return {
    capacidad: cap, alturaMax: C, descarga: B, alcance: A, rueda: d.rueda, ejes: d.ejes, voladizo: d.xR - cola, capota,
    pivoteAlto: d.P0[1], brazo: Math.hypot(d.K0[0] - d.P0[0], d.K0[1] - d.P0[1]), ancho, anchoCucharon: anchoC, articulacion: d.giro,
  };
}

/** Registro del equipo (lo usan el taller, el juez y los ejemplos). */
export const EQUIPO_SCOOP = {
  nombre: "scoop", medidas: MEDIDAS_SCOOP,
  modelo: (op) => modeloScoop(op), medir: (M) => medirScoop(M),
  dibujo: { color: "#d9a521", colorAro: "#d9a521", alturaBarro: 1.0 },
};
