// Agente equipo-volquete · medidas con fuente (Volquete 8×4 clase Volvo FMX). Cada número con clave de fuente y página, o «estimado» con nota.
// El modelo sigue en kit/equipos.js (v1, sin juez): pendiente pasarlo al motor A (references/motor-a.md).
export const MEDIDAS_VOLQUETE = {
  equipo: "Volquete 8×4 clase Volvo FMX",
  medidas: [
    {id: "velCargado",dato: "Velocidad cargado",valor: 11,unidad: "km/h",tol: 0.02,fuente: {autor: "Reynoso Paucar",anio: 2023,clave: "hdl:20.500.14076/27172",donde: "tabla 7"}},
    {id: "velVacio",dato: "Velocidad vacío",valor: 20,unidad: "km/h",tol: 0.02,fuente: {autor: "Reynoso Paucar",anio: 2023,clave: "hdl:20.500.14076/27172",donde: "tabla 7"}},
    {id: "carguio",dato: "Tiempo de carguío",valor: 8,unidad: "min",tol: 0.02,fuente: {autor: "Reynoso Paucar",anio: 2023,clave: "hdl:20.500.14076/27172",donde: "tabla 7"}},
  ],
};
