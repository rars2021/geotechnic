// Agente equipo-jumbo · medidas con fuente del jumbo de dos brazos (clase Boomer E2C).
// Las que no tienen fuente en el catálogo de fuentes dicen «estimado»: el juez las informa pero no bloquea con ellas.
const REYNOSO = "hdl:20.500.14076/27172", ZANABRIA = "hdl:20.500.12394/10815";

export const MEDIDAS_JUMBO = {
  equipo: "Jumbo frontal de dos brazos (clase Boomer E2C)",
  medidas: [
    { id: "barra", dato: "Largo de la barra", valor: 4.27, unidad: "m", tol: 0.01, fuente: { autor: "Reynoso Paucar", anio: 2023, clave: REYNOSO, donde: "jumbos Atlas Copco de 14 y 16 pies, pág. 58" } },
    { id: "broca", dato: "Diámetro de la broca", valor: 0.051, unidad: "m", tol: 0.02, fuente: { autor: "Zanabria Mejía", anio: 2021, clave: ZANABRIA, donde: "fig. 5, datos técnicos" } },
    { id: "carrera", dato: "Carrera útil de la perforadora (largo de perforación)", valor: 3.9, unidad: "m", tol: 0.02, fuente: { autor: "Zanabria Mejía", anio: 2021, clave: ZANABRIA, donde: "fig. 5 (longitud de perforación 3,90 m)" } },
    { id: "viga", dato: "Largo de la viga de avance", valor: 5.32, unidad: "m", tol: 0.03, fuente: null, nota: "estimado: barra 4,27 m + perforadora ≈ 1,0 m + centralizador (antes 5,2 m sobre fotos del Boomer E2C)" },
    { id: "ancho", dato: "Ancho del carrier", valor: 2.3, unidad: "m", tol: 0.03, fuente: null, nota: "estimado sobre fotos abiertas del Boomer E2C" },
    { id: "rueda", dato: "Diámetro de rueda", valor: 1.25, unidad: "m", tol: 0.03, fuente: null, nota: "estimado (llanta 12.00-24 típica de jumbos medianos)" },
    { id: "ejes", dato: "Distancia entre ejes", valor: 3.5, unidad: "m", tol: 0.03, fuente: null, nota: "estimado sobre fotos" },
    { id: "brazo", dato: "Largo del brazo (articulación a muñeca, retraído)", valor: 3.4, unidad: "m", tol: 0.03, fuente: null, nota: "estimado" },
    { id: "extension", dato: "Extensión del brazo telescópico", valor: 1.25, unidad: "m", tol: 0.03, fuente: null, nota: "estimado (brazos BUT de 1,25 m de extensión)" },
    { id: "techo", dato: "Altura del techo protector", valor: 2.5, unidad: "m", tol: 0.03, fuente: null, nota: "estimado" },
  ],
};
