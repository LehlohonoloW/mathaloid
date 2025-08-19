# UI/UX Guidelines

- Accessibility
  - Labels/ARIA: `#answer` has an associated `<label>` (visually hidden via `.sr-only`).
  - Live regions: `#result[role="status"][aria-live="polite"][aria-atomic="true"]` for answer feedback.
  - Toggle buttons: mode buttons and `#reduce-motion` use `aria-pressed` to reflect state.
  - Keyboard: all interactive elements reachable; visible focus indicators via `:focus-visible`.

- Motion & Reduced Motion
  - Global toggle: `#reduce-motion` persists to localStorage; when enabled, `<body>.reduce-motion` disables animations/transitions.
  - Respect user preference: CSS is designed so disabling animations does not hide essential information.

- Mobile
  - Tap targets min-height ~44px (buttons) and generous padding.
  - Input zoom: `#answer` uses `inputmode="numeric"` and font-size > 16px to avoid iOS zoom jumps.

- Color & Theme
  - High-contrast theme with gradient background and glassmorphism container.
  - Use CSS vars for accents (`--accent-1`, `--accent-2`) and text (`--text-primary`, `--text-secondary`).
  - Focus ring color `--focus-ring` ensures accessibility on dark backgrounds.

- Sounds
  - `#mute-toggle` persists; errors from blocked audio are ignored gracefully.

- Feedback
  - Subtle animations for score/results; `level-up` and achievement toasts animated but disabled in reduced motion.

## Cockpit Neon (Theme)

- Visuals
  - HUD extras: `#status-lights` (PWR=green solid, LINK=amber pulse, SYS=red pulse) and `#mini-radar` sweep.
  - Bezel overlay: `#cockpit-overlay` with corner screws and top/bottom caution stripes.
  - Digital readouts: `#level-badge` and `#mode-status` values styled as LCD with `Share Tech Mono`.

- Layering
  - `#cockpit-overlay` is absolutely positioned within `.container`, `z-index: 25`, `pointer-events: none`.
  - `#hud` sits above at `z-index: 30`.

- Reduced Motion
  - When `<body>` has `.reduce-motion`, LED pulses stop and scanline effects are disabled.

- Mobile
  - Caution stripes are hidden on small screens (`max-width: 640px`), screws are slightly smaller.

- Accessibility
  - Decorative elements (`#cockpit-overlay`, `#status-lights`, `#mini-radar`) are marked `aria-hidden="true"` and do not intercept input.

- Verification checklist
  - Switch to Theme → "Cockpit Neon"; confirm screws at all four corners and subtle caution stripes near the edges.
  - Confirm LEDs: PWR is steady green; LINK and SYS gently pulse.
  - Toggle Reduce Motion; pulses should stop and visuals remain legible.
  - Resize below 640px width; stripes should hide and layout remain tappable.
