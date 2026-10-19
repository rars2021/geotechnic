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

/**
 * Modulación de color de una cara de roca: tono por bloque (± amp/2) y oscurecido junto a la junta (35 %).
 * `calma` (macizo.calma, 0..1) baja las dos a la mitad con calma 1 (dibujo de estudio). Con calma 0 es la de v2.
 */
export function tonoCara(tono, dist, amp, calma = 0) {
  const f = 1 - 0.5 * calma;
  return (1 + (tono - 0.5) * amp * f) * (1 - 0.35 * f * (1 - suave(0.02, 0.08, dist)));
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
  const { seccion = seccionBaul(), largo = 30, paso = 0.12, sobreexcavacion = 0.25, semilla = 31,
    shotcrete = null, region = null, colorShot = rgb("#9c9a94"), inicio = 0, macizo = null,
    huellas = [{ z: 0.95, ancho: 0.35 }, { z: -0.95, ancho: 0.35 }] } = op;
  // motor B: si viene un macizo (kit/macizo.js), él da relieve, color y humedad; si no, los parámetros sueltos
  const dfn = macizo ? null : op.dfn ?? null;
  const color = op.color || macizo?.color || (() => rgb("#7d786f"));
  const humedad = op.humedad || macizo?.humedad || null;
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
        if (macizo) { const b = macizo.relieve(x, y0, z0, 1); d -= b.d * 0.9; dist = b.dist; tono = b.tono; }
        else if (dfn) { const b = relieveBloques(dfn, x, y0, z0, 1); d -= b.d * 0.9; dist = b.dist; tono = b.tono; }
        d += sobreexcavacion * (0.6 + 0.8 * (0.5 + 0.5 * fbm(n, x * 0.25, y0 * 0.25, z0 * 0.25, 4)));
        const avance = 3.6; const fase = ((x % avance) + avance) % avance / avance;
        d += 0.12 * Math.pow(1 - fase, 3); // escalón por disparo (el contorno se angosta al fondo de cada avance)
        if (enShot) { d = d * 0.35 + sobreexcavacion * 0.4 - (shotcrete.espesor ?? 0.05); d += 0.02 * n2(x * 3, y0 * 3, z0 * 3); }
        else d += 0.04 * fbm(n2, x * 2, y0 * 2, z0 * 2, 3);
      } else {
        // piso: huellas de llantas, barro y charcos
        // huellas: las ruedas del equipo (contrato A → B) marcan el piso en su trocha
        let huella = 0; for (const h of huellas) huella = Math.max(huella, 1 - Math.abs(z0 - h.z) / h.ancho);
        d = -0.06 * huella * (0.6 + 0.4 * n(x * 0.3, 0, z0)) + 0.05 * fbm(n2, x * 0.5, 0, z0 * 0.5, 3);
      }
      const px = x, py = y0 + ny * d, pz = z0 + nz * d;
      pos[k * 3] = px; pos[k * 3 + 1] = py; pos[k * 3 + 2] = pz;
      let c = enShot ? colorShot : color(px, py, pz);
      if (!enShot && !piso) { const k0 = tonoCara(tono, dist, 0.2, macizo?.calma ?? 0); c = [c[0] * k0, c[1] * k0, c[2] * k0]; }
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
  return { geometria: g, muestra, seccion, contorno: cont, nx, ns, largo, inicio, macizo };
}

/** Superficie del frente: x(y, z) con el relieve de voladura y los bloques del macizo (la usa frente() y el contrato). */
export function superficieFrente(galeriaObj, op = {}) {
  const { x = galeriaObj.inicio + galeriaObj.largo, taladros = [], semilla = 5 } = op;
  const macizo = op.macizo ?? galeriaObj.macizo ?? null, dfn = macizo ? null : op.dfn ?? null;
  const n = ruido3(semilla);
  return (y, z) => {
    // relieve de voladura ±0,2 m (bloques por juntas + ondulación), como en las fotos de frentes
    const amp = op.relieve ?? 1;
    let d = amp * 0.2 * fbm(n, y * 0.7, z * 0.7, 3, 5) + 0.12, tono = 0.5, dist = 9;
    if (macizo) { const b = macizo.relieve(x, y, z, 1); d -= b.d * 1.2 * amp; tono = b.tono; dist = b.dist; }
    else if (dfn) { const b = relieveBloques(dfn, x, y, z, 1); d -= b.d * 1.2 * amp; tono = b.tono; dist = b.dist; }
    // el frente es cóncavo: avanza más en el centro (arranque)
    d += 0.35 * Math.exp(-(z * z + (y - 1.6) ** 2) / 3);
    for (const t of taladros) { const r2 = (z - t.z) ** 2 + (y - t.y) ** 2; if (r2 < (t.d * 2.5) ** 2) d += 0.08 * (1 - Math.sqrt(r2) / (t.d * 2.5)); }
    return { x: x + d, tono, dist };
  };
}

