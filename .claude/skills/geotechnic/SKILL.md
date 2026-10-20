---
name: geotechnic
description: Dibuja cualquier tema de minería o geología con apariencia casi real y números verdaderos, en 3D interactivo (three.js) publicado como Artifact en tema claro y oscuro. Úsala para modelar un equipo (scoop, camión, pala, jumbo, perforadora, cargador, empernador, shotcrete, volquete), mostrar un corte de talud o un macizo con fracturas, alteración, fallas, agua, hielo o polvo, una labor subterránea con su sostenimiento, o un proceso animado (perforación de un frente, voladura, carguío y acarreo, dispatch, ventilación, relleno, planta, relaves), a cualquier escala (cerro, tajo, banco, labor, frente, testigo, probeta). Sirve a SSTutor (cada relación es una pieza o región señalable, modos completo y en blanco) y a cualquier otro uso. No reemplaza a sstutor-anatomia, que sigue para objetos mecánicos isométricos de laboratorio.
compatibility: Claude Code. Node.js 20+ (npm install en la carpeta de la skill trae three 0.160 para el juez); Python con numpy y Pillow para el realismo; Chrome o Edge para verificar (scripts/drive.mjs). Las fotos de referencia se reúnen con el catálogo de fuentes (<REPOS>catalogo/).
---

# Geotechnic

Dibujos 3D casi reales de minería y geología, publicados como una sola página three.js. Desde la v2 los arman **dos
motores que se alimentan entre sí**, los prueba un **juez** antes de publicar y los mantiene **un agente por equipo**.

## Arquitectura (v2)

| Pieza | Qué es | Dónde |
|---|---|---|
| Motor A · equipos y mecanismos | Sólidos convexos con grupos, pasadores, cilindros de pasador a pasador y mangueras de racor a racor. Disciplina de Anatomy (wheresryan22/anatomy, MIT, copia en `anatomia/`) | `motorA/`, `equipos/<equipo>/` · `references/motor-a.md` |
| Motor B · roca y terreno | Macizo con DFN, facetas, ruido explícito, alteración gradacional, agua y polvo; galerías, frentes, taludes | `kit/macizo.js`, `kit/labor.js`, `kit/terreno.js` · `references/motor-b.md` |
| Contrato | B → A: piso, contorno, `libre(p)`, frente, emboquilles. A → B: huellas, polvo, taladros, carga | `kit/contrato.js` · `references/arquitectura.md` |
| Estudio (v3) | Dibujo limpio para estudiar, Anatomy a medias: equipos en colores papel, un solo acento, contornos finos, roca calma; toda malla cerrada, tapas de sección y corte real de cámara; el macizo es un bloque cerrado | `kit/estudio.js` · `references/estudio.md` |
| Juez | Física (interpenetración, rangos, cierres, cilindros, mangueras, ruedas, roca), fidelidad (medidas con fuente), realismo (capturas contra fotos) y limpieza (mallas cerradas, corte de cámara, paleta, ruido). **Sin su aprobación, `armar` no escribe `index.html`** | `juez/`, `scripts/juez.mjs` · `references/juez.md` |
| Agentes | Uno por equipo (scoop, jumbo, camión, pala, perforadora, empernador, shotcrete, volquete, cargador), roca y terreno, estudio visual, orquestador de escenas, juez | `.claude/agents/` del repo · `references/agentes.md` |

Por qué el equipo no se dibuja con el 3D SVG de Anatomy dentro de la roca (cámara fija, sin z-buffer contra WebGL,
otra luz, auditoría de horas): `references/arquitectura.md`. Se trae su modelo, su disciplina y su separador de planos;
todo se dibuja en un solo mundo three.js, con un modo «lámina» que agrega las aristas en tinta.

## La regla: la verdad primero

| Qué | Regla |
|---|---|
| Números | Cada medida, ángulo, capacidad o tiempo sale de una fuente con clave el catálogo de fuentes y página. Va en la tabla «de dónde sale cada número» de la página. |
| Sin fuente | Se marca **estimado** o **ilustrativo** en esa misma tabla. Nunca se presenta como dato. |
| Formas | Cada rasgo visual sigue una regla de `references/reglas-*.md`, aprendida mirando fotos reales. |
| Lectura | El texto bajo el dibujo sale del mismo modelo que mueve la escena (ángulo interrampa, taladros perforados, retardo). |
| Fotos | Se comparan lado a lado. Solo se incrustan fotos con licencia abierta; las figuras de tesis quedan como referencia de estudio, citadas y no incrustadas. |

## Cuándo usarla

- Ver cómo es algo real: un equipo, un talud, una labor, un afloramiento, un testigo.
- Ver cómo funciona un proceso: perforación, voladura, carguío, acarreo, dispatch.
- Estudiar o evaluar en SSTutor: cada relación es una pieza señalable; modo **en blanco** para rotular de memoria.
- Para un objeto mecánico de laboratorio en isométrica (prensa, caja de corte, celda triaxial) usa `sstutor-anatomia`.

