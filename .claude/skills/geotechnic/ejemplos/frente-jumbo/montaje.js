// Ejemplo frente-jumbo · montaje (puro): macizo, galería con frente, malla real, jumbo y ciclo de perforación.
// Lo usan la escena (página) y el juez (Node).
import { macizo } from "../../kit/macizo.js";
import { seccionBaul, galeria, superficieFrente } from "../../kit/labor.js";
import { terrenoGaleria, emboquillesMalla, huellasDe, asentar } from "../../kit/contrato.js";
import { MALLAS, ordenPerforacion } from "../../kit/procesos.js";
import { modeloJumbo, apuntarJumbo } from "../../equipos/jumbo/modelo.js";
import { VA, TA } from "../../motorA/modelo.js";
import { clamp, lerp } from "../../kit/nucleo.js";

export function montajeJumbo(op = {}) {
  const malla = MALLAS.casapalca4x4;
  const XF = 0, X0 = -26;
  const M = modeloJumbo();
  const mac = macizo({
    familias: [
      { nombre: "F1", buz: 71, dirBuz: 242, kappa: 40, espaciado: 0.8, persistencia: 2.4, relieve: 0.2, jrc: 10, maxDiscos: 600 },
      { nombre: "F2", buz: 40, dirBuz: 43, kappa: 35, espaciado: 1.0, persistencia: 2.6, relieve: 0.18, jrc: 8, maxDiscos: 500 },
      { nombre: "F3", buz: 65, dirBuz: 157, kappa: 35, espaciado: 1.2, persistencia: 2.0, relieve: 0.16, jrc: 12, maxDiscos: 400 },
    ],
    caja: { min: [X0 - 2, -2, -5], max: [XF + 6, 7, 5] }, semilla: 21,
    ruido: { amplitud: 0.06, longitud: 2.5, octavas: 3 }, aspereza: { amplitud: 0.03, longitud: 0.5 },
    litologia: ["#7f7a71", "#726d65", "#8b857b"], agua: { base: 0.05, juntas: 0.35, piso: 0.6 },
    fuentes: { familias: "Eulogio Huamán (2024), Retamas (MARSA) · el catálogo de fuentes hdl:20.500.14076/27684 (usadas como ejemplo)" },
  });
  const gal = galeria({
    seccion: seccionBaul(malla.seccion.ancho, malla.seccion.alto), largo: XF - X0, inicio: X0, paso: 0.11, sobreexcavacion: 0.2, macizo: mac,
    huellas: huellasDe(M), shotcrete: { desde: X0 - 1, hasta: -9, espesor: 0.05 }, region: (x, tipo, enShot) => (enShot ? 3 : 2),
  });
  const supFrente = superficieFrente(gal, { x: XF, macizo: mac });
  // arrastres a 0,20 m: con la perforadora (Ø ≈ 0,24 m) bajo la viga no caben más abajo; la figura los da a 0,10–0,12 m
  // leídos con ±0,1 m (Zanabria Mejía 2021, fig. 5), así que 0,20 m queda dentro de esa lectura
  const mallaUsada = { ...malla, taladros: malla.taladros.map((t) => (t.grupo === "arrastre" ? { ...t, y: 0.2 } : t)) };
  const taladros = emboquillesMalla(mallaUsada, supFrente);
  const ter = terrenoGaleria(gal, { frente: supFrente });
  // posición del jumbo: la máquina se estaciona en el eje, a la distancia que deja todos los taladros al alcance
  const xMaq = op.xMaquina ?? XF - 11.0;
  const base = asentar(M, {}, ter, { x: xMaq, z: 0, rumbo: 0 });
  // gatas: bajan hasta el piso (contrato B → A: cota del piso bajo cada pie)
  const gatas = {};
  for (const n of ["del i", "del d", "tras i", "tras d"]) {
    const pie = M.porNombre.get(`pie gata ${n}`), c = pie.casco.reduce((a, q) => VA.add(a, q), [0, 0, 0]).map((v) => v / pie.casco.length);
    const ps = M.posar({ _pose: base, _sinMangueras: true });
    const w = ps.mundo("base", c), piso = ter.piso(w[0], w[2]);
    gatas[`gata ${n}`] = clamp(w[1] - 0.03 - piso, 0, M.grupos.get(`gata ${n}`).desliza.rango[1]);
  }
  // emboquille en coordenadas de la máquina, con la boca del centralizador fuera de la roca (separación por el relieve)
  const Tinv = TA.inv(M.posar({ _pose: base, _sinMangueras: true }).raiz); // mundo → máquina (asentada: cabeceo y alabeo reales)
  const inv = (p) => TA.ap(Tinv, p), invDir = (d) => TA.dir(Tinv, d);
  // separación de la boca: el frente es rugoso; el centralizador y la punta de la viga (abajo con rotación 0, arriba con
  // 180°) quedan fuera de la roca, y la broca recorre esa separación antes de empatar
  const sep = (t) => {
    let g = 0.012;
    const sg = t.y < 1.0 ? -1 : 1;
    for (const [dy, dz] of [[0.09, 0.085], [0.09, -0.085], [-0.15, 0.085], [-0.15, -0.085], [0, 0], [-0.3, 0.08], [-0.3, -0.08]]) g = Math.max(g, t.collar[0] - supFrente(t.collar[1] + sg * dy, t.collar[2] + dz).x + 0.015);
    return g;
  };
  // taladros bajos (y < 1 m): la viga bajo la muñeca, girada por afuera; así el brazo sube y la muñeca no pasa su tope
  const rolloDe = (t, l) => (t.y < 1.0 ? (l === "i" ? 180 : -180) : 0);
  const [izq, der] = ordenPerforacion({ taladros }, 2);
  const listas = { i: der, d: izq }; // cada brazo trabaja su propio lado (i a la izquierda, z > 0): no se cruzan
  const objetivo = new Map();
  for (const l of ["i", "d"]) for (const t of listas[l]) {
    const g = sep(t), d = invDir(t.dir), C = VA.sub(inv(t.collar), VA.mul(d, g));
    const r = apuntarJumbo(M, l, C, d, { rollo: rolloDe(t, l), otros: gatas });
    objetivo.set(`${l}:${t.id}`, { ...r, sep: g, t });
  }
  // reposo de trabajo: viga alta y retirada, en el centro de su mitad; ahí se gira la viga (la rotación barre 0,95 m
  // por afuera: junto al hastial pegaría en la roca)
  const reposo = {}, reposoGiro = {};
  for (const l of ["i", "d"]) {
    const C = inv([XF - 1.4, 2.4, l === "i" ? 0.75 : -0.75]);
    reposo[l] = apuntarJumbo(M, l, C, invDir([1, 0, 0]), { otros: gatas }).valores;
    reposoGiro[l] = { ...reposo[l], [`rollo ${l}`]: l === "i" ? 180 : -180 };
  }
  const rolloDeV = (l, v) => v[`rollo ${l}`] ?? 0;
  const T_MOVER = 1.4, T_PERF = 2.6, T_SACAR = 0.8, porTal = T_MOVER + T_PERF + T_SACAR;
  // programador por turnos: dos brazos no perforan a la vez taladros cuyas muñecas (o sus trayectos) quedan a menos de
  // 1,25 m; en ese turno espera el brazo cuyo taladro está más al centro (así lo hace el sistema anticolisión del jumbo)
  const muneca = (l, v) => M.posar({ ...gatas, ...v, _sinMangueras: true }).local(`exte ${l}`, M.dims.geo[l].W0);
  const valoresDe = (l, h) => (h ? objetivo.get(`${l}:${h.id}`).valores : reposo[l]);
  const mezclar = (a, b, u) => { const m = {}; for (const k in b) m[k] = lerp(a[k] ?? 0, b[k], u); return m; };
  const turnos = { i: [], d: [] }, pend = { i: [...listas.i], d: [...listas.d] }, ult = { i: null, d: null };
  while (pend.i.length || pend.d.length) {
    const cand = { i: pend.i[0] || null, d: pend.d[0] || null }, usa = { i: !!cand.i, d: !!cand.d };
    if (cand.i || cand.d) {
      // trayectos muestreados a la par (el movimiento interpola las articulaciones de los dos brazos al mismo tiempo)
      let dmin = Infinity;
      for (const u of [0.25, 0.5, 0.75, 1]) {
        const vi = mezclar(valoresDe("i", ult.i), valoresDe("i", cand.i), u), vd = mezclar(valoresDe("d", ult.d), valoresDe("d", cand.d), u);
        dmin = Math.min(dmin, VA.dist(muneca("i", vi), muneca("d", vd)));
      }
      if (dmin < 1.25) { if (cand.i && cand.d) { if (Math.abs(cand.i.z) <= Math.abs(cand.d.z)) usa.i = false; else usa.d = false; } }
    }
    for (const l of ["i", "d"]) { if (usa[l]) { const h = pend[l].shift(); turnos[l].push(h); ult[l] = h; } else turnos[l].push(null); }
  }
  const T = turnos.i.length * porTal + 1.5;
  /** Estado del ciclo en t: valores de los dos brazos, gatas, profundidad perforada de cada taladro, cavidades. */
  function estado(tt) {
    tt = clamp(tt, 0, T);
    const valores = { ...gatas, _pose: base }, hecho = new Map(), cavidades = [], activos = [];
    const k = Math.floor(tt / porTal), f = tt - k * porTal;
    for (const l of ["i", "d"]) {
      const tl = turnos[l];
      for (let j = 0; j < Math.min(k, tl.length); j++) if (tl[j]) hecho.set(tl[j].id, 1);
      const act = tl[k] || null;
      let previo = null; for (let j = Math.min(k, tl.length) - 1; j >= 0; j--) if (tl[j]) { previo = tl[j]; break; }
      const termino = !tl.slice(k).some(Boolean);
      let v;
      if (!act && termino && previo) { // terminó su mitad: vuelve a reposo (deja libre el centro al otro brazo)
        const ini = tl.findLastIndex(Boolean) + 1, u = clamp((tt - ini * porTal) / T_MOVER), sm = u * u * (3 - 2 * u);
        const a0 = valoresDe(l, previo), b0 = reposo[l]; v = {}; for (const key in b0) v[key] = lerp(a0[key] ?? 0, b0[key], sm);
        v[`viga ${l}`] = Math.max(0, v[`viga ${l}`] - 0.6 * Math.sin(Math.PI * u)); v[`perf ${l}`] = 0;
      } else if (!act) v = { ...valoresDe(l, previo), [`perf ${l}`]: 0 }; // espera con la perforadora atrás
      else {
        const o = objetivo.get(`${l}:${act.id}`), prev = valoresDe(l, previo);
        if (f < T_MOVER) { // de un taladro al otro: interpola las articulaciones y la viga retrocede a mitad de camino
          const u = f / T_MOVER;
          if (Math.abs(rolloDeV(l, prev) - rolloDeV(l, o.valores)) > 1) {
            // cambio de rotación: va a reposo, gira allí y sigue al taladro
            const rA = Math.abs(rolloDeV(l, prev)) > 90 ? reposoGiro[l] : reposo[l], rB = Math.abs(rolloDeV(l, o.valores)) > 90 ? reposoGiro[l] : reposo[l];
            const tramo = (a0, b0, w) => { const sm = w * w * (3 - 2 * w), r = {}; for (const key in b0) r[key] = lerp(a0[key] ?? 0, b0[key], sm); return r; };
            v = u < 0.35 ? tramo(prev, rA, u / 0.35) : u < 0.65 ? tramo(rA, rB, (u - 0.35) / 0.3) : tramo(rB, o.valores, (u - 0.65) / 0.35);
          } else {
            const sm = u * u * (3 - 2 * u);
            v = {}; for (const key in o.valores) v[key] = lerp(prev[key] ?? 0, o.valores[key], sm);
            v[`viga ${l}`] = Math.max(0, v[`viga ${l}`] - 0.6 * Math.sin(Math.PI * u));
          }
          v[`perf ${l}`] = 0;
        } else if (f < T_MOVER + T_PERF) {
          const a = ((f - T_MOVER) / T_PERF) * (malla.largo + o.sep);
          v = { ...o.valores, [`perf ${l}`]: a };
          hecho.set(act.id, clamp((a - o.sep) / malla.largo));
          activos.push({ l, id: act.id });
        } else {
          const u = (f - T_MOVER - T_PERF) / T_SACAR;
          v = { ...o.valores, [`perf ${l}`]: (malla.largo + o.sep) * (1 - u) };
          hecho.set(act.id, 1);
        }
      }
      Object.assign(valores, v);
    }
    // cavidades en el mundo: la broca corta su hueco desde el primer contacto con el frente rugoso, que puede quedar
    // antes del collar teórico; por eso empiezan donde arranca la broca (collar − sep) y miden lo que ya avanzó
    for (const t of taladros) {
      const h = hecho.get(t.id) || 0, act = activos.find((x) => x.id === t.id);
      const g = (objetivo.get(`i:${t.id}`) || objetivo.get(`d:${t.id}`)).sep;
      const largo = act ? valores[`perf ${act.l}`] : h > 0 ? g + h * malla.largo : 0;
      if (largo > 0) cavidades.push({ a: VA.sub(t.collar, VA.mul(t.dir, g)), d: t.dir, largo: largo + 0.02, r: t.diam / 2 });
    }
    return { valores, hecho, cavidades, activos };
  }
  return { M, mac, gal, ter, supFrente, malla, taladros, listas, turnos, objetivo, estado, T, XF, X0, base, gatas, inv, porTal, T_MOVER, T_PERF, T_SACAR };
}

/** Lo que juzga el juez: el ciclo de perforación de los dos brazos y el rango de movimiento del modelo. */
export function pruebasJumbo(paso = 0.2) {
  const m = montajeJumbo();
  const ciclo = [];
  for (let t = 0; t <= m.T; t += paso) {
    const e = m.estado(t);
    ciclo.push({ etiqueta: `ciclo t=${t.toFixed(1)} s`, valores: e.valores, cavidades: e.cavidades });
  }
  const errores = [...m.objetivo.values()].map((o) => o.error);
  return { montaje: m, M: m.M, terreno: m.ter, ciclo, rango: m.M.muestrasRango.map((v, i) => ({ etiqueta: `rango ${i}`, valores: v })), extra: { ikMax: Math.max(...errores) } };
}

/** Nombre común que busca el juez. */
export const pruebas = pruebasJumbo;
