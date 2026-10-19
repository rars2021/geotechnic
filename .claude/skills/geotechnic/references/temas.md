# Recetas por tema

Para cada tema del alcance: qué piezas del kit usar, qué rasgos reales no pueden faltar y de dónde sacar los números.
Las que tienen ejemplo completo se marcan con ✅.

## Terreno y roca

| Tema | Kit | Rasgos que no pueden faltar | Números (buscar en el catálogo de fuentes) |
|---|---|---|---|
| ✅ Corte de talud de tajo | `perfilBancos`, `mallaTalud`, `crearDFN`, `escombrosTalud`, `mediasCanas`, `tapaSeccion`, `cerros`, `pretil` | R1–R12 de `reglas-roca.md` | altura de banco, ángulo de cara, berma, interrampa de la mina (tesis de diseño de tajo) |
| Macizo con familias | `crearDFN`, `trazasSobreMalla`, bloque con `tapaSeccion` en 3 caras, `polosSchmidt` (SVG al lado) | trazas que terminan, facetas por familia, red de Schmidt coherente con el dibujo | rumbo/buzamiento, espaciado y persistencia por familia (tablas DIPS de tesis geomecánicas) |
| Alteración que se desvanece | `zona`, `colorRoca`, `PALETAS` | borde ruidoso de 5–10 m; óxidos en fracturas primero | zonación del yacimiento (tesis de geología) |
| Meteorización | `zona({ tipo: "capa" })` desde la superficie; suelo con `cerros` | grado decreciente con la profundidad; suelo pardo arriba | perfil de meteorización (tesis de geotecnia) |
| Falla con panizo | `zona({ tipo: "plano" })` + `extra` + humedad | banda hundida, oscura y húmeda, halo alterado | espesor de panizo, rumbo y buzamiento |
| Agua: goteo, flujo, nivel freático | `agua`, `goteo`, `charcos`, atributo `humedad` | oscurece ≈ 40 % y brilla; chorreras verticales desde juntas | cota del nivel freático o surgencias |
| Hielo | `hielo({ cota })` | solo en caras que miran arriba, sobre la cota | cota de heladas del lugar |
| Polvo | `polvo` | nace en broca, llantas o voladura; deriva con el viento | — |
| ✅ Labor subterránea | `seccionBaul`, `galeria`, `frente`, `pernos`, shotcrete, `mangaVentilacion`, `tuberias`, `charcos` | L1–L6 | sección, sostenimiento por tipo de roca (tesis de sostenimiento) |
| Testigos | cilindros con `placa`/`CylinderGeometry` en caja de testigos; fracturas como cortes oblicuos | trozos ≥ 10 cm vs cortos (RQD), tacos de profundidad | RQD, diámetro HQ/NQ; dataset `hf:168sir/drill-core-image-dataset` (con `obtener`) |
| Afloramiento | `cerros` + bloque `mallaTalud` de un solo banco irregular | meteorización, líquenes oscuros, suelo al pie | — |

## Equipos

| Tema | Kit | Rasgos | Números |
|---|---|---|---|
| ✅ Scoop / LHD | `scoop` | articulación central, cabina lateral baja, cucharón ancho con dientes | `reglas-equipos.md` |
| Camión de acarreo | `camionAcarreo` | cubierta alta, escalera diagonal, visera, ruedas dobles | capacidad, ancho de vía |
| Pala | `palaElectrica` | pórtico en A, cables, mango con empuje, compuerta | capacidad del cucharón |
| Cargador | `cargadorFrontal` | cabina alta adelante, brazos en Z | capacidad |
| ✅ Jumbo | `jumbo` + `apuntar` | brazos, vigas, perforadora que avanza, gatas | barra, sección |
| Perforadora de taladros largos | `perforadoraTaladrosLargos` | viga que gira en abanico | longitud de taladro, burden |
| Perforadora de tajo | `perforadoraTajo` + `polvo` | mástil, conos de detrito, polvo | diámetro (Bonilla Vargas 2024, tabla 4) |
| Empernador | `empernador` + `pernos` | carrusel de pernos | longitud y malla de pernos |
| Lanzador de shotcrete | `lanzadorShotcrete` + material shotcrete | boquilla, rebote al piso | espesor |
| Volquete | `volquete` | tolva tipo batea, 8×4 | velocidades y ciclo (Reynoso Paucar 2023, tabla 7) |

## Procesos y sistemas

| Tema | Kit | Qué se anima | Números |
|---|---|---|---|
| ✅ Perforación de un frente | `MALLAS`, `ordenPerforacion`, `jumbo.apuntar`, `frente` | brazos por mitades, taladros en el macizo (rayos X), secuencia de salida | `reglas-procesos.md` |
| Voladura | malla + `lineaTiempo` por retardo + `polvo` + `monton` final | grupos que salen en orden, desplazamiento del material, montón resultante | retardos, factor de carga |
| Carguío y acarreo | `palaElectrica` + `camionAcarreo` + `lineaTiempo` | pases de pala, cuadrado, carga visible en la tolva | tiempos de carga y pases |
| Dispatch y flota | `simularFlota` + `estadoEn` + caminos (`CatmullRomCurve3`) sobre el tajo + panel HTML de colas | camiones que eligen pala según la política; colas por pala; t/h | Yupanqui Sánchez 2025, tabla 7 |
| Ventilación | `galeria` + flechas de flujo (partículas con `polvo` sin gravedad) + `mangaVentilacion` | aire fresco por la manga, viciado de vuelta por la galería | caudal (m³/s) de la tesis de ventilación |
| Relleno | tajeo con `galeria` vertical + `monton` que crece | relleno hidráulico o detrítico subiendo por capas | tesis de relleno (UNI) |
| Planta (chancado, molienda, flotación) | equipos de planta como `cajaB`/cilindros + materiales; espumas con `polvo` blanco | flujo del mineral; celdas con espuma | capacidades de la planta |
| Relaves | `cerros` + presa con `perfilBancos` (aguas arriba / abajo) + laguna con material de agua | presa por etapas, playa de relaves, laguna | fotos abiertas: «Presa de relaves de Antamina» (Commons) |

## Escalas

| Escala | Cámara y extensión de sombra | Detalle que se dibuja |
|---|---|---|
| Región / cerro | `extension` 3 000–10 000; `cerros` con `res` alta | relieve, tajos como depresiones, bruma |
| Tajo / mina | `extension` 1 000–2 000 | bancos como líneas, rampas, equipos como puntos |
| Banco / labor | `extension` 60–150 | facetas, escombros, equipos completos |
| Frente | cámara a 3–8 m | taladros, pintura, juntas |
| Testigo / probeta | cámara a 0,3–1 m, `fondo` color | textura de roca, fracturas, escala gráfica |
