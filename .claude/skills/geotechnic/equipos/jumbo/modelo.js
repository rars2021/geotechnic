// Agente equipo-jumbo · modelo del jumbo frontal de dos brazos (clase Boomer E2C) en el motor A.
// Mundo de la máquina: x adelante, y arriba, z izquierda; origen en el piso bajo el eje delantero.
//
// Lista de piezas (antes de la geometría). Grupos por brazo b ∈ {i (+z), d (−z)}:
//   base → giro b (actuador rotativo, eje vertical) → alza b (bisagra horizontal) → exte b (telescópico) →
//   muñeca b (giro de viga, eje vertical) → cabeceo b (volteo de viga, eje horizontal) → rollo b (rotación 360°,
//   eje paralelo a la viga) → viga b (avance de la viga) → perf b (carro de la perforadora sobre la viga)
//   viga b → polea b (carro de la polea de mangueras, a media velocidad de la perforadora) → haz b k (tramos del haz)
//   viga b → soporte barra b (soporte intermedio de la barra: lo empuja la perforadora)
//
// | Grupo    | Piezas                                                                                       |
// |----------|----------------------------------------------------------------------------------------------|
// | base     | chasis delantero y trasero, unión, ejes, 4 ruedas, capó bajo y alto, carrete de cable con su   |
// |          | soporte, carrete de manguera de agua, tanque de agua, plataforma, escalera (largueros y        |
// |          | peldaños), consola, tablero con palancas y pantalla, asiento, techo protector (FOPS: parantes, |
// |          | largueros, travesaños), pasamanos, 4 faros de trabajo (carcasa y lente), soporte de brazos con |
// |          | sus horquillas, 4 gatas (barril)                                                               |
// | giro b   | rótula del brazo (actuador rotativo), orejas del cilindro de alzada                             |
// | alza b   | articulación de alzada, tubo exterior octogonal con collar, tubería de acero sobre el brazo     |
// |          | (3 tubos, bloques de entrada y salida, abrazaderas), orejas del cilindro                        |
// | exte b   | tubo interior octogonal, cabeza del brazo, actuador de giro de viga                             |
// | muñeca b | brida, soporte, actuador de volteo                                                             |
// | cabeceo b| bridas, brazos, actuador de rotación y su eje                                                  |
// | rollo b  | puentes y laterales de la cuna, zapatas guía                                                   |
// | viga b   | perfil de aluminio y dos guías de acero,             tapa trasera, tope bajo el perfil,      |
// |          | bloque fijo del haz, centralizador delantero (cuerpo, goma, mejillas, mordazas, puente)         |
// | perf b   | carro con garras, perforadora (culata, cuerpo, caja de engranajes, nariz, motor de rotación,   |
// |          | acumulador, bloque de racores), adaptador, barra, broca                                        |
// | polea b  | carro con garras, brazo, eje, polea del haz con pestañas                                       |
// | haz b k  | tramo del haz de mangueras de la perforadora (percusión, rotación, barrido) con su espiral      |
// | soporte  | carro con garras, cuerpo y mordazas del soporte intermedio de la barra                         |
// | cilindros| alzada (2), avance de viga (2), gatas (4)                                                      |
// | mangueras| haz soporte → brazo (3 por brazo, cruzan giro y alzada cerca de sus ejes) y lazo del          |
// |          | telescópico (1 por brazo). El haz de la perforadora va sobre la viga como tramos rígidos que   |
// |          | siguen su recorrido real (polea a media velocidad); ver «haz de la perforadora».               |
// | pendiente| haz del brazo a la viga (cruza muñeca, volteo y rotación de 180°): no está dibujado            |
import { maquina, marcoA, orejaA, VA, RA, gradA } from "../../motorA/modelo.js";
import { MEDIDAS_JUMBO } from "./medidas.js";

/** Octógono centrado (u = alto, v = ancho) con chaflán c: perfil de cajón soldado. */
function octJumbo(hu, hv, c) {
  return [[-hu, -hv + c], [-hu, hv - c], [-hu + c, hv], [hu - c, hv], [hu, hv - c], [hu, -hv + c], [hu - c, -hv], [-hu + c, -hv]];
}

export function medidaJumbo(id) { const m = MEDIDAS_JUMBO.medidas.find((x) => x.id === id); return m ? m.valor : undefined; }

