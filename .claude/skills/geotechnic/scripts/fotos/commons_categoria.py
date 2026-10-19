# Lista los archivos de categorías de Wikimedia Commons con su licencia. uso: python -I commons_categoria.py "Load Haul Dump" ...
import sys, json, urllib.request, urllib.parse, re
sys.stdout.reconfigure(encoding="utf-8")
UA = {"User-Agent": "Geotechnic-skill/0.1 (study references)"}
def api(params):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({**params, "format": "json"})
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60))
import time
for cat in sys.argv[1:]:
    time.sleep(4)
    d = api({"action": "query", "generator": "categorymembers", "gcmtitle": "Category:" + cat, "gcmtype": "file|subcat", "gcmlimit": 40,
             "prop": "imageinfo", "iiprop": "url|size|extmetadata"})
    print("==", cat)
    for p in (d.get("query") or {}).get("pages", {}).values():
        if "imageinfo" not in p: print("  [cat]", p["title"]); continue
        ii = p["imageinfo"][0]; m = ii.get("extmetadata", {})
        lic = m.get("LicenseShortName", {}).get("value", "?")
        print(f"  {p['title'][5:85]:85s} {ii['width']}x{ii['height']} | {lic}")