/**
 * Frente: tapa del extremo de la galería con relieve de voladura (cráteres de los taladros del disparo anterior)
 * y, si se dan, los taladros nuevos como huecos oscuros. taladros: [{ z, y, d }] en m.
 */
export function frente(galeriaObj, op = {}) {
  const { x = galeriaObj.inicio + galeriaObj.largo, res = 70 } = op;
  const mac = op.macizo ?? galeriaObj.macizo ?? null;
  const color = op.color || mac?.color || (() => rgb("#7d786f"));
  const sup = superficieFrente(galeriaObj, op);
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
    const { x: xs, tono, dist } = sup(y, z);
    P[i] = xs;
    const c = color(P[i], y, z);
    const k0 = tonoCara(tono, dist, 0.25, mac?.calma ?? 0);
    C[i] = c[0] * k0; C[i + 1] = c[1] * k0; C[i + 2] = c[2] * k0;
  }
  g.setAttribute("color", new THREE.BufferAttribute(C, 3));
  g.computeVertexNormals();
  return g;
}

/**
 * Caja del bloque de roca alrededor de la labor (la usan macizoCerrado y terrenoGaleria({ caja }): la MISMA caja).
 * op: { lado (m más allá de cada hastial), arriba (sobre la clave), abajo (bajo el piso), fondo (detrás del frente;
 *       ≥ 4,5 m para que los taladros de 3,9 m queden en la roca), xFrente }
 * Devuelve { min: [x, y, z], max: [x, y, z], lado, arriba, abajo, fondo, xFrente }.
 */
export function cajaBloque(galeriaObj, op = {}) {
  const { lado = 2.5, arriba = 2.5, abajo = 1.2, fondo = 6 } = op;
  const xFrente = op.xFrente ?? galeriaObj.inicio + galeriaObj.largo;
  const { ancho, alto } = galeriaObj.seccion, zl = ancho / 2 + lado;
  return { min: [galeriaObj.inicio, -abajo, -zl], max: [xFrente + fondo, alto + arriba, zl], lado, arriba, abajo, fondo, xFrente };
}

/**
 * Macizo cerrado: UN sólido cerrado y orientado con la roca alrededor de la labor (references/estudio.md).
 *  - galería: los vértices y colores de galeria(), sin moverlos (la física del ciclo se aprobó contra ellos);
 *  - faldón: prolonga el último anillo en x hasta el frente (el contrato ya lo da por labor: fila(x) se queda en el
 *    último anillo); frente: superficieFrente (la misma del contrato) mallada dentro de la sección en anillos
 *    concéntricos, cosida al faldón; sin plano sobrante;
 *  - caja exterior (cajaBloque): hastiales, techo, base, cara trasera y cara de entrada con la boca abierta.
 * Las caras delanteras miran al aire. Grupos: 0 galería, 1 frente (faldón + frente), 2 caja (para un material por
 * parte: new THREE.Mesh(geometria, [matRoca, matFrente, matCaja])).
 * op: { frente: superficieFrente(...) (si no, se arma con op), caja (o lado, arriba, abajo, fondo), anillos,
 *       pasoCaja (m), regionFrente, color }
 * Devuelve { geometria, caja, frente (faldón + frente, para trazas de juntas), grupos, ajustados, xFrente }.
 */
