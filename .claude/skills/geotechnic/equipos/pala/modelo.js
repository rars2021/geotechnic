// Agente equipo-pala · modelo de la pala eléctrica de cables clase P&H 4100 (44–56 m³) en el motor A.
// Mundo de la máquina: x adelante (hacia la pluma con giro 0), y arriba, z izquierda; origen en el piso, en el eje de giro.
// Medidas: MEDIDAS_PALA (fig. 4.17 de Arzapalo Gonzales 2022, hdl:20.500.14076/24547, pág. 64; cucharón de Bonilla
// Vargas 2024, tabla 4); el resto «estimado» con nota.
//
// Lista de piezas (antes de la geometría). Grupos: base (orugas) → giro (casa, bisagra vertical) → izaje (montura del
// mango, bisagra en el eje del shipper) → mango (desliza: empuje por cremallera) → compuerta (bisagra «puerta»), bail (bisagra).
//
// | Grupo     | Piezas                                                                                            |
// |-----------|---------------------------------------------------------------------------------------------------|
// | base      | bastidor inferior (cuerpo central), cajas de ejes, 2 bastidores de oruga, ruedas motrices y guía   |
// |           | con sus ejes, mandos finales, rodillos inferiores y superiores, zapatas (tramos rectos y arcos),    |
// |           | riel inferior de la tornamesa, perno central, toma del cable de cola                              |
// | giro      | riel superior, cubierta, contrapeso, sala de máquinas, sala alta, techo, cabina (cuerpo, vidrios,  |
// |           | parantes, techo), pórtico en A (4 patas, viga, travesaño, letrero), cables de suspensión,          |
// |           | soportes y pasador del pie de pluma, pluma, mejillas, poleas de punta con cubo y eje, orejas de     |
// |           | suspensión, eje del shipper, piñones de empuje, caja y motor de empuje, guías y tramos traseros   |
// |           | del cable de izaje, barandas, escalera, escalera de abordaje, faros, filtros, persianas           |
// | izaje     | montura (saddle block): placas interiores y exteriores, tapa                                       |
// | mango     | 2 brazos del mango (straddle de la pluma), cremalleras, topes, pasador del cucharón; cucharón:     |
// |           | laterales, piso, techo, pared trasera alta, labio, 6 dientes, orejas del mango, orejas de bisagra,  |
// |           | pasador de bisagra, cerradero, orejas y pasadores del bail                                         |
// | puerta    | compuerta, orejas de bisagra, traba y su barra                                                     |
// | bail      | 2 brazos del bail, travesaño, ecualizador                                                          |
// | cables    | 2 cables de izaje de la polea al ecualizador: «mangueras» tensas (largo = cuerda de la pose, ver   |
// |           | la cadena «cable de izaje»); suspensión y tramos traseros: barras fijas                           |
// Sin cilindros hidráulicos (pala de cables): A5 no aplica.
import { maquina, marcoA, orejaA, VA } from "../../motorA/modelo.js";
import { MEDIDAS_PALA } from "./medidas.js";

/** Valor de una medida por su id. */
export function medidaPala(id) { const m = MEDIDAS_PALA.medidas.find((x) => x.id === id); return m ? m.valor : undefined; }

