// Geotechnic · equipos paramétricos. Cada máquina se arma con piezas comunes (llanta, cilindro, cabina, placa)
// y devuelve { grupo, partes, poner(estado), dims }. Medidas en metros; x = adelante, y = arriba, z = izquierda.
// Las proporciones de cada equipo vienen de references/reglas-equipos.md (con su fuente o marcadas "estimado").
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { materialPintura, MATERIALES } from "./materiales.js";
import { azar, ruido3, rgb } from "./nucleo.js";

// ───────── piezas comunes ─────────

export function cajaB(w, h, d, r = 0.05, mat) {
  const g = new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.2, h / 2.2, d / 2.2));
  const m = new THREE.Mesh(g, mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}

/** Placa extruida desde un perfil 2D [[x,y],...] en el plano XY, con espesor a lo largo de Z. */
export function placa(perfil, espesor, mat, bisel = 0.02) {
  const s = new THREE.Shape(perfil.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth: espesor, bevelEnabled: bisel > 0, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 1, steps: 1 });
  g.translate(0, 0, -espesor / 2);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}

/** Tubo entre dos puntos (barandas, mangueras, vigas redondas). */
export function tubo(a, b, radio, mat, seg = 10) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const L = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(radio, radio, L, seg);
  const m = new THREE.Mesh(g, mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  m.castShadow = true;
  return m;
}

/** Baranda: tubos por una polilínea más parantes cada `cada` m. */
export function baranda(pts, alto, mat, cada = 1.2) {
  const g = new THREE.Group();
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    g.add(tubo([a[0], a[1] + alto, a[2]], [b[0], b[1] + alto, b[2]], 0.025, mat, 6));
    g.add(tubo([a[0], a[1] + alto * 0.5, a[2]], [b[0], b[1] + alto * 0.5, b[2]], 0.02, mat, 6));
    const L = Math.hypot(b[0] - a[0], b[2] - a[2]);
    const n = Math.max(1, Math.round(L / cada));
    for (let k = 0; k <= n; k++) {
      const t = k / n, p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      g.add(tubo(p, [p[0], p[1] + alto, p[2]], 0.022, mat, 6));
    }
  }
  return g;
}

/**
 * Llanta de minería: banda con tacos en chevrón, flancos redondeados y aro con pernos. Eje de giro: Z.
 * diam, ancho, aro (diámetro del aro, fracción), tacos (cantidad), surco (profundidad del taco, m).
 */
const _cacheLlanta = new Map();
export function llanta({ diam = 1.75, ancho = 0.62, aro = 0.56, tacos = 28, surco = 0.05, colorAro = "#d1a227", barro = 0.6 } = {}) {
  const clave = [diam, ancho, aro, tacos, surco].join();
  let geo = _cacheLlanta.get(clave);
  if (!geo) {
    const R = diam / 2, Ra = (diam * aro) / 2, W = ancho / 2, r = Math.min(W * 0.45, (R - Ra) * 0.45);
    // perfil (x = radio, y = lateral) desde el aro por el flanco, la banda y el otro flanco
    const pf = [];
    pf.push([Ra, -W * 0.92]);
    for (let a = 0; a <= 8; a++) { const t = -Math.PI / 2 + (a / 8) * (Math.PI / 2); pf.push([R - r + r * Math.cos(t) * 1.0, -W + r + r * Math.sin(t)]); }
    for (let k = 1; k < 10; k++) pf.push([R, -W + r + ((2 * W - 2 * r) * k) / 10]);
    for (let a = 0; a <= 8; a++) { const t = (a / 8) * (Math.PI / 2); pf.push([R - r + r * Math.cos(t), W - r + r * Math.sin(t)]); }
    pf.push([Ra, W * 0.92]);
    const seg = Math.max(72, tacos * 4);
    const g = new THREE.LatheGeometry(pf.map(([x, y]) => new THREE.Vector2(x, y)), seg);
    // lathe gira alrededor de Y: hay que pasar el eje a Z
    const P = g.attributes.position.array;
    for (let i = 0; i < P.length; i += 3) {
      const x = P[i], y = P[i + 1], z = P[i + 2];
      const rr = Math.hypot(x, z), th = Math.atan2(z, x);
      // tacos: solo en la banda (rr cerca de R)
      const enBanda = Math.max(0, (rr - (R - r * 1.2)) / (r * 1.2));
      const lat = y / W;
      const fase = ((th / (2 * Math.PI)) * tacos + Math.abs(lat) * 0.9 + (lat > 0 ? 0.5 : 0)) % 1;
      const taco = fase < 0.55 && Math.abs(lat) > 0.08 ? 1 : 0;
      const k = 1 - (surco * (1 - taco) * enBanda) / rr;
      P[i] = x * k; P[i + 1] = z * k; P[i + 2] = y; // (x, z, y): eje de giro = Z
    }
    g.computeVertexNormals();
    geo = { g, R, Ra, W };
    _cacheLlanta.set(clave, geo);
  }
  const grupo = new THREE.Group();
  const goma = materialPintura("#1f1e1c", { rugosidad: 0.9, metal: 0, barro: "#6e6252", alturaBarro: diam * 0.55, suciedad: barro });
  const neum = new THREE.Mesh(geo.g, goma);
  neum.castShadow = neum.receiveShadow = true;
  grupo.add(neum);
  // aro: disco cóncavo con pernos
  const pAro = [[0, -geo.W * 0.5], [geo.Ra * 0.38, -geo.W * 0.5], [geo.Ra * 0.55, -geo.W * 0.7], [geo.Ra * 0.98, -geo.W * 0.86], [geo.Ra * 1.0, -geo.W * 0.92]];
  const ga = new THREE.LatheGeometry(pAro.map(([x, y]) => new THREE.Vector2(x, y)), 40);
  ga.rotateX(Math.PI / 2);
  const matAro = materialPintura(colorAro, { rugosidad: 0.55, metal: 0.3, suciedad: barro * 0.9, alturaBarro: diam * 0.5 });
  for (const lado of [1, -1]) {
    const m = new THREE.Mesh(ga, matAro);
    m.scale.z = lado; m.castShadow = true;
    grupo.add(m);
    const nP = 16;
    const pern = new THREE.InstancedMesh(new THREE.CylinderGeometry(geo.Ra * 0.035, geo.Ra * 0.035, 0.04, 6).rotateX(Math.PI / 2), MATERIALES.negro(), nP);
    const d = new THREE.Object3D();
    for (let k = 0; k < nP; k++) { const a = (k / nP) * Math.PI * 2; d.position.set(Math.cos(a) * geo.Ra * 0.3, Math.sin(a) * geo.Ra * 0.3, lado * (geo.W * 0.5 + 0.02)); d.updateMatrix(); pern.setMatrixAt(k, d.matrix); }
    grupo.add(pern);
  }
  grupo.userData.radio = geo.R;
  return grupo;
}

