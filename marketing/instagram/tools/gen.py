import os, sys, json, io, subprocess, math, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

FONT = sys.argv[1]; OUT = sys.argv[2]; LOGO_SRC = sys.argv[3]; FFMPEG = sys.argv[4]
ONLY = sys.argv[5] if len(sys.argv) > 5 else None
os.makedirs(OUT, exist_ok=True)
BG = (15, 29, 19); BG2 = (23, 48, 29); OR = (255, 89, 37); DIM = (255, 217, 196); FAINT = (207, 106, 76); WHITE = (253, 246, 236)
BASE = "https://wearethellab.com/marketing/instagram/2026-11/"

def font(size, w="Regular"):
    f = ImageFont.truetype(FONT, size)
    try: f.set_variation_by_name(w)
    except Exception: pass
    return f

logo = Image.open(LOGO_SRC).convert("RGB").crop((88, 78, 202, 144))

def wrap(d, text, f, maxw):
    out = []
    for para in text.split("\n"):
        line = ""
        for w in para.split(" "):
            t = (line + " " + w).strip()
            if d.textlength(t, font=f) <= maxw: line = t
            else:
                if line: out.append(line)
                line = w
        out.append(line)
    return out

def chrome(im, d, W, H, tag, idx=None, total=None, foot_right="Building Leadership Infrastructure™"):
    m = 90 if W == 1080 and H == 1920 else 90
    top = 150 if H == 1920 else 80
    lg = logo.resize((int(114 * 1.25), int(66 * 1.25)))
    im.paste(lg, (m, top))
    d.text((m + lg.width + 26, top + lg.height // 2), "THE CO.LLAB™", font=font(30, "Medium"), fill=OR, anchor="lm")
    if idx: d.text((W - m, top + lg.height // 2), f"{idx:02d} / {total:02d}", font=font(28), fill=FAINT, anchor="rm")
    y = top + lg.height + 30
    d.line((m, y, W - m, y), fill=(40, 60, 44), width=2)
    d.text((m, y + 50), tag.upper(), font=font(26, "Medium"), fill=FAINT)
    fy = H - (260 if H == 1920 else 90)
    d.line((m, fy - 30, W - m, fy - 30), fill=(40, 60, 44), width=2)
    d.text((m, fy), "wearethellab.com", font=font(30, "Medium"), fill=OR)
    d.text((W - m, fy), foot_right, font=font(28), fill=FAINT, anchor="ra")
    return m

def card(W, H, tag, head, sub=None, idx=None, total=None, rows=None, cta=None, legal=None, big=False, foot_right=None):
    im = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(im)
    m = chrome(im, d, W, H, tag, idx, total, foot_right or ("Swipe ›" if idx == 1 else "Building Leadership Infrastructure™"))
    maxw = W - 2 * m
    hs = 104 if big else 84
    if H == 1920: hs = int(hs * 1.08)
    hf = font(hs, "Regular"); hb = font(hs, "SemiBold")
    lines = wrap(d, head, hf, maxw)
    while len(lines) > 6:
        hs -= 6; hf = font(hs); hb = font(hs, "SemiBold"); lines = wrap(d, head, hf, maxw)
    lh = int(hs * 1.12)
    block = len(lines) * lh + (40 + 3 * 52 if sub else 0) + (len(rows) * 92 if rows else 0) + (150 if cta else 0)
    y = max((H - block) // 2 - (40 if H == 1920 else 10), 360 if H == 1920 else 260)
    for i, ln in enumerate(lines):
        bold = i == len(lines) - 1 and big
        d.text((m, y), ln, font=hb if bold else hf, fill=OR)
        y += lh
    if sub:
        y += 30; sf = font(40 if H == 1920 else 36)
        for ln in wrap(d, sub, sf, maxw):
            d.text((m, y), ln, font=sf, fill=FAINT if H != 1920 else DIM); y += 54
    if rows:
        y += 30; rf = font(38 if H == 1920 else 34); rb = font(38 if H == 1920 else 34, "SemiBold")
        for l, r in rows:
            d.line((m, y, W - m, y), fill=(40, 60, 44), width=2)
            ll = wrap(d, l, rf, maxw - 260)
            for k, t in enumerate(ll): d.text((m, y + 20 + k * 46), t, font=rf, fill=DIM)
            d.text((W - m, y + 20), r, font=rb, fill=OR, anchor="ra")
            y += 30 + 46 * len(ll) + 10
    if cta:
        y += 50; cf = font(36, "Medium"); tw = d.textlength(cta, font=cf)
        d.rounded_rectangle((m, y, m + tw + 64, y + 76), radius=38, outline=OR, width=3)
        d.text((m + 32, y + 38), cta, font=cf, fill=WHITE, anchor="lm")
        y += 120
    if legal:
        lf = font(26); yy = H - (380 if H == 1920 else 215)
        for ln in wrap(d, legal, lf, maxw): d.text((m, yy), ln, font=lf, fill=FAINT); yy += 36
    return im

def music(path, secs, seed):
    sr = 44100; t = np.arange(int(sr * secs)) / sr
    rng = np.random.default_rng(seed)
    roots = [[110, 138.59, 164.81], [98, 123.47, 146.83], [87.31, 110, 130.81], [82.41, 103.83, 123.47]]
    sig = np.zeros_like(t); seg = secs / 4
    for k, ch in enumerate(roots[seed % 4:] + roots[:seed % 4]):
        env = np.clip(np.minimum((t - k * seg) / 0.6, (k * seg + seg + 0.6 - t) / 0.6), 0, 1)
        for f in ch:
            for det in (1, 1.003, 2.0):
                sig += env * np.sin(2 * np.pi * f * det * t + rng.random() * 6) * (0.5 if det == 2.0 else 1)
    pulse = (np.sin(2 * np.pi * 1.5 * t) > 0.98).astype(float)
    kick = np.convolve(pulse, np.exp(-np.arange(4000) / 600) * np.sin(2 * np.pi * 55 * np.arange(4000) / sr))[: len(t)]
    sig = sig / np.max(np.abs(sig)) * 0.32 + kick * 0.25
    fade = np.minimum(1, np.minimum(t / 0.8, (secs - t) / 1.2)); sig *= fade
    a = (np.clip(sig, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(a.tobytes())

def reel(rid, beats, seed):
    W, H, FPS = 1080, 1920, 30
    frames_dir = os.path.join(OUT, f"_{rid}"); os.makedirs(frames_dir, exist_ok=True)
    imgs = [card(W, H, b.get("tag", "Omnidirectional Enterprise™"), b["h"], b.get("s"), rows=b.get("rows"), cta=b.get("cta"), legal=b.get("legal"), big=b.get("big", False), foot_right="Follow @theco.llab_") for b in beats]
    durs = [b.get("d", 2.6) for b in beats]
    n = 0
    for i, im in enumerate(imgs):
        nf = int(durs[i] * FPS)
        for f in range(nf):
            a = min(1, f / 8)
            if i == 0 and f == 0: a = 1  # hook visible on frame one
            fr = Image.blend(imgs[i - 1] if i else im, im, a) if a < 1 else im
            fr.save(os.path.join(frames_dir, f"{n:05d}.jpg"), quality=88); n += 1
    secs = n / FPS
    wav = os.path.join(frames_dir, "a.wav"); music(wav, secs, seed)
    mp4 = os.path.join(OUT, f"{rid}.mp4")
    subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(frames_dir, "%05d.jpg"), "-i", wav,
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "high", "-crf", "21", "-r", str(FPS),
                    "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", mp4], check=True)
    imgs[0].save(os.path.join(OUT, f"{rid}_cover.jpg"), quality=90)
    for f in os.listdir(frames_dir): os.remove(os.path.join(frames_dir, f))
    os.rmdir(frames_dir)
    return round(secs, 1)

def carousel(cid, slides):
    names = []
    for i, s in enumerate(slides, 1):
        im = card(1080, 1350, s.get("tag", "Building Leadership Infrastructure™"), s["h"], s.get("s"), i, len(slides), rows=s.get("rows"), cta=s.get("cta"), legal=s.get("legal"), big=s.get("big", False),
                  foot_right=("Link in bio ›" if i == len(slides) else None))
        fn = f"{cid}_{i:02d}.jpg"; im.save(os.path.join(OUT, fn), quality=90); names.append(fn)
    return names

plan = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "plan.json"))) if len(sys.argv) <= 6 else json.load(open(sys.argv[6]))
res = {}
for item in plan:
    if ONLY and item["id"] != ONLY: continue
    if item["type"] == "REEL": res[item["id"]] = reel(item["id"], item["beats"], item["seed"])
    else: res[item["id"]] = carousel(item["id"], item["slides"])
print(json.dumps(res))
