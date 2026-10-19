// Ejemplo · perforación de un frente de 4,0 × 4,0 m con jumbo de dos brazos (malla real de Alpayana-Casapalca).
// Motor A (jumbo, equipos/jumbo) dentro del motor B (roca y frente): ambos vienen de montaje.js, lo mismo que juzga el juez.
import * as THREE from "three";
import { crearEscena } from "../../kit/escena.js";
import { frente, pernos, mangaVentilacion, tuberias, charcos } from "../../kit/labor.js";
import { trazasSobreMalla, lineasTrazas } from "../../kit/fracturas.js";
import { polvo } from "../../kit/volumenes.js";
import { materialRoca } from "../../kit/materiales.js";
import { rgb } from "../../kit/nucleo.js";
import { COLORES_GRUPO } from "../../kit/procesos.js";
import { mallasMaquina } from "../../motorA/mallas.js";
import { EQUIPO_JUMBO } from "../../equipos/jumbo/modelo.js";
import { clamp } from "../../kit/nucleo.js";
import { senalar } from "../../kit/senalar.js";
import { montajeJumbo } from "./montaje.js";

async function montar(ctx) {
  const esc = crearEscena(ctx.contenedor, { fondo: "subterraneo", niebla: [16, 52], exposicion: 1.3, fov: 46, cerca: 0.05, lejos: 300 });
  const { scene } = esc;
  const m = montajeJumbo();
  const { M, gal, mac, malla, taladros, XF, X0 } = m;
  // ── motor B: galería, frente rugoso, trazas de juntas, sostenimiento y servicios
  const matRoca = materialRoca({ humedad: true, regiones: true, escala: 1.4, fuerza: 0.2, escala2: 5, fuerza2: 0.06 });
  const roca = new THREE.Mesh(gal.geometria, matRoca); roca.receiveShadow = roca.castShadow = true; scene.add(roca);
  const matFrente = materialRoca({ escala: 1.6, fuerza: 0.22, escala2: 6, fuerza2: 0.06 });
  matFrente.transparent = true;
  const geoFrente = frente(gal, { x: XF, macizo: mac, res: 90 });
  const fr = new THREE.Mesh(geoFrente, matFrente); fr.receiveShadow = true; scene.add(fr);
  scene.add(lineasTrazas(trazasSobreMalla(mac.dfn, gal.geometria, { desplazar: -0.02, maxNormalY: 0.98 }), { opacidad: 0.2 }));
  const trazasFrente = lineasTrazas(trazasSobreMalla(mac.dfn, geoFrente, { desplazar: -0.02, maxNormalY: 0.98 }), { opacidad: 0.28 });
  scene.add(trazasFrente);
  scene.add(pernos(gal, { x0: -8.5, x1: XF - 1.5, espaciado: 1.5, desdeY: 1.3 }));
  scene.add(mangaVentilacion({ x0: X0, x1: XF - 14, y: 3.85, z: -1.1, diametro: 0.6 }));
  scene.add(tuberias({ x0: X0, x1: XF - 3, z: 1.88, alturas: [1.5, 1.75] }));
  scene.add(charcos(gal, { cantidad: 5, x0: X0 + 2, x1: XF - 2 }));
  // pintura de la malla (rojo cargado, azul vacío) sobre el emboquille real, y la línea de gradiente
  const v3 = (a) => new THREE.Vector3(...a);
  const pintura = new THREE.Group();
  const matRojo = new THREE.MeshBasicMaterial({ color: "#c8261c" }), matAzul = new THREE.MeshBasicMaterial({ color: "#2a55c4" });
  for (const t of taladros) {
    const anillo = new THREE.Mesh(new THREE.RingGeometry(t.diam * 0.9 + 0.025, t.diam * 0.9 + 0.05, 20), t.cargado ? matRojo : matAzul);
    anillo.position.copy(v3(t.collar)).add(new THREE.Vector3(-0.06, 0, 0)); anillo.rotation.y = -Math.PI / 2; pintura.add(anillo);
  }
  const gradiente = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.04), matRojo);
  gradiente.rotation.y = -Math.PI / 2; gradiente.position.set(Math.min(...taladros.filter((x) => x.y < 1.3).map((x) => x.collar[0])) - 0.08, 1.0, 0); pintura.add(gradiente);
  scene.add(pintura);
  // taladros: boca oscura en el frente y tubo dentro del macizo (vista de rayos X); contrato A → B: los perfora el jumbo
  const bocas = new THREE.Group(), tubos = new THREE.Group(), matBoca = new THREE.MeshBasicMaterial({ color: "#050505" });
  for (const t of taladros) {
    const boca = new THREE.Mesh(new THREE.CircleGeometry(t.diam / 2 + 0.008, 16), matBoca);
    boca.position.copy(v3(t.collar)).add(new THREE.Vector3(-0.065, 0, 0)); boca.rotation.y = -Math.PI / 2; boca.visible = false; bocas.add(boca);
    const tubo = new THREE.Mesh(new THREE.CylinderGeometry(t.diam / 2, t.diam / 2, 1, 10).rotateZ(-Math.PI / 2).translate(0.5, 0, 0), new THREE.MeshBasicMaterial({ color: COLORES_GRUPO[t.grupo] }));
    tubo.position.copy(v3(t.collar)); tubo.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), v3(t.dir)); tubo.scale.x = 0.001; tubo.visible = false; tubos.add(tubo);
    t.boca = boca; t.tubo = tubo;
  }
  scene.add(bocas, tubos);
  // ── motor A: el jumbo asentado y con sus gatas en el piso
  const dib = mallasMaquina(M, EQUIPO_JUMBO.dibujo);
  scene.add(dib.raiz);
  for (const l of ["i", "d"]) { // faro de trabajo en cada viga, hacia el frente
    const g = M.dims.geo[l], luz = new THREE.SpotLight("#fff2dc", 22, 25, 0.6, 0.5, 1.5);
    luz.position.set(g.xr + 0.4, g.yAx + 0.4, g.zT); luz.target.position.set(g.xr + 9, g.yAx, g.zT);
    luz.castShadow = l === "i"; dib.grupo(`viga ${l}`).add(luz, luz.target);
  }
  const neblina = polvo({ max: 700, color: "#cfd6d8", tam: 0.12, viento: [-0.6, 0.25, 0], vida: 3, opacidad: 0.3 });
  neblina.puntos.material.uniforms.uEscala.value = 700; scene.add(neblina.puntos);
  const casco = new THREE.SpotLight("#fff4e2", 14, 40, 0.85, 0.9, 1.4); scene.add(casco, casco.target);
  const lum = new THREE.PointLight("#ffd29a", 8, 16, 1.8); lum.position.set(X0 + 5, 3.3, 0.8); scene.add(lum);

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
    xray = v; matFrente.opacity = v ? 0.28 : 1; matFrente.depthWrite = !v; matFrente.needsUpdate = true;
    trazasFrente.visible = !v; aplicar(t); esc.marcar();
  }
  const retardos = [...new Set(taladros.filter((x) => x.cargado).map((x) => x.retardo))].sort((a, b) => a - b);
  let textoSec = "";
  function pintarSecuencia(ts) {
    const paso = 0.9, idx = Math.min(retardos.length, Math.floor(ts / paso)), actual = retardos[Math.min(idx, retardos.length - 1)];
    for (const x of taladros) {
      const mt = x.boca.material === matBoca ? (x.boca.material = new THREE.MeshBasicMaterial({ color: "#050505" })) : x.boca.material;
      x.boca.visible = true; x.boca.scale.setScalar(2.2);
      if (!x.cargado) { mt.color.set("#3b6fd1"); continue; }
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
  deGaleria.push(lum);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(90, 90, 160, 160).rotateX(-Math.PI / 2), materialRoca({ escala: 3.2, fuerza: 0.35, escala2: 11, fuerza2: 0.25, variacion: 0.35 }));
  { const Pp = piso.geometry.attributes.position.array, n = Pp.length / 3, c = new Float32Array(n * 3), r = (i) => Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    for (let i = 0; i < n; i++) { const tt = r(i); c.set(rgb(tt < 0.33 ? "#8a8378" : tt < 0.66 ? "#7a7268" : "#9a9387"), i * 3); Pp[i * 3 + 1] = -0.02 + 0.03 * r(i + 7); }
    piso.geometry.setAttribute("color", new THREE.BufferAttribute(c, 3)); piso.geometry.computeVertexNormals(); }
  piso.receiveShadow = true; piso.visible = false; piso.position.x = -8; scene.add(piso);
  const sol = new THREE.DirectionalLight("#fff3e0", 3.8); sol.position.set(-14, 20, 12); sol.target.position.set(-8, 0, 0); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 }); sol.visible = false; scene.add(sol, sol.target);
  const cielo = new THREE.HemisphereLight("#c9d6e6", "#7a6f62", 0.7); cielo.visible = false; scene.add(cielo);
  function verGaleria(v) {
    for (const o of deGaleria) o.visible = v;
    piso.visible = sol.visible = cielo.visible = !v;
    scene.background = new THREE.Color(v ? "#050505" : "#b9c4cf"); scene.fog = v ? new THREE.Fog("#0b0a09", 16, 52) : null;
    esc.controls.maxDistance = v ? 18 : 40; esc.marcar();
  }
  esc.mirar(new THREE.Vector3(XF - 2.5, 1.9, -0.1), 252, 6, 9);
  esc.controls.minDistance = 1.5; esc.controls.maxDistance = 18; esc.controls.maxPolarAngle = Math.PI * 0.62;
  window.GEO = {
    escena: esc, senal, jumbo: dib, modelo: M, montaje: m,
    verGaleria,
    igualarVista: (v) => {
      verGaleria(v.galeria !== false);
      if (v.progreso !== undefined) { anim = false; ponerBtn(); t = v.progreso * m.T; lect(aplicar(t)); }
      esc.mirar(new THREE.Vector3(...v.objetivo), v.az, v.el, v.dist);
    },
  };
}
