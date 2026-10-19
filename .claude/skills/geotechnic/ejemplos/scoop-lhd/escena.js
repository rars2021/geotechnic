// Ejemplo · scoop (LHD) CAT R1600G de 6 yd³ en una galería de 4,0 × 4,0 m, con ciclo de carguío.
import * as THREE from "three";
import { crearEscena } from "../../kit/escena.js";
import { seccionBaul, galeria, frente, pernos, mangaVentilacion, tuberias, charcos } from "../../kit/labor.js";
import { crearDFN, trazasSobreMalla, lineasTrazas } from "../../kit/fracturas.js";
import { zona, colorRoca, goteo, polvo } from "../../kit/volumenes.js";
import { materialRoca, materialPintura, MATERIALES } from "../../kit/materiales.js";
import { scoop, monton } from "../../kit/equipos.js";
import { rgb, suave, clamp, lerp } from "../../kit/nucleo.js";
import { senalar } from "../../kit/senalar.js";

async function montar(ctx) {
  const esc = crearEscena(ctx.contenedor, { fondo: "subterraneo", niebla: [14, 48], exposicion: 1.25, fov: 48, cerca: 0.05, lejos: 400 });
  const { scene } = esc;
  const X0 = -22, LARGO = 36, XF = X0 + LARGO; // frente en x = 14
  // macizo: tres familias (Retamas, MARSA) y una zona con óxidos y humedad
  const dfn = crearDFN([
    { nombre: "F1", buz: 71, dirBuz: 242, kappa: 40, espaciado: 0.7, persistencia: 2.2, relieve: 0.22, maxDiscos: 700 },
    { nombre: "F2", buz: 40, dirBuz: 43, kappa: 35, espaciado: 0.9, persistencia: 2.6, relieve: 0.2, maxDiscos: 600 },
    { nombre: "F3", buz: 65, dirBuz: 157, kappa: 35, espaciado: 1.1, persistencia: 1.8, relieve: 0.18, maxDiscos: 500 },
  ], { min: [X0 - 2, -2, -5], max: [XF + 2, 7, 5] }, 13);
  const oxid = zona({ tipo: "elipsoide", centro: [4, 3, 2], radios: [6, 3, 4], transicion: 2.5, ruido: 1.5, escalaRuido: 0.25, semilla: 2 });
  const color = colorRoca(["#7e7a71", "#716d65", "#8a857b"], [{ f: oxid, paleta: ["#8c6e4c", "#7d6145"], peso: 0.55 }], 5);
  const humedad = (x, y, z, piso, dist) => piso ? 0.55 + 0.45 * suave(0.3, 0.9, Math.abs(Math.sin(x * 0.37) * Math.cos(z * 1.7))) : clamp(0.05 + 0.45 * (1 - suave(0.02, 0.12, dist)) * suave(0, 3.5, 4 - y) + 0.25 * oxid(x, y, z));
  const sec = seccionBaul(4.0, 4.0);
  const gal = galeria({
    seccion: sec, largo: LARGO, inicio: X0, paso: 0.11, sobreexcavacion: 0.22, dfn, color, humedad,
    shotcrete: { desde: X0 - 1, hasta: -5, espesor: 0.05 },
    region: (x, tipo, enShot) => enShot ? 3 : tipo === "piso" ? 4 : 2,
  });
  const matRoca = materialRoca({ humedad: true, regiones: true, escala: 1.4, fuerza: 0.2, escala2: 5, fuerza2: 0.06, variacion: 0.1 });
  const roca = new THREE.Mesh(gal.geometria, matRoca);
  roca.receiveShadow = true; roca.castShadow = true;
  scene.add(roca);
  const fr = new THREE.Mesh(frente(gal, { x: XF, color, dfn }), materialRoca({ escala: 1.4, fuerza: 0.2 }));
  fr.receiveShadow = true;
  scene.add(fr);
  const tr = lineasTrazas(trazasSobreMalla(dfn, gal.geometria, { desplazar: -0.02, maxNormalY: 0.98 }), { opacidad: 0.22 });
  scene.add(tr);
  const pern = pernos(gal, { x0: -4, x1: XF - 3, espaciado: 1.5, desdeY: 1.3 });
  scene.add(pern);
  const manga = mangaVentilacion({ x0: X0, x1: XF - 9, y: 3.84, z: -1.05, diametro: 0.6 });
  scene.add(manga);
  const tubos = tuberias({ x0: X0, x1: XF - 4, z: 1.88, alturas: [1.55, 1.8] });
  scene.add(tubos);
  scene.add(charcos(gal, { cantidad: 7, x0: X0 + 2, x1: XF - 5 }));
  // mineral disparado contra el frente (talud de reposo)
  const muck = monton({ ancho: 4.4, largo: 6.5, alto: 2.4, color: "#77726a", bloques: 260, semilla: 4 });
  muck.position.set(XF - 1.2, -0.05, 0);
  scene.add(muck);
  // echadero con parrilla (donde descarga el scoop)
  const X_ECH = -0.6;
  const echadero = new THREE.Group();
  const hueco = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#020202" }));
  hueco.position.set(X_ECH, 0.015, 0); echadero.add(hueco);
  const matRiel = materialPintura("#5a554e", { metal: 0.6, rugosidad: 0.5, suciedad: 0.7, desgaste: 0.7, alturaBarro: 0.3 });
  for (let k = -5; k <= 5; k++) { const r0 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 0.07), matRiel); r0.position.set(X_ECH, 0.05, k * 0.24); r0.castShadow = true; echadero.add(r0); }
  for (const dx of [-1.05, 1.05]) { const c0 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 2.75), matRiel); c0.position.set(X_ECH + dx, 0.06, 0); echadero.add(c0); }
  scene.add(echadero);
  // scoop
  const sc = scoop({ luces: true, semilla: 3 });
  scene.add(sc.grupo);
  const X_INICIO = -1.5, X_DESC = -4.2;
  sc.grupo.position.set(X_INICIO, 0, 0);
  // luces de ambiente: lámpara de casco del observador y una luminaria lejana
  // lámpara de casco: sigue a la cámara (así se ve una labor: lo que alumbran el casco y el equipo)
  const casco = new THREE.SpotLight("#fff4e2", 20, 40, 0.8, 0.9, 1.4);
  scene.add(casco, casco.target);
  const lum = new THREE.PointLight("#ffd29a", 10, 18, 1.8); lum.position.set(X0 + 4, 3.3, 0.8); scene.add(lum);
  const foco = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), MATERIALES.luz("#ffd29a")); foco.position.copy(lum.position); scene.add(foco);
  // agua: goteo desde la corona
  const gotas = goteo([{ x: 1.2, y: 3.9, z: 0.6, piso: 0.02 }, { x: 6.5, y: 3.85, z: -0.4, piso: 0.02, periodo: 2.1 }, { x: -9, y: 3.9, z: 0.9, piso: 0.02, periodo: 1.3 }]);
  scene.add(gotas.puntos);
  const pol = polvo({ max: 500, color: "#9b9286", tam: 0.35, viento: [-0.4, 0.15, 0], vida: 5, opacidad: 0.22 });
  pol.puntos.material.uniforms.uEscala.value = 500;
  scene.add(pol.puntos);

  // ciclo de carguío: aproximación, penetración, recogida, retroceso y volteo. Secuencia, no tiempos medidos.
  const fases = [
    { t: 0, x: X_INICIO, lev: 0.08, vol: 0.6, carga: false },
    { t: 1.2, x: X_INICIO, lev: 0.0, vol: -0.1, carga: false },   // baja el cucharón y lo nivela
    { t: 4.6, x: XF - 6.4, lev: 0.0, vol: -0.1, carga: false },    // avanza al montón
    { t: 5.6, x: XF - 5.6, lev: 0.05, vol: 0.0, carga: false },    // penetra
    { t: 6.8, x: XF - 5.6, lev: 0.18, vol: 0.85, carga: true },    // recoge (curl)
    { t: 7.4, x: XF - 5.7, lev: 0.12, vol: 0.85, carga: true },
    { t: 11.0, x: X_DESC, lev: 0.12, vol: 0.85, carga: true },      // retrocede con la carga baja
    { t: 12.6, x: X_DESC, lev: 1.0, vol: 0.85, carga: true },       // levanta sobre el echadero
    { t: 13.8, x: X_DESC, lev: 1.0, vol: -1.0, carga: false },      // descarga
    { t: 14.8, x: X_DESC, lev: 0.6, vol: 0.6, carga: false },
    { t: 16.6, x: X_INICIO, lev: 0.08, vol: 0.6, carga: false },
  ];
  const T = fases[fases.length - 1].t;
  let t = 0, anim = false, xAnt = X_INICIO;
  const nombres = ["Aproximación", "Aproximación", "Aproximación", "Penetración", "Recogida", "Recogida", "Retroceso", "Levante", "Descarga", "Retorno", "Retorno"];
  function aplicar(tt) {
    let i = 0; while (i < fases.length - 2 && fases[i + 1].t <= tt) i++;
    const a = fases[i], b = fases[i + 1];
    const u = clamp((tt - a.t) / (b.t - a.t)), s = u * u * (3 - 2 * u);
    const x = lerp(a.x, b.x, s);
    sc.grupo.position.x = x;
    sc.poner({ levante: lerp(a.lev, b.lev, s), volteo: lerp(a.vol, b.vol, s), carga: u < 0.5 ? a.carga : b.carga, rodar: x });
    if (i === 3 || i === 8) pol.emitir(new THREE.Vector3(x + (i === 3 ? 4.3 : 3.6), i === 3 ? 0.4 : 1.0, 0), 3, 1.5, 0.3);
    xAnt = x;
    return nombres[i + 1];
  }
  const dims = sc.dims;
  const base = `CAT R1600G · cucharón 6 yd³ (4,6 m³) · rueda ${dims.rueda} m · ejes a ${dims.ejes} m · capota ${dims.capota} m · galería 4,0 × 4,0 m`;
  ctx.lectura(base);
  esc.alAnimar((dt) => {
    gotas.actualizar(dt); pol.actualizar(dt);
    if (anim) { t = (t + dt) % T; const f = aplicar(t); ctx.lectura(`${f} · ${base}`); }
    casco.position.copy(esc.camera.position).add(new THREE.Vector3(0, 0.3, 0)); casco.target.position.copy(esc.controls.target);
    return true;
  });
  aplicar(0);
  // controles
  const btn = document.getElementById("ciclo");
  const lev = document.getElementById("levante"), vol = document.getElementById("volteo");
  const ponerBtn = () => { btn.textContent = anim ? "Pausar ciclo" : "Animar ciclo"; btn.setAttribute("aria-pressed", String(anim)); };
  btn?.addEventListener("click", () => { anim = !anim; ponerBtn(); esc.marcar(); });
  const manual = () => { anim = false; ponerBtn(); sc.poner({ levante: +lev.value, volteo: +vol.value }); document.querySelector('output[for="levante"]').textContent = Math.round(+lev.value * 100) + " %"; document.querySelector('output[for="volteo"]').textContent = (+vol.value).toFixed(2); esc.marcar(); };
  lev?.addEventListener("input", manual); vol?.addEventListener("input", manual);
  if (!esc.quieto.matches) { anim = true; ponerBtn(); }
  // piezas
  const W = (o, off = [0, 0, 0]) => () => o.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(...off));
  const p = sc.partes;
  const piezas = [
    { id: "cucharon", numero: 1, nombre: "Cucharón", definicion: "6 yd³ (4,6 m³). Labio con dientes de desgaste; penetra el montón y se recoge para no derramar.", ancla: W(p.cucharon, [1.0, 0.2, 0]), objetos: [p.cucharon] },
    { id: "brazo", numero: 2, nombre: "Brazos de levante", definicion: "Dos brazos que giran en el bastidor delantero y suben el cucharón para descargar.", ancla: W(p.brazo, [1.2, 0.3, 1.2]), objetos: [p.brazo] },
    { id: "cilindros", numero: 3, nombre: "Cilindros de levante y volteo", definicion: "Hidráulicos: dos levantan los brazos; uno central inclina el cucharón (recoger o descargar).", ancla: W(p.cilindroVolteo, [0.5, 0.6, 0]), objetos: [...p.cilindrosLevante, p.cilindroVolteo] },
    { id: "articulacion", numero: 4, nombre: "Articulación central", definicion: "Bisagra vertical entre los dos bastidores: el scoop gira doblándose, por eso cabe en galerías estrechas.", ancla: W(p.articulacion, [0, 0.7, 0]), objetos: [p.articulacion] },
    { id: "cabina", numero: 5, nombre: "Cabina del operador", definicion: "Baja y de costado: el operador mira hacia ambos sentidos de marcha bajo una capota de 2,31 m.", ancla: W(p.cabina, [0, 1.6, 0.4]), objetos: [p.cabina] },
    { id: "motor", numero: 6, nombre: "Motor y contrapeso", definicion: "Atrás, sobre el eje trasero: equilibra el cucharón cargado.", ancla: W(p.motor, [-0.6, 0.5, 0]), objetos: [p.motor, p.trasero] },
    { id: "llantas", numero: 7, nombre: "Llantas", definicion: "1,75 m de diámetro, con tacos para piso de roca y barro. Ejes a 3,25 m.", ancla: W(p.ruedas[0], [0, 0.2, 0.5]), objetos: p.ruedas },
    { id: "faros", numero: 8, nombre: "Faros", definicion: "Única luz del frente de trabajo: todo lo que se ve en la foto real lo ilumina el equipo.", ancla: W(p.faros[0], [0.2, 0.3, 0]), objetos: p.faros },
    { id: "contorno", numero: 9, nombre: "Contorno sobreexcavado", definicion: "Galería de 4,0 × 4,0 m con bóveda. Los bloques que caen siguiendo las juntas dejan el contorno irregular.", ancla: () => new THREE.Vector3(8, 3.7, 1.3), region: { material: matRoca, valor: 2 } },
    { id: "pernos", numero: 10, nombre: "Pernos con placa", definicion: "Sostenimiento en malla de 1,5 m en tresbolillo: la placa aprieta la roca suelta contra el macizo.", ancla: () => new THREE.Vector3(2, 3.6, -1.2), objetos: [pern] },
    { id: "shotcrete", numero: 11, nombre: "Shotcrete", definicion: "Concreto lanzado de ≈ 5 cm: suaviza el contorno y lo vuelve gris claro y uniforme.", ancla: () => new THREE.Vector3(-12, 3.4, 1.4), region: { material: matRoca, valor: 3 } },
    { id: "manga", numero: 12, nombre: "Manga de ventilación", definicion: "Lleva aire fresco hasta el frente; cuelga de la corona y se aplasta contra su cable.", ancla: () => new THREE.Vector3(-6, 3.4, -0.95), objetos: [manga] },
    { id: "mineral", numero: 13, nombre: "Mineral disparado", definicion: "El montón que dejó la voladura, apoyado en el frente a su ángulo de reposo.", ancla: () => new THREE.Vector3(XF - 2, 1.9, 0.6), objetos: [muck] },
    { id: "echadero", numero: 14, nombre: "Echadero con parrilla", definicion: "Chimenea por donde cae el mineral a un nivel inferior; la parrilla retiene los bloques grandes.", ancla: () => new THREE.Vector3(X_ECH, 0.3, 1.2), objetos: [echadero] },
  ];
  for (const p of piezas.slice(8)) p.oculta = () => !roca.visible;
  const senal = senalar(esc, ctx.contenedor, piezas, { modo: ctx.modo, foco: ctx.foco });
  // galería visible u oculta (para comparar con fotos del equipo al aire libre)
  const deGaleria = [roca, fr, tr, pern, manga, muck, gotas.puntos, echadero];
  scene.children.filter((o) => o.isGroup && o !== sc.grupo && !deGaleria.includes(o)).forEach((o) => deGaleria.push(o));
  const piso = new THREE.Mesh(new THREE.CircleGeometry(40, 48).rotateX(-Math.PI / 2), materialRoca({ escala: 0.6, fuerza: 0.05 }));
  { const n = piso.geometry.attributes.position.count, c = new Float32Array(n * 3); const k = rgb("#8a8378"); for (let i = 0; i < n; i++) c.set(k, i * 3); piso.geometry.setAttribute("color", new THREE.BufferAttribute(c, 3)); }
  piso.receiveShadow = true; piso.visible = false; scene.add(piso);
  const sol = new THREE.DirectionalLight("#fff3e0", 2.6); sol.position.set(-12, 18, 10); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 }); sol.visible = false; scene.add(sol);
  const cielo = new THREE.HemisphereLight("#c9d6e6", "#7a6f62", 1.2); cielo.visible = false; scene.add(cielo);
  function verGaleria(v) {
    for (const o of deGaleria) o.visible = v;
    piso.visible = sol.visible = cielo.visible = !v;
    scene.background = new THREE.Color(v ? "#050505" : "#b9c4cf"); scene.fog = v ? new THREE.Fog("#0b0a09", 14, 48) : null;
    esc.controls.maxDistance = v ? 16 : 40; esc.marcar();
    const cb = document.getElementById("ver-galeria"); if (cb) cb.checked = v;
  }
  document.getElementById("ver-galeria")?.addEventListener("change", (e) => verGaleria(e.target.checked));
  // corte lateral: recorta el hastial derecho para ver el equipo dentro de la labor
  esc.renderer.localClippingEnabled = true;
  const relleno = new THREE.HemisphereLight("#d8d2c8", "#3a352f", 0.45); relleno.visible = false; scene.add(relleno);
  const plano = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1.1);
  function corte(v) {
    for (const m of [matRoca, fr.material, pern.material, tr.children[0]?.material].filter(Boolean)) { m.clippingPlanes = v ? [plano] : []; m.needsUpdate = true; }
    for (const l of tr.children) { l.material.clippingPlanes = v ? [plano] : []; }
    tubos.visible = !v && roca.visible; relleno.visible = v;
    if (v) esc.mirar(new THREE.Vector3(2, 1.5, 0), 180, 16, 17); else esc.mirar(new THREE.Vector3(3, 1.2, 0.4), 266, 5, 15);
    esc.controls.maxDistance = v ? 40 : 16; esc.marcar();
  }
  document.getElementById("corte")?.addEventListener("change", (e) => corte(e.target.checked));
  esc.mirar(new THREE.Vector3(3, 1.2, 0.4), 266, 5, 15);
  esc.controls.minDistance = 2; esc.controls.maxDistance = 16; esc.controls.maxPolarAngle = Math.PI * 0.62;
  window.GEO = {
    escena: esc, senal, scoop: sc, verGaleria,
    igualarVista: (v) => {
      verGaleria(v.galeria !== false);
      if (v.anim === false) { anim = false; ponerBtn(); sc.grupo.position.x = v.x ?? 0; sc.poner(v.estado || { levante: 0.08, volteo: 0.6, carga: false }); }
      esc.mirar(new THREE.Vector3(...v.objetivo), v.az, v.el, v.dist);
    },
  };
}
