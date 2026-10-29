"""Build a 3D torso from Mark's 4 background-removed photos: outline from front + side, surface baked from all 4."""
import numpy as np, json, sys
from PIL import Image
R = 'public/art/'  # run from the repo root: python3 scripts/bake-sculpture.py 0.80
V = [np.asarray(Image.open(f'{R}tagged-view-{i}.webp').convert('RGBA')).astype(np.float32) for i in (1, 2, 3, 4)]
TORSO_END = float(sys.argv[1]) if len(sys.argv) > 1 else .80   # where the torso meets the base, as a fraction of total height
info = []
for a in V:
    m = a[:, :, 3] > 128; rows = np.where(m.any(1))[0]; t, b = rows[0], rows[-1]
    cols = np.where(m[b - 3])[0]                     # the base's bottom edge gives the centre line
    info.append(dict(t=t, H=b - t + 1, cx=(cols[0] + cols[-1]) / 2, m=m))
def extents(k, f):
    I = info[k]; y = int(I['t'] + f * (I['H'] - 1)); cols = np.where(I['m'][y])[0]
    if not len(cols): return 0, 0
    return (I['cx'] - cols[0]) / I['H'], (cols[-1] - I['cx']) / I['H']   # left, right in units of total height
N = 160; prof = []
for j in range(N):
    f = .015 + (TORSO_END - .015) * j / (N - 1)
    l1, r1 = extents(0, f); l3, r3 = extents(2, f)
    w = (l1 + r1 + l3 + r3) / 4                       # half width, front and back views averaged
    l2, r2 = extents(1, f)                            # camera at -x: image right = +z (chest)
    l4, r4 = extents(3, f)                            # camera at +x: image left = +z (chest)
    df = (r2 + l4) / 2; db = (l2 + r4) / 2
    prof.append([round(f, 4), round(w, 4), round(df, 4), round(db, 4)])
P = np.array(prof)
# smooth a touch so the surface doesn't ripple
for c in (1, 2, 3):
    P[:, c] = np.convolve(np.pad(P[:, c], 3, mode='edge'), np.ones(7) / 7, mode='valid')
# bake the surface: u = angle round the body (0 = front), v = height
TW, TH = 2048, 2048
u = (np.arange(TW) + .5) / TW; v = (np.arange(TH) + .5) / TH
U, Vv = np.meshgrid(u, v)
f = .015 + (TORSO_END - .015) * Vv
w = np.interp(f, P[:, 0], P[:, 1]); df = np.interp(f, P[:, 0], P[:, 2]); db = np.interp(f, P[:, 0], P[:, 3])
th = U * 2 * np.pi
d = np.where(np.cos(th) >= 0, df, db)
X = w * np.sin(th); Z = d * np.cos(th)
# outward normal of the ellipse
nx = np.sin(th) / np.maximum(w, 1e-4); nz = np.cos(th) / np.maximum(d, 1e-4); nl = np.hypot(nx, nz); nx /= nl; nz /= nl
cams = [(0, 1, 0, +1), (-1, 0, 1, +1), (0, -1, 2, -1), (1, 0, 3, -1)]  # (camera dir x, z, view index, sign of image x)
acc = np.zeros((TH, TW, 3)); wsum = np.zeros((TH, TW))
for cx_, cz_, k, sgn in cams:
    I = info[k]; img = V[k]; Hh, Ww = img.shape[:2]
    wt = np.clip(nx * cx_ + nz * cz_, 0, None) ** 6
    horiz = X if cz_ != 0 else Z                      # front/back see x, sides see z
    if k == 2: horiz = -X
    if k == 3: horiz = -Z
    px = np.clip(I['cx'] + horiz * I['H'], 0, Ww - 1); py = np.clip(I['t'] + f * (I['H'] - 1), 0, Hh - 1)
    s = img[py.astype(int), px.astype(int)]
    ok = s[:, :, 3] > 160; wt = wt * ok
    acc += s[:, :, :3] * wt[..., None]; wsum += wt
col = np.where(wsum[..., None] > 1e-4, acc / np.maximum(wsum, 1e-4)[..., None], 20)
# take out the studio-light glare baked into the photos: soft, grey, low-detail brightness (writing and gold are kept)
from PIL import ImageFilter
mn = col.min(2); bl = np.asarray(Image.fromarray(mn.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(30))).astype(np.float32)
sat = (col.max(2) - col.min(2)) / np.maximum(col.max(2), 1)
col = col - .85 * (np.clip(bl - 30, 0, None) * np.clip(1 - sat * 2.2, 0, 1))[..., None]
Image.fromarray(col.clip(0, 255).astype(np.uint8)).save(R + 'tagged-model.webp', 'WEBP', quality=86, method=6)
# base: width/depth from the bottom of the front and side views
lb, rb = extents(0, .985); ls, rs = extents(1, .985)
json.dump({'height': .8, 'torsoEnd': TORSO_END, 'profile': P.round(4).tolist(), 'base': {'w': round(lb + rb, 4), 'd': round(ls + rs, 4)}}, open(R + 'tagged-model.json', 'w'))
print('ok', P[::20].round(3).tolist(), 'base', lb + rb, ls + rs, 'coverage', float((wsum > 1e-4).mean()))
