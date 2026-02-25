# Math Bot Improvement Plan (v1)

## Goals
- Unify logic and fix broken imports/filenames.
- Stabilize gameplay (difficulty, scoring, achievements).
- Add persistence (localStorage) and basic modes.
- Improve accessibility, responsiveness, and UX polish.
- Document everything in a deepwiki with runbooks.

## Current Findings (as-is)
- `index.html` references `MathBot.js` and `game.js`, but present files are:
  - `class MathBot.js` (minimal class)
  - `class MathBot {.js` (fuller feature set)
  - `const mathBot = new MathBot();.js` (UI/game glue)
- CSS file named `.container {.css` and linked as such. Works but non-standard and fragile on some servers.
- Duplicate MathBot implementations: conflict source of truth.
- No persistence of score/level/streak/difficulty across sessions.
- Buttons for modes exist (`#speed-mode`, `#puzzle-mode`, `#story-mode`) but not wired.
- Sound effects rely on remote URLs; no toggle/mute control.

## Proposed Changes (Phased)

### Phase A — Structure & Naming (non-breaking)
- Rename files for clarity:
  - `.container {.css` → `styles.css`
  - `class MathBot {.js` (keep as source of truth) → `mathbot.js`
  - `const mathBot = new MathBot();.js` → `app.js`
- Update `index.html` `<link>` and `<script>` references accordingly.
- Keep everything as plain browser JS (no build step) for now.

### Phase B — Logic & Persistence
- Unify MathBot into one class (`mathbot.js`) with public methods:
  - `generateProblem()`, `checkAnswer()`, `calculatePoints()`, `levelUp()`, `adjustDifficulty()`,
    `checkAchievements()`, `getNewAchievement()`, `explainProblem()`, `getProgress()`, `getStats()`.
- Introduce `localStorage` persistence for: score, level, streak, difficulty, achievements.
- Input safety: robust parsing for `#answer` (blank/NaN handling already started).
- Explanations: keep current scenario-based strings, ensure division formatting and rounding displayed nicely.

### Phase C — Game Modes (MVP)
- Wire the top buttons and implement basic behaviors:
  - Speed Mode: 60s timer, maximize correct answers.
  - Puzzle Mode: increasing complexity (larger ranges, occasional multi-step generated as a sequence; UI unchanged for now).
  - Story Mode: always show `explainProblem()` after each answer; lighter scoring.
- Non-invasive: modes wrap existing flow and reuse the same DOM.
  
Status: Complete — 2025-08-18

### Phase D — UX & Accessibility
- [x] Add labels/ARIA where missing; ensure focus states and keyboard-only play.
- [x] Mobile: input zoom behavior, spacing, and tap targets.
- [x] Add mute toggle for sounds; graceful failure if audio blocked.
- [x] Color contrast and Reduced Motion option (persisted toggle in controls bar).
- [x] Modern theme: gradient background, glassmorphism container, focus-visible rings, active toggle visuals.
- [ ] Optional: light/dark theme toggle and color-blind safe palette presets.

### Phase E — Docs & Maintenance
- Deepwiki with overview, runbooks, architecture, game modes, UI/UX, troubleshooting, changelog.
- Lightweight manual test checklist.

## Rollout Plan
1) Create plan (this) and deepwiki skeleton. [No code changes]
2) Apply Phase A renames + `index.html` updates.
3) Apply Phase B persistence and class unification.
4) Implement Phase C modes and basic timers.
5) Apply Phase D UX polish.
6) Update deepwiki changelog and runbooks.

## Acceptance Criteria
- App runs by opening `index.html` in a browser without errors.
- Only one `mathbot.js` class used; `app.js` controls UI and modes.
- Score/level/streak/difficulty persist across refresh.
- Mode buttons change behavior visibly (e.g., Speed countdown, Story explanations always shown).
- Sounds can be muted; UI remains usable on mobile; keyboard-only support.
- Deepwiki contains up-to-date runbooks and architecture notes.

## Risks & Mitigations
- Renaming can break references → perform Phase A carefully and test after each rename.
- LocalStorage corruption → versioned keys and safe defaults.
- Audio autoplay blocked → user-initiated sounds only and catch errors (already in code).

## Out of Scope (for now)
- Unit tests/build pipeline.
- i18n or advanced curriculum generation.

--
Proposed by: Cascade
Date: 2025-08-18

## Progress Update - 2026-02-25

- Upgraded core UI to a more immersive, tactile experience with improved interaction feedback and motion.
- Added Learning Coach enhancements, dynamic hinting, and stronger educational reinforcement during gameplay.
- Implemented richer game-feel systems: combo indicator, celebratory effects, step-by-step solution reveal, and smarter mascot messaging.
- Expanded progress UX with operation mastery tracking, extended achievements, and clearer performance indicators.
- Improved accessibility and control reliability (reduce-motion handling, keyboard flow, and verified button behavior).
- Added in-UI footer credit: Powered by Lehro Solutions, with increased visibility styling.
