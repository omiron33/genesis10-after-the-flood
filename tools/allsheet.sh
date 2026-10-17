#!/bin/zsh
# One still per scene (at the given fraction of each scene, default 0.6), 4 samples, on one sheet.
S=${0:A:h:h}; E=${ARK_ENGINE:-$S/../ark-video-studio-farm2}; frac=${1:-0.6}; samples=${2:-4}
python3 - "$S" "$frac" > $S/out/allsheet.txt <<'PY'
import json,sys
S,frac=sys.argv[1],float(sys.argv[2])
for s in json.load(open(S+'/film.json'))['scenes']:
    t=s['from']+(s['to']-s['from'])*frac
    print(s['scene'], s['from'], s['to'], round(t,2))
PY
while read sc f t tt; do
  (cd $E && node photoreal/render.mjs stills --song $S --scene $sc --params "{\"from\":$f,\"to\":$t}" --t $tt --samples $samples 2>&1 | grep -i "error" )
done < $S/out/allsheet.txt
python3 - "$S" <<'PY'
import sys
from PIL import Image, ImageDraw
S=sys.argv[1]
rows=[l.split() for l in open(S+'/out/allsheet.txt')]
n=len(rows); cols=4; R=(n+cols-1)//cols
sh=Image.new('RGB',(480*cols,270*R))
d=ImageDraw.Draw(sh)
for i,(sc,f,t,tt) in enumerate(rows):
    try:
        im=Image.open(f"{S}/out/{sc}/stills/{sc}-{float(tt):.2f}.png").resize((480,270))
        sh.paste(im,((i%cols)*480,(i//cols)*270)); d.text(((i%cols)*480+6,(i//cols)*270+4),f"{sc} {tt}",fill=(255,255,0))
    except Exception as e: print('missing',sc,e)
sh.save(S+'/out/allsheet.jpg',quality=85); print(S+'/out/allsheet.jpg')
PY
