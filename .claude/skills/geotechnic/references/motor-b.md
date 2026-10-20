# Motor B · roca y terreno

Lo que mejor funcionaba en la v1 (paredes de galería, talud) se queda, con una descripción única del macizo
(`kit/macizo.js`) y cada efecto con su parámetro explícito.

## Métodos y su parámetro

| Rasgo | Método | Parámetro explícito | Kit |
|---|---|---|---|
| Familias de juntas | DFN de discos: espaciado exponencial (Priest y Hudson 1976), orientaciones con dispersión de Fisher, persistencia lognormal | `familias[]: { buz, dirBuz, kappa, espaciado, persistencia, relieve, jrc }` | `crearDFN` |
| Caras facetadas | Cada bloque entre planos de junta es una faceta plana con su tono | `relieve` por familia | `relieveBloques` |
| Juntas onduladas | Ruido fractal que desplaza cada plano a lo largo de su normal | `ruido: { amplitud (m), longitud (m), octavas }` | `macizo().ondula` |
| Aspereza | Ruido fino proporcional al JRC de la familia más cercana (Barton) | `aspereza: { amplitud por JRC 10, longitud }` | `macizo().relieve` |
| Alteración gradacional | Zonas con franja de transición ruidosa, nunca borde nítido | `zona({ transicion, ruido })` | `colorRoca` |
| Agua | Humedad que oscurece ≈ 40 % y da brillo: base, junto a las juntas, en el piso, en zonas | `agua: { base, juntas, piso, zonas }` | material de roca (`humedad`) |
| Polvo | Partículas que nacen en emisores (contrato A → B) | `polvo({ color, tam, viento })` | `volumenes.js` |
| Relieve del frente | Voladura ±0,2 m + bloques + concavidad central | `superficieFrente(gal, { relieve })` | `labor.js` |
| Calma de estudio | Solo color: mezcla hacia el gris de luminancia (50 % con calma 1) y tono por bloque y oscurecido por junta ×(1 − calma/2); el relieve no cambia | `calma` (0 = v2, 1 = estudio) | `macizo().color`, `tonoCara` |
| Macizo cerrado | Galería + faldón + frente + caja en un solo sólido cerrado y orientado | `cajaBloque(gal, { lado, arriba, abajo, fondo })` | `macizoCerrado` |

`macizo(op).metodologia` devuelve la tabla de métodos con sus parámetros y fuentes, para la ficha.

## Uso

```js
const mac = macizo({ familias, caja, semilla: 13, ruido: { amplitud: 0.07, longitud: 2.5, octavas: 3 }, litologia, alteracion, agua });
const gal = galeria({ seccion: seccionBaul(4, 4), largo: 36, inicio: -22, paso: 0.11, macizo: mac, huellas: huellasDe(M) });
const ter = terrenoGaleria(gal, { frente: superficieFrente(gal, { x: XF, macizo: mac }) });
```

Todo es puro y determinista: el juez lo construye en Node igual que la página.

## Macizo cerrado (v3, `references/estudio.md`)

La roca no es un tubo de una cara ni un plano: es **un bloque**. `macizoCerrado(gal, op)` arma una sola
`BufferGeometry` cerrada y orientada (tras soldar por posición a 1e-5 m, cada arista dirigida aparece una vez y su
inversa una vez; las caras delanteras miran al aire).

| Parte | Cómo | Grupo |
|---|---|---|
| Galería | Copia exacta de `galeria()` (vértices, colores, humedad, región, normales): la física aprobada no cambia. El contorno de `seccionBaul` cierra (último punto = primero), así que el tubo no deja costura | 0 |
| Faldón | Prolonga en x el último anillo hasta el frente (el contrato ya lo da por labor: `fila(x)` se queda en el último anillo). Si el frente quedara antes del anillo se corre 1 cm (`ajustados`) | 1 |
| Frente | `superficieFrente` (la misma del contrato) mallada DENTRO de la sección: anillos concéntricos del último anillo hacia (0, alto/2), cosidos al faldón. Sin plano sobrante | 1 |
| Caja | `cajaBloque`: hastiales a ±(ancho/2 + `lado`), techo a `alto + arriba`, base a −`abajo`, cara trasera a `xFrente + fondo`, cara de entrada en `x = inicio` con la boca abierta (anillo entre el rectángulo y el anillo 0, cosido por ángulo) | 2 |

