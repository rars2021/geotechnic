"""Geotechnic · juez · realismo: compara capturas del modelo con fotos reales (mismo punto de vista).

  python -I realismo.py pares.json salida.json hoja.png

pares.json: [{"captura": "a.png", "foto": "f.jpg", "titulo": "...", "recorteCaptura": [x0, y0, x1, y1], "recorteFoto": [...]}]
(recortes en fracciones 0..1: la zona del equipo en cada imagen, para no comparar fondos)
Métricas por par (imágenes llevadas a 512 px de ancho):
  luminancia media y desviación (Rec. 709, 0..1), colorido (Hasler y Süsstrunk 2003),
  densidad de bordes (gradiente medio de la luminancia) y distancia de Bhattacharyya entre histogramas de luminancia.
Un par pasa si: |Δ luminancia| ≤ 0,22 · desviación ×0,45–2,2 · bordes ×0,4–2,5 · colorido ×0,3–3,0.
Aprobado si pasan al menos 60 % de los pares. La hoja pone cada par lado a lado con sus números (para el crítico).
"""
import json
import sys

import numpy as np
from PIL import Image, ImageDraw


def cargar(ruta, recorte=None):
    im = Image.open(ruta).convert("RGB")
    if recorte:
        x0, y0, x1, y1 = recorte
        im = im.crop((round(x0 * im.width), round(y0 * im.height), round(x1 * im.width), round(y1 * im.height)))
    w = 512
    h = max(1, round(im.height * w / im.width))
    return im.resize((w, h), Image.LANCZOS)


def metricas(im):
    a = np.asarray(im).astype(np.float64) / 255.0
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    rg = r - g
    yb = 0.5 * (r + g) - b
    colorido = float(np.sqrt(rg.std() ** 2 + yb.std() ** 2) + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2))
    gx = np.abs(np.diff(lum, axis=1)).mean()
    gy = np.abs(np.diff(lum, axis=0)).mean()
    hist, _ = np.histogram(lum, bins=32, range=(0, 1))
    hist = hist / max(1, hist.sum())
    return {"lum": float(lum.mean()), "desv": float(lum.std()), "colorido": colorido, "bordes": float(gx + gy), "hist": hist.tolist()}


def razon(a, b):
    return a / b if b > 1e-9 else float("inf")


def main():
    pares = json.load(open(sys.argv[1], encoding="utf-8"))
    filas = []
    hoja = []
    for p in pares:
        ic, ip = cargar(p["captura"], p.get("recorteCaptura")), cargar(p["foto"], p.get("recorteFoto"))
        mc, mp = metricas(ic), metricas(ip)
        bh = float(-np.log(max(1e-12, np.sum(np.sqrt(np.array(mc["hist"]) * np.array(mp["hist"]))))))
        d = {
            "titulo": p.get("titulo", ""),
            "dLum": mc["lum"] - mp["lum"],
            "rDesv": razon(mc["desv"], mp["desv"]),
            "rBordes": razon(mc["bordes"], mp["bordes"]),
            "rColorido": razon(mc["colorido"], mp["colorido"]),
            "bhatta": bh,
        }
        d["ok"] = abs(d["dLum"]) <= 0.22 and 0.45 <= d["rDesv"] <= 2.2 and 0.4 <= d["rBordes"] <= 2.5 and 0.3 <= d["rColorido"] <= 3.0
        filas.append(d)
        hoja.append((ic, ip, d))
    n_ok = sum(1 for f in filas if f["ok"])
    aprobado = len(filas) > 0 and n_ok >= 0.6 * len(filas)
    json.dump({"aprobado": aprobado, "pasan": n_ok, "pares": len(filas), "filas": filas}, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    # hoja: modelo | foto, con la línea de números debajo
    if hoja:
        alto = sum(max(a.height, b.height) + 28 for a, b, _ in hoja)
        lienzo = Image.new("RGB", (1024 + 12, alto + 8), (238, 236, 232))
        dib = ImageDraw.Draw(lienzo)
        y = 4
        for a, b, d in hoja:
            lienzo.paste(a, (4, y))
            lienzo.paste(b, (520, y))
            h = max(a.height, b.height)
            txt = f"{'OK ' if d['ok'] else 'NO '} {d['titulo'][:60]} · dLum {d['dLum']:+.2f} · desv x{d['rDesv']:.2f} · bordes x{d['rBordes']:.2f} · colorido x{d['rColorido']:.2f}"
            dib.text((6, y + h + 6), txt, fill=(30, 30, 30) if d["ok"] else (180, 30, 30))
            y += h + 28
        lienzo.save(sys.argv[3])
    print(f"realismo: {n_ok}/{len(filas)} pares dentro del rango de las fotos · {'aprobado' if aprobado else 'reprobado'}")


if __name__ == "__main__":
    main()
