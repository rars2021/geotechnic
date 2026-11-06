"""Baja archivos de Wikimedia Commons (miniatura de 1600 px) con su licencia, autor y URL.
uso: python commons_bajar.py <tema> "File A.jpg" "File B.jpg" ..."""
import os, sys, json, urllib.request, urllib.parse, re, time, pathlib
sys.stdout.reconfigure(encoding="utf-8")
UA = {"User-Agent": "Geotechnic-skill/0.1 (study references; el catálogo de fuentes)"}
tema, nombres = sys.argv[1], sys.argv[2:]
out = pathlib.Path(os.environ.get("GEOTECHNIC_DATOS", "datos") + "/figuras") / tema / "abiertas"; out.mkdir(parents=True, exist_ok=True)
fp = out / "fuentes.json"; fuentes = json.load(open(fp, encoding="utf-8")) if fp.exists() else []
hechos = {f["archivo"] for f in fuentes}
def limpio(h): return re.sub(r"\s+", " ", re.sub("<[^>]+>", "", h or "")).strip()
for n in nombres:
    if n in hechos: continue
    time.sleep(3)
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({"action": "query", "titles": "File:" + n, "prop": "imageinfo",
          "iiprop": "url|size|extmetadata", "iiurlwidth": 1600, "format": "json"})
    for intento in range(4):
        try:
            d = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60)); break
        except Exception as e:
            print("reintento", e); time.sleep(15)
    p = next(iter(d["query"]["pages"].values()))
    if "imageinfo" not in p: print("no existe", n); continue
    ii = p["imageinfo"][0]; m = ii["extmetadata"]
    lic = m.get("LicenseShortName", {}).get("value", "?")
    if not re.search(r"CC BY|CC0|Public domain|KOGL", lic, re.I): print("licencia no abierta", n, lic); continue
    slug = re.sub(r"[^a-z0-9]+", "_", n.lower().rsplit(".", 1)[0]).strip("_")[:60] + ".jpg"
    time.sleep(2)
    data = urllib.request.urlopen(urllib.request.Request(ii.get("thumburl") or ii["url"], headers=UA), timeout=120).read()
    (out / slug).write_bytes(data)
    fuentes.append({"img": slug, "archivo": n, "licencia": lic, "licencia_url": m.get("LicenseUrl", {}).get("value", ""),
                    "autor": limpio(m.get("Artist", {}).get("value")), "fecha": limpio(m.get("DateTimeOriginal", {}).get("value"))[:30],
                    "descripcion": limpio(m.get("ImageDescription", {}).get("value"))[:300], "pagina": ii["descriptionurl"],
                    "ancho": ii["width"], "alto": ii["height"]})
    json.dump(fuentes, open(fp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("ok", slug, lic, fuentes[-1]["autor"][:40])
json.dump(fuentes, open(fp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