## Cómo pedir un tema nuevo

Un pedido trae cuatro cosas. Si falta una, se pregunta o se elige la más común y se dice.

| Campo | Ejemplo |
|---|---|
| Tema y escala | «Lanzado de shotcrete en una galería de 4,5 × 4,0 m» · escala labor |
| Qué debe verse o moverse | «el brazo lanzando, el espesor que crece, el rebote al piso» |
| Piezas (relaciones) | lista de 5 a 15 piezas con nombre y definición de ≤ 20 palabras |
| Modo | completo, en blanco o ambos; si es para SSTutor, la pieza en foco |

Ejemplos de pedidos que funcionan:

- «Geotechnic: un camión 793 descargando en la chancadora primaria, escala instalación, piezas tolva, visera, cilindros de levante, parrilla, muro de seguridad.»
- «Geotechnic: macizo con tres familias y una falla, escala afloramiento, para la relación R2 (familias) en modo en blanco.»
- «Geotechnic: dispatch de 8 camiones entre 2 palas y una chancadora, con la política de despacho condicional.»

`references/temas.md` tiene la receta de cada tema del alcance (qué piezas del kit usar y qué rasgos reales no pueden faltar).

## Flujo

0. **Clasifica el pedido** en seis ejes (`references/categorias.md`): ambiente (cerrado, abierto, bloque, mixto,
   aislado, sin espacio), dominio (geológico, geotécnico, hidrogeológico, geoestadístico, geoespacial, minero operativo,
   técnico de equipos, procesamiento, minero comercial, ambiental y social, seguridad, legal, minería artesanal,
   minería ilegal), propósito, escala, forma y riesgo. El ambiente decide el corte: **solo los cerrados se cortan; los
   abiertos usan colisión de cámara, como Anatomy**. La minería ilegal se desalienta: nunca procedimientos; sí impactos,
   consecuencias y la vía de formalización.
