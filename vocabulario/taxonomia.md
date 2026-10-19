# Taxonomía geotechnic · v0.1 (2026-10-18)

_Generado por `vista.py` desde `taxonomia.json`; no se edita a mano. Estado: borrador para revisión del usuario (G1)._

Vocabulario de condiciones del terreno minero para el catálogo de fuentes y la skill geotechnic. Cada valor genera el tag geo:<dimensión>:<valor>. 'es' y 'en' son términos de búsqueda (título, resumen, palabras clave, texto); 'preferir' son palabras que aparecen en leyendas de figuras (si falta, se usan 'es' y 'en'); 'se_ve' es lo que la figura debería mostrar; 'numeros' son los parámetros que lo gobiernan.

Tag: `geo:<dimension>:<valor>`.

**Documentos en el catálogo de fuentes** (título, temas o resumen): columna «el catálogo de fuentes». 140 valores, 117 con 25 o más, 0 sin ninguno.

## Escalas

| Escala | Términos ES | Términos EN | Orden | Skill |
|---|---|---|---|---|
| Región | franja metalogenética, distrito minero, región | metallogenic belt, mining district, regional | 10 km – 100 km | geotechnic |
| Cerro o yacimiento | cerro, ladera, yacimiento, depósito | hillside, deposit, orebody | 500 m – 5 km | geotechnic |
| Tajo o mina | tajo, tajo abierto, mina subterránea, nivel | open pit, underground mine, mine level | 100 m – 2 km | geotechnic |
| Banco o labor | banco, talud de banco, labor, galería, tajeo | bench, drift, stope, excavation | 5 m – 100 m | geotechnic |
| Frente o afloramiento | frente, frente de avance, afloramiento, cara del talud, corona, hastial | face, heading, outcrop, rock face, sidewall, back | 1 m – 10 m | geotechnic |
| Testigo | testigo, caja de testigos, logueo, sondaje diamantino | drill core, core box, core logging | 1 cm – 5 m | ambas |
| Probeta o laboratorio | probeta, ensayo de laboratorio, compresión uniaxial, triaxial, corte directo | specimen, laboratory test, uniaxial compression, triaxial, direct shear | 1 cm – 30 cm | anatomia |

## D1 · Yacimiento y litología (`yacimiento`)

Qué cuerpo mineralizado es y en qué roca está. Define la forma, los contactos y qué alteraciones esperar.

| Valor | Términos ES | Términos EN | Leyendas de figuras | Se ve | Números | el catálogo de fuentes |
|---|---|---|---|---|---|---:|
| **yacimiento** | | | | | | |
| Pórfido de Cu-Mo<br>`porfido-cu-mo` | pórfido de cobre, pórfido cu-mo, pórfido cuprífero, cobre porfirítico | porphyry copper, porphyry cu-mo, porphyry deposit | — | stock intrusivo con stockwork y zonación concéntrica de alteración | ley de Cu, diámetro del sistema, profundidad de la zona de enriquecimiento | 136 |
| Pórfido de Cu-Au<br>`porfido-cu-au` | pórfido cu-au, pórfido de cobre-oro | porphyry cu-au, gold-rich porphyry | — | como el Cu-Mo, con más magnetita y alteración potásica | ley de Au, ley de Cu | 11 |
| Epitermal de alta sulfuración<br>`epitermal-as` | epitermal de alta sulfuración, alta sulfuración, sílice oquerosa | high sulfidation epithermal, high-sulphidation, vuggy silica | alta sulfuración, sílice oquerosa, vuggy | cuerpos de sílice oquerosa con halo de argílica avanzada, sin vetas definidas | ley de Au, espesor del cuerpo silíceo | 84 |
| Epitermal de baja o intermedia sulfuración<br>`epitermal-bs` | epitermal de baja sulfuración, sulfuración intermedia, vetas epitermales, veta de cuarzo | low sulfidation epithermal, intermediate sulfidation, epithermal vein | — | vetas bandeadas de cuarzo y adularia o carbonatos, con roca caja propilitizada | potencia de veta, buzamiento, ley de Au y Ag | 37 |
| Skarn<br>`skarn` | skarn, exoskarn, endoskarn, metasomatismo de contacto | skarn, exoskarn, endoskarn, contact metasomatism | — | contacto intrusivo–caliza con granate y piroxeno zonados | ley de Cu, Zn o Fe, ancho del frente de skarn | 157 |
| Reemplazamiento en carbonatos (Ag-Pb-Zn)<br>`reemplazamiento-carbonatos` | reemplazamiento en carbonatos, mantos y chimeneas, cuerpos de reemplazamiento, polimetálico, plata plomo zinc | carbonate replacement deposit, carbonate-hosted, manto deposit, polymetallic | reemplazamiento, cuerpo, manto, chimenea | cuerpos irregulares que siguen fallas y estratos de caliza, con oquedades kársticas (tipo Uchucchacua) | ley de Ag, ley de Pb y Zn, forma del cuerpo | 242 |
| Vetas mesotermales u orogénicas de Au<br>`vetas-mesotermales` | veta aurífera, oro orogénico, vetas mesotermales, cuarzo aurífero | orogenic gold, mesothermal vein, lode gold, shear-hosted gold | — | vetas angostas de cuarzo en zonas de cizalla, en pizarras o intrusivos | potencia de veta, ley de Au | 24 |
| Sulfuros masivos volcanogénicos<br>`vms` | sulfuros masivos volcanogénicos, sulfuros masivos, vms | volcanogenic massive sulfide, vms, massive sulphide | — | lentes de sulfuro masivo sobre un stockwork de alimentación | ley de Cu y Zn, espesor de la lente | 37 |
| Óxidos de Fe-Cu-Au (IOCG)<br>`iocg` | óxidos de hierro cobre oro, iocg, yacimiento de hierro, magnetita-apatito | iron oxide copper gold, iocg, iron ore deposit | — | brechas y mantos de magnetita o hematita con calcopirita (tipo Marcona, Condestable) | ley de Fe, ley de Cu | 57 |
| Estratoligado<br>`estratoligado` | estratoligado, manto estratiforme, sedimentario exhalativo | stratabound, stratiform, sedex | — | capas mineralizadas concordantes con la estratificación | potencia, buzamiento | 10 |
| Placer o aluvial<br>`placer` | placer, aurífero aluvial, depósito aluvial | placer, alluvial gold | — | gravas sin consolidar con oro libre; sin macizo rocoso | ley en g/m³, espesor de grava | 32 |
| **litologia** | | | | | | |
| Roca intrusiva<br>`intrusivo` | intrusivo, granodiorita, diorita, monzonita, tonalita, granito, pórfido | intrusive, granodiorite, diorite, monzonite, granite | — | roca masiva granular, diaclasas en bloques | UCS, mi | 615 |
| Roca volcánica<br>`volcanico` | andesita, dacita, riolita, toba, volcánico, volcanoclástico, brecha volcánica | andesite, dacite, rhyolite, tuff, volcanic, volcaniclastic | — | coladas y tobas estratificadas, a menudo alteradas | UCS, mi | 709 |
| Roca carbonatada<br>`carbonatado` | caliza, dolomita, mármol, margas | limestone, dolomite, marble, marl | — | capas con disolución y karst, contactos con skarn o reemplazamiento | UCS, mi, espaciado de estratos | 454 |
| Roca sedimentaria clástica<br>`clastico` | arenisca, lutita, limolita, conglomerado, cuarcita | sandstone, shale, siltstone, conglomerate, quartzite | — | estratos alternados duros y blandos; las lutitas se degradan con el agua | UCS, durabilidad (slake) | 395 |
| Roca metamórfica<br>`metamorfico` | pizarra, esquisto, filita, gneis, hornfels | slate, schist, phyllite, gneiss, hornfels | — | foliación penetrativa que gobierna la falla | UCS paralelo y normal a la foliación, anisotropía | 108 |

