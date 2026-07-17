---
title: Mathaloid Brain — the on-device AI tutor
status: current
audience: contributors, teachers
useWhen: You want to understand, test or extend the built-in AI maths tutor.
summary: Design and capability reference for Mathaloid Brain v2 — a fully local, explainable, step-by-step maths engine with zero network calls.
keywords: ai, chat, tutor, solver, quadratic, derivative, privacy, offline
links: architecture, curriculum, security-privacy
lastReviewed: 2026-07-16
---
## Design goals
1. **Private by construction** — the brain is deterministic JavaScript running on-device. Nothing a child types ever leaves the browser. There is no API key, no telemetry, no model download.
2. **Explainable** — every solver shows its working, step by step, like a good teacher. No black-box answers.
3. **Adaptive** — quiz answers feed `Engine.record(...)`, so the tutor's practice loop updates the same mastery model as lessons and games.
## Capability reference (v2)
| You type | The brain does |
| --- | --- |
| `2x + 3 = x + 9`, `x/4 + 2 = 5` | Solves linear equations with x on either side (and fractional coefficients), showing balance-scale steps |
| `x^2 - 5x + 6 = 0` (or `x²`) | Quadratic solver: standard form, discriminant, formula, both roots; flags complex roots at A-Level |
| `differentiate 3x^2 + 5x - 4` | Power-rule differentiation of any polynomial, term by term |
| `15% of 80`, `80 is what percent of 200`, `increase 50 by 10%` | Percentage calculations with the multiplier method |
| `1/2 + 1/3`, `2/3 × 3/4` | Fraction arithmetic with common denominators and simplification by HCF |
| `hcf of 24 and 36`, `lcm of 4 and 6` | Euclid's algorithm + the HCF×LCM identity |
| `is 91 prime`, `factors of 60` | Primality with a counterexample, and prime factor trees |
| `expand (x+2)(x+3)` | FOIL expansion with the middle-term reasoning |
| `7 times table` | Full 1–12 table |
| `what is pythagoras / trig / logarithms / probability …` | 18+ concept explainers tuned to be memorable, with pointers into Learn / Play / Frontier |
| `quiz me`, `next`, `hint` | Adaptive practice from six generators (linear, fractions, sequence, percent, exponents, function evaluation) |
| `grade 9` | Retargets content level instantly |
| any arithmetic like `12 + 5 * 3` | Safe local calculator (no `eval` of arbitrary code) |
## How it works
The brain is an intent cascade in `js/app.js` (see the `chat brain` section): pending-answer checking → equation solvers (quadratic, then linear) → calculator → fraction/percent/calculus/number-theory solvers → concept explainers → quiz/hint/grade/help intents → a fallback that teaches you what it can do. Parsing helpers (`parseLin`, `parsePoly`, `polyStr`) turn free text into coefficient maps, so solvers stay tiny and testable.
## Extending the brain
- **New explainer:** add a `[regex, message]` pair to the `EXPLAIN` table.
- **New solver:** add a regex + handler before the explainer loop; return an HTML string with numbered steps.
- **New quiz type:** add a generator in `engine.js` and list its id in the quiz intent's `gens` array.
Always rerun the brain harness and `node --check js/app.js` — see [Quality](quality.md).
## Why not an LLM?
A hosted LLM would break all three product promises (offline, private, free-forever static hosting). The roadmap tracks an *optional, opt-in* local small-model experiment — see [Roadmap](roadmap.md) — but the deterministic brain remains the default forever.
