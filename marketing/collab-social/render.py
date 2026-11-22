
"""The Co.LLab(TM) post renderer.
carousel(slides, outdir) -> JPEG paths. A slide is a dict (kicker, headline, emph, body, hsize) or the string "FIG"
for the Omnidirectional Enterprise(TM) Metatron's Cube figure. reel(scenes, out) -> MP4. check(path) -> layout OK."""
import os, sys, math, itertools, subprocess, numpy as np
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "fonts", "Inter.ttf")
FONT_URL = "https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf"
BG=(0,0,0); WHITE=(244,244,244); EMPH=(150,150,150); BODY=(196,196,196); KICK=(168,168,168); FOOT=(222,222,222); SWIPE=(148,148,148)
X0, X1 = 97, 983

def _font(size, wght):
    if not os.path.exists(FONT):
        import urllib.request; os.makedirs(os.path.dirname(FONT), exist_ok=True); urllib.request.urlretrieve(FONT_URL, FONT)
    f = ImageFont.truetype(FONT, int(size))
    try: f.set_variation_by_axes([min(max(size,14),32), wght])
    except Exception: pass
    return f

def _wrap(d, text, font, width):
    lines=[]
    for para in str(text).split("\n"):
        cur=""
        for w in para.split():
            t=(cur+" "+w).strip()
            if d.textlength(t, font=font) <= width or not cur: cur=t
            else: lines.append(cur); cur=w
        lines.append(cur)
    return lines

def _frame(s, W, H, idx=None, total=None, swipe=False, scale=1.0):
    im=Image.new("RGB",(W,H),BG); d=ImageDraw.Draw(im); width=X1-X0
    hs=int(s.get("hsize", 74)*scale)
    fk=_font(int(29*scale),560); fh=_font(hs,640); fb=_font(int(34*scale),460); ff=_font(int(26*scale),500)
    blocks=[]
    if s.get("kicker"): blocks.append(("k",["——  "+s["kicker"].upper()],fk,KICK,int(29*scale),int(52*scale)))
    blocks.append(("h",_wrap(d,s.get("headline",""),fh,width),fh,WHITE,hs*1.32,0))
    if s.get("emph"): blocks.append(("e",_wrap(d,s["emph"],fh,width),fh,EMPH,hs*1.32,0))
    if s.get("body"): blocks.append(("b",_wrap(d,s["body"],fb,width),fb,BODY,int(34*scale)*1.48,int(40*scale)))
    tot=sum(len(L)*lh+gap for _,L,_,_,lh,gap in blocks)
    y=(H-tot)/2-(40 if H<1500 else 80)
    for kind,L,f,c,lh,gap in blocks:
        if kind=="b": y+=gap
        for line in L: d.text((X0,y),line,font=f,fill=c); y+=lh
        if kind=="k": y+=gap
    fy=H-185 if H<1500 else H-330
    d.text((X0,fy),"The Co.LLab™",font=ff,fill=FOOT)
    if idx is not None and total:
        t=f"{idx}/{total}"; d.text((X1-d.textlength(t,font=ff),fy),t,font=ff,fill=FOOT)
    if swipe:
        t="Swipe ›"; d.text((X1-d.textlength(t,font=ff),92 if H<1500 else 200),t,font=ff,fill=SWIPE)
    return im

# Omnidirectional Enterprise(TM) as Metatron's Cube: exact geometry.
# 13 equal circles (center, ring at 2r, ring at 4r on the same six axes, neighbors tangent); 78 lines joining every pair of centers.
# Inner ring = independent (held inside an enterprise); outer ring = external, dependent participants.
FIG_ROLE={"core":("core",["The Co.LLab™","Leadership","Infrastructure™"]),
 "i90":("in",["People"]),"i30":("in",["Knowledge + IP"]),"i330":("in",["Technology"]),
 "i270":("in",["Products &","Services"]),"i210":("in",["Capital"]),"i150":("in",["Creators"]),
 "o90":("out",["Enterprises"]),"o30":("out",["Partners"]),"o330":("out",["Nonprofits"]),
 "o270":("out",["Communities"]),"o210":("out",["Members"]),"o150":("out",["Founders"])}

