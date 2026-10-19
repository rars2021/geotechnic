// Geotechnic · fracturas: familias de discontinuidades estocásticas (modelo DFN de discos) y sus efectos visibles:
//  - relieve en bloques: la cara se escalona donde la cortan los planos de cada familia;
//  - trazas: la intersección real de cada disco con la superficie dibujada (líneas oscuras, terminan donde termina el disco);
//  - halo de óxidos y humedad a lo largo de las trazas.
import * as THREE from "three";
import { azar, hash3, normalPlano, fisher } from "./nucleo.js";

/**
 * Familia: { nombre, buz, dirBuz (°), kappa (Fisher), espaciado (m, media exponencial), persistencia (m, radio medio del disco),
 *            desvPersistencia, apertura (m, para el ancho de traza), relieve (m, escalón de bloque) }
 * caja: { min:[x,y,z], max:[x,y,z] } volumen donde se siembran los discos.
 * Devuelve { familias, discos: [{ f, c:[x,y,z], n:[x,y,z], r }], planos } listo para relieve y trazas.
 */
export function crearDFN(familias, caja, semilla = 3) {
  const r = azar(semilla);
  const discos = [];
  const planos = [];
  const tam = caja.max.map((v, i) => v - caja.min[i]);
  const centro = caja.min.map((v, i) => v + tam[i] / 2);
  familias.forEach((f, fi) => {
    const n0 = normalPlano(f.buz, f.dirBuz);
    // planos de bloque: posiciones a lo largo de la normal media con espaciado exponencial (Priest y Hudson)
    const diag = Math.hypot(...tam);
    const pos = [];
    let d = -diag / 2 - r() * f.espaciado;
    while (d < diag / 2) { pos.push(d); d += Math.max(f.espaciado * 0.15, r.exponencial(f.espaciado)); }
    planos.push({ fi, n: n0, d0: n0[0] * centro[0] + n0[1] * centro[1] + n0[2] * centro[2], pos, relieve: f.relieve ?? 0.3, sem: r.entero(1, 1e6) });
    // discos: intensidad P32 ≈ 1/espaciado → número = volumen / (espaciado · área media de disco)
    const area = Math.PI * f.persistencia * f.persistencia;
    const nDiscos = Math.min(f.maxDiscos ?? 900, Math.round((tam[0] * tam[1] * tam[2]) / (f.espaciado * area)));
    for (let i = 0; i < nDiscos; i++) {
      const c = caja.min.map((v, k) => v + r() * tam[k]);
      discos.push({ f: fi, c, n: fisher(r, n0, f.kappa ?? 40), r: r.lognormal(f.persistencia, f.desvPersistencia ?? f.persistencia * 0.6) });
    }
  });
  return { familias, discos, planos, caja };
}

/** Índice de bloque y distancia al plano más cercano (por familia) para un punto. */
export function bloqueEn(dfn, x, y, z, ondula = null) {
  let h = 17, dmin = 1e9, fmin = -1;
  const t = [];
  for (const p of dfn.planos) {
    let s = p.n[0] * x + p.n[1] * y + p.n[2] * z - p.d0;
    if (ondula) s += ondula(x, y, z, p.fi);
    // búsqueda binaria en posiciones ordenadas
    let lo = 0, hi = p.pos.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (p.pos[m] <= s) lo = m; else hi = m - 1; }
    const a = p.pos[lo], b = p.pos[Math.min(lo + 1, p.pos.length - 1)];
    const dd = Math.min(Math.abs(s - a), Math.abs(b - s));
    if (dd < dmin) { dmin = dd; fmin = p.fi; }
    t.push((s - a), b - a); // posición dentro de la losa de esta familia y su espesor
    h = Math.imul(h ^ (lo + 7919 * p.fi), 2654435761) >>> 0;
  }
  return { id: h, dist: dmin, familia: fmin, t };
}

/**
 * Desplazamiento de relieve en bloques para un vértice: cada bloque entra un poco en la roca (sobre-excavación por juntas).
 * Devuelve metros (negativo = hacia adentro). amp multiplica el relieve de cada familia.
 */
export function relieveBloques(dfn, x, y, z, amp = 1, ondula = null) {
  const b = bloqueEn(dfn, x, y, z, ondula);
  const u = hash3(b.id & 0xffff, b.id >>> 16, 3);
  let rel = 0, tilt = 0;
  dfn.planos.forEach((p, k) => {
    rel += p.relieve;
    // faceta: cada bloque es un plano inclinado dentro de su losa (pendiente distinta por bloque y familia)
    const g = hash3(b.id & 0xffff, k, 11) * 2 - 1;
    const esp = Math.max(0.3, b.t[2 * k + 1]);
    tilt += g * p.relieve * ((b.t[2 * k] / esp) - 0.5) * 1.6;
  });
  rel /= dfn.planos.length;
  // sesgo hacia adentro: los bloques sueltos se caen, no sobresalen
  return { d: amp * (-rel * Math.pow(u, 1.3) + tilt / dfn.planos.length), dist: b.dist, familia: b.familia, id: b.id, tono: hash3(b.id >>> 8, 5, 2) };
}

