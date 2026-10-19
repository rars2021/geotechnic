# Agentes

Un agente por equipo, dueño de su modelo, sus medidas con fuente y sus pruebas; un agente de roca y terreno; un
orquestador de escenas; y el juez. Las definiciones están en `.claude/agents/` del repo geotechnic.

| Agente | Es dueño de | Entrega | Lo aprueba |
|---|---|---|---|
| `equipo-scoop` | `equipos/scoop/` | Modelo en el motor A, medidas con fuente, `EQUIPO_SCOOP` | Juez: rango del modelo y fidelidad |
| `equipo-jumbo` | `equipos/jumbo/` | Modelo, cinemática inversa `apuntarJumbo`, medidas | Juez: rango, fidelidad, ciclo de perforación |
| `equipo-camion` · `equipo-pala` · `equipo-perforadora` · `equipo-empernador` · `equipo-shotcrete` · `equipo-volquete` · `equipo-cargador` | `equipos/<equipo>/` | Hoy: `medidas.js` con fuente; pasar el modelo de `kit/equipos.js` al motor A | Juez |
| `roca-terreno` | `kit/macizo.js`, `labor.js`, `terreno.js`, `fracturas.js`, `volumenes.js`, `materiales.js`, `contrato.js` (lado B) | Macizos, galerías, frentes, taludes; contrato B → A | Juez: roca y ruedas en los ciclos; realismo |
| `orquestador-escenas` | `ejemplos/<tema>/` (ficha, montaje, escena) | Junta motor A y motor B por el contrato, define ciclos y vistas | Juez completo; publica |
| `juez` | `juez/`, `scripts/juez.mjs`, `references/juez.md` | Informe, sello y bloqueo | — (no corrige modelos: devuelve los hallazgos al dueño) |

## Flujo entre agentes

1. El orquestador recibe el pedido (tema, escala, piezas, modo) y abre una tarea por equipo y una de terreno.
2. Cada agente de equipo trabaja en su carpeta y en el taller hasta que el juez aprueba su rango y su fidelidad.
3. El agente de roca entrega el terreno y el contrato B → A.
4. El orquestador escribe `montaje.js` (terreno + máquinas + ciclo) y `escena.js`, y corre el juez completo.
5. Un hallazgo vuelve al dueño de la pieza (equipo, roca o ciclo); nadie toca la carpeta de otro.
6. Con «JUEZ: APROBADO», el orquestador arma y publica.

## Reglas comunes

- La verdad primero: cada número con clave el catálogo de fuentes y página, o «estimado» con nota.
- Datos pesados fuera del repo (`<DATOS>/geotechnic`).
- No tocar SSTutor ni `sstutor-anatomia` (Anatomy se usa desde la copia en `anatomia/`).
- Modos completo y en blanco; una relación por pieza señalable; tema claro y oscuro; Artifacts privados.
