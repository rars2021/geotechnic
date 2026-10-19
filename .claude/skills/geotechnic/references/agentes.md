# Agentes

Un agente por equipo, dueño de su modelo, sus medidas con fuente y sus pruebas; un agente de roca y terreno; un
orquestador de escenas; un agente de estudio visual; y el juez. Las definiciones están en `.claude/agents/` del repo
geotechnic.

| Agente | Es dueño de | Entrega | Lo aprueba |
|---|---|---|---|
| `equipo-scoop` | `equipos/scoop/` | Modelo en el motor A, medidas con fuente, `EQUIPO_SCOOP` | Juez: rango del modelo y fidelidad |
| `equipo-jumbo` | `equipos/jumbo/` | Modelo, cinemática inversa `apuntarJumbo`, medidas | Juez: rango, fidelidad, ciclo de perforación |
| `equipo-camion` · `equipo-pala` · `equipo-perforadora` · `equipo-empernador` · `equipo-shotcrete` · `equipo-volquete` · `equipo-cargador` | `equipos/<equipo>/` | Hoy: `medidas.js` con fuente; pasar el modelo de `kit/equipos.js` al motor A | Juez |
| `roca-terreno` | `kit/macizo.js`, `labor.js`, `terreno.js`, `fracturas.js`, `volumenes.js`, `contrato.js` (lado B) | Macizos, galerías, frentes, taludes, macizo cerrado; contrato B → A | Juez: roca y ruedas en los ciclos; realismo; limpieza (macizo cerrado, roca calma) |
| `estudio-visual` | `kit/estudio.js`, `kit/materiales.js`, `motorA/mallas.js`, la llanta de `kit/equipos.js`, `kit/escena.js` | Paleta papel con tokens claro/oscuro, tapas de sección, corte de cámara, lámina, sólidos cerrados de los equipos | Juez: limpieza |
| `orquestador-escenas` | `ejemplos/<tema>/` (ficha, montaje, escena) | Junta motor A y motor B por el contrato, define ciclos y vistas | Juez completo; publica |
| `juez` | `juez/`, `scripts/juez.mjs`, `references/juez.md` | Cuatro jueces (física, fidelidad, realismo, limpieza), informe, sello y bloqueo | — (no corrige modelos: devuelve los hallazgos al dueño) |

## Flujo entre agentes

1. El orquestador recibe el pedido (tema, escala, piezas, modo) y abre una tarea por equipo y una de terreno.
2. Cada agente de equipo trabaja en su carpeta y en el taller hasta que el juez aprueba su rango y su fidelidad.
3. El agente de roca entrega el terreno y el contrato B → A.
4. El orquestador escribe `montaje.js` (terreno + máquinas + ciclo) y `escena.js`, y corre el juez completo.
5. Un hallazgo vuelve al dueño de la pieza (equipo, roca o ciclo); nadie toca la carpeta de otro.
6. Con «JUEZ: APROBADO», el orquestador arma y publica.

## Cómo se hizo la ronda v3 (estudio)

El pedido («que se vea limpio, para estudio»; equipos en color papel; corte real de cámara; macizo que no sea un
plano; ruedas sin interior vacío) se repartió así, con archivos disjuntos para trabajar a la vez:

| Paso | Agente | Archivos | Entrega |
|---|---|---|---|
| 0 | orquestador (sesión principal) | `references/estudio.md` | La especificación común: tokens, sólidos cerrados, regla del corte |
| 1a | `juez` | `juez/limpieza.*`, `scripts/juez.mjs`, `references/juez.md` | 4.º juez con plantas (casos que lo hacen fallar) |
| 1b | `estudio-visual` | `kit/estudio.js`, materiales, mallas, llanta, escena | Papel, tapas, corte de cámara, llantas y mangueras cerradas |
| 1c | `roca-terreno` | `kit/labor.js`, `macizo.js`, `contrato.js` | Macizo cerrado, `libre` fuera del bloque, roca calma |
| 2 | `orquestador-escenas` | `ejemplos/*/escena.js`, fichas | Bloque cerrado + corte + calcos + vistas; juez completo |
| 3 | orquestador | — | Los cuatro jueces aprueban → armar → publicar |

Para repetirla desde Claude Code: pide al orquestador «aplica references/estudio.md a <tema>»; él lanza 1a–1c en
paralelo (son independientes) y después 2.

## Reglas comunes

- La verdad primero: cada número con clave el catálogo de fuentes y página, o «estimado» con nota.
- Datos pesados fuera del repo (`<DATOS>/geotechnic`).
- No tocar SSTutor ni `sstutor-anatomia` (Anatomy se usa desde la copia en `anatomia/`).
- Modos completo y en blanco; una relación por pieza señalable; tema claro y oscuro; Artifacts privados.
- Estudio: colores de `PALETA` (nunca sueltos), un solo acento, toda malla cerrada salvo calcos declarados.
- Nombres de nivel superior únicos en todo el kit (las páginas concatenan los módulos).
