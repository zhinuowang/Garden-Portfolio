#!/usr/bin/env python3
"""Rebuild "Garden Hei" — the site's Chinese font — after the Chinese copy changes.

Noto Sans SC (SIL Open Font License 1.1) is cut down to exactly the Chinese characters used in src/, in two weights
(400 and 600), and written to public/fonts/garden-hei-{400,600}.woff2. The site serves these itself (no third-party
font requests at runtime). Needs fonttools and brotli (pip install fonttools brotli) and curl.

    python3 scripts/subset-zh-font.py
"""
import os, pathlib, re, subprocess, sys, tempfile
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.merge import Merger

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "fonts"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
is_cjk = lambda c: 0x3000 <= ord(c) <= 0x303F or 0x3400 <= ord(c) <= 0x4DBF or 0x4E00 <= ord(c) <= 0x9FFF or 0xFF00 <= ord(c) <= 0xFFEF
cjk = sorted({c for p in (ROOT / "src").rglob("*") if p.suffix in (".ts", ".tsx") for c in p.read_text(encoding="utf-8") if is_cjk(c)})

def ranges(spec):
    out = []
    for part in spec.split(","):
        a, _, b = part.strip()[2:].partition("-")
        out.append((int(a, 16), int(b or a, 16)))
    return out

tmp = pathlib.Path(tempfile.mkdtemp())
for w in ("400", "600"):
    css = subprocess.run(["curl", "-s", "-A", UA, f"https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@{w}"], capture_output=True, text=True, check=True).stdout
    parts, covered = [], set()
    for i, (url, spec) in enumerate(re.findall(r"src: url\((.*?)\) format\('woff2'\);\s*unicode-range: (.*?);", css)):
        rs = ranges(spec)
        want = [c for c in cjk if c not in covered and any(a <= ord(c) <= b for a, b in rs)]
        if not want:
            continue
        local = tmp / f"{w}-{i}.woff2"
        subprocess.run(["curl", "-s", "-o", str(local), url], check=True)
        font = TTFont(str(local))
        want = [c for c in want if ord(c) in font.getBestCmap()]
        if not want:
            continue
        opts = subset.Options(); opts.layout_features = ["*"]; opts.name_IDs = ["*"]; opts.notdef_outline = True
        sub = subset.Subsetter(opts); sub.populate(unicodes=[ord(c) for c in want]); sub.subset(font)
        font.flavor = None; p = tmp / f"{w}-{i}.ttf"; font.save(str(p))
        parts.append(str(p)); covered.update(want)
    merged = Merger().merge(parts); merged.flavor = "woff2"
    merged.save(str(OUT / f"garden-hei-{w}.woff2"))
    missing = "".join(c for c in cjk if c not in covered)
    print(f"{w}: {len(covered)} characters from {len(parts)} slices" + (f"; not in the font: {missing}" if missing else ""))
