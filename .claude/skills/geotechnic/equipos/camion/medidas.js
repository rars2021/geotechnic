// Agente equipo-camion · medidas con fuente (Camión de acarreo clase CAT 793). Cada número con clave el catálogo de fuentes y página, o «estimado» con nota.
// El modelo sigue en kit/equipos.js (v1, sin juez): pendiente pasarlo al motor A (references/motor-a.md).
export const MEDIDAS_CAMION = {
  equipo: "Camión de acarreo clase CAT 793",
  medidas: [
    {id: "capacidad",dato: "Capacidad",valor: 228,unidad: "t",tol: 0.02,fuente: {autor: "Bonilla Vargas",anio: 2024,clave: "hdl:20.500.14076/28169",donde: "tabla 4 (Antamina, 226–230 t)"}},
    {id: "anchoVia",dato: "Ancho operativo de vía (185–400 t)",valor: 8.4,unidad: "m",tol: 0.05,fuente: {autor: "Pelaez Vera",anio: 2013,clave: "hdl:20.500.14076/10395",donde: "tabla 4.3 (8,4 m a 9,75 m)"}},
    {id: "largo",dato: "Largo",valor: 12.9,unidad: "m",tol: 0.03,fuente: null,nota: "estimado (catálogo del fabricante, no verificado en el catálogo de fuentes)"},
    {id: "ancho",dato: "Ancho",valor: 7.6,unidad: "m",tol: 0.03,fuente: null,nota: "estimado"},
    {id: "rueda",dato: "Diámetro de rueda",valor: 3.55,unidad: "m",tol: 0.03,fuente: null,nota: "estimado"},
    {id: "ejes",dato: "Distancia entre ejes",valor: 5.9,unidad: "m",tol: 0.03,fuente: null,nota: "estimado"},
  ],
};
