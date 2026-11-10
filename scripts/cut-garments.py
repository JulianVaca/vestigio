"""
Recorta cada prenda de su fondo de estudio y guarda `<id>-cut.webp` (con alfa, ajustado a la prenda).
El perchero 3D usa estos recortes para que cuelgue la prenda y no una tarjeta con fondo.
También escribe `src/rack3d/cuts.json` con el encuadre de cada prenda dentro de su foto
([x0, y0, x1, y1] de 0 a 1), para colgarla a su tamaño real y con el cuello en la percha.

Uso:  python scripts/cut-garments.py            (todas las piezas)
      python scripts/cut-garments.py --sheet x.png   (además guarda una hoja de contacto para revisar)
Requiere: opencv-python, numpy, pillow.
"""
import glob
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

SRC = os.path.join(os.path.dirname(__file__), '..', 'public', 'img', 'products')
MANIFEST = os.path.join(os.path.dirname(__file__), '..', 'src', 'rack3d', 'cuts.json')
WIDTH = 560


def cut(path):
    rgb = np.array(Image.open(path).convert('RGB'))
    h0, w0 = rgb.shape[:2]
    h = round(h0 * WIDTH / w0)
    rgb = cv2.resize(rgb, (WIDTH, h), interpolation=cv2.INTER_AREA)
    w = WIDTH

    # GrabCut: el marco exterior es fondo seguro, el centro es prenda segura, el resto se decide por color.
    mask = np.full((h, w), cv2.GC_PR_FGD, np.uint8)
    m = int(w * 0.035)
    mask[:m, :] = mask[-m:, :] = cv2.GC_BGD
    mask[:, :m] = mask[:, -m:] = cv2.GC_BGD
    mask[int(h * 0.38):int(h * 0.62), int(w * 0.40):int(w * 0.60)] = cv2.GC_FGD
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB), mask, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    fg = ((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)).astype(np.uint8)

    # Sólo la pieza principal, sin huecos interiores.
    n, lbl, stats, _ = cv2.connectedComponentsWithStats(fg, 8)
    if n > 1:
        fg = (lbl == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
    n, lbl, _, _ = cv2.connectedComponentsWithStats(1 - fg, 4)
    border = set(np.unique(np.concatenate([lbl[0], lbl[-1], lbl[:, 0], lbl[:, -1]])))
    for i in range(1, n):
        if i not in border:
            fg[lbl == i] = 1

    # Un píxel hacia dentro para quitar el halo del fondo, y borde suavizado.
    fg = cv2.erode(fg, np.ones((3, 3), np.uint8))
    alpha = cv2.GaussianBlur(fg * 255, (0, 0), 1.0)

    # El color de la prenda se extiende hacia la zona transparente: así los mipmaps y el
    # filtrado de la GPU no mezclan el crema del fondo en el borde del recorte.
    solid = (alpha > 200).astype(np.float32)
    acc = rgb.astype(np.float32) * solid[..., None]
    wsum = solid.copy()
    for sigma in (2, 6, 18, 54):
        acc_b = cv2.GaussianBlur(acc, (0, 0), sigma)
        w_b = cv2.GaussianBlur(wsum, (0, 0), sigma)
        fill = (wsum < 1e-3) & (w_b > 1e-3)
        acc[fill] = acc_b[fill] / w_b[fill][..., None]
        wsum[fill] = 1
    bled = np.where(solid[..., None] > 0, rgb, np.clip(acc, 0, 255).astype(np.uint8))

    # Encuadre ajustado a la prenda.
    ys, xs = np.where(alpha > 8)
    x0, x1 = max(xs.min() - 2, 0), min(xs.max() + 3, w)
    y0, y1 = max(ys.min() - 2, 0), min(ys.max() + 3, h)
    rgba = np.dstack([bled, alpha])[y0:y1, x0:x1]
    return rgba, [round(float(v), 4) for v in (x0 / w, y0 / h, x1 / w, y1 / h)]


def main():
    sheet = sys.argv[sys.argv.index('--sheet') + 1] if '--sheet' in sys.argv else None
    files = sorted(f for f in glob.glob(os.path.join(SRC, '*.webp')) if not f.endswith(('-sm.webp', '-cut.webp')))
    thumbs = []
    boxes = {}
    for f in files:
        rgba, box = cut(f)
        boxes[os.path.basename(f)[:-5]] = box
        out = f[:-5] + '-cut.webp'
        # exact=True conserva el color bajo los píxeles transparentes (el sangrado de arriba).
        Image.fromarray(rgba).save(out, 'WEBP', quality=82, method=6, exact=True)
        print(f'{os.path.basename(out)}  {os.path.getsize(out) // 1024} KB')
        if sheet:
            a = rgba[..., 3:] / 255.0
            comp = (rgba[..., :3] * a + np.array([200, 60, 200]) * (1 - a)).astype(np.uint8)
            canvas = np.full((280, 210, 3), (200, 60, 200), np.uint8)
            k = min(210 / comp.shape[1], 280 / comp.shape[0])
            t = cv2.resize(comp, (int(comp.shape[1] * k), int(comp.shape[0] * k)), interpolation=cv2.INTER_AREA)
            canvas[: t.shape[0], : t.shape[1]] = t
            thumbs.append(canvas)
    with open(MANIFEST, 'w', encoding='utf-8', newline=chr(10)) as fh:
        json.dump(boxes, fh, indent=2)
        fh.write(chr(10))
    if sheet:
        rows = [np.hstack(thumbs[i:i + 10]) for i in range(0, len(thumbs), 10) if len(thumbs[i:i + 10]) == 10]
        Image.fromarray(np.vstack(rows)).save(sheet)


if __name__ == '__main__':
    main()
