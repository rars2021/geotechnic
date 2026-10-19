# Estudio: dibujo limpio para estudiar (v3)

El pedido del usuario: «No necesariamente tiene que ser 100 % realista… que se vea limpio, para estudio». Se toma el
craft de Anatomy (`anatomia/references/craft.md` §1, §2, §4, §7) **a medias**: no blanco y negro, pero sí colores papel,
un solo acento, contornos finos y ningún defecto de modelado a la vista. Lo vigila el 4.º juez, **limpieza**
(`references/juez.md`).

## Qué se toma de Anatomy y qué no

| Anatomy | En Geotechnic v3 |
|---|---|
| Paleta casi monocroma, papel = color de la tarjeta | Equipos en tonos papel apagados; roca en grises cálidos poco saturados |
| Un solo acento encendido (`lit`) | Solo la pieza señalada (y el color que es el tema: malla pintada rojo/azul, grupos de salida) |
| Líneas finas de contorno | Modo lámina encendido por defecto con tinta suave (opacidad ≈ 0,35) |
| Calma: sin ruido de textura | Ruido de color de la roca a la mitad; trazas de juntas tenues |
| Nada abierto, nada que atraviese | Toda malla cerrada; el corte de cámara tiene tapa; el macizo es un bloque cerrado |
| Volumen por tonos cercanos | Luz suave; las tapas de corte son planas color papel con contorno |
| Sin texto, sin hachurado en el dibujo | Las tapas no llevan hachurado de adorno. Excepción: la **lámina geológica** (abajo) pone el patrón FGDC de cada unidad, que es convención de corte, no ruido |

No se toma: el render SVG iso (ver `arquitectura.md`), el blanco y negro estricto, la cámara fija.

## Paleta papel (`kit/estudio.js` → `PALETA`)

Los colores son tokens con valor claro y oscuro (§7 de Anatomy: «every colour is a token»).

| Token | Uso | Claro | Oscuro |
|---|---|---|---|
| `pintura` | carrocería del equipo (antes amarillo vivo `#d9a521`) | `#c4ad7c` | `#b39d6e` |
| `pinturaB` | segundo color de equipo (perforadora, antes `#c8452f`) | `#a86f60` | `#9a6558` |
| `acero` | pasadores, vástagos sin cromo, estructura | `#6f6c66` | `#66635e` |
| `goma` | llantas | `#3a3835` | `#34322f` |
| `manguera` | mangueras | `#2e2d2a` | `#2a2927` |
| `gris` | piezas neutras | `#8f8c85` | `#85827b` |
| `roca` | base de la roca (mezcla 50 % hacia su gris) | se calcula | se calcula |
| `tapa` | cara de corte (tapa de sección): más clara y cálida que `fondo`, para que la sección se lea contra él | `#efe5cf` | `#48423a` |
| `tinta` | contornos (lámina) | `#2a2622` | `#d9d2c6` |
| `acento` | solo la pieza señalada (y el precipitado de Fe bajo agua, si un tema lo usa) | `#c2382c` | `#ec6a5c` |
| `negro` | piezas negras (antes `#222120`) | `#4a4844` | `#43413d` |
| `aluminio` | aluminio y vástagos (antes cromo) | `#aeaba4` | `#a19e97` |
| `vidrio` | vidrio de cabina, **opaco** | `#4b5357` | `#454c50` |
| `laton` | latón apagado | `#9c8a63` | `#8f7f5b` |
| `barro` | suciedad y barro de la pintura | `#8a7e6c` | `#7d7262` |
| `luz`, `luzRoja` | faros y balizas (emisivos) | `#fff4dc`, `#ff5a3c` | iguales |
| `ambiente` | luz ambiente subterránea, neutra (antes `#4a443c`, cálida) | `#474747` | igual |
| `fondo` | fondo de la escena bajo tierra con `estudio: true` (= lienzo de la página; antes `#050505`) | `#d9d4cb` | `#262321` |

Codificaciones del tema (convención, con leyenda; S ≤ 0,45 y luminancia ordenada):

