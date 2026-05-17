#!/usr/bin/env python3
"""App Store marketing screenshots: themed gradient + headline + realistic
iPhone mockup (real iOS status bar) holding the app shot.
Outputs both iPhone 6.5" (1284x2778) and iPad Pro 13" (2064x2752).
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

RAW = "/Users/romansuzdalcev/Downloads/скрины эпл"
BASE = os.path.join(os.path.dirname(__file__), "..")

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

def rmask(size, radius):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius, fill=255)
    return m

def build_phone(raw_path):
    shot = Image.open(raw_path).convert("RGB")
    # Keep the real iOS status bar — only erase the TestFlight indicator chip.
    bg = shot.getpixel((shot.width // 2, 6))
    ImageDraw.Draw(shot).rectangle([0, 54, 180, 94], fill=bg)
    inner_w = 824
    scale = inner_w / shot.width
    content = shot.resize((inner_w, int(shot.height * scale)), Image.LANCZOS)

    cw, ch = content.size
    border = 22
    ow, oh = cw + border * 2, ch + border * 2
    radius = 116

    phone = Image.new("RGBA", (ow, oh), (0, 0, 0, 0))
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


def gradient(W, H, top, bot):
    base = Image.new("RGB", (W, H), bot)
    px = base.load()
    for y in range(H):
        f = (y / H) ** 0.8
        px_row = tuple(int(top[i] + (bot[i] - top[i]) * f) for i in range(3))
        for x in range(W):
            px[x, y] = px_row
    glow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glow).ellipse([W // 2 - 520, 760, W // 2 + 520, 1900], fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(180))
    light = Image.new("RGB", (W, H), tuple(min(255, c + 60) for c in top))
    base.paste(light, (0, 0), glow)
    return base


def render(out_dir, W, H, head_size, sub_size, y0, line_step, phone_top, phone_h):
    os.makedirs(out_dir, exist_ok=True)
    HEAD = font(True, head_size)
    SUB = font(False, sub_size)
    for i, s in enumerate(SLIDES, 1):
        img = gradient(W, H, s["top"], BOT)
        d = ImageDraw.Draw(img)
        y = y0
        for ln in s["head"]:
            bb = d.textbbox((0, 0), ln, font=HEAD)
            d.text(((W - (bb[2] - bb[0])) / 2 - bb[0], y), ln, font=HEAD, fill=(255, 255, 255))
            y += line_step
        bb = d.textbbox((0, 0), s["sub"], font=SUB)
        d.text(((W - (bb[2] - bb[0])) / 2 - bb[0], y + 20), s["sub"], font=SUB, fill=(206, 211, 217))

        phone = build_phone(os.path.join(RAW, s["raw"]))
        rw = int(phone.width * phone_h / phone.height)
        phone = phone.resize((rw, phone_h), Image.LANCZOS)
        px = (W - rw) // 2

        sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle(
            [px, phone_top + 34, px + rw, phone_top + phone_h + 34], 116, fill=(0, 0, 0, 175))
        img.paste(Image.new("RGB", (W, H), (0, 0, 0)), (0, 0), sh.filter(ImageFilter.GaussianBlur(52)))
        img.paste(phone, (px, phone_top), phone)

        out = os.path.join(out_dir, f"{i:02d}.png")
        img.save(out)
        print("saved", out)


# iPhone 6.5" — 1284x2778
render(os.path.join(BASE, "store-screens"),
       1284, 2778, head_size=104, sub_size=44, y0=150, line_step=122,
       phone_top=560, phone_h=2150)

# iPad Pro 13" — 2064x2752
render(os.path.join(BASE, "store-screens-ipad"),
       2064, 2752, head_size=130, sub_size=58, y0=170, line_step=154,
       phone_top=700, phone_h=1860)

print("done")
