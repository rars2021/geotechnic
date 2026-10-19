// Ejemplo · perforación de un frente de 4,0 × 4,0 m con jumbo de dos brazos (malla real de Alpayana-Casapalca).
// Motor A (jumbo, equipos/jumbo) dentro del motor B (roca y frente): ambos vienen de montaje.js, lo mismo que juzga el juez.
import * as THREE from "three";
import { crearEscena } from "../../kit/escena.js";
import { macizoCerrado, pernos, mangaVentilacion, tuberias, charcos } from "../../kit/labor.js";
import { trazasSobreMalla, lineasTrazas } from "../../kit/fracturas.js";
import { polvo } from "../../kit/volumenes.js";
import { materialRoca } from "../../kit/materiales.js";
import { rgb } from "../../kit/nucleo.js";
import { tono, tapar, sinTapa } from "../../kit/estudio.js";
import { COLORES_GRUPO } from "../../kit/procesos.js";
import { mallasMaquina } from "../../motorA/mallas.js";
import { EQUIPO_JUMBO } from "../../equipos/jumbo/modelo.js";
import { clamp } from "../../kit/nucleo.js";
import { senalar } from "../../kit/senalar.js";
import { montajeJumbo } from "./montaje.js";

/** Losa cerrada de piso exterior (patio): una caja plana de un tono (estudio: sin grano que sume ruido). */
function losaPisoJumbo(lado, mat) {
  const g = new THREE.BoxGeometry(lado, 0.2, lado).translate(0, -0.1, 0);
  const c = new Float32Array(g.attributes.position.count * 3), k = rgb("#857f77");
  for (let i = 0; i < c.length; i += 3) c.set(k, i);
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true;
  return m;
}

/** Normales suavizadas (solo para la luz): promedia cada normal con las de sus vecinos por arista, `vueltas` veces, en
 * los grupos pedidos. La posición no cambia (la física aprobada es la misma); se calma el sombreado fino del relieve. */
function suavizarNormalesJumbo(g, grupos = [0, 1], vueltas = 3, eps = 1e-5) {
  const P = g.attributes.position, N = g.attributes.normal, n = P.count, I = g.index.array;
  const k = (i) => `${Math.round(P.getX(i) / eps)},${Math.round(P.getY(i) / eps)},${Math.round(P.getZ(i) / eps)}`;
  const id = new Map(), sol = new Int32Array(n); for (let i = 0; i < n; i++) { const c = k(i); if (!id.has(c)) id.set(c, id.size); sol[i] = id.get(c); }
  const m = id.size, en = new Uint8Array(m), vec = Array.from({ length: m }, () => new Set());
  for (const q of g.groups) if (grupos.includes(q.materialIndex)) for (let t = q.start; t < q.start + q.count; t += 3) {
    const a = sol[I[t]], b = sol[I[t + 1]], c = sol[I[t + 2]]; en[a] = en[b] = en[c] = 1;
    vec[a].add(b).add(c); vec[b].add(a).add(c); vec[c].add(a).add(b);
  }
  let v = new Float32Array(m * 3);
  for (let i = 0; i < n; i++) { const s = sol[i]; v[s * 3] += N.getX(i); v[s * 3 + 1] += N.getY(i); v[s * 3 + 2] += N.getZ(i); }
  for (let r = 0; r < vueltas; r++) {
    const w = v.slice();
    for (let s = 0; s < m; s++) { if (!en[s]) continue; for (const o of vec[s]) { w[s * 3] += v[o * 3]; w[s * 3 + 1] += v[o * 3 + 1]; w[s * 3 + 2] += v[o * 3 + 2]; } }
    for (let s = 0; s < m; s++) { const L = Math.hypot(w[s * 3], w[s * 3 + 1], w[s * 3 + 2]) || 1; w[s * 3] /= L; w[s * 3 + 1] /= L; w[s * 3 + 2] /= L; }
    v = w;
  }
  const marca = new Uint8Array(n);
  for (const q of g.groups) if (grupos.includes(q.materialIndex)) for (let t = q.start; t < q.start + q.count; t++) marca[I[t]] = 1;
  for (let i = 0; i < n; i++) if (marca[i]) { const s = sol[i]; N.setXYZ(i, v[s * 3], v[s * 3 + 1], v[s * 3 + 2]); }
  N.needsUpdate = true;
  return g;
}
/** Colores suavizados (solo dibujo): promedia el color de cada vértice con sus vecinos, `vueltas` veces: el tono por
 * bloque y el oscurecido de las juntas quedan como manchas suaves (las juntas las dibujan las trazas). */
