# MATHALOID Continuous Improvement Plan

**Date**: 2025-11-21  
**Based on**: `improved_dev_rules.md` Engineering Playbook  
**Status**: Active Development

---

## Executive Summary

The MATHALOID application is **functionally complete and well-architected**. This plan identifies opportunities to enhance code quality, maintainability, and adherence to the engineering playbook without breaking existing functionality.

### Current State Assessment ✅

**Strengths:**
- ✅ Clean separation of concerns (`mathbot.js` = logic, `app.js` = UI)
- ✅ Excellent accessibility (ARIA, keyboard navigation, screen reader support)
- ✅ Robust state persistence with defensive error handling
- ✅ Well-documented codebase with comprehensive deepwiki
- ✅ Multiple themes and accessibility features (reduce motion, color-blind mode)
- ✅ No TODOs or FIXMEs in codebase

**Areas for Enhancement:**
- 🔧 Some functions exceed the 40-50 line guideline
- 🔧 Magic numbers could be extracted to named constants
- 🔧 Opportunity to add inline comments for "why" not "what"
- 🔧 Can improve testability with smaller, more focused functions

---

## Improvement Initiatives

### Priority 1: Function Size Optimization

**Problem**: Per playbook rule #76: "No function > 40–50 lines unless clearly justified"

**Current violations:**
1. `checkAnswer()` in `app.js` (~67 lines)
2. `resetGameState()` in `app.js` (~38 lines, borderline)
3. `initTabs()` in `app.js` (~67 lines)
4. `scheduleNextProblem()` in `app.js` (~27 lines, acceptable)

**Proposed refactoring:**

#### 1.1 Extract `checkAnswer()` sub-functions
```javascript
// Current: 67 lines monolithic function
// Proposed: Break into focused helpers

function checkAnswer() {
    if (awaitingNext) return;
    
    const result = validateAndCheckAnswer();
    if (!result) return; // Early return for validation errors
    
    if (result.correct) {
        handleCorrectAnswer(result);
    } else {
        handleIncorrectAnswer(result);
    }
    
    finalizeAnswer(result);
}

function validateAndCheckAnswer() { /* 10 lines */ }
function handleCorrectAnswer(result) { /* 15 lines */ }
function handleIncorrectAnswer(result) { /* 15 lines */ }
function finalizeAnswer(result) { /* 8 lines */ }
```

**Benefits:**
- Each function has single responsibility
- Easier to test individual behaviors
- More readable and maintainable
- Follows playbook guidelines

---

### Priority 2: Extract Magic Numbers to Named Constants

**Problem**: Per playbook rule #75: "Avoid magic numbers; use named constants"

**Current magic numbers:**

```javascript
// app.js
const baseDelay = (currentMode === 'speed') ? 800 : 2000;  // Line 520
const extraDelay = (currentMode === 'story') ? 14000 : 0;  // Line 649
modeSession.timeLeft = 60;  // Line 434
modeSession.lives = 3;  // Line 452

// mathbot.js
this.pointsToNextLevel = 100;  // Line 30
const maxDivisor = Math.max(1, Math.floor(3 * this.difficulty));  // Line 179
if (timeTakenSeconds < 3 && !this.achievements.quickSolver)  // Line 259
if (this.streak >= 10 && !this.achievements.streakMaster)  // Line 255
```

**Proposed solution:**

```javascript
// At top of app.js - Mode Configuration Constants
const MODE_CONFIG = {
    SPEED: {
        DURATION_SECONDS: 60,
        NEXT_PROBLEM_DELAY_MS: 800
    },
    PUZZLE: {
        INITIAL_LIVES: 3
    },
    STORY: {
        EXPLANATION_EXTRA_DELAY_MS: 14000
    },
    CLASSIC: {
        NEXT_PROBLEM_DELAY_MS: 2000
    }
};

// At top of mathbot.js - Game Balance Constants
const GAME_BALANCE = {
    INITIAL_POINTS_TO_LEVEL: 100,
    LEVEL_UP_MULTIPLIER: 1.5,
    DIVISION_DIFFICULTY_FACTOR: 3,
    QUICK_SOLVER_THRESHOLD_SECONDS: 3,
    STREAK_MASTER_THRESHOLD: 10,
    AUTO_DIFFICULTY_INCREASE_STREAK: 5
};
```

**Benefits:**
- Self-documenting code
- Easy to tune game balance
- Single source of truth for configuration
- Follows playbook best practices

---

### Priority 3: Add "Why" Comments for Non-Obvious Code

**Problem**: Per playbook rule #221: "Prefer short rationale comments near non-obvious code"

**Examples needing rationale:**

```javascript
// app.js line 479 - Why trigger reflow?
void problemContainer.offsetHeight;

// app.js line 272 - Why consume achievement?
this.achievements[name] = false;

// mathbot.js line 196 - Why swap?
if (operation === '-' && num2 > num1) {
    [num1, num2] = [num2, num1];
}
```

**Proposed additions:**

```javascript
// Force browser reflow to restart CSS animation from beginning
void problemContainer.offsetHeight;

// Mark achievement as "reported" to prevent duplicate notifications
// Long-term trophy state is preserved in localStorage
this.achievements[name] = false;

// Ensure non-negative results for friendlier learning experience
// (avoiding negative numbers for beginner difficulty levels)
if (operation === '-' && num2 > num1) {
    [num1, num2] = [num2, num1];
}
```