export function modeloPala(op = {}) {
  const md = medidaPala, PI = Math.PI, gr = (r) => (r * 180) / PI;
  const M = maquina("pala", { medidas: MEDIDAS_PALA });
  const ambos = (f) => { f(1, "i"); f(-1, "d"); };
  const zr = (s, a, b) => (s > 0 ? [a, b] : [-b, -a]);
  const rect = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

  // ───────────────────────── medidas
  const LO = md("largoOrugas"), HO = md("altoOrugas"), AO = md("anchoOrugas"), WS = md("zapata");
  const ET = 0.3, YC = HO / 2, RT = YC - ET, XT = LO / 2 - YC, ZT = AO / 2 - WS / 2; // zapata 0,3 m: estimado
  const LP = md("pluma"), AP = (md("anguloPluma") * PI) / 180, CARRERA = md("carrera");
  const ua = [Math.cos(AP), Math.sin(AP)], un = [-Math.sin(AP), Math.cos(AP)];
  // pie de la pluma: elegido para que la polea quede donde la mide la fig. 4.17 (18,5; 20,2)
  const PIE = [md("radioPolea") - LP * ua[0], md("alturaPolea") - LP * ua[1]];
  const en = (s, t) => [PIE[0] + ua[0] * s + un[0] * t, PIE[1] + ua[1] * s + un[1] * t]; // coordenadas de la pluma
  const PUNTA = en(LP, 0), RPOLEA = 1.1; // polea de punta de ≈ 2,2 m: estimado sobre la foto
  const S = en(5.5, 0); // eje del shipper a 5,5 m del pie (estimado sobre la fig. 4.17)
  const L0 = 4.35; // del shipper al pasador del cucharón con el mango recogido (estimado: radio de corte de la fig. 4.17)
  const P0 = [S[0] + L0, S[1] + 1.01]; // pasador del cucharón (eje del mango 1,01 m sobre el shipper: piñón + cremallera)
  const FI = (op.cabeceo ?? 40) * (PI / 180); // cabeceo del cucharón respecto del mango (estimado: dientes a −15° en el pie del banco)
  const dp = (x, y) => [P0[0] + Math.cos(FI) * x - Math.sin(FI) * y, P0[1] + Math.sin(FI) * x + Math.cos(FI) * y]; // diseño del cucharón → reposo
  // marco de diseño del cucharón (origen en el pasador, u a lo largo del cucharón con su cabeceo): sus piezas son prismas en
  // este marco, así el juez tiene como pista la normal real de cada contacto (con placas giradas no la encontraba)
  const FD = { o: [P0[0], P0[1], 0], a: [0, 0, 1], u: [Math.cos(FI), Math.sin(FI), 0], v: [-Math.sin(FI), Math.cos(FI), 0] };
  const pd = (d) => M.prisma({ ...d, F: FD, poligono: d.perfil, s0: d.z[0], s1: d.z[1] });
  const G = [-1.8, md("alturaPortico")]; // cabeza del pórtico
  const TECHO = md("techoCasa");
  const ABRE = 80; // compuerta abierta: −80° (más allá la compuerta llega a los brazos del mango; estimado)

  // ───────────────────────── grupos
  M.grupo("giro", { bisagra: { punto: [0, 0, 0], eje: [0, 1, 0], rango: [-180, 180] } });
  M.grupo("izaje", { padre: "giro", bisagra: { punto: [S[0], S[1], 0], eje: [0, 0, 1], rango: op.rangoIzaje || [-80, 19] }, reposo: -30 }); // −80…+19°: ver la envolvente
  M.grupo("mango", { padre: "izaje", desliza: { dir: [1, 0, 0], rango: [0, CARRERA] }, reposo: 1.5 });
  const H = dp(0.4, -0.81); // bisagra de la compuerta
  M.grupo("puerta", { padre: "mango", bisagra: { punto: [H[0], H[1], 0], eje: [0, 0, 1], rango: [-ABRE, 0] } });
  const PB = dp(3.05, -0.61), LB = 2.2; // pasador del bail en los laterales y largo del bail (pasador → travesaño)
  M.grupo("bail", { padre: "mango", bisagra: { punto: [PB[0], PB[1], 0], eje: [0, 0, 1], rango: [-100, 55] } }); // −100…+55: el travesaño llega al techo del cucharón

  // ───────────────────────── orugas (base)
  M.caja({ nombre: "bastidor inferior", grupo: "base", pieza: "orugas", centro: [0, (0.95 + 3.2) / 2, 0], tam: [5.6, 2.25, 6.5] });
  M.caja({ nombre: "toma del cable de cola", grupo: "base", pieza: "orugas", material: "negro", centro: [-2.95, 1.6, 0], tam: [0.3, 0.6, 0.9] });
  M.unir("toma del cable de cola", "bastidor inferior", "apernada");
  ambos((s, l) => {
    const zc = s * ZT;
    M.caja({ nombre: `bastidor oruga ${l}`, grupo: "base", pieza: "orugas", centro: [0, 1.55, zc], tam: [2 * XT, 1.4, 1.3] });
    for (const x of [-2.0, 2.0]) {
      const n = M.caja({ nombre: `caja de ejes ${l} ${x > 0 ? "del" : "tras"}`, grupo: "base", pieza: "orugas", centro: [x, 1.85, s * 3.5], tam: [1.0, 0.9, 0.6] });
      M.unir(n, "bastidor inferior", "soldada"); M.unir(n, `bastidor oruga ${l}`, "empernada");
    }
    // ruedas motriz (atrás) y guía (adelante) con sus ejes; mando final por fuera de la motriz
    for (const [n, x] of [["rueda motriz", -XT], ["rueda guía", XT]]) {
      M.redondo({ nombre: `${n} ${l}`, grupo: "base", pieza: "orugas", material: "acero", F: marcoA([x, YC, zc], [0, 0, 1]), s0: -0.6, s1: 0.6, r: RT, lados: 32 });
      M.unir(`${n} ${l}`, `bastidor oruga ${l}`, "eje en el bastidor");
      M.redondo({ nombre: `cubo ${n} ${l}`, grupo: "base", pieza: "orugas", material: "gris", F: marcoA([x, YC, zc], [0, 0, 1]), s0: -0.68, s1: 0.68, r: 0.45, lados: 20 });
      M.unir(`cubo ${n} ${l}`, `${n} ${l}`, "cubo"); M.unir(`cubo ${n} ${l}`, `bastidor oruga ${l}`, "cubo");
    }
    M.redondo({ nombre: `mando final ${l}`, grupo: "base", pieza: "orugas", material: "gris", F: marcoA([-XT, YC, 0], [0, 0, s]), s0: ZT + 0.68, s1: ZT + WS / 2 + 0.45, r: 0.62, lados: 24 });
    M.unir(`mando final ${l}`, `cubo rueda motriz ${l}`, "brida del mando");
    for (let k = 0; k < 5; k++) {
      const n = M.redondo({ nombre: `rodillo inferior ${l} ${k}`, grupo: "base", pieza: "orugas", material: "acero", F: marcoA([-2.5 + k * 1.25, ET + 0.4, zc], [0, 0, 1]), s0: -0.5, s1: 0.5, r: 0.4, lados: 20 });
      M.unir(n, `bastidor oruga ${l}`, "eje del rodillo");
    }
    for (const x of [-1.5, 1.5]) {
      const n = M.redondo({ nombre: `rodillo superior ${l} ${x > 0 ? "del" : "tras"}`, grupo: "base", pieza: "orugas", material: "acero", F: marcoA([x, HO - ET - 0.3, zc], [0, 0, 1]), s0: -0.4, s1: 0.4, r: 0.3, lados: 20 });
      M.unir(n, `bastidor oruga ${l}`, "eje del rodillo");
    }
    // zapatas: tramos rectos abajo (contacto con el piso) y arriba, y arcos alrededor de las ruedas
    const nz = 14, paso = (2 * XT) / nz, zs = [zc - WS / 2, zc + WS / 2];
    for (let k = 0; k < nz; k++) {
      const x0 = -XT + k * paso + 0.02, x1 = x0 + paso - 0.04;
      const a = M.placa({ nombre: `zapata baja ${l} ${k}`, grupo: "base", pieza: "orugas", material: "acero", perfil: rect(x0, x1, 0, ET), z: zs });
      M.porNombre.get(a).tocaRoca = true;
      M.placa({ nombre: `zapata alta ${l} ${k}`, grupo: "base", pieza: "orugas", material: "acero", perfil: rect(x0, x1, HO - ET, HO), z: zs });
    }
    const na = 6, da = 180 / na, gap = 0.75, ri = RT / Math.cos(((da / 2 - gap) * PI) / 180), ro = YC;
    for (const [c, a0, nom] of [[XT, -90, "guía"], [-XT, 90, "motriz"]]) for (let k = 0; k < na; k++) {
      const t0 = ((a0 + k * da + gap) * PI) / 180, t1 = ((a0 + (k + 1) * da - gap) * PI) / 180;
      const p = [[ri, t0], [ro, t0], [ro, t1], [ri, t1]].map(([r, t]) => [c + r * Math.cos(t), YC + r * Math.sin(t)]);
      const n = M.placa({ nombre: `zapata ${nom} ${l} ${k}`, grupo: "base", pieza: "orugas", material: "acero", perfil: p, z: zs });
      if (nom === "motriz") M.unir(n, `rueda motriz ${l}`, "la rueda motriz engrana las zapatas");
    }
  });
  // contacto con el piso: las dos ruedas de cada oruga (su fondo + la zapata = el piso); no se dibujan como llantas
  ambos((s, l) => { for (const x of [-XT, XT]) M.ruedas.push({ nombre: `oruga ${l} ${x > 0 ? "guía" : "motriz"}`, grupo: "base", centro: [x, YC, s * ZT], eje: [0, 0, 1], R: YC, W: WS }); });
  // tornamesa: riel inferior (base) y superior (giro), perno central
  M.redondo({ nombre: "riel inferior", grupo: "base", pieza: "tornamesa", material: "acero", F: marcoA([0, 3.2, 0], [0, 1, 0]), s0: 0, s1: 0.25, r: 3.1, lados: 48 });
  M.unir("riel inferior", "bastidor inferior", "soldado");
  M.redondo({ nombre: "riel superior", grupo: "giro", pieza: "tornamesa", material: "acero", F: marcoA([0, 3.2, 0], [0, 1, 0]), s0: 0.25, s1: 0.5, r: 3.1, lados: 48 });

  // ───────────────────────── casa (giro)
  const cub = M.losa({ nombre: "cubierta", grupo: "giro", pieza: "casa", perfil: [[-8.6, -5.2], [2.6, -5.2], [5.2, -2.0], [5.2, 2.0], [2.6, 5.2], [-8.6, 5.2]], y: [3.7, 4.6] });
  M.unir("riel superior", cub, "empernado");
  M.pasador({ nombre: "perno central", grupo: "base", pieza: "tornamesa", punto: [0, 3.65, 0], eje: [0, 1, 0], r: 0.3, largo: 1.5, une: ["bastidor inferior", "riel inferior", "riel superior", cub], tapas: false });
  const RCOLA = md("radioCola");
  M.losa({ nombre: "contrapeso", grupo: "giro", pieza: "casa", perfil: [[-8.6, -4.6], [-9.2, -4.6], [-RCOLA, -3.0], [-RCOLA, 3.0], [-9.2, 4.6], [-8.6, 4.6]], y: [3.3, 6.2] });
  M.caja({ nombre: "sala de máquinas", grupo: "giro", pieza: "casa", centro: [-3.3, 6.6, 0], tam: [10.6, 4.0, 9.2] });
  M.caja({ nombre: "sala alta", grupo: "giro", pieza: "casa", centro: [-4.5, (8.6 + TECHO - 0.3) / 2, 0], tam: [8.2, TECHO - 0.3 - 8.6, 8.4] });
  M.caja({ nombre: "techo", grupo: "giro", pieza: "casa", centro: [-4.5, TECHO - 0.15, 0], tam: [8.6, 0.3, 8.8] });
  for (const [a, b] of [["contrapeso", cub], ["contrapeso", "sala de máquinas"], ["sala de máquinas", cub], ["sala alta", "sala de máquinas"], ["techo", "sala alta"]]) M.unir(a, b, "empernada");
  // cabina adelante a la izquierda, sobre la sala de máquinas
  M.caja({ nombre: "cuerpo de cabina", grupo: "giro", pieza: "cabina", centro: [1.4, 9.1, 3.5], tam: [3.2, 1.0, 2.0] });
  M.caja({ nombre: "vidrios de cabina", grupo: "giro", pieza: "cabina", material: "vidrio", centro: [1.4, 10.25, 3.5], tam: [3.04, 1.3, 1.9] });
  for (const [x, z] of [[2.96, 2.54], [2.96, 4.46], [-0.16, 2.54], [-0.16, 4.46]]) M.caja({ nombre: `parante cabina ${x}/${z}`, grupo: "giro", pieza: "cabina", centro: [x, 10.25, z], tam: [0.08, 1.3, 0.08] });
  M.caja({ nombre: "techo de cabina", grupo: "giro", pieza: "cabina", centro: [1.475, 10.99, 3.5], tam: [3.25, 0.18, 2.1] });
  M.unir("cuerpo de cabina", "sala de máquinas", "apernada");
  // pórtico en A: patas delanteras y traseras a la viga de la cabeza
  M.redondo({ nombre: "viga del pórtico", grupo: "giro", pieza: "portico", F: marcoA([G[0], G[1], 0], [0, 0, 1]), s0: -1.65, s1: 1.65, r: 0.42, lados: 20 });
  ambos((s, l) => {
    for (const [n, x0, x1] of [["delantera", -0.6, -1.6], ["trasera", -4.6, -2.0]]) {
      const p = M.barra({ nombre: `pata ${n} pórtico ${l}`, grupo: "giro", pieza: "portico", de: [x0, TECHO - 0.05, s * 3.0], a: [x1, G[1] - 0.1, s * 1.45], r: 0.3, lados: 14 });
      M.unir(p, "techo", "apoyada en la estructura"); M.unir(p, "viga del pórtico", "soldada");
    }
    M.unir(`pata delantera pórtico ${l}`, `pata trasera pórtico ${l}`, "nudo soldado");
  });
  const yTr = TECHO + 1.1, tTr = (yTr - (TECHO - 0.05)) / (G[1] - 0.1 - (TECHO - 0.05)), xTr = -0.6 + tTr * -1.0, zTr = 3.0 - tTr * 1.55;
  M.redondo({ nombre: "travesaño del pórtico", grupo: "giro", pieza: "portico", F: marcoA([xTr, yTr, 0], [0, 0, 1]), s0: -zTr, s1: zTr, r: 0.18 });
  ambos((s, l) => M.unir("travesaño del pórtico", `pata delantera pórtico ${l}`, "soldado"));
  M.caja({ nombre: "letrero del pórtico", grupo: "giro", pieza: "portico", material: "negro", centro: [-1.2, G[1] - 1.2, 0], tam: [0.12, 0.8, 1.8] });
  ambos((s, l) => M.unir("letrero del pórtico", `pata delantera pórtico ${l}`, "empernado"));
  M.unir("letrero del pórtico", "travesaño del pórtico", "empernado");

  // ───────────────────────── pluma
  ambos((s, l) => {
    M.placa({ nombre: `soporte pie de pluma ${l}`, grupo: "giro", pieza: "pluma", perfil: orejaA([[PIE[0], PIE[1], 0.75], [PIE[0] - 1.0, 4.6, 0.05], [PIE[0] + 0.9, 4.6, 0.05]]), z: zr(s, 0.94, 1.24) });
    M.unir(`soporte pie de pluma ${l}`, cub, "soldado");
  });
  M.placa({ nombre: "pluma", grupo: "giro", pieza: "pluma", material: "negro", perfil: orejaA([[...en(0, 0), 0.75], [...en(2.5, 0), 1.2], [...en(LP - 1.9, 0), 0.7]]), z: [-0.9, 0.9], bisel: 0.04 });
  M.pasador({ nombre: "pasador pie de pluma", grupo: "giro", pieza: "pluma", punto: [PIE[0], PIE[1], 0], eje: [0, 0, 1], r: 0.3, largo: 2.6, une: ["pluma", "soporte pie de pluma i", "soporte pie de pluma d"] });
  ambos((s, l) => {
    M.placa({ nombre: `mejilla punta ${l}`, grupo: "giro", pieza: "pluma", material: "negro", perfil: orejaA([[...PUNTA, 0.5], [...en(LP - 2.4, 0), 0.65]]), z: zr(s, 0.62, 0.92) });
    M.unir(`mejilla punta ${l}`, "pluma", "soldada");
    M.redondo({ nombre: `polea ${l}`, grupo: "giro", pieza: "polea", material: "acero", F: marcoA([...PUNTA, s * 0.35], [0, 0, 1]), s0: -0.2, s1: 0.2, r: RPOLEA, lados: 48 });
    M.redondo({ nombre: `cubo polea ${l}`, grupo: "giro", pieza: "polea", material: "gris", F: marcoA([...PUNTA, s * 0.35], [0, 0, 1]), s0: -0.24, s1: 0.24, r: 0.35, lados: 20 });
    M.unir(`cubo polea ${l}`, `polea ${l}`, "cubo");
    // orejas de suspensión por fuera de las mejillas, sobre y detrás de la polea
    M.placa({ nombre: `oreja suspensión ${l}`, grupo: "giro", pieza: "pluma", perfil: orejaA([[...en(LP - 0.6, 1.3), 0.2], [...en(LP - 1.4, 0.4), 0.2]]), z: zr(s, 0.92, 1.36) });
    M.unir(`oreja suspensión ${l}`, `mejilla punta ${l}`, "soldada");
  });
  M.pasador({ nombre: "eje de poleas", grupo: "giro", pieza: "polea", punto: [...PUNTA, 0], eje: [0, 0, 1], r: 0.2, largo: 1.84, une: ["polea i", "polea d", "cubo polea i", "cubo polea d", "mejilla punta i", "mejilla punta d"] });
  // cables de suspensión: de la viga del pórtico a las orejas de la punta (2 por lado)
  const BS = en(LP - 0.6, 1.3);
  ambos((s, l) => {
    for (const z of [1.05, 1.25]) {
      const n = M.barra({ nombre: `cable de suspensión ${l} ${z}`, grupo: "giro", pieza: "cables", material: "manguera", de: [G[0], G[1], s * z], a: [BS[0], BS[1], s * z], r: 0.05, lados: 8 });
      M.unir(n, "viga del pórtico", "socket del cable"); M.unir(n, `oreja suspensión ${l}`, "socket del cable");
    }
  });
  // shipper: eje a través de la pluma, piñones de empuje, caja y motor de empuje sobre la pluma
  M.pasador({ nombre: "eje del shipper", grupo: "giro", pieza: "empuje", punto: [S[0], S[1], 0], eje: [0, 0, 1], r: 0.28, largo: 4.9, une: ["pluma"], tapas: false });
  ambos((s, l) => {
    const n = M.redondo({ nombre: `piñón de empuje ${l}`, grupo: "giro", pieza: "empuje", material: "acero", F: marcoA([S[0], S[1], s * 1.75], [0, 0, 1]), s0: -0.33, s1: 0.33, r: 0.5, lados: 24 });
    M.unir(n, "eje del shipper", "chaveta");
  });
  const cajaE = en(3.6, 1.42);
  M.prisma({ nombre: "caja de empuje", grupo: "giro", pieza: "empuje", material: "gris", F: marcoA([...cajaE, 0], [0, 0, 1], [ua[0], ua[1], 0]), poligono: [[-0.8, -0.3], [0.8, -0.3], [0.8, 0.3], [-0.8, 0.3]], s0: -0.7, s1: 0.7 });
  M.unir("caja de empuje", "pluma", "empernada");
  const motE = en(3.6, 1.95);
  M.redondo({ nombre: "motor de empuje", grupo: "giro", pieza: "empuje", material: "gris", F: marcoA([...motE, 0], [0, 0, 1]), s0: -0.55, s1: 0.55, r: 0.28, lados: 20 });
  M.unir("motor de empuje", "caja de empuje", "empernado");
  // tramos traseros del cable de izaje: de las guías en el frente de la casa a la polea (por arriba)
  const tangente = (Q, sentido) => { // punto de la polea donde sale (sentido +1) o llega (−1) el cable, girando en sentido horario
    const dx = Q[0] - PUNTA[0], dy = Q[1] - PUNTA[1], d = Math.hypot(dx, dy), b = Math.atan2(dy, dx), g = Math.acos(Math.min(1, RPOLEA / d));
    for (const sg of [1, -1]) {
      const th = b + sg * g, T = [PUNTA[0] + RPOLEA * Math.cos(th), PUNTA[1] + RPOLEA * Math.sin(th)];
      if (sentido * ((Q[0] - T[0]) * Math.sin(th) - (Q[1] - T[1]) * Math.cos(th)) > 0) return { T, th };
    }
    return { T: [PUNTA[0], PUNTA[1] - RPOLEA], th: -PI / 2 };
  };
  const FL = [2.15, 8.1];
  const TB = tangente(FL, -1).T;
  ambos((s, l) => {
    M.caja({ nombre: `guía cable de izaje ${l}`, grupo: "giro", pieza: "cables", material: "acero", centro: [2.15, 8.1, s * 0.35], tam: [0.3, 0.4, 0.4] });
    M.unir(`guía cable de izaje ${l}`, "sala de máquinas", "empernada");
    const n = M.barra({ nombre: `cable de izaje atrás ${l}`, grupo: "giro", pieza: "cables", material: "manguera", de: [FL[0], FL[1], s * 0.35], a: [TB[0], TB[1], s * 0.35], r: 0.04, lados: 8 });
    M.unir(n, `guía cable de izaje ${l}`, "el cable sale de la casa"); M.unir(n, `polea ${l}`, "el cable entra en la garganta");
  });

  // ───────────────────────── detalle de la casa: barandas, escaleras, faros, filtros, persianas
  ambos((s, l) => {
    const zb = s * 5.15;
    M.barra({ nombre: `baranda cubierta ${l}`, grupo: "giro", pieza: "casa", material: "acero", de: [-8.3, 5.7, zb], a: [2.3, 5.7, zb], r: 0.035, lados: 8 });
    for (const x of [-8.3, -6.2, -4.1, -1.0, 1.0, 2.3]) {
      const n = M.barra({ nombre: `poste cubierta ${l} ${x}`, grupo: "giro", pieza: "casa", material: "acero", de: [x, 4.6, zb], a: [x, 5.7, zb], r: 0.03, lados: 8 });
      M.unir(n, `baranda cubierta ${l}`, "soldado"); M.unir(n, cub, "soldado");
    }
    const zt = s * 4.3;
    M.barra({ nombre: `baranda techo ${l}`, grupo: "giro", pieza: "casa", material: "acero", de: [-8.4, TECHO + 1.0, zt], a: [-0.5, TECHO + 1.0, zt], r: 0.035, lados: 8 });
    for (const x of [-8.4, -6.4, -4.0, -2.2, -0.5]) {
      const n = M.barra({ nombre: `poste techo ${l} ${x}`, grupo: "giro", pieza: "casa", material: "acero", de: [x, TECHO, zt], a: [x, TECHO + 1.0, zt], r: 0.03, lados: 8 });
      M.unir(n, `baranda techo ${l}`, "soldado"); M.unir(n, "techo", "soldado");
    }
    for (let k = 0; k < 8; k++) M.caja({ nombre: `persiana sala ${l} ${k}`, grupo: "giro", pieza: "casa", material: "negro", centro: [-7.6 + k * 0.32, 6.9, s * 4.607], tam: [0.18, 1.4, 0.014] });
    M.caja({ nombre: `puerta sala ${l}`, grupo: "giro", pieza: "casa", centro: [-3.2, 6.0, s * 4.608], tam: [1.0, 2.1, 0.016] });
    M.redondo({ nombre: `faro frente ${l}`, grupo: "giro", pieza: "faros", material: "negro", F: marcoA([2.0, 7.2, s * 3.2], [1, 0, 0]), s0: 0, s1: 0.16, r: 0.14 });
    M.redondo({ nombre: `lente frente ${l}`, grupo: "giro", pieza: "faros", material: "luz", F: marcoA([2.0, 7.2, s * 3.2], [1, 0, 0]), s0: 0.16, s1: 0.175, r: 0.11 });
  });
  // barandas del frente de la sala (al lado de la cabina) y filtros de presurización sobre el techo
  M.barra({ nombre: "baranda frente sala", grupo: "giro", pieza: "casa", material: "acero", de: [1.9, 9.6, -4.5], a: [1.9, 9.6, 2.3], r: 0.035, lados: 8 });
  for (const z of [-4.5, -2.2, 0, 2.3]) { const n = M.barra({ nombre: `poste frente sala ${z}`, grupo: "giro", pieza: "casa", material: "acero", de: [1.9, 8.6, z], a: [1.9, 9.6, z], r: 0.03, lados: 8 }); M.unir(n, "baranda frente sala", "soldado"); M.unir(n, "sala de máquinas", "soldado"); }
  for (const [n, x, z] of [["filtro de presurización a", -7.2, -2.6], ["filtro de presurización b", -5.6, -2.6]]) M.caja({ nombre: n, grupo: "giro", pieza: "casa", material: "gris", centro: [x, TECHO + 0.35, z], tam: [1.2, 0.7, 1.6] });
  M.caja({ nombre: "gabinete del techo", grupo: "giro", pieza: "casa", material: "gris", centro: [-6.4, TECHO + 0.3, 2.2], tam: [2.6, 0.6, 1.4] });
  M.redondo({ nombre: "faro de cabina", grupo: "giro", pieza: "faros", material: "negro", F: marcoA([2.6, 11.08, 3.0], [0, 1, 0]), s0: 0, s1: 0.2, r: 0.12 });
  M.redondo({ nombre: "baliza", grupo: "giro", pieza: "faros", material: "luzRoja", F: marcoA([0.2, 11.08, 4.2], [0, 1, 0]), s0: 0, s1: 0.18, r: 0.09, extremos: ["plano", "domo"] });
  // escalera del costado izquierdo: de la cubierta al techo de la sala, con descanso
  M.caja({ nombre: "descanso escalera", grupo: "giro", pieza: "casa", material: "acero", centro: [-6.0, 8.55, 4.82], tam: [0.8, 0.1, 0.44] });
  M.unir("descanso escalera", "sala de máquinas", "empernado");
  const E0 = [-5.6, 8.5], E1 = [-1.6, 4.6];
  for (const [n, z] of [["larguero escalera int", 4.68], ["larguero escalera ext", 4.98]]) {
    M.barra({ nombre: n, grupo: "giro", pieza: "casa", material: "acero", de: [E0[0], E0[1], z], a: [E1[0], E1[1], z], r: 0.04, lados: 8 });
    M.unir(n, "descanso escalera", "soldado"); M.unir(n, cub, "soldado");
  }
  for (let k = 1; k < 12; k++) {
    const t = k / 12, x = E0[0] + (E1[0] - E0[0]) * t, y = E0[1] + (E1[1] - E0[1]) * t;
    const n = M.caja({ nombre: `peldaño ${k}`, grupo: "giro", pieza: "casa", material: "acero", centro: [x, y + 0.02, 4.83], tam: [0.26, 0.04, 0.3] });
    M.unir(n, "larguero escalera int", "soldado"); M.unir(n, "larguero escalera ext", "soldado");
  }
  M.barra({ nombre: "pasamanos escalera", grupo: "giro", pieza: "casa", material: "acero", de: [E0[0], E0[1] + 0.95, 4.98], a: [E1[0], E1[1] + 0.95, 4.98], r: 0.03, lados: 8 });
  for (const [n, p] of [["poste pasamanos alto", E0], ["poste pasamanos bajo", E1]]) { M.barra({ nombre: n, grupo: "giro", pieza: "casa", material: "acero", de: [p[0], p[1], 4.98], a: [p[0], p[1] + 0.95, 4.98], r: 0.03, lados: 8 }); M.unir(n, "pasamanos escalera", "soldado"); M.unir(n, "larguero escalera ext", "soldado"); if (p === E0) M.unir(n, "descanso escalera", "soldado"); }
  // escalera de abordaje: cuelga del borde de la cubierta (atrás a la izquierda), fuera del radio de las orugas
  for (const x of [-7.75, -7.15]) { const n = M.barra({ nombre: `larguero abordaje ${x}`, grupo: "giro", pieza: "casa", material: "acero", de: [x, 4.6, 5.24], a: [x, 0.8, 5.24], r: 0.04, lados: 8 }); M.unir(n, cub, "colgada"); }
  for (let k = 0; k < 10; k++) { const n = M.barra({ nombre: `peldaño abordaje ${k}`, grupo: "giro", pieza: "casa", material: "acero", de: [-7.75, 1.0 + k * 0.35, 5.24], a: [-7.15, 1.0 + k * 0.35, 5.24], r: 0.025, lados: 8 }); M.unir(n, "larguero abordaje -7.75", "soldado"); M.unir(n, "larguero abordaje -7.15", "soldado"); }

  // ───────────────────────── montura del mango (izaje): placas que giran en el shipper y abrazan cada brazo
  ambos((s, l) => {
    const perf = orejaA([[S[0], S[1], 0.55], [S[0] - 1.3, S[1] + 1.55, 0.1], [S[0] + 1.3, S[1] + 1.55, 0.1]]);
    M.placa({ nombre: `montura int ${l}`, grupo: "izaje", pieza: "empuje", perfil: perf, z: zr(s, 1.2, 1.38) });
    M.placa({ nombre: `montura ext ${l}`, grupo: "izaje", pieza: "empuje", perfil: perf, z: zr(s, 2.12, 2.3) });
    M.caja({ nombre: `tapa montura ${l}`, grupo: "izaje", pieza: "empuje", centro: [S[0], S[1] + 1.57, s * 1.75], tam: [2.6, 0.16, 1.1] });
    for (const n of [`montura int ${l}`, `montura ext ${l}`]) { M.unir(`tapa montura ${l}`, n, "soldada"); M.unir("eje del shipper", n, "buje del shipper"); }
  });

  // ───────────────────────── mango (empuje): dos brazos que abrazan la pluma, cremallera abajo
  const xr = S[0] - 1.5 - CARRERA; // cola del brazo: con el mango afuera queda detrás de la montura
  ambos((s, l) => {
    const zc = s * 1.75;
    M.caja({ nombre: `brazo mango ${l}`, grupo: "mango", pieza: "mango", material: "negro", centro: [(xr + P0[0] + 0.25) / 2, P0[1], zc], tam: [P0[0] + 0.25 - xr, 0.9, 0.66] });
    M.caja({ nombre: `cremallera ${l}`, grupo: "mango", pieza: "empuje", material: "acero", centro: [(xr + 0.3 + P0[0] - 1.2) / 2, S[1] + 0.53, zc], tam: [P0[0] - 1.2 - xr - 0.3, 0.06, 0.66] });
    M.unir(`cremallera ${l}`, `brazo mango ${l}`, "empernada"); M.unir(`cremallera ${l}`, `piñón de empuje ${l}`, "el piñón engrana la cremallera");
    M.caja({ nombre: `tope mango ${l}`, grupo: "mango", pieza: "mango", material: "acero", centro: [xr - 0.075, P0[1] + 0.025, zc], tam: [0.15, 1.05, 0.7] });
    M.unir(`tope mango ${l}`, `brazo mango ${l}`, "soldado");
  });

  // ───────────────────────── cucharón (en el diseño: pasador del mango en 0, eje del mango en x; luego cabeceo FI)
  const XB = 0.75, YT = 0.29, YBo = YT - 4.1, XFB = XB + 3.4, XFT = XB + 2.8; // espalda interior, techo, fondo, boca abajo / arriba
  const WI = 2.45, WE = 2.62; // medio ancho interior y exterior
  ambos((s, l) => pd({ nombre: `lateral cucharón ${l}`, grupo: "mango", pieza: "cucharon", material: "pinturaGastada", perfil: [[XB - 0.2, YBo], [XFB, YBo], [XFT, YT], [XB - 0.2, YT]], z: zr(s, WI, WE) }));
  pd({ nombre: "piso del cucharón", grupo: "mango", pieza: "cucharon", material: "pinturaGastada", perfil: rect(XB, XFB - 0.02, YBo, YBo + 0.25), z: [-WI, WI] });
  pd({ nombre: "techo del cucharón", grupo: "mango", pieza: "cucharon", material: "pinturaGastada", perfil: rect(XB - 0.2, XFT - 0.02, YT - 0.15, YT), z: [-WI, WI] });
  pd({ nombre: "espalda alta", grupo: "mango", pieza: "cucharon", material: "pinturaGastada", perfil: rect(XB - 0.2, XB, -0.61, YT - 0.15), z: [-WI, WI] });
  pd({ nombre: "labio", grupo: "mango", pieza: "cucharon", material: "acero", perfil: [[XFB - 0.4, YBo], [XFB + 0.15, YBo + 0.02], [XFB + 0.15, YBo + 0.2], [XFB - 0.4, YBo + 0.38]], z: [-WE, WE] });
  for (const [a, b] of [["piso del cucharón", "lateral cucharón i"], ["piso del cucharón", "lateral cucharón d"], ["techo del cucharón", "lateral cucharón i"], ["techo del cucharón", "lateral cucharón d"],
    ["espalda alta", "lateral cucharón i"], ["espalda alta", "lateral cucharón d"], ["espalda alta", "techo del cucharón"], ["labio", "piso del cucharón"], ["labio", "lateral cucharón i"], ["labio", "lateral cucharón d"]]) M.unir(a, b, "soldadura");
  for (let k = 0; k < 6; k++) {
    const z = -2.15 + k * 0.86;
    pd({ nombre: `diente ${k + 1}`, grupo: "mango", pieza: "cucharon", material: "acero", perfil: [[XFB - 0.05, YBo + 0.03], [XFB + 0.95, YBo + 0.08], [XFB + 0.95, YBo + 0.16], [XFB - 0.05, YBo + 0.36]], z: [z - 0.17, z + 0.17] });
    M.unir(`diente ${k + 1}`, "labio", "adaptador soldado"); M.unir(`diente ${k + 1}`, "piso del cucharón", "adaptador soldado");
    M.porNombre.get(`diente ${k + 1}`).tocaRoca = true; // los dientes cortan el banco: contacto real
  }
  // orejas del mango (a los lados de cada brazo) y pasador del cucharón
  const perfOM = orejaA([[0, 0, 0.38], [XB - 0.15, 0.2, 0.05], [XB - 0.15, -0.55, 0.05]]);
  const orejasM = [];
  ambos((s, l) => {
    for (const [n, a, b] of [["int", 1.26, 1.4], ["ext", 2.1, 2.24]]) {
      const o = pd({ nombre: `oreja mango ${n} ${l}`, grupo: "mango", pieza: "cucharon", perfil: perfOM, z: zr(s, a, b) });
      M.unir(o, "espalda alta", "soldada"); M.unir(o, "techo del cucharón", "soldada"); orejasM.push(o);
    }
  });
  M.pasador({ nombre: "pasador del cucharón", grupo: "mango", pieza: "mango", punto: [P0[0], P0[1], 0], eje: [0, 0, 1], r: 0.18, largo: 4.9, une: ["brazo mango i", "brazo mango d", ...orejasM] });
  // compuerta (espalda baja) con su bisagra arriba y la traba abajo
  pd({ nombre: "compuerta", grupo: "puerta", pieza: "compuerta", material: "pinturaGastada", perfil: rect(XB - 0.21, XB - 0.01, YBo, -0.98), z: [-WI + 0.02, WI - 0.02] }); // 1 cm de luz con el piso y la espalda; su borde alto queda fuera del radio de las orejas fijas
  const bis = [];
  for (const [zi, zo] of [[0.3, 0.5], [1.6, 1.8]]) ambos((s, l) => {
    const a = pd({ nombre: `oreja compuerta ${zi} ${l}`, grupo: "puerta", pieza: "compuerta", perfil: orejaA([[0.4, -0.81, 0.16], [0.62, -1.05, 0.06]]), z: zr(s, zi, zo) });
    M.unir(a, "compuerta", "soldada");
    const b = pd({ nombre: `oreja bisagra ${zi} ${l}`, grupo: "mango", pieza: "compuerta", perfil: orejaA([[0.4, -0.81, 0.16], [0.62, -0.55, 0.06]]), z: zr(s, zo + 0.02, zo + 0.22) });
    M.unir(b, "espalda alta", "soldada");
    bis.push(a, b);
  });
  M.pasador({ nombre: "pasador bisagra compuerta", grupo: "mango", pieza: "compuerta", punto: [H[0], H[1], 0], eje: [0, 0, 1], r: 0.1, largo: 4.3, une: bis });
  pd({ nombre: "traba de la compuerta", grupo: "puerta", pieza: "compuerta", material: "acero", perfil: rect(XB - 0.43, XB - 0.21, YBo + 0.2, YBo + 0.6), z: [-0.3, 0.3] });
  pd({ nombre: "barra de la traba", grupo: "puerta", pieza: "compuerta", material: "acero", perfil: rect(XB - 0.43, XB + 0.2, YBo + 0.28, YBo + 0.4), z: [-0.12, 0.12] });
  pd({ nombre: "cerradero", grupo: "mango", pieza: "compuerta", material: "acero", perfil: rect(XB, XB + 0.3, YBo + 0.25, YBo + 0.45), z: [-0.25, 0.25] });
  M.unir("traba de la compuerta", "compuerta", "empernada"); M.unir("barra de la traba", "compuerta", "la barra pasa por la compuerta"); M.unir("barra de la traba", "traba de la compuerta", "guía de la barra");
  M.unir("barra de la traba", "cerradero", "la barra entra en el cerradero"); M.unir("cerradero", "piso del cucharón", "soldado");
  // bail: dos brazos desde los laterales, travesaño y ecualizador; los cables de izaje salen de su cara de arriba
  const bp = [3.05, -0.61]; // pasador del bail (diseño)
  ambos((s, l) => {
    pd({ nombre: `brazo bail ${l}`, grupo: "bail", pieza: "bail", perfil: orejaA([[bp[0], bp[1], 0.25], [bp[0], bp[1] + LB, 0.22]]), z: zr(s, 2.66, 2.86) });
    M.pasador({ nombre: `pasador bail ${l}`, grupo: "mango", pieza: "bail", punto: [PB[0], PB[1], s * 2.72], eje: [0, 0, 1], r: 0.12, largo: 0.44, une: [`lateral cucharón ${l}`, `brazo bail ${l}`], tapas: s });
  });
  const TV = dp(bp[0], bp[1] + LB);
  M.redondo({ nombre: "travesaño del bail", grupo: "bail", pieza: "bail", F: marcoA([...TV, 0], [0, 0, 1]), s0: -2.86, s1: 2.86, r: 0.22, lados: 18 });
  ambos((s, l) => M.unir("travesaño del bail", `brazo bail ${l}`, "soldado"));
  pd({ nombre: "ecualizador", grupo: "bail", pieza: "bail", material: "acero", perfil: rect(bp[0] - 0.35, bp[0] + 0.35, bp[1] + LB + 0.12, bp[1] + LB + 0.6), z: [-0.75, 0.75] });
  M.unir("ecualizador", "travesaño del bail", "empernado");
  const LEQ = LB + 0.6, b0 = [-Math.sin(FI), Math.cos(FI)]; // del pasador a la cara del ecualizador; eje del bail en reposo
  const EQ = dp(bp[0], bp[1] + LEQ);

  // ───────────────────────── cables de izaje: de la garganta de cada polea a la cara del ecualizador
  const rPto = RPOLEA * (1 + Math.cos(PI / 48)) / 2; // entre el vértice y la cara del casco de 48 lados
  ambos((s, l) => {
    M.puerto(`polea ${l}`, { grupo: "giro", punto: [PUNTA[0], PUNTA[1] - rPto, s * 0.35], normal: [0, -1, 0], pieza: `polea ${l}` });
    M.puerto(`ecualizador ${l}`, { grupo: "bail", punto: [EQ[0], EQ[1], s * 0.35], normal: [b0[0], b0[1], 0], pieza: "ecualizador" });
    M.manguera({ nombre: `cable de izaje ${l}`, pieza: "cables", de: `polea ${l}`, a: `ecualizador ${l}`, r: 0.04, largo: 10, segmentos: 8, salida: 0.3 }); // 8 trozos: los 3 junto a cada extremo cubren la salida tangente de la polea
  });
  const cables = M.mangueras.filter((m) => m.nombre.startsWith("cable de izaje"));
  /**
   * Cadena «cable de izaje»: con izaje (ángulo del mango) y mango (empuje) el cucharón queda fijo; el bail se alinea con
   * el cable (gira libre en sus pasadores) y el cable sale tangente de la polea, recto y tenso. Fija el ángulo del bail,
   * el punto de salida en la polea y el largo del cable de esta pose (la «manguera» queda tensa: cuerda + 1 mm).
   * También pasa los valores normalizados: empuje 0..1 → mango (m), compuerta 0..1 → ángulo de la compuerta.
   */
  M.cadena("cable de izaje", (v) => {
    if (v.empuje !== undefined) v.mango = v.empuje * CARRERA;
    if (v.compuerta !== undefined) v.puerta = -ABRE * v.compuerta;
    const a = (v.izaje * PI) / 180, c = Math.cos(a), sn = Math.sin(a);
    const enCasa = (p) => { const x = p[0] + v.mango - S[0], y = p[1] - S[1]; return [S[0] + c * x - sn * y, S[1] + sn * x + c * y]; };
    const Pb = enCasa(PB);
    let w = VA.unit([PUNTA[0] - Pb[0], PUNTA[1] - Pb[1], 0]), tg = null, Q = null;
    for (let k = 0; k < 8; k++) {
      Q = [Pb[0] + w[0] * LEQ, Pb[1] + w[1] * LEQ];
      tg = tangente(Q, 1);
      w = VA.unit([tg.T[0] - Pb[0], tg.T[1] - Pb[1], 0]);
    }
    Q = [Pb[0] + w[0] * LEQ, Pb[1] + w[1] * LEQ];
    const th = gr(Math.atan2(w[1], w[0]) - Math.atan2(b0[1], b0[0])) - v.izaje;
    v.bail = ((th + 540) % 360) - 180;
    const L = Math.hypot(tg.T[0] - Q[0], tg.T[1] - Q[1]);
    const nT = VA.unit([Q[0] - tg.T[0], Q[1] - tg.T[1], 0]);
    for (const m of cables) {
      const pt = M.puertos.get(m.de), z = pt.punto[2];
      pt.punto = [PUNTA[0] + rPto * Math.cos(tg.th), PUNTA[1] + rPto * Math.sin(tg.th), z];
      pt.normal = nT;
      m.largo = L + 0.001;
    }
    v.cableIzaje = L;
    return 0;
  });

  // ───────────────────────── envolvente de trabajo y muestras del rango
  const IZ = M.grupos.get("izaje").bisagra.rango;
  // con el mango recogido y alto, la cola de los brazos llega al frente de la casa: empuje mínimo según el izaje (juez)
  // tabla del barrido del juez (izaje °, empuje mínimo m) con 0,1 m de margen; arriba de 19° el cucharón llega a la pluma
  const TABLA_E = [[6, 0], [8, 0.45], [12, 0.5], [14, 0.85], [16, 1.55], [18, 2.2], [19, 2.55]];
  const eMin = (iz) => { if (iz <= TABLA_E[0][0]) return 0; for (let k = 1; k < TABLA_E.length; k++) { const [x0, y0] = TABLA_E[k - 1], [x1, y1] = TABLA_E[k]; if (iz <= x1) return y0 + ((y1 - y0) * (iz - x0)) / (x1 - x0); } return TABLA_E[TABLA_E.length - 1][1]; };
  const envolvente = op.envolvente || ((iz) => [eMin(iz), CARRERA]);
  M.envolvente = envolvente;
  const muestras = [];
  for (let k = 0; k <= 10; k++) {
    const iz = IZ[0] + ((IZ[1] - IZ[0]) * k) / 10, [e0, e1] = envolvente(iz);
    for (let j = 0; j <= 4; j++) for (const g of [0, 90]) muestras.push({ giro: g, izaje: iz, mango: e0 + ((e1 - e0) * j) / 4, compuerta: 0 });
  }
  for (const iz of [-20, 0, IZ[1]]) { const [e0, e1] = envolvente(iz); for (const e of [e0, (e0 + e1) / 2, e1]) for (const c of [0.5, 1]) muestras.push({ giro: 0, izaje: iz, mango: e, compuerta: c }); }
  M.dimensionar([{}]);
  M.muestrasRango = muestras;
  M.dims = { PIE, PUNTA, RPOLEA, S, L0, P0, FI, G, ABRE, CARRERA, LP, AP, XT, YC, ZT, WS, ET, LB, LEQ, XB, YT, YBo, XFB, XFT, WI, WE, TECHO, RCOLA, cableCola: [-3.1, 1.6, 0] };
  return M;
}

