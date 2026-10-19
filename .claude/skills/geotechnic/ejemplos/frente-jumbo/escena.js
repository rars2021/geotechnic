// Ejemplo · perforación de un frente de 4,0 × 4,0 m con jumbo de dos brazos (malla real de Alpayana-Casapalca).
import * as THREE from "three";
import { crearEscena } from "../../kit/escena.js";
import { seccionBaul, galeria, frente, pernos, mangaVentilacion, tuberias, charcos } from "../../kit/labor.js";
import { crearDFN, trazasSobreMalla, lineasTrazas } from "../../kit/fracturas.js";
import { colorRoca, polvo } from "../../kit/volumenes.js";
import { materialRoca, MATERIALES } from "../../kit/materiales.js";
import { jumbo } from "../../kit/equipos.js";
import { MALLAS, COLORES_GRUPO, ordenPerforacion } from "../../kit/procesos.js";
import { rgb, suave, clamp, lerp } from "../../kit/nucleo.js";
import { senalar } from "../../kit/senalar.js";

async function montar(ctx) {
  const esc = crearEscena(ctx.contenedor, { fondo: "subterraneo", niebla: [16, 52], exposicion: 1.3, fov: 46, cerca: 0.05, lejos: 300 });
  const { scene } = esc;
  const malla = MALLAS.casapalca4x4;
  const XF = 0, X0 = -26;
  const dfn = crearDFN([
    { nombre: "F1", buz: 71, dirBuz: 242, kappa: 40, espaciado: 0.8, persistencia: 2.4, relieve: 0.2, maxDiscos: 600 },
    { nombre: "F2", buz: 40, dirBuz: 43, kappa: 35, espaciado: 1.0, persistencia: 2.6, relieve: 0.18, maxDiscos: 500 },
    { nombre: "F3", buz: 65, dirBuz: 157, kappa: 35, espaciado: 1.2, persistencia: 2.0, relieve: 0.16, maxDiscos: 400 },
  ], { min: [X0 - 2, -2, -5], max: [XF + 6, 7, 5] }, 21);
  const color = colorRoca(["#7f7a71", "#726d65", "#8b857b"], [], 8);
  const gal = galeria({
    seccion: seccionBaul(malla.seccion.ancho, malla.seccion.alto), largo: XF - X0, inicio: X0, paso: 0.11, sobreexcavacion: 0.2, dfn, color,
    humedad: (x, y, z, piso, dist) => piso ? 0.6 : clamp(0.05 + 0.35 * (1 - suave(0.02, 0.12, dist))),
    shotcrete: { desde: X0 - 1, hasta: -9, espesor: 0.05 }, region: (x, tipo, enShot) => (enShot ? 3 : 2),
  });
  const matRoca = materialRoca({ humedad: true, regiones: true, escala: 1.4, fuerza: 0.2, escala2: 5, fuerza2: 0.06 });
  const roca = new THREE.Mesh(gal.geometria, matRoca); roca.receiveShadow = roca.castShadow = true; scene.add(roca);
  const matFrente = materialRoca({ escala: 1.6, fuerza: 0.22, escala2: 6, fuerza2: 0.06 });
  matFrente.transparent = true;
  const geoFrente = frente(gal, { x: XF, color, dfn, res: 90 });
  const fr = new THREE.Mesh(geoFrente, matFrente); fr.receiveShadow = true; scene.add(fr);
  scene.add(lineasTrazas(trazasSobreMalla(dfn, gal.geometria, { desplazar: -0.02, maxNormalY: 0.98 }), { opacidad: 0.2 }));
  const trazasFrente = lineasTrazas(trazasSobreMalla(dfn, geoFrente, { desplazar: -0.02, maxNormalY: 0.98 }), { opacidad: 0.28 });
  scene.add(trazasFrente);
  const pern = pernos(gal, { x0: -8.5, x1: XF - 1.5, espaciado: 1.5, desdeY: 1.3 }); scene.add(pern);
  scene.add(mangaVentilacion({ x0: X0, x1: XF - 12, y: 3.85, z: -1.1, diametro: 0.6 }));
  scene.add(tuberias({ x0: X0, x1: XF - 3, z: 1.88, alturas: [1.5, 1.75] }));
  scene.add(charcos(gal, { cantidad: 5, x0: X0 + 2, x1: XF - 2 }));
  // emboquilles sobre la superficie real del frente (rayo hacia +x)
  const ray = new THREE.Raycaster();
  const taladros = malla.taladros.map((t) => {
    ray.set(new THREE.Vector3(XF - 1.5, t.y, t.z), new THREE.Vector3(1, 0, 0));
    const hit = ray.intersectObject(fr)[0];
    const p = hit ? hit.point : new THREE.Vector3(XF + 0.2, t.y, t.z);
    // contorno con ángulo de realce (look-out) hacia afuera; el resto paralelo al eje
    const perim = ["corona", "cuadrador", "arrastre"].includes(t.grupo);
    const dir = new THREE.Vector3(1, perim && t.y > 2.5 ? 0.035 : t.grupo === "arrastre" ? -0.03 : 0, perim ? Math.sign(t.z) * 0.035 : 0).normalize();
    return { ...t, collar: p, dir, hecho: 0 };
  });
  // pintura de la malla: anillo rojo (cargado) o azul (vacío), y la línea de gradiente
  const pintura = new THREE.Group();
  const matRojo = new THREE.MeshBasicMaterial({ color: "#c8261c" }), matAzul = new THREE.MeshBasicMaterial({ color: "#2a55c4" });
  for (const t of taladros) {
    const anillo = new THREE.Mesh(new THREE.RingGeometry(t.diam * 0.9 + 0.025, t.diam * 0.9 + 0.05, 20), t.cargado ? matRojo : matAzul);
    anillo.position.copy(t.collar).add(new THREE.Vector3(-0.06, 0, 0)); anillo.rotation.y = -Math.PI / 2; pintura.add(anillo);
  }
  const gradiente = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.04), matRojo);
  gradiente.rotation.y = -Math.PI / 2; gradiente.position.set(Math.min(...taladros.filter((x) => x.y < 1.3).map((x) => x.collar.x)) - 0.08, 1.0, 0); pintura.add(gradiente);
  scene.add(pintura);
  // taladros perforados: boca oscura en el frente y tubo dentro del macizo (visible en la vista de rayos X)
  const bocas = new THREE.Group(), tubos = new THREE.Group();
  const matBoca = new THREE.MeshBasicMaterial({ color: "#050505" });
  for (const t of taladros) {
    const boca = new THREE.Mesh(new THREE.CircleGeometry(t.diam / 2 + 0.008, 16), matBoca);
    boca.position.copy(t.collar).add(new THREE.Vector3(-0.065, 0, 0)); boca.rotation.y = -Math.PI / 2; boca.visible = false; bocas.add(boca);
    const tubo = new THREE.Mesh(new THREE.CylinderGeometry(t.diam / 2, t.diam / 2, 1, 10).rotateZ(-Math.PI / 2).translate(0.5, 0, 0), new THREE.MeshBasicMaterial({ color: COLORES_GRUPO[t.grupo] }));
    tubo.position.copy(t.collar); tubo.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), t.dir); tubo.scale.x = 0.001; tubo.visible = false; tubos.add(tubo);
    t.boca = boca; t.tubo = tubo;
  }
  scene.add(bocas, tubos);
  // los taladros ya perforados del disparo anterior no existen: el frente es nuevo. Bloque de macizo delante del frente (para la vista en corte)
  // jumbo
  const jb = jumbo({ brazos: 2 });
  jb.grupo.position.set(XF - 8.7, 0, 0);
  scene.add(jb.grupo);
  const aLocal = (v) => jb.grupo.worldToLocal(v.clone());
  const dirLocal = (d) => d.clone(); // el jumbo no está rotado
  // agua de barrido: neblina en el emboquille
  const neblina = polvo({ max: 700, color: "#cfd6d8", tam: 0.12, viento: [-0.6, 0.25, 0], vida: 3, opacidad: 0.3 });
  neblina.puntos.material.uniforms.uEscala.value = 700; scene.add(neblina.puntos);
  // luces: faros del jumbo hacia el frente, lámpara de casco con la cámara, luminaria lejana
  for (const s of [1, -1]) { const sp = new THREE.SpotLight("#fff2dc", 70, 30, 0.7, 0.5, 1.5); sp.position.set(XF - 7.5, 3.0, s * 0.9); sp.target.position.set(XF, 1.8, s * 0.3); sp.castShadow = s > 0; scene.add(sp, sp.target); }
  const casco = new THREE.SpotLight("#fff4e2", 14, 40, 0.85, 0.9, 1.4); scene.add(casco, casco.target);
  const lum = new THREE.PointLight("#ffd29a", 8, 16, 1.8); lum.position.set(X0 + 5, 3.3, 0.8); scene.add(lum);

  // animación: cada brazo toma su mitad de la malla, de arriba hacia abajo
  const [izq, der] = ordenPerforacion({ taladros }, 2);
  const listas = [izq.map((t) => taladros.find((x) => x.id === t.id)), der.map((t) => taladros.find((x) => x.id === t.id))];
  const T_MOVER = 1.1, T_PERF = 2.6, T_SACAR = 0.7; // segundos de animación por taladro (secuencia, no tiempo real)
  const porTal = T_MOVER + T_PERF + T_SACAR;
  const T = Math.max(...listas.map((l) => l.length)) * porTal + 1.5;
  let t = 0, anim = false, velocidad = 1, modoSec = false, tSec = 0;
  const reposo = [new THREE.Vector3(XF - 1.5, 1.9, 0.62), new THREE.Vector3(XF - 1.5, 1.9, -0.62)];
  function aplicar(tt) {
    let hechos = 0;
    for (const t0 of taladros) t0.hecho = 0;
    listas.forEach((lista, b) => {
      const k = Math.floor(tt / porTal), f = tt - k * porTal;
      for (let j = 0; j < Math.min(k, lista.length); j++) lista[j].hecho = 1;
      const actual = lista[k], previo = lista[k - 1];
      if (!actual) { jb.apuntar(b, aLocal(reposo[b]), new THREE.Vector3(1, 0, 0), 0); return; }
      const desde = previo ? previo.collar.clone().addScaledVector(previo.dir, -0.25) : reposo[b];
      if (f < T_MOVER) {
        const u = f / T_MOVER, s = u * u * (3 - 2 * u);
        const p = desde.clone().lerp(actual.collar.clone().addScaledVector(actual.dir, -0.25), s);
        jb.apuntar(b, aLocal(p), dirLocal(actual.dir), 0);
      } else if (f < T_MOVER + T_PERF) {
        const a = ((f - T_MOVER) / T_PERF) * malla.largo;
        actual.hecho = a / malla.largo;
        jb.apuntar(b, aLocal(actual.collar), dirLocal(actual.dir), a);
        neblina.emitir(actual.collar.clone().add(new THREE.Vector3(-0.1, 0, 0)), 2, 0.15, 0.25);
      } else {
        actual.hecho = 1;
        const u = (f - T_MOVER - T_PERF) / T_SACAR;
        jb.apuntar(b, aLocal(actual.collar.clone().addScaledVector(actual.dir, -0.25 * u)), dirLocal(actual.dir), malla.largo * (1 - u));
      }
    });
    for (const x of taladros) {
      x.boca.visible = x.hecho > 0.02;
      x.tubo.visible = x.hecho > 0.02 && xray;
      x.tubo.scale.x = Math.max(0.001, x.hecho * malla.largo);
      if (x.hecho >= 1) hechos++;
    }
    return hechos;
  }
  const base = `${malla.taladros.filter((x) => x.cargado).length} cargados + ${malla.taladros.filter((x) => !x.cargado).length} vacíos · perforación ${malla.largo.toFixed(2)} m · avance ${malla.avance.toFixed(2)} m (${Math.round((malla.avance / malla.largo) * 100)} %) · Ø ${malla.diam * 1000} mm, alivio ${malla.diamAlivio * 1000} mm`;
  const lect = (h) => ctx.lectura(modoSec ? textoSec : `Perforados ${h}/${taladros.length} · ${base}`);
  // vista de rayos X: el frente se vuelve translúcido y se ven los taladros dentro del macizo
  let xray = false;
  function ponerXray(v) {
    xray = v; matFrente.opacity = v ? 0.28 : 1; matFrente.depthWrite = !v; matFrente.needsUpdate = true;
    trazasFrente.visible = !v; for (const x of taladros) x.tubo.visible = v && x.hecho > 0.02; esc.marcar();
  }
  // secuencia de salida: los grupos se encienden en el orden de sus retardos
  const retardos = [...new Set(taladros.filter((x) => x.cargado).map((x) => x.retardo))].sort((a, b) => a - b);
  let textoSec = "";
  const coloresBase = new Map();
  function pintarSecuencia(ts) {
    const paso = 0.9, idx = Math.min(retardos.length, Math.floor(ts / paso));
    const actual = retardos[Math.min(idx, retardos.length - 1)];
    for (const x of taladros) {
      const m = x.boca.material === matBoca ? (x.boca.material = new THREE.MeshBasicMaterial({ color: "#050505" })) : x.boca.material;
      x.boca.visible = true;
      x.boca.scale.setScalar(2.2);
      if (!x.cargado) { m.color.set("#3b6fd1"); continue; }
      const ya = x.retardo <= actual;
      m.color.set(ya ? COLORES_GRUPO[x.grupo] : "#1a1a1a");
      if (x.retardo === actual) m.color.offsetHSL(0, 0, 0.15 * Math.sin(ts * 12));
    }
    const g = taladros.find((x) => x.retardo === actual);
    textoSec = `Secuencia de salida · retardo ${actual} · ${g?.grupo} (${taladros.filter((x) => x.retardo === actual).length} taladros) · primero el arranque abre la cara libre hacia los alivios`;
    return ts > retardos.length * paso + 1.5;
  }
  function salirSecuencia() {
    for (const x of taladros) { x.boca.material = matBoca; x.boca.scale.setScalar(1); }
    modoSec = false; aplicar(t); lect(aplicar(t)); esc.marcar();
  }
  esc.alAnimar((dt) => {
    neblina.actualizar(dt);
    casco.position.copy(esc.camera.position).add(new THREE.Vector3(0, 0.3, 0)); casco.target.position.copy(esc.controls.target);
    if (modoSec) { tSec += dt; if (pintarSecuencia(tSec)) tSec = 0; ctx.lectura(textoSec); for (let b = 0; b < 2; b++) jb.apuntar(b, aLocal(new THREE.Vector3(XF - 3.2, 1.6, b ? -0.7 : 0.7)), new THREE.Vector3(1, 0, 0), 0); for (const x of taladros) x.tubo.visible = false; return true; }
    if (anim) { t += dt * velocidad; if (t > T) t = 0; lect(aplicar(t)); }
    return true;
  });
  lect(aplicar(0));
  // controles
  const btn = document.getElementById("perforar"), btnSec = document.getElementById("secuencia");
  const ponerBtn = () => { btn.textContent = anim ? "Pausar" : "Perforar"; btn.setAttribute("aria-pressed", String(anim)); };
  btn?.addEventListener("click", () => { if (modoSec) salirSecuencia(); anim = !anim; ponerBtn(); esc.marcar(); });
  btnSec?.addEventListener("click", () => { modoSec = !modoSec; btnSec.setAttribute("aria-pressed", String(modoSec)); if (modoSec) { anim = false; ponerBtn(); tSec = 0; } else salirSecuencia(); esc.marcar(); });
  document.getElementById("xray")?.addEventListener("change", (e) => ponerXray(e.target.checked));
  const vel = document.getElementById("vel");
  vel?.addEventListener("input", () => { velocidad = +vel.value; document.querySelector('output[for="vel"]').textContent = "×" + velocidad; });
  const prog = document.getElementById("progreso");
  prog?.addEventListener("input", () => { anim = false; ponerBtn(); if (modoSec) salirSecuencia(); t = (+prog.value / 100) * T; lect(aplicar(t)); document.querySelector('output[for="progreso"]').textContent = prog.value + " %"; esc.marcar(); });
  if (!esc.quieto.matches) { anim = true; ponerBtn(); }
  // piezas
  const enGrupo = (g) => () => { const ts = taladros.filter((x) => x.grupo === g); const c = ts.reduce((a, x) => a.add(x.collar), new THREE.Vector3()).multiplyScalar(1 / ts.length); return c.add(new THREE.Vector3(-0.3, 0, 0)); };
  const W = (o, off = [0, 0, 0]) => () => o.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(...off));
  const p = jb.partes;
  const piezas = [
    { id: "alivios", numero: 1, nombre: "Alivios", definicion: "4 taladros vacíos de 102 mm en el centro: son la cara libre hacia donde rompe el arranque.", ancla: () => new THREE.Vector3(XF - 0.3, 2.1, -0.05) },
    { id: "arranque", numero: 2, nombre: "Arranque", definicion: "3 taladros cargados pegados a los alivios; salen primero (retardos 1 a 3) y abren el hueco.", ancla: () => new THREE.Vector3(XF - 0.3, 1.75, 0.35) },
    { id: "ayudas", numero: 3, nombre: "Ayudas", definicion: "4 anillos de 4 taladros (retardos 4 a 9) que agrandan el hueco hacia afuera, cuadro por cuadro.", ancla: enGrupo("3ra ayuda") },
    { id: "cuadradores", numero: 4, nombre: "Cuadradores", definicion: "4 taladros en los hastiales (retardo 10): dan el ancho de 4,0 m.", ancla: () => taladros.find((x) => x.grupo === "cuadrador").collar.clone().add(new THREE.Vector3(-0.3, 0, 0)) },
    { id: "corona", numero: 5, nombre: "Corona", definicion: "5 cargados y 4 vacíos alternados en la bóveda (retardo 12): voladura controlada para no sobreexcavar el techo.", ancla: () => new THREE.Vector3(XF - 0.3, 3.95, 0) },
    { id: "arrastres", numero: 6, nombre: "Arrastres", definicion: "5 taladros al piso, los últimos en salir (retardo 13): levantan el material y nivelan el piso.", ancla: () => new THREE.Vector3(XF - 0.3, 0.25, 0.9) },
    { id: "brazo", numero: 7, nombre: "Brazo", definicion: "Posiciona la viga frente a cada taladro; los dos brazos trabajan a la vez, uno por mitad.", ancla: W(p.brazos[0], [0, 0.3, 0]), objetos: p.brazos },
    { id: "viga", numero: 8, nombre: "Viga de avance", definicion: "Riel de 5,2 m apoyado en la roca: por él avanza la perforadora mientras perfora.", ancla: W(p.vigas[1], [-2, 0.25, 0]), objetos: p.vigas },
    { id: "perforadora", numero: 9, nombre: "Perforadora", definicion: "Martillo hidráulico que golpea y gira la barra; el agua de barrido saca el detrito.", ancla: W(p.perforadoras[0], [0, 0.3, 0]), objetos: p.perforadoras },
    { id: "barra", numero: 10, nombre: "Barra y broca", definicion: "Barra de 14 pies (4,27 m) y broca de 51 mm: perfora 3,90 m de taladro.", ancla: W(p.brocas[1], [-0.6, 0.15, 0]), objetos: [...p.barras, ...p.brocas] },
    { id: "cabina", numero: 11, nombre: "Puesto del operador", definicion: "Bajo el techo protector, a unos 7 m del frente sin sostener.", ancla: W(p.cabina, [0, 1.9, 0]), objetos: [p.cabina] },
    { id: "gatas", numero: 12, nombre: "Gatas", definicion: "Apoyos hidráulicos que fijan el jumbo para que no se mueva al perforar.", ancla: W(p.gatas[0], [0, 0.2, 0.2]), objetos: p.gatas },
    { id: "pintura", numero: 13, nombre: "Malla pintada", definicion: "El topógrafo pinta cada taladro (rojo cargado, azul vacío) y la línea de gradiente a 1 m del piso.", ancla: () => new THREE.Vector3(XF - 0.2, 1.0, -1.5), objetos: [pintura] },
  ];
  const senal = senalar(esc, ctx.contenedor, piezas, { modo: ctx.modo, foco: ctx.foco });
  esc.mirar(new THREE.Vector3(XF - 0.5, 1.9, -0.1), 256, 4, 6.4);
  esc.controls.minDistance = 1.5; esc.controls.maxDistance = 14; esc.controls.maxPolarAngle = Math.PI * 0.62;
  window.GEO = {
    escena: esc, senal, jumbo: jb,
    igualarVista: (v) => { if (v.progreso !== undefined) { anim = false; ponerBtn(); t = v.progreso * T; lect(aplicar(t)); } esc.mirar(new THREE.Vector3(...v.objetivo), v.az, v.el, v.dist); },
  };
}
