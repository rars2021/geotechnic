// Ejemplo · dispatch: flota de 12 camiones de 230 t y dos palas en un tajo, movidos por la simulación de la flota
// (kit/procesos.js → simularFlota, distribuciones de Yupanqui Sánchez 2025). Motor A (camión y pala) sobre el motor B
// (tajo cerrado: terrenoTajo + mallaTajo): todo viene de montaje.js, lo mismo que juzga el juez. Abajo, el panel de
// despacho (Gantt por camión, colas en el tiempo, indicadores) se dibuja en un canvas 2D con los tokens del estudio.
import * as THREE from "three";
import { crearEscena } from "../../kit/escena.js";
import { mallaTajo, REGIONES_TAJO } from "../../kit/terreno.js";
import { materialRoca } from "../../kit/materiales.js";
import { mallasMaquina } from "../../motorA/mallas.js";
import { EQUIPO_CAMION } from "../../equipos/camion/modelo.js";
import { EQUIPO_PALA } from "../../equipos/pala/modelo.js";
import { tono, retintar, temaActual } from "../../kit/estudio.js";
import { ESTADOS_FLOTA, estadoEn } from "../../kit/procesos.js";
import { clamp } from "../../kit/nucleo.js";
import { senalar } from "../../kit/senalar.js";
import { montajeDispatch, OPCIONES_DISPATCH } from "./montaje.js";

// ── panel 2D del despacho (canvas): Gantt por camión, colas en el tiempo, leyenda. Colores: tokens `codigo` y `tinta`.
const VENTANA_DISPATCH = 120; // min a la vista en el Gantt y en las colas

/** Colores de los estados del ciclo (orden del proceso → token `codigo`, de oscuro a claro). */
function coloresEstadoDispatch() {
  const c = tono("codigo");
  return Object.fromEntries(ESTADOS_FLOTA.map((e, i) => [e, c[i]]));
}

