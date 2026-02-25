const mathBot = new MathBot();
let currentProblem = null;

const elements = {
    num1: document.getElementById('num1'),
    num2: document.getElementById('num2'),
    operation: document.getElementById('operation'),
    answer: document.getElementById('answer'),
    submit: document.getElementById('submit'),
    score: document.getElementById('score-display'),
    result: document.getElementById('result'),
    difficultySlider: document.getElementById('difficulty-slider'),
    difficultyValue: document.getElementById('difficulty-value'),
    currentLevel: document.getElementById('current-level'),
    currentStreak: document.getElementById('current-streak'),
    accuracyRate: document.getElementById('accuracy-rate'),
    progressFill: document.getElementById('progress-fill'),
    pointsNeeded: document.getElementById('points-needed'),
    // HUD XP bar
    hudProgressBar: document.getElementById('hud-progress-bar'),
    hudProgressFill: document.getElementById('hud-progress-fill'),
    levelBadge: document.getElementById('level-badge'),
    // Mode status UI
    currentModeLabel: document.getElementById('current-mode'),
    modeTimer: document.getElementById('mode-timer'),
    timerValue: document.getElementById('timer-value'),
    modeLives: document.getElementById('mode-lives'),
    livesValue: document.getElementById('lives-value'),
    // Mode buttons
    speedModeBtn: document.getElementById('speed-mode'),
    puzzleModeBtn: document.getElementById('puzzle-mode'),
    storyModeBtn: document.getElementById('story-mode'),
    // Post-answer controls
    postAnswerControls: document.getElementById('post-answer-controls'),
    nextCountdown: document.getElementById('next-countdown'),
    skipNext: document.getElementById('skip-next'),
    // Accessibility
    reduceMotion: document.getElementById('reduce-motion'),
    // Theme controls (Abyssal Interface has one committed aesthetic)
    // cbSafeToggle: document.getElementById('cb-safe-toggle'),
    // Mode group container
    modeGroup: document.getElementById('game-mode'),
    // Notices
    audioWarning: document.getElementById('audio-warning'),
    showHint: document.getElementById('show-hint'),
    coachOperation: document.getElementById('coach-operation'),
    coachPrompt: document.getElementById('coach-prompt'),
    coachFeedback: document.getElementById('coach-feedback'),
    // Combo
    comboDisplay: document.getElementById('combo-display'),
    comboCount: document.getElementById('combo-count'),
    // Step solution
    stepSolution: document.getElementById('step-solution'),
    stepSolutionBody: document.getElementById('step-solution-body'),
    // Fun fact
    funFact: document.getElementById('fun-fact'),
    funFactText: document.getElementById('fun-fact-text'),
    // Particles
    particles: document.getElementById('particles'),
    // Mastery
    masteryAdd: document.getElementById('mastery-add'),
    masterySub: document.getElementById('mastery-sub'),
    masteryMul: document.getElementById('mastery-mul'),
    masteryDiv: document.getElementById('mastery-div'),
    masteryAddPct: document.getElementById('mastery-add-pct'),
    masterySubPct: document.getElementById('mastery-sub-pct'),
    masteryMulPct: document.getElementById('mastery-mul-pct'),
    masteryDivPct: document.getElementById('mastery-div-pct'),
    // Stats
    totalSolved: document.getElementById('total-solved'),
    bestStreak: document.getElementById('best-streak'),
    // Speech
    quoteText: document.getElementById('quote-text')
};

const sessionStats = {
    attempts: 0,
    correct: 0,
    bestStreak: 0,
    hintUsed: false,
    speedSolved: 0,
    opStats: { '+': { attempts: 0, correct: 0 }, '-': { attempts: 0, correct: 0 }, '*': { attempts: 0, correct: 0 }, '/': { attempts: 0, correct: 0 } }
};

// ============================================================
// BRAIN: Smart Mascot Quotes
// ============================================================
const mascotBrain = {
    greetings: [
        "Let's crush some numbers! 💪",
        "Your brain is warming up... 🧠",
        "Math mode: ACTIVATED! 🚀",
        "Ready to level up today? ⭐",
        "Numbers fear you. Let's go! 🔥"
    ],
    correctResponses: [
        "BOOM! You nailed it! 🎉",
        "Genius move! Keep going! 🧠",
        "On fire! Unstoppable! 🔥",
        "That's the magic! ✨",
        "Your brain just grew 10%! 📈",
        "Flawless! 💎",
        "Math wizard alert! 🧙"
    ],
    incorrectResponses: [
        "Almost! Let's learn from this 📝",
        "Mistakes grow brains! 🌱",
        "Not yet—but you're closer! 🎯",
        "Great attempt, try the hint! 💡",
        "Even geniuses miss sometimes 😉"
    ],
    streakMessages: [
        [3, "Triple combo! Nice! 🌟"],
        [5, "FIVE in a row!! 🌟🌟"],
        [7, "LEGENDARY streak! 👑"],
        [10, "UNSTOPPABLE! 10 streak! 🔥🔥🔥"]
    ],
    getGreeting() {
        return this.greetings[Math.floor(Math.random() * this.greetings.length)];
    },
    getCorrect(streak) {
        for (let i = this.streakMessages.length - 1; i >= 0; i--) {
            if (streak >= this.streakMessages[i][0]) return this.streakMessages[i][1];
        }
        return this.correctResponses[Math.floor(Math.random() * this.correctResponses.length)];
    },
    getIncorrect() {
        return this.incorrectResponses[Math.floor(Math.random() * this.incorrectResponses.length)];
    }
};

