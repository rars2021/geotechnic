// Geotechnic · señalar: piezas o regiones señalables con plaquitas numeradas, resaltado y modos completo / en blanco.
// Una relación de SSTutor = una pieza o región. La plaquita es el único texto dentro del dibujo.
import * as THREE from "three";

/**
 * piezas: [{ id, numero, nombre, definicion, relacion?, ancla: Vector3 | () => Vector3,
 *            objetos?: [Object3D] (se resaltan con emisión), region?: { material, valor } (tinte por atributo "region"),
 *            lineas?: [LineSegments] (cambian de color) }]
 * op: { modo: "completo" | "blanco", foco: id de la pieza en foco (acento rojo) }
 */
export function senalar(escena, contenedor, piezas, op = {}) {
  const capa = document.createElement("div");
  capa.className = "geo-plaquitas";
  contenedor.appendChild(capa);
  const v = new THREE.Vector3();
  let modo = op.modo || "completo", activa = null;
  const foco = op.foco ?? null;
  const tags = piezas.map((p) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "geo-tag";
    b.dataset.id = p.id;
    b.innerHTML = `<span class="n">${p.numero}</span><span class="t">${p.nombre}</span>`;
    b.setAttribute("aria-label", `${p.numero}. ${p.nombre}`);
    b.addEventListener("pointerenter", () => resaltar(p.id));
    b.addEventListener("pointerleave", () => resaltar(null));
    b.addEventListener("focus", () => resaltar(p.id));
    b.addEventListener("blur", () => resaltar(null));
    b.addEventListener("click", () => { resaltar(p.id); document.dispatchEvent(new CustomEvent("geo:pieza", { detail: p.id })); });
    capa.appendChild(b);
    return { p, b };
  });
  const guardado = new Map();
  function resaltar(id) {
    activa = id;
    for (const { p, b } of tags) {
      const on = p.id === id;
      b.classList.toggle("activa", on);
      for (const o of p.objetos || []) o.traverse((m) => {
        if (!m.isMesh || !m.material) return;
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mt of mats) {
          if (!mt.emissive) continue;
          if (!guardado.has(mt)) guardado.set(mt, mt.emissive.clone());
          if (on) mt.emissive.set(modo === "blanco" ? "#3a3a3a" : "#7a1d16");
          else if (!tags.some((t) => t.p.id === activa && (t.p.objetos || []).includes(o))) mt.emissive.copy(guardado.get(mt));
        }
      });
      for (const l of p.lineas || []) { l.material.color.set(on ? "#e2483d" : l.userData.colorBase || "#1d1a17"); if (!l.userData.colorBase) l.userData.colorBase = "#1d1a17"; }
      if (p.region && on) { p.region.material.userData.uniforms.uRegion.value = p.region.valor; p.region.material.userData.uniforms.uAtenuar.value = 0.55; }
    }
    if (!piezas.some((p) => p.id === id && p.region)) {
      for (const p of piezas) if (p.region) { p.region.material.userData.uniforms.uRegion.value = -1; p.region.material.userData.uniforms.uAtenuar.value = 0; }
    }
    escena.marcar();
    for (const li of document.querySelectorAll("[data-pieza-li]")) li.classList.toggle("activa", li.dataset.piezaLi === id);
  }
  function colocar() {
    const w = contenedor.clientWidth, h = contenedor.clientHeight;
    for (const { p, b } of tags) {
      const a = typeof p.ancla === "function" ? p.ancla() : p.ancla;
      v.copy(a).project(escena.camera);
      const fuera = v.z > 1 || v.x < -1.05 || v.x > 1.05 || v.y < -1.05 || v.y > 1.05 || (p.oculta && p.oculta());
      b.style.display = fuera ? "none" : "";
      b.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`;
    }
  }
  const renderizar = escena.renderizar;
  escena.renderizar = () => { renderizar(); colocar(); };
  function ponerModo(m) {
    modo = m;
    capa.dataset.modo = m;
    for (const { p, b } of tags) b.classList.toggle("foco", m !== "blanco" && p.id === foco);
    resaltar(null);
  }
  ponerModo(modo);
  // en la lista lateral: pasar el cursor por una pieza la resalta en el dibujo
  for (const li of document.querySelectorAll("[data-pieza-li]")) {
    li.addEventListener("pointerenter", () => resaltar(li.dataset.piezaLi));
    li.addEventListener("pointerleave", () => resaltar(null));
  }
  return { resaltar, ponerModo, colocar, capa };
}