const horaDispatch = (min, h0 = OPCIONES_DISPATCH.hora0) => { const t = h0 * 60 + min; const h = Math.floor(t / 60) % 24, m = Math.floor(t % 60); return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`; };
const comaDispatch = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d).replace(".", ",") : "—");
const milesDispatch = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); // 3 866 (espacio fino)

/**
 * Dibuja el panel en el canvas. d: { sim, t, camiones: [{ k, nombre }], palas: [ids], lugares: [{ id, nombre, tipo }],
 * foco: k o null }. Devuelve la geometría de las filas (para saber qué camión se tocó).
 */
function dibujarPanelDispatch(cv, d) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = Math.max(320, cv.clientWidth), n = d.camiones.length;
  const filaH = 15, top = 22, izq = 104, der = 10;
  const yColas = top + n * filaH + 18, colaH = 26, H = yColas + d.lugares.length * (colaH + 8) + 26;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + "px"; }
  const g = cv.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  const tinta = tono("tinta"), col = coloresEstadoDispatch(), dur = d.sim.duracion, t = d.t;
  const t0 = clamp(t - VENTANA_DISPATCH * 0.75, 0, Math.max(0, dur - VENTANA_DISPATCH)), t1 = t0 + VENTANA_DISPATCH;
  const x = (tm) => izq + ((tm - t0) / (t1 - t0)) * (W - izq - der);
  g.font = "11px ui-sans-serif, system-ui, sans-serif"; g.textBaseline = "middle"; g.fillStyle = tinta;
  // eje del tiempo: marcas cada 15 min
  for (let mm = Math.ceil(t0 / 15) * 15; mm <= t1; mm += 15) {
    g.globalAlpha = 0.7; g.fillText(horaDispatch(mm), x(mm) - 14, 9);
    g.globalAlpha = 0.12; g.fillRect(x(mm), top - 4, 1, n * filaH + 4);
  }
  g.globalAlpha = 1;
  // Gantt: una fila por camión; etiqueta = camión → pala a la que va · viajes a A y a B hasta ahora
  for (const c of d.camiones) {
    const y = top + c.k * filaH, ev = d.sim.porCamion[c.k];
    if (d.foco === c.k) { g.fillStyle = tinta; g.globalAlpha = 0.1; g.fillRect(0, y, W, filaH); g.globalAlpha = 1; }
    for (const e of ev) {
      const a = Math.max(e.t, t0), b = Math.min(e.t + e.dur, t1, t);
      if (b <= a) continue;
      g.fillStyle = col[e.estado]; g.fillRect(x(a), y + 2, Math.max(1, x(b) - x(a)), filaH - 4);
    }
    const ah = estadoEn(ev, c.k, t), va = !ah ? null : ah.estado === "viaja vacío" || ah.estado === "viaja cargado" ? ah.hacia : ah.desde;
    const viajes = d.sim.ciclos.filter((q) => q.camion === c.k && q.t0 >= 0 && q.t0 <= t);
    const lugar = va === "chancadora" ? "chanc." : va === "botadero" ? "bot." : va;
    g.fillStyle = tinta; g.globalAlpha = 0.95; g.fillText(`${c.nombre.replace("camión ", "C")}${lugar ? " · " + lugar : ""}`, 4, y + filaH / 2);
    g.globalAlpha = 0.55; g.fillText(`${viajes.filter((q) => q.pala === d.palas[0]).length}·${viajes.filter((q) => q.pala === d.palas[1]).length}`, izq - 34, y + filaH / 2);
    g.globalAlpha = 1;
  }
  g.fillStyle = tinta; g.fillRect(x(t), top - 6, 1.5, n * filaH + 8); // ahora (tinta: el acento es de la pieza señalada)
  // colas: escalones de camiones esperando en cada lugar
  d.lugares.forEach((L, i) => {
    const y0 = yColas + i * (colaH + 8), serie = d.sim.colas[L.id] || [[0, 0, 0]];
    const maxN = Math.max(2, ...serie.map((s) => s[1]));
    const yv = (v) => y0 + colaH - (v / maxN) * (colaH - 3);
    g.fillStyle = tinta; g.globalAlpha = 0.85; g.fillText(L.nombre, 4, y0 + colaH / 2);
    g.globalAlpha = 0.12; g.fillRect(izq, y0 + colaH, W - izq - der, 1); g.globalAlpha = 1;
    g.beginPath(); g.moveTo(x(t0), yv(0));
    let ult = 0, ahoraN = 0;
    for (let j = 0; j < serie.length; j++) {
      const [ts, nq] = serie[j], te = j + 1 < serie.length ? serie[j + 1][0] : dur;
      if (ts <= t) ahoraN = nq;
      if (te < t0) { ult = nq; continue; }
      if (ts > Math.min(t, t1)) break;
      const a = Math.max(ts, t0), b = Math.min(te, t, t1);
      g.lineTo(x(a), yv(ult)); g.lineTo(x(a), yv(nq)); g.lineTo(x(b), yv(nq)); ult = nq;
    }
    g.lineTo(x(Math.min(t, t1)), yv(0)); g.closePath(); g.fillStyle = col[L.tipo === "pala" ? "cola" : "cola descarga"]; g.fill();
    g.fillStyle = tinta; g.globalAlpha = 0.8; g.fillText(`${ahoraN} en cola`, izq - 66 + 2, y0 + colaH / 2 + 11); g.globalAlpha = 1;
  });
  // leyenda de estados
  let lx = 4; const ly = H - 10;
  for (const e of ESTADOS_FLOTA) { g.fillStyle = col[e]; g.fillRect(lx, ly - 5, 10, 10); g.fillStyle = tinta; g.globalAlpha = 0.85; g.fillText(e, lx + 14, ly); g.globalAlpha = 1; lx += g.measureText(e).width + 26; }
  return { top, filaH, n };
}

/** Indicadores medidos contra la tesis (HTML). */
function kpiDispatch(sim, pol, um) {
  const r = sim.resumen, cA = r.cicloPala.A, cB = r.cicloPala.B, nombre = { cerrado: "Circuito cerrado", libre: "Circuito libre", condicional: `Despacho condicional (umbral ${um})` }[pol];
  const caja = (titulo, valor, nota) => `<div><small>${titulo}</small><b>${valor}</b><small>${nota}</small></div>`;
  return [
    caja("Ciclo Tajo A (pala A)", `${comaDispatch(cA.media)} min`, `P10–P90 ${comaDispatch(cA.p10)}–${comaDispatch(cA.p90)} · tesis 37–39 min`),
    caja("Ciclo Tajo B (pala B)", `${comaDispatch(cB.media)} min`, `P10–P90 ${comaDispatch(cB.p10)}–${comaDispatch(cB.p90)} · tesis 46–48 min`),
    caja("Producción del turno", `${milesDispatch(r.toneladasHora)} t/h`, `A ${milesDispatch(r.porPala.A)} · B ${milesDispatch(r.porPala.B)} t/h · ${r.viajes} viajes`),
    caja("Cola media en pala", `${comaDispatch(r.colaPala, 2)} min`, `A ${comaDispatch(r.colaPorPala.A, 2)} · B ${comaDispatch(r.colaPorPala.B, 2)} · tesis 2,5–2,9 min`),
    caja("Cola media en descarga", `${comaDispatch(r.colaDestino, 2)} min`, `chancadora ${comaDispatch(r.colaPorDestino.chancadora, 2)} · botadero ${comaDispatch(r.colaPorDestino.botadero, 2)}`),
    caja("Utilización de palas", `A ${Math.round(r.utilizacion.A * 100)} % · B ${Math.round(r.utilizacion.B * 100)} %`, `${nombre} · ${r.cambios} cambios de pala`),
  ].join("");
}

/** Color de una cinta: el del estado mezclado 45 % hacia el papel del piso (se lee el código sin sumar ruido). */
const tonoCintaDispatch = (hex) => new THREE.Color(hex).lerp(new THREE.Color("#c9c4b9"), 0.45);

/** Cinta pintada sobre el piso a lo largo de una polilínea (calco: superficie abierta pegada al terreno). */
function cintaDispatch(pts, ancho, color, motivo) {
  const pos = [], idx = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz) || 1;
    const nx = -dz / L, nz = dx / L, p = pts[i];
    pos.push(p[0] + nx * ancho / 2, p[1] + 0.12, p[2] + nz * ancho / 2, p[0] - nx * ancho / 2, p[1] + 0.12, p[2] - nz * ancho / 2);
    if (i) { const k = 2 * i; idx.push(k - 2, k, k - 1, k - 1, k, k + 1); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: tonoCintaDispatch(color), side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.userData.calco = motivo; m.renderOrder = 1;
  return m;
}

async function montar(ctx) {
  const m = montajeDispatch();
  const { ter, op } = m;
  // ambiente abierto (references/categorias.md): sin corte; la cámara choca con el tajo (colisión, como Anatomy)
  const esc = crearEscena(ctx.contenedor, { fondo: "subterraneo", estudio: true, ambiente: "abierto", corte: ter, exposicion: 0.95, fov: 34, cerca: 1, lejos: 8000 });
  const { scene } = esc;
  // ── luz de estudio: cielo parejo y un sol bajo que marca bancos y bermas (neutras: no tiñen el papel)
  scene.add(new THREE.HemisphereLight("#ffffff", "#8a8780", 1.6));
  const sol = new THREE.DirectionalLight("#ffffff", 1.25);
  const cx = (ter.caja.min[0] + ter.caja.max[0]) / 2, cz = (ter.caja.min[2] + ter.caja.max[2]) / 2;
  sol.position.set(cx - 380, 520, cz + 300); sol.target.position.set(cx, -60, cz);
  sol.castShadow = true; sol.shadow.mapSize.set(4096, 4096); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.6;
  Object.assign(sol.shadow.camera, { left: -560, right: 560, top: 420, bottom: -420, near: 50, far: 1600 });
  scene.add(sol, sol.target);
  // ── motor B: el tajo como UN bloque cerrado (superficie + caja), roca calma
  const blq = mallaTajo(ter, { paso: 1.5, calma: 1 });
  // estudio a escala tajo: sin relieve fino de sombreado ni variación de color (a cientos de metros se vuelve grano)
  const matSup = materialRoca({ regiones: true, escala: 0.25, fuerza: 0, escala2: 1.2, fuerza2: 0, variacion: 0, apagar: 0.5 });
  const matCaja = materialRoca({ escala: 0.25, fuerza: 0, escala2: 1.2, fuerza2: 0, variacion: 0, apagar: 0.5 });
  const roca = new THREE.Mesh(blq.geometria, [matSup, matCaja]);
  roca.receiveShadow = true; roca.castShadow = true;
  scene.add(roca);
  // ── rutas pintadas en el piso: un carril por tramo físico, con el color del estado (cargado / vacío) del panel
  const colE = coloresEstadoDispatch();
  const rutas = new THREE.Group();
  const yaPintado = new Set();
  for (const v of Object.values(m.V)) for (const q of v.piezas) {
    if (yaPintado.has(q.pieza)) continue; yaPintado.add(q.pieza);
    const c = cintaDispatch(q.pieza.pts, 1.4, v.cargado ? colE["viaja cargado"] : colE["viaja vacío"], "carril de la ruta pintado sobre el piso");
    c.userData.estado = v.cargado ? "viaja cargado" : "viaja vacío";
    rutas.add(c);
  }
  // maniobra (espera → punto de maniobra → retroceso al cuadre o a la descarga): cinta más fina
  for (const v of Object.values(m.V)) {
    const pts = []; for (let s = v.sW; s <= v.fin; s += 1) pts.push(v.ruta.en(Math.min(s, v.fin)).p);
    const c = cintaDispatch(pts, 0.7, v.cargado ? colE["viaja cargado"] : colE["viaja vacío"], "maniobra de cuadre o de descarga pintada sobre el piso");
    c.userData.estado = v.cargado ? "viaja cargado" : "viaja vacío";
    rutas.add(c);
  }
  scene.add(rutas);
  // ── motor A: 12 camiones y 2 palas, pieza por pieza
  const dibC = m.nombres.map(() => mallasMaquina(m.Mc, EQUIPO_CAMION.dibujo));
  for (const d of dibC) scene.add(d.raiz);
  const dibP = m.palas.map(() => mallasMaquina(m.Mp, EQUIPO_PALA.dibujo));
  for (const d of dibP) scene.add(d.raiz);
  // la carga sube pase a pase: el montón de la tolva se escala desde su base (solo dibujo; el juez juzga el montón lleno)
  const cargas = dibC.map((d) => {
    const objs = d.objetosDe("carga"), yb = Math.min(...objs.flatMap((o) => { const P = o.geometry?.attributes.position; if (!P) return []; const a = []; for (let i = 0; i < P.count; i++) a.push(P.getY(i)); return a; }));
    return { objs, yb: Number.isFinite(yb) ? yb : 3.6 };
  });
  const ponerCarga = (k, f) => { const c = cargas[k]; for (const o of c.objs) { o.visible = f > 0.02; o.scale.y = Math.max(0.02, f); o.position.y = c.yb * (1 - Math.max(0.02, f)); } };

  // ── estado: tiempo (min desde las 07:00), política y animación
  let t = op.tInicial, pol = "cerrado", um = 0, anim = false, vel = 60, foco = null, ultimo = null;
  const aplicar = () => {
    const s = m.estado(t, pol, um);
    s.camiones.forEach((c, k) => { dibC[k].poner(c.valores); ponerCarga(k, c.carga); });
    s.palas.forEach((p, k) => dibP[k].poner(p.valores));
    ultimo = s;
    lectura(s);
    return s;
  };
  const nombrePol = () => ({ cerrado: "circuito cerrado", libre: "circuito libre", condicional: `despacho condicional (umbral ${um})` })[pol];
  function lectura(s) {
    const sim = s.sim, cola = (id) => { let n = 0; for (const [ts, q] of sim.colas[id]) { if (ts > t) break; n = q; } return n; };
    const pA = s.palas.find((p) => p.id === "A"), pB = s.palas.find((p) => p.id === "B");
    const fase = (p) => (p.fase === "Espera" ? "espera camión" : `${p.fase.toLowerCase()} (pase ${p.pase + 1} de ${op.pases})`);
    ctx.lectura(`${horaDispatch(t)} · ${nombrePol()} · pala A: ${fase(pA)} · pala B: ${fase(pB)} · en cola: A ${cola("A")}, B ${cola("B")}, chancadora ${cola("chancadora")}, botadero ${cola("botadero")}`);
  }
  // ── panel
  const cv = document.getElementById("panel-despacho"), kpi = document.getElementById("kpi");
  const lugares = [{ id: "A", nombre: "Cola pala A", tipo: "pala" }, { id: "B", nombre: "Cola pala B", tipo: "pala" }, { id: "chancadora", nombre: "Cola chancadora", tipo: "destino" }, { id: "botadero", nombre: "Cola botadero", tipo: "destino" }];
  const camionesPanel = m.nombres.map((nombre, k) => ({ k, nombre }));
  let geoPanel = null, panelT = -1;
  const panel = (forzar = false) => {
    if (!cv) return;
    if (!forzar && Math.abs(t - panelT) < 0.05) return;
    panelT = t;
    geoPanel = dibujarPanelDispatch(cv, { sim: m.simular(pol, um), t, camiones: camionesPanel, palas: ["A", "B"], lugares, foco });
  };
  const ponerKpi = () => { if (kpi) kpi.innerHTML = kpiDispatch(m.simular(pol, um), pol, um); };
  // seguir a un camión: toca su fila
  let seguido = null;
  cv?.addEventListener("click", (ev) => {
    if (!geoPanel) return;
    const r = cv.getBoundingClientRect(), k = Math.floor((ev.clientY - r.top - geoPanel.top) / geoPanel.filaH);
    if (k < 0 || k >= geoPanel.n) return;
    foco = foco === k ? null : k; seguido = foco === null ? null : { x: ultimo.camiones[k].valores._pose.x, y: ultimo.camiones[k].valores._pose.y, z: ultimo.camiones[k].valores._pose.z };
    if (foco !== null) { const p = ultimo.camiones[k].valores._pose; esc.mirar(new THREE.Vector3(p.x, p.y + 3, p.z), 135, 22, 70); }
    panel(true); esc.marcar();
  });
  const seguir = () => {
    if (foco === null || !seguido) return;
    const p = ultimo.camiones[foco].valores._pose, d = new THREE.Vector3(p.x - seguido.x, p.y - seguido.y, p.z - seguido.z);
    esc.controls.target.add(d); esc.camera.position.add(d); seguido = { x: p.x, y: p.y, z: p.z };
  };
  // ── controles
  const btn = document.getElementById("reproducir"), rango = document.getElementById("tiempo"), outT = document.querySelector('output[for="tiempo"]');
  const selVel = document.getElementById("velocidad"), selPol = document.getElementById("politica"), umbral = document.getElementById("umbral"), outU = document.querySelector('output[for="umbral"]');
  const ponerBtn = () => { if (!btn) return; btn.textContent = anim ? "Pausar" : "Reproducir"; btn.setAttribute("aria-pressed", String(anim)); };
  const ponerT = () => { if (rango) rango.value = String(t); if (outT) outT.textContent = horaDispatch(t); };
  btn?.addEventListener("click", () => { anim = !anim; ponerBtn(); esc.marcar(); });
  rango?.addEventListener("input", () => { t = +rango.value; anim = false; ponerBtn(); ponerT(); aplicar(); seguir(); panel(true); esc.marcar(); });
  selVel?.addEventListener("change", () => { vel = +selVel.value; });
  const cambiarPol = () => {
    pol = selPol ? selPol.value : pol; um = umbral ? +umbral.value : 0;
    if (outU) outU.textContent = `${um} camión${um === 1 ? "" : "es"}${pol === "condicional" ? "" : " (solo condicional)"}`;
    aplicar(); ponerKpi(); panel(true); esc.marcar();
  };
  selPol?.addEventListener("change", cambiarPol); umbral?.addEventListener("input", cambiarPol);
  document.getElementById("lamina")?.addEventListener("change", (ev) => { for (const d of [...dibC, ...dibP]) d.lamina(ev.target.checked); esc.marcar(); });
  esc.alAnimar((dt) => {
    if (!anim) return false;
    t += (dt * vel) / 60;
    if (t >= op.duracion) t = 0;
    aplicar(); seguir(); ponerT(); panel();
    return true;
  });
  // ── tema claro / oscuro: tokens del dibujo y del panel
  const retemar = () => {
    retintar(scene, temaActual());
    const c = coloresEstadoDispatch();
    for (const r of rutas.children) r.material.color.copy(tonoCintaDispatch(c[r.userData.estado]));
    panel(true); esc.marcar();
  };
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", retemar);
  new MutationObserver(retemar).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  // ── piezas señalables
  const pA = m.palas.find((p) => p.id === "A"), dA = m.destinos.find((d) => d.id === "chancadora"), dB = m.destinos.find((d) => d.id === "botadero");
  const V3 = (p, dy = 0) => new THREE.Vector3(p[0], p[1] + dy, p[2]);
  const camionEn = (pred, porDefecto = 0) => () => { const k = ultimo?.camiones.findIndex(pred); return k >= 0 ? k : porDefecto; };
  const enCarga = camionEn((c) => c.estado === "carga"), enCola = camionEn((c) => c.estado === "cola"), enColaD = camionEn((c) => c.estado === "cola descarga");
  const sobreCamion = (sel, dy) => () => { const p = ultimo.camiones[sel()].valores._pose; return new THREE.Vector3(p.x, p.y + dy, p.z); };
  const vA = m.V["chancadora→A"], vC = m.V["A→chancadora"];
  const piezas = [
    { id: "pala", numero: 1, nombre: "Pala eléctrica", definicion: "Pala de cables de 56 m³. Carga un camión en 3,8 min de media; atiende en orden de llegada.", ancla: () => V3(pA.punto, 24), objetos: dibP.flatMap((d) => [d.raiz]) },
    { id: "camion", numero: 2, nombre: "Camión de acarreo", definicion: "230 t (clase CAT 793). Doce en la flota: seis por pala en el circuito cerrado.", ancla: sobreCamion(camionEn((c) => c.estado === "viaja cargado"), 9), objetos: dibC.map((d) => d.raiz) },
    { id: "tolva", numero: 3, nombre: "Tolva", definicion: "Caja del camión. Se levanta para descargar: 1,8 min de media en la chancadora o el botadero.", ancla: sobreCamion(enCarga, 8), objetos: dibC.flatMap((d) => d.objetosDe("tolva")) },
    { id: "colaPala", numero: 4, nombre: "Cola en la pala", definicion: "Camiones que esperan su turno en fila, a 60 m de la pala, en orden de llegada.", ancla: () => V3(vA.ruta.en(vA.sW).p, 8) },
    { id: "cuadrado", numero: 5, nombre: "Punto de carguío", definicion: "El camión retrocede hasta quedar bajo el cucharón: es el cuadrado, dentro de 20 m de la pala.", ancla: () => V3(pA.cuadre.punto, 3) },
    { id: "rampa", numero: 6, nombre: "Rampa", definicion: "Vía con pendiente entre bancos: 7–9 % en el Tajo A y 9–11 % en el Tajo B.", ancla: () => V3(ter.rampa.eje(ter.rampa.inicio + (ter.rampa.fin - ter.rampa.inicio) * 0.45), 4), region: { material: matSup, valor: REGIONES_TAJO.rampa } },
    { id: "berma", numero: 7, nombre: "Berma y banco", definicion: "Escalón del tajo: la cara del banco y la berma que atrapa las rocas que caen.", ancla: () => V3(ter.rampa.eje(ter.rampa.inicio + (ter.rampa.fin - ter.rampa.inicio) * 0.2), -14), region: { material: matSup, valor: REGIONES_TAJO.banco } },
    { id: "pretil", numero: 8, nombre: "Pretil", definicion: "Muro de material suelto al borde de la vía: detiene a un camión que se sale.", ancla: () => V3(ter.rampa.eje(ter.rampa.inicio + (ter.rampa.fin - ter.rampa.inicio) * 0.7), 3), region: { material: matSup, valor: REGIONES_TAJO.pretil } },
    { id: "chancadora", numero: 9, nombre: "Chancadora primaria", definicion: "Compartida por los dos tajos: descarga un camión a la vez. Es donde se forma la cola de descarga.", ancla: () => V3(dA.tope, 6), region: { material: matSup, valor: REGIONES_TAJO.chancadora } },
    { id: "botadero", numero: 10, nombre: "Botadero", definicion: "Destino del desmonte: un puesto de descarga en su cresta, con pretil.", ancla: () => V3(dB.tope, 6), region: { material: matSup, valor: REGIONES_TAJO.botadero } },
    { id: "ruta", numero: 11, nombre: "Ruta de acarreo", definicion: "Camino de cada pala a cada destino: un carril cargado y otro vacío.", ancla: () => V3(vC.ruta.en(Math.min(120, vC.sW)).p, 3), objetos: [rutas] },
    { id: "colaDescarga", numero: 12, nombre: "Cola de descarga", definicion: "Camiones cargados que esperan a que la chancadora quede libre.", ancla: () => V3(vC.ruta.en(vC.sW).p, 8) },
  ];
  const senal = senalar(esc, ctx.contenedor, piezas, { modo: ctx.modo, foco: ctx.foco });
  // ── vista inicial y arranque
  const vi = m.vistas.inicial;
  esc.mirar(new THREE.Vector3(...vi.objetivo), vi.az, vi.el, vi.dist);
  esc.controls.minDistance = 8; esc.controls.maxDistance = 1600; esc.controls.maxPolarAngle = Math.PI * 0.49;
  aplicar(); ponerT(); ponerKpi(); cambiarPol();
  requestAnimationFrame(() => panel(true));
  new ResizeObserver(() => panel(true)).observe(cv || ctx.contenedor);
  // un cambio de tamaño borra el canvas; con 14 máquinas el cuadro siguiente tarda: se redibuja en el acto (si no, una
  // captura justo después del cambio sale vacía; lo encontró la medición de limpieza)
  new ResizeObserver(() => esc.renderizar()).observe(ctx.contenedor);
  if (!esc.quieto.matches) { anim = true; ponerBtn(); }
  window.GEO = {
    escena: esc, senal, montaje: m, camiones: dibC, palas: dibP,
    igualarVista: (v) => {
      anim = false; ponerBtn();
      if (v.t !== undefined) { t = v.t; ponerT(); }
      if (v.politica) { pol = v.politica; if (selPol) selPol.value = pol; }
      foco = null; aplicar(); panel(true);
      esc.mirar(new THREE.Vector3(...v.objetivo), v.az, v.el, v.dist);
      esc.controls.update(); esc.renderizar(); // el cuadro queda dibujado ya (las capturas del juez no esperan al bucle)
    },
  };
}
