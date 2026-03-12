#!/usr/bin/env python3
# Fichier : scripts/generate-models.py
"""
Générateur de modèles 3D GLB pour MURO by L&Y
Exécuter depuis la racine du projet :
  python3 scripts/generate-models.py

Génère les .glb dans public/models/ sans dépendances externes.
Python 3.8+ requis. Aucun pip install nécessaire.
"""

import struct, json, math
from pathlib import Path


# ═══════════════════════════════════════════════════════
# UTILITAIRES GLB / glTF 2.0
# ═══════════════════════════════════════════════════════

def pack_float32(v): return struct.pack(f'{len(v)}f', *v)
def pack_uint16(v):  return struct.pack(f'{len(v)}H', *v)
def align4(d: bytes) -> bytes:
    r = len(d) % 4; return d + b'\x00' * (4 - r if r else 0)

def build_glb(gltf: dict, bin_data: bytes) -> bytes:
    jb = align4(json.dumps(gltf, separators=(',',':')).encode())
    bb = align4(bin_data) if bin_data else b''
    cj = struct.pack('<II', len(jb), 0x4E4F534A) + jb
    cb = (struct.pack('<II', len(bb), 0x004E4942) + bb) if bb else b''
    total = 12 + len(cj) + len(cb)
    return struct.pack('<III', 0x46546C67, 2, total) + cj + cb


def box_mesh(w, h, d):
    hw, hh, hd = w/2, h/2, d/2
    verts, norms, indices = [], [], []
    faces = [
        ((0,0,1),  [(-hw,-hh,hd),(hw,-hh,hd),(hw,hh,hd),(-hw,hh,hd)]),
        ((0,0,-1), [(hw,-hh,-hd),(-hw,-hh,-hd),(-hw,hh,-hd),(hw,hh,-hd)]),
        ((-1,0,0), [(-hw,-hh,-hd),(-hw,-hh,hd),(-hw,hh,hd),(-hw,hh,-hd)]),
        ((1,0,0),  [(hw,-hh,hd),(hw,-hh,-hd),(hw,hh,-hd),(hw,hh,hd)]),
        ((0,1,0),  [(-hw,hh,hd),(hw,hh,hd),(hw,hh,-hd),(-hw,hh,-hd)]),
        ((0,-1,0), [(-hw,-hh,-hd),(hw,-hh,-hd),(hw,-hh,hd),(-hw,-hh,hd)]),
    ]
    for fi, (n, corners) in enumerate(faces):
        base = fi * 4
        for c in corners: verts.extend(c); norms.extend(n)
        indices += [base,base+1,base+2, base,base+2,base+3]
    return (pack_float32(verts), pack_float32(norms), pack_uint16(indices),
            [-hw,-hh,-hd], [hw,hh,hd], len(indices))


def cylinder_mesh(r, h, segs=12):
    step = 2*math.pi/segs
    verts, norms, indices = [], [], []
    for i in range(segs):
        a0, a1 = i*step, (i+1)*step
        for a in (a0, a1):
            x, z = math.cos(a)*r, math.sin(a)*r
            verts += [x,-h/2,z, x,h/2,z]; norms += [x/r,0,z/r]*2
        b = len(verts)//3 - 4
        indices += [b,b+1,b+2, b+1,b+3,b+2]
    tc = len(verts)//3; verts += [0,h/2,0]; norms += [0,1,0]
    bc = tc+1;          verts += [0,-h/2,0]; norms += [0,-1,0]
    for i in range(segs):
        a = i*step
        verts += [math.cos(a)*r,h/2,math.sin(a)*r]; norms += [0,1,0]
        verts += [math.cos(a)*r,-h/2,math.sin(a)*r]; norms += [0,-1,0]
        vi = tc+2+i*2; nx = tc+2+((i+1)%segs)*2
        indices += [tc,vi,nx]; indices += [bc,nx+1,vi+1]
    idx_safe = [min(x,65535) for x in indices]
    return (pack_float32(verts), pack_float32(norms), pack_uint16(idx_safe),
            [-r,-h/2,-r], [r,h/2,r], len(idx_safe))


