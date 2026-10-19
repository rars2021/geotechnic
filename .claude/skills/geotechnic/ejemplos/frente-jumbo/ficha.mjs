// Ficha del ejemplo frente-jumbo: textos, piezas, números con fuente y referencias. La escena está en escena.js.
import { abierta, estudio, cita } from "../comun.mjs";

const ZANABRIA = "hdl:20.500.12394/10815", REYNOSO = "hdl:20.500.14076/27172", EULOGIO = "hdl:20.500.14076/27684";

export default {
  titulo: "Perforación de un frente",
  ceja: "Geotechnic · procesos · escala frente",
  resumen: "Un jumbo de dos brazos perfora la malla de un frente de 4,0 × 4,0 m: 33 taladros cargados y 8 vacíos de 3,90 m, tomados de una malla real. Mira cómo cada brazo trabaja su mitad, mira los taladros dentro del macizo y luego la secuencia en que saldrían en la voladura.",
  alt: "Modelo 3D de un jumbo de dos brazos perforando un frente de galería con la malla pintada en rojo y azul.",
  modos: ["completo", "blanco"],
  barra: `<button type="button" id="perforar" aria-pressed="false">Perforar</button><button type="button" id="secuencia" aria-pressed="false">Secuencia de salida</button>`,
  pista: "Arrastra para girar · rueda para acercar · toca un número",
  controles: [
    { id: "progreso", etiqueta: "Avance de la perforación", min: 0, max: 100, paso: 1, valor: 0, salida: "0 %" },
    { id: "vel", etiqueta: "Velocidad de la animación", min: 1, max: 6, paso: 1, valor: 1, salida: "×1" },
    { html: `<label class="geo-control" for="xray"><span>Ver taladros en el macizo</span><input type="checkbox" id="xray" style="justify-self:start"><output></output></label>` },
  ],
  piezas: [
    { id: "alivios", numero: 1, nombre: "Alivios", definicion: "4 taladros vacíos de 102 mm en el centro: son la cara libre hacia donde rompe el arranque." },
    { id: "arranque", numero: 2, nombre: "Arranque", definicion: "3 taladros cargados pegados a los alivios; salen primero (retardos 1 a 3) y abren el hueco." },
    { id: "ayudas", numero: 3, nombre: "Ayudas", definicion: "4 anillos de 4 taladros (retardos 4 a 9) que agrandan el hueco hacia afuera, cuadro por cuadro." },
    { id: "cuadradores", numero: 4, nombre: "Cuadradores", definicion: "4 taladros en los hastiales (retardo 10): dan el ancho de 4,0 m." },
    { id: "corona", numero: 5, nombre: "Corona", definicion: "5 cargados y 4 vacíos alternados en la bóveda (retardo 12): voladura controlada para no sobreexcavar el techo." },
    { id: "arrastres", numero: 6, nombre: "Arrastres", definicion: "5 taladros al piso, los últimos en salir (retardo 13): levantan el material y nivelan el piso." },
    { id: "brazo", numero: 7, nombre: "Brazo", definicion: "Posiciona la viga frente a cada taladro; los dos brazos trabajan a la vez, uno por mitad." },
    { id: "viga", numero: 8, nombre: "Viga de avance", definicion: "Riel de 5,2 m apoyado en la roca: por él avanza la perforadora mientras perfora." },
    { id: "perforadora", numero: 9, nombre: "Perforadora", definicion: "Martillo hidráulico que golpea y gira la barra; el agua de barrido saca el detrito." },
    { id: "barra", numero: 10, nombre: "Barra y broca", definicion: "Barra de 14 pies (4,27 m) y broca de 51 mm: perfora 3,90 m de taladro." },
    { id: "cabina", numero: 11, nombre: "Puesto del operador", definicion: "Bajo el techo protector, a unos 7 m del frente sin sostener." },
    { id: "gatas", numero: 12, nombre: "Gatas", definicion: "Apoyos hidráulicos que fijan el jumbo para que no se mueva al perforar." },
    { id: "pintura", numero: 13, nombre: "Malla pintada", definicion: "El topógrafo pinta cada taladro (rojo cargado, azul vacío) y la línea de gradiente a 1 m del piso." },
  ],
  fuentes: [
    { dato: "Malla (posiciones, grupos, retardos)", valor: "33 cargados + 8 vacíos", fuente: cita("Zanabria Mejía", 2021, ZANABRIA, "fig. 5, pág. 26 (Alpayana-Casapalca, roca buena RMR > 65)") + "; posiciones leídas de la figura con ±0,1 m" },
    { dato: "Sección", valor: "4,0 × 4,0 m", fuente: cita("Zanabria Mejía", 2021, ZANABRIA, "fig. 5") },
    { dato: "Longitud de perforación · avance", valor: "3,90 m · 3,70 m (95 %)", fuente: cita("Zanabria Mejía", 2021, ZANABRIA, "fig. 5, datos técnicos") },
    { dato: "Diámetro de producción · alivio", valor: "51 mm · 102 mm", fuente: cita("Zanabria Mejía", 2021, ZANABRIA, "fig. 5") },
    { dato: "Barra", valor: "14 pies (4,27 m)", fuente: cita("Reynoso Paucar", 2023, REYNOSO, "jumbos Atlas Copco de 14 y 16 pies, pág. 58") },
    { dato: "Familias del macizo", valor: "71/242 · 40/43 · 65/157", fuente: cita("Eulogio Huamán", 2024, EULOGIO, "Retamas (MARSA); usadas como ejemplo") },
    { dato: "Pintura de la malla", valor: "rojo cargado · azul vacío", fuente: "Convención de la figura original y de las fotos de pintado de malla (Núñez Soras 2023, Mera Villalobos 2023)" },
    { dato: "Dimensiones del jumbo", valor: "viga 5,2 m · ancho 2,3 m", fuente: "Estimado sobre fotos abiertas del Boomer E2C; verificar con catálogo" },
    { dato: "Tiempos de la animación", valor: "secuencia", fuente: "El orden es el de la malla; las duraciones no son medidas" },
  ],
  referencias: {
    abiertas: [
      abierta("jumbo", "rocket_boomer_e2c_1.jpg", { titulo: "Boomer E2C (dos brazos)", vista: { objetivo: [-6, 1.6, 0], az: 300, el: 8, dist: 9 } }),
      abierta("jumbo", "rocket_boomer_e2c_2.jpg", { titulo: "Boomer E2C, brazos y vigas", vista: { objetivo: [-3, 1.8, 0], az: 240, el: 6, dist: 6 } }),
      abierta("jumbo", "bohrwagen_sprengvortrieb.jpg", { titulo: "Jumbo perforando un frente", vista: { objetivo: [0, 1.9, 0], az: 262, el: 5, dist: 9, progreso: 0.45 } }),
      abierta("jumbo", "natm.jpg", { titulo: "Frente de túnel con jumbo", vista: { objetivo: [0, 1.9, 0], az: 268, el: 4, dist: 11, progreso: 0.7 } }),
      abierta("jumbo", "mine_site_3.jpg", { titulo: "Jumbo en una labor minera", vista: { objetivo: [-4, 1.6, 0], az: 255, el: 10, dist: 8 } }),
    ],
    estudio: [
      estudio("jumbo", "2021_zanabria_mejia_analisis_del_monitor_p26.jpg"),
      estudio("jumbo", "2025_guevara_carbajal_optimizacion_de_la_p125.jpg"),
      estudio("jumbo", "2023_mera_villalobos_aplicacion_de_o_har_p51.jpg"),
      estudio("jumbo", "2023_mera_villalobos_aplicacion_de_o_har_p47.jpg"),
      estudio("jumbo", "2023_nunez_soras_caracterizacion_geomeca_p113.jpg"),
    ],
  },
};