## D2 · Alteración hidrotermal (`alteracion`)

Cómo los fluidos cambiaron la roca. Es gradacional: se desvanece desde la veta o el centro del sistema. Baja la resistencia y cambia el comportamiento en planta.

- **Intensidad**: débil; moderada; fuerte; intensa _(EN: weak, moderate, strong, intense)_
- **Estilo**: pervasiva; selectiva; en venillas; en halos; en parches _(EN: pervasive, selective, veinlet-controlled, vein halo, patchy)_

| Valor | Términos ES | Términos EN | Leyendas de figuras | Se ve | Números | el catálogo de fuentes |
|---|---|---|---|---|---|---:|
| Potásica<br>`potasica` | alteración potásica, feldespato potásico, biotita secundaria, biotitización | potassic alteration, k-feldspar, secondary biotite | potásica, potasica, potassic, biotita | roca rosada o pardo oscura, venillas de cuarzo y feldespato K; núcleo del pórfido | UCS (suele ser alto), % de biotita secundaria | 27 |
| Fílica o cuarzo-sericita-pirita<br>`filica` | alteración fílica, cuarzo sericita, sericitización, alteración sericítica, qsp | phyllic alteration, quartz-sericite-pyrite, sericitic alteration, qsp | fílica, filica, sericita, phyllic, qsp | roca blanquecina a gris verdosa, blanda al tacto, con pirita diseminada | UCS, GSI, % de sericita | 47 |
| Argílica intermedia<br>`argilica` | alteración argílica, argilización, arcillas | argillic alteration, argillization, clay alteration | argílica, argilica, arcilla, argillic | roca blanda, terrosa, que se deshace con el agua | UCS, % de arcillas, durabilidad | 286 |
| Argílica avanzada<br>`argilica-avanzada` | argílica avanzada, alunita, pirofilita, dickita, caolinita | advanced argillic, alunite, pyrophyllite, dickite | argílica avanzada, alunita, advanced argillic | roca blanca, a veces silicificada en el núcleo; litocap | UCS (muy variable), % de alunita | 110 |
| Propilítica<br>`propilitica` | alteración propilítica, clorita, epidota, calcita, cloritización | propylitic alteration, chlorite, epidote, chloritization | propilítica, propilitica, propylitic, clorita, epidota | roca verdosa, halo externo amplio; casi no cambia la resistencia | UCS, % de clorita | 180 |
| Silicificación<br>`silicificacion` | silicificación, sílice, cuarzo masivo, sílice oquerosa | silicification, silica, vuggy silica | silicificación, silicificacion, sílice, silica | roca dura, vítrea y frágil; fractura mucho al volar | UCS (alto), frecuencia de fracturas | 232 |
| Calcosilicatada (skarn)<br>`calcosilicatada` | granate, piroxeno, wollastonita, calcosilicatos, skarnificación | calc-silicate, garnet, pyroxene, wollastonite | — | bandas de granate pardo y piroxeno verde junto al contacto | UCS, densidad | 41 |
| Dolomitización, marmolización y decarbonatación<br>`carbonatos` | dolomitización, marmolización, recristalización, decarbonatación, rodocrosita | dolomitization, marbleization, decarbonation | — | caliza recristalizada, blanqueada o con cavidades | UCS, porosidad | 27 |
| Zona lixiviada<br>`lixiviado` | zona lixiviada, capa lixiviada, lixiviación supergénica, limonitas, gossan | leached cap, leached zone, gossan, limonite | lixiviad, gossan, limonita, leached | roca oxidada ocre a rojiza con cavidades de sulfuros disueltos | espesor, tipo de limonita (goethita, jarosita, hematita) | 32 |
| Zona de óxidos<br>`oxidos` | zona de óxidos, óxidos de cobre, malaquita, crisocola, oxidación | oxide zone, copper oxides, malachite, chrysocolla | óxido, oxido, oxide, malaquita | verdes y azules de óxidos de cobre sobre roca oxidada | ley de CuS (soluble), espesor | 308 |
| Enriquecimiento secundario<br>`enriquecimiento` | enriquecimiento secundario, sulfuros secundarios, calcosina, calcocita, covelita | supergene enrichment, secondary sulfides, chalcocite, covellite | enriquecimiento, supergén, calcosina, calcocita, enrichment | manto bajo los óxidos con sulfuros negro azulados | ley de Cu, espesor del manto | 61 |

