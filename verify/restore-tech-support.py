# Intended design of /service/tech-support for side-by-side checks. Run on the output of clean-source.cjs.
# The live page renders unstyled: its page stylesheet sat in the duplicated .row.js-component and was lost
# from it in 2024 (archived render 2023-10-01 still has it), and even then its selectors missed the markup.
# This restores that stylesheet with the selectors matched to the markup
# (.Header -> .Section__header, .Header__callout -> .callout, .ServiceCard(s) -> .serviceCard(s)) and removes
# the duplicated header component. Not restored: `.serviceCard:nth-child(3) p:last-child { line-height: 1.2 }`
# (written for the January 2023 card order, it now hits "FAQs" by mistake).
# Usage: python3 -I restore-tech-support.py <cleaned.html> <wayback-tech-support-20231001.html> <out.html>
import re
import sys

cleaned, wayback, out = sys.argv[1:4]
h = open(cleaned, encoding='utf-8').read()
w = open(wayback, encoding='utf-8', errors='replace').read()

page_css = next(m.group(1) for m in re.finditer(r'<style[^>]*>(.*?)</style>', w, re.S)
                if 'FIRST SECTION' in m.group(1))
for a, b in [(r'\.Header__callout', '.callout'), (r'\.Header\b', '.Section__header'),
             (r'\.ServiceCards\b', '.serviceCards'), (r'\.ServiceCard\b', '.serviceCard')]:
    page_css = re.sub(a, b, page_css)
page_css = re.sub(r'\.serviceCard:nth-child\(3\) p:last-child\s*\{[^}]*\}', '', page_css)

h = re.sub(r'<div class="row js-component">\s*<div>\s*<div class="Section Section__header">.*?</div>\s*</div>\s*</div>\s*</div>',
           '', h, count=1, flags=re.S)
assert h.count('Section__header') == 1, 'duplicate header not removed'
assert '<!-- AccessModal-->' in h, 'insertion point not found'
h = h.replace('<!-- AccessModal-->', f'<style id="restored-page-css">{page_css}</style><!-- AccessModal-->', 1)
open(out, 'w', encoding='utf-8').write(h)
print('ok', out)