// ============================================================
// FUN MATH FACTS
// ============================================================
const mathFunFacts = [
    "Zero is the only number that can't be represented in Roman numerals.",
    "A 'googol' is 1 followed by 100 zeros — bigger than atoms in the universe!",
    "111,111,111 × 111,111,111 = 12345678987654321. Palindrome magic!",
    "The word 'hundred' comes from the Norse word 'hundrath', which meant 120.",
    "If you shuffle a deck of cards, the order has likely never existed before.",
    "Pythagoras' followers believed odd numbers were male and even were female.",
    "A pizza with radius 'z' and height 'a' has volume: Pi × z × z × a.",
    "Every odd number has the letter 'e' in its name (one, three, five...).",
    "2520 is the smallest number divisible by 1 through 10.",
    "Multiplying by 9? The digits of the answer always add up to 9!",
    "The equals sign (=) was invented in 1557 by Robert Recorde.",
    "Bees build hexagonal honeycombs because hexagons use the least wax.",
    "Ancient Egyptians used math to build the pyramids with incredible precision."
];
function getRandomFact() {
    return mathFunFacts[Math.floor(Math.random() * mathFunFacts.length)];
}

// ============================================================
// PARTICLE CELEBRATION SYSTEM
// ============================================================
function spawnParticles(count) {
    const container = elements.particles;
    if (!container || isReducedMotion) return;
    const colors = ['#22D3EE', '#A78BFA', '#F59E0B', '#10B981', '#EC4899', '#FB7185'];
    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        const isStar = Math.random() > 0.5;
        el.className = isStar ? 'particle particle-star' : 'particle';
        const size = 6 + Math.random() * 10;
        el.style.width = size + 'px';
        el.style.height = size + 'px';
        el.style.background = colors[Math.floor(Math.random() * colors.length)];
        el.style.left = cx + 'px';
        el.style.top = cy + 'px';
        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 120;
        el.style.setProperty('--px', Math.cos(angle) * dist + 'px');
        el.style.setProperty('--py', Math.sin(angle) * dist + 'px');
        el.style.animationDuration = (0.5 + Math.random() * 0.5) + 's';
        container.appendChild(el);
        setTimeout(() => el.remove(), 1200);
    }
}

// ============================================================
// POINTS FLOAT-UP
// ============================================================
function showPointsFloat(points) {
    if (isReducedMotion) return;
    const el = document.createElement('div');
    el.className = 'points-float';
    el.textContent = `+${points}`;
    const btn = elements.submit;
    if (btn) {
        const r = btn.getBoundingClientRect();
        const parent = btn.offsetParent || document.body;
        const pr = parent.getBoundingClientRect();
        el.style.left = (r.left - pr.left + r.width / 2 - 20) + 'px';
        el.style.top = (r.top - pr.top - 10) + 'px';
        parent.style.position = 'relative';
        parent.appendChild(el);
    } else {
        document.body.appendChild(el);
    }
    setTimeout(() => el.remove(), 1100);
}

// ============================================================
// STEP-BY-STEP SOLUTION GENERATOR
// ============================================================
function showStepSolution(problem, correctAnswer) {
    const el = elements.stepSolution;
    const body = elements.stepSolutionBody;
    if (!el || !body) return;
    body.innerHTML = '';
    const { num1, num2, operation } = problem;
    const steps = [];
    if (operation === '+') {
        steps.push(`Start with ${num1}`);
        steps.push(`Add ${num2} to it`);
        steps.push(`${num1} + ${num2} = ${correctAnswer}`);
    } else if (operation === '-') {
        steps.push(`Start with ${num1}`);
        steps.push(`Take away ${num2}`);
        steps.push(`${num1} \u2212 ${num2} = ${correctAnswer}`);
    } else if (operation === '*') {
        steps.push(`${num1} groups of ${num2}`);
        if (num1 <= 5) {
            const parts = [];
            for (let i = 0; i < num1; i++) parts.push(num2);
            steps.push(parts.join(' + ') + ` = ${correctAnswer}`);
        } else {
            steps.push(`${num1} \u00d7 ${num2} = ${correctAnswer}`);
        }
    } else if (operation === '/') {
        steps.push(`How many groups of ${num2} in ${num1}?`);
        steps.push(`${num2} \u00d7 ${correctAnswer} = ${num1}`);
        steps.push(`So ${num1} \u00f7 ${num2} = ${correctAnswer}`);
    }
    steps.forEach((text, i) => {
        const span = document.createElement('span');
        span.className = 'step-line';
        span.textContent = text;
        span.style.animationDelay = (i * 0.3) + 's';
        body.appendChild(span);
    });
    el.hidden = false;
}

function hideStepSolution() {
    if (elements.stepSolution) elements.stepSolution.hidden = true;
}

// ============================================================
// FUN FACT DISPLAY
// ============================================================
function showFunFact() {
    if (elements.funFact && elements.funFactText) {
        elements.funFactText.textContent = getRandomFact();
        elements.funFact.hidden = false;
    }
}
function hideFunFact() {
    if (elements.funFact) elements.funFact.hidden = true;
}