class GLTFBuilder:
    def __init__(self):
        self.buffers=[]; self.views=[]; self.accessors=[]
        self.meshes=[]; self.nodes=[]; self.materials=[]
        self._off=0

    def mat(self, name, r,g,b,a=1.0, m=0.0, rough=0.7):
        idx=len(self.materials)
        self.materials.append({"name":name,"pbrMetallicRoughness":
            {"baseColorFactor":[r,g,b,a],"metallicFactor":m,"roughnessFactor":rough},
            "doubleSided":False}); return idx

    def _buf(self, data, target):
        vi=len(self.views)
        self.views.append({"buffer":0,"byteOffset":self._off,
                           "byteLength":len(data),"target":target})
        self.buffers.append(data); self._off+=len(data); return vi

    def mesh(self, pos_b,norm_b,idx_b,min_p,max_p,n_idx,mat,name="m"):
        pv=self._buf(pos_b,34962); nv=self._buf(norm_b,34962); iv=self._buf(idx_b,34963)
        nv2=len(pos_b)//12
        ai=len(self.accessors)
        self.accessors+=[
            {"bufferView":pv,"componentType":5126,"count":nv2,"type":"VEC3","min":min_p,"max":max_p},
            {"bufferView":nv,"componentType":5126,"count":nv2,"type":"VEC3"},
            {"bufferView":iv,"componentType":5123,"count":n_idx,"type":"SCALAR"},
        ]
        mi=len(self.meshes)
        self.meshes.append({"name":name,"primitives":[
            {"attributes":{"POSITION":ai,"NORMAL":ai+1},"indices":ai+2,"material":mat,"mode":4}]})
        return mi

    def node(self, mi, name, t=(0,0,0), s=(1,1,1)):
        self.nodes.append({"name":name,"mesh":mi,"translation":list(t),"scale":list(s)})

    def build(self):
        bd=b''.join(self.buffers)
        g={"asset":{"version":"2.0","generator":"MURO Scripts"},"scene":0,
           "scenes":[{"nodes":list(range(len(self.nodes)))}],
           "nodes":self.nodes,"meshes":self.meshes,"materials":self.materials,
           "accessors":self.accessors,"bufferViews":self.views,
           "buffers":[{"byteLength":len(bd)}]}
        return build_glb(g, bd)


# ═══════════════════════════════════════════════════════
# GÉNÉRATEURS PRODUITS
# ═══════════════════════════════════════════════════════

def tv_stand(W, H, D):
    b=GLTFBuilder()
    mb=b.mat("Corps MDF",0.18,0.14,0.10,rough=0.85)
    ml=b.mat("Métal Noir",0.06,0.06,0.06,m=0.9,rough=0.2)
    mled=b.mat("LED Or",0.95,0.80,0.20,rough=0.3)
    bh=H-0.06
    m0=b.mesh(*box_mesh(W,bh,D),mb,"corps"); b.node(m0,"Corps",t=(0,0.06+bh/2,0))
    m1=b.mesh(*cylinder_mesh(0.02,0.06),ml,"pied")
    for tx,tz in [(-W/2+.06,-D/2+.06),(W/2-.06,-D/2+.06),(-W/2+.06,D/2-.06),(W/2-.06,D/2-.06)]:
        b.node(m1,f"P{tx:.1f}",t=(tx,.03,tz))
    m2=b.mesh(*box_mesh(W*.9,.015,.01),mled,"led"); b.node(m2,"LED",t=(0,.07,D/2+.005))
    return b.build()

def tv_floating():
    b=GLTFBuilder()
    mb=b.mat("MDF Blanc",0.95,0.93,0.88,rough=0.6)
    mm=b.mat("Acier",0.50,0.50,0.52,m=0.85,rough=0.25)
    ml=b.mat("LED",1.0,1.0,0.95,rough=0.3)
    m0=b.mesh(*box_mesh(1.5,.30,.25),mb,"corps"); b.node(m0,"Corps")
    m1=b.mesh(*box_mesh(.015,.26,.23),mb,"sep")
    b.node(m1,"S1",t=(-.25,0,0)); b.node(m1,"S2",t=(.25,0,0))
    m2=b.mesh(*box_mesh(.08,.20,.04),mm,"supp")
    b.node(m2,"SL",t=(-.45,0,-.12)); b.node(m2,"SR",t=(.45,0,-.12))
    m3=b.mesh(*box_mesh(1.40,.008,.008),ml,"led"); b.node(m3,"LED",t=(0,-.156,.12))
    return b.build()