/** Cilindro hidráulico de A a B (en el sistema del padre). Devuelve { grupo, apuntar(A, B) }. */
export function cilindro(dBarril = 0.18, dVastago = 0.09, matBarril) {
  const grupo = new THREE.Group();
  const barril = new THREE.Mesh(new THREE.CylinderGeometry(dBarril / 2, dBarril / 2, 1, 14), matBarril || MATERIALES.negro());
  const vastago = new THREE.Mesh(new THREE.CylinderGeometry(dVastago / 2, dVastago / 2, 1, 12), MATERIALES.cromo());
  barril.castShadow = vastago.castShadow = true;
  grupo.add(barril, vastago);
  const A = new THREE.Vector3(), B = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  function apuntar(a, b) {
    A.set(...a); B.set(...b);
    const L = A.distanceTo(B), Lb = Math.min(L * 0.62, L - 0.1);
    grupo.position.copy(A);
    grupo.quaternion.setFromUnitVectors(up, B.clone().sub(A).normalize());
    barril.scale.y = Lb; barril.position.y = Lb / 2;
    vastago.scale.y = L - Lb * 0.85; vastago.position.y = Lb * 0.85 + (L - Lb * 0.85) / 2;
  }
  return { grupo, apuntar };
}

/** Faro: lente emisiva y, si se pide, una SpotLight real que proyecta sombra. */
export function faro({ luz = false, alcance = 60, angulo = 0.55, intensidad = 60, color = "#fff1d6", sombra = false } = {}) {
  const g = new THREE.Group();
  const caja = cajaB(0.18, 0.14, 0.1, 0.02, MATERIALES.negro());
  const lente = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), MATERIALES.luz(color));
  lente.position.set(0, 0, 0.051);
  g.add(caja, lente);
  if (luz) {
    const s = new THREE.SpotLight(color, intensidad, alcance, angulo, 0.45, 1.6);
    s.position.set(0, 0, 0.06);
    s.target.position.set(0, -0.6, 10);
    s.castShadow = sombra;
    if (sombra) { s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0005; }
    g.add(s, s.target);
    g.userData.luz = s;
  }
  return g;
}

/** Cabina con parantes, techo y vidrios. Origen en el centro del piso. */
export function cabina(w, h, d, matPintura, op = {}) {
  const g = new THREE.Group();
  const p = op.parante ?? 0.08;
  const negro = MATERIALES.negro(), vidrio = MATERIALES.vidrio();
  for (const [x, z] of [[w / 2, d / 2], [-w / 2, d / 2], [w / 2, -d / 2], [-w / 2, -d / 2]]) {
    const m = cajaB(p, h, p, 0.015, matPintura); m.position.set(x - Math.sign(x) * p / 2, h / 2, z - Math.sign(z) * p / 2); g.add(m);
  }
  const techo = cajaB(w + 0.08, 0.1, d + 0.08, 0.03, matPintura); techo.position.y = h + 0.05; g.add(techo);
  const vid = [[w - p * 2, h * 0.68, 0.02, 0, d / 2 - p / 2], [w - p * 2, h * 0.68, 0.02, 0, -d / 2 + p / 2], [0.02, h * 0.68, d - p * 2, w / 2 - p / 2, 0], [0.02, h * 0.68, d - p * 2, -w / 2 + p / 2, 0]];
  for (const [a, b, c, x, z] of vid) { const m = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), vidrio); m.position.set(x, h * 0.6, z); g.add(m); }
  const base = cajaB(w, h * 0.3, d, 0.03, matPintura); base.position.y = h * 0.15; g.add(base);
  const asiento = cajaB(w * 0.35, 0.5, d * 0.35, 0.05, negro); asiento.position.set(0, h * 0.35, 0); g.add(asiento);
  return g;
}

/** Montón de roca suelta (carga de tolva o cucharón): semiesfera aplastada con bloques en superficie. */
export function monton({ ancho = 4, largo = 6, alto = 1.5, semilla = 3, color = "#8e8b84", bloques = 120 } = {}) {
  const g = new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2);
  const n = ruido3(semilla);
  const P = g.attributes.position.array;
  for (let i = 0; i < P.length; i += 3) {
    const x = P[i], y = P[i + 1], z = P[i + 2];
    const k = 1 + 0.18 * n(x * 2.5, y * 2.5, z * 2.5) + 0.08 * n(x * 7, y * 7, z * 7);
    P[i] = x * (largo / 2) * k; P[i + 1] = Math.pow(y, 0.85) * alto * k; P[i + 2] = z * (ancho / 2) * k;
  }
  g.computeVertexNormals();
  const c = new THREE.Color(color);
  const mat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.96, flatShading: true });
  const m = new THREE.Mesh(g, mat);
  m.castShadow = m.receiveShadow = true;
  const grupo = new THREE.Group(); grupo.add(m);
  const r = azar(semilla);
  const piedra = new THREE.IcosahedronGeometry(1, 0);
  const im = new THREE.InstancedMesh(piedra, new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }), bloques);
  const d = new THREE.Object3D();
  for (let k = 0; k < bloques; k++) {
    const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * 0.95;
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr, y = Math.sqrt(Math.max(0, 1 - rr * rr));
    d.position.set(x * largo / 2, Math.pow(y, 0.85) * alto * 0.95, z * ancho / 2);
    d.rotation.set(r() * 6, r() * 6, r() * 6);
    d.scale.set(r.entre(0.12, 0.42), r.entre(0.1, 0.3), r.entre(0.12, 0.38)).multiplyScalar(Math.min(1, alto / 1.2));
    d.updateMatrix(); im.setMatrixAt(k, d.matrix);
    const v = 0.75 + r() * 0.4; im.setColorAt(k, c.clone().multiplyScalar(v));
  }
  im.castShadow = true;
  grupo.add(im);
  return grupo;
}

const PINTURAS = {
  cat: "#d9a521", atlas: "#e0b11c", sandvik: "#c8452f", komatsu: "#e2b51f", blanco: "#d8d6cf", gris: "#9b9a95", naranja: "#d8792a",
};

// ───────── máquinas ─────────

