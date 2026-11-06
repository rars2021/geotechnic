// Agente equipo-camion · medidas con fuente (Camión de acarreo clase CAT 793). Cada número con clave de fuente y página, o «estimado» con nota.
// El modelo está en equipos/camion/modelo.js (motor A). El v1 de kit/equipos.js (camionAcarreo) queda para escenas viejas.
export const MEDIDAS_CAMION = {
  equipo: "Camión de acarreo clase CAT 793",
  medidas: [
    {id: "capacidad",dato: "Capacidad",valor: 228,unidad: "t",tol: 0.02,fuente: {autor: "Bonilla Vargas",anio: 2024,clave: "hdl:20.500.14076/28169",donde: "tabla 4 (Antamina, 226–230 t)"}},
    {id: "largo",dato: "Largo",valor: 12.9,unidad: "m",tol: 0.03,fuente: null,nota: "estimado (catálogo del fabricante, no verificado en el catálogo de fuentes)"},
    {id: "ancho",dato: "Ancho",valor: 7.6,unidad: "m",tol: 0.03,fuente: null,nota: "estimado"},
    {id: "rueda",dato: "Diámetro de rueda",valor: 3.55,unidad: "m",tol: 0.03,fuente: null,nota: "estimado"},
    {id: "ejes",dato: "Distancia entre ejes",valor: 5.9,unidad: "m",tol: 0.03,fuente: null,nota: "estimado"},
    {id: "volumen",dato: "Volumen colmado SAE 2:1",valor: 129,unidad: "m³",tol: 0.05,fuente: null,nota: "estimado (catálogo CAT 793F, no verificado en el catálogo de fuentes)"},
    {id: "alturaCarga",dato: "Altura de carga (borde de la tolva, vacío)",valor: 5.97,unidad: "m",tol: 0.05,fuente: null,nota: "estimado (catálogo CAT 793F, no verificado en el catálogo de fuentes)"},
    {id: "alturaVisera",dato: "Altura a la visera",valor: 6.4,unidad: "m",tol: 0.05,fuente: null,nota: "estimado (catálogo CAT 793F, no verificado en el catálogo de fuentes)"},
    {id: "volteo",dato: "Ángulo de volteo de la tolva",valor: 45,unidad: "°",tol: 0.05,fuente: null,nota: "estimado (clase 220–240 t: 45–50°; no verificado en el catálogo de fuentes)"},
    {id: "giro",dato: "Ángulo de dirección (medio de las dos ruedas)",valor: 35,unidad: "°",tol: 0.1,fuente: null,nota: "estimado (no verificado en el catálogo de fuentes)"},
  ],
  // No son medidas del camión (el juez de fidelidad no las mide): datos con fuente para la escena.
  via: {id: "anchoVia",dato: "Ancho operativo de vía (185–400 t)",valor: 8.4,unidad: "m",fuente: {autor: "Pelaez Vera",anio: 2013,clave: "hdl:20.500.14076/10395",donde: "tabla 4.3 (8,4 m a 9,75 m)"},nota: "regla de diseño de vías: la usa la escena (dispatch), no el modelo"},
  // Supuesto para pasar del volumen de la tolva (geometría) a toneladas (capacidad con fuente).
  densidadSuelta: {valor: 1.76,unidad: "t/m³",fuente: null,nota: "estimado: 226,8 t / 129 m³ (catálogo CAT 793F); roca fragmentada típica 1,7–1,8"},
};
