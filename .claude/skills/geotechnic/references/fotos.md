# Reunir fotos y figuras con el catálogo de fuentes

Datos en `<DATOS>/geotechnic\figuras\<tema>\` (fuera del repo). Scripts en `scripts/fotos/`. Corre Python con `-I`.

## 1. Figuras de tesis y papers (solo estudio)

| Paso | Comando |
|---|---|
| Buscar leyendas por tema en los ≈ 580 textos con páginas | `python -I scripts/fotos/leyendas.py leyendas.json` (edita `TEMAS` con las palabras ES/EN; `vocabulario/taxonomia.json` ayuda) |
| Recortar las figuras raster de esas leyendas | `python -I scripts/fotos/capturar.py leyendas.json <tema> "<regex de leyenda>" <por_pdf> <total>` |
| Hoja de contacto para mirarlas | `python -I scripts/fotos/hoja.py <DATOS>/geotechnic/figuras/<tema> hoja.jpg 5` |

`capturar.py` usa `tesis_dl/figuras.py` de el catálogo de fuentes (leyenda → recorte) y escribe `fuentes.json` con clave, título,
página y leyenda. Si el PDF no está descargado: `python catalogo.py bajar --clave <clave>`.

## 2. Fotos con licencia abierta (se pueden incrustar)

| Paso | Comando |
|---|---|
| Ver qué hay en una categoría de Commons | `python -I scripts/fotos/commons_categoria.py "Load Haul Dump" "Drilling jumbos"` |
| Bajar con licencia, autor y URL | `python -I scripts/fotos/commons_bajar.py <tema> "Archivo 1.jpg" "Archivo 2.jpg"` |
| Registrarlas en el catálogo de fuentes (clave `web:…`) | `python -I scripts/fotos/registrar_ttdata.py` |

Solo se aceptan CC BY, CC BY-SA, CC0 o dominio público. El pie de la foto en la página lleva autor, licencia con enlace,
página de origen y clave el catálogo de fuentes. Commons limita la frecuencia: los scripts esperan entre pedidos.

Papers CC BY (MDPI, Copernicus, Frontiers): se siembran con `catalogo.py sembrar doi:<doi> --ya`; MDPI bloquea la
descarga automática, así que sus figuras solo sirven si el usuario baja el PDF a mano a `entrada\`.

## 3. Datasets de imágenes

`python catalogo.py buscar "<tema>" --tag tipo:dataset` y `python catalogo.py obtener <clave>` (por ejemplo
`hf:168sir/drill-core-image-dataset` para testigos). Revisa la licencia del dataset antes de incrustar.

## Lo que hay hoy (2026-10-18)

| Tema | Estudio (tesis) | Abiertas |
|---|---|---|
| talud | 72 | 10 (Antamina, Tintaya, Cerro de Pasco, Riotinto) |
| scoop | 10 | 7 (Sandvik LH410/LH514/LH517, Cobar, VKG) |
| jumbo | 23 | 5 (Boomer E2C, NATM, frentes) |
| dispatch | 25 | 9 (Chuquicamata, 797, Kennecott, Chino) |
