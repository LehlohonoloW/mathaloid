const mathBot = new MathBot();
let currentProblem = null;

const elements = {
    num1: document.getElementById('num1'),
    num2: document.getElementById('num2'),
    operation: document.getElementById('operation'),
    answer: document.getElementById('answer'),
    submit: document.getElementById('submit'),
    score: document.getElementById('score'),
    result: document.getElementById('result'),
    difficultySlider: document.getElementById('difficulty-slider'),
    difficultyValue: document.getElementById('difficulty-value'),
    currentLevel: document.getElementById('current-level'),
    currentStreak: document.getElementById('current-streak'),
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
    // Theme controls
    themeDefault: document.getElementById('theme-default'),
    themeHolo: document.getElementById('theme-holo'),
    themeSolar: document.getElementById('theme-solar'),
    themeCockpit: document.getElementById('theme-cockpit'),
    cbSafeToggle: document.getElementById('cb-safe-toggle'),
    // Mode group container
    modeGroup: document.getElementById('game-mode'),
    // Notices
    audioWarning: document.getElementById('audio-warning')
};

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
    try { a.currentTime = 0; } catch (_) {}
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
        try { a.pause(); a.currentTime = 0; } catch (_) {}
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
    diverseMaster: "🎯 Operation Master: Mastered all operations!"
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
    } catch (_) {}
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
    const allowed = new Set(['default', 'holo', 'solar', 'cockpit']);
    currentTheme = allowed.has(theme) ? theme : 'default';
    document.body.classList.remove('theme-holo', 'theme-solar', 'theme-cockpit');
    if (currentTheme === 'holo') document.body.classList.add('theme-holo');
    if (currentTheme === 'solar') document.body.classList.add('theme-solar');
    if (currentTheme === 'cockpit') document.body.classList.add('theme-cockpit');
    // Reflect radio state
    if (elements.themeDefault) elements.themeDefault.checked = currentTheme === 'default';
    if (elements.themeHolo) elements.themeHolo.checked = currentTheme === 'holo';
    if (elements.themeSolar) elements.themeSolar.checked = currentTheme === 'solar';
    if (elements.themeCockpit) elements.themeCockpit.checked = currentTheme === 'cockpit';
}

function setColorBlindSafe(flag) {
    cbSafe = !!flag;
    document.body.classList.toggle('cb-safe', cbSafe);
    if (elements.cbSafeToggle) {
        elements.cbSafeToggle.setAttribute('aria-pressed', cbSafe ? 'true' : 'false');
        elements.cbSafeToggle.textContent = cbSafe ? 'Color‑blind: On' : 'Color‑blind: Off';
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
    
    // Animate problem display
    const problemContainer = document.querySelector('.problem-container');
    if (problemContainer) {
        problemContainer.style.animation = 'none';
        // Trigger reflow
        void problemContainer.offsetHeight;
        problemContainer.style.animation = 'fadeIn 0.5s ease-out';
    }
    
    elements.num1.textContent = currentProblem.num1;
    elements.operation.textContent = currentProblem.operation;
    elements.num2.textContent = currentProblem.num2;
    elements.answer.value = '';
    elements.result.textContent = '';
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
    elements.score.textContent = `Score: ${progress.score}`;
    elements.currentLevel.textContent = progress.level;
    elements.currentStreak.textContent = progress.streak;
    elements.pointsNeeded.textContent = progress.nextLevel - progress.score;
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

function checkAnswer() {
    // Prevent double submits while waiting for next problem
    if (awaitingNext) return;
    const userAnswer = parseFloat(elements.answer.value);
    if (isNaN(userAnswer)) {
        elements.result.textContent = "Please enter a valid number!";
        elements.result.className = 'incorrect';
        return;
    }

    const result = mathBot.checkAnswer(currentProblem, userAnswer);
    
    if (result.correct) {
        // Default success message
        let successMsg = `Correct! +${result.points} points`;
        // Story mode: show explanation to reinforce learning
        if (currentMode === 'story') {
            const ca = computeCorrectAnswer(currentProblem);
            const expl = mathBot.explainProblem(currentProblem, ca);
            successMsg = `${successMsg} — ${expl}`;
        }
        elements.result.textContent = successMsg;
        elements.result.className = 'correct';
        playSound('correct');
        
        // Animate score increase
        elements.score.classList.add('level-up');
        setTimeout(() => elements.score.classList.remove('level-up'), 1000);
        
        if (result.achievement) {
            showAchievement(result.achievement);
        }
        
        // Check for level up
        if (result.level > parseInt(elements.currentLevel.textContent)) {
            elements.levelBadge.classList.add('level-up');
            setTimeout(() => elements.levelBadge.classList.remove('level-up'), 1000);
        }
    } else {
        elements.result.textContent = result.explanation;
        elements.result.className = 'incorrect';
        playSound('incorrect');
        // Puzzle mode: lose a life on incorrect answer
        if (currentMode === 'puzzle' && modeSession.active) {
            modeSession.lives = Math.max(0, modeSession.lives - 1);
            if (elements.livesValue) elements.livesValue.textContent = modeSession.lives;
            if (modeSession.lives <= 0) {
                updateModeUI();
                endModeSession('out_of_lives');
                updateProgress();
                saveState();
                return;
            }
        }
    }
    
    updateProgress();
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

// Reduce Motion toggle
if (elements.reduceMotion) {
    elements.reduceMotion.addEventListener('click', () => {
        applyReducedMotion(!isReducedMotion);
        saveState();
    });
}

// Theme preset radios
Array.from(document.querySelectorAll('input[name="theme"]')).forEach(r => {
    r.addEventListener('change', (e) => {
        applyThemePreset(e.target.value);
        saveState();
    });
});

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
    const ach = mathBot.achievements || {};
    document.querySelectorAll('.badge[data-achievement]').forEach(el => {
        const key = el.getAttribute('data-achievement');
        if (ach[key]) {
            el.classList.add('unlocked');
        } else {
            el.classList.remove('unlocked');
        }
    });
}
