#!/usr/bin/env node
// Geotechnic · juez de control de calidad. Automático, con informe; su aprobación es la llave de `armar` (sin ella no
// hay index.html que publicar).
//
//   node scripts/juez.mjs ejemplos/<tema> [--salida dist] [--paso 0.1] [--sin-realismo] [--rapido] [--hilos N]
//   node scripts/juez.mjs --plantas      corre las plantas de física (varias máquinas), limpieza y realismo (casos que deben fallar y pasar); sale 0/1
//
// Líneas que juzga (ver references/juez.md):
//   física     interpenetración de sólidos (separador de planos de Anatomy), rangos de las articulaciones, cadenas
//              cerradas, cilindros dentro de su carrera y perpendiculares a sus pasadores, mangueras ancladas en sus
//              dos puertos, sin estirarse ni doblarse ni atravesar sólidos, ruedas apoyadas en el piso, nada dentro de
//              la roca. En el RANGO del modelo (sin terreno) y en el CICLO del ejemplo (con el terreno del motor B).
//              Varias máquinas (pruebas() con `modelos`, `rangos`, `maquinas` y `porMaquina`): un rango por modelo, cada
//              instancia en el ciclo y la línea «entre máquinas» (ningún sólido de una entra en otra más de 4 mm).
//   fidelidad  cada medida con fuente contra el modelo, dentro de su tolerancia.
//   realismo   capturas del modelo en el punto de vista de cada foto abierta, comparadas con la foto.
//   limpieza   dibujo limpio para estudio (references/estudio.md): mallas cerradas y orientadas en la escena viva,
//              corte de cámara (planoCorte) sobre el terreno, paleta papel, poco ruido y consola limpia.
//              Con --sin-realismo solo juzga el corte y el informe queda PARCIAL (armar no publica un informe parcial).
// Escribe <salida>/<tema>/juez/: informe.md, informe.json (con el sello de las fuentes), hoja-realismo.png.
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve, basename } from "node:path";
import { pathToFileURL } from "node:url";
import { RAIZ, selloDe } from "./codigo.mjs";
import { juzgarFisica, juzgarConjunto, juzgarConjuntoHilos, firmaCiclo, textoFisica, plantasFisica } from "../juez/fisica.mjs";
import { juzgarFidelidad, textoFidelidad } from "../juez/fidelidad.mjs";
import { plantas, textoPlantas, expresionCerradas, leerCerradas, corteDeEjemplo, juzgarImagenes, textoLimpieza, consolaLimpia as esConsolaLimpia } from "../juez/limpieza.mjs";

