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

## Structure

```
index.html                  the whole page
assets/css/site.css         design tokens, layout, components
assets/js/site.js           theme, nav, reveals, counters, rail, lightbox
assets/fonts/               Phosphor icon font, subset to the 19 glyphs used
assets/img/                 photography and design work, web-optimized
assets/jesus-pena-jr-resume.pdf
```

Images ship in two sizes: `-sm` for grid and thumbnail use, full size for the
lightbox and larger layouts, wired up through `srcset`. The originals were 2 to 3 MB
each; the whole `assets/img` directory is now around 9 MB, all of it lazy loaded
below the hero.

The hero portrait is the one exception. It is a WebP with an alpha channel, cut
out of the studio white so it floats on the navy hero instead of sitting in a white
box. WebP because the same cutout as PNG is 2.2 MB against 172 KB. Its bottom is
masked into a soft fade, since the studio frame crops him off flat and a hard
horizontal edge under a floating figure reads as an amputation.

## Design notes

**Direction.** Navy and gold pulled from his own material, in a cool neutral
corporate-modern shell. The two brand constants are sampled rather than guessed:
`#07182a` is the navy behind the utrgvfbla.com hero, `#e1ac30` is the gold of its
Apply Now button. The SGA flyers land in the same family (`#103677` navy,
`#eeb157` gold).

**Where gold can live.** Gold is a dark-surface colour in this brand, and not by
accident: measured against the source art, it sits on a dark surround 71% of the
time in the SGA flyer and 56% on the site. The maths agrees. `#e1ac30` on the page
neutral is under 2:1, too weak even for a hairline, let alone type. So gold appears
three ways, never as bright gold type on a light ground:

- on navy grounds, as `#e1ac30`, where it runs 8.6:1
- as a fill, in the one primary button treatment, brand gold with navy type on it
- on light grounds as type, in a deepened cut `#915c0c`, the most chromatic value
  at that hue that still clears AA against the page, the tinted band, the white
  cards and the role pills. It was re-derived when the shell moved from warm paper
  to cool neutral, since the background luminance changed

`--accent` resolves to whichever of those the current surface calls for, so
components do not need to know which ground they are sitting on.

**Navy grounds.** The masthead, the hero and the Featured Build block run navy in
both themes. They redeclare the surface tokens locally, so every component inside
them re-themes with no per-component overrides.

**Type.** Geist carries every section header and all body copy. Newsreader is held
back to two jobs: the hero name and the serif divider label above Outside Work, plus
the monogram in the masthead, which is a mark rather than text. Geist Mono handles
figures and dates. Loaded from Google Fonts with `preconnect` and `display=swap`.

**Shell.** Cool neutral page (`#f4f6f9`), a deeper band (`#eaeef3`) and white cards.
One radius (`--r: 8px`) everywhere, buttons and media included. One spacing scale,
`--sp-section` / `--sp-block` / `--sp-card` / `--sp-row`, drives every vertical
rhythm decision rather than each section carrying its own clamp. Work, case study
and leadership entries are all cards: thin border, shared radius, low shadow. The
Work cards keep a rail with a node per entry so the sequence still reads as
chronological; the node is a 9px box at the shared 8px radius, which resolves to a
circle rather than introducing a second radius. The rail comes off below 700px,
where it costs real width and stacked cards already read as a sequence. The masthead
is navy at every scroll position in both themes; only its shadow changes on scroll,
so it reads as fixed chrome rather than something that transforms under you.

**Tokens.** Everything is CSS custom properties in `:root`. Light and dark are two
value sets of the same tokens, so there is no per-rule dark-mode branching. Dark
mode follows `prefers-color-scheme` until the visitor uses the toggle, which then
persists in `localStorage`. An inline script in `<head>` applies the stored choice
before first paint so there is no flash of the wrong palette.

**Marketing section.** Two bodies of work, two treatments. The JDG Golden Summer
collateral sits in a grid that reads like a contact sheet; the FBLA and SGA pieces
stay in a horizontal rail, which suits four items. Both feed the same lightbox.

The JDG set is curated to eight of the eleven pieces in the source PDF, chosen for
spread across product categories rather than volume. Four of the eleven ran the same
"Luxury jewelry, now at stunning discounts" layout; only the black-ground bracelet
survives, because bracelets were otherwise the one category with no representation
and it is the highest-contrast cut of the four. Order runs the product categories
across the first row, then pairs the two dark cuts before the two non-advertising
pieces. The section carries a top
level nav entry, since it is the first thing a communications or marketing recruiter
looks for, and it is cross-linked from the JDG rebrand case study in both directions.

**Motion.** Deliberately restrained, and every piece has a job: scroll reveals
sequence a section so the headline lands before the supporting copy, the counters
draw the eye to the four numbers carrying the story, the nav reflects position, the
lightbox is a state transition. There is no `window` scroll listener anywhere;
everything uses `IntersectionObserver` or element-level scroll coalesced through
`requestAnimationFrame`. All of it collapses under `prefers-reduced-motion`, where
the counters render their final values straight from the markup.

Reveals run ~0.34s over 10px. The per-item stagger is scaled in one place, in the
`transition-delay` calc, rather than by rewriting every inline `--d` in the markup.

**Accessibility.** Skip link, visible focus rings, a real focus trap plus `Escape`
and arrow-key handling in the lightbox, `aria-expanded` on the mobile menu,
descriptive alt text on every image, and text that clears WCAG AA in both themes.