/**
 * Scoop / LHD de bajo perfil. Coordenadas absolutas medidas en el plano del CAT Performance Handbook
 * (Osorio Bazán 2021, fig. 2.3), escala por las cotas A, B, C del R1600H (≈ 8,3 mm/px). Origen: articulación central.
 * Estado: { levante (0..1), volteo (-1 descarga .. 1 recogido), giro (rad de articulación), carga (bool), rodar (m) }.
 */
export function scoop(op = {}) {
  const { color = PINTURAS.cat, rueda = 1.75, ejes = 3.25, ancho = 2.7, capota = 2.31, anchoCucharon = 2.85, capacidad = 4.6, luces = false, semilla = 1 } = op;
  const pint = materialPintura(color, { alturaBarro: 1.1, suciedad: 0.55 });
  const acero = materialPintura("#6a655d", { rugosidad: 0.6, metal: 0.45, suciedad: 0.55, desgaste: 0.4, alturaBarro: 1.5 });
  const cuchara = materialPintura(color, { rugosidad: 0.6, metal: 0.25, suciedad: 0.7, desgaste: 0.75, alturaBarro: 1.6, barro: "#6b6153" });
  const negro = MATERIALES.negro();
  const grupo = new THREE.Group();
  const R = rueda / 2;
  const xF = 1.45, xR = xF - ejes, xCola = -4.95; // eje delantero, eje trasero y parachoques (medidos)
  // ── bastidor trasero: chasis, motor, cabina lateral baja, parachoques
  const trasero = new THREE.Group(); grupo.add(trasero);
  const chasisT = cajaB(-xCola - 0.15, 0.95, ancho * 0.78, 0.08, pint); chasisT.position.set((xCola - 0.15) / 2, R + 0.12, 0); trasero.add(chasisT);
  const motor = cajaB(2.55, 0.62, ancho * 0.8, 0.12, pint); motor.position.set(xCola + 1.45, R + 0.9, -0.06); trasero.add(motor);
  const tapaM = cajaB(1.6, 0.12, ancho * 0.62, 0.05, pint); tapaM.position.set(xCola + 1.6, R + 1.27, -0.1); trasero.add(tapaM);
  const rejilla = cajaB(0.05, 0.75, ancho * 0.62, 0.02, negro); rejilla.position.set(xCola + 0.02, R + 0.55, 0); trasero.add(rejilla);
  const paragolpe = cajaB(0.4, 0.42, ancho * 0.92, 0.08, acero); paragolpe.position.set(xCola + 0.15, 0.62, 0); trasero.add(paragolpe);
  const escape = tubo([xCola + 2.4, R + 1.0, -ancho * 0.3], [xCola + 2.4, capota + 0.12, -ancho * 0.3], 0.07, negro); trasero.add(escape);
  for (const sgn of [1, -1]) {
    const gf = cajaB(rueda * 1.02, 0.07, 0.72, 0.03, pint); gf.position.set(xR, rueda + 0.06, sgn * (ancho / 2 - 0.36)); trasero.add(gf);
    const gfF = cajaB(0.07, 0.5, 0.72, 0.02, pint); gfF.position.set(xR + rueda * 0.5, rueda - 0.17, sgn * (ancho / 2 - 0.36)); gfF.rotation.z = -0.5; trasero.add(gfF);
  }
  // cabina: compartimiento cerrado, bajo y de costado (el operador va sentado transversal)
  const cab = new THREE.Group(); cab.position.set(-0.95, R + 0.62, ancho / 2 - 0.5); trasero.add(cab);
  const hCab = capota - (R + 0.62);
  const cuerpo = cajaB(1.75, hCab * 0.45, 0.95, 0.05, pint); cuerpo.position.y = hCab * 0.225; cab.add(cuerpo);
  const vid = new THREE.Mesh(new THREE.BoxGeometry(1.62, hCab * 0.5, 0.86), new THREE.MeshStandardMaterial({ color: "#26323a", roughness: 0.08, metalness: 0.65 }));
  vid.position.y = hCab * 0.69; cab.add(vid);
  for (const [x, z] of [[0.84, 0.45], [-0.84, 0.45], [0.84, -0.45], [-0.84, -0.45]]) { const p0 = cajaB(0.08, hCab * 0.55, 0.08, 0.02, pint); p0.position.set(x, hCab * 0.7, z); cab.add(p0); }
  const techo = cajaB(1.95, 0.12, 1.1, 0.04, pint); techo.position.y = hCab + 0.02; cab.add(techo);
  // ── bastidor delantero: caja del eje, torres del brazo
  const delantero = new THREE.Group(); grupo.add(delantero);
  const chasisD = cajaB(2.3, 0.8, ancho * 0.7, 0.08, pint); chasisD.position.set(1.15, R + 0.05, 0); delantero.add(chasisD);
  for (const sgn of [1, -1]) {
    const torre = placa([[0.0, 0], [1.25, 0], [0.75, 1.15], [0.2, 1.15]], 0.16, pint, 0.02); torre.position.set(-0.05, R + 0.35, sgn * ancho * 0.33); delantero.add(torre);
    const gf = cajaB(rueda * 0.9, 0.07, 0.72, 0.03, pint); gf.position.set(xF, rueda + 0.06, sgn * (ancho / 2 - 0.36)); delantero.add(gf);
  }
  // ── articulación central y cilindros de dirección
  const art = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.95, 16), acero); art.position.set(0, R + 0.25, 0); grupo.add(art);
  const cilDir = [cilindro(0.11, 0.06), cilindro(0.11, 0.06)]; cilDir.forEach((c) => grupo.add(c.grupo));
  // ── ruedas
  const ruedas = [];
  for (const [g, x] of [[delantero, xF], [trasero, xR]]) for (const sgn of [1, -1]) {
    const w = llanta({ diam: rueda, ancho: 0.64, tacos: 26, surco: 0.045 });
    w.position.set(x, R, sgn * (ancho / 2 - 0.32)); g.add(w); ruedas.push(w);
  }
  // ── brazos de levante: pivote alto sobre las torres (medido: x ≈ +0,4 m, y ≈ 1,89 m), largo 3,0 m
  const pivote = new THREE.Vector3(0.45, 1.89, 0);
  const Lb = 3.0;
  const brazo = new THREE.Group(); brazo.position.copy(pivote); delantero.add(brazo);
  for (const sgn of [1, -1]) {
    const pb = placa([[-0.25, -0.26], [Lb * 0.5, -0.44], [Lb, -0.2], [Lb + 0.1, 0.08], [Lb * 0.55, 0.24], [-0.25, 0.3]], 0.16, pint, 0.025);
    pb.position.z = sgn * (ancho * 0.33); brazo.add(pb);
  }
  const travesano = cajaB(0.32, 0.3, ancho * 0.66, 0.05, pint); travesano.position.set(Lb * 0.52, -0.1, 0); brazo.add(travesano);
  // ── cucharón (pasador en la punta del brazo)
  const cucharon = new THREE.Group(); cucharon.position.set(Lb, -0.02, 0); brazo.add(cucharon);
  const prof = 1.6;
  const lado = [[-0.1, 0.25], [-0.15, -0.62], [0.35, -0.98], [prof, -1.0], [prof + 0.12, -0.92], [0.55, 0.42], [0.05, 0.45]];
  for (const sgn of [1, -1]) { const pl = placa(lado, 0.06, cuchara, 0.01); pl.position.z = sgn * (anchoCucharon / 2 - 0.03); cucharon.add(pl); }
  const curva = new THREE.SplineCurve([new THREE.Vector2(-0.12, 0.4), new THREE.Vector2(-0.17, -0.45), new THREE.Vector2(0.15, -0.88), new THREE.Vector2(0.6, -0.99), new THREE.Vector2(prof + 0.05, -0.99)]);
  const fondoG = new THREE.PlaneGeometry(1, 1, 24, 1);
  { const P = fondoG.attributes.position.array; for (let i = 0; i < P.length; i += 3) { const u = P[i] + 0.5, v = P[i + 1] + 0.5; const q = curva.getPoint(u); P[i] = q.x; P[i + 1] = q.y; P[i + 2] = (v - 0.5) * (anchoCucharon - 0.08); } fondoG.computeVertexNormals(); }
  const matFondo = materialPintura(color, { rugosidad: 0.6, metal: 0.25, suciedad: 0.75, desgaste: 0.8, alturaBarro: 1.6, barro: "#6b6153" });
  matFondo.side = THREE.DoubleSide;
  const fondo = new THREE.Mesh(fondoG, matFondo); fondo.castShadow = true; cucharon.add(fondo);
  const labio = cajaB(0.5, 0.07, anchoCucharon, 0.015, acero); labio.position.set(prof - 0.05, -0.98, 0); cucharon.add(labio);
  const nD = 7;
  for (let k = 0; k < nD; k++) { const d = cajaB(0.24, 0.09, 0.2, 0.02, acero); d.position.set(prof + 0.25, -0.97, -anchoCucharon / 2 + 0.28 + (k * (anchoCucharon - 0.56)) / (nD - 1)); cucharon.add(d); }
  const refuerzo = cajaB(0.14, 0.16, anchoCucharon - 0.1, 0.03, cuchara); refuerzo.position.set(0.55, 0.38, 0); cucharon.add(refuerzo);
  const carga = monton({ ancho: anchoCucharon * 0.86, largo: prof * 1.0, alto: 0.5, color: "#7d786f", bloques: 70, semilla });
  carga.position.set(prof * 0.48, -0.5, 0); carga.visible = false; cucharon.add(carga);
  // ── cilindros: dos de levante (bastidor → brazo) y uno de volteo (torre → palanca del cucharón)
  const cilLev = [cilindro(0.2, 0.11), cilindro(0.2, 0.11)]; cilLev.forEach((c) => delantero.add(c.grupo));
  const cilVol = cilindro(0.22, 0.12); delantero.add(cilVol.grupo);
  const palanca = cajaB(0.16, 0.95, 0.22, 0.03, acero); brazo.add(palanca);
  // ── faros (adelante en las torres, atrás en el capó)
  const faros = [];
  for (const [g, x, z, y, rot] of [[delantero, 0.75, ancho * 0.36, 2.0, 0], [delantero, 0.75, -ancho * 0.36, 2.0, 0], [trasero, xCola + 0.05, ancho * 0.32, R + 1.05, Math.PI], [trasero, xCola + 0.05, -ancho * 0.32, R + 1.05, Math.PI]]) {
    const f = faro({ luz: luces && rot === 0, alcance: 45, intensidad: 90, sombra: luces && z > 0 });
    f.position.set(x, y, z); f.rotation.y = Math.PI / 2 + rot; g.add(f); faros.push(f);
  }
  const estado = { levante: 0.08, volteo: 0.6, giro: 0, carga: false, rodar: 0 };
  const eZ = new THREE.Vector3(0, 0, 1);
  function poner(e = {}) {
    Object.assign(estado, e);
    const aB = THREE.MathUtils.degToRad(-27 + estado.levante * 50); // de -27° (acarreo) a +23° (descarga)
    brazo.rotation.z = aB;
    cucharon.rotation.z = -aB + estado.volteo * 0.8 - 0.1;
    delantero.rotation.y = estado.giro;
    const pB = new THREE.Vector3(Lb * 0.42, -0.3, 0).applyAxisAngle(eZ, aB).add(pivote);
    cilLev[0].apuntar([1.95, R + 0.2, ancho * 0.33], [pB.x, pB.y, ancho * 0.33]);
    cilLev[1].apuntar([1.95, R + 0.2, -ancho * 0.33], [pB.x, pB.y, -ancho * 0.33]);
    // palanca del volteo en el travesaño, se inclina con el cucharón
    const pv = new THREE.Vector3(Lb * 0.55, 0.2, 0);
    palanca.position.copy(pv); palanca.rotation.z = -estado.volteo * 0.5 - aB * 0.3;
    const pTop = new THREE.Vector3(0, 0.45, 0).applyAxisAngle(eZ, palanca.rotation.z).add(pv).applyAxisAngle(eZ, aB).add(pivote);
    cilVol.apuntar([0.15, 1.75, 0], [pTop.x, pTop.y, 0]);
    carga.visible = !!estado.carga;
    for (const w of ruedas) w.rotation.z = -estado.rodar / R;
    const sGiro = Math.sin(estado.giro) * 0.55;
    cilDir[0].apuntar([-0.65, R + 0.25, 0.55], [0.6, R + 0.25, 0.55 + sGiro]);
    cilDir[1].apuntar([-0.65, R + 0.25, -0.55], [0.6, R + 0.25, -0.55 + sGiro]);
  }
  poner();
  return {
    grupo, poner, estado,
    partes: { cucharon, brazo, delantero, trasero, articulacion: art, cabina: cab, motor, ruedas, faros, cilindrosLevante: cilLev.map((c) => c.grupo), cilindroVolteo: cilVol.grupo, carga },
    dims: { rueda, ejes, ancho, capota, anchoCucharon, capacidad, largoTotal: xF + Lb + prof - xCola, voladizo: xR - xCola },
  };
}

