---
title: Quality & Verification
status: current
audience: contributors, maintainers
useWhen: You are preparing a change or a release and need the verification gates.
summary: The verification gates every change must pass: syntax checks, brain harness, visual QA across all 14 views, and the docs freshness gate.
keywords: qa, testing, verification, release checklist, docs check
links: contributing, ai, adrs/adr-0002-docs-counterpart-pipeline
lastReviewed: 2026-11-17
---
## The gates
| Gate | Command / method | Passes when |
| --- | --- | --- |
| Syntax | `bun run check` (Bun parser, application and tooling) | Zero parse errors |
| Simulation and persistence | `bun run test` | Mission, save, geometry and movement contracts pass |
| Expedition browser journey | `bun run test:browser` with external Playwright tooling configured | All 18 missions, recovery, input and fallback checks pass; performance gates reported separately |
| Brain harness | Extract the chat-brain block with stubbed `Engine`, run scripted questions | Every solver returns correct, step-numbered output |
| Visual QA | Headless screenshots of **all 14 views** at 1440×1100 and 390×900, individually inspected | Layout matches the design reference; no clipped or overlapping elements |
| Console sweep | Load every route headlessly; capture console | Zero errors or uncaught rejections |
| Docs freshness | `bun run docs:check` | Every canonical `.md` has fresh `.html` + `.json` counterparts; portal indexes everything; JSON valid |
| Privacy audit | DevTools Network tab through a full session | Zero requests after initial static load |
## Visual QA notes (hard-won)
- Keep view-transition animations **transform-only**; opacity keyframes freeze semi-transparent under headless virtual-time budgets.
- SVG maps (Journey) must size text/strokes in **viewBox units**, not pixels.
- Grep for `\uFFFD` after any bulk text edit — emoji mojibake has shipped before (see the issue log).
## Release checklist
1. All gates above green.
2. `docs/.docs/changelog.md` entry written (date, scope, evidence).
3. `bun run docs:build` — regenerate counterparts + `release-manifest.json`.
4. Package excludes QA artefacts and images (`*.png`, `*.jpg`) — the distribution zip is code + docs only.
5. Verify the zip listing is clean before publishing.

## Automated Pages release

Run `bun run release:check` for the local CI gates. Run `bun run docs:build` after editing a canonical guide, then commit its generated counterparts. CI checks freshness without rebuilding first.

`bun run pages:package` creates a temporary public-site directory and prints its path. It includes the app shell, CSS, JavaScript, public docs, license and release notes. It excludes engineering evidence, tests, scripts, archives and development configuration. The Pages workflow validates pull requests and deploys pushes to `main`; configure the repository's Pages source as GitHub Actions.

The expedition's functional checks and performance/educational acceptance are separate. See `docs/.docs/open-world-verification.md` in the repository for measured results and remaining hardware, browser, accessibility and learning-efficacy gates. Passing CI alone does not close those gates.
