"""Frame raw phone screenshots into 1080x1920 (9:16) Google Play screenshots.

Usage:
  1. Put screenshots in store-listing/screenshots/raw/ (phone) or raw-<device>/
     named 1.png, 2.png, ... in the order of CAPTIONS below
     (scripts/capture-screenshots.mjs does this for you).
  2. Run: python3 scripts/frame-screenshots.py [phone|tablet7|tablet10]
  3. Upload the files from store-listing/screenshots/ to the Play Console.
"""

import sys

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "store-listing" / "screenshots"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# Output canvas per device, all 9:16 as Google Play requires.
SIZES = {"phone": (1080, 1920), "tablet7": (1080, 1920), "tablet10": (1440, 2560)}
DEVICE = sys.argv[1] if len(sys.argv) > 1 else "phone"
if DEVICE not in SIZES:
    raise SystemExit(f"Unknown device {DEVICE!r}. Use: {', '.join(SIZES)}")
RAW = OUT / ("raw" if DEVICE == "phone" else f"raw-{DEVICE}")
PREFIX = "play-screenshot" if DEVICE == "phone" else f"play-{DEVICE}"
WIDTH, HEIGHT = SIZES[DEVICE]
K = WIDTH / 1080  # scale layout constants for larger canvases
TOP, BOTTOM = (22, 163, 74), (21, 128, 61)

CAPTIONS = [
    "Know your minimum\nhourly rate",
    "See where every\ndollar goes",
    "Price projects\nwith confidence",
    "Save presets for\nevery platform",
    "Private & offline.\nNo account needed.",
]


def background() -> Image.Image:
    img = Image.new("RGB", (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(img)
    for y in range(HEIGHT):
        t = y / (HEIGHT - 1)
        draw.line([(0, y), (WIDTH, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOTTOM)))
    return img


def rounded(img: Image.Image, radius: int) -> Image.Image:
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, img.width - 1, img.height - 1), radius=radius, fill=255)
    out = img.convert("RGBA")
    out.putalpha(mask)
    return out


def frame(shot_path: Path, caption: str, out_path: Path) -> None:
    canvas = background()
    draw = ImageDraw.Draw(canvas)

    font = ImageFont.truetype(FONT, round(72 * K))
    draw.multiline_text((WIDTH / 2, 110 * K), caption, font=font, fill="white", anchor="ma", align="center", spacing=round(18 * K))

    # Fit the screenshot into the area below the caption.
    area_top, margin = round(400 * K), round(90 * K)
    max_w, max_h = WIDTH - 2 * margin, HEIGHT - area_top - round(60 * K)
    shot = Image.open(shot_path).convert("RGB")
    scale = min(max_w / shot.width, max_h / shot.height)
    shot = shot.resize((round(shot.width * scale), round(shot.height * scale)), Image.LANCZOS)
    radius = round(40 * K)
    shot = rounded(shot, radius)

    x = (WIDTH - shot.width) // 2
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        (x, area_top + 16, x + shot.width, area_top + 16 + shot.height), radius=radius, fill=(0, 0, 0, 90)
    )
    canvas = Image.alpha_composite(canvas.convert("RGBA"), shadow.filter(ImageFilter.GaussianBlur(18)))
    canvas.paste(shot, (x, area_top), shot)
    canvas.convert("RGB").save(out_path)
    print(f"wrote {out_path.relative_to(ROOT)}")


def main() -> None:
    shots = sorted(p for p in RAW.glob("*") if p.suffix.lower() in {".png", ".jpg", ".jpeg"})
    if not shots:
        raise SystemExit(f"No screenshots found in {RAW.relative_to(ROOT)}/")
    for i, shot in enumerate(shots):
        caption = CAPTIONS[i] if i < len(CAPTIONS) else ""
        frame(shot, caption, OUT / f"{PREFIX}-{i + 1}.png")


if __name__ == "__main__":
    main()
