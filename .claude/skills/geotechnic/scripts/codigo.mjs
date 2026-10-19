// Geotechnic · código de página: junta los módulos del kit (motor B), del motor A y de los equipos en un solo
// <script type="module">. Los nombres son únicos en todo el kit (por eso los sufijos A en el motor A).
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const THREE_VER = "0.160.0";
/** Orden de concatenación: núcleo, motor B (roca y terreno), contrato, motor A, escena y señalar. */
export const KIT = ["kit/nucleo", "kit/materiales", "kit/fracturas", "kit/volumenes", "kit/macizo", "kit/terreno", "kit/equipos", "kit/labor", "kit/procesos",
  "motorA/modelo", "motorA/mallas", "kit/contrato", "kit/escena", "kit/senalar"];

/** Quita import/export para concatenar módulos en uno solo. */
export function desmodular(src) {
  return src
    .replace(/^import\s[^;]*?from\s+["'][^"']+["'];?\s*$/gms, "")
    .replace(/^export\s+(async\s+function|function|const|let|class)\s/gm, "$1 ")
    .replace(/^export\s+\{[^}]*\};?\s*$/gm, "");
}

/** Código del kit más los equipos pedidos (equipos/<nombre>/medidas.js y modelo.js). */
export function kitCodigo(equipos = []) {
  const archivos = [...KIT, ...equipos.flatMap((e) => [`equipos/${e}/medidas`, `equipos/${e}/modelo`])];
  return archivos.filter((k) => existsSync(join(RAIZ, k + ".js")))
    .map((k) => `// ── ${k}.js ──\n` + desmodular(readFileSync(join(RAIZ, k + ".js"), "utf8"))).join("\n");
}

/** Archivos fuente que entran en una página (para el sello del juez). */
export function fuentesDe(dirEj, equipos = []) {
  const archivos = [...KIT, ...equipos.flatMap((e) => [`equipos/${e}/medidas`, `equipos/${e}/modelo`])].map((k) => join(RAIZ, k + ".js")).filter(existsSync);
  for (const f of ["ficha.mjs", "montaje.js", "escena.js"]) if (existsSync(join(dirEj, f))) archivos.push(join(dirEj, f));
  return archivos;
}

export const IMPORTMAP = `<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@${THREE_VER}/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@${THREE_VER}/examples/jsm/"}}</script>`;
export const IMPORTS_THREE = `import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";`;

/** Sello de las fuentes de una página: si cambia una, el informe del juez deja de valer. */
export function selloDe(dirEj, equipos = []) {
  const h = createHash("sha256");
  for (const f of fuentesDe(dirEj, equipos)) { h.update(f.split("\\").join("/").split("/geotechnic/").pop()); h.update(readFileSync(f)); }
  return h.digest("hex").slice(0, 16);
}
