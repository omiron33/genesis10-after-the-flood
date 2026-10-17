# After the Flood (Genesis 10)

A song and code-rendered lyric film of Genesis 10, the Table of Nations: the ark grounded on Ararat, the three sons of Noah, and the clans of Japheth, Ham and Shem spreading across the earth by their lands, their tongues and their nations.

Built with the Ark engine: https://github.com/omiron33/ark-video-studio

[Listen at TechnoChristianity](https://technochristianity.com/music) · [More films on YouTube](https://www.youtube.com/@technochristianity)

The film runs **5:45** at **1920 × 1080 / 60 fps**, rendered at the engine's ultra tier (64 sub-frames per frame). Every frame of its 17 shots is drawn in code on the GPU: the shoulder of Ararat with the ark in drying mud, the braided river on the plain below, Japheth's green headland and island sea, the hot river country of Ham with Nimrod's walled cities, Mizraim's limestone cliffs, Canaan's terraced hills and the Salt Sea, Shem's stair and plateau in the east, and Ararat again at night. Nothing in the picture is a photograph, a downloaded model or a generated image, and no person is shown.

Every sung word is part of the world, in whatever form fits the place: standing 3D letters of stone, bronze, driftwood, salt and glazed brick; names painted on hulls, sails and terrace walls; lines cut into mud, wet sand, a basalt stele, a cliff face, stair risers and the rock of a plateau that splits in two in Peleg's days.

## Source layout

- `film.json`: the 17 shots and their timings, cut on measured beats.
- `scenes/`: one module per shot (camera, light, which words are where).
- `lib/world.js`: the shared renderer (heightfield land, water, standing stones, fires, and the word panels: solid 3D letters, relief, cut and painted).
- `lib/x-*.js`: the places (Ararat, the coast, the south, Canaan, the east), each with its land in GLSL and in JavaScript.
- `lib/noise.js`, `lib/cam.js`, `lib/look.js`, `lib/type.js`, `lib/cities.js`: noise, camera tracks, the look, typography and Nimrod's cities.
- `data/`: the aligned sung words and lines, and the measured musical timing.
- `docs/STORYBOARD.md`: what each shot is for and where its words live.
- `tools/`: timing (`analyze.py`, `vocals.py`, `timing.py`) and test stills (`sheet.sh`, `allsheet.sh`).
- `intake/sung-lyrics.txt`: the sung lyric text.

## Rendering

The scenes render with the photoreal mode of the Ark engine (`photoreal/film.mjs`). Place the original 48 kHz stereo recording at `media/song.wav`, then from an engine checkout beside this folder:

```sh
node photoreal/render.mjs stills --song ../genesis10-after-the-flood --scene s05-ham --params '{"from":111.55,"to":127.35}' --t 121 --samples 16
node photoreal/film.mjs --song ../genesis10-after-the-flood --local
```

A full ultra render is GPU intensive and takes well over a day on one Mac.

## License

Source code is released under the [MIT License](LICENSE). The song recording and the finished film are separate media releases; the source-code license does not grant any rights to the recording, its lyrics as a recorded work, or the rendered film.
