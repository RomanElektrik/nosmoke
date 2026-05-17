#!/usr/bin/env python3
"""App Store marketing screenshots: themed gradient + headline + realistic
iPhone mockup (bezel, Dynamic Island, clean status bar) holding the app shot.
Output: store-screens/*.png at 1290x2796 (App Store 6.9").
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

RAW = "/Users/romansuzdalcev/Downloads/скрины эпл"
OUT = os.path.join(os.path.dirname(__file__), "..", "store-screens")
os.makedirs(OUT, exist_ok=True)

W, H = 1290, 2796

def font(bold, size):
    paths = ([
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/Library/Fonts/Arial Bold.ttf",
    ] if bold else [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
    ])
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size, index=1 if bold else 0)

HEAD = font(True, 104)
SUB = font(False, 44)
CLOCK = font(True, 40)

def gradient(top, bot):
    base = Image.new("RGB", (W, H), bot)
    px = base.load()
    for y in range(H):
        f = (y / H) ** 0.8
        px_row = tuple(int(top[i] + (bot[i] - top[i]) * f) for i in range(3))
        for x in range(W):
            px[x, y] = px_row
    # soft radial glow behind the phone
    glow = Image.new("L", (W, H), 0)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([W // 2 - 520, 760, W // 2 + 520, 1900], fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(180))
    light = Image.new("RGB", (W, H), tuple(min(255, c + 60) for c in top))
    base.paste(light, (0, 0), glow)
    return base

def rmask(size, radius):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius, fill=255)
    return m

def avg_color(img, y):
    row = [img.getpixel((x, y)) for x in range(0, img.width, 40)]
    n = len(row)
    return tuple(sum(c[i] for c in row) // n for i in range(3))

def status_bar(w, h, bg):
    """Clean iOS status bar with time + cellular/wifi/battery icons."""
    bar = Image.new("RGB", (w, h), bg)
    d = ImageDraw.Draw(bar)
    white = (255, 255, 255)
    cy = int(h * 0.56)
    # time
    d.text((58, cy), "9:41", font=CLOCK, fill=white, anchor="lm")
    # right cluster
    x = w - 52
    # battery
    bw, bh = 56, 26
    bx0 = x - bw
    d.rounded_rectangle([bx0, cy - bh // 2, bx0 + bw - 6, cy + bh // 2], 7,
                        outline=(255, 255, 255, 255), width=3)
    d.rectangle([bx0 + bw - 5, cy - 5, bx0 + bw, cy + 5], fill=white)
    d.rounded_rectangle([bx0 + 5, cy - bh // 2 + 5, bx0 + bw - 16, cy + bh // 2 - 5], 3, fill=white)
    # wifi
    wx = bx0 - 30
    for i, r in enumerate((26, 17, 8)):
        d.arc([wx - r, cy - r - 4, wx + r, cy + r - 4], 215, 325, fill=white, width=5)
    d.ellipse([wx - 4, cy + 6, wx + 4, cy + 14], fill=white)
    # cellular bars
    cx = wx - 96
    for i in range(4):
        bh2 = 10 + i * 8
        d.rounded_rectangle([cx + i * 16, cy + 14 - bh2, cx + i * 16 + 10, cy + 14], 2, fill=white)
    # Dynamic Island
    iw, ih = 138, 42
    d.rounded_rectangle([(w - iw) // 2, 18, (w + iw) // 2, 18 + ih], ih // 2, fill=(0, 0, 0))
    return bar

def build_phone(raw_path):
    shot = Image.open(raw_path).convert("RGB")
    shot = shot.crop((0, 92, shot.width, shot.height))   # drop real status bar
    inner_w = 824
    scale = inner_w / shot.width
    shot = shot.resize((inner_w, int(shot.height * scale)), Image.LANCZOS)

    strip_h = 96
    bg = avg_color(shot, 1)
    bar = status_bar(inner_w, strip_h, bg)

    content = Image.new("RGB", (inner_w, strip_h + shot.height), bg)
    content.paste(bar, (0, 0))
    content.paste(shot, (0, strip_h))

    cw, ch = content.size
    border = 22
    ow, oh = cw + border * 2, ch + border * 2
    radius = 116

    phone = Image.new("RGBA", (ow, oh), (0, 0, 0, 0))
    # bezel with a faint rim highlight
    phone.paste(Image.new("RGBA", (ow, oh), (40, 41, 45, 255)), (0, 0), rmask((ow, oh), radius))
    inset = Image.new("RGBA", (ow - 6, oh - 6), (9, 9, 11, 255))
    phone.paste(inset, (3, 3), rmask(inset.size, radius - 3))
    phone.paste(content, (border, border), rmask((cw, ch), radius - border))
    return phone

SLIDES = [
    dict(raw="IMG_2941.PNG", top=(22, 86, 50),
         head=["Бросай курить", "пошагово"],
         sub="Метод под тебя, прогресс — на виду"),
    dict(raw="IMG_2942.PNG", top=(16, 78, 72),
         head=["План ведёт", "тебя по дням"],
         sub="Свой курс — шаг за шагом, день за днём"),
    dict(raw="IMG_2946.PNG", top=(26, 92, 56),
         head=["Препараты —", "по делу"],
         sub="Справка о цитизине, бупропионе и варениклине"),
    dict(raw="IMG_2948.PNG", top=(22, 64, 116),
         head=["Поддержка", "без осуждения"],
         sub="ИИ-помощник разберёт срыв и поддержит"),
    dict(raw="IMG_2943.PNG", top=(46, 58, 88),
         head=["Сорвался —", "это не провал"],
         sub="Мы не бросаем тебя даже после срыва"),
    dict(raw="IMG_2947.PNG", top=(104, 64, 22),
         head=["Узнай свои", "триггеры"],
         sub="Дневник тяги показывает скрытые паттерны"),
    dict(raw="IMG_2945.PNG", top=(96, 52, 30),
         head=["Знание —", "как справляться"],
         sub="Короткие статьи о тяге, срыве и триггерах"),
    dict(raw="IMG_2944.PNG", top=(64, 36, 104),
         head=["Каждый шаг —", "это победа"],
         sub="Достижения, которые ведут до конца"),
]
BOT = (10, 11, 13)
PHONE_TOP = 560          # phone starts right under the text — no dead space
PHONE_H = 2150           # phone bottom sits ~90px from the slide bottom

for i, s in enumerate(SLIDES, 1):
    img = gradient(s["top"], BOT)
    d = ImageDraw.Draw(img)

    y = 150
    for ln in s["head"]:
        bb = d.textbbox((0, 0), ln, font=HEAD)
        d.text(((W - (bb[2] - bb[0])) / 2 - bb[0], y), ln, font=HEAD, fill=(255, 255, 255))
        y += 122
    bb = d.textbbox((0, 0), s["sub"], font=SUB)
    d.text(((W - (bb[2] - bb[0])) / 2 - bb[0], y + 20), s["sub"], font=SUB, fill=(206, 211, 217))

    phone = build_phone(os.path.join(RAW, s["raw"]))
    rw = int(phone.width * PHONE_H / phone.height)
    phone = phone.resize((rw, PHONE_H), Image.LANCZOS)
    px = (W - rw) // 2
    py = PHONE_TOP

    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle(
        [px, py + 34, px + rw, py + PHONE_H + 34], 116, fill=(0, 0, 0, 175))
    img.paste(Image.new("RGB", (W, H), (0, 0, 0)), (0, 0), sh.filter(ImageFilter.GaussianBlur(52)))
    img.paste(phone, (px, py), phone)

    out = os.path.join(OUT, f"{i:02d}.png")
    img.save(out)
    print("saved", out)
print("done")
