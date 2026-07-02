# Onyx · Meridian — marketing site

A sleek, modern single-page marketing site for the **Onyx** enterprise AI framework
and the **Meridian** product. Faithful to the original Onyx palette (white base,
black accent cards, blue highlights, multi-color accelerator accents), elevated with
motion, depth, and a few interactive moments.

## Run it

It's a zero-build static site — **just open `index.html`** in a browser.

```
open index.html          # macOS
```

Or serve it (recommended; some browsers are stricter over `file://`):

```
python3 -m http.server 8000     # then visit http://localhost:8000
# or
npx serve .
```

No `npm install`, no bundler. Fonts load from Google Fonts (needs internet);
everything else is local.

## Files

| File | What it is |
|------|------------|
| `index.html` | Structure + all copy/content |
| `styles.css` | Design system, layout, components, animations, responsive |
| `app.js` | Scroll/nav behavior, reveals, count-ups, tabs, carousel, knowledge-graph canvas |

## Sections

1. **Hero** — "Pathway to the AI-Native Enterprise" + a live Meridian / Order-to-Cash dashboard mock with the Co-Work assistant.
2. **Stats band** — animated count-ups (7 context layers · 5 accelerators · 2 layers · 100% governed).
3. **The Problem** — Fragmentation vs. Continuous Intelligence diagram.
4. **Convergence** — Co-Work + Digital Twin → Shared Intelligence.
5. **Architecture** — *Two layers. One enterprise system.* (Co-Work light card / Digital Twin black card).
6. **Differentiators** — Context Engineering (7-layer grid) + Policy Engine (black card).
7. **Accelerators** — Pulse · Prism · Flow · Ensure · Vault + "Composable by design", with accent-color spotlight hovers.
8. **Platform, Live** *(new)* — animated Digital-Twin knowledge graph + feature highlights + integrations marquee.
9. **Enterprise Ready** — Deploy Anywhere · LLM Agnostic · Consume Your Way.
10. **Team** — Engineered by GYTWorkz (AI Advisory / Engineering / Accelerators tabs) + Onyxperts carousel.
11. **CTA + Footer**.

## Augmentations beyond the original

- Animated hero grid + glow and a floating, tilted product dashboard.
- Count-up stats band.
- Live canvas **knowledge-graph** for the Digital Twin (animated nodes, links, signal pulses).
- Integrations marquee.
- Spotlight-on-hover accelerator cards keyed to each accent color.
- Scroll-reveal with stagger, sticky glass nav with active-section tracking, scroll progress bar, full mobile nav + responsive layout.
- Respects `prefers-reduced-motion`.

## Customizing

All colors live in CSS custom properties at the top of `styles.css` (`:root`).
Type scale uses **Sora** (display), **Inter** (body), **JetBrains Mono** (labels).