Valores por defecto: `lado` 2,5 m · `arriba` 2,5 m · `abajo` 1,2 m · `fondo` 6 m (con 4,5 m, la punta del taladro
más hondo del jumbo quedaría a 0,12 m de la cara trasera; con 6 m quedan 1,38 m de roca).

```js
const caja = cajaBloque(gal);                               // la MISMA caja para el bloque y el contrato
const blq = macizoCerrado(gal, { frente: supFrente, caja });
const ter = terrenoGaleria(gal, { frente: supFrente, caja }); // fuera de la caja libre ≥ 0 (aire)
const roca = new THREE.Mesh(blq.geometria, [matRoca, matFrente, matCaja]); // o un solo material
trazasSobreMalla(mac.dfn, gal.geometria, …); trazasSobreMalla(mac.dfn, blq.frente, …); // trazas: galería y frente
```

Devuelve `{ geometria, caja, frente, grupos: { galeria: 0, frente: 1, caja: 2 }, ajustados, xFrente }`; `frente` es
faldón + frente como malla aparte (para trazas y pintura). Atributos en todos los vértices: `position`, `normal`,
`color` (la caja con el color de la roca), `humedad` y `region` (0 en la caja).

Trazas de juntas: `trazasSobreMalla(dfn, geom, { desplazar })` despega la línea a lo largo de la normal, que mira al
aire. `desplazar` va **positivo** (≈ 0,02 m en galería y frente, 0,03–0,05 m en el talud). Negativo mete la traza en la
roca: queda tapada por la pared o se dibuja sobre la tapa de corte.

Contrato con caja: `libre(p) = max(libre de v2, distancia con signo a la caja)`: roca = caja ∖ labor. En la labor no
cambia nada; fuera del bloque es aire (para `planoCorte`: desde afuera se ve el bloque entero, sin corte).

## Tajo abierto (dispatch): `terrenoTajo` + `mallaTajo`

`terrenoTajo(op)` (`kit/contrato.js`, puro) arma el tajo y su contrato B → A; `mallaTajo(ter, op)` (`kit/terreno.js`)
lo dibuja como **un sólido cerrado y orientado** dentro de `ter.caja` (la misma caja que usa `libre`: fuera es aire).

Mundo: x = este, y = arriba, z = sur. Rumbo como `M.posar`: 0 = hacia +x, 90 = hacia −z (grados).

| Parte | Cómo | Parámetro (por defecto) | Fuente |
|---|---|---|---|
| Bancos | Perfil por distancia ρ a un fondo en cápsula; caras planas | `banco { n 6, altura 15, cara 70, berma 8 }` · `fondo { largo 240, radio 70 }` | R9/R10 |
| Rampa en espiral | Baja con pendiente `g` en el eje; cada pasada corre `ancho` m hacia afuera los bancos de encima; bajo la vía queda roca a la inclinación de la cara; curvas verticales parabólicas arriba y abajo | `rampa { pendiente 0.09, inicio (λ) 0.5, curva 40, bombeoEn 60 }` | Yupanqui Sánchez 2025 (7–11 %) |
| Sección de vía | 40 m, pretil 3 × 2 m al vacío, bombeo de corona en los 37 m efectivos (solo en la rampa: la meseta va plana) | `via { ancho 40, pretil { alto 2, base 3 }, bombeo 0.03 }` | Ojeda Ore 2022, fig. 2.14 y 2.16 |
| Fondo y remate | La última pasada sigue al nivel del fondo y se angosta en `remate` m | `rampa { entrada 30, plano 60, remate 200 }` | diseño |
| Montón | Contra la pared del fondo, a 34° y `alto` m, con extremos en talud | `palas[].monton { alto 10, largo 70, corona 6 }` | R6 |
| Chancadora | Losa a cota de meseta, muro de tope y tolva hundida detrás | `chancadora { tope { alto 1.5, ancho 1.2 }, tolva { largo 12, ancho 14, hondo 10 } }` | estimado |
| Botadero | Plataforma de relleno a 34°, pretil en la cresta de descarga, acceso recto al 9 % | `botadero { alto 15, largo 150, ancho 120, acceso { pendiente 0.09, v 25 } }` | R6, R11 |
| Rutas | Caminos de Dubins (radio acotado) en el fondo, la meseta y la plataforma + carriles de la rampa + maniobra (recta + cuarto de giro en retroceso) | `radio { piso 25, via 40 }` · `maniobra 15` · `holgura 2` · `ejeTrasero 2.655` · `sentido "derecha"` | radio: estimado (793 ≈ 14 m) |
| Relieve facetado | Solo en caras > 38–55°: `macizo.relieve` a lo largo de la normal; vías, bermas, fondo y plataformas quedan exactos | `macizo`, `relieve` (×1) | igual que galería |
| Calma | Solo color (mezcla 50 % × calma hacia el gris de luminancia) | `calma` o `macizo.calma` | estudio.md |

