#!/usr/bin/env node
// Geotechnic · armar: junta el kit y la escena de un ejemplo en una página lista para publicar como Artifact.
//
//   node scripts/armar.mjs ejemplos/<tema> [--salida dist] [--modo completo|blanco] [--foco id] [--incrustar] [--borrador]
//   --incrustar: las fotos abiertas van dentro de index.html (data URI); úsalo si no se pueden publicar archivos sueltos
//   --borrador: solo vista.html y comparar.html (para el juez y para mirar); NO escribe index.html
//
// BLOQUEO DEL JUEZ: sin --borrador, index.html solo se escribe si <salida>/<tema>/juez/informe.json dice «aprobado» y
// su sello coincide con las fuentes actuales (kit, motor A, equipos, ficha, montaje, escena). Si no: sale con código 2.
// Tampoco abre con un informe incompleto: parcial (--sin-realismo) o sin las líneas de realismo y limpieza.
//
// Salida en <salida>/<tema>/:
//   index.html   página sin doctype (el Artifact pone el esqueleto): es la que se publica
//   ref/*.jpg    fotos con licencia abierta (se publican como archivos de apoyo)
//   vista.html   la misma página con doctype, para verificar en Chrome (scripts/drive.mjs)
//   comparar.html  hoja local con TODAS las referencias, también las de tesis: NUNCA se publica
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { kitCodigo, desmodular, selloDe, THREE_VER } from "./codigo.mjs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
const dirEj = resolve(args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1]?.startsWith("--") !== true) || "");
if (!existsSync(join(dirEj, "ficha.mjs"))) { console.error("uso: node scripts/armar.mjs ejemplos/<tema>  (falta ficha.mjs)"); process.exit(1); }

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CSS = `
/* página de estudio: la escena manda; texto sobrio en dos temas */
:root{--letra-titulo:"Archivo",ui-sans-serif,system-ui,sans-serif;--letra-mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;--fondo:#f4f2ee;--tarjeta:#ffffff;--texto:#2a2826;--fuerte:#141312;--tenue:#6d6862;--linea:#dcd7cf;--suave:#ebe7e0;--acento:#c2382c;--azul:#2f64b5;--lienzo:#d9d4cb;color-scheme:light}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--fondo:#151413;--tarjeta:#1e1c1b;--texto:#d8d3cc;--fuerte:#f4f0ea;--tenue:#9a938a;--linea:#3a3633;--suave:#2a2725;--acento:#ec6a5c;--azul:#7aa6e8;--lienzo:#262321;color-scheme:dark}}
:root[data-theme="dark"]{--fondo:#151413;--tarjeta:#1e1c1b;--texto:#d8d3cc;--fuerte:#f4f0ea;--tenue:#9a938a;--linea:#3a3633;--suave:#2a2725;--acento:#ec6a5c;--azul:#7aa6e8;--lienzo:#262321;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--fondo);color:var(--texto);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.geo{max-width:1120px;margin:0 auto;padding-block:32px 72px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:grid;gap:18px}
.geo>*{min-width:0}
.geo-cab{display:grid;gap:6px}
.geo-cab .ceja{font:600 11px/1.2 var(--letra-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--tenue)}
.geo-cab h1{margin:0;font-family:var(--letra-titulo);font-stretch:85%;font-size:clamp(26px,4.4vw,38px);line-height:1.1;color:var(--fuerte);font-weight:750;text-wrap:balance}
.geo-cab p{margin:0;max-width:72ch}
.geo-barra{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.geo-barra button,.geo-btn{font:500 13px/1 ui-sans-serif,system-ui,sans-serif;padding:8px 12px;border-radius:7px;border:1px solid var(--linea);background:var(--tarjeta);color:var(--fuerte);cursor:pointer}
.geo-barra button[aria-pressed="true"]{background:var(--fuerte);color:var(--tarjeta);border-color:var(--fuerte)}
button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--azul);outline-offset:2px}
.geo-tarjeta{background:var(--tarjeta);border:1px solid var(--linea);border-radius:12px;overflow:hidden}
.geo-lienzo{position:relative;aspect-ratio:16/10;min-height:340px;background:var(--lienzo);touch-action:none}
@media (max-width:640px){.geo-lienzo{aspect-ratio:4/5}}
.geo-lienzo canvas{position:absolute;inset:0}
.geo-cargando{position:absolute;inset:0;display:grid;place-items:center;color:var(--tenue);font-size:14px;pointer-events:none}
.geo-plaquitas{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.geo-tag{position:absolute;left:0;top:0;pointer-events:auto;display:flex;align-items:center;gap:6px;margin:-11px 0 0 -11px;padding:0;height:22px;border-radius:11px;border:1px solid rgba(0,0,0,.35);background:rgba(250,248,244,.92);color:#141312;font:600 12px/1 ui-sans-serif,system-ui,sans-serif;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.25);white-space:nowrap}
.geo-tag .n{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#141312;color:#faf8f4;font:700 11px/1 ui-monospace,monospace}
.geo-tag .t{max-width:0;overflow:hidden;transition:max-width .25s ease}
.geo-tag:hover,.geo-tag:focus-visible,.geo-tag.activa{padding-right:9px;z-index:2}
.geo-tag:hover .t,.geo-tag:focus-visible .t,.geo-tag.activa .t{max-width:240px}
.geo-tag.foco .n{background:#c2382c}
.geo-plaquitas[data-modo="blanco"] .geo-tag{padding:0}
.geo-plaquitas[data-modo="blanco"] .geo-tag .t{display:none}
.geo-pie{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:10px 14px;border-top:1px solid var(--linea);font-size:13px;color:var(--tenue)}
.geo-lectura{margin:0;color:var(--fuerte);font-variant-numeric:tabular-nums}
.geo-controles{display:grid;gap:8px;padding:12px 14px;border-top:1px solid var(--linea)}
.geo-control{display:grid;grid-template-columns:minmax(120px,auto) minmax(0,1fr) auto;gap:12px;align-items:center;font-size:13px;color:var(--tenue)}
.geo-control input[type=range]{width:100%;accent-color:var(--fuerte)}
.geo-control output{color:var(--fuerte);font-variant-numeric:tabular-nums;min-width:8ch;text-align:right}
.geo-seccion{display:grid;gap:10px}
.geo-seccion h2{margin:6px 0 0;font-family:var(--letra-titulo);font-stretch:90%;font-size:19px;color:var(--fuerte);text-wrap:balance}
.geo-piezas{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px;margin:0;padding:0;list-style:none}
.geo-piezas li{display:grid;grid-template-columns:26px minmax(0,1fr);gap:10px;padding:10px 12px;border:1px solid var(--linea);border-radius:9px;background:var(--tarjeta)}
.geo-piezas li.activa{border-color:var(--acento)}
.geo-piezas .n{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:var(--fuerte);color:var(--tarjeta);font:700 11px/1 ui-monospace,monospace}
.geo-piezas b{color:var(--fuerte);font-weight:620}
.geo-piezas small{display:block;color:var(--tenue);font-size:13px;line-height:1.45}
.geo-quiz{display:none;gap:8px}
.en-blanco .geo-quiz{display:grid}
.en-blanco .geo-piezas,.en-blanco .geo-solo-completo{display:none}
.geo-quiz label{display:grid;grid-template-columns:26px minmax(0,1fr);gap:10px;align-items:center;font-size:13px}
.geo-quiz select{font:inherit;padding:6px 8px;border-radius:6px;border:1px solid var(--linea);background:var(--tarjeta);color:var(--fuerte);width:100%;min-width:0}
.geo-res{color:var(--fuerte)}
.geo-comparar{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:10px}
.geo-panel{position:relative;background:var(--lienzo);border-radius:10px;overflow:hidden;aspect-ratio:4/3;display:grid;place-items:center}
.geo-panel img{width:100%;height:100%;object-fit:cover;display:block}
.geo-panel .vacio{color:var(--tenue);font-size:13px;padding:16px;text-align:center}
.geo-pies{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:10px;font-size:12.5px;color:var(--tenue)}
.geo-miniaturas{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}
.geo-miniaturas button{flex:0 0 auto;width:132px;padding:0;border:2px solid transparent;border-radius:8px;overflow:hidden;background:none;cursor:pointer}
.geo-miniaturas button[aria-pressed="true"]{border-color:var(--acento)}
.geo-miniaturas img{width:100%;height:88px;object-fit:cover;display:block}
.geo-tabla{width:100%;border-collapse:collapse;font-size:13px}
.geo-tabla th,.geo-tabla td{text-align:left;padding:7px 8px;border-bottom:1px solid var(--linea);vertical-align:top}
.geo-tabla th{color:var(--tenue);font-weight:600}
.geo-tabla td:nth-child(2){color:var(--fuerte);font-variant-numeric:tabular-nums;white-space:nowrap}
.geo-estudio{margin:0;padding-left:18px;font-size:13px;color:var(--tenue)}
.geo-estudio li{margin:3px 0}
code{font:12px ui-monospace,monospace;background:var(--suave);padding:1px 5px;border-radius:4px}
a{color:var(--azul)}
@media (prefers-reduced-motion:reduce){.geo-tag .t{transition:none}}
`;