function suavizarColoresJumbo(g, grupos = [0, 1], vueltas = 4, eps = 1e-5) {
  const P = g.attributes.position, C = g.attributes.color, n = P.count, I = g.index.array;
  const k = (i) => `${Math.round(P.getX(i) / eps)},${Math.round(P.getY(i) / eps)},${Math.round(P.getZ(i) / eps)}`;
  const id = new Map(), sol = new Int32Array(n); for (let i = 0; i < n; i++) { const c = k(i); if (!id.has(c)) id.set(c, id.size); sol[i] = id.get(c); }
  const m = id.size, vec = Array.from({ length: m }, () => new Set()), marca = new Uint8Array(n), cuenta = new Float32Array(m);
  for (const q of g.groups) if (grupos.includes(q.materialIndex)) for (let t = q.start; t < q.start + q.count; t += 3) {
    const a = sol[I[t]], b = sol[I[t + 1]], c = sol[I[t + 2]]; marca[I[t]] = marca[I[t + 1]] = marca[I[t + 2]] = 1;
    vec[a].add(b).add(c); vec[b].add(a).add(c); vec[c].add(a).add(b);
  }
  let v = new Float32Array(m * 3);
  for (let i = 0; i < n; i++) if (marca[i]) { const s = sol[i]; v[s * 3] += C.getX(i); v[s * 3 + 1] += C.getY(i); v[s * 3 + 2] += C.getZ(i); cuenta[s]++; }
  for (let s = 0; s < m; s++) if (cuenta[s]) { v[s * 3] /= cuenta[s]; v[s * 3 + 1] /= cuenta[s]; v[s * 3 + 2] /= cuenta[s]; }
  for (let r = 0; r < vueltas; r++) {
    const w = v.slice();
    for (let s = 0; s < m; s++) { if (!vec[s].size) continue; for (const o of vec[s]) for (let q = 0; q < 3; q++) w[s * 3 + q] += v[o * 3 + q]; for (let q = 0; q < 3; q++) w[s * 3 + q] /= vec[s].size + 1; }
    v = w;
  }
  for (let i = 0; i < n; i++) if (marca[i]) { const s = sol[i]; C.setXYZ(i, v[s * 3], v[s * 3 + 1], v[s * 3 + 2]); }
  C.needsUpdate = true;
  return g;
}

