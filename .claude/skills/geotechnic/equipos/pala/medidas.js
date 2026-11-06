// Agente equipo-pala · medidas con fuente (Pala eléctrica de cables clase P&H 4100). Cada número con clave de fuente y página, o «estimado» con nota.
// Modelo en el motor A: equipos/pala/modelo.js (modeloPala). El v1 de kit/equipos.js (palaElectrica) queda para escenas viejas.
// «Medido»: leído en la fig. 4.17 de Arzapalo Gonzales (2022), plano de rango del P&H 4100XPC (especificaciones Komatsu
// Mining) con grilla de 2 m; la figura es de baja resolución (≈ 0,08 m por píxel): tolerancias de 5–8 %.
const FIG_XPC_PALA = { autor: "Arzapalo Gonzales", anio: 2022, clave: "hdl:20.500.14076/24547", donde: "pág. 64, fig. 4.17 (P&H 4100XPC, grilla de 2 m; medido)" };
export const MEDIDAS_PALA = {
  equipo: "Pala eléctrica de cables clase P&H 4100",
  medidas: [
    {id: "cucharon",dato: "Capacidad del cucharón",valor: 56,unidad: "m³",tol: 0.02,fuente: {autor: "Bonilla Vargas",anio: 2024,clave: "hdl:20.500.14076/28169",donde: "tabla 4 (Antamina)"},nota: "interior al ras de la boca; Cerro Verde usa 44 yd³ (Lucano Chuan 2014, hdl:20.500.14076/6645, pág. 26)"},
    {id: "pluma",dato: "Largo de la pluma (pie a polea)",valor: 20,unidad: "m",tol: 0.05,fuente: null,nota: "estimado; la fig. 4.17 da ≈ 19,3–20 m"},
    {id: "anguloPluma",dato: "Ángulo de la pluma",valor: 45,unidad: "°",tol: 0.05,fuente: null,nota: "estimado; la fig. 4.17 da ≈ 43–45°"},
    {id: "alturaPolea",dato: "Altura del eje de la polea de punta",valor: 20.2,unidad: "m",tol: 0.05,fuente: FIG_XPC_PALA},
    {id: "radioPolea",dato: "Radio del eje de la polea de punta (desde el eje de giro)",valor: 18.5,unidad: "m",tol: 0.05,fuente: FIG_XPC_PALA},
    {id: "alturaPortico",dato: "Altura de la cabeza del pórtico en A",valor: 13.9,unidad: "m",tol: 0.06,fuente: FIG_XPC_PALA},
    {id: "techoCasa",dato: "Altura del techo de la casa",valor: 11.3,unidad: "m",tol: 0.05,fuente: FIG_XPC_PALA},
    {id: "radioCola",dato: "Radio de cola (contrapeso, en el eje)",valor: 9.6,unidad: "m",tol: 0.05,fuente: FIG_XPC_PALA},
    {id: "largoOrugas",dato: "Largo de las orugas",valor: 11.4,unidad: "m",tol: 0.05,fuente: FIG_XPC_PALA},
    {id: "altoOrugas",dato: "Alto de las orugas",valor: 2.9,unidad: "m",tol: 0.08,fuente: FIG_XPC_PALA},
    {id: "alturaCorte",dato: "Altura máxima de corte (dientes)",valor: 16.9,unidad: "m",tol: 0.06,fuente: FIG_XPC_PALA},
    {id: "radioCorte",dato: "Radio máximo de corte (dientes)",valor: 23.8,unidad: "m",tol: 0.05,fuente: FIG_XPC_PALA},
    {id: "anchoOrugas",dato: "Ancho total sobre las orugas",valor: 11.0,unidad: "m",tol: 0.05,fuente: null,nota: "estimado (catálogo P&H 4100XPC no verificado en el catálogo de fuentes; la figura es de perfil)"},
    {id: "zapata",dato: "Ancho de la zapata",valor: 2.2,unidad: "m",tol: 0.05,fuente: null,nota: "estimado (≈ 380 kPa con ≈ 1 450 t sobre 2 × 8,5 m de contacto)"},
    {id: "carrera",dato: "Carrera de empuje del mango",valor: 4.9,unidad: "m",tol: 0.05,fuente: null,nota: "estimado; la manija de la CAT 7495 (misma clase) mide 10,9 m (Tenorio Enciso 2022, hdl:20.500.14076/22793, pág. 33)"},
  ],
};
