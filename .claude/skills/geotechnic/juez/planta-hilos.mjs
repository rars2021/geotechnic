// Geotechnic · juez · montaje de planta para juzgarConjuntoHilos (plantasFisica). Mismo contrato que un
// ejemplos/<tema>/montaje.js: pruebas(paso) → { maquinas, ciclo, terreno }. Dos «bloques» sobre un plano (y = 0):
//   A con un brazo que a −30° baja dentro de su chasis (interpenetración en p3 y p15, mismo margen: gana p3);
//   B que se mueve en x: hundida 20 cm en la roca en p5 y p17, metida 10 cm en A en p9 y p21, ausente en p13.
import { maquina } from "../motorA/modelo.js";

function bloque(brazo) {
  const M = maquina("bloque");
  M.caja({ nombre: "chasis", grupo: "base", centro: [0, 0.5, 0], tam: [2, 1, 1] });
  M.caja({ nombre: "cabina", grupo: "base", centro: [0.5, 1.4, 0], tam: [0.8, 0.8, 0.8] });
  if (brazo) {
    M.grupo("brazo", { bisagra: { punto: [1, 1.1, 0], eje: [0, 0, 1], rango: [-40, 40] } });
    M.caja({ nombre: "brazo", grupo: "brazo", centro: [0.4, 1.1, 0], tam: [1.2, 0.16, 0.3] });
  }
  return M;
}

export function pruebas(paso = 1) {
  const Ma = bloque(true), Mb = bloque(false);
  const ciclo = [];
  for (let i = 0; i < 24 * paso; i++) {
    const B = i === 13 ? null : { _pose: { x: i % 12 === 9 ? 1.9 : 3 + 0.25 * i, y: i % 12 === 5 ? -0.2 : 0 } };
    ciclo.push({ etiqueta: `p${i}`, porMaquina: { A: { brazo: i % 12 === 3 ? -30 : 0 }, B } });
  }
  return { maquinas: [{ id: "A", equipo: "bloque", M: Ma }, { id: "B", equipo: "bloque", M: Mb }], ciclo, terreno: { piso: () => 0, libre: (p) => p[1] } };
}
