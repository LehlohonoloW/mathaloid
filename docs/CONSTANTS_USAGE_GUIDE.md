# Constants Usage Guide

Quick reference for using the centralized constants in MATHALOID.

---

## Overview

All magic numbers have been extracted to `constants.js` for:
- **Self-documenting code** - Names explain purpose
- **Easy tuning** - Change in one place
- **Consistency** - Single source of truth

---

## Quick Reference

### Game Mode Timing

```javascript
// ❌ Before (magic numbers)
const baseDelay = (currentMode === 'speed') ? 800 : 2000;
modeSession.timeLeft = 60;
modeSession.lives = 3;

// ✅ After (using constants)
const baseDelay = (currentMode === 'speed') 
    ? MODE_CONFIG.SPEED.NEXT_PROBLEM_DELAY_MS 
    : MODE_CONFIG.CLASSIC.NEXT_PROBLEM_DELAY_MS;
modeSession.timeLeft = MODE_CONFIG.SPEED.DURATION_SECONDS;
modeSession.lives = MODE_CONFIG.PUZZLE.INITIAL_LIVES;
```

### Game Balance

```javascript
// ❌ Before
this.pointsToNextLevel = 100;
this.pointsToNextLevel = Math.floor(this.pointsToNextLevel * 1.5);
if (this.streak >= 10 && !this.achievements.streakMaster) { ... }

// ✅ After
this.pointsToNextLevel = GAME_BALANCE.INITIAL_POINTS_TO_LEVEL;
this.pointsToNextLevel = Math.floor(
    this.pointsToNextLevel * GAME_BALANCE.LEVEL_UP_MULTIPLIER
);
if (this.streak >= GAME_BALANCE.STREAK_MASTER_THRESHOLD 
    && !this.achievements.streakMaster) { ... }
```

### UI Timing

```javascript
// ❌ Before
setTimeout(() => notification.classList.add('show'), 100);
setTimeout(() => notification.remove(), 3000);

// ✅ After
setTimeout(() => notification.classList.add('show'), 
    UI_TIMING.ACHIEVEMENT_SLIDE_IN_DELAY_MS);
setTimeout(() => notification.remove(), 
    UI_TIMING.ACHIEVEMENT_DISPLAY_MS);
```

### Audio

```javascript
// ❌ Before
const sounds = {
    correct: new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'),
    // ...
};

// ✅ After
const sounds = {
    correct: new Audio(AUDIO_CONFIG.SOUNDS.CORRECT),
    incorrect: new Audio(AUDIO_CONFIG.SOUNDS.INCORRECT),
    levelUp: new Audio(AUDIO_CONFIG.SOUNDS.LEVEL_UP)
};
```

### Storage

```javascript
// ❌ Before
const STORAGE_KEY = 'mathbot.state.v1';

// ✅ After
const STORAGE_KEY = STORAGE_CONFIG.STATE_KEY;
```

---

## All Available Constants

### MODE_CONFIG
- `MODE_CONFIG.SPEED.DURATION_SECONDS` - Speed mode duration
- `MODE_CONFIG.SPEED.NEXT_PROBLEM_DELAY_MS` - Delay between problems in speed mode
- `MODE_CONFIG.PUZZLE.INITIAL_LIVES` - Starting lives in puzzle mode
- `MODE_CONFIG.STORY.EXPLANATION_EXTRA_DELAY_MS` - Extra delay for story explanations
- `MODE_CONFIG.CLASSIC.NEXT_PROBLEM_DELAY_MS` - Delay between problems in classic mode

### GAME_BALANCE
- `GAME_BALANCE.INITIAL_POINTS_TO_LEVEL` - Points needed for level 2
- `GAME_BALANCE.LEVEL_UP_MULTIPLIER` - Multiplier for each level
- `GAME_BALANCE.DIVISION_DIFFICULTY_FACTOR` - Division problem scaling
- `GAME_BALANCE.QUICK_SOLVER_THRESHOLD_SECONDS` - Time for quick solver achievement
- `GAME_BALANCE.STREAK_MASTER_THRESHOLD` - Streak for streak master achievement
- `GAME_BALANCE.AUTO_DIFFICULTY_INCREASE_STREAK` - Streak for auto difficulty bump
- `GAME_BALANCE.MAX_DIFFICULTY` - Maximum difficulty level
- `GAME_BALANCE.MIN_DIFFICULTY` - Minimum difficulty level
- `GAME_BALANCE.POINTS_PER_DIFFICULTY` - Base points per difficulty
- `GAME_BALANCE.MAX_TIME_BONUS` - Maximum time bonus points
- `GAME_BALANCE.TIME_BONUS_DECAY_RATE` - Points lost per second
- `GAME_BALANCE.STREAK_BONUS_INTERVAL` - Bonus every N correct answers
- `GAME_BALANCE.STREAK_BONUS_POINTS` - Points per streak interval
- `GAME_BALANCE.MAX_SCORING_TIME_SECONDS` - Max time for scoring

