#!/usr/bin/env node
// Geotechnic · juez de control de calidad. Automático, con informe; su aprobación es la llave de `armar` (sin ella no
// hay index.html que publicar).
//
//   node scripts/juez.mjs ejemplos/<tema> [--salida dist] [--paso 0.1] [--sin-realismo] [--rapido]
//
// Líneas que juzga (ver references/juez.md):
//   física     interpenetración de sólidos (separador de planos de Anatomy), rangos de las articulaciones, cadenas
//              cerradas, cilindros dentro de su carrera y perpendiculares a sus pasadores, mangueras ancladas en sus
//              dos puertos, sin estirarse ni doblarse ni atravesar sólidos, ruedas apoyadas en el piso, nada dentro de
//              la roca. En el RANGO del modelo (sin terreno) y en el CICLO del ejemplo (con el terreno del motor B).
//   fidelidad  cada medida con fuente contra el modelo, dentro de su tolerancia.
//   realismo   capturas del modelo en el punto de vista de cada foto abierta, comparadas con la foto.
// Escribe <salida>/<tema>/juez/: informe.md, informe.json (con el sello de las fuentes), hoja-realismo.png.
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve, basename } from "node:path";
import { pathToFileURL } from "node:url";
import { RAIZ, selloDe } from "./codigo.mjs";
import { juzgarFisica, textoFisica } from "../juez/fisica.mjs";
import { juzgarFidelidad, textoFidelidad } from "../juez/fidelidad.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
const dirEj = resolve(args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--")) || "");
if (!existsSync(join(dirEj, "ficha.mjs"))) { console.error("uso: node scripts/juez.mjs ejemplos/<tema> [--salida dist]"); process.exit(1); }
const tema = basename(dirEj);
const salidaBase = resolve(opt("salida", join(RAIZ, "dist")));
const dirJ = join(salidaBase, tema, "juez");
mkdirSync(dirJ, { recursive: true });
const ficha = (await import(pathToFileURL(join(dirEj, "ficha.mjs")).href)).default;
const equipos = ficha.equipos || [];
const t0 = Date.now();
const informe = { tema, fecha: new Date().toISOString(), sello: selloDe(dirEj, equipos), lineas: {}, textos: [] };
const decir = (t) => { console.log(t); informe.textos.push(t); };

// ── física y fidelidad (Node, sobre el montaje del ejemplo)
if (existsSync(join(dirEj, "montaje.js"))) {
  const mod = await import(pathToFileURL(join(dirEj, "montaje.js")).href);
  const P = mod.pruebas(+opt("paso", args.includes("--rapido") ? 0.5 : 0.1));
  const rango = juzgarFisica(P.M, { poses: P.rango });
  decir(`── física · rango del modelo (${P.rango.length} poses, sin terreno)\n` + textoFisica(rango));
  const ciclo = juzgarFisica(P.M, { poses: P.ciclo, terreno: P.terreno });
  decir(`── física · ciclo del ejemplo (${P.ciclo.length} poses, con el terreno del motor B)\n` + textoFisica(ciclo));
  informe.lineas.fisicaRango = { aprobado: rango.aprobado, lineas: rango.lineas, poses: rango.poses, piezas: rango.piezas };
  informe.lineas.fisicaCiclo = { aprobado: ciclo.aprobado, lineas: ciclo.lineas, poses: ciclo.poses };
  for (const e of equipos) {
    const regMod = await import(pathToFileURL(join(RAIZ, "equipos", e, "modelo.js")).href);
    const reg = regMod[`EQUIPO_${e.toUpperCase().replace(/-/g, "_")}`];
    const fid = juzgarFidelidad(reg, P.M);
    decir("── " + textoFidelidad(fid));
    informe.lineas[`fidelidad ${e}`] = { aprobado: fid.aprobado, filas: fid.filas.map(({ medir, ...f }) => f) };
  }
} else decir("── física y fidelidad: el ejemplo no tiene montaje.js (sin equipos del motor A)");

// ── realismo: capturas en el punto de vista de cada foto abierta, comparadas con la foto
if (!args.includes("--sin-realismo")) {
  execFileSync(process.execPath, [join(RAIZ, "scripts", "armar.mjs"), dirEj, "--salida", salidaBase, "--borrador", ...(args.includes("--incrustar") ? ["--incrustar"] : [])], { stdio: "inherit" });
  const vista = join(salidaBase, tema, "vista.html");
  const abiertas = (ficha.referencias?.abiertas || []).filter((r) => r.vista);
  const pasos = [["until", "!document.querySelector('.geo-cargando')", 180000], ["wait", 2500]];
  const pares = [];
  abiertas.forEach((r, i) => {
    const png = join(dirJ, `captura-${i + 1}.png`);
    pasos.push(["eval", `GEO.igualarVista(${JSON.stringify(r.vista)}); 'ok'`], ["wait", 1200], ["shot", png, ".geo-lienzo"]);
    pares.push({ captura: png, foto: r.archivo, titulo: r.titulo, recorteCaptura: r.vista.recorte || null, recorteFoto: r.recorte || null });
  });
  writeFileSync(join(dirJ, "pasos.json"), JSON.stringify(pasos));
  let salidaDrive = "";
  try { salidaDrive = execFileSync(process.execPath, [join(RAIZ, "scripts", "drive.mjs"), vista, "--actions", join(dirJ, "pasos.json"), "--width", "1300", "--height", "1000"], { encoding: "utf8" }); }
  catch (e) { salidaDrive = String(e.stdout || "") + String(e.stderr || ""); }
  const consolaLimpia = /console: clean/.test(salidaDrive);
  writeFileSync(join(dirJ, "pares.json"), JSON.stringify(pares));
  let rr = { aprobado: false, filas: [] };
  try {
    const txt = execFileSync("python", ["-I", join(RAIZ, "juez", "realismo.py"), join(dirJ, "pares.json"), join(dirJ, "realismo.json"), join(dirJ, "hoja-realismo.png")], { encoding: "utf8" });
    rr = JSON.parse(readFileSync(join(dirJ, "realismo.json"), "utf8"));
    decir("── " + txt.trim());
  } catch (e) { decir("── realismo: no se pudo medir (" + String(e.message).split("\n")[0] + ")"); }
  for (const f of rr.filas) decir(`${f.ok ? "ok   " : "NO   "} ${f.titulo.padEnd(40)} Δlum ${f.dLum >= 0 ? "+" : ""}${f.dLum.toFixed(2)} · desv ×${f.rDesv.toFixed(2)} · bordes ×${f.rBordes.toFixed(2)} · colorido ×${f.rColorido.toFixed(2)}`);
  decir(consolaLimpia ? "consola de la página: limpia" : "consola de la página: CON ERRORES\n" + salidaDrive.split("\n").filter((l) => /console|error/i.test(l)).slice(0, 8).join("\n"));
  informe.lineas.realismo = { aprobado: rr.aprobado && consolaLimpia, ...rr, consolaLimpia };
}

informe.aprobado = Object.values(informe.lineas).every((l) => l.aprobado);
informe.segundos = (Date.now() - t0) / 1000;
writeFileSync(join(dirJ, "informe.json"), JSON.stringify(informe, null, 1));
writeFileSync(join(dirJ, "informe.md"), `# Juez · ${tema}\n\n${informe.aprobado ? "**APROBADO**" : "**REPROBADO** (armar no escribirá index.html)"} · sello \`${informe.sello}\` · ${informe.fecha}\n\n\`\`\`\n${informe.textos.join("\n")}\n\`\`\`\n`);
console.log(`\n${informe.aprobado ? "JUEZ: APROBADO" : "JUEZ: REPROBADO"} · ${join(dirJ, "informe.md")} · ${informe.segundos.toFixed(0)} s`);
process.exit(informe.aprobado ? 0 : 1);