// ============================================================
// COMBO DISPLAY
// ============================================================
function updateCombo(streak) {
    if (!elements.comboDisplay || !elements.comboCount) return;
    if (streak >= 2) {
        elements.comboCount.textContent = streak;
        elements.comboDisplay.hidden = false;
        // Re-trigger animation
        elements.comboDisplay.style.animation = 'none';
        void elements.comboDisplay.offsetHeight;
        elements.comboDisplay.style.animation = 'comboPopIn 0.4s var(--bounce-press)';
    } else {
        elements.comboDisplay.hidden = true;
    }
}

// ============================================================
// MASTERY TRACKING
// ============================================================
function updateMastery() {
    const ops = ['+', '-', '*', '/'];
    const ids = {
        '+': { bar: elements.masteryAdd, pct: elements.masteryAddPct },
        '-': { bar: elements.masterySub, pct: elements.masterySubPct },
        '*': { bar: elements.masteryMul, pct: elements.masteryMulPct },
        '/': { bar: elements.masteryDiv, pct: elements.masteryDivPct }
    };
    for (const op of ops) {
        const s = sessionStats.opStats[op];
        const pct = s.attempts ? Math.round((s.correct / s.attempts) * 100) : 0;
        if (ids[op].bar) ids[op].bar.style.width = pct + '%';
        if (ids[op].pct) ids[op].pct.textContent = pct + '%';
    }
}

// ============================================================
// SMART MASCOT SPEECH
// ============================================================
function updateMascot(text) {
    if (elements.quoteText) elements.quoteText.textContent = text;
}

// ============================================================
// NUMBER FLIP ANIMATION
// ============================================================
function animateEquation() {
    if (isReducedMotion) return;
    [elements.num1, elements.num2, elements.operation].forEach((el, i) => {
        if (!el) return;
        el.classList.remove('num-flip');
        void el.offsetHeight;
        el.style.animationDelay = (i * 0.1) + 's';
        el.classList.add('num-flip');
    });
}

// Sound effects
const sounds = {
    correct: new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'),
    incorrect: new Audio('https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3'),
    levelUp: new Audio('https://assets.mixkit.co/active_storage/sfx/2002/2002-preview.mp3')
};

let audioBlocked = false;
function playSound(key) {
    if (isMuted) return;
    const a = sounds[key];
    if (!a) return;
    try { a.currentTime = 0; } catch (_) { }
    a.play().then(() => {
        audioBlocked = false;
        if (elements.audioWarning) elements.audioWarning.hidden = true;
    }).catch(() => {
        audioBlocked = true;
        if (elements.audioWarning) elements.audioWarning.hidden = false;
    });
}

// Attempt to unlock audio on first user gesture
let audioPrimed = false;
function primeAudio() {
    if (audioPrimed || isMuted) return;
    const a = sounds.correct;
    if (!a) return;
    a.play().then(() => {
        try { a.pause(); a.currentTime = 0; } catch (_) { }
        audioPrimed = true;
        audioBlocked = false;
        if (elements.audioWarning) elements.audioWarning.hidden = true;
    }).catch(() => {
        audioBlocked = true;
        if (elements.audioWarning) elements.audioWarning.hidden = false;
    });
}

// --- Parallax effect helpers ---
let parallaxEnabled = false;
let parallaxHandler = null;
let parallaxRAF = null;
let parallaxLast = null;

function enableParallax() {
    if (parallaxEnabled) return;
    parallaxEnabled = true;
    // Use mousemove to drive CSS variables. Safe no-op if CSS doesn't consume them.
    parallaxHandler = (e) => {
        parallaxLast = { x: e.clientX, y: e.clientY };
        if (parallaxRAF) return;
        parallaxRAF = requestAnimationFrame(() => {
            parallaxRAF = null;
            if (!parallaxLast) return;
            const nx = (parallaxLast.x / window.innerWidth) - 0.5; // -0.5..0.5
            const ny = (parallaxLast.y / window.innerHeight) - 0.5;
            const px = (nx * 20).toFixed(2) + 'px';
            const py = (ny * 20).toFixed(2) + 'px';
            document.documentElement.style.setProperty('--parallaxX', px);
            document.documentElement.style.setProperty('--parallaxY', py);
        });
    };
    window.addEventListener('mousemove', parallaxHandler);
}

function disableParallax() {
    if (!parallaxEnabled) return;
    parallaxEnabled = false;
    if (parallaxHandler) {
        window.removeEventListener('mousemove', parallaxHandler);
        parallaxHandler = null;
    }
    if (parallaxRAF) {
        cancelAnimationFrame(parallaxRAF);
        parallaxRAF = null;
    }
    parallaxLast = null;
    // Clear variables so layout returns to default
    document.documentElement.style.removeProperty('--parallaxX');
    document.documentElement.style.removeProperty('--parallaxY');
}

// --- Mode keyboard navigation ---
function initModeKeyboardNav() {
    const group = elements.modeGroup;
    if (!group) return;
    const buttons = [elements.speedModeBtn, elements.puzzleModeBtn, elements.storyModeBtn].filter(Boolean);
    if (!buttons.length) return;

    // Roving tabindex: only one focusable at a time
    buttons.forEach((b, i) => b.setAttribute('tabindex', i === 0 ? '0' : '-1'));
    let idx = 0;
    const focusAt = (i) => {
        idx = (i + buttons.length) % buttons.length;
        buttons.forEach((b, j) => b.setAttribute('tabindex', j === idx ? '0' : '-1'));
        buttons[idx].focus();
    };

    group.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault();
                focusAt(idx + 1);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                focusAt(idx - 1);
                break;
            case 'Home':
                e.preventDefault();
                focusAt(0);
                break;
            case 'End':
                e.preventDefault();
                focusAt(buttons.length - 1);
                break;
            case ' ': // Space
            case 'Enter':
                e.preventDefault();
                buttons[idx].click();
                break;
        }
    });

    // If a button is marked pressed, start from that one
    const pressed = buttons.findIndex(b => b.getAttribute('aria-pressed') === 'true');
    if (pressed >= 0) focusAt(pressed);
}