export function modeloJumbo(op = {}) {
  const md = (id) => medidaJumbo(id);
  const D = md("rueda"), R = D / 2, Wt = 0.42, W = md("ancho"), zW = W / 2 - Wt / 2;
  const xR = -md("ejes");
  const L0 = md("brazo"), EXT = md("extension"), LV = md("viga"), LB = md("barra"), CARR = md("carrera"), DB = md("broca");
  const techo = md("techo");
  // la nariz llega al soporte intermedio (a 2,93 m del extremo de la viga) con la perforadora avanzada EMPUJE
  const EMPUJE = 2.93 - 0.01 - (0.3 + 0.85);
  const S = 1.95, LP = 2.22, YB = 1.6; // eje de giro, eje de alzada (0,27 m delante: la rótula y la articulación no se tocan), altura
  const M = maquina("jumbo", { medidas: MEDIDAS_JUMBO });
  const zr = (s, a, b) => (s > 0 ? [a, b] : [-b, -a]);
  const ambos = (f) => { f(1, "i"); f(-1, "d"); };

  // ───────────────────────── carrier (base)
  M.caja({ nombre: "chasis delantero", grupo: "base", pieza: "carrier", material: "pinturaGastada", centro: [0.05, 0.75, 0], tam: [2.4, 0.5, 1.0] });
  M.caja({ nombre: "chasis trasero", grupo: "base", pieza: "carrier", material: "pinturaGastada", centro: [-3.125, 0.75, 0], tam: [3.55, 0.5, 1.0] });
  M.caja({ nombre: "unión de chasis", grupo: "base", pieza: "carrier", centro: [-1.25, 0.7, 0], tam: [0.2, 0.4, 0.6] });
  M.unir("unión de chasis", "chasis delantero", "soldada"); M.unir("unión de chasis", "chasis trasero", "soldada");
  for (const [n, x, ch] of [["eje delantero", 0, "chasis delantero"], ["eje trasero", xR, "chasis trasero"]]) {
    M.redondo({ nombre: n, grupo: "base", pieza: "carrier", material: "acero", F: marcoA([x, R, 0], [0, 0, 1]), s0: -0.7, s1: 0.7, r: 0.12 });
    M.unir(n, ch, "eje empernado");
    ambos((s, l) => {
      const w = M.rueda({ nombre: `rueda ${n.split(" ")[1]} ${l}`, grupo: "base", pieza: "carrier", centro: [x, R, s * zW], eje: [0, 0, 1], diametro: D, ancho: Wt, ladoExterior: s, tacos: 22, aro: 0.6 });
      const p = M.redondo({ nombre: `punta ${n} ${l}`, grupo: "base", pieza: "carrier", material: "acero", F: marcoA([x, R, 0], [0, 0, s]), s0: 0.6, s1: zW + 0.05, r: 0.1 });
      M.unir(p, w, "maza"); M.unir(p, n, "maza"); M.unir(p, `${w}.maza`, "maza");
    });
  }
  // capó: bajo entre las ruedas traseras, alto por encima de ellas
  M.caja({ nombre: "capó bajo", grupo: "base", pieza: "carrier", material: "pinturaGastada", centro: [-3.675, 1.125, 0], tam: [2.65, 0.35, 1.4] });
  M.placa({ nombre: "capó alto", grupo: "base", pieza: "carrier", perfil: [[-5.0, 1.3], [-2.35, 1.3], [-2.35, 1.85], [-2.5, 1.97], [-4.85, 1.97], [-5.0, 1.85]], z: [-1.1, 1.1], bisel: 0.03 });
  M.unir("capó bajo", "chasis trasero", "apernado");
  M.caja({ nombre: "rejilla trasera", grupo: "base", pieza: "carrier", material: "negro", centro: [-5.012, 1.62, 0], tam: [0.025, 0.36, 0.86] });
  // carrete de cable en la cola, con su soporte
  const XC = -5.82; // carrete detrás del capó (sus pestañas no llegan al capó)
  ambos((s, l) => M.placa({ nombre: `soporte carrete ${l}`, grupo: "base", pieza: "carrete", perfil: [[-5.0, 1.0], [-5.0, 1.85], [XC - 0.07, 1.55], [XC - 0.11, 1.35]], z: zr(s, 0.47, 0.51) }));
  ambos((s, l) => M.unir(`soporte carrete ${l}`, "capó alto", "soldado"));
  M.redondo({ nombre: "eje del carrete", grupo: "base", pieza: "carrete", material: "acero", F: marcoA([XC, 1.45, 0], [0, 0, 1]), s0: -0.53, s1: 0.53, r: 0.06 });
  ambos((s, l) => M.unir("eje del carrete", `soporte carrete ${l}`, "eje"));
  M.redondo({ nombre: "tambor del carrete", grupo: "base", pieza: "carrete", material: "negro", F: marcoA([XC, 1.45, 0], [0, 0, 1]), s0: -0.4, s1: 0.4, r: 0.6, lados: 24 });
  ambos((s, l) => M.redondo({ nombre: `pestaña carrete ${l}`, grupo: "base", pieza: "carrete", F: marcoA([XC, 1.45, 0], [0, 0, s]), s0: 0.4, s1: 0.44, r: 0.7, lados: 24 }));
  for (const n of ["tambor del carrete", "pestaña carrete i", "pestaña carrete d"]) M.unir(n, "eje del carrete", "eje");
  // plataforma del operador, consola, asiento, techo protector
  M.caja({ nombre: "consola de soporte", grupo: "base", pieza: "techo", centro: [-1.15, 1.125, 0], tam: [0.6, 0.35, 1.0] });
  M.caja({ nombre: "plataforma", grupo: "base", pieza: "techo", centro: [-0.4, 1.33, 0], tam: [2.4, 0.06, 2.24] });
  M.unir("consola de soporte", "plataforma", "soldada"); M.unir("consola de soporte", "chasis delantero", "apernada"); M.unir("consola de soporte", "unión de chasis", "apernada"); M.unir("consola de soporte", "chasis trasero", "apernada");
  M.caja({ nombre: "panel de mandos", grupo: "base", pieza: "techo", centro: [0.45, 1.62, 0.55], tam: [0.3, 0.52, 0.7] });
  M.caja({ nombre: "asiento", grupo: "base", pieza: "techo", centro: [-0.45, 1.6, 0.55], tam: [0.5, 0.48, 0.5] });
  for (const [x, z] of [[-1.5, 1.06], [-1.5, -1.06], [0.75, 1.06], [0.75, -1.06]]) M.barra({ nombre: `parante ${x}/${z}`, grupo: "base", pieza: "techo", de: [x, 1.36, z], a: [x, techo - 0.08, z], r: 0.045 });
  M.caja({ nombre: "techo protector", grupo: "base", pieza: "techo", centro: [-0.375, techo - 0.04, 0], tam: [2.45, 0.08, 2.3] });
  // techo FOPS: largueros y travesaños bajo la plancha, soldados a los parantes
  ambos((s, l) => {
    M.caja({ nombre: `larguero techo ${l}`, grupo: "base", pieza: "techo", centro: [-0.375, techo - 0.12, s * 1.06], tam: [2.35, 0.08, 0.1] });
    M.unir(`larguero techo ${l}`, "techo protector", "soldado");
    for (const x of [-1.5, 0.75]) M.unir(`larguero techo ${l}`, `parante ${x}/${s * 1.06}`, "soldado");
  });
  for (const [n, x] of [["del", 0.75], ["tras", -1.5]]) {
    M.caja({ nombre: `travesaño techo ${n}`, grupo: "base", pieza: "techo", centro: [x, techo - 0.12, 0], tam: [0.1, 0.08, 2.0] });
    M.unir(`travesaño techo ${n}`, "techo protector", "soldado");
    for (const l of ["i", "d"]) M.unir(`travesaño techo ${n}`, `larguero techo ${l}`, "soldado");
  }
  // faros de trabajo sobre el techo: carcasa y lente (dos al frente, dos atrás)
  for (const [n, x, dx] of [["del", 0.62, 1], ["tras", -1.37, -1]]) ambos((s, l) => {
    M.caja({ nombre: `carcasa faro ${n} ${l}`, grupo: "base", pieza: "techo", material: "gris", centro: [x, techo + 0.07, s * 0.85], tam: [0.16, 0.14, 0.2] });
    M.unir(`carcasa faro ${n} ${l}`, "techo protector", "apernada");
    M.redondo({ nombre: `lente faro ${n} ${l}`, grupo: "base", pieza: "techo", material: "luz", F: marcoA([x + dx * 0.08, techo + 0.07, s * 0.85], [dx, 0, 0]), s0: 0, s1: 0.012, r: 0.05, lados: 16 });
    M.unir(`lente faro ${n} ${l}`, `carcasa faro ${n} ${l}`, "lente en su carcasa");
  });
  // escalera de subida (lado del operador, +z) y pasamanos del lado derecho y de atrás
  for (const [n, x] of [["tras", -1.36], ["del", -0.94]]) {
    M.caja({ nombre: `larguero escalera ${n}`, grupo: "base", pieza: "techo", centro: [x, 0.875, 1.04], tam: [0.03, 0.85, 0.12] });
    M.unir(`larguero escalera ${n}`, "plataforma", "soldado");
  }
  [0.56, 0.84, 1.12].forEach((y, k) => {
    M.caja({ nombre: `peldaño escalera ${k}`, grupo: "base", pieza: "techo", material: "acero", centro: [-1.15, y, 1.04], tam: [0.39, 0.035, 0.12] });
    for (const n of ["tras", "del"]) M.unir(`peldaño escalera ${k}`, `larguero escalera ${n}`, "soldado");
  });
  M.barra({ nombre: "pasamanos d", grupo: "base", pieza: "techo", de: [-1.5, 2.0, -1.06], a: [0.75, 2.0, -1.06], r: 0.022 });
  M.barra({ nombre: "pasamanos tras", grupo: "base", pieza: "techo", de: [-1.5, 2.0, -1.06], a: [-1.5, 2.0, 1.06], r: 0.022 });
  M.unir("pasamanos d", "pasamanos tras", "soldado");
  for (const n of ["parante -1.5/-1.06", "parante 0.75/-1.06"]) M.unir("pasamanos d", n, "soldado");
  for (const n of ["parante -1.5/-1.06", "parante -1.5/1.06"]) M.unir("pasamanos tras", n, "soldado");
  // detalle: palancas del panel, gabinete eléctrico, tanque de agua, persianas del capó, faros traseros
  for (let k = 0; k < 4; k++) M.barra({ nombre: `palanca ${k}`, grupo: "base", pieza: "techo", material: "negro", de: [0.36, 1.88, 0.3 + k * 0.12], a: [0.3, 2.06, 0.3 + k * 0.12], r: 0.012 });
  for (let k = 0; k < 4; k++) M.unir(`palanca ${k}`, "panel de mandos", "palanca en su base");
  M.caja({ nombre: "gabinete eléctrico", grupo: "base", pieza: "carrier", material: "gris", centro: [-0.45, 1.75, -0.75], tam: [0.9, 0.78, 0.5] });
  M.caja({ nombre: "pantalla del operador", grupo: "base", pieza: "techo", material: "vidrio", centro: [0.29, 1.77, 0.55], tam: [0.02, 0.2, 0.3] });
  M.unir("pantalla del operador", "panel de mandos", "apernada");
  M.caja({ nombre: "tanque de agua", grupo: "base", pieza: "carrier", material: "gris", centro: [-3.2, 2.17, 0], tam: [1.3, 0.4, 1.0] });
  // carrete de la manguera de agua de barrido, sobre el capó, detrás del tanque
  const XA = -4.45;
  ambos((s, l) => {
    M.placa({ nombre: `soporte carrete agua ${l}`, grupo: "base", pieza: "carrete", perfil: [[XA - 0.12, 1.97], [XA + 0.12, 1.97], [XA + 0.05, 2.37], [XA - 0.05, 2.37]], z: zr(s, 0.4, 0.44) });
    M.unir(`soporte carrete agua ${l}`, "capó alto", "soldado");
  });
  M.redondo({ nombre: "eje carrete agua", grupo: "base", pieza: "carrete", material: "acero", F: marcoA([XA, 2.32, 0], [0, 0, 1]), s0: -0.45, s1: 0.45, r: 0.035 });
  M.redondo({ nombre: "tambor carrete agua", grupo: "base", pieza: "carrete", material: "manguera", F: marcoA([XA, 2.32, 0], [0, 0, 1]), s0: -0.34, s1: 0.34, r: 0.24, lados: 24 });
  ambos((s, l) => {
    M.unir("eje carrete agua", `soporte carrete agua ${l}`, "eje");
    M.redondo({ nombre: `pestaña carrete agua ${l}`, grupo: "base", pieza: "carrete", F: marcoA([XA, 2.32, 0], [0, 0, s]), s0: 0.34, s1: 0.37, r: 0.31, lados: 24 });
    M.unir(`pestaña carrete agua ${l}`, "eje carrete agua", "eje");
  });
  M.unir("tambor carrete agua", "eje carrete agua", "eje");
  ambos((s, l) => {
    for (let k = 0; k < 7; k++) M.caja({ nombre: `persiana capó ${l} ${k}`, grupo: "base", pieza: "carrier", material: "negro", centro: [-4.6 + k * 0.18, 1.62, s * 1.107], tam: [0.09, 0.42, 0.014] });
    M.caja({ nombre: `faro trasero ${l}`, grupo: "base", pieza: "carrier", material: "luzRoja", centro: [-5.01, 1.25, s * 0.82], tam: [0.02, 0.1, 0.16] });
  });
  // soporte de los brazos y sus horquillas (las rótulas giran entre ellas)
  M.caja({ nombre: "soporte de brazos", grupo: "base", pieza: "carrier", centro: [1.45, (0.45 + YB + 0.15) / 2, 0], tam: [0.4, YB + 0.15 - 0.45, 1.56] });
  M.unir("soporte de brazos", "chasis delantero", "soldado");
  ambos((s, l) => {
    const z0 = s * 0.42;
    for (const [n, y] of [["sup", [YB + 0.22, YB + 0.28]], ["inf", [YB - 0.28, YB - 0.22]]]) {
      M.losa({ nombre: `horquilla ${n} ${l}`, grupo: "base", pieza: "brazo", material: "acero", perfil: orejaA([[S, z0, 0.11], [1.62, z0 - 0.16, 0.02], [1.62, z0 + 0.16, 0.02]]), y });
      M.unir(`horquilla ${n} ${l}`, "soporte de brazos", "soldada");
    }
  });
  // gatas: barril fijo al chasis, pie en el grupo que baja (el cilindro va del barril al pie)
  // [nombre, x, z, alto del barril, centro del pie recogido]
  const gatas = [["del i", 1.48, 0.97, 1.6, 0.4], ["del d", 1.48, -0.97, 1.6, 0.4], ["tras i", -4.85, 0.86, 1.22, 0.3], ["tras d", -4.85, -0.86, 1.22, 0.3]];
  for (const [n, x, z, yb, yp] of gatas) {
    M.grupo(`gata ${n}`, { desliza: { dir: [0, -1, 0], rango: [0, yp - 0.03 + 0.01] } });
    const base = n.startsWith("del") ? "soporte de brazos" : "capó bajo";
    M.caja({ nombre: `oreja gata ${n}`, grupo: "base", pieza: "gatas", material: "pinturaGastada", centro: [x, yb, z * 0.9], tam: [0.24, 0.1, Math.abs(z) * 0.2 + 0.2] });
    M.unir(`oreja gata ${n}`, base, "soldada");
    M.caja({ nombre: `pie gata ${n}`, grupo: `gata ${n}`, pieza: "gatas", material: "acero", centro: [x, yp, z], tam: [0.36, 0.06, 0.36], tocaRoca: true });
    M.cilindro({ nombre: `cilindro gata ${n}`, pieza: "gatas", de: { grupo: "base", punto: [x, yb, z] }, a: { grupo: `gata ${n}`, punto: [x, yp + 0.12, z] }, eje: [1, 0, 0],
      rBarril: 0.075, rVastago: 0.05, rOjo: 0.07, anchoOjo: 0.1, puertos: false, guia: 0.12, inicioTubo: 0.085,
      pasadores: { r: 0.03, largoDe: 0.24, uneDe: [`oreja gata ${n}`], largoA: 0.14, uneA: [`pie gata ${n}`], tapasDe: false, tapasA: false } });
    M.unirLuego(`cilindro gata ${n}.ojoBase`, `oreja gata ${n}`, "rótula de la gata");
    M.unirLuego(`cilindro gata ${n}.ojoVastago`, `pie gata ${n}`, "rótula del pie");
  }

  // ───────────────────────── brazos
  const geo = {};
  ambos((s, l) => {
    const z0 = s * 0.42;
    const gG = M.grupo(`giro ${l}`, { bisagra: { punto: [S, YB, z0], eje: [0, 1, 0], rango: [-40, 40] } });
    const gA = M.grupo(`alza ${l}`, { padre: gG, bisagra: { punto: [LP, YB, z0], eje: [0, 0, 1], rango: [-30, 55] } });
    const gE = M.grupo(`exte ${l}`, { padre: gA, desliza: { dir: [1, 0, 0], rango: [0, EXT] } });
    const W0 = [LP + L0, YB, z0];
    const gM = M.grupo(`muñeca ${l}`, { padre: gE, bisagra: { punto: W0, eje: [0, 1, 0], rango: [-90, 90] } });
    // muñeca de brazo real: el volteo va al costado de la cabeza (hacia afuera), la rotación bajo él y la viga ARRIBA,
    // en un brazo de cuna de 0,95 m: con rotación 0 la viga queda sobre la muñeca (corona y ayudas sin tocar el techo),
    // con 180° queda debajo (arrastres); gira siempre por afuera (i por +, d por −) para no barrer la cabeza
    const zT = z0 + s * 0.3;
    const T0 = [W0[0] + 0.24, YB - 0.27, zT];
    // volteo de viga: −40° (nariz arriba) a +12°; más allá la zapata de la cuna pega en la ménsula (lo midió el juez)
    const gC = M.grupo(`cabeceo ${l}`, { padre: gM, bisagra: { punto: T0, eje: [0, 0, 1], rango: [-40, 12] } });
    const Q0 = [T0[0], T0[1] - 0.22, zT];
    const gR = M.grupo(`rollo ${l}`, { padre: gC, bisagra: { punto: Q0, eje: [1, 0, 0], rango: s > 0 ? [-5, 185] : [-185, 5] } });
    const yAx = Q0[1] + 0.95, xr = Q0[0] - 1.83; // la viga pasa sobre el brazo al girarla; su boca queda donde estaba con 5,32 m
    const gV = M.grupo(`viga ${l}`, { padre: gR, desliza: { dir: [1, 0, 0], rango: [0, 1.45] } }); // más allá, el tope trasero llega a la cuna
    // carrera de la perforadora: la útil (3,9 m) más la separación de la boca (≤ 0,26 m en este frente); al final la nariz
    // deja el soporte intermedio a 1 cm del centralizador
    const gP = M.grupo(`perf ${l}`, { padre: gV, desliza: { dir: [1, 0, 0], rango: [0, CARR + 0.3] } });
    // polea del haz a media velocidad (la mueve el sistema de cables de avance) y soporte intermedio empujado por la nariz
    const gPol = M.grupo(`polea ${l}`, { padre: gV, desliza: { dir: [1, 0, 0], rango: [0, (CARR + 0.3) / 2] } });
    const gSop = M.grupo(`soporte barra ${l}`, { padre: gV, desliza: { dir: [1, 0, 0], rango: [0, CARR + 0.3 - EMPUJE] } });
    geo[l] = { z0, zT, s, W0, T0, Q0, yAx, xr, frente: [xr + LV, yAx, zT], grupos: { gG, gA, gE, gM, gC, gR, gV, gP, gPol, gSop } };
    // rótula (actuador rotativo, coaxial con el giro) entre las horquillas
    M.redondo({ nombre: `rótula ${l}`, grupo: gG, pieza: "brazo", material: "acero", F: marcoA([S, YB - 0.2, z0], [0, 1, 0]), s0: 0, s1: 0.4, r: 0.14, lados: 20 });
    M.pasador({ nombre: `pasador giro ${l}`, grupo: "base", pieza: "brazo", punto: [S, YB, z0], eje: [0, 1, 0], r: 0.06, largo: 0.6, une: [`rótula ${l}`, `horquilla sup ${l}`, `horquilla inf ${l}`] });
    // orejas de alzada (adelante de la rótula) y articulación del brazo entre ellas
    ambos((t, m) => {
      M.placa({ nombre: `oreja alza ${l}${m}`, grupo: gG, pieza: "brazo", perfil: orejaA([[LP, YB, 0.12], [S + 0.1, YB - 0.12, 0.04], [S + 0.1, YB + 0.12, 0.04]]), z: zr(t, 0.1, 0.14).map((v) => v + z0) });
      M.unir(`oreja alza ${l}${m}`, `rótula ${l}`, "soldada");
    });
    M.redondo({ nombre: `articulación alza ${l}`, grupo: gA, pieza: "brazo", F: marcoA([LP, YB, z0], [0, 0, 1]), s0: -0.095, s1: 0.095, r: 0.11, lados: 18 });
    M.pasador({ nombre: `pasador alza ${l}`, grupo: gG, pieza: "brazo", punto: [LP, YB, z0], eje: [0, 0, 1], r: 0.05, largo: 0.3, une: [`articulación alza ${l}`, `oreja alza ${l}i`, `oreja alza ${l}d`] });
    // tubo exterior y tubo interior telescópico
    // perfiles octogonales (cajón soldado con chaflanes, como el BUT): el exterior de 0,26 × 0,20 m, el interior de 0,20 × 0,15 m
    M.prisma({ nombre: `tubo exterior ${l}`, grupo: gA, pieza: "brazo", F: marcoA([LP + 0.1, YB, z0], [1, 0, 0], [0, 1, 0]), poligono: octJumbo(0.13, 0.1, 0.035), s0: 0, s1: 2.5 });
    M.unir(`tubo exterior ${l}`, `articulación alza ${l}`, "soldado");
    // el tubo interior queda dentro del exterior aun extendido (traslape ≥ 0,8 m)
    M.prisma({ nombre: `tubo interior ${l}`, grupo: gE, pieza: "brazo", material: "acero", F: marcoA([2.6, YB, z0], [1, 0, 0], [0, 1, 0]), poligono: octJumbo(0.1, 0.075, 0.025), s0: 0, s1: W0[0] - 0.12 - 2.6 });
    M.unir(`tubo interior ${l}`, `tubo exterior ${l}`, "telescópico");
    // collar de la boca del exterior: aloja los patines de deslizamiento del interior
    M.prisma({ nombre: `collar tubo exterior ${l}`, grupo: gA, pieza: "brazo", material: "acero", F: marcoA([LP + 0.1, YB, z0], [1, 0, 0], [0, 1, 0]), poligono: octJumbo(0.145, 0.115, 0.04), s0: 2.4, s1: 2.5 });
    M.unir(`collar tubo exterior ${l}`, `tubo exterior ${l}`, "soldado"); M.unir(`collar tubo exterior ${l}`, `tubo interior ${l}`, "patines del telescópico");
    // tubería de acero sobre el brazo: del bloque de entrada (detrás de los racores del haz) al de salida (lazo del telescópico)
    const yTop = YB + 0.13;
    M.caja({ nombre: `bloque entrada brazo ${l}`, grupo: gA, pieza: "brazo", material: "acero", centro: [LP + 0.56, yTop + 0.02, z0], tam: [0.12, 0.04, 0.12] });
    M.caja({ nombre: `bloque salida brazo ${l}`, grupo: gA, pieza: "brazo", material: "acero", centro: [LP + 1.99, yTop + 0.02, z0], tam: [0.22, 0.04, 0.12] });
    for (const n of ["entrada", "salida"]) M.unir(`bloque ${n} brazo ${l}`, `tubo exterior ${l}`, "apernado");
    for (const k of [-1, 0, 1]) {
      const t = M.redondo({ nombre: `tubo hidráulico brazo ${l} ${k}`, grupo: gA, pieza: "brazo", material: "acero", F: marcoA([LP + 0.62, yTop + 0.013, z0 + k * 0.035], [1, 0, 0]), s0: 0, s1: 1.26, r: 0.012, lados: 10 });
      M.unir(t, `bloque entrada brazo ${l}`, "racor del tubo"); M.unir(t, `bloque salida brazo ${l}`, "racor del tubo");
    }
    for (const x of [0.95, 1.45]) {
      const a = M.caja({ nombre: `abrazadera tubos brazo ${l} ${x}`, grupo: gA, pieza: "brazo", material: "acero", centro: [LP + x, yTop + 0.0175, z0], tam: [0.03, 0.035, 0.11] });
      M.unir(a, `tubo exterior ${l}`, "apernada");
      for (const k of [-1, 0, 1]) M.unir(a, `tubo hidráulico brazo ${l} ${k}`, "abrazadera");
    }
    M.caja({ nombre: `cabeza ${l}`, grupo: gE, pieza: "brazo", centro: [W0[0] - 0.1, YB + 0.03, z0], tam: [0.2, 0.26, 0.24] });
    M.unir(`cabeza ${l}`, `tubo interior ${l}`, "soldada");
    // muñeca: actuador de giro de viga (eje vertical) en la cabeza; brida y ménsula hacia afuera con el actuador de volteo
    M.redondo({ nombre: `actuador giro viga ${l}`, grupo: gE, pieza: "brazo", material: "gris", F: marcoA([W0[0], YB - 0.12, z0], [0, 1, 0]), s0: 0, s1: 0.24, r: 0.13, lados: 20 });
    M.unir(`actuador giro viga ${l}`, `cabeza ${l}`, "apernado"); M.unir(`actuador giro viga ${l}`, `tubo interior ${l}`, "apernado");
    M.redondo({ nombre: `brida giro viga ${l}`, grupo: gM, pieza: "brazo", material: "acero", F: marcoA([W0[0], YB - 0.12, z0], [0, 1, 0]), s0: -0.05, s1: 0, r: 0.13, lados: 20 });
    M.caja({ nombre: `ménsula muñeca ${l}`, grupo: gM, pieza: "brazo", centro: [W0[0] + 0.1, YB - 0.145, (z0 + zT + s * 0.08) / 2], tam: [0.34, 0.05, Math.abs(zT - z0) + 0.16] });
    M.unir(`ménsula muñeca ${l}`, `brida giro viga ${l}`, "soldada");
    M.caja({ nombre: `alma muñeca ${l}`, grupo: gM, pieza: "brazo", centro: [T0[0], YB - 0.18, zT], tam: [0.12, 0.06, 0.13] });
    M.unir(`alma muñeca ${l}`, `ménsula muñeca ${l}`, "soldada");
    M.redondo({ nombre: `actuador volteo viga ${l}`, grupo: gM, pieza: "brazo", material: "gris", F: marcoA(T0, [0, 0, 1]), s0: -0.08, s1: 0.08, r: 0.09, lados: 18 });
    M.unir(`actuador volteo viga ${l}`, `alma muñeca ${l}`, "soldada");
    // cabeceo: bridas a los lados del volteo y bajadas hasta el actuador de rotación (eje paralelo a la viga)
    ambos((t, m) => {
      M.redondo({ nombre: `brida volteo ${l}${m}`, grupo: gC, pieza: "brazo", material: "acero", F: marcoA(T0, [0, 0, t]), s0: 0.08, s1: 0.11, r: 0.09, lados: 18 });
      M.placa({ nombre: `bajada volteo ${l}${m}`, grupo: gC, pieza: "brazo", perfil: orejaA([[T0[0], T0[1], 0.07], [Q0[0], Q0[1], 0.07]]), z: zr(t, 0.08, 0.11).map((v) => v + zT) });
      M.unir(`bajada volteo ${l}${m}`, `brida volteo ${l}${m}`, "soldada");
    });
    M.redondo({ nombre: `actuador rotación ${l}`, grupo: gC, pieza: "brazo", material: "gris", F: marcoA(Q0, [1, 0, 0]), s0: -0.15, s1: 0.15, r: 0.08, lados: 18 });
    for (const m of ["i", "d"]) M.unir(`actuador rotación ${l}`, `bajada volteo ${l}${m}`, "soldada");
    // rollo: brida de salida, brazo de cuna (0,7 m) y zapata con laterales que abrazan la viga
    M.redondo({ nombre: `brida rotación ${l}`, grupo: gR, pieza: "viga", material: "acero", F: marcoA(Q0, [1, 0, 0]), s0: 0.15, s1: 0.19, r: 0.1, lados: 18 });
    M.pared({ nombre: `brazo cuna ${l}`, grupo: gR, pieza: "viga", perfil: orejaA([[zT, Q0[1], 0.08], [zT, yAx - 0.37, 0.07]]), x: [Q0[0] + 0.16, Q0[0] + 0.26] });
    M.unir(`brazo cuna ${l}`, `brida rotación ${l}`, "soldada");
    M.caja({ nombre: `zapata cuna ${l}`, grupo: gR, pieza: "viga", material: "acero", centro: [Q0[0] + 0.12, yAx - 0.33, zT], tam: [0.48, 0.06, 0.26] });
    M.unir(`zapata cuna ${l}`, `brazo cuna ${l}`, "soldada");
    ambos((t, k) => {
      M.caja({ nombre: `lateral cuna ${l}${k}`, grupo: gR, pieza: "viga", centro: [Q0[0] + 0.12, yAx - 0.23, zT + t * 0.11], tam: [0.48, 0.14, 0.04] });
      M.unir(`lateral cuna ${l}${k}`, `zapata cuna ${l}`, "soldada");
    });
    // ── viga de avance: perfil de aluminio de una pieza y dos guías de acero arriba, donde corren
    // los carros. Los cables de avance van dentro del perfil. Coordenadas de la viga: x desde xr.
    const X = (dx) => xr + dx, Y = (dy) => yAx + dy;
    const cajaV = (nombre, grupo, x0, x1, y0, y1, z0r, z1r, o = {}) => M.caja({ nombre, grupo, pieza: "viga", ...o, centro: [(X(x0) + X(x1)) / 2, (Y(y0) + Y(y1)) / 2, zT + (z0r + z1r) / 2], tam: [x1 - x0, y1 - y0, z1r - z0r] });
    const lado = (t, a, b) => zr(t, a, b); // [z0, z1] relativos a zT, del lado t
    const LP0 = LV - 0.12; // el perfil termina donde empieza el centralizador
    cajaV(`viga ${l}`, gV, 0, LP0, -0.3, -0.12, -0.08, 0.08, { material: "aluminio" });
    M.unir(`viga ${l}`, `zapata cuna ${l}`, "guía de la viga");
    for (const k of ["i", "d"]) M.unir(`viga ${l}`, `lateral cuna ${l}${k}`, "guía de la viga");
    ambos((t, k) => {
      cajaV(`guía viga ${l}${k}`, gV, 0, LP0, -0.12, -0.105, ...lado(t, 0.05, 0.075), { material: "acero" });
      M.unir(`guía viga ${l}${k}`, `viga ${l}`, "apernada");
    });
    // tapa del extremo del perfil y tope trasero bajo el perfil: pega en la cuna (3 cm de luz) con la viga adelantada 1,45 m
    const XT = Q0[0] - 0.12 - 0.03 - 1.45 - xr;
    cajaV(`tapa trasera viga ${l}`, gV, -0.03, 0, -0.3, -0.12, -0.08, 0.08);
    cajaV(`tope trasero ${l}`, gV, XT - 0.05, XT, -0.36, -0.3, -0.11, 0.11);
    M.unir(`tapa trasera viga ${l}`, `viga ${l}`, "soldada");
    M.unir(`tope trasero ${l}`, `viga ${l}`, "apernado");
    // centralizador delantero: cuerpo con goma de apoyo en la roca, mejillas, mordazas de la barra y puente
    cajaV(`centralizador ${l}`, gV, LV - 0.12, LV - 0.02, -0.3, -0.045, -0.085, 0.085, { material: "acero", tocaRoca: true });
    cajaV(`goma centralizador ${l}`, gV, LV - 0.02, LV, -0.3, -0.045, -0.085, 0.085, { material: "goma", tocaRoca: true });
    cajaV(`puente centralizador ${l}`, gV, LV - 0.12, LV, 0.06, 0.09, -0.085, 0.085, { material: "acero", tocaRoca: true });
    M.unir(`goma centralizador ${l}`, `centralizador ${l}`, "vulcanizada");
    M.unir(`centralizador ${l}`, `viga ${l}`, "soldado");
    ambos((t, k) => {
      cajaV(`mejilla centralizador ${l}${k}`, gV, LV - 0.12, LV, -0.045, 0.06, ...lado(t, 0.05, 0.085), { material: "acero", tocaRoca: true });
      cajaV(`mordaza centralizador ${l}${k}`, gV, LV - 0.1, LV - 0.02, -0.03, 0.03, ...lado(t, 0.026, 0.05), { material: "gris" });
      M.unir(`mejilla centralizador ${l}${k}`, `centralizador ${l}`, "soldada"); M.unir(`mejilla centralizador ${l}${k}`, `puente centralizador ${l}`, "apernada");
      M.unir(`mordaza centralizador ${l}${k}`, `mejilla centralizador ${l}${k}`, "mordaza en su guía");
      M.unir(`mejilla centralizador ${l}${k}`, `goma centralizador ${l}`, "vulcanizada");
    });
    // bloque fijo del haz de la perforadora (costado de afuera, abajo): ahí llega el tramo de retorno
    const xF = 2.35, zH = zT + s * 0.18, RH = 0.03, RHO = 0.15, yS = Y(-0.13); // eje de la polea a 0,13 m bajo la barra
    cajaV(`bloque haz viga ${l}`, gV, xF, xF + 0.12, -0.33, -0.23, ...lado(s, 0.08, 0.22), { material: "acero" });
    M.unir(`bloque haz viga ${l}`, `viga ${l}`, "apernado");
    // carro con garras sobre las guías (perforadora, polea y soporte intermedio comparten el diseño)
    const carro = (n, grupo, x0, x1) => {
      cajaV(`carro ${n} ${l}`, grupo, x0, x1, -0.105, -0.075, -0.09, 0.09, { material: "acero" });
      ambos((t, k) => { cajaV(`garra ${n} ${l}${k}`, grupo, x0, x1, -0.13, -0.075, ...lado(t, 0.083, 0.098), { material: "acero" }); M.unir(`garra ${n} ${l}${k}`, `carro ${n} ${l}`, "soldada"); });
    };
    // ── perforadora (clase COP 1838): culata, cuerpo, caja de engranajes con su motor de rotación, nariz, acumulador y
    // bloque de racores del haz; todo dentro de 0,125 m del eje por arriba y por abajo (arrastres con la viga girada)
    const XP = 0.3, xp = X(XP);
    carro("perforadora", gP, XP - 0.06, XP + 0.8);
    M.pared({ nombre: `perforadora ${l}`, grupo: gP, pieza: "perforadora", material: "rojo", perfil: octJumbo(0.1, 0.075, 0.03).map(([v, u]) => [zT + v, yAx + u]), x: [xp, xp + 0.55] });
    M.redondo({ nombre: `culata perforadora ${l}`, grupo: gP, pieza: "perforadora", material: "acero", F: marcoA([xp, yAx, zT], [1, 0, 0]), s0: -0.06, s1: 0, r: 0.07, lados: 18 });
    M.pared({ nombre: `caja engranajes ${l}`, grupo: gP, pieza: "perforadora", material: "rojo", perfil: octJumbo(0.09, 0.07, 0.025).map(([v, u]) => [zT + v, Y(-0.005) + u]), x: [xp + 0.55, xp + 0.72] });
    M.redondo({ nombre: `motor rotación ${l}`, grupo: gP, pieza: "perforadora", material: "gris", F: marcoA([xp + 0.635, yAx, zT - s * 0.035], [0, 1, 0]), s0: 0.065, s1: 0.115, r: 0.045, lados: 16 });
    M.redondo({ nombre: `nariz perforadora ${l}`, grupo: gP, pieza: "perforadora", material: "acero", F: marcoA([xp + 0.72, yAx, zT], [1, 0, 0]), s0: 0, s1: 0.1, r0: 0.065, r1: 0.045, lados: 18 });
    M.redondo({ nombre: `acumulador ${l}`, grupo: gP, pieza: "perforadora", material: "gris", F: marcoA([xp + 0.3, yAx, zT - s * 0.135], [1, 0, 0]), s0: -0.07, s1: 0.07, r: 0.035, extremos: ["domo", "domo"], lados: 16 });
    cajaV(`bloque racores ${l}`, gP, XP - 0.06, XP + 0.08, -0.03, 0.07, ...lado(s, 0.1, 0.22), { pieza: "perforadora", material: "acero" });
    for (let k = 0; k < 3; k++) {
      const rc = M.redondo({ nombre: `racor perforadora ${l} ${k}`, grupo: gP, pieza: "perforadora", material: "laton", F: marcoA([xp - 0.03 + k * 0.045, yAx, zT + s * 0.13], [0, 1, 0]), s0: 0.07, s1: 0.09, r: 0.012, lados: 8 });
      M.unir(rc, `bloque racores ${l}`, "racor roscado");
    }
    for (const [a, b, m] of [[`perforadora ${l}`, `carro perforadora ${l}`, "apernada"], [`culata perforadora ${l}`, `perforadora ${l}`, "apernada"], [`caja engranajes ${l}`, `perforadora ${l}`, "apernada"],
      [`caja engranajes ${l}`, `carro perforadora ${l}`, "apernada"], [`motor rotación ${l}`, `caja engranajes ${l}`, "brida"], [`nariz perforadora ${l}`, `caja engranajes ${l}`, "apernada"],
      [`acumulador ${l}`, `perforadora ${l}`, "abrazadera"], [`bloque racores ${l}`, `perforadora ${l}`, "apernado"], [`bloque racores ${l}`, `carro perforadora ${l}`, "apernado"]]) M.unir(a, b, m);
    M.redondo({ nombre: `adaptador ${l}`, grupo: gP, pieza: "barra", material: "acero", F: marcoA([xp + 0.82, yAx, zT], [1, 0, 0]), s0: 0, s1: 0.03, r: 0.035 });
    M.unir(`adaptador ${l}`, `nariz perforadora ${l}`, "culata");
    const x0b = xp + 0.85;
    M.redondo({ nombre: `barra ${l}`, grupo: gP, pieza: "barra", material: "acero", F: marcoA([x0b, yAx, zT], [1, 0, 0]), s0: 0, s1: LB, r: 0.019, lados: 10, entraTaladro: true });
    M.unir(`barra ${l}`, `adaptador ${l}`, "rosca");
    M.redondo({ nombre: `broca ${l}`, grupo: gP, pieza: "barra", material: "acero", F: marcoA([x0b + LB, yAx, zT], [1, 0, 0]), s0: 0, s1: LV - XP - 0.85 - LB, r: DB / 2, lados: 12, entraTaladro: true });
    M.unir(`broca ${l}`, `barra ${l}`, "rosca");
    for (const n of [`barra ${l}`, `broca ${l}`]) for (const k of ["i", "d"]) M.unir(n, `mordaza centralizador ${l}${k}`, "la barra pasa por el centralizador");
    // ── soporte intermedio de la barra: espera a media viga y lo empuja la nariz (1 cm de luz) hasta el centralizador
    const XS = 2.93;
    carro("soporte barra", gSop, XS, XS + 0.05);
    cajaV(`cuerpo soporte barra ${l}`, gSop, XS, XS + 0.05, -0.075, -0.03, -0.06, 0.06);
    M.unir(`cuerpo soporte barra ${l}`, `carro soporte barra ${l}`, "soldado");
    ambos((t, k) => {
      cajaV(`mordaza soporte barra ${l}${k}`, gSop, XS, XS + 0.05, -0.03, 0.03, ...lado(t, 0.025, 0.05), { material: "gris" });
      M.unir(`mordaza soporte barra ${l}${k}`, `cuerpo soporte barra ${l}`, "mordaza en su guía");
      M.unir(`mordaza soporte barra ${l}${k}`, `barra ${l}`, "la barra pasa entre las mordazas");
    });
    // ── polea del haz: carro detrás de la perforadora, brazo y eje hacia afuera, polea con pestañas en el plano del haz
    const XQ = 0.06; // eje de la polea en reposo (6 cm delante del extremo del perfil)
    carro("polea", gPol, XQ - 0.06, XQ + 0.12);
    cajaV(`brazo polea ${l}`, gPol, XQ - 0.04, XQ + 0.04, -0.15, -0.075, ...lado(s, 0.098, 0.135), { material: "acero" });
    M.unir(`brazo polea ${l}`, `carro polea ${l}`, "soldado"); M.unir(`brazo polea ${l}`, `garra polea ${l}${s > 0 ? "i" : "d"}`, "soldado");
    M.redondo({ nombre: `eje polea ${l}`, grupo: gPol, pieza: "viga", material: "acero", F: marcoA([X(XQ), yS, zT], [0, 0, s]), s0: 0.1, s1: 0.23, r: 0.02, lados: 12 });
    M.unir(`eje polea ${l}`, `brazo polea ${l}`, "eje soldado");
    M.redondo({ nombre: `polea haz ${l}`, grupo: gPol, pieza: "viga", material: "gris", F: marcoA([X(XQ), yS, zH], [0, 0, 1]), s0: -0.03, s1: 0.03, r: RHO - RH - 0.005, lados: 24 });
    M.unir(`polea haz ${l}`, `eje polea ${l}`, "rodamiento");
    ambos((t, k) => {
      M.redondo({ nombre: `pestaña polea ${l}${k}`, grupo: gPol, pieza: "viga", material: "acero", F: marcoA([X(XQ), yS, zH], [0, 0, t]), s0: RH + 0.003, s1: RH + 0.011, r: RHO + 0.02, lados: 24 });
      M.unir(`pestaña polea ${l}${k}`, `eje polea ${l}`, "rodamiento"); M.unir(`pestaña polea ${l}${k}`, `polea haz ${l}`, "apernada");
    });
    // ── haz de la perforadora (percusión, rotación, barrido, en espiral protectora): sale del bloque de racores hacia
    // atrás, da la vuelta por la polea y vuelve por abajo al bloque fijo. Largo fijo L = T + πρ + B; la polea va a media
    // velocidad, así T crece y B baja lo mismo. Se dibuja en tramos rígidos cortos (cápsulas) que siguen su punto del haz.
    const T0h = XP - 0.06 - XQ, U = Math.PI * RHO, Lh = T0h + U + (xF - XQ);
    const NH = Math.round(Lh / 0.06), lh = Lh / NH;
    const tramos = [];
    for (let k = 0; k < NH; k++) {
      const gA2 = M.grupo(`haz ${l} ${k}`, { padre: gPol, bisagra: { punto: [X(XQ), yS, zH], eje: [0, 0, 1], rango: [0, 180] } });
      const gT2 = M.grupo(`haz ${l} ${k} t`, { padre: gA2, desliza: { dir: [1, 0, 0], rango: [-2.5, 2.5] } });
      const n = M.redondo({ nombre: `haz perforadora ${l} ${k}`, grupo: gT2, pieza: "viga", material: "manguera", F: marcoA([X(XQ), yS + RHO, zH], [1, 0, 0]), s0: -lh / 2, s1: lh / 2, r: RH, extremos: ["domo", "domo"], lados: 10 });
      tramos.push({ gA2, gT2, sigma: (k + 0.5) * lh });
      if (k > 0) M.unir(n, `haz perforadora ${l} ${k - 1}`, "mismo haz");
      if (k > 1) M.unir(n, `haz perforadora ${l} ${k - 2}`, "mismo haz");
    }
    for (const k of [0, 1]) M.unir(`haz perforadora ${l} ${k}`, `bloque racores ${l}`, "racores del haz");
    for (const k of [NH - 1, NH - 2]) M.unir(`haz perforadora ${l} ${k}`, `bloque haz viga ${l}`, "racores del haz");
    M.cadena(`haz ${l}`, (v) => {
      const p = v[gP] ?? 0, T = T0h + p / 2;
      v[gPol] = p / 2;
      v[gSop] = Math.max(0, p - EMPUJE);
      for (const h of tramos) {
        if (h.sigma <= T) { v[h.gA2] = 0; v[h.gT2] = T - h.sigma; }
        else if (h.sigma <= T + U) { v[h.gA2] = gradA((h.sigma - T) / RHO); v[h.gT2] = 0; }
        else { v[h.gA2] = 180; v[h.gT2] = -(h.sigma - T - U); }
      }
      return 0;
    });
    // cilindro de alzada: de la oreja baja de la rótula al tubo exterior
    M.placa({ nombre: `oreja cilindro rótula ${l}`, grupo: gG, pieza: "brazo", perfil: orejaA([[S + 0.33, YB - 0.45, 0.07], [S + 0.12, YB - 0.18, 0.02], [S + 0.2, YB - 0.28, 0.02]]), z: [z0 - 0.04, z0 + 0.04] });
    M.unir(`oreja cilindro rótula ${l}`, `rótula ${l}`, "soldada");
    ambos((t, m) => {
      M.placa({ nombre: `oreja cilindro brazo ${l}${m}`, grupo: gA, pieza: "brazo", perfil: orejaA([[LP + 1.35, YB - 0.24, 0.06], [LP + 1.2, YB - 0.12, 0.02], [LP + 1.5, YB - 0.12, 0.02]]), z: zr(t, 0.045, 0.075).map((v) => v + z0) });
      M.unir(`oreja cilindro brazo ${l}${m}`, `tubo exterior ${l}`, "soldada");
    });
    M.cilindro({ nombre: `cilindro alza ${l}`, pieza: "brazo", de: { grupo: gG, punto: [S + 0.33, YB - 0.45, z0] }, a: { grupo: gA, punto: [LP + 1.35, YB - 0.24, z0] }, eje: [0, 0, 1],
      rBarril: 0.075, rVastago: 0.045, rOjo: 0.065, anchoOjo: 0.075, inicioTubo: 0.09, puertos: false,
      pasadores: { r: 0.03, largoDe: 0.15, uneDe: [`oreja cilindro rótula ${l}`], tapasDe: false, largoA: 0.18, uneA: [`oreja cilindro brazo ${l}i`, `oreja cilindro brazo ${l}d`] } });
    M.unirLuego(`cilindro alza ${l}.ojoBase`, `oreja cilindro rótula ${l}`, "rótula esférica"); M.unirLuego(`cilindro alza ${l}.cuello`, `oreja cilindro rótula ${l}`, "rótula esférica");
    // cilindro de avance de la viga: de la cara delantera de la zapata a una oreja bajo la viga, adelante
    M.caja({ nombre: `oreja avance ${l}`, grupo: gR, pieza: "viga", centro: [Q0[0] + 0.4, yAx - 0.39, zT], tam: [0.08, 0.12, 0.08] });
    M.unir(`oreja avance ${l}`, `zapata cuna ${l}`, "soldada");
    M.caja({ nombre: `oreja avance viga ${l}`, grupo: gV, pieza: "viga", centro: [xr + LV - 0.3, yAx - 0.36, zT], tam: [0.12, 0.12, 0.08] });
    M.unir(`oreja avance viga ${l}`, `viga ${l}`, "soldada");
    M.cilindro({ nombre: `cilindro avance ${l}`, pieza: "viga", de: { grupo: gR, punto: [Q0[0] + 0.4, yAx - 0.39, zT] }, a: { grupo: gV, punto: [xr + LV - 0.3, yAx - 0.39, zT] }, eje: [0, 0, 1],
      rBarril: 0.035, rVastago: 0.022, rOjo: 0.035, anchoOjo: 0.06, inicioTubo: 0.06, puertos: false,
      pasadores: { r: 0.016, largoDe: 0.1, uneDe: [`oreja avance ${l}`], tapasDe: false, largoA: 0.1, uneA: [`oreja avance viga ${l}`], tapasA: false } });
    M.unirLuego(`cilindro avance ${l}.ojoBase`, `oreja avance ${l}`, "rótula"); M.unirLuego(`cilindro avance ${l}.cuello`, `oreja avance ${l}`, "rótula");
    M.unirLuego(`cilindro avance ${l}.ojoVastago`, `oreja avance viga ${l}`, "rótula"); M.unirLuego(`cilindro avance ${l}.vastagoCromo`, `oreja avance viga ${l}`, "rótula");
    const racor = (n, grupo, punto, normal, base) => {
      const p = M.redondo({ nombre: `racor ${n}`, grupo, pieza: "brazo", material: "laton", F: marcoA(punto, normal), s0: -0.05, s1: 0, r: 0.024, lados: 8 });
      M.unir(p, base, "racor roscado");
      M.puerto(n, { grupo, punto, normal, pieza: p, reorientar: true });
    };
    // manguera del soporte al brazo, por fuera de la rótula: cruza el giro y la alzada cerca de sus ejes
    // haz de tres mangueras (presión, retorno, agua de barrido)
    for (const [k, dy] of [["", 0.02], [" b", 0.075], [" c", -0.035]]) {
      racor(`soporte ${l}${k}`, "base", [1.7, YB + dy, z0 + s * 0.3], [1, 0, 0], "soporte de brazos");
      racor(`brazo ${l}${k}`, gA, [LP + 0.45 + (dy - 0.02) * 1.5, YB + dy * 0.6, z0 + s * 0.15], [0, 0, s], `tubo exterior ${l}`);
      M.manguera({ nombre: `manguera brazo ${l}${k}`, de: `soporte ${l}${k}`, a: `brazo ${l}${k}`, r: 0.014, seno: [0, 0, s] });
    }
    // lazo del telescópico: del tubo exterior a la cabeza, por encima del brazo (el sobrante sube en arco al recoger)
    racor(`tubo cabeza ${l}`, gA, [LP + 2.0, YB + 0.13 + 0.05, z0], [0, 1, 0], `tubo exterior ${l}`);
    M.unir(`racor tubo cabeza ${l}`, `bloque salida brazo ${l}`, "racor roscado en el bloque");
    racor(`cabeza arriba ${l}`, gE, [W0[0] - 0.12, YB + 0.16 + 0.05, z0], [0, 1, 0], `cabeza ${l}`);
    M.manguera({ nombre: `lazo telescópico ${l}`, de: `tubo cabeza ${l}`, a: `cabeza arriba ${l}`, r: 0.018, seno: [0, 1, 0], holgura: 0.08, salida: 0.28 });
    // haz de la muñeca: de bajo la cabeza a la cara trasera del actuador de rotación (la rotación de la viga pasa
    // por dentro del actuador, como en el brazo real); cruza el giro de viga y el volteo, cortada para todo su rango
    racor(`cabeza lado ${l}`, gE, [W0[0] - 0.17, YB - 0.1 - 0.05, z0 + s * 0.05], [0, -1, 0], `cabeza ${l}`); // bajo la cabeza, detrás de la brida
    racor(`rotación atrás ${l}`, gC, [Q0[0] - 0.08, Q0[1] - 0.08 - 0.05, zT], [0, -1, 0], `actuador rotación ${l}`); // bajo el actuador: el haz cuelga en U
    M.manguera({ nombre: `haz muñeca ${l}`, de: `cabeza lado ${l}`, a: `rotación atrás ${l}`, r: 0.0125, holgura: 0.15 });
  });

  M.dims = { R, D, W, xR, L0, EXT, LV, LB, CARR, DB, techo, geo, S, LP, YB };
  const muestras = [];
  // rango: brazos hacia afuera o al centro (cruzarlos es lo que impide el sistema anticolisión del jumbo)
  for (const g of [0, 15, 30]) for (const a of [-20, 0, 20, 45]) for (const e of [0, EXT]) muestras.push({ "giro i": -g, "giro d": g, "alza i": a, "alza d": a, "exte i": e, "exte d": e, "viga i": 0.8, "viga d": 0.8 });
  for (const n of ["del i", "del d", "tras i", "tras d"]) for (const v of [0, M.grupos.get(`gata ${n}`).desliza.rango[1]]) muestras.push({ [`gata ${n}`]: v });
  // rotación de la viga en todo su rango; giro y volteo de viga hacia afuera (los ciclos de perforación los recorre el juez)
  for (const r of [0, 90, 180]) muestras.push({ "rollo i": r, "rollo d": -r, "viga i": 1.0, "viga d": 1.0, "alza i": 15, "alza d": 15, "exte i": 0.5, "exte d": 0.5 });
  for (const y of [0, 10]) for (const c of [-40, -20, 0, 12]) muestras.push({ "muñeca i": -y, "muñeca d": y, "cabeceo i": c, "cabeceo d": c, "viga i": 1.0, "viga d": 1.0, "alza i": 15, "alza d": 15, "exte i": 0.5, "exte d": 0.5 });
  // perforadora en su carrera (la polea a media velocidad, el haz y el soporte intermedio la siguen): brazo al frente
  // y con la viga girada 180° (arrastres)
  for (const r of [0, 180]) for (const p of [0, 1.0, 1.9, 3.0, CARR + 0.3]) muestras.push({ "perf i": p, "perf d": p, "rollo i": r, "rollo d": -r, "viga i": 1.0, "viga d": 1.0, "alza i": 15, "alza d": 15, "exte i": 0.5, "exte d": 0.5 });
  M.dimensionar(muestras);
  ambos((s, l) => { for (const k of ["", " b", " c"]) M.puertos.get(`soporte ${l}${k}`).hacia = `brazo ${l}${k}`; });
  M.orientarPuertos({});
  // las mangueras se cortan para el rango de trabajo de la muñeca y del telescópico
  const muestrasMang = [...muestras];
  for (const y of [-30, 0, 30]) for (const e of [0, EXT]) for (const a of [-20, 30]) muestrasMang.push({ "muñeca i": y, "muñeca d": -y, "exte i": e, "exte d": e, "alza i": a, "alza d": a, "giro i": -y / 2, "giro d": y / 2 });
  M.dimensionarMangueras(muestrasMang);
  M.muestrasRango = muestras;
  return M;
}

