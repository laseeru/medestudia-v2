#!/usr/bin/env python3
"""Generate Open Graph images for MedEstudia."""

from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 630
BG_COLOR = (15, 23, 42)       # slate-900
ACCENT = (20, 184, 166)        # teal-500
ACCENT_LIGHT = (94, 234, 212)  # teal-300
WHITE = (255, 255, 255)
LIGHT = (203, 213, 225)        # slate-300
MUTED = (148, 163, 184)        # slate-400
DARK_ACCENT = (6, 78, 59)      # 6f hex for gradient

OUT = os.path.join(os.path.dirname(__file__), "..", "public")

def try_font(size, bold=False):
    families = [
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/SFNSDisplay.ttf",
        "/System/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttf",
    ]
    if bold:
        families = [
            "/System/Library/Fonts/HelveticaNeueBold.ttf",
            "/System/Library/Fonts/Arial Bold.ttf",
        ]
    for p in families:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def rounded_rect(draw, xy, r, fill=None, outline=None, width=1):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, r, fill=fill, outline=outline, width=width)


def create_medestudia():
    img = Image.new("RGB", (W, H), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Decorative gradient overlay — subtle light bar top-right
    for i in range(300):
        alpha = max(0, 32 - i // 10)
        x = W - 200 - i
        y = -50 + i // 3
        if 0 <= x < W and 0 <= y < H:
            draw.point((x, y), fill=(ACCENT[0], ACCENT[1], ACCENT[2], alpha) if hasattr(draw, 'point') else ACCENT)

    # Background accent circles
    draw.ellipse([-120, -120, 200, 200], fill=(*ACCENT, 6) if hasattr(draw, 'ellipse') else None, outline=None)
    draw.ellipse([W-250, H-250, W+50, H+50], fill=(*ACCENT, 6) if hasattr(draw, 'ellipse') else None, outline=None)

    # Actually draw some subtle decorative circles with transparency via shape
    accent_transparent = (ACCENT[0], ACCENT[1], ACCENT[2])
    for cx, cy, r in [(100, 80, 180), (W-150, H-100, 140)]:
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=accent_transparent, outline=None)
        # Re-overlay with reduced opacity by drawing over again? nope — just mini circles
    for cx, cy, r in [(80, 60, 80), (W-100, H-80, 60)]:
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(*ACCENT_LIGHT, 20) if hasattr(draw, 'ellipse') else ACCENT_LIGHT)

    # Subtle grid dots
    dot_color = (30, 41, 59)
    for x in range(0, W, 40):
        for y in range(0, H, 40):
            draw.point((x, y), fill=dot_color)

    # Accent line
    draw.rounded_rectangle([60, 200, 300, 206], 3, fill=ACCENT)

    # Title
    font_title = try_font(72, bold=True)
    draw.text((60, 230), "MedEstudia", fill=WHITE, font=font_title)

    # Subtitle
    font_sub = try_font(26)
    draw.text((60, 320), "Plataforma educativa basada en IA", fill=LIGHT, font=font_sub)
    draw.text((60, 358), "para estudiantes de ciencias médicas.", fill=MUTED, font=font_sub)

    # Tagline at bottom
    font_tag = try_font(18)
    draw.text((60, H - 80), "medestudia-v2.vercel.app", fill=MUTED, font=font_tag)

    # Small decorative element bottom-right
    draw.rounded_rectangle([W-180, H-80, W-60, H-64], 4, fill=ACCENT)
    font_small = try_font(14, bold=True)
    draw.text((W-170, H-76), "EDUCACIÓN MÉDICA", fill=BG_COLOR, font=font_small)

    path = os.path.join(OUT, "og-medestudia.png")
    img.save(path, "PNG")
    print(f"Created {path}")
    return path


def create_convencion():
    img = Image.new("RGB", (W, H), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Decorative circles
    for cx, cy, r in [(150, 100, 220), (W-200, H-120, 180)]:
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(ACCENT[0], ACCENT[1], ACCENT[2]), outline=None)
    for cx, cy, r in [(120, 80, 100), (W-150, H-90, 80)]:
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(*ACCENT_LIGHT, 20) if hasattr(draw, 'ellipse') else ACCENT_LIGHT)

    # Grid dots
    dot_color = (30, 41, 59)
    for x in range(0, W, 40):
        for y in range(0, H, 40):
            draw.point((x, y), fill=dot_color)

    # Badge pill
    draw.rounded_rectangle([60, 100, 310, 140], 20, fill=ACCENT)
    font_badge = try_font(16, bold=True)
    draw.text((88, 110), "CONVENCIÓN CIENTÍFICA", fill=BG_COLOR, font=font_badge)

    # Main title
    font_title = try_font(56, bold=True)
    draw.text((60, 170), "Convención Científica", fill=WHITE, font=font_title)
    draw.text((60, 238), "Estudiantil 2026", fill=WHITE, font=font_title)

    # Date
    font_date = try_font(30, bold=True)
    draw.text((60, 330), "25 – 29 de Mayo", fill=ACCENT_LIGHT, font=font_date)

    # Description
    font_desc = try_font(22)
    draw.text((60, 390), "Evento académico para estudiantes de", fill=LIGHT, font=font_desc)
    draw.text((60, 422), "ciencias médicas: innovación,", fill=MUTED, font=font_desc)
    draw.text((60, 454), "investigación y educación médica.", fill=MUTED, font=font_desc)

    # Bottom-left branding
    font_brand = try_font(18)
    draw.text((60, H - 80), "MedEstudia  •  medestudia-v2.vercel.app", fill=MUTED, font=font_brand)

    # Badge bottom-right
    draw.rounded_rectangle([W-200, H-80, W-60, H-64], 4, fill=ACCENT)
    font_small = try_font(14, bold=True)
    draw.text((W-190, H-76), "25 al 29 de mayo", fill=BG_COLOR, font=font_small)

    path = os.path.join(OUT, "og-convencion.png")
    img.save(path, "PNG")
    print(f"Created {path}")
    return path


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    create_medestudia()
    create_convencion()
    print("Done!")
