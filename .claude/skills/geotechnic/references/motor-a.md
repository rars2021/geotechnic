# Motor A · equipos y mecanismos

Modelo puro en `motorA/modelo.js` (corre en Node para el juez y en la página); dibujo en `motorA/mallas.js`.
Mundo de la máquina: metros, x adelante, y arriba, z izquierda, origen en el piso. Todo se escribe **en reposo**.

## Reglas (de Anatomy, `anatomia/references/craft.md` y `3d.md` §5, adaptadas)

| # | Regla | Por qué |
|---|---|---|
| A1 | Lista de piezas por grupo, en el encabezado del modelo, antes de la geometría | Cada pieza tiene un trabajo; si no cae en ninguna, sobra |
| A2 | Solo sólidos convexos. Una forma cóncava son varias piezas convexas unidas («palanca» y «palanca baja») | El juez separa pares convexos de forma exacta |
| A3 | Contactos a ras o con holgura; atravesar solo con `unir(a, b, motivo)` | Pasador en su ojo, vástago en su barril, soldadura. Cada unión dice por qué |
| A4 | Articulación = pasador que atraviesa las dos piezas, con tapas | Nada flota, nada se atraviesa salvo el pasador |
| A5 | Cilindro de pasador a pasador; su largo sale de la pose | El juez exige que quede entre retraído y extendido, perpendicular a sus pasadores |
| A6 | Manguera de puerto a puerto, cada puerto en la cara de su racor | El juez exige ambos extremos anclados, sin estirarse, sin doblarse bajo 4 diámetros, sin atravesar nada |
| A7 | Una manguera cruza una bisagra junto a su eje (banjo en el pasador, `portado: "pasador"`) o se corta para todo su rango | Regla de Anatomy: ninguna línea viva cruza dos grupos lejos del eje |
| A8 | Medidas con fuente en `equipos/<equipo>/medidas.js`; el resto «estimado» con nota | La verdad primero |
| A9 | Los rangos son los físicos: los encuentra el juez (tope de descarga −96°, volteo de viga −40°…+12°) y se anotan donde se definen | Un rango libre esconde choques |

## API

| Llamada | Qué hace |
|---|---|
| `maquina(nombre)` | Constructor `M` |
| `M.grupo(n, { padre, bisagra: { punto, eje, rango }, desliza: { dir, rango }, reposo })` | Grupo rígido con pose |
| `M.prisma({ F, poligono, s0, s1, bisel })` · `M.caja({ centro, tam })` · `M.placa({ perfil, z })` · `M.losa({ perfil, y })` · `M.pared({ perfil, x })` | Prismas convexos (perfil en x–y, x–z o z–y) |
| `M.redondo({ F, s0, s1, r \| r0, r1, extremos })` · `M.barra({ de, a, r })` | Cilindros, conos, cápsulas |
| `M.rueda({ centro, eje, diametro, ancho })` | Llanta + maza; queda registrada para el contacto con el piso |
| `M.pasador({ punto, eje, r, largo, une, tapas })` | Pasador con tapas; une las piezas que atraviesa |
| `M.cilindro({ de: { grupo, punto }, a: { grupo, punto }, eje, rBarril, rVastago, rOjo, anchoOjo, inicioTubo, ladoPuertos, tuboCabeza, portado, banjos, pasadores })` | Barril, fondo, cuello, glándula, vástago cromado, ojos, pasadores, racores o banjos, tubo de cabeza con abrazaderas |
| `M.puerto(n, { grupo, punto, normal, pieza, reorientar })` · `M.manguera({ de, a, r, largo, holgura, salida, seno, libres })` | Mangueras con su largo real; la curva cuelga (o se arquea hacia `seno`) |
| `M.cadena(nombre, fn)` | Cierre de una cadena (barra en Z): resuelve grupos dependientes y devuelve el residuo |
| `M.dimensionar(muestras)` · `M.dimensionarMangueras(muestras)` · `M.orientarPuertos(pose)` | Cilindros y mangueras dimensionados para el rango de trabajo; codos apuntados al otro extremo |
| `M.posar(valores)` → `{ T, raiz, cil, mang, mundo(g, p) }` · `M.cascos(pose)` | Pose y cascos en el mundo (lo que juzga el juez) |
| `mallasMaquina(M, { lamina, estudio })` → `{ raiz, poner(v), objetosDe(id), grupo(n), mundo(g, p), lamina(on), cascos(on) }` | Dibujo three.js de exactamente esa geometría |

## Acabado de estudio (v3)

Ver `references/estudio.md`. `materialesA` toma los colores de `PALETA` (`kit/estudio.js`): `pintura`, `pinturaB`
(material `rojo`), `acero`, `goma`, `manguera`, `gris`, `aluminio` (también `cromo`), `vidrio` (opaco), `laton`,
`negro`. El `color` / `colorAro` / `colorPerforadora` de la ficha solo cuentan con `estudio: false`. Suciedad y barro a
la mitad, sin óxido. Todo material va tapado (`tapar`). La lámina (aristas en tinta, opacidad 0,35, umbral 32°) está
encendida por defecto; `lamina(false)` la apaga.

Toda malla es cerrada y orientada (lo prueba el juez de limpieza, `revisarCerradas`): el redondo pierde sus triángulos
degenerados del polo (`sinDegenerados`), la llanta es neumático cerrado + aro macizo, y cada manguera lleva tapa en los
dos extremos. No se cambia ninguna forma: lo que se ve es lo que juzga la física.

## Taller

`node scripts/taller.mjs <equipo>` arma `taller-<equipo>.html`: el equipo solo, sobre un piso, con
`TALLER.poner({...})`, `TALLER.cascos(true)` (lo que ve el juez) y `TALLER.lamina(on)` (encendida por defecto). Es el banco de cada agente.

## Equipos hechos en el motor A

| Equipo | Piezas | Mecanismo | Juez |
|---|---|---|---|
| Scoop CAT R1600G | 260 | Articulación ±42,5°, brazos, barra en Z (palanca, biela) que cierra de −96° a +64°, 5 cilindros, 8 mangueras | Rango 189 poses y ciclo de carguío en la galería: aprobado |
| Jumbo de dos brazos | 244 | Por brazo: giro, alzada, telescópico, muñeca (giro y volteo), rotación de viga 0–180°, avance de viga, carro; cinemática inversa a cada emboquille; 8 cilindros, 8 mangueras | Rango 43 poses y ciclo de 41 taladros con los dos brazos y turnos anticolisión: aprobado |
| Camión, pala, perforadora, empernador, shotcrete, volquete, cargador | — | Siguen en `kit/equipos.js` (v1) | Pendiente: cada agente los pasa al motor A |
