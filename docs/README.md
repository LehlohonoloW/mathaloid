# MATHALOID Atlas — Documentation

This folder is the documentation system for MATHALOID Atlas, built on the Lehro house pattern (Polaris MVP / LEHRO BMS): **Markdown is canonical**, and a zero-dependency generator emits a themed HTML portal plus machine-readable JSON counterparts.

**Browse:** open [`index.html`](index.html) (the portal) — also served on GitHub Pages at `/docs/`.

## Structure

```
docs/
├─ README.md                  ← you are here (Markdown home)
├─ index.html                 ← generated portal (Guides / ADRs / Skills)
├─ build-docs.mjs             ← generator + docs:check gate (Node built-ins only)
├─ <guide>.md                 ← canonical guides (source of truth)
├─ <guide>.html / .json       ← generated counterparts — never edit by hand
├─ docs-map.json · index.json · release-manifest.json
├─ adrs/                      ← durable decisions
├─ skills/                    ← repeatable workflows (SKILL files)
└─ .docs/                     ← engineering layer: changelog.md, issue-log.md (no counterparts)
```

## Canonical guides

| Guide | Read when… |
| --- | --- |
| [overview.md](overview.md) | You are new here |
| [getting-started.md](getting-started.md) | You want to run or deploy it |
| [architecture.md](architecture.md) | You are changing code |
| [ai.md](ai.md) | You care about the on-device tutor (Mathaloid Brain v2) |
| [curriculum.md](curriculum.md) | You care about CAPS/IEB/A-Levels & mastery |
| [design-system.md](design-system.md) | You are changing visuals |
| [security-privacy.md](security-privacy.md) | You are auditing privacy or dependencies |
| [quality.md](quality.md) | You are verifying a change or release |
| [contributing.md](contributing.md) | You want to add something |
| [roadmap.md](roadmap.md) | You want to know what's next |

## Commands

```
npm run docs:build   # regenerate counterparts + portal + manifests
npm run docs:check   # CI gate — fails on stale/missing/invalid docs
```
