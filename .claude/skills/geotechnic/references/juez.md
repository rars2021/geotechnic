# Juez de control de calidad

Automático, con informe, y llave de la publicación: `armar` no escribe `index.html` si el informe no aprueba o si
alguna fuente cambió después (sello sha-256 de kit, motor A, equipos, ficha, montaje y escena).

```bash
node scripts/juez.mjs ejemplos/<tema> --salida <scratchpad>/dist --incrustar
node scripts/armar.mjs ejemplos/<tema> --salida <scratchpad>/dist --incrustar
```

Salida en `<salida>/<tema>/juez/`: `informe.md`, `informe.json`, `hoja-realismo.png`, capturas. La página publicada
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
| realismo | Captura en el punto de vista de cada foto abierta contra la foto (zona del equipo): luminancia ±0,22, contraste ×0,45–2,2, bordes ×0,4–2,5, colorido ×0,3–3; aprueba con ≥ 60 % de los pares; consola limpia | — | `juez/realismo.py` |

La física corre dos veces: en el **rango** del modelo (sin terreno: articulaciones, envolvente de trabajo) y en el
**ciclo** del ejemplo (con el terreno del motor B, paso 0,1 s).

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
