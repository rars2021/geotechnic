// Geotechnic · terreno: perfiles de banco, malla de talud casi real, escombros, cerros de fondo y pretiles.
// Reglas visuales en references/reglas-roca.md (cara, cresta, pie, berma, medias cañas, talud de escombros).
import * as THREE from "three";
import { azar, ruido3, fbm, crestas, suave, clamp, rad, rgb, mezcla, lerp, hash3 } from "./nucleo.js";
import { relieveBloques, bloqueEn } from "./fracturas.js";

/**
 * Perfil de bancos visto en corte (h = distancia horizontal hacia el macizo, z = cota sobre el piso).
 * bancos: [{ altura, cara (°), berma (m) }] de abajo hacia arriba (la última berma es el terreno sobre la cresta).
 * piso: m de piso delante del pie del banco inferior.
 */
export function perfilBancos({ bancos, piso = 20 }) {
  const pts = [[-piso, 0]], tramos = [];
  let h = 0, z = 0;
  pts.push([0, 0]); tramos.push({ tipo: "piso", banco: -1 });
  bancos.forEach((b, i) => {
    const dh = b.altura / Math.tan(rad(b.cara));
    h += dh; z += b.altura; pts.push([h, z]); tramos.push({ tipo: "cara", banco: i, cara: b.cara, altura: b.altura });
    h += b.berma; pts.push([h, z]); tramos.push({ tipo: i === bancos.length - 1 ? "tope" : "berma", banco: i });
  });
  // longitudes de arco acumuladas
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, tramos, s, largo: s[s.length - 1], bancos };
}

/** Punto, tramo y normal exterior del perfil en la abscisa curvilínea s. */
function enPerfil(perfil, s) {
  const { pts, s: S, tramos } = perfil;
  let i = 1;
  while (i < S.length - 1 && S[i] < s) i++;
  const t = clamp((s - S[i - 1]) / (S[i] - S[i - 1] || 1));
  const a = pts[i - 1], b = pts[i];
  const dh = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dh, dz) || 1;
  return { h: a[0] + dh * t, z: a[1] + dz * t, nh: -dz / L, nz: dh / L, tramo: tramos[i - 1], i: i - 1, t };
}

/**
 * Malla de talud. Mundo: x = rumbo del talud, y = arriba, z = hacia el tajo (el macizo queda en -z).
 * op: { perfil, largo, paso, dfn, color(x,y,z)→rgb lineal, humedad(x,y,z,dist,pend)→0..1, semilla,
 *       estrias (m, relieve vertical de voladura), bloques (×), retroceso (m, cresta rota), escombros: { alto, reposo (°) },
 *       oxidos: f(x,y,z)→0..1 zona con óxidos en fracturas, region(u, s, tramo)→número }
 * Devuelve { geometria, muestra(u, s), ancla(u, s, sobre), perfil }.
 */
