# Troubleshooting

## CSS/JS not loading
- Verify filenames in `index.html` match actual files.
- Use `styles.css`, `mathbot.js`, and `app.js` after refactor.

## Sounds not playing
- Browser blocks autoplay: play only on user interaction and catch errors.

## Progress not saving
- Check LocalStorage for `mathbot.state.v1`.
- If corrupted, delete and refresh to reset.

## Duplicate MathBot definitions
- Ensure only `mathbot.js` is loaded (remove older duplicate includes).

## Cockpit overlays not visible
- Ensure Theme → "Cockpit Neon" is selected (check `<body>` has `theme-cockpit`).
- Verify CSS loaded and `#cockpit-overlay` is present inside `.container` with `pointer-events: none`.
- Layering: overlay `z-index: 25` and `#hud` `z-index: 30`.
- On mobile (<640px), caution stripes are hidden by design.

## HUD LEDs not pulsing
- Check Reduce Motion: if enabled, pulses are intentionally disabled.
- Verify `#status-lights` exists (only shown in cockpit theme).

## Progress Update - 2026-02-25

- Upgraded core UI to a more immersive, tactile experience with improved interaction feedback and motion.
- Added Learning Coach enhancements, dynamic hinting, and stronger educational reinforcement during gameplay.
- Implemented richer game-feel systems: combo indicator, celebratory effects, step-by-step solution reveal, and smarter mascot messaging.
- Expanded progress UX with operation mastery tracking, extended achievements, and clearer performance indicators.
- Improved accessibility and control reliability (reduce-motion handling, keyboard flow, and verified button behavior).
- Added in-UI footer credit: Powered by Lehro Solutions, with increased visibility styling.
