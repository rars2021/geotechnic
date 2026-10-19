// Ejemplo · corte de talud de tajo, a la manera de una pared de Antamina (números en ficha.mjs).
import * as THREE from "three";
import { crearEscena } from "../../kit/escena.js";
import { perfilBancos, mallaTalud, escombrosTalud, mediasCanas, cerros, tapaSeccion, sDeBanco, huellasNeumatico, pretil } from "../../kit/terreno.js";
import { crearDFN, trazasSobreMalla, lineasTrazas } from "../../kit/fracturas.js";
import { zona, colorRoca, agua } from "../../kit/volumenes.js";
import { materialRoca, PALETAS } from "../../kit/materiales.js";
import { rgb, suave, clamp, rad, grad, ruido3 } from "../../kit/nucleo.js";
import { senalar } from "../../kit/senalar.js";
import { camionAcarreo } from "../../kit/equipos.js";

async function montar(ctx) {
  const esc = crearEscena(ctx.contenedor, { cielo: "andino", sol: { az: 262, alt: 30 }, extension: 95, niebla: 0.00022, exposicion: 1.18 });
  const { scene } = esc;
  const LARGO = 92;
  // Familias ilustrativas (no hay levantamiento de esta pared en el catálogo de fuentes): dos subverticales y una inclinada.
  const familias = [
    { nombre: "J1", buz: 82, dirBuz: 205, kappa: 45, espaciado: 1.8, persistencia: 3.2, relieve: 0.55, maxDiscos: 500 },
    { nombre: "J2", buz: 75, dirBuz: 110, kappa: 35, espaciado: 2.4, persistencia: 2.6, relieve: 0.45, maxDiscos: 400 },
    { nombre: "J3", buz: 38, dirBuz: 330, kappa: 30, espaciado: 3.0, persistencia: 4.0, relieve: 0.4, maxDiscos: 350 },
  ];
  const caja = { min: [-LARGO / 2, -4, -110], max: [LARGO / 2, 52, 36] };
  const dfn = crearDFN(familias, caja, 7);
  // Falla con panizo: plano que corta la pared en diagonal (buz 70° hacia el oeste-suroeste)
  const nF = (() => { const b = rad(70), d = rad(250); return [Math.sin(b) * Math.sin(d), Math.cos(b), -Math.sin(b) * Math.cos(d)]; })();
  const pF = [8, 20, -30];
  const distFalla = (x, y, z) => (x - pF[0]) * nF[0] + (y - pF[1]) * nF[1] + (z - pF[2]) * nF[2];
  const falla = zona({ tipo: "plano", punto: pF, normal: nF, espesor: 1.4, transicion: 2.5, ruido: 0.8, semilla: 3 });
  const halo = zona({ tipo: "plano", punto: pF, normal: nF, espesor: 6, transicion: 7, ruido: 3, semilla: 4 });
  const oxidos = zona({ tipo: "elipsoide", centro: [-26, 34, -40], radios: [24, 16, 20], transicion: 9, ruido: 7, semilla: 6 });
  const nOx = ruido3(41);
  const color = colorRoca(["#b1b4b2", "#a3a7a6", "#c0c1bc"], [
    { f: halo, paleta: PALETAS.argilica, peso: 0.75 },
    { f: (x, y, z) => oxidos(x, y, z) * clamp(0.5 + 0.9 * nOx(x * 0.11, y * 0.11, z * 0.11)), paleta: ["#b5a07a", "#a28d6a"], peso: 0.35 },
    { f: falla, paleta: PALETAS.panizo, peso: 1 },
  ]);
  const agu = agua({ nivel: 7, transicion: 2.5, chorreras: 0.7, largoChorrera: 9 });
  const humedad = (x, y, z, dist, pend) => clamp(Math.max(agu(x, y, z, dist, pend) * 0.85, falla(x, y, z) * (1 - suave(10, 30, y)) * 0.9));
  let bfa2 = 65;
  const construir = () => {
    const perfil = perfilBancos({ piso: 34, bancos: [{ altura: 15, cara: 71, berma: 7.5 }, { altura: 15, cara: bfa2, berma: 7.5 }, { altura: 15, cara: 65, berma: 26 }] });
    const huellas = huellasNeumatico({ carriles: [-27, -23.5, -14, -10.5], ancho: 1.3 });
    const regionDe = (u, s, tramo, f) => {
      const x = u, y = f.z, z = -f.h;
      if (falla(x, y, z) > 0.5) return 10;
      if (oxidos(x, y, z) > 0.55 && tramo.tipo === "cara") return 11;
      if (tramo.tipo === "cara" && f.z < 7.5) return 12; // bajo la línea de surgencia
      if (Math.abs(f.dCresta) < 2.2 && f.bancoPie >= 0) return 8;
      if (f.dPie < 0 && f.dPie > -6 && f.bancoPie === 1) return 9;
      if (tramo.tipo === "cara") return tramo.banco + 1;
      if (tramo.tipo === "berma") return 4 + tramo.banco;
      return tramo.tipo === "piso" ? 6 : 7;
    };
    const t = mallaTalud({
      perfil, largo: LARGO, paso: 0.28, dfn, color, humedad, region: regionDe, huellas,
      oxidos: (x, y, z) => 0.12 + 0.6 * oxidos(x, y, z), estrias: 0.32, bloques: 1.7, retroceso: 1.9,
      escombros: { alto: 2.6, reposo: 34 }, polvoBerma: rgb("#c4c2ba"), finos: rgb("#aeaba3"),
      extra: (x, y, z) => -0.9 * falla(x, y, z) - 0.15 * halo(x, y, z),
    });
    return t;
  };
  const matRoca = materialRoca({ humedad: true, regiones: true, escala: 0.55, fuerza: 0.16, escala2: 2.2, fuerza2: 0.04, variacion: 0.08 });
  const grupo = new THREE.Group();
  scene.add(grupo);
  let talud, malla, trazas, escombros, canas, tapas = [];
  const matCanas = new THREE.MeshStandardMaterial({ color: "#8b8f8e", roughness: 0.85 });
  const matTapa = materialRoca({ escala: 0.6, fuerza: 0.1, escala2: 2.5, fuerza2: 0.03 });
  matTapa.side = THREE.DoubleSide;
  function rehacer() {
    for (const o of [malla, trazas, escombros, canas, ...tapas]) if (o) { grupo.remove(o); o.traverse?.((m) => m.geometry?.dispose()); }
    talud = construir();
    malla = new THREE.Mesh(talud.geometria, matRoca);
    malla.castShadow = malla.receiveShadow = true;
    grupo.add(malla);
    const tapaD = tapaSeccion(talud, { borde: "derecha", base: -14, color });
    const tapaF = tapaSeccion(talud, { borde: "frente", base: -14, color });
    const tapaI = tapaSeccion(talud, { borde: "izquierda", base: -14, color });
    tapas = [tapaD, tapaF, tapaI].map((g) => { const m = new THREE.Mesh(g, matTapa); m.receiveShadow = true; grupo.add(m); return m; });
    const porFam = trazasSobreMalla(dfn, talud.geometria, { desplazar: 0.05 });
    const porFamT = trazasSobreMalla(dfn, tapaD, { desplazar: 0.03 });
    porFamT.forEach((s, i) => porFam[i].push(...s));
    trazas = lineasTrazas(porFam, { opacidad: 0.2 });
    grupo.add(trazas);
    escombros = escombrosTalud(talud, { cantidad: 5200, tamMedio: 0.26, desvTam: 0.22, color: (x, y, z) => color(x, y, z).map((v) => v * 0.92) });
    grupo.add(escombros);
    canas = new THREE.Mesh(mediasCanas(talud, 0, { espaciado: 16 * 0.127, diametro: 0.127, visibles: 0.62 }), matCanas);
    grupo.add(canas);
    const b1 = sDeBanco(talud.perfil, 1);
    const ira = grad(Math.atan(30 / (15 / Math.tan(rad(71)) + 7.5 + 15 / Math.tan(rad(bfa2)) + 7.5 - 7.5)));
    const iraG = grad(Math.atan(45 / (15 / Math.tan(rad(71)) + 15 / Math.tan(rad(bfa2)) + 15 / Math.tan(rad(65)) + 15)));
    ctx.lectura(`Cara del banco 2: ${bfa2}° · ángulo interrampa (pie a pie, 3 bancos): ${iraG.toFixed(1)}° · banco 15 m · berma 7,5 m`);
    esc.marcar();
    return b1;
  }
  rehacer();
  // cerros de fondo, piso lejano y pretil
  const montes = new THREE.Mesh(cerros({ tam: [16000, 16000], res: 360, alto: 1100, base: -60, centro: [0, -4000], hueco: { x: 0, z: -300, r: 2600 }, cotaNieve: 1250, semilla: 5, colores: { pasto: "#a49c8c", roca: "#7d7a74", nieve: "#eef1f3" } }),
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  montes.position.y = 46; // la base del bloque (-14) queda sobre el piso del tajo
  scene.add(montes);
  const curvaPretil = new THREE.CatmullRomCurve3([new THREE.Vector3(-LARGO / 2, 0, 31), new THREE.Vector3(0, 0, 31.4), new THREE.Vector3(LARGO / 2, 0, 31)]);
  const matMuro = materialRoca({ escala: 1.2, fuerza: 0.3 }); matMuro.side = THREE.DoubleSide;
  const muro = new THREE.Mesh(pretil(curvaPretil, { alto: 2, ancho: 3, color: "#a7a49c" }), matMuro);
  muro.castShadow = muro.receiveShadow = true;
  scene.add(muro);
  // camión para escala
  const camion = camionAcarreo({ cargado: true });
  camion.grupo.position.set(-18, 0, 20);
  camion.grupo.rotation.y = 0.04;
  scene.add(camion.grupo);
  // piezas señalables
  const P = (u, s, sobre = 0.6) => () => { const m = talud.muestra(u, s); return m.p.clone().addScaledVector(m.n, sobre); };
  const sb = (b) => sDeBanco(talud.perfil, b);
  const lineas = trazas ? () => trazas.children : () => [];
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
  piezas[4].objetos = [canas];
  piezas[2].objetos = [escombros];
  Object.defineProperty(piezas[5], "lineas", { get: () => trazas.children });
  const senal = senalar(esc, ctx.contenedor, piezas, { modo: ctx.modo, foco: ctx.foco });
  // control: ángulo de cara del banco 2
  const input = document.getElementById("bfa2"), out = document.querySelector('output[for="bfa2"]');
  if (input) input.addEventListener("change", () => { bfa2 = +input.value; out.textContent = bfa2 + "°"; rehacer(); piezas[4].objetos = [canas]; piezas[2].objetos = [escombros]; });
  if (input) input.addEventListener("input", () => { out.textContent = input.value + "°"; });
  const toggle = document.getElementById("ver-trazas");
  if (toggle) toggle.addEventListener("change", () => { trazas.visible = toggle.checked; esc.marcar(); });
  // cámara
  const objetivo = new THREE.Vector3(-4, 17, -14);
  esc.mirar(objetivo, 202, 12, 118);
  esc.controls.minDistance = 8; esc.controls.maxDistance = 600;
  window.GEO = {
    escena: esc, senal,
    igualarVista: (v) => esc.mirar(new THREE.Vector3(...v.objetivo), v.az, v.el, v.dist),
  };
}
