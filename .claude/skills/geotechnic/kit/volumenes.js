// Geotechnic · volúmenes gradacionales: zonas de alteración que se desvanecen, meteorización, agua, hielo y polvo.
// Regla central (references/reglas-roca.md): nada tiene borde nítido salvo una falla. El borde es una franja
// ruidosa de ancho `transicion`, y la intensidad decae hacia afuera.
import * as THREE from "three";
import { ruido3, fbm, suave, clamp, rgb, mezcla } from "./nucleo.js";

/**
 * Zona gradacional. tipo: "elipsoide" { centro, radios } | "plano" { punto, normal, espesor } | "capa" { y0, y1 }.
 * transicion: ancho (m) de la franja de borde. ruido: amplitud (m) con que el borde se ondula. Devuelve f(x,y,z) → 0..1.
 */
export function zona(op) {
  const { tipo = "elipsoide", transicion = 6, ruido = 4, escalaRuido = 0.04, semilla = 5, intensidad = 1 } = op;
  const n = ruido3(semilla);
  const borde = (x, y, z) => ruido * fbm(n, x * escalaRuido, y * escalaRuido, z * escalaRuido, 4);
  if (tipo === "elipsoide") {
    const [cx, cy, cz] = op.centro, [rx, ry, rz] = op.radios;
    const rm = (rx + ry + rz) / 3;
    return (x, y, z) => {
      const d = Math.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2) * rm; // distancia "en metros"
      return intensidad * (1 - suave(rm - transicion, rm + transicion * 0.5, d + borde(x, y, z)));
    };
  }
  if (tipo === "plano") {
    const [px, py, pz] = op.punto; const [nx, ny, nz] = op.normal; const e = op.espesor ?? 2;
    return (x, y, z) => {
      const d = Math.abs((x - px) * nx + (y - py) * ny + (z - pz) * nz) + borde(x, y, z) * 0.5;
      return intensidad * (1 - suave(e / 2, e / 2 + transicion, d));
    };
  }
  if (tipo === "capa") {
    return (x, y, z) => {
      const yy = y + borde(x, y, z);
      return intensidad * suave(op.y0 - transicion, op.y0, yy) * (1 - suave(op.y1, op.y1 + transicion, yy));
    };
  }
  throw new Error("zona: tipo desconocido " + tipo);
}

/**
 * Mezcla de color por capas: base (litología) y zonas ordenadas. Cada zona: { f: zona(...), paleta: ["#hex", "#hex"], peso }
 * El color final varía dentro de cada paleta con ruido, para que una zona no sea un color plano.
 */
export function colorRoca(base, zonas = [], semilla = 9) {
  const n = ruido3(semilla);
  const pal = (p) => p.map(rgb);
  const B = pal(base);
  const Z = zonas.map((z) => ({ ...z, P: pal(z.paleta) }));
  return (x, y, z) => {
    const v = 0.5 + 0.5 * n(x * 0.15, y * 0.15, z * 0.15);
    const k = Math.min(B.length - 1, Math.floor(v * B.length));
    let c = mezcla(B[k], B[(k + 1) % B.length], (v * B.length) % 1 * 0.5);
    for (const zz of Z) {
      const w = clamp(zz.f(x, y, z) * (zz.peso ?? 1));
      if (w <= 0.001) continue;
      const u = 0.5 + 0.5 * n(x * 0.3 + 40, y * 0.3, z * 0.3);
      c = mezcla(c, mezcla(zz.P[0], zz.P[1 % zz.P.length], u), w);
    }
    return c;
  };
}

/**
 * Agua en la roca. nivel: cota del nivel freático o de la línea de surgencia (m). Debajo, la roca está húmeda;
 * sobre la cara, el agua sale por las fracturas y baja por gravedad formando chorreras verticales.
 * Devuelve f(x, y, z, distTraza, pendiente) → humedad 0..1.
 */
export function agua(op = {}) {
  const { nivel = 0, transicion = 3, chorreras = 0.6, semilla = 21, largoChorrera = 8 } = op;
  const n = ruido3(semilla);
  return (x, y, z, distTraza = 9, pendiente = 1) => {
    let h = 1 - suave(nivel - transicion, nivel + transicion * 0.3, y + 1.5 * n(x * 0.08, y * 0.05, z * 0.08));
    // chorreras: ruido estirado en vertical, solo en caras empinadas y bajo surgencias (cerca de trazas)
    const s = 0.5 + 0.5 * n(x * 0.9, y * (0.9 / largoChorrera), z * 0.9);
    const bajoSurgencia = 1 - suave(nivel, nivel + largoChorrera, y);
    h = Math.max(h, chorreras * pendiente * bajoSurgencia * suave(0.62, 0.85, s) * (0.5 + 0.5 * (1 - suave(0, 0.6, distTraza))));
    return clamp(h);
  };
}

