# Arquitectura: dos motores, un contrato, un juez y un agente por equipo

## Por qué cambió

La crítica a la v1, mirando el jumbo y el scoop:

| Defecto de la v1 | Causa | Cómo lo resuelve la v2 |
|---|---|---|
| Ni preciso ni paramétrico | Cajas y placas puestas a ojo, una función por máquina | Motor A: cada equipo es una lista de sólidos con sus medidas con fuente; todo lo demás se deriva |
| Cables y mangueras sueltos | Tubos dibujados entre dos puntos cualesquiera | Toda manguera va de puerto a puerto; cada puerto está sobre la superficie de su racor; el juez lo verifica en cada pose |
| Sólidos metidos en otros | Nada lo comprobaba | El juez separa cada par de sólidos convexos con el separador de planos de Anatomy, en todo el rango y todo el ciclo |
| Cilindros que no llegan a sus pasadores | `apuntar(a, b)` estiraba el barril | Un cilindro es barril + vástago entre dos pasadores; su largo sale de la pose y el juez exige que quede dentro de su carrera |
| Equipos rudos | Pocas piezas, sin uniones | Disciplina de Anatomy: 200–260 piezas por equipo, horquillas, ojos, tapas, racores, abrazaderas, barra en Z |
| Lo bueno: la roca | Malla procedural con DFN | Se queda como motor B y gana ruido explícito, métodos documentados y el contrato |

## Las cuatro piezas

```
              ┌──────────── contrato (kit/contrato.js) ────────────┐
   motor B ── piso · contorno · libre(p) · frente · emboquilles ──▶ motor A
   (roca)  ◀── huellas · polvo · taladros · carga ───────────────── (equipo)
              └───────────────────────┬─────────────────────────────┘
                                      ▼
                     montaje.js (por ejemplo): terreno + máquina + ciclo
                          │                         │
                    escena.js (página)        juez (Node) ──▶ informe + sello
                                                    │
                                    armar.mjs: sin sello aprobado, no hay index.html
```

| Pieza | Archivos | Qué decide |
|---|---|---|
| Motor A · equipos y mecanismos | `motorA/modelo.js` (puro), `motorA/mallas.js` (three.js), `equipos/<equipo>/` | Geometría convexa, grupos (fijo, bisagra, desliza), pasadores, cilindros, mangueras, ruedas, cadenas cerradas |
| Motor B · roca y terreno | `kit/macizo.js`, `kit/labor.js`, `kit/terreno.js`, `kit/fracturas.js`, `kit/volumenes.js`, `kit/materiales.js` | Macizo (DFN, facetas, ruido, alteración, agua, polvo), galerías, frentes, taludes |
| Contrato | `kit/contrato.js` | Lo que cada motor le da al otro (abajo) |
| Juez | `juez/fisica.mjs`, `juez/fidelidad.mjs`, `juez/realismo.py`, `scripts/juez.mjs` | Aprueba o bloquea la publicación |
| Agentes | `.claude/agents/*.md` del repo | Un dueño por equipo, más roca, escenas y juez |

## Decisión: el 3D de Anatomy no va dentro de la escena de roca

Anatomy tiene un motor 3D propio (`turn`, `gl`): SVG isométrico con cámara fija, partes convexas reproyectadas y orden de
pintado resuelto por planos separadores. Se evaluó meterlo en la escena de roca. No:

| Razón | Detalle |
|---|---|
| Cámara | El turn de Anatomy gira alrededor de un eje vertical con cámara isométrica fija. La escena de roca necesita cámara en perspectiva libre, dentro de la galería |
| Oclusión | El SVG se pinta por orden, sin z-buffer: la roca (WebGL) no puede tapar una parte del equipo ni recibir su sombra |
| Luz | Bajo tierra solo alumbran los faros del equipo: la luz tiene que ser la misma en roca y máquina |
| Costo | La auditoría de órbita de Anatomy toma 30–40 s por pieza (`3d.md` §13): un scoop de 260 piezas sería más de 2 h por corrida |

Lo que sí se trae de Anatomy (copiado sin cambios en `anatomia/`, MIT, con `LICENSE-anatomy`):

| De Anatomy | En Geotechnic |
|---|---|
| Disciplina de piezas (`craft.md`): lista antes de la geometría, piezas pequeñas con propósito, sin líneas que terminan en el aire | Cada `equipos/<equipo>/modelo.js` empieza con su lista de piezas por grupo |
| Modelo 3D (`3d.md` §2, §5): grupos con pose, solo partes convexas, contactos a ras, pasadores con disco de articulación, «ninguna línea viva cruza dos grupos salvo por el eje de la bisagra» | `motorA/modelo.js` (`maquina`, `grupo`, `prisma`, `redondo`, `pasador`, `cilindro`, `manguera`); el portado «por el pasador» con banjo aplica la regla de la bisagra |
| Separador de planos y GJK (`turn-build.mjs`: `separate`, `gjk`) | `juez/fisica.mjs` los importa tal cual para la interpenetración |
| Auditoría (`audit.mjs`, `turn-audit.mjs`: posed, terminals, folds) | Mismas líneas en el juez: interpenetración en cada pose, puertos sobre su pieza, doblez mínimo |
| `drive.mjs`, `lines.mjs` | Capturas del juez y del taller |

La combinación: **un solo mundo three.js**. El motor A construye y anima sólidos con la disciplina de Anatomy; el motor B
construye la roca; ambos se dibujan con la misma luz y la misma cámara. El modo «lámina» agrega las aristas en tinta
(el aspecto de Anatomy) sobre el equipo, sin salir de la escena.

## Contrato entre motores

| Sentido | Qué | Función | Lo usa |
|---|---|---|---|
| B → A | Piso bajo cada rueda y cada gata | `terreno.piso(x, z)`, `asentar(M, valores, terreno)` | Ruedas apoyadas, cabeceo y alabeo de la máquina |
| B → A | Contorno real de la sección (con sobreexcavación) | `terreno.contorno(x)` | Límites de colisión |
| B → A | Distancia con signo a la roca | `terreno.libre(p)` | El juez: nada dentro de la roca |
| B → A | Superficie del frente | `superficieFrente(gal)`, `terreno.frenteX(y, z)` | Emboquilles y separación del centralizador |
| B → A | Emboquilles sobre el frente real | `emboquillesMalla(malla, frente)` | Cinemática inversa del jumbo |
| A → B | Huellas (trocha de las ruedas) | `huellasDe(M)` → `galeria({ huellas })` | Surcos del piso donde pisa el equipo |
| A → B | Polvo (emisores con grupo y punto) | `estado(t).emisores`, `dib.mundo(g, p)` | Nube en el labio del cucharón, en la broca |
| A → B | Taladros perforados | `estado(t).hecho`, `cavidades` | Bocas en el frente, tubos en el macizo; el juez deja entrar barra y broca solo ahí. La cavidad empieza donde arranca la broca (collar − separación): el frente es rugoso y la broca corta desde el primer contacto |
| A → B | Material cargado | `estado(t).carga` | Carga en el cucharón; descarga en el echadero |

## Juez

Ver `juez.md`. Tres líneas (física, fidelidad, realismo); `armar` no escribe `index.html` sin su sello.

## Agentes

Ver `agentes.md` y `.claude/agents/` del repo: `equipo-scoop`, `equipo-jumbo`, `equipo-camion`, `equipo-pala`,
`equipo-perforadora`, `equipo-empernador`, `equipo-shotcrete`, `equipo-volquete`, `equipo-cargador`, `roca-terreno`,
`orquestador-escenas`, `juez`.
