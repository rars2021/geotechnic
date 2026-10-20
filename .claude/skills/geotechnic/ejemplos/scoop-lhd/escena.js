// Ejemplo · scoop (LHD) CAT R1600G de 6 yd³ en una galería de 4,0 × 4,0 m, con ciclo de carguío.
// Motor A (equipo, equipos/scoop) dentro del motor B (roca): ambos vienen de montaje.js, el mismo que juzga el juez.
import * as THREE from "three";
import { crearEscena } from "../../kit/escena.js";
import { macizoCerrado, pernos, mangaVentilacion, tuberias, charcos } from "../../kit/labor.js";
import { trazasSobreMalla, lineasTrazas } from "../../kit/fracturas.js";
import { goteo, polvo } from "../../kit/volumenes.js";
import { materialRoca, materialPintura, MATERIALES } from "../../kit/materiales.js";
import { monton } from "../../kit/equipos.js";
import { mallasMaquina } from "../../motorA/mallas.js";
import { EQUIPO_SCOOP } from "../../equipos/scoop/modelo.js";
import { rgb, lerp } from "../../kit/nucleo.js";
import { tono, tapar } from "../../kit/estudio.js";
import { senalar } from "../../kit/senalar.js";
import { montajeScoop } from "./montaje.js";

/** Losa cerrada de piso exterior (patio): caja con relieve fino arriba y colores por posición (sin costuras). */
function losaPisoScoop(lado, segs, mat) {
  const g = new THREE.BoxGeometry(lado, 0.2, lado, segs, 1, segs).translate(0, -0.1, 0);
  const P = g.attributes.position, n = P.count, c = new Float32Array(n * 3);
  const h = (x, z, s) => { const v = Math.sin(x * 12.9898 + z * 78.233 + s) * 43758.5453; return v - Math.floor(v); };
  const tonos = ["#868079", "#807a72", "#8b857d"].map(rgb);
  for (let i = 0; i < n; i++) {
    const x = P.getX(i), z = P.getZ(i);
    if (P.getY(i) > -0.001) P.setY(i, -0.02 + 0.02 * h(x, z, 7));
    const t = h(x, z, 0); c.set(tonos[t < 0.33 ? 0 : t < 0.66 ? 1 : 2], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true;
  return m;
}

/** Normales suavizadas (solo para la luz): promedia cada normal con las de sus vecinos por arista, `vueltas` veces, en
 * los grupos pedidos. La posición no cambia (la física aprobada es la misma); se calma el sombreado fino del relieve. */
function suavizarNormalesScoop(g, grupos = [0, 1], vueltas = 3, eps = 1e-5) {
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
function suavizarColoresScoop(g, grupos = [0, 1], vueltas = 4, eps = 1e-5) {
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
  const NIEBLA = [6, 24]; // m: niebla de la galería (cerca, lejos)
  const m = montajeScoop();
  // corte de cámara (kit/estudio.js): con la cámara dentro de la roca, un plano corta lo que tapa la vista y la roca
  // seccionada se pinta con su tapa (no bandas huecas)
  const esc = crearEscena(ctx.contenedor, { fondo: "subterraneo", niebla: NIEBLA, exposicion: 0.87, fov: 48, cerca: 0.05, lejos: 400, corte: m.ter, corteOp: { opacidadBorde: 0.35 }, estudio: true }); // contorno del corte con la tinta de la lámina (≈ 0,35) // estudio: mapeo lineal
  const { scene } = esc;
  const niebla = scene.fog;
  const { M, gal, mac, XF, X0, X_ECH, MONTON } = m;
  const LUZ_BLANCA = "#ffffff"; // luces neutras: no tiñen el papel
  // ── motor B: UN bloque de roca cerrado (galería + frente + caja), trazas, sostenimiento, servicios, agua
  const matRoca = materialRoca({ humedad: true, regiones: true, escala: 1.4, fuerza: 0.08, escala2: 5, fuerza2: 0.02, variacion: 0.05, apagar: 0.5 });
  const matFrente = materialRoca({ escala: 1.4, fuerza: 0.08, escala2: 5, fuerza2: 0.02, variacion: 0.05, apagar: 0.5 });
  const matCaja = materialRoca({ escala: 1.4, fuerza: 0.05, escala2: 5, fuerza2: 0.01, variacion: 0.03, apagar: 0.5 }); // roca calma: sin humedad ni regiones
  const blq = macizoCerrado(gal, { frente: m.supFrente, caja: m.caja });
  suavizarNormalesScoop(blq.geometria, [0, 1], 6); suavizarColoresScoop(blq.geometria, [0, 1], 4); // luz calma sobre el relieve (las posiciones no cambian)
  const roca = new THREE.Mesh(blq.geometria, [matRoca, matFrente, matCaja]);
  roca.receiveShadow = true; roca.castShadow = true;
  scene.add(roca);
  // trazas de juntas tenues, 2 cm del lado del aire: tras la tapa de un corte quedan ocultas por la propia roca
  const tr = new THREE.Group();
  tr.add(lineasTrazas(trazasSobreMalla(mac.dfn, gal.geometria, { desplazar: 0.02, maxNormalY: 0.98 }), { opacidad: 0.07 }));
  tr.add(lineasTrazas(trazasSobreMalla(mac.dfn, blq.frente, { desplazar: 0.02, maxNormalY: 0.98 }), { opacidad: 0.14 }));
  scene.add(tr);
  const pern = pernos(gal, { x0: -4, x1: XF - 3, espaciado: 1.5, desdeY: 1.3 });
  scene.add(pern);
  const manga = mangaVentilacion({ x0: X0, x1: XF - 9, y: 3.72, z: -1.05, diametro: 0.5, color: tono("gris") });
  scene.add(manga);
  const tubos = tuberias({ x0: X0, x1: XF - 4, z: 1.88, alturas: [1.55, 1.8], colores: [tono("acero"), tono("negro")] });
  scene.add(tubos);
  const agua = charcos(gal, { cantidad: 7, x0: X0 + 2, x1: XF - 5 });
  scene.add(agua);
  const muck = monton({ ancho: 4.4, largo: MONTON, alto: 2.4, color: "#77726a", bloques: 260, semilla: 4 });
  for (const o of muck.children) tapar(o.material);
  muck.position.set(XF - 1.2, -0.05, 0);
  scene.add(muck);
  const echadero = new THREE.Group();
  const hueco = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#020202" }));
  hueco.userData.calco = "boca del echadero (hueco oscuro bajo la parrilla)";
  hueco.position.set(X_ECH, 0.015, 0); echadero.add(hueco);
  const matRiel = materialPintura("acero", { metal: 0.5, rugosidad: 0.55, suciedad: 0.35, alturaBarro: 0.3 });
  for (let k = -5; k <= 5; k++) { const r0 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 0.07), matRiel); r0.position.set(X_ECH, 0.05, k * 0.24); r0.castShadow = true; echadero.add(r0); }
  for (const dx of [-1.05, 1.05]) { const c0 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 2.75), matRiel); c0.position.set(X_ECH + dx, 0.06, 0); echadero.add(c0); }
  scene.add(echadero);
  // ── motor A: el scoop, pieza por pieza, con sus cilindros, barra en Z y mangueras
  const dib = mallasMaquina(M, EQUIPO_SCOOP.dibujo);
  scene.add(dib.raiz);
  // carga en el cucharón (material suelto: no es un sólido del juez) y faros con luz
  const cc = M.dims.cargaCucharon; // forma del cucharón CAT (equipos/scoop)
  const carga = monton({ ancho: cc.ancho, largo: cc.largo, alto: 0.7, color: "#7d786f", bloques: 80, semilla: 3 });
  for (const o of carga.children) tapar(o.material);
  carga.position.set(...cc.centro); carga.visible = false;
  dib.grupo("cucharon").add(carga);
  for (const s of [1, -1]) {
    const luz = new THREE.SpotLight(LUZ_BLANCA, 12, 45, 0.55, 0.45, 1.6);
    luz.position.set(2.32, 1.93, s * 1.08); luz.target.position.set(12, 0.9, s * 0.5);
    luz.castShadow = s > 0; if (s > 0) { luz.shadow.mapSize.set(1024, 1024); luz.shadow.bias = -0.0005; }
    dib.grupo("delantero").add(luz, luz.target);
  }
  // luces de ambiente: lámpara de casco que sigue a la cámara y una luminaria lejana
  const casco = new THREE.SpotLight(LUZ_BLANCA, 5, 40, 0.8, 0.9, 1.4);
  // estudio: relleno parejo y neutro (luz de estudio) en vez de focos duros: el relieve se lee sin ruido de sombras
  const fill = new THREE.HemisphereLight("#ffffff", "#666666", 0.9); scene.add(fill);
  scene.add(casco, casco.target);
  const lum = new THREE.PointLight(LUZ_BLANCA, 2, 18, 1.8); lum.position.set(X0 + 4, 3.3, 0.8); scene.add(lum);
  const foco = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), MATERIALES.luz(tono("luz"))); foco.position.copy(lum.position); scene.add(foco);
  const gotas = goteo([{ x: 1.2, y: 3.9, z: 0.6, piso: 0.02 }, { x: 6.5, y: 3.85, z: -0.4, piso: 0.02, periodo: 2.1 }, { x: -9, y: 3.9, z: 0.9, piso: 0.02, periodo: 1.3 }]);
  scene.add(gotas.puntos);
  const pol = polvo({ max: 300, color: "#9b9286", tam: 0.3, viento: [-0.4, 0.15, 0], vida: 4, opacidad: 0.12 });
  pol.puntos.material.uniforms.uEscala.value = 500;
  scene.add(pol.puntos);

  // ── ciclo (montaje.js): estado → pose de la máquina asentada en el piso, carga y emisores de polvo (contrato A → B)
  let t = 0, anim = false;
  const env = M.envolvente, aLo = M.dims.rango.brazo[0], aHi = M.dims.rango.brazo[1];
  const lecturaBase = `CAT R1600G · cucharón 6 yd³ · rueda ${M.dims.rueda} m · ejes ${M.dims.ejes.toFixed(2)} m · capota ${M.dims.capota} m · galería 4,0 × 4,0 m`;
  function aplicar(tt) {
    const e = m.estado(tt);
    dib.poner(e.valores);
    carga.visible = e.carga;
    for (const em of e.emisores) { const p = dib.mundo(em.grupo, em.punto); pol.emitir(new THREE.Vector3(...p), em.tasa, 1.2, 0.3); }
    return e;
  }
  function lectura(e) {
    const v = e.valores;
    ctx.lectura(`${e.fase} · brazo ${v.brazo.toFixed(0)}° · cucharón ${(v.brazo + v.cucharon).toFixed(0)}° respecto del piso · ${lecturaBase}`);
  }
  esc.alAnimar((dt) => {
    gotas.actualizar(dt); pol.actualizar(dt);
    if (anim) {
      t = (t + dt) % m.T; const e = aplicar(t); lectura(e);
      // vista de estudio: la cámara acompaña al scoop a lo largo de la galería hasta que el usuario la mueva
      if (seguir && lateral) { const dx = e.x - xSeguido; xSeguido = e.x; esc.controls.target.x += dx; esc.camera.position.x += dx; esc.marcar(); }
    }
    casco.position.copy(esc.camera.position).add(new THREE.Vector3(0, 0.3, 0)); casco.target.position.copy(esc.controls.target);
    return true;
  });
  lectura(aplicar(0));
  let seguir = true, xSeguido = m.estado(0).x;
  esc.controls.addEventListener("start", () => { seguir = false; });
  // controles: levante (0..1 del rango del brazo) y volteo (−1 descarga … 1 recogido, dentro de la envolvente de la barra en Z)
  const btn = document.getElementById("ciclo");
  const lev = document.getElementById("levante"), vol = document.getElementById("volteo");
  const ponerBtn = () => { if (!btn) return; btn.textContent = anim ? "Pausar ciclo" : "Animar ciclo"; btn.setAttribute("aria-pressed", String(anim)); };
  btn?.addEventListener("click", () => { anim = !anim; ponerBtn(); esc.marcar(); });
  const manual = () => {
    anim = false; ponerBtn();
    const brazo = lerp(aLo, aHi, +lev.value), [f0, f1] = env(brazo), cucharon = lerp(f0, f1, (+vol.value + 1) / 2);
    const e = m.estado(t); e.valores.brazo = brazo; e.valores.cucharon = cucharon;
    dib.poner(e.valores);
    document.querySelector('output[for="levante"]').textContent = `${brazo.toFixed(0)}°`;
    document.querySelector('output[for="volteo"]').textContent = `${(brazo + cucharon).toFixed(0)}°`;
    ctx.lectura(`Manual · brazo ${brazo.toFixed(0)}° · cucharón ${(brazo + cucharon).toFixed(0)}° respecto del piso (cilindro de volteo dentro de su carrera) · ${lecturaBase}`);
    esc.marcar();
  };
  lev?.addEventListener("input", manual); vol?.addEventListener("input", manual);
  document.getElementById("lamina")?.addEventListener("change", (ev) => { dib.lamina(ev.target.checked); esc.marcar(); });
  if (!esc.quieto.matches) { anim = true; ponerBtn(); }
  // ── piezas señalables
  const P = (id, off = [0, 0, 0], g = "base", p = [0, 0, 0]) => () => new THREE.Vector3(...dib.mundo(g, p)).add(new THREE.Vector3(...off));
  const K = M.dims.K0, P0 = M.dims.P0;
  const piezas = [
    { id: "cucharon", numero: 1, nombre: "Cucharón", definicion: "6 yd³ (4,6 m³ colmado), 2,6 m de ancho. Labio con 6 dientes y protectores; penetra el montón y se recoge para no derramar.", ancla: P("cucharon", [0, 0.25, 0], "cucharon", [K[0] + 1.3, K[1] + 0.6, 0.9]) },
    { id: "brazo", numero: 2, nombre: "Brazos de levante", definicion: "Dos brazos de 2,91 m que giran en las torres del bastidor delantero, a 1,72 m del piso.", ancla: P("brazo", [0, 0.2, 0], "brazo", [P0[0] + 1.4, P0[1], 0.55]) },
    { id: "cilindros", numero: 3, nombre: "Barra en Z y cilindros", definicion: "Dos cilindros levantan los brazos; uno central empuja la palanca, que por la biela inclina el cucharón.", ancla: P("cilindros", [0, 0.15, 0], "palanca", [2.14, 2.38, 0]) },
    { id: "articulacion", numero: 4, nombre: "Articulación central", definicion: "Dos pasadores verticales entre los bastidores y dos cilindros de dirección: el scoop gira doblándose ±42,5°.", ancla: P("articulacion", [0, 0.5, 0], "base", [0, 1.1, 0]) },
    { id: "cabina", numero: 5, nombre: "Cabina del operador", definicion: "Baja y de costado, bajo una capota ROPS de 2,40 m: el operador mira hacia ambos sentidos de marcha.", ancla: P("cabina", [0, 0.2, 0], "base", [-0.77, 2.3, 0.85]) },
    { id: "motor", numero: 6, nombre: "Motor y contrapeso", definicion: "Atrás, sobre el eje trasero: equilibra el cucharón cargado.", ancla: P("motor", [0, 0.2, 0], "base", [-3.8, 2.1, 0]) },
    { id: "llantas", numero: 7, nombre: "Llantas", definicion: "1,63 m de diámetro (18.00×25), con tacos para piso de roca y barro. Ejes a 3,54 m.", ancla: P("llantas", [0, 0, 0.4], "base", [-1.8, 0.9, 1.1]) },
    { id: "faros", numero: 8, nombre: "Faros", definicion: "Única luz del frente de trabajo: todo lo que se ve en la foto real lo ilumina el equipo.", ancla: P("faros", [0.2, 0.1, 0], "delantero", [2.25, 1.93, 1.08]) },
    { id: "contorno", numero: 9, nombre: "Contorno sobreexcavado", definicion: "Galería de 4,0 × 4,0 m. Los bloques caen siguiendo las tres familias de juntas: el contorno queda facetado.", ancla: () => new THREE.Vector3(8, 3.7, 1.3), region: { material: matRoca, valor: 2 } },
    { id: "pernos", numero: 10, nombre: "Pernos con placa", definicion: "Sostenimiento en malla de 1,5 m en tresbolillo: la placa aprieta la roca suelta contra el macizo.", ancla: () => new THREE.Vector3(2, 3.6, -1.2), objetos: [pern] },
    { id: "shotcrete", numero: 11, nombre: "Shotcrete", definicion: "Concreto lanzado de ≈ 5 cm: suaviza el contorno y lo vuelve gris claro y uniforme.", ancla: () => new THREE.Vector3(-12, 3.4, 1.4), region: { material: matRoca, valor: 3 } },
    { id: "manga", numero: 12, nombre: "Manga de ventilación", definicion: "Lleva aire fresco hasta el frente; cuelga de la corona y se aplasta contra su cable.", ancla: () => new THREE.Vector3(-6, 3.4, -0.95), objetos: [manga] },
    { id: "mineral", numero: 13, nombre: "Mineral disparado", definicion: "El montón que dejó la voladura, apoyado en el frente a su ángulo de reposo.", ancla: () => new THREE.Vector3(XF - 2, 1.9, 0.6), objetos: [muck] },
    { id: "echadero", numero: 14, nombre: "Echadero con parrilla", definicion: "Chimenea por donde cae el mineral a un nivel inferior; la parrilla retiene los bloques grandes.", ancla: () => new THREE.Vector3(X_ECH, 0.3, 1.2), objetos: [echadero] },
  ];
  for (const p of piezas) if (!p.objetos && !p.region) p.objetos = dib.objetosDe(p.id);
  for (const p of piezas.slice(8)) p.oculta = () => !roca.visible;
  const senal = senalar(esc, ctx.contenedor, piezas, { modo: ctx.modo, foco: ctx.foco });
  // ── galería visible u oculta (para comparar con fotos del equipo al aire libre) y corte lateral
  const deGaleria = [roca, tr, pern, manga, muck, gotas.puntos, echadero, tubos, agua, lum, foco, fill];
  // patio al aire libre: losa cerrada de ripio con relieve fino (motor B, mismo material de roca, calmo)
  const piso = losaPisoScoop(80, 160, materialRoca({ escala: 3.2, fuerza: 0.12, escala2: 11, fuerza2: 0.05, variacion: 0.08, apagar: 0.5 }));
  piso.visible = false; scene.add(piso);
  const sol = new THREE.DirectionalLight(LUZ_BLANCA, 2.4); sol.position.set(-12, 18, 10); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 }); sol.visible = false; scene.add(sol);
  const cielo = new THREE.HemisphereLight("#d6d5d1", "#8a867e", 1.6); cielo.visible = false; scene.add(cielo); // neutros
  const FONDO_EXT = "#c4c4c1", FONDO_SUB = esc.fondo ?? "#050505"; // patio: gris neutro · galería: token `fondo` (papel)
  function verGaleria(v) {
    for (const o of deGaleria) o.visible = v;
    piso.visible = sol.visible = cielo.visible = !v;
    // sin galería no hay roca a la vista: el corte de cámara se apaga (si no, cortaría la máquina dentro del bloque oculto)
    if (v) esc.corte?.encender(); else esc.corte?.apagar(); // el plano fijo (corte lateral) sigue puesto al volver
    if (lateral) tubos.visible = false;
    scene.background = new THREE.Color(v ? FONDO_SUB : FONDO_EXT); scene.fog = v && !lateral ? niebla : null;
    esc.controls.maxDistance = v ? 16 : 40; esc.marcar();
    const cb = document.getElementById("ver-galeria"); if (cb) cb.checked = v;
  }
  document.getElementById("ver-galeria")?.addEventListener("change", (ev) => verGaleria(ev.target.checked));
  const relleno = new THREE.HemisphereLight("#d8d5cf", "#3a3732", 0.45); relleno.visible = false; scene.add(relleno);
  // corte lateral (vista de estudio por defecto): plano fijo del corte de cámara (esc.corte.fijar, tapa por stencil y
  // contorno en tinta; oculta lo que queda dentro de la roca). Se conserva z ≤ ZC. El plano es global (corta también al
  // equipo): ZC = 1,55 m deja fuera todo el scoop en el ciclo (el cucharón con sus cortadores llega a ±1,46 m) y el
  // piso sigue bajo las llantas (±1,35 m).
  const ZC = 1.55, plano = new THREE.Plane(new THREE.Vector3(0, 0, -1), ZC);
  const VISTA_ESTUDIO = [new THREE.Vector3(-5.8, 1.1, 0), 135, 24, 11]; // 3/4 desde adelante y del lado de la cabina: el scoop entero
  let lateral = false;
  function corte(v, mover = true) {
    lateral = v;
    scene.fog = roca.visible && !v ? niebla : null; // vista de corte: sin niebla (se mira desde fuera del bloque)
    tubos.visible = !v && roca.visible; relleno.visible = v;
    esc.corte?.fijar(v ? plano : null);
    if (mover && v) { seguir = true; xSeguido = m.estado(0).x; t = 0; aplicar(0); }
    if (mover) { if (v) esc.mirar(...VISTA_ESTUDIO); else esc.mirar(new THREE.Vector3(-6, 1.4, 0), 272, 9, 12.5); }
    esc.controls.maxDistance = v ? 24 : 16; esc.controls.maxPolarAngle = v ? Math.PI * 0.45 : Math.PI * 0.62; esc.marcar();
    const cb = document.getElementById("corte"); if (cb) cb.checked = v;
  }
  document.getElementById("corte")?.addEventListener("change", (ev) => corte(ev.target.checked));
  corte(true);
  esc.controls.minDistance = 2;
  window.GEO = {
    escena: esc, senal, scoop: dib, modelo: M, montaje: m, verGaleria,
    igualarVista: (v) => {
      corte(!!v.corte, false);
      verGaleria(v.galeria !== false);
      if (v.anim === false) {
        anim = false; ponerBtn();
        const e = m.estado(v.t ?? 0);
        if (v.x !== undefined) e.valores._pose = { ...e.valores._pose, x: v.x, y: v.galeria === false ? 0 : e.valores._pose.y, cabeceo: v.galeria === false ? 0 : e.valores._pose.cabeceo, alabeo: v.galeria === false ? 0 : e.valores._pose.alabeo };
        if (v.estado) Object.assign(e.valores, v.estado);
        dib.poner(e.valores); carga.visible = !!v.carga;
      }
      esc.mirar(new THREE.Vector3(...v.objetivo), v.az, v.el, v.dist);
    },
  };
}