export function macizoCerrado(galeriaObj, op = {}) {
  const gal = galeriaObj, G = gal.geometria, { nx, ns } = gal;
  const mac = op.macizo ?? gal.macizo ?? null, calma = mac?.calma ?? 0;
  const caja = op.caja ?? cajaBloque(gal, op);
  const xF = caja.xFrente ?? gal.inicio + gal.largo;
  const sup = op.frente ?? superficieFrente(gal, { ...op, x: xF });
  const color = op.color || mac?.color || (() => rgb("#7d786f"));
  const humedad = mac?.humedad ?? null, regionFrente = op.regionFrente ?? 0;
  const pos = [], nor = [], col = [], hum = [], reg = [], idx = [];
  const vert = (p, n, c, h = 0, r = 0) => { pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); col.push(c[0], c[1], c[2]); hum.push(h); reg.push(r); return hum.length - 1; };
  // triángulo con su cara delantera hacia `sx` en x (caras planas en (z, y): entrada −1, trasera +1)
  const triX = (a, b, c, sx) => {
    const ay = pos[a * 3 + 1], az = pos[a * 3 + 2];
    const cr = (pos[b * 3 + 1] - ay) * (pos[c * 3 + 2] - az) - (pos[b * 3 + 2] - az) * (pos[c * 3 + 1] - ay);
    if (cr * sx >= 0) idx.push(a, b, c); else idx.push(a, c, b);
  };
  const normalesDe = (base, n, I) => { // normales suavizadas de una parte (con sus propios vértices)
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos.slice(base * 3, (base + n) * 3)), 3));
    g.setIndex(I.map((i) => i - base)); g.computeVertexNormals();
    const N = g.attributes.normal.array; for (let i = 0; i < n * 3; i++) nor[base * 3 + i] = N[i];
  };
  const grupos = [];
  // ── 0 · galería: copia exacta de galeria()
  const P = G.attributes.position.array, Ng = G.attributes.normal.array, Cg = G.attributes.color.array;
  const Hg = G.attributes.humedad.array, Rg = G.attributes.region.array;
  for (let k = 0; k < nx * ns; k++) vert([P[k * 3], P[k * 3 + 1], P[k * 3 + 2]], [Ng[k * 3], Ng[k * 3 + 1], Ng[k * 3 + 2]], [Cg[k * 3], Cg[k * 3 + 1], Cg[k * 3 + 2]], Hg[k], Rg[k]);
  for (const i of G.index.array) idx.push(i);
  grupos.push({ inicio: 0, cuenta: idx.length, material: 0 });
  // ── 1 · faldón y frente
  const i0 = idx.length, L = (nx - 1) * ns;
  const muestra = (y, z) => { // punto del frente con su color y humedad
    const s = sup(y, z), x = s.x, c = color(x, y, z), k0 = tonoCara(s.tono, s.dist, 0.25, calma);
    return { p: [x, y, z], c: [c[0] * k0, c[1] * k0, c[2] * k0], h: humedad ? humedad(x, y, z, false, s.dist) : 0 };
  };
  let ajustados = 0;
  const lejos = [];
  for (let j = 0; j < ns; j++) {
    const k = L + j, m = muestra(P[k * 3 + 1], P[k * 3 + 2]);
    if (m.p[0] < P[k * 3] + 0.01) { m.p[0] = P[k * 3] + 0.01; ajustados++; } // el frente no entra en el tubo
    lejos.push(m);
  }
  const fal = hum.length;
  for (let j = 0; j < ns; j++) { const k = L + j; vert([P[k * 3], P[k * 3 + 1], P[k * 3 + 2]], [0, 0, 0], [Cg[k * 3], Cg[k * 3 + 1], Cg[k * 3 + 2]], Hg[k], Rg[k]); }
  for (const m of lejos) vert(m.p, [0, 0, 0], m.c, m.h, regionFrente);
  const If = [];
  for (let j = 0; j < ns - 1; j++) { const a = fal + j, b = a + 1, c = a + ns, e = c + 1; If.push(a, b, c, b, e, c); } // como el tubo: hacia la labor
  normalesDe(fal, 2 * ns, If);
  for (let j = 0; j < ns; j++) for (let q = 0; q < 3; q++) nor[(fal + j) * 3 + q] = Ng[(L + j) * 3 + q]; // sin quiebre con el tubo
  idx.push(...If);
  // frente: anillos concéntricos del contorno del último anillo hacia un centro (la sección es estrellada desde él)
  const cz = 0, cy = gal.seccion.alto / 2;
  const radio = Math.max(...lejos.map((m) => Math.hypot(m.p[2] - cz, m.p[1] - cy)));
  const nr = op.anillos ?? Math.max(4, Math.ceil(radio / ((gal.largo / (nx - 1)) * 1.1)));
  const fr0 = hum.length;
  for (const m of lejos) vert(m.p, [0, 0, 0], m.c, m.h, regionFrente);
  for (let r = 1; r < nr; r++) {
    const s = 1 - r / nr;
    for (let j = 0; j < ns; j++) { const m = muestra(cy + (lejos[j].p[1] - cy) * s, cz + (lejos[j].p[2] - cz) * s); vert(m.p, [0, 0, 0], m.c, m.h, regionFrente); }
  }
  const mc = muestra(cy, cz), centro = vert(mc.p, [0, 0, 0], mc.c, mc.h, regionFrente);
  const Ir = [];
  for (let r = 0; r < nr - 1; r++) for (let j = 0; j < ns - 1; j++) {
    const a = fr0 + r * ns + j, b = a + 1, c = a + ns, e = c + 1;
    Ir.push(a, b, e, a, e, c); // contorno antihorario en (z, y): cara hacia −x (la labor)
  }
  for (let j = 0; j < ns - 1; j++) { const a = fr0 + (nr - 1) * ns + j; Ir.push(a, a + 1, centro); }
  normalesDe(fr0, nr * ns + 1, Ir);
  idx.push(...Ir);
  grupos.push({ inicio: i0, cuenta: idx.length - i0, material: 1 });
  // ── 2 · caja exterior: rectángulo (z, y) antihorario desde el centro de la base, igual que el contorno
  const i2 = idx.length, [x0, y0, z0] = caja.min, [x1, y1, z1] = caja.max, pc = op.pasoCaja ?? 0.5;
  const tramo = (a, b) => { const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / pc)), o = []; for (let k = 0; k <= n; k++) o.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]); return o; };
  const lados = [ // [puntos (z, y), normal hacia afuera]
    [tramo([0, y0], [z1, y0]), [0, -1, 0]], [tramo([z1, y0], [z1, y1]), [0, 0, 1]], [tramo([z1, y1], [z0, y1]), [0, 1, 0]],
    [tramo([z0, y1], [z0, y0]), [0, 0, -1]], [tramo([z0, y0], [0, y0]), [0, -1, 0]],
  ];
  const nX = Math.max(2, Math.ceil((x1 - x0) / 1.5) + 1);
  for (const [pts, n] of lados) {
    const b0 = hum.length, m = pts.length;
    for (let i = 0; i < nX; i++) { const x = x0 + ((x1 - x0) * i) / (nX - 1); for (const [z, y] of pts) vert([x, y, z], n, color(x, y, z)); }
    for (let i = 0; i < nX - 1; i++) for (let j = 0; j < m - 1; j++) { const a = b0 + i * m + j, b = a + 1, c = a + m, e = c + 1; idx.push(a, c, b, b, c, e); } // hacia afuera
  }
  const borde = []; // rectángulo cerrado (último = primero), sin repetir esquinas
  lados.forEach(([pts], k) => pts.forEach((q, j) => { if (j > 0 || k === 0) borde.push(q); }));
  // cara trasera (x1): abanico desde el centro, hacia +x
  const bt = hum.length;
  for (const [z, y] of borde) vert([x1, y, z], [1, 0, 0], color(x1, y, z));
  const ct = vert([x1, cy, cz], [1, 0, 0], color(x1, cy, cz));
  for (let k = 0; k < borde.length - 1; k++) triX(ct, bt + k, bt + k + 1, 1);
  // cara de entrada (x0): anillo entre el rectángulo y la boca (anillo 0 del tubo), cosido por ángulo desde el centro
  const be = hum.length;
  for (const [z, y] of borde) vert([x0, y, z], [-1, 0, 0], color(x0, y, z));
  const bi = hum.length;
  for (let j = 0; j < ns; j++) vert([P[j * 3], P[j * 3 + 1], P[j * 3 + 2]], [-1, 0, 0], color(P[j * 3], P[j * 3 + 1], P[j * 3 + 2]));
  const ang = (y, z, ultimo) => { if (ultimo) return 2 * Math.PI; let a = Math.atan2(y - cy, z - cz) + Math.PI / 2; if (a < -1e-9) a += 2 * Math.PI; return Math.max(0, a); };
  const tA = [], tB = [];
  for (let j = 0; j < ns; j++) tA.push(ang(P[j * 3 + 1], P[j * 3 + 2], j === ns - 1));
  for (let k = 0; k < borde.length; k++) tB.push(ang(borde[k][1], borde[k][0], k === borde.length - 1));
  for (const t of [tA, tB]) for (let k = 1; k < t.length; k++) if (t[k] < t[k - 1]) throw new Error("macizoCerrado: la boca no es estrellada desde el centro de la sección");
  for (let i = 0, k = 0; i < ns - 1 || k < borde.length - 1;) {
    if (k === borde.length - 1 || (i < ns - 1 && tA[i + 1] <= tB[k + 1])) { triX(bi + i, bi + i + 1, be + k, -1); i++; }
    else { triX(bi + i, be + k + 1, be + k, -1); k++; }
  }
  grupos.push({ inicio: i2, cuenta: idx.length - i2, material: 2 });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(col), 3));
  g.setAttribute("humedad", new THREE.BufferAttribute(new Float32Array(hum), 1));
  g.setAttribute("region", new THREE.BufferAttribute(new Float32Array(reg), 1));
  g.setIndex(idx);
  for (const q of grupos) g.addGroup(q.inicio, q.cuenta, q.material);
  // faldón + frente como malla aparte (para trazasSobreMalla y para pintar sobre el frente)
  const gf = new THREE.BufferGeometry(), nF = fr0 + nr * ns + 1 - fal;
  for (const [nom, k] of [["position", 3], ["normal", 3], ["color", 3], ["humedad", 1], ["region", 1]]) gf.setAttribute(nom, new THREE.BufferAttribute(g.attributes[nom].array.slice(fal * k, (fal + nF) * k), k));
  gf.setIndex(idx.slice(i0, i2).map((i) => i - fal));
  return { geometria: g, caja, frente: gf, grupos: { galeria: 0, frente: 1, caja: 2 }, ajustados, xFrente: xF };
}

