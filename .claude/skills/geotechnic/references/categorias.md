# Categorías del pedido y reglas (plan de recategorización)

Antes de dibujar, Geotechnic **clasifica el pedido** en seis ejes. Cada valor trae sus reglas: qué motor, qué corte,
qué cámara, qué fuentes y qué líneas del juez. La taxonomía v0.1 (`vocabulario/taxonomia.json`) describe lo que se
*ve* (condiciones del terreno); estas categorías describen lo que se *pide*. Se usan juntas.

Un pedido puede tener varios dominios (p. ej. dispatch = minero operativo + técnico de equipos + comercial). Si un eje
no está claro, se toma la opción común y se dice en la respuesta.

## Eje 1 · Ambiente: ¿dónde está la cámara?

| Valor | Ejemplos | Regla de dibujo | Juez de limpieza |
|---|---|---|---|
| **Cerrado** | galería, tajeo, chimenea, túnel, cámara de chancado subterránea | Bloque de roca cerrado (`macizoCerrado`); corte de cámara (`corteCamara`) o plano fijo lateral con tapa y contorno | `corte`: toda roca entre cámara y objetivo se corta |
| **Abierto** | tajo, cantera, afloramiento, botadero, presa de relaves, región | **Sin corte.** La cámara choca con el terreno, como en Anatomy: nunca entra al suelo ni al talud (`colisionCamara` con `terreno.libre`). Fondo cielo o papel; luz de sol | `colision`: ninguna cámara de muestra queda dentro del terreno; sin línea `corte` |
| **Bloque** | yacimiento en el subsuelo, modelo geológico, sección | El corte **es** la sección geológica: plano fijo con lámina FGDC por unidad (`corteOp.lamina`), no corte de cámara. La cámara orbita fuera del bloque | `cerradas` + unidades con `fgdc` y fuente |
| **Mixto** | bocamina, portal, tajo con labor que sale al talud | Colisión afuera; corte solo cuando la cámara entra al tramo cerrado | `colision` afuera y `corte` adentro |
| **Aislado** | equipo en taller, muestra de mano, testigo, probeta | Banco de estudio: fondo papel, sombra suave, sin terreno; giro libre y vista explotada (Anatomy) | `cerradas`; sin `corte` ni `colision` |
| **Sin espacio** | cuadro de clasificación, gráfico, mapa 2D | Sin 3D: tarjetas, tablas, diagramas (skill `artifact-diagramming`) o gráficos (skill `dataviz`) | `paleta` y consola; sin física |

## Eje 2 · Dominio (raíz temática)

