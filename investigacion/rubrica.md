# Rúbrica de puntaje de Geotechnic

Cómo se puntúa una representación (un tema de `temas.json`, publicado o en prueba). Puntaje de 0 a 100.
Base de evidencia: `representacion-visual.md` (códigos T, E, P, C, A, V, N).

## 1. Criterios y pesos

| Id | Criterio | Peso | Pregunta que responde |
|---|---|---|---|
| K1 | Verdad de los números | 20 | ¿Cada medida, ángulo, capacidad o tiempo sale de una fuente y coincide con el modelo? |
| K2 | Fidelidad de forma y proporción | 20 | ¿La forma, las proporciones y la pose se parecen a las fotos y planos de referencia? |
| K3 | Rasgos reales presentes | 15 | ¿Están los rasgos que delatan lo real (cables tensos, conos de detritus, playa de relave, tacos de testigo)? |
| K4 | Legibilidad y convenciones | 15 | ¿Leyenda, orientación, escala, tipos de línea, símbolos estándar y rótulos sin solapes? |
| K5 | Limpieza para estudio | 10 | ¿Superficie calma, paleta papel, un acento, sin defectos de modelado? |
| K6 | Valor didáctico | 10 | ¿Se aprende? Contigüidad, dos caras, animación justificada, prueba de comprensión |
| K7 | Física y consistencia | 10 | ¿Nada atraviesa nada, todo dentro de su rango, el ciclo es coherente en el tiempo? |

**Puntaje** = Σ peso × (nota / 4). Nota entera de 0 a 4 por criterio (se permite 1 y 3 entre las anclas).

**Reglas de corte**
- Una nota 0 en K1, K2 o K7 bloquea la publicación aunque el total sea alto.
- Aprobado para publicar: total ≥ 70 y ningún criterio < 2.
- Referencia de calidad: total ≥ 85 y K2, K3, K6 ≥ 3.

## 2. Anclas por criterio

Cada criterio dice qué mide el juez automático (líneas de `references/juez.md`) y qué necesita un evaluador.
«Agente» = agente evaluador con las fotos y planos de referencia del tema; «usuario» = el dueño de Geotechnic.

### K1 · Verdad de los números (20)

| Nota | Ancla | Ejemplo minero |
|---|---|---|
| 0 | Números sin fuente presentados como dato, o en contradicción con su fuente | Pala CAT 7495 con radio de descarga de 30 m; caja de testigos con RQD inventado |
| 2 | Los números principales tienen clave y página; algunos «a ojo» sin marcar, o la lectura bajo el dibujo no sale del modelo | Banco de 15 m y berma con fuente, pero el interrampa escrito a mano |
| 4 | Cada número está en la tabla de fuentes con clave + página o marcado «estimado»; la lectura sale del modelo y coincide con la fuente dentro de su tolerancia | Chancado: 2600 t/h, 746 kW, 1200 → 165 mm (hdl:20.500.14076/22796 pág. 68) y camiones/h × 238 t ≤ 2600 t/h en la simulación |

- **Tolerancia por defecto** (si la fuente no da una): ± 5 % en medidas y capacidades, ± 2° en ángulos, conteos
  exactos (pases, viajes, filas). Nota 3 = todo con fuente pero 1 número fuera de tolerancia; nota 1 = la mitad o más sin
  fuente ni «estimado».
- **Juez**: línea `fidelidad` (medidas de `equipos/<e>/medidas.js` contra el modelo); sello de fuentes de `armar`.
- **Evaluador (agente)**: abre la página y la clave el catálogo de fuentes de 3 números al azar; revisa la página citada; confirma
  «estimado» donde no hay fuente; revisa que la lectura bajo el dibujo cambie con el modelo.
- **Falta en el juez**: tabla de fuentes de escena (no solo de equipos), fidelidad contra planos (malla con cotas ≤ 5 cm,
  perfil de talud Hausdorff ≤ 0,5 m e interrampa ± 2°, polos del DFN ≤ 5°; V6).

### K2 · Fidelidad de forma y proporción (20)

