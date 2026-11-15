# Outlines horizontal "NWA Next" wordmark variants from Avenir Next to SVG paths.
# HarfBuzz (hb-shape) shapes each word with the font's own kerning; fontTools draws the glyphs.
# Usage: python build-logo.py out.json   (needs fonttools; hb-shape from Homebrew)
# Writes every variant as {id, label, viewBox, words: [{d, role}]}. The chosen one is pasted into
# components/Wordmark.tsx, so the site never depends on this script or the font at runtime.
import json
import subprocess
import sys

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTCollection

FONT = '/System/Library/Fonts/Avenir Next.ttc'
FACES = {'bold': 0, 'demi': 2, 'medium': 5, 'regular': 7, 'heavy': 8, 'ultralight': 10}
COLL = TTCollection(FONT)
CAP = 708  # cap height, units per em 1000


def shape(text, face):
    out = subprocess.run(
        ['hb-shape', f'--face-index={FACES[face]}', '--output-format=json', '--no-glyph-names', FONT, text],
        capture_output=True, text=True, check=True,
    ).stdout
    return json.loads(out)


def word(text, face, x0, track=0):
    """Draw one word starting at x0 on the baseline. Returns (path d, ink bounds, pen x after)."""
    font = COLL.fonts[FACES[face]]
    gs = font.getGlyphSet()
    order = font.getGlyphOrder()
    pen = SVGPathPen(gs)
    bounds = BoundsPen(gs)
    x = x0
    glyphs = shape(text, face)
    for i, g in enumerate(glyphs):
        name = order[g['g']]
        # Flip y (font units go up, SVG goes down) and place the glyph.
        t = (1, 0, 0, -1, x + g['dx'], -g['dy'])
        gs[name].draw(TransformPen(pen, t))
        gs[name].draw(TransformPen(bounds, t))
        x += g['ax'] + (track if i < len(glyphs) - 1 else 0)
    return pen.getCommands(), bounds.bounds, x


def lockup(vid, label, parts, gap):
    """parts: [(text, face, role, track)]. gap: ink-to-ink space between words, in font units."""
    words = []
    x = 0
    lo = [1e9, 1e9, -1e9, -1e9]
    prev_right = None
    for text, face, role, track in parts:
        # Measure first, then shift so the ink gap is exact.
        _, b, _ = word(text, face, 0, track)
        start = 0 if prev_right is None else prev_right + gap - b[0]
        d, b, _ = word(text, face, start, track)
        words.append({'d': d, 'role': role})
        prev_right = b[2]
        lo = [min(lo[0], b[0]), min(lo[1], b[1]), max(lo[2], b[2]), max(lo[3], b[3])]
    # Ink-tight: from the cap line to the lowest overshoot (round letters dip just under the baseline).
    vb = [round(lo[0], 1), round(lo[1], 1), round(lo[2] - lo[0], 1), round(lo[3] - lo[1], 1)]
    return {'id': vid, 'label': label, 'viewBox': ' '.join(str(v) for v in vb), 'words': words, 'ink': [round(v, 1) for v in lo]}


VARIANTS = [
    lockup('v1', '1. NWA Medium + NEXT Bold, caps', [('NWA', 'medium', 'a', 24), ('NEXT', 'bold', 'b', 24)], 236),
    lockup('v2', '2. NWA Regular + Next Demi Bold (shipped)', [('NWA', 'regular', 'a', 16), ('Next', 'demi', 'b', 0)], 222),
    lockup('v3', '3. NWA Medium + NEXT Bold, sandstone dot', [('NWA', 'medium', 'a', 24), ('NEXT', 'bold', 'b', 24)], 236),
    lockup('v4', '4. NWA Ultra Light + NEXT Demi Bold, caps', [('NWA', 'ultralight', 'a', 30), ('NEXT', 'demi', 'b', 24)], 230),
    lockup('v5', '5. NWA Bold + Next Regular', [('NWA', 'bold', 'a', 10), ('Next', 'regular', 'b', 0)], 210),
    lockup('v6', '6. NWA Demi Bold in sandstone + Next Medium', [('NWA', 'demi', 'a', 16), ('Next', 'medium', 'b', 0)], 214),
]



def add_dot(v, r=60, space=46):
    # A sandstone full stop after the last word, sitting on the baseline (the accent from the old lockup).
    x0, _, x1, _ = v['ink']
    cx = x1 + space + r
    v['dot'] = {'cx': round(cx, 1), 'cy': -r, 'r': r}
    vb = v['viewBox'].split()
    v['viewBox'] = ' '.join([vb[0], vb[1], str(round(cx + r - x0, 1)), vb[3]])


add_dot(VARIANTS[2])

SHIPPED = 'v2'

TSX = '''// The NWA Next wordmark, horizontal: "NWA" in Avenir Next Regular, "Next" in Avenir Next Demi Bold,
// kerned by the font (HarfBuzz) and outlined to paths, so it renders the same on every device.
// Built by scripts/build-logo.py (option 2 in qa/logo-options-v4.png). Ink uses currentColor.
type Props = { className?: string; title?: string };

const NWA = '%s';
const NEXT = '%s';

export default function Wordmark({ className, title = 'NWA Next' }: Props) {
  return (
    <svg className={`wordmark${className ? ` ${className}` : ''}`} viewBox="%s" role="img" aria-label={title}>
      <path d={NWA} fill="currentColor" />
      <path d={NEXT} fill="currentColor" />
    </svg>
  );
}
'''

if __name__ == '__main__':
    json.dump(VARIANTS, open(sys.argv[1], 'w'), indent=1)
    if len(sys.argv) > 2:
        v = next(x for x in VARIANTS if x['id'] == SHIPPED)
        open(sys.argv[2], 'w').write(TSX % (v['words'][0]['d'], v['words'][1]['d'], v['viewBox']))
    for v in VARIANTS:
        print(v['id'], v['label'], 'viewBox', v['viewBox'])
