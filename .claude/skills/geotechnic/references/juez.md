# Juez de control de calidad

Automático, con informe, y llave de la publicación: `armar` no escribe `index.html` si el informe no aprueba o si
alguna fuente cambió después (sello sha-256 de kit, motor A, equipos, ficha, montaje y escena).

```bash
node scripts/juez.mjs ejemplos/<tema> --salida <scratchpad>/dist --incrustar
node scripts/armar.mjs ejemplos/<tema> --salida <scratchpad>/dist --incrustar
```

Salida en `<salida>/<tema>/juez/`: `informe.md`, `informe.json`, `hoja-realismo.png`, `limpieza.json`, capturas (`captura-0.png` = vista
inicial). La página publicada
lleva una sección «Lo que probó el juez» con el resumen.

## Líneas

| Línea | Qué verifica | Tolerancia | Con qué |
|---|---|---|---|
| interpenetración | Ningún par de sólidos se atraviesa, salvo uniones declaradas | 4 mm | `gjk` y `separate` de Anatomy (pistas: ejes de cada pieza); si dicen que se atraviesan, **SAT completo**: normales de cara de los dos cascos convexos y productos cruz arista × arista (`satCompleto` en `juez/fisica.mjs`). Si algún eje separa, no se atraviesan |
| rangos | Cada articulación dentro de su rango físico | exacto | rangos del modelo |
| cierres | Cada cadena (barra en Z) cierra | 2 mm | `M.cadena` |
| cilindros | Largo entre retraído y extendido; perpendicular a sus pasadores | carrera geométrica; cos ≤ 0,035 | `pose.cil` |
| mangueras | Ancladas en sus dos puertos, sin estirarse, radio ≥ 4 diámetros, sin atravesar sólidos ni otra manguera | 6 mm | `pose.mang` |
| puertos | Cada puerto sobre la superficie de su racor | 4 mm | casco del racor |
| ruedas | Apoyadas en el piso del terreno (ni en el aire ni hundidas) | +2 cm / −6 cm | `terreno.piso` |
| roca | Ningún vértice del equipo dentro de la roca; contacto real para piezas `tocaRoca` (centralizador, pies de gata, fondo del cucharón); barra y broca solo dentro de su taladro. Las llantas (`tipo: "llanta"`, registradas en `M.ruedas`) con las ruedas en el piso usan la tolerancia de `ruedas` | 1 cm (3,5 cm; llantas 6 cm) | `terreno.libre`, `enCavidad` (y `libreCaja`, si el terreno la da) |
| entre máquinas | Con varias máquinas en el ciclo: ningún sólido de una instancia entra en un sólido de otra | 4 mm | caja de cada instancia, caja de cada pieza y el mismo `margen` que la interpenetración (`gjk`, `separate` y, si dicen que chocan, SAT completo) |
| fidelidad | Cada medida con fuente contra el modelo | la de cada medida | `equipos/<e>/medidas.js`, `medir` |
| realismo (v3.1, **informativo**) | Captura en el punto de vista de cada foto abierta contra la foto (zona del equipo): luminancia ±0,22, contraste ×0,45–2,2 y discrimina (HOG contra su foto ≥ mediana contra las otras fotos abiertas del tema + 0,05); ≥ 60 % de los pares. Se calcula y se informa, con el AUC correcto/cruzado de cada métrica. **Solo bloquea una métrica con AUC ≥ 0,8 y Spearman ≥ 0,5** contra el puntaje del usuario. Hoy ninguna llega y no hay puntajes: no entra en la aprobación. La línea tiene que existir (prueba que el juez corrió el navegador) | — | `juez/realismo.py` |
| ~~realismo v3~~ (historia) | Igual, pero decidían bordes estructurales (160 px) ×0,4–2,5; colorido informativo | — | reemplazado por v3.1 |
| ~~realismo v2~~ (historia) | Igual, pero bordes a 512 px ×0,4–2,5 y colorido ×0,3–3 decidían | — | reemplazado por v3 (ver abajo) |

| limpieza | Dibujo limpio para estudio (4.º juez, ver abajo) | ver abajo | `juez/limpieza.mjs`, `juez/limpieza.py` |

**SAT completo (ronda 5, 19-10-2026).** `gjk` y `separate` solo prueban direcciones cercanas a sus pistas (los ejes
del marco de cada pieza). Con piezas giradas o caras inclinadas daban choques falsos: en el camión, una placa
inclinada con la máquina girada marcó −103 mm con 78 mm de luz real; en la pala, piezas giradas que se tocan a ras
marcaron −53 mm con +10 mm de luz. Ahora, si la vía rápida da margen < −tolerancia, se prueban todos los ejes del
teorema del eje separador para dos convexos:
- las normales de cara de los dos cascos;
- los productos cruz arista × arista.