| Nota | Ancla | Ejemplo minero |
|---|---|---|
| 0 | La forma no se reconoce o se confunde con otro equipo o rasgo | Pala sin pórtico ni cables (parece excavadora); botadero dibujado como talud de roca facetado |
| 2 | Se reconoce, pero 1–2 proporciones clave fallan > 15 %, o no hay pose igualada para comparar | Scoop con cucharón ≈ 0,6 de la llanta y dientes largos (la foto de Cobar: ≈ 1,0 y dientes cortos) |
| 4 | Pose igualada con las fotos; silueta IoU ≥ 0,6; cada razón entre puntos clave a ≤ 10 % de la foto; perfil contra plano en tolerancia | SAG con razón 0,55 ± 0,05; perforadora con mástil 1,5–2,5 × carrier; caja de testigos con diámetro/largo 0,04–0,07 |

- **Notas intermedias**: 3 = pose igualada y la peor razón entre 10 y 15 %; 1 = se reconoce, pero ≥ 3 razones fallan
  > 15 % o la silueta IoU < 0,4.
- **Juez**: hoy `realismo` (luminancia, contraste, bordes, colorido). Solo luminancia y contraste aportan algo; bordes y
  colorido no discriminan (AUC 0,50, V1) y quedan **informativos**.
- **Juez (propuesto)**: (a) pose: 4–8 puntos clave marcados una vez en cada foto, error de reproyección / diagonal ≤ 0,05;
  (b) silueta IoU ≥ 0,6 con máscara por ids; (c) correlación HOG ≥ mediana de pares cruzados + 0,05; (d) razones de
  proporción ≤ 10 %. Una métrica entra si AUC correcto/cruzado ≥ 0,8 y Spearman ≥ 0,5 con el usuario.
- **Evaluador (agente)**: pone la captura junto a 3 fotos del tema y nombra la proporción peor; marca puntos clave si
  faltan. **Usuario**: confirma en la muestra de calibración.

### K3 · Rasgos reales presentes (15)

| Nota | Ancla | Ejemplo minero |
|---|---|---|
| 0 | Faltan los rasgos que delatan lo real; el objeto parece genérico | Relave sin playa y con agua azul fija; talud con ruido de lija en vez de facetas; carámbanos en caras que miran arriba |
| 2 | La mitad de los rasgos de la receta están; alguno contradice la foto | Perforadora con mástil pero sin conos de detritus; óxidos naranja vivo (S 0,66) en la pared |
| 4 | Todos los rasgos de la receta (`temas.json` → `que_debe_verse`) están y siguen la regla medida | Pala con pórtico, cables tensos, izaje vertical y cable de cola; frente con tubos de choque y alivios vacíos; botadero con bandas por carga y estrías |

- **Juez**: casi nada. Indirecto: `roca` (contacto), `ruedas`, `cerradas`. Medibles por modelo (propuesto): un cono por
  taladro terminado; carámbano a ≤ 10 m del portal; manga en el tercio superior; óxidos con S media 0,15–0,35 en la
  región `oxidos`; agua con H 165–200° (despejado) o S ≤ 0,08 (cubierto).
- **Evaluador (agente)**: recorre la lista `que_debe_verse` y marca presente / ausente / contradice con la foto al lado.
  Nota = 4 × presentes sin contradicción / total, redondeada.

### K4 · Legibilidad y convenciones (15)

| Nota | Ancla | Ejemplo minero |
|---|---|---|
| 0 | Colores sin leyenda; sin norte ni escala; rótulos que tapan; símbolos inventados | Zonificación 3D con polígonos encimados (tit:7bed21ee8e49749d pág. 80) |
| 2 | Leyenda y escala presentes, pero falta orientación o exageración vertical, o los tipos de línea no distinguen cierto e inferido | Sección A–A' sin rumbo ni cotas; estereograma sin n ni hemisferio |
| 4 | Leyenda completa (0 sin entrada, 0 sobrantes); norte o vista al N; escala gráfica verdadera (error ≤ 3 %); exageración declarada; certeza por tipo de línea; símbolos estándar (FGDC, malla, estereograma); 0 solapes de rótulos | Malla de frente con punto lleno, alivio vacío, retardos crecientes, eje y cotas; bloque con A–A', SW–NE, m s. n. m. |

