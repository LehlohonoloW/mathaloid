# Runbooks

## Local Run (no build)
- Open `index.html` directly in a modern browser, or
- Use VS Code Live Server for auto-reload (recommended).

If CSS/JS do not load:
- Ensure filenames match exactly (planned: `styles.css`, `mathbot.js`, `app.js`).
- Clear cache/hard refresh (Ctrl+F5).

## Quick Smoke Test
- Page loads with a math problem displayed.
- Answer an easy sample (e.g., `2 + 3 = 5`).
- Score increments, streak updates, progress bar moves.
- Difficulty slider updates the displayed difficulty value.

### Mode Smoke Tests
- Speed: Start, confirm timer counts down and ends session at 0.
- Puzzle: Start, submit 3 incorrect answers to verify lives decrement and session ends.
- Story:
  - Answer correctly: explanation appears and next problem is delayed by ~9s total (2s base + 7s extra). During the wait, "Next in …" countdown and "Skip now" button appear; inputs are disabled.
  - Answer incorrectly: explanation appears immediately; base wait ~2s before next problem.

## Data & Persistence
- LocalStorage key: `mathbot.state.v1`
- Schema (JSON):
  - `difficulty: number`
  - `score: number`
  - `streak: number`
  - `level: number`
  - `pointsToNextLevel: number`
  - `achievements: { streakMaster: boolean, quickSolver: boolean, diverseMaster: boolean }`
  - `operationsUsed: string[]` (e.g., ["+","-","*"])
  - `muted: boolean` (UI mute preference)

## Reset & Mute
- Reset Progress: Use the "Reset Progress" button in the controls bar. This clears score/level/streak/difficulty and stops any active mode.
  - Manual alternative: DevTools → Application → Local Storage → delete `mathbot.state.v1`.
- Mute: Toggle the "Mute" button. The setting persists via `muted` in localStorage.

## Troubleshooting
- Difficulty slider supports 0.5 increments; ensure value reflects decimal (e.g., 2.5) next to the slider.
- See `06-Troubleshooting.md` for common issues and fixes.

## Accessibility Quick Checks
- Reduce Motion
  - Toggle the "Reduce Motion" button in the controls bar. Verify `aria-pressed` toggles and `<body>` gains/removes the `.reduce-motion` class.
  - Confirm animations/transitions stop when enabled (level-up, button hover, achievement toast).
  - Refresh the page to ensure the preference persists (localStorage).
- Focus-visible
  - Use keyboard (Tab/Shift+Tab) to navigate. Verify clear focus rings on all interactive elements (mode buttons, mute, reset, reduce-motion, submit, skip).
- Screen reader feedback
  - With a screen reader, answer a problem. Verify feedback is announced from `#result[role="status"][aria-live="polite"][aria-atomic="true"]`.
- Mobile input behavior
  - `#answer` has `inputmode="numeric"` and is styled sufficiently (>16px font-size) to reduce unwanted zoom on iOS.

## Theme Verification — Cockpit Neon
- Switch to Theme → "Cockpit Neon" in Settings.
- Expect:
  - HUD LEDs at top-right: PWR (green steady), LINK (amber pulsing), SYS (red pulsing).
  - Mini radar sweep next to LEDs.
  - Bezel overlay (screws in corners, subtle caution stripes near edges).
  - Digital readouts on `#level-badge` and `#mode-status` with a soft neon glow.
- Reduced Motion: toggle the button; LED pulses stop and visuals remain.
- Mobile (<640px): caution stripes are intentionally hidden; screws slightly smaller.
