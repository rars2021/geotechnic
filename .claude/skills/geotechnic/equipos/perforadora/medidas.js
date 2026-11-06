// Agente equipo-perforadora · medidas con fuente (Perforadora rotativa de tajo). Cada número con clave de fuente y página, o «estimado» con nota.
// El modelo sigue en kit/equipos.js (v1, sin juez): pendiente pasarlo al motor A (references/motor-a.md).
export const MEDIDAS_PERFORADORA = {
  equipo: "Perforadora rotativa de tajo",
  medidas: [
    {id: "diamProduccion",dato: "Diámetro de producción",valor: 0.351,unidad: "m",tol: 0.01,fuente: {autor: "Bonilla Vargas",anio: 2024,clave: "hdl:20.500.14076/28169",donde: "tabla 4 (351 · 211 · 127 mm en Antamina)"}},
    {id: "diamPrecorte",dato: "Diámetro de precorte",valor: 0.127,unidad: "m",tol: 0.01,fuente: {autor: "Bonilla Vargas",anio: 2024,clave: "hdl:20.500.14076/28169",donde: "tabla 4"}},
    {id: "mastil",dato: "Altura del mástil",valor: 19,unidad: "m",tol: 0.05,fuente: null,nota: "estimado"},
  ],
};