/**
 * Pernos con placa (y tuerca) sobre el contorno: malla de `espaciado` m entre x0 y x1, desde `desdeY` hacia la corona.
 * Estudio: acero de la paleta (`color`, token "acero") y `desgaste` bajo (0,15): óxido apagado, no manchas saturadas.
 */
export function pernos(galeriaObj, op = {}) {
  const { x0 = galeriaObj.inicio + 1, x1 = galeriaObj.inicio + galeriaObj.largo - 2, espaciado = 1.5, desdeY = 1.4, placa = 0.2, semilla = 7,
    color = "acero", desgaste = 0.15 } = op;
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
  const mat = materialPintura(color, { metal: 0.6, rugosidad: 0.55, suciedad: 0.6, desgaste });
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

/** Manga de ventilación colgada de la corona (tela amarilla con anillos), de x0 a x1. Cerrada: tapas en los extremos. */
export function mangaVentilacion(op = {}) {
  const { x0 = 0, x1 = 25, y = 3.55, z = -1.0, diametro = 0.9, color = "#d9a22b" } = op;
  const L = x1 - x0;
  // con tapas: la deformación es función de la posición, así el borde de cada tapa coincide con el del tubo
  const g = new THREE.CylinderGeometry(diametro / 2, diametro / 2, L, 28, Math.ceil(L * 2), false);
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

/**
 * Charcos: láminas de agua sobre el piso. Estudio: un reflejo húmedo (gris oscuro cálido, semitransparente, brillante),
 * no un hueco negro. Son calcos (userData.calco): planos pegados al piso, exentos de «malla cerrada».
 */
export function charcos(galeriaObj, op = {}) {
  const { cantidad = 6, semilla = 9, x0 = galeriaObj.inicio, x1 = galeriaObj.inicio + galeriaObj.largo - 3, color = "#4a4640", opacidad = 0.5 } = op;
  const r = azar(semilla);
  const g = new THREE.Group();
  const calco = "charco: lámina de agua sobre el piso";
  g.userData.calco = calco;
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.06, metalness: 0.1, transparent: true, opacity: opacidad, depthWrite: false });
  for (let k = 0; k < cantidad; k++) {
    const forma = new THREE.Shape();
    const R = r.entre(0.4, 1.4), nn = 12;
    for (let i = 0; i <= nn; i++) { const a = (i / nn) * Math.PI * 2, rr = R * r.entre(0.6, 1.1); const px = Math.cos(a) * rr * 1.6, pz = Math.sin(a) * rr * 0.6; i ? forma.lineTo(px, pz) : forma.moveTo(px, pz); }
    const m = new THREE.Mesh(new THREE.ShapeGeometry(forma), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(r.entre(x0, x1), 0.012, r.elegir([-0.95, 0.95, 0]) + r.entre(-0.2, 0.2));
    m.receiveShadow = true; m.userData.calco = calco;
    g.add(m);
  }
  return g;
}