/**
 * Cinemática inversa de un brazo: la boca de la viga (centralizador) en el emboquille C, la viga paralela a d.
 * Orientación analítica (giro·alza·muñeca·cabeceo) y posición por iteración con el modelo (las piezas de la muñeca
 * tienen desplazamientos reales). Devuelve los valores del brazo y el error de posición (m).
 */
export function apuntarJumbo(M, l, C, d, op = {}) {
  const g = M.dims.geo[l], G = g.grupos;
  const rollo = op.rollo ?? 0;
  const { S: Sx, LP, YB } = M.dims, S = [Sx, YB, g.z0], LP0 = [LP - Sx, 0, 0];
  const v = { [G.gR]: rollo, [G.gV]: op.viga ?? 0.8, [G.gP]: op.avance ?? 0 };
  let W = [g.W0[0] + 1, g.W0[1], g.W0[2]];
  let err = 9;
  const ry = (a) => RA.eje([0, 1, 0], a), rz = (a) => RA.eje([0, 0, 1], a);
  for (let it = 0; it < 30; it++) {
    // brazo desde la muñeca objetivo W
    const yB = gradA(Math.atan2(-(W[2] - S[2]), W[0] - S[0]));
    const Lp = VA.add(S, RA.vec(ry(yB), LP0));
    const w = VA.sub(W, [Lp[0], YB, Lp[2]]);
    const pB = gradA(Math.atan2(w[1], Math.hypot(w[0], w[2])));
    v[G.gG] = yB; v[G.gA] = pB; v[G.gE] = VA.len(w) - (g.W0[0] - LP);
    // orientación de la viga: muñeca y cabeceo
    const vv = RA.vec(RA.tr(RA.mul(ry(yB), rz(pB))), d);
    v[G.gM] = gradA(Math.atan2(-vv[2], vv[0]));
    v[G.gC] = gradA(Math.asin(Math.max(-1, Math.min(1, vv[1]))));
    // posición: mover la muñeca lo que falta a la boca de la viga
    const pose = M.posar({ ...op.otros, ...v, _sinMangueras: true });
    const F = pose.local(G.gV, g.frente);
    const e = VA.sub(C, F);
    err = VA.len(e);
    W = VA.add(pose.local(G.gE, g.W0), e);
    // la viga avanza o retrocede para dejar el telescópico cerca de la mitad de su carrera
    if (it > 4 && it < 25) v[G.gV] = Math.max(0, Math.min(1.45, v[G.gV] + 0.6 * (v[G.gE] - 0.45)));
    if (err < 1e-4 && it > 8) break;
  }
  return { valores: v, error: err };
}