El casco convexo 3D sale de `ConvexHull` de three. Los ejes se deduplican y se normalizan, y se descartan los casi
nulos. Si un eje separa, el par no se atraviesa. Si ninguno separa, el margen es la penetración exacta del par de
poliedros. El costo es poco porque solo corre en los pares que la vía rápida marca. En el rango del camión y de la
pala, y en el rango y ciclo del jumbo, no corrió ni una vez, así que sus veredictos son los de antes. Plantas:
- cajas giradas 37° alrededor de [1, 2, 3], separadas o solapadas 1 cm por una normal de cara: no chocan / chocan;
- dos placas giradas con 30 mm de luz real, donde la vía vieja marcaba −12 mm: no chocan (lo encontró el SAT);
- 150 pares de cajas orientadas al azar contra el SAT exacto de 15 ejes: el mismo veredicto en todos, y la misma
  penetración en los 106 que se cruzan.

La física corre dos veces: en el **rango** del modelo (sin terreno: articulaciones, envolvente de trabajo) y en el
**ciclo** del ejemplo (con el terreno del motor B, paso 0,1 s).

## Varias máquinas (flota, pala y camión)

Para ejemplos con más de una máquina (dispatch: 12 camiones y 2 palas). Si `pruebas()` no da `maquinas`, todo
sigue como antes (scoop-lhd, frente-jumbo).

Contrato de `ejemplos/<tema>/montaje.js` → `pruebas(paso)`:

```js
{
  montaje, terreno,                                   // terreno: contrato B (piso, libre; libreCaja opcional)
  M, rango,                                           // compatibilidad: un modelo y su rango (si no hay `modelos`)
  modelos: { camion: Mc, pala: Mp },                  // modelo por equipo: fidelidad y rango
  rangos:  { camion: [{ etiqueta, valores }], pala: [...] },  // rango de cada modelo (sin terreno); si falta, M.muestrasRango
  maquinas: [{ id: "camión 1", equipo: "camion", M: Mc }, …, { id: "pala A", equipo: "pala", M: Mp }], // instancias; ids únicos
  ciclo: [{ etiqueta, porMaquina: { "camión 1": valores, …, "pala A": valores },  // valores con _pose, por instancia
            ruedasEnPiso?: bool | { id: bool }, cavidades? }],
}
```

- **Fidelidad**: `juzgarFidelidad(registro, modelos[e] ?? M)` por cada equipo de `ficha.equipos`.
- **Rango**: una física por modelo (`juzgarFisica(modelos[e], { poses: rangos[e] })`), línea `fisicaRango <e>` del
  informe; en la página, «Física · rango · <nombre del equipo>».
- **Ciclo**: `juzgarConjunto(maquinas, { ciclo, terreno })` (`juez/fisica.mjs`; con 200 poses o más, en hilos:
  `juzgarConjuntoHilos`, ver «Hilos»). Cada instancia pasa las ocho
  líneas de siempre con su `porMaquina[id]`, y todas juntas la línea **entre máquinas**. Una sola línea `fisicaCiclo`
  junta las fallas de todas (cada texto empieza con el id de la instancia) y guarda `instancias`, `maquinas`
  (`{ id, equipo, poses, fallas, aprobado }`) y `estadistica`. En la página: «Física · ciclo en la labor (N poses × M
  máquinas)» y «Física · ciclo · entre máquinas ✓».
- `porMaquina[id] = null`: la instancia no está en esa pose (no se juzga). Si falta su id, es falla (`rangos`).
- Falla de entre máquinas: `t=12.3 s: camión 3 (tolva) × pala A (cucharón) se atraviesan 85 mm`, con la peor pose
  de cada par de piezas.

**Caché (el juicio es el mismo, sin rehacerlo).** En una cola los camiones quedan quietos muchas poses.

| Qué | Depende de | Se guarda por |
|---|---|---|
| rangos, cierres, cilindros, interpenetración, puertos | las articulaciones: se juzga en el marco de la máquina (`_pose` en el origen, rumbo 0) | modelo + articulaciones (0,01° y 1 mm) |
| mangueras | articulaciones + cabeceo y alabeo (la gravedad vista desde la máquina) | modelo + eso |
| ruedas, roca | la pose entera, `cavidades` y `ruedasEnPiso` | modelo + pose (1 mm y 0,01°) |
| entre máquinas | las dos poses | el par de instancias + las dos poses: no se rejuzga si ya se juzgó |

