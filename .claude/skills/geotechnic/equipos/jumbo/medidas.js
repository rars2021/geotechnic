// Agente equipo-jumbo · medidas con fuente del jumbo de dos brazos (clase Boomer E2C).
// Las que no tienen fuente citable dicen «estimado»: el juez las informa pero no bloquea con ellas.
// Revisión 2026-10-19: el catálogo de fuentes no tiene la ficha técnica del Boomer E2C (el PDF de Epiroc no se pudo bajar). Lo único
// dimensional es la lista genérica de Huapaya Hurtado (2024, pág. 26 del PDF) para jumbos frontales: largo 9–12 m,
// alto con caseta 2,6–3 m, ancho 1,8–2 m, radio de giro 4,4–5,5 m. Un aviso de equipo usado (no es ficha, no está en
// el catálogo de fuentes) da para el Boomer E2C 32 t, brazo de 6,5 m y barras de 4,9 m: solo sirve para ver el orden de magnitud.
const REYNOSO = "hdl:20.500.14076/27172", ZANABRIA = "hdl:20.500.12394/10815", HUAPAYA = "hdl:20.500.14076/27903";

export const MEDIDAS_JUMBO = {
  equipo: "Jumbo frontal de dos brazos (clase Boomer E2C)",
  medidas: [
    { id: "barra", dato: "Largo de la barra", valor: 4.27, unidad: "m", tol: 0.01, fuente: { autor: "Reynoso Paucar", anio: 2023, clave: REYNOSO, donde: "jumbos Atlas Copco de 14 y 16 pies, pág. 58" } },
    { id: "broca", dato: "Diámetro de la broca", valor: 0.051, unidad: "m", tol: 0.02, fuente: { autor: "Zanabria Mejía", anio: 2021, clave: ZANABRIA, donde: "fig. 5, datos técnicos" } },
    { id: "carrera", dato: "Carrera útil de la perforadora (largo de perforación)", valor: 3.9, unidad: "m", tol: 0.02, fuente: { autor: "Zanabria Mejía", anio: 2021, clave: ZANABRIA, donde: "fig. 5 (longitud de perforación 3,90 m)" } },
    { id: "techo", dato: "Altura del techo protector", valor: 2.6, unidad: "m", tol: 0.03, fuente: { autor: "Huapaya Hurtado", anio: 2024, clave: HUAPAYA, donde: "pág. 26: «altura con caseta levantada 2,6 a 3 m» (jumbos frontales; se toma el borde bajo del rango)" } },
    { id: "viga", dato: "Largo de la viga de avance", valor: 5.55, unidad: "m", tol: 0.03, fuente: null, nota: "estimado: polea del haz y su carro 0,30 + perforadora 0,85 + barra 4,27 + centralizador 0,12 m (antes 5,32 m, sin la polea)" },
    { id: "ancho", dato: "Ancho del carrier", valor: 2.3, unidad: "m", tol: 0.03, fuente: null, nota: "estimado sobre fotos abiertas del Boomer E2C; Huapaya Hurtado 2024 (pág. 26) da 1,8–2 m, pero para jumbos frontales de bajo perfil, no para uno de dos brazos" },
    { id: "rueda", dato: "Diámetro de rueda", valor: 1.25, unidad: "m", tol: 0.03, fuente: null, nota: "estimado (llanta 12.00-24 típica de jumbos medianos); sin dato en el catálogo de fuentes" },
    { id: "ejes", dato: "Distancia entre ejes", valor: 3.5, unidad: "m", tol: 0.03, fuente: null, nota: "estimado sobre fotos; sin dato en el catálogo de fuentes (el largo de 9–12 m de Huapaya Hurtado 2024 es de jumbos de un brazo)" },
    { id: "brazo", dato: "Largo del brazo (articulación a muñeca, retraído)", valor: 3.4, unidad: "m", tol: 0.03, fuente: null, nota: "estimado; un aviso de equipo usado (no ficha) da 6,5 m de brazo para el Boomer E2C, que sería el alcance total con la extensión y la muñeca" },
    { id: "extension", dato: "Extensión del brazo telescópico", valor: 1.25, unidad: "m", tol: 0.03, fuente: null, nota: "estimado (brazos BUT de 1,25 m de extensión); sin dato en el catálogo de fuentes" },
  ],
};
