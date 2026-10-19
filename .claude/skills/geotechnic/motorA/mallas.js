// Geotechnic · motor A · dibujo en three.js de una máquina del modelo puro (motorA/modelo.js).
// Cada pieza se dibuja con EXACTAMENTE la geometría que audita el juez (prisma de su polígono, redondo de su perfil):
// lo que se ve es lo que se probó. Acabado de estudio (references/estudio.md): colores papel de PALETA, suciedad a la
// mitad, todo tapado (el corte se lee como sección llena) y la lámina de aristas en tinta encendida, al estilo de Anatomy.
// Toda malla es cerrada y orientada: piezas, llantas y mangueras (con tapa en los dos extremos).
import * as THREE from "three";
import { materialPintura } from "../kit/materiales.js";
import { tapar, tono, sinDegenerados } from "../kit/estudio.js";
import { llanta } from "../kit/equipos.js";
import { TA, VA } from "./modelo.js";

/**
 * Materiales del motor A por nombre (los que usan los modelos de equipos/), en colores papel (tokens de PALETA).
 * op: { alturaBarro, suciedad, estudio: false → usa op.color / colorAro / colorPerforadora de la ficha (v2) }
 */
export function materialesA(op = {}) {
  const libre = op.estudio === false;
  const c = (token, hex) => (libre && hex) || token;
  const barro = op.alturaBarro ?? 1.0, suc = (op.suciedad ?? 0.5) * 0.5; // estudio: suciedad y barro a la mitad
  const pint = (color, o) => materialPintura(color, { barro: "barro", alturaBarro: barro * 0.5, ...o });
  const std = (token, o) => { const mt = tapar(new THREE.MeshStandardMaterial({ color: tono(token), ...o })); mt.userData.token = token; return mt; };
  const luz = (token) => { const mt = std(token, {}); mt.emissive.set(tono(token)); mt.emissiveIntensity = 2.5; return mt; };
  const m = {
    pintura: pint(c("pintura", op.color), { suciedad: suc, rugosidad: 0.6, metal: 0.05 }),
    pinturaGastada: pint(c("pintura", op.color), { rugosidad: 0.66, metal: 0.1, suciedad: 0.3, alturaBarro: (barro + 0.5) * 0.5 }), // sin óxido: manchas = ruido
    pinturaAro: pint(c("pintura", op.colorAro || op.color), { rugosidad: 0.6, metal: 0.1, suciedad: 0.28 }),
    acero: pint("acero", { rugosidad: 0.55, metal: 0.35, suciedad: 0.22 }),
    cromo: std("aluminio", { roughness: 0.3, metalness: 0.4 }),
    goma: pint("goma", { rugosidad: 0.9, metal: 0, alturaBarro: barro * 0.45, suciedad: 0.2 }),
    negro: std("negro", { roughness: 0.75, metalness: 0.1 }),
    vidrio: std("vidrio", { roughness: 0.2, metalness: 0.3 }), // opaco: sin interior a la vista
    laton: std("laton", { roughness: 0.45, metalness: 0.5 }),
    luz: luz("luz"),
    luzRoja: luz("luzRoja"),
    aluminio: pint("aluminio", { rugosidad: 0.45, metal: 0.3, suciedad: 0.18 }),
    rojo: pint(c("pinturaB", op.colorPerforadora), { rugosidad: 0.55, suciedad: 0.22 }),
    gris: pint("gris", { rugosidad: 0.6, suciedad: 0.25 }),
    manguera: std("manguera", { roughness: 0.75, metalness: 0.05 }),
    roca: pint("gris", { rugosidad: 0.95, metal: 0, suciedad: 0.1 }),
  };
  // las aristas en tinta ganan a la cara que bordean
  for (const mt of Object.values(m)) { mt.polygonOffset = true; mt.polygonOffsetFactor = 1; mt.polygonOffsetUnits = 1; }
  for (const [k, v] of Object.entries(op.extra || {})) m[k] = v;
  return m;
}

/** Matriz three desde una pose rígida { R, t } del modelo. */
function matrizA(T, out = new THREE.Matrix4()) {
  const R = T.R, t = T.t;
  return out.set(R[0], R[1], R[2], t[0], R[3], R[4], R[5], t[1], R[6], R[7], R[8], t[2], 0, 0, 0, 1);
}

