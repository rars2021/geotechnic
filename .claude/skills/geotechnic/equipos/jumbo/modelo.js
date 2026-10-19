// Agente equipo-jumbo · modelo del jumbo frontal de dos brazos (clase Boomer E2C) en el motor A.
// Mundo de la máquina: x adelante, y arriba, z izquierda; origen en el piso bajo el eje delantero.
//
// Lista de piezas (antes de la geometría). Grupos por brazo b ∈ {i (+z), d (−z)}:
//   base → giro b (actuador rotativo, eje vertical) → alza b (bisagra horizontal) → exte b (telescópico) →
//   muñeca b (giro de viga, eje vertical) → cabeceo b (volteo de viga, eje horizontal) → rollo b (rotación 360°,
//   eje paralelo a la viga) → viga b (avance de la viga) → perf b (carro de la perforadora sobre la viga)
//
// | Grupo    | Piezas                                                                                       |
// |----------|----------------------------------------------------------------------------------------------|
// | base     | chasis delantero y trasero, unión, ejes, 4 ruedas, capó bajo y alto, carrete de cable con su   |
// |          | soporte, plataforma, consola, asiento, techo protector y parantes, soporte de brazos con sus   |
// |          | horquillas, 4 gatas (barril), faros                                                            |
// | giro b   | rótula del brazo (actuador rotativo), orejas del cilindro de alzada                             |
// | alza b   | articulación de alzada, tubo exterior, orejas del cilindro                                     |
// | exte b   | tubo interior, cabeza del brazo, actuador de giro de viga                                      |
// | muñeca b | brida, soporte, actuador de volteo                                                             |
// | cabeceo b| bridas, brazos, actuador de rotación y su eje                                                  |
// | rollo b  | puentes y laterales de la cuna, zapatas guía                                                   |
// | viga b   | viga de aluminio, tope trasero, centralizador delantero con su goma                            |
// | perf b   | perforadora (cuerpo, motor de rotación), adaptador, barra, broca                               |
// | cilindros| alzada (2), avance de viga (2), gatas (4)                                                      |
// | mangueras| haz soporte → brazo (3 por brazo, cruzan giro y alzada cerca de sus ejes) y lazo del          |
// |          | telescópico (1 por brazo). Pendiente: las de la perforadora sobre la viga (polea a media vel.) |
import { maquina, marcoA, orejaA, VA, RA, gradA } from "../../motorA/modelo.js";
import { MEDIDAS_JUMBO } from "./medidas.js";

export function medidaJumbo(id) { const m = MEDIDAS_JUMBO.medidas.find((x) => x.id === id); return m ? m.valor : undefined; }