// Controls (mute/reset)
elements.muteToggle = document.getElementById('mute-toggle');
elements.resetProgress = document.getElementById('reset-progress');
let isMuted = false;
let isReducedMotion = false;
let currentTheme = 'default'; // default | holo | solar | cockpit
let cbSafe = false; // color-blind safe palette

// Achievement messages
const achievementMessages = {
    streakMaster: "🏆 Streak Master: 10 correct answers in a row!",
    quickSolver: "⚡ Quick Solver: Answered in under 3 seconds!",
    diverseMaster: "🎯 Operation Master: Mastered all operations!",
    centurion: "💎 Centurion: Scored 1000 total points!",
    perfectRound: "🌟 Perfect Round: 5 correct with no hints!",
    speedDemon: "🚀 Speed Demon: 10 speed mode problems solved!"
};

// Persistence
const STORAGE_KEY = 'mathbot.state.v1';
let activeTabId = 'panel-play'; // persisted

function saveState() {
    try {
        const state = {
            difficulty: mathBot.difficulty,
            score: mathBot.score,
            streak: mathBot.streak,
            level: mathBot.level,
            pointsToNextLevel: mathBot.pointsToNextLevel,
            achievements: mathBot.achievements,
            operationsUsed: Array.from(mathBot.operationsUsed || []),
            muted: isMuted,
            reducedMotion: isReducedMotion,
            activeTab: activeTabId,
            theme: currentTheme,
            cbSafe: cbSafe
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
        // ignore write errors (e.g., storage full or disabled)
    }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const s = JSON.parse(raw);
        if (typeof s !== 'object' || s === null) return;
        if (typeof s.difficulty === 'number') mathBot.difficulty = s.difficulty;
        if (typeof s.score === 'number') mathBot.score = s.score;
        if (typeof s.streak === 'number') mathBot.streak = s.streak;
        if (typeof s.level === 'number') mathBot.level = s.level;
        if (typeof s.pointsToNextLevel === 'number') mathBot.pointsToNextLevel = s.pointsToNextLevel;
        if (s.achievements && typeof s.achievements === 'object') mathBot.achievements = s.achievements;
        if (Array.isArray(s.operationsUsed)) mathBot.operationsUsed = new Set(s.operationsUsed);
        if (typeof s.muted === 'boolean') setMuted(s.muted);
        if (typeof s.reducedMotion === 'boolean') applyReducedMotion(s.reducedMotion);
        if (typeof s.activeTab === 'string') activeTabId = s.activeTab;
        if (typeof s.theme === 'string') applyThemePreset(s.theme);
        if (typeof s.cbSafe === 'boolean') setColorBlindSafe(s.cbSafe);
    } catch (e) {
        console.warn('Failed to load saved state, resetting…');
        localStorage.removeItem(STORAGE_KEY);
    }
}

function applyDifficultyTheme() {
    document.documentElement.style.setProperty('--difficulty-color',
        `hsl(${120 - (mathBot.difficulty - 1) * 30}, 70%, 45%)`);
}

function setMuted(flag) {
    isMuted = !!flag;
    try {
        Object.values(sounds).forEach(a => { a.muted = isMuted; });
    } catch (_) { }
    if (elements.muteToggle) {
        elements.muteToggle.textContent = isMuted ? '🔇 Unmute' : '🔈 Mute';
        elements.muteToggle.setAttribute('aria-pressed', isMuted ? 'true' : 'false');
    }
    if (elements.audioWarning) elements.audioWarning.hidden = true;
}

function applyReducedMotion(flag) {
    isReducedMotion = !!flag;
    document.body.classList.toggle('reduce-motion', isReducedMotion);
    if (elements.reduceMotion) {
        elements.reduceMotion.setAttribute('aria-pressed', isReducedMotion ? 'true' : 'false');
        elements.reduceMotion.textContent = isReducedMotion ? 'Motion: Reduced' : 'Reduce Motion';
    }
    if (isReducedMotion) {
        disableParallax();
    } else {
        enableParallax();
    }
}

function applyThemePreset(theme) {
    // Abyssal Interface is a singular, committed aesthetic.
    // Preserving function signature for state loading compatibility.
}

function setColorBlindSafe(flag) {
    cbSafe = !!flag;
    document.body.classList.toggle('cb-safe', cbSafe);
    if (elements.cbSafeToggle) {
        elements.cbSafeToggle.setAttribute('aria-pressed', cbSafe ? 'true' : 'false');
        elements.cbSafeToggle.textContent = cbSafe ? 'Color‑blind: On' : 'Color‑blind: Off';
    }
}

function updateSessionAccuracy() {
    if (!elements.accuracyRate) return;
    if (!sessionStats.attempts) {
        elements.accuracyRate.textContent = '0%';
        return;
    }
    const accuracy = Math.round((sessionStats.correct / sessionStats.attempts) * 100);
    elements.accuracyRate.textContent = `${accuracy}%`;
}

function getOperationLabel(operation) {
    if (operation === '+') return 'Addition';
    if (operation === '-') return 'Subtraction';
    if (operation === '*') return 'Multiplication';
    if (operation === '/') return 'Division';
    return 'Math Skill';
}

