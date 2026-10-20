// Ficha del ejemplo scoop: textos, piezas, números con fuente y referencias. La escena está en escena.js y lo que se
// anima (y juzga) en montaje.js. Las medidas del equipo salen de equipos/scoop/medidas.js (agente equipo-scoop).
import { abierta, estudio, cita } from "../comun.mjs";
import { MEDIDAS_SCOOP } from "../../equipos/scoop/medidas.js";
import { filasMedidas, seccionComoSeHizo } from "../comun.mjs";

const REYNOSO = "hdl:20.500.14076/27172", EULOGIO = "hdl:20.500.14076/27684";
// vistas: la máquina al aire libre con el cucharón apoyado (como en las fotos), encuadrada de cerca
const lado = (x = 0) => ({ galeria: false, anim: false, x, objetivo: [x - 0.2, 1.15, 0], estado: { brazo: -28.9, cucharon: 28.9 } });

export default {
  titulo: "Scoop en la galería",
  ceja: "Geotechnic · equipos · escala labor",
  resumen: "Un scoop de 6 yd³ (clase CAT R1600G) limpiando el mineral disparado en una galería de 4,0 × 4,0 m. Cada pieza es un sólido con su pasador: la barra en Z inclina el cucharón, los cilindros van de pasador a pasador y las mangueras de racor a racor. Un juez automático probó todo el ciclo antes de publicar: sin piezas que se atraviesen ni equipo dentro de la roca.",
  alt: "Modelo 3D de un scoop en tonos papel, con contornos finos, en una galería subterránea iluminada por sus faros, con pernos, shotcrete y manga de ventilación.",
  equipos: ["scoop"],
  modos: ["completo", "blanco"],
  barra: `<button type="button" id="ciclo" aria-pressed="false">Animar ciclo</button>`,
  pista: "Arrastra para girar · rueda para acercar · toca un número",
  controles: [
    { id: "levante", etiqueta: "Brazo (levante)", min: 0, max: 1, paso: 0.01, valor: 0.17, salida: "−20°" },
    { id: "volteo", etiqueta: "Cucharón (descarga ↔ recogido)", min: -1, max: 1, paso: 0.01, valor: 0.9, salida: "40°" },
    { html: `<label class="geo-control" for="ver-galeria"><span>Ver galería</span><input type="checkbox" id="ver-galeria" checked style="justify-self:start"><output></output></label>` },
    { html: `<label class="geo-control" for="corte"><span>Corte lateral</span><input type="checkbox" id="corte" checked style="justify-self:start"><output></output></label>` },
    { html: `<label class="geo-control" for="lamina"><span>Lámina (aristas en tinta)</span><input type="checkbox" id="lamina" checked style="justify-self:start"><output></output></label>` },
  ],
  piezas: [
    { id: "cucharon", numero: 1, nombre: "Cucharón", definicion: "6 yd³ (4,6 m³ colmado), 2,6 m de ancho. Labio con 6 dientes y protectores; penetra el montón y se recoge para no derramar." },
    { id: "brazo", numero: 2, nombre: "Brazos de levante", definicion: "Dos brazos de 2,91 m que giran en las torres del bastidor delantero, a 1,72 m del piso." },
    { id: "cilindros", numero: 3, nombre: "Barra en Z y cilindros", definicion: "Dos cilindros levantan los brazos; uno central empuja la palanca, que por la biela inclina el cucharón." },
    { id: "articulacion", numero: 4, nombre: "Articulación central", definicion: "Dos pasadores verticales entre los bastidores y dos cilindros de dirección: el scoop gira doblándose ±42,5°." },
    { id: "cabina", numero: 5, nombre: "Cabina del operador", definicion: "Baja y de costado, bajo una capota ROPS de 2,40 m: el operador mira hacia ambos sentidos de marcha." },
    { id: "motor", numero: 6, nombre: "Motor y contrapeso", definicion: "Atrás, sobre el eje trasero: equilibra el cucharón cargado." },
    { id: "llantas", numero: 7, nombre: "Llantas", definicion: "1,63 m de diámetro (18.00×25), con tacos para piso de roca y barro. Ejes a 3,54 m." },
    { id: "faros", numero: 8, nombre: "Faros", definicion: "Única luz del frente de trabajo: todo lo que se ve en la foto real lo ilumina el equipo." },
    { id: "contorno", numero: 9, nombre: "Contorno sobreexcavado", definicion: "Galería de 4,0 × 4,0 m. Los bloques caen siguiendo las tres familias de juntas: el contorno queda facetado." },
    { id: "pernos", numero: 10, nombre: "Pernos con placa", definicion: "Sostenimiento en malla de 1,5 m en tresbolillo: la placa aprieta la roca suelta contra el macizo." },
    { id: "shotcrete", numero: 11, nombre: "Shotcrete", definicion: "Concreto lanzado de ≈ 5 cm: suaviza el contorno y lo vuelve gris claro y uniforme." },
    { id: "manga", numero: 12, nombre: "Manga de ventilación", definicion: "Lleva aire fresco hasta el frente; cuelga de la corona y se aplasta contra su cable." },
    { id: "mineral", numero: 13, nombre: "Mineral disparado", definicion: "El montón que dejó la voladura, apoyado en el frente a su ángulo de reposo." },
    { id: "echadero", numero: 14, nombre: "Echadero con parrilla", definicion: "Chimenea por donde cae el mineral a un nivel inferior; la parrilla retiene los bloques grandes." },
  ],
  fuentes: [
    ...filasMedidas(MEDIDAS_SCOOP),
    { dato: "Modelo en la mina", valor: "CAT R1600G", fuente: cita("Reynoso Paucar", 2023, REYNOSO, "Condestable, pág. 68") },
    { dato: "Sección de la galería", valor: "4,0 × 4,0 m", fuente: cita("Reynoso Paucar", 2023, REYNOSO, "vías principales, pág. 58") },
    { dato: "Familias del macizo", valor: "71/242 · 40/43 · 65/157", fuente: cita("Eulogio Huamán", 2024, EULOGIO, "Retamas (MARSA), pág. 83; usadas como ejemplo") },
    { dato: "Ondulación de juntas (ruido)", valor: "0,07 m · 2,5 m · 3 oct.", fuente: "Parámetro de dibujo del motor B (estimado, comparado con fotos de labores)" },
    { dato: "Geometría de la barra en Z", valor: "palanca 0,72 · biela 0,52 m", fuente: "Pasadores del brazo y del cucharón medidos en el dibujo CAT AEHQ6374-01, pág. 13 (escala de su tabla); largos de palanca y biela estimados por búsqueda numérica que cierra de −96° a +64° con transmisión ≥ 25°" },
    { dato: "Pernos", valor: "malla de 1,5 m", fuente: "Ilustrativo (patrón típico en tresbolillo); ajustar al diseño de sostenimiento real" },
    { dato: "Ciclo de carguío", valor: "secuencia", fuente: "Ángulos reales del modelo; duraciones ilustrativas. El levante de descarga queda en +4° porque a +10° el cucharón pega en la bóveda (lo encontró el juez)" },
  ],
  extra: seccionComoSeHizo("scoop"),
  referencias: {
    abiertas: [
      abierta("scoop", "sandvik_lh517_lhd.jpg", { titulo: "Sandvik LH517 de perfil", recorte: [0.0, 0.3, 1.0, 0.72], vista: { ...lado(0), az: 0, el: 4, dist: 9.5, recorte: [0.0, 0.3, 1.0, 0.72] } }),
      abierta("scoop", "load_haul_dump_cobar_2017_01.jpg", { titulo: "LHD en Cobar, cucharón gastado", recorte: [0.0, 0.375, 0.8, 0.825], vista: { ...lado(0), objetivo: [0.4, 1.0, 0], az: 56, el: 8, dist: 9.0, recorte: [0.0, 0.38, 0.675, 0.744] } }),
      abierta("scoop", "lhd_sandvik_lh410.jpg", { titulo: "Sandvik LH410", recorte: [0.0, 0.35, 1.0, 0.75], vista: { ...lado(0), az: 0, el: 2, dist: 10, recorte: [0.05, 0.3, 0.95, 0.7] } }),
      abierta("scoop", "vkg_ojamaa_kaevandus.jpg", { titulo: "LHD bajo tierra con sus faros", vista: { galeria: true, anim: false, x: -8, objetivo: [-6.8, 1.3, 0], az: 88, el: 8, dist: 8, estado: { brazo: -20, cucharon: 60 }, carga: true } }),
      abierta("scoop", "d_ln_naklada.jpg", { titulo: "Cargador de mina en exhibición", recorte: [0.2, 0.37, 0.69, 0.63], vista: { ...lado(0), objetivo: [0.2, 1.1, 0], az: 50, el: 6, dist: 9.0, recorte: [0.0, 0.35, 0.75, 0.75] } }),
    ],
    estudio: [
      estudio("scoop", "2021_osorio_bazan_analisis_tecnico_econo_p34.jpg"),
      estudio("scoop", "2015_rodriguez_robles_perforacion_y_vola_p97.jpg"),
      estudio("scoop", "2021_vega_merino_analisis_de_las_demoras_p30.jpg"),
      estudio("scoop", "2019_gutierrez_castillo_aplicacion_de_so_p65.jpg"),
    ],
  },
};