/** Medidas del modelo (juez · fidelidad). */
export function medirJumbo(M) {
  const d = M.dims, P = (n) => M.porNombre.get(n);
  const ruedas = M.piezas.filter((p) => p.tipo === "llanta");
  const zs = ruedas.flatMap((p) => p.casco.map((q) => q[2]));
  const g = M.grupos.get("perf i").desliza.rango[1];
  return {
    barra: P("barra i").s1 - P("barra i").s0, broca: 2 * P("broca i").r0, carrera: Math.min(g, d.CARR + 0.02) - 0.02 + 0.0,
    // la viga entera: del tope trasero a la goma del centralizador (piezas del grupo de la viga)
    viga: (() => { const xs = M.piezas.filter((p) => p.grupo === "viga i").flatMap((p) => p.casco.map((q) => q[0])); return Math.max(...xs) - Math.min(...xs); })(),
    ancho: Math.max(...zs) - Math.min(...zs), rueda: d.D, ejes: -d.xR, brazo: d.L0, extension: M.grupos.get("exte i").desliza.rango[1],
    techo: Math.max(...P("techo protector").casco.map((q) => q[1])),
  };
}

/** Registro del equipo. */
export const EQUIPO_JUMBO = {
  nombre: "jumbo", medidas: MEDIDAS_JUMBO,
  modelo: (op) => modeloJumbo(op), medir: (M) => medirJumbo(M),
  dibujo: { color: "#e0b11c", colorAro: "#e0b11c", colorPerforadora: "#c8452f", alturaBarro: 1.0 }, // barro hasta ≈ 0,5 m y polvo en las caras de arriba (suciedad de estudio, a la mitad)
};