def figure(idx=None, total=None, kicker="Omnidirectional Enterprise™", W=1080, H=1350):
    SS=2; S=lambda v:v*SS
    im=Image.new("RGB",(W*SS,H*SS),BG); d=ImageDraw.Draw(im)
    r=84; cx=W/2; cy=612 if H<1500 else 900
    def pt(dist,deg):
        t=math.radians(deg); return (cx+dist*math.cos(t), cy-dist*math.sin(t))
    C={"core":pt(0,0)}
    for k in range(6):
        a=(90+60*k)%360; C[f"i{a}"]=pt(2*r,a); C[f"o{a}"]=pt(4*r,a)
    for p,q in itertools.combinations(C.values(),2):
        d.line([(S(p[0]),S(p[1])),(S(q[0]),S(q[1]))],fill=(185,185,185),width=round(S(1.9)))
    for x,y in C.values():
        d.ellipse([S(x-r),S(y-r),S(x+r),S(y+r)],outline=(235,235,235),width=round(S(2.0)))
    for key,(x,y) in C.items():
        role,lines=FIG_ROLE[key]
        f=_font(S(16),700 if role!="out" else 520); col=(255,255,255) if role!="out" else (222,222,222)
        lh=S(21); top=S(y)-lh*len(lines)/2-S(2)
        for i,t in enumerate(lines):
            w=d.textlength(t,font=f)
            d.text((S(x)-w/2,top+i*lh),t,font=f,fill=col,stroke_width=S(5),stroke_fill=BG)
    fk=_font(S(29),560); ff=_font(S(26),500); top=92 if H<1500 else 200
    d.text((S(X0),S(top)),"——  "+kicker.upper(),font=fk,fill=KICK)
    if idx is not None and total and idx<total:
        t="Swipe ›"; d.text((S(X1)-d.textlength(t,font=ff),S(top)),t,font=ff,fill=SWIPE)
    by=cy+460
    d.text((S(X0),S(by)),"Multiple pathways. One ecosystem.",font=_font(S(34),460),fill=(225,225,225))
    d.text((S(X0),S(by+46)),"One source. Currents in every direction.",font=_font(S(27),420),fill=EMPH)
    fy=H-185 if H<1500 else H-330
    d.text((S(X0),S(fy)),"The Co.LLab™",font=ff,fill=FOOT)
    if idx is not None and total:
        t=f"{idx}/{total}"; d.text((S(X1)-d.textlength(t,font=ff),S(fy)),t,font=ff,fill=FOOT)
    return im.resize((W,H),Image.LANCZOS)

def carousel(slides, outdir):
    os.makedirs(outdir, exist_ok=True); n=len(slides); paths=[]
    for i,s in enumerate(slides,1):
        im=figure(i,n) if s=="FIG" else _frame(s,1080,1350,i,n,swipe=(i<n))
        p=os.path.join(outdir,f"slide_{i:02d}.jpg"); im.save(p,"JPEG",quality=95); paths.append(p)
    return paths

def _ffmpeg():
    try: import imageio_ffmpeg
    except ImportError:
        subprocess.run([sys.executable,"-m","pip","install","-q","imageio-ffmpeg"],check=True); import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()

def reel(scenes, out, fps=30, fade=0.4):
    """Scenes hold for sec (default 3); a scene may be "FIG". Writes <out>_sceneK.png for checks."""
    ff=_ffmpeg(); W,H=1080,1920
    frames=[np.asarray(figure(W=W,H=H) if s=="FIG" else _frame(s,W,H,None,None,scale=1.12)) for s in scenes]
    base=os.path.splitext(out)[0]
    for i,f in enumerate(frames,1): Image.fromarray(f).save(f"{base}_scene{i}.png")
    durs=[3.0 if s=="FIG" else float(s.get("sec",3)) for s in scenes]
    cmd=[ff,"-y","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(fps),"-i","-",
         "-f","lavfi","-i","anullsrc=channel_layout=stereo:sample_rate=44100","-shortest",
         "-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p","-c:a","aac","-b:a","128k","-movflags","+faststart",out]
    p=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.DEVNULL)
    black=np.zeros_like(frames[0]); nf=int(fade*fps)
    for i,(f,dur) in enumerate(zip(frames,durs)):
        prev=frames[i-1] if i else black
        for k in range(int(round(dur*fps))):
            p.stdin.write(((prev*(1-(k+1)/nf)+f*((k+1)/nf)).astype(np.uint8) if k<nf else f).tobytes())
    p.stdin.close(); p.wait()
    if p.returncode: raise RuntimeError("ffmpeg failed")
    return out

def check(path, x0=90, x1=990, margin=140, thr=60):
    a=np.asarray(Image.open(path).convert("L")); H=a.shape[0]; ys,xs=np.where(a>thr)
    return True if not len(xs) else bool(xs.min()>=x0 and xs.max()<=x1 and ys.max()<H-margin)
