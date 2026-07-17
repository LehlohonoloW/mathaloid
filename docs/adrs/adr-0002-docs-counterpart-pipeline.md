---
title: ADR-0002 — Markdown-canonical docs with generated HTML/JSON counterparts
status: current
audience: contributors
useWhen: You are changing how documentation is written, built or validated.
summary: Decision to adopt the Lehro house docs pattern (Polaris MVP / LEHRO BMS): .md as source of truth, generated themed .html and machine-readable .json, gated by docs:check.
keywords: adr, docs, pipeline, counterparts, generator
links: quality, contributing
lastReviewed: 2026-07-16
---
## Status
Accepted — July 2026.
## Context
Docs rot when humans must maintain multiple formats by hand. We want: diff-friendly authoring, a beautiful browsable portal that matches the product's cosmic design system, and machine-readable docs for agents/RAG — without adding dependencies (ADR-0001).
## Decision
Adopt the Lehro house documentation pattern proven on Polaris MVP and LEHRO BMS:
1. Every canonical guide is a `.md` file with YAML-ish frontmatter — the **single source of truth**.
2. A committed zero-dependency generator (`docs/build-docs.mjs`, Node built-ins only) emits per-guide **`.html`** (cosmic-themed, semantic landmarks, TOC, anchors) and **`.json`** (frontmatter + sections + plaintext + source checksum) counterparts, plus `index.html` portal, `docs-map.json`, `index.json` and `release-manifest.json`.
3. `npm run docs:check` is the merge gate: missing/stale counterparts (checksum mismatch), invalid JSON, unindexed guides or broken related-links fail the build.
4. Engineering history (changelog, issue log) lives in `docs/.docs/` and is deliberately excluded from the counterpart pipeline — evidence, not guidance.
## Consequences
- Generated files are committed, so GitHub Pages serves the portal with no CI required.
- Editing a generated `.html`/`.json` by hand is always wrong; `docs:check` catches it via checksums.
- Adding a guide = write one `.md`, run `docs:build` — portal, map, index and manifest update themselves.
