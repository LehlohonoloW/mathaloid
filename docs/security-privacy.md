---
title: Security, Privacy & Dependency Policy
status: current
audience: parents, teachers, contributors, auditors
useWhen: You need to verify what data Atlas touches, or audit its dependency surface.
summary: The privacy-first guarantees, the threat model for a children's education tool, and the standing zero-dependency policy.
keywords: privacy, security, dependencies, audit, localStorage, offline
links: overview, ai, adrs/adr-0001-zero-dependency-local-first
lastReviewed: 2026-07-16
---
## Privacy guarantees
1. **Zero network requests after page load.** No analytics, no fonts CDN, no API calls, no error reporting. Verify yourself: open DevTools → Network and use the app.
2. **All data stays on-device** in localStorage key `atlas.state.v1`. No cookies. No accounts. No fingerprinting.
3. **The AI tutor is local.** Mathaloid Brain is deterministic JavaScript — a child's questions are never transmitted anywhere. See [Mathaloid Brain](ai.md).
4. **You own the exit.** Settings → Export gives you your full state as JSON; Settings → Erase wipes it.
## Dependency policy (standing)
| Surface | Dependencies | Update posture |
| --- | --- | --- |
| Runtime (browser) | **0** — vanilla HTML/CSS/JS, no frameworks, no CDN assets | Nothing to update; `package.json` pins empty `dependencies`/`devDependencies` as a guarantee |
| Docs generator | **0 packages** — Node built-ins only (`node:fs`, `node:crypto`, `node:path`, `node:url`) | Tracks whatever LTS Node you run; no lockfile needed |
A pull request that adds a runtime dependency must supersede [ADR-0001](adrs/adr-0001-zero-dependency-local-first.md) with a new ADR and a security justification. “Dependencies up to date” is therefore permanently true by construction — the audit is: confirm the count is still zero.
## Threat model notes
- **Untrusted input:** the chat calculator never uses raw `eval` on arbitrary strings; expressions are validated by strict regex before safe evaluation, and all echoed user text passes through `esc()` to prevent HTML injection.
- **Hosting:** GitHub Pages serves static files only; there is no server-side attack surface and nothing to leak.
- **Supply chain:** with zero packages there is no dependency-confusion, typosquatting or transitive-CVE exposure.
- **Shared devices:** state is per-browser-profile; use Export/Erase when handing over a device.
## Reporting
Security findings are logged in `docs/.docs/issue-log.md`; report new ones via GitHub issues on your fork/upstream.
