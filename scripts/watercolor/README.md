# Watercolor illustrations

`public/images/{welcome,lesson1,lesson2}.jpg` are painted from unDraw line art
(free for commercial use) with SVG watercolor filters, in the palette from
`CodaPet_BrandGuide_2025.pdf`: Forest #587A7C, Mauve #7B506F, Slate #628AB0,
Sage #9CB6A9, Rose #DBB2BD. Edges wash out into the page background (#faf8f5),
per the guide's "floating image with a washed edge".

To regenerate: `npm pack undraw-svg`, unpack it, then
`python3 build.py <path>/package/svgs` and `node render.mjs .` (needs Playwright + Chromium).

Swap in commissioned/AI watercolor art from the brand team whenever it exists:
replace the three JPGs (same aspect ratios: 1560x1320 and 1400x1040).
