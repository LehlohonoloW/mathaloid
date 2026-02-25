# Architecture

## Components
- `mathbot.js` — Core engine exposed as `MathBot` class:
  - `generateProblem()`
  - `checkAnswer(problem, userAnswer)`
  - `calculatePoints(timeTaken)`
  - `levelUp()`
  - `adjustDifficulty()`
  - `checkAchievements(timeTaken)`
  - `getNewAchievement()`
  - `explainProblem(problem, correctAnswer)`
  - `getProgress()`
  - `getStats()`
- `app.js` — DOM bindings, event handlers, sound, modes, persistence glue.
- `index.html` — UI structure including mode buttons, mode status, controls bar, progress, problem, result.
- `styles.css` — UI styling.
 - Post-answer controls UI: `#post-answer-controls` with `#next-countdown` and `#skip-next`.
 - HUD extras (Cockpit): `#status-lights` and `#mini-radar` (shown only in cockpit theme).
 - Cockpit overlay: `#cockpit-overlay` decorative layer with screws and caution stripes; `pointer-events: none`.

## Data Flow
1. `app.js` asks `mathbot.generateProblem()` → renders to DOM.
2. User submits answer → `mathbot.checkAnswer()` → returns result object.
3. `app.js` updates UI, plays sounds, persists state.
4. On mode changes, `app.js` adjusts timers/config but the math engine remains the same.

## Design Notes
- Pure browser JavaScript to keep onboarding simple (no bundler).
- Single source of truth for math/game logic (no duplicate classes).
- Persistence isolated to `app.js` to keep `mathbot.js` stateless and testable.

## Modes (State & UI)
- State:
  - `currentMode`: `classic | speed | puzzle | story`
  - `modeSession`: `{ active: boolean, timeLeft: number, lives: number, timerHandle: number|null }`
- UI:
  - Buttons: `#speed-mode`, `#puzzle-mode`, `#story-mode`
  - Status bar: `#mode-status` with `#current-mode`, `#mode-timer #timer-value`, `#mode-lives #lives-value`
- Behavior (MVP):
  - Speed: 60s countdown, auto-advance ~800ms, ends on time-up.
  - Puzzle: 3 lives; lose life on incorrect; ends at 0.
  - Story: shows explanation on every answer (correct and incorrect). After correct answers, waits an extra ~7s (≈9s total) before next problem; inputs locked with visible countdown and skip.

## Post-Answer Flow & Timers
- Functions:
  - `scheduleNextProblem(additionalDelayMs)` — computes delay based on mode (800ms in Speed, ~2000ms otherwise) + optional extra; shows countdown UI if ≥1s and sets `pendingNextTimeout` and `pendingNextInterval`.
  - `performNextNow()` — cancels pending timers/UI and calls `displayProblem()` (respecting mode session state).
  - `clearPendingNext()` — clears timeout/interval and hides `#post-answer-controls`.
- Guards:
  - `awaitingNext` flag prevents double submissions between answer processing and the next problem.
  - `setInputsEnabled(enabled)` disables input and submit button during waits.

## Difficulty
- Slider supports 0.5 steps; value is treated as a float in `app.js` and used directly by `MathBot` for generation/scoring.

## Controls (UX)
- `#controls-bar` contains:
  - `#mute-toggle` — toggles all sounds; label reflects state; persisted.
  - `#reset-progress` — resets score/level/streak/difficulty and stops modes.

## Persistence
- Storage: LocalStorage, key `mathbot.state.v1`.
- Schema:
  - `difficulty: number`
  - `score: number`
  - `streak: number`
  - `level: number`
  - `pointsToNextLevel: number`
  - `achievements: { streakMaster: boolean, quickSolver: boolean, diverseMaster: boolean }`
  - `operationsUsed: string[]`
  - `muted: boolean`

## Theming (Cockpit Neon)

- Selection: Theme radios in `index.html` (`#theme-preset`).
- Application: `applyThemePreset(theme)` in `app.js` toggles `theme-cockpit` on `<body>` (scopes cockpit-only CSS).
- Layering: `#cockpit-overlay` at `z-index: 25` under `#hud` (`z-index: 30`), both inside `.container`.
- Extras: `#status-lights` and `#mini-radar` appear only when `body.theme-cockpit` is present.
- Reduced Motion: `body.reduce-motion` disables LED pulses and scanline/reticle motion while maintaining readability.
- Mobile: caution stripes hidden on narrow viewports (`max-width: 640px`), screws scale down.

## Progress Update - 2026-02-25

- Upgraded core UI to a more immersive, tactile experience with improved interaction feedback and motion.
- Added Learning Coach enhancements, dynamic hinting, and stronger educational reinforcement during gameplay.
- Implemented richer game-feel systems: combo indicator, celebratory effects, step-by-step solution reveal, and smarter mascot messaging.
- Expanded progress UX with operation mastery tracking, extended achievements, and clearer performance indicators.
- Improved accessibility and control reliability (reduce-motion handling, keyboard flow, and verified button behavior).
- Added in-UI footer credit: Powered by Lehro Solutions, with increased visibility styling.
