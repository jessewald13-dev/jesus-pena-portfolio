# Jesus Pena Jr., Portfolio

A single-page portfolio site. Plain HTML, CSS and vanilla JavaScript, no build step,
no framework, no `node_modules`. Open `index.html` and it runs.

## Run it

Any static server works. From the repo root:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Opening `index.html` straight off the filesystem also works, though a server is
closer to how it will behave when deployed.

## Deploy

The whole site is static files, so it drops onto GitHub Pages, Netlify, Vercel,
Cloudflare Pages or any bucket with no configuration. There is nothing to compile.

## Still pending

Two assets are still placeholders, both left out rather than faked:

- **Screenshots of utrgvfbla.com.** There is a `TODO` comment in the Featured
  Build section marking where they go. The homepage hero and the leadership
  dashboard are the two strongest choices.
- **A dedicated headshot.** The hero currently uses the FBLA National Headquarters
  photo, cropped to 4:5. To swap in a studio headshot, replace
  `assets/img/portrait.jpg` (1400x1750) and `assets/img/portrait-sm.jpg` (700x875);
  nothing else needs to change.

## Structure

```
index.html                  the whole page
assets/css/site.css         design tokens, layout, components
assets/js/site.js           theme, nav, reveals, counters, rail, lightbox
assets/fonts/               Phosphor icon font, subset to the 19 glyphs used
assets/img/                 photography and design work, web-optimized
```

Images ship in two sizes: `-sm` for grid and thumbnail use, full size for the
lightbox and larger layouts, wired up through `srcset`. The originals were 2 to 3 MB
each; the whole `assets/img` directory is now around 6 MB.

## Design notes

**Direction.** Warm neutral paper, one accent, editorial typography. The accent is
cobalt rather than the usual brass-on-cream, partly to avoid the default warm-craft
palette and partly because it sits naturally next to the navy and gold in his own
FBLA and student government design work.

**Type.** Newsreader for display and long-form lede copy, Geist for interface and
body, Geist Mono for figures and dates. Loaded from Google Fonts with `preconnect`
and `display=swap`.

**Tokens.** Everything is CSS custom properties in `:root`. Light and dark are two
value sets of the same tokens, so there is no per-rule dark-mode branching. Dark
mode follows `prefers-color-scheme` until the visitor uses the toggle, which then
persists in `localStorage`. An inline script in `<head>` applies the stored choice
before first paint so there is no flash of the wrong palette.

**Geometry.** One radius token (`--r: 2px`) is the only rounding anywhere, buttons
and media included. Sharp geometry is doing the editorial work.

**Motion.** Deliberately restrained, and every piece has a job: scroll reveals
sequence a section so the headline lands before the supporting copy, the counters
draw the eye to the four numbers carrying the story, the nav reflects position, the
lightbox is a state transition. There is no `window` scroll listener anywhere;
everything uses `IntersectionObserver` or element-level scroll coalesced through
`requestAnimationFrame`. All of it collapses under `prefers-reduced-motion`, where
the counters render their final values straight from the markup.

**Accessibility.** Skip link, visible focus rings, a real focus trap plus `Escape`
and arrow-key handling in the lightbox, `aria-expanded` on the mobile menu,
descriptive alt text on every image, and text that clears WCAG AA in both themes.
