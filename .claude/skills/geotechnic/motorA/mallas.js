// Geotechnic · motor A · dibujo en three.js de una máquina del modelo puro (motorA/modelo.js).
// Cada pieza se dibuja con EXACTAMENTE la geometría que audita el juez (prisma de su polígono, redondo de su perfil):
// lo que se ve es lo que se probó. El acabado es el de la escena de roca (pintura sucia, acero gastado, cromo), así el
// equipo vive dentro del motor B con la misma luz. El modo «lámina» agrega las aristas en tinta, al estilo de Anatomy.
import * as THREE from "three";
import { materialPintura, MATERIALES } from "../kit/materiales.js";
import { llanta } from "../kit/equipos.js";
import { TA, VA } from "./modelo.js";

/** Materiales del motor A por nombre (los que usan los modelos de equipos/). */
export function materialesA(op = {}) {
  const color = op.color || "#d9a521";
  const barro = op.alturaBarro ?? 1.0;
  const m = {
    pintura: materialPintura(color, { alturaBarro: barro, suciedad: op.suciedad ?? 0.5, rugosidad: 0.48 }),
    pinturaGastada: materialPintura(color, { rugosidad: 0.6, metal: 0.25, suciedad: 0.7, desgaste: 0.75, alturaBarro: barro + 0.5, barro: "#6b6153" }),
    pinturaAro: materialPintura(op.colorAro || color, { rugosidad: 0.55, metal: 0.3, suciedad: 0.55, alturaBarro: barro }),
    acero: materialPintura("#5f5a53", { rugosidad: 0.55, metal: 0.6, suciedad: 0.45, desgaste: 0.4, alturaBarro: barro }),
    cromo: MATERIALES.cromo(),
    goma: materialPintura("#1f1e1c", { rugosidad: 0.9, metal: 0, barro: "#6e6252", alturaBarro: barro * 0.9, suciedad: 0.6 }),
    negro: MATERIALES.negro(),
    vidrio: MATERIALES.vidrio(),
    laton: new THREE.MeshStandardMaterial({ color: "#b08d4a", roughness: 0.35, metalness: 0.9 }),
    luz: MATERIALES.luz("#fff4dc"),
    luzRoja: MATERIALES.luz("#ff5a3c"),
    aluminio: materialPintura("#a9aba8", { rugosidad: 0.4, metal: 0.7, suciedad: 0.35, alturaBarro: barro }),
    rojo: materialPintura(op.colorPerforadora || "#c8452f", { rugosidad: 0.45, suciedad: 0.45, alturaBarro: barro }),
    gris: materialPintura("#8d8c86", { rugosidad: 0.55, suciedad: 0.5, alturaBarro: barro }),
    manguera: new THREE.MeshStandardMaterial({ color: "#1b1a19", roughness: 0.7, metalness: 0.05 }),
    roca: materialPintura("#77726a", { rugosidad: 0.95, metal: 0, suciedad: 0.2 }),
  };
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
    return g;
  }
  return null;
}

/** Tubo de manguera de topología fija: se actualizan los vértices en cada pose (transporte paralelo). */
function tuboVivo(n, r, radial = 8) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array((n + 1) * radial * 3);
  const idx = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < radial; j++) {
    const a = i * radial + j, b = i * radial + ((j + 1) % radial), c = a + radial, d = b + radial;
    idx.push(a, c, b, b, c, d);
  }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  const poner = (pts) => {
    let t0 = VA.unit(VA.sub(pts[1], pts[0])), u = VA.perp(t0, [0, 1, 0]);
    for (let i = 0; i <= n; i++) {
      const t = VA.unit(VA.sub(pts[Math.min(n, i + 1)], pts[Math.max(0, i - 1)]));
      u = VA.unit(VA.sub(u, VA.mul(t, VA.dot(u, t))));
      const v = VA.cross(t, u);
      for (let j = 0; j < radial; j++) {
        const a = (j / radial) * Math.PI * 2, k = (i * radial + j) * 3;
        pos[k] = pts[i][0] + r * (Math.cos(a) * u[0] + Math.sin(a) * v[0]);
        pos[k + 1] = pts[i][1] + r * (Math.cos(a) * u[1] + Math.sin(a) * v[1]);
        pos[k + 2] = pts[i][2] + r * (Math.cos(a) * u[2] + Math.sin(a) * v[2]);
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
 * op: { color, colorAro, sombras: true, materiales }
 */
export function mallasMaquina(M, op = {}) {
  const mats = op.materiales || materialesA(op);
  const raiz = new THREE.Group();
  raiz.name = M.nombre;
  raiz.matrixAutoUpdate = false;
  const grupos = new Map();
  for (const n of M.orden) { const g = new THREE.Group(); g.name = n; g.matrixAutoUpdate = false; raiz.add(g); grupos.set(n, g); }
  const porPieza = new Map(), mallas = new Map(), aristas = [];
  const tinta = new THREE.LineBasicMaterial({ color: "#1d1a17", transparent: true, opacity: 0.85 });
  const ruedas = [];
  for (const p of M.piezas) {
    let obj;
    if (p.tipo === "llanta") {
      // llanta con tacos del kit (eje z), orientada al eje de la rueda; gira al rodar
      obj = new THREE.Group();
      const ll = llanta({ diam: 2 * p.R, ancho: p.W, aro: p.aro, tacos: p.tacos, colorAro: op.colorAro || "#d1a227" });
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
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(g, 28), tinta);
      e.visible = false; obj.add(e); aristas.push(e);
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
      if (!capaCascos) { capaCascos = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: "#e2483d", transparent: true, opacity: 0.6 })); capaCascos.frustumCulled = false; capaCascos.matrixAutoUpdate = false; raiz.parent?.add(capaCascos); }
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