Una pose reusada repite sus fallas con su propia etiqueta: los conteos son los de juzgar cada pose. Antes de bajar a
piezas, la caja de cada instancia (con 4 mm) descarta los pares lejanos; luego la caja de cada pieza.

**Lo caro es la roca**: `terreno.libre` en cada vértice (camión 230 t: 6280 vértices × 6,7 µs en `terrenoTajo`
≈ 42 ms por pose que cambia). Si el terreno da `libreCaja(lo, hi)`, una **cota inferior** de `libre` en esa caja,
el juez salta la máquina entera o la pieza cuya cota no baja de su tolerancia. El resultado es el mismo si la cota
es honesta. El juez la verifica: el primer salto y uno de cada 50 (`TOLERANCIAS.verificaCota`) se recorren punto a
punto igual. Si `libre` baja de la cota, la línea `roca` falla («libreCaja no es cota inferior…»). La cota la
escribe `roca-terreno` (`kit/contrato.js`). El juez no la inventa.

Plantas (`--plantas`, línea «física»): un «bloque» (chasis 2 × 1 × 1 m y cabina apoyada), dos instancias del mismo
modelo.

| Caso | Esperado |
|---|---|
| dos instancias que se atraviesan 10 cm | falla (100 mm) |
| separadas 5 cm | pasa |
| apoyadas, 3 mm (tolerancia 4 mm) | pasa |
| B girada 90° y metida 10 cm | falla |
| B encima de A, sin tocarla (las cajas se cruzan) | pasa |
| caché: A quieta, B entra en p2 entre poses lejanas repetidas | falla en p2 |
| caché: las poses repetidas (p1, p3) no se rejuzgan | pasa (2 pares reusados) |
| una instancia sin valores en `porMaquina` | falla |
| una instancia ausente (`null`) | pasa (no se juzga) |
| una instancia sola: las ocho líneas como `juzgarFisica`, movida y girada, con un brazo que se cruza | pasa (y la interpenetración aparece en las dos) |
| roca con `libreCaja` honesta: B hundida 20 cm | falla |
| roca con `libreCaja` honesta: las dos sobre el piso | pasa |
| roca con `libreCaja` mentirosa (+∞) | falla (la verificación la atrapa) |
| llanta 4 cm hundida (carro: chasis + `M.rueda` de 1 m) | `roca` pasa y `ruedas` pasa |
| llanta 8 cm hundida | `roca` falla (8,0 cm) y `ruedas` falla |
| chasis 4 cm dentro de la roca, rueda en el piso | `roca` falla (4,0 cm) |
| llanta 4 cm hundida con `ruedasEnPiso: false` | `roca` falla (1 cm, como cualquier pieza) |
| hilos: `juez/planta-hilos.mjs` (24 poses, 3 hilos, tramos de 4) contra `juzgarConjunto` | el mismo informe (JSON igual), con la pieza hundida (p5, p17), el choque (p9, p21) y la interpenetración empatada en p3 y p15 (gana p3) |
| hilos: un hilo con otra firma de ciclo | falla (error: no juzga) |

**Llantas en `roca` (19-10-2026, pedido de `orquestador-escenas`).** En la rampa en espiral `asentar` deja las ruedas
entre −2,9 y +0,7 cm del piso (`references/motor-b.md`). La línea `ruedas` acepta −6 cm (deflexión y barro), pero
`roca` juzgaba la llanta como cualquier pieza (1 cm) y reprobaba lo que `ruedas` aprueba («camión 1 · cerrado ·
11:13:45: rueda trasera int i entra 1.3 cm en la roca»). Regla: en `roca`, la pieza `llanta` cuyo nombre está en
`M.ruedas` usa `ruedaHundida` (6 cm) si las ruedas van en el piso (`ruedasEnPiso !== false`), porque ahí `ruedas` la
juzga con su propia regla. Con `ruedasEnPiso: false` (gatas, máquina levantada) vuelve a 1 cm. Aro, maza, ejes y
chasis siguen con 1 cm. No es bajar una tolerancia: es la misma tolerancia de la llanta en las dos líneas.

Prueba con dos `modeloScoop()` (19-10-2026): separadas 5 cm en z, pasa; superpuestas 10 cm, falla (6 pares, peor
39 mm: lateral del cucharón × cortador lateral); en cola con 30 cm entre cucharón y cola, pasa. 120–260 ms cada una.

