---
title: SKILL — Maintain the documentation
status: current
audience: contributors, agents
useWhen: You changed behaviour, added a feature, or are preparing a release and must keep docs true.
summary: Repeatable workflow for updating canonical guides and regenerating counterparts so docs never drift from the code.
keywords: skill, workflow, docs, maintenance, agents
links: contributing, quality, adrs/adr-0002-docs-counterpart-pipeline
lastReviewed: 2026-07-16
---
## When to use
Any time observable behaviour changes: features, fixes with user impact, policy changes, releases.
## Steps
1. **Identify the owning guide.** Map the change to one canonical `.md` in `docs/` (or a new one; copy an existing file's frontmatter shape). Never edit `.html`/`.json` counterparts by hand.
2. **Update the Markdown.** Keep frontmatter honest: bump `lastReviewed`, adjust `summary`/`useWhen` if scope changed, keep `links` pointing at real slugs.
3. **Log history separately.** Add a dated entry to `docs/.docs/changelog.md` (what/why/evidence). Build-breaking or security findings also go to `docs/.docs/issue-log.md`. History never goes in guides.
4. **Regenerate.** `npm run docs:build` — emits fresh `.html` + `.json` counterparts, portal, docs-map, index and release manifest.
5. **Gate.** `npm run docs:check` must pass (fresh checksums, valid JSON, portal indexes everything, links resolve).
6. **Report precisely.** State exact counts in your PR/report, e.g. “13 canonical guides → 13 HTML + 13 JSON counterparts + portal; docs:check green.”
## Failure modes to avoid
- Editing generated files (checksum mismatch → `docs:check` fails).
- Writing history into a guide (belongs in `.docs/`).
- Adding a guide without frontmatter `summary`/`useWhen` (portal card and JSON go blank).
- Forgetting `docs:build` after a Markdown edit (stale counterparts fail the gate).
