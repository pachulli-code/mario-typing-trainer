// MAIN GAMEPLAY SCREEN — core typing game loop
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT, WORLDS, SCREENS, MAX_LIVES, COINS_PER_LIFE, LEVEL_TIME, WORDS_PER_LEVEL, STAR_THRESHOLDS } from '../config.js';
import { drawTextOutlined } from '../renderer.js';
import { getState, setState, resetLevelState } from '../state.js';
import { setKeyCallback, clearKeyCallback } from '../input.js';
import { drawBackground } from '../backgrounds.js';
import { Mario } from '../game/mario.js';
import { Cappy } from '../game/cappy.js';
import { CoinManager } from '../game/coin.js';
import { QuestionBlock } from '../game/questionBlock.js';
import { Obstacle } from '../game/obstacle.js';
import { HUD } from '../game/hud.js';
import { ParticleSystem } from '../animation.js';
import { playCoinSound, playErrorSound, playCappySound, playJumpSound } from '../audio.js';
import { wordsRu } from '../data/wordsRu.js';
import { wordsEn } from '../data/wordsEn.js';

let mario, cappy, coinManager, questionBlock, obstacle, hud, particles;
let wordList = [];
let currentWordIndex = 0;
let timeLeft = LEVEL_TIME;
let cameraX = 0;
let gameTime = 0;
let worldIndex = 0;
let isGameActive = false;
let countdownTimer = 0;