## D3 · Meteorización y cobertura (`meteorizacion`)

Degradación desde la superficie. Gradacional, sin borde nítido. Escala ISRM W1 a W6.

| Valor | Términos ES | Términos EN | Leyendas de figuras | Se ve | Números | el catálogo de fuentes |
|---|---|---|---|---|---|---:|
| W1 · Fresca<br>`w1` | roca fresca, roca sana, sin meteorización | fresh rock, unweathered | — | sin decoloración | UCS | 7 |
| W2 · Ligeramente meteorizada<br>`w2` | ligeramente meteorizada, ligeramente alterada, decoloración en juntas | slightly weathered | — | decoloración solo en las superficies de las juntas | UCS | 5 |
| W3 · Moderadamente meteorizada<br>`w3` | moderadamente meteorizada, moderadamente alterada | moderately weathered | — | menos de la mitad de la roca descompuesta; núcleos sanos | UCS, % de roca descompuesta | 7 |
| W4 · Altamente meteorizada<br>`w4` | altamente meteorizada, muy meteorizada, fuertemente alterada | highly weathered | — | más de la mitad descompuesta; bolones sueltos | % de roca descompuesta | 18 |
| W5 · Completamente meteorizada<br>`w5` | completamente meteorizada, saprolito, descompuesta | completely weathered, saprolite | — | se conserva la textura pero es suelo | parámetros de suelo (c, φ) | 5 |
| W6 · Suelo residual<br>`w6` | suelo residual | residual soil | — | suelo sin textura de la roca | c, φ | 10 |
| Depósito coluvial<br>`coluvial` | coluvial, coluvio, talud de detritos, escombros de ladera | colluvium, colluvial, scree, talus | — | bloques angulosos en matriz, al pie de laderas | c, φ, espesor | 248 |
| Depósito glaciar (morrena)<br>`glaciar` | morrena, depósito glaciar, fluvioglaciar | moraine, glacial till, glacial deposit | — | bloques redondeados en matriz fina; común sobre 4000 m | c, φ, espesor | 28 |
| Depósito aluvial o cuaternario<br>`aluvial` | aluvial, depósito cuaternario, gravas, material de cobertura | alluvium, quaternary cover, gravels, overburden | — | gravas y arenas estratificadas | c, φ, espesor | 452 |

## D4 · Estructura y discontinuidades (`estructura`)

Lo que separa el macizo en bloques. Siempre estadístico: una familia es una nube de orientaciones con espaciado y persistencia distribuidos, nunca tres planos perfectos.

- **Espaciado (ISRM)**: extremadamente junto < 20 mm; muy junto 20–60 mm; junto 60–200 mm; moderado 200–600 mm; separado 0,6–2 m; muy separado 2–6 m; extremadamente separado > 6 m _(EN: spacing)_
- **Persistencia (ISRM)**: muy baja < 1 m; baja 1–3 m; media 3–10 m; alta 10–20 m; muy alta > 20 m _(EN: persistence)_
- **Abertura**: cerrada; muy angosta < 0,1 mm; angosta 0,1–1 mm; abierta 1–5 mm; muy abierta > 5 mm _(EN: aperture)_
- **Relleno**: limpio; óxidos; calcita; cuarzo; yeso; clorita; arcilla; panizo _(EN: clean, oxide coating, calcite, quartz, gypsum, chlorite, clay, gouge)_
- **Rugosidad (ISRM)**: escalonada rugosa; escalonada lisa; escalonada estriada; ondulada rugosa; ondulada lisa; ondulada estriada; plana rugosa; plana lisa; plana estriada _(EN: roughness, JRC)_
- **Dispersión de la familia**: concentrada (K > 100); moderada (K 20–100); dispersa (K < 20) _(EN: Fisher K, dispersion)_

| Valor | Términos ES | Términos EN | Leyendas de figuras | Se ve | Números | el catálogo de fuentes |
|---|---|---|---|---|---|---:|
| Familia de juntas o diaclasas<br>`juntas` | familia de discontinuidades, diaclasas, juntas, fracturas, sistema de discontinuidades, orientación de discontinuidades | joint set, joints, discontinuities, fracture set, discontinuity orientation | familia, diaclasa, discontinuidad, joint, estereograma, estereográfica | trazas paralelas imperfectas que cortan la cara en bloques | orientación (buzamiento/dirección de buzamiento), K de Fisher, espaciado, persistencia, Jn | 398 |
| Estratificación<br>`estratificacion` | estratificación, estratos, planos de estratificación | bedding, bedding planes, strata | — | planos continuos que pueden gobernar la estabilidad del talud | orientación, espesor de estrato | 319 |
| Foliación o esquistosidad<br>`foliacion` | foliación, esquistosidad, clivaje | foliation, schistosity, cleavage | — | planos muy juntos y penetrativos; roca anisótropa | orientación, anisotropía de resistencia | 40 |
| Falla<br>`falla` | falla, falla geológica, falla regional, falla principal, panizo | fault, fault zone, fault gouge | falla, fault, panizo | zona con panizo, roca triturada y estrías; corta todo lo demás | orientación, espesor de la zona, tipo de relleno, continuidad | 1025 |
| Zona de cizalla<br>`cizalla` | zona de cizalla, cizallamiento, milonita | shear zone, shearing, mylonite | — | banda de roca deformada y fracturada, ancha y continua | ancho, orientación | 40 |
| Brecha<br>`brecha` | brecha, brecha hidrotermal, brecha tectónica, brecha de turmalina | breccia, hydrothermal breccia, tectonic breccia | — | fragmentos angulosos en matriz o cemento | % de matriz, UCS | 145 |
| Vetas y venillas<br>`vetas` | veta, venillas, stockwork, enrejado | vein, veinlets, stockwork | — | planos rellenos de cuarzo o sulfuros que pueden ser más débiles que la roca | frecuencia de venillas, potencia de veta, relleno | 842 |
| Dique<br>`dique` | dique, sill, intrusión tabular | dyke, dike, sill | — | cuerpo tabular de otra roca con contactos fracturados | espesor, orientación | 184 |
| Karst y cavidades<br>`karst` | karst, cavidades, cavernas, disolución, oquedades | karst, cavities, dissolution, voids | — | huecos irregulares en caliza, a veces con agua o arcilla | tamaño de cavidad, frecuencia | 290 |
| Pliegue<br>`pliegue` | pliegue, anticlinal, sinclinal, plegamiento | fold, anticline, syncline | — | estratos curvados; juntas de tensión en la charnela | eje y plano axial | 154 |