/** Centro del interior del cucharón (mundo) y fondo (punto más bajo del cucharón y la compuerta). */
export function descargaPala(M, valores = {}) {
  const d = M.dims, pose = M.posar({ ...valores, _sinMangueras: true });
  const xm = (d.XB + (d.XFB + d.XFT) / 2) / 2, ym = (d.YBo + 0.25 + d.YT - 0.15) / 2;
  const c = [Math.cos(d.FI), Math.sin(d.FI)], loc = [d.P0[0] + c[0] * xm - c[1] * ym, d.P0[1] + c[1] * xm + c[0] * ym, 0];
  const centro = pose.mundo("mango", loc);
  let fondo = Infinity;
  for (const cs of M.cascos(pose)) if (cs.p.grupo === "mango" || cs.p.grupo === "puerta") if (cs.p.pieza === "cucharon" || cs.p.pieza === "compuerta") for (const q of cs.puntos) fondo = Math.min(fondo, q[1]);
  return { centro, fondo, cableIzaje: pose.valores.cableIzaje };
}

/**
 * Cinemática inversa en el plano de la pluma: { izaje, mango } que dejan el centro del cucharón a `radio` m del eje de
 * giro y su fondo a `fondo` m sobre el piso de la máquina (compuerta cerrada). Newton con diferencias finitas.
 */