// Corre en la página: modos, cuestionario y comparación lado a lado.
const PAGINA_JS = `
const raiz = document.querySelector(".geo");
const ficha = window.GEO_FICHA;
let modoActual = ficha.modo;
function ponerModo(m){ modoActual = m; raiz.classList.toggle("en-blanco", m === "blanco");
  for (const b of document.querySelectorAll("[data-modo]")) b.setAttribute("aria-pressed", String(b.dataset.modo === m));
  window.GEO?.senal?.ponerModo(m); document.dispatchEvent(new CustomEvent("geo:modo", { detail: m })); }
for (const b of document.querySelectorAll("[data-modo]")) b.addEventListener("click", () => ponerModo(b.dataset.modo));
const corregir = document.querySelector("[data-corregir]");
if (corregir) corregir.addEventListener("click", () => {
  const sel = [...document.querySelectorAll(".geo-quiz select")]; let bien = 0; const malas = [];
  for (const s of sel) { if (s.value === s.dataset.correcta) bien++; else malas.push(s.dataset.correcta); }
  document.querySelector(".geo-res").textContent = bien >= Math.ceil(sel.length * 0.8) ? "Aprobada: " + bien + " de " + sel.length + "." : bien + " de " + sel.length + ". Repasa: " + malas.join(", ") + ".";
});
// comparar
const foto = document.querySelector("[data-foto]"), pieFoto = document.querySelector("[data-pie-foto]");
const modelo = document.querySelector("[data-modelo]"), pieModelo = document.querySelector("[data-pie-modelo]");
function elegir(i, mover = true){ const r = ficha.abiertas[i]; if (!r) return;
  for (const b of document.querySelectorAll("[data-ref]")) b.setAttribute("aria-pressed", String(+b.dataset.ref === i));
  foto.innerHTML = '<img alt="' + r.alt + '" src="' + r.src + '">';
  pieFoto.innerHTML = r.pie;
  if (mover && r.vista && window.GEO?.igualarVista) { window.GEO.igualarVista(r.vista); setTimeout(capturar, 350); }
}
function capturar(){ const c = document.querySelector(".geo-lienzo canvas"); if (!c || !window.GEO) return;
  window.GEO.escena.renderizar(); modelo.innerHTML = '<img alt="Vista del modelo" src="' + c.toDataURL("image/jpeg", 0.88) + '">';
  pieModelo.textContent = "Modelo Geotechnic, vista actual (usa «Capturar» después de girar la cámara)."; }
for (const b of document.querySelectorAll("[data-ref]")) b.addEventListener("click", () => elegir(+b.dataset.ref));
document.querySelector("[data-capturar]")?.addEventListener("click", capturar);
document.addEventListener("geo:listo", () => { elegir(0, false); setTimeout(capturar, 600); }, { once: true });
ponerModo(modoActual);
`;

