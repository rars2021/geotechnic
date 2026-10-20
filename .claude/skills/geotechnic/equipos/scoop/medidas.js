// Agente equipo-scoop · medidas con fuente del scoop (LHD) CAT R1600G con cucharón de 6 yd³.
// Regla: cada número lleva su clave el catálogo de fuentes y su página, o dice «estimado». El juez compara cada medida con `medir`
// contra el modelo (juez/fidelidad.mjs) y bloquea si una medida CON fuente sale de su tolerancia.
// Hoja del fabricante: CAT «R1600G Underground Mining Loader», AEHQ6374-01 (11-2011), pág. 12 (especificaciones) y
// pág. 13 (tabla de dimensiones, columna del cucharón de descarga 4,8 m³ / 6,3 yd³, el mismo de las cotas A y B de
// Osorio). Copia del concesionario (no está en el catálogo de fuentes: fuente web con URL). La corrobora Astete Cóndor (2024), tabla 9.
const OSORIO = "hdl:20.500.14076/22426", REYNOSO = "hdl:20.500.14076/27172", ASTETE = "hdl:20.500.14076/27929";
const CAT = "https://mine-equip.com/wp-content/uploads/2025/06/R1600G-English.pdf"; // AEHQ6374-01 (web)
const cat = (donde) => ({ autor: "Caterpillar (web)", anio: 2011, clave: CAT, donde: `AEHQ6374-01, ${donde}` });

export const MEDIDAS_SCOOP = {
  equipo: "Scoop (LHD) CAT R1600G, cucharón de 6 yd³",
  medidas: [
    { id: "capacidad", dato: "Capacidad colmada del cucharón (SAE J742, 6 yd³)", valor: 4.59, unidad: "m³", tol: 0.1, fuente: { autor: "Reynoso Paucar", anio: 2023, clave: REYNOSO, donde: "Condestable, pág. 68 (6 yd³ = 4,59 m³; la hoja CAT da 4,8 m³ para el cucharón de 6,3 yd³)" } },
    { id: "alturaMax", dato: "Altura máxima con cucharón arriba (C)", valor: 4.497, unidad: "m", tol: 0.05, fuente: { autor: "Osorio Bazán", anio: 2021, clave: OSORIO, donde: "fig. 2.3 (= CAT AEHQ6374-01 pág. 13, «Height – Max Dump»)" } },
    { id: "descarga", dato: "Altura de descarga (B)", valor: 2.207, unidad: "m", tol: 0.05, fuente: { autor: "Osorio Bazán", anio: 2021, clave: OSORIO, donde: "fig. 2.3 (= CAT pág. 13, «Dump Clearance at Max Lift»)" } },
    { id: "alcance", dato: "Alcance en descarga (A)", valor: 1.408, unidad: "m", tol: 0.08, fuente: { autor: "Osorio Bazán", anio: 2021, clave: OSORIO, donde: "fig. 2.3, desde el frente de las llantas (= CAT pág. 13, «Reach»)" } },
    { id: "rueda", dato: "Diámetro de rueda", valor: 1.63, unidad: "m", tol: 0.02, fuente: cat("pág. 13, medido sobre el dibujo con la escala de su tabla (llanta 18.00 × 25, pág. 12; antes 1,75 m medido en el plano de Osorio)") },
    { id: "ejes", dato: "Distancia entre ejes", valor: 3.536, unidad: "m", tol: 0.02, fuente: cat("pág. 13, «Wheelbase» (antes 3,25 m medido en el plano de Osorio)") },
    { id: "ejeArticulacion", dato: "Eje delantero a la articulación", valor: 1.768, unidad: "m", tol: 0.02, fuente: cat("pág. 13, «Front Axle to Hitch»") },
    { id: "voladizo", dato: "Voladizo trasero (eje trasero al parachoques)", valor: 3.055, unidad: "m", tol: 0.03, fuente: cat("pág. 13, «Rear Axle to Bumper» (antes 3,1 m medido en el plano)") },
    { id: "capota", dato: "Altura de la capota (ROPS)", valor: 2.4, unidad: "m", tol: 0.03, fuente: { autor: "Astete Cóndor", anio: 2024, clave: ASTETE, donde: "tabla 9, pág. 59 del PDF: altura 2,40 m (= CAT pág. 13, «Top of ROPS»; antes 2,31 m medido en el plano)" } },
    { id: "capo", dato: "Altura del capó del motor", valor: 1.895, unidad: "m", tol: 0.03, fuente: cat("pág. 13, «Top of Hood»") },
    { id: "despeje", dato: "Despeje sobre el piso", valor: 0.344, unidad: "m", tol: 0.1, fuente: cat("pág. 13, «Ground Clearance»") },
    { id: "alturaLevantado", dato: "Altura con el cucharón recogido arriba", valor: 5.204, unidad: "m", tol: 0.03, fuente: cat("pág. 13, «Height – Bucket Raised»") },
    { id: "alturaPasador", dato: "Altura del pasador del cucharón con el brazo arriba", valor: 3.752, unidad: "m", tol: 0.03, fuente: cat("pág. 13, «Height – Max Lift Bucket Pin»") },
    { id: "largo", dato: "Largo total con el cucharón en el piso", valor: 10.107, unidad: "m", tol: 0.03, fuente: cat("pág. 13, «Length – Overall (Digging)» (Astete Cóndor 2024, tabla 9: 10,10 m)") },
    { id: "descargaAngulo", dato: "Ángulo de descarga con el brazo arriba", valor: 45, unidad: "°", tol: 0.02, fuente: cat("pág. 13, ángulo del dibujo en la posición de descarga a altura máxima (antes −48°, estimado)") },
    { id: "pivoteAlto", dato: "Altura del pivote de los brazos", valor: 1.72, unidad: "m", tol: 0.03, fuente: cat("pág. 13, medido sobre el dibujo: pivote 0,97 m detrás del eje delantero; su altura cierra el círculo de los pasadores de las cotas 3 y 9 (antes 1,89 m del plano de Osorio)") },
    { id: "brazo", dato: "Largo del brazo (pivote a pasador del cucharón)", valor: 2.91, unidad: "m", tol: 0.03, fuente: cat("pág. 13, medido sobre el dibujo (radio del círculo de los pasadores; antes 3,0 m del plano de Osorio)") },
    { id: "ancho", dato: "Ancho sobre llantas", valor: 2.4, unidad: "m", tol: 0.02, fuente: { autor: "Astete Cóndor", anio: 2024, clave: ASTETE, donde: "tabla 9, pág. 59 del PDF: ancho 2,40 m (= CAT pág. 13, «Width – Overall Tire»; antes 2,7 m estimado)" } },
    { id: "anchoSinCucharon", dato: "Ancho de la máquina sin cucharón", valor: 2.564, unidad: "m", tol: 0.02, fuente: cat("pág. 13, «Width – Machine without Bucket»") },
    { id: "anchoCucharon", dato: "Ancho del cucharón sobre la cuchilla", valor: 2.6, unidad: "m", tol: 0.02, fuente: cat("pág. 13, «Bucket Width over Cutting Edge» (antes 2,84 m estimado)") },
    { id: "anchoConCucharon", dato: "Ancho de la máquina con cucharón (cortadores)", valor: 2.723, unidad: "m", tol: 0.02, fuente: cat("pág. 13, «Width – Machine with Bucket»") },
    { id: "articulacion", dato: "Giro de la articulación a cada lado", valor: 42.5, unidad: "°", tol: 0.02, fuente: cat("pág. 12, «Articulation Angle» (antes estimado)") },
  ],
};
