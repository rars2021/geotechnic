// Ejemplo · scoop (LHD) CAT R1600G de 6 yd³ en una galería de 4,0 × 4,0 m, con ciclo de carguío.
// Motor A (equipo, equipos/scoop) dentro del motor B (roca): ambos vienen de montaje.js, el mismo que juzga el juez.
import * as THREE from "three";
import { crearEscena } from "../../kit/escena.js";
import { frente, pernos, mangaVentilacion, tuberias, charcos } from "../../kit/labor.js";
import { trazasSobreMalla, lineasTrazas } from "../../kit/fracturas.js";
import { goteo, polvo } from "../../kit/volumenes.js";
import { materialRoca, materialPintura, MATERIALES } from "../../kit/materiales.js";
import { monton } from "../../kit/equipos.js";
import { mallasMaquina } from "../../motorA/mallas.js";
import { EQUIPO_SCOOP } from "../../equipos/scoop/modelo.js";
import { rgb, lerp } from "../../kit/nucleo.js";
import { senalar } from "../../kit/senalar.js";
import { montajeScoop } from "./montaje.js";

async function montar(ctx) {
  const esc = crearEscena(ctx.contenedor, { fondo: "subterraneo", niebla: [14, 48], exposicion: 1.25, fov: 48, cerca: 0.05, lejos: 400 });
  const { scene } = esc;
  const m = montajeScoop();
  const { M, gal, mac, XF, X0, X_ECH, MONTON } = m;
  // ── motor B: roca, frente, trazas, sostenimiento, servicios, agua
  const matRoca = materialRoca({ humedad: true, regiones: true, escala: 1.4, fuerza: 0.2, escala2: 5, fuerza2: 0.06, variacion: 0.1 });
  const roca = new THREE.Mesh(gal.geometria, matRoca);
  roca.receiveShadow = true; roca.castShadow = true;
  scene.add(roca);
  const fr = new THREE.Mesh(frente(gal, { x: XF, macizo: mac }), materialRoca({ escala: 1.4, fuerza: 0.2 }));
  fr.receiveShadow = true;
  scene.add(fr);
  const tr = lineasTrazas(trazasSobreMalla(mac.dfn, gal.geometria, { desplazar: -0.02, maxNormalY: 0.98 }), { opacidad: 0.22 });
  scene.add(tr);
  const pern = pernos(gal, { x0: -4, x1: XF - 3, espaciado: 1.5, desdeY: 1.3 });
  scene.add(pern);
  const manga = mangaVentilacion({ x0: X0, x1: XF - 9, y: 3.84, z: -1.05, diametro: 0.6 });
  scene.add(manga);
  const tubos = tuberias({ x0: X0, x1: XF - 4, z: 1.88, alturas: [1.55, 1.8] });
  scene.add(tubos);
  scene.add(charcos(gal, { cantidad: 7, x0: X0 + 2, x1: XF - 5 }));
  const muck = monton({ ancho: 4.4, largo: MONTON, alto: 2.4, color: "#77726a", bloques: 260, semilla: 4 });
  muck.position.set(XF - 1.2, -0.05, 0);
  scene.add(muck);
  const echadero = new THREE.Group();
  const hueco = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#020202" }));
  hueco.position.set(X_ECH, 0.015, 0); echadero.add(hueco);
  const matRiel = materialPintura("#5a554e", { metal: 0.6, rugosidad: 0.5, suciedad: 0.7, desgaste: 0.7, alturaBarro: 0.3 });
  for (let k = -5; k <= 5; k++) { const r0 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 0.07), matRiel); r0.position.set(X_ECH, 0.05, k * 0.24); r0.castShadow = true; echadero.add(r0); }
  for (const dx of [-1.05, 1.05]) { const c0 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 2.75), matRiel); c0.position.set(X_ECH + dx, 0.06, 0); echadero.add(c0); }
  scene.add(echadero);
  // ── motor A: el scoop, pieza por pieza, con sus cilindros, barra en Z y mangueras
  const dib = mallasMaquina(M, EQUIPO_SCOOP.dibujo);
  scene.add(dib.raiz);
  // carga en el cucharón (material suelto: no es un sólido del juez) y faros con luz
  const carga = monton({ ancho: M.dims.anchoCucharon * 0.84, largo: 1.9, alto: 0.7, color: "#7d786f", bloques: 80, semilla: 3 });
  carga.position.set(M.dims.K0[0] + 0.95, M.dims.K0[1] - 0.22, 0); carga.visible = false;
  dib.grupo("cucharon").add(carga);
  for (const s of [1, -1]) {
    const luz = new THREE.SpotLight("#fff1d6", 90, 45, 0.55, 0.45, 1.6);
    luz.position.set(2.32, 1.93, s * 1.08); luz.target.position.set(12, 0.9, s * 0.5);
    luz.castShadow = s > 0; if (s > 0) { luz.shadow.mapSize.set(1024, 1024); luz.shadow.bias = -0.0005; }
    dib.grupo("delantero").add(luz, luz.target);
  }
  // luces de ambiente: lámpara de casco que sigue a la cámara y una luminaria lejana
  const casco = new THREE.SpotLight("#fff4e2", 20, 40, 0.8, 0.9, 1.4);
  scene.add(casco, casco.target);
  const lum = new THREE.PointLight("#ffd29a", 10, 18, 1.8); lum.position.set(X0 + 4, 3.3, 0.8); scene.add(lum);
  const foco = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), MATERIALES.luz("#ffd29a")); foco.position.copy(lum.position); scene.add(foco);
  const gotas = goteo([{ x: 1.2, y: 3.9, z: 0.6, piso: 0.02 }, { x: 6.5, y: 3.85, z: -0.4, piso: 0.02, periodo: 2.1 }, { x: -9, y: 3.9, z: 0.9, piso: 0.02, periodo: 1.3 }]);
  scene.add(gotas.puntos);
  const pol = polvo({ max: 500, color: "#9b9286", tam: 0.35, viento: [-0.4, 0.15, 0], vida: 5, opacidad: 0.22 });
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
    if (anim) { t = (t + dt) % m.T; lectura(aplicar(t)); }
    casco.position.copy(esc.camera.position).add(new THREE.Vector3(0, 0.3, 0)); casco.target.position.copy(esc.controls.target);
    return true;
  });
  lectura(aplicar(0));
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
    { id: "cucharon", numero: 1, nombre: "Cucharón", definicion: "6 yd³ colmado (≈ 4,5 m³ al ras más colmo). Labio con 6 dientes; penetra el montón y se recoge para no derramar.", ancla: P("cucharon", [0, 0.25, 0], "cucharon", [K[0] + 1.3, K[1] + 0.6, 0.9]) },
    { id: "brazo", numero: 2, nombre: "Brazos de levante", definicion: "Dos brazos de 3,0 m que giran en las torres del bastidor delantero, a 1,89 m del piso.", ancla: P("brazo", [0, 0.2, 0], "brazo", [P0[0] + 1.4, P0[1], 0.55]) },
    { id: "cilindros", numero: 3, nombre: "Barra en Z y cilindros", definicion: "Dos cilindros levantan los brazos; uno central empuja la palanca, que por la biela inclina el cucharón.", ancla: P("cilindros", [0, 0.15, 0], "palanca", [2.14, 2.38, 0]) },
    { id: "articulacion", numero: 4, nombre: "Articulación central", definicion: "Dos pasadores verticales entre los bastidores y dos cilindros de dirección: el scoop gira doblándose ±42,5°.", ancla: P("articulacion", [0, 0.5, 0], "base", [0, 1.1, 0]) },
    { id: "cabina", numero: 5, nombre: "Cabina del operador", definicion: "Baja y de costado, bajo una capota de 2,31 m: el operador mira hacia ambos sentidos de marcha.", ancla: P("cabina", [0, 0.2, 0], "base", [-0.77, 2.3, 0.85]) },
    { id: "motor", numero: 6, nombre: "Motor y contrapeso", definicion: "Atrás, sobre el eje trasero: equilibra el cucharón cargado.", ancla: P("motor", [0, 0.2, 0], "base", [-3.8, 2.1, 0]) },
    { id: "llantas", numero: 7, nombre: "Llantas", definicion: "1,75 m de diámetro, con tacos para piso de roca y barro. Ejes a 3,25 m.", ancla: P("llantas", [0, 0, 0.4], "base", [-1.8, 0.9, 1.1]) },
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
  const deGaleria = [roca, fr, tr, pern, manga, muck, gotas.puntos, echadero, tubos, lum, foco];
  scene.children.filter((o) => o.isGroup && o !== dib.raiz && !deGaleria.includes(o)).forEach((o) => deGaleria.push(o));
  // patio al aire libre: ripio con relieve fino y manchas (motor B, mismo material de roca)
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(80, 80, 160, 160).rotateX(-Math.PI / 2), materialRoca({ escala: 3.2, fuerza: 0.35, escala2: 11, fuerza2: 0.25, variacion: 0.35 }));
  { const P = piso.geometry.attributes.position.array, n = P.length / 3, c = new Float32Array(n * 3), r = (i) => Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    for (let i = 0; i < n; i++) { const t = r(i); const k = rgb(t < 0.33 ? "#8a8378" : t < 0.66 ? "#7a7268" : "#9a9387"); c.set(k, i * 3); P[i * 3 + 1] = -0.02 + 0.03 * r(i + 7); }
    piso.geometry.setAttribute("color", new THREE.BufferAttribute(c, 3)); piso.geometry.computeVertexNormals(); }
  piso.receiveShadow = true; piso.visible = false; scene.add(piso);
  const sol = new THREE.DirectionalLight("#fff3e0", 3.8); sol.position.set(-12, 18, 10); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 }); sol.visible = false; scene.add(sol);
  const cielo = new THREE.HemisphereLight("#c9d6e6", "#7a6f62", 0.7); cielo.visible = false; scene.add(cielo);
  function verGaleria(v) {
    for (const o of deGaleria) o.visible = v;
    piso.visible = sol.visible = cielo.visible = !v;
    scene.background = new THREE.Color(v ? "#050505" : "#b9c4cf"); scene.fog = v ? new THREE.Fog("#0b0a09", 14, 48) : null;
    esc.controls.maxDistance = v ? 16 : 40; esc.marcar();
    const cb = document.getElementById("ver-galeria"); if (cb) cb.checked = v;
  }
  document.getElementById("ver-galeria")?.addEventListener("change", (ev) => verGaleria(ev.target.checked));
  esc.renderer.localClippingEnabled = true;
  const relleno = new THREE.HemisphereLight("#d8d2c8", "#3a352f", 0.45); relleno.visible = false; scene.add(relleno);
  const plano = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1.1);
  function corte(v) {
    for (const mt of [matRoca, fr.material, pern.material]) { mt.clippingPlanes = v ? [plano] : []; mt.needsUpdate = true; }
    for (const l of tr.children) l.material.clippingPlanes = v ? [plano] : [];
    tubos.visible = !v && roca.visible; relleno.visible = v;
    if (v) esc.mirar(new THREE.Vector3(2, 1.5, 0), 180, 16, 17); else esc.mirar(new THREE.Vector3(3, 1.2, 0.4), 266, 5, 15);
    esc.controls.maxDistance = v ? 40 : 16; esc.marcar();
  }
  document.getElementById("corte")?.addEventListener("change", (ev) => corte(ev.target.checked));
  esc.mirar(new THREE.Vector3(3, 1.2, 0.4), 266, 5, 15);
  esc.controls.minDistance = 2; esc.controls.maxDistance = 16; esc.controls.maxPolarAngle = Math.PI * 0.62;
  window.GEO = {
    escena: esc, senal, scoop: dib, modelo: M, montaje: m, verGaleria,
    igualarVista: (v) => {
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
