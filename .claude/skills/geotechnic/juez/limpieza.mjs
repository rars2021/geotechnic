// Geotechnic · juez · limpieza (4.º juez): que el dibujo se vea limpio para estudiar y sin defectos de modelado.
// Pedido del usuario: «que se vea limpio, para estudio» (references/estudio.md). Sublíneas:
//   cerradas  toda Mesh visible de la escena viva es cerrada y orientada (salvo calcos declarados con userData.calco).
//             Corre en la página (se pasa como texto a la acción `eval` de scripts/drive.mjs) y en Node (plantas).
//   corte     planoCorte de kit/estudio.js: si el segmento cámara→objetivo toca roca hay plano, del plano al objetivo
//             todo es aire y el objetivo queda del lado que se ve; si es todo aire no hay plano. En Node, sobre el terreno.
//   paleta    saturación HSV p90 de la zona del equipo ≤ 0,45 (juez/limpieza.py).
//   ruido     |Laplaciano| medio de la captura entera ≤ 0,7 × la mediana v2 (juez/limpieza.py).
//   consola   la página no escribe errores ni avisos.
// Cada sublínea tiene su planta en `plantas()` (node scripts/juez.mjs --plantas).
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const TOLERANCIAS_LIMPIEZA = {
  soldadura: 1e-5,     // m: vértices a menos de esto son el mismo (coordenadas locales de la geometría)
  margenCorte: 0.35,   // m: el plano va 0,35 m pasado el último tramo de roca antes del objetivo (ronda 3)
  sondaCorte: 0.02,    // m: el segmento plano + 2 cm → objetivo se muestrea cada 2 cm y debe ser todo aire
  exteriores: { az: [45, 135, 225, 315], el: 24, dist: [10, 14], objetivos: 8 }, // vistas 3/4 desde fuera del bloque
  camarasOrbita: 240,  // cámaras al azar (≥ 200) alrededor de objetivos dentro de la labor
  distancias: [1.5, 18], elevaciones: [-10, 60], semilla: 7,
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// cerradas · AUTOCONTENIDA: no usa nada de fuera (se manda a la página con toString). Sirve para cualquier árbol de
// three (Scene, Group, Mesh). Por geometría: suelda vértices por posición, ignora triángulos degenerados y cuenta
// cada arista no dirigida: abierta (1 triángulo), no-variedad (> 2), mal orientada (2 triángulos en el mismo sentido).
// Con la malla cerrada, el volumen con signo < 0 dice que las caras delanteras miran adentro («al revés»; no se pide a
// materiales BackSide, que se ven desde adentro, como el domo del cielo).
export function revisarCerradas(raiz, op) {
  const tol = (op && op.tol) || 1e-5, inv = 1 / tol, t0 = Date.now();
  const porGeo = new Map(), fallas = new Map(), calcos = new Map();
  let mallas = 0, triangulos = 0, geometrias = 0;
  const nombreDe = (o) => {
    const p = [];
    for (let x = o; x && p.length < 2; x = x.parent) if (x.name && !x.isScene) p.unshift(x.name);
    return p.join("/") || "(sin nombre)";
  };
  const calcoDe = (o) => { for (let x = o; x; x = x.parent) if (x.userData && x.userData.calco) return String(x.userData.calco); return null; };
  const invisible = (m) => (Array.isArray(m) ? m.every((x) => x && x.visible === false) : m && m.visible === false);

  function analizar(g) {
    const pos = g.attributes && g.attributes.position;
    if (!pos) return null;
    const n = pos.count, plano = !pos.isInterleavedBufferAttribute && pos.itemSize === 3 ? pos.array : null;
    const X = (i) => (plano ? plano[3 * i] : pos.getX(i)), Y = (i) => (plano ? plano[3 * i + 1] : pos.getY(i)), Z = (i) => (plano ? plano[3 * i + 2] : pos.getZ(i));
    // soldar: celdas de 1e-5 m con hash numérico y cadena de colisiones
    const ids = new Int32Array(n), rq = new Int32Array(3 * n), sig = new Int32Array(n), tabla = new Map();
    let nv = 0;
    for (let i = 0; i < n; i++) {
      const qx = Math.round(X(i) * inv), qy = Math.round(Y(i) * inv), qz = Math.round(Z(i) * inv);
      const h = Math.imul(qx, 73856093) ^ Math.imul(qy, 19349663) ^ Math.imul(qz, 83492791);
      const cab = tabla.get(h);
      let id = -1;
      for (let k = cab === undefined ? -1 : cab; k >= 0; k = sig[k]) if (rq[3 * k] === qx && rq[3 * k + 1] === qy && rq[3 * k + 2] === qz) { id = k; break; }
      if (id < 0) { id = nv++; rq[3 * id] = qx; rq[3 * id + 1] = qy; rq[3 * id + 2] = qz; sig[id] = cab === undefined ? -1 : cab; tabla.set(h, id); }
      ids[i] = id;
    }
    const idx = g.index ? g.index.array : null;
    const total = idx ? idx.length : n;
    const ini = Math.max(0, (g.drawRange && g.drawRange.start) || 0);
    const fin = Math.min(total, ini + ((g.drawRange && Number.isFinite(g.drawRange.count)) ? g.drawRange.count : total));
    const nt = Math.floor((fin - ini) / 3);
    // aristas dirigidas codificadas: (min·nv + max)·2 + (1 si va de max a min); ordenadas, se cuentan por grupos
    const ar = new Float64Array(3 * nt);
    let m = 0, vol = 0, degenerados = 0;
    const clave = (u, v) => (u < v ? (u * nv + v) * 2 : (v * nv + u) * 2 + 1);
    for (let t = 0; t < nt; t++) {
      const j = ini + 3 * t;
      const i0 = idx ? idx[j] : j, i1 = idx ? idx[j + 1] : j + 1, i2 = idx ? idx[j + 2] : j + 2;
      const a = ids[i0], b = ids[i1], c = ids[i2];
      if (a === b || b === c || a === c) { degenerados++; continue; }
      ar[m++] = clave(a, b); ar[m++] = clave(b, c); ar[m++] = clave(c, a);
      const ax = X(i0), ay = Y(i0), az = Z(i0), bx = X(i1), by = Y(i1), bz = Z(i1), cx = X(i2), cy = Y(i2), cz = Z(i2);
      vol += ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx);
    }
    const e = ar.subarray(0, m).sort();
    let abiertas = 0, noVariedad = 0, malOrientadas = 0;
    for (let i = 0; i < m;) {
      const base = Math.floor(e[i] / 2);
      let f = 0, r = 0, j = i;
      while (j < m && Math.floor(e[j] / 2) === base) { if (e[j] % 2) r++; else f++; j++; }
      const k = f + r;
      if (k === 1) abiertas++;
      else if (k > 2) noVariedad++;
      else if (f !== 1) malOrientadas++;
      i = j;
    }
    return { triangulos: nt, degenerados, vertices: nv, abiertas, noVariedad, malOrientadas, volumen: vol / 6 };
  }

  raiz.traverseVisible((o) => {
    if (!o.isMesh || !o.geometry || invisible(o.material)) return;
    const nombre = nombreDe(o);
    const calco = calcoDe(o);
    if (calco) { const k = nombre + "|" + calco; const c = calcos.get(k) || { nombre, motivo: calco, veces: 0 }; c.veces++; calcos.set(k, c); return; }
    mallas++;
    let r = porGeo.get(o.geometry);
    if (r === undefined) { r = analizar(o.geometry); porGeo.set(o.geometry, r); geometrias++; }
    if (!r) return;
    triangulos += r.triangulos * (o.isInstancedMesh ? o.count : 1);
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const deAdentro = mats.every((x) => x && x.side === 1); // THREE.BackSide
    const alReves = !r.abiertas && !r.noVariedad && !r.malOrientadas && !deAdentro && r.volumen < -1e-12;
    if (r.abiertas || r.noVariedad || r.malOrientadas || alReves) {
      const k = nombre + "|" + (o.geometry.uuid || "");
      const w = o.matrixWorld && o.matrixWorld.elements, m0 = mats[0] || {};
      const donde = w ? [w[12], w[13], w[14]].map((v) => Math.round(v * 100) / 100) : null;
      const material = m0.name || (m0.color && m0.color.getHexString ? "#" + m0.color.getHexString() : m0.type || "");
      const f = fallas.get(k) || { nombre, tipo: o.geometry.type, triangulos: r.triangulos, abiertas: r.abiertas, noVariedad: r.noVariedad, malOrientadas: r.malOrientadas, alReves, donde, material, veces: 0 };
      f.veces++; fallas.set(k, f);
    }
  });
  const lista = [...fallas.values()].sort((a, b) => b.abiertas + b.noVariedad + b.malOrientadas - (a.abiertas + a.noVariedad + a.malOrientadas));
  return { aprobado: lista.length === 0, mallas, geometrias, triangulos, calcos: [...calcos.values()], fallas: lista, ms: Date.now() - t0 };
}