Contrato que devuelve:

| Campo | Qué es |
|---|---|
| `piso(x, z)` | Cota exacta de la superficie (sin relieve): bajo ruedas y orugas en vías, rampa, bermas, fondo, meseta y plataformas |
| `libre(p)` | Distancia con signo a la superficie dibujada (≥ 0 aire, < 0 roca, botadero o montón); descuenta el relieve en el pie de la normal; fuera de `caja`, aire |
| `sitio(x, z)` → `{ y, tipo }` · `tipo(x, z)` | `meseta`, `banco`, `fondo`, `rampa`, `pretil`, `monton`, `botadero`, `chancadora` |
| `rutas["P1→chancadora"]` | `{ puntos [[x,y,z]…] cada ≈ 2 m sobre el piso, s, largo (m), km, tramos [{ tipo, s0, s1, pendienteMedia, pendienteMax (ventana 20 m), radioMin, reversa }], pendiente { diseno, rampaMedia, rampaMax }, radioMin, en(s) }`. Hay ida cargada (`Pi→destino`) y vuelta vacía (`destino→Pi`) por carriles distintos |
| `rutas[id].en(s)` | `{ p (en el piso), dir, rumbo (de la nariz: +180 en `retroceso`), pendiente, reversa, tramo }` |
| `kmRutas()` | `{ "P1→chancadora": km, … }` para `simularFlota({ rutas })` |
| `zonas.palas[]` | `{ id, punto (centro de la pala en el fondo), rumbo (mira al montón), cuadre { punto, rumbo } (origen del camión al cargar), maniobra { punto, rumbo }, monton { alto, largo, reposo, pie } }` |
| `zonas.destinos[]` | `{ id, tipo, punto (ORIGEN del camión al descargar), rumbo (su nariz), maniobra, tope }` |
| `rampa` | `{ pendiente, largo, vueltas, carriles { cargado, vacio }, eje(λ), boca, pie }` |
| `caja`, `metodologia`, `avisos`, `geometria` | Caja del bloque; tabla para la ficha; avisos de diseño; parámetros usados |

Medido en Node (por defecto, paso 1,5 m): rampa 1039 m, 0,83 vueltas; rutas de 1,5 a 2,5 km; rampa media 8,0 % (carril
de afuera) y 8,7 % (carril de adentro), máx. 9,8 % en ventana de 20 m; radio mínimo 25 m (fondo) y 90 m (rampa);
`revisarCerradas` sin fallas (505 000 triángulos, 1,5–2,3 s); camión (`modeloCamion`) asentado en 3170 poses de todas
las rutas: ruedas entre −2,9 y +0,7 cm del piso.

```js
// escena o montaje.js (lo mismo en la página y en el juez)
const mac = macizo({ calma: 1, familias, caja: { min: [-500, -110, -320], max: [500, 45, 280] }, semilla: 7 });
const ter = terrenoTajo({ macizo: mac });                 // op por defecto: 2 palas, chancadora y botadero
const blq = mallaTajo(ter, { paso: 1.5 });                // sólido cerrado: grupo 0 superficie, 1 caja
const roca = new THREE.Mesh(blq.geometria, [matRoca, matCaja]);
const r = ter.rutas["P1→chancadora"], e = r.en(s);        // pose del camión a s m
valores._pose = asentar(M, valores, ter, { x: e.p[0], z: e.p[2], rumbo: e.rumbo });
```

`asentar` con rumbo ≠ 0: plano por mínimos cuadrados con el término cruzado, pendientes giradas al marco de la máquina
(pf = gx·cos ρ − gz·sin ρ, pl = gx·sin ρ + gz·cos ρ; cabeceo = atan pf, alabeo = −atan pl) y, como la espiral es un
helicoide (un chasis rígido no apoya todas las ruedas), baja la máquina hasta que ninguna rueda quede en el aire
(el juez acepta 6 cm hundida y 2 cm en el aire). Con rumbo 0 es la fórmula de v2: scoop y jumbo no cambian.