/** Resumen del informe del juez para la página (solo si aprobó y su sello coincide). */
function juezHtml(inf) {
  const L = inf.lineas, filas = [];
  for (const [n, l] of Object.entries(L)) {
    if (n.startsWith("fisica")) filas.push(`<tr><td>Física · ${n === "fisicaRango" ? "rango del modelo" : "ciclo en la labor"}</td><td>${l.poses} poses</td><td>${Object.entries(l.lineas).map(([k, v]) => `${k} ${v.ok ? "✓" : "✗"}`).join(" · ")}</td></tr>`);
    else if (n.startsWith("fidelidad")) filas.push(`<tr><td>Fidelidad · ${esc(n.slice(10))}</td><td>${l.filas.filter((f) => f.fuente).length} con fuente</td><td>${l.filas.filter((f) => f.fuente).map((f) => `${esc(f.dato)} ${f.medido === null ? "—" : (f.error >= 0 ? "+" : "") + (f.error * 100).toFixed(1) + " %"}`).join(" · ")}</td></tr>`);
    else if (n === "realismo") filas.push(l.informativo
      ? `<tr><td>Realismo: informativo (v3.1)</td><td>${l.pares} fotos</td><td>Se mide y no bloquea: ninguna métrica distingue bien la foto correcta de las otras del tema (AUC correcto/cruzado ${Object.entries(l.metricas || {}).map(([k, m]) => `${esc(k)} ${m.auc == null ? "—" : m.auc.toFixed(2)}`).join(" · ")}; hace falta ≥ 0,8 y acuerdo con el usuario). Por la regla completa pasarían ${l.pasan} de ${l.pares}.</td></tr>`
      : `<tr><td>Realismo (v3.1)</td><td>${l.pares} fotos</td><td>bloquea con ${(l.bloqueantes || []).map(esc).join(", ")} (AUC ≥ 0,8 y Spearman ≥ 0,5)</td></tr>`);
    else if (n === "limpieza") filas.push(`<tr><td>Limpieza</td><td>${l.cerradas?.mallas ?? 0} mallas · ${l.corte?.camaras ?? 0} cámaras · ${l.imagen?.filas?.length ?? 0} capturas</td><td>mallas cerradas y orientadas${l.cerradas?.calcos?.length ? ` (${l.cerradas.calcos.length} calcos declarados)` : ""} · corte de cámara ${l.corte?.noAplica ? "no aplica" : "con tapa"} · paleta papel (saturación p90 ≤ ${l.imagen?.topes?.saturacion}) · ruido ≤ ${l.imagen?.topes?.ruido} · consola ${l.consola ? "limpia" : "con errores"}</td></tr>`);
  }
  return `<section class="geo-seccion geo-solo-completo"><h2>Lo que probó el juez</h2><p style="margin:0;max-width:72ch">Aprobado el ${esc(inf.fecha.slice(0, 10))} · sello <code>${esc(inf.sello)}</code>. Sin esta aprobación la página no se arma.</p>
<div style="overflow-x:auto"><table class="geo-tabla"><thead><tr><th>Línea</th><th>Alcance</th><th>Resultado</th></tr></thead><tbody>${filas.join("")}</tbody></table></div></section>`;
}

