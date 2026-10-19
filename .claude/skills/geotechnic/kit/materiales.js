// Geotechnic · materiales: roca con relieve fino procedural, pintura sucia, acero gastado, goma, shotcrete.
// La roca y la pintura llevan ruido 3D en el shader (coordenadas de mundo): no hay texturas que bajar.
import * as THREE from "three";

// Ruido simplex 3D en GLSL (Ashima Arts / Stefan Gustavson, MIT).
export const GLSL_RUIDO = `
vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 m289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 perm4(vec4 x){return m289(((x*34.)+1.)*x);}
vec4 tis(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.); const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy; i=m289(i);
  vec4 p=perm4(perm4(perm4(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857; vec3 ns=n_*D.wyz-D.xzx; vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.*x_); vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw); vec4 s0=floor(b0)*2.+1.; vec4 s1=floor(b1)*2.+1.; vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 nr=tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3))); p0*=nr.x; p1*=nr.y; p2*=nr.z; p3*=nr.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.); m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
vec3 gradRuido(vec3 p){ float e=.12; float n=snoise(p);
  return vec3(snoise(p+vec3(e,0.,0.))-n, snoise(p+vec3(0.,e,0.))-n, snoise(p+vec3(0.,0.,e))-n)/e; }
`;

/**
 * Parcha un MeshStandardMaterial para: relieve fino de roca (normal perturbada en mundo, 2 escalas),
 * variación de color, humedad (atributo "humedad": oscurece y da brillo) y región resaltada (atributo "region").
 * op: { escala (1/m), fuerza, escala2, fuerza2, variacion, humedad: bool, regiones: bool, polvo: [r,g,b] para caras que miran arriba }
 */
export function parcharRoca(material, op = {}) {
  const { escala = 0.9, fuerza = 0.3, escala2 = 3.2, fuerza2 = 0.07, variacion = 0.1, humedad = false, regiones = false, polvo = null, polvoFuerza = 0.0 } = op;
  material.userData.uniforms = {
    uRegion: { value: -1 }, uTinte: { value: new THREE.Color("#e2483d") }, uAtenuar: { value: 0 },
    uPolvo: { value: new THREE.Color().setRGB(...(polvo || [0.6, 0.55, 0.48])) }, uPolvoF: { value: polvoFuerza },
  };
  material.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, material.userData.uniforms);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", `#include <common>
        varying vec3 vPosM; varying vec3 vNorM; ${humedad ? "attribute float humedad; varying float vHum;" : ""} ${regiones ? "attribute float region; varying float vReg;" : ""}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        vPosM = (modelMatrix * vec4(transformed, 1.)).xyz; vNorM = normalize(mat3(modelMatrix) * objectNormal);
        ${humedad ? "vHum = humedad;" : ""} ${regiones ? "vReg = region;" : ""}`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
        varying vec3 vPosM; varying vec3 vNorM; ${humedad ? "varying float vHum;" : ""} ${regiones ? "varying float vReg;" : ""}
        uniform float uRegion; uniform vec3 uTinte; uniform float uAtenuar; uniform vec3 uPolvo; uniform float uPolvoF;
        ${GLSL_RUIDO}`)
      .replace("#include <color_fragment>", `#include <color_fragment>
        float nv = snoise(vPosM * ${(escala * 0.35).toFixed(3)}) * 0.6 + snoise(vPosM * ${(escala2 * 0.8).toFixed(3)}) * 0.4;
        diffuseColor.rgb *= 1. + nv * ${variacion.toFixed(3)} * (1. - 0.5 * smoothstep(0.6, 0.9, vNorM.y));
        float arriba = smoothstep(0.55, 0.9, vNorM.y);
        diffuseColor.rgb = mix(diffuseColor.rgb, uPolvo, uPolvoF * arriba * (0.6 + 0.4 * snoise(vPosM * 0.5)));
        ${humedad ? "diffuseColor.rgb *= 1. - 0.42 * clamp(vHum, 0., 1.);" : ""}
        ${regiones ? `float enReg = 1. - step(0.5, abs(vReg - uRegion));
        diffuseColor.rgb = mix(diffuseColor.rgb, uTinte, 0.38 * enReg);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(.33))), uAtenuar * (1. - enReg) * step(-0.5, uRegion));` : ""}`)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
        ${humedad ? "roughnessFactor = mix(roughnessFactor, mix(0.55, 0.12, smoothstep(0.6, 0.9, vNorM.y)), clamp(vHum, 0., 1.));" : ""}`)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
        float plano = 1. - smoothstep(0.5, 0.82, vNorM.y);
        vec3 gW = (gradRuido(vPosM * ${escala.toFixed(3)}) * ${fuerza.toFixed(3)} + gradRuido(vPosM * ${escala2.toFixed(3)} + 11.) * ${fuerza2.toFixed(3)}) * plano;
        vec3 gV = (viewMatrix * vec4(gW, 0.)).xyz;
        normal = normalize(normal - (gV - dot(gV, normal) * normal) * 0.5);`);
  };
  material.customProgramCacheKey = () => `roca-${escala}-${fuerza}-${escala2}-${fuerza2}-${humedad}-${regiones}-${!!polvo}`;
  return material;
}

