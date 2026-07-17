---
title: ADR-0001 — Zero-dependency, local-first architecture
status: current
audience: contributors
useWhen: You are tempted to add a framework, package or server component.
summary: Decision to build Atlas as a zero-dependency static site with all state in localStorage — and what it costs us.
keywords: adr, decision, dependencies, static, local-first
links: architecture, security-privacy
lastReviewed: 2026-07-16
---
## Status
Accepted — July 2026 (reaffirmed at v2.0.0).
## Context
Atlas is an open source education tool for children, hosted free on GitHub Pages, forked by people with wildly varying technical skill. It must be trustworthy (privacy for minors), durable (usable in a decade), and forkable (download → open → works).
## Decision
1. **Zero runtime dependencies.** Vanilla HTML/CSS/JS only; no frameworks, no CDN assets, no package installs to run the app.
2. **Local-first state.** All user data lives in localStorage (`atlas.state.v1`); the app makes zero network requests after load.
3. Node.js (built-ins only) is permitted for *offline tooling* (the docs generator), never for the runtime.
## Consequences
- Supply-chain risk is structurally eliminated; “dependency updates” reduce to confirming the count is still zero.
- No SSR, no bundler ergonomics, no npm ecosystem shortcuts — contributors write plain JS and template literals.
- Multi-device sync is impossible by design; the escape hatch is Settings → Export/Import.
- Any PR wanting a runtime package must write a superseding ADR with a security justification.