export function mallaTalud(op) {
  const { perfil, largo = 80, paso = 0.3, dfn = null, semilla = 11, estrias = 0.35, bloques = 1, retroceso = 1.6,
    escombros = { alto: 2.2, reposo: 34 }, color = () => [0.4, 0.4, 0.4], humedad = null, oxidos = null,
    region = null, polvoBerma = rgb("#b5a996"), finos = rgb("#a39684"), huellas = null, extra = null } = op;
  const n = ruido3(semilla), n2 = ruido3(semilla + 1);
  const r = azar(semilla);
  // abscisas: uniformes, con las esquinas incluidas
  const S = [];
  for (let s = 0; s <= perfil.largo; s += paso) S.push(s);
  for (const sc of perfil.s) if (!S.some((v) => Math.abs(v - sc) < paso * 0.3)) S.push(sc);
  S.sort((a, b) => a - b);
  const nu = Math.ceil(largo / paso) + 1, ns = S.length;
  const U = Array.from({ length: nu }, (_, i) => -largo / 2 + (i * largo) / (nu - 1));
  // datos por fila de s: normal suavizada, pesos de cara, distancia a cresta y a pie
  const fila = S.map((s) => {
    const p = enPerfil(perfil, s);
    let nh = 0, nz = 0;
    for (let k = -4; k <= 4; k++) { const q = enPerfil(perfil, clamp(s + k * 0.35, 0, perfil.largo)); nh += q.nh; nz += q.nz; }
    const L = Math.hypot(nh, nz); nh /= L; nz /= L;
    // cresta y pie más cercanos
    let dCresta = 1e9, dPie = 1e9, bancoPie = -1;
    perfil.tramos.forEach((tr, i) => {
      if (tr.tipo !== "cara") return;
      const sPie = perfil.s[i], sCr = perfil.s[i + 1];
      if (Math.abs(s - sCr) < Math.abs(dCresta)) dCresta = s - sCr;
      if (Math.abs(s - sPie) < Math.abs(dPie)) { dPie = s - sPie; bancoPie = tr.banco; }
    });
    const cara = p.tramo.tipo === "cara" ? 1 : 0;
    return { s, ...p, nh, nz, dCresta, dPie, bancoPie, cara };
  });
  // peso de cara suavizado (para que el relieve no termine en escalón en la esquina)
  fila.forEach((f, j) => {
    let w = 0, c = 0;
    for (let k = -3; k <= 3; k++) { const g = fila[clamp(j + k, 0, ns - 1)]; w += g.cara; c++; }
    f.wCara = w / c;
  });

  const N = nu * ns;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), hum = new Float32Array(N), reg = new Float32Array(N);
  const cerca = new Float32Array(N).fill(9);
  const tanRep = Math.tan(rad(escombros.reposo));
  for (let j = 0; j < ns; j++) {
    const f = fila[j];
    for (let i = 0; i < nu; i++) {
      const u = U[i], k = j * nu + i;
      let h = f.h, z = f.z;
      // 1) escombros al pie: talud de reposo apoyado en la cara y sobre la berma/piso
      const alto = escombros.alto * clamp(0.55 + 0.45 * n(u * 0.05, f.bancoPie * 3.1, 0) + 0.35 * n2(u * 0.17, 0, f.bancoPie)) * (f.bancoPie >= 0 ? 1 : 0);
      if (alto > 0.05 && Math.abs(f.dPie) < 12) {
        const tr = perfil.tramos.find((t) => t.tipo === "cara" && t.banco === f.bancoPie);
        const ang = rad(tr.cara);
        if (f.dPie < 0) { // delante del pie (sobre la berma o el piso): sube al talud de reposo
          const d = -f.dPie; const T = alto - d * tanRep;
          if (T > 0) z += T;
        } else { // sobre la cara: avanza hasta la superficie del talud de reposo
          const e = f.dPie * Math.sin(ang);
          if (e < alto) { const dentro = e / Math.tan(ang); const fuera = (alto - e) / tanRep; h -= dentro + fuera; }
        }
      }
      // posición base
      let x = u, y = z, w = -h;
      // 2) relieve
      let d = 0;
      const estr = estrias * f.wCara * (crestas(n, u * 0.32, f.s * 0.025, 1.7) - 0.45);
      d += estr;
      let dist = 9, fam = -1, tono = 0.5, hueco = 0;
      if (dfn) {
        const b = relieveBloques(dfn, x, y, w, bloques * (0.08 + 0.92 * f.wCara));
        d += b.d; dist = b.dist; fam = b.familia; tono = b.tono; hueco = b.d;
      }
      // cresta rota: retrocede la esquina hacia el macizo con ruido a lo largo del rumbo
      if (Math.abs(f.dCresta) < 4) {
        const perf = Math.exp(-(f.dCresta * f.dCresta) / 2.2);
        d -= retroceso * perf * (0.45 + 0.55 * (0.5 + 0.5 * n(u * 0.12, f.dCresta * 0.2, 4.2)));
      }
      d += (0.03 + 0.07 * f.wCara) * fbm(n2, u * 0.6, y * 0.6, w * 0.6, 3);
      if (extra) d += extra(x, y, w, f);
      // normal exterior en (h, z) = (nh, nz); en mundo z = -h, así que su componente z es -nh
      y += f.nz * d;
      w = -h - f.nh * d;
      pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = w;
      cerca[k] = dist;
      // 3) color
      let c = color(x, y, w);
      // tono por bloque y oscurecimiento en huecos y juntas abiertas (la sombra que da relieve a la foto)
      const k0 = (1 + (tono - 0.5) * 0.18 * f.wCara) * (1 - 0.35 * f.wCara * clamp((-hueco - 0.3) / 0.5)) * (1 - 0.32 * f.wCara * (1 - suave(0.02, 0.08, dist)));
      c = [c[0] * k0, c[1] * k0, c[2] * k0];
      const arriba = f.nz > 0.8 || (f.dPie < 0 && f.dPie > -alto / tanRep);
      if (oxidos && dist < 0.6) {
        const o = oxidos(x, y, w) * (1 - suave(0.05, 0.6, dist));
        if (o > 0) c = mezcla(c, rgb(n(x * 0.4, y * 0.4, w * 0.4) > 0 ? "#a88a5c" : "#94704a"), clamp(o * 0.8));
      }
      if (arriba) {
        const talud = f.dPie < 0 && -f.dPie < alto / tanRep ? 1 : 0;
        c = mezcla(c, talud ? finos : polvoBerma, talud ? 0.55 : 0.72 + 0.2 * n(u * 0.2, 0, f.s * 0.2));
        if (huellas && f.tramo.tipo === "piso") {
          const hh = huellas(u, f.h);
          if (hh > 0) c = mezcla(c, rgb("#6b6358"), hh);
        }
      }
      for (let q = 0; q < 3; q++) col[k * 3 + q] = c[q];
      if (humedad) hum[k] = humedad(x, y, w, dist, f.wCara);
      if (region) reg[k] = region(u, f.s, f.tramo, f);
    }
  }
  // 4) chorreras: óxidos y humedad bajan por la cara desde las fracturas (arrastre de arriba hacia abajo por columna)
  for (let i = 0; i < nu; i++) {
    let carga = 0, cargaH = 0;
    for (let j = ns - 1; j >= 0; j--) {
      const f = fila[j], k = j * nu + i;
      if (f.wCara < 0.5) { carga = 0; cargaH *= 0.3; continue; }
      const fuente = oxidos ? oxidos(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]) * (cerca[k] < 0.12 ? 1 : 0) : 0;
      carga = Math.max(carga * 0.93, fuente * (0.6 + 0.4 * hash3(i, 7, 1)));
      if (carga > 0.03) {
        const c = [col[k * 3], col[k * 3 + 1], col[k * 3 + 2]];
        const m = mezcla(c, rgb("#9e8158"), carga * 0.45);
        col[k * 3] = m[0]; col[k * 3 + 1] = m[1]; col[k * 3 + 2] = m[2];
      }
      if (humedad) { cargaH = Math.max(cargaH * 0.96, hum[k] * (cerca[k] < 0.15 ? 1 : 0.2)); hum[k] = Math.max(hum[k], cargaH * 0.85); }
    }
  }
  // índices
  const idx = new Uint32Array((nu - 1) * (ns - 1) * 6);
  let t = 0;
  for (let j = 0; j < ns - 1; j++) for (let i = 0; i < nu - 1; i++) {
    const a = j * nu + i, b = a + 1, c = a + nu, e = c + 1;
    idx[t++] = a; idx[t++] = b; idx[t++] = c; idx[t++] = b; idx[t++] = e; idx[t++] = c;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.setAttribute("humedad", new THREE.BufferAttribute(hum, 1));
  g.setAttribute("region", new THREE.BufferAttribute(reg, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  const muestra = (u, s) => {
    const i = clamp(Math.round(((u + largo / 2) / largo) * (nu - 1)), 0, nu - 1);
    let j = 0; while (j < ns - 1 && S[j] < s) j++;
    const k = j * nu + i;
    const P = g.attributes.position.array, Nn = g.attributes.normal.array;
    return { p: new THREE.Vector3(P[k * 3], P[k * 3 + 1], P[k * 3 + 2]), n: new THREE.Vector3(Nn[k * 3], Nn[k * 3 + 1], Nn[k * 3 + 2]), fila: fila[j] };
  };
  return { geometria: g, muestra, perfil, fila, S, U, nu, ns };
}

/** Abscisa s del pie y de la cresta de un banco (para anclar rótulos y escombros). */
export function sDeBanco(perfil, banco) {
  const i = perfil.tramos.findIndex((t) => t.tipo === "cara" && t.banco === banco);
  return { pie: perfil.s[i], cresta: perfil.s[i + 1], bermaFin: perfil.s[i + 2] ?? perfil.largo };
}

/** Geometrías base de bloques angulosos (voladura): poliedros irregulares de caras planas. */
export function geometriasBloque(cuantas = 5, semilla = 4) {
  const r = azar(semilla);
  const out = [];
  for (let q = 0; q < cuantas; q++) {
    const g = new THREE.IcosahedronGeometry(1, 0).toNonIndexed();
    const P = g.attributes.position.array;
    const sx = r.entre(0.7, 1.25), sy = r.entre(0.45, 0.85), sz = r.entre(0.6, 1.1);
    // deformar por vértice compartido (misma posición → mismo desplazamiento) para que no se abran grietas
    const mapa = new Map();
    for (let i = 0; i < P.length; i += 3) {
      const key = `${P[i].toFixed(3)},${P[i + 1].toFixed(3)},${P[i + 2].toFixed(3)}`;
      if (!mapa.has(key)) mapa.set(key, r.entre(0.72, 1.18));
      const k = mapa.get(key);
      P[i] *= sx * k; P[i + 1] *= sy * k; P[i + 2] *= sz * k;
    }
    g.computeVertexNormals();
    out.push(g);
  }
  return out;
}

/**
 * Escombros: bloques instanciados sobre una malla de talud, concentrados al pie de cada cara (talud de reposo)
 * y dispersos sobre las bermas. Tamaños lognormales (fragmentación de voladura).
 */
export function escombrosTalud(talud, op = {}) {
  const { cantidad = 2500, tamMedio = 0.45, desvTam = 0.35, semilla = 8, color = () => rgb("#8d8a83"), material = null, alcance = 7 } = op;
  const r = azar(semilla);
  const geos = geometriasBloque(5, semilla);
  const mat = material || new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true });
  const grupo = new THREE.Group();
  const porGeo = geos.map(() => []);
  const caras = talud.perfil.tramos.map((t, i) => ({ t, i })).filter((o) => o.t.tipo === "cara");
  const L = talud.U[talud.U.length - 1] - talud.U[0];
  for (let q = 0; q < cantidad; q++) {
    const c = r.elegir(caras);
    const sPie = talud.perfil.s[c.i];
    // distancia delante del pie: exponencial (la mayoría queda en el talud de escombros)
    const d = Math.min(alcance * 2, r.exponencial(alcance * 0.35));
    const s = sPie - d - 0.2;
    if (s < 0.5) continue;
    const u = talud.U[0] + r() * L;
    const m = talud.muestra(u, s);
    const tam = Math.min(2.5, r.lognormal(tamMedio * (d < 2 ? 1.25 : 0.8), desvTam));
    porGeo[q % geos.length].push({ p: m.p, n: m.n, tam, rot: [r() * 6.28, r() * 6.28, r() * 6.28], c: color(m.p.x, m.p.y, m.p.z) });
  }
  const dummy = new THREE.Object3D();
  geos.forEach((g, gi) => {
    const lista = porGeo[gi];
    if (!lista.length) return;
    const im = new THREE.InstancedMesh(g, mat, lista.length);
    lista.forEach((o, k) => {
      dummy.position.copy(o.p).addScaledVector(o.n, o.tam * 0.25);
      dummy.rotation.set(...o.rot);
      dummy.scale.setScalar(o.tam);
      dummy.updateMatrix();
      im.setMatrixAt(k, dummy.matrix);
      const v = 0.82 + r() * 0.3;
      im.setColorAt(k, new THREE.Color().setRGB(o.c[0] * v, o.c[1] * v, o.c[2] * v));
    });
    im.castShadow = true; im.receiveShadow = true;
    grupo.add(im);
  });
  return grupo;
}