function getCoachHint(problem) {
    const { num1, num2, operation } = problem;
    if (operation === '+') {
        return `Break apart numbers: ${num1} + ${num2} = (${num1} + ${Math.floor(num2 / 2)}) + ${Math.ceil(num2 / 2)}.`;
    }
    if (operation === '-') {
        return `Count backward: start at ${num1}, move back ${num2} steps.`;
    }
    if (operation === '*') {
        return `Think repeated addition: ${num1} × ${num2} means ${num1} groups of ${num2}.`;
    }
    if (operation === '/') {
        return `Think equal groups: ${num1} ÷ ${num2} asks how many groups of ${num2} fit into ${num1}.`;
    }
    return 'Use a step-by-step strategy and check each operation carefully.';
}

function updateCoach(problem, feedbackText) {
    if (elements.coachOperation) {
        elements.coachOperation.textContent = getOperationLabel(problem.operation);
    }
    if (elements.coachPrompt) {
        elements.coachPrompt.textContent = `Solve: ${problem.num1} ${problem.operation} ${problem.num2} = ?`;
    }
    if (elements.coachFeedback) {
        elements.coachFeedback.textContent = feedbackText || 'Tip: Solve mentally first, then confirm with your final answer.';
    }
}

function resetGameState() {
    const confirmed = window.confirm('Reset all progress (score, level, streak, difficulty)? This cannot be undone.');
    if (!confirmed) return;
    // Preserve mute preference
    const preservedMute = isMuted;
    const preservedReduceMotion = isReducedMotion;
    // Reset engine state
    mathBot.difficulty = 1;
    mathBot.score = 0;
    mathBot.streak = 0;
    mathBot.level = 1;
    mathBot.pointsToNextLevel = 100;
    mathBot.achievements = { streakMaster: false, quickSolver: false, diverseMaster: false };
    mathBot.operationsUsed = new Set();
    mathBot.lastAnswerTime = Date.now();
    mathBot.noHintStreak = 0;
    sessionStats.attempts = 0;
    sessionStats.correct = 0;
    sessionStats.bestStreak = 0;
    sessionStats.hintUsed = false;
    sessionStats.speedSolved = 0;
    sessionStats.opStats = { '+': { attempts: 0, correct: 0 }, '-': { attempts: 0, correct: 0 }, '*': { attempts: 0, correct: 0 }, '/': { attempts: 0, correct: 0 } };
    extendedAchievements.centurion = false;
    extendedAchievements.perfectRound = false;
    extendedAchievements.speedDemon = false;
    updateSessionAccuracy();
    updateMastery();
    updateCombo(0);
    // Reset UI
    elements.difficultySlider.value = 1;
    elements.difficultyValue.textContent = 1;
    applyDifficultyTheme();
    elements.result.textContent = 'Progress reset.';
    elements.result.className = '';
    // Stop any mode session and revert to classic
    clearModeTimer();
    clearPendingNext();
    currentMode = 'classic';
    modeSession.active = false;
    modeSession.timeLeft = 60;
    modeSession.lives = 3;
    updateModeUI();
    setInputsEnabled(true);
    // Persist
    setMuted(preservedMute);
    applyReducedMotion(preservedReduceMotion);
    saveState();
    // Refresh view
    updateProgress();
    awaitingNext = false;
    displayProblem();
}

// --- Modes: state and helpers ---
let currentMode = 'classic'; // classic | speed | puzzle | story
const modeSession = { active: false, timeLeft: 60, lives: 3, timerHandle: null };
// Pending next-problem timers
let pendingNextTimeout = null;
let pendingNextInterval = null;
let awaitingNext = false; // true between answer submission and next problem

function setInputsEnabled(enabled) {
    elements.answer.disabled = !enabled;
    elements.submit.disabled = !enabled;
}

function updateModeUI() {
    if (elements.currentModeLabel) {
        const label =
            currentMode === 'speed' ? 'Mode: Speed' :
                currentMode === 'puzzle' ? 'Mode: Puzzle' :
                    currentMode === 'story' ? 'Mode: Story' : 'Mode: Classic';
        elements.currentModeLabel.textContent = label;
        elements.currentModeLabel.title = label;
    }
    // Update ARIA pressed for mode buttons
    if (elements.speedModeBtn) elements.speedModeBtn.setAttribute('aria-pressed', currentMode === 'speed' ? 'true' : 'false');
    if (elements.puzzleModeBtn) elements.puzzleModeBtn.setAttribute('aria-pressed', currentMode === 'puzzle' ? 'true' : 'false');
    if (elements.storyModeBtn) elements.storyModeBtn.setAttribute('aria-pressed', currentMode === 'story' ? 'true' : 'false');
    if (elements.modeTimer) {
        elements.modeTimer.style.display = (currentMode === 'speed' && modeSession.active) ? 'inline' : 'none';
        if (elements.timerValue) elements.timerValue.textContent = modeSession.timeLeft;
    }
    if (elements.modeLives) {
        elements.modeLives.style.display = (currentMode === 'puzzle' && modeSession.active) ? 'inline' : 'none';
        if (elements.livesValue) elements.livesValue.textContent = modeSession.lives;
    }
}

function clearModeTimer() {
    if (modeSession.timerHandle) {
        clearInterval(modeSession.timerHandle);
        modeSession.timerHandle = null;
    }
}