/** Geometría de una pieza en las coordenadas de reposo de su grupo. */
function geometriaPieza(p) {
  const F = p.F;
  if (p.tipo === "prisma") {
    const forma = new THREE.Shape(p.poligono.map(([x, y]) => new THREE.Vector2(x, y)));
    const L = p.s1 - p.s0, b = Math.min(p.bisel ?? 0.012, L * 0.3);
    const lado = Math.min(...p.poligono.map((q, i) => { const r = p.poligono[(i + 1) % p.poligono.length]; return Math.hypot(r[0] - q[0], r[1] - q[1]); }));
    const bb = Math.min(b, lado * 0.3);
    const g = new THREE.ExtrudeGeometry(forma, { depth: Math.max(1e-4, L - 2 * bb), bevelEnabled: bb > 1e-4, bevelThickness: bb, bevelSize: bb, bevelOffset: -bb, bevelSegments: 1, curveSegments: 1 });
    g.translate(0, 0, p.s0 + bb);
    g.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(...F.u), new THREE.Vector3(...F.v), new THREE.Vector3(...F.a)).setPosition(...F.o));
    return g;
  }
  if (p.tipo === "redondo") {
    const { s0, s1, r0, r1 } = p, ex = p.extremos || ["plano", "plano"];
    const c = Math.min(0.012, (s1 - s0) * 0.2, r0 * 0.2, r1 * 0.2);
    const pf = [];
    if (ex[0] === "domo") for (let i = 0; i <= 8; i++) { const t = (i / 8) * (Math.PI / 2); pf.push([r0 * Math.sin(t), s0 - r0 * Math.cos(t)]); }
    else pf.push([0, s0], [r0 - c, s0], [r0, s0 + c]);
    if (ex[1] === "domo") for (let i = 0; i <= 8; i++) { const t = (i / 8) * (Math.PI / 2); pf.push([r1 * Math.cos(t), s1 + r1 * Math.sin(t)]); }
    else pf.push([r1, s1 - c], [r1 - c, s1], [0, s1]);
    const seg = Math.max(12, Math.min(40, Math.round(Math.max(r0, r1) * 120)));
    const g = new THREE.LatheGeometry(pf.map(([x, y]) => new THREE.Vector2(Math.max(0, x), y)), (p.lados ?? 16) <= 8 ? p.lados : seg);
    const w = VA.cross(F.u, F.a);
    g.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(...F.u), new THREE.Vector3(...F.a), new THREE.Vector3(...w)).setPosition(...F.o));
    return sinDegenerados(g); // el perfil toca el eje en los dos extremos: cerrado, sin triángulos en el polo
  }
  return null;
}

/**
 * Tubo de manguera de topología fija, cerrado: cuerpo + tapa plana (abanico al centro) en cada extremo, con sus
 * propios vértices (normal axial). Se actualizan los vértices en cada pose (transporte paralelo).
 */
function tuboVivo(n, r, radial = 8) {
  const g = new THREE.BufferGeometry();
  const nc = (n + 1) * radial, t0i = nc, t1i = nc + radial + 1; // anillo + centro de cada tapa
  const pos = new Float32Array((nc + 2 * (radial + 1)) * 3);
  const idx = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < radial; j++) {
    const a = i * radial + j, b = i * radial + ((j + 1) % radial), c = a + radial, d = b + radial;
    idx.push(a, b, c, b, d, c); // cara delantera hacia afuera
  }
  for (let j = 0; j < radial; j++) {
    const k = (j + 1) % radial;
    idx.push(t0i + radial, t0i + k, t0i + j); // tapa del inicio: mira hacia atrás de la curva
    idx.push(t1i + radial, t1i + j, t1i + k); // tapa del final: mira hacia adelante
  }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  const anillo = (q, u, v, base) => {
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2, k = (base + j) * 3;
      pos[k] = q[0] + r * (Math.cos(a) * u[0] + Math.sin(a) * v[0]);
      pos[k + 1] = q[1] + r * (Math.cos(a) * u[1] + Math.sin(a) * v[1]);
      pos[k + 2] = q[2] + r * (Math.cos(a) * u[2] + Math.sin(a) * v[2]);
    }
  };
  const poner = (pts) => {
    let u = VA.perp(VA.unit(VA.sub(pts[1], pts[0])), [0, 1, 0]);
    for (let i = 0; i <= n; i++) {
      const t = VA.unit(VA.sub(pts[Math.min(n, i + 1)], pts[Math.max(0, i - 1)]));
      u = VA.unit(VA.sub(u, VA.mul(t, VA.dot(u, t))));
      const v = VA.cross(t, u);
      anillo(pts[i], u, v, i * radial);
      if (i === 0 || i === n) {
        const b = i === 0 ? t0i : t1i;
        anillo(pts[i], u, v, b);
        pos.set(pts[i], (b + radial) * 3);
      }
    }
    g.attributes.position.needsUpdate = true;
    g.computeVertexNormals();
    g.computeBoundingSphere();
  };
  return { g, poner };
}

/**
 * Dibuja una máquina. Devuelve { raiz, poner(valores), pose, objetosDe(id), lamina(bool), cascos(bool), mallas }.
 * op: { color, colorAro, sombras: true, materiales, lamina: true (aristas en tinta), estudio }
 */
