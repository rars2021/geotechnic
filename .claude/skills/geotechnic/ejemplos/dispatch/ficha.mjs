// Ficha del ejemplo dispatch: textos, piezas, números con fuente, fotos con su vista. La escena está en escena.js y lo
// que se anima (y juzga) en montaje.js: la simulación de la flota (kit/procesos.js → simularFlota) con las
// distribuciones de Yupanqui Sánchez (2025), la posición de cada camión sobre su ruta y la pala sincronizada.
import { abierta, estudio, cita, filasMedidas, seccionComoSeHizo } from "../comun.mjs";
import { MEDIDAS_CAMION } from "../../equipos/camion/medidas.js";
import { MEDIDAS_PALA } from "../../equipos/pala/medidas.js";
import { montajeDispatch, OPCIONES_DISPATCH } from "./montaje.js";

const YUPANQUI = "hdl:20.500.14076/29254", CASTILLO = "hdl:20.500.14076/9227", COSME = "hdl:20.500.14076/22795";
const OJEDA = "hdl:20.500.14076/22773", LUCANO = "hdl:20.500.14076/6645", OLIVERA = "hdl:20.500.14076/22435", BONILLA = "hdl:20.500.14076/28169";
const yup = (donde) => cita("Yupanqui Sánchez", 2025, YUPANQUI, donde);
const coma = (v, d = 1) => v.toFixed(d).replace(".", ",");

// el montaje da las vistas de las fotos (cámara sobre un camión o una pala en el minuto en que hace lo de la foto) y
// los largos dibujados de las rutas (para decir con verdad que el mapa no está a escala en distancia)
const M = montajeDispatch();
const V = M.vistas;
const R = M.rutasDibujadas;