- **Cómo se cuenta**: lista de 7 chequeos (leyenda completa, norte o vista al N, escala gráfica, exageración vertical
  declarada si la hay, certeza por tipo de línea, símbolos estándar, 0 solapes). Nota = 4 × cumplidos / aplicables,
  redondeada. Un chequeo no aplica solo si el tema no tiene ese elemento (p. ej. sin exageración en una vista de equipo).
- **Juez**: ninguna línea hoy.
- **Juez (propuesto)**: inventario de materiales contra leyenda de la ficha; flecha norte contra azimut de cámara (± 5°);
  barra de escala contra dos puntos proyectados (≤ 3 %); cajas de plaquitas sin solapes; ≤ 7 clases de color visibles;
  estereograma con `igual-area` e `inferior` y un polo de prueba; retardos crecientes por distancia al alivio.
- **Evaluador (agente)**: lee la página como un plano: ¿qué codifica cada color?, ¿dónde está el norte?, ¿a qué escala?

### K5 · Limpieza para estudio (10)

| Nota | Ancla | Ejemplo minero |
|---|---|---|
| 0 | Mallas abiertas a la vista, interior vacío de llantas, macizo como plano con bordes, amarillo vivo | Scoop v2 (S p90 0,64–0,87; ruido 0,0265–0,0477) |
| 2 | Pasa cerradas y corte, pero ruido o paleta fuera de tope en alguna captura, o decorado sin función | Jumbo con la maraña de mangueras copiada de la foto |
| 4 | Pasa las 5 líneas de limpieza; un solo acento; toda malla con función; tono distinguible entre piezas vecinas (ΔE ≥ 10 o ΔL ≥ 0,08) | Galería en papel con roca calma, tapa limpia y solo la pieza en foco en rojo |

- **Cómo se cuenta**: 5 líneas aprobadas y un solo acento = 4; 5 líneas pero dos acentos o decorado sin función = 3;
  4 líneas = 2; 3 líneas = 1; ≤ 2 = 0.
- **Juez**: líneas `cerradas`, `corte`, `paleta` (S p90 ≤ 0,45), `ruido` (\|Lap\| ≤ 0,0226), `consola`. Cubre ≈ 80 %.
- **Ajuste propuesto**: excluir de `paleta` los píxeles de codificación declarada (alteración, grupos de salida, rampas),
  que en cambio exigen leyenda (K4); medir paleta sobre la máscara de la máquina, no del recorte (N17).
- **Evaluador**: solo revisa decorado sin función y contraste entre piezas vecinas.

### K6 · Valor didáctico (10)

| Nota | Ancla | Ejemplo minero |
|---|---|---|
| 0 | No se puede estudiar: sin piezas señalables, o la roca se ve solo de una cara, o la animación es continua sin pausa | Talud visto de frente en una sola cara, sin rótulos |
| 2 | Plaquitas y lista con definiciones; modo en blanco; pero sin objeto de escala, sin dos caras, o animación sin pasos | Frente con jumbo animado y pausa, sin cuadros clave |
| 4 | Contigüidad (plaquita a ≤ 8 % del ancho de su pieza, ≥ 90 %); definiciones ≤ 20 palabras; dos caras o corte; objeto de escala; animación con pasos ≤ 20 s y vista quieta de 3–5 cuadros; una tarea generativa; agentes y usuario aciertan ≥ 80 % en rotulado y ≥ 60 % en elección forzada | Bloque plegado con plano de corte móvil y 4 secciones candidatas |

- **Cómo se cuenta**: 8 chequeos (contigüidad ≥ 90 %, definiciones ≤ 20 palabras, dos caras o corte, objeto de escala,
  animación con pasos ≤ 20 s si hay animación, vista quieta de 3–5 cuadros, tarea generativa, aciertos de agentes ≥ 60 %
  en elección forzada). Nota = 4 × cumplidos / aplicables, redondeada.
- **Juez**: ninguna línea hoy (el cuestionario de rotulado existe en la página pero no lo corre el juez).
- **Juez (propuesto)**: contigüidad por cajas; conteo de palabras; normal·(−mirada) > 0,2 en ≥ 2 caras; objeto con
  `userData.escala` ≥ 0,3 % de píxeles; SSIM ≥ 0,9 entre modo completo y en blanco fuera de rótulos.