export function mallasMaquina(M, op = {}) {
  const mats = op.materiales || materialesA(op);
  const raiz = new THREE.Group();
  raiz.name = M.nombre;
  raiz.matrixAutoUpdate = false;
  const grupos = new Map();
  for (const n of M.orden) { const g = new THREE.Group(); g.name = n; g.matrixAutoUpdate = false; raiz.add(g); grupos.set(n, g); }
  const porPieza = new Map(), mallas = new Map(), aristas = [];
  // lámina: contornos finos en tinta (token), encendida por defecto
  const tinta = new THREE.LineBasicMaterial({ color: tono("tinta"), transparent: true, opacity: 0.35, depthWrite: false });
  tinta.userData.tokenTinta = true;
  const laminaOn = op.lamina ?? true;
  const ruedas = [];
  for (const p of M.piezas) {
    let obj;
    if (p.tipo === "llanta") {
      // llanta con tacos del kit (eje z), orientada al eje de la rueda; gira al rodar
      obj = new THREE.Group();
      const ll = llanta({ diam: 2 * p.R, ancho: p.W, aro: p.aro, tacos: p.tacos, materiales: { goma: mats.goma, aro: mats.pinturaAro, perno: mats.acero } });
      const F = p.F, w = VA.cross(F.u, F.v); // F.a = eje
      obj.matrix.makeBasis(new THREE.Vector3(...F.u), new THREE.Vector3(...F.v), new THREE.Vector3(...F.a)).setPosition(...F.o);
      obj.matrixAutoUpdate = false;
      obj.add(ll);
      ruedas.push({ p, ll });
      ll.traverse((m) => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; } });
    } else {
      const g = geometriaPieza(p);
      if (!g) continue;
      const mat = mats[p.material] || mats.pintura;
      obj = new THREE.Mesh(g, mat);
      obj.castShadow = p.material !== "vidrio";
      obj.receiveShadow = true;
      // umbral 32°: los cantos y biseles, no los meridianos de un torno de 12 lados (30°)
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(g, 32), tinta);
      e.visible = laminaOn; obj.add(e); aristas.push(e);
    }
    obj.name = p.nombre;
    obj.userData.pieza = p;
    grupos.get(p.grupo).add(obj);
    mallas.set(p.nombre, obj);
    if (p.pieza) { if (!porPieza.has(p.pieza)) porPieza.set(p.pieza, []); porPieza.get(p.pieza).push(obj); }
  }
  // mangueras
  const mang = M.mangueras.map((m) => {
    const t = tuboVivo(m.segmentos ?? 28, m.r);
    const mesh = new THREE.Mesh(t.g, m.material ? mats[m.material] : mats.manguera);
    mesh.castShadow = true; mesh.frustumCulled = false; mesh.name = m.nombre;
    raiz.add(mesh);
    if (m.pieza) { if (!porPieza.has(m.pieza)) porPieza.set(m.pieza, []); porPieza.get(m.pieza).push(mesh); }
    return { m, t, mesh };
  });
  // cascos (depuración: lo que ve el juez)
  let capaCascos = null;
  const api = {
    raiz, mallas, materiales: mats, pose: null,
    poner(valores = {}) {
      const pose = M.posar(valores);
      api.pose = pose;
      matrizA(pose.raiz, raiz.matrix);
      for (const [n, g] of grupos) { const T = pose.T.get(n); if (T) matrizA(T, g.matrix); }
      raiz.matrixWorldNeedsUpdate = true;
      // las mangueras se calculan en el mundo: se dibujan en el marco de la raíz
      const inv = TA.inv(pose.raiz);
      for (const { m, t } of mang) t.poner(pose.mang.get(m.nombre).puntos.map((q) => TA.ap(inv, q)));
      const rod = valores.rodar ?? 0;
      for (const { p, ll } of ruedas) ll.rotation.z = -rod / p.R;
      if (capaCascos?.visible) dibujarCascos(pose);
      return pose;
    },
    objetosDe: (id) => porPieza.get(id) || [],
    grupo: (n) => grupos.get(n),
    /** Emisor (contrato A → B): punto de un grupo en el mundo, para polvo o agua. */
    mundo: (g, p) => (api.pose ? api.pose.mundo(g, p) : p),
    lamina(on) { for (const e of aristas) e.visible = on; },
    cascos(on) {
      if (!capaCascos) { capaCascos = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: tono("acento"), transparent: true, opacity: 0.6 })); capaCascos.frustumCulled = false; capaCascos.matrixAutoUpdate = false; raiz.parent?.add(capaCascos); }
      capaCascos.visible = on; if (on && api.pose) dibujarCascos(api.pose);
    },
  };
  function dibujarCascos(pose) {
    const segs = [];
    for (const c of M.cascos(pose)) { const n = c.puntos.length / 2; for (let i = 0; i < n; i++) { const a = c.puntos[i], b = c.puntos[(i + 1) % n], d = c.puntos[n + i]; segs.push(...a, ...b, ...a, ...d); } }
    capaCascos.geometry.setAttribute("position", new THREE.Float32BufferAttribute(segs, 3));
  }
  api.poner({});
  return api;
}
