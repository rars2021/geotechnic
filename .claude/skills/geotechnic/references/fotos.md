# Reunir fotos y figuras

Datos en `$GEOTECHNIC_DATOS/figuras/<tema>/` (fuera del repo; por defecto `./datos`). Scripts en `scripts/fotos/`. Corre Python con `-I`.

## 1. Figuras de tesis y papers (solo estudio)

Búscalas en tu propio catálogo de tesis y papers. Cada figura que guardes en `figuras/<tema>/` va con una entrada en
su `fuentes.json`: clave (DOI, handle o URL), título, página y leyenda. No se incrustan en la página: se citan.

| Paso | Comando |
|---|---|
| Hoja de contacto para mirarlas | `python -I scripts/fotos/hoja.py $GEOTECHNIC_DATOS/figuras/<tema> hoja.jpg 5` |

## 2. Fotos con licencia abierta (se pueden incrustar)

| Paso | Comando |
|---|---|
| Ver qué hay en una categoría de Commons | `python -I scripts/fotos/commons_categoria.py "Load Haul Dump" "Drilling jumbos"` |
| Bajar con licencia, autor y URL | `python -I scripts/fotos/commons_bajar.py <tema> "Archivo 1.jpg" "Archivo 2.jpg"` |

Solo se aceptan CC BY, CC BY-SA, CC0 o dominio público. El pie de la foto en la página lleva autor, licencia con enlace,
página de origen y clave de la fuente. Commons limita la frecuencia: los scripts esperan entre pedidos.

Papers CC BY (MDPI, Copernicus, Frontiers) también sirven; MDPI bloquea la descarga automática, así que el PDF se baja a mano.

## 3. Datasets de imágenes

Por ejemplo `hf:168sir/drill-core-image-dataset` para testigos. Revisa la licencia del dataset antes de incrustar.

## Lo que usaron los ejemplos (2026-10-18)

| Tema | Estudio (tesis) | Abiertas |
|---|---|---|
| talud | 72 | 10 (Antamina, Tintaya, Cerro de Pasco, Riotinto) |
| scoop | 10 | 7 (Sandvik LH410/LH514/LH517, Cobar, VKG) |
| jumbo | 23 | 5 (Boomer E2C, NATM, frentes) |
| dispatch | 25 | 9 (Chuquicamata, 797, Kennecott, Chino) |

Las fotos no vienen en el repo: los ejemplos las buscan en `$GEOTECHNIC_DATOS` y, si faltan, el armado avisa.
