---
title: Getting Started
status: current
audience: learners, teachers, contributors
useWhen: You want to run, host or develop MATHALOID Atlas.
summary: Run the app from a folder, a local server or GitHub Pages; manage your data; build the docs.
keywords: install, run, deploy, github pages, localStorage, docs build
links: overview, architecture, contributing
lastReviewed: 2026-07-16
---
## Requirements
None. MATHALOID Atlas is a static site with **zero runtime dependencies** — no npm install, no build step, no server code. Any modern browser works. Node.js (18+) is only needed if you want to rebuild the documentation.
## Run it locally
Option A — just open it:
```
git clone <your-fork-url> mathaloid-atlas
cd mathaloid-atlas
open index.html        # or double-click it
```
Option B — tiny local server (recommended, matches production paths):
```
python3 -m http.server 4200
# then visit http://localhost:4200
```
## Deploy to GitHub Pages
1. Push the repository to GitHub.
2. Settings → Pages → deploy from the `main` branch, root folder.
3. Done — there is no build pipeline to configure. The docs portal ships pre-built at `/docs/index.html`.
## Your data
- All progress is stored under the localStorage key `atlas.state.v1` (older `mathbot.state.v1` saves migrate automatically).
- **Export / erase** from Settings at any time. Clearing browser data resets everything — by design there is no cloud copy.
## Developer commands
```
npm run check        # syntax-check all JS (node --check)
npm run docs:build   # regenerate .html/.json doc counterparts + portal
npm run docs:check   # CI gate: fails if any counterpart is missing or stale
```
## Where to go next
- [Architecture](architecture.md) — how the three JS modules fit together.
- [Contributing](contributing.md) — the safe-change workflow.
