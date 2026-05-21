"""Generate QR PNGs for the WebGIS portal.

Run from the repo root:  python scripts/generate_qr.py

Writes one PNG per entry into qr/. Re-run after editing the ENTRIES table.
"""
from pathlib import Path
import qrcode
from qrcode.constants import ERROR_CORRECT_M

ENTRIES = [
    ("tombolos",            "https://uoa-gr.github.io/Tombolos/"),
    ("historic-floods",     "https://historicfloods.org/"),
    ("beach-rocks",         "https://uoa-gr.github.io/BeachRocks/"),
    ("coastal-storm-surge", "https://uoa-gr.github.io/coastal-storm-surge-GR-2026/"),
    ("lagoons",             "https://uoa-gr.github.io/Lagoons/"),
    ("naxos",               "https://uoa-gr.github.io/naxos/"),
]

OUT_DIR = Path(__file__).resolve().parent.parent / "qr"
OUT_DIR.mkdir(exist_ok=True)

for entry_id, url in ENTRIES:
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_M,
        box_size=24,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    out = OUT_DIR / f"{entry_id}.png"
    img.save(out)
    print(f"{out.name:32s}  {img.size[0]}x{img.size[1]}  {url}")
