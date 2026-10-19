---
name: geotechnic
description: Dibuja cualquier tema de minería o geología con apariencia casi real y números verdaderos, en 3D interactivo (three.js) publicado como Artifact en tema claro y oscuro. Úsala para modelar un equipo (scoop, camión, pala, jumbo, perforadora, cargador, empernador, shotcrete, volquete), mostrar un corte de talud o un macizo con fracturas, alteración, fallas, agua, hielo o polvo, una labor subterránea con su sostenimiento, o un proceso animado (perforación de un frente, voladura, carguío y acarreo, dispatch, ventilación, relleno, planta, relaves), a cualquier escala (cerro, tajo, banco, labor, frente, testigo, probeta). Sirve a SSTutor (cada relación es una pieza o región señalable, modos completo y en blanco) y a cualquier otro uso. No reemplaza a sstutor-anatomia, que sigue para objetos mecánicos isométricos de laboratorio.
compatibility: Claude Code. Node.js 20+ para armar; Chrome o Edge para verificar (scripts/drive.mjs). Las fotos de referencia se reúnen con el catálogo de fuentes (<REPOS>catalogo/).
---

# Geotechnic

Dibujos 3D casi reales de minería y geología. Cada dibujo es una escena three.js armada con un kit propio
(terreno, fracturas, volúmenes, equipos, labores, procesos) y publicada como una sola página.

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

1. **Reúne referencias con el catálogo de fuentes** (`references/fotos.md`):
   - Figuras de tesis y papers: `leyendas.py` + `capturar.py` sobre los textos de el catálogo de fuentes (leyenda → página → recorte).
   - Fotos abiertas: Wikimedia Commons u otra fuente CC, registradas en el catálogo de fuentes con `catalogo.py sembrar <url> --titulo … --tipo imagen`.
   - Todo va a `<DATOS>/geotechnic\figuras\<tema>\` (estudio) y `…\<tema>\abiertas\` (incrustables), cada carpeta con su `fuentes.json`.
2. **Mira las fotos de verdad** (léelas con la herramienta Read, con hojas de contacto) y anota rasgos y proporciones. Si un rasgo es nuevo, va a `references/reglas-*.md` con su fuente.
3. **Junta los números** en las tesis del catálogo (`textos\` de el catálogo de fuentes): grep, lectura de la página, clave de la ficha.
4. **Escribe el ejemplo** en `ejemplos/<tema>/`:
   - `ficha.mjs`: título, resumen, piezas, controles, tabla de fuentes y referencias (ver los tres ejemplos).
   - `escena.js`: `async function montar(ctx)` que arma la escena con el kit y deja `window.GEO = { escena, senal, igualarVista }`.
5. **Arma**: `node scripts/armar.mjs ejemplos/<tema> --salida <scratchpad>/dist` → `index.html` (se publica), `ref/*.jpg`, `vista.html` y `comparar.html` (locales).
6. **Verifica como un crítico** (`references/verificar.md`): capturas en claro y oscuro, cada modo, la animación en varios cuadros, la comparación con 3 o más fotos. Corrige lo que no se parezca a la foto.
7. **Publica** `index.html` con la herramienta Artifact, con `files` para `ref/*.jpg`. Si los archivos sueltos no se pueden publicar, arma con `--incrustar` (las fotos van dentro de la página).

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
| `kit/equipos.js` | Llanta, cilindro, cabina, faro; scoop, camión, pala, jumbo, perforadora de tajo, cargador, empernador, shotcrete, taladros largos, volquete |
| `kit/labor.js` | Galería con sobreexcavación, frente, pernos, shotcrete, manga, tuberías, charcos |
| `kit/procesos.js` | Mallas de perforación reales, orden de perforación, líneas de tiempo, simulación de flota (dispatch) |
| `kit/senalar.js` | Plaquitas, resaltado y modos |
| `scripts/armar.mjs` | Junta kit + ejemplo en una página (sin doctype) y copia o incrusta (`--incrustar`) las fotos abiertas |
| `scripts/fotos/` | Reunir figuras de tesis (`leyendas.py`, `capturar.py`) y fotos abiertas (`commons_*.py`, `registrar_ttdata.py`) |
| `ejemplos/comun.mjs` | `abierta()`, `estudio()`, `cita()`: leen `fuentes.json` y arman las referencias de una ficha |
| `scripts/drive.mjs` | Capturas en Chrome sin interfaz (de sstutor-anatomia, MIT; ver `scripts/LICENSE-anatomy`) |
| `ejemplos/talud-tajo` | Corte de talud de tajo (Antamina) · [publicado](https://claude.ai/artifact/9yawDfHqMnZNYZ8oQcCBgz) |
| `ejemplos/scoop-lhd` | Scoop CAT R1600G en galería, con ciclo de carguío · [publicado](https://claude.ai/artifact/NYN2ccWp45UG4kF4R9D2cn) |
| `ejemplos/frente-jumbo` | Perforación de un frente 4 × 4 m con jumbo y secuencia de salida · [publicado](https://claude.ai/artifact/ExfpKUHYm9oJmTS1fw91y3) |
| `references/` | `motor.md` (por qué three.js), `kit.md` (API), `reglas-roca.md`, `reglas-equipos.md`, `reglas-luz.md`, `reglas-procesos.md`, `temas.md`, `fotos.md`, `verificar.md` |
