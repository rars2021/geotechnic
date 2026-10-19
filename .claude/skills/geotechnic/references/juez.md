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
| interpenetración | Ningún par de sólidos se atraviesa, salvo uniones declaradas | 4 mm | `gjk` y `separate` de Anatomy, con los ejes de cada pieza como pistas |
| rangos | Cada articulación dentro de su rango físico | exacto | rangos del modelo |
| cierres | Cada cadena (barra en Z) cierra | 2 mm | `M.cadena` |
| cilindros | Largo entre retraído y extendido; perpendicular a sus pasadores | carrera geométrica; cos ≤ 0,035 | `pose.cil` |
| mangueras | Ancladas en sus dos puertos, sin estirarse, radio ≥ 4 diámetros, sin atravesar sólidos ni otra manguera | 6 mm | `pose.mang` |
| puertos | Cada puerto sobre la superficie de su racor | 4 mm | casco del racor |
| ruedas | Apoyadas en el piso del terreno (ni en el aire ni hundidas) | +2 cm / −6 cm | `terreno.piso` |
| roca | Ningún vértice del equipo dentro de la roca; contacto real para piezas `tocaRoca` (centralizador, pies de gata, fondo del cucharón); barra y broca solo dentro de su taladro | 1 cm (3,5 cm) | `terreno.libre`, `enCavidad` |
| fidelidad | Cada medida con fuente contra el modelo | la de cada medida | `equipos/<e>/medidas.js`, `medir` |
| realismo (v3.1, **informativo**) | Captura en el punto de vista de cada foto abierta contra la foto (zona del equipo): luminancia ±0,22, contraste ×0,45–2,2 y discrimina (HOG contra su foto ≥ mediana contra las otras fotos abiertas del tema + 0,05); ≥ 60 % de los pares. Se calcula y se informa, con el AUC correcto/cruzado de cada métrica. **Solo bloquea una métrica con AUC ≥ 0,8 y Spearman ≥ 0,5** contra el puntaje del usuario. Hoy ninguna llega y no hay puntajes: no entra en la aprobación. La línea tiene que existir (prueba que el juez corrió el navegador) | — | `juez/realismo.py` |
| ~~realismo v3~~ (historia) | Igual, pero decidían bordes estructurales (160 px) ×0,4–2,5; colorido informativo | — | reemplazado por v3.1 |
| ~~realismo v2~~ (historia) | Igual, pero bordes a 512 px ×0,4–2,5 y colorido ×0,3–3 decidían | — | reemplazado por v3 (ver abajo) |

| limpieza | Dibujo limpio para estudio (4.º juez, ver abajo) | ver abajo | `juez/limpieza.mjs`, `juez/limpieza.py` |

La física corre dos veces: en el **rango** del modelo (sin terreno: articulaciones, envolvente de trabajo) y en el
**ciclo** del ejemplo (con el terreno del motor B, paso 0,1 s).

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
| consola | La página no escribe errores ni avisos | limpia | salida de `drive.mjs` | salida con `console.error` |

- Capturas: las del realismo (una por foto abierta) más `captura-0.png`, la vista inicial sin `igualarVista` (entra
  en paleta y ruido, no en realismo). `cerradas` corre tras la carga, antes de las vistas.
- `--sin-realismo` salta el navegador: limpieza solo juzga `corte` y el informe queda **parcial**. `armar` no publica
  con un informe parcial ni con uno sin las líneas de realismo y limpieza.
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
