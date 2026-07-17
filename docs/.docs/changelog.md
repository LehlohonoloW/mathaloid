# Engineering changelog — MATHALOID Atlas

Newest first. Evidence-grade history; current guidance lives in the guides, never here.

## 2026-07-16 — v2.0.0: Brain v2 + documentation system
- **Mathaloid Brain v2** (js/app.js chat brain): added general linear solver (x on both sides, fractional coefficients), quadratic solver with discriminant reasoning, polynomial differentiation (power rule), fraction arithmetic with HCF simplification, percentage suite (of / reverse / increase-decrease multiplier), HCF/LCM via Euclid, primality + prime factor trees, FOIL expansion, times tables, 18+ concept explainers; fraction solver prioritised above plain calculator. Evidence: harness run over scripted prompts — all step-numbered outputs correct; `node --check` clean.
- **Docs system** per ADR-0002: 13 canonical `.md` guides (10 guides + 2 ADRs + 1 skill) with generated `.html`/`.json` counterparts, cosmic-themed portal, docs-map/index/release-manifest, `docs:build`/`docs:check` scripts in package.json (zero packages).
- **Dependency audit:** runtime dependencies confirmed **0**; tooling uses Node built-ins only. Policy codified in security-privacy.md + ADR-0001.
- **Distribution hygiene:** release zip excludes all images/QA artefacts (`*.png`, `*.jpg`); verified via archive listing.

## 2026-07-16 — v2.0.0: Atlas UI rebuild
- Full cosmic rebuild: 14 routed views, mascot hub with orb navigation, HUD, chat dock, four themes; desktop 1440px + mobile 390px QA across all views (28 screenshots individually inspected).
- Fixes during QA: Journey SVG sized in viewBox units (was px — giant text/rings); viewBox extended to `0 -3 100 68` (clipped label); view transition made transform-only (opacity keyframes froze in headless capture); U+FFFD mojibake stripped from Help view.

## 2026-07-16 — v1 → v2 planning
- Deep upgrade plan authored and twice revised in Notion (curriculum expansion to CAPS/IEB/A-Levels, no-ceiling principle, cosmic UI reference match, privacy-first commitments, MIT license retained).
