# Game Modes (MVP Plan)

## Speed Mode

Implemented (MVP):
- 60-second countdown session.
- New problem presented automatically ~800ms after answering.
- Session ends when timer hits 0; UI shows message and reverts to Classic.

Notes/Future Enhancements:
- Consider separate speed scoring and streak handling during time pressure.
- Persist best score/time for leaderboards.

## Puzzle Mode

Implemented (MVP):
- 3 lives per session; lose 1 on incorrect answer.
- Session ends when lives reach 0; UI shows message and reverts to Classic.

Notes/Future Enhancements:
- Progressive complexity (e.g., larger ranges, multi-step sequences).
- Hints system; optional limited skips.

## Story Mode

Implemented (MVP):
- Always shows an explanation for every answer (correct and incorrect).
- After correct answers, the next problem is delayed by an extra ~7s to let the explanation sink in (base ~2s + 7s in Story = ~9s total).
- During the wait, inputs are locked to prevent double submits, and a "Next in …" countdown with a "Skip now" button is shown.

Notes/Future Enhancements:
- Consider Story-specific scoring that prioritizes learning (e.g., smaller time bonus, more consistency bonus).

## Future Ideas
- Custom practice sets (multiplication only, division only).
- Daily challenges and streak preservation across days.

## Progress Update - 2026-02-25

- Upgraded core UI to a more immersive, tactile experience with improved interaction feedback and motion.
- Added Learning Coach enhancements, dynamic hinting, and stronger educational reinforcement during gameplay.
- Implemented richer game-feel systems: combo indicator, celebratory effects, step-by-step solution reveal, and smarter mascot messaging.
- Expanded progress UX with operation mastery tracking, extended achievements, and clearer performance indicators.
- Improved accessibility and control reliability (reduce-motion handling, keyboard flow, and verified button behavior).
- Added in-UI footer credit: Powered by Lehro Solutions, with increased visibility styling.
