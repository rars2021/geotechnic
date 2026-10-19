"""Geotechnic · juez · realismo v3.1: «realismo de forma» que además debe DISCRIMINAR su foto de las equivocadas.

  python -I realismo.py pares.json salida.json hoja.png [puntajes.json]
  python -I realismo.py --plantas          casos sintéticos que deben fallar / pasar (JSON)

pares.json: [{"captura": "a.png", "foto": "f.jpg", "titulo": "...", "recorteCaptura": [x0, y0, x1, y1], "recorteFoto": [...],
              "cruzadas": [{"foto": "g.jpg", "recorte": [...], "titulo": "..."}]}]
(recortes en fracciones 0..1: la zona del equipo. `cruzadas`: las OTRAS fotos abiertas del mismo tema; si falta, se usan
las fotos de los otros pares.)

Por qué: el usuario pidió «No necesariamente tiene que ser 100 % realista… que se vea limpio, para estudio»
(references/estudio.md), y la investigación visual (investigacion/representacion-visual.md V1–V3) mostró que las
métricas globales no distinguen la foto correcta de una equivocada del mismo tema (AUC bordes 0,50, colorido 0,50,
luminancia 0,71); HOG separa algo mejor (AUC 0,68–0,73).
Métricas por par:
  luminancia media y desviación (Rec. 709, 0..1), con las imágenes a 512 px de ancho;
  discrimina: HOG (numpy: gris 256 × 160 tras el recorte, celdas de 16 px, 9 orientaciones sin signo, bloques 2 × 2
    L2-Hys) y correlación de Pearson entre los descriptores. Pasa si HOG(captura, su foto) ≥ mediana de
    HOG(captura, fotos cruzadas) + 0,05;
  informativos (no deciden): bordes estructurales (160 px, v3), bordes finos (512 px, v2), colorido (Hasler y
    Süsstrunk 2003) y Bhattacharyya de los histogramas de luminancia.
Un par pasa si: |Δ luminancia| ≤ 0,22 · desviación ×0,45–2,2 · discrimina.
Aprobado si pasan al menos 60 % de los pares. Diagnóstico del ejemplo: AUC par correcto contra par cruzado de HOG,
bordes de forma y luminancia (matriz capturas × fotos de los pares).
REGLA DE BLOQUEO (investigacion/rubrica.md §5, decisión de la sesión principal): cada métrica lleva su AUC correcto/
cruzado medido en el ejemplo y solo BLOQUEA si AUC ≥ 0,8 y Spearman ≥ 0,5 contra el puntaje del usuario (puntajes.json:
{"spearman": {"hog": 0.6, ...}}). Sin puntajes nada bloquea: la línea es INFORMATIVA (se calcula y se informa igual).
"aprobado" en salida.json = no bloquea (true si es informativa); "veredicto" = la regla completa de los pares (≥ 60 %).
"""
import json
import sys

import numpy as np
from PIL import Image, ImageDraw

ANCHO = 512             # luminancia, desviación, colorido, bordes finos
ANCHO_FORMA = 160       # bordes estructurales (informativo)
TAM_HOG = (256, 160)    # ancho × alto común para HOG
CELDA, ORIENT = 16, 9
MARGEN_HOG = 0.05       # HOG correcto ≥ mediana cruzada + 0,05
TOL_LUM = 0.22
RANGO_DESV = (0.45, 2.2)
RANGO_BORDES = (0.4, 2.5)  # informativo desde v3.1
MIN_PARES = 0.6
AUC_BLOQUEA = 0.8       # rubrica.md §5
SPEARMAN_BLOQUEA = 0.5
# métrica → la condición de cada par que la representa
SUBLINEA = {"luminancia": "okLum", "contraste": "okDesv", "hog": "discrimina", "bordes": "okBordes"}


def bloquea(auc_, spearman):
    """Una métrica bloquea solo si discrimina la foto correcta (AUC ≥ 0,8) y sigue al usuario (Spearman ≥ 0,5)."""
    return auc_ is not None and auc_ >= AUC_BLOQUEA and spearman is not None and spearman >= SPEARMAN_BLOQUEA


def abrir(fuente):
    return fuente.convert("RGB") if isinstance(fuente, Image.Image) else Image.open(fuente).convert("RGB")