/** Roca con colores por vértice. */
export function materialRoca(op = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: op.rugosidad ?? 0.93, metalness: 0, flatShading: !!op.facetado });
  return parcharRoca(m, op);
}

/**
 * Pintura de equipo con suciedad: más polvo y barro abajo (bajo `alturaBarro` m sobre el piso de la máquina)
 * y en cantos; regla tomada de fotos de LHD y camiones (references/reglas-equipos.md).
 */
export function materialPintura(color, op = {}) {
  const { rugosidad = 0.5, metal = 0.15, barro = "#6d604f", alturaBarro = 0.9, suciedad = 0.5, desgaste = 0 } = op;
  const m = new THREE.MeshStandardMaterial({ color, roughness: rugosidad, metalness: metal });
  m.userData.uniforms = { uBase: { value: 0 }, uBarro: { value: new THREE.Color(barro) } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.uniforms);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vPosM; varying vec3 vNorM;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPosM = (modelMatrix * vec4(transformed,1.)).xyz; vNorM = normalize(mat3(modelMatrix)*objectNormal);");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vPosM; varying vec3 vNorM; uniform float uBase; uniform vec3 uBarro;\n${GLSL_RUIDO}`)
      .replace("#include <color_fragment>", `#include <color_fragment>
        float h = vPosM.y - uBase;
        float n = snoise(vPosM * 1.7) * 0.5 + snoise(vPosM * 6.) * 0.3 + snoise(vPosM * 23.) * 0.2;
        float abajo = 1. - smoothstep(${(alturaBarro * 0.4).toFixed(2)}, ${alturaBarro.toFixed(2)}, h + n * 0.35);
        float arriba = smoothstep(0.6, 0.95, vNorM.y) * 0.5;
        float s = clamp(${suciedad.toFixed(2)} * (abajo * 0.9 + arriba + 0.18 * n), 0., 0.92);
        diffuseColor.rgb = mix(diffuseColor.rgb, uBarro, s);
        ${desgaste > 0 ? `float d = smoothstep(${(1 - desgaste).toFixed(2)}, 1., snoise(vPosM * 3.1) * 0.5 + 0.5 + abajo * 0.3);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.32, 0.22, 0.15), d * 0.85);` : ""}`)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + 0.4 * (1. - smoothstep(0., 1.2, vPosM.y - uBase)), 0., 1.);");
  };
  m.customProgramCacheKey = () => `pintura-${alturaBarro}-${suciedad}-${desgaste}`;
  return m;
}

export const MATERIALES = {
  goma: () => new THREE.MeshStandardMaterial({ color: "#1d1c1b", roughness: 0.92, metalness: 0 }),
  aceroGastado: () => materialPintura("#5b5650", { rugosidad: 0.6, metal: 0.6, suciedad: 0.45, desgaste: 0.5 }),
  cromo: () => new THREE.MeshStandardMaterial({ color: "#d9dcdf", roughness: 0.18, metalness: 1 }),
  vidrio: () => new THREE.MeshStandardMaterial({ color: "#26323a", roughness: 0.08, metalness: 0.6, transparent: true, opacity: 0.82 }),
  negro: () => new THREE.MeshStandardMaterial({ color: "#222120", roughness: 0.7, metalness: 0.2 }),
  luz: (c = "#fff6df") => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 2.5 }),
  shotcrete: () => { const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97 }); return parcharRoca(m, { escala: 3, fuerza: 0.18, escala2: 14, fuerza2: 0.12, variacion: 0.08 }); },
};

/** Paletas de color medidas sobre fotos (sRGB). Ver references/reglas-roca.md: cada una con su fuente. */
export const PALETAS = {
  // roca fresca
  andesita: ["#7d7f7c", "#6e706d", "#8b8a84"],
  intrusivo: ["#9a9890", "#8a8880", "#a7a49a"],
  skarnMarmol: ["#c3c6c4", "#b0b5b6", "#d4d6d2"], // Antamina: banco gris claro a blanco
  caliza: ["#a9a397", "#9b9588", "#b8b1a3"],
  // alteración
  argilica: ["#d9d2c2", "#cfc6b2"], // blanquecina-crema
  filica: ["#b9b8b0", "#a9aaa5"], // gris claro sericítico
  propilitica: ["#7c8269", "#6f7660"], // verde grisáceo
  potasica: ["#9b8579", "#8d7468"], // rosado-pardo
  // óxidos (siguen las fracturas y chorrean hacia abajo)
  limonita: ["#b07a3c", "#a46b31"], jarosita: ["#c3a24b", "#b8963f"], hematita: ["#8e4a2e", "#7e3f27"],
  // otros
  panizo: ["#6a5f55", "#5c524a"], polvo: ["#b7aa98", "#a99c89"], suelo: ["#8d7b62", "#7b6a53"],
  hielo: ["#e6eef3", "#d5e2ea"], humedo: ["#4a4744", "#3d3b39"],
};