export default {
  titulo: "Dispatch: flota en el tajo",
  ceja: "Geotechnic · procesos · escala tajo",
  resumen: "Doce camiones de 230 t y dos palas comparten una chancadora primaria y un botadero. Una simulación de eventos discretos, con las distribuciones medidas por Yupanqui Sánchez (2025), decide cuándo carga, viaja, espera y descarga cada camión; la escena lo mueve por sus rutas y el panel lo muestra como un despacho real: estado de cada camión, colas en cada pala y en cada destino, y a qué pala va cada uno. Cambia la política de asignación y la simulación vuelve a correr.",
  alt: "Tajo abierto en tonos papel con dos palas, doce camiones en sus rutas, una chancadora y un botadero; debajo, un panel con la línea de tiempo de cada camión y las colas.",
  equipos: ["camion", "pala"],
  modos: ["completo", "blanco"],
  barra: `<button type="button" id="reproducir" aria-pressed="false">Reproducir</button>`,
  pista: "Arrastra para girar · rueda para acercar · toca un número · toca una fila del panel para seguir a ese camión",
  lecturaInicial: "Turno simulado de 8 h · circuito cerrado · 6 camiones por pala",
  controles: [
    { id: "tiempo", etiqueta: "Hora del turno", min: 0, max: OPCIONES_DISPATCH.duracion, paso: 0.1, valor: OPCIONES_DISPATCH.tInicial, salida: "07:00" },
    { html: `<label class="geo-control" for="velocidad"><span>Velocidad</span><select id="velocidad" style="justify-self:start"><option value="30">× 30 (1 min en 2 s)</option><option value="60" selected>× 60 (1 min por segundo)</option><option value="180">× 180</option><option value="600">× 600</option></select><output></output></label>` },
    { html: `<label class="geo-control" for="politica"><span>Asignación</span><select id="politica" style="justify-self:start"><option value="cerrado" selected>Circuito cerrado (cada camión a su pala)</option><option value="libre">Circuito libre (a la pala que lo atiende antes)</option><option value="condicional">Despacho condicional (cambia si su cola supera el umbral)</option></select><output for="politica"></output></label>` },
    { id: "umbral", etiqueta: "Umbral de cola (condicional)", min: 0, max: 2, paso: 1, valor: 0, salida: "0 camiones" },
    { html: `<div class="geo-despacho" id="despacho"><canvas id="panel-despacho" aria-label="Línea de tiempo de cada camión, colas en palas y destinos" role="img"></canvas><div class="geo-kpi" id="kpi" aria-live="polite"></div></div>` },
    { html: `<label class="geo-control" for="corte"><span>Corte del tajo</span><input type="checkbox" id="corte" checked style="justify-self:start"><output></output></label>` },
    { html: `<label class="geo-control" for="lamina"><span>Lámina (aristas en tinta)</span><input type="checkbox" id="lamina" checked style="justify-self:start"><output></output></label>` },
  ],
  css: `.geo-despacho{display:grid;gap:8px;padding:4px 0}.geo-despacho canvas{width:100%;display:block;cursor:pointer}
.geo-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));gap:6px;font-size:12.5px}
.geo-kpi div{border:1px solid var(--linea);border-radius:8px;padding:6px 9px;background:var(--tarjeta)}
.geo-kpi b{display:block;color:var(--fuerte);font-variant-numeric:tabular-nums;font-size:14px}
.geo-kpi small{color:var(--tenue)}
.geo-control select{font:inherit;padding:5px 8px;border-radius:6px;border:1px solid var(--linea);background:var(--tarjeta);color:var(--fuerte);max-width:100%}`,
  piezas: [
    { id: "pala", numero: 1, nombre: "Pala eléctrica", definicion: "Pala de cables de 56 m³. Carga un camión en 3,8 min de media; atiende en orden de llegada." },
    { id: "camion", numero: 2, nombre: "Camión de acarreo", definicion: "230 t (clase CAT 793). Doce en la flota: seis por pala en el circuito cerrado." },
    { id: "tolva", numero: 3, nombre: "Tolva", definicion: "Caja del camión. Se levanta para descargar: 1,8 min de media en la chancadora o el botadero." },
    { id: "colaPala", numero: 4, nombre: "Cola en la pala", definicion: "Camiones que esperan su turno en fila, a 60 m de la pala, en orden de llegada." },
    { id: "cuadrado", numero: 5, nombre: "Punto de carguío", definicion: "El camión retrocede hasta quedar bajo el cucharón: es el cuadrado, dentro de 20 m de la pala." },
    { id: "rampa", numero: 6, nombre: "Rampa", definicion: "Vía con pendiente entre bancos: 7–9 % en el Tajo A y 9–11 % en el Tajo B." },
    { id: "berma", numero: 7, nombre: "Berma y banco", definicion: "Escalón del tajo: la cara del banco y la berma que atrapa las rocas que caen." },
    { id: "pretil", numero: 8, nombre: "Pretil", definicion: "Muro de material suelto al borde de la vía: detiene a un camión que se sale." },
    { id: "chancadora", numero: 9, nombre: "Chancadora primaria", definicion: "Compartida por los dos tajos: descarga un camión a la vez. Es donde se forma la cola de descarga." },
    { id: "botadero", numero: 10, nombre: "Botadero", definicion: "Destino del desmonte: un puesto de descarga en su cresta, con pretil." },
    { id: "ruta", numero: 11, nombre: "Ruta de acarreo", definicion: "Camino de cada pala a cada destino: un carril cargado y otro vacío." },
    { id: "colaDescarga", numero: 12, nombre: "Cola de descarga", definicion: "Camiones cargados que esperan a que la chancadora quede libre." },
  ],
  fuentes: [
    { dato: "Tiempo de carga (T₁)", valor: "lognormal μ 3,8 min · σ 0,6", fuente: yup("tabla 7, pág. 43 (PDF 59)") },
    { dato: "Velocidad cargado (T₂)", valor: "triangular 18 · 22 · 25 km/h", fuente: yup("tabla 7, pág. 43 (PDF 59)") },
    { dato: "Tiempo de descarga (T₃)", valor: "normal μ 1,8 min · σ 0,4", fuente: yup("tabla 7, pág. 43 (PDF 59); se corta en 0,5 min (estimado)") },
    { dato: "Velocidad vacío (T₄)", valor: "triangular 22 · 25 · 28 km/h", fuente: yup("tabla 7, pág. 43 (PDF 59)") },
    { dato: "Factor de llenado", valor: "normal truncada μ 0,99 · σ 0,02", fuente: yup("tabla 7, pág. 43 (PDF 59); truncada en ±3σ (estimado)") },
    { dato: "Disponibilidad y demoras", valor: "p 0,91 · exponencial 3,0 h", fuente: yup("tabla 7") + ". <b>No simuladas</b>: el turno corre sin fallas ni demoras, para leer las colas solas" },
    { dato: "Ciclo del Tajo A", valor: "37–39 min", fuente: yup("pág. 1 (PDF 17): rampas de 3,0–3,5 km al 7–9 %") },
    { dato: "Ciclo del Tajo B", valor: "46–48 min", fuente: yup("pág. 2 (PDF 18): rampas de 5,0–5,5 km al 9–11 %") },
    { dato: "Chancadora compartida", valor: "Tajo A y Tajo B", fuente: yup("pág. 1 (PDF 17)") },
    { dato: "Camiones por pala", valor: "6 (punto óptimo)", fuente: yup("tabla 9, pág. 45 (PDF 61); escenario base de 6 camiones fijos, tabla 8, pág. 44 (PDF 60)") },
    { dato: "Cola media de la tesis", valor: "2,5–2,9 min", fuente: yup("tabla 8, pág. 44 (PDF 60); 2,8 min en la tabla 5, pág. 42 (PDF 58)") },
    { dato: "Políticas de asignación", valor: "cerrado · libre · condicional", fuente: yup("3.6.2, pág. 46 (PDF 62)") },
    { dato: "Capacidad del camión", valor: "230 t", fuente: yup("pág. 1 (PDF 17)") + ". La tabla 5 de la misma tesis da 338,5 t de carga útil (camión de 400 t, pág. 48): la tesis no es coherente; se usa 230 t, la clase CAT 793 del kit (" + cita("Bonilla Vargas", 2024, BONILLA, "tabla 4") + ")" },
    { dato: "Distancia de espera · de cuadrado", valor: "60 m · 20 m", fuente: cita("Castillo Calderón", 2014, CASTILLO, "3.1.2–3.1.3, pág. 27–28 (PDF 28–29)") },
    { dato: "Estados del ciclo", valor: "7 (de los 8 del despacho)", fuente: cita("Castillo Calderón", 2014, CASTILLO, "fig. 3.1 y 3.1.1–3.1.8") + "; «retrocediendo» en la descarga va dentro de «descarga»" },
    { dato: "Tiempo de cuadrado", valor: "0,7 min", fuente: "<b>Estimado</b>: ninguna tesis de el catálogo de fuentes lo da aparte (Castillo Calderón lo suma a la carga)" },
    { dato: "Distancias simuladas (un sentido)", valor: `A→chancadora ${coma(M.km["A→chancadora"])} km · B→chancadora ${coma(M.km["B→chancadora"])} km · B→botadero ${coma(M.km["B→botadero"])} km`, fuente: "<b>Estimado</b>: calibradas para que el ciclo medio en circuito cerrado caiga en 37–39 y 46–48 min con las distribuciones de la tabla 7. La tesis solo da el largo de las rampas" },
    { dato: "Rutas dibujadas", valor: `${R.map((x) => `${x.nombre} ${Math.round(x.largo)} m`).join(" · ")}`, fuente: "<b>El mapa no está a escala en distancia</b>: el tajo dibujado mide cientos de metros y se simulan kilómetros. Cada camión avanza por su ruta a la fracción de su viaje (la hora y el orden son los de la simulación; la velocidad en pantalla no)" },
    { dato: "Destino de cada carga", valor: "A → chancadora · B: 2 de cada 3 a la chancadora", fuente: "<b>Ilustrativo</b>: la tesis dice que el Tajo B aporta la mayor parte del mineral a la planta (pág. 2), sin la proporción" },
    { dato: "Puestos de descarga", valor: "chancadora 1 · botadero 1", fuente: "<b>Ilustrativo</b>: uno por destino, el punto de descarga del terreno" },
    { dato: "Pases de pala por camión", valor: "3", fuente: "<b>Estimado</b>: 230 t / (56 m³ × 1,76 t/m³ × 0,9 de llenado) ≈ 2,6. La animación reparte el T₁ de la tesis entre los 3 pases" },
    { dato: "Cucharón sobre la tolva al descargar", valor: "fondo a 9,0 m del piso", fuente: "<b>Estimado</b>: a 8,2 m (el valor de la pala) el cucharón rozaba el montón de la tolva al volver; a 9,6 m la pala choca consigo misma al girar cargada (los dos los encontró el juez)" },
    { dato: "Pala al pie del montón", valor: "14,8 m", fuente: "<b>Medido en el modelo</b>: la pala baja los dientes al piso a ≈ 13 m de su eje; a menos de 14,5 m el cucharón entraba en el montón (lo encontró el juez)" },
    { dato: "Tránsito", valor: "sin adelantar · cruces de a uno", fuente: "<b>Regla del modelo</b>: tramos de 16 m en los que nadie entra hasta que el de adelante dejó el siguiente; en cruces y uniones de carriles pasa un camión a la vez y el que sale después cede. Las esperas de tránsito entran en el ciclo medido" },
    { dato: "Turno simulado", valor: "8 h desde las 07:00", fuente: "<b>Ilustrativo</b>. La flota sale de la chancadora cada 2,5 min desde las 05:00; el panel y los indicadores empiezan a las 07:00, ya en régimen. Semilla fija: la misma política da siempre el mismo turno" },
    { dato: "Ancho de vía", valor: "≥ 8,4 m por carril de 230 t", fuente: cita("Pelaez Vera", 2013, "hdl:20.500.14076/10395", "tabla 4.3") + "; vía de tajo de 40 m con pretil de 3 × 2 m: " + cita("Ojeda Ore", 2022, OJEDA, "fig. 2.16") },
    { dato: "Pantalla de un despacho real", valor: "rutas, colas, estados", fuente: cita("Olivera Sánchez", 2021, OLIVERA, "fig. 5.2") + " · " + cita("Lucano Chuan", 2014, LUCANO, "pág. 26–27 (Cerro Verde)") },
    { dato: "Cola y carguío en otra mina", valor: "espera 0,55–1,97 min", fuente: cita("Cosme Torres", 2022, COSME, "pág. 82–99") + " (solo para comparar)" },
    ...filasMedidas(MEDIDAS_CAMION),
    ...filasMedidas(MEDIDAS_PALA),
  ],
  extra: seccionComoSeHizo("camión y la pala"),
  vistaInicial: V.inicial,
  referencias: {
    abiertas: [
      abierta("dispatch", "big_truck_looks_small_in_an_open_pit_mine.jpg", { titulo: "Pala cargando al fondo del tajo", recorte: [0.55, 0.6, 0.85, 0.85], vista: V.palaLejos }),
      abierta("dispatch", "mina_de_chuquicamata_calama_chile_2016_02_01_dd_118.jpg", { titulo: "Chuquicamata: camiones en las rampas", recorte: [0.1, 0.3, 0.9, 0.65], vista: V.rampas }),
      abierta("dispatch", "mina_de_chuquicamata_calama_chile_2016_02_01_dd_120.jpg", { titulo: "Chuquicamata: camiones en el banco", recorte: [0.1, 0.4, 0.75, 0.75], vista: V.banco }),
      abierta("dispatch", "mina_de_chuquicamata_calama_chile_2016_02_01_dd_123.jpg", { titulo: "Camión cargado junto al pretil", recorte: [0.08, 0.3, 0.8, 0.92], vista: V.cargado }),
      abierta("dispatch", "kennecott_mine_dump_truck_from_a_distance.jpg", { titulo: "Kennecott: camión en la vía", recorte: [0.55, 0.55, 0.9, 0.85], vista: V.via }),
      abierta("dispatch", "massive_dump_truck_chino_mine_nm_usa.jpg", { titulo: "Chino: camión cargado de perfil", recorte: [0.35, 0.42, 0.75, 0.7], vista: V.perfil }),
      abierta("dispatch", "cat_797_sdb_bhpbilliton_escondida_chile_2_hr.jpg", { titulo: "Tolva levantada al descargar", recorte: [0.0, 0.0, 1.0, 0.95], vista: V.descarga }),
    ],
    estudio: [
      estudio("dispatch", "2014_castillo_calderon_factor_equivalent_p28.jpg"),
      estudio("dispatch", "2014_castillo_calderon_factor_equivalent_p49.jpg"),
      estudio("dispatch", "2021_olivera_sanchez_analisis_del_consum_p49.jpg"),
      estudio("dispatch", "2022_cosme_torres_teoria_de_colas_para_l_p68.jpg"),
      estudio("dispatch", "2014_lucano_chuan_mejoramiento_del_calcu_p82.jpg"),
      estudio("dispatch", "2018_tomairo_proleon_aplicacion_del_mode_p78.jpg"),
    ],
  },
};