/**
 * Camión de acarreo rígido (clase 230 t, CAT 793). Estado: { volteo (0..1), carga (bool), rodar (m) }.
 * Dimensiones: catálogo del fabricante (estimado, verificar); ancho operativo de vía según Pelaez Vera (2013).
 */
export function camionAcarreo(op = {}) {
  const { largo = 12.9, ancho = 7.6, rueda = 3.55, ejes = 5.9, colorChasis = PINTURAS.cat, colorTolva = PINTURAS.cat, cargado = false, semilla = 2 } = op;
  const pint = materialPintura(colorChasis, { alturaBarro: 1.8, suciedad: 0.5 });
  const pintT = materialPintura(colorTolva, { alturaBarro: 2.6, suciedad: 0.45, desgaste: 0.1 });
  const negro = MATERIALES.negro();
  const grupo = new THREE.Group();
  const R = rueda / 2;
  const xF = ejes * 0.55, xR = -ejes * 0.45;
  // chasis: largueros y cubierta delantera
  for (const s of [1, -1]) { const l = cajaB(largo * 0.8, 0.7, 0.45, 0.06, pint); l.position.set(0.2, R + 0.4, s * 0.85); grupo.add(l); }
  const cubierta = cajaB(2.4, 0.18, ancho * 0.98, 0.04, pint); cubierta.position.set(xF + 0.9, R + 2.25, 0); grupo.add(cubierta);
  const motor = cajaB(2.8, 1.9, 2.2, 0.1, pint); motor.position.set(xF + 0.6, R + 1.2, 0); grupo.add(motor);
  const radiador = cajaB(0.12, 2.1, 2.4, 0.02, negro); radiador.position.set(xF + 2.05, R + 1.25, 0); grupo.add(radiador);
  const paragolpe = cajaB(0.6, 0.6, 4.2, 0.08, pint); paragolpe.position.set(xF + 2.2, R + 0.0, 0); grupo.add(paragolpe);
  // escalera diagonal frontal (rasgo de la foto 797B, Tinaja Hills)
  const esc1 = tubo([xF + 2.15, R + 0.3, -1.2], [xF + 2.15, R + 2.3, 1.2], 0.09, pint); grupo.add(esc1);
  const cab = cabina(2.0, 1.9, 1.7, pint); cab.position.set(xF + 0.9, R + 2.34, ancho * 0.28); grupo.add(cab);
  grupo.add(baranda([[xF + 2.05, R + 2.34, -ancho / 2 + 0.1], [xF + 2.05, R + 2.34, ancho / 2 - 0.1], [xF - 0.3, R + 2.34, ancho / 2 - 0.1]], 1.0, pint));
  // ruedas: delanteras simples, traseras duales
  const ruedas = [];
  for (const s of [1, -1]) {
    const f = llanta({ diam: rueda, ancho: 1.0, tacos: 22, surco: 0.09, aro: 0.52 }); f.position.set(xF, R, s * (ancho / 2 - 0.55)); grupo.add(f); ruedas.push(f);
    for (const d of [0, 1]) { const t = llanta({ diam: rueda, ancho: 1.0, tacos: 22, surco: 0.09, aro: 0.52 }); t.position.set(xR, R, s * (ancho / 2 - 0.55 - d * 1.08)); grupo.add(t); ruedas.push(t); }
  }
  // tolva: fondo inclinado, laterales con nervios, visera sobre la cabina; gira en una bisagra trasera
  const bisagra = new THREE.Group(); bisagra.position.set(xR - 1.6, R + 1.25, 0); grupo.add(bisagra);
  const tolva = new THREE.Group(); bisagra.add(tolva);
  const Lt = largo * 0.75, At = ancho * 0.96;
  const piso = cajaB(Lt, 0.25, At * 0.86, 0.05, pintT); piso.position.set(Lt / 2, 0.55, 0); piso.rotation.z = 0.12; tolva.add(piso);
  for (const s of [1, -1]) {
    const lat = placa([[0, 0.4], [Lt, 1.5], [Lt + 0.3, 3.3], [0.4, 2.2]], 0.12, pintT, 0.02);
    lat.position.z = s * At / 2; lat.rotation.x = s * 0.12; tolva.add(lat);
    for (let k = 1; k < 6; k++) { const n = cajaB(0.16, 1.7, 0.2, 0.03, pintT); n.position.set((k * Lt) / 6, 1.7 + k * 0.17, s * (At / 2 + 0.1)); tolva.add(n); }
  }
  const frente = cajaB(0.25, 2.6, At, 0.04, pintT); frente.position.set(Lt - 0.1, 2.1, 0); frente.rotation.z = -0.15; tolva.add(frente);
  const visera = cajaB(3.0, 0.2, At, 0.04, pintT); visera.position.set(Lt + 1.3, 3.25, 0); visera.rotation.z = -0.04; tolva.add(visera);
  const carga = monton({ ancho: At * 0.82, largo: Lt * 0.85, alto: 1.9, color: "#8d8a83", bloques: 220, semilla });
  carga.position.set(Lt * 0.5, 1.2, 0); carga.visible = cargado; tolva.add(carga);
  const cilT = [cilindro(0.32, 0.18), cilindro(0.32, 0.18)]; cilT.forEach((c) => grupo.add(c.grupo));
  const faros = [];
  for (const s of [1, -1]) { const f = faro(); f.position.set(xF + 2.1, R + 2.0, s * 1.5); f.rotation.y = Math.PI / 2; grupo.add(f); faros.push(f); }
  const estado = { volteo: 0, carga: cargado, rodar: 0 };
  function poner(e = {}) {
    Object.assign(estado, e);
    bisagra.rotation.z = estado.volteo * 0.85;
    carga.visible = !!estado.carga;
    const p = new THREE.Vector3(Lt * 0.38, 0.4, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), bisagra.rotation.z).add(bisagra.position);
    cilT[0].apuntar([xF - 0.8, R + 0.5, 1.1], [p.x, p.y, 1.1]);
    cilT[1].apuntar([xF - 0.8, R + 0.5, -1.1], [p.x, p.y, -1.1]);
    for (const w of ruedas) w.rotation.z = -estado.rodar / R;
  }
  poner();
  return { grupo, poner, estado, partes: { tolva, carga, cabina: cab, motor, ruedas, faros }, dims: { largo, ancho, rueda, ejes } };
}