function endModeSession(reason) {
    clearModeTimer();
    clearPendingNext();
    const prevMode = currentMode;
    modeSession.active = false;
    if (prevMode === 'speed' && reason === 'time_up') {
        elements.result.textContent = '⏱️ Time\'s up! Speed mode ended.';
        elements.result.className = 'incorrect';
    } else if (prevMode === 'puzzle' && reason === 'out_of_lives') {
        elements.result.textContent = '💔 No lives left. Puzzle mode ended.';
        elements.result.className = 'incorrect';
    }
    // Revert to classic after session ends
    currentMode = 'classic';
    updateModeUI();
    setInputsEnabled(true);
}

function startSpeedMode() {
    clearModeTimer();
    clearPendingNext();
    currentMode = 'speed';
    modeSession.active = true;
    modeSession.timeLeft = 60;
    setInputsEnabled(true);
    updateModeUI();
    displayProblem();
    modeSession.timerHandle = setInterval(() => {
        modeSession.timeLeft = Math.max(0, modeSession.timeLeft - 1);
        updateModeUI();
        if (modeSession.timeLeft <= 0) {
            endModeSession('time_up');
        }
    }, 1000);
}

function startPuzzleMode() {
    clearModeTimer();
    clearPendingNext();
    currentMode = 'puzzle';
    modeSession.active = true;
    modeSession.lives = 3;
    setInputsEnabled(true);
    updateModeUI();
    displayProblem();
}

function startStoryMode() {
    clearModeTimer();
    clearPendingNext();
    currentMode = 'story';
    modeSession.active = false; // Story behaves like classic for now
    setInputsEnabled(true);
    updateModeUI();
    displayProblem();
}

function displayProblem() {
    // Ensure any pending UI/timers for previous question are cleared
    clearPendingNext();
    awaitingNext = false;
    currentProblem = mathBot.generateProblem();
    sessionStats.hintUsed = false;

    elements.num1.textContent = currentProblem.num1;
    elements.operation.textContent = currentProblem.operation;
    elements.num2.textContent = currentProblem.num2;
    elements.answer.value = '';
    elements.result.textContent = '';
    elements.result.className = 'result-msg';
    hideStepSolution();
    hideFunFact();
    updateCoach(currentProblem, 'Tip: Solve mentally first, then confirm with your final answer.');
    animateEquation();
    setInputsEnabled(true);
    // Only focus the answer if Play tab is active/visible
    const playPanel = document.getElementById('panel-play');
    if (playPanel && !playPanel.hasAttribute('hidden')) {
        elements.answer.focus();
    }
}

function clearPendingNext() {
    if (pendingNextTimeout) {
        clearTimeout(pendingNextTimeout);
        pendingNextTimeout = null;
    }
    if (pendingNextInterval) {
        clearInterval(pendingNextInterval);
        pendingNextInterval = null;
    }
    if (elements.postAnswerControls) {
        elements.postAnswerControls.style.display = 'none';
    }
}

function performNextNow() {
    // Cancel any queued timers/UI and load next problem respecting mode state
    clearPendingNext();
    if (currentMode === 'speed' && !modeSession.active) return;
    if (currentMode === 'puzzle' && !modeSession.active) return;
    displayProblem();
}

function scheduleNextProblem(additionalDelayMs = 0) {
    clearPendingNext();
    const baseDelay = (currentMode === 'speed') ? 800 : 2000;
    const delay = baseDelay + (additionalDelayMs || 0);

    // Show countdown/skip UI if delay is at least 1s
    if (elements.postAnswerControls && elements.nextCountdown) {
        if (delay >= 1000) {
            elements.postAnswerControls.style.display = 'block';
            const endAt = Date.now() + delay;
            // Initialize immediately
            const updateCountdown = () => {
                const remainingMs = Math.max(0, endAt - Date.now());
                const remainingSec = Math.ceil(remainingMs / 1000);
                elements.nextCountdown.textContent = remainingSec;
            };
            updateCountdown();
            pendingNextInterval = setInterval(updateCountdown, 250);
        } else {
            elements.postAnswerControls.style.display = 'none';
        }
    }

    pendingNextTimeout = setTimeout(() => {
        performNextNow();
    }, delay);
}

function computeCorrectAnswer(problem) {
    const { num1, num2, operation } = problem;
    switch (operation) {
        case '+': return num1 + num2;
        case '-': return num1 - num2;
        case '*': return num1 * num2;
        case '/': return num1 / num2;
        default: return NaN;
    }
}

function updateProgress() {
    const progress = mathBot.getProgress();
    elements.progressFill.style.width = `${progress.progress}%`;
    elements.score.textContent = progress.score;
    elements.currentLevel.textContent = progress.level;
    elements.currentStreak.textContent = progress.streak;
    elements.pointsNeeded.textContent = Math.max(0, progress.nextLevel - progress.score);
    // Extended stats
    if (elements.totalSolved) elements.totalSolved.textContent = sessionStats.attempts;
    if (elements.bestStreak) elements.bestStreak.textContent = sessionStats.bestStreak;
    // Mirror progress to HUD bar if present
    if (elements.hudProgressFill) {
        const pct = Math.max(0, Math.min(100, progress.progress));
        elements.hudProgressFill.style.width = `${pct}%`;
        if (elements.hudProgressBar) {
            elements.hudProgressBar.setAttribute('aria-valuenow', String(Math.round(pct)));
            elements.hudProgressBar.setAttribute('aria-valuetext', `${Math.round(pct)}% toward next level`);
        }
    }
}

