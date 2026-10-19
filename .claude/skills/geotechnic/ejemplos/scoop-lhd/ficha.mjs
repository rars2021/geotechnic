// Ficha del ejemplo scoop: textos, piezas, números con fuente y referencias. La escena está en escena.js.
import { abierta, estudio, cita } from "../comun.mjs";

const OSORIO = "hdl:20.500.14076/22426", REYNOSO = "hdl:20.500.14076/27172", EULOGIO = "hdl:20.500.14076/27684";
const lado = (x = 0) => ({ galeria: false, anim: false, x, objetivo: [x + 0.4, 1.3, 0], estado: { levante: 0.08, volteo: 0.6, carga: false } });

export default {
  titulo: "Scoop en la galería",
  ceja: "Geotechnic · equipos · escala labor",
  resumen: "Un scoop de 6 yd³ (clase CAT R1600G) limpiando el mineral disparado en una galería de 4,0 × 4,0 m. Las proporciones salen del plano del fabricante; la galería, de una tesis de Condestable. Anima el ciclo de carguío o mueve tú los brazos y el cucharón.",
  alt: "Modelo 3D de un scoop amarillo en una galería subterránea iluminada por sus faros, con pernos, shotcrete y manga de ventilación.",
  modos: ["completo", "blanco"],
  barra: `<button type="button" id="ciclo" aria-pressed="false">Animar ciclo</button>`,
  pista: "Arrastra para girar · rueda para acercar · toca un número",
  controles: [
    { id: "levante", etiqueta: "Levante de brazos", min: 0, max: 1, paso: 0.01, valor: 0.08, salida: "8 %" },
    { id: "volteo", etiqueta: "Volteo del cucharón", min: -1, max: 1, paso: 0.01, valor: 0.6, salida: "0.60" },
    { html: `<label class="geo-control" for="ver-galeria"><span>Ver galería</span><input type="checkbox" id="ver-galeria" checked style="justify-self:start"><output></output></label>` },
    { html: `<label class="geo-control" for="corte"><span>Corte lateral</span><input type="checkbox" id="corte" style="justify-self:start"><output></output></label>` },
  ],
  piezas: [
    { id: "cucharon", numero: 1, nombre: "Cucharón", definicion: "6 yd³ (4,6 m³). Labio con dientes de desgaste; penetra el montón y se recoge para no derramar." },
    { id: "brazo", numero: 2, nombre: "Brazos de levante", definicion: "Dos brazos que giran en el bastidor delantero y suben el cucharón para descargar." },
    { id: "cilindros", numero: 3, nombre: "Cilindros de levante y volteo", definicion: "Hidráulicos: dos levantan los brazos; uno central inclina el cucharón (recoger o descargar)." },
    { id: "articulacion", numero: 4, nombre: "Articulación central", definicion: "Bisagra vertical entre los dos bastidores: el scoop gira doblándose, por eso cabe en galerías estrechas." },
    { id: "cabina", numero: 5, nombre: "Cabina del operador", definicion: "Baja y de costado: el operador mira hacia ambos sentidos de marcha bajo una capota de 2,31 m." },
    { id: "motor", numero: 6, nombre: "Motor y contrapeso", definicion: "Atrás, sobre el eje trasero: equilibra el cucharón cargado." },
    { id: "llantas", numero: 7, nombre: "Llantas", definicion: "1,75 m de diámetro, con tacos para piso de roca y barro. Ejes a 3,25 m." },
    { id: "faros", numero: 8, nombre: "Faros", definicion: "Única luz del frente de trabajo: todo lo que se ve en la foto real lo ilumina el equipo." },
    { id: "contorno", numero: 9, nombre: "Contorno sobreexcavado", definicion: "Galería de 4,0 × 4,0 m con bóveda. Los bloques que caen siguiendo las juntas dejan el contorno irregular." },
    { id: "pernos", numero: 10, nombre: "Pernos con placa", definicion: "Sostenimiento en malla de 1,5 m en tresbolillo: la placa aprieta la roca suelta contra el macizo." },
    { id: "shotcrete", numero: 11, nombre: "Shotcrete", definicion: "Concreto lanzado de ≈ 5 cm: suaviza el contorno y lo vuelve gris claro y uniforme." },
    { id: "manga", numero: 12, nombre: "Manga de ventilación", definicion: "Lleva aire fresco hasta el frente; cuelga de la corona y se aplasta contra su cable." },
    { id: "mineral", numero: 13, nombre: "Mineral disparado", definicion: "El montón que dejó la voladura, apoyado en el frente a su ángulo de reposo." },
    { id: "echadero", numero: 14, nombre: "Echadero con parrilla", definicion: "Chimenea por donde cae el mineral a un nivel inferior; la parrilla retiene los bloques grandes." },
  ],
  fuentes: [
    { dato: "Modelo y capacidad", valor: "CAT R1600G · 6 yd³", fuente: cita("Reynoso Paucar", 2023, REYNOSO, "Condestable, pág. 68") },
    { dato: "Altura máxima con cucharón arriba (C)", valor: "4 497 mm", fuente: cita("Osorio Bazán", 2021, OSORIO, "fig. 2.3, cota del R1600H (CAT Performance Handbook)") },
    { dato: "Altura de descarga (B) · alcance (A)", valor: "2 207 mm · 1 408 mm", fuente: cita("Osorio Bazán", 2021, OSORIO, "fig. 2.3") },
    { dato: "Diámetro de rueda", valor: "1,75 m", fuente: "Medido sobre el plano de la fig. 2.3 con la escala de las cotas A, B y C (≈ 8,1 mm/px)" },
    { dato: "Distancia entre ejes · voladizo trasero", valor: "3,25 m · 3,1 m", fuente: "Medido sobre el mismo plano (±5 %)" },
    { dato: "Altura de capota", valor: "2,31 m", fuente: "Medido sobre el mismo plano (±5 %)" },
    { dato: "Ancho de la máquina", valor: "2,7 m", fuente: "Estimado: el plano es de perfil; verificar con catálogo" },
    { dato: "Sección de la galería", valor: "4,0 × 4,0 m", fuente: cita("Reynoso Paucar", 2023, REYNOSO, "vías principales, pág. 58") },
    { dato: "Familias del macizo", valor: "71/242 · 40/43 · 65/157", fuente: cita("Eulogio Huamán", 2024, EULOGIO, "Retamas (MARSA), pág. 83; usadas como ejemplo") },
    { dato: "Pernos", valor: "malla de 1,5 m", fuente: "Ilustrativo (patrón típico en tresbolillo); ajustar al diseño de sostenimiento real" },
    { dato: "Ciclo de carguío", valor: "secuencia", fuente: "Orden de las fases (aproximación, penetración, recogida, retroceso, descarga); las duraciones no son medidas" },
  ],
  referencias: {
    abiertas: [
      abierta("scoop", "sandvik_lh517_lhd.jpg", { titulo: "Sandvik LH517 de perfil", vista: { ...lado(0), az: 0, el: 4, dist: 15 } }),
      abierta("scoop", "load_haul_dump_cobar_2017_01.jpg", { titulo: "LHD en Cobar, cucharón gastado", vista: { ...lado(0), az: 120, el: 8, dist: 12 } }),
      abierta("scoop", "lhd_sandvik_lh410.jpg", { titulo: "Sandvik LH410", vista: { ...lado(0), az: 180, el: 3, dist: 13 } }),
      abierta("scoop", "vkg_ojamaa_kaevandus.jpg", { titulo: "LHD bajo tierra con sus faros", vista: { galeria: true, anim: false, x: 0, objetivo: [3, 1.3, 0], az: 262, el: 6, dist: 9.5, estado: { levante: 0.15, volteo: 0.85, carga: true } } }),
      abierta("scoop", "d_ln_naklada.jpg", { titulo: "Cargador de mina en exhibición", vista: { ...lado(0), az: 140, el: 10, dist: 11 } }),
    ],
    estudio: [
      estudio("scoop", "2021_osorio_bazan_analisis_tecnico_econo_p34.jpg"),
      estudio("scoop", "2015_rodriguez_robles_perforacion_y_vola_p97.jpg"),
      estudio("scoop", "2021_vega_merino_analisis_de_las_demoras_p30.jpg"),
      estudio("scoop", "2019_gutierrez_castillo_aplicacion_de_so_p65.jpg"),
    ],
  },
};
