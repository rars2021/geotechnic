# Reglas visuales · roca, taludes y labores

Cada regla salió de mirar fotos reales. La columna Fuente da la clave el catálogo de fuentes y la página, o la foto abierta.
Las fotos de tesis están en `<DATOS>/geotechnic\figuras\<tema>\` (solo estudio); las abiertas en `…\abiertas\`.

## Talud y bancos

| # | Rasgo | Regla para el dibujo | Cómo lo hace el kit | Fuente |
|---|---|---|---|---|
| R1 | Cara vs berma | La cara se ve ≈ 0,6 veces la luminancia de la berma: las horizontales acumulan polvo fino claro | `mallaTalud({ polvoBerma })` mezcla 70–90 % de polvo en caras que miran arriba | Medido en «Operaciones Antamina» (web:4c03d336f75f67fc), Chuquicamata DD 120 (web:5d9edf56d591ceba), «Big truck looks small…» (web:93f29dda0e416c5c) |
| R2 | Estrías de voladura | La cara tiene costillas y surcos casi verticales, siguiendo el buzamiento de la cara, de 0,5–2 m de ancho | `estrias` (ruido de crestas estirado a lo largo de la pendiente) | Antamina (web:4c03d336f75f67fc); Chuquicamata DD 120 |
| R3 | Bloques facetados | La cara no es ruido: son planos (caras de juntas) con aristas, a varias escalas; cada bloque tiene su tono | `relieveBloques` (losas por familia, faceta inclinada por bloque, tono por bloque) | Big truck (web:93f29dda0e416c5c); Alvarez Tovar 2020, hdl:20.500.12394/8743, pág. 73–76 |
| R4 | Huecos oscuros | Los bloques caídos dejan huecos en sombra; las juntas abiertas son líneas oscuras | oscurecimiento por `hueco` y por distancia a la junta (`dist`) | Alvarez Tovar 2020, pág. 76 y 78 |
| R5 | Cresta rota | La cresta nunca es una arista: retrocede 1–2,5 m de forma irregular a lo largo del rumbo | `retroceso`: chaflán con ruido en el rumbo, como mínimo de alturas (la malla no se pliega) | Antamina; Bonilla Vargas 2024, hdl:20.500.14076/28169, fig. 44 («crestas debilitadas producto de precorte») |
| R6 | Talud de escombros | Al pie de cada cara, el material caído forma un talud a su ángulo de reposo, 33°–35°, apoyado en la cara, con bloques más grandes abajo | `escombros: { alto, reposo: 34 }` como máximo de alturas (sin pliegue) + `escombrosTalud` (tamaños lognormales, densidad exponencial desde el pie) | Perales Orellana 2011, hdl:20.500.14076/10463, pág. 116; Big truck; Cisneros Eufracio 2023, hdl:20.500.14076/26749, pág. 211 |
| R7 | Medias cañas | Solo en caras con precorte: huellas verticales de los taladros (127 mm), cada S = 16·D ≈ 2 m, visibles en tramos, no de pie a cresta | `mediasCanas(talud, banco, { espaciado, diametro, visibles })` | Bonilla Vargas 2024, tabla 4 y ec. 6; Lozano Chulán 2025, hdl:20.500.14076/29218, pág. 74 |
| R8 | Trazas de juntas | Las trazas terminan donde termina la junta (persistencia finita). En bermas y pisos el polvo las tapa | `trazasSobreMalla(dfn, geom, { maxNormalY })`: intersección real de cada disco con la malla | Alvarez Tovar 2020, pág. 73 (persistencia) |
| R9 | Geometría de diseño | Banco, cara, berma e interrampa se dibujan con los números del diseño de esa mina, nunca «a ojo» | `perfilBancos({ bancos: [{ altura, cara, berma }] })` y lectura del interrampa | López Nicolaz 2025, hdl:20.500.14076/28951, pág. 25; Cabrera Aquije 2015, hdl:20.500.14076/2094, pág. 32–33 |
| R10 | Berma mínima | Ancho mínimo de berma según la altura de banco: ≈ 7,5 m para 15 m; ≈ 10,5 m para 30 m | dato para `perfilBancos` | Montes Valderrama 2025, hdl:20.500.14076/29234, fig. 12 (Ritchie modificada, Crouse 2008) |
| R11 | Pretil de la vía | Borde de la vía con pretil de material suelto: 2 m de alto, 3 m de base (≈ ¾ de la llanta mayor) | `pretil(curva, { alto, ancho })` | Ojeda Ore 2022, hdl:20.500.14076/22773, fig. 2.14 y 2.16 |
| R12 | Piso de la vía | Liso y claro, con huellas de llanta paralelas; sin relieve de bloques | `huellasNeumatico` y relieve de bloques ×0,08 en horizontales | Chuquicamata DD 120; Antamina |
| R13 | Mallas de perforación en el banco | Antes de la voladura, el piso del banco muestra conos de detrito oscuro en malla regular | (pendiente: conos con `monton` en malla) | Chuquicamata DD 120 (web:5d9edf56d591ceba) |
| R14 | Rampa en espiral | La rampa corta los bancos en diagonal: la pared de encima se corre el ancho de la vía; al vacío, pretil y la cara del banco de abajo (roca, no relleno); pendiente 7–11 % con curvas verticales | `terrenoTajo({ rampa, via })` | Ojeda Ore 2022, hdl:20.500.14076/22773, fig. 2.14 y 2.16; Yupanqui Sánchez 2025, hdl:20.500.14076/29254, pág. 17–18 |
| R15 | Botadero y montón | Relleno suelto a su ángulo de reposo (≈ 34°); la cresta de descarga del botadero lleva pretil | `terrenoTajo({ botadero, palas[].monton })` | R6 (Perales Orellana 2011, pág. 116); R11 |

## Macizo, alteración, fallas y agua

| # | Rasgo | Regla | Kit | Fuente |
|---|---|---|---|---|
| M1 | Zonas que se desvanecen | Ninguna zona de alteración tiene borde nítido: franja ruidosa de 5–10 m que se aclara hacia afuera | `zona({ transicion, ruido })` | Antamina (manchas amarillentas en roca gris clara); Cisneros Eufracio 2023, pág. 191 |
| M2 | Óxidos en fracturas | El óxido de hierro tiñe primero las juntas y chorrea cara abajo por gravedad; luego tiñe la masa | halo `oxidos` junto a la traza + arrastre por columna en `mallaTalud` | Cisneros Eufracio 2023, pág. 191 (franjas pardo-rojizas); Alvarez Tovar 2020, pág. 76 |
| M3 | Colores de alteración | Argílica blanquecina-crema; fílica gris claro; propilítica verde grisácea; óxidos ocre a pardo rojizo (ver `PALETAS`) | `PALETAS` en `materiales.js` | Alvarez Tovar 2020, pág. 76; Antamina; Ferrobamba (Choqueneira 2024, hdl:20.500.14195/561, pág. 16) |
| M4 | Falla con panizo | Banda oscura de 1–2 m, hundida en la cara (el panizo se erosiona), húmeda, con halo alterado claro alrededor | `zona({ tipo: "plano" })` + `extra` (hundimiento) + humedad | Norabuena Huahuachampi 2015, hdl:20.500.14076/2100, pág. 175 (plano de falla); escena `talud-tajo` |
| M5 | Agua en la roca | Bajo la línea de surgencia la roca se oscurece ≈ 40 % y brilla; desde las fracturas bajan chorreras verticales | atributo `humedad` (oscurece y baja la rugosidad) + `agua({ nivel, chorreras })` | Alvarez Tovar 2020, pág. 78 |
| M6 | Charcos | En labores y pisos, el agua se junta en las huellas: superficies negras que reflejan las luces | `charcos(galeria)` | Huaira Rondo 2025, hdl:20.500.14076/28632, pág. 29; VKG Ojamaa (web:c384dece32be4e9a) |
| M7 | Goteo | En labores, gotas desde la corona en puntos fijos | `goteo(puntos)` | fotos de labores del catálogo (Guevara Carbajal 2025, hdl:20.500.14195/1441, pág. 124) |
| M8 | Hielo | Escarcha solo en caras que miran arriba sobre una cota; carámbanos bajo surgencias | `hielo({ cota })` | regla general; falta foto propia en el catálogo de fuentes |
| M9 | Polvo | Nube clara (#cdbfa9) que nace en la broca, las llantas o la voladura y deriva con el viento | `polvo({ ... }).emitir(p)` | Lucano Chuan 2014, hdl:20.500.14076/6645, pág. 25 (Pit Viper); «Voladura Antamina» (web:a4df6f7f1afebe8e) |

## Labores subterráneas

| # | Rasgo | Regla | Kit | Fuente |
|---|---|---|---|---|
| L1 | Contorno | Nunca un tubo liso: bloques caídos según las juntas, sobreexcavación de 0,1–0,4 m, escalón por disparo | `galeria({ dfn, sobreexcavacion })` | Vega Merino 2021, hdl:20.500.14076/22414, pág. 30; Rodríguez Robles 2015, hdl:20.500.14076/2154, pág. 97 |
| L2 | Shotcrete | Gris claro uniforme, suaviza el contorno pero conserva las ondas grandes; borde irregular | `shotcrete: { desde, hasta }` | Gutiérrez Castillo 2019, tit:deffc39122d83388, pág. 87 |
| L3 | Pernos | Placas cuadradas con tuerca, en malla regular (tresbolillo), sobre la roca sin shotcrete o encima | `pernos(galeria)` | Garrido Llosa 2015, hdl:20.500.14076/2101, fig. 24 |
| L4 | Manga de ventilación | Tela amarilla con anillos, colgada de la corona y aplastada arriba contra su cable | `mangaVentilacion` | Huaira Rondo 2025, hdl:20.500.14076/28632, pág. 31; Guevara Carbajal 2025, hdl:20.500.14195/1441, pág. 125 |
| L5 | Luz | Bajo tierra solo alumbran los faros del equipo y la lámpara de casco: pozos de luz y oscuridad, sin luz de cielo | `crearEscena({ fondo: "subterraneo" })` + `SpotLight` en el casco | Rodríguez Robles 2015, hdl:20.500.14076/2154, pág. 97; Vega Merino 2021, hdl:20.500.14076/22414, pág. 30 |
| L6 | Frente | Cóncavo, rugoso, con la malla pintada (rojo cargado, azul vacío) y la línea de gradiente | `frente(galeria, { taladros })` + pintura en la escena | Núñez Soras 2023, hdl:20.500.14195/498, pág. 113; Mera Villalobos 2023, hdl:20.500.14076/24847, pág. 47 |
