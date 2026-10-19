// Ficha del ejemplo frente-jumbo: textos, piezas, números con fuente y referencias. La escena está en escena.js.
import { abierta, estudio, cita, filasMedidas, seccionComoSeHizo } from "../comun.mjs";
import { MEDIDAS_JUMBO } from "../../equipos/jumbo/medidas.js";

const ZANABRIA = "hdl:20.500.12394/10815", REYNOSO = "hdl:20.500.14076/27172", EULOGIO = "hdl:20.500.14076/27684";

export default {
  titulo: "Perforación de un frente",
  ceja: "Geotechnic · procesos · escala frente",
  resumen: "Un jumbo de dos brazos perfora la malla de un frente de 4,0 × 4,0 m: 33 taladros cargados y 8 vacíos de 3,90 m, tomados de una malla real. Cada brazo llega a su taladro por cinemática inversa (giro, alzada, telescópico, muñeca y rotación de viga); los dos trabajan a la vez y uno espera cuando se acercarían demasiado. Un juez automático recorrió las 41 perforaciones antes de publicar: sin choques entre brazos ni con la roca.",
  alt: "Modelo 3D de un jumbo de dos brazos perforando un frente de galería con la malla pintada en rojo y azul.",
  equipos: ["jumbo"],
  modos: ["completo", "blanco"],
  barra: `<button type="button" id="perforar" aria-pressed="false">Perforar</button><button type="button" id="secuencia" aria-pressed="false">Secuencia de salida</button>`,
  pista: "Arrastra para girar · rueda para acercar · toca un número",
  controles: [
    { id: "progreso", etiqueta: "Avance de la perforación", min: 0, max: 100, paso: 1, valor: 0, salida: "0 %" },
    { id: "vel", etiqueta: "Velocidad de la animación", min: 1, max: 6, paso: 1, valor: 1, salida: "×1" },
    { html: `<label class="geo-control" for="xray"><span>Ver taladros en el macizo</span><input type="checkbox" id="xray" style="justify-self:start"><output></output></label>` },
    { html: `<label class="geo-control" for="corte"><span>Corte lateral</span><input type="checkbox" id="corte" checked style="justify-self:start"><output></output></label>` },
    { html: `<label class="geo-control" for="lamina"><span>Lámina (aristas en tinta)</span><input type="checkbox" id="lamina" checked style="justify-self:start"><output></output></label>` },
  ],
  piezas: [
    { id: "alivios", numero: 1, nombre: "Alivios", definicion: "4 taladros vacíos de 102 mm en el centro: son la cara libre hacia donde rompe el arranque." },
    { id: "arranque", numero: 2, nombre: "Arranque", definicion: "3 taladros cargados pegados a los alivios; salen primero (retardos 1 a 3) y abren el hueco." },
    { id: "ayudas", numero: 3, nombre: "Ayudas", definicion: "4 anillos de taladros (retardos 4 a 9) que agrandan el hueco hacia afuera, cuadro por cuadro." },
    { id: "cuadradores", numero: 4, nombre: "Cuadradores", definicion: "4 taladros en los hastiales (retardo 10): dan el ancho de 4,0 m." },
    { id: "corona", numero: 5, nombre: "Corona", definicion: "5 cargados y 4 vacíos alternados en la bóveda (retardo 12): voladura controlada para no sobreexcavar el techo." },
    { id: "arrastres", numero: 6, nombre: "Arrastres", definicion: "5 taladros al piso, los últimos en salir (retardo 13). La viga los perfora girada 180°, bajo la muñeca." },
    { id: "brazo", numero: 7, nombre: "Brazo", definicion: "Gira en su rótula, sube con su cilindro y se extiende 1,25 m: lleva la muñeca frente a cada taladro." },
    { id: "viga", numero: 8, nombre: "Viga de avance", definicion: "Riel de aluminio de 5,3 m: avanza por su cuna hasta apoyar el centralizador en la roca." },
    { id: "perforadora", numero: 9, nombre: "Perforadora", definicion: "Martillo hidráulico que golpea y gira la barra; corre 3,9 m sobre la viga." },
    { id: "barra", numero: 10, nombre: "Barra y broca", definicion: "Barra de 14 pies (4,27 m) y broca de 51 mm: perfora 3,90 m de taladro." },
    { id: "techo", numero: 11, nombre: "Puesto del operador", definicion: "Bajo el techo protector, detrás de los brazos, a unos 9 m del frente sin sostener." },
    { id: "gatas", numero: 12, nombre: "Gatas", definicion: "Cuatro cilindros que bajan sus pies hasta el piso: el jumbo no se mueve mientras perfora." },
    { id: "pintura", numero: 13, nombre: "Malla pintada", definicion: "El topógrafo pinta cada taladro (rojo cargado, azul vacío) y la línea de gradiente a 1 m del piso." },
  ],
  fuentes: [
    { dato: "Malla (posiciones, grupos, retardos)", valor: "33 cargados + 8 vacíos", fuente: cita("Zanabria Mejía", 2021, ZANABRIA, "fig. 5, pág. 26 (Alpayana-Casapalca, roca buena RMR > 65)") + "; posiciones leídas de la figura con ±0,1 m" },
    { dato: "Arrastres", valor: "a 0,20 m del piso", fuente: "La figura los da a 0,10–0,12 m (±0,1 m de lectura); 0,20 m es lo mínimo con la perforadora bajo la viga (lo midió el juez)" },
    { dato: "Sección", valor: "4,0 × 4,0 m", fuente: cita("Zanabria Mejía", 2021, ZANABRIA, "fig. 5") },
    { dato: "Longitud de perforación · avance", valor: "3,90 m · 3,70 m (95 %)", fuente: cita("Zanabria Mejía", 2021, ZANABRIA, "fig. 5, datos técnicos") },
    { dato: "Diámetro de producción · alivio", valor: "51 mm · 102 mm", fuente: cita("Zanabria Mejía", 2021, ZANABRIA, "fig. 5") },
    ...filasMedidas(MEDIDAS_JUMBO),
    { dato: "Familias del macizo", valor: "71/242 · 40/43 · 65/157", fuente: cita("Eulogio Huamán", 2024, EULOGIO, "Retamas (MARSA); usadas como ejemplo") },
    { dato: "Pintura de la malla", valor: "rojo cargado · azul vacío", fuente: "Convención de la figura original y de las fotos de pintado de malla (Núñez Soras 2023, Mera Villalobos 2023)" },
    { dato: "Tiempos de la animación", valor: "secuencia", fuente: "El orden es el de la malla y el de los turnos anticolisión; las duraciones no son medidas" },
  ],
  extra: seccionComoSeHizo("jumbo"),
  referencias: {
    abiertas: [
      // la foto muestra el jumbo entero de costado (en un túnel ancho): en la galería de 4 m no cabe, se compara al aire libre
      abierta("jumbo", "rocket_boomer_e2c_1.jpg", { titulo: "Boomer E2C (dos brazos)", recorte: [0, 0, 1, 1], vista: { galeria: false, progreso: 0.3, objetivo: [-8, 1.6, 0], az: 8, el: 2, dist: 18, recorte: [0.14, 0.36, 0.87, 0.62] } }),
      // brazos y vigas desde abajo, llenando el cuadro (en la galería, bajo los brazos)
      abierta("jumbo", "rocket_boomer_e2c_2.jpg", { titulo: "Boomer E2C, brazos y vigas", recorte: [0, 0, 1, 1], vista: { progreso: 0.2, objetivo: [-3.8, 2.4, 0.6], az: 330, el: -28, dist: 2.1, recorte: [0, 0, 1, 1] } }),
      abierta("jumbo", "bohrwagen_sprengvortrieb.jpg", { titulo: "Jumbo al aire libre, brazos en alto", recorte: [0.3, 0, 1, 0.7], vista: { galeria: false, progreso: 0.12, objetivo: [-8, 2.0, 0], az: 58, el: 6, dist: 9.5, recorte: [0, 0.2, 0.8, 0.8] } }),
      abierta("jumbo", "natm.jpg", { titulo: "Frente de túnel con jumbo", vista: { objetivo: [-2, 1.9, 0], az: 270, el: 3, dist: 20, progreso: 0.7 } }),
      // la máquina de costado, grande en el recorte, como en la foto del portal
      abierta("jumbo", "mine_site_3.jpg", { titulo: "Jumbo en el portal de una mina", recorte: [0, 0.5, 1, 0.95], vista: { galeria: false, progreso: 0.5, objetivo: [-8, 1.6, 0], az: 170, el: 2, dist: 16, recorte: [0.09, 0.4, 0.9, 0.62] } }),
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
