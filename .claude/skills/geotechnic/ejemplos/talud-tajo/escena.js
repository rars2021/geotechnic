// Ejemplo · corte de talud de tajo, a la manera de una pared de Antamina (números en ficha.mjs). Estudio v3, ambiente
// abierto (references/categorias.md): el talud es UN bloque cerrado (bloqueTalud) con su contrato exacto (terrenoTalud)
// y la cámara choca con el terreno en vez de cortarlo. El talud y el camión vienen de montaje.js (lo que juzga el juez).
import * as THREE from "three";
import { crearEscena } from "../../kit/escena.js";
import { escombrosTalud, mediasCanas, cerros, sDeBanco, pretil } from "../../kit/terreno.js";
import { trazasSobreMalla, lineasTrazas } from "../../kit/fracturas.js";
import { materialRoca } from "../../kit/materiales.js";
import { mallasMaquina } from "../../motorA/mallas.js";
import { EQUIPO_CAMION } from "../../equipos/camion/modelo.js";
import { tono, tapar, retintar, temaActual } from "../../kit/estudio.js";
import { grad, rad } from "../../kit/nucleo.js";
import { senalar } from "../../kit/senalar.js";
import { montajeTalud } from "./montaje.js";

/** Normales suavizadas (solo para la luz): promedia cada normal con las de sus vecinos por arista, `vueltas` veces, en
 * los grupos pedidos. La posición no cambia (la física aprobada es la misma); se calma el sombreado fino del relieve. */