**Tiempos medidos** (19-10-2026, máquina compartida con otros agentes): flota sintética en el fondo de `terrenoTajo`,
2000 poses × 14 máquinas (12 `modeloCamion`, 2 `modeloPala` con la tornamesa en vaivén), 4 camiones en cola quietos
(2 mm entre uno y otro) y 8 en marcha sin repetir posiciones.

| Caso | Juicios de terreno | Interna | Mundo (posar) | Terreno | Total |
|---|---|---|---|---|---|
| sin `libreCaja` | 12 560 hechos / 15 440 reusados | 6 s | 23 s | 548 s | **580 s** |
| con una `libreCaja` de prueba (1 muestra por caja; floja: la verificación la pilló mintiendo junto a las palas) | igual | 7 s | 24 s | 96 s | **131 s** |
| 4 en cola y 4 en marcha que repiten posiciones | 818 / 27 182 | 6 s | 14 s | 34 s | 57 s |

Sin `libreCaja`, ~2000 poses con 8 camiones en marcha no bajan de 3 min: cada pose de un camión que se mueve es
roca nueva (≈ 44 ms). Para llegar a ≲ 3 min hace falta `libreCaja` honesta en `terrenoTajo` (dueño:
`roca-terreno`), o un paso más largo en `pruebas(paso)`.

### Hilos (19-10-2026)

El ciclo del dispatch (`pruebas(0.1)`: 7434 poses × 14 máquinas) de corrido tarda ≈ 0,5 s por pose (≈ 1 h). Con
`P.maquinas` y 200 poses o más, `scripts/juez.mjs` lo juzga en hilos: `juzgarConjuntoHilos` (`juez/fisica.mjs`,
`juez/fisica-hilo.mjs`). `--hilos N` fija cuántos; `--hilos 1`, de corrido. Por omisión: núcleos − 1, hasta 12.

- Cada hilo importa el mismo `montaje.js`, llama `pruebas(paso)` y manda la **firma** (sha-256 de los ids, los
  equipos y el ciclo entero). Si no es la del principal, error: ese hilo no juzga.
- El principal reparte tramos contiguos (≈ 6 por hilo). Cada hilo los juzga con `tramoConjunto` y guarda sus cachés
  entre tramos (clave → fallas, sin etiqueta: el juicio es el mismo).
- `cerrarConjunto` junta las partes en el orden del ciclo: suma los conteos; `peor` es el primero de mayor |valor|;
  `ejemplos`, los primeros 8; el peor margen de cada par de piezas es el menor y, si empatan, el de la pose más
  temprana. Las fallas que se escriben al final (interpenetración, entre máquinas) se escriben ahí, una vez.
- `juzgarConjunto` es lo mismo con un solo tramo: el resultado es el de antes.
- Lo que no es idéntico: las cachés cuantizan (0,01°, 1 mm) y un hilo puede tomar otra pose representante del mismo
  casillero. A lo sumo cambia un decimal de un ejemplo, nunca el veredicto de la resolución que ya tenía el juez.

Verificado: en 300 poses del dispatch, hilos (12) y de corrido dan el mismo JSON de líneas y máquinas.

| Dispatch (19-10-2026, Core Ultra 7 155U, 14 hilos de CPU) | Tiempo |
|---|---|
| 40 poses (1000–1039), de corrido: antes / después (la regla de llantas no cambia el costo) | 21,6 s / 20,6 s (terreno 14,7 / 14,2) |
| 300 poses: de corrido / 12 hilos (con ≈ 60–90 s de `pruebas(0.1)` en cada hilo) | 127 s / 110 s |
| ciclo completo, 7434 poses × 14 máquinas, de corrido (estimado: 0,5 s por pose) | ≈ 60–70 min |
| ciclo completo en 12 hilos | **615 s**; el juez entero (`--sin-realismo`), 636 s |

Suma de los hilos en el ciclo completo: terreno 4919 s, interna 545 s, mangueras 594 s. Los núcleos chicos (E) van
≈ 1,45 veces más lentos que de corrido. Los hilos sirven para ciclos largos. Con menos de 200 poses, el costo de armar
`pruebas()` en cada hilo no se paga.

**Prefiltro de roca: por qué no.** Se probó un prefiltro jerárquico de esferas: si `libre(centro) ≥ K · radio`, no
se mira punto a punto. En 40 poses del dispatch, con K = 1, da 4,3× y 0 violaciones. Pero no es conservador por
construcción. Supone que `libre` nunca sobreestima la distancia a la roca, y la de `terrenoTajo` sí la sobreestima:
es la altura sobre la superficie dividida por la pendiente local. Junto a un escalón empinado puede dar varias veces la
distancia real:
- la tolva de la chancadora: 10 m de hondo en 0,5 m;
- el tope: 1,5 m en 0,4 m.