const args = process.argv.slice(2);
if (args.includes("--plantas")) {
  const p = await plantas();
  try { p.filas.unshift(...(await plantasFisica()).filas); } // física: varias máquinas («entre máquinas», caché, libreCaja)
  catch (e) { p.filas.unshift({ linea: "física", nombre: "plantasFisica corre", debe: true, aprueba: false, ok: false, detalle: String(e.message).split(/\r?\n/)[0] }); }
  try { // realismo v3 (forma): plantas sintéticas en python
    const py = JSON.parse(execFileSync("python", ["-I", join(RAIZ, "juez", "realismo.py"), "--plantas"], { encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" } }));
    for (const f of py) p.filas.push({ linea: f.linea, nombre: f.nombre, debe: f.debeAprobar, aprueba: f.aprueba, ok: f.ok, info: !!f.info, detalle: f.detalle });
  } catch (e) { p.filas.push({ linea: "realismo", nombre: "juez/realismo.py --plantas corre", debe: true, aprueba: false, ok: false, detalle: String(e.message).split(/\r?\n/)[0] }); }
  p.aprobado = p.filas.every((f) => f.ok || f.info);
  console.log(textoPlantas(p));
  process.exit(p.aprobado ? 0 : 1);
}
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
let P = null;
if (existsSync(join(dirEj, "montaje.js"))) {
  const mod = await import(pathToFileURL(join(dirEj, "montaje.js")).href);
  const paso = +opt("paso", args.includes("--rapido") ? 0.5 : 0.1);
  P = mod.pruebas(paso);
  const regs = {};
  for (const e of equipos) {
    const regMod = await import(pathToFileURL(join(RAIZ, "equipos", e, "modelo.js")).href);
    regs[e] = regMod[`EQUIPO_${e.toUpperCase().replace(/-/g, "_")}`];
  }
  // rango: uno por modelo si el montaje da `modelos`/`rangos` (varias máquinas); si no, el de P.M (como siempre)
  if (P.modelos || P.rangos) {
    for (const e of [...new Set([...Object.keys(P.modelos || {}), ...Object.keys(P.rangos || {})])]) {
      const Me = P.modelos?.[e];
      const nombre = regs[e]?.medidas?.equipo || e;
      if (!Me) { decir(`── física · rango ${e}: FALLA · pruebas() da rangos.${e} pero no modelos.${e}`); informe.lineas[`fisicaRango ${e}`] = { aprobado: false, error: `sin modelos.${e}`, equipo: e, nombre, lineas: {}, poses: 0 }; continue; }
      const poses = P.rangos?.[e] ?? (Me.muestrasRango || [{}]).map((v, i) => ({ etiqueta: `rango ${i}`, valores: v }));
      const r = juzgarFisica(Me, { poses });
      decir(`── física · rango ${e} (${poses.length} poses, sin terreno)\n` + textoFisica(r));
      informe.lineas[`fisicaRango ${e}`] = { aprobado: r.aprobado, lineas: r.lineas, poses: r.poses, piezas: r.piezas, equipo: e, nombre };
    }
  } else {
    const rango = juzgarFisica(P.M, { poses: P.rango });
    decir(`── física · rango del modelo (${P.rango.length} poses, sin terreno)\n` + textoFisica(rango));
    informe.lineas.fisicaRango = { aprobado: rango.aprobado, lineas: rango.lineas, poses: rango.poses, piezas: rango.piezas };
  }
  // ciclo: con `maquinas`, cada instancia con su porMaquina[id] y la línea «entre máquinas»; si no, P.M (como siempre)
  if (Array.isArray(P.maquinas) && P.maquinas.length) {
    // ciclos largos en hilos (references/juez.md, «Hilos»): cada hilo arma el mismo ciclo y juzga tramos; mismo informe
    const hilos = +opt("hilos", P.ciclo.length >= 200 ? 0 : 1); // 0 = automático (núcleos − 1, hasta 12)
    const ciclo = hilos === 1 ? juzgarConjunto(P.maquinas, { ciclo: P.ciclo, terreno: P.terreno })
      : await juzgarConjuntoHilos(P.maquinas, { modulo: pathToFileURL(join(dirEj, "montaje.js")).href, paso, poses: P.ciclo.length, firma: firmaCiclo(P.ciclo, P.maquinas), hilos: hilos || undefined });
    decir(`── física · ciclo del ejemplo (${P.ciclo.length} poses × ${P.maquinas.length} máquinas, con el terreno del motor B)\n` + textoFisica(ciclo));
    informe.lineas.fisicaCiclo = { aprobado: ciclo.aprobado, lineas: ciclo.lineas, poses: ciclo.poses, instancias: ciclo.instancias, maquinas: ciclo.maquinas, estadistica: ciclo.estadistica, segundos: ciclo.segundos, hilos: ciclo.hilos };
  } else {
    const ciclo = juzgarFisica(P.M, { poses: P.ciclo, terreno: P.terreno });
    decir(`── física · ciclo del ejemplo (${P.ciclo.length} poses, con el terreno del motor B)\n` + textoFisica(ciclo));
    informe.lineas.fisicaCiclo = { aprobado: ciclo.aprobado, lineas: ciclo.lineas, poses: ciclo.poses };
  }
  for (const e of equipos) {
    const reg = regs[e];
    const fid = juzgarFidelidad(reg, P.modelos?.[e] ?? P.M);
    decir("── " + textoFidelidad(fid));
    informe.lineas[`fidelidad ${e}`] = { aprobado: fid.aprobado, filas: fid.filas.map(({ medir, ...f }) => f) };
  }
} else decir("── física y fidelidad: el ejemplo no tiene montaje.js (sin equipos del motor A)");

// ── realismo y limpieza: un solo paso de navegador. Tras la carga: `cerradas` sobre la escena viva y la captura de la
// vista inicial (captura-0, solo para limpieza); luego una captura en el punto de vista de cada foto abierta.
const limpieza = {};
const OCULTAR_PLAQUITAS = "document.querySelectorAll('.geo-plaquitas').forEach((e) => (e.style.visibility = 'hidden')); 'plaquitas ocultas'";
const MARCAR = "(window.GEO && GEO.escena && GEO.escena.marcar()), 'marcado'";
const MOSTRAR_PLAQUITAS = "document.querySelectorAll('.geo-plaquitas').forEach((e) => (e.style.visibility = '')); 'plaquitas visibles'";
if (!args.includes("--sin-realismo")) {
  execFileSync(process.execPath, [join(RAIZ, "scripts", "armar.mjs"), dirEj, "--salida", salidaBase, "--borrador", ...(args.includes("--incrustar") ? ["--incrustar"] : [])], { stdio: "inherit" });
  const vista = join(salidaBase, tema, "vista.html");
  const abiertas = (ficha.referencias?.abiertas || []).filter((r) => r.vista);
  const png0 = join(dirJ, "captura-0.png");
  const pasos = [["until", "!document.querySelector('.geo-cargando')", 180000], ["wait", 2500], ["eval", expresionCerradas()],
    // captura limpia de medición: sin las plaquitas HTML (suman ≈ 0,003 al ruido); se vuelven a mostrar al final
    ["eval", OCULTAR_PLAQUITAS], ["eval", MARCAR], ["wait", 300], ["shot", png0, ".geo-lienzo"]];
  const pares = [];
  abiertas.forEach((r, i) => {
    const png = join(dirJ, `captura-${i + 1}.png`);
    pasos.push(["eval", `GEO.igualarVista(${JSON.stringify(r.vista)}); 'ok'`], ["wait", 1200], ["eval", MARCAR], ["wait", 200], ["shot", png, ".geo-lienzo"]);
    // fotos cruzadas: TODAS las otras fotos abiertas de la ficha, con su recorte (realismo v3.1: «discrimina»)
    const cruzadas = (ficha.referencias?.abiertas || []).filter((q) => q !== r && q.archivo).map((q) => ({ foto: q.archivo, recorte: q.recorte || null, titulo: q.titulo }));
    pares.push({ captura: png, foto: r.archivo, titulo: r.titulo, recorteCaptura: r.vista.recorte || null, recorteFoto: r.recorte || null, cruzadas });
  });
  pasos.push(["eval", MOSTRAR_PLAQUITAS]);
  writeFileSync(join(dirJ, "pasos.json"), JSON.stringify(pasos));
  let salidaDrive = "";
  try { salidaDrive = execFileSync(process.execPath, [join(RAIZ, "scripts", "drive.mjs"), vista, "--actions", join(dirJ, "pasos.json"), "--width", "1300", "--height", "1000"], { encoding: "utf8" }); }
  catch (e) { salidaDrive = String(e.stdout || "") + String(e.stderr || ""); }
  const consolaLimpia = esConsolaLimpia(salidaDrive);
  // capturas vacías (fallo pasajero del navegador sin pantalla: lienzo color fondo): se repite SOLO esa vista, con la
  // página recargada, GEO.escena.marcar() y 1500 ms de espera, hasta 2 veces. Si sigue vacía, limpieza falla.
  const vistasJuez = [{ png: png0, titulo: "vista inicial", vista: null }, ...abiertas.map((r, i) => ({ png: join(dirJ, `captura-${i + 1}.png`), titulo: r.titulo, vista: r.vista }))];
  const vaciasDe = (lista) => {
    const hay = lista.filter((c) => existsSync(c.png));
    let info = [];
    if (hay.length) info = JSON.parse(execFileSync("python", ["-I", join(RAIZ, "juez", "limpieza.py"), "--vacias", ...hay.map((c) => c.png)], { encoding: "utf8" }));
    return lista.filter((c) => !existsSync(c.png) || info.find((x) => x.captura === c.png)?.vacia);
  };
  limpieza.reintentos = [];
  try {
    for (let intento = 1; intento <= 2; intento++) {
      const vacias = vaciasDe(vistasJuez);
      if (!vacias.length) break;
      for (const c of vacias) {
        const pr = [["until", "!document.querySelector('.geo-cargando')", 180000], ["wait", 2500], ["eval", OCULTAR_PLAQUITAS],
          ...(c.vista ? [["eval", `GEO.igualarVista(${JSON.stringify(c.vista)}); 'ok'`], ["wait", 1200]] : []),
          ["eval", MARCAR], ["wait", 1500], ["shot", c.png, ".geo-lienzo"]];
        writeFileSync(join(dirJ, "pasos-reintento.json"), JSON.stringify(pr));
        try { execFileSync(process.execPath, [join(RAIZ, "scripts", "drive.mjs"), vista, "--actions", join(dirJ, "pasos-reintento.json"), "--width", "1300", "--height", "1000"], { encoding: "utf8" }); } catch {}
        limpieza.reintentos.push(`${c.titulo} (intento ${intento})`);
      }
    }
    limpieza.vacias = vaciasDe(vistasJuez).map((c) => c.titulo);
  } catch (e) { limpieza.vacias = ["no se pudo revisar (" + String(e.message).split(/\r?\n/)[0] + ")"]; }
  const primera = (e) => String(e.message).split(/\r?\n/)[0];
  try { limpieza.cerradas = leerCerradas(salidaDrive); } catch (e) { limpieza.cerradas = { aprobado: false, error: "no se pudo leer cerradas (" + primera(e) + ")" }; }
  limpieza.consola = consolaLimpia;
  const capturas = [{ captura: png0, titulo: "vista inicial", recorte: null }, ...pares.map((p) => ({ captura: p.captura, titulo: p.titulo, recorte: p.recorteCaptura }))].filter((c) => existsSync(c.captura));
  writeFileSync(join(dirJ, "capturas-limpieza.json"), JSON.stringify(capturas));
  try { limpieza.imagen = capturas.length ? juzgarImagenes(join(dirJ, "capturas-limpieza.json"), join(dirJ, "limpieza.json")) : { error: "no hay capturas" }; }
  catch (e) { limpieza.imagen = { error: "no se pudo medir (" + primera(e) + ")" }; }
  writeFileSync(join(dirJ, "pares.json"), JSON.stringify(pares));
  let rr = { aprobado: false, informativo: false, error: "realismo.py no corrió", filas: [] }; // si no se pudo medir, bloquea
  try {
    const txt = execFileSync("python", ["-I", join(RAIZ, "juez", "realismo.py"), join(dirJ, "pares.json"), join(dirJ, "realismo.json"), join(dirJ, "hoja-realismo.png")], { encoding: "utf8" });
    rr = JSON.parse(readFileSync(join(dirJ, "realismo.json"), "utf8"));
    decir("── " + txt.trim());
  } catch (e) { decir("── realismo: no se pudo medir (" + String(e.message).split("\n")[0] + ")"); }
  const n2 = (v) => (v === null || v === undefined ? "—" : v.toFixed(2));
  for (const f of rr.filas) decir(`${f.ok ? "ok   " : "NO   "} ${f.titulo.padEnd(40)} Δlum ${f.dLum >= 0 ? "+" : ""}${f.dLum.toFixed(2)} · desv ×${f.rDesv.toFixed(2)} · HOG ${n2(f.hog)} / cruzadas ${n2(f.hogCruzadaMediana)} (margen ${f.margenHog >= 0 ? "+" : ""}${n2(f.margenHog)}, pide +0,05) ${f.discrimina ? "discrimina" : "NO discrimina"} · (bordes forma ×${n2(f.rBordes)} · colorido ×${n2(f.rColorido)})`);
  decir(consolaLimpia ? "consola de la página: limpia" : "consola de la página: CON ERRORES\n" + salidaDrive.split("\n").filter((l) => /console|error/i.test(l)).slice(0, 8).join("\n"));
  // regla de bloqueo (references/juez.md): solo bloquean las métricas con AUC ≥ 0,8 y Spearman ≥ 0,5; sin ellas la línea
  // es INFORMATIVA y rr.aprobado = true. La consola limpia bloquea por la línea de limpieza.
  informe.lineas.realismo = { ...rr, aprobado: !!rr.aprobado, consolaLimpia };
}

// ── limpieza (4.º juez): corte de cámara en Node (con la vista inicial que dio la página, si la hubo) y el resto
const camIni = limpieza.cerradas?.camara;
limpieza.corte = await corteDeEjemplo(P?.terreno || null, ficha, camIni?.pos && camIni?.objetivo ? [{ pos: camIni.pos, objetivo: camIni.objetivo, etiqueta: "vista inicial (página)" }] : []);
if (args.includes("--sin-realismo")) { limpieza.soloCorte = true; informe.parcial = true; }
const im = limpieza.imagen;
limpieza.aprobado = limpieza.soloCorte ? limpieza.corte.aprobado
  : !!(limpieza.cerradas?.aprobado && limpieza.corte.aprobado && im && !im.error && im.paleta.aprobado && im.ruido.aprobado && limpieza.consola && !limpieza.vacias?.length);
decir(textoLimpieza(limpieza));
informe.lineas.limpieza = limpieza;

informe.aprobado = Object.values(informe.lineas).every((l) => l.aprobado);
informe.segundos = (Date.now() - t0) / 1000;
writeFileSync(join(dirJ, "informe.json"), JSON.stringify(informe, null, 1));
writeFileSync(join(dirJ, "informe.md"), `# Juez · ${tema}\n\n${informe.aprobado ? (informe.parcial ? "**APROBADO PARCIAL** (sin navegador: armar no lo acepta)" : "**APROBADO**") : "**REPROBADO** (armar no escribirá index.html)"} · sello \`${informe.sello}\` · ${informe.fecha}\n\n\`\`\`\n${informe.textos.join("\n")}\n\`\`\`\n`);
console.log(`\n${informe.aprobado ? (informe.parcial ? "JUEZ: APROBADO PARCIAL (sin navegador; no publica)" : "JUEZ: APROBADO") : "JUEZ: REPROBADO"} · ${join(dirJ, "informe.md")} · ${informe.segundos.toFixed(0)} s`);
process.exit(informe.aprobado ? 0 : 1);
