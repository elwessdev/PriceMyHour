"""Generate placeholder app icons and splash image.

Usage: python3 scripts/generate-assets.py
Requires Pillow (pip install pillow) and the DejaVu Sans Bold font.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

GREEN = (22, 163, 74, 255)
WHITE = (255, 255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)
FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]

ASSETS = Path(__file__).resolve().parent.parent / "assets"


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    raise SystemExit("No bold TrueType font found; edit FONT_CANDIDATES.")


def draw_label(img: Image.Image, text: str, max_width_ratio: float, color) -> None:
    """Draw text centred, scaled so it spans max_width_ratio of the image width."""
    draw = ImageDraw.Draw(img)
    size = img.width
    font_size = size
    while font_size > 8:
        font = load_font(font_size)
        left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
        if right - left <= size * max_width_ratio:
            break
        font_size -= 4
    x = (size - (right - left)) / 2 - left
    y = (size - (bottom - top)) / 2 - top
    draw.text((x, y), text, font=font, fill=color)


def make(name: str, size: int, background, text_ratio: float, color=WHITE, rounded=False) -> None:
    img = Image.new("RGBA", (size, size), TRANSPARENT if rounded else background)
    if rounded:
        ImageDraw.Draw(img).rounded_rectangle(
            (0, 0, size - 1, size - 1), radius=size // 5, fill=background
        )
    draw_label(img, "$/h", text_ratio, color)
    img.save(ASSETS / name)
    print(f"wrote assets/{name}")


def make_feature_graphic(name: str, title: str) -> None:
    """1024x500 Google Play feature graphic: title on the left, a results-card preview on the right."""
    width, height = 1024, 500
    img = Image.new("RGB", (width, height), GREEN[:3])
    draw = ImageDraw.Draw(img)

    # Subtle vertical gradient from the brand green to a deeper shade.
    top, bottom = (22, 163, 74), (21, 128, 61)
    for y in range(height):
        t = y / (height - 1)
        draw.line([(0, y), (width, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)))

    # Left: badge, app name and tagline.
    badge = Image.new("RGBA", (112, 112), TRANSPARENT)
    ImageDraw.Draw(badge).rounded_rectangle((0, 0, 111, 111), radius=26, fill=WHITE)
    draw_label(badge, "$/h", 0.7, GREEN)
    img.paste(badge, (72, 92), badge)
    draw.text((72, 226), title, font=load_font(76), fill=WHITE)
    draw.text((74, 324), "Know the hourly rate you need", font=load_font(30), fill=WHITE)
    draw.text((74, 368), "After fees, taxes & expenses. 100% offline.", font=load_font(22), fill=(220, 252, 231))

    # Right: a simplified results card, matching the app's default scenario.
    card = (620, 92, 952, 408)
    draw.rounded_rectangle((card[0] + 6, card[1] + 10, card[2] + 6, card[3] + 10), radius=28, fill=(16, 110, 52))
    draw.rounded_rectangle(card, radius=28, fill=WHITE)
    x = card[0] + 32
    draw.text((x, card[1] + 32), "Minimum hourly rate", font=load_font(22), fill=(87, 83, 78))
    draw.text((x, card[1] + 70), "$33.31", font=load_font(64), fill=GREEN)
    draw.text((x, card[1] + 160), "$199.87 per day", font=load_font(22), fill=(87, 83, 78))
    segments = [(0.67, (22, 163, 74)), (0.12, (245, 158, 11)), (0.03, (59, 130, 246)),
                (0.08, (139, 92, 246)), (0.10, (239, 68, 68))]
    bar_left, bar_right, bar_y = x, card[2] - 32, card[1] + 214
    bar = Image.new("RGBA", (bar_right - bar_left, 18), TRANSPARENT)
    bar_draw = ImageDraw.Draw(bar)
    cursor = 0.0
    for share, color in segments:
        end = cursor + share * bar.width
        bar_draw.rectangle((round(cursor), 0, round(end), 17), fill=color)
        cursor = end
    mask = Image.new("L", bar.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, bar.width - 1, 17), radius=9, fill=255)
    img.paste(bar, (bar_left, bar_y), mask)
    labels = ["You", "Tax", "Fees"]
    colors = [segments[0][1], segments[1][1], segments[4][1]]
    lx = x
    for label, color in zip(labels, colors):
        draw.ellipse((lx, bar_y + 40, lx + 12, bar_y + 52), fill=color)
        draw.text((lx + 18, bar_y + 34), label, font=load_font(18), fill=(87, 83, 78))
        lx += 86

    img.save(ASSETS / name)
    print(f"wrote assets/{name}")


def main() -> None:
    ASSETS.mkdir(exist_ok=True)
    # Full icon (legacy launchers, Play Store listing uses a 512px export of this).
    make("icon.png", 1024, GREEN, 0.62)
    # Adaptive icon foreground: content must stay inside the central ~66% safe zone.
    make("adaptive-icon.png", 1024, TRANSPARENT, 0.42)
    # Monochrome layer for Android 13+ themed icons.
    make("adaptive-icon-monochrome.png", 1024, TRANSPARENT, 0.42)
    # Splash image sits on the green splash background set in app.json.
    make("splash-icon.png", 1024, TRANSPARENT, 0.8)
    make("favicon.png", 48, GREEN, 0.8, rounded=True)
    # 512x512 hi-res icon required by Google Play.
    make("play-store-icon-512.png", 512, GREEN, 0.62)
    # 1024x500 feature graphic required by Google Play.
    make_feature_graphic("play-feature-graphic.png", "RateWise")


if __name__ == "__main__":
    main()