export function apuntarPala(M, radio, fondo, desde = { izaje: 0, mango: M.dims.CARRERA * 0.6 }) {
  let v = { izaje: desde.izaje, mango: desde.mango };
  const f = (u) => { const r = descargaPala(M, { ...u, giro: 0 }); return [r.centro[0] - radio, r.fondo - fondo]; };
  const [lo, hi] = M.grupos.get("izaje").bisagra.rango, C = M.dims.CARRERA;
  let e = f(v);
  for (let it = 0; it < 30 && Math.hypot(...e) > 1e-4; it++) {
    const h = 1e-3, a = f({ ...v, izaje: v.izaje + h }), b = f({ ...v, mango: v.mango + h });
    const J = [[(a[0] - e[0]) / h, (b[0] - e[0]) / h], [(a[1] - e[1]) / h, (b[1] - e[1]) / h]];
    const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
    if (Math.abs(det) < 1e-12) break;
    v = { izaje: Math.max(lo, Math.min(hi, v.izaje - (J[1][1] * e[0] - J[0][1] * e[1]) / det)), mango: Math.max(0, Math.min(C, v.mango - (-J[1][0] * e[0] + J[0][0] * e[1]) / det)) };
    e = f(v);
  }
  return { ...v, empuje: v.mango / C, error: Math.hypot(...e) };
}

