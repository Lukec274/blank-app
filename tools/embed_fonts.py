#!/usr/bin/env python3
"""Inline the webfonts so the game is genuinely one self-contained file.

The page used to pull Cinzel and Alegreya Sans from fonts.googleapis.com. That
is a render-blocking request to a third party that fails outright offline -- on
a phone, the case the whole game is built for. Fetch the faces once and base64
them into the page instead.

Only the `latin` subset is taken. The UI is English, and the other six subsets
Google serves are six times the bytes for glyphs the game never draws. The HUD
symbols the fonts do not cover anyway are unaffected: they fall through the
existing fallback stacks in --f-disp / --f-ui exactly as before.

Needs network. Re-run to change weights or refresh a font version.
"""
import base64, os, re, sys, urllib.request

CSS_URL = ("https://fonts.googleapis.com/css2"
           "?family=Cinzel:wght@600;700"
           "&family=Alegreya+Sans:wght@400;500;700&display=swap")
# Google serves woff2 only to UAs it believes support it.
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
PAGE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'game', 'index.html')
OPEN, CLOSE = '<!--FONTS-->', '<!--/FONTS-->'


def get(url):
    return urllib.request.urlopen(
        urllib.request.Request(url, headers={'User-Agent': UA}), timeout=60).read()


def main():
    css = get(CSS_URL).decode()
    faces = re.findall(r'/\* latin \*/\s*(@font-face \{.*?\})', css, re.S)
    if not faces:
        sys.exit('no latin @font-face blocks in the stylesheet')

    out, raw = [], 0
    for block in faces:
        fam = re.search(r"font-family: '([^']+)'", block).group(1)
        weight = re.search(r'font-weight: (\d+)', block).group(1)
        data = get(re.search(r'url\((https://[^)]+)\)', block).group(1))
        raw += len(data)
        b64 = base64.b64encode(data).decode()
        out.append(f"@font-face{{font-family:'{fam}';font-style:normal;"
                   f"font-weight:{weight};font-display:swap;"
                   f"src:url(data:font/woff2;base64,{b64}) format('woff2');}}")
        print(f"  {fam} {weight}  {len(data)//1024}KB")

    payload = OPEN + '\n<style>\n' + '\n'.join(out) + '\n</style>\n' + CLOSE
    assert '</style' not in payload[len(OPEN):-len(CLOSE)].replace('\n</style>\n', '', 1)

    page = open(PAGE, encoding='utf-8').read()
    if OPEN in page:
        page = re.sub(re.escape(OPEN) + '.*?' + re.escape(CLOSE), lambda m: payload, page, flags=re.S)
    else:
        # first run: replace the remote <link>s the markers are taking over from
        page, n = re.subn(
            r'[ \t]*<link rel="preconnect" href="https://fonts\.googleapis\.com">\n'
            r'[ \t]*<link rel="preconnect" href="https://fonts\.gstatic\.com" crossorigin>\n'
            r'[ \t]*<link rel="stylesheet" href="https://fonts\.googleapis\.com[^"]*">\n',
            lambda m: payload + '\n', page)
        if n != 1:
            sys.exit(f'expected 1 remote font block to replace, found {n}')
    open(PAGE, 'w', encoding='utf-8').write(page)
    print(f"embedded {len(faces)} faces, {raw//1024}KB woff2, page now "
          f"{os.path.getsize(PAGE)//1024}KB")


if __name__ == '__main__':
    main()