---

### Priority 4: Improve Testability

**Problem**: Functions are currently tightly coupled to DOM and global state

**Proposed improvements:**

#### 4.1 Make MathBot methods more testable
```javascript
// Current: Uses Date.now() internally
checkAnswer(problem, userAnswer, options = {})

// Already good! Accepts optional timestamp for testing
const now = typeof options.now === 'number' ? options.now : Date.now();
```

#### 4.2 Extract pure functions from app.js
```javascript
// Extract calculation logic from UI logic
function calculateNextProblemDelay(mode, isStoryMode) {
    const baseDelay = mode === 'speed' 
        ? MODE_CONFIG.SPEED.NEXT_PROBLEM_DELAY_MS 
        : MODE_CONFIG.CLASSIC.NEXT_PROBLEM_DELAY_MS;
    const extraDelay = isStoryMode 
        ? MODE_CONFIG.STORY.EXPLANATION_EXTRA_DELAY_MS 
        : 0;
    return baseDelay + extraDelay;
}

// Pure function - easy to test
function formatProgressPercentage(score, pointsToNextLevel) {
    const ratio = pointsToNextLevel > 0 ? score / pointsToNextLevel : 0;
    return Math.max(0, Math.min(100, ratio * 100));
}
```

---

### Priority 5: Enhance Error Handling

**Problem**: Some error cases could be more explicit

**Current:**
```javascript
try { a.currentTime = 0; } catch (_) {}
```

**Proposed:**
```javascript
try { 
    a.currentTime = 0; 
} catch (err) {
    // Ignore DOMException: some browsers restrict audio manipulation
    // before user interaction. This is expected and handled by primeAudio()
}
```

---

### Priority 6: Performance Micro-Optimizations

**Opportunities:**

#### 6.1 Debounce parallax updates (already using RAF ✅)
```javascript
// Current implementation is already optimal with requestAnimationFrame
// No changes needed
```

#### 6.2 Cache DOM queries
```javascript
// Current: Re-queries on every call
const problemContainer = document.querySelector('.problem-container');

// Proposed: Cache in elements object
elements.problemContainer = document.querySelector('.problem-container');
```

---

### Priority 7: Accessibility Enhancements

**Opportunities:**

#### 7.1 Add more descriptive aria-labels
```javascript
// Current
<button id="skip-next">Skip now</button>

// Enhanced
<button id="skip-next" aria-label="Skip waiting period and show next problem immediately">
    Skip now
</button>
```

#### 7.2 Announce mode changes
```javascript
// Add aria-live announcement when mode changes
function updateModeUI() {
    // ... existing code ...
    
    // Announce to screen readers
    const announcement = document.getElementById('mode-announcement');
    if (announcement) {
        announcement.textContent = `Switched to ${label}`;
    }
}
```

---

## Implementation Roadmap

### Phase 1: Non-Breaking Improvements (Week 1)
- [ ] Extract magic numbers to named constants
- [ ] Add "why" comments to non-obvious code
- [ ] Cache frequently-used DOM queries
- [ ] Enhance error handling comments

**Risk**: None - purely additive changes  
**Testing**: Manual smoke test of all modes

### Phase 2: Function Refactoring (Week 2)
- [ ] Refactor `checkAnswer()` into smaller functions
- [ ] Refactor `initTabs()` into smaller functions
- [ ] Extract pure calculation functions

**Risk**: Low - preserve existing behavior  
**Testing**: Thorough testing of all game modes and edge cases

### Phase 3: Enhanced Accessibility (Week 3)
- [ ] Add mode change announcements
- [ ] Enhance aria-labels
- [ ] Add keyboard shortcut documentation

**Risk**: None - purely additive  
**Testing**: Screen reader testing, keyboard-only testing

---

## Success Criteria

- ✅ All functions under 50 lines (except where justified with comment)
- ✅ No magic numbers in business logic
- ✅ All non-obvious code has "why" comments
- ✅ Existing functionality unchanged
- ✅ All tests pass (manual checklist from playbook)
- ✅ No new console errors or warnings
- ✅ Performance unchanged or improved

---

## Out of Scope

Per the playbook and current project phase:

- ❌ Unit test framework (mentioned in IMPROVEMENT_PLAN.md as out of scope)
- ❌ Build pipeline or bundling
- ❌ i18n/localization
- ❌ Backend integration
- ❌ Advanced curriculum generation

---

## Maintenance Notes

**Review frequency**: Quarterly  
**Owner**: Development team  
**Last reviewed**: 2025-11-21

**Playbook compliance checklist:**
- [x] Optimizes for learners (fast, accessible, playful)
- [x] Optimizes for maintainers (small modules, clear structure)
- [x] Optimizes for safety (no surprise audio/motion, accessibility)
- [x] Functions under 50 lines (after Phase 2)
- [x] Named constants instead of magic numbers (after Phase 1)
- [x] "Why" comments for non-obvious code (after Phase 1)
- [x] No framework lock-in (vanilla JS/HTML/CSS)
- [x] Defensive state persistence
- [x] ARIA-correct tabs and modes
- [x] Keyboard-first navigation
- [x] Screen-reader friendly

---

**Next review date**: 2026-02-21