| Raíz | Incluye | Forma por defecto | Reglas propias | Dueño (agente) |
|---|---|---|---|---|
| **Geológico** | yacimientos (tipos, génesis, zonación), litología, alteración, mineralogía, muestras de mano, estructuras, estratigrafía, control geológico | bloque diagrama + muestra con foto real + cuadro 2D | Litología con código FGDC y fuente; zonas con borde gradual; mineral identificado con sus rasgos (color, brillo, hábito, dureza) | roca-terreno |
| **Geotécnico** | macizo, RMR/Q/GSI, taludes, sostenimiento, ensayos | 3D motor B | Cada parámetro con tabla de la tesis; factor de seguridad con método | roca-terreno |
| **Hidrogeológico** | nivel freático, drenaje, bombeo, infiltración | 3D motor B + flechas de flujo | Cotas y caudales con fuente; el agua oscurece y brilla (`humedad`) | roca-terreno |
| **Geoestadístico** | variograma, kriging, modelo de bloques, leyes, recursos y reservas, curva tonelaje-ley | gráfico de datos + bloque de celdas | Mostrar método y parámetros (pepita, meseta, alcance); no inventar datos: muestra sintética se rotula «ilustrativo» | orquestador (con `dataviz`) |
| **Geoespacial** | topografía, DEM, SIG, teledetección, catastro y concesiones, coordenadas | mapa (2D o relieve 3D abierto) | Sistema de coordenadas y fecha del dato; escala gráfica y norte | orquestador |
| **Minero operativo** | métodos de minado, perforación y voladura, carguío y acarreo, dispatch, ventilación, relleno, planeamiento | simulación 3D + panel | Tiempos y distribuciones de tesis; el mapa dice si no está a escala | orquestador |
| **Técnico de equipos** | máquinas, mecanismos, especificaciones, mantenimiento | 3D motor A (aislado o en su labor) | Ficha del fabricante o tesis por cada medida; física del rango completo | equipo-* |
| **Procesamiento y metalurgia** | chancado, molienda, flotación, lixiviación, relaves, geometalurgia | diagrama de flujo + 3D de equipos de planta | Balance de masa que cierra; leyes y recuperaciones con fuente | orquestador |
| **Minero comercial** | precios de metales, costos, VAN/TIR, contratos, comercialización de concentrados, cadena de valor | gráfico de datos + tablas | Todo precio con **fecha** y fuente; supuestos visibles; no es asesoría de inversión | orquestador (con `dataviz`) |
| **Ambiental y social** | impactos, cierre de minas, agua, relaves, comunidades, EIA | 3D abierto + mapa | Datos de monitoreo con fecha y entidad; lenguaje neutro | roca-terreno + orquestador |
| **Seguridad y salud** | peligros, IPERC, EPP, accidentes, ventilación y gases | 3D de la labor + señalización | Normativa citada (p. ej. DS 024-2016-EM); accidentes reales sin nombres de personas | orquestador |
| **Legal y formalización** | concesiones, derechos, REINFO, normativa | cuadro 2D + flujo del trámite | Norma con número y fecha; se dice que no es asesoría legal | orquestador |
| **Minería artesanal y pequeña minería (MAPE)** | métodos artesanales formales, formalización, seguridad, alternativas sin mercurio | 3D aislado o abierto + flujo | Se enseña la operación **formal y segura**; mercurio solo como riesgo y sus alternativas (gravimetría, retortas); vía de formalización | orquestador |
| **Minería ilegal** | — | cuadro 2D, mapa de impactos | **Desalentar** (ver eje 6): impactos, riesgos, consecuencias legales, cómo denunciar y cómo formalizarse | sesión principal |

Se pueden crear raíces nuevas cuando un pedido no cabe (p. ej. «Exploración y sondajes», «Energía y agua en mina»):
se agregan aquí con sus reglas antes de dibujar.

## Eje 3 · Propósito

| Valor | Regla |
|---|---|
| **Estudiar o examen** | Piezas señalables, modo en blanco con quiz, preguntas de práctica con respuesta y pista; una relación por pieza (contrato SSTutor, `references/sstutor.md`) |
| **Explicar o divulgar** | Recorrido guiado con pocas piezas (5–8); textos cortos; sin jerga sin definir |
| **Calcular o diseñar** | Controles con la fórmula visible y la fuente de cada constante; resultado con unidades |
| **Simular** | Línea de tiempo, velocidad, pausa; la simulación usa distribuciones con fuente |
| **Comparar o evaluar** | Dos o más casos lado a lado con los mismos ejes y escalas |
| **Presentar** | Vistas fijas encuadradas; tipo Slides si se pide un deck |

## Eje 4 · Escala

Las de la taxonomía v0.1 (región, cerro, mina, banco-labor, frente, testigo, probeta) más **equipo** y **muestra de
mano**. La escala fija la cámara y el detalle (`references/temas.md`, «Escalas»): a escala de mina los equipos son
puntos; a escala de equipo se ven pasadores y mangueras.

## Eje 5 · Forma

| Forma | Cuándo | Herramienta |
|---|---|---|
| 3D motor B | terreno, roca, labor | `kit/` (macizo, labor, terreno, contrato) |
| 3D motor A | equipo con mecanismo | `motorA/` + `equipos/<e>/` |
| Bloque diagrama | geología del subsuelo | `macizoCerrado`/bloque + plano fijo + lámina FGDC |
| Diagrama o cuadro 2D | clasificaciones, flujos, comparaciones | skill `artifact-diagramming` |
| Gráfico de datos | geoestadística, comercial, series | skill `dataviz` |
| Mapa | geoespacial | relieve abierto o 2D con coordenadas |
| Muestra con foto real | mineralogía, testigos | foto abierta con fuente + 3D aislado opcional |
| Simulación | procesos en el tiempo | `kit/procesos.js` + panel |

