// Ejemplo scoop-lhd · montaje (puro): macizo, galería, contrato, scoop y ciclo de carguío.
// Lo usan la escena (página) y el juez (Node): lo que se anima es exactamente lo que se juzga.
import { macizo } from "../../kit/macizo.js";
import { zona } from "../../kit/volumenes.js";
import { seccionBaul, galeria, superficieFrente, cajaBloque } from "../../kit/labor.js";
import { terrenoGaleria, huellasDe, asentar } from "../../kit/contrato.js";
import { modeloScoop } from "../../equipos/scoop/modelo.js";
import { clamp, lerp } from "../../kit/nucleo.js";

export function montajeScoop() {
  const X0 = -22, LARGO = 36, XF = X0 + LARGO; // frente en x = 14
  const M = modeloScoop();
  // motor B: macizo de Retamas (MARSA) con ruido explícito y una zona de óxidos húmeda
  const oxidos = zona({ tipo: "elipsoide", centro: [4, 3, 2], radios: [6, 3, 4], transicion: 2.5, ruido: 1.5, escalaRuido: 0.25, semilla: 2 });
  const mac = macizo({
    calma: 1, // estudio: color calmo (references/estudio.md); el relieve no cambia
    familias: [
      { nombre: "F1", buz: 71, dirBuz: 242, kappa: 40, espaciado: 0.7, persistencia: 2.2, relieve: 0.22, jrc: 10, maxDiscos: 700 },
      { nombre: "F2", buz: 40, dirBuz: 43, kappa: 35, espaciado: 0.9, persistencia: 2.6, relieve: 0.2, jrc: 8, maxDiscos: 600 },
      { nombre: "F3", buz: 65, dirBuz: 157, kappa: 35, espaciado: 1.1, persistencia: 1.8, relieve: 0.18, jrc: 12, maxDiscos: 500 },
    ],
    caja: { min: [X0 - 2, -2, -5], max: [XF + 2, 7, 5] }, semilla: 13,
    ruido: { amplitud: 0.07, longitud: 2.5, octavas: 3 }, aspereza: { amplitud: 0.03, longitud: 0.5 },
    litologia: ["#7e7a71", "#716d65", "#8a857b"], alteracion: [{ f: oxidos, paleta: ["#8c6e4c", "#7d6145"], peso: 0.55 }],
    agua: { base: 0.05, juntas: 0.45, piso: 0.6, zonas: [{ f: oxidos, peso: 0.25 }] },
    fuentes: { familias: "Eulogio Huamán (2024), Retamas (MARSA), pág. 83 · el catálogo de fuentes hdl:20.500.14076/27684" },
  });
  const gal = galeria({
    seccion: seccionBaul(4.0, 4.0), largo: LARGO, inicio: X0, paso: 0.11, sobreexcavacion: 0.22, macizo: mac,
    huellas: huellasDe(M), // contrato A → B: el piso lleva la trocha del scoop
    shotcrete: { desde: X0 - 1, hasta: -5, espesor: 0.05 },
    region: (x, tipo, enShot) => (enShot ? 3 : tipo === "piso" ? 4 : 2),
  });
  const supFrente = superficieFrente(gal, { x: XF, macizo: mac });
  // bloque de roca cerrado (motor B): la misma caja para el dibujo y para «libre» (fuera del bloque es aire)
  const caja = cajaBloque(gal);
  const ter = terrenoGaleria(gal, { frente: supFrente, caja });
  // ciclo de carguío: ángulos reales del brazo y del cucharón (envolvente de la barra en Z); duraciones ilustrativas
  const aLo = M.dims.rango.brazo[0];
  const lipNivel = (() => { const p = M.posar({ brazo: aLo, cucharon: -aLo }); let x = -Infinity; for (const c of M.cascos(p)) if (c.p.nombre.startsWith("diente")) for (const q of c.puntos) x = Math.max(x, q[0]); return x; })();
  const MONTON = 6.5; // largo del montón de mineral contra el frente
  const X_ECH = -0.6; // echadero con parrilla
  const xCarga = XF - MONTON - lipNivel + 0.9; // los dientes entran 0,9 m en el pie del montón
  const xDesc = X_ECH - 4.55; // el cucharón en descarga queda sobre la parrilla
  const xIni = xDesc - 1.5;
  const fases = [
    { t: 0, x: xIni, brazo: -20, cucharon: 60, carga: false, fase: "Acarreo vacío" },
    { t: 1.2, x: xIni + 0.6, brazo: aLo + 1.5, cucharon: -aLo - 1.5, carga: false, fase: "Baja y nivela" },
    { t: 4.6, x: xCarga - 0.9, brazo: aLo + 1.5, cucharon: -aLo - 1.5, carga: false, fase: "Aproximación" },
    { t: 5.6, x: xCarga, brazo: aLo + 1.5, cucharon: -aLo - 1.5, carga: false, fase: "Penetración" },
    { t: 6.8, x: xCarga, brazo: aLo + 4, cucharon: 64, carga: true, fase: "Recogida" },
    { t: 7.4, x: xCarga - 0.2, brazo: -20, cucharon: 60, carga: true, fase: "Recogida" },
    { t: 11.0, x: xDesc, brazo: -20, cucharon: 60, carga: true, fase: "Retroceso" },
    // en una galería de 4 m el cucharón recogido no puede subir más: a +10° pega en la bóveda y a 0° los dientes tocan la parrilla (lo encontró el juez)
    { t: 12.6, x: xDesc, brazo: 4, cucharon: 38, carga: true, fase: "Levante" },
    { t: 13.8, x: xDesc, brazo: 4, cucharon: -46, carga: false, fase: "Descarga" },
    { t: 14.8, x: xDesc, brazo: -5, cucharon: 20, carga: false, fase: "Retorno" },
    { t: 16.6, x: xIni, brazo: -20, cucharon: 60, carga: false, fase: "Retorno" },
  ];
  const T = fases[fases.length - 1].t;
  /** Estado del ciclo en t (s): valores para M.posar (con la máquina asentada en el piso), fase, carga y emisores. */
  function estado(t) {
    t = ((t % T) + T) % T;
    let i = 0; while (i < fases.length - 2 && fases[i + 1].t <= t) i++;
    const a = fases[i], b = fases[i + 1], u = clamp((t - a.t) / (b.t - a.t)), s = u * u * (3 - 2 * u);
    const valores = { brazo: lerp(a.brazo, b.brazo, s), cucharon: lerp(a.cucharon, b.cucharon, s), delantero: 0 };
    const x = lerp(a.x, b.x, s);
    valores._pose = asentar(M, valores, ter, { x, z: 0, rumbo: 0 });
    valores.rodar = x;
    const emisores = [];
    if (b.fase === "Penetración" || b.fase === "Recogida") emisores.push({ tipo: "cucharón", grupo: "cucharon", punto: [M.dims.K0[0] + 2.0, M.dims.K0[1] - 0.3, 0], tasa: 3 });
    if (b.fase === "Descarga") emisores.push({ tipo: "descarga", grupo: "cucharon", punto: [M.dims.K0[0] + 1.6, M.dims.K0[1], 0], tasa: 4 });
    return { valores, fase: b.fase, carga: u < 0.5 ? a.carga : b.carga, emisores, x };
  }
  return { M, mac, gal, ter, caja, supFrente, estado, T, X0, XF, LARGO, X_ECH, MONTON, fases, lipNivel };
}

/** Lo que juzga el juez: el ciclo entero, muestreado, y el rango de movimiento del modelo. */
export function pruebasScoop(paso = 0.1) {
  const m = montajeScoop();
  const poses = [];
  for (let t = 0; t < m.T; t += paso) { const e = m.estado(t); poses.push({ etiqueta: `ciclo t=${t.toFixed(1)} s · ${e.fase}`, valores: e.valores }); }
  return { montaje: m, M: m.M, terreno: m.ter, ciclo: poses, rango: m.M.muestrasRango.map((v, i) => ({ etiqueta: `rango ${i}`, valores: v })) };
}

/** Nombre común que busca el juez. */
export const pruebas = pruebasScoop;
