// Geotechnic · estudio: paleta papel (tokens claro / oscuro), tapas de corte y corte de cámara.
// Ver references/estudio.md. `planoCorte` es pura (arrays [x, y, z], sin three): la usa el juez en Node.
// Los nombres de nivel superior son únicos en todo el kit (las páginas concatenan los módulos).
import * as THREE from "three";

/** Tokens de color (§7 de Anatomy: todo color es un token con valor claro y oscuro). */
export const PALETA = {
  claro: {
    pintura: "#c4ad7c", pinturaB: "#a86f60", acero: "#6f6c66", goma: "#3a3835", manguera: "#2e2d2a", gris: "#8f8c85",
    negro: "#4a4844", aluminio: "#aeaba4", vidrio: "#4b5357", laton: "#9c8a63", barro: "#8a7e6c",
    tapa: "#efe5cf", tinta: "#2a2622", acento: "#c2382c", luz: "#fff4dc", luzRoja: "#ff5a3c",
    ambiente: "#474747", fondo: "#d9d4cb",
    // codificación del tema: orden (de salida) por luminancia creciente, S ≤ 0,45; malla de frente: cargado / vacío
    codigo: ["#4d365d", "#7e4d49", "#567094", "#9c765b", "#589888", "#d77d9b", "#99ab63", "#bdad6e"],
    cargado: "#8c5b51", vacio: "#627b9e",
    // papel de cada unidad en la lámina geológica (S bajo; el patrón FGDC va encima en tinta)
    papelCaliza: "#dcd8cb", papelDolomia: "#d6d2c6", papelArenisca: "#e3d6b8", papelLutita: "#cfcdc6",
    papelConglomerado: "#ddd2bf", papelBrecha: "#d8cbbb", papelIntrusivo: "#e0d2cc", papelVolcanica: "#d6cdc4",
    papelPorfido: "#dccbc4", papelMetamorfica: "#cdd1c9", papelMena: "#cdbba9",
  },
  oscuro: {
    pintura: "#b39d6e", pinturaB: "#9a6558", acero: "#66635e", goma: "#34322f", manguera: "#2a2927", gris: "#85827b",
    negro: "#43413d", aluminio: "#a19e97", vidrio: "#454c50", laton: "#8f7f5b", barro: "#7d7262",
    tapa: "#48423a", tinta: "#d9d2c6", acento: "#ec6a5c", luz: "#fff4dc", luzRoja: "#ff5a3c",
    ambiente: "#474747", fondo: "#262321",
    codigo: ["#6b4d80", "#9f655f", "#6c8bb5", "#bd9171", "#6eb7a4", "#fe98ba", "#b7cc7a", "#e0ce87"],
    cargado: "#c78577", vacio: "#86a5d1",
    papelCaliza: "#3d3b35", papelDolomia: "#3a3833", papelArenisca: "#423b2e", papelLutita: "#383733",
    papelConglomerado: "#3f392f", papelBrecha: "#3d362e", papelIntrusivo: "#403733", papelVolcanica: "#3a3530",
    papelPorfido: "#3f3632", papelMetamorfica: "#363a35", papelMena: "#40362d",
  },
};

/** «claro» u «oscuro»: en la página lee data-theme y prefers-color-scheme; en Node, «claro». */
export function temaActual() {
  if (typeof document === "undefined") return "claro";
  const t = document.documentElement?.dataset?.theme;
  if (t === "dark" || t === "oscuro") return "oscuro";
  if (t === "light" || t === "claro") return "claro";
  return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
}

/** Valor hex de un token en el tema pedido (o el actual). Un hex (o un color que no es texto) pasa tal cual. */
export function tono(token, tema = temaActual()) {
  if (typeof token !== "string" || token[0] === "#") return token;
  const v = (PALETA[tema] || PALETA.claro)[token];
  if (!v) throw new Error(`estudio: token desconocido «${token}»`);
  return v;
}

