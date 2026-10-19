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