- **Evaluador**: 2 agentes de visión responden 3–5 ítems de comprensión sin ver la ficha (elección forzada de 4 y
  estimación de buzamiento); el usuario responde los mismos en la muestra. Línea base: foto 40 %, mapa 50 %, modelo
  59 % (doi:10.5194/gc-4-233-2021 pág. 6).

### K7 · Física y consistencia (10)

| Nota | Ancla | Ejemplo minero |
|---|---|---|
| 0 | Piezas que se atraviesan, ruedas en el aire, broca fuera del taladro, o el juez no corrió | Cucharón que entra en la bóveda; dos brazos del jumbo que se cruzan |
| 2 | Física aprobada en el rango pero no en el ciclo, o el ciclo es incoherente en el tiempo | Pases de pala fraccionarios; 140 viajes de scoop mostrados en 5 min sin marcar «acelerado» |
| 4 | Física aprobada en rango y ciclo; tiempos y conteos coherentes (pases enteros 3–6, viajes = volumen / carga, retardos ordenados, rebote 2–10 % o 30–50 %) | Dispatch cuyo PTX coincide con `estadoEn(t)` en 20 instantes |

- **Notas intermedias**: 3 = física aprobada, pero un conteo o tiempo del ciclo no cuadra con `numeros_clave` sin
  marcarse «acelerado»; 1 = una interpenetración visible solo en un cuadro.
- **Juez**: `interpenetración`, `rangos`, `cierres`, `cilindros`, `mangueras`, `puertos`, `ruedas`, `roca` (rango y ciclo).
  Cubre ≈ 85 %.
- **Juez (propuesto)**: invariantes de proceso por tema (`numeros_clave` de `temas.json`).
- **Evaluador**: solo coherencia temporal visible (hoja de 3–4 cuadros).

### Resumen: automático contra evaluador

| Criterio | Juez existente | Juez propuesto | Evaluador |
|---|---|---|---|
| K1 | fidelidad (equipos) | fidelidad contra planos; tabla de fuentes de escena | agente revisa 3 claves al azar |
| K2 | realismo (solo luminancia y contraste sirven) | pose, IoU, HOG, razones | agente con fotos; usuario en calibración |
| K3 | — | conteos por modelo (conos, carámbanos, mangas, colores por región) | agente con lista `que_debe_verse` |
| K4 | — | leyenda, norte, escala, solapes, estereograma, retardos | agente lee como plano |
| K5 | cerradas, corte, paleta, ruido, consola | paleta sin codificación; máscara de máquina | decorado y contraste vecino |
| K6 | — | contigüidad, palabras, dos caras, escala, SSIM de modos | agentes y usuario responden ítems |
| K7 | física completa | invariantes de proceso | coherencia en cuadros |

## 3. Registro de cada puntaje

Una carpeta por tema y un archivo por evaluador y ronda:
`$GEOTECHNIC_DATOS\puntajes\<tema-id>\<evaluador>-<AAAA-MM-DD>.json`
(datos fuera del repo, como pide `agentes.md`). Evaluador: `usuario`, `agente-a`, `agente-b`, `juez`.

```json
{
  "tema": "pala-electrica-carguio",
  "version": "sello sha-256 del informe del juez o url+fecha del artifact",
  "evaluador": "agente-a",
  "modelo_evaluador": "claude-opus-5-5",
  "fecha": "2026-10-20",
  "ronda": "calibracion-1",
  "ciego": true,
  "capturas": ["dist/pala/juez/captura-0.png", "dist/pala/juez/captura-2.png"],
  "referencias_vistas": ["investigacion\\equipos-procesos\\abiertas\\p_h_4100xpb_shovel.jpg"],
  "notas": {
    "K1": { "nota": 3, "motivo": "radio de descarga con fuente; pases sin fuente visible" },
    "K2": { "nota": 2, "motivo": "pluma corta: razón pluma/casa 1,4 contra 1,9 en la foto", "evidencia": "captura-2.png" },
    "K3": { "nota": 2, "total_receta": 7, "presentes": ["pórtico y cables tensos", "izaje vertical", "mango a media pluma", "pases enteros"], "ausentes": ["cable de cola", "número de flota"], "contradice": ["camión de frente, no de costado"] },
    "K4": { "nota": 1, "motivo": "sin norte ni escala" },
    "K5": { "nota": 4 },
    "K6": { "nota": 3, "items_comprension": { "aciertos": 3, "total": 4 } },
    "K7": { "nota": 4 }
  },
  "total": 63.75,
  "tiempo_min": 4
}
```

