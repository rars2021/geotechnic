// Agente equipo-scoop · medidas con fuente del scoop (LHD) clase CAT R1600G de 6 yd³.
// Regla: cada número lleva su clave el catálogo de fuentes y su página, o dice «estimado». El juez compara cada medida con `medir`
// contra el modelo (juez/fidelidad.mjs) y bloquea si una medida CON fuente sale de su tolerancia.
const OSORIO = "hdl:20.500.14076/22426", REYNOSO = "hdl:20.500.14076/27172";

export const MEDIDAS_SCOOP = {
  equipo: "Scoop (LHD) clase CAT R1600G, cucharón de 6 yd³",
  medidas: [
    { id: "capacidad", dato: "Capacidad del cucharón (al ras)", valor: 4.6, unidad: "m³", tol: 0.1, fuente: { autor: "Reynoso Paucar", anio: 2023, clave: REYNOSO, donde: "Condestable, pág. 68 (6 yd³)" } },
    { id: "alturaMax", dato: "Altura máxima con cucharón arriba (C)", valor: 4.497, unidad: "m", tol: 0.05, fuente: { autor: "Osorio Bazán", anio: 2021, clave: OSORIO, donde: "fig. 2.3, cota del R1600H (CAT Performance Handbook)" } },
    { id: "descarga", dato: "Altura de descarga (B)", valor: 2.207, unidad: "m", tol: 0.05, fuente: { autor: "Osorio Bazán", anio: 2021, clave: OSORIO, donde: "fig. 2.3" } },
    { id: "alcance", dato: "Alcance en descarga (A)", valor: 1.408, unidad: "m", tol: 0.08, fuente: { autor: "Osorio Bazán", anio: 2021, clave: OSORIO, donde: "fig. 2.3 (desde el frente de las llantas)" } },
    { id: "rueda", dato: "Diámetro de rueda", valor: 1.75, unidad: "m", tol: 0.02, fuente: { autor: "Osorio Bazán", anio: 2021, clave: OSORIO, donde: "medido sobre el plano de la fig. 2.3 con la escala de las cotas A, B y C" } },
    { id: "ejes", dato: "Distancia entre ejes", valor: 3.25, unidad: "m", tol: 0.02, fuente: { autor: "Osorio Bazán", anio: 2021, clave: OSORIO, donde: "medido sobre el plano de la fig. 2.3 (±5 %)" } },
    { id: "voladizo", dato: "Voladizo trasero (eje trasero a la cola)", valor: 3.1, unidad: "m", tol: 0.05, fuente: { autor: "Osorio Bazán", anio: 2021, clave: OSORIO, donde: "medido sobre el plano de la fig. 2.3 (±5 %)" } },
    { id: "capota", dato: "Altura de la capota", valor: 2.31, unidad: "m", tol: 0.03, fuente: { autor: "Osorio Bazán", anio: 2021, clave: OSORIO, donde: "medido sobre el plano de la fig. 2.3 (±5 %)" } },
    { id: "pivoteAlto", dato: "Altura del pivote de los brazos", valor: 1.89, unidad: "m", tol: 0.03, fuente: { autor: "Osorio Bazán", anio: 2021, clave: OSORIO, donde: "medido sobre el plano de la fig. 2.3" } },
    { id: "brazo", dato: "Largo del brazo (pivote a pasador del cucharón)", valor: 3.0, unidad: "m", tol: 0.03, fuente: { autor: "Osorio Bazán", anio: 2021, clave: OSORIO, donde: "medido sobre el plano de la fig. 2.3" } },
    { id: "ancho", dato: "Ancho sobre llantas", valor: 2.7, unidad: "m", tol: 0.03, fuente: null, nota: "estimado: el plano es de perfil; verificar con catálogo" },
    { id: "anchoCucharon", dato: "Ancho del cucharón", valor: 2.84, unidad: "m", tol: 0.03, fuente: null, nota: "estimado (un poco más ancho que las llantas, como en las fotos de LHD)" },
    { id: "articulacion", dato: "Giro de la articulación a cada lado", valor: 42.5, unidad: "°", tol: 0.02, fuente: null, nota: "estimado (valor típico de LHD de bajo perfil)" },
  ],
};
