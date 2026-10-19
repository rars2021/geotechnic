# Motor de dibujo: por qué three.js y cómo está armado

## La decisión

| Opción | Sirve para | Por qué no (o sí) como motor principal |
|---|---|---|
| SVG / isométrica (sstutor-anatomia) | Objetos mecánicos limpios, láminas | No puede mostrar una cara de roca irregular, un óxido que se desvanece, agua que brilla ni polvo. Se queda para laboratorio. |
| Canvas 2D | Esquemas, gráficos, paneles de dispatch | Sin luz ni volumen: el macizo se vuelve un dibujo plano. Útil para paneles auxiliares. |
| **WebGL con three.js** | Mallas procedurales, luz y sombra, materiales físicos, animación | **Elegido.** El realismo de una cara de banco sale de la luz rasante sobre facetas reales; eso solo lo da un render 3D con sombras. three.js carga desde jsDelivr, sin compilar, y funciona en un Artifact. |

La mezcla: 3D para la escena; HTML para plaquitas, lista, cuestionario y tablas (accesibles, en ambos temas);
SVG o canvas solo para paneles auxiliares (red de Schmidt con `polosSchmidt`, línea de tiempo de una flota).

## Cómo se logra el realismo sin texturas

| Técnica | Dónde | Efecto |
|---|---|---|
| Malla procedural densa (0,1–0,3 m) | `mallaTalud`, `galeria`, `frente` | La forma real: estrías, bloques, cresta rota, escombros apoyados |
| Relieve en bloques por familias (DFN) | `relieveBloques` | Facetas planas con aristas, como caras de juntas |
| Color por vértice con zonas gradacionales | `colorRoca`, `zona` | Alteración y óxidos que se desvanecen; tono por bloque |
| Ruido 3D en el shader | `parcharRoca`, `materialPintura` | Rugosidad fina sin texturas; barro y desgaste en equipos |
| Atributos `humedad` y `region` | material de roca | Agua (oscurece y brilla) y resaltado de piezas para SSTutor |
| Luz física | `crearEscena` | ACES, sol con sombra, cielo, bruma exponencial; bajo tierra solo faros y casco |
| Instancias | escombros, pernos, montones | Miles de bloques sin costo |

## Armado de una página

`scripts/armar.mjs` concatena los módulos del kit (quita `import` y `export`, los nombres son únicos) y la escena del
ejemplo en un solo `<script type="module">`, con un `importmap` a `three@0.160.0` (versión fija, de más de dos semanas).
La página no lleva doctype: el Artifact pone el esqueleto. Las fotos abiertas van como archivos de apoyo (`ref/*.jpg`).

## Presupuesto

| Escena | Vértices | Arranque |
|---|---|---|
| Talud 92 m, paso 0,28 m | ≈ 200 k + 5 k bloques | 2–4 s |
| Galería 36 m, paso 0,11 m | ≈ 120 k | 1–2 s |

Si un equipo modesto sufre: subir `paso`, bajar `cantidad` de escombros, `mapaSombra: 1024`.
