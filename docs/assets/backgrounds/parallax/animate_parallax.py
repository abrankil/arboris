from pathlib import Path
from PIL import Image
import math

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'animation'
OUT.mkdir(exist_ok=True)
W, H = 960, 540
MARGIN = 32
sources = [Image.open(ROOT / name).convert('RGBA') for name in
           ['00-sky.png', '01-background.png', '02-midground.png', '03-foreground.png']]
layers = [im.resize((W + MARGIN*2, H + MARGIN*2), Image.Resampling.NEAREST) for im in sources]
frames = []
for i in range(64):
    phase = 2 * math.pi * i / 64
    canvas = Image.new('RGBA', (W, H))
    for layer, amplitude in zip(layers, [0, 4, 12, 24]):
        dx = round(amplitude * math.sin(phase))
        dy = round(amplitude * 0.16 * math.sin(phase))
        canvas.alpha_composite(layer, (-MARGIN + dx, -MARGIN + dy))
    frames.append(canvas.convert('RGB'))

# A shared palette prevents color flicker between GIF frames.
palette = frames[0].quantize(colors=256, method=Image.Quantize.MEDIANCUT)
gif_frames = [im.quantize(palette=palette, dither=Image.Dither.NONE) for im in frames]
gif_frames[0].save(OUT/'arboris-parallax.gif', save_all=True,
                   append_images=gif_frames[1:], duration=[60,60,60,70]*16,
                   loop=0, optimize=False, disposal=2)
frames[0].save(OUT/'arboris-parallax.webp', save_all=True,
               append_images=frames[1:], duration=[62,63]*32, loop=0,
               lossless=True, method=4)
frames[0].save(OUT/'preview.png')
for name in ['arboris-parallax.gif', 'arboris-parallax.webp']:
    with Image.open(OUT/name) as check:
        assert check.n_frames > 1, (name, check.n_frames)
        assert check.size == (W,H)
        print(name, check.size, check.n_frames, (OUT/name).stat().st_size)
