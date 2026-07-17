---
title: Design System — Cosmic UI
status: current
audience: contributors, designers
useWhen: You are changing visuals and need the tokens, components and accessibility rules.
summary: The cosmic design language: palette tokens, panels and orbs, motion rules, themes and accessibility requirements.
keywords: design, css, tokens, theme, accessibility, responsive
links: architecture, contributing
lastReviewed: 2026-07-16
---
## Palette tokens
Defined at the top of `css/atlas.css` and reused by this documentation's generated pages (docs must look like the product).
| Token | Value | Role |
| --- | --- | --- |
| Background | `#05081a` + radial nebulas | Deep-space canvas |
| Cyan | `#4ee1ff` | Primary accent, links, practising band |
| Purple | `#a78bfa` | Secondary accent, headings |
| Amber | `#fbbf24` | Warnings, review band |
| Pink | `#f472b6` | Foundation band, playful accents |
| Green | `#34d399` | Success, secure band |
| Text | `#e8ecff` / muted `#91a5d6` | Copy hierarchy |
## Core components
- **Panels** — translucent `rgba(16,24,58,.72)` cards with 1px `rgba(122,144,255,.18)` borders and 14–16px radii.
- **Orbs** — the home navigation circles arranged in arcs around the mascot; hover lifts + glow.
- **HUD** — sticky top bar with XP, streak and grade chips.
- **Chat dock** — the Mathaloid Brain conversation surface, present on Home and Voice.
## Motion rules
- View transitions are **transform-only** (`viewIn .35s ease`) — no opacity keyframes (they freeze mid-fade in headless captures and feel laggy on low-end devices).
- Everything honours `prefers-reduced-motion: reduce` — animations and smooth scrolling are disabled wholesale.
## Themes
Settings offers four themes: **Cosmic** (default), **Focus** (low-stimulation), **Neon** and **High Contrast**. New UI must be legible in all four; test High Contrast first.
## Accessibility requirements
- Visible `:focus-visible` outlines on every interactive element.
- Landmarks: one `header`, `nav`, `main` per page; views are labelled sections.
- Colour is never the only signal — bands also differ by label and icon.
- Touch targets ≥ 40px on mobile; the layout is fully responsive from 320px up.
- SVG maps (Journey) size text and strokes in **viewBox units**, never pixels.
