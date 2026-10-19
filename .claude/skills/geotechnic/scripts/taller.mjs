#!/usr/bin/env node
// Geotechnic · taller: banco de prueba visual de UN equipo del motor A, sin roca. Para el agente de cada equipo.
//
//   node scripts/taller.mjs <equipo> [--salida dir]  → <salida>/taller-<equipo>.html (con doctype, para drive.mjs)
//
// En la página: window.TALLER.poner({ grupo: valor, … }), .cascos(true) (lo que audita el juez, en rojo),
// .lamina(true) (aristas en tinta, como Anatomy), .mirar(az, el, dist, [x, y, z]).
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { kitCodigo, IMPORTMAP, IMPORTS_THREE, RAIZ } from "./codigo.mjs";

const args = process.argv.slice(2);
const eq = args.find((a) => !a.startsWith("--"));
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
if (!eq) { console.error("uso: node scripts/taller.mjs <equipo> [--salida dir]"); process.exit(1); }
const salida = resolve(opt("salida", join(RAIZ, "dist")));
mkdirSync(salida, { recursive: true });
const REG = `EQUIPO_${eq.toUpperCase().replace(/-/g, "_")}`;
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Taller · ${eq}</title><style>html,body{margin:0;height:100%;background:#cfd3d6}#lienzo{position:fixed;inset:0}</style>
${IMPORTMAP}</head><body><div id="lienzo"></div>
<script type="module">
${IMPORTS_THREE}
${kitCodigo([eq])}
const cont = document.getElementById("lienzo");
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
cont.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color("#cfd3d6");
const cam = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.05, 200);
const ctl = new OrbitControls(cam, renderer.domElement);
scene.add(new THREE.HemisphereLight("#f2f4f6", "#6d675f", 1.6));
const sol = new THREE.DirectionalLight("#fff3e0", 2.4); sol.position.set(-6, 12, 8); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048);
Object.assign(sol.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 }); scene.add(sol);
const piso = new THREE.Mesh(new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#b9b4ab", roughness: 0.95 }));
piso.receiveShadow = true; scene.add(piso);
const reg = new THREE.GridHelper(40, 40, "#8a857c", "#a29d94"); reg.position.y = 0.002; scene.add(reg);
const M = ${REG}.modelo();
const dib = mallasMaquina(M, ${REG}.dibujo || {});
scene.add(dib.raiz);
function render() { ctl.update(); renderer.render(scene, cam); }
renderer.setAnimationLoop(render);
const mirar = (az = 220, el = 18, dist = 14, obj = [0, 1.2, 0]) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; ctl.target.set(...obj); cam.position.set(obj[0] + Math.sin(a) * Math.cos(e) * dist, obj[1] + Math.sin(e) * dist, obj[2] - Math.cos(a) * Math.cos(e) * dist); ctl.update(); };
mirar();
window.TALLER = { M, dib, poner: (v) => { const p = dib.poner(v); render(); return Object.fromEntries(Object.entries(p.valores).filter(([k]) => !k.startsWith("_"))); }, cascos: (on) => { dib.cascos(on); render(); }, lamina: (on) => { dib.lamina(on); render(); }, mirar: (...a) => { mirar(...a); render(); }, listo: true };
</script></body></html>`;
const f = join(salida, `taller-${eq}.html`);
writeFileSync(f, html);
console.log(f);