/** Hielo o escarcha: caras que miran arriba sobre una cota, y carámbanos bajo surgencias (si frio). */
export function hielo(op = {}) {
  const { cota = 4600, transicion = 60, semilla = 33 } = op;
  const n = ruido3(semilla);
  return (x, y, z, ny = 0) => clamp(suave(cota - transicion, cota, y) * suave(0.5, 0.85, ny) * (0.6 + 0.4 * n(x * 0.2, 0, z * 0.2)));
}

/**
 * Polvo en suspensión: partículas suaves que nacen en un emisor (broca, ruedas, voladura) y se dispersan con el viento.
 * Devuelve { puntos, emitir(pos, n), actualizar(dt) }. Color y tamaño por defecto medidos en fotos de perforación en tajo.
 */
export function polvo(op = {}) {
  const { max = 1500, color = "#cdbfa9", tam = 3, viento = [1.2, 0.25, 0.3], vida = 7, opacidad = 0.35 } = op;
  const pos = new Float32Array(max * 3), edad = new Float32Array(max).fill(1e9), vel = new Float32Array(max * 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("edad", new THREE.BufferAttribute(edad, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color(color) }, uTam: { value: tam }, uVida: { value: vida }, uOp: { value: opacidad }, uEscala: { value: 600 } },
    vertexShader: `attribute float edad; uniform float uTam, uVida, uEscala; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); float t = clamp(edad/uVida, 0., 1.);
        vA = (1.-t) * smoothstep(0., .08, t); gl_PointSize = uTam * (1. + 4.*t) * uEscala / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOp; varying float vA;
      void main(){ vec2 q = gl_PointCoord - .5; float a = smoothstep(.5, 0., length(q)); gl_FragColor = vec4(uColor, a * vA * uOp);
        #include <colorspace_fragment>
      }`,
  });
  const puntos = new THREE.Points(g, m);
  puntos.frustumCulled = false;
  let cursor = 0;
  return {
    puntos,
    emitir(p, cuantas = 4, dispersion = 0.6, subida = 0.8) {
      for (let i = 0; i < cuantas; i++) {
        const k = cursor++ % max;
        pos[k * 3] = p.x + (Math.random() - 0.5) * dispersion; pos[k * 3 + 1] = p.y + Math.random() * 0.3; pos[k * 3 + 2] = p.z + (Math.random() - 0.5) * dispersion;
        vel[k * 3] = (Math.random() - 0.5) * 1.2; vel[k * 3 + 1] = subida * (0.5 + Math.random()); vel[k * 3 + 2] = (Math.random() - 0.5) * 1.2;
        edad[k] = 0;
      }
    },
    actualizar(dt) {
      for (let k = 0; k < max; k++) {
        if (edad[k] > vida) continue;
        edad[k] += dt;
        vel[k * 3] += (viento[0] - vel[k * 3]) * dt * 0.4; vel[k * 3 + 1] += (viento[1] - vel[k * 3 + 1]) * dt * 0.3; vel[k * 3 + 2] += (viento[2] - vel[k * 3 + 2]) * dt * 0.4;
        pos[k * 3] += vel[k * 3] * dt; pos[k * 3 + 1] += vel[k * 3 + 1] * dt; pos[k * 3 + 2] += vel[k * 3 + 2] * dt;
      }
      g.attributes.position.needsUpdate = true; g.attributes.edad.needsUpdate = true;
    },
  };
}

/** Goteo: gotas que caen desde puntos del techo (labores) o de una surgencia. */
export function goteo(puntosOrigen, op = {}) {
  const { g = 9.8, color = "#cfe3ef" } = op;
  const n = puntosOrigen.length;
  const pos = new Float32Array(n * 3), t0 = new Float32Array(n).map(() => Math.random() * 2);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.05, transparent: true, opacity: 0.8 }));
  let t = 0;
  return {
    puntos: pts,
    actualizar(dt) {
      t += dt;
      puntosOrigen.forEach((o, i) => {
        const tt = (t + t0[i]) % (o.periodo ?? 1.6);
        const caida = Math.max(0, tt - 0.9);
        pos[i * 3] = o.x; pos[i * 3 + 2] = o.z;
        pos[i * 3 + 1] = Math.max(o.piso ?? -1e9, o.y - 0.5 * g * caida * caida);
      });
      geo.attributes.position.needsUpdate = true;
    },
  };
}
