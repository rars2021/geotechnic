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

`macizo(op).metodologia` devuelve la tabla de métodos con sus parámetros y fuentes, para la ficha.

## Uso

```js
const mac = macizo({ familias, caja, semilla: 13, ruido: { amplitud: 0.07, longitud: 2.5, octavas: 3 }, litologia, alteracion, agua });
const gal = galeria({ seccion: seccionBaul(4, 4), largo: 36, inicio: -22, paso: 0.11, macizo: mac, huellas: huellasDe(M) });
const ter = terrenoGaleria(gal, { frente: superficieFrente(gal, { x: XF, macizo: mac }) });
```

Todo es puro y determinista: el juez lo construye en Node igual que la página.