| Token | Uso | Claro | Oscuro |
|---|---|---|---|
| `codigo` (lista de 8) | orden de un proceso: grupos de salida (`COLORES_GRUPO` de `kit/procesos.js`: arranque → arrastre, de oscuro a claro) | `#4d365d` `#7e4d49` `#567094` `#9c765b` `#589888` `#d77d9b` `#99ab63` `#bdad6e` | `#6b4d80` `#9f655f` `#6c8bb5` `#bd9171` `#6eb7a4` `#fe98ba` `#b7cc7a` `#e0ce87` |
| `cargado` · `vacio` | malla de frente: taladro cargado / vacío (alivio) | `#8c5b51` · `#627b9e` | `#c78577` · `#86a5d1` |
| `papelCaliza` … `papelMena` | papel de cada unidad en la lámina geológica (ver abajo) | tonos papel S < 0,15 | oscuros |

`roca`: `apagarColor(hex, 0.5)` (en JS) o `parcharRoca(m, { apagar: 0.5 })` (en el shader, sobre los colores por
vértice). Por defecto `apagar` = 0: lo activa la escena.

Saturación HSV de un equipo en pantalla: p90 ≤ 0,45 (lo mide el juez).

## Sólidos cerrados

- Toda `THREE.Mesh` de la escena es **cerrada y orientada**: cada arista la comparten exactamente dos triángulos, en
  sentidos opuestos (tras soldar vértices por posición, 1e-5 m). Las caras delanteras (por el giro de sus vértices)
  miran al aire.
- Excepción declarada: calcos finos pegados a una superficie (pintura de la malla, charcos, bocas de taladro, línea
  de gradiente). Llevan `userData.calco = "motivo"`. Nada más se exime.
- Llantas: neumático + aro cerrados por los dos lados (no se ve el interior vacío desde ningún ángulo).
- Mangueras: tubos con tapa en los dos extremos.
- Roca: **macizo cerrado** (`kit/labor.js` → `macizoCerrado`): galería + frente + caja exterior en un solo sólido.
  Detrás del frente no hay un plano con bordes: hay roca hasta la cara trasera del bloque.

## Corte de cámara (`kit/estudio.js` → `corteCamara`)

1. **Tapa**, en dos partes:
   - **En el plano de corte (capping por stencil, `corteCamara`)**: tras el render normal, en una máscara fuera de
     pantalla (con stencil), por cada grupo (tapa lisa: equipos y roca sin unidad; luego cada unidad de la lámina) se
     cuentan las caras traseras (+1) y delanteras (−1) de sus sólidos (capa `CAPA_TAPA` = 31 o 30; sin calcos),
     recortadas por el mismo plano y sin prueba de profundidad. Donde la cuenta no es 0, el punto del plano está dentro
     de un sólido y la máscara guarda el id del grupo (el último gana). En pantalla, un cuadro sobre el plano pinta la
     tapa (token `tapa`, tal cual, o el patrón de la unidad) donde la máscara tiene su id, con prueba de profundidad: lo
     que queda dentro de la roca más allá del plano (pernos, trazas, tubos, lámina) no asoma sobre la tapa.
     No se usa `gl_FragDepth` en las caras traseras: escribir la profundidad del plano en TODA cara trasera pintaría de
     tapa los sólidos enteros que están más allá del plano (su cara trasera ganaría a su propia cara delantera).
   - **Contorno** (Anatomy §5, «a clip cut is an edge»): un pase de pantalla dibuja en tinta (token `tinta`, opacidad
     0,8, ≈ 1,5 px) donde cambia el id de la máscara: el borde de la sección y los contactos entre unidades.
     `esc.corte.borde(false)` lo apaga.
   - **Plano fijo**: `esc.corte.fijar(plano | { punto, normal } | null)`. Un corte lateral (p. ej. `z ≤ 1,4`:
     `fijar({ punto: [0, 0, 1.4], normal: [0, 0, -1] })`, la normal apunta a lo que se conserva) usa la misma tapa,
     lámina y contorno; el de cámara queda en pausa hasta `fijar(null)`. No hacen falta planos locales en los
     materiales ni esconder pernos: todo lo que está dentro de la roca queda bajo la tapa. Con la cámara del lado que
     se conserva, la tapa queda detrás de lo conservado (prueba de profundidad), pero el contorno se dibuja encima.
   - **Plano cercano** (sin corte activo): `tapar(material)` deja doble cara y pinta la cara trasera plana con `tapa`.
     En un sólido cerrado la cara trasera solo se ve donde el plano cercano lo corta.
