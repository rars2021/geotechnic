"""Geotechnic · juez · limpieza (imagen): paleta y ruido de las capturas del modelo.

  python -I limpieza.py capturas.json salida.json     juzga las capturas
  python -I limpieza.py --plantas                     corre las plantas (imágenes sintéticas que deben fallar / pasar)
  python -I limpieza.py --medir a.png b.png ...       solo imprime los números (para calibrar)
  python -I limpieza.py --vacias a.png b.png ...      JSON: ¿cada captura está vacía? (para repetirla)

capturas.json: [{"captura": "captura-1.png", "titulo": "...", "recorte": [x0, y0, x1, y1] | null}]
(recorte en fracciones 0..1: la zona del equipo; la paleta se mide ahí, el ruido en la captura entera)

paleta  saturación HSV p90 de los píxeles con V > 0,15 dentro del recorte. Tope 0,45 (references/estudio.md).
        Fracción de píxeles «acento» (S > 0,6): solo informativa.
ruido   media de |Laplaciano| (4 vecinos) de la captura entera en gris (Rec. 709), reducida a 640 px de ancho.
        Tope = 0,7 × mediana de las capturas v2 (v3 pide al menos 30 % menos ruido que v2); ver references/juez.md.
vacía   una captura sin dibujo (fallo pasajero del navegador sin pantalla: lienzo color fondo) da paleta y ruido
        «limpios»; se mide en el interior (sin el 2 % de cada borde, que trae el redondeo del lienzo): desviación de
        luminancia < 0,01 o > 98 % de los píxeles de un solo color. Una captura vacía FALLA paleta y ruido.
Aprueba cada sublínea si TODAS las capturas quedan dentro de su tope.
"""
import json
import sys

import numpy as np
from PIL import Image, ImageDraw

TOPE_SATURACION = 0.45  # references/estudio.md: «Saturación HSV de un equipo en pantalla: p90 ≤ 0,45»
V_MIN = 0.15            # píxeles más oscuros no tienen color legible (sombra): no cuentan
S_ACENTO = 0.6          # un píxel «acento» (solo informativo)
# Calibración (references/juez.md, «Limpieza»): |Laplaciano| medio de las 10 capturas v2 (scoop-lhd y frente-jumbo,
# 19-10-2026): 0,0265–0,0477, mediana 0,03228; tope = 0,7 × 0,03228 = 0,0226 (las 10 v2 fallan).
RUIDO_V2_MEDIANA = 0.03228
TOPE_RUIDO = round(0.7 * RUIDO_V2_MEDIANA, 4)
ANCHO_RUIDO = 640


def abrir(fuente):
    return fuente.convert("RGB") if isinstance(fuente, Image.Image) else Image.open(fuente).convert("RGB")


def recortar(im, recorte):
    if not recorte:
        return im
    x0, y0, x1, y1 = recorte
    return im.crop((round(x0 * im.width), round(y0 * im.height), round(x1 * im.width), round(y1 * im.height)))


def paleta(im, recorte=None):
    a = np.asarray(recortar(im, recorte)).astype(np.float64) / 255.0
    mx, mn = a.max(axis=2), a.min(axis=2)
    s = np.where(mx > 1e-9, (mx - mn) / np.maximum(mx, 1e-9), 0.0)
    m = mx > V_MIN
    if not m.any():
        return {"sP90": 0.0, "acento": 0.0, "pixeles": 0}
    sv = s[m]
    return {"sP90": float(np.percentile(sv, 90)), "acento": float((sv > S_ACENTO).mean()), "pixeles": int(m.sum())}


def ruido(im):
    h = max(3, round(im.height * ANCHO_RUIDO / im.width))
    a = np.asarray(im.resize((ANCHO_RUIDO, h), Image.LANCZOS)).astype(np.float64) / 255.0
    g = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    lap = 4 * g[1:-1, 1:-1] - g[:-2, 1:-1] - g[2:, 1:-1] - g[1:-1, :-2] - g[1:-1, 2:]
    return float(np.abs(lap).mean())


VACIA_DESV = 0.01       # desviación de luminancia del interior
VACIA_UN_COLOR = 0.98   # fracción de píxeles del interior con el mismo color exacto


def vacia(im):
    """¿La captura está vacía? Interior sin el 2 % de cada borde."""
    w, h = im.size
    a = np.asarray(im.crop((round(0.02 * w), round(0.02 * h), round(0.98 * w), round(0.98 * h)))).astype(np.int64)
    lum = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]) / 255.0
    k = (a[..., 0] << 16) | (a[..., 1] << 8) | a[..., 2]
    _, n = np.unique(k, return_counts=True)
    desv, dom = float(lum.std()), float(n.max() / k.size)
    return {"vacia": desv < VACIA_DESV or dom > VACIA_UN_COLOR, "desvInterior": desv, "unColor": dom}


def medir(fuente, recorte=None):
    im = abrir(fuente)
    p = paleta(im, recorte)
    return {**p, "ruido": ruido(im), **vacia(im)}