## D5 · Calidad del macizo (`calidad`)

Clasificaciones que resumen D1–D4 y D6 en un número. Son la entrada de los diseños empíricos.

- **Clase**: muy buena; buena; regular; mala; muy mala _(EN: very good, good, fair, poor, very poor)_

| Valor | Términos ES | Términos EN | Leyendas de figuras | Se ve | Números | el catálogo de fuentes |
|---|---|---|---|---|---|---:|
| RQD<br>`rqd` | rqd, designación de calidad de roca, índice de calidad de roca | rqd, rock quality designation | — | caja de testigos con tramos ≥ 10 cm medidos | RQD %, frecuencia de fracturas por metro | 165 |
| RMR (Bieniawski)<br>`rmr` | rmr, valoración del macizo rocoso, clasificación de bieniawski, rock mass rating | rmr, rock mass rating, bieniawski | — | planilla de mapeo con los cinco parámetros | RMR89, RMR14, puntaje de agua, ajuste por orientación | 566 |
| Índice Q (Barton)<br>`q` | índice q, sistema q, clasificación de barton, q de barton | q-system, q index, barton q | índice q, sistema q, barton | ábaco de sostenimiento Q contra luz equivalente | Q, Jn, Jr, Ja, Jw, SRF, ESR | 126 |
| GSI<br>`gsi` | gsi, índice de resistencia geológica, índice geológico de resistencia | gsi, geological strength index | — | la tabla GSI: estructura (bloques a desintegrada) contra condición de superficies | GSI, D (factor de perturbación) | 214 |
| MRMR (Laubscher)<br>`mrmr` | mrmr, laubscher, valoración minera del macizo | mrmr, mining rock mass rating, laubscher | — | ábaco de hundibilidad por radio hidráulico | IRMR, MRMR, ajustes | 7 |
| SMR (Romana)<br>`smr` | smr, slope mass rating, romana | smr, slope mass rating | — | talud con la familia desfavorable marcada | SMR, F1–F4 | 55 |
| Resistencia de la roca intacta<br>`resistencia-intacta` | resistencia a la compresión uniaxial, carga puntual, martillo schmidt, esclerómetro, ensayo de compresión | uniaxial compressive strength, ucs, point load, schmidt hammer | compresión, carga puntual, schmidt, ucs | ensayo de campo o de laboratorio (las figuras de laboratorio son de anatomía) | UCS (MPa), Is50, rebote R | 146 |
| Criterio de Hoek-Brown<br>`hoek-brown` | hoek-brown, hoek y brown, criterio de rotura, envolvente de falla | hoek-brown, failure criterion, strength envelope | — | envolvente curva σ1–σ3 del macizo frente a la roca intacta | σci, mi, mb, s, a, D | 91 |

## D6 · Agua (`agua`)

Cambia el comportamiento y lo que se ve. Las cinco primeras son las condiciones del RMR y del Jw.

| Valor | Términos ES | Términos EN | Leyendas de figuras | Se ve | Números | el catálogo de fuentes |
|---|---|---|---|---|---|---:|
| Seco<br>`seco` | completamente seco, condición seca | completely dry | — | superficie mate, polvo | puntaje 15 (RMR89), Jw = 1 | 3 |
| Húmedo<br>`humedo` | condición húmeda, macizo húmedo, juntas húmedas | damp, damp conditions | — | superficie oscurecida sin brillo | puntaje 10 | 4 |
| Mojado<br>`mojado` | mojado, superficie mojada | wet | — | brillo en juntas y superficies | puntaje 7 | 31 |
| Goteo<br>`goteo` | goteo, goteando, filtración | dripping, seepage | goteo, filtración, filtracion, seepage | gotas desde la corona, charcos en el piso | puntaje 4, caudal por 10 m de túnel | 203 |
| Flujo<br>`flujo` | flujo de agua, flujo continuo, agua a presión, irrupción de agua, inundación | flowing, water inflow, water inrush, flooding | flujo, irrupción, inflow, inundación | chorros desde juntas o sondajes, piso inundado | puntaje 0, Jw 0,05–0,5, caudal L/s | 307 |
| Nivel freático y presión de poros<br>`nivel-freatico` | nivel freático, napa freática, presión de poros, piezometría, agua subterránea | water table, phreatic surface, pore pressure, groundwater | freático, freatico, presión de poros, piezómetro, water table | línea freática dentro del talud que baja hacia la cara | ru, altura del nivel, presión de poros | 671 |
| Drenaje y despresurización<br>`drenaje` | drenaje, drenes horizontales, pozos de bombeo, despresurización, galería de drenaje, bombeo | drainage, horizontal drains, dewatering, depressurization, pumping wells | — | drenes en abanico en la cara, pozas y bombas | caudal, abatimiento | 928 |
| Agua ácida y eflorescencias<br>`agua-acida` | drenaje ácido de mina, agua ácida, eflorescencias, sulfatos | acid mine drainage, acid rock drainage, efflorescence | — | costras amarillas, blancas o rojizas; agua anaranjada | pH, conductividad | 230 |
| Hielo y congelamiento<br>`hielo` | congelamiento, hielo, permafrost, carámbanos, gelifracción, ciclos de hielo y deshielo | freezing, ice, permafrost, freeze-thaw, icicles | — | carámbanos en la corona, hielo en juntas que abre bloques | ciclos de hielo y deshielo al año, temperatura | 121 |
| Agua termal<br>`agua-termal` | agua termal, aguas calientes, geotermia en mina | hot water, thermal water | — | vapor en la labor | temperatura del agua | 21 |
| Lluvia y erosión superficial<br>`lluvia-erosion` | precipitación, escorrentía, erosión de taludes, huaico, temporada de lluvias | rainfall, runoff, slope erosion, debris flow | — | cárcavas en la cara, flujos de detritos en quebradas | precipitación mm/día | 518 |

