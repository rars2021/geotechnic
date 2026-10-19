// Agente equipo-shotcrete · medidas con fuente (Lanzador de shotcrete). Cada número con clave el catálogo de fuentes y página, o «estimado» con nota.
// El modelo sigue en kit/equipos.js (v1, sin juez): pendiente pasarlo al motor A (references/motor-a.md).
export const MEDIDAS_SHOTCRETE = {
  equipo: "Lanzador de shotcrete",
  medidas: [
    {id: "espesor",dato: "Espesor de shotcrete",valor: 0.05,unidad: "m",tol: 0.1,fuente: null,nota: "estimado (≈ 5 cm, como en el ejemplo scoop)"},
    {id: "alcance",dato: "Alcance del brazo",valor: 8,unidad: "m",tol: 0.05,fuente: null,nota: "estimado"},
  ],
};