/** Hex → [r, g, b] en 0..1, sin pasar a lineal (para escribir en el espacio de salida). */
export function hexRGB(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Mezcla un color hacia su propio gris (f = 0,5: la mitad de saturación). Para la base de la roca. */
export function apagarColor(hex, f = 0.5) {
  const [r, g, b] = hexRGB(hex), y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const c = (x) => Math.round(255 * (x + (y - x) * f)).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}

// uniforme compartido de la tapa: un cambio de tema llega a todos los materiales tapados
const U_TAPA = { value: new THREE.Vector3(...hexRGB(tono("tapa"))) };
const U_TINTA = { value: new THREE.Vector3(...hexRGB(tono("tinta"))) };

/**
 * Tapa de corte: doble cara, y la cara trasera (!gl_FrontFacing) se pinta plana con el token `tapa` al final del
 * fragmento (espacio de salida: el color del token sale tal cual). En un sólido cerrado la cara trasera solo se ve
 * donde un plano lo corta (plano cercano o corte de cámara): el corte se lee como sección llena, no como interior vacío.
 * Encadena con el onBeforeCompile previo. Un material transparente no se tapa (sus caras traseras se verían a través);
 * si se vuelve transparente después, al recompilar deja de pintar la tapa (mejor: sinTapa).
 */
export function tapar(material, op = {}) {
  if (!material || material.userData.tapa) return material;
  if (material.transparent || material.side === THREE.BackSide) return material;
  const previo = material.onBeforeCompile;
  const clave = Object.prototype.hasOwnProperty.call(material, "customProgramCacheKey") ? material.customProgramCacheKey : null;
  const textoPrevio = previo.toString();
  material.userData.tapa = { previo, clave, side: material.side, shadowSide: material.shadowSide };
  material.side = THREE.DoubleSide;
  // sombra con las caras que miran lejos de la luz (como un material de una cara): sin acné
  material.shadowSide = op.shadowSide ?? THREE.BackSide;
  material.onBeforeCompile = function (sh, r) {
    previo.call(this, sh, r);
    // transparente al compilar (rayos X puesto sin sinTapa): no se pinta la tapa
    if (this.transparent || !sh.fragmentShader.includes("#include <dithering_fragment>")) return;
    sh.uniforms.uTapa = U_TAPA;
    sh.fragmentShader = "uniform vec3 uTapa;\n" + sh.fragmentShader.replace("#include <dithering_fragment>",
      "#include <dithering_fragment>\n\tif (!gl_FrontFacing) gl_FragColor = vec4(uTapa, 1.);");
  };
  material.customProgramCacheKey = function () { return (clave ? clave.call(this) : textoPrevio) + (this.transparent ? "|tapa-t" : "|tapa"); };
  material.needsUpdate = true;
  return material;
}

/** Deshace `tapar` (vista de rayos X: el frente transparente no debe pintar sus caras traseras). */
export function sinTapa(material) {
  const t = material?.userData.tapa;
  if (!t) return material;
  material.onBeforeCompile = t.previo;
  if (t.clave) material.customProgramCacheKey = t.clave; else delete material.customProgramCacheKey;
  material.side = t.side; material.shadowSide = t.shadowSide;
  delete material.userData.tapa;
  material.needsUpdate = true;
  return material;
}

/**
 * Cambia de tema los materiales de una raíz (los que llevan userData.token) y la tapa de todos.
 * Para llamar al cambiar data-theme; sin raíz solo cambia la tapa.
 */
export function retintar(raiz, tema = temaActual()) {
  U_TAPA.value.set(...hexRGB(tono("tapa", tema)));
  U_TINTA.value.set(...hexRGB(tono("tinta", tema)));
  for (const m of MATS_UNIDAD.values()) m.uniforms.uPapel.value.set(...hexRGB(tono(m.userData.papel, tema)));
  if (raiz?.isScene && raiz.userData.tokenFondo && raiz.background?.isColor) raiz.background.set(tono("fondo", tema));
  raiz?.traverse?.((o) => {
    for (const m of [].concat(o.material || [])) {
      if (m.userData.token) m.color.set(tono(m.userData.token, tema));
      if (m.userData.tokenTinta) m.color.set(tono("tinta", tema));
    }
  });
}

/**
 * Quita los triángulos degenerados (dos vértices en la misma posición, p. ej. el polo de un torno), así cada arista
 * la comparten exactamente dos triángulos tras soldar por posición. No mueve ningún vértice.
 */
export function sinDegenerados(g, eps = 1e-5) {
  const P = g.attributes.position, n = P.count;
  const ix = g.index ? Array.from(g.index.array) : Array.from({ length: n }, (_, i) => i);
  const k = (i) => `${Math.round(P.getX(i) / eps)},${Math.round(P.getY(i) / eps)},${Math.round(P.getZ(i) / eps)}`;
  const id = new Map(), soldado = new Int32Array(n);
  for (let i = 0; i < n; i++) { const c = k(i); if (!id.has(c)) id.set(c, id.size); soldado[i] = id.get(c); }
  const fuera = [];
  for (let t = 0; t + 2 < ix.length; t += 3) {
    const a = soldado[ix[t]], b = soldado[ix[t + 1]], c = soldado[ix[t + 2]];
    if (a !== b && b !== c && a !== c) fuera.push(ix[t], ix[t + 1], ix[t + 2]);
  }
  if (fuera.length !== ix.length) { g.setIndex(fuera); g.clearGroups(); }
  return g;
}

/**
 * Plano de corte de cámara (puro, arrays [x, y, z]). Regla v3: se corta TODA la roca entre la cámara y el `objetivo`
 * (lo que mira: controls.target), venga la cámara de dentro de la roca o del aire exterior del bloque.
 *  - Si el segmento [cam, objetivo] no toca roca (libre ≥ 0 en todo, muestreado cada `paso`) → null.
 *  - Si la toca: s* = el último paso de roca a aire antes del objetivo (refinado por bisección); el plano va en
 *    s* + margen, perpendicular a la mirada. Entre s* y el objetivo todo es aire, así que el margen se recorta a la mitad
 *    de ese tramo para que el objetivo quede siempre más allá del plano.
 *  - Objetivo dentro de la roca (p. ej. un taladro del frente): s* = el último paso de roca a aire antes del último aire
 *    que precede al objetivo; queda el cuerpo de roca que lo contiene. Sin aire antes: plano a `margen` antes del objetivo.
 *  - Sin `objetivo` (compatibilidad v2): primer tramo de aire continuo [s, s + margen + 0,05] sobre la mirada si la cámara
 *    está en roca, null si está en aire; si no sale a aire en `max`, plano a `max`. (Con el punto a `max` como objetivo,
 *    una cámara en la galería que mira por el túnel cortaría en la cara lejana del bloque: todo quedaría recortado.)
 * Devuelve { punto, normal (mirada unitaria: se conserva lo de más allá), distancia (a lo largo de la mirada) }.
 */
export function planoCorte(terreno, camPos, camDir, op = {}) {
  const { margen = 0.35, paso = 0.05, max = 40, objetivo = null } = op;
  const L0 = Math.hypot(camDir[0], camDir[1], camDir[2]) || 1, d = [camDir[0] / L0, camDir[1] / L0, camDir[2] / L0];
  const plano = (q) => ({ punto: q, normal: d, distancia: d[0] * (q[0] - camPos[0]) + d[1] * (q[1] - camPos[1]) + d[2] * (q[2] - camPos[2]) });
  if (!objetivo) return planoCorteV2(terreno, camPos, d, margen, paso, max, plano);
  const v = [objetivo[0] - camPos[0], objetivo[1] - camPos[1], objetivo[2] - camPos[2]], L = Math.hypot(v[0], v[1], v[2]);
  if (L < 1e-6) return null;
  const e = [v[0] / L, v[1] / L, v[2] / L], en = (s) => [camPos[0] + e[0] * s, camPos[1] + e[1] * s, camPos[2] + e[2] * s];
  const aire = (s) => terreno.libre(en(s)) >= 0;
  const n = Math.max(1, Math.ceil(L / paso)), S = (i) => Math.min(L, i * paso), A = [];
  for (let i = 0; i <= n; i++) A.push(aire(S(i)));
  if (A.every(Boolean)) return null;
  let fin = n; // último índice del tramo que importa: el objetivo, o el último aire antes de él si está en roca
  if (!A[n]) { fin = -1; for (let i = n; i >= 0; i--) if (A[i]) { fin = i; break; } }
  if (fin < 0) return plano(en(Math.max(0, L - margen))); // cámara y objetivo en la misma roca
  let r = -1; // último índice en roca antes de `fin`
  for (let i = fin; i >= 0; i--) if (!A[i]) { r = i; break; }
  if (r < 0) return null; // el tramo útil es todo aire (solo había roca alrededor del objetivo)
  let a = S(r), b = S(r + 1);
  for (let k = 0; k < 24 && b - a > 1e-4; k++) { const m = (a + b) / 2; if (aire(m)) b = m; else a = m; }
  const m = Math.min(margen, Math.max(0, (S(fin) - b) / 2));
  return plano(en(b + m));
}

/** Regla v2 (sin objetivo): primer tramo de aire continuo sobre la mirada, con la cámara en roca. */
function planoCorteV2(terreno, camPos, d, margen, paso, max, plano) {
  if (terreno.libre(camPos) >= 0) return null;
  const en = (s) => [camPos[0] + d[0] * s, camPos[1] + d[1] * s, camPos[2] + d[2] * s];
  const aire = (s) => terreno.libre(en(s)) >= 0;
  const fino = Math.min(paso, 0.01), largo = margen + 0.05;
  const roca = (s) => { for (let t = s; t <= s + largo + 1e-9; t += fino) if (!aire(t)) return t; return -1; };
  let a = 0, b = -1;
  for (let s = paso; s <= max + 1e-9; s += paso) {
    if (!aire(s)) { a = s; continue; }
    const r = roca(s);
    if (r < 0) { b = s; break; }
    a = r; s = r; // bolsillo: sigue desde la roca que lo cierra
  }
  if (b < 0) return plano(en(max));
  for (let k = 0; k < 24 && b - a > 1e-4; k++) { const m = (a + b) / 2; if (aire(m)) b = m; else a = m; }
  return plano(en(b + margen));
}

/**
 * Corte de cámara: antes de cada render calcula `planoCorte` con la cámara de `esc` y su objetivo
 * (`esc.controls.target`: se corta toda la roca entre la cámara y lo que mira) y lo pone en
 * renderer.clippingPlanes. Convive con planos locales (material.clippingPlanes): localClippingEnabled = true.
 * Envuelve esc.renderizar, así no depende del orden de alAnimar. Sin corte, el plano queda aparcado detrás de la
 * cámara (no recorta nada) para no recompilar los programas al entrar y salir de la roca.
 * `fijar(plano)` pone un plano fijo (corte lateral, etc.) con la misma tapa y contorno; `fijar(null)` vuelve al de cámara.
 *
 * Tapa en el plano (capping por stencil, en una máscara fuera de pantalla): con el plano activo, por cada grupo (tapa
 * lisa: equipos y roca sin unidad; luego cada unidad de la lámina) se cuentan en el stencil de la máscara las caras
 * traseras (+1) y delanteras (−1) de sus sólidos (capa CAPA_TAPA o CAPA_UNIDAD, sin calcos), recortadas por el mismo
 * plano y sin prueba de profundidad. Donde la cuenta no es 0 el punto del plano está dentro de un sólido: la máscara
 * guarda el id del grupo (el último gana: una zona dentro del macizo). En pantalla, un cuadro sobre el plano pinta la
 * tapa (lisa o con su patrón) donde la máscara tiene su id, con prueba de profundidad: queda encima de todo lo que está
 * más allá del plano (pernos, trazas, tubos, lámina). Al final, un pase de pantalla dibuja en tinta el borde de la
 * máscara (Anatomy §5: «a clip cut is an edge»): el contorno de la sección y los contactos entre unidades.
 * La tapa de cara trasera de `tapar` sigue para el plano cercano.
 *
 * Lámina geológica (op.lamina: true, o .lamina(on); apagada por defecto): cada malla (o grupo padre) con
 * `userData.unidad = { fgdc: "627" | "caliza" | …, papel?: token | hex, orden?: n, celda?: m, opacidad?: 0.35 }` lleva
 * en su tapa el patrón FGDC en tinta sobre su papel (PATRONES_FGDC). Unidades con más `orden` quedan encima (una zona
 * dentro del macizo). Sin unidad (equipos), la tapa sigue lisa.
 * op: { margen, paso, max } de planoCorte; op.objetivo: () => Vector3 si no es controls.target; op.tapa: false sin
 * capping; op.lamina; op.celda (m, fija la escala del patrón); op.borde: false sin contorno; op.anchoBorde (px de
 * búsqueda, ≈ medio ancho de la línea); op.opacidadBorde (0,8).
 * Devuelve { activo(), plano(), apagar(), encender(), fijar(p), fijo(), lamina(on), borde(on), unidades(), actualizar() }.
 */
export const CAPA_TAPA = 31;
const CAPA_UNIDAD = 30;

/**
 * Lámina geológica: patrones FGDC (convención de corte; gh:davenquinn/geologic-patterns, CC0; códigos de
 * investigacion/representacion-visual.md C3). Clave = código FGDC o nombre; valor = [patrón del shader, papel].
 * La metamórfica (ondas) no tiene código verificado: se pide por nombre.
 */
export const PATRONES_FGDC = {
  627: [1, "papelCaliza"], caliza: [1, "papelCaliza"], // ladrillos
  642: [2, "papelDolomia"], dolomia: [2, "papelDolomia"], // ladrillos sesgados
  607: [3, "papelArenisca"], arenisca: [3, "papelArenisca"], // puntos
  620: [4, "papelLutita"], lutita: [4, "papelLutita"], // guiones
  721: [5, "papelIntrusivo"], intrusivo: [5, "papelIntrusivo"], // cruces
  711: [6, "papelVolcanica"], toba: [6, "papelVolcanica"], volcanica: [6, "papelVolcanica"], // V
  metamorfica: [7, "papelMetamorfica"], ondas: [7, "papelMetamorfica"], // ondas
  605: [8, "papelBrecha"], brecha: [8, "papelBrecha"], relleno: [8, "papelBrecha"], // triángulos
  601: [9, "papelConglomerado"], conglomerado: [9, "papelConglomerado"], morrena: [9, "papelConglomerado"], // círculos
  733: [10, "papelMena"], mena: [10, "papelMena"], oxidos: [10, "papelMena"], // rombos llenos
  729: [11, "papelPorfido"], 730: [11, "papelPorfido"], porfido: [11, "papelPorfido"], // listones
};

const GLSL_LAMINA = `
uniform vec3 uPapel, uTinta, uU, uV; uniform float uCelda, uOpac; uniform int uPatron; varying vec3 vPosL;
uniform sampler2D uMasc; uniform vec2 uTam; uniform float uId;
float hL(vec2 i){ return fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453); }
float trazo(float d, float w, float f){ return 1. - smoothstep(w - f, w + f, abs(d)); }
float segL(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0., 1.)); }
float patronL(vec2 c){
  vec2 fw = fwidth(c); float f = max(fw.x, fw.y) * 0.8 + 1e-4, w = 0.035;
  float fila = floor(c.y), par = mod(fila, 2.);
  vec2 g = fract(c), i = floor(c);
  if (uPatron == 1 || uPatron == 2) { // ladrillos (627) y sesgados (642): celda 2 × 1
    float x = c.x * 0.5 + 0.5 * par + (uPatron == 2 ? (g.y - 0.5) * 0.3 : 0.);
    float dx = min(fract(x), 1. - fract(x)) * 2., dy = min(g.y, 1. - g.y);
    return max(trazo(dy, w, f), trazo(dx, w, f));
  }
  if (uPatron == 3) { vec2 q = g - (0.25 + 0.5 * vec2(hL(i), hL(i + 7.1))); return trazo(length(q), 0.07, f); } // puntos (607)
  if (uPatron == 4) { float x = fract(c.x * 0.5 + 0.5 * par); return trazo(g.y - 0.5, w, f) * (1. - smoothstep(0.55 - f, 0.55 + f, x)); } // guiones (620)
  vec2 q = vec2(fract(c.x + 0.5 * par), g.y) - 0.5;
  if (uPatron == 5) return max(trazo(q.x, w, f) * step(abs(q.y), 0.17), trazo(q.y, w, f) * step(abs(q.x), 0.17)); // cruces (721)
  if (uPatron == 6) return trazo(min(segL(q, vec2(-0.15, 0.12), vec2(0., -0.12)), segL(q, vec2(0.15, 0.12), vec2(0., -0.12))), w, f); // V (711)
  if (uPatron == 7) { float t = (c.y + 0.15 * sin(c.x * 3.14159)) * 2.; return trazo((t - floor(t + 0.5)) * 0.5, w, f); } // ondas
  vec2 ic = floor(vec2(c.x + 0.5 * par, c.y)); float a = hL(ic) * 6.2832; mat2 R = mat2(cos(a), sin(a), -sin(a), cos(a));
  vec2 r = R * q;
  if (uPatron == 8) { vec2 A = vec2(0., 0.2), B = vec2(-0.18, -0.12), C = vec2(0.18, -0.12); // triángulos (605)
    return trazo(min(min(segL(r, A, B), segL(r, B, C)), segL(r, C, A)), w, f); }
  if (uPatron == 9) return trazo(length(q) - 0.2 - 0.06 * hL(ic), w, f); // círculos (601)
  if (uPatron == 10) return 1. - smoothstep(0.16 - f, 0.16 + f, abs(q.x) + abs(q.y)); // rombos llenos (733)
  if (uPatron == 11) return trazo(segL(r, vec2(-0.18, 0.), vec2(0.18, 0.)), 0.06, f); // listones (729/730)
  return 0.;
}
void main(){
  if (abs(texture2D(uMasc, gl_FragCoord.xy / uTam).r * 255. - uId) > 0.5) discard;
  vec2 c = vec2(dot(vPosL, uU), dot(vPosL, uV)) / uCelda;
  gl_FragColor = vec4(mix(uPapel, uTinta, clamp(patronL(c), 0., 1.) * uOpac), 1.);
}`;

const MATS_UNIDAD = new Map();
/** Material de tapa de una unidad: papel propio y patrón FGDC en tinta (≈ 0,35). */
function matUnidad(u) {
  const [pat, papel0] = PATRONES_FGDC[String(u.fgdc ?? u.patron ?? "").toLowerCase()] || [0, "tapa"];
  const papel = u.papel || papel0, clave = pat + "|" + papel + "|" + (u.opacidad ?? 0.35);
  let m = MATS_UNIDAD.get(clave);
  if (m) return m;
  m = new THREE.ShaderMaterial({
    uniforms: { uPapel: { value: new THREE.Vector3(...hexRGB(tono(papel))) }, uTinta: U_TINTA, uU: { value: new THREE.Vector3(1, 0, 0) },
      uV: { value: new THREE.Vector3(0, 1, 0) }, uCelda: { value: 0.5 }, uOpac: { value: u.opacidad ?? 0.35 }, uPatron: { value: pat },
      uMasc: { value: null }, uTam: { value: new THREE.Vector2(1, 1) }, uId: { value: 0 } },
    side: THREE.DoubleSide, depthTest: true, depthWrite: true,
    vertexShader: "varying vec3 vPosL; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vPosL = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
    fragmentShader: GLSL_LAMINA,
  });
  m.userData.papel = papel;
  MATS_UNIDAD.set(clave, m);
  return m;
}

export function corteCamara(esc, terreno, op = {}) {
  const { renderer, camera, scene } = esc;
  renderer.localClippingEnabled = true;
  const plano = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0), pos = new THREE.Vector3(), dir = new THREE.Vector3();
  const objetivo = () => (op.objetivo ? op.objetivo() : esc.controls?.target) || null;
  let activo = false, encendido = true, ultimo = "", fijo = null;
  renderer.clippingPlanes = [plano];
  function actualizar() {
    if (!encendido) return;
    camera.updateMatrixWorld();
    camera.getWorldPosition(pos); camera.getWorldDirection(dir);
    if (fijo) { plano.copy(fijo); activo = true; return; }
    const obj = objetivo(), o = obj ? [obj.x, obj.y, obj.z] : null;
    const clave = pos.toArray().concat(dir.toArray(), o || []).map((x) => x.toFixed(4)).join();
    if (clave === ultimo) return;
    ultimo = clave;
    const r = planoCorte(terreno, pos.toArray(), dir.toArray(), { ...op, objetivo: o });
    activo = !!r;
    plano.normal.copy(dir);
    if (r) { plano.normal.set(r.normal[0], r.normal[1], r.normal[2]); plano.constant = -(r.normal[0] * r.punto[0] + r.normal[1] * r.punto[1] + r.normal[2] * r.punto[2]); }
    else plano.constant = -plano.normal.dot(pos) + 1e3; // aparcado 1 km detrás de la cámara
  }
  // máscara fuera de pantalla: stencil para contar, rojo = id del grupo (1 = tapa lisa, 2… = unidades)
  const masc = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true, stencilBuffer: true, minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter, generateMipmaps: false });
  const tam = new THREE.Vector2(), U_MASC = { value: masc.texture }, U_TAM = { value: new THREE.Vector2(1, 1) };
  const cuenta = (lado, opSt) => new THREE.MeshBasicMaterial({ side: lado, colorWrite: false, depthWrite: false, depthTest: false,
    stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: opSt, stencilZFail: opSt, stencilFail: opSt });
  const atras = cuenta(THREE.BackSide, THREE.IncrementWrapStencilOp), delante = cuenta(THREE.FrontSide, THREE.DecrementWrapStencilOp);
  const VERT = "void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }";
  const DENTRO = "uniform sampler2D uMasc; uniform vec2 uTam; uniform float uId; bool fueraMasc(){ return abs(texture2D(uMasc, gl_FragCoord.xy / uTam).r * 255. - uId) > 0.5; }";
  const matId = new THREE.ShaderMaterial({ uniforms: { uId: { value: 0 } }, side: THREE.DoubleSide, depthTest: false, depthWrite: false,
    stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc, stencilZPass: THREE.ZeroStencilOp, vertexShader: VERT,
    fragmentShader: "uniform float uId; void main(){ gl_FragColor = vec4(uId / 255., 0., 0., 1.); }" });
  const matTapa = new THREE.ShaderMaterial({ uniforms: { uTapa: U_TAPA, uMasc: U_MASC, uTam: U_TAM, uId: { value: 1 } }, side: THREE.DoubleSide,
    depthTest: true, depthWrite: true, vertexShader: VERT,
    fragmentShader: "uniform vec3 uTapa; " + DENTRO + " void main(){ if (fueraMasc()) discard; gl_FragColor = vec4(uTapa, 1.); }" });
  const cuadro = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), matTapa), escenaTapa = new THREE.Scene();
  cuadro.frustumCulled = false; cuadro.layers.enableAll(); escenaTapa.add(cuadro); // se pinta con la cámara en cualquier capa
  // contorno: pase de pantalla que marca en tinta donde cambia el id de la máscara
  const matBorde = new THREE.ShaderMaterial({ uniforms: { uMasc: U_MASC, uTam: U_TAM, uTinta: U_TINTA, uAncho: { value: 1 }, uOpac: { value: op.opacidadBorde ?? 0.8 } },
    transparent: true, depthTest: false, depthWrite: false,
    vertexShader: "void main(){ gl_Position = vec4(position.xy, 0., 1.); }",
    fragmentShader: `uniform sampler2D uMasc; uniform vec2 uTam; uniform vec3 uTinta; uniform float uAncho, uOpac;
      float idEn(vec2 o){ return floor(texture2D(uMasc, (gl_FragCoord.xy + o) / uTam).r * 255. + 0.5); }
      void main(){ float c = idEn(vec2(0.)), b = 0.;
        for (int k = 0; k < 8; k++) { float a = float(k) * 0.7853982; if (idEn(vec2(cos(a), sin(a)) * uAncho) != c) b = 1.; }
        if (b < 0.5) discard; gl_FragColor = vec4(uTinta, uOpac); }` });
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), matBorde), escenaBorde = new THREE.Scene();
  pantalla.frustumCulled = false; pantalla.layers.enableAll(); escenaBorde.add(pantalla);
  const calco = (o) => { for (let x = o; x; x = x.parent) if (x.userData?.calco) return true; return false; };
  const unidadDe = (o) => { for (let x = o; x; x = x.parent) if (x.userData?.unidad) return x.userData.unidad; return null; };
  let lamina = !!op.lamina, nUnidades = 0, borde = op.borde !== false;
  /** Marca la capa de la tapa lisa; con lámina, junta las mallas de cada unidad (en orden: la última queda encima). */
  function marcarCapa() {
    const unidades = new Map();
    scene.traverse((o) => {
      if (!o.isMesh) return;
      o.layers.disable(CAPA_UNIDAD);
      const t = [].concat(o.material || []).some((m) => m.userData?.tapa) && !calco(o), u = t && lamina ? unidadDe(o) : null;
      if (t && !u) o.layers.enable(CAPA_TAPA); else o.layers.disable(CAPA_TAPA);
      if (u) { if (!unidades.has(u)) unidades.set(u, []); unidades.get(u).push(o); }
    });
    return [...unidades].sort((a, b) => (a[0].orden ?? 0) - (b[0].orden ?? 0)).slice(0, 250);
  }
  const ejeU = new THREE.Vector3(), ejeV = new THREE.Vector3(), arriba = new THREE.Vector3(), color0 = new THREE.Color();
  function taparCorte() {
    if (op.tapa === false || !activo || !encendido) return;
    const unidades = marcarCapa();
    nUnidades = unidades.length;
    renderer.getDrawingBufferSize(tam);
    if (masc.width !== tam.x || masc.height !== tam.y) masc.setSize(tam.x, tam.y);
    U_TAM.value.copy(tam);
    const auto = renderer.autoClear, capas = camera.layers.mask, fondo = scene.background, niebla = scene.fog, sobre = scene.overrideMaterial;
    const sombras = renderer.shadowMap.autoUpdate, planos = renderer.clippingPlanes, a0 = renderer.getClearAlpha();
    renderer.getClearColor(color0);
    renderer.shadowMap.autoUpdate = false; // las sombras ya están
    renderer.autoClear = false; scene.background = null; scene.fog = null;
    // cuadro sobre el plano: centrado en la proyección de la cámara, 1 mm del lado recortado, grande
    const d = plano.distanceToPoint(pos);
    cuadro.position.copy(pos).addScaledVector(plano.normal, -d - 1e-3);
    cuadro.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), plano.normal);
    const lado = 1e3 + 50 * Math.abs(d);
    cuadro.scale.set(lado, lado, 1); cuadro.updateMatrixWorld();
    // ejes del patrón: V = vertical del mundo proyectada (capas horizontales), U = V × normal;
    // celda en m: potencia de 2 cercana a 5 % de la distancia al plano (fija en pantalla, sin deslizarse con el zoom fino)
    arriba.set(0, 1, 0); if (Math.abs(plano.normal.y) > 0.95) arriba.set(0, 0, -1);
    ejeV.copy(arriba).addScaledVector(plano.normal, -arriba.dot(plano.normal)).normalize();
    ejeU.crossVectors(ejeV, plano.normal).normalize();
    const celda = op.celda || Math.max(0.05, 2 ** Math.round(Math.log2(Math.max(0.5, Math.abs(d)) * 0.05)));
    // 1) máscara: por grupo, contar en el stencil y escribir su id
    renderer.setRenderTarget(masc); renderer.setClearColor(0x000000, 1); renderer.clear(true, true, true);
    const grupos = [[null, null]].concat(unidades);
    grupos.forEach(([u, mallas], k) => {
      camera.layers.set(u ? CAPA_UNIDAD : CAPA_TAPA);
      if (u) for (const o of mallas) o.layers.enable(CAPA_UNIDAD);
      renderer.clearStencil();
      scene.overrideMaterial = atras; renderer.render(scene, camera);
      scene.overrideMaterial = delante; renderer.render(scene, camera);
      if (u) for (const o of mallas) o.layers.disable(CAPA_UNIDAD);
      scene.overrideMaterial = sobre; renderer.clippingPlanes = [];
      matId.uniforms.uId.value = k + 1; cuadro.material = matId; renderer.render(escenaTapa, camera);
      renderer.clippingPlanes = planos;
    });
    // 2) pantalla: la tapa de cada grupo donde la máscara tiene su id (con profundidad)
    renderer.setRenderTarget(null); renderer.setClearColor(color0, a0);
    renderer.clippingPlanes = [];
    grupos.forEach(([u], k) => {
      let m = matTapa;
      if (u) {
        m = matUnidad(u);
        m.uniforms.uU.value.copy(ejeU); m.uniforms.uV.value.copy(ejeV); m.uniforms.uCelda.value = u.celda || celda;
        m.uniforms.uMasc.value = masc.texture; m.uniforms.uTam.value.copy(tam);
      }
      m.uniforms.uId.value = k + 1; cuadro.material = m; renderer.render(escenaTapa, camera);
    });
    // 3) contorno en tinta
    if (borde) { matBorde.uniforms.uAncho.value = op.anchoBorde ?? Math.max(1, renderer.getPixelRatio() * 0.75); renderer.render(escenaBorde, camera); }
    renderer.clippingPlanes = planos;
    scene.background = fondo; scene.fog = niebla; camera.layers.mask = capas;
    renderer.autoClear = auto; renderer.shadowMap.autoUpdate = sombras;
  }
  const previo = esc.renderizar;
  esc.renderizar = function (...a) { actualizar(); const r = previo.apply(this, a); taparCorte(); return r; };
  return {
    activo: () => encendido && activo,
    plano: () => (encendido && activo ? plano : null),
    apagar() { encendido = false; activo = false; renderer.clippingPlanes = []; esc.marcar?.(); },
    encender() { encendido = true; ultimo = ""; renderer.clippingPlanes = [plano]; esc.marcar?.(); },
    /**
     * Plano fijo (THREE.Plane o { punto, normal }; la normal apunta a lo que se conserva) con la misma tapa, lámina y
     * contorno; el corte de cámara queda en pausa. `fijar(null)` vuelve al corte de cámara.
     */
    fijar(p) {
      if (!p) fijo = null;
      else if (p.isPlane) fijo = p.clone();
      else fijo = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(...[].concat(p.normal.toArray ? p.normal.toArray() : p.normal)).normalize(),
        new THREE.Vector3(...[].concat(p.punto.toArray ? p.punto.toArray() : p.punto)));
      ultimo = ""; activo = !!fijo; esc.marcar?.();
    },
    fijo: () => fijo,
    /** Lámina geológica: la tapa de cada unidad (userData.unidad = { fgdc, papel, orden, celda }) lleva su patrón. */
    lamina(on) { lamina = !!on; esc.marcar?.(); },
    /** Contorno en tinta del corte (encendido por defecto). */
    borde(on) { borde = !!on; esc.marcar?.(); },
    /** Unidades con patrón pintadas en el último cuadro (para verificar). */
    unidades: () => nUnidades,
    actualizar,
  };
}