export function enter() {
    worldIndex = getState().currentWorld;
    resetLevelState();

    mario = new Mario();
    cappy = new Cappy();
    coinManager = new CoinManager();
    questionBlock = new QuestionBlock();
    obstacle = new Obstacle();
    hud = new HUD();
    particles = new ParticleSystem();

    // Load words for this level
    const world = WORLDS[worldIndex];
    const lang = getState().lang;
    const wordSource = lang === 'ru' ? wordsRu : wordsEn;

    // Get appropriate difficulty words
    const difficultyMap = {
        letters: 'letters',
        shortWords: 'shortWords',
        longWords: 'longWords',
        phrases: 'phrases',
        sentences: 'sentences'
    };

    const pool = wordSource[difficultyMap[world.difficulty]] || wordSource.letters;
    wordList = shuffle([...pool]).slice(0, WORDS_PER_LEVEL);

    currentWordIndex = 0;
    timeLeft = LEVEL_TIME;
    gameTime = 0;
    cameraX = 0;
    isGameActive = false;
    countdownTimer = 3;

    setState({
        wordsTotal: wordList.length,
        wordsCompleted: 0,
        startTime: Date.now()
    });

    questionBlock.setWord(wordList[0]);

    setKeyCallback(handleKey);
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function handleKey(key) {
    if (!isGameActive) return;

    const state = getState();
    if (state.lives <= 0) return;

    const expectedChar = questionBlock.getCurrentChar();
    if (!expectedChar) return;

    const totalChars = state.totalChars + 1;

    if (key === expectedChar || key.toLowerCase() === expectedChar.toLowerCase()) {
        // CORRECT
        const correctChars = state.correctChars + 1;
        const streak = state.streak + 1;
        const bestStreak = Math.max(streak, state.bestStreak);

        // Calculate coins: 1 per char, bonus for streak
        let coinsEarned = 1;
        if (streak > 0 && streak % 10 === 0) coinsEarned += 5;
        const coins = state.coins + coinsEarned;

        // Life recovery: every COINS_PER_LIFE coins = +1 life
        let lives = state.lives;
        if (coins >= COINS_PER_LIFE && Math.floor((coins - coinsEarned) / COINS_PER_LIFE) < Math.floor(coins / COINS_PER_LIFE)) {
            lives = Math.min(MAX_LIVES, lives + 1);
        }

        setState({ correctChars, totalChars, streak, bestStreak, coins, lives });

        // Play coin sound and effects
        playCoinSound();

        // Cappy throw to block
        playCappySound();
        cappy.throw(
            mario.x + 20, mario.y + 5,
            questionBlock.x, questionBlock.y,
            () => {
                coinManager.spawn(questionBlock.x, questionBlock.y - 20);
                particles.emit(questionBlock.x, questionBlock.y - 20, 5, {
                    speed: 80, life: 0.5, size: 2,
                    colors: ['#ffdd00', '#ffaa00', '#ffee66'],
                    gravity: 100
                });
            }
        );

        mario.triggerRun();

        // Check if word complete
        const wordDone = questionBlock.typeChar();
        hud.showCombo(streak);

        if (wordDone) {
            currentWordIndex++;
            const wordsCompleted = currentWordIndex;
            setState({ wordsCompleted });

            if (currentWordIndex >= wordList.length) {
                // LEVEL COMPLETE
                finishLevel();
                return;
            }

            // Next word
            questionBlock.setWord(wordList[currentWordIndex]);
            mario.triggerJump();
            playJumpSound();

            // Scroll camera slightly
            cameraX += 20;
        }

        updateStats();

    } else {
        // WRONG
        const streak = 0;
        const lives = state.lives - 1;
        setState({ totalChars, streak, lives });

        playErrorSound();

        // Screen shake
        setState({ shakeAmount: 6 });

        // Goomba appears
        obstacle.spawnGoomba(mario.x, mario.y);
        mario.triggerHit();

        // Error particles
        particles.emit(mario.x + 16, mario.y + 10, 8, {
            speed: 60, life: 0.4, size: 3,
            colors: ['#ff0000', '#ff4444', '#ff8888'],
            gravity: 80
        });

        if (lives <= 0) {
            // GAME OVER
            setTimeout(() => {
                clearKeyCallback();
                setState({ screen: SCREENS.GAME_OVER });
            }, 1000);
        }

        updateStats();
    }
}

function updateStats() {
    const state = getState();
    const elapsedMinutes = (Date.now() - state.startTime) / 60000;
    const wpm = elapsedMinutes > 0 ? Math.round((state.correctChars / 5) / elapsedMinutes) : 0;
    const accuracy = state.totalChars > 0 ? Math.round((state.correctChars / state.totalChars) * 100) : 100;
    setState({ wpm, accuracy });
}

function finishLevel() {
    const state = getState();
    const accuracy = state.accuracy;
    let stars = 0;
    if (accuracy >= STAR_THRESHOLDS[0]) stars = 1;
    if (accuracy >= STAR_THRESHOLDS[1]) stars = 2;
    if (accuracy >= STAR_THRESHOLDS[2]) stars = 3;

    setState({ stars });
    mario.triggerCelebrate();

    setTimeout(() => {
        clearKeyCallback();
        setState({ screen: SCREENS.LEVEL_COMPLETE });
    }, 1500);
}

export function update(dt) {
    gameTime += dt;

    // Countdown
    if (countdownTimer > 0) {
        countdownTimer -= dt;
        if (countdownTimer <= 0) {
            isGameActive = true;
            setState({ startTime: Date.now() });
        }
        return;
    }

    if (!isGameActive) return;

    // Timer
    timeLeft -= dt;
    if (timeLeft <= 0) {
        timeLeft = 0;
        clearKeyCallback();
        setState({ screen: SCREENS.GAME_OVER });
        return;
    }

    // Update all entities
    mario.update(dt);
    cappy.update(dt);
    coinManager.update(dt);
    questionBlock.update(dt);
    obstacle.update(dt);
    hud.update(dt);
    particles.update(dt);

    // Decay screen shake
    const shake = getState().shakeAmount;
    if (shake > 0) {
        setState({ shakeAmount: Math.max(0, shake - dt * 20) });
    }
}

export function draw(ctx) {
    const state = getState();

    // Apply screen shake
    ctx.save();
    if (state.shakeAmount > 0) {
        const sx = (Math.random() - 0.5) * state.shakeAmount * 2;
        const sy = (Math.random() - 0.5) * state.shakeAmount * 2;
        ctx.translate(sx, sy);
    }

    // Background (parallax)
    drawBackground(ctx, worldIndex, cameraX, gameTime);

    // Game entities
    obstacle.draw(ctx);
    questionBlock.draw(ctx);
    coinManager.draw(ctx);
    cappy.draw(ctx);
    mario.draw(ctx);
    particles.draw(ctx);

    ctx.restore();

    // HUD (not affected by shake)
    hud.draw(ctx, timeLeft);

    // Countdown overlay
    if (countdownTimer > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

        const num = Math.ceil(countdownTimer);
        const scale = 1 + (countdownTimer - Math.floor(countdownTimer)) * 0.5;
        drawTextOutlined(
            num > 0 ? num.toString() : 'GO!',
            VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 30,
            Math.round(60 * scale),
            '#ffdd00', '#000', 'center'
        );

        // World name
        const world = WORLDS[worldIndex];
        const lang = state.lang;
        const name = lang === 'ru' ? world.name : world.nameEn;
        drawTextOutlined(name, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 40, 20, world.accentColor, '#000', 'center');
    }
}

export function exit() {
    clearKeyCallback();
}
