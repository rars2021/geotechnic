# API del kit

Mundo: metros; y = arriba. En taludes x = rumbo y +z = hacia el tajo; en labores x = eje de la labor (frente en x mayor).
Todo es determinista con `semilla`.

## nucleo.js
| Función | Qué hace |
|---|---|
| `azar(semilla)` | Generador; `.entre`, `.entero`, `.elegir`, `.normal`, `.lognormal(media, desv)`, `.exponencial(media)` |
| `ruido3(semilla)` → `n(x,y,z)` | Simplex 3D en [-1, 1] |
| `fbm(n, x,y,z, oct)` · `crestas(n, x,y,z, oct)` | Ruido fractal y de crestas |
| `normalPlano(buz, dirBuz)` · `fisher(r, n, kappa)` | Planos geológicos y dispersión de una familia |
| `rgb(hex)` · `mezcla(a,b,t)` · `suave(a,b,x)` | Color lineal, mezcla, smoothstep |

## escena.js
`crearEscena(contenedor, { fondo: "cielo"|"subterraneo", cielo: "andino"|"nublado"|"desierto", sol: { az, alt }, extension, niebla: [cerca, lejos] | densidad, exposicion, fov })`
→ `{ THREE, renderer, scene, camera, controls, luzSol, alAnimar(fn), marcar(), mirar(objetivo, az, el, dist), centrarSombra(p), renderizar() }`.
`alAnimar(fn(dt, t))` debe devolver `true` mientras anime.

## materiales.js
`materialRoca({ humedad, regiones, escala, fuerza, escala2, fuerza2, variacion, facetado })` · `parcharRoca(mat, op)` ·
`materialPintura(color, { alturaBarro, suciedad, desgaste, rugosidad, metal, barro })` · `MATERIALES.{goma, aceroGastado, cromo, vidrio, negro, luz, shotcrete}` · `PALETAS`.
Región resaltada: `mat.userData.uniforms.uRegion.value = n` (y `uAtenuar`).

## fracturas.js
| Función | Qué hace |
|---|---|
| `crearDFN(familias, caja, semilla)` | Familias `{ nombre, buz, dirBuz, kappa, espaciado, persistencia, relieve, maxDiscos }` → discos y planos |
| `relieveBloques(dfn, x,y,z, amp)` | `{ d, dist, familia, id, tono }`: escalón y faceta del bloque, distancia a la junta |
| `trazasSobreMalla(dfn, geom, { maxNormalY })` | Segmentos por familia (intersección real disco-malla) |
| `lineasTrazas(porFamilia, { color, opacidad })` | Un `LineSegments` por familia (se resaltan por separado) |
| `polosSchmidt(dfn, radio)` | Polos para una red de Schmidt en SVG |

## volumenes.js
`zona({ tipo: "elipsoide"|"plano"|"capa", transicion, ruido, ... })` → f(x,y,z) 0..1 ·
`colorRoca(paletaBase, [{ f, paleta, peso }])` · `agua({ nivel, chorreras })` · `hielo({ cota })` ·
`polvo({ color, tam, viento, vida })` → `{ puntos, emitir(p, n), actualizar(dt) }` · `goteo(puntos)`.

## terreno.js
| Función | Qué hace |
|---|---|
| `perfilBancos({ bancos: [{ altura, cara, berma }], piso })` | Perfil en corte |
| `mallaTalud({ perfil, largo, paso, dfn, color, humedad, oxidos, region, estrias, bloques, retroceso, escombros, huellas, extra })` | Malla con `muestra(u, s)` para anclar cosas |
| `sDeBanco(perfil, banco)` | Abscisas de pie, cresta y fin de berma |
| `escombrosTalud(talud, { cantidad, tamMedio })` | Bloques instanciados al pie |
| `mediasCanas(talud, banco, { espaciado, diametro, visibles })` | Huellas de precorte |
| `tapaSeccion(talud, { borde })` | Cara de corte (bloque diagrama) |
| `cerros({ ... })` · `pretil(curva, { alto, ancho })` · `huellasNeumatico({ carriles })` | Fondo, borde de vía, huellas |

## labor.js
`seccionBaul(ancho, alto, flecha)` · `galeria({ seccion, largo, inicio, paso, sobreexcavacion, dfn, color, humedad, shotcrete, region })` ·
`frente(galeria, { x, taladros, dfn })` · `pernos(galeria, { espaciado })` · `mangaVentilacion` · `tuberias` · `charcos`.