## D7 · Esfuerzos, daño y modos de falla (`dano`)

Lo que le pasa a la excavación. La forma real después de excavar casi nunca es la de diseño.

| Valor | Términos ES | Términos EN | Leyendas de figuras | Se ve | Números | el catálogo de fuentes |
|---|---|---|---|---|---|---:|
| **subterranea** | | | | | | |
| Caída de planchones y cuñas<br>`planchones` | caída de rocas, planchones, cuña, desprendimiento, bloque inestable | rockfall, wedge failure, falls of ground, structurally controlled failure | planchón, planchon, cuña, cuna, caída de roca, wedge | hueco en la corona con la forma de la intersección de familias | tamaño de bloque, FS de la cuña | 566 |
| Chispeo y desprendimiento progresivo<br>`chispeo` | chispeo, desprendimiento progresivo, desmoronamiento | ravelling, raveling, progressive loosening | — | pequeños fragmentos que caen de roca muy fracturada | GSI bajo | 7 |
| Lajamiento<br>`lajamiento` | lajamiento, descostramiento, spalling | spalling, slabbing | — | lajas paralelas al contorno en las zonas de mayor esfuerzo | σmax/σci, profundidad | 13 |
| Estallido de roca<br>`estallido` | estallido de roca, estallido de rocas, sismicidad inducida | rockburst, strainburst, induced seismicity | — | eyección violenta de roca, sostenimiento roto | σ1/σci, magnitud sísmica, energía | 154 |
| Convergencia y roca expansiva<br>`convergencia` | convergencia, deformación, roca expansiva, hinchamiento, squeezing, roca fluyente | convergence, squeezing, swelling, large deformation | — | sección que se cierra, cimbras dobladas, piso levantado | % de convergencia, σcm/p0 | 488 |
| **voladura** | | | | | | |
| Sobrerotura y daño por voladura<br>`sobrerotura` | sobrerotura, sobreexcavación, daño por voladura, zona de daño, vibraciones | overbreak, blast damage, damage zone, blast vibration, ppv | sobrerotura, sobreexcavación, daño, overbreak, ppv | contorno irregular más allá de la línea de diseño; medias cañas ausentes | % de sobrerotura, PPV (mm/s), factor de carga | 386 |
| Subexcavación y tacos<br>`subexcavacion` | subexcavación, tacos, lomos, piso irregular | underbreak, toe, bootleg | — | roca que queda dentro de la sección o en el pie del banco | volumen, altura del pie | 24 |
| **taludes** | | | | | | |
| Falla planar<br>`falla-planar` | falla planar, deslizamiento planar, rotura plana | planar failure, plane failure | — | bloque que desliza por una familia que aflora en la cara | buzamiento del plano, φ, FS | 10 |
| Falla en cuña<br>`falla-cuna` | falla en cuña, rotura en cuña, deslizamiento en cuña | wedge failure | — | cuña en V entre dos familias, a escala de banco | inmersión de la intersección, FS | 6 |
| Vuelco<br>`vuelco` | vuelco, volteo, toppling, rotura por vuelco | toppling, flexural toppling, block toppling | — | columnas que se inclinan hacia la cara | buzamiento hacia el talud, espaciado | 44 |
| Falla circular o del macizo<br>`falla-circular` | falla circular, rotura circular, deslizamiento rotacional, inestabilidad global | circular failure, rotational failure, overall slope failure | — | superficie curva que atraviesa varios bancos en roca muy fracturada o suelo | FS global, altura del talud, GSI | 20 |
| Caída de rocas en talud<br>`caida-rocas` | caída de rocas, rodado de bloques, berma de contención | rockfall, rock fall catchment | — | bloques que ruedan y saltan por los bancos | ancho de berma, energía | 372 |
| **hundimiento** | | | | | | |
| Subsidencia y hundimiento<br>`subsidencia` | subsidencia, hundimiento, cráter, zona de quiebre | subsidence, caving crater, fracture zone | — | cráter y grietas en superficie sobre una explotación | ángulo de quiebre, radio hidráulico | 204 |
| Falla de pilar y de puente<br>`falla-pilar` | falla de pilar, colapso de pilar, puente de roca, losa | pillar failure, crown pillar, sill pillar | — | pilar con lajas, reloj de arena, colapso | FS del pilar, relación ancho/alto | 72 |

## D8 · Excavación (`excavacion`)

La geometría minera. Se dibuja la real (irregular), no la de catálogo.

