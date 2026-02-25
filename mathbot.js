class MathBot {
    constructor() {
        this.difficulty = 1;
        this.score = 0;
        this.streak = 0;
        this.level = 1;
        this.pointsToNextLevel = 100;
        this.operations = ['+', '-', '*', '/'];
        this.achievements = {
            streakMaster: false,
            quickSolver: false,
            diverseMaster: false
        };
        this.operationsUsed = new Set();
        this.lastAnswerTime = Date.now();
        this.noHintStreak = 0;
    }

    generateProblem() {
        // Weighted operation selection based on difficulty
        let availableOperations = this.difficulty < 2 ? ['+', '-'] :
            this.difficulty < 3 ? ['+', '-', '*'] : this.operations;
        
        const operation = availableOperations[Math.floor(Math.random() * availableOperations.length)];
        this.operationsUsed.add(operation);
        
        let num1, num2;
        const baseRange = this.level * 5; // Base range increases with level
        
        switch(operation) {
            case '/':
                num2 = Math.floor(Math.random() * (3 * this.difficulty)) + 1;
                const quotient = Math.floor(Math.random() * baseRange) + 1;
                num1 = num2 * quotient;
                break;
            case '*':
                num1 = Math.floor(Math.random() * (baseRange / 2)) + 1;
                num2 = Math.floor(Math.random() * (baseRange / 2)) + 1;
                break;
            default: // '+' or '-'
                num1 = Math.floor(Math.random() * baseRange) + 1;
                num2 = Math.floor(Math.random() * baseRange) + 1;
                if (operation === '-' && num2 > num1) {
                    [num1, num2] = [num2, num1]; // Ensure positive result
                }
        }
        
        this.lastAnswerTime = Date.now();
        return { num1, num2, operation };
    }

    checkAnswer(problem, userAnswer) {
        const { num1, num2, operation } = problem;
        let correctAnswer;
        
        switch(operation) {
            case '+': correctAnswer = num1 + num2; break;
            case '-': correctAnswer = num1 - num2; break;
            case '*': correctAnswer = num1 * num2; break;
            case '/': correctAnswer = num1 / num2; break;
        }

        const timeTaken = (Date.now() - this.lastAnswerTime) / 1000; // Time in seconds
        const isCorrect = Math.abs(userAnswer - correctAnswer) < 0.001; // Allow small floating point differences

        if (isCorrect) {
            // Calculate points based on difficulty, time taken, and streak
            let points = this.calculatePoints(timeTaken);
            this.score += points;
            this.streak++;
            
            // Check for level up
            if (this.score >= this.pointsToNextLevel) {
                this.levelUp();
            }

            // Check achievements
            this.checkAchievements(timeTaken);

            // Adjust difficulty based on performance
            this.adjustDifficulty();

            return {
                correct: true,
                points,
                streak: this.streak,
                level: this.level,
                achievement: this.getNewAchievement()
            };
        } else {
            this.streak = 0;
            return {
                correct: false,
                points: 0,
                streak: 0,
                explanation: this.explainProblem(problem, correctAnswer)
            };
        }
    }

    calculatePoints(timeTaken) {
        // Base points based on difficulty
        let points = this.difficulty * 10;
        
        // Time bonus: faster answers get more points
        const timeBonus = Math.max(0, 50 - Math.floor(timeTaken * 10));
        
        // Streak bonus
        const streakBonus = Math.floor(this.streak / 5) * 10;
        
        return points + timeBonus + streakBonus;
    }

    levelUp() {
        this.level++;
        this.pointsToNextLevel = Math.floor(this.pointsToNextLevel * 1.5);
        return {
            newLevel: this.level,
            nextTarget: this.pointsToNextLevel
        };
    }

    adjustDifficulty() {
        // Increase difficulty based on streak and current level
        if (this.streak >= 5 && this.difficulty < 5) {
            this.difficulty = Math.min(5, this.difficulty + 0.5);
        }
    }

    checkAchievements(timeTaken) {
        // Streak achievement
        if (this.streak >= 10 && !this.achievements.streakMaster) {
            this.achievements.streakMaster = true;
        }
        
        // Quick solver achievement
        if (timeTaken < 3 && !this.achievements.quickSolver) {
            this.achievements.quickSolver = true;
        }
        
        // Diverse operations achievement
        if (this.operationsUsed.size === 4 && !this.achievements.diverseMaster) {
            this.achievements.diverseMaster = true;
        }
    }

    getNewAchievement() {
        for (const [name, achieved] of Object.entries(this.achievements)) {
            if (achieved) {
                delete this.achievements[name]; // Remove it so it's only announced once
                return name;
            }
        }
        return null;
    }
    
    explainProblem(problem, correctAnswer) {
        const { num1, num2, operation } = problem;
        const scenarios = {
            '+': [
                `Imagine collecting ${num1} gems and finding ${num2} more. You'd have ${correctAnswer} gems!`,
                `If you climb ${num1} steps and then ${num2} more, you're at step ${correctAnswer}!`
            ],
            '-': [
                `Picture having ${num1} coins and spending ${num2}. You'd have ${correctAnswer} left!`,
                `If you're ${num1} meters up and go down ${num2} meters, you'll be at ${correctAnswer} meters.`
            ],
            '*': [
                `Think of ${num1} rows of ${num2} stars. You'd see ${correctAnswer} stars in total!`,
                `If each tree has ${num2} branches, ${num1} trees would have ${correctAnswer} branches!`
            ],
            '/': [
                `Sharing ${num1} cookies among ${num2} friends means each gets ${correctAnswer}!`,
                `Organizing ${num1} marbles into ${num2} equal groups gives ${correctAnswer} per group!`
            ]
        };

        // Pick a random scenario for variety
        const explanations = scenarios[operation];
        return explanations[Math.floor(Math.random() * explanations.length)];
    }

    getProgress() {
        return {
            score: this.score,
            level: this.level,
            streak: this.streak,
            nextLevel: this.pointsToNextLevel,
            progress: (this.score / this.pointsToNextLevel) * 100
        };
    }
    getStats() {
        return {
            totalScore: this.score,
            currentLevel: this.level,
            currentStreak: this.streak,
            operationsMastered: this.operationsUsed.size,
            achievements: Object.entries(this.achievements)
                .filter(([_, achieved]) => achieved)
                .map(([name, _]) => name)
        };
    }
}

// Expose globally for browser usage
window.MathBot = MathBot;
