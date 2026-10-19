// Geotechnic · escena: renderer, cielo, sol, cámara, controles y bucle de animación.
// three.js (WebGL) porque el realismo pide luz, sombra y volumen irregular. Ver references/motor.md.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/** Color del cielo andino (zenit, horizonte) y de la bruma, medidos sobre fotos (references/reglas-luz.md). */
export const CIELOS = {
  andino: { zenit: "#2f64b5", horizonte: "#c9d6e6", bruma: "#c7cfd8", sol: "#fff3e0", intensidad: 3.6, cielo: 0.55 },
  nublado: { zenit: "#7c8796", horizonte: "#d7dbe0", bruma: "#cfd3d8", sol: "#f4f1ea", intensidad: 1.6, cielo: 1.25 },
  desierto: { zenit: "#3f6fb8", horizonte: "#dfe3e6", bruma: "#d9d6cf", sol: "#fff1dc", intensidad: 3.4, cielo: 0.8 },
};

function domoCielo(c, radio) {
  const g = new THREE.SphereGeometry(radio, 48, 24);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      zenit: { value: new THREE.Color(c.zenit) }, horizonte: { value: new THREE.Color(c.horizonte) },
      dirSol: { value: new THREE.Vector3(0, 1, 0) }, colSol: { value: new THREE.Color(c.sol) },
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*p; gl_Position.z = gl_Position.w; }`,
    fragmentShader: `uniform vec3 zenit, horizonte, colSol, dirSol; varying vec3 vDir;
      void main(){ float h = clamp(vDir.y, -0.2, 1.); float t = pow(clamp(h,0.,1.), 0.45);
        vec3 c = mix(horizonte, zenit, t); c = mix(c, horizonte*0.92, smoothstep(0.,-0.2,h));
        float s = max(dot(normalize(vDir), normalize(dirSol)), 0.); c += colSol*(pow(s, 900.)*6. + pow(s, 12.)*0.18);
        gl_FragColor = vec4(c, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const malla = new THREE.Mesh(g, m);
  malla.renderOrder = -10;
  malla.frustumCulled = false;
  return malla;
}

/**
 * Crea la escena en un contenedor (div con tamaño). Devuelve un objeto con todo lo necesario.
 * op.fondo: "cielo" | "subterraneo" | color.  op.sol: { az, alt } en grados (az desde el norte, horario).
 * op.extension: radio (m) que debe cubrir la sombra del sol.  op.niebla: [cerca, lejos] en m (bruma).
 */
export function crearEscena(contenedor, op = {}) {
  const { fondo = "cielo", cielo = "andino", sol = { az: 300, alt: 38 }, extension = 120, niebla = null, exposicion = 1,
    fov = 38, cerca = 0.5, lejos = 20000, sombras = true, mapaSombra = 2048 } = op;
  const c = CIELOS[cielo] || CIELOS.andino;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposicion;
  renderer.shadowMap.enabled = sombras;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  contenedor.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, cerca, lejos);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.495;

  const dirSol = new THREE.Vector3();
  const az = THREE.MathUtils.degToRad(sol.az), alt = THREE.MathUtils.degToRad(sol.alt);
  dirSol.set(Math.sin(az) * Math.cos(alt), Math.sin(alt), -Math.cos(az) * Math.cos(alt)).normalize();

  let luzSol = null, domo = null;
  if (fondo === "cielo") {
    domo = domoCielo(c, lejos * 0.9);
    domo.material.uniforms.dirSol.value.copy(dirSol);
    scene.add(domo);
    scene.add(new THREE.HemisphereLight(new THREE.Color(c.horizonte).lerp(new THREE.Color(c.zenit), 0.35), new THREE.Color("#8a7a66"), c.cielo));
    luzSol = new THREE.DirectionalLight(c.sol, c.intensidad);
    luzSol.position.copy(dirSol).multiplyScalar(extension * 3);
    luzSol.castShadow = sombras;
    const s = luzSol.shadow;
    s.mapSize.set(mapaSombra, mapaSombra);
    s.camera.left = -extension; s.camera.right = extension; s.camera.top = extension; s.camera.bottom = -extension;
    s.camera.near = extension * 0.5; s.camera.far = extension * 6;
    s.bias = -0.0004; s.normalBias = extension / 1500;
    scene.add(luzSol, luzSol.target);
    if (niebla) scene.fog = typeof niebla === "number" ? new THREE.FogExp2(c.bruma, niebla) : new THREE.Fog(c.bruma, niebla[0], niebla[1]);
  } else if (fondo === "subterraneo") {
    scene.background = new THREE.Color("#050505");
    scene.add(new THREE.AmbientLight("#4a443c", 0.06));
    if (niebla) scene.fog = new THREE.Fog("#0b0a09", niebla[0], niebla[1]);
  } else {
    scene.background = new THREE.Color(fondo);
    scene.add(new THREE.HemisphereLight("#ffffff", "#666055", 1.1));
  }

  const tareas = new Set();
  let ultimo = 0, visible = true, cuadro = 0, sucio = true;
  const quieto = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ajustar = () => {
    const w = Math.max(1, contenedor.clientWidth), h = Math.max(1, contenedor.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    sucio = true;
  };
  new ResizeObserver(ajustar).observe(contenedor);
  ajustar();
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) pedir(); }).observe(contenedor);
  controls.addEventListener("change", () => { sucio = true; pedir(); });

  const api = {
    THREE, renderer, scene, camera, controls, luzSol, dirSol, domo, cielo: c, quieto,
    /** fn(dt, t) se llama en cada cuadro; devuelve true si necesita seguir animando. */
    alAnimar(fn) { tareas.add(fn); pedir(); return () => tareas.delete(fn); },
    marcar() { sucio = true; pedir(); },
    /** Mueve la sombra del sol para que cubra un punto (escenas grandes). */
    centrarSombra(p) { if (!luzSol) return; luzSol.target.position.copy(p); luzSol.position.copy(p).addScaledVector(dirSol, extension * 3); },
    /** Coloca la cámara mirando a un punto desde azimut/elevación (°) y distancia (m). */
    mirar(objetivo, az = 210, el = 22, dist = 100) {
      const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
      controls.target.copy(objetivo);
      camera.position.set(objetivo.x + Math.sin(a) * Math.cos(e) * dist, objetivo.y + Math.sin(e) * dist, objetivo.z - Math.cos(a) * Math.cos(e) * dist);
      controls.update(); sucio = true; pedir();
    },
    renderizar() { renderer.render(scene, camera); sucio = false; },
  };
  function pedir() { if (!cuadro) cuadro = requestAnimationFrame(paso); }
  function paso(ahora) {
    cuadro = 0;
    const dt = ultimo ? Math.min((ahora - ultimo) / 1000, 0.1) : 1 / 60;
    ultimo = ahora;
    let seguir = controls.update();
    for (const fn of tareas) if (fn(dt, ahora / 1000)) seguir = true;
    if (domo) domo.position.copy(camera.position);
    if (seguir) sucio = true;
    if (sucio && visible) api.renderizar();
    if (seguir && visible) pedir(); else ultimo = 0;
  }
  window.__geo = Object.assign(window.__geo || {}, { escena: api });
  return api;
}