def recortar(im, recorte):
    if not recorte:
        return im
    x0, y0, x1, y1 = recorte
    return im.crop((round(x0 * im.width), round(y0 * im.height), round(x1 * im.width), round(y1 * im.height)))


def cargar(fuente, recorte=None, w=ANCHO):
    im = recortar(abrir(fuente), recorte)
    h = max(2, round(im.height * w / im.width))
    return im.resize((w, h), Image.LANCZOS)


def luminancia(im):
    a = np.asarray(im).astype(np.float64) / 255.0
    return a, 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]


def gradiente(lum):
    return float(np.abs(np.diff(lum, axis=1)).mean() + np.abs(np.diff(lum, axis=0)).mean())


# ── HOG en numpy (Dalal y Triggs 2005; mismos parámetros que el experimento de la investigación con skimage)
def hog(gris):
    g = np.asarray(gris, dtype=np.float64)
    gx = np.zeros_like(g)
    gy = np.zeros_like(g)
    gx[:, 1:-1] = g[:, 2:] - g[:, :-2]
    gy[1:-1, :] = g[2:, :] - g[:-2, :]
    mag = np.hypot(gx, gy)
    ang = np.rad2deg(np.arctan2(gy, gx)) % 180.0
    b = np.minimum((ang / (180.0 / ORIENT)).astype(int), ORIENT - 1)
    cy, cx = g.shape[0] // CELDA, g.shape[1] // CELDA
    mag, b = mag[: cy * CELDA, : cx * CELDA], b[: cy * CELDA, : cx * CELDA]
    fila = (np.arange(cy * CELDA) // CELDA)[:, None] * np.ones((1, cx * CELDA), int)
    col = np.ones((cy * CELDA, 1), int) * (np.arange(cx * CELDA) // CELDA)[None, :]
    hist = np.zeros((cy, cx, ORIENT))
    np.add.at(hist, (fila.ravel(), col.ravel(), b.ravel()), mag.ravel())
    hist /= CELDA * CELDA
    bloques = []
    for i in range(cy - 1):
        for j in range(cx - 1):
            v = hist[i:i + 2, j:j + 2].ravel()
            v = v / np.sqrt((v ** 2).sum() + 1e-10)
            v = np.minimum(v, 0.2)
            bloques.append(v / np.sqrt((v ** 2).sum() + 1e-10))
    return np.concatenate(bloques)


def gris_hog(fuente, recorte=None):
    im = recortar(abrir(fuente), recorte).convert("L").resize(TAM_HOG, Image.LANCZOS)
    return np.asarray(im, dtype=np.float64) / 255.0


def correlacion(a, b):
    if a.std() < 1e-12 or b.std() < 1e-12:
        return 0.0  # una imagen sin estructura no se parece a nada
    return float(np.corrcoef(a, b)[0, 1])


def metricas(fuente, recorte):
    im = cargar(fuente, recorte)
    a, lum = luminancia(im)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    rg = r - g
    yb = 0.5 * (r + g) - b
    colorido = float(np.sqrt(rg.std() ** 2 + yb.std() ** 2) + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2))
    hist, _ = np.histogram(lum, bins=32, range=(0, 1))
    hist = hist / max(1, hist.sum())
    return {"im": im, "lum": float(lum.mean()), "desv": float(lum.std()), "colorido": colorido, "bordesFino": gradiente(lum),
            "bordes": gradiente(luminancia(cargar(fuente, recorte, ANCHO_FORMA))[1]), "hist": hist,
            "hog": hog(gris_hog(fuente, recorte))}


def razon(a, b):
    return a / b if b > 1e-9 else float("inf")


def auc(correctos, cruzados):
    """P(correcto > cruzado), empates a la mitad."""
    if not correctos or not cruzados:
        return None
    c, x = np.array(correctos)[:, None], np.array(cruzados)[None, :]
    return float(((c > x) + 0.5 * (c == x)).mean())


def juzgar(pares):
    """pares: lista de dicts con captura, foto, recortes, titulo y (opcional) cruzadas. Devuelve filas, AUC y hoja."""
    cache = {}

    def med(fuente, recorte):
        k = (fuente if isinstance(fuente, str) else id(fuente), json.dumps(recorte))
        if k not in cache:
            cache[k] = metricas(fuente, recorte)
        return cache[k]

    filas, hoja = [], []
    caps = [med(p["captura"], p.get("recorteCaptura")) for p in pares]
    fotos = [med(p["foto"], p.get("recorteFoto")) for p in pares]
    for i, p in enumerate(pares):
        mc, mp = caps[i], fotos[i]
        cruz = p.get("cruzadas")
        if cruz is None:
            cruz = [{"foto": q["foto"], "recorte": q.get("recorteFoto"), "titulo": q.get("titulo", "")} for j, q in enumerate(pares) if j != i]
        hog_ok = correlacion(mc["hog"], mp["hog"])
        hog_x = [correlacion(mc["hog"], med(c["foto"], c.get("recorte"))["hog"]) for c in cruz]
        mediana_x = float(np.median(hog_x)) if hog_x else None
        bh = float(-np.log(max(1e-12, np.sum(np.sqrt(mc["hist"] * mp["hist"])))))
        d = {
            "titulo": p.get("titulo", ""),
            "dLum": mc["lum"] - mp["lum"],
            "rDesv": razon(mc["desv"], mp["desv"]),
            "hog": hog_ok,
            "hogCruzadaMediana": mediana_x,
            "cruzadas": len(hog_x),
            "margenHog": None if mediana_x is None else hog_ok - mediana_x,
            "rBordes": razon(mc["bordes"], mp["bordes"]),             # informativo (v3)
            "rBordesFino": razon(mc["bordesFino"], mp["bordesFino"]),  # informativo (v2)
            "rColorido": razon(mc["colorido"], mp["colorido"]),       # informativo
            "bhatta": bh,
        }
        d["discrimina"] = mediana_x is not None and hog_ok >= mediana_x + MARGEN_HOG
        d["okLum"] = abs(d["dLum"]) <= TOL_LUM
        d["okDesv"] = RANGO_DESV[0] <= d["rDesv"] <= RANGO_DESV[1]
        d["okBordes"] = RANGO_BORDES[0] <= d["rBordes"] <= RANGO_BORDES[1]
        d["ok"] = d["okLum"] and d["okDesv"] and d["discrimina"]
        filas.append(d)
        hoja.append((mc["im"], mp["im"], d))
    # diagnóstico: AUC par correcto contra par cruzado (capturas × fotos de los pares)
    n = len(pares)
    pun = {
        "hog": lambda a, b: correlacion(a["hog"], b["hog"]),
        "bordes": lambda a, b: -abs(np.log(max(1e-9, a["bordes"]) / max(1e-9, b["bordes"]))),
        "luminancia": lambda a, b: -abs(a["lum"] - b["lum"]),
        "contraste": lambda a, b: -abs(np.log(max(1e-9, a["desv"]) / max(1e-9, b["desv"]))),
        "colorido": lambda a, b: -abs(np.log(max(1e-9, a["colorido"]) / max(1e-9, b["colorido"]))),
    }
    aucs = {}
    for k, f in pun.items():
        ok = [f(caps[i], fotos[i]) for i in range(n)]
        cr = [f(caps[i], fotos[j]) for i in range(n) for j in range(n) if i != j]
        aucs[k] = auc(ok, cr)
    return filas, aucs, hoja


# ── plantas: «fotos» sintéticas de un mismo tema (con grano fuerte) y capturas que deben pasar o fallar
def _escena(tipo="maquina", w=1200, h=800, textura=0.0, papel=False, semilla=3):
    rng = np.random.default_rng(semilla)
    yy, xx = np.mgrid[0:h, 0:w] / np.array([h, w]).reshape(2, 1, 1)
    cielo, piso = (np.array([0.80, 0.82, 0.84]), np.array([0.55, 0.52, 0.47])) if not papel else (np.array([0.86, 0.85, 0.82]), np.array([0.62, 0.60, 0.56]))
    a = np.where((yy < 0.45)[..., None], cielo, piso) * np.ones((h, w, 3))
    cuerpo = np.array([0.35, 0.30, 0.10]) if not papel else np.array([0.55, 0.50, 0.40])
    acero = np.array([0.15, 0.15, 0.15]) if not papel else np.array([0.30, 0.29, 0.27])
    if tipo == "maquina":  # chasis, cabina, ruedas y tres brazos inclinados hacia la derecha
        a[(xx > 0.15) & (xx < 0.5) & (yy > 0.45) & (yy < 0.75)] = cuerpo
        a[(xx > 0.18) & (xx < 0.32) & (yy > 0.3) & (yy < 0.45)] = cuerpo
        for cx in (0.22, 0.43):
            a[((xx - cx) * w) ** 2 + ((yy - 0.76) * h) ** 2 < (0.07 * h) ** 2] = acero
        for k, y0 in enumerate((0.42, 0.52, 0.62)):
            linea = y0 - 0.12 * (xx - 0.5) / 0.45 + 0.03 * k
            a[(xx > 0.5) & (xx < 0.95) & (np.abs(yy - linea) < 0.018)] = acero
            a[(xx > 0.5) & (xx < 0.95) & (np.abs(yy - linea + 0.04) < 0.006)] = cuerpo
    elif tipo == "tunel":  # boca de túnel: arco oscuro centrado con marco
        r = ((xx - 0.5) / 0.32) ** 2 + ((yy - 0.75) / 0.6) ** 2
        a[(r < 1.15)] = acero * 1.6
        a[(r < 1.0) & (yy < 0.95)] = np.array([0.08, 0.08, 0.09])
    elif tipo == "columnas":  # pórtico: columnas verticales y una viga alta
        for cx in (0.2, 0.4, 0.6, 0.8):
            a[(np.abs(xx - cx) < 0.025) & (yy > 0.2) & (yy < 0.9)] = acero
        a[(yy > 0.17) & (yy < 0.23) & (xx > 0.15) & (xx < 0.85)] = cuerpo
    if textura:
        a = a + rng.normal(0, textura, (h, w, 1))
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


def plantas():
    fotos = {k: _escena(k, textura=0.08, semilla=i + 3) for i, k in enumerate(["maquina", "tunel", "columnas"])}
    cruz = [{"foto": fotos["tunel"], "recorte": None}, {"foto": fotos["columnas"], "recorte": None}]
    # promedio que se parece IGUAL a las tres fotos: pesos ajustados hasta que su HOG contra cada foto sea el mismo
    arr = [np.asarray(f, dtype=np.float64) for f in fotos.values()]
    hogs = [hog(gris_hog(f)) for f in fotos.values()]
    w = np.ones(len(arr)) / len(arr)
    for _ in range(30):
        mezcla = np.tensordot(w, np.array(arr), axes=1)
        c = np.array([correlacion(hog(gris_hog(Image.fromarray(mezcla.astype(np.uint8)))), h) for h in hogs])
        w = np.clip(w * np.exp(2.0 * (c.mean() - c)), 1e-3, None)
        w /= w.sum()
    prom = Image.fromarray(np.tensordot(w, np.array(arr), axes=1).astype(np.uint8))
    casos = [
        # (nombre, captura, debe aprobar, informativo)
        ("par correcto: misma forma en tonos papel, sin textura", _escena("maquina", papel=True), True, False),
        ("captura gris lisa (igual a todas las fotos)", Image.new("RGB", (1200, 800), (128, 126, 122)), False, False),
        ("captura promedio de las tres fotos (igual HOG a cada una)", prom, False, False),
        ("otra escena del tema: túnel contra la foto de la máquina", _escena("tunel", papel=True), False, False),
        ("horizonte vacío (hueco conocido: falta la IoU de silueta)", _escena("vacio", papel=True), False, True),
    ]
    filas = []
    for nombre, cap, debe, info in casos:
        f, _, _ = juzgar([{"captura": cap, "foto": fotos["maquina"], "titulo": nombre, "cruzadas": cruz}])
        d = f[0]
        filas.append({"nombre": nombre, "linea": "realismo", "debeAprobar": debe, "aprueba": d["ok"], "ok": d["ok"] == debe, "info": info,
                      "detalle": f"HOG {d['hog']:.2f} contra mediana cruzada {d['hogCruzadaMediana']:.2f} (margen {d['margenHog']:+.2f}) · dLum {d['dLum']:+.2f} · desv x{d['rDesv']:.2f}"})
    for auc_, sp, debe in [(0.85, None, False), (0.85, 0.6, True), (0.64, 0.9, False), (0.80, 0.50, True), (0.95, 0.3, False)]:
        r = bloquea(auc_, sp)
        filas.append({"nombre": f"regla de bloqueo: AUC {auc_:.2f}, Spearman {'sin puntajes' if sp is None else f'{sp:.2f}'}", "linea": "realismo",
                      "debeAprobar": debe, "aprueba": r, "ok": r == debe, "info": False, "detalle": "bloquea" if r else "informativa"})
    return filas


def veredicto(filas, aucs, spearman):
    """Qué métricas bloquean en este ejemplo y si el realismo bloquea la publicación."""
    metr = {k: {"auc": aucs.get(k), "spearman": spearman.get(k), "bloquea": bloquea(aucs.get(k), spearman.get(k))} for k in aucs}
    bloq = [k for k, m in metr.items() if m["bloquea"] and k in SUBLINEA]
    n_ok = sum(1 for f in filas if f["ok"])
    ver = len(filas) > 0 and n_ok >= MIN_PARES * len(filas)
    if bloq:
        pasan = sum(1 for f in filas if all(f[SUBLINEA[k]] for k in bloq))
        aprobado = len(filas) > 0 and pasan >= MIN_PARES * len(filas)
    else:
        aprobado = True
    return {"metricas": metr, "bloqueantes": bloq, "informativo": not bloq, "aprobado": aprobado, "veredicto": ver, "pasan": n_ok}


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # con -I no vale PYTHONIOENCODING; Node lee utf-8
    if len(sys.argv) > 1 and sys.argv[1] == "--plantas":
        print(json.dumps(plantas(), ensure_ascii=False))
        return
    pares = json.load(open(sys.argv[1], encoding="utf-8"))
    spearman = {}
    if len(sys.argv) > 4:  # puntajes del usuario (rubrica.md §5): {"spearman": {"hog": 0.6, ...}}
        spearman = json.load(open(sys.argv[4], encoding="utf-8")).get("spearman", {})
    filas, aucs, hoja = juzgar(pares)
    v = veredicto(filas, aucs, spearman)
    n_ok = v["pasan"]
    json.dump({**v, "pares": len(filas), "version": "v3.1 forma + discrimina (HOG)", "puntajes": bool(spearman),
               "auc": aucs, "margenHog": MARGEN_HOG, "filas": filas},
              open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    if hoja:  # modelo | foto, con la línea de números debajo
        alto = sum(max(a.height, b.height) + 28 for a, b, _ in hoja)
        lienzo = Image.new("RGB", (1024 + 12, alto + 8), (238, 236, 232))
        dib = ImageDraw.Draw(lienzo)
        y = 4
        for a, b, d in hoja:
            lienzo.paste(a, (4, y))
            lienzo.paste(b, (520, y))
            h = max(a.height, b.height)
            med = d["hogCruzadaMediana"]
            txt = (f"{'OK ' if d['ok'] else 'NO '} {d['titulo'][:40]} · dLum {d['dLum']:+.2f} · desv x{d['rDesv']:.2f} · HOG {d['hog']:.2f}"
                   f" / cruzadas {med if med is None else round(med, 2)} · (bordes forma x{d['rBordes']:.2f} · colorido x{d['rColorido']:.2f})")
            dib.text((6, y + h + 6), txt, fill=(30, 30, 30) if d["ok"] else (180, 30, 30))
            y += h + 28
        lienzo.save(sys.argv[3])
    fa = lambda v: "—" if v is None else f"{v:.2f}"
    estado = ("INFORMATIVO (no bloquea): ninguna métrica cumple AUC ≥ 0,8 y Spearman ≥ 0,5"
              + ("" if spearman else "; no hay puntajes del usuario") if v["informativo"]
              else f"BLOQUEA con {', '.join(v['bloqueantes'])}: {'aprobado' if v['aprobado'] else 'reprobado'}")
    print(f"realismo (v3.1): {estado} · veredicto de la regla completa {n_ok}/{len(filas)} pares"
          f" ({'pasaría' if v['veredicto'] else 'no pasaría'})\n"
          f"AUC correcto/cruzado del ejemplo: " + " · ".join(f"{k} {fa(m['auc'])}{' (bloquea)' if m['bloquea'] else ''}" for k, m in v["metricas"].items()))


if __name__ == "__main__":
    main()
