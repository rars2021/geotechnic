// Geotechnic · labores subterráneas: galería con contorno sobreexcavado, piso con huellas y charcos, shotcrete,
// pernos con placa, manga de ventilación, tuberías, frente con taladros y montón de mineral.
// Eje de la labor = x (el frente queda en x = largo). Piso en y = 0, centro de la sección en z = 0.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { azar, ruido3, fbm, suave, clamp, rgb, mezcla } from "./nucleo.js";
import { relieveBloques } from "./fracturas.js";
import { materialPintura, MATERIALES } from "./materiales.js";

/** Contorno de la sección (polilínea cerrada en (z, y)), desde el centro del piso, en sentido antihorario visto desde el frente. */
export function seccionBaul(ancho = 4, alto = 4, flecha = null, nArco = 24) {
  const f = flecha ?? ancho / 3, hp = alto - f;
  const pts = [[0, 0], [ancho / 2, 0], [ancho / 2, hp]];
  // arco circular que pasa por (±a/2, hp) y (0, alto)
  const a = ancho / 2, R = (a * a + f * f) / (2 * f), yc = alto - R;
  const t0 = Math.atan2(hp - yc, a);
  for (let i = 1; i < nArco; i++) { const t = t0 + ((Math.PI - 2 * t0) * i) / nArco; pts.push([R * Math.cos(t), yc + R * Math.sin(t)]); }
  pts.push([-ancho / 2, hp], [-ancho / 2, 0], [0, 0]);
  return { pts, ancho, alto, flecha: f, paredes: hp };
}

