# Paints the site favicon: a tiny oil painting of a cottage under a pink sky on a green field, in the palette of the
# landing painting, built from thousands of short brushstrokes, then writes every icon size the site links to.
#   python3 scripts/paint-favicon.py        (needs Pillow; writes to public/)
import math, random, sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops
random.seed(7)
N = 1024
OUT = sys.argv[1] if len(sys.argv) > 1 else "public"

def hx(h): return tuple(int(h[i:i+2], 16) for i in (1, 3, 5))
def mix(a, b, t): return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))
def jit(c, j): return tuple(max(0, min(255, v + random.randint(-j, j))) for v in c)

def strokes(color_at, region, n, length, width, angle, j=10, ang_j=0.25):
    """A layer of short, slightly rotated dabs. color_at(x, y) gives the base colour."""
    layer = Image.new("RGBA", (N, N), (0, 0, 0, 0))
    x0, y0, x1, y1 = region
    for _ in range(n):
        x, y = random.uniform(x0, x1), random.uniform(y0, y1)
        L = random.uniform(*length); W = random.uniform(*width)
        a = angle + random.uniform(-ang_j, ang_j)
        dab = Image.new("RGBA", (int(L) + 8, int(W) + 8), (0, 0, 0, 0))
        dd = ImageDraw.Draw(dab)
        c = jit(color_at(x, y), j)
        dd.rounded_rectangle([4, 4, 4 + L, 4 + W], radius=W / 2, fill=c + (235,))
        # a lighter ridge along one edge, like paint catching the light
        dd.line([(6, 5), (2 + L, 5)], fill=mix(c, (255, 250, 240), 0.3) + (95,), width=max(1, int(W / 5)))
        dab = dab.rotate(math.degrees(a), expand=True, resample=Image.BICUBIC)
        layer.alpha_composite(dab, (int(x - dab.width / 2), int(y - dab.height / 2)))
    return layer

def mask_poly(pts, blur=2):
    m = Image.new("L", (N, N), 0); ImageDraw.Draw(m).polygon(pts, fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur))

def mask_rect(b, blur=2, r=0):
    m = Image.new("L", (N, N), 0); ImageDraw.Draw(m).rounded_rectangle(b, radius=r, fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur))

def put(canvas, layer, mask):
    a = ImageChops.multiply(layer.getchannel("A"), mask)
    layer = layer.copy(); layer.putalpha(a); canvas.alpha_composite(layer)

skyTop, skyLow, horizon = hx("#e8a3ab"), hx("#f2bfb6"), hx("#fbdcc4")
hill = hx("#d6bcc2")
far, near, deep = hx("#b7c487"), hx("#93ad62"), hx("#7a9850")
roof, roofHi, chim = hx("#c4664c"), hx("#de8f6f"), hx("#a95a45")
wall, stone, door, win = hx("#f3e8cc"), hx("#dccaa2"), hx("#6b8382"), hx("#f6cf86")
path = hx("#ecd8a8")
HZ = 520

def sky_c(x, y):
    t = max(0, min(1, y / HZ))
    return mix(skyTop, skyLow, t / .6) if t < .6 else mix(skyLow, horizon, (t - .6) / .4)
def field_c(x, y):
    t = max(0, min(1, (y - HZ) / (N - HZ)))
    return mix(far, near, t / .5) if t < .5 else mix(near, deep, (t - .5) / .5)

c = Image.new("RGBA", (N, N), sky_c(0, 0) + (255,))
# sky: a flat underpaint, then long horizontal strokes
under = Image.new("RGBA", (N, N))
for y in range(N): ImageDraw.Draw(under).line([(0, y), (N, y)], fill=(sky_c(0, y) if y < HZ else field_c(0, y)) + (255,))
c.alpha_composite(under)
put(c, strokes(sky_c, (-40, -20, N + 40, HZ + 20), 900, (70, 160), (16, 30), 0, 8, .12), mask_rect((0, 0, N, HZ + 10), 4))
# a soft cream cloud
def cloud(blobs, blur=10):
    m = Image.new("L", (N, N), 0); d = ImageDraw.Draw(m)
    for (x, y, rx, ry) in blobs: d.ellipse([x - rx, y - ry, x + rx, y + ry], fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur))
cm = cloud([(170, 178, 110, 34), (290, 160, 120, 44), (420, 176, 110, 32), (520, 186, 70, 22)])
put(c, strokes(lambda x, y: mix(hx("#fdeadb"), hx("#f6cfc3"), (y - 130) / 90), (40, 110, 620, 230), 160, (40, 110), (12, 22), -.04, 6, .08), cm)
cm2 = cloud([(760, 282, 100, 24), (870, 270, 90, 30), (960, 286, 70, 20)])
put(c, strokes(lambda x, y: mix(hx("#fdeadb"), hx("#f6cfc3"), (y - 250) / 60), (640, 240, N + 20, 320), 110, (40, 100), (10, 18), 0, 6, .08), cm2)
# distant lilac hills along the horizon
hills = [(0, HZ + 15)] + [(x, HZ - 22 - 18 * math.sin(x / 140)) for x in range(0, N + 1, 16)] + [(N, HZ + 15)]
put(c, strokes(lambda x, y: hill, (-20, HZ - 60, N + 20, HZ + 20), 260, (50, 110), (10, 18), 0, 7, .1), mask_poly(hills, 3))
# the field: strokes that follow the slope, darker toward the viewer
put(c, strokes(field_c, (-40, HZ - 10, N + 40, N + 40), 2200, (50, 120), (14, 26), -.12, 10, .3), mask_rect((0, HZ - 4, N, N), 3))
# a lighter rolling hill on the right
rh = [(380, N)] + [(x, 760 - 140 * math.sin((x - 380) / 640 * math.pi / 2)) for x in range(380, N + 1, 16)] + [(N, N)]
put(c, strokes(lambda x, y: mix(hx("#c6cf92"), near, (y - 620) / 400), (360, 600, N + 40, N + 40), 900, (50, 120), (14, 24), -.25, 9, .2), mask_poly(rh, 3))