2. **Plano (regla v3)**: se corta TODA la roca entre la cámara y el objetivo (lo que mira: `controls.target`), venga la
   cámara de dentro de la roca o del aire exterior del bloque (vista 3/4 desde fuera: sin corte solo se veía la cara
   de la caja). `planoCorte(terreno, camPos, camDir, { objetivo, margen: 0.35, paso: 0.05, max: 40 })` →
   `null | { punto, normal, distancia }` (pura, sin THREE; la prueba el juez en Node):
   - el segmento [cámara, objetivo] no toca roca (`libre ≥ 0` cada `paso`) → `null`;
   - si la toca, s* = el último paso de roca a aire antes del objetivo (bisección) y el plano va en s* + margen,
     perpendicular a la mirada (`normal` = mirada: se conserva lo de más allá). De s* al objetivo todo es aire; si el
     objetivo está a menos de 2 × margen, el margen se recorta a la mitad de ese tramo: el objetivo queda más allá;
   - objetivo dentro de la roca (un taladro del frente): s* = el último paso de roca a aire antes del último aire que
     precede al objetivo (queda el cuerpo de roca que lo contiene); sin aire antes, plano a `margen` antes del objetivo.
   El plano corta la cara de la caja exterior y el contorno de la galería: las dos secciones salen con la tapa (el
   macizo es cerrado y la roca está tapada). Margen 0,35 m: con 0,1 m un frente rugoso dejaba islas de tapa.
3. **Sin objetivo** (compatibilidad v2): con la cámara en aire, `null`; en roca, el primer tramo de aire **continuo**
   sobre la mirada: el primer s con `libre ≥ 0` en todo [s, s + margen + 0,05] (cada 1 cm; los bolsillos de ~5 cm del
   relieve no cuentan), plano en s + margen; si no sale a aire en `max`, plano a `max`. No se usa «el punto a `max`
   como objetivo»: una cámara en la galería que mira por el túnel cortaría en la cara lejana del bloque y lo
   recortaría todo.
4. `corteCamara` pasa `esc.controls.target` (u `op.objetivo()`) en cada cuadro.

## Lámina geológica (opcional, por ficha)

Convención C3 (`investigacion/representacion-visual.md` §5 y §8): en un corte geológico cada unidad lleva su patrón
FGDC. Apagada por defecto; la sección de los equipos sigue lisa.

- Cada malla (o su grupo) de una unidad: `userData.unidad = { fgdc, papel?, orden?, celda?, opacidad? }`.
  `fgdc`: código o nombre (tabla). `papel`: token o hex (por defecto el del patrón). `orden`: la unidad con más orden
  queda encima (una zona dentro del macizo). `celda`: m por celda del patrón. `opacidad`: tinta, 0,35.
- Encender: `crearEscena(…, { corte: m.ter, corteOp: { lamina: true } })` o `esc.corte.lamina(true)`.
  `esc.corte.unidades()` dice cuántas unidades se pintaron en el último cuadro.
- Cada unidad debe ser un sólido cerrado por sí sola (el stencil cuenta solo sus mallas). Si el macizo es una malla
  con varios materiales (galería, frente, caja), la unidad va en esa malla.
- El patrón es procedural (shader de la tapa), en tinta (token `tinta`) sobre el papel de la unidad, en coordenadas
  del plano de corte: V = vertical del mundo proyectada (capas horizontales), U = V × normal. Celda = potencia de 2
  cercana al 5 % de la distancia al plano (≈ 0,5 m a 11 m), o `op.celda`.

| Patrón | FGDC (gh:davenquinn/geologic-patterns, CC0) | Nombre aceptado | Papel |
|---|---|---|---|
| Ladrillos | 627 | `caliza` | `papelCaliza` |
| Ladrillos sesgados | 642 | `dolomia` | `papelDolomia` |
| Puntos | 607 | `arenisca` | `papelArenisca` |
| Guiones | 620 | `lutita` | `papelLutita` |
| Cruces | 721 | `intrusivo` | `papelIntrusivo` |
| V | 711 | `toba`, `volcanica` | `papelVolcanica` |
| Ondas | (sin código verificado) | `metamorfica`, `ondas` | `papelMetamorfica` |
| Triángulos | 605 | `brecha`, `relleno` | `papelBrecha` |
| Círculos | 601 | `conglomerado`, `morrena` | `papelConglomerado` |
| Rombos llenos | 733 | `mena`, `oxidos` | `papelMena` |
| Listones | 729, 730 | `porfido` | `papelPorfido` |

## API (`kit/estudio.js`)