/** Punta de los dientes (el diente más adelantado, en el plano de la pluma: [radio, alto] desde el eje de giro). */
export function dientesPala(M, valores = {}) {
  const pose = M.posar({ ...valores, giro: 0, _pose: undefined, _sinMangueras: true });
  let best = null;
  for (const c of M.cascos(pose)) if (c.p.nombre.startsWith("diente")) for (const q of c.puntos) if (!best || q[0] > best[0]) best = q;
  return [best[0], best[1]];
}

/** Cinemática inversa de los dientes: { izaje, mango, empuje } que dejan la punta en (radio, alto). */
export function apuntarDientesPala(M, radio, alto, desde = { izaje: -30, mango: 2 }) {
  let v = { izaje: desde.izaje, mango: desde.mango };
  const f = (u) => { const q = dientesPala(M, u); return [q[0] - radio, q[1] - alto]; };
  const [lo, hi] = M.grupos.get("izaje").bisagra.rango, C = M.dims.CARRERA;
  let e = f(v);
  for (let it = 0; it < 30 && Math.hypot(...e) > 1e-4; it++) {
    const h = 1e-3, a = f({ ...v, izaje: v.izaje + h }), b = f({ ...v, mango: v.mango + h });
    const J = [[(a[0] - e[0]) / h, (b[0] - e[0]) / h], [(a[1] - e[1]) / h, (b[1] - e[1]) / h]], det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
    if (Math.abs(det) < 1e-12) break;
    const iz = Math.max(lo, Math.min(hi, v.izaje - (J[1][1] * e[0] - J[0][1] * e[1]) / det));
    v = { izaje: iz, mango: Math.max(M.envolvente(iz)[0], Math.min(C, v.mango - (-J[1][0] * e[0] + J[0][0] * e[1]) / det)) };
    e = f(v);
  }
  return { ...v, empuje: v.mango / C, error: Math.hypot(...e) };
}

