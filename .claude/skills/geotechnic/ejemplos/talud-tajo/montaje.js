// Ejemplo talud-tajo · montaje: el talud (motor B) como un bloque cerrado con su contrato exacto, y el camión del
// motor A asentado al pie. Lo usan la escena (página) y el juez (Node): lo que se dibuja es lo que se juzga.
// Familias, falla, óxidos y agua: ilustrativos o con fuente en ficha.mjs.
import { perfilBancos, mallaTalud, huellasNeumatico, bloqueTalud } from "../../kit/terreno.js";
import { crearDFN } from "../../kit/fracturas.js";
import { zona, colorRoca, agua } from "../../kit/volumenes.js";
import { PALETAS } from "../../kit/materiales.js";
import { terrenoTalud, asentar } from "../../kit/contrato.js";
import { modeloCamion } from "../../equipos/camion/modelo.js";
import { rgb, suave, clamp, rad, ruido3 } from "../../kit/nucleo.js";

export const OPCIONES_TALUD = { largo: 92, base: -14, bfa2: 65, camion: { x: -18, z: 20, rumbo: 2.3 } };

export function montajeTalud(op = {}) {
  const o = { ...OPCIONES_TALUD, ...op }, LARGO = o.largo;
  // Familias ilustrativas (no hay levantamiento de esta pared en el catálogo de fuentes): dos subverticales y una inclinada.
  const familias = [
    { nombre: "J1", buz: 82, dirBuz: 205, kappa: 45, espaciado: 1.8, persistencia: 3.2, relieve: 0.55, maxDiscos: 500 },
    { nombre: "J2", buz: 75, dirBuz: 110, kappa: 35, espaciado: 2.4, persistencia: 2.6, relieve: 0.45, maxDiscos: 400 },
    { nombre: "J3", buz: 38, dirBuz: 330, kappa: 30, espaciado: 3.0, persistencia: 4.0, relieve: 0.4, maxDiscos: 350 },
  ];
  const dfn = crearDFN(familias, { min: [-LARGO / 2, -4, -110], max: [LARGO / 2, 52, 36] }, 7);
  // Falla con panizo: plano que corta la pared en diagonal (buz 70° hacia el oeste-suroeste)
  const nF = (() => { const b = rad(70), d = rad(250); return [Math.sin(b) * Math.sin(d), Math.cos(b), -Math.sin(b) * Math.cos(d)]; })();
  const pF = [8, 20, -30];
  const falla = zona({ tipo: "plano", punto: pF, normal: nF, espesor: 1.4, transicion: 2.5, ruido: 0.8, semilla: 3 });
  const halo = zona({ tipo: "plano", punto: pF, normal: nF, espesor: 6, transicion: 7, ruido: 3, semilla: 4 });
  const oxidos = zona({ tipo: "elipsoide", centro: [-26, 34, -40], radios: [24, 16, 20], transicion: 9, ruido: 7, semilla: 6 });
  const nOx = ruido3(41);
  const color = colorRoca(["#b1b4b2", "#a3a7a6", "#c0c1bc"], [
    { f: halo, paleta: PALETAS.argilica, peso: 0.75 },
    { f: (x, y, z) => oxidos(x, y, z) * clamp(0.5 + 0.9 * nOx(x * 0.11, y * 0.11, z * 0.11)), paleta: ["#b5a07a", "#a28d6a"], peso: 0.35 },
    { f: falla, paleta: PALETAS.panizo, peso: 1 },
  ]);
  const agu = agua({ nivel: 7, transicion: 2.5, chorreras: 0.7, largoChorrera: 9 });
  const humedad = (x, y, z, dist, pend) => clamp(Math.max(agu(x, y, z, dist, pend) * 0.85, falla(x, y, z) * (1 - suave(10, 30, y)) * 0.9));
  /** Talud con el ángulo de cara del banco 2 (el control de la página): malla, bloque cerrado y contrato. */
  function construir(bfa2 = o.bfa2) {
    const perfil = perfilBancos({ piso: 34, bancos: [{ altura: 15, cara: 71, berma: 7.5 }, { altura: 15, cara: bfa2, berma: 7.5 }, { altura: 15, cara: 65, berma: 26 }] });
    const huellas = huellasNeumatico({ carriles: [-27, -23.5, -14, -10.5], ancho: 1.3 });
    const regionDe = (u, s, tramo, f) => {
      const x = u, y = f.z, z = -f.h;
      if (falla(x, y, z) > 0.5) return 10;
      if (oxidos(x, y, z) > 0.55 && tramo.tipo === "cara") return 11;
      if (tramo.tipo === "cara" && f.z < 7.5) return 12; // bajo la línea de surgencia
      if (Math.abs(f.dCresta) < 2.2 && f.bancoPie >= 0) return 8;
      if (f.dPie < 0 && f.dPie > -6 && f.bancoPie === 1) return 9;
      if (tramo.tipo === "cara") return tramo.banco + 1;
      if (tramo.tipo === "berma") return 4 + tramo.banco;
      return tramo.tipo === "piso" ? 6 : 7;
    };
    const talud = mallaTalud({
      perfil, largo: LARGO, paso: 0.28, dfn, color, humedad, region: regionDe, huellas,
      oxidos: (x, y, z) => 0.12 + 0.6 * oxidos(x, y, z), estrias: 0.15, bloques: 0.8, retroceso: 1.9, // estudio: relieve a la mitad (menos grano a la distancia)
      escombros: { alto: 2.6, reposo: 34 }, polvoBerma: rgb("#c4c2ba"), finos: rgb("#aeaba3"),
      extra: (x, y, z) => -0.9 * falla(x, y, z) - 0.15 * halo(x, y, z),
    });
    const blq = bloqueTalud(talud, { base: o.base, color, calma: 1 });
    const ter = terrenoTalud(blq);
    return { talud, blq, ter, bfa2 };
  }
  const t0 = construir(o.bfa2);
  // camión del motor A al pie (para escala), asentado con sus seis ruedas en el piso del contrato
  const Mc = modeloCamion({ carga: true });
  const valoresCamion = (ter) => { const v = { tolva: 0, giro: 0, rodar: 0 }; v._pose = asentar(Mc, v, ter, o.camion); return v; };
  return { op: o, LARGO, dfn, falla, halo, oxidos, color, construir, ...t0, Mc, valoresCamion };
}

/** Lo que juzga el juez: el camión al pie con el talud de cada extremo del control (la cara del banco 2 no lo mueve). */
export function pruebasTalud() {
  const m = montajeTalud();
  const ciclo = [55, 65, 80].map((b) => ({ etiqueta: `camión al pie · cara del banco 2 a ${b}°`, valores: m.valoresCamion(b === m.bfa2 ? m.ter : m.construir(b).ter) }));
  return { montaje: m, M: m.Mc, terreno: m.ter, ciclo, rango: (m.Mc.muestrasRango || [{}]).map((v, i) => ({ etiqueta: `rango ${i}`, valores: v })) };
}

/** Nombre común que busca el juez. */
export const pruebas = pruebasTalud;