1. **Reúne referencias con el catálogo de fuentes** (`references/fotos.md`):
   - Figuras de tesis y papers: `leyendas.py` + `capturar.py` sobre los textos de el catálogo de fuentes (leyenda → página → recorte).
   - Fotos abiertas: Wikimedia Commons u otra fuente CC, registradas en el catálogo de fuentes con `catalogo.py sembrar <url> --titulo … --tipo imagen`.
   - Todo va a `<DATOS>/geotechnic\figuras\<tema>\` (estudio) y `…\<tema>\abiertas\` (incrustables), cada carpeta con su `fuentes.json`.
2. **Mira las fotos de verdad** (léelas con la herramienta Read, con hojas de contacto) y anota rasgos y proporciones. Si un rasgo es nuevo, va a `references/reglas-*.md` con su fuente.
3. **Junta los números** en las tesis del catálogo (`textos\` de el catálogo de fuentes): grep, lectura de la página, clave de la ficha.
4. **Equipos** (agente `equipo-<equipo>`): modelo en el motor A con sus medidas (`equipos/<equipo>/`), probado en el
   taller (`node scripts/taller.mjs <equipo>`) hasta que el juez aprueba su rango y su fidelidad.
5. **Escribe el ejemplo** en `ejemplos/<tema>/` (agente `orquestador-escenas`):
   - `ficha.mjs`: título, resumen, `equipos`, piezas, controles, tabla de fuentes (`filasMedidas`), vistas con `recorte`.
   - `montaje.js`: macizo, galería y contrato (motor B), máquinas asentadas (motor A), ciclo `estado(t)`; exporta `pruebas(paso)`.
   - `escena.js`: `async function montar(ctx)` que dibuja el montaje (`mallasMaquina`) y deja `window.GEO = { escena, senal, igualarVista }`.
6. **Juzga**: `node scripts/juez.mjs ejemplos/<tema> --salida <scratchpad>/dist --incrustar` → `juez/informe.md`. Cada falla vuelve a su dueño.
7. **Arma**: `node scripts/armar.mjs ejemplos/<tema> --salida <scratchpad>/dist --incrustar` → `index.html` solo si el juez aprobó con el sello vigente.
8. **Verifica como un crítico** (`references/verificar.md`): capturas en claro y oscuro, cada modo, la animación en varios cuadros, la hoja del realismo.
9. **Publica** `index.html` con la herramienta Artifact (si ya existe: `read` primero y `publish` con su `url`).

## Modos (una relación = una pieza o región)

| Modo | Qué se ve | Para qué |
|---|---|---|
| Completo | Plaquitas numeradas; al pasar el cursor o tocar, el nombre y el resaltado de la pieza; lista con definiciones; tabla de fuentes | Estudiar |
| En blanco | Solo números; sin lista, sin fuentes; cuestionario de rotulado (aprueba con 80 %) | Evaluar de memoria |

Una pieza puede ser un objeto (cucharón, brazo), un grupo (familia de fracturas) o una **región** de una malla
(cara, cresta, berma, zona de óxidos) marcada con el atributo `region` y resaltada en el shader.
La pieza en `foco` (SSTutor) lleva el número en rojo. Detalle en `references/kit.md` → `senalar`.

## Archivos

| Ruta | Qué es |
|---|---|
| `kit/nucleo.js` | Azar con semilla, ruido 3D, fbm, muestreos (lognormal, exponencial, Fisher), color |
| `kit/escena.js` | Renderer, cielo andino, sol con sombra, bruma, cámara, bucle de animación |
| `kit/materiales.js` | Roca con relieve fino en shader, pintura sucia, acero gastado, paletas medidas en fotos |
| `kit/terreno.js` | Perfil de bancos, malla de talud, escombros, medias cañas, cerros, pretil, cortes de bloque |
| `kit/fracturas.js` | DFN de discos por familia, relieve en bloques facetados, trazas reales sobre la malla |
| `kit/volumenes.js` | Zonas gradacionales (alteración, óxidos, panizo), agua, hielo, polvo, goteo |
| `kit/macizo.js` | Macizo: DFN, facetas, ondulación de juntas y aspereza con ruido explícito, alteración, agua; su `metodologia` |
| `kit/contrato.js` | Contrato entre motores: `terrenoGaleria` (piso, contorno, libre, frente, cavidades), `emboquillesMalla`, `huellasDe`, `asentar` |
| `motorA/modelo.js` · `motorA/mallas.js` | Motor A: modelo puro de máquinas (Node y página) y su dibujo three.js |
| `equipos/<equipo>/` | Un agente por equipo: `medidas.js` (con fuente) y, en el motor A, `modelo.js` (scoop y jumbo hoy) |
| `kit/equipos.js` | v1 heredada: llanta (la usa el motor A), y camión, pala, perforadora, cargador, empernador, shotcrete, volquete hasta que sus agentes los pasen al motor A |
| `juez/` · `scripts/juez.mjs` | Juez: física, fidelidad, realismo, limpieza; informe y sello |
| `kit/estudio.js` | Paleta papel (tokens claro/oscuro), `tapar`, `planoCorte`, `corteCamara` |
| `scripts/taller.mjs` | Banco de un equipo solo (cascos y lámina) para su agente |
| `scripts/codigo.mjs` | Junta kit, motores y equipos en el módulo de la página; sello de fuentes |
| `anatomia/` | Copia sin cambios del kit, scripts y referencias de Anatomy (MIT, `LICENSE-anatomy`) |
| `kit/labor.js` | Galería con sobreexcavación, frente, pernos, shotcrete, manga, tuberías, charcos |
| `kit/procesos.js` | Mallas de perforación reales, orden de perforación, líneas de tiempo, simulación de flota (dispatch) |
| `kit/senalar.js` | Plaquitas, resaltado y modos |
| `scripts/armar.mjs` | Junta kit + ejemplo en una página (sin doctype) y copia o incrusta (`--incrustar`) las fotos abiertas |
| `scripts/fotos/` | Reunir figuras de tesis (`leyendas.py`, `capturar.py`) y fotos abiertas (`commons_*.py`, `registrar_ttdata.py`) |
| `ejemplos/comun.mjs` | `abierta()`, `estudio()`, `cita()`: leen `fuentes.json` y arman las referencias de una ficha |
| `scripts/drive.mjs` | Capturas en Chrome sin interfaz (de sstutor-anatomia, MIT; ver `scripts/LICENSE-anatomy`) |
| `ejemplos/talud-tajo` | Corte de talud de tajo (Antamina) · [publicado](https://claude.ai/artifact/9yawDfHqMnZNYZ8oQcCBgz) |
| `ejemplos/scoop-lhd` | Scoop CAT R1600G (motor A, 387 piezas, barra en Z y medidas de la hoja CAT) en galería en sección, con ciclo de carguío juzgado · [publicado](https://claude.ai/artifact/NYN2ccWp45UG4kF4R9D2cn) |
| `ejemplos/frente-jumbo` | Jumbo de dos brazos (motor A, 458 piezas) perforando 41 taladros con cinemática inversa y turnos anticolisión · [publicado](https://claude.ai/artifact/ExfpKUHYm9oJmTS1fw91y3) |
| `ejemplos/dispatch` | Flota en el tajo: 12 camiones CAT 793 y 2 palas P&H 4100 (motor A) sobre `terrenoTajo`, `simularFlota` con colas FIFO y tres políticas, panel de tiempos y colas · [publicado](https://claude.ai/artifact/NNLK6JisqpF5SaFWTinYUV) |
| `sstutor/` · `scripts/sstutor.mjs` | Paquete commiteable para SSTutor (figura del frente con jumbo, semilla, módulo 3D, test); ver `references/sstutor.md` |
| `references/` | `arquitectura.md` (motores, contrato, juez, agentes, decisión sobre Anatomy), `motor-a.md`, `motor-b.md`, `juez.md`, `estudio.md`, `categorias.md`, `agentes.md`, `motor.md` (por qué three.js), `kit.md` (API), `reglas-*.md`, `temas.md`, `fotos.md`, `verificar.md` |