/**
 * Ciclo de carguío (excavar → girar cargado → descargar → volver), t01 ∈ [0, 1). Devuelve los valores de la pose
 * ({ giro, izaje, empuje, compuerta }, más fase y carga). op: { giroCarga (°, 0), giroDescarga (°, 90), descarga:
 * { radio, fondo } (m: centro del cucharón sobre la tolva y fondo del cucharón; 18,5 y 8,2 por defecto), cara:
 * [[radio, alto] del pie, [radio, alto] de la cresta] (recta que suben los dientes), o excavar: [[izaje, empuje], …],
 * M (modelo; si falta se arma uno y se guarda) }.
 * Tiempos (fracción del ciclo, estimado para ≈ 32 s): excavar 0,30 · girar 0,27 · descargar 0,13 · volver 0,30.
 */
export function poseCarguioPala(t01, op = {}) {
  const M = op.M || (poseCarguioPala._M ??= modeloPala());
  const g0 = op.giroCarga ?? 0, g1 = op.giroDescarga ?? 90;
  const cache = (M._cicloPala ??= new Map()), k = JSON.stringify(op.descarga || null);
  if (!cache.has(k)) { const dsc = op.descarga || { radio: 18.5, fondo: 8.2 }; cache.set(k, apuntarPala(M, dsc.radio, dsc.fondo)); }
  const D = cache.get(k);
  // excavar: por defecto el arco de izaje y empuje del pie del banco (dientes en ≈ 12,9; 0,2) a la cresta (≈ 21,8; 14,6);
  // con `cara` la punta sube por esa recta (cinemática inversa; la recta tiene que quedar fuera del alcance recogido)
  const kc = JSON.stringify(op.cara || null);
  if (op.cara && !cache.has("cara" + kc)) {
    const [p0, p1] = op.cara;
    const pts = []; let desde = { izaje: -70, mango: 0.5 };
    for (let k = 0; k <= 6; k++) { const u = k / 6, r = apuntarDientesPala(M, p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u, desde); pts.push([r.izaje, r.empuje]); desde = r; }
    cache.set("cara" + kc, pts);
  }
  const dig = op.excavar || (op.cara ? cache.get("cara" + kc) : [[-72, 0.0], [-55, 0.18], [-36, 0.38], [-17, 0.55], [0, 0.66], [12, 0.74]]);
  const ease = (u) => u * u * (3 - 2 * u), lerp = (a, b, u) => a + (b - a) * u;
  const t = ((t01 % 1) + 1) % 1;
  const T = [0.30, 0.57, 0.70, 1.0];
  if (t < T[0]) { // excavar: el diente sube por la cara del banco
    const u = (t / T[0]) * (dig.length - 1), i = Math.min(dig.length - 2, Math.floor(u)), f = u - i;
    return { giro: g0, izaje: lerp(dig[i][0], dig[i + 1][0], f), empuje: lerp(dig[i][1], dig[i + 1][1], f), compuerta: 0, fase: "Excavar", carga: f > 0.3 || i > 0 };
  }
  const fin = dig[dig.length - 1];
  if (t < T[1]) { const u = ease((t - T[0]) / (T[1] - T[0])); return { giro: lerp(g0, g1, u), izaje: lerp(fin[0], D.izaje, u), empuje: lerp(fin[1], D.empuje, u), compuerta: 0, fase: "Girar cargado", carga: true }; }
  if (t < T[2]) { const u = (t - T[1]) / (T[2] - T[1]); return { giro: g1, izaje: D.izaje, empuje: D.empuje, compuerta: ease(Math.min(1, u * 2.5)), fase: "Descargar", carga: u < 0.4 }; }
  const u = ease((t - T[2]) / (T[3] - T[2]));
  return { giro: lerp(g1, g0, u), izaje: lerp(D.izaje, dig[0][0], u), empuje: lerp(D.empuje, dig[0][1], u), compuerta: Math.max(0, 1 - u * 1.6), fase: "Volver", carga: false };
}