function controlesHtml(ctrls = []) {
  return ctrls.map((c) => c.html ? c.html : `<label class="geo-control" for="${c.id}"><span>${esc(c.etiqueta)}</span><input type="range" id="${c.id}" min="${c.min}" max="${c.max}" step="${c.paso ?? 1}" value="${c.valor}"><output for="${c.id}">${esc(c.salida ?? c.valor)}</output></label>`).join("");
}

async function main() {
  const tema = basename(dirEj);
  const ficha = (await import(pathToFileURL(join(dirEj, "ficha.mjs")).href)).default;
  const salida = resolve(opt("salida", join(RAIZ, "dist")), tema);
  mkdirSync(join(salida, "ref"), { recursive: true });
  const modo = opt("modo", ficha.modo || "completo");
  const foco = opt("foco", ficha.foco ?? null);
  // fotos abiertas → ref/
  const abiertas = (ficha.referencias?.abiertas || []).map((r, i) => {
    const nombre = `ref/${String(i + 1).padStart(2, "0")}-${basename(r.archivo)}`;
    copyFileSync(r.archivo, join(salida, nombre));
    // --incrustar: la foto va dentro de la página (data URI), reducida a 1100 px si hay Python con Pillow
    let src = nombre;
    if (args.includes("--incrustar")) {
      let datos;
      try { datos = execFileSync("python", ["-I", "-c", "import sys,io;from PIL import Image;im=Image.open(sys.argv[1]).convert('RGB');im.thumbnail((1100,1100));b=io.BytesIO();im.save(b,'JPEG',quality=80);sys.stdout.buffer.write(b.getvalue())", r.archivo], { maxBuffer: 1 << 26 }); }
      catch { datos = readFileSync(r.archivo); }
      src = "data:image/jpeg;base64," + Buffer.from(datos).toString("base64");
    }
    const pie = `${esc(r.titulo)} · ${esc(r.autor)} · <a href="${esc(r.licenciaUrl)}" target="_blank" rel="noopener">${esc(r.licencia)}</a> · <a href="${esc(r.pagina)}" target="_blank" rel="noopener">Wikimedia Commons</a> · el catálogo de fuentes <code>${esc(r.clave)}</code>`;
    return { src, alt: r.titulo, pie, vista: r.vista || null, archivo: r.archivo };
  });
  const piezas = ficha.piezas || [];
  const nombres = [...piezas.map((p) => p.nombre)].sort((a, b) => a.localeCompare(b, "es"));
  const lista = piezas.map((p) => `<li data-pieza-li="${p.id}"><span class="n">${p.numero}</span><div><b>${esc(p.nombre)}</b><small>${esc(p.definicion)}</small></div></li>`).join("");
  const quiz = piezas.map((p) => `<label for="q-${p.id}"><span class="n">${p.numero}</span><select id="q-${p.id}" data-correcta="${esc(p.nombre)}"><option value="">—</option>${nombres.map((n) => `<option>${esc(n)}</option>`).join("")}</select></label>`).join("");
  const fuentes = (ficha.fuentes || []).map((f) => `<tr><td>${esc(f.dato)}</td><td>${esc(f.valor)}</td><td>${f.fuente}</td></tr>`).join("");
  const estudio = (ficha.referencias?.estudio || []).map((r) => `<li>${esc(r.titulo)} — ${esc(r.leyenda)} (pág. ${r.pagina}) · el catálogo de fuentes <code>${esc(r.clave)}</code></li>`).join("");
  const modos = (ficha.modos || ["completo", "blanco"]).map((m) => `<button type="button" data-modo="${m}" aria-pressed="${m === modo}">${m === "blanco" ? "En blanco" : m[0].toUpperCase() + m.slice(1)}</button>`).join("");
  const miniaturas = abiertas.map((r, i) => `<button type="button" data-ref="${i}" aria-pressed="${i === 0}" title="${esc(r.alt)}"><img src="${r.src}" alt="${esc(r.alt)}" loading="lazy"></button>`).join("");
  const equipos = ficha.equipos || [];
  const montajeSrc = existsSync(join(dirEj, "montaje.js")) ? desmodular(readFileSync(join(dirEj, "montaje.js"), "utf8")) : "";
  const escenaSrc = desmodular(readFileSync(join(dirEj, "escena.js"), "utf8"));
  const borrador = args.includes("--borrador");
  const sello = selloDe(dirEj, equipos);
  const fInf = join(salida, "juez", "informe.json");
  const inf = existsSync(fInf) ? JSON.parse(readFileSync(fInf, "utf8")) : null;
  if (!borrador) {
    // un informe parcial (--sin-realismo) o sin las líneas de realismo y limpieza no abre la publicación. El realismo
    // puede ser informativo (no bloquea), pero la línea tiene que existir: prueba que el juez corrió el navegador
    const incompleto = inf && (inf.parcial || !inf.lineas?.limpieza || !inf.lineas?.realismo);
    if (!inf || !inf.aprobado || incompleto || inf.sello !== sello) {
      console.error(`BLOQUEADO por el juez: ${!inf ? "no hay informe" : !inf.aprobado ? "el informe reprueba" : incompleto ? "el informe está incompleto (sin navegador: faltan las líneas de realismo o limpieza)" : "las fuentes cambiaron desde el informe"} (${fInf}).`);
      console.error(`Corre: node scripts/juez.mjs ${args.find((a) => !a.startsWith("--"))} --salida ${opt("salida", join(RAIZ, "dist"))}`);
      process.exit(2);
    }
  }
  const datosFicha = { modo, foco, abiertas: abiertas.map(({ archivo, ...r }) => r), piezas: piezas.map(({ id, numero, nombre }) => ({ id, numero, nombre })) };
  const cuerpo = `<title>${esc(ficha.titulo)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..100,500..800&family=IBM+Plex+Mono:wght@400;600&display=swap">
<style>${CSS}${ficha.css || ""}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@${THREE_VER}/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@${THREE_VER}/examples/jsm/"}}</script>
<main class="geo">
<header class="geo-cab"><span class="ceja">${esc(ficha.ceja)}</span><h1>${esc(ficha.titulo)}</h1><p>${ficha.resumen}</p></header>
<div class="geo-barra" role="group" aria-label="Modo">${modos}${ficha.barra || ""}</div>
<section class="geo-tarjeta">
<div class="geo-lienzo" id="lienzo" role="img" aria-label="${esc(ficha.alt || ficha.titulo)}"><div class="geo-cargando">Armando la escena…</div></div>
${ficha.controles?.length ? `<div class="geo-controles">${controlesHtml(ficha.controles)}</div>` : ""}
<div class="geo-pie"><p class="geo-lectura" data-lectura>${esc(ficha.lecturaInicial || "")}</p><span>${esc(ficha.pista || "Arrastra para girar · rueda para acercar")}</span></div>
</section>
<section class="geo-seccion"><h2>Piezas</h2>
<ul class="geo-piezas">${lista}</ul>
<div class="geo-quiz"><b>Rotula cada número</b>${quiz}<div class="geo-barra"><button type="button" data-corregir>Corregir</button></div><div class="geo-res" aria-live="polite"></div></div>
</section>
${ficha.extra || ""}
${inf && inf.aprobado && inf.sello === sello ? juezHtml(inf) : ""}
<section class="geo-seccion"><h2>Comparar con fotos reales</h2>
<p style="margin:0;max-width:72ch">Elige una foto: la cámara del modelo se acerca a un punto de vista parecido y se captura al lado. Las fotos tienen licencia abierta y están registradas en el catálogo de fuentes.</p>
<div class="geo-miniaturas">${miniaturas}</div>
<div class="geo-comparar"><div class="geo-panel" data-foto><span class="vacio">Foto</span></div><div class="geo-panel" data-modelo><span class="vacio">Modelo</span></div></div>
<div class="geo-pies"><div data-pie-foto></div><div><span data-pie-modelo></span> <button type="button" class="geo-btn" data-capturar>Capturar</button></div></div>
${estudio ? `<details class="geo-solo-completo"><summary>Referencias de estudio (tesis; no se incrustan)</summary><ul class="geo-estudio">${estudio}</ul></details>` : ""}
</section>
<section class="geo-seccion geo-solo-completo"><h2>La verdad primero: de dónde sale cada número</h2>
<div style="overflow-x:auto"><table class="geo-tabla"><thead><tr><th>Dato</th><th>Valor</th><th>Fuente</th></tr></thead><tbody>${fuentes}</tbody></table></div>
</section>
</main>
<script>window.GEO_FICHA = ${JSON.stringify(datosFicha)};</script>
<script type="module">
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
${PAGINA_JS}
${kitCodigo(equipos)}
// ── montaje del ejemplo (lo mismo que juzga el juez) ──
${montajeSrc}
// ── escena del ejemplo ──
${escenaSrc}
const contenedor = document.getElementById("lienzo");
try {
  await montar({ contenedor, modo: ${JSON.stringify(modo)}, foco: ${JSON.stringify(foco)}, lectura: (t) => { document.querySelector("[data-lectura]").textContent = t; } });
  contenedor.querySelector(".geo-cargando")?.remove();
  window.GEO?.senal?.ponerModo(modoActual);
  document.dispatchEvent(new Event("geo:listo"));
} catch (e) {
  console.error(e);
  contenedor.querySelector(".geo-cargando").textContent = "No se pudo iniciar WebGL en este navegador: " + e.message;
}
</script>`.replace(/<\/script>(?=[\s\S]*<\/script>)/g, (m, off, all) => m); // (las etiquetas internas ya están bien formadas)
  if (!borrador) writeFileSync(join(salida, "index.html"), cuerpo);
  writeFileSync(join(salida, "vista.html"), `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>body{margin:0}</style></head><body>\n${cuerpo}\n</body></html>`);
  // hoja local de comparación con referencias de estudio (no se publica)
  const est = (ficha.referencias?.estudio || []).filter((r) => r.archivo && existsSync(r.archivo));
  const tarj = [...abiertas.map((r) => `<figure><img src="${r.src}"><figcaption>${r.pie}</figcaption></figure>`),
    ...est.map((r) => `<figure><img src="${pathToFileURL(r.archivo).href}"><figcaption>${esc(r.titulo)} — ${esc(r.leyenda)} (pág. ${r.pagina}) · ${esc(r.clave)} · <b>solo estudio</b></figcaption></figure>`)].join("");
  writeFileSync(join(salida, "comparar.html"), `<!doctype html><meta charset="utf-8"><title>Comparar ${tema}</title><style>body{font:13px system-ui;margin:16px;background:#eee}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:12px}figure{margin:0;background:#fff;padding:8px}img{width:100%}</style><h1>${esc(ficha.titulo)} · referencias (local)</h1><main>${tarj}</main>`);
  console.log(`${borrador ? "borrador" : "listo"}: ${join(salida, borrador ? "vista.html" : "index.html")} (${(cuerpo.length / 1024).toFixed(0)} KB) · ${abiertas.length} fotos abiertas · ${est.length} de estudio · sello ${sello}`);
}
await main();