function suavizarNormalesTalud(g, grupos = [0, 1], vueltas = 3, eps = 1e-5) {
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
function suavizarColoresTalud(g, grupos = [0, 1], vueltas = 4, eps = 1e-5) {
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
  const m = montajeTalud();
  const { LARGO, color } = m;
  let actual = { talud: m.talud, blq: m.blq, ter: m.ter, bfa2: m.bfa2 };
  // la colisión recibe el terreno una vez: un envoltorio que delega al talud vigente (el control lo rehace)
  const terVivo = { libre: (p) => actual.ter.libre(p), piso: (x, z) => actual.ter.piso(x, z), get caja() { return actual.ter.caja; }, get pendienteLibre() { return actual.ter.pendienteLibre; } };
  const esc = crearEscena(ctx.contenedor, { fondo: "subterraneo", estudio: true, ambiente: "abierto", corte: terVivo, exposicion: 1.0, fov: 38, cerca: 0.5, lejos: 20000 });
  const { scene } = esc;
  // ── luz de estudio: cielo parejo y sol bajo del oeste (neutros: no tiñen el papel)
  scene.add(new THREE.HemisphereLight("#ffffff", "#8a8780", 1.8));
  const sol = new THREE.DirectionalLight("#ffffff", 1.1);
  sol.position.set(-160, 120, 60); sol.target.position.set(0, 15, -20);
  sol.castShadow = true; sol.shadow.mapSize.set(4096, 4096); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.08;
  Object.assign(sol.shadow.camera, { left: -110, right: 110, top: 110, bottom: -110, near: 10, far: 500 });
  scene.add(sol, sol.target);
  // estudio: roca calma (sin relieve fino de sombreado; la mitad de la saturación)
  const matRoca = materialRoca({ humedad: true, regiones: true, escala: 0.55, fuerza: 0, escala2: 2.2, fuerza2: 0, variacion: 0, apagar: 0.5 });
  const matTapa = materialRoca({ escala: 0.6, fuerza: 0, escala2: 2.5, fuerza2: 0, variacion: 0.02, apagar: 0.5 });
  const matCanas = tapar(new THREE.MeshStandardMaterial({ color: tono("gris"), roughness: 0.85 })); matCanas.userData.token = "gris";
  const grupo = new THREE.Group();
  scene.add(grupo);
  let malla, trazas, escombros, canas;
  function rehacer(bfa2) {
    for (const o of [malla, trazas, escombros, canas]) if (o) { grupo.remove(o); o.traverse?.((q) => q.geometry?.dispose()); }
    if (bfa2 !== actual.bfa2) actual = m.construir(bfa2);
    const { talud, blq } = actual;
    // estudio: luz y color calmos sobre el relieve (solo dibujo: las posiciones, que juzga el juez, no cambian)
    suavizarNormalesTalud(blq.geometria, [0], 4); suavizarColoresTalud(blq.geometria, [0], 3);
    malla = new THREE.Mesh(blq.geometria, [matRoca, matTapa]); // grupo 0 talud, 1 tapas de sección (un sólido cerrado)
    malla.castShadow = malla.receiveShadow = true;
    grupo.add(malla);
    trazas = lineasTrazas(trazasSobreMalla(m.dfn, talud.geometria, { desplazar: 0.05 }), { opacidad: 0.07 });
    grupo.add(trazas);
    escombros = escombrosTalud(talud, { cantidad: 900, tamMedio: 0.26, desvTam: 0.22, color: (x, y, z) => color(x, y, z).map((v) => v * 0.92) });
    grupo.add(escombros);
    canas = new THREE.Mesh(mediasCanas(talud, 0, { espaciado: 16 * 0.127, diametro: 0.127, visibles: 0.62 }), matCanas);
    canas.userData.calco = "medias cañas: mitades de taladro pegadas a la cara";
    grupo.add(canas);
    const iraG = grad(Math.atan(45 / (15 / Math.tan(rad(71)) + 15 / Math.tan(rad(actual.bfa2)) + 15 / Math.tan(rad(65)) + 15)));
    ctx.lectura(`Cara del banco 2: ${actual.bfa2}° · ángulo interrampa (pie a pie, 3 bancos): ${iraG.toFixed(1)}° · banco 15 m · berma 7,5 m`);
    esc.marcar();
  }
  rehacer(m.bfa2);
  // cerros de fondo (sólido cerrado) y pretil de la vía
  const montes = new THREE.Mesh(cerros({ tam: [16000, 16000], res: 360, alto: 1100, base: -60, centro: [0, -4000], hueco: { x: 0, z: -300, r: 2600 }, cotaNieve: 1250, semilla: 5, colores: { pasto: "#a49c8c", roca: "#7d7a74", nieve: "#eef1f3" }, cerrado: { fondo: -160 } }),
    materialRoca({ escala: 0.01, fuerza: 0, fuerza2: 0, variacion: 0, apagar: 0.5 }));
  montes.position.y = 46; // la base del bloque (-14) queda sobre el piso del tajo
  scene.add(montes);
  const curvaPretil = new THREE.CatmullRomCurve3([new THREE.Vector3(-LARGO / 2, 0, 31), new THREE.Vector3(0, 0, 31.4), new THREE.Vector3(LARGO / 2, 0, 31)]);
  const muro = new THREE.Mesh(pretil(curvaPretil, { alto: 2, ancho: 3, color: "#a7a49c", cerrado: true }), materialRoca({ escala: 1.2, fuerza: 0.05, fuerza2: 0, variacion: 0.02, apagar: 0.5 }));
  muro.castShadow = muro.receiveShadow = true;
  scene.add(muro);
  // camión del motor A al pie, para escala (asentado en el piso del contrato)
  const camion = mallasMaquina(m.Mc, EQUIPO_CAMION.dibujo);
  camion.poner(m.valoresCamion(actual.ter));
  scene.add(camion.raiz);
  // ── piezas señalables
  const P = (u, s, sobre = 0.6) => () => { const q = actual.talud.muestra(u, s); return q.p.clone().addScaledVector(q.n, sobre); };
  const sb = (b) => sDeBanco(actual.talud.perfil, b);
  const piezas = [
    { id: "cara", numero: 1, nombre: "Cara del banco", definicion: "Superficie excavada entre pie y cresta. 15 m de alto; 71° con precorte, 65° con voladura amortiguada.", ancla: P(-30, (sb(1).pie + sb(1).cresta) / 2), region: { material: matRoca, valor: 2 } },
    { id: "cresta", numero: 2, nombre: "Cresta", definicion: "Borde superior de la cara. La voladura la rompe y la hace retroceder: no es una arista.", ancla: P(5, sb(1).cresta, 1.2), region: { material: matRoca, valor: 8 } },
    { id: "pie", numero: 3, nombre: "Pie y talud de escombros", definicion: "Donde la cara se apoya en la berma. El material caído forma un talud a su ángulo de reposo (≈ 34°).", ancla: P(18, sb(1).pie - 2.5, 1), region: { material: matRoca, valor: 9 }, objetos: [] },
    { id: "berma", numero: 4, nombre: "Berma", definicion: "Banqueta que atrapa las rocas que caen. 7,5 m para un banco de 15 m (Ritchie modificada).", ancla: P(-8, sb(0).cresta + 4.5, 0.8), region: { material: matRoca, valor: 4 } },
    { id: "canas", numero: 5, nombre: "Medias cañas", definicion: "Mitades de taladros de precorte de 127 mm que quedan en la cara final, cada ≈ 2 m.", ancla: P(-22, (sb(0).pie + sb(0).cresta) / 2 + 2, 0.5), objetos: [] },
    { id: "familias", numero: 6, nombre: "Familias de fracturas", definicion: "Tres familias de juntas: sus trazas cortan la cara en líneas que terminan donde termina cada junta.", ancla: P(30, (sb(2).pie + sb(2).cresta) / 2, 0.6), lineas: [] },
    { id: "falla", numero: 7, nombre: "Falla con panizo", definicion: "Zona triturada de arcilla oscura. Se hunde en la cara, está húmeda y altera la roca a su alrededor.", ancla: () => new THREE.Vector3(17, 33, -46), region: { material: matRoca, valor: 10 } },
    { id: "oxidos", numero: 8, nombre: "Zona de óxidos", definicion: "Los óxidos de hierro tiñen las fracturas y chorrean cara abajo; la zona se desvanece hacia afuera.", ancla: P(-30, (sb(2).pie + sb(2).cresta) / 2, 0.6), region: { material: matRoca, valor: 11 } },
    { id: "agua", numero: 9, nombre: "Filtración", definicion: "Bajo la línea de surgencia la roca se oscurece y el agua baja en chorreras desde las fracturas.", ancla: P(26, sb(0).pie + 3, 0.6), region: { material: matRoca, valor: 12 } },
  ];
  const ponerObjetos = () => { piezas[4].objetos = [canas]; piezas[2].objetos = [escombros]; };
  ponerObjetos();
  Object.defineProperty(piezas[5], "lineas", { get: () => trazas.children });
  const senal = senalar(esc, ctx.contenedor, piezas, { modo: ctx.modo, foco: ctx.foco });
  // ── controles: ángulo de cara del banco 2, trazas, lámina
  const input = document.getElementById("bfa2"), out = document.querySelector('output[for="bfa2"]');
  if (input) input.addEventListener("change", () => { out.textContent = input.value + "°"; rehacer(+input.value); ponerObjetos(); });
  if (input) input.addEventListener("input", () => { out.textContent = input.value + "°"; });
  document.getElementById("ver-trazas")?.addEventListener("change", (ev) => { trazas.visible = ev.target.checked; esc.marcar(); });
  document.getElementById("lamina")?.addEventListener("change", (ev) => { camion.lamina(ev.target.checked); esc.marcar(); });
  // tema claro / oscuro
  const retemar = () => { retintar(scene, temaActual()); esc.marcar(); };
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", retemar);
  new MutationObserver(retemar).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  // un cambio de tamaño borra el canvas: se redibuja en el acto (las capturas no esperan al bucle)
  new ResizeObserver(() => esc.renderizar()).observe(ctx.contenedor);
  // cámara
  esc.mirar(new THREE.Vector3(-4, 22, -2), 202, 14, 118); // objetivo en el aire, frente a la cara (abierto: colisión)
  esc.controls.minDistance = 8; esc.controls.maxDistance = 600;
  window.GEO = {
    escena: esc, senal, montaje: m, camion,
    igualarVista: (v) => { esc.mirar(new THREE.Vector3(...v.objetivo), v.az, v.el, v.dist); esc.controls.update(); esc.renderizar(); },
  };
}