/**
 * Trazas de los discos sobre una malla (BufferGeometry indexada). Devuelve por familia un array de segmentos [x,y,z,x,y,z,...]
 * y marca en `cercania` (Float32Array por vértice, opcional) la distancia a la traza más próxima (para halos y surcos).
 */
export function trazasSobreMalla(dfn, geom, op = {}) {
  const { celda = 4, desplazar = 0.04, minLargo = 0.3, maxNormalY = 0.72 } = op;
  const P = geom.attributes.position.array, N = geom.attributes.normal?.array, I = geom.index.array;
  // rejilla espacial de triángulos
  const grilla = new Map();
  const clave = (x, y, z) => `${Math.floor(x / celda)},${Math.floor(y / celda)},${Math.floor(z / celda)}`;
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3;
    const k = clave(P[a], P[a + 1], P[a + 2]);
    let l = grilla.get(k); if (!l) grilla.set(k, (l = [])); l.push(t);
  }
  const porFamilia = dfn.familias.map(() => []);
  const tocados = new Set();
  for (const d of dfn.discos) {
    const [cx, cy, cz] = d.c, [nx, ny, nz] = d.n, R = d.r;
    const segs = porFamilia[d.f];
    const i0 = Math.floor((cx - R) / celda), i1 = Math.floor((cx + R) / celda);
    const j0 = Math.floor((cy - R) / celda), j1 = Math.floor((cy + R) / celda);
    const k0 = Math.floor((cz - R) / celda), k1 = Math.floor((cz + R) / celda);
    tocados.clear();
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (let k = k0; k <= k1; k++) {
      const l = grilla.get(`${i},${j},${k}`); if (!l) continue;
      for (const t of l) {
        if (tocados.has(t)) continue; tocados.add(t);
        const v = [I[t] * 3, I[t + 1] * 3, I[t + 2] * 3];
        if (N && (N[v[0] + 1] + N[v[1] + 1] + N[v[2] + 1]) / 3 > maxNormalY) continue; // en bermas y pisos el polvo tapa las trazas
        const s = v.map((a) => (P[a] - cx) * nx + (P[a + 1] - cy) * ny + (P[a + 2] - cz) * nz);
        if ((s[0] > 0 && s[1] > 0 && s[2] > 0) || (s[0] < 0 && s[1] < 0 && s[2] < 0)) continue;
        const pts = [];
        for (let e = 0; e < 3; e++) {
          const a = v[e], b = v[(e + 1) % 3], sa = s[e], sb = s[(e + 1) % 3];
          if ((sa > 0) === (sb > 0)) continue;
          const u = sa / (sa - sb);
          const p = [P[a] + (P[b] - P[a]) * u, P[a + 1] + (P[b + 1] - P[a + 1]) * u, P[a + 2] + (P[b + 2] - P[a + 2]) * u];
          if (N) { const nn = [N[a] + (N[b] - N[a]) * u, N[a + 1] + (N[b + 1] - N[a + 1]) * u, N[a + 2] + (N[b + 2] - N[a + 2]) * u]; p[0] += nn[0] * desplazar; p[1] += nn[1] * desplazar; p[2] += nn[2] * desplazar; }
          pts.push(p);
        }
        if (pts.length < 2) continue;
        // recortar al disco
        const dentro = (p) => { const dx = p[0] - cx, dy = p[1] - cy, dz = p[2] - cz; return dx * dx + dy * dy + dz * dz <= R * R; };
        if (!dentro(pts[0]) && !dentro(pts[1])) continue;
        segs.push(...pts[0], ...pts[1]);
      }
    }
  }
  // quitar familias de segmentos sueltos muy cortos no hace falta: el ojo los lee como fisuras menores
  return porFamilia;
}

/** Dibuja las trazas como líneas (una por familia, para resaltarlas por separado). */
export function lineasTrazas(porFamilia, op = {}) {
  const { color = "#2b2723", opacidad = 0.38 } = op;
  const grupo = new THREE.Group();
  porFamilia.forEach((segs, fi) => {
    if (!segs.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(segs, 3));
    const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: opacidad, depthWrite: false });
    const l = new THREE.LineSegments(g, m);
    l.userData.familia = fi;
    l.renderOrder = 2;
    grupo.add(l);
  });
  return grupo;
}

/** Proyección estereográfica (hemisferio inferior, igual área) de los polos: para dibujar una red de Schmidt en SVG. */
export function polosSchmidt(dfn, radio = 100) {
  return dfn.discos.map((d) => {
    let [x, y, z] = d.n; // normal hacia arriba → polo = -normal (hemisferio inferior)
    const px = -x, py = -y, pz = -z;
    const este = px, norte = -pz, abajo = -py;
    const k = radio * Math.SQRT2 * Math.sin(Math.acos(Math.min(1, Math.max(-1, abajo))) / 2);
    const az = Math.atan2(este, norte);
    return { f: d.f, x: k * Math.sin(az), y: -k * Math.cos(az) };
  });
}

