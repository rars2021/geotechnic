// Ficha del ejemplo: textos, piezas, números con fuente y referencias. La escena está en escena.js.
import { abierta, estudio, cita } from "../comun.mjs";

const BONILLA = "hdl:20.500.14076/28169", QUEZADA = "hdl:20.500.14076/22796", MONTES = "hdl:20.500.14076/29234", PERALES = "hdl:20.500.14076/10463", OJEDA = "hdl:20.500.14076/22773";

export default {
  titulo: "Corte de talud",
  ceja: "Geotechnic · terreno y roca · escala banco",
  resumen: "Tres bancos de 15 m de una pared de tajo andino, con su cresta rota, el talud de escombros al pie, medias cañas de precorte, tres familias de fracturas, una falla con panizo, óxidos que chorrean y una filtración. Gira la cámara, señala cada pieza y cambia el ángulo de cara del banco 2.",
  alt: "Bloque diagrama 3D de una pared de tajo con tres bancos, fracturas, falla, óxidos y un camión de acarreo al pie.",
  modos: ["completo", "blanco"],
  pista: "Arrastra para girar · rueda para acercar · toca un número",
  controles: [
    { id: "bfa2", etiqueta: "Cara del banco 2", min: 55, max: 80, paso: 1, valor: 65, salida: "65°" },
    { html: `<label class="geo-control" for="ver-trazas"><span>Trazas de fracturas</span><input type="checkbox" id="ver-trazas" checked style="justify-self:start"><output></output></label>` },
  ],
  piezas: [
    { id: "cara", numero: 1, nombre: "Cara del banco", definicion: "Superficie excavada entre pie y cresta. 15 m de alto; 71° con precorte, 65° con voladura amortiguada." },
    { id: "cresta", numero: 2, nombre: "Cresta", definicion: "Borde superior de la cara. La voladura la rompe y la hace retroceder: no es una arista." },
    { id: "pie", numero: 3, nombre: "Pie y talud de escombros", definicion: "Donde la cara se apoya en la berma. El material caído forma un talud a su ángulo de reposo (≈ 34°)." },
    { id: "berma", numero: 4, nombre: "Berma", definicion: "Banqueta que atrapa las rocas que caen. 7,5 m para un banco de 15 m (Ritchie modificada)." },
    { id: "canas", numero: 5, nombre: "Medias cañas", definicion: "Mitades de taladros de precorte de 127 mm que quedan en la cara final, cada ≈ 2 m." },
    { id: "familias", numero: 6, nombre: "Familias de fracturas", definicion: "Tres familias de juntas: sus trazas cortan la cara en líneas que terminan donde termina cada junta." },
    { id: "falla", numero: 7, nombre: "Falla con panizo", definicion: "Zona triturada de arcilla oscura. Se hunde en la cara, está húmeda y altera la roca a su alrededor." },
    { id: "oxidos", numero: 8, nombre: "Zona de óxidos", definicion: "Los óxidos de hierro tiñen las fracturas y chorrean cara abajo; la zona se desvanece hacia afuera." },
    { id: "agua", numero: 9, nombre: "Filtración", definicion: "Bajo la línea de surgencia la roca se oscurece y el agua baja en chorreras desde las fracturas." },
  ],
  fuentes: [
    { dato: "Altura de banco", valor: "15 m", fuente: cita("Bonilla Vargas", 2024, BONILLA, "parámetros de diseño de Antamina, pág. PDF 41") },
    { dato: "Ángulo de cara medido por escaneo", valor: "71° (Flexigel) · 65° (ANFO pesado)", fuente: cita("Quezada Valuis", 2022, QUEZADA, "fig. 58, pág. 116") },
    { dato: "Ancho mínimo de berma para 15 m", valor: "≈ 7,5 m", fuente: cita("Montes Valderrama", 2025, MONTES, "fig. 12 (Ritchie modificada, Crouse 2008)") },
    { dato: "Berma geotécnica (sobre el banco 3)", valor: "≈ 26 m (Antamina: 30 m)", fuente: cita("Bonilla Vargas", 2024, BONILLA) },
    { dato: "Diámetro de precorte", valor: "127 mm (ROC T600)", fuente: cita("Bonilla Vargas", 2024, BONILLA, "tabla 4") },
    { dato: "Espaciado de precorte", valor: "S = 16·Dh ≈ 2,0 m", fuente: cita("Bonilla Vargas", 2024, BONILLA, "ec. 6 (Smith 2016)") },
    { dato: "Ángulo de reposo del material suelto", valor: "33°–35° (se usa 34°)", fuente: cita("Perales Orellana", 2011, PERALES, "pág. 116") },
    { dato: "Pretil de la vía", valor: "2 m de alto · 3 m de base", fuente: cita("Ojeda Ore", 2022, OJEDA, "fig. 2.16 (FMI)") },
    { dato: "Camión al pie", valor: "clase 226–230 t (CAT 793)", fuente: cita("Bonilla Vargas", 2024, BONILLA, "tabla 4") + "; dimensiones: catálogo del fabricante (estimado)" },
    { dato: "Familias de fracturas", valor: "J1 82/205 · J2 75/110 · J3 38/330", fuente: "Ilustrativas: no hay levantamiento de esta pared en el catálogo de fuentes. Espaciado exponencial (Priest y Hudson)." },
    { dato: "Cara más oscura que la berma", valor: "≈ 0,6× de luminancia", fuente: "Medido en 3 fotos: Antamina (Commons), Chuquicamata (Commons), «Big truck…» (Commons)" },
  ],
  referencias: {
    abiertas: [
      abierta("talud", "operaciones_antamina_panoramio.jpg", { titulo: "Operaciones Antamina", vista: { objetivo: [0, 18, -18], az: 210, el: 30, dist: 140 } }),
      abierta("dispatch", "big_truck_looks_small_in_an_open_pit_mine.jpg", { titulo: "Bancos con escombros al pie", vista: { objetivo: [0, 20, -16], az: 182, el: 14, dist: 105 } }),
      abierta("dispatch", "mina_de_chuquicamata_calama_chile_2016_02_01_dd_120.jpg", { titulo: "Chuquicamata: cara, berma y perforación", vista: { objetivo: [-6, 10, -6], az: 178, el: 38, dist: 80 } }),
      abierta("talud", "vistas_de_yanacancha_mina_antamina_01.jpg", { titulo: "Yanacancha, Antamina", vista: { objetivo: [0, 12, -10], az: 150, el: 8, dist: 160 } }),
      abierta("talud", "minas_de_tintaya_peru.jpg", { titulo: "Tintaya: tajo con agua al fondo", vista: { objetivo: [0, 15, -20], az: 200, el: 55, dist: 220 } }),
    ],
    estudio: [
      estudio("talud", "2024_choqueneira_esperilla_clasificacion_p16.jpg"),
      estudio("talud", "2023_cisneros_eufracio_reevaluacion_geot_p191.jpg"),
      estudio("talud", "2020_alvarez_tovar_evaluacion_geomecanic_p76.jpg"),
      estudio("talud", "2020_alvarez_tovar_evaluacion_geomecanic_p78.jpg"),
      estudio("talud", "2025_lopez_nicolaz_optimizacion_geotecni_p25.jpg"),
      estudio("talud", "2025_lozano_chulan_control_de_calidad_de_p74.jpg"),
    ],
  },
};