| Función | Qué hace |
|---|---|
| `PALETA.claro / .oscuro` · `temaActual()` · `tono(token, tema?)` | Tokens; `tono` deja pasar un hex |
| `hexRGB(hex)` · `apagarColor(hex, f)` | Hex → [r, g, b] 0..1 (sin pasar a lineal) · mezcla hacia su gris |
| `tapar(material, { shadowSide })` · `sinTapa(material)` | Tapa de corte (doble cara, trasera plana `tapa`, sombra con `BackSide`); la deshace |
| `retintar(raiz, tema?)` | Cambio de tema: materiales con `userData.token` / `tokenTinta` y la tapa de todos |
| `sinDegenerados(g)` | Quita triángulos con dos vértices en la misma posición (polo de un torno) |
| `planoCorte(terreno, cam, dir, { objetivo, margen, paso, max })` | Puro: `null` o `{ punto, normal, distancia }` |
| `corteCamara(esc, terreno, op)` → `{ activo(), plano(), apagar(), encender(), fijar(p), fijo(), lamina(on), borde(on), unidades(), actualizar() }` | Envuelve `esc.renderizar`; tapa por stencil (`op.tapa: false` la quita), contorno (`op.borde: false`, `op.anchoBorde`, `op.opacidadBorde`) |
| `CAPA_TAPA` (31) | Capa que `corteCamara` marca en cada sólido tapado para contar el stencil (la 30 es de las unidades) |
| `PATRONES_FGDC` | Código o nombre → [patrón del shader, papel] |
| `esc.corte.lamina(on)` · `esc.corte.unidades()` | Lámina geológica; unidades pintadas en el último cuadro |

Detalles de `tapar`: encadena con el `onBeforeCompile` previo y su `customProgramCacheKey`; pinta tras
`#include <dithering_fragment>` (espacio de salida: el token sale tal cual). Un material transparente no se tapa; si se
vuelve transparente después, al recompilar deja de pintar la tapa, pero sigue en doble cara: en rayos X, `sinTapa`.
Todo material de `kit/materiales.js` sale tapado (`op.tapa === false` lo evita); el vidrio es transparente y queda igual.

Detalles de `corteCamara`: el plano está siempre en `renderer.clippingPlanes`; sin corte queda aparcado 1 km detrás de
la cámara (no recorta nada) para no recompilar los programas al entrar y salir de la roca. `apagar()` lo quita.
`crearEscena(cont, { corte: terreno, corteOp })` lo engancha y lo deja en `esc.corte`; `localClippingEnabled` va siempre.

## Mapeo de tonos

ACES satura el papel en sombra (`#c4ad7c` sube de S 0,37 a 0,51 con poca luz). `crearEscena(…, { estudio: true })`
usa mapeo lineal; `op.mapeo: "aces" | "lineal"` lo fija aparte. En lineal la exposición se multiplica por
`EXPOSICION_LINEAL` (1,15: ACES lleva el gris 0,18 a ≈ 0,21 y 0,5 a ≈ 0,56), así la escena pasa el mismo número que
usaba con ACES. Sin `estudio` ni `mapeo` sigue ACES (talud-tajo no cambia). La tapa no pasa por el mapeo: se escribe
en el espacio de salida y sale tal cual.

## Cómo lo usa una escena

- `crearEscena(…, { estudio: true, corte: m.ter, exposicion })`: mapeo lineal, corte de cámara, fondo papel bajo
  tierra (`esc.fondo`; `retintar(esc.scene)` lo cambia con el tema) y la misma exposición de antes. Si la escena
  cambia el fondo a mano (p. ej. al mostrar la galería), que use `esc.fondo`, no `#050505`.
- `crearEscena(…, { corte: m.ter })` en toda escena con roca alrededor. **Sin corte, una cámara dentro de la roca ve
  la tapa plana de la pared** (antes la veía a través, por la cara trasera descartada).
- Rayos X (frente transparente): `sinTapa(mat)` antes de bajar la opacidad; `tapar(mat)` al volver.
- Calcos finos (pintura de malla, charcos, bocas, gradiente): `userData.calco = "motivo"`.
- Lo que está pegado a la pared del lado de la cámara (tuberías, manga, pernos dentro de la roca) queda seccionado
  por el plano: se ve como una banda llena color `tapa`. Ocúltalo mientras `esc.corte.activo()` si estorba.

## Lo que mide el juez de limpieza

Ver `references/juez.md`, sección «Limpieza». Bloquea la publicación igual que física, fidelidad y realismo.