Justo ahí retrocede y descarga el camión: una tolva metida en el muro podía quedar saltada. Con K = 30 (la pendiente
de la tolva) ya no ahorra nada. El juez no inventa la cota. La vía buena sigue siendo `libreCaja` honesta en
`terrenoTajo` (dueño: `roca-terreno`): el juez ya la usa y la verifica.

## Realismo v3.1: la captura debe parecerse más a SU foto que a las otras

Por qué: la investigación visual (`investigacion/representacion-visual.md` V1–V3 y N1; `investigacion/rubrica.md` K2 y
§5; scripts en `<DATOS>/geotechnic\investigacion\evaluacion\scripts\`) midió capturas contra las fotos
equivocadas del mismo tema. Las métricas globales no distinguen la foto correcta: AUC de bordes 0,50, colorido 0,50,
Bhattacharyya 0,53–0,58 y luminancia 0,71, y en el scoop aprueba el 45 % de los pares cruzados. La estructura separa algo
mejor: HOG 0,68–0,73, SSIM 0,50–0,65 y chamfer de Canny 0,60–0,61.

| Sublínea | Regla | Decide |
|---|---|---|
| luminancia | \|Δ\| ≤ 0,22 | sí |
| contraste | desviación ×0,45–2,2 | sí |
| discrimina | HOG(captura, su foto) ≥ mediana de HOG(captura, fotos cruzadas) + 0,05. HOG en numpy: gris 256 × 160 tras el recorte, celdas de 16 px, 9 orientaciones sin signo, bloques 2 × 2 L2-Hys, correlación de Pearson entre descriptores (igual a `skimage.feature.hog`: correlación 1,0). Fotos cruzadas: todas las otras fotos abiertas de la ficha, con su recorte | sí (**provisional**) |
| bordes de forma (v3), bordes finos (v2), colorido, Bhattacharyya | — | no (informativos) |
| AUC correcto/cruzado del ejemplo (HOG, bordes, luminancia) | matriz capturas × fotos de los pares | no (diagnóstico) |

**Informativo (decisión de la sesión principal, 19-10-2026).** Se aplica la regla de la investigación
(`rubrica.md` §5): una métrica solo bloquea si da AUC ≥ 0,8 entre par correcto y cruzado **y** Spearman ≥ 0,5 contra el
puntaje del usuario en su criterio. Es automático: `realismo.py` mide el AUC de cada métrica (HOG, bordes, luminancia,
contraste, colorido) en el ejemplo. Los Spearman los lee de `puntajes.json` (4.º argumento,
`{"spearman": {"hog": 0.6}}`) y marca `bloquea` por métrica. Sin métricas que bloqueen, la línea es informativa:
`aprobado = true`, `informativo = true`, y `veredicto` guarda lo que diría la regla completa. Hoy ninguna llega (HOG
0,64; luminancia 0,70–0,79; contraste 0,49–0,71; bordes 0,47–0,53; colorido 0,47) y no hay puntajes. La consola limpia
sigue bloqueando por la línea de limpieza. `armar` ya no exige que el realismo apruebe, pero sí que la línea exista.
La página publicada dice «Realismo: informativo (v3.1)», con los AUC y el porqué.

**Cómo vuelve a bloquear.** (1) Pose igualada + IoU de silueta (abajo): sube el AUC porque compara la misma vista.
(2) Puntajes del usuario (`rubrica.md` §5, ≥ 30 capturas): dan el Spearman. Con AUC ≥ 0,8 y Spearman ≥ 0,5, la métrica
bloquea sola, sin tocar el código. Planta: `bloquea(auc, spearman)` con (0,85, sin puntajes) → no; (0,85, 0,6) → sí;
(0,64, 0,9) → no; (0,80, 0,50) → sí; (0,95, 0,3) → no.

Plantas (`--plantas`):

| Caso | Esperado | Resultado |
|---|---|---|
| par correcto: la forma de su foto en tonos papel, sin textura | pasa | HOG 0,71, cruzadas 0,07 |
| captura gris lisa | falla | 0,00 / 0,00 |
| promedio de las tres fotos, con pesos para que su HOG contra cada una sea igual | falla | margen +0,00 |
| otra escena del tema (túnel contra la foto de la máquina) | falla | margen −0,43 |
| horizonte vacío, sin máquina (**informativa**: hueco conocido) | debería fallar | pasa (+0,10); lo atrapará la IoU de silueta |

El promedio simple (pesos iguales) da +0,05, justo en el borde: un margen de 0,05 deja pasar capturas vagas que «tienen
un poco de todo».

Sobre las capturas del 19-10-2026 (14:48–14:50), por par:

| Ejemplo | Par | Δlum | Contraste | HOG | Mediana cruzada | Margen | v3 | v3.1 |
|---|---|---|---|---|---|---|---|---|
| scoop-lhd | LH517 de perfil | +0,06 | ×0,83 | 0,18 | 0,15 | +0,03 | pasa | falla |
| scoop-lhd | Cobar | +0,00 | ×0,55 | 0,11 | 0,08 | +0,03 | pasa | falla |
| scoop-lhd | LH410 | +0,17 | ×1,04 | 0,20 | 0,15 | +0,06 | pasa | pasa |
| scoop-lhd | bajo tierra | +0,07 | ×1,06 | 0,02 | 0,09 | −0,07 | pasa | falla |
| scoop-lhd | exhibición | +0,05 | ×0,69 | 0,17 | 0,14 | +0,03 | pasa | falla |
| frente-jumbo | Boomer E2C (dos brazos) | +0,17 | ×0,82 | 0,01 | 0,04 | −0,03 | pasa | falla |
| frente-jumbo | brazos y vigas | −0,03 | ×0,57 | 0,13 | 0,04 | +0,08 | pasa | pasa |
| frente-jumbo | al aire libre | −0,16 | ×0,58 | 0,12 | 0,08 | +0,04 | pasa | falla |
| frente-jumbo | frente de túnel | −0,08 | ×0,49 | 0,16 | 0,05 | +0,11 | pasa | pasa |
| frente-jumbo | portal de una mina | +0,08 | ×0,65 | 0,06 | 0,06 | +0,00 | pasa | falla |

**Resultado:** scoop 5/5 → 1/5 y jumbo 5/5 → 2/5 por la regla completa; ya no bloquea (informativo). AUC del ejemplo (scoop / jumbo): HOG
0,64 / 0,64, bordes 0,53 / 0,47, luminancia 0,70 / 0,79. Los HOG son bajos en todos los pares (0,01–0,20) porque la pose
no está igualada. Eso es lo siguiente.

### Para después (no implementado)

1. **Pose igualada + IoU de silueta ≥ 0,6** (rúbrica K2, nota 4), con máscara por ids. La captura sale con una pasada
   de ids por pieza. La foto necesita su máscara, marcada una vez por foto, y eso hoy no existe.
2. **Razones de proporción ≤ 10 %**: 4–8 puntos clave marcados en cada foto. Las razones entre ellos (p. ej. cucharón
   / llanta) contra las del modelo, con error de reproyección / diagonal ≤ 0,05.
3. **Puntajes del usuario** (`rubrica.md` §5) para el Spearman de cada métrica: la regla de bloqueo ya está en el
   código (arriba) y espera los puntajes.

## Realismo v3: realismo de forma (historia)

Por qué: el usuario pidió «No necesariamente tiene que ser 100 % realista… que se vea limpio, para estudio». En v2
el realismo pedía la textura de la foto y la limpieza la prohíbe. En el jumbo, con recortes amplios, «bordes» contra
la foto salía ≈ 12 × el ruido de la captura. Con ruido ≤ 0,0226 (limpieza) quedaba en ×0,26–0,36, y las fotos
(mangueras, gente, grava, pasto) piden ≥ 0,4: los dos jueces no podían aprobar a la vez.

| Cambio | v2 | v3 |
|---|---|---|
| bordes | gradiente medio a 512 px: cuenta la textura | gradiente medio con las dos imágenes **reducidas a 160 px** de ancho tras el recorte: cuentan silueta, brazos, vigas y mangueras gruesas, no pasto, grava ni óxido. Mismo rango ×0,4–2,5 |
| colorido | ×0,3–3 decidía | informativo (la paleta papel lo baja a propósito, `estudio.md`) |
| luminancia, contraste, aprobación | ±0,22 · ×0,45–2,2 · ≥ 60 % | sin cambio |
| captura | con las plaquitas HTML numeradas | sin plaquitas (`.geo-plaquitas` oculta durante las capturas del juez; suman ≈ 0,003 al ruido), y vuelven al final |

Plantas (`--plantas`, sintéticas en `realismo.py`): pasa la misma forma en tonos papel sin textura contra una foto con
grano fuerte (bordes de forma ×0,60; con la métrica v2 daba ×0,21). Fallan una captura gris lisa (×0,00) y otra
escena, un horizonte sin máquina (×0,06).

Sobre las capturas del 19-10-2026 (con plaquitas todavía), por par: bordes v2 → bordes de forma v3.

| Ejemplo | Par | v2 | v3 |
|---|---|---|---|
| scoop-lhd | LH517 de perfil | ×0,54 pasa | ×0,65 pasa |
| scoop-lhd | Cobar | ×0,45 pasa | ×0,66 pasa |
| scoop-lhd | LH410 | ×0,48, falla por colorido ×0,18 | ×0,63 pasa |
| scoop-lhd | bajo tierra | ×0,41 pasa | ×0,76 pasa |
| scoop-lhd | exhibición | ×0,57 pasa | ×0,94 pasa |
| frente-jumbo | Boomer E2C (dos brazos) | ×0,16 falla | ×0,25 falla (y contraste ×0,35) |
| frente-jumbo | brazos y vigas | ×0,26 falla | ×0,38 falla |
| frente-jumbo | al aire libre | ×0,45 pasa | ×0,65 pasa |
| frente-jumbo | frente de túnel | ×0,35 falla | ×0,55 pasa |
| frente-jumbo | portal de una mina | ×0,13 falla | ×0,19 falla |

scoop 4/5 → 5/5; jumbo 1/5 → 2/5 (reprobado). Las tres fallas del jumbo son de encuadre: la captura muestra un
detalle del brazo, el frente con la máquina casi fuera o una máquina chica en un plano vacío, donde la foto muestra
la máquina entera. Van a `orquestador-escenas` (vista y recorte), no a la textura.

## Limpieza (4.º juez)

Existe por el pedido del usuario: «no necesariamente tiene que ser 100 % realista… que se vea limpio, para estudio».
Se toma Anatomy a medias (`references/estudio.md`): colores papel, un solo acento, poco ruido, y ningún defecto de
modelado a la vista (mallas abiertas, interior vacío de llantas, bandas de sólido cortadas por el plano cercano, macizo
dibujado como un plano con bordes). Bloquea la publicación igual que las otras líneas.

| Línea | Qué verifica | Tope | Con qué | Planta (debe fallar) |
|---|---|---|---|---|
| cerradas | Toda `Mesh`/`InstancedMesh` visible de `GEO.escena.scene` es cerrada y orientada: tras soldar vértices (1e-5 m, coordenadas locales) y quitar triángulos degenerados, cada arista la comparten 2 triángulos en sentidos opuestos. Con la malla cerrada, volumen con signo > 0 (caras afuera; no se pide a `BackSide`). Exentos solo los calcos con `userData.calco = "motivo"` (en la malla o un padre), que se listan | 0 aristas abiertas, 0 no-variedad, 0 mal orientadas, 0 al revés | `revisarCerradas` (texto autocontenido: corre en la página por `eval` de `drive.mjs` y en Node) | Lathe abierta, Box sin una cara, cara volteada, cara repetida, Box espejada en la geometría, cilindro y tubo sin tapas, plano sin `calco` |
| corte | Regla de la ronda 3: se corta TODA la roca entre la cámara y el objetivo. `planoCorte(terreno, cam, dir, { objetivo, margen: 0.35 })` de `kit/estudio.js`. Si el segmento cámara→objetivo toca roca (muestreado cada 2 cm): hay plano, normal·mirada ≥ 0,999, el segmento plano + 2 cm → objetivo es todo aire (cada 2 cm) y el objetivo queda más allá del plano. Si es todo aire: `null`. Un objetivo dentro de la roca es falla | 0 fallas | Node: terreno de `pruebas()`. Cámaras: las vistas de la ficha, la vista inicial de la página, 240 al azar (semilla 7) alrededor de objetivos de la labor (`libre ≥ 0,4`; 1,5–18 m, −10° a 60°, azimut completo) y 64 vistas 3/4 desde fuera del bloque (8 objetivos × az 45/135/225/315 × el 24° × 10 y 14 m) | regla vieja (solo corta con la cámara en roca), `null` siempre, plano en la cámara, plano sin roca de por medio, normal invertida, plano 30 m más allá, plano en el primer aire de una pared con bolsillos de 5 cm, sin `kit/estudio.js` («sin corte de cámara») |
| paleta | Saturación HSV p90 de los píxeles con V > 0,15 en la zona del equipo (`vista.recorte`; la vista inicial, entera). Fracción de «acento» (S > 0,6): informativa | ≤ 0,45 en cada captura | `juez/limpieza.py` | `#d9a521` (amarillo v2) y `#c8452f` (rojo v2); pasa `#c4ad7c` (papel) |
| ruido | Media de \|Laplaciano\| (4 vecinos) de la captura entera en gris Rec. 709, reducida a 640 px de ancho | ≤ 0,0226 en cada captura | `juez/limpieza.py` | grano σ 0,02 (como la roca v2); pasan tonos lisos |
| capturas | Ninguna captura está vacía. Se mide en el interior, sin el 2 % de cada borde: vacía si la desviación de luminancia es < 0,01 o si > 98 % de los píxeles son de un solo color. Una vista vacía se repite sola: página recargada, `igualarVista`, `GEO.escena.marcar()`, 1500 ms y nueva captura, hasta 2 veces. Si sigue vacía, la línea falla con «captura vacía: <vista>», y además esa captura falla paleta y ruido | 0 vacías | `scripts/juez.mjs`, `limpieza.py --vacias` | lienzo liso color fondo (paleta y ruido); fondo liso con borde |
| consola | La página no escribe errores ni avisos | limpia | salida de `drive.mjs` | salida con `console.error` |

- Capturas: las del realismo (una por foto abierta) más `captura-0.png`, la vista inicial sin `igualarVista` (entra
  en paleta y ruido, no en realismo). `cerradas` corre tras la carga, antes de las vistas.
- `--sin-realismo` salta el navegador: limpieza solo juzga `corte` y el informe queda **parcial**. `armar` no publica
  con un informe parcial ni con uno sin las líneas de realismo y limpieza.
- Captura vacía (ronda 6, 19-10-2026): en la corrida final del scoop, `captura-3.png` («Sandvik LH410») salió con el
  lienzo color fondo (fallo pasajero del navegador sin pantalla; al repetirla salió bien). Una captura vacía daba paleta
  y ruido «limpios» (ruido 0). Esa captura mide 100 % de un solo color en el interior (98,2 % con el borde redondeado
  del lienzo, de ahí el interior); las vistas normales, ≤ 47 %. Antes de cada captura se llama `GEO.escena.marcar()`.
- `node scripts/juez.mjs --plantas` corre todas las plantas (sale 0 si cada caso da lo esperado).
- Corte, ronda 3 (19-10-2026): antes solo se cortaba con la cámara dentro de la roca (margen 0,1 m). Desde fuera del
  bloque, en vista 3/4, la pared tapaba la labor. Ahora se corta toda la roca hasta el objetivo (margen 0,35 m).
  Con la regla nueva, scoop-lhd y frente-jumbo: 309 cámaras cada uno, 0 fallas.

**Calibración del ruido (19-10-2026).** Las 10 capturas v2 (scoop-lhd y frente-jumbo; amarillo vivo, roca con grano
fuerte) dan \|Laplaciano\| 0,0265–0,0477, mediana 0,03228. Tope = 0,7 × 0,03228 = 0,0226: v3 pide al menos 30 % menos
ruido que v2. Las 10 v2 fallan.

**Paleta en v2.** Saturación p90: scoop 0,64–0,87 (las 5 fallan); jumbo 0,85–0,99 en las 3 vistas de galería, pero
0,19–0,20 en las 2 al aire libre, donde la máquina ocupa poco del recorte y mandan el cielo y el piso. La paleta ve la
zona del recorte, no la máquina: un recorte holgado la debilita (dueño del recorte: `orquestador-escenas`).

## Lo que encontró en esta versión (y quedó corregido en el modelo)

| Equipo | Hallazgo | Corrección |
|---|---|---|
| Scoop | Cilindros de dirección que cruzaban el enganche al articular | Pasadores por búsqueda numérica (razón 1,57) |
| Scoop | La palanca y la biela bajaban dentro de la nariz con el cucharón recogido en el piso | Nariz retrasada e inclinada |
| Scoop | El cucharón recogido a +10° pegaba en la bóveda de 4 m | Levante de descarga a +4° |
| Scoop | Mangueras en U con radio de 1 cm | Portado por el pasador (banjo) y tubo de acero a lo largo del barril |
| Jumbo | Los dos brazos se cruzaban (cada uno tomaba la mitad opuesta) | Cada brazo su lado y turnos anticolisión |
| Jumbo | La cabeza del brazo atravesaba el techo en la corona | Muñeca rediseñada: viga sobre la muñeca, rotación 180° para los bajos |
| Jumbo | La rotación de la viga junto al hastial pegaba en la roca | La viga se gira en la posición de reposo |
