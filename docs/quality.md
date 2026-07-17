---
title: Quality & Verification
status: current
audience: contributors, maintainers
useWhen: You are preparing a change or a release and need the verification gates.
summary: The verification gates every change must pass: syntax checks, brain harness, visual QA across all 14 views, and the docs freshness gate.
keywords: qa, testing, verification, release checklist, docs check
links: contributing, ai, adrs/adr-0002-docs-counterpart-pipeline
lastReviewed: 2026-07-16
---
## The gates
| Gate | Command / method | Passes when |
| --- | --- | --- |
| Syntax | `npm run check` (`node --check` on all JS) | Zero parse errors |
| Brain harness | Extract the chat-brain block with stubbed `Engine`, run scripted questions | Every solver returns correct, step-numbered output |
| Visual QA | Headless screenshots of **all 14 views** at 1440×1100 and 390×900, individually inspected | Layout matches the design reference; no clipped or overlapping elements |
| Console sweep | Load every route headlessly; capture console | Zero errors or uncaught rejections |
| Docs freshness | `npm run docs:check` | Every canonical `.md` has fresh `.html` + `.json` counterparts; portal indexes everything; JSON valid |
| Privacy audit | DevTools Network tab through a full session | Zero requests after initial static load |
## Visual QA notes (hard-won)
- Keep view-transition animations **transform-only**; opacity keyframes freeze semi-transparent under headless virtual-time budgets.
- SVG maps (Journey) must size text/strokes in **viewBox units**, not pixels.
- Grep for `\uFFFD` after any bulk text edit — emoji mojibake has shipped before (see the issue log).
## Release checklist
1. All gates above green.
2. `docs/.docs/changelog.md` entry written (date, scope, evidence).
3. `npm run docs:build` — regenerate counterparts + `release-manifest.json`.
4. Package excludes QA artefacts and images (`*.png`, `*.jpg`) — the distribution zip is code + docs only.
5. Verify the zip listing is clean before publishing.