No todo es 3D: un cuadro de «tipos de yacimiento» se lee mejor como tarjetas 2D que como un bloque.

## Eje 6 · Riesgo

| Valor | Regla |
|---|---|
| **Normal** | Las reglas de siempre |
| **Sensible** | Accidentes reales, comunidades, datos de empresas: fuente pública, sin nombres de personas, lenguaje neutro |
| **Restringido: minería ilegal** | Nunca: cómo extraer o procesar sin autorización, amalgamación con mercurio o cianuración como procedimiento, cómo evadir controles, fiscalización o interdicción, cómo vender oro ilegal, cómo ubicar o invadir concesiones ajenas. Sí: impactos (deforestación, mercurio, agua, trata, violencia), riesgos para la persona, consecuencias legales, cómo denunciar y la vía de formalización (MAPE). El tono desalienta de forma explícita y ofrece la alternativa formal |

## Cómo se clasifica (paso 0 del flujo)

1. Lee el pedido y llena los seis ejes; si falta uno, la opción común y se dice.
2. Si el riesgo es «restringido», aplica su regla antes que todo lo demás.
3. Con ambiente + forma eliges motor, corte o colisión y cámara; con dominio, las reglas y el agente dueño; con
   propósito, la interacción; con escala, el detalle.
4. Anota la clasificación en la ficha (`ficha.categorias = { ambiente, dominios, proposito, escala, forma, riesgo }`):
   el juez la lee para elegir sus líneas.

## Ejemplos actuales recategorizados

| Ejemplo | Ambiente | Dominios | Propósito | Escala | Forma | Cambio que pide |
|---|---|---|---|---|---|---|
| `talud-tajo` | abierto | geotécnico, geológico | estudiar | banco | 3D motor B | Pasar a estudio v3 con colisión; hoy está en v1 |
| `scoop-lhd` | cerrado | técnico de equipos, minero operativo | estudiar | labor | 3D motor A + B | Ninguno (ya usa corte) |
| `frente-jumbo` | cerrado | minero operativo, técnico de equipos | estudiar, simular | frente | 3D motor A + B | Ninguno |
| `dispatch` | abierto | minero operativo, técnico de equipos, comercial | simular | mina | simulación 3D + panel | **Quitar el corte**; colisión de cámara con el tajo |
| Yacimientos (examen, en curso) | bloque + aislado + sin espacio | geológico | estudiar | yacimiento, muestra | bloque diagrama, muestra con foto, cuadros 2D | Nuevo |

## Plan de recategorización

| Fase | Qué | Dueño | Listo cuando |
|---|---|---|---|
| 1 ✅ | Este documento y el paso 0 en `SKILL.md`; `ficha.categorias` en las fichas existentes | sesión principal | Las 4 fichas declaran sus categorías |
| 2 ✅ | `colisionCamara(esc, terreno)`: la cámara no entra al terreno (empuja la cámara a `libre ≥ margen` a lo largo de la mirada, sin saltos); `crearEscena(…, { ambiente })` elige corte o colisión | estudio-visual | Probado en Node con el terreno del tajo |
| 3 ✅ | Juez: línea `colision` para abiertos (cámaras de órbita y de la ficha) y `corte` solo para cerrados y mixtos, según `ficha.categorias.ambiente`; plantas de las dos | juez | `--plantas` en verde |
| 4 ✅ | `dispatch` sin corte y con colisión; `talud-tajo` a estudio v3 con colisión | orquestador-escenas | Juez aprobado y republicados |
| 5 | Modo «bloque» para geología: bloque diagrama con unidades FGDC y plano fijo como sección | estudio-visual + roca-terreno | Un ejemplo geológico aprobado (sirve al examen de Yacimientos) |
| 6 | Formas sin 3D (cuadro, gráfico, mapa) dentro de la misma página de estudio, con modos completo y en blanco | orquestador-escenas | Un cuadro de tipos de yacimiento con quiz |
| 7 | Reglas de riesgo en `SKILL.md` (restringido: minería ilegal) y búsqueda el catálogo de fuentes por raíz (palabras clave por dominio) | sesión principal | Documentado; un pedido de prueba sobre minería ilegal se desalienta y ofrece la vía formal |