- `total` se recalcula siempre desde las notas y los pesos de `pesos.json` (no se escribe a mano).
- `ciego: true` = el evaluador no vio las notas de los otros.
- El juez escribe su propio archivo con las notas que puede derivar (K5, K7 y las partes automáticas de K1–K4, K6),
  con `"evaluador": "juez"` y las métricas crudas en `metricas`.

## 4. De un puntaje bajo a una tarea

Toda nota ≤ 2 abre una tarea; nota 0 en K1, K2 o K7 la marca `bloquea: true`. La tarea va a
`$GEOTECHNIC_DATOS\puntajes\tareas.jsonl`, una línea por tarea:

```json
{"tema":"pala-electrica-carguio","criterio":"K3","nota":2,"dueño":"equipo-pala","hallazgo":"falta el cable de cola","regla":"E3","evidencia":"Bucyrus 822 (CC BY 2.0)","umbral":"nota ≥ 3","bloquea":false,"estado":"abierta"}
```

| Criterio | Causa típica | Dueño |
|---|---|---|
| K1 | Medida de equipo sin fuente o fuera de tolerancia | `equipo-<x>` |
| K1 | Número de escena (banco, retardo, t/h) sin fuente; lectura que no sale del modelo | `orquestador-escenas` |
| K2 | Forma o proporción de un equipo | `equipo-<x>` |
| K2 | Forma de roca, talud, labor, botadero, relave | `roca-terreno` |
| K2 | Par sin pose igualada, recorte con cielo o fondo, foto de otro tema | `orquestador-escenas` |
| K3 | Rasgo de equipo ausente (cables, cable de cola, carrusel, número de flota) | `equipo-<x>` |
| K3 | Rasgo de roca o terreno ausente (conos, carámbanos, playa, óxidos apagados) | `roca-terreno` |
| K4 | Leyenda, norte, escala, rótulos, vistas | `orquestador-escenas` |
| K4 | Patrones FGDC, tipos de línea, tokens de leyenda | `estudio-visual` (patrones, tokens) y `roca-terreno` (atributo de certeza) |
| K5 | Paleta, ruido, tapas, mallas abiertas | `estudio-visual` (materiales) o el dueño de la malla abierta |
| K6 | Contigüidad, pasos de animación, ítems de comprensión, objeto de escala | `orquestador-escenas` |
| K7 | Interpenetración, rango, ruedas, roca | dueño de la pieza (`equipo-<x>` o `roca-terreno`) |
| K7 | Ciclo incoherente en el tiempo | `orquestador-escenas` |
| Cualquiera | La métrica automática contradice al usuario (Spearman < 0,5) o no discrimina (AUC < 0,8) | `juez` |
| Cualquiera | Ancla ambigua (bajo acuerdo, ver §5) | `juez` (dueño de esta rúbrica) |

## 5. Recalibración

**Muestra.** ≥ 30 capturas de ≥ 10 temas, variadas: aprobadas, a medias y **plantas degradadas** a propósito (sin
leyenda, sin cable de cola, óxidos vivos, pose cruzada). Cada captura con sus referencias.

**Evaluadores.** Dos agentes independientes (`agente-a`, `agente-b`), en contextos separados, con la rúbrica y las
fotos, sin ver la ficha ni las notas del otro. Luego el usuario con la hoja rápida (§6), también a ciegas.

**Acuerdo, por criterio.**
1. Entre los dos agentes: **kappa ponderado cuadrático** (Cohen) sobre las notas 0–4.
2. Entre los tres: **ICC(2,1) de acuerdo absoluto** con IC 95 % (Koo y Li 2016).
3. Agente contra usuario: **Bland-Altman** (sesgo medio y límites de acuerdo) y **Spearman**.

**Lectura** (sobre el límite inferior del IC 95 % del ICC):

| ICC | Qué se hace |
|---|---|
| ≥ 0,75 | La nota del agente sustituye a la del usuario en ese criterio |
| 0,5–0,75 | La nota del agente orienta; el usuario revisa los casos con diferencia ≥ 2 |
| < 0,5 | Se **reescribe el ancla**: más concreta, con un ejemplo de planta a cada lado del 2; se repite la ronda en esa muestra |