/**
 * Pala eléctrica de cables (clase P&H 4100: 44–56 m³). Estado: { giro (rad), empuje (0..1, extensión del mango), izaje (0..1), compuerta (0..1) }.
 * Dimensiones aproximadas (estimado, verificar con catálogo).
 */
export function palaElectrica(op = {}) {
  const { color = "#c9c6bd", colorDetalle = "#b8352b", pluma = 20, cucharonAncho = 4.6, semilla = 4 } = op;
  const pint = materialPintura(color, { alturaBarro: 2.2, suciedad: 0.5 });
  const rojo = materialPintura(colorDetalle, { alturaBarro: 2.2, suciedad: 0.4 });
  const acero = materialPintura("#4c4842", { rugosidad: 0.6, metal: 0.55, suciedad: 0.6, desgaste: 0.5, alturaBarro: 3 });
  const negro = MATERIALES.negro();
  const grupo = new THREE.Group();
  // orugas
  for (const s of [1, -1]) {
    const o = cajaB(10.5, 2.3, 2.1, 0.5, acero); o.position.set(0, 1.2, s * 4.2); grupo.add(o);
    for (let k = 0; k < 22; k++) { const z = cajaB(0.35, 0.18, 2.15, 0.03, negro); z.position.set(-5 + k * 0.48, 0.08, s * 4.2); grupo.add(z); }
  }
  const carbody = cajaB(6, 1.4, 6.5, 0.2, pint); carbody.position.set(0, 2.5, 0); grupo.add(carbody);
  // superestructura giratoria
  const giro = new THREE.Group(); giro.position.y = 3.3; grupo.add(giro);
  const casa = cajaB(13, 6.5, 9, 0.25, pint); casa.position.set(-2.5, 3.5, 0); giro.add(casa);
  const franja = cajaB(13.05, 0.6, 9.05, 0.05, rojo); franja.position.set(-2.5, 1.2, 0); giro.add(franja);
  const contrapeso = cajaB(2.2, 4, 8.6, 0.2, pint); contrapeso.position.set(-9.6, 2.6, 0); giro.add(contrapeso);
  const cab = cabina(2.6, 2.4, 2.4, pint); cab.position.set(4.0, 5.5, 3.6); giro.add(cab);
  grupo.userData.baranda = giro.add(baranda([[-9, 6.75, -4.4], [4, 6.75, -4.4], [4, 6.75, 4.4], [-9, 6.75, 4.4]], 1.0, rojo));
  // pórtico (A-frame) y cables de suspensión de la pluma
  const tope = [-4.5, 15, 0];
  for (const s of [1, -1]) { giro.add(tubo([-1, 6.8, s * 3], tope, 0.3, pint)); giro.add(tubo([-8, 6.8, s * 3], tope, 0.3, pint)); }
  // pluma
  const raiz = new THREE.Vector3(3.5, 3.8, 0);
  const ang = THREE.MathUtils.degToRad(45);
  const punta = raiz.clone().add(new THREE.Vector3(Math.cos(ang) * pluma, Math.sin(ang) * pluma, 0));
  const plumaM = tubo([raiz.x, raiz.y, 0], [punta.x, punta.y, 0], 0.9, pint, 8); plumaM.scale.set(1, 1, 1.4); giro.add(plumaM);
  for (const s of [1, -1]) giro.add(tubo(tope, [punta.x - 0.5, punta.y + 0.3, s * 0.9], 0.07, negro, 6));
  const polea = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 1.4, 24).rotateX(Math.PI / 2), rojo); polea.position.copy(punta); polea.castShadow = true; giro.add(polea);
  // mango (empuje) y cucharón
  const ejeMango = raiz.clone().lerp(punta, 0.47).add(new THREE.Vector3(0.5, -0.8, 0));
  const mango = new THREE.Group(); mango.position.copy(ejeMango); giro.add(mango);
  const mangoM = cajaB(14, 0.9, 1.0, 0.1, pint); mango.add(mangoM);
  const cuchara = new THREE.Group(); mango.add(cuchara);
  const caja = cajaB(3.6, 4.0, cucharonAncho, 0.2, acero); cuchara.add(caja);
  for (let k = 0; k < 5; k++) { const d = cajaB(0.6, 0.3, 0.35, 0.05, acero); d.position.set(2.0, 1.6, -cucharonAncho / 2 + 0.5 + k * ((cucharonAncho - 1) / 4)); cuchara.add(d); }
  const compuerta = cajaB(0.25, 3.6, cucharonAncho * 0.95, 0.05, acero); compuerta.position.set(-1.9, -0.2, 0); cuchara.add(compuerta);
  const carga = monton({ ancho: cucharonAncho * 0.8, largo: 3.0, alto: 1.2, color: "#8d8a83", bloques: 70, semilla }); carga.rotation.z = Math.PI / 2; carga.position.set(0, 0, 0); carga.visible = false; cuchara.add(carga);
  const cableIz = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 6), negro); giro.add(cableIz);
  const estado = { giro: 0, empuje: 0.5, izaje: 0.4, compuerta: 0, carga: false };
  const up = new THREE.Vector3(0, 1, 0);
  function poner(e = {}) {
    Object.assign(estado, e);
    giro.rotation.y = estado.giro;
    // el mango gira alrededor del eje del shipper según el izaje; el empuje lo desliza
    const aM = THREE.MathUtils.lerp(-0.85, 0.55, estado.izaje);
    mango.rotation.z = aM;
    const ext = THREE.MathUtils.lerp(-1.5, 4.5, estado.empuje);
    mangoM.position.x = ext - 1.5;
    cuchara.position.set(ext + 6.2, -1.2, 0);
    cuchara.rotation.z = -aM * 0.35;
    compuerta.rotation.z = estado.compuerta * 0.9; compuerta.position.y = -0.2 - estado.compuerta * 0.6;
    carga.visible = !!estado.carga;
    const pc = cuchara.getWorldPosition(new THREE.Vector3());
    giro.worldToLocal(pc);
    const pp = punta.clone();
    cableIz.position.copy(pp).add(pc).multiplyScalar(0.5);
    cableIz.scale.y = pp.distanceTo(pc);
    cableIz.quaternion.setFromUnitVectors(up, pc.clone().sub(pp).normalize());
  }
  poner();
  return { grupo, poner, estado, partes: { giro, casa, pluma: plumaM, mango, cucharon: cuchara, orugas: carbody, cabina: cab, carga }, dims: { pluma, cucharonAncho } };
}

