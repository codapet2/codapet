import re,sys
SRC=sys.argv[1]
# Brand guide palette: Forest #587A7C, Mauve #7B506F, Slate #628AB0, Sage #9CB6A9, Rose #DBB2BD
def load(name, cmap):
    s=open(f'{SRC}/{name}.svg').read()
    s=re.sub(r'<\?xml[^>]*\?>','',s)
    vb=re.search(r'viewBox="([^"]+)"',s).group(1)
    body=re.sub(r'^\s*<svg[^>]*>','',s.strip()); body=re.sub(r'</svg>\s*$','',body)
    for k,v in cmap.items():
        body=re.sub(f'(fill|stroke)="{re.escape(k)}"', lambda m: f'{m.group(1)}="{v}"', body, flags=re.I)
    return vb, body

FILTERS='''
<filter id="paper" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="3"/>
  <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.40  0 0 0 0 0.35  0 0 0 0.09 0"/>
</filter>
<filter id="wash" x="-30%" y="-30%" width="160%" height="160%">
  <feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves="4" seed="SEED" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="120" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feGaussianBlur in="d" stdDeviation="3" result="b"/>
  <feMorphology in="b" operator="erode" radius="10" result="er"/>
  <feGaussianBlur in="er" stdDeviation="14" result="inner"/>
  <feComposite in="b" in2="inner" operator="out" result="rim"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="7" result="g"/>
  <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.7 1.2" result="ga"/>
  <feComposite in="b" in2="ga" operator="in" result="body"/>
  <feMerge><feMergeNode in="body"/><feMergeNode in="rim"/></feMerge>
</filter>
<filter id="paint" x="-10%" y="-10%" width="120%" height="120%">
  <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="4" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feGaussianBlur in="d" stdDeviation="0.8" result="b"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="3" seed="11" result="t"/>
  <feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.5 1.15" result="ta"/>
  <feComposite in="b" in2="ta" operator="in" result="tex"/>
  <feMorphology in="b" operator="erode" radius="2.5" result="er"/>
  <feComposite in="b" in2="er" operator="out" result="edge"/>
  <feColorMatrix in="edge" type="matrix" values="0.72 0 0 0 0  0 0.72 0 0 0  0 0 0.72 0 0  0 0 0 0.6 0" result="edgeDark"/>
  <feMerge><feMergeNode in="tex"/><feMergeNode in="edgeDark"/></feMerge>
</filter>
<filter id="bleed" x="-20%" y="-20%" width="140%" height="140%">
  <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="4" seed="21" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="110" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feGaussianBlur in="d" stdDeviation="16"/>
</filter>
'''

def scene(name, W, H, cmap, washes, fig_box, seed=5):
    vb, body = load(name, cmap)
    fx, fy, fw, fh = fig_box
    wash_svg=''.join(f'<g filter="url(#wash{i})" opacity="{o}" style="mix-blend-mode:multiply"><ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{c}"/></g>' for i,(cx,cy,rx,ry,c,o) in enumerate(washes))
    filters=FILTERS
    for i in range(len(washes)):
        filters+=FILTERS[FILTERS.index('<filter id="wash"'):FILTERS.index('<filter id="paint"')].replace('id="wash"',f'id="wash{i}"').replace('SEED',str(seed+i*7))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
<defs>{filters}
<mask id="edge"><rect width="{W}" height="{H}" fill="#000"/><g filter="url(#bleed)"><rect x="{W*0.07}" y="{H*0.08}" width="{W*0.86}" height="{H*0.84}" rx="{H*0.18}" fill="#fff"/></g></mask>
</defs>
<rect width="{W}" height="{H}" fill="#faf8f5"/>
<g mask="url(#edge)">
  <rect width="{W}" height="{H}" fill="#f6f1ea"/>
  {wash_svg}
  <g filter="url(#paint)">
    <svg x="{fx}" y="{fy}" width="{fw}" height="{fh}" viewBox="{vb}" preserveAspectRatio="xMidYMax meet">{body}</svg>
  </g>
  <rect width="{W}" height="{H}" filter="url(#paper)"/>
</g>
</svg>'''

base={'#090814':'#4f6670','#2f2e41':'#4f6670','#2e2e41':'#4f6670','#3f3d56':'#a9876a','#3f3c57':'#6d7f86',
      '#d6d6e3':'#e3dccf','#d6d7d8':'#d9e2e0','#e6e6e6':'#f3eee6','#e8e9ea':'#ffffff','#f2f2f2':'#efe9df',
      '#ed9da0':'#d99c97','#ffb8b8':'#eebaa8','#ffb6b6':'#eebaa8','#fdb4b4':'#eebaa8','#fff':'#fffdf9','#ffffff':'#fffdf9',
      'currentColor':'#7b8fb5'}
W1,H1=1560,1320
open('welcome.svg','w').write(scene('petting',W1,H1,{**base,'#090814':'#5d6f7a','currentColor':'#7a9cc0','#e6e6e6':'#f1e2cc','#fff':'#fbf3e6'},
  [(W1*0.47,H1*0.58,W1*0.36,H1*0.28,'#9CB6A9',0.42),(W1*0.80,H1*0.24,W1*0.14,H1*0.11,'#DBB2BD',0.5),(W1*0.22,H1*0.80,W1*0.14,H1*0.08,'#628AB0',0.25)],
  (W1*0.16,H1*0.16,W1*0.68,H1*0.70),seed=5))
W2,H2=1400,1040
open('lesson1.svg','w').write(scene('good-doggy',W2,H2,{**base,'#3f3d56':'#b08d6e','#2f2e41':'#587A7C','currentColor':'#7B506F'},
  [(W2*0.5,H2*0.60,W2*0.38,H2*0.27,'#DBB2BD',0.42),(W2*0.22,H2*0.26,W2*0.13,H2*0.11,'#9CB6A9',0.5),(W2*0.82,H2*0.78,W2*0.12,H2*0.07,'#628AB0',0.25)],
  (W2*0.14,H2*0.14,W2*0.72,H2*0.72),seed=13))
open('lesson2.svg','w').write(scene('doctors',W2,H2,{**base,'#2e2e41':'#587A7C','#3f3c57':'#7B506F','#d6d7d8':'#dfe7ea','currentColor':'#628AB0'},
  [(W2*0.5,H2*0.58,W2*0.38,H2*0.28,'#9CB6A9',0.42),(W2*0.82,H2*0.24,W2*0.12,H2*0.10,'#DBB2BD',0.5),(W2*0.18,H2*0.80,W2*0.12,H2*0.07,'#628AB0',0.25)],
  (W2*0.16,H2*0.12,W2*0.68,H2*0.76),seed=29))