**Sesgo del agente.**
- Si |sesgo medio agente − usuario| ≥ 0,5 punto y Spearman ≥ 0,6: el agente ordena bien pero es más blando o más duro.
  Se corrige el **ancla** (se agrega el caso donde más difieren como ejemplo explícito) y, mientras tanto, se resta el
  sesgo en `calibracion.json` (`"K2": { "sesgo_agente": +0,8 }`).
- Si Spearman < 0,6: el agente no ve lo mismo que el usuario. Su **peso en ese criterio pasa a 0** (decide el usuario o
  el juez automático) hasta una ronda con ancla nueva.
- Si tras dos reescrituras un criterio sigue con ICC < 0,5, su **peso en el total se reduce a la mitad** y el resto se
  reparte entre los criterios con ICC ≥ 0,75. Se anota en `pesos.json` con fecha y motivo.

**Métricas automáticas.** Cada métrica nueva del juez pasa dos controles antes de bloquear: AUC ≥ 0,8 entre par correcto
y par cruzado, y Spearman ≥ 0,5 con la nota del usuario en su criterio. Si no, queda informativa.

**Cuándo repetir.** Tras cada cambio de la skill que toque un criterio, tras cambiar el modelo de los agentes, y cada
10 temas nuevos. Cada ronda guarda `$GEOTECHNIC_DATOS\puntajes\calibracion-<n>.json` con kappa, ICC, IC, sesgo
y decisiones por criterio.

## 6. Hoja rápida para el usuario

Unos 3 minutos por tema. Abre la página (o las capturas) con las 2–3 fotos de referencia al lado. Una nota entera 0–4
por columna. Usa los anclas del 0, 2 y 4 de §2; 1 y 3 son intermedios.

| Clave rápida | 0 | 2 | 4 |
|---|---|---|---|
| K1 Números | inventados | principales con fuente | todos con fuente o «estimado» |
| K2 Forma | no se reconoce | se reconoce, 1–2 proporciones mal | igual a la foto en la misma vista |
| K3 Rasgos | genérico | la mitad | todos los de la receta |
| K4 Legible | sin leyenda ni escala | falta orientación o certeza | leyenda, norte, escala, símbolos |
| K5 Limpio | defectos a la vista | algo ruidoso o decorado | calmo, un acento |
| K6 Se aprende | no se puede estudiar | rótulos, sin dos caras o pasos | rótulos junto, pasos, prueba |
| K7 Física | algo atraviesa | ciclo raro | todo coherente |

| Tema | K1 ×20 | K2 ×20 | K3 ×15 | K4 ×15 | K5 ×10 | K6 ×10 | K7 ×10 | Total | Lo peor en una frase |
|---|---|---|---|---|---|---|---|---|---|
| talud-tajo |  |  |  |  |  |  |  |  |  |
| scoop-lhd |  |  |  |  |  |  |  |  |  |
| frente-jumbo |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |

Total = (K1×20 + K2×20 + K3×15 + K4×15 + K5×10 + K6×10 + K7×10) / 4.
El orquestador pasa cada fila a JSON (`"evaluador": "usuario"`) y abre las tareas de §4.

## Fuentes de la rúbrica

- Separar geometría, sombreado y render: doi:10.1007/s10648-021-09638-1 págs. 7-8; doi:10.1007/s10639-022-11043-2 págs. 13-15.
- Comprensión con respuesta correcta: doi:10.5194/gc-4-233-2021 pág. 6; doi:10.1186/s41235-016-0010-y págs. 4-5;
  doi:10.1007/s11251-021-09541-w págs. 8, 12; doi:10.1007/s41651-020-00071-6 págs. 5-6.
- Acuerdo entre evaluadores: doi:10.1007/s11251-022-09611-7 págs. 12-13; Koo y Li 2016 (https://pmc.ncbi.nlm.nih.gov/articles/PMC4913118/).
- Agente como juez: arXiv 2312.14867. Métricas perceptuales: arXiv 1801.03924, arXiv 2004.07728.
- Experimento de pares cruzados: `$GEOTECHNIC_DATOS\investigacion\evaluacion\scripts\`.
