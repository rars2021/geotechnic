# Representación visual en minería y geología

Qué hace que un dibujo minero o geológico sea **verdadero**, **legible** y **útil para aprender**.
Síntesis de cinco facetas de investigación (convenciones, terreno-roca, equipos-procesos, pedagogía, evaluación).
Fecha: 19-10-2026.

## Cómo leer este informe

- Cada regla lleva su evidencia: clave el catálogo de fuentes + página, o URL + licencia.
- Las rutas de imágenes son relativas a `<DATOS>/geotechnic\`. El detalle de cada imagen está en `fuentes.json`.
- Figuras de tesis y papers sin licencia abierta: **referencia de estudio**. No se incrustan.
- Fotos de Commons (CC0, dominio público, CC BY, CC BY-SA) y figuras CC BY: se pueden incrustar con atribución.
- Las reglas ya escritas en la skill (R1–R13, M1–M9, L1–L6 de `reglas-roca.md`) no se repiten. Aquí se citan solo para
  corregirlas o completarlas.
- Los colores medidos son medias de regiones elegidas a mano. Dependen de la exposición de cada foto. Las escalas en
  metros se estimaron con una persona o un martillo en la foto.

## 1. Las tres condiciones

| Condición | Qué significa | Cómo se prueba |
|---|---|---|
| Verdadera | Números con fuente; forma y proporción como en las fotos; física sin trampas | Juez (física, fidelidad) + comparación con planos de tesis y puntos clave en fotos |
| Legible | Todo lo codificado tiene leyenda; orientación, escala y cota; tipos de línea con significado; poco ruido | Convenciones (§5) y limpieza |
| Útil para aprender | Rótulo junto a la pieza; dos caras en la roca; animación solo para el cambio; prueba de comprensión | Principios de Mayer y estudios de geociencias (§6) |

Las tres se pueden contradecir. La foto real es ruidosa y saturada (§7). El estudio pide calma. La convención pide
patrones y colores fuertes. La regla de este informe: **la forma y los números siguen a la realidad; la superficie
sigue al estudio; la codificación sigue a la convención, desaturada y con leyenda.**

## 2. Roca y terreno

### 2.1 Macizo y juntas

| # | Regla | Evidencia |
|---|---|---|
| T1 | **Falla planar a favor del talud.** La cara es un conjunto de planos lisos que buzan hacia la vía con casi el ángulo de la cara. Losas de 0,1–0,5 m cortadas en escalones por una familia transversal. Al pie, un cordón angosto de lajas planas de 0,1–0,4 m, no un talud de bloques (R6). | Commons «Daylighted slope along the Baguio-Bua-Itogon road» (CC BY-SA 4.0, P.C.B. Yang-ed); «Jointed diorite outcrop, Dalupirip 01» (CC BY-SA 4.0); hdl:20.500.14076/28951 pág. 56 (cinemática) |
| T2 | **Color de junta contra roca fresca.** Cara de junta pardo-rojiza apagada (#7b655c, S 0,25). Roca recién rota gris verdosa (#89847e, S 0,08), ≈ 25 % más clara. Razón de luminancia 0,79; diferencia de tono ≈ 20°. | Baguio (CC BY-SA 4.0), regiones medidas |
| T3 | **Aleros.** Con una familia subhorizontal y otra empinada, la cara forma escalones con alero. Bajo cada alero, sombra fuerte del 5–15 % del alto del bloque. Bloques romboidales, no cúbicos. | Dalupirip 01 (CC BY-SA 4.0); «Butte Granite joints 2012» (CC BY-SA 4.0, Rygel) |
| T4 | **Meteorización esferoidal.** En el granito, cada bloque de juntas deja un núcleo redondeado de 2–3,5 m. Las juntas son surcos hundidos de 0,15–0,25 m. El grus es más claro y menos saturado que el núcleo (Lum 0,75 contra 0,69; S 0,09 contra 0,16). Al pie, delantal de grus de perfil recto. | Butte Granite joints (CC BY-SA 4.0, persona de escala); «Jointed and weathered granite (GeoDIL 2208)» (CC0) |
| T5 | **Las familias tienen un solo color en todas las vistas.** Estereograma, sección y bloque 3D usan el mismo color por familia. La cuña se marca por las mismas trazas. | hdl:20.500.14074/1420 pág. 27; hdl:20.500.14074/3366 pág. 78 |

### 2.2 Alteración, óxidos y agua

| # | Regla | Evidencia |
|---|---|---|
| T6 | **Los óxidos en la roca son apagados.** Caras de junta oxidadas: S media 0,17–0,28 (H 16–34). Solo el 1 % de los píxeles de una cara de diorita oxidada pasa S > 0,35. El naranja vivo (S ≈ 0,6, #be804b) aparece solo como precipitado de hierro bajo agua. | Dalupirip 01 (S p90 0,23); «Argillic zone alteration… Orphan Boy Mine 2» (CC BY 2.0, limonita S 0,17); «Iron precipitate on Quaker Run» (CC BY-SA 4.0, S 0,60) |
| T7 | **Argílica o lixiviada.** Roca blanqueada casi sin color (#c3c3bf, S 0,02). Limonita en fracturas y salbandas, en bandas de 1–5 cm. Grava angulosa clara alrededor. | Orphan Boy 2 (CC BY 2.0); «Hydrothermally altered volcanic rocks… Yellowstone 6» (CC BY 2.0) |
| T8 | **A escala de cerro, la alteración no tiene vegetación.** Manchas de decenas de metros: crema (#d9cda8), pardo rojizo (#63503f) y blanco. Bordes difusos por las cárcavas. Cobertura vegetal 0 es la señal más rápida. | «Big Rock Candy Mountain» (CC0); hdl:20.500.14076/2100 pág. 113 |
| T9 | **Óxidos en la pared del tajo cortan los bancos.** Columnas o manchas de 50–200 m: ocre (#6c5536, S 0,50), crema (#857b66) y gris (#5f5146). Las bermas quedan como rayas finas y claras sobre cualquier color. | «Mina Cerro de Pasco1» (CC BY-SA 4.0, web:b55550f33eeedd32); «Minas de Tintaya» (CC BY-SA 4.0, web:572310d9fc50d0c1) |
| T10 | **El agua de relave o laguna toma el color del cielo.** Cielo despejado: turquesa (#4b707c, H 196, S 0,39; Tintaya #708e89). Cubierto: casi neutra y plateada (#b3b4b1, S 0,02). Entre muro y agua, playa ancha, plana y clara (#a69d8a–#b0a9a0, S ≤ 0,17). | «Antamina Mine Tailings Pond» (CC BY-SA 2.0); «Tajos abiertos y presa de relaves de Antamina» (CC BY-SA 4.0, web:4361eadc81f9d736) |
| T11 | **Drenaje ácido limitado al perímetro mojado.** Mancha naranja-parda de 0,3–0,6 m a cada lado del cauce (#796257, S 0,28). Fuera, el desmonte sigue gris (#77736f, S 0,06). Agua lechosa con espuma. En cauces lentos, precipitado naranja vivo (S 0,60): único acento saturado justificado de la faceta. | «Acid mine drainage at Tilt Cove» (CC BY-SA 4.0); Quaker Run (CC BY-SA 4.0) |
| T12 | **Agua y tracción en taludes.** Dren subhorizontal que asoma 0,3–0,5 m, chorro casi vertical, franja húmeda debajo. Grietas de tracción de 0,3–0,6 m en la cresta, con labios derrumbados. Escarpa fresca crema clara contra ladera meteorizada. | hdl:20.500.14076/26749 págs. 133 y 211; hdl:20.500.14076/2100 pág. 113 |

### 2.3 Botaderos, relaves y testigos

| # | Regla | Evidencia |
|---|---|---|
| T13 | **Botaderos por bancos.** Cada cara es un plano recto, sin facetas de roca, con estrías finas pendiente abajo y gruesos al pie. Una banda de tono por carga, en grises #93908a–#c8c8c7 (S ≤ 0,06). Plataformas horizontales con vías. Con desmonte de otra litología, contraste fuerte y cárcavas de 0,3–1 m. | web:4361eadc81f9d736 (CC BY-SA 4.0); «Highland Valley Copper Mine Tailings» (CC BY-SA 4.0); «Shinarump Mine Waste Rock» (CC BY-SA 4.0); `figuras\talud\abiertas\vistas_de_yanacancha_mina_antamina_01.jpg` (mirada: franjas de vertido de botadero) |
| T14 | **Caja de testigos.** 5 filas por caja, ≈ 1 m por fila. Testigo ≈ 58 % del paso entre filas. Diámetro / largo ≈ 0,04–0,06 (HQ = 63,5 mm). Taco de madera con la profundidad al final de cada corrida. Línea roja de orientación a lo largo. Fracturas naturales a 30–60° del eje. Se lee como un libro: de izquierda a derecha y de arriba abajo. | «Drill core boxes Onkalo 1» (CC BY-SA 4.0, kallerna: 17,94→22,60 m en 5 filas); hdl:20.500.14076/24548 pág. 87; hdl:20.500.14076/22846 pág. 93; hdl:20.500.14076/29235 pág. 67 (log De–A) |
| T15 | **Fractura natural contra mecánica.** La natural tiene bordes redondeados o relleno; la mecánica es fresca y rugosa. Solo la natural corta las piezas del RQD. | hdl:20.500.12918/8033 pág. 38 |
| T16 | **Testigo de pórfido de cerca.** Fondo blanco verdoso de sericita. Pirita en motas doradas en vetillas. Cobre secundario verde azulado junto a la pirita. Superficie rota áspera. | «Broken drill core (Butte) 1» (CC BY 2.0) |

### 2.4 Labores

| # | Regla | Evidencia |
|---|---|---|
| T17 | **Hielo en bocamina** (completa M8). Carámbanos solo en los primeros metros del portal. Cuelgan de la corona y de la mitad alta de los hastiales, juntos donde filtra. Miden de 0,2 m a ≈ 0,6 del alto de la labor. Hastial mojado muy oscuro (Lum 0,14). Canal de agua en el piso que refleja el portal (Lum 0,66). | «Adit icicles (50312853716)» (CC BY 2.0, Gerry Thomasen) |
| T18 | **Galería en roca estratificada.** Techo plano según la estratificación, con desprendimientos en arco. Pernos en malla regular, placas de ≈ 0,15 m, 8–10 por fila. Estrías verticales de taladros de contorno en la parte baja de los hastiales. Cascajo al pie. | «Maxville Limestone… Black 17 Mine 4» (CC BY 2.0); hdl:20.500.14076/22414 pág. 30 (contraste: roca fracturada sin sostenimiento, facetas) |
| T19 | **Contorno de voladura controlada.** Taladros de contorno cada 1,5 m sin carga; producción a 6,5 m (mineral) y 8,5 m (desmonte). Las medias cañas se ven 4–6 veces más juntas que la malla de producción. | hdl:20.500.14076/29218 pág. 74 |
| T20 | **Shotcrete con fibra.** Superficie granulosa y mate, gris pardo, fibras de acero asomando, brillo húmedo si filtra. Sigue el relieve, no queda liso. | «Fibre reinforced shotcrete» (CC BY-SA 3.0, Karrock); hdl:20.500.12394/11540 pág. 79 |

## 3. Equipos

| # | Regla | Evidencia |
|---|---|---|
| E1 | **Pala de cables.** Cables de suspensión rectos y tensos de la punta del pórtico en A a la polea doble de la pluma. Izaje casi vertical (< 10°) de la polea a la cuchara. Mango a media altura de la pluma. Sin pórtico ni cables tensos parece una excavadora de juguete. | «P&H 4100XPB Shovel-4» (CC BY-SA 3.0); «Bucyrus 822 shovel… 11» (CC BY 2.0); hdl:20.500.14076/22793 pág. 33 |
| E2 | **Rango de la CAT 7495.** Descarga 8,61 m de alto y 21,64 m de radio; corte 17,80 m y 25,20 m; manija 10,9 m. Al descargar, la cuchara queda sobre el centro de la tolva. El diagrama dibuja el camión de frente (perpendicular a la pluma). Que el camión espere de costado y paralelo a las orugas sale de la foto, no del diagrama (estimado). | hdl:20.500.14076/22793 pág. 33 (tabla y figura, miradas); hdl:20.500.14076/24547 pág. 64 (P&H 4100XPC); «P&H 4100XPB Shovel-4» (CC BY-SA 3.0, camión a la izquierda) |
| E3 | **Cable de cola.** La pala eléctrica arrastra un cable grueso por el piso desde la cola. Sin él no es creíble. Limita su movimiento. | Bucyrus 822 (CC BY 2.0); hdl:20.500.14076/14760 pág. 77 |
| E4 | **Cargador 994K cargando camión.** Cucharón sobre el borde lateral de la tolva, volcando al centro. Eje delantero junto al costado del camión. Llanta del cargador ≈ llanta del camión. Varillaje en Z con balancín, escalera diagonal, dos escapes verticales. | hdl:20.500.14076/24846 pág. 46; «Machinery, Hannans North Tourist Mine 2016 (03)» (CC BY-SA 4.0) |
| E5 | **Camión de tajo de frente.** Escalera diagonal delante del radiador, dos filtros cilíndricos a cada lado, cubierta con barandas, visera nervada. Número de flota grande y pintado (116, 133, 210). | «Hannans… (01)» (CC BY-SA 4.0); hdl:20.500.14076/22435 pág. 48; hdl:20.500.14076/22444 pág. 56; hdl:20.500.14076/6645 pág. 28 |
| E6 | **Perforadora de tajo.** Mástil ≈ 2× el largo del carrier (estimado en foto). Cabina a un costado. Un cono de detritus gris claro por taladro: la malla se lee por los conos alineados (completa R13). Polvo en el collar. Mástil abatido para trasladarse. | «Narva mine blasthole drilling» (CC BY-SA 4.0); hdl:20.500.14076/6645 pág. 25; hdl:20.500.14076/4581 pág. 64 |
| E7 | **Empernador.** Carrusel anular de pernos en el brazo, viga apoyada en el techo, mangueras en lazos del brazo al carrier, techo protector, piso mojado. | «BOLTEC -2» (CC0); hdl:20.500.14076/1367 pág. 102 |
| E8 | **Shotcrete por vía.** Húmeda: 4–5 m³/h, rebote 2–10 %. Seca: < 1 m³/h, rebote 30–50 %. El rebote cae en montón al pie del hastial. | hdl:20.500.12394/4685 págs. 67-68 |
| E9 | **Scoop y camión subterráneo.** El camión casi llena el portal. El scoop (ST1030) es bajo: la llanta mide más de la mitad de su alto; el cucharón es más ancho que el chasis. En el LHD de Cobar, el lado del cucharón es casi tan alto como la llanta y los dientes son cortos. | «CSIRO ScienceImage 1226» (CC BY 3.0); «Big Nickel mining» (CC BY 2.0); `figuras\scoop\abiertas\load_haul_dump_cobar_2017_01.jpg` (Commons) |
| E10 | **Mangas y ventiladores.** Mangas de 32" (0,81 m) en la parte alta, pegadas a la corona junto a un hastial, a veces en pares, con catenaria leve. Ventilador auxiliar de 10 kCFM sobre caballete con rejilla y caja de arranque, o colgado de cadenas. | hdl:20.500.14076/24538 pág. 40; hdl:20.500.14076/28632 pág. 25; hdl:20.500.14076/22426 pág. 77; «Coal mine ventilation fan» (CC BY-SA 2.0) |
| E11 | **Chancado primario.** Giratoria 60"×113": recibe hasta 1200 mm, entrega 165 mm, 746 kW, hasta 2600 t/h. Camiones de 238 t descargan en reversa a un bolsón de 500 t por dos lados. Rompe-rocas en pedestal y grúa. Debajo: bolsón, alimentador de orugas de 2700 mm, faja de 1830 mm. | hdl:20.500.14076/22796 pág. 68; hdl:20.500.14076/6645 pág. 29; hdl:20.500.14076/22787 pág. 45 |
| E12 | **Molino SAG.** 40×22 pies (12,2 × 6,7 m; razón 0,55), 24 MW, 3963 t/h. Tapa con filas radiales de pernos. Dentro: lifters, barras levantadoras, parrilla, bolas al fondo. | hdl:20.500.14076/22415 págs. 13-15 y 24; «Tega product picture» (CC BY-SA 4.0); hdl:20.500.14076/29239 pág. 32 |
| E13 | **Flotación.** Banco de celdas cilíndricas en serie sobre acero, unidas por tuberías gruesas, pasarela con barandas. Tres zonas: espuma, inerte, mezcla. Espuma gris plateada, burbujas de mm a cm. | «DELKOR BQR Flotation Cells» (CC BY-SA 4.0); «Prominenthill-flotation» (CC BY-SA 4.0); hdl:20.500.14076/28628 pág. 90 |
| E14 | **Castillo y winche de pique.** Torre vertical sobre el pique y una pata inclinada que apunta a la casa del winche. Polea grande arriba, con baranda. Los cables bajan en diagonal a la casa, paralelos a la pata. En la casa, tambora doble con el cable enrollado. Pique de 4 compartimientos: 2 skips, personal y servicios con escalera. Los dos skips van en contrapeso: uno sube mientras el otro baja (la pantalla SCADA los dibuja en dos columnas con flechas opuestas). Pique de 1280 m; 2 motores de 2931 HP; cable de 2¼"; 3000 pies/min (15,2 m/s). | «Headframe of Campi shaft» (CC BY-SA 4.0, Kj); «Homestake Mine Yates Shaft Headframe Hoisting Room» (CC BY-SA 4.0, Pi3.124); hdl:20.500.14076/22848 págs. 32, 38-40 y 42 (figuras miradas) |

## 4. Procesos

| # | Regla | Evidencia |
|---|---|---|
| P1 | **Carguío en pases enteros.** 3 a 6 pases por camión (en la práctica 3–5). Pase = girar, descargar, volver. 73 yd³ ≈ 120 t por pase: camión de 360 t en 3 pases. EX5600 llena un 793D en 5–6. | hdl:20.500.14076/22795 pág. 74; hdl:20.500.14076/29246 pág. 22; hdl:20.500.14076/22523 pág. 31 |
| P2 | **Ciclo de tajo como cadena.** Perforación, carguío de explosivos, voladura, carguío, acarreo, descarga. La descarga se bifurca (chancadora o botadero): eso decide el dispatch. | hdl:20.500.14076/22775 pág. 22; hdl:20.500.14076/10837 pág. 86; tit:f98d6db20aff3715 pág. 29 |
| P3 | **Ciclo de desarrollo en 10 pasos.** Ventilación, marina, desatado, pernos, lechado, malla, hilteo, shotcrete, perforación, carguío y voladura. Mismo corte de galería, un equipo por paso. Escala de la limpieza (dato de **tajeo** de 12 m, no de galería): 626 m³ esponjados con 4,5 m³ por viaje piden 140 viajes (≈ 7 h). La fuente dice 552 m³ × 1,2 = 626, pero da 662: usar el conteo de viajes, no la cuenta. El sub level caving tiene otro ciclo, de 6 operaciones. | tit:f98d6db20aff3715 pág. 36 (figura, mirada) y pág. 93; hdl:20.500.14076/22981 pág. 44 (ciclo SLC, mirado) |
| P4 | **Carguío de un frente.** Tubos de choque de cada taladro hacia un punto de amarre; alivios sin tubo. Operario en escalera con lámpara. En superficie, camión fábrica con tolvas y manguera. | hdl:20.500.14195/498 pág. 115; hdl:20.500.14076/10636 págs. 33-34 |
| P5 | **Dispatch como lo ve el operador.** PTX del camión: estado en letras grandes y minutos esperados («Arrived at E302 / Expected 0.1 mins»), siguiente estado, barra con operador, descargas, velocidad, hora. Pantalla de pala: polígonos de minado, alcance, tonelaje por camión («236 t… 100 % OK») y cola de camiones como chips. 9 estados del ciclo. | hdl:20.500.14076/22793 págs. 45-47; hdl:20.500.14076/22775 págs. 46-49; hdl:20.500.14076/25219 pág. 49; hdl:20.500.14076/9227 pág. 28 |
| P6 | **Nivel subterráneo real.** Galerías de 5,0–5,8 m, cruceros cada 18,2 m. LHD de 2,45 m de ancho, articulación 30°, curvatura ≤ 0,22 m⁻¹ (radio ≥ 4,5 m) a 2 m/s, holgura 1,725 m. | zenodo:23292838 (CC BY 4.0, Liu y Peng 2026) |
| P7 | **Relleno por paneles numerados.** Orden 1-2-4 abajo, 3-5 al medio, 6 arriba. La pasta se ve como superficie gris lisa y mojada que avanza. Planta con silos, espesador y bombeo. | hdl:20.500.14076/29222 págs. 43-44; hdl:20.500.14076/28634 pág. 29; hdl:20.500.14076/22442 pág. 54 |
| P8 | **HMI de planta.** Esquema plano, fondo oscuro o azul claro, equipos en contorno, un color por flujo, valores en cajas. Un tablero de proceso imita esa lectura, no la foto. | hdl:20.500.14076/28634 pág. 30; hdl:20.500.14076/22415 pág. 33; hdl:20.500.14076/28683 pág. 88 |
| P10 | **Acarreo por rampa.** La rampa corta los bancos en diagonal; las bermas de banco quedan como rayas claras. Berma de seguridad continua del lado del vacío, de ≥ 3/4 de la llanta más alta. Vía doble ≥ 3 anchos de camión (diseño FMI en tajo: 40 m, berma 3 × 2 m, bombeo 3–4 %). Rampa de 8–10 %. Vía mal mantenida: derrame de carga y huellas; la resistencia a la rodadura sube de 1,5 % a 14 %. | «Mina de Chuquicamata… DD 118» (CC BY-SA 4.0, Diego Delso, mirada); hdl:20.500.14076/22773 págs. 37-40 (figuras miradas); hdl:20.500.14076/10395 pág. 95 (antes/ahora, mirada) |
| P11 | **Pad de lixiviación.** Capas escalonadas sobre geomembrana, con rampa de acceso. El volquete descarga al talud de la capa y el tractor empuja. Riego por aspersión en malla triangular de 6 m: mangueras paralelas y niebla baja sobre la grava parda. Pad de 2–7 % (hasta 20 % en taludes); capa nueva cada 90 días. La tasa de riego no cuadra en la fuente (6 u 8 L/h/m²). | hdl:20.500.14076/29238 págs. 39-41 (figuras 9 y 11, miradas) |
| P9 | **Flowsheet.** El mineral va de arriba a la izquierda hacia abajo a la derecha. Equipos como iconos numerados con lista. Corrientes ortogonales con flecha. Reciclos y muestreos discontinuos y de otro color. | hdl:20.500.14076/28170 pág. 38; hdl:20.500.14076/22419 pág. 13; hdl:20.500.14076/13255 pág. 37 |

## 5. Convenciones de representación

| # | Regla | Evidencia |
|---|---|---|
| C1 | **Leyenda completa.** Todo color, patrón o tipo de línea tiene entrada; no sobran entradas. | hdl:20.500.14076/22724 pág. 40; contra-ejemplo tit:7bed21ee8e49749d pág. 80 (3D sin leyenda) |
| C2 | **Estereograma estándar.** Hemisferio inferior, igual área (Schmidt) si hay conteo, N arriba con E y W. Plano = círculo máximo; polo o línea = punto. Leyenda con hemisferio, proyección, n y método de contorno (Fisher, 1 %). Wulff conserva ángulos y no sirve para estadística. Sin la interfaz del software. | hdl:20.500.14074/2871 págs. 19-21; hdl:20.500.14074/3366 pág. 78; Commons «Stero projection structural geology» (CC BY-SA 4.0); contra-ejemplos hdl:20.500.12394/8743 pág. 79 y hdl:20.500.14597/5718 pág. 38 |
| C3 | **Patrones litológicos FGDC.** Caliza ladrillo (627), dolomía ladrillo sesgado (642), arenisca puntos (607), lutita rayas (620), conglomerado o morrena círculos (601), brecha angulosos (605), intrusivo cruces (721), toba Y y v (711), pórfido listones (729/730), mena (733). Las tesis peruanas usan los mismos signos. | gh:davenquinn/geologic-patterns (CC0; `investigacion\convenciones\fgdc\hoja_fgdc.png`, mirada); hdl:20.500.12394/9777 pág. 31; hdl:20.500.14076/1089 pág. 25; hdl:20.500.14076/1367 pág. 39; Commons «KarstterrainUSGS» (dominio público) |
| C4 | **Tipos de línea con significado.** Cierto continuo, inferido discontinuo, cubierto punteado, incierto con «?». Falla normal con bola o barba del lado hundido; inversa con dientes del lado alto. En sección, medias flechas y «F». Discordancia ondulada. | hdl:20.500.14076/22724 pág. 40; hdl:20.500.14076/22428 pág. 70; Commons «Carbon Peak geologic cross section USGS 1987» y «Grand Canyon Uncomformities» (dominio público) |
| C5 | **Sección ubicada y orientada.** Nombre A–A', rumbo de los extremos o «vista al Norte», cotas en m s. n. m. a ambos lados, eje de distancias, línea de sección en la planta, escala gráfica, exageración vertical declarada. | hdl:20.500.14076/22440 pág. 93; hdl:20.500.14076/22428 pág. 70; Commons «Gunnar Mine geologic map and cross section», «KarstterrainUSGS», «Floridan block diagram» (dominio público) |
| C6 | **Bloque diagrama legible.** Terreno arriba, capas con patrón en las caras, rótulos fuera del bloque con guías finas, agua en azul con flechas. El bloque semirrealista (textura real arriba, estratos que se aclaran en las caras) es el estilo más cercano a Geotechnic. | KarstterrainUSGS y Floridan (dominio público); contra-ejemplo hdl:20.500.14074/7011 pág. 90 (degradado sin significado) |
| C7 | **Malla de frente.** De cara al frente. Cargado: punto lleno. Alivio: círculo vacío más grande. Número de retardo junto a cada taladro, creciendo del arranque al contorno. Arranque en cuadrados girados 45°. Eje de simetría y cotas. Un color por grupo de salida y barra de columna de carga (cebo, explosivo, taco). | doi:10.1038/s41598-023-29803-6 pág. 11 (Ozgur 2023, CC BY 4.0, incrustable); hdl:20.500.12394/10815 pág. 26; hdl:20.500.14076/22526 pág. 69; hdl:20.500.14195/498 pág. 113 |
| C8 | **Malla en banco.** Planta y sección juntas. Cara libre, producción en tresbolillo, amortiguación, precorte y recorte rotulados con B y E. Cresta continua, pie discontinuo. Sobreperforación bajo la cota. Amarre con retardos en ms y punto de INICIO. | hdl:20.500.14076/10463 pág. 119; hdl:20.500.14076/22722 pág. 100; hdl:20.500.14076/22438 pág. 49; hdl:20.500.14076/22845 pág. 90 |
| C9 | **Perfil de talud.** Cresta, pie, altura y berma; ángulos de cara, interrampa y global, cada uno con su línea y arco. Plano de diseño: sector en círculo, caja 55/40/38, estereograma e icono de modo de falla por sector. | hdl:20.500.14076/28951 pág. 25 (de Read y Stacey 2009); hdl:20.500.14076/28959 pág. 64 |
| C10 | **Alteración por intensidad.** Lo intenso en caliente (sílice masiva, granular), lo débil en pálido (alunita, arcilla). Códigos SM, SG, SA, SC, CP en la leyenda. Unidades al estilo INGEMMET (Qr-al, Ts-pa, Ki-ma, Js-chu) con color por edad. | hdl:20.500.14076/22428 págs. 70 y 80; hdl:20.500.12773/18055 pág. 66 |
| C11 | **Rampas cuantitativas.** Rojo = bajo o malo; azul o verde = alto o bueno; luminancia monótona; valores en la barra. Los colores de clase geomecánica **no** son estándar: cada mina tiene su cartilla. El dibujo trae su leyenda. | hdl:20.500.14076/22442 pág. 106; hdl:20.500.14076/2103 págs. 28-30; hdl:20.500.14195/472 pág. 43 |
| C12 | **Planos de mina.** Un color y un nombre escrito por tipo de labor; gradiente de rampa («−12 %»); cotas totales; cajetín con empresa, título, escala, fecha, autor, revisor y número. | hdl:20.500.14076/28956 pág. 68; hdl:20.500.12394/4685 pág. 117 |
| C13 | **Columna estratigráfica.** Tres bandas: cronología, gráfico con patrón, descripción. Discordancias onduladas con nombre. Intrusivos que cortan. Espesor proporcional con cifra (±850 m). | hdl:20.500.12394/9777 pág. 31; hdl:20.500.14076/22436 pág. 48 |
| C15 | **Modelo de bloques y pit.** Bloques regulares cuya altura es la del banco (10 × 10 × 7,5 m). Color por variable, con la variable nombrada en la leyenda (litología o ley). Coordenadas en los bordes de la sección y cotas en m s. n. m. La planta de nivel lleva norte, escala gráfica y cajetín. Las envolventes de pit son líneas escalonadas de distinto color, cada una con nombre. Las fases crecen una dentro de otra hasta el pit final. Tonelaje y ley por banco: barras y línea, bancos cada 10 m. | hdl:20.500.14076/2094 págs. 68-69, 74, 93 y 109 (figuras miradas); hdl:20.500.14076/9917 pág. 90 |
| C14 | **Contra-ejemplos de plano.** Rasgo fino perdido en un marco enorme; rojo sólido sobre curvas densas; 3D sin leyenda con polígonos que se tapan. Regla: encuadre ajustado, 5–7 clases de color como máximo, nada saturado que tape la base. | hdl:20.500.12394/4685 pág. 117; hdl:20.500.14076/10463 pág. 31; tit:7bed21ee8e49749d pág. 80; hdl:20.500.14076/2103 pág. 29 |

## 6. Aprendizaje

| # | Regla | Evidencia |
|---|---|---|
| A1 | **Realismo moderado.** Geometría detallada con sombreado simple. El detalle fino y el ruido de textura tapan la forma. El esquema muy plano da pocas piezas para la imagen mental. Confirma el estudio v3 «Anatomy a medias». | doi:10.1007/s10639-022-11043-2 págs. 1, 13-15 (Skulmowski 2022, CC BY); doi:10.1007/s10648-021-09638-1 págs. 7-8 (modelo GSR) |
| A2 | **Mismo estilo para aprender y evaluar.** La retención fue mayor cuando coincidía el realismo de aprendizaje y de prueba. Modo completo y en blanco con la misma cámara y estilo. | doi:10.1007/s10639-022-11043-2 pág. 14; doi:10.1007/s10648-021-09638-1 págs. 22-23 |
| A3 | **Tono por pieza.** Un tono distinguible por pieza vecina compensa la carga del sombreado. Contraste de tono o luminancia, no de saturación. | doi:10.1007/s10648-021-09638-1 pág. 10 |
| A4 | **Principios de Mayer con más efecto.** Coherencia d = 0,86; contigüidad espacial 0,82; pretraining 0,78; actividad generativa 0,71; señalización 0,69; segmentación 0,67. Inmersión VR: −0,10. | doi:10.1007/s10648-023-09842-1 pág. 20, tabla 6 (Mayer 2024, CC BY) |
| A5 | **Señal sincronizada.** El término en el texto y su pieza comparten el color de acento a la vez. Más miradas y transiciones texto-imagen. | doi:10.3389/fpsyg.2021.755804 págs. 1, 7 |
| A6 | **Animar solo el cambio.** La animación gana cuando hay que aprender el movimiento (d = 2,22); la imagen quieta gana para la disposición (d = 1,03). Metaanálisis: g = 0,647 con cambio complejo, 0,043 si el cambio no importa. | doi:10.1007/s11251-021-09541-w págs. 1-2, 14 |
| A7 | **Segmentar a ritmo del usuario.** Mejor transferencia; menos carga. Cada control extra pesa. Evidencia de apoyo (n = 11–20). | doi:10.1007/s12528-025-09484-y págs. 18-20 |
| A8 | **Dos caras o un corte.** Con una sola cara, la gente supone que las capas entran rectas hacia atrás: 76 % (exp. 1) y 62 % (exp. 2) de respuestas a 10° de 90°. El sesgo persiste tras ver la respuesta. | doi:10.1186/s41235-016-0010-y págs. 1, 11-13 (Gagnier y Shipley 2016, CC BY) |
| A9 | **Modelo rotable.** Acierto del bloque diagrama: 59 % con modelo virtual, 50 % con mapa, 40 % con foto. Lo más útil: rotar (86 %) y zoom (53 %). | doi:10.5194/gc-4-233-2021 págs. 6-9 (Bond y Cawood 2021, CC BY 4.0) |
| A10 | **Incertidumbre dibujada.** Línea discontinua sube la incertidumbre percibida (p = 0,001). Si el color domina, el símbolo se pierde. Sólida para lo cierto; rayado o escalón para lo gradacional. | doi:10.1007/s41651-020-00071-6 págs. 9-13 |
| A11 | **Objeto de escala siempre.** Persona, camioneta o jalón de 10 m. En lo virtual cuesta relacionar el paisaje con el cuerpo. | doi:10.5194/gc-5-227-2022 págs. 3, 7; `figuras\dispatch\abiertas\big_truck_looks_small_in_an_open_pit_mine.jpg` |
| A12 | **La inmersión no garantiza aprender.** Ensayo aleatorio en minería: VR, video 360 y video dieron igual comprensión; solo subió la motivación. 3D de escritorio con pocos controles. | doi:10.2473/journalofmmij.136.33 págs. 5-6 (Ito 2020); Mayer 2024 pág. 20 |
| A13 | **Texto corto fijo junto al objeto.** Superó a la narración en 3D. Unas 40 palabras ya es largo. Definición ≤ 20 palabras. | doi:10.1007/s11251-022-09611-7 págs. 18-19 |
| A14 | **El detalle se justifica por la tarea.** Los novatos piden más realismo del necesario. La maraña de mangueras del jumbo se simplifica. | doi:10.1186/s41235-021-00274-5 págs. 1-2; `figuras\jumbo\abiertas\rocket_boomer_e2c_1.jpg` |
| A15 | **El pensamiento penetrativo pide práctica repetida.** 18 min de puzzles no cambiaron nada. Ejercicios de corte con estratos, repetibles, en varias rondas. | doi:10.3389/frvir.2020.569674 págs. 1, 8-10 |
| A16 | **Diagrama mixto.** Superficie casi real + sección esquemática en tintas planas, ejes en km, exageración declarada. | Commons «Block Diagram showcasing earthquake hypocenter» (USGS, dominio público); doi:10.3389/feart.2020.590062 pág. 5 |
| A17 | **Guion multiescala.** Regional → local → resumen regional. Cada sitio con modelo, mapa o columna, fotos y figura interpretada. | doi:10.5194/gc-5-227-2022 págs. 7, 12 |
| A18 | **Planta con su flowsheet enlazado** y escenarios de problema (muestrear, diagnosticar, ajustar). | doi:10.24908/pceea.vi.15874 págs. 1-2, 5 (piloto de 4 estudiantes) |

## 7. Evaluación: lo que mide bien y lo que no

| # | Hallazgo | Evidencia |
|---|---|---|
| V1 | **Las métricas globales de realismo no distinguen la foto correcta de una equivocada.** AUC correcto contra cruzado: bordes 0,50; colorido 0,50; Bhattacharyya 0,53–0,58; luminancia 0,71. En el scoop, 45 % de los pares cruzados aprueba. | `investigacion\evaluacion\scripts\pares_cruzados_realismo_actual.py` (5 pares por tema: indicativo) |
| V2 | **Limpieza y realismo se contradicen.** Las 31 fotos abiertas tienen \|Laplaciano\| 0,033–0,229: todas pasan el tope de limpieza (0,0226). 20 de 31 superan S p90 0,45. | `investigacion\evaluacion\scripts\paleta_ruido_fotos.py` |
| V3 | **Medidas de estructura separan algo mejor.** HOG AUC 0,68 / 0,73; SSIM 0,65 / 0,50; chamfer Canny 0,61 / 0,60. Ninguna basta sin igualar la pose. LPIPS y DISTS son más fieles a la percepción (requieren torch). | `pares_cruzados_estructura.py`; arXiv 1801.03924; arXiv 2004.07728 |
| V4 | **Sin pose igualada el par no vale.** Hoy hay pares de vista trasera contra frontal y detalle contra máquina entera. | hojas de realismo de scoop-lhd y frente-jumbo (salidas del juez, miradas) |
| V5 | **Las proporciones en imagen detectan errores que la fidelidad no ve.** Cucharón del modelo ≈ 0,6 de la llanta con dientes largos; en la foto ≈ 1,0 con dientes cortos; la fidelidad aprobó 13/13. | `figuras\scoop\abiertas\load_haul_dump_cobar_2017_01.jpg` contra la captura-2 del scoop |
| V6 | **Fidelidad contra plano.** Malla con cotas (hdl:20.500.12394/10815 pág. 26), perfil de talud (hdl:20.500.14076/10463 pág. 63) y estereograma (hdl:20.500.12394/8743 pág. 79) se comparan con la geometría exportada en cm o grados. | figuras miradas |
| V7 | **Comprensión medible.** Elección forzada de 4 (bloque, corte, movimiento), estimación continua de buzamiento, deslizador de certeza 0–100. | doi:10.5194/gc-4-233-2021 pág. 6; doi:10.1186/s41235-016-0010-y págs. 4-5; doi:10.1007/s11251-021-09541-w págs. 8, 12; doi:10.1007/s41651-020-00071-6 págs. 5-6 |
| V8 | **Acuerdo entre evaluadores.** ICC de acuerdo absoluto con IC 95 %: < 0,5 pobre, 0,5–0,75 moderado, 0,75–0,9 bueno, > 0,9 excelente. ≥ 3 evaluadores, ≈ 30 casos. | Koo y Li 2016 (PMC4913118, sin licencia abierta declarada); doi:10.1007/s11251-022-09611-7 págs. 12-13 |
| V9 | **Un agente evaluador correlaciona con humanos casi como dos humanos** (Spearman 0,4 contra 0,45). Sirve si se calibra. | arXiv 2312.14867 (VIEScore) |
| V10 | **Pertinencia de la referencia.** Fotos de otro tema o con mucho cielo contaminan el puntaje. | `figuras\dispatch\2015_flores_collas_estudio_metalurgico_p_p159.jpg` (es flotación); `figuras\talud\abiertas\vistas_de_yanacancha_mina_antamina_01.jpg` (≈ la mitad es cielo; muestra un botadero) |

## 8. Decisiones sobre los conflictos

| Conflicto | Decisión propuesta |
|---|---|
| Estudio v3 prohíbe hachurado en las tapas; la convención (C3) pone patrón FGDC en todo corte geológico | Modo **lámina geológica** opcional por ficha: cada unidad declara su código FGDC y su tapa lleva el patrón CC0 en tinta a baja opacidad (≈ 0,35, como la lámina) sobre un tono papel propio de la unidad. Sigue siendo calmo (patrón negro sobre papel, S bajo) y deja de pintar todas las unidades con la misma tapa. Solo en temas geológicos (sección, bloque, columna). |
| Juez pide S p90 ≤ 0,45; la convención usa colores fuertes (alteración, grupos de salida, rampas) | Las codificaciones del tema se declaran en la ficha (`variable`, leyenda) y usan paletas **ordenadas por luminancia** y desaturadas (S ≤ 0,45). Los óxidos reales en roca ya son S 0,17–0,28 (T6). Solo el precipitado de Fe (T11) y la pieza señalada usan acento. El juez mide la paleta excluyendo los píxeles declarados como codificación, y les exige leyenda. |
| Realismo mide textura y color; limpieza los prohíbe | El realismo pasa a medir **estructura** con pose igualada (silueta, puntos clave, proporciones). Colorido y bordes quedan informativos. |
| Fotos reales ruidosas como patrón | Las fotos sirven para forma, proporción, rasgos y color medido en regiones; nunca para el nivel de ruido. |

## 9. Lo que Geotechnic hoy no cumple

Leído en la skill (solo lectura, 19-10-2026). Cada punto dice el dueño probable.

| # | Falta | Dónde se ve | Regla | Dueño |
|---|---|---|---|---|
| N1 | La línea de realismo mide bordes y colorido globales, que no distinguen la foto correcta (AUC 0,50) y chocan con la limpieza. En el scoop color papel reprueba por diseño. | `references/juez.md` línea realismo; `juez/realismo.py` | V1–V3 | juez |
| N2 | Los pares captura-foto no verifican la pose. Hay vistas trasera contra frontal en el jumbo y fondo de pasto contra piso gris en el scoop. | hojas de realismo; `pares.json` | V4 | orquestador-escenas, juez |
| N3 | La fidelidad mide cotas del modelo, no proporciones en la imagen: aprobó un cucharón bajo con dientes largos. | `juez/fidelidad.mjs`, scoop | V5 | juez, equipo-scoop |
| N4 | La foto de referencia del talud-tajo (Yanacancha 01) es ≈ la mitad cielo y muestra un botadero, no una pared de tajo. Hay figuras de flotación y túneles en la carpeta dispatch. | `ejemplos/talud-tajo/ficha.mjs` línea 46; `figuras\dispatch\` | V10 | orquestador-escenas |
| N5 | Las paletas de óxidos del kit son vivas: limonita #b07a3c (S ≈ 0,66), jarosita #c3a24b (S ≈ 0,62), hematita #8e4a2e (S ≈ 0,68). En la roca real los óxidos miden S 0,17–0,28. | `kit/materiales.js` → `PALETAS` | T6, M3 | roca-terreno, estudio-visual |
| N6 | `hielo()` solo pone escarcha en caras que miran arriba sobre una cota. No hay carámbanos de corona cerca del portal (M8 quedó sin foto). | `kit/volumenes.js` → `hielo` | T17 | roca-terreno |
| N7 | La tapa de sección es un solo token (`tapa`) y el estudio prohíbe hachurado: en un corte todas las litologías se ven iguales. No hay patrones FGDC ni código de unidad. | `references/estudio.md`; `kit/estudio.js` | C3, §8 | estudio-visual |
| N8 | No hay leyenda de colores, flecha norte, escala gráfica, cotas ni aviso de exageración vertical en los ejemplos ni en el kit. | `ejemplos/*`, `kit/escena.js`, `kit/senalar.js` (sin coincidencias) | C1, C5, A11 | orquestador-escenas, estudio-visual |
| N9 | Contactos, fallas y zonas no tienen atributo de certeza ni tipo de línea (cierto, inferido, cubierto, gradacional). | `kit/fracturas.js`, `kit/volumenes.js` | C4, A10 | roca-terreno |
| N10 | `polosSchmidt` sí es igual área y hemisferio inferior, pero ningún ejemplo lo muestra, no lleva leyenda (n, contorno) y nadie verifica que el color de la familia sea el mismo en la red y en el 3D. | `kit/fracturas.js` línea 149; `ejemplos/` | C2, T5 | roca-terreno, orquestador-escenas |
| N11 | No hay objeto de escala declarado (persona, jalón, barra) en scoop ni jumbo. El talud tiene un camión, pero sin atributo que el juez cuente. | `ejemplos/*/escena.js` | A11 | orquestador-escenas |
| N12 | El juez no mide comprensión. El modo en blanco solo rotula. No hay elección forzada, estimación de buzamiento ni calibración agente contra usuario. | `references/juez.md`; `kit/senalar.js` | V7–V9 | juez |
| N13 | La animación tiene «Pausar» pero no avance por pasos ni cuadros clave numerados para el estudiante (la hoja de cuadros es solo para el crítico). | `ejemplos/frente-jumbo/escena.js`; `references/verificar.md` | A6, A7 | orquestador-escenas |
| N14 | Conos de detritus de la malla en banco siguen pendientes. | `reglas-roca.md` R13 | E6 | roca-terreno, equipo-perforadora |
| N15 | Siete equipos siguen en la v1 (`kit/equipos.js`): camión, pala, perforadora, cargador, empernador, shotcrete, volquete. El juez no verifica pórtico y cables tensos de la pala, cable de cola, carrusel del empernador ni número de flota. | `SKILL.md`, `references/agentes.md` | E1–E7 | equipo-pala, equipo-camion, equipo-cargador, equipo-perforadora, equipo-empernador, equipo-shotcrete |
| N16 | Solo hay 3 ejemplos (talud, scoop, jumbo). No hay testigos, relaves, planta, dispatch, voladura, ventilación ni convenciones (sección, bloque, columna). | `ejemplos/` | `temas.json` | orquestador-escenas |
| N17 | La paleta se mide sobre el recorte, no sobre la máquina: un recorte holgado la debilita (lo dice el propio juez). | `references/juez.md` «Paleta en v2» | C14 | juez, orquestador-escenas |
| N18 | El color del agua no depende del cielo; no existe la playa de relave. | `kit/volumenes.js` → `agua`, `kit/escena.js` | T10 | roca-terreno |
| N19 | Las fotos nuevas de `investigacion\` no están registradas en el catálogo de fuentes (`registrar_ttdata.py` solo lee `figuras\`). | `scripts/fotos/` | — | juez (o quien mantenga fotos) |

## 10. Límites de esta síntesis

- Commons respondió 429 muchas veces. No hay fotos abiertas de malla de voladura (salvo Ozgur 2023), flowsheet,
  estereograma con densidad, medias cañas de precorte, cuña, vuelco, lanzador de shotcrete, sala de dispatch ni SAG por fuera.
- No se leyó la norma FGDC-STD-013-2006 completa ni la de INGEMMET: solo patrones CC0 y leyendas vistas en tesis.
- Las medidas de la CAT 994K, Boltec, Pit Viper y P&H 4100 siguen como estimado (sin fichas abiertas).
- Papers clave bloqueados por editoriales (Skulmowski 2020, de Koning 2007, entre otros). Las reglas de aprendizaje
  se apoyan en revisiones abiertas.
- Experimento de pares cruzados con 5 pares por tema. Los AUC son indicativos.
- No hay todavía notas del usuario: el ICC agente contra usuario está por hacer (`rubrica.md`).
- Miradas: convenciones 50, terreno-roca 30, equipos-procesos > 35, pedagogía 29, evaluación 24 imágenes; el
  sintetizador revisó además Yanacancha 01 y la hoja FGDC.
- Sin foto abierta de pad de lixiviación, de modelo de bloques ni de pique por dentro: solo figuras de tesis
  (estudio). Las fotos de castillo son de Europa; no hay castillo andino abierto.
- Faltan aún, sin tema ni regla: hundimiento por block caving (subsidencia), sondaje diamantino en plataforma,
  topografía con curvas de nivel como base de planos.

## 11. Revisión de completitud (19-10-2026)

Verificación al azar de reglas abriendo el texto (`catalogo\textos\`, marcas «=== pág N ===») o la imagen.

| Regla | Qué se abrió | Resultado |
|---|---|---|
| E2 | hdl:20.500.14076/22793 pág. 33 (figura) | Cifras exactas. «Camión paralelo a las orugas» no está en la figura: se reatribuyó a la foto |
| E11 | hdl:20.500.14076/22796 pág. 68 | Exacta (60"×113", 1200 → 165 mm, 746 kW, 2600 t/h, bolsón 500 t, oruga 2700 mm, faja 1830 mm) |
| P1 | hdl:20.500.14076/22795 pág. 74; hdl:20.500.14076/22523 pág. 31 | Exacta (6 teóricos, 3–5 en práctica; 73 yd³, 120 t, 360 t en 3 pases) |
| P3 | tit:f98d6db20aff3715 págs. 36 y 93; hdl:20.500.14076/22981 pág. 44 | 10 pasos exactos. El 626 m³ es de un tajeo y la fuente no cuadra (552 × 1,2 = 662). Corregida |
| T14 | «Drill core boxes Onkalo 1» | Exacta (17,94 → 22,60 m en 5 filas, tacos, línea roja) |
| T17 | «Adit icicles» | Exacta |
| T19 | hdl:20.500.14076/29218 pág. 74 (figura) | Exacta (contorno 1,5 m sin carga; producción 6,5 y 8,5 m) |
| E9 | `load_haul_dump_cobar_2017_01.jpg` | Exacta (lado del cucharón ≈ llanta, dientes cortos) |
| E12 | hdl:20.500.14076/22415 | Exacta (12,2 × 6,7 m, 40 × 22 pies, 24 MW) |
| A4, A8, A9 | PDF de Mayer 2024, Gagnier 2016, Bond 2021 | Exactas (A8: 62 % es el experimento 2; el 1 dio 76 %) |
