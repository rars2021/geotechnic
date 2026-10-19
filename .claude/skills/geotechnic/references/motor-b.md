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