def juzgar(capturas):
    filas = []
    for c in capturas:
        m = medir(c["captura"], c.get("recorte"))
        filas.append({"titulo": c.get("titulo", ""), "captura": c["captura"], **m,
                      "okPaleta": not m["vacia"] and m["sP90"] <= TOPE_SATURACION, "okRuido": not m["vacia"] and m["ruido"] <= TOPE_RUIDO})
    return {
        "topes": {"saturacion": TOPE_SATURACION, "ruido": TOPE_RUIDO, "ruidoV2": RUIDO_V2_MEDIANA},
        "paleta": {"aprobado": len(filas) > 0 and all(f["okPaleta"] for f in filas)},
        "ruido": {"aprobado": len(filas) > 0 and all(f["okRuido"] for f in filas)},
        "vacias": [f["titulo"] for f in filas if f["vacia"]],
        "filas": filas,
    }


# ── plantas: imágenes sintéticas con lo que la línea debe atrapar (y lo que debe dejar pasar)
def _lienzo(fondo, cuerpo, ruido_amp=0.0, semilla=1):
    """Fondo gris de labor con un «equipo» (rectángulo con un sombreado suave) y ruido opcional de textura."""
    w, h = 1300, 1000
    rng = np.random.default_rng(semilla)
    yy, xx = np.mgrid[0:h, 0:w] / np.array([h, w]).reshape(2, 1, 1)
    base = np.ones((h, w, 3)) * (np.array(fondo) / 255.0) * (0.85 + 0.15 * yy[..., None])
    eq = (xx > 0.25) & (xx < 0.75) & (yy > 0.3) & (yy < 0.75)
    base[eq] = (np.array(cuerpo) / 255.0) * (0.8 + 0.2 * xx[eq][:, None])
    if ruido_amp:
        base += rng.normal(0, ruido_amp, (h, w, 1))
    return Image.fromarray((np.clip(base, 0, 1) * 255).astype(np.uint8))


def _borde(im):
    """Como la captura vacía real del scoop: lienzo liso con su borde y esquinas redondeadas de otro color."""
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, im.width - 1, im.height - 1), outline=(200, 196, 188), width=6)
    return im


def plantas():
    gris, recorte = (111, 106, 98), [0.2, 0.25, 0.8, 0.8]
    casos = [
        # (nombre, imagen, sublínea, debe aprobar)
        ("amarillo v2 #d9a521 (paleta)", _lienzo(gris, (0xD9, 0xA5, 0x21)), "paleta", False),
        ("rojo perforadora v2 #c8452f (paleta)", _lienzo(gris, (0xC8, 0x45, 0x2F)), "paleta", False),
        ("pintura papel #c4ad7c (paleta)", _lienzo(gris, (0xC4, 0xAD, 0x7C)), "paleta", True),
        ("grano como la roca v2, sigma 0,02 (ruido)", _lienzo(gris, (0xC4, 0xAD, 0x7C), ruido_amp=0.02), "ruido", False),
        ("tonos lisos (ruido)", _lienzo(gris, (0xC4, 0xAD, 0x7C)), "ruido", True),
        ("captura vacía: lienzo liso color fondo (paleta)", Image.new("RGB", (1300, 1000), (231, 228, 221)), "paleta", False),
        ("captura vacía: lienzo liso color fondo (ruido)", Image.new("RGB", (1300, 1000), (231, 228, 221)), "ruido", False),
        ("captura vacía: fondo liso con un borde redondeado (ruido)", _borde(Image.new("RGB", (1300, 1000), (231, 228, 221))), "ruido", False),
    ]
    filas = []
    for nombre, im, linea, debe in casos:
        m = medir(im, recorte)
        aprueba = not m["vacia"] and (m["sP90"] <= TOPE_SATURACION if linea == "paleta" else m["ruido"] <= TOPE_RUIDO)
        filas.append({"nombre": nombre, "linea": linea, "debeAprobar": debe, "aprueba": aprueba, "ok": aprueba == debe,
                      "sP90": m["sP90"], "ruido": m["ruido"], "vacia": m["vacia"]})
    return filas


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # con -I no vale PYTHONIOENCODING; Node lee utf-8
    if len(sys.argv) > 1 and sys.argv[1] == "--plantas":
        print(json.dumps(plantas(), ensure_ascii=False))
        return
    if len(sys.argv) > 1 and sys.argv[1] == "--medir":
        for r in sys.argv[2:]:
            m = medir(r)
            print(f"{r}\tsP90 {m['sP90']:.3f}\tacento {m['acento'] * 100:.1f} %\truido {m['ruido']:.5f}")
        return
    if len(sys.argv) > 1 and sys.argv[1] == "--vacias":
        print(json.dumps([{"captura": r, **vacia(abrir(r))} for r in sys.argv[2:]], ensure_ascii=False))
        return
    capturas = json.load(open(sys.argv[1], encoding="utf-8"))
    r = juzgar(capturas)
    json.dump(r, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"limpieza (imagen): paleta {'aprobada' if r['paleta']['aprobado'] else 'reprobada'} · ruido {'aprobado' if r['ruido']['aprobado'] else 'reprobado'} · {len(r['filas'])} capturas")


if __name__ == "__main__":
    main()