# the cottage, centred
roof_pts = [(232, 592), (356, 372), (668, 372), (792, 592)]
wall_box = (300, 576, 724, 838)
# a soft shadow on the grass
put(c, strokes(lambda x, y: hx("#7d9455"), (280, 822, 760, 864), 120, (40, 90), (10, 16), 0, 6, .1), mask_rect((280, 820, 780, 868), 10, 20))
put(c, strokes(lambda x, y: wall, (wall_box[0], wall_box[1], wall_box[2], wall_box[3]), 420, (30, 70), (16, 26), 0, 10, .25), mask_rect(wall_box, 1.5))
put(c, strokes(lambda x, y: stone, (wall_box[0], 600, wall_box[2], wall_box[3]), 90, (24, 46), (14, 22), 0, 10, .4), mask_rect(wall_box, 1.5))
put(c, strokes(lambda x, y: chim, (600, 270, 660, 400), 50, (30, 60), (12, 18), math.pi / 2, 8, .1), mask_rect((604, 284, 654, 410), 1.5))
put(c, strokes(lambda x, y: mix(roof, chim, (y - 398) / 400), (220, 362, 805, 600), 700, (40, 90), (14, 22), 0, 12, .15), mask_poly(roof_pts, 1.5))
# rows of tiles catching light
for ry in range(410, 590, 40):
    put(c, strokes(lambda x, y: roofHi, (232, ry - 4, 792, ry + 4), 60, (30, 60), (6, 10), 0, 10, .08), mask_poly(roof_pts, 1.5))
# eave shadow
put(c, strokes(lambda x, y: hx("#b9a27c"), (300, 594, 724, 606), 40, (40, 80), (8, 12), 0, 5, .05), mask_rect((300, 590, 724, 610), 2))
# door and two lit windows
put(c, strokes(lambda x, y: door, (470, 690, 556, 838), 70, (30, 60), (12, 18), math.pi / 2, 8, .1), mask_rect((472, 688, 552, 838), 1.5, 34))
for wx in (346, 602):
    put(c, strokes(lambda x, y: win, (wx, 652, wx + 76, 728), 50, (24, 50), (10, 16), 0, 8, .3), mask_rect((wx, 652, wx + 76, 728), 1.5, 6))
    d = ImageDraw.Draw(c); d.line([(wx + 38, 654), (wx + 38, 726)], fill=hx("#b48d5b") + (220,), width=7); d.line([(wx + 2, 690), (wx + 74, 690)], fill=hx("#b48d5b") + (220,), width=7)
# the garden path from the door to the viewer
TOP, H = 838, N + 20 - 838
def pmid(t): return 512 - 110 * math.sin(t * math.pi * .9) + 40 * t   # a gentle S toward the viewer
def pwid(t): return 64 + 190 * t ** 1.3
def pleft(t): return pmid(t) - pwid(t) / 2
def pright(t): return pmid(t) + pwid(t) / 2
pts = [(pleft(t / 20), TOP + H * t / 20) for t in range(0, 21)] + [(pright(t / 20), TOP + H * t / 20) for t in range(20, -1, -1)]
put(c, strokes(lambda x, y: path, (260, TOP - 10, 800, N + 20), 420, (30, 70), (12, 20), 1.2, 10, .4), mask_poly(pts, 2.5))
# a few painted flowers along the path
for _ in range(46):
    side = random.choice((-1, 1)); t = random.uniform(.05, 1)
    x = pleft(t) - 22 if side < 0 else pright(t) + 22
    y = TOP + H * t + random.uniform(-10, 10)
    col = random.choice([hx("#f4a6b4"), hx("#fbeef0"), hx("#ef8fa3"), hx("#fff6e0")])
    r = random.uniform(6, 11)
    ImageDraw.Draw(c).ellipse([x - r, y - r * .8, x + r, y + r * .8], fill=col + (235,))

img = c.convert("RGB")
# canvas grain: a faint emboss of the paint itself
emb = img.convert("L").filter(ImageFilter.EMBOSS).filter(ImageFilter.GaussianBlur(.6))
img = ImageChops.overlay(img, Image.merge("RGB", [emb.point(lambda v: 128 + (v - 128) * .5)] * 3))
import os
from PIL import ImageEnhance
def size(n):
    t = img.resize((n, n), Image.LANCZOS)
    if n <= 48:  # keep the roof, walls and field distinct in a browser tab
        t = ImageEnhance.Color(t).enhance(1.15).filter(ImageFilter.UnsharpMask(radius=0.6, percent=60, threshold=0))
    return t
for n, name in [(16, "icon-16.png"), (32, "icon-32.png"), (180, "apple-touch-icon.png"), (192, "icon-192.png"), (512, "icon-512.png")]:
    size(n).save(os.path.join(OUT, name), optimize=True)
ico = [size(n) for n in (16, 32, 48)]
ico[2].save(os.path.join(OUT, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico[:2])
print("wrote favicon.ico, icon-16/32/192/512.png, apple-touch-icon.png to", OUT)