/**
 * Jumbo de perforación frontal (clase Boomer de 2 brazos, barra de 14 pies). Proporciones estimadas sobre fotos abiertas
 * (references/reglas-equipos.md). x = adelante. Cada brazo se apunta a un taladro con apuntar(i, collar, dir, avance):
 * collar = punto de emboquille en coordenadas locales del jumbo; dir = dirección del taladro; avance = m perforados.
 */
export function jumbo(op = {}) {
  const { color = PINTURAS.atlas, brazos = 2, largoViga = 5.2, barra = 4.27, ancho = 2.3, rueda = 1.25, semilla = 5 } = op;
  const pint = materialPintura(color, { alturaBarro: 0.9, suciedad: 0.6 });
  const gris = materialPintura("#6d6a64", { rugosidad: 0.55, metal: 0.5, suciedad: 0.55, alturaBarro: 1.0 });
  const rojo = materialPintura("#b23a2b", { rugosidad: 0.5, metal: 0.3, suciedad: 0.5, alturaBarro: 0.8 });
  const negro = MATERIALES.negro();
  const grupo = new THREE.Group();
  const R = rueda / 2;
  // carrier: bastidor trasero (motor y bombas), delantero (cabina), carrete de cable atrás
  const tras = cajaB(3.6, 1.15, ancho * 0.92, 0.1, pint); tras.position.set(-3.0, R + 0.45, 0); grupo.add(tras);
  const capot = cajaB(2.4, 0.5, ancho * 0.8, 0.08, pint); capot.position.set(-3.1, R + 1.25, 0); grupo.add(capot);
  const del = cajaB(3.0, 0.85, ancho * 0.88, 0.1, pint); del.position.set(0.6, R + 0.32, 0); grupo.add(del);
  const carrete = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.0, 28).rotateX(Math.PI / 2), gris); carrete.position.set(-4.75, R + 1.0, 0); carrete.castShadow = true; grupo.add(carrete);
  const cable = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.07, 6, 40), negro); cable.position.copy(carrete.position); grupo.add(cable);
  // cabina/canopy abierta con techo protector
  const cab = new THREE.Group(); cab.position.set(-0.6, R + 0.75, 0); grupo.add(cab);
  for (const [x, z] of [[0.75, 0.95], [-0.75, 0.95], [0.75, -0.95], [-0.75, -0.95]]) { const p0 = cajaB(0.09, 1.55, 0.09, 0.02, pint); p0.position.set(x, 0.78, z); cab.add(p0); }
  const techo = cajaB(1.8, 0.12, 2.15, 0.04, pint); techo.position.y = 1.6; cab.add(techo);
  const tablero = cajaB(0.4, 0.9, 1.3, 0.05, negro); tablero.position.set(0.55, 0.45, 0); cab.add(tablero);
  const asiento = cajaB(0.55, 0.5, 0.55, 0.06, negro); asiento.position.set(-0.2, 0.3, 0); cab.add(asiento);
  // ruedas
  const ruedas = [];
  for (const x of [1.25, -2.8]) for (const s of [1, -1]) { const w = llanta({ diam: rueda, ancho: 0.48, tacos: 22, surco: 0.035 }); w.position.set(x, R, s * (ancho / 2 - 0.24)); grupo.add(w); ruedas.push(w); }
  // gatas estabilizadoras
  const gatas = [];
  for (const [x, s] of [[2.0, 1], [2.0, -1], [-4.3, 1], [-4.3, -1]]) { const g = cajaB(0.28, 0.85, 0.28, 0.04, gris); g.position.set(x, R - 0.08, s * 0.95); grupo.add(g); gatas.push(g); }
  // brazos
  const bases = [], unidades = [];
  for (let b = 0; b < brazos; b++) {
    const z = brazos === 1 ? 0 : b === 0 ? 0.52 : -0.52;
    const B = new THREE.Vector3(2.15, R + 0.95, z);
    const soporte = cajaB(0.5, 0.55, 0.42, 0.06, pint); soporte.position.copy(B); grupo.add(soporte);
    const brazo = cajaB(1, 0.3, 0.3, 0.05, pint); grupo.add(brazo);
    const cil = cilindro(0.13, 0.07); grupo.add(cil.grupo);
    const nudo = cajaB(0.42, 0.42, 0.42, 0.06, pint); grupo.add(nudo);
    const viga = new THREE.Group(); grupo.add(viga);
    const vigaM = cajaB(largoViga, 0.18, 0.24, 0.03, gris); vigaM.position.x = -largoViga / 2; viga.add(vigaM);
    const centr = cajaB(0.22, 0.32, 0.3, 0.04, gris); centr.position.x = -0.1; viga.add(centr);
    const perf = new THREE.Group(); viga.add(perf);
    const perfM = cajaB(0.85, 0.3, 0.3, 0.05, rojo); perfM.position.x = -0.42; perf.add(perfM);
    const barraM = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 1, 6).rotateZ(Math.PI / 2), MATERIALES.cromo()); viga.add(barraM);
    const broca = new THREE.Mesh(new THREE.CylinderGeometry(0.0255, 0.0255, 0.08, 10).rotateZ(Math.PI / 2), MATERIALES.aceroGastado()); viga.add(broca);
    const manguera = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.03, 6, 20, Math.PI), negro); manguera.rotation.x = Math.PI / 2; perf.add(manguera); manguera.position.set(-0.6, 0.3, 0);
    bases.push(B);
    unidades.push({ brazo, cil, nudo, viga, perf, barraM, broca, B });
  }
  const up = new THREE.Vector3(1, 0, 0);
  const estado = { brazos: unidades.map(() => ({ collar: null, dir: new THREE.Vector3(1, 0, 0), avance: 0 })) };
  function apuntar(i, collar, dir = new THREE.Vector3(1, 0, 0), avance = 0) {
    const u = unidades[i]; const d = dir.clone().normalize();
    const F = collar.clone().addScaledVector(d, -0.04); // frente de la viga apoyada en la roca
    const H = F.clone().addScaledVector(d, -largoViga * 0.58); // soporte de la viga
    // brazo B → H
    const L = u.B.distanceTo(H);
    u.brazo.scale.x = L; u.brazo.position.copy(u.B).add(H).multiplyScalar(0.5);
    u.brazo.quaternion.setFromUnitVectors(up, H.clone().sub(u.B).normalize());
    u.nudo.position.copy(H);
    u.cil.apuntar([u.B.x - 0.6, u.B.y - 0.35, u.B.z], [u.B.x + (H.x - u.B.x) * 0.55, u.B.y + (H.y - u.B.y) * 0.55 - 0.15, u.B.z + (H.z - u.B.z) * 0.55]);
    // viga a lo largo de d con el frente en F
    u.viga.position.copy(F);
    u.viga.quaternion.setFromUnitVectors(up, d);
    const a = clampN(avance, 0, barra - 0.3);
    u.perf.position.x = -(barra + 0.05) + a; // la perforadora avanza por la viga
    const largoBarra = barra; // barra completa desde la perforadora hasta la broca
    u.barraM.scale.x = largoBarra; u.barraM.position.x = u.perf.position.x + largoBarra / 2;
    u.broca.position.x = u.perf.position.x + largoBarra + 0.03;
    Object.assign(estado.brazos[i], { collar, dir: d, avance });
  }
  function clampN(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function poner(e = {}) { (e.brazos || []).forEach((x, i) => x.collar && apuntar(i, x.collar, x.dir, x.avance)); }
  // pose de reposo: brazos recogidos al frente
  unidades.forEach((u, i) => apuntar(i, new THREE.Vector3(7.2, 1.9, u.B.z * 1.2), new THREE.Vector3(1, 0, 0), 0));
  return {
    grupo, poner, apuntar, estado,
    partes: { vigas: unidades.map((u) => u.viga), brazos: unidades.map((u) => u.brazo), perforadoras: unidades.map((u) => u.perf), barras: unidades.map((u) => u.barraM), brocas: unidades.map((u) => u.broca), cabina: cab, carrete, ruedas, gatas, chasis: [tras, del, capot] },
    dims: { largoViga, barra, ancho, rueda },
  };
}

