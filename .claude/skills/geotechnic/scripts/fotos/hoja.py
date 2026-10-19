# Hoja de contacto de una carpeta de JPG. uso: python -I hoja.py carpeta salida.jpg [columnas]
import sys, pathlib
from PIL import Image, ImageDraw
d = pathlib.Path(sys.argv[1]); out = sys.argv[2]; cols=int(sys.argv[3]) if len(sys.argv)>3 else 4
ims = sorted(d.glob("*.jpg"))
W=360; H=270
rows=(len(ims)+cols-1)//cols
sheet=Image.new("RGB",(cols*W,rows*(H+18)),"white")
dr=ImageDraw.Draw(sheet)
for i,p in enumerate(ims):
    im=Image.open(p).convert("RGB"); im.thumbnail((W-6,H-4))
    x=(i%cols)*W; y=(i//cols)*(H+18)
    sheet.paste(im,(x+3,y+2)); dr.text((x+4,y+H+2),f"{i} {p.stem[:44]}",fill="black")
sheet.save(out, quality=80)
