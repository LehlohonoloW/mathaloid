# Changelog

## 2025-08-18
- Initialize deepwiki structure.
- Added plan for file renames, persistence, modes, and UX improvements.

- Phase A completed: standardized file names and HTML references
  - .container {.css → styles.css
  - class MathBot {.js → mathbot.js (unified class, exposed as window.MathBot)
  - const mathBot = new MathBot();.js → app.js (UI glue)
  - index.html updated to load styles.css, mathbot.js, app.js

- Phase B started: persistence and UI theme hooks
  - Added localStorage persistence in app.js (difficulty, score, streak, level, pointsToNextLevel, achievements, operationsUsed)
  - Load state on init; update slider/value; apply difficulty color theme; save on answer check and slider change
  - Minor: introduced applyDifficultyTheme() helper

- Cleanup
  - Archived legacy duplicates to archive/ (.container {.css, class MathBot {.js, class MathBot.js, const mathBot = new MathBot();.js)

- Note
  - (Resolved in Phase C below) Previously had duplicate progress sections/IDs in index.html; these have been removed.

## 2025-08-18 (Phase C)
- Implemented game modes (MVP):
  - Speed: 60s timer, auto-advance, ends on time-up
  - Puzzle: 3 lives, lose a life on incorrect, ends on 0 lives
  - Story: appends explanation after correct answers
- UI: added mode status bar in index.html (`#mode-status`) showing current mode, timer, lives
- Styles: added `#mode-status` styles; fixed CSS lint by adding `appearance: none` to `#difficulty-slider`
- Controls/UX: added `#controls-bar` with `#mute-toggle` (persisted) and `#reset-progress` (clears progress, stops modes)
- HTML: deduplicated the progress section and removed duplicate IDs
- Docs: updated `docs/deepwiki/04-Game-Modes.md` and `02-Runbooks.md`, `03-Architecture.md` for modes, persistence, and controls

## 2025-08-18 (Phase D)
- Story UX enhancements:
  - Story mode now always shows explanations; after correct answers, adds an extra ~7s wait (≈9s total) before next problem.
  - Inputs are locked during the wait to prevent double submissions.
  - Added post-answer countdown and "Skip now" control.
- Difficulty UX:
  - Slider now supports 0.5 increments; app reads difficulty as float.
- Implementation notes:
  - Added `scheduleNextProblem()` countdown UI, `performNextNow()`, `clearPendingNext()`, and `awaitingNext` guard in `app.js`.
  - Added `#post-answer-controls` section to `index.html` and corresponding styles to `styles.css`.
- Docs updated: `04-Game-Modes.md`, `02-Runbooks.md`, `03-Architecture.md` reflect the new UX.

## 2025-08-19
- Branding: DeepWiki rebranded to MATHALOID (`README.md`, `01-Overview.md`).
- UI/UX: Added "Cockpit Neon" section with visuals, layering, reduced motion, mobile, and verification checklist.
- Architecture: Documented HUD extras (`#status-lights`, `#mini-radar`) and `#cockpit-overlay` layering and behavior.
- Runbooks: Added theme verification checklist for Cockpit Neon.
- Troubleshooting: Added cockpit overlay and LED pulse tips.
- CSS tweaks (code): refined overlay z-index and caution stripe placement; added reduced-motion handling for LED pulses; LCD-like readouts for `#level-badge`.