async function montar(ctx) {
  const NIEBLA = [8, 30]; // m: niebla de la galería (cerca, lejos)
  const m = montajeJumbo();
  // corte de cámara (kit/estudio.js): con la cámara dentro de la roca, un plano corta lo que tapa la vista y la roca
  // seccionada se pinta con su tapa (no bandas huecas)
  const esc = crearEscena(ctx.contenedor, { fondo: "subterraneo", niebla: NIEBLA, exposicion: 0.7, fov: 46, cerca: 0.05, lejos: 300, corte: m.ter, corteOp: { opacidadBorde: 0.35 }, estudio: true }); // contorno del corte con la tinta de la lámina (≈ 0,35) // estudio: mapeo lineal
  const EXP_GALERIA = esc.renderer.toneMappingExposure; // patio: × 1,25
  const { scene } = esc;
  const niebla = scene.fog;
  const { M, gal, mac, malla, taladros, XF, X0 } = m;
  const LUZ_BLANCA = "#ffffff"; // luces neutras: no tiñen el papel
  // ── motor B: UN bloque de roca cerrado (galería + frente rugoso + caja), trazas de juntas, sostenimiento y servicios
  const matRoca = materialRoca({ humedad: true, regiones: true, escala: 1.4, fuerza: 0.08, escala2: 5, fuerza2: 0.02, variacion: 0.05, apagar: 0.5 });
  const matFrente = materialRoca({ escala: 1.6, fuerza: 0.1, escala2: 6, fuerza2: 0.02, variacion: 0.05, apagar: 0.5 }); // opaco y tapado; rayos X: sinTapa
  const matCaja = materialRoca({ escala: 1.4, fuerza: 0.05, escala2: 5, fuerza2: 0.01, variacion: 0.03, apagar: 0.5 }); // roca calma: sin humedad ni regiones
  const blq = macizoCerrado(gal, { frente: m.supFrente, caja: m.caja });
  suavizarNormalesJumbo(blq.geometria, [0, 1], 6); // luz calma sobre el relieve (las posiciones no cambian)
  suavizarColoresJumbo(blq.geometria, [0, 1], 4);
  const roca = new THREE.Mesh(blq.geometria, [matRoca, matFrente, matCaja]); roca.receiveShadow = roca.castShadow = true; scene.add(roca);
  // trazas de juntas tenues, 2 cm del lado del aire: tras la tapa de un corte quedan ocultas por la propia roca
  const trazasGal = lineasTrazas(trazasSobreMalla(mac.dfn, gal.geometria, { desplazar: 0.02, maxNormalY: 0.98 }), { opacidad: 0.05 });
  scene.add(trazasGal);
  const trazasFrente = lineasTrazas(trazasSobreMalla(mac.dfn, blq.frente, { desplazar: 0.02, maxNormalY: 0.98 }), { opacidad: 0.06 });
  scene.add(trazasFrente);
  const pern = pernos(gal, { x0: -8.5, x1: XF - 1.5, espaciado: 1.5, desdeY: 1.3 });
  scene.add(pern);
  const manga = mangaVentilacion({ x0: X0, x1: XF - 14, y: 3.72, z: -1.1, diametro: 0.5, color: tono("gris") });
  scene.add(manga);
  const tubosServ = tuberias({ x0: X0, x1: XF - 3, z: 1.88, alturas: [1.5, 1.75], colores: [tono("acero"), tono("negro")] });
  scene.add(tubosServ);
  const agua = charcos(gal, { cantidad: 5, x0: X0 + 2, x1: XF - 2 });
  scene.add(agua);
  // pintura de la malla (cargado y vacío, tokens) sobre el emboquille real, y la línea de gradiente: el tema, en color
  const v3 = (a) => new THREE.Vector3(...a);
  const pintura = new THREE.Group();
  pintura.userData.calco = "pintura de la malla y línea de gradiente (pegadas al frente)";
  const matRojo = new THREE.MeshBasicMaterial({ color: tono("cargado") }), matAzul = new THREE.MeshBasicMaterial({ color: tono("vacio") }); // tokens de codificación (S ≤ 0,45)
  for (const t of taladros) {
    const anillo = new THREE.Mesh(new THREE.RingGeometry(t.diam * 0.9 + 0.025, t.diam * 0.9 + 0.05, 20), t.cargado ? matRojo : matAzul);
    anillo.position.copy(v3(t.collar)).add(new THREE.Vector3(-0.06, 0, 0)); anillo.rotation.y = -Math.PI / 2; pintura.add(anillo);
  }
  const gradiente = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.04), matRojo);
  gradiente.rotation.y = -Math.PI / 2; gradiente.position.set(Math.min(...taladros.filter((x) => x.y < 1.3).map((x) => x.collar[0])) - 0.08, 1.0, 0); pintura.add(gradiente);
  scene.add(pintura);
  // taladros: boca oscura en el frente y tubo dentro del macizo (vista de rayos X); contrato A → B: los perfora el jumbo
  const bocas = new THREE.Group(), tubos = new THREE.Group(), matBoca = new THREE.MeshBasicMaterial({ color: "#050505" });
  bocas.userData.calco = "bocas de taladro (disco oscuro pegado al frente)";
  for (const t of taladros) {
    const boca = new THREE.Mesh(new THREE.CircleGeometry(t.diam / 2 + 0.008, 16), matBoca);
    boca.position.copy(v3(t.collar)).add(new THREE.Vector3(-0.065, 0, 0)); boca.rotation.y = -Math.PI / 2; boca.visible = false; bocas.add(boca);
    const tubo = new THREE.Mesh(new THREE.CylinderGeometry(t.diam / 2, t.diam / 2, 1, 10).rotateZ(-Math.PI / 2).translate(0.5, 0, 0), tapar(new THREE.MeshBasicMaterial({ color: COLORES_GRUPO[t.grupo] })));
    tubo.position.copy(v3(t.collar)); tubo.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), v3(t.dir)); tubo.scale.x = 0.001; tubo.visible = false; tubos.add(tubo);
    t.boca = boca; t.tubo = tubo;
  }
  scene.add(bocas, tubos);
  // ── motor A: el jumbo asentado y con sus gatas en el piso
  const dib = mallasMaquina(M, EQUIPO_JUMBO.dibujo);
  scene.add(dib.raiz);
  for (const l of ["i", "d"]) { // faro de trabajo en cada viga, hacia el frente
    const g = M.dims.geo[l], luz = new THREE.SpotLight(LUZ_BLANCA, 7, 25, 0.6, 0.5, 1.5);
    luz.position.set(g.xr + 0.4, g.yAx + 0.4, g.zT); luz.target.position.set(g.xr + 9, g.yAx, g.zT);
    luz.castShadow = l === "i"; dib.grupo(`viga ${l}`).add(luz, luz.target);
  }
  const neblina = polvo({ max: 400, color: "#cdcbc6", tam: 0.12, viento: [-0.6, 0.25, 0], vida: 3, opacidad: 0.14 });
  neblina.puntos.material.uniforms.uEscala.value = 600; scene.add(neblina.puntos);
  const casco = new THREE.SpotLight(LUZ_BLANCA, 4, 40, 0.85, 0.9, 1.4); scene.add(casco, casco.target);
  // estudio: relleno parejo y neutro (luz de estudio) en vez de focos duros: el relieve se lee sin ruido de sombras
  const fill = new THREE.HemisphereLight("#ffffff", "#666666", 1.0); scene.add(fill);
  const lum = new THREE.PointLight(LUZ_BLANCA, 2.5, 16, 1.8); lum.position.set(X0 + 5, 3.3, 0.8); scene.add(lum);

  // ── ciclo: los dos brazos con sus turnos (programador anticolisión), perforan y el frente recibe los taladros
  let t = 0, anim = false, velocidad = 1, xray = false, modoSec = false, tSec = 0;
  const base = `${malla.taladros.filter((x) => x.cargado).length} cargados + ${malla.taladros.filter((x) => !x.cargado).length} vacíos · perforación ${malla.largo.toFixed(2)} m · barra ${M.dims.LB} m · Ø ${malla.diam * 1000} mm, alivio ${malla.diamAlivio * 1000} mm`;
  function aplicar(tt) {
    const e = m.estado(tt);
    dib.poner(e.valores);
    let hechos = 0;
    for (const x of taladros) {
      const h = e.hecho.get(x.id) || 0;
      x.boca.visible = h > 0.02; x.tubo.visible = h > 0.02 && xray; x.tubo.scale.x = Math.max(0.001, h * malla.largo);
      if (h >= 1) hechos++;
    }
    for (const a of e.activos) { const tl = taladros.find((x) => x.id === a.id); neblina.emitir(v3(tl.collar).add(new THREE.Vector3(-0.1, 0, 0)), 2, 0.15, 0.25); }
    return hechos;
  }
  const lect = (h) => ctx.lectura(modoSec ? textoSec : `Perforados ${h}/${taladros.length} · ${base}`);
  function ponerXray(v) {
    // rayos X: el frente transparente no pinta su tapa (sinTapa) y deja ver los taladros dentro del macizo;
    // al volver, opaco y tapado otra vez
    xray = v;
    if (v) sinTapa(matFrente);
    matFrente.transparent = v; matFrente.opacity = v ? 0.28 : 1; matFrente.depthWrite = !v;
    if (!v) tapar(matFrente);
    matFrente.needsUpdate = true;
    trazasFrente.visible = !v; aplicar(t); esc.marcar();
  }
  const retardos = [...new Set(taladros.filter((x) => x.cargado).map((x) => x.retardo))].sort((a, b) => a - b);
  let textoSec = "";
  function pintarSecuencia(ts) {
    const paso = 0.9, idx = Math.min(retardos.length, Math.floor(ts / paso)), actual = retardos[Math.min(idx, retardos.length - 1)];
    for (const x of taladros) {
      const mt = x.boca.material === matBoca ? (x.boca.material = new THREE.MeshBasicMaterial({ color: "#050505" })) : x.boca.material;
      x.boca.visible = true; x.boca.scale.setScalar(2.2);
      if (!x.cargado) { mt.color.set(tono("vacio")); continue; }
      mt.color.set(x.retardo <= actual ? COLORES_GRUPO[x.grupo] : "#1a1a1a");
      if (x.retardo === actual) mt.color.offsetHSL(0, 0, 0.15 * Math.sin(ts * 12));
    }
    const g = taladros.find((x) => x.retardo === actual);
    textoSec = `Secuencia de salida · retardo ${actual} · ${g?.grupo} (${taladros.filter((x) => x.retardo === actual).length} taladros) · primero el arranque abre la cara libre hacia los alivios`;
    return ts > retardos.length * paso + 1.5;
  }
  function salirSecuencia() { for (const x of taladros) { x.boca.material = matBoca; x.boca.scale.setScalar(1); } modoSec = false; lect(aplicar(t)); esc.marcar(); }
  esc.alAnimar((dt) => {
    neblina.actualizar(dt);
    casco.position.copy(esc.camera.position).add(new THREE.Vector3(0, 0.3, 0)); casco.target.position.copy(esc.controls.target);
    if (modoSec) { tSec += dt; if (pintarSecuencia(tSec)) tSec = 0; ctx.lectura(textoSec); return true; }
    if (anim) { t += dt * velocidad; if (t > m.T) t = 0; lect(aplicar(t)); }
    return true;
  });
  lect(aplicar(0));
  const btn = document.getElementById("perforar"), btnSec = document.getElementById("secuencia");
  const ponerBtn = () => { if (!btn) return; btn.textContent = anim ? "Pausar" : "Perforar"; btn.setAttribute("aria-pressed", String(anim)); };
  btn?.addEventListener("click", () => { if (modoSec) salirSecuencia(); anim = !anim; ponerBtn(); esc.marcar(); });
  btnSec?.addEventListener("click", () => { modoSec = !modoSec; btnSec.setAttribute("aria-pressed", String(modoSec)); if (modoSec) { anim = false; ponerBtn(); tSec = 0; } else salirSecuencia(); esc.marcar(); });
  document.getElementById("xray")?.addEventListener("change", (ev) => ponerXray(ev.target.checked));
  document.getElementById("lamina")?.addEventListener("change", (ev) => { dib.lamina(ev.target.checked); esc.marcar(); });
  const vel = document.getElementById("vel");
  vel?.addEventListener("input", () => { velocidad = +vel.value; document.querySelector('output[for="vel"]').textContent = "×" + velocidad; });
  const prog = document.getElementById("progreso");
  prog?.addEventListener("input", () => { anim = false; ponerBtn(); if (modoSec) salirSecuencia(); t = (+prog.value / 100) * m.T; lect(aplicar(t)); document.querySelector('output[for="progreso"]').textContent = prog.value + " %"; esc.marcar(); });
  if (!esc.quieto.matches) { anim = true; ponerBtn(); }
  // ── piezas señalables
  const enGrupo = (g) => () => { const ts = taladros.filter((x) => x.grupo === g); const c = ts.reduce((a, x) => a.add(v3(x.collar)), new THREE.Vector3()).multiplyScalar(1 / ts.length); return c.add(new THREE.Vector3(-0.3, 0, 0)); };
  const P = (g, p, off = [0, 0, 0]) => () => v3(dib.mundo(g, p)).add(v3(off));
  const gi = M.dims.geo.i, gd = M.dims.geo.d;
  const piezas = [
    { id: "alivios", numero: 1, nombre: "Alivios", definicion: "4 taladros vacíos de 102 mm en el centro: son la cara libre hacia donde rompe el arranque.", ancla: () => new THREE.Vector3(XF - 0.3, 2.1, -0.05) },
    { id: "arranque", numero: 2, nombre: "Arranque", definicion: "3 taladros cargados pegados a los alivios; salen primero (retardos 1 a 3) y abren el hueco.", ancla: () => new THREE.Vector3(XF - 0.3, 1.75, 0.35) },
    { id: "ayudas", numero: 3, nombre: "Ayudas", definicion: "4 anillos de taladros (retardos 4 a 9) que agrandan el hueco hacia afuera, cuadro por cuadro.", ancla: enGrupo("3ra ayuda") },
    { id: "cuadradores", numero: 4, nombre: "Cuadradores", definicion: "4 taladros en los hastiales (retardo 10): dan el ancho de 4,0 m.", ancla: () => v3(taladros.find((x) => x.grupo === "cuadrador").collar).add(new THREE.Vector3(-0.3, 0, 0)) },
    { id: "corona", numero: 5, nombre: "Corona", definicion: "5 cargados y 4 vacíos alternados en la bóveda (retardo 12): voladura controlada para no sobreexcavar el techo.", ancla: () => new THREE.Vector3(XF - 0.3, 3.95, 0) },
    { id: "arrastres", numero: 6, nombre: "Arrastres", definicion: "5 taladros al piso, los últimos en salir (retardo 13). La viga los perfora girada 180°, bajo la muñeca.", ancla: () => new THREE.Vector3(XF - 0.3, 0.3, 0.9) },
    { id: "brazo", numero: 7, nombre: "Brazo", definicion: "Gira en su rótula, sube con su cilindro y se extiende 1,25 m: lleva la muñeca frente a cada taladro.", ancla: P(gi.grupos.gA, [3.6, 1.75, gi.z0]), objetos: dib.objetosDe("brazo") },
    { id: "viga", numero: 8, nombre: "Viga de avance", definicion: "Riel de aluminio de 5,3 m: avanza por su cuna hasta apoyar el centralizador en la roca.", ancla: P(gd.grupos.gV, [gd.xr + 2.5, gd.yAx - 0.2, gd.zT], [0, 0.2, 0]), objetos: dib.objetosDe("viga") },
    { id: "perforadora", numero: 9, nombre: "Perforadora", definicion: "Martillo hidráulico que golpea y gira la barra; corre 3,9 m sobre la viga.", ancla: P(gi.grupos.gP, [gi.xr + 0.5, gi.yAx + 0.15, gi.zT]), objetos: dib.objetosDe("perforadora") },
    { id: "barra", numero: 10, nombre: "Barra y broca", definicion: "Barra de 14 pies (4,27 m) y broca de 51 mm: perfora 3,90 m de taladro.", ancla: P(gd.grupos.gP, [gd.xr + 3.5, gd.yAx + 0.05, gd.zT]), objetos: dib.objetosDe("barra") },
    { id: "techo", numero: 11, nombre: "Puesto del operador", definicion: "Bajo el techo protector, detrás de los brazos, a unos 9 m del frente sin sostener.", ancla: P("base", [-0.4, 2.55, 0.6]), objetos: dib.objetosDe("techo") },
    { id: "gatas", numero: 12, nombre: "Gatas", definicion: "Cuatro cilindros que bajan sus pies hasta el piso: el jumbo no se mueve mientras perfora.", ancla: P("base", [1.48, 0.5, 0.97]), objetos: dib.objetosDe("gatas") },
    { id: "pintura", numero: 13, nombre: "Malla pintada", definicion: "El topógrafo pinta cada taladro (rojo cargado, azul vacío) y la línea de gradiente a 1 m del piso.", ancla: () => new THREE.Vector3(XF - 0.2, 1.0, -1.5), objetos: [pintura] },
  ];
  const senal = senalar(esc, ctx.contenedor, piezas, { modo: ctx.modo, foco: ctx.foco });
  // galería visible u oculta (fotos del jumbo al aire libre)
  const deGaleria = scene.children.filter((o) => o !== dib.raiz && o !== neblina.puntos && !o.isLight && o !== casco.target);
  deGaleria.push(lum, fill);
  // patio al aire libre: losa cerrada de ripio con relieve fino (motor B, mismo material de roca, calmo)
  const piso = losaPisoJumbo(90, materialRoca({ escala: 0.6, fuerza: 0, escala2: 2, fuerza2: 0, variacion: 0.05, apagar: 0.5 }));
  piso.visible = false; piso.position.x = -8; scene.add(piso);
  const sol = new THREE.DirectionalLight(LUZ_BLANCA, 1.8); sol.position.set(-14, 20, 12); sol.target.position.set(-8, 0, 0); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 }); sol.visible = false; scene.add(sol, sol.target);
  const cielo = new THREE.HemisphereLight("#d6d5d1", "#8a867e", 1.9); cielo.visible = false; scene.add(cielo); // neutros
  const FONDO_EXT = "#c4c4c1", FONDO_SUB = esc.fondo ?? "#050505"; // patio: gris neutro · galería: token `fondo` (papel)
  function verGaleria(v) {
    for (const o of deGaleria) o.visible = v;
    piso.visible = sol.visible = cielo.visible = !v;
    // sin galería no hay roca a la vista: el corte de cámara se apaga (si no, cortaría la máquina dentro del bloque oculto)
    if (v) esc.corte?.encender(); else esc.corte?.apagar(); // el plano fijo (corte lateral) sigue puesto al volver
    if (lateral) tubosServ.visible = false;
    esc.renderer.toneMappingExposure = EXP_GALERIA * (v ? 1 : 1.25);
    scene.background = new THREE.Color(v ? FONDO_SUB : FONDO_EXT); scene.fog = v && !lateral ? niebla : null;
    esc.controls.maxDistance = v ? 18 : 40; esc.marcar();
  }
  // corte lateral (vista de estudio por defecto): plano fijo del corte de cámara (esc.corte.fijar, tapa por stencil y
  // contorno en tinta; oculta lo que queda dentro de la roca). Se conserva z ≤ ZC0 + K·x: el plano es global (corta
  // también al equipo) y la perforadora llega a z = 2,01 m al hacer los cuadradores junto al frente, así que el plano
  // se abre hacia el frente (2,1 m en x = 0; 1,62 m en x = −16, fuera del carrier de ±1,15 m). Medido en el ciclo.
  const K = 0.03, ZC0 = 2.1;
  const plano = new THREE.Plane(new THREE.Vector3(K, 0, -1).normalize(), 0); plano.constant = ZC0 / Math.hypot(K, 1);
  const VISTA_ESTUDIO = [new THREE.Vector3(XF - 8, 1.2, 0), 210, 26, 19]; // 3/4 desde atrás: el jumbo entero, brazos, vigas y el frente
  let lateral = false;
  function corte(v, mover = true) {
    lateral = v;
    scene.fog = roca.visible && !v ? niebla : null; // vista de corte: sin niebla (se mira desde fuera del bloque)
    tubosServ.visible = !v && roca.visible;
    esc.corte?.fijar(v ? plano : null);
    if (mover) { if (v) esc.mirar(...VISTA_ESTUDIO); else esc.mirar(new THREE.Vector3(XF - 6, 1.6, 0), 270, 4, 16); }
    esc.controls.maxDistance = v ? 26 : 18; esc.controls.maxPolarAngle = v ? Math.PI * 0.45 : Math.PI * 0.62; esc.marcar();
    const cb = document.getElementById("corte"); if (cb) cb.checked = v;
  }
  document.getElementById("corte")?.addEventListener("change", (ev) => corte(ev.target.checked));
  corte(true);
  esc.controls.minDistance = 1.5;
  window.GEO = {
    escena: esc, senal, jumbo: dib, modelo: M, montaje: m,
    verGaleria,
    igualarVista: (v) => {
      corte(!!v.corte, false);
      verGaleria(v.galeria !== false);
      if (v.progreso !== undefined) { anim = false; ponerBtn(); t = v.progreso * m.T; lect(aplicar(t)); }
      esc.mirar(new THREE.Vector3(...v.objetivo), v.az, v.el, v.dist);
    },
  };
}
