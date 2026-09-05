#!/usr/bin/env python3
"""Posterise the baked sprite sheets before embedding.

The renderer antialiases against a transparent background, which sprays a wide
spread of near-identical colours across every flat-shaded surface. That extra
precision is invisible at 46 px on screen but it is pure entropy to the PNG
encoder -- it roughly doubled the page. Rounding to 5 bits per channel and
flattening fully-transparent pixels halves the asset payload with no visible
change, which matters when the whole game ships as one inlined HTML file.

Run after tools/bake.js and before tools/embed_assets.py. Safe to re-run.
"""
import os, glob

import zlib,struct,sys
def readpng(p):
    d=open(p,'rb').read(); i=8; idat=b''; w=h=0
    while i<len(d):
        ln=struct.unpack('>I',d[i:i+4])[0]; typ=d[i+4:i+8]; dat=d[i+8:i+8+ln]
        if typ==b'IHDR': w,h=struct.unpack('>II',dat[:8])
        if typ==b'IDAT': idat+=dat
        i+=12+ln
    raw=zlib.decompress(idat); px=bytearray(w*h*4); st=w*4; pr=bytearray(st); o=0
    for y in range(h):
        f=raw[o]; o+=1; line=bytearray(raw[o:o+st]); o+=st
        for x in range(st):
            a=line[x-4] if x>=4 else 0; b=pr[x]; c=pr[x-4] if x>=4 else 0
            if f==1: line[x]=(line[x]+a)&255
            elif f==2: line[x]=(line[x]+b)&255
            elif f==3: line[x]=(line[x]+(a+b)//2)&255
            elif f==4:
                pp=a+b-c; pa,pb,pc=abs(pp-a),abs(pp-b),abs(pp-c)
                pr_=a if(pa<=pb and pa<=pc) else (b if pb<=pc else c)
                line[x]=(line[x]+pr_)&255
        px[y*st:(y+1)*st]=line; pr=line
    return w,h,px
def writepng(p,w,h,px):
    raw=b''.join(b'\x00'+bytes(px[y*w*4:(y+1)*w*4]) for y in range(h))
    def ch(t,d):
        return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    open(p,'wb').write(b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+ch(b'IDAT',zlib.compress(raw,6))+ch(b'IEND',b''))


def main():
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'game', 'assets')
    before = after = 0
    for p in sorted(glob.glob(os.path.join(root, '*.png'))):
        w, h, px = readpng(p)
        before += os.path.getsize(p)
        for i in range(0, len(px), 4):
            if px[i+3] < 8:                      # fully transparent: flatten so it packs
                px[i] = px[i+1] = px[i+2] = px[i+3] = 0
            else:
                px[i]   = (px[i]   >> 3) << 3 | 4
                px[i+1] = (px[i+1] >> 3) << 3 | 4
                px[i+2] = (px[i+2] >> 3) << 3 | 4
                px[i+3] = 255 if px[i+3] > 200 else (px[i+3] >> 4) << 4
        writepng(p, w, h, px)
        after += os.path.getsize(p)
    print(f"sheets {before//1024}KB -> {after//1024}KB")

if __name__ == '__main__':
    main()