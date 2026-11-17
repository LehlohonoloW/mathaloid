---
title: Getting Started
status: current
audience: learners, teachers, contributors
useWhen: You want to run, host or develop MATHALOID Atlas.
summary: Run the app from a folder, a local server or GitHub Pages; manage your data; build the docs.
keywords: install, run, deploy, github pages, localStorage, docs build
links: overview, architecture, contributing
lastReviewed: 2026-11-12
---
## Requirements
MATHALOID Atlas is a static site with **zero runtime packages**. Any modern browser works. Install Bun 1.3.14 or newer to run the local server, rebuild documentation and execute contributor checks; package installation is unnecessary for this dependency-free application.

Optional real-browser verification requires an installed Playwright tooling module. On Windows it uses Node for Playwright's browser transport, invoked through `bun run test:browser` or `bun run test:renderer:browser`. The application and its normal contributor tooling run with Bun.
## Run it locally
Option A — just open it:
```
git clone <your-fork-url> mathaloid-atlas
cd mathaloid-atlas
open index.html        # or double-click it
```
Option B — tiny local server (recommended, matches production paths):
```
bun run start
# then visit http://127.0.0.1:4173/#world
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
bun run check        # syntax-check application and tooling with Bun
bun run test         # learning, save, renderer and locomotion contracts
bun run docs:build   # regenerate .html/.json doc counterparts + portal
bun run docs:check   # CI gate: fails if any counterpart is missing or stale
```
## Where to go next
- [Architecture](architecture.md) — how the three JS modules fit together.
- [Contributing](contributing.md) — the safe-change workflow.
