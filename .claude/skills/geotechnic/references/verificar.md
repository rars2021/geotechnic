# Verificar como un crítico

Mira cada captura. Si no se parece a la foto, no está terminado.

## Capturas

```bash
node scripts/armar.mjs ejemplos/<tema> --salida <scratchpad>/dist
node scripts/drive.mjs <scratchpad>/dist/<tema>/vista.html --actions pasos.json --width 1300 --height 1000 --theme dark
node scripts/drive.mjs <scratchpad>/dist/<tema>/vista.html --actions pasos.json --width 1300 --height 1000 --theme light
```

`pasos.json` mínimo:
```json
[["until", "!document.querySelector('.geo-cargando')", 120000],
 ["wait", 2500],
 ["shot", "a.png", ".geo-lienzo"],
 ["eval", "GEO.igualarVista({objetivo:[0,18,-18], az:210, el:30, dist:140}); 'ok'"],
 ["wait", 800], ["shot", "b.png", ".geo-lienzo"],
 ["shot", "pagina.png", "main"]]
```
Para controles, usa `eval` con `dispatchEvent` (el clic por coordenadas puede caer fuera si la página se desplazó).

## Lista

| Qué | Cómo se ve bien |
|---|---|
| Comparación | Pon la captura junto a 3 o más fotos (`comparar.html` local trae también las de tesis). Mismo punto de vista: color de cara y berma (`reglas-luz.md`), tamaño de bloques, escombros, proporciones del equipo |
| Escala | Un camión, una persona o una regla en escena; las medidas coinciden con la tabla de fuentes |
| Relieve | Facetas con aristas, no ruido de lija; huecos oscuros; estrías en caras de voladura |
| Horizontales | Lisas, claras, sin manchas de ruido; trazas ocultas por el polvo |
| Luz | Sol rasante en caras; sin blancos quemados; bajo tierra pozos de luz, no gris uniforme |
| Animación | Hoja de 3–4 cuadros: sin saltos, sin piezas que atraviesan roca o cámara |
| Modos | Completo: plaquitas, lista, fuentes. En blanco: solo números, cuestionario, nada que delate |
| Temas | `--theme light` y `--theme dark`: la página cambia; la escena es la misma |
| Consola | Limpia (drive.mjs la imprime al final) |
| Móvil | Ancho 390: sin desplazamiento horizontal, lienzo 4:5 |
| Fuentes | Cada número de la lectura y de las definiciones está en la tabla, con clave o «estimado» |
