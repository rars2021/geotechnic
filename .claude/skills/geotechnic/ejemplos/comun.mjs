// Ayudas para las fichas de los ejemplos (corren en Node al armar la página).
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const DATOS = process.env.GEOTECHNIC_DATOS || "<DATOS>/geotechnic";

/** Foto abierta reunida con el catálogo de fuentes: lee su licencia y su clave de figuras/<tema>/abiertas/fuentes.json. */
export function abierta(tema, img, extra = {}) {
  const fs = JSON.parse(readFileSync(join(DATOS, "figuras", tema, "abiertas", "fuentes.json"), "utf8"));
  const f = fs.find((x) => x.img === img);
  if (!f) throw new Error(`no está en fuentes.json: ${tema}/${img}`);
  return {
    archivo: join(DATOS, "figuras", tema, "abiertas", img),
    titulo: extra.titulo || f.archivo.replace(/\.(jpe?g|png)$/i, ""),
    autor: f.autor, licencia: f.licencia, licenciaUrl: f.licencia_url || "https://creativecommons.org/licenses/", pagina: f.pagina, clave: f.clave,
    ...extra,
  };
}

/** Figura de tesis o paper (solo estudio: no se incrusta en la página publicada). */
export function estudio(tema, img) {
  const fs = JSON.parse(readFileSync(join(DATOS, "figuras", tema, "fuentes.json"), "utf8"));
  const f = fs.find((x) => x.img === img);
  if (!f) throw new Error(`no está en fuentes.json: ${tema}/${img}`);
  return { archivo: join(DATOS, "figuras", tema, img), titulo: f.titulo, leyenda: f.leyenda, pagina: f.pagina, clave: f.clave };
}

/** Cita corta para la tabla de fuentes. */
export const cita = (autor, anio, clave, donde = "") => `${autor} (${anio})${donde ? ", " + donde : ""} · el catálogo de fuentes <code>${clave}</code>`;

const escH = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const num = (v, u) => `${String(v).replace(".", ",")} ${u}`.trim();

/** Filas de la tabla de fuentes a partir de las medidas de un equipo (con su cita o «estimado»). */
export function filasMedidas(M) {
  return M.medidas.map((m) => ({
    dato: m.dato, valor: num(m.valor, m.unidad),
    fuente: m.fuente ? cita(m.fuente.autor, m.fuente.anio, m.fuente.clave, m.fuente.donde) : `<b>Estimado</b>: ${escH(m.nota || "sin fuente en el catálogo de fuentes")}`,
  }));
}

/** Sección «Cómo está hecho»: motores, contrato y juez (texto común de los ejemplos con equipos). */
export function seccionComoSeHizo(equipo) {
  return `<section class="geo-seccion geo-solo-completo"><h2>Cómo está hecho</h2>
<div style="overflow-x:auto"><table class="geo-tabla"><thead><tr><th>Parte</th><th>Qué hace</th><th>Dónde</th></tr></thead><tbody>
<tr><td>Motor A · equipo</td><td>El ${escH(equipo)} es una lista de sólidos convexos con sus grupos (bisagras, deslizaderas), pasadores, cilindros de pasador a pasador y mangueras de racor a racor. Disciplina de Anatomy (MIT): lista de piezas antes de la geometría, uniones reales, auditoría.</td><td><code>motorA/</code> · <code>equipos/${escH(equipo)}/</code></td></tr>
<tr><td>Motor B · roca</td><td>Macizo con familias DFN, relieve facetado por bloques, ondulación de juntas con ruido explícito, alteración gradacional, agua y polvo.</td><td><code>kit/macizo.js</code> · <code>kit/labor.js</code></td></tr>
<tr><td>Contrato</td><td>La roca le da al equipo el piso, el contorno, los emboquilles y los límites; el equipo le da a la roca sus huellas, su polvo, sus taladros y su carga.</td><td><code>kit/contrato.js</code></td></tr>
<tr><td>Juez</td><td>Antes de publicar recorre todo el ciclo y todo el rango: sólidos que se atraviesan, cilindros fuera de carrera, mangueras sueltas o estiradas, ruedas en el aire, equipo dentro de la roca; medidas contra su fuente; capturas contra fotos. Si falla, no hay página.</td><td><code>scripts/juez.mjs</code></td></tr>
</tbody></table></div></section>`;
}
