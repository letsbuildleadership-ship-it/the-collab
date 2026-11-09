"""Cuts the four trees out of the botanical reference plate and writes them for the Partnership slide.

    python3 scripts/pitch-deck/extract-trees.py <plate.png>

For each tree it writes scripts/pitch-deck/trees/<name>.png (the drawing on a transparent background) and
<name>-silhouette.png (the same shape, filled flat in forest green) and <name>-glow.png (an orange glow
in the tree's shape, 40px larger on every side, to sit behind it). The background is the plate's
cream paper; only the largest connected shape in each crop is kept, so labels and ground marks drop out.
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

PLATE = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent / 'trees'
FILL = (104, 158, 74)  # forest green
GLOW = (255, 84, 30)  # ember orange, for the glow behind each tree
# (name, crop box on the 1254x1254 plate: left, top, right, bottom) — each box holds one tree, trunk to tip.
TREES = [
    ('ponderosa', (10, 5, 370, 600)),
    ('sugar', (630, 5, 940, 602)),
    ('sequoia', (10, 630, 330, 1238)),
    ('douglas', (630, 630, 940, 1222)),
]


def largest_component(mask):
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    best = []
    for y0 in range(0, h, 2):
        for x0 in range(0, w, 2):
            if not mask[y0, x0] or seen[y0, x0]:
                continue
            q, comp = deque([(y0, x0)]), []
            seen[y0, x0] = True
            while q:
                y, x = q.popleft()
                comp.append((y, x))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
            if len(comp) > len(best):
                best = comp
    keep = np.zeros_like(mask, dtype=bool)
    ys, xs = zip(*best)
    keep[list(ys), list(xs)] = True
    return keep


def main():
    plate = Image.open(PLATE).convert('RGB')
    paper = np.array([252, 248, 237], dtype=float)
    OUT.mkdir(exist_ok=True)
    for name, box in TREES:
        crop = plate.crop(box)
        a = np.asarray(crop, dtype=float)
        dist = np.sqrt(((a - paper) ** 2).sum(axis=2))
        ink = dist > 38
        # close tiny gaps between needles so the crown reads as one mass, then keep the tree itself
        m = Image.fromarray((ink * 255).astype('uint8')).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(3))
        tree = largest_component(np.asarray(m) > 127)
        # drop the grass line at the very bottom: keep only rows above the lowest trunk-width row
        alpha = Image.fromarray((tree * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.8))
        ys, xs = np.nonzero(tree)
        bbox = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
        drawing = crop.convert('RGBA')
        drawing.putalpha(alpha)
        drawing.crop(bbox).save(OUT / f'{name}.png')
        sil = Image.new('RGBA', crop.size, FILL + (0,))
        sil.putalpha(alpha)
        sil.crop(bbox).save(OUT / f'{name}-silhouette.png')
        # an orange glow in the tree's own shape, padded so the blur has room; the slide puts it behind the tree
        pad = 40
        big = Image.new('L', (crop.size[0] + 2 * pad, crop.size[1] + 2 * pad), 0)
        big.paste(Image.fromarray((tree * 255).astype('uint8')), (pad, pad))
        halo = big.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(20))
        halo = halo.point(lambda v: min(255, int(v * 1.25)))
        glow = Image.new('RGBA', big.size, GLOW + (0,))
        glow.putalpha(halo)
        glow.crop((bbox[0], bbox[1], bbox[2] + 2 * pad, bbox[3] + 2 * pad)).save(OUT / f'{name}-glow.png')
        print(name, 'size', bbox[2] - bbox[0], 'x', bbox[3] - bbox[1])


if __name__ == '__main__':
    main()
