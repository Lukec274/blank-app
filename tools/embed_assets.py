#!/usr/bin/env python3
"""Inline the baked sprite sheets into game/index.html.

The game ships as a single self-contained file, so the PNGs produced by
tools/bake_units.js are base64-embedded between the ASSETS markers. Re-running
replaces the block rather than appending, so the file does not grow.
"""
import base64, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'game', 'assets')
HTML = os.path.join(ROOT, 'game', 'index.html')

man = json.load(open(os.path.join(ASSETS, 'units.json')))
png = {}
for kind in man:
    p = os.path.join(ASSETS, kind + '.png')
    if not os.path.exists(p):
        print('missing', p); sys.exit(1)
    png[kind] = 'data:image/png;base64,' + base64.b64encode(open(p, 'rb').read()).decode()

props, prop_png = {}, {}
props_file = os.path.join(ASSETS, 'props.json')
if os.path.exists(props_file):
    props = json.load(open(props_file))
    for name in props:
        p = os.path.join(ASSETS, name + '.png')
        prop_png[name] = 'data:image/png;base64,' + base64.b64encode(open(p, 'rb').read()).decode()

payload = json.dumps({'units': man, 'png': png, 'props': props, 'propPng': prop_png},
                     separators=(',', ':'))
assert '</script' not in payload
block = '<!--ASSETS--><script>window.SHEET_DATA=' + payload + ';</script><!--/ASSETS-->'

html = open(HTML, encoding='utf-8').read()
if '<!--ASSETS-->' not in html:
    print('no ASSETS marker in', HTML); sys.exit(1)
html = re.sub(r'<!--ASSETS-->.*?<!--/ASSETS-->', lambda m: block, html, flags=re.S)
open(HTML, 'w', encoding='utf-8').write(html)
print('embedded %d sheets + %d props, %.1f MB page' % (len(png), len(prop_png), len(html) / 1e6))