/** Perforadora rotativa de tajo (clase Pit Viper / 49HR): orugas, casa, mástil. Estado: { mastil (rad), rotar (rad), bajar (0..1) }. */
export function perforadoraTajo(op = {}) {
  const { color = PINTURAS.atlas, mastil = 19, diametro = 0.27 } = op;
  const pint = materialPintura(color, { alturaBarro: 1.6, suciedad: 0.6 });
  const acero = materialPintura("#4a4640", { rugosidad: 0.6, metal: 0.5, suciedad: 0.6, alturaBarro: 2 });
  const grupo = new THREE.Group();
  for (const s of [1, -1]) { const o = cajaB(9, 1.6, 1.3, 0.4, acero); o.position.set(0, 0.85, s * 2.4); grupo.add(o); }
  const casa = cajaB(9.5, 3, 4.8, 0.15, pint); casa.position.set(-0.8, 3.1, 0); grupo.add(casa);
  const cab = cabina(2, 2.2, 2.2, pint); cab.position.set(3.2, 4.6, 1.2); grupo.add(cab);
  const pie = new THREE.Group(); pie.position.set(3.5, 4.4, -0.8); grupo.add(pie);
  const torre = cajaB(0.9, mastil, 1.1, 0.06, pint); torre.position.y = mastil / 2; pie.add(torre);
  const cabezal = cajaB(1.2, 1.4, 1.3, 0.1, acero); pie.add(cabezal);
  const barra = new THREE.Mesh(new THREE.CylinderGeometry(diametro / 2, diametro / 2, mastil * 0.9, 12), acero); pie.add(barra);
  const estado = { mastil: 0, bajar: 0, rotar: 0 };
  function poner(e = {}) {
    Object.assign(estado, e);
    pie.rotation.z = estado.mastil;
    cabezal.position.y = mastil * (0.95 - estado.bajar * 0.85);
    barra.position.y = cabezal.position.y - mastil * 0.45;
    barra.rotation.y = estado.rotar;
  }
  poner();
  return { grupo, poner, estado, partes: { mastil: torre, cabezal, barra, casa, cabina: cab }, dims: { mastil, diametro } };
}