function showAchievement(achievementName) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.textContent = achievementMessages[achievementName];
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
        playSound('levelUp');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500);
    }, 3000);

    // Reflect unlock state in Achievements panel
    refreshAchievementsUI();
}

// Extended achievement system
const extendedAchievements = {
    centurion: false,
    perfectRound: false,
    speedDemon: false
};

function checkExtendedAchievements() {
    let newUnlock = null;
    if (!extendedAchievements.centurion && mathBot.score >= 1000) {
        extendedAchievements.centurion = true;
        newUnlock = 'centurion';
    }
    if (!extendedAchievements.perfectRound && (mathBot.noHintStreak || 0) >= 5) {
        extendedAchievements.perfectRound = true;
        if (!newUnlock) newUnlock = 'perfectRound';
    }
    if (!extendedAchievements.speedDemon && sessionStats.speedSolved >= 10) {
        extendedAchievements.speedDemon = true;
        if (!newUnlock) newUnlock = 'speedDemon';
    }
    if (newUnlock) {
        showAchievement(newUnlock);
    }
    refreshAchievementsUI();
}

function checkAnswer() {
    // Prevent double submits while waiting for next problem
    if (awaitingNext) return;
    const userAnswer = parseFloat(elements.answer.value);
    if (isNaN(userAnswer)) {
        elements.result.textContent = "Please enter a valid number!";
        elements.result.className = 'result-msg incorrect';
        return;
    }

    const result = mathBot.checkAnswer(currentProblem, userAnswer);
    sessionStats.attempts += 1;
    const op = currentProblem.operation;
    if (sessionStats.opStats[op]) sessionStats.opStats[op].attempts += 1;
    hideStepSolution();
    hideFunFact();

    if (result.correct) {
        sessionStats.correct += 1;
        if (sessionStats.opStats[op]) sessionStats.opStats[op].correct += 1;
        if (mathBot.streak > sessionStats.bestStreak) sessionStats.bestStreak = mathBot.streak;
        if (!sessionStats.hintUsed) {
            mathBot.noHintStreak = (mathBot.noHintStreak || 0) + 1;
        } else {
            mathBot.noHintStreak = 0;
        }
        if (currentMode === 'speed') sessionStats.speedSolved += 1;

        // Default success message
        let successMsg = `Correct! +${result.points} points`;
        // Story mode: show explanation to reinforce learning
        if (currentMode === 'story') {
            const ca = computeCorrectAnswer(currentProblem);
            const expl = mathBot.explainProblem(currentProblem, ca);
            successMsg = `${successMsg} — ${expl}`;
        }
        elements.result.textContent = successMsg;
        elements.result.className = 'result-msg correct';
        updateCoach(currentProblem, 'Great job! Explain your strategy out loud to lock in the concept.');
        updateMascot(mascotBrain.getCorrect(mathBot.streak));
        updateCombo(mathBot.streak);
        playSound('correct');

        // Visual celebrations
        spawnParticles(mathBot.streak >= 5 ? 30 : 16);
        showPointsFloat(result.points);
        elements.answer.classList.add('input-glow');
        setTimeout(() => elements.answer.classList.remove('input-glow'), 700);

        // Show fun fact on every 3rd correct
        if (sessionStats.correct % 3 === 0) showFunFact();

        // Animate score increase
        elements.score.classList.add('level-up');
        setTimeout(() => elements.score.classList.remove('level-up'), 1000);

        if (result.achievement) {
            showAchievement(result.achievement);
        }

        // Check new achievements from extended system
        checkExtendedAchievements();

        // Check for level up
        if (result.level > parseInt(elements.currentLevel.textContent)) {
            elements.levelBadge.classList.add('level-up');
            setTimeout(() => elements.levelBadge.classList.remove('level-up'), 1000);
            spawnParticles(40);
            updateMascot(`LEVEL ${result.level}! You're evolving! 🌟`);
        }
    } else {
        const ca = computeCorrectAnswer(currentProblem);
        elements.result.textContent = result.explanation;
        elements.result.className = 'result-msg incorrect';
        updateCoach(currentProblem, `Try this strategy: ${getCoachHint(currentProblem)}`);
        updateMascot(mascotBrain.getIncorrect());
        updateCombo(0);
        mathBot.noHintStreak = 0;
        playSound('incorrect');

        // Visual feedback
        elements.answer.classList.add('input-shake');
        setTimeout(() => elements.answer.classList.remove('input-shake'), 500);

        // Show step-by-step solution
        showStepSolution(currentProblem, ca);

        // Puzzle mode: lose a life on incorrect answer
        if (currentMode === 'puzzle' && modeSession.active) {
            modeSession.lives = Math.max(0, modeSession.lives - 1);
            if (elements.livesValue) elements.livesValue.textContent = modeSession.lives;
            if (modeSession.lives <= 0) {
                updateModeUI();
                endModeSession('out_of_lives');
                updateProgress();
                updateMastery();
                saveState();
                return;
            }
        }
    }

    updateProgress();
    updateSessionAccuracy();
    updateMastery();
    saveState();
    // Lock inputs during the wait window to prevent double submits
    awaitingNext = true;
    setInputsEnabled(false);
    const extraDelay = (currentMode === 'story') ? 14000 : 0;
    scheduleNextProblem(extraDelay);
}

