// Agente equipo-pala · medidas con fuente (Pala eléctrica de cables clase P&H 4100). Cada número con clave el catálogo de fuentes y página, o «estimado» con nota.
// El modelo sigue en kit/equipos.js (v1, sin juez): pendiente pasarlo al motor A (references/motor-a.md).
export const MEDIDAS_PALA = {
  equipo: "Pala eléctrica de cables clase P&H 4100",
  medidas: [
    {id: "cucharon",dato: "Capacidad del cucharón",valor: 56,unidad: "m³",tol: 0.02,fuente: {autor: "Bonilla Vargas",anio: 2024,clave: "hdl:20.500.14076/28169",donde: "tabla 4 (Antamina)"}},
    {id: "pluma",dato: "Largo de la pluma",valor: 20,unidad: "m",tol: 0.05,fuente: null,nota: "estimado"},
    {id: "anguloPluma",dato: "Ángulo de la pluma",valor: 45,unidad: "°",tol: 0.05,fuente: null,nota: "estimado"},
  ],
};
