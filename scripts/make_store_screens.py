#!/usr/bin/env python3
"""Generate App Store marketing screenshots from raw app screenshots.
Each slide: themed gradient background + headline + subtitle + phone mockup.
Output: store-screens/*.png at 1290x2796 (App Store 6.9" / 6.5" compatible).
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

HEAD = font(True, 112)
SUB = font(False, 46)
SB = font(True, 34)

def gradient(top, bot):
    img = Image.new("RGB", (W, H), bot)
    px = img.load()
    for y in range(H):
        f = y / H
        f = f ** 0.75
        r = int(top[0] + (bot[0] - top[0]) * f)
        g = int(top[1] + (bot[1] - top[1]) * f)
        b = int(top[2] + (bot[2] - top[2]) * f)
        for x in range(W):
            px[x, y] = (r, g, b)
    return img

def rounded_mask(size, radius):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius, fill=255)
    return m

def centered(draw, lines, font_, y, color, line_gap):
    for ln in lines:
        bb = draw.textbbox((0, 0), ln, font=font_)
        w = bb[2] - bb[0]
        draw.text(((W - w) / 2, y), ln, font=font_, fill=color)
        y += (bb[3] - bb[1]) + line_gap
    return y

def build_phone(raw_path):
    shot = Image.open(raw_path).convert("RGB")
    # crop the real status bar (~88 px on an 828-wide capture)
    shot = shot.crop((0, 90, shot.width, shot.height))
    inner_w = 742
    scale = inner_w / shot.width
    inner_h = int(shot.height * scale)
    shot = shot.resize((inner_w, inner_h), Image.LANCZOS)

    # clean status strip on top of the content
    strip_h = 66
    content = Image.new("RGB", (inner_w, inner_h + strip_h), (11, 15, 20))
    content.paste(shot, (0, strip_h))
    d = ImageDraw.Draw(content)
    d.text((34, 16), "9:41", font=SB, fill=(255, 255, 255))
    # right side: simple battery
    bx, by = inner_w - 92, 24
    d.rounded_rectangle([bx, by, bx + 46, by + 22], 5, outline=(255, 255, 255), width=3)
    d.rounded_rectangle([bx + 3, by + 3, bx + 36, by + 19], 2, fill=(255, 255, 255))
    d.rectangle([bx + 48, by + 7, bx + 52, by + 15], fill=(255, 255, 255))

    cw, ch = content.size
    border = 18
    ow, oh = cw + border * 2, ch + border * 2
    radius = 96

    phone = Image.new("RGBA", (ow, oh), (0, 0, 0, 0))
    frame = Image.new("RGBA", (ow, oh), (12, 12, 14, 255))
    phone.paste(frame, (0, 0), rounded_mask((ow, oh), radius))
    phone.paste(content, (border, border), rounded_mask((cw, ch), radius - border))
    return phone

SLIDES = [
    dict(raw="IMG_2941.PNG", top=(20, 80, 47),
         head=["Бросай курить", "пошагово"],
         sub=["Метод под тебя, прогресс — на виду"]),
    dict(raw="IMG_2942.PNG", top=(15, 74, 68),
         head=["План ведёт", "тебя по дням"],
         sub=["Свой курс — шаг за шагом, день за днём"]),
    dict(raw="IMG_2948.PNG", top=(18, 58, 102),
         head=["Поддержка", "без осуждения"],
         sub=["ИИ-помощник разберёт срыв и поддержит"]),
    dict(raw="IMG_2943.PNG", top=(42, 53, 80),
         head=["Сорвался —", "это не провал"],
         sub=["Мы не бросаем тебя даже после срыва"]),
    dict(raw="IMG_2947.PNG", top=(92, 58, 18),
         head=["Узнай свои", "триггеры"],
         sub=["Дневник тяги показывает скрытые паттерны"]),
    dict(raw="IMG_2944.PNG", top=(58, 32, 96),
         head=["Каждый шаг —", "это победа"],
         sub=["Достижения, которые ведут до конца"]),
]

BOT = (10, 11, 13)

for i, s in enumerate(SLIDES, 1):
    img = gradient(s["top"], BOT)
    d = ImageDraw.Draw(img)

    y = centered(d, s["head"], HEAD, 150, (255, 255, 255), 18)
    y = centered(d, s["sub"], SUB, y + 30, (201, 205, 210), 12)

    phone = build_phone(os.path.join(RAW, s["raw"]))
    px = (W - phone.width) // 2
    py = 1010

    # soft shadow
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle(
        [px, py + 26, px + phone.width, py + phone.height + 26], 96, fill=(0, 0, 0, 150))
    sh = sh.filter(ImageFilter.GaussianBlur(40))
    img.paste(Image.new("RGB", (W, H), (0, 0, 0)), (0, 0), sh)

    img.paste(phone, (px, py), phone)

    out = os.path.join(OUT, f"{i:02d}.png")
    img.save(out)
    print("saved", out)

print("done")