/** Cargador frontal grande (clase CAT 994): como el scoop pero alto, con cabina adelante y elevada. */
export function cargadorFrontal(op = {}) {
  const s = scoop({ rueda: 3.6, ejes: 6.7, ancho: 6.2, capota: 6.6, voladizo: 4.8, anchoCucharon: 6.7, capacidad: 18, ...op });
  s.grupo.scale.setScalar(1);
  s.partes.cabina.position.set(-0.6, 3.6, 0);
  return s;
}

/** Empernador: carrier de jumbo con un brazo y cabezal de empernado con carrusel de pernos. */
export function empernador(op = {}) {
  const j = jumbo({ brazos: 1, largoViga: 3.6, barra: 2.4, ...op });
  const carrusel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.6, 10).rotateZ(Math.PI / 2), MATERIALES.aceroGastado());
  carrusel.position.set(-1.6, 0.35, 0.3);
  j.partes.vigas[0].add(carrusel);
  j.partes.carrusel = carrusel;
  return j;
}

/** Lanzador de shotcrete: carrier con trompo de concreto y brazo con boquilla. Estado: { lanzar (bool) }. */
export function lanzadorShotcrete(op = {}) {
  const j = jumbo({ brazos: 1, largoViga: 2.4, barra: 0.01, ...op });
  const trompo = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.6, 2.4, 20).rotateZ(Math.PI / 2 - 0.15), materialPintura("#c9c4b8", { suciedad: 0.7 }));
  trompo.position.set(-2.6, 2.1, 0); trompo.castShadow = true;
  j.grupo.add(trompo);
  j.partes.trompo = trompo;
  return j;
}

/** Perforadora de taladros largos (clase Simba): brazo con viga que gira en abanico. */
export function perforadoraTaladrosLargos(op = {}) {
  const j = jumbo({ brazos: 1, largoViga: 4.2, barra: 1.83, ...op });
  j.apuntar(0, new THREE.Vector3(4.2, 6.5, 0), new THREE.Vector3(0.1, 1, 0), 0); // viga vertical: perfora en abanico hacia arriba
  return j;
}

/** Volquete 8x4 de carretera (clase Volvo FMX 15–20 m³), usado en minería subterránea y obras. */
export function volquete(op = {}) {
  return camionAcarreo({ largo: 9.5, ancho: 2.55, rueda: 1.1, ejes: 4.6, colorChasis: "#d8d6cf", colorTolva: "#c9a227", ...op });
}

export const EQUIPOS = { scoop, camionAcarreo, palaElectrica, jumbo, perforadoraTajo, cargadorFrontal, empernador, lanzadorShotcrete, perforadoraTaladrosLargos, volquete };
