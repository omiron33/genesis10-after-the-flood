#!/bin/zsh
# Render stills of one scene at the given times (samples default 8) and make a 2-wide contact sheet.
#   tools/sheet.sh <scene> <t1,t2,...> [samples] [out.jpg]
S=${0:A:h:h}; E=${ARK_ENGINE:-$S/../ark-video-studio-farm2}
scene=$1; ts=$2; samples=${3:-8}; out=${4:-$S/out/sheet-$scene.jpg}
read from to <<< $(python3 -c "import json;s=[x for x in json.load(open('$S/film.json'))['scenes'] if x['scene']=='$scene'][0];print(s['from'],s['to'])")
cd $E && node photoreal/render.mjs stills --song $S --scene $scene --params "{\"from\":$from,\"to\":$to}" --t $ts --samples $samples 2>&1 | grep -v "404\|Feedback" | grep -i "error\|ms$\|fail" | head -20
python3 - "$S/out/$scene/stills" "$ts" "$out" "$scene" <<'PY'
import sys
from PIL import Image
d, ts, out, sc = sys.argv[1:5]
fs = [f"{d}/{sc}-{float(t):.2f}.png" for t in ts.split(',')]
n = len(fs); cols = 2 if n > 1 else 1; rows = (n + 1) // 2
sh = Image.new('RGB', (960 * cols, 540 * rows))
for i, f in enumerate(fs):
    try: sh.paste(Image.open(f).resize((960, 540)), ((i % 2) * 960, (i // 2) * 540))
    except Exception as e: print('missing', f)
sh.save(out, quality=86)
print(out)
PY
