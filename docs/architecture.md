---
title: Architecture
status: current
audience: contributors
useWhen: You are changing code and need to know where things live and how data flows.
summary: File map, module responsibilities, hash router, storage model and rendering flow of the zero-dependency static app.
keywords: architecture, modules, router, storage, engine, data flow
links: ai, curriculum, design-system, adrs/adr-0001-zero-dependency-local-first
lastReviewed: 2026-07-16
---
## File map
```
index.html        # single page: header, HUD, view containers, chat dock
css/atlas.css     # cosmic design system (tokens, orbs, panels, views)
js/data.js        # ATLAS dataset: skills, lessons, games, lenses, badges
js/engine.js      # Engine: mastery model, spaced repetition, generators
js/app.js         # App: router, 14 views, chat brain, HUD, settings
docs/             # this documentation system (md + generated html/json)
docs/.docs/       # engineering layer: changelog, issue log
LICENSE           # MIT
```
## Module responsibilities
| Module | Owns | Never does |
| --- | --- | --- |
| `data.js` (global `ATLAS`) | Static curriculum content: skills, lessons, games, categories, lens metadata | Logic or DOM |
| `engine.js` (global `Engine`) | State, persistence, mastery bands, spaced repetition scheduling, question generators, XP/badges | DOM |
| `app.js` (global `App`) | Hash router, view rendering, chat brain (Mathaloid Brain v2), HUD, voice, settings | Data definitions |
## Rendering flow
1. `init()` loads state (`Engine`), paints the HUD and starfield, wires the chat dock and router.
2. Navigation uses `location.hash` (`#learn`, `#play/gameId`, `#study/Category` …). The router shows one `.view` section and calls its `render()`.
3. Views are plain template-literal HTML injected into their container — no virtual DOM, no framework.
4. Answering anything (chat, quiz, game, exam) funnels into `Engine.record(skillId, correct, dims)`, which updates mastery, streaks, XP and the spaced-repetition queue, then `refreshHud()`.
## Storage model
- Single localStorage key `atlas.state.v1`; legacy `mathbot.state.v1` is migrated on first load.
- State shape: settings (grade, lens, theme), per-skill mastery records, dimension scores (understand / fluent / apply / reason / create), XP, badges, history.
- No cookies, no IndexedDB, no network persistence — see ADR-0001.
## Why zero dependencies?
See [ADR-0001](adrs/adr-0001-zero-dependency-local-first.md). Short version: GitHub Pages hosting, decade-scale durability, auditability for a children's education tool, and instant forkability.