def bookcase():
    b=GLTFBuilder()
    mw=b.mat("Chêne",0.55,0.38,0.22,rough=0.75)
    mb=b.mat("Fond",0.20,0.16,0.12,rough=0.9)
    ml=b.mat("LED",0.95,0.75,0.25,rough=0.4)
    W,H,D,t=2.0,2.0,0.35,0.022
    m0=b.mesh(*box_mesh(W,H,.012),mb,"dos"); b.node(m0,"Dos",t=(0,H/2,-D/2+.006))
    mc=b.mesh(*box_mesh(t,H,D),mw,"cote")
    b.node(mc,"CG",t=(-W/2+t/2,H/2,0)); b.node(mc,"CD",t=(W/2-t/2,H/2,0))
    ms=b.mesh(*box_mesh(W-2*t,t,D),mw,"shelf")
    for i,y in enumerate([0,.40,.80,1.22,1.65,H]): b.node(ms,f"T{i}",t=(0,y,0))
    md=b.mesh(*box_mesh(t,1.60,D),mw,"div")
    b.node(md,"D1",t=(-.50,.82,0)); b.node(md,"D2",t=(.50,.82,0))
    mled=b.mesh(*box_mesh(W*.85,.010,.010),ml,"led")
    b.node(mled,"LL",t=(0,1.205,D/2-.02)); b.node(mled,"LH",t=(0,1.635,D/2-.02))
    return b.build()

def marble_panel():
    b=GLTFBuilder()
    mm=b.mat("Marbre Blanc",0.93,0.91,0.89,m=0.05,rough=0.08)
    mj=b.mat("Joint",0.85,0.84,0.83,rough=0.6)
    m0=b.mesh(*box_mesh(.60,.003,.60),mm,"panel"); b.node(m0,"Panel")
    mh=b.mesh(*box_mesh(.60,.003,.005),mj,"jh")
    b.node(mh,"JHT",t=(0,.003,.3025)); b.node(mh,"JHB",t=(0,.003,-.3025))
    mv=b.mesh(*box_mesh(.005,.003,.60),mj,"jv")
    b.node(mv,"JVL",t=(.3025,.003,0)); b.node(mv,"JVR",t=(-.3025,.003,0))
    return b.build()

def sofa():
    b=GLTFBuilder()
    mv=b.mat("Velours Beige",0.82,0.72,0.55,rough=0.90)
    mc=b.mat("Coussin",0.88,0.78,0.62,rough=0.92)
    ml=b.mat("Pied Chêne",0.45,0.30,0.18,rough=0.70)
    mp=b.mat("Passepoil",0.75,0.58,0.30,rough=0.50)
    W,H,D=2.20,0.85,0.90
    m0=b.mesh(*box_mesh(W,.22,D),mv,"base"); b.node(m0,"Base",t=(0,.22,0))
    m1=b.mesh(*box_mesh(W,.50,.12),mv,"dos"); b.node(m1,"Dos",t=(0,.47,-D/2+.06))
    ms=b.mesh(*box_mesh(.68,.15,.65),mc,"seat")
    for tx in (-.73,0,.73): b.node(ms,f"SA{tx}",t=(tx,.36,.10))
    msc=b.mesh(*box_mesh(.65,.42,.16),mc,"sc")
    for tx in (-.73,0,.73): b.node(msc,f"SC{tx}",t=(tx,.50,-D/2+.14))
    ma=b.mesh(*box_mesh(.14,.55,D*.85),mv,"arm")
    b.node(ma,"BG",t=(-W/2+.07,.275,0)); b.node(ma,"BD",t=(W/2-.07,.275,0))
    mleg=b.mesh(*cylinder_mesh(.025,.14),ml,"leg")
    for tx in (-W/2+.10,0,W/2-.10):
        b.node(mleg,f"LF{tx}",t=(tx,.07,D/2-.08))
        b.node(mleg,f"LB{tx}",t=(tx,.07,-D/2+.08))
    mpip=b.mesh(*box_mesh(W*.95,.010,.010),mp,"pip")
    b.node(mpip,"PA",t=(0,.34,.43)); b.node(mpip,"PD",t=(0,.72,-D/2+.20))
    return b.build()

