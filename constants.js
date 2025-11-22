/**
 * MATHALOID Configuration Constants
 * ----------------------------------
 * Central location for all game balance and timing constants.
 * 
 * Per improved_dev_rules.md rule #75: "Avoid magic numbers; use named constants"
 * 
 * Rationale: Having constants in one place makes the game easier to tune,
 * self-documents the code, and provides a single source of truth.
 */

// ============================================================================
// MODE CONFIGURATION
// ============================================================================

const MODE_CONFIG = {
    SPEED: {
        // Duration of speed mode session in seconds
        DURATION_SECONDS: 60,
        // Delay before showing next problem (faster pace)
        NEXT_PROBLEM_DELAY_MS: 800
    },
    PUZZLE: {
        // Number of lives player starts with
        INITIAL_LIVES: 3
    },
    STORY: {
        // Extra delay to give learners time to read explanations
        // Rationale: Story mode prioritizes learning over speed
        EXPLANATION_EXTRA_DELAY_MS: 14000
    },
    CLASSIC: {
        // Standard delay between problems
        NEXT_PROBLEM_DELAY_MS: 2000
    }
};

// ============================================================================
// GAME BALANCE CONSTANTS
// ============================================================================

const GAME_BALANCE = {
    // Initial points required to reach level 2
    INITIAL_POINTS_TO_LEVEL: 100,
    
    // Multiplier for points needed at each level
    // Example: Level 2→3 needs 150 points, 3→4 needs 225, etc.
    LEVEL_UP_MULTIPLIER: 1.5,
    
    // Factor for division problem difficulty scaling
    // Higher = easier division problems (smaller divisors)
    DIVISION_DIFFICULTY_FACTOR: 3,
    
    // Time threshold (seconds) for "Quick Solver" achievement
    QUICK_SOLVER_THRESHOLD_SECONDS: 3,
    
    // Streak length required for "Streak Master" achievement
    STREAK_MASTER_THRESHOLD: 10,
    
    // Streak length that triggers automatic difficulty increase
    AUTO_DIFFICULTY_INCREASE_STREAK: 5,
    
    // Maximum difficulty level (UI enforced)
    MAX_DIFFICULTY: 5,
    
    // Minimum difficulty level
    MIN_DIFFICULTY: 1,
    
    // Points awarded per difficulty level (base multiplier)
    POINTS_PER_DIFFICULTY: 10,
    
    // Maximum time bonus points
    MAX_TIME_BONUS: 50,
    
    // Time bonus decay rate (points per second)
    TIME_BONUS_DECAY_RATE: 10,
    
    // Streak bonus interval (bonus awarded every N correct answers)
    STREAK_BONUS_INTERVAL: 5,
    
    // Points awarded per streak interval
    STREAK_BONUS_POINTS: 10,
    
    // Maximum time to consider for scoring (prevents clock drift issues)
    MAX_SCORING_TIME_SECONDS: 60
};

// ============================================================================
// UI TIMING CONSTANTS
// ============================================================================

const UI_TIMING = {
    // Minimum delay to show countdown UI (milliseconds)
    // Rationale: Don't show countdown for very short delays
    MIN_COUNTDOWN_DISPLAY_MS: 1000,
    
    // Countdown update interval (milliseconds)
    COUNTDOWN_UPDATE_INTERVAL_MS: 250,
    
    // Achievement notification display duration (milliseconds)
    ACHIEVEMENT_DISPLAY_MS: 3000,
    
    // Achievement notification slide-in delay (milliseconds)
    ACHIEVEMENT_SLIDE_IN_DELAY_MS: 100,
    
    // Achievement notification fade-out duration (milliseconds)
    ACHIEVEMENT_FADE_OUT_MS: 500,
    
    // Score animation duration (milliseconds)
    SCORE_ANIMATION_MS: 1000,
    
    // Level badge animation duration (milliseconds)
    LEVEL_BADGE_ANIMATION_MS: 1000,
    
    // Problem fade-in animation duration (seconds, used in CSS)
    PROBLEM_FADE_IN_SECONDS: 0.5
};

// ============================================================================
// AUDIO CONFIGURATION
// ============================================================================

const AUDIO_CONFIG = {
    // Sound effect URLs (using free Mixkit library)
    SOUNDS: {
        CORRECT: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
        INCORRECT: 'https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3',
        LEVEL_UP: 'https://assets.mixkit.co/active_storage/sfx/2002/2002-preview.mp3'
    }
};

// ============================================================================
// STORAGE CONFIGURATION
// ============================================================================

const STORAGE_CONFIG = {
    // localStorage key for persisted state
    // Rationale: Versioned key allows for future migrations
    STATE_KEY: 'mathbot.state.v1'
};

// ============================================================================
// ACCESSIBILITY CONSTANTS
// ============================================================================

const A11Y_CONFIG = {
    // Minimum font size for mobile inputs (prevents iOS zoom)
    MIN_INPUT_FONT_SIZE_PX: 16,
    
    // Focus ring width (pixels)
    FOCUS_RING_WIDTH_PX: 3,
    
    // Focus ring offset (pixels)
    FOCUS_RING_OFFSET_PX: 2
};

// ============================================================================
// PARALLAX CONFIGURATION
// ============================================================================

const PARALLAX_CONFIG = {
    // Maximum parallax offset (pixels)
    // Rationale: Subtle movement; too much causes motion sickness
    MAX_OFFSET_PX: 20,
    
    // Parallax transition duration (seconds)
    TRANSITION_DURATION_S: 0.2
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.MODE_CONFIG = MODE_CONFIG;
    window.GAME_BALANCE = GAME_BALANCE;
    window.UI_TIMING = UI_TIMING;
    window.AUDIO_CONFIG = AUDIO_CONFIG;
    window.STORAGE_CONFIG = STORAGE_CONFIG;
    window.A11Y_CONFIG = A11Y_CONFIG;
    window.PARALLAX_CONFIG = PARALLAX_CONFIG;
}