/**
 * Medias cañas de precorte: huellas verticales de los taladros en la cara final.
 * Se dibujan como cintas con normales curvas (se leen cóncavas con la luz). espaciado y diámetro en m.
 * visibles: fracción de la altura que conserva la media caña (factor de cañas visibles).
 */
export function mediasCanas(talud, banco, op = {}) {
  const { espaciado = 2, diametro = 0.127, visibles = 0.7, semilla = 12, inclinacion = 0 } = op;
  const r = azar(semilla), n = ruido3(semilla);
  const { pie, cresta } = sDeBanco(talud.perfil, banco);
  const pos = [], nor = [], idx = [];
  const radio = diametro / 2;
  const U0 = talud.U[0] + 1, U1 = talud.U[talud.U.length - 1] - 1;
  for (let u = U0 + r() * espaciado; u < U1; u += espaciado * (0.92 + r() * 0.16)) {
    // tramos visibles a lo largo de la cara
    let s = pie + 0.6;
    while (s < cresta - 0.8) {
      const largo = (cresta - pie) * r.entre(0.15, 0.6);
      const vis = n(u * 0.4, s * 0.1, 3) * 0.5 + 0.5 < visibles + 0.15;
      const s1 = Math.min(cresta - 0.8, s + largo);
      if (vis) {
        const base = pos.length / 3;
        let filas = 0;
        for (let ss = s; ss <= s1; ss += 0.35) {
          const m = talud.muestra(u, ss);
          const tang = new THREE.Vector3(1, 0, 0);
          for (let a = -2; a <= 2; a++) {
            const ang = (a / 2) * (Math.PI / 2.2);
            const off = tang.clone().multiplyScalar(Math.sin(ang) * radio);
            const p = m.p.clone().add(off).addScaledVector(m.n, 0.03);
            const nn = m.n.clone().multiplyScalar(Math.cos(ang)).addScaledVector(tang, -Math.sin(ang)).normalize(); // cóncava
            pos.push(p.x, p.y, p.z); nor.push(nn.x, nn.y, nn.z);
          }
          filas++;
        }
        for (let f = 0; f < filas - 1; f++) for (let a = 0; a < 4; a++) {
          const v = base + f * 5 + a;
          idx.push(v, v + 1, v + 5, v + 1, v + 6, v + 5);
        }
      }
      s = s1 + r.entre(0.3, 2.5);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

/**
 * Cerros de fondo (heightfield con ruido de crestas). Se ven a través de la bruma: dan escala y lugar.
 * op: { tam: [ancho, fondo], res, alto, base, centro:[x,z], hueco: { x, z, r } (se aplana cerca de la escena) }
 */
export function cerros(op = {}) {
  const { tam = [6000, 6000], res = 180, alto = 900, base = -50, centro = [0, 0], hueco = { x: 0, z: 0, r: 500 }, semilla = 2,
    colores = { pasto: "#8b7d55", roca: "#6f6a62", nieve: "#eef1f3" }, cotaNieve = 1e9 } = op;
  const n = ruido3(semilla);
  const g = new THREE.PlaneGeometry(tam[0], tam[1], res, res);
  g.rotateX(-Math.PI / 2);
  const P = g.attributes.position.array;
  const C = new Float32Array(P.length);
  const cp = rgb(colores.pasto), cr = rgb(colores.roca), cn = rgb(colores.nieve);
  for (let i = 0; i < P.length; i += 3) {
    const x = P[i] + centro[0], z = P[i + 2] + centro[1];
    const d = Math.hypot(x - hueco.x, z - hueco.z);
    const lejos = suave(hueco.r, hueco.r * 2.2, d);
    const h = base + alto * lejos * (0.7 * Math.pow(crestas(n, x / 3200, 0.3, z / 3200, 4), 1.25) + 0.3 * (0.5 + 0.5 * fbm(n, x / 1500, 1.7, z / 1500, 3)));
    P[i] = x; P[i + 1] = h; P[i + 2] = z;
  }
  g.computeVertexNormals();
  const Nn = g.attributes.normal.array;
  for (let i = 0; i < P.length; i += 3) {
    const pend = 1 - Nn[i + 1];
    let c = mezcla(cp, cr, suave(0.12, 0.35, pend + 0.1 * n(P[i] / 300, 0, P[i + 2] / 300)));
    c = mezcla(c, cn, suave(cotaNieve - 80, cotaNieve + 40, P[i + 1]) * (1 - suave(0.3, 0.6, pend)));
    C[i] = c[0]; C[i + 1] = c[1]; C[i + 2] = c[2];
  }
  g.setAttribute("color", new THREE.BufferAttribute(C, 3));
  return g;
}

/** Pretil (berma de seguridad) a lo largo de una curva: sección triangular de material suelto. alto y ancho de base en m. */
export function pretil(curva, op = {}) {
  const { alto = 2, ancho = 3, pasos = 200, semilla = 6, color = "#8f877b" } = op;
  const n = ruido3(semilla);
  const pos = [], cols = [], idx = [];
  const c = rgb(color);
  const perfil = [[-ancho / 2, 0], [-ancho * 0.12, alto], [ancho * 0.12, alto], [ancho / 2, 0]];
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    const p = curva.getPointAt(t), tg = curva.getTangentAt(t);
    const lado = new THREE.Vector3(-tg.z, 0, tg.x).normalize();
    perfil.forEach(([a, b], k) => {
      const ruido = 0.25 * n(p.x * 0.5, k, p.z * 0.5);
      const q = p.clone().addScaledVector(lado, a + ruido * 0.4);
      q.y += b * (0.85 + 0.3 * (0.5 + 0.5 * n(p.x * 0.2, 9, p.z * 0.2))) + (b > 0 ? ruido : 0);
      pos.push(q.x, q.y, q.z);
      const v = 0.9 + 0.2 * n(p.x, k * 3, p.z);
      cols.push(c[0] * v, c[1] * v, c[2] * v);
    });
    if (i < pasos) for (let k = 0; k < 3; k++) { const a = i * 4 + k; idx.push(a, a + 4, a + 1, a + 1, a + 4, a + 5); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Huellas de neumáticos en un piso: bandas paralelas al rumbo con ruido. Devuelve f(u, h) → 0..1. */
export function huellasNeumatico({ carriles = [-8, -4.5, 4.5, 8], ancho = 1.1, semilla = 14 } = {}) {
  const n = ruido3(semilla);
  return (u, h) => {
    let v = 0;
    for (const c of carriles) {
      const off = h - (c + 0.6 * n(u * 0.02, c, 0));
      v = Math.max(v, 1 - suave(ancho * 0.3, ancho * 0.5, Math.abs(off)));
    }
    return v * 0.35 * (0.6 + 0.4 * n(u * 0.3, h, 1));
  };
}

/**
 * Tapa de corte: cortina vertical desde un borde de la malla hasta una cota base. Convierte el talud en un bloque
 * diagrama (se ve el perfil de bancos en sección). borde: "derecha" | "izquierda" | "frente".
 */
export function tapaSeccion(talud, { borde = "derecha", base = -12, color = () => [0.3, 0.3, 0.3], oscurecer = 0.82 } = {}) {
  const P = talud.geometria.attributes.position.array;
  const { nu, ns } = talud;
  const ids = [];
  if (borde === "derecha") for (let j = 0; j < ns; j++) ids.push(j * nu + nu - 1);
  else if (borde === "izquierda") for (let j = ns - 1; j >= 0; j--) ids.push(j * nu);
  else for (let i = nu - 1; i >= 0; i--) ids.push(i);
  const pos = [], col = [], idx = [];
  ids.forEach((k, m) => {
    const x = P[k * 3], y = P[k * 3 + 1], z = P[k * 3 + 2];
    const filas = Math.max(2, Math.ceil((y - base) / 0.6));
    for (let q = 0; q <= filas; q++) {
      const yy = y - ((y - base) * q) / filas;
      pos.push(x, yy, z);
      const c = color(x, yy, z);
      col.push(c[0] * oscurecer, c[1] * oscurecer, c[2] * oscurecer);
    }
    ids[m] = { k, filas, inicio: pos.length / 3 - filas - 1 };
  });
  // unir columnas vecinas con distinto número de filas: por cota relativa
  for (let m = 0; m < ids.length - 1; m++) {
    const a = ids[m], b = ids[m + 1];
    const n = Math.max(a.filas, b.filas);
    for (let q = 0; q < n; q++) {
      const ia = a.inicio + Math.round((q / n) * a.filas), ia2 = a.inicio + Math.round(((q + 1) / n) * a.filas);
      const ib = b.inicio + Math.round((q / n) * b.filas), ib2 = b.inicio + Math.round(((q + 1) / n) * b.filas);
      if (ia !== ia2) idx.push(ia, ib, ia2);
      if (ib !== ib2) idx.push(ib, ib2, ia2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Código de región de cada tipo de superficie del tajo (atributo `region` de mallaTajo; 0 = caras de la caja). */
export const REGIONES_TAJO = { caja: 0, meseta: 1, banco: 2, cara: 3, fondo: 4, rampa: 5, pretil: 6, monton: 7, botadero: 8, chancadora: 9 };

/**
 * Bloque del tajo: UN sólido cerrado y orientado (references/estudio.md) con la superficie de terrenoTajo arriba
 * (rejilla de `paso` m; en cada celda, la diagonal que mejor sigue la superficie), cuatro caras verticales y la base,
 * todo dentro de `ter.caja` (la misma caja del contrato: fuera de ella `libre` es aire).
 * Las caras empinadas llevan el relieve facetado del macizo (ter.relieveEn, el mismo que descuenta `libre`); vías,
 * bermas, fondo, meseta y plataformas quedan exactos (= piso). Color por tipo; `calma` (o macizo.calma) solo toca el color.
 * op: { paso (1.5 m), colores: { roca, polvo, via, pretil, fondo, finos, meseta, botadero, concreto, tolva }, calma }
 * Devuelve { geometria (grupos: 0 superficie, 1 caja), grupos, nx, nz, paso, caja, vertices }.
 */
export function mallaTajo(ter, op = {}) {
  const paso = op.paso ?? 1.5, mac = ter.macizo || null, calma = clamp(op.calma ?? mac?.calma ?? 0);
  const C = { roca: "#9a9790", polvo: "#c4c2ba", via: "#cbc5b8", pretil: "#a7a49c", fondo: "#bdb8ad", meseta: "#b9ae98",
    botadero: "#a99f8c", concreto: "#b8b5ad", tolva: "#5f5c57", finos: "#aeaba3", ...(op.colores || {}) };
  const K = Object.fromEntries(Object.entries(C).map(([k, v]) => [k, rgb(v)]));
  const calmo = (c) => { if (calma <= 0) return c; const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; return mezcla(c, [L, L, L], 0.5 * calma); };
  const [x0, yB, z0] = ter.caja.min, [x1, , z1] = ter.caja.max;
  const nx = Math.max(2, Math.round((x1 - x0) / paso) + 1), nz = Math.max(2, Math.round((z1 - z0) / paso) + 1);
  const dx = (x1 - x0) / (nx - 1), dz = (z1 - z0) / (nz - 1);
  const Hs = new Float64Array(nx * nz), tipos = new Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const s = ter.sitio(x0 + i * dx, z0 + j * dz); Hs[j * nx + i] = s.y; tipos[j * nx + i] = s.tipo; }
  const pos = [], col = [], reg = [], idx = [];
  const tanCara = Math.tan(rad(38));
  // ── superficie
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i, x = x0 + i * dx, z = z0 + j * dz, y = Hs[k];
    const iA = Math.max(0, i - 1), iB = Math.min(nx - 1, i + 1), jA = Math.max(0, j - 1), jB = Math.min(nz - 1, j + 1);
    const gx = (Hs[j * nx + iB] - Hs[j * nx + iA]) / ((iB - iA) * dx), gz = (Hs[jB * nx + i] - Hs[jA * nx + i]) / ((jB - jA) * dz);
    const borde = i < 2 || j < 2 || i > nx - 3 || j > nz - 3;
    const L = Math.hypot(gx, 1, gz), n = [-gx / L, 1 / L, -gz / L];
    const d = borde ? 0 : ter.relieveEn(x, z, gx, gz, y);
    pos.push(x + n[0] * d, y + n[1] * d, z + n[2] * d);
    let t = tipos[k];
    const empinada = Math.hypot(gx, gz) > tanCara;
    if (empinada && (t === "banco" || t === "meseta" || t === "fondo")) t = "cara";
    const roca = mac ? mac.color(x, y, z) : K.roca;
    let c;
    if (t === "cara") { const tono = mac ? mac.relieve(x, y, z, 1).tono : 0.5, k0 = 1 + (tono - 0.5) * 0.18 * (1 - calma / 2); c = roca.map((v) => v * k0); }
    else if (t === "banco") c = mezcla(roca, K.polvo, 0.72);
    else if (t === "fondo") c = mezcla(K.fondo, K.finos, 0.3);
    else if (t === "rampa") c = K.via;
    else if (t === "pretil") c = K.pretil;
    else if (t === "monton") c = mezcla(roca.map((v) => v * 0.9), K.finos, 0.45);
    else if (t === "botadero") c = empinada ? K.botadero.map((v) => v * 0.92) : mezcla(K.botadero, K.polvo, 0.4);
    else if (t === "chancadora") c = y < ter.cota - 0.5 ? K.tolva : K.concreto;
    else c = K.meseta;
    c = calmo(c); col.push(c[0], c[1], c[2]); reg.push(REGIONES_TAJO[t] ?? 1);
  }
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, e = c + 1;
    const hc = ter.altura(x0 + (i + 0.5) * dx, z0 + (j + 0.5) * dz);
    if (Math.abs((Hs[a] + Hs[e]) / 2 - hc) < Math.abs((Hs[b] + Hs[c]) / 2 - hc)) idx.push(a, c, e, a, e, b); // diagonal a–e
    else idx.push(a, c, b, b, c, e); // diagonal b–c (las dos caras miran arriba)
  }
  const nTop = pos.length / 3, iTop = idx.length;
  const gt = new THREE.BufferGeometry(); // normales suavizadas de la superficie
  gt.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); gt.setIndex(idx); gt.computeVertexNormals();
  const nor = Array.from(gt.attributes.normal.array);
  gt.dispose();
  // ── caja: cuatro paredes y la base, con sus propios vértices (las aristas se cosen por posición con la superficie)
  const vert = (p, n, c) => { pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); col.push(c[0], c[1], c[2]); reg.push(0); return pos.length / 3 - 1; };
  const tri = (a, b, c, n) => { // cara delantera hacia n
    const ux = pos[b * 3] - pos[a * 3], uy = pos[b * 3 + 1] - pos[a * 3 + 1], uz = pos[b * 3 + 2] - pos[a * 3 + 2];
    const vx = pos[c * 3] - pos[a * 3], vy = pos[c * 3 + 1] - pos[a * 3 + 1], vz = pos[c * 3 + 2] - pos[a * 3 + 2];
    const s = (uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2];
    if (s >= 0) idx.push(a, b, c); else idx.push(a, c, b);
  };
  const cCaja = calmo(mezcla(K.roca, [0.08, 0.08, 0.08], 0.25));
  const anillo = []; // borde de la superficie: norte (z0, x crece), este, sur (x decrece), oeste
  for (let i = 0; i < nx - 1; i++) anillo.push(i);
  for (let j = 0; j < nz - 1; j++) anillo.push(j * nx + nx - 1);
  for (let i = nx - 1; i > 0; i--) anillo.push((nz - 1) * nx + i);
  for (let j = nz - 1; j > 0; j--) anillo.push(j * nx);
  const ladoDe = (m) => (m < nx - 1 ? [0, 0, -1] : m < nx - 1 + nz - 1 ? [1, 0, 0] : m < 2 * (nx - 1) + nz - 1 ? [0, 0, 1] : [-1, 0, 0]);
  const base = [];
  for (let m = 0; m < anillo.length; m++) {
    const qa = anillo[m], qb = anillo[(m + 1) % anillo.length], n = ladoDe(m);
    const pa = [pos[qa * 3], pos[qa * 3 + 1], pos[qa * 3 + 2]], pb = [pos[qb * 3], pos[qb * 3 + 1], pos[qb * 3 + 2]];
    const ta = vert(pa, n, cCaja), tb = vert(pb, n, cCaja), ba = vert([pa[0], yB, pa[2]], n, cCaja), bb = vert([pb[0], yB, pb[2]], n, cCaja);
    tri(ta, tb, ba, n); tri(tb, bb, ba, n);
    base.push([pa[0], pa[2]]);
  }
  const b0 = pos.length / 3, abajo = [0, -1, 0];
  for (const [x, z] of base) vert([x, yB, z], abajo, cCaja);
  const centro = vert([(x0 + x1) / 2, yB, (z0 + z1) / 2], abajo, cCaja);
  for (let m = 0; m < base.length; m++) tri(centro, b0 + m, b0 + ((m + 1) % base.length), abajo);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute("humedad", new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3), 1));
  g.setAttribute("region", new THREE.Float32BufferAttribute(reg, 1));
  g.setIndex(idx);
  g.addGroup(0, iTop, 0); g.addGroup(iTop, idx.length - iTop, 1);
  return { geometria: g, grupos: { superficie: 0, caja: 1 }, nx, nz, paso: dx, caja: ter.caja, vertices: nTop };
}