/** Medidas del modelo (juez · fidelidad). */
export function medirPala(M) {
  const d = M.dims, P = (n) => M.porNombre.get(n);
  const ext = (n, k, f) => (f === "max" ? Math.max : Math.min)(...P(n).casco.map((q) => q[k]));
  // capacidad: interior al ras de la boca (trapecio del perfil interior × ancho interior)
  const yb = d.YBo + 0.25, yt = d.YT - 0.15, xf = (y) => d.XFB + ((d.XFT - d.XFB) * (y - d.YBo)) / (d.YT - d.YBo);
  const cap = ((xf(yb) - d.XB + (xf(yt) - d.XB)) / 2) * (yt - yb) * 2 * d.WI;
  // corte: dientes en el rango del modelo (envolvente)
  let hMax = -Infinity, rMax = -Infinity;
  const [lo, hi] = M.grupos.get("izaje").bisagra.rango;
  for (let iz = lo; iz <= hi + 1e-9; iz += 1) for (const e of [M.envolvente(iz)[0], d.CARRERA]) {
    const pose = M.posar({ izaje: iz, mango: e, _sinMangueras: true });
    for (const c of M.cascos(pose)) if (c.p.nombre.startsWith("diente")) for (const q of c.puntos) { hMax = Math.max(hMax, q[1]); rMax = Math.max(rMax, q[0]); }
  }
  const zs = M.piezas.filter((p) => p.nombre.startsWith("zapata baja")).flatMap((p) => p.casco.map((q) => q[2]));
  const xs = M.piezas.filter((p) => p.nombre.startsWith("zapata")).flatMap((p) => p.casco.map((q) => q[0]));
  return {
    cucharon: cap, pluma: Math.hypot(d.PUNTA[0] - d.PIE[0], d.PUNTA[1] - d.PIE[1]), anguloPluma: (Math.atan2(d.PUNTA[1] - d.PIE[1], d.PUNTA[0] - d.PIE[0]) * 180) / Math.PI,
    alturaPolea: d.PUNTA[1], radioPolea: d.PUNTA[0], alturaPortico: d.G[1], techoCasa: ext("techo", 1, "max"), radioCola: -ext("contrapeso", 0, "min"),
    largoOrugas: Math.max(...xs) - Math.min(...xs), altoOrugas: ext("zapata alta i 0", 1, "max"), alturaCorte: hMax, radioCorte: rMax,
    anchoOrugas: Math.max(...zs) - Math.min(...zs), zapata: d.WS, carrera: M.grupos.get("mango").desliza.rango[1],
  };
}

/** Registro del equipo (lo usan el taller, el juez y los ejemplos). */
export const EQUIPO_PALA = {
  nombre: "pala", medidas: MEDIDAS_PALA,
  modelo: (op) => modeloPala(op), medir: (M) => medirPala(M),
  dibujo: { color: "#d9a521", colorAro: "#d9a521", alturaBarro: 2.2 },
};