| Valor | Términos ES | Términos EN | Leyendas de figuras | Se ve | Números | el catálogo de fuentes |
|---|---|---|---|---|---|---:|
| **tajo** | | | | | | |
| Banco (cara, cresta, pie)<br>`banco` | banco, cara del banco, cresta, pie del banco, altura de banco | bench, bench face, crest, toe, bench height | — | cara con medias cañas, cresta redondeada por la voladura | altura, ángulo de cara | 439 |
| Berma<br>`berma` | berma, berma de seguridad, berma de contención | berm, catch bench, safety berm | — | plataforma con material caído en el borde interior | ancho de berma | 33 |
| Talud interrampa y global<br>`talud-interrampa` | ángulo interrampa, talud global, ángulo de talud, diseño de taludes | inter-ramp angle, overall slope angle, slope design | — | sucesión de bancos entre rampas, perfil global | ángulo interrampa, ángulo global, altura | 51 |
| Rampa del tajo<br>`rampa-tajo` | rampa, vía de acarreo, camino de acarreo | haul road, ramp | — | rampa que rompe la secuencia de bancos | ancho, pendiente | 321 |
| **subterranea** | | | | | | |
| Bocamina y portal<br>`bocamina` | bocamina, portal, socavón | portal, adit | — | entrada en ladera con suelo y roca meteorizada | cobertura | 183 |
| Galería, crucero y subnivel<br>`galeria` | galería, crucero, subnivel, by pass, labor horizontal, túnel | drift, crosscut, sublevel, tunnel, heading | galería, galeria, crucero, túnel, tunel, drift | sección baúl o herradura con contorno irregular | ancho, alto, luz | 960 |
| Rampa subterránea<br>`rampa-sub` | rampa, rampa en espiral, rampa principal | decline, ramp | — | labor inclinada en curva | pendiente, radio | 324 |
| Chimenea y pique<br>`chimenea` | chimenea, raise boring, pique, echadero, ore pass | raise, raise bore, shaft, ore pass | — | labor vertical o muy inclinada | diámetro, longitud | 374 |
| Tajeo (cámara de explotación)<br>`tajeo` | tajeo, tajo subterráneo, cámara, stope | stope, open stope | — | cavidad irregular con paredes de caja techo y caja piso | radio hidráulico, luz, dilución | 371 |
| **metodo** | | | | | | |
| Corte y relleno<br>`corte-relleno` | corte y relleno, corte y relleno ascendente, breasting | cut and fill | — | tajeo angosto que sube sobre su propio relleno | ancho, altura de corte | 441 |
| Sublevel stoping / taladros largos<br>`sublevel-stoping` | sublevel stoping, taladros largos, tajeo por subniveles, bench and fill | sublevel stoping, long hole stoping, longhole open stoping | — | tajeo alto abierto entre subniveles, abanicos de taladros | radio hidráulico, Mathews N | 372 |
| Cámaras y pilares<br>`camaras-pilares` | cámaras y pilares, room and pillar | room and pillar | — | cuadrícula de cámaras con pilares que sostienen el techo | ancho de cámara, dimensión del pilar | 73 |
| Hundimiento (block y sublevel caving)<br>`hundimiento` | block caving, sublevel caving, hundimiento por bloques, hundimiento por subniveles | block caving, panel caving, sublevel caving | — | material quebrado que baja, puntos de extracción | radio hidráulico, MRMR | 52 |
| Almacenamiento provisional (shrinkage)<br>`almacenamiento` | almacenamiento provisional, shrinkage | shrinkage stoping | — | tajeo lleno de mineral roto sobre el que se trabaja | ancho de veta | 30 |

## D9 · Sostenimiento, relleno y control (`sostenimiento`)

Lo que se pone para que el macizo se sostenga y lo que se mide para saber si lo hace.

| Valor | Términos ES | Términos EN | Leyendas de figuras | Se ve | Números | el catálogo de fuentes |
|---|---|---|---|---|---|---:|
| **sostenimiento** | | | | | | |
| Perno helicoidal o barra cementada<br>`perno-helicoidal` | perno helicoidal, barra helicoidal, perno cementado, perno con resina | rebar bolt, resin-grouted bolt, fully grouted bolt | — | cabezas con placa en patrón regular | longitud, espaciado, capacidad (t) | 14 |
| Split set<br>`split-set` | split set, perno de fricción | split set, friction bolt | — | tubo ranurado con placa | longitud, espaciado | 55 |
| Swellex<br>`swellex` | swellex, perno inflable, perno expansivo | swellex, inflatable bolt | — | perno inflado con placa | longitud, espaciado | 15 |
| Cable bolt<br>`cable` | cable bolt, cables, cable de acero | cable bolt, cablebolt | — | cables largos en abanico desde subniveles | longitud, espaciado | 74 |
| Malla<br>`malla` | malla electrosoldada, malla de alambre, malla romboidal | welded mesh, wire mesh, chain-link mesh | — | malla tensada bajo las placas, a veces cargada de roca | abertura, calibre | 47 |
| Shotcrete<br>`shotcrete` | shotcrete, concreto lanzado, hormigón proyectado, fibra | shotcrete, sprayed concrete, fibre reinforced shotcrete | — | capa gris que copia el contorno irregular, con fisuras | espesor, resistencia, fibra kg/m³ | 459 |
| Cimbra y marcos<br>`cimbra` | cimbra, cimbras metálicas, arcos de acero, marcos | steel sets, steel arches, lattice girders | — | arcos cada 1–1,5 m con encostillado | espaciado, perfil | 240 |
| Sostenimiento de madera<br>`madera` | cuadros de madera, puntales, woodpack, paquetes de madera | timber sets, timber props, cribs | — | cuadros y puntales en labores angostas | espaciado, diámetro | 67 |
| **relleno** | | | | | | |
| Relleno hidráulico<br>`relleno-hidraulico` | relleno hidráulico, relave clasificado | hydraulic fill | — | arena drenando agua en el tajeo, barreras | % de sólidos, permeabilidad | 94 |
| Relleno en pasta<br>`relleno-pasta` | relleno en pasta, pasta cementada | paste fill, cemented paste backfill | — | pasta gris sin agua libre; cara expuesta al lado del tajeo | % de cemento, resistencia | 39 |
| Relleno detrítico o cementado<br>`relleno-detritico` | relleno detrítico, relleno cementado, relleno de roca | rockfill, cemented rockfill, waste fill | — | desmonte suelto o cementado en el tajeo | % de cemento, granulometría | 72 |
| **control** | | | | | | |
| Desatado<br>`desatado` | desatado, desate de rocas, barretilla, scaler | scaling, mechanical scaling | — | trabajador o equipo retirando roca suelta de la corona | frecuencia | 54 |
| **monitoreo** | | | | | | |
| Radar de taludes y prismas<br>`radar-prismas` | radar de taludes, prismas, monitoreo de taludes, estación total | slope radar, prisms, slope monitoring, total station | — | radar frente al talud, prismas en las crestas, mapa de desplazamientos | velocidad de desplazamiento mm/día | 40 |
| Instrumentación subterránea y de taludes<br>`instrumentos` | extensómetro, inclinómetro, piezómetro, celda de presión, convergencímetro | extensometer, inclinometer, piezometer, pressure cell, convergence monitoring | — | instrumentos instalados en sondajes o en las paredes | desplazamiento, presión | 28 |

