# Issue log — MATHALOID Atlas

Build-breaking, security-relevant or recurrence-prone findings. Newest first.

| Date | Severity | Finding | Resolution | Prevention |
| --- | --- | --- | --- | --- |
| 2026-07-16 | Medium | Chat calculator intercepted `1/2 + 1/3` before the step-by-step fraction solver | Fraction-pattern guard added ahead of the calculator branch | Brain harness includes fraction-vs-calculator ordering case |
| 2026-07-16 | High | app.js head lost during multi-part write (`SyntaxError: unexpected }` / `return outside function`) | Head rebuilt and re-concatenated | Always `node --check` + inspect file head after multi-part writes |
| 2026-07-16 | Medium | Journey map rendered giant text/rings | SVG text/strokes resized in viewBox units, not px | Design-system rule: SVG maps size in viewBox units |
| 2026-07-16 | Low | View fade froze semi-transparent in headless captures | View transitions made transform-only | Motion rule codified in design-system.md |
| 2026-07-16 | Low | U+FFFD mojibake (broken emoji) in Help view | Stripped; source emoji rewritten | Grep for `\uFFFD` after bulk text edits (quality.md) |