/** Expresión para la acción `eval` de drive.mjs: revisa GEO.escena.scene y agrega la cámara (para `corte`). */
export function expresionCerradas() {
  return `(() => { const E = (window.GEO && window.GEO.escena) || (window.__geo && window.__geo.escena);
  if (!E || !E.scene) return { __limpieza: { error: "la página no expone GEO.escena.scene" } };
  let r;
  try { r = (${revisarCerradas.toString()})(E.scene, { tol: ${TOLERANCIAS_LIMPIEZA.soldadura} }); }
  catch (e) { return { __limpieza: { error: "cerradas lanzó en la página: " + String(e && e.message) } }; }
  r.camara = { pos: E.camera.position.toArray(), objetivo: E.controls && E.controls.target ? E.controls.target.toArray() : null };
  return { __limpieza: r }; })()`;
}

/** Saca el resultado de `cerradas` de la salida de drive.mjs (línea «eval: {"__limpieza": …}»). */
export function leerCerradas(salidaDrive) {
  const l = salidaDrive.split(/\r?\n/).find((x) => x.startsWith('eval: {"__limpieza"'));
  if (!l) return { aprobado: false, error: "la página no devolvió el resultado de cerradas" };
  const r = JSON.parse(l.slice(6)).__limpieza;
  return r.error ? { aprobado: false, ...r } : r;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// corte (Node)
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const mas = (a, b, s) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
function azar(semilla) { let s = semilla >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** Cámara de `esc.mirar(objetivo, az, el, dist)` (kit/escena.js). */
export function camaraDe(v) {
  const a = (v.az * Math.PI) / 180, e = (v.el * Math.PI) / 180, o = v.objetivo;
  return { pos: [o[0] + Math.sin(a) * Math.cos(e) * v.dist, o[1] + Math.sin(e) * v.dist, o[2] - Math.cos(a) * Math.cos(e) * v.dist], objetivo: o };
}

/** Caja de la labor: de la galería del terreno (inicio, largo y contorno) o la que se pase. */
export function regionLabor(terreno) {
  const g = terreno.gal;
  if (!g || !terreno.contorno) return null;
  const min = [g.inicio, Infinity, Infinity], max = [g.inicio + g.largo, -Infinity, -Infinity];
  for (let k = 0; k <= 20; k++) for (const [z, y] of terreno.contorno(g.inicio + (g.largo * k) / 20)) {
    min[1] = Math.min(min[1], y); max[1] = Math.max(max[1], y); min[2] = Math.min(min[2], z); max[2] = Math.max(max[2], z);
  }
  return { min, max };
}

/** Cámaras a probar: vistas de la ficha, la inicial (si se conoce) y una órbita al azar con semilla fija. */
export function camarasCorte(terreno, { vistas = [], extra = [], region = regionLabor(terreno), n = TOLERANCIAS_LIMPIEZA.camarasOrbita, semilla = TOLERANCIAS_LIMPIEZA.semilla } = {}) {
  const cams = vistas.filter((v) => v && v.objetivo && v.dist !== undefined).map((v, i) => ({ ...camaraDe(v), etiqueta: `vista ${i + 1}` }));
  cams.push(...extra);
  if (region) {
    const R = azar(semilla), T = TOLERANCIAS_LIMPIEZA;
    const lerp = (a, b, u) => a + (b - a) * u;
    const objetivo = () => { for (let i = 0; i < 2000; i++) { const o = [0, 1, 2].map((k) => lerp(region.min[k], region.max[k], R())); if (terreno.libre(o) >= 0.4) return o; } return null; };
    for (let k = 0; k < n; k++) { // órbita: objetivo dentro de la labor y lejos de la roca; cámara en roca, en la labor o fuera del bloque
      const o = objetivo(); if (!o) break;
      const v = { objetivo: o, az: 360 * R(), el: lerp(T.elevaciones[0], T.elevaciones[1], R()), dist: lerp(T.distancias[0], T.distancias[1], R()) };
      cams.push({ ...camaraDe(v), etiqueta: `órbita ${k + 1} (az ${v.az.toFixed(0)}°, el ${v.el.toFixed(0)}°, ${v.dist.toFixed(1)} m)` });
    }
    const X = T.exteriores; // vistas 3/4 de estudio, desde fuera del bloque: la roca de en medio se corta
    for (let k = 0; k < X.objetivos; k++) {
      const o = objetivo(); if (!o) break;
      for (const az of X.az) for (const dist of X.dist) cams.push({ ...camaraDe({ objetivo: o, az, el: X.el, dist }), etiqueta: `3/4 ${k + 1} (az ${az}°, el ${X.el}°, ${dist} m)` });
    }
  }
  return cams;
}

/** Muestras del segmento a→b cada `paso` m (incluye b). */
function muestras(a, b, paso) {
  const d = sub(b, a), L = Math.hypot(...d), n = Math.max(1, Math.ceil(L / paso)), out = [];
  for (let i = 0; i <= n; i++) out.push(mas(a, d, i / n));
  return out;
}

/** Juzga planoCorte(terreno, camPos, camDir, { objetivo, margen }) en cada cámara (regla de la ronda 3: se corta TODA
 *  la roca entre la cámara y el objetivo). Si el segmento cámara→objetivo toca roca (muestreado cada 2 cm): hay plano,
 *  normal·mirada ≥ 0,999, el segmento plano + 2 cm → objetivo es todo aire y el objetivo queda más allá del plano.
 *  Si es todo aire: null. */
export function juzgarCorte(terreno, planoCorte, camaras) {
  const T = TOLERANCIAS_LIMPIEZA, fallas = [];
  let enRoca = 0, fuera = 0, conRoca = 0;
  for (const c of camaras) {
    const dir = unit(sub(c.objetivo, c.pos));
    const Lc = terreno.libre(c.pos), Lo = terreno.libre(c.objetivo);
    if (Lc < 0) enRoca++; else fuera++;
    if (!(Lo >= 0)) { fallas.push({ ...c, motivo: `el objetivo está dentro de la roca (libre ${Lo.toFixed(2)} m)` }); continue; }
    const toca = muestras(c.pos, c.objetivo, T.sondaCorte).some((q) => terreno.libre(q) < 0);
    let p;
    try { p = planoCorte(terreno, c.pos, dir, { objetivo: [...c.objetivo], margen: T.margenCorte }); } catch (e) { fallas.push({ ...c, motivo: "planoCorte lanzó: " + String(e.message).split("\n")[0] }); continue; }
    if (!toca) { if (p) fallas.push({ ...c, motivo: "de la cámara al objetivo todo es aire y hay plano de corte" }); continue; }
    conRoca++;
    const lugar = Lc < 0 ? `cámara en roca (libre ${Lc.toFixed(2)} m)` : "cámara fuera de la roca, roca de por medio";
    if (!p) { fallas.push({ ...c, motivo: `${lugar} y sin plano de corte` }); continue; }
    const nrm = unit(p.normal);
    if (dot(nrm, dir) < 0.999) { fallas.push({ ...c, motivo: "la normal del plano no es la mirada" }); continue; }
    const dObj = dot(sub(c.objetivo, p.punto), nrm);
    if (!(dObj > T.sondaCorte)) { fallas.push({ ...c, motivo: `el objetivo queda antes del plano (${dObj.toFixed(2)} m): se cortaría lo que se mira` }); continue; }
    const desde = mas(c.pos, dir, dot(sub(p.punto, c.pos), dir) + T.sondaCorte); // el plano sobre el rayo, + 2 cm
    const roca = muestras(desde, c.objetivo, T.sondaCorte).find((q) => terreno.libre(q) < 0);
    if (roca) fallas.push({ ...c, motivo: `${lugar}: queda roca entre el plano y el objetivo, a ${Math.hypot(...sub(roca, desde)).toFixed(2)} m del plano` });
  }
  return { aprobado: camaras.length > 0 && fallas.length === 0, camaras: camaras.length, enRoca, fuera, conRoca, fallas };
}

/** Carga planoCorte de kit/estudio.js. */
export async function cargarPlanoCorte(f = join(RAIZ, "kit", "estudio.js")) {
  if (!existsSync(f)) return { error: "sin corte de cámara (no existe kit/estudio.js)" };
  try {
    const m = await import(pathToFileURL(f).href);
    return typeof m.planoCorte === "function" ? { planoCorte: m.planoCorte } : { error: "sin corte de cámara (kit/estudio.js no exporta planoCorte)" };
  } catch (e) { return { error: "kit/estudio.js no carga en Node: " + String(e.message).split("\n")[0] }; }
}

/** Línea corte completa para un ejemplo. */
export async function corteDeEjemplo(terreno, ficha, extra = []) {
  const pc = await cargarPlanoCorte();
  if (pc.error) return { aprobado: false, error: pc.error, camaras: 0, enRoca: 0, fallas: [] };
  if (!terreno) return { aprobado: true, noAplica: "el ejemplo no tiene montaje.js con terreno", camaras: 0, enRoca: 0, fallas: [] };
  const vistas = [...(ficha.referencias?.abiertas || []).map((r) => r.vista), ficha.vistaInicial].filter(Boolean);
  return juzgarCorte(terreno, pc.planoCorte, camarasCorte(terreno, { vistas, extra }));
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// paleta y ruido (python)
export function juzgarImagenes(capturasJson, salidaJson) {
  const txt = execFileSync("python", ["-I", join(RAIZ, "juez", "limpieza.py"), capturasJson, salidaJson], { encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
  return { texto: txt.trim(), ...JSON.parse(readFileSync(salidaJson, "utf8")) };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// informe
const ok = (b) => (b ? "ok   " : "NO   ");
export function textoLimpieza(r) {
  const out = ["── limpieza (4.º juez: dibujo limpio para estudio)"];
  const c = r.cerradas;
  if (!c) out.push("cerradas  no se midió (sin navegador: --sin-realismo)");
  else if (c.error) out.push(`NO   cerradas  ${c.error}`);
  else {
    out.push(`${ok(c.aprobado)}cerradas  ${c.mallas} mallas (${c.geometrias} geometrías, ${(c.triangulos / 1e6).toFixed(2)} M triángulos) · ${c.fallas.length} con defectos · ${c.calcos.length} calcos exentos · ${c.ms} ms`);
    for (const f of c.fallas.slice(0, 40)) out.push(`       NO  ${(f.nombre + (f.veces > 1 ? ` ×${f.veces}` : "")).padEnd(40)} ${f.tipo.padEnd(22)} abiertas ${f.abiertas} · no-variedad ${f.noVariedad} · mal orientadas ${f.malOrientadas}${f.alReves ? " · caras al revés" : ""}${f.donde ? ` · en [${f.donde.join(", ")}]` : ""}${f.material ? ` · ${f.material}` : ""}`);
    if (c.fallas.length > 40) out.push(`       … y ${c.fallas.length - 40} más (informe.json)`);
    for (const k of c.calcos) out.push(`       calco ${(k.nombre + (k.veces > 1 ? ` ×${k.veces}` : "")).padEnd(38)} ${k.motivo}`);
  }
  const k = r.corte;
  if (k.error) out.push(`NO   corte     ${k.error}`);
  else if (k.noAplica) out.push(`ok   corte     no aplica: ${k.noAplica}`);
  else {
    out.push(`${ok(k.aprobado)}corte     ${k.camaras} cámaras (${k.enRoca} en roca, ${k.fuera} fuera; ${k.conRoca} con roca hasta el objetivo) · ${k.fallas.length} fallas`);
    for (const f of k.fallas.slice(0, 12)) out.push(`       NO  ${f.etiqueta}: ${f.motivo} · cámara [${f.pos.map((v) => v.toFixed(2)).join(", ")}]`);
    if (k.fallas.length > 12) out.push(`       … y ${k.fallas.length - 12} más (informe.json)`);
  }
  const im = r.imagen;
  if (!im) out.push("paleta    no se midió (sin navegador: --sin-realismo)", "ruido     no se midió (sin navegador: --sin-realismo)");
  else if (im.error) out.push(`NO   paleta y ruido: ${im.error}`);
  else {
    out.push(`${ok(im.paleta.aprobado)}paleta    saturación p90 de la zona del equipo ≤ ${im.topes.saturacion}`);
    for (const f of im.filas) out.push(`       ${f.okPaleta ? "ok" : "NO"}  ${f.titulo.slice(0, 40).padEnd(40)} S p90 ${f.sP90.toFixed(2)} · acento ${(f.acento * 100).toFixed(1)} % (informativo)`);
    out.push(`${ok(im.ruido.aprobado)}ruido     |Laplaciano| medio ≤ ${im.topes.ruido} (0,7 × mediana v2 ${im.topes.ruidoV2})`);
    for (const f of im.filas) out.push(`       ${f.okRuido ? "ok" : "NO"}  ${f.titulo.slice(0, 40).padEnd(40)} ${f.ruido.toFixed(4)}`);
  }
  if (r.vacias?.length) out.push(`NO   capturas  captura vacía: ${r.vacias.join(", ")} (sigue vacía tras 2 reintentos)`);
  else if (r.reintentos?.length) out.push(`ok   capturas  repetidas por vacías: ${r.reintentos.join(", ")}`);
  if (r.consola === undefined) out.push("consola   no se midió (sin navegador)");
  else out.push(`${ok(r.consola)}consola   ${r.consola ? "limpia" : "con errores o avisos"}`);
  if (r.soloCorte) out.push("(sin navegador: limpieza solo juzgó corte; cerradas, paleta, ruido y consola quedan sin medir)");
  out.push(r.aprobado ? "limpieza aprobada" : "limpieza reprobada");
  return out.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// plantas: cada sublínea con un caso que la hace fallar y uno que la deja pasar
/** Terreno de prueba: bloque de roca x∈[−12,12], y∈[−3,7], z∈[−5,5] con una galería x∈[−12,10], |z|≤2, y∈[0,4]
 *  (frente en x = 10, boca en x = −12); fuera del bloque es aire. libre = distancia con signo (≥ 0 en aire).
 *  bolsillo: además, láminas de aire de 5 cm dentro de las paredes y la bóveda, a 40 cm de la galería (como el
 *  relieve de la pared del scoop, donde un rayo rasante pasa por aire 5 cm y vuelve a la roca antes de la galería). */
export function terrenoDePrueba({ bolsillo = false } = {}) {
  const sdCaja = (p, mn, mx) => {
    const q = [0, 1, 2].map((i) => Math.max(mn[i] - p[i], p[i] - mx[i]));
    const fuera = Math.hypot(...q.map((v) => Math.max(v, 0)));
    return fuera + Math.min(Math.max(...q), 0);
  };
  const bolsillos = bolsillo ? [[[-12, 0, 2.4], [10, 4, 2.45]], [[-12, 0, -2.45], [10, 4, -2.4]], [[-12, 4.4, -2], [10, 4.45, 2]]] : [];
  const libre = (p) => {
    let d = Math.max(sdCaja(p, [-12, -3, -5], [12, 7, 5]), -sdCaja(p, [-13, 0, -2], [10, 4, 2]));
    for (const [mn, mx] of bolsillos) d = Math.max(d, -sdCaja(p, mn, mx));
    return d;
  };
  return { libre, region: { min: [-11.5, 0, -2], max: [9.6, 4, 2] } };
}

/** planoCorte de referencia (regla de la ronda 3): plano pasado el ÚLTIMO tramo de roca del segmento cámara→objetivo,
 *  + margen; null si el segmento es todo aire. */
export function planoCorteReferencia(terreno, cam, dir, { objetivo, margen = 0.35 } = {}) {
  const L = objetivo ? dot(sub(objetivo, cam), dir) : 200, paso = 0.01;
  let ultimo = -1;
  for (let t = 0; t <= L; t += paso) if (terreno.libre(mas(cam, dir, t)) < 0) ultimo = t;
  if (ultimo < 0) return null;
  let a = ultimo, b = Math.min(L, ultimo + paso);
  for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (terreno.libre(mas(cam, dir, m)) < 0) a = m; else b = m; }
  return { punto: mas(cam, dir, b + margen), normal: [...dir], distancia: b + margen };
}

/** La regla vieja (ronda 1): solo corta si la CÁMARA está en roca, en el primer aire que dura margen + 5 cm. Ignora la
 *  roca que hay entre una cámara de fuera y el objetivo. */
export function planoCorteViejo(terreno, cam, dir, { margen = 0.35 } = {}) {
  if (terreno.libre(cam) >= 0) return null;
  const paso = 0.01, aire = (t) => terreno.libre(mas(cam, dir, t)) >= 0;
  for (let t = paso; t < 200; t += paso) {
    if (!aire(t)) continue;
    let s = t;
    while (s <= t + margen + 0.05 && aire(s)) s += paso;
    if (s > t + margen + 0.05) return { punto: mas(cam, dir, t + margen), normal: [...dir], distancia: t + margen };
    t = s;
  }
  return null;
}

/** Plano en el primer aire después de la primera roca (sin mirar si hay más roca antes del objetivo). */
export function planoCortePrimerAire(terreno, cam, dir, { margen = 0.35 } = {}) {
  let t = 0;
  while (t < 200 && terreno.libre(mas(cam, dir, t)) >= 0) t += 0.01;
  if (t >= 200) return null;
  while (t < 200 && terreno.libre(mas(cam, dir, t)) < 0) t += 0.01;
  return { punto: mas(cam, dir, t + margen), normal: [...dir], distancia: t + margen };
}

export async function plantas() {
  const THREE = await import("three");
  const filas = [];
  const caso = (linea, nombre, debe, aprueba, detalle = "") => filas.push({ linea, nombre, debe, aprueba, ok: debe === aprueba, detalle });
  const unaMalla = (g, mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(g, mat || new THREE.MeshBasicMaterial())); return s; };
  const det = (r) => (r.fallas[0] ? `abiertas ${r.fallas[0].abiertas} · no-variedad ${r.fallas[0].noVariedad} · mal orientadas ${r.fallas[0].malOrientadas}${r.fallas[0].alReves ? " · al revés" : ""}` : "cerrada");
  const cerr = (nombre, debe, escena) => { const r = revisarCerradas(escena); caso("cerradas", nombre, debe, r.aprobado, det(r)); return r; };

  // cerradas: deben fallar
  const perfil = [[0.4, -0.3], [0.5, -0.3], [0.5, 0.3], [0.4, 0.3]].map(([x, y]) => new THREE.Vector2(x, y));
  cerr("LatheGeometry abierta (neumático sin aro)", false, unaMalla(new THREE.LatheGeometry(perfil, 32)));
  const sinCara = new THREE.BoxGeometry(1, 1, 1); sinCara.setIndex([...sinCara.index.array].slice(0, 30));
  cerr("BoxGeometry sin una cara", false, unaMalla(sinCara));
  const volteada = new THREE.BoxGeometry(1, 1, 1); { const ix = [...volteada.index.array]; for (let j = 0; j < 6; j += 3) [ix[j + 1], ix[j + 2]] = [ix[j + 2], ix[j + 1]]; volteada.setIndex(ix); }
  cerr("BoxGeometry con una cara volteada", false, unaMalla(volteada));
  const doble = new THREE.BoxGeometry(1, 1, 1); doble.setIndex([...doble.index.array, ...[...doble.index.array].slice(0, 6)]);
  cerr("BoxGeometry con una cara repetida (no-variedad)", false, unaMalla(doble));
  cerr("BoxGeometry al revés (espejada en la geometría)", false, unaMalla(new THREE.BoxGeometry(1, 1, 1).scale(-1, 1, 1)));
  cerr("CylinderGeometry sin tapas", false, unaMalla(new THREE.CylinderGeometry(0.1, 0.1, 1, 16, 1, true)));
  cerr("TubeGeometry (manguera sin tapas)", false, unaMalla(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0.5, 0), new THREE.Vector3(2, 0, 0.3)]), 24, 0.03, 8)));
  // cerradas: deben pasar
  cerr("BoxGeometry", true, unaMalla(new THREE.BoxGeometry(1, 2, 3, 2, 3, 4)));
  cerr("TorusGeometry", true, unaMalla(new THREE.TorusGeometry(1, 0.3, 12, 48)));
  cerr("SphereGeometry (polos soldados)", true, unaMalla(new THREE.SphereGeometry(1, 24, 12)));
  cerr("CylinderGeometry con tapas", true, unaMalla(new THREE.CylinderGeometry(0.2, 0.3, 1, 20)));
  cerr("LatheGeometry cerrada (perfil de eje a eje)", true, unaMalla(new THREE.LatheGeometry([[0, -0.5], [0.4, -0.5], [0.5, 0], [0.4, 0.5], [0, 0.5]].map(([x, y]) => new THREE.Vector2(x, y)), 32)));
  cerr("BoxGeometry no indexada", true, unaMalla(new THREE.BoxGeometry(1, 1, 1).toNonIndexed()));
  { // espejo por la matriz (rueda izquierda): three invierte la cara delantera, no es «al revés»
    const s = new THREE.Scene(), m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()); m.scale.z = -1; s.add(m);
    cerr("Box espejada por la matriz", true, s);
  }
  { // domo del cielo: esfera BackSide, se ve desde adentro
    cerr("domo BackSide", true, unaMalla(new THREE.SphereGeometry(50, 16, 8), new THREE.MeshBasicMaterial({ side: THREE.BackSide })));
  }
  { // InstancedMesh de toros y una malla abierta invisible (no cuenta) y un calco declarado (exento, listado)
    const s = new THREE.Scene();
    s.add(new THREE.InstancedMesh(new THREE.TorusGeometry(1, 0.2, 8, 24), new THREE.MeshBasicMaterial(), 5));
    const oculta = new THREE.Mesh(new THREE.PlaneGeometry(1, 1)); oculta.visible = false; s.add(oculta);
    const calco = new THREE.Mesh(new THREE.PlaneGeometry(1, 1)); calco.name = "pintura malla"; calco.userData.calco = "pintura de la malla"; s.add(calco);
    const r = cerr("InstancedMesh + oculta + calco declarado", true, s);
    caso("cerradas", "el calco queda listado con su motivo", true, r.calcos.length === 1 && r.calcos[0].motivo === "pintura de la malla");
  }
  { // el mismo calco SIN declarar: falla
    const s = new THREE.Scene(); s.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1)));
    cerr("PlaneGeometry sin userData.calco", false, s);
  }
  { // el texto que va a la página evalúa igual que la función
    const f = new Function("return " + revisarCerradas.toString())();
    caso("cerradas", "la versión en texto (página) da lo mismo", true, f(unaMalla(sinCara)).fallas[0]?.abiertas === 4 && f(unaMalla(new THREE.TorusGeometry())).aprobado);
  }

  // corte
  const ter = terrenoDePrueba();
  const cams = camarasCorte(ter, { region: ter.region });
  const cRoca = cams.filter((c) => ter.libre(c.pos) < 0).length;
  const cFuera = cams.filter((c) => ter.libre(c.pos) >= 0 && muestras(c.pos, c.objetivo, 0.02).some((q) => ter.libre(q) < 0)).length;
  const cAire = cams.length - cRoca - cFuera;
  caso("corte", `hay cámaras en roca (${cRoca}), fuera con roca de por medio (${cFuera}) y en aire libre (${cAire})`, true, cams.length >= 200 && cRoca > 20 && cFuera > 20 && cAire > 20);
  const cr = (nombre, debe, fn) => { const r = juzgarCorte(ter, fn, cams); caso("corte", nombre, debe, r.aprobado, `${r.fallas.length} fallas${r.fallas[0] ? " · " + r.fallas[0].motivo : ""}`); };
  cr("referencia: pasado el último tramo de roca + 0,35 m", true, planoCorteReferencia);
  cr("regla vieja: solo corta con la cámara en roca", false, planoCorteViejo);
  cr("planoCorte que siempre devuelve null", false, () => null);
  cr("plano en la cámara", false, (t, c, d, o) => (planoCorteReferencia(t, c, d, o) ? { punto: [...c], normal: [...d], distancia: 0 } : null));
  cr("plano también sin roca de por medio", false, (t, c, d, o) => planoCorteReferencia(t, c, d, o) || { punto: mas(c, d, 0.5), normal: [...d], distancia: 0.5 });
  cr("plano con la normal hacia la cámara", false, (t, c, d, o) => { const p = planoCorteReferencia(t, c, d, o); return p && { ...p, normal: p.normal.map((v) => -v) }; });
  cr("plano 30 m más allá (corta lo que se mira)", false, (t, c, d, o) => { const p = planoCorteReferencia(t, c, d, o); return p && { ...p, punto: mas(p.punto, d, 30) }; });
  { // pared con bolsillos de aire de 5 cm (lo que encontró el juez en scoop-lhd): el primer aire no basta
    const terB = terrenoDePrueba({ bolsillo: true }), camsB = camarasCorte(terB, { region: terB.region });
    const crB = (nombre, debe, fn) => { const r = juzgarCorte(terB, fn, camsB); caso("corte", nombre, debe, r.aprobado, `${r.fallas.length} fallas${r.fallas[0] ? " · " + r.fallas[0].motivo : ""}`); };
    crB("pared con bolsillo de aire: plano en el primer aire", false, planoCortePrimerAire);
    crB("pared con bolsillo de aire: referencia", true, planoCorteReferencia);
  }
  { // el kit real: informativo (no decide si el juez está sano; el kit lo juzga la línea corte en cada ejemplo)
    const filasAntes = filas.length;
    const falta = await cargarPlanoCorte(join(RAIZ, "kit", "no-existe-estudio.js"));
    caso("corte", "sin kit/estudio.js: «sin corte de cámara»", false, !falta.error, falta.error);
    const pc = await cargarPlanoCorte();
    caso("corte", "kit/estudio.js existe y exporta planoCorte", true, !pc.error, pc.error || "ok");
    if (!pc.error) {
      cr("kit/estudio.js · planoCorte sobre el terreno de prueba", true, pc.planoCorte);
      const terB = terrenoDePrueba({ bolsillo: true }), r = juzgarCorte(terB, pc.planoCorte, camarasCorte(terB, { region: terB.region }));
      caso("corte", "kit/estudio.js · planoCorte con bolsillos de aire", true, r.aprobado, `${r.fallas.length} fallas${r.fallas[0] ? " · " + r.fallas[0].motivo : ""}`);
    }
    for (const f of filas.slice(filasAntes + 1)) f.info = true;
  }

  // paleta y ruido (imágenes sintéticas en python)
  try {
    const py = JSON.parse(execFileSync("python", ["-I", join(RAIZ, "juez", "limpieza.py"), "--plantas"], { encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" } }));
    for (const f of py) caso(f.linea, f.nombre, f.debeAprobar, f.aprueba, `S p90 ${f.sP90.toFixed(2)} · ruido ${f.ruido.toFixed(4)}${f.vacia ? " · captura vacía" : ""}`);
  } catch (e) { caso("paleta", "juez/limpieza.py --plantas corre", true, false, String(e.message).split("\n")[0]); }

  // consola: el mismo criterio que el realismo (la salida de drive.mjs dice «console: clean»)
  caso("consola", "salida con console.error", false, consolaLimpia("shot a.png\nconsole.error: THREE.WebGLRenderer: x\n"));
  caso("consola", "salida limpia", true, consolaLimpia("shot a.png\nconsole: clean\n"));
  return { aprobado: filas.every((f) => f.ok || f.info), filas };
}

/** Consola limpia según la salida de drive.mjs. */
export const consolaLimpia = (salidaDrive) => /console: clean/.test(salidaDrive);

export function textoPlantas(p) {
  const out = ["── plantas del juez: física (varias máquinas), limpieza y realismo (cada caso debe dar lo esperado)"];
  for (const f of p.filas) out.push(`${f.ok ? "ok   " : f.info ? "aviso" : "MAL  "} ${f.linea.padEnd(8)} ${(f.debe ? "pasa " : "falla") + "  "}${f.nombre.padEnd(58)} ${f.detalle}`);
  const info = p.filas.filter((f) => f.info && !f.ok).length;
  out.push(p.aprobado ? `plantas: ${p.filas.filter((f) => f.ok).length}/${p.filas.length} como se esperaba${info ? ` · ${info} aviso(s) informativo(s): kit real o huecos conocidos` : ""}` : `plantas: ${p.filas.filter((f) => !f.ok).length} de ${p.filas.length} NO dan lo esperado`);
  return out.join("\n");
}