## D10 · Ambiente de trabajo (`ambiente`)

Lo que hace difícil ver y trabajar, y que casi nunca aparece en una figura técnica.

| Valor | Términos ES | Términos EN | Leyendas de figuras | Se ve | Números | el catálogo de fuentes |
|---|---|---|---|---|---|---:|
| Gran altitud<br>`altitud` | gran altitud, altura geográfica, minería de altura, hipoxia, sobre 4000 msnm | high altitude, high-altitude mining, hypoxia | — | puna sin vegetación, cielo muy claro, nieve en cumbres | msnm, presión atmosférica | 12 |
| Frío, escarcha y nieve<br>`frio` | bajas temperaturas, heladas, nieve, escarcha, friaje | cold climate, frost, snow | — | escarcha en bermas, nieve en el tajo, aliento visible | temperatura mínima, días de helada | 88 |
| Calor y humedad en profundidad<br>`calor` | calor en mina, temperatura de roca, estrés térmico, gradiente geotérmico | heat stress, virgin rock temperature, deep mine heat | — | vapor, ropa empapada, cascos con condensación | temperatura de roca virgen, temperatura de bulbo húmedo | 26 |
| Polvo<br>`polvo` | polvo, material particulado, sílice cristalina, polvo respirable | dust, particulate matter, respirable crystalline silica | — | luz difusa, contornos borrosos, todo cubierto de una capa gris | mg/m³, visibilidad | 341 |
| Gases y humos de voladura<br>`gases` | gases de voladura, humos, monóxido de carbono, nitrosos, reingreso | blast fumes, carbon monoxide, nox, re-entry | — | neblina tras la voladura, tiempo de espera para reingresar | ppm de CO, tiempo de reingreso | 106 |
| Ventilación<br>`ventilacion` | ventilación de minas, ventilador, manga de ventilación, circuito de ventilación, caudal de aire | mine ventilation, fan, ventilation duct, airflow | — | mangas colgadas, ventiladores, corriente que mueve el polvo | caudal m³/s, velocidad m/s | 202 |
| Iluminación y oscuridad<br>`iluminacion` | iluminación, lámpara minera, oscuridad, visibilidad | illumination, cap lamp, visibility, darkness | — | cono de luz de la lámpara, el resto en negro: el mapeo se hace con esa luz | lux | 125 |
| Sismo<br>`sismo` | sismo, aceleración sísmica, peligro sísmico, carga sísmica | earthquake, seismic acceleration, seismic hazard, pseudo-static | — | la misma cara con bloques sueltos tras un sismo | PGA (g), coeficiente sísmico | 562 |

## D11 · Topografía e infraestructura de superficie (`topografia`)

El relieve donde está la mina y lo que la mina le agrega. Se alimenta de DEM, nubes de puntos y modelos.

| Valor | Términos ES | Términos EN | Leyendas de figuras | Se ve | Números | el catálogo de fuentes |
|---|---|---|---|---|---|---:|
| **relieve** | | | | | | |
| Cerro y ladera<br>`ladera` | ladera, estabilidad de laderas, pendiente de ladera | hillslope, hillside | — | relieve andino con quebradas profundas | pendiente, desnivel | 167 |
| Quebrada y valle<br>`quebrada` | cauce de quebrada, valle glaciar, valle fluvial, geomorfología fluvial | ravine, glacial valley, stream channel | — | valle en V o en U glaciar | pendiente, caudal | 23 |
| Pampa y altiplano<br>`altiplano` | altiplano, puna, meseta altoandina | altiplano, high plateau, puna | — | llanura alta con lagunas | cota | 220 |
| Nevado, glaciar y laguna<br>`nevado-laguna` | nevado, glaciar, laguna glaciar, bofedal | glacier, glacial lake, wetland | — | lagunas al pie de nevados, bofedales cerca de la mina | área, cota | 245 |
| **minera** | | | | | | |
| Tajo final (pit)<br>`tajo-final` | pit final, tajo final, diseño de tajo, límite final | final pit, ultimate pit, pit shell, pit design | — | cono escalonado con rampas en espiral | profundidad, ángulo global | 52 |
| Botadero de desmonte<br>`desmonte` | desmonte, botadero, depósito de desmonte, escombrera | waste dump, waste rock dump, stockpile | — | plataformas con taludes de ángulo de reposo | ángulo de reposo, altura | 502 |
| Pila de lixiviación<br>`pad-lixiviacion` | pila de lixiviación, pad de lixiviación, lixiviación en pilas | heap leach pad, leach pad | — | pila escalonada con riego y geomembrana | altura, riego L/h/m² | 130 |
| Presa y depósito de relaves<br>`presa-relaves` | presa de relaves, depósito de relaves, relavera, dique de relaves, relaves | tailings dam, tailings storage facility, tsf | — | dique con playa de relaves y laguna de agua clara | altura, método de crecimiento, FS | 1223 |
| Accesos e instalaciones<br>`accesos` | acceso a mina, planta concentradora, campamento minero, infraestructura minera | mine access road, processing plant, mine camp, mine infrastructure | — | la mina en su contexto: planta, caminos, campamento | distancia | 957 |
| **dato** | | | | | | |
| Modelo digital de elevación<br>`dem` | modelo digital de elevación, modelo digital de terreno, curvas de nivel, topografía | digital elevation model, dem, dtm, contour lines | — | superficie de alturas | resolución m, precisión vertical | 529 |
| Nube de puntos (lidar, fotogrametría)<br>`nube-puntos` | nube de puntos, lidar, escáner láser, fotogrametría, dron, vant | point cloud, lidar, laser scanning, photogrammetry, drone, uav, structure from motion | nube de puntos, fotogrametría, fotogrametria, dron, lidar, point cloud | cara de talud o túnel escaneada con las discontinuidades visibles | densidad de puntos, error | 160 |
| Modelo geológico 3D y DFN<br>`modelo-3d` | modelo geológico 3d, modelo de bloques, red de fracturas discretas, dfn, modelamiento geológico | 3d geological model, block model, discrete fracture network, dfn, implicit modelling | — | sólidos de litología o alteración; red de fracturas estocástica | P32, intensidad de fracturas, tamaño de bloque | 171 |

