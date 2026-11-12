"""Genera los iconos de la app: tres anillos concéntricos de 270° (apertura abajo, como el anillo de fatiga)
en Ember / Volt / Paper sobre Asphalt. Supermuestreo 4x y reducción LANCZOS."""
import math
import sys
from PIL import Image, ImageDraw

ASPHALT = (0x12, 0x15, 0x1A)
STEEL2 = (0x23, 0x28, 0x33)
EMBER = (0xFF, 0x4F, 0x1F)
VOLT = (0x34, 0xC6, 0xF4)
PAPER = (0xF2, 0xF4, 0xF7)

S = 2048  # lienzo de trabajo
START, SWEEP = 135, 270  # PIL: grados en sentido horario desde las 3 en punto; 135 = abajo-izquierda
RINGS = [  # radio de la línea central, grosor, color, fracción rellena
    (700, 150, EMBER, 0.80),
    (520, 150, VOLT, 0.62),
    (340, 150, PAPER, 0.44),
]


def arc(draw, cx, cy, r, w, color, frac):
    # PIL dibuja el grosor hacia dentro desde el bbox: radio exterior = r + w/2.
    outer = r + w / 2
    box = [cx - outer, cy - outer, cx + outer, cy + outer]
    end = START + SWEEP * frac
    draw.arc(box, START, end, fill=color, width=int(w))
    for ang in (START, end):  # tapas redondeadas
        x = cx + r * math.cos(math.radians(ang))
        y = cy + r * math.sin(math.radians(ang))
        draw.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=color)


def render():
    img = Image.new("RGB", (S, S), ASPHALT)
    d = ImageDraw.Draw(img)
    cx = S / 2
    # La apertura inferior hace que el conjunto se extienda más por encima del centro (R) que por debajo
    # (R·cos45° + tapa): se baja el centro para que la masa quede centrada en el lienzo.
    r0, w0 = RINGS[0][0], RINGS[0][1]
    top, bottom = r0 + w0 / 2, r0 * math.cos(math.radians(45)) + w0 / 2
    cy = S / 2 + (top - bottom) / 2
    for r, w, color, frac in RINGS:
        arc(d, cx, cy, r, w, STEEL2, 1.0)  # pista
    for r, w, color, frac in RINGS:
        arc(d, cx, cy, r, w, color, frac)
    return img


if __name__ == "__main__":
    out = sys.argv[1]
    big = render()
    for name, size in [("icon-512.png", 512), ("icon-192.png", 192), ("apple-touch-icon.png", 180), ("favicon-32.png", 32)]:
        big.resize((size, size), Image.LANCZOS).save(f"{out}/{name}", optimize=True)
    print("ok")