## macizo.js (motor B)
`macizo({ familias, caja, semilla, ruido: { amplitud, longitud, octavas }, aspereza, litologia, alteracion, agua })` →
`{ dfn, relieve(x,y,z), color, humedad, metodologia }`. Pásalo a `galeria({ macizo })` y `superficieFrente(gal, { macizo })`.

## contrato.js
`terrenoGaleria(gal, { frente })` → `{ piso(x,z), contorno(x), libre(p), frenteX(y,z), enCavidad(q, pieza), cavidades }` ·
`emboquillesMalla(malla, frente)` · `huellasDe(M)` · `asentar(M, valores, terreno, { x, z, rumbo })`.

## motorA (equipos y mecanismos)
Ver `motor-a.md`: `maquina`, `grupo`, `prisma`/`caja`/`placa`/`losa`/`pared`, `redondo`/`barra`, `rueda`, `pasador`,
`cilindro`, `puerto`, `manguera`, `cadena`, `posar`, `cascos`; dibujo con `mallasMaquina(M)`.
Equipos: `EQUIPO_SCOOP` (`equipos/scoop`), `EQUIPO_JUMBO` y `apuntarJumbo` (`equipos/jumbo`).

## equipos.js (v1 heredado)
Cada máquina devuelve `{ grupo, poner(estado), partes, dims }`.
| Máquina | Estado de `poner` |
|---|---|
| `scoop()` | `levante`, `volteo`, `giro`, `carga`, `rodar` |
| `camionAcarreo()` | `volteo`, `carga`, `rodar` |
| `palaElectrica()` | `giro`, `empuje`, `izaje`, `compuerta`, `carga` |
| `jumbo()` | además `apuntar(i, collar, dir, avance)` por brazo |
| `perforadoraTajo()` | `mastil`, `bajar`, `rotar` |
| `cargadorFrontal`, `empernador`, `lanzadorShotcrete`, `perforadoraTaladrosLargos`, `volquete` | variantes de los anteriores |
Piezas: `cajaB`, `placa`, `tubo`, `baranda`, `llanta`, `cilindro`, `faro`, `cabina`, `monton`.

## procesos.js
`MALLAS.casapalca4x4` · `COLORES_GRUPO` · `ordenPerforacion(malla, brazos)` · `lineaTiempo(claves)` ·
`simularFlota({ palas, destinos, rutas, asignacionFija | camiones, velCargado, velVacio, cuadrado, llenado, politica, umbralCola, previo, despeje, ... })` → `{ eventos, ciclos, colas, resumen }` · `estadoEn(eventos, camion, t)` · `muestreador(r)` (lognormal, normal, normalTruncada, triangular, exponencial, fijo) · `mediaDist(d)` · `ESTADOS_FLOTA` · `cuantil(v, q)`.

`simularFlota` es de eventos discretos: palas y destinos atienden en orden de llegada (FIFO); el despachador decide al
terminar de descargar (cerrado · libre · condicional con umbral de cola prevista). Una ruta puede ser `km` o
`{ km, tramos: [{ id, largo, conflictos }], despeje }`: en un tramo nadie adelanta (regla de bloque: nadie entra hasta
que el de adelante salió del tramo que sigue); una zona de tramos con `conflictos` (cruces, uniones) se cruza de corrido
sin coincidir con nadie y la espera queda antes; `despeje` = tramos que debe dejar el que sale para que la pala o el
destino atiendan al siguiente. Los viajes se planifican al salir: el que sale después cede. Uso: `ejemplos/dispatch`.

## senalar.js
`senalar(escena, contenedor, piezas, { modo, foco })` → `{ resaltar(id), ponerModo(m), colocar() }`.
Pieza: `{ id, numero, nombre, definicion, ancla, objetos?, region?: { material, valor }, lineas?, oculta?() }`.

## Contrato de un ejemplo con equipos
`montaje.js` exporta `pruebas(paso)` → `{ M, terreno, ciclo: [{ etiqueta, valores, cavidades? }], rango }` (lo usa el juez)
y una función de montaje que la escena llama para dibujar exactamente lo mismo.

## Contrato de una escena de ejemplo
```js
async function montar(ctx) {           // ctx: { contenedor, modo, foco, lectura(texto) }
  const esc = crearEscena(ctx.contenedor, { ... });
  // ... geometría, piezas, controles (ids definidos en ficha.mjs)
  const senal = senalar(esc, ctx.contenedor, piezas, { modo: ctx.modo, foco: ctx.foco });
  window.GEO = { escena: esc, senal, igualarVista: (v) => esc.mirar(new THREE.Vector3(...v.objetivo), v.az, v.el, v.dist) };
}
```