## D12 · Metalurgia y geometalurgia (`metalurgia`)

Lo que la roca le hace a la planta. Une D1 y D2 con el proceso: la alteración cambia la dureza, las arcillas y la recuperación.

| Valor | Términos ES | Términos EN | Leyendas de figuras | Se ve | Números | el catálogo de fuentes |
|---|---|---|---|---|---|---:|
| **mineralogia** | | | | | | |
| Sulfuros primarios de Cu<br>`sulfuros-cu-primarios` | calcopirita, bornita, sulfuros primarios | chalcopyrite, bornite, primary sulfides | — | granos dorados o violáceos en la roca o en sección pulida | ley, tamaño de grano | 312 |
| Molibdenita<br>`molibdenita` | molibdenita, molibdeno | molybdenite | — | láminas gris plomo en venillas | ley de Mo | 238 |
| Pirita y sulfuros de hierro<br>`pirita` | pirita, pirrotita, marcasita | pyrite, pyrrhotite, marcasite | — | cubos dorados; fuente de agua ácida | % de pirita, S total | 502 |
| Galena y esfalerita<br>`galena-esfalerita` | galena, esfalerita, blenda, marmatita | galena, sphalerite | — | galena gris cúbica, esfalerita parda a negra | ley de Pb y Zn, Fe en esfalerita | 300 |
| Minerales de plata<br>`plata` | sulfosales de plata, argentita, acantita, tetraedrita, pirargirita, proustita, alabandita | silver sulfosalts, acanthite, tetrahedrite, pyrargyrite | — | minerales finos asociados a galena y manganeso | ley de Ag, asociación mineral | 59 |
| Oro libre y refractario<br>`oro` | oro libre, oro refractario, oro encapsulado, oro en pirita, arsenopirita | free gold, refractory gold, encapsulated gold, arsenopyrite | — | oro visible rara vez; casi siempre dentro de sulfuros | ley de Au, % de oro libre | 171 |
| Arcillas y filosilicatos<br>`arcillas` | arcillas, caolinita, montmorillonita, illita, esmectita, sericita | clays, kaolinite, montmorillonite, illite, smectite | — | roca blanda que forma lodo; problemas en molienda y flotación | % de arcillas, viscosidad de pulpa | 344 |
| **textura** | | | | | | |
| Textura de mena<br>`textura` | diseminado, masivo, bandeado, intercrecimiento, liberación, textura mineral | disseminated, massive, banded, intergrowth, liberation, ore texture | intercrecimiento, liberación, liberacion, textura, liberation, microscop | sección pulida con granos entrelazados | grado de liberación, P80 de liberación | 490 |
| **proceso** | | | | | | |
| Chancado y molienda<br>`conminucion` | chancado, molienda, molino sag, molino de bolas, índice de bond, conminución | crushing, grinding, sag mill, ball mill, bond work index, comminution | — | chancadoras y molinos; la alteración cambia la dureza | Bond Wi (kWh/t), A×b, P80 | 1776 |
| Flotación<br>`flotacion` | flotación, celdas de flotación, concentrado, recuperación metalúrgica | flotation, flotation cells, concentrate, metallurgical recovery | — | celdas con espuma cargada de mineral | recuperación %, ley de concentrado | 2349 |
| Lixiviación y cianuración<br>`lixiviacion` | lixiviación, cianuración, lixiviación en pilas, extracción por solventes, electroobtención, carbón en pulpa | leaching, cyanidation, heap leaching, sx-ew, carbon in pulp | — | pilas regadas, tanques agitados | extracción %, consumo de reactivo | 1499 |
| Espesamiento y relaves<br>`relaves-planta` | espesador, relave, filtrado de relaves, relave en pasta | thickener, tailings, filtered tailings, paste tailings | — | espesadores circulares, tubería de relaves | % de sólidos | 882 |
| Dominios geometalúrgicos<br>`geometalurgia` | geometalurgia, dominio geometalúrgico, unidades geometalúrgicas, variabilidad metalúrgica | geometallurgy, geometallurgical domain, ore variability | — | modelo de bloques coloreado por dureza o recuperación esperada | Wi por dominio, recuperación por dominio | 63 |