// Difficulty changes
elements.difficultySlider.addEventListener('input', (e) => {
    mathBot.difficulty = parseFloat(e.target.value);
    elements.difficultyValue.textContent = mathBot.difficulty;
    applyDifficultyTheme();
    saveState();
    displayProblem();
});

// Mode selection
if (elements.speedModeBtn) elements.speedModeBtn.addEventListener('click', startSpeedMode);
if (elements.puzzleModeBtn) elements.puzzleModeBtn.addEventListener('click', startPuzzleMode);
if (elements.storyModeBtn) elements.storyModeBtn.addEventListener('click', startStoryMode);

// Mute toggle
if (elements.muteToggle) {
    elements.muteToggle.addEventListener('click', () => {
        setMuted(!isMuted);
        saveState();
    });
}

// Reset progress
if (elements.resetProgress) {
    elements.resetProgress.addEventListener('click', resetGameState);
}

// Skip-next handler
if (elements.skipNext) {
    elements.skipNext.addEventListener('click', performNextNow);
}

if (elements.showHint) {
    elements.showHint.addEventListener('click', () => {
        if (!currentProblem) return;
        sessionStats.hintUsed = true;
        updateCoach(currentProblem, `Hint: ${getCoachHint(currentProblem)}`);
    });
}

// Reduce Motion toggle
if (elements.reduceMotion) {
    elements.reduceMotion.addEventListener('click', () => {
        applyReducedMotion(!isReducedMotion);
        saveState();
    });
}

// Theme preset radios - Removed in Abyssal Interface

// Color-blind palette toggle
if (elements.cbSafeToggle) {
    elements.cbSafeToggle.addEventListener('click', () => {
        setColorBlindSafe(!cbSafe);
        saveState();
    });
}

// Submission handlers
elements.submit.addEventListener('click', checkAnswer);

elements.answer.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAnswer();
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && awaitingNext) {
        performNextNow();
    }
});

// Start game and initialize progress
loadState();
elements.difficultySlider.value = mathBot.difficulty;
elements.difficultyValue.textContent = mathBot.difficulty;
applyDifficultyTheme();
// Ensure theme defaults applied if no saved state
applyThemePreset(currentTheme);
setColorBlindSafe(cbSafe);
updateModeUI();
setInputsEnabled(true);
// Initialize tabs before we potentially focus inputs
initTabs();
// Initialize mode keyboard navigation
initModeKeyboardNav();
// Enable parallax unless reduced motion
if (!isReducedMotion) enableParallax();
// Prime audio on first gesture
window.addEventListener('pointerdown', primeAudio, { once: true });
window.addEventListener('keydown', primeAudio, { once: true });
displayProblem();
updateProgress();
updateSessionAccuracy();
updateMastery();
updateMascot(mascotBrain.getGreeting());

// Add tooltip listeners
const tooltip = document.createElement('div');
tooltip.className = 'tooltip';
document.body.appendChild(tooltip);

Array.from(document.querySelectorAll('[data-tooltip]')).forEach(element => {
    element.addEventListener('mouseover', (e) => {
        tooltip.textContent = e.target.dataset.tooltip;
        tooltip.style.display = 'block';
        tooltip.style.left = e.pageX + 'px';
        tooltip.style.top = (e.pageY - 30) + 'px';
    });

    element.addEventListener('mouseout', () => {
        tooltip.style.display = 'none';
    });
});

// --- Tabs Controller and Achievements UI ---
function initTabs() {
    const tablist = document.getElementById('tabs');
    if (!tablist) return;

    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

    function activateTab(tab, setFocus = true) {
        const panelId = tab.getAttribute('aria-controls');
        activeTabId = panelId;
        tabs.forEach(t => {
            const isSelected = t === tab;
            t.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            t.setAttribute('tabindex', isSelected ? '0' : '-1');
        });
        panels.forEach(p => {
            if (p.id === panelId) {
                p.removeAttribute('hidden');
            } else {
                p.setAttribute('hidden', '');
            }
        });
        if (setFocus) tab.focus();
        saveState();
    }

    // Click to activate
    tabs.forEach(t => t.addEventListener('click', () => activateTab(t)));

    // Keyboard navigation
    tablist.addEventListener('keydown', (e) => {
        const currentIndex = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
        let newIndex = currentIndex;
        switch (e.key) {
            case 'ArrowRight':
                newIndex = (currentIndex + 1) % tabs.length;
                e.preventDefault();
                activateTab(tabs[newIndex]);
                break;
            case 'ArrowLeft':
                newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                e.preventDefault();
                activateTab(tabs[newIndex]);
                break;
            case 'Home':
                e.preventDefault();
                activateTab(tabs[0]);
                break;
            case 'End':
                e.preventDefault();
                activateTab(tabs[tabs.length - 1]);
                break;
            case 'Enter':
            case ' ': // Space
                // Already activated by arrows; ensure focus stays
                e.preventDefault();
                break;
        }
    });

    // Initialize selection from persisted state
    const initialTab = tabs.find(t => t.getAttribute('aria-controls') === activeTabId) || tabs[0];
    activateTab(initialTab, false);

    // Achievements UI initial paint
    refreshAchievementsUI();
}

function refreshAchievementsUI() {
    const coreAch = mathBot.achievements || {};
    const allAch = Object.assign({}, coreAch, extendedAchievements);
    document.querySelectorAll('.badge-card[data-achievement]').forEach(el => {
        const key = el.getAttribute('data-achievement');
        if (allAch[key]) {
            el.classList.add('unlocked');
        } else {
            el.classList.remove('unlocked');
        }
    });
}