def coffee_table():
    b=GLTFBuilder()
    mg=b.mat("Verre",0.80,0.90,0.95,a=0.6,m=0.1,rough=0.05)
    mm=b.mat("Métal Noir",0.08,0.08,0.09,m=0.9,rough=0.30)
    W,H,D=1.20,0.45,0.60
    m0=b.mesh(*box_mesh(W,.012,D),mg,"top"); b.node(m0,"Plateau",t=(0,H,0))
    mfl=b.mesh(*box_mesh(W-.04,.025,.025),mm,"fl")
    b.node(mfl,"FF",t=(0,H-.015,D/2-.015)); b.node(mfl,"FB",t=(0,H-.015,-D/2+.015))
    mfc=b.mesh(*box_mesh(.025,.025,D),mm,"fc")
    b.node(mfc,"FL",t=(-W/2+.02,H-.015,0)); b.node(mfc,"FR",t=(W/2-.02,H-.015,0))
    mlv=b.mesh(*box_mesh(.028,H-.015,.028),mm,"pv")
    mld=b.mesh(*box_mesh(.022,(H-.015)*.55,.022),mm,"pd")
    for sx,sz in ((-1,-1),(-1,1),(1,-1),(1,1)):
        tx,tz=sx*(W/2-.06),sz*(D/2-.05)
        b.node(mlv,f"PV{sx}{sz}",t=(tx,(H-.015)/2,tz))
        b.node(mld,f"PD{sx}{sz}",t=(tx*.55,(H-.015)*.30,tz*.55))
    return b.build()

def panel_3d():
    b=GLTFBuilder()
    mw=b.mat("MDF Blanc",0.96,0.95,0.92,rough=0.35)
    md=b.mat("MDF Ombre",0.80,0.79,0.76,rough=0.40)
    m0=b.mesh(*box_mesh(.60,.018,.60),mw,"base"); b.node(m0,"Base")
    for row in range(4):
        for col in range(4):
            tx=-0.22+col*0.145; tz=-0.22+row*0.145
            mp=b.mesh(*box_mesh(.13,.025,.13),mw,f"p{row}{col}")
            b.node(mp,f"P{row}{col}",t=(tx,.031,tz))
    return b.build()


# ═══════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════
if __name__ == "__main__":
    out = Path("public/models")
    out.mkdir(parents=True, exist_ok=True)

    models = [
        ("tv-stand-120.glb",  lambda: tv_stand(1.20, 0.45, 0.50)),
        ("tv-stand-180.glb",  lambda: tv_stand(1.80, 0.55, 0.50)),
        ("tv-floating.glb",   tv_floating),
        ("bookcase.glb",      bookcase),
        ("marble-panel.glb",  marble_panel),
        ("sofa.glb",          sofa),
        ("coffee-table.glb",  coffee_table),
        ("panel-3d.glb",      panel_3d),
    ]

    print("🏠 MURO by L&Y — Génération modèles 3D GLB")
    print("═" * 44)

    total_kb = 0
    for filename, fn in models:
        glb = fn()
        (out / filename).write_bytes(glb)
        kb = len(glb) / 1024
        total_kb += kb
        print(f"  ✅ {filename:30s}  {kb:5.1f} KB")

    print(f"\n  {len(models)} modèles · {total_kb:.0f} KB total")
    print(f"  → Dossier : {out.resolve()}")
    print("\n  Prochaine étape :")
    print("  git add public/models/ && git commit -m 'feat: modèles 3D GLB MURO'")
