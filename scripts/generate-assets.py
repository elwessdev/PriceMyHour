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


if __name__ == "__main__":
    main()