export function modeloJumbo(op = {}) {
  const md = (id) => medidaJumbo(id);
  const D = md("rueda"), R = D / 2, Wt = 0.42, W = md("ancho"), zW = W / 2 - Wt / 2;
  const xR = -md("ejes");
  const L0 = md("brazo"), EXT = md("extension"), LV = md("viga"), LB = md("barra"), CARR = md("carrera"), DB = md("broca");
  const techo = md("techo");
  const S = 1.95, LP = 2.22, YB = 1.6; // eje de giro, eje de alzada (0,27 m delante: la rótula y la articulación no se tocan), altura
  const M = maquina("jumbo", { medidas: MEDIDAS_JUMBO });
  const zr = (s, a, b) => (s > 0 ? [a, b] : [-b, -a]);
  const ambos = (f) => { f(1, "i"); f(-1, "d"); };

  // ───────────────────────── carrier (base)
  M.caja({ nombre: "chasis delantero", grupo: "base", pieza: "carrier", centro: [0.05, 0.75, 0], tam: [2.4, 0.5, 1.0] });
  M.caja({ nombre: "chasis trasero", grupo: "base", pieza: "carrier", centro: [-3.125, 0.75, 0], tam: [3.55, 0.5, 1.0] });
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
  M.caja({ nombre: "capó bajo", grupo: "base", pieza: "carrier", centro: [-3.675, 1.125, 0], tam: [2.65, 0.35, 1.4] });
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
  // detalle: palancas del panel, gabinete eléctrico, tanque de agua, persianas del capó, faros traseros
  for (let k = 0; k < 4; k++) M.barra({ nombre: `palanca ${k}`, grupo: "base", pieza: "techo", material: "negro", de: [0.36, 1.88, 0.3 + k * 0.12], a: [0.3, 2.06, 0.3 + k * 0.12], r: 0.012 });
  for (let k = 0; k < 4; k++) M.unir(`palanca ${k}`, "panel de mandos", "palanca en su base");
  M.caja({ nombre: "gabinete eléctrico", grupo: "base", pieza: "carrier", material: "gris", centro: [-0.45, 1.75, -0.75], tam: [0.9, 0.78, 0.5] });
  M.caja({ nombre: "tanque de agua", grupo: "base", pieza: "carrier", material: "gris", centro: [-3.7, 2.17, 0], tam: [1.9, 0.4, 1.0] });
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
    M.caja({ nombre: `oreja gata ${n}`, grupo: "base", pieza: "gatas", centro: [x, yb, z * 0.9], tam: [0.24, 0.1, Math.abs(z) * 0.2 + 0.2] });
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
    const yAx = Q0[1] + 0.95, xr = Q0[0] - 1.6; // la viga pasa sobre el brazo al girarla
    const gV = M.grupo(`viga ${l}`, { padre: gR, desliza: { dir: [1, 0, 0], rango: [0, 1.45] } }); // más allá, el tope trasero llega a la cuna
    const gP = M.grupo(`perf ${l}`, { padre: gV, desliza: { dir: [1, 0, 0], rango: [0, CARR + 0.45] } });
    geo[l] = { z0, zT, s, W0, T0, Q0, yAx, xr, frente: [xr + LV, yAx, zT], grupos: { gG, gA, gE, gM, gC, gR, gV, gP } };
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
    M.caja({ nombre: `tubo exterior ${l}`, grupo: gA, pieza: "brazo", centro: [LP + 0.1 + 1.25, YB, z0], tam: [2.5, 0.26, 0.2] });
    M.unir(`tubo exterior ${l}`, `articulación alza ${l}`, "soldado");
    // el tubo interior queda dentro del exterior aun extendido (traslape ≥ 0,8 m)
    M.caja({ nombre: `tubo interior ${l}`, grupo: gE, pieza: "brazo", material: "acero", centro: [(2.6 + W0[0] - 0.12) / 2, YB, z0], tam: [W0[0] - 0.12 - 2.6, 0.2, 0.15] });
    M.unir(`tubo interior ${l}`, `tubo exterior ${l}`, "telescópico");
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
    // viga de avance (aluminio) sobre la zapata, tope trasero y centralizador delantero con goma
    M.caja({ nombre: `viga ${l}`, grupo: gV, pieza: "viga", material: "aluminio", centro: [xr + (LV - 0.06) / 2, yAx - 0.21, zT], tam: [LV - 0.06, 0.18, 0.16] });
    M.unir(`viga ${l}`, `zapata cuna ${l}`, "guía de la viga");
    for (const k of ["i", "d"]) M.unir(`viga ${l}`, `lateral cuna ${l}${k}`, "guía de la viga");
    M.caja({ nombre: `tope trasero ${l}`, grupo: gV, pieza: "viga", centro: [xr - 0.03, yAx - 0.12, zT], tam: [0.06, 0.36, 0.2] });
    M.unir(`tope trasero ${l}`, `viga ${l}`, "soldado");
    M.caja({ nombre: `centralizador ${l}`, grupo: gV, pieza: "viga", material: "acero", centro: [xr + LV - 0.06, yAx - 0.03, zT], tam: [0.12, 0.24, 0.17], tocaRoca: true });
    M.unir(`centralizador ${l}`, `viga ${l}`, "soldado");
    // perforadora sobre la viga: cuerpo, motor de rotación, adaptador, barra y broca
    const xp = xr + 0.12;
    M.redondo({ nombre: `perforadora ${l}`, grupo: gP, pieza: "perforadora", material: "rojo", F: marcoA([xp, yAx, zT], [1, 0, 0]), s0: 0, s1: 0.62, r: 0.12, lados: 18 });
    M.caja({ nombre: `motor rotación ${l}`, grupo: gP, pieza: "perforadora", material: "rojo", centro: [xp + 0.72, yAx + 0.02, zT], tam: [0.2, 0.2, 0.2] });
    M.unir(`motor rotación ${l}`, `perforadora ${l}`, "apernado");
    M.redondo({ nombre: `adaptador ${l}`, grupo: gP, pieza: "barra", material: "acero", F: marcoA([xp + 0.82, yAx, zT], [1, 0, 0]), s0: 0, s1: 0.03, r: 0.035 });
    M.unir(`adaptador ${l}`, `motor rotación ${l}`, "culata");
    const x0b = xp + 0.85;
    M.redondo({ nombre: `barra ${l}`, grupo: gP, pieza: "barra", material: "acero", F: marcoA([x0b, yAx, zT], [1, 0, 0]), s0: 0, s1: LB, r: 0.019, lados: 10, entraTaladro: true });
    M.unir(`barra ${l}`, `adaptador ${l}`, "rosca");
    M.redondo({ nombre: `broca ${l}`, grupo: gP, pieza: "barra", material: "acero", F: marcoA([x0b + LB, yAx, zT], [1, 0, 0]), s0: 0, s1: LV - 0.12 - 0.85 - LB, r: DB / 2, lados: 12, entraTaladro: true });
    M.unir(`broca ${l}`, `barra ${l}`, "rosca");
    for (const n of [`barra ${l}`, `broca ${l}`]) M.unir(n, `centralizador ${l}`, "la barra pasa por el centralizador");
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
    racor(`cabeza arriba ${l}`, gE, [W0[0] - 0.12, YB + 0.16 + 0.05, z0], [0, 1, 0], `cabeza ${l}`);
    M.manguera({ nombre: `lazo telescópico ${l}`, de: `tubo cabeza ${l}`, a: `cabeza arriba ${l}`, r: 0.018, seno: [0, 1, 0], holgura: 0.08, salida: 0.28 });
  });

  M.dims = { R, D, W, xR, L0, EXT, LV, LB, CARR, DB, techo, geo, S, LP, YB };
  const muestras = [];
  // rango: brazos hacia afuera o al centro (cruzarlos es lo que impide el sistema anticolisión del jumbo)
  for (const g of [0, 15, 30]) for (const a of [-20, 0, 20, 45]) for (const e of [0, EXT]) muestras.push({ "giro i": -g, "giro d": g, "alza i": a, "alza d": a, "exte i": e, "exte d": e, "viga i": 0.8, "viga d": 0.8 });
  for (const n of ["del i", "del d", "tras i", "tras d"]) for (const v of [0, M.grupos.get(`gata ${n}`).desliza.rango[1]]) muestras.push({ [`gata ${n}`]: v });
  // rotación de la viga en todo su rango; giro y volteo de viga hacia afuera (los ciclos de perforación los recorre el juez)
  for (const r of [0, 90, 180]) muestras.push({ "rollo i": r, "rollo d": -r, "viga i": 1.0, "viga d": 1.0, "alza i": 15, "alza d": 15, "exte i": 0.5, "exte d": 0.5 });
  for (const y of [0, 10]) for (const c of [-40, -20, 0, 12]) muestras.push({ "muñeca i": -y, "muñeca d": y, "cabeceo i": c, "cabeceo d": c, "viga i": 1.0, "viga d": 1.0, "alza i": 15, "alza d": 15, "exte i": 0.5, "exte d": 0.5 });
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
    viga: (() => { const c = P("viga i").casco; return Math.max(...c.map((q) => q[0])) - Math.min(...c.map((q) => q[0])); })(),
    ancho: Math.max(...zs) - Math.min(...zs), rueda: d.D, ejes: -d.xR, brazo: d.L0, extension: M.grupos.get("exte i").desliza.rango[1],
    techo: Math.max(...P("techo protector").casco.map((q) => q[1])),
  };
}

/** Registro del equipo. */
export const EQUIPO_JUMBO = {
  nombre: "jumbo", medidas: MEDIDAS_JUMBO,
  modelo: (op) => modeloJumbo(op), medir: (M) => medirJumbo(M),
  dibujo: { color: "#e0b11c", colorAro: "#e0b11c", colorPerforadora: "#c8452f", alturaBarro: 0.9 },
};