function remuestrear(pts, paso) {
  const out = [], tipos = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [z0, y0] = pts[i], [z1, y1] = pts[i + 1];
    const L = Math.hypot(z1 - z0, y1 - y0), n = Math.max(1, Math.round(L / paso));
    for (let k = 0; k < n; k++) out.push([z0 + ((z1 - z0) * k) / n, y0 + ((y1 - y0) * k) / n]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/**
 * Galería. op: { seccion, largo, paso, sobreexcavacion (m medio), dfn, color(x,y,z), humedad(x,y,z,piso), semilla,
 *               shotcrete: { desde, hasta, espesor } (tramo en x), region(x, tipo, enShot) }
 * Devuelve { geometria, muestra(x, s), seccion, contorno, S }.
 */
export function galeria(op = {}) {
  const { seccion = seccionBaul(), largo = 30, paso = 0.12, sobreexcavacion = 0.25, dfn = null, semilla = 31,
    color = () => rgb("#7d786f"), humedad = null, shotcrete = null, region = null, colorShot = rgb("#9c9a94"), inicio = 0 } = op;
  const n = ruido3(semilla), n2 = ruido3(semilla + 2);
  const cont = remuestrear(seccion.pts, paso);
  const ns = cont.length, nx = Math.ceil(largo / paso) + 1;
  // normal exterior (hacia el macizo) por punto del contorno, suavizada
  const nor = cont.map((p, i) => {
    const a = cont[Math.max(0, i - 2)], b = cont[Math.min(ns - 1, i + 2)];
    const dz = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dz, dy) || 1;
    return [dy / L, -dz / L]; // perpendicular hacia afuera del contorno antihorario
  });
  const esPiso = cont.map((p) => p[1] < 0.02);
  const N = nx * ns;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), hum = new Float32Array(N), reg = new Float32Array(N);
  for (let i = 0; i < nx; i++) {
    const x = inicio + (i * largo) / (nx - 1);
    for (let j = 0; j < ns; j++) {
      const k = i * ns + j;
      const [z0, y0] = cont[j];
      const [nz, ny] = nor[j];
      let d = 0, dist = 9, tono = 0.5;
      const piso = esPiso[j];
      const enShot = shotcrete && x > shotcrete.desde + 0.6 * n(0, y0 * 0.5, z0 * 0.5) && x < shotcrete.hasta + 0.6 * n(9, y0 * 0.5, z0 * 0.5) && !piso;
      if (!piso) {
        // sobreexcavación: bloques que se desprendieron + ondulación de la voladura (se repite cada avance)
        if (dfn) { const b = relieveBloques(dfn, x, y0, z0, 1); d -= b.d * 0.9; dist = b.dist; tono = b.tono; }
        d += sobreexcavacion * (0.6 + 0.8 * (0.5 + 0.5 * fbm(n, x * 0.25, y0 * 0.25, z0 * 0.25, 4)));
        const avance = 3.6; const fase = ((x % avance) + avance) % avance / avance;
        d += 0.12 * Math.pow(1 - fase, 3); // escalón por disparo (el contorno se angosta al fondo de cada avance)
        if (enShot) { d = d * 0.35 + sobreexcavacion * 0.4 - (shotcrete.espesor ?? 0.05); d += 0.02 * n2(x * 3, y0 * 3, z0 * 3); }
        else d += 0.04 * fbm(n2, x * 2, y0 * 2, z0 * 2, 3);
      } else {
        // piso: huellas de llantas, barro y charcos
        const huella = Math.max(0, 1 - Math.abs(Math.abs(z0) - 0.95) / 0.35);
        d = -0.06 * huella * (0.6 + 0.4 * n(x * 0.3, 0, z0)) + 0.05 * fbm(n2, x * 0.5, 0, z0 * 0.5, 3);
      }
      const px = x, py = y0 + ny * d, pz = z0 + nz * d;
      pos[k * 3] = px; pos[k * 3 + 1] = py; pos[k * 3 + 2] = pz;
      let c = enShot ? colorShot : color(px, py, pz);
      if (!enShot && !piso) { const k0 = (1 + (tono - 0.5) * 0.2) * (1 - 0.35 * (1 - suave(0.02, 0.08, dist))); c = [c[0] * k0, c[1] * k0, c[2] * k0]; }
      if (piso) c = mezcla(c, rgb("#5f574c"), 0.65);
      for (let q = 0; q < 3; q++) col[k * 3 + q] = c[q];
      if (humedad) hum[k] = humedad(px, py, pz, piso, dist);
      if (region) reg[k] = region(px, piso ? "piso" : py > seccion.paredes ? "corona" : "hastial", enShot);
    }
  }
  const idx = [];
  for (let i = 0; i < nx - 1; i++) for (let j = 0; j < ns - 1; j++) {
    const a = i * ns + j, b = a + 1, c = a + ns, e = c + 1;
    idx.push(a, b, c, b, e, c); // normales hacia adentro de la labor
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.setAttribute("humedad", new THREE.BufferAttribute(hum, 1));
  g.setAttribute("region", new THREE.BufferAttribute(reg, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  const muestra = (x, s) => {
    const i = clamp(Math.round(((x - inicio) / largo) * (nx - 1)), 0, nx - 1), j = clamp(Math.round(s * (ns - 1)), 0, ns - 1);
    const k = i * ns + j, P = g.attributes.position.array, Nn = g.attributes.normal.array;
    return { p: new THREE.Vector3(P[k * 3], P[k * 3 + 1], P[k * 3 + 2]), n: new THREE.Vector3(Nn[k * 3], Nn[k * 3 + 1], Nn[k * 3 + 2]) };
  };
  return { geometria: g, muestra, seccion, contorno: cont, nx, ns, largo, inicio };
}

/**
 * Frente: tapa del extremo de la galería con relieve de voladura (cráteres de los taladros del disparo anterior)
 * y, si se dan, los taladros nuevos como huecos oscuros. taladros: [{ z, y, d }] en m.
 */
export function frente(galeriaObj, op = {}) {
  const { x = galeriaObj.inicio + galeriaObj.largo, color = () => rgb("#7d786f"), taladros = [], dfn = null, semilla = 5, res = 70 } = op;
  const n = ruido3(semilla);
  const cont = galeriaObj.contorno;
  const zs = cont.map((p) => p[0]), ys = cont.map((p) => p[1]);
  const W = Math.max(...zs) - Math.min(...zs) + 3.0, H = Math.max(...ys) + 1.6;
  const g = new THREE.PlaneGeometry(W, H, res, res);
  g.rotateY(-Math.PI / 2);
  g.translate(x, H / 2 - 0.5, 0);
  const P = g.attributes.position.array;
  const C = new Float32Array(P.length);
  for (let i = 0; i < P.length; i += 3) {
    const y = P[i + 1], z = P[i + 2];
    let d = 0.32 * fbm(n, y * 0.7, z * 0.7, 3, 5) + 0.18;
    let tono = 0.5, dist = 9;
    if (dfn) { const b = relieveBloques(dfn, x, y, z, 1); d -= b.d * 1.7; tono = b.tono; dist = b.dist; }
    // el frente es cóncavo: avanza más en el centro (arranque)
    d += 0.35 * Math.exp(-(z * z + (y - 1.6) ** 2) / 3);
    for (const t of taladros) { const r2 = (z - t.z) ** 2 + (y - t.y) ** 2; if (r2 < (t.d * 2.5) ** 2) d += 0.08 * (1 - Math.sqrt(r2) / (t.d * 2.5)); }
    P[i] = x + d;
    const c = color(P[i], y, z);
    const k0 = (1 + (tono - 0.5) * 0.25) * (1 - 0.35 * (1 - suave(0.02, 0.08, dist)));
    C[i] = c[0] * k0; C[i + 1] = c[1] * k0; C[i + 2] = c[2] * k0;
  }
  g.setAttribute("color", new THREE.BufferAttribute(C, 3));
  g.computeVertexNormals();
  return g;
}

/** Pernos con placa (y tuerca) sobre el contorno: malla de `espaciado` m entre x0 y x1, desde `desdeY` hacia la corona. */
export function pernos(galeriaObj, op = {}) {
  const { x0 = galeriaObj.inicio + 1, x1 = galeriaObj.inicio + galeriaObj.largo - 2, espaciado = 1.5, desdeY = 1.4, placa = 0.2, semilla = 7 } = op;
  const r = azar(semilla);
  const lista = [];
  const cont = galeriaObj.contorno;
  // longitud de arco del contorno sobre desdeY
  const idx = cont.map((p, i) => i).filter((i) => cont[i][1] >= desdeY);
  const S = [0];
  for (let k = 1; k < idx.length; k++) S.push(S[k - 1] + Math.hypot(cont[idx[k]][0] - cont[idx[k - 1]][0], cont[idx[k]][1] - cont[idx[k - 1]][1]));
  const Ltot = S[S.length - 1];
  let fila = 0;
  for (let x = x0; x < x1; x += espaciado, fila++) {
    const desfase = fila % 2 ? espaciado / 2 : 0; // malla en tresbolillo
    for (let s = desfase + 0.3; s < Ltot; s += espaciado) {
      let k = 1; while (k < S.length - 1 && S[k] < s) k++;
      const j = idx[k];
      const m = galeriaObj.muestra(x + r.entre(-0.1, 0.1), j / (galeriaObj.ns - 1));
      lista.push(m);
    }
  }
  const gPlaca = new THREE.BoxGeometry(placa, placa, 0.01);
  const gTuerca = new THREE.CylinderGeometry(0.025, 0.025, 0.06, 6).rotateX(Math.PI / 2).translate(0, 0, 0.03);
  const g = mergeGeometries([gPlaca, gTuerca]);
  const mat = materialPintura("#6f6a62", { metal: 0.6, rugosidad: 0.55, suciedad: 0.8, desgaste: 0.6 });
  const im = new THREE.InstancedMesh(g, mat, lista.length);
  const d = new THREE.Object3D();
  lista.forEach((m, i) => {
    d.position.copy(m.p).addScaledVector(m.n, 0.012);
    d.lookAt(m.p.clone().add(m.n));
    d.rotateZ(r() * 0.4);
    d.updateMatrix(); im.setMatrixAt(i, d.matrix);
  });
  im.castShadow = true;
  im.userData.cantidad = lista.length;
  return im;
}

/** Manga de ventilación colgada de la corona (tela amarilla con anillos), de x0 a x1. */
export function mangaVentilacion(op = {}) {
  const { x0 = 0, x1 = 25, y = 3.55, z = -1.0, diametro = 0.9, color = "#d9a22b" } = op;
  const L = x1 - x0;
  const g = new THREE.CylinderGeometry(diametro / 2, diametro / 2, L, 28, Math.ceil(L * 2), true);
  const P = g.attributes.position.array;
  for (let i = 0; i < P.length; i += 3) {
    const yy = P[i + 1];
    const anillo = Math.abs(Math.sin(((yy + L / 2) / 1.0) * Math.PI));
    const k = 1 - 0.06 * Math.pow(1 - anillo, 6) + 0.02 * Math.sin(yy * 7.3 + P[i] * 3);
    P[i] *= k; P[i + 2] *= k;
    if (P[i + 2] > 0.1) P[i + 2] *= 0.88; // la tela se aplasta arriba, contra el cable
  }
  g.computeVertexNormals();
  g.rotateZ(Math.PI / 2);
  g.translate(x0 + L / 2, y - diametro / 2, z);
  const m = new THREE.Mesh(g, materialPintura(color, { rugosidad: 0.75, metal: 0, suciedad: 0.35, alturaBarro: 0.1 }));
  m.material.side = THREE.DoubleSide;
  m.castShadow = true;
  return m;
}

/** Tuberías de aire y agua por el hastial, con soportes. */
export function tuberias(op = {}) {
  const { x0 = 0, x1 = 25, z = 1.85, alturas = [1.7, 1.95], diametros = [0.1, 0.075], colores = ["#38689e", "#2c2c2c"] } = op;
  const g = new THREE.Group();
  alturas.forEach((y, i) => {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(diametros[i] / 2, diametros[i] / 2, x1 - x0, 12).rotateZ(Math.PI / 2), materialPintura(colores[i], { suciedad: 0.5, alturaBarro: 0.1 }));
    t.position.set((x0 + x1) / 2, y, z); t.castShadow = true; g.add(t);
  });
  for (let x = x0 + 1; x < x1; x += 3) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.05), MATERIALES.aceroGastado()); s.position.set(x, (alturas[0] + alturas[1]) / 2, z + 0.06); g.add(s); }
  return g;
}

/** Charcos: planos oscuros y brillantes en los bajos del piso (reflejan las luces). */
export function charcos(galeriaObj, op = {}) {
  const { cantidad = 6, semilla = 9, x0 = galeriaObj.inicio, x1 = galeriaObj.inicio + galeriaObj.largo - 3 } = op;
  const r = azar(semilla);
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: "#1b1a18", roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.86 });
  for (let k = 0; k < cantidad; k++) {
    const forma = new THREE.Shape();
    const R = r.entre(0.4, 1.4), nn = 12;
    for (let i = 0; i <= nn; i++) { const a = (i / nn) * Math.PI * 2, rr = R * r.entre(0.6, 1.1); const px = Math.cos(a) * rr * 1.6, pz = Math.sin(a) * rr * 0.6; i ? forma.lineTo(px, pz) : forma.moveTo(px, pz); }
    const m = new THREE.Mesh(new THREE.ShapeGeometry(forma), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(r.entre(x0, x1), 0.012, r.elegir([-0.95, 0.95, 0]) + r.entre(-0.2, 0.2));
    m.receiveShadow = true;
    g.add(m);
  }
  return g;
}