### UI_TIMING
- `UI_TIMING.MIN_COUNTDOWN_DISPLAY_MS` - Min delay to show countdown
- `UI_TIMING.COUNTDOWN_UPDATE_INTERVAL_MS` - Countdown refresh rate
- `UI_TIMING.ACHIEVEMENT_DISPLAY_MS` - Achievement notification duration
- `UI_TIMING.ACHIEVEMENT_SLIDE_IN_DELAY_MS` - Achievement slide-in delay
- `UI_TIMING.ACHIEVEMENT_FADE_OUT_MS` - Achievement fade-out duration
- `UI_TIMING.SCORE_ANIMATION_MS` - Score bump animation duration
- `UI_TIMING.LEVEL_BADGE_ANIMATION_MS` - Level badge animation duration
- `UI_TIMING.PROBLEM_FADE_IN_SECONDS` - Problem fade-in (CSS)

### AUDIO_CONFIG
- `AUDIO_CONFIG.SOUNDS.CORRECT` - Correct answer sound URL
- `AUDIO_CONFIG.SOUNDS.INCORRECT` - Incorrect answer sound URL
- `AUDIO_CONFIG.SOUNDS.LEVEL_UP` - Level up sound URL

### STORAGE_CONFIG
- `STORAGE_CONFIG.STATE_KEY` - localStorage key for state

### A11Y_CONFIG
- `A11Y_CONFIG.MIN_INPUT_FONT_SIZE_PX` - Min font size (prevents iOS zoom)
- `A11Y_CONFIG.FOCUS_RING_WIDTH_PX` - Focus ring width
- `A11Y_CONFIG.FOCUS_RING_OFFSET_PX` - Focus ring offset

### PARALLAX_CONFIG
- `PARALLAX_CONFIG.MAX_OFFSET_PX` - Max parallax movement
- `PARALLAX_CONFIG.TRANSITION_DURATION_S` - Parallax transition time

---

## Migration Checklist

When replacing magic numbers:

1. **Find the magic number** in your code
2. **Look up the constant** in this guide
3. **Replace the number** with the constant
4. **Test** to ensure behavior unchanged
5. **Commit** with descriptive message

Example commit message:
```
Replace magic numbers with MODE_CONFIG constants

- Use MODE_CONFIG.SPEED.DURATION_SECONDS instead of 60
- Use MODE_CONFIG.PUZZLE.INITIAL_LIVES instead of 3
- Improves code readability and maintainability
```

---

## Adding New Constants

If you need to add a new constant:

1. **Open** `constants.js`
2. **Find the appropriate section** (or create new)
3. **Add the constant** with descriptive name
4. **Add a comment** explaining WHY (not just what)
5. **Export** if needed (already done for all sections)

Example:
```javascript
const GAME_BALANCE = {
    // ... existing constants ...
    
    // Maximum number of consecutive wrong answers before hint
    // Rationale: Prevents frustration for struggling learners
    MAX_WRONG_BEFORE_HINT: 3,
};
```

---

## Benefits

✅ **Readability**: `MODE_CONFIG.SPEED.DURATION_SECONDS` vs `60`  
✅ **Maintainability**: Change once, affects everywhere  
✅ **Documentation**: Constants are self-documenting  
✅ **Consistency**: No accidental typos (60 vs 600)  
✅ **Tuning**: Easy to experiment with game balance  

---

## Questions?

**Q: Do I have to use constants for everything?**  
A: Use them for values that have meaning. `0`, `1`, `true`, `false` are usually fine as-is.

**Q: What about CSS values?**  
A: CSS can use CSS custom properties (already done). Constants.js is for JavaScript.

**Q: Can I change a constant value?**  
A: Yes! That's the point. Just edit `constants.js` and test.

**Q: What if I disagree with a constant name?**  
A: Rename it! Just update all usages. Good names are important.

---

**Last updated**: 2025-11-21  
**See also**: `CONTINUOUS_IMPROVEMENT_PLAN.md`, `improved_dev_rules.md`
